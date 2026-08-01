import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RiskMatrix } from "@/components/RiskMatrix";
import { RiskAnalytics } from "@/components/RiskAnalytics";
import { RiskTable } from "@/components/RiskTable";
import { PredictiveAlerts } from "@/components/PredictiveAlerts";
import { PreventiveActions } from "@/components/PreventiveActions";
import { RolesResponsibilities } from "@/components/RolesResponsibilities";
import { AddRiskModal } from "@/components/AddRiskModal";
import { ProposerRisquesSecteur } from "@/components/ProposerRisquesSecteur";
import { ExportActions } from "@/components/ExportActions";
import { BackendModeBadge } from "@/components/BackendModeBadge";
import { AlertTriangle, Users, Target, BarChart3, Loader2, Plus, RotateCcw } from "lucide-react";

import { useRisks, useRiskMutations, useBackendMode } from "@/hooks/useRisks";
import { calculateRiskSummary, filterRisksBySearch } from "@/utils/riskCalculations";

const RiskRegistry = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: risks = [], isLoading, isError, error, refetch } = useRisks();
  const { data: backendMode } = useBackendMode();
  const { createRisk, updateRisk, deleteRisk, importRisks, resetDemoRegistry } = useRiskMutations();

  const filteredRisks = useMemo(
    () => filterRisksBySearch(risks, searchTerm),
    [risks, searchTerm]
  );

  const summaryData = useMemo(
    () => calculateRiskSummary(filteredRisks),
    [filteredRisks]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Chargement des risques...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
          <p className="text-lg font-semibold">Erreur lors du chargement des risques</p>
          <p className="text-sm text-gray-600 mt-2">
            {error instanceof Error ? error.message : "Erreur inconnue"}
          </p>
          <Button onClick={() => refetch()} className="mt-4">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  const addRiskTrigger = (
    <div className="flex flex-wrap gap-2">
      {/* Les propositions sectorielles arrivent en lot : `importRisks` évite
          une requête par risque adopté. */}
      <ProposerRisquesSecteur onAdopter={(risques) => importRisks.mutateAsync(risques)} />
      <AddRiskModal onSave={(input) => createRisk.mutateAsync(input)} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-sst-blue flex items-center gap-2">
              <AlertTriangle className="w-8 h-8" />
              PPAI - Registre des risques
            </h1>
            <div className="text-gray-600 mt-1 flex items-center gap-2 flex-wrap">
              Gestion dynamique et prédictive des risques SST
              <BackendModeBadge />
              {risks.length > 0 && (
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {risks.length} risque(s) au registre
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {backendMode === "demo" && risks.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => resetDemoRegistry.mutate()}
                disabled={resetDemoRegistry.isPending}
                title="Restaure le registre de démonstration d'origine"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Réinitialiser
              </Button>
            )}
            <ExportActions
              data={filteredRisks}
              filename="registre-risques-sst"
              type="risks"
            />
            {addRiskTrigger}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-sst-blue">{summaryData.totalRisks}</div>
              <div className="text-sm text-gray-600">Total des risques</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{summaryData.criticalRisks}</div>
              <div className="text-sm text-gray-600">Risques critiques (indice ≥ 15)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{summaryData.averageIndex}</div>
              <div className="text-sm text-gray-600">Indice initial moyen</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{summaryData.residualIndex}</div>
              <div className="text-sm text-gray-600">Indice résiduel moyen</div>
            </CardContent>
          </Card>
        </div>

        {risks.length === 0 && (
          <Card className="mb-6">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Aucun risque enregistré</h3>
              <p className="text-gray-600 mb-4">
                Commencez par ajouter des risques à votre registre pour voir les analyses.
              </p>
              <div className="flex justify-center">{addRiskTrigger}</div>
            </CardContent>
          </Card>
        )}
      </div>

      {risks.length > 0 && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Actions préventives
            </TabsTrigger>
            <TabsTrigger value="responsibilities" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Rôles & Responsabilités
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Tableau détaillé
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="flex flex-wrap gap-4 mb-4 items-center">
              <Input
                placeholder="Rechercher un risque..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              {searchTerm && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{filteredRisks.length} résultat(s) trouvé(s)</span>
                  {filteredRisks.length !== risks.length && (
                    <Button variant="ghost" size="sm" onClick={() => setSearchTerm("")}>
                      Effacer
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">
              <div className="xl:col-span-5">
                <RiskMatrix risks={filteredRisks} />
              </div>
              <div className="xl:col-span-7">
                <RiskAnalytics risks={filteredRisks} />
              </div>
            </div>

            <PredictiveAlerts
              risks={risks}
              addRiskSlot={
                <AddRiskModal
                  onSave={(input) => createRisk.mutateAsync(input)}
                  trigger={
                    <Button variant="outline" className="p-4 h-auto flex-col gap-2">
                      <Plus className="w-5 h-5" />
                      <span className="text-xs text-center leading-tight">
                        Ajouter un nouveau risque
                      </span>
                    </Button>
                  }
                />
              }
            />
          </TabsContent>

          <TabsContent value="actions">
            <PreventiveActions risks={risks} />
          </TabsContent>

          <TabsContent value="responsibilities">
            <RolesResponsibilities risks={risks} />
          </TabsContent>

          <TabsContent value="table">
            <div className="mb-4">
              <Input
                placeholder="Rechercher un risque..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <RiskTable
              risks={risks}
              searchTerm={searchTerm}
              onUpdate={(code, changes) => updateRisk.mutateAsync({ code, changes })}
              onDelete={(code) => deleteRisk.mutateAsync(code)}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default RiskRegistry;
