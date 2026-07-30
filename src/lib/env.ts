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

const envUrl = readEnv('VITE_SUPABASE_URL')
const envAnonKey = readEnv('VITE_SUPABASE_ANON_KEY')

export const supabaseConfig = {
  url: envUrl ?? PLACEHOLDER_URL,
  anonKey: envAnonKey ?? PLACEHOLDER_ANON_KEY,
  /** Vrai uniquement si les deux variables ont été fournies explicitement. */
  isExplicitlyConfigured: Boolean(envUrl && envAnonKey)
} as const

/**
 * Force le mode démonstration autonome, quelle que soit la disponibilité du backend.
 * Utile pour une démo hors ligne totalement déterministe : VITE_DEMO_MODE=true
 */
export const forceDemoMode = readEnv('VITE_DEMO_MODE') === 'true'

export const appEnv = readEnv('VITE_APP_ENV') ?? 'development'
export const appVersion = readEnv('VITE_VERSION') ?? '0.1.0-mvp'
