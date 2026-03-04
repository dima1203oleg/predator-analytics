/**
 * Predator v55 | Cognitive Insights Sanctum — Лабораторія Інсайтів
 * Ультрапреміум центр автономної генерації гіпотез та виявлення аномалій.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Sparkles, AlertTriangle, Target, Lightbulb, Zap,
  Clock, DollarSign, Shield, ArrowRight, TrendingUp, TrendingDown,
  RefreshCw, Bookmark, ThumbsUp, ThumbsDown, Crosshair, Radar,
  Activity, ArrowUpRight, Flame, Layers, Search, BarChart3,
  Rocket, Globe, Cpu, Network, ShieldCheck
} from 'lucide-react';
import { cn } from '../utils/cn';
import { api } from '../services/api';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import { HoloContainer } from '../components/HoloContainer';
import { CyberOrb } from '../components/CyberOrb';

// ========================
// Types & Mock Data Fallback
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

const FALLBACK_INSIGHTS: AIInsight[] = [
  {
    id: 'ins_1', type: 'risk', priority: 'critical',
    title: 'Мережева Аномалія: Транскордонна Циклічність',
    description: 'Алгоритм V-55 виявив каскад підозрілих транзакцій між офшорними вузлами та локальним кластером ТОВ "Альфа". Ознаки прихованого афіліювання.',
    confidence: 94, impact: '$1.2M Ризику', category: 'Фінансовий Моніторинг',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    actionable: true, actions: [{ label: 'Блокувати операції', type: 'primary' }, { label: 'Глибоке Досьє', type: 'secondary' }],
    saved: false
  },
  {
    id: 'ins_2', type: 'opportunity', priority: 'high',
    title: 'Арбітражний Прорив: Логістичний Коридор',
    description: 'Динамічне зниження загороджувальних мит на 18%. Предиктивна модель рекомендує негайну закупівлю компонентів електроніки.',
    confidence: 88, impact: '+$450k Економії', category: 'Оптимізація Ланцюгів',
    createdAt: new Date(Date.now() - 65 * 60000).toISOString(),
    actionable: true, actions: [{ label: 'Синтезувати Ордер', type: 'primary' }],
    saved: true
  },
  {
    id: 'ins_3', type: 'prediction', priority: 'medium',
    title: 'Прогноз Капіталізації: Енергетичний Сектор',
    description: 'Когнітивний аналіз новинних потоків та ринкових паттернів вказує на ймовірну волатильність активів у Q3 через геополітичний дрейф.',
    confidence: 79, impact: 'Вплив: Помірний', category: 'Ринкові Тренди',
    createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
    actionable: false, saved: false
  },
  {
    id: 'ins_4', type: 'anomaly', priority: 'high',
    title: 'Атипова Проактивність Конкурента',
    description: 'Демпінг на 3 стратегічні позиції від "Global Trade". Ймовірна спроба витіснення локальних дистриб\'юторів. Рекомендано контрзаходи.',
    confidence: 91, impact: 'Конкурентна Загроза', category: 'Комерційна Розвідка',
    createdAt: new Date().toISOString(),
    actionable: true, actions: [{ label: 'Аналіз Тарифів', type: 'primary' }],
    saved: false
  }
];

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
  medium: { color: '#06b6d4', label: 'СЕРЕДНІЙ' },
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
      const res = await api.premium.getAiInsights();
      setInsights(Array.isArray(res) && res.length > 0 ? res : FALLBACK_INSIGHTS);
    } catch {
      setInsights(FALLBACK_INSIGHTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 1200)); // Глибоке сканування
    await fetchData();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return insights;
    return insights.filter(i => i.type === filter);
  }, [insights, filter]);

  if (isWidgetMode) {
    return (
      <div className="flex flex-col h-full bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[24px] overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2">
            <Brain size={14} className="text-violet-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">AI INSIGHTS</span>
          </div>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Live Neural Stream</span>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-10 opacity-50">
              <RefreshCw size={24} className="animate-spin text-violet-500" />
            </div>
          ) : insights.slice(0, 5).map((insight, idx) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PRIORITY_CONFIG[insight.priority].color }} />
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: TYPE_CONFIG[insight.type].color }}>{TYPE_CONFIG[insight.type].label}</span>
              </div>
              <h4 className="text-xs font-black text-white group-hover:text-violet-400 transition-colors uppercase leading-tight line-clamp-2">{insight.title}</h4>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[9px] font-medium text-slate-500 italic font-mono">CONFIDENCE: {insight.confidence}%</span>
                <ArrowRight size={10} className="text-slate-600 group-hover:text-violet-400 transition-all transform group-hover:translate-x-1" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-200 relative overflow-hidden font-sans">
      {/* V55 Background Matrix */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-violet-500/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-fuchsia-600/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(139,92,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.03) 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative z-10 max-w-[1700px] mx-auto p-4 sm:p-8 space-y-8 pb-32">
        {/* Header Section */}
        <ViewHeader
          title="COGNITIVE INSIGHTS SANCTUM"
          icon={<Brain size={22} className="text-violet-500 drop-shadow-[0_0_10px_rgba(139,92,246,0.6)]" />}
          breadcrumbs={['СИНАПСИС', 'АНАЛІТИКА', 'ІНСАЙТИ']}
          stats={[
            { label: 'Активні Інсайти', value: insights.length, icon: <Brain size={14} />, color: 'primary' },
            { label: 'Середня Впевненість', value: '89%', icon: <Crosshair size={14} />, color: 'indigo' },
            { label: 'Критичні Загрози', value: insights.filter(i => i.priority === 'critical').length, icon: <Flame size={14} />, color: 'rose' },
          ]}
          actions={
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-6 py-2.5 bg-violet-500/10 border border-violet-500/30 text-violet-400 rounded-full text-[10px] font-black tracking-widest uppercase hover:bg-violet-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> {refreshing ? 'СКАНУВАННЯ...' : 'ГЛИБОКЕ СКАНУВАННЯ'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                className="px-8 py-2.5 bg-violet-600 text-white rounded-full text-[10px] font-black tracking-[0.2em] uppercase shadow-xl shadow-violet-900/40 flex items-center gap-2"
              >
                <Sparkles size={14} className="fill-current" /> СИНТЕЗУВАТИ ІНСАЙТ
              </motion.button>
            </div>
          }
        />

        {/* Global Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'ПОТЕНЦІЙНИЙ ВПЛИВ', value: '$1.6M', sub: 'Фінансовий ефект', icon: DollarSign, color: '#10b981' },
            { label: 'ТОЧНІСТЬ МОДЕЛЕЙ', value: '99.4%', sub: 'NAS Engine v55', icon: Target, color: '#06b6d4' },
            { label: 'АНАЛІЗ КАТЕГОРІЙ', value: '14 Вузлів', sub: 'Семантичне охоплення', icon: Network, color: '#a855f7' },
            { label: 'ЦІЛІСНІСТЬ ВИСНОВКІВ', value: '100%', sub: 'Конституційна згода', icon: ShieldCheck, color: '#f59e0b' },
          ].map((stat, idx) => (
            <TacticalCard key={stat.label} variant="holographic" className="panel-3d" noPadding>
              <div className="p-6 relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                  <stat.icon size={32} style={{ color: stat.color }} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-500 tracking-widest uppercase">{stat.label}</p>
                  <h3 className="text-4xl font-black text-white tracking-tighter">{stat.value}</h3>
                  <p className="text-[11px] text-slate-400 font-medium">{stat.sub}</p>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 opacity-10 bg-current" style={{ color: stat.color }} />
              </div>
            </TacticalCard>
          ))}
        </div>

        {/* Filters Panel */}
        <div className="flex flex-wrap items-center gap-3 p-1.5 bg-slate-900/40 backdrop-blur-xl rounded-[24px] border border-white/5 w-fit">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
              filter === 'all' ? "bg-white text-black shadow-lg" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
            )}
          >
            ВСІ ІНСАЙТИ
          </button>
          <div className="w-px h-6 bg-white/10 mx-1" />
          {Object.entries(TYPE_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setFilter(key as InsightType)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border border-transparent",
                filter === key
                  ? "bg-violet-600/20 text-violet-400 border-violet-500/30"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              )}
            >
              <config.icon size={14} />
              {config.label}
            </button>
          ))}
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="popLayout">
              {loading ? (
                <div className="py-40 flex flex-col items-center justify-center text-center space-y-6">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}>
                    <Brain size={64} className="text-violet-500 opacity-20" />
                  </motion.div>
                  <p className="text-violet-400 font-black tracking-widest uppercase text-xs animate-pulse">СИНТЕЗ Когнітивних шарів...</p>
                </div>
              ) : filtered.length > 0 ? (
                filtered.map((insight, idx) => (
                  <TacticalCard
                    key={insight.id}
                    variant="holographic"
                    className="panel-3d group overflow-hidden"
                    noPadding
                  >
                    <div className="flex flex-col md:flex-row gap-6 p-6 relative">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 blur-[100px] pointer-events-none group-hover:bg-violet-600/10 transition-all" />

                      <div className="flex flex-col items-center gap-3 shrink-0 py-2">
                        <div className={cn(
                          "w-16 h-16 rounded-[24px] flex items-center justify-center border-2 transition-transform group-hover:scale-110",
                          `bg-[${TYPE_CONFIG[insight.type].color}]/10 border-[${TYPE_CONFIG[insight.type].color}]/30`
                        )} style={{ borderColor: `${TYPE_CONFIG[insight.type].color}50`, backgroundColor: `${TYPE_CONFIG[insight.type].color}15` }}>
                          {React.createElement(TYPE_CONFIG[insight.type].icon, { size: 32, style: { color: TYPE_CONFIG[insight.type].color } })}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: TYPE_CONFIG[insight.type].color }}>
                          {TYPE_CONFIG[insight.type].label}
                        </span>
                      </div>

                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={cn(
                            "text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border",
                            `bg-[${PRIORITY_CONFIG[insight.priority].color}]/10 border-[${PRIORITY_CONFIG[insight.priority].color}]/30 text-[${PRIORITY_CONFIG[insight.priority].color}]`
                          )} style={{ color: PRIORITY_CONFIG[insight.priority].color, borderColor: `${PRIORITY_CONFIG[insight.priority].color}40`, backgroundColor: `${PRIORITY_CONFIG[insight.priority].color}10` }}>
                            {PRIORITY_CONFIG[insight.priority].label}
                          </span>
                          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-white/5">
                            <Target size={12} className="text-cyan-400" />
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">CONFIDENCE: <span className="text-cyan-400">{insight.confidence}%</span></span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-white/5">
                            <Clock size={12} className="text-slate-500" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter sm:font-mono">
                              {new Date(insight.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-violet-400 transition-colors uppercase italic underline decoration-violet-500/20 underline-offset-8">
                            {insight.title}
                          </h3>
                          <p className="text-sm text-slate-400 leading-relaxed font-medium">
                            {insight.description}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t border-white/5">
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-tight">
                              <DollarSign size={16} className="text-emerald-500" />
                              {insight.impact}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-tight">
                              <Layers size={16} className="text-violet-500" />
                              {insight.category}
                            </div>
                          </div>

                          {insight.actionable && insight.actions && (
                            <div className="flex items-center gap-3">
                              {insight.actions.map((act, i) => (
                                <button key={i} className={cn(
                                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                  act.type === 'primary'
                                    ? "bg-violet-600/20 text-violet-400 border-violet-500/40 hover:bg-violet-600/40"
                                    : "bg-slate-800/60 text-slate-300 border-white/5 hover:bg-slate-700/80"
                                )}>
                                  {act.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col gap-3 justify-center border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 shrink-0">
                        <motion.button
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => setInsights(prev => prev.map(i => i.id === insight.id ? { ...i, saved: !i.saved } : i))}
                          className={cn("p-3 rounded-[18px] border transition-all", insight.saved ? "bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]" : "bg-white/5 border-white/10 text-slate-500 hover:text-white")}
                        >
                          <Bookmark size={18} fill={insight.saved ? "currentColor" : "none"} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => setInsights(prev => prev.map(i => i.id === insight.id ? { ...i, feedback: i.feedback === 'positive' ? undefined : 'positive' } : i))}
                          className={cn("p-3 rounded-[18px] border transition-all", insight.feedback === 'positive' ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "bg-white/5 border-white/10 text-slate-500 hover:text-white")}
                        >
                          <ThumbsUp size={18} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => setInsights(prev => prev.map(i => i.id === insight.id ? { ...i, feedback: i.feedback === 'negative' ? undefined : 'negative' } : i))}
                          className={cn("p-3 rounded-[18px] border transition-all", insight.feedback === 'negative' ? "bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]" : "bg-white/5 border-white/10 text-slate-500 hover:text-white")}
                        >
                          <ThumbsDown size={18} />
                        </motion.button>
                      </div>
                    </div>
                  </TacticalCard>
                ))
              ) : (
                <div className="py-40 flex flex-col items-center justify-center bg-slate-900/20 rounded-[40px] border border-dashed border-white/10">
                  <Radar size={48} className="text-slate-800 mb-4" />
                  <p className="text-slate-500 font-black uppercase tracking-widest text-xs italic">Сигнали не виявлені у вибраному діапазоні</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-8">
            <TacticalCard variant="holographic" className="panel-3d flex items-center justify-center p-0 overflow-hidden relative min-h-[400px]">
              <CyberOrb size={280} color="#8b5cf6" intensity={0.6} pulse={true} className="drop-shadow-[0_0_60px_rgba(139,92,246,0.3)]" />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-[10px] font-black text-violet-500/50 uppercase tracking-[0.5em] mb-2">Cognitive Core</div>
                <div className="text-3xl font-black text-white font-mono opacity-80">v55.PULSE</div>
              </div>
            </TacticalCard>

            <TacticalCard variant="holographic" title="НЕЙРОННА АКТИВНІСТЬ" className="panel-3d">
              <div className="space-y-5 py-2">
                {[
                  { label: 'Semantic Scan', status: 'Optimal', val: '99.2%', color: 'emerald' },
                  { label: 'Pattern Decryptor', status: 'Active', val: '234/s', color: 'indigo' },
                  { label: 'Hypothesis Synth', status: 'Deep', val: 'G45', color: 'violet' },
                ].map((item, idx) => (
                  <div key={item.label} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]", `text-${item.color}-500`)} />
                      <span className="text-[11px] font-black text-white uppercase tracking-tight">{item.label}</span>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-[9px] font-black uppercase tracking-widest", `text-${item.color}-400`)}>{item.status}</p>
                      <p className="text-xs font-black text-slate-500 font-mono">{item.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TacticalCard>

            <TacticalCard variant="holographic" title="ГЛОБАЛЬНИЙ РАДАР" className="panel-3d h-[300px] flex items-center justify-center overflow-hidden">
              <div className="relative w-48 h-48 group">
                <div className="absolute inset-0 border-2 border-violet-500/20 rounded-full group-hover:border-violet-500/40 transition-all" />
                <div className="absolute inset-4 border border-violet-500/10 rounded-full" />
                <div className="absolute inset-8 border border-violet-500/5 rounded-full" />
                <motion.div
                  className="absolute inset-0 border-t-2 border-violet-500 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Globe size={40} className="text-violet-500 opacity-60 animate-pulse" />
                </div>
              </div>
              <div className="absolute bottom-4 left-0 w-full text-center text-[9px] font-black text-slate-600 uppercase tracking-widest">Global Anomaly Sweep Active</div>
            </TacticalCard>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .panel-3d {
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .panel-3d:hover {
            transform: translateY(-5px) scale(1.01);
            box-shadow: 0 40px 80px -15px rgba(0, 0, 0, 0.6);
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(139, 92, 246, 0.3);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(139, 92, 246, 0.6);
        }
      `}} />
    </div>
  );
};

export default AIInsightsHub;
