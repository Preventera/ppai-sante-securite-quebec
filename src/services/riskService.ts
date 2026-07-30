import { supabase } from '@/integrations/supabase/client'
import { Risk, RiskStatus, RiskSector } from '@/types/risk'
import { getBackendMode } from '@/lib/backend'
import { readCollection, writeCollection, resetCollection } from '@/lib/localStore'
import { seedRisks } from '@/data/seedRisks'

/**
 * Accès au registre des risques.
 *
 * Le service est *hybride* : il écrit dans Supabase lorsque le backend est
 * disponible, et retombe sur une persistance locale (mode démonstration) sinon.
 * Toutes les méthodes renvoient le même type `Risk`, quelle que soit la source,
 * afin que l'interface n'ait aucune connaissance du mode actif.
 */

const COLLECTION = 'risks'

/** Champs saisissables ; les indices sont dérivés, jamais fournis par l'appelant. */
export type RiskInput = Omit<Risk, 'id' | 'initialRisk' | 'residualRisk'> & {
  id?: string
  residualRisk?: number
}

type RiskRow = {
  id: string
  code: string
  name: string
  phase: string | null
  category: string | null
  probability: number
  gravity: number
  initial_risk: number
  measures: string | null
  residual_risk: number | null
  status: string
  responsible: string | null
  sector: string
}

const VALID_STATUSES: RiskStatus[] = [
  'Contrôles actifs',
  'En surveillance',
  'Action requise',
  'Complété',
  'En contrôle'
]

const VALID_SECTORS: RiskSector[] = ['Construction', 'Électricité', 'Sécurité', 'Santé']

const coerceStatus = (value: string | null): RiskStatus =>
  VALID_STATUSES.includes(value as RiskStatus) ? (value as RiskStatus) : 'En surveillance'

const coerceSector = (value: string | null): RiskSector =>
  VALID_SECTORS.includes(value as RiskSector) ? (value as RiskSector) : 'Construction'

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(value)))

/**
 * Estime le risque résiduel lorsqu'il n'est pas fourni : une réduction de 40 %
 * de l'indice initial, plancher à 1. Approximation assumée d'un jugement
 * d'expert, matérialisée ici pour rester cohérente entre les deux modes.
 */
const estimateResidualRisk = (initialRisk: number) => Math.max(1, Math.round(initialRisk * 0.6))

const fromRow = (row: RiskRow): Risk => ({
  id: row.code,
  name: row.name,
  phase: row.phase ?? '',
  category: row.category ?? '',
  probability: row.probability,
  gravity: row.gravity,
  initialRisk: row.initial_risk,
  measures: row.measures ?? '',
  residualRisk: row.residual_risk ?? estimateResidualRisk(row.initial_risk),
  status: coerceStatus(row.status),
  responsible: row.responsible ?? '',
  sector: coerceSector(row.sector)
})

/** Normalise une saisie en risque complet et cohérent. */
export function normalizeRisk(input: RiskInput, existingCodes: string[] = []): Risk {
  const probability = clamp(input.probability, 1, 5)
  const gravity = clamp(input.gravity, 1, 5)
  const initialRisk = probability * gravity

  const residualRisk = clamp(
    input.residualRisk ?? estimateResidualRisk(initialRisk),
    1,
    initialRisk
  )

  return {
    id: input.id?.trim() || nextCode(existingCodes),
    name: input.name.trim(),
    phase: input.phase,
    category: input.category,
    probability,
    gravity,
    initialRisk,
    measures: input.measures.trim(),
    residualRisk,
    status: input.status,
    responsible: input.responsible.trim(),
    sector: input.sector
  }
}

/** Génère le prochain code séquentiel du registre (RC4-016, RC4-017, …). */
function nextCode(existingCodes: string[]): string {
  const highest = existingCodes.reduce((max, code) => {
    const match = /^RC4-(\d+)$/.exec(code)
    return match ? Math.max(max, Number(match[1])) : max
  }, 0)

  return `RC4-${String(highest + 1).padStart(3, '0')}`
}

// ---------------------------------------------------------------------------
// Persistance locale (mode démonstration)
// ---------------------------------------------------------------------------

const localRisks = {
  all: (): Risk[] => readCollection<Risk>(COLLECTION, seedRisks),
  save: (risks: Risk[]) => writeCollection(COLLECTION, risks)
}

const sortByInitialRiskDesc = (risks: Risk[]) =>
  [...risks].sort((a, b) => b.initialRisk - a.initialRisk)

