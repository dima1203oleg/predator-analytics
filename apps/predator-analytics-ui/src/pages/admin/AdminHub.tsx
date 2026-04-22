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
  Atom, Box, Boxes
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useSystemStatus, 
  useSystemStats, 
  useAgentsStats 
} from '@/hooks/useAdminApi';

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

// ─── Конфіг вкладок ───────────────────────────────────────────────────────────

type TabCategory = 'SYSTEM_CORE' | 'AI_LAB' | 'INTEL_OSINT' | 'PLATFORM';

interface TabConfig {
  id: string;
  category: TabCategory;
  label: string;
  badge?: string;
  icon: React.ElementType;
  component: React.LazyExoticComponent<React.FC>;
}

const TABS: TabConfig[] = [
  // ─── SYSTEM_CORE ───────────────────────────────────────────────────────────
  { id: 'command',      category: 'SYSTEM_CORE', label: 'Command Center', badge: 'SOVEREIGN', icon: Zap,           component: SovereignCommandCenter },
  { id: 'infra',        category: 'SYSTEM_CORE', label: 'Телеметрія',   badge: 'LIVE',     icon: Activity,      component: InfraTelemetryTab },
  { id: 'failover',     category: 'SYSTEM_CORE', label: 'Failover',                        icon: Network,       component: FailoverRoutingTab },
  { id: 'gitops',       category: 'SYSTEM_CORE', label: 'GitOps CI',                       icon: GitMerge,      component: GitOpsPipelineTab  },
  { id: 'agents-ops',   category: 'SYSTEM_CORE', label: 'Агенти',                          icon: Cpu,           component: AgentsOpsTab       },
  { id: 'security',     category: 'SYSTEM_CORE', label: 'Zero Trust',   badge: 'SEC',      icon: ShieldAlert,   component: ZeroTrustSecTab    },
  { id: 'dataops',      category: 'SYSTEM_CORE', label: 'DataOps',                         icon: Database,      component: DataOpsTab         },
  { id: 'chaos',        category: 'SYSTEM_CORE', label: 'Chaos Ops',    badge: 'HAZARD',   icon: Zap,           component: ChaosControlHub    },
  
  // ─── AI_LAB ────────────────────────────────────────────────────────────────
  { id: 'ai-control',   category: 'AI_LAB', label: 'AI Control',   badge: 'NEXUS',    icon: Zap,           component: AIControlPlane },
  { id: 'ai-insights',  category: 'AI_LAB', label: 'AI Insights',  badge: 'DEEP',     icon: BrainCircuit,  component: AIInsightsHub },
  { id: 'ai-engines',   category: 'AI_LAB', label: 'Двигуни ШІ',   badge: 'CORE',     icon: Cpu,           component: EnginesView },
  { id: 'llm-explorer', category: 'AI_LAB', label: 'LLM Провідник',                    icon: BookOpen,      component: LLMView },
  { id: 'factory',      category: 'AI_LAB', label: 'Завод ШІ',      badge: 'PROD',     icon: Factory,       component: SystemFactoryView  },
  { id: 'factory-studio', category: 'AI_LAB', label: 'Студія Заводу',  badge: 'DESIGN',   icon: Layers,        component: FactoryStudio },
  { id: 'auto-factory', category: 'AI_LAB', label: 'Авто-Фабрика',  badge: 'OODA',     icon: Sparkles,      component: AutoFactoryView },
  { id: 'models',       category: 'AI_LAB', label: 'Fine-Tune',    badge: 'ML',       icon: BrainCircuit,  component: ModelTrainingView  },
  { id: 'datasets',     category: 'AI_LAB', label: 'Датасети',      badge: 'DATA',     icon: HardDrive,     component: DatasetsStudioView },
  { id: 'prompts',      category: 'AI_LAB', label: 'Промпти',                         icon: MessageSquare, component: SystemPromptsView },
  { id: 'nas',          category: 'AI_LAB', label: 'Нейромережі',  badge: 'NAS',      icon: Cpu,           component: NasView },
  { id: 'forecast',     category: 'AI_LAB', label: 'Прогнози',      badge: 'MATH',     icon: TrendingUp,    component: ForecastView },
  { id: 'super-intel',  category: 'AI_LAB', label: 'SuperIntel',   badge: 'OMEGA',    icon: Zap,           component: SuperIntelligenceView },

  // ─── INTEL_OSINT ───────────────────────────────────────────────────────────
  { id: 'intel-hub',    category: 'INTEL_OSINT', label: 'Intel Hub',    badge: 'ORACLE',   icon: Network,       component: SovereignIntelHub },
  { id: 'nexus',        category: 'INTEL_OSINT', label: 'Nexus',        badge: 'PREDICT',  icon: Zap,           component: PredictiveNexusView },
  { id: 'hypothesis',   category: 'INTEL_OSINT', label: 'Гіпотези',                        icon: BrainCircuit,  component: HypothesisEngineView },
  { id: 'knowledge',    category: 'INTEL_OSINT', label: 'Знання',                         icon: BookOpen,      component: KnowledgeEngineeringView },
  { id: 'scenarios',    category: 'INTEL_OSINT', label: 'Сценарії',     badge: 'SIM',      icon: Layers,        component: ScenarioModelingView },
  { id: 'intelligence', category: 'INTEL_OSINT', label: 'Розвідка',     badge: 'WRAITH',   icon: Eye,           component: CustomsIntelligenceView },
  { id: 'fin-sigint',   category: 'INTEL_OSINT', label: 'Fin SIGINT',   badge: 'MONEY',    icon: BarChart3,     component: FinancialSigintView },
  { id: 'due-diligence', category: 'INTEL_OSINT', label: 'Due Diligence', badge: 'KYC',       icon: ShieldCheck,   component: DueDiligenceView },
  { id: 'timeline',     category: 'INTEL_OSINT', label: 'Хронограф',    badge: 'HIST',      icon: Activity,      component: TimelineBuilderView },
  { id: 'supply-chain', category: 'INTEL_OSINT', label: 'Ланцюги Поставок', badge: 'LOGISTICS', icon: Box,        component: SupplyChainAnalyticsView },
  { id: 'entity-resolver', category: 'INTEL_OSINT', label: 'Резолвер Сутностей', badge: 'MATCH', icon: Fingerprint, component: EntityResolverView },
  { id: 'clients',      category: 'INTEL_OSINT', label: 'Хаб Клієнтів', badge: 'CRM',       icon: Globe,         component: ClientsHubView },
  { id: 'fin-dashboard', category: 'INTEL_OSINT', label: 'Фінансовий Дашборд', badge: 'TREASURY', icon: BarChart3, component: FinancialDashboard },
  { id: 'market-intel', category: 'INTEL_OSINT', label: 'Аналіз Ринку',  badge: 'MARKET',   icon: Globe,         component: MarketOverviewTab },
  { id: 'geo-radar',    category: 'INTEL_OSINT', label: 'Гео-Радар',    badge: 'GLOBE',    icon: Globe,         component: GeopoliticalRadarView },
  { id: 'ubo-map',      category: 'INTEL_OSINT', label: 'Мапа UBO',     badge: 'ENTITIES', icon: Share2,        component: UBOMapView },
  { id: 'entity-radar', category: 'INTEL_OSINT', label: 'Радар Об\'єктів', badge: 'TRACK',    icon: Target,        component: EntityRadarView },
  { id: 'evolution',    category: 'INTEL_OSINT', label: 'Еволюція',     badge: 'AGENT',    icon: TrendingUp,    component: EvolutionView },
  { id: 'osint',        category: 'INTEL_OSINT', label: 'OSINT Консоль', badge: 'SEARCH',   icon: Search,        component: SearchConsole },
  { id: 'zrada',        category: 'INTEL_OSINT', label: 'Zrada Control', badge: 'ELITE',    icon: ShieldAlert,   component: ZradaControlView },
  { id: 'aml',          category: 'INTEL_OSINT', label: 'AML Scoring',   badge: 'RISK',     icon: Activity,      component: AMLScoringView },
  { id: 'sanctions',    category: 'INTEL_OSINT', label: 'Санкції',       badge: 'GLOBAL',   icon: Lock,          component: SanctionsScreening },
  { id: 'conv-intel',   category: 'INTEL_OSINT', label: 'Соц. Розвідка', badge: 'SOCIAL',   icon: MessageSquare, component: ConversationIntelView },
  { id: 'maritime',     category: 'INTEL_OSINT', label: 'Морський Трек', badge: 'VESSEL',   icon: Anchor,        component: MaritimeView },
  { id: 'tenders',      category: 'INTEL_OSINT', label: 'Тендери',      badge: 'PROZORRO', icon: FileText,      component: TendersView },
  { id: 'registries',   category: 'INTEL_OSINT', label: 'Реєстри',      badge: 'DB',       icon: Database,      component: RegistriesView },
  { id: 'open-data',    category: 'INTEL_OSINT', label: 'Відкриті Дані', badge: 'GOV',      icon: Globe,         component: DataGovView },
  
  // ─── PLATFORM ──────────────────────────────────────────────────────────────
  { id: 'settings',     category: 'PLATFORM', label: 'Налаштування',                    icon: Settings,      component: SettingsView },
  { id: 'alerts-system', category: 'PLATFORM', label: 'Системні Сповіщення', badge: 'LOG', icon: AlertTriangle, component: lazy(() => import('@/features/alerts/AlertCenterView')) },
  { id: 'decisions',    category: 'PLATFORM', label: 'Журнал Рішень',    badge: 'AUDIT',    icon: FileText,      component: lazy(() => import('@/features/decisions/DecisionsJournal')) },
  { id: 'logs',         category: 'PLATFORM', label: 'Системні Логи',    badge: 'RAW',      icon: Terminal,      component: lazy(() => import('@/features/monitoring/RealTimeMonitor')) },
];

