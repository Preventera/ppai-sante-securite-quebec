import { Risk } from '@/types/risk';

export const mockRisks: Risk[] = [
  {
    id: "RC4-001",
    name: "Chute d'objets depuis grue mobile 30T",
    phase: "Démolition",
    category: "Équipements de levage",
    probability: 4,
    gravity: 5,
    initialRisk: 20,
    measures: "Balisage zone de sécurité + attestation de conformité équipements + formation opérateur",
    residualRisk: 8,
    status: "Contrôles actifs",
    responsible: "Chef de chantier",
    sector: "Construction"
  },
  // ... (les 14 autres risques)
];