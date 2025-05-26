
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Thermometer, Filter, Download } from "lucide-react";

interface ConfigurationData {
  secteur: string;
  tailleEtablissement: string;
  groupePrioritaire: number;
  activitesPrincipales: string[];
}

interface RiskHeatmapProps {
  configuration: ConfigurationData;
}

interface HeatmapData {
  secteur: string;
  riskCategory: string;
  value: number; // 0-10
  incidents: number;
}

const riskCategories = [
  "Physiques",
  "Sécurité mécanique", 
  "Chimiques",
  "Biologiques",
  "Ergonomiques",
  "Psychosociaux",
  "Environnementaux"
];

const secteurPhases = {
  construction: ["Mobilisation", "Démolition", "Gros œuvre", "Structure", "Finitions"],
  industrie: ["Réception", "Production", "Assemblage", "Contrôle", "Expédition"],
  services: ["Accueil", "Traitement", "Nettoyage", "Maintenance", "Administration"],
  transport: ["Chargement", "Transport", "Déchargement", "Maintenance", "Stockage"],
  mines: ["Extraction", "Concassage", "Transport", "Traitement", "Réhabilitation"],
  foresterie: ["Abattage", "Débardage", "Transport", "Transformation", "Reboisement"]
};

export function RiskHeatmap({ configuration }: RiskHeatmapProps) {
  const [selectedCell, setSelectedCell] = useState<{ secteur: string; category: string } | null>(null);
  
  const phases = secteurPhases[configuration.secteur as keyof typeof secteurPhases] || 
                secteurPhases.construction;

  // Génération des données de heatmap basées sur la configuration
  const generateHeatmapData = (): HeatmapData[] => {
    const data: HeatmapData[] = [];
    const riskMultiplier = configuration.groupePrioritaire === 1 ? 1.5 : 
                          configuration.groupePrioritaire === 2 ? 1.0 : 0.6;
    
    phases.forEach(phase => {
      riskCategories.forEach(category => {
        // Simulation basée sur les activités principales
        const isHighRiskActivity = configuration.activitesPrincipales.some(activity => {
          if (category === "Physiques") return activity.includes("hauteur") || activity.includes("levage");
          if (category === "Chimiques") return activity.includes("chimiques") || activity.includes("soudage");
          if (category === "Ergonomiques") return activity.includes("manutention");
          return false;
        });
        
        const baseValue = Math.random() * 5 + (isHighRiskActivity ? 3 : 1);
        const value = Math.min(10, baseValue * riskMultiplier);
        const incidents = Math.floor(Math.random() * 15 + (value > 7 ? 5 : 0));
        
        data.push({
          secteur: phase,
          riskCategory: category,
          value: Math.round(value * 10) / 10,
          incidents
        });
      });
    });
    
    return data;
  };

  const heatmapData = generateHeatmapData();

  const getRiskColor = (value: number) => {
    if (value >= 8) return "bg-red-600";
    if (value >= 6) return "bg-red-400";
    if (value >= 4) return "bg-orange-400";
    if (value >= 2) return "bg-yellow-400";
    return "bg-green-400";
  };

  const getRiskLevel = (value: number) => {
    if (value >= 8) return "Critique";
    if (value >= 6) return "Élevé";
    if (value >= 4) return "Moyen";
    if (value >= 2) return "Modéré";
    return "Faible";
  };

  const getCellData = (phase: string, category: string) => {
    return heatmapData.find(d => d.secteur === phase && d.riskCategory === category);
  };

  const handleCellClick = (phase: string, category: string) => {
    setSelectedCell({ secteur: phase, category });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-sst-blue" />
              Carte de Chaleur des Risques SSE
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtres
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Secteur: {configuration.secteur} - Groupe prioritaire {configuration.groupePrioritaire}
          </p>
        </CardHeader>
      </Card>

      {/* Légende */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Niveau de risque:</span>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-400 rounded"></div>
                <span className="text-xs">Faible (0-2)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                <span className="text-xs">Modéré (2-4)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-400 rounded"></div>
                <span className="text-xs">Moyen (4-6)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-400 rounded"></div>
                <span className="text-xs">Élevé (6-8)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-600 rounded"></div>
                <span className="text-xs">Critique (8-10)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Heatmap */}
      <Card>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header Row */}
              <div className="grid grid-cols-8 gap-1 mb-2">
                <div className="p-2 text-xs font-medium text-gray-600">Catégories / Phases</div>
                {phases.map(phase => (
                  <div key={phase} className="p-2 text-xs font-medium text-center text-gray-600">
                    {phase}
                  </div>
                ))}
              </div>

              {/* Data Rows */}
              {riskCategories.map(category => (
                <div key={category} className="grid grid-cols-8 gap-1 mb-1">
                  <div className="p-2 text-xs font-medium text-gray-700 flex items-center">
                    {category}
                  </div>
                  {phases.map(phase => {
                    const cellData = getCellData(phase, category);
                    const isSelected = selectedCell?.secteur === phase && selectedCell?.category === category;
                    
                    return (
                      <div
                        key={`${phase}-${category}`}
                        className={cn(
                          "aspect-square p-1 cursor-pointer transition-all hover:opacity-80 relative rounded",
                          cellData ? getRiskColor(cellData.value) : "bg-gray-200",
                          isSelected && "ring-2 ring-sst-blue ring-offset-1"
                        )}
                        onClick={() => handleCellClick(phase, category)}
                        title={`${category} - ${phase}: ${cellData?.value || 0} (${cellData?.incidents || 0} incidents)`}
                      >
                        <div className="w-full h-full flex flex-col items-center justify-center text-xs">
                          <span className="text-white font-bold">
                            {cellData?.value.toFixed(1) || "0.0"}
                          </span>
                          {cellData && cellData.incidents > 0 && (
                            <span className="text-white text-[10px]">
                              {cellData.incidents}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Détails de la cellule sélectionnée */}
      {selectedCell && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Détails: {selectedCell.category} - {selectedCell.secteur}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const cellData = getCellData(selectedCell.secteur, selectedCell.category);
              if (!cellData) return null;
              
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Niveau de risque</div>
                      <Badge className={cn(
                        "text-white",
                        getRiskColor(cellData.value)
                      )}>
                        {getRiskLevel(cellData.value)} ({cellData.value})
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Incidents rapportés</div>
                      <div className="text-lg font-bold">{cellData.incidents}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Activités concernées</div>
                      <div className="text-sm">
                        {configuration.activitesPrincipales
                          .filter(activity => {
                            if (selectedCell.category === "Physiques") return activity.includes("hauteur");
                            if (selectedCell.category === "Chimiques") return activity.includes("chimiques");
                            return true;
                          })
                          .slice(0, 2)
                          .join(", ") || "Toutes activités"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
