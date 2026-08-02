import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { URL_RETOUR_REINITIALISATION } from '@/contexts/AuthContext'

/**
 * Rattrape un lien de réinitialisation qui n'atterrit pas au bon endroit.
 *
 * POURQUOI C'EST NÉCESSAIRE
 *   `resetPasswordForEmail` transmet bien `/auth/reset` comme adresse de
 *   retour, mais Supabase l'IGNORE si elle n'est pas déclarée dans les
 *   « Redirect URLs » du projet : il rabat alors le lien sur la « Site URL »,
 *   restée sur http://localhost:3000 dans un projet neuf. Constaté en
 *   production.
 *
 *   Le client Supabase consomme le jeton quelle que soit la page atteinte et
 *   émet PASSWORD_RECOVERY. Sans ce rattrapage, l'utilisateur se retrouvait
 *   donc simplement connecté sur le tableau de bord — sans jamais qu'on lui
 *   propose de choisir un mot de passe, alors que c'est précisément ce qu'il
 *   était venu faire.
 *
 *   Une configuration correcte reste préférable : ce composant évite l'impasse,
 *   il ne dispense pas de déclarer les adresses de retour.
 */
export function RedirectionRecuperation() {
  const { recuperationEnCours } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!recuperationEnCours) return
    if (location.pathname === URL_RETOUR_REINITIALISATION) return

    navigate(URL_RETOUR_REINITIALISATION, { replace: true })
  }, [recuperationEnCours, location.pathname, navigate])

  return null
}
