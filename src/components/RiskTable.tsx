import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Edit, Trash2, TrendingUp, TrendingDown, Minus, ArrowUpDown } from "lucide-react";
import { Risk } from "@/types/risk";
import { RiskInput } from "@/services/riskService";
import { AddRiskModal } from "@/components/AddRiskModal";

interface RiskTableProps {
  risks: Risk[];
  searchTerm: string;
  onUpdate: (code: string, input: RiskInput) => Promise<unknown>;
  onDelete: (code: string) => Promise<unknown>;
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
  if (initial <= 0) return <Minus className="w-4 h-4 text-gray-400" />;
  const improvement = ((initial - residual) / initial) * 100;
  if (improvement > 10) {
    return (
      <TrendingDown
        className="w-4 h-4 text-green-600"
        aria-label={`Risque réduit de ${Math.round(improvement)} %`}
      />
    );
  }
  if (improvement < -10) return <TrendingUp className="w-4 h-4 text-red-600" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
};

export function RiskTable({ risks, searchTerm, onUpdate, onDelete }: RiskTableProps) {
  const [sortField, setSortField] = useState<keyof Risk>("initialRisk");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [pendingDeletion, setPendingDeletion] = useState<Risk | null>(null);

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
        ? aValue.localeCompare(bValue, "fr")
        : bValue.localeCompare(aValue, "fr");
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
      setSortDirection(field === "initialRisk" || field === "residualRisk" ? "desc" : "asc");
    }
  };

  const sortableHeader = (field: keyof Risk, label: string, className = "") => (
    <TableHead
      className={`cursor-pointer select-none hover:bg-gray-50 ${className}`}
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sortField === field ? "text-sst-blue" : "text-gray-300"}`} />
      </span>
    </TableHead>
  );

  const confirmDeletion = async () => {
    if (!pendingDeletion) return;
    try {
      await onDelete(pendingDeletion.id);
    } finally {
      setPendingDeletion(null);
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
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {sortableHeader("id", "ID")}
                {sortableHeader("phase", "Phase")}
                {sortableHeader("category", "Catégorie")}
                <TableHead>Description</TableHead>
                <TableHead className="text-center">P</TableHead>
                <TableHead className="text-center">G</TableHead>
                {sortableHeader("initialRisk", "Risque initial", "text-center")}
                <TableHead>Mesures</TableHead>
                {sortableHeader("residualRisk", "Risque résiduel", "text-center")}
                {sortableHeader("status", "Statut")}
                <TableHead>Responsable</TableHead>
                <TableHead className="text-center">Tendance</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRisks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={13} className="text-center text-gray-500 py-8">
                    Aucun risque ne correspond à la recherche.
                  </TableCell>
                </TableRow>
              )}
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
                    <div className="flex gap-1 justify-center">
                      <AddRiskModal
                        risk={risk}
                        onSave={(input) => onUpdate(risk.id, input)}
                        trigger={
                          <Button size="sm" variant="ghost" aria-label={`Modifier ${risk.id}`}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        }
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Supprimer ${risk.id}`}
                        onClick={() => setPendingDeletion(risk)}
                      >
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

      <AlertDialog open={pendingDeletion !== null} onOpenChange={(open) => !open && setPendingDeletion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce risque du registre ?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeletion && (
                <>
                  <strong>{pendingDeletion.id}</strong> — {pendingDeletion.name}
                  <br />
                  Cette action retire le risque du registre et recalcule les indices. Elle est irréversible.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletion} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
