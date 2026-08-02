/* © 2026 Preventera — AgenticX5. Tous droits réservés. Voir LICENSE.md. */
/**
 * Référentiel des moyens de prévention, par catégorie de risque.
 *
 * CE QUE CE MODULE APPORTE
 *   Le registre savait nommer et coter un risque, jamais quoi faire pour le
 *   maîtriser. Les « mesures types » livrées avec les risques sectoriels
 *   décrivaient en réalité la LÉSION observée — agent causal, nature, siège —
 *   ce qui est de la métadonnée de dérivation, pas une mesure de prévention.
 *
 * LA HIÉRARCHIE FAIT FOI, ET ELLE COMPTE SIX NIVEAUX
 *   La présentation courante de la CNESST en énumère cinq : élimination,
 *   substitution, ingénierie, administratif, protection individuelle. Le
 *   Règlement sur les mécanismes de prévention et de participation en
 *   établissement (RMPPÉ, art. 6) en énonce SIX : il isole « la mise en place
 *   de signaux permettant de mettre en évidence le risque », entre le contrôle
 *   technique et le contrôle administratif.
 *
 *   Depuis le 1er octobre 2025, c'est cette version qui lie l'employeur. Les
 *   mesures ci-dessous sont donc rangées sur six niveaux, et le niveau 4 est
 *   renseigné pour chaque catégorie — précisément celui que la présentation en
 *   cinq niveaux fait disparaître.
 *
 * OBLIGATION OU RECOMMANDATION — JAMAIS AMBIGU
 *   Un outil de conformité qui mélange ce que la loi exige et ce que la bonne
 *   pratique conseille est dangereux. Chaque mesure porte donc sa `nature`.
 *
 * CE QUE CE MODULE NE FAIT PAS : INVENTER DES NUMÉROS D'ARTICLES
 *   Les instruments sont nommés (« RSST — qualité du milieu de travail »),
 *   jamais cités à l'article près. Écrire « RSST art. 2.9.1 » de mémoire dans
 *   un produit de conformité serait la faute que le refus de dériver une
 *   probabilité évite ailleurs. Le champ `fondement` nomme l'instrument ;
 *   `articleVerifie` reste faux tant que le texte n'a pas été consulté.
 *
 * POURQUOI EN TYPESCRIPT ET NON EN BASE
 *   Ce référentiel est statique et partagé : il évolue avec la réglementation,
 *   pas avec les locataires. Le livrer dans le code évite une migration de plus
 *   à appliquer, et il se versionne avec l'application. Même choix que pour
 *   `scianNiveaux.ts`.
 *
 * SOURCES
 *   Cartographie des sources ouvertes en prévention (Québec / Canada) :
 *   CNESST et Répertoire toxicologique, IRSST et PhareSST, INSPQ, CCHST,
 *   CanOSH, IWT, ACATC, Données Québec, CSA, BNQ, CCN, LégisQuébec.
 *   Les publications de ces organismes sont LIÉES, jamais recopiées : elles
 *   restent la propriété de leurs auteurs.
 */

import { HIERARCHIE_MESURES_PREVENTION, REFERENCE_RMPPE } from '@/lib/rmppe'

/** Les six niveaux de l'article 6 du RMPPÉ, dans leur ordre de priorité. */
export type NiveauHierarchie = 1 | 2 | 3 | 4 | 5 | 6

/** Libellé court de chaque niveau, pour l'affichage. */
export const LIBELLE_NIVEAU: Record<NiveauHierarchie, string> = {
  1: 'Élimination à la source',
  2: 'Remplacement',
  3: 'Contrôle technique',
  4: 'Signalisation du risque',
  5: 'Contrôle administratif',
  6: 'Protection individuelle ou collective'
}

/** Texte réglementaire exact de chaque niveau (RMPPÉ art. 6). */
export const TEXTE_NIVEAU: Record<NiveauHierarchie, string> = {
  1: HIERARCHIE_MESURES_PREVENTION[0],
  2: HIERARCHIE_MESURES_PREVENTION[1],
  3: HIERARCHIE_MESURES_PREVENTION[2],
  4: HIERARCHIE_MESURES_PREVENTION[3],
  5: HIERARCHIE_MESURES_PREVENTION[4],
  6: HIERARCHIE_MESURES_PREVENTION[5]
}

