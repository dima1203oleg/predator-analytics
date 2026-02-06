/**
 * PREDATOR Customs Analytics Dashboard - Спеціалізовані Віджети для Митних Даних
 *
 * Комплексний набір віджетів для аналізу митних декларацій:
 * - TopImportersWidget: Топ імпортерів за обсягом
 * - HSCodeAnalytics: Аналіз HS кодів
 * - PriceAnomalyDetector: Детекція цінових аномалій
 * - TradeFlowMap: Географія торгівлі
 * - CompetitorRadar: Радар конкурентів
 * - RiskScoreCard: Скоринг ризику
 *
 * © 2026 PREDATOR Analytics
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import {
  TrendingUp, TrendingDown, AlertTriangle, DollarSign, Ship,
  Globe, Target, Shield, Building2, BarChart3, PieChart, Activity,
  ArrowUpRight, ArrowDownRight, Search, Filter, Download, Eye,
  Zap, Star, ChevronRight, Layers, RefreshCw
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { api } from '../../services/api';
import { premiumLocales } from '../../locales/uk/premium';

// ============================================
// WIDGET: Top Importers by Volume
// ============================================
export const TopImportersWidget: React.FC<{
  persona: string;
  limit?: number;
}> = ({ persona, limit = 10 }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'volume' | 'value' | 'growth'>('volume');

  useEffect(() => {
    // Mock data - replace with real API
    const mockData = [
      { name: 'АльфаТрейд ТОВ', volume: 12450000, value: 89000000, growth: 34.2, risk: 12 },
      { name: 'ГлобалІмпорт', volume: 9800000, value: 67000000, growth: 18.5, risk: 8 },
      { name: 'ТехноСистемс', volume: 7600000, value: 54000000, growth: -5.2, risk: 45 },
      { name: 'МегаПостачальник', volume: 6900000, value: 48000000, growth: 22.1, risk: 15 },
      { name: 'Інтер-Трейд', volume: 5400000, value: 38000000, growth: 8.7, risk: 22 },
      { name: 'Укрімпорт ЛТД', volume: 4800000, value: 35000000, growth: -12.3, risk: 67 },
      { name: 'БізнесПартнер', volume: 4200000, value: 29000000, growth: 45.8, risk: 5 },
      { name: 'ЄвроЛогістика', volume: 3900000, value: 27000000, growth: 3.2, risk: 18 },
      { name: 'АзіяТранс', volume: 3500000, value: 24000000, growth: 67.4, risk: 38 },
      { name: 'НоваЕра ТОВ', volume: 3100000, value: 21000000, growth: -8.9, risk: 42 },
    ].slice(0, limit);

    setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 500);
  }, [limit]);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      if (sortBy === 'growth') return Math.abs(b.growth) - Math.abs(a.growth);
      return b[sortBy] - a[sortBy];
    });
  }, [data, sortBy]);

  const personaColor = persona === 'TITAN' ? 'amber' : persona === 'INQUISITOR' ? 'rose' : 'indigo';

  return (
    <div className="bg-slate-950/80 border border-white/10 rounded-[24px] backdrop-blur-xl overflow-hidden">
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-xl", `bg-${personaColor}-500/20`)}>
            <Building2 className={`text-${personaColor}-400`} size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wide">{premiumLocales.customsAnalytics.topImporters.title}</h3>
            <p className="text-[9px] text-slate-500 font-mono">{premiumLocales.customsAnalytics.topImporters.subtitle}</p>
          </div>
        </div>

        <div className="flex gap-1">
          {(['volume', 'value', 'growth'] as const).map(sort => (
            <button
              key={sort}
              onClick={() => setSortBy(sort)}
              className={cn(
                "px-2 py-1 rounded text-[8px] font-bold uppercase transition-all",
                sortBy === sort
                  ? `bg-${personaColor}-500/20 text-${personaColor}-400`
                  : "text-slate-600 hover:text-white"
              )}
            >
              {sort === 'volume' ? premiumLocales.customsAnalytics.topImporters.volume : sort === 'value' ? premiumLocales.customsAnalytics.topImporters.value : premiumLocales.customsAnalytics.topImporters.growth}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className={`text-${personaColor}-400 animate-spin`} size={24} />
          </div>
        ) : sortedData.map((item, i) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-xl hover:border-white/20 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-600 w-5">#{i + 1}</span>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                  {item.name}
                </div>
                <div className="text-[9px] text-slate-500 font-mono">
                  ${(item.value / 1000000).toFixed(1)}M
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Risk indicator for INQUISITOR */}
              {persona === 'INQUISITOR' && (
                <div className={cn(
                  "px-2 py-1 rounded text-[8px] font-bold",
                  item.risk > 50 ? "bg-rose-500/20 text-rose-400" :
                  item.risk > 25 ? "bg-amber-500/20 text-amber-400" :
                  "bg-emerald-500/20 text-emerald-400"
                )}>
                  {item.risk}% {premiumLocales.customsAnalytics.topImporters.riskLabel}
                </div>
              )}

              <div className={cn(
                "flex items-center gap-1 text-xs font-bold",
                item.growth > 0 ? "text-emerald-400" : "text-rose-400"
              )}>
                {item.growth > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(item.growth)}%
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// WIDGET: HS Code Analytics
// ============================================
export const HSCodeAnalyticsWidget: React.FC<{
  persona: string;
}> = ({ persona }) => {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const hsData = [
    { code: '8471', name: 'Комп\'ютери', volume: 45000000, anomalyScore: 78 },
    { code: '8517', name: 'Телефони', volume: 38000000, anomalyScore: 23 },
    { code: '7208', name: 'Сталевий прокат', volume: 32000000, anomalyScore: 45 },
    { code: '8703', name: 'Автомобілі', volume: 28000000, anomalyScore: 12 },
    { code: '3004', name: 'Ліки', volume: 24000000, anomalyScore: 56 },
    { code: '2710', name: 'Нафтопродукти', volume: 21000000, anomalyScore: 34 },
  ];

  const personaColor = persona === 'TITAN' ? 'amber' : persona === 'INQUISITOR' ? 'rose' : 'indigo';

  const chartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(2, 6, 23, 0.95)',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#e2e8f0', fontSize: 11 }
    },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '50%'],
      itemStyle: {
        borderRadius: 8,
        borderColor: '#020617',
        borderWidth: 2
      },
      label: {
        show: false
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 12,
          fontWeight: 'bold',
          color: '#fff'
        },
        itemStyle: {
          shadowBlur: 20,
          shadowColor: 'rgba(245, 158, 11, 0.5)'
        }
      },
      data: hsData.map((item, i) => ({
        value: item.volume,
        name: `${item.code} - ${item.name}`,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: `hsl(${40 + i * 25}, 80%, 50%)` },
            { offset: 1, color: `hsl(${40 + i * 25}, 80%, 30%)` }
          ])
        }
      }))
    }]
  };

  return (
    <div className="bg-slate-950/80 border border-white/10 rounded-[24px] backdrop-blur-xl overflow-hidden">
      <div className="p-5 border-b border-white/5 flex items-center gap-3">
        <div className={cn("p-2.5 rounded-xl", `bg-${personaColor}-500/20`)}>
          <Layers className={`text-${personaColor}-400`} size={18} />
        </div>
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wide">{premiumLocales.customsAnalytics.hsCode.title}</h3>
          <p className="text-[9px] text-slate-500 font-mono">{premiumLocales.customsAnalytics.hsCode.subtitle}</p>
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 gap-4">
        {/* Chart */}
        <div className="h-[200px]">
          <ReactECharts option={chartOption} className="w-full h-full" theme="dark" />
        </div>

        {/* Legend */}
        <div className="space-y-2">
          {hsData.map((item, i) => (
            <motion.div
              key={item.code}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setSelectedCode(item.code)}
              className={cn(
                "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all",
                selectedCode === item.code ? "bg-white/10" : "hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    i % 4 === 0 ? "bg-amber-500" :
                    i % 4 === 1 ? "bg-rose-500" :
                    i % 4 === 2 ? "bg-indigo-500" : "bg-emerald-500"
                  )}
                />
                <span className="text-[10px] font-bold text-white">{item.code}</span>
                <span className="text-[9px] text-slate-500">{item.name}</span>
              </div>

              {persona === 'INQUISITOR' && (
                <span className={cn(
                  "text-[8px] font-bold px-1.5 py-0.5 rounded",
                  item.anomalyScore > 60 ? "bg-rose-500/20 text-rose-400" :
                  item.anomalyScore > 30 ? "bg-amber-500/20 text-amber-400" :
                  "bg-emerald-500/20 text-emerald-400"
                )}>
                  {item.anomalyScore}%
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================
// WIDGET: Price Anomaly Detector
// ============================================
export const PriceAnomalyWidget: React.FC<{
  persona: string;
}> = ({ persona }) => {
  const anomalies = [
    { id: 1, hsCode: '8471.30', description: 'Ноутбуки', declared: 150, market: 450, deviation: -66.7, companies: 12 },
    { id: 2, hsCode: '8517.12', description: 'Смартфони', declared: 80, market: 180, deviation: -55.6, companies: 8 },
    { id: 3, hsCode: '7208.51', description: 'Сталевий лист', declared: 320, market: 480, deviation: -33.3, companies: 5 },
    { id: 4, hsCode: '3004.90', description: 'Ліки', declared: 1200, market: 800, deviation: 50.0, companies: 3 },
  ];

  const personaColor = persona === 'INQUISITOR' ? 'rose' : 'amber';

  return (
    <div className="bg-slate-950/80 border border-white/10 rounded-[24px] backdrop-blur-xl overflow-hidden">
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/20">
            <AlertTriangle className="text-rose-400" size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wide">{premiumLocales.customsAnalytics.priceAnomalies.title}</h3>
            <p className="text-[9px] text-slate-500 font-mono">{premiumLocales.customsAnalytics.priceAnomalies.subtitle}</p>
          </div>
        </div>

        <span className="px-3 py-1.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-black">
          {anomalies.length} {premiumLocales.customsAnalytics.priceAnomalies.detected}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {anomalies.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 bg-black/40 border border-rose-500/20 rounded-xl hover:border-rose-500/40 transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-[9px] font-mono text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded">
                  HS {item.hsCode}
                </span>
                <h4 className="text-sm font-bold text-white mt-1">{item.description}</h4>
              </div>
              <div className={cn(
                "text-lg font-black",
                item.deviation < 0 ? "text-rose-400" : "text-amber-400"
              )}>
                {item.deviation > 0 ? '+' : ''}{item.deviation.toFixed(1)}%
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <div className="text-[8px] text-slate-500 uppercase mb-1">{premiumLocales.customsAnalytics.priceAnomalies.declared}</div>
                <div className="text-sm font-bold text-white">${item.declared}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <div className="text-[8px] text-slate-500 uppercase mb-1">{premiumLocales.customsAnalytics.priceAnomalies.market}</div>
                <div className="text-sm font-bold text-emerald-400">${item.market}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <div className="text-[8px] text-slate-500 uppercase mb-1">{premiumLocales.customsAnalytics.priceAnomalies.companies}</div>
                <div className="text-sm font-bold text-amber-400">{item.companies}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// WIDGET: Trade Flow Geography
// ============================================
export const TradeFlowWidget: React.FC<{
  persona: string;
}> = ({ persona }) => {
  const countries = [
    { code: 'CN', name: 'Китай', volume: 45, change: 12.5 },
    { code: 'DE', name: 'Німеччина', volume: 18, change: -3.2 },
    { code: 'PL', name: 'Польща', volume: 12, change: 8.7 },
    { code: 'TR', name: 'Туреччина', volume: 9, change: 23.4 },
    { code: 'US', name: 'США', volume: 8, change: 5.1 },
    { code: 'IT', name: 'Італія', volume: 5, change: -1.8 },
    { code: 'OTHER', name: 'Інші', volume: 3, change: 0 },
  ];

  const personaColor = persona === 'TITAN' ? 'amber' : persona === 'INQUISITOR' ? 'rose' : 'indigo';

  return (
    <div className="bg-slate-950/80 border border-white/10 rounded-[24px] backdrop-blur-xl overflow-hidden">
      <div className="p-5 border-b border-white/5 flex items-center gap-3">
        <div className={cn("p-2.5 rounded-xl", `bg-${personaColor}-500/20`)}>
          <Globe className={`text-${personaColor}-400`} size={18} />
        </div>
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wide">{premiumLocales.customsAnalytics.tradeFlow.title}</h3>
          <p className="text-[9px] text-slate-500 font-mono">{premiumLocales.customsAnalytics.tradeFlow.subtitle}</p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {countries.map((country, i) => (
          <motion.div
            key={country.code}
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '100%' }}
            transition={{ delay: i * 0.1 }}
            className="space-y-1"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getCountryFlag(country.code)}</span>
                <span className="text-xs font-bold text-white">{country.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">{country.volume}%</span>
                {country.change !== 0 && (
                  <span className={cn(
                    "text-[10px] font-bold",
                    country.change > 0 ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {country.change > 0 ? '↑' : '↓'}{Math.abs(country.change)}%
                  </span>
                )}
              </div>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${country.volume}%` }}
                transition={{ delay: i * 0.1 + 0.2, duration: 0.5 }}
                className={cn("h-full rounded-full", `bg-gradient-to-r from-${personaColor}-600 to-${personaColor}-400`)}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Helper function for country flags
const getCountryFlag = (code: string): string => {
  const flags: Record<string, string> = {
    CN: '🇨🇳',
    DE: '🇩🇪',
    PL: '🇵🇱',
    TR: '🇹🇷',
    US: '🇺🇸',
    IT: '🇮🇹',
    OTHER: '🌍',
  };
  return flags[code] || '🏳️';
};

// ============================================
// WIDGET: Competitor Radar
// ============================================
export const CompetitorRadarWidget: React.FC<{
  persona: string;
}> = ({ persona }) => {
  const competitors = [
    { name: 'АльфаТрейд', metrics: { volume: 85, growth: 70, risk: 20, diversity: 60, speed: 75 } },
    { name: 'ГлобалІмпорт', metrics: { volume: 72, growth: 55, risk: 35, diversity: 80, speed: 65 } },
    { name: 'ТехноСистемс', metrics: { volume: 68, growth: 40, risk: 60, diversity: 45, speed: 55 } },
  ];

  const chartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(2, 6, 23, 0.95)',
      borderColor: 'rgba(255,255,255,0.1)',
    },
    legend: {
      data: competitors.map(c => c.name),
      bottom: 0,
      textStyle: { color: '#64748b', fontSize: 10 }
    },
    radar: {
      indicator: [
        { name: premiumLocales.customsAnalytics.competitorRadar.indicators.volume, max: 100 },
        { name: premiumLocales.customsAnalytics.competitorRadar.indicators.growth, max: 100 },
        { name: premiumLocales.customsAnalytics.competitorRadar.indicators.risk, max: 100 },
        { name: premiumLocales.customsAnalytics.competitorRadar.indicators.diversity, max: 100 },
        { name: premiumLocales.customsAnalytics.competitorRadar.indicators.speed, max: 100 },
      ],
      splitNumber: 4,
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      splitArea: { show: false },
      axisName: { color: '#64748b', fontSize: 9 }
    },
    series: [{
      type: 'radar',
      data: competitors.map((c, i) => ({
        value: Object.values(c.metrics),
        name: c.name,
        lineStyle: { color: `hsl(${40 + i * 60}, 80%, 50%)` },
        areaStyle: { color: `hsla(${40 + i * 60}, 80%, 50%, 0.2)` },
        itemStyle: { color: `hsl(${40 + i * 60}, 80%, 50%)` }
      }))
    }]
  };

  return (
    <div className="bg-slate-950/80 border border-white/10 rounded-[24px] backdrop-blur-xl overflow-hidden">
      <div className="p-5 border-b border-white/5 flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-amber-500/20">
          <Target className="text-amber-400" size={18} />
        </div>
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wide">{premiumLocales.customsAnalytics.competitorRadar.title}</h3>
          <p className="text-[9px] text-slate-500 font-mono">{premiumLocales.customsAnalytics.competitorRadar.subtitle}</p>
        </div>
      </div>

      <div className="h-[300px] p-4">
        <ReactECharts option={chartOption} className="w-full h-full" theme="dark" />
      </div>
    </div>
  );
};

// ============================================
// WIDGET: Risk Score Card
// ============================================
export const RiskScoreWidget: React.FC<{
  entityName: string;
  persona: string;
}> = ({ entityName, persona }) => {
  const [score, setScore] = useState(0);
  const targetScore = 73; // Mock score

  useEffect(() => {
    const timer = setTimeout(() => setScore(targetScore), 500);
    return () => clearTimeout(timer);
  }, []);

  const factors = [
    { name: premiumLocales.customsAnalytics.riskScore.factors.history, score: 65, weight: 25 },
    { name: premiumLocales.customsAnalytics.riskScore.factors.price, score: 82, weight: 30 },
    { name: premiumLocales.customsAnalytics.riskScore.factors.network, score: 45, weight: 20 },
    { name: premiumLocales.customsAnalytics.riskScore.factors.age, score: 88, weight: 15 },
    { name: premiumLocales.customsAnalytics.riskScore.factors.reputation, score: 72, weight: 10 },
  ];

  const getRiskLevel = (s: number) => {
    if (s >= 75) return { label: premiumLocales.customsAnalytics.riskScore.levels.critical, color: 'rose' };
    if (s >= 50) return { label: premiumLocales.customsAnalytics.riskScore.levels.high, color: 'orange' };
    if (s >= 25) return { label: premiumLocales.customsAnalytics.riskScore.levels.medium, color: 'amber' };
    return { label: premiumLocales.customsAnalytics.riskScore.levels.low, color: 'emerald' };
  };

  const riskLevel = getRiskLevel(score);

  return (
    <div className="bg-slate-950/80 border border-white/10 rounded-[24px] backdrop-blur-xl overflow-hidden">
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/20">
            <Shield className="text-rose-400" size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wide">{premiumLocales.customsAnalytics.riskScore.title}</h3>
            <p className="text-[9px] text-slate-500 font-mono">{entityName}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Main Score */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <svg className="w-32 h-32 -rotate-90">
              <circle
                cx="64" cy="64" r="56"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="12"
              />
              <motion.circle
                cx="64" cy="64" r="56"
                fill="none"
                stroke={`url(#riskGradient-${riskLevel.color})`}
                strokeWidth="12"
                strokeLinecap="round"
                initial={{ strokeDasharray: '0 352' }}
                animate={{ strokeDasharray: `${(score / 100) * 352} 352` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
              <defs>
                <linearGradient id={`riskGradient-${riskLevel.color}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={riskLevel.color === 'rose' ? '#f43f5e' : riskLevel.color === 'orange' ? '#f97316' : riskLevel.color === 'amber' ? '#f59e0b' : '#10b981'} />
                  <stop offset="100%" stopColor={riskLevel.color === 'rose' ? '#fb7185' : riskLevel.color === 'orange' ? '#fdba74' : riskLevel.color === 'amber' ? '#fcd34d' : '#34d399'} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className="text-3xl font-black text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {score}
              </motion.span>
              <span className={cn("text-[10px] font-black uppercase", `text-${riskLevel.color}-400`)}>
                {riskLevel.label}
              </span>
            </div>
          </div>
        </div>

        {/* Risk Factors */}
        <div className="space-y-3">
          {factors.map((factor, i) => (
            <motion.div
              key={factor.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">{factor.name}</span>
                <span className="text-[10px] font-bold text-white">{factor.score}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${factor.score}%` }}
                  transition={{ delay: i * 0.1 + 0.3, duration: 0.5 }}
                  className={cn(
                    "h-full rounded-full",
                    factor.score >= 75 ? "bg-rose-500" :
                    factor.score >= 50 ? "bg-amber-500" :
                    "bg-emerald-500"
                  )}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
