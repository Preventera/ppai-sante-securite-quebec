/**
 * Régime d'assujettissement — mécanismes de prévention et de participation
 * en établissement.
 *
 * Source normative : CNESST, « Synthèse des mécanismes de prévention et de
 * participation en établissement », publication DC100-2304, version 2025-09,
 * complétée par la page « Mécanismes de prévention et de participation en
 * établissement » du site de la CNESST.
 *
 * Encadrement : Loi sur la santé et la sécurité du travail (RLRQ c. S-2.1) et
 * Règlement sur les mécanismes de prévention et de participation en
 * établissement (RMPPE), en vigueur depuis le 1er octobre 2025.
 *
 * L'application raisonnait auparavant en « groupes prioritaires », une
 * classification du régime antérieur. Le déclencheur est désormais l'effectif
 * de l'établissement, calculé sur une période d'un an.
 *
 * AVERTISSEMENT
 * Les contenus du site de la CNESST sont informatifs ; les lois et règlements
 * ont priorité. Ce module encode la synthèse officielle, il ne remplace pas
 * une analyse juridique du cas d'espèce.
 */

/** Seuil d'effectif séparant les deux régimes. */
export const SEUIL_EFFECTIF = 20

/** Durée maximale d'un dépassement temporaire, en jours par année. */
export const DUREE_MAX_DEPASSEMENT_TEMPORAIRE_JOURS = 20

/** Effectif à partir duquel un chantier de construction relève de mesures distinctes. */
export const SEUIL_CHANTIER_CONSTRUCTION = 10

export const DELAI_MISE_EN_APPLICATION_MOIS = 12
export const PERIODICITE_TRANSMISSION_ANNEES = 3
export const ENTREE_EN_VIGUEUR_RMPPE = '2025-10-01'
export const REFERENCE_SYNTHESE = 'CNESST, DC100-2304 (2025-09)'

/**
 * Niveau de risque du secteur d'activité — 1 à 4, modèle multicritères
 * CNESST–IRSST fondé sur les codes SCIAN 2012.
 *
 * Il ne détermine PAS quels mécanismes s'appliquent — c'est l'effectif qui le
 * fait — mais leurs modalités : fréquence minimale des réunions du comité de
 * santé et de sécurité, temps de libération du représentant, délais de
 * formation obligatoire.
 *
 * La table de correspondance SCIAN → niveau et les modalités associées ne sont
 * pas encore intégrées : voir `modalitesSelonNiveau()`.
 */
export type NiveauRisque = 1 | 2 | 3 | 4

export type MecanismePrevention = 'plan_action' | 'programme_prevention'

export interface ContexteEtablissement {
  /** Nombre de travailleurs dans l'établissement, sur une période d'un an. */
  effectif: number
  /**
   * L'employeur appartient à une mutuelle de prévention : le programme de
   * prévention s'impose alors quel que soit l'effectif.
   */
  mutuellePrevention?: boolean
  /**
   * L'établissement n'atteint 20 travailleurs que pendant 20 jours ou moins
   * dans l'année. Exception signalée dans la synthèse DC100-2304 : le comité
   * de santé et de sécurité et le représentant ne sont alors pas exigés.
   */
  depassementTemporaire?: boolean
  /**
   * Regroupement d'établissements de même nature. Les mécanismes s'appliquent
   * alors une seule fois pour l'ensemble : un programme de prévention et un
   * représentant en santé et en sécurité.
   */
  multietablissements?: boolean
  /** Niveau de risque sectoriel, s'il est connu. */
  niveauRisque?: NiveauRisque
}

