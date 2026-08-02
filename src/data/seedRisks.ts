import { Risk } from '@/types/risk'

/**
 * Registre des risques de référence, utilisé comme jeu de démonstration et
 * comme seed de la base en mode « live ».
 *
 * Les mesures NOMMENT l'instrument applicable, sans le citer à l'article :
 *  - CSTC : Code de sécurité pour les travaux de construction (RLRQ c. S-2.1, r. 4)
 *  - RSST : Règlement sur la santé et la sécurité du travail (RLRQ c. S-2.1, r. 13)
 *  - LSST : Loi sur la santé et la sécurité du travail (RLRQ c. S-2.1)
 *
 * POURQUOI PLUS DE NUMÉROS D'ARTICLES
 *   Ce jeu portait treize renvois précis — « CSTC art. 3.9.1 », « RSST art. 297
 *   et s. », « RSST annexe I » — hérités de la génération initiale et jamais
 *   vérifiés sur le texte officiel. Un jeu de démonstration se montre à un
 *   acheteur : une citation fausse s'y voit autant qu'ailleurs. Ils seront
 *   rétablis, un par un, quand le texte des deux règlements aura été consulté.
 *   Voir `src/lib/instruments.ts`.
 *
 * Invariant : initialRisk = probability × gravity, et residualRisk ≤ initialRisk.
 */