export interface MesurePrevention {
  niveau: NiveauHierarchie
  libelle: string
  /** `obligation` engage la conformité ; `recommandation` relève de la bonne pratique. */
  nature: 'obligation' | 'recommandation'
  /**
   * Instrument qui fonde l'obligation, nommé sans numéro d'article.
   * Absent pour les recommandations.
   */
  fondement?: string
}

export interface NormeTechnique {
  code: string
  objet: string
}

export interface AppuiRecherche {
  organisme: string
  objet: string
  url: string
}

export type IdCategorie =
  | 'chimique' | 'biologique' | 'physique' | 'ergonomique'
  | 'mecanique' | 'psychosocial' | 'gestion'

export interface CategorieRisque {
  id: IdCategorie
  nom: string
  description: string
  cadreLegal: { instrument: string; portee: string }[]
  normes: NormeTechnique[]
  recherche: AppuiRecherche[]
  /** Association sectorielle paritaire compétente, créée en vertu de la LSST. */
  asp: { nom: string; portee: string }[]
  mesures: MesurePrevention[]
}

// ---------------------------------------------------------------------------
// Les sept catégories
// ---------------------------------------------------------------------------

export const CATEGORIES: readonly CategorieRisque[] = [
  {
    id: 'chimique',
    nom: 'Risque chimique',
    description:
      "Produits dangereux — cancérogènes, allergènes, irritants — par inhalation, contact cutané ou ingestion, ou impliqués dans un incendie ou une explosion.",
    cadreLegal: [
      { instrument: 'RSST — qualité du milieu de travail', portee: "Valeurs limites d'exposition (VEMP) et annexes sur les contaminants de l'air" },
      { instrument: 'SIMDUT / Loi sur les produits dangereux (fédéral)', portee: 'Étiquetage et fiches de données de sécurité' }
    ],
    normes: [
      { code: 'CSA Z94.4', objet: "Choix, entretien et utilisation des appareils de protection respiratoire" },
      { code: 'ISO 45001', objet: "Volet exposition professionnelle du système de gestion SST" }
    ],
    recherche: [
      { organisme: 'IRSST', objet: 'Hygiène industrielle, toxicologie, métrologie des expositions', url: 'https://www.irsst.qc.ca' },
      { organisme: 'INSPQ', objet: "Surveillance des maladies d'origine chimique — asthme professionnel, amiantose, plomb, monoxyde de carbone", url: 'https://www.inspq.qc.ca' },
      { organisme: 'Répertoire toxicologique (Reptox)', objet: "Plus de 9 500 produits : effets toxiques, mesures de protection, réglementation applicable au Québec", url: 'https://reptox.cnesst.gouv.qc.ca' }
    ],
    asp: [{ nom: 'ASFETM · MultiPrévention', portee: 'Secteur manufacturier — métal, textile, imprimerie' }],
    mesures: [
      { niveau: 1, libelle: 'Retirer le produit dangereux du procédé', nature: 'obligation', fondement: 'RMPPÉ — hiérarchie des mesures de prévention' },
      { niveau: 2, libelle: 'Substituer un produit moins nocif à fonction équivalente', nature: 'obligation', fondement: 'RMPPÉ — hiérarchie des mesures de prévention' },
      { niveau: 3, libelle: "Capter le contaminant à la source ; ventilation locale et générale", nature: 'obligation', fondement: 'RSST — qualité du milieu de travail' },
      { niveau: 3, libelle: 'Enceinte fermée ou procédé en circuit clos', nature: 'recommandation' },
      { niveau: 4, libelle: "Étiquetage SIMDUT des contenants, y compris les contenants de transfert", nature: 'obligation', fondement: 'SIMDUT / Loi sur les produits dangereux' },
      { niveau: 4, libelle: 'Affichage des zones à accès restreint et du port obligatoire des protections', nature: 'obligation', fondement: 'RSST' },
      { niveau: 5, libelle: "Limiter la durée et la fréquence d'exposition ; rotation du personnel", nature: 'recommandation' },
      { niveau: 5, libelle: 'Fiches de données de sécurité accessibles et formation des travailleurs exposés', nature: 'obligation', fondement: 'SIMDUT / Loi sur les produits dangereux' },
      { niveau: 6, libelle: "Appareils de protection respiratoire choisis et entretenus selon CSA Z94.4", nature: 'obligation', fondement: 'RSST — renvoi à la norme CSA Z94.4' },
      { niveau: 6, libelle: 'Gants, lunettes et vêtements adaptés au produit manipulé', nature: 'obligation', fondement: 'RSST' }
    ]
  },
  {
    id: 'biologique',
    nom: 'Risque biologique',
    description:
      "Exposition à des agents infectieux, moisissures, zoonoses, piqûres ou morsures, ou fluides biologiques.",
    cadreLegal: [
      { instrument: 'RSST — dispositions biologiques', portee: "Mesures d'hygiène et vaccination en milieu à risque" },
      { instrument: 'Loi sur la santé publique (Québec)', portee: 'Déclaration des maladies à surveillance obligatoire' }
    ],
    normes: [{ code: 'CSA Z1006', objet: 'Travail en espaces clos — pertinent lorsque l’exposition biologique est confinée' }],
    recherche: [
      { organisme: 'IRSST', objet: 'Bioaérosols, désinfection, milieux de soins', url: 'https://www.irsst.qc.ca' },
      { organisme: 'CCHST', objet: 'Fiches sur maladies infectieuses respiratoires et zoonoses, avec l’Agence de la santé publique du Canada', url: 'https://www.cchst.ca/oshanswers' }
    ],
    asp: [{ nom: 'ASSTSAS', portee: 'Affaires sociales — exposition biologique en soins, piqûres accidentelles' }],
    mesures: [
      { niveau: 1, libelle: 'Retirer la source de contamination', nature: 'obligation', fondement: 'RMPPÉ — hiérarchie des mesures de prévention' },
      { niveau: 2, libelle: 'Procédé ou matériel moins exposant — dispositifs de sécurité intégrés aux aiguilles', nature: 'recommandation' },
      { niveau: 3, libelle: 'Confinement, ventilation et pression différentielle des locaux à risque', nature: 'obligation', fondement: 'RSST' },
      { niveau: 3, libelle: "Contenants pour objets piquants ou tranchants au point d'utilisation", nature: 'obligation', fondement: 'RSST' },
      { niveau: 4, libelle: 'Signalisation des zones de confinement et des contenants biorisque', nature: 'obligation', fondement: 'RSST' },
      { niveau: 5, libelle: "Protocoles d'hygiène des mains, vaccination offerte, formation", nature: 'obligation', fondement: 'RSST — dispositions biologiques' },
      { niveau: 5, libelle: "Procédure de prise en charge après exposition accidentelle", nature: 'obligation', fondement: 'RSST' },
      { niveau: 6, libelle: 'Masques, gants, blouses et protection oculaire selon le niveau d’exposition', nature: 'obligation', fondement: 'RSST' }
    ]
  },
  {
    id: 'physique',
    nom: 'Risque physique',
    description:
      "Bruit, vibrations, chaleur ou froid extrêmes, rayonnements, espaces clos — les nuisances énergétiques du milieu de travail.",
    cadreLegal: [
      { instrument: 'RSST — bruit, espaces clos, ambiances thermiques', portee: 'Valeurs limites et exigences par annexe' }
    ],
    normes: [
      { code: 'CSA Z1006', objet: 'Gestion du travail en espaces clos' },
      { code: 'CSA Z1010', objet: 'Travail en conditions extrêmes' },
      { code: 'CSA Z94.2', objet: 'Protecteurs auditifs' }
    ],
    recherche: [
      { organisme: 'IRSST', objet: 'Bruit, vibrations, ambiances thermiques — physiologie du mouvement au travail', url: 'https://www.irsst.qc.ca' },
      { organisme: 'INSPQ', objet: 'Exposition au bruit et vulnérabilité à la chaleur liée aux changements climatiques', url: 'https://www.inspq.qc.ca/sante-au-travail' }
    ],
    asp: [{ nom: 'Selon le secteur', portee: 'Construction, mines, transport — voir l’ASP correspondante' }],
    mesures: [
      { niveau: 1, libelle: "Supprimer la source de bruit, de vibration ou de rayonnement", nature: 'obligation', fondement: 'RMPPÉ — hiérarchie des mesures de prévention' },
      { niveau: 2, libelle: 'Remplacer par un équipement moins bruyant ou moins vibrant', nature: 'obligation', fondement: 'RMPPÉ — hiérarchie des mesures de prévention' },
      { niveau: 3, libelle: 'Encoffrement acoustique, écrans, isolation des postes', nature: 'obligation', fondement: 'RSST — bruit' },
      { niveau: 3, libelle: 'Ventilation, chauffage ou refroidissement des ambiances de travail', nature: 'obligation', fondement: 'RSST — ambiances thermiques' },
      { niveau: 4, libelle: 'Affichage des zones où la protection auditive est obligatoire', nature: 'obligation', fondement: 'RSST — bruit' },
      { niveau: 4, libelle: "Signalisation et permis d'entrée en espace clos", nature: 'obligation', fondement: 'RSST — espaces clos' },
      { niveau: 5, libelle: "Rotation, pauses et limitation du temps d'exposition", nature: 'recommandation' },
      { niveau: 5, libelle: 'Surveillance de l’exposition et audiométrie de suivi', nature: 'recommandation' },
      { niveau: 6, libelle: 'Protecteurs auditifs adaptés au niveau mesuré (CSA Z94.2)', nature: 'obligation', fondement: 'RSST — bruit' },
      { niveau: 6, libelle: 'Vêtements thermiques, protection contre les rayonnements', nature: 'obligation', fondement: 'RSST' }
    ]
  },
  {
    id: 'ergonomique',
    nom: 'Risque ergonomique et biomécanique',
    description:
      "Manutention, postures contraignantes, mouvements répétitifs — à l'origine des troubles musculosquelettiques (TMS).",
    cadreLegal: [
      { instrument: 'RSST — manutention et charges', portee: 'Exigences liées à la manutention manuelle' },
      { instrument: 'LMRSST', portee: "L'identification des risques doit couvrir les risques ergonomiques" }
    ],
    normes: [{ code: 'CSA Z1004', objet: 'Ergonomie en milieu de travail' }],
    recherche: [
      { organisme: 'IRSST', objet: 'Ergonomie et psychologie appliquée à la prévention', url: 'https://www.irsst.qc.ca' },
      { organisme: 'CNESST', objet: "Outil d'identification des risques par méthode ergonomique et biomécanique", url: 'https://www.cnesst.gouv.qc.ca' }
    ],
    asp: [{ nom: 'ASSTSAS', portee: 'Référence en ergonomie de la manutention de bénéficiaires' }],
    mesures: [
      { niveau: 1, libelle: 'Reconcevoir la tâche ou le poste pour supprimer la contrainte', nature: 'obligation', fondement: 'RMPPÉ — hiérarchie des mesures de prévention' },
      { niveau: 2, libelle: 'Méthode de travail alternative ; réduire la masse unitaire des charges', nature: 'obligation', fondement: 'RMPPÉ — hiérarchie des mesures de prévention' },
      { niveau: 3, libelle: 'Aides mécaniques : lève-personne, palan, convoyeur, table élévatrice', nature: 'obligation', fondement: 'RSST — manutention' },
      { niveau: 3, libelle: 'Ajuster hauteurs de travail, atteintes et sièges', nature: 'recommandation' },
      { niveau: 4, libelle: 'Indiquer la masse des charges et les points de préhension', nature: 'recommandation' },
      { niveau: 5, libelle: 'Rotation des tâches, pauses, alternance des postures', nature: 'recommandation' },
      { niveau: 5, libelle: 'Formation aux principes de manutention et à l’usage des aides', nature: 'obligation', fondement: 'LSST — obligation de formation et d’information' },
      { niveau: 6, libelle: "Rarement pertinent pour ce risque — la protection individuelle ne corrige pas une contrainte biomécanique", nature: 'recommandation' }
    ]
  },
  {
    id: 'mecanique',
    nom: 'Risque mécanique et sécurité des machines',
    description:
      "Contact avec des pièces en mouvement, énergies dangereuses non maîtrisées, projections.",
    cadreLegal: [
      { instrument: 'RSST — machines', portee: 'Protecteurs, dispositifs de protection, maîtrise des énergies' },
      { instrument: 'CSTC', portee: 'Équipements et machines sur les chantiers de construction' }
    ],
    normes: [
      { code: 'CSA Z432', objet: 'Protection des machines' },
      { code: 'CSA Z434', objet: 'Robots industriels — exigences générales de sécurité' },
      { code: 'CSA Z460', objet: 'Maîtrise des énergies dangereuses — cadenassage' },
      { code: 'CSA Z462', objet: 'Sécurité électrique en milieu de travail' },
      { code: 'ISO 12100', objet: 'Sécurité des machines — appréciation et réduction du risque' },
      { code: 'ISO 13849', objet: 'Sécurité fonctionnelle des systèmes de commande' }
    ],
    recherche: [
      { organisme: 'IRSST', objet: 'Prévention des risques mécaniques et physiques', url: 'https://www.irsst.qc.ca' }
    ],
    asp: [{ nom: 'ASFETM · ASP Construction', portee: 'Fabrication d’équipement et de machines ; chantiers' }],
    mesures: [
      { niveau: 1, libelle: 'Conception intrinsèquement sûre — supprimer la zone dangereuse', nature: 'obligation', fondement: 'RMPPÉ — hiérarchie des mesures de prévention' },
      { niveau: 2, libelle: 'Remplacer par un équipement à risque réduit', nature: 'obligation', fondement: 'RMPPÉ — hiérarchie des mesures de prévention' },
      { niveau: 3, libelle: 'Protecteurs fixes ou avec dispositif d’interverrouillage (CSA Z432)', nature: 'obligation', fondement: 'RSST — machines' },
      { niveau: 3, libelle: 'Dispositifs de cadenassage des énergies dangereuses (CSA Z460)', nature: 'obligation', fondement: 'RSST — maîtrise des énergies' },
      { niveau: 3, libelle: 'Arrêts d’urgence accessibles depuis chaque poste de conduite', nature: 'obligation', fondement: 'RSST — machines' },
      { niveau: 4, libelle: 'Marquage des zones dangereuses et des points de cadenassage', nature: 'obligation', fondement: 'RSST' },
      { niveau: 4, libelle: 'Avertisseurs sonores et lumineux de mise en marche', nature: 'obligation', fondement: 'RSST' },
      { niveau: 5, libelle: 'Procédure de cadenassage écrite, propre à chaque machine', nature: 'obligation', fondement: 'RSST — maîtrise des énergies' },
      { niveau: 5, libelle: 'Formation et habilitation des opérateurs ; permis de travail', nature: 'obligation', fondement: 'LSST — obligation de formation et d’information' },
      { niveau: 6, libelle: 'Visière, gants anti-coupure, chaussures de sécurité — dernier recours', nature: 'obligation', fondement: 'RSST' }
    ]
  },
  {
    id: 'psychosocial',
    nom: 'Risque psychosocial et organisationnel',
    description:
      "Surcharge, insécurité d'emploi, violence, harcèlement, manque de reconnaissance — explicitement nommés dans la loi québécoise depuis la LMRSST.",
    cadreLegal: [
      { instrument: 'LMRSST', portee: "L'intégrité psychique et les risques psychosociaux entrent explicitement dans le programme de prévention" },
      { instrument: 'Loi sur les normes du travail', portee: 'Obligation de prévenir le harcèlement psychologique et sexuel' }
    ],
    normes: [
      { code: 'CAN/CSA Z1003 · BNQ 9700-803', objet: 'Santé et sécurité psychologiques en milieu de travail' },
      { code: 'CAN/BNQ 9700-800', objet: '« Entreprise en santé » — pratiques organisationnelles favorables à la santé' }
    ],
    recherche: [
      { organisme: 'INSPQ', objet: "Grille d'identification des risques psychosociaux ; enquête EQCOTESST", url: 'https://www.inspq.qc.ca/sante-au-travail' },
      { organisme: 'IRSST', objet: 'Programme de recherche sur la santé psychologique au travail', url: 'https://www.irsst.qc.ca' }
    ],
    asp: [{ nom: 'ASSTSAS', portee: 'Carrefour de prévention organisationnelle en santé mentale' }],
    mesures: [
      { niveau: 1, libelle: 'Reconcevoir l’organisation à l’origine de la contrainte', nature: 'obligation', fondement: 'RMPPÉ — hiérarchie des mesures de prévention' },
      { niveau: 2, libelle: 'Mode d’organisation du travail alternatif ; revoir la répartition des tâches', nature: 'obligation', fondement: 'RMPPÉ — hiérarchie des mesures de prévention' },
      { niveau: 3, libelle: 'Ajuster la charge, les horaires, les effectifs et l’autonomie décisionnelle', nature: 'obligation', fondement: 'LMRSST — risques psychosociaux' },
      { niveau: 3, libelle: 'Aménagement réduisant le travail isolé et les situations de face-à-face à risque', nature: 'recommandation' },
      { niveau: 4, libelle: 'Politique de prévention du harcèlement affichée et connue de tous', nature: 'obligation', fondement: 'Loi sur les normes du travail' },
      { niveau: 4, libelle: 'Voies de signalement clairement indiquées', nature: 'obligation', fondement: 'Loi sur les normes du travail' },
      { niveau: 5, libelle: 'Formation des gestionnaires à la reconnaissance et au soutien', nature: 'recommandation' },
      { niveau: 5, libelle: 'Mécanisme de traitement des plaintes, avec suivi documenté', nature: 'obligation', fondement: 'Loi sur les normes du travail' },
      { niveau: 6, libelle: 'Programme d’aide aux employés et accompagnement post-événement', nature: 'recommandation' }
    ]
  },
  {
    id: 'gestion',
    nom: 'Gestion SST et système de management',
    description:
      "Catégorie transversale — le cadre qui structure la prise en charge de tous les autres risques : programme de prévention et mécanismes de participation.",
    cadreLegal: [
      { instrument: 'LSST et LMRSST', portee: 'Mécanismes de prévention et de participation ; programme de prévention' },
      { instrument: 'Code canadien du travail, partie II', portee: 'Employeurs de compétence fédérale' }
    ],
    normes: [
      { code: 'CSA Z1000', objet: 'Système de gestion de la santé et de la sécurité au travail' },
      { code: 'CSA Z1002', objet: 'Appréciation et gestion du risque de lésion' },
      { code: 'ISO 45001', objet: 'Référence internationale en système de gestion SST' },
      { code: 'CSA Z1600', objet: 'Planification des mesures d’urgence et continuité des activités' }
    ],
    recherche: [
      { organisme: 'IRSST', objet: 'Surveillance et prospection des données en SST — indicateurs, lésions professionnelles', url: 'https://pharesst.irsst.qc.ca' },
      { organisme: 'CNESST', objet: 'Méthode structurée : identifier, analyser, corriger, contrôler', url: 'https://www.cnesst.gouv.qc.ca' }
    ],
    asp: [{ nom: 'Les neuf ASP', portee: 'Soutien à la prise en charge paritaire dans chaque secteur' }],
    mesures: [
      { niveau: 1, libelle: 'Identifier les risques avant toute mise en service ou tout changement de procédé', nature: 'obligation', fondement: 'LSST — identification des risques' },
      { niveau: 3, libelle: 'Programme de prévention ou plan d’action tenu à jour annuellement', nature: 'obligation', fondement: 'LSST — programme de prévention' },
      { niveau: 4, libelle: 'Affichage du programme et des coordonnées des mécanismes de participation', nature: 'obligation', fondement: 'LSST' },
      { niveau: 5, libelle: 'Comité SST ou agent de liaison selon l’effectif, avec réunions tenues', nature: 'obligation', fondement: 'RMPPÉ — mécanismes de participation' },
      { niveau: 5, libelle: 'Inspection périodique des lieux et suivi documenté des correctifs', nature: 'obligation', fondement: 'LSST' },
      { niveau: 5, libelle: 'Registre des accidents, incidents et premiers secours', nature: 'obligation', fondement: 'LSST' },
      { niveau: 5, libelle: 'Indicateurs de surveillance et révision annuelle du programme', nature: 'recommandation' },
      { niveau: 6, libelle: 'Équipements de premiers secours et plan d’urgence éprouvé', nature: 'obligation', fondement: 'RSST — premiers secours' }
    ]
  }
]

