import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, AlertTriangle, Target, Zap, TrendingUp, Clock, Info } from "lucide-react";
import { seededInt, seededRange, seededUnit } from "@/lib/deterministic";
import { useToast } from "@/hooks/use-toast";
import { AIAlgorithmsInfo } from "@/components/AIAlgorithmsInfo";
import { CNESSTMetadata } from "@/types/cnesst";

interface PredictiveEngineProps {
  cnessData?: CNESSTMetadata | null;
}

interface PredictionInput {
  equipement: string;
  tache: string;
  quart: string;
  departement: string;
  typeRisque: string;
  experienceAnnees: number;
  age: number;
  temperature: number;
  formationRecente: boolean;
  antecedentsIncidents: number;
  heureTravail: number;
  scoreFatigue: number;
}

interface PredictionResult {
  gravitePredite: number;
  probabiliteIncident: number;
  classeNeuralNet: number;
  clusterProfil: number;
  anomalieDetectee: boolean;
  priorite: "CRITIQUE" | "ÉLEVÉE" | "MODÉRÉE";
  couleur: "🔴" | "🟠" | "🟡";
}

interface ActionPlan {
  dateCreation: string;
  priorite: string;
  contexte: {
    equipement: string;
    tache: string;
    typeRisque: string;
  };
  predictions: {
    gravite: number;
    probabiliteIncident: string;
    anomalie: boolean;
  };
  mesuresCorrectices: string[];
  responsable: string;
  echeance: string;
  suiviRequis: string;
}

const equipements = ["Convoyeur C-7", "Presse H-22", "Scie S-15", "Four F-8", "Robot R-3", "Chariot C-12"];
const taches = ["Maintenance", "Production", "Nettoyage", "Inspection", "Réglage", "Transport"];
const quarts = ["Jour", "Soir", "Nuit"];
const departements = ["Production", "Maintenance", "Logistique", "Qualité"];
const typesRisque = ["Mécanique", "Ergonomique", "Chimique", "Physique", "Psychosocial"];

