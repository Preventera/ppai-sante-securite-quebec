import { Risk, RiskSummary } from "@/types/risk";
import { riskService } from "@/services/riskService";
import { RSST, referenceBreve } from "@/lib/instruments";

/**
 * Les champs `compliance` nommaient auparavant des articles du RSST sous la
 * forme « RSST Art. 2.4.1 » — la numérotation du CSTC appliquée au RSST, qui
 * numérote en entiers. Ces références remontaient jusque dans le programme
 * généré. Elles nomment désormais l'instrument, jamais l'article, tant que le
 * texte du règlement n'a pas été consulté (voir `src/lib/instruments.ts`).
 */

export interface RiskAnalysis {
  criticalRisks: Risk[];
  moderateRisks: Risk[];
  lowRisks: Risk[];
  summary: RiskSummary;
  recommendations: string[];
  priorityMeasures: PriorityMeasure[];
}

export interface PriorityMeasure {
  riskId: string;
  riskName: string;
  currentMeasure: string;
  suggestedImprovement: string;
  priority: 'Immédiate' | 'Court terme' | 'Moyen terme';
  estimatedCost: 'Faible' | 'Modéré' | 'Élevé';
  implementationTime: string;
}

export interface ProgramSuggestion {
  sectionTitle: string;
  content: string;
  basedOnRisks: string[];
  priority: number;
  compliance: string[];
}

export class RiskIntegrationService {
  /**
   * Récupère les risques depuis le service existant
   */
  async getRisks(): Promise<Risk[]> {
    try {
      // Utilise le service existant
      const risks = await riskService.getAllRisks();
      return risks || this.getMockRisks();
    } catch (error) {
      console.error('Erreur lors de la récupération des risques:', error);
      return this.getMockRisks(); // Données de fallback
    }
  }

  /**
   * Données de démonstration si Supabase n'est pas accessible
   */
  private getMockRisks(): Risk[] {
    return [
      {
        id: '1',
        name: 'Chute de hauteur lors des travaux de toiture',
        phase: 'Travaux en hauteur',
        category: 'Sécurité',
        probability: 4,
        gravity: 5,
        initialRisk: 20,
        measures: 'Harnais de sécurité, garde-corps temporaires',
        residualRisk: 8,
        status: 'Action requise',
        responsible: 'Chef de chantier',
        sector: 'Construction'
      },
      {
        id: '2',
        name: 'Exposition aux produits chimiques',
        phase: 'Manipulation des matériaux',
        category: 'Santé',
        probability: 3,
        gravity: 4,
        initialRisk: 12,
        measures: 'EPI chimiques, ventilation',
        residualRisk: 6,
        status: 'Contrôles actifs',
        responsible: 'Responsable HSE',
        sector: 'Construction'
      },
      {
        id: '3',
        name: 'Blessure par machine',
        phase: 'Production',
        category: 'Sécurité',
        probability: 2,
        gravity: 4,
        initialRisk: 8,
        measures: 'Protections machines, formation',
        residualRisk: 4,
        status: 'En contrôle',
        responsible: 'Superviseur production',
        sector: 'Construction'
      }
    ];
  }

  /**
   * Récupère et analyse tous les risques du registre
   */
  async getRiskAnalysis(sector?: string): Promise<RiskAnalysis> {
    try {
      // Récupération des risques
      const allRisks = await this.getRisks();
      
      // Filtrage par secteur si spécifié
      const risks = sector 
        ? allRisks.filter(risk => this.matchesSector(risk.sector, sector))
        : allRisks;

      // Classification par criticité
      const criticalRisks = risks.filter(risk => risk.initialRisk >= 15);
      const moderateRisks = risks.filter(risk => risk.initialRisk >= 10 && risk.initialRisk < 15);
      const lowRisks = risks.filter(risk => risk.initialRisk < 10);

      // Calcul du résumé
      const summary: RiskSummary = {
        totalRisks: risks.length,
        criticalRisks: criticalRisks.length,
        averageIndex: risks.length > 0 ? risks.reduce((sum, r) => sum + r.initialRisk, 0) / risks.length : 0,
        residualIndex: risks.length > 0 ? risks.reduce((sum, r) => sum + r.residualRisk, 0) / risks.length : 0
      };

      // Génération de recommandations
      const recommendations = this.generateRecommendations(criticalRisks, moderateRisks);
      
      // Mesures prioritaires
      const priorityMeasures = this.generatePriorityMeasures(criticalRisks);

      return {
        criticalRisks,
        moderateRisks,
        lowRisks,
        summary,
        recommendations,
        priorityMeasures
      };
    } catch (error) {
      console.error('Erreur lors de l\'analyse des risques:', error);
      throw new Error('Impossible de récupérer l\'analyse des risques');
    }
  }

