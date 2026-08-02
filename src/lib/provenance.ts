/* © 2026 Preventera — AgenticX5. Tous droits réservés. Voir LICENSE.md. */
import {
  determinerMecanismes,
  REFERENCE_PUBLICATION,
  ENTREE_EN_VIGUEUR_RMPPE,
  type ContexteEtablissement,
  type NiveauRisque
} from '@/lib/lmrsst'
import { REFERENCE_RMPPE } from '@/lib/rmppe'
import { appVersion } from '@/lib/env'

/**
 * Provenance réglementaire d'un document généré.
 *
 * LA QUESTION À LAQUELLE CE MODULE RÉPOND
 *   Un inspecteur, ou l'employeur lui-même dix-huit mois plus tard, demande
 *   « d'où sort cette clause ? ». Sans trace figée, il faut reconstituer :
 *   quelle version du Règlement s'appliquait, quel effectif avait été saisi,
 *   quel classement sectoriel avait été retenu, quels risques du registre
 *   avaient alimenté le document. Aucune de ces réponses n'est reconstituable
 *   après coup — le registre a changé, la réglementation aussi.
 *
 * POURQUOI FIGER PLUTÔT QUE RECALCULER
 *   Recalculer donnerait la réponse d'aujourd'hui, pas celle qui a produit le
 *   document. C'est précisément l'inverse de ce qu'on cherche. La provenance
 *   est donc un instantané, écrit une fois et jamais recalculé.
 *
 * CE QUI N'Y FIGURE PAS
 *   Aucune donnée nominative. Les risques sont désignés par leur identifiant,
 *   pas recopiés ; le nom de l'entreprise vit déjà sur le programme.
 */

export interface ProvenanceReglementaire {
  /** Version du schéma de provenance, pour relire d'anciens enregistrements. */
  schema: 1

  /** Horodatage de la génération, en UTC. */
  genereLe: string

  /** Version de l'application ayant produit le document. */
  versionApplication: string

  textes: {
    /** Règlement dont les valeurs supplétives ont été appliquées. */
    reglement: string
    /** Publication CNESST dont la synthèse des mécanismes a été suivie. */
    publicationCnesst: string
    /** Entrée en vigueur du régime appliqué. */
    entreeEnVigueur: string
  }

  etablissement: {
    effectif: number
    /** Code SCIAN saisi, tel quel. */
    codeScianSaisi: string
    /** Sous-secteur de l'annexe I effectivement retenu, si résolu. */
    sousSecteurRetenu: string | null
    niveauRetenu: NiveauRisque | null
    mutuellePrevention: boolean
    multietablissements: boolean
    joursAtteinteSeuil: number | null
  }

  mecanismes: {
    prevention: string
    agentDeLiaison: boolean
    comiteSanteSecurite: boolean
    representantSanteSecurite: boolean
  }

  registre: {
    /** Identifiants des risques versés au document, dans l'ordre traité. */
    identifiants: string[]
    nombre: number
    /** Empreinte du contenu des risques, pour détecter une modification ultérieure. */
    empreinte: string
  }

  moteur: {
    /** `claude` ou `local`. */
    source: string
    modele: string | null
  }
}

export interface EntreeProvenance {
  contexte: ContexteEtablissement
  codeScianSaisi: string
  sousSecteurRetenu: string | null
  risques: Array<{ id: string; probability: number; gravity: number; measures: string }>
  source: string
  modele?: string | null
  genereLe?: Date
}

/**
 * Empreinte stable du registre versé au document.
 *
 * Elle porte sur ce qui influence le contenu produit — identifiant, cotation,
 * mesures — et non sur les champs d'affichage. Deux registres donnant le même
 * document ont la même empreinte ; une cotation modifiée après coup se voit.
 *
 * Algorithme volontairement simple et déterministe : pas de dépendance
 * cryptographique pour un usage de détection de changement, et le même résultat
 * en navigateur comme en test.
 */
export function empreinteRegistre(
  risques: Array<{ id: string; probability: number; gravity: number; measures: string }>
): string {
  const canonique = risques
    .map(r => `${r.id}|${r.probability}|${r.gravity}|${r.measures.trim()}`)
    .sort()
    .join('\n')

  // FNV-1a 32 bits, en deux passes décalées pour élargir l'empreinte.
  const fnv = (texte: string, graine: number): number => {
    let h = graine
    for (let i = 0; i < texte.length; i++) {
      h ^= texte.charCodeAt(i)
      h = Math.imul(h, 0x01000193) >>> 0
    }
    return h >>> 0
  }

  const a = fnv(canonique, 0x811c9dc5)
  const b = fnv(canonique, 0x9e3779b9)
  return `${a.toString(16).padStart(8, '0')}${b.toString(16).padStart(8, '0')}`
}

