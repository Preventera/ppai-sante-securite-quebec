
import { DashboardKPICard } from "@/components/DashboardKPICard";
import { Shield, AlertTriangle, CheckCircle, TrendingUp, Search, User, Bell, Brain, Activity, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from "recharts";

// Enhanced mock data for the dashboard
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
    inspections: { completed: 24, target: 30, upcoming: 6, growth: 15 },
    compliance: { rate: 96, budget: 7 },
    resolution: { averageTime: 4.2, target: 5.0 }
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
  ],
  predictiveAlerts: [
    { zone: "Entrepôt A", type: "Risque chimique", severity: "critical", probability: 85, action: "Vérifier ventilation" },
    { zone: "Quai de chargement", type: "Accident potentiel", severity: "high", probability: 72, action: "Renforcer signalisation" },
    { zone: "Bureau", type: "Ergonomie", severity: "medium", probability: 45, action: "Formation postures" }
  ],
  incidentTrend: [
    { month: "Jan", incidents: 8, predicted: 7 },
    { month: "Fév", incidents: 6, predicted: 6 },
    { month: "Mar", incidents: 4, predicted: 5 },
    { month: "Avr", incidents: 7, predicted: 6 },
    { month: "Mai", incidents: 3, predicted: 4 },
    { month: "Jun", incidents: null, predicted: 3 }
  ],
  riskIndex: {
    current: 72,
    target: 60,
    trend: -8,
    lastUpdate: "Il y a 2h"
  },
  heatmapData: [
    { zone: "Entrepôt A", risk: 85, x: 20, y: 30 },
    { zone: "Entrepôt B", risk: 45, x: 60, y: 30 },
    { zone: "Quai", risk: 70, x: 40, y: 70 },
    { zone: "Bureau", risk: 25, x: 80, y: 20 }
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

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "critical": return "bg-red-100 border-red-300 text-red-800";
    case "high": return "bg-orange-100 border-orange-300 text-orange-800";
    case "medium": return "bg-yellow-100 border-yellow-300 text-yellow-800";
    default: return "bg-gray-100 border-gray-300 text-gray-800";
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
        {/* KPI Cards - Enhanced with 6 cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
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

          {/* Taux de conformité */}
          <Card className="bg-white border-2 border-green-200 hover:shadow-lg transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 uppercase">Conformité globale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Target className="w-8 h-8 text-green-600" />
                  <div className="text-2xl font-bold text-green-600">{dashboardData.kpis.compliance.rate}%</div>
                </div>
                <div className="text-sm text-gray-500">Budget SST: {dashboardData.kpis.compliance.budget}%</div>
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

          {/* Temps de résolution */}
          <Card className="bg-white border-2 border-purple-200 hover:shadow-lg transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 uppercase">Temps de résolution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Activity className="w-8 h-8 text-purple-600" />
                  <div className="text-2xl font-bold text-purple-600">{dashboardData.kpis.resolution.averageTime}j</div>
                </div>
                <div className="text-sm text-gray-500">Objectif: {dashboardData.kpis.resolution.target}j</div>
                <Progress 
                  value={(dashboardData.kpis.resolution.target - dashboardData.kpis.resolution.averageTime) / dashboardData.kpis.resolution.target * 100} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 3: Analyse Prédictive */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Brain className="w-6 h-6 text-sst-blue" />
            <h2 className="text-xl font-bold text-sst-blue">Analyse Prédictive</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Alertes Préventives */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold text-sst-blue flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Alertes Préventives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.predictiveAlerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 ${getSeverityColor(alert.severity)}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium">{alert.zone}</div>
                        <div className="text-sm font-bold">{alert.probability}%</div>
                      </div>
                      <div className="text-sm mb-1">{alert.type}</div>
                      <div className="text-xs text-gray-600">{alert.action}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Probabilité d'incidents futurs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-sst-blue">
                  Prédiction d'Incidents (6 mois)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashboardData.incidentTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Line 
                        type="monotone" 
                        dataKey="incidents" 
                        stroke="#0066cc" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Réels"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="predicted" 
                        stroke="#ff8800" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ r: 4 }}
                        name="Prédits"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Indice de risque dynamique */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-sst-blue">
                  Indice de Risque Dynamique
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-orange-600 mb-2">
                      {dashboardData.riskIndex.current}
                    </div>
                    <div className="text-sm text-gray-500">
                      Objectif: {dashboardData.riskIndex.target}
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-orange-500 h-4 rounded-full transition-all duration-500"
                        style={{ width: `${(dashboardData.riskIndex.current / 100) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className={`font-medium ${dashboardData.riskIndex.trend < 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {dashboardData.riskIndex.trend < 0 ? '↓' : '↑'} {Math.abs(dashboardData.riskIndex.trend)} points
                    </span>
                    <span className="text-gray-500">{dashboardData.riskIndex.lastUpdate}</span>
                  </div>

                  {/* Carte de chaleur simplifiée */}
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">Zones à risque:</div>
                    <div className="grid grid-cols-2 gap-2">
                      {dashboardData.heatmapData.map((zone, index) => (
                        <div
                          key={index}
                          className={`p-2 rounded text-center text-xs font-medium ${
                            zone.risk > 70 ? 'bg-red-100 text-red-800' :
                            zone.risk > 40 ? 'bg-orange-100 text-orange-800' :
                            'bg-green-100 text-green-800'
                          }`}
                        >
                          <div>{zone.zone}</div>
                          <div className="font-bold">{zone.risk}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
