/**
 * Régime d'assujettissement — mécanismes de prévention et de participation
 * en établissement.
 *
 * SOURCES NORMATIVES
 *   - CNESST, « Comment se préparer à vos nouvelles obligations en santé et en
 *     sécurité du travail ? — Mécanismes de prévention et de participation en
 *     établissement », publication DC200-7107-1, février 2026. Source
 *     principale : elle contient le tableau synthèse des mécanismes applicables.
 *   - CNESST, « Synthèse des mécanismes de prévention et de participation en
 *     établissement », publication DC100-2304, version 2025-09. Conservée pour
 *     la mutuelle de prévention et les chantiers de construction, absents de la
 *     publication de 2026.
 *
 * ENCADREMENT
 *   Loi sur la santé et la sécurité du travail (RLRQ c. S-2.1) et Règlement sur
 *   les mécanismes de prévention et de participation en établissement (RMPPÉ),
 *   en vigueur depuis le 1er octobre 2025.
 *
 * L'application raisonnait auparavant en « groupes prioritaires », une
 * classification du régime antérieur. Le déclencheur est désormais l'effectif
 * de l'établissement, calculé sur une période d'un an.
 *
 * AVERTISSEMENT
 *   Les contenus publiés par la CNESST sont informatifs ; les lois et règlements
 *   ont priorité. Ce module encode la synthèse officielle, il ne remplace pas
 *   une analyse juridique du cas d'espèce.
 */

import {
  fonctionnementComite,
  nombreRepresentantsTravailleurs,
  tempsLiberationMensuel,
  REFERENCE_RMPPE
} from '@/lib/rmppe'

/** Seuil d'effectif séparant les deux régimes. */
export const SEUIL_EFFECTIF = 20

/**
 * Nombre de jours d'atteinte du seuil déclenchant le comité de santé et de
 * sécurité : « les établissements groupant 20 travailleuses et travailleurs ou
 * plus pendant au moins 21 jours au cours de l'année doivent créer un CSS »
 * (DC200-7107-1, p. 8).
 */
export const SEUIL_JOURS_PRESENCE_CSS = 21

/**
 * Durée maximale d'un dépassement temporaire, en jours par année — corollaire
 * du seuil précédent : 20 jours ou moins n'entraînent pas de comité.
 */
export const DUREE_MAX_DEPASSEMENT_TEMPORAIRE_JOURS = SEUIL_JOURS_PRESENCE_CSS - 1

/** Effectif à partir duquel un chantier de construction relève de mesures distinctes. */
export const SEUIL_CHANTIER_CONSTRUCTION = 10

/** Délai d'élaboration et de mise en application, à partir du 1er octobre 2025. */
export const DELAI_MISE_EN_APPLICATION_MOIS = 12

/** Périodicité de production du formulaire de programme de prévention. */
export const PERIODICITE_TRANSMISSION_ANNEES = 3

/** Durée minimale d'application de l'approche par multiétablissements. */
export const DUREE_MIN_MULTIETABLISSEMENTS_ANNEES = 3

/** Périodicité du programme de formation continue du représentant, en années. */
export const PERIODICITE_FORMATION_CONTINUE_RSS_ANNEES = 2

/** Durée du programme de formation continue du représentant, en heures. */
export const DUREE_FORMATION_CONTINUE_RSS_HEURES = 7

export const ENTREE_EN_VIGUEUR_RMPPE = '2025-10-01'

export const REFERENCE_PUBLICATION = 'CNESST, DC200-7107-1 (2026-02)'
export const REFERENCE_SYNTHESE = REFERENCE_PUBLICATION

/**
 * Niveau de risque du secteur d'activité — 1 à 4, modèle multicritères
 * CNESST–IRSST fondé sur les codes SCIAN 2012, publié par l'outil « Niveau des
 * activités de l'établissement ».
 *
 * Il ne détermine PAS quels mécanismes s'appliquent — c'est l'effectif qui le
 * fait. Voir `modalitesSelonNiveau()` pour ce qu'il conditionne réellement.
 */
export type NiveauRisque = 1 | 2 | 3 | 4

export type MecanismePrevention = 'plan_action' | 'programme_prevention'

