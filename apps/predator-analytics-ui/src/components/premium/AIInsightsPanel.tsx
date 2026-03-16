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

  useEffect(() => {
    // Generate mock insights based on persona
    const generateInsights = () => {
      const baseInsights: AIInsight[] = [];

      if (persona === 'TITAN') {
        baseInsights.push(
          {
            id: 'titan-pred-1',
            type: 'prediction',
            title: premiumLocales.aiInsights.items.titan.electronicsGrowth.title,
            summary: premiumLocales.aiInsights.items.titan.electronicsGrowth.summary,
            confidence: 87,
            impact: 'high',
            timeframe: premiumLocales.aiInsights.items.titan.electronicsGrowth.timeframe,
            details: {
              currentValue: 45000000,
              predictedValue: 55350000,
              change: 23,
              factors: premiumLocales.aiInsights.items.titan.electronicsGrowth.factors
            },
            chartData: [
              { name: 'Січ', value: 38 },
              { name: 'Лют', value: 42 },
              { name: 'Бер', value: 45 },
              { name: 'Кві', value: 52 },
              { name: 'Тра', value: 58 }
            ],
            actions: [
              { label: 'Деталі', action: 'view-details' },
              { label: 'Експорт', action: 'export' }
            ],
            createdAt: new Date()
          },
          {
            id: 'titan-opp-1',
            type: 'opportunity',
            title: premiumLocales.aiInsights.items.titan.newSupplier.title,
            summary: premiumLocales.aiInsights.items.titan.newSupplier.summary,
            confidence: 92,
            impact: 'high',
            timeframe: premiumLocales.aiInsights.items.titan.newSupplier.timeframe,
            details: {
              currentValue: 450,
              predictedValue: 297,
              change: -34,
              factors: premiumLocales.aiInsights.items.titan.newSupplier.factors
            },
            actions: [
              { label: 'Переглянути', action: 'view-supplier' },
              { label: 'Порівняти', action: 'compare' }
            ],
            createdAt: new Date()
          },
          {
            id: 'titan-rec-1',
            type: 'recommendation',
            title: premiumLocales.aiInsights.items.titan.diversifyChips.title,
            summary: premiumLocales.aiInsights.items.titan.diversifyChips.summary,
            confidence: 95,
            impact: 'medium',
            timeframe: premiumLocales.aiInsights.items.titan.diversifyChips.timeframe,
            details: {
              factors: premiumLocales.aiInsights.items.titan.diversifyChips.factors
            },
            actions: [
              { label: 'Показати альтернативи', action: 'show-alternatives' }
            ],
            createdAt: new Date()
          }
        );
      }

      if (persona === 'INQUISITOR') {
        baseInsights.push(
          {
            id: 'inq-risk-1',
            type: 'risk',
            title: premiumLocales.aiInsights.items.inquisitor.underpricingScheme.title,
            summary: premiumLocales.aiInsights.items.inquisitor.underpricingScheme.summary,
            confidence: 94,
            impact: 'high',
            timeframe: premiumLocales.aiInsights.items.inquisitor.underpricingScheme.timeframe,
            details: {
              currentValue: 8500000,
              predictedValue: 2100000,
              change: -75,
              factors: premiumLocales.aiInsights.items.inquisitor.underpricingScheme.factors
            },
            chartData: [
              { name: 'Реальна', value: 85 },
              { name: 'Декл.', value: 21 }
            ],
            actions: [
              { label: "Мережа зв'язків", action: 'view-network' },
              { label: 'Створити кейс', action: 'create-case' }
            ],
            createdAt: new Date()
          },
          {
            id: 'inq-pred-1',
            type: 'prediction',
            title: premiumLocales.aiInsights.items.inquisitor.anomalySpike.title,
            summary: premiumLocales.aiInsights.items.inquisitor.anomalySpike.summary,
            confidence: 82,
            impact: 'medium',
            timeframe: premiumLocales.aiInsights.items.inquisitor.anomalySpike.timeframe,
            details: {
              factors: premiumLocales.aiInsights.items.inquisitor.anomalySpike.factors
            },
            actions: [
              { label: 'Налаштувати моніторинг', action: 'setup-monitoring' }
            ],
            createdAt: new Date()
          }
        );
      }

      if (persona === 'SOVEREIGN') {
        baseInsights.push(
          {
            id: 'sov-pred-1',
            type: 'prediction',
            title: premiumLocales.aiInsights.items.sovereign.tradeFlowShift.title,
            summary: premiumLocales.aiInsights.items.sovereign.tradeFlowShift.summary,
            confidence: 78,
            impact: 'high',
            timeframe: premiumLocales.aiInsights.items.sovereign.tradeFlowShift.timeframe,
            details: {
              change: -15,
              factors: premiumLocales.aiInsights.items.sovereign.tradeFlowShift.factors
            },
            chartData: [
              { name: 'Азія', value: 65 },
              { name: '', value: 55 },
              { name: '', value: 48 },
              { name: 'ЄС', value: 52 }
            ],
            actions: [
              { label: 'Повний звіт', action: 'full-report' }
            ],
            createdAt: new Date()
          },
          {
            id: 'sov-risk-1',
            type: 'risk',
            title: premiumLocales.aiInsights.items.sovereign.microchipConcentration.title,
            summary: premiumLocales.aiInsights.items.sovereign.microchipConcentration.summary,
            confidence: 96,
            impact: 'high',
            timeframe: premiumLocales.aiInsights.items.sovereign.microchipConcentration.timeframe,
            details: {
              factors: premiumLocales.aiInsights.items.sovereign.microchipConcentration.factors
            },
            actions: [
              { label: 'Аналіз залежностей', action: 'dependency-analysis' }
            ],
            createdAt: new Date()
          },
          {
            id: 'sov-rec-1',
            type: 'recommendation',
            title: premiumLocales.aiInsights.items.sovereign.strategicReserve.title,
            summary: premiumLocales.aiInsights.items.sovereign.strategicReserve.summary,
            confidence: 88,
            impact: 'medium',
            timeframe: premiumLocales.aiInsights.items.sovereign.strategicReserve.timeframe,
            details: {
              factors: premiumLocales.aiInsights.items.sovereign.strategicReserve.factors
            },
            actions: [
              { label: 'Розрахувати бюджет', action: 'calculate-budget' }
            ],
            createdAt: new Date()
          }
        );
      }

      return baseInsights;
    };

    setTimeout(() => {
      setInsights(generateInsights());
      setLoading(false);
    }, 1000);
  }, [persona]);

  const handleGenerateNew = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      // In real implementation, this would trigger new AI analysis
    }, 3000);
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
