import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, CheckCircle, AlertTriangle, Brain, Download, Eye, Play, Pause, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CNESSTMetadata, ValidationResult } from "@/types/cnesst";
import { CNESSTDataProcessor } from "@/utils/cnessDataProcessor";

interface CNESSTDataUploaderProps {
  onDataParsed: (data: CNESSTMetadata) => void;
  supportedFormats: string[];
  maxFileSize: number;
}

export function CNESSTDataUploader({ onDataParsed, supportedFormats, maxFileSize }: CNESSTDataUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [parsedData, setParsedData] = useState<CNESSTMetadata | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("upload");
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [rawParsedInfo, setRawParsedInfo] = useState<any>(null);
  const { toast } = useToast();

  // Fonction pour permettre au UI de respirer pendant les opérations lourdes
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const parseCSVData = useCallback(async (csvText: string, filename: string) => {
    try {
      setProcessingStatus("Analyse du fichier CSV...");
      await sleep(50);

      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        throw new Error("Le fichier CSV doit contenir au moins une ligne d'en-têtes et une ligne de données");
      }

      setProcessingStatus("Extraction des en-têtes...");
      await sleep(50);

      const headers = lines[0].split(',').map(h => h.replace(/["\r]/g, '').trim());
      
      setProcessingStatus("Traitement des données...");
      await sleep(100);

      const data = [];
      const batchSize = 100;
      
      for (let i = 1; i < lines.length; i += batchSize) {
        if (isPaused) {
          await new Promise(resolve => {
            const checkPause = () => {
              if (!isPaused) resolve(undefined);
              else setTimeout(checkPause, 100);
            };
            checkPause();
          });
        }

        const batch = lines.slice(i, Math.min(i + batchSize, lines.length));
        
        for (let j = 0; j < batch.length; j++) {
          const line = batch[j];
          const values = line.split(',').map(v => v.replace(/["\r]/g, '').trim());
          const row: any = {};
          
          headers.forEach((header, headerIndex) => {
            const value = values[headerIndex] || '';
            if (!isNaN(Number(value)) && value !== '') {
              row[header] = Number(value);
            } else {
              row[header] = value;
            }
          });
          
          row._lineNumber = i + j + 1;
          
          if (Object.values(row).some(val => val !== '' && val !== undefined && val !== null)) {
            data.push(row);
          }
        }
        
        if (i % 500 === 0) {
          setProcessingStatus(`Traitement: ${Math.min(i + batchSize, lines.length)}/${lines.length} lignes`);
          setUploadProgress(20 + (i / lines.length) * 30);
          await sleep(10);
        }
      }

      setProcessingStatus("Détection du type de fichier...");
      await sleep(50);

      let fileType = 'unknown';
      
      if (headers.some(h => h.toLowerCase().includes('secteur')) && 
          headers.some(h => h.toLowerCase().includes('frequence'))) {
        fileType = 'lesions_sectorielles';
      } else if (headers.some(h => h.toLowerCase().includes('agent')) && 
                 headers.some(h => h.toLowerCase().includes('probabilite'))) {
        fileType = 'agents_causals';
      } else if (headers.some(h => h.toLowerCase().includes('siege')) && 
                 headers.some(h => h.toLowerCase().includes('lesion'))) {
        fileType = 'sieges_lesions';
      }

      console.log(`Fichier détecté comme: ${fileType}, ${data.length} lignes traitées`);

      return { 
        type: fileType, 
        data, 
        headers,
        totalRows: data.length,
        filename: filename.replace('.csv', '')
      };
    } catch (error) {
      console.error('Erreur parsing CSV:', error);
      throw new Error(`Erreur de parsing CSV: ${error instanceof Error ? error.message : 'Format invalide'}`);
    }
  }, [isPaused]);

  const validateCNESSTData = useCallback(async (metadata: Partial<CNESSTMetadata>, parsedInfo: any): Promise<ValidationResult> => {
    const errors: string[] = [];
    const warnings: string[] = [];
    let dataQualityScore = 1.0;

    setProcessingStatus("Validation des données...");
    await sleep(50);

    // Validation spécifique selon le type de données
    if (parsedInfo.type === 'lesions_sectorielles' && metadata.lesionsSecorielles) {
      for (let i = 0; i < metadata.lesionsSecorielles.length; i++) {
        const lesion = metadata.lesionsSecorielles[i];
        
        if (!lesion.secteur_scian || lesion.secteur_scian === '') {
          errors.push(`Ligne ${lesion._lineNumber || i + 1}: Code SCIAN manquant`);
          dataQualityScore -= 0.1;
        }
        if (!lesion.taux_frequence || lesion.taux_frequence <= 0) {
          errors.push(`Ligne ${lesion._lineNumber || i + 1}: Taux de fréquence invalide`);
          dataQualityScore -= 0.1;
        }
        if (lesion.taux_frequence && lesion.taux_frequence > 20) {
          warnings.push(`Ligne ${lesion._lineNumber || i + 1}: Taux de fréquence élevé (${lesion.taux_frequence})`);
          dataQualityScore -= 0.02;
        }
        
        if (i % 50 === 0) {
          await sleep(5);
        }
      }
    }

    if (parsedInfo.type === 'agents_causals' && metadata.agentCausals) {
      for (let i = 0; i < metadata.agentCausals.length; i++) {
        const agent = metadata.agentCausals[i];
        
        if (!agent.agent_causal || agent.agent_causal === '') {
          errors.push(`Ligne ${agent._lineNumber || i + 1}: Agent causal manquant`);
          dataQualityScore -= 0.1;
        }
        if (agent.probabilite_occurrence !== undefined && (agent.probabilite_occurrence < 0 || agent.probabilite_occurrence > 1)) {
          errors.push(`Ligne ${agent._lineNumber || i + 1}: Probabilité d'occurrence doit être entre 0 et 1`);
          dataQualityScore -= 0.1;
        }
        if (agent.efficacite_mesure !== undefined && (agent.efficacite_mesure < 0 || agent.efficacite_mesure > 1)) {
          warnings.push(`Ligne ${agent._lineNumber || i + 1}: Efficacité de mesure suspecte (${agent.efficacite_mesure})`);
          dataQualityScore -= 0.05;
        }
        
        if (i % 50 === 0) await sleep(5);
      }
    }

    if (parsedInfo.type === 'sieges_lesions' && metadata.siegesLesions) {
      for (let i = 0; i < metadata.siegesLesions.length; i++) {
        const siege = metadata.siegesLesions[i];
        
        if (!siege.siege_lesion || siege.siege_lesion === '') {
          errors.push(`Ligne ${siege._lineNumber || i + 1}: Siège de lésion manquant`);
          dataQualityScore -= 0.1;
        }
        if (siege.frequence_relative !== undefined && (siege.frequence_relative < 0 || siege.frequence_relative > 1)) {
          warnings.push(`Ligne ${siege._lineNumber || i + 1}: Fréquence relative suspecte (${siege.frequence_relative})`);
          dataQualityScore -= 0.05;
        }
        
        if (i % 50 === 0) await sleep(5);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      dataQualityScore: Math.max(0, dataQualityScore)
    };
  }, []);

  const generateAIRecommendations = useCallback(async (metadata: Partial<CNESSTMetadata>) => {
    setProcessingStatus("Génération des recommandations IA...");
    await sleep(100);

    const recommendations = [];
    
    if (metadata.lesionsSecorielles && metadata.lesionsSecorielles.length > 0) {
      const highRiskSectors = metadata.lesionsSecorielles.filter(l => l.taux_frequence > 4.0);
      if (highRiskSectors.length > 0) {
        recommendations.push({
          id: 'high-risk-sectors',
          type: 'predictive' as const,
          description: `${highRiskSectors.length} secteur(s) à risque élevé détecté(s)`,
          justification: `Taux de fréquence supérieur à 4.0 pour: ${highRiskSectors.map(s => s.nom_secteur).join(', ')}`,
          priority: 'ÉLEVÉE' as const,
          efficacitePrevu: 0.85,
          coutEstime: 15000,
          roi: 3.2,
          implementationSteps: [
            'Analyse approfondie des secteurs identifiés',
            'Mise en place de mesures préventives renforcées',
            'Surveillance accrue des indicateurs de performance'
          ]
        });
      }
    }

    return recommendations;
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > maxFileSize) {
      toast({
        title: "Fichier trop volumineux",
        description: `La taille maximale autorisée est de ${Math.round(maxFileSize / (1024 * 1024))}MB`,
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    setProcessingStatus(`Fichier sélectionné: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
    
    toast({
      title: "Fichier sélectionné",
      description: `${file.name} prêt pour le traitement`,
    });

    // Reset previous state
    setValidationResult(null);
    setParsedData(null);
    setPreviewData([]);
    setUploadProgress(0);
    setRawParsedInfo(null);
  }, [maxFileSize, toast]);

  const handleStartProcessing = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setIsPaused(false);
    setProcessingStatus("Début du traitement...");

    try {
      console.log("Début traitement fichier:", selectedFile.name);
      
      const text = await selectedFile.text();
      setUploadProgress(20);
      
      console.log("Fichier lu, début parsing...");
      const parsed = await parseCSVData(text, selectedFile.name);
      setUploadProgress(50);
      setRawParsedInfo(parsed);
      
      console.log("Parsing terminé, type détecté:", parsed.type);
      
      setPreviewData(parsed.data.slice(0, 5));
      setActiveTab("preview");
      setUploadProgress(60);

      setProcessingStatus("Préparation des métadonnées...");
      await sleep(200);

      const partialMetadata: Partial<CNESSTMetadata> = {};
      
      if (parsed.type === 'lesions_sectorielles') {
        partialMetadata.lesionsSecorielles = parsed.data;
      } else if (parsed.type === 'agents_causals') {
        partialMetadata.agentCausals = parsed.data;
      } else if (parsed.type === 'sieges_lesions') {
        partialMetadata.siegesLesions = parsed.data;
      } else {
        throw new Error(`Type de fichier non reconnu. Vérifiez que votre CSV contient les colonnes appropriées.`);
      }

      setUploadProgress(70);
      
      const validation = await validateCNESSTData(partialMetadata, parsed);
      setUploadProgress(85);
      
      const recommendations = await generateAIRecommendations(partialMetadata);
      setUploadProgress(95);

      const fullMetadata: CNESSTMetadata = {
        lesionsSecorielles: partialMetadata.lesionsSecorielles || [],
        agentCausals: partialMetadata.agentCausals || [],
        siegesLesions: partialMetadata.siegesLesions || [],
        validationStatus: validation,
        integrationRecommendations: recommendations
      };

      setUploadProgress(100);
      setValidationResult(validation);
      setParsedData(fullMetadata);
      setProcessingStatus("Traitement terminé !");

      console.log("Traitement complété avec succès");

      toast({
        title: "Données CNESST analysées",
        description: `${parsed.totalRows} enregistrements traités (${parsed.type.replace('_', ' ')})`,
      });

    } catch (error) {
      console.error('Erreur traitement fichier:', error);
      toast({
        title: "Erreur de traitement",
        description: error instanceof Error ? error.message : "Format de fichier non supporté",
        variant: "destructive"
      });
      setValidationResult({
        isValid: false,
        errors: [error instanceof Error ? error.message : "Erreur inconnue"],
        warnings: [],
        dataQualityScore: 0
      });
      setProcessingStatus("Erreur de traitement");
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, parseCSVData, validateCNESSTData, generateAIRecommendations, toast]);

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    setProcessingStatus(isPaused ? "Reprise du traitement..." : "Traitement en pause...");
  };

  const handleReset = () => {
    setSelectedFile(null);
    setIsUploading(false);
    setUploadProgress(0);
    setValidationResult(null);
    setParsedData(null);
    setPreviewData([]);
    setProcessingStatus("");
    setIsPaused(false);
    setRawParsedInfo(null);
    setActiveTab("upload");
  };

  const handleLoadExampleData = async () => {
    setIsUploading(true);
    setProcessingStatus("Chargement des données d'exemple...");
    
    try {
      await sleep(500);
      
      const exampleData = CNESSTDataProcessor.getDefaultCNESSTData();
      setParsedData(exampleData);
      setValidationResult(exampleData.validationStatus);
      setActiveTab("preview");
      
      setPreviewData(exampleData.lesionsSecorielles.slice(0, 3));
      
      toast({
        title: "Données d'exemple chargées",
        description: "Données CNESST de démonstration intégrées",
      });
    } finally {
      setIsUploading(false);
      setProcessingStatus("");
    }
  };

  const handleIntegration = () => {
    if (parsedData) {
      console.log("Intégration des données CNESST:", parsedData);
      onDataParsed(parsedData);
      toast({
        title: "Intégration réussie",
        description: "Les données CNESST ont été intégrées au moteur PPAI",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-6 h-6 text-blue-600" />
            Intégration Contrôlée - Métadonnées CNESST
          </CardTitle>
          <p className="text-sm text-gray-600">
            Uploadez vos fichiers CSV de lésions professionnelles avec contrôle total du processus
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">📁 Upload</TabsTrigger>
              <TabsTrigger value="preview" disabled={!previewData.length && !parsedData}>👁️ Aperçu</TabsTrigger>
              <TabsTrigger value="integration" disabled={!parsedData}>🔗 Intégration</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              {/* Formats supportés */}
              <Alert>
                <FileText className="w-4 h-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p><strong>Formats CSV supportés :</strong></p>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>• <strong>Lésions sectorielles :</strong> secteur_scian, nom_secteur, taux_frequence, gravite_moyenne...</li>
                      <li>• <strong>Agents causals :</strong> agent_causal, probabilite_occurrence, efficacite_mesure...</li>
                      <li>• <strong>Sièges lésions :</strong> siege_lesion, frequence_relative, gravite_moyenne...</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Zone d'upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="hidden"
                  id="cnesst-upload"
                />
                <label
                  htmlFor="cnesst-upload"
                  className={`cursor-pointer ${isUploading ? 'opacity-50' : ''}`}
                >
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    Sélectionnez votre fichier CSV CNESST
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Format CSV uniquement • Max {Math.round(maxFileSize / (1024 * 1024))}MB
                  </p>
                  <Button disabled={isUploading} size="lg">
                    {isUploading ? 'En cours...' : 'Parcourir les fichiers'}
                  </Button>
                </label>
              </div>

              {/* Fichier sélectionné */}
              {selectedFile && (
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Fichier sélectionné</h4>
                        <p className="text-sm text-gray-600">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">
                          Taille: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleStartProcessing}
                          disabled={isUploading}
                          className="flex items-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Commencer le traitement
                        </Button>
                        <Button
                          onClick={handleReset}
                          variant="outline"
                          disabled={isUploading}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Contrôles de traitement */}
              {isUploading && (
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Traitement en cours</span>
                        <div className="flex gap-2">
                          <Button
                            onClick={handlePauseResume}
                            variant="outline"
                            size="sm"
                          >
                            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                            {isPaused ? 'Reprendre' : 'Pause'}
                          </Button>
                          <Button
                            onClick={handleReset}
                            variant="destructive"
                            size="sm"
                          >
                            Annuler
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{processingStatus}</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} />
                        {isPaused && (
                          <p className="text-sm text-orange-600">⏸️ Traitement en pause</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Bouton données d'exemple */}
              <div className="text-center">
                <Button variant="outline" onClick={handleLoadExampleData} disabled={isUploading}>
                  <Download className="w-4 h-4 mr-2" />
                  Ou charger des données d'exemple
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              {previewData.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Aperçu des données (5 premières lignes)</h4>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(previewData[0] || {}).filter(key => key !== '_lineNumber').map(key => (
                            <th key={key} className="px-3 py-2 text-left font-medium text-gray-700 border-b">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, index) => (
                          <tr key={index} className="border-b">
                            {Object.entries(row).filter(([key]) => key !== '_lineNumber').map(([key, value]) => (
                              <td key={key} className="px-3 py-2 border-r">
                                {typeof value === 'number' ? value.toLocaleString() : String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Validation Results */}
              {validationResult && (
                <Alert className={validationResult.isValid ? "border-green-500" : "border-red-500"}>
                  <div className="flex items-center gap-2">
                    {validationResult.isValid ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="font-medium">
                      Validation: {validationResult.isValid ? 'Réussie' : 'Problèmes détectés'}
                    </span>
                    <Badge variant="outline">
                      Qualité: {(validationResult.dataQualityScore * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <AlertDescription className="mt-2">
                    {validationResult.errors.length > 0 && (
                      <div className="mb-2">
                        <strong>❌ Erreurs à corriger:</strong>
                        <ul className="list-disc list-inside ml-2 text-red-600">
                          {validationResult.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {validationResult.warnings.length > 0 && (
                      <div>
                        <strong>⚠️ Avertissements:</strong>
                        <ul className="list-disc list-inside ml-2 text-orange-600">
                          {validationResult.warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {validationResult.isValid && (
                      <p className="text-green-600">✅ Toutes les validations sont passées avec succès!</p>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="integration" className="space-y-4">
              {parsedData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {parsedData.lesionsSecorielles.length}
                        </div>
                        <div className="text-sm text-gray-600">Lésions sectorielles</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {parsedData.agentCausals.length}
                        </div>
                        <div className="text-sm text-gray-600">Agents causals</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {parsedData.siegesLesions.length}
                        </div>
                        <div className="text-sm text-gray-600">Sièges lésions</div>
                      </CardContent>
                    </Card>
                  </div>

                  {parsedData.integrationRecommendations.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Brain className="w-4 h-4 text-purple-600" />
                          Recommandations IA générées
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {parsedData.integrationRecommendations.map((rec, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">{rec.description}</span>
                                <Badge className={
                                  rec.priority === 'CRITIQUE' ? 'bg-red-100 text-red-800' :
                                  rec.priority === 'ÉLEVÉE' ? 'bg-orange-100 text-orange-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }>
                                  {rec.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{rec.justification}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Button 
                    onClick={handleIntegration}
                    className="w-full"
                    size="lg"
                    disabled={!validationResult?.isValid}
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Intégrer au Moteur Prédictif PPAI
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
