/**
 * 🧠 AI Insights Hub
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
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
import { api } from '../services/api';

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

// Mock data removed in favor of API
const defaultInsights: AIInsight[] = [];
const defaultPredictions: PredictionCard[] = [];

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
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${action.type === 'primary'
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
            className={`p-2 rounded-lg transition-colors ${insight.saved ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500 hover:text-white'
              }`}
            title="Зберегти"
          >
            <Bookmark size={16} fill={insight.saved ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => onFeedback('positive')}
            className={`p-2 rounded-lg transition-colors ${insight.feedback === 'positive' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500 hover:text-emerald-400'
              }`}
            title="Корисно"
          >
            <ThumbsUp size={16} />
          </button>
          <button
            onClick={() => onFeedback('negative')}
            className={`p-2 rounded-lg transition-colors ${insight.feedback === 'negative' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-500 hover:text-rose-400'
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
        <div className={`flex items-center gap-1 text-xs ${prediction.trend === 'up' ? 'text-emerald-400' : 'text-rose-400'
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

const AIInsightsHub: React.FC<{ isWidgetMode?: boolean }> = ({ isWidgetMode }) => {
  const [insightList, setInsightList] = useState<AIInsight[]>([]);
  const [predictionsList, setPredictionsList] = useState<PredictionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<InsightType | 'all'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [insightsData, predictionsData] = await Promise.all([
        api.premium.getAiInsights(),
        api.premium.getPredictions()
      ]);
      setInsightList(Array.isArray(insightsData) ? insightsData : []);
      setPredictionsList(Array.isArray(predictionsData) ? predictionsData : []);
    } catch (err) {
      console.error("Failed to fetch AI insights", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredInsights = useMemo(() => {
    if (filter === 'all') return insightList;
    return insightList.filter(i => i.type === filter);
  }, [insightList, filter]);

  const stats = useMemo(() => {
    if (insightList.length === 0) return { total: 0, critical: 0, opportunities: 0, avgConfidence: 0 };
    return {
      total: insightList.length,
      critical: insightList.filter(i => i.priority === 'critical').length,
      opportunities: insightList.filter(i => i.type === 'opportunity').length,
      avgConfidence: Math.round(insightList.reduce((acc, i) => acc + i.confidence, 0) / insightList.length)
    };
  }, [insightList]);

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  return (
    <div className={isWidgetMode ? "w-full" : "min-h-screen bg-slate-950 p-6"}>
      {/* Background */}
      {!isWidgetMode && (
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
        </div>
      )}

      <div className={cn("relative z-10 mx-auto", isWidgetMode ? "w-full" : "max-w-6xl")}>
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
              className={`flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl transition-colors ${isRefreshing ? 'opacity-50' : 'hover:bg-slate-700'
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
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-500 hover:text-white'
                  }`}
              >
                Всі
              </button>
              {Object.entries(typeConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as InsightType)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === key ? `bg-${config.color}-500/20 text-${config.color}-400` : 'text-slate-500 hover:text-white'
                    }`}
                >
                  <config.icon size={14} />
                  {config.label}
                </button>
              ))}
            </div>

            {/* Insights List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-slate-500 font-mono text-sm tracking-widest uppercase italic">Генерація аналітичного ядра...</p>
              </div>
            ) : (
              filteredInsights.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  onSave={() => toggleSave(insight.id)}
                  onFeedback={(type) => setFeedback(insight.id, type)}
                />
              ))
            )}

            {!loading && filteredInsights.length === 0 && (
              <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-white/5">
                <Brain className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500">Інсайти відсутні для вибраного фільтра</p>
              </div>
            )}
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
                {loading ? (
                  Array(3).fill(0).map((_, i) => <div key={i} className="h-24 bg-slate-900/60 rounded-xl animate-pulse" />)
                ) : (
                  predictionsList.map((pred) => (
                    <PredictionWidget key={pred.id} prediction={pred} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsHub;
