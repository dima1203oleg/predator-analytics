/**
 * PREDATOR v56.1.4 | Premium Intelligence Sanctum — Хаб Комерційної Розвідки
 * 
 * Персоналізований хаб для VIP-аналітики та стратегічного домінування:
 * - TITAN (Market Dominance): Конкуренти, ринкові прогнози, інсайди
 * - INQUISITOR (Risk Sovereignty): Аномалії, схеми, компромат
 * - SOVEREIGN (Macro Architect): Тренди, кореляції, макро-прогнози
 * 
 * © 2026 PREDATOR Analytics | Maximum Value Extraction
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactECharts from '@/components/ECharts';
import * as echarts from 'echarts';
import {
  Crown, Target, Shield, Users, TrendingUp, AlertTriangle,
  DollarSign, Briefcase, Scale, ShieldCheck, Globe, Activity,
  Download, PieChart, BarChart3, Fingerprint, Lock, Zap,
  FileSearch, ShieldAlert, Eye, FileText, BrainCircuit, Network,
  Layout, Search, Filter, Layers, Star, Sparkles, ExternalLink,
  Ship, Truck, Plane, Building2, Landmark, Gem, ChevronRight,
  ArrowUpRight, ArrowRight, Play, Settings, Maximize2, Database, Clock, Radio,
  Cpu, Atom, Dna, Share2, MousePointer2, Terminal
} from 'lucide-react';
import { useAppStore, InterlinkPersona } from '@/store/useAppStore';
import { UserRole } from '@/config/roles';
import { cn } from '@/utils/cn';
import { ViewHeader } from '@/components/ViewHeader';
import { premiumLocales } from '@/locales/uk/premium';
import { api } from '@/services/api';
import { LiveIntelligenceAlerts } from '@/components/premium/LiveIntelligenceAlerts';
import {
  TopImportersWidget,
  HSCodeAnalyticsWidget,
  PriceAnomalyWidget,
  TradeFlowWidget,
  CompetitorRadarWidget,
  RiskScoreWidget
} from '@/components/premium/CustomsAnalyticsWidgets';
import { AIInsightsPanel } from '@/components/premium/AIInsightsPanel';
import { ModelingDashboard } from '@/components/premium/ModelingDashboard';
import { SchemesWidget } from '@/components/premium/SchemesWidget';
import { TradeSankeyWidget } from '@/components/premium/TradeSankeyWidget';
import { SignalsFeedWidget } from '@/components/premium/SignalsFeedWidget';
import { PremiumPricing } from '@/components/premium/PremiumPricing';
import { DeclarationValidatorWidget } from '@/components/premium/DeclarationValidatorWidget';
import { IntelligenceTicker } from '@/components/premium/IntelligenceTicker';
import { GlobalSearchOverlay } from '@/components/GlobalSearchOverlay';
import { SmartCalculatorWidget } from '@/components/premium/SmartCalculatorWidget';
import { LogisticsTrackerWidget } from '@/components/premium/LogisticsTrackerWidget';
import { SupplierScoutWidget } from '@/components/premium/SupplierScoutWidget';
import { PredatorChatWidget } from '@/components/premium/PredatorChatWidget';
import { TenderIntelligenceWidget } from '@/components/premium/TenderIntelligenceWidget';
import { ExecutiveBriefingWidget } from '@/components/premium/ExecutiveBriefingWidget';
import { InvestigationCanvasWidget } from '@/components/premium/InvestigationCanvasWidget';
import { TradeCorridorWidget } from '@/components/premium/TradeCorridorWidget';
import { MacroIndicatorsWidget } from '@/components/premium/MacroIndicatorsWidget';
import { Dossier360Explorer } from '@/components/premium/Dossier360Explorer';
import { SanctionsIntelligenceWidget } from '@/components/premium/SanctionsIntelligenceWidget';
import { NeuralAutomationWidget } from '@/components/premium/NeuralAutomationWidget';
import { ReportCenterWidget } from '@/components/premium/ReportCenterWidget';
import { PredictiveModelingWidget } from '@/components/premium/PredictiveModelingWidget';
import { CommodityPricePredictor } from '@/components/premium/CommodityPricePredictor';
import { SupplyChainRadarWidget } from '@/components/premium/SupplyChainRadarWidget';
import { CompetitorWarBoardWidget } from '@/components/premium/CompetitorWarBoardWidget';
import { TacticalVoiceCommWidget } from '@/components/premium/TacticalVoiceCommWidget';
import { PageTransition } from '@/components/layout/PageTransition';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { Badge } from '@/components/ui/badge';

// ========================
// Types & Config
// ========================

const PERSONA_CONFIG = {
  TITAN: {
    name: 'TITAN',
    title: 'РИНКОВИЙ ТИТАН',
    subtitle: 'Агресивне домінування та конкурентна розвідка',
    icon: Target,
    color: 'amber',
    gradient: 'from-amber-400 via-orange-500 to-amber-600',
    glow: 'rgba(245, 158, 11, 0.4)',
    features: [
      { icon: Eye, label: 'АНАЛІЗ КОНКУРЕНТІВ', desc: 'Глибоке сканування кожної декларації опонентів у реальному часі' },
      { icon: TrendingUp, label: 'РИНКОВІ ПРОГНОЗИ', desc: 'Прогнозування цінових хвиль та дефіциту товарних груп' },
      { icon: Briefcase, label: 'ІНСАЙДИ ПОСТАЧАЛЬНИКІВ', desc: 'Виявлення прямих заводів та прихованих ланцюгів' },
      { icon: DollarSign, label: 'ЦІНОВА ОПТИМІЗАЦІЯ', desc: 'Benchmark кожної транзакції проти ринкового медіанного значення' },
    ],
    insights: [
      'Конкурент "МЕГА-ЛОГІСТИК" збільшив закупки титану на 400%',
      'Виявлено новий прямий канал постачання з В\'єтнаму (-15% ціни)',
      'Ймовірність дефіциту HS-8471 у наступному кварталі: 82%',
    ]
  },
  INQUISITOR: {
    name: 'INQUISITOR',
    title: 'ВЕЛИКИЙ ІНКВІЗИТОР',
    subtitle: 'Контроль ризиків та виявлення прихованих схем',
    icon: Shield,
    color: 'rose',
    gradient: 'from-rose-500 via-pink-600 to-rose-700',
    glow: 'rgba(244, 63, 94, 0.4)',
    features: [
      { icon: AlertTriangle, label: 'ДЕТЕКЦІЯ АНОМАЛІЙ', desc: 'AI-сканування на предмет заниження вартості та пересортиці' },
      { icon: ShieldAlert, label: 'МЕРЕЖІ УХИЛЕННЯ', desc: 'Автоматичне картування пов\'язаних фірм-прокладок та офшорів' },
      { icon: Fingerprint, label: 'ПРОФІЛЮВАННЯ СУБ\'ЄКТІВ', desc: 'Повний 360° досьє на будь-якого директора чи засновника' },
      { icon: Scale, label: 'РИЗИК-СКОРИНГ СERS', desc: 'Нейронний рейтинг кожної декларації перед подачею в митницю' },
    ],
    insights: [
      'Виявлено кластер із 12 компаній, що використовують спільний IP',
      'Аномалія ціни на HS-7304: відхилення від ринку на 68%',
      'Суб\'єкт "ВЕКТОР-ПЛЮС" потрапив у сіру зону санкційного списку',
    ]
  },
  SOVEREIGN: {
    name: 'SOVEREIGN',
    title: 'МАКРО-СУВЕРЕН',
    subtitle: 'Архітектор торгових стратегій та геополітики',
    icon: Crown,
    color: 'indigo',
    gradient: 'from-indigo-400 via-purple-500 to-indigo-600',
    glow: 'rgba(99, 102, 241, 0.4)',
    features: [
      { icon: Globe, label: 'ГЕОПОЛІТИЧНИЙ МОНІТОР', desc: 'Вплив санкцій та ембарго на глобальні торгові потоки' },
      { icon: Landmark, label: 'СЕКТОРНИЙ АРХІТЕКТОР', desc: 'Картування цілих галузей економіки через митні дані' },
      { icon: BrainCircuit, label: 'NEXUS-ПРОГНОЗУВАННЯ', desc: 'Мультимодальні моделі майбутнього стану ринку України' },
      { icon: Network, label: 'СИСТЕМНІ КОРЕЛЯЦІЇ', desc: 'Приховані зв\'язки між курсом валют та обсягами критичного імпорту' },
    ],
    insights: [
      'Кореляція 0.94 між ціною на енергоносії та імпортом добрив',
      'Прогноз росту товарообігу з ОАЕ на 45% у річному обчисленні',
      'Системний ризик: критична залежність ВПК від 2 хабів у КНР',
    ]
  }
};

// ========================
// Sub-Components
// ========================

/**
 * Stunning Access Gate for non-premium
 */
