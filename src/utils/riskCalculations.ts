import { Risk, RiskSummary } from '@/types/risk';

export const calculateRiskSummary = (risks: Risk[]): RiskSummary => {
  const totalRisks = risks.length;
  
  // Gérer le cas où il n'y a aucun risque pour éviter NaN
  if (totalRisks === 0) {
    return {
      totalRisks: 0,
      criticalRisks: 0,
      averageIndex: 0,
      residualIndex: 0
    };
  }
  
  const criticalRisks = risks.filter(risk => risk.initialRisk >= 15).length;
  const averageIndex = risks.reduce((sum, risk) => sum + risk.initialRisk, 0) / totalRisks;
  const residualIndex = risks.reduce((sum, risk) => sum + risk.residualRisk, 0) / totalRisks;

  return {
    totalRisks,
    criticalRisks,
    averageIndex: Math.round(averageIndex * 100) / 100,
    residualIndex: Math.round(residualIndex * 100) / 100
  };
};

export const filterRisksBySearch = (risks: Risk[], searchTerm: string): Risk[] => {
  if (!searchTerm) return risks;
  
  const searchLower = searchTerm.toLowerCase();
  
  return risks.filter(risk => 
    risk.name.toLowerCase().includes(searchLower) ||
    risk.category.toLowerCase().includes(searchLower) ||
    risk.phase.toLowerCase().includes(searchLower) ||
    risk.responsible.toLowerCase().includes(searchLower) ||
    risk.sector.toLowerCase().includes(searchLower) ||
    risk.id.toLowerCase().includes(searchLower)
  );
};

// Utilitaires supplémentaires pour l'analyse des risques
export const getRisksByStatus = (risks: Risk[]) => {
  return risks.reduce((acc, risk) => {
    acc[risk.status] = (acc[risk.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

export const getRisksBySector = (risks: Risk[]) => {
  return risks.reduce((acc, risk) => {
    acc[risk.sector] = (acc[risk.sector] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

export const getCriticalRisks = (risks: Risk[]) => {
  return risks.filter(risk => risk.initialRisk >= 15);
};

export const getHighRisksBySector = (risks: Risk[]) => {
  const criticalRisks = getCriticalRisks(risks);
  return getRisksBySector(criticalRisks);
};

// Calcul du taux de réduction des risques
export const calculateRiskReductionRate = (risks: Risk[]): number => {
  if (risks.length === 0) return 0;
  
  const totalInitialRisk = risks.reduce((sum, risk) => sum + risk.initialRisk, 0);
  const totalResidualRisk = risks.reduce((sum, risk) => sum + risk.residualRisk, 0);
  
  if (totalInitialRisk === 0) return 0;
  
  const reductionRate = ((totalInitialRisk - totalResidualRisk) / totalInitialRisk) * 100;
  return Math.round(reductionRate * 100) / 100;
};

// Validation des données de risque
export const validateRisk = (risk: Partial<Risk>): string[] => {
  const errors: string[] = [];
  
  if (!risk.name?.trim()) {
    errors.push("Le nom du risque est requis");
  }
  
  if (!risk.probability || risk.probability < 1 || risk.probability > 5) {
    errors.push("La probabilité doit être entre 1 et 5");
  }
  
  if (!risk.gravity || risk.gravity < 1 || risk.gravity > 5) {
    errors.push("La gravité doit être entre 1 et 5");
  }
  
  if (!risk.sector) {
    errors.push("Le secteur est requis");
  }
  
  if (!risk.responsible?.trim()) {
    errors.push("Le responsable est requis");
  }
  
  return errors;
};