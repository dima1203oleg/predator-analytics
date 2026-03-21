/**
 * PREDATOR AI Insights Engine - Механізм AI Інсайтів
 *
 * Персоналізовані рекомендації та прогнози для кожної персони:
 * - Аналіз патернів у митних даних
 * - Передбачення трендів
 * - Виявлення можливостей
 * - Оцінка ризиків
 *
 * © 2026 PREDATOR Analytics
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactECharts from '@/components/ECharts';
import * as echarts from 'echarts';
import {
  BrainCircuit, Sparkles, TrendingUp, TrendingDown, Target,
  Lightbulb, AlertTriangle, DollarSign, Globe, RefreshCw,
  ChevronRight, Clock, Zap, Play, CheckCircle, XCircle
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { premiumLocales } from '../../locales/uk/premium';

// ============================================
// Types
// ============================================
export interface AIInsight {
  id: string;
  type: 'prediction' | 'opportunity' | 'risk' | 'recommendation';
  title: string;
  summary: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  timeframe: string;
  details?: {
    currentValue?: number;
    predictedValue?: number;
    change?: number;
    factors?: string[];
  };
  chartData?: { name: string; value: number }[];
  actions?: { label: string; action: string }[];
  createdAt: Date;
}

// ============================================
// Insight Card Component
// ============================================
const InsightCard: React.FC<{
  insight: AIInsight;
  persona: string;
  onAction?: (action: string) => void;
}> = ({ insight, persona, onAction }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const personaColor = persona === 'TITAN' ? 'amber' : persona === 'INQUISITOR' ? 'rose' : 'indigo';

  const typeConfig = {
    prediction: { icon: TrendingUp, color: 'emerald', label: premiumLocales.aiInsights.types.prediction },
    opportunity: { icon: Sparkles, color: 'amber', label: premiumLocales.aiInsights.types.opportunity },
    risk: { icon: AlertTriangle, color: 'rose', label: premiumLocales.aiInsights.types.risk },
    recommendation: { icon: Lightbulb, color: 'blue', label: premiumLocales.aiInsights.types.recommendation }
  };

  const impactConfig = {
    high: { color: 'rose', label: premiumLocales.aiInsights.impact.high },
    medium: { color: 'amber', label: premiumLocales.aiInsights.impact.medium },
    low: { color: 'emerald', label: premiumLocales.aiInsights.impact.low }
  };

  const config = typeConfig[insight.type];
  const impact = impactConfig[insight.impact];
  const Icon = config.icon;

  const chartOption = insight.chartData ? {
    backgroundColor: 'transparent',
    grid: { left: 5, right: 5, top: 10, bottom: 10 },
    xAxis: { show: false, type: 'category', data: insight.chartData.map(d => d.name) },
    yAxis: { show: false, type: 'value' },
    series: [{
      data: insight.chartData.map(d => d.value),
      type: 'line',
      smooth: true,
      showSymbol: false,
      lineStyle: { color: `hsl(var(--${config.color}-500))`, width: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: `hsla(var(--${config.color}-500), 0.3)` },
          { offset: 1, color: `hsla(var(--${config.color}-500), 0)` }
        ])
      }
    }]
  } : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-5 rounded-2xl border backdrop-blur-xl transition-all cursor-pointer",
        `bg-${config.color}-500/5 border-${config.color}-500/20 hover:border-${config.color}-500/40`
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-xl", `bg-${config.color}-500/20`)}>
            <Icon className={`text-${config.color}-400`} size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                `bg-${config.color}-500/20 text-${config.color}-400`
              )}>
                {config.label}
              </span>
              <span className={cn(
                "text-[8px] font-bold px-2 py-0.5 rounded",
                `bg-${impact.color}-500/10 text-${impact.color}-400`
              )}>
                {impact.label}
              </span>
            </div>
            <h4 className="text-sm font-black text-white leading-tight">{insight.title}</h4>
          </div>
        </div>

        {/* Confidence */}
        <div className="text-right">
          <div className={cn("text-xl font-black", `text-${config.color}-400`)}>
            {insight.confidence}%
          </div>
          <div className="text-[8px] text-slate-500 uppercase">{premiumLocales.aiInsights.confidence}</div>
        </div>
      </div>

      {/* Summary */}
      <p className="text-[11px] text-slate-400 leading-relaxed mb-3">{insight.summary}</p>

      {/* Mini Chart */}
      {chartOption && (
      <div className="h-[60px] -mx-2 mb-3">
        <ReactECharts option={chartOption} className="w-full h-full" theme="dark" />
      </div>
      )}

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {insight.details && (
              <div className="grid grid-cols-3 gap-3 mb-4 pt-3 border-t border-white/5">
                {insight.details.currentValue !== undefined && (
                  <div className="bg-black/30 rounded-xl p-3 text-center">
                    <div className="text-[9px] text-slate-500 uppercase mb-1">{premiumLocales.aiInsights.details.current}</div>
                    <div className="text-sm font-black text-white">
                      ${insight.details.currentValue.toLocaleString()}
                    </div>
                  </div>
                )}
                {insight.details.predictedValue !== undefined && (
                  <div className="bg-black/30 rounded-xl p-3 text-center">
                    <div className="text-[9px] text-slate-500 uppercase mb-1">{premiumLocales.aiInsights.details.forecast}</div>
                    <div className={cn("text-sm font-black", `text-${config.color}-400`)}>
                      ${insight.details.predictedValue.toLocaleString()}
                    </div>
                  </div>
                )}
                {insight.details.change !== undefined && (
                  <div className="bg-black/30 rounded-xl p-3 text-center">
                    <div className="text-[9px] text-slate-500 uppercase mb-1">{premiumLocales.aiInsights.details.change}</div>
                    <div className={cn(
                      "text-sm font-black",
                      insight.details.change > 0 ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {insight.details.change > 0 ? '+' : ''}{insight.details.change}%
                    </div>
                  </div>
                )}
              </div>
            )}

            {insight.details?.factors && (
              <div className="mb-4">
                <div className="text-[9px] font-black text-slate-500 uppercase mb-2">{premiumLocales.aiInsights.details.factors}</div>
                <div className="space-y-1">
                  {insight.details.factors.map((factor, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] text-slate-400">
                      <div className={cn("w-1 h-1 rounded-full", `bg-${config.color}-500`)} />
                      {factor}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {insight.actions && (
              <div className="flex flex-wrap gap-2">
                {insight.actions.map((action, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); onAction?.(action.action); }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all",
                      `bg-${config.color}-500/20 text-${config.color}-400 hover:bg-${config.color}-500 hover:text-white`
                    )}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
        <div className="flex items-center gap-2 text-[9px] text-slate-600">
          <Clock size={10} />
          {insight.timeframe}
        </div>
        <ChevronRight
          size={14}
          className={cn(
            "text-slate-600 transition-transform",
            isExpanded && "rotate-90"
          )}
        />
      </div>
    </motion.div>
  );
};

// ============================================
// AI Insights Panel
// ============================================
export const AIInsightsPanel: React.FC<{
  persona: string;
}> = ({ persona }) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const personaColor = persona === 'TITAN' ? 'amber' : persona === 'INQUISITOR' ? 'rose' : 'indigo';

    const fetchInsights = async () => {
      setLoading(true);
      try {
        const data = await intelligenceApi.getAiInsights();
        // Fallback to persona-specific recommendations if main insights are empty
        const recommendations = await intelligenceApi.getDashboardRecommendations(persona);
        
        const combined = [
          ...(Array.isArray(data) ? data : (data?.insights || [])),
          ...(Array.isArray(recommendations) ? recommendations : (recommendations?.recommendations || []))
        ].map((item: any) => ({
          ...item,
          id: item.id || Math.random().toString(),
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date()
        }));
        
        setInsights(combined);
      } catch (err) {
        console.error("Failed to fetch insights:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [persona]);

  const handleGenerateNew = async () => {
    setIsGenerating(true);
    try {
      await intelligenceApi.triggerSelfImprovement('insights');
      // Re-fetch after trigger
      const data = await intelligenceApi.getAiInsights();
      setInsights(Array.isArray(data) ? data : (data?.insights || []));
    } catch (err) {
      console.error("Failed to generate new insights:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAction = (action: string) => {
    console.log('Action triggered:', action);
    // Implement action handlers
  };

  return (
    <div className="bg-slate-950/80 border border-white/10 rounded-[32px] backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn("p-3 rounded-2xl", `bg-${personaColor}-500/20`)}>
            <BrainCircuit className={`text-${personaColor}-400`} size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider">
              {premiumLocales.aiInsights.title}
            </h3>
            <p className="text-[10px] text-slate-500 font-mono">
              {premiumLocales.aiInsights.subtitle}
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerateNew}
          disabled={isGenerating}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
            isGenerating
              ? "bg-white/5 text-slate-500 cursor-wait"
              : `bg-${personaColor}-500/20 text-${personaColor}-400 hover:bg-${personaColor}-500 hover:text-white`
          )}
        >
          <RefreshCw size={14} className={cn(isGenerating && "animate-spin")} />
          {isGenerating ? premiumLocales.aiInsights.generating : premiumLocales.aiInsights.update}
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className={cn(
              "w-12 h-12 border-2 rounded-full animate-spin mb-4",
              `border-${personaColor}-500 border-t-transparent`
            )} />
            <p className="text-sm text-slate-500">{premiumLocales.aiInsights.analyzing}</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {insights.map((insight, i) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <InsightCard
                  insight={insight}
                  persona={persona}
                  onAction={handleAction}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {!loading && insights.length === 0 && (
          <div className="text-center py-16 text-slate-600">
            <BrainCircuit size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-sm font-medium">{premiumLocales.aiInsights.noInsights}</p>
            <p className="text-xs text-slate-600 mt-1">{premiumLocales.aiInsights.noInsightsDesc}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsightsPanel;