export interface ContexteEtablissement {
  /** Nombre de travailleurs dans l'établissement, sur une période d'un an. */
  effectif: number
  /**
   * Nombre de jours, dans l'année, où l'établissement groupe au moins
   * `SEUIL_EFFECTIF` travailleurs. Sous `SEUIL_JOURS_PRESENCE_CSS`, le comité
   * et le représentant ne sont pas exigés. Non renseigné, on présume une
   * présence permanente — l'hypothèse la plus exigeante.
   */
  joursAtteinteSeuil?: number
  /**
   * Raccourci historique équivalant à `joursAtteinteSeuil < 21`.
   * @deprecated Préférer `joursAtteinteSeuil`, qui porte le nombre réel.
   */
  depassementTemporaire?: boolean
  /**
   * L'employeur appartient à une mutuelle de prévention : le programme de
   * prévention s'impose alors quel que soit l'effectif (DC100-2304).
   */
  mutuellePrevention?: boolean
  /**
   * L'établissement est couvert par l'approche par multiétablissements.
   *
   * Conséquence souvent méconnue : un établissement de 19 travailleurs ou moins
   * couvert par un regroupement bascule dans le régime des 20 travailleurs et
   * plus — programme de prévention, comité et représentant — et n'a plus
   * d'agent de liaison (DC200-7107-1, p. 5 et 13).
   */
  multietablissements?: boolean
  /** Niveau de risque sectoriel, s'il est connu. */
  niveauRisque?: NiveauRisque
}

export interface ObligationFormation {
  mecanisme: 'agent_liaison' | 'comite' | 'representant'
  libelle: string
  formationInitiale: string
  formationContinue: string | null
  contenuPublie: boolean
}

export interface MecanismesApplicables {
  prevention: {
    mecanisme: MecanismePrevention
    libelle: string
    justification: string
    /** Éléments minimaux que le document doit contenir. */
    contenuMinimal: readonly string[]
    /** Mise à jour annuelle exigée dans les deux régimes. */
    miseAJourAnnuelle: true
  }
  participation: {
    agentDeLiaison: boolean
    comiteSanteSecurite: boolean
    representantSanteSecurite: boolean
    justification: string
  }
  formations: ObligationFormation[]
  echeances: {
    miseEnApplication: string
    transmissionCnesst: string
    delaiMois: number
    periodiciteAnnees: number
  }
  /** Avertissements à présenter à l'utilisateur et à porter au document. */
  avertissements: string[]
  reference: string
}

/**
 * Contenu minimal d'un plan d'action — 7 éléments (DC200-7107-1, p. 6).
 * « L'employeur a le choix du format utilisé, mais doit y inclure au moins […] »
 */
export const CONTENU_MINIMAL_PLAN_ACTION = [
  "l'identification des risques pouvant affecter la santé et la sécurité des travailleuses et travailleurs de l'établissement, y compris les risques pouvant affecter particulièrement les travailleuses et travailleurs âgés de 16 ans et moins",
  "les mesures de prévention et les priorités d'action, en privilégiant la hiérarchie des mesures de prévention",
  "les mesures de surveillance et d'entretien qui permettent de s'assurer que les risques identifiés demeurent éliminés ou, à défaut, maîtrisés",
  "l'identification des moyens et des équipements de protection individuelle",
  "la formation et l'information en matière de santé et de sécurité",
  'la politique de prévention et de prise en charge des situations de harcèlement psychologique',
  "les risques et les mesures de prévention tirés des programmes de santé au travail applicables à l'établissement"
] as const

/**
 * Contenu minimal d'un programme de prévention — 10 éléments
 * (DC200-7107-1, p. 7).
 */
export const CONTENU_MINIMAL_PROGRAMME_PREVENTION = [
  "l'identification et l'analyse des risques pouvant affecter la santé et la sécurité des travailleuses et travailleurs de l'établissement, y compris les risques pouvant affecter particulièrement les travailleuses et travailleurs âgés de 16 ans et moins",
  "les mesures de prévention et les priorités d'action, en privilégiant la hiérarchie des mesures de prévention",
  "les mesures de surveillance, d'évaluation, d'entretien et de suivi qui permettent de s'assurer que les risques identifiés demeurent éliminés ou, à défaut, maîtrisés",
  "l'identification des moyens et des équipements de protection individuelle, déterminée par le comité de santé et de sécurité",
  'les programmes de formation et d\'information, déterminés par le comité de santé et de sécurité',
  "les examens de santé de pré-embauche et les examens de santé en cours d'emploi exigés par règlements",
  "une liste des matières dangereuses utilisées dans l'établissement et des contaminants qui peuvent y être émis",
  "le maintien d'un service adéquat de premiers soins pour répondre aux urgences",
  'la politique de prévention et de prise en charge des situations de harcèlement psychologique',
  "les risques et les mesures de prévention tirés des programmes de santé au travail applicables à l'établissement"
] as const

