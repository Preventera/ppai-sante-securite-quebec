
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle, 
  Shield,
  Brain,
  BarChart3
} from "lucide-react";
import { CNESSTMetadata } from "@/types/cnesst";

interface ConfigurationData {
  secteur: string;
  tailleEtablissement: string;
  groupePrioritaire: number;
  activitesPrincipales: string[];
}

interface CNESSTDashboardProps {
  etablissementData: ConfigurationData;
  cnessMetadata: CNESSTMetadata;
}

export function CNESSTIntegrationDashboard({ etablissementData, cnessMetadata }: CNESSTDashboardProps) {
  // Calculer les benchmarks sectoriels
  const getSectorBenchmarks = () => {
    const sectorData = cnessMetadata.lesionsSecorielles.find(
      lesion => lesion.nom_secteur.toLowerCase() === etablissementData.secteur.toLowerCase()
    );

    if (!sectorData) return null;

    // Simulation de données établissement vs secteur
    const etablissementMetrics = {
      tauxFrequence: sectorData.taux_frequence * (0.8 + Math.random() * 0.4), // Variation ±20%
      graviteMoyenne: sectorData.gravite_moyenne * (0.9 + Math.random() * 0.2), // Variation ±10%
      coutMoyen: sectorData.cout_moyen_reclamation * (0.7 + Math.random() * 0.6) // Variation ±30%
    };

    return {
      secteur: sectorData,
      etablissement: etablissementMetrics,
      performance: {
        frequence: etablissementMetrics.tauxFrequence < sectorData.taux_frequence ? 'better' : 'worse',
        gravite: etablissementMetrics.graviteMoyenne < sectorData.gravite_moyenne ? 'better' : 'worse',
        cout: etablissementMetrics.coutMoyen < sectorData.cout_moyen_reclamation ? 'better' : 'worse'
      }
    };
  };

  // Analyser les risques prioritaires
  const getRiskPriorities = () => {
    return cnessMetadata.agentCausals
      .filter(agent => agent.probabilite_occurrence > 0.6)
      .sort((a, b) => (b.probabilite_occurrence * b.gravite_potentielle) - (a.probabilite_occurrence * a.gravite_potentielle))
      .slice(0, 5);
  };

  // Calculer l'index de conformité CNESST
  const getComplianceIndex = () => {
    const benchmarks = getSectorBenchmarks();
    if (!benchmarks) return 0;

    let score = 0;
    if (benchmarks.performance.frequence === 'better') score += 30;
    if (benchmarks.performance.gravite === 'better') score += 30;
    if (benchmarks.performance.cout === 'better') score += 25;
    
    // Bonus pour mesures préventives efficaces
    const efficientMeasures = cnessMetadata.agentCausals.filter(a => a.efficacite_mesure > 0.8);
    score += Math.min(15, efficientMeasures.length * 3);

    return Math.min(100, score);
  };

  const benchmarks = getSectorBenchmarks();
  const riskPriorities = getRiskPriorities();
  const complianceIndex = getComplianceIndex();

  // Données pour le graphique radar
  const radarData = [
    {
      metric: 'Fréquence',
      etablissement: benchmarks ? (1 - benchmarks.etablissement.tauxFrequence / benchmarks.secteur.taux_frequence) * 100 : 0,
      secteur: 50
    },
    {
      metric: 'Gravité',
      etablissement: benchmarks ? (1 - benchmarks.etablissement.graviteMoyenne / benchmarks.secteur.gravite_moyenne) * 100 : 0,
      secteur: 50
    },
    {
      metric: 'Coûts',
      etablissement: benchmarks ? (1 - benchmarks.etablissement.coutMoyen / benchmarks.secteur.cout_moyen_reclamation) * 100 : 0,
      secteur: 50
    },
    {
      metric: 'Prévention',
      etablissement: cnessMetadata.agentCausals.filter(a => a.efficacite_mesure > 0.8).length * 10,
      secteur: 50
    },
    {
      metric: 'Formation',
      etablissement: Math.random() * 60 + 20, // Simulation
      secteur: 50
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header avec index de conformité */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-600" />
              Tableau de Bord CNESST Enrichi IA
            </div>
            <Badge className="bg-blue-100 text-blue-800 text-lg px-4 py-2">
              Index Conformité: {complianceIndex}/100
            </Badge>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Analyse comparative avec benchmarks sectoriels CNESST - {etablissementData.secteur}
          </p>
        </CardHeader>
        <CardContent>
          <Progress value={complianceIndex} className="h-3" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Non conforme</span>
            <span>Partiellement conforme</span>
            <span>Pleinement conforme</span>
          </div>
        </CardContent>
      </Card>

      {/* Comparaison sectorielle */}
      {benchmarks && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Taux de Fréquence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Établissement</span>
                  <span className="font-bold">{benchmarks.etablissement.tauxFrequence.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Secteur CNESST</span>
                  <span className="text-gray-500">{benchmarks.secteur.taux_frequence.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {benchmarks.performance.frequence === 'better' ? (
                    <TrendingDown className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-red-600" />
                  )}
                  <Badge className={
                    benchmarks.performance.frequence === 'better' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }>
                    {benchmarks.performance.frequence === 'better' ? 'Meilleur' : 'À améliorer'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="w-4 h-4" />
                Gravité Moyenne
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Établissement</span>
                  <span className="font-bold">{benchmarks.etablissement.graviteMoyenne.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Secteur CNESST</span>
                  <span className="text-gray-500">{benchmarks.secteur.gravite_moyenne.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {benchmarks.performance.gravite === 'better' ? (
                    <TrendingDown className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-red-600" />
                  )}
                  <Badge className={
                    benchmarks.performance.gravite === 'better' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }>
                    {benchmarks.performance.gravite === 'better' ? 'Meilleur' : 'À améliorer'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Coût Moyen Réclamation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Établissement</span>
                  <span className="font-bold">{benchmarks.etablissement.coutMoyen.toLocaleString()}$</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Secteur CNESST</span>
                  <span className="text-gray-500">{benchmarks.secteur.cout_moyen_reclamation.toLocaleString()}$</span>
                </div>
                <div className="flex items-center gap-2">
                  {benchmarks.performance.cout === 'better' ? (
                    <TrendingDown className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-red-600" />
                  )}
                  <Badge className={
                    benchmarks.performance.cout === 'better' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }>
                    {benchmarks.performance.cout === 'better' ? 'Meilleur' : 'À améliorer'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Graphique radar de performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Profil de Performance vs Secteur CNESST
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={18} domain={[0, 100]} />
                <Radar
                  name="Établissement"
                  dataKey="etablissement"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
                <Radar
                  name="Moyenne Sectorielle"
                  dataKey="secteur"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.1}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Risques prioritaires identifiés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-600" />
            Risques Prioritaires CNESST
          </CardTitle>
          <p className="text-sm text-gray-600">
            Agents causals prioritaires basés sur les données sectorielles
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {riskPriorities.map((risk, index) => {
              const riskScore = risk.probabilite_occurrence * risk.gravite_potentielle;
              return (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium">{risk.agent_causal}</h4>
                      <p className="text-sm text-gray-600">{risk.categorie_risque}</p>
                    </div>
                    <Badge className={
                      riskScore > 3.5 ? 'bg-red-100 text-red-800' :
                      riskScore > 2.5 ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      Score: {riskScore.toFixed(1)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Probabilité:</span>
                      <div className="font-medium">{(risk.probabilite_occurrence * 100).toFixed(0)}%</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Gravité:</span>
                      <div className="font-medium">{risk.gravite_potentielle.toFixed(1)}/5</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Efficacité mesures:</span>
                      <div className="font-medium">{(risk.efficacite_mesure * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="text-gray-500">Mesures préventives:</span>
                    <div className="font-medium">{risk.mesures_prevention_type}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommandations IA */}
      {cnessMetadata.integrationRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              Recommandations IA Contextuelles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cnessMetadata.integrationRecommendations.map((rec, index) => (
                <Alert key={index} className="border-l-4 border-l-purple-500">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{rec.description}</h4>
                        <Badge className={
                          rec.priority === 'CRITIQUE' ? 'bg-red-100 text-red-800' :
                          rec.priority === 'ÉLEVÉE' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{rec.justification}</p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">ROI prévu:</span>
                          <div className="font-medium">{rec.roi}x</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Efficacité:</span>
                          <div className="font-medium">{(rec.efficacitePrevu * 100).toFixed(0)}%</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Coût estimé:</span>
                          <div className="font-medium">{rec.coutEstime.toLocaleString()}$</div>
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
