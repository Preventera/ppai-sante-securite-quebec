
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardKPICard } from "@/components/DashboardKPICard";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Shield, 
  Users, 
  FileText,
  Clock,
  Target,
  Activity
} from "lucide-react";

interface ConfigurationData {
  secteur: string;
  tailleEtablissement: string;
  groupePrioritaire: number;
  activitesPrincipales: string[];
}

interface KPIDashboardProps {
  configuration: ConfigurationData;
}

export function KPIDashboard({ configuration }: KPIDashboardProps) {
  // Simulation de données KPI basées sur la configuration
  const generateKPIData = () => {
    const baseValues = {
      1: { tcir: 12.5, ltifr: 8.2, inspections: 75, formations: 85 },
      2: { tcir: 8.3, ltifr: 5.1, inspections: 82, formations: 78 },
      3: { tcir: 4.7, ltifr: 2.8, inspections: 88, formations: 92 }
    };
    return baseValues[configuration.groupePrioritaire as keyof typeof baseValues];
  };

  const kpiData = generateKPIData();

  const proactiveKPIs = [
    {
      title: "Situations dangereuses rapportées",
      value: "47",
      subtitle: "ce mois",
      icon: AlertTriangle,
      color: "orange" as const,
      trend: { value: 15, label: "vs mois dernier", isPositive: true }
    },
    {
      title: "Inspections réalisées",
      value: `${kpiData.inspections}%`,
      subtitle: "du plan",
      icon: Shield,
      color: "green" as const,
      progress: { value: kpiData.inspections, max: 100, color: "green" }
    },
    {
      title: "Formations SST",
      value: `${kpiData.formations}%`,
      subtitle: "complétées",
      icon: Users,
      color: "blue" as const,
      progress: { value: kpiData.formations, max: 100, color: "blue" }
    },
    {
      title: "Actions CAPA",
      value: "23",
      subtitle: "en cours",
      icon: FileText,
      color: "yellow" as const,
      trend: { value: -8, label: "vs mois dernier", isPositive: false }
    }
  ];

  const reactiveKPIs = [
    {
      title: "TCIR",
      value: kpiData.tcir.toString(),
      subtitle: "Total Case Incident Rate",
      icon: TrendingDown,
      color: "red" as const,
      trend: { value: -12, label: "amélioration", isPositive: true }
    },
    {
      title: "LTIFR", 
      value: kpiData.ltifr.toString(),
      subtitle: "Lost Time Injury Frequency",
      icon: Clock,
      color: "orange" as const,
      trend: { value: -5, label: "vs trimestre", isPositive: true }
    },
    {
      title: "Jours sans accident",
      value: "127",
      subtitle: "jours consécutifs",
      icon: Target,
      color: "green" as const,
    },
    {
      title: "Taux de gravité",
      value: "0.85",
      subtitle: "index composite",
      icon: Activity,
      color: "blue" as const,
    }
  ];

  const getRiskLevel = (groupe: number) => {
    switch (groupe) {
      case 1: return { label: "Élevé", color: "bg-red-100 text-red-800" };
      case 2: return { label: "Moyen", color: "bg-orange-100 text-orange-800" };
      case 3: return { label: "Faible", color: "bg-green-100 text-green-800" };
      default: return { label: "Non défini", color: "bg-gray-100 text-gray-800" };
    }
  };

  const riskLevel = getRiskLevel(configuration.groupePrioritaire);

  return (
    <div className="space-y-6">
      {/* Configuration Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Profil de l'établissement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">Secteur</div>
              <div className="font-medium capitalize">{configuration.secteur}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Taille</div>
              <div className="font-medium">{configuration.tailleEtablissement} employés</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Groupe prioritaire</div>
              <Badge className={riskLevel.color}>
                Groupe {configuration.groupePrioritaire} - {riskLevel.label}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-gray-600">Activités</div>
              <div className="font-medium">{configuration.activitesPrincipales.length} activités</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Proactifs */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Indicateurs Proactifs (Leading KPIs)
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {proactiveKPIs.map((kpi, index) => (
            <DashboardKPICard key={index} {...kpi} />
          ))}
        </div>
      </div>

      {/* KPI Réactifs */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-red-600" />
          Indicateurs Réactifs (Lagging KPIs)
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {reactiveKPIs.map((kpi, index) => (
            <DashboardKPICard key={index} {...kpi} />
          ))}
        </div>
      </div>

      {/* Index Global SSE */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-sst-blue" />
            Index Global SSE
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Performance Globale SSE</span>
              <span className="text-3xl font-bold text-sst-blue">78.5</span>
            </div>
            <Progress value={78.5} className="h-3" />
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Proactifs (70%)</div>
                <div className="font-medium text-green-600">82.3</div>
              </div>
              <div>
                <div className="text-gray-600">Réactifs (30%)</div>
                <div className="font-medium text-orange-600">71.2</div>
              </div>
              <div>
                <div className="text-gray-600">Tendance</div>
                <div className="font-medium text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +5.2%
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
