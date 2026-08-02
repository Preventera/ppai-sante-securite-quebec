/* © 2026 Preventera — AgenticX5. Tous droits réservés. Voir LICENSE.md. */
import { supabase } from '@/integrations/supabase/client'
import { getBackendMode } from '@/lib/backend'
import { secteurPourCode } from '@/lib/scianNiveaux'
import type { Risk } from '@/types/risk'
import type { RiskInput } from '@/services/riskService'

/**
 * Correspondance sous-secteur SCIAN (annexe I du RMPPÉ, 102 codes) vers grand
 * secteur CNESST (fichiers de lésions, 22 libellés).
 *
 * FICHIER DE RÉFÉRENCE : data/referentiel/secteurs_cnesst_lesions.csv
 *
 * 101 des 102 codes se déduisent de la hiérarchie SCIAN elle-même, sans
 * arbitrage : le découpage « biens durables / non durables » est une
 * classification de Statistique Canada, pas un jugement de notre part.
 *
 * DEUX CAS PARTICULIERS :
 *
 *   115 — « Activités de soutien à l'agriculture ET à la foresterie » recouvre
 *   deux réalités de terrain aux profils de lésions distincts. Aucune
 *   conséquence réglementaire : l'annexe I lui attribue un niveau unique, 4, et
 *   les modalités du RMPPÉ en découlent quelle que soit l'orientation. Seul le
 *   profil de risques proposé diffère, et c'est à l'établissement de dire
 *   lequel le concerne — voir `CODES_PLURIVOQUES`.
 *
 *   « AUTRES OU NON CODES » — 78 181 lésions, dont 57 204 d'exposition au
 *   bruit, ne correspond à aucun secteur d'activité. Ces lésions ne sont
 *   attribuables à personne en particulier ; le libellé reste hors table.
 *
 * Un code absent renvoie null, et l'application se rabat alors sur le jeu de
 * démonstration plutôt que de proposer les risques d'un secteur voisin.
 */
