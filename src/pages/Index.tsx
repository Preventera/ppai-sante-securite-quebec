
import { DashboardKPICard } from "@/components/DashboardKPICard";
import { Shield, AlertTriangle, CheckCircle, TrendingUp, Search, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

// Mock data for the dashboard
const dashboardData = {
  company: {
    name: "Entrepôts Frigorifiques Laurentides",
    sector: "Entreposage frigorifique",
    employees: 35,
    lastUpdate: "2025-05-18",
    activeRisks: 37,
    criticalRisks: 8
  },
  kpis: {
    program: { status: "Actif", lastUpdate: "15 mai" },
    measures: { completed: 42, total: 62, overdue: 3, upcoming: 5 },
    incidents: { accidents: 2, nearMiss: 5, situations: 7, trend: -50 },
    inspections: { completed: 24, target: 30, upcoming: 6, growth: 15 }
  },
  risksByCategory: [
    { name: "Mécaniques", value: 31, color: "#ff4444" },
    { name: "Électriques", value: 29, color: "#ff8800" },
    { name: "Chimiques", value: 27, color: "#ffcc00" },
    { name: "Ergonomiques", value: 13, color: "#44ff44" }
  ],
  upcomingMeasures: [
    { task: "Installation garde-corps - Mezzanine", days: 3, priority: "high" },
    { task: "Formation levage sécuritaire - Entrepôt", days: 7, priority: "medium" },
    { task: "Captation poussière - Atelier", days: 14, priority: "low" }
  ]
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high": return "bg-red-500 text-white";
    case "medium": return "bg-orange-500 text-white";
    case "low": return "bg-blue-500 text-white";
    default: return "bg-gray-500 text-white";
  }
};

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case "high": return "URGENT";
    case "medium": return "MOYEN";
    case "low": return "NORMAL";
    default: return "NORMAL";
  }
};

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <div className="flex items-center space-x-6">
            <div className="text-2xl font-bold text-sst-blue">PPAI</div>
            {/* Navigation Menu */}
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-sst-blue font-semibold">Tableau de bord</a>
              <a href="#" className="text-gray-600 hover:text-sst-blue">Programmes</a>
              <a href="#" className="text-gray-600 hover:text-sst-blue">Risques</a>
              <a href="#" className="text-gray-600 hover:text-sst-blue">Mesures</a>
              <a href="#" className="text-gray-600 hover:text-sst-blue">Incidents</a>
              <a href="#" className="text-gray-600 hover:text-sst-blue">Rapports</a>
            </nav>
          </div>

          {/* Search and User */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Recherche globale..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sst-blue focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-sst-blue rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-sm">
                <div className="font-medium">Marc Tremblay</div>
                <div className="text-gray-500">Coordinateur SST</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Company Information Section */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{dashboardData.company.name}</h1>
            <div className="flex items-center space-x-6 text-sm text-gray-600 mt-1">
              <span>Secteur: {dashboardData.company.sector} (Groupe prioritaire 2 CNESST)</span>
              <span>Employés: {dashboardData.company.employees}</span>
              <span>Mise à jour: {dashboardData.company.lastUpdate}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{dashboardData.company.activeRisks}</div>
              <div className="text-xs text-gray-500">Risques actifs</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{dashboardData.company.criticalRisks}</div>
              <div className="text-xs text-gray-500">Risques critiques</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Programme de prévention */}
          <Card className="bg-white border-2 border-blue-200 hover:shadow-lg transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 uppercase">Programme de prévention</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Shield className="w-8 h-8 text-blue-600" />
                  <Badge className="bg-green-100 text-green-800">
                    {dashboardData.kpis.program.status}
                  </Badge>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">Programme SST 2025</div>
                  <div className="text-sm text-gray-500">Dernière mise à jour: {dashboardData.kpis.program.lastUpdate}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mesures préventives */}
          <Card className="bg-white border-2 border-orange-200 hover:shadow-lg transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 uppercase">Mesures préventives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <CheckCircle className="w-8 h-8 text-orange-600" />
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {dashboardData.kpis.measures.completed}/{dashboardData.kpis.measures.total}
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.round((dashboardData.kpis.measures.completed / dashboardData.kpis.measures.total) * 100)}% complété
                    </div>
                  </div>
                </div>
                <Progress 
                  value={(dashboardData.kpis.measures.completed / dashboardData.kpis.measures.total) * 100} 
                  className="h-3"
                />
                <div className="text-sm text-gray-500">
                  {dashboardData.kpis.measures.overdue} mesures en retard | {dashboardData.kpis.measures.upcoming} à échéance
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Incidents */}
          <Card className="bg-white border-2 border-red-200 hover:shadow-lg transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 uppercase">Incidents (12 derniers mois)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                  <div className="text-sm text-green-600 font-medium">
                    ↓{Math.abs(dashboardData.kpis.incidents.trend)}% vs précédent
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold text-gray-900">{dashboardData.kpis.incidents.accidents}</div>
                    <div className="text-xs text-gray-500">Accidents</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">{dashboardData.kpis.incidents.nearMiss}</div>
                    <div className="text-xs text-gray-500">Quasi-acc.</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">{dashboardData.kpis.incidents.situations}</div>
                    <div className="text-xs text-gray-500">Sit. dang.</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inspections */}
          <Card className="bg-white border-2 border-green-200 hover:shadow-lg transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 uppercase">Inspections SST</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                  <div className="text-sm text-green-600 font-medium">
                    +{dashboardData.kpis.inspections.growth}%
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{dashboardData.kpis.inspections.completed}</div>
                  <div className="text-sm text-gray-500">complétées</div>
                </div>
                <div className="text-sm text-gray-500">
                  Objectif: {dashboardData.kpis.inspections.target} | À venir: {dashboardData.kpis.inspections.upcoming}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-sst-blue">
                Répartition des risques par catégorie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.risksByCategory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Bar 
                      dataKey="value" 
                      fill="#0066cc"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Measures */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-sst-blue">
                Mesures à échéance proche
              </CardTitle>
              <Button variant="outline" size="sm">
                Voir toutes les mesures
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.upcomingMeasures.map((measure, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{measure.task}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-600">
                        {measure.days}j
                      </span>
                      <Badge className={getPriorityColor(measure.priority)}>
                        {getPriorityLabel(measure.priority)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