  /**
   * Génère des suggestions de contenu pour le programme basées sur les risques
   */
  async generateProgramSuggestions(
    sector: string, 
    documentType: string, 
    actor: string
  ): Promise<ProgramSuggestion[]> {
    const riskAnalysis = await this.getRiskAnalysis(sector);
    const suggestions: ProgramSuggestion[] = [];

    // Suggestions basées sur les risques critiques
    if (riskAnalysis.criticalRisks.length > 0) {
      suggestions.push({
        sectionTitle: "Mesures d'urgence pour risques critiques",
        content: this.generateCriticalRiskContent(riskAnalysis.criticalRisks, actor),
        basedOnRisks: riskAnalysis.criticalRisks.map(r => r.name),
        priority: 1,
        compliance: ["LSST, art. 51", referenceBreve(RSST)]
      });
    }

    // Suggestions pour formation spécialisée
    const trainingNeeds = this.identifyTrainingNeeds(riskAnalysis.criticalRisks, riskAnalysis.moderateRisks);
    if (trainingNeeds.length > 0) {
      suggestions.push({
        sectionTitle: "Programme de formation spécialisée",
        content: this.generateTrainingContent(trainingNeeds, actor),
        basedOnRisks: trainingNeeds,
        priority: 2,
        compliance: ["LSST", referenceBreve(RSST)]
      });
    }

    // Suggestions pour équipements de protection
    const epiNeeds = this.identifyEPINeeds(riskAnalysis.criticalRisks);
    if (epiNeeds.length > 0) {
      suggestions.push({
        sectionTitle: "Équipements de protection individuelle",
        content: this.generateEPIContent(epiNeeds),
        basedOnRisks: epiNeeds.map(r => r.name),
        priority: 3,
        compliance: [referenceBreve(RSST)]
      });
    }

    // Suggestions pour surveillance et contrôle
    suggestions.push({
      sectionTitle: "Surveillance et contrôle continu",
      content: this.generateMonitoringContent(riskAnalysis, actor),
      basedOnRisks: riskAnalysis.criticalRisks.concat(riskAnalysis.moderateRisks).map(r => r.name),
      priority: 4,
      compliance: ["LSST", referenceBreve(RSST)]
    });

    return suggestions.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Génère un prompt enrichi avec les données du registre
   */
  generateEnrichedPrompt(
    basePrompt: string, 
    riskAnalysis: RiskAnalysis, 
    suggestions: ProgramSuggestion[]
  ): string {
    let enrichedPrompt = basePrompt;

    // Ajout de l'analyse des risques
    enrichedPrompt += "\n\n📊 ANALYSE DU REGISTRE DES RISQUES INTÉGRÉE:\n";
    
    if (riskAnalysis.criticalRisks.length > 0) {
      enrichedPrompt += `\n🔴 RISQUES CRITIQUES (${riskAnalysis.criticalRisks.length}):\n`;
      riskAnalysis.criticalRisks.forEach(risk => {
        enrichedPrompt += `- ${risk.name} (P×G: ${risk.initialRisk}, Phase: ${risk.phase})\n`;
        enrichedPrompt += `  • Mesures actuelles: ${risk.measures}\n`;
        enrichedPrompt += `  • Statut: ${risk.status}\n`;
        enrichedPrompt += `  • Responsable: ${risk.responsible}\n`;
      });
    }

    if (riskAnalysis.moderateRisks.length > 0) {
      enrichedPrompt += `\n🟡 RISQUES MODÉRÉS (${riskAnalysis.moderateRisks.length}):\n`;
      riskAnalysis.moderateRisks.forEach(risk => {
        enrichedPrompt += `- ${risk.name} (P×G: ${risk.initialRisk})\n`;
      });
    }

    // Ajout des suggestions prioritaires
    enrichedPrompt += "\n🎯 DIRECTIVES D'INTÉGRATION PERSONNALISÉES:\n";
    suggestions.forEach((suggestion, index) => {
      enrichedPrompt += `${index + 1}. ${suggestion.sectionTitle}\n`;
      enrichedPrompt += `   Basé sur: ${suggestion.basedOnRisks.join(', ')}\n`;
    });

    enrichedPrompt += "\n📋 DIRECTIVES POUR LA GÉNÉRATION:\n";
    enrichedPrompt += "- Prioriser les mesures pour les risques critiques identifiés\n";
    enrichedPrompt += "- Inclure les contrôles existants et proposer des améliorations concrètes\n";
    enrichedPrompt += "- Référencer les responsables actuels pour assurer la continuité\n";
    enrichedPrompt += "- Adapter l'échéancier selon le statut et la criticité des risques\n";
    enrichedPrompt += "- Proposer des indicateurs de suivi pour chaque risque identifié\n";

    return enrichedPrompt;
  }

  // Méthodes privées utilitaires

  private mapStatus(status: string): Risk['status'] {
    const statusMap = {
      'active': 'Contrôles actifs',
      'monitoring': 'En surveillance', 
      'action_required': 'Action requise',
      'completed': 'Complété',
      'controlled': 'En contrôle'
    };
    return statusMap[status] || 'En surveillance';
  }

  private mapSector(sector: string): Risk['sector'] {
    if (!sector) return 'Construction';
    
    const sectorMap = {
      'construction': 'Construction',
      'electricity': 'Électricité',
      'security': 'Sécurité',
      'health': 'Santé'
    };
    
    return sectorMap[sector.toLowerCase()] || 'Construction';
  }

  private matchesSector(riskSector: string, targetSector: string): boolean {
    const sectorMapping = {
      "1": ["Construction"],
      "2": ["Manufacturier", "Production"],
      "3": ["Municipal", "Alimentaire"],
      "4": ["Bureaux", "Services"]
    };

    const mappedSectors = sectorMapping[targetSector] || [targetSector];
    return mappedSectors.some(sector => 
      riskSector.toLowerCase().includes(sector.toLowerCase())
    );
  }

  private generateRecommendations(criticalRisks: Risk[], moderateRisks: Risk[]): string[] {
    const recommendations: string[] = [];

    if (criticalRisks.length > 0) {
      recommendations.push(
        `Traitement prioritaire de ${criticalRisks.length} risque(s) critique(s) identifié(s)`
      );
    }

    if (moderateRisks.length > 2) {
      recommendations.push(
        `Surveillance renforcée de ${moderateRisks.length} risques modérés`
      );
    }

    const actionRequiredRisks = criticalRisks.filter(r => r.status === 'Action requise');
    if (actionRequiredRisks.length > 0) {
      recommendations.push(
        `Mise à jour immédiate requise pour ${actionRequiredRisks.length} risque(s)`
      );
    }

    return recommendations;
  }

  private generatePriorityMeasures(criticalRisks: Risk[]): PriorityMeasure[] {
    return criticalRisks.map(risk => ({
      riskId: risk.id,
      riskName: risk.name,
      currentMeasure: risk.measures,
      suggestedImprovement: this.generateImprovementSuggestion(risk),
      priority: risk.initialRisk >= 20 ? 'Immédiate' : 'Court terme',
      estimatedCost: this.estimateCost(risk),
      implementationTime: this.estimateImplementationTime(risk)
    }));
  }

  private generateCriticalRiskContent(risks: Risk[], actor: string): string {
    const actorResponsibilities = {
      "CoSS": "coordonner l'implémentation",
      "Comité SST": "superviser l'application",
      "Employeur": "autoriser et financer",
      "Représentant SST": "former et sensibiliser"
    };

    let content = `En tant que ${actor}, vous devez ${actorResponsibilities[actor] || 'traiter'} les risques suivants:\n\n`;
    
    risks.forEach((risk, index) => {
      content += `${index + 1}. ${risk.name}\n`;
      content += `   - Criticité: ${risk.initialRisk}/25\n`;
      content += `   - Mesures actuelles: ${risk.measures}\n`;
      content += `   - Action requise: Révision immédiate des contrôles\n\n`;
    });

    return content;
  }

  private generateTrainingContent(trainingNeeds: string[], actor: string): string {
    return `Formations prioritaires identifiées:\n${trainingNeeds.map(need => `- ${need}`).join('\n')}`;
  }

  private generateEPIContent(epiNeeds: Risk[]): string {
    return `Équipements requis pour:\n${epiNeeds.map(risk => `- ${risk.name}: ${this.suggestEPI(risk)}`).join('\n')}`;
  }

  private generateMonitoringContent(analysis: RiskAnalysis, actor: string): string {
    return `Surveillance continue requise pour ${analysis.summary.totalRisks} risques identifiés. Fréquence de révision recommandée: ${analysis.criticalRisks.length > 0 ? 'mensuelle' : 'trimestrielle'}.`;
  }

  private identifyTrainingNeeds(criticalRisks: Risk[], moderateRisks: Risk[]): string[] {
    const allRisks = [...criticalRisks, ...moderateRisks];
    const trainingMap = {
      'hauteur': 'Formation travail en hauteur',
      'machine': 'Formation sécurité machine',
      'chimique': 'Formation manipulation produits chimiques',
      'ergonomie': 'Formation gestes et postures'
    };

    const needs = new Set<string>();
    allRisks.forEach(risk => {
      Object.keys(trainingMap).forEach(keyword => {
        if (risk.name.toLowerCase().includes(keyword)) {
          needs.add(trainingMap[keyword]);
        }
      });
    });

    return Array.from(needs);
  }

  private identifyEPINeeds(risks: Risk[]): Risk[] {
    return risks.filter(risk => 
      risk.name.toLowerCase().includes('chute') ||
      risk.name.toLowerCase().includes('projection') ||
      risk.name.toLowerCase().includes('bruit') ||
      risk.name.toLowerCase().includes('chimique')
    );
  }

  private generateImprovementSuggestion(risk: Risk): string {
    if (risk.initialRisk >= 20) {
      return "Révision complète des mesures de contrôle et implémentation de contrôles redondants";
    } else if (risk.initialRisk >= 15) {
      return "Renforcement des mesures existantes et surveillance accrue";
    }
    return "Optimisation des contrôles actuels";
  }

  private estimateCost(risk: Risk): 'Faible' | 'Modéré' | 'Élevé' {
    if (risk.initialRisk >= 20) return 'Élevé';
    if (risk.initialRisk >= 15) return 'Modéré';
    return 'Faible';
  }

  private estimateImplementationTime(risk: Risk): string {
    if (risk.initialRisk >= 20) return "1-2 semaines";
    if (risk.initialRisk >= 15) return "2-4 semaines";
    return "1-2 mois";
  }

  private suggestEPI(risk: Risk): string {
    const epiSuggestions = {
      'chute': 'Harnais de sécurité, casque',
      'projection': 'Lunettes de protection, écran facial',
      'bruit': 'Protecteurs auditifs',
      'chimique': 'Gants chimiques, masque respiratoire'
    };

    for (const [keyword, epi] of Object.entries(epiSuggestions)) {
      if (risk.name.toLowerCase().includes(keyword)) {
        return epi;
      }
    }
    return 'EPI adapté au risque';
  }
}

export const riskIntegrationService = new RiskIntegrationService();