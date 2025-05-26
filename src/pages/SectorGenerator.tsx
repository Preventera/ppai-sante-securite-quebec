import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Building, Search, Filter, Download, Copy, Wand2, LucideIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ExportActions } from "@/components/ExportActions";

// Interface pour les secteurs
interface SectorData {
  groupe: number;
  scian: string;
  nom: string;
  description: string;
  risquesPrincipaux: string[];
  obligations: string[];
  prompts: {
    [key: string]: string;
  };
}

// Base de données des secteurs d'activité CNESST
const secteursDatabase: Record<string, SectorData> = {
  "construction-residentielle": {
    groupe: 1,
    scian: "2361",
    nom: "Construction résidentielle",
    description: "Construction de maisons unifamiliales, duplex et petits immeubles",
    risquesPrincipaux: ["Chutes de hauteur", "Véhicules en mouvement", "Sources d'énergie", "Objets qui tombent"],
    obligations: ["Programme détaillé", "Coordonnateur SST", "Formation spécialisée", "Comité de chantier"],
    prompts: {
      "programme": "Rédige un programme de prévention CNESST pour un projet de construction résidentielle de 15 unités, incluant la gestion des risques de chutes, l'organisation sécuritaire du chantier et les procédures d'urgence.",
      "analyse-risques": "Effectue une analyse des risques spécifique à la construction résidentielle : travaux de toiture, installation de fenêtres, travaux d'isolation et finition extérieure.",
      "mesures-preventives": "Développe un plan de mesures préventives pour les travaux de charpenterie résidentielle, incluant la protection contre les chutes et la manutention sécuritaire des matériaux."
    }
  },
  "construction-commerciale": {
    groupe: 1,
    scian: "2362",
    nom: "Construction commerciale et institutionnelle",
    description: "Édifices à bureaux, centres commerciaux, écoles, hôpitaux",
    risquesPrincipaux: ["Levage et grutage", "Travaux en hauteur", "Espaces confinés", "Soudage"],
    obligations: ["Programme détaillé", "Coordonnateur SST", "Plans de levage", "Permis espaces confinés"],
    prompts: {
      "programme": "Conçois un programme de prévention pour un chantier commercial de 100 travailleurs, incluant gestion des grues, coordination multi-entrepreneurs et procédures de soudage.",
      "levage": "Élabore un plan de sécurité pour les opérations de levage sur chantier commercial, incluant inspection des grues, communication et périmètres de sécurité.",
      "espaces-confines": "Développe une procédure d'entrée sécuritaire en espaces confinés pour les travaux de mécanique du bâtiment."
    }
  },
  "transformation-bois": {
    groupe: 2,
    scian: "3211",
    nom: "Transformation du bois",
    description: "Scieries, menuiseries, fabrication de produits en bois",
    risquesPrincipaux: ["Machines dangereuses", "Poussières combustibles", "Bruit", "Produits chimiques"],
    obligations: ["Analyse ergonomique", "Contrôle poussières", "Protection auditive", "Cadenassage"],
    prompts: {
      "programme": "Élabore un programme de prévention pour une scierie de 40 employés, intégrant la prévention des accidents mécaniques, le contrôle des poussières de bois et la protection contre le bruit.",
      "ergonomie": "Analyse ergonomique des postes de travail en scierie : manutention des billots, opération des scies, empilage des planches et mesures de prévention des TMS.",
      "explosions": "Développe un plan de prévention des explosions de poussières dans un atelier de menuiserie, incluant systèmes d'aspiration, nettoyage et procédures d'urgence."
    }
  },
  "industrie-alimentaire": {
    groupe: 2,
    scian: "3111",
    nom: "Industrie alimentaire",
    description: "Transformation, conservation et conditionnement d'aliments",
    risquesPrincipaux: ["Contamination biologique", "Produits chimiques", "Glissades", "Températures extrêmes"],
    obligations: ["HACCP-SST", "Formation hygiène", "Équipements sanitaires", "Prévention glissades"],
    prompts: {
      "programme": "Crée un programme de prévention pour une usine agroalimentaire de 60 employés, intégrant HACCP, sécurité chimique et prévention des chutes et glissades.",
      "hygiene": "Développe un protocole de sécurité pour la manipulation d'aliments, incluant équipements de protection, nettoyage et désinfection.",
      "chambres-froides": "Élabore des procédures sécuritaires pour le travail en chambres froides, incluant équipements de protection et surveillance."
    }
  },
  "services-municipaux": {
    groupe: 3,
    scian: "9110",
    nom: "Services municipaux",
    description: "Administration publique locale, voirie, parcs et espaces verts",
    risquesPrincipaux: ["Espaces confinés", "Exposition chimique", "Véhicules lourds", "Agents biologiques"],
    obligations: ["Formation spécialisée", "Équipements détection", "Procédures d'urgence", "Surveillance médicale"],
    prompts: {
      "programme": "Crée un programme de prévention pour les services techniques municipaux (voirie, aqueduc, égouts), couvrant 25 employés et incluant les risques d'espaces confinés.",
      "espaces-confines": "Élabore une procédure d'entrée sécuritaire en espaces confinés pour les travaux d'égouts municipaux, incluant détection de gaz et équipements de sauvetage.",
      "produits-chimiques": "Développe un plan de gestion des produits chimiques pour le traitement de l'eau potable, incluant stockage, manipulation et procédures d'urgence."
    }
  },
  "collecte-dechets": {
    groupe: 3,
    scian: "5621",
    nom: "Collecte et traitement des déchets",
    description: "Collecte, transport et traitement des déchets solides",
    risquesPrincipaux: ["Exposition biologique", "Véhicules en mouvement", "Manutention", "Matières dangereuses"],
    obligations: ["Formation biologique", "Équipements protection", "Maintenance véhicules", "Vaccinations"],
    prompts: {
      "programme": "Élabore un programme de prévention pour une entreprise de collecte de déchets de 30 employés, incluant risques biologiques et sécurité routière.",
      "collecte": "Développe des procédures sécuritaires pour la collecte résidentielle, incluant ergonomie, circulation et gestion des déchets dangereux.",
      "centre-tri": "Crée un plan de sécurité pour un centre de tri, incluant protection biologique, machines et espaces confinés."
    }
  },
  "services-professionnels": {
    groupe: 4,
    scian: "5411",
    nom: "Services professionnels et techniques",
    description: "Bureaux d'études, cabinets conseils, services informatiques",
    risquesPrincipaux: ["Ergonomie postes informatiques", "Qualité air intérieur", "Stress", "Fatigue visuelle"],
    obligations: ["Programme simplifié", "Évaluation ergonomique", "Prévention psychosociale", "Aménagement postes"],
    prompts: {
      "programme-simplifie": "Rédige un programme de prévention simplifié pour un bureau de 15 employés en services professionnels, intégrant ergonomie des postes informatiques et prévention du stress.",
      "ergonomie-bureau": "Effectue une évaluation ergonomique des postes de travail informatique, incluant aménagement du poste, éclairage et recommandations préventives.",
      "risques-psychosociaux": "Développe un plan de prévention des risques psychosociaux en milieu de bureau : charge de travail, relations interpersonnelles et organisation du travail."
    }
  },
  "commerce-detail": {
    groupe: 4,
    scian: "4411",
    nom: "Commerce de détail",
    description: "Magasins, centres commerciaux, vente au détail",
    risquesPrincipaux: ["Manutention", "Vol et agression", "Glissades", "Réception marchandises"],
    obligations: ["Programme simplifié", "Formation manutention", "Sécurité", "Premiers secours"],
    prompts: {
      "programme": "Crée un programme de prévention pour un magasin de 20 employés, incluant manutention sécuritaire, prévention du vol et premiers secours.",
      "manutention": "Développe des procédures de manutention pour la réception et mise en tablettes, incluant techniques de levage et équipements.",
      "securite": "Élabore un plan de sécurité contre le vol et l'agression, incluant procédures d'urgence et formation du personnel."
    }
  }
};

