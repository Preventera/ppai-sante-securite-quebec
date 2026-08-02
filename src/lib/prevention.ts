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
 *   Écrire « RSST art. 2.9.1 » de mémoire dans un produit de conformité serait
 *   la faute que le refus de dériver une probabilité évite ailleurs.
 *
 *   Les textes officiels du RSST et du CSTC ayant été dépouillés, 65 mesures
 *   portent désormais l'article qui les fonde — RSST art. 141.3 pour l'affichage
 *   des zones à protection auditive obligatoire, art. 177 pour les protecteurs
 *   de machines, CSTC art. 2.10.15 pour les systèmes d'ancrage. Chacun a été
 *   lu avant d'être écrit, et chacun est vérifié par
 *   `scripts/verifier_citations.py` contre la liste réelle des articles en
 *   vigueur : un numéro inexistant ou abrogé fait échouer le contrôle.
 *
 *   37 obligations restent nommées sans article. Ce n'est pas un oubli : soit
 *   leur instrument n'a pas d'index — la LMRSST, la Loi sur les normes du
 *   travail —, soit aucun article isolé ne les fonde proprement. Les laisser au
 *   niveau de l'instrument vaut mieux que de leur coller le numéro le plus
 *   plausible.
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
      { niveau: 2, libelle: 'Substituer un produit moins nocif à fonction équivalente', nature: 'obligation', fondement: 'RSST, art. 39' },
      { niveau: 3, libelle: "Capter le contaminant à la source ; ventilation locale et générale", nature: 'obligation', fondement: 'RSST, art. 107' },
      { niveau: 3, libelle: 'Enceinte fermée ou procédé en circuit clos', nature: 'recommandation' },
      { niveau: 4, libelle: "Étiquetage SIMDUT des contenants, y compris les contenants de transfert", nature: 'obligation', fondement: 'SIMDUT / Loi sur les produits dangereux' },
      { niveau: 4, libelle: 'Affichage des zones à accès restreint et du port obligatoire des protections', nature: 'obligation', fondement: 'RSST, art. 95' },
      { niveau: 5, libelle: "Limiter la durée et la fréquence d'exposition ; rotation du personnel", nature: 'recommandation' },
      { niveau: 5, libelle: 'Fiches de données de sécurité accessibles et formation des travailleurs exposés', nature: 'obligation', fondement: 'SIMDUT / Loi sur les produits dangereux' },
      { niveau: 6, libelle: "Appareils de protection respiratoire choisis et entretenus selon CSA Z94.4", nature: 'obligation', fondement: 'RSST, art. 45' },
      { niveau: 6, libelle: 'Gants, lunettes et vêtements adaptés au produit manipulé', nature: 'obligation', fondement: 'RSST, art. 343 et 345' }
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
      { niveau: 3, libelle: 'Confinement, ventilation et pression différentielle des locaux à risque', nature: 'obligation', fondement: 'RSST, art. 107' },
      { niveau: 3, libelle: "Contenants pour objets piquants ou tranchants au point d'utilisation", nature: 'obligation', fondement: 'RSST' },
      { niveau: 4, libelle: 'Signalisation des zones de confinement et des contenants biorisque', nature: 'obligation', fondement: 'RSST' },
      { niveau: 5, libelle: "Protocoles d'hygiène des mains, vaccination offerte, formation", nature: 'obligation', fondement: 'RSST — dispositions biologiques' },
      { niveau: 5, libelle: "Procédure de prise en charge après exposition accidentelle", nature: 'obligation', fondement: 'RSST' },
      { niveau: 6, libelle: 'Masques, gants, blouses et protection oculaire selon le niveau d’exposition', nature: 'obligation', fondement: 'RSST, art. 45, 343 et 345' }
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
      { niveau: 2, libelle: 'Remplacer par un équipement moins bruyant ou moins vibrant', nature: 'obligation', fondement: 'RSST, art. 135' },
      { niveau: 3, libelle: 'Encoffrement acoustique, écrans, isolation des postes', nature: 'obligation', fondement: 'RSST, art. 135' },
      { niveau: 3, libelle: 'Ventilation, chauffage ou refroidissement des ambiances de travail', nature: 'obligation', fondement: 'RSST, art. 101 et 116' },
      { niveau: 4, libelle: 'Affichage des zones où la protection auditive est obligatoire', nature: 'obligation', fondement: 'RSST, art. 141.3' },
      { niveau: 4, libelle: "Signalisation et permis d'entrée en espace clos", nature: 'obligation', fondement: 'RSST, art. 300' },
      { niveau: 5, libelle: "Rotation, pauses et limitation du temps d'exposition", nature: 'recommandation' },
      { niveau: 5, libelle: 'Surveillance de l’exposition et audiométrie de suivi', nature: 'recommandation' },
      { niveau: 6, libelle: 'Protecteurs auditifs adaptés au niveau mesuré (CSA Z94.2)', nature: 'obligation', fondement: 'RSST, art. 141 et 141.1' },
      { niveau: 6, libelle: 'Vêtements thermiques, protection contre les rayonnements', nature: 'obligation', fondement: 'RSST, art. 345' }
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
      { niveau: 3, libelle: 'Aides mécaniques : lève-personne, palan, convoyeur, table élévatrice', nature: 'obligation', fondement: 'RSST, art. 166' },
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
      { niveau: 3, libelle: 'Protecteurs fixes ou avec dispositif d’interverrouillage (CSA Z432)', nature: 'obligation', fondement: 'RSST, art. 177' },
      { niveau: 3, libelle: 'Dispositifs de cadenassage des énergies dangereuses (CSA Z460)', nature: 'obligation', fondement: 'RSST, art. 200 et 201' },
      { niveau: 3, libelle: 'Arrêts d’urgence accessibles depuis chaque poste de conduite', nature: 'obligation', fondement: 'RSST, art. 193' },
      { niveau: 4, libelle: 'Marquage des zones dangereuses et des points de cadenassage', nature: 'obligation', fondement: 'RSST, art. 178' },
      { niveau: 4, libelle: 'Avertisseurs sonores et lumineux de mise en marche', nature: 'obligation', fondement: 'RSST, art. 192' },
      { niveau: 5, libelle: 'Procédure de cadenassage écrite, propre à chaque machine', nature: 'obligation', fondement: 'RSST, art. 200' },
      { niveau: 5, libelle: 'Formation et habilitation des opérateurs ; permis de travail', nature: 'obligation', fondement: 'LSST — obligation de formation et d’information' },
      { niveau: 6, libelle: 'Visière, gants anti-coupure, chaussures de sécurité — dernier recours', nature: 'obligation', fondement: 'RSST, art. 343, 344 et 345' }
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

