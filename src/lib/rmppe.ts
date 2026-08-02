/* © 2026 Preventera — AgenticX5. Tous droits réservés. Voir LICENSE.md. */
/**
 * Valeurs supplétives du Règlement sur les mécanismes de prévention et de
 * participation en établissement (RLRQ c. S-2.1, r. 8.3), à jour au
 * 1er avril 2026.
 *
 * PORTÉE — Ce module ne dit PAS quels mécanismes s'appliquent : c'est l'affaire
 * de `lmrsst.ts`, où l'effectif décide. Il fournit leurs MODALITÉS : combien de
 * réunions, combien de représentants, combien d'heures de libération, dans
 * quels délais se former.
 *
 * RÈGLE CARDINALE — Ces valeurs ne s'appliquent qu'À DÉFAUT D'ENTENTE. Les
 * articles 7, 17 et 33 sont explicites : le nombre de représentants se convient
 * entre l'employeur et les travailleurs, les règles de fonctionnement et le
 * temps de libération entre les membres du comité. Le Règlement n'intervient
 * que si les parties ne s'entendent pas. Présenter ces chiffres comme
 * l'obligation par défaut serait faux dans le cas général — d'où le drapeau
 * `sAppliqueADefautDEntente` porté par chaque résultat.
 *
 * SENS DE L'ÉCHELLE — Il est désormais établi, non plus déduit : les
 * obligations croissent avec le niveau. Niveau 1, 4 réunions par année ;
 * niveau 4, 9 réunions et jusqu'à quatre fois plus d'heures de libération.
 * Cela ne fait pas pour autant du niveau une mesure de gravité affichable :
 * l'annexe I classe des activités, elle ne qualifie pas un risque.
 */

import type { NiveauRisque } from '@/lib/lmrsst'

export const REFERENCE_RMPPE = 'RMPPÉ, RLRQ c. S-2.1, r. 8.3 (à jour au 1er avril 2026)'

/** Entrée en vigueur des mécanismes. */
export const DEBUT_REGIME = '2025-10-01'

/** Fin de la période transitoire des articles 37 et 38. */
export const FIN_PERIODE_TRANSITOIRE = '2026-09-30'

export interface ValeurSuppletive {
  /** Toujours vrai : rappel que l'entente entre les parties prime. */
  sAppliqueADefautDEntente: true
  /** Article du Règlement dont la valeur est tirée. */
  article: string
  reference: string
}

// ---------------------------------------------------------------------------
// Article 6 — hiérarchie des mesures de prévention
// ---------------------------------------------------------------------------

/**
 * Six niveaux, et non cinq.
 *
 * Le générateur retenait jusqu'ici une hiérarchie à cinq niveaux attribuée à
 * l'article 51 de la Loi. L'article 6 du Règlement en énonce six, en isolant
 * la signalisation du risque comme un niveau distinct des mesures
 * administratives. C'est cette liste que l'employeur doit privilégier dans son
 * programme ou son plan d'action.
 */
export const HIERARCHIE_MESURES_PREVENTION = [
  "l'élimination du risque à la source",
  'le remplacement de matériaux, de processus ou d\'équipements afin de réduire le risque',
  "la mise en place de mesures de contrôle technique du risque lié à l'environnement de travail et aux équipements",
  'la mise en place de signaux permettant de mettre en évidence le risque',
  'la mise en place de mesures de contrôle administratif du risque',
  'la mise à la disposition des travailleurs de moyens et d\'équipements de protection individuels ou collectifs'
] as const

// ---------------------------------------------------------------------------
// Article 7 — nombre de représentants des travailleurs au comité
// ---------------------------------------------------------------------------

export interface CompositionComite extends ValeurSuppletive {
  /** Représentants des travailleurs, représentant en santé et sécurité inclus. */
  nombreRepresentants: number
  /**
   * Cas particulier de la première tranche : le nombre passe à 3 lorsque
   * l'établissement comprend un groupe de travailleurs non représentés par une
   * association accréditée ayant désigné un membre du comité (art. 11).
   */
  nombreSiGroupeNonRepresente?: number
  /** Null lorsque l'effectif ne déclenche pas de comité. */
  applicable: boolean
}

