/**
 * Compatibilité ascendante.
 *
 * Ce module hébergeait un second client Supabase qui levait une exception au
 * chargement lorsque VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY étaient
 * absentes — ce qui faisait échouer l'import de l'orchestrateur agentique.
 *
 * Il ne reste qu'une ré-exportation du client unique afin que les imports
 * existants (`@/lib/supabase`) continuent de fonctionner.
 */
import { supabase } from '@/integrations/supabase/client'

export type { Database, Json } from '@/integrations/supabase/types'
export { supabase }

export const supabaseHelpers = {
  /** Teste la joignabilité de Supabase. */
  async testConnection(): Promise<boolean> {
    try {
      const { error } = await supabase.from('organizations').select('id', { count: 'exact', head: true })
      return !error
    } catch {
      return false
    }
  },

  /** Métriques de base du backend, tolérantes aux erreurs. */
  async getHealthMetrics() {
    try {
      const [orgCount, execCount, riskCount] = await Promise.all([
        supabase.from('organizations').select('id', { count: 'exact', head: true }),
        supabase.from('agent_executions').select('id', { count: 'exact', head: true }),
        supabase.from('risks').select('id', { count: 'exact', head: true })
      ])

      const firstError = orgCount.error ?? execCount.error ?? riskCount.error
      if (firstError) throw firstError

      return {
        organizations: orgCount.count ?? 0,
        executions: execCount.count ?? 0,
        risks: riskCount.count ?? 0,
        status: 'healthy' as const
      }
    } catch (error) {
      console.warn('Métriques Supabase indisponibles:', error)
      return {
        organizations: 0,
        executions: 0,
        risks: 0,
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }
    }
  }
}

export default supabase
