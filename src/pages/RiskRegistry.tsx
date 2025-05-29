import { useState, useMemo, useEffect } from "react";
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
import { ExportActions } from "@/components/ExportActions";
import { AlertTriangle, Filter, Users, Target, BarChart3, Loader2 } from "lucide-react";

// Imports pour Supabase
import { Risk } from "@/types/risk";
import { riskService } from "@/services/riskService";
import { calculateRiskSummary, filterRisksBySearch } from "@/utils/riskCalculations";

const RiskRegistry = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les risques depuis Supabase
  useEffect(() => {
    const loadRisks = async () => {
      try {
        setLoading(true);
        const data = await riskService.getAllRisks();
        setRisks(data);
      } catch (err) {
        setError('Erreur lors du chargement des risques');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadRisks();
  }, []);

  // Filtrage des risques basé sur la recherche
  const filteredRisks = useMemo(
    () => filterRisksBySearch(risks, searchTerm),
    [risks, searchTerm]
  );

  // Calcul dynamique du résumé des risques
  const summaryData = useMemo(
    () => calculateRiskSummary(filteredRisks),
    [filteredRisks]
  );

  // Affichage pendant le chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Chargement des risques...</span>
        </div>
      </div>
    );
  }

  // Affichage en cas d'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
          <p className="text-lg font-semibold">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-sst-blue flex items-center gap-2">
              <AlertTriangle className="w-8 h-8" />
              PPAI - Registre des risques
            </h1>
            <p className="text-gray-600 mt-1">
              Gestion dynamique et prédictive des risques SST
              {risks.length > 0 && (
                <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {risks.length} risques chargés depuis Supabase
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <ExportActions 
              data={filteredRisks} 
              filename="registre-risques-sst" 
              type="risks"
            />
            <AddRiskModal />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-sst-blue">{summaryData.totalRisks}</div>
              <div className="text-sm text-gray-600">Total des risques</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{summaryData.criticalRisks}</div>
              <div className="text-sm text-gray-600">Risques critiques</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{summaryData.averageIndex}</div>
              <div className="text-sm text-gray-600">Indice moyen</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{summaryData.residualIndex}</div>
              <div className="text-sm text-gray-600">Risque résiduel</div>
            </CardContent>
          </Card>
        </div>

        {/* Message si aucun risque */}
        {risks.length === 0 && (
          <Card className="mb-6">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Aucun risque enregistré</h3>
              <p className="text-gray-600 mb-4">
                Commencez par ajouter des risques à votre registre pour voir les analyses.
              </p>
              <AddRiskModal />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs Navigation - Affichage conditionnel */}
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
              <Filter className="w-4 h-4" />
              Tableau détaillé
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Filters and Search */}
            <div className="flex flex-wrap gap-4 mb-4">
              <Input
                placeholder="Rechercher un risque..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filtres avancés
              </Button>
              {searchTerm && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{filteredRisks.length} résultat(s) trouvé(s)</span>
                  {filteredRisks.length !== risks.length && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSearchTerm("")}
                    >
                      Effacer
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-12 gap-6 mb-6">
              {/* Risk Matrix - Left Column */}
              <div className="col-span-5">
                <RiskMatrix risks={filteredRisks} />
              </div>

              {/* Analytics - Right Column */}
              <div className="col-span-7">
                <RiskAnalytics />
              </div>
            </div>

            {/* Predictive Alerts */}
            <PredictiveAlerts />
          </TabsContent>

          <TabsContent value="actions">
            <PreventiveActions />
          </TabsContent>

          <TabsContent value="responsibilities">
            <RolesResponsibilities />
          </TabsContent>

          <TabsContent value="table">
            <RiskTable risks={filteredRisks} searchTerm={searchTerm} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default RiskRegistry;