// ---------------------------------------------------------------------------
// Raccord avec les catégories du registre
// ---------------------------------------------------------------------------

/**
 * Les risques types dérivés des lésions CNESST portent des catégories issues
 * des indicateurs publiés (TMS, PSY, MACHINE, SURDITÉ). Elles se rattachent
 * aux catégories de prévention ci-dessus — sauf « Autre risque professionnel »,
 * fourre-tout par construction, qui ne correspond à aucune.
 */
const RACCORD: Record<string, IdCategorie> = {
  'Ergonomique (TMS)': 'ergonomique',
  Psychosocial: 'psychosocial',
  Mécanique: 'mecanique',
  Bruit: 'physique',
  // Catégories saisies à la main dans le registre historique
  'Chute (CSTC)': 'mecanique',
  'Équipements de levage': 'mecanique',
  'Électricité (CSTC)': 'mecanique',
  'Incendies et explosions': 'chimique',
  'Creusement, excavation': 'mecanique'
}

/**
 * Catégorie de prévention correspondant à une catégorie de registre.
 *
 * Renvoie `null` lorsque aucun rattachement n'est défendable — notamment pour
 * « Autre risque professionnel », qui regroupe des situations trop diverses
 * pour qu'une même liste de mesures s'y applique. Proposer alors des mesures
 * serait pire que de n'en proposer aucune.
 */