// ---------------------------------------------------------------------------
// Matrice par genre d'accident
// ---------------------------------------------------------------------------

/**
 * POURQUOI CETTE SECONDE CLÉ
 *   La catégorie est trop grossière : 55 % des 258 risques types dérivés
 *   tombent dans « Autre risque professionnel », qui ne peut rien proposer.
 *   Or la même fiche sait qu'il s'agit d'une « chute au même niveau causée par
 *   les planchers et passages » — et pour cela, on sait quoi faire.
 *
 *   Le genre d'accident est une variable CODÉE de la nomenclature CNESST,
 *   présente dans les données ouvertes et conservée jusque dans le nom du
 *   risque adopté. Vingt valeurs, dont dix-sept exploitables. C'est la clé
 *   utile, et elle ne coûte aucun changement de schéma.
 *
 * MÊME DISCIPLINE QUE PARTOUT AILLEURS
 *   Aucun numéro d'article inventé : les instruments sont nommés. La
 *   `corroboration` indique la norme ou l'organisme qui appuie la mesure —
 *   c'est un point d'entrée pour vérifier, pas une citation d'autorité.
 *
 * CE QUI N'EST PAS COUVERT, ET POURQUOI
 *   « NON CODÉ », « NE PEUT ÊTRE CLASSIFIÉ, INCONNU » et les rubriques « NCA »
 *   ne décrivent aucune situation : proposer des mesures pour elles reviendrait
 *   à en inventer. Elles sont absentes de la matrice, volontairement.
 */
