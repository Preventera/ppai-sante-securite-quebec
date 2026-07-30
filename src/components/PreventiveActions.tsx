import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Target, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { Risk } from "@/types/risk";

interface PreventiveActionsProps {
  risks: Risk[];
}

type Priority = "high" | "medium" | "low";

interface PreventiveAction {
  id: string;
  action: string;
  targetedRisk: string;
  riskCode: string;
  predictedImpact: number;
  responsible: string;
  deadline: string;
  status: string;
  priority: Priority;
}

/**
 * Échéancier CNESST : plus l'indice est élevé, plus le délai de correction est
 * court. Les échéances sont calculées à partir d'aujourd'hui, jamais figées.
 */
const deadlineDaysFor = (priority: Priority) =>
  priority === "high" ? 30 : priority === "medium" ? 60 : 90;

const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

/**
 * Construit le plan d'action à partir du registre.
 *
 * Une action est proposée pour tout risque qui n'est pas déjà maîtrisé :
 * indice élevé, mesures absentes, réduction insuffisante ou statut non clos.
 * L'ordre reproduit la hiérarchie de prévention de l'article 51 de la LSST.
 */
function deriveActions(risks: Risk[]): PreventiveAction[] {
  const candidates = risks.filter(risk => {
    const closed = risk.status === "Complété";
    const lowEfficacy = risk.initialRisk > 0 && risk.residualRisk / risk.initialRisk > 0.8;
    return !closed && (risk.initialRisk >= 10 || risk.measures.trim() === "" || lowEfficacy);
  });

  return candidates
    .sort((a, b) => b.initialRisk - a.initialRisk)
    .map((risk, index) => {
      const priority: Priority =
        risk.initialRisk >= 15 ? "high" : risk.initialRisk >= 10 ? "medium" : "low";

      const reduction =
        risk.initialRisk > 0
          ? Math.round(((risk.initialRisk - risk.residualRisk) / risk.initialRisk) * 100)
          : 0;

      const action = risk.measures.trim().length > 0
        ? `Mettre en œuvre et vérifier : ${risk.measures}`
        : `Définir les mesures de prévention (aucune mesure documentée)`;

      const status =
        risk.status === "Action requise"
          ? "Urgent"
          : risk.status === "Contrôles actifs"
            ? "En cours"
            : risk.status === "En surveillance"
              ? "Planifié"
              : "En attente";

      return {
        id: `PA-${String(index + 1).padStart(3, "0")}`,
        action,
        targetedRisk: risk.name,
        riskCode: risk.id,
        predictedImpact: Math.max(reduction, 0),
        responsible: risk.responsible || "À désigner",
        deadline: addDays(deadlineDaysFor(priority)),
        status,
        priority
      };
    });
}

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

const getPriorityColor = (priority: Priority) => {
  switch (priority) {
    case "high":
      return "bg-red-500 text-white";
    case "medium":
      return "bg-orange-500 text-white";
    case "low":
      return "bg-blue-500 text-white";
  }
};

const getPriorityIcon = (priority: Priority) => {
  switch (priority) {
    case "high":
      return <AlertTriangle className="w-3 h-3" />;
    case "medium":
      return <Clock className="w-3 h-3" />;
    case "low":
      return <CheckCircle className="w-3 h-3" />;
  }
};

const getDeadlineStatus = (deadline: string) => {
  const today = new Date();
  const deadlineDate = new Date(deadline);
  const diffInDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays < 0) {
    return { color: "text-red-600", text: `En retard de ${Math.abs(diffInDays)} j` };
  }
  if (diffInDays <= 3) return { color: "text-red-600", text: `${diffInDays} j restants` };
  if (diffInDays <= 7) return { color: "text-orange-600", text: `${diffInDays} j restants` };
  return { color: "text-green-600", text: `${diffInDays} j restants` };
};

export function PreventiveActions({ risks }: PreventiveActionsProps) {
  const preventiveActions = useMemo(() => deriveActions(risks), [risks]);

  const averageImpact = useMemo(() => {
    if (preventiveActions.length === 0) return 0;
    const total = preventiveActions.reduce((sum, action) => sum + action.predictedImpact, 0);
    return Math.round(total / preventiveActions.length);
  }, [preventiveActions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="w-5 h-5 text-sst-blue" />
          Actions préventives prioritaires
        </CardTitle>
        <p className="text-sm text-gray-600">
          Plan d'action dérivé du registre, ordonné par indice de risque (LSST art. 51)
        </p>
      </CardHeader>
      <CardContent>
        {preventiveActions.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-600" />
            <p className="font-medium">Aucune action prioritaire requise</p>
            <p className="text-sm text-gray-600 mt-1">
              Tous les risques du registre sont documentés et maîtrisés.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Action préventive</TableHead>
                    <TableHead>Risque ciblé</TableHead>
                    <TableHead className="text-center">Réduction visée</TableHead>
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
                        <TableCell className="max-w-[260px]">
                          <div className="text-sm" title={action.action}>
                            {action.action}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate" title={action.targetedRisk}>
                          <span className="text-xs text-gray-500 mr-1">{action.riskCode}</span>
                          {action.targetedRisk}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={
                              action.predictedImpact >= 50
                                ? "bg-green-600 text-white"
                                : "bg-amber-500 text-white"
                            }
                          >
                            {action.predictedImpact} %
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[130px] truncate" title={action.responsible}>
                          {action.responsible === "À désigner" ? (
                            <span className="text-red-600">À désigner</span>
                          ) : (
                            action.responsible
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="text-sm font-medium">{action.deadline}</div>
                          <div className={`text-xs ${deadlineInfo.color}`}>{deadlineInfo.text}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(action.status)}>{action.status}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={`${getPriorityColor(action.priority)} flex items-center gap-1 w-fit mx-auto`}
                          >
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

            <div className="flex justify-between items-center mt-4 pt-4 border-t text-sm text-gray-600">
              <span>
                {preventiveActions.length} action(s) identifiée(s) · réduction moyenne visée{" "}
                {averageImpact} %
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