export function categoriePourRegistre(categorie: string | null | undefined): CategorieRisque | null {
  if (!categorie) return null
  const valeur = categorie.trim()

  // Le registre porte parfois directement le nom d'une catégorie de prévention
  // — c'est le cas des risques saisis depuis le formulaire.
  const directe = CATEGORIES.find(c => c.nom === valeur)
  if (directe) return directe

  const id = RACCORD[valeur]
  return id ? (CATEGORIES.find(c => c.id === id) ?? null) : null
}

/**
 * Catégories proposées à la saisie.
 *
 * Les sept catégories de prévention d'abord — ce sont elles qui donnent accès
 * aux moyens de prévention. Les libellés hérités du registre de construction
 * suivent, pour que la modification d'un risque ancien ne lui fasse pas perdre
 * sa catégorie.
 */
export const CATEGORIES_SAISIE: readonly string[] = [
  ...CATEGORIES.map(c => c.nom),
  'Chute (CSTC)',
  'Équipements de levage',
  'Électricité (CSTC)',
  'Incendies et explosions',
  'Creusement, excavation',
  'Autre risque professionnel'
]

export const categorieParId = (id: IdCategorie): CategorieRisque | undefined =>
  CATEGORIES.find(c => c.id === id)

/** Mesures d'une catégorie, groupées par niveau de hiérarchie et dans l'ordre. */
export function mesuresParNiveau(
  categorie: CategorieRisque
): { niveau: NiveauHierarchie; libelleNiveau: string; texteReglementaire: string; mesures: MesurePrevention[] }[] {
  const niveaux: NiveauHierarchie[] = [1, 2, 3, 4, 5, 6]
  return niveaux
    .map(niveau => ({
      niveau,
      libelleNiveau: LIBELLE_NIVEAU[niveau],
      texteReglementaire: TEXTE_NIVEAU[niveau],
      mesures: categorie.mesures.filter(m => m.niveau === niveau)
    }))
    .filter(groupe => groupe.mesures.length > 0)
}