const normaliser = (valeur: number): number =>
  Number.isFinite(valeur) && valeur > 0 ? Math.floor(valeur) : 0

/**
 * Nombre de représentants des travailleurs au comité, à défaut d'entente
 * (art. 7). Le représentant en santé et en sécurité est compris dans ce nombre.
 */
export function nombreRepresentantsTravailleurs(effectif: number): CompositionComite {
  const n = normaliser(effectif)
  const base: ValeurSuppletive = {
    sAppliqueADefautDEntente: true,
    article: 'art. 7',
    reference: REFERENCE_RMPPE
  }

  if (n < 20) {
    return { ...base, nombreRepresentants: 0, applicable: false }
  }
  if (n <= 50) {
    return { ...base, nombreRepresentants: 2, nombreSiGroupeNonRepresente: 3, applicable: true }
  }
  if (n <= 100) return { ...base, nombreRepresentants: 3, applicable: true }
  if (n <= 500) return { ...base, nombreRepresentants: 4, applicable: true }
  if (n <= 1000) return { ...base, nombreRepresentants: 6, applicable: true }
  if (n <= 1500) return { ...base, nombreRepresentants: 7, applicable: true }
  return { ...base, nombreRepresentants: 8, applicable: true }
}

// ---------------------------------------------------------------------------
// Articles 18, 19 et 20 — fonctionnement du comité
// ---------------------------------------------------------------------------

export interface FonctionnementComite extends ValeurSuppletive {
  reunionsParAnnee: number
  /** Le rythme trimestriel s'impose en plus du total annuel (art. 19, al. 2). */
  auMoinsUneParTrimestre: true
  /** Délai de tenue de la première réunion, en jours (art. 18). */
  delaiPremiereReunionJours: number
  /** Délai de convocation après un événement grave, en jours ouvrables (art. 20). */
  delaiReunionEvenementGraveJoursOuvrables: number
  evenementsDeclencheurs: readonly string[]
}

/** Fréquence minimale des réunions selon le niveau (art. 19). */
const REUNIONS_PAR_NIVEAU: Record<NiveauRisque, number> = { 1: 4, 2: 6, 3: 6, 4: 9 }

export function fonctionnementComite(niveau: NiveauRisque): FonctionnementComite {
  return {
    sAppliqueADefautDEntente: true,
    article: 'art. 18 à 20',
    reference: REFERENCE_RMPPE,
    reunionsParAnnee: REUNIONS_PAR_NIVEAU[niveau],
    auMoinsUneParTrimestre: true,
    delaiPremiereReunionJours: 30,
    delaiReunionEvenementGraveJoursOuvrables: 3,
    evenementsDeclencheurs: [
      "le décès d'un travailleur à la suite d'un accident du travail",
      "pour un travailleur, la perte totale ou partielle d'un membre ou de son usage, ou un traumatisme physique important",
      "des blessures telles à plusieurs travailleurs qu'ils ne pourront pas accomplir leurs fonctions pendant un jour ouvrable"
    ]
  }
}

// ---------------------------------------------------------------------------
// Article 33 — temps minimal de libération du représentant
// ---------------------------------------------------------------------------

/**
 * Barème de l'article 33, en heures par mois, par tranche d'effectif et par
 * niveau. Les sept premières tranches sont des valeurs fixes ; au-delà de 500
 * travailleurs, une base s'augmente d'un incrément par tranche de 100.
 */
const BAREME_LIBERATION: ReadonlyArray<{
  effectifMax: number
  heures: Record<NiveauRisque, number>
}> = [
  { effectifMax: 19, heures: { 1: 3, 2: 4, 3: 4, 4: 4 } },
  { effectifMax: 50, heures: { 1: 3, 2: 4, 3: 8, 4: 13 } },
  { effectifMax: 100, heures: { 1: 7, 2: 8, 3: 16, 4: 26 } },
  { effectifMax: 200, heures: { 1: 11, 2: 14, 3: 27, 4: 43 } },
  { effectifMax: 300, heures: { 1: 16, 2: 21, 3: 41, 4: 65 } },
  { effectifMax: 400, heures: { 1: 20, 2: 25, 3: 49, 4: 78 } },
  { effectifMax: 500, heures: { 1: 23, 2: 30, 3: 57, 4: 91 } }
]

