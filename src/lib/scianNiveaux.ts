/**
 * Niveaux liés aux activités d'un établissement — correspondance SCIAN 2012.
 *
 * FICHIER GÉNÉRÉ — ne pas modifier à la main.
 * Source de vérité : data/referentiel/niveaux_risque_cnesst.csv
 * Régénérer : python3 scripts/data-analysis/generer_scian_ts.py
 *
 * Source normative : CNESST, « Classement de l'établissement par niveau ».
 * Le modèle multicritère a été développé par la CNESST avec l'Institut de
 * recherche Robert-Sauvé en santé et en sécurité du travail (IRSST) et des
 * chercheurs recommandés par les associations syndicales. Il tient compte des
 * réalités propres aux hommes et aux femmes, des données de lésions
 * professionnelles et des données de risques psychosociaux et ergonomiques.
 *
 * SENS DE L'ÉCHELLE
 * Les obligations croissent avec le niveau : 4 réunions du comité par année au
 * niveau 1, 9 au niveau 4, et jusqu'à quatre fois plus d'heures de libération
 * du représentant (RMPPÉ, art. 19 et 33). Le point était indécidable à la seule
 * lecture de la table — la construction de bâtiments est au niveau 1 alors que
 * la foresterie et l'extraction minière sont au niveau 4 ; c'est le Règlement
 * qui le tranche.
 *
 * Cela ne fait pas du niveau une mesure de gravité affichable. L'annexe I
 * classe des ACTIVITÉS pour moduler des modalités ; elle ne qualifie pas le
 * risque d'un établissement. Le niveau reste donc présenté tel quel —
 * « niveau 3 » — et jamais traduit en « risque élevé » ou « risque faible »,
 * ni coloré selon une échelle de gravité. Voir `LIBELLE_NIVEAU_NEUTRE`.
 */

import type { NiveauRisque } from '@/lib/lmrsst'

export interface SecteurScian {
  /** Code SCIAN 2012 à trois chiffres (sous-secteur). */
  code: string
  libelle: string
  niveau: NiveauRisque
}

