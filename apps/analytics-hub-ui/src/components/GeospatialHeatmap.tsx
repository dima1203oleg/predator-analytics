import React, { useMemo, useState } from 'react';
import { geoEquirectangular, geoPath } from 'd3-geo';
import worldGeoData from '../world.geo.json';

interface HeatmapPoint {
  id: string;
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
  intensity: number; // 0 to 100
  type: 'CRITICAL' | 'HIGH' | 'LOW';
  category?: string;
}

interface GeospatialHeatmapProps {
  points: HeatmapPoint[];
  width?: number;
  height?: number;
  showD3Hotspots?: boolean;
}

export default function GeospatialHeatmap({ points, width = 800, height = 400, showD3Hotspots = true }: GeospatialHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number; density: number; type: string } | null>(null);

  const projection = useMemo(() => {
    return geoEquirectangular()
      .scale(120)
      .translate([width / 2, height / 2]);
  }, [width, height]);

  const pathGenerator = useMemo(() => geoPath().projection(projection), [projection]);

  // Compute D3-driven grid-based threat hotspots density using a Gaussian kernel
  const gridCells = useMemo(() => {
    if (!showD3Hotspots || points.length === 0) return [];

    const cells = [];
    const stepX = 14; // Grid cell size
    const stepY = 14;
    const sigma = 40; // Area of influence
    const sigmaSq2 = 2 * sigma * sigma;

    // Pre-project points to screen coordinates
    const projectedPoints = points.map(p => {
      const coords = projection(p.coordinates);
      return coords ? { x: coords[0], y: coords[1], intensity: p.intensity, type: p.type } : null;
    }).filter(Boolean) as { x: number; y: number; intensity: number; type: string }[];

    const cols = Math.ceil(width / stepX);
    const rows = Math.ceil(height / stepY);

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const cx = c * stepX + stepX / 2;
        const cy = r * stepY + stepY / 2;

        let totalDensity = 0;
        let dominantType = 'LOW';
        let maxPointContribution = 0;

        for (const p of projectedPoints) {
          const dx = cx - p.x;
          const dy = cy - p.y;
          const distSq = dx * dx + dy * dy;
          const contribution = p.intensity * Math.exp(-distSq / sigmaSq2);

          totalDensity += contribution;
          if (contribution > maxPointContribution) {
            maxPointContribution = contribution;
            dominantType = p.type;
          }
        }

        // Only draw cells with noticeable risk contribution
        if (totalDensity > 2.0) {
          cells.push({
            id: `grid-${c}-${r}`,
            x: c * stepX,
            y: r * stepY,
            width: stepX,
            height: stepY,
            density: Math.min(100, Math.round(totalDensity)),
            type: dominantType
          });
        }
      }
    }
    return cells;
  }, [points, projection, width, height, showD3Hotspots]);

  return (
    <div className="w-full h-full relative overflow-hidden" style={{ aspectRatio: `${width}/${height}` }}>
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-full absolute inset-0 z-0"
        style={{ backgroundColor: 'transparent' }}
      >
        <defs>
          <radialGradient id="heat-glow-critical" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
            <stop offset="30%" stopColor="#f43f5e" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="heat-glow-high" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.7" />
            <stop offset="30%" stopColor="#f59e0b" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="heat-glow-low" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
            <stop offset="30%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </radialGradient>
          <filter id="blur-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g className="map-features opacity-30">
          {(worldGeoData as any).features.map((feature: any, i: number) => (
            <path
              key={`path-${i}`}
              d={pathGenerator(feature) || ''}
              fill="#1e293b"
              stroke="#334155"
              strokeWidth={0.5}
            />
          ))}
        </g>

        {/* D3-Driven Grid Heatmap Layer */}
        {showD3Hotspots && (
          <g className="d3-heatmap-grid opacity-60">
            {gridCells.map((cell) => {
              const color = 
                cell.type === 'CRITICAL' ? '#f43f5e' : 
                cell.type === 'HIGH' ? '#f59e0b' : '#10b981';
              return (
                <rect
                  key={cell.id}
                  x={cell.x}
                  y={cell.y}
                  width={cell.width - 1}
                  height={cell.height - 1}
                  fill={color}
                  opacity={(cell.density / 100) * 0.5}
                  className="transition-all duration-200 hover:opacity-90 cursor-crosshair"
                  onMouseEnter={() => setHoveredCell(cell)}
                  onMouseLeave={() => setHoveredCell(null)}
                />
              );
            })}
          </g>
        )}
        
        <g className="heatmap-points">
          {points.map((point) => {
            const [x, y] = projection(point.coordinates) || [0, 0];
            if (x === 0 && y === 0) return null;
            
            const radius = Math.max(8, (point.intensity / 100) * 24);
            const gradientId = 
              point.type === 'CRITICAL' ? 'url(#heat-glow-critical)' : 
              point.type === 'HIGH' ? 'url(#heat-glow-high)' : 'url(#heat-glow-low)';

            return (
              <g key={point.id} transform={`translate(${x}, ${y})`} className="group cursor-pointer">
                {/* Heat glow */}
                <circle
                  r={radius * 1.5}
                  fill={gradientId}
                  className="animate-pulse"
                  style={{ animationDuration: `${2 + Math.random()}s` }}
                />
                {/* Core point */}
                <circle
                  r={radius * 0.3}
                  fill={
                    point.type === 'CRITICAL' ? '#f43f5e' :
                    point.type === 'HIGH' ? '#f59e0b' : '#10b981'
                  }
                  filter="url(#blur-glow)"
                />
                
                {/* Hover Info */}
                <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <rect x={12} y={-16} width={120} height={32} fill="rgba(15, 23, 42, 0.9)" rx={4} stroke="rgba(59, 130, 246, 0.3)" />
                  <text x={18} y={-4} fill="#f1f5f9" fontSize={8} fontFamily="monospace" fontWeight="bold">
                    {point.name}
                  </text>
                  <text x={18} y={8} fill={
                    point.type === 'CRITICAL' ? '#f43f5e' :
                    point.type === 'HIGH' ? '#f59e0b' : '#10b981'
                  } fontSize={7} fontFamily="monospace">
                    {point.type} RISK - {point.intensity}%
                  </text>
                </g>
              </g>
            );
          })}
        </g>

        {/* Interactive Hotspot Tooltip */}
        {hoveredCell && (
          <g transform={`translate(${Math.min(width - 135, hoveredCell.x + 18)}, ${Math.min(height - 45, hoveredCell.y - 10)})`} className="pointer-events-none z-20">
            <rect
              width={125}
              height={38}
              fill="rgba(8, 13, 28, 0.95)"
              stroke="rgba(59, 130, 246, 0.4)"
              strokeWidth={1}
              rx={6}
            />
            <text x={8} y={12} fill="#94a3b8" fontSize={7} fontFamily="monospace" fontWeight="bold" letterSpacing="0.05em">
              ШТ КАРТА ЗАГРОЗ
            </text>
            <text x={8} y={22} fill="#f8fafc" fontSize={9} fontFamily="monospace" fontWeight="bold">
              Рівень ризику: {hoveredCell.density}%
            </text>
            <text x={8} y={30} fill={
              hoveredCell.type === 'CRITICAL' ? '#f43f5e' :
              hoveredCell.type === 'HIGH' ? '#f59e0b' : '#10b981'
            } fontSize={7} fontFamily="monospace" fontWeight="bold">
              КЛАС: {hoveredCell.type} RISK
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
