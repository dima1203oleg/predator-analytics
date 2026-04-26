import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiskLevelValue } from '@/types/intelligence';
import {
  Brain, Sparkles, AlertTriangle, Target, Lightbulb, Zap,
  Clock, DollarSign, Shield, TrendingUp,
  RefreshCw, Bookmark, ThumbsUp, ThumbsDown, Crosshair, Radar,
  Activity, Globe, Cpu, Network, ShieldCheck, Info, Fingerprint,
  X, Terminal, Share2, Download,
  Layers, Search, PieChart
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { cn } from '@/utils/cn';
import { intelligenceApi } from '@/services/api/intelligence';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { HoloContainer } from '@/components/HoloContainer';
import { CyberOrb } from '@/components/CyberOrb';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { SovereignAudio } from '@/utils/sovereign-audio';
import { useDashboardOverview } from '@/hooks/useDashboard';
import { useQuery } from '@tanstack/react-query';

// ========================
// Types & Configuration
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
  prediction:     { icon: Brain,       color: '#e11d48', label: 'Прогноз' },
  anomaly:        { icon: Activity,    color: '#9f1239', label: 'Аномалія' },
  opportunity:    { icon: Lightbulb,   color: '#be123c', label: 'Можливість' },
  risk:           { icon: Shield,      color: '#9f1239', label: 'Ризик' },
  recommendation: { icon: Target,      color: '#e11d48', label: 'Рекомендація' },
  scheme:         { icon: Search,      color: '#be123c', label: 'Схема' },
  customs:        { icon: PieChart,    color: '#e11d48', label: 'Митниця' }
};

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  critical: { color: '#9f1239', label: 'КРИТИЧНО' },
  high:     { color: '#be123c', label: 'ВИСОКИЙ' },
  medium:   { color: '#e11d48', label: 'СЕРЕДНІЙ' },
  low:      { color: '#475569', label: 'НИЗЬКИЙ' },
};

// ── ВИСОКОТЕХНОЛОГІЧНИЙ ПЕРЕКРИТТЯ ──
const WRAITH_Overlay = () => (
    <div className="fixed inset-0 pointer-events-none z-[60]">
        <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20" />
    </div>
);

// ── ТРЕНД ВПЕВНЕНОСТІ ──
const ConfidenceTrend = ({ color }: { color: string }) => {
  const data = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    time: i,
    val: 70 + Math.random() * 25
  })), []);

  return (
    <div className="h-40 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area 
            type="monotone" 
            dataKey="val" 
            stroke={color} 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorVal)" 
            animationDuration={2000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// ── ГОЛОС ОРАКУЛА ──
const OracleVoice = ({ active }: { active: boolean }) => (
  <div className="flex items-center gap-1 h-8 px-4 bg-rose-500/5 rounded-full border border-rose-500/10">
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        animate={active ? {
          height: [4, 16, 8, 20, 4],
          opacity: [0.3, 1, 0.5, 1, 0.3]
        } : { height: 4, opacity: 0.2 }}
        transition={{
          duration: 1 + Math.random(),
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-1 bg-rose-500 rounded-full shadow-[0_0_8px_#e11d48]"
      />
    ))}
  </div>
);

// ── НЕЙРОННИЙ ГРАФ ──
const NeuralGraph = ({ color }: { color: string }) => (
  <div className="relative w-full h-64 bg-black/40 border border-white/5 rounded-[2.5rem] overflow-hidden group">
    <div className="absolute inset-0 cyber-scan-grid opacity-[0.03]" />
    <motion.div 
      animate={{ rotate: 360 }}
      transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      className="absolute inset-0 opacity-20"
    >
      <Network size={400} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color }} />
    </motion.div>
    
    <div className="relative h-full flex flex-col items-center justify-center">
       <Radar size={48} className="text-rose-500 animate-pulse mb-4" />
       <p className="text-[9px] font-black uppercase tracking-[0.5em] text-rose-500/60 italic">НЕЙРОННЕ_МАРШРУТУВАННЯ_АКТИВНЕ</p>
    </div>
  </div>
);

const HUDCorners = ({ color = '#e11d48' }) => (
    <>
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 opacity-40" style={{ borderColor: color, borderRadius: '2rem 0 0 0' }} />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 opacity-40" style={{ borderColor: color, borderRadius: '0 2rem 0 0' }} />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 opacity-40" style={{ borderColor: color, borderRadius: '0 0 0 2rem' }} />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 opacity-40" style={{ borderColor: color, borderRadius: '0 0 2rem 0' }} />
    </>
);

