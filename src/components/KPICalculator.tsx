
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, TrendingUp, AlertTriangle, Info } from "lucide-react";

interface ConfigurationData {
  secteur: string;
  tailleEtablissement: string;
  groupePrioritaire: number;
  activitesPrincipales: string[];
}

interface KPICalculatorProps {
  configuration: ConfigurationData;
}

interface KPIResult {
  name: string;
  value: number;
  formula: string;
  interpretation: string;
  benchmark: string;
  color: "green" | "yellow" | "red";
}

export function KPICalculator({ configuration }: KPICalculatorProps) {
  const [proactiveInputs, setProactiveInputs] = useState({
    situationsDangereuses: "",
    quasiAccidents: "",
    inspections: "",
    formations: "",
    heuresTravaillees: "",
    nombreEmployes: "",
  });

  const [reactiveInputs, setReactiveInputs] = useState({
    accidents: "",
    accidentsAvecArret: "",
    joursPerdusSante: "",
    joursRestrictifsOuTransferes: "",
    heuresTravaillees: "",
    nombreEmployes: "",
  });

  const [results, setResults] = useState<KPIResult[]>([]);

  const calculateProactiveKPIs = () => {
    const inputs = proactiveInputs;
    const heures = parseFloat(inputs.heuresTravaillees) || 0;
    const employes = parseFloat(inputs.nombreEmployes) || 0;
    const situations = parseFloat(inputs.situationsDangereuses) || 0;
    const quasi = parseFloat(inputs.quasiAccidents) || 0;
    const inspections = parseFloat(inputs.inspections) || 0;
    const formations = parseFloat(inputs.formations) || 0;

    if (heures === 0) return;

    const newResults: KPIResult[] = [
      {
        name: "Taux de signalement situations dangereuses",
        value: (situations / heures) * 200000,
        formula: "(Situations dangereuses / Heures travaillées) × 200 000",
        interpretation: "Nombre de situations dangereuses pour 200 000 heures travaillées",
        benchmark: "Objectif: > 50 (secteur construction)",
        color: (situations / heures) * 200000 > 50 ? "green" : "yellow"
      },
      {
        name: "Ratio quasi-accidents/accidents",
        value: quasi / Math.max(1, parseFloat(reactiveInputs.accidents) || 1),
        formula: "Quasi-accidents / Accidents déclarés",
        interpretation: "Ratio indiquant la culture de signalement",
        benchmark: "Objectif: > 10:1 (Heinrich)",
        color: (quasi / Math.max(1, parseFloat(reactiveInputs.accidents) || 1)) > 10 ? "green" : "red"
      },
      {
        name: "Taux d'inspections préventives",
        value: (inspections / employes) * 12,
        formula: "(Inspections / Employés) × 12 mois",
        interpretation: "Nombre d'inspections par employé par an",
        benchmark: "Objectif: > 6 inspections/employé/an",
        color: (inspections / employes) * 12 > 6 ? "green" : "yellow"
      },
      {
        name: "Taux de formation SST",
        value: (formations / employes) * 100,
        formula: "(Employés formés / Total employés) × 100",
        interpretation: "Pourcentage d'employés ayant reçu une formation SST",
        benchmark: "Objectif: > 90%",
        color: (formations / employes) * 100 > 90 ? "green" : "red"
      }
    ];

    setResults(newResults);
  };

  const calculateReactiveKPIs = () => {
    const inputs = reactiveInputs;
    const heures = parseFloat(inputs.heuresTravaillees) || 0;
    const employes = parseFloat(inputs.nombreEmployes) || 0;
    const accidents = parseFloat(inputs.accidents) || 0;
    const accidentsArret = parseFloat(inputs.accidentsAvecArret) || 0;
    const joursPerdus = parseFloat(inputs.joursPerdusSante) || 0;
    const joursRestrictifs = parseFloat(inputs.joursRestrictifsOuTransferes) || 0;

    if (heures === 0) return;

    const newResults: KPIResult[] = [
      {
        name: "TCIR (Total Case Incident Rate)",
        value: (accidents / heures) * 200000,
        formula: "(Total accidents / Heures travaillées) × 200 000",
        interpretation: "Nombre total d'accidents pour 200 000 heures travaillées",
        benchmark: `Moyenne secteur ${configuration.secteur}: 8.5`,
        color: (accidents / heures) * 200000 < 5 ? "green" : (accidents / heures) * 200000 < 10 ? "yellow" : "red"
      },
      {
        name: "LTIFR (Lost Time Injury Frequency Rate)",
        value: (accidentsArret / heures) * 200000,
        formula: "(Accidents avec arrêt / Heures travaillées) × 200 000",
        interpretation: "Accidents avec temps perdu pour 200 000 heures",
        benchmark: "Objectif: < 2.0",
        color: (accidentsArret / heures) * 200000 < 2 ? "green" : (accidentsArret / heures) * 200000 < 5 ? "yellow" : "red"
      },
      {
        name: "DART (Days Away, Restricted, Transfer)",
        value: ((joursPerdus + joursRestrictifs) / heures) * 200000,
        formula: "((Jours perdus + Jours restrictifs) / Heures) × 200 000",
        interpretation: "Jours d'incapacité pour 200 000 heures travaillées",
        benchmark: "Objectif: < 50",
        color: ((joursPerdus + joursRestrictifs) / heures) * 200000 < 50 ? "green" : "red"
      },
      {
        name: "Taux de gravité",
        value: (joursPerdus / heures) * 200000,
        formula: "(Jours perdus / Heures travaillées) × 200 000",
        interpretation: "Gravité moyenne des accidents",
        benchmark: "Objectif: < 30",
        color: (joursPerdus / heures) * 200000 < 30 ? "green" : "red"
      }
    ];

    setResults(newResults);
  };

  const getBenchmarkContext = () => {
    const groupeBenchmarks = {
      1: "Secteurs à risque élevé (construction, mines)",
      2: "Secteurs à risque moyen (industrie, transport)",
      3: "Secteurs à risque faible (services, bureaux)"
    };
    
    return groupeBenchmarks[configuration.groupePrioritaire as keyof typeof groupeBenchmarks];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-sst-blue" />
            Calculateur KPI SSE
          </CardTitle>
          <p className="text-sm text-gray-600">
            Calculez vos indicateurs SSE selon les standards CNESST
          </p>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-blue-800">Contexte établissement:</div>
                <div className="text-blue-700">
                  {configuration.secteur} - Groupe prioritaire {configuration.groupePrioritaire} - {getBenchmarkContext()}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input Tabs */}
      <Tabs defaultValue="proactive" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="proactive">KPI Proactifs</TabsTrigger>
          <TabsTrigger value="reactive">KPI Réactifs</TabsTrigger>
        </TabsList>

        <TabsContent value="proactive">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Données pour KPI Proactifs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="situationsDangereuses">Situations dangereuses rapportées</Label>
                  <Input
                    id="situationsDangereuses"
                    type="number"
                    placeholder="ex: 25"
                    value={proactiveInputs.situationsDangereuses}
                    onChange={(e) => setProactiveInputs({...proactiveInputs, situationsDangereuses: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="quasiAccidents">Quasi-accidents rapportés</Label>
                  <Input
                    id="quasiAccidents"
                    type="number"
                    placeholder="ex: 45"
                    value={proactiveInputs.quasiAccidents}
                    onChange={(e) => setProactiveInputs({...proactiveInputs, quasiAccidents: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="inspections">Inspections réalisées</Label>
                  <Input
                    id="inspections"
                    type="number"
                    placeholder="ex: 12"
                    value={proactiveInputs.inspections}
                    onChange={(e) => setProactiveInputs({...proactiveInputs, inspections: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="formations">Employés formés SST</Label>
                  <Input
                    id="formations"
                    type="number"
                    placeholder="ex: 85"
                    value={proactiveInputs.formations}
                    onChange={(e) => setProactiveInputs({...proactiveInputs, formations: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="heuresTravaillees">Heures travaillées (période)</Label>
                  <Input
                    id="heuresTravaillees"
                    type="number"
                    placeholder="ex: 50000"
                    value={proactiveInputs.heuresTravaillees}
                    onChange={(e) => setProactiveInputs({...proactiveInputs, heuresTravaillees: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="nombreEmployes">Nombre d'employés</Label>
                  <Input
                    id="nombreEmployes"
                    type="number"
                    placeholder="ex: 100"
                    value={proactiveInputs.nombreEmployes}
                    onChange={(e) => setProactiveInputs({...proactiveInputs, nombreEmployes: e.target.value})}
                  />
                </div>
              </div>
              <Button onClick={calculateProactiveKPIs} className="w-full">
                Calculer les KPI Proactifs
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reactive">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Données pour KPI Réactifs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="accidents">Total accidents déclarés</Label>
                  <Input
                    id="accidents"
                    type="number"
                    placeholder="ex: 5"
                    value={reactiveInputs.accidents}
                    onChange={(e) => setReactiveInputs({...reactiveInputs, accidents: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="accidentsAvecArret">Accidents avec arrêt de travail</Label>
                  <Input
                    id="accidentsAvecArret"
                    type="number"
                    placeholder="ex: 2"
                    value={reactiveInputs.accidentsAvecArret}
                    onChange={(e) => setReactiveInputs({...reactiveInputs, accidentsAvecArret: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="joursPerdusSante">Jours perdus (santé)</Label>
                  <Input
                    id="joursPerdusSante"
                    type="number"
                    placeholder="ex: 45"
                    value={reactiveInputs.joursPerdusSante}
                    onChange={(e) => setReactiveInputs({...reactiveInputs, joursPerdusSante: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="joursRestrictifs">Jours restrictifs/transférés</Label>
                  <Input
                    id="joursRestrictifs"
                    type="number"
                    placeholder="ex: 15"
                    value={reactiveInputs.joursRestrictifsOuTransferes}
                    onChange={(e) => setReactiveInputs({...reactiveInputs, joursRestrictifsOuTransferes: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="heuresTravailleesReactive">Heures travaillées (période)</Label>
                  <Input
                    id="heuresTravailleesReactive"
                    type="number"
                    placeholder="ex: 50000"
                    value={reactiveInputs.heuresTravaillees}
                    onChange={(e) => setReactiveInputs({...reactiveInputs, heuresTravaillees: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="nombreEmployesReactive">Nombre d'employés</Label>
                  <Input
                    id="nombreEmployesReactive"
                    type="number"
                    placeholder="ex: 100"
                    value={reactiveInputs.nombreEmployes}
                    onChange={(e) => setReactiveInputs({...reactiveInputs, nombreEmployes: e.target.value})}
                  />
                </div>
              </div>
              <Button onClick={calculateReactiveKPIs} className="w-full">
                Calculer les KPI Réactifs
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Résultats des calculs KPI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{result.name}</h4>
                    <Badge 
                      className={
                        result.color === "green" ? "bg-green-100 text-green-800" :
                        result.color === "yellow" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }
                    >
                      {result.value.toFixed(2)}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div><strong>Formule:</strong> {result.formula}</div>
                    <div><strong>Interprétation:</strong> {result.interpretation}</div>
                    <div><strong>Benchmark:</strong> {result.benchmark}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
