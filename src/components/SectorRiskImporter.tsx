
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Zap, Shield, AlertTriangle, Upload, Download, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SectorRisk {
  id: string;
  sector: string;
  criticalDanger: string;
  description: string;
  probability: number;
  gravity: number;
  initialRisk: number;
  controlMeasures: string;
  controlEffectiveness: number;
  residualRisk: number;
  status: string;
  responsible: string;
  legalRef: string;
}

const energySectorRisks: SectorRisk[] = [
  {
    id: "EN-RC2-001",
    sector: "Production énergétique",
    criticalDanger: "RC2 - Électricité",
    description: "Contact avec équipements sous tension lors de maintenance",
    probability: 3,
    gravity: 5,
    initialRisk: 15,
    controlMeasures: "Cadenassage; Mise à la terre; Permis de travail électrique; Formation spécialisée",
    controlEffectiveness: 85,
    residualRisk: 2.25,
    status: "Contrôlé",
    responsible: "Chef d'équipe maintenance",
    legalRef: "LSST art. 51; Code électrique du Québec; RSST"
  },
  {
    id: "EN-RC2-002", 
    sector: "Distribution électrique",
    criticalDanger: "RC2 - Électricité",
    description: "Électrocution lors d'intervention sur réseau après intempéries",
    probability: 4,
    gravity: 5,
    initialRisk: 20,
    controlMeasures: "Vérification d'absence de tension; EPI isolants; Communication en binôme",
    controlEffectiveness: 80,
    residualRisk: 4.0,
    status: "En surveillance",
    responsible: "Superviseur terrain",
    legalRef: "LSST art. 51; Code électrique du Québec; RSST"
  },
  {
    id: "EN-RC4-001",
    sector: "Construction électrique",
    criticalDanger: "RC4 - Équipements de levage",
    description: "Chute de charge lors du levage d'équipements lourds",
    probability: 3,
    gravity: 5,
    initialRisk: 15,
    controlMeasures: "Plan de levage certifié; Inspection équipements; Zone d'exclusion; Élingues surdimensionnées",
    controlEffectiveness: 85,
    residualRisk: 2.25,
    status: "Contrôlé",
    responsible: "Responsable de chantier",
    legalRef: "LSST art. 51; RSST"
  },
  {
    id: "EN-RC8-001",
    sector: "Infrastructure énergétique",
    criticalDanger: "RC8 - Chute et effondrement",
    description: "Effondrement de structure temporaire en centrale",
    probability: 2,
    gravity: 5,
    initialRisk: 10,
    controlMeasures: "Validation ingénierie; Inspection quotidienne; Système d'alerte; Limitation d'accès",
    controlEffectiveness: 80,
    residualRisk: 2.0,
    status: "Contrôlé",
    responsible: "Ingénieur structure",
    legalRef: "LSST art. 51; CSTC"
  },
  {
    id: "EN-RC3-001",
    sector: "Exploitation réseau",
    criticalDanger: "RC3 - Incendies et explosions",
    description: "Incendie lors de surcharge réseau en période de pointe",
    probability: 2,
    gravity: 5,
    initialRisk: 10,
    controlMeasures: "Détection précoce; Procédure d'urgence; Formation lutte incendie; Protection surdimensionnée",
    controlEffectiveness: 85,
    residualRisk: 1.5,
    status: "Contrôlé",
    responsible: "Chef d'exploitation",
    legalRef: "CNPI; RSST"
  },
  {
    id: "EN-RC5-001",
    sector: "Travaux en hauteur",
    criticalDanger: "RC5 - Chute de hauteur",
    description: "Chute de hauteur lors de travaux sur infrastructures élevées",
    probability: 3,
    gravity: 5,
    initialRisk: 15,
    controlMeasures: "Système antichute certifié; Points d'ancrage validés; Formation; Permis de travail",
    controlEffectiveness: 80,
    residualRisk: 3.0,
    status: "En surveillance",
    responsible: "Coordonnateur SST",
    legalRef: "LSST art. 51; CSTC"
  },
  {
    id: "EN-RC9-001",
    sector: "Maintenance industrielle",
    criticalDanger: "RC9 - Autres risques professionnels",
    description: "Exposition à substances dangereuses lors d'intervention sur équipements",
    probability: 3,
    gravity: 3,
    initialRisk: 9,
    controlMeasures: "Procédure sécuritaire; EPI chimique; Bacs de rétention; Trousse déversement",
    controlEffectiveness: 75,
    residualRisk: 2.25,
    status: "Contrôlé",
    responsible: "Technicien environnement",
    legalRef: "SIMDUT 2015; RSST"
  },
  {
    id: "EN-RC10-001",
    sector: "Espaces confinés",
    criticalDanger: "RC10 - Espace clos",
    description: "Asphyxie lors d'intervention en espace clos technique",
    probability: 2,
    gravity: 5,
    initialRisk: 10,
    controlMeasures: "Détection 4 gaz; Ventilation forcée; Surveillant formé; Procédure de sauvetage",
    controlEffectiveness: 90,
    residualRisk: 1.0,
    status: "Contrôlé",
    responsible: "Coordonnateur travaux spéciaux",
    legalRef: "RSST; CSTC"
  },
  {
    id: "EN-RC6-001",
    sector: "Travail extérieur",
    criticalDanger: "RC6 - Conditions météorologiques",
    description: "Exposition à des conditions météorologiques extrêmes",
    probability: 4,
    gravity: 3,
    initialRisk: 12,
    controlMeasures: "Rotation équipes; Abris climatisés; Équipements adaptés; Procédure d'arrêt",
    controlEffectiveness: 70,
    residualRisk: 3.6,
    status: "En surveillance",
    responsible: "Superviseur terrain",
    legalRef: "LSST art. 51; RSST"
  },
  {
    id: "EN-RC7-001",
    sector: "Centre de contrôle",
    criticalDanger: "RC7 - Ergonomie",
    description: "Troubles musculo-squelettiques opérateurs centres de contrôle",
    probability: 3,
    gravity: 3,
    initialRisk: 9,
    controlMeasures: "Postes ergonomiques; Pauses programmées; Formation; Rotation des tâches",
    controlEffectiveness: 65,
    residualRisk: 3.15,
    status: "En surveillance",
    responsible: "Responsable santé",
    legalRef: "LSST art. 51; RSST"
  }
];