const AIInsightsHub: React.FC<{ isWidgetMode?: boolean }> = ({ isWidgetMode = false }) => {
  const [filter, setFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  
  const { nodeSource } = useBackendStatus();
  const { data: overview } = useDashboardOverview();

  const { data: insights = [], isLoading: loading, refetch, isFetching: refreshing } = useQuery({
    queryKey: ['intelligence', 'ai-insights'],
    queryFn: () => intelligenceApi.getAiInsights(),
    refetchInterval: 60000,
  });

  const handleRefresh = () => {
    SovereignAudio.playPulse();
    refetch();
    SovereignAudio.playImpact();
  };

  const selectedInsight = useMemo(() => 
    insights.find((i: any) => i.id === selectedId), 
  [insights, selectedId]);

  const openDetail = (id: string) => {
    SovereignAudio.playImpact();
    setSelectedId(id);
    setShowDetail(true);
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return insights;
    return insights.filter((i: any) => i.type === filter || i.category === filter);
  }, [insights, filter]);

  const stats = useMemo(() => [
    { label: 'СТРАТЕГІЧНИЙ ВПЛИВ', value: overview?.summary ? `$${(overview.summary.total_value_usd / 1e6).toFixed(1)}M` : '...', sub: 'ПРОЕКЦІЯ_ЕФЕКТУ', icon: DollarSign, color: '#e11d48' },
    { label: 'СИНЕРГІЯ МОДЕЛЕЙ', value: '99.9%', sub: 'ГІПЕР_УЗГОДЖЕННЯ', icon: Cpu, color: '#9f1239' },
    { label: 'СУВЕРЕННИЙ ГРАФ', value: overview?.summary?.vectors.toLocaleString() || '...', sub: 'ВУЗЛІВ_КАРТОВАНО', icon: Network, color: '#e11d48' },
    { label: 'АВТОНОМНІСТЬ ЯДРА', value: 'TIER-1', sub: 'S-РІВЕНЬ_ПРОТОКОЛУ', icon: ShieldCheck, color: '#9f1239' },
  ], [overview]);

  if (isWidgetMode) {
    return (
      <div className="flex flex-col h-full bg-[#0a0505]/95 backdrop-blur-xl border border-rose-500/20 overflow-hidden rounded-[2rem] shadow-2xl relative">
        <WRAITH_Overlay />
        <div className="p-6 border-b border-rose-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain size={16} className="text-rose-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-rose-500/80 italic">ІНСАЙТ_ХАБ</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
              <RefreshCw size={24} className="animate-spin text-rose-500" />
              <span className="text-[8px] font-black uppercase tracking-widest">СИНХРОНІЗАЦІЯ_ЯДРА...</span>
            </div>
          ) : filtered.map((insight: any, idx: number) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => openDetail(insight.id)}
              className="p-4 border border-white/5 hover:border-rose-500/30 bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer group rounded-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] font-black uppercase tracking-widest italic" style={{ color: TYPE_CONFIG[insight.type]?.color || '#e11d48' }}>
                  {TYPE_CONFIG[insight.type]?.label || insight.type}
                </span>
                <span className="text-[8px] font-mono text-slate-500">{insight.confidence || 90}% ЗБІГ</span>
              </div>
              <h4 className="text-[11px] font-bold text-slate-300 group-hover:text-white uppercase leading-snug line-clamp-2">
                {insight.title}
              </h4>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-200 relative overflow-hidden font-sans bg-[#020202]">
      <AdvancedBackground mode="sovereign" />
      <WRAITH_Overlay />
      
      <AnimatePresence>
        {showDetail && selectedInsight && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-20 bg-black/95 backdrop-blur-3xl"
          >
            <div className="w-full max-w-7xl h-full max-h-[950px] bg-[#0a0505] border border-rose-500/30 rounded-[4rem] relative overflow-hidden flex flex-col">
               <HUDCorners color={TYPE_CONFIG[selectedInsight.type]?.color || '#e11d48'} />
               <div className="p-10 border-b border-rose-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-8">
                     <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-[2rem]">
                        {React.createElement(TYPE_CONFIG[selectedInsight.type]?.icon || Brain, { size: 32, style: { color: TYPE_CONFIG[selectedInsight.type]?.color || '#e11d48' } })}
                     </div>
                     <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">{selectedInsight.title}</h2>
                  </div>
                  <button onClick={() => setShowDetail(false)} className="p-6 bg-white/5 hover:bg-rose-500/20 rounded-[1.5rem] transition-all">
                     <X size={24} />
                  </button>
               </div>
               <div className="flex-1 overflow-y-auto p-12 custom-scrollbar grid grid-cols-12 gap-12">
                  <div className="col-span-8 space-y-12">
                    <section className="p-10 bg-white/[0.02] border border-white/5 rounded-[3.5rem] text-xl text-slate-300 leading-relaxed italic">
                      {selectedInsight.description}
                    </section>
                    <div className="grid grid-cols-2 gap-8">
                       <NeuralGraph color={TYPE_CONFIG[selectedInsight.type]?.color || '#e11d48'} />
                       <div className="p-8 bg-black border border-white/5 rounded-[2.5rem]">
                          <ConfidenceTrend color={TYPE_CONFIG[selectedInsight.type]?.color || '#e11d48'} />
                       </div>
                    </div>
                  </div>
                  <div className="col-span-4 space-y-8">
                     <div className="p-10 bg-rose-500/5 border border-rose-500/10 rounded-[3rem] text-center space-y-4">
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">ВПЛИВ</p>
                        <p className="text-6xl font-black text-white italic">{selectedInsight.impact || 'N/A'}</p>
                     </div>
                     <div className="p-8 bg-black/80 border border-rose-500/10 rounded-[2.5rem] font-mono text-[10px] text-emerald-500/50 space-y-2">
                        <p>&gt; ІНІЦІАЛІЗАЦІЯ_ОБХОДУ_ГРАФА...</p>
                        <p>&gt; СТАТУС: ГОТОВО_ДО_РІШЕННЯ</p>
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-[1700px] mx-auto p-12 space-y-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="p-7 bg-black/60 border border-rose-500/40 rounded-[2.5rem]">
              <Brain size={48} className="text-rose-500" />
            </div>
            <div>
              <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic">АНАЛІТИЧНИЙ <span className="text-rose-500">ОРАКУЛ</span></h1>
              <p className="text-[11px] text-slate-600 font-black uppercase tracking-[0.5em] mt-2">АВТОНОМНИЙ_СИНТЕЗ_ДЕРЖАВНОЇ_СТРАТЕГІЇ</p>
            </div>
          </div>
          <button onClick={handleRefresh} disabled={refreshing} className="px-10 py-5 bg-black/40 border-2 border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-[0.4em] rounded-[1.5rem] flex items-center gap-4">
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} /> {refreshing ? 'СИНТЕЗУЄМО...' : 'ГЛИБОКИЙ_СКАН'}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <TacticalCard key={i} variant="holographic" className="p-10">
              <p className="text-[10px] font-black text-slate-500 uppercase italic tracking-widest">{stat.label}</p>
              <h3 className="text-5xl font-black text-white italic tracking-tighter mt-4">{stat.value}</h3>
            </TacticalCard>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-12">
          <div className="col-span-8 space-y-8">
            {loading ? <div className="py-20 text-center animate-pulse">ЗВАНТАЖЕННЯ_ІНСАЙТІВ...</div> : filtered.map((insight: any) => (
              <TacticalCard key={insight.id} variant="holographic" className="p-12 hover:border-rose-500/20 transition-all cursor-pointer" onClick={() => openDetail(insight.id)}>
                <div className="flex items-center gap-6 mb-4">
                  <Badge variant="destructive">{insight.severity || insight.priority}</Badge>
                  <span className="text-[10px] font-mono text-slate-500">{insight.confidence || 90}% CONFIDENCE</span>
                </div>
                <h3 className="text-4xl font-black text-white italic mb-4">{insight.title}</h3>
                <p className="text-slate-400 text-lg">{insight.description}</p>
              </TacticalCard>
            ))}
          </div>
          <div className="col-span-4 space-y-12">
             <HoloContainer className="p-10 flex flex-col items-center justify-center min-h-[400px]">
                <CyberOrb size={80} color="#e11d48" />
                <h3 className="text-3xl font-black text-white italic mt-8 uppercase">СИНТЕЗ_WRAITH</h3>
             </HoloContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsHub;
