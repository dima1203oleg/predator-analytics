import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiskLevelValue } from '@/types/intelligence';
import {
  Brain, Sparkles, AlertTriangle, Target, Lightbulb, Zap,
  Clock, DollarSign, Shield, TrendingUp,
  RefreshCw, Bookmark, ThumbsUp, ThumbsDown, Crosshair, Radar,
  Activity, Globe, Cpu, Network, ShieldCheck, Info, Fingerprint,
  X, Terminal, Share2, Download,
  Layers, Search, PieChart, Atom, Orbit, Box
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { cn } from '@/lib/utils';
import { intelligenceApi } from '@/services/api/intelligence';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { useDashboardOverview } from '@/hooks/useDashboard';
import { useQuery } from '@tanstack/react-query';

/**
 * 🧠 AI INSIGHTS HUB | v61.0-ELITE
 * АНАЛІТИЧНИЙ_ОРАКУЛ: Автономний синтез стратегічних інсайтів та прогнозів.
 * Використовує LEAD_ARCHITECT (GLM-5.1) для глибинного аналізу.
 */

// ========================
// Типи та Конфігурація
// ========================

type InsightType = 'prediction' | 'anomaly' | 'opportunity' | 'risk' | 'recommendation' | 'scheme' | 'customs';
type InsightPriority = RiskLevelValue | 'high' | 'medium' | 'low' | 'critical';

interface AIInsight {
  id: string;
  type: InsightType;
  severity: InsightPriority;
  title: string;
  description: string;
  confidence: number;
  impact: string;
  category: string;
  timestamp: string;
  actionable: boolean;
  actions?: { label: string; type: 'primary' | 'secondary' }[];
  saved?: boolean;
}

const TYPE_CONFIG: Record<string, { icon: any, color: string, label: string }> = {
  prediction:     { icon: Brain,       color: '#f43f5e', label: 'ПРОГНОЗ' },
  anomaly:        { icon: Activity,    color: '#e11d48', label: 'АНОМАЛІЯ' },
  opportunity:    { icon: Lightbulb,   color: '#fb7185', label: 'МОЖЛИВІСТЬ' },
  risk:           { icon: Shield,      color: '#9f1239', label: 'РИЗИК' },
  recommendation: { icon: Target,      color: '#f43f5e', label: 'РЕКОМЕНДАЦІЯ' },
  scheme:         { icon: Search,      color: '#be123c', label: 'СХЕМА' },
  customs:        { icon: PieChart,    color: '#e11d48', label: 'МИТНИЦЯ' }
};

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  critical: { color: '#9f1239', label: 'КРИТИЧНО' },
  high:     { color: '#be123c', label: 'ВИСОКИЙ' },
  medium:   { color: '#e11d48', label: 'СЕРЕДНІЙ' },
  low:      { color: '#475569', label: 'НИЗЬКИЙ' },
};

