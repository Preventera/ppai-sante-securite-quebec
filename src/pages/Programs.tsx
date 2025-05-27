
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Wand2, FileText, Database, Zap, Info } from "lucide-react";
import { PrototypeGenerator } from "@/components/PrototypeGenerator";
import { SectorRiskImporter } from "@/components/SectorRiskImporter";
import { RiskRegistryIntegration } from "@/components/RiskRegistryIntegration";

const Programs = () => {
  const [selectedGroup, setSelectedGroup] = useState("1");
  const [registryRisks, setRegistryRisks] = useState([]);
  const [useRiskRegistry, setUseRiskRegistry] = useState(false);
  const [selectedRegistryRisks, setSelectedRegistryRisks] = useState([]);

  const handleRisksImported = (risks) => {
    setRegistryRisks(risks);
    console.log('Risques sectoriels importés:', risks.length);
  };

  const handleRisksSelected = (risks) => {
    setSelectedRegistryRisks(risks);
    console.log('Risques sélectionnés pour génération:', risks.length);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-sst-blue flex items-center gap-2">
            <Wand2 className="w-8 h-8" />
            PPAI - Générateur de Programmes SST
          </h1>
          <p className="text-gray-600 mt-1">
            Génération intelligente de programmes de prévention avec intégration du registre des risques
          </p>
        </div>

        {/* Configuration globale */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              Configuration Avancée
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Intégration Registre des Risques</h4>
                <p className="text-sm text-gray-600">
                  Utiliser les données du registre pour personnaliser les programmes générés
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={useRiskRegistry}
                  onCheckedChange={setUseRiskRegistry}
                />
                {useRiskRegistry && registryRisks.length > 0 && (
                  <Badge className="bg-green-100 text-green-800">
                    <Zap className="w-3 h-3 mr-1" />
                    {registryRisks.length} risques disponibles
                  </Badge>
                )}
              </div>
            </div>

            {useRiskRegistry && (
              <Alert>
                <Info className="w-4 h-4" />
                <AlertDescription>
                  Avec l'intégration activée, l'IA Claude analysera vos risques réels pour générer des programmes 
                  spécifiquement adaptés à votre contexte. Les risques critiques seront automatiquement priorisés.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="generator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Générateur de Programmes
            </TabsTrigger>
            <TabsTrigger value="sector-risks" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Risques Sectoriels
            </TabsTrigger>
            <TabsTrigger value="registry-integration" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Intégration Registre
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generator">
            <PrototypeGenerator 
              selectedGroup={selectedGroup}
              registryRisks={useRiskRegistry ? selectedRegistryRisks : undefined}
            />
          </TabsContent>

          <TabsContent value="sector-risks">
            <SectorRiskImporter onRisksImported={handleRisksImported} />
          </TabsContent>

          <TabsContent value="registry-integration">
            <RiskRegistryIntegration
              risks={registryRisks}
              onRisksSelected={handleRisksSelected}
              isEnabled={useRiskRegistry}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Programs;
