/**
 * PREDATOR Premium Hub - Центр Комерційної Розвідки
 *
 * Персоналізований хаб для максимальної монетизації:
 * - TITAN (Бізнесмен): Конкуренти, ринкові прогнози, інсайди
 * - INQUISITOR (Контролер): Аномалії, схеми, компромат
 * - SOVEREIGN (Аналітик): Тренди, кореляції, макро-прогнози
 *
 * © 2026 PREDATOR Analytics - Maximum Value Extraction
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import {
  Crown, Target, Shield, Users, TrendingUp, AlertTriangle,
  DollarSign, Briefcase, Scale, ShieldCheck, Globe, Activity,
  Download, PieChart, BarChart3, Fingerprint, Lock, Zap,
  FileSearch, ShieldAlert, Eye, FileText, BrainCircuit, Network,
  Layout, Search, Filter, Layers, Star, Sparkles, ExternalLink,
  Ship, Truck, Plane, Building2, Landmark, Gem, ChevronRight,
  ArrowUpRight, ArrowRight, Play, Settings, Maximize2, Database, Clock, Radio
} from 'lucide-react';
import { useAppStore, InterlinkPersona } from '../store/useAppStore';
import { cn } from '../utils/cn';
import { ViewHeader } from '../components/ViewHeader';
import { premiumLocales } from '../locales/uk/premium';
import { api } from '../services/api';
import { LiveIntelligenceAlerts } from '../components/premium/LiveIntelligenceAlerts';
import {
  TopImportersWidget,
  HSCodeAnalyticsWidget,
  PriceAnomalyWidget,
  TradeFlowWidget,
  CompetitorRadarWidget,
  RiskScoreWidget
} from '../components/premium/CustomsAnalyticsWidgets';
import { AIInsightsPanel } from '../components/premium/AIInsightsPanel';
import { ModelingDashboard } from '../components/premium/ModelingDashboard';
import { SchemesWidget } from '../components/premium/SchemesWidget';
import { TradeSankeyWidget } from '../components/premium/TradeSankeyWidget';
import { SignalsFeedWidget } from '../components/premium/SignalsFeedWidget';
import { PremiumPricing } from '../components/premium/PremiumPricing';
import { DeclarationValidatorWidget } from '../components/premium/DeclarationValidatorWidget';
import { IntelligenceTicker } from '../components/premium/IntelligenceTicker';
import { GlobalSearchOverlay } from '../components/GlobalSearchOverlay';
import { SmartCalculatorWidget } from '../components/premium/SmartCalculatorWidget';
import { LogisticsTrackerWidget } from '../components/premium/LogisticsTrackerWidget';
import { SupplierScoutWidget } from '../components/premium/SupplierScoutWidget';
import { PredatorChatWidget } from '../components/premium/PredatorChatWidget';
import { TenderIntelligenceWidget } from '../components/premium/TenderIntelligenceWidget';
import { ExecutiveBriefingWidget } from '../components/premium/ExecutiveBriefingWidget';
import { InvestigationCanvasWidget } from '../components/premium/InvestigationCanvasWidget';
import { TradeCorridorWidget } from '../components/premium/TradeCorridorWidget';
import { MacroIndicatorsWidget } from '../components/premium/MacroIndicatorsWidget';
import { Dossier360Explorer } from '../components/premium/Dossier360Explorer';
import { SanctionsIntelligenceWidget } from '../components/premium/SanctionsIntelligenceWidget';
import { NeuralAutomationWidget } from '../components/premium/NeuralAutomationWidget';
import { ReportCenterWidget } from '../components/premium/ReportCenterWidget';
import { PredictiveModelingWidget } from '../components/premium/PredictiveModelingWidget';
import { CommodityPricePredictor } from '../components/premium/CommodityPricePredictor';
import { SupplyChainRadarWidget } from '../components/premium/SupplyChainRadarWidget';
import { CompetitorWarBoardWidget } from '../components/premium/CompetitorWarBoardWidget';
import { TacticalVoiceCommWidget } from '../components/premium/TacticalVoiceCommWidget';

// Конфігурація персон для комерційного використання
const PERSONA_CONFIG = {
  TITAN: {
    name: 'TITAN',
    title: premiumLocales.hub.persona.titan.title,
    subtitle: premiumLocales.hub.persona.titan.subtitle,
    icon: Target,
    color: 'amber',
    gradient: 'from-amber-500 to-orange-600',
    bgGlow: 'rgba(245, 158, 11, 0.15)',
    features: [
      { icon: Eye, label: premiumLocales.hub.persona.titan.features.compAnalysis, desc: premiumLocales.hub.persona.titan.features.compAnalysisDesc },
      { icon: TrendingUp, label: premiumLocales.hub.persona.titan.features.marketForecast, desc: premiumLocales.hub.persona.titan.features.marketForecastDesc },
      { icon: Briefcase, label: premiumLocales.hub.persona.titan.features.supplierInsights, desc: premiumLocales.hub.persona.titan.features.supplierInsightsDesc },
      { icon: DollarSign, label: premiumLocales.hub.persona.titan.features.priceIntel, desc: premiumLocales.hub.persona.titan.features.priceIntelDesc },
    ],
    dashboards: [
      { id: 'competitor-imports', name: 'Імпорт Конкурентів', type: 'bar' },
      { id: 'price-trends', name: 'Динаміка Цін', type: 'line' },
      { id: 'supplier-map', name: 'Карта Постачальників', type: 'geo' },
      { id: 'market-share', name: 'Частка Ринку', type: 'pie' },
    ],
    insights: [
      'Конкурент X збільшив імпорт на 340% за останній місяць',
      'Виявлено нового постачальника з Туреччини з ціною -23%',
      'Прогноз: ціни на сталь зростуть на 15% до березня',
    ]
  },
  INQUISITOR: {
    name: 'INQUISITOR',
    title: premiumLocales.hub.persona.inquisitor.title,
    subtitle: premiumLocales.hub.persona.inquisitor.subtitle,
    icon: Shield,
    color: 'rose',
    gradient: 'from-rose-500 to-pink-600',
    bgGlow: 'rgba(244, 63, 94, 0.15)',
    features: [
      { icon: AlertTriangle, label: premiumLocales.hub.persona.inquisitor.features.anomalyDetection, desc: premiumLocales.hub.persona.inquisitor.features.anomalyDetectionDesc },
      { icon: ShieldAlert, label: premiumLocales.hub.persona.inquisitor.features.evasionSchemes, desc: premiumLocales.hub.persona.inquisitor.features.evasionSchemesDesc },
      { icon: Fingerprint, label: premiumLocales.hub.persona.inquisitor.features.profiling, desc: premiumLocales.hub.persona.inquisitor.features.profilingDesc },
      { icon: Scale, label: premiumLocales.hub.persona.inquisitor.features.riskScoring, desc: premiumLocales.hub.persona.inquisitor.features.riskScoringDesc },
    ],
    dashboards: [
      { id: 'anomaly-detection', name: 'Виявлені Аномалії', type: 'scatter' },
      { id: 'risk-heatmap', name: 'Теплова Карта Ризику', type: 'heatmap' },
      { id: 'evasion-patterns', name: 'Схеми Ухилення', type: 'sankey' },
      { id: 'entity-network', name: 'Мережа Зв\'язків', type: 'graph' },
    ],
    insights: [
      'Виявлено схему заниження вартості через 17 пов\'язаних компаній',
      'Аномальна активність: HS код 8471 занижено на $2.4M',
      'Суб\'єкт "ТОВ Альфа" має 89% ймовірність порушення',
    ]
  },
  SOVEREIGN: {
    name: 'SOVEREIGN',
    title: premiumLocales.hub.persona.sovereign.title,
    subtitle: premiumLocales.hub.persona.sovereign.subtitle,
    icon: Crown,
    color: 'indigo',
    gradient: 'from-indigo-500 to-purple-600',
    bgGlow: 'rgba(99, 102, 241, 0.15)',
    features: [
      { icon: Globe, label: premiumLocales.hub.persona.sovereign.features.geopolitics, desc: premiumLocales.hub.persona.sovereign.features.geopoliticsDesc },
      { icon: Landmark, label: premiumLocales.hub.persona.sovereign.features.sectorAnalysis, desc: premiumLocales.hub.persona.sovereign.features.sectorAnalysisDesc },
      { icon: BrainCircuit, label: premiumLocales.hub.persona.sovereign.features.aiForecasts, desc: premiumLocales.hub.persona.sovereign.features.aiForecastsDesc },
      { icon: Network, label: premiumLocales.hub.persona.sovereign.features.systemRisks, desc: premiumLocales.hub.persona.sovereign.features.systemRisksDesc },
    ],
    dashboards: [
      { id: 'trade-flow', name: 'Потоки Торгівлі', type: 'chord' },
      { id: 'sector-analysis', name: 'Галузева Аналітика', type: 'treemap' },
      { id: 'forecast-model', name: 'Прогнозна Модель', type: 'line' },
      { id: 'correlation-matrix', name: 'Матриця Кореляцій', type: 'heatmap' },
    ],
    insights: [
      'Кореляція 0.87 між імпортом сталі та будівельною активністю',
      'Прогноз: обсяг торгівлі з ЄС +12% у Q2 2026',
      'Системний ризик: залежність від 3 постачальників чіпів',
    ]
  }
};

// OpenSearch Dashboard Integration Component
const OpenSearchPanel: React.FC<{ persona: string }> = ({ persona }) => {
  const config = PERSONA_CONFIG[persona as keyof typeof PERSONA_CONFIG];

  return (
    <div className="bg-slate-950/80 border border-white/10 rounded-[32px] overflow-hidden backdrop-blur-xl">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn("p-3 rounded-2xl", `bg-${config.color}-500/20`)}>
            <Database className={`text-${config.color}-400`} size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">OpenSearch Analytics</h3>
            <p className="text-[9px] text-slate-500 font-mono">Інтерактивні графіки реального часу</p>
          </div>
        </div>
        <a
          href="http://localhost:5601/app/dashboards"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
            `bg-${config.color}-500/20 border border-${config.color}-500/30 text-${config.color}-400 hover:bg-${config.color}-500 hover:text-white`
          )}
        >
          <Maximize2 size={12} />
          Повний Екран
        </a>
      </div>

      <div className="grid grid-cols-2 gap-4 p-6">
        {config.dashboards.map((dash, i) => (
          <motion.button
            key={dash.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-5 bg-black/40 border border-white/5 rounded-2xl hover:border-white/20 transition-all group text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <span className={cn("text-[8px] font-black uppercase tracking-widest", `text-${config.color}-500`)}>
                {dash.type.toUpperCase()}
              </span>
              <ExternalLink size={12} className="text-slate-600 group-hover:text-white" />
            </div>
            <div className="text-xs font-black text-white">{dash.name}</div>
          </motion.button>
        ))}
      </div>

      {/* Mini Preview Chart */}
      <div className="h-[200px] p-4 border-t border-white/5">
        <ResponsiveChart persona={persona} />
      </div>
    </div>
  );
};

