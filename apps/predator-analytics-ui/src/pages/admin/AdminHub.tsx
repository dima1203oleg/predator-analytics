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
  RefreshCw, Orbit
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useSystemStatus, 
  useSystemStats, 
  useAgentsStats 
} from '@/hooks/useAdminApi';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { useBackendStatus } from '@/hooks/useBackendStatus';

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

// Analytics & Business Intel
const SupplyChainAnalyticsView = lazy(() => import('@/features/supply-chain/SupplyChainAnalyticsView'));
const EntityResolverView       = lazy(() => import('@/features/analytics/EntityResolverView'));
const FinancialDashboard       = lazy(() => import('@/features/analytics/FinancialDashboard'));
const MarketOverviewTab        = lazy(() => import('@/features/market/components/MarketOverviewTab'));
const DueDiligenceView         = lazy(() => import('@/features/diligence/DueDiligence'));
const TimelineBuilderView     = lazy(() => import('@/features/investigation/TimelineBuilderView'));
const ClientsHubView           = lazy(() => import('@/features/clients/ClientsHubView'));
const ExecutiveBrief           = lazy(() => import('@/components/dashboard/ExecutiveBrief').then(m => ({ default: m.ExecutiveBrief })));
const PortfolioRiskView        = lazy(() => import('@/features/dashboard/PortfolioRiskView'));
const MATargetScannerView      = lazy(() => import('@/features/intelligence/MATargetScannerView'));
const MarketEntryView          = lazy(() => import('@/features/intelligence/MarketEntryView'));

// ─── Конфіг вкладок ───────────────────────────────────────────────────────────

type TabCategory = 'SYSTEM_CORE' | 'AI_LAB' | 'INTEL_OSINT' | 'BUSINESS_INTEL' | 'PLATFORM';

interface TabConfig {
  id: string;
  category: TabCategory;
  label: string;
  badge?: string;
  icon: React.ElementType;
  component: React.LazyExoticComponent<React.FC>;
}

