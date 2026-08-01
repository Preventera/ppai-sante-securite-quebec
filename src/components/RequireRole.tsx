import { Card, CardContent } from '@/components/ui/card'
import { ShieldOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { roleEffectif, LIBELLE_ROLE, type RoleApplicatif } from '@/lib/roles'

/**
 * Garde de route par rôle.
 *
 * S'emploie À L'INTÉRIEUR de RequireAuth : la session et le profil sont déjà
 * garantis. Un rôle insuffisant reçoit une explication, pas une redirection
 * muette — l'utilisateur doit comprendre à qui s'adresser, pas se demander
 * pourquoi l'adresse « ne marche pas ».
 *
 * Rappel : la vraie protection est dans les politiques RLS (migration 005).
 * Cette garde évite seulement de présenter des écrans dont chaque action
 * serait refusée par la base.
 */
export function RequireRole({
  roles,
  children
}: {
  roles: RoleApplicatif[]
  children: React.ReactNode
}) {
  const { profile, demoMode } = useAuth()
  const role = roleEffectif(profile?.role, demoMode)

  if (roles.includes(role)) return <>{children}</>

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <Card className="max-w-lg">
        <CardContent className="p-6 text-center">
          <ShieldOff className="w-10 h-10 mx-auto mb-4 text-gray-400" />
          <h2 className="text-lg font-semibold mb-2">Page réservée</h2>
          <p className="text-gray-600 text-sm">
            Cette page est réservée aux rôles suivants :{' '}
            <strong>{roles.map(r => LIBELLE_ROLE[r]).join(', ')}</strong>.
            Votre rôle actuel est « {LIBELLE_ROLE[role]} ». Si vous pensez
            devoir y accéder, adressez-vous à un administrateur de votre
            organisation — c'est lui qui attribue les rôles.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