export interface MesureGenre extends MesurePrevention {
  /** Norme ou organisme qui appuie la mesure. Point d'entrée, pas autorité. */
  corroboration?: string
}

const m = (
  niveau: NiveauHierarchie,
  libelle: string,
  nature: 'obligation' | 'recommandation',
  fondement?: string,
  corroboration?: string
): MesureGenre => ({ niveau, libelle, nature, fondement, corroboration })

export const MESURES_PAR_GENRE: Record<string, MesureGenre[]> = {
  'EFFORT EXCESSIF': [
    m(1, "Supprimer la manutention manuelle par reconception du flux", 'obligation', 'RMPPÉ — hiérarchie des mesures'),
    m(2, "Fractionner les charges ; réduire la masse unitaire", 'obligation', 'RMPPÉ — hiérarchie des mesures'),
    m(3, "Aides mécaniques : palan, table élévatrice, chariot, lève-personne", 'obligation', 'RSST, art. 166', 'CSA Z1004 · ASSTSAS'),
    m(3, "Rapprocher les points de prise et de dépose ; supprimer les torsions", 'recommandation', undefined, 'IRSST — ergonomie'),
    m(4, "Indiquer la masse des charges et les points de préhension", 'recommandation'),
    m(5, "Rotation des tâches ; limiter la fréquence et la durée des efforts", 'recommandation'),
    m(5, "Formation à la manutention et à l'usage des aides mécaniques", 'obligation', "LSST — formation et information"),
    m(6, "La protection individuelle ne corrige pas un effort excessif", 'recommandation')
  ],
  'REACTION DU CORPS': [
    m(1, "Éliminer les postures contraignantes par reconception du poste", 'obligation', 'RMPPÉ — hiérarchie des mesures'),
    m(2, "Méthode de travail alternative supprimant le geste en cause", 'obligation', 'RMPPÉ — hiérarchie des mesures'),
    m(3, "Ajuster hauteurs de travail, atteintes, sièges et appuis", 'obligation', 'RSST, art. 168 et 170', 'CSA Z1004'),
    m(3, "Supprimer les obstacles imposant contorsions et rattrapages", 'recommandation', undefined, 'IRSST — ergonomie'),
    m(4, "Signaler les zones exiguës et les passages à dégagement réduit", 'recommandation'),
    m(5, "Alternance des postures ; pauses de récupération", 'recommandation'),
    m(5, "Formation aux principes de posture et d'économie d'effort", 'obligation', "LSST — formation et information"),
    m(6, "Peu pertinent : la protection individuelle ne réduit pas la contrainte", 'recommandation')
  ],
  'MOUVEMENT REPETITIF': [
    m(1, "Automatiser ou supprimer le cycle répétitif", 'obligation', 'RMPPÉ — hiérarchie des mesures'),
    m(2, "Élargir le contenu de la tâche pour rompre la répétition", 'obligation', 'RMPPÉ — hiérarchie des mesures'),
    m(3, "Outils à prise adaptée ; réduction de la force de préhension requise", 'obligation', 'RSST', 'CSA Z1004'),
    m(3, "Supports d'avant-bras, plans de travail ajustables", 'recommandation', undefined, 'IRSST — ergonomie'),
    m(5, "Rotation des postes ; micro-pauses régulières", 'recommandation'),
    m(5, "Surveillance des signes précoces de TMS et prise en charge", 'recommandation', undefined, 'INSPQ'),
    m(6, "Orthèses seulement sur avis médical, jamais en substitut d'aménagement", 'recommandation')
  ],
  'CHUTE AU MEME NIVEAU': [
    m(1, "Supprimer dénivellations, seuils et obstacles des voies de circulation", 'obligation', 'RMPPÉ — hiérarchie des mesures'),
    m(2, "Revêtement de sol à coefficient de friction adapté à l'activité", 'obligation', 'RSST, art. 14'),
    m(3, "Drainage et captation des liquides répandus ; tapis absorbants", 'obligation', 'RSST, art. 14'),
    m(3, "Éclairage suffisant des voies de circulation et des escaliers", 'obligation', 'RSST, art. 125'),
    m(4, "Marquage des dénivellations résiduelles et des sols glissants", 'obligation', 'RSST, art. 7'),
    m(5, "Programme d'entretien, de nettoyage et de déneigement des passages", 'obligation', 'RSST, art. 15 et 17', 'IRSST — prévention des chutes'),
    m(5, "Rangement : dégagement permanent des voies de circulation", 'obligation', 'RSST, art. 15'),
    m(6, "Chaussures à semelle antidérapante adaptée au sol", 'obligation', 'RSST')
  ],
  'CHUTE A UN NIVEAU INFERIEUR': [
    m(1, "Concevoir le travail au sol ; supprimer le travail en hauteur", 'obligation', 'RMPPÉ — hiérarchie des mesures'),
    m(2, "Plateforme élévatrice ou échafaudage plutôt qu'échelle", 'obligation', 'CSTC'),
    m(3, "Garde-corps sur toute ouverture, plancher de travail et bord libre", 'obligation', 'RSST, art. 33.3 · CSTC, art. 2.9.1'),
    m(3, "Couverture solide et fixée des ouvertures de plancher", 'obligation', 'CSTC'),
    m(3, "Points d'ancrage conçus et vérifiés pour l'arrêt de chute", 'obligation', 'CSTC, art. 2.10.15', 'CSA Z259'),
    m(4, "Baliser et signaler les zones de travail en hauteur et les ouvertures", 'obligation', 'CSTC'),
    m(5, "Plan de travail en hauteur ; plan de sauvetage après suspension", 'obligation', 'CSTC', 'ASP Construction'),
    m(6, "Harnais complet et absorbeur d'énergie, inspectés avant chaque usage", 'obligation', 'RSST, art. 347 · CSTC, art. 2.10.12', 'CSA Z259')
  ],
  'FRAPPE PAR UN OBJET': [
    m(1, "Supprimer le stockage et la manutention au-dessus des postes occupés", 'obligation', 'RMPPÉ — hiérarchie des mesures'),
    m(2, "Manutention mécanisée plutôt que portée à bras", 'obligation', 'RMPPÉ — hiérarchie des mesures'),
    m(3, "Filets, plinthes et garde-corps pleins contre la chute d'objets", 'obligation', 'RSST, art. 10 · CSTC, art. 2.9.3'),
    m(3, "Arrimage des charges ; rayonnages ancrés et charge maximale respectée", 'obligation', 'RSST, art. 288 à 290'),
    m(4, "Baliser les zones de manœuvre de grue et de levage", 'obligation', 'CSTC'),
    m(5, "Interdiction de circuler sous une charge suspendue", 'obligation', 'CSTC'),
    m(5, "Signaleur formé pour les manœuvres à visibilité réduite", 'obligation', 'CSTC, art. 2.8.3 et 2.8.4', 'ASP Construction'),
    m(6, "Casque de protection ; chaussures à embout protecteur", 'obligation', 'RSST, art. 341 et 344 · CSTC, art. 2.10.3 et 2.10.6', 'CSA Z94.1')
  ],
  'HEURTER UN OBJET': [
    m(1, "Reconcevoir les circulations pour supprimer les obstacles fixes", 'obligation', 'RMPPÉ — hiérarchie des mesures'),
    m(3, "Dégager les hauteurs libres et élargir les passages", 'obligation', 'RSST, art. 15'),
    m(3, "Protection des angles saillants et des parties basses", 'recommandation'),
    m(4, "Marquage contrasté des obstacles et des hauteurs réduites", 'obligation', 'RSST'),
    m(5, "Séparation des flux piétons et véhicules", 'obligation', 'RSST, art. 7 · CSTC, art. 2.8.2'),
    m(6, "Casque lorsque le dégagement en hauteur reste insuffisant", 'obligation', 'RSST, art. 341')
  ],
  'COINCE,ECRASE PAR EQUIPEMENT,OBJET': [
    m(1, "Conception supprimant la zone de coincement", 'obligation', 'RMPPÉ — hiérarchie des mesures', 'ISO 12100'),
    m(2, "Équipement à énergie ou à course réduite", 'obligation', 'RMPPÉ — hiérarchie des mesures'),
    m(3, "Protecteurs fixes ou à interverrouillage sur les zones dangereuses", 'obligation', 'RSST, art. 177', 'CSA Z432 · ISO 12100'),
    m(3, "Dispositifs de cadenassage des énergies dangereuses", 'obligation', 'RSST, art. 200 et 201', 'CSA Z460'),
    m(3, "Arrêts d'urgence accessibles depuis chaque poste", 'obligation', 'RSST, art. 193'),
    m(4, "Marquage des zones de coincement et des points de cadenassage", 'obligation', 'RSST'),
    m(5, "Procédure de cadenassage écrite et propre à chaque machine", 'obligation', 'RSST, art. 200', 'CSA Z460'),
    m(5, "Habilitation des opérateurs et des personnes chargées de l'entretien", 'obligation', "LSST — formation et information"),
    m(6, "Gants adaptés — jamais près d'organes en rotation", 'obligation', 'RSST, art. 345')
  ],
  'FROTTEM.,ABRAS.PAR FRICTION,PRESSION': [
    m(1, "Supprimer le contact avec les surfaces abrasives ou sous pression", 'obligation', 'RMPPÉ — hiérarchie des mesures'),
    m(3, "Capotage des organes abrasifs ; limitation des pressions accessibles", 'obligation', 'RSST — machines', 'CSA Z432'),
    m(4, "Signaler les surfaces abrasives et les circuits sous pression", 'obligation', 'RSST'),
    m(5, "Procédure de purge avant toute intervention sur circuit sous pression", 'obligation', 'RSST', 'CSA Z460'),
    m(6, "Gants anti-coupure et anti-abrasion adaptés à la tâche", 'obligation', 'RSST, art. 345')
  ],
  'EXPOSITION AU BRUIT': [
    m(1, "Supprimer la source sonore ou l'éloigner des postes occupés", 'obligation', 'RMPPÉ — hiérarchie des mesures'),
    m(2, "Équipement moins bruyant ; procédé silencieux à performance égale", 'obligation', 'RSST, art. 135'),
    m(3, "Encoffrement acoustique, écrans, silencieux, traitement des parois", 'obligation', 'RSST, art. 135', 'IRSST — acoustique'),
    m(3, "Cabines de conduite ou de contrôle insonorisées", 'recommandation'),
    m(4, "Affichage des zones où la protection auditive est obligatoire", 'obligation', 'RSST, art. 141.3'),
    m(5, "Mesurage de l'exposition ; limitation du temps en zone bruyante", 'obligation', 'RSST, art. 136 et 138'),
    m(5, "Audiométrie de suivi et information des travailleurs exposés", 'recommandation', undefined, 'INSPQ · IRSST'),
    m(6, "Protecteurs auditifs choisis selon l'atténuation requise", 'obligation', 'RSST, art. 141 et 141.1', 'CSA Z94.2')
  ],
  'CONTACT AVEC TEMPERATURES EXTREMES': [
    m(1, "Supprimer le contact avec les surfaces ou fluides à température extrême", 'obligation', 'RMPPÉ — hiérarchie des mesures'),
    m(2, "Procédé à température modérée ; refroidissement avant intervention", 'obligation', 'RMPPÉ — hiérarchie des mesures'),
    m(3, "Calorifugeage, écrans thermiques, ventilation ou chauffage d'ambiance", 'obligation', 'RSST, art. 124'),
    m(3, "Aires de récupération tempérées à proximité des postes", 'obligation', 'RSST'),
    m(4, "Signaler les surfaces chaudes ou froides accessibles", 'obligation', 'RSST'),
    m(5, "Régime d'alternance travail-repos selon la contrainte thermique", 'obligation', 'RSST, art. 123 et 124', 'INSPQ — chaleur'),
    m(5, "Hydratation, acclimatation et surveillance mutuelle", 'obligation', 'RSST', 'CSA Z1010'),
    m(6, "Vêtements et gants isolants adaptés à la température", 'obligation', 'RSST, art. 345')
  ],
  'CONTACT AVEC LE COURANT ELECTRIQUE': [
    m(1, "Travailler hors tension — consignation avant toute intervention", 'obligation', 'RSST', 'CSA Z462'),
    m(2, "Très basse tension de sécurité lorsque la fonction le permet", 'obligation', 'RMPPÉ — hiérarchie des mesures'),
    m(3, "Mise à la terre, différentiels, enveloppes et distances de sécurité", 'obligation', 'RSST, art. 235 · CSTC, art. 5.2.1', 'CSA Z462'),
    m(3, "Cadenassage des sources d'alimentation avec vérification d'absence de tension", 'obligation', 'RSST, art. 200 et 201', 'CSA Z460 · Z462'),
    m(4, "Étiquetage des circuits, des tableaux et des points de coupure", 'obligation', 'RSST', 'CSA Z462'),
    m(5, "Habilitation électrique ; permis et analyse de risque avant travail sous tension", 'obligation', 'RSST', 'CSA Z462'),
    m(6, "Gants isolants, écran facial et vêtements résistants à l'arc", 'obligation', 'RSST, art. 343 et 345', 'CSA Z462')
  ],
  'EXPOS. SUBST. CAUST.,NOCIVE,ALLERG.': [
    m(1, "Retirer la substance du procédé", 'obligation', 'RMPPÉ — hiérarchie des mesures'),
    m(2, "Substituer un produit moins nocif à fonction équivalente", 'obligation', 'RSST, art. 39', 'Reptox'),
    m(3, "Captation à la source ; enceinte fermée ; ventilation générale", 'obligation', 'RSST, art. 107'),
    m(3, "Douches et rince-œil d'urgence accessibles", 'obligation', 'RSST, art. 75 et 76'),
    m(4, "Étiquetage SIMDUT de tous les contenants, transferts compris", 'obligation', 'SIMDUT / Loi sur les produits dangereux'),
    m(5, "Fiches de données de sécurité accessibles ; formation des personnes exposées", 'obligation', 'SIMDUT / Loi sur les produits dangereux', 'Reptox'),
    m(5, "Surveillance de l'exposition par rapport aux valeurs limites", 'obligation', 'RSST, art. 43 et 44', 'IRSST — hygiène industrielle'),
    m(6, "Protection respiratoire, gants et lunettes choisis selon la substance", 'obligation', 'RSST, art. 45, 343 et 345', 'CSA Z94.4 · Reptox')
  ],
  'VOIES FAIT,ACTE VIOLENT PAR PERSONNE': [
    m(1, "Reconcevoir l'organisation supprimant l'exposition — file d'attente, encaissement", 'obligation', 'RMPPÉ — hiérarchie des mesures'),
    m(2, "Supprimer le travail isolé dans les situations à risque", 'obligation', 'LMRSST — risques psychosociaux'),
    m(3, "Aménagement : comptoir, dégagement, issue de repli, contrôle d'accès", 'obligation', 'RSST', 'ASSTSAS · APSAM'),
    m(3, "Dispositif d'appel d'urgence individuel ou fixe", 'obligation', 'RSST'),
    m(4, "Affichage de la politique de tolérance zéro et des voies de signalement", 'obligation', 'Loi sur les normes du travail'),
    m(5, "Procédure de signalement, d'enquête et de suivi des événements", 'obligation', 'LMRSST · Loi sur les normes du travail'),
    m(5, "Formation à la désescalade et à la gestion des comportements agressifs", 'recommandation', undefined, 'ASSTSAS · INSPQ'),
    m(6, "Accompagnement post-événement et programme d'aide", 'recommandation')
  ],
  'EXPOS. EVEN. TRAUMAT.,STRESS.,NCA': [
    m(1, "Réduire l'exposition organisationnelle aux événements traumatiques", 'obligation', 'LMRSST — risques psychosociaux'),
    m(3, "Ajuster charge, horaires et effectifs des équipes exposées", 'obligation', 'LMRSST — risques psychosociaux'),
    m(4, "Voies de signalement et de soutien clairement indiquées", 'obligation', 'LMRSST'),
    m(5, "Protocole de prise en charge immédiate après événement", 'obligation', 'LMRSST', 'INSPQ — santé psychologique'),
    m(5, "Formation des gestionnaires au repérage et au soutien", 'recommandation', undefined, 'IRSST — santé psychologique'),
    m(6, "Programme d'aide aux employés et suivi psychologique", 'recommandation')
  ],
  'ACCIDENT DE LA ROUTE': [
    m(1, "Supprimer le déplacement — visioconférence, livraison groupée", 'obligation', 'RMPPÉ — hiérarchie des mesures'),
    m(2, "Transport confié à un tiers spécialisé lorsque c'est possible", 'recommandation'),
    m(3, "Entretien préventif documenté ; aides à la conduite ; arrimage des charges", 'obligation', 'RSST, art. 272', 'Via Prévention'),
    m(4, "Signalisation et balisage des aires de manœuvre et de recul", 'obligation', 'RSST, art. 284 · CSTC, art. 2.8.2'),
    m(5, "Politique de conduite : vitesse, fatigue, téléphone, alcool et drogues", 'obligation', 'LSST', 'Via Prévention'),
    m(5, "Planification des trajets et des heures de conduite", 'recommandation'),
    m(6, "Ceinture, vêtement à haute visibilité hors du véhicule", 'obligation', 'RSST, art. 280 · CSTC, art. 10.4.1')
  ],
  'ATTAQUE PAR DES ANIMAUX': [
    m(1, "Séparer physiquement les travailleurs des animaux", 'obligation', 'RMPPÉ — hiérarchie des mesures'),
    m(3, "Contention, couloirs de manipulation, abris et issues de dégagement", 'obligation', 'RSST'),
    m(4, "Signaler les zones de contention et la présence d'animaux", 'obligation', 'RSST'),
    m(5, "Procédures de manipulation ; travail à deux pour les animaux lourds", 'recommandation', undefined, 'IRSST — secteur agricole'),
    m(5, "Vaccination et prise en charge des morsures et griffures", 'obligation', 'RSST — dispositions biologiques'),
    m(6, "Vêtements et gants de protection adaptés à l'espèce", 'obligation', 'RSST')
  ]
}

