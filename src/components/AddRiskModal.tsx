
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

interface NewRisk {
  name: string;
  phase: string;
  category: string;
  probability: number;
  gravity: number;
  measures: string;
  responsible: string;
  sector: string;
}

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

const categories = [
  "Chute (CSTC)",
  "Équipements de levage",
  "Électricité (CSTC)",
  "Incendies et explosions",
  "Creusement, excavation",
  "Autres risques professionnels"
];

const sectors = [
  "Construction",
  "Électricité",
  "Sécurité",
  "Santé"
];

export function AddRiskModal() {
  const [open, setOpen] = useState(false);
  const [newRisk, setNewRisk] = useState<NewRisk>({
    name: "",
    phase: "",
    category: "",
    probability: 1,
    gravity: 1,
    measures: "",
    responsible: "",
    sector: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ici on pourrait ajouter la logique pour sauvegarder le nouveau risque
    console.log("Nouveau risque:", {
      ...newRisk,
      id: `NEW-${Date.now()}`,
      initialRisk: newRisk.probability * newRisk.gravity,
      residualRisk: Math.max(1, Math.floor((newRisk.probability * newRisk.gravity) * 0.6)), // Simulation réduction 40%
      status: "Nouveau"
    });

    // Reset du formulaire
    setNewRisk({
      name: "",
      phase: "",
      category: "",
      probability: 1,
      gravity: 1,
      measures: "",
      responsible: "",
      sector: ""
    });
    
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau risque
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau risque</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Description du risque *</Label>
              <Textarea
                id="name"
                placeholder="Ex: Chute d'objets depuis grue mobile..."
                value={newRisk.name}
                onChange={(e) => setNewRisk(prev => ({ ...prev, name: e.target.value }))}
                required
                rows={3}
              />
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phase">Phase du projet *</Label>
                <Select value={newRisk.phase} onValueChange={(value) => setNewRisk(prev => ({ ...prev, phase: value }))}>
                  <SelectTrigger>
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
                <Select value={newRisk.category} onValueChange={(value) => setNewRisk(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
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
              <Select value={newRisk.probability.toString()} onValueChange={(value) => setNewRisk(prev => ({ ...prev, probability: parseInt(value) }))}>
                <SelectTrigger>
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
              <Select value={newRisk.gravity.toString()} onValueChange={(value) => setNewRisk(prev => ({ ...prev, gravity: parseInt(value) }))}>
                <SelectTrigger>
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
              <div className="p-2 bg-gray-100 rounded text-center font-bold text-lg">
                {newRisk.probability * newRisk.gravity}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="measures">Mesures de prévention *</Label>
            <Textarea
              id="measures"
              placeholder="Ex: Balisage zone de sécurité + formation opérateur..."
              value={newRisk.measures}
              onChange={(e) => setNewRisk(prev => ({ ...prev, measures: e.target.value }))}
              required
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="responsible">Responsable *</Label>
              <Input
                id="responsible"
                placeholder="Ex: Chef de chantier"
                value={newRisk.responsible}
                onChange={(e) => setNewRisk(prev => ({ ...prev, responsible: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sector">Secteur *</Label>
              <Select value={newRisk.sector} onValueChange={(value) => setNewRisk(prev => ({ ...prev, sector: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un secteur" />
                </SelectTrigger>
                <SelectContent>
                  {sectors.map(sector => (
                    <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">
              Ajouter le risque
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