// Responsive Chart Component
const ResponsiveChart: React.FC<{ persona: string }> = ({ persona }) => {
  const config = PERSONA_CONFIG[persona as keyof typeof PERSONA_CONFIG];
  const colors = {
    TITAN: '#f59e0b',
    INQUISITOR: '#f43f5e',
    SOVEREIGN: '#6366f1'
  };

  const [data, setData] = useState<{ name: string; value: number; risk: number }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/v1/stats/category');
        if (response.ok) {
          const result = await response.json();
          // Transform API data to chart format
          const chartData = (result.categories || result.data || [])
            .slice(0, 12)
            .map((item: any, idx: number) => ({
              name: item.name || item.label || `${idx + 1} Груд`,
              value: item.count || item.value || 0,
              risk: item.risk || item.risk_score || 0
            }));

          if (chartData.length > 0) {
            setData(chartData);
          } else {
            // Fallback to static placeholder data
            setData(Array.from({ length: 12 }, (_, i) => ({
              name: `${i + 1} Груд`,
              value: 0,
              risk: 0
            })));
          }
        }
      } catch (err) {
        console.warn('Failed to fetch category stats:', err);
        // Keep empty data instead of random
      }
    };

    fetchData();
  }, [persona]);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(2, 6, 23, 0.95)',
      borderColor: colors[persona as keyof typeof colors],
      textStyle: { color: '#e2e8f0', fontSize: 10 }
    },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: data.map(d => d.name),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: '#64748b', fontSize: 9 }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.03)' } },
      axisLabel: { color: '#64748b', fontSize: 9 }
    },
    series: [{
      data: data.map(d => d.value),
      type: 'line',
      smooth: true,
      showSymbol: false,
      lineStyle: { color: colors[persona as keyof typeof colors], width: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: `${colors[persona as keyof typeof colors]}40` },
          { offset: 1, color: `${colors[persona as keyof typeof colors]}00` }
        ])
      }
    }]
  };

  return <ReactECharts option={option} className="w-full h-full" theme="dark" />;
};

