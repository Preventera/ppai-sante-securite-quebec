import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Wand2, Building, Workflow, Calculator, ArrowRight } from 'lucide-react'

/**
 * Porte d'entrée unique de la génération de documents.
 *
 * POURQUOI CETTE PAGE EXISTE
 *   La navigation offrait quatre « générateurs » côte à côte — CNESST, par
 *   secteur, pipeline, KPI — qui appellent tous le même service. Quatre portes
 *   pour une seule action : personne ne savait laquelle était la bonne, parce
 *   qu'il n'y avait pas de bonne réponse. La question à poser d'abord n'est
 *   pas « quel outil ? » mais « quel document voulez-vous produire ? ».
 *
 * Les quatre parcours restent des pages distinctes, atteignables par leurs
 * adresses historiques : cette page les ordonne, elle ne les remplace pas.
 */

const PARCOURS = [
  {
    url: '/generator',
    icon: Wand2,
    titre: 'Programme de prévention complet',
    quoi: "Le document maître exigé par la LSST : risques du registre, mesures, responsables, échéancier, mécanismes de participation.",
    quand: 'Le choix habituel. Partez d\'ici si vous hésitez.',
    principal: true
  },
  {
    url: '/sector-generator',
    icon: Building,
    titre: 'Document sectoriel type',
    quoi: 'Un document pré-cadré pour un secteur (construction, santé, transport…), à partir de ses risques et obligations caractéristiques.',
    quand: "Pour dégrossir vite, sans partir de votre registre."
  },
  {
    url: '/kpi-generator',
    icon: Calculator,
    titre: 'Indicateurs et tableaux de bord',
    quoi: "Les indicateurs de suivi du programme : fréquence, gravité, avancement des mesures, écarts de conformité.",
    quand: 'Une fois le programme établi, pour le piloter.'
  },
  {
    url: '/pipeline-generator',
    icon: Workflow,
    titre: 'Pipeline avancé (multi-étapes)',
    quoi: "L'enchaînement complet orchestré étape par étape, avec reprise et journal d'exécution.",
    quand: 'Pour les utilisateurs avancés qui veulent voir chaque étape.'
  }
]

const Generer = () => (
  <div className="p-6 max-w-3xl">
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-sst-blue flex items-center gap-2">
        <Wand2 className="w-8 h-8" />
        Générer un document
      </h1>
      <p className="text-gray-600 mt-1">
        Choisissez d'abord ce que vous voulez produire — l'outil suit.
      </p>
    </div>

    <div className="space-y-3">
      {PARCOURS.map(p => (
        <Link key={p.url} to={p.url} className="block group">
          <Card className={p.principal ? 'border-sst-blue border-2' : ''}>
            <CardContent className="p-4 flex items-start gap-4">
              <p.icon className="w-8 h-8 text-sst-blue flex-none mt-1" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold group-hover:text-sst-blue">
                  {p.titre}
                  {p.principal && (
                    <span className="ml-2 text-xs font-medium text-sst-blue bg-blue-50 px-2 py-0.5 rounded">
                      recommandé
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-600 mt-0.5">{p.quoi}</p>
                <p className="text-xs text-gray-500 mt-1 italic">{p.quand}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-sst-blue flex-none mt-2" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  </div>
)

export default Generer
