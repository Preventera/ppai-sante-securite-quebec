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
  registryRisks?: any[]; // Nouveau paramètre pour les risques du registre
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
    risksAnalyzed?: number; // Nouveau champ
    criticalRisksCount?: number; // Nouveau champ
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
      console.log('Génération via Supabase Edge Function avec données registre...');
      
      // Enrichissement avec données du registre si disponibles
      const enrichedParams = {
        ...params,
        registryRisks: this.formatRegistryRisks(params.registryRisks || [])
      };

      const { data, error } = await supabase.functions.invoke('generate-prevention-program', {
        body: enrichedParams
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
        tokens: data.metadata?.tokens || 0,
        risksAnalyzed: data.metadata?.risksAnalyzed || 0
      });

      return data;

    } catch (error) {
      console.error('Erreur génération IA:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('ANTHROPIC_API_KEY')) {
          throw new Error('❌ Clé API Claude non configurée dans Supabase.\n\n🔧 Pour résoudre:\n1. Allez dans votre tableau de bord Supabase\n2. Ajoutez votre ANTHROPIC_API_KEY dans les secrets\n3. Redémarrez la génération');
        }
        throw error;
      }
      
      throw new Error('Erreur inconnue lors de la génération IA');
    }
  }

  private formatRegistryRisks(risks: any[]): string {
    if (!risks || risks.length === 0) return '';
    
    const criticalRisks = risks.filter(r => r.initialRisk >= 15);
    const moderateRisks = risks.filter(r => r.initialRisk >= 10 && r.initialRisk < 15);
    
    let formattedRisks = '\n📊 ANALYSE DU REGISTRE DES RISQUES INTÉGRÉ:\n';
    
    if (criticalRisks.length > 0) {
      formattedRisks += `\n🔴 RISQUES CRITIQUES (${criticalRisks.length}):\n`;
      criticalRisks.forEach(risk => {
        formattedRisks += `- ${risk.description} (P×G: ${risk.initialRisk})\n`;
        formattedRisks += `  • Contrôles: ${risk.controlMeasures}\n`;
        formattedRisks += `  • Efficacité: ${risk.controlEffectiveness}%\n`;
        formattedRisks += `  • Statut: ${risk.status}\n`;
      });
    }
    
    if (moderateRisks.length > 0) {
      formattedRisks += `\n🟡 RISQUES MODÉRÉS (${moderateRisks.length}):\n`;
      moderateRisks.forEach(risk => {
        formattedRisks += `- ${risk.description} (P×G: ${risk.initialRisk})\n`;
      });
    }
    
    formattedRisks += '\n🎯 DIRECTIVES D\'INTÉGRATION:\n';
    formattedRisks += '- Prioriser les mesures pour les risques critiques identifiés\n';
    formattedRisks += '- Inclure les contrôles existants et proposer des améliorations\n';
    formattedRisks += '- Référencer les responsables actuels pour la continuité\n';
    formattedRisks += '- Adapter l\'échéancier selon le statut des risques\n';
    
    return formattedRisks;
  }

  setConfig(config: AIConfig): void {
    this.config = config;
    localStorage.setItem('ai_config', JSON.stringify(config));
  }

  getConfig(): AIConfig {
    return this.config;
  }

  hasApiKey(): boolean {
    return true;
  }

  getProviderName(): string {
    return 'Claude 3.5 Sonnet (Supabase)';
  }
}
