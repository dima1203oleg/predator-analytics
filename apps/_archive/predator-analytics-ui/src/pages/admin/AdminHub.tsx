import { Button } from '@/components/ui/button';
import React, { lazy, Suspense, useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader, Activity, Network, GitMerge, Cpu, ShieldAlert,
  Database, Zap, Factory, BrainCircuit, HardDrive,
  BookOpen, Layers, Eye, Settings, Globe, ShieldCheck,
  TrendingUp, BarChart3, Fingerprint, Target, Search,
  Lock, MessageSquare, Anchor, FileText, Share2, AlertTriangle,
  ZapOff, Terminal, Sparkles, Radio, Shield, Zap as ZapIcon,
  Atom, Box, Boxes, PieChart, ChevronRight, Maximize2,
  RefreshCw, Orbit, Scale, Blocks, Bot, Hexagon
} from 'lucide-react';
import { VerticalTabNav } from '@/components/layout/VerticalTabNav';
import { cn } from '@/lib/utils';
import {
  useSystemStatus,
  useSystemStats,
  useAgentsStats
} from '@/hooks/useAdminApi';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { useUISound, UISoundType } from '@/hooks/useUISound';

/**
 * 🦅 PREDATOR Analytics | Admin Hub v61.0-ELITE
 * ГЛОБАЛЬНИЙ_ОРКЕСТРАТОР_СУВЕРЕНУ: Єдиний інтерфейс управління всіма системами.
 */

// ─── Ліниве завантаження вкладок ─────────────────────────────────────────────

// System Core
const SovereignCommandCenter = lazy(() => import('./tabs/SovereignCommandCenter'));
const InfraTelemetryTab  = lazy(() => import('./tabs/InfraTelemetryTab'));
const FailoverRoutingTab = lazy(() => import('./tabs/FailoverRoutingTab'));
const GitOpsPipelineTab  = lazy(() => import('./tabs/GitOpsPipelineTab'));
const AgentsOpsTab       = lazy(() => import('./tabs/AgentsOpsTab'));
const ZeroTrustSecTab    = lazy(() => import('./tabs/ZeroTrustSecurityTab'));
const DataOpsTab         = lazy(() => import('./tabs/DataOpsTab'));
const ChaosControlHub    = lazy(() => import('./ChaosControlHub'));
const ResourceGuardTab   = lazy(() => import('./tabs/ResourceGuardTab'));
const PtyTerminal        = lazy(() => import('@/features/monitoring/PtyTerminal'));

// AI Lab
const AIControlPlane        = lazy(() => import('@/features/ai/AIControlPlane'));
const AIInsightsHub         = lazy(() => import('@/features/ai/AIInsightsHub'));
const EnginesView           = lazy(() => import('@/features/ai/EnginesView'));
const LLMView               = lazy(() => import('@/features/ai/LLMView'));
const SuperIntelligenceView = lazy(() => import('@/features/ai/SuperIntelligenceView'));
const SystemFactoryView     = lazy(() => import('@/features/factory/SystemFactoryView'));
const FactoryStudio         = lazy(() => import('@/features/factory/FactoryStudio'));
const AutoFactoryView       = lazy(() => import('@/features/ai/AutoFactoryView'));
const ModelTrainingView     = lazy(() => import('@/features/ai/ModelTrainingView'));
const DatasetsStudioView    = lazy(() => import('@/features/ai/DatasetsStudioView'));
const SystemPromptsView     = lazy(() => import('@/features/ai/SystemPromptsView'));
const NasView               = lazy(() => import('@/features/ai/NasView'));
const ForecastView          = lazy(() => import('@/features/ai/ForecastView'));
const ContinuousLearningView = lazy(() => import('@/features/ai/ContinuousLearningView'));

// Autonomous Factory
const ChiefConductorView = lazy(() => import('@/features/ai/ChiefConductorView'));
const CouncilJudgeView   = lazy(() => import('@/features/ai/CouncilJudgeView'));
const TelegramCenterView = lazy(() => import('@/features/ai/TelegramCenterView'));

