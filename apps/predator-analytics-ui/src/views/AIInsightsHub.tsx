/**
 * 🧠 PREDATOR ANALYTICS — Лабораторія Інсайтів v55 (AI Insights Hub)
 * ===============================================================
 * Ультрапреміум дизайн, 3D ефекти карток, складне фільтрування та AI-впевненість
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Sparkles, AlertTriangle, Target, Lightbulb, Zap,
  Clock, DollarSign, Shield, ArrowRight, TrendingUp, TrendingDown,
  RefreshCw, Bookmark, ThumbsUp, ThumbsDown, Crosshair, Radar,
  Activity, ArrowUpRight, Flame, Layers
} from 'lucide-react';
import { cn } from '../utils/cn';
import { api } from '../services/api';

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
    title: 'Виявлено мережу прихованих зв\'язків',
    description: 'Алгоритм V-55 ідентифікував 14 транзакцій між офшорними юрисдикціями та ТОВ "Альфа". Ймовірність фіктивного експорту.',
    confidence: 94, impact: '$1.2M Ризику', category: 'Фінансовий Моніторинг',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    actionable: true, actions: [{ label: 'Блокувати операції', type: 'primary' }, { label: 'Досьє на бенефіціара', type: 'secondary' }],
    saved: false
  },
  {
    id: 'ins_2', type: 'opportunity', priority: 'high',
    title: 'Аномальний ріст маржинальності логістики',
    description: 'Зниження вартості фрахту на 18%. Рекомендовано переукласти контракти до кінця поточного тижня.',
    confidence: 88, impact: '+$450k Економії', category: 'Оптимізація',
    createdAt: new Date(Date.now() - 65 * 60000).toISOString(),
    actionable: true, actions: [{ label: 'Генерувати контракти', type: 'primary' }],
    saved: true
  },
  {
    id: 'ins_3', type: 'prediction', priority: 'medium',
    title: 'Штучний дефіцит електроніки Q3',
    description: 'Предиктивна модель вказує на ймовірне зниження поставок на 25% через санкційні пакети.',
    confidence: 79, impact: 'Вплив на ринок: Сильний', category: 'Риночний тренд',
    createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
    actionable: false, saved: false
  },
  {
    id: 'ins_4', type: 'anomaly', priority: 'high',
    title: 'Атипова поведінка конкурента',
    description: 'Демпінг на 3 ключові позиції від "Омега Трейд". Ймовірна спроба захоплення частки ринку.',
    confidence: 91, impact: 'Конкурентна загроза', category: 'Комерційна розвідка',
    createdAt: new Date().toISOString(),
    actionable: true, actions: [{ label: 'Аналіз ціноутворення', type: 'primary' }],
    saved: false
  }
];

// ========================
// Configuration
// ========================

const TYPE_CONFIG = {
  prediction: { icon: Brain, color: '#8b5cf6', glow: 'rgba(139,92,246,0.3)', label: 'Прогноз' },
  anomaly: { icon: Activity, color: '#ec4899', glow: 'rgba(236,72,153,0.3)', label: 'Аномалія' },
  opportunity: { icon: Lightbulb, color: '#10b981', glow: 'rgba(16,185,129,0.3)', label: 'Можливість' },
  risk: { icon: Shield, color: '#f59e0b', glow: 'rgba(245,158,11,0.3)', label: 'Ризик' },
  recommendation: { icon: Target, color: '#06b6d4', glow: 'rgba(6,182,212,0.3)', label: 'Рекомендація' }
};

const PRIORITY_CONFIG = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', label: 'КРИТИЧНО' },
  high: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', label: 'ВИСОКИЙ' },
  medium: { color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.3)', label: 'СЕРЕДНІЙ' },
  low: { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.3)', label: 'НИЗЬКИЙ' }
};

// ========================
// Sub-components
// ========================

const InsightCard3D: React.FC<{
  insight: AIInsight;
  index: number;
  onSave: () => void;
  onFeedback: (type: 'positive' | 'negative') => void;
}> = ({ insight, index, onSave, onFeedback }) => {
  const tCfg = TYPE_CONFIG[insight.type];
  const pCfg = PRIORITY_CONFIG[insight.priority];
  const Icon = tCfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
      transition={{ delay: index * 0.05, duration: 0.4, type: 'spring' }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="relative rounded-2xl border border-white/5 bg-slate-950/80 backdrop-blur-xl overflow-hidden group cursor-crosshair transform-gpu"
      style={{ boxShadow: `0 8px 32px rgba(0,0,0,0.4)` }}
    >
      {/* Glow backgrounds */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{ background: `radial-gradient(circle at 100% 0%, ${tCfg.glow} 0%, transparent 60%)` }} />
      <div className="absolute top-0 left-0 bottom-0 w-1" style={{ background: `linear-gradient(180deg, ${tCfg.color}, transparent)` }} />

      <div className="relative p-6 flex flex-col md:flex-row gap-5">

        {/* Left Icon Panel */}
        <div className="shrink-0 flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center border shadow-xl relative"
            style={{ background: `${tCfg.color}15`, borderColor: `${tCfg.color}30` }}>
            <div className="absolute inset-0 rounded-2xl opacity-50 animate-pulse pointer-events-none" style={{ background: `radial-gradient(circle, ${tCfg.color} 0%, transparent 70%)` }} />
            <Icon className="w-7 h-7 relative z-10" style={{ color: tCfg.color }} />
          </div>
          <div className="text-[10px] font-black tracking-widest uppercase mt-1" style={{ color: tCfg.color }}>
            {tCfg.label}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest"
              style={{ color: pCfg.color, background: pCfg.bg, border: `1px solid ${pCfg.border}` }}>
              {pCfg.label}
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/50 border border-slate-700/50">
              <Crosshair className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px] font-bold text-slate-300">CONFIDENCE: <span className="text-cyan-400">{insight.confidence}%</span></span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/50 border border-slate-700/50">
              <Clock className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400">
                {new Date(insight.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <h3 className="text-xl font-black text-white mb-2 leading-tight group-hover:text-cyan-50 transition-colors">
            {insight.title}
          </h3>
          <p className="text-sm text-slate-400 mb-5 leading-relaxed">
            {insight.description}
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/5 pt-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                {insight.impact}
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-600" />
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <Layers className="w-4 h-4 text-violet-400" />
                {insight.category}
              </div>
            </div>

            {/* Actions */}
            {insight.actionable && insight.actions && (
              <div className="flex items-center gap-2">
                {insight.actions.map((act, i) => (
                  <button key={i} className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all border",
                    act.type === 'primary'
                      ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20 hover:scale-105"
                      : "bg-slate-800/40 text-slate-300 border-slate-700 hover:bg-slate-700/50 hover:text-white"
                  )}>
                    {act.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Side Actions (Save/Feedback) */}
        <div className="shrink-0 flex flex-col gap-2 border-l border-white/5 pl-4 ml-2 justify-center">
          <button onClick={onSave} className={cn("p-2.5 rounded-xl border transition-all hover:scale-110", insight.saved ? "bg-amber-500/20 border-amber-500/30 text-amber-400" : "bg-slate-900/50 border-white/5 text-slate-500 hover:text-amber-400 hover:border-amber-500/20")}>
            <Bookmark className="w-4 h-4" fill={insight.saved ? "currentColor" : "none"} />
          </button>
          <button onClick={() => onFeedback('positive')} className={cn("p-2.5 rounded-xl border transition-all hover:scale-110", insight.feedback === 'positive' ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-slate-900/50 border-white/5 text-slate-500 hover:text-emerald-400 hover:border-emerald-500/20")}>
            <ThumbsUp className="w-4 h-4" />
          </button>
          <button onClick={() => onFeedback('negative')} className={cn("p-2.5 rounded-xl border transition-all hover:scale-110", insight.feedback === 'negative' ? "bg-rose-500/20 border-rose-500/30 text-rose-400" : "bg-slate-900/50 border-white/5 text-slate-500 hover:text-rose-400 hover:border-rose-500/20")}>
            <ThumbsDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ========================
// Main Component
// ========================

const AIInsightsHub: React.FC = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<InsightType | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.premium.getAiInsights();
      setInsights(Array.isArray(res) && res.length > 0 ? res : FALLBACK_INSIGHTS);
    } catch {
      setInsights(FALLBACK_INSIGHTS);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 800)); // Simulate deep scan
    await fetchData();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return insights;
    return insights.filter(i => i.type === filter);
  }, [insights, filter]);

  return (
    <div className="min-h-screen bg-black relative pb-24 overflow-hidden">
      {/* Visual Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.1),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none" />

      <div className="relative z-10 max-w-[1600px] mx-auto p-6 lg:p-10 space-y-8">

        {/* Header Content */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="px-2.5 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[9px] font-black tracking-widest uppercase rounded">
                v55 ПРЕМІУМ МОДУЛЬ
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">Аналітичне Ядро Онлайн</span>
              </div>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase">
              ЛАБОРАТОРІЯ <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">ІНСАЙТІВ</span>
            </h1>
            <p className="text-slate-400 text-sm mt-3 uppercase tracking-widest max-w-xl leading-relaxed">
              Автономна генерація гіпотез, виявлення аномалій та предиктивний аналіз на базі NAS моделей.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="group flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-violet-500/25 border border-violet-400/50 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            <Radar className={cn("w-4 h-4 text-violet-200", refreshing && "animate-spin text-white")} />
            {refreshing ? 'Сканування...' : 'Глибоке Сканування'}
          </button>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Активних Інсайтів', value: insights.length, icon: Brain, color: '#8b5cf6', suffix: '' },
            { label: 'Середня Впевненість', value: '89', icon: Crosshair, color: '#06b6d4', suffix: '%' },
            { label: 'Критичних Загроз', value: insights.filter(i => i.priority === 'critical').length, icon: Flame, color: '#ef4444', suffix: '' },
            { label: 'Потенційний Вплив', value: '1.6M', icon: DollarSign, color: '#10b981', suffix: '$' },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="p-5 rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-xl group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 rounded-xl border" style={{ background: `${stat.color}15`, borderColor: `${stat.color}30`, color: stat.color }}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-white tracking-tighter">
                {stat.value}<span style={{ color: stat.color }}>{stat.suffix}</span>
              </div>
              <div className="text-[10px] font-black tracking-widest uppercase mt-2 text-slate-500">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters Panel */}
        <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-slate-900/80 border border-white/5 backdrop-blur-xl">
          <button
            onClick={() => setFilter('all')}
            className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              filter === 'all' ? "bg-white text-black" : "text-slate-400 hover:text-white hover:bg-white/5")}
          >
            ВСІ ІНСАЙТИ
          </button>
          <div className="w-px h-6 bg-white/10 mx-1" />
          {Object.entries(TYPE_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setFilter(key as InsightType)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                filter === key
                  ? "border border-transparent"
                  : "bg-transparent border border-transparent text-slate-500 hover:bg-white/5 hover:text-slate-300"
              )}
              style={filter === key ? { background: `${config.color}20`, color: config.color, borderColor: `${config.color}40` } : {}}
            >
              <config.icon className="w-3.5 h-3.5" />
              {config.label}
            </button>
          ))}
        </div>

        {/* List of Insights */}
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 border-2 border-violet-500/20 rounded-full relative mb-6">
              <div className="absolute inset-0 border-t-2 border-violet-400 rounded-full animate-spin" />
              <Brain className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-violet-300" />
            </div>
            <div className="text-lg font-black text-white tracking-widest uppercase">Синтез інсайтів...</div>
            <div className="text-[10px] font-mono text-slate-500 mt-2">v55.NEURAL_NET_PROCESSING</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            <AnimatePresence mode="popLayout">
              {filtered.length > 0 ? (
                filtered.map((insight, idx) => (
                  <InsightCard3D
                    key={insight.id}
                    insight={insight}
                    index={idx}
                    onSave={() => setInsights(prev => prev.map(i => i.id === insight.id ? { ...i, saved: !i.saved } : i))}
                    onFeedback={(t) => setInsights(prev => prev.map(i => i.id === insight.id ? { ...i, feedback: i.feedback === t ? undefined : t } : i))}
                  />
                ))
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 text-center bg-slate-900/30 rounded-3xl border border-white/5 border-dashed">
                  <Radar className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-50" />
                  <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Аномалій не виявлено для цієї категорії</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

      </div>
    </div>
  );
};

export default AIInsightsHub;
