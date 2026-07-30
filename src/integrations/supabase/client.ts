import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { supabaseConfig } from '@/lib/env';

/**
 * Client Supabase unique de l'application.
 *
 * Importer toujours depuis ce module :
 *   import { supabase } from "@/integrations/supabase/client";
 *
 * La configuration provient de `@/lib/env`, qui ne lève jamais d'exception au
 * chargement : si le backend n'est pas joignable, la couche de données bascule
 * en mode démonstration autonome (voir `@/lib/backend`).
 */
export const supabase = createClient<Database>(supabaseConfig.url, supabaseConfig.anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'ppai-sst-quebec'
    }
  }
});

export const isSupabaseExplicitlyConfigured = supabaseConfig.isExplicitlyConfigured;
