export interface Risk {
  id: string;
  name: string;
  phase: string;
  category: string;
  probability: number; // 1-5
  gravity: number; // 1-5
  initialRisk: number; // probability × gravity
  measures: string;
  residualRisk: number;
  status: 'Contrôles actifs' | 'En surveillance' | 'Action requise' | 'Complété' | 'En contrôle';
  responsible: string;
  sector: 'Construction' | 'Électricité' | 'Sécurité' | 'Santé';
}

export interface RiskSummary {
  totalRisks: number;
  criticalRisks: number;
  averageIndex: number;
  residualIndex: number;
}

export type RiskStatus = Risk['status'];
export type RiskSector = Risk['sector'];