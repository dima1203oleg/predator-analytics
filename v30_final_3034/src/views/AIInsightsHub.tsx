/**
 * 🧠 AI Insights Hub
 *
 * Центр AI-driven інсайтів та рекомендацій
 * Machine Learning predictions, anomaly detection
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Lightbulb,
  Zap,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Share2,
  RefreshCw,
  Filter,
  Clock,
  DollarSign,
  Package,
  Building2,
  Shield,
  Crown,
  Star,
  ArrowRight,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';

// ========================
// Types
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

interface PredictionCard {
  id: string;
  title: string;
  currentValue: number;
  predictedValue: number;
  timeframe: string;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
}

// ========================
// Mock Data
// ========================

const insights: AIInsight[] = [
  {
    id: '1',
    type: 'opportunity',
    priority: 'critical',
    title: 'Оптимальний час для закупівлі LED панелей',
    description: 'На основі аналізу 15,000 декларацій, ціни на LED панелі досягли мінімуму за 6 місяців. Прогнозується зростання на 18% протягом наступних 2 тижнів.',
    confidence: 94,
    impact: 'Економія до $45,000',
    category: 'Закупівлі',
    createdAt: '2026-02-03T04:30:00',
    actionable: true,
    actions: [
      { label: 'Знайти постачальників', type: 'primary' },
      { label: 'Порівняти ціни', type: 'secondary' }
    ],
    saved: false
  },
  {
    id: '2',
    type: 'anomaly',
    priority: 'high',
    title: 'Незвична активність компанії "ТрансСхема"',
    description: 'Виявлено 340% зростання імпорту за останній тиждень. Патерн співпадає з відомими схемами заниження митної вартості.',
    confidence: 87,
    impact: 'Ризик: $120,000',
    category: 'Ризики',
    createdAt: '2026-02-03T03:15:00',
    actionable: true,
    actions: [
      { label: 'Розпочати розслідування', type: 'primary' },
      { label: 'Переглянути декларації', type: 'secondary' }
    ],
    saved: true
  },
  {
    id: '3',
    type: 'prediction',
    priority: 'medium',
    title: 'Прогноз: Зростання імпорту сонячних панелей',
    description: 'ML-модель прогнозує 45% зростання попиту на сонячні панелі у Q2 2026 на основі державних програм та цінових трендів.',
    confidence: 82,
    impact: 'Ринок: +$12M',
    category: 'Тренди',
    createdAt: '2026-02-03T02:00:00',
    actionable: true,
    actions: [
      { label: 'Аналіз ринку', type: 'primary' }
    ],
    saved: false
  },
  {
    id: '4',
    type: 'recommendation',
    priority: 'medium',
    title: 'Рекомендація: Диверсифікація постачальників',
    description: 'Ваша залежність від китайських постачальників становить 78%. Рекомендуємо розглянути альтернативи з В\'єтнаму та Польщі.',
    confidence: 91,
    impact: 'Зниження ризику',
    category: 'Стратегія',
    createdAt: '2026-02-02T18:00:00',
    actionable: true,
    actions: [
      { label: 'Знайти альтернативи', type: 'primary' }
    ],
    saved: false
  },
  {
    id: '5',
    type: 'risk',
    priority: 'high',
    title: 'Ризик: Затримки на митниці "Рава-Руська"',
    description: 'AI виявив патерн затримок на 3-5 днів для вантажів через цей пункт. Рекомендуємо альтернативні маршрути.',
    confidence: 89,
    impact: 'Затримки: 3-5 днів',
    category: 'Логістика',
    createdAt: '2026-02-02T14:30:00',
    actionable: true,
    actions: [
      { label: 'Переглянути маршрути', type: 'primary' }
    ],
    saved: true
  },
];

const predictions: PredictionCard[] = [
  { id: '1', title: 'Імпорт електроніки', currentValue: 245, predictedValue: 289, timeframe: '30 днів', confidence: 87, trend: 'up' },
  { id: '2', title: 'Ціни на добрива', currentValue: 420, predictedValue: 385, timeframe: '14 днів', confidence: 82, trend: 'down' },
  { id: '3', title: 'Обсяг з Китаю', currentValue: 1.2, predictedValue: 1.45, timeframe: '7 днів', confidence: 91, trend: 'up' },
  { id: '4', title: 'Ризик-скор ринку', currentValue: 45, predictedValue: 52, timeframe: '30 днів', confidence: 78, trend: 'up' },
];

// ========================
// Components
// ========================

const typeConfig = {
  prediction: { icon: Brain, color: 'purple', label: 'Прогноз' },
  anomaly: { icon: AlertTriangle, color: 'rose', label: 'Аномалія' },
  opportunity: { icon: Lightbulb, color: 'emerald', label: 'Можливість' },
  risk: { icon: Shield, color: 'amber', label: 'Ризик' },
  recommendation: { icon: Target, color: 'cyan', label: 'Рекомендація' }
};

const priorityConfig = {
  critical: { color: 'rose', label: 'Критичний' },
  high: { color: 'amber', label: 'Високий' },
  medium: { color: 'cyan', label: 'Середній' },
  low: { color: 'slate', label: 'Низький' }
};

const InsightCard: React.FC<{
  insight: AIInsight;
  onSave: () => void;
  onFeedback: (type: 'positive' | 'negative') => void;
}> = ({ insight, onSave, onFeedback }) => {
  const type = typeConfig[insight.type];
  const priority = priorityConfig[insight.priority];
  const TypeIcon = type.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        p-5 rounded-2xl border-l-4 transition-all
        ${insight.priority === 'critical' ? 'border-l-rose-500 bg-rose-500/5' :
          insight.priority === 'high' ? 'border-l-amber-500 bg-amber-500/5' :
          'border-l-white/10 bg-slate-900/60'}
        border border-white/5
      `}
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl bg-${type.color}-500/20`}>
          <TypeIcon className={`text-${type.color}-400`} size={24} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`px-2 py-0.5 text-xs font-bold rounded-full bg-${type.color}-500/20 text-${type.color}-400`}>
              {type.label}
            </span>
            <span className={`px-2 py-0.5 text-xs font-bold rounded-full bg-${priority.color}-500/20 text-${priority.color}-400`}>
              {priority.label}
            </span>
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-purple-500/20 text-purple-400 flex items-center gap-1">
              <Brain size={10} />
              {insight.confidence}% впевненість
            </span>
          </div>

          <h3 className="font-bold text-white text-lg mb-2">{insight.title}</h3>
          <p className="text-sm text-slate-400 mb-3">{insight.description}</p>

          <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
            <span className="flex items-center gap-1">
              <DollarSign size={12} />
              {insight.impact}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {new Date(insight.createdAt).toLocaleTimeString('uk', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span>{insight.category}</span>
          </div>

          {/* Actions */}
          {insight.actionable && insight.actions && (
            <div className="flex items-center gap-2 flex-wrap">
              {insight.actions.map((action, i) => (
                <button
                  key={i}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                    action.type === 'primary'
                      ? `bg-${type.color}-500/20 text-${type.color}-400 hover:bg-${type.color}-500/30`
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Side actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onSave}
            className={`p-2 rounded-lg transition-colors ${
              insight.saved ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500 hover:text-white'
            }`}
            title="Зберегти"
          >
            <Bookmark size={16} fill={insight.saved ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => onFeedback('positive')}
            className={`p-2 rounded-lg transition-colors ${
              insight.feedback === 'positive' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500 hover:text-emerald-400'
            }`}
            title="Корисно"
          >
            <ThumbsUp size={16} />
          </button>
          <button
            onClick={() => onFeedback('negative')}
            className={`p-2 rounded-lg transition-colors ${
              insight.feedback === 'negative' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-500 hover:text-rose-400'
            }`}
            title="Не корисно"
          >
            <ThumbsDown size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const PredictionWidget: React.FC<{ prediction: PredictionCard }> = ({ prediction }) => {
  const change = ((prediction.predictedValue - prediction.currentValue) / prediction.currentValue) * 100;

  return (
    <div className="p-4 bg-slate-900/60 border border-white/5 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-white text-sm">{prediction.title}</h4>
        <span className="text-xs text-slate-500">{prediction.timeframe}</span>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs text-slate-500">Зараз</p>
          <p className="text-lg font-bold text-white">{prediction.currentValue}</p>
        </div>
        <ArrowRight className={`text-${prediction.trend === 'up' ? 'emerald' : prediction.trend === 'down' ? 'rose' : 'slate'}-400`} size={20} />
        <div className="text-right">
          <p className="text-xs text-slate-500">Прогноз</p>
          <p className={`text-lg font-bold text-${prediction.trend === 'up' ? 'emerald' : 'rose'}-400`}>
            {prediction.predictedValue}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1 text-xs ${
          prediction.trend === 'up' ? 'text-emerald-400' : 'text-rose-400'
        }`}>
          {prediction.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {change > 0 ? '+' : ''}{change.toFixed(1)}%
        </div>
        <div className="flex items-center gap-1 text-xs text-purple-400">
          <Brain size={12} />
          {prediction.confidence}%
        </div>
      </div>
    </div>
  );
};

// ========================
// Main Component
// ========================

const AIInsightsHub: React.FC = () => {
  const [insightList, setInsightList] = useState(insights);
  const [filter, setFilter] = useState<InsightType | 'all'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredInsights = useMemo(() => {
    if (filter === 'all') return insightList;
    return insightList.filter(i => i.type === filter);
  }, [insightList, filter]);

  const stats = useMemo(() => ({
    total: insightList.length,
    critical: insightList.filter(i => i.priority === 'critical').length,
    opportunities: insightList.filter(i => i.type === 'opportunity').length,
    avgConfidence: Math.round(insightList.reduce((acc, i) => acc + i.confidence, 0) / insightList.length)
  }), [insightList]);

  const toggleSave = (id: string) => {
    setInsightList(prev => prev.map(i =>
      i.id === id ? { ...i, saved: !i.saved } : i
    ));
  };

  const setFeedback = (id: string, type: 'positive' | 'negative') => {
    setInsightList(prev => prev.map(i =>
      i.id === id ? { ...i, feedback: i.feedback === type ? undefined : type } : i
    ));
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <Brain className="text-purple-400" />
              AI Insights Hub
              <span className="ml-2 px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-full flex items-center gap-1">
                <Crown size={14} />
                Premium
              </span>
            </h1>
            <p className="text-slate-500 mt-1">
              Machine Learning аналіз та рекомендації
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl transition-colors ${
                isRefreshing ? 'opacity-50' : 'hover:bg-slate-700'
              }`}
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              Оновити
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-sm">
              <Sparkles size={16} />
              Глибокий аналіз
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Sparkles className="text-purple-400" size={18} />
              <span className="text-2xl font-black text-white">{stats.total}</span>
            </div>
            <p className="text-xs text-slate-500">Активні інсайти</p>
          </div>

          <div className="bg-slate-900/60 border border-rose-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="text-rose-400" size={18} />
              <span className="text-2xl font-black text-rose-400">{stats.critical}</span>
            </div>
            <p className="text-xs text-slate-500">Критичних</p>
          </div>

          <div className="bg-slate-900/60 border border-emerald-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Lightbulb className="text-emerald-400" size={18} />
              <span className="text-2xl font-black text-emerald-400">{stats.opportunities}</span>
            </div>
            <p className="text-xs text-slate-500">Можливостей</p>
          </div>

          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Brain className="text-purple-400" size={18} />
              <span className="text-2xl font-black text-purple-400">{stats.avgConfidence}%</span>
            </div>
            <p className="text-xs text-purple-400/70">Середня впевненість</p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Insights */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filters */}
            <div className="flex gap-2 flex-wrap mb-4">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-500 hover:text-white'
                }`}
              >
                Всі
              </button>
              {Object.entries(typeConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as InsightType)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === key ? `bg-${config.color}-500/20 text-${config.color}-400` : 'text-slate-500 hover:text-white'
                  }`}
                >
                  <config.icon size={14} />
                  {config.label}
                </button>
              ))}
            </div>

            {/* Insights List */}
            {filteredInsights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onSave={() => toggleSave(insight.id)}
                onFeedback={(type) => setFeedback(insight.id, type)}
              />
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Status */}
            <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="relative">
                  <Brain className="text-purple-400" size={20} />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                </div>
                <span className="font-bold text-white">AI Engine</span>
                <span className="ml-auto text-xs text-emerald-400">Online</span>
              </div>
              <p className="text-xs text-slate-400">
                Аналізовано 15,234 декларації за останню годину
              </p>
            </div>

            {/* Predictions */}
            <div>
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="text-cyan-400" size={18} />
                ML Прогнози
              </h3>
              <div className="space-y-3">
                {predictions.map((pred) => (
                  <PredictionWidget key={pred.id} prediction={pred} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsHub;
