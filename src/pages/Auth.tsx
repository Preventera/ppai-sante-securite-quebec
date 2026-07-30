import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Shield, Loader2, AlertTriangle, MailCheck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Connexion et création de compte.
 *
 * L'inscription crée l'organisation en même temps que le compte : le premier
 * utilisateur d'une entreprise en devient administrateur. Le cloisonnement des
 * données repose ensuite sur ce rattachement.
 */
const Auth = () => {
  const { session, loading, demoMode, signIn, signUp } = useAuth()
  const location = useLocation()

  const [error, setError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [fullName, setFullName] = useState('')

  // En démonstration aucun compte n'est requis ; une session active rend
  // cette page inutile.
  if (!loading && (demoMode || session)) {
    const from = (location.state as { from?: string } | null)?.from ?? '/'
    return <Navigate to={from} replace />
  }

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signIn(loginEmail, loginPassword)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connexion impossible')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!organizationName.trim()) {
      setError("Le nom de l'entreprise est requis : il détermine l'organisation propriétaire des données.")
      return
    }
    if (signupPassword.length < 6) {
      setError('Le mot de passe doit comporter au moins 6 caractères.')
      return
    }

    setSubmitting(true)
    try {
      const { needsConfirmation } = await signUp({
        email: signupEmail,
        password: signupPassword,
        organizationName: organizationName.trim(),
        fullName: fullName.trim()
      })
      if (needsConfirmation) setConfirmation(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Création du compte impossible')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-sst-blue flex items-center justify-center gap-2">
            <Shield className="w-8 h-8" />
            PPAI
          </h1>
          <p className="text-gray-600 mt-1">Prevention Program AI — santé et sécurité au travail</p>
        </div>

        {confirmation ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MailCheck className="w-5 h-5 text-green-600" />
                Vérifiez votre courriel
              </CardTitle>
              <CardDescription>
                Un lien de confirmation vient d'être envoyé à <strong>{signupEmail}</strong>.
                Votre organisation « {organizationName} » sera activée dès la confirmation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => setConfirmation(false)}>
                Retour à la connexion
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Tabs defaultValue="login">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login">Connexion</TabsTrigger>
                  <TabsTrigger value="signup">Créer un compte</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Courriel</Label>
                      <Input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Mot de passe</Label>
                      <Input
                        id="login-password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Se connecter
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-org">Nom de l'entreprise *</Label>
                      <Input
                        id="signup-org"
                        required
                        placeholder="Ex : Construction Boréal inc."
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">
                        Vos risques et programmes seront visibles uniquement par les membres
                        de cette entreprise.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Votre nom</Label>
                      <Input
                        id="signup-name"
                        autoComplete="name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Courriel *</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        autoComplete="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Mot de passe *</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={6}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">Au moins 6 caractères.</p>
                    </div>
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Créer le compte et l'organisation
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default Auth
