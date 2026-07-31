/**
 * Résolution centralisée de la configuration d'exécution.
 *
 * Règle absolue : ce module ne lève jamais d'exception au chargement.
 * L'application doit toujours démarrer — en mode démonstration autonome
 * lorsque le backend n'est pas configuré ou n'est pas joignable.
 */

const readEnv = (key: string): string | undefined => {
  const raw = (import.meta.env as Record<string, string | undefined>)[key]
  const value = raw?.trim()
  return value && value.length > 0 ? value : undefined
}

/**
 * Le client embarquait en dur les identifiants d'un projet Supabase, utilisés
 * comme repli. Cette valeur par défaut est trompeuse : elle dirigeait
 * l'application vers un projet qui n'est plus le sien, et figeait des
 * identifiants dans le dépôt.
 *
 * La configuration provient désormais exclusivement de l'environnement. En son
 * absence, l'application fonctionne en mode démonstration — comportement
 * explicite et prévisible, plutôt qu'un projet arbitraire.
 *
 * Les valeurs ci-dessous ne servent qu'à construire un client syntaxiquement
 * valide ; aucune requête ne leur est adressée puisque le mode démonstration
 * court-circuite tout accès réseau.
 */
const PLACEHOLDER_URL = 'https://placeholder.supabase.co'
const PLACEHOLDER_ANON_KEY = 'placeholder-anon-key'

/**
 * Valide l'URL du projet Supabase avant de la transmettre au client.
 *
 * `createClient()` appelle `new URL()`, qui lève une exception sur une valeur
 * mal formée. Comme le client est construit au chargement du module, cette
 * exception interrompt l'évaluation du bundle entier : rien ne se monte, la
 * page reste blanche, et aucune limite d'erreur React ne peut intervenir —
 * React n'a jamais démarré. Une simple variable d'environnement saisie sans
 * « https:// » suffisait à éteindre l'application déployée.
 *
 * L'oubli du protocole étant l'erreur de saisie la plus courante, elle est
 * rattrapée, mais jamais en silence : le message dit quoi corriger.
 */
const validerUrl = (valeur: string | undefined): string | undefined => {
  if (!valeur) return undefined

  // `new URL()` accepte des hôtes absurdes dès lors qu'un protocole est
  // présent — « https://n'importe quoi » passe. On exige donc un nom de
  // domaine plausible, sinon la valeur fautive serait « rattrapée » en une
  // adresse tout aussi inutilisable, et le message trompeur.
  // Un seul segment est admis pour couvrir « localhost », qu'utilise la pile
  // Supabase locale.
  const DOMAINE_PLAUSIBLE = /^[a-z0-9-]+(\.[a-z0-9-]+)*$/i

  const analyser = (candidate: string): string | undefined => {
    try {
      const url = new URL(candidate)
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined
      return DOMAINE_PLAUSIBLE.test(url.hostname) ? url.origin : undefined
    } catch {
      return undefined
    }
  }

  const directe = analyser(valeur)
  if (directe) return directe

  const avecProtocole = analyser(`https://${valeur}`)
  if (avecProtocole) {
    console.warn(
      `[PPAI] VITE_SUPABASE_URL (« ${valeur} ») ne précise pas de protocole ; ` +
        `« ${avecProtocole} » est retenu. Corrigez la variable pour lever l'ambiguïté.`
    )
    return avecProtocole
  }

  console.error(
    `[PPAI] VITE_SUPABASE_URL (« ${valeur} ») n'est pas une URL valide. ` +
      'Le mode démonstration est activé. Attendu : https://<projet>.supabase.co'
  )
  return undefined
}

const envUrl = validerUrl(readEnv('VITE_SUPABASE_URL'))
const envAnonKey = readEnv('VITE_SUPABASE_ANON_KEY')

export const supabaseConfig = {
  url: envUrl ?? PLACEHOLDER_URL,
  anonKey: envAnonKey ?? PLACEHOLDER_ANON_KEY,
  /** Vrai uniquement si les deux variables sont fournies ET exploitables. */
  isExplicitlyConfigured: Boolean(envUrl && envAnonKey)
} as const

/**
 * Force le mode démonstration autonome, quelle que soit la disponibilité du backend.
 * Utile pour une démo hors ligne totalement déterministe : VITE_DEMO_MODE=true
 */
export const forceDemoMode = readEnv('VITE_DEMO_MODE') === 'true'

export const appEnv = readEnv('VITE_APP_ENV') ?? 'development'
export const appVersion = readEnv('VITE_VERSION') ?? '0.1.0-mvp'
