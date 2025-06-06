import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { 
  Wand2, 
  Settings, 
  Zap, 
  Sparkles,
  LayoutGrid,
  List,
  ArrowRight
} from "lucide-react";
import { ProgramGeneratorWizard } from "@/components/ProgramGeneratorWizard";

// Import du générateur classique (composants existants)
import { useState as useClassicState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Download, FileText, Copy, Save, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ExportActions } from "@/components/ExportActions";
import { AIGenerationService } from "@/services/aiGenerationService";
import { AIConfigurationModal } from "@/components/AIConfigurationModal";

// Base de données des prompts (version simplifiée pour éviter les erreurs d'encodage)
const promptsDatabase = {
  "1": { // Construction
    "Elaboration": {
      "CoSS": "Redige un programme de prevention CNESST complet pour un chantier de construction de plus de 20 travailleurs, incluant l'identification, l'elimination et la hierarchisation des risques propres aux travaux en hauteur.",
      "Comite SST": "Elabore un plan d'action SST pour le comite de chantier visant la prevention des chutes et blessures liees aux echafaudages.",
      "Employeur": "Developpe une politique SST construction integrant les obligations legales CNESST et les responsabilites par corps de metier.",
      "Representant SST": "Concois un programme de formation securitaire pour les nouveaux travailleurs sur chantier, incluant l'accueil securite et les procedures d'urgence."
    },
    "Registre": {
      "Comite SST": "Genere un modele de registre CNESST pour incidents et quasi-accidents dans le secteur de la construction, avec filtres par gravite, date et type d'evenement.",
      "Representant SST": "Cree un registre de signalements de situations dangereuses avec classification par zone de chantier et niveau de risque.",
      "CoSS": "Etablis un registre de verification quotidienne des equipements de protection collective sur chantier.",
      "Employeur": "Developpe un registre de formation SST par corps de metier avec suivi des certifications obligatoires."
    },
    "Analyse des risques": {
      "CoSS": "Effectue une analyse AMDEC des risques lies aux travaux de gros oeuvre, incluant probabilite, gravite et mesures de controle.",
      "Representant SST": "Analyse les risques specifiques aux travaux de finition interieure selon la matrice de criticite CNESST.",
      "Comite SST": "Realise une cartographie des risques par phase de construction avec priorisation des mesures preventives.",
      "Employeur": "Effectue une evaluation des risques lies a la coactivite entre entrepreneurs sur chantier."
    }
  },
  "2": { // Manufacturier
    "Elaboration": {
      "CoSS": "Redige un programme de prevention pour une usine manufacturiere de 50+ employes, incluant analyse ergonomique et prevention des TMS.",
      "Employeur": "Developpe une politique de prevention integree couvrant les risques mecaniques, chimiques et ergonomiques en production.",
      "Representant SST": "Concois un programme de securite machine avec procedures de consignation/deconsignation.",
      "Comite SST": "Elabore un plan de prevention des accidents lies aux espaces clos en milieu industriel."
    },
    "Analyse des risques": {
      "Representant SST": "Analyse les postes de travail en production continue pour identifier les facteurs de TMS. Propose 3 mesures correctives techniques ou organisationnelles selon la hierarchie des moyens de controle.",
      "Comite SST": "Effectue une cartographie des risques par ligne de production avec evaluation quantitative des expositions.",
      "CoSS": "Realise une analyse des risques chimiques avec evaluation de l'exposition et mesures de controle atmospherique.",
      "Employeur": "Evalue les risques psychosociaux lies au travail poste et aux cadences de production."
    },
    "Registre": {
      "CoSS": "Concois un registre d'exposition aux agents chimiques avec suivi medical et mesures d'atmosphere de travail.",
      "Comite SST": "Cree un registre des formations SST par poste de travail avec suivi des recyclages obligatoires.",
      "Representant SST": "Developpe un registre de maintenance preventive des equipements de protection collective.",
      "Employeur": "Etablis un registre de surveillance medicale avec suivi des aptitudes par poste."
    }
  }
};

