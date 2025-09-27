import { createClient } from '@supabase/supabase-js'
// Éviter les instances multiples GoTrueClient
if (typeof window !== 'undefined') {
  (window as any).__supabaseClient = null
}
// Types pour la base de données PPAI
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          sector: string
          size_category: string
          cnesst_number: string | null
          address: any | null
          contact_info: any | null
          priority_group: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          sector: string
          size_category: string
          cnesst_number?: string | null
          address?: any | null
          contact_info?: any | null
          priority_group?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          sector?: string
          size_category?: string
          cnesst_number?: string | null
          address?: any | null
          contact_info?: any | null
          priority_group?: boolean
          updated_at?: string
        }
      }
      agent_executions: {
        Row: {
          id: string
          agent_name: string
          workflow_id: string | null
          input_data: any
          output_data: any | null
          execution_status: 'pending' | 'running' | 'completed' | 'failed'
          execution_time_ms: number | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agent_name: string
          workflow_id?: string | null
          input_data: any
          output_data?: any | null
          execution_status?: 'pending' | 'running' | 'completed' | 'failed'
          execution_time_ms?: number | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          agent_name?: string
          workflow_id?: string | null
          input_data?: any
          output_data?: any | null
          execution_status?: 'pending' | 'running' | 'completed' | 'failed'
          execution_time_ms?: number | null
          error_message?: string | null
          updated_at?: string
        }
      }
      risks: {
        Row: {
          id: string
          establishment_id: string
          title: string
          description: string | null
          category: string
          probability: number
          severity: number
          current_controls: string[] | null
          residual_risk_level: string
          status: string
          assigned_to: string | null
          due_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          establishment_id: string
          title: string
          description?: string | null
          category: string
          probability: number
          severity: number
          current_controls?: string[] | null
          residual_risk_level: string
          status?: string
          assigned_to?: string | null
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          establishment_id?: string
          title?: string
          description?: string | null
          category?: string
          probability?: number
          severity?: number
          current_controls?: string[] | null
          residual_risk_level?: string
          status?: string
          assigned_to?: string | null
          due_date?: string | null
          updated_at?: string
        }
      }
      prevention_programs: {
        Row: {
          id: string
          organization_id: string
          title: string
          description: string | null
          document_type: string
          sector: string
          responsible_actor: string
          content: any
          status: string
          version: number
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          title: string
          description?: string | null
          document_type: string
          sector: string
          responsible_actor: string
          content: any
          status?: string
          version?: number
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          organization_id?: string
          title?: string
          description?: string | null
          document_type?: string
          sector?: string
          responsible_actor?: string
          content?: any
          status?: string
          version?: number
          approved_by?: string | null
          approved_at?: string | null
          updated_at?: string
        }
      }
    }
    Functions: {
      'generate-prevention-program': {
        Args: {
          companyName: string
          secteurScian: string
          groupePrioritaire: boolean
          selectedRisks?: string[]
          secteurDetaille?: string
          nombreEmployes?: string
        }
        Returns: {
          success: boolean
          data?: any
          error?: string
        }
      }
    }
  }
}

// Configuration du client Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Variable d\'environnement VITE_SUPABASE_URL manquante. Vérifiez votre fichier .env.local')
}

if (!supabaseAnonKey) {
  throw new Error('Variable d\'environnement VITE_SUPABASE_ANON_KEY manquante. Vérifiez votre fichier .env.local')
}

// Créer le client Supabase avec configuration optimisée pour PPAI
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'ppai-sst-quebec@1.0.0'
    }
  }
})

// Helper functions pour PPAI
export const supabaseHelpers = {
  /**
   * Teste la connexion à Supabase
   */
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase.from('organizations').select('count(*)', { count: 'exact', head: true })
      return !error
    } catch {
      return false
    }
  },

  /**
   * Récupère les métriques de base
   */
  async getHealthMetrics() {
    try {
      const [orgCount, execCount, riskCount] = await Promise.all([
        supabase.from('organizations').select('*', { count: 'exact', head: true }),
        supabase.from('agent_executions').select('*', { count: 'exact', head: true }),
        supabase.from('risks').select('*', { count: 'exact', head: true })
      ])

      return {
        organizations: orgCount.count || 0,
        executions: execCount.count || 0,
        risks: riskCount.count || 0,
        status: 'healthy'
      }
    } catch (error) {
      console.error('Erreur métriques Supabase:', error)
      return {
        organizations: 0,
        executions: 0,
        risks: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }
    }
  }
}

// Export par défaut
export default supabase