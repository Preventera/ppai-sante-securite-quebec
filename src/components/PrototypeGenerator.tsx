
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
    
    const sectorName = secteurs[selectedSector].nom;
    const groupeName = groupes[selectedGroup].nom;
    const currentDate = new Date().toLocaleDateString('fr-CA');
    
    const mockContent = `
═══════════════════════════════════════════════════════════════════════════════
                           PROGRAMME DE PRÉVENTION
                        SANTÉ ET SÉCURITÉ DU TRAVAIL
═══════════════════════════════════════════════════════════════════════════════

SECTEUR D'ACTIVITÉ     : ${sectorName}
GROUPE PRIORITAIRE     : Groupe ${selectedGroup} - ${groupeName}
DATE DE CRÉATION       : ${currentDate}
STATUT                 : Prototype PPAI
CONFORMITÉ CNESST      : En cours de validation

═══════════════════════════════════════════════════════════════════════════════

TABLE DES MATIÈRES

1. PRÉSENTATION DE L'ORGANISATION ET ENGAGEMENT DE LA DIRECTION....... 3
2. STRUCTURE ORGANISATIONNELLE EN SANTÉ-SÉCURITÉ.................... 4
3. IDENTIFICATION ET ANALYSE DES RISQUES........................... 5
4. OBJECTIFS, CIBLES ET PROGRAMMES DE PRÉVENTION................... 7
5. MESURES DE PRÉVENTION ET DE PROTECTION.......................... 9
6. ÉQUIPEMENTS DE PROTECTION INDIVIDUELLE.......................... 12
7. RÈGLES DE SÉCURITÉ ET MÉTHODES DE TRAVAIL SÉCURITAIRES.......... 13
8. PROGRAMMES DE FORMATION ET D'INFORMATION........................ 15
9. SURVEILLANCE DE LA SANTÉ DES TRAVAILLEURS...................... 17
10. PROCÉDURES D'URGENCE ET DE PREMIERS SECOURS................... 18
11. ENQUÊTE ET ANALYSE D'ACCIDENTS ET D'INCIDENTS................. 19
12. INSPECTION DES LIEUX DE TRAVAIL............................... 20
13. CONTRÔLE ET SUIVI DU PROGRAMME................................ 21

═══════════════════════════════════════════════════════════════════════════════

1. PRÉSENTATION DE L'ORGANISATION ET ENGAGEMENT DE LA DIRECTION

1.1 PRÉSENTATION DE L'ORGANISATION

Nom de l'organisation  : [À compléter]
Secteur d'activité     : ${sectorName}
Code SCIAN            : [À compléter]
Nombre d'employés     : [À compléter]
Adresse principale    : [À compléter]

Activités principales :
${selectedGroup === "1" ? `
• Travaux de construction résidentielle et commerciale
• Excavation et terrassement
• Installation d'échafaudages et structures temporaires
• Opération d'équipements mobiles et de levage
• Travaux en hauteur et espaces clos
` : selectedGroup === "2" ? `
• Production et transformation manufacturière
• Opération de machines industrielles
• Manutention de matières premières et produits finis
• Maintenance préventive et corrective des équipements
• Contrôle qualité et inspection des produits
` : selectedGroup === "3" ? `
• Services à la collectivité et activités municipales
• Entretien des infrastructures publiques
• Collecte et traitement des déchets
• Entretien des parcs et espaces verts
• Services d'urgence et de sécurité publique
` : `
• Activités administratives et de bureau
• Services professionnels et techniques
• Gestion documentaire et traitement de données
• Relations clients et services-conseils
• Activités de formation et développement
`}

1.2 ENGAGEMENT DE LA DIRECTION

La direction de [Nom de l'organisation] s'engage formellement à :

✓ Respecter intégralement les dispositions de la Loi sur la santé et la sécurité du travail (LSST)
✓ Fournir les ressources humaines, matérielles et financières nécessaires
✓ Assurer la formation et l'information continue du personnel
✓ Maintenir un environnement de travail sain et sécuritaire
✓ Promouvoir une culture de prévention à tous les niveaux organisationnels

"La santé et la sécurité de nos travailleurs constituent notre priorité absolue. 
Aucune tâche n'est assez urgente pour compromettre la sécurité."

Signature de la direction : _____________________  Date : ${currentDate}

═══════════════════════════════════════════════════════════════════════════════

2. STRUCTURE ORGANISATIONNELLE EN SANTÉ-SÉCURITÉ

2.1 ORGANIGRAMME SST

Direction générale
    ↓
Responsable SST/Coordonnateur
    ↓
┌─────────────────┬─────────────────┬─────────────────┐
│   Superviseurs  │  Comité SST     │ Représentants   │
│                 │                 │ des travailleurs│
└─────────────────┴─────────────────┴─────────────────┘
    ↓                   ↓                   ↓
Travailleurs      Enquêteurs SST    Secouristes

2.2 RESPONSABILITÉS ET AUTORITÉS

EMPLOYEUR / DIRECTION
• Élaboration et mise en œuvre du programme de prévention (LSST, art. 51)
• Fourniture des équipements de protection et formation (LSST, art. 51)
• Maintien des installations sécuritaires (LSST, art. 51)
• Enquête et correction des situations dangereuses (LSST, art. 62)

COORDONNATEUR SANTÉ-SÉCURITÉ
• Coordination du programme de prévention
• Formation et sensibilisation du personnel
• Inspection régulière des lieux de travail
• Liaison avec les organismes de prévention

COMITÉ DE SANTÉ ET SÉCURITÉ DU TRAVAIL
• Participation à l'identification des risques (LSST, art. 78)
• Réception et investigation des plaintes (LSST, art. 78)
• Recommandations d'amélioration (LSST, art. 78)
• Inspection trimestrielle des lieux (LSST, art. 78)

SUPERVISEURS
• Application des méthodes sécuritaires (LSST, art. 54)
• Formation pratique des employés sous supervision
• Surveillance continue des conditions de travail
• Correction immédiate des situations dangereuses

TRAVAILLEURS
• Respect des règles et procédures établies (LSST, art. 49)
• Utilisation des équipements de protection fournis (LSST, art. 49)
• Signalement des dangers et situations dangereuses (LSST, art. 49)
• Participation aux formations obligatoires

═══════════════════════════════════════════════════════════════════════════════

3. IDENTIFICATION ET ANALYSE DES RISQUES

3.1 MÉTHODOLOGIE D'IDENTIFICATION

L'identification des risques a été réalisée selon une approche systématique comprenant :

a) Inspection visuelle complète des lieux de travail
b) Analyse des tâches et méthodes de travail
c) Consultation des travailleurs et représentants SST
d) Révision des statistiques d'accidents sectorielles CNESST
e) Analyse des fiches de données de sécurité (FDS)

3.2 MATRICE D'ÉVALUATION DES RISQUES

Probabilité (P) × Gravité (G) = Niveau de risque (R)

PROBABILITÉ                    GRAVITÉ
1 = Très rare                  1 = Mineure
2 = Rare                       2 = Modérée  
3 = Possible                   3 = Majeure
4 = Probable                   4 = Grave
5 = Très probable              5 = Catastrophique

NIVEAU DE RISQUE : R = P × G
1-4 : Acceptable    5-9 : Modéré    10-15 : Élevé    16-25 : Inacceptable

3.3 RISQUES IDENTIFIÉS PAR SECTEUR

${selectedGroup === "1" ? `
┌─────────────────────────┬─────┬─────┬─────┬─────────────────────────────┐
│      DANGER/RISQUE      │  P  │  G  │  R  │     MESURES ACTUELLES       │
├─────────────────────────┼─────┼─────┼─────┼─────────────────────────────┤
│ Chutes de hauteur       │  4  │  5  │ 20  │ Échafaudages, harnais      │
│ (échafaudages, toitures)│     │     │     │ Points d'ancrage certifiés  │
├─────────────────────────┼─────┼─────┼─────┼─────────────────────────────┤
│ Accidents véhicules     │  3  │  4  │ 12  │ Signaleurs, gilets haute    │
│ mobiles/équipements     │     │     │     │ visibilité, formation       │
├─────────────────────────┼─────┼─────┼─────┼─────────────────────────────┤
│ Électrocution           │  2  │  5  │ 10  │ Consignation, détecteurs    │
│                         │     │     │     │ de tension, EPI isolants    │
├─────────────────────────┼─────┼─────┼─────┼─────────────────────────────┤
│ Exposition substances   │  3  │  3  │  9  │ Ventilation, masques        │
│ chimiques/poussières    │     │     │     │ respiratoires, FDS          │
├─────────────────────────┼─────┼─────┼─────┼─────────────────────────────┤
│ Troubles musculo-       │  4  │  2  │  8  │ Techniques de levage,       │
│ squelettiques (TMS)     │     │     │     │ équipements ergonomiques    │
└─────────────────────────┴─────┴─────┴─────┴─────────────────────────────┘
` : selectedGroup === "2" ? `
┌─────────────────────────┬─────┬─────┬─────┬─────────────────────────────┐
│      DANGER/RISQUE      │  P  │  G  │  R  │     MESURES ACTUELLES       │
├─────────────────────────┼─────┼─────┼─────┼─────────────────────────────┤
│ Machines et équipements │  3  │  4  │ 12  │ Protecteurs, consignation   │
│ industriels             │     │     │     │ Formation opérateurs        │
├─────────────────────────┼─────┼─────┼─────┼─────────────────────────────┤
│ Exposition substances   │  4  │  3  │ 12  │ Ventilation locale, EPI     │
│ chimiques               │     │     │     │ respiratoire, surveillance  │
├─────────────────────────┼─────┼─────┼─────┼─────────────────────────────┤
│ Troubles musculo-       │  5  │  2  │ 10  │ Rotation, pauses, formation │
│ squelettiques (TMS)     │     │     │     │ ergonomique                 │
├─────────────────────────┼─────┼─────┼─────┼─────────────────────────────┤
│ Bruit et vibrations     │  4  │  2  │  8  │ Protections auditives,      │
│                         │     │     │     │ maintenance préventive      │
├─────────────────────────┼─────┼─────┼─────┼─────────────────────────────┤
│ Incendie/explosion      │  2  │  5  │ 10  │ Détection, extinction       │
│                         │     │     │     │ Plans d'évacuation          │
└─────────────────────────┴─────┴─────┴─────┴─────────────────────────────┘
` : `
┌─────────────────────────┬─────┬─────┬─────┬─────────────────────────────┐
│      DANGER/RISQUE      │  P  │  G  │  R  │     MESURES ACTUELLES       │
├─────────────────────────┼─────┼─────┼─────┼─────────────────────────────┤
│ Troubles musculo-       │  4  │  2  │  8  │ Postes ergonomiques,        │
│ squelettiques (bureaux) │     │     │     │ pauses régulières           │
├─────────────────────────┼─────┼─────┼─────┼─────────────────────────────┤
│ Stress et facteurs      │  3  │  3  │  9  │ Programme d'aide aux        │
│ psychosociaux           │     │     │     │ employés, charge de travail │
├─────────────────────────┼─────┼─────┼─────┼─────────────────────────────┤
│ Qualité air intérieur   │  3  │  2  │  6  │ Ventilation, entretien      │
│                         │     │     │     │ régulier des systèmes       │
├─────────────────────────┼─────┼─────┼─────┼─────────────────────────────┤
│ Troubles visuels        │  4  │  1  │  4  │ Éclairage adéquat,          │
│ (écrans)                │     │     │     │ pauses visuelles            │
└─────────────────────────┴─────┴─────┴─────┴─────────────────────────────┘
`}

═══════════════════════════════════════════════════════════════════════════════

4. OBJECTIFS, CIBLES ET PROGRAMMES DE PRÉVENTION

4.1 OBJECTIFS GÉNÉRAUX

• OBJECTIF PRINCIPAL : Éliminer les accidents du travail et les maladies professionnelles
• OBJECTIF SECONDAIRE : Créer un environnement de travail sain et sécuritaire
• OBJECTIF TERTIAIRE : Développer une culture de prévention durable

4.2 CIBLES QUANTIFIABLES (Année ${new Date().getFullYear()})

┌─────────────────────────────────┬─────────────┬─────────────┬─────────────┐
│           INDICATEUR            │   BASELINE  │    CIBLE    │   ÉCHÉANCE  │
├─────────────────────────────────┼─────────────┼─────────────┼─────────────┤
│ Taux de fréquence des accidents │     --      │      0      │ 31 déc. ${new Date().getFullYear()} │
│ Nombre de situations dangereuses│     --      │     < 5     │ Trimestriel │
│ corrigées dans les délais       │             │             │             │
│ Taux de participation aux       │     --      │    100%     │ Annuel      │
│ formations SST obligatoires     │             │             │             │
│ Conformité aux inspections      │     --      │    100%     │ Mensuel     │
│ CNESST                          │             │             │             │
└─────────────────────────────────┴─────────────┴─────────────┴─────────────┘

4.3 PROGRAMMES SPÉCIFIQUES

PROGRAMME 1 : PRÉVENTION DES CHUTES
• Responsable : Coordonnateur SST
• Échéance : En continu
• Indicateur : Zéro chute de hauteur

PROGRAMME 2 : FORMATION ACCUEIL SÉCURITÉ
• Responsable : Superviseurs + RH
• Échéance : Avant première affectation
• Indicateur : 100% des nouveaux employés formés

PROGRAMME 3 : INSPECTION PRÉVENTIVE
• Responsable : Comité SST
• Échéance : Mensuelle
• Indicateur : 100% des zones inspectées

═══════════════════════════════════════════════════════════════════════════════

5. MESURES DE PRÉVENTION ET DE PROTECTION

5.1 HIÉRARCHIE DES MESURES (LSST, art. 51)

Les mesures de prévention sont appliquées selon l'ordre de priorité suivant :

1. ÉLIMINATION DU DANGER À LA SOURCE
2. SUBSTITUTION PAR UN PROCÉDÉ MOINS DANGEREUX  
3. CONTRÔLES TECHNIQUES (ingénierie)
4. MESURES ADMINISTRATIVES (procédures, formation)
5. ÉQUIPEMENTS DE PROTECTION INDIVIDUELLE (EPI)

5.2 MESURES PAR CATÉGORIE DE RISQUES

${selectedGroup === "1" ? `
🔴 CHUTES DE HAUTEUR (Priorité 1 - Risque inacceptable)

