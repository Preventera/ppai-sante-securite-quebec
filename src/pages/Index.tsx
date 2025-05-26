
import { DashboardKPICard } from "@/components/DashboardKPICard";
import { RiskMatrix } from "@/components/RiskMatrix";
import { Shield, AlertTriangle, CheckCircle, Clock, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Sample data
const kpiData = [
  {
    title: "Programme de prévention",
    value: "78%",
    subtitle: "complété",
    icon: Shield,
    color: "blue" as const,
    progress: { value: 78, max: 100, color: "blue" },
    trend: { value: 12, label: "vs mois dernier", isPositive: true }
  },
  {
    title: "Mesures préventives",
    value: "42",
    subtitle: "/ 62 complétées",
    icon: CheckCircle,
    color: "green" as const,
    progress: { value: 42, max: 62, color: "green" },
  },
  {
    title: "Incidents 12 mois",
    value: "7",
    subtitle: "accidents déclarés",
    icon: AlertTriangle,
    color: "red" as const,
    trend: { value: -23, label: "vs année précédente", isPositive: true }
  },
  {
    title: "Inspections SST",
    value: "15",
    subtitle: "ce mois",
    icon: TrendingUp,
    color: "orange" as const,
    trend: { value: 8, label: "vs mois dernier", isPositive: true }
  }
];

const sampleRisks = [
  { id: "1", name: "Chute de hauteur", probability: 3, gravity: 5, sector: "Construction" },
  { id: "2", name: "Écrasement", probability: 2, gravity: 4, sector: "Manutention" },
  { id: "3", name: "Exposition chimique", probability: 4, gravity: 3, sector: "Laboratoire" },
  { id: "4", name: "Électrisation", probability: 2, gravity: 5, sector: "Maintenance" },
  { id: "5", name: "Troubles musculo-squelettiques", probability: 5, gravity: 2, sector: "Bureau" },
];

const upcomingTasks = [
  { id: "1", task: "Inspection équipements protection", dueDate: "2024-01-15", priority: "high", responsible: "J. Martin" },
  { id: "2", task: "Formation premiers secours", dueDate: "2024-01-18", priority: "medium", responsible: "S. Dubois" },
  { id: "3", task: "Révision procédure cadenassage", dueDate: "2024-01-22", priority: "high", responsible: "P. Tremblay" },
  { id: "4", task: "Analyse poste de travail", dueDate: "2024-01-25", priority: "low", responsible: "M. Lapointe" },
];

const risksByCategory = [
  { category: "Mécanique", count: 15, color: "bg-red-500" },
  { category: "Électrique", count: 8, color: "bg-orange-500" },
  { category: "Chimique", count: 12, color: "bg-yellow-500" },
  { category: "Ergonomique", count: 20, color: "bg-green-500" },
  { category: "Chute", count: 10, color: "bg-blue-500" },
  { category: "Psychosocial", count: 5, color: "bg-purple-500" },
];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high": return "bg-red-100 text-red-800 border-red-200";
    case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "low": return "bg-green-100 text-green-800 border-green-200";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-sst-blue">Tableau de bord SST</h1>
          <p className="text-gray-600">Vue d'ensemble de votre programme de prévention</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiData.map((kpi, index) => (
            <DashboardKPICard
              key={index}
              title={kpi.title}
              value={kpi.value}
              subtitle={kpi.subtitle}
              icon={kpi.icon}
              color={kpi.color}
              progress={kpi.progress}
              trend={kpi.trend}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Matrix */}
          <div className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <RiskMatrix 
              risks={sampleRisks}
              onRiskClick={(risk) => console.log("Risk clicked:", risk)}
            />
          </div>

          {/* Risk Distribution */}
          <Card className="animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-sst-blue">
                Répartition des risques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {risksByCategory.map((item, index) => (
                  <div key={item.category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{item.category}</span>
                      <span className="text-sm text-gray-500">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${item.color} transition-all duration-500`}
                        style={{ 
                          width: `${(item.count / 25) * 100}%`,
                          animationDelay: `${index * 0.1}s`
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Tasks */}
        <Card className="animate-fade-in" style={{ animationDelay: "0.6s" }}>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-sst-blue flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Mesures à échéance proche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingTasks.map((task, index) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">{task.task}</p>
                    <p className="text-sm text-gray-500">Responsable: {task.responsible}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">{task.dueDate}</span>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority === "high" ? "Urgent" : task.priority === "medium" ? "Moyen" : "Faible"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
