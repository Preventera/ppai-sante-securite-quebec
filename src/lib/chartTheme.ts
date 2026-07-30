/**
 * Jetons de visualisation partagés par tous les graphiques de l'application.
 *
 * Les deux teintes catégorielles ont été validées sur la surface des cartes
 * (blanc) : séparation CVD ΔE 24,7 (protan) et vision normale ΔE 33,6, très
 * au-delà des planchers de 8 et 15. Les ajouter/modifier impose de revalider.
 *
 * Les couleurs de statut sont volontairement sous-contrastées en mode clair :
 * elles ne doivent JAMAIS porter seules le sens — toujours accompagnées d'une
 * icône et d'un libellé texte.
 */

export const chartColors = {
  /** Slot catégoriel 1 — série principale (indice initial, décomptes). */
  series1: '#2a78d6',
  /** Slot catégoriel 2 — série de comparaison (indice résiduel). */
  series2: '#eb6834'
} as const

export const chartInk = {
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  muted: '#898781',
  secondary: '#52514e'
} as const

export const statusColors = {
  good: '#0ca30c',
  warning: '#fab219',
  critical: '#d03b3b'
} as const

export type IndicatorStatus = keyof typeof statusColors

/** Style commun des infobulles recharts. */
export const tooltipStyle = {
  contentStyle: {
    borderRadius: 8,
    border: `1px solid ${chartInk.grid}`,
    fontSize: 12,
    boxShadow: '0 2px 8px rgba(11,11,11,0.08)'
  },
  labelStyle: { color: chartInk.secondary, fontWeight: 600 }
} as const
