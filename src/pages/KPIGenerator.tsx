
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KPIConfiguration } from "@/components/KPIConfiguration";
import { KPIDashboard } from "@/components/KPIDashboard";
import { RiskMatrix } from "@/components/RiskMatrix";
import { RiskHeatmap } from "@/components/RiskHeatmap";
import { KPICalculator } from "@/components/KPICalculator";
import { BarChart3, Target, Settings, Map, Calculator } from "lucide-react";

interface ConfigurationData {
  secteur: string;
  tailleEtablissement: string;
  groupePrioritaire: number;
  activitesPrincipales: string[];
}

const KPIGenerator = () => {
  const [configuration, setConfiguration] = useState<ConfigurationData | null>(null);
  const [activeTab, setActiveTab] = useState("config");

  const handleConfigurationComplete = (config: ConfigurationData) => {
    setConfiguration(config);
    setActiveTab("dashboard");
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
          Système intelligent de génération automatique conforme CNESST
        </p>
      </div>

      {/* Configuration Status */}
      {configuration && (
        <Card className="mb-6 border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-green-800">Configuration Active</h3>
                <p className="text-sm text-green-600">
                  {configuration.secteur} - Groupe {configuration.groupePrioritaire} - {configuration.tailleEtablissement}
                </p>
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuration
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

        <TabsContent value="dashboard">
          {configuration && <KPIDashboard configuration={configuration} />}
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
