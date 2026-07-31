import { supabase } from '@/integrations/supabase/client'
import { getBackendMode } from '@/lib/backend'
import { secteurPourCode } from '@/lib/scianNiveaux'

/**
 * Correspondance sous-secteur SCIAN (annexe I, 102 valeurs) vers grand secteur
 * CNESST (données de lésions, 22 valeurs).
 *
 * NON RENSEIGNÉE — délibérément. Elle exige un arbitrage : « FABRICATION DE
 * BIENS DURABLES » et « NON DURABLES » ne se déduisent pas mécaniquement des
 * codes, et « AUTRES OU NON CODES » ne correspond à rien. Tant que la table
 * n'est pas établie et relue, la fonction renvoie null et l'application se
 * rabat sur le jeu de démonstration plutôt que de rattacher un établissement au
 * mauvais secteur.
 *
 * Fichier de travail : data/referentiel/secteurs_cnesst_lesions.csv
 */
export function secteurCnesstPour(_codeScian: string): string | null {
  return null
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
export async function getRiskTemplates(codeScian: string): Promise<RiskTemplate[]> {
  const secteur = secteurPourCode(codeScian)
  if (!secteur) return []

  if ((await getBackendMode()) === 'demo') {
    return TEMPLATES_DEMONSTRATION.filter(t => t.secteurCnesst === secteurCnesstPour(secteur.code))
  }

  const { data, error } = await supabase
    .from('risk_templates')
    .select('*')
    .eq('secteur_cnesst', secteurCnesstPour(secteur.code) ?? '')
    .order('nb_cas_observes', { ascending: false, nullsFirst: false })

  if (error) {
    // La table peut ne pas exister si la migration du référentiel n'a pas été
    // appliquée : on retombe sur le jeu de démonstration plutôt que d'échouer.
    console.warn(
      '[PPAI] Référentiel sectoriel indisponible, repli sur le jeu de démonstration:',
      error.message
    )
    return TEMPLATES_DEMONSTRATION.filter(t => t.secteurCnesst === secteurCnesstPour(secteur.code))
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
 * `probability` reste à 0 : elle n'est pas dérivable des données et relève du
 * jugement de l'employeur sur son établissement. L'indice initial est donc nul
 * tant qu'elle n'a pas été fixée, ce qui rend l'omission visible plutôt que
 * silencieuse.
 */
export function templateVersRisque(template: RiskTemplate) {
  const gravite = template.graviteSuggeree ?? 0
  return {
    name: template.libelle,
    description: template.agentCausal
      ? `Agent causal : ${template.agentCausal}`
      : '',
    category: template.categorie ?? '',
    sector: template.secteurCnesst,
    phase: '',
    probability: 0,
    gravity: gravite,
    initialRisk: 0,
    residualRisk: 0,
    measures: template.mesuresTypes ?? '',
    responsible: '',
    status: 'À évaluer',
    /** Origine, à conserver pour la traçabilité du registre. */
    origine: template.source
  }
}