/** 102 sous-secteurs SCIAN 2012, triés par code. */
export const SECTEURS_SCIAN: readonly SecteurScian[] = [
  { code: '111', libelle: 'Cultures agricoles', niveau: 3 },
  { code: '112', libelle: 'Élevage et aquaculture', niveau: 3 },
  { code: '113', libelle: 'Foresterie et exploitation forestière', niveau: 4 },
  { code: '114', libelle: 'Pêche, chasse et piégeage', niveau: 3 },
  { code: '115', libelle: 'Activités de soutien à l\'agriculture et à la foresterie', niveau: 4 },
  { code: '211', libelle: 'Extraction de pétrole et de gaz', niveau: 2 },
  { code: '212', libelle: 'Extraction minière et exploitation en carrière (sauf l\'extraction de pétrole et de gaz)', niveau: 4 },
  { code: '213', libelle: 'Activités de soutien à l\'extraction minière, pétrolière et gazière', niveau: 4 },
  { code: '221', libelle: 'Services publics', niveau: 1 },
  { code: '236', libelle: 'Construction de bâtiments', niveau: 1 },
  { code: '237', libelle: 'Travaux de génie civil', niveau: 1 },
  { code: '238', libelle: 'Entrepreneurs spécialisés', niveau: 1 },
  { code: '311', libelle: 'Fabrication d\'aliments', niveau: 4 },
  { code: '312', libelle: 'Fabrication de boissons et de produits du tabac', niveau: 4 },
  { code: '313', libelle: 'Usines de textiles', niveau: 4 },
  { code: '314', libelle: 'Usines de produits textiles', niveau: 4 },
  { code: '315', libelle: 'Fabrication de vêtements', niveau: 2 },
  { code: '316', libelle: 'Fabrication de produits en cuir et de produits analogues', niveau: 3 },
  { code: '321', libelle: 'Fabrication de produits en bois', niveau: 4 },
  { code: '322', libelle: 'Fabrication du papier', niveau: 2 },
  { code: '323', libelle: 'Impression et activités connexes de soutien', niveau: 1 },
  { code: '324', libelle: 'Fabrication de produits du pétrole et du charbon', niveau: 1 },
  { code: '325', libelle: 'Fabrication de produits chimiques', niveau: 4 },
  { code: '326', libelle: 'Fabrication de produits en plastique et en caoutchouc', niveau: 4 },
  { code: '327', libelle: 'Fabrication de produits minéraux non métalliques', niveau: 4 },
  { code: '331', libelle: 'Première transformation des métaux', niveau: 4 },
  { code: '332', libelle: 'Fabrication de produits métalliques', niveau: 4 },
  { code: '333', libelle: 'Fabrication de machines', niveau: 4 },
  { code: '334', libelle: 'Fabrication de produits informatiques et électroniques', niveau: 3 },
  { code: '335', libelle: 'Fabrication de matériel, d\'appareils et de composants électriques', niveau: 4 },
  { code: '336', libelle: 'Fabrication de matériel de transport', niveau: 4 },
  { code: '337', libelle: 'Fabrication de meubles et de produits connexes', niveau: 4 },
  { code: '339', libelle: 'Activités diverses de fabrication', niveau: 1 },
  { code: '411', libelle: 'Grossistes-marchands de produits agricoles', niveau: 1 },
  { code: '412', libelle: 'Grossistes-marchands de pétrole et de produits pétroliers', niveau: 4 },
  { code: '413', libelle: 'Grossistes-marchands de produits alimentaires, de boissons et de tabac', niveau: 4 },
  { code: '414', libelle: 'Grossistes-marchands d\'articles personnels et ménagers', niveau: 1 },
  { code: '415', libelle: 'Grossistes-marchands de véhicules automobiles, et de pièces et d\'accessoires de véhicules automobiles', niveau: 1 },
  { code: '416', libelle: 'Grossistes-marchands de matériaux et fournitures de construction', niveau: 1 },
  { code: '417', libelle: 'Grossistes-marchands de machines, de matériel et de fournitures', niveau: 1 },
  { code: '418', libelle: 'Grossistes-marchands de produits divers', niveau: 1 },
  { code: '419', libelle: 'Commerce électronique de gros entre entreprises, et agents et courtiers', niveau: 2 },
  { code: '441', libelle: 'Concessionnaires de véhicules et de pièces automobiles', niveau: 1 },
  { code: '442', libelle: 'Magasins de meubles et d\'accessoires de maison', niveau: 4 },
  { code: '443', libelle: 'Magasins d\'appareils électroniques et ménagers', niveau: 1 },
  { code: '444', libelle: 'Marchands de matériaux de construction et de matériel et fournitures de jardinage', niveau: 2 },
  { code: '445', libelle: 'Magasins d\'alimentation', niveau: 2 },
  { code: '446', libelle: 'Magasins de produits de santé et de soins personnels', niveau: 1 },
  { code: '447', libelle: 'Stations-service', niveau: 2 },
  { code: '448', libelle: 'Magasins de vêtements et d\'accessoires vestimentaires', niveau: 1 },
  { code: '451', libelle: 'Magasins d\'articles de sport, d\'articles de passe-temps, d\'articles de musique et de livres', niveau: 1 },
  { code: '452', libelle: 'Magasins de marchandises diverses', niveau: 4 },
  { code: '453', libelle: 'Magasins de détail divers', niveau: 1 },
  { code: '454', libelle: 'Détaillants hors magasin', niveau: 1 },
  { code: '481', libelle: 'Transport aérien', niveau: 1 },
  { code: '482', libelle: 'Transport ferroviaire', niveau: 2 },
  { code: '483', libelle: 'Transport par eau', niveau: 2 },
  { code: '484', libelle: 'Transport par camion', niveau: 4 },
  { code: '485', libelle: 'Transport en commun et transport terrestre de voyageurs', niveau: 4 },
  { code: '486', libelle: 'Transport par pipeline', niveau: 2 },
  { code: '487', libelle: 'Transport de tourisme et d\'agrément', niveau: 2 },
  { code: '488', libelle: 'Activités de soutien au transport', niveau: 2 },
  { code: '491', libelle: 'Services postaux', niveau: 2 },
  { code: '492', libelle: 'Messageries et services de messagers', niveau: 4 },
  { code: '493', libelle: 'Entreposage', niveau: 4 },
  { code: '511', libelle: 'Édition (sauf par Internet)', niveau: 1 },
  { code: '512', libelle: 'Industries du film et de l\'enregistrement sonore', niveau: 1 },
  { code: '515', libelle: 'Radiotélévision (sauf par Internet)', niveau: 1 },
  { code: '517', libelle: 'Télécommunications', niveau: 1 },
  { code: '518', libelle: 'Traitement de données, hébergement de données et services connexes', niveau: 1 },
  { code: '519', libelle: 'Autres services d\'information', niveau: 1 },
  { code: '521', libelle: 'Autorités monétaires – banque centrale', niveau: 2 },
  { code: '522', libelle: 'Intermédiation financière et activités connexes', niveau: 1 },
  { code: '523', libelle: 'Valeurs mobilières, contrats de marchandises et autres activités d\'investissement financier connexes', niveau: 1 },
  { code: '524', libelle: 'Sociétés d\'assurance et activités connexes', niveau: 1 },
  { code: '526', libelle: 'Fonds et autres instruments financiers', niveau: 1 },
  { code: '531', libelle: 'Services immobiliers', niveau: 2 },
  { code: '532', libelle: 'Services de location et de location à bail', niveau: 2 },
  { code: '533', libelle: 'Bailleurs de biens incorporels non financiers (sauf les œuvres protégées par le droit d\'auteur)', niveau: 2 },
  { code: '541', libelle: 'Services professionnels, scientifiques et techniques', niveau: 1 },
  { code: '551', libelle: 'Gestion de sociétés et d\'entreprises', niveau: 1 },
  { code: '561', libelle: 'Services administratifs et services de soutien', niveau: 3 },
  { code: '562', libelle: 'Services de gestion des déchets et d\'assainissement', niveau: 4 },
  { code: '611', libelle: 'Services d\'enseignement', niveau: 2 },
  { code: '621', libelle: 'Services de soins de santé ambulatoires', niveau: 4 },
  { code: '622', libelle: 'Hôpitaux', niveau: 4 },
  { code: '623', libelle: 'Établissements de soins infirmiers et de soins pour bénéficiaires internes', niveau: 4 },
  { code: '624', libelle: 'Assistance sociale', niveau: 3 },
  { code: '711', libelle: 'Arts d\'interprétation, sports-spectacles et activités connexes', niveau: 1 },
  { code: '712', libelle: 'Établissements du patrimoine', niveau: 1 },
  { code: '713', libelle: 'Divertissement, loisirs, jeux de hasard et loteries', niveau: 1 },
  { code: '721', libelle: 'Services d\'hébergement', niveau: 4 },
  { code: '722', libelle: 'Services de restauration et débits de boissons', niveau: 2 },
  { code: '811', libelle: 'Réparation et entretien', niveau: 4 },
  { code: '812', libelle: 'Services personnels et services de blanchissage', niveau: 2 },
  { code: '813', libelle: 'Organismes religieux, fondations, groupes de citoyens et organisations professionnelles et similaires', niveau: 2 },
  { code: '814', libelle: 'Ménages privés', niveau: 2 },
  { code: '911', libelle: 'Administration publique fédérale', niveau: 2 },
  { code: '912', libelle: 'Administrations publiques provinciales et territoriales', niveau: 1 },
  { code: '913', libelle: 'Administrations publiques locales, municipales et régionales', niveau: 3 },
  { code: '914', libelle: 'Administrations publiques autochtones', niveau: 3 },
  { code: '919', libelle: 'Organismes publics internationaux et autres organismes publics extraterritoriaux', niveau: 2 },
]

