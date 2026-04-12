/**
 * 🎯 AI Sovereign Intelligence Nexus | v56.4
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
  Rocket, Globe, Cpu, Network, ShieldCheck, Info
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { apiClient as api } from '@/services/api/config';
import { TacticalCard } from '@/components/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { HoloContainer } from '@/components/HoloContainer';
import { CyberOrb } from '@/components/CyberOrb';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { Badge } from '@/components/ui/badge';

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

// Sovereign Red / Crimson палітра — ніяких indigo/violet
const TYPE_CONFIG = {
  prediction:     { icon: Brain,       color: '#dc2626', label: 'Прогноз' },
  anomaly:        { icon: Activity,    color: '#ef4444', label: 'Аномалія' },
  opportunity:    { icon: Lightbulb,   color: '#b45309', label: 'Можливість' },
  risk:           { icon: Shield,      color: '#f59e0b', label: 'Ризик' },
  recommendation: { icon: Target,      color: '#991b1b', label: 'Рекомендація' }
};

const PRIORITY_CONFIG = {
  critical: { color: '#ef4444', label: 'КРИТИЧНО' },
  high:     { color: '#f59e0b', label: 'ВИСОКИЙ' },
  medium:   { color: '#b45309', label: 'СЕРЕДНІЙ' },
  low:      { color: '#6b7280', label: 'НИЗЬКИЙ' }
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
          actions: [{ label: 'Блокувати код', type: 'primary' }, { label: 'Аналіз графа', type: 'secondary' }],
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
          actions: [{ label: 'FREEZE INITIATED', type: 'primary' }, { label: 'Передати до НАБУ', type: 'secondary' }],
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
          actions: [{ label: 'Сповістити ІНТЕРПОЛ', type: 'primary' }],
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
      <div className="flex flex-col h-full backdrop-blur-3xl border border-red-900/30 overflow-hidden"
           style={{ background: 'linear-gradient(180deg,rgba(5,2,2,0.98) 0%,rgba(8,3,3,0.96) 100%)' }}>
        {/* Верхня accent лінія */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-red-700/50 to-transparent" />
        <div className="p-5 border-b border-red-900/25 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-900/30 border border-red-800/40 text-red-600">
              <Brain size={15} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-red-700/80">ШІ_АНАЛІЗ · CLASSIFIED</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_6px_rgba(220,38,38,0.8)]" />
            <span className="text-[7px] font-black text-red-700/70 tracking-widest">НАЖИВО</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
              <RefreshCw size={28} className="animate-spin text-red-700" />
              <span className="text-[9px] font-black uppercase tracking-widest text-red-800">Сканування мережі...</span>
            </div>
          ) : filtered.slice(0, 8).map((insight, idx) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="p-4 border border-red-900/20 hover:border-red-700/40 bg-red-950/10 hover:bg-red-950/20 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PRIORITY_CONFIG[insight.priority]?.color || '#fff' }} />
                  <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: TYPE_CONFIG[insight.type]?.color || '#dc2626' }}>
                    {TYPE_CONFIG[insight.type]?.label || insight.type}
                  </span>
                </div>
                <span className="text-[7px] font-mono text-slate-600">{insight.confidence}% ВПЕВН.</span>
              </div>
              <h4 className="text-[10px] font-black text-slate-300 group-hover:text-white transition-colors uppercase leading-snug line-clamp-2">
                {insight.title}
              </h4>
              <div className="mt-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[7px] font-black text-red-800 uppercase tracking-widest">ДЕТАЛІ</span>
                <ArrowRight size={10} className="text-red-600" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // ── Full Page Mode ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen text-slate-200 relative overflow-hidden font-sans">
      <AdvancedBackground />

      <div className="relative z-10 max-w-[1700px] mx-auto p-4 sm:p-10 space-y-10 pb-24">

        {/* ── ЗАГОЛОВОК ── */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            {/* Іконка модулю */}
            <div className="relative group cursor-pointer">
              <div className="absolute inset-0 bg-red-700/20 blur-2xl rounded-full group-hover:scale-125 transition-transform" />
              <div className="relative p-5 bg-black border border-red-800/40 shadow-2xl shadow-red-950/50">
                <Brain size={40} className="text-red-600 drop-shadow-[0_0_12px_rgba(220,38,38,0.6)]" />
                <div className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full animate-pulse" />
              </div>
            </div>
            {/* Текст */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1 h-1 bg-red-700 rounded-full animate-pulse" />
                <span className="text-[8px] font-black text-red-700/80 uppercase tracking-[0.55em]">
                  SOVEREIGN AI · CLASSIFIED INTELLIGENCE · v56.4
                </span>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-tight">
                АНАЛІТИЧНИЙ{' '}
                <span className="text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]">NEXUS</span>
              </h1>
              <p className="mt-1 text-[10px] text-slate-600 font-black uppercase tracking-[0.35em]">
                АВТОНОМНА ГЕНЕРАЦІЯ ІНСАЙТІВ · TIER-1 ACCESS REQUIRED
              </p>
            </div>
          </div>

          {/* Кнопки дій */}
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-8 py-4 bg-black border border-red-900/40 text-slate-400 text-[9px] font-black tracking-[0.3em] uppercase hover:border-red-700/60 hover:text-slate-200 transition-all flex items-center gap-3 disabled:opacity-40"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin text-red-600' : ''} />
              {refreshing ? 'СКАНУВАННЯ...' : 'ГЛИБОКИЙ_АНАЛІЗ'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
              className="px-10 py-4 bg-red-700 text-white text-[9px] font-black tracking-[0.25em] uppercase shadow-[0_0_30px_rgba(220,38,38,0.35)] flex items-center gap-3 group hover:bg-red-600 transition-colors border border-red-500/50"
            >
              <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
              СИНТЕЗУВАТИ_ГІПОТЕЗУ
            </motion.button>
          </div>
        </div>

        {/* ── СТАТИСТИКА ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'ПОТЕНЦІЙНИЙ ВПЛИВ',    value: '$1.6M',    sub: 'Фінансовий ефект',       icon: DollarSign, color: '#dc2626' },
            { label: 'ТОЧНІСТЬ МОДЕЛЕЙ',     value: '99.4%',    sub: 'AI Hunter-Killer v56',   icon: Target,     color: '#b45309' },
            { label: 'СЕМАНТИЧНИЙ_ГРАФ',     value: '14 Вузлів', sub: 'Охоплення категорій',   icon: Network,    color: '#991b1b' },
            { label: 'ЦІЛІСНІСТЬ_ВИСНОВКІВ', value: '100%',     sub: 'Конституційна згода',    icon: ShieldCheck, color: '#f59e0b' },
          ].map((stat) => (
            <TacticalCard key={stat.label} variant="holographic" className="p-7 relative group overflow-hidden bg-black border-red-900/20 hover:border-red-800/40 transition-all">
              <div className="absolute -right-4 -bottom-4 p-3 opacity-5 group-hover:opacity-15 transition-all duration-700">
                <stat.icon size={100} style={{ color: stat.color }} />
              </div>
              <div className="space-y-3 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full" style={{ backgroundColor: stat.color }} />
                  <p className="text-[8px] font-black text-slate-600 tracking-[0.4em] uppercase">{stat.label}</p>
                </div>
                <h3 className="text-3xl font-black text-white tracking-tighter font-mono">{stat.value}</h3>
                <p className="text-[9px] text-slate-600 font-black uppercase tracking-wider">{stat.sub}</p>
              </div>
            </TacticalCard>
          ))}
        </div>

        {/* ── ФІЛЬТРИ ── */}
        <div className="flex flex-wrap items-center gap-3 p-2 backdrop-blur border border-red-900/25 w-fit"
             style={{ background: 'rgba(5,0,0,0.7)' }}>
          <button
            onClick={() => setFilter('all')}
            className={cn(
              "px-6 py-2.5 text-[8px] font-black uppercase tracking-[0.3em] transition-all",
              filter === 'all'
                ? "bg-red-700 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                : "text-slate-600 hover:text-slate-300 hover:bg-red-950/20"
            )}
          >
            УСІ ІНСАЙТИ
          </button>
          <div className="w-px h-6 bg-red-900/30 mx-1" />
          {Object.entries(TYPE_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setFilter(key as InsightType)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 text-[8px] font-black uppercase tracking-[0.25em] transition-all border border-transparent",
                filter === key
                  ? "bg-red-900/30 text-red-400 border-red-800/50"
                  : "text-slate-600 hover:text-slate-300 hover:bg-red-950/20"
              )}
            >
              <config.icon size={13} />
              {config.label}
            </button>
          ))}
        </div>

        {/* ── ОСНОВНИЙ КОНТЕНТ ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Картки інсайтів */}
          <div className="lg:col-span-8 space-y-6">
            <AnimatePresence mode="popLayout">
              {loading ? (
                <div className="py-48 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-700/15 blur-[80px] animate-pulse" />
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}>
                      <Radar size={100} className="text-red-800 opacity-30" />
                    </motion.div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-red-700/70 font-black tracking-[0.7em] uppercase text-[9px] animate-pulse">
                      СИНТЕЗ ДАНИХ РОЗВІДКИ...
                    </p>
                    <p className="text-[9px] font-mono text-slate-700">ОБРОБКА НЕЙРОННИХ ШЛЯХІВ...</p>
                  </div>
                </div>
              ) : filtered.length > 0 ? (
                filtered.map((insight, idx) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: idx * 0.07 }}
                  >
                    <TacticalCard
                      variant="holographic"
                      className="p-8 group overflow-hidden bg-black relative border-red-900/20 hover:border-red-700/35 transition-all"
                    >
                      {/* Hover glow */}
                      <div className="absolute -top-16 -right-16 w-64 h-64 bg-red-900/5 blur-[100px] pointer-events-none group-hover:bg-red-800/8 transition-all duration-1000" />

                      <div className="flex flex-col md:flex-row gap-7 relative z-10">

                        {/* Тип іконка */}
                        <div className="flex flex-col items-center gap-3 shrink-0">
                          <div className="relative">
                            <div className="absolute inset-0 opacity-15 blur-xl rounded-full" style={{ backgroundColor: TYPE_CONFIG[insight.type]?.color }} />
                            <div
                              className="w-20 h-20 flex items-center justify-center border shadow-[0_0_20px_rgba(220,38,38,0.15)] transition-all group-hover:scale-105 bg-black overflow-hidden"
                              style={{ borderColor: `${TYPE_CONFIG[insight.type]?.color}35` }}
                            >
                              {React.createElement(TYPE_CONFIG[insight.type].icon, {
                                size: 34,
                                style: { color: TYPE_CONFIG[insight.type]?.color }
                              })}
                              <div className="absolute inset-x-0 bottom-0 h-0.5 opacity-40" style={{ backgroundColor: TYPE_CONFIG[insight.type]?.color }} />
                            </div>
                          </div>
                          <span className="text-[8px] font-black uppercase tracking-[0.2em]" style={{ color: TYPE_CONFIG[insight.type]?.color }}>
                            {TYPE_CONFIG[insight.type].label}
                          </span>
                        </div>

                        {/* Основний контент */}
                        <div className="flex-1 space-y-5">
                          {/* Badges */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <span
                              className="text-[8px] font-black px-3 py-1 uppercase tracking-[0.3em] border"
                              style={{ color: PRIORITY_CONFIG[insight.priority]?.color, borderColor: `${PRIORITY_CONFIG[insight.priority]?.color}30` }}
                            >
                              {PRIORITY_CONFIG[insight.priority].label}
                            </span>
                            <div className="flex items-center gap-2 px-3 py-1 bg-black border border-red-900/20">
                              <Target size={11} className="text-red-700" />
                              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                ВПЕВНЕНІСТЬ: <span className="text-red-500 font-mono">{insight.confidence}%</span>
                              </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-black border border-red-900/20">
                              <Clock size={11} className="text-slate-700" />
                              <span className="text-[8px] font-black text-slate-700 font-mono">
                                {new Date(insight.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          {/* Назва + опис */}
                          <div className="space-y-3">
                            <h3 className="text-2xl font-black text-white tracking-tighter group-hover:text-red-400 transition-colors uppercase leading-tight">
                              {insight.title}
                            </h3>
                            <p className="text-[12px] text-slate-500 leading-relaxed tracking-tight">
                              {insight.description}
                            </p>
                          </div>

                          {/* Нижній рядок — вплив + дії */}
                          <div className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t border-red-900/20">
                            <div className="flex items-center gap-8">
                              <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-tight">
                                <DollarSign size={15} className="text-amber-600" />
                                {insight.impact}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-tight">
                                <Layers size={15} className="text-red-800" />
                                {insight.category}
                              </div>
                            </div>

                            {insight.actionable && insight.actions && (
                              <div className="flex items-center gap-3">
                                {insight.actions.map((act, i) => (
                                  <button key={i} className={cn(
                                    "px-6 py-2.5 text-[8px] font-black uppercase tracking-[0.25em] transition-all border",
                                    act.type === 'primary'
                                      ? "bg-red-700 text-white border-transparent hover:bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                                      : "bg-black text-slate-500 border-red-900/30 hover:bg-red-950/20 hover:text-slate-300"
                                  )}>
                                    {act.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Дії: bookmark + feedback */}
                        <div className="flex flex-row md:flex-col gap-3 justify-center border-t md:border-t-0 md:border-l border-red-900/15 pt-5 md:pt-0 md:pl-8 shrink-0">
                          <motion.button
                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            onClick={() => setInsights(prev => prev.map(i => i.id === insight.id ? { ...i, saved: !i.saved } : i))}
                            className={cn(
                              "p-3.5 border transition-all",
                              insight.saved
                                ? "bg-amber-700 text-white border-amber-600/50 shadow-[0_0_15px_rgba(180,83,9,0.4)]"
                                : "bg-black border-red-900/25 text-slate-700 hover:text-amber-600 hover:border-amber-800/40"
                            )}
                          >
                            <Bookmark size={17} fill={insight.saved ? "currentColor" : "none"} />
                          </motion.button>
                          <div className="flex md:flex-col gap-3">
                            <motion.button
                              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              className="p-3.5 border bg-black border-red-900/20 text-slate-700 hover:text-emerald-500 hover:border-emerald-800/30 transition-all"
                            >
                              <ThumbsUp size={17} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              className="p-3.5 border bg-black border-red-900/20 text-slate-700 hover:text-red-500 hover:border-red-700/40 transition-all"
                            >
                              <ThumbsDown size={17} />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </TacticalCard>
                  </motion.div>
                ))
              ) : (
                <div className="py-48 flex flex-col items-center justify-center border border-dashed border-red-900/20">
                  <Radar size={70} className="text-red-900/40 mb-6 animate-pulse" />
                  <p className="text-slate-700 font-black uppercase tracking-[0.5em] text-[11px]">
                    Сигнали не виявлені у матриці
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* ── ПРАВА ПАНЕЛЬ ── */}
          <div className="lg:col-span-4 space-y-8">

            {/* CyberOrb — sovereign red */}
            <HoloContainer className="flex items-center justify-center p-4 min-h-[380px] relative overflow-hidden border-red-900/25"
                            style={{ background: 'rgba(5,0,0,0.95)' } as React.CSSProperties}>
              <CyberOrb size={280} color="#dc2626" className="opacity-60" />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <div className="text-[8px] font-black text-red-800/60 uppercase tracking-[0.8em] mb-3">SOVEREIGN_NEXUS_v56</div>
                <div className="text-3xl font-black text-white tracking-tighter">СИНТЕЗ_v6</div>
                <div className="mt-5 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                  <span className="text-[8px] font-mono text-slate-600">AI_HUNTER-KILLER: ACTIVE</span>
                </div>
              </div>
            </HoloContainer>

            {/* Нейронна активність — sovereign */}
            <TacticalCard variant="cyber" className="p-8 bg-black border-red-900/25">
              <h3 className="text-[8px] font-black text-red-700/80 uppercase tracking-[0.5em] mb-7 flex items-center gap-3">
                <Activity size={14} className="text-red-700" />
                СТАТУС СИСТЕМ АНАЛІЗУ
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'SEMANTIC_SCAN_v56',    status: 'ОПТИМАЛЬНО',  val: '99.2%',  color: 'emerald' },
                  { label: 'ПАТЕРН-ДЕШИФРАТОР',    status: 'АКТИВНО',     val: '234/с',  color: 'amber' },
                  { label: 'СИНТЕЗ_ГІПОТЕЗ',       status: 'КЛАСИФІКОВАНО', val: 'G-45', color: 'red' },
                  { label: 'XAI_ПОЯСНЕННЯ',        status: 'ГОТОВО',      val: '100%',   color: 'slate' }
                ].map((item) => (
                  <div key={item.label}
                    className="p-4 bg-black border border-red-900/15 flex items-center justify-between group hover:border-red-800/30 hover:bg-red-950/10 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        item.color === 'emerald' ? 'bg-emerald-600' :
                        item.color === 'amber'   ? 'bg-amber-600' :
                        item.color === 'red'     ? 'bg-red-600 animate-pulse' :
                                                   'bg-slate-600'
                      )} />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight group-hover:text-slate-300 transition-colors">
                        {item.label}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-[8px] font-black uppercase tracking-widest mb-0.5",
                        item.color === 'emerald' ? 'text-emerald-600' :
                        item.color === 'amber'   ? 'text-amber-600' :
                        item.color === 'red'     ? 'text-red-600' :
                                                   'text-slate-500'
                      )}>{item.status}</p>
                      <p className="text-[11px] font-black text-slate-300 font-mono tracking-tighter">{item.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TacticalCard>

            {/* Глобальний радар — sovereign */}
            <HoloContainer className="p-8 h-[300px] flex flex-col items-center justify-center overflow-hidden border-red-900/25 group"
                            style={{ background: 'rgba(5,0,0,0.95)' } as React.CSSProperties}>
              <div className="relative w-48 h-48">
                <div className="absolute inset-0 border border-red-900/30 rounded-full group-hover:border-red-700/40 transition-all duration-1000" />
                <div className="absolute inset-5 border border-red-900/20 rounded-full animate-pulse" />
                <div className="absolute inset-10 border border-red-900/10 rounded-full" />
                <motion.div
                  className="absolute inset-0 border-t border-red-700 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Radar size={42} className="text-red-700 opacity-50 group-hover:opacity-90 transition-opacity" />
                </div>
              </div>
              <div className="mt-6 text-center">
                <p className="text-[8px] font-black text-red-700/70 uppercase tracking-[0.5em] mb-1">ГЛОБАЛЬНИЙ_РАДАР_v56</p>
                <p className="text-[7px] font-mono text-slate-700 uppercase tracking-widest">СКАНУВАННЯ АНОМАЛІЙ · АКТИВНО</p>
              </div>
            </HoloContainer>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(220, 38, 38, 0.12); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(220, 38, 38, 0.28); }
      `}} />
    </div>
  );
};

export default AIInsightsHub;
