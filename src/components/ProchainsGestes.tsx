import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useRisks } from '@/hooks/useRisks'
import { roleEffectif, type RoleApplicatif } from '@/lib/roles'
import { determinerMecanismes } from '@/lib/lmrsst'
import { secteurPourCode } from '@/lib/scianNiveaux'

/**
 * « Prochains gestes » : l'accueil dit quoi faire, pas seulement quoi regarder.
 *
 * Chaque geste est calculé depuis les données réelles — registre, fiche
 * d'organisation, mécanismes exigés — et dépend du rôle : la direction voit ce
 * qui presse, le responsable SST ce qui est incomplet, le comité ses
 * obligations de fonctionnement, le membre ce qu'il peut faire. Aucun chiffre
 * inventé : quand une donnée manque, le geste proposé est précisément d'aller
 * la fournir.
 */

interface Geste {
  cle: string
  libelle: string
  detail: string
  url: string
  ton: 'critique' | 'normal' | 'fait'
}

const TON_BORDURE: Record<Geste['ton'], string> = {
  critique: 'border-l-red-500',
  normal: 'border-l-sst-blue',
  fait: 'border-l-green-600'
}

export function ProchainsGestes() {
  const { organization, profile, demoMode } = useAuth()
  const { data: risks = [], isLoading } = useRisks()
  const role: RoleApplicatif = roleEffectif(profile?.role, demoMode)

  const gestes = useMemo<Geste[]>(() => {
    const liste: Geste[] = []

    const effectif = organization?.employee_count ?? null
    const niveau = secteurPourCode(organization?.scian_code)?.niveau
    const mecanismes = effectif ? determinerMecanismes({ effectif, niveauRisque: niveau }) : null

    const critiquesSansResponsable = risks.filter(
      r => r.initialRisk >= 15 && !r.responsible?.trim()
    ).length
    const sansMesures = risks.filter(r => !r.measures?.trim()).length

    if (role === 'admin' || role === 'preventionniste') {
      if (!demoMode && organization && !effectif) {
        liste.push({
          cle: 'effectif',
          libelle: "Déclarer l'effectif et le secteur de l'établissement",
          detail: 'Ils déterminent vos obligations : comité ou agent de liaison, programme ou plan d\'action.',
          url: '/participation',
          ton: 'critique'
        })
      }
      if (critiquesSansResponsable > 0) {
        liste.push({
          cle: 'responsables',
          libelle: `${critiquesSansResponsable} risque(s) critique(s) sans responsable désigné`,
          detail: 'Indice 15 et plus — chaque mesure doit avoir un responsable.',
          url: '/risks',
          ton: 'critique'
        })
      }
      if (sansMesures > 0) {
        liste.push({
          cle: 'mesures',
          libelle: `${sansMesures} risque(s) sans mesure de prévention`,
          detail: 'À compléter selon la hiérarchie des mesures (RMPPÉ art. 6).',
          url: '/risks',
          ton: 'normal'
        })
      }
      if (risks.length === 0) {
        liste.push({
          cle: 'amorcer',
          libelle: 'Amorcer le registre avec les risques types de votre secteur',
          detail: 'Dérivés des lésions professionnelles CNESST — à coter risque par risque.',
          url: '/risks',
          ton: 'normal'
        })
      } else if (critiquesSansResponsable === 0 && sansMesures === 0) {
        liste.push({
          cle: 'generer',
          libelle: mecanismes?.prevention.mecanisme === 'plan_action'
            ? "Générer le plan d'action"
            : 'Générer le programme de prévention',
          detail: `Registre en ordre : ${risks.length} risque(s), tous dotés de mesures et de responsables.`,
          url: '/generer',
          ton: 'fait'
        })
      }
    }

    if (role === 'comite') {
      liste.push({
        cle: 'fonctionnement',
        libelle: mecanismes?.participation.comiteSanteSecurite
          ? 'Fonctionnement du comité : réunions, libération, formation'
          : 'Vos mécanismes de participation',
        detail: 'Les modalités chiffrées qui s\'appliquent à défaut d\'entente.',
        url: '/participation',
        ton: 'normal'
      })
      liste.push({
        cle: 'registre',
        libelle: 'Consulter le registre des risques',
        detail: `${risks.length} risque(s) au registre de l'établissement.`,
        url: '/risks',
        ton: 'normal'
      })
      liste.push({
        cle: 'programmes',
        libelle: 'Programmes et documents en vigueur',
        detail: 'Les documents sur lesquels le comité donne son avis.',
        url: '/programs',
        ton: 'normal'
      })
    }

    if (role === 'membre') {
      liste.push({
        cle: 'signaler',
        libelle: 'Signaler un risque',
        detail: 'Vous voyez quelque chose de dangereux ? Deux minutes suffisent.',
        url: '/signaler',
        ton: 'critique'
      })
      liste.push({
        cle: 'programme',
        libelle: 'Consulter le programme en vigueur',
        detail: 'Les mesures de prévention qui vous concernent.',
        url: '/programs',
        ton: 'normal'
      })
    }

    return liste.slice(0, 4)
  }, [risks, role, organization, demoMode])

  if (isLoading || gestes.length === 0) return null

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Prochains gestes</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {gestes.map(geste => (
          <Link key={geste.cle} to={geste.url} className="block group">
            <Card className={`border-l-4 ${TON_BORDURE[geste.ton]} h-full`}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm group-hover:text-sst-blue">{geste.libelle}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{geste.detail}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-sst-blue flex-none" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
