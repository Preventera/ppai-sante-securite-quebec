import { supabase } from '@/integrations/supabase/client'

/**
 * Organisation propriétaire des données écrites par l'utilisateur courant.
 *
 * Les politiques RLS exigent que `organization_id` corresponde à celle du
 * profil : une insertion qui l'omettrait serait rejetée. Cette valeur ne
 * change pas au cours d'une session, elle est donc mise en cache.
 */

let cached: { userId: string; organizationId: string } | null = null

export async function getCurrentOrganizationId(): Promise<string | null> {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user
  if (!user) return null

  if (cached?.userId === user.id) return cached.organizationId

  const { data, error } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !data?.organization_id) {
    console.warn('[PPAI] Organisation introuvable pour cet utilisateur:', error?.message)
    return null
  }

  cached = { userId: user.id, organizationId: data.organization_id }
  return data.organization_id
}

/** Vide le cache — à appeler à la déconnexion. */
export function clearOrganizationCache(): void {
  cached = null
}

/**
 * Identifiant d'organisation requis pour une écriture, ou une erreur explicite.
 * Sans lui, la base rejetterait la requête avec un message peu parlant.
 */
export async function requireOrganizationId(): Promise<string> {
  const organizationId = await getCurrentOrganizationId()
  if (!organizationId) {
    throw new Error(
      "Aucune organisation rattachée à votre compte : reconnectez-vous ou vérifiez que les migrations sont appliquées."
    )
  }
  return organizationId
}
