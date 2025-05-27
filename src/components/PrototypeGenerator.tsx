import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, FileText, Copy, Download, Settings, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CompanyInfoForm, CompanyInfo } from "./CompanyInfoForm";

export function PrototypeGenerator() {
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedSector, setSelectedSector] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    companyName: "",
    address: "",
    city: "",
    province: "QC",
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
  const { toast } = useToast();

  const groupes = {
    "1": { nom: "Construction", color: "bg-orange-500" },
    "2": { nom: "Manufacturier", color: "bg-blue-500" },
    "3": { nom: "Services", color: "bg-green-500" },
    "4": { nom: "Bureaux", color: "bg-purple-500" }
  };

  const secteurs = {
    "construction-residentielle": { nom: "Construction résidentielle", groupe: "1" },
    "construction-commerciale": { nom: "Construction commerciale", groupe: "1" },
    "usinage-metaux": { nom: "Usinage des métaux", groupe: "2" },
    "transformation-alimentaire": { nom: "Transformation alimentaire", groupe: "2" },
    "services-municipaux": { nom: "Services municipaux", groupe: "3" },
    "bureaux-administratifs": { nom: "Bureaux administratifs", groupe: "4" }
  };

  const templates = [
    "Programme complet",
    "Plan d'action SST",
    "Analyse des risques",
    "Mesures préventives",
    "Plan d'urgence",
    "Formation SST"
  ];

  const isFormComplete = () => {
    const required = ['companyName', 'address', 'city', 'responsibleName', 'responsibleTitle', 'scianCode', 'employeeCount', 'implementationDate'];
    return required.every(field => companyInfo[field as keyof CompanyInfo]?.trim() !== '');
  };

  const generatePrototype = async () => {
    if (!selectedGroup || !selectedSector || !selectedTemplate) {
      toast({
        title: "Erreur",
        description: "Veuillez compléter tous les champs de sélection",
        variant: "destructive"
      });
      return;
    }

    if (!isFormComplete()) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez compléter les informations de l'entreprise avant de générer le document",
        variant: "destructive"
      });
      setShowCompanyForm(true);
      return;
    }

    setIsGenerating(true);
    
    // Simulation de génération
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const sectorName = secteurs[selectedSector].nom;
    const groupeName = groupes[selectedGroup].nom;
    const currentDate = new Date().toLocaleDateString('fr-CA');
    
    let mockContent = "";
    
    if (selectedTemplate === "Plan d'action SST") {
      mockContent = `
═══════════════════════════════════════════════════════════════════════════════
                              PLAN D'ACTION SST
                        SANTÉ ET SÉCURITÉ DU TRAVAIL
═══════════════════════════════════════════════════════════════════════════════

ENTREPRISE             : ${companyInfo.companyName}
ÉTABLISSEMENT          : ${companyInfo.establishmentType}
ADRESSE                : ${companyInfo.address}, ${companyInfo.city}, ${companyInfo.province} ${companyInfo.postalCode}
SECTEUR D'ACTIVITÉ     : ${sectorName}
CODE SCIAN             : ${companyInfo.scianCode}
DESCRIPTION ACTIVITÉ   : ${companyInfo.scianDescription}
GROUPE PRIORITAIRE     : Groupe ${selectedGroup} - ${groupeName}
NOMBRE D'EMPLOYÉS      : ${companyInfo.employeeCount}

RESPONSABLE DU PLAN    : ${companyInfo.responsibleName}
TITRE/FONCTION         : ${companyInfo.responsibleTitle}
TÉLÉPHONE              : ${companyInfo.responsiblePhone}
COURRIEL               : ${companyInfo.responsibleEmail}

DATE DE CRÉATION       : ${currentDate}
DATE DE MISE EN ŒUVRE  : ${companyInfo.implementationDate}
PROCHAINE RÉVISION     : ${companyInfo.revisionDate}
STATUT                 : Document opérationnel LMRSST
CONFORMITÉ CNESST      : Conforme aux exigences

═══════════════════════════════════════════════════════════════════════════════

OBJECTIF DU PLAN D'ACTION SST

Ce plan d'action SST constitue un outil opérationnel qui priorise et planifie les
actions concrètes à prendre pour améliorer la santé et sécurité au travail dans
${companyInfo.companyName}.

Il découle de l'analyse des risques spécifiques au secteur ${sectorName} et vise à 
structurer la mise en œuvre des mesures de prévention selon les priorités établies 
et les ressources disponibles pour un établissement de ${companyInfo.employeeCount}.

${companyInfo.additionalInfo ? `
CONTEXTE PARTICULIER :
${companyInfo.additionalInfo}
` : ''}

═══════════════════════════════════════════════════════════════════════════════

1. IDENTIFICATION DES PRIORITÉS D'ACTION

1.1 MÉTHODE DE PRIORISATION

Les actions sont classées selon la matrice de criticité suivante :

NIVEAU DE RISQUE = PROBABILITÉ × GRAVITÉ × EXPOSITION

PRIORITÉ 1 (URGENT)     : Risque critique (R ≥ 16) - Action immédiate
PRIORITÉ 2 (IMPORTANT)  : Risque élevé (R = 10-15) - Action sous 30 jours  
PRIORITÉ 3 (MODÉRÉ)     : Risque modéré (R = 5-9) - Action sous 90 jours
PRIORITÉ 4 (SURVEILLANCE): Risque faible (R ≤ 4) - Surveillance continue

1.2 RESSOURCES DISPONIBLES

Budget alloué SST ${new Date().getFullYear()}    : [À compléter] $
Personnes-ressources SST       : ${companyInfo.responsibleName} (${companyInfo.responsibleTitle})
Échéancier général             : ${companyInfo.implementationDate} au ${companyInfo.revisionDate}
Responsable du suivi           : ${companyInfo.responsibleName}

═══════════════════════════════════════════════════════════════════════════════

2. PLAN D'ACTION DÉTAILLÉ POUR ${companyInfo.companyName.toUpperCase()}

${selectedGroup === "1" ? `
┌──────────────────────────────────────────────────────────────────────────────┐
│                           PRIORITÉ 1 - ACTIONS URGENTES                     │
│                      SECTEUR : ${sectorName.toUpperCase()}                           │
└──────────────────────────────────────────────────────────────────────────────┘

ACTION 1.1 : PRÉVENTION DES CHUTES DE HAUTEUR
┌─────────────────────┬─────────────────────────────────────────────────────────┐
│ Description         │ Installation de points d'ancrage certifiés sur         │
│                     │ tous les toits et structures > 3 mètres                │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Justification       │ 3 situations dangereuses signalées + exigence RSST     │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Responsable         │ ${companyInfo.responsibleName} + Contremaître général   │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Échéance            │ 15 février ${new Date().getFullYear()}                  │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Budget requis       │ 2 500 $ (installation) + 800 $ (harnais)               │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Indicateur de suivi │ 100% des points d'ancrage inspectés et certifiés       │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Statut              │ ⚠️  EN COURS                                            │
└─────────────────────┴─────────────────────────────────────────────────────────┘
` : selectedGroup === "2" ? `
┌──────────────────────────────────────────────────────────────────────────────┐
│                           PRIORITÉ 1 - ACTIONS URGENTES                     │
│                      SECTEUR : ${sectorName.toUpperCase()}                           │
└──────────────────────────────────────────────────────────────────────────────┘

ACTION 1.1 : SÉCURISATION MACHINES DANGEREUSES
┌─────────────────────┬─────────────────────────────────────────────────────────┐
│ Description         │ Installation protecteurs manquants sur machines        │
│                     │ + mise aux normes des dispositifs d'arrêt d'urgence    │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Justification       │ Non-conformité RSST art. 182 + risque d'amputation     │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Responsable         │ ${companyInfo.responsibleName} + Superviseur production │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Échéance            │ 10 février ${new Date().getFullYear()}                  │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Budget requis       │ 4 500 $ (protecteurs) + 800 $ (installation)           │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Indicateur de suivi │ 100% des machines conformes + inspection validée       │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Statut              │ ⚠️  EN COURS                                            │
└─────────────────────┴─────────────────────────────────────────────────────────┘
` : `
┌──────────────────────────────────────────────────────────────────────────────┐
│                           PRIORITÉ 1 - ACTIONS URGENTES                     │
│                      SECTEUR : ${sectorName.toUpperCase()}                           │
└──────────────────────────────────────────────────────────────────────────────┘

ACTION 1.1 : AMÉNAGEMENT ERGONOMIQUE DES POSTES
┌─────────────────────┬─────────────────────────────────────────────────────────┐
│ Description         │ Remplacement mobilier non ergonomique +                │
│                     │ ajustement des postes informatiques                    │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Justification       │ 4 déclarations de TMS dans les 12 derniers mois        │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Responsable         │ ${companyInfo.responsibleName} + RH + Ergonome         │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Échéance            │ 15 mars ${new Date().getFullYear()}                     │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Budget requis       │ 3 600 $ (mobilier) + 1 200 $ (consultation)            │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Indicateur de suivi │ Réduction de 50% des plaintes ergonomiques             │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Statut              │ ⚠️  EN COURS                                            │
└─────────────────────┴─────────────────────────────────────────────────────────┘
`}

═══════════════════════════════════════════════════════════════════════════════

3. CALENDRIER DE RÉALISATION

┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│   ACTIONS   │   JANVIER   │   FÉVRIER   │    MARS     │    AVRIL    │     MAI     │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ Action 1.1  │     🔄      │      ✅      │             │             │             │
│ Action 1.2  │             │     🔄      │      ✅      │             │             │  
│ Action 2.1  │             │             │     🔄      │      ✅      │             │
│ Action 2.2  │             │             │             │     🔄      │      ✅      │
│ Révision    │             │             │             │             │     📋      │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘

LÉGENDE : 🔄 En cours    ✅ Complété    📋 Évaluation

═══════════════════════════════════════════════════════════════════════════════

APPROBATIONS ET SIGNATURES

Ce plan d'action SST a été élaboré pour ${companyInfo.companyName} selon les exigences 
de la LMRSST applicable au secteur ${sectorName} (Code SCIAN: ${companyInfo.scianCode}).

RESPONSABLE SST                        DIRECTION

_____________________                 _____________________
${companyInfo.responsibleName}          [Nom du dirigeant]
${companyInfo.responsibleTitle}         [Titre]
Date : ${currentDate}                       Date : ${currentDate}

Téléphone : ${companyInfo.responsiblePhone}
Courriel : ${companyInfo.responsibleEmail}

═══════════════════════════════════════════════════════════════════════════════
                            FIN DU PLAN D'ACTION SST
                         Généré par PPAI v1.0 - ${companyInfo.companyName}
                      © ${new Date().getFullYear()} - Conforme LMRSST/CNESST
═══════════════════════════════════════════════════════════════════════════════`;
    } else {
      // ... keep existing code (contenu pour autres templates with company info)
      mockContent = `
# ${selectedTemplate} - ${companyInfo.companyName}

## 1. Identification de l'Entreprise
**Entreprise :** ${companyInfo.companyName}  
**Adresse :** ${companyInfo.address}, ${companyInfo.city}, ${companyInfo.province} ${companyInfo.postalCode}  
**Code SCIAN :** ${companyInfo.scianCode}  
**Secteur :** ${sectorName}  
**Groupe CNESST :** ${selectedGroup}  
**Nombre d'employés :** ${companyInfo.employeeCount}

## 2. Responsable du Programme
**Nom :** ${companyInfo.responsibleName}  
**Titre :** ${companyInfo.responsibleTitle}  
**Contact :** ${companyInfo.responsiblePhone} | ${companyInfo.responsibleEmail}

## 3. Dates Importantes
**Mise en œuvre :** ${companyInfo.implementationDate}  
**Prochaine révision :** ${companyInfo.revisionDate}

## 4. Type de Document
**Template sélectionné :** ${selectedTemplate}

## 5. Contenu Spécialisé
Ce document ${selectedTemplate.toLowerCase()} a été généré selon les standards CNESST 
pour ${companyInfo.companyName} dans le secteur ${sectorName} (Groupe ${selectedGroup}).

${companyInfo.additionalInfo ? `
## 6. Contexte Particulier
${companyInfo.additionalInfo}
` : ''}

## 7. Conformité Réglementaire
Document conforme aux exigences de la LSST et du RSST pour les établissements 
du Groupe ${selectedGroup} CNESST, adapté aux spécificités de ${companyInfo.companyName}.`;
    }

    setGeneratedContent(mockContent);
    setIsGenerating(false);
    
    toast({
      title: "Succès",
      description: `${selectedTemplate} généré avec succès pour ${companyInfo.companyName} !`,
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Générateur Prototype PPAI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Groupe CNESST</label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un groupe" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(groupes).map(([key, groupe]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${groupe.color}`}></div>
                        Groupe {key} - {groupe.nom}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Secteur d'activité</label>
              <Select value={selectedSector} onValueChange={setSelectedSector}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un secteur" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(secteurs).map(([key, secteur]) => (
                    <SelectItem key={key} value={key}>
                      {secteur.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type de template</label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template} value={template}>
                      {template}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={() => setShowCompanyForm(!showCompanyForm)}
              variant={isFormComplete() ? "default" : "outline"}
              className="flex items-center gap-2"
            >
              {isFormComplete() ? <CheckCircle className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
              {showCompanyForm ? "Masquer" : "Configurer"} les informations d'entreprise
            </Button>
            
            <Button 
              onClick={generatePrototype}
              disabled={!selectedGroup || !selectedSector || !selectedTemplate || isGenerating}
              className="flex-1"
            >
              {isGenerating ? "Génération..." : "Générer Programme Professionnel"}
            </Button>
          </div>

          {selectedGroup && selectedSector && selectedTemplate && (
            <div className="flex gap-2">
              <Badge className={groupes[selectedGroup].color}>
                {groupes[selectedGroup].nom}
              </Badge>
              <Badge variant="outline">
                {secteurs[selectedSector].nom}
              </Badge>
              <Badge variant="secondary">
                {selectedTemplate}
              </Badge>
              {isFormComplete() && (
                <Badge className="bg-green-500">
                  Info entreprise ✓
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulaire d'informations entreprise */}
      {showCompanyForm && (
        <CompanyInfoForm 
          companyInfo={companyInfo}
          onCompanyInfoChange={setCompanyInfo}
          selectedGroup={selectedGroup}
        />
      )}

      {/* Avertissement prototype */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Mode Prototype PPAI</p>
              <p className="text-sm text-blue-700 mt-1">
                Programme généré selon les standards CNESST avec informations d'entreprise intégrées. 
                Contenu personnalisé mais nécessite validation pour votre organisation spécifique.
                Format conforme aux attentes CNESST avec sections obligatoires complètes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenu généré */}
      {generatedContent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Programme Professionnel Généré
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyContent}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copier
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter PDF
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white border rounded-lg p-6 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">{generatedContent}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
