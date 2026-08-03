/* © 2026 Preventera — AgenticX5. Tous droits réservés. Voir LICENSE.md. */
/**
 * Vérification de ce qu'un modèle a extrait d'un document SST.
 *
 * POURQUOI CETTE COUCHE EXISTE
 *   Un modèle qui lit un programme de prévention produit du plausible. Le
 *   plausible se distingue mal du vrai quand il porte des numéros d'articles et
 *   des cotes de risque. Ce module ne fait pas confiance : il vérifie ce qui est
 *   vérifiable, écarte ce qui ne l'est pas, et dit lequel des deux s'est
 *   produit pour chaque élément.
 *
 * CE QUI EST VÉRIFIÉ
 *   • Les NUMÉROS D'ARTICLES, contre l'index extrait des textes officiels. Un
 *     article inexistant ou abrogé est écarté et signalé — jamais affiché comme
 *     s'il fondait quelque chose.
 *   • Le NIVEAU de hiérarchie, qui doit tomber entre 1 et 6. Un modèle formé
 *     sur la présentation courante en cinq niveaux confond volontiers la
 *     signalisation du risque avec le contrôle administratif.
 *   • L'ANCRAGE : page et extrait. Un élément sans ancrage est refusé, parce
 *     qu'il ne peut pas être relu par l'utilisateur.
 *   • La GRAVITÉ, qui doit tomber entre 1 et 5 et n'être retenue que si le
 *     document l'énonce.
 *
 * CE QUI N'EST JAMAIS ACCEPTÉ DU MODÈLE
 *   La PROBABILITÉ d'occurrence. Elle n'est pas demandée au prompt, et si elle
 *   arrivait quand même, elle serait ignorée ici. C'est l'employeur qui cote la
 *   probabilité sur son établissement — la même règle qui interdit de la
 *   dériver des lésions publiées interdit de la faire deviner à un modèle.
 *
 * CE QUE CE MODULE NE FAIT PAS
 *   Écrire au registre. Rien n'y entre sans qu'un humain ait accepté l'élément,
 *   vu son extrait source, et coté la probabilité. Le module prépare la
 *   décision, il ne la prend pas.
 */

import { CATEGORIES_SAISIE } from '@/lib/prevention'
import { instrumentParSigle, citationAutorisee, articleAbroge } from '@/lib/instruments'

/** Niveau de la hiérarchie du RMPPÉ art. 6. */
export type NiveauMesure = 1 | 2 | 3 | 4 | 5 | 6

/** Ce qui rattache un élément extrait à l'endroit du document d'où il vient. */
export interface Ancrage {
  page: number
  extrait: string
}

/** Motif pour lequel une partie d'un élément a été écartée. */
export interface Reserve {
  champ: string
  motif: string
}

export interface RisqueExtrait {
  cle: string
  nom: string
  categorie: string
  phase: string
  /** Cote de gravité du document, ou `null` s'il n'en énonce pas. */
  gravite: number | null
  responsable: string
  ancrage: Ancrage
  reserves: Reserve[]
}

export interface MesureExtraite {
  cle: string
  /** `nom` du risque auquel elle se rattache, ou `null` si le lien n'a pas résolu. */
  risque: string | null
  libelle: string
  niveau: NiveauMesure | null
  /** Fondement reconstitué à partir des seuls articles vérifiés. */
  fondement: string | null
  ancrage: Ancrage
  reserves: Reserve[]
}

export interface ExtractionVerifiee {
  risques: RisqueExtrait[]
  mesures: MesureExtraite[]
  /** Ce que le modèle a signalé ne pas avoir pu établir. */
  avertissements: string[]
  /** Éléments refusés en bloc, avec la raison. */
  rejets: { quoi: string; motif: string }[]
}

const CATEGORIE_PAR_DEFAUT = 'Autre risque professionnel'

function texte(valeur: unknown): string {
  return typeof valeur === 'string' ? valeur.trim() : ''
}

function entier(valeur: unknown): number | null {
  const n = typeof valeur === 'number' ? valeur : Number.parseInt(String(valeur ?? ''), 10)
  return Number.isFinite(n) ? Math.trunc(n) : null
}

