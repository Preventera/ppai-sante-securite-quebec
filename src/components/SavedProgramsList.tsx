import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { FileText, Loader2, Trash2, Eye, Download, Bot, HardDrive, CheckCircle2, AlertTriangle } from "lucide-react";
import { programService, PreventionProgram } from "@/services/programService";
import { BackendModeBadge } from "@/components/BackendModeBadge";
import { toast } from "@/hooks/use-toast";

const PROGRAMS_QUERY_KEY = ["prevention-programs"] as const;

const downloadMarkdown = (program: PreventionProgram) => {
  const blob = new Blob([program.content], { type: "text/markdown;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${program.title.replace(/[^\w\-À-ÿ ]/g, "").trim() || "programme"}.md`;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

export function SavedProgramsList() {
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<PreventionProgram | null>(null);
  const [pendingDeletion, setPendingDeletion] = useState<PreventionProgram | null>(null);

  const { data: programs = [], isLoading } = useQuery({
    queryKey: PROGRAMS_QUERY_KEY,
    queryFn: () => programService.getAll()
  });

  const removeProgram = useMutation({
    mutationFn: (id: string) => programService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROGRAMS_QUERY_KEY });
      toast({ title: "Programme supprimé" });
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "Suppression impossible",
        description: error instanceof Error ? error.message : "Erreur inconnue"
      });
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center gap-2 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          Chargement des programmes…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-sst-blue" />
              Programmes enregistrés
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {programs.length} programme(s) généré(s) et conservé(s)
            </p>
          </div>
          <BackendModeBadge />
        </div>
      </CardHeader>
      <CardContent>
        {programs.length === 0 ? (
          <div className="text-center py-10 text-gray-600">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Aucun programme enregistré</p>
            <p className="text-sm mt-1">
              Générez un programme ci-dessus : il apparaîtra ici automatiquement.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {programs.map((program) => {
              const generatedByClaude = program.metadata?.source === "claude";
              const compliant = program.metadata?.conformite;

              return (
                <div
                  key={program.id}
                  className="border rounded-md p-4 flex items-start justify-between gap-4 flex-wrap hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{program.title}</div>
                    <div className="text-sm text-gray-600 mt-1">{program.description}</div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className="gap-1 font-normal">
                        {generatedByClaude ? (
                          <>
                            <Bot className="w-3 h-3" />
                            Claude
                          </>
                        ) : (
                          <>
                            <HardDrive className="w-3 h-3" />
                            Moteur local
                          </>
                        )}
                      </Badge>
                      {/* Icône + libellé : la conformité n'est jamais portée par la couleur seule. */}
                      <Badge
                        variant="outline"
                        className={`gap-1 font-normal ${
                          compliant
                            ? "border-green-300 bg-green-50 text-green-800"
                            : "border-amber-300 bg-amber-50 text-amber-900"
                        }`}
                      >
                        {compliant ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Éléments requis présents
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3" />
                            À compléter
                          </>
                        )}
                      </Badge>
                      {typeof program.metadata?.risksAnalyzed === "number" && (
                        <Badge variant="outline" className="font-normal">
                          {program.metadata.risksAnalyzed} risque(s) intégré(s)
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(program.createdAt).toLocaleString("fr-CA")}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => setPreview(program)}>
                      <Eye className="w-4 h-4 mr-1" />
                      Voir
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => downloadMarkdown(program)}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPendingDeletion(program)}
                      aria-label={`Supprimer ${program.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={preview !== null} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{preview?.title}</DialogTitle>
          </DialogHeader>
          <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
            {preview?.content}
          </pre>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingDeletion !== null}
        onOpenChange={(open) => !open && setPendingDeletion(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce programme ?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeletion?.title} — cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (pendingDeletion) removeProgram.mutate(pendingDeletion.id);
                setPendingDeletion(null);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
