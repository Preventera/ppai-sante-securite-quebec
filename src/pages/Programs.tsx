
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wand2, 
  Settings, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Users,
  Building,
  Calendar,
  Shield
} from "lucide-react";
import { PrototypeGenerator } from "@/components/PrototypeGenerator";
import { AutomatedGenerator } from "@/components/AutomatedGenerator";

export default function Programs() {
  const [activeMode, setActiveMode] = useState<"prototype" | "automated">("prototype");

  const modes = {
    prototype: {
      title: "Mode Prototype",
      description: "Générateur basé sur des templates prédéfinis et prompts structurés",
      icon: Settings,
      color: "bg-blue-500",
      features: [
        "Templates prédéfinis par groupe CNESST",
        "Prompts structurés par secteur",
        "Génération rapide simulée",
        "Export basique",
        "Validation manuelle"
      ],
      pros: [
        "Rapide à utiliser",
        "Interface simple",
        "Pas de coûts IA",
        "Démo fonctionnelle"
      ],
      cons: [
        "Contenu générique",
        "Pas d'IA réelle",
        "Conformité non vérifiée",
        "Templates fixes"
      ]
    },
    automated: {
      title: "Mode Automatisé",
      description: "Système IA complet avec validation juridique et conformité CNESST",
      icon: Wand2,
      color: "bg-green-500",
      features: [
        "Génération IA avec OpenAI/Claude",
        "Validation juridique automatique",
        "Score de conformité CNESST",
        "Templates dynamiques adaptatifs",
        "Références légales intégrées"
      ],
      pros: [
        "Contenu personnalisé",
        "Conformité vérifiée",
        "IA générative réelle",
        "Évolutif et adaptatif"
      ],
      cons: [
        "Requiert intégration Supabase",
        "Coûts API IA",
        "Plus complexe",
        "Configuration avancée"
      ]
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-sst-blue">Programmes de Prévention SST</h1>
        <p className="text-gray-600">Génération intelligente de programmes conformes CNESST</p>
      </div>

      {/* Sélecteur de mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-sst-blue" />
            Choisissez votre mode de génération
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(modes).map(([key, mode]) => {
              const Icon = mode.icon;
              const isActive = activeMode === key;
              
              return (
                <div
                  key={key}
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    isActive 
                      ? 'border-sst-blue bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveMode(key as "prototype" | "automated")}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg ${mode.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{mode.title}</h3>
                      <p className="text-sm text-gray-600">{mode.description}</p>
                    </div>
                    {isActive && (
                      <Badge className="ml-auto bg-sst-blue">Actif</Badge>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">✅ Fonctionnalités</h4>
                      <ul className="text-sm space-y-1">
                        {mode.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-green-700 mb-2">Avantages</h4>
                        <ul className="text-sm space-y-1">
                          {mode.pros.map((pro, idx) => (
                            <li key={idx} className="text-green-600">+ {pro}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-orange-700 mb-2">Limites</h4>
                        <ul className="text-sm space-y-1">
                          {mode.cons.map((con, idx) => (
                            <li key={idx} className="text-orange-600">- {con}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Information importante</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Le mode automatisé nécessite une connexion Supabase pour l'IA, la base de données et la validation juridique. 
                  Le mode prototype est entièrement fonctionnel sans dépendances externes.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interface de génération */}
      <div className="space-y-6">
        {activeMode === "prototype" && <PrototypeGenerator />}
        {activeMode === "automated" && <AutomatedGenerator />}
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">156</p>
                <p className="text-sm text-gray-600">Programmes générés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">89%</p>
                <p className="text-sm text-gray-600">Conformité moyenne</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Building className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-gray-600">Secteurs couverts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">45</p>
                <p className="text-sm text-gray-600">Organisations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
