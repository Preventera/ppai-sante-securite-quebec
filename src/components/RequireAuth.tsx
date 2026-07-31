import { Navigate, useLocation } from 'react-router-dom'
import { Loader2, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Garde de routes.
 *
 * En mode démonstration, l'accès est libre : les données vivent dans le
 * navigateur et n'engagent aucun backend. En mode live, une session est
 * exigée — les politiques RLS refuseraient de toute façon toute requête
 * anonyme, mais mieux vaut rediriger que présenter des écrans vides.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, profile, loading, demoMode } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          Vérification de la session…
        </div>
      </div>
    )
  }

  if (demoMode) return <>{children}</>

  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />
  }

  // Le profil est créé par un déclencheur à l'inscription. Son absence signale
  // une base dont les migrations ne sont pas à jour : sans organisation, les
  // politiques RLS masqueraient toutes les données sans explication.
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-lg">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-600" />
            <h2 className="text-lg font-semibold mb-2">Compte sans organisation</h2>
            <p className="text-gray-600 text-sm">
              Aucun profil n'est rattaché à ce compte. Cela survient lorsque la migration
              <code className="mx-1 px-1 bg-gray-100 rounded">20241001000003_multitenant_rls.sql</code>
              n'a pas été appliquée : le déclencheur qui crée l'organisation à l'inscription
              est alors absent.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
