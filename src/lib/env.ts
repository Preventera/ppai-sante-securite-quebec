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
 * Projet Supabase de repli, historiquement codé en dur dans le client.
 * Conservé pour ne pas casser les déploiements existants, mais toujours
 * surchargeable via VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
 */
const FALLBACK_SUPABASE_URL = 'https://krtgeqejpsdyzuesopez.supabase.co'
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtydGdlcWVqcHNkeXp1ZXNvcGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDIwOTksImV4cCI6MjA2MzkxODA5OX0.IMp_uuvTw_UtcDtCip3qsObsnt0z2sz8fJEQJ8sMuew'

const envUrl = readEnv('VITE_SUPABASE_URL')
const envAnonKey = readEnv('VITE_SUPABASE_ANON_KEY')

export const supabaseConfig = {
  url: envUrl ?? FALLBACK_SUPABASE_URL,
  anonKey: envAnonKey ?? FALLBACK_SUPABASE_ANON_KEY,
  /** Vrai si les deux variables d'environnement ont été fournies explicitement */
  isExplicitlyConfigured: Boolean(envUrl && envAnonKey)
} as const

/**
 * Force le mode démonstration autonome, quelle que soit la disponibilité du backend.
 * Utile pour une démo hors ligne totalement déterministe : VITE_DEMO_MODE=true
 */
export const forceDemoMode = readEnv('VITE_DEMO_MODE') === 'true'

export const appEnv = readEnv('VITE_APP_ENV') ?? 'development'
export const appVersion = readEnv('VITE_VERSION') ?? '0.1.0-mvp'
