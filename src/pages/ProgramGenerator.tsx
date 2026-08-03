import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Wand2, 
  Settings, 
  Zap, 
  Sparkles,
  LayoutGrid,
  List,
  ArrowRight,
  Bot,
  CheckCircle,
  XCircle,
  Loader2,
  Play,
  Square,
  RotateCcw
} from "lucide-react";
import { ProgramGeneratorWizard } from "@/components/ProgramGeneratorWizard";

// Import de l'orchestrateur PPAI
import { useProgramGeneration, useOrchestrator } from "@/hooks/useOrchestrator";
import { getMetriquesExecution, type MetriquesExecution } from "@/services/executionLog";

// Import des composants existants
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Download, FileText, Copy, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ExportActions } from "@/components/ExportActions";
import { AIConfigurationModal } from "@/components/AIConfigurationModal";

// Base de données des prompts intégrée avec l'orchestrateur
const promptsDatabase = {
  "1": { // Construction
    "Elaboration": {
      "CoSS": "Rédige un programme de prévention CNESST complet pour un chantier de construction de plus de 20 travailleurs, incluant l'identification, l'élimination et la hiérarchisation des risques propres aux travaux en hauteur.",
      "Comite SST": "Élabore un plan d'action SST pour le comité de chantier visant la prévention des chutes et blessures liées aux échafaudages.",
      "Employeur": "Développe une politique SST construction intégrant les obligations légales CNESST et les responsabilités par corps de métier.",
      "Representant SST": "Conçois un programme de formation sécuritaire pour les nouveaux travailleurs sur chantier, incluant l'accueil sécurité et les procédures d'urgence."
    },
    "Registre": {
      "Comite SST": "Génère un modèle de registre CNESST pour incidents et quasi-accidents dans le secteur de la construction, avec filtres par gravité, date et type d'événement.",
      "Representant SST": "Crée un registre de signalements de situations dangereuses avec classification par zone de chantier et niveau de risque.",
      "CoSS": "Établis un registre de vérification quotidienne des équipements de protection collective sur chantier.",
      "Employeur": "Développe un registre de formation SST par corps de métier avec suivi des certifications obligatoires."
    },
    "Analyse des risques": {
      "CoSS": "Effectue une analyse AMDEC des risques liés aux travaux de gros œuvre, incluant probabilité, gravité et mesures de contrôle.",
      "Representant SST": "Analyse les risques spécifiques aux travaux de finition intérieure selon la matrice de criticité CNESST.",
      "Comite SST": "Réalise une cartographie des risques par phase de construction avec priorisation des mesures préventives.",
      "Employeur": "Effectue une évaluation des risques liés à la coactivité entre entrepreneurs sur chantier."
    }
  },
  "2": { // Manufacturier
    "Elaboration": {
      "CoSS": "Rédige un programme de prévention pour une usine manufacturière de 50+ employés, incluant analyse ergonomique et prévention des TMS.",
      "Employeur": "Développe une politique de prévention intégrée couvrant les risques mécaniques, chimiques et ergonomiques en production.",
      "Representant SST": "Conçois un programme de sécurité machine avec procédures de consignation/déconsignation.",
      "Comite SST": "Élabore un plan de prévention des accidents liés aux espaces clos en milieu industriel."
    },
    "Analyse des risques": {
      "Representant SST": "Analyse les postes de travail en production continue pour identifier les facteurs de TMS. Propose 3 mesures correctives techniques ou organisationnelles selon la hiérarchie des moyens de contrôle.",
      "Comite SST": "Effectue une cartographie des risques par ligne de production avec évaluation quantitative des expositions.",
      "CoSS": "Réalise une analyse des risques chimiques avec évaluation de l'exposition et mesures de contrôle atmosphérique.",
      "Employeur": "Évalue les risques psychosociaux liés au travail posté et aux cadences de production."
    },
    "Registre": {
      "CoSS": "Conçois un registre d'exposition aux agents chimiques avec suivi médical et mesures d'atmosphère de travail.",
      "Comite SST": "Crée un registre des formations SST par poste de travail avec suivi des recyclages obligatoires.",
      "Representant SST": "Développe un registre de maintenance préventive des équipements de protection collective.",
      "Employeur": "Établis un registre de surveillance médicale avec suivi des aptitudes par poste."
    }
  }
};

