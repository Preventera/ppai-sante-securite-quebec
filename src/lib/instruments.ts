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
 *   Les désignations proviennent des pages officielles de LégisQuébec
 *   (« Source officielle », mention « Ce document a valeur officielle ») :
 *   numéro de chapitre, titre exact, disposition habilitante, date de mise à
 *   jour.
 *
 *   Les listes d'articles proviennent des PDF officiels eux-mêmes, dépouillés
 *   par `scripts/ontologie/extraire_articles.py` et contrôlés par
 *   `valider_articles.py` : chacun des renvois internes que les textes font à
 *   leurs propres articles doit résoudre dans l'index, sans quoi le contrôle
 *   échoue — 164 renvois pour la LSST, 124 pour le RSST, 83 pour le CSTC.
 *
 * DE LA FORME À L'APPARTENANCE
 *   Ce module validait d'abord les citations sur la FORME du numéro : entiers
 *   pour le RSST, décimales pour le CSTC. Le texte officiel a démenti les deux.
 *   Le RSST admet des suffixes d'insertion sur deux niveaux — l'article
 *   312.45.1 existe — et le CSTC ne compte aucun article sans décimale, ce que
 *   ses annexes et ses paragraphes de définitions laissaient croire.
 *
 *   Les PDF officiels étant désormais lisibles, la validation ne devine plus :
 *   `articleExiste` interroge la liste réelle, extraite du texte par
 *   `scripts/ontologie/extraire_articles.py`. Un numéro est valide s'il y
 *   figure, faux sinon.
 *
 * LES ARTICLES ABROGÉS SONT REFUSÉS
 *   69 articles de la LSST, 28 du RSST et 135 du CSTC sont abrogés. Ils
 *   existent au texte, donc une vérification naïve les accepterait — mais ils
 *   ne fondent plus aucune obligation. Les citer serait pire qu'inventer un
 *   numéro : celui-ci se vérifie et donne le change.
 */

import {
  ARTICLES_LSST, ABROGES_LSST,
  ARTICLES_RSST, ABROGES_RSST,
  ARTICLES_CSTC, ABROGES_CSTC
} from '@/lib/articlesCitables.genere'

/**
 * Date de mise à jour RELEVÉE dans le pied de page des PDF officiels.
 *
 * Les trois textes dépouillés portent la même — ce qui se constate, et ne se
 * suppose pas : un instrument dont la date n'a pas été lue s'affiche sans date
 * plutôt qu'avec celle du voisin.
 */
export const DATE_RELEVEE = '1er avril 2026'

export interface Instrument {
  /** Sigle d'usage, tel qu'employé dans les libellés de mesures. */
  sigle: string
  /** Titre officiel complet. */
  titre: string
  /** Référence RLRQ, sans la date. */
  chapitre: string
  /** Disposition habilitante, lorsque le texte en indique une. */
  habilitation?: string
  /**
   * Articles en vigueur, extraits du texte officiel. Absent tant que le PDF
   * n'a pas été déposé — le RMPPÉ est dans ce cas.
   */
  articles?: ReadonlySet<string>
  /** Articles abrogés : présents au texte, sans portée normative. */
  abroges?: ReadonlySet<string>
  /** Page officielle sur LégisQuébec. */
  url: string
  /** Date de mise à jour relevée sur la page officielle, si elle l'a été. */
  aJourAu?: string
  /**
   * Vrai lorsque le texte intégral a été consulté et que ses articles peuvent
   * donc être cités au numéro. Faux tant que seule la page de garde l'a été.
   */
  texteConsulte: boolean
}

export const LSST: Instrument = {
  sigle: 'LSST',
  titre: 'Loi sur la santé et la sécurité du travail',
  chapitre: 'RLRQ c. S-2.1',
  articles: ARTICLES_LSST,
  abroges: ABROGES_LSST,
  url: 'https://www.legisquebec.gouv.qc.ca/fr/document/lc/S-2.1',
  aJourAu: DATE_RELEVEE,
  texteConsulte: true
}

export const RSST: Instrument = {
  sigle: 'RSST',
  titre: 'Règlement sur la santé et la sécurité du travail',
  chapitre: 'RLRQ c. S-2.1, r. 13',
  habilitation: 'LSST, art. 223',
  articles: ARTICLES_RSST,
  abroges: ABROGES_RSST,
  url: 'https://www.legisquebec.gouv.qc.ca/fr/document/rc/S-2.1,%20r.%2013',
  aJourAu: DATE_RELEVEE,
  texteConsulte: true
}

export const CSTC: Instrument = {
  sigle: 'CSTC',
  titre: 'Code de sécurité pour les travaux de construction',
  chapitre: 'RLRQ c. S-2.1, r. 4',
  habilitation: 'LSST, art. 223',
  articles: ARTICLES_CSTC,
  abroges: ABROGES_CSTC,
  url: 'https://www.legisquebec.gouv.qc.ca/fr/document/rc/S-2.1,%20r.%204',
  aJourAu: DATE_RELEVEE,
  texteConsulte: true
}

export const RMPPE: Instrument = {
  sigle: 'RMPPÉ',
  titre:
    'Règlement sur les mécanismes de prévention et de participation en établissement',
  chapitre: 'RLRQ c. S-2.1, r. 8.3',
  url: 'https://www.legisquebec.gouv.qc.ca/fr/document/rc/S-2.1,%20r.%208.3',
  aJourAu: DATE_RELEVEE,
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

/** Dit si l'article existe et est EN VIGUEUR dans le texte officiel. */
export function articleExiste(instrument: Instrument, article: string): boolean {
  return instrument.articles?.has(article.trim()) ?? false
}

/** Dit si l'article figure au texte mais a été abrogé. */
export function articleAbroge(instrument: Instrument, article: string): boolean {
  return instrument.abroges?.has(article.trim()) ?? false
}

/**
 * Dit si une mesure peut légitimement citer cet article.
 *
 * Deux voies.
 *
 * 1. L'instrument a un index : l'article doit y figurer EN VIGUEUR. C'est le
 *    cas de la LSST, du RSST et du CSTC, dont les textes ont été dépouillés.
 *    Un article abrogé est refusé par construction, n'entrant pas dans l'index.
 * 2. Pas d'index, mais le texte a été travaillé article par article : le
 *    RMPPÉ, dont `rmppe.ts` porte les valeurs supplétives. Son PDF n'a pas été
 *    déposé, mais son contenu a été établi.
 *
 * Une troisième voie a existé — les numéros corroborés par le renvoi d'un
 * texte consulté — le temps que la LSST n'ait pas d'index. Elle n'a plus
 * d'utilisateur et a été retirée plutôt que laissée à dormir.
 */
export function citationAutorisee(instrument: Instrument, article: string): boolean {
  if (instrument.articles) return instrument.articles.has(article.trim())
  return instrument.texteConsulte
}