/** Au-delà de 500 travailleurs : base de la tranche 401-500 et incrément. */
const INCREMENT_AU_DELA_DE_500: Record<NiveauRisque, number> = { 1: 4, 2: 6, 3: 11, 4: 17 }
const SEUIL_BAREME_OUVERT = 500

export interface TempsLiberation extends ValeurSuppletive {
  /** Heures par mois. */
  heuresParMois: number
  /**
   * Vrai au-delà de 500 travailleurs, où la valeur résulte d'un calcul et non
   * d'une lecture directe du barème.
   */
  calculee: boolean
  /** Explication du calcul, lorsque `calculee` est vrai. */
  detailCalcul?: string
  /**
   * Le total ne se multiplie pas par le nombre de représentants : « si
   * plusieurs représentants sont désignés […] le temps minimal qu'ils peuvent
   * consacrer ensemble est le même que celui prévu pour un seul représentant »
   * (art. 33, al. 2).
   */
  partageEntreRepresentants: true
  avertissements: readonly string[]
}

/**
 * Temps minimal mensuel que le représentant peut consacrer à ses fonctions, à
 * défaut d'entente (art. 33).
 *
 * Ne couvre pas les fonctions visées aux paragraphes 2°, 6° et 7° du premier
 * alinéa de l'article 90 de la Loi, qui s'exercent en sus.
 */
export function tempsLiberationMensuel(
  effectif: number,
  niveau: NiveauRisque
): TempsLiberation {
  const n = normaliser(effectif)
  const avertissements: string[] = [
    "Ce temps ne comprend pas les fonctions visées aux paragraphes 2°, 6° et 7° du premier " +
      "alinéa de l'article 90 de la Loi, qui s'exercent en sus.",
    "Lorsqu'une convention prévoit déjà des heures pour ces fonctions, les heures du Règlement " +
      'ne s\'y additionnent pas (art. 33, al. 3).'
  ]

  const base: ValeurSuppletive = {
    sAppliqueADefautDEntente: true,
    article: 'art. 33',
    reference: REFERENCE_RMPPE
  }

  const tranche = BAREME_LIBERATION.find(t => n <= t.effectifMax)
  if (tranche) {
    return {
      ...base,
      heuresParMois: tranche.heures[niveau],
      calculee: false,
      partageEntreRepresentants: true,
      avertissements
    }
  }

  // Au-delà de 500 : « 23 h auxquelles s'ajoutent 4 h pour chaque tranche
  // additionnelle de 100 travailleurs » (valeurs du niveau 1, transposées).
  //
  // INTERPRÉTATION — Le Règlement ne dit pas si une tranche entamée compte. Le
  // barème procédant par intervalles fermés (401 à 500), la suite naturelle est
  // 501-600, 601-700 : une tranche entamée est donc comptée. Lecture la plus
  // favorable au représentant, signalée comme telle plutôt que présentée comme
  // une certitude.
  const socle = BAREME_LIBERATION[BAREME_LIBERATION.length - 1].heures[niveau]
  const increment = INCREMENT_AU_DELA_DE_500[niveau]
  const tranches = Math.ceil((n - SEUIL_BAREME_OUVERT) / 100)

  avertissements.push(
    "Au-delà de 500 travailleurs, le Règlement ne précise pas le traitement d'une tranche de " +
      '100 entamée. Une tranche commencée est comptée ici ; à confirmer auprès de la CNESST.'
  )

  return {
    ...base,
    heuresParMois: socle + increment * tranches,
    calculee: true,
    detailCalcul:
      `${socle} h pour les 500 premiers travailleurs, plus ${increment} h par tranche de 100 ` +
      `additionnelle — ${tranches} tranche(s) pour ${n} travailleurs.`,
    partageEntreRepresentants: true,
    avertissements
  }
}

