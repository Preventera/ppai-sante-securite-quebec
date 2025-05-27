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
    "Plan d'action SST",
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
    
    const sectorName = secteurs[selectedSector].nom;
    const groupeName = groupes[selectedGroup].nom;
    const currentDate = new Date().toLocaleDateString('fr-CA');
    
    // Contenu spécialisé selon le type de template
    let mockContent = "";
    
    if (selectedTemplate === "Plan d'action SST") {
      mockContent = `
═══════════════════════════════════════════════════════════════════════════════
                              PLAN D'ACTION SST
                        SANTÉ ET SÉCURITÉ DU TRAVAIL
═══════════════════════════════════════════════════════════════════════════════

SECTEUR D'ACTIVITÉ     : ${sectorName}
GROUPE PRIORITAIRE     : Groupe ${selectedGroup} - ${groupeName}
DATE DE CRÉATION       : ${currentDate}
STATUT                 : Document opérationnel LMRSST
CONFORMITÉ CNESST      : Conforme aux exigences

═══════════════════════════════════════════════════════════════════════════════

OBJECTIF DU PLAN D'ACTION SST

Ce plan d'action SST constitue un outil opérationnel qui priorise et planifie les
actions concrètes à prendre pour améliorer la santé et sécurité au travail dans
notre organisation.

Il découle de l'analyse des risques et vise à structurer la mise en œuvre des
mesures de prévention selon les priorités établies et les ressources disponibles.

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
Personnes-ressources SST       : [À compléter]
Échéancier général             : ${currentDate} au 31 décembre ${new Date().getFullYear()}
Responsable du suivi           : [À compléter]

═══════════════════════════════════════════════════════════════════════════════

2. PLAN D'ACTION DÉTAILLÉ

${selectedGroup === "1" ? `
┌──────────────────────────────────────────────────────────────────────────────┐
│                           PRIORITÉ 1 - ACTIONS URGENTES                     │
└──────────────────────────────────────────────────────────────────────────────┘

ACTION 1.1 : PRÉVENTION DES CHUTES DE HAUTEUR
┌─────────────────────┬─────────────────────────────────────────────────────────┐
│ Description         │ Installation de points d'ancrage certifiés sur         │
│                     │ tous les toits et structures > 3 mètres                │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Justification       │ 3 situations dangereuses signalées + exigence RSST     │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Responsable         │ Coordonnateur SST + Contremaître général               │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Échéance            │ 15 février ${new Date().getFullYear()}                                  │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Budget requis       │ 2 500 $ (installation) + 800 $ (harnais)               │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Indicateur de suivi │ 100% des points d'ancrage inspectés et certifiés       │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Statut              │ ⚠️  EN COURS                                            │
└─────────────────────┴─────────────────────────────────────────────────────────┘

ACTION 1.2 : SÉCURISATION DES ÉQUIPEMENTS MOBILES  
┌─────────────────────┬─────────────────────────────────────────────────────────┐
│ Description         │ Installation systèmes de détection d'obstacles         │
│                     │ et alarmes de recul sur tous les véhicules lourds      │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Justification       │ 2 quasi-accidents dans les 6 derniers mois             │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Responsable         │ Mécanicien en chef + Opérateurs d'équipements          │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Échéance            │ 28 février ${new Date().getFullYear()}                                  │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Budget requis       │ 3 200 $ (équipements) + 400 $ (formation)              │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Indicateur de suivi │ Zéro accident véhicule mobile sur chantier             │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Statut              │ 🔄 PLANIFIÉ                                            │
└─────────────────────┴─────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                        PRIORITÉ 2 - ACTIONS IMPORTANTES                     │
└──────────────────────────────────────────────────────────────────────────────┘

ACTION 2.1 : FORMATION ÉCHAFAUDAGES
┌─────────────────────┬─────────────────────────────────────────────────────────┐
│ Description         │ Formation certifiante montage/démontage échafaudages   │
│                     │ pour 8 travailleurs selon norme CSA                   │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Responsable         │ Coordonnateur SST + Fournisseur de formation           │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Échéance            │ 31 mars ${new Date().getFullYear()}                                     │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Budget requis       │ 1 600 $ (formation) + temps de libération              │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Indicateur de suivi │ 100% des monteurs certifiés + registre à jour          │
└─────────────────────┴─────────────────────────────────────────────────────────┘
` : selectedGroup === "2" ? `
┌──────────────────────────────────────────────────────────────────────────────┐
│                           PRIORITÉ 1 - ACTIONS URGENTES                     │
└──────────────────────────────────────────────────────────────────────────────┘

ACTION 1.1 : SÉCURISATION MACHINES DANGEREUSES
┌─────────────────────┬─────────────────────────────────────────────────────────┐
│ Description         │ Installation protecteurs manquants sur 3 machines      │
│                     │ + mise aux normes des dispositifs d'arrêt d'urgence    │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Justification       │ Non-conformité RSST art. 182 + risque d'amputation     │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Responsable         │ Superviseur production + Fournisseur équipements       │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Échéance            │ 10 février ${new Date().getFullYear()}                                  │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Budget requis       │ 4 500 $ (protecteurs) + 800 $ (installation)           │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Indicateur de suivi │ 100% des machines conformes + inspection validée       │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Statut              │ ⚠️  EN COURS                                            │
└─────────────────────┴─────────────────────────────────────────────────────────┘

ACTION 1.2 : CONTRÔLE EXPOSITION CHIMIQUE
┌─────────────────────┬─────────────────────────────────────────────────────────┐
│ Description         │ Installation système ventilation locale au poste       │
│                     │ de dégraissage + surveillance atmosphère de travail    │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Justification       │ Dépassement des valeurs limites d'exposition (VLE)     │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Responsable         │ Hygiéniste industriel + Maintenance                    │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Échéance            │ 25 février ${new Date().getFullYear()}                                  │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Budget requis       │ 8 500 $ (ventilation) + 1 200 $ (mesures d'air)        │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Indicateur de suivi │ VLE respectées + registre de surveillance               │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Statut              │ 🔄 PLANIFIÉ                                            │
└─────────────────────┴─────────────────────────────────────────────────────────┘
` : `
┌──────────────────────────────────────────────────────────────────────────────┐
│                           PRIORITÉ 1 - ACTIONS URGENTES                     │
└──────────────────────────────────────────────────────────────────────────────┘

