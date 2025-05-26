
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Risk {
  id: string;
  name: string;
  probability: number; // 1-5
  gravity: number; // 1-5
  sector: string;
}

interface RiskMatrixProps {
  risks: Risk[];
  onRiskClick?: (risk: Risk) => void;
}

const getRiskLevel = (probability: number, gravity: number) => {
  const score = probability * gravity;
  if (score >= 20) return { level: "Très élevé", color: "bg-red-600" };
  if (score >= 15) return { level: "Élevé", color: "bg-red-500" };
  if (score >= 10) return { level: "Moyen", color: "bg-orange-500" };
  if (score >= 5) return { level: "Modéré", color: "bg-yellow-500" };
  return { level: "Faible", color: "bg-green-500" };
};

const probabilityLabels = ["", "Très rare", "Rare", "Possible", "Probable", "Très probable"];
const gravityLabels = ["", "Négligeable", "Mineure", "Modérée", "Majeure", "Catastrophique"];

export function RiskMatrix({ risks, onRiskClick }: RiskMatrixProps) {
  const [selectedCell, setSelectedCell] = useState<{ prob: number; grav: number } | null>(null);

  const getRisksInCell = (probability: number, gravity: number) => {
    return risks.filter(risk => risk.probability === probability && risk.gravity === gravity);
  };

  const handleCellClick = (probability: number, gravity: number) => {
    setSelectedCell({ prob: probability, grav: gravity });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-sst-blue">
          Matrice des risques 5×5
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-red-600 text-white">Très élevé (20-25)</Badge>
            <Badge className="bg-red-500 text-white">Élevé (15-19)</Badge>
            <Badge className="bg-orange-500 text-white">Moyen (10-14)</Badge>
            <Badge className="bg-yellow-500 text-black">Modéré (5-9)</Badge>
            <Badge className="bg-green-500 text-white">Faible (1-4)</Badge>
          </div>

          {/* Matrix */}
          <div className="grid grid-cols-6 gap-1 text-sm">
            {/* Header row */}
            <div></div>
            {gravityLabels.slice(1).map((label, index) => (
              <div key={index} className="p-2 text-center font-medium text-gray-700 text-xs">
                {label}
              </div>
            ))}

            {/* Matrix rows */}
            {[5, 4, 3, 2, 1].map((probability) => (
              <div key={probability} className="contents">
                <div className="p-2 text-center font-medium text-gray-700 text-xs flex items-center">
                  {probabilityLabels[probability]}
                </div>
                {[1, 2, 3, 4, 5].map((gravity) => {
                  const cellRisks = getRisksInCell(probability, gravity);
                  const { color } = getRiskLevel(probability, gravity);
                  const isSelected = selectedCell?.prob === probability && selectedCell?.grav === gravity;
                  
                  return (
                    <div
                      key={`${probability}-${gravity}`}
                      className={cn(
                        "aspect-square p-1 border border-gray-300 cursor-pointer transition-all hover:opacity-80",
                        color,
                        isSelected && "ring-2 ring-sst-blue ring-offset-1"
                      )}
                      onClick={() => handleCellClick(probability, gravity)}
                      title={`${cellRisks.length} risque(s) - Score: ${probability * gravity}`}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white font-bold text-xs">
                          {cellRisks.length > 0 ? cellRisks.length : ""}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Axis labels */}
          <div className="flex justify-between text-xs text-gray-500">
            <span>Gravité →</span>
            <span>↑ Probabilité</span>
          </div>

          {/* Selected cell details */}
          {selectedCell && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">
                Risques dans cette cellule ({probabilityLabels[selectedCell.prob]} × {gravityLabels[selectedCell.grav]})
              </h4>
              {getRisksInCell(selectedCell.prob, selectedCell.grav).map((risk) => (
                <div
                  key={risk.id}
                  className="p-2 bg-white rounded border cursor-pointer hover:bg-gray-50"
                  onClick={() => onRiskClick?.(risk)}
                >
                  <div className="font-medium">{risk.name}</div>
                  <div className="text-sm text-gray-500">{risk.sector}</div>
                </div>
              ))}
              {getRisksInCell(selectedCell.prob, selectedCell.grav).length === 0 && (
                <p className="text-gray-500">Aucun risque dans cette cellule</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
