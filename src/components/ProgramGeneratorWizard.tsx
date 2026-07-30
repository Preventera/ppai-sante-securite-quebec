import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ChevronRight, 
  ChevronLeft, 
  Building, 
  Users, 
  FileText, 
  Wand2, 
  CheckCircle,
  AlertTriangle,
  Eye,
  Download,
  Shield,
  TrendingUp,
  Clock,
  Target,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AIGenerationService } from "@/services/aiGenerationService";
import { programService } from "@/services/programService";
import { riskIntegrationService, RiskAnalysis, ProgramSuggestion } from "@/services/RiskIntegrationService";

// Types
interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  isCompleted: boolean;
  isActive: boolean;
}

interface ProgramConfig {
  secteur: string;
  obligation: string;
  acteur: string;
  companyInfo: {
    name: string;
    employees: number;
    activities: string;
  };
  riskIntegration: {
    enabled: boolean;
    analysis?: RiskAnalysis;
    suggestions?: ProgramSuggestion[];
  };
  customizations: string[];
}

// Base de données des secteurs
const SECTEURS = {
  "1": {
    nom: "Construction",
    description: "Chantiers, rénovation, démolition",
    color: "bg-orange-500",
    icon: "🏗️",
    obligations: ["Élaboration", "Registre", "Analyse des risques", "Mesures correctives"]
  },
  "2": {
    nom: "Manufacturier", 
    description: "Industries, usines de production",
    color: "bg-blue-500",
    icon: "🏭",
    obligations: ["Élaboration", "Analyse des risques", "Registre"]
  },
  "3": {
    nom: "Municipal/Alimentaire",
    description: "Services publics, industrie alimentaire", 
    color: "bg-green-500",
    icon: "🏛️",
    obligations: ["Communication", "Analyse des risques", "Élaboration"]
  },
  "4": {
    nom: "Bureaux",
    description: "Bureaux, centres d'appels, administratif",
    color: "bg-purple-500", 
    icon: "💼",
    obligations: ["Programme simplifié", "Analyse des risques", "Communication"]
  }
};

const ACTEURS = {
  "CoSS": {
    nom: "Coordonnateur SST",
    description: "Expert en santé-sécurité",
    icon: "👷‍♂️"
  },
  "Comité SST": {
    nom: "Comité SST", 
    description: "Représentants paritaires",
    icon: "👥"
  },
  "Employeur": {
    nom: "Employeur",
    description: "Direction de l'entreprise", 
    icon: "🏢"
  },
  "Représentant SST": {
    nom: "Représentant SST",
    description: "Délégué des travailleurs",
    icon: "🛡️"
  }
};