ACTION 1.1 : AMÉNAGEMENT ERGONOMIQUE DES POSTES
┌─────────────────────┬─────────────────────────────────────────────────────────┐
│ Description         │ Remplacement de 12 chaises non ergonomiques +          │
│                     │ ajustement des postes informatiques                    │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Justification       │ 4 déclarations de TMS dans les 12 derniers mois        │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Responsable         │ RH + Représentant SST + Ergonome consultant            │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Échéance            │ 15 mars ${new Date().getFullYear()}                                     │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Budget requis       │ 3 600 $ (mobilier) + 1 200 $ (consultation)            │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Indicateur de suivi │ Réduction de 50% des plaintes ergonomiques             │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Statut              │ ⚠️  EN COURS                                            │
└─────────────────────┴─────────────────────────────────────────────────────────┘

ACTION 1.2 : PRÉVENTION RISQUES PSYCHOSOCIAUX
┌─────────────────────┬─────────────────────────────────────────────────────────┐
│ Description         │ Implantation programme d'aide aux employés (PAE) +     │
│                     │ formation gestion du stress pour superviseurs          │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Justification       │ Augmentation de l'absentéisme + 2 épuisements prof.    │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Responsable         │ Direction RH + Psychologue organisationnel             │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Échéance            │ 30 avril ${new Date().getFullYear()}                                    │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Budget requis       │ 2 400 $ (PAE annuel) + 800 $ (formation)               │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Indicateur de suivi │ Réduction de 25% de l'absentéisme pour stress          │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ Statut              │ 🔄 PLANIFIÉ                                            │
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

