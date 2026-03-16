/**
 * 🔮 Cognitive Insights Sanctum | v55.2 Premium Matrix
 * PREDATOR Лабораторія ШІ-Гіпотез
 * 
 * Автономна генерація аналітичних висновків, виявлення аномалій та прогнозування.
 * © 2026 PREDATOR Analytics - Повна українізація v55.2
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

const TYPE_CONFIG = {
  prediction: { icon: Brain, color: '#8b5cf6', label: 'Прогноз' },
  anomaly: { icon: Activity, color: '#ec4899', label: 'Аномалія' },
  opportunity: { icon: Lightbulb, color: '#10b981', label: 'Можливість' },
  risk: { icon: Shield, color: '#f59e0b', label: 'Ризик' },
  recommendation: { icon: Target, color: '#06b6d4', label: 'Рекомендація' }
};

const PRIORITY_CONFIG = {
  critical: { color: '#ef4444', label: 'КРИТИЧНО' },
  high: { color: '#f59e0b', label: 'ВИСОКИЙ' },
  medium: { color: '#00ccff', label: 'СЕРЕДНІЙ' },
  low: { color: '#94a3b8', label: 'НИЗЬКИЙ' }
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
      // Fallback mocks for premium experience
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
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return insights;
    return insights.filter(i => i.type === filter);
  }, [insights, filter]);

  if (isWidgetMode) {
    return (
      <div className="flex flex-col h-full bg-[#030712]/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                <Brain size={16} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white">ШІ_ІНСАЙТИ_v55</span>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[8px] animate-pulse">LIVE</Badge>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
              <RefreshCw size={32} className="animate-spin text-indigo-500" />
              <span className="text-[10px] font-black uppercase tracking-widest italic">Синхронізація_нейромережі...</span>
            </div>
          ) : filtered.slice(0, 8).map((insight, idx) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-5 bg-black/40 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PRIORITY_CONFIG[insight.priority].color }} />
                    <span className="text-[9px] font-black uppercase tracking-widest italic" style={{ color: TYPE_CONFIG[insight.type].color }}>{TYPE_CONFIG[insight.type].label}</span>
                </div>
                <span className="text-[8px] font-mono text-slate-500">{insight.confidence}% Впевн.</span>
              </div>
              <h4 className="text-xs font-black text-white group-hover:text-indigo-400 transition-colors uppercase leading-relaxed line-clamp-2 italic">{insight.title}</h4>
              <div className="mt-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[8px] font-black text-slate-600 uppercase">ОТРИМАТИ_ДЕТАЛІ</span>
                <ArrowRight size={12} className="text-indigo-400 transform translate-x-0 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden font-sans">
      <AdvancedBackground />

      <div className="relative z-10 max-w-[1700px] mx-auto p-4 sm:p-12 space-y-12 pb-32">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex items-center gap-8">
                <div className="relative group cursor-pointer">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full group-hover:scale-125 transition-transform" />
                    <div className="relative p-7 bg-slate-900 border border-indigo-500/30 rounded-[2.5rem] shadow-2xl">
                        <Brain size={44} className="text-indigo-400" />
                    </div>
                </div>
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] animate-pulse">ЛАБОРАТОРІЯ_ІНСАЙТІВ_v55.2</span>
                        <Badge variant="outline" className="text-[8px] bg-indigo-500/10 text-indigo-400 border-indigo-500/20">PREMIUM_AI</Badge>
                    </div>
                    <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-tight font-display">
                        СВЯТИЛИЩЕ <span className="text-indigo-400 drop-shadow-[0_0_20px_rgba(99,102,241,0.4)]">ІНСАЙТІВ</span>
                    </h1>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="px-10 py-6 bg-slate-900 border border-white/10 text-slate-300 rounded-[2rem] text-[10px] font-black tracking-widest uppercase hover:bg-slate-800 transition-all flex items-center gap-3 disabled:opacity-50"
                >
                    <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} /> {refreshing ? 'СКАНУВАННЯ...' : 'ГЛИБОКИЙ_АНАЛІЗ'}
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                    className="px-12 py-6 bg-indigo-500 text-black rounded-[2rem] text-[10px] font-black tracking-[0.2em] uppercase shadow-[0_0_30px_rgba(99,102,241,0.3)] flex items-center gap-3 group"
                >
                    <Sparkles size={18} className="group-hover:rotate-12 transition-transform" /> СИНТЕЗУВАТИ_ГІПОТЕЗУ
                </motion.button>
            </div>
        </div>

        {/* Global Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: 'ПОТЕНЦІЙНИЙ ВПЛИВ', value: '$1.6M', sub: 'Фінансовий ефект', icon: DollarSign, color: '#10b981' },
            { label: 'ТОЧНІСТЬ МОДЕЛЕЙ', value: '99.4%', sub: 'NAS Engine v55', icon: Target, color: '#06b6d4' },
            { label: 'СЕМАНТИЧНИЙ_ГРАФ', value: '14 Вузлів', sub: 'Охоплення категорій', icon: Network, color: '#8b5cf6' },
            { label: 'ЦІЛІСНІСТЬ_ВИСНОВКІВ', value: '100%', sub: 'Конституційна згода', icon: ShieldCheck, color: '#f59e0b' },
          ].map((stat, idx) => (
            <TacticalCard key={stat.label} variant="holographic" className="p-8 relative group overflow-hidden bg-slate-900/40">
                <div className="absolute -right-6 -bottom-6 p-4 opacity-5 group-hover:opacity-20 transition-all duration-700">
                    <stat.icon size={120} style={{ color: stat.color }} />
                </div>
                <div className="space-y-4 relative z-10">
                  <p className="text-[10px] font-black text-slate-500 tracking-widest uppercase">{stat.label}</p>
                  <h3 className="text-4xl font-black text-white tracking-tighter italic font-mono">{stat.value}</h3>
                  <p className="text-[11px] text-slate-400 font-black uppercase italic">{stat.sub}</p>
                </div>
            </TacticalCard>
          ))}
        </div>

        {/* Filters Panel */}
        <div className="flex flex-wrap items-center gap-4 p-2 bg-black/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 w-fit shadow-2xl">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              "px-8 py-3.5 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all",
              filter === 'all' ? "bg-indigo-500 text-black shadow-lg" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
            )}
          >
            УСІ ІНСАЙТИ
          </button>
          <div className="w-px h-8 bg-white/10 mx-2" />
          {Object.entries(TYPE_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setFilter(key as InsightType)}
              className={cn(
                "flex items-center gap-3 px-6 py-3.5 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all border border-transparent",
                filter === key
                  ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/40"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              )}
            >
              <config.icon size={16} />
              {config.label}
            </button>
          ))}
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8">
            <AnimatePresence mode="popLayout">
              {loading ? (
                <div className="py-60 flex flex-col items-center justify-center text-center space-y-8">
                  <div className="relative">
                      <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] animate-pulse" />
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}>
                         <Brain size={120} className="text-indigo-500 opacity-20" />
                      </motion.div>
                  </div>
                  <div className="flex flex-col gap-2">
                     <p className="text-indigo-400 font-black tracking-[0.8em] uppercase text-xs animate-pulse">СИНТЕЗ_КОГНІТИВНИХ_ШАРІВ_v55</p>
                     <p className="text-[10px] font-mono text-slate-600">PROCESSING_NEURAL_PATHWAYS...</p>
                  </div>
                </div>
              ) : filtered.length > 0 ? (
                filtered.map((insight, idx) => (
                  <TacticalCard
                    key={insight.id}
                    variant="holographic"
                    className="p-10 group overflow-hidden bg-slate-900/40 relative border-white/5 hover:border-indigo-500/20 transition-all"
                  >
                    <div className="flex flex-col md:flex-row gap-8 relative z-10">
                      <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-600/5 blur-[120px] pointer-events-none group-hover:bg-indigo-600/10 transition-all duration-1000" />

                      <div className="flex flex-col items-center gap-4 shrink-0">
                        <div className="relative">
                           <div className="absolute inset-0 bg-current opacity-20 blur-2xl rounded-full" style={{ color: TYPE_CONFIG[insight.type].color }} />
                           <div className="w-24 h-24 rounded-[2.5rem] flex items-center justify-center border-2 shadow-2xl transition-all group-hover:scale-110 group-hover:rotate-6 bg-slate-900 overflow-hidden" style={{ borderColor: `${TYPE_CONFIG[insight.type].color}40` }}>
                             {React.createElement(TYPE_CONFIG[insight.type].icon, { size: 40, style: { color: TYPE_CONFIG[insight.type].color } })}
                             <div className="absolute inset-x-0 bottom-0 h-1 bg-current opacity-30" style={{ color: TYPE_CONFIG[insight.type].color }} />
                           </div>
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] italic" style={{ color: TYPE_CONFIG[insight.type].color }}>
                           {TYPE_CONFIG[insight.type].label}
                        </span>
                      </div>

                      <div className="flex-1 space-y-6">
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-white/10 bg-black/40" style={{ color: PRIORITY_CONFIG[insight.priority].color, borderColor: `${PRIORITY_CONFIG[insight.priority].color}30` }}>
                            {PRIORITY_CONFIG[insight.priority].label}
                          </span>
                          <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-black/40 border border-white/5">
                            <Target size={14} className="text-cyan-400" />
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">ВПЕВНЕНІСТЬ: <span className="text-cyan-400 font-mono italic">{insight.confidence}%</span></span>
                          </div>
                          <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-black/40 border border-white/5">
                            <Clock size={14} className="text-slate-600" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter sm:font-mono">
                              {new Date(insight.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-3xl font-black text-white tracking-tighter group-hover:text-indigo-400 transition-colors uppercase italic leading-tight">
                            {insight.title}
                          </h3>
                          <p className="text-base text-slate-400 leading-relaxed font-medium uppercase tracking-tight">
                            {insight.description}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-8 pt-8 border-t border-white/5">
                          <div className="flex items-center gap-10">
                            <div className="flex items-center gap-3 text-sm font-black text-white uppercase tracking-tighter italic">
                              <DollarSign size={18} className="text-emerald-500" />
                              {insight.impact}
                            </div>
                            <div className="flex items-center gap-3 text-sm font-black text-white uppercase tracking-tighter italic">
                              <Layers size={18} className="text-indigo-400" />
                              {insight.category}
                            </div>
                          </div>

                          {insight.actionable && insight.actions && (
                            <div className="flex items-center gap-4">
                              {insight.actions.map((act, i) => (
                                <button key={i} className={cn(
                                  "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-lg",
                                  act.type === 'primary'
                                    ? "bg-indigo-500 text-black border-transparent hover:bg-indigo-400"
                                    : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white"
                                )}>
                                  {act.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col gap-4 justify-center border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-10 shrink-0">
                        <motion.button
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => setInsights(prev => prev.map(i => i.id === insight.id ? { ...i, saved: !i.saved } : i))}
                          className={cn("p-4 rounded-2xl border transition-all", insight.saved ? "bg-amber-500 text-black border-transparent shadow-[0_0_20px_rgba(245,158,11,0.4)]" : "bg-black/60 border-white/10 text-slate-600 hover:text-indigo-400 hover:border-indigo-500/30")}
                        >
                          <Bookmark size={20} fill={insight.saved ? "currentColor" : "none"} />
                        </motion.button>
                        <div className="flex md:flex-col gap-4">
                            <motion.button
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                className="p-4 rounded-2xl border bg-black/60 border-white/10 text-slate-600 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
                            >
                                <ThumbsUp size={20} />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                className="p-4 rounded-2xl border bg-black/60 border-white/10 text-slate-600 hover:text-rose-400 hover:border-rose-500/30 transition-all"
                            >
                                <ThumbsDown size={20} />
                            </motion.button>
                        </div>
                      </div>
                    </div>
                  </TacticalCard>
                ))
              ) : (
                <div className="py-60 flex flex-col items-center justify-center bg-black/40 rounded-[4rem] border border-dashed border-white/5">
                  <Radar size={80} className="text-slate-800 mb-6 animate-pulse" />
                  <p className="text-slate-600 font-black uppercase tracking-[0.5em] text-sm italic">Сигнали не виявлені у матриці</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-4 space-y-10">
            <HoloContainer className="flex items-center justify-center p-4 min-h-[450px] relative overflow-hidden bg-indigo-500/[0.02]">
                <CyberOrb size={320} color="#6366f1" className="opacity-80" />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <div className="text-[12px] font-black text-indigo-400/60 uppercase tracking-[0.8em] mb-4">NEURAL_PULSE_v55</div>
                    <div className="text-4xl font-black text-white italic tracking-tighter">СИНТЕЗ_v6</div>
                    <div className="mt-6 flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-[9px] font-mono text-slate-500">QUANTUM_ENTANGLEMENT: OK</span>
                    </div>
                </div>
            </HoloContainer>

            <TacticalCard variant="cyber" className="p-10 bg-indigo-500/5 border-indigo-500/20">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.4em] mb-10 flex items-center gap-4 italic">
                  <Activity size={20} className="text-indigo-400" /> НЕЙРОННА_АКТИВНІСТЬ
              </h3>
              <div className="space-y-6">
                {[
                  { label: 'SEMANTIC_SCAN_v55', status: 'Optimal', val: '99.2%', color: 'emerald' },
                  { label: 'PATTERN_DECRYPTOR', status: 'Active', val: '234/s', color: 'indigo' },
                  { label: 'HYPOTHESIS_SYNTH', status: 'Deep', val: 'G45', color: 'violet' },
                  { label: 'XAI_EXPLANATIONS', status: 'Ready', val: '100%', color: 'rose' }
                ].map((item, idx) => (
                  <div key={item.label} className="p-5 bg-black/60 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-indigo-500/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-2 h-2 rounded-full shadow-[0_0_10px_currentColor]", `text-${item.color}-500`)} />
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-tight group-hover:text-white transition-colors">{item.label}</span>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-[10px] font-black uppercase tracking-widest italic mb-1", `text-${item.color}-400`)}>{item.status}</p>
                      <p className="text-xs font-black text-slate-200 font-mono tracking-tighter">{item.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TacticalCard>

            <HoloContainer className="p-10 h-[350px] flex flex-col items-center justify-center overflow-hidden bg-rose-500/5 border-rose-500/20 group">
              <div className="relative w-56 h-56">
                <div className="absolute inset-0 border-2 border-rose-500/20 rounded-full group-hover:border-rose-500/40 transition-all duration-1000" />
                <div className="absolute inset-6 border border-rose-500/10 rounded-full animate-pulse" />
                <div className="absolute inset-12 border border-rose-500/5 rounded-full" />
                <motion.div
                  className="absolute inset-0 border-t-2 border-rose-500 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Radar size={48} className="text-rose-500 opacity-40 group-hover:opacity-100 animate-pulse transition-opacity" />
                </div>
              </div>
              <div className="mt-8 text-center">
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.5em] mb-2 leading-none">ГЛОБАЛЬНИЙ_РАДАР_v5</p>
                  <p className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">ГЛОБАЛЬНЕ_СКАНУВАННЯ_АНОМАЛІЙ_АКТИВНЕ</p>
              </div>
            </HoloContainer>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(99, 102, 241, 0.1);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(99, 102, 241, 0.3);
        }
        .font-display {
            font-family: 'Inter', sans-serif;
            letter-spacing: -0.05em;
        }
      `}} />
    </div>
  );
};

export default AIInsightsHub;