// Premium Feature Card
const FeatureCard: React.FC<{
  feature: { icon: any; label: string; desc: string };
  color: string;
  delay: number;
}> = ({ feature, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    className={cn(
      "p-5 bg-black/40 border border-white/5 rounded-2xl hover:border-white/20 transition-all group cursor-pointer",
      `hover:bg-${color}-500/5`
    )}
  >
    <div className="flex items-start gap-4">
      <div className={cn("p-2.5 rounded-xl", `bg-${color}-500/20`)}>
        <feature.icon className={`text-${color}-400`} size={18} />
      </div>
      <div>
        <div className="text-xs font-black text-white uppercase tracking-wider mb-1">{feature.label}</div>
        <div className="text-[10px] text-slate-500">{feature.desc}</div>
      </div>
    </div>
  </motion.div>
);

// Insight Alert Component
const InsightAlert: React.FC<{ insight: string; color: string; index: number }> = ({ insight, color, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.2 }}
    className="flex items-start gap-3 p-4 bg-black/40 border border-white/5 rounded-xl"
  >
    <div className={cn("w-1.5 h-1.5 rounded-full mt-2 animate-pulse", `bg-${color}-500`)} />
    <p className="text-[11px] text-slate-300 leading-relaxed">{insight}</p>
  </motion.div>
);

