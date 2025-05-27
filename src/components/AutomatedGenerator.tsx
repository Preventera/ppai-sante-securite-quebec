
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Wand2, Database, CheckCircle, ExternalLink } from "lucide-react";

export function AutomatedGenerator() {
  const [showDemo, setShowDemo] = useState(false);

  const features = [
    {
      title: "Génération IA Avancée",
      description: "Utilise OpenAI GPT-4 pour créer du contenu personnalisé",
      icon: Wand2,
      status: "requires_supabase"
    },
    {
      title: "Base de Données Vectorielle",
      description: "Stockage des embeddings pour recherche sémantique",
      icon: Database,
      status: "requires_supabase"
    },
    {
      title: "Validation Juridique",
      description: "Vérification automatique de conformité CNESST",
      icon: CheckCircle,
      status: "requires_supabase"
    }
  ];

  const demoSteps = [
    {
      step: 1,
      title: "Collecte d'informations",
      description: "Formulaire intelligent qui adapte les questions selon le secteur",
      details: ["Nom organisation", "Nombre employés", "Code SCIAN", "Activités principales", "Risques connus"]
    },
    {
      step: 2,
      title: "Analyse des risques IA",
      description: "L'IA analyse votre secteur et identifie automatiquement les risques",
      details: ["Consultation base CNESST", "Analyse sectorielle", "Risques émergents", "Matrice de criticité"]
    },
    {
      step: 3,
      title: "Génération du programme",
      description: "Création d'un programme personnalisé avec références légales",
      details: ["Contenu adapté", "Articles LSST pertinents", "Mesures hiérarchisées", "Échéanciers réalistes"]
    },
    {
      step: 4,
      title: "Validation et score",
      description: "Vérification automatique de conformité avec score de qualité",
      details: ["Score conformité", "Points à améliorer", "Recommandations", "Validation expert"]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Statut Supabase */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">
                Intégration Supabase Requise
              </h3>
              <p className="text-blue-800 mb-4">
                Le mode automatisé nécessite une connexion à Supabase pour activer :
                l'IA générative, la base de données vectorielle, et la validation juridique automatique.
              </p>
              <div className="flex gap-3">
                <Button className="bg-green-600 hover:bg-green-700">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Connecter Supabase
                </Button>
                <Button variant="outline" onClick={() => setShowDemo(!showDemo)}>
                  {showDemo ? "Masquer" : "Voir"} Démo
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fonctionnalités */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card key={index} className="relative">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
                <Badge variant="outline" className="mt-4 text-xs">
                  Requiert Supabase
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Démo du processus */}
      {showDemo && (
        <Card>
          <CardHeader>
            <CardTitle>Démo : Processus de Génération Automatisée</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {demoSteps.map((step) => (
              <div key={step.step} className="flex gap-4">
                <div className="w-8 h-8 bg-sst-blue text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {step.step}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">{step.title}</h4>
                  <p className="text-gray-600 mb-3">{step.description}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {step.details.map((detail, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        {detail}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Avantages du mode automatisé */}
      <Card>
        <CardHeader>
          <CardTitle>Avantages du Mode Automatisé</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-green-800 mb-3">🤖 Intelligence Artificielle</h4>
              <ul className="space-y-2 text-sm">
                <li>• Contenu adapté à votre organisation spécifique</li>
                <li>• Analyse automatique des risques sectoriels</li>
                <li>• Suggestions de mesures personnalisées</li>
                <li>• Évolution continue avec l'apprentissage</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-blue-800 mb-3">⚖️ Conformité Juridique</h4>
              <ul className="space-y-2 text-sm">
                <li>• Validation automatique CNESST/LSST</li>
                <li>• Références légales intégrées</li>
                <li>• Score de conformité en temps réel</li>
                <li>• Mise à jour selon évolution réglementaire</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-purple-800 mb-3">📊 Analytics Avancés</h4>
              <ul className="space-y-2 text-sm">
                <li>• Tableau de bord de performance SST</li>
                <li>• Suivi des indicateurs clés</li>
                <li>• Benchmarking sectoriel</li>
                <li>• Rapports automatisés</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-orange-800 mb-3">🔄 Évolutif</h4>
              <ul className="space-y-2 text-sm">
                <li>• Versioning et historique</li>
                <li>• Collaboration multi-utilisateurs</li>
                <li>• Intégration avec autres systèmes</li>
                <li>• API pour développements futurs</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparaison des coûts */}
      <Card>
        <CardHeader>
          <CardTitle>Estimation des Coûts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-3">Mode Prototype</h4>
              <div className="text-2xl font-bold text-blue-600 mb-2">Gratuit</div>
              <ul className="text-sm space-y-1">
                <li>• Aucun coût d'utilisation</li>
                <li>• Pas de dépendances externes</li>
                <li>• Templates inclus</li>
                <li>• Support communautaire</li>
              </ul>
            </div>
            
            <div className="p-4 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-3">Mode Automatisé</h4>
              <div className="text-2xl font-bold text-green-600 mb-2">~15$/mois</div>
              <ul className="text-sm space-y-1">
                <li>• Supabase Pro : ~10$/mois</li>
                <li>• API OpenAI : ~5$/mois (usage moyen)</li>
                <li>• Stockage base vectorielle inclus</li>
                <li>• Support technique avancé</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notice importante */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Prochaines étapes</p>
              <p className="text-sm text-yellow-700 mt-1">
                Pour activer le mode automatisé, connectez d'abord votre projet à Supabase. 
                Une fois connecté, nous pourrons déployer l'infrastructure complète : 
                base de données, API IA, et système de validation juridique.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