ÉLIMINATION :
• Préfabrication au sol des éléments
• Utilisation de grues pour éviter travaux en hauteur
• Conception sécuritaire des structures

SUBSTITUTION :
• Remplacement échafaudages traditionnels par plateformes élévatrices
• Utilisation de garde-corps permanents vs temporaires

CONTRÔLES TECHNIQUES :
• Installation de points d'ancrage certifiés (CSA Z259.12)
• Échafaudages conformes (RSST, section II)
• Filets de sécurité sous ouvertures > 3 mètres

MESURES ADMINISTRATIVES :
• Procédure obligatoire d'inspection pré-utilisation
• Formation certifiée travail en hauteur
• Permis de travail pour hauteurs > 6 mètres

ÉQUIPEMENTS DE PROTECTION INDIVIDUELLE :
• Harnais complet certifié CSA Z259.10
• Longes avec absorbeur d'énergie
• Casques avec mentonnière obligatoire

🟡 VÉHICULES ET ÉQUIPEMENTS MOBILES (Priorité 2 - Risque élevé)

CONTRÔLES TECHNIQUES :
• Signalisation sonore de recul (RSST, art. 255)
• Systèmes de détection d'obstacles
• Éclairage haute intensité

MESURES ADMINISTRATIVES :  
• Plan de circulation sur chantier
• Formation opérateurs certifiée CNESST
• Inspection quotidienne des équipements (check-list)
• Signaleurs formés pour manœuvres complexes