/**
 * Critères cumulatifs de l'approche par multiétablissements
 * (DC200-7107-1, p. 11). Si l'un n'est pas respecté, l'approche est exclue.
 */
export const CRITERES_MULTIETABLISSEMENTS = [
  "l'employeur a plus d'un établissement ayant l'obligation d'élaborer et de mettre en application un programme de prévention, soit 20 travailleurs ou plus dans au moins deux établissements",
  'les établissements visés par le regroupement exercent des activités de même nature',
  "l'employeur tient compte du Guide sur l'approche par multiétablissements",
  "le comité de santé et de sécurité est en mesure d'exercer ses fonctions adéquatement dans chacun des établissements visés",
  "le ou les représentants en santé et en sécurité sont en mesure d'exercer leurs fonctions adéquatement dans chacun des établissements visés"
] as const

/** Obligations découlant de l'approche par multiétablissements (p. 11). */
export const OBLIGATIONS_MULTIETABLISSEMENTS = [
  "un seul programme de prévention, tenant compte de l'ensemble des activités exercées",
  "l'approche doit inclure les établissements de 19 travailleurs ou moins ayant des activités de même nature",
  'un comité de santé et de sécurité doit être formé',
  'au moins un représentant en santé et en sécurité doit être désigné',
  `l'approche doit s'appliquer au moins ${DUREE_MIN_MULTIETABLISSEMENTS_ANNEES} ans`
] as const

const normaliserEffectif = (valeur: number): number =>
  Number.isFinite(valeur) && valeur > 0 ? Math.floor(valeur) : 0

/**
 * Formations obligatoires attachées aux mécanismes retenus
 * (DC200-7107-1, p. 6, 9 et 10).
 *
 * Le contenu et la durée de la formation de l'agent de liaison relèvent de la
 * CNESST et n'étaient pas publiés en février 2026 : `contenuPublie` en rend
 * compte plutôt que de laisser croire à une exigence chiffrée.
 */
function formationsApplicables(participation: {
  agentDeLiaison: boolean
  comiteSanteSecurite: boolean
  representantSanteSecurite: boolean
}): ObligationFormation[] {
  const formations: ObligationFormation[] = []

  if (participation.agentDeLiaison) {
    formations.push({
      mecanisme: 'agent_liaison',
      libelle: 'Agent de liaison en santé et en sécurité',
      formationInitiale:
        "Formation théorique dans l'année suivant octobre 2025 ou l'année suivant la désignation. " +
        'Contenu et durée déterminés par la CNESST.',
      formationContinue: null,
      contenuPublie: false
    })
  }

  if (participation.comiteSanteSecurite) {
    formations.push({
      mecanisme: 'comite',
      libelle: 'Membres du comité de santé et de sécurité',
      formationInitiale:
        "Formation théorique d'une journée portant sur les sujets prévus au RMPPÉ : cadre " +
        "législatif, identification et analyse des risques, contenu d'un programme de prévention, " +
        'rôle et fonctions du membre du comité.',
      formationContinue: null,
      contenuPublie: false
    })
  }

  if (participation.representantSanteSecurite) {
    formations.push({
      mecanisme: 'representant',
      libelle: 'Représentant en santé et en sécurité',
      formationInitiale:
        "Formation théorique d'une journée portant sur les sujets prévus au RMPPÉ : rôle, " +
        'fonctions et responsabilités du représentant, inspection des lieux de travail.',
      formationContinue:
        `Programme de formation de ${DUREE_FORMATION_CONTINUE_RSS_HEURES} heures tous les ` +
        `${PERIODICITE_FORMATION_CONTINUE_RSS_ANNEES} ans, portant sur un risque — notamment les ` +
        'risques émergents — et sur les modifications législatives ou réglementaires.',
      contenuPublie: false
    })
  }

  return formations
}

