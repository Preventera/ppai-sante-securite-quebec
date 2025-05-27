
import { supabase } from "@/integrations/supabase/client";

interface ProgramGenerationParams {
  companyName: string;
  secteurScian: string;
  groupePrioritaire: number;
  nombreEmployes: number;
  activitesPrincipales: string;
  typeDocument: string;
  acteurResponsable: string;
  risquesIdentifies?: string[];
  cnessData?: any;
  customPrompt?: string;
}

interface AIGenerationResponse {
  content: string;
  metadata: {
    secteur: string;
    groupe: number;
    conformite: boolean;
    referencesLegales: string[];
    generatedAt?: string;
    model?: string;
    tokens?: number;
  };
}

export type AIProvider = 'openai' | 'claude';

interface AIConfig {
  provider: AIProvider;
  apiKey: string;
}

export class AIGenerationService {
  private config: AIConfig;
  
  constructor() {
    const savedConfig = localStorage.getItem('ai_config');
    this.config = savedConfig ? JSON.parse(savedConfig) : {
      provider: 'claude',
      apiKey: 'configured-in-supabase'
    };
  }

  async generatePreventionProgram(params: ProgramGenerationParams): Promise<AIGenerationResponse> {
    try {
      console.log('Génération via Supabase Edge Function...');
      
      const { data, error } = await supabase.functions.invoke('generate-prevention-program', {
        body: params
      });

      if (error) {
        console.error('Erreur Edge Function:', error);
        throw new Error(`Erreur Edge Function: ${error.message}`);
      }

      if (!data || !data.content) {
        throw new Error('Aucun contenu généré par l\'IA');
      }

      console.log('Programme généré avec succès:', {
        conformite: data.metadata?.conformite,
        references: data.metadata?.referencesLegales?.length || 0,
        tokens: data.metadata?.tokens || 0
      });

      return data;

    } catch (error) {
      console.error('Erreur génération IA:', error);
      
      // Message d'erreur plus informatif
      if (error instanceof Error) {
        if (error.message.includes('ANTHROPIC_API_KEY')) {
          throw new Error('❌ Clé API Claude non configurée dans Supabase.\n\n🔧 Pour résoudre:\n1. Allez dans votre tableau de bord Supabase\n2. Ajoutez votre ANTHROPIC_API_KEY dans les secrets\n3. Redémarrez la génération');
        }
        throw error;
      }
      
      throw new Error('Erreur inconnue lors de la génération IA');
    }
  }

  setConfig(config: AIConfig): void {
    this.config = config;
    localStorage.setItem('ai_config', JSON.stringify(config));
  }

  getConfig(): AIConfig {
    return this.config;
  }

  hasApiKey(): boolean {
    // Avec Supabase, on considère toujours que l'API est disponible
    return true;
  }

  getProviderName(): string {
    return 'Claude 3.5 Sonnet (Supabase)';
  }
}
