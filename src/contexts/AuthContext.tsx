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
  /** Code SCIAN de l'établissement — détermine le niveau de risque sectoriel. */
  scian_code: string | null
  /** Effectif déclaré — détermine les mécanismes de participation exigés. */
  employee_count: number | null
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
  /**
   * Vrai lorsque la session courante provient d'un lien de réinitialisation.
   *
   * Supabase ouvre une session complète dès que le lien du courriel est suivi.
   * Sans ce marqueur, rien ne distinguerait cette session d'une connexion
   * ordinaire, et l'écran de réinitialisation ne pourrait pas expliquer à
   * l'utilisateur pourquoi il est là.
   */
  recuperationEnCours: boolean
  /** Envoie le courriel de réinitialisation. Ne révèle jamais si le compte existe. */
  demanderReinitialisation: (email: string) => Promise<void>
  /** Remplace le mot de passe de la session courante. */
  definirMotDePasse: (motDePasse: string) => Promise<void>
  /**
   * Recharge l'organisation depuis la base.
   *
   * Nécessaire après la saisie de l'effectif ou du code SCIAN : la navigation
   * en dépend (Comité SST ou Agent de liaison) et doit refléter la nouvelle
   * valeur sans exiger une déconnexion.
   */
  rafraichirOrganisation: () => Promise<void>
}

/**
 * Adresse de retour du lien de réinitialisation.
 *
 * Elle doit être déclarée telle quelle dans Supabase (*Authentication > URL
 * Configuration > Redirect URLs*) : une adresse non déclarée est ignorée, et
 * le lien du courriel ramène alors à la racine du site, où aucun écran ne sait
 * traiter le jeton.
 */
export const URL_RETOUR_REINITIALISATION = '/auth/reset'

function urlDeRetour(): string | undefined {
  if (typeof window === 'undefined') return undefined
  return `${window.location.origin}${URL_RETOUR_REINITIALISATION}`
}

/**
 * Adresse de retour du lien de confirmation d'inscription.
 *
 * La racine suffit : le client Supabase détecte le jeton dans l'URL quelle que
 * soit la page atteinte et ouvre la session. Elle doit néanmoins figurer dans
 * les « Redirect URLs » du projet, sans quoi Supabase l'ignore.
 */
function urlDeRetourInscription(): string | undefined {
  if (typeof window === 'undefined') return undefined
  return `${window.location.origin}/`
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
  const [recuperationEnCours, setRecuperationEnCours] = useState(false)

  // Charge le profil et l'organisation de l'utilisateur connecté.
  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, organization_id, full_name, role, organizations(id, name, sector, scian_code, employee_count)')
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

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      // Émis lorsque le jeton présent dans l'URL est de type « recovery ».
      // C'est le seul signal qui distingue l'arrivée par courriel d'une
      // connexion ordinaire ; il précède l'établissement de la session.
      if (event === 'PASSWORD_RECOVERY') setRecuperationEnCours(true)
      if (event === 'SIGNED_OUT') setRecuperationEnCours(false)

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
    recuperationEnCours,

    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(traduireErreur(error.message))
    },

    async signUp({ email, password, organizationName, fullName, sector }) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Sans cette adresse, le lien de confirmation retombe sur la
          // « Site URL » du projet Supabase : si elle est restée sur la valeur
          // par défaut (localhost:3000), le lien renvoie l'utilisateur vers une
          // page inexistante et le compte reste non confirmé.
          emailRedirectTo: urlDeRetourInscription(),
          // Ces métadonnées alimentent le déclencheur qui crée l'organisation
          // et le profil de façon atomique côté base.
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
      setRecuperationEnCours(false)
    },

    async demanderReinitialisation(email) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: urlDeRetour()
      })
      // Supabase répond sans erreur même pour une adresse inconnue : c'est
      // voulu, cela évite de transformer ce formulaire en test d'existence de
      // comptes. Les erreurs restantes sont réelles (limitation de débit,
      // adresse malformée, service de courriel non configuré).
      if (error) throw new Error(traduireErreur(error.message))
    },

    async definirMotDePasse(motDePasse) {
      const { error } = await supabase.auth.updateUser({ password: motDePasse })
      if (error) throw new Error(traduireErreur(error.message))
      // Le mot de passe est changé : la session cesse d'être une session de
      // récupération et redevient une session ordinaire.
      setRecuperationEnCours(false)
    },

    async rafraichirOrganisation() {
      if (session?.user) await loadProfile(session.user.id)
    }
  }), [session, profile, organization, loading, demoMode, recuperationEnCours])

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
  if (m.includes('new password should be different')) {
    return "Le nouveau mot de passe doit être différent de l'ancien."
  }
  if (m.includes('auth session missing') || m.includes('session_not_found')) {
    return "Le lien de réinitialisation a expiré ou a déjà été utilisé. Demandez-en un nouveau."
  }
  if (m.includes('token has expired') || m.includes('otp_expired') || m.includes('invalid or has expired')) {
    return "Le lien de réinitialisation a expiré. Les liens sont valables une heure ; demandez-en un nouveau."
  }
  // Supabase limite le nombre de courriels par heure et par adresse. Sans ce
  // message, l'échec paraît arbitraire alors qu'il suffit d'attendre.
  if (m.includes('rate limit') || m.includes('for security purposes')) {
    return "Trop de demandes en peu de temps. Patientez quelques minutes avant de réessayer."
  }
  if (m.includes('error sending recovery email') || m.includes('error sending confirmation')) {
    return "Le service d'envoi de courriels du projet Supabase n'a pas pu expédier le message. Vérifiez la configuration SMTP du projet."
  }
  return message
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider")
  return context
}
