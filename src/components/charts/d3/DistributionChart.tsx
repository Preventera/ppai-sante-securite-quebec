import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, ArrowUpDown, Filter } from 'lucide-react';

interface DistributionData {
  category: string;
  value: number;
  subValue?: number;
  color?: string;
  details?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

interface DistributionChartProps {
  data: DistributionData[];
  width?: number;
  height?: number;
  title?: string;
  orientation?: 'horizontal' | 'vertical';
  stacked?: boolean;
  sortBy?: 'value' | 'category' | 'none';
  showComparison?: boolean;
  className?: string;
}

export const DistributionChart: React.FC<DistributionChartProps> = ({
  data,
  width = 600,
  height = 400,
  title = "Distribution des Risques",
  orientation: orientationProp = 'vertical',
  stacked: stackedProp = false,
  sortBy = 'value',
  showComparison: showComparisonProp = false,
  className = ""
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);
  // Les options d'affichage sont pilotables depuis le graphique : les props
  // servent de valeur initiale, l'état local porte les changements de l'utilisateur.
  const [orientation, setOrientation] = useState(orientationProp);
  const [stacked, setStacked] = useState(stackedProp);
  const [showComparison, setShowComparison] = useState(showComparisonProp);

  const margin = { top: 20, right: 40, bottom: 60, left: 80 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Préparation des données
  const processedData = React.useMemo(() => {
    let sorted = [...data];
    
    if (sortBy === 'value') {
      sorted.sort((a, b) => sortOrder === 'desc' ? b.value - a.value : a.value - b.value);
    } else if (sortBy === 'category') {
      sorted.sort((a, b) => sortOrder === 'desc' ? 
        b.category.localeCompare(a.category) : a.category.localeCompare(b.category));
    }
    
    return sorted;
  }, [data, sortBy, sortOrder]);

  useEffect(() => {
    if (!svgRef.current || !processedData.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Échelles
    const xScale = orientation === 'vertical' 
      ? d3.scaleBand()
          .domain(processedData.map(d => d.category))
          .range([0, chartWidth])
          .padding(0.1)
      : d3.scaleLinear()
          .domain([0, d3.max(processedData, d => d.value) || 0])
          .range([0, chartWidth]);

    const yScale = orientation === 'vertical'
      ? d3.scaleLinear()
          .domain([0, d3.max(processedData, d => d.value) || 0])
          .range([chartHeight, 0])
      : d3.scaleBand()
          .domain(processedData.map(d => d.category))
          .range([0, chartHeight])
          .padding(0.1);

    // Couleurs
    const colorScale = d3.scaleOrdinal<string>()
      .domain(processedData.map(d => d.category))
      .range(['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899']);

    // Axes
    if (orientation === 'vertical') {
      g.append('g')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(d3.axisBottom(xScale as d3.ScaleBand<string>))
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(-45)');

      g.append('g')
        .call(d3.axisLeft(yScale as d3.ScaleLinear<number, number>));
    } else {
      g.append('g')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(d3.axisBottom(xScale as d3.ScaleLinear<number, number>));

      g.append('g')
        .call(d3.axisLeft(yScale as d3.ScaleBand<string>));
    }

    // Grille
    const gridLines = g.append('g').attr('class', 'grid');

    if (orientation === 'vertical') {
      gridLines.selectAll('.grid-line')
        .data((yScale as d3.ScaleLinear<number, number>).ticks())
        .enter()
        .append('line')
        .attr('class', 'grid-line')
        .attr('x1', 0)
        .attr('x2', chartWidth)
        .attr('y1', d => (yScale as d3.ScaleLinear<number, number>)(d))
        .attr('y2', d => (yScale as d3.ScaleLinear<number, number>)(d))
        .attr('stroke', '#E5E7EB')
        .attr('stroke-dasharray', '3,3')
        .attr('opacity', 0.5);
    } else {
      gridLines.selectAll('.grid-line')
        .data((xScale as d3.ScaleLinear<number, number>).ticks())
        .enter()
        .append('line')
        .attr('class', 'grid-line')
        .attr('x1', d => (xScale as d3.ScaleLinear<number, number>)(d))
        .attr('x2', d => (xScale as d3.ScaleLinear<number, number>)(d))
        .attr('y1', 0)
        .attr('y2', chartHeight)
        .attr('stroke', '#E5E7EB')
        .attr('stroke-dasharray', '3,3')
        .attr('opacity', 0.5);
    }

    // Barres principales
    const bars = g.selectAll('.bar')
      .data(processedData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('fill', d => d.color || colorScale(d.category))
      .style('cursor', 'pointer')
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))')
      .on('mouseover', function(event, d) {
        setHoveredBar(d.category);
        
        d3.select(this)
          .transition()
          .duration(200)
          .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))')
          .attr('opacity', 0.8);

        // Afficher tooltip
        const tooltip = d3.select('body').append('div')
          .attr('class', 'chart-tooltip')
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
          <strong>${d.category}</strong><br/>
          Valeur: ${d.value}
          ${d.subValue ? `<br/>Secondaire: ${d.subValue}` : ''}
          ${d.details ? `<br/>Critique: ${d.details.critical}` : ''}
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
      })
      .on('mousemove', function(event) {
        d3.select('.chart-tooltip')
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function(event, d) {
        setHoveredBar(null);
        
        d3.select(this)
          .transition()
          .duration(200)
          .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))')
          .attr('opacity', 1);

        d3.select('.chart-tooltip').remove();
      });

    // Positionnement et animation des barres
    if (orientation === 'vertical') {
      bars
        .attr('x', d => (xScale as d3.ScaleBand<string>)(d.category)!)
        .attr('width', (xScale as d3.ScaleBand<string>).bandwidth())
        .attr('y', chartHeight)
        .attr('height', 0)
        .transition()
        .duration(800)
        .delay((_, i) => i * 100)
        .attr('y', d => (yScale as d3.ScaleLinear<number, number>)(d.value))
        .attr('height', d => chartHeight - (yScale as d3.ScaleLinear<number, number>)(d.value));
    } else {
      bars
        .attr('y', d => (yScale as d3.ScaleBand<string>)(d.category)!)
        .attr('height', (yScale as d3.ScaleBand<string>).bandwidth())
        .attr('x', 0)
        .attr('width', 0)
        .transition()
        .duration(800)
        .delay((_, i) => i * 100)
        .attr('width', d => (xScale as d3.ScaleLinear<number, number>)(d.value));
    }

    // Barres de comparaison (si activées)
    if (showComparison && processedData.some(d => d.subValue !== undefined)) {
      const comparisonBars = g.selectAll('.comparison-bar')
        .data(processedData.filter(d => d.subValue !== undefined))
        .enter()
        .append('rect')
        .attr('class', 'comparison-bar')
        .attr('fill', 'rgba(156, 163, 175, 0.6)')
        .attr('stroke', '#9CA3AF')
        .attr('stroke-width', 1);

      if (orientation === 'vertical') {
        comparisonBars
          .attr('x', d => (xScale as d3.ScaleBand<string>)(d.category)! + (xScale as d3.ScaleBand<string>).bandwidth() * 0.1)
          .attr('width', (xScale as d3.ScaleBand<string>).bandwidth() * 0.8)
          .attr('y', chartHeight)
          .attr('height', 0)
          .transition()
          .duration(1000)
          .delay((_, i) => i * 100 + 400)
          .attr('y', d => (yScale as d3.ScaleLinear<number, number>)(d.subValue!))
          .attr('height', d => chartHeight - (yScale as d3.ScaleLinear<number, number>)(d.subValue!));
      } else {
        comparisonBars
          .attr('y', d => (yScale as d3.ScaleBand<string>)(d.category)! + (yScale as d3.ScaleBand<string>).bandwidth() * 0.1)
          .attr('height', (yScale as d3.ScaleBand<string>).bandwidth() * 0.8)
          .attr('x', 0)
          .attr('width', 0)
          .transition()
          .duration(1000)
          .delay((_, i) => i * 100 + 400)
          .attr('width', d => (xScale as d3.ScaleLinear<number, number>)(d.subValue!));
      }
    }

    // Labels de valeurs
    const valueLabels = g.selectAll('.value-label')
      .data(processedData)
      .enter()
      .append('text')
      .attr('class', 'value-label')
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#374151')
      .style('opacity', 0);

    if (orientation === 'vertical') {
      valueLabels
        .attr('x', d => (xScale as d3.ScaleBand<string>)(d.category)! + (xScale as d3.ScaleBand<string>).bandwidth() / 2)
        .attr('y', d => (yScale as d3.ScaleLinear<number, number>)(d.value) - 5)
        .text(d => d.value)
        .transition()
        .delay(1200)
        .duration(500)
        .style('opacity', 1);
    } else {
      valueLabels
        .attr('x', d => (xScale as d3.ScaleLinear<number, number>)(d.value) + 5)
        .attr('y', d => (yScale as d3.ScaleBand<string>)(d.category)! + (yScale as d3.ScaleBand<string>).bandwidth() / 2)
        .attr('dy', '0.35em')
        .text(d => d.value)
        .transition()
        .delay(1200)
        .duration(500)
        .style('opacity', 1);
    }

    // Barres empilées pour les détails (si données disponibles)
    if (stacked && processedData.some(d => d.details)) {
      const stackedData = processedData.filter(d => d.details);
      const stackKeys = ['critical', 'high', 'medium', 'low'];
      const stackColors = ['#7C2D12', '#EF4444', '#F59E0B', '#10B981'];

      stackedData.forEach((d, index) => {
        if (!d.details) return;

        let yOffset = 0;
        stackKeys.forEach((key, keyIndex) => {
          const value = d.details![key as keyof typeof d.details];
          if (value > 0) {
            const stackBar = g.append('rect')
              .attr('class', `stack-${key}`)
              .attr('fill', stackColors[keyIndex])
              .attr('stroke', 'white')
              .attr('stroke-width', 1);

            if (orientation === 'vertical') {
              const barHeight = (value / d.value) * (chartHeight - (yScale as d3.ScaleLinear<number, number>)(d.value));
              stackBar
                .attr('x', (xScale as d3.ScaleBand<string>)(d.category)!)
                .attr('width', (xScale as d3.ScaleBand<string>).bandwidth())
                .attr('y', chartHeight - yOffset)
                .attr('height', 0)
                .transition()
                .duration(600)
                .delay(1500 + keyIndex * 100)
                .attr('y', chartHeight - yOffset - barHeight)
                .attr('height', barHeight);

              yOffset += barHeight;
            } else {
              const barWidth = (value / d.value) * (xScale as d3.ScaleLinear<number, number>)(d.value);
              stackBar
                .attr('y', (yScale as d3.ScaleBand<string>)(d.category)!)
                .attr('height', (yScale as d3.ScaleBand<string>).bandwidth())
                .attr('x', yOffset)
                .attr('width', 0)
                .transition()
                .duration(600)
                .delay(1500 + keyIndex * 100)
                .attr('width', barWidth);

              yOffset += barWidth;
            }
          }
        });
      });

      // Légende pour les barres empilées
      const stackLegend = g.append('g')
        .attr('class', 'stack-legend')
        .attr('transform', `translate(${chartWidth - 100}, 20)`);

      stackKeys.forEach((key, index) => {
        const legendItem = stackLegend.append('g')
          .attr('transform', `translate(0, ${index * 18})`);

        legendItem.append('rect')
          .attr('width', 12)
          .attr('height', 12)
          .attr('fill', stackColors[index]);

        legendItem.append('text')
          .attr('x', 16)
          .attr('y', 6)
          .attr('dy', '0.35em')
          .style('font-size', '11px')
          .style('fill', '#374151')
          .text(key.charAt(0).toUpperCase() + key.slice(1));
      });
    }

    // Ligne de moyenne
    const average = d3.mean(processedData, d => d.value) || 0;
    const averageLine = g.append('line')
      .attr('class', 'average-line')
      .attr('stroke', '#DC2626')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .style('opacity', 0);

    if (orientation === 'vertical') {
      averageLine
        .attr('x1', 0)
        .attr('x2', chartWidth)
        .attr('y1', (yScale as d3.ScaleLinear<number, number>)(average))
        .attr('y2', (yScale as d3.ScaleLinear<number, number>)(average));
    } else {
      averageLine
        .attr('x1', (xScale as d3.ScaleLinear<number, number>)(average))
        .attr('x2', (xScale as d3.ScaleLinear<number, number>)(average))
        .attr('y1', 0)
        .attr('y2', chartHeight);
    }

    averageLine
      .transition()
      .delay(2000)
      .duration(500)
      .style('opacity', 0.7);

    // Label de la moyenne
    g.append('text')
      .attr('class', 'average-label')
      .style('font-size', '11px')
      .style('fill', '#DC2626')
      .style('font-weight', 'bold')
      .style('opacity', 0)
      .text(`Moyenne: ${average.toFixed(1)}`)
      .attr('x', orientation === 'vertical' ? chartWidth - 80 : (xScale as d3.ScaleLinear<number, number>)(average) + 5)
      .attr('y', orientation === 'vertical' ? (yScale as d3.ScaleLinear<number, number>)(average) - 5 : 15)
      .transition()
      .delay(2200)
      .duration(500)
      .style('opacity', 1);

  }, [processedData, width, height, orientation, stacked, showComparison, hoveredBar]);

  const toggleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
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
      downloadLink.download = 'graphique-distribution.png';
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Calcul des statistiques
  const total = processedData.reduce((sum, item) => sum + item.value, 0);
  const average = total / processedData.length;
  const maxValue = Math.max(...processedData.map(d => d.value));
  const minValue = Math.min(...processedData.map(d => d.value));

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {title}
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Select value={sortBy} onValueChange={(value: any) => setSortOrder(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="value">Par valeur</SelectItem>
              <SelectItem value="category">Par nom</SelectItem>
              <SelectItem value="none">Aucun tri</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSort}
            className="h-8 w-8 p-0"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportAsImage}
            className="h-8 w-8 p-0"
          >
            <Filter className="h-4 w-4" />
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
        <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-gray-900">{total}</div>
            <div className="text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900">{average.toFixed(1)}</div>
            <div className="text-gray-500">Moyenne</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900">{maxValue}</div>
            <div className="text-gray-500">Maximum</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900">{minValue}</div>
            <div className="text-gray-500">Minimum</div>
          </div>
        </div>

        {/* Options d'affichage */}
        <div className="mt-4 flex items-center space-x-4 text-sm">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={stacked}
              onChange={(e) => setStacked(e.target.checked)}
              className="rounded"
            />
            <span>Mode empilé</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showComparison}
              onChange={(e) => setShowComparison(e.target.checked)}
              className="rounded"
            />
            <span>Comparaison</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="orientation"
              checked={orientation === 'vertical'}
              onChange={() => setOrientation('vertical')}
              className="rounded"
            />
            <span>Vertical</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="orientation"
              checked={orientation === 'horizontal'}
              onChange={() => setOrientation('horizontal')}
              className="rounded"
            />
            <span>Horizontal</span>
          </label>
        </div>

        {/* Légende des couleurs */}
        <div className="mt-4 space-y-2">
          <div className="text-sm font-medium text-gray-700">Catégories:</div>
          <div className="flex flex-wrap gap-3">
            {processedData.map((item, index) => (
              <div key={item.category} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ 
                    backgroundColor: item.color || d3.scaleOrdinal<string>()
                      .domain(processedData.map(d => d.category))
                      .range(['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'])(item.category)
                  }}
                />
                <span className="text-xs text-gray-600">{item.category}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};// Copiez le contenu de l'artifact 'DistributionChart.tsx'
