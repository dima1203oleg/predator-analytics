/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { scaleLinear, scaleTime } from 'd3-scale';
import { line, area, curveMonotoneX } from 'd3-shape';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, Calendar, ShieldAlert, Award, AlertTriangle, 
  ChevronRight, Info, Eye, Sparkles, Filter, CheckCircle
} from 'lucide-react';
import { OsintEntity } from '../osintData';

interface D3HistoricalRiskTrendsWidgetProps {
  entities: OsintEntity[];
  onSelectEntity: (id: string) => void;
  onSelectTab: (tabId: string) => void;
}

interface DataPoint {
  date: Date;
  dateStr: string;
  comp1: number; // ТОВ 'СпецТехПостач'
  person1: number; // Коваленко Ігор Вікторович
  comp2: number; // ТОВ 'Арсенал Сек'юріті'
  wallet1: number; // BTC Wallet
}

interface IncidentEvent {
  date: Date;
  dateLabel: string;
  title: string;
  description: string;
  targetEntityId: string;
  entityName: string;
  riskImpact: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export default function D3HistoricalRiskTrendsWidget({ 
  entities, 
  onSelectEntity, 
  onSelectTab 
}: D3HistoricalRiskTrendsWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 260 });
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'suspicious'>('all');

  // Track active visible lines
  const [visibleEntities, setVisibleEntities] = useState({
    comp1: true,
    person1: true,
    comp2: true,
    wallet1: true
  });

  // Handle container resizing responsively
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setDimensions({
          width: Math.max(width, 300),
          height: 260
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Generate deterministic 30-day timeline data points ending at July 20, 2026
  const dataPoints = useMemo<DataPoint[]>(() => {
    const points: DataPoint[] = [];
    const endDate = new Date(2026, 6, 20); // July 20, 2026
    
    for (let i = 30; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(endDate.getDate() - i);
      
      const dayIndex = 30 - i; // 0 to 30
      
      // comp-1: ТОВ 'СпецТехПостач' (current: 94)
      // starts at 62, rises to 68, spikes at day 11 to 80, spikes at day 20 to 94.
      let comp1Val = 62 + (dayIndex * 0.3);
      if (dayIndex >= 11) comp1Val += 10; // July 1 Court Case
      if (dayIndex >= 20) comp1Val += 12; // July 10 Sanctions
      comp1Val = Math.min(Math.round(comp1Val + Math.sin(dayIndex) * 1.5), 94);

      // person-1: Коваленко Ігор Вікторович (current: 82)
      let person1Val = 70 + (dayIndex * 0.25);
      if (dayIndex >= 11) person1Val += 2;
      if (dayIndex >= 20) person1Val += 3;
      if (dayIndex >= 25) person1Val += 4; // July 15 SBU suspect alert
      person1Val = Math.min(Math.round(person1Val + Math.cos(dayIndex) * 1.0), 82);

      // wallet-1: BTC Wallet (current: 89)
      let wallet1Val = 58 + (dayIndex * 0.35);
      if (dayIndex >= 15) wallet1Val += 16; // July 5 Mixer Transaction
      wallet1Val = Math.min(Math.round(wallet1Val + Math.sin(dayIndex * 0.8) * 1.8), 89);

      // comp-2: ТОВ 'Арсенал Сек'юріті' (current: 45)
      const comp2Val = Math.round(41 + Math.sin(dayIndex * 0.5) * 4 + (dayIndex * 0.1));

      points.push({
        date: d,
        dateStr: d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' }),
        comp1: comp1Val,
        person1: person1Val,
        comp2: comp2Val,
        wallet1: wallet1Val,
      });
    }
    return points;
  }, []);

  // Filtered incidents timeline
  const incidents = useMemo<IncidentEvent[]>(() => [
    {
      date: new Date(2026, 6, 1), // Day 11 (July 1)
      dateLabel: '01.07.2026',
      title: 'Кримінальне провадження СБУ',
      description: 'ДКІБ СБУ ініціювало розслідування щодо постачання електроніки подвійного призначення компанією СпецТехПостач.',
      targetEntityId: 'comp-1',
      entityName: "ТОВ 'СпецТехПостач'",
      riskImpact: 'Ризик +10% (Кримінальний провадження)',
      severity: 'HIGH'
    },
    {
      date: new Date(2026, 6, 5), // Day 15 (July 5)
      dateLabel: '05.07.2026',
      title: 'Зв\'язок з транзитним міксером',
      description: 'Виявлено пряме виведення 5.1 BTC на транзитну адресу міксера Garantex з гаманця BTC Wallet.',
      targetEntityId: 'wallet-1',
      entityName: 'BTC Wallet (0x38ac...d831)',
      riskImpact: 'Ризик +16% (Exposure Index 95%)',
      severity: 'HIGH'
    },
    {
      date: new Date(2026, 6, 10), // Day 20 (July 10)
      dateLabel: '10.07.2026',
      title: 'Санкції РНБО України',
      description: 'Указ Президента №214/2026 ввів у дію блокуючі санкції проти ТОВ \'СпецТехПостач\' строком на 5 років.',
      targetEntityId: 'comp-1',
      entityName: "ТОВ 'СпецТехПостач'",
      riskImpact: 'Ризик +12% (Внесення до списку РНБО)',
      severity: 'CRITICAL'
    },
    {
      date: new Date(2026, 6, 15), // Day 25 (July 15)
      dateLabel: '15.07.2026',
      title: 'Офіційна підозра СБУ',
      description: 'Коваленку І.В. оголошено підозру за ст. 110-2 ККУ (фінансування дій, вчинених з метою зміни меж території України).',
      targetEntityId: 'person-1',
      entityName: 'Коваленко Ігор Вікторович',
      riskImpact: 'Ризик +4% (Державна зрада)',
      severity: 'CRITICAL'
    }
  ], []);

  // Filtered entities based on current active tabs
  const displayedEntitiesInfo = useMemo(() => {
    return [
      { id: 'comp-1', key: 'comp1' as const, name: "ТОВ 'СпецТехПостач'", currentRisk: 94, color: '#ef4444', hoverColor: '#f43f5e', type: 'Юрособа', status: 'SANCTIONED' },
      { id: 'wallet-1', key: 'wallet1' as const, name: "BTC Wallet (0x38ac...)", currentRisk: 89, color: '#c084fc', hoverColor: '#a855f7', type: 'Криптогаманець', status: 'SUSPICIOUS' },
      { id: 'person-1', key: 'person1' as const, name: "Коваленко Ігор В.", currentRisk: 82, color: '#f59e0b', hoverColor: '#fbbf24', type: 'Фізособа', status: 'SUSPICIOUS' },
      { id: 'comp-2', key: 'comp2' as const, name: "ТОВ 'Арсенал Сек\'юріті'", currentRisk: 45, color: '#10b981', hoverColor: '#34d399', type: 'Юрособа', status: 'ACTIVE' }
    ].filter(ent => {
      if (activeTab === 'critical') return ent.currentRisk >= 80;
      if (activeTab === 'suspicious') return ent.status === 'SUSPICIOUS';
      return true;
    });
  }, [activeTab]);

  // D3 Scales for Line Chart
  const padding = { top: 15, right: 20, bottom: 30, left: 35 };

  const xScale = useMemo(() => {
    return scaleTime()
      .domain([dataPoints[0].date, dataPoints[dataPoints.length - 1].date])
      .range([padding.left, dimensions.width - padding.right]);
  }, [dataPoints, dimensions.width, padding.left, padding.right]);

  const yScale = useMemo(() => {
    return scaleLinear()
      .domain([0, 100])
      .range([dimensions.height - padding.bottom, padding.top]);
  }, [dimensions.height, padding.top, padding.bottom]);

  // Generate lines path data
  const lineGenerator = (key: 'comp1' | 'person1' | 'comp2' | 'wallet1') => {
    const generator = line<DataPoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(d[key]))
      .curve(curveMonotoneX);
    return generator(dataPoints) || '';
  };

  // Generate areas path data
  const areaGenerator = (key: 'comp1' | 'person1' | 'comp2' | 'wallet1') => {
    const generator = area<DataPoint>()
      .x(d => xScale(d.date))
      .y0(yScale(0))
      .y1(d => yScale(d[key]))
      .curve(curveMonotoneX);
    return generator(dataPoints) || '';
  };

  // Handle cursor tracking on SVG
  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const svgNode = event.currentTarget;
    const rect = svgNode.getBoundingClientRect();
    const x = event.clientX - rect.left;

    if (x < padding.left || x > dimensions.width - padding.right) {
      setHoveredPoint(null);
      setHoverX(null);
      return;
    }

    // Find the closest data point based on Date domain mapping
    const dateAtX = xScale.invert(x);
    let closestPoint = dataPoints[0];
    let minDiff = Math.abs(closestPoint.date.getTime() - dateAtX.getTime());

    for (const point of dataPoints) {
      const diff = Math.abs(point.date.getTime() - dateAtX.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        closestPoint = point;
      }
    }

    setHoveredPoint(closestPoint);
    setHoverX(xScale(closestPoint.date));
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setHoverX(null);
  };

  const toggleEntityVisibility = (key: 'comp1' | 'person1' | 'comp2' | 'wallet1') => {
    setVisibleEntities(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl shadow-[0_4px_40px_rgba(30,58,138,0.15)] backdrop-blur-md p-2 relative overflow-hidden flex flex-col space-y-4" id="d3-historical-trends-widget">
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2 relative z-10">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <div>
            <h4 className="text-xs font-bold uppercase text-slate-200 tracking-wider font-mono flex items-center gap-1.5">
              D3.js Історична Динаміка Ризиків
              <span className="text-xs bg-blue-600/20 text-blue-400 border border-slate-800 px-2 py-1 rounded font-mono uppercase font-normal tracking-normal">
                30 днів
              </span>
            </h4>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Хронологічний тренд індексу загрози для активних суб'єктів у базі OSINT
            </p>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-2xl border border-slate-800/60">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'all' 
                ? 'bg-blue-600/20 text-blue-400 border border-slate-800 shadow-sm' 
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Всі
          </button>
          <button
            onClick={() => setActiveTab('critical')}
            className={`px-2.5 py-1 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'critical' 
                ? 'bg-red-500/20 text-red-400 border border-red-500/20 shadow-sm' 
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Критичні (80%+)
          </button>
          <button
            onClick={() => setActiveTab('suspicious')}
            className={`px-2.5 py-1 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'suspicious' 
                ? 'bg-amber-500/20 text-amber-400 border border-slate-800 shadow-sm' 
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Підозрілі
          </button>
        </div>
      </div>

      {/* Main Grid: Chart & Incident events log */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-2 relative z-10">
        
        {/* SVG Chart canvas */}
        <div className="xl:col-span-8 flex flex-col space-y-3">
          <div 
            ref={containerRef}
            className="relative bg-slate-950/40 border border-slate-800 rounded-2xl p-2 h-[260px] flex items-center justify-center select-none"
          >
            {/* Horizontal Y-Axis Guideline grid (0%, 20%, 40%, 60%, 80%, 100%) */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between" style={{ paddingBottom: padding.bottom, paddingTop: padding.top }}>
              {[100, 80, 60, 40, 20, 0].map((val) => (
                <div key={val} className="w-full flex items-center">
                  <span className="w-10 text-xs font-mono text-slate-600 text-right pr-2">
                    {val}%
                  </span>
                  <div className="flex-1 border-t border-slate-800 border-dashed" />
                </div>
              ))}
            </div>

            <svg 
              width={dimensions.width} 
              height={dimensions.height} 
              className="absolute inset-0 overflow-visible cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <defs>
                {/* Glow Filter */}
                <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>

                {/* Area Gradients */}
                <linearGradient id="gradient-comp1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="gradient-person1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="gradient-wallet1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c084fc" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#c084fc" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="gradient-comp2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Draw area overlays (only if line is visible) */}
              {visibleEntities.comp1 && activeTab !== 'suspicious' && (
                <path d={areaGenerator('comp1')} fill="url(#gradient-comp1)" className="transition-all duration-300 pointer-events-none" />
              )}
              {visibleEntities.wallet1 && (
                <path d={areaGenerator('wallet1')} fill="url(#gradient-wallet1)" className="transition-all duration-300 pointer-events-none" />
              )}
              {visibleEntities.person1 && (
                <path d={areaGenerator('person1')} fill="url(#gradient-person1)" className="transition-all duration-300 pointer-events-none" />
              )}
              {visibleEntities.comp2 && activeTab === 'all' && (
                <path d={areaGenerator('comp2')} fill="url(#gradient-comp2)" className="transition-all duration-300 pointer-events-none" />
              )}

              {/* Draw Incident Annotations on the X-axis */}
              {incidents.map((inc, i) => {
                const cx = xScale(inc.date);
                const cy = yScale(inc.severity === 'CRITICAL' ? 90 : 80);
                if (cx < padding.left || cx > dimensions.width - padding.right) return null;

                return (
                  <g key={`annotation-${i}`} className="group cursor-help">
                    <line 
                      x1={cx} 
                      y1={padding.top} 
                      x2={cx} 
                      y2={dimensions.height - padding.bottom} 
                      stroke={inc.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b'} 
                      strokeWidth={1} 
                      strokeDasharray="4,4" 
                      opacity={0.5} 
                    />
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r={5} 
                      fill={inc.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b'} 
                      stroke="#0f172a" 
                      strokeWidth={1.5} 
                    />
                    <polygon 
                      points={`${cx},${cy-10} ${cx-5},${cy-18} ${cx+5},${cy-18}`}
                      fill={inc.severity === 'CRITICAL' ? '#f43f5e' : '#f59e0b'}
                    />
                  </g>
                );
              })}

              {/* Draw trend lines with custom neon glow */}
              {visibleEntities.comp2 && activeTab === 'all' && (
                <path 
                  d={lineGenerator('comp2')} 
                  fill="none" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  strokeLinecap="round"
                  className="transition-all duration-300 pointer-events-none"
                />
              )}
              {visibleEntities.person1 && (
                <path 
                  d={lineGenerator('person1')} 
                  fill="none" 
                  stroke="#f59e0b" 
                  strokeWidth={2.5} 
                  strokeLinecap="round"
                  className="transition-all duration-300 pointer-events-none animate-[dash_2s_ease-in-out]"
                />
              )}
              {visibleEntities.wallet1 && (
                <path 
                  d={lineGenerator('wallet1')} 
                  fill="none" 
                  stroke="#c084fc" 
                  strokeWidth={3} 
                  strokeLinecap="round"
                  filter="url(#glow-filter)"
                  className="transition-all duration-300 pointer-events-none"
                />
              )}
              {visibleEntities.comp1 && activeTab !== 'suspicious' && (
                <path 
                  d={lineGenerator('comp1')} 
                  fill="none" 
                  stroke="#ef4444" 
                  strokeWidth={3} 
                  strokeLinecap="round"
                  filter="url(#glow-filter)"
                  className="transition-all duration-300 pointer-events-none"
                />
              )}

              {/* Hover guides & cursor vertical indicator */}
              {hoveredPoint && hoverX !== null && (
                <g className="pointer-events-none">
                  <line 
                    x1={hoverX} 
                    y1={padding.top} 
                    x2={hoverX} 
                    y2={dimensions.height - padding.bottom} 
                    stroke="#3b82f6" 
                    strokeWidth={1.5} 
                    opacity={0.7} 
                  />
                  {/* Intersection points on active lines */}
                  {visibleEntities.comp1 && activeTab !== 'suspicious' && (
                    <circle 
                      cx={hoverX} 
                      cy={yScale(hoveredPoint.comp1)} 
                      r={5} 
                      fill="#ef4444" 
                      stroke="#ffffff" 
                      strokeWidth={1.5} 
                    />
                  )}
                  {visibleEntities.wallet1 && (
                    <circle 
                      cx={hoverX} 
                      cy={yScale(hoveredPoint.wallet1)} 
                      r={5} 
                      fill="#c084fc" 
                      stroke="#ffffff" 
                      strokeWidth={1.5} 
                    />
                  )}
                  {visibleEntities.person1 && (
                    <circle 
                      cx={hoverX} 
                      cy={yScale(hoveredPoint.person1)} 
                      r={5} 
                      fill="#f59e0b" 
                      stroke="#ffffff" 
                      strokeWidth={1.5} 
                    />
                  )}
                  {visibleEntities.comp2 && activeTab === 'all' && (
                    <circle 
                      cx={hoverX} 
                      cy={yScale(hoveredPoint.comp2)} 
                      r={4} 
                      fill="#10b981" 
                      stroke="#ffffff" 
                      strokeWidth={1.5} 
                    />
                  )}
                </g>
              )}
            </svg>

            {/* X-axis labels (rendered cleanly using HTML so they match our font rules perfectly) */}
            <div className="absolute bottom-0 inset-x-0 flex justify-between px-3 select-none text-xs font-mono text-slate-500" style={{ paddingLeft: padding.left + 5, paddingRight: padding.right + 5, height: padding.bottom }}>
              <span>20.06 (Початок)</span>
              <span>25.06</span>
              <span>30.06</span>
              <span>05.07</span>
              <span>10.07</span>
              <span>15.07</span>
              <span className="text-blue-400 font-bold">20.07 (Сьогодні)</span>
            </div>

            {/* Custom Interactive Tooltip overlay */}
            <AnimatePresence>
              {hoveredPoint && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-950/95 border border-slate-800 p-2 rounded-2xl shadow-2xl backdrop-blur-md max-w-[210px] w-full space-y-1.5 pointer-events-none z-20"
                >
                  <div className="flex justify-between items-center text-xs font-mono text-slate-400 border-b border-slate-800 pb-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      Дата вибірки:
                    </span>
                    <span className="text-slate-200 font-bold">{hoveredPoint.dateStr}.2026</span>
                  </div>

                  <div className="space-y-1">
                    {visibleEntities.comp1 && activeTab !== 'suspicious' && (
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-slate-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          СпецТехПостач:
                        </span>
                        <span className="text-red-400 font-bold">{hoveredPoint.comp1}%</span>
                      </div>
                    )}
                    {visibleEntities.wallet1 && (
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-slate-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                          BTC Wallet:
                        </span>
                        <span className="text-purple-400 font-bold">{hoveredPoint.wallet1}%</span>
                      </div>
                    )}
                    {visibleEntities.person1 && (
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-slate-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Коваленко І.В.:
                        </span>
                        <span className="text-amber-400 font-bold">{hoveredPoint.person1}%</span>
                      </div>
                    )}
                    {visibleEntities.comp2 && activeTab === 'all' && (
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-slate-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Арсенал Сек'юріті:
                        </span>
                        <span className="text-emerald-400 font-bold">{hoveredPoint.comp2}%</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Active toggling legends */}
          <div className="flex flex-wrap gap-2 pt-1.5 justify-start">
            {displayedEntitiesInfo.map((ent) => {
              const isVisible = visibleEntities[ent.key];
              return (
                <button
                  key={ent.id}
                  onClick={() => toggleEntityVisibility(ent.key)}
                  className={`px-2.5 py-1.5 rounded-2xl border flex items-center gap-2 text-xs font-mono transition-all duration-300 cursor-pointer ${
                    isVisible 
                      ? 'bg-slate-950/80 text-slate-200 shadow-sm' 
                      : 'bg-slate-900/10 border-slate-800 text-slate-500 line-through'
                  }`}
                  style={{ borderColor: isVisible ? `${ent.color}40` : undefined }}
                >
                  <span 
                    className="w-2 h-2 rounded-full shrink-0 transition-transform duration-300" 
                    style={{ 
                      backgroundColor: ent.color,
                      boxShadow: isVisible ? `0 0 8px ${ent.color}` : 'none',
                      transform: isVisible ? 'scale(1)' : 'scale(0.8)'
                    }} 
                  />
                  <div className="text-left leading-none">
                    <span className="font-bold block truncate max-w-[120px]">{ent.name}</span>
                    <span className="text-xs text-slate-500 uppercase">{ent.type} · {ent.currentRisk}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right timeline security events logs panel */}
        <div className="xl:col-span-4 bg-slate-950/30 border border-slate-800 rounded-2xl p-2 flex flex-col h-[324px] justify-between">
          <div className="space-y-3 overflow-hidden flex flex-col h-full">
            <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-wider block border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
              Хроніка Ключових Подій (30 днів)
            </span>

            <div className="space-y-2 overflow-y-auto pr-1 flex-1 custom-scrollbar">
              {incidents.map((inc, i) => {
                const isSelected = selectedEntityId === inc.targetEntityId;
                return (
                  <div
                    key={`incident-${i}`}
                    onMouseEnter={() => setSelectedEntityId(inc.targetEntityId)}
                    onMouseLeave={() => setSelectedEntityId(null)}
                    onClick={() => {
                      onSelectEntity(inc.targetEntityId);
                      onSelectTab('volumes');
                    }}
                    className={`p-2 rounded-2xl border text-xs cursor-pointer transition-all duration-300 ${
                      isSelected 
                        ? 'bg-blue-950/20 border-slate-800 shadow-xl shadow-black/20 scale-102' 
                        : 'bg-slate-900/30 border-slate-800 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1 font-mono">
                      <span className="text-blue-400 font-bold">{inc.dateLabel}</span>
                      <span className={`px-2 py-1 rounded text-[7.5px] font-bold ${
                        inc.severity === 'CRITICAL' 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border border-slate-800'
                      }`}>
                        {inc.severity}
                      </span>
                    </div>
                    <h5 className="font-bold text-slate-200 mb-0.5 truncate">{inc.title}</h5>
                    <p className="text-xs text-slate-400 leading-normal line-clamp-2 mb-1.5">{inc.description}</p>
                    <div className="text-xs font-mono text-slate-500 border-t border-slate-800 pt-1 flex justify-between items-center">
                      <span className="truncate max-w-[120px]">{inc.entityName}</span>
                      <span className="text-blue-400 font-bold shrink-0">{inc.riskImpact}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-xs text-slate-500 font-mono border-t border-slate-800 pt-2 mt-2 flex justify-between items-center">
            <span>Аномалії за період:</span>
            <span className="text-slate-300 font-bold">4 вагомих інциденти</span>
          </div>
        </div>
      </div>
    </div>
  );
}
