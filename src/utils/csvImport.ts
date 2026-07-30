import { RiskInput } from '@/services/riskService'
import { RiskSector, RiskStatus } from '@/types/risk'

/**
 * Lecture et cartographie de fichiers CSV/TSV vers le registre des risques.
 *
 * Remplace la détection de colonnes qui était déduite du *nom* du fichier sans
 * jamais en lire le contenu. Ici, l'en-tête réel est analysé, le séparateur est
 * détecté, et les colonnes sont rapprochées des champs du registre.
 */

export interface ParsedCsv {
  headers: string[]
  rows: Record<string, string>[]
  delimiter: string
}

/** Champs du registre pouvant être alimentés depuis un CSV. */
export type MappableField =
  | 'name'
  | 'phase'
  | 'category'
  | 'probability'
  | 'gravity'
  | 'measures'
  | 'responsible'
  | 'sector'
  | 'status'

export type ColumnMapping = Partial<Record<MappableField, string>>

/** Détecte le séparateur d'après la première ligne non vide. */
function detectDelimiter(headerLine: string): string {
  const candidates = [';', ',', '\t', '|']
  let best = ','
  let bestCount = 0

  candidates.forEach(candidate => {
    // On compte hors guillemets pour ne pas confondre séparateur et ponctuation.
    let count = 0
    let inQuotes = false
    for (let i = 0; i < headerLine.length; i += 1) {
      const char = headerLine[i]
      if (char === '"') inQuotes = !inQuotes
      else if (char === candidate && !inQuotes) count += 1
    }
    if (count > bestCount) {
      bestCount = count
      best = candidate
    }
  })

  return best
}

/** Découpe une ligne CSV en respectant les guillemets doublés (RFC 4180). */
function splitLine(line: string, delimiter: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === delimiter && !inQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  cells.push(current.trim())
  return cells
}

/** Découpe le texte en lignes logiques, en préservant les sauts entre guillemets. */
function splitRecords(text: string): string[] {
  const records: string[] = []
  let current = ''
  let inQuotes = false

  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i]

    if (char === '"') {
      inQuotes = !inQuotes
      current += char
      continue
    }

    if (char === '\n' && !inQuotes) {
      if (current.trim().length > 0) records.push(current)
      current = ''
      continue
    }

    current += char
  }

  if (current.trim().length > 0) records.push(current)
  return records
}

export function parseCsv(text: string): ParsedCsv {
  // Retire le BOM UTF-8 éventuel, sinon la première colonne est mal nommée.
  const clean = text.replace(/^\uFEFF/, '')
  const records = splitRecords(clean)

  if (records.length === 0) {
    return { headers: [], rows: [], delimiter: ',' }
  }

  const delimiter = detectDelimiter(records[0])
  const headers = splitLine(records[0], delimiter).map(header => header.replace(/^"|"$/g, ''))

  const rows = records.slice(1).map(record => {
    const cells = splitLine(record, delimiter)
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = (cells[index] ?? '').replace(/^"|"$/g, '')
    })
    return row
  })

  return { headers, rows, delimiter }
}

/** Mots-clés reconnus par champ, en français comme en anglais. */
const FIELD_PATTERNS: Record<MappableField, RegExp> = {
  name: /^(nom|description|risque|danger|libell|intitul|name|hazard|lesion|l[ée]sion|nature)/i,
  phase: /^(phase|[ée]tape|stage|activit)/i,
  category: /^(cat[ée]gorie|category|type|genre|agent|classe)/i,
  probability: /^(probabilit|fr[ée]quence|probability|occurrence|p$)/i,
  gravity: /^(gravit|s[ée]v[ée]rit|severity|impact|cons[ée]quence|g$)/i,
  measures: /^(mesure|contr[ôo]le|pr[ée]vention|action|correctif|measure|control)/i,
  responsible: /^(responsable|owner|charg|titulaire|assign)/i,
  sector: /^(secteur|sector|domaine|division)/i,
  status: /^(statut|status|[ée]tat|state)/i
}

/** Propose une cartographie automatique à partir des en-têtes détectés. */
export function guessMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {}
  const used = new Set<string>()

  ;(Object.keys(FIELD_PATTERNS) as MappableField[]).forEach(field => {
    const match = headers.find(header => !used.has(header) && FIELD_PATTERNS[field].test(header.trim()))
    if (match) {
      mapping[field] = match
      used.add(match)
    }
  })

  return mapping
}

const VALID_SECTORS: RiskSector[] = ['Construction', 'Électricité', 'Sécurité', 'Santé']
const VALID_STATUSES: RiskStatus[] = [
  'Contrôles actifs',
  'En surveillance',
  'Action requise',
  'Complété',
  'En contrôle'
]

/** Convertit une valeur libre en note de 1 à 5. */
function toScale(value: string | undefined): number {
  if (!value) return 3

  const numeric = Number(value.replace(',', '.').replace(/[^\d.-]/g, ''))
  if (Number.isFinite(numeric) && numeric > 0) {
    return Math.min(5, Math.max(1, Math.round(numeric)))
  }

  // Échelles qualitatives courantes dans les extractions CNESST.
  const text = value.toLowerCase()
  if (/tr[èe]s (faible|rare)|n[ée]gligeable/.test(text)) return 1
  if (/faible|rare|mineur/.test(text)) return 2
  if (/moyen|mod[ée]r|occasionnel|possible/.test(text)) return 3
  if (/[ée]lev|probable|majeur|critique/.test(text)) return 4
  if (/tr[èe]s [ée]lev|fr[ée]quent|catastroph|mortel/.test(text)) return 5

  return 3
}

function toSector(value: string | undefined): RiskSector {
  if (!value) return 'Construction'
  const direct = VALID_SECTORS.find(sector => sector.toLowerCase() === value.trim().toLowerCase())
  if (direct) return direct

  const text = value.toLowerCase()
  if (/[ée]lectri|tension|[ée]nergie/.test(text)) return 'Électricité'
  if (/sant|hygi|m[ée]dic|exposition|maladie/.test(text)) return 'Santé'
  if (/construct|chantier|b[âa]timent/.test(text)) return 'Construction'
  return 'Sécurité'
}

function toStatus(value: string | undefined): RiskStatus {
  if (!value) return 'En surveillance'
  const direct = VALID_STATUSES.find(status => status.toLowerCase() === value.trim().toLowerCase())
  return direct ?? 'En surveillance'
}

export interface ImportPreview {
  risks: RiskInput[]
  skipped: number
}

/**
 * Transforme les lignes lues en risques importables.
 * Les lignes sans description exploitable sont écartées et comptabilisées.
 */
export function rowsToRiskInputs(
  rows: Record<string, string>[],
  mapping: ColumnMapping
): ImportPreview {
  const risks: RiskInput[] = []
  let skipped = 0

  rows.forEach(row => {
    const name = mapping.name ? row[mapping.name]?.trim() : ''

    if (!name) {
      skipped += 1
      return
    }

    risks.push({
      name,
      phase: mapping.phase ? row[mapping.phase] ?? '' : '',
      category: mapping.category ? row[mapping.category] ?? '' : 'Autres risques professionnels',
      probability: toScale(mapping.probability ? row[mapping.probability] : undefined),
      gravity: toScale(mapping.gravity ? row[mapping.gravity] : undefined),
      measures: mapping.measures ? row[mapping.measures] ?? '' : '',
      responsible: mapping.responsible ? row[mapping.responsible] ?? '' : '',
      sector: toSector(mapping.sector ? row[mapping.sector] : undefined),
      status: toStatus(mapping.status ? row[mapping.status] : undefined)
    })
  })

  return { risks, skipped }
}
