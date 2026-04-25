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
const ExecutiveBrief           = lazy(() => import('@/components/dashboard/ExecutiveBrief').then(m => ({ default: m.ExecutiveBrief })));

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
  { id: 'brief',        category: 'BUSINESS_INTEL', label: 'Ранковий звіт', badge: 'CEO',      icon: TrendingUp,    component: ExecutiveBrief },

  // ─── SYSTEM_CORE ───────────────────────────────────────────────────────────
  { id: 'command',      category: 'SYSTEM_CORE', label: 'Командний центр', badge: 'SOVEREIGN', icon: Zap,           component: SovereignCommandCenter },
  { id: 'infra',        category: 'SYSTEM_CORE', label: 'Телеметрія',   badge: 'LIVE',     icon: Activity,      component: InfraTelemetryTab },
  { id: 'failover',     category: 'SYSTEM_CORE', label: 'Резервування',                    icon: Network,       component: FailoverRoutingTab },
  { id: 'gitops',       category: 'SYSTEM_CORE', label: 'GitOps CI',                       icon: GitMerge,      component: GitOpsPipelineTab  },
  { id: 'agents-ops',   category: 'SYSTEM_CORE', label: 'Агенти',                          icon: Cpu,           component: AgentsOpsTab       },
  { id: 'security',     category: 'SYSTEM_CORE', label: 'Нульова довіра',   badge: 'SEC',      icon: ShieldAlert,   component: ZeroTrustSecTab    },
  { id: 'dataops',      category: 'SYSTEM_CORE', label: 'DataOps',                         icon: Database,      component: DataOpsTab         },
  { id: 'chaos',        category: 'SYSTEM_CORE', label: 'Chaos Ops',    badge: 'HAZARD',   icon: Zap,           component: ChaosControlHub    },
  
  // ─── AI_LAB ────────────────────────────────────────────────────────────────
  { id: 'ai-control',   category: 'AI_LAB', label: 'Керування ШІ',   badge: 'NEXUS',    icon: Zap,           component: AIControlPlane },
  { id: 'ai-insights',  category: 'AI_LAB', label: 'Аналітика ШІ',  badge: 'DEEP',     icon: BrainCircuit,  component: AIInsightsHub },
  { id: 'ai-engines',   category: 'AI_LAB', label: 'Двигуни ШІ',   badge: 'CORE',     icon: Cpu,           component: EnginesView },
  { id: 'llm-explorer', category: 'AI_LAB', label: 'LLM Провідник',                    icon: BookOpen,      component: LLMView },
  { id: 'factory',      category: 'AI_LAB', label: 'Завод ШІ',      badge: 'PROD',     icon: Factory,       component: SystemFactoryView  },
  { id: 'factory-studio', category: 'AI_LAB', label: 'Студія Заводу',  badge: 'DESIGN',   icon: Layers,        component: FactoryStudio },
  { id: 'auto-factory', category: 'AI_LAB', label: 'Авто-Фабрика',  badge: 'OODA',     icon: Sparkles,      component: AutoFactoryView },
  { id: 'models',       category: 'AI_LAB', label: 'Донавчання',    badge: 'ML',       icon: BrainCircuit,  component: ModelTrainingView  },
  { id: 'datasets',     category: 'AI_LAB', label: 'Датасети',      badge: 'DATA',     icon: HardDrive,     component: DatasetsStudioView },
  { id: 'prompts',      category: 'AI_LAB', label: 'Промпти',                         icon: MessageSquare, component: SystemPromptsView },
  { id: 'nas',          category: 'AI_LAB', label: 'Нейромережі',  badge: 'NAS',      icon: Cpu,           component: NasView },
  { id: 'forecast',     category: 'AI_LAB', label: 'Прогнози',      badge: 'MATH',     icon: TrendingUp,    component: ForecastView },
  { id: 'super-intel',  category: 'AI_LAB', label: 'СуперІнтелект',   badge: 'OMEGA',    icon: Zap,           component: SuperIntelligenceView },

  // ─── INTEL_OSINT ───────────────────────────────────────────────────────────
  { id: 'intel-hub',    category: 'INTEL_OSINT', label: 'Хаб Розвідки',    badge: 'ORACLE',   icon: Network,       component: SovereignIntelHub },
  { id: 'nexus',        category: 'INTEL_OSINT', label: 'Нексус',        badge: 'PREDICT',  icon: Zap,           component: PredictiveNexusView },
  { id: 'hypothesis',   category: 'INTEL_OSINT', label: 'Гіпотези',                        icon: BrainCircuit,  component: HypothesisEngineView },
  { id: 'knowledge',    category: 'INTEL_OSINT', label: 'Знання',                         icon: BookOpen,      component: KnowledgeEngineeringView },
  { id: 'scenarios',    category: 'INTEL_OSINT', label: 'Сценарії',     badge: 'SIM',      icon: Layers,        component: ScenarioModelingView },
  { id: 'intelligence', category: 'INTEL_OSINT', label: 'Розвідка',     badge: 'WRAITH',   icon: Eye,           component: CustomsIntelligenceView },
  { id: 'fin-sigint',   category: 'INTEL_OSINT', label: 'Фін. SIGINT',   badge: 'MONEY',    icon: BarChart3,     component: FinancialSigintView },
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
  { id: 'osint',        category: 'INTEL_OSINT', label: 'OSINT Консоль', badge: 'ПОШУК',    icon: Search,        component: SearchConsole },
  { id: 'zrada',        category: 'INTEL_OSINT', label: 'Контроль Зради', badge: 'ELITE',    icon: ShieldAlert,   component: ZradaControlView },
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