/**
 * Détermine les mécanismes applicables à un établissement.
 *
 * PRÉVENTION — plan d'action à 19 travailleurs ou moins ; programme de
 * prévention à 20 travailleurs ou plus, pour tout employeur appartenant à une
 * mutuelle de prévention, et pour tout établissement couvert par l'approche par
 * multiétablissements quel que soit son effectif.
 *
 * PARTICIPATION — comité de santé et de sécurité pour l'établissement groupant
 * 20 travailleurs ou plus pendant au moins 21 jours dans l'année, ainsi que
 * dans un regroupement multiétablissements. Le représentant suit le comité :
 * « c'est l'existence du CSS qui conditionne la désignation du RSS ». L'agent
 * de liaison est désigné dans tout établissement n'ayant pas l'obligation de
 * désigner un représentant.
 */
export function determinerMecanismes(contexte: ContexteEtablissement): MecanismesApplicables {
  const effectif = normaliserEffectif(contexte.effectif)
  const atteintSeuil = effectif >= SEUIL_EFFECTIF
  const regroupe = Boolean(contexte.multietablissements)
  const avertissements: string[] = []

  // Présence suffisante : le nombre de jours prime, le drapeau historique sert
  // de repli lorsqu'il n'a pas été renseigné.
  const joursDeclares = contexte.joursAtteinteSeuil
  const presenceSuffisante =
    typeof joursDeclares === 'number' && Number.isFinite(joursDeclares)
      ? joursDeclares >= SEUIL_JOURS_PRESENCE_CSS
      : !contexte.depassementTemporaire

  // --- Mécanisme de prévention ---
  const programmeExige = atteintSeuil || Boolean(contexte.mutuellePrevention) || regroupe

  let justificationPrevention: string
  if (regroupe && !atteintSeuil) {
    justificationPrevention =
      `Établissement de ${effectif} travailleur(s) couvert par l'approche par ` +
      `multiétablissements : le programme de prévention du regroupement s'applique, en lieu et ` +
      `place du plan d'action.`
  } else if (contexte.mutuellePrevention && !atteintSeuil) {
    justificationPrevention =
      `Établissement de ${effectif} travailleur(s), mais l'employeur appartient à une mutuelle ` +
      `de prévention : le programme de prévention s'impose indépendamment de l'effectif.`
  } else if (atteintSeuil) {
    justificationPrevention =
      `Établissement de ${effectif} travailleurs : le programme de prévention s'applique à ` +
      `partir de ${SEUIL_EFFECTIF} travailleurs.`
  } else {
    justificationPrevention =
      `Établissement de ${effectif} travailleur(s) : le plan d'action s'applique à ` +
      `${SEUIL_EFFECTIF - 1} travailleurs ou moins.`
  }

  // --- Mécanismes de participation ---
  const comiteExige = (atteintSeuil && presenceSuffisante) || regroupe
  // « C'est l'existence du CSS qui conditionne la désignation du RSS dans
  // l'établissement. » (DC200-7107-1, tableau synthèse, p. 13)
  const representantExige = comiteExige
  // « Un ALSS est désigné dans tout établissement n'ayant pas l'obligation de
  // désigner un RSS. » (idem)
  const agentDeLiaisonExige = !representantExige

  let justificationParticipation: string
  if (regroupe && !atteintSeuil) {
    justificationParticipation =
      `Établissement couvert par un regroupement : le comité de santé et de sécurité et le ` +
      `représentant en santé et en sécurité du regroupement s'appliquent ; aucun agent de ` +
      `liaison n'est désigné.`
  } else if (atteintSeuil && !presenceSuffisante) {
    justificationParticipation =
      `L'établissement groupe ${SEUIL_EFFECTIF} travailleurs ou plus pendant moins de ` +
      `${SEUIL_JOURS_PRESENCE_CSS} jours dans l'année : le comité de santé et de sécurité n'est ` +
      `pas exigé, donc le représentant non plus ; un agent de liaison est désigné.`
    avertissements.push(
      `L'exception de présence inférieure à ${SEUIL_JOURS_PRESENCE_CSS} jours est invoquée : ` +
        'elle doit être documentée et réévaluée chaque année.'
    )
    avertissements.push(
      "Deux formulations coexistent dans la publication : l'agent de liaison y est présenté " +
        "tantôt pour les établissements de 19 travailleurs ou moins, tantôt pour tout " +
        "établissement sans représentant. La seconde, plus générale, est retenue ici — à " +
        'valider auprès de la CNESST pour ce cas de figure.'
    )
  } else if (comiteExige) {
    justificationParticipation =
      `À partir de ${SEUIL_EFFECTIF} travailleurs présents au moins ${SEUIL_JOURS_PRESENCE_CSS} ` +
      `jours dans l'année : mise en place d'un comité de santé et de sécurité et désignation ` +
      `d'un représentant en santé et en sécurité, membre d'office du comité.`
  } else {
    justificationParticipation =
      `À ${SEUIL_EFFECTIF - 1} travailleurs ou moins, sans obligation de représentant : ` +
      `désignation d'un agent de liaison en santé et en sécurité.`
  }

  // --- Avertissements transverses ---
  if (regroupe) {
    avertissements.push(
      "Approche par multiétablissements : un seul programme de prévention, au moins un comité " +
        "et au moins un représentant couvrent l'ensemble des établissements regroupés. " +
        `Les ${CRITERES_MULTIETABLISSEMENTS.length} critères doivent tous être respectés et ` +
        `l'approche s'applique au moins ${DUREE_MIN_MULTIETABLISSEMENTS_ANNEES} ans.`
    )
  }

  if (programmeExige) {
    avertissements.push(
      "Si l'effectif descend à 19 travailleurs ou moins en cours d'année, le programme de " +
        "prévention et le comité de santé et de sécurité sont maintenus jusqu'au 31 décembre de " +
        "l'année suivante ; le régime allégé ne s'applique qu'à compter du jour suivant."
    )
  }

  if (comiteExige) {
    avertissements.push(
      'Les règles de désignation des membres et de fonctionnement du comité — dont la fréquence ' +
        "des rencontres — sont convenues par entente. À défaut d'entente, le RMPPÉ s'applique."
    )
  }

  avertissements.push(
    "L'effectif se calcule sur une période d'un an, selon les règles d'inclusion et d'exclusion " +
      'publiées par la CNESST.'
  )

  const participation = {
    agentDeLiaison: agentDeLiaisonExige,
    comiteSanteSecurite: comiteExige,
    representantSanteSecurite: representantExige,
    justification: justificationParticipation
  }

  return {
    prevention: {
      mecanisme: programmeExige ? 'programme_prevention' : 'plan_action',
      libelle: programmeExige ? 'Programme de prévention' : "Plan d'action",
      justification: justificationPrevention,
      contenuMinimal: programmeExige
        ? CONTENU_MINIMAL_PROGRAMME_PREVENTION
        : CONTENU_MINIMAL_PLAN_ACTION,
      miseAJourAnnuelle: true
    },
    participation,
    formations: formationsApplicables(participation),
    echeances: {
      miseEnApplication: echeanceMiseEnApplication(),
      transmissionCnesst: echeanceTransmission(),
      delaiMois: DELAI_MISE_EN_APPLICATION_MOIS,
      periodiciteAnnees: PERIODICITE_TRANSMISSION_ANNEES
    },
    avertissements,
    reference: REFERENCE_PUBLICATION
  }
}