const groupes = {
  "1": {
    nom: "Construction",
    description: "Chantiers de construction, rénovation, démolition",
    color: "bg-orange-500"
  },
  "2": {
    nom: "Manufacturier",
    description: "Industries manufacturières, usines de production",
    color: "bg-blue-500"
  }
};

const acteurs = {
  "CoSS": "Coordonnateur Santé Sécurité",
  "Comite SST": "Comité de Santé et Sécurité du Travail",
  "Employeur": "Employeur",
  "Representant SST": "Représentant en Santé et Sécurité"
};

// Composant de monitoring en temps réel
function OrchestrationMonitor({ state, executionHistory }: { state: any, executionHistory: any[] }) {
  if (!state.isExecuting && !state.results) return null;

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {state.isExecuting ? (
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          ) : state.error ? (
            <XCircle className="w-5 h-5 text-red-600" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-600" />
          )}
          État de l'Orchestration PPAI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {state.isExecuting && (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progression</span>
                <span>{state.progress}%</span>
              </div>
              <Progress value={state.progress} className="w-full" />
            </div>
            
            {state.currentStep && (
              <div className="bg-white p-3 rounded-md border">
                <p className="text-sm font-medium text-blue-700">
                  Étape actuelle: {state.currentStep}
                </p>
              </div>
            )}
          </>
        )}

        {state.error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        {state.results && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Programme généré avec succès par l'orchestrateur PPAI
            </AlertDescription>
          </Alert>
        )}

        {/* Historique récent */}
        {executionHistory.length > 0 && (
          <div className="text-xs text-gray-600">
            <p>Dernières exécutions: {executionHistory.slice(0, 3).map(e => e.execution_status).join(', ')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Composant générateur classique avec orchestrateur intégré
function ClassicProgramGenerator() {
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedObligation, setSelectedObligation] = useState("");
  const [selectedActeur, setSelectedActeur] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [showAIConfig, setShowAIConfig] = useState(false);
  
  // Integration avec l'orchestrateur PPAI
  const { execute, state, executionHistory, cancelExecution, resetState } = useProgramGeneration();
  const { toast } = useToast();

  const getAvailableObligations = () => {
    if (!selectedGroup || !promptsDatabase[selectedGroup]) return [];
    return Object.keys(promptsDatabase[selectedGroup]);
  };

  const getAvailableActeurs = () => {
    if (!selectedGroup || !selectedObligation || !promptsDatabase[selectedGroup]?.[selectedObligation]) return [];
    return Object.keys(promptsDatabase[selectedGroup][selectedObligation]);
  };

  const generatePrompt = () => {
    if (selectedGroup && selectedObligation && selectedActeur) {
      const prompt = promptsDatabase[selectedGroup]?.[selectedObligation]?.[selectedActeur];
      if (prompt) {
        setGeneratedPrompt(prompt);
        resetState(); // Reset l'état de l'orchestrateur
      }
    }
  };

  // Génération avec l'orchestrateur PPAI
  const generateWithOrchestrator = async () => {
    if (!generatedPrompt) {
      toast({
        title: "Erreur",
        description: "Veuillez d'abord générer un prompt",
        variant: "destructive"
      });
      return;
    }

    try {
      // Préparer les données pour l'orchestrateur
      const inputData = {
        companyProfile: {
          name: "Entreprise Test",
          sector: selectedGroup === "1" ? "construction" : "manufacturing",
          priority_group: groupes[selectedGroup]?.nom,
          size: selectedGroup === "1" ? "20+" : "50+",
          actor_responsible: selectedActeur
        },
        prompt_context: generatedPrompt,
        document_type: selectedObligation,
        sector_code: selectedGroup,
        responsibility_actor: selectedActeur,
        requirements: {
          cnesst_compliance: true,
          risk_analysis: selectedObligation === "Analyse des risques",
          registry_format: selectedObligation === "Registre",
          prevention_program: selectedObligation === "Elaboration"
        }
      };

      // Exécuter le workflow avec callbacks de progression
      const result = await execute(inputData, {
        onProgress: (step, progress) => {
          console.log(`Orchestrateur - ${step}: ${progress}%`);
        },
        onStepComplete: (step, stepResult) => {
          console.log(`Étape terminée - ${step}:`, stepResult);
        }
      });

      toast({
        title: "✅ Génération réussie",
        description: "Programme SST généré par l'orchestrateur PPAI",
      });

    } catch (error) {
      console.error('Erreur orchestrateur:', error);
      toast({
        title: "❌ Erreur de génération",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive"
      });
    }
  };

  const handleConfigSet = () => {
    setShowAIConfig(false);
    toast({
      title: "Configuration mise à jour",
      description: "Les paramètres IA ont été sauvegardés",
    });
  };

  // Auto-reset quand les sélections changent
  useEffect(() => {
    resetState();
  }, [selectedGroup, selectedObligation, selectedActeur, resetState]);

  return (
    <div className="space-y-6">
      {/* Interface classique */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sélection du groupe */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <LayoutGrid className="w-5 h-5" />
              Secteur d'activité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un secteur" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(groupes).map(([key, groupe]) => (
                  <SelectItem key={key} value={key}>
                    {groupe.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Sélection de l'obligation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Type de document
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={selectedObligation} 
              onValueChange={setSelectedObligation}
              disabled={!selectedGroup}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type de document" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableObligations().map((obligation) => (
                  <SelectItem key={obligation} value={obligation}>
                    {obligation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Sélection de l'acteur */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Acteur responsable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={selectedActeur} 
              onValueChange={setSelectedActeur}
              disabled={!selectedObligation}
            >
              <SelectTrigger>
                <SelectValue placeholder="Acteur responsable" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableActeurs().map((acteur) => (
                  <SelectItem key={acteur} value={acteur}>
                    {acteurs[acteur]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button onClick={generatePrompt} disabled={!selectedActeur}>
          <Wand2 className="w-4 h-4 mr-2" />
          Générer le prompt
        </Button>
        
        <Button 
          onClick={generateWithOrchestrator} 
          disabled={!generatedPrompt || state.isExecuting}
          variant="default"
          className="bg-blue-600 hover:bg-blue-700"
        >
          {state.isExecuting ? (
            <>
              <Loader2 className="animate-spin w-4 h-4 mr-2" />
              Orchestration...
            </>
          ) : (
            <>
              <Bot className="w-4 h-4 mr-2" />
              Générer avec PPAI
            </>
          )}
        </Button>

        {state.isExecuting && (
          <Button variant="outline" onClick={cancelExecution}>
            <Square className="w-4 h-4 mr-2" />
            Annuler
          </Button>
        )}

        {state.error && (
          <Button variant="outline" onClick={resetState}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        )}
        
        <Button variant="outline" onClick={() => setShowAIConfig(true)}>
          <Settings className="w-4 h-4 mr-2" />
          Configurer IA
        </Button>
      </div>

      {/* Monitoring de l'orchestration */}
      <OrchestrationMonitor state={state} executionHistory={executionHistory} />

      {/* Prompt généré */}
      {generatedPrompt && (
        <Card>
          <CardHeader>
            <CardTitle>Prompt généré</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={generatedPrompt}
              readOnly
              className="min-h-[100px] bg-gray-50"
            />
            <div className="flex gap-2 mt-4">
              {selectedGroup && <Badge className={groupes[selectedGroup].color}>{groupes[selectedGroup].nom}</Badge>}
              {selectedObligation && <Badge variant="outline">{selectedObligation}</Badge>}
              {selectedActeur && <Badge variant="secondary">{selectedActeur}</Badge>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contenu généré par l'orchestrateur */}
      {state.results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Programme SST Généré par PPAI
              </span>
              <ExportActions
                data={[{ content: JSON.stringify(state.results, null, 2) }]}
                filename={`programme-prevention-ppai-${selectedGroup}-${Date.now()}`}
                type="analytics"
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white border rounded-lg p-6 space-y-4">
              {/* Résumé exécutif */}
              <div className="border-l-4 border-blue-500 pl-4 bg-blue-50 p-4 rounded-r">
                <h3 className="font-semibold text-blue-800 mb-2">Résumé Exécutif</h3>
                <p className="text-sm text-blue-700">
                  Programme généré par l'orchestrateur PPAI pour le secteur {groupes[selectedGroup]?.nom}
                  avec l'acteur {acteurs[selectedActeur]} pour {selectedObligation}.
                </p>
              </div>

              {/* Contenu détaillé */}
              <div className="space-y-3">
                <h4 className="font-medium">Détails de l'exécution :</h4>
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded border overflow-auto max-h-96">
{JSON.stringify(state.results, null, 2)}
                </pre>
              </div>

              {/* Métadonnées */}
              {state.executionId && (
                <div className="text-xs text-gray-500 border-t pt-2">
                  ID d'exécution: {state.executionId} | Généré le {new Date().toLocaleString()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de configuration IA */}
      <AIConfigurationModal
        open={showAIConfig}
        onOpenChange={setShowAIConfig}
        onConfigSet={handleConfigSet}
      />
    </div>
  );
}

// Composant principal avec toggle
export default function ProgramGenerator() {
  const [viewMode, setViewMode] = useState<"wizard" | "classic">("wizard");
  
  // Hook pour monitoring global
  const { performanceMetrics, executionHistory } = useOrchestrator();

  // Mesures issues du journal des exécutions. `null` tant qu'aucune génération
  // réelle n'a eu lieu — c'est ce qui distingue une mesure d'une illustration.
  const [metriquesReelles, setMetriquesReelles] = useState<MetriquesExecution | null>(null);
  useEffect(() => {
    let annule = false;
    getMetriquesExecution().then(m => { if (!annule) setMetriquesReelles(m); });
    return () => { annule = true; };
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête avec sélecteur de mode */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-blue-600" />
                Générateur de Programmes SST
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Composez des programmes de prévention selon le contenu minimal attendu par la CNESST — leur conformité relève de l'employeur
              </p>
            </div>
            
            {/* Toggle entre les modes */}
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">Mode d'interface:</span>
              <ToggleGroup 
                type="single" 
                value={viewMode} 
                onValueChange={(value) => value && setViewMode(value as "wizard" | "classic")}
                className="bg-gray-100 p-1 rounded-lg"
              >
                <ToggleGroupItem 
                  value="wizard" 
                  className="data-[state=on]:bg-blue-600 data-[state=on]:text-white"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Assistant (Nouveau)
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="classic"
                  className="data-[state=on]:bg-gray-600 data-[state=on]:text-white"
                >
                  <List className="w-4 h-4 mr-2" />
                  Classique
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {/* Statistiques de génération.

              Les valeurs affichées viennent du journal des exécutions dès
              qu'une génération a eu lieu. À défaut — mode démonstration, ou
              locataire sans historique — ce sont des valeurs d'illustration,
              et le bandeau le dit. Elles étaient auparavant présentées sans
              distinction, ce qui donnait à des constantes en dur l'apparence
              d'une mesure. */}
          {performanceMetrics && (
            <div className={`mt-4 p-3 rounded border grid grid-cols-4 gap-4 text-sm ${
              metriquesReelles ? 'bg-blue-50' : 'bg-amber-50 border-amber-300'
            }`}>
              <div className="text-center">
                <div className="font-semibold text-blue-600">{performanceMetrics.total_executions || 0}</div>
                <div className="text-gray-600">Exécutions totales</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-600">{performanceMetrics.success_rate?.toFixed(1) || 0}%</div>
                <div className="text-gray-600">Taux de succès</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-purple-600">{Math.round(performanceMetrics.average_execution_time || 0)}ms</div>
                <div className="text-gray-600">Temps moyen</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-orange-600">{executionHistory.filter(e => e.execution_status === 'running').length}</div>
                <div className="text-gray-600">En cours</div>
              </div>
              <div className="col-span-4 text-center text-xs text-gray-600 border-t pt-2">
                {metriquesReelles
                  ? `Mesuré sur ${metriquesReelles.totalExecutions} génération(s) réelle(s) — ${
                      Object.entries(metriquesReelles.repartitionMoteur)
                        .map(([m, n]) => `${m} : ${n}`)
                        .join(', ')
                    }`
                  : "⚠ Valeurs d'illustration — aucune génération enregistrée pour cette organisation."}
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Badge de mode actuel */}
      <div className="flex justify-center">
        <Badge 
          variant={viewMode === "wizard" ? "default" : "secondary"}
          className="px-4 py-2 text-sm"
        >
          {viewMode === "wizard" ? (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Mode Assistant Interactif - Interface moderne avec étapes guidées
            </>
          ) : (
            <>
              <Settings className="w-4 h-4 mr-2" />
              Mode Classique - Interface traditionnelle avec orchestrateur PPAI intégré
            </>
          )}
        </Badge>
      </div>

      {/* Rendu conditionnel */}
      {viewMode === "wizard" ? (
        <ProgramGeneratorWizard />
      ) : (
        <ClassicProgramGenerator />
      )}
    </div>
  );
}