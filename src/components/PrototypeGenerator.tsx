import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wand2, Download, Copy, Zap, Settings, Info, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CompanyInfoForm, CompanyInfo } from "@/components/CompanyInfoForm";
import { AIGenerationService, AIProvider } from "@/services/aiGenerationService";
import { AIConfigurationModal } from "@/components/AIConfigurationModal";

const templates = {
  "template-1": {
    title: "Programme de prévention simplifié",
    description: "Programme de base pour les petites entreprises",
    content: "Ce programme couvre les aspects essentiels de la prévention des risques."
  },
  "template-2": {
    title: "Analyse des risques ergonomiques",
    description: "Document d'analyse des risques liés à l'ergonomie",
    content: "Cette analyse détaille les risques ergonomiques et les mesures préventives."
  },
  "template-3": {
    title: "Plan de mesures d'urgence",
    description: "Plan d'action en cas d'urgence",
    content: "Ce plan décrit les procédures à suivre en cas d'incendie, d'accident, etc."
  },
  "template-4": {
    title: "Politique de sécurité chimique",
    description: "Document de politique concernant la sécurité des produits chimiques",
    content: "Cette politique encadre l'utilisation et le stockage des produits chimiques."
  }
};

interface PrototypeGeneratorProps {
  selectedGroup: string;
  cnessData?: any;
  registryRisks?: any[]; // Nouveau prop pour les risques du registre
}

