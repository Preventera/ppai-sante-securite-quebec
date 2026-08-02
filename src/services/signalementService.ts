import { supabase } from '@/integrations/supabase/client'
import { getBackendMode } from '@/lib/backend'
import { readCollection, writeCollection, generateId } from '@/lib/localStore'

/**
 * Signalements terrain — service hybride, même contrat dans les deux modes.
 *
 * Le signalement est volontairement plus pauvre qu'un risque : description et
 * lieu. La cotation relève de la qualification par le responsable SST — on ne
 * demande pas au témoin d'un danger de produire une analyse.
 *
 * En mode live, l'auteur et l'organisation sont imposés par la base
 * (déclencheur `garde_signalements`, migration 006) : les valeurs envoyées
 * ici ne font pas foi, et c'est voulu.
 */

export type StatutSignalement = 'nouveau' | 'qualifie' | 'rejete'

export interface Signalement {
  id: string
  description: string
  lieu: string | null
  statut: StatutSignalement
  decisionNote: string | null
  risqueCode: string | null
  createdAt: string
  /** Nom de l'auteur, lorsque la ligne est visible d'un rôle de rédaction. */
  auteur: string | null
}

const COLLECTION = 'signalements'

type LigneLocale = Omit<Signalement, 'auteur'>

const versSignalement = (ligne: LigneLocale, auteur: string | null = null): Signalement => ({
  ...ligne,
  auteur
})

export const signalementService = {
  async getSignalements(): Promise<Signalement[]> {
    if ((await getBackendMode()) === 'demo') {
      return readCollection<LigneLocale>(COLLECTION, [])
        .map(l => versSignalement(l, 'Vous (démonstration)'))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    }

    const { data, error } = await supabase
      .from('signalements')
      .select('id, description, lieu, statut, decision_note, risque_code, created_at, reporter:profiles(full_name, email)')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    return (data ?? []).map(ligne => {
      const reporter = ligne.reporter as { full_name: string | null; email: string | null } | null
      return {
        id: ligne.id,
        description: ligne.description,
        lieu: ligne.lieu,
        statut: ligne.statut as StatutSignalement,
        decisionNote: ligne.decision_note,
        risqueCode: ligne.risque_code,
        createdAt: ligne.created_at,
        auteur: reporter?.full_name || reporter?.email || null
      }
    })
  },

  async creerSignalement(entree: { description: string; lieu?: string }): Promise<void> {
    const description = entree.description.trim()
    if (description.length < 10) {
      throw new Error('Décrivez la situation en quelques mots (au moins 10 caractères).')
    }

    if ((await getBackendMode()) === 'demo') {
      const lignes = readCollection<LigneLocale>(COLLECTION, [])
      lignes.push({
        id: generateId(),
        description,
        lieu: entree.lieu?.trim() || null,
        statut: 'nouveau',
        decisionNote: null,
        risqueCode: null,
        createdAt: new Date().toISOString()
      })
      writeCollection(COLLECTION, lignes)
      return
    }

    // reporter_id et organization_id sont volontairement omis : le
    // déclencheur `garde_signalements` les impose depuis la session.
    const { error } = await supabase.from('signalements').insert({
      description,
      lieu: entree.lieu?.trim() || null
    })

    if (error) throw new Error(error.message)
  },

  async statuer(
    id: string,
    decision: { statut: Exclude<StatutSignalement, 'nouveau'>; note?: string; risqueCode?: string }
  ): Promise<void> {
    if ((await getBackendMode()) === 'demo') {
      const lignes = readCollection<LigneLocale>(COLLECTION, []).map(l =>
        l.id === id
          ? {
              ...l,
              statut: decision.statut,
              decisionNote: decision.note ?? null,
              risqueCode: decision.risqueCode ?? null
            }
          : l
      )
      writeCollection(COLLECTION, lignes)
      return
    }

    const { error } = await supabase
      .from('signalements')
      .update({
        statut: decision.statut,
        decision_note: decision.note ?? null,
        risque_code: decision.risqueCode ?? null,
        traite_le: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw new Error(error.message)
  }
}
