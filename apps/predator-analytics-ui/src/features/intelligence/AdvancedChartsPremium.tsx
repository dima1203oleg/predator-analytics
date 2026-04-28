/**
 * 📊 ADVANCED CHARTS ELITE //  ОЗШИ ЕНА АНАЛІТИКА | v61.0-ELITE
 * PREDATOR Analytics — High-Fidelity Data Visualization
 * 
 * Потужні графіки для аналітики товарних потоків, ринків таризиків.
 * Sovereign Power Design · Tactical Intelligence · Tier-1
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, PieChart, LineChart, AreaChart, TrendingUp, TrendingDown,
  Download, Filter, Maximize2, RefreshCw, Calendar, Crown, Sparkles,
  ChevronDown, Settings, Share2, Plus, Zap, Shield, Globe, 
  Target, Activity, Database, Layers, Brain, Box
} from 'lucide-react';
import { api } from '@/services/api';
import { cn } from '@/utils/cn';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';

// ========================
// Types
// ========================

type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'heatmap' | 'scatter';

interface ChartData {
  label: string;
  value: number;
  color?: string;
  trend?: number;
}

// ========================
// Chart Components (ELITE)
// ========================

interface BarChartProps {
  data: ChartData[];
  height: number;
  showLabels?: boolean;
  animated?: boolean;
}

const AnimatedBarChart: React.FC<BarChartProps> = ({ data, height, showLabels = true, animated = true }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex items-end justify-around gap-3 mb-4" style={{ height: height - 50 }}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * 100;

          return (
            <div key={index} className="flex-1 flex flex-col items-center group/bar max-w-[40px]">
              <div className="relative w-full h-full flex flex-col justify-end">
                <motion.div
                  initial={animated ? { height: 0, opacity: 0 } : false}
                  animate={{ height: `${barHeight}%`, opacity: 1 }}
                  transition={{ duration: 0.8, delay: index * 0.05, ease: "circOut" }}
                  className="w-full rounded-t-xl bg-gradient-to-t from-yellow-600/40 via-yellow-500/20 to-yellow-400/10 border-t-2 border-yellow-500/40 relative shadow-2xl transition-all group-hover/bar:brightness-125"
                >
                  <div className="absolute inset-0 bg-yellow-500/5 blur-xl group-hover/bar:bg-yellow-500/20 transition-all" />
                  
                  {/* Hover tooltip ELITE */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 hidden group-hover/bar:flex flex-col items-center bg-black border border-yellow-500/40 px-3 py-1.5 rounded-xl z-20 shadow-4xl min-w-[80px]">
                    <span className="text-[10px] font-black text-white font-mono">${item.value}M</span>
                    {item.trend && (
                      <span className={cn("text-[8px] font-black", item.trend >= 0 ? 'text-emerald-400' : 'text-amber-400')}>
                        {item.trend >= 0 ? '▲' : '▼'} {Math.abs(item.trend)}%
                      </span>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>

      {showLabels && (
        <div className="flex justify-around text-[9px] font-black text-slate-700 uppercase italic tracking-widest pt-4 border-t border-white/[0.03]">
          {data.map((item, index) => (
            <span key={index} className="flex-1 text-center truncate px-1">
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

interface DonutChartProps {
  data: ChartData[];
  size: number;
}

const AnimatedDonutChart: React.FC<DonutChartProps> = ({ data, size }) => {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  let cumulativePercent = 0;

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <defs>
          {data.map((item, index) => (
            <radialGradient key={`grad-${index}`} id={`grad-${index}`} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor={item.color || '#D4AF37'} stopOpacity={0.4} />
              <stop offset="100%" stopColor={item.color || '#D4AF37'} stopOpacity={0} />
            </radialGradient>
          ))}
        </defs>
        
        {data.map((item, index) => {
          const percent = (item.value / total) * 100;
          const startAngle = cumulativePercent * 3.6 - 90;
          cumulativePercent += percent;
          const endAngle = cumulativePercent * 3.6 - 90;

          const startRad = (startAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;

          const x1 = 50 + 42 * Math.cos(startRad);
          const y1 = 50 + 42 * Math.sin(startRad);
          const x2 = 50 + 42 * Math.cos(endRad);
          const y2 = 50 + 42 * Math.sin(endRad);

          const largeArc = percent > 50 ? 1 : 0;

          return (
            <g key={index} onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)} className="cursor-pointer group">
              <motion.path
                d={`M 50 50 L ${x1} ${y1} A 42 42 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={item.color || '#D4AF37'}
                fillOpacity={hoveredIndex === null || hoveredIndex === index ? 0.3 : 0.1}
                stroke={item.color || '#D4AF37'}
                strokeWidth={hoveredIndex === index ? 2 : 0.5}
                strokeOpacity={hoveredIndex === index ? 1 : 0.3}
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: hoveredIndex === index ? 1.08 : 1, rotate: 0 }}
                transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
                style={{ transformOrigin: '50% 50%' }}
              />
            </g>
          );
        })}

        <circle cx="50" cy="50" r="28" fill="#050505" stroke="rgba(212, 175, 55, 0.2)" strokeWidth="0.5" />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-center group-hover:scale-110 transition-transform duration-500">
           <AnimatePresence mode="wait">
             <motion.div key={hoveredIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center">
                <p className="text-4xl font-black text-white italic font-mono tracking-tighter">
                  {hoveredIndex !== null ? `${Math.round((data[hoveredIndex].value / total) * 100)}%` : `${total}`}
                </p>
                <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] italic mt-1 font-mono">
                  {hoveredIndex !== null ? data[hoveredIndex].label : 'Σ_TOTAL_VAL'}
                </p>
             </motion.div>
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

interface LineChartComponentProps {
  data: ChartData[];
  height: number;
  filled?: boolean;
  color?: string;
  glowColor?: string;
}

const AnimatedLineChart: React.FC<LineChartComponentProps> = ({
  data,
  height,
  filled = false,
  color = '#D4AF37',
  glowColor = 'rgba(212, 175, 55, 0.4)'
}) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1;

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 85 - ((item.value - minValue) / range) * 70;
    return { x, y, value: item.value };
  });

  const pathD = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ');

  const areaD = `${pathD} L 100 100 L 0 100 Z`;

  return (
    <div className="relative group/chart" style={{ height }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="overflow-visible">
        <defs>
          <linearGradient id={`grad-line-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
          <filter id="glow-line" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Grid lines ELITE */}
        {[0, 25, 50, 75, 100].map((y) => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255, 255, 255, 0.03)" strokeWidth="0.5" />
        ))}

        {/* Filled area */}
        {filled && (
          <motion.path
            d={areaD}
            fill={`url(#grad-line-${color.replace('#', '')})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        )}

        {/* Shadow Line */}
        <motion.path
          d={pathD}
          fill="none"
          stroke="black"
          strokeWidth="4"
          strokeLinecap="round"
          strokeOpacity={0.5}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "circOut" }}
          style={{ transform: 'translateY(2px)' }}
        />

        {/* Main Line */}
        <motion.path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "circOut" }}
          style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
        />

        {/* Points ELITE */}
        {points.map((p, i) => (
          <motion.g key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.5 + i * 0.05 }}>
            <circle cx={p.x} cy={p.y} r="2.5" fill="black" stroke={color} strokeWidth="1" />
            <circle cx={p.x} cy={p.y} r="6" fill={color} fillOpacity={0.1} />
          </motion.g>
        ))}
      </svg>
    </div>
  );
};

import { useBackendStatus } from '@/hooks/useBackendStatus';

// ========================
// Main Component (ELITE)
// ========================

const AdvancedChartsPremium: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('year');
  const [marketTrends, setMarketTrends] = useState<ChartData[]>([]);
  const [categories, setCategories] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isOffline } = useBackendStatus();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [trends, hsAnalytics] = await Promise.all([
        api.premium.getMarketTrends(),
        api.premium.getHSAnalytics()
      ]);

      setMarketTrends(Array.isArray(trends) ? trends : []);
      setCategories((Array.isArray(hsAnalytics) ? hsAnalytics : []).map((item: any) => ({
        label: (item.name || item.code).toUpperCase(),
        value: Math.round(item.volume / 1000000),
        color: ['#D4AF37', '#E11D48', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'][Math.floor(Math.random() * 6)]
      })));
    } catch (err) {
      console.error("Failed to fetch chart data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (isOffline) {
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'QuantumVisual',
          action: 'RenderArray',
          message: 'Автономний режим: візуалізація базується на локальному квантовому масиві даних.',
          severity: 'info'
        }
      }));
    }
  }, [timeRange, isOffline]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020202] text-slate-200 relative overflow-hidden font-sans pb-40 px-4 xl:px-12 pt-12">
        <AdvancedBackground />
        <CyberGrid color="rgba(212, 175, 55, 0.04)" />
        
        {/* Elite Ambient Glow */}
        <div className="absolute inset-x-0 top-0 h-[800px] bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.08),transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(225,29,72,0.04),transparent_60%)] pointer-events-none" />

        <div className="relative z-10 max-w-[1850px] mx-auto space-y-16 flex flex-col items-stretch">
          
          {/* ELITE HEADER HUD */}
          <ViewHeader
            title={
              <div className="flex items-center gap-12">
                <div className="relative group">
                  <div className="absolute inset-0 bg-yellow-600/20 blur-[80px] rounded-full scale-150 animate-pulse" />
                  <div className="relative p-8 bg-black border-2 border-yellow-500/40 rounded-[3rem] shadow-4xl transform -rotate-3 hover:rotate-0 transition-all duration-700">
                    <BarChart3 size={48} className="text-[#D4AF37] shadow-[0_0_30px_#D4AF37]" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-6">
                    <span className="bg-yellow-500/10 border border-yellow-500/20 text-[#D4AF37] px-5 py-1.5 text-[10px] font-black tracking-[0.4em] uppercase italic rounded-xl">
                      ANALYTICS_ELITE // QUANTUM_VIEW
                    </span>
                    <div className="h-px w-16 bg-yellow-500/20" />
                    <span className="text-[10px] font-black text-yellow-800 font-mono tracking-widest uppercase italic shadow-sm">v61.0-ELITE</span>
                  </div>
                  <h1 className="text-7xl font-black text-white tracking-tighter uppercase italic skew-x-[-4deg] leading-none">
                    АНАЛІТИЧНІ <span className="text-[#D4AF37] underline decoration-[#D4AF37]/30 decoration-[16px] underline-offset-[16px] italic uppercase tracking-tighter">ГРАФІКИ</span>
                  </h1>
                </div>
              </div>
            }
            breadcrumbs={['INTEL_POOL', 'QUANT_LAB', 'VISUAL_ARRAY']}
            badges={[
              { label: 'SOVEREIGN_ELITE_v58.2', color: 'gold', icon: <Crown size={10} /> },
              { label: 'LIVE_TELEMETRY', color: 'primary', icon: <Activity size={10} /> },
            ]}
            stats={[
              { label: 'ДАНІ_ОБРОБЛЕНО', value: '4.2B+', icon: <Database />, color: 'primary' },
              { label: 'ТОЧНІСТЬ_MODEL', value: '99.9%', icon: <Zap />, color: 'success' },
              { label: 'NODES_QUANTUM', value: '1.2M', icon: <Layers />, color: 'warning' },
              { label: 'ALPHA_TRUST', value: '98.5', icon: <Shield />, color: 'primary' },
            ]}
          />

          {/* CONTROL HUD ELITE */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 z-20">
             <div className="flex gap-4 p-3 bg-black border-2 border-white/5 rounded-[3rem] shadow-4xl backdrop-blur-3xl">
                {(['week', 'month', 'quarter', 'year'] as const).map((r) => (
                  <button 
                    key={r} onClick={() => setTimeRange(r)}
                    className={cn(
                      "px-10 py-5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.3em] italic transition-all duration-500",
                      timeRange === r ? "bg-yellow-600 border-2 border-yellow-500 text-white shadow-4xl scale-105" : "text-slate-700 hover:text-white"
                    )}
                  >
                    {r === 'week' ? '7 ДНІВ' : r === 'month' ? '30 ДНІВ' : r === 'quarter' ? 'КВА ТАЛ' : ' ІК_2026'}
                  </button>
                ))}
             </div>

             <div className="flex items-center gap-6">
                <button
                  onClick={() => { setRefreshing(true); fetchData().then(() => setRefreshing(false)); }}
                  className={cn(
                    "p-7 bg-black border-2 border-white/[0.04] rounded-[2.5rem] text-slate-500 hover:text-[#D4AF37] transition-all shadow-4xl group/btn hover:border-yellow-500/30",
                    (loading || refreshing) && "animate-spin cursor-not-allowed opacity-50"
                  )}
                >
                  <RefreshCw size={32} className={cn("transition-transform duration-700", !refreshing && "group-hover/btn:rotate-180")} />
                </button>
                <button className="px-14 py-8 bg-[#D4AF37] text-black border-2 border-yellow-400/40 rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.5em] italic hover:brightness-110 transition-all flex items-center gap-6 shadow-4xl">
                   EXPORT_DATA_ARRAY <Download size={24} className="animate-pulse" />
                </button>
             </div>
          </div>

          {/* MAIN CHARTS GRID ELITE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-[400px] bg-black/40 border-2 border-white/5 rounded-[4rem] animate-pulse" />
              ))
            ) : (
              <>
                <TacticalCard variant="holographic" className="md:col-span-2 p-12 rounded-[4rem] space-y-10 group/card">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-5">
                         <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-500 shadow-2xl group-hover/card:scale-110 transition-transform">
                            <Activity size={24} />
                         </div>
                         <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">ДИНАМІКА  ИНКОВИХ Т ЕНДІВ</h3>
                      </div>
                      <div className="text-[8px] font-black text-slate-700 uppercase tracking-[0.5em] font-mono italic">UNIT: MILLION_USD // FREQUENCY: REAL_TIME</div>
                   </div>
                   <AnimatedBarChart data={marketTrends} height={350} />
                </TacticalCard>

                <TacticalCard variant="holographic" className="p-12 rounded-[4rem] space-y-10 group/card">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-5">
                         <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-500 shadow-2xl group-hover/card:scale-110 transition-transform">
                            <PieChart size={24} />
                         </div>
                         <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">РОЗПОДІЛ КАТЕГО ІЙ</h3>
                      </div>
                   </div>
                   <div className="flex items-center justify-center py-6">
                      <AnimatedDonutChart data={categories} size={320} />
                   </div>
                </TacticalCard>

                <TacticalCard variant="holographic" className="p-12 rounded-[4rem] space-y-10 group/card">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-5">
                         <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-500 shadow-2xl group-hover/card:scale-110 transition-transform">
                            <TrendingUp size={24} />
                         </div>
                         <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">ВЕКТО  З ОСТАННЯ</h3>
                      </div>
                      <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 px-4 py-1.5 text-[10px] font-black italic rounded-lg">+14.2%</span>
                   </div>
                   <AnimatedLineChart data={marketTrends} height={250} filled color="#10b981" glowColor="rgba(16, 185, 129, 0.4)" />
                </TacticalCard>

                {/* Growth Chart Elite */}
                <TacticalCard variant="holographic" className="md:col-span-2 p-12 rounded-[4rem] flex flex-col gap-10 group/card overflow-hidden">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-5">
                         <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-500 shadow-2xl">
                            <Zap size={24} />
                         </div>
                         <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">ТОП-СЕГМЕНТИ // QUANTUM_ARRAY</h3>
                      </div>
                      <div className="flex gap-4">
                         <button className="p-4 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"><Settings size={18} /></button>
                         <button className="p-4 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"><Maximize2 size={18} /></button>
                      </div>
                   </div>
                   
                   <div className="flex items-end gap-6 h-[250px] relative">
                      <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
                      {categories.map((item, index) => {
                        const maxVal = Math.max(...categories.map(d => d.value), 1);
                        const hPercent = (item.value / maxVal) * 100;

                        return (
                          <div key={index} className="flex-1 flex flex-col items-center group/col h-full justify-end">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${hPercent}%` }}
                              transition={{ duration: 1.2, delay: index * 0.1, ease: "circOut" }}
                              className="w-full rounded-t-2xl relative transition-all group-hover/col:brightness-125 shadow-2xl"
                              style={{ backgroundColor: item.color, filter: `drop-shadow(0 0 15px ${item.color}33)` }}
                            >
                               <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 text-[10px] font-black font-mono text-white opacity-0 group-hover/col:opacity-100 transition-opacity whitespace-nowrap">${item.value}M</div>
                            </motion.div>
                            <div className="mt-6 text-center w-full">
                              <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest leading-none truncate italic">{item.label}</p>
                            </div>
                          </div>
                        );
                      })}
                   </div>
                </TacticalCard>
              </>
            )}
          </div>

          {/* AI NEURAL INSIGHTS HUD ELITE */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-12 bg-black/40 border-2 border-white/[0.04] rounded-[5rem] backdrop-blur-3xl shadow-4xl relative overflow-hidden group hover:border-yellow-500/10 transition-all duration-1000"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/[0.02] to-transparent pointer-events-none" />
            <div className="flex flex-col xl:flex-row items-center justify-between gap-12 relative z-10">
               <div className="flex items-center gap-10">
                  <div className="relative group/globe">
                    <div className="absolute inset-0 bg-yellow-500/20 blur-[60px] rounded-full scale-150 animate-pulse" />
                    <div className="p-6 bg-black border-2 border-yellow-500/20 rounded-[3rem] shadow-4xl">
                      <Brain size={64} className="text-yellow-500 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-4xl font-black text-white uppercase tracking-tighter italic font-serif leading-none">AI NEURAL_ANALYTICS // INSIGHTS</h4>
                    <p className="text-[11px] text-slate-700 font-black uppercase tracking-[0.4em] italic leading-none border-l-4 border-yellow-500/30 pl-8">DEEP_FORECASTING // PATTERN_RECOGNITION</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {[
                    { icon: TrendingUp, title: 'ВЕКТО _З ОСТАННЯ', desc: 'Прогнозується ріст на 15% у наступному Q.', color: 'emerald' },
                    { icon: Target, title: 'PATTERN_DETECTION', desc: 'Виявлено аномальну активність у сегменті ЕНЕ ГО.', color: 'warning' },
                    { icon: Shield, title: 'RISK_MITIGATION', desc: 'рекомендовано диверсифікацію ланцюгів.', color: 'primary' },
                  ].map((insight, i) => (
                    <div key={i} className="flex gap-6 italic group/insight underline-offset-8 decoration-yellow-500/20 hover:decoration-yellow-500/40 transition-all">
                       <div className={cn("p-4 rounded-xl bg-black border border-white/5", `text-${insight.color}-500 shadow-[0_0_15px_currentColor]33`)}>
                          <insight.icon size={20} />
                       </div>
                       <div className="space-y-2">
                          <h5 className="text-[11px] font-black text-white uppercase tracking-widest">{insight.title}</h5>
                          <p className="text-[10px] text-slate-500 leading-relaxed font-serif uppercase tracking-tight">{insight.desc}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </motion.div>
        </div>
        
        <style dangerouslySetInnerHTML={{ __html: `.no-scrollbar::-webkit-scrollbar{display:none}` }} />
      </div>
    </PageTransition>
  );
};

export default AdvancedChartsPremium;