const HolographicAccessGate: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#02040a] flex items-center justify-center p-8 relative overflow-hidden">
      <AdvancedBackground />
      <CyberGrid color="rgba(245, 158, 11, 0.05)" />
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-amber-500/5 blur-[200px] rounded-full animate-pulse" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 max-w-5xl w-full"
      >
        <div className="bg-[#0b0f1a]/80 backdrop-blur-3xl border border-amber-500/20 rounded-[80px] p-16 sm:p-24 shadow-[0_0_150px_rgba(245,158,11,0.1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5">
            <Crown size={300} className="text-amber-500" />
          </div>

          <div className="flex flex-col items-center text-center space-y-12">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="relative p-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-500"
            >
              <div className="w-40 h-40 bg-[#02040a] rounded-full flex items-center justify-center border border-amber-400/20">
                <Crown className="w-20 h-20 text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.8)]" />
              </div>
            </motion.div>

            <div className="space-y-6">
              <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-6deg]">
                ДОСТУП <span className="text-amber-500">ОБМЕЖЕНО</span>
              </h1>
              <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto italic">
                Вхід у Комерційний Хаб потребує авторизації рівня "СУВЕРЕН". 
                Виявлено обмежений доступ. Активуйте статус PREMIUM для розблокування протоколів.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
              {Object.entries(PERSONA_CONFIG).map(([key, config]) => (
                <div key={key} className="p-8 bg-white/5 border border-white/5 rounded-[40px] group hover:border-amber-500/30 transition-all hover:-translate-y-2">
                  <config.icon className={cn("w-12 h-12 mx-auto mb-6", `text-${config.color}-500 group-hover:scale-125 transition-transform`)} />
                  <h3 className="text-xs font-black text-white uppercase tracking-widest mb-2">{config.title}</h3>
                  <p className="text-[10px] text-slate-500 font-medium px-4">{config.subtitle}</p>
                </div>
              ))}
            </div>

            <button className="px-20 py-8 bg-amber-600 hover:bg-amber-500 text-white text-lg font-black tracking-[0.3em] uppercase rounded-[40px] shadow-2xl shadow-amber-500/40 border border-amber-400/30 transition-all hover:scale-105 active:scale-95 group">
              <span className="flex items-center gap-4">
                АКТИВУВАТИ ПОВНИЙ ДОСТУП <ArrowRight className="group-hover:translate-x-2 transition-transform" />
              </span>
            </button>
            <p className="text-[10px] font-mono text-slate-700 uppercase tracking-[0.4em]">ENCRYPTED_AUTH_v56.1.4 | PREDATOR_NET</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ========================
