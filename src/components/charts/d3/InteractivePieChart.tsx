// Copiez le contenu de l'artifact 'InteractivePieChart.tsx'
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PieChart, Download, RotateCcw } from 'lucide-react';

interface PieData {
  category: string;
  value: number;
  color?: string;
  description?: string;
}

interface InteractivePieChartProps {
  data: PieData[];
  width?: number;
  height?: number;
  title?: string;
  showLabels?: boolean;
  explodeOnHover?: boolean;
  innerRadius?: number;
  className?: string;
}

export const InteractivePieChart: React.FC<InteractivePieChartProps> = ({
  data,
  width = 400,
  height = 400,
  title = "Répartition des Risques",
  showLabels = true,
  explodeOnHover = true,
  innerRadius = 0,
  className = ""
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedSlice, setSelectedSlice] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    data: PieData | null;
  }>({ visible: false, x: 0, y: 0, data: null });

  const radius = Math.min(width, height) / 2 - 40;
  const outerRadius = radius;

  // Couleurs par défaut si non spécifiées
  const colorScale = d3.scaleOrdinal<string>()
    .domain(data.map(d => d.category))
    .range(['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899']);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Calcul des angles
    const pie = d3.pie<PieData>()
      .value(d => d.value)
      .sort(null)
      .padAngle(0.02);

    const arc = d3.arc<d3.PieArcDatum<PieData>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    const arcHover = d3.arc<d3.PieArcDatum<PieData>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius + (explodeOnHover ? 10 : 0));

    const arcs = g.selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    // Secteurs
    const paths = arcs.append('path')
      .attr('d', arc)
      .attr('fill', (d, i) => d.data.color || colorScale(d.data.category))
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))')
      .on('mouseover', function(event, d) {
        if (explodeOnHover) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('d', arcHover);
        }

        d3.select(this)
          .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))');

        setTooltip({
          visible: true,
          x: event.pageX,
          y: event.pageY,
          data: d.data
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
        if (explodeOnHover && selectedSlice !== d.data.category) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('d', arc);
        }

        d3.select(this)
          .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))');

        setTooltip(prev => ({ ...prev, visible: false }));
      })
      .on('click', function(event, d) {
        const isSelected = selectedSlice === d.data.category;
        setSelectedSlice(isSelected ? null : d.data.category);

        // Réinitialiser tous les secteurs
        arcs.selectAll('path')
          .transition()
          .duration(300)
          .attr('d', arc)
          .style('opacity', 1);

        if (!isSelected) {
          // Exploser le secteur sélectionné
          d3.select(this)
            .transition()
            .duration(300)
            .attr('d', arcHover);

          // Atténuer les autres secteurs
          arcs.selectAll('path')
            .filter((data: any) => data.data.category !== d.data.category)
            .transition()
            .duration(300)
            .style('opacity', 0.6);
        }
      });

    // Animation d'entrée
    paths
      .style('opacity', 0)
      .transition()
      .duration(800)
      .delay((_, i) => i * 100)
      .style('opacity', 1)
      .attrTween('d', function(d: any) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return (t: number) => arc(interpolate(t))!;
      });

    // Labels si activés
    if (showLabels) {
      const labelArc = d3.arc<d3.PieArcDatum<PieData>>()
        .innerRadius(outerRadius + 10)
        .outerRadius(outerRadius + 10);

      // Lignes de connexion
      arcs.append('polyline')
        .attr('points', (d: any) => {
          const pos = labelArc.centroid(d);
          pos[0] = radius * 0.95 * (pos[0] > 0 ? 1 : -1);
          return [arc.centroid(d), labelArc.centroid(d), pos]
            .map(([x, y]) => `${x},${y}`)
            .join(' ');
        })
        .style('fill', 'none')
        .style('stroke', '#64748B')
        .style('stroke-width', 1)
        .style('opacity', 0)
        .transition()
        .delay(1000)
        .duration(500)
        .style('opacity', 1);

      // Texte des labels
      arcs.append('text')
        .attr('transform', (d: any) => {
          const pos = labelArc.centroid(d);
          pos[0] = radius * 0.95 * (pos[0] > 0 ? 1 : -1);
          return `translate(${pos})`;
        })
        .attr('dy', '0.35em')
        .style('text-anchor', (d: any) => {
          const pos = labelArc.centroid(d);
          return pos[0] > 0 ? 'start' : 'end';
        })
        .style('font-size', '12px')
        .style('fill', '#374151')
        .style('opacity', 0)
        .text((d: any) => `${d.data.category} (${d.data.value})`)
        .transition()
        .delay(1200)
        .duration(500)
        .style('opacity', 1);

      // Pourcentages sur les secteurs
      arcs.append('text')
        .attr('transform', (d: any) => `translate(${arc.centroid(d)})`)
        .attr('dy', '0.35em')
        .style('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .style('fill', 'white')
        .style('opacity', 0)
        .text((d: any) => {
          const total = data.reduce((sum, item) => sum + item.value, 0);
          const percentage = Math.round((d.data.value / total) * 100);
          return percentage > 5 ? `${percentage}%` : ''; // N'afficher que si > 5%
        })
        .transition()
        .delay(1500)
        .duration(500)
        .style('opacity', 1);
    }

    // Centre du donut (si innerRadius > 0)
    if (innerRadius > 0) {
      const centerGroup = g.append('g').attr('class', 'center-info');
      
      const total = data.reduce((sum, item) => sum + item.value, 0);
      
      centerGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.5em')
        .style('font-size', '24px')
        .style('font-weight', 'bold')
        .style('fill', '#1F2937')
        .text(total);

      centerGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1em')
        .style('font-size', '12px')
        .style('fill', '#6B7280')
        .text('Total');
    }

  }, [data, width, height, showLabels, explodeOnHover, innerRadius, selectedSlice]);

  const resetView = () => {
    setSelectedSlice(null);
    setTooltip(prev => ({ ...prev, visible: false }));
  };

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
      downloadLink.download = 'graphique-repartition.png';
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Calcul des statistiques
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const maxCategory = data.reduce((max, item) => 
    item.value > max.value ? item : max, data[0] || { category: '', value: 0 }
  );

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          {title}
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-xs">
            {data.length} catégorie{data.length > 1 ? 's' : ''}
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
      <CardContent>
        <div className="relative">
          <svg
            ref={svgRef}
            width={width}
            height={height}
            className="overflow-visible"
          />
          
          {/* Tooltip */}
          {tooltip.visible && tooltip.data && (
            <div 
              className="fixed z-50 p-3 bg-white border border-gray-200 rounded-lg shadow-lg max-w-xs"
              style={{ 
                left: tooltip.x + 10, 
                top: tooltip.y - 10,
                pointerEvents: 'none'
              }}
            >
              <div className="font-semibold text-sm text-gray-900 mb-1">
                {tooltip.data.category}
              </div>
              <div className="space-y-1 text-xs text-gray-600">
                <div>Valeur: {tooltip.data.value}</div>
                <div>
                  Pourcentage: {Math.round((tooltip.data.value / total) * 100)}%
                </div>
                {tooltip.data.description && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="italic">{tooltip.data.description}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Statistiques */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-gray-900">{total}</div>
            <div className="text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900">{maxCategory.category}</div>
            <div className="text-gray-500">Plus élevé</div>
          </div>
        </div>

        {/* Légende interactive */}
        <div className="mt-4 space-y-2">
          {data.map((item, index) => {
            const percentage = Math.round((item.value / total) * 100);
            const isSelected = selectedSlice === item.category;
            
            return (
              <div
                key={item.category}
                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                  isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedSlice(isSelected ? null : item.category)}
              >
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: item.color || colorScale(item.category) }}
                  />
                  <span className="text-sm font-medium">{item.category}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {item.value} ({percentage}%)
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};