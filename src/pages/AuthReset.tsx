import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Loader2, AlertTriangle, KeyRound, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'

/**
 * Saisie du nouveau mot de passe, au retour du lien de réinitialisation.
 *
 * POURQUOI CETTE PAGE EXISTE
 *   Supabase sait envoyer le courriel, mais le lien qu'il contient ramène vers
 *   l'application : sans écran pour le recevoir, le lien aboutissait à la page
 *   « introuvable » et la réinitialisation était impossible depuis l'interface.
 *
 * COMMENT LE JETON ARRIVE
 *   Trois formes selon la configuration du projet et le gabarit de courriel :
 *     - `#access_token=…&type=recovery` — flux implicite, forme par défaut ;
 *     - `?code=…`                        — flux PKCE ;
 *     - `?token_hash=…&type=recovery`    — gabarit utilisant `{{ .TokenHash }}`.
 *   Les deux premières sont consommées seules par le client (`detectSessionInUrl`),
 *   qui ouvre la session avant même le rendu de cette page. La troisième doit
 *   être échangée explicitement, d'où l'appel à `verifyOtp` ci-dessous.
 *
 * CETTE PAGE SERT AUSSI AU CHANGEMENT VOLONTAIRE
 *   Un utilisateur déjà connecté qui l'ouvre peut simplement changer son mot de
 *   passe : le traitement est identique, seule la formulation diffère.
 */

/**
 * Paramètres présents dans l'URL au premier rendu.
 *
 * Ils sont relevés une seule fois : le client Supabase nettoie le fragment
 * après l'avoir consommé, si bien qu'une lecture plus tardive ne verrait plus
 * rien — ni le jeton, ni le message d'erreur d'un lien expiré.
 */
