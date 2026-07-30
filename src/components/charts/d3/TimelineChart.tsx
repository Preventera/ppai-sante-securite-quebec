import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Download, RotateCcw, ZoomIn } from 'lucide-react';

interface TimelineData {
  date: Date;
  incidents: number;
  nearMiss: number;
  preventive: number;
}

interface TimelineChartProps {
  data: TimelineData[];
  width?: number;
  height?: number;
  showPrediction?: boolean;
  className?: string;
}

export const TimelineChart: React.FC<TimelineChartProps> = ({
  data,
  width = 800,
  height = 400,
  showPrediction = false,
  className = ""
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedMetric, setSelectedMetric] = useState<string>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const margin = { top: 20, right: 120, bottom: 40, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Filtrage des données selon la période
  const filteredData = React.useMemo(() => {
    if (selectedPeriod === 'all') return data;
    
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (selectedPeriod) {
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return data;
    }
    
    return data.filter(d => d.date >= cutoffDate);
  }, [data, selectedPeriod]);

  useEffect(() => {
    if (!svgRef.current || !filteredData.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Échelles
    const xScale = d3.scaleTime()
      .domain(d3.extent(filteredData, d => d.date) as [Date, Date])
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(filteredData, d => Math.max(d.incidents, d.nearMiss, d.preventive)) || 0])
      .range([chartHeight, 0]);

    // Clippath pour le zoom
    svg.append('defs')
      .append('clipPath')
      .attr('id', 'clip')
      .append('rect')
      .attr('width', chartWidth)
      .attr('height', chartHeight);

    // Groupe principal avec clip
    const mainGroup = g.append('g')
      .attr('clip-path', 'url(#clip)');

    // Grille
    const gridLines = g.append('g').attr('class', 'grid');

    // Grille horizontale
    gridLines.selectAll('.grid-line-horizontal')
      .data(yScale.ticks(5))
      .enter()
      .append('line')
      .attr('class', 'grid-line-horizontal')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', '#E5E7EB')
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', 0.5);

    // Grille verticale
    gridLines.selectAll('.grid-line-vertical')
      .data(xScale.ticks(6))
      .enter()
      .append('line')
      .attr('class', 'grid-line-vertical')
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d))
      .attr('y1', 0)
      .attr('y2', chartHeight)
      .attr('stroke', '#E5E7EB')
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', 0.3);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%b %Y')));

    g.append('g')
      .call(d3.axisLeft(yScale));

    // Labels des axes
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (chartHeight / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#6B7280')
      .text('Nombre d\'événements');

    g.append('text')
      .attr('transform', `translate(${chartWidth / 2}, ${chartHeight + margin.bottom - 5})`)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#6B7280')
      .text('Période');

    // Définition des lignes
    const incidentLine = d3.line<TimelineData>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.incidents))
      .curve(d3.curveMonotoneX);

    const nearMissLine = d3.line<TimelineData>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.nearMiss))
      .curve(d3.curveMonotoneX);

    const preventiveLine = d3.line<TimelineData>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.preventive))
      .curve(d3.curveMonotoneX);

    // Aires sous les courbes (optionnel)
    const area = d3.area<TimelineData>()
      .x(d => xScale(d.date))
      .y0(chartHeight)
      .y1(d => yScale(d.incidents))
      .curve(d3.curveMonotoneX);

    // Gradient pour l'aire
    const defs = svg.select('defs');
    
    const gradient = defs.append('linearGradient')
      .attr('id', 'incidentAreaGradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', 0)
      .attr('x2', 0).attr('y2', chartHeight);
    
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#EF4444')
      .attr('stop-opacity', 0.3);
    
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#EF4444')
      .attr('stop-opacity', 0.05);

    // Aire sous la courbe des incidents
    if (selectedMetric === 'all' || selectedMetric === 'incidents') {
      mainGroup.append('path')
        .datum(filteredData)
        .attr('fill', 'url(#incidentAreaGradient)')
        .attr('d', area)
        .style('opacity', 0)
        .transition()
        .duration(1000)
        .style('opacity', 1);
    }

    // Lignes principales
    const lineConfigs = [
      { 
        line: incidentLine, 
        color: '#EF4444', 
        width: 3, 
        key: 'incidents',
        label: 'Incidents' 
      },
      { 
        line: nearMissLine, 
        color: '#F59E0B', 
        width: 2, 
        key: 'nearMiss',
        label: 'Presque-accidents' 
      },
      { 
        line: preventiveLine, 
        color: '#10B981', 
        width: 2, 
        key: 'preventive',
        label: 'Mesures préventives' 
      }
    ];

    lineConfigs.forEach((config, index) => {
      if (selectedMetric === 'all' || selectedMetric === config.key) {
        const path = mainGroup.append('path')
          .datum(filteredData)
          .attr('fill', 'none')
          .attr('stroke', config.color)
          .attr('stroke-width', config.width)
          .attr('d', config.line)
          .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))');

        // Animation des lignes
        const totalLength = path.node()?.getTotalLength() || 0;
        path
          .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
          .attr('stroke-dashoffset', totalLength)
          .transition()
          .duration(2000)
          .delay(index * 300)
          .ease(d3.easeLinear)
          .attr('stroke-dashoffset', 0);
      }
    });

    // Points de données
    lineConfigs.forEach((config, lineIndex) => {
      if (selectedMetric === 'all' || selectedMetric === config.key) {
        const points = mainGroup.selectAll(`.point-${config.key}`)
          .data(filteredData)
          .enter()
          .append('circle')
          .attr('class', `point-${config.key}`)
          .attr('cx', d => xScale(d.date))
          .attr('cy', d => yScale(d[config.key as keyof TimelineData] as number))
          .attr('r', 0)
          .attr('fill', config.color)
          .attr('stroke', 'white')
          .attr('stroke-width', 2)
          .style('cursor', 'pointer')
          .on('mouseover', function(event, d) {
            // Tooltip
            const tooltip = d3.select('body').append('div')
              .attr('class', 'timeline-tooltip')
              .style('position', 'absolute')
              .style('background', 'rgba(0, 0, 0, 0.8)')
              .style('color', 'white')
              .style('padding', '8px 12px')
              .style('border-radius', '4px')
              .style('font-size', '12px')
              .style('pointer-events', 'none')
              .style('opacity', 0);

            tooltip.transition()
              .duration(200)
              .style('opacity', 1);

            tooltip.html(`
              <strong>${d.date.toLocaleDateString('fr-FR')}</strong><br/>
              ${config.label}: ${d[config.key as keyof TimelineData]}<br/>
              Total événements: ${d.incidents + d.nearMiss}
            `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');

            // Agrandir le point
            d3.select(this)
              .transition()
              .duration(200)
              .attr('r', 6)
              .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))');
          })
          .on('mousemove', function(event) {
            d3.select('.timeline-tooltip')
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 10) + 'px');
          })
          .on('mouseout', function() {
            d3.select('.timeline-tooltip').remove();
            d3.select(this)
              .transition()
              .duration(200)
              .attr('r', 4)
              .style('filter', 'none');
          });

        // Animation des points
        points
          .transition()
          .duration(800)
          .delay((_, i) => lineIndex * 300 + i * 100 + 1000)
          .attr('r', 4);
      }
    });

    // Prédictions (si activées)
    if (showPrediction && filteredData.length > 2) {
      const lastThreePoints = filteredData.slice(-3);
      const avgIncidents = d3.mean(lastThreePoints, d => d.incidents) || 0;
      const avgNearMiss = d3.mean(lastThreePoints, d => d.nearMiss) || 0;
      
      // Calcul de la tendance
      const trend = (filteredData[filteredData.length - 1].incidents - filteredData[0].incidents) / filteredData.length;
      
      // Point de prédiction
      const lastDate = filteredData[filteredData.length - 1].date;
      const nextDate = new Date(lastDate);
      nextDate.setMonth(nextDate.getMonth() + 1);
      
      const predictedIncidents = Math.max(0, avgIncidents + trend);
      const predictedNearMiss = Math.max(0, avgNearMiss + (trend * 0.5));

      // Ligne de prédiction (pointillée)
      const predictionLine = d3.line()
        .x((d: any) => xScale(d.date))
        .y((d: any) => yScale(d.incidents));

      const predictionData = [
        filteredData[filteredData.length - 1],
        { date: nextDate, incidents: predictedIncidents, nearMiss: predictedNearMiss, preventive: 0 }
      ];

      mainGroup.append('path')
        .datum(predictionData)
        .attr('fill', 'none')
        .attr('stroke', '#9CA3AF')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .attr('d', d => predictionLine(d as any))
        .style('opacity', 0)
        .transition()
        .delay(3000)
        .duration(1000)
        .style('opacity', 0.7);

      // Point de prédiction
      mainGroup.append('circle')
        .attr('cx', xScale(nextDate))
        .attr('cy', yScale(predictedIncidents))
        .attr('r', 0)
        .attr('fill', '#9CA3AF')
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .style('opacity', 0.7)
        .transition()
        .delay(3500)
        .duration(500)
        .attr('r', 5);

      // Label de prédiction
      mainGroup.append('text')
        .attr('x', xScale(nextDate))
        .attr('y', yScale(predictedIncidents) - 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('fill', '#6B7280')
        .style('font-weight', 'bold')
        .style('opacity', 0)
        .text(`Prédiction: ${predictedIncidents.toFixed(1)}`)
        .transition()
        .delay(4000)
        .duration(500)
        .style('opacity', 1);
    }

    // Légende
    const legend = g.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${chartWidth + 10}, 20)`);

    lineConfigs.forEach((config, i) => {
      if (selectedMetric === 'all' || selectedMetric === config.key) {
        const legendRow = legend.append('g')
          .attr('transform', `translate(0, ${i * 25})`);

        legendRow.append('line')
          .attr('x1', 0)
          .attr('x2', 20)
          .attr('stroke', config.color)
          .attr('stroke-width', config.width);

        legendRow.append('circle')
          .attr('cx', 10)
          .attr('cy', 0)
          .attr('r', 3)
          .attr('fill', config.color)
          .attr('stroke', 'white')
          .attr('stroke-width', 1);

        legendRow.append('text')
          .attr('x', 25)
          .attr('y', 0)
          .attr('dy', '0.35em')
          .style('font-size', '12px')
          .style('fill', '#374151')
          .text(config.label);
      }
    });

    // Brush pour le zoom (optionnel)
    if (zoomLevel > 1) {
      const brush = d3.brushX()
        .extent([[0, 0], [chartWidth, chartHeight]])
        .on('end', function(event) {
          if (!event.selection) return;
          const [x0, x1] = event.selection;
          const newDomain = [xScale.invert(x0), xScale.invert(x1)];
          xScale.domain(newDomain);
          
          // Redessiner avec le nouveau domaine
          // Cette partie nécessiterait une refactorisation pour être dynamique
        });

      g.append('g')
        .attr('class', 'brush')
        .call(brush);
    }

  }, [filteredData, width, height, selectedMetric, showPrediction, zoomLevel]);

  const exportAsImage = () => {
    if (!svgRef.current) return;
    
    const svgElement = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    canvas.width = width;
    canvas.height = height;
    
    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = 'timeline-risques.png';
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const resetView = () => {
    setSelectedPeriod('all');
    setSelectedMetric('all');
    setZoomLevel(1);
  };

  // Calcul des statistiques
  const stats = React.useMemo(() => {
    const totalIncidents = filteredData.reduce((sum, d) => sum + d.incidents, 0);
    const totalNearMiss = filteredData.reduce((sum, d) => sum + d.nearMiss, 0);
    const totalPreventive = filteredData.reduce((sum, d) => sum + d.preventive, 0);
    const avgIncidents = totalIncidents / filteredData.length;
    
    // Calcul de la tendance
    const firstHalf = filteredData.slice(0, Math.floor(filteredData.length / 2));
    const secondHalf = filteredData.slice(Math.floor(filteredData.length / 2));
    const firstAvg = d3.mean(firstHalf, d => d.incidents) || 0;
    const secondAvg = d3.mean(secondHalf, d => d.incidents) || 0;
    const trend = secondAvg - firstAvg;
    
    return {
      totalIncidents,
      totalNearMiss,
      totalPreventive,
      avgIncidents: avgIncidents.toFixed(1),
      trend: trend > 0 ? 'hausse' : trend < 0 ? 'baisse' : 'stable',
      trendValue: Math.abs(trend).toFixed(1)
    };
  }, [filteredData]);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Évolution Temporelle des Événements
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tout</SelectItem>
              <SelectItem value="year">Année</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="month">Mois</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes métriques</SelectItem>
              <SelectItem value="incidents">Incidents</SelectItem>
              <SelectItem value="nearMiss">Presque-accidents</SelectItem>
              <SelectItem value="preventive">Préventives</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={resetView}
            className="h-8 w-8 p-0"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportAsImage}
            className="h-8 w-8 p-0"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <svg
            ref={svgRef}
            width={width}
            height={height}
            className="border rounded-lg bg-gray-50"
          />
        </div>

        {/* Statistiques */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="font-semibold text-red-700">{stats.totalIncidents}</div>
            <div className="text-red-600">Incidents Total</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="font-semibold text-orange-700">{stats.totalNearMiss}</div>
            <div className="text-orange-600">Presque-accidents</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="font-semibold text-green-700">{stats.totalPreventive}</div>
            <div className="text-green-600">Mesures Préventives</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="font-semibold text-blue-700">{stats.avgIncidents}</div>
            <div className="text-blue-600">Moyenne/Période</div>
          </div>
        </div>

        {/* Analyse de tendance */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Tendance détectée:</span>
            <Badge 
              variant={stats.trend === 'baisse' ? 'default' : stats.trend === 'hausse' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {stats.trend === 'baisse' ? '📉' : stats.trend === 'hausse' ? '📈' : '➡️'} 
              {stats.trend} ({stats.trendValue})
            </Badge>
          </div>
          {showPrediction && (
            <p className="text-xs text-gray-600 mt-1">
              💡 Prédiction activée - Projection basée sur la tendance actuelle
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};// Copiez le contenu de l'artifact 'TimelineChart.tsx' 
// (Utilisez la partie complète du composant TimelineChart depuis l'artifact avancé)
