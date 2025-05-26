
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Target, Clock, AlertTriangle, CheckCircle } from "lucide-react";

interface PreventiveAction {
  id: string;
  action: string;
  targetedRisk: string;
  predictedImpact: number;
  responsible: string;
  deadline: string;
  status: string;
  priority: string;
}

const preventiveActions: PreventiveAction[] = [
  {
    id: "PA-001",
    action: "Installation garde-corps renforcés - Mezzanine niveau 2",
    targetedRisk: "Chute de hauteur lors travaux de couverture",
    predictedImpact: 85,
    responsible: "Chef d'équipe couvreurs",
    deadline: "2025-05-29",
    status: "En cours",
    priority: "high"
  },
  {
    id: "PA-002", 
    action: "Formation levage sécuritaire - Certification grutiers",
    targetedRisk: "Chute d'objets depuis grue mobile 30T",
    predictedImpact: 75,
    responsible: "Responsable formation",
    deadline: "2025-06-05",
    status: "Planifié",
    priority: "medium"
  },
  {
    id: "PA-003",
    action: "Mise en place captation poussière - Zone désamiantage",
    targetedRisk: "Exposition poussières d'amiante - sous-sol",
    predictedImpact: 90,
    responsible: "Entreprise spécialisée",
    deadline: "2025-05-31",
    status: "Urgent",
    priority: "high"
  },
  {
    id: "PA-004",
    action: "Révision procédures consignation électrique",
    targetedRisk: "Contact électrique direct - armoire TGBT",
    predictedImpact: 70,
    responsible: "Électricien chef d'équipe",
    deadline: "2025-06-12",
    status: "En cours",
    priority: "medium"
  },
  {
    id: "PA-005",
    action: "Installation détecteurs gaz - Zone stockage carburants",
    targetedRisk: "Risque d'explosion - stockage carburants",
    predictedImpact: 95,
    responsible: "Responsable HSE",
    deadline: "2025-06-08",
    status: "Planifié",
    priority: "high"
  },
  {
    id: "PA-006",
    action: "Renforcement blindage tranchée - Réseaux enterrés",
    targetedRisk: "Éboulement tranchée - réseaux enterrés",
    predictedImpact: 80,
    responsible: "Chef équipe terrassement",
    deadline: "2025-06-15",
    status: "En attente",
    priority: "low"
  }
];

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "urgent":
      return "bg-red-100 text-red-800 border-red-200";
    case "en cours":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "planifié":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "en attente":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "complété":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-red-500 text-white";
    case "medium":
      return "bg-orange-500 text-white";
    case "low":
      return "bg-blue-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
};

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case "high":
      return <AlertTriangle className="w-3 h-3" />;
    case "medium":
      return <Clock className="w-3 h-3" />;
    case "low":
      return <CheckCircle className="w-3 h-3" />;
    default:
      return <Target className="w-3 h-3" />;
  }
};

const getDeadlineStatus = (deadline: string) => {
  const today = new Date();
  const deadlineDate = new Date(deadline);
  const diffInDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays < 0) return { status: "overdue", color: "text-red-600", text: `En retard de ${Math.abs(diffInDays)}j` };
  if (diffInDays <= 3) return { status: "urgent", color: "text-red-600", text: `${diffInDays}j restant` };
  if (diffInDays <= 7) return { status: "warning", color: "text-orange-600", text: `${diffInDays}j restant` };
  return { status: "ok", color: "text-green-600", text: `${diffInDays}j restant` };
};

export function PreventiveActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="w-5 h-5 text-sst-blue" />
          Actions Préventives Prioritaires
        </CardTitle>
        <p className="text-sm text-gray-600">
          Recommandations IA basées sur l'analyse prédictive des risques
        </p>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Action préventive</TableHead>
                <TableHead>Risque ciblé</TableHead>
                <TableHead className="text-center">Impact prédit</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead className="text-center">Échéance</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-center">Priorité</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preventiveActions.map((action) => {
                const deadlineInfo = getDeadlineStatus(action.deadline);
                return (
                  <TableRow key={action.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{action.id}</TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="font-medium">{action.action}</div>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate" title={action.targetedRisk}>
                      {action.targetedRisk}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-green-500 text-white">
                        Réduction {action.predictedImpact}%
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[120px] truncate">
                      {action.responsible}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className={`text-sm font-medium ${deadlineInfo.color}`}>
                        {action.deadline}
                      </div>
                      <div className={`text-xs ${deadlineInfo.color}`}>
                        {deadlineInfo.text}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(action.status)}>
                        {action.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`${getPriorityColor(action.priority)} flex items-center gap-1 w-fit mx-auto`}>
                        {getPriorityIcon(action.priority)}
                        {action.priority.toUpperCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <div className="text-sm text-gray-600">
            {preventiveActions.length} actions identifiées • Impact moyen: 82% de réduction
          </div>
          <Button variant="outline" size="sm">
            Planifier nouvelle action
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