function parametresDeRetour(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const params: Record<string, string> = {}
  const ajouter = (source: string) => {
    try {
      new URLSearchParams(source).forEach((valeur, cle) => {
        params[cle] = valeur
      })
    } catch {
      // Fragment illisible : on l'ignore, l'absence de session sera signalée.
    }
  }
  ajouter(window.location.search.replace(/^\?/, ''))
  ajouter(window.location.hash.replace(/^#/, ''))
  return params
}

type Etat = 'verification' | 'pret' | 'lienInvalide' | 'succes'

const AuthReset = () => {
  const { session, loading, demoMode, recuperationEnCours, definirMotDePasse } = useAuth()
  const navigate = useNavigate()

  const [params] = useState(parametresDeRetour)
  const [etat, setEtat] = useState<Etat>('verification')
  const [motifLienInvalide, setMotifLienInvalide] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [motDePasse, setMotDePasse] = useState('')
  const [confirmation, setConfirmation] = useState('')

  // `verifyOtp` ne doit être tenté qu'une fois : le jeton est à usage unique,
  // un second appel échouerait et invaliderait un lien pourtant valable.
  const echangeTente = useRef(false)

  useEffect(() => {
    if (loading || demoMode) return
    // Une fois le lien tranché, l'état ne se rejoue plus. `updateUser` émet
    // `USER_UPDATED`, donc une nouvelle session : sans cette garde, l'effet
    // repassait à « pret » aussitôt après le succès et l'écran de confirmation
    // n'apparaissait jamais.
    if (etat !== 'verification') return

    let actif = true

    const verifier = async () => {
      // Un lien expiré revient avec un message d'erreur plutôt qu'un jeton.
      const messageErreur = params.error_description ?? params.error
      if (messageErreur && !session) {
        if (!actif) return
        setMotifLienInvalide(
          params.error_code === 'otp_expired' || /expired/i.test(messageErreur)
            ? "Ce lien a expiré. Les liens de réinitialisation sont valables une heure."
            : decodeURIComponent(messageErreur.replace(/\+/g, ' '))
        )
        setEtat('lienInvalide')
        return
      }

      if (session) {
        if (actif) setEtat('pret')
        return
      }

      // Gabarit de courriel fondé sur `{{ .TokenHash }}` : le jeton n'ouvre pas
      // de session tout seul, il faut l'échanger.
      const tokenHash = params.token_hash ?? params.token
      if (tokenHash && !echangeTente.current) {
        echangeTente.current = true
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery'
        })
        if (!actif) return
        if (error) {
          setMotifLienInvalide(
            /expired|invalid/i.test(error.message)
              ? "Ce lien a expiré ou a déjà été utilisé. Les liens de réinitialisation sont valables une heure et ne servent qu'une fois."
              : error.message
          )
          setEtat('lienInvalide')
          return
        }
        // La session arrive par `onAuthStateChange` ; l'effet sera relancé.
        return
      }

      if (actif && !tokenHash) {
        setMotifLienInvalide(null)
        setEtat('lienInvalide')
      }
    }

    void verifier()
    return () => {
      actif = false
    }
  }, [loading, demoMode, session, params, etat])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (motDePasse.length < 6) {
      setError('Le mot de passe doit comporter au moins 6 caractères.')
      return
    }
    if (motDePasse !== confirmation) {
      setError('Les deux mots de passe saisis ne sont pas identiques.')
      return
    }

    setSubmitting(true)
    try {
      await definirMotDePasse(motDePasse)
      setEtat('succes')
      // L'URL porte encore le jeton consommé : la nettoyer évite qu'un partage
      // du lien de la barre d'adresse ne transmette autre chose qu'une adresse.
      window.history.replaceState(null, '', '/auth/reset')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Changement du mot de passe impossible')
    } finally {
      setSubmitting(false)
    }
  }

  const entete = (
    <div className="text-center">
      <h1 className="text-3xl font-bold text-sst-blue flex items-center justify-center gap-2">
        <Shield className="w-8 h-8" />
        PPAI
      </h1>
      <p className="text-gray-600 mt-1">Prevention Program AI — santé et sécurité au travail</p>
    </div>
  )

  const cadre = (contenu: React.ReactNode) => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {entete}
        {contenu}
      </div>
    </div>
  )

  // En démonstration il n'y a ni compte ni backend : annoncer un formulaire de
  // mot de passe donnerait à croire qu'un compte existe.
  if (demoMode) {
    return cadre(
      <Card>
        <CardHeader>
          <CardTitle>Réinitialisation indisponible</CardTitle>
          <CardDescription>
            L'application tourne en mode démonstration : les données vivent dans ce
            navigateur et aucun compte n'est requis. La réinitialisation d'un mot de
            passe suppose un projet Supabase configuré.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link to="/">Retour à l'application</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (loading || etat === 'verification') {
    return cadre(
      <Card>
        <CardContent className="p-6 flex items-center justify-center gap-2 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          Vérification du lien…
        </CardContent>
      </Card>
    )
  }

  if (etat === 'lienInvalide') {
    return cadre(
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Lien inutilisable
          </CardTitle>
          <CardDescription>
            {motifLienInvalide ??
              "Cette page se consulte à partir du lien reçu par courriel. Ouverte directement, elle n'a aucun jeton à traiter."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link to="/auth">Demander un nouveau lien</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (etat === 'succes') {
    return cadre(
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Mot de passe modifié
          </CardTitle>
          <CardDescription>
            Votre nouveau mot de passe est actif et votre session est ouverte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => navigate('/', { replace: true })}>
            Continuer vers l'application
          </Button>
        </CardContent>
      </Card>
    )
  }

  return cadre(
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-sst-blue" />
          {recuperationEnCours ? 'Choisir un nouveau mot de passe' : 'Changer votre mot de passe'}
        </CardTitle>
        <CardDescription>
          {recuperationEnCours
            ? "Le lien a été vérifié. Saisissez le mot de passe que vous souhaitez utiliser désormais."
            : "Vous êtes connecté. Saisissez le mot de passe que vous souhaitez utiliser désormais."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Champ masqué : sans lui, les gestionnaires de mots de passe
              n'associent pas la nouvelle valeur au bon compte. */}
          <input
            type="email"
            autoComplete="username"
            value={session?.user?.email ?? ''}
            readOnly
            hidden
          />
          <div className="space-y-2">
            <Label htmlFor="reset-password">Nouveau mot de passe</Label>
            <Input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
            />
            <p className="text-xs text-gray-500">Au moins 6 caractères.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reset-confirm">Confirmer le mot de passe</Label>
            <Input
              id="reset-confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Enregistrer le nouveau mot de passe
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default AuthReset
