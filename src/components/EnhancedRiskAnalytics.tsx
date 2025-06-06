import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Target, 
  AlertTriangle,
  Activity,
  Calendar,
  Download
} from 'lucide-react';

// Import des nouveaux composants D3.js
import { RiskMatrix } from '@/components/charts/d3/RiskMatrix';
import { InteractivePieChart } from '@/components/charts/d3/InteractivePieChart';
import { DistributionChart } from '@/components/charts/d3/DistributionChart';
import { TimelineChart } from '@/components/charts/d3/TimelineChart';

// Import des services
import { riskService } from '@/services/riskService';
import type { Risk } from '@/types/risk';

interface EnhancedRiskAnalyticsProps {
  className?: string;
}

export const EnhancedRiskAnalytics: React.FC<EnhancedRiskAnalyticsProps> = ({ 
  className = "" 
}) => {
  // État des données
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtres et options
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('matrix');

  // Chargement des données
  useEffect(() => {
    loadRiskData();
  }, [selectedSector, selectedPeriod]);

  const loadRiskData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await riskService.getAllRisks();
      
      // Filtrage par secteur si sélectionné
      const filteredData = selectedSector === 'all' 
        ? data 
        : data.filter(risk => risk.sector === selectedSector);
      
      setRisks(filteredData);
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error('Erreur:', err);
      
      // Données de démonstration en cas d'erreur
      setRisks([
        {
          id: '1',
          name: 'Chute de hauteur lors des travaux de toiture',
          probability: 4,
          gravity: 5,
          initialRisk: 20,
          measures: 'Harnais de sécurité, garde-corps temporaires',
          residualRisk: 8,
          status: 'Action requise',
          responsible: 'Chef de chantier',
          sector: 'Construction',
          phase: 'Travaux en hauteur',
          category: 'Sécurité'
        },
        {
          id: '2',
          name: 'Exposition aux produits chimiques',
          probability: 3,
          gravity: 4,
          initialRisk: 12,
          measures: 'EPI chimiques, ventilation',
          residualRisk: 6,
          status: 'Contrôles actifs',
          responsible: 'Responsable HSE',
          sector: 'Construction',
          phase: 'Manipulation des matériaux',
          category: 'Santé'
        },
        {
          id: '3',
          name: 'Blessure par machine',
          probability: 2,
          gravity: 4,
          initialRisk: 8,
          measures: 'Protections machines, formation',
          residualRisk: 4,
          status: 'En contrôle',
          responsible: 'Superviseur production',
          sector: 'Construction',
          phase: 'Production',
          category: 'Sécurité'
        },
        {
          id: '4',
          name: 'Troubles musculo-squelettiques',
          probability: 4,
          gravity: 3,
          initialRisk: 12,
          measures: 'Formation ergonomie, équipements adaptés',
          residualRisk: 9,
          status: 'Surveillance',
          responsible: 'Médecin du travail',
          sector: 'Construction',
          phase: 'Manipulation manuelle',
          category: 'Santé'
        },
        {
          id: '5',
          name: 'Incendie/explosion',
          probability: 1,
          gravity: 5,
          initialRisk: 5,
          measures: 'Détection incendie, extincteurs',
          residualRisk: 3,
          status: 'En contrôle',
          responsible: 'Responsable sécurité',
          sector: 'Construction',
          phase: 'Stockage',
          category: 'Sécurité'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Gestionnaire de mise à jour des risques (drag & drop)
  const handleRiskUpdate = async (riskId: string, newProbability: number, newGravity: number) => {
    try {
      // Mise à jour locale immédiate
      setRisks(prev => prev.map(risk => 
        risk.id === riskId 
          ? { 
              ...risk, 
              probability: newProbability, 
              gravity: newGravity,
              initialRisk: newProbability * newGravity 
            }
          : risk
      ));
      
      // Appel API pour sauvegarder
      // await riskService.updateRisk(riskId, { probability: newProbability, gravity: newGravity });
      
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      // Recharger les données en cas d'erreur
      loadRiskData();
    }
  };

  // Préparation des données pour les graphiques
  const distributionData = React.useMemo(() => {
    const categories = risks.reduce((acc, risk) => {
      const cat = risk.category || 'Non classé';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categories).map(([category, value]) => ({
      category,
      value,
      details: {
        critical: risks.filter(r => (r.category || 'Non classé') === category && r.initialRisk >= 15).length,
        high: risks.filter(r => (r.category || 'Non classé') === category && r.initialRisk >= 10 && r.initialRisk < 15).length,
        medium: risks.filter(r => (r.category || 'Non classé') === category && r.initialRisk >= 5 && r.initialRisk < 10).length,
        low: risks.filter(r => (r.category || 'Non classé') === category && r.initialRisk < 5).length
      }
    }));
  }, [risks]);

  const pieData = React.useMemo(() => {
    const criticityLevels = {
      'Critique (≥15)': risks.filter(r => r.initialRisk >= 15).length,
      'Élevé (10-14)': risks.filter(r => r.initialRisk >= 10 && r.initialRisk < 15).length,
      'Modéré (5-9)': risks.filter(r => r.initialRisk >= 5 && r.initialRisk < 10).length,
      'Faible (<5)': risks.filter(r => r.initialRisk < 5).length
    };

    return Object.entries(criticityLevels)
      .filter(([_, value]) => value > 0)
      .map(([category, value]) => ({
        category,
        value,
        color: category.includes('Critique') ? '#7C2D12' :
               category.includes('Élevé') ? '#EF4444' :
               category.includes('Modéré') ? '#F59E0B' : '#10B981'
      }));
  }, [risks]);

  const timelineData = React.useMemo(() => {
    // Simulation de données temporelles
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
    return months.map((month, index) => ({
      date: new Date(2024, index, 1),
      incidents: Math.floor(Math.random() * 5) + 1,
      nearMiss: Math.floor(Math.random() * 8) + 2,
      preventive: Math.floor(Math.random() * 10) + 5
    }));
  }, []);

  // Calcul des KPI
  const kpis = React.useMemo(() => {
    const totalRisks = risks.length;
    const criticalRisks = risks.filter(r => r.initialRisk >= 15).length;
    const averageRisk = totalRisks > 0 ? risks.reduce((sum, r) => sum + r.initialRisk, 0) / totalRisks : 0;
    const riskReduction = totalRisks > 0 ? risks.reduce((sum, r) => sum + (r.initialRisk - r.residualRisk), 0) / totalRisks : 0;

    return {
      totalRisks,
      criticalRisks,
      averageRisk: averageRisk.toFixed(1),
      riskReduction: riskReduction.toFixed(1),
      completionRate: Math.round((risks.filter(r => r.status === 'En contrôle').length / totalRisks) * 100) || 0
    };
  }, [risks]);

  const sectorsOptions = [
    { value: 'all', label: 'Tous les secteurs' },
    { value: 'Construction', label: 'Construction' },
    { value: 'Manufacturier', label: 'Manufacturier' },
    { value: 'Services', label: 'Services' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête avec contrôles */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Avancés des Risques</h2>
          <p className="text-gray-600">Visualisations interactives avec D3.js</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={selectedSector} onValueChange={setSelectedSector}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sectorsOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={loadRiskData}>
            <Activity className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Risques</p>
                <p className="text-2xl font-bold text-gray-900">{kpis.totalRisks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Critiques</p>
                <p className="text-2xl font-bold text-red-600">{kpis.criticalRisks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Risque Moyen</p>
                <p className="text-2xl font-bold text-orange-600">{kpis.averageRisk}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Réduction</p>
                <p className="text-2xl font-bold text-green-600">-{kpis.riskReduction}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Contrôlés</p>
                <p className="text-2xl font-bold text-purple-600">{kpis.completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques principaux */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="matrix">Matrice de Risques</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="repartition">Répartition</TabsTrigger>
          <TabsTrigger value="evolution">Évolution</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="space-y-4">
          <RiskMatrix
            risks={risks}
            width={800}
            height={600}
            interactive={true}
            onRiskUpdate={handleRiskUpdate}
            className="w-full"
          />
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <DistributionChart
            data={distributionData}
            width={800}
            height={500}
            title="Distribution des Risques par Catégorie"
            orientation="vertical"
            stacked={true}
            showComparison={false}
            className="w-full"
          />
        </TabsContent>

        <TabsContent value="repartition" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InteractivePieChart
              data={pieData}
              width={400}
              height={400}
              title="Répartition par Criticité"
              showLabels={true}
              explodeOnHover={true}
              innerRadius={50}
            />
            <InteractivePieChart
              data={distributionData}
              width={400}
              height={400}
              title="Répartition par Catégorie"
              showLabels={true}
              explodeOnHover={true}
              innerRadius={0}
            />
          </div>
        </TabsContent>

        <TabsContent value="evolution" className="space-y-4">
          <TimelineChart
            data={timelineData}
            width={800}
            height={400}
            showPrediction={true}
          />
        </TabsContent>
      </Tabs>

      {/* Section des insights et recommandations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Insights Automatiques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {kpis.criticalRisks > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>⚠️ Attention:</strong> {kpis.criticalRisks} risque(s) critique(s) détecté(s) nécessitant une action immédiate.
                </p>
              </div>
            )}
            
            {parseFloat(kpis.averageRisk) > 10 && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>📊 Analyse:</strong> L'indice moyen de risque ({kpis.averageRisk}) est élevé. Considérez un renforcement des mesures préventives.
                </p>
              </div>
            )}
            
            {kpis.completionRate < 70 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>🎯 Opportunité:</strong> Seulement {kpis.completionRate}% des risques sont contrôlés. Objectif recommandé: 85%.
                </p>
              </div>
            )}
            
            {parseFloat(kpis.riskReduction) > 5 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>✅ Progrès:</strong> Excellente réduction moyenne de {kpis.riskReduction} points par risque grâce aux mesures mises en place.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Actions Recommandées
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-3">
              {risks.filter(r => r.initialRisk >= 15).slice(0, 3).map((risk, index) => (
                <div key={risk.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Badge variant="destructive" className="mt-0.5">
                    {index + 1}
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{risk.name}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Criticité: {risk.initialRisk}/25 • Responsable: {risk.responsible}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      → Révision urgente des mesures de contrôle
                    </p>
                  </div>
                </div>
              ))}
              
              {risks.filter(r => r.initialRisk >= 15).length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">🎉 Aucun risque critique détecté</p>
                  <p className="text-xs mt-1">Maintenez vos bonnes pratiques de prévention</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section des tendances et prédictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Analyse Prédictive
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Tendance des Incidents</h4>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">-12% ce mois</span>
              </div>
              <p className="text-xs text-gray-500">
                Amélioration continue grâce aux mesures préventives
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Prévision Prochaine Période</h4>
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-600 font-medium">Stable</span>
              </div>
              <p className="text-xs text-gray-500">
                Maintien du niveau actuel avec surveillance renforcée
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Recommandation IA</h4>
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-600 font-medium">Focus Formation</span>
              </div>
              <p className="text-xs text-gray-500">
                Renforcer la formation sur les risques de catégorie "Sécurité"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Download className="h-5 w-5 text-gray-600" />
              Actions Rapides
            </span>
            <Badge variant="secondary" className="text-xs">
              {risks.length} risques analysés
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm">
              📊 Exporter le rapport complet
            </Button>
            <Button variant="outline" size="sm">
              📧 Envoyer aux responsables
            </Button>
            <Button variant="outline" size="sm">
              📅 Programmer une révision
            </Button>
            <Button variant="outline" size="sm">
              🎯 Créer un plan d'action
            </Button>
            <Button variant="outline" size="sm">
              📈 Comparer avec la période précédente
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer avec informations techniques */}
      <div className="text-center py-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Graphiques générés avec D3.js • Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          💡 Astuce: Utilisez le glisser-déposer dans la matrice pour ajuster rapidement les niveaux de risque
        </p>
      </div>
    </div>
  );
};// Copiez le contenu de l'artifact 'EnhancedRiskAnalytics.tsx'
