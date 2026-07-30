import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Wand2, FileText, Database, Zap, Info, Archive } from "lucide-react";
import { PrototypeGenerator } from "@/components/PrototypeGenerator";
import { SectorRiskImporter } from "@/components/SectorRiskImporter";
import { RiskRegistryIntegration } from "@/components/RiskRegistryIntegration";
import { SavedProgramsList } from "@/components/SavedProgramsList";
import { BackendModeBadge } from "@/components/BackendModeBadge";
import { useRisks } from "@/hooks/useRisks";
import { Risk, RiskSector, RiskStatus } from "@/types/risk";

/** Forme des risques produits par l'importateur sectoriel. */
interface SectorRiskLike {
  id: string;
  sector: string;
  criticalDanger: string;
  description: string;
  probability: number;
  gravity: number;
  initialRisk: number;
  controlMeasures: string;
  residualRisk: number;
  status: string;
  responsible: string;
}

const VALID_STATUSES: RiskStatus[] = [
  "Contrôles actifs",
  "En surveillance",
  "Action requise",
  "Complété",
  "En contrôle"
];

/** Rattache un libellé sectoriel libre à l'un des secteurs du registre. */
const toRiskSector = (value: string): RiskSector => {
  const text = value.toLowerCase();
  if (/électri|electri|énergie|energie|tension/.test(text)) return "Électricité";
  if (/santé|sante|hygiène|hygiene|médic|medic|exposition/.test(text)) return "Santé";
  if (/construction|chantier|bâtiment|batiment/.test(text)) return "Construction";
  return "Sécurité";
};

/**
 * Convertit un risque sectoriel importé vers le modèle du registre, afin que
 * les deux sources alimentent le générateur de façon homogène.
 */
const fromSectorRisk = (risk: SectorRiskLike): Risk => ({
  id: risk.id,
  name: risk.description || risk.criticalDanger,
  phase: "",
  category: risk.criticalDanger,
  probability: risk.probability,
  gravity: risk.gravity,
  initialRisk: risk.initialRisk ?? risk.probability * risk.gravity,
  measures: risk.controlMeasures,
  residualRisk: risk.residualRisk,
  status: VALID_STATUSES.includes(risk.status as RiskStatus)
    ? (risk.status as RiskStatus)
    : "En surveillance",
  responsible: risk.responsible,
  sector: toRiskSector(`${risk.sector} ${risk.criticalDanger}`)
});

const Programs = () => {
  const [selectedGroup, setSelectedGroup] = useState("1");
  const [importedRisks, setImportedRisks] = useState<Risk[]>([]);
  const [useRiskRegistry, setUseRiskRegistry] = useState(true);
  const [selectedRegistryRisks, setSelectedRegistryRisks] = useState<Risk[]>([]);

  // Le registre réel est la source par défaut ; les risques sectoriels importés
  // viennent s'y ajouter. Auparavant cette liste restait vide, si bien que
  // l'intégration « registre » ne transmettait jamais aucun risque.
  const { data: registeredRisks = [] } = useRisks();

  const registryRisks = useMemo(
    () => [...registeredRisks, ...importedRisks],
    [registeredRisks, importedRisks]
  );

  // Par défaut, tout le registre est retenu pour la génération : la démo
  // fonctionne sans sélection manuelle préalable.
  useEffect(() => {
    setSelectedRegistryRisks(registryRisks);
  }, [registryRisks]);

  const handleRisksImported = (risks: SectorRiskLike[]) => {
    setImportedRisks(risks.map(fromSectorRisk));
  };

  const handleRisksSelected = (risks: Risk[]) => {
    setSelectedRegistryRisks(risks);
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
          <p className="text-gray-600 mt-1 flex items-center gap-2 flex-wrap">
            Génération intelligente de programmes de prévention avec intégration du registre des risques
            <BackendModeBadge />
          </p>
        </div>

        {/* Configuration globale */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              Configuration avancée
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h4 className="font-medium">Intégration du registre des risques</h4>
                <p className="text-sm text-gray-600">
                  Utiliser les données du registre pour personnaliser les programmes générés
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={useRiskRegistry} onCheckedChange={setUseRiskRegistry} />
                {useRiskRegistry && registryRisks.length > 0 && (
                  <Badge className="bg-green-100 text-green-800">
                    <Zap className="w-3 h-3 mr-1" />
                    {registryRisks.length} risque(s) disponible(s)
                  </Badge>
                )}
              </div>
            </div>

            {useRiskRegistry && (
              <Alert>
                <Info className="w-4 h-4" />
                <AlertDescription>
                  {selectedRegistryRisks.length} risque(s) seront transmis au générateur, dont{" "}
                  {selectedRegistryRisks.filter(risk => risk.initialRisk >= 15).length} critique(s).
                  Les risques critiques sont priorisés dans l'échéancier et rattachés à la hiérarchie
                  de prévention de l'article 51 de la LSST.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="generator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Générateur
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Archive className="w-4 h-4" />
              Programmes enregistrés
            </TabsTrigger>
            <TabsTrigger value="sector-risks" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Risques sectoriels
            </TabsTrigger>
            <TabsTrigger value="registry-integration" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Intégration registre
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generator">
            <PrototypeGenerator
              selectedGroup={selectedGroup}
              registryRisks={useRiskRegistry ? selectedRegistryRisks : undefined}
            />
          </TabsContent>

          <TabsContent value="saved">
            <SavedProgramsList />
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