const SECTEUR_CNESST_PAR_CODE: Record<string, string> = {
  '111': 'AGRICULTURE',
  '112': 'AGRICULTURE',
  '113': 'FORESTERIE, EXPLOITATION FORESTIERE ET ACTIVITES DE SOUTIEN A LA FORESTERIE',
  '114': 'PECHE, CHASSE ET PIEGEAGE',
  '211': 'EXTRACTION MINIERE, EXPLOITATION EN CARRIERE ET EXTRACTION DE PETROLE ET DE GAZ',
  '212': 'EXTRACTION MINIERE, EXPLOITATION EN CARRIERE ET EXTRACTION DE PETROLE ET DE GAZ',
  '213': 'EXTRACTION MINIERE, EXPLOITATION EN CARRIERE ET EXTRACTION DE PETROLE ET DE GAZ',
  '221': 'SERVICES PUBLICS',
  '236': 'CONSTRUCTION',
  '237': 'CONSTRUCTION',
  '238': 'CONSTRUCTION',
  '311': 'FABRICATION DE BIENS NON DURABLES',
  '312': 'FABRICATION DE BIENS NON DURABLES',
  '313': 'FABRICATION DE BIENS NON DURABLES',
  '314': 'FABRICATION DE BIENS NON DURABLES',
  '315': 'FABRICATION DE BIENS NON DURABLES',
  '316': 'FABRICATION DE BIENS NON DURABLES',
  '321': 'FABRICATION DE BIENS DURABLES',
  '322': 'FABRICATION DE BIENS NON DURABLES',
  '323': 'FABRICATION DE BIENS NON DURABLES',
  '324': 'FABRICATION DE BIENS NON DURABLES',
  '325': 'FABRICATION DE BIENS NON DURABLES',
  '326': 'FABRICATION DE BIENS NON DURABLES',
  '327': 'FABRICATION DE BIENS DURABLES',
  '331': 'FABRICATION DE BIENS DURABLES',
  '332': 'FABRICATION DE BIENS DURABLES',
  '333': 'FABRICATION DE BIENS DURABLES',
  '334': 'FABRICATION DE BIENS DURABLES',
  '335': 'FABRICATION DE BIENS DURABLES',
  '336': 'FABRICATION DE BIENS DURABLES',
  '337': 'FABRICATION DE BIENS DURABLES',
  '339': 'FABRICATION DE BIENS DURABLES',
  '411': 'COMMERCE DE GROS',
  '412': 'COMMERCE DE GROS',
  '413': 'COMMERCE DE GROS',
  '414': 'COMMERCE DE GROS',
  '415': 'COMMERCE DE GROS',
  '416': 'COMMERCE DE GROS',
  '417': 'COMMERCE DE GROS',
  '418': 'COMMERCE DE GROS',
  '419': 'COMMERCE DE GROS',
  '441': 'COMMERCE DE DETAIL',
  '442': 'COMMERCE DE DETAIL',
  '443': 'COMMERCE DE DETAIL',
  '444': 'COMMERCE DE DETAIL',
  '445': 'COMMERCE DE DETAIL',
  '446': 'COMMERCE DE DETAIL',
  '447': 'COMMERCE DE DETAIL',
  '448': 'COMMERCE DE DETAIL',
  '451': 'COMMERCE DE DETAIL',
  '452': 'COMMERCE DE DETAIL',
  '453': 'COMMERCE DE DETAIL',
  '454': 'COMMERCE DE DETAIL',
  '481': 'TRANSPORT ET ENTREPOSAGE',
  '482': 'TRANSPORT ET ENTREPOSAGE',
  '483': 'TRANSPORT ET ENTREPOSAGE',
  '484': 'TRANSPORT ET ENTREPOSAGE',
  '485': 'TRANSPORT ET ENTREPOSAGE',
  '486': 'TRANSPORT ET ENTREPOSAGE',
  '487': 'TRANSPORT ET ENTREPOSAGE',
  '488': 'TRANSPORT ET ENTREPOSAGE',
  '491': 'TRANSPORT ET ENTREPOSAGE',
  '492': 'TRANSPORT ET ENTREPOSAGE',
  '493': 'TRANSPORT ET ENTREPOSAGE',
  '511': 'INFORMATION, CULTURE ET LOISIRS',
  '512': 'INFORMATION, CULTURE ET LOISIRS',
  '515': 'INFORMATION, CULTURE ET LOISIRS',
  '517': 'INFORMATION, CULTURE ET LOISIRS',
  '518': 'INFORMATION, CULTURE ET LOISIRS',
  '519': 'INFORMATION, CULTURE ET LOISIRS',
  '521': 'FINANCE ET ASSURANCES',
  '522': 'FINANCE ET ASSURANCES',
  '523': 'FINANCE ET ASSURANCES',
  '524': 'FINANCE ET ASSURANCES',
  '526': 'FINANCE ET ASSURANCES',
  '531': 'SERVICES IMMOBILIERS ET SERVICES DE LOCATION ET DE LOCATION A BAIL',
  '532': 'SERVICES IMMOBILIERS ET SERVICES DE LOCATION ET DE LOCATION A BAIL',
  '533': 'SERVICES IMMOBILIERS ET SERVICES DE LOCATION ET DE LOCATION A BAIL',
  '541': 'SERVICES PROFESSIONNELS, SCIENTIFIQUES ET TECHNIQUES',
  '551': 'SERVICES AUX ENTREPRISES, SERVICES RELATIFS AUX BATIMENTS ET AUTRES SERVICES DE SOUTIEN',
  '561': 'SERVICES AUX ENTREPRISES, SERVICES RELATIFS AUX BATIMENTS ET AUTRES SERVICES DE SOUTIEN',
  '562': 'SERVICES AUX ENTREPRISES, SERVICES RELATIFS AUX BATIMENTS ET AUTRES SERVICES DE SOUTIEN',
  '611': 'SERVICES D\'ENSEIGNEMENT',
  '621': 'SOINS DE SANTE ET ASSISTANCE SOCIALE',
  '622': 'SOINS DE SANTE ET ASSISTANCE SOCIALE',
  '623': 'SOINS DE SANTE ET ASSISTANCE SOCIALE',
  '624': 'SOINS DE SANTE ET ASSISTANCE SOCIALE',
  '711': 'INFORMATION, CULTURE ET LOISIRS',
  '712': 'INFORMATION, CULTURE ET LOISIRS',
  '713': 'INFORMATION, CULTURE ET LOISIRS',
  '721': 'HEBERGEMENT ET SERVICES DE RESTAURATION',
  '722': 'HEBERGEMENT ET SERVICES DE RESTAURATION',
  '811': 'AUTRES SERVICES',
  '812': 'AUTRES SERVICES',
  '813': 'AUTRES SERVICES',
  '814': 'AUTRES SERVICES',
  '911': 'ADMINISTRATIONS PUBLIQUES',
  '912': 'ADMINISTRATIONS PUBLIQUES',
  '913': 'ADMINISTRATIONS PUBLIQUES',
  '914': 'ADMINISTRATIONS PUBLIQUES',
  '919': 'ADMINISTRATIONS PUBLIQUES',
}