export const seedRisks: Risk[] = [
  {
    id: 'RC4-001',
    name: "Chute d'objets depuis grue mobile 30 T",
    phase: 'Démolition',
    category: 'Équipements de levage',
    probability: 4,
    gravity: 5,
    initialRisk: 20,
    measures:
      "Balisage de la zone de manœuvre, attestation de conformité de l'appareil, opérateur certifié, élingues inspectées avant chaque quart (CSTC)",
    residualRisk: 8,
    status: 'Contrôles actifs',
    responsible: 'Chef de chantier',
    sector: 'Construction'
  },
  {
    id: 'RC4-002',
    name: 'Chute de hauteur depuis une toiture sans garde-corps',
    phase: 'Réfection toiture',
    category: 'Chute (CSTC)',
    probability: 4,
    gravity: 5,
    initialRisk: 20,
    measures:
      "Installation de garde-corps périmétriques, harnais avec ancrage certifié, plan de sauvetage en hauteur (CSTC)",
    residualRisk: 6,
    status: 'Action requise',
    responsible: 'Contremaître toiture',
    sector: 'Construction'
  },
  {
    id: 'RC4-003',
    name: 'Contact avec une ligne électrique aérienne sous tension',
    phase: 'Montage structure',
    category: 'Électricité (CSTC)',
    probability: 3,
    gravity: 5,
    initialRisk: 15,
    measures:
      "Demande de neutralisation auprès du distributeur, respect des distances d'approche, signaleur dédié aux manœuvres (CSTC)",
    residualRisk: 5,
    status: 'Contrôles actifs',
    responsible: 'Maître électricien',
    sector: 'Électricité'
  },
  {
    id: 'RC4-004',
    name: 'Ensevelissement lors de travaux en tranchée de plus de 1,2 m',
    phase: 'Terrassement',
    category: 'Creusement, excavation',
    probability: 3,
    gravity: 5,
    initialRisk: 15,
    measures:
      "Étaiement ou talutage validé par ingénieur, inspection quotidienne des parois, accès par échelle à moins de 8 m du poste (CSTC)",
    residualRisk: 5,
    status: 'Contrôles actifs',
    responsible: 'Chef de chantier',
    sector: 'Construction'
  },
  {
    id: 'RC4-005',
    name: "Exposition aux fibres d'amiante lors du retrait de calorifuge",
    phase: 'Désamiantage',
    category: 'Autres risques professionnels',
    probability: 3,
    gravity: 5,
    initialRisk: 15,
    measures:
      "Enceinte étanche en dépression, APR à adduction d'air, échantillonnage d'air en continu, registre d'exposition (RSST)",
    residualRisk: 4,
    status: 'Contrôles actifs',
    responsible: 'Hygiéniste du travail',
    sector: 'Santé'
  },
  {
    id: 'RC4-006',
    name: 'Chute dans une ouverture de plancher non protégée',
    phase: 'Structure',
    category: 'Chute (CSTC)',
    probability: 4,
    gravity: 4,
    initialRisk: 16,
    measures:
      "Obturation systématique des ouvertures, couvercles fixés et identifiés, inspection en fin de quart (CSTC)",
    residualRisk: 6,
    status: 'En surveillance',
    responsible: 'Contremaître structure',
    sector: 'Construction'
  },
  {
    id: 'RC4-007',
    name: 'Incendie lors de travaux à chaud (soudage et oxycoupage)',
    phase: 'Installation',
    category: 'Incendies et explosions',
    probability: 3,
    gravity: 4,
    initialRisk: 12,
    measures:
      "Permis de travail à chaud, retrait des matières combustibles sur 11 m, surveillance incendie 60 min après les travaux (CSTC)",
    residualRisk: 4,
    status: 'Contrôles actifs',
    responsible: 'Responsable prévention',
    sector: 'Sécurité'
  },
  {
    id: 'RC4-008',
    name: 'Électrisation par outil portatif défectueux',
    phase: 'Finitions',
    category: 'Électricité (CSTC)',
    probability: 3,
    gravity: 4,
    initialRisk: 12,
    measures:
      "Disjoncteur différentiel sur tous les circuits de chantier, inspection mensuelle des cordons, retrait immédiat du matériel non conforme (CSTC)",
    residualRisk: 4,
    status: 'Contrôles actifs',
    responsible: 'Maître électricien',
    sector: 'Électricité'
  },
  {
    id: 'RC4-009',
    name: 'Troubles musculosquelettiques liés à la manutention manuelle répétée',
    phase: 'Gros œuvre',
    category: 'Autres risques professionnels',
    probability: 4,
    gravity: 3,
    initialRisk: 12,
    measures:
      "Aides mécaniques à la manutention, rotation des postes, formation aux techniques de levage, suivi ergonomique trimestriel",
    residualRisk: 9,
    status: 'En surveillance',
    responsible: 'Médecin du travail',
    sector: 'Santé'
  },
  {
    id: 'RC4-010',
    name: 'Exposition à la silice cristalline lors de la découpe de béton',
    phase: 'Démolition',
    category: 'Autres risques professionnels',
    probability: 4,
    gravity: 4,
    initialRisk: 16,
    measures:
      "Découpe à l'eau ou captage à la source, APR P100, délimitation de la zone, surveillance médicale pulmonaire (RSST)",
    residualRisk: 6,
    status: 'Action requise',
    responsible: 'Hygiéniste du travail',
    sector: 'Santé'
  },
  {
    id: 'RC4-011',
    name: 'Heurt par véhicule de chantier effectuant une marche arrière',
    phase: 'Terrassement',
    category: 'Autres risques professionnels',
    probability: 3,
    gravity: 4,
    initialRisk: 12,
    measures:
      "Plan de circulation séparant piétons et engins, signaleur formé, avertisseur de recul et caméra, vêtements haute visibilité (CSTC)",
    residualRisk: 4,
    status: 'Contrôles actifs',
    responsible: 'Signaleur de chantier',
    sector: 'Sécurité'
  },
  {
    id: 'RC4-012',
    name: 'Renversement de chariot élévateur télescopique sur terrain en pente',
    phase: 'Gros œuvre',
    category: 'Équipements de levage',
    probability: 2,
    gravity: 5,
    initialRisk: 10,
    measures:
      "Compactage et nivellement des aires de circulation, respect de l'abaque de charge, ceinture de sécurité obligatoire, cariste certifié",
    residualRisk: 4,
    status: 'Contrôles actifs',
    responsible: 'Chef de chantier',
    sector: 'Construction'
  },
  {
    id: 'RC4-013',
    name: "Effondrement d'un échafaudage mal ancré",
    phase: 'Structure',
    category: 'Chute (CSTC)',
    probability: 2,
    gravity: 5,
    initialRisk: 10,
    measures:
      "Montage par personne compétente, plan d'ancrage signé par ingénieur, étiquetage de conformité, inspection avant chaque quart (CSTC)",
    residualRisk: 3,
    status: 'Contrôles actifs',
    responsible: 'Contremaître structure',
    sector: 'Construction'
  },
  {
    id: 'RC4-014',
    name: 'Explosion en espace clos par accumulation de gaz',
    phase: 'Fondations',
    category: 'Incendies et explosions',
    probability: 2,
    gravity: 5,
    initialRisk: 10,
    measures:
      "Permis d'entrée en espace clos, détection multigaz continue, ventilation mécanique, surveillant à l'extérieur et équipement de sauvetage (RSST)",
    residualRisk: 3,
    status: 'Contrôles actifs',
    responsible: 'Responsable prévention',
    sector: 'Sécurité'
  },
  {
    id: 'RC4-015',
    name: 'Chute de plain-pied due à l’encombrement des aires de circulation',
    phase: 'Finitions',
    category: 'Autres risques professionnels',
    probability: 4,
    gravity: 2,
    initialRisk: 8,
    measures:
      "Rangement en fin de quart, éclairage minimal de 50 lux dans les circulations, dégagement des câbles et boyaux (CSTC)",
    residualRisk: 4,
    status: 'En contrôle',
    responsible: 'Contremaître finitions',
    sector: 'Sécurité'
  }
]