// ---------------------------------------------------------------------------
// Articles 34 à 36 et 39 — formation du représentant
// ---------------------------------------------------------------------------

export interface FormationRepresentant {
  dureeInitialeJours: number
  delaiInitialJours: number
  dureeContinueHeures: number
  periodiciteContinueAnnees: number
  sujetsContinue: readonly string[]
  /** Échéance transitoire de l'attestation initiale, selon le niveau (art. 39). */
  echeanceTransitoire: string
  article: string
  reference: string
}

/** Échéances transitoires de l'article 39, par niveau. */
const ECHEANCE_FORMATION_TRANSITOIRE: Record<NiveauRisque, string> = {
  4: '2026-10-01',
  3: '2027-04-01',
  2: '2027-10-01',
  1: '2028-04-01'
}

/**
 * Formation du représentant en santé et en sécurité (art. 34 à 36 et 39).
 *
 * La durée initiale dépend de son appartenance au comité : une journée s'il en
 * est membre (art. 34), deux journées sinon (art. 35) — le représentant isolé
 * devant couvrir seul un champ plus large.
 */
export function formationRepresentant(
  niveau: NiveauRisque,
  estMembreDuComite: boolean
): FormationRepresentant {
  return {
    dureeInitialeJours: estMembreDuComite ? 1 : 2,
    delaiInitialJours: 120,
    dureeContinueHeures: 7,
    periodiciteContinueAnnees: 2,
    sujetsContinue: [
      'un risque en particulier',
      'des risques émergents',
      'des modifications législatives ou réglementaires'
    ],
    echeanceTransitoire: ECHEANCE_FORMATION_TRANSITOIRE[niveau],
    article: estMembreDuComite ? 'art. 34, 36 et 39' : 'art. 35, 36 et 39',
    reference: REFERENCE_RMPPE
  }
}

// ---------------------------------------------------------------------------
// Articles 37 et 38 — allègements transitoires
// ---------------------------------------------------------------------------

export interface AllegementTransitoire {
  applicable: boolean
  /** Fréquence de réunions substituée, le cas échéant (art. 37). */
  reunionsParAnnee?: number
  /** Niveau dont le barème de libération est emprunté, le cas échéant (art. 38). */
  niveauEmprunteLiberation?: NiveauRisque
  jusquAu: string
  explication: string
  article: string
}

/**
 * Allègements du 1er octobre 2025 au 30 septembre 2026, pour les établissements
 * qui n'avaient ni comité ni représentant à la prévention au 30 septembre 2025.
 *
 * L'article 37 abaisse la fréquence des réunions du niveau 4 à 6 par année.
 * L'article 38 fait emprunter au niveau 3 le barème du niveau 2, et au niveau 4
 * celui du niveau 3.
 */
export function allegementTransitoire(
  niveau: NiveauRisque,
  options: { avaitComiteAu30Sept2025: boolean; avaitRepresentantAu30Sept2025: boolean }
): AllegementTransitoire {
  const reunions = !options.avaitComiteAu30Sept2025 && niveau === 4 ? 6 : undefined

  let niveauEmprunte: NiveauRisque | undefined
  if (!options.avaitRepresentantAu30Sept2025) {
    if (niveau === 3) niveauEmprunte = 2
    if (niveau === 4) niveauEmprunte = 3
  }

  const applicable = reunions !== undefined || niveauEmprunte !== undefined

  return {
    applicable,
    reunionsParAnnee: reunions,
    niveauEmprunteLiberation: niveauEmprunte,
    jusquAu: FIN_PERIODE_TRANSITOIRE,
    article: 'art. 37 et 38',
    explication: applicable
      ? `Allègement applicable jusqu'au ${FIN_PERIODE_TRANSITOIRE} : ` +
        [
          reunions !== undefined ? `${reunions} réunions par année au lieu de 9` : null,
          niveauEmprunte !== undefined
            ? `temps de libération du niveau ${niveauEmprunte} au lieu du niveau ${niveau}`
            : null
        ]
          .filter(Boolean)
          .join(' ; ') + '.'
      : "Aucun allègement transitoire : l'établissement n'entre dans aucun des cas des articles 37 et 38."
  }
}