const DEFAULT_TAB = 'brief';

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
  
  const threatLevel = status?.overall_status === 'optimal' ? 12 : 45;
  const entropy = (stats?.memory_percent ?? 42) / 100;

  const isCritical = vramUsed > (vramTotal * 0.95);
  const isHybrid = vramUsed > (vramTotal * 0.75) && !isCritical;

  return (
    <div className="flex flex-col bg-black/40 glass-wraith border-b border-white/10 relative overflow-hidden group select-none z-30 backdrop-blur-3xl">
      {/* Background Glows & Tactical Overlays */}
      <div className="absolute top-0 left-1/4 w-[600px] h-32 bg-rose-500/[0.1] blur-[150px] pointer-events-none animate-pulse" />
      <div className="absolute top-0 right-1/4 w-[600px] h-32 bg-rose-900/[0.08] blur-[150px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-noise" />
      <div className="absolute inset-0 cyber-scan-grid opacity-[0.03] pointer-events-none" />

      {/* Dynamic Scan Line */}
      <motion.div 
        initial={{ left: '-100%' }}
        animate={{ left: '200%' }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 bottom-0 w-[1000px] bg-gradient-to-r from-transparent via-rose-500/[0.1] to-transparent pointer-events-none z-0"
      />

      {/* Top Border Accent */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-rose-500/50 to-transparent shadow-[0_0_20px_rgba(225,29,72,0.6)]" />

      <div className="flex items-center justify-between px-10 py-5 text-[10px] font-mono tracking-[0.2em] uppercase z-10 relative">
        <div className="flex items-center gap-14">
          {/* System Identity with Radar-like effect */}
          <div className="flex items-center gap-8 relative">
            <div className="relative group/logo cursor-none">
              <div className="absolute -inset-10 bg-rose-500/20 blur-3xl rounded-full scale-0 group-hover/logo:scale-150 transition-transform duration-1000 opacity-0 group-hover/logo:opacity-100" />
              
              {/* Radar Circles */}
              <div className="absolute -inset-6 border border-rose-500/15 rounded-full animate-ping pointer-events-none" style={{ animationDuration: '4s' }} />
              <div className="absolute -inset-12 border border-rose-500/10 rounded-full animate-ping pointer-events-none" style={{ animationDuration: '6s' }} />
              
              <div className="flex flex-col relative">
                <div className="flex items-center gap-3 mb-2">
                  <motion.div 
                    animate={{ scale: [1, 1.8, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_15px_rgba(225,29,72,1)]" 
                  />
                  <span className="text-white/40 text-[8px] leading-none tracking-[0.6em] font-black italic">СУВЕРЕННИЙ_ХАБ_ОМЕГА</span>
                </div>
                <span className="flex items-center gap-4 text-white font-black tracking-[0.4em] text-[15px] italic glint-elite chromatic-elite">
                   <Atom size={20} className="animate-spin-slow text-rose-500" style={{ animationDuration: '15s' }} />
                   PREDATOR <span className="text-rose-500">v60.0-ELITE</span>
                </span>
              </div>
            </div>
            
            <div className="flex flex-col border-l border-white/10 pl-10 h-14 justify-center">
              <span className="text-white/20 text-[8px] leading-none mb-2.5 tracking-[0.4em] font-black uppercase italic">АРХІТЕКТУРА_СИСТЕМИ</span>
              <div className="flex items-center gap-5">
                <div className="relative flex items-center justify-center">
                  <div className={cn(
                    "w-3.5 h-3.5 rounded-full shadow-[0_0_25px]",
                    isCritical ? "bg-blue-500 shadow-blue-500/80" : isHybrid ? "bg-emerald-500 shadow-emerald-500/80" : "bg-rose-500 shadow-rose-500/80"
                  )} />
                  <motion.div 
                    animate={{ scale: [1, 3], opacity: [0.5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={cn(
                      "absolute inset-0 rounded-full",
                      isCritical ? "bg-blue-500" : isHybrid ? "bg-emerald-500" : "bg-rose-500"
                    )} 
                  />
                </div>
                <div className="flex flex-col">
                  <span className={cn(
                    "font-black tracking-[0.3em] text-[12px] italic",
                    isCritical ? "text-blue-400" : isHybrid ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {isCritical ? "ХМАРНЕ_ПЕРЕКЛЮЧЕННЯ" : isHybrid ? "ГІБРИДНИЙ_СУВЕРЕН" : "ЛОКАЛЬНИЙ_СУВЕРЕН"}
                  </span>
                  <span className="text-white/10 text-[7px] tracking-[0.25em] mt-1.5 uppercase font-bold">ВІДЕОПАМ'ЯТЬ: {vramUsed.toFixed(1)}ГБ / {vramTotal.toFixed(1)}ГБ • {isCritical ? 'ЗОВНІШНІЙ_КЛАСТЕР' : 'ЛОКАЛЬНИЙ_НЕЙРОВУЗОЛ'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Telemetry Grid */}
          <div className="flex items-center gap-12 border-l border-white/10 pl-12 h-14">
            <div className="flex items-center gap-8 group/stat">
              <div className="flex flex-col gap-2.5 min-w-[160px]">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-white/20 text-[8px] group-hover/stat:text-rose-500 transition-colors tracking-widest font-black italic">НЕЙРОННЕ_НАВАНТАЖЕННЯ</span>
                    <span className="text-white/10 text-[6px] tracking-widest leading-none mt-1 uppercase font-bold">АКТИВНІ_ВАГИ</span>
                  </div>
                  <span className={cn("font-black text-[14px] tracking-tighter italic", cpuPercent > 80 ? "text-rose-500" : "text-white/90")}>
                    {cpuPercent.toFixed(1)}%
                  </span>
                </div>
                <div className="h-[6px] bg-white/[0.03] rounded-full overflow-hidden p-[1px] border border-white/[0.08] glass-wraith">
                  <motion.div 
                    animate={{ width: `${cpuPercent}%`, backgroundColor: cpuPercent > 80 ? '#f43f5e' : '#e11d48' }}
                    className="h-full rounded-full shadow-[0_0_15px_rgba(225,29,72,0.6)] relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                  </motion.div>
                </div>
              </div>
              <HeartbeatLine />
            </div>

            <div className="flex items-center gap-8 group/stat">
              <div className="flex flex-col gap-2.5 min-w-[160px]">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-white/20 text-[8px] group-hover/stat:text-emerald-500 transition-colors tracking-widest font-black italic">РІВЕНЬ_ЕНТРОПІЇ</span>
                    <span className="text-white/10 text-[6px] tracking-widest leading-none mt-1 uppercase font-bold">СИНХРОФАЗА_ЗАБЛОКОВАНА</span>
                  </div>
                  <span className="text-emerald-400 font-black text-[14px] tracking-tighter italic">{entropy.toFixed(3)}</span>
                </div>
                <div className="h-[6px] bg-white/[0.03] rounded-full overflow-hidden p-[1px] border border-white/[0.08] glass-wraith">
                  <motion.div 
                    animate={{ width: `${entropy * 100}%` }}
                    className="h-full bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.6)] relative opacity-70"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                  </motion.div>
                </div>
              </div>
              <HeartbeatLine color="emerald" />
            </div>

            <div className="flex flex-col border-l border-white/10 pl-12 h-12 justify-center">
              <span className="text-white/20 text-[8px] leading-none mb-3 tracking-[0.4em] font-black italic">АКТИВНІ_ВУЗЛИ</span>
              <div className="flex items-center gap-5">
                <Radio size={20} className="text-rose-500 animate-pulse" />
                <div className="flex flex-col">
                  <span className="text-white font-black text-[16px] leading-none tracking-tighter italic">
                    {agentsCount.toString().padStart(2, '0')} <span className="text-[9px] text-rose-500 not-italic ml-1 font-black">ВУЗЛІВ</span>
                  </span>
                  <span className="text-white/10 text-[7px] tracking-[0.3em] mt-2 font-bold">ЗАТРИМКА: {status?.services[0]?.latency_ms ?? 0}ms</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col border-l border-white/10 pl-12 h-12 justify-center group/threat">
              <span className="text-white/20 text-[8px] leading-none mb-3 tracking-[0.4em] font-black italic group-hover/threat:text-rose-500 transition-colors">РІВЕНЬ_ЗАГРОЗИ</span>
              <div className="flex items-center gap-5">
                <div className="relative">
                  <ShieldAlert size={22} className={cn("transition-all duration-700", threatLevel > 70 ? "text-rose-500 drop-shadow-[0_0_12px_rgba(225,29,72,1)] scale-110" : "text-white/20")} />
                  {threatLevel > 70 && <motion.div animate={{ scale: [1, 2], opacity: [0.6, 0] }} transition={{ repeat: Infinity, duration: 1.2 }} className="absolute inset-0 bg-rose-500 rounded-full blur-lg" />}
                </div>
                <div className="flex flex-col">
                  <span className={cn("font-black text-[16px] tracking-tighter italic leading-none", threatLevel > 70 ? "text-rose-500" : "text-white/70")}>
                    {threatLevel.toFixed(0)}% <span className="text-[9px] opacity-40 ml-1 not-italic">РИЗИК</span>
                  </span>
                  <span className="text-white/10 text-[7px] tracking-[0.3em] mt-2 uppercase font-bold">{threatLevel > 70 ? 'КРИТИЧНА_ЗАГРОЗА' : 'БЕЗПЕЧНИЙ_РЕЖИМ'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-12">
          <div className="flex flex-col items-end border-r border-white/10 pr-12 h-12 justify-center">
            <span className="text-white/20 text-[8px] leading-none mb-2 tracking-[0.5em] font-black uppercase italic">СИСТЕМНИЙ_ЧАС_UTC</span>
            <span className="text-white font-mono tracking-[0.4em] text-[16px] font-black italic glint-elite">
              {time.toLocaleTimeString('uk-UA', { hour12: false })}
              <span className="text-[10px] text-rose-500/40 ml-2 font-bold">[{time.getMilliseconds().toString().padStart(3, '0')}]</span>
            </span>
          </div>
          
          <div className="flex items-center gap-8 bg-rose-500/5 px-10 py-4 rounded-[1.2rem] glass-wraith border border-rose-500/20 group-hover:border-rose-500/60 transition-all duration-1000 hover:bg-rose-500/10 cursor-crosshair relative group/secured shadow-2xl">
              {/* Corner Ornaments */}
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-rose-500/40 group-hover/secured:border-rose-500 transition-colors" />
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-rose-500/40 group-hover/secured:border-rose-500 transition-colors" />
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-rose-500/40 group-hover/secured:border-rose-500 transition-colors" />
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-rose-500/40 group-hover/secured:border-rose-500 transition-colors" />
              
            <div className="relative flex items-center justify-center scale-125">
              <div className="w-5 h-5 rounded-full bg-rose-500 animate-ping absolute opacity-30" />
              <div className="w-5 h-5 rounded-full bg-rose-500 relative shadow-[0_0_25px_rgba(225,29,72,1)] flex items-center justify-center border border-white/20">
                <Shield size={10} className="text-black" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-rose-500 font-black text-[15px] leading-none tracking-[0.25em] italic">ЗАХИЩЕНО</span>
              <div className="flex items-center gap-3 mt-2.5">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => <div key={i} className="w-[4px] h-[4px] bg-rose-500/60 rounded-full" />)}
                </div>
                <span className="text-white/30 text-[8px] tracking-[0.5em] font-black italic">X-QUANTUM_L5</span>
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
          Ініціалізація модуля
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
          "НЕЙРОННИЙ_ЗВ'ЯЗОК: ВСТАНОВЛЕНО",
          "РУКОСТИСКАННЯ_ЯДРА: УСПІШНО",
          "ШАР_ДЕШИФРУВАННЯ: РІВЕНЬ_7",
          "СУВЕРЕННА_АВТЕНТИФІКАЦІЯ: ПІДТВЕРДЖЕНО",
          "РОЗПОДІЛ_VRAM: ОПТИМІЗОВАНО",
          "СИНХРОНІЗАЦІЯ_МАПИ_UBO: АКТИВНО"
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
    { id: 'BUSINESS_INTEL', label: 'Бізнес-Аналітика', subLabel: 'Ранковий звіт & KPI', icon: TrendingUp, color: 'emerald' },
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
              <span className="text-white/10 text-[7px] font-mono tracking-widest uppercase">Статус вузла</span>
              <span className="text-emerald-500 text-[10px] font-black tracking-widest uppercase animate-pulse">В мережі</span>
           </div>
           <div className="w-[1px] h-8 bg-white/5" />
           <div className="flex flex-col items-end">
              <span className="text-white/10 text-[7px] font-mono tracking-widest uppercase">Сила сигналу</span>
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
          <span className="text-rose-500/60 font-black tracking-[0.3em]">SOVEREIGN_OS_ГОТОВО</span>
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
