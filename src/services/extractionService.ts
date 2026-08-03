/* © 2026 Preventera — AgenticX5. Tous droits réservés. Voir LICENSE.md. */
/**
 * Envoie un document au moteur d'extraction et vérifie ce qui revient.
 *
 * PAS DE REPLI LOCAL, ET C'EST VOULU
 *   Partout ailleurs le produit se replie sur un moteur local quand l'Edge
 *   Function est injoignable : un programme composé sans modèle reste un
 *   programme. Ici, non. Lire un PDF pour en tirer des risques suppose un
 *   modèle ; sans lui il n'y a pas de version dégradée, il n'y a rien. Mieux
 *   vaut le dire que produire un registre vide en laissant croire que le
 *   document ne contenait rien.
 *
 * LA CLÉ RESTE CÔTÉ SERVEUR
 *   L'appel passe par l'Edge Function `extraire-document`. Aucune clé API ne
 *   transite par le navigateur — tout ce qui est préfixé VITE_ est public.
 */

import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { verifierExtraction, type ExtractionVerifiee } from '@/lib/extraction'

/** Taille au-delà de laquelle l'envoi échouera de toute façon. */
export const TAILLE_MAX_OCTETS = 20 * 1024 * 1024

export const TYPES_DOCUMENT = [
  'Programme de prévention',
  'Analyse de risques',
  "Rapport d'audit",
  "Rapport d'inspection",
  'Procédure de travail',
  "Plan d'urgence",
] as const

export type TypeDocument = (typeof TYPES_DOCUMENT)[number]

export interface ResultatExtraction {
  extraction: ExtractionVerifiee
  metadonnees: { document: string; modele: string; extraitLe: string }
}

/** Erreur portant un message destiné à l'utilisateur, pas au journal. */
export class ErreurExtraction extends Error {
  constructor(message: string, readonly detail?: string) {
    super(message)
    this.name = 'ErreurExtraction'
  }
}

/**
 * Encode le PDF en base64 sans préfixe `data:`.
 *
 * `btoa` sur une chaîne binaire dépasse la pile pour un fichier de plusieurs
 * mégaoctets : on découpe en tranches.
 */
export async function encoderBase64(fichier: File): Promise<string> {
  const octets = new Uint8Array(await fichier.arrayBuffer())
  const tranche = 0x8000
  let binaire = ''
  for (let i = 0; i < octets.length; i += tranche) {
    binaire += String.fromCharCode(...octets.subarray(i, i + tranche))
  }
  return btoa(binaire)
}

export function validerFichier(fichier: File): string | null {
  const estPdf =
    fichier.type === 'application/pdf' || fichier.name.toLowerCase().endsWith('.pdf')
  if (!estPdf) {
    return "Seuls les fichiers PDF sont acceptés pour l'instant."
  }
  if (fichier.size > TAILLE_MAX_OCTETS) {
    const mo = (fichier.size / 1024 / 1024).toFixed(1)
    return `Le fichier pèse ${mo} Mo ; la limite est de ${TAILLE_MAX_OCTETS / 1024 / 1024} Mo.`
  }
  if (fichier.size === 0) {
    return 'Le fichier est vide.'
  }
  return null
}

export async function extraireDocument(
  fichier: File,
  typeDocument?: TypeDocument,
): Promise<ResultatExtraction> {
  const probleme = validerFichier(fichier)
  if (probleme) throw new ErreurExtraction(probleme)

  const pdfBase64 = await encoderBase64(fichier)

  const { data, error } = await supabase.functions.invoke('extraire-document', {
    body: { pdfBase64, nomDocument: fichier.name, typeDocument },
  })

  if (error) {
    // La fonction renvoie un corps JSON détaillé même en cas d'échec (clé
    // absente, Anthropic en erreur, réponse illisible) — mais tout statut
    // non-2xx fait atterrir ce corps ici, dans `error.context`, plutôt que
    // dans `data`. Sans ce détour, l'utilisateur ne voit qu'un message
    // générique qui ne dit pas ce qui a réellement échoué.
    let detail: string | undefined
    let messageServeur: string | undefined
    if (error instanceof FunctionsHttpError) {
      try {
        const corps = await error.context.json()
        messageServeur = corps?.error
        detail = corps?.details ?? corps?.apercu
      } catch {
        // Corps non-JSON : on retombe sur le message générique ci-dessous.
      }
    }
    throw new ErreurExtraction(
      messageServeur ?? "Le moteur d'extraction n'a pas répondu.",
      detail ?? "Vérifiez que la fonction « extraire-document » est déployée et que ANTHROPIC_API_KEY figure dans ses secrets.",
    )
  }
  if (data?.error) {
    throw new ErreurExtraction(String(data.error), data.details ?? data.apercu)
  }
  if (!data?.extraction) {
    throw new ErreurExtraction("Le moteur d'extraction a répondu sans contenu exploitable.")
  }

  return {
    extraction: verifierExtraction(data.extraction),
    metadonnees: data.metadonnees ?? {
      document: fichier.name,
      modele: 'inconnu',
      extraitLe: new Date().toISOString(),
    },
  }
}