/**
 * Lit l'ancrage d'un élément. Renvoie `null` si l'un des deux manque : sans
 * page NI extrait, l'utilisateur n'a aucun moyen de contrôler l'élément.
 */
function lireAncrage(brut: Record<string, unknown>): Ancrage | null {
  const page = entier(brut.page)
  const extrait = texte(brut.extrait)
  if (page === null || page < 1 || extrait.length < 10) return null
  return { page, extrait }
}

/**
 * Rapproche la catégorie annoncée de celles que le registre accepte.
 *
 * Un modèle produit « Mécanique » là où le registre attend « Risque mécanique
 * et sécurité des machines ». On rapproche sur le préfixe plutôt que d'exiger
 * une correspondance exacte, et on retombe sur « Autre risque professionnel »
 * en dernier recours — ce qui est vrai, et laisse l'utilisateur trancher.
 */
export function rapprocherCategorie(annoncee: string): { categorie: string; exacte: boolean } {
  const brute = annoncee.trim()
  if (!brute) return { categorie: CATEGORIE_PAR_DEFAUT, exacte: false }

  const exact = CATEGORIES_SAISIE.find(c => c.toLowerCase() === brute.toLowerCase())
  if (exact) return { categorie: exact, exacte: true }

  const partiel = CATEGORIES_SAISIE.find(
    c => c.toLowerCase().includes(brute.toLowerCase()) || brute.toLowerCase().includes(c.toLowerCase()),
  )
  if (partiel) return { categorie: partiel, exacte: false }

  return { categorie: CATEGORIE_PAR_DEFAUT, exacte: false }
}

/**
 * Ne retient que les articles qui existent EN VIGUEUR dans le texte officiel.
 *
 * C'est ici que se joue la différence entre citer et prétendre citer. Un
 * modèle produit volontiers « RSST art. 2.4.1 » — la numérotation du CSTC
 * appliquée au RSST, qui n'existe pas. Un article abrogé est distingué d'un
 * article inexistant, parce que les deux ne disent pas la même chose sur ce
 * que le document a voulu dire.
 */
export function verifierArticles(
  sigle: string,
  articles: unknown,
): { fondement: string | null; reserves: Reserve[] } {
  const reserves: Reserve[] = []
  const instrument = instrumentParSigle(sigle)

  if (!sigle.trim()) return { fondement: null, reserves }
  if (!instrument) {
    return {
      fondement: null,
      reserves: [{ champ: 'instrument', motif: `« ${sigle} » n'est pas un instrument connu du produit.` }],
    }
  }

  const numeros = Array.isArray(articles) ? articles.map(a => texte(a)).filter(Boolean) : []
  if (numeros.length === 0) {
    // L'instrument seul est une information honnête et utile.
    return { fondement: instrument.sigle, reserves }
  }

  const retenus = numeros.filter(n => {
    if (citationAutorisee(instrument, n)) return true
    reserves.push({
      champ: 'articles',
      motif: articleAbroge(instrument, n)
        ? `${instrument.sigle} art. ${n} est abrogé : il ne fonde plus rien.`
        : `${instrument.sigle} art. ${n} ne figure pas au texte officiel.`,
    })
    return false
  })

  if (retenus.length === 0) return { fondement: instrument.sigle, reserves }
  return { fondement: `${instrument.sigle}, art. ${retenus.join(' et ')}`, reserves }
}

/**
 * Transforme la réponse brute du modèle en extraction vérifiée.
 *
 * Tolérant à la forme, intransigeant sur le fond : un champ absent devient une
 * réserve, jamais une valeur inventée.
 */
