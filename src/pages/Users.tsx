import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Users as UsersIcon, Loader2, AlertTriangle, Info } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import {
  LIBELLE_ROLE, DESCRIPTION_ROLE, ROLES_APPLICATIFS, roleEffectif, type RoleApplicatif
} from '@/lib/roles'

/**
 * Gestion des comptes de l'organisation — réservée aux administrateurs.
 *
 * L'écran ne fait qu'exposer ce que la base autorise déjà : la politique
 * `profiles_update_admin` et le déclencheur `garde_profils` (migration 005)
 * refusent tout le reste. En particulier, un administrateur ne peut pas
 * changer SON PROPRE rôle — une organisation ne doit pas pouvoir se
 * retrouver sans administrateur par une erreur de manipulation. Le sélecteur
 * de sa propre ligne est donc désactivé, avec la raison en clair.
 */

interface LigneProfil {
  id: string
  full_name: string | null
  email: string | null
  role: string
}

const Users = () => {
  const { profile, organization, demoMode } = useAuth()
  const { toast } = useToast()

  const [lignes, setLignes] = useState<LigneProfil[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState<string | null>(null)

  const charger = async () => {
    setChargement(true)
    setErreur(null)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .order('full_name', { ascending: true, nullsFirst: false })

    if (error) {
      // `email` n'existe qu'à partir de la migration 005 : une base en retard
      // doit produire un message actionnable, pas une liste vide.
      setErreur(
        error.message.includes('email')
          ? "La colonne « email » des profils est absente : la migration 20241001000005_roles_applicatifs.sql n'a pas été appliquée sur ce projet Supabase."
          : error.message
      )
    } else {
      setLignes((data ?? []) as LigneProfil[])
    }
    setChargement(false)
  }

  useEffect(() => {
    if (!demoMode) void charger()
    else setChargement(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoMode])

  const changerRole = async (id: string, role: RoleApplicatif) => {
    setEnCours(id)
    const precedent = lignes.find(l => l.id === id)?.role
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
    setEnCours(null)

    if (error) {
      toast({
        title: 'Changement refusé',
        description: error.message,
        variant: 'destructive'
      })
      return
    }

    setLignes(prev => prev.map(l => (l.id === id ? { ...l, role } : l)))
    toast({
      title: 'Rôle modifié',
      description: `${precedent ? `${LIBELLE_ROLE[roleEffectif(precedent, false)]} → ` : ''}${LIBELLE_ROLE[role]}.`
    })
  }

  if (demoMode) {
    return (
      <div className="p-6 max-w-3xl">
        <h1 className="text-3xl font-bold text-sst-blue flex items-center gap-2 mb-4">
          <UsersIcon className="w-8 h-8" />
          Utilisateurs
        </h1>
        <Alert>
          <Info className="w-4 h-4" />
          <AlertDescription>
            En mode démonstration, il n'y a ni comptes ni organisation : cette
            page gère les rôles des membres d'une organisation réelle, une fois
            Supabase configuré.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-sst-blue flex items-center gap-2">
          <UsersIcon className="w-8 h-8" />
          Utilisateurs
        </h1>
        <p className="text-gray-600 mt-1">
          Comptes de « {organization?.name} » et rôles applicatifs. Le rôle
          détermine ce que la base de données accepte de chaque compte — pas
          seulement ce que l'écran affiche.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Ce que chaque rôle permet</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {ROLES_APPLICATIFS.map(r => (
            <div key={r} className="text-sm">
              <Badge variant="outline" className="mb-1">{LIBELLE_ROLE[r]}</Badge>
              <p className="text-gray-600">{DESCRIPTION_ROLE[r]}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {erreur && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{erreur}</AlertDescription>
        </Alert>
      )}

      {chargement ? (
        <div className="flex items-center gap-2 text-gray-600 p-6">
          <Loader2 className="w-5 h-5 animate-spin" />
          Chargement des comptes…
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{lignes.length} compte(s)</CardTitle>
            <CardDescription>
              Pour inviter un collègue : il crée son compte sur la page de
              connexion, puis son organisation est rattachée à la vôtre depuis
              le tableau de bord Supabase (procédure du README). Il apparaîtra
              alors ici.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {lignes.map(ligne => {
              const estMoi = ligne.id === profile?.id
              return (
                <div key={ligne.id} className="py-3 flex items-center justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {ligne.full_name || ligne.email || ligne.id}
                      {estMoi && <span className="text-gray-400 font-normal"> (vous)</span>}
                    </p>
                    {ligne.email && ligne.full_name && (
                      <p className="text-sm text-gray-500 truncate">{ligne.email}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {enCours === ligne.id && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                    <Select
                      value={roleEffectif(ligne.role, false)}
                      onValueChange={(v) => changerRole(ligne.id, v as RoleApplicatif)}
                      disabled={estMoi || enCours !== null}
                    >
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES_APPLICATIFS.map(r => (
                          <SelectItem key={r} value={r}>{LIBELLE_ROLE[r]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {estMoi && (
                    <p className="w-full text-xs text-gray-500">
                      Votre propre rôle ne se modifie pas ici : une organisation ne doit
                      jamais perdre son dernier administrateur par erreur. Un autre admin
                      — ou l'éditeur SQL de Supabase — peut le changer.
                    </p>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Users
