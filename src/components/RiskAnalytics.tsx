
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart, Cell } from "recharts";
import { Progress } from "@/components/ui/progress";

const risksByCategory = [
  { name: "Électricité (CSTC)", count: 26, color: "#ef4444" },
  { name: "Équipements de levage", count: 22, color: "#f97316" },
  { name: "Incendies et explosions", count: 19, color: "#f59e0b" },
  { name: "Chute (CSTC)", count: 16, color: "#eab308" },
  { name: "Creusement, excavation", count: 14, color: "#84cc16" },
  { name: "Autres risques professionnels", count: 11, color: "#22c55e" }
];

const riskEvolution = [
  { month: "Jan", riskIndex: 14.2 },
  { month: "Fév", riskIndex: 13.1 },
  { month: "Mar", riskIndex: 12.3 },
  { month: "Avr", riskIndex: 11.8 },
  { month: "Mai", riskIndex: 10.5 },
  { month: "Jun", riskIndex: 8.18 }
];

const predictiveIndicators = [
  { name: "Taux de conformité EPI", value: 92, threshold: 95, status: "warning" },
  { name: "Délai moyen signalement", value: 82, threshold: 80, status: "success" },
  { name: "Récurrence incidents", value: 12, threshold: 15, status: "success" }
];

export function RiskAnalytics() {
  return (
    <div className="space-y-6">
      {/* Risk Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Répartition par catégorie</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={risksByCategory} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} fontSize={12} />
              <Tooltip />
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
              <Tooltip />
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
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {predictiveIndicators.map((indicator, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{indicator.name}</span>
                  <span className={`text-sm font-bold ${
                    indicator.status === 'warning' ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {indicator.value}%
                  </span>
                </div>
                <Progress 
                  value={indicator.value} 
                  className="h-2"
                />
                <div className="text-xs text-gray-500">
                  Seuil critique: {indicator.threshold}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
