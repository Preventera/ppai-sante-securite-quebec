import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Download, FileText, Wand2, Copy, Save, Settings, Zap, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ExportActions } from "@/components/ExportActions";
import { AIGenerationService } from "@/services/aiGenerationService";
import { AIConfigurationModal } from "@/components/AIConfigurationModal";

// Base de données des prompts structurée
const promptsDatabase = {
  "1": { // Construction
    "Élaboration": {
      "CoSS": "Rédige un programme de prévention CNESST complet pour un chantier de construction de plus de 20 travailleurs, incluant l'identification, l'élimination et la hiérarchisation des risques propres aux travaux en hauteur.",
      "Comité SST": "Élabore un plan d'action SST pour le comité de chantier visant la prévention des chutes et blessures liées aux échafaudages.",
      "Employeur": "Développe une politique SST construction intégrant les obligations légales CNESST et les responsabilités par corps de métier.",
      "Représentant SST": "Conçois un programme de formation sécuritaire pour les nouveaux travailleurs sur chantier, incluant l'accueil sécurité et les procédures d'urgence."
    },
    "Registre": {
      "Comité SST": "Génère un modèle de registre CNESST pour incidents et quasi-accidents dans le secteur de la construction, avec filtres par gravité, date et type d'événement.",
      "Représentant SST": "Crée un registre de signalements de situations dangereuses avec classification par zone de chantier et niveau de risque.",
      "CoSS": "Établis un registre de vérification quotidienne des équipements de protection collective sur chantier.",
      "Employeur": "Développe un registre de formation SST par corps de métier avec suivi des certifications obligatoires."
    },
    "Analyse des risques": {
      "CoSS": "Effectue une analyse AMDEC des risques liés aux travaux de gros œuvre, incluant probabilité, gravité et mesures de contrôle.",
      "Représentant SST": "Analyse les risques spécifiques aux travaux de finition intérieure selon la matrice de criticité CNESST.",
      "Comité SST": "Réalise une cartographie des risques par phase de construction avec priorisation des mesures préventives.",
      "Employeur": "Effectue une évaluation des risques liés à la coactivité entre entrepreneurs sur chantier."
    },
    "Mesures correctives": {
      "Employeur": "Établis un plan de mesures correctives suite à un accident de chantier, avec échéancier et responsabilités.",
      "Comité SST": "Développe une grille de suivi des mesures préventives avec indicateurs de performance et validation terrain.",
      "CoSS": "Conçois un protocole d'intervention d'urgence pour situations dangereuses sur chantier.",
      "Représentant SST": "Élabore un plan d'amélioration continue basé sur l'analyse des incidents récurrents."
    }
  },
  "2": { // Manufacturier
    "Élaboration": {
      "CoSS": "Rédige un programme de prévention pour une usine manufacturière de 50+ employés, incluant analyse ergonomique et prévention des TMS.",
      "Employeur": "Développe une politique de prévention intégrée couvrant les risques mécaniques, chimiques et ergonomiques en production.",
      "Représentant SST": "Conçois un programme de sécurité machine avec procédures de consignation/déconsignation.",
      "Comité SST": "Élabore un plan de prévention des accidents liés aux espaces clos en milieu industriel."
    },
    "Analyse des risques": {
      "Représentant SST": "Analyse les postes de travail en production continue pour identifier les facteurs de TMS. Propose 3 mesures correctives techniques ou organisationnelles selon la hiérarchie des moyens de contrôle.",
      "Comité SST": "Effectue une cartographie des risques par ligne de production avec évaluation quantitative des expositions.",
      "CoSS": "Réalise une analyse des risques chimiques avec évaluation de l'exposition et mesures de contrôle atmosphérique.",
      "Employeur": "Évalue les risques psychosociaux liés au travail posté et aux cadences de production."
    },
    "Registre": {
      "CoSS": "Conçois un registre d'exposition aux agents chimiques avec suivi médical et mesures d'atmosphère de travail.",
      "Comité SST": "Crée un registre des formations SST par poste de travail avec suivi des recyclages obligatoires.",
      "Représentant SST": "Développe un registre de maintenance préventive des équipements de protection collective.",
      "Employeur": "Établis un registre de surveillance médicale avec suivi des aptitudes par poste."
    }
  },
  "3": { // Municipal/Alimentaire
    "Communication": {
      "Employeur": "Crée une procédure de communication des risques liés aux produits chimiques utilisés en assainissement des réseaux d'eau. Inclure formation et affichage.",
      "Comité SST": "Développe un plan de communication sur les risques biologiques en traitement des eaux usées.",
      "Représentant SST": "Conçois un système d'affichage sécurité pour les équipes de collecte des déchets.",
      "CoSS": "Élabore une procédure de communication d'urgence pour interventions en espaces publics."
    },
    "Analyse des risques": {
      "Représentant SST": "Analyse les risques d'exposition aux agents pathogènes dans les services de collecte des déchets.",
      "CoSS": "Évalue les risques ergonomiques liés aux activités de voirie et propose des aménagements de postes.",
      "Comité SST": "Effectue une analyse des risques liés aux interventions sur réseaux souterrains.",
      "Employeur": "Évalue les risques de violence en milieu de travail pour les agents en contact avec le public."
    },
    "Élaboration": {
      "CoSS": "Rédige un programme de prévention pour services municipaux incluant risques routiers et interventions d'urgence.",
      "Employeur": "Développe une politique SST pour les services alimentaires municipaux incluant HACCP et sécurité du personnel.",
      "Représentant SST": "Conçois un programme de prévention spécifique aux activités saisonnières (déneigement, entretien estival).",
      "Comité SST": "Élabore un plan de prévention pour les événements publics et manifestations."
    }
  },
  "4": { // Bureaux
    "Programme simplifié": {
      "Représentant SST": "Rédige un programme de prévention simplifié pour un établissement de moins de 20 employés en centre d'appels. Inclure risques psychosociaux et ergonomie.",
      "Employeur": "Développe un programme de bien-être au travail intégrant prévention du stress et aménagement ergonomique.",
      "Comité SST": "Conçois un programme de prévention des TMS pour postes informatiques avec formations et pauses actives.",
      "CoSS": "Élabore un plan de prévention des risques psychosociaux incluant charge de travail et relations interpersonnelles."
    },
    "Analyse des risques": {
      "Représentant SST": "Analyse les facteurs de risques ergonomiques aux postes de travail informatisés.",
      "Employeur": "Évalue les risques psychosociaux liés au télétravail et propose des mesures d'accompagnement.",
      "Comité SST": "Effectue une analyse des risques liés à la qualité de l'air intérieur en open space.",
      "CoSS": "Analyse les risques de violence et agression dans les services d'accueil du public."
    },
    "Communication": {
      "Employeur": "Crée une campagne de sensibilisation aux bonnes pratiques ergonomiques pour le travail de bureau.",
      "Représentant SST": "Développe un plan de communication sur la prévention du stress et l'équilibre vie-travail.",
      "Comité SST": "Conçois des outils de communication sur les gestes et postures au bureau.",
      "CoSS": "Élabore une stratégie de communication sur la prévention des troubles visuels liés aux écrans."
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
  },
  "3": {
    nom: "Municipal/Alimentaire",
    description: "Services municipaux, industrie alimentaire",
    color: "bg-green-500"
  },
  "4": {
    nom: "Bureaux",
    description: "Bureaux, centres d'appels, services administratifs",
    color: "bg-purple-500"
  }
};

const acteurs = {
  "CoSS": "Coordonnateur Santé Sécurité",
  "Comité SST": "Comité de Santé et Sécurité du Travail",
  "Employeur": "Employeur",
  "Représentant SST": "Représentant en Santé et Sécurité"
};

export default function ProgramGenerator() {
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedObligation, setSelectedObligation] = useState("");
  const [selectedActeur, setSelectedActeur] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIConfig, setShowAIConfig] = useState(false);
  const [aiService] = useState(() => new AIGenerationService());
  const { toast } = useToast();

  // Obtenir les obligations disponibles pour le groupe sélectionné
  const getAvailableObligations = () => {
    if (!selectedGroup || !promptsDatabase[selectedGroup]) return [];
    return Object.keys(promptsDatabase[selectedGroup]);
  };

  // Obtenir les acteurs disponibles pour le groupe et l'obligation sélectionnés
  const getAvailableActeurs = () => {
    if (!selectedGroup || !selectedObligation || !promptsDatabase[selectedGroup]?.[selectedObligation]) return [];
    return Object.keys(promptsDatabase[selectedGroup][selectedObligation]);
  };

  const typesContenu = [
    "Document complet",
    "Grille d'évaluation", 
    "Procédure",
    "Analyse détaillée",
    "Plan d'action",
    "Formulaire"
  ];

  // Générer le prompt en temps réel
  useEffect(() => {
    if (selectedGroup && selectedObligation && selectedActeur && selectedType) {
      const basePrompt = promptsDatabase[selectedGroup]?.[selectedObligation]?.[selectedActeur];
      if (basePrompt) {
        const customPrompt = `${basePrompt}\n\nFormat de livrable : ${selectedType}\nGroupe CNESST : ${groupes[selectedGroup].nom}\nActeur responsable : ${acteurs[selectedActeur]}`;
        setGeneratedPrompt(customPrompt);
      }
    } else {
      setGeneratedPrompt("");
    }
  }, [selectedGroup, selectedObligation, selectedActeur, selectedType]);

  const generateContent = async () => {
    if (!generatedPrompt) {
      toast({
        title: "Erreur",
        description: "Veuillez compléter tous les champs avant de générer le contenu.",
        variant: "destructive"
      });
      return;
    }

    if (!aiService.hasApiKey()) {
      setShowAIConfig(true);
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await aiService.generatePreventionProgram({
        companyName: "Organisation Example",
        secteurScian: selectedGroup === "1" ? "2361" : "3211",
        groupePrioritaire: parseInt(selectedGroup),
        nombreEmployes: 25,
        activitesPrincipales: generatedPrompt,
        typeDocument: selectedType,
        acteurResponsable: acteurs[selectedActeur]
      });

      setGeneratedContent(response.content);
      
      toast({
        title: "Succès",
        description: `Programme généré avec ${aiService.getProviderName()} ! Conformité: ${response.metadata.conformite ? '✅' : '⚠️'}`,
      });
    } catch (error) {
      console.error('Erreur génération IA:', error);
      toast({
        title: "Erreur IA",
        description: error instanceof Error ? error.message : "Erreur lors de la génération IA",
        variant: "destructive"
      });
      
      await generateMockContent();
    } finally {
      setIsGenerating(false);
    }
  };

  // Fonction de fallback pour la simulation
  const generateMockContent = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockContent = `# Programme de Prévention - ${groupes[selectedGroup].nom}

## 1. Contexte et Objectifs
Ce programme de prévention s'adresse au ${acteurs[selectedActeur]} dans le cadre de l'obligation "${selectedObligation}" selon les exigences du Groupe ${selectedGroup} CNESST.

## 2. Responsabilités
- **Acteur principal :** ${acteurs[selectedActeur]}
- **Type de livrable :** ${selectedType}
- **Secteur d'application :** ${groupes[selectedGroup].description}

## 3. Méthodologie
${generatedPrompt.split('\n')[0]}

## 4. Éléments à Inclure
- Identification des dangers spécifiques
- Évaluation des risques selon la matrice CNESST
- Mesures de prévention hiérarchisées
- Plan de mise en œuvre avec échéancier
- Indicateurs de suivi et d'évaluation

## 5. Conformité Réglementaire
Ce programme respecte les exigences de la LSST et du RSST applicables au Groupe ${selectedGroup} CNESST.

## 6. Révision et Mise à Jour
Révision recommandée : annuelle ou suite à modification significative des conditions de travail.

⚠️ *Contenu généré en mode simulation - Configurez l'IA pour une génération avancée*`;

    setGeneratedContent(mockContent);
  };

  const handleConfigSet = (config: { provider: any; apiKey: string }) => {
    aiService.setConfig(config);
    toast({
      title: "IA Configurée",
      description: `${aiService.getProviderName()} est maintenant prêt à générer vos programmes !`,
    });
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    toast({
      title: "Copié",
      description: "Le prompt a été copié dans le presse-papier",
    });
  };

  const resetForm = () => {
    setSelectedGroup("");
    setSelectedObligation("");
    setSelectedActeur("");
    setSelectedType("");
    setGeneratedPrompt("");
    setGeneratedContent("");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-sst-blue">PPAI - Générateur de Programmes de Prévention CNESST</h1>
        <div className="flex items-center justify-center gap-4">
          <p className="text-gray-600">Générateur intelligent de programmes personnalisés selon les groupes CNESST</p>
          <div className="flex items-center gap-2">
            {aiService.hasApiKey() ? (
              <Badge className="bg-green-100 text-green-800">
                <Bot className="w-3 h-3 mr-1" />
                {aiService.getProviderName()}
              </Badge>
            ) : (
              <Badge variant="secondary">
                Mode Simulation
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowAIConfig(true)}>
              <Settings className="w-4 h-4 mr-1" />
              Configurer IA
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-sst-blue" />
              Configuration du Programme
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sélecteur Groupe CNESST */}
            <div className="space-y-2">
              <label className="text-sm font-medium">1. Groupe CNESST</label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un groupe CNESST" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(groupes).map(([key, groupe]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${groupe.color}`}></div>
                        <span>Groupe {key} - {groupe.nom}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedGroup && (
                <p className="text-xs text-gray-500">{groupes[selectedGroup].description}</p>
              )}
            </div>

            {/* Sélecteur Type d'obligation */}
            <div className="space-y-2">
              <label className="text-sm font-medium">2. Type d'obligation</label>
              <Select 
                value={selectedObligation} 
                onValueChange={setSelectedObligation}
                disabled={!selectedGroup}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le type d'obligation" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableObligations().map((obligation) => (
                    <SelectItem key={obligation} value={obligation}>
                      {obligation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sélecteur Acteur responsable */}
            <div className="space-y-2">
              <label className="text-sm font-medium">3. Acteur responsable</label>
              <Select 
                value={selectedActeur} 
                onValueChange={setSelectedActeur}
                disabled={!selectedObligation}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez l'acteur responsable" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableActeurs().map((acteur) => (
                    <SelectItem key={acteur} value={acteur}>
                      {acteurs[acteur]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sélecteur Type de contenu */}
            <div className="space-y-2">
              <label className="text-sm font-medium">4. Type de contenu</label>
              <Select 
                value={selectedType} 
                onValueChange={setSelectedType}
                disabled={!selectedActeur}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le type de contenu" />
                </SelectTrigger>
                <SelectContent>
                  {typesContenu.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={generateContent} 
                disabled={!generatedPrompt || isGenerating}
                className="flex-1"
              >
                {isGenerating ? "Génération..." : aiService.hasApiKey() ? `Générer avec ${aiService.getProviderName()}` : "Générer (simulation)"}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Prompt généré */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Prompt Personnalisé</span>
              {generatedPrompt && (
                <Button variant="outline" size="sm" onClick={copyPrompt}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copier
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {generatedPrompt ? (
              <div className="space-y-4">
                <Textarea 
                  value={generatedPrompt}
                  readOnly
                  className="min-h-[200px] bg-gray-50"
                />
                <div className="flex gap-2">
                  {selectedGroup && <Badge className={groupes[selectedGroup].color}>{groupes[selectedGroup].nom}</Badge>}
                  {selectedObligation && <Badge variant="outline">{selectedObligation}</Badge>}
                  {selectedActeur && <Badge variant="secondary">{selectedActeur}</Badge>}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Sélectionnez les options ci-dessus pour générer votre prompt personnalisé</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contenu généré */}
      {generatedContent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Programme de Prévention Généré</span>
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
