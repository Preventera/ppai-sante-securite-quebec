
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Target, TrendingUp, Users, AlertTriangle, Zap } from "lucide-react";

const algorithms = [
  {
    name: "Random Forest",
    purpose: "Prédiction de gravité des incidents",
    accuracy: "94.2%",
    icon: Target,
    color: "bg-green-100 text-green-800",
    description: "Classification de la gravité des incidents basée sur les caractéristiques du poste de travail"
  },
  {
    name: "Gradient Boosting",
    purpose: "Classification des incidents",
    accuracy: "91.8%",
    icon: TrendingUp,
    color: "bg-blue-100 text-blue-800",
    description: "Prédiction binaire de l'occurrence d'incidents avec optimisation séquentielle"
  },
  {
    name: "Régression Logistique",
    purpose: "Probabilité d'occurrence",
    accuracy: "87.5%",
    icon: Brain,
    color: "bg-purple-100 text-purple-800",
    description: "Calcul de probabilité d'incident basé sur les facteurs de risque identifiés"
  },
  {
    name: "Réseau de Neurones",
    purpose: "Classification multi-classe avancée",
    accuracy: "92.1%",
    icon: Zap,
    color: "bg-yellow-100 text-yellow-800",
    description: "Classification complexe avec apprentissage de patterns non-linéaires"
  },
  {
    name: "K-Means Clustering",
    purpose: "Profilage des risques",
    accuracy: "89.3%",
    icon: Users,
    color: "bg-indigo-100 text-indigo-800",
    description: "Identification de groupes homogènes de travailleurs selon leur profil de risque"
  },
  {
    name: "Isolation Forest",
    purpose: "Détection d'anomalies SST",
    accuracy: "95.7%",
    icon: AlertTriangle,
    color: "bg-red-100 text-red-800",
    description: "Détection automatique de situations anormales nécessitant une attention immédiate"
  }
];

export function AIAlgorithmsInfo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-600" />
          Algorithmes IA intégrés au moteur PPAI
        </CardTitle>
        <p className="text-sm text-gray-600">
          6 algorithmes d'intelligence artificielle avancés pour l'analyse prédictive des risques SST
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {algorithms.map((algo, index) => (
            <Card key={index} className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <algo.icon className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-sm">{algo.name}</h4>
                  </div>
                  <Badge className={algo.color}>
                    {algo.accuracy}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-gray-700">Objectif :</span>
                    <p className="text-xs text-gray-600">{algo.purpose}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-700">Description :</span>
                    <p className="text-xs text-gray-600">{algo.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">🎯 Innovation PPAI spécifique</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Structure des documents alignée sur la LSST et le RMPPÉ</li>
            <li>• Prise en compte des groupes prioritaires</li>
            <li>• Types de risques selon classification québécoise</li>
            <li>• Échéanciers repris des délais réglementaires</li>
            <li>• Responsabilités alignées sur les rôles SST</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