// Main View
// ========================

const PremiumHubView: React.FC = () => {
  const { userRole, persona, setPersona } = useAppStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'tactical' | 'analytics' | 'modeling' | 'builder' | 'reports'>('overview');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<string>('ТОВ "УКР-ПОСТАЧ"');

  const currentConfig = useMemo(() => PERSONA_CONFIG[persona as keyof typeof PERSONA_CONFIG] || PERSONA_CONFIG.TITAN, [persona]);

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

  if (userRole === UserRole.CLIENT_BASIC) {
    return <HolographicAccessGate />;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#02040a] text-slate-200 relative overflow-hidden font-sans pb-40">
        <AdvancedBackground />
        <CyberGrid color={currentConfig.glow} />
        
        {/* Dynamic Background Glow */}
        <AnimatePresence mode="wait">
          <motion.div
            key={persona}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "fixed inset-0 pointer-events-none transition-all duration-1000",
              `bg-[radial-gradient(ellipse_at_80%_20%,_${currentConfig.glow},_transparent_70%)]`
            )}
          />
        </AnimatePresence>

        <IntelligenceTicker />
        <GlobalSearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        <Dossier360Explorer
          isOpen={isDossierOpen}
          onClose={() => setIsDossierOpen(false)}
          entityName={selectedEntity}
          riskScore={78}
        />
        <PredatorChatWidget />

        <div className="relative z-10 max-w-[1900px] mx-auto p-4 sm:p-8 lg:p-12 space-y-12">
            
            {/* View Header v56.1.4 */}
            <ViewHeader
                title={
                    <div className="flex items-center gap-8">
                        <div className="relative group">
                            <div className={cn("absolute inset-0 blur-[50px] rounded-full scale-150 animate-pulse", `bg-${currentConfig.color}-500/20`)} />
                            <div className="relative w-16 h-16 bg-slate-900 border border-white/10 rounded-2xl flex items-center justify-center panel-3d shadow-2xl">
                                <currentConfig.icon size={32} className={cn(`text-${currentConfig.color}-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]`)} />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-widest uppercase leading-none italic skew-x-[-4deg]">
                                ПРЕМІУМ <span className={cn(`text-${currentConfig.color}-500`)}>{persona}</span> ХАБ
                            </h1>
                            <p className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-[0.6em] mt-3 flex items-center gap-3">
                                <Gem size={12} className="text-amber-500 hover:scale-125 transition-transform" /> 
                                КОМЕРЦІЙНА_РОЗВІДКА_РІВЕНЬ_5
                            </p>
                        </div>
                    </div>
                }
                icon={<Crown size={22} className="text-amber-400" />}
                breadcrumbs={['PREDATOR', 'PREMIUM', persona]}
                stats={[
                    { label: 'ДАНІ_В_ОБРОБЦІ', value: '1.2M', color: 'primary', icon: <Database size={14} />, animate: true },
                    { label: 'ІНСАЙДИ_СЬОГОДНІ', value: '42', color: 'success', icon: <Sparkles size={14} /> },
                    { label: 'АКТИВНІ_АНОМАЛІЇ', value: '12', color: 'warning', icon: <AlertTriangle size={14} /> }
                ]}
            />

            {/* Persona Switcher & Tactical Nav (v56.1.4) */}
            <div className="flex flex-wrap items-center justify-between gap-8 bg-[#0b0f1a]/60 backdrop-blur-3xl p-4 rounded-[40px] border border-white/5">
                <div className="flex items-center gap-3 p-1.5 bg-black/40 rounded-[28px]">
                    {Object.entries(PERSONA_CONFIG).map(([key, config]) => (
                        <button
                            key={key}
                            onClick={() => setPersona(key as InterlinkPersona)}
                            className={cn(
                                "px-10 py-4 rounded-[24px] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 relative overflow-hidden",
                                persona === key 
                                    ? `bg-gradient-to-r ${config.gradient} text-white shadow-xl shadow-amber-900/20`
                                    : "text-slate-500 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <config.icon size={18} />
                            <span>{key}</span>
                            {persona === key && (
                                <motion.div 
                                    layoutId="active-pill" 
                                    className="absolute inset-x-0 bottom-0 h-1 bg-white/40" 
                                />
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 p-1.5 bg-black/40 rounded-[28px] overflow-x-auto no-scrollbar max-w-[800px]">
                    {[
                        { id: 'overview', label: 'ОГЛЯД', icon: Layout },
                        { id: 'tactical', label: 'ТАКТИКА', icon: Radio },
                        { id: 'analytics', label: 'АНАЛІТИКА', icon: BarChart3 },
                        { id: 'modeling', label: 'МОДЕЛЮВАННЯ', icon: Activity },
                        { id: 'reports', label: 'ЗВІТИ', icon: FileText },
                        { id: 'builder', label: 'КОНСТРУКТОР', icon: Settings },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "px-8 py-3.5 rounded-[22px] text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all",
                                activeTab === tab.id
                                    ? `bg-${currentConfig.color}-500/10 text-${currentConfig.color}-400 border border-${currentConfig.color}-500/30`
                                    : "text-slate-500 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                    <button 
                        onClick={() => setIsSearchOpen(true)}
                        className="p-3.5 rounded-[22px] bg-white/5 text-slate-500 hover:text-white transition-all border border-transparent hover:border-white/10"
                    >
                        <Search size={16} />
                    </button>
                </div>
            </div>

            {/* Deep Workspace Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab + persona}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    className="space-y-12"
                >
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Left Pane - Strategic Intelligence */}
                            <div className="lg:col-span-5 space-y-8">
                                <div className={cn(
                                    "p-10 rounded-[48px] border border-white/5 relative overflow-hidden panel-3d",
                                    `bg-gradient-to-br from-${currentConfig.color}-500/10 via-slate-900/40 to-black`
                                )}>
                                    <div className="absolute -top-10 -right-10 opacity-5">
                                        <currentConfig.icon size={280} />
                                    </div>
                                    <div className="relative z-10 space-y-6">
                                        <div className={cn("text-xs font-mono font-black uppercase tracking-[0.4em]", `text-${currentConfig.color}-500`)}>
                                            {currentConfig.title}
                                        </div>
                                        <h2 className="text-4xl font-black text-white tracking-tight uppercase leading-tight italic">
                                            {currentConfig.subtitle}
                                        </h2>
                                        <div className="flex items-center gap-6">
                                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 py-1.5 px-4 font-black shadow-[0_0_15px_rgba(16,185,129,0.3)]">АКТИВНІ_ПРОТОКОЛИ</Badge>
                                            <span className="text-xs text-slate-500 font-mono">v56.1.4.9-stable</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Feature Synergy Matrix */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {currentConfig.features.map((feature, i) => (
                                        <motion.div
                                            key={i}
                                            whileHover={{ scale: 1.02 }}
                                            className="p-6 bg-slate-900/40 border border-white/5 rounded-[32px] group hover:border-white/20 transition-all cursor-pointer"
                                        >
                                            <div className={cn("p-4 rounded-2xl mb-4 w-fit", `bg-${currentConfig.color}-500/10`)}>
                                                <feature.icon className={cn(`text-${currentConfig.color}-400 group-hover:scale-110 transition-transform`)} size={24} />
                                            </div>
                                            <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-2">{feature.label}</h4>
                                            <p className="text-[10px] text-slate-500 italic leading-relaxed">{feature.desc}</p>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Neural Insights Feed */}
                                <div className="p-8 bg-black/40 border border-white/5 rounded-[40px] space-y-6">
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-4">
                                        <div className={cn("w-2 h-2 rounded-full", `bg-${currentConfig.color}-500 animate-pulse`)} />
                                        НЕЙРОННІ ІНСАЙДИ (24h)
                                    </h3>
                                    <div className="space-y-4">
                                        {currentConfig.insights.map((insight, i) => (
                                            <div key={i} className="flex gap-4 p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                                                <div className="shrink-0 p-2 bg-indigo-500/20 rounded-lg text-indigo-400 h-fit"><Sparkles size={14} /></div>
                                                <p className="text-xs text-slate-300 font-medium italic">"{insight}"</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Pane - Visual Analytics Dashboard */}
                            <div className="lg:col-span-7 space-y-8">
                                <LiveIntelligenceAlerts persona={persona as string} maxAlerts={6} />
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="h-[450px]">
                                        <ExecutiveBriefingWidget 
                                            persona={persona as string}
                                            onOpenDossier={(name) => {
                                                setSelectedEntity(name);
                                                setIsDossierOpen(true);
                                            }}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-6">
                                        <SmartCalculatorWidget persona={persona as string} />
                                        <HSCodeAnalyticsWidget persona={persona as string} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <CompetitorRadarWidget persona={persona as string} />
                                    <RiskScoreWidget entityName={selectedEntity} persona={persona as string} />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'tactical' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-8 space-y-8">
                                <div className="h-[600px]">
                                    <SupplyChainRadarWidget persona={persona as string} />
                                </div>
                                <div className="h-[500px]">
                                    <CompetitorWarBoardWidget persona={persona as string} />
                                </div>
                            </div>
                            <div className="lg:col-span-4 space-y-8">
                                <TacticalVoiceCommWidget persona={persona as string} />
                                <NeuralAutomationWidget persona={persona as string} />
                                <SignalsFeedWidget persona={persona as string} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'analytics' && (
                        <div className="space-y-12">
                            <AIInsightsPanel persona={persona as string} />
                            <div className="p-10 bg-slate-950/80 border border-white/10 rounded-[48px] backdrop-blur-3xl">
                                <TradeSankeyWidget persona={persona as string} />
                            </div>
                        </div>
                    )}

                    {/* Placeholder for other tabs - each should be deeply informative */}
                    {['modeling', 'reports', 'builder'].includes(activeTab) && (
                        <div className="flex flex-col items-center justify-center py-40 gap-12 bg-slate-900/20 border border-dashed border-white/5 rounded-[60px]">
                            <div className="relative">
                                <div className={cn("absolute inset-0 blur-[100px] rounded-full", `bg-${currentConfig.color}-500/20`)} />
                                <Cpu size={80} className={cn(`text-${currentConfig.color}-500 animate-pulse`)} />
                            </div>
                            <div className="text-center space-y-4">
                                <h3 className="text-2xl font-black text-white uppercase tracking-[0.4em]">МОДУЛЬ_В_ОБРОБЦІ</h3>
                                <p className="text-xs text-slate-500 italic max-w-md mx-auto">
                                    Даний сегмент матриці знаходиться у стадії фінального квантового навчання. Очікуйте розгортання у v56.1.4.
                                </p>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>

        <style dangerouslySetInnerHTML={{
            __html: `
            .panel-3d {
                transition: all 0.6s cubic-bezier(0.19, 1, 0.22, 1);
            }
            .panel-3d:hover {
                transform: translateY(-10px) rotateX(2deg) rotateY(-2deg);
                box-shadow: 0 50px 100px -20px rgba(0,0,0,0.9);
            }
            .no-scrollbar::-webkit-scrollbar {
                display: none;
            }
        `}} />
      </div>
    </PageTransition>
  );
};

export default PremiumHubView;