/** Construit la provenance d'un document au moment où il est produit. */
export function construireProvenance(entree: EntreeProvenance): ProvenanceReglementaire {
  const mecanismes = determinerMecanismes(entree.contexte)
  const date = entree.genereLe ?? new Date()

  return {
    schema: 1,
    genereLe: date.toISOString(),
    versionApplication: appVersion,
    textes: {
      reglement: REFERENCE_RMPPE,
      publicationCnesst: REFERENCE_PUBLICATION,
      entreeEnVigueur: ENTREE_EN_VIGUEUR_RMPPE
    },
    etablissement: {
      effectif: entree.contexte.effectif,
      codeScianSaisi: entree.codeScianSaisi,
      sousSecteurRetenu: entree.sousSecteurRetenu,
      niveauRetenu: entree.contexte.niveauRisque ?? null,
      mutuellePrevention: Boolean(entree.contexte.mutuellePrevention),
      multietablissements: Boolean(entree.contexte.multietablissements),
      joursAtteinteSeuil:
        typeof entree.contexte.joursAtteinteSeuil === 'number'
          ? entree.contexte.joursAtteinteSeuil
          : null
    },
    mecanismes: {
      prevention: mecanismes.prevention.mecanisme,
      agentDeLiaison: mecanismes.participation.agentDeLiaison,
      comiteSanteSecurite: mecanismes.participation.comiteSanteSecurite,
      representantSanteSecurite: mecanismes.participation.representantSanteSecurite
    },
    registre: {
      identifiants: entree.risques.map(r => r.id),
      nombre: entree.risques.length,
      empreinte: empreinteRegistre(entree.risques)
    },
    moteur: {
      source: entree.source,
      modele: entree.modele ?? null
    }
  }
}

/**
 * Rend la provenance lisible, pour l'annexer au document ou la présenter à
 * l'écran. Un tableau plutôt qu'un JSON brut : le destinataire est un
 * inspecteur ou un responsable SST, pas un développeur.
 */
export function provenanceEnMarkdown(p: ProvenanceReglementaire): string {
  const ouiNon = (v: boolean) => (v ? 'Oui' : 'Non')
  const mecanismeLibelle =
    p.mecanismes.prevention === 'programme_prevention' ? 'Programme de prévention' : "Plan d'action"

  return [
    '## Provenance réglementaire',
    '',
    'Éléments figés au moment de la génération. Ils permettent de retrouver sur',
    'quelle base ce document a été établi, sans dépendre de l\'état actuel du',
    'registre ou de la réglementation.',
    '',
    '| Élément | Valeur |',
    '|---|---|',
    `| Généré le | ${p.genereLe} |`,
    `| Version de l'application | ${p.versionApplication} |`,
    `| Règlement appliqué | ${p.textes.reglement} |`,
    `| Publication suivie | ${p.textes.publicationCnesst} |`,
    `| Entrée en vigueur du régime | ${p.textes.entreeEnVigueur} |`,
    `| Effectif retenu | ${p.etablissement.effectif} |`,
    `| Code SCIAN saisi | ${p.etablissement.codeScianSaisi || '—'} |`,
    `| Sous-secteur retenu | ${p.etablissement.sousSecteurRetenu ?? 'non résolu'} |`,
    `| Classement retenu | ${p.etablissement.niveauRetenu ? `niveau ${p.etablissement.niveauRetenu}` : 'non déterminé'} |`,
    `| Mutuelle de prévention | ${ouiNon(p.etablissement.mutuellePrevention)} |`,
    `| Approche multiétablissements | ${ouiNon(p.etablissement.multietablissements)} |`,
    `| Jours d'atteinte du seuil | ${p.etablissement.joursAtteinteSeuil ?? 'présence permanente présumée'} |`,
    `| Mécanisme de prévention | ${mecanismeLibelle} |`,
    `| Agent de liaison | ${ouiNon(p.mecanismes.agentDeLiaison)} |`,
    `| Comité de santé et de sécurité | ${ouiNon(p.mecanismes.comiteSanteSecurite)} |`,
    `| Représentant en santé et en sécurité | ${ouiNon(p.mecanismes.representantSanteSecurite)} |`,
    `| Risques du registre versés | ${p.registre.nombre} |`,
    `| Empreinte du registre | \`${p.registre.empreinte}\` |`,
    `| Moteur de génération | ${p.moteur.source}${p.moteur.modele ? ` (${p.moteur.modele})` : ''} |`,
    '',
    p.registre.nombre > 0
      ? `Risques versés : ${p.registre.identifiants.join(', ')}.`
      : '_Aucun risque du registre n\'a été versé à ce document._',
    '',
    "L'empreinte du registre change dès qu'un risque versé est recoté ou que ses",
    'mesures sont modifiées. Une empreinte qui ne correspond plus au registre',
    'actuel signale que le document mérite une mise à jour.'
  ].join('\n')
}
