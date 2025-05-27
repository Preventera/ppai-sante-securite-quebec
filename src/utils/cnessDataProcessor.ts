
import { CNESSTMetadata, LesionSectorielleData, AgentCausalData, SiegeLesionData } from "@/types/cnesst";

export class CNESSTDataProcessor {
  
  // Données par défaut CNESST pour démonstration
  static getDefaultCNESSTData(): CNESSTMetadata {
    const lesionsSecorielles: LesionSectorielleData[] = [
      {
        secteur_scian: "23",
        nom_secteur: "construction",
        nb_incidents_2023: 12847,
        taux_frequence: 4.2,
        gravite_moyenne: 85.3,
        agent_causal_principal: "Chutes de hauteur",
        siege_lesion_frequent: "Dos",
        cout_moyen_reclamation: 28500
      },
      {
        secteur_scian: "31-33",
        nom_secteur: "industrie",
        nb_incidents_2023: 8932,
        taux_frequence: 3.1,
        gravite_moyenne: 72.1,
        agent_causal_principal: "Machines et équipements",
        siege_lesion_frequent: "Mains",
        cout_moyen_reclamation: 19800
      },
      {
        secteur_scian: "44-45",
        nom_secteur: "services",
        nb_incidents_2023: 5621,
        taux_frequence: 2.8,
        gravite_moyenne: 45.7,
        agent_causal_principal: "Chutes de plain-pied",
        siege_lesion_frequent: "Genoux",
        cout_moyen_reclamation: 12400
      },
      {
        secteur_scian: "48-49",
        nom_secteur: "transport",
        nb_incidents_2023: 4892,
        taux_frequence: 3.8,
        gravite_moyenne: 68.9,
        agent_causal_principal: "Véhicules motorisés",
        siege_lesion_frequent: "Dos",
        cout_moyen_reclamation: 24300
      }
    ];

    const agentCausals: AgentCausalData[] = [
      {
        agent_causal: "Chutes de hauteur",
        categorie_risque: "Physique",
        secteur_principal: "Construction",
        probabilite_occurrence: 0.85,
        gravite_potentielle: 4.2,
        mesures_prevention_type: "Harnais + Formation",
        cout_prevention_moyen: 3500,
        efficacite_mesure: 0.92
      },
      {
        agent_causal: "Machines et équipements",
        categorie_risque: "Mécanique",
        secteur_principal: "Fabrication",
        probabilite_occurrence: 0.72,
        gravite_potentielle: 3.8,
        mesures_prevention_type: "Protecteurs + Lockout",
        cout_prevention_moyen: 2800,
        efficacite_mesure: 0.89
      },
      {
        agent_causal: "Manutention manuelle",
        categorie_risque: "Ergonomique",
        secteur_principal: "Tous secteurs",
        probabilite_occurrence: 0.95,
        gravite_potentielle: 2.9,
        mesures_prevention_type: "Formation + Équipements",
        cout_prevention_moyen: 1200,
        efficacite_mesure: 0.76
      },
      {
        agent_causal: "Véhicules motorisés",
        categorie_risque: "Transport",
        secteur_principal: "Transport",
        probabilite_occurrence: 0.68,
        gravite_potentielle: 4.5,
        mesures_prevention_type: "Formation + Maintenance",
        cout_prevention_moyen: 4200,
        efficacite_mesure: 0.84
      },
      {
        agent_causal: "Produits chimiques",
        categorie_risque: "Chimique",
        secteur_principal: "Fabrication",
        probabilite_occurrence: 0.45,
        gravite_potentielle: 3.1,
        mesures_prevention_type: "Ventilation + EPI",
        cout_prevention_moyen: 5600,
        efficacite_mesure: 0.91
      }
    ];

    const siegesLesions: SiegeLesionData[] = [
      {
        siege_lesion: "Dos",
        frequence_relative: 0.28,
        secteur_impact: "Construction",
        gravite_moyenne: 3.8,
        jours_arret_moyen: 45,
        cout_medical_moyen: 8500,
        mesures_prevention_specifiques: "Formation levage + Équipements aide"
      },
      {
        siege_lesion: "Mains",
        frequence_relative: 0.22,
        secteur_impact: "Fabrication",
        gravite_moyenne: 2.9,
        jours_arret_moyen: 28,
        cout_medical_moyen: 5200,
        mesures_prevention_specifiques: "Gants + Protecteurs machines"
      },
      {
        siege_lesion: "Genoux",
        frequence_relative: 0.15,
        secteur_impact: "Commerce",
        gravite_moyenne: 2.1,
        jours_arret_moyen: 35,
        cout_medical_moyen: 4800,
        mesures_prevention_specifiques: "Genouillères + Aménagement postes"
      }
    ];

    return {
      lesionsSecorielles,
      agentCausals,
      siegesLesions,
      validationStatus: {
        isValid: true,
        errors: [],
        warnings: [],
        dataQualityScore: 0.95
      },
      integrationRecommendations: [
        {
          id: 'sector-focus',
          type: 'predictive',
          description: 'Focus sur les chutes de hauteur pour le secteur construction',
          justification: 'Agent causal principal avec probabilité élevée (85%) et forte gravité (4.2/5)',
          priority: 'CRITIQUE',
          efficacitePrevu: 0.92,
          coutEstime: 3500,
          roi: 8.1,
          implementationSteps: [
            'Audit complet des équipements de protection',
            'Formation intensive sur l\'utilisation des harnais',
            'Inspection hebdomadaire des points d\'ancrage'
          ]
        }
      ]
    };
  }

