import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Maximize2, RotateCcw } from 'lucide-react';

interface Risk {
  id: string;
  name: string;
  probability: number;
  gravity: number;
  initialRisk: number;
  category?: string;
  status?: string;
  measures?: string;
}

interface RiskMatrixProps {
  risks: Risk[];
  width?: number;
  height?: number;
  interactive?: boolean;
  onRiskUpdate?: (riskId: string, newProbability: number, newGravity: number) => void;
  className?: string;
}

interface TooltipData {
  risk: Risk;
  x: number;
  y: number;
  visible: boolean;
}

export const RiskMatrix: React.FC<RiskMatrixProps> = ({
  risks = [],
  width = 600,
  height = 500,
  interactive = true,
  onRiskUpdate,
  className = ""
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData>({ 
    risk: null, 
    x: 0, 
    y: 0, 
    visible: false 
  });
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);

  // Configuration de la matrice
  const margin = { top: 60, right: 60, bottom: 80, left: 80 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Échelles
  const xScale = d3.scaleLinear().domain([0.5, 5.5]).range([0, chartWidth]);
  const yScale = d3.scaleLinear().domain([0.5, 5.5]).range([chartHeight, 0]);

  // Fonction de couleur basée sur le niveau de risque
  const getRiskColor = (riskLevel: number): string => {
    if (riskLevel >= 20) return '#7C2D12'; // Critique - Rouge foncé
    if (riskLevel >= 15) return '#EF4444'; // Élevé - Rouge
    if (riskLevel >= 10) return '#F59E0B'; // Modéré - Orange
    if (riskLevel >= 5) return '#EAB308';  // Faible - Jaune
    return '#10B981'; // Très faible - Vert
  };

  // Fonction de taille basée sur le niveau de risque
  const getRiskSize = (riskLevel: number): number => {
    const baseSize = 8;
    const multiplier = Math.sqrt(riskLevel) / 2;
    return Math.max(baseSize, baseSize + multiplier * 2);
  };

  // Zones de risque pour le fond
  const getRiskZones = () => {
    const zones = [];
    for (let p = 1; p <= 5; p++) {
      for (let g = 1; g <= 5; g++) {
        const riskLevel = p * g;
        zones.push({
          x: xScale(p - 0.4),
          y: yScale(g + 0.4),
          width: xScale(0.8),
          height: yScale(-0.8),
          color: getRiskColor(riskLevel),
          opacity: 0.1,
          riskLevel
        });
      }
    }
    return zones;
  };

  // Labels pour les axes
  const probabilityLabels = [
    { value: 1, label: 'Très rare\n(1)' },
    { value: 2, label: 'Rare\n(2)' },
    { value: 3, label: 'Possible\n(3)' },
    { value: 4, label: 'Probable\n(4)' },
    { value: 5, label: 'Très probable\n(5)' }
  ];

  const gravityLabels = [
    { value: 1, label: 'Négligeable\n(1)' },
    { value: 2, label: 'Mineure\n(2)' },
    { value: 3, label: 'Modérée\n(3)' },
    { value: 4, label: 'Majeure\n(4)' },
    { value: 5, label: 'Catastrophique\n(5)' }
  ];

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Création du groupe principal
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Zones de fond colorées
    const zones = g.selectAll('.risk-zone')
      .data(getRiskZones())
      .enter()
      .append('rect')
      .attr('class', 'risk-zone')
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('width', d => d.width)
      .attr('height', -d => d.height)
      .attr('fill', d => d.color)
      .attr('opacity', d => d.opacity)
      .attr('stroke', '#E5E7EB')
      .attr('stroke-width', 0.5);

    // Grille
    const gridLines = g.append('g').attr('class', 'grid');

    // Lignes verticales
    gridLines.selectAll('.grid-line-vertical')
      .data([1, 2, 3, 4, 5])
      .enter()
      .append('line')
      .attr('class', 'grid-line-vertical')
      .attr('x1', d => xScale(d + 0.5))
      .attr('x2', d => xScale(d + 0.5))
      .attr('y1', 0)
      .attr('y2', chartHeight)
      .attr('stroke', '#D1D5DB')
      .attr('stroke-width', 1);

    // Lignes horizontales
    gridLines.selectAll('.grid-line-horizontal')
      .data([1, 2, 3, 4, 5])
      .enter()
      .append('line')
      .attr('class', 'grid-line-horizontal')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', d => yScale(d + 0.5))
      .attr('y2', d => yScale(d + 0.5))
      .attr('stroke', '#D1D5DB')
      .attr('stroke-width', 1);

    // Axes
    const xAxis = d3.axisBottom(xScale)
      .tickValues([1, 2, 3, 4, 5])
      .tickFormat('');

    const yAxis = d3.axisLeft(yScale)
      .tickValues([1, 2, 3, 4, 5])
      .tickFormat('');

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(xAxis);

    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis);

    // Labels des axes
    // Probabilité (axe X)
    const xLabels = g.selectAll('.x-label')
      .data(probabilityLabels)
      .enter()
      .append('text')
      .attr('class', 'x-label')
      .attr('x', d => xScale(d.value))
      .attr('y', chartHeight + 35)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', '#4B5563')
      .selectAll('tspan')
      .data(d => d.label.split('\n'))
      .enter()
      .append('tspan')
      .attr('x', (_, i, nodes) => {
        const parent = d3.select(nodes[i].parentNode);
        return parent.attr('x');
      })
      .attr('dy', (_, i) => i === 0 ? 0 : '1em')
      .text(d => d);

    // Gravité (axe Y)
    const yLabels = g.selectAll('.y-label')
      .data(gravityLabels)
      .enter()
      .append('text')
      .attr('class', 'y-label')
      .attr('x', -35)
      .attr('y', d => yScale(d.value))
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', '#4B5563')
      .attr('dominant-baseline', 'middle')
      .selectAll('tspan')
      .data(d => d.label.split('\n'))
      .enter()
      .append('tspan')
      .attr('x', (_, i, nodes) => {
        const parent = d3.select(nodes[i].parentNode);
        return parent.attr('x');
      })
      .attr('dy', (_, i) => i === 0 ? '-0.5em' : '1em')
      .text(d => d);

    // Titres des axes
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height - 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', '#374151')
      .text('PROBABILITÉ');

    svg.append('text')
      .attr('x', 20)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', '#374151')
      .attr('transform', `rotate(-90, 20, ${height / 2})`)
      .text('GRAVITÉ');

    // Points de risque
    const riskPoints = g.selectAll('.risk-point')
      .data(risks)
      .enter()
      .append('circle')
      .attr('class', 'risk-point')
      .attr('cx', d => xScale(d.probability))
      .attr('cy', d => yScale(d.gravity))
      .attr('r', 0)
      .attr('fill', d => getRiskColor(d.initialRisk))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('cursor', interactive ? 'grab' : 'pointer')
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', getRiskSize(d.initialRisk) + 3)
          .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))');

        setTooltip({
          risk: d,
          x: event.pageX,
          y: event.pageY,
          visible: true
        });
      })
      .on('mousemove', function(event) {
        setTooltip(prev => ({
          ...prev,
          x: event.pageX,
          y: event.pageY
        }));
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', getRiskSize(d.initialRisk))
          .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))');

        setTooltip(prev => ({ ...prev, visible: false }));
      })
      .on('click', function(event, d) {
        setSelectedRisk(prev => prev === d.id ? null : d.id);
      });

    // Animation d'entrée des points
    riskPoints
      .transition()
      .duration(800)
      .delay((_, i) => i * 100)
      .attr('r', d => getRiskSize(d.initialRisk))
      .ease(d3.easeBounceOut);

    // Drag behavior pour l'interactivité
    if (interactive && onRiskUpdate) {
      const drag = d3.drag<SVGCircleElement, Risk>()
        .on('start', function(event, d) {
          d3.select(this).style('cursor', 'grabbing');
        })
        .on('drag', function(event, d) {
          const newX = Math.max(xScale(1), Math.min(xScale(5), event.x));
          const newY = Math.max(yScale(5), Math.min(yScale(1), event.y));
          
          d3.select(this)
            .attr('cx', newX)
            .attr('cy', newY);
        })
        .on('end', function(event, d) {
          d3.select(this).style('cursor', 'grab');
          
          const newProbability = Math.round(xScale.invert(event.x));
          const newGravity = Math.round(yScale.invert(event.y));
          
          // Snap to grid
          d3.select(this)
            .transition()
            .duration(300)
            .attr('cx', xScale(newProbability))
            .attr('cy', yScale(newGravity));
          
          if (onRiskUpdate) {
            onRiskUpdate(d.id, newProbability, newGravity);
          }
        });

      riskPoints.call(drag);
    }

    // Légende des niveaux de risque
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 150}, 30)`);

    const legendData = [
      { label: 'Critique (20-25)', color: '#7C2D12' },
      { label: 'Élevé (15-19)', color: '#EF4444' },
      { label: 'Modéré (10-14)', color: '#F59E0B' },
      { label: 'Faible (5-9)', color: '#EAB308' },
      { label: 'Très faible (1-4)', color: '#10B981' }
    ];

    const legendItems = legend.selectAll('.legend-item')
      .data(legendData)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (_, i) => `translate(0, ${i * 20})`);

    legendItems.append('circle')
      .attr('cx', 8)
      .attr('cy', 0)
      .attr('r', 6)
      .attr('fill', d => d.color);

    legendItems.append('text')
      .attr('x', 20)
      .attr('y', 0)
      .attr('dy', '0.35em')
      .attr('font-size', '12px')
      .attr('fill', '#4B5563')
      .text(d => d.label);

  }, [risks, width, height, interactive, onRiskUpdate]);

  // Fonction d'export
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
      downloadLink.download = 'matrice-risques.png';
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const resetView = () => {
    setSelectedRisk(null);
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  return (
    <Card className={`relative ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">
          Matrice de Risques Interactive
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-xs">
            {risks.length} risque{risks.length > 1 ? 's' : ''}
          </Badge>
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
      <CardContent className="p-6">
        <div className="relative">
          <svg
            ref={svgRef}
            width={width}
            height={height}
            className="border rounded-lg bg-gray-50"
          />
          
          {/* Tooltip */}
          {tooltip.visible && tooltip.risk && (
            <div 
              className="fixed z-50 p-3 bg-white border border-gray-200 rounded-lg shadow-lg max-w-xs"
              style={{ 
                left: tooltip.x + 10, 
                top: tooltip.y - 10,
                pointerEvents: 'none'
              }}
            >
              <div className="font-semibold text-sm text-gray-900 mb-1">
                {tooltip.risk.name}
              </div>
              <div className="space-y-1 text-xs text-gray-600">
                <div>Probabilité: {tooltip.risk.probability}/5</div>
                <div>Gravité: {tooltip.risk.gravity}/5</div>
                <div className="font-medium">
                  Risque initial: 
                  <span 
                    className="ml-1 px-2 py-0.5 rounded text-white text-xs"
                    style={{ backgroundColor: getRiskColor(tooltip.risk.initialRisk) }}
                  >
                    {tooltip.risk.initialRisk}/25
                  </span>
                </div>
                {tooltip.risk.category && (
                  <div>Catégorie: {tooltip.risk.category}</div>
                )}
                {tooltip.risk.measures && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="font-medium">Mesures:</div>
                    <div className="italic">{tooltip.risk.measures}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {interactive && (
          <div className="mt-4 text-xs text-gray-500 flex items-center">
            💡 Astuce: Glissez-déposez les points pour ajuster la probabilité et gravité
          </div>
        )}
      </CardContent>
    </Card>
  );
};// Copiez le contenu de l'artifact 'RiskMatrix.tsx'
