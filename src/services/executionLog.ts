import { supabase } from '@/integrations/supabase/client'
import { getBackendMode } from '@/lib/backend'
import { getCurrentOrganizationId } from '@/lib/organization'

/**
 * Journal des exécutions de génération.
 *
 * POURQUOI CE MODULE EXISTE
 *   L'orchestrateur écrivait dans `agent_executions`, mais le chemin réellement
 *   emprunté par l'application — `aiGenerationService` — n'y écrivait rien. Le
 *   chemin instrumenté n'était pas celui qui tourne, et le bandeau de la page
 *   Générateur affichait des constantes en dur présentées comme des mesures.
 *
 * CE QUI EST CONSERVÉ, ET CE QUI NE L'EST PAS
 *   On enregistre de quoi répondre à « est-ce que ça marche, et à quel coût » :
 *   durée, moteur retenu, jetons, nombre de risques traités, succès ou échec.
 *
 *   On n'enregistre NI le prompt, NI le document produit. Ils sont volumineux,
 *   ils contiennent les données de l'établissement, et le programme est déjà
 *   persisté par ailleurs avec ses métadonnées. Journaliser large « au cas où »
 *   crée une seconde copie de données personnelles sans usage identifié — ce
 *   que la Loi 25 invite précisément à éviter.
 *
 * RÈGLE ABSOLUE
 *   Journaliser ne doit jamais faire échouer une génération. Toute erreur
 *   d'écriture est absorbée et signalée en console, rien de plus.
 */

export type StatutExecution = 'completed' | 'failed'

export interface EntreeExecution {
  /** Moteur sollicité : Edge Function Claude ou générateur local déterministe. */
  moteur: 'claude' | 'local'
  statut: StatutExecution
  dureeMs: number
  /** Contexte non nominatif, utile au diagnostic. */
  contexte: {
    secteurScian?: string
    nombreEmployes?: number
    typeDocument?: string
    nbRisques?: number
  }
  jetons?: number
  /** Longueur du document produit, à défaut du document lui-même. */
  longueurDocument?: number
  messageErreur?: string
}

const NOM_AGENT = 'program_generator'
const WORKFLOW = 'generate_prevention_program'

/**
 * Enregistre une exécution. Ne lève jamais.
 *
 * En mode démonstration, rien n'est écrit : il n'y a pas de base, et une
 * démonstration ne doit pas polluer les statistiques d'un locataire réel.
 */
export async function journaliserExecution(entree: EntreeExecution): Promise<void> {
  try {
    if ((await getBackendMode()) === 'demo') return

    const organizationId = await getCurrentOrganizationId()
    if (!organizationId) {
      // Sans organisation, la ligne serait rejetée par les politiques
      // d'isolation. On s'abstient plutôt que de provoquer une erreur.
      return
    }

    const { error } = await supabase.from('agent_executions').insert({
      agent_name: NOM_AGENT,
      workflow_id: WORKFLOW,
      execution_status: entree.statut,
      execution_time_ms: Math.round(entree.dureeMs),
      input_data: {
        moteur: entree.moteur,
        ...entree.contexte
      },
      output_data:
        entree.statut === 'completed'
          ? { jetons: entree.jetons ?? 0, longueur_document: entree.longueurDocument ?? 0 }
          : null,
      error_message: entree.messageErreur ?? null,
      organization_id: organizationId
    })

    if (error) {
      console.warn("[PPAI] Journalisation de l'exécution impossible:", error.message)
    }
  } catch (erreur) {
    console.warn("[PPAI] Journalisation de l'exécution impossible:", erreur)
  }
}

export interface MetriquesExecution {
  totalExecutions: number
  tauxSucces: number
  dureeMoyenneMs: number
  repartitionMoteur: Record<string, number>
  /** Vrai si les valeurs viennent du journal, faux si ce sont des valeurs de démonstration. */
  issuDeMesures: boolean
}

/**
 * Métriques calculées sur le journal réel.
 *
 * Renvoie `null` si aucune mesure n'est disponible — en mode démonstration, ou
 * tant qu'aucune génération n'a eu lieu. L'appelant décide alors quoi montrer,
 * mais il sait que ce ne sont pas des mesures : c'est précisément ce que le
 * bandeau de la page Générateur ne distinguait pas.
 */
export async function getMetriquesExecution(): Promise<MetriquesExecution | null> {
  try {
    if ((await getBackendMode()) === 'demo') return null

    const { data, error } = await supabase
      .from('agent_executions')
      .select('execution_status, execution_time_ms, input_data')
      .eq('agent_name', NOM_AGENT)
      .order('created_at', { ascending: false })
      .limit(500)

    if (error || !data || data.length === 0) return null

    const succes = data.filter(l => l.execution_status === 'completed').length
    const durees = data
      .map(l => l.execution_time_ms)
      .filter((d): d is number => typeof d === 'number' && d > 0)

    const repartition: Record<string, number> = {}
    for (const ligne of data) {
      const moteur = (ligne.input_data as { moteur?: string } | null)?.moteur ?? 'inconnu'
      repartition[moteur] = (repartition[moteur] ?? 0) + 1
    }

    return {
      totalExecutions: data.length,
      tauxSucces: Math.round((succes / data.length) * 1000) / 10,
      dureeMoyenneMs: durees.length
        ? Math.round(durees.reduce((s, d) => s + d, 0) / durees.length)
        : 0,
      repartitionMoteur: repartition,
      issuDeMesures: true
    }
  } catch (erreur) {
    console.warn('[PPAI] Métriques d\'exécution indisponibles:', erreur)
    return null
  }
}
