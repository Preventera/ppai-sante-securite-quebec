
import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, FileText, Database, Settings, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";

interface PipelineConfig {
  site: string;
  responsable: string;
  groupePrioritaire: "1" | "2" | "3";
  secteurActivite: string;
  typeProgramme: "PME" | "Plan_Action" | "Espace_Clos" | "Cadenassage" | "Ergonomie";
  description: string;
}

interface UploadedFile {
  file: File;
  type: string;
  size: string;
  columns?: string[];
}

const secteursActivite = [
  { code: "2361", nom: "Construction résidentielle" },
  { code: "2362", nom: "Construction commerciale" },
  { code: "3211", nom: "Transformation du bois" },
  { code: "3111", nom: "Industrie alimentaire" },
  { code: "5621", nom: "Collecte et traitement déchets" },
  { code: "5411", nom: "Services professionnels" },
  { code: "4411", nom: "Commerce de détail" },
  { code: "9110", nom: "Services municipaux" }
];

const typesProgramme = [
  { value: "PME", label: "Programme PME", description: "Programme pour petites et moyennes entreprises" },
  { value: "Plan_Action", label: "Plan d'action", description: "Plan d'action spécifique suite à événement" },
  { value: "Espace_Clos", label: "Espaces confinés", description: "Programme espaces confinés selon RSST" },
  { value: "Cadenassage", label: "Cadenassage", description: "Programme énergies dangereuses CSA Z460" },
  { value: "Ergonomie", label: "Ergonomie", description: "Programme prévention troubles musculo-squelettiques" }
];