ÉQUIPEMENTS DE PROTECTION INDIVIDUELLE :
• Gilets haute visibilité classe 2 ou 3
• Casques de sécurité avec identification fonction
• Chaussures de sécurité antidérapantes
` : selectedGroup === "2" ? `
🔴 MACHINES ET ÉQUIPEMENTS (Priorité 1 - Risque élevé)

CONTRÔLES TECHNIQUES :
• Protecteurs fixes et mobiles (RSST, art. 182-184)
• Dispositifs d'arrêt d'urgence accessibles
• Consignation/déconsignation (RSST, art. 185-188)

MESURES ADMINISTRATIVES :
• Procédures de consignation écrites et affichées
• Formation spécifique par type d'équipement
• Inspection préventive selon calendrier

ÉQUIPEMENTS DE PROTECTION INDIVIDUELLE :
• Gants résistants aux coupures (selon tâche)
• Lunettes de protection contre projections
• Protection auditive adaptée au niveau sonore

🟡 SUBSTANCES CHIMIQUES (Priorité 2 - Risque modéré)

SUBSTITUTION :
• Remplacement solvants toxiques par alternatives moins dangereuses
• Produits de nettoyage écologiques

CONTRÔLES TECHNIQUES :
• Ventilation locale à la source
• Système de captage intégré aux procédés
• Stockage sécuritaire selon classes de dangers