  // Enrichir les prédictions avec les données CNESST
  static enrichPredictionsWithCNESST(
    sectorConfig: { secteur: string; groupePrioritaire: number },
    cnessData: CNESSTMetadata
  ) {
    const sectorData = cnessData.lesionsSecorielles.find(
      lesion => lesion.nom_secteur.toLowerCase() === sectorConfig.secteur.toLowerCase()
    );

    if (!sectorData) return null;

    // Ajuster les prédictions selon le groupe prioritaire
    const groupMultiplier = {
      1: 1.3, // Groupe 1 = risque élevé
      2: 1.0, // Groupe 2 = risque moyen
      3: 0.7  // Groupe 3 = risque faible
    };

    const multiplier = groupMultiplier[sectorConfig.groupePrioritaire as keyof typeof groupMultiplier] || 1.0;

    return {
      predictedFrequency: sectorData.taux_frequence * multiplier,
      predictedGravity: sectorData.gravite_moyenne * multiplier,
      predictedCost: sectorData.cout_moyen_reclamation * multiplier,
      primaryRisk: sectorData.agent_causal_principal,
      frequentInjurySite: sectorData.siege_lesion_frequent,
      confidence: 0.85
    };
  }

  // Générer des recommandations basées sur le secteur
  static generateSectorRecommendations(
    sectorConfig: { secteur: string; activitesPrincipales: string[] },
    cnessData: CNESSTMetadata
  ) {
    const relevantAgents = cnessData.agentCausals.filter(agent => 
      agent.secteur_principal.toLowerCase().includes(sectorConfig.secteur.toLowerCase()) ||
      agent.secteur_principal === 'Tous secteurs'
    );

    return relevantAgents
      .sort((a, b) => (b.probabilite_occurrence * b.gravite_potentielle) - (a.probabilite_occurrence * a.gravite_potentielle))
      .slice(0, 3)
      .map(agent => ({
        riskType: agent.agent_causal,
        category: agent.categorie_risque,
        probability: agent.probabilite_occurrence,
        gravity: agent.gravite_potentielle,
        preventiveMeasure: agent.mesures_prevention_type,
        estimatedCost: agent.cout_prevention_moyen,
        efficiency: agent.efficacite_mesure,
        roi: (agent.gravite_potentielle * 10000) / agent.cout_prevention_moyen // ROI estimé
      }));
  }
}
