import { useState } from "react";

export interface Template {
  title: string;
  description: string;
  content: string;
}

export interface TemplateConfig {
  selectedTemplate: string;
  setSelectedTemplate: (template: string) => void;
  templates: Record<string, Template>;
  getSelectedTemplate: () => Template | null;
  isTemplateSelected: boolean;
  validateTemplate: () => string | null;
}

const DEFAULT_TEMPLATES: Record<string, Template> = {
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

export const useTemplateConfig = (
  customTemplates?: Record<string, Template>
): TemplateConfig => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  
  // Fusionner les templates par défaut avec les templates personnalisés
  const templates = {
    ...DEFAULT_TEMPLATES,
    ...customTemplates
  };

  const getSelectedTemplate = (): Template | null => {
    if (!selectedTemplate || !templates[selectedTemplate]) {
      return null;
    }
    return templates[selectedTemplate];
  };

  const validateTemplate = (): string | null => {
    if (!selectedTemplate) {
      return "Veuillez sélectionner un type de programme.";
    }
    
    if (!templates[selectedTemplate]) {
      return "Template sélectionné invalide.";
    }
    
    return null;
  };

  const isTemplateSelected = Boolean(selectedTemplate && templates[selectedTemplate]);

  return {
    selectedTemplate,
    setSelectedTemplate,
    templates,
    getSelectedTemplate,
    isTemplateSelected,
    validateTemplate
  };
};