export function ProgramGeneratorWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState<ProgramConfig>({
    secteur: "",
    obligation: "",
    acteur: "",
    companyInfo: {
      name: "",
      employees: 0,
      activities: ""
    },
    riskIntegration: {
      enabled: true
    },
    customizations: []
  });
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingRisks, setIsLoadingRisks] = useState(false);
  const { toast } = useToast();

  const steps: WizardStep[] = [
    {
      id: "secteur",
      title: "Secteur d'activité",
      description: "Choisissez votre secteur CNESST",
      icon: Building,
      isCompleted: !!config.secteur,
      isActive: currentStep === 0
    },
    {
      id: "obligation", 
      title: "Type de document",
      description: "Sélectionnez le type de programme",
      icon: FileText,
      isCompleted: !!config.obligation,
      isActive: currentStep === 1
    },
    {
      id: "acteur",
      title: "Acteur responsable", 
      description: "Qui va utiliser ce programme",
      icon: Users,
      isCompleted: !!config.acteur,
      isActive: currentStep === 2
    },
    {
      id: "company",
      title: "Informations entreprise",
      description: "Détails sur votre organisation",
      icon: Building,
      isCompleted: !!config.companyInfo.name && config.companyInfo.employees > 0,
      isActive: currentStep === 3
    },
    {
      id: "risks",
      title: "Intégration des risques",
      description: "Analyse de votre registre",
      icon: Shield,
      isCompleted: !!config.riskIntegration.analysis,
      isActive: currentStep === 4
    },
    {
      id: "generation",
      title: "Génération",
      description: "Création de votre programme",
      icon: Wand2,
      isCompleted: !!generatedContent,
      isActive: currentStep === 5
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  // Chargement automatique des risques quand secteur/acteur changent
  useEffect(() => {
    if (config.secteur && config.acteur && config.riskIntegration.enabled) {
      loadRiskAnalysis();
    }
  }, [config.secteur, config.acteur]);

  const loadRiskAnalysis = async () => {
    setIsLoadingRisks(true);
    try {
      const analysis = await riskIntegrationService.getRiskAnalysis(config.secteur);
      const suggestions = await riskIntegrationService.generateProgramSuggestions(
        config.secteur,
        config.obligation,
        config.acteur
      );

      setConfig(prev => ({
        ...prev,
        riskIntegration: {
          ...prev.riskIntegration,
          analysis,
          suggestions
        }
      }));

      toast({
        title: "✅ Risques analysés",
        description: `${analysis.summary.totalRisks} risques trouvés, dont ${analysis.criticalRisks.length} critiques`,
      });
    } catch (error) {
      console.error('Erreur lors du chargement des risques:', error);
      toast({
        title: "⚠️ Analyse des risques indisponible",
        description: "Le programme sera généré sans intégration des risques",
        variant: "destructive"
      });
    } finally {
      setIsLoadingRisks(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return !!config.secteur;
      case 1: return !!config.obligation;
      case 2: return !!config.acteur;
      case 3: return !!config.companyInfo.name && config.companyInfo.employees > 0;
      case 4: return true; // Risques optionnels
      default: return true;
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1 && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateProgram = async () => {
    setIsGenerating(true);
    try {
      const aiService = new AIGenerationService();
      const secteurNom = SECTEURS[config.secteur]?.nom ?? config.secteur;
      const acteurNom = ACTEURS[config.acteur]?.nom ?? config.acteur;

      // Le registre alimente réellement la génération lorsque l'intégration est active.
      const registryRisks = config.riskIntegration.enabled
        ? await riskIntegrationService.getRisks()
        : [];

      const basePrompt = `Générer un programme ${config.obligation} pour ${acteurNom} dans le secteur ${secteurNom}`;
      const customPrompt =
        config.riskIntegration.analysis && config.riskIntegration.suggestions
          ? riskIntegrationService.generateEnrichedPrompt(
              basePrompt,
              config.riskIntegration.analysis,
              config.riskIntegration.suggestions
            )
          : basePrompt;

      const result = await aiService.generatePreventionProgram({
        companyName: config.companyInfo.name,
        secteurScian: secteurNom,
        groupePrioritaire: Number(config.secteur) || 1,
        nombreEmployes: config.companyInfo.employees,
        activitesPrincipales: config.companyInfo.activities,
        typeDocument: config.obligation || 'Programme de prévention',
        acteurResponsable: acteurNom,
        customPrompt,
        registryRisks
      });

      setGeneratedContent(result.content);

      // Le programme est persisté pour être retrouvé dans la page « Programmes ».
      await programService.save({
        title: `${config.obligation || 'Programme de prévention'} — ${config.companyInfo.name}`,
        description: `Secteur ${secteurNom} · responsable ${acteurNom}`,
        documentType: config.obligation || 'Programme de prévention',
        sector: secteurNom,
        responsibleActor: acteurNom,
        content: result.content,
        metadata: result.metadata
      });

      const generatedByClaude = result.metadata.source === 'claude';
      toast({
        title: generatedByClaude ? "✅ Programme généré par Claude" : "✅ Programme généré localement",
        description: `${result.metadata.risksAnalyzed ?? 0} risque(s) intégré(s), dont ${result.metadata.criticalRisksCount ?? 0} critique(s)${generatedByClaude ? '' : ' — moteur local, aucune clé API requise'}`
      });
    } catch (error) {
      toast({
        title: "❌ Erreur de génération",
        description: error instanceof Error ? error.message : "Impossible de générer le programme",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Sélectionnez votre secteur d'activité</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(SECTEURS).map(([key, secteur]) => (
                <Card 
                  key={key}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    config.secteur === key ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setConfig({...config, secteur: key, obligation: "", riskIntegration: {...config.riskIntegration, analysis: undefined}})}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{secteur.icon}</span>
                      <div>
                        <h4 className="font-semibold">{secteur.nom}</h4>
                        <p className="text-sm text-gray-600">{secteur.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Type de document SST</h3>
            {config.secteur && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SECTEURS[config.secteur].obligations.map((obligation) => (
                  <Card
                    key={obligation}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      config.obligation === obligation ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => setConfig({...config, obligation})}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-6 h-6 text-blue-600" />
                        <div>
                          <h4 className="font-semibold">{obligation}</h4>
                          <p className="text-sm text-gray-600">
                            Document réglementaire CNESST
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Acteur responsable</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(ACTEURS).map(([key, acteur]) => (
                <Card
                  key={key}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    config.acteur === key ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setConfig({...config, acteur: key})}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{acteur.icon}</span>
                      <div>
                        <h4 className="font-semibold">{acteur.nom}</h4>
                        <p className="text-sm text-gray-600">{acteur.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Informations sur votre entreprise</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nom de l'entreprise</label>
                <input
                  type="text"
                  className="w-full p-3 border rounded-lg"
                  placeholder="Ex: Construction ABC Inc."
                  value={config.companyInfo.name}
                  onChange={(e) => setConfig({
                    ...config,
                    companyInfo: {...config.companyInfo, name: e.target.value}
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Nombre d'employés</label>
                <input
                  type="number"
                  className="w-full p-3 border rounded-lg"
                  placeholder="Ex: 25"
                  value={config.companyInfo.employees || ""}
                  onChange={(e) => setConfig({
                    ...config,
                    companyInfo: {...config.companyInfo, employees: parseInt(e.target.value) || 0}
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Activités principales</label>
                <Textarea
                  className="w-full"
                  placeholder="Décrivez vos principales activités..."
                  value={config.companyInfo.activities}
                  onChange={(e) => setConfig({
                    ...config,
                    companyInfo: {...config.companyInfo, activities: e.target.value}
                  })}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Intégration du registre des risques</h3>
            
            {/* Toggle d'activation */}
            <Card className="bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      Analyse intelligente des risques
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Intégrer automatiquement vos risques identifiés pour un programme personnalisé
                    </p>
                  </div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.riskIntegration.enabled}
                      onChange={(e) => setConfig({
                        ...config,
                        riskIntegration: {...config.riskIntegration, enabled: e.target.checked}
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm">Activer</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            {config.riskIntegration.enabled && (
              <>
                {/* État du chargement */}
                {isLoadingRisks && (
                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      Analyse des risques en cours...
                    </AlertDescription>
                  </Alert>
                )}

                {/* Résultats de l'analyse */}
                {config.riskIntegration.analysis && (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="w-5 h-5 text-green-600" />
                          Analyse complétée
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {config.riskIntegration.analysis.summary.totalRisks}
                            </div>
                            <div className="text-sm text-gray-600">Risques totaux</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {config.riskIntegration.analysis.criticalRisks.length}
                            </div>
                            <div className="text-sm text-gray-600">Critiques</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                              {config.riskIntegration.analysis.moderateRisks.length}
                            </div>
                            <div className="text-sm text-gray-600">Modérés</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-600">
                              {config.riskIntegration.analysis.summary.averageIndex.toFixed(1)}
                            </div>
                            <div className="text-sm text-gray-600">Index moyen</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Risques critiques */}
                    {config.riskIntegration.analysis.criticalRisks.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                            Risques critiques identifiés
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {config.riskIntegration.analysis.criticalRisks.slice(0, 3).map((risk) => (
                              <div key={risk.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                <div>
                                  <div className="font-medium">{risk.name}</div>
                                  <div className="text-sm text-gray-600">{risk.phase} • {risk.category}</div>
                                </div>
                                <Badge variant="destructive">{risk.initialRisk}/25</Badge>
                              </div>
                            ))}
                            {config.riskIntegration.analysis.criticalRisks.length > 3 && (
                              <div className="text-sm text-gray-600 text-center pt-2">
                                +{config.riskIntegration.analysis.criticalRisks.length - 3} autres risques critiques
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Suggestions de programme */}
                    {config.riskIntegration.suggestions && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-blue-600" />
                            Suggestions personnalisées
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {config.riskIntegration.suggestions.slice(0, 3).map((suggestion, index) => (
                              <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                                <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-medium">
                                  {suggestion.priority}
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium">{suggestion.sectionTitle}</div>
                                  <div className="text-sm text-gray-600">
                                    Basé sur: {suggestion.basedOnRisks.slice(0, 2).join(', ')}
                                    {suggestion.basedOnRisks.length > 2 && ` +${suggestion.basedOnRisks.length - 2} autres`}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Bouton de rechargement */}
                {!isLoadingRisks && (
                  <Button 
                    variant="outline" 
                    onClick={loadRiskAnalysis}
                    className="w-full"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Recharger l'analyse des risques
                  </Button>
                )}
              </>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Génération de votre programme</h3>
            
            {/* Résumé de la configuration */}
            <Card className="bg-gray-50">
              <CardContent className="p-6">
                <h4 className="font-semibold mb-4">Résumé de votre configuration</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Secteur:</span> {SECTEURS[config.secteur]?.nom}
                  </div>
                  <div>
                    <span className="font-medium">Document:</span> {config.obligation}
                  </div>
                  <div>
                    <span className="font-medium">Responsable:</span> {ACTEURS[config.acteur]?.nom}
                  </div>
                  <div>
                    <span className="font-medium">Entreprise:</span> {config.companyInfo.name}
                  </div>
                  {config.riskIntegration.analysis && (
                    <>
                      <div>
                        <span className="font-medium">Risques analysés:</span> {config.riskIntegration.analysis.summary.totalRisks}
                      </div>
                      <div>
                        <span className="font-medium">Risques critiques:</span> 
                        <Badge variant="destructive" className="ml-2">
                          {config.riskIntegration.analysis.criticalRisks.length}
                        </Badge>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Prévisualisation des améliorations */}
            {config.riskIntegration.analysis && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Programme enrichi :</strong> Votre programme sera personnalisé avec {config.riskIntegration.analysis.summary.totalRisks} risques 
                  de votre registre, incluant {config.riskIntegration.analysis.criticalRisks.length} mesures prioritaires.
                </AlertDescription>
              </Alert>
            )}

            {/* Bouton de génération */}
            <div className="text-center">
              <Button
                onClick={generateProgram}
                disabled={isGenerating}
                size="lg"
                className="w-full md:w-auto"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    {config.riskIntegration.analysis ? 'Générer le programme enrichi' : 'Générer le programme SST'}
                  </>
                )}
              </Button>
            </div>

            {/* Contenu généré */}
            {generatedContent && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Programme généré</span>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger PDF
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-white border rounded-lg p-6 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">{generatedContent}</pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* En-tête avec progression */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wand2 className="w-6 h-6 text-blue-600" />
            <span>Assistant de Génération de Programmes SST</span>
            {config.riskIntegration.enabled && (
              <Badge variant="secondary" className="ml-2">
                <Shield className="w-3 h-3 mr-1" />
                Risques intégrés
              </Badge>
            )}
          </CardTitle>
          <div className="space-y-4">
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Étape {currentStep + 1} sur {steps.length}
              </span>
              <span className="text-sm font-medium">
                {Math.round(progress)}% complété
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Navigation des étapes */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-x-4 overflow-x-auto">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center space-x-2 min-w-0 ${
                  step.isActive ? 'text-blue-600' : step.isCompleted ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.isActive ? 'bg-blue-100' : step.isCompleted ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {step.isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <div className="hidden md:block">
                  <p className="font-medium text-sm">{step.title}</p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contenu de l'étape */}
      <Card>
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Précédent
        </Button>
        
        {currentStep < steps.length - 1 ? (
          <Button
            onClick={nextStep}
            disabled={!canProceed()}
          >
            Suivant
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}