// Intelligence & OSINT
const SovereignIntelHub      = lazy(() => import('@/features/ai/SovereignIntelHub'));
const PredictiveNexusView    = lazy(() => import('@/features/ai/PredictiveNexusView'));
const HypothesisEngineView   = lazy(() => import('@/features/ai/HypothesisEngineView'));
const KnowledgeEngineeringView = lazy(() => import('@/features/ai/KnowledgeEngineeringView'));
const ScenarioModelingView   = lazy(() => import('@/features/ai/ScenarioModelingView'));
const CustomsIntelligenceView = lazy(() => import('@/features/intelligence/CustomsIntelligenceView'));
const SearchConsole          = lazy(() => import('@/features/osint/SearchConsole'));
const ZradaControlView       = lazy(() => import('@/features/intelligence/ZradaControlView'));
const AMLScoringView         = lazy(() => import('@/features/intelligence/AMLScoringView'));
const SanctionsScreening     = lazy(() => import('@/features/intelligence/SanctionsScreening'));
const FinancialSigintView    = lazy(() => import('@/features/intelligence/FinancialSigintView'));
const GeopoliticalRadarView  = lazy(() => import('@/features/intelligence/GeopoliticalRadarView'));
const UBOMapView             = lazy(() => import('@/features/intelligence/UBOMapView'));
const EntityRadarView        = lazy(() => import('@/features/intelligence/EntityRadarView'));
const EvolutionView          = lazy(() => import('@/features/intelligence/EvolutionView'));
const ConversationIntelView  = lazy(() => import('@/features/osint/ConversationIntelView'));
const MaritimeView           = lazy(() => import('@/features/osint/MaritimeView'));
const TendersView            = lazy(() => import('@/features/osint/TendersView'));
const RegistriesView         = lazy(() => import('@/features/osint/RegistriesView'));
const DataGovView            = lazy(() => import('@/features/osint/DataGovView'));

// Platform
const SettingsView           = lazy(() => import('@/features/platform/SettingsView'));
const UtosDashboard        = lazy(() => import('@/pages/diagnostics/UtosDashboard'));
const DeploymentCommandCenter = lazy(() => import('@/pages/admin/DeploymentCommandCenter'));

// Analytics & Business Intel
const SupplyChainAnalyticsView = lazy(() => import('@/features/supply-chain/SupplyChainAnalyticsView'));
const EntityResolverView       = lazy(() => import('@/features/analytics/EntityResolverView'));
const FinancialDashboard       = lazy(() => import('@/features/analytics/FinancialDashboard'));
const MarketOverviewTab        = lazy(() => import('@/features/market/components/MarketOverviewTab').then(m => ({ default: m.MarketOverviewTab })));
const DueDiligenceView         = lazy(() => import('@/features/diligence/DueDiligence'));
const TimelineBuilderView     = lazy(() => import('@/features/investigation/TimelineBuilderView'));
const ClientsHubView           = lazy(() => import('@/features/clients/ClientsHubView'));
const ExecutiveBrief           = lazy(() => import('@/components/dashboard/ExecutiveBrief').then(m => ({ default: m.ExecutiveBrief })));
const PortfolioRiskView        = lazy(() => import('@/features/dashboard/PortfolioRiskView'));
const MATargetScannerView      = lazy(() => import('@/features/intelligence/MATargetScannerView'));
const MarketEntryView          = lazy(() => import('@/features/intelligence/MarketEntryView'));

// Final Spec Additions
const WhatIfSimulatorView      = lazy(() => import('@/features/forecast/WhatIfSimulatorView'));
const DigitalTwinView          = lazy(() => import('@/features/modeling/DigitalTwinView'));
const RegulatoryRadarView      = lazy(() => import('@/features/intelligence/RegulatoryRadarView'));
const ConnectionExplorer3DView = lazy(() => import('@/features/network/ConnectionExplorer3DView'));
const PanicControlView         = lazy(() => import('@/features/security/PanicControlView'));
const PluginEcosystemView      = lazy(() => import('@/features/platform/PluginEcosystemView'));
// ─── Конфіг вкладок ───────────────────────────────────────────────────────────

type TabCategory = 'SYSTEM_CORE' | 'AI_LAB' | 'INTEL_OSINT' | 'DATA_OPS';

interface TabConfig {
  id: string;
  category: TabCategory;
  label: string;
  badge?: string;
  icon: React.ElementType;
  component: React.ComponentType<any>;
}