/**
 * Conservé pour compatibilité : ne renvoie que le mécanisme de prévention.
 */
export function determinerRegime(effectif: number) {
  const mecanismes = determinerMecanismes({ effectif })
  return {
    typeDocument: mecanismes.prevention.mecanisme,
    libelle: mecanismes.prevention.libelle,
    justification: mecanismes.prevention.justification,
    seuilApplique: SEUIL_EFFECTIF,
    delaiMiseEnApplicationMois: DELAI_MISE_EN_APPLICATION_MOIS,
    periodiciteTransmissionAnnees: PERIODICITE_TRANSMISSION_ANNEES
  }
}

export function echeanceMiseEnApplication(depart: Date = new Date()): string {
  const echeance = new Date(depart)
  echeance.setMonth(echeance.getMonth() + DELAI_MISE_EN_APPLICATION_MOIS)
  return echeance.toISOString().slice(0, 10)
}

export function echeanceTransmission(depart: Date = new Date()): string {
  const echeance = new Date(depart)
  echeance.setFullYear(echeance.getFullYear() + PERIODICITE_TRANSMISSION_ANNEES)
  return echeance.toISOString().slice(0, 10)
}

/**
 * Date jusqu'à laquelle les mécanismes sont maintenus lorsque l'effectif
 * descend sous le seuil : le 31 décembre de l'année suivante
 * (DC200-7107-1, p. 8).
 */
