import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RiskMatrix } from "@/components/RiskMatrix";
import { RiskAnalytics } from "@/components/RiskAnalytics";
import { RiskTable } from "@/components/RiskTable";
import { PredictiveAlerts } from "@/components/PredictiveAlerts";
import { PreventiveActions } from "@/components/PreventiveActions";
import { RolesResponsibilities } from "@/components/RolesResponsibilities";
import { AddRiskModal } from "@/components/AddRiskModal";
import { ExportActions } from "@/components/ExportActions";
import { AlertTriangle, Filter, Users, Target, BarChart3 } from "lucide-react";

const mockRisks = [
  {
    id: "RC4-001",
    name: "Chute d'objets depuis grue mobile 30T",
    phase: "Démolition",
    category: "Équipements de levage",
    probability: 4,
    gravity: 5,
    initialRisk: 20,
    measures: "Balisage zone de sécurité + attestation de conformité équipements + formation opérateur",
    residualRisk: 8,
    status: "Contrôles actifs",
    responsible: "Chef de chantier",
    sector: "Construction"
  },
  {
    id: "RC8-002",
    name: "Effondrement échafaudage façade est",
    phase: "Construction",
    category: "Chute (CSTC)",
    probability: 2,
    gravity: 5,
    initialRisk: 10,
    measures: "Inspection quotidienne + ancrage renforcé tous les 3m + garde-corps certifiés",
    residualRisk: 4,
    status: "En surveillance",
    responsible: "Responsable SST",
    sector: "Construction"
  },
  {
    id: "EL3-003",
    name: "Contact électrique direct - armoire TGBT",
    phase: "Installation",
    category: "Électricité (CSTC)",
    probability: 3,
    gravity: 4,
    initialRisk: 12,
    measures: "Consignation + vérification VAT + signalisation danger électrique",
    residualRisk: 6,
    status: "Action requise",
    responsible: "Électricien chef d'équipe",
    sector: "Électricité"
  },
  {
    id: "CH2-004",
    name: "Chute de hauteur lors travaux de couverture",
    phase: "Réfection toiture",
    category: "Chute (CSTC)",
    probability: 3,
    gravity: 5,
    initialRisk: 15,
    measures: "Harnais antichute + ligne de vie temporaire + filets de sécurité",
    residualRisk: 6,
    status: "Complété",
    responsible: "Chef d'équipe couvreurs",
    sector: "Construction"
  },
  {
    id: "IN1-005",
    name: "Risque d'explosion - stockage carburants",
    phase: "Démolition",
    category: "Incendies et explosions",
    probability: 1,
    gravity: 5,
    initialRisk: 5,
    measures: "Détection gaz + ventilation forcée + extincteurs CO2",
    residualRisk: 2,
    status: "En contrôle",
    responsible: "Responsable HSE",
    sector: "Sécurité"
  },
  {
    id: "EX6-006",
    name: "Exposition poussières d'amiante - sous-sol",
    phase: "Désamiantage",
    category: "Autres risques professionnels",
    probability: 4,
    gravity: 4,
    initialRisk: 16,
    measures: "Confinement étanche + EPI filtrants P3 + surveillance atmosphérique",
    residualRisk: 4,
    status: "Contrôles actifs",
    responsible: "Entreprise spécialisée",
    sector: "Santé"
  },
  {
    id: "CR7-007",
    name: "Éboulement tranchée - réseaux enterrés",
    phase: "Terrassement",
    category: "Creusement, excavation",
    probability: 3,
    gravity: 4,
    initialRisk: 12,
    measures: "Blindage tranchée + détection réseaux + pente sécurisée 45°",
    residualRisk: 6,
    status: "En surveillance",
    responsible: "Chef équipe terrassement",
    sector: "Construction"
  },
  {
    id: "EL8-008",
    name: "Électrocution par ligne HT aérienne",
    phase: "Gros œuvre",
    category: "Électricité (CSTC)",
    probability: 2,
    gravity: 5,
    initialRisk: 10,
    measures: "Distance sécurité 5m + signalisation + formation sensibilisation",
    residualRisk: 5,
    status: "Complété",
    responsible: "Conducteur de travaux",
    sector: "Électricité"
  },
  {
    id: "CH9-009",
    name: "Chute dans ouverture dalle - cage ascenseur",
    phase: "Structure",
    category: "Chute (CSTC)",
    probability: 3,
    gravity: 5,
    initialRisk: 15,
    measures: "Protections collectives + garde-corps périphériques + filets horizontaux",
    residualRisk: 6,
    status: "Action requise",
    responsible: "Maître d'œuvre",
    sector: "Construction"
  },
  {
    id: "LE10-010",
    name: "Renversement grue auxiliaire - sol instable",
    phase: "Montage structure",
    category: "Équipements de levage",
    probability: 2,
    gravity: 4,
    initialRisk: 8,
    measures: "Étude géotechnique + plateforme stabilisée + vérins calage",
    residualRisk: 4,
    status: "En contrôle",
    responsible: "Grutier certifié",
    sector: "Construction"
  },
  {
    id: "IN11-011",
    name: "Incendie local produits chimiques",
    phase: "Finitions",
    category: "Incendies et explosions",
    probability: 2,
    gravity: 4,
    initialRisk: 8,
    measures: "Stockage ventilé + FDS affichées + extincteurs poudre ABC",
    residualRisk: 4,
    status: "Complété",
    responsible: "Responsable matériaux",
    sector: "Sécurité"
  },
  {
    id: "EX12-012",
    name: "Exposition bruit - marteaux piqueurs",
    phase: "Démolition",
    category: "Autres risques professionnels",
    probability: 4,
    gravity: 2,
    initialRisk: 8,
    measures: "EPI auditifs + rotation équipes + silencieux outils",
    residualRisk: 4,
    status: "En surveillance",
    responsible: "Chef d'équipe démolition",
    sector: "Santé"
  },
  {
    id: "CR13-013",
    name: "Effondrement paroi moulée - nappe phréatique",
    phase: "Fondations",
    category: "Creusement, excavation",
    probability: 2,
    gravity: 5,
    initialRisk: 10,
    measures: "Pompage rabattement + monitoring géotechnique + berlinoise",
    residualRisk: 5,
    status: "Contrôles actifs",
    responsible: "Bureau d'études géotech",
    sector: "Construction"
  },
  {
    id: "EL14-014",
    name: "Court-circuit armoire électrique chantier",
    phase: "Installation",
    category: "Électricité (CSTC)",
    probability: 3,
    gravity: 3,
    initialRisk: 9,
    measures: "Disjoncteurs différentiels + vérifications périodiques + formation",
    residualRisk: 3,
    status: "En contrôle",
    responsible: "Électricien qualifié",
    sector: "Électricité"
  },
  {
    id: "LE15-015",
    name: "Collision engins de chantier - zone aveugle",
    phase: "Terrassement",
    category: "Équipements de levage",
    probability: 3,
    gravity: 4,
    initialRisk: 12,
    measures: "Avertisseurs sonores + gyrophares + plan de circulation",
    residualRisk: 6,
    status: "Action requise",
    responsible: "Chef de chantier",
    sector: "Construction"
  }
];

const RiskRegistry = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const summaryData = {
    totalRisks: 225,
    criticalRisks: 8,
    averageIndex: 11.22,
    residualIndex: 8.18
  };

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
            <p className="text-gray-600 mt-1">Gestion dynamique et prédictive des risques SST</p>
          </div>
          <div className="flex gap-2">
            <ExportActions 
              data={mockRisks} 
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
      </div>

      {/* Tabs Navigation */}
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
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-12 gap-6 mb-6">
            {/* Risk Matrix - Left Column */}
            <div className="col-span-5">
              <RiskMatrix risks={mockRisks} />
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
          <RiskTable risks={mockRisks} searchTerm={searchTerm} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RiskRegistry;