const DEFAULT_TAB = 'command';

// ─── HeartbeatLine Component ──────────────────────────────────────────────────

const HeartbeatLine: React.FC<{ color?: string }> = ({ color = 'rose' }) => {
  return (
    <div className="flex items-end gap-[1px] h-4 w-12 px-1">
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ 
            height: [
              `${20 + Math.random() * 30}%`, 
              `${50 + Math.random() * 50}%`, 
              `${20 + Math.random() * 30}%`
            ] 
          }}
          transition={{ 
            duration: 0.5 + Math.random() * 0.5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className={cn(
            "w-[2px] rounded-full",
            color === 'rose' ? "bg-rose-500/40" : "bg-emerald-500/40"
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
  
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const vramUsed = stats?.gpu_mem_used ?? 0;
  const vramTotal = stats?.gpu_mem_total || 8.0;
  const cpuPercent = stats?.cpu_percent ?? 0;
  const agentsCount = agentsData?.stats.total ?? 0;
  const healthyCount = status?.summary.healthy ?? 0;
  const totalServices = status?.summary.total ?? 1;
  const healthPercent = (healthyCount / totalServices) * 100;
  
  // Threat level simulation based on entropy or real metrics if available
  // Here we use a stable metric or derived from system status
  const threatLevel = status?.overall_status === 'optimal' ? 12 : 45;
  const entropy = (stats?.memory_percent ?? 42) / 100;

  const isCritical = vramUsed > (vramTotal * 0.95);
  const isHybrid = vramUsed > (vramTotal * 0.75) && !isCritical;

  return (
    <div className="flex flex-col bg-[#020202] border-b border-white/10 relative overflow-hidden group select-none">
      {/* Background Glows & Tactical Overlays */}
      <div className="absolute top-0 left-1/4 w-[500px] h-32 bg-rose-500/[0.07] blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute top-0 right-1/4 w-[500px] h-32 bg-blue-500/[0.07] blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-noise" />

      {/* Dynamic Scan Line */}
      <motion.div 
        initial={{ left: '-100%' }}
        animate={{ left: '200%' }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 bottom-0 w-[800px] bg-gradient-to-r from-transparent via-rose-500/[0.08] to-transparent pointer-events-none z-0"
      />

      {/* Top Border Accent */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-rose-500/40 to-transparent shadow-[0_0_15px_rgba(225,29,72,0.5)]" />

      <div className="flex items-center justify-between px-8 py-4 text-[9px] font-mono tracking-[0.2em] uppercase z-10">
        <div className="flex items-center gap-12">
          {/* System Identity with Radar-like effect */}
          <div className="flex items-center gap-6 relative">
            <div className="relative group/logo cursor-none">
              <div className="absolute inset-0 bg-rose-500/30 blur-2xl rounded-full scale-0 group-hover/logo:scale-150 transition-transform duration-1000" />
              
              {/* Radar Circles */}
              <div className="absolute -inset-4 border border-rose-500/10 rounded-full animate-ping pointer-events-none" style={{ animationDuration: '3s' }} />
              <div className="absolute -inset-8 border border-rose-500/5 rounded-full animate-ping pointer-events-none" style={{ animationDuration: '5s' }} />
              
              <div className="flex flex-col relative">
                <div className="flex items-center gap-2 mb-1.5">
                  <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-1.5 h-1.5 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(225,29,72,1)]" 
                  />
                  <span className="text-white/40 text-[7px] leading-none tracking-[0.5em] font-black">СУВЕРЕННИЙ ХАБ</span>
                </div>
                <span className="flex items-center gap-3 text-rose-500 font-black tracking-[0.5em] text-[13px] drop-shadow-[0_0_10px_rgba(225,29,72,0.4)]">
                  <Atom size={16} className="animate-spin-slow text-rose-400" style={{ animationDuration: '12s' }} />
                  PREDATOR v60.0-ELITE
                </span>
              </div>
            </div>
            
            <div className="flex flex-col border-l border-white/10 pl-8 h-12 justify-center">
              <span className="text-white/20 text-[7px] leading-none mb-2 tracking-[0.4em] font-bold uppercase">Стан Архітектури</span>
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center">
                  <div className={cn(
                    "w-3 h-3 rounded-full shadow-[0_0_20px]",
                    isCritical ? "bg-blue-500 shadow-blue-500/80" : isHybrid ? "bg-emerald-500 shadow-emerald-500/80" : "bg-rose-500 shadow-rose-500/80"
                  )} />
                  <motion.div 
                    animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className={cn(
                      "absolute inset-0 rounded-full",
                      isCritical ? "bg-blue-500" : isHybrid ? "bg-emerald-500" : "bg-rose-500"
                    )} 
                  />
                </div>
                <div className="flex flex-col">
                  <span className={cn(
                    "font-black tracking-[0.25em] text-[11px]",
                    isCritical ? "text-blue-400" : isHybrid ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {isCritical ? "CLOUD OVERRIDE" : isHybrid ? "HYBRID SOVEREIGN" : "LOCAL SOVEREIGN"}
                  </span>
                  <span className="text-white/10 text-[6px] tracking-[0.2em] mt-0.5 uppercase">VRAM ALLOC: {vramUsed.toFixed(1)} GB / {vramTotal.toFixed(1)} GB | {isCritical ? 'EXTERNAL_COMPUTE' : 'LOCAL_ONLY'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Telemetry Grid */}
          <div className="flex items-center gap-10 border-l border-white/10 pl-10 h-12">
            <div className="flex items-center gap-6 group/stat">
              <div className="flex flex-col gap-2 min-w-[140px]">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-white/20 text-[7px] group-hover/stat:text-rose-500 transition-colors tracking-widest font-bold">NEURAL LOAD</span>
                    <span className="text-white/10 text-[5px] tracking-widest leading-none mt-0.5 text-right">WEIGHT_SYMBOLS_ACTIVE</span>
                  </div>
                  <span className={cn("font-black text-[12px] tracking-tighter italic", cpuPercent > 80 ? "text-rose-500" : "text-white/80")}>
                    {cpuPercent.toFixed(1)}%
                  </span>
                </div>
                <div className="h-[5px] bg-white/[0.03] rounded-full overflow-hidden p-[1px] border border-white/[0.05]">
                  <motion.div 
                    animate={{ width: `${cpuPercent}%`, backgroundColor: cpuPercent > 80 ? '#f43f5e' : '#e11d4880' }}
                    className="h-full rounded-full shadow-[0_0_12px_rgba(225,29,72,0.5)] relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                  </motion.div>
                </div>
              </div>
              <HeartbeatLine />
            </div>

            <div className="flex items-center gap-6 group/stat">
              <div className="flex flex-col gap-2 min-w-[140px]">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-white/20 text-[7px] group-hover/stat:text-emerald-500 transition-colors tracking-widest font-bold">ENTROPY LEVEL</span>
                    <span className="text-white/10 text-[5px] tracking-widest leading-none mt-0.5 text-right">SYNC_PHASE_LOCKED</span>
                  </div>
                  <span className="text-emerald-400 font-black text-[12px] tracking-tighter italic">{entropy.toFixed(3)}</span>
                </div>
                <div className="h-[5px] bg-white/[0.03] rounded-full overflow-hidden p-[1px] border border-white/[0.05]">
                  <motion.div 
                    animate={{ width: `${entropy * 100}%` }}
                    className="h-full bg-emerald-500/50 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)] relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                  </motion.div>
                </div>
              </div>
              <HeartbeatLine color="emerald" />
            </div>

            <div className="flex flex-col border-l border-white/10 pl-10 h-10 justify-center">
              <span className="text-white/20 text-[7px] leading-none mb-2 tracking-[0.3em] font-bold">АКТИВНІ ВУЗЛИ</span>
              <div className="flex items-center gap-4">
                <Radio size={16} className="text-rose-500/60 animate-pulse" />
                <div className="flex flex-col">
                  <span className="text-rose-500 font-black text-[14px] leading-none tracking-tighter italic">
                    {agentsCount.toString().padStart(2, '0')} <span className="text-[8px] opacity-40 not-italic ml-1">NODES</span>
                  </span>
                  <span className="text-white/10 text-[6px] tracking-widest mt-1">LATENCY: {status?.services[0]?.latency_ms ?? 0}ms</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col border-l border-white/10 pl-10 h-10 justify-center group/threat">
              <span className="text-white/20 text-[7px] leading-none mb-2 tracking-[0.3em] font-bold group-hover/threat:text-rose-500 transition-colors">THREAT LEVEL</span>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <ShieldAlert size={18} className={cn("transition-all duration-500", threatLevel > 70 ? "text-rose-500 drop-shadow-[0_0_8px_rgba(225,29,72,0.8)] scale-110" : "text-white/20")} />
                  {threatLevel > 70 && <motion.div animate={{ scale: [1, 1.5], opacity: [0.5, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="absolute inset-0 bg-rose-500 rounded-full blur-md" />}
                </div>
                <div className="flex flex-col">
                  <span className={cn("font-black text-[14px] tracking-tighter italic leading-none", threatLevel > 70 ? "text-rose-500" : "text-white/60")}>
                    {threatLevel.toFixed(0)}% <span className="text-[8px] opacity-40 ml-1">RISK</span>
                  </span>
                  <span className="text-white/10 text-[6px] tracking-widest mt-1 uppercase">{threatLevel > 70 ? 'High Alert' : 'Operational'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="flex flex-col items-end border-r border-white/10 pr-10">
            <span className="text-white/20 text-[7px] leading-none mb-1.5 tracking-widest font-black uppercase">SYSTEM_TIME_UTC</span>
            <span className="text-white/90 font-mono tracking-[0.35em] text-[14px] font-black italic">
              {time.toLocaleTimeString('uk-UA', { hour12: false })}
              <span className="text-[9px] opacity-20 ml-1 ml-2">[{time.getMilliseconds().toString().padStart(3, '0')}]</span>
            </span>
          </div>
          
          <div className="flex items-center gap-6 bg-rose-500/5 px-8 py-3 rounded-sm border border-rose-500/20 group-hover:border-rose-500/60 transition-all duration-1000 hover:bg-rose-500/10 cursor-crosshair relative group/secured">
             {/* Corner Ornaments */}
             <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-rose-500/40 group-hover/secured:border-rose-500 transition-colors" />
             <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-rose-500/40 group-hover/secured:border-rose-500 transition-colors" />
             <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-rose-500/40 group-hover/secured:border-rose-500 transition-colors" />
             <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-rose-500/40 group-hover/secured:border-rose-500 transition-colors" />
             
            <div className="relative flex items-center justify-center scale-110">
              <div className="w-4 h-4 rounded-full bg-rose-500 animate-ping absolute opacity-40" />
              <div className="w-4 h-4 rounded-full bg-rose-500 relative shadow-[0_0_20px_rgba(225,29,72,1)] flex items-center justify-center">
                <Shield size={8} className="text-black" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-rose-500 font-black text-[13px] leading-none tracking-[0.2em]">SECURED</span>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex gap-0.5">
                  {[1,2,3,4].map(i => <div key={i} className="w-[3px] h-[3px] bg-rose-500/60 rounded-full" />)}
                </div>
                <span className="text-white/30 text-[7px] tracking-[0.4em] font-black">X-QUANTUM_L5</span>
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
  <div className="flex flex-col items-center justify-center h-full min-h-[500px] gap-8 bg-[#050202] relative overflow-hidden">
    {/* Matrix-like background numbers/data */}
    <div className="absolute inset-0 pointer-events-none opacity-[0.03] font-mono text-[8px] flex flex-wrap gap-4 overflow-hidden p-4">
      {Array.from({ length: 100 }).map((_, i) => (
        <span key={i}>{Math.random().toString(16).substring(2, 10).toUpperCase()}</span>
      ))}
    </div>

    <div className="relative">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="w-32 h-32 border border-rose-500/10 rounded-full"
      />
      <motion.div 
        animate={{ rotate: -360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute inset-2 border border-dashed border-rose-500/20 rounded-full"
      />
      
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-20 h-20 bg-rose-500/5 rounded-full flex items-center justify-center relative overflow-hidden border border-rose-500/10">
          <motion.div 
            initial={{ y: -100 }}
            animate={{ y: 100 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-[1px] bg-rose-500 shadow-[0_0_15px_rgba(225,29,72,1)]"
          />
          <Atom className="w-8 h-8 text-rose-500/40 animate-spin" strokeWidth={1} />
        </div>
      </div>
    </div>

    <div className="flex flex-col items-center gap-6 z-10">
      <div className="flex flex-col items-center gap-1">
        <motion.span 
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-[12px] font-mono font-black uppercase tracking-[0.5em] text-rose-500"
        >
          Initializing Module
        </motion.span>
        <div className="h-[2px] w-48 bg-white/5 relative overflow-hidden rounded-full">
          <motion.div 
            initial={{ left: '-100%' }}
            animate={{ left: '100%' }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 bottom-0 w-1/2 bg-rose-500 shadow-[0_0_10px_rgba(225,29,72,1)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-12 gap-y-2 opacity-30 max-w-sm">
        {[
          "NEURAL_CONNECT: ESTABLISHED",
          "CORE_HANDSHAKE: SUCCESS",
          "DECRYPT_LAYER: LEVEL_7",
          "SOVEREIGN_AUTH: VERIFIED",
          "VRAM_ALLOCATION: OPTIMIZED",
          "UBO_MAP_SYNC: ACTIVE"
        ].map((text, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-1 h-1 bg-rose-500 rounded-full" />
            <span className="text-[7px] font-mono text-white whitespace-nowrap">{text}</span>
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
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  const activeTabConfig = TABS.find(t => t.id === activeTab);
  const [selectedCategory, setSelectedCategory] = React.useState<TabCategory>(
    activeTabConfig?.category ?? 'SYSTEM_CORE'
  );

  const CATEGORIES: { id: TabCategory; label: string; subLabel: string; icon: any; color: string }[] = [
    { id: 'SYSTEM_CORE', label: 'Ядро Системи', subLabel: 'Інфраструктура & Моніторинг', icon: Shield, color: 'rose' },
    { id: 'AI_LAB',      label: 'AI Лабораторія', subLabel: 'Навчання & Автозавод', icon: BrainCircuit, color: 'rose' },
    { id: 'INTEL_OSINT', label: 'Розвідка & OSINT', subLabel: 'Глобальний Аналіз', icon: Eye, color: 'rose' },
    { id: 'PLATFORM',    label: 'Платформа', subLabel: 'Налаштування & Аудит', icon: Settings, color: 'rose' },
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
    <div className="flex flex-col bg-[#050202] border-b border-white/[0.08] z-20 sticky top-0 shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
      {/* Category Selector */}
      <div className="flex items-center gap-1 px-8 py-0 border-b border-white/[0.03] bg-black/80 backdrop-blur-3xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-rose-500/[0.05] via-transparent to-transparent pointer-events-none" />
        
        {CATEGORIES.map(cat => {
          const isActive = selectedCategory === cat.id;
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "flex flex-col items-start gap-1 px-8 py-5 transition-all relative group overflow-hidden border-r border-white/[0.03] min-w-[220px]",
                isActive 
                  ? "text-rose-500" 
                  : "text-white/20 hover:text-white/50"
              )}
            >
              {isActive && (
                <>
                  <motion.div 
                    layoutId="activeCategoryBg"
                    className="absolute inset-0 bg-rose-500/[0.07] z-0"
                  />
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.8)]" />
                </>
              )}
              <div className="flex items-center gap-3 relative z-10">
                <Icon size={16} className={cn("transition-all duration-500", isActive ? "text-rose-500 scale-110 drop-shadow-[0_0_8px_rgba(225,29,72,0.5)]" : "text-white/10 group-hover:text-white/30")} />
                <span className="text-[11px] font-black uppercase tracking-[0.25em]">{cat.label}</span>
              </div>
              <span className={cn(
                "text-[7px] font-mono uppercase tracking-[0.3em] transition-colors relative z-10",
                isActive ? "text-rose-500/60" : "text-white/10"
              )}>
                {cat.subLabel}
              </span>
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-6 pr-4">
           <div className="flex flex-col items-end">
              <span className="text-white/10 text-[7px] font-mono tracking-widest uppercase">Node Status</span>
              <span className="text-emerald-500 text-[10px] font-black tracking-widest uppercase animate-pulse">Online</span>
           </div>
           <div className="w-[1px] h-8 bg-white/5" />
           <div className="flex flex-col items-end">
              <span className="text-white/10 text-[7px] font-mono tracking-widest uppercase">Signal Strength</span>
              <div className="flex gap-0.5 mt-1">
                 {[1,2,3,4,5].map(i => (
                    <div key={i} className={cn("w-1 h-2 rounded-full", i <= 4 ? "bg-rose-500/60 shadow-[0_0_5px_rgba(225,29,72,0.4)]" : "bg-white/5")} />
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="relative flex items-center h-16 overflow-hidden bg-black/60 group/nav">
        <div 
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex items-center gap-0 px-2 overflow-x-auto no-scrollbar scroll-smooth flex-1 h-full"
        >
          {filteredTabs.map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'relative flex items-center whitespace-nowrap gap-5 px-10 py-4 text-[10px] font-mono transition-all duration-500 uppercase tracking-[0.35em] group/tab h-full border-r border-white/[0.03]',
                  active
                    ? 'text-rose-400 bg-white/[0.04]'
                    : 'text-white/30 hover:text-white/80 hover:bg-white/[0.02]',
                )}
              >
                {active && (
                  <>
                    <motion.div 
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-[3px] bg-rose-500 shadow-[0_0_20px_rgba(225,29,72,1)] z-10"
                    />
                    <div className="absolute top-0 left-0 right-0 bottom-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-rose-500/[0.12] via-transparent to-transparent pointer-events-none" />
                  </>
                )}

                <div className={cn(
                  "p-2 rounded-sm transition-all duration-700 relative",
                  active ? "bg-rose-500/20 text-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.3)] scale-110" : "text-white/10 group-hover/tab:text-white/50"
                )}>
                  {active && <div className="absolute inset-0 bg-rose-500/20 blur-md animate-pulse" />}
                  <Icon className="w-4 h-4 relative z-10" />
                </div>
                
                <span className="relative z-10 font-black">{tab.label}</span>

                {tab.badge && (
                  <span className={cn(
                    'text-[8px] font-mono font-black px-2 py-0.5 rounded-sm tracking-tighter transition-all duration-700 ml-2',
                    active 
                      ? 'text-white bg-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.5)]' 
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
          "absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#050202] via-[#050202]/80 to-transparent z-10 pointer-events-none transition-opacity duration-500",
          canScrollLeft ? "opacity-100" : "opacity-0"
        )} />
        <div className={cn(
          "absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#050202] via-[#050202]/80 to-transparent z-10 pointer-events-none transition-opacity duration-500",
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
    <div className="flex flex-col h-full overflow-hidden bg-[#050202] selection:bg-rose-500/30">
      {/* Background Grid & Scanline */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]" />
        <motion.div 
          initial={{ top: '-10%' }}
          animate={{ top: '110%' }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500/10 to-transparent blur-sm"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,#050202_80%)]" />
      </div>

      {/* Глобальний статус системи */}
      <SystemStatusHeader />

      {/* Навігація вкладок */}
      <TabNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Контент вкладки */}
      <div className="flex-1 overflow-auto relative custom-scrollbar">
        {/* Tactical UI Ornaments */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 pointer-events-none opacity-40 z-0 font-mono text-[8px] text-white/40 tracking-widest">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-[1px] bg-rose-500 animate-pulse" />
            <span>GEO_LOC: 50.4501° N, 30.5234° E</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-[1px] bg-blue-500 animate-pulse" />
            <span>NODE_TRK: 0x9F431B95-ELITE</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-[1px] bg-emerald-500 animate-pulse" />
            <span>KERN_STB: WRAITH_v58.2_STABLE</span>
          </div>
          <div className="mt-2 flex gap-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div 
                key={i}
                animate={{ opacity: [0.1, 0.5, 0.1] }}
                transition={{ duration: 1.5, delay: i * 0.1, repeat: Infinity }}
                className="w-[2px] h-4 bg-rose-500/20"
              />
            ))}
          </div>
        </div>
        
        <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5 pointer-events-none opacity-40 z-0 font-mono text-[8px] text-white/40 tracking-widest text-right">
          <span>LATENCY_SYNC: 0.0014ms</span>
          <span>UPSTREAM_BW: 14.8 GB/s</span>
          <span>DOWNSTREAM_BW: 8.2 GB/s</span>
          <div className="mt-2 w-32 h-[1px] bg-gradient-to-l from-rose-500/50 to-transparent" />
          <span className="text-[6px] opacity-20">CIPHER: CHACHA20-POLY1305</span>
        </div>

        <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 pointer-events-none opacity-40 z-0 font-mono text-[8px] text-white/40 tracking-widest">
          <span>BUFF_SIZE: 16384KB</span>
          <span>PKT_DROP_RATE: 0.0000%</span>
          <span>CRYPTO_STRENGTH: 512-BIT</span>
          <div className="flex gap-1 mt-1">
            {[1,2,3,4,5,6].map(i => <div key={i} className="w-2 h-[2px] bg-rose-500/20" />)}
          </div>
        </div>
        
        <div className="absolute bottom-4 right-4 flex flex-col items-end gap-1.5 pointer-events-none opacity-40 z-0 font-mono text-[8px] text-white/40 tracking-widest text-right">
          <div className="flex gap-2 mb-2 items-end h-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div 
                key={i}
                animate={{ height: [4, 24, 4] }}
                transition={{ duration: 1.5 + Math.random(), repeat: Infinity }}
                className="w-[1px] bg-rose-500/40"
              />
            ))}
          </div>
          <span className="text-rose-500/60 font-black tracking-[0.3em]">SOVEREIGN_OS_READY</span>
          <span>PREDATOR_ANALYTICS_V60.0_ELITE</span>
        </div>

        <div className="relative z-10 h-full">
          <Suspense fallback={<TabLoader />}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="h-full"
              >
                {ActiveComponent && <ActiveComponent />}
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(225,29,72,0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(225,29,72,0.4); }
      `}} />
    </div>
  );
};

export default AdminHub;