// ---------------------------------------------------------------------------
// API publique
// ---------------------------------------------------------------------------

export const riskService = {
  /** Registre complet, trié du risque le plus élevé au plus faible. */
  async getAllRisks(): Promise<Risk[]> {
    if ((await getBackendMode()) === 'demo') {
      return sortByInitialRiskDesc(localRisks.all())
    }

    const { data, error } = await supabase
      .from('risks')
      .select('*')
      .order('initial_risk', { ascending: false })

    if (error) {
      console.warn('[PPAI] Lecture Supabase échouée, repli local:', error.message)
      return sortByInitialRiskDesc(localRisks.all())
    }

    return (data as RiskRow[]).map(fromRow)
  },

  async createRisk(input: RiskInput): Promise<Risk> {
    const existing = await this.getAllRisks()
    const risk = normalizeRisk(input, existing.map(r => r.id))

    if ((await getBackendMode()) === 'demo') {
      localRisks.save([...localRisks.all(), risk])
      return risk
    }

    const { data, error } = await supabase
      .from('risks')
      .insert({
        code: risk.id,
        name: risk.name,
        phase: risk.phase,
        category: risk.category,
        probability: risk.probability,
        gravity: risk.gravity,
        measures: risk.measures,
        residual_risk: risk.residualRisk,
        status: risk.status,
        responsible: risk.responsible,
        sector: risk.sector
      })
      .select('*')
      .single()

    if (error) throw new Error(`Création du risque impossible : ${error.message}`)
    return fromRow(data as RiskRow)
  },

  async updateRisk(code: string, changes: Partial<RiskInput>): Promise<Risk> {
    const existing = await this.getAllRisks()
    const current = existing.find(r => r.id === code)
    if (!current) throw new Error(`Risque « ${code} » introuvable`)

    // Recalcule les indices dérivés si probabilité ou gravité changent.
    const merged = normalizeRisk(
      {
        ...current,
        ...changes,
        id: code,
        residualRisk: changes.residualRisk ?? current.residualRisk
      },
      existing.map(r => r.id)
    )

    if ((await getBackendMode()) === 'demo') {
      localRisks.save(existing.map(r => (r.id === code ? merged : r)))
      return merged
    }

    const { data, error } = await supabase
      .from('risks')
      .update({
        name: merged.name,
        phase: merged.phase,
        category: merged.category,
        probability: merged.probability,
        gravity: merged.gravity,
        measures: merged.measures,
        residual_risk: merged.residualRisk,
        status: merged.status,
        responsible: merged.responsible,
        sector: merged.sector
      })
      .eq('code', code)
      .select('*')
      .single()

    if (error) throw new Error(`Mise à jour du risque impossible : ${error.message}`)
    return fromRow(data as RiskRow)
  },

  async deleteRisk(code: string): Promise<void> {
    if ((await getBackendMode()) === 'demo') {
      localRisks.save(localRisks.all().filter(r => r.id !== code))
      return
    }

    const { error } = await supabase.from('risks').delete().eq('code', code)
    if (error) throw new Error(`Suppression du risque impossible : ${error.message}`)
  },

  /** Import en lot (pipeline CNESST). Retourne le nombre de risques ajoutés. */
  async importRisks(inputs: RiskInput[]): Promise<number> {
    if (inputs.length === 0) return 0

    const existing = await this.getAllRisks()
    const codes = existing.map(r => r.id)

    const normalized = inputs.map(input => {
      const risk = normalizeRisk(input, codes)
      codes.push(risk.id)
      return risk
    })

    if ((await getBackendMode()) === 'demo') {
      localRisks.save([...existing, ...normalized])
      return normalized.length
    }

    const { error } = await supabase.from('risks').insert(
      normalized.map(risk => ({
        code: risk.id,
        name: risk.name,
        phase: risk.phase,
        category: risk.category,
        probability: risk.probability,
        gravity: risk.gravity,
        measures: risk.measures,
        residual_risk: risk.residualRisk,
        status: risk.status,
        responsible: risk.responsible,
        sector: risk.sector,
        source: 'cnesst'
      }))
    )

    if (error) throw new Error(`Import des risques impossible : ${error.message}`)
    return normalized.length
  },

  /** Restaure le registre de démonstration (mode démo uniquement). */
  async resetDemoRegistry(): Promise<void> {
    if ((await getBackendMode()) !== 'demo') return
    resetCollection(COLLECTION)
  }
}
