
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RiskMatrix } from "@/components/RiskMatrix";
import { RiskAnalytics } from "@/components/RiskAnalytics";
import { RiskTable } from "@/components/RiskTable";
import { PredictiveAlerts } from "@/components/PredictiveAlerts";
import { Download, Filter, Plus, AlertTriangle } from "lucide-react";

const mockRisks = [
  {
    id: "RC4-001",
    name: "Chute d'objets depuis grue mobile",
    phase: "Démolition",
    category: "Opérations de levage",
    probability: 4,
    gravity: 5,
    initialRisk: 20,
    measures: "Balisage zone + attestation équipements",
    residualRisk: 8,
    status: "Contrôles actifs",
    responsible: "Chef de chantier",
    sector: "Construction"
  },
  {
    id: "RC8-002",
    name: "Effondrement échafaudage",
    phase: "Construction",
    category: "Objets instables",
    probability: 2,
    gravity: 5,
    initialRisk: 10,
    measures: "Inspection quotidienne + ancrage renforcé",
    residualRisk: 4,
    status: "En surveillance",
    responsible: "Responsable SST",
    sector: "Construction"
  },
  {
    id: "EL3-003",
    name: "Contact électrique direct",
    phase: "Installation",
    category: "Électricité (CSTC)",
    probability: 3,
    gravity: 4,
    initialRisk: 12,
    measures: "Consignation + vérification VAT",
    residualRisk: 6,
    status: "Action requise",
    responsible: "Électricien chef",
    sector: "Électricité"
  },
  {
    id: "CH2-004",
    name: "Chute de hauteur",
    phase: "Réfection",
    category: "Chute (CSTC)",
    probability: 3,
    gravity: 5,
    initialRisk: 15,
    measures: "Harnais + ligne de vie",
    residualRisk: 6,
    status: "Complété",
    responsible: "Chef d'équipe",
    sector: "Construction"
  },
  {
    id: "IN1-005",
    name: "Risque d'explosion",
    phase: "Démolition",
    category: "Incendies et explosions",
    probability: 1,
    gravity: 5,
    initialRisk: 5,
    measures: "Détection gaz + ventilation",
    residualRisk: 2,
    status: "En contrôle",
    responsible: "Responsable HSE",
    sector: "Sécurité"
  }
];

const RiskRegistry = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPhase, setSelectedPhase] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRiskLevel, setSelectedRiskLevel] = useState("all");

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
              Registre des risques
            </h1>
            <p className="text-gray-600 mt-1">Gestion dynamique et prédictive des risques SST</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau risque
            </Button>
          </div>
        </div>

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
            Filtres
          </Button>
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
      <div className="mb-6">
        <PredictiveAlerts />
      </div>

      {/* Risk Table */}
      <div>
        <RiskTable risks={mockRisks} searchTerm={searchTerm} />
      </div>
    </div>
  );
};

export default RiskRegistry;
