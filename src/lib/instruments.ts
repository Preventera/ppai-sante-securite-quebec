/* © 2026 Preventera — AgenticX5. Tous droits réservés. Voir LICENSE.md. */
/**
 * Désignations officielles des instruments réglementaires cités par le produit.
 *
 * POURQUOI CE MODULE EXISTE
 *   Le code citait « RSST » et « CSTC » en chaînes libres, et parfois à
 *   l'article près. Un acheteur institutionnel vérifie les citations : une
 *   référence incomplète décrédibilise, une référence fausse engage. Les
 *   désignations sont donc consignées une fois, avec leur numéro de chapitre
 *   RLRQ, leur loi habilitante et leur date de mise à jour.
 *
 * CE QUI EST VÉRIFIÉ, ET COMMENT
 *   Les entrées RSST et CSTC ont été relevées sur les pages officielles de
 *   LégisQuébec (« Source officielle », mention « Ce document a valeur
 *   officielle »). En sont tirés : le numéro de chapitre, le titre exact, la
 *   disposition habilitante et la date de mise à jour.
 *
 *   N'EN EST PAS TIRÉ le contenu des articles : seule la page de garde a pu
 *   être consultée. C'est la raison pour laquelle aucune obligation de ce
 *   produit n'est citée à l'article près pour ces deux textes — voir
 *   `articleBienForme` plus bas, et l'en-tête de `prevention.ts`.
 *
 * LA FORME DES NUMÉROS N'EST PAS UN DÉTAIL
 *   Le RSST numérote ses articles en entiers (art. 1, 2, 3…). Le CSTC les
 *   numérote en décimales (art. 1.1, 1.2, 3.9.1…). Quatre citations « RSST
 *   art. 2.4.1 » figuraient dans le code : la numérotation du CSTC appliquée au
 *   RSST, donc invalides quel qu'en soit le contenu. `articleBienForme` rend
 *   cette erreur détectable au lieu de la laisser se relire comme une donnée.
 */

/**
 * Date de mise à jour RELEVÉE sur la page officielle, texte par texte.
 *
 * Elle n'est pas globale : dater un texte dont on n'a pas vu la page reviendrait
 * à affirmer une actualité qu'on n'a pas constatée. Un instrument sans date
 * s'affiche sans date.
 */
export const DATE_RELEVEE_RSST_CSTC = '1er avril 2026'

/** Forme que prennent les numéros d'articles d'un instrument. */
export type FormeArticle = 'entier' | 'decimal'

export interface Instrument {
  /** Sigle d'usage, tel qu'employé dans les libellés de mesures. */
  sigle: string
  /** Titre officiel complet. */
  titre: string
  /** Référence RLRQ, sans la date. */
  chapitre: string
  /** Disposition habilitante, lorsque le texte en indique une. */
  habilitation?: string
  /** Forme des numéros d'articles — voir l'en-tête du module. */
  formeArticle: FormeArticle
  /** Page officielle sur LégisQuébec. */
  url: string
  /** Date de mise à jour relevée sur la page officielle, si elle l'a été. */
  aJourAu?: string
  /**
   * Vrai lorsque le texte intégral a été consulté et que ses articles peuvent
   * donc être cités au numéro. Faux tant que seule la page de garde l'a été.
   */
  texteConsulte: boolean
  /**
   * Articles citables bien que le texte intégral n'ait pas été consulté, parce
   * qu'un AUTRE texte consulté y renvoie explicitement. Un renvoi dans un texte
   * officiel vaut vérification du numéro — pas de son contenu intégral.
   */
  articlesCorrobores?: readonly string[]
}

export const LSST: Instrument = {
  sigle: 'LSST',
  titre: 'Loi sur la santé et la sécurité du travail',
  chapitre: 'RLRQ c. S-2.1',
  formeArticle: 'entier',
  url: 'https://www.legisquebec.gouv.qc.ca/fr/document/lc/S-2.1',
  texteConsulte: false,
  // Le RMPPÉ — dont le texte a été travaillé — renvoie à l'article 51 pour
  // l'obligation que ses mesures viennent concrétiser, et au 3e alinéa de
  // l'article 90 pour les libérations qui s'ajoutent au barème de son
  // article 33. Le RSST et le CSTC nomment l'article 223 comme habilitation.
  // Ces trois numéros-là sont donc corroborés ; les autres articles de la Loi
  // cités ailleurs dans le produit ne le sont pas et restent à vérifier.
  articlesCorrobores: ['51', '90', '223']
}

