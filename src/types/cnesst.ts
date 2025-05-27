export interface LesionSectorielleData {
  secteur_scian: string;
  nom_secteur: string;
  nb_incidents_2023: number;
  taux_frequence: number;
  gravite_moyenne: number;
  agent_causal_principal: string;
  siege_lesion_frequent: string;
  cout_moyen_reclamation: number;
  _lineNumber?: number; // Pour debugging CSV parsing
}

export interface AgentCausalData {
  agent_causal: string;
  categorie_risque: string;
  secteur_principal: string;
  probabilite_occurrence: number;
  gravite_potentielle: number;
  mesures_prevention_type: string;
  cout_prevention_moyen: number;
  efficacite_mesure: number;
  _lineNumber?: number; // Pour debugging CSV parsing
}

export interface SiegeLesionData {
  siege_lesion: string;
  frequence_relative: number;
  secteur_impact: string;
  gravite_moyenne: number;
  jours_arret_moyen: number;
  cout_medical_moyen: number;
  mesures_prevention_specifiques: string;
  _lineNumber?: number; // Pour debugging CSV parsing
}

export interface CNESSTMetadata {
  lesionsSecorielles: LesionSectorielleData[];
  agentCausals: AgentCausalData[];
  siegesLesions: SiegeLesionData[];
  validationStatus: ValidationResult;
  integrationRecommendations: AIRecommendation[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  dataQualityScore: number;
}

export interface AIRecommendation {
  id: string;
  type: 'preventive' | 'corrective' | 'predictive';
  description: string;
  justification: string;
  priority: 'CRITIQUE' | 'ÉLEVÉE' | 'MODÉRÉE';
  efficacitePrevu: number;
  coutEstime: number;
  roi: number;
  implementationSteps: string[];
}

export interface RiskMappingResult {
  mappedRisks: RiskPrediction[];
  sectorBenchmarks: SectorBenchmark[];
  recommendations: AIRecommendation[];
  confidenceScore: number;
}

export interface RiskPrediction {
  riskType: string;
  probability: number;
  gravity: number;
  confidenceScore: number;
  cnessBaseline: number;
  establishmentDeviation: number;
}

export interface SectorBenchmark {
  metric: string;
  sectorAverage: number;
  establishmentValue: number;
  percentile: number;
  trend: 'improving' | 'degrading' | 'stable';
}