export function PredictiveEngine({ cnessData }: PredictiveEngineProps) {
  const [input, setInput] = useState<PredictionInput>({
    equipement: "",
    tache: "",
    quart: "",
    departement: "",
    typeRisque: "",
    experienceAnnees: 0,
    age: 0,
    temperature: 20,
    formationRecente: false,
    antecedentsIncidents: 0,
    heureTravail: 8,
    scoreFatigue: 0,
  });

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);
  const [gptPrompt, setGptPrompt] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  // Simulation du moteur prédictif enrichie avec données CNESST
  const simulatePrediction = (inputData: PredictionInput): PredictionResult => {
    let baseGravity = 1;
    
    // Enrichissement avec données CNESST si disponibles
    if (cnessData) {
      const relevantAgent = cnessData.agentCausals.find(agent => 
        agent.categorie_risque.toLowerCase() === inputData.typeRisque.toLowerCase()
      );
      
      if (relevantAgent) {
        // Ajustement basé sur les données réelles CNESST
        baseGravity = relevantAgent.gravite_potentielle;
        console.log(`Utilisation données CNESST pour ${inputData.typeRisque}: gravité de base = ${baseGravity}`);
      }
    }
    
    // Facteurs augmentant la gravité (logique existante)
    if (inputData.quart === "Nuit") baseGravity += 0.5;
    if (inputData.experienceAnnees < 2) baseGravity += 1.0;
    if (!inputData.formationRecente) baseGravity += 0.8;
    if (inputData.antecedentsIncidents > 2) baseGravity += 0.6;
    if (inputData.scoreFatigue > 0.7) baseGravity += 0.4;
    if (["Mécanique", "Chimique"].includes(inputData.typeRisque)) baseGravity += 0.7;
    if (inputData.tache === "Maintenance") baseGravity += 0.3;

    // Graine dérivée des entrées : une même saisie produit toujours la même prédiction.
    const predictionSeed = `${inputData.typeRisque}|${inputData.tache}|${inputData.equipement}|${inputData.departement}`;
    const gravitePredite = Math.min(
      5,
      Math.max(1, Math.round(baseGravity + seededRange(predictionSeed, 0, 0.3)))
    );
    
    // Calcul probabilité enrichi avec CNESST
    let probabiliteIncident = (gravitePredite/5) * 0.8 + inputData.scoreFatigue * 0.2;
    
    if (cnessData) {
      const relevantAgent = cnessData.agentCausals.find(agent => 
        agent.categorie_risque.toLowerCase() === inputData.typeRisque.toLowerCase()
      );
      
      if (relevantAgent) {
        // Ajustement de la probabilité basé sur les données CNESST
        probabiliteIncident = (probabiliteIncident + relevantAgent.probabilite_occurrence) / 2;
      }
    }
    
    probabiliteIncident = Math.min(0.95, probabiliteIncident);
    
    let priorite: "CRITIQUE" | "ÉLEVÉE" | "MODÉRÉE";
    let couleur: "🔴" | "🟠" | "🟡";
    
    if (gravitePredite >= 4 || probabiliteIncident > 0.7) {
      priorite = "CRITIQUE";
      couleur = "🔴";
    } else if (gravitePredite >= 3 || probabiliteIncident > 0.5) {
      priorite = "ÉLEVÉE";
      couleur = "🟠";
    } else {
      priorite = "MODÉRÉE";
      couleur = "🟡";
    }

    return {
      gravitePredite,
      probabiliteIncident,
      classeNeuralNet: seededInt(`${predictionSeed}|nn`, 1, 5),
      clusterProfil: seededInt(`${predictionSeed}|cluster`, 1, 5),
      anomalieDetectee: seededUnit(`${predictionSeed}|anomalie`) > 0.9,
      priorite,
      couleur
    };
  };

  const generateActionPlan = (inputData: PredictionInput, predictions: PredictionResult): ActionPlan => {
    const now = new Date();
    let echeance: Date;
    let responsable: string;

    if (predictions.priorite === "CRITIQUE") {
      echeance = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 jour
      responsable = "Coordonnateur SST + Superviseur";
    } else if (predictions.priorite === "ÉLEVÉE") {
      echeance = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 jours
      responsable = "Superviseur";
    } else {
      echeance = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 jours
      responsable = "Responsable Département";
    }

    const mesures: string[] = [];
    
    // Mesures enrichies avec données CNESST
    if (cnessData) {
      const relevantAgent = cnessData.agentCausals.find(agent => 
        agent.categorie_risque.toLowerCase() === inputData.typeRisque.toLowerCase()
      );
      
      if (relevantAgent) {
        mesures.push(`Mesure CNESST recommandée: ${relevantAgent.mesures_prevention_type}`);
        mesures.push(`Efficacité prouvée: ${(relevantAgent.efficacite_mesure * 100).toFixed(0)}%`);
      }
    }
    
    // Mesures spécifiques selon le type de risque (logique existante)
    if (inputData.typeRisque === "Mécanique") {
      mesures.push("Vérification des protecteurs de machine");
      mesures.push("Révision procédure de verrouillage");
    } else if (inputData.typeRisque === "Ergonomique") {
      mesures.push("Évaluation ergonomique du poste");
      mesures.push("Formation gestes et postures");
    } else if (inputData.typeRisque === "Chimique") {
      mesures.push("Contrôle système de ventilation");
      mesures.push("Vérification EPI chimiques");
    }

    // Mesures générales selon le profil (logique existante)
    if (inputData.experienceAnnees < 2) {
      mesures.push("Formation complémentaire sécurité");
      mesures.push("Supervision renforcée 30 jours");
    }

    if (!inputData.formationRecente) {
      mesures.push("Recyclage formation SST obligatoire");
    }

    if (predictions.anomalieDetectee) {
      mesures.push("Investigation approfondie du contexte");
    }

    return {
      dateCreation: now.toISOString().split('T')[0],
      priorite: predictions.priorite,
      contexte: {
        equipement: inputData.equipement,
        tache: inputData.tache,
        typeRisque: inputData.typeRisque
      },
      predictions: {
        gravite: predictions.gravitePredite,
        probabiliteIncident: `${(predictions.probabiliteIncident * 100).toFixed(1)}%`,
        anomalie: predictions.anomalieDetectee
      },
      mesuresCorrectices: mesures,
      responsable,
      echeance: echeance.toLocaleDateString('fr-CA'),
      suiviRequis: predictions.priorite === "CRITIQUE" ? "Hebdomadaire" : "Mensuel"
    };
  };

  const generateGPTPrompt = (inputData: PredictionInput, predictions: PredictionResult): string => {
    let cnessContext = "";
    
    if (cnessData) {
      const relevantAgent = cnessData.agentCausals.find(agent => 
        agent.categorie_risque.toLowerCase() === inputData.typeRisque.toLowerCase()
      );
      
      if (relevantAgent) {
        cnessContext = `\n📊 DONNÉES CNESST INTÉGRÉES:
- Agent causal: ${relevantAgent.agent_causal}
- Probabilité occurrence CNESST: ${(relevantAgent.probabilite_occurrence * 100).toFixed(1)}%
- Gravité potentielle CNESST: ${relevantAgent.gravite_potentielle}/5
- Mesures préventives recommandées: ${relevantAgent.mesures_prevention_type}
- Efficacité mesures: ${(relevantAgent.efficacite_mesure * 100).toFixed(0)}%
- Coût prévention moyen: ${relevantAgent.cout_prevention_moyen.toLocaleString()}$`;
      }
    }

    return `Tu es l'Assistant IA du système PPAI (Prevention Program AI), expert en santé et sécurité au travail conforme aux normes CNESST/LMRSST.

📋 ANALYSE PRÉDICTIVE ENRICHIE CNESST - ${predictions.couleur} PRIORITÉ ${predictions.priorite}

🏭 CONTEXTE OPÉRATIONNEL:
- Équipement: ${inputData.equipement}
- Tâche: ${inputData.tache} 
- Quart: ${inputData.quart}
- Type de risque: ${inputData.typeRisque}
- Département: ${inputData.departement}

👤 PROFIL TRAVAILLEUR:
- Expérience: ${inputData.experienceAnnees} ans
- Formation récente: ${inputData.formationRecente ? '✅' : '❌'}
- Antécédents incidents: ${inputData.antecedentsIncidents}
- Score fatigue: ${inputData.scoreFatigue}/1.0

🤖 PRÉDICTIONS IA ENRICHIES:
- Gravité prédite: ${predictions.gravitePredite}/5
- Probabilité incident: ${(predictions.probabiliteIncident * 100).toFixed(1)}%
- Classification neuronale: Classe ${predictions.classeNeuralNet}
- Profil de risque: Cluster ${predictions.clusterProfil}
- Anomalie détectée: ${predictions.anomalieDetectee ? '⚠️ OUI' : '✅ Non'}${cnessContext}

🎯 MISSION:
Génère une recommandation opérationnelle immédiate incluant:
1. Mesures correctives urgentes (si priorité CRITIQUE/ÉLEVÉE)
2. Actions préventives spécifiques à ce profil de risque
3. Formations ou supervisions recommandées
4. Échéancier de mise en œuvre (format: JJ/MM/AAAA)
5. Responsable suggéré (Coordonnateur SST, Superviseur, etc.)

Réponds en français, format structuré avec bullets points, max 150 mots, orientation PPAI action immédiate enrichie CNESST.`;
  };

  const handleAnalyze = async () => {
    // Validation des données requises
    if (!input.equipement || !input.tache || !input.quart || !input.typeRisque) {
      toast({
        title: "Données incomplètes",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    
    // Simulation du délai d'analyse
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const predictions = simulatePrediction(input);
      const plan = generateActionPlan(input, predictions);
      const prompt = generateGPTPrompt(input, predictions);

      setPrediction(predictions);
      setActionPlan(plan);
      setGptPrompt(prompt);

      toast({
        title: "Analyse terminée",
        description: `Prédiction générée avec priorité ${predictions.priorite} ${cnessData ? '(enrichie CNESST)' : ''}`,
      });
    } catch (error) {
      toast({
        title: "Erreur d'analyse",
        description: "Une erreur est survenue lors de l'analyse prédictive",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with CNESST Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-600" />
              Moteur Prédicteur IA PPAI
            </div>
            {cnessData && (
              <Badge className="bg-purple-100 text-purple-800">
                ✅ Enrichi avec données CNESST
              </Badge>
            )}
          </CardTitle>
          <p className="text-sm text-gray-600">
            Système d'intelligence artificielle prédictive intégré - 6 algorithmes avancés
            {cnessData && " - Enrichi avec métadonnées sectorielles CNESST"}
          </p>
        </CardHeader>
      </Card>

      {/* CNESST Data Summary if available */}
      {cnessData && (
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <h3 className="font-medium text-purple-800 mb-2">Données CNESST intégrées</h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Secteurs analysés:</span>
                <div className="font-medium">{cnessData.lesionsSecorielles.length}</div>
              </div>
              <div>
                <span className="text-gray-600">Agents causals:</span>
                <div className="font-medium">{cnessData.agentCausals.length}</div>
              </div>
              <div>
                <span className="text-gray-600">Sièges lésions:</span>
                <div className="font-medium">{cnessData.siegesLesions.length}</div>
              </div>
              <div>
                <span className="text-gray-600">Qualité données:</span>
                <div className="font-medium">{(cnessData.validationStatus.dataQualityScore * 100).toFixed(0)}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="analysis" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analysis">Analyse Prédictive</TabsTrigger>
          <TabsTrigger value="algorithms">Algorithmes IA</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-6">
          {/* Input Form - keep existing structure but add CNESST context */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Données d'entrée pour analyse prédictive
                {cnessData && <Badge className="ml-2 bg-green-100 text-green-800">Enrichi CNESST</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* ... keep existing code (form fields) the same */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="equipement">Équipement *</Label>
                  <Select value={input.equipement} onValueChange={(value) => setInput({...input, equipement: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipements.map(eq => (
                        <SelectItem key={eq} value={eq}>{eq}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tache">Tâche *</Label>
                  <Select value={input.tache} onValueChange={(value) => setInput({...input, tache: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {taches.map(tache => (
                        <SelectItem key={tache} value={tache}>{tache}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quart">Quart *</Label>
                  <Select value={input.quart} onValueChange={(value) => setInput({...input, quart: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {quarts.map(quart => (
                        <SelectItem key={quart} value={quart}>{quart}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="typeRisque">Type de risque *</Label>
                  <Select value={input.typeRisque} onValueChange={(value) => setInput({...input, typeRisque: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {typesRisque.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="departement">Département</Label>
                  <Select value={input.departement} onValueChange={(value) => setInput({...input, departement: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {departements.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="experienceAnnees">Expérience (années)</Label>
                  <Input
                    type="number"
                    value={input.experienceAnnees}
                    onChange={(e) => setInput({...input, experienceAnnees: parseFloat(e.target.value) || 0})}
                    placeholder="ex: 2.5"
                    step="0.1"
                  />
                </div>

                <div>
                  <Label htmlFor="age">Âge</Label>
                  <Input
                    type="number"
                    value={input.age}
                    onChange={(e) => setInput({...input, age: parseInt(e.target.value) || 0})}
                    placeholder="ex: 35"
                  />
                </div>

                <div>
                  <Label htmlFor="temperature">Température (°C)</Label>
                  <Input
                    type="number"
                    value={input.temperature}
                    onChange={(e) => setInput({...input, temperature: parseFloat(e.target.value) || 20})}
                    placeholder="ex: -5"
                  />
                </div>

                <div>
                  <Label htmlFor="antecedentsIncidents">Antécédents incidents</Label>
                  <Input
                    type="number"
                    value={input.antecedentsIncidents}
                    onChange={(e) => setInput({...input, antecedentsIncidents: parseInt(e.target.value) || 0})}
                    placeholder="ex: 2"
                  />
                </div>

                <div>
                  <Label htmlFor="heureTravail">Heure de travail (0-23)</Label>
                  <Input
                    type="number"
                    value={input.heureTravail}
                    onChange={(e) => setInput({...input, heureTravail: parseInt(e.target.value) || 8})}
                    placeholder="ex: 14"
                    min="0"
                    max="23"
                  />
                </div>

                <div>
                  <Label htmlFor="scoreFatigue">Score fatigue (0-1)</Label>
                  <Input
                    type="number"
                    value={input.scoreFatigue}
                    onChange={(e) => setInput({...input, scoreFatigue: parseFloat(e.target.value) || 0})}
                    placeholder="ex: 0.8"
                    min="0"
                    max="1"
                    step="0.1"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="formationRecente"
                    checked={input.formationRecente}
                    onChange={(e) => setInput({...input, formationRecente: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="formationRecente">Formation récente</Label>
                </div>
              </div>

              <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full">
                {isAnalyzing ? (
                  <>
                    <Brain className="w-4 h-4 mr-2 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Lancer l'analyse prédictive {cnessData ? '(enrichie CNESST)' : ''}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results - keep existing structure */}
          {prediction && (
            <>
              {/* ... keep existing code (prediction results display) the same */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Résultats de prédiction IA {cnessData && "(enrichie CNESST)"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{prediction.gravitePredite}/5</div>
                      <div className="text-sm text-gray-600">Gravité prédite</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {(prediction.probabiliteIncident * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Probabilité incident</div>
                    </div>
                    <div className="text-center">
                      <Badge 
                        className={
                          prediction.priorite === "CRITIQUE" ? "bg-red-100 text-red-800" :
                          prediction.priorite === "ÉLEVÉE" ? "bg-orange-100 text-orange-800" :
                          "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {prediction.couleur} {prediction.priorite}
                      </Badge>
                      <div className="text-sm text-gray-600 mt-1">Niveau de priorité</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">Classe {prediction.classeNeuralNet}</div>
                      <div className="text-sm text-gray-600">Classification IA</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">Cluster {prediction.clusterProfil}</div>
                      <div className="text-sm text-gray-600">Profil de risque</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {prediction.anomalieDetectee ? "⚠️" : "✅"}
                      </div>
                      <div className="text-sm text-gray-600">
                        {prediction.anomalieDetectee ? "Anomalie détectée" : "Situation normale"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ... keep existing code (action plan and GPT prompt display) the same */}
              {actionPlan && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-green-600" />
                      Plan d'action automatique {cnessData && "(enrichi CNESST)"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Priorité</Label>
                        <div className="font-semibold">{actionPlan.priorite}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Responsable</Label>
                        <div className="font-semibold">{actionPlan.responsable}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Échéance</Label>
                        <div className="font-semibold flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {actionPlan.echeance}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Suivi</Label>
                        <div className="font-semibold">{actionPlan.suiviRequis}</div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Mesures correctives</Label>
                      <ul className="mt-2 space-y-1">
                        {actionPlan.mesuresCorrectices.map((mesure, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="font-medium text-blue-600">{index + 1}.</span>
                            <span>{mesure}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    Prompt GPT généré {cnessData && "(enrichi CNESST)"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={gptPrompt}
                    readOnly
                    className="min-h-[300px] font-mono text-sm"
                  />
                  <Button 
                    onClick={() => navigator.clipboard.writeText(gptPrompt)}
                    className="mt-2"
                    variant="outline"
                  >
                    Copier le prompt
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="algorithms">
          <AIAlgorithmsInfo />
        </TabsContent>
      </Tabs>
    </div>
  );
}