const TABS: TabConfig[] = [
  // ─── SYSTEM_CORE (Командний Центр) ─────────────────────────────────────────
  { id: 'command',      category: 'SYSTEM_CORE', label: 'КОМАНДНИЙ_ЦЕНТР', badge: 'СУВЕРЕН', icon: Shield,        component: SovereignCommandCenter },
  { id: 'infra',        category: 'SYSTEM_CORE', label: 'ТЕЛЕМЕТРІЯ',      badge: 'ЖИВИЙ',   icon: Activity,      component: InfraTelemetryTab },

  // ─── INTEL_OSINT (Розвідка та OSINT) ───────────────────────────────────────
  { id: 'osint',        category: 'INTEL_OSINT', label: 'КОНСОЛЬ_ПОШУКУ',  badge: 'ПОШУК',   icon: Search,        component: SearchConsole },
  { id: 'intelligence', category: 'INTEL_OSINT', label: 'МИТНА_РОЗВІДКА',  badge: 'ЕЛІТА',   icon: Eye,           component: CustomsIntelligenceView },
  { id: 'zrada',        category: 'INTEL_OSINT', label: 'ОЦІНКА_РИЗИКІВ',  badge: 'РИЗИК',   icon: ShieldAlert,   component: ZradaControlView },

  // ─── AI_LAB (ШІ Ядро) ──────────────────────────────────────────────────────
  { id: 'ai-insights',  category: 'AI_LAB',      label: 'КОГНІТИВНИЙ_ЧАТ', badge: 'НЕКСУС',  icon: BrainCircuit,  component: AIInsightsHub },
  { id: 'factory',      category: 'AI_LAB',      label: 'ОРКЕСТРАЦІЯ_АГЕНТІВ',badge: 'АВТО', icon: Bot,           component: SystemFactoryView },
  { id: 'continuous-learning', category: 'AI_LAB', label: 'БЕЗПЕРЕРВНЕ_НАВЧАННЯ', badge: 'DEEPSEEK', icon: RefreshCw, component: ContinuousLearningView },
  { id: 'digital-twin', category: 'SYSTEM_CORE', label: 'ЦИФРОВИЙ_ДВІЙНИК', badge: 'СИМУЛЯЦІЯ', icon: Orbit, component: DigitalTwinView },
];

const DEFAULT_TAB = 'command';

// ─── HeartbeatLine Component ──────────────────────────────────────────────────

const HeartbeatLine: React.FC<{ color?: string }> = () => null;

// ─── SystemStatusHeader ──────────────────────────────────────────────────────

const SystemStatusHeader: React.FC = () => {
  const { data: status } = useSystemStatus();
  const { data: stats } = useSystemStats();
  const { data: agentsData } = useAgentsStats();
  const { llmTriStateMode } = useBackendStatus();
  
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const vramUsed = (stats?.gpu_mem_used ?? 0) / (1024 ** 3);
  const vramTotal = (stats?.gpu_mem_total || (8 * 1024 ** 3)) / (1024 ** 3);
  const cpuPercent = stats?.cpu_percent ?? 0;
  const agentsCount = agentsData?.stats?.total ?? 0;
  
  const threatLevel = status ? Math.min(100, (status.summary.failed * 25) + (status.summary.degraded * 10) + 5) : 5;
  const entropy = (stats?.memory_percent ?? 0) / 100;

  const isCritical = vramUsed > (vramTotal * 0.95);
  const isHybrid = vramUsed > (vramTotal * 0.75) && !isCritical;

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm relative z-30">
      <div className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-12">
          {/* System Identity */}
          <div className="flex items-center gap-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
              <Hexagon className="w-6 h-6 text-blue-600 dark:text-blue-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-slate-900 dark:text-white">PREDATOR Analytics</span>
              <span className="text-sm text-slate-500 font-medium">Enterprise Edition v66.0</span>
            </div>
          </div>
          
          <div className="h-10 w-px bg-slate-200 dark:bg-slate-800" />
          
          {/* Node Status */}
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Режим роботи</span>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2.5 h-2.5 rounded-full",
                llmTriStateMode === 'CLOUD' ? "bg-sky-500" : llmTriStateMode === 'HYBRID' ? "bg-blue-500" : "bg-teal-500"
              )} />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {llmTriStateMode === 'CLOUD' ? "Хмарний (Зовнішній)" : llmTriStateMode === 'HYBRID' ? "Гібридний (Баланс)" : "Локальний (Суверенний)"}
              </span>
            </div>
          </div>
        </div>

        {/* Telemetry */}
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Навантаження CPU</span>
            <span className={cn("text-xl font-bold", cpuPercent > 80 ? "text-red-500" : "text-slate-700 dark:text-slate-200")}>
              {cpuPercent.toFixed(1)}%
            </span>
          </div>
          
          <div className="h-10 w-px bg-slate-200 dark:bg-slate-800" />
          
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Активні агенти</span>
            <span className="text-xl font-bold text-slate-700 dark:text-slate-200">
              {agentsCount}
            </span>
          </div>

          <div className="h-10 w-px bg-slate-200 dark:bg-slate-800" />
          
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Безпека</span>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-500">Захищено</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Індикатор завантаження ───────────────────────────────────────────────────

const TabLoader: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-6 text-slate-500">
    <Loader className="w-8 h-8 animate-spin text-blue-500" />
    <span className="text-sm font-medium">Завантаження модуля...</span>
  </div>
);

// ─── Навігація вкладок ────────────────────────────────────────────────────────

