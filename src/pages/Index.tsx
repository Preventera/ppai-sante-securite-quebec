import { useMemo } from "react";
import { Link } from "react-router-dom";
import { DashboardKPICard } from "@/components/DashboardKPICard";
import { BackendModeBadge } from "@/components/BackendModeBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  Shield,
  AlertTriangle,
  TrendingDown,
  Target,
  Loader2,
  FileText,
  ClipboardList,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { useRisks } from "@/hooks/useRisks";
import {
  calculateRiskSummary,
  calculateRiskReductionRate,
  getCriticalRisks
} from "@/utils/riskCalculations";
import { chartColors, chartInk, tooltipStyle } from "@/lib/chartTheme";

const riskBadgeClass = (initialRisk: number) => {
  if (initialRisk >= 16) return "bg-red-600 text-white";
  if (initialRisk >= 12) return "bg-orange-500 text-white";
  if (initialRisk >= 8) return "bg-yellow-500 text-black";
  return "bg-green-600 text-white";
};

const Index = () => {
  const { data: risks = [], isLoading } = useRisks();

  const summary = useMemo(() => calculateRiskSummary(risks), [risks]);
  const reduction = useMemo(() => calculateRiskReductionRate(risks), [risks]);
  const critical = useMemo(() => getCriticalRisks(risks), [risks]);

  const topRisks = useMemo(
    () => [...risks].sort((a, b) => b.initialRisk - a.initialRisk).slice(0, 5),
    [risks]
  );

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

  /** Écarts de conformité : mêmes règles que celles appliquées au registre. */
  const gaps = useMemo(() => {
    const withoutOwner = risks.filter(risk => !risk.responsible.trim()).length;
    const withoutMeasures = risks.filter(risk => !risk.measures.trim()).length;
    const uncontrolledCritical = critical.filter(
      risk => risk.status !== "Contrôles actifs" && risk.status !== "Complété"
    ).length;
    return { withoutOwner, withoutMeasures, uncontrolledCritical };
  }, [risks, critical]);

  const totalGaps = gaps.withoutOwner + gaps.withoutMeasures + gaps.uncontrolledCritical;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          Chargement du tableau de bord…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-sst-blue flex items-center gap-2">
              <Shield className="w-8 h-8" />
              PPAI — Tableau de bord SST
            </h1>
            <div className="text-gray-600 mt-1 flex items-center gap-2 flex-wrap">
              Pilotage de la prévention à partir du registre des risques
              <BackendModeBadge />
            </div>
          </div>
          <Button asChild>
            <Link to="/generator">
              Générer un programme
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        {risks.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h2 className="text-lg font-semibold mb-2">Aucun risque au registre</h2>
              <p className="text-gray-600 mb-4">
                Le tableau de bord se construit à partir du registre des risques.
              </p>
              <Button asChild>
                <Link to="/risks">Ouvrir le registre des risques</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Indicateurs calculés sur le registre */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <DashboardKPICard
                title="Risques au registre"
                value={summary.totalRisks}
                subtitle={`${risksByCategory.length} catégorie(s)`}
                icon={ClipboardList}
                color="blue"
              />
              <DashboardKPICard
                title="Risques critiques"
                value={summary.criticalRisks}
                subtitle="Indice probabilité × gravité ≥ 15"
                icon={AlertTriangle}
                color="red"
              />
              <DashboardKPICard
                title="Indice initial moyen"
                value={summary.averageIndex}
                subtitle={`Indice résiduel moyen : ${summary.residualIndex}`}
                icon={Target}
                color="orange"
              />
              <DashboardKPICard
                title="Réduction du risque"
                value={`${Math.round(reduction)} %`}
                subtitle="Écart entre indice initial et résiduel"
                icon={TrendingDown}
                color="green"
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Une seule série : pas de légende, la couleur ne distingue rien. */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Risques par catégorie</CardTitle>
                  <p className="text-sm text-gray-600">
                    Répartition des {risks.length} risques enregistrés
                  </p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
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
                        width={165}
                        tick={{ fontSize: 11, fill: chartInk.muted }}
                        axisLine={{ stroke: chartInk.axis }}
                        tickLine={false}
                      />
                      <Tooltip
                        {...tooltipStyle}
                        formatter={(value: number) => [`${value} risque(s)`, "Nombre"]}
                      />
                      <Bar
                        dataKey="count"
                        fill={chartColors.series1}
                        radius={[0, 4, 4, 0]}
                        maxBarSize={22}
                      >
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

              {/* Écarts de conformité — icône + libellé, jamais la couleur seule */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Écarts de conformité</CardTitle>
                  <p className="text-sm text-gray-600">
                    Contrôles dérivés des obligations de la LSST
                  </p>
                </CardHeader>
                <CardContent>
                  {totalGaps === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-600" />
                      <p className="font-medium">Aucun écart détecté</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Risques critiques maîtrisés, mesures documentées et responsables désignés.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[
                        {
                          label: "Risques critiques sans contrôles actifs",
                          value: gaps.uncontrolledCritical,
                          reference: "LSST art. 51"
                        },
                        {
                          label: "Risques sans mesure de prévention documentée",
                          value: gaps.withoutMeasures,
                          reference: "LSST art. 51"
                        },
                        {
                          label: "Risques sans responsable désigné",
                          value: gaps.withoutOwner,
                          reference: "LSST art. 51"
                        }
                      ].map(gap => (
                        <div
                          key={gap.label}
                          className="flex items-center justify-between gap-3 border rounded-md p-3"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {gap.value > 0 ? (
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <div className="text-sm font-medium">{gap.label}</div>
                              <div className="text-xs text-gray-500">{gap.reference}</div>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              gap.value > 0
                                ? "border-amber-300 bg-amber-50 text-amber-900 shrink-0"
                                : "border-green-300 bg-green-50 text-green-800 shrink-0"
                            }
                          >
                            {gap.value}
                          </Badge>
                        </div>
                      ))}
                      <Button asChild variant="outline" className="w-full mt-2">
                        <Link to="/risks">
                          Traiter dans le registre
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Risques prioritaires */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Risques prioritaires</CardTitle>
                <p className="text-sm text-gray-600">
                  Les cinq indices les plus élevés du registre
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topRisks.map(risk => (
                    <div
                      key={risk.id}
                      className="flex items-center justify-between gap-4 border rounded-md p-3 hover:bg-gray-50"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate" title={risk.name}>
                          <span className="text-gray-500 mr-2">{risk.id}</span>
                          {risk.name}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {risk.phase || "Phase non précisée"} ·{" "}
                          {risk.responsible || "responsable à désigner"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="font-normal">
                          {risk.status}
                        </Badge>
                        <Badge className={riskBadgeClass(risk.initialRisk)}>
                          {risk.initialRisk}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Accès aux parcours */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2">
                <Link to="/risks">
                  <ClipboardList className="w-5 h-5" />
                  <span className="text-sm">Registre des risques</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2">
                <Link to="/programs">
                  <FileText className="w-5 h-5" />
                  <span className="text-sm">Programmes de prévention</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2">
                <Link to="/kpi-generator">
                  <Target className="w-5 h-5" />
                  <span className="text-sm">KPI et données CNESST</span>
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