const TABS: TabConfig[] = [
  // ─── BUSINESS_INTEL ────────────────────────────────────────────────────────
  { id: 'brief',        category: 'BUSINESS_INTEL', label: 'РАНКОВИЙ_ЗВІТ', badge: 'ГД',      icon: TrendingUp,    component: ExecutiveBrief },
  { id: 'risk-admin',   category: 'BUSINESS_INTEL', label: 'РИЗИКИ_ПОРТФЕЛЯ', badge: 'ФІН',    icon: PieChart,      component: PortfolioRiskView },
  { id: 'ma-scanner',   category: 'BUSINESS_INTEL', label: 'СКАНЕР_M&A',     badge: 'УГОДА',   icon: Target,        component: MATargetScannerView },
  { id: 'market-entry', category: 'BUSINESS_INTEL', label: 'АНАЛІЗ_РИНКУ',    badge: 'ЕКСПАНСІЯ', icon: Globe,        component: MarketEntryView },
  { id: 'roi-audit',    category: 'BUSINESS_INTEL', label: 'АУДИТ_ROI',      badge: 'ГРОШІ',    icon: BarChart3,     component: FinancialDashboard },

  // ─── SYSTEM_CORE ───────────────────────────────────────────────────────────
  { id: 'command',      category: 'SYSTEM_CORE', label: 'КОМАНДНИЙ_ЦЕНТР', badge: 'СУВЕРЕН', icon: Zap,           component: SovereignCommandCenter },
  { id: 'infra',        category: 'SYSTEM_CORE', label: 'ТЕЛЕМЕТРІЯ',   badge: 'ЖИВИЙ',     icon: Activity,      component: InfraTelemetryTab },
  { id: 'failover',     category: 'SYSTEM_CORE', label: 'РЕЗЕРВУВАННЯ',                    icon: Network,       component: FailoverRoutingTab },
  { id: 'gitops',       category: 'SYSTEM_CORE', label: 'КОНВЕЄР_GITOPS',                 icon: GitMerge,      component: GitOpsPipelineTab  },
  { id: 'agents-ops',   category: 'SYSTEM_CORE', label: 'ШІ_АГЕНТИ_OPS',                          icon: Cpu,           component: AgentsOpsTab       },
  { id: 'security',     category: 'SYSTEM_CORE', label: 'НУЛЬОВА_ДОВІРА',   badge: 'БЕЗПЕКА',      icon: ShieldAlert,   component: ZeroTrustSecTab    },
  { id: 'dataops',      category: 'SYSTEM_CORE', label: 'ЦЕНТР_DATAOPS',                   icon: Database,      component: DataOpsTab         },
  { id: 'chaos',        category: 'SYSTEM_CORE', label: 'ОПЕРАЦІЇ_ХАОСУ',    badge: 'НЕБЕЗПЕКА',   icon: Zap,           component: ChaosControlHub    },
  { id: 'res-guard',    category: 'SYSTEM_CORE', label: 'ЗАХИСТ_РЕСУРСІВ', badge: 'В-ПАМ',       icon: Shield,        component: ResourceGuardTab   },
  { id: 'pty',          category: 'SYSTEM_CORE', label: 'PTY_ТЕРМІНАЛ',    badge: 'КЛЮЧ',     icon: Terminal,      component: PtyTerminal        },
  
  // ─── AI_LAB ────────────────────────────────────────────────────────────────
  { id: 'ai-control',   category: 'AI_LAB', label: 'КЕРУВАННЯ_ШІ',   badge: 'НЕКСУС',    icon: Zap,           component: AIControlPlane },
  { id: 'ai-insights',  category: 'AI_LAB', label: 'АНАЛІТИКА_ШІ',  badge: 'ГЛИБИНА',     icon: BrainCircuit,  component: AIInsightsHub },
  { id: 'ai-engines',   category: 'AI_LAB', label: 'ДВИГУНИ_ШІ',   badge: 'ЯДРО',     icon: Cpu,           component: EnginesView },
  { id: 'llm-explorer', category: 'AI_LAB', label: 'LLM_ПРОВІДНИК',                    icon: BookOpen,      component: LLMView },
  { id: 'factory',      category: 'AI_LAB', label: 'ЗАВОД_ШІ',      badge: 'ПРОД',     icon: Factory,       component: SystemFactoryView  },
  { id: 'factory-studio', category: 'AI_LAB', label: 'СТУДІЯ_ЗАВОДУ',  badge: 'ДИЗАЙН',   icon: Layers,        component: FactoryStudio },
  { id: 'auto-factory', category: 'AI_LAB', label: 'АВТО-ФАБРИКА',  badge: 'ПСВД',     icon: Sparkles,      component: AutoFactoryView },
  { id: 'models',       category: 'AI_LAB', label: 'ДОНАВЧАННЯ',    badge: 'МН',       icon: BrainCircuit,  component: ModelTrainingView  },
  { id: 'datasets',     category: 'AI_LAB', label: 'ДАТАСЕТИ',      badge: 'ДАНІ',     icon: HardDrive,     component: DatasetsStudioView },
  { id: 'prompts',      category: 'AI_LAB', label: 'ПРОМПТИ',                         icon: MessageSquare, component: SystemPromptsView },
  { id: 'nas',          category: 'AI_LAB', label: 'НЕЙРОМЕРЕЖІ',  badge: 'НПС',      icon: Cpu,           component: NasView },
  { id: 'forecast',     category: 'AI_LAB', label: 'ПРОГНОЗИ',      badge: 'МАТЕМ',     icon: TrendingUp,    component: ForecastView },
  { id: 'super-intel',  category: 'AI_LAB', label: 'СУПЕР_ІНТЕЛЕКТ',   badge: 'ОМЕГА',    icon: Zap,           component: SuperIntelligenceView },

  // ─── INTEL_OSINT ───────────────────────────────────────────────────────────
  { id: 'intel-hub',    category: 'INTEL_OSINT', label: 'ХАБ_РОЗВІДКИ',    badge: 'ОРАКУЛ',   icon: Network,       component: SovereignIntelHub },
  { id: 'nexus',        category: 'INTEL_OSINT', label: 'НЕКСУС_ПРОГНОЗ',        badge: 'ПРОГНОЗ',  icon: Zap,           component: PredictiveNexusView },
  { id: 'hypothesis',   category: 'INTEL_OSINT', label: 'ГІПОТЕЗИ',                        icon: BrainCircuit,  component: HypothesisEngineView },
  { id: 'knowledge',    category: 'INTEL_OSINT', label: 'ЗНАННЯ',                         icon: BookOpen,      component: KnowledgeEngineeringView },
  { id: 'scenarios',    category: 'INTEL_OSINT', label: 'СЦЕНАРІЇ',     badge: 'СИМ',      icon: Layers,        component: ScenarioModelingView },
  { id: 'intelligence', category: 'INTEL_OSINT', label: 'РОЗВІДКА',     badge: 'ПРИВИД',   icon: Eye,           component: CustomsIntelligenceView },
  { id: 'fin-sigint',   category: 'INTEL_OSINT', label: 'ФІН_SIGINT',   badge: 'ГРОШІ',    icon: BarChart3,     component: FinancialSigintView },
  { id: 'due-diligence', category: 'INTEL_OSINT', label: 'ОБАЧНІСТЬ', badge: 'ЗК',       icon: ShieldCheck,   component: DueDiligenceView },
  { id: 'timeline',     category: 'INTEL_OSINT', label: 'ХРОНОГРАФ',    badge: 'ІСТОРІЯ',      icon: Activity,      component: TimelineBuilderView },
  { id: 'supply-chain', category: 'INTEL_OSINT', label: 'ЛАНЦЮГИ_ПОСТАВОК', badge: 'ЛОГІСТИКА', icon: Box,        component: SupplyChainAnalyticsView },
  { id: 'entity-resolver', category: 'INTEL_OSINT', label: 'РЕЗОЛВЕР', badge: 'СПІВПАДІННЯ', icon: Fingerprint, component: EntityResolverView },
  { id: 'clients',      category: 'INTEL_OSINT', label: 'ХАБ_КЛІЄНТІВ', badge: 'CRM',       icon: Globe,         component: ClientsHubView },
  { id: 'fin-dashboard', category: 'INTEL_OSINT', label: 'ФІН_ДАШБОРД', badge: 'СКАРБНИЦЯ', icon: BarChart3, component: FinancialDashboard },
  { id: 'market-intel', category: 'INTEL_OSINT', label: 'АНАЛІЗ_РИНКУ_OSINT',  badge: 'РИНОК',   icon: Globe,         component: MarketOverviewTab },
  { id: 'geo-radar',    category: 'INTEL_OSINT', label: 'ГЕО-РАДАР',    badge: 'ГЛОБУС',    icon: Globe,         component: GeopoliticalRadarView },
  { id: 'ubo-map',      category: 'INTEL_OSINT', label: 'МАПА_UBO',     badge: 'СУТНОСТІ', icon: Share2,        component: UBOMapView },
  { id: 'entity-radar', category: 'INTEL_OSINT', label: 'РАДАР_ОБ\'ЄКТІВ', badge: 'ТРЕК',    icon: Target,        component: EntityRadarView },
  { id: 'evolution',    category: 'INTEL_OSINT', label: 'ЕВОЛЮЦІЯ_АКТИВУ',     badge: 'АГЕНТ',    icon: TrendingUp,    component: EvolutionView },
  { id: 'osint',        category: 'INTEL_OSINT', label: 'КОНСОЛЬ_ОСІНТ', badge: 'ПОШУК',    icon: Search,        component: SearchConsole },
  { id: 'zrada',        category: 'INTEL_OSINT', label: 'КОНТРОЛЬ_ЗРАДИ', badge: 'ЕЛІТА',    icon: ShieldAlert,   component: ZradaControlView },
  { id: 'aml',          category: 'INTEL_OSINT', label: 'СКОРИНГ_АМЛ',   badge: 'РИЗИК',     icon: Activity,      component: AMLScoringView },
  { id: 'sanctions',    category: 'INTEL_OSINT', label: 'САНКЦІЇ',       badge: 'ГЛОБАЛЬНО',   icon: Lock,          component: SanctionsScreening },
  { id: 'conv-intel',   category: 'INTEL_OSINT', label: 'СОЦ_РОЗВІДКА', badge: 'СОЦІАЛЬНО',   icon: MessageSquare, component: ConversationIntelView },
  { id: 'maritime',     category: 'INTEL_OSINT', label: 'МОРСЬКИЙ_ТРЕК', badge: 'СУДНО',   icon: Anchor,        component: MaritimeView },
  { id: 'tenders',      category: 'INTEL_OSINT', label: 'ТЕНДЕРИ_PROZORRO',      badge: 'PROZORRO', icon: FileText,      component: TendersView },
  { id: 'registries',   category: 'INTEL_OSINT', label: 'РЕЄСТРИ_БД',      badge: 'БД',       icon: Database,      component: RegistriesView },
  { id: 'open-data',    category: 'INTEL_OSINT', label: 'ВІДКРИТІ_ДАНІ', badge: 'ДЕРЖ',      icon: Globe,         component: DataGovView },
  
  // ─── PLATFORM ──────────────────────────────────────────────────────────────
  { id: 'settings',     category: 'PLATFORM', label: 'НАЛАШТУВАННЯ',                    icon: Settings,      component: SettingsView },
  { id: 'alerts-system', category: 'PLATFORM', label: 'СИСТЕМНІ_СПОВІЩЕННЯ', badge: 'ЛОГ', icon: AlertTriangle, component: lazy(() => import('@/features/alerts/AlertCenterView')) },
  { id: 'decisions',    category: 'PLATFORM', label: 'ЖУРНАЛ_РІШЕНЬ',    badge: 'АУДИТ',    icon: FileText,      component: lazy(() => import('@/features/decisions/DecisionsJournal')) },
  { id: 'logs',         category: 'PLATFORM', label: 'СИСТЕМНІ_ЛОГИ',    badge: 'СИРІ',      icon: Terminal,      component: lazy(() => import('@/features/monitoring/RealTimeMonitor')) },
];