export const REFERENCE_HIERARCHIE = `${REFERENCE_RMPPE}, art. 6`

/**
 * Ressources ouvertes vers lesquelles renvoyer plutôt que de recopier.
 *
 * Les publications de la CNESST, de l'IRSST et de l'INSPQ restent la propriété
 * de leurs auteurs : le produit les cite et y conduit, il ne les intègre pas.
 */
export const RESSOURCES_OUVERTES = [
  { nom: 'Répertoire toxicologique (Reptox)', url: 'https://reptox.cnesst.gouv.qc.ca', objet: 'Plus de 9 500 produits chimiques et biologiques : effets, protections, réglementation québécoise' },
  { nom: 'Réponses SST — CCHST', url: 'https://www.cchst.ca/oshanswers', objet: "Plus de 700 fiches bilingues sur les dangers, l'ergonomie, la santé mentale" },
  { nom: 'Fiches de prévention CNESST', url: 'https://www.cnesst.gouv.qc.ca/fr/prevention-securite/informations-prevention', objet: 'Fiches par priorité : tolérance zéro, risques prédominants, risques émergents' },
  { nom: "Rapports d'enquête d'accident CNESST", url: 'https://www.cnesst.gouv.qc.ca', objet: "Causes d'accidents réels et moyens de prévention qui les auraient évités" },
  { nom: 'PhareSST — dépôt de l’IRSST', url: 'https://pharesst.irsst.qc.ca', objet: 'Publications de recherche en SST téléchargeables gratuitement' },
  { nom: 'INSPQ — santé au travail', url: 'https://www.inspq.qc.ca/sante-au-travail', objet: "Avis scientifiques, portraits de surveillance, grilles d'identification" },
  { nom: 'Les neuf ASP', url: 'https://www.preventionenligne.com', objet: 'Fiches techniques et formations propres à chaque secteur' }
] as const