interface TabNavProps {
  activeTab: string;
  onTabChange: (id: string) => void;
}

const TabNav: React.FC<TabNavProps> = ({ activeTab, onTabChange }) => {
  const { data: status } = useSystemStatus();
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);
  const { play } = useUISound();

  const activeTabConfig = TABS.find(t => t.id === activeTab);
  const [selectedCategory, setSelectedCategory] = React.useState<TabCategory>(
    activeTabConfig?.category ?? 'SYSTEM_CORE'
  );

  const CATEGORIES: { id: TabCategory; label: string; subLabel: string; icon: any; color: string }[] = [
    { id: 'SYSTEM_CORE', label: 'КОМАНДНИЙ_ЦЕНТР', subLabel: 'СУВЕРЕН_&_ІНФРА', icon: Shield, color: 'cyan' },
    { id: 'INTEL_OSINT', label: 'РОЗВІДКА_&_OSINT', subLabel: 'ГЛОБАЛЬНИЙ_АНАЛІЗ', icon: Eye, color: 'cyan' },
    { id: 'AI_LAB',      label: 'ШІ_ЯДРО', subLabel: 'АГЕНТИ_&_КОГНІТИКА', icon: BrainCircuit, color: 'cyan' },
  ];

  const filteredTabs = TABS.filter(t => t.category === selectedCategory);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  useEffect(() => {
    if (activeTabConfig) {
      setSelectedCategory(activeTabConfig.category);
    }
  }, [activeTab]);

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-20 sticky top-0 shadow-sm">
      {/* Category Selector */}
      <div className="flex items-center gap-2 px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
        {CATEGORIES.map(cat => {
          const isActive = selectedCategory === cat.id;
          const Icon = cat.icon;
          return (
            <Button variant="cyber"
              key={cat.id}
              onClick={() => {
                play(UISoundType.CLICK);
                setSelectedCategory(cat.id);
              }}
              onMouseEnter={() => play(UISoundType.HOVER)}
              className={cn(
                "flex items-center gap-3 px-6 py-4 transition-all duration-200 relative",
                isActive 
                  ? "text-blue-600 dark:text-blue-400" 
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
              )}
              <Icon size={18} className={cn("transition-transform", isActive && "scale-110")} />
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-semibold">{cat.label.replace(/_/g, ' ')}</span>
                <span className="text-[10px] font-medium opacity-80">{cat.subLabel.replace(/_/g, ' ')}</span>
              </div>
            </Button>
          );
        })}
      </div>

      {/* Tabs list */}
      <div className="relative flex items-center h-14 bg-white dark:bg-slate-900">
        <div 
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex items-center gap-2 px-6 overflow-x-auto no-scrollbar scroll-smooth flex-1 h-full"
        >
          {filteredTabs.map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <Button variant="cyber"
                key={tab.id}
                onClick={() => {
                  play(UISoundType.CLICK);
                  onTabChange(tab.id);
                }}
                onMouseEnter={() => play(UISoundType.HOVER)}
                className={cn(
                  'relative flex items-center whitespace-nowrap gap-2 px-4 py-2 text-sm font-medium transition-all rounded-md',
                  active
                    ? 'text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800',
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label.replace(/_/g, ' ')}</span>
                {tab.badge && (
                  <span className={cn(
                    'text-[10px] font-semibold px-2 py-0.5 rounded-full ml-1',
                    active 
                      ? 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-100' 
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
                  )}>
                    {tab.badge}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── AdminHub ─────────────────────────────────────────────────────────────────

export const AdminHub: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const rawTab = searchParams.get('tab');
  const activeTab = TABS.find((t) => t.id === rawTab)?.id ?? DEFAULT_TAB;

  useEffect(() => {
    if (!rawTab || !TABS.find((t) => t.id === rawTab)) {
      navigate(`/admin/command?tab=${DEFAULT_TAB}`, { replace: true });
    }
  }, [rawTab, navigate]);

  const handleTabChange = (id: string) => {
    navigate(`/admin/command?tab=${id}`, { replace: true });
  };

  const activeTabConfig = useMemo(() => TABS.find((t) => t.id === activeTab), [activeTab]);
  const ActiveComponent = activeTabConfig?.component;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Глобальний статус системи */}
      <SystemStatusHeader />

      {/* Навігація вкладок */}
      <TabNav activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Контент вкладки */}
        <div className="flex-1 overflow-auto relative custom-scrollbar pb-10 bg-slate-50 dark:bg-slate-950">
          <div className="relative z-10 h-full">
            <Suspense fallback={<TabLoader />}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  {ActiveComponent && <ActiveComponent />}
                </motion.div>
              </AnimatePresence>
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHub;