export function SectorRiskImporter({ onRisksImported }: { onRisksImported: (risks: SectorRisk[]) => void }) {
  const [selectedRisks, setSelectedRisks] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");
  const { toast } = useToast();

  const handleSelectRisk = (riskId: string) => {
    setSelectedRisks(prev => 
      prev.includes(riskId) 
        ? prev.filter(id => id !== riskId)
        : [...prev, riskId]
    );
  };

  const handleSelectAll = () => {
    setSelectedRisks(energySectorRisks.map(r => r.id));
  };

  const handleDeselectAll = () => {
    setSelectedRisks([]);
  };

  const handleImportRisks = async () => {
    setIsImporting(true);
    setImportProgress(0);

    const selectedRiskObjects = energySectorRisks.filter(r => selectedRisks.includes(r.id));

    // Simulation du processus d'import
    for (let i = 0; i <= 100; i += 10) {
      setImportProgress(i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    onRisksImported(selectedRiskObjects);
    
    toast({
      title: "Risques sectoriels importés",
      description: `${selectedRiskObjects.length} risques du secteur énergétique ont été intégrés au registre PPAI`,
    });

    setIsImporting(false);
    setActiveTab("integration");
  };

  const exportToCSV = () => {
    const csvContent = [
      "ID_Risque,Secteur,Danger_Critique,Description,Probabilité,Gravité,Risque_Initial,Mesures_Contrôle,Efficacité_Contrôle,Risque_Résiduel,Statut,Responsable,Références_Légales",
      ...energySectorRisks.map(risk => 
        `"${risk.id}","${risk.sector}","${risk.criticalDanger}","${risk.description}",${risk.probability},${risk.gravity},${risk.initialRisk},"${risk.controlMeasures}",${risk.controlEffectiveness}%,${risk.residualRisk},"${risk.status}","${risk.responsible}","${risk.legalRef}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'risques-secteur-energetique.csv';
    link.click();
  };

  const getRiskLevelColor = (risk: number) => {
    if (risk >= 15) return "bg-red-100 text-red-800";
    if (risk >= 10) return "bg-orange-100 text-orange-800";
    if (risk >= 5) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Contrôlé": return "bg-green-100 text-green-800";
      case "En surveillance": return "bg-orange-100 text-orange-800";
      case "Action requise": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-600" />
            Registre des Risques Sectoriels - Secteur Énergétique
          </CardTitle>
          <p className="text-sm text-gray-600">
            Importez des risques pré-identifiés spécifiques au secteur énergétique dans votre registre PPAI
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview">📋 Aperçu des risques</TabsTrigger>
              <TabsTrigger value="selection">✅ Sélection</TabsTrigger>
              <TabsTrigger value="integration" disabled={!selectedRisks.length}>🔗 Intégration</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-3 text-center">
                      <div className="text-2xl font-bold text-blue-600">{energySectorRisks.length}</div>
                      <div className="text-xs text-gray-600">Risques disponibles</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {energySectorRisks.filter(r => r.initialRisk >= 15).length}
                      </div>
                      <div className="text-xs text-gray-600">Risques critiques</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {energySectorRisks.filter(r => r.status === "Contrôlé").length}
                      </div>
                      <div className="text-xs text-gray-600">Contrôlés</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {(energySectorRisks.reduce((acc, r) => acc + r.controlEffectiveness, 0) / energySectorRisks.length).toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-600">Efficacité moyenne</div>
                    </CardContent>
                  </Card>
                </div>
                <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Exporter CSV
                </Button>
              </div>

              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">ID</th>
                      <th className="px-3 py-2 text-left">Secteur</th>
                      <th className="px-3 py-2 text-left">Danger</th>
                      <th className="px-3 py-2 text-left">Description</th>
                      <th className="px-3 py-2 text-center">P×G</th>
                      <th className="px-3 py-2 text-center">Efficacité</th>
                      <th className="px-3 py-2 text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {energySectorRisks.map((risk) => (
                      <tr key={risk.id} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2 font-mono text-xs">{risk.id}</td>
                        <td className="px-3 py-2">{risk.sector}</td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className="text-xs">
                            {risk.criticalDanger}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 max-w-xs truncate">{risk.description}</td>
                        <td className="px-3 py-2 text-center">
                          <Badge className={getRiskLevelColor(risk.initialRisk)}>
                            {risk.initialRisk}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-center">{risk.controlEffectiveness}%</td>
                        <td className="px-3 py-2 text-center">
                          <Badge className={getStatusColor(risk.status)}>
                            {risk.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="selection" className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Sélectionner les risques à importer</h4>
                  <p className="text-sm text-gray-600">
                    {selectedRisks.length} risque(s) sélectionné(s) sur {energySectorRisks.length}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSelectAll} variant="outline" size="sm">
                    Tout sélectionner
                  </Button>
                  <Button onClick={handleDeselectAll} variant="outline" size="sm">
                    Tout désélectionner
                  </Button>
                </div>
              </div>

              <div className="grid gap-3">
                {energySectorRisks.map((risk) => (
                  <Card key={risk.id} className={`cursor-pointer transition-colors ${
                    selectedRisks.includes(risk.id) ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`} onClick={() => handleSelectRisk(risk.id)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="checkbox"
                              checked={selectedRisks.includes(risk.id)}
                              onChange={() => handleSelectRisk(risk.id)}
                              className="w-4 h-4"
                            />
                            <span className="font-mono text-sm font-medium">{risk.id}</span>
                            <Badge variant="outline">{risk.criticalDanger}</Badge>
                            <Badge className={getRiskLevelColor(risk.initialRisk)}>
                              Risque: {risk.initialRisk}
                            </Badge>
                          </div>
                          <h5 className="font-medium mb-1">{risk.description}</h5>
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Secteur:</strong> {risk.sector} | 
                            <strong> Responsable:</strong> {risk.responsible}
                          </p>
                          <p className="text-xs text-gray-500 mb-2">
                            <strong>Mesures:</strong> {risk.controlMeasures}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(risk.status)}>
                            {risk.status}
                          </Badge>
                          <div className="text-sm text-gray-600 mt-1">
                            Efficacité: {risk.controlEffectiveness}%
                          </div>
                          <div className="text-sm text-gray-600">
                            Résiduel: {risk.residualRisk}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedRisks.length > 0 && (
                <div className="flex justify-end">
                  <Button onClick={handleImportRisks} disabled={isImporting} size="lg">
                    <Upload className="w-4 h-4 mr-2" />
                    Importer {selectedRisks.length} risque(s) sélectionné(s)
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="integration" className="space-y-4">
              {isImporting && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Intégration en cours...</h4>
                    <Progress value={importProgress} className="mb-2" />
                    <p className="text-sm text-gray-600">{importProgress}% - Intégration des risques sectoriels</p>
                  </CardContent>
                </Card>
              )}

              {!isImporting && selectedRisks.length > 0 && (
                <Alert>
                  <Shield className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Intégration réussie !</strong> Les risques sectoriels ont été intégrés à votre registre PPAI.
                    Ces données seront maintenant utilisées pour personnaliser vos programmes de prévention.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
