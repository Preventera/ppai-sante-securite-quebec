
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Risk {
  id: string;
  name: string;
  phase: string;
  category: string;
  probability: number;
  gravity: number;
  initialRisk: number;
  measures: string;
  residualRisk: number;
  status: string;
  responsible: string;
  sector: string;
}

interface RiskTableProps {
  risks: Risk[];
  searchTerm: string;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "action requise":
      return "bg-red-100 text-red-800";
    case "en contrôle":
      return "bg-yellow-100 text-yellow-800";
    case "complété":
      return "bg-green-100 text-green-800";
    case "en surveillance":
      return "bg-blue-100 text-blue-800";
    case "contrôles actifs":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getRiskLevelColor = (risk: number) => {
  if (risk >= 16) return "bg-red-600 text-white";
  if (risk >= 12) return "bg-orange-500 text-white";
  if (risk >= 8) return "bg-yellow-500 text-black";
  return "bg-green-500 text-white";
};

const getTrendIcon = (initial: number, residual: number) => {
  const improvement = ((initial - residual) / initial) * 100;
  if (improvement > 10) return <TrendingDown className="w-4 h-4 text-green-600" />;
  if (improvement < -10) return <TrendingUp className="w-4 h-4 text-red-600" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
};

export function RiskTable({ risks, searchTerm }: RiskTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof Risk>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const filteredRisks = risks.filter(risk =>
    risk.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    risk.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    risk.phase.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedRisks = [...filteredRisks].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  const handleSort = (field: keyof Risk) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tableau des risques détaillé</CardTitle>
        <p className="text-sm text-gray-600">
          {filteredRisks.length} risque(s) trouvé(s)
        </p>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("id")}
                >
                  ID
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("phase")}
                >
                  Phase
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("category")}
                >
                  Catégorie
                </TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">P</TableHead>
                <TableHead className="text-center">G</TableHead>
                <TableHead className="text-center">Risque initial</TableHead>
                <TableHead>Mesures</TableHead>
                <TableHead className="text-center">Risque résiduel</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead className="text-center">Tendance</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRisks.map((risk) => (
                <TableRow key={risk.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{risk.id}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{risk.phase}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate" title={risk.category}>
                    {risk.category}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={risk.name}>
                    {risk.name}
                  </TableCell>
                  <TableCell className="text-center">{risk.probability}</TableCell>
                  <TableCell className="text-center">{risk.gravity}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={getRiskLevelColor(risk.initialRisk)}>
                      {risk.initialRisk}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={risk.measures}>
                    {risk.measures}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={getRiskLevelColor(risk.residualRisk)}>
                      {risk.residualRisk}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(risk.status)}>
                      {risk.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[120px] truncate" title={risk.responsible}>
                    {risk.responsible}
                  </TableCell>
                  <TableCell className="text-center">
                    {getTrendIcon(risk.initialRisk, risk.residualRisk)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