export function echeanceMaintienApresBaisse(dateBaisse: Date = new Date()): string {
  return `${dateBaisse.getFullYear() + 1}-12-31`
}

/**
 * Un chantier de construction de 10 travailleurs de la construction ou plus
 * relève de mécanismes DISTINCTS de ceux de l'établissement.
 *
 * L'entreprise de construction demeure par ailleurs un établissement :
 * l'employeur doit donc appliquer les deux régimes, pour son chantier et pour
 * son entreprise. (DC100-2304)
 */
export function chantierSoumisMesuresParticulieres(travailleursConstruction: number): boolean {
  return normaliserEffectif(travailleursConstruction) >= SEUIL_CHANTIER_CONSTRUCTION
}

export interface ModalitesParticipation {
  /** La modalité relève-t-elle d'abord d'une entente entre les parties ? */
  regleParEntente: true
  niveau: NiveauRisque | null
  /** Modalités renvoyées au RMPPÉ à défaut d'entente. */
  aDefautDEntente: readonly string[]
  /** Les valeurs supplétives du RMPPÉ sont désormais intégrées. */
  tableSuppletiveIntegree: boolean
  /** Valeurs chiffrées du Règlement, si le niveau et l'effectif sont connus. */
  valeurs: {
    reunionsParAnnee: number
    representantsTravailleurs: number
    heuresLiberationParMois: number
    reference: string
  } | null
  explication: string
}

/**
 * Modalités de fonctionnement du comité et du représentant : nombre de
 * représentants des travailleurs, fréquence des rencontres, temps de libération.
 *
 * Ces modalités ne découlent pas mécaniquement du niveau sectoriel. Elles sont
 * d'abord convenues PAR ENTENTE entre les parties — l'employeur et les
 * travailleurs pour la désignation, les membres du comité pour le
 * fonctionnement et le temps de libération. Le RMPPÉ n'intervient qu'à défaut
 * d'entente (art. 7, 17 et 33), et c'est là que le niveau joue.
 *
 * Les valeurs supplétives sont désormais intégrées, tirées du Règlement
 * lui-même. Elles ne sont renvoyées que si le niveau est connu : sans lui, rien
 * n'est deviné.
 */
export function modalitesSelonNiveau(
  niveau?: NiveauRisque,
  effectif?: number
): ModalitesParticipation {
  const aDefautDEntente = [
    'le nombre de représentants des travailleuses et travailleurs au comité',
    'les modalités de désignation des membres du comité',
    'la fréquence des rencontres du comité',
    'le temps de libération du représentant en santé et en sécurité'
  ]

  const socle =
    "Ces modalités sont convenues par entente entre les parties : règles de désignation entre " +
    "l'employeur et les travailleuses et travailleurs, règles de fonctionnement et temps de " +
    "libération entre les membres du comité. À défaut d'entente seulement, le RMPPÉ s'applique."

  if (!niveau) {
    return {
      regleParEntente: true,
      niveau: null,
      aDefautDEntente,
      tableSuppletiveIntegree: false,
      valeurs: null,
      explication:
        socle +
        " Le classement de l'établissement n'étant pas déterminé, les valeurs supplétives ne " +
        'peuvent pas être précisées.'
    }
  }

  const effectifRetenu = normaliserEffectif(effectif ?? 0)

  return {
    regleParEntente: true,
    niveau,
    aDefautDEntente,
    tableSuppletiveIntegree: true,
    valeurs: {
      reunionsParAnnee: fonctionnementComite(niveau).reunionsParAnnee,
      representantsTravailleurs: nombreRepresentantsTravailleurs(effectifRetenu).nombreRepresentants,
      heuresLiberationParMois: tempsLiberationMensuel(effectifRetenu, niveau).heuresParMois,
      reference: REFERENCE_RMPPE
    },
    explication:
      socle +
      ` Les valeurs ci-dessous sont celles du Règlement pour un établissement de niveau ` +
      `${niveau}.`
  }
}