const groupeColors: Record<number, string> = {
  1: "bg-orange-500",
  2: "bg-blue-500", 
  3: "bg-green-500",
  4: "bg-purple-500"
};

const groupeNames: Record<number, string> = {
  1: "Construction",
  2: "Manufacturier",
  3: "Municipal/Services",
  4: "Bureaux/Commerce"
};

export default function SectorGenerator() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [selectedPromptType, setSelectedPromptType] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Filtrer les secteurs selon la recherche et le groupe sélectionné
  const filteredSectors = Object.entries(secteursDatabase).filter(([key, sector]) => {
    const matchesSearch = sector.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sector.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sector.scian.includes(searchTerm);
    const matchesGroup = selectedGroup === null || sector.groupe === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const generateContent = async () => {
    if (!selectedSector || !selectedPromptType) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un secteur et un type de prompt.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    // Simulation de génération
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const sector = secteursDatabase[selectedSector];
    const prompt = sector.prompts[selectedPromptType];
    
    const mockContent = `# Programme de Prévention - ${sector.nom}

## 1. Contexte Sectoriel
**Secteur :** ${sector.nom}  
**Code SCIAN :** ${sector.scian}  
**Groupe CNESST :** ${sector.groupe}  
**Description :** ${sector.description}

## 2. Risques Principaux Identifiés
${sector.risquesPrincipaux.map(risque => `- ${risque}`).join('\n')}

## 3. Obligations Spécifiques
${sector.obligations.map(obligation => `- ${obligation}`).join('\n')}

## 4. Programme Détaillé
${prompt}

## 5. Mesures de Prévention Sectorielles
- Identification des dangers spécifiques au secteur ${sector.nom}
- Évaluation des risques selon la matrice CNESST Groupe ${sector.groupe}
- Mesures de contrôle hiérarchisées adaptées aux activités
- Formation spécialisée pour les travailleurs du secteur
- Équipements de protection adaptés aux risques identifiés

## 6. Indicateurs de Performance
- Taux d'accidents par secteur d'activité
- Conformité aux obligations réglementaires
- Participation aux formations sectorielles
- Efficacité des mesures préventives

## 7. Révision et Amélioration Continue
Révision recommandée selon les spécificités du secteur ${sector.nom} et les évolutions réglementaires du Groupe ${sector.groupe} CNESST.`;

    setGeneratedContent(mockContent);
    setIsGenerating(false);
    
    toast({
      title: "Succès",
      description: "Le programme sectoriel a été généré avec succès !",
    });
  };

  const resetForm = () => {
    setSelectedSector(null);
    setSelectedPromptType(null);
    setGeneratedContent("");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-sst-blue">PPAI - Générateur par Secteur d'Activité CNESST</h1>
        <p className="text-gray-600">Programmes personnalisés selon votre secteur d'activité et code SCIAN</p>
      </div>

      {/* Recherche et filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-sst-blue" />
            Recherche de Secteur d'Activité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Recherchez par nom de secteur, description ou code SCIAN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(groupe => (
                <Button
                  key={groupe}
                  variant={selectedGroup === groupe ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedGroup(selectedGroup === groupe ? null : groupe)}
                  className={`${selectedGroup === groupe ? groupeColors[groupe] : ''}`}
                >
                  Groupe {groupe}
                </Button>
              ))}
              {selectedGroup && (
                <Button variant="outline" size="sm" onClick={() => setSelectedGroup(null)}>
                  Tous
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grille des secteurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSectors.map(([key, sector]) => (
          <Card 
            key={key} 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedSector === key ? 'ring-2 ring-sst-blue bg-blue-50' : ''
            }`}
            onClick={() => setSelectedSector(key)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-gray-600" />
                  <Badge className={`${groupeColors[sector.groupe]} text-white`}>
                    Groupe {sector.groupe}
                  </Badge>
                </div>
                <Badge variant="outline" className="text-xs">
                  {sector.scian}
                </Badge>
              </div>
              
              <h3 className="font-semibold text-sm mb-2">{sector.nom}</h3>
              <p className="text-xs text-gray-600 mb-3">{sector.description}</p>
              
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-gray-700">Risques principaux :</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {sector.risquesPrincipaux.slice(0, 2).map((risque, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {risque}
                      </Badge>
                    ))}
                    {sector.risquesPrincipaux.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{sector.risquesPrincipaux.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configuration du programme */}
      {selectedSector && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-sst-blue" />
              Configuration du Programme - {secteursDatabase[selectedSector].nom}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(secteursDatabase[selectedSector].prompts).map(([type, prompt]) => (
                <Card 
                  key={type}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedPromptType === type ? 'ring-2 ring-sst-blue bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedPromptType(type)}
                >
                  <CardContent className="p-4">
                    <h4 className="font-medium text-sm mb-2 capitalize">
                      {type.replace('-', ' ')}
                    </h4>
                    <p className="text-xs text-gray-600 line-clamp-3">{prompt}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={generateContent} 
                disabled={!selectedPromptType || isGenerating}
                className="flex-1"
              >
                {isGenerating ? "Génération..." : "Générer le programme sectoriel"}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contenu généré */}
      {generatedContent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Programme de Prévention Sectoriel</span>
              <ExportActions 
                data={[{content: generatedContent}]}
                filename={`programme-${selectedSector}-${Date.now()}`}
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
    </div>
  );
}