// Main Component
const PremiumHubView: React.FC = () => {
  const { userRole, persona, setPersona } = useAppStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'modeling' | 'builder' | 'logistics' | 'sourcing' | 'reports' | 'tactical'>('overview');
  const [customsData, setCustomsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<string>('ТОВ Мега-Імпорт');

  // Global Search Hotkey
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentConfig = PERSONA_CONFIG[persona as keyof typeof PERSONA_CONFIG] || PERSONA_CONFIG.TITAN;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.customs.getRegistry('');
        setCustomsData(res.data || []);
      } catch (e) {
        console.error('Failed to fetch customs data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Paywall for non-premium users
  if (userRole === 'client') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-cyber-grid opacity-10" />
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-amber-500/20 to-rose-500/20 blur-[150px] rounded-full" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center space-y-8 max-w-3xl bg-black/80 p-16 rounded-[64px] border border-white/10 backdrop-blur-3xl shadow-2xl"
        >
          <div className="flex justify-center">
            <div className="w-28 h-28 bg-gradient-to-br from-amber-500/30 to-rose-500/30 rounded-full flex items-center justify-center border border-white/10 shadow-[0_0_60px_rgba(245,158,11,0.2)]">
              <Crown className="w-14 h-14 text-amber-400 animate-pulse" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
              {premiumLocales.hub.paywall.title}
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto">
              {premiumLocales.hub.paywall.description}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-4">
            {Object.entries(PERSONA_CONFIG).map(([key, config]) => (
              <div key={key} className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                <config.icon className={`w-8 h-8 text-${config.color}-400 mx-auto mb-3`} />
                <div className="text-xs font-black text-white uppercase mb-1">{config.title}</div>
                <div className="text-[9px] text-slate-500">{config.subtitle}</div>
              </div>
            ))}
          </div>

          <div className="pt-4 space-y-4">
            <button className="w-full py-5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black rounded-3xl uppercase tracking-[0.2em] shadow-xl hover:shadow-amber-500/30 hover:scale-[1.02] transition-all">
              <Sparkles className="inline-block mr-3" size={18} />
              {premiumLocales.hub.paywall.cta}
            </button>
            <p className="text-[9px] text-slate-600 uppercase tracking-widest">
              {premiumLocales.hub.paywall.trail}
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-6 gap-6 relative z-10 pb-24 w-full max-w-[1800px] mx-auto">
      {/* Dynamic Background Glow */}
      <div
        className={cn(
          "fixed inset-0 pointer-events-none transition-all duration-1000",
          persona === 'TITAN' ? "bg-[radial-gradient(ellipse_at_80%_20%,_rgba(245,158,11,0.15),_transparent_60%)]" :
            persona === 'INQUISITOR' ? "bg-[radial-gradient(ellipse_at_80%_20%,_rgba(244,63,94,0.15),_transparent_60%)]" :
              "bg-[radial-gradient(ellipse_at_80%_20%,_rgba(99,102,241,0.15),_transparent_60%)]"
        )}
      />

      <IntelligenceTicker />
      <GlobalSearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <Dossier360Explorer
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        entityName={selectedEntity}
        riskScore={selectedEntity.includes('Мега-Імпорт') ? 85 : 42}
      />
      <PredatorChatWidget />

      <ViewHeader
        title={premiumLocales.hub.title}
        icon={<Crown size={20} className={`text-${currentConfig.color}-400`} />}
        breadcrumbs={[premiumLocales.hub.breadcrumbs.predator, premiumLocales.hub.breadcrumbs.premium, currentConfig.name]}
        stats={[
          { label: premiumLocales.hub.stats.declarations, value: '142,504', icon: <FileText size={14} />, color: 'primary' },
          { label: premiumLocales.hub.stats.insights, value: '1,247', icon: <Sparkles size={14} />, color: 'success' },
          { label: premiumLocales.hub.stats.activeAlerts, value: '23', icon: <AlertTriangle size={14} />, color: 'warning' },
        ]}
      />

      {/* Persona Selector & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-black/40 border border-white/5 rounded-2xl backdrop-blur-3xl">
          {[
            { id: 'overview', label: premiumLocales.hub.tabs.overview, icon: Layout },
            { id: 'tactical', label: premiumLocales.hub.tabs.tactical, icon: Radio },
            { id: 'analytics', label: premiumLocales.hub.tabs.analytics, icon: BarChart3 },
            { id: 'sourcing', label: premiumLocales.hub.tabs.sourcing, icon: Globe },
            { id: 'modeling', label: premiumLocales.hub.tabs.modeling, icon: Activity },
            { id: 'logistics', label: premiumLocales.hub.tabs.logistics, icon: Truck },
            { id: 'reports', label: premiumLocales.hub.tabs.reports, icon: FileText },
            { id: 'builder', label: premiumLocales.hub.tabs.builder, icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all",
                activeTab === tab.id
                  ? `bg-${currentConfig.color}-500/10 text-${currentConfig.color}-400 border border-${currentConfig.color}-500/20`
                  : "text-slate-500 hover:text-white hover:bg-white/5"
              )}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
          {/* Search Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
            title={premiumLocales.hub.search.placeholder}
          >
            <Search size={14} />
          </button>
        </div>

        {/* Persona Switcher */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-900/60 border border-white/5 rounded-2xl backdrop-blur-3xl">
          {Object.entries(PERSONA_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setPersona(key as InterlinkPersona)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[9px] font-black tracking-wider uppercase transition-all flex items-center gap-2",
                persona === key
                  ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg`
                  : "text-slate-500 hover:text-white hover:bg-white/5"
              )}
            >
              <config.icon size={14} />
              {config.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left Column - Features & Insights */}
            <div className="lg:col-span-5 space-y-6">
              {/* Persona Header */}
              <div className={cn(
                "p-8 rounded-[32px] border border-white/10 backdrop-blur-xl relative overflow-hidden",
                `bg-gradient-to-br from-${currentConfig.color}-500/10 to-slate-950/80`
              )}>
                <div className="absolute top-0 right-0 w-40 h-40 opacity-10">
                  <currentConfig.icon size={160} />
                </div>

                <div className="relative z-10">
                  <div className={cn("text-[10px] font-black uppercase tracking-[0.3em] mb-2", `text-${currentConfig.color}-400`)}>
                    {currentConfig.name} {premiumLocales.hub.persona.mode}
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tight mb-2">
                    {currentConfig.title}
                  </h2>
                  <p className="text-sm text-slate-400">{currentConfig.subtitle}</p>
                </div>
              </div>

              {/* Features Grid */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">
                  {premiumLocales.hub.insights.capabilities}
                </h3>
                {currentConfig.features.map((feature, i) => (
                  <FeatureCard key={i} feature={feature} color={currentConfig.color} delay={i * 0.1} />
                ))}
              </div>

              {/* Real-time Insights */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2">
                  <Zap size={12} className={`text-${currentConfig.color}-400`} />
                  {premiumLocales.hub.insights.title}
                </h3>
                {currentConfig.insights.map((insight, i) => (
                  <InsightAlert key={i} insight={insight} color={currentConfig.color} index={i} />
                ))}
              </div>
            </div>

            {/* Right Column - Analytics Widgets */}
            <div className="lg:col-span-7 space-y-6">
              {/* Live Intelligence Alerts */}
              <LiveIntelligenceAlerts persona={persona as string} maxAlerts={5} />

              {/* Persona-specific widgets */}
              {persona === 'TITAN' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="h-[400px]">
                      <ExecutiveBriefingWidget
                        persona={persona as string}
                        onOpenDossier={(name) => {
                          setSelectedEntity(name);
                          setIsDossierOpen(true);
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SmartCalculatorWidget persona={persona as string} />
                      <CompetitorRadarWidget persona={persona as string} />
                    </div>
                  </div>
                  <div className="h-full min-h-[400px]">
                    <SignalsFeedWidget persona={persona as string} />
                  </div>
                </div>
              )}
              {persona === 'INQUISITOR' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <InvestigationCanvasWidget
                      persona={persona as string}
                      onOpenDossier={(name) => {
                        setSelectedEntity(name);
                        setIsDossierOpen(true);
                      }}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SanctionsIntelligenceWidget persona={persona as string} />
                      <div className="space-y-4">
                        <RiskScoreWidget entityName="ТОВ Альфа-Трейд" persona={persona as string} />
                        <SchemesWidget persona={persona as string} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <SignalsFeedWidget persona={persona as string} />
                  </div>
                </div>
              )}

              {persona === 'SOVEREIGN' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="h-[400px]">
                      <ExecutiveBriefingWidget
                        persona="TITAN"
                        onOpenDossier={(name) => {
                          setSelectedEntity(name);
                          setIsDossierOpen(true);
                        }}
                      />
                    </div>
                    <NeuralAutomationWidget persona={persona as string} />
                  </div>
                  <div className="space-y-6">
                    <MacroIndicatorsWidget persona={persona as string} />
                    <HSCodeAnalyticsWidget persona={persona as string} />
                    <TradeSankeyWidget persona={persona as string} />
                  </div>
                </div>
              )}

              {/* OpenSearch Panel */}
              <OpenSearchPanel persona={persona as string} />
            </div>
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* AI Insights Section */}
            <AIInsightsPanel persona={persona as string} />

            {/* OpenSearch Section */}
            <div className="p-8 bg-slate-950/80 border border-white/10 rounded-[32px] backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-white uppercase tracking-wider">
                  OpenSearch Dashboards — {currentConfig.title}
                </h3>
                <a
                  href="http://localhost:5601/app/dashboards"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                    `bg-${currentConfig.color}-500 text-white hover:scale-105`
                  )}
                >
                  <ExternalLink size={14} />
                  Відкрити Повний Інтерфейс
                </a>
              </div>

              <div className="h-[500px] bg-black/40 rounded-2xl border border-white/5 overflow-hidden">
                <iframe
                  src="http://localhost:5601/app/dashboards?embed=true"
                  className="w-full h-full border-none"
                  title="OpenSearch Dashboards"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                />
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'sourcing' && (
          <motion.div
            key="sourcing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <SupplierScoutWidget persona="TITAN" />
            <div className="space-y-6">
              <TenderIntelligenceWidget persona="TITAN" />
              <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl backdrop-blur-xl">
                <h3 className="text-sm font-black text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Zap size={16} /> Прогноз Дефіциту
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  AI прогнозує дефіцит на ринку <b>Літієвих батарей (8507)</b> через 3 тижні.
                  Рекомендовано збільшити закупівлі з Туреччини.
                </p>
                <button className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl text-xs uppercase hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20">
                  Створити замовлення
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'tactical' && (
          <motion.div
            key="tactical"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6 h-full pb-12"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="h-[600px]">
                  <SupplyChainRadarWidget persona={persona as string} />
                </div>
                <div className="h-[500px]">
                  <CompetitorWarBoardWidget persona={persona as string} />
                </div>
              </div>
              <div className="space-y-6">
                <TacticalVoiceCommWidget persona={persona as string} />
                <NeuralAutomationWidget persona={persona as string} />
                <div className="p-8 bg-slate-950/80 border border-emerald-500/20 rounded-[40px] backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                    <Zap size={64} className="text-emerald-500" />
                  </div>
                  <h4 className="text-sm font-black text-emerald-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <Activity size={16} className="animate-pulse" /> Live Tactical Actions
                  </h4>
                  <div className="space-y-4">
                    <button className="w-full py-5 bg-emerald-500 text-black font-black rounded-3xl text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-3">
                      Deploy Counter-Risk Saga <ArrowRight size={16} />
                    </button>
                    <button className="w-full py-5 bg-white/5 border border-white/10 text-white font-black rounded-3xl text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                      Intercept Competitor Logistics
                    </button>
                    <button className="w-full py-5 bg-black text-slate-400 border border-slate-800 rounded-3xl text-xs uppercase tracking-widest hover:border-slate-600 transition-all text-center">
                      Download Tactical HUD Config
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'modeling' && (
          <motion.div
            key="modeling"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-280px)]"
          >
            <PredictiveModelingWidget persona={persona as string} />
            <CommodityPricePredictor persona={persona as string} />
          </motion.div>
        )}

        {activeTab === 'logistics' && (
          <motion.div
            key="logistics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <LogisticsTrackerWidget persona="TITAN" />
            <div className="space-y-4">
              <TradeFlowWidget persona="TITAN" />
              <TradeCorridorWidget persona="TITAN" />
            </div>
          </motion.div>
        )}

        {activeTab === 'reports' && (
          <motion.div
            key="reports"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="h-[calc(100vh-280px)]"
          >
            <ReportCenterWidget persona={persona as string} />
          </motion.div>
        )}

        {activeTab === 'builder' && (
          <motion.div
            key="builder"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="p-8 bg-slate-950/80 border border-white/10 rounded-[32px] backdrop-blur-xl text-center">
              <div className={cn("w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center", `bg-${currentConfig.color}-500/20`)}>
                <Settings size={40} className={`text-${currentConfig.color}-400`} />
              </div>
              <h3 className="text-2xl font-black text-white mb-3">Конструктор Дашбордів</h3>
              <p className="text-slate-400 text-sm mb-6 max-w-lg mx-auto">
                Створюйте власні аналітичні панелі з графіками, картами та віджетами.
                Інтегруйте дані з OpenSearch та налаштуйте під ваші потреби.
              </p>
              <a
                href="/dashboard-builder"
                className={cn(
                  "inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-wider transition-all",
                  `bg-gradient-to-r ${currentConfig.gradient} text-white hover:scale-105 shadow-xl`
                )}
              >
                <Play size={18} />
                Відкрити Конструктор
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PremiumHubView;
