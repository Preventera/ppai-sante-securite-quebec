import { supabase } from '@/integrations/supabase/client';
import { Risk } from '@/types/risk';

export interface DatabaseRisk {
  id: string;
  code: string;
  name: string;
  phase: string | null;
  category: string | null;
  probability: number;
  gravity: number;
  initial_risk: number;
  measures: string | null;
  residual_risk: number | null;
  status: string;
  responsible: string | null;
  sector: string;
  created_at: string;
  updated_at: string;
}

export const riskService = {
  // Récupérer tous les risques
  async getAllRisks(): Promise<Risk[]> {
    const { data, error } = await supabase
      .from('risks')
      .select('*')
      .order('initial_risk', { ascending: false });

    if (error) {
      console.error('Erreur:', error);
      return [];
    }

    return data?.map(risk => ({
      id: risk.code,
      name: risk.name,
      phase: risk.phase || '',
      category: risk.category || '',
      probability: risk.probability,
      gravity: risk.gravity,
      initialRisk: risk.initial_risk,
      measures: risk.measures || '',
      residualRisk: risk.residual_risk || 0,
      status: risk.status,
      responsible: risk.responsible || '',
      sector: risk.sector
    })) || [];
  }
};