// ── ВПЕВНЕНІСТЬ_МОДЕЛІ ──
const ConfidenceTrend = ({ color }: { color: string }) => {
  const data = useMemo(() => Array.from({ length: 15 }, (_, i) => ({
    time: i,
    val: 85 + Math.random() * 14
  })), []);

  return (
    <div className="h-48 w-full mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorValInsight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area 
            type="monotone" 
            dataKey="val" 
            stroke={color} 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorValInsight)" 
            animationDuration={2500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// ── НЕЙРОННИЙ_ГРАФ_V61 ──
const NeuralGraph = ({ color }: { color: string }) => (
  <div className="relative w-full h-80 glass-wraith border-2 border-white/5 rounded-[3rem] overflow-hidden group shadow-4xl">
    <div className="absolute inset-0 bg-cyber-grid opacity-[0.03]" />
    <motion.div 
      animate={{ rotate: 360 }}
      transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      className="absolute inset-0 opacity-20 flex items-center justify-center"
    >
      <Network size={500} style={{ color }} />
    </motion.div>
    
    <div className="relative h-full flex flex-col items-center justify-center gap-6">
       <div className="relative">
          <div className="absolute inset-0 bg-rose-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
          <Radar size={56} className="text-rose-500 relative z-10 animate-spin-slow" style={{ animationDuration: '10s' }} />
       </div>
       <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-rose-500 glint-elite">НЕЙРОННЕ_МАРШРУТУВАННЯ_АКТИВНЕ</p>
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/20 italic">V61.0_SOVEREIGN_NODE_READY</p>
       </div>
    </div>
  </div>
);

const HUDCorners = ({ color = '#e11d48' }) => (
    <>
      <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 opacity-40 shadow-[0_0_15px_rgba(225,29,72,0.3)]" style={{ borderColor: color, borderRadius: '2.5rem 0 0 0' }} />
      <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 opacity-40 shadow-[0_0_15px_rgba(225,29,72,0.3)]" style={{ borderColor: color, borderRadius: '0 2.5rem 0 0' }} />
      <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 opacity-40 shadow-[0_0_15px_rgba(225,29,72,0.3)]" style={{ borderColor: color, borderRadius: '0 0 0 2.5rem' }} />
      <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 opacity-40 shadow-[0_0_15px_rgba(225,29,72,0.3)]" style={{ borderColor: color, borderRadius: '0 0 2.5rem 0' }} />
    </>
);

const AIInsightsHub: React.FC<{ isWidgetMode?: boolean }> = ({ isWidgetMode = false }) => {
  const [filter, setFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  
  const { llmTriStateMode } = useBackendStatus();
  const { data: overview } = useDashboardOverview();

  const { data: insights = [], isLoading: loading, refetch, isFetching: refreshing } = useQuery({
    queryKey: ['intelligence', 'ai-insights'],
    queryFn: () => intelligenceApi.getAiInsights(),
    refetchInterval: 60000,
  });

  const handleRefresh = () => {
    refetch();
  };

  const selectedInsight = useMemo(() => 
    insights.find((i: any) => i.id === selectedId), 
  [insights, selectedId]);

  const openDetail = (id: string) => {
    setSelectedId(id);
    setShowDetail(true);
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return insights;
    return insights.filter((i: any) => i.type === filter || i.category === filter);
  }, [insights, filter]);

  const stats = useMemo(() => [
    { label: 'СТРАТЕГІЧНИЙ ВПЛИВ', value: overview?.summary ? `$${(overview.summary.total_value_usd / 1e6).toFixed(1)}M` : '...', sub: 'ПРОЕКЦІЯ_ЕФЕКТУ_L7', icon: DollarSign, color: '#e11d48' },
    { label: 'СИНЕРГІЯ МОДЕЛЕЙ', value: '99.9%', sub: 'ГІПЕР_УЗГОДЖЕННЯ', icon: Cpu, color: '#9f1239' },
    { label: 'СУВЕРЕННИЙ ГРАФ', value: overview?.summary?.vectors ? (overview.summary.vectors / 1e3).toFixed(1) + 'K' : '...', sub: 'ВУЗЛІВ_КАРТОВАНО', icon: Network, color: '#e11d48' },
    { label: 'АВТОНОМНІСТЬ ЯДРА', value: 'TIER-1', sub: 'S-РІВЕНЬ_ПРОТОКОЛУ', icon: ShieldCheck, color: '#9f1239' },
  ], [overview]);

  if (isWidgetMode) {
    return (
      <div className="flex flex-col h-full bg-black/80 backdrop-blur-3xl border-2 border-rose-500/20 overflow-hidden rounded-[3rem] shadow-4xl relative group">
        <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
        <div className="p-8 border-b border-rose-500/10 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <Brain size={20} className="text-rose-500 glint-elite" />
            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-rose-500 italic">АНАЛІТИЧНИЙ_ОРАКУЛ</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(225,29,72,1)]" />
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5 relative z-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-6 opacity-30">
              <RefreshCw size={32} className="animate-spin text-rose-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em] italic">СИНХРОНІЗАЦІЯ_ЯДРА_L7...</span>
            </div>
          ) : filtered.map((insight: any, idx: number) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => openDetail(insight.id)}
              className="p-6 border-2 border-white/5 hover:border-rose-500/40 bg-white/[0.02] hover:bg-rose-500/5 transition-all duration-700 cursor-pointer group/item rounded-[2rem] relative overflow-hidden shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] italic" style={{ color: TYPE_CONFIG[insight.type]?.color || '#e11d48' }}>
                  {TYPE_CONFIG[insight.type]?.label || insight.type}
                </span>
                <span className="text-[9px] font-black font-mono text-white/20 uppercase tracking-widest italic">{insight.confidence || 90}% ЗБІГ</span>
              </div>
              <h4 className="text-[13px] font-black text-white/80 group-hover/item:text-white uppercase leading-snug line-clamp-2 tracking-tight italic transition-colors">
                {insight.title}
              </h4>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-200 relative overflow-hidden font-sans bg-black pb-40">
      <AdvancedBackground mode="sovereign" />
      <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none" />
      
      <AnimatePresence>
        {showDetail && selectedInsight && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-8 sm:p-24 bg-black/95 backdrop-blur-3xl"
          >
            <div className="w-full max-w-7xl h-full max-h-[1000px] bg-[#050202] border-2 border-rose-500/30 rounded-[4rem] relative overflow-hidden flex flex-col shadow-4xl">
               <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
               <HUDCorners color={TYPE_CONFIG[selectedInsight.type]?.color || '#e11d48'} />
               
               <div className="p-12 border-b-2 border-rose-500/10 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-10">
                     <div className="p-8 bg-rose-500/10 border-2 border-rose-500/20 rounded-[2.5rem] shadow-2xl relative group/icon">
                        <div className="absolute inset-0 bg-rose-500/20 blur-2xl rounded-full scale-0 group-hover/icon:scale-150 transition-transform duration-1000 opacity-0 group-hover/icon:opacity-100" />
                        {React.createElement(TYPE_CONFIG[selectedInsight.type]?.icon || Brain, { size: 40, className: "relative z-10 glint-elite", style: { color: TYPE_CONFIG[selectedInsight.type]?.color || '#e11d48' } })}
                     </div>
                     <div className="space-y-2">
                        <div className="flex items-center gap-4">
                           <span className="text-[11px] font-black uppercase tracking-[0.4em] italic" style={{ color: TYPE_CONFIG[selectedInsight.type]?.color || '#e11d48' }}>
                              {TYPE_CONFIG[selectedInsight.type]?.label || selectedInsight.type} // ІНСАЙТ_ЯДРА
                           </span>
                           <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        </div>
                        <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase glint-elite">{selectedInsight.title}</h2>
                     </div>
                  </div>
                  <button onClick={() => setShowDetail(false)} className="p-8 bg-white/5 hover:bg-rose-500/20 rounded-[2rem] transition-all duration-700 group border-2 border-white/5 hover:border-rose-500/40">
                     <X size={32} className="group-hover:rotate-90 transition-transform duration-700" />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-16 custom-scrollbar grid grid-cols-12 gap-16 relative z-10">
                  <div className="col-span-8 space-y-16">
                    <section className="p-12 glass-wraith border-2 border-white/5 rounded-[4rem] text-2xl text-white/80 leading-relaxed italic font-black tracking-tight relative overflow-hidden group shadow-inner">
                      <div className="absolute top-4 left-6 text-[10px] font-black text-rose-500/30 uppercase tracking-[0.6em]">ТЕКСТ_ІНСАЙТУ_L7</div>
                      <div className="relative z-10">{selectedInsight.description}</div>
                    </section>
                    <div className="grid grid-cols-2 gap-12">
                       <NeuralGraph color={TYPE_CONFIG[selectedInsight.type]?.color || '#e11d48'} />
                       <div className="p-12 glass-wraith border-2 border-white/5 rounded-[3rem] shadow-4xl relative overflow-hidden group">
                          <div className="absolute top-4 left-6 text-[10px] font-black text-rose-500/30 uppercase tracking-[0.6em] italic">ТРЕНД_ВПЕВНЕНОСТІ_МОДЕЛІ</div>
                          <ConfidenceTrend color={TYPE_CONFIG[selectedInsight.type]?.color || '#e11d48'} />
                       </div>
                    </div>
                  </div>
                  <div className="col-span-4 space-y-10">
                     <div className="p-12 bg-rose-600/5 border-2 border-rose-500/20 rounded-[4rem] text-center space-y-6 shadow-4xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-cyber-grid opacity-[0.05] pointer-events-none" />
                        <p className="text-[12px] font-black text-rose-500 uppercase tracking-[0.6em] italic">СТРАТЕГІЧНИЙ_ВПЛИВ</p>
                        <p className="text-7xl font-black text-white italic glint-elite">{selectedInsight.impact || 'Н/Д'}</p>
                        <div className="h-[2px] w-32 bg-rose-500/40 mx-auto rounded-full" />
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] italic">ОЦІНКА_LEAD_ARCHITECT</p>
                     </div>
                     <div className="p-10 glass-wraith border-2 border-white/5 rounded-[3rem] font-mono text-[11px] text-emerald-500/60 space-y-3 shadow-inner">
                        <p className="text-rose-500/40 font-black italic mb-4 uppercase tracking-widest border-b border-rose-500/10 pb-2">ЛОГ_СИНТЕЗУ_ЯДРА:</p>
                        <p className="flex items-center gap-3">&gt; <span className="text-emerald-500">ІНІЦІАЛІЗАЦІЯ_ОБХОДУ_ГРАФА..._УСПІШНО</span></p>
                        <p className="flex items-center gap-3">&gt; <span className="text-emerald-500">ВЕРИФІКАЦІЯ_ГІПОТЕЗИ_0x9F43..._ПРОЙДЕНО</span></p>
                        <p className="flex items-center gap-3">&gt; <span className="text-emerald-500">СТАТУС: ГОТОВО_ДО_РІШЕННЯ_L7</span></p>
                        <p className="flex items-center gap-3 animate-pulse">&gt; <span className="text-rose-500/40">ОЧІКУВАННЯ_ПІДТВЕРДЖЕННЯ_СУВЕРЕНУ...</span></p>
                     </div>
                  </div>
               </div>

               <div className="p-12 border-t-2 border-rose-500/10 flex items-center justify-between relative z-10 bg-black/40">
                  <div className="flex items-center gap-8 text-[11px] font-black font-mono text-white/20 tracking-[0.4em] uppercase italic">
                     <span>ID_ТРАКЦІЇ: {selectedInsight.id.toUpperCase()}</span>
                     <span className="opacity-40">•</span>
                     <span>КЛАСИФІКАЦІЯ: {selectedInsight.category.toUpperCase()}</span>
                  </div>
                  <div className="flex gap-6">
                     <button className="px-10 py-5 bg-white/5 border-2 border-white/5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.3em] italic hover:bg-white/10 transition-all">ЗБЕРЕГТИ_В_АРХІВ</button>
                     <button className="px-12 py-5 bg-rose-600 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.4em] italic shadow-4xl hover:bg-rose-500 transition-all border-2 border-rose-400/50">ВПРОВАДИТИ_РІШЕННЯ</button>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-[1800px] mx-auto p-16 space-y-20">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative">
          <div className="flex items-center gap-12 border-l-4 border-rose-600 pl-12 py-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-rose-600/20 blur-[60px] rounded-full scale-150 animate-pulse" />
              <div className="relative p-10 bg-black/60 backdrop-blur-3xl border-2 border-rose-500/40 rounded-[3rem] shadow-4xl transform -rotate-3 group-hover:rotate-0 transition-all duration-700">
                <Brain size={64} className="text-rose-500 drop-shadow-[0_0_20px_rgba(225,29,72,0.8)]" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-6">
                <span className="px-5 py-1.5 bg-rose-600/10 border-2 border-rose-600/30 rounded-xl text-[11px] font-black text-rose-500 tracking-[0.5em] uppercase italic shadow-2xl">
                   STRATEGIC_ORACLE_v61.0
                </span>
                <div className="h-[2px] w-16 bg-rose-500/40" />
                <span className="text-[11px] font-black text-white/30 uppercase tracking-[0.4em] italic font-mono">LEAD_ARCHITECT_ACTIVE_L7</span>
              </div>
              <h1 className="text-8xl font-black text-white tracking-tighter uppercase italic leading-none glint-elite">АНАЛІТИЧНИЙ <span className="text-rose-500">ОРАКУЛ</span></h1>
              <p className="text-[13px] text-white/40 font-black uppercase tracking-[0.6em] italic leading-none border-l-4 border-rose-900/50 pl-8">АВТОНОМНИЙ_СИНТЕЗ_ДЕРЖАВНОЇ_СТРАТЕГІЇ_ТА_РИЗИКІВ</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-6">
             <div className="flex items-center gap-6 p-4 bg-rose-500/5 border-2 border-rose-500/20 rounded-[2rem] shadow-4xl">
                <div className="w-4 h-4 rounded-full bg-rose-600 animate-ping" />
                <div className="flex flex-col pr-6">
                   <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest italic leading-none mb-2">ПОТІК_СИНТЕЗУ</span>
                   <span className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">АКТИВНИЙ_14.2_TFLOPS</span>
                </div>
             </div>
             <button 
               onClick={handleRefresh} 
               disabled={refreshing} 
               className="group relative px-16 py-7 bg-black border-2 border-rose-500/40 text-rose-500 text-[12px] font-black uppercase tracking-[0.5em] rounded-[2rem] flex items-center gap-6 shadow-4xl hover:bg-rose-600 hover:text-white transition-all duration-700 italic overflow-hidden"
             >
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
               <RefreshCw size={24} className={refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'} /> 
               <span className="relative z-10">{refreshing ? 'СИНТЕЗУЄМО_ЗВ\'ЯЗКИ...' : 'ГЛИБОКИЙ_НЕЙРО-СКАН'}</span>
             </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
              className="p-12 glass-wraith border-2 border-white/5 rounded-[3.5rem] relative overflow-hidden group hover:border-rose-500/40 transition-all duration-1000 shadow-4xl"
            >
              <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
              <div className="absolute top-6 right-10 opacity-5 group-hover:opacity-20 transition-opacity">
                 <stat.icon size={64} className="text-rose-500" />
              </div>
              <p className="text-[11px] font-black text-white/20 uppercase italic tracking-[0.4em] mb-6 group-hover:text-rose-500/40 transition-colors">{stat.label}</p>
              <h3 className="text-6xl font-black text-white italic tracking-tighter leading-none glint-elite">{stat.value}</h3>
              <p className="text-[10px] font-black text-white/10 mt-8 uppercase tracking-[0.3em] font-bold italic group-hover:text-rose-500/60 transition-colors">{stat.sub}</p>
              <div className="absolute bottom-6 right-10 w-12 h-[2px] bg-white/5 group-hover:bg-rose-500/60 transition-colors" />
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-16">
          <div className="col-span-12 xl:col-span-8 space-y-12">
            <div className="flex items-center justify-between px-8">
               <h4 className="text-[13px] font-black text-white/30 uppercase tracking-[0.6em] italic flex items-center gap-6">
                  <Terminal size={20} className="text-rose-600" /> ПОТІК_СТРАТЕГІЧНИХ_ВИСНОВКІВ
               </h4>
               <div className="flex gap-4">
                  {['all', 'risk', 'anomaly', 'prediction'].map(f => (
                    <button 
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest italic border-2 transition-all duration-500",
                        filter === f ? "bg-rose-600 border-rose-400 text-white shadow-rose-500/40" : "bg-white/5 border-white/5 text-white/30 hover:border-white/20"
                      )}
                    >
                      {f.toUpperCase()}
                    </button>
                  ))}
               </div>
            </div>

            <div className="space-y-10">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <div className="py-40 text-center animate-pulse flex flex-col items-center gap-8 glass-wraith rounded-[4rem] border-2 border-dashed border-white/5">
                    <Atom size={64} className="text-rose-500 animate-spin-slow" />
                    <span className="text-2xl font-black text-white/20 uppercase tracking-[0.5em] italic">СИНТЕЗ_ДЕРЖАВНОЇ_СТРАТЕГІЇ...</span>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="py-40 text-center glass-wraith rounded-[4rem] border-2 border-dashed border-white/5 space-y-6">
                    <Search size={64} className="text-white/10 mx-auto" />
                    <span className="text-xl font-black text-white/20 uppercase tracking-[0.4em] italic block">НЕМАЄ_ІНСАЙТІВ_ЗА_ФІЛЬТРОМ</span>
                  </div>
                ) : filtered.map((insight: any, idx: number) => (
                  <motion.div
                    key={insight.id}
                    layout
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.8 }}
                    onClick={() => openDetail(insight.id)}
                    className="p-16 glass-wraith border-2 border-white/5 rounded-[4.5rem] hover:border-rose-500/40 transition-all duration-1000 cursor-pointer group shadow-4xl relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-cyber-grid opacity-[0.01] pointer-events-none" />
                    <div className="absolute top-10 right-16 opacity-5 group-hover:opacity-30 transition-all duration-1000 transform group-hover:scale-125">
                       {React.createElement(TYPE_CONFIG[insight.type]?.icon || Brain, { size: 120, className: "text-rose-500" })}
                    </div>
                    
                    <div className="flex items-center gap-8 mb-10 relative z-10">
                      <div className={cn(
                        "px-8 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.4em] italic border-2 transition-all duration-700 shadow-2xl",
                        PRIORITY_CONFIG[insight.severity]?.color ? "bg-rose-600/10 border-rose-500/40 text-rose-500" : "bg-white/5 border-white/5 text-white/30"
                      )}>
                        {PRIORITY_CONFIG[insight.severity]?.label || insight.severity || 'LOW'}
                      </div>
                      <div className="w-2 h-2 rounded-full bg-white/10" />
                      <span className="text-[11px] font-black font-mono text-white/20 uppercase tracking-widest italic">{insight.confidence || 90}% CONFIDENCE_SCORE_L7</span>
                    </div>

                    <h3 className="text-5xl font-black text-white italic mb-8 group-hover:text-rose-500 transition-colors duration-700 tracking-tighter glint-elite relative z-10 uppercase leading-tight max-w-4xl">
                       {insight.title}
                    </h3>
                    
                    <p className="text-white/40 text-xl leading-relaxed italic line-clamp-3 max-w-5xl relative z-10 font-bold group-hover:text-white/60 transition-colors duration-700">
                      {insight.description}
                    </p>

                    <div className="absolute bottom-10 right-16 flex items-center gap-6 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-x-10 group-hover:translate-x-0">
                       <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic">ДЕТАЛЬНИЙ_АНАЛІЗ_ГРАФА</span>
                       <div className="p-4 bg-rose-600 text-white rounded-full shadow-4xl border-2 border-rose-400/50">
                          <Target size={24} />
                       </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="col-span-12 xl:col-span-4 space-y-16">
             <div className="p-16 glass-wraith border-2 border-rose-500/20 rounded-[5rem] flex flex-col items-center justify-center min-h-[600px] text-center shadow-4xl relative overflow-hidden group hover:border-rose-500/60 transition-all duration-1000">
                <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none" />
                <div className="relative mb-12">
                   <div className="absolute inset-0 bg-rose-600/30 blur-[100px] rounded-full scale-150 animate-pulse" />
                   <Orbit size={180} className="text-rose-500 relative z-10 animate-spin-slow" style={{ animationDuration: '30s' }} />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <Atom size={80} className="text-rose-500 animate-pulse" />
                   </div>
                </div>
                <h3 className="text-5xl font-black text-white italic uppercase tracking-tighter glint-elite">СИНТЕЗ_WRAITH</h3>
                <p className="text-[13px] text-white/30 font-black uppercase tracking-[0.5em] mt-6 italic max-w-xs leading-relaxed font-mono">
                   ГЕНЕРУЄМО_СТРАТЕГІЧНІ_ВІКТОР_ДЛЯ_ДЕРЖАВНОГО_УПРАВЛІННЯ_L7
                </p>
                <div className="mt-12 w-48 h-1 bg-white/5 rounded-full relative overflow-hidden">
                   <motion.div 
                     animate={{ left: ['-100%', '100%'] }}
                     transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                     className="absolute top-0 bottom-0 w-1/2 bg-rose-500 shadow-[0_0_20px_rgba(225,29,72,1)]"
                   />
                </div>
             </div>

             <div className="p-12 glass-wraith border-2 border-white/5 rounded-[4rem] space-y-10 shadow-4xl relative group hover:border-rose-500/20 transition-all duration-1000">
                <div className="flex items-center justify-between border-b-2 border-white/5 pb-8">
                   <div className="flex items-center gap-4">
                      <Fingerprint size={24} className="text-rose-500" />
                      <span className="text-[12px] font-black text-white uppercase tracking-[0.4em] italic">АКТИВНІСТЬ_ЯДРА</span>
                   </div>
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="space-y-6">
                   {[
                     { label: 'ЦІЛІСНІСТЬ_МОДЕЛІ', val: '99.98%', icon: ShieldCheck },
                     { label: 'ШВИДКІСТЬ_СИНТЕЗУ', val: '0.42ms', icon: Zap },
                     { label: 'ОБСЯГ_ЗНАНЬ', val: '1.4 PB', icon: Layers },
                   ].map((item, i) => (
                     <div key={i} className="flex items-center justify-between p-6 bg-white/[0.02] border-2 border-white/5 rounded-3xl hover:border-rose-500/20 transition-all">
                        <div className="flex items-center gap-4">
                           <item.icon size={18} className="text-rose-500/60" />
                           <span className="text-[10px] font-black text-white/30 uppercase tracking-widest italic">{item.label}</span>
                        </div>
                        <span className="text-sm font-black text-white italic tracking-tighter">{item.val}</span>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
          .shadow-4xl { box-shadow: 0 60px 120px -30px rgba(0,0,0,0.9); }
          .glint-elite { text-shadow: 0 0 40px rgba(225,29,72,0.4); }
          .animate-spin-slow { animation: spin 20s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(225,29,72,0.1); border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(225,29,72,0.3); }
      `}} />
    </div>
  );
};

export default AIInsightsHub;
