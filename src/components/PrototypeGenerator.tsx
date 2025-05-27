
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, FileText, Copy, Download, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function PrototypeGenerator() {
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedSector, setSelectedSector] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
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
    "Analyse des risques",
    "Mesures préventives",
    "Plan d'urgence",
    "Formation SST"
  ];

  const generatePrototype = async () => {
    if (!selectedGroup || !selectedSector || !selectedTemplate) {
      toast({
        title: "Erreur",
        description: "Veuillez compléter tous les champs",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    // Simulation de génération
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockContent = `# PROGRAMME DE PRÉVENTION SST
## ${secteurs[selectedSector].nom} - Groupe ${selectedGroup}

### 1. IDENTIFICATION DES RISQUES PRINCIPAUX

**Méthodologie :**
- Inspection systématique des lieux de travail
- Consultation des travailleurs et du comité SST
- Analyse des accidents et incidents antérieurs
- Référence aux statistiques sectorielles CNESST

**Risques identifiés :**
${selectedGroup === "1" ? `
- Chutes de hauteur (échafaudages, toitures)
- Accidents d'équipements mobiles
- Exposition aux poussières et agents chimiques
- Risques électriques
- Troubles musculo-squelettiques
` : selectedGroup === "2" ? `
- Accidents liés aux machines et équipements
- Exposition aux substances dangereuses
- Troubles musculo-squelettiques
- Risques d'incendie et explosion
- Bruit et vibrations
` : `
- Troubles musculo-squelettiques (bureaux)
- Stress et facteurs psychosociaux
- Qualité de l'air intérieur
- Risques d'agression (services publics)
- Accidents de circulation
`}

### 2. MESURES DE PRÉVENTION (Hiérarchie LSST Art. 51)

**2.1 Élimination des dangers**
- Révision des méthodes de travail pour éliminer les expositions
- Automatisation des tâches dangereuses
- Réorganisation des espaces de travail

**2.2 Substitution**
- Remplacement des substances dangereuses par des alternatives sûres
- Utilisation d'équipements moins dangereux
- Modification des procédés de production

**2.3 Contrôles techniques**
- Installation de dispositifs de protection sur les machines
- Systèmes de ventilation et d'extraction
- Barrières physiques et garde-corps
- Éclairage adéquat

**2.4 Mesures administratives**
- Procédures de travail sécuritaires
- Formation et sensibilisation du personnel
- Rotation des tâches
- Surveillance médicale
- Signalisation de sécurité

**2.5 Équipements de protection individuelle (EPI)**
- Casques de sécurité (obligatoires en construction)
- Chaussures de sécurité
- Gants de protection
- Protection respiratoire si nécessaire
- Vêtements haute visibilité

### 3. ORGANISATION ET RESPONSABILITÉS

**Employeur :**
- Mise en œuvre du programme de prévention
- Fourniture des EPI et formation
- Maintien des équipements de sécurité
- Enquête sur les accidents

**Superviseurs :**
- Application des procédures sécuritaires
- Formation pratique des employés
- Inspection quotidienne des lieux
- Correction des situations dangereuses

**Travailleurs :**
- Respect des procédures établies
- Utilisation des EPI fournis
- Signalement des dangers observés
- Participation aux formations

**Comité SST :**
- Participation à l'élaboration du programme
- Inspection des lieux de travail
- Enquête sur les accidents
- Recommandations d'amélioration

### 4. ÉCHÉANCIER ET MODALITÉS

| Mesure | Responsable | Échéance | Statut |
|--------|-------------|----------|--------|
| Formation accueil sécurité | Superviseur | Continue | En cours |
| Inspection mensuelle | Comité SST | Mensuel | Planifié |
| Révision des procédures | Employeur | Annuelle | À venir |
| Audit conformité | Consultant externe | Annuelle | Planifié |

### 5. SURVEILLANCE ET SUIVI

**Indicateurs de performance :**
- Taux de fréquence des accidents
- Nombre de situations dangereuses corrigées
- Taux de participation aux formations
- Conformité aux inspections

**Méthodes de surveillance :**
- Inspections régulières programmées
- Audits internes et externes
- Enquêtes sur les incidents
- Sondages de satisfaction des employés

### 6. RÉVISION DU PROGRAMME

Ce programme sera révisé :
- Annuellement ou lors de changements significatifs
- Suite à des accidents graves
- Après modifications des installations
- En fonction de l'évolution réglementaire

**Responsable de la révision :** [Nom du responsable SST]
**Prochaine révision :** [Date + 12 mois]

---
*Programme conforme aux exigences de la LSST (articles 51 et 59) et adapté au groupe prioritaire ${selectedGroup} CNESST.*
*Généré en mode prototype le ${new Date().toLocaleDateString('fr-CA')}*`;

    setGeneratedContent(mockContent);
    setIsGenerating(false);
    
    toast({
      title: "Succès",
      description: "Programme prototype généré avec succès !",
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
            Générateur Prototype
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
              onClick={generatePrototype}
              disabled={!selectedGroup || !selectedSector || !selectedTemplate || isGenerating}
              className="flex-1"
            >
              {isGenerating ? "Génération..." : "Générer Programme Prototype"}
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Avertissement prototype */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-medium text-orange-800">Mode Prototype</p>
              <p className="text-sm text-orange-700 mt-1">
                Ce générateur utilise des templates prédéfinis pour la démonstration. 
                Le contenu généré est générique et nécessite une révision par un expert SST 
                pour garantir la conformité spécifique à votre organisation.
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
                Programme Généré
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyContent}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copier
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white border rounded-lg p-6 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm font-mono">{generatedContent}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
