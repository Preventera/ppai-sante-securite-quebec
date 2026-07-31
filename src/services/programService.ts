import { supabase } from '@/integrations/supabase/client'
import { getBackendMode } from '@/lib/backend'
import type { ProvenanceReglementaire } from '@/lib/provenance'
import { readCollection, writeCollection, generateId } from '@/lib/localStore'
import { requireOrganizationId } from '@/lib/organization'

/**
 * Persistance des programmes de prévention générés.
 *
 * Hybride comme `riskService` : Supabase en mode live, stockage local en mode
 * démonstration. C'est ce qui permet de générer un programme sur scène puis de
 * le retrouver dans la page « Programmes ».
 */

const COLLECTION = 'prevention_programs'

export interface PreventionProgram {
  id: string
  title: string
  description: string | null
  documentType: string
  sector: string
  responsibleActor: string
  content: string
  status: string
  version: number
  createdAt: string
  metadata: {
    conformite?: boolean
    referencesLegales?: string[]
    source?: string
    model?: string
    risksAnalyzed?: number
    criticalRisksCount?: number
    /**
     * Instantané réglementaire figé à la génération. Jamais recalculé : la
     * question posée après coup est « sur quelle base ce document a-t-il été
     * établi », pas « que dirait-on aujourd'hui ».
     */
    provenance?: ProvenanceReglementaire
  } | null
}

export interface ProgramInput {
  title: string
  description?: string
  documentType: string
  sector: string
  responsibleActor: string
  content: string
  metadata?: PreventionProgram['metadata']
}

type ProgramRow = {
  id: string
  title: string
  description: string | null
  document_type: string
  sector: string
  responsible_actor: string
  content: string
  status: string
  version: number
  created_at: string
  metadata: unknown
}

const fromRow = (row: ProgramRow): PreventionProgram => ({
  id: row.id,
  title: row.title,
  description: row.description,
  documentType: row.document_type,
  sector: row.sector,
  responsibleActor: row.responsible_actor,
  content: row.content,
  status: row.status,
  version: row.version,
  createdAt: row.created_at,
  metadata: (row.metadata as PreventionProgram['metadata']) ?? null
})

const localPrograms = {
  all: () => readCollection<PreventionProgram>(COLLECTION, []),
  save: (programs: PreventionProgram[]) => writeCollection(COLLECTION, programs)
}

const newestFirst = (programs: PreventionProgram[]) =>
  [...programs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

export const programService = {
  async getAll(): Promise<PreventionProgram[]> {
    if ((await getBackendMode()) === 'demo') {
      return newestFirst(localPrograms.all())
    }

    const { data, error } = await supabase
      .from('prevention_programs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('[PPAI] Lecture des programmes échouée, repli local:', error.message)
      return newestFirst(localPrograms.all())
    }

    return (data as ProgramRow[]).map(fromRow)
  },

  async save(input: ProgramInput): Promise<PreventionProgram> {
    if ((await getBackendMode()) === 'demo') {
      const program: PreventionProgram = {
        id: generateId(),
        title: input.title,
        description: input.description ?? null,
        documentType: input.documentType,
        sector: input.sector,
        responsibleActor: input.responsibleActor,
        content: input.content,
        status: 'brouillon',
        version: 1,
        createdAt: new Date().toISOString(),
        metadata: input.metadata ?? null
      }

      localPrograms.save([program, ...localPrograms.all()])
      return program
    }

    const organizationId = await requireOrganizationId()

    const { data, error } = await supabase
      .from('prevention_programs')
      .insert({
        organization_id: organizationId,
        title: input.title,
        description: input.description ?? null,
        document_type: input.documentType,
        sector: input.sector,
        responsible_actor: input.responsibleActor,
        content: input.content,
        metadata: (input.metadata ?? null) as never
      })
      .select('*')
      .single()

    if (error) throw new Error(`Enregistrement du programme impossible : ${error.message}`)
    return fromRow(data as ProgramRow)
  },

  async remove(id: string): Promise<void> {
    if ((await getBackendMode()) === 'demo') {
      localPrograms.save(localPrograms.all().filter(program => program.id !== id))
      return
    }

    const { error } = await supabase.from('prevention_programs').delete().eq('id', id)
    if (error) throw new Error(`Suppression du programme impossible : ${error.message}`)
  }
}
