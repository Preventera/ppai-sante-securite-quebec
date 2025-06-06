import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

// Types pour les données et les props
type DataPoint = number;
type AnimationSpeedOption = 250 | 750 | 1500;

interface D3TestComponentProps {
  initialData?: DataPoint[];
  title?: string;
  className?: string;
}

const D3TestComponent: React.FC<D3TestComponentProps> = ({
  initialData = [25, 30, 45, 60, 20, 65, 75],
  title = "Test du Composant D3.js",
  className = ""
}) => {
  // Références et états
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [data, setData] = useState<DataPoint[]>(initialData);
  
  // État pour les contrôles interactifs
  const [barColor, setBarColor] = useState<string>("#4f46e5");
  const [animationSpeed, setAnimationSpeed] = useState<AnimationSpeedOption>(750);

  useEffect(() => {
    if (!svgRef.current) return;

    // Sélectionner l'élément SVG
    const svg = d3.select(svgRef.current);
    
    // Définir les dimensions
    const width = 600;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Nettoyer le SVG avant de redessiner
    svg.selectAll("*").remove();
    
    // Créer un groupe pour contenir le graphique avec les marges
    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Échelles X et Y
    const x = d3.scaleBand()
      .domain(data.map((_, i) => i.toString()))
      .range([0, innerWidth])
      .padding(0.2);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(data) || 100])
      .nice()
      .range([innerHeight, 0]);
    
    // Ajouter l'axe X
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickFormat(i => `Item ${i}`))
      .selectAll("text")
      .attr("y", 10)
      .attr("x", 0)
      .attr("text-anchor", "middle");
    
    // Ajouter l'axe Y
    g.append("g")
      .call(d3.axisLeft(y));
    
    // Ajouter un titre à l'axe Y
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("x", -innerHeight / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .text("Valeur");
    
    // Ajouter un titre au graphique
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text(title);
    
    // Ajouter les barres avec animation
    g.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (_, i) => x(i.toString()) || 0)
      .attr("y", innerHeight)
      .attr("width", x.bandwidth())
      .attr("height", 0)
      .attr("fill", barColor)
      .transition()
      .duration(animationSpeed)
      .attr("y", d => y(d))
      .attr("height", d => innerHeight - y(d));
    
    // Ajouter les valeurs au-dessus des barres
    g.selectAll(".bar-label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "bar-label")
      .attr("x", (_, i) => (x(i.toString()) || 0) + x.bandwidth() / 2)
      .attr("y", d => y(d) - 5)
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .attr("opacity", 0)
      .text(d => d)
      .transition()
      .delay(animationSpeed)
      .duration(300)
      .attr("opacity", 1);
      
  }, [data, barColor, animationSpeed, title]);

  // Fonction pour générer de nouvelles données aléatoires
  const generateRandomData = (): void => {
    const newData: DataPoint[] = Array.from({ length: 7 }, () => Math.floor(Math.random() * 80) + 10);
    setData(newData);
  };

  // Gestionnaire de changement pour la vitesse d'animation
  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setAnimationSpeed(parseInt(e.target.value) as AnimationSpeedOption);
  };

  return (
    <div className={`flex flex-col items-center p-4 bg-white rounded-lg shadow-lg ${className}`}>
      <div className="w-full mb-4">
        <svg ref={svgRef} className="w-full max-w-3xl mx-auto" data-testid="d3-chart-svg"></svg>
      </div>
      
      <div className="w-full max-w-2xl space-y-4 mt-4">
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4 items-center">
          <button
            onClick={generateRandomData}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            data-testid="generate-data-button"
          >
            Générer de nouvelles données
          </button>
          
          <div className="flex items-center space-x-2">
            <label htmlFor="colorPicker" className="text-sm font-medium">
              Couleur des barres:
            </label>
            <input
              id="colorPicker"
              type="color"
              value={barColor}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBarColor(e.target.value)}
              className="h-8 w-14 border border-gray-300 rounded"
              data-testid="color-picker"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <label htmlFor="animationSpeed" className="text-sm font-medium">
              Vitesse d'animation:
            </label>
            <select
              id="animationSpeed"
              value={animationSpeed}
              onChange={handleSpeedChange}
              className="h-8 px-2 border border-gray-300 rounded"
              data-testid="animation-speed-select"
            >
              <option value="250">Rapide</option>
              <option value="750">Moyenne</option>
              <option value="1500">Lente</option>
            </select>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded border border-gray-200">
          <h3 className="text-sm font-medium mb-2">Données actuelles:</h3>
          <div className="flex flex-wrap gap-2" data-testid="data-display">
            {data.map((value, index) => (
              <div key={index} className="px-3 py-1 bg-indigo-100 rounded-full text-xs">
                Item {index}: {value}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default D3TestComponent;