export function PrototypeGenerator({ selectedGroup, cnessData, registryRisks }: PrototypeGeneratorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    companyName: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    responsibleName: "",
    responsibleTitle: "",
    responsiblePhone: "",
    responsibleEmail: "",
    scianCode: "",
    scianDescription: "",
    employeeCount: "",
    implementationDate: "",
    revisionDate: "",
    establishmentType: "",
    additionalInfo: ""
  });
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIConfig, setShowAIConfig] = useState(false);
  const [aiService] = useState(() => new AIGenerationService());
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      toast({
        title: "Template requis",
        description: "Veuillez sélectionner un template de programme.",
        variant: "destructive"
      });
      return;
    }

    if (!companyInfo.companyName || !companyInfo.employeeCount) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir au minimum le nom de l'entreprise et le nombre d'employés.",
        variant: "destructive"
      });
      return;
    }

    // Vérifier si l'IA est configurée
    if (!aiService.hasApiKey()) {
      setShowAIConfig(true);
      return;
    }

    setIsGenerating(true);

    try {
      const template = templates[selectedTemplate];
      
      // Utilisation de l'IA réelle avec enrichissement CNESST ET registre des risques
      const response = await aiService.generatePreventionProgram({
        companyName: companyInfo.companyName,
        secteurScian: companyInfo.scianCode || "2361",
        groupePrioritaire: parseInt(selectedGroup) || 1,
        nombreEmployes: parseInt(companyInfo.employeeCount) || 0,
        activitesPrincipales: companyInfo.scianDescription || template.description,
        typeDocument: template.title,
        acteurResponsable: companyInfo.responsibleTitle || "Coordonnateur SST",
        cnessData: cnessData,
        registryRisks: registryRisks // Nouveau paramètre
      });

      // Enrichissement du contenu avec les informations de l'entreprise
      const enrichedContent = enrichContentWithCompanyInfo(response.content, companyInfo, template);
      
      setGeneratedContent(enrichedContent);
      
      toast({
        title: "Succès",
        description: `${template.title} généré avec l'IA ! ${cnessData ? '(Enrichi CNESST)' : ''} ${registryRisks?.length ? `(${registryRisks.length} risques intégrés)` : ''}`,
      });
    } catch (error) {
      console.error('Erreur génération IA:', error);
      toast({
        title: "Erreur IA",
        description: error instanceof Error ? error.message : "Erreur lors de la génération IA",
        variant: "destructive"
      });
      
      // Fallback vers simulation
      await generateMockContent();
    } finally {
      setIsGenerating(false);
    }
  };

  // Fonction pour enrichir le contenu avec les informations de l'entreprise
  const enrichContentWithCompanyInfo = (content: string, info: CompanyInfo, template: any): string => {
    const header = `# ${template.title}

## INFORMATIONS DE L'ÉTABLISSEMENT

**Nom de l'entreprise :** ${info.companyName}
**Adresse :** ${info.address}, ${info.city}, ${info.province} ${info.postalCode}
**Code SCIAN :** ${info.scianCode} - ${info.scianDescription}
**Nombre d'employés :** ${info.employeeCount}
**Type d'établissement :** ${info.establishmentType}

**Responsable du programme SST :**
- Nom : ${info.responsibleName}
- Titre : ${info.responsibleTitle}
- Téléphone : ${info.responsiblePhone}
- Courriel : ${info.responsibleEmail}

**Dates importantes :**
- Date de mise en œuvre : ${info.implementationDate}
- Prochaine révision : ${info.revisionDate}

---

${content}

---

## INFORMATIONS ADDITIONNELLES

${info.additionalInfo}

---

*Document généré automatiquement par PPAI (Prevention Program AI) - ${new Date().toLocaleDateString('fr-CA')}*
*Conforme aux exigences CNESST/LMRSST - Groupe ${selectedGroup}*`;

    return header;
  };

  // Fonction de fallback pour la simulation
  const generateMockContent = async () => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const template = templates[selectedTemplate];
    const mockContent = `# ${template.title}

## 1. CONTEXTE ET OBJECTIFS
Ce document a été généré pour ${companyInfo.companyName}, établissement de ${companyInfo.employeeCount} employés dans le secteur ${companyInfo.scianDescription || template.description}.

## 2. CADRE RÉGLEMENTAIRE
Conforme aux exigences CNESST Groupe ${selectedGroup} et aux articles pertinents de la LSST.

## 3. CONTENU PRINCIPAL
${template.content}

## 4. MISE EN ŒUVRE
Responsable : ${companyInfo.responsibleName || 'À désigner'}
Date de mise en œuvre : ${companyInfo.implementationDate || 'À définir'}

⚠️ *Contenu généré en mode simulation - Configurez l'IA pour une génération avancée*`;

    setGeneratedContent(mockContent);
  };

  const handleConfigSet = (config: { provider: AIProvider; apiKey: string }) => {
    aiService.setConfig(config);
    toast({
      title: "IA Configurée",
      description: `${aiService.getProviderName()} est maintenant prêt à générer vos programmes !`,
    });
  };

  const copyContent = () => {
    navigator.clipboard.writeText(generatedContent);
    toast({
      title: "Copié",
      description: "Le contenu a été copié dans le presse-papier",
    });
  };

  return (
    <div className="space-y-6">
      {/* Status IA */}
      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            {aiService.hasApiKey() 
              ? `✅ IA activée - ${aiService.getProviderName()} ${cnessData ? '(avec données CNESST)' : ''} ${registryRisks?.length ? `(${registryRisks.length} risques registre)` : ''}`
              : "⚠️ Mode simulation - Configurez l'IA pour une génération optimale"
            }
          </span>
          <Button variant="outline" size="sm" onClick={() => setShowAIConfig(true)}>
            <Settings className="w-4 h-4 mr-1" />
            {aiService.hasApiKey() ? 'Modifier' : 'Configurer'} IA
          </Button>
        </AlertDescription>
      </Alert>

      {/* Affichage des risques intégrés si disponibles */}
      {registryRisks && registryRisks.length > 0 && (
        <Alert>
          <Database className="w-4 h-4" />
          <AlertDescription>
            <strong>Registre des risques intégré:</strong> {registryRisks.length} risques seront analysés par l'IA pour personnaliser votre programme.
            <div className="mt-2 flex flex-wrap gap-1">
              {registryRisks.filter(r => r.initialRisk >= 15).map((risk, index) => (
                <Badge key={index} className="bg-red-100 text-red-800 text-xs">
                  {risk.name || risk.description?.substring(0, 30)}...
                </Badge>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Informations de l'entreprise */}
      <CompanyInfoForm
        companyInfo={companyInfo}
        onCompanyInfoChange={setCompanyInfo}
        selectedGroup={selectedGroup}
      />

      {/* Sélection de template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-purple-600" />
            Génération de Programme Automatisée
            {aiService.hasApiKey() && (
              <Badge className="bg-green-100 text-green-800">
                <Zap className="w-3 h-3 mr-1" />
                IA Activée
              </Badge>
            )}
            {registryRisks && registryRisks.length > 0 && (
              <Badge className="bg-blue-100 text-blue-800">
                <Database className="w-3 h-3 mr-1" />
                Registre Intégré
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Type de programme à générer</label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un type de programme" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(templates).map(([key, template]) => (
                  <SelectItem key={key} value={key}>
                    {template.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800">{templates[selectedTemplate].title}</h4>
              <p className="text-sm text-blue-700 mt-1">{templates[selectedTemplate].description}</p>
            </div>
          )}

          <Button 
            onClick={handleGenerate} 
            disabled={!selectedTemplate || !companyInfo.companyName || isGenerating}
            className="w-full"
          >
            {isGenerating 
              ? "Génération en cours..." 
              : aiService.hasApiKey() 
                ? `Générer avec ${aiService.getProviderName()} ${cnessData ? '(enrichi CNESST)' : ''} ${registryRisks?.length ? `(${registryRisks.length} risques)` : ''}` 
                : "Générer (simulation)"
            }
          </Button>
        </CardContent>
      </Card>

      {/* Contenu généré */}
      {generatedContent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Document Généré</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyContent}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copier
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={generatedContent}
              readOnly
              className="min-h-[500px] font-mono text-sm"
            />
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
