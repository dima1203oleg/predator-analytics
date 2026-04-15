/**
 * 🎯 AI Sovereign Intelligence Nexus | v56.5-ELITE
 * PREDATOR — Модуль ШІ-Аналізу Вищого Рівня Секретності
 *
 * Автономна генерація аналітичних висновків, виявлення аномалій та прогнозування.
 * Sovereign Power Design System · Classified Intelligence · Tier-1 Access
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Sparkles, AlertTriangle, Target, Lightbulb, Zap,
  Clock, DollarSign, Shield, ArrowRight, TrendingUp, TrendingDown,
  RefreshCw, Bookmark, ThumbsUp, ThumbsDown, Crosshair, Radar,
  Activity, ArrowUpRight, Flame, Layers, Search, BarChart3,
  Rocket, Globe, Cpu, Network, ShieldCheck, Info, Fingerprint
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { apiClient as api } from '@/services/api/config';
import { TacticalCard } from '@/components/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { HoloContainer } from '@/components/HoloContainer';
import { CyberOrb } from '@/components/CyberOrb';
import { AdvancedBackground } from '@/components/AdvancedBackground';

// ========================
// Types & Configuration
// ========================

type InsightType = 'prediction' | 'anomaly' | 'opportunity' | 'risk' | 'recommendation';
type InsightPriority = 'critical' | 'high' | 'medium' | 'low';

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

// v56.5-ELITE Sovereign Palette: Gold (#D4AF37) & Rose (#E11D48)
const TYPE_CONFIG = {
  prediction:     { icon: Brain,       color: '#D4AF37', label: 'Прогноз' },
  anomaly:        { icon: Activity,    color: '#E11D48', label: 'Аномалія' },
  opportunity:    { icon: Lightbulb,   color: '#F59E0B', label: 'Можливість' },
  risk:           { icon: Shield,      color: '#E11D48', label: 'Ризик' },
  recommendation: { icon: Target,      color: '#D4AF37', label: 'Рекомендація' }
};

const PRIORITY_CONFIG = {
  critical: { color: '#E11D48', label: 'КРИТИЧНО' },
  high:     { color: '#F59E0B', label: 'ВИСОКИЙ' },
  medium:   { color: '#D4AF37', label: 'СЕРЕДНІЙ' },
  low:      { color: '#475569', label: 'НИЗЬКИЙ' }
};

interface AIInsightsHubProps {
  isWidgetMode?: boolean;
}

const AIInsightsHub: React.FC<AIInsightsHubProps> = ({ isWidgetMode = false }) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<InsightType | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/intelligence/insights');
      setInsights(Array.isArray(res.data) ? res.data : []);
    } catch {
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
        },
        {
          id: 'ins-4',
          type: 'recommendation',
          priority: 'high',
          title: 'INTERPOL RED NOTICE: 3 об\'єктів активні в системі',
          description: 'Три фізичні особи з активними Red Notice зафіксовані у транзакціях митниці. Невідоме місцезнаходження.',
          confidence: 91,
          impact: 'Правоохоронний контекст',
          category: 'Санкції',
          createdAt: new Date().toISOString(),
          actionable: true,
          actions: [{ label: 'СПОТИТИ_ІНТЕРПОЛ', type: 'primary' }],
          saved: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return insights;
    return insights.filter(i => i.type === filter);
  }, [insights, filter]);

  // ── Widget Mode ──────────────────────────────────────────────────────────────
  if (isWidgetMode) {
    return (
      <div className="flex flex-col h-full backdrop-blur-[40px] border border-yellow-500/20 overflow-hidden rounded-3xl transition-all shadow-3xl"
           style={{ background: 'linear-gradient(180deg,rgba(5,2,2,0.95) 0%,rgba(10,5,5,0.92) 100%)' }}>
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent shadow-[0_0_15px_#d4af37]" />
        <div className="p-6 border-b border-yellow-500/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-lg shadow-inner">
              <Brain size={16} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-yellow-500/80">ШІ_АНАЛІЗ · ELITE</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping shadow-[0_0_10px_#d4af37]" />
            <span className="text-[8px] font-black text-yellow-500/70 tracking-[0.3em]">LIVE</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 bg-black/40">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-6 opacity-60">
              <RefreshCw size={32} className="animate-spin text-yellow-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-yellow-600">СИНКРОНІЗАЦІЯ_ЯДРА...</span>
            </div>
          ) : filtered.slice(0, 8).map((insight, idx) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-5 border border-white/5 hover:border-yellow-500/30 bg-white/[0.01] hover:bg-white/[0.03] transition-all cursor-pointer group rounded-2xl relative overflow-hidden shadow-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: PRIORITY_CONFIG[insight.priority]?.color || '#fff' }} />
                  <span className="text-[9px] font-black uppercase tracking-widest italic" style={{ color: TYPE_CONFIG[insight.type]?.color || '#d4af37' }}>
                    {TYPE_CONFIG[insight.type]?.label || insight.type}
                  </span>
                </div>
                <span className="text-[8px] font-mono text-slate-500 font-black">{insight.confidence}% MATCH</span>
              </div>
              <h4 className="text-[11px] font-black text-slate-300 group-hover:text-white transition-colors uppercase leading-snug line-clamp-2 italic">
                {insight.title}
              </h4>
              <div className="mt-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                <span className="text-[8px] font-black text-yellow-600 uppercase tracking-[0.4em]">ФОРМУВАТИ_ДЕКРЕТ</span>
                <ArrowRight size={12} className="text-yellow-500" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // ── Full Page Mode ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen text-slate-200 relative overflow-hidden font-sans bg-[#020202]">
      <AdvancedBackground mode="sovereign" />

      <div className="relative z-10 max-w-[1700px] mx-auto p-6 sm:p-12 space-y-12 pb-32">

        {/* ── ЗАГОЛОВОК ELITE ── */}
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-10">
          <div className="flex items-center gap-8">
            <div className="relative group cursor-pointer">
              <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full group-hover:scale-125 transition-transform duration-1000" />
              <div className="relative p-7 bg-black border border-yellow-500/40 shadow-4xl rounded-[2.5rem] transition-all group-hover:border-yellow-500/80">
                <Brain size={48} className="text-yellow-500 drop-shadow-[0_0_20px_rgba(212,175,55,0.8)]" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full animate-ping border-4 border-black" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_10px_#d4af37]" />
                <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.8em]">
                  SOVEREIGN INTEL NEXUS · CLASSIFIED · v56.5-ELITE
                </span>
              </div>
              <h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-none italic">
                АНАЛІТИЧНИЙ{' '}
                <span className="text-yellow-500 drop-shadow-[0_0_30px_rgba(212,175,55,0.6)]">NEXUS</span>
              </h1>
              <p className="mt-3 text-[12px] text-slate-600 font-black uppercase tracking-[0.5em] flex items-center gap-4">
                <Fingerprint size={16} className="text-yellow-500" /> АВТОНОМНИЙ_СИНТЕЗ_ДЕРЖАВНОЇ_СТРАТЕГІЇ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-10 py-5 bg-black/60 backdrop-blur-xl border-2 border-yellow-500/20 text-yellow-500 text-[11px] font-black tracking-[0.4em] uppercase hover:border-yellow-500/60 hover:text-white transition-all flex items-center gap-4 disabled:opacity-40 rounded-2xl shadow-2xl"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin text-yellow-500' : ''} />
              {refreshing ? 'ПІДКЛЮЧЕННЯ...' : 'ГЛИБОКИЙ_СКАН'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }}
              className="px-12 py-5 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black text-[11px] font-black tracking-[0.35em] uppercase shadow-[0_0_50px_rgba(212,175,55,0.4)] flex items-center gap-4 group transition-all border-none rounded-2xl hover:brightness-110"
            >
              <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
              СИТУАТИВНИЙ_ДЕКРЕТ
            </motion.button>
          </div>
        </div>

        {/* ── СТАТИСТИКА ELITE ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: 'СТРАТЕГІЧНИЙ ВПЛИВ',    value: '$2.4B',    sub: 'Очікуваний ефект v56.5',   icon: DollarSign, color: '#D4AF37' },
            { label: 'СИНЕРГІЯ МОДЕЛЕЙ',     value: '99.9%',    sub: 'Titan-Alpha Integration', icon: Target,     color: '#E11D48' },
            { label: 'СУВЕРЕННИЙ ГРАФ',     value: '1.4M Вузлів', sub: 'Глобальне охоплення',   icon: Network,    color: '#D4AF37' },
            { label: 'АВТОНОМНІСТЬ ЯДРА',    value: 'TIER-1',     sub: 'Zero Human Intervention', icon: ShieldCheck, color: '#F59E0B' },
          ].map((stat) => (
            <TacticalCard key={stat.label} variant="holographic" className="p-10 relative group overflow-hidden bg-black/60 border-yellow-500/10 hover:border-yellow-500/40 transition-all rounded-[3rem]">
              <div className="absolute -right-8 -bottom-8 p-6 opacity-[0.03] group-hover:opacity-10 transition-all duration-1000">
                <stat.icon size={140} style={{ color: stat.color }} />
              </div>
              <div className="space-y-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: stat.color }} />
                  <p className="text-[9px] font-black text-slate-500 tracking-[0.5em] uppercase">{stat.label}</p>
                </div>
                <h3 className="text-4xl font-black text-white tracking-tighter font-mono italic">{stat.value}</h3>
                <p className="text-[10px] text-yellow-600/60 font-black uppercase tracking-[0.3em]">{stat.sub}</p>
              </div>
            </TacticalCard>
          ))}
        </div>

        {/* ── ФІЛЬТРИ ELITE ── */}
        <div className="flex flex-wrap items-center gap-4 p-3 backdrop-blur-3xl border-2 border-white/5 w-fit rounded-[2rem] bg-black/40 shadow-2xl">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              "px-8 py-3 text-[10px] font-black uppercase tracking-[0.4em] transition-all rounded-xl italic",
              filter === 'all'
                ? "bg-yellow-500 text-black shadow-[0_0_20px_rgba(212,175,55,0.5)]"
                : "text-slate-500 hover:text-yellow-500 hover:bg-yellow-500/5"
            )}
          >
            УСІ СИГНАЛИ
          </button>
          <div className="w-px h-8 bg-white/10 mx-2" />
          {Object.entries(TYPE_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setFilter(key as InsightType)}
              className={cn(
                "flex items-center gap-3 px-7 py-3 text-[10px] font-black uppercase tracking-[0.3em] transition-all border-2 border-transparent rounded-xl italic",
                filter === key
                  ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                  : "text-slate-600 hover:text-white hover:bg-white/5"
              )}
            >
              <config.icon size={16} />
              {config?.label}
            </button>
          ))}
        </div>

        {/* ── ОСНОВНИЙ КОНТЕНТ ELITE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Картки інсайтів */}
          <div className="lg:col-span-8 space-y-8">
            <AnimatePresence mode="popLayout">
              {loading ? (
                <div className="py-64 flex flex-col items-center justify-center text-center space-y-10">
                  <div className="relative scale-150">
                    <div className="absolute inset-0 bg-yellow-500/10 blur-[100px] animate-pulse rounded-full" />
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}>
                      <Radar size={120} className="text-yellow-700 opacity-20" />
                    </motion.div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <p className="text-yellow-500/60 font-black tracking-[1em] uppercase text-[11px] animate-pulse">
                      СИНТЕЗ_ДЕРЖАВНОГО_ВИСНОВКУ...
                    </p>
                    <p className="text-[10px] font-mono text-slate-800 font-bold tracking-[0.5em]">ОБРОБКА СУВЕРЕННИХ ШЛЯХІВ v56.5</p>
                  </div>
                </div>
              ) : filtered.length > 0 ? (
                filtered.map((insight, idx) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: idx * 0.08 }}
                  >
                    <TacticalCard
                      variant="holographic"
                      className="p-10 group overflow-hidden bg-black/60 relative border-white/5 hover:border-yellow-500/30 transition-all rounded-[3rem] shadow-3xl"
                    >
                      <div className="absolute -top-32 -right-32 w-96 h-96 bg-yellow-500/5 blur-[120px] pointer-events-none group-hover:bg-yellow-500/10 transition-all duration-1000" />
                      <div className="absolute left-0 top-0 w-1.5 h-full bg-gradient-to-b from-yellow-500 to-transparent opacity-30" />

                      <div className="flex flex-col md:flex-row gap-10 relative z-10">

                        {/* Тип іконка */}
                        <div className="flex flex-col items-center gap-4 shrink-0">
                          <div className="relative">
                            <div className="absolute inset-0 opacity-20 blur-2xl rounded-full" style={{ backgroundColor: TYPE_CONFIG[insight.type]?.color }} />
                            <div
                              className="w-24 h-24 flex items-center justify-center border-2 shadow-inner transition-all group-hover:scale-110 bg-black rounded-3xl"
                              style={{ borderColor: `${TYPE_CONFIG[insight.type]?.color}40` }}
                            >
                              {TYPE_CONFIG[insight.type].icon && React.createElement(TYPE_CONFIG[insight.type].icon, {
                                size: 40,
                                style: { color: TYPE_CONFIG[insight.type].color }
                              })}
                            </div>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] italic" style={{ color: TYPE_CONFIG[insight.type]?.color }}>
                            {TYPE_CONFIG[insight.type]?.label}
                          </span>
                        </div>

                        {/* Основний контент */}
                        <div className="flex-1 space-y-6">
                          <div className="flex items-center gap-4 flex-wrap">
                            <span
                              className="text-[9px] font-black px-4 py-1.5 uppercase tracking-[0.4em] border-2 rounded-xl"
                              style={{ color: PRIORITY_CONFIG[insight.priority]?.color, borderColor: `${PRIORITY_CONFIG[insight.priority]?.color}30`, backgroundColor: `${PRIORITY_CONFIG[insight.priority]?.color}08` }}
                            >
                              {PRIORITY_CONFIG[insight.priority]?.label}
                            </span>
                            <div className="flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/5 rounded-xl">
                              <Target size={14} className="text-yellow-500" />
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono">
                                MATCH: <span className="text-yellow-500">{insight.confidence}%</span>
                              </span>
                            </div>
                            <div className="flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/5 rounded-xl text-slate-700">
                              <Clock size={14} />
                              <span className="text-[9px] font-black font-mono">
                                {new Date(insight.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-3xl font-black text-white tracking-tighter group-hover:text-yellow-500 transition-colors uppercase leading-tight italic">
                              {insight.title}
                            </h3>
                            <p className="text-[14px] text-slate-400 leading-relaxed tracking-tight font-medium opacity-80">
                              {insight.description}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-8 pt-8 border-t border-white/5">
                            <div className="flex items-center gap-10">
                              <div className="flex items-center gap-3 text-[12px] font-black text-slate-300 uppercase tracking-tight italic">
                                <DollarSign size={18} className="text-yellow-500" />
                                {insight.impact}
                              </div>
                              <div className="flex items-center gap-3 text-[12px] font-black text-slate-500 uppercase tracking-tight">
                                <Layers size={18} className="text-rose-500" />
                                {insight.category}
                              </div>
                            </div>

                            {insight.actionable && insight.actions && (
                              <div className="flex items-center gap-4">
                                {insight.actions.map((act, i) => (
                                  <button key={i} className={cn(
                                    "px-8 py-3.5 text-[10px] font-black uppercase tracking-[0.3em] transition-all border-2 rounded-2xl italic",
                                    act.type === 'primary'
                                      ? "bg-yellow-500 text-black border-transparent hover:brightness-110 shadow-xl"
                                      : "bg-black text-slate-500 border-white/10 hover:border-yellow-500/30 hover:text-white"
                                  )}>
                                    {act.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-row md:flex-col gap-4 justify-center border-t md:border-t-0 md:border-l border-white/5 pt-8 md:pt-0 md:pl-10 shrink-0">
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: -5 }} whileTap={{ scale: 0.9 }}
                            onClick={() => setInsights(prev => prev.map(i => i.id === insight.id ? { ...i, saved: !i.saved } : i))}
                            className={cn(
                              "p-5 border-2 transition-all rounded-3xl",
                              insight.saved
                                ? "bg-yellow-500 text-black border-transparent shadow-2xl"
                                : "bg-white/5 border-white/5 text-slate-700 hover:text-yellow-500 hover:border-yellow-500/40 shadow-inner"
                            )}
                          >
                            <Bookmark size={20} fill={insight.saved ? "currentColor" : "none"} />
                          </motion.button>
                          <div className="flex md:flex-col gap-4">
                            <motion.button
                              whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.9 }}
                              className="p-4 border-2 bg-white/5 border-white/5 text-slate-700 hover:text-emerald-400 hover:border-emerald-500/30 rounded-2xl transition-all"
                            >
                              <ThumbsUp size={18} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1, y: 2 }} whileTap={{ scale: 0.9 }}
                              className="p-4 border-2 bg-white/5 border-white/5 text-slate-700 hover:text-rose-500 hover:border-rose-500/30 rounded-2xl transition-all"
                            >
                              <ThumbsDown size={18} />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </TacticalCard>
                  </motion.div>
                ))
              ) : (
                <div className="py-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[4rem] bg-black/20">
                  <Radar size={80} className="text-yellow-900/40 mb-8 animate-pulse" />
                  <p className="text-slate-800 font-black uppercase tracking-[1em] text-[13px] italic">
                    ГОРИЗОНТ_ПОДІЙ_ПУСТИЙ
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* ── ПРАВА ПАНЕЛЬ ELITE ── */}
          <div className="lg:col-span-4 space-y-10">

            {/* CyberOrb — sovereign gold/rose */}
            <HoloContainer className="flex items-center justify-center p-6 min-h-[450px] relative overflow-hidden border-yellow-500/20 bg-black/80 rounded-[4rem] shadow-4xl">
              <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/5 to-transparent" />
              <CyberOrb size={320} color="#D4AF37" className="opacity-80" />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <div className="text-[10px] font-black text-yellow-600/40 uppercase tracking-[1em] mb-4">PREDATOR_CORE</div>
                <div className="text-4xl font-black text-white tracking-tighter italic uppercase">СИНТЕЗ_ELITE</div>
                <div className="mt-8 flex items-center gap-3 px-5 py-2 bg-white/5 rounded-full border border-white/5">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse shadow-[0_0_10px_#d4af37]" />
                  <span className="text-[9px] font-black font-mono text-yellow-500 uppercase tracking-widest">A-STATUS: ACTIVE</span>
                </div>
              </div>
            </HoloContainer>

            {/* Нейронна активність — sovereign */}
            <TacticalCard variant="cyber" className="p-10 bg-black/60 border-white/5 rounded-[4rem] shadow-3xl">
              <h3 className="text-[10px] font-black text-yellow-500/80 uppercase tracking-[0.6em] mb-10 flex items-center gap-4 italic font-bold">
                <Activity size={18} className="text-yellow-500" />
                STATUS_MONITOR_v56.5
              </h3>
              <div className="space-y-6">
                {[
                  { label: 'SOVEREIGN_SCAN_v56',    status: 'OPTIMIZED',  val: '99.9%',  color: '#D4AF37' },
                  { label: 'NEURAL_DECODER',     status: 'INTENSE',     val: '1.4B/s', color: '#F59E0B' },
                  { label: 'HYPOTHESIS_GEN',     status: 'CLASSIFIED',  val: 'X-ELITE', color: '#E11D48' },
                  { label: 'STRATEGIC_ALIGN',    status: 'READY',       val: '100%',   color: '#34d399' }
                ].map((item) => (
                  <div key={item.label}
                    className="p-6 bg-black border border-white/5 flex items-center justify-between group hover:border-yellow-500/30 hover:bg-white/[0.02] transition-all rounded-3xl shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: item.color }} />
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.1em] group-hover:text-white transition-colors">
                        {item.label}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest mb-1 italic opacity-60" style={{ color: item.color }}>{item.status}</p>
                      <p className="text-sm font-black text-white font-mono tracking-tighter">{item.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TacticalCard>

            {/* Глобальний радар — sovereign gold */}
            <HoloContainer className="p-10 h-[350px] flex flex-col items-center justify-center overflow-hidden border-yellow-500/20 group bg-black rounded-[4rem] relative">
              <div className="absolute inset-0 bg-yellow-500/[0.02] pointer-events-none" />
              <div className="relative w-56 h-56">
                <div className="absolute inset-0 border-2 border-yellow-900/30 rounded-full group-hover:border-yellow-500/40 transition-all duration-1000" />
                <div className="absolute inset-6 border border-yellow-900/20 rounded-full animate-pulse" />
                <div className="absolute inset-12 border border-white/5 rounded-full" />
                <motion.div
                  className="absolute inset-0 border-t-2 border-yellow-500 rounded-full shadow-[0_0_20px_#d4af37]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Radar size={56} className="text-yellow-500 opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                </div>
              </div>
              <div className="mt-8 text-center relative z-10">
                <p className="text-[10px] font-black text-yellow-500/80 uppercase tracking-[0.8em] mb-2 italic">SCAN_RADAR_ELITE</p>
                <div className="flex items-center gap-3 justify-center">
                   <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-ping" />
                   <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">TARGET_ACQUISITION_MODE</p>
                </div>
              </div>
            </HoloContainer>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.15); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212, 175, 55, 0.3); }
      `}} />
    </div>
  );
};

export default AIInsightsHub;