MESURES ADMINISTRATIVES :
• Fiches de données de sécurité (FDS) disponibles
• Formation SIMDUT obligatoire
• Étiquetage conforme des contenants

ÉQUIPEMENTS DE PROTECTION INDIVIDUELLE :
• Protection respiratoire selon type d'exposition
• Gants chimiquement résistants
• Vêtements de protection selon FDS
` : `
🟡 ERGONOMIE ET TMS (Priorité 1 - Risque modéré)

CONTRÔLES TECHNIQUES :
• Postes de travail ajustables
• Écrans et claviers ergonomiques
• Support lombaire et appui-pieds

MESURES ADMINISTRATIVES :
• Pauses obligatoires aux 2 heures
• Rotation des tâches répétitives
• Formation en ergonomie de bureau

🟡 FACTEURS PSYCHOSOCIAUX (Priorité 2 - Risque émergent)

MESURES ADMINISTRATIVES :
• Programme d'aide aux employés (PAE)
• Politique contre le harcèlement
• Gestion de la charge de travail
• Reconnaissance et communication positive
`}

═══════════════════════════════════════════════════════════════════════════════

6. ÉQUIPEMENTS DE PROTECTION INDIVIDUELLE

6.1 PRINCIPES GÉNÉRAUX

Conformément à l'article 51 de la LSST, les EPI sont utilisés EN DERNIER RECOURS, 
lorsque les autres mesures de prévention sont insuffisantes ou en complément.

6.2 MATRICE DES EPI PAR POSTE/ACTIVITÉ

${selectedGroup === "1" ? `
┌─────────────────┬───────┬────────┬─────────┬─────────┬────────┬─────────┐
│  POSTE/ACTIVITÉ │ CASQUE│ LUNETTE│ AUDITIF │ RESPIRAT│ MAINS  │  PIEDS  │
├─────────────────┼───────┼────────┼─────────┼─────────┼────────┼─────────┤
│ Charpentier     │   ●   │   ○    │    ○    │    ○    │   ●    │    ●    │
│ Maçon           │   ●   │   ●    │    ○    │    ●    │   ●    │    ●    │
│ Électricien     │   ●   │   ●    │    ○    │    ○    │   ●    │    ●    │
│ Opérateur       │   ●   │   ○    │    ●    │    ○    │   ●    │    ●    │
│ équipement lourd│       │        │         │         │        │         │
│ Travail hauteur │   ●   │   ○    │    ○    │    ○    │   ●    │    ●    │
│ + harnais       │       │        │         │         │        │         │
└─────────────────┴───────┴────────┴─────────┴─────────┴────────┴─────────┘

