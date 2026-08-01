import { supabase } from "@/integrations/supabase/client";
import { Risk } from "@/types/risk";
import { getBackendMode } from "@/lib/backend";
import { generateLocalPreventionProgram } from "@/services/localProgramGenerator";
import type { ContexteEtablissement } from "@/lib/lmrsst";
import { readValue, writeValue } from "@/lib/localStore";
import { journaliserExecution } from "@/services/executionLog";
import { construireProvenance } from "@/lib/provenance";
import { secteurPourCode } from "@/lib/scianNiveaux";

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
  /** Risques du registre à intégrer réellement dans le programme généré. */
  registryRisks?: Risk[];
  /**
   * Précisions d'assujettissement au-delà de l'effectif : mutuelle de
   * prévention, regroupement multiétablissements, jours d'atteinte du seuil.
   * Elles changent le mécanisme exigé, pas seulement sa présentation.
   */
  contexte?: Omit<ContexteEtablissement, 'effectif'>;
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
    /** `claude` si généré par l'Edge Function, `local` si généré par le repli. */
    source?: 'claude' | 'local';
    tokens?: number;
    risksAnalyzed?: number;
    criticalRisksCount?: number;
    /** Instantané réglementaire figé, joint quel que soit le moteur. */
    provenance?: ReturnType<typeof construireProvenance>;
  };
}

export type AIProvider = 'openai' | 'claude';

interface AIConfig {
  provider: AIProvider;
  apiKey: string;
}

/** Éléments dont la présence est vérifiée pour la conformité de base. */
const COMPLIANCE_KEYWORDS = [
  'identification',
  'risques',
  'prévention',
  'mesures',
  'responsable',
  'échéancier',
  'formation',
  'surveillance'
];

const checkCompliance = (content: string): boolean => {
  const lower = content.toLowerCase();
  return COMPLIANCE_KEYWORDS.every(keyword => lower.includes(keyword));
};

const extractLegalReferences = (content: string): string[] => {
  const references = new Set<string>();
  const patterns = [
    /LSST\s+(?:art\.|article)\s*([\d.]+)/gi,
    /RSST\s+(?:art\.|article)\s*([\d.]+)/gi,
    /CSTC\s+(?:art\.|article)\s*([\d.]+)/gi
  ];
  const labels = ['LSST', 'RSST', 'CSTC'];

  patterns.forEach((pattern, index) => {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      references.add(`${labels[index]} art. ${match[1]}`);
    }
  });

  return [...references];
};

/**
 * Reprend la configuration écrite sous l'ancienne clé non préfixée.
 *
 * Le stockage local est désormais cloisonné sous « ppai: ». Sans cette
 * reprise, une clé d'API déjà saisie disparaîtrait sans un mot, obligeant
 * l'utilisateur à la ressaisir sans comprendre pourquoi. Transitoire : à
 * retirer une fois le parc migré.
 */
function reprendreConfigHeritee(): AIConfig | null {
  try {
    const raw = window.localStorage?.getItem('ai_config');
    if (!raw) return null;
    const config = JSON.parse(raw) as AIConfig;
    writeValue('ai_config', config);
    window.localStorage.removeItem('ai_config');
    return config;
  } catch {
    // Stockage refusé ou contenu illisible : on repart des valeurs par défaut.
    return null;
  }
}

export class AIGenerationService {
  private config: AIConfig;

  constructor() {
    // Ce constructeur est appelé pendant le rendu de React. Un accès direct à
    // localStorage y lève une exception lorsque le navigateur refuse le
    // stockage — prévention du pistage stricte, mode privé, politique
    // d'entreprise — et une valeur corrompue faisait échouer JSON.parse. Dans
    // les deux cas l'arbre React entier était démonté : page blanche.
    const defaut: AIConfig = { provider: 'claude', apiKey: 'configured-in-supabase' };
    const stocke = readValue<AIConfig | null>('ai_config', null);
    this.config = stocke ?? reprendreConfigHeritee() ?? defaut;
  }

  /**
   * Génère un programme de prévention.
   *
   * Tente d'abord l'Edge Function (Claude). Si le backend n'est pas disponible
   * ou si l'appel échoue — clé API absente, réseau coupé —, la génération se
   * poursuit avec le moteur local déterministe. La démonstration reste donc
   * toujours fonctionnelle, et `metadata.source` indique la provenance réelle.
   */
  async generatePreventionProgram(params: ProgramGenerationParams): Promise<AIGenerationResponse> {
    const risks = params.registryRisks ?? [];
    const criticalRisksCount = risks.filter(risk => risk.initialRisk >= 15).length;

    // Contexte non nominatif joint au journal : de quoi diagnostiquer une
    // génération lente ou en échec, sans recopier le prompt ni le document.
    const contexteJournal = {
      secteurScian: params.secteurScian,
      nombreEmployes: params.nombreEmployes,
      typeDocument: params.typeDocument,
      nbRisques: risks.length
    };
    const debut = Date.now();

    const backendMode = await getBackendMode();

    if (backendMode === 'live') {
      try {
        const { data, error } = await supabase.functions.invoke('generate-prevention-program', {
          body: {
            ...params,
            registryRisks: this.formatRegistryRisks(risks),
            risksAnalyzed: risks.length,
            criticalRisksCount
          }
        });

        if (error) throw new Error(error.message);
        if (!data?.content) throw new Error("Aucun contenu généré par l'IA");

        void journaliserExecution({
          moteur: 'claude',
          statut: 'completed',
          dureeMs: Date.now() - debut,
          contexte: contexteJournal,
          jetons: data.metadata?.tokens ?? 0,
          longueurDocument: data.content?.length ?? 0
        });

        return {
          ...data,
          metadata: {
            ...data.metadata,
            source: 'claude' as const,
            provenance: this.provenancePour(params, risks, 'claude', data.metadata?.model ?? null)
          }
        };
      } catch (error) {
        console.warn(
          '[PPAI] Génération Claude indisponible, repli sur le moteur local:',
          error instanceof Error ? error.message : error
        );
        // L'échec est consigné même si le repli réussit : sans cela, un backend
        // durablement en panne resterait invisible, la génération semblant
        // toujours fonctionner.
        void journaliserExecution({
          moteur: 'claude',
          statut: 'failed',
          dureeMs: Date.now() - debut,
          contexte: contexteJournal,
          messageErreur: error instanceof Error ? error.message : String(error)
        });
      }
    }

    const resultatLocal = this.generateLocally(params, risks, criticalRisksCount);
    void journaliserExecution({
      moteur: 'local',
      statut: 'completed',
      dureeMs: Date.now() - debut,
      contexte: contexteJournal,
      longueurDocument: resultatLocal.content.length
    });
    return resultatLocal;
  }

