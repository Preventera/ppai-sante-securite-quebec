import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertTriangle, AlertOctagon } from "lucide-react";
import { Risk } from "@/types/risk";
import { calculateRiskReductionRate, getCriticalRisks } from "@/utils/riskCalculations";
import { chartColors, chartInk, statusColors, tooltipStyle, IndicatorStatus } from "@/lib/chartTheme";

interface RiskAnalyticsProps {
  risks: Risk[];
}

interface Indicator {
  name: string;
  value: number;
  threshold: number;
  status: IndicatorStatus;
  detail: string;
}

const statusMeta: Record<IndicatorStatus, { label: string; Icon: typeof CheckCircle2 }> = {
  good: { label: "Conforme", Icon: CheckCircle2 },
  warning: { label: "À surveiller", Icon: AlertTriangle },
  critical: { label: "Critique", Icon: AlertOctagon }
};

/** Statut d'un indicateur : au seuil = conforme, sous 85 % du seuil = critique. */
const statusFor = (value: number, threshold: number): IndicatorStatus => {
  if (value >= threshold) return "good";
  if (value >= threshold * 0.85) return "warning";
  return "critical";
};

const percent = (numerator: number, denominator: number) =>
  denominator === 0 ? 0 : Math.round((numerator / denominator) * 100);

export function RiskAnalytics({ risks }: RiskAnalyticsProps) {
  const risksByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    risks.forEach(risk => {
      const key = risk.category || "Non catégorisé";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [risks]);

  const reductionBySector = useMemo(() => {
    const grouped = new Map<string, { initial: number; residual: number; count: number }>();

    risks.forEach(risk => {
      const entry = grouped.get(risk.sector) ?? { initial: 0, residual: 0, count: 0 };
      entry.initial += risk.initialRisk;
      entry.residual += risk.residualRisk;
      entry.count += 1;
      grouped.set(risk.sector, entry);
    });

    return [...grouped.entries()]
      .map(([sector, { initial, residual, count }]) => ({
        sector,
        initial: Math.round((initial / count) * 10) / 10,
        residual: Math.round((residual / count) * 10) / 10
      }))
      .sort((a, b) => b.initial - a.initial);
  }, [risks]);

  const indicators = useMemo<Indicator[]>(() => {
    const total = risks.length;
    const critical = getCriticalRisks(risks);
    const criticalControlled = critical.filter(
      risk => risk.status === "Contrôles actifs" || risk.status === "Complété"
    );
    const withMeasures = risks.filter(risk => risk.measures.trim().length > 0);
    const withOwner = risks.filter(risk => risk.responsible.trim().length > 0);
    const reduction = calculateRiskReductionRate(risks);

    const criticalCoverage = percent(criticalControlled.length, critical.length);
    const measureCoverage = percent(withMeasures.length, total);
    const ownerCoverage = percent(withOwner.length, total);
    const reductionValue = Math.round(reduction);

    return [
      {
        name: "Risques critiques sous contrôle",
        value: criticalCoverage,
        threshold: 90,
        status: statusFor(criticalCoverage, 90),
        detail: `${criticalControlled.length} de ${critical.length} risques d'indice ≥ 15`
      },
      {
        name: "Taux de réduction du risque",
        value: reductionValue,
        threshold: 50,
        status: statusFor(reductionValue, 50),
        detail: "Écart entre indice initial et indice résiduel"
      },
      {
        name: "Couverture des mesures de prévention",
        value: measureCoverage,
        threshold: 100,
        status: statusFor(measureCoverage, 100),
        detail: `${withMeasures.length} de ${total} risques documentés`
      },
      {
        name: "Responsable désigné",
        value: ownerCoverage,
        threshold: 100,
        status: statusFor(ownerCoverage, 100),
        detail: `${withOwner.length} de ${total} risques assignés (LSST art. 51)`
      }
    ];
  }, [risks]);

  if (risks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Analytique du registre</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Ajoutez des risques au registre pour afficher l'analytique.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Une seule série : la couleur ne distingue rien, donc pas de légende. */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Répartition des risques par catégorie</CardTitle>
          <p className="text-sm text-gray-600">
            Distribution des {risks.length} risques du registre
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={risksByCategory}
              layout="vertical"
              margin={{ top: 4, right: 32, bottom: 4, left: 8 }}
            >
              <CartesianGrid horizontal={false} stroke={chartInk.grid} />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 11, fill: chartInk.muted }}
                axisLine={{ stroke: chartInk.axis }}
                tickLine={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={170}
                tick={{ fontSize: 11, fill: chartInk.muted }}
                axisLine={{ stroke: chartInk.axis }}
                tickLine={false}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(value: number) => [`${value} risque(s)`, "Nombre"]}
              />
              <Bar dataKey="count" fill={chartColors.series1} radius={[0, 4, 4, 0]} maxBarSize={22}>
                <LabelList
                  dataKey="count"
                  position="right"
                  style={{ fill: chartInk.secondary, fontSize: 11 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Deux séries : légende obligatoire, identité jamais portée par la couleur seule. */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Effet des mesures de prévention par secteur</CardTitle>
          <p className="text-sm text-gray-600">
            Indice de risque moyen avant et après application des mesures
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={reductionBySector}
              margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
              barGap={2}
            >
              <CartesianGrid vertical={false} stroke={chartInk.grid} />
              <XAxis
                dataKey="sector"
                tick={{ fontSize: 11, fill: chartInk.muted }}
                axisLine={{ stroke: chartInk.axis }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 25]}
                tick={{ fontSize: 11, fill: chartInk.muted }}
                axisLine={{ stroke: chartInk.axis }}
                tickLine={false}
              />
              <Tooltip {...tooltipStyle} />
              <Legend
                wrapperStyle={{ fontSize: 12, color: chartInk.secondary }}
                iconType="circle"
                iconSize={8}
              />
              <Bar
                dataKey="initial"
                name="Indice initial"
                fill={chartColors.series1}
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                dataKey="residual"
                name="Indice résiduel"
                fill={chartColors.series2}
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Indicateurs de maîtrise</CardTitle>
          <p className="text-sm text-gray-600">Calculés en direct sur le registre</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {indicators.map((indicator) => {
              const { label, Icon } = statusMeta[indicator.status];
              return (
                <div key={indicator.name} className="space-y-2">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-sm font-medium">{indicator.name}</span>
                    {/* Icône + libellé : la couleur ne porte jamais seule le statut. */}
                    <span className="flex items-center gap-1.5 text-sm font-bold shrink-0">
                      <Icon className="w-4 h-4" style={{ color: statusColors[indicator.status] }} />
                      <span className="text-gray-600 font-normal text-xs">{label}</span>
                      <span className="tabular-nums">{indicator.value} %</span>
                    </span>
                  </div>
                  <Progress
                    value={indicator.value}
                    className={`h-2 ${
                      indicator.status === "critical"
                        ? "[&>div]:bg-red-500"
                        : indicator.status === "warning"
                          ? "[&>div]:bg-amber-500"
                          : "[&>div]:bg-green-600"
                    }`}
                  />
                  <div className="text-xs text-gray-500">
                    {indicator.detail} · cible {indicator.threshold} %
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
