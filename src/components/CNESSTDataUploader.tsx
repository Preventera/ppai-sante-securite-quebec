
import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, AlertTriangle, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CNESSTMetadata, ValidationResult } from "@/types/cnesst";

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
  const { toast } = useToast();

  const parseCSVData = useCallback((csvText: string, filename: string) => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.replace(/"/g, '').trim());
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });

    // Déterminer le type de fichier basé sur les colonnes
    if (headers.includes('secteur_scian') && headers.includes('taux_frequence')) {
      return { type: 'lesions_sectorielles', data };
    } else if (headers.includes('agent_causal') && headers.includes('probabilite_occurrence')) {
      return { type: 'agents_causals', data };
    } else if (headers.includes('siege_lesion') && headers.includes('frequence_relative')) {
      return { type: 'sieges_lesions', data };
    }
    
    return { type: 'unknown', data };
  }, []);

  const validateCNESSTData = useCallback((metadata: Partial<CNESSTMetadata>): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    let dataQualityScore = 1.0;

    // Validation des lésions sectorielles
    if (metadata.lesionsSecorielles) {
      if (metadata.lesionsSecorielles.length === 0) {
        errors.push("Aucune donnée de lésions sectorielles trouvée");
        dataQualityScore -= 0.3;
      }
      
      metadata.lesionsSecorielles.forEach((lesion, index) => {
        if (!lesion.secteur_scian || !lesion.taux_frequence) {
          errors.push(`Ligne ${index + 1}: Données sectorielles incomplètes`);
          dataQualityScore -= 0.05;
        }
        if (lesion.taux_frequence < 0 || lesion.taux_frequence > 100) {
          warnings.push(`Ligne ${index + 1}: Taux de fréquence suspect (${lesion.taux_frequence})`);
          dataQualityScore -= 0.02;
        }
      });
    }

    // Validation des agents causals
    if (metadata.agentCausals) {
      metadata.agentCausals.forEach((agent, index) => {
        if (agent.probabilite_occurrence < 0 || agent.probabilite_occurrence > 1) {
          errors.push(`Agent causal ${index + 1}: Probabilité d'occurrence invalide`);
          dataQualityScore -= 0.05;
        }
        if (agent.efficacite_mesure < 0 || agent.efficacite_mesure > 1) {
          warnings.push(`Agent causal ${index + 1}: Efficacité de mesure suspecte`);
          dataQualityScore -= 0.02;
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      dataQualityScore: Math.max(0, dataQualityScore)
    };
  }, []);

  const generateAIRecommendations = useCallback((metadata: Partial<CNESSTMetadata>) => {
    const recommendations = [];
    
    // Recommandation basée sur les secteurs à haut risque
    if (metadata.lesionsSecorielles) {
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

    // Recommandation basée sur les agents causals efficaces
    if (metadata.agentCausals) {
      const efficientMeasures = metadata.agentCausals.filter(a => a.efficacite_mesure > 0.85);
      if (efficientMeasures.length > 0) {
        recommendations.push({
          id: 'efficient-measures',
          type: 'preventive' as const,
          description: `${efficientMeasures.length} mesure(s) hautement efficace(s) identifiée(s)`,
          justification: `Efficacité supérieure à 85% pour: ${efficientMeasures.map(m => m.agent_causal).join(', ')}`,
          priority: 'MODÉRÉE' as const,
          efficacitePrevu: 0.9,
          coutEstime: 8000,
          roi: 4.5,
          implementationSteps: [
            'Prioriser l\'implémentation de ces mesures',
            'Adapter les mesures au contexte spécifique',
            'Monitorer l\'efficacité réelle post-implémentation'
          ]
        });
      }
    }

    return recommendations;
  }, []);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > maxFileSize) {
      toast({
        title: "Fichier trop volumineux",
        description: `La taille maximale autorisée est de ${maxFileSize / (1024 * 1024)}MB`,
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const text = await file.text();
      setUploadProgress(30);

      const parsed = parseCSVData(text, file.name);
      setUploadProgress(60);

      // Simuler le traitement et la validation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUploadProgress(80);

      const partialMetadata: Partial<CNESSTMetadata> = {};
      
      if (parsed.type === 'lesions_sectorielles') {
        partialMetadata.lesionsSecorielles = parsed.data;
      } else if (parsed.type === 'agents_causals') {
        partialMetadata.agentCausals = parsed.data;
      } else if (parsed.type === 'sieges_lesions') {
        partialMetadata.siegesLesions = parsed.data;
      }

      const validation = validateCNESSTData(partialMetadata);
      const recommendations = generateAIRecommendations(partialMetadata);

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

      toast({
        title: "Données CNESST traitées",
        description: `${parsed.data.length} enregistrements analysés avec succès`,
      });

    } catch (error) {
      toast({
        title: "Erreur de traitement",
        description: "Impossible de traiter le fichier CNESST",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  }, [maxFileSize, parseCSVData, validateCNESSTData, generateAIRecommendations, toast]);

  const handleIntegration = () => {
    if (parsedData) {
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
            Intégration Métadonnées CNESST
          </CardTitle>
          <p className="text-sm text-gray-600">
            Uploadez vos fichiers de données CNESST pour enrichir le moteur prédictif PPAI
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".csv,.xlsx,.json"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
              id="cnesst-upload"
            />
            <label
              htmlFor="cnesst-upload"
              className={`cursor-pointer ${isUploading ? 'opacity-50' : ''}`}
            >
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Glissez vos fichiers CNESST ici
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Formats supportés: {supportedFormats.join(', ')}
              </p>
              <Button disabled={isUploading}>
                {isUploading ? 'Traitement...' : 'Sélectionner fichiers'}
              </Button>
            </label>
          </div>

          {/* Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Traitement des données CNESST...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
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
                  Validation: {validationResult.isValid ? 'Réussie' : 'Échec'}
                </span>
                <Badge variant="outline">
                  Qualité: {(validationResult.dataQualityScore * 100).toFixed(1)}%
                </Badge>
              </div>
              <AlertDescription className="mt-2">
                {validationResult.errors.length > 0 && (
                  <div className="mb-2">
                    <strong>Erreurs:</strong>
                    <ul className="list-disc list-inside ml-2">
                      {validationResult.errors.map((error, index) => (
                        <li key={index} className="text-red-600">{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {validationResult.warnings.length > 0 && (
                  <div>
                    <strong>Avertissements:</strong>
                    <ul className="list-disc list-inside ml-2">
                      {validationResult.warnings.map((warning, index) => (
                        <li key={index} className="text-orange-600">{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* AI Recommendations Preview */}
          {parsedData?.integrationRecommendations && parsedData.integrationRecommendations.length > 0 && (
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
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>ROI: {rec.roi}x</span>
                        <span>Efficacité: {(rec.efficacitePrevu * 100).toFixed(0)}%</span>
                        <span>Coût: {rec.coutEstime.toLocaleString()}$</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Integration Button */}
          {parsedData && validationResult?.isValid && (
            <Button 
              onClick={handleIntegration}
              className="w-full"
              size="lg"
            >
              <Brain className="w-4 h-4 mr-2" />
              Intégrer au Moteur Prédictif PPAI
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