/**
 * Codes dont le profil de lésions relève de plusieurs grands secteurs.
 *
 * Le code SCIAN reste celui de l'annexe I — on n'en invente pas de nouveau, la
 * table réglementaire doit continuer de refléter le Règlement à la virgule
 * près. C'est la couche de PROPOSITION qui se dédouble, pas le référentiel.
 */
export const CODES_PLURIVOQUES: Record<string, readonly string[]> = {
  '115': [
    'AGRICULTURE',
    'FORESTERIE, EXPLOITATION FORESTIERE ET ACTIVITES DE SOUTIEN A LA FORESTERIE'
  ]
}

/**
 * Grands secteurs CNESST envisageables pour un code SCIAN.
 *
 * Un seul dans la quasi-totalité des cas ; deux pour le code 115 ; aucun si le
 * code est hors table. Permet à l'interface de poser la question uniquement
 * quand elle se pose réellement.
 */
export function secteursCnesstCandidats(codeScian: string): readonly string[] {
  const plurivoque = CODES_PLURIVOQUES[codeScian]
  if (plurivoque) return plurivoque
  const unique = SECTEUR_CNESST_PAR_CODE[codeScian]
  return unique ? [unique] : []
}

/**
 * Grand secteur retenu pour un code.
 *
 * `orientation` tranche les codes plurivoques ; elle est ignorée pour les
 * autres, où le Règlement ne laisse aucun choix. Sans orientation sur un code
 * plurivoque, la fonction renvoie null : elle ne choisit pas à la place de
 * l'établissement.
 */
export function secteurCnesstPour(codeScian: string, orientation?: string): string | null {
  const candidats = secteursCnesstCandidats(codeScian)
  if (candidats.length === 0) return null
  if (candidats.length === 1) return candidats[0]
  return orientation && candidats.includes(orientation) ? orientation : null
}

/**
 * Risques types proposés par secteur.
 *
 * CE QUE CE SERVICE PROPOSE, ET CE QU'IL NE PROPOSE PAS
 *   Il propose une GRAVITÉ, adossée aux natures de lésion réellement observées
 *   dans le secteur, et un RANG, adossé au nombre de cas.
 *
 *   Il ne propose AUCUNE probabilité. Les données ouvertes de la CNESST ont
 *   pour grain « une ligne = une lésion survenue » : aucun travailleur sans
 *   lésion n'y figure, donc aucune probabilité d'occurrence ne peut en être
 *   dérivée. L'article 59 de la LSST charge l'employeur d'identifier les
 *   risques de SON établissement — le référentiel propose, l'employeur dispose.
 *
 *   Conséquence concrète : un risque adopté depuis une proposition arrive au
 *   registre avec `probability` à zéro. C'est délibéré. L'employeur doit la
 *   fixer, et le registre le signale tant qu'elle manque.
 */

