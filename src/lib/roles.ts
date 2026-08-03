/**
 * Rôles applicatifs.
 *
 * Quatre rôles, calqués sur les responsabilités que la LSST nomme — pas sur
 * un organigramme inventé. La migration 20241001000005 les applique jusqu'aux
 * politiques RLS : ce module ne fait que refléter côté interface ce que la
 * base impose de toute façon. Masquer un bouton n'est jamais la protection ;
 * c'est éviter à l'utilisateur de cliquer vers un refus.
 */

export type RoleApplicatif = 'admin' | 'preventionniste' | 'comite' | 'membre'

export const LIBELLE_ROLE: Record<RoleApplicatif, string> = {
  admin: 'Direction',
  preventionniste: 'Responsable SST',
  comite: 'Comité / RSS',
  membre: 'Membre'
}

export const DESCRIPTION_ROLE: Record<RoleApplicatif, string> = {
  admin: "Décide, attribue les rôles, répond du programme (LSST art. 51, 58 et 59).",
  preventionniste: 'Tient le registre des risques et prépare les documents de prévention.',
  comite: 'Consulte le registre et les programmes, donne des avis (LSST art. 68 et 78).',
  membre: 'Consulte les documents en vigueur (LSST art. 49).'
}

export const ROLES_APPLICATIFS = Object.keys(LIBELLE_ROLE) as RoleApplicatif[]

/**
 * Résout le rôle effectif d'une session.
 *
 * En mode démonstration il n'y a ni compte ni profil : la démonstration doit
 * montrer l'application complète, donc elle se comporte en admin. Un rôle
 * inconnu (base en avance ou en retard sur le code) retombe sur `membre`,
 * le rôle le moins privilégié — jamais l'inverse.
 */
export function roleEffectif(role: string | undefined | null, demoMode: boolean): RoleApplicatif {
  if (demoMode) return 'admin'
  if (role && (ROLES_APPLICATIFS as string[]).includes(role)) return role as RoleApplicatif
  return 'membre'
}

/** Vrai pour les rôles autorisés à écrire dans le registre et les programmes. */
export const peutRediger = (role: RoleApplicatif): boolean =>
  role === 'admin' || role === 'preventionniste'

/** Vrai pour le seul rôle autorisé à gérer les comptes et les rôles. */
export const peutAdministrer = (role: RoleApplicatif): boolean => role === 'admin'
