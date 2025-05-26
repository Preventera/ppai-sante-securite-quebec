
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, Eye, FileText, Upload, Plus } from "lucide-react";

const alerts = [
  {
    id: 1,
    type: "weather",
    severity: "high",
    title: "Risque météo élevé",
    description: "Vents >50km/h prévus demain - Reporter opérations de levage",
    icon: AlertTriangle,
    color: "text-red-600 bg-red-50 border-red-200"
  },
  {
    id: 2,
    type: "compliance",
    severity: "medium",
    title: "Baisse conformité EPI",
    description: "Secteur démolition, -15% cette semaine",
    icon: TrendingUp,
    color: "text-orange-600 bg-orange-50 border-orange-200"
  },
  {
    id: 3,
    type: "trend",
    severity: "medium",
    title: "Tendance émergente",
    description: "+25% signalements équipements électriques",
    icon: TrendingUp,
    color: "text-yellow-600 bg-yellow-50 border-yellow-200"
  }
];

const quickActions = [
  {
    title: "Ajouter nouveau risque",
    icon: Plus,
    color: "bg-blue-600 hover:bg-blue-700"
  },
  {
    title: "Signaler situation dangereuse",
    icon: AlertTriangle,
    color: "bg-red-600 hover:bg-red-700"
  },
  {
    title: "Générer rapport hebdomadaire",
    icon: FileText,
    color: "bg-green-600 hover:bg-green-700"
  },
  {
    title: "Exporter pour CNESST",
    icon: Upload,
    color: "bg-purple-600 hover:bg-purple-700"
  }
];

export function PredictiveAlerts() {
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Predictive Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Alertes prédictives
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {alerts.map((alert) => (
            <Alert key={alert.id} className={alert.color}>
              <alert.icon className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{alert.title}</div>
                    <div className="text-sm mt-1">{alert.description}</div>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {alert.severity === "high" ? "Élevé" : "Moyen"}
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                className={`${action.color} text-white p-4 h-auto flex-col gap-2`}
                variant="default"
              >
                <action.icon className="w-5 h-5" />
                <span className="text-xs text-center leading-tight">
                  {action.title}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