export function verifierExtraction(brut: unknown): ExtractionVerifiee {
  const rejets: { quoi: string; motif: string }[] = []
  const source = (brut ?? {}) as Record<string, unknown>

  const listeRisques = Array.isArray(source.risques) ? source.risques : []
  const listeMesures = Array.isArray(source.mesures) ? source.mesures : []

  const risques: RisqueExtrait[] = []
  listeRisques.forEach((element, index) => {
    const r = (element ?? {}) as Record<string, unknown>
    const nom = texte(r.nom)
    if (!nom) {
      rejets.push({ quoi: `risque n° ${index + 1}`, motif: 'sans libellé' })
      return
    }
    const ancrage = lireAncrage(r)
    if (!ancrage) {
      rejets.push({ quoi: nom, motif: "sans page ni extrait du document : invérifiable" })
      return
    }

    const reserves: Reserve[] = []
    const { categorie, exacte } = rapprocherCategorie(texte(r.categorie))
    if (!exacte) {
      reserves.push({
        champ: 'categorie',
        motif: `« ${texte(r.categorie) || 'non précisée'} » rapprochée de « ${categorie} » — à confirmer.`,
      })
    }

    // La gravité n'est retenue que si le document l'énonce ET qu'elle tient
    // dans l'échelle. Une cote hors bornes est plus probablement une erreur de
    // lecture qu'une échelle exotique.
    let gravite: number | null = null
    const graviteAnnoncee = entier(r.gravite)
    if (r.gravitePresente === true && graviteAnnoncee !== null) {
      if (graviteAnnoncee >= 1 && graviteAnnoncee <= 5) {
        gravite = graviteAnnoncee
      } else {
        reserves.push({
          champ: 'gravite',
          motif: `cote ${graviteAnnoncee} hors de l'échelle 1–5 : écartée.`,
        })
      }
    }

    risques.push({
      cle: `R-${index + 1}`,
      nom,
      categorie,
      phase: texte(r.phase),
      gravite,
      responsable: texte(r.responsable),
      ancrage,
      reserves,
    })
  })

  const nomsConnus = new Set(risques.map(r => r.nom))

  const mesures: MesureExtraite[] = []
  listeMesures.forEach((element, index) => {
    const m = (element ?? {}) as Record<string, unknown>
    const libelle = texte(m.libelle)
    if (!libelle) {
      rejets.push({ quoi: `mesure n° ${index + 1}`, motif: 'sans libellé' })
      return
    }
    const ancrage = lireAncrage(m)
    if (!ancrage) {
      rejets.push({ quoi: libelle, motif: "sans page ni extrait du document : invérifiable" })
      return
    }

    const { fondement, reserves } = verifierArticles(texte(m.instrument), m.articles)

    let niveau: NiveauMesure | null = null
    const niveauAnnonce = entier(m.niveau)
    if (niveauAnnonce !== null && niveauAnnonce >= 1 && niveauAnnonce <= 6) {
      niveau = niveauAnnonce as NiveauMesure
    } else if (niveauAnnonce !== null) {
      reserves.push({
        champ: 'niveau',
        motif: `niveau ${niveauAnnonce} hors de la hiérarchie du RMPPÉ, qui en compte six.`,
      })
    }

    const nomRisque = texte(m.risque)
    const risque = nomRisque && nomsConnus.has(nomRisque) ? nomRisque : null
    if (nomRisque && !risque) {
      reserves.push({
        champ: 'risque',
        motif: `rattachée à « ${nomRisque} », qui ne figure pas parmi les risques extraits.`,
      })
    }

    mesures.push({ cle: `M-${index + 1}`, risque, libelle, niveau, fondement, ancrage, reserves })
  })

  const avertissements = Array.isArray(source.avertissements)
    ? source.avertissements.map(a => texte(a)).filter(Boolean)
    : []

  return { risques, mesures, avertissements, rejets }
}

/** Mesures rattachées à un risque, dans l'ordre de la hiérarchie. */
export function mesuresDuRisque(extraction: ExtractionVerifiee, nom: string): MesureExtraite[] {
  return extraction.mesures
    .filter(m => m.risque === nom)
    .sort((a, b) => (a.niveau ?? 9) - (b.niveau ?? 9))
}

/** Mesures qu'aucun risque ne réclame — elles seraient perdues sans mention. */
export function mesuresOrphelines(extraction: ExtractionVerifiee): MesureExtraite[] {
  return extraction.mesures.filter(m => m.risque === null)
}
