/**
 * Pseudo-aléatoire déterministe.
 *
 * Plusieurs vues d'estimation utilisaient `Math.random()`, si bien que leurs
 * valeurs changeaient à chaque rendu : les chiffres bougeaient sous les yeux de
 * l'utilisateur et deux captures du même écran ne coïncidaient jamais.
 *
 * Ces vues restent des estimations, mais elles doivent être *stables* : à
 * entrées identiques, sortie identique. On dérive donc la valeur d'une graine
 * textuelle décrivant l'entrée plutôt que du hasard.
 */

/** Hachage FNV-1a 32 bits d'une chaîne. */
function hashString(seed: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** Valeur stable dans [0, 1) dérivée de la graine. */
export function seededUnit(seed: string): number {
  // Mulberry32, une passe : suffisant pour une répartition visuellement neutre.
  let state = hashString(seed)
  state = (state + 0x6d2b79f5) >>> 0
  let t = state
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** Valeur stable dans [min, max). */
export const seededRange = (seed: string, min: number, max: number): number =>
  min + seededUnit(seed) * (max - min)

/** Entier stable dans [min, max] inclus. */
export const seededInt = (seed: string, min: number, max: number): number =>
  Math.floor(seededRange(seed, min, max + 1))