export interface RiskTemplate {
  id: string
  /** Libellé de grand secteur CNESST (22 valeurs), pas un code SCIAN. */
  secteurCnesst: string
  libelle: string
  categorie: string | null
  agentCausal: string | null
  /** 1 à 5, ou null si la nature de lésion n'a pas permis de la déduire. */
  graviteSuggeree: number | null
  mesuresTypes: string | null
  /** Nombre de cas observés — sert au classement, jamais à une fréquence. */
  nbCasObserves: number | null
  source: string
}

/**
 * Jeu de démonstration.
 *
 * Il n'est PAS issu des données de la CNESST et sa source le dit explicitement.
 * Fabriquer des décomptes de lésions plausibles serait la faute la plus facile
 * à commettre ici, et la plus difficile à détecter ensuite : un chiffre inventé
 * qui a l'air d'une statistique officielle finit par être cité.
 *
 * Les libellés et les gravités reprennent des situations documentées par la
 * réglementation québécoise, sans prétendre à une fréquence observée.
 */
const TEMPLATES_DEMONSTRATION: RiskTemplate[] = [
  {
    id: 'demo-332-1',
    secteurCnesst: 'FABRICATION DE BIENS DURABLES',
    libelle: 'Manutention manuelle de charges',
    categorie: 'Ergonomique',
    agentCausal: 'Manutention manuelle',
    graviteSuggeree: 3,
    mesuresTypes:
      "Aides mécaniques à la manutention, limitation des charges unitaires, aménagement des hauteurs de prise (RSST, section sur la manutention).",
    nbCasObserves: null,
    source: 'Démonstration PPAI — non issu des données CNESST'
  },
  {
    id: 'demo-332-2',
    secteurCnesst: 'FABRICATION DE BIENS DURABLES',
    libelle: 'Contact avec machine ou outil de coupe',
    categorie: 'Mécanique',
    agentCausal: 'Machines et outils',
    graviteSuggeree: 4,
    mesuresTypes:
      "Protecteurs fixes ou à enclenchement, cadenassage lors des interventions, formation à la conduite sécuritaire (RSST, art. sur les machines).",
    nbCasObserves: null,
    source: 'Démonstration PPAI — non issu des données CNESST'
  },
  {
    id: 'demo-236-1',
    secteurCnesst: 'CONSTRUCTION',
    libelle: 'Chute de hauteur',
    categorie: 'Chute',
    agentCausal: 'Travail en hauteur',
    graviteSuggeree: 5,
    mesuresTypes:
      "Garde-corps conformes en périphérie, harnais et point d'ancrage lorsque le garde-corps est impraticable, plan de sauvetage (CSTC).",
    nbCasObserves: null,
    source: 'Démonstration PPAI — non issu des données CNESST'
  },
  {
    id: 'demo-623-1',
    secteurCnesst: 'SOINS DE SANTE ET ASSISTANCE SOCIALE',
    libelle: 'Déplacement et transfert de bénéficiaires',
    categorie: 'Ergonomique',
    agentCausal: 'Déplacement de personnes',
    graviteSuggeree: 3,
    mesuresTypes:
      "Équipements de transfert, évaluation du niveau d'assistance requis, formation au principe de déplacement sécuritaire des bénéficiaires.",
    nbCasObserves: null,
    source: 'Démonstration PPAI — non issu des données CNESST'
  },
  {
    id: 'demo-623-2',
    secteurCnesst: 'SOINS DE SANTE ET ASSISTANCE SOCIALE',
    libelle: 'Violence en milieu de travail',
    categorie: 'Psychosocial',
    agentCausal: 'Agression',
    graviteSuggeree: 3,
    mesuresTypes:
      "Repérage des situations à risque, procédure d'appel à l'aide, soutien après événement, politique de prévention du harcèlement et de la violence.",
    nbCasObserves: null,
    source: 'Démonstration PPAI — non issu des données CNESST'
  }
]

/** Ces propositions sont-elles issues des données ouvertes, ou du jeu de démo ? */
export function estIssuDesDonneesOuvertes(template: RiskTemplate): boolean {
  return !template.source.startsWith('Démonstration')
}

/**
 * Propositions de risques pour un secteur.
 *
 * Le code accepte n'importe quelle longueur : il est ramené au sous-secteur à
 * trois chiffres, seul niveau auquel le référentiel est publié. Un secteur
 * inconnu renvoie une liste vide — pas les propositions d'un secteur voisin.
 */
