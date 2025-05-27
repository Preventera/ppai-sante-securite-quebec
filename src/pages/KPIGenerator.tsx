import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KPIConfiguration } from "@/components/KPIConfiguration";
import { KPIDashboard } from "@/components/KPIDashboard";
import { RiskMatrix } from "@/components/RiskMatrix";
import { RiskHeatmap } from "@/components/RiskHeatmap";
import { KPICalculator } from "@/components/KPICalculator";
import { PredictiveEngine } from "@/components/PredictiveEngine";
import { CNESSTDataUploader } from "@/components/CNESSTDataUploader";
import { CNESSTIntegrationDashboard } from "@/components/CNESSTIntegrationDashboard";
import { BarChart3, Target, Settings, Map, Calculator, Brain, Info, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CNESSTMetadata } from "@/types/cnesst";
import { CNESSTDataProcessor } from "@/utils/cnessDataProcessor";

interface ConfigurationData {
  secteur: string;
  tailleEtablissement: string;
  groupePrioritaire: number;
  activitesPrincipales: string[];
}

// Données d'exemple pour démonstration
const exampleConfiguration: ConfigurationData = {
  secteur: "construction",
  tailleEtablissement: "100-499",
  groupePrioritaire: 2,
  activitesPrincipales: ["Travaux en hauteur", "Manutention manuelle", "Soudage et coupage"]
};

const KPIGenerator = () => {
  const [configuration, setConfiguration] = useState<ConfigurationData | null>(null);
  const [activeTab, setActiveTab] = useState("config");
  const [cnessData, setCnessData] = useState<CNESSTMetadata | null>(null);

  const handleConfigurationComplete = (config: ConfigurationData) => {
    setConfiguration(config);
    // Charger les données CNESST par défaut si pas encore chargées
    if (!cnessData) {
      setCnessData(CNESSTDataProcessor.getDefaultCNESSTData());
    }
    setActiveTab("dashboard");
  };

  const loadExampleData = () => {
    setConfiguration(exampleConfiguration);
    setCnessData(CNESSTDataProcessor.getDefaultCNESSTData());
    setActiveTab("dashboard");
  };

  const handleCNESSTDataParsed = (data: CNESSTMetadata) => {
    setCnessData(data);
    console.log("Données CNESST intégrées:", data);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-sst-blue flex items-center gap-2">
          <BarChart3 className="w-8 h-8" />
          Générateur de KPI et Mapping des Risques SSE
        </h1>
        <p className="text-gray-600 mt-1">
          Système intelligent de génération automatique conforme CNESST avec moteur prédictif IA
        </p>
      </div>

      {/* CNESST Integration Status */}
      {cnessData && (
        <Card className="mb-6 border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-purple-800">Métadonnées CNESST Intégrées</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{cnessData.lesionsSecorielles.length} secteurs</Badge>
                  <Badge variant="outline">{cnessData.agentCausals.length} agents causals</Badge>
                  <Badge variant="outline">{cnessData.siegesLesions.length} sièges lésions</Badge>
                  <Badge variant="outline">Qualité: {(cnessData.validationStatus.dataQualityScore * 100).toFixed(0)}%</Badge>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setActiveTab("cnesst-upload")}
              >
                <Upload className="w-4 h-4 mr-2" />
                Gérer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions si pas de configuration */}
      {!configuration && (
        <Card className="mb-6 border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-800 mb-2">Pour commencer</h3>
                <p className="text-sm text-blue-600 mb-3">
                  Configurez d'abord les paramètres de votre établissement dans l'onglet "Configuration" 
                  pour activer le tableau de bord et les outils de mapping des risques.
                </p>
                <Button onClick={loadExampleData} variant="outline" size="sm">
                  Ou charger un exemple de démonstration avec données CNESST
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Status */}
      {configuration && (
        <Card className="mb-6 border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-green-800">Configuration Active</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{configuration.secteur}</Badge>
                  <Badge variant="outline">Groupe {configuration.groupePrioritaire}</Badge>
                  <Badge variant="outline">{configuration.tailleEtablissement} employés</Badge>
                  <Badge variant="outline">{configuration.activitesPrincipales.length} activités</Badge>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setActiveTab("config")}
              >
                <Settings className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="cnesst-upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Données CNESST
          </TabsTrigger>
          <TabsTrigger 
            value="dashboard" 
            disabled={!configuration}
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Tableau de Bord
          </TabsTrigger>
          <TabsTrigger 
            value="cnesst-dashboard" 
            disabled={!configuration || !cnessData}
            className="flex items-center gap-2"
          >
            <Brain className="w-4 h-4" />
            Dashboard CNESST
          </TabsTrigger>
          <TabsTrigger 
            value="predictive" 
            className="flex items-center gap-2"
          >
            <Brain className="w-4 h-4" />
            Moteur Prédictif IA
          </TabsTrigger>
          <TabsTrigger 
            value="matrix" 
            disabled={!configuration}
            className="flex items-center gap-2"
          >
            <Target className="w-4 h-4" />
            Matrice Risques
          </TabsTrigger>
          <TabsTrigger 
            value="heatmap" 
            disabled={!configuration}
            className="flex items-center gap-2"
          >
            <Map className="w-4 h-4" />
            Carte de Chaleur
          </TabsTrigger>
          <TabsTrigger 
            value="calculator" 
            disabled={!configuration}
            className="flex items-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            Calculateur KPI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <KPIConfiguration onConfigurationComplete={handleConfigurationComplete} />
        </TabsContent>

        <TabsContent value="cnesst-upload">
          <CNESSTDataUploader 
            onDataParsed={handleCNESSTDataParsed}
            supportedFormats={['csv', 'xlsx', 'json']}
            maxFileSize={50 * 1024 * 1024}
          />
        </TabsContent>

        <TabsContent value="dashboard">
          {configuration && <KPIDashboard configuration={configuration} />}
        </TabsContent>

        <TabsContent value="cnesst-dashboard">
          {configuration && cnessData && (
            <CNESSTIntegrationDashboard 
              etablissementData={configuration}
              cnessMetadata={cnessData}
            />
          )}
        </TabsContent>

        <TabsContent value="predictive">
          <PredictiveEngine cnessData={cnessData} />
        </TabsContent>

        <TabsContent value="matrix">
          {configuration && <RiskMatrix risks={[]} />}
        </TabsContent>

        <TabsContent value="heatmap">
          {configuration && <RiskHeatmap configuration={configuration} />}
        </TabsContent>

        <TabsContent value="calculator">
          {configuration && <KPICalculator configuration={configuration} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KPIGenerator;
