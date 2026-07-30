/**
 * Régime d'assujettissement — Loi modernisant le régime de santé et de
 * sécurité du travail (LMRSST).
 *
 * L'application raisonnait en « groupes prioritaires » (I à VI), classification
 * du régime antérieur. Depuis le Règlement sur les mécanismes de prévention et
 * de participation en établissement, en vigueur le 1er octobre 2025, le document
 * exigé dépend de l'effectif de l'établissement, et les modalités de
 * participation dépendent du niveau de risque de son secteur d'activité.
 *
 * PÉRIMÈTRE DE CE MODULE
 * Seules les règles vérifiées auprès de la CNESST sont encodées ici. Ce qui
 * reste à confirmer est signalé et volontairement laissé sans valeur par
 * défaut : sur de la conformité, une valeur inventée deviendrait une erreur
 * dans un document remis à un inspecteur.
 *
 * Sources :
 * - CNESST, « Faire un programme de prévention »
 * - CNESST, « Un nouveau règlement favorisant la prévention dès le 1er octobre 2025 »
 * - CNESST, « Programme de prévention et plan d'action, des synonymes ? »
 */

/** Seuil d'effectif déclenchant le programme de prévention. */
export const SEUIL_PROGRAMME_PREVENTION = 20

/** Délai d'élaboration et de mise en application, en mois. */
export const DELAI_MISE_EN_APPLICATION_MOIS = 12

/** Périodicité de transmission à la CNESST, en années. */
export const PERIODICITE_TRANSMISSION_ANNEES = 3

/** Entrée en vigueur du Règlement sur les mécanismes de prévention et de participation. */
export const ENTREE_EN_VIGUEUR_REGLEMENT = '2025-10-01'

/**
 * Niveau de risque du secteur d'activité.
 *
 * Quatre niveaux, issus d'un modèle multicritères CNESST–IRSST fondé sur les
 * codes SCIAN 2012. Ils déterminent la fréquence minimale des réunions du
 * comité de santé et de sécurité, le temps de libération du représentant en
 * santé et sécurité, et les délais de formation obligatoire.
 *
 * La table de correspondance SCIAN → niveau n'est pas encore intégrée : elle
 * doit être reprise de la publication officielle de la CNESST.
 */
export type NiveauRisque = 1 | 2 | 3 | 4

export type TypeDocumentPrevention = 'programme_prevention' | 'plan_action'

export interface RegimeApplicable {
  typeDocument: TypeDocumentPrevention
  libelle: string
  /** Justification affichable à l'utilisateur et citable dans le document. */
  justification: string
  seuilApplique: number
  delaiMiseEnApplicationMois: number
  periodiciteTransmissionAnnees: number
}

/**
 * Détermine le document exigé à partir du seul effectif de l'établissement.
 *
 * Établissement de 20 travailleurs et plus → programme de prévention.
 * 19 travailleurs et moins → plan d'action.
 */
export function determinerRegime(effectif: number): RegimeApplicable {
  const effectifNormalise = Number.isFinite(effectif) && effectif > 0 ? Math.floor(effectif) : 0
  const estProgramme = effectifNormalise >= SEUIL_PROGRAMME_PREVENTION

  return {
    typeDocument: estProgramme ? 'programme_prevention' : 'plan_action',
    libelle: estProgramme ? 'Programme de prévention' : "Plan d'action",
    justification: estProgramme
      ? `Établissement de ${effectifNormalise} travailleurs : le programme de prévention s'applique à partir de ${SEUIL_PROGRAMME_PREVENTION} travailleurs.`
      : `Établissement de ${effectifNormalise} travailleur(s) : le plan d'action s'applique en deçà de ${SEUIL_PROGRAMME_PREVENTION} travailleurs.`,
    seuilApplique: SEUIL_PROGRAMME_PREVENTION,
    delaiMiseEnApplicationMois: DELAI_MISE_EN_APPLICATION_MOIS,
    periodiciteTransmissionAnnees: PERIODICITE_TRANSMISSION_ANNEES
  }
}

/** Échéance de mise en application, à partir d'une date de départ. */
export function echeanceMiseEnApplication(depart: Date = new Date()): string {
  const echeance = new Date(depart)
  echeance.setMonth(echeance.getMonth() + DELAI_MISE_EN_APPLICATION_MOIS)
  return echeance.toISOString().slice(0, 10)
}

/** Échéance de la prochaine transmission à la CNESST. */
export function echeanceTransmission(depart: Date = new Date()): string {
  const echeance = new Date(depart)
  echeance.setFullYear(echeance.getFullYear() + PERIODICITE_TRANSMISSION_ANNEES)
  return echeance.toISOString().slice(0, 10)
}

/**
 * Convertit un ancien « groupe prioritaire » (I à VI) en effectif estimé.
 *
 * Sert uniquement de passerelle pour les écrans qui manipulent encore cette
 * notion, le temps qu'ils soient migrés vers la saisie d'un effectif réel.
 * Ce n'est PAS une équivalence réglementaire : les groupes prioritaires
 * relevaient d'une logique sectorielle, sans rapport avec l'effectif.
 */
export function effectifDepuisGroupePrioritaireHerite(): null {
  return null
}

/**
 * Modalités de participation — comité de santé et de sécurité, représentant en
 * santé et sécurité, agent de liaison.
 *
 * NON IMPLÉMENTÉ. Les seuils dépendent conjointement de l'effectif et du niveau
 * de risque du secteur, et figurent dans le Règlement sur les mécanismes de
 * prévention et de participation en établissement. Ils seront encodés dès que
 * la table officielle sera intégrée au référentiel sectoriel.
 */
export function modalitesParticipation(): {
  disponible: false
  raison: string
} {
  return {
    disponible: false,
    raison:
      "Les seuils des mécanismes de participation (comité SST, représentant en santé et sécurité, agent de liaison) dépendent du niveau de risque sectoriel, dont la table officielle n'est pas encore intégrée."
  }
}