export async function getRiskTemplates(
  codeScian: string,
  options: { orientation?: string } = {}
): Promise<RiskTemplate[]> {
  const secteur = secteurPourCode(codeScian)
  if (!secteur) return []
  const secteurCnesst = secteurCnesstPour(secteur.code, options.orientation)
  if (!secteurCnesst) return []

  if ((await getBackendMode()) === 'demo') {
    return TEMPLATES_DEMONSTRATION.filter(t => t.secteurCnesst === secteurCnesst)
  }

  const { data, error } = await supabase
    .from('risk_templates')
    .select('*')
    .eq('secteur_cnesst', secteurCnesst)
    .order('nb_cas_observes', { ascending: false, nullsFirst: false })

  if (error) {
    // La table peut ne pas exister si la migration du référentiel n'a pas été
    // appliquée : on retombe sur le jeu de démonstration plutôt que d'échouer.
    console.warn(
      '[PPAI] Référentiel sectoriel indisponible, repli sur le jeu de démonstration:',
      error.message
    )
    return TEMPLATES_DEMONSTRATION.filter(t => t.secteurCnesst === secteurCnesst)
  }

  return (data ?? []).map(row => ({
    id: String(row.id),
    secteurCnesst: String(row.secteur_cnesst),
    libelle: String(row.libelle),
    categorie: row.categorie ?? null,
    agentCausal: row.agent_causal ?? null,
    graviteSuggeree: row.gravite_suggeree ?? null,
    mesuresTypes: row.mesures_types ?? null,
    nbCasObserves: row.nb_cas_observes ?? null,
    source: String(row.source)
  }))
}

/**
 * Convertit une proposition en risque prêt à inscrire au registre.
 *
 * TROIS VALEURS QUE LES DONNÉES NE PEUVENT PAS FOURNIR, ET QUI SONT DONC
 * DEMANDÉES À L'APPELANT
 *
 *   `probability` — non dérivable des lésions : le grain est « une ligne = une
 *   lésion survenue », sans contre-exemple. Elle relève du jugement de
 *   l'employeur sur SON établissement (LSST art. 59). La base l'impose d'ailleurs
 *   entre 1 et 5 : il n'existe pas de valeur « inconnue » à inscrire, et en
 *   glisser une par défaut reviendrait à coter le risque à la place de
 *   l'employeur.
 *
 *   `sector` — le registre classe dans quatre domaines, les données CNESST dans
 *   22 grands secteurs. Aucune correspondance ne se déduit de l'un à l'autre.
 *
 *   `residualRisk` — il découle des mesures effectivement mises en place, qui
 *   n'existent pas encore au moment d'adopter une proposition.
 *
 * L'origine de la proposition est reportée à la suite des mesures types, seul
 * champ libre du registre : elle documente d'où vient la ligne sans se faire
 * passer pour une mesure de prévention.
 */
export function templateVersRisque(
  template: RiskTemplate,
  choix: { probabilite: number; secteurRegistre: Risk['sector'] }
): RiskInput {
  const origine = estIssuDesDonneesOuvertes(template)
    ? `Proposition issue des lésions professionnelles du secteur « ${template.secteurCnesst} »` +
      (template.agentCausal ? `, agent causal dominant : ${template.agentCausal}` : '') +
      (template.nbCasObserves
        ? `, ${template.nbCasObserves} cas observés (classement, non fréquence)`
        : '') +
      `. Source : ${template.source}. À valider pour l'établissement.`
    : `Proposition de démonstration — ${template.source}. À valider pour l'établissement.`

  const mesures = [template.mesuresTypes?.trim(), `— ${origine}`].filter(Boolean).join('\n\n')

  return {
    name: template.libelle,
    phase: '',
    category: template.categorie ?? '',
    sector: choix.secteurRegistre,
    probability: choix.probabilite,
    gravity: template.graviteSuggeree ?? 3,
    measures: mesures,
    responsible: '',
    status: 'Action requise'
  }
}
