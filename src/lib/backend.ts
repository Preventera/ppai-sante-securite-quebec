import { supabase } from '@/integrations/supabase/client'
import { forceDemoMode, supabaseConfig } from '@/lib/env'

/**
 * Détermine à l'exécution si le backend Supabase est réellement exploitable,
 * c'est-à-dire joignable ET doté du schéma attendu.
 *
 * Le résultat conditionne la bascule de chaque service entre le mode « live »
 * (Supabase) et le mode « démonstration » (persistance locale). La sonde est
 * mise en cache pour ne pas interroger le réseau à chaque lecture.
 */

export type BackendMode = 'live' | 'demo'

let cachedProbe: Promise<BackendMode> | null = null
let resolvedMode: BackendMode | null = null

const PROBE_TIMEOUT_MS = 4000

const withTimeout = <T,>(promise: PromiseLike<T>, ms: number): Promise<T | 'timeout'> =>
  Promise.race([
    Promise.resolve(promise),
    new Promise<'timeout'>(resolve => setTimeout(() => resolve('timeout'), ms))
  ])

async function probe(): Promise<BackendMode> {
  if (forceDemoMode) return 'demo'

  // Sans configuration explicite, inutile d'interroger le réseau : le client
  // ne pointe vers aucun projet réel.
  if (!supabaseConfig.isExplicitlyConfigured) {
    console.info('[PPAI] Supabase non configuré — mode démonstration activé.')
    return 'demo'
  }

  try {
    // La sonde interrogeait la table `risks`. Depuis le cloisonnement RLS, le
    // rôle anonyme n'a plus aucun privilège : la requête renvoyait 401 avant
    // toute connexion, l'application retombait en mode démonstration et
    // n'affichait donc jamais l'écran de connexion — un blocage circulaire.
    //
    // On interroge désormais le point de santé du service d'authentification,
    // accessible sans privilège de table. Il répond à la seule question utile
    // ici : le projet Supabase est-il joignable ?
    const result = await withTimeout(
      fetch(`${supabaseConfig.url}/auth/v1/health`, {
        headers: { apikey: supabaseConfig.anonKey }
      }),
      PROBE_TIMEOUT_MS
    )

    if (result === 'timeout') {
      console.info('[PPAI] Backend injoignable (délai dépassé) — mode démonstration activé.')
      return 'demo'
    }

    if (!result.ok) {
      console.info(
        `[PPAI] Backend Supabase indisponible (HTTP ${result.status}) — mode démonstration activé.`
      )
      return 'demo'
    }

    return 'live'
  } catch (error) {
    console.info('[PPAI] Backend inaccessible — mode démonstration activé.', error)
    return 'demo'
  }
}

/** Résout le mode backend (mise en cache après le premier appel). */
export async function getBackendMode(): Promise<BackendMode> {
  if (resolvedMode) return resolvedMode

  if (!cachedProbe) {
    cachedProbe = probe().then(mode => {
      resolvedMode = mode
      return mode
    })
  }

  return cachedProbe
}

/** Mode déjà résolu, sans déclencher de sonde. `null` si encore inconnu. */
export const peekBackendMode = (): BackendMode | null => resolvedMode

export const isLiveBackend = async () => (await getBackendMode()) === 'live'

/** Réinitialise la sonde — utile après l'application des migrations. */
export function resetBackendProbe(): void {
  cachedProbe = null
  resolvedMode = null
}