const DEFAULT_TAB = 'brief';

// ─── HeartbeatLine Component ──────────────────────────────────────────────────

const HeartbeatLine: React.FC<{ color?: string }> = ({ color = 'rose' }) => {
  return (
    <div className="flex items-end gap-[2px] h-6 w-16 px-2">
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ 
            height: [
              `${20 + Math.random() * 30}%`, 
              `${60 + Math.random() * 40}%`, 
              `${20 + Math.random() * 30}%`
            ] 
          }}
          transition={{ 
            duration: 0.4 + Math.random() * 0.4, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className={cn(
            "w-[2px] rounded-full shadow-2xl",
            color === 'rose' ? "bg-rose-500/40 shadow-rose-500/20" : "bg-emerald-500/40 shadow-emerald-500/20"
          )}
        />
      ))}
    </div>
  );
};

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
    <div className="flex flex-col bg-black/60 glass-wraith border-b-2 border-white/5 relative overflow-hidden group select-none z-30 backdrop-blur-[60px] shadow-4xl">
      <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none" />
      
      {/* Top Border Accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500/50 to-transparent shadow-[0_0_30px_rgba(225,29,72,0.8)]" />

      <div className="flex items-center justify-between px-12 py-8 text-[11px] font-black tracking-[0.3em] uppercase z-10 relative">
        <div className="flex items-center gap-20">
          {/* System Identity */}
          <div className="flex items-center gap-12 relative group/logo">
            <div className="relative">
              <div className="absolute -inset-12 bg-rose-500/10 blur-[60px] rounded-full scale-0 group-hover/logo:scale-150 transition-transform duration-1000 opacity-0 group-hover/logo:opacity-100" />
              <div className="absolute -inset-8 border-2 border-rose-500/10 rounded-full animate-ping pointer-events-none" style={{ animationDuration: '4s' }} />
              
              <div className="flex flex-col relative">
                <div className="flex items-center gap-4 mb-3">
                  <motion.div 
                    animate={{ scale: [1, 1.8, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="w-2.5 h-2.5 bg-rose-500 rounded-full shadow-[0_0_20px_rgba(225,29,72,1)]" 
                  />
                  <span className="text-white/30 text-[9px] leading-none tracking-[0.7em] font-black italic">СУВЕРЕННИЙ_ХАБ_ОМЕГА</span>
                </div>
                <span className="flex items-center gap-6 text-white font-black tracking-[0.5em] text-2xl italic glint-elite">
                   <Atom size={28} className="animate-spin-slow text-rose-500 shadow-rose-500/20" />
                   PREDATOR <span className="text-rose-500">v61.0-ELITE</span>
                </span>
              </div>
            </div>
            
            <div className="flex flex-col border-l-2 border-white/5 pl-12 h-16 justify-center">
              <span className="text-white/20 text-[9px] leading-none mb-3 tracking-[0.5em] font-black uppercase italic">СТРАТЕГІЯ_ЯДРА</span>
              <div className="flex items-center gap-6">
                <div className="relative flex items-center justify-center">
                  <div className={cn(
                    "w-4 h-4 rounded-full shadow-[0_0_30px]",
                    llmTriStateMode === 'CLOUD' ? "bg-sky-500 shadow-sky-500/80" : llmTriStateMode === 'HYBRID' ? "bg-emerald-500 shadow-emerald-500/80" : "bg-rose-500 shadow-rose-500/80"
                  )} />
                  <motion.div 
                    animate={{ scale: [1, 3], opacity: [0.5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={cn(
                      "absolute inset-0 rounded-full",
                      llmTriStateMode === 'CLOUD' ? "bg-sky-500" : llmTriStateMode === 'HYBRID' ? "bg-emerald-500" : "bg-rose-500"
                    )} 
                  />
                </div>
                <div className="flex flex-col">
                  <span className={cn(
                    "font-black tracking-[0.4em] text-xl italic glint-elite",
                    llmTriStateMode === 'CLOUD' ? "text-sky-400" : llmTriStateMode === 'HYBRID' ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {llmTriStateMode === 'CLOUD' ? "ХМАРНЕ_ПЕРЕКЛЮЧЕННЯ" : llmTriStateMode === 'HYBRID' ? "ГІБРИДНИЙ_СУВЕРЕН" : "ЛОКАЛЬНИЙ_СУВЕРЕН"}
                  </span>
                  <span className="text-white/10 text-[8px] tracking-[0.3em] mt-2 uppercase font-black italic">VRAM: {vramUsed.toFixed(1)}GB / {vramTotal.toFixed(1)}GB • {llmTriStateMode === 'CLOUD' ? 'OUTER_CLUSTER' : 'LOCAL_NODE'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Telemetry Grid */}
          <div className="flex items-center gap-16 border-l-2 border-white/5 pl-16 h-16">
            <div className="flex items-center gap-10 group/stat">
              <div className="flex flex-col gap-3.5 min-w-[180px]">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-white/20 text-[9px] group-hover/stat:text-rose-500 transition-colors tracking-widest font-black italic">НЕЙРОННЕ_НАВАНТАЖЕННЯ</span>
                    <span className="text-white/10 text-[7px] tracking-widest leading-none mt-1.5 uppercase font-black">АКТИВНІ_ВАГИ_L3</span>
                  </div>
                  <span className={cn("font-black text-2xl tracking-tighter italic glint-elite", cpuPercent > 80 ? "text-rose-500" : "text-white/90")}>
                    {cpuPercent.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden p-[1px] border border-white/5 glass-wraith">
                  <motion.div 
                    animate={{ width: `${cpuPercent}%`, backgroundColor: cpuPercent > 80 ? '#f43f5e' : '#e11d48' }}
                    className="h-full rounded-full shadow-[0_0_20px_rgba(225,29,72,0.8)] relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                  </motion.div>
                </div>
              </div>
              <HeartbeatLine />
            </div>

            <div className="flex flex-col border-l-2 border-white/5 pl-16 h-14 justify-center">
              <span className="text-white/20 text-[9px] leading-none mb-4 tracking-[0.5em] font-black italic">АКТИВНІ_ВУЗЛИ</span>
              <div className="flex items-center gap-6">
                <Radio size={24} className="text-rose-500 animate-pulse shadow-rose-500/20" />
                <div className="flex flex-col">
                  <span className="text-white font-black text-2xl leading-none tracking-tighter italic glint-elite">
                    {agentsCount.toString().padStart(2, '0')} <span className="text-[10px] text-rose-500 not-italic ml-2 font-black uppercase tracking-widest">ВУЗЛІВ_OODA</span>
                  </span>
                  <span className="text-white/10 text-[8px] tracking-[0.4em] mt-2 font-black italic uppercase">ЛАТЕНТНІСТЬ: {status?.services?.[0]?.latency_ms ?? 0}MS</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col border-l-2 border-white/5 pl-16 h-14 justify-center group/threat">
              <span className="text-white/20 text-[9px] leading-none mb-4 tracking-[0.5em] font-black italic group-hover/threat:text-rose-500 transition-colors uppercase">РІВЕНЬ_ЗАГРОЗИ_L7</span>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <ShieldAlert size={28} className={cn("transition-all duration-1000", threatLevel > 70 ? "text-rose-500 drop-shadow-[0_0_20px_rgba(225,29,72,1)] scale-110" : "text-white/20")} />
                  {threatLevel > 70 && <motion.div animate={{ scale: [1, 2.5], opacity: [0.6, 0] }} transition={{ repeat: Infinity, duration: 1.2 }} className="absolute inset-0 bg-rose-500 rounded-full blur-xl" />}
                </div>
                <div className="flex flex-col">
                  <span className={cn("font-black text-2xl tracking-tighter italic leading-none glint-elite", threatLevel > 70 ? "text-rose-500" : "text-white/70")}>
                    {threatLevel.toFixed(0)}% <span className="text-[10px] opacity-40 ml-2 not-italic font-black">РИЗИК</span>
                  </span>
                  <span className="text-white/10 text-[8px] tracking-[0.4em] mt-2 uppercase font-black italic">{threatLevel > 70 ? 'КРИТИЧНА_ЗАГРОЗА' : 'БЕЗПЕЧНИЙ_РЕЖИМ'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-16">
          <div className="flex flex-col items-end border-r-2 border-white/5 pr-16 h-14 justify-center">
            <span className="text-white/20 text-[9px] leading-none mb-3 tracking-[0.6em] font-black uppercase italic">СИСТЕМНИЙ_ЧАС_UTC</span>
            <span className="text-white font-mono tracking-[0.5em] text-2xl font-black italic glint-elite">
              {time.toLocaleTimeString('uk-UA', { hour12: false })}
              <span className="text-[12px] text-rose-500/40 ml-3 font-black">[{time.getMilliseconds().toString().padStart(3, '0')}]</span>
            </span>
          </div>
          
          <div className="flex items-center gap-10 bg-rose-500/5 px-12 py-6 rounded-[2rem] glass-wraith border-2 border-rose-500/20 group-hover:border-rose-500/60 transition-all duration-1000 hover:bg-rose-500/10 cursor-crosshair relative group/secured shadow-4xl">
              <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-rose-500/40 group-hover/secured:border-rose-500 transition-colors" />
              <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-rose-500/40 group-hover/secured:border-rose-500 transition-colors" />
              <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-rose-500/40 group-hover/secured:border-rose-500 transition-colors" />
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-rose-500/40 group-hover/secured:border-rose-500 transition-colors" />
              
            <div className="relative flex items-center justify-center scale-150">
              <div className="w-6 h-6 rounded-full bg-rose-500 animate-ping absolute opacity-30" />
              <div className="w-6 h-6 rounded-full bg-rose-500 relative shadow-[0_0_30px_rgba(225,29,72,1)] flex items-center justify-center border-2 border-white/20">
                <Shield size={12} className="text-black" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-rose-500 font-black text-xl leading-none tracking-[0.3em] italic glint-elite">ЗАХИЩЕНО_L5</span>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex gap-1.5">
                  {[1,2,3,4,5,6].map(i => <div key={i} className="w-[5px] h-[5px] bg-rose-500/60 rounded-full shadow-rose-500/20" />)}
                </div>
                <span className="text-white/30 text-[9px] tracking-[0.6em] font-black italic uppercase">X-QUANTUM_CORE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Індикатор завантаження ───────────────────────────────────────────────────

const TabLoader: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full min-h-[600px] gap-12 bg-black relative overflow-hidden">
    <div className="absolute inset-0 bg-cyber-grid opacity-[0.05] pointer-events-none" />
    <div className="absolute inset-0 pointer-events-none opacity-[0.03] font-mono text-[9px] flex flex-wrap gap-6 overflow-hidden p-6 text-rose-500">
      {Array.from({ length: 150 }).map((_, i) => (
        <span key={i} className="animate-pulse" style={{ animationDelay: `${i * 0.02}s` }}>{Math.random().toString(16).substring(2, 12).toUpperCase()}</span>
      ))}
    </div>

    <div className="relative">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="w-48 h-48 border-2 border-rose-500/10 rounded-full shadow-4xl"
      />
      <motion.div 
        animate={{ rotate: -360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute inset-4 border-2 border-dashed border-rose-500/20 rounded-full"
      />
      
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-32 h-32 bg-rose-500/5 rounded-full flex items-center justify-center relative overflow-hidden border-2 border-rose-500/10 shadow-inner">
          <motion.div 
            initial={{ y: -150 }}
            animate={{ y: 150 }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-[2px] bg-rose-500 shadow-[0_0_30px_rgba(225,29,72,1)]"
          />
          <Atom className="w-12 h-12 text-rose-500 animate-spin-slow" />
        </div>
      </div>
    </div>

    <div className="flex flex-col items-center gap-10 z-10">
      <div className="flex flex-col items-center gap-3">
        <motion.span 
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-xl font-black uppercase tracking-[0.6em] text-rose-500 italic glint-elite"
        >
          ІНІЦІАЛІЗАЦІЯ_ВУЗЛА_ELITE
        </motion.span>
        <div className="h-1 w-80 bg-white/5 relative overflow-hidden rounded-full border border-white/5">
          <motion.div 
            initial={{ left: '-100%' }}
            animate={{ left: '100%' }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 bottom-0 w-1/2 bg-rose-500 shadow-[0_0_25px_rgba(225,29,72,1)] rounded-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-20 gap-y-3 opacity-40 max-w-lg">
        {[
          "НЕЙРОННИЙ_ЗВ'ЯЗОК: 10.4 GB/S",
          "РУКОСТИСКАННЯ_ЯДРА: ПІДТВЕРДЖЕНО",
          "ШАР_ДЕШИФРУВАННЯ: AES-256-GCM",
          "СУВЕРЕННА_АВТЕНТИФІКАЦІЯ: OK",
          "РОЗПОДІЛ_VRAM: 8GB_GUARD_АКТИВНИЙ",
          "СИНХРОНІЗАЦІЯ_МАПИ_UBO: L5"
        ].map((text, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(225,29,72,1)]" />
            <span className="text-[9px] font-black font-mono text-white whitespace-nowrap tracking-widest italic">{text}</span>
          </div>
        ))}
      </div>
    </div>
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

  const activeTabConfig = TABS.find(t => t.id === activeTab);
  const [selectedCategory, setSelectedCategory] = React.useState<TabCategory>(
    activeTabConfig?.category ?? 'SYSTEM_CORE'
  );

  const CATEGORIES: { id: TabCategory; label: string; subLabel: string; icon: any; color: string }[] = [
    { id: 'BUSINESS_INTEL', label: 'БІЗНЕС-АНАЛІТИКА', subLabel: 'РАНКОВИЙ_ЗВІТ_&_KPI', icon: TrendingUp, color: 'emerald' },
    { id: 'SYSTEM_CORE', label: 'ЯДРО_СИСТЕМИ', subLabel: 'ІНФРАСТРУКТУРА_&_CONTROL', icon: Shield, color: 'rose' },
    { id: 'AI_LAB',      label: 'AI_ЛАБОРАТОРІЯ', subLabel: 'НАВЧАННЯ_&_АВТОЗАВОД', icon: BrainCircuit, color: 'rose' },
    { id: 'INTEL_OSINT', label: 'РОЗВІДКА_&_OSINT', subLabel: 'ГЛОБАЛЬНИЙ_АНАЛІЗ_L7', icon: Eye, color: 'rose' },
    { id: 'PLATFORM',    label: 'ПЛАТФОРМА', subLabel: 'НАЛАШТУВАННЯ_&_АУДИТ', icon: Settings, color: 'rose' },
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
    <div className="flex flex-col bg-black border-b-2 border-white/5 z-20 sticky top-0 shadow-4xl">
      {/* Category Selector */}
      <div className="flex items-center gap-1 px-10 py-0 border-b border-white/5 bg-black/80 backdrop-blur-3xl relative overflow-hidden">
        <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
        
        {CATEGORIES.map(cat => {
          const isActive = selectedCategory === cat.id;
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "flex flex-col items-start gap-2 px-10 py-7 transition-all duration-700 relative group overflow-hidden border-r border-white/5 min-w-[280px]",
                isActive 
                  ? "text-rose-500" 
                  : "text-white/20 hover:text-white/50"
              )}
            >
              {isActive && (
                <>
                  <motion.div 
                    layoutId="activeCategoryBgElite"
                    className="absolute inset-0 bg-rose-500/[0.08] z-0"
                  />
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-rose-500 shadow-[0_0_20px_rgba(225,29,72,1)]" />
                </>
              )}
              <div className="flex items-center gap-5 relative z-10">
                <Icon size={20} className={cn("transition-all duration-700", isActive ? "text-rose-500 scale-125 glint-elite" : "text-white/10 group-hover:text-white/30")} />
                <span className="text-[13px] font-black uppercase tracking-[0.3em] italic">{cat.label}</span>
              </div>
              <span className={cn(
                "text-[9px] font-black font-mono uppercase tracking-[0.4em] transition-colors relative z-10 italic",
                isActive ? "text-rose-500/60" : "text-white/10"
              )}>
                {cat.subLabel}
              </span>
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-10 pr-6 relative z-10">
           <div className="flex flex-col items-end gap-1">
              <span className="text-white/10 text-[8px] font-black font-mono tracking-widest uppercase italic">СТАТУС_ВУЗЛА</span>
              <span className={cn(
                "text-[12px] font-black tracking-[0.3em] uppercase animate-pulse italic",
                status?.overall_status === 'optimal' ? "text-emerald-500" : "text-rose-500"
              )}>
                {status?.overall_status === 'optimal' ? 'АКТИВНИЙ_L7' : 'НЕСТАБІЛЬНИЙ'}
              </span>
           </div>
           <div className="w-[2px] h-12 bg-white/5" />
           <div className="flex flex-col items-end gap-1">
              <span className="text-white/10 text-[8px] font-black font-mono tracking-widest uppercase italic">СИЛА_СИГНАЛУ</span>
              <div className="flex gap-1 mt-1">
                 {[1,2,3,4,5,6].map(i => {
                    const isHealthy = status?.overall_status === 'optimal';
                    const threshold = isHealthy ? 5 : 2;
                    return (
                       <div key={i} className={cn(
                         "w-1.5 h-3 rounded-full transition-all duration-700 shadow-2xl", 
                         i <= threshold ? (isHealthy ? "bg-emerald-500 shadow-emerald-500/40" : "bg-rose-500 shadow-rose-500/40") : "bg-white/5"
                       )} />
                    );
                 })}
              </div>
           </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="relative flex items-center h-20 overflow-hidden bg-black/60 group/nav">
        <div 
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex items-center gap-0 px-4 overflow-x-auto no-scrollbar scroll-smooth flex-1 h-full"
        >
          {filteredTabs.map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'relative flex items-center whitespace-nowrap gap-6 px-12 py-5 text-[11px] font-black transition-all duration-700 uppercase tracking-[0.4em] group/tab h-full border-r border-white/5 italic',
                  active
                    ? 'text-rose-400 bg-white/[0.04]'
                    : 'text-white/30 hover:text-white/80 hover:bg-white/[0.02]',
                )}
              >
                {active && (
                  <>
                    <motion.div 
                      layoutId="activeTabUnderlineElite"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500 shadow-[0_0_30px_rgba(225,29,72,1)] z-10"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-rose-500/10 via-transparent to-transparent pointer-events-none" />
                  </>
                )}

                <div className={cn(
                  "p-3 rounded-xl transition-all duration-700 relative border-2",
                  active ? "bg-rose-500/20 border-rose-500/40 text-rose-500 shadow-rose-500/20 scale-110" : "text-white/10 border-white/5 group-hover/tab:text-white/50 group-hover/tab:border-white/10"
                )}>
                  {active && <div className="absolute inset-0 bg-rose-500/20 blur-xl animate-pulse" />}
                  <Icon className="w-5 h-5 relative z-10" />
                </div>
                
                <span className="relative z-10 glint-elite">{tab.label}</span>

                {tab.badge && (
                  <span className={cn(
                    'text-[9px] font-black font-mono px-3 py-1 rounded-lg tracking-widest transition-all duration-700 ml-2 italic shadow-2xl',
                    active 
                      ? 'text-white bg-rose-600 border border-rose-400/50' 
                      : 'text-white/20 bg-white/5 group-hover/tab:text-white/60',
                  )}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scroll gradients */}
        <div className={cn(
          "absolute left-0 top-0 bottom-0 w-48 bg-gradient-to-r from-black via-black/80 to-transparent z-10 pointer-events-none transition-opacity duration-700",
          canScrollLeft ? "opacity-100" : "opacity-0"
        )} />
        <div className={cn(
          "absolute right-0 top-0 bottom-0 w-48 bg-gradient-to-l from-black via-black/80 to-transparent z-10 pointer-events-none transition-opacity duration-700",
          canScrollRight ? "opacity-100" : "opacity-0"
        )} />
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

  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.component;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-black selection:bg-rose-500/30">
      <AdvancedBackground mode="sovereign" />
      <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />

      {/* Глобальний статус системи */}
      <SystemStatusHeader />

      {/* Навігація вкладок */}
      <TabNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Контент вкладки */}
      <div className="flex-1 overflow-auto relative custom-scrollbar pb-20">
        {/* Tactical UI Ornaments */}
        <div className="absolute top-10 left-10 flex flex-col gap-3 pointer-events-none opacity-40 z-0 font-black font-mono text-[9px] text-white/40 tracking-[0.4em] italic uppercase">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-[1px] bg-rose-500 shadow-[0_0_10px_rgba(225,29,72,1)]" />
            <span>ГЕО_ЛОКАЦІЯ: 50.4501° N, 30.5234° E</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-[1px] bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,1)]" />
            <span>ВІДСТЕЖЕННЯ_ВУЗЛА: 0x9F431B95-ELITE</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-[1px] bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]" />
            <span>СТАБІЛЬНІСТЬ_ЯДРА: WRAITH_v61.0_ELITE_СТАБІЛЬНО</span>
          </div>
          <div className="mt-4 flex gap-2">
            {Array.from({ length: 16 }).map((_, i) => (
              <motion.div 
                key={i}
                animate={{ opacity: [0.1, 0.6, 0.1] }}
                transition={{ duration: 2, delay: i * 0.1, repeat: Infinity }}
                className="w-[2px] h-6 bg-rose-500/20"
              />
            ))}
          </div>
        </div>
        
        <div className="absolute top-10 right-10 flex flex-col items-end gap-3 pointer-events-none opacity-40 z-0 font-black font-mono text-[9px] text-white/40 tracking-[0.4em] italic text-right uppercase">
          <span>СИНХРОНІЗАЦІЯ_ЗАТРИМКИ: 0.0014MS</span>
          <span>ВИХІДНИЙ_ПОТІК: 14.8 ГБ/С</span>
          <span>ВХІДНИЙ_ПОТІК: 8.2 ГБ/С</span>
          <div className="mt-4 w-48 h-[2px] bg-gradient-to-l from-rose-500/50 to-transparent rounded-full shadow-rose-500/20" />
          <span className="text-[7px] opacity-30 font-bold">ШИФР: CHACHA20-POLY1305_QUANTUM_L5</span>
        </div>

        <div className="relative z-10 h-full">
          <Suspense fallback={<TabLoader />}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 30, filter: 'blur(20px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -30, filter: 'blur(20px)' }}
                transition={{ duration: 0.6, ease: "circOut" }}
                className="h-full"
              >
                {ActiveComponent && <ActiveComponent />}
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
          .shadow-4xl { box-shadow: 0 60px 120px -30px rgba(0,0,0,0.9); }
          .glint-elite { text-shadow: 0 0 30px rgba(225,29,72,0.4); }
          .chromatic-elite { text-shadow: 2px 0 0 rgba(255,0,0,0.2), -2px 0 0 rgba(0,255,0,0.1); }
          .animate-spin-slow { animation: spin 20s linear infinite; }
          .animate-shimmer { animation: shimmer 2s linear infinite; }
          @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(225,29,72,0.1); border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(225,29,72,0.3); }
      `}} />
    </div>
  );
};

export default AdminHub;
