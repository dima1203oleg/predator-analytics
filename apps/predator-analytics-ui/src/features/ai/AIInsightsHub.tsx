import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiskLevelValue } from '@/types/intelligence';
import {
  Brain, Sparkles, AlertTriangle, Target, Lightbulb, Zap,
  Clock, DollarSign, Shield, ArrowRight, TrendingUp, TrendingDown,
  RefreshCw, Bookmark, ThumbsUp, ThumbsDown, Crosshair, Radar,
  Activity, ArrowUpRight, Flame, Layers, Search, BarChart3,
  Rocket, Globe, Cpu, Network, ShieldCheck, Info, Fingerprint,
  ChevronRight, Lock, Eye
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { apiClient as api } from '@/services/api/config';
import { TacticalCard } from '@/components/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { HoloContainer } from '@/components/HoloContainer';
import { CyberOrb } from '@/components/CyberOrb';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { SovereignAudio } from '@/utils/sovereign-audio';

// ========================
// Types & Configuration
// ========================

type InsightType = 'prediction' | 'anomaly' | 'opportunity' | 'risk' | 'recommendation';
type InsightPriority = RiskLevelValue;

interface AIInsight {
  id: string;
  type: InsightType;
  priority: InsightPriority;
  title: string;
  description: string;
  confidence: number;
  impact: string;
  category: string;
  createdAt: string;
  actionable: boolean;
  actions?: { label: string; type: 'primary' | 'secondary' }[];
  saved: boolean;
  feedback?: 'positive' | 'negative';
}

// ПАЛІТРА v57.5-ELITE Sovereign: Gold (#D4AF37) та Amber (#B45309)
const TYPE_CONFIG = {
  prediction:     { icon: Brain,       color: '#D4AF37', label: 'Прогноз' },
  anomaly:        { icon: Activity,    color: '#B45309', label: 'Аномалія' },
  opportunity:    { icon: Lightbulb,   color: '#F59E0B', label: 'Можливість' },
  risk:           { icon: Shield,      color: '#B45309', label: 'Ризик' },
  recommendation: { icon: Target,      color: '#D4AF37', label: 'Рекомендація' }
};

const PRIORITY_CONFIG: Record<InsightPriority, { color: string; label: string }> = {
  critical: { color: '#B45309', label: 'КРИТИЧНО' },
  high:     { color: '#F59E0B', label: 'ВИСОКИЙ' },
  medium:   { color: '#D4AF37', label: 'СЕРЕДНІЙ' },
  low:      { color: '#475569', label: 'НИЗЬКИЙ' },
  minimal:  { color: '#64748b', label: 'МІНІМАЛЬНИЙ' },
  stable:   { color: '#10b981', label: 'СТАБІЛЬНИЙ' },
  watchlist: { color: '#8b5cf6', label: 'НАГЛЯД' },
  elevated: { color: '#f59e0b', label: 'ПІДВИЩЕНИЙ' },
};

// ── ВИСОКОТЕХНОЛОГІЧНИЙ ПЕРЕКРИТТЯ ──
const WRAITH_Overlay = () => (
    <div className="fixed inset-0 pointer-events-none z-[60]">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20" />
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none overflow-hidden">
            <div className="w-full h-full animate-scanline bg-gradient-to-b from-transparent via-yellow-500/10 to-transparent" 
                 style={{ height: '2px', top: '0' }} />
        </div>
    </div>
);

// ── ХАД СКАНУВАННЯ ──
const ScanningHUD = () => (
    <div className="absolute inset-x-0 top-0 h-1 z-20 overflow-hidden">
        <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-1/2 h-full bg-gradient-to-r from-transparent via-yellow-500/80 to-transparent shadow-[0_0_15px_#d4af37]"
        />
    </div>
);

interface AIInsightsHubProps {
  isWidgetMode?: boolean;
}

const AIInsightsHub: React.FC<AIInsightsHubProps> = ({ isWidgetMode = false }) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<InsightType | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  
  const { isOffline, nodeSource } = useBackendStatus();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/intelligence/insights');
      setInsights(Array.isArray(res.data) ? res.data : []);
      
      // Сигналізуємо про успішний синтез
      SovereignAudio.playImpact();
      
    } catch {
      // КРИТИЧНА ПОМИЛКА: повідомляємо про збій синхронізації
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'AI_Insights',
          message: 'КРИТИЧНА ПОМИЛКА СИНХРОНІЗАЦІЇ ІНСАЙТІВ. Активовано режим симуляції.',
          severity: 'critical',
          timestamp: new Date().toISOString(),
          code: 'INSIGHTS_FAILED'
        }
      }));

      // Fallback mocks
      setInsights([
        {
          id: 'ins-1',
          type: 'anomaly',
          priority: 'critical',
          title: 'Аномальна концентрація експорту в Сінгапур',
          description: 'Виявлено різкий стрибок обсягів (450%) поставок титанових сплавів через групу посередників з нульовим оборотом.',
          confidence: 94,
          impact: '$1.2M Ризику',
          category: 'Контрабанда',
          createdAt: new Date().toISOString(),
          actionable: true,
          actions: [{ label: 'БЛОКУВАТИ_КОД', type: 'primary' }, { label: 'АНАЛІЗ_ГРАФА', type: 'secondary' }],
          saved: false
        },
        {
          id: 'ins-2',
          type: 'prediction',
          priority: 'medium',
          title: 'Прогноз дефіциту паливно-мастильних матеріалів',
          description: 'Аналіз логістичних ланцюгів вказує на ймовірну затримку поставок у порт Одеси на 12 днів.',
          confidence: 82,
          impact: 'Логістичний збій',
          category: 'Енергетика',
          createdAt: new Date().toISOString(),
          actionable: false,
          saved: true
        },
        {
          id: 'ins-3',
          type: 'risk',
          priority: 'high',
          title: 'Офшорна мережа: підозрілий рух $47M через BVI',
          description: 'Виявлено 14 shell-компаній з ідентичними директорами. Транзакції відповідають схемі відмивання через Кіпр→BVI→ОАЕ.',
          confidence: 97,
          impact: '$47M Заблоковано',
          category: 'Фінансові злочини',
          createdAt: new Date().toISOString(),
          actionable: true,
          actions: [{ label: 'FREEZE_INITIATED', type: 'primary' }, { label: 'ПЕРЕДАТИ_ДО_НАБУ', type: 'secondary' }],
          saved: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const handleRefresh = async () => {
    SovereignAudio.playPulse();
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    SovereignAudio.playImpact();
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return insights;
    return insights.filter(i => i.type === filter);
  }, [insights, filter]);

  // ── РЕЖИМ ВІДЖЕТА ──────────────────────────────────────────────────────────────
  if (isWidgetMode) {
    return (
      <div className="flex flex-col h-full bg-[#0a0505]/95 backdrop-blur-xl border border-yellow-500/20 overflow-hidden rounded-[2rem] shadow-2xl relative">
        <WRAITH_Overlay />
        <div className="p-6 border-b border-yellow-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain size={16} className="text-yellow-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-yellow-500/80 italic">ІНСАЙТ_ХАБ</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-ping" />
            <span className="text-[8px] font-mono text-yellow-500/50 uppercase tracking-widest">WRAITH_ACTIVE</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
              <RefreshCw size={24} className="animate-spin text-yellow-500" />
              <span className="text-[8px] font-black uppercase tracking-widest">СИНХРОНІЗАЦІЯ_ЯДРА...</span>
            </div>
          ) : filtered.map((insight, idx) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => SovereignAudio.playPulse()}
              className="p-4 border border-white/5 hover:border-yellow-500/30 bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer group rounded-2xl"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] font-black uppercase tracking-widest italic" style={{ color: TYPE_CONFIG[insight.type]?.color }}>
                  {TYPE_CONFIG[insight.type]?.label}
                </span>
                <span className="text-[8px] font-mono text-slate-500">{insight.confidence}% MATCH</span>
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

  // ── ПОВНОСТОРІНКОВИЙ РЕЖИМ ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen text-slate-200 relative overflow-hidden font-sans bg-[#020202]">
      <AdvancedBackground mode="sovereign" />
      <WRAITH_Overlay />

      <div className="relative z-10 max-w-[1700px] mx-auto p-6 sm:p-12 space-y-12 pb-32">

        {/* ── ГОЛОВНИЙ ХЕДЕР ── */}
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-10">
          <div className="flex items-center gap-8">
            <div className="relative group cursor-pointer" onClick={() => SovereignAudio.playPulse()}>
              <div className="absolute inset-0 bg-yellow-500/10 blur-3xl rounded-full" />
              <div className="relative p-7 bg-black/60 border border-yellow-500/40 shadow-4xl rounded-[2.5rem] transition-all group-hover:border-yellow-500/80">
                <Brain size={48} className="text-yellow-500 drop-shadow-[0_0_20px_rgba(212,175,55,0.8)]" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full animate-ping border-4 border-black" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_10px_#d4af37]" />
                <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.8em] italic">
                  SOVEREIGN INTEL NEXUS · CLASSIFIED · v57.5-ELITE
                </span>
              </div>
              <h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-none italic">
                АНАЛІТИЧНИЙ{' '}
                <span className="text-yellow-500 drop-shadow-[0_0_30px_rgba(212,175,55,0.6)]">ОРАКУЛ</span>
              </h1>
              <p className="mt-4 text-[11px] text-slate-600 font-black uppercase tracking-[0.5em] flex items-center gap-4">
                <Lock size={14} className="text-yellow-500" /> АВТОНОМНИЙ_СИНТЕЗ_ДЕРЖАВНОЇ_СТРАТЕГІЇ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-10 py-5 bg-black/40 border-2 border-yellow-500/20 text-yellow-500 text-[10px] font-black tracking-[0.4em] uppercase hover:border-yellow-500/60 hover:text-white transition-all flex items-center gap-4 disabled:opacity-40 rounded-[1.5rem]"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'СИНТЕЗУЄМО...' : 'ГЛИБОКИЙ_СКАН_ЯДРА'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
              className="px-12 py-5 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black text-[10px] font-black tracking-[0.35em] uppercase shadow-[0_0_40px_rgba(212,175,55,0.3)] flex items-center gap-4 rounded-[1.5rem] border-none"
            >
              <Sparkles size={18} />
              СИТУАТИВНИЙ_ДЕКРЕТ
            </motion.button>
          </div>
        </div>

        {/* ── КЛЮЧОВІ МЕТРИКИ ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: 'СТРАТЕГІЧНИЙ ВПЛИВ',    value: '$2.4B',    sub: 'EFFECT_PROJECTION', icon: DollarSign, color: '#D4AF37' },
            { label: 'СИНЕРГІЯ МОДЕЛЕЙ',     value: '99.9%',    sub: 'HYPER_ALIGNMENT',   icon: Cpu,        color: '#B45309' },
            { label: 'СУВЕРЕННИЙ ГРАФ',     value: '1.4M',     sub: 'NODES_MAPPED',      icon: Network,    color: '#D4AF37' },
            { label: 'АВТОНОМНІСТЬ ЯДРА',    value: 'TIER-1',     sub: 'S-LEVEL_PROTOCOL',  icon: ShieldCheck, color: '#B45309' },
          ].map((stat) => (
            <TacticalCard key={stat.label} variant="holographic" className="p-10 bg-black/60 border-yellow-500/10 hover:border-yellow-500/30 transition-all rounded-[3rem] group overflow-hidden">
               <div className="absolute right-0 bottom-0 opacity-[0.02] group-hover:opacity-[0.08] transition-all duration-700">
                  <stat.icon size={160} />
               </div>
               <div className="relative z-10 space-y-4">
                  <p className="text-[9px] font-black text-slate-500 tracking-[0.5em] uppercase">{stat.label}</p>
                  <h3 className="text-4xl font-black text-white italic tracking-tighter">{stat.value}</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-3 bg-yellow-500/40" />
                    <p className="text-[10px] text-yellow-600/60 font-black uppercase tracking-[0.3em] font-mono">{stat.sub}</p>
                  </div>
               </div>
            </TacticalCard>
          ))}
        </div>

        {/* ── ФІЛЬТРАЦІЯ СЕКТОРІВ ── */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-black/40 border border-white/5 w-fit rounded-[2rem] shadow-2xl backdrop-blur-3xl relative">
          <ScanningHUD />
          <button
            onClick={() => { SovereignAudio.playPulse(); setFilter('all'); }}
            className={cn(
              "px-8 py-3.5 text-[10px] font-black uppercase tracking-[0.4em] transition-all rounded-xl italic",
              filter === 'all'
                ? "bg-yellow-500 text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                : "text-slate-600 hover:text-yellow-500 hover:bg-yellow-500/5"
            )}
          >
            УСІ СИГНАЛИ
          </button>
          <div className="w-px h-8 bg-white/10 mx-2" />
          {Object.entries(TYPE_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => { SovereignAudio.playPulse(); setFilter(key as InsightType); }}
              className={cn(
                "flex items-center gap-3 px-7 py-3.5 text-[10px] font-black uppercase tracking-[0.3em] transition-all border-2 border-transparent rounded-xl italic",
                filter === key
                  ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/30 shadow-inner"
                  : "text-slate-700 hover:text-white"
              )}
            >
              <config.icon size={16} />
              {config?.label}
            </button>
          ))}
        </div>

        {/* ── ОСНОВНЕ РОБОЧЕ ПОЛЕ ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Контент інсайтів */}
          <div className="lg:col-span-8 space-y-10">
            <AnimatePresence mode="popLayout">
              {loading || refreshing ? (
                <div className="py-72 flex flex-col items-center justify-center text-center space-y-12">
                  <div className="relative">
                    <div className="absolute inset-0 bg-yellow-500/5 blur-[120px] rounded-full animate-pulse" />
                    <CyberOrb size={100} color="#D4AF37" />
                  </div>
                  <div className="space-y-4">
                    <p className="text-yellow-500/60 font-black tracking-[1em] uppercase text-[11px] animate-pulse italic">
                      СИНТЕЗ_ДЕРЖАВНОГО_ВИСНОВКУ_ELITE...
                    </p>
                    <p className="text-[9px] font-mono text-slate-800 tracking-[0.5em] font-black uppercase">
                      ANALYSIS_ITERATION: 0xF72A9
                    </p>
                  </div>
                </div>
              ) : filtered.length > 0 ? (
                filtered.map((insight, idx) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ delay: idx * 0.08 }}
                  >
                    <TacticalCard
                      variant="holographic"
                      className="p-12 group overflow-hidden bg-black/60 relative border-yellow-500/5 hover:border-yellow-500/20 transition-all rounded-[3.5rem] shadow-4xl"
                    >
                      <div className="absolute left-0 top-0 w-2 h-full bg-gradient-to-b from-yellow-500/40 to-transparent" />
                      
                      <div className="flex flex-col md:flex-row gap-12 relative z-10">
                        {/* Маркер типу */}
                        <div className="flex flex-col items-center gap-6 shrink-0">
                          <div className="relative group-hover:scale-110 transition-transform duration-500">
                             <div className="absolute inset-0 bg-yellow-500/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                             <div className="w-24 h-24 flex items-center justify-center bg-[#0a0505] border border-yellow-500/20 rounded-[2rem] shadow-2xl relative z-10">
                                {React.createElement(TYPE_CONFIG[insight.type].icon, {
                                  size: 44,
                                  style: { color: TYPE_CONFIG[insight.type].color }
                                })}
                             </div>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-[0.4em] italic opacity-60" style={{ color: TYPE_CONFIG[insight.type]?.color }}>
                            {TYPE_CONFIG[insight.type]?.label}
                          </span>
                        </div>

                        {/* Контент */}
                        <div className="flex-1 space-y-8">
                          <div className="flex items-center gap-6 flex-wrap">
                             <span className="bg-yellow-500/10 text-yellow-500 text-[9px] font-black px-5 py-2 uppercase tracking-[0.4em] border border-yellow-500/20 rounded-xl italic">
                               {PRIORITY_CONFIG[insight.priority]?.label}
                             </span>
                             <div className="flex items-center gap-3 text-[10px] font-mono text-slate-600 font-bold uppercase tracking-widest">
                               <Radar size={14} className="text-yellow-600" />
                               CONFIDENCE: <span className="text-slate-300">{insight.confidence}%</span>
                             </div>
                             <div className="flex items-center gap-3 text-[10px] font-mono text-slate-700 font-bold">
                               <Clock size={14} />
                               {new Date(insight.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                             </div>
                          </div>

                          <div className="space-y-5">
                            <h3 className="text-4xl font-black text-white italic tracking-tighter group-hover:text-yellow-500 transition-colors uppercase leading-tight">
                              {insight.title}
                            </h3>
                            <p className="text-[15px] text-slate-400 font-medium leading-relaxed max-w-3xl">
                              {insight.description}
                            </p>
                          </div>

                          <div className="pt-8 border-t border-white/5 flex flex-wrap items-center justify-between gap-8">
                             <div className="flex items-center gap-12 text-[12px] font-black tracking-tight italic uppercase">
                                <div className="flex items-center gap-3 text-yellow-500">
                                   <DollarSign size={18} />
                                   {insight.impact}
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                   <Layers size={18} className="text-amber-600" />
                                   {insight.category}
                                </div>
                             </div>

                             <div className="flex items-center gap-4">
                               {insight.actionable && insight.actions?.map((act, i) => (
                                 <button key={i} 
                                   onClick={() => SovereignAudio.playPulse()}
                                   className={cn(
                                   "px-10 py-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all rounded-[1.5rem] italic",
                                   act.type === 'primary' 
                                     ? "bg-yellow-500 text-black hover:brightness-110 shadow-2xl" 
                                     : "bg-black/40 text-slate-500 border border-white/10 hover:border-yellow-500/40 hover:text-white"
                                 )}>
                                   {act.label}
                                 </button>
                               ))}
                             </div>
                          </div>
                        </div>

                        {/* Керування */}
                        <div className="flex flex-row md:flex-col gap-5 justify-center md:pl-10 md:border-l border-white/5 shrink-0">
                           <motion.button 
                             whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                             onClick={() => {
                               SovereignAudio.playPulse();
                               setInsights(prev => prev.map(i => i.id === insight.id ? { ...i, saved: !i.saved } : i));
                             }}
                             className={cn(
                               "p-6 border-2 transition-all rounded-[2.5rem] shadow-xl",
                               insight.saved ? "bg-yellow-500 border-transparent text-black" : "bg-black/60 border-yellow-500/10 text-slate-800 hover:text-yellow-500 hover:border-yellow-500/40"
                             )}
                           >
                             <Bookmark size={24} fill={insight.saved ? "currentColor" : "none"} />
                           </motion.button>
                           <div className="flex flex-row md:flex-col gap-4">
                              <button onClick={() => SovereignAudio.playPulse()} className="p-4 bg-black/40 border-2 border-white/5 text-slate-800 hover:text-emerald-500 hover:border-emerald-500/30 rounded-2xl transition-all">
                                <ThumbsUp size={18} />
                              </button>
                              <button onClick={() => SovereignAudio.playPulse()} className="p-4 bg-black/40 border-2 border-white/5 text-slate-800 hover:text-amber-500 hover:border-amber-500/30 rounded-2xl transition-all">
                                <ThumbsDown size={18} />
                              </button>
                           </div>
                        </div>
                      </div>
                    </TacticalCard>
                  </motion.div>
                ))
              ) : (
                <div className="py-72 flex flex-col items-center justify-center border-4 border-dashed border-yellow-500/5 rounded-[5rem] bg-black/10">
                   <Radar size={80} className="text-yellow-900/30 mb-8" />
                   <p className="text-slate-800 font-black uppercase tracking-[1em] text-[14px] italic">ГОРИЗОНТ_ПОДІЙ_ПУСТИЙ</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* ── ПАНЕЛЬ ДОДАТКОВИХ МОНІТОРІВ ── */}
          <div className="lg:col-span-4 space-y-12">
            
            {/* ЯДРО ОРАКУЛА */}
            <HoloContainer className="p-10 flex flex-col items-center justify-center min-h-[500px] bg-black/80 border-yellow-500/20 rounded-[4rem] shadow-4xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/[0.03] to-transparent pointer-events-none" />
               <div className="relative mb-12">
                  <div className="absolute inset-0 bg-yellow-500/10 blur-[80px] rounded-full group-hover:scale-150 transition-transform duration-[3s]" />
                  <CyberOrb size={100} color="#D4AF37" />
               </div>
               <div className="text-center space-y-4">
                  <p className="text-[10px] font-black text-yellow-600/40 uppercase tracking-[1em]">PREDATOR_CORE</p>
                  <h3 className="text-5xl font-black text-white italic tracking-tighter uppercase">СИНТЕЗ_WRAITH</h3>
                  <div className="flex items-center gap-3 px-6 py-2 bg-yellow-500/5 border border-yellow-500/20 rounded-full w-fit mx-auto mt-8">
                     <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-ping" />
                     <span className="text-[9px] font-black font-mono text-yellow-500 uppercase tracking-widest italic">A-STATUS: SUPREME</span>
                  </div>
               </div>
            </HoloContainer>

            {/* МОНІТОР СИСТЕМ */}
            <TacticalCard variant="cyber" className="p-12 bg-black/60 border-yellow-500/5 rounded-[4.5rem] shadow-3xl">
               <h4 className="text-[10px] font-black text-yellow-500/60 uppercase tracking-[0.7em] mb-10 flex items-center gap-4 italic font-bold">
                 <Activity size={18} className="text-yellow-500" />
                 STAT_MONITOR_v57.5
               </h4>
               <div className="space-y-8">
                 {[
                   { label: 'SOVEREIGN_SCAN', status: 'ACTIVE', val: '99.9%', color: '#D4AF37' },
                   { label: 'NEURAL_DECODING', status: 'ULTRA', val: '1.4B/s', color: '#B45309' },
                   { label: 'HYPOTHESIS_GEN', status: 'ELITE', val: 'READY', color: '#D4AF37' }
                 ].map(sys => (
                   <div key={sys.label} className="border-b border-white/5 pb-6">
                      <div className="flex items-center justify-between mb-3">
                         <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{sys.label}</span>
                         <span className="text-[10px] font-black font-mono text-white tracking-widest italic" style={{ color: sys.color }}>{sys.status}</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 overflow-hidden rounded-full">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: sys.val === 'READY' ? '100%' : sys.val }}
                           className="h-full bg-yellow-500/60 shadow-[0_0_10px_rgba(212,175,55,0.4)]"
                         />
                      </div>
                   </div>
                 ))}
               </div>
            </TacticalCard>

            {/* ГЛОБАЛЬНИЙ СКАНЕР */}
            <div className="relative h-[380px] bg-black border border-yellow-500/10 rounded-[4.5rem] overflow-hidden group shadow-4xl flex flex-col items-center justify-center">
                <div className="absolute inset-0 bg-yellow-500/[0.02] pointer-events-none" />
                <div className="relative w-64 h-64 flex items-center justify-center">
                   <div className="absolute inset-0 border border-yellow-900/30 rounded-full" />
                   <div className="absolute inset-8 border border-white/5 rounded-full" />
                   <motion.div 
                     className="absolute inset-0 border-t-2 border-yellow-500 rounded-full"
                     animate={{ rotate: 360 }}
                     transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                   />
                   <Radar size={64} className="text-yellow-500/40 opacity-40 group-hover:opacity-100 transition-all duration-1000 scale-125" />
                </div>
                <div className="mt-10 text-center">
                   <p className="text-[11px] font-black text-yellow-600/60 uppercase tracking-[1em] italic">SCAN_RADAR_ELITE</p>
                </div>
            </div>

          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.1); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212, 175, 55, 0.2); }
      `}} />
    </div>
  );
};

export default AIInsightsHub;
