import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { AIGenerationService } from "@/services/aiGenerationService";
import { CompanyInfo } from "@/components/CompanyInfoForm";

export interface GenerationParams {
  selectedTemplate: string;
  companyInfo: CompanyInfo;
  selectedGroup: string;
  cnessData?: any;
  registryRisks?: any[];
  templates: Record<string, any>;
}

export interface GenerationResult {
  content: string;
  isGenerated: boolean;
  usedAI: boolean;
  hasRegistryRisks: boolean;
  hasCnessData: boolean;
}

export const useGenerationState = (aiService: AIGenerationService) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [lastGenerationResult, setLastGenerationResult] = useState<GenerationResult | null>(null);
  const { toast } = useToast();

  const validateInputs = (params: GenerationParams): string | null => {
    if (!params.selectedTemplate) {
      return "Veuillez sélectionner un template de programme.";
    }

    if (!params.companyInfo.companyName || !params.companyInfo.employeeCount) {
      return "Veuillez remplir au minimum le nom de l'entreprise et le nombre d'employés.";
    }

    return null;
  };

  const generateWithAI = async (params: GenerationParams): Promise<string> => {
    const template = params.templates[params.selectedTemplate];
    
    const response = await aiService.generatePreventionProgram({
      companyName: params.companyInfo.companyName,
      secteurScian: params.companyInfo.scianCode || "2361",
      groupePrioritaire: parseInt(params.selectedGroup) || 1,
      nombreEmployes: parseInt(params.companyInfo.employeeCount) || 0,
      activitesPrincipales: params.companyInfo.scianDescription || template.description,
      typeDocument: template.title,
      acteurResponsable: params.companyInfo.responsibleTitle || "Coordonnateur SST",
      cnessData: params.cnessData,
      registryRisks: params.registryRisks
    });

    return response.content;
  };

  const generateMockContent = async (params: GenerationParams): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const template = params.templates[params.selectedTemplate];
    
    return `# ${template.title}

## 1. CONTEXTE ET OBJECTIFS
Ce document a été généré pour ${params.companyInfo.companyName}, établissement de ${params.companyInfo.employeeCount} employés dans le secteur ${params.companyInfo.scianDescription || template.description}.

## 2. CADRE RÉGLEMENTAIRE
Conforme aux exigences CNESST Groupe ${params.selectedGroup} et aux articles pertinents de la LSST.

## 3. CONTENU PRINCIPAL
${template.content}

## 4. MISE EN ŒUVRE
Responsable : ${params.companyInfo.responsibleName || 'À désigner'}
Date de mise en œuvre : ${params.companyInfo.implementationDate || 'À définir'}

⚠️ *Contenu généré en mode simulation - Configurez l'IA pour une génération avancée*`;
  };

  const enrichContentWithCompanyInfo = (content: string, params: GenerationParams): string => {
    const template = params.templates[params.selectedTemplate];
    const info = params.companyInfo;

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
*Conforme aux exigences CNESST/LMRSST - Groupe ${params.selectedGroup}*`;

    return header;
  };

  const generateContent = async (params: GenerationParams): Promise<void> => {
    // Validation des inputs
    const validationError = validateInputs(params);
    if (validationError) {
      toast({
        title: "Validation échouée",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    // Vérifier si l'IA est configurée
    if (!params.selectedTemplate) {
      toast({
        title: "Template requis",
        description: "Veuillez sélectionner un template de programme.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      let content: string;
      let usedAI = false;

      if (aiService.hasApiKey()) {
        // Génération avec IA
        content = await generateWithAI(params);
        usedAI = true;
      } else {
        // Fallback vers simulation
        content = await generateMockContent(params);
        usedAI = false;
      }

      // Enrichissement du contenu avec les informations de l'entreprise
      const enrichedContent = enrichContentWithCompanyInfo(content, params);
      
      setGeneratedContent(enrichedContent);
      
      // Enregistrer les résultats de génération
      const result: GenerationResult = {
        content: enrichedContent,
        isGenerated: true,
        usedAI,
        hasRegistryRisks: Boolean(params.registryRisks?.length),
        hasCnessData: Boolean(params.cnessData)
      };
      setLastGenerationResult(result);

      // Toast de succès
      const template = params.templates[params.selectedTemplate];
      const successDetails = [
        usedAI ? 'IA' : 'Simulation',
        params.cnessData ? 'Enrichi CNESST' : '',
        params.registryRisks?.length ? `${params.registryRisks.length} risques intégrés` : ''
      ].filter(Boolean).join(' - ');

      toast({
        title: "Succès",
        description: `${template.title} généré ! (${successDetails})`,
      });

    } catch (error) {
      console.error('Erreur génération:', error);
      
      toast({
        title: "Erreur de génération",
        description: error instanceof Error ? error.message : "Erreur lors de la génération",
        variant: "destructive"
      });
      
      // Fallback vers simulation en cas d'erreur IA
      if (aiService.hasApiKey()) {
        try {
          const mockContent = await generateMockContent(params);
          const enrichedContent = enrichContentWithCompanyInfo(mockContent, params);
          setGeneratedContent(enrichedContent);
          
          toast({
            title: "Fallback activé",
            description: "Génération en mode simulation suite à l'erreur IA",
          });
        } catch (fallbackError) {
          console.error('Erreur fallback:', fallbackError);
        }
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const copyContent = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent);
      toast({
        title: "Copié",
        description: "Le contenu a été copié dans le presse-papier",
      });
    }
  };

  const clearContent = () => {
    setGeneratedContent("");
    setLastGenerationResult(null);
  };

  return {
    // État
    isGenerating,
    generatedContent,
    lastGenerationResult,
    
    // Actions
    generateContent,
    copyContent,
    clearContent,
    
    // Utilitaires
    hasContent: Boolean(generatedContent),
    canGenerate: (params: GenerationParams) => validateInputs(params) === null
  };
};