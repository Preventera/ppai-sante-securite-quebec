import { supabase } from '@/integrations/supabase/client'
import { forceDemoMode } from '@/lib/env'

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

  try {
    // La table `risks` est le socle du registre : si elle répond, le schéma est en place.
    const result = await withTimeout(
      supabase.from('risks').select('id', { count: 'exact', head: true }),
      PROBE_TIMEOUT_MS
    )

    if (result === 'timeout') {
      console.info('[PPAI] Backend injoignable (délai dépassé) — mode démonstration activé.')
      return 'demo'
    }

    if (result.error) {
      console.info(
        `[PPAI] Schéma Supabase indisponible (${result.error.message}) — mode démonstration activé.`
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
