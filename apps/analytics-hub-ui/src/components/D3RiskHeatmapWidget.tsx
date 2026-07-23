import React, { useMemo, useState } from 'react';
import { scaleLinear } from 'd3-scale';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, ShieldAlert, Award, TrendingUp, HelpCircle, 
  ChevronRight, Users, Eye, Zap, AlertTriangle
} from 'lucide-react';
import { OsintEntity } from '../osintData';

interface D3RiskHeatmapWidgetProps {
  entities: OsintEntity[];
  onSelectEntity: (id: string) => void;
  onSelectTab: (tabId: string) => void;
}

export default function D3RiskHeatmapWidget({ entities, onSelectEntity, onSelectTab }: D3RiskHeatmapWidgetProps) {
  const [selectedType, setSelectedType] = useState<'all' | 'company' | 'person' | 'cryptowallet'>('all');
  const [hoveredCell, setHoveredCell] = useState<{
    xRange: [number, number];
    yRange: [number, number];
    entities: OsintEntity[];
    density: number;
    avgRisk: number;
    xIndex: number;
    yIndex: number;
  } | null>(null);

  // Filter entities
  const filteredList = useMemo(() => {
    return entities.filter(e => {
      if (selectedType === 'all') return true;
      return e.type === selectedType;
    });
  }, [entities, selectedType]);

  // Dimensions of our heatgrid (e.g., 5x5 Matrix)
  // X-axis: Connections count (0 to 5+)
  // Y-axis: Risk Score (0 to 100)
  const gridRows = 5; // Risk levels: 0-20, 20-40, 40-60, 60-80, 80-100
  const gridCols = 5; // Connectivity groups: 0, 1, 2, 3, 4+

  // D3 Scales for positioning/mapping
  const xScale = useMemo(() => {
    return scaleLinear()
      .domain([0, gridCols])
      .range([0, 100]); // percentage width
  }, [gridCols]);

  const yScale = useMemo(() => {
    return scaleLinear()
      .domain([0, gridRows])
      .range([100, 0]); // percentage height (inverted)
  }, [gridRows]);

  // Calculate grid cell values
  const cells = useMemo(() => {
    const matrix = Array.from({ length: gridRows }, (_, r) => 
      Array.from({ length: gridCols }, (_, c) => {
        const yMin = r * 20;
        const yMax = (r + 1) * 20;
        const xMin = c;
        const xMax = c + 1;

        // Find entities that belong in this row/col cell
        const cellEntities = filteredList.filter(e => {
          const risk = e.riskScore;
          const conns = e.relationships?.length || 0;
          
          const matchesRisk = risk >= yMin && (r === gridRows - 1 ? risk <= yMax : risk < yMax);
          const matchesConns = c === gridCols - 1 ? conns >= c : conns === c;
          
          return matchesRisk && matchesConns;
        });

        const totalRisk = cellEntities.reduce((sum, e) => sum + e.riskScore, 0);
        const avgRisk = cellEntities.length > 0 ? Math.round(totalRisk / cellEntities.length) : 0;

        return {
          rIndex: r,
          cIndex: c,
          yRange: [yMin, yMax] as [number, number],
          xRange: [xMin, c === gridCols - 1 ? 10 : xMax] as [number, number],
          entities: cellEntities,
          density: cellEntities.length,
          avgRisk
        };
      })
    );
    return matrix.flat();
  }, [filteredList, gridRows, gridCols]);

  // Maximum density for scaling color opacity
  const maxDensity = useMemo(() => {
    return Math.max(...cells.map(c => c.density), 1);
  }, [cells]);

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl shadow-[0_4px_40px_rgba(30,58,138,0.15)] backdrop-blur-md p-2 relative overflow-hidden" id="d3-risk-heatmap-widget">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-2 relative z-10">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-rose-500 animate-pulse" />
          <div>
            <h4 className="text-xs font-bold uppercase text-slate-200 tracking-wider font-mono">
              D3 Кластеризація Загроз & Теплокарта Ризиків
            </h4>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Аналітична матриця: Кількість зв'язків (X-axis) проти Рівня загрози (Y-axis)
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-2xl border border-slate-800/60">
          {(['all', 'company', 'person', 'cryptowallet'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-2.5 py-1 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                selectedType === type 
                  ? 'bg-blue-600/20 text-blue-400 border border-slate-800 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {type === 'all' ? 'Всі' : type === 'company' ? 'Юрособи' : type === 'person' ? 'Особи' : 'Крипто'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 pt-4 relative z-10">
        {/* The Matrix Canvas */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="relative flex-1 bg-slate-950/40 border border-slate-800 rounded-2xl p-2 min-h-[300px] flex">
            
            {/* Y Axis Labels (Risk score) */}
            <div className="flex flex-col justify-between text-xs font-mono text-slate-500 select-none pr-3 w-16 border-r border-slate-800">
              <span className="text-rose-500/90 font-bold">80-100% КРИТ</span>
              <span className="text-rose-400/80">60-80% ВИСОК</span>
              <span className="text-amber-400/80">40-60% СЕРЕД</span>
              <span className="text-emerald-400/80">20-40% ПОМIР</span>
              <span className="text-slate-500">0-20% НИЗЬК</span>
            </div>

            {/* Grid Map Area */}
            <div className="flex-1 grid grid-cols-5 gap-1.5 relative p-1">
              {/* Plot grid cells */}
              {cells.map((cell, idx) => {
                const isHovered = hoveredCell?.xIndex === cell.cIndex && hoveredCell?.yIndex === cell.rIndex;
                const densityPercent = cell.density / maxDensity;
                
                // Color determined by risk category and density
                let cellColor = 'bg-slate-900/10 border-slate-800';
                let activeBorder = 'hover:border-slate-800';

                if (cell.density > 0) {
                  if (cell.yRange[0] >= 80) {
                    cellColor = 'bg-rose-500/30 text-rose-400 border-slate-800';
                    activeBorder = 'hover:border-rose-400';
                  } else if (cell.yRange[0] >= 40) {
                    cellColor = 'bg-amber-500/20 text-amber-400 border-slate-800';
                    activeBorder = 'hover:border-amber-400';
                  } else {
                    cellColor = 'bg-emerald-500/20 text-emerald-400 border-slate-800';
                    activeBorder = 'hover:border-emerald-400';
                  }
                }

                return (
                  <motion.div
                    key={`cell-${cell.rIndex}-${cell.cIndex}`}
                    className={`relative rounded-2xl p-2 border flex flex-col justify-between transition-all duration-300 cursor-crosshair min-h-[50px] ${cellColor} ${activeBorder} ${
                      isHovered ? 'scale-102 ring-1 ring-blue-400/50 z-10' : ''
                    }`}
                    onMouseEnter={() => setHoveredCell({
                      xRange: cell.xRange,
                      yRange: cell.yRange,
                      entities: cell.entities,
                      density: cell.density,
                      avgRisk: cell.avgRisk,
                      xIndex: cell.cIndex,
                      yIndex: cell.rIndex
                    })}
                    onMouseLeave={() => setHoveredCell(null)}
                    layoutId={`cell-${cell.rIndex}-${cell.cIndex}`}
                  >
                    {/* Background density overlay */}
                    {cell.density > 0 && (
                      <div 
                        className="absolute inset-0 rounded-2xl opacity-40 mix-blend-color-dodge transition-opacity duration-300 pointer-events-none"
                        style={{
                          background: `radial-gradient(circle, ${
                            cell.yRange[0] >= 80 ? '#ef4444' : cell.yRange[0] >= 40 ? '#f59e0b' : '#10b981'
                          } 0%, transparent 80%)`,
                          opacity: 0.2 + densityPercent * 0.5
                        }}
                      />
                    )}

                    {/* Cell Density indicator */}
                    <div className="flex justify-between items-start z-10">
                      <span className="text-[7.5px] font-mono text-slate-500 uppercase tracking-tight">
                        [{cell.cIndex},{cell.rIndex}]
                      </span>
                      {cell.density > 0 && (
                        <span className="px-2 py-1 rounded bg-slate-950/80 border border-slate-800 text-xs font-bold font-mono text-slate-200">
                          {cell.density}
                        </span>
                      )}
                    </div>

                    {/* Miniature dots representing entities */}
                    <div className="flex flex-wrap gap-1 mt-1 z-10 max-h-[16px] overflow-hidden">
                      {cell.entities.slice(0, 4).map((ent) => (
                        <span 
                          key={ent.id} 
                          className={`w-1.5 h-1.5 rounded-full ${
                            ent.riskScore >= 80 ? 'bg-rose-500' : ent.riskScore >= 50 ? 'bg-amber-400' : 'bg-emerald-400'
                          }`}
                          title={ent.name}
                        />
                      ))}
                      {cell.entities.length > 4 && (
                        <span className="text-xs text-slate-400 font-mono">+{cell.entities.length - 4}</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* X Axis Labels */}
          <div className="flex justify-between text-xs font-mono text-slate-500 border-t border-slate-800 pt-2 ml-20 select-none">
            <span>0 зв'язків</span>
            <span>1 зв'язок</span>
            <span>2 зв'язки</span>
            <span>3 зв'язки</span>
            <span>4+ зв'язків</span>
          </div>
        </div>

        {/* Dynamic Detail Card Panels */}
        <div className="lg:col-span-4 bg-slate-950/30 border border-slate-800 rounded-2xl p-2 flex flex-col justify-between min-h-[300px]">
          <div className="space-y-3">
            <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-wider block border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
              Аналітична вибірка за кластером
            </span>

            <AnimatePresence mode="wait">
              {hoveredCell && hoveredCell.density > 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-3"
                  key={`${hoveredCell.xIndex}-${hoveredCell.yIndex}`}
                >
                  <div className="bg-slate-900/60 border border-slate-800 p-2 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-400">Ранг загрози:</span>
                      <span className="text-slate-200 font-bold">{hoveredCell.yRange[0]} - {hoveredCell.yRange[1]}%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-400">Ступінь зв'язків:</span>
                      <span className="text-slate-200 font-bold">{hoveredCell.xRange[0]} {hoveredCell.xRange[1] === 10 ? 'або більше' : `до ${hoveredCell.xRange[1]}`}</span>
                    </div>
                    <div className="border-t border-slate-800/60 my-1"></div>
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-400">Середній ризик:</span>
                      <span className={`font-bold ${
                        hoveredCell.avgRisk >= 80 ? 'text-rose-400' : hoveredCell.avgRisk >= 50 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>{hoveredCell.avgRisk}%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                    <p className="text-xs text-slate-500 font-mono uppercase tracking-widest px-1">Об'єкти у кластері:</p>
                    {hoveredCell.entities.map((ent) => (
                      <div
                        key={ent.id}
                        onClick={() => {
                          onSelectEntity(ent.id);
                          onSelectTab('volumes');
                        }}
                        className="bg-slate-950/80 hover:bg-slate-900/80 border border-slate-800 rounded-2xl p-2 flex items-center justify-between text-xs cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            ent.riskScore >= 80 ? 'bg-rose-500' : ent.riskScore >= 50 ? 'bg-amber-400' : 'bg-emerald-400'
                          }`} />
                          <span className="text-slate-300 font-mono truncate">{ent.name}</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-slate-600" />
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 text-slate-500 font-mono text-xs space-y-2"
                >
                  <Activity className="w-8 h-8 text-slate-700 mx-auto animate-pulse" />
                  <p>Наведіть курсор на заповнені зони теплокарти, щоб переглянути детальний розріз та склад ризиків.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="text-xs text-slate-500 font-mono border-t border-slate-800 pt-2 mt-2">
            Загальна загроза: <span className="text-slate-300 font-bold">{filteredList.length} об'єктів</span> з середнім показником <span className="text-slate-300 font-bold">{Math.round(filteredList.reduce((acc, x) => acc + x.riskScore, 0) / (filteredList.length || 1))}%</span>.
          </div>
        </div>
      </div>
    </div>
  );
}