export default function PipelineGenerator() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [configCompleted, setConfigCompleted] = useState(false);
  const { toast } = useToast();

  const form = useForm<PipelineConfig>({
    defaultValues: {
      site: "",
      responsable: "",
      groupePrioritaire: "2",
      secteurActivite: "",
      typeProgramme: "PME",
      description: ""
    }
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      processFiles(files);
    }
  };

  const processFiles = (files: File[]) => {
    const validTypes = ['.xlsx', '.xls', '.csv', '.json', '.xml'];
    const newFiles: UploadedFile[] = [];

    files.forEach(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (validTypes.includes(extension)) {
        newFiles.push({
          file,
          type: extension,
          size: formatFileSize(file.size),
          columns: mockDetectColumns(file.name)
        });
      } else {
        toast({
          title: "Format non supporté",
          description: `Le fichier ${file.name} n'est pas dans un format supporté.`,
          variant: "destructive"
        });
      }
    });

    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    if (newFiles.length > 0) {
      toast({
        title: "Fichiers ajoutés",
        description: `${newFiles.length} fichier(s) ajouté(s) avec succès.`
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const mockDetectColumns = (filename: string): string[] => {
    // Simulation de détection automatique des colonnes
    const baseColumns = ['Date', 'Type_Evenement', 'Description', 'Gravite', 'Probabilite'];
    if (filename.includes('incident')) {
      return [...baseColumns, 'Secteur', 'Employe', 'Mesures_Prises'];
    }
    if (filename.includes('inspection')) {
      return [...baseColumns, 'Zone_Inspectee', 'Non_Conformites', 'Actions_Requises'];
    }
    return baseColumns;
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: PipelineConfig) => {
    console.log("Configuration Pipeline PPAI:", data);
    console.log("Fichiers uploadés:", uploadedFiles);
    
    setConfigCompleted(true);
    toast({
      title: "Configuration complète",
      description: "Le pipeline PPAI est prêt à être généré selon les normes CNESST.",
    });
  };

  const connectAPI = () => {
    // Simulation connexion API
    setApiConnected(!apiConnected);
    toast({
      title: apiConnected ? "API déconnectée" : "API connectée",
      description: apiConnected ? "Connexion aux logiciels SST fermée." : "Connecté aux logiciels SST (Procore, EcoOnline, Cority).",
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-sst-blue">Pipeline Générateur PPAI</h1>
        <p className="text-gray-600">Configuration et upload pour génération automatique conforme CNESST 2025</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section Upload */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-sst-blue" />
                Upload de Fichiers SST
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Zone de Drop */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? 'border-sst-blue bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Glissez vos fichiers SST ici
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Excel (.xlsx, .xls), CSV, JSON, XML
                </p>
                <input
                  type="file"
                  multiple
                  accept=".xlsx,.xls,.csv,.json,.xml"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" className="cursor-pointer">
                    Parcourir les fichiers
                  </Button>
                </label>
              </div>

              {/* API Connector */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">Connecteur API SST</span>
                  </div>
                  <Button 
                    variant={apiConnected ? "destructive" : "default"}
                    size="sm"
                    onClick={connectAPI}
                  >
                    {apiConnected ? "Déconnecter" : "Connecter"}
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Intégration directe avec Procore, EcoOnline, Cority
                </p>
                {apiConnected && (
                  <Badge className="mt-2 bg-green-500">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connecté
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fichiers Uploadés */}
          {uploadedFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-sst-blue" />
                  Fichiers Traités ({uploadedFiles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-sm">{file.file.name}</span>
                          <Badge variant="outline">{file.type.toUpperCase()}</Badge>
                          <span className="text-xs text-gray-500">{file.size}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </Button>
                      </div>
                      {file.columns && (
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Colonnes détectées:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {file.columns.map((col, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {col}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Section Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-sst-blue" />
              Configuration Contexte CNESST
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Informations de base */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="site"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site / Établissement</FormLabel>
                        <FormControl>
                          <Input placeholder="Nom du site" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="responsable"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsable SST</FormLabel>
                        <FormControl>
                          <Input placeholder="Nom du responsable" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Groupe Prioritaire CNESST */}
                <FormField
                  control={form.control}
                  name="groupePrioritaire"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Groupe Prioritaire CNESST</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="1" id="groupe1" />
                            <label htmlFor="groupe1" className="text-sm font-medium">
                              Groupe 1 <span className="text-xs text-gray-500">(Construction)</span>
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="2" id="groupe2" />
                            <label htmlFor="groupe2" className="text-sm font-medium">
                              Groupe 2 <span className="text-xs text-gray-500">(Manufacturier)</span>
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="3" id="groupe3" />
                            <label htmlFor="groupe3" className="text-sm font-medium">
                              Groupe 3 <span className="text-xs text-gray-500">(Services)</span>
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Secteur d'activité */}
                <FormField
                  control={form.control}
                  name="secteurActivite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secteur d'Activité (SCIAN)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez votre secteur" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {secteursActivite.map((secteur) => (
                            <SelectItem key={secteur.code} value={secteur.code}>
                              {secteur.code} - {secteur.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Type de Programme */}
                <FormField
                  control={form.control}
                  name="typeProgramme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de Programme</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {typesProgramme.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-gray-500">{type.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description du Contexte</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Décrivez le contexte spécifique de votre établissement..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Validation et Submit */}
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium text-sm mb-2">Validation de Conformité</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>LSST - Loi sur la santé et sécurité du travail</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>LMRSST - Loi modernisant le régime SST (2025)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>RSST - Règlement sur la santé et sécurité</span>
                      </div>
                      {form.watch("typeProgramme") === "Cadenassage" && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>CSA Z460 - Norme cadenassage énergies dangereuses</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={uploadedFiles.length === 0}
                  >
                    {configCompleted ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Configuration Complète
                      </div>
                    ) : (
                      "Valider la Configuration"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Étapes suivantes */}
      {configCompleted && uploadedFiles.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-800">Configuration Terminée</h3>
            </div>
            <p className="text-green-700 mb-4">
              Votre pipeline PPAI est prêt à être généré selon les normes CNESST 2025.
            </p>
            <div className="flex gap-4">
              <Button className="bg-green-600 hover:bg-green-700">
                Générer le Pipeline PPAI
              </Button>
              <Button variant="outline">
                Prévisualiser la Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
