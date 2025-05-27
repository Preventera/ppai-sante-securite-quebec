
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, AlertTriangle, CheckCircle, TrendingUp, Eye, BarChart } from "lucide-react";

interface RiskData {
  id: string;
  name?: string;
  description?: string;
  category?: string;
  probability: number;
  gravity: number;
  initialRisk: number;
  measures?: string;
  controlMeasures?: string;
  residualRisk: number;
  status: string;
  responsible?: string;
  criticalDanger?: string;
  controlEffectiveness?: number;
}

interface RiskRegistryIntegrationProps {
  risks: RiskData[];
  onRisksSelected: (selectedRisks: RiskData[]) => void;
  isEnabled: boolean;
}

export function RiskRegistryIntegration({ risks, onRisksSelected, isEnabled }: RiskRegistryIntegrationProps) {
  const [selectedRisks, setSelectedRisks] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (isEnabled) {
      // Auto-sélectionner les risques critiques
      const criticalRisks = risks.filter(r => r.initialRisk >= 15);
      const criticalIds = criticalRisks.map(r => r.id);
      setSelectedRisks(criticalIds);
      onRisksSelected(criticalRisks);
    }
  }, [risks, isEnabled, onRisksSelected]);

  const handleRiskToggle = (riskId: string) => {
    const newSelected = selectedRisks.includes(riskId)
      ? selectedRisks.filter(id => id !== riskId)
      : [...selectedRisks, riskId];
    
    setSelectedRisks(newSelected);
    const selectedRiskObjects = risks.filter(r => newSelected.includes(r.id));
    onRisksSelected(selectedRiskObjects);
  };

  const getRiskLevel = (risk: number) => {
    if (risk >= 15) return { level: "Critique", color: "bg-red-100 text-red-800" };
    if (risk >= 10) return { level: "Élevé", color: "bg-orange-100 text-orange-800" };
    if (risk >= 5) return { level: "Modéré", color: "bg-yellow-100 text-yellow-800" };
    return { level: "Faible", color: "bg-green-100 text-green-800" };
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "contrôlé": case "contrôles actifs": case "complété":
        return "bg-green-100 text-green-800";
      case "en surveillance": case "action requise":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const criticalRisks = risks.filter(r => r.initialRisk >= 15);
  const highRisks = risks.filter(r => r.initialRisk >= 10 && r.initialRisk < 15);
  const moderateRisks = risks.filter(r => r.initialRisk >= 5 && r.initialRisk < 10);
  const selectedRiskObjects = risks.filter(r => selectedRisks.includes(r.id));

  if (!isEnabled) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Intégration du Registre des Risques
          </h3>
          <p className="text-gray-600 mb-4">
            Activez cette option pour personnaliser vos programmes avec les risques réels de votre registre SST
          </p>
          <p className="text-sm text-gray-500">
            Cette fonctionnalité permet de générer des programmes spécifiquement adaptés à vos risques identifiés
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Intégration Registre des Risques SST
        </CardTitle>
        <p className="text-sm text-gray-600">
          {risks.length} risques disponibles - {selectedRisks.length} sélectionnés pour la génération
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">📊 Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="selection">✅ Sélection</TabsTrigger>
            <TabsTrigger value="analysis">🔍 Analyse</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{criticalRisks.length}</div>
                  <div className="text-sm text-gray-600">Critiques (≥15)</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{highRisks.length}</div>
                  <div className="text-sm text-gray-600">Élevés (10-14)</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{moderateRisks.length}</div>
                  <div className="text-sm text-gray-600">Modérés (5-9)</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{selectedRisks.length}</div>
                  <div className="text-sm text-gray-600">Sélectionnés</div>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>
                <strong>Auto-sélection intelligente activée:</strong> Les risques critiques (≥15) sont automatiquement sélectionnés pour assurer une couverture optimale dans vos programmes de prévention.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h4 className="font-medium">Risques par niveau de criticité</h4>
              {criticalRisks.length > 0 && (
                <div>
                  <Badge className="bg-red-100 text-red-800 mb-2">Critiques ({criticalRisks.length})</Badge>
                  <div className="grid gap-2">
                    {criticalRisks.slice(0, 3).map((risk) => (
                      <div key={risk.id} className="text-sm p-2 bg-red-50 rounded border-l-4 border-red-500">
                        <div className="font-medium">{risk.name || risk.description}</div>
                        <div className="text-gray-600">P×G: {risk.initialRisk} | {risk.status}</div>
                      </div>
                    ))}
                    {criticalRisks.length > 3 && (
                      <div className="text-sm text-gray-500">
                        ... et {criticalRisks.length - 3} autre(s) risque(s) critique(s)
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="selection" className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Sélectionner les risques à intégrer</h4>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    const allIds = risks.map(r => r.id);
                    setSelectedRisks(allIds);
                    onRisksSelected(risks);
                  }}
                  variant="outline" 
                  size="sm"
                >
                  Tout sélectionner
                </Button>
                <Button 
                  onClick={() => {
                    setSelectedRisks([]);
                    onRisksSelected([]);
                  }}
                  variant="outline" 
                  size="sm"
                >
                  Désélectionner
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {risks.map((risk) => {
                const riskLevel = getRiskLevel(risk.initialRisk);
                return (
                  <Card 
                    key={risk.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedRisks.includes(risk.id) ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleRiskToggle(risk.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedRisks.includes(risk.id)}
                            onChange={() => handleRiskToggle(risk.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{risk.name || risk.description}</span>
                              <Badge className={riskLevel.color}>{riskLevel.level}</Badge>
                              {risk.criticalDanger && (
                                <Badge variant="outline">{risk.criticalDanger}</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mb-1">
                              P×G: {risk.initialRisk} | Résiduel: {risk.residualRisk}
                            </div>
                            {(risk.measures || risk.controlMeasures) && (
                              <div className="text-xs text-gray-500">
                                <strong>Contrôles:</strong> {(risk.measures || risk.controlMeasures)?.substring(0, 100)}...
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(risk.status)}>
                            {risk.status}
                          </Badge>
                          {risk.controlEffectiveness && (
                            <div className="text-xs text-gray-600 mt-1">
                              Efficacité: {risk.controlEffectiveness}%
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Impact sur la génération</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Risques intégrés:</span>
                    <Badge>{selectedRiskObjects.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Priorité critique:</span>
                    <Badge className="bg-red-100 text-red-800">
                      {selectedRiskObjects.filter(r => r.initialRisk >= 15).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Mesures existantes:</span>
                    <Badge className="bg-green-100 text-green-800">
                      {selectedRiskObjects.filter(r => r.controlMeasures || r.measures).length}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Qualité des données</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Complétude:</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {Math.round((selectedRiskObjects.filter(r => r.controlMeasures || r.measures).length / Math.max(selectedRiskObjects.length, 1)) * 100)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Contrôles efficaces:</span>
                    <Badge className="bg-green-100 text-green-800">
                      {selectedRiskObjects.filter(r => r.controlEffectiveness && r.controlEffectiveness >= 80).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">En surveillance:</span>
                    <Badge className="bg-orange-100 text-orange-800">
                      {selectedRiskObjects.filter(r => r.status.toLowerCase().includes('surveillance')).length}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {selectedRiskObjects.length > 0 && (
              <Alert>
                <TrendingUp className="w-4 h-4" />
                <AlertDescription>
                  <strong>Analyse prédictive:</strong> Avec {selectedRiskObjects.length} risques intégrés, vos programmes seront personnalisés pour adresser spécifiquement vos enjeux prioritaires. 
                  L'IA Claude prendra en compte vos mesures existantes et proposera des améliorations ciblées.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
