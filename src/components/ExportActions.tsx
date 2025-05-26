
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, FileText, Table2 } from "lucide-react";

interface ExportActionsProps {
  data: any[];
  filename: string;
  type: "risks" | "analytics" | "responsibilities";
}

export function ExportActions({ data, filename, type }: ExportActionsProps) {
  
  const handleExportPDF = () => {
    // Simulation d'export PDF
    console.log(`Export PDF: ${filename}`, data);
    
    // Ici on pourrait utiliser jsPDF ou react-pdf
    const content = data.map(item => {
      if (type === "risks") {
        return `${item.id} - ${item.name} (Risque: ${item.initialRisk})`;
      } else if (type === "responsibilities") {
        return `${item.id} - ${item.activity} (${item.responsibleParty})`;
      }
      return JSON.stringify(item);
    }).join('\n');
    
    // Création d'un blob simulé
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    // Simulation d'export Excel
    console.log(`Export Excel: ${filename}`, data);
    
    // Conversion en CSV pour simulation
    let csvContent = "";
    
    if (type === "risks") {
      csvContent = "ID,Nom,Phase,Catégorie,Probabilité,Gravité,Risque Initial,Mesures,Risque Résiduel,Statut,Responsable\n";
      csvContent += data.map(item => 
        `${item.id},"${item.name}","${item.phase}","${item.category}",${item.probability},${item.gravity},${item.initialRisk},"${item.measures}",${item.residualRisk},"${item.status}","${item.responsible}"`
      ).join('\n');
    } else if (type === "responsibilities") {
      csvContent = "ID,Activité,Mode d'action,Type,Responsable,Référence\n";
      csvContent += data.map(item => 
        `${item.id},"${item.activity}","${item.actionMode}","${item.responsibilityType}","${item.responsibleParty}","${item.reference || ''}"`
      ).join('\n');
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exporter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-white border shadow-lg">
        <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer">
          <FileText className="w-4 h-4 mr-2" />
          Exporter en PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportExcel} className="cursor-pointer">
          <Table2 className="w-4 h-4 mr-2" />
          Exporter en Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJSON} className="cursor-pointer">
          <Download className="w-4 h-4 mr-2" />
          Exporter en JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