export interface MecanismesApplicables {
  prevention: {
    mecanisme: MecanismePrevention
    libelle: string
    justification: string
  }
  participation: {
    agentDeLiaison: boolean
    comiteSanteSecurite: boolean
    representantSanteSecurite: boolean
    justification: string
  }
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

const normaliserEffectif = (valeur: number): number =>
  Number.isFinite(valeur) && valeur > 0 ? Math.floor(valeur) : 0

/**
 * Détermine les mécanismes applicables à un établissement.
 *
 * Prévention — plan d'action à 19 travailleurs ou moins ; programme de
 * prévention à 20 travailleurs ou plus, ainsi que pour tout employeur
 * appartenant à une mutuelle de prévention.
 *
 * Participation — agent de liaison à 19 travailleurs ou moins ; comité de
 * santé et de sécurité et représentant en santé et en sécurité à 20
 * travailleurs ou plus, sauf dépassement temporaire d'au plus 20 jours.
 */
export function determinerMecanismes(contexte: ContexteEtablissement): MecanismesApplicables {
  const effectif = normaliserEffectif(contexte.effectif)
  const atteintSeuil = effectif >= SEUIL_EFFECTIF
  const avertissements: string[] = []

  // --- Mécanisme de prévention ---
  const programmeExige = atteintSeuil || Boolean(contexte.mutuellePrevention)

  let justificationPrevention: string
  if (contexte.mutuellePrevention && !atteintSeuil) {
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
  const exceptionDepassement = atteintSeuil && Boolean(contexte.depassementTemporaire)
  const comiteExige = atteintSeuil && !exceptionDepassement
  const representantExige = comiteExige
  const agentDeLiaisonExige = !atteintSeuil || exceptionDepassement

  let justificationParticipation: string
  if (exceptionDepassement) {
    justificationParticipation =
      `L'établissement n'atteint ${SEUIL_EFFECTIF} travailleurs que pendant au plus ` +
      `${DUREE_MAX_DEPASSEMENT_TEMPORAIRE_JOURS} jours dans l'année : le comité de santé et de ` +
      `sécurité et le représentant ne sont pas exigés ; un agent de liaison est désigné.`
    avertissements.push(
      "L'exception de dépassement temporaire est invoquée : elle doit être documentée et " +
        'réévaluée chaque année.'
    )
  } else if (atteintSeuil) {
    justificationParticipation =
      `À partir de ${SEUIL_EFFECTIF} travailleurs : mise en place d'un comité de santé et de ` +
      `sécurité et désignation d'un ou de représentants en santé et en sécurité.`
  } else {
    justificationParticipation =
      `À ${SEUIL_EFFECTIF - 1} travailleurs ou moins : désignation d'un agent de liaison en ` +
      `santé et en sécurité.`
  }

  if (contexte.multietablissements) {
    avertissements.push(
      "Approche par multiétablissements : un seul programme de prévention et un représentant " +
        'en santé et en sécurité couvrent l\'ensemble des établissements regroupés, sous réserve ' +
        'des critères de regroupement.'
    )
  }

  avertissements.push(
    "L'effectif se calcule sur une période d'un an, selon les règles d'inclusion et d'exclusion " +
      'publiées par la CNESST.'
  )

  if (!contexte.niveauRisque) {
    avertissements.push(
      'Niveau de risque sectoriel inconnu : la fréquence des réunions du comité, le temps de ' +
        'libération du représentant et les délais de formation ne peuvent pas être précisés.'
    )
  }

  return {
    prevention: {
      mecanisme: programmeExige ? 'programme_prevention' : 'plan_action',
      libelle: programmeExige ? 'Programme de prévention' : "Plan d'action",
      justification: justificationPrevention
    },
    participation: {
      agentDeLiaison: agentDeLiaisonExige,
      comiteSanteSecurite: comiteExige,
      representantSanteSecurite: representantExige,
      justification: justificationParticipation
    },
    echeances: {
      miseEnApplication: echeanceMiseEnApplication(),
      transmissionCnesst: echeanceTransmission(),
      delaiMois: DELAI_MISE_EN_APPLICATION_MOIS,
      periodiciteAnnees: PERIODICITE_TRANSMISSION_ANNEES
    },
    avertissements,
    reference: REFERENCE_SYNTHESE
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
 * Un chantier de construction de 10 travailleurs de la construction ou plus
 * relève de mécanismes DISTINCTS de ceux de l'établissement.
 *
 * L'entreprise de construction demeure par ailleurs un établissement :
 * l'employeur doit donc appliquer les deux régimes, pour son chantier et pour
 * son entreprise.
 */
export function chantierSoumisMesuresParticulieres(travailleursConstruction: number): boolean {
  return normaliserEffectif(travailleursConstruction) >= SEUIL_CHANTIER_CONSTRUCTION
}

/**
 * Modalités dépendant du niveau de risque sectoriel — fréquence minimale des
 * réunions du comité, temps de libération mensuel du représentant, délais de
 * formation.
 *
 * NON IMPLÉMENTÉ. Ces valeurs figurent au Règlement et n'ont pas été obtenues.
 * Elles ne sont pas devinées : une fréquence de réunion erronée dans un
 * document remis à un inspecteur serait une non-conformité.
 */
export function modalitesSelonNiveau(niveau?: NiveauRisque): {
  disponible: false
  niveau: NiveauRisque | null
  raison: string
} {
  return {
    disponible: false,
    niveau: niveau ?? null,
    raison:
      "Les modalités liées au niveau de risque (fréquence des réunions du comité, temps de " +
      "libération du représentant, délais de formation) ne sont pas encore intégrées : la table " +
      'officielle du Règlement doit être fournie.'
  }
}
