import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Loader2, AlertTriangle } from "lucide-react";
import { Risk, RiskSector, RiskStatus } from "@/types/risk";
import { RiskInput } from "@/services/riskService";
import { MesuresProposees } from "@/components/MesuresProposees";
import { CATEGORIES_SAISIE } from "@/lib/prevention";
import { validateRisk } from "@/utils/riskCalculations";

const phases = [
  "Démolition",
  "Terrassement",
  "Fondations",
  "Structure",
  "Gros œuvre",
  "Installation",
  "Finitions",
  "Désamiantage",
  "Montage structure",
  "Réfection toiture"
];

// Les catégories de prévention d'abord : ce sont elles qui ouvrent l'accès aux
// moyens de prévention du RMPPÉ. Les libellés hérités suivent, pour qu'un
// risque ancien ne perde pas sa catégorie à la modification.
const categories = CATEGORIES_SAISIE;

const sectors: RiskSector[] = ["Construction", "Électricité", "Sécurité", "Santé"];

const statuses: RiskStatus[] = [
  "Contrôles actifs",
  "En surveillance",
  "Action requise",
  "En contrôle",
  "Complété"
];

type FormState = {
  name: string;
  phase: string;
  category: string;
  probability: number;
  gravity: number;
  measures: string;
  responsible: string;
  sector: RiskSector | "";
  status: RiskStatus;
};

const emptyForm: FormState = {
  name: "",
  phase: "",
  category: "",
  probability: 1,
  gravity: 1,
  measures: "",
  responsible: "",
  sector: "",
  status: "En surveillance"
};

const fromRisk = (risk: Risk): FormState => ({
  name: risk.name,
  phase: risk.phase,
  category: risk.category,
  probability: risk.probability,
  gravity: risk.gravity,
  measures: risk.measures,
  responsible: risk.responsible,
  sector: risk.sector,
  status: risk.status
});

interface AddRiskModalProps {
  /** Enregistre le risque. Doit rejeter en cas d'échec pour garder le modal ouvert. */
  onSave: (input: RiskInput) => Promise<unknown>;
  /** Fourni en mode édition ; absent en création. */
  risk?: Risk;
  /** Déclencheur personnalisé (bouton d'édition d'une ligne, par exemple). */
  trigger?: React.ReactNode;
  /**
   * Pré-remplissage en mode création — la qualification d'un signalement
   * apporte déjà une description, autant ne pas la faire ressaisir.
   */
  valeursInitiales?: Partial<Pick<FormState, "name" | "measures" | "phase" | "category">>;
}