4. INDICATEURS DE SUIVI ET ÉVALUATION

4.1 INDICATEURS QUANTITATIFS

┌─────────────────────────────────┬─────────────┬─────────────┬─────────────┐
│           INDICATEUR            │   BASELINE  │    CIBLE    │   ACTUEL    │
├─────────────────────────────────┼─────────────┼─────────────┼─────────────┤
│ Nombre d'actions complétées     │      0      │     100%    │    [--]     │
│ Budget utilisé / Budget alloué  │      0      │     ≤100%   │    [--]     │
│ Délai moyen de réalisation      │     --      │   ≤échéance │    [--]     │
│ Situations dangereuses corrigées│     --      │     100%    │    [--]     │
│ Taux de participation employés  │     --      │     ≥80%    │    [--]     │
└─────────────────────────────────┴─────────────┴─────────────┴─────────────┘

4.2 MÉTHODES DE SUIVI

RÉUNIONS DE SUIVI :
• Fréquence : Bi-hebdomadaires (responsables d'actions)
• Participants : Coordonnateur SST + responsables d'actions + direction
• Ordre du jour : Avancement, obstacles, ajustements nécessaires

RAPPORT D'ÉTAPE :
• Fréquence : Mensuelle
• Destinataires : Direction, comité SST, représentants des travailleurs
• Contenu : % réalisation, budget, indicateurs, recommandations

RÉVISION COMPLÈTE :
• Fréquence : Trimestrielle  
• Objectif : Évaluation efficacité, mise à jour des priorités
• Critères : Évolution des risques, nouvelles situations, retour terrain

═══════════════════════════════════════════════════════════════════════════════

5. RESSOURCES ET RESPONSABILITÉS

5.1 ÉQUIPE DE PILOTAGE

RESPONSABLE GÉNÉRAL DU PLAN : [Nom], [Titre]
• Coordination générale et suivi global
• Interface avec la direction
• Validation des ajustements et modifications

COORDONNATEUR SST : [Nom], [Titre]  
• Suivi technique des actions
• Support aux responsables d'actions
• Évaluation de la conformité réglementaire

RESPONSABLES D'ACTIONS : [Selon actions]
• Réalisation des actions assignées
• Reporting régulier d'avancement
• Respect des échéances et budgets

5.2 BUDGET DÉTAILLÉ

┌─────────────────────────────────┬─────────────┬─────────────┬─────────────┐
│           CATÉGORIE             │   MONTANT   │      %      │    STATUT   │
├─────────────────────────────────┼─────────────┼─────────────┼─────────────┤
│ Équipements de sécurité         │   8 500 $   │     42%     │  Approuvé   │
│ Formation et sensibilisation    │   3 200 $   │     16%     │  Approuvé   │
│ Aménagements et installations   │   6 800 $   │     34%     │  En attente │
│ Consultations externes          │   1 200 $   │      6%     │  Approuvé   │
│ Imprévus (10%)                  │   1 970 $   │     10%     │  Réservé    │
├─────────────────────────────────┼─────────────┼─────────────┼─────────────┤
│ TOTAL                           │  21 670 $   │    100%     │      --     │
└─────────────────────────────────┴─────────────┴─────────────┴─────────────┘

═══════════════════════════════════════════════════════════════════════════════

6. COMMUNICATION ET MOBILISATION

6.1 STRATÉGIE DE COMMUNICATION

PHASES DE COMMUNICATION :
1. LANCEMENT : Présentation du plan à toute l'équipe
2. EXÉCUTION : Bulletins d'information bimensuels  
3. ÉVALUATION : Rapport final et reconnaissance des contributions

OUTILS DE COMMUNICATION :
• Tableau d'affichage SST avec avancement du plan
• Réunions d'équipe avec point SST obligatoire
• Intranet/courriel pour mises à jour importantes
• Rencontres individuelles avec responsables d'actions

6.2 PARTICIPATION DES TRAVAILLEURS

Les travailleurs sont impliqués dans :
• L'identification des priorités d'amélioration
• La validation des solutions proposées  
• L'évaluation de l'efficacité des mesures implantées
• Le signalement de nouvelles situations dangereuses

MÉCANISMES DE PARTICIPATION :
• Boîte à suggestions SST
• Représentants SST dans le suivi du plan
• Consultation lors des révisions trimestrielles
• Formation et sensibilisation continue

═══════════════════════════════════════════════════════════════════════════════

7. RÉVISION ET AMÉLIORATION CONTINUE

7.1 CRITÈRES DE RÉVISION

Le plan d'action sera révisé dans les situations suivantes :
• Écart significatif par rapport aux échéanciers (>30 jours)
• Dépassement budgétaire de plus de 10%
• Accident grave ou situation d'urgence
• Identification de nouveaux risques prioritaires
• Changements organisationnels ou réglementaires majeurs

7.2 PROCESSUS D'AMÉLIORATION

CYCLE D'AMÉLIORATION CONTINUE (PDCA) :

PLAN : Planification des actions basée sur l'analyse des risques
DO : Mise en œuvre des actions selon le calendrier établi  
CHECK : Vérification de l'efficacité et des résultats obtenus
ACT : Ajustements et amélioration du processus pour le cycle suivant

7.3 INDICATEURS D'EFFICACITÉ GLOBALE

• Réduction du nombre de situations dangereuses identifiées
• Diminution des accidents et incidents de travail
• Amélioration de la perception de sécurité par les employés
• Conformité aux échéanciers et budgets planifiés
• Niveau de participation et d'engagement du personnel

═══════════════════════════════════════════════════════════════════════════════

APPROBATIONS ET SIGNATURES

Ce plan d'action SST a été élaboré en collaboration avec les représentants des
travailleurs et approuvé par la direction. Il sera révisé trimestriellement et
adapté selon l'évolution des besoins et des priorités de l'organisation.

DIRECTION                          REPRÉSENTANT SST

_____________________             _____________________
[Nom et titre]                    [Nom et fonction]  
Date : ${currentDate}                   Date : ${currentDate}


COORDONNATEUR SST                  COMITÉ SST

_____________________             _____________________
[Nom et titre]                    [Président du comité]
Date : ${currentDate}                   Date : ${currentDate}

═══════════════════════════════════════════════════════════════════════════════
                            FIN DU PLAN D'ACTION SST
                         Généré par PPAI v1.0
                      © ${new Date().getFullYear()} - Conforme LMRSST/CNESST
═══════════════════════════════════════════════════════════════════════════════`;
    } else {
      // ... keep existing code (contenu pour autres templates)
      mockContent = `# Programme de Prévention - ${sectorName}

## 1. Contexte Sectoriel
**Secteur :** ${sectorName}  
**Code SCIAN :** [À compléter]  
**Groupe CNESST :** ${selectedGroup}  
**Description :** ${secteurs[selectedSector] ? 'Secteur spécialisé' : 'Activités générales'}

## 2. Type de Document
**Template sélectionné :** ${selectedTemplate}

## 3. Contenu Généré
Ce document ${selectedTemplate.toLowerCase()} a été généré selon les standards CNESST 
pour le secteur ${sectorName} (Groupe ${selectedGroup}).

## 4. Conformité Réglementaire
Document conforme aux exigences de la LSST et du RSST pour les établissements 
du Groupe ${selectedGroup} CNESST.

## 5. Mise en Œuvre
Déploiement recommandé selon les spécificités organisationnelles et sectorielles.`;
    }

    setGeneratedContent(mockContent);
    setIsGenerating(false);
    
    toast({
      title: "Succès",
      description: `${selectedTemplate} généré avec succès !`,
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Avertissement prototype */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Mode Prototype PPAI</p>
              <p className="text-sm text-blue-700 mt-1">
                Programme généré selon les standards CNESST avec structure professionnelle complète. 
                Contenu adapté par secteur mais nécessite personnalisation pour votre organisation spécifique.
                Format conforme aux attentes CNESST avec sections obligatoires intégrées.
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