  /**
   * Instantané réglementaire du document.
   *
   * Construit à partir des MÊMES entrées quel que soit le moteur : un document
   * produit par Claude et un document produit localement doivent être traçables
   * de la même façon. C'est une méthode et non une fermeture locale — déclarée
   * dans `generatePreventionProgram`, elle n'était pas visible depuis
   * `generateLocally`, et toute génération locale levait une `ReferenceError`.
   */
  private provenancePour(
    params: ProgramGenerationParams,
    risks: Risk[],
    source: string,
    modele?: string | null
  ) {
    const niveauSectoriel = secteurPourCode(params.secteurScian)?.niveau;
    return construireProvenance({
      contexte: {
        effectif: params.nombreEmployes,
        ...params.contexte,
        niveauRisque: params.contexte?.niveauRisque ?? niveauSectoriel
      },
      codeScianSaisi: params.secteurScian,
      sousSecteurRetenu: secteurPourCode(params.secteurScian)?.code ?? null,
      risques: risks,
      source,
      modele
    });
  }

  /** Génération locale déterministe, sans réseau ni clé API. */
  private generateLocally(
    params: ProgramGenerationParams,
    risks: Risk[],
    criticalRisksCount: number
  ): AIGenerationResponse {
    const content = generateLocalPreventionProgram({
      companyName: params.companyName,
      secteurScian: params.secteurScian,
      groupePrioritaire: params.groupePrioritaire,
      nombreEmployes: params.nombreEmployes,
      activitesPrincipales: params.activitesPrincipales,
      typeDocument: params.typeDocument,
      acteurResponsable: params.acteurResponsable,
      risks,
      contexte: params.contexte
    });

    return {
      content,
      metadata: {
        secteur: params.secteurScian,
        groupe: params.groupePrioritaire,
        conformite: checkCompliance(content),
        referencesLegales: extractLegalReferences(content),
        generatedAt: new Date().toISOString(),
        model: 'PPAI local',
        source: 'local',
        provenance: this.provenancePour(params, risks, 'local', 'PPAI local'),
        tokens: 0,
        risksAnalyzed: risks.length,
        criticalRisksCount
      }
    };
  }

  /** Met en forme le registre pour le prompt, en priorisant par criticité. */
  private formatRegistryRisks(risks: Risk[]): string {
    if (risks.length === 0) return '';

    const criticalRisks = risks.filter(risk => risk.initialRisk >= 15);
    const moderateRisks = risks.filter(risk => risk.initialRisk >= 10 && risk.initialRisk < 15);

    let formatted = '\n📊 REGISTRE DES RISQUES DE L\'ÉTABLISSEMENT :\n';

    if (criticalRisks.length > 0) {
      formatted += `\n🔴 RISQUES CRITIQUES (${criticalRisks.length}) :\n`;
      criticalRisks.forEach(risk => {
        formatted += `- [${risk.id}] ${risk.name} — P×G : ${risk.probability}×${risk.gravity} = ${risk.initialRisk}\n`;
        formatted += `  • Phase : ${risk.phase || 'non précisée'} · Catégorie : ${risk.category || 'non précisée'}\n`;
        formatted += `  • Mesures actuelles : ${risk.measures || 'AUCUNE — à définir'}\n`;
        formatted += `  • Indice résiduel visé : ${risk.residualRisk} · Statut : ${risk.status}\n`;
        formatted += `  • Responsable : ${risk.responsible || 'NON DÉSIGNÉ'}\n`;
      });
    }

    if (moderateRisks.length > 0) {
      formatted += `\n🟡 RISQUES MODÉRÉS (${moderateRisks.length}) :\n`;
      moderateRisks.forEach(risk => {
        formatted += `- [${risk.id}] ${risk.name} (indice ${risk.initialRisk}) — ${risk.measures || 'aucune mesure'}\n`;
      });
    }

    formatted += '\n🎯 DIRECTIVES D\'INTÉGRATION :\n';
    formatted += "- Traiter les risques critiques en premier dans l'échéancier\n";
    formatted += '- Reprendre les contrôles existants et proposer des améliorations concrètes\n';
    formatted += '- Signaler explicitement tout risque sans responsable ou sans mesure\n';
    formatted += '- Rattacher chaque mesure à un niveau de la hiérarchie de prévention (art. 51)\n';

    return formatted;
  }

  setConfig(config: AIConfig): void {
    this.config = config;
    writeValue('ai_config', config);
  }

  getConfig(): AIConfig {
    return this.config;
  }

  hasApiKey(): boolean {
    return true;
  }

  getProviderName(): string {
    return 'Claude (Supabase Edge Function) avec repli local';
  }
}