const groupes = {
  "1": {
    nom: "Construction",
    description: "Chantiers de construction, renovation, demolition",
    color: "bg-orange-500"
  },
  "2": {
    nom: "Manufacturier",
    description: "Industries manufacturieres, usines de production",
    color: "bg-blue-500"
  }
};

const acteurs = {
  "CoSS": "Coordonnateur Sante Securite",
  "Comite SST": "Comite de Sante et Securite du Travail",
  "Employeur": "Employeur",
  "Representant SST": "Representant en Sante et Securite"
};

// Composant générateur classique (version simplifiée)
function ClassicProgramGenerator() {
  const [selectedGroup, setSelectedGroup] = useClassicState("");
  const [selectedObligation, setSelectedObligation] = useClassicState("");
  const [selectedActeur, setSelectedActeur] = useClassicState("");
  const [generatedPrompt, setGeneratedPrompt] = useClassicState("");
  const [generatedContent, setGeneratedContent] = useClassicState("");
  const [isGenerating, setIsGenerating] = useClassicState(false);
  const [showAIConfig, setShowAIConfig] = useClassicState(false);
  const [aiService] = useClassicState(() => new AIGenerationService());
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
      }
    }
  };

  const generateWithAI = async () => {
    if (!generatedPrompt) {
      toast({
        title: "Erreur",
        description: "Veuillez d'abord generer un prompt",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Simulation pour la démo
      await new Promise(resolve => setTimeout(resolve, 2000));
      setGeneratedContent(`Programme genere par IA base sur:\n\n${generatedPrompt}\n\n[Contenu detaille du programme SST...]`);
      
      toast({
        title: "✅ Generation reussie",
        description: "Votre programme SST a ete genere avec succes",
      });
    } catch (error) {
      toast({
        title: "❌ Erreur de generation",
        description: "Impossible de generer le programme",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfigSet = () => {
    setShowAIConfig(false);
    toast({
      title: "Configuration mise à jour",
      description: "Les paramètres IA ont été sauvegardés",
    });
  };

  return (
    <div className="space-y-6">
      {/* Interface classique */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sélection du groupe */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <LayoutGrid className="w-5 h-5" />
              Secteur d'activite
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
          Generer le prompt
        </Button>
        <Button 
          onClick={generateWithAI} 
          disabled={!generatedPrompt || isGenerating}
          variant="default"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
              Generation...
            </>
          ) : (
            <>
              <Bot className="w-4 h-4 mr-2" />
              Generer avec IA
            </>
          )}
        </Button>
        <Button variant="outline" onClick={() => setShowAIConfig(true)}>
          <Settings className="w-4 h-4 mr-2" />
          Configurer IA
        </Button>
      </div>

      {/* Prompt généré */}
      {generatedPrompt && (
        <Card>
          <CardHeader>
            <CardTitle>Prompt genere</CardTitle>
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

      {/* Contenu généré */}
      {generatedContent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Programme de Prevention Genere</span>
              <ExportActions
                data={[{content: generatedContent}]}
                filename={`programme-prevention-${selectedGroup}-${Date.now()}`}
                type="analytics"
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white border rounded-lg p-6">
              <pre className="whitespace-pre-wrap text-sm">{generatedContent}</pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de configuration IA */}
      <AIConfigurationModal
        open={showAIConfig}
        onOpenChange={setShowAIConfig}
        onConfigSet={handleConfigSet}
        currentConfig={aiService.getConfig()}
      />
    </div>
  );
}

// Composant principal avec toggle
export default function ProgramGenerator() {
  const [viewMode, setViewMode] = useState<"wizard" | "classic">("wizard");

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête avec sélecteur de mode */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-blue-600" />
                Generateur de Programmes SST
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Creez des programmes de prevention conformes aux exigences CNESST
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
              Mode Assistant Interactif - Interface moderne avec etapes guidees
            </>
          ) : (
            <>
              <Settings className="w-4 h-4 mr-2" />
              Mode Classique - Interface traditionnelle avec selections
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