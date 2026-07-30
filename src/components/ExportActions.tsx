import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, FileText, Table2 } from "lucide-react";

interface ExportActionsProps {
  data: any[];
  filename: string;
  type: "risks" | "analytics" | "responsibilities";
}

/** Échappe une valeur pour le CSV (RFC 4180) : guillemets doublés, champ cité. */
const csvCell = (value: unknown): string => {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

const csvRow = (cells: unknown[]) => cells.map(csvCell).join(",");

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

export function ExportActions({ data, filename, type }: ExportActionsProps) {
  const handleExportCsv = () => {
    let rows: string[] = [];

    if (type === "risks") {
      rows.push(
        csvRow([
          "ID", "Description", "Phase", "Catégorie", "Probabilité", "Gravité",
          "Indice initial", "Mesures de prévention", "Indice résiduel", "Statut",
          "Responsable", "Secteur"
        ])
      );
      rows = rows.concat(
        data.map(item =>
          csvRow([
            item.id, item.name, item.phase, item.category, item.probability,
            item.gravity, item.initialRisk, item.measures, item.residualRisk,
            item.status, item.responsible, item.sector
          ])
        )
      );
    } else if (type === "responsibilities") {
      rows.push(csvRow(["ID", "Activité", "Mode d'action", "Type", "Responsable", "Référence"]));
      rows = rows.concat(
        data.map(item =>
          csvRow([
            item.id, item.activity, item.actionMode, item.responsibilityType,
            item.responsibleParty, item.reference ?? ""
          ])
        )
      );
    } else {
      const keys = data.length > 0 ? Object.keys(data[0]) : [];
      rows.push(csvRow(keys));
      rows = rows.concat(data.map(item => csvRow(keys.map(key => item[key]))));
    }

    // Le BOM UTF-8 permet à Excel d'afficher correctement les accents.
    downloadFile(`\uFEFF${rows.join("\r\n")}`, `${filename}.csv`, "text/csv;charset=utf-8;");
  };

  const handleExportMarkdown = () => {
    const generatedAt = new Date().toLocaleString("fr-CA");
    let content = `# Registre des risques SST\n\n_Export généré le ${generatedAt}_\n\n`;

    if (type === "risks") {
      content += `${data.length} risque(s) exporté(s).\n\n`;
      content += data
        .map(
          item =>
            `## ${item.id} — ${item.name}\n\n` +
            `- **Phase** : ${item.phase}\n` +
            `- **Catégorie** : ${item.category}\n` +
            `- **Probabilité × Gravité** : ${item.probability} × ${item.gravity} = **${item.initialRisk}**\n` +
            `- **Indice résiduel** : ${item.residualRisk}\n` +
            `- **Statut** : ${item.status}\n` +
            `- **Responsable** : ${item.responsible}\n` +
            `- **Mesures de prévention** : ${item.measures}\n`
        )
        .join("\n");
    } else {
      content += `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n`;
    }

    downloadFile(content, `${filename}.md`, "text/markdown;charset=utf-8;");
  };

  const handleExportJson = () => {
    downloadFile(JSON.stringify(data, null, 2), `${filename}.json`, "application/json");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exporter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-white border shadow-lg">
        <DropdownMenuItem onClick={handleExportCsv} className="cursor-pointer">
          <Table2 className="w-4 h-4 mr-2" />
          CSV (Excel)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportMarkdown} className="cursor-pointer">
          <FileText className="w-4 h-4 mr-2" />
          Document Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJson} className="cursor-pointer">
          <Download className="w-4 h-4 mr-2" />
          JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