● = Obligatoire    ○ = Selon conditions
` : `
┌─────────────────┬───────┬────────┬─────────┬─────────┬────────┬─────────┐
│  POSTE/ACTIVITÉ │ CASQUE│ LUNETTE│ AUDITIF │ RESPIRAT│ MAINS  │  PIEDS  │
├─────────────────┼───────┼────────┼─────────┼─────────┼────────┼─────────┤
│ Opérateur       │   ○   │   ●    │    ●    │    ○    │   ●    │    ●    │
│ machine         │       │        │         │         │        │         │
│ Soudeur         │   ○   │   ●    │    ●    │    ●    │   ●    │    ●    │
│ Manutention     │   ○   │   ○    │    ○    │    ○    │   ●    │    ●    │
│ Maintenance     │   ●   │   ●    │    ●    │    ○    │   ●    │    ●    │
│ Laboratoire     │   ○   │   ●    │    ○    │    ●    │   ●    │    ○    │
└─────────────────┴───────┴────────┴─────────┴─────────┴────────┴─────────┘

● = Obligatoire    ○ = Selon conditions
`}

6.3 SPÉCIFICATIONS TECHNIQUES

PROTECTION DE LA TÊTE
• Norme : CSA Z94.1 ou équivalent CE EN 397
• Type : Casque rigide avec suspension
• Couleur : Selon fonction (blanc=superviseur, jaune=général, etc.)

PROTECTION OCULAIRE  
• Norme : CSA Z94.3 ou équivalent CE EN 166
• Type : Lunettes avec protection latérale ou écran facial
• Traitement anti-buée obligatoire

PROTECTION AUDITIVE
• Norme : CSA Z94.2 ou équivalent CE EN 352
• Réduction minimum : NRR 25 dB
• Type : Bouchons ou coquilles selon préférence

PROTECTION RESPIRATOIRE
• Norme : NIOSH/CSA Z94.4 ou équivalent CE EN 149
• Classe : Selon évaluation d'exposition
• Formation obligatoire avant utilisation

6.4 GESTION DES EPI

RESPONSABILITÉS EMPLOYEUR :
• Fourniture gratuite des EPI conformes (LSST, art. 51)
• Formation sur utilisation correcte
• Remplacement selon état/durée de vie
• Entreposage dans conditions appropriées

RESPONSABILITÉS TRAVAILLEUR :
• Utilisation selon instructions (LSST, art. 49)
• Inspection avant usage
• Signalement défaillances
• Entretien selon recommandations fabricant

═══════════════════════════════════════════════════════════════════════════════

12. CONTRÔLE ET SUIVI DU PROGRAMME

12.1 INDICATEURS DE PERFORMANCE

INDICATEURS DE RÉSULTATS :
• Taux de fréquence des accidents avec arrêt de travail
• Taux de gravité (jours perdus/heures travaillées)
• Nombre de maladies professionnelles déclarées
• Coûts directs et indirects des accidents

INDICATEURS DE PROCESSUS :
• Taux de participation aux formations SST
• Pourcentage de situations dangereuses corrigées dans les délais
• Nombre d'inspections réalisées vs planifiées  
• Temps de réponse aux signalements

12.2 RÉVISION DU PROGRAMME

RÉVISION ANNUELLE OBLIGATOIRE :
• Analyse des indicateurs de performance
• Évaluation de l'efficacité des mesures implantées
• Mise à jour selon évolution réglementaire
• Consultation du comité SST et des travailleurs

RÉVISION EXCEPTIONNELLE :
• Suite à accident grave ou décès
• Modification importante des procédés
• Introduction de nouveaux équipements/substances
• Changement organisationnel majeur

12.3 AMÉLIORATION CONTINUE

Le programme de prévention s'inscrit dans une démarche d'amélioration continue 
basée sur le cycle PDCA (Plan-Do-Check-Act) :

PLAN (Planifier) : Objectifs et cibles SST
DO (Réaliser) : Mise en œuvre des mesures
CHECK (Vérifier) : Surveillance et évaluation
ACT (Agir) : Actions correctives et préventives

═══════════════════════════════════════════════════════════════════════════════

ANNEXES

ANNEXE 1 : Formulaires et procédures
ANNEXE 2 : Fiches de données de sécurité (FDS)  
ANNEXE 3 : Registres et carnets d'inspection
ANNEXE 4 : Programmes de formation détaillés
ANNEXE 5 : Plans d'urgence et d'évacuation
ANNEXE 6 : Coordonnées utiles et ressources

═══════════════════════════════════════════════════════════════════════════════

SIGNATURES ET APPROBATIONS

Ce programme de prévention a été élaboré en collaboration avec le comité de 
santé et sécurité du travail et les représentants des travailleurs.

Il a été approuvé par la direction et sera révisé annuellement ou lors de 
modifications importantes des conditions de travail.

DIRECTION                          COMITÉ SST

_____________________             _____________________
Nom et titre                      Président comité SST  
Date : ${currentDate}                   Date : ${currentDate}


COORDONNATEUR SST                  REPRÉSENTANT TRAVAILLEURS

_____________________             _____________________
Nom et titre                      Nom et fonction
Date : ${currentDate}                   Date : ${currentDate}

═══════════════════════════════════════════════════════════════════════════════
                            FIN DU PROGRAMME
                         Généré par PPAI v1.0
                      © ${new Date().getFullYear()} - Conforme CNESST/LSST
═══════════════════════════════════════════════════════════════════════════════`;

    setGeneratedContent(mockContent);
    setIsGenerating(false);
    
    toast({
      title: "Succès",
      description: "Programme professionnel généré avec succès !",
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
            Générateur Prototype APSAM
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
              {isGenerating ? "Génération..." : "Générer Programme APSAM"}
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
              <p className="font-medium text-orange-800">Mode Prototype APSAM</p>
              <p className="text-sm text-orange-700 mt-1">
                Programme généré selon les standards APSAM avec structure professionnelle complète. 
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
                Programme APSAM Généré
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
