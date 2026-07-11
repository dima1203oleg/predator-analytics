/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PREDATOR — KPI Floating Panels (3D)
 * 
 * Інтерактивні KPI панелі в 3D просторі.
 * При наведенні (hover) розгортаються, показуючи мікрографік та деталі.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import { useDataStore } from '../stores/dataStore';

// Спрощений мікро-графік (SVG)
const MicroChart: React.FC<{ trend: number }> = ({ trend }) => {
  const points = Array.from({ length: 10 }, (_, i) => {
    const y = 20 - (i * (trend > 0 ? 1.5 : -1.5)) + (Math.random() * 5 - 2.5);
    return `${i * 10},${Math.max(5, Math.min(35, y))}`;
  }).join(' ');

  const color = trend > 0 ? '#10b981' : '#ef4444'; // green / red

  return (
    <div className="h-10 w-full mt-2 border-t border-[#1a1f2e] pt-1">
      <svg viewBox="0 0 90 40" className="w-full h-full overflow-visible">
        <polyline 
          points={points} 
          fill="none" 
          stroke={color} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        {/* Glow */}
        <polyline 
          points={points} 
          fill="none" 
          stroke={color} 
          strokeWidth="6" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          opacity="0.2"
        />
      </svg>
    </div>
  );
};

export const KPIFloatingPanels: React.FC = () => {
    const kpiMetrics = useDataStore(s => s.kpiMetrics);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    if (kpiMetrics.length === 0) return null;

    return (
        <group position={[0, 8, 0]}>
            <Html center distanceFactor={15} zIndexRange={[50, 0]}>
                <div className="flex gap-6 select-none perspective-1000">
                    {kpiMetrics.slice(0, 4).map(metric => {
                        const isHovered = hoveredId === metric.id;
                        
                        return (
                            <div
                                key={metric.id}
                                onMouseEnter={() => setHoveredId(metric.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                className="bg-[#050608]/90 backdrop-blur-md border border-[#1a1f2e] rounded-sm px-5 py-3 min-w-[140px] transition-all duration-300 ease-out cursor-default overflow-hidden relative"
                                style={{
                                    transform: isHovered ? 'translateZ(20px) scale(1.1)' : 'translateZ(0px) scale(1)',
                                    borderColor: isHovered ? '#3b82f6' : '#1a1f2e',
                                    boxShadow: isHovered ? '0 10px 30px -10px rgba(59, 130, 246, 0.3)' : 'none',
                                    height: isHovered ? '110px' : '70px',
                                }}
                            >
                                <div className="text-[10px] text-[#6b7280] uppercase tracking-widest font-semibold mb-1">
                                    {metric.label}
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <div className="text-xl font-bold font-mono text-[#e5e7eb]">
                                        {metric.value.toLocaleString('uk-UA')}
                                    </div>
                                    <div className="text-xs text-[#6b7280]">{metric.unit}</div>
                                </div>
                                
                                {metric.trend !== 0 && (
                                    <div className={`absolute top-3 right-3 text-[10px] font-mono font-bold ${metric.trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {metric.trend > 0 ? '▲' : '▼'} {Math.abs(metric.trend)}%
                                    </div>
                                )}

                                {/* Hover Expansion (Chart) */}
                                <div className="transition-opacity duration-300" style={{ opacity: isHovered ? 1 : 0 }}>
                                    <MicroChart trend={metric.trend} />
                                </div>

                                {/* Animated Top Highlight */}
                                {isHovered && (
                                    <div className="absolute top-0 left-0 h-[2px] w-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </Html>
        </group>
    );
};
