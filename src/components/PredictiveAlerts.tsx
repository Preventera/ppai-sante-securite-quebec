import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertOctagon, TrendingUp, FileText, CheckCircle2, ClipboardList } from "lucide-react";
import { Risk } from "@/types/risk";
import { getCriticalRisks } from "@/utils/riskCalculations";

interface PredictiveAlertsProps {
  risks: Risk[];
  /** Déclencheur d'ajout de risque, fourni par la page pour réutiliser le modal. */
  addRiskSlot?: React.ReactNode;
}

type Severity = "high" | "medium";

interface DerivedAlert {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  Icon: typeof AlertTriangle;
}

const severityStyle: Record<Severity, string> = {
  high: "text-red-800 bg-red-50 border-red-200",
  medium: "text-amber-900 bg-amber-50 border-amber-200"
};

const severityLabel: Record<Severity, string> = {
  high: "Élevé",
  medium: "Moyen"
};

/**
 * Dérive les alertes des données du registre plutôt que de les simuler.
 *
 * Chaque règle correspond à une obligation de la LSST : maîtrise des risques
 * critiques (art. 51), documentation des mesures et désignation d'un responsable.
 */
function deriveAlerts(risks: Risk[]): DerivedAlert[] {
  if (risks.length === 0) return [];

  const alerts: DerivedAlert[] = [];
  const critical = getCriticalRisks(risks);

  const uncontrolledCritical = critical.filter(
    risk => risk.status !== "Contrôles actifs" && risk.status !== "Complété"
  );
  if (uncontrolledCritical.length > 0) {
    alerts.push({
      id: "critical-uncontrolled",
      severity: "high",
      title: `${uncontrolledCritical.length} risque(s) critique(s) sans contrôles actifs`,
      description: uncontrolledCritical
        .slice(0, 2)
        .map(risk => `${risk.id} (indice ${risk.initialRisk})`)
        .join(", "),
      Icon: AlertOctagon
    });
  }

  const withoutMeasures = risks.filter(risk => risk.measures.trim().length === 0);
  if (withoutMeasures.length > 0) {
    alerts.push({
      id: "missing-measures",
      severity: "high",
      title: `${withoutMeasures.length} risque(s) sans mesure de prévention`,
      description: "Obligation de documenter les mesures de contrôle (LSST art. 51)",
      Icon: AlertTriangle
    });
  }

  const withoutOwner = risks.filter(risk => risk.responsible.trim().length === 0);
  if (withoutOwner.length > 0) {
    alerts.push({
      id: "missing-owner",
      severity: "medium",
      title: `${withoutOwner.length} risque(s) sans responsable désigné`,
      description: "Chaque mesure doit être rattachée à un responsable nommé",
      Icon: AlertTriangle
    });
  }

  // Mesures peu efficaces : moins de 20 % de réduction entre initial et résiduel.
  const lowEfficacy = risks.filter(
    risk => risk.initialRisk > 0 && risk.residualRisk / risk.initialRisk > 0.8
  );
  if (lowEfficacy.length > 0) {
    alerts.push({
      id: "low-efficacy",
      severity: "medium",
      title: `${lowEfficacy.length} risque(s) à mesures peu efficaces`,
      description: "Réduction inférieure à 20 % — revoir la hiérarchie de prévention",
      Icon: TrendingUp
    });
  }

  // Concentration : une phase qui cumule au moins un tiers des risques élevés.
  const highRisks = risks.filter(risk => risk.initialRisk >= 12);
  const byPhase = new Map<string, number>();
  highRisks.forEach(risk => {
    const phase = risk.phase || "Non renseignée";
    byPhase.set(phase, (byPhase.get(phase) ?? 0) + 1);
  });
  const [topPhase, topCount] = [...byPhase.entries()].sort((a, b) => b[1] - a[1])[0] ?? ["", 0];
  if (topCount >= 2 && topCount / Math.max(highRisks.length, 1) >= 0.33) {
    alerts.push({
      id: "phase-concentration",
      severity: "medium",
      title: `Concentration de risques élevés : ${topPhase}`,
      description: `${topCount} risque(s) d'indice ≥ 12 sur cette seule phase`,
      Icon: TrendingUp
    });
  }

  return alerts.slice(0, 4);
}

export function PredictiveAlerts({ risks, addRiskSlot }: PredictiveAlertsProps) {
  const alerts = useMemo(() => deriveAlerts(risks), [risks]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Alertes du registre
          </CardTitle>
          <p className="text-sm text-gray-600">
            Écarts de conformité détectés sur les {risks.length} risques enregistrés
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {alerts.length === 0 ? (
            <Alert className="text-green-800 bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">Aucun écart détecté</div>
                <div className="text-sm mt-1">
                  Tous les risques critiques sont sous contrôle, documentés et assignés.
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            alerts.map((alert) => (
              <Alert key={alert.id} className={severityStyle[alert.severity]}>
                <alert.Icon className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">{alert.title}</div>
                      <div className="text-sm mt-1">{alert.description}</div>
                    </div>
                    <Badge variant="outline" className="ml-2 shrink-0">
                      {severityLabel[alert.severity]}
                    </Badge>
                  </div>
                </AlertDescription>
              </Alert>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actions rapides</CardTitle>
          <p className="text-sm text-gray-600">Traiter les écarts identifiés</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {addRiskSlot}
            <Button asChild variant="outline" className="p-4 h-auto flex-col gap-2">
              <Link to="/generator">
                <FileText className="w-5 h-5" />
                <span className="text-xs text-center leading-tight">
                  Générer un programme de prévention
                </span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="p-4 h-auto flex-col gap-2">
              <Link to="/kpi-generator">
                <ClipboardList className="w-5 h-5" />
                <span className="text-xs text-center leading-tight">
                  Tableau de bord KPI
                </span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="p-4 h-auto flex-col gap-2">
              <Link to="/programs">
                <FileText className="w-5 h-5" />
                <span className="text-xs text-center leading-tight">
                  Programmes enregistrés
                </span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
