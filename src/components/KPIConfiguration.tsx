
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Building, Users, Shield, CheckCircle } from "lucide-react";

interface ConfigurationData {
  secteur: string;
  tailleEtablissement: string;
  groupePrioritaire: number;
  activitesPrincipales: string[];
}

interface KPIConfigurationProps {
  onConfigurationComplete: (config: ConfigurationData) => void;
}

const secteurs = [
  { value: "construction", label: "Construction" },
  { value: "industrie", label: "Industrie manufacturière" },
  { value: "services", label: "Services" },
  { value: "transport", label: "Transport et entreposage" },
  { value: "mines", label: "Mines et carrières" },
  { value: "foresterie", label: "Foresterie" },
];

const tailles = [
  { value: "1-19", label: "1-19 employés" },
  { value: "20-99", label: "20-99 employés" },
  { value: "100-499", label: "100-499 employés" },
  { value: "500+", label: "500+ employés" },
];

const activites = [
  "Travaux en hauteur",
  "Manutention manuelle",
  "Travail avec équipements de levage",
  "Manipulation produits chimiques",
  "Travail en espace clos",
  "Soudage et coupage",
  "Excavation et terrassement",
  "Démolition",
  "Électricité",
  "Travail à chaud",
];

export function KPIConfiguration({ onConfigurationComplete }: KPIConfigurationProps) {
  const [secteur, setSecteur] = useState("");
  const [taille, setTaille] = useState("");
  const [groupe, setGroupe] = useState<number>(1);
  const [selectedActivites, setSelectedActivites] = useState<string[]>([]);

  const handleActiviteChange = (activite: string, checked: boolean) => {
    if (checked) {
      setSelectedActivites([...selectedActivites, activite]);
    } else {
      setSelectedActivites(selectedActivites.filter(a => a !== activite));
    }
  };

  const handleSubmit = () => {
    console.log("Attempting to submit configuration:", {
      secteur,
      taille,
      selectedActivites,
      isValid: secteur && taille && selectedActivites.length > 0
    });

    if (secteur && taille && selectedActivites.length > 0) {
      const config = {
        secteur,
        tailleEtablissement: taille,
        groupePrioritaire: groupe,
        activitesPrincipales: selectedActivites,
      };
      
      console.log("Configuration valid, calling onConfigurationComplete with:", config);
      onConfigurationComplete(config);
    } else {
      console.log("Configuration incomplete:", {
        secteur: secteur || "missing",
        taille: taille || "missing", 
        activitesCount: selectedActivites.length
      });
    }
  };

  const isValid = secteur && taille && selectedActivites.length > 0;

  return (
    <div className="space-y-6">
      {/* Step 1: Secteur et Taille */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5 text-sst-blue" />
            Informations de l'établissement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="secteur">Secteur d'activité (SCIAN)</Label>
              <Select value={secteur} onValueChange={setSecteur}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un secteur" />
                </SelectTrigger>
                <SelectContent>
                  {secteurs.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="taille">Taille de l'établissement</Label>
              <Select value={taille} onValueChange={setTaille}>
                <SelectTrigger>
                  <SelectValue placeholder="Nombre d'employés" />
                </SelectTrigger>
                <SelectContent>
                  {tailles.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Groupe Prioritaire */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-sst-blue" />
            Groupe prioritaire CNESST
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((g) => (
              <div
                key={g}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  groupe === g
                    ? "border-sst-blue bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setGroupe(g)}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-sst-blue">Groupe {g}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {g === 1 && "Risque élevé"}
                    {g === 2 && "Risque moyen"}
                    {g === 3 && "Risque faible"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Activités Principales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-sst-blue" />
            Activités principales
          </CardTitle>
          <p className="text-sm text-gray-600">
            Sélectionnez les activités principales de votre établissement
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {activites.map((activite) => (
              <div key={activite} className="flex items-center space-x-2">
                <Checkbox
                  id={activite}
                  checked={selectedActivites.includes(activite)}
                  onCheckedChange={(checked) => 
                    handleActiviteChange(activite, checked as boolean)
                  }
                />
                <Label htmlFor={activite} className="text-sm">
                  {activite}
                </Label>
              </div>
            ))}
          </div>
          
          {selectedActivites.length > 0 && (
            <div className="mt-4">
              <Label className="text-sm font-medium">Activités sélectionnées:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedActivites.map((activite) => (
                  <Badge key={activite} variant="secondary">
                    {activite}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit}
          disabled={!isValid}
          className="flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Générer les KPI et Mapping
        </Button>
      </div>

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
          Debug: secteur={secteur}, taille={taille}, activités={selectedActivites.length}, valid={isValid.toString()}
        </div>
      )}
    </div>
  );
}
