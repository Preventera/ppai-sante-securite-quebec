import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { getBackendMode } from '@/lib/backend'
import { clearOrganizationCache } from '@/lib/organization'

/**
 * Session utilisateur et rattachement à une organisation.
 *
 * En mode démonstration, aucune authentification n'est requise : les données
 * sont locales au navigateur et ne quittent jamais la machine. En mode live,
 * chaque requête est cloisonnée par les politiques RLS, qui s'appuient sur
 * l'organisation du profil.
 */

export interface Profile {
  id: string
  organization_id: string
  full_name: string | null
  role: string
}

export interface Organization {
  id: string
  name: string
  sector: string
}

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  organization: Organization | null
  /** Vrai tant que la session initiale n'est pas résolue. */
  loading: boolean
  /** Vrai lorsque l'application tourne sans backend : aucun compte nécessaire. */
  demoMode: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (params: SignUpParams) => Promise<{ needsConfirmation: boolean }>
  signOut: () => Promise<void>
}

export interface SignUpParams {
  email: string
  password: string
  organizationName: string
  fullName?: string
  sector?: string
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [demoMode, setDemoMode] = useState(false)

  // Charge le profil et l'organisation de l'utilisateur connecté.
  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, organization_id, full_name, role, organizations(id, name, sector)')
      .eq('id', userId)
      .maybeSingle()

    if (error || !data) {
      // Le profil est créé par un déclencheur à l'inscription ; son absence
      // signale une base dont les migrations ne sont pas à jour.
      console.warn('[PPAI] Profil introuvable pour cet utilisateur:', error?.message)
      setProfile(null)
      setOrganization(null)
      return
    }

    const { organizations, ...rest } = data as typeof data & {
      organizations: Organization | Organization[] | null
    }

    setProfile(rest as Profile)
    setOrganization(Array.isArray(organizations) ? organizations[0] ?? null : organizations)
  }

  useEffect(() => {
    let active = true

    const bootstrap = async () => {
      const mode = await getBackendMode()
      if (!active) return

      if (mode === 'demo') {
        setDemoMode(true)
        setLoading(false)
        return
      }

      const { data } = await supabase.auth.getSession()
      if (!active) return

      setSession(data.session)
      if (data.session?.user) await loadProfile(data.session.user.id)
      if (active) setLoading(false)
    }

    bootstrap()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession?.user) {
        loadProfile(nextSession.user.id)
      } else {
        setProfile(null)
        setOrganization(null)
      }
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    profile,
    organization,
    loading,
    demoMode,

    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(traduireErreur(error.message))
    },

    async signUp({ email, password, organizationName, fullName, sector }) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        // Ces métadonnées alimentent le déclencheur qui crée l'organisation
        // et le profil de façon atomique côté base.
        options: {
          data: {
            organization_name: organizationName,
            full_name: fullName ?? '',
            sector: sector ?? ''
          }
        }
      })

      if (error) throw new Error(traduireErreur(error.message))

      // Sans session renvoyée, Supabase attend une confirmation par courriel.
      return { needsConfirmation: !data.session }
    },

    async signOut() {
      await supabase.auth.signOut()
      // Sans cela, l'organisation du compte précédent resterait en cache et
      // serait réutilisée par la prochaine écriture.
      clearOrganizationCache()
      setProfile(null)
      setOrganization(null)
    }
  }), [session, profile, organization, loading, demoMode])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** Messages Supabase courants, rendus intelligibles en français. */
function traduireErreur(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Courriel ou mot de passe incorrect.'
  if (m.includes('email not confirmed')) return "Adresse courriel non confirmée : vérifiez votre boîte de réception."
  if (m.includes('user already registered')) return 'Un compte existe déjà pour cette adresse.'
  if (m.includes('password should be at least')) return 'Le mot de passe doit comporter au moins 6 caractères.'
  if (m.includes('unable to validate email')) return "Adresse courriel invalide."
  return message
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider")
  return context
}
