
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, Filter, BookOpen } from "lucide-react";

interface Responsibility {
  id: number;
  activity: string;
  actionMode: string;
  responsibilityType: string;
  responsibleParty: string;
  legalRef?: string;
  section?: string;
  regulation?: string;
  reference?: string;
}

const responsibilities: Responsibility[] = [
  {
    id: 1,
    activity: "Porter ses équipements de protection individuels (EPI)",
    actionMode: "Appliquer une obligation légale",
    responsibilityType: "Légales",
    responsibleParty: "Travailleur",
    reference: "LSST Article 49"
  },
  {
    id: 2,
    activity: "Corriger les situations dangereuses sur lesquelles il peut lui-même agir",
    actionMode: "Appliquer une obligation légale", 
    responsibilityType: "Légales",
    responsibleParty: "Travailleur",
    reference: "LSST Article 49"
  },
  {
    id: 3,
    activity: "Rapporter les situations dangereuses pour lesquelles il ne peut appliquer les mesures de prévention",
    actionMode: "Appliquer une obligation légale",
    responsibilityType: "Légales",
    responsibleParty: "Travailleur",
    reference: "LSST Article 49"
  },
  {
    id: 4,
    activity: "Participer aux enquêtes et analyses d'accidents et aux analyses sécuritaires de tâches",
    actionMode: "Appliquer une obligation légale",
    responsibilityType: "Légales",
    responsibleParty: "Travailleur",
    reference: "LSST Article 49"
  },
  {
    id: 5,
    activity: "Appliquer les apprentissages acquis lors des formations en SST",
    actionMode: "Appliquer une obligation légale",
    responsibilityType: "Légales",
    responsibleParty: "Travailleur"
  },
  {
    id: 11,
    activity: "Remettre à l'attributaire du contrat une copie du programme de prévention du maître d'œuvre",
    actionMode: "Appliquer une obligation légale",
    responsibilityType: "Légales",
    responsibleParty: "Agent de prévention",
    reference: "CSTC Article 2.3.2"
  },
  {
    id: 13,
    activity: "Contrôler l'accès au chantier et la sécurité du public",
    actionMode: "Appliquer une obligation légale",
    responsibilityType: "Légales",
    responsibleParty: "Surintendant",
    reference: "CSTC"
  },
  {
    id: 14,
    activity: "Accueillir et informer tous les nouveaux travailleurs quant à l'organisation et aux particularités du chantier",
    actionMode: "Appliquer une obligation légale",
    responsibilityType: "Légales",
    responsibleParty: "Agent de prévention",
    reference: "CSTC Article 2.3.4"
  },
  {
    id: 15,
    activity: "S'assurer que les entrepreneurs présentent un programme de prévention spécifique 10 jours avant la mobilisation",
    actionMode: "Vérifier",
    responsibilityType: "Fonctionnelles",
    responsibleParty: "Représentant du MO- Achats et contrats"
  },
  {
    id: 16,
    activity: "Contrôler l'application journalière des règlements et lois en vigueur sur le chantier",
    actionMode: "Appliquer une obligation légale",
    responsibilityType: "Légales",
    responsibleParty: "Agent de prévention"
  },
  {
    id: 19,
    activity: "Faire corriger les non-conformités constatées dans les délais prescrits",
    actionMode: "Appliquer une obligation légale",
    responsibilityType: "Légales",
    responsibleParty: "Directeur de construction"
  },
  {
    id: 20,
    activity: "Ordonner l'arrêt des travaux et interdire l'accès lorsqu'il y a danger",
    actionMode: "Interdire",
    responsibilityType: "Légales",
    responsibleParty: "Surintendant"
  },
  {
    id: 21,
    activity: "Coordonner les travaux superposés pour éliminer les situations dangereuses",
    actionMode: "Appliquer un mode opératoire sécuritaire",
    responsibilityType: "Opérationnelles",
    responsibleParty: "Surintendant"
  },
  {
    id: 22,
    activity: "Enquêter pour tout événement causant un dommage matériel de plus de 150 000$",
    actionMode: "Appliquer une obligation légale",
    responsibilityType: "Légales",
    responsibleParty: "Agent de prévention"
  },
  {
    id: 23,
    activity: "Enquêter sur tout événement qui a causé ou aurait pu causer un accident de travail",
    actionMode: "Appliquer une obligation légale",
    responsibilityType: "Légales",
    responsibleParty: "Agent de prévention",
    reference: "LSST Article 62"
  },
  {
    id: 26,
    activity: "Réviser la politique SSE",
    actionMode: "Révision de politique",
    responsibilityType: "Performance SST (KPI)",
    responsibleParty: "Direction de l'entreprise"
  },
  {
    id: 28,
    activity: "Effectuer une marche de sécurité (Leadership Walk Around)",
    actionMode: "Exercer un leadership",
    responsibilityType: "Performance SST (KPI)",
    responsibleParty: "Direction de l'entreprise"
  },
  {
    id: 32,
    activity: "Se référer aux enjeux stratégiques de l'organisation",
    actionMode: "S'aligner avec le corporatif",
    responsibilityType: "Stratégiques",
    responsibleParty: "Directeur SST"
  },
  {
    id: 47,
    activity: "S'engager par écrit à respecter le programme de prévention du maître d'œuvre",
    actionMode: "Appliquer une obligation légale",
    responsibilityType: "Légales",
    responsibleParty: "Fournisseur/Sous-traitant"
  },
  {
    id: 49,
    activity: "Présenter 10 jours avant mobilisation un programme de prévention spécifique",
    actionMode: "Remettre le programme de prévention",
    responsibilityType: "Légales",
    responsibleParty: "Entrepreneur"
  },
  {
    id: 53,
    activity: "Fournir preuve que tous les travailleurs possèdent attestation cours SST général",
    actionMode: "Contrôler",
    responsibilityType: "Légales",
    responsibleParty: "Entrepreneur",
    reference: "CSTC Article 2.4.2.i"
  },
  {
    id: 55,
    activity: "Informer ses travailleurs de leurs droits en vertu de la LSST",
    actionMode: "Informer",
    responsibilityType: "Légales",
    responsibleParty: "Entrepreneur"
  },
  {
    id: 59,
    activity: "Fournir aux travailleurs tous les moyens et équipements de protection individuelle",
    actionMode: "Faire respecter une obligation",
    responsibilityType: "Légales",
    responsibleParty: "Entrepreneur"
  },
  {
    id: 61,
    activity: "Fournir attestation de conformité pour pompes à béton signée par ingénieur",
    actionMode: "Remettre un document (sceau d'ingénieur)",
    responsibilityType: "Légales",
    responsibleParty: "Entrepreneur"
  }
];

const getResponsibilityTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case "légales":
      return "bg-red-100 text-red-800 border-red-200";
    case "fonctionnelles":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "stratégiques":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "opérationnelles":
      return "bg-green-100 text-green-800 border-green-200";
    case "performance sst (kpi)":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export function RolesResponsibilities() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedParty, setSelectedParty] = useState("all");

  const filteredResponsibilities = responsibilities.filter(resp => {
    const matchesSearch = resp.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resp.responsibleParty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || resp.responsibilityType.toLowerCase() === selectedType.toLowerCase();
    const matchesParty = selectedParty === "all" || resp.responsibleParty.toLowerCase() === selectedParty.toLowerCase();
    
    return matchesSearch && matchesType && matchesParty;
  });

  const responsibilityTypes = [...new Set(responsibilities.map(r => r.responsibilityType))];
  const responsibleParties = [...new Set(responsibilities.map(r => r.responsibleParty))];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Users className="w-6 h-6 text-sst-blue" />
            Rôles et Responsabilités SST
          </CardTitle>
          <p className="text-gray-600">
            Matrice des responsabilités selon la LSST et le Code de sécurité pour les travaux de construction
          </p>
        </CardHeader>
      </Card>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher une activité ou un responsable..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">Tous les types</option>
                {responsibilityTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <select 
                value={selectedParty}
                onChange={(e) => setSelectedParty(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">Tous les responsables</option>
                {responsibleParties.map(party => (
                  <option key={party} value={party}>{party}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-sst-blue">{responsibilities.length}</div>
            <div className="text-sm text-gray-600">Total responsabilités</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {responsibilities.filter(r => r.responsibilityType === "Légales").length}
            </div>
            <div className="text-sm text-gray-600">Obligations légales</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {responsibleParties.length}
            </div>
            <div className="text-sm text-gray-600">Rôles identifiés</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {filteredResponsibilities.length}
            </div>
            <div className="text-sm text-gray-600">Résultats filtrés</div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau des responsabilités */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Matrice détaillée des responsabilités
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">ID</TableHead>
                  <TableHead>Activité clé / Pratique</TableHead>
                  <TableHead>Mode d'action</TableHead>
                  <TableHead>Type de responsabilités</TableHead>
                  <TableHead>Porteur de la responsabilité</TableHead>
                  <TableHead>Référence légale</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResponsibilities.map((resp) => (
                  <TableRow key={resp.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{resp.id}</TableCell>
                    <TableCell className="max-w-[300px]">
                      <div className="font-medium text-gray-900">{resp.activity}</div>
                    </TableCell>
                    <TableCell className="max-w-[150px] text-sm">
                      {resp.actionMode}
                    </TableCell>
                    <TableCell>
                      <Badge className={getResponsibilityTypeColor(resp.responsibilityType)}>
                        {resp.responsibilityType}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[150px] font-medium">
                      {resp.responsibleParty}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {resp.reference || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredResponsibilities.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucune responsabilité trouvée avec les filtres appliqués
            </div>
          )}

          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <div className="text-sm text-gray-600">
              {filteredResponsibilities.length} responsabilité(s) affichée(s) sur {responsibilities.length}
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Exporter la matrice
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
