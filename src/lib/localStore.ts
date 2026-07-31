/**
 * Persistance locale utilisée par le mode démonstration.
 *
 * Objectif : permettre une démo entièrement fonctionnelle — les créations,
 * modifications et suppressions survivent aux rechargements de page — sans
 * dépendre d'un backend. Toute erreur de stockage est absorbée pour ne jamais
 * interrompre l'application (navigation privée, quota dépassé, SSR…).
 */

const NAMESPACE = 'ppai'

const storage = (): Storage | null => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    return window.localStorage
  } catch {
    return null
  }
}

const key = (name: string) => `${NAMESPACE}:${name}`

/** Lit une collection persistée, en retombant sur `seed` au premier accès. */
export function readCollection<T>(name: string, seed: T[]): T[] {
  const store = storage()
  if (!store) return [...seed]

  try {
    const raw = store.getItem(key(name))
    if (raw === null) {
      store.setItem(key(name), JSON.stringify(seed))
      return [...seed]
    }

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : [...seed]
  } catch (error) {
    console.warn(`[PPAI] Lecture locale impossible pour « ${name} »:`, error)
    return [...seed]
  }
}

/** Écrit une collection. Retourne `false` si la persistance a échoué. */
export function writeCollection<T>(name: string, items: T[]): boolean {
  const store = storage()
  if (!store) return false

  try {
    store.setItem(key(name), JSON.stringify(items))
    return true
  } catch (error) {
    console.warn(`[PPAI] Écriture locale impossible pour « ${name} »:`, error)
    return false
  }
}

/** Remet une collection à son état initial (bouton « réinitialiser la démo »). */
export function resetCollection(name: string): void {
  const store = storage()
  if (!store) return

  try {
    store.removeItem(key(name))
  } catch (error) {
    console.warn(`[PPAI] Réinitialisation impossible pour « ${name} »:`, error)
  }
}

/** Efface toutes les données de démonstration. */
export function resetAllCollections(): void {
  const store = storage()
  if (!store) return

  try {
    const toRemove = Object.keys(store).filter(k => k.startsWith(`${NAMESPACE}:`))
    toRemove.forEach(k => store.removeItem(k))
  } catch (error) {
    console.warn('[PPAI] Réinitialisation globale impossible:', error)
  }
}

/**
 * Lit une valeur JSON isolée, hors collection.
 *
 * Tout échec — stockage refusé par le navigateur, contenu corrompu — renvoie
 * `secours`. Aucun appelant ne doit avoir à envelopper l'appel : une exception
 * levée pendant le rendu de React vide l'arbre entier et produit une page
 * blanche, sans rien afficher qui permette de comprendre.
 */
export function readValue<T>(name: string, secours: T): T {
  const store = storage()
  if (!store) return secours

  try {
    const raw = store.getItem(key(name))
    if (raw === null) return secours
    return JSON.parse(raw) as T
  } catch (error) {
    console.warn(`[PPAI] Lecture locale impossible pour « ${name} », valeur par défaut retenue:`, error)
    return secours
  }
}

/** Écrit une valeur JSON isolée. Renvoie `false` si le stockage a refusé. */
export function writeValue<T>(name: string, value: T): boolean {
  const store = storage()
  if (!store) return false

  try {
    store.setItem(key(name), JSON.stringify(value))
    return true
  } catch (error) {
    console.warn(`[PPAI] Écriture locale impossible pour « ${name} »:`, error)
    return false
  }
}

/** Identifiant stable côté client, sans dépendance externe. */
export function generateId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID()
    }
  } catch {
    // repli ci-dessous
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