/** Genres reconnus mais volontairement sans mesures : ils ne décrivent rien. */
export const GENRES_NON_DESCRIPTIFS = [
  'NON CODE',
  'NE PEUT ETRE CLASSIFIE,INCONNU',
  'REACTION DU CORPS ET EFFORT,NCA'
] as const

/** Uniformise pour la comparaison : majuscules, sans accent, espaces réduits. */
function normaliser(valeur: string): string {
  return valeur
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim()
}

const INDEX_GENRES = new Map(
  Object.entries(MESURES_PAR_GENRE).map(([genre, mesures]) => [normaliser(genre), { genre, mesures }])
)
const INDEX_NON_DESCRIPTIFS = new Set(GENRES_NON_DESCRIPTIFS.map(normaliser))

export interface CorrespondanceGenre {
  genre: string
  mesures: MesureGenre[]
}

/**
 * Mesures propres au genre d'accident, à partir du libellé du risque.
 *
 * Les risques adoptés depuis une proposition sectorielle portent le genre
 * verbatim dans leur nom — c'est ce qui rend la correspondance possible sans
 * champ supplémentaire. Un risque saisi librement n'en portera pas, et
 * retombera sur les mesures de sa catégorie.
 */
export function mesuresPourGenre(libelle: string | null | undefined): CorrespondanceGenre | null {
  if (!libelle) return null
  const cle = normaliser(libelle)
  if (INDEX_NON_DESCRIPTIFS.has(cle)) return null
  return INDEX_GENRES.get(cle) ?? null
}

/** Groupe des mesures de genre par niveau de hiérarchie, dans l'ordre. */
export function mesuresGenreParNiveau(
  mesures: MesureGenre[]
): { niveau: NiveauHierarchie; libelleNiveau: string; texteReglementaire: string; mesures: MesureGenre[] }[] {
  const niveaux: NiveauHierarchie[] = [1, 2, 3, 4, 5, 6]
  return niveaux
    .map(niveau => ({
      niveau,
      libelleNiveau: LIBELLE_NIVEAU[niveau],
      texteReglementaire: TEXTE_NIVEAU[niveau],
      mesures: mesures.filter(x => x.niveau === niveau)
    }))
    .filter(groupe => groupe.mesures.length > 0)
}
