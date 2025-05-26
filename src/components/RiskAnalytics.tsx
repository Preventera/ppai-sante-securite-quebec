
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart, Cell } from "recharts";
import { Progress } from "@/components/ui/progress";

const risksByCategory = [
  { name: "Électricité (CSTC)", count: 32, color: "#ef4444" },
  { name: "Équipements de levage", count: 28, color: "#f97316" },
  { name: "Chute (CSTC)", count: 45, color: "#f59e0b" },
  { name: "Incendies et explosions", count: 18, color: "#eab308" },
  { name: "Creusement, excavation", count: 22, color: "#84cc16" },
  { name: "Autres risques professionnels", count: 35, color: "#22c55e" }
];

const riskEvolution = [
  { month: "Jan", riskIndex: 14.2, incidents: 8 },
  { month: "Fév", riskIndex: 13.1, incidents: 6 },
  { month: "Mar", riskIndex: 12.3, incidents: 7 },
  { month: "Avr", riskIndex: 11.8, incidents: 5 },
  { month: "Mai", riskIndex: 10.5, incidents: 4 },
  { month: "Jun", riskIndex: 8.18, incidents: 2 }
];

const predictiveIndicators = [
  { name: "Taux de conformité EPI", value: 87, threshold: 95, status: "warning" },
  { name: "Délai moyen signalement", value: 78, threshold: 80, status: "warning" },
  { name: "Récurrence incidents", value: 15, threshold: 10, status: "critical" },
  { name: "Formation équipes", value: 94, threshold: 90, status: "success" }
];

export function RiskAnalytics() {
  return (
    <div className="space-y-6">
      {/* Risk Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Répartition des risques par catégorie</CardTitle>
          <p className="text-sm text-gray-600">Distribution des 225 risques identifiés</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={risksByCategory} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} fontSize={12} />
              <Tooltip formatter={(value) => [`${value} risques`, 'Nombre']} />
              <Bar dataKey="count">
                {risksByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Risk Evolution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Évolution du risque du chantier</CardTitle>
          <p className="text-sm text-gray-600">Indice de risque global et incidents déclarés</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={riskEvolution}>
              <defs>
                <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'riskIndex' ? `${value}` : `${value} incidents`,
                  name === 'riskIndex' ? 'Indice de risque' : 'Incidents'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="riskIndex" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorRisk)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Predictive Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Indicateurs prédictifs</CardTitle>
          <p className="text-sm text-gray-600">Surveillance des facteurs de risque en temps réel</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {predictiveIndicators.map((indicator, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{indicator.name}</span>
                  <span className={`text-sm font-bold ${
                    indicator.status === 'critical' ? 'text-red-600' : 
                    indicator.status === 'warning' ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {indicator.value}%
                  </span>
                </div>
                <Progress 
                  value={indicator.value} 
                  className={`h-2 ${
                    indicator.status === 'critical' ? '[&>div]:bg-red-500' :
                    indicator.status === 'warning' ? '[&>div]:bg-orange-500' : '[&>div]:bg-green-500'
                  }`}
                />
                <div className="text-xs text-gray-500">
                  Seuil {indicator.status === 'critical' ? 'critique' : 'optimal'}: {indicator.threshold}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