/** Index par code, pour une recherche directe. */
const PAR_CODE = new Map<string, SecteurScian>(SECTEURS_SCIAN.map(s => [s.code, s]))

/**
 * Retrouve le sous-secteur SCIAN correspondant à un code saisi.
 *
 * Le classement de la CNESST est publié au niveau du sous-secteur, soit trois
 * chiffres. Les codes plus fins — quatre à six chiffres — sont ramenés à leurs
 * trois premiers. Un code plus court, ou absent de la table, renvoie `null` :
 * l'absence est une information, pas un motif pour retenir un niveau voisin.
 */
export function secteurPourCode(code: string | null | undefined): SecteurScian | null {
  const chiffres = (code ?? '').replace(/\D/g, '')
  if (chiffres.length < 3) return null
  return PAR_CODE.get(chiffres.slice(0, 3)) ?? null
}

/** Niveau associé à un code SCIAN, ou `null` s'il est inconnu. */
export function niveauPourCode(code: string | null | undefined): NiveauRisque | null {
  return secteurPourCode(code)?.niveau ?? null
}

/**
 * Libellé à afficher pour un niveau. Délibérément neutre.
 *
 * Les obligations croissent bien avec le niveau, mais l'annexe I du RMPPÉ
 * classe des activités pour moduler des modalités — elle ne qualifie pas le
 * risque d'un établissement. Présenter le niveau 4 comme « risque élevé »
 * déduirait de la réglementation une chose qu'elle ne dit pas.
 */
export function LIBELLE_NIVEAU_NEUTRE(niveau: NiveauRisque): string {
  return `Niveau ${niveau} (CNESST–IRSST, SCIAN 2012)`
}

/**
 * Établissements que le classement ne couvre pas, d'après l'outil de recherche
 * de la CNESST. Un établissement absent n'a pas un niveau « inconnu par
 * défaut » : il peut relever d'un régime distinct.
 */
export const CAS_NON_COUVERTS = [
  "les établissements sans NEQ (numéro d'entreprise du Québec) sont exclus de l'outil de recherche",
  'certains établissements ne sont pas couverts par le classement',
  "les secteurs de l'éducation ainsi que de la santé et des services sociaux font l'objet de dispositions particulières"
] as const