export const RSST: Instrument = {
  sigle: 'RSST',
  titre: 'Règlement sur la santé et la sécurité du travail',
  chapitre: 'RLRQ c. S-2.1, r. 13',
  habilitation: 'LSST, art. 223',
  formeArticle: 'entier',
  url: 'https://www.legisquebec.gouv.qc.ca/fr/document/rc/S-2.1,%20r.%2013',
  aJourAu: DATE_RELEVEE_RSST_CSTC,
  texteConsulte: false
}

export const CSTC: Instrument = {
  sigle: 'CSTC',
  titre: 'Code de sécurité pour les travaux de construction',
  chapitre: 'RLRQ c. S-2.1, r. 4',
  habilitation: 'LSST, art. 223',
  formeArticle: 'decimal',
  url: 'https://www.legisquebec.gouv.qc.ca/fr/document/rc/S-2.1,%20r.%204',
  aJourAu: DATE_RELEVEE_RSST_CSTC,
  texteConsulte: false
}

export const RMPPE: Instrument = {
  sigle: 'RMPPÉ',
  titre:
    'Règlement sur les mécanismes de prévention et de participation en établissement',
  chapitre: 'RLRQ c. S-2.1, r. 8.3',
  formeArticle: 'entier',
  url: 'https://www.legisquebec.gouv.qc.ca/fr/document/rc/S-2.1,%20r.%208.3',
  aJourAu: '1er avril 2026',
  // Seul instrument dont le texte a été travaillé article par article : c'est
  // pourquoi `rmppe.ts` cite ses articles 6, 7, 18-20 et 33-39, et que les
  // autres modules s'en abstiennent.
  texteConsulte: true
}

export const INSTRUMENTS: readonly Instrument[] = [LSST, RSST, CSTC, RMPPE]

/** Retrouve un instrument par son sigle, insensible à la casse et aux accents. */
export function instrumentParSigle(sigle: string): Instrument | null {
  const cle = sigle.trim().toUpperCase()
  return (
    INSTRUMENTS.find(i => i.sigle.toUpperCase() === cle) ??
    // « RMPPE » sans accent doit retrouver « RMPPÉ ».
    INSTRUMENTS.find(
      i => i.sigle.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase() === cle
    ) ??
    null
  )
}

/**
 * Référence complète et datée, à afficher au pied d'un document produit.
 *
 * Exemple : « Règlement sur la santé et la sécurité du travail (RLRQ c. S-2.1,
 * r. 13), à jour au 1er avril 2026 ».
 */
export function reference(instrument: Instrument): string {
  const base = `${instrument.titre} (${instrument.chapitre})`
  return instrument.aJourAu ? `${base}, à jour au ${instrument.aJourAu}` : base
}

/** Référence brève : « RSST, RLRQ c. S-2.1, r. 13 ». */
export function referenceBreve(instrument: Instrument): string {
  return `${instrument.sigle}, ${instrument.chapitre}`
}

/**
 * Dit si un numéro d'article est bien formé POUR CET INSTRUMENT.
 *
 * Ne dit rien de l'existence de l'article ni de son contenu : c'est un garde-fou
 * de forme, qui attrape le mélange de numérotations entre le RSST et le CSTC.
 * Un article du RSST peut porter un suffixe d'insertion (« 69.1 ») : la forme
 * « entier » admet donc un seul niveau de décimale, jamais deux.
 */
export function articleBienForme(instrument: Instrument, article: string): boolean {
  const n = article.trim()
  if (instrument.formeArticle === 'decimal') return /^\d+(\.\d+)+$/.test(n)
  return /^\d+(\.\d+)?$/.test(n)
}

/**
 * Dit si une mesure peut légitimement citer cet article.
 *
 * Le numéro doit toujours être bien formé. Il faut ensuite, au choix, que le
 * texte ait été consulté, ou que ce numéro précis soit corroboré par le renvoi
 * d'un autre texte consulté. Hors de ces deux cas la fonction refuse — c'est ce
 * qui empêche de réintroduire des numéros de mémoire.
 */
export function citationAutorisee(instrument: Instrument, article: string): boolean {
  const n = article.trim()
  if (!articleBienForme(instrument, n)) return false
  return instrument.texteConsulte || (instrument.articlesCorrobores?.includes(n) ?? false)
}