export function AddRiskModal({ onSave, risk, trigger, valeursInitiales }: AddRiskModalProps) {
  const isEdit = Boolean(risk);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(
    risk ? fromRisk(risk) : { ...emptyForm, ...valeursInitiales }
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Réaligne le formulaire sur le risque courant à chaque ouverture.
  useEffect(() => {
    if (open) {
      setForm(risk ? fromRisk(risk) : { ...emptyForm, ...valeursInitiales });
      setErrors([]);
    }
  }, [open, risk]);

  const initialRisk = form.probability * form.gravity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const candidate = {
      name: form.name,
      probability: form.probability,
      gravity: form.gravity,
      sector: form.sector || undefined,
      responsible: form.responsible
    };

    const validationErrors = validateRisk(candidate as Partial<Risk>);
    if (!form.phase) validationErrors.push("La phase du projet est requise");
    if (!form.category) validationErrors.push("La catégorie de risque est requise");
    if (!form.measures.trim()) validationErrors.push("Les mesures de prévention sont requises");

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setSaving(true);

    try {
      await onSave({
        name: form.name,
        phase: form.phase,
        category: form.category,
        probability: form.probability,
        gravity: form.gravity,
        measures: form.measures,
        responsible: form.responsible,
        sector: form.sector as RiskSector,
        status: form.status
      });
      setOpen(false);
    } catch {
      // L'erreur est signalée par la couche mutation (toast) ; on garde le modal
      // ouvert pour que la saisie ne soit pas perdue.
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau risque
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Modifier le risque ${risk?.id}` : "Ajouter un nouveau risque"}</DialogTitle>
          <DialogDescription>
            L'indice de risque est calculé automatiquement (probabilité × gravité) sur la matrice 5×5.
          </DialogDescription>
        </DialogHeader>

        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              <ul className="list-disc pl-4">
                {errors.map(error => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Description du risque *</Label>
              <Textarea
                id="name"
                placeholder="Ex: Chute d'objets depuis grue mobile..."
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phase">Phase du projet *</Label>
                <Select value={form.phase} onValueChange={(value) => setForm(prev => ({ ...prev, phase: value }))}>
                  <SelectTrigger id="phase">
                    <SelectValue placeholder="Sélectionner une phase" />
                  </SelectTrigger>
                  <SelectContent>
                    {phases.map(phase => (
                      <SelectItem key={phase} value={phase}>{phase}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Catégorie de risque *</Label>
                <Select value={form.category} onValueChange={(value) => setForm(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="probability">Probabilité (1-5) *</Label>
              <Select
                value={form.probability.toString()}
                onValueChange={(value) => setForm(prev => ({ ...prev, probability: parseInt(value, 10) }))}
              >
                <SelectTrigger id="probability">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Très rare</SelectItem>
                  <SelectItem value="2">2 - Rare</SelectItem>
                  <SelectItem value="3">3 - Occasionnel</SelectItem>
                  <SelectItem value="4">4 - Probable</SelectItem>
                  <SelectItem value="5">5 - Fréquent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gravity">Gravité (1-5) *</Label>
              <Select
                value={form.gravity.toString()}
                onValueChange={(value) => setForm(prev => ({ ...prev, gravity: parseInt(value, 10) }))}
              >
                <SelectTrigger id="gravity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Négligeable</SelectItem>
                  <SelectItem value="2">2 - Marginale</SelectItem>
                  <SelectItem value="3">3 - Modérée</SelectItem>
                  <SelectItem value="4">4 - Critique</SelectItem>
                  <SelectItem value="5">5 - Catastrophique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Indice de risque</Label>
              <div
                className={`p-2 rounded text-center font-bold text-lg ${
                  initialRisk >= 15
                    ? "bg-red-100 text-red-800"
                    : initialRisk >= 10
                      ? "bg-orange-100 text-orange-800"
                      : "bg-gray-100 text-gray-800"
                }`}
              >
                {initialRisk}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="measures">Mesures de prévention *</Label>
            <Textarea
              id="measures"
              placeholder="Décrivez les mesures, ou reprenez celles proposées ci-dessous."
              value={form.measures}
              onChange={(e) => setForm(prev => ({ ...prev, measures: e.target.value }))}
              rows={4}
            />
          </div>

          {/* Les moyens de prévention de la catégorie retenue, dans l'ordre de
              priorité du RMPPÉ art. 6. Le champ reste libre : la proposition
              alimente la rédaction, elle ne la remplace pas. */}
          <div className="rounded-lg border p-3 bg-gray-50">
            <MesuresProposees
              nom={form.name}
              categorie={form.category}
              onAjouter={(texte) =>
                setForm(prev => ({
                  ...prev,
                  measures: prev.measures.trim() ? `${prev.measures.trim()}\n${texte}` : texte
                }))
              }
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="responsible">Responsable *</Label>
              <Input
                id="responsible"
                placeholder="Ex: Chef de chantier"
                value={form.responsible}
                onChange={(e) => setForm(prev => ({ ...prev, responsible: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sector">Secteur *</Label>
              <Select
                value={form.sector}
                onValueChange={(value) => setForm(prev => ({ ...prev, sector: value as RiskSector }))}
              >
                <SelectTrigger id="sector">
                  <SelectValue placeholder="Sélectionner un secteur" />
                </SelectTrigger>
                <SelectContent>
                  {sectors.map(sector => (
                    <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut *</Label>
              <Select
                value={form.status}
                onValueChange={(value) => setForm(prev => ({ ...prev, status: value as RiskStatus }))}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? "Enregistrer les modifications" : "Ajouter le risque"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
