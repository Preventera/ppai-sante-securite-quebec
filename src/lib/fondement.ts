/* © 2026 Preventera — AgenticX5. Tous droits réservés. Voir LICENSE.md. */
/**
 * Lit le champ `fondement` d'une mesure et retrouve ce que ses articles imposent.
 *
 * POURQUOI CETTE COUCHE
 *   Le `fondement` d'une mesure est du texte : « RSST, art. 141.3 », parfois
 *   « RSST, art. 33.3 · CSTC, art. 2.9.1 », parfois une énumération
 *   « RSST, art. 200 et 201 ». L'interface a besoin d'en tirer des clés pour
 *   interroger la couche d'obligations extraite du texte officiel.
 *
 * CE QUE ÇA PERMET D'AFFICHER
 *   Le seuil à partir duquel la mesure s'impose, et la norme technique que
 *   l'article incorpore. « Garde-corps » devient « garde-corps, exigé au-delà
 *   de 3 m ou de 1,5 m au-dessus d'un bassin » — ce qui distingue un outil de
 *   conformité d'une liste à cocher.
 *
 * CE QUE ÇA N'AFFIRME PAS
 *   Que le seuil s'applique à l'établissement de l'utilisateur. Un seuil relevé
 *   dans un article est une CONDITION énoncée par le texte, pas un verdict sur
 *   un cas concret. C'est l'employeur qui décide si son poste de travail entre
 *   dans la condition.
 */

import { OBLIGATIONS, type Obligation, type Seuil } from '@/lib/obligations.genere'

/**
 * Extrait les clés d'articles d'un libellé de fondement.
 *
 * « RSST, art. 200 et 201 » donne ['RSST 200', 'RSST 201'] : le sigle porte sur
 * toute l'énumération jusqu'au sigle suivant.
 */
export function articlesDuFondement(fondement: string | undefined): string[] {
  if (!fondement) return []
  const cles: string[] = []
  const motif = /\b(LSST|RSST|CSTC)\s*,?\s*art\.\s*((?:\d+(?:\.\d+)*)(?:\s*(?:,|et|à)\s*\d+(?:\.\d+)*)*)/g
  for (const m of fondement.matchAll(motif)) {
    for (const numero of m[2].match(/\d+(?:\.\d+)*/g) ?? []) {
      cles.push(`${m[1]} ${numero}`)
    }
  }
  return cles
}

/** Ce que les articles d'un fondement imposent, agrégé et dédoublonné. */
export interface ApportDuFondement {
  seuils: Seuil[]
  normes: string[]
  /** Articles cités qui ne portent ni seuil ni norme relevés. */
  articlesSansApport: string[]
}

export function apportDuFondement(fondement: string | undefined): ApportDuFondement {
  const seuils: Seuil[] = []
  const normes = new Set<string>()
  const articlesSansApport: string[] = []
  const vus = new Set<string>()

  for (const cle of articlesDuFondement(fondement)) {
    const o: Obligation | undefined = OBLIGATIONS[cle]
    if (!o) {
      articlesSansApport.push(cle)
      continue
    }
    if (o.seuils.length === 0 && o.normes.length === 0) articlesSansApport.push(cle)
    for (const s of o.seuils) {
      // Deux articles cités ensemble répètent souvent le même seuil — l'article
      // 68 de la LSST et l'article 58 disent tous deux « 20 travailleurs ».
      const empreinte = `${s.valeur} ${s.unite}`
      if (vus.has(empreinte)) continue
      vus.add(empreinte)
      seuils.push(s)
    }
    for (const n of o.normes) normes.add(n)
  }

  return { seuils, normes: [...normes].sort(), articlesSansApport }
}
