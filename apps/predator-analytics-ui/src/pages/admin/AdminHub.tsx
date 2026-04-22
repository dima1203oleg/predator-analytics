import React, { lazy, Suspense, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Ліниве завантаження вкладок ─────────────────────────────────────────────

const InfraTelemetryTab  = lazy(() => import('./tabs/InfraTelemetryTab'));
const FailoverRoutingTab = lazy(() => import('./tabs/FailoverRoutingTab'));
const GitOpsPipelineTab  = lazy(() => import('./tabs/GitOpsPipelineTab'));
const AgentsOpsTab       = lazy(() => import('./tabs/AgentsOpsTab'));
const ZeroTrustSecTab    = lazy(() => import('./tabs/ZeroTrustSecurityTab'));
const DataOpsTab         = lazy(() => import('./tabs/DataOpsTab'));
const ChaosControlHub    = lazy(() => import('./ChaosControlHub'));

// AI & Intelligence
const SystemFactoryView  = lazy(() => import('@/features/factory/SystemFactoryView'));
const ModelTrainingView  = lazy(() => import('@/features/ai/ModelTrainingView'));
const DatasetsStudioView = lazy(() => import('@/features/ai/DatasetsStudioView'));
const CustomsIntelligenceView = lazy(() => import('@/features/intelligence/CustomsIntelligenceView'));
const KnowledgeEngineeringView = lazy(() => import('@/features/ai/KnowledgeEngineeringView'));
const ScenarioModelingView = lazy(() => import('@/features/ai/ScenarioModelingView'));

// ─── Конфіг вкладок ───────────────────────────────────────────────────────────

type TabId = 'infra' | 'failover' | 'gitops' | 'agents-ops' | 'security' | 'dataops' | 'chaos' | 'factory' | 'models' | 'datasets' | 'intelligence' | 'knowledge' | 'scenarios' | 'settings';

interface TabConfig {
  id: TabId;
  label: string;
  badge?: string;
  component: React.LazyExoticComponent<React.FC>;
}

const TABS: TabConfig[] = [
  { id: 'infra',        label: 'Телеметрія',   badge: 'LIVE',     component: InfraTelemetryTab },
  { id: 'failover',     label: 'Failover',                        component: FailoverRoutingTab },
  { id: 'gitops',       label: 'GitOps',                          component: GitOpsPipelineTab  },
  { id: 'agents-ops',   label: 'Агенти',                          component: AgentsOpsTab       },
  { id: 'security',     label: 'Zero Trust',                      component: ZeroTrustSecTab    },
  { id: 'dataops',      label: 'DataOps',                         component: DataOpsTab         },
  { id: 'chaos',        label: 'Chaos Ops',    badge: 'HAZARD',   component: ChaosControlHub    },
  { id: 'factory',      label: 'ШІ Фабрика',   badge: 'NEW',      component: SystemFactoryView  },
  { id: 'models',       label: 'Fine-Tune',    badge: 'ML',       component: ModelTrainingView  },
  { id: 'datasets',     label: 'Датасети',                        component: DatasetsStudioView },
  { id: 'knowledge',    label: 'Knowledge',                       component: KnowledgeEngineeringView },
  { id: 'scenarios',    label: 'Сценарії',     badge: 'BETA',     component: ScenarioModelingView },
  { id: 'intelligence', label: 'Митна Розвідка', badge: 'WRAITH', component: CustomsIntelligenceView },
];

const DEFAULT_TAB: TabId = 'infra';

// ─── Індикатор завантаження ───────────────────────────────────────────────────

const TabLoader: React.FC = () => (
  <div className="flex items-center justify-center h-48">
    <div className="flex items-center gap-2 text-rose-500/50">
      <Loader className="w-4 h-4 animate-spin" />
      <span className="text-[10px] font-mono tracking-wider">Завантаження модуля...</span>
    </div>
  </div>
);

// ─── Навігація вкладок ────────────────────────────────────────────────────────

interface TabNavProps {
  activeTab: TabId;
  onTabChange: (id: TabId) => void;
}

const TabNav: React.FC<TabNavProps> = ({ activeTab, onTabChange }) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  React.useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative border-b border-white/5 bg-[#020202] z-10 shadow-md flex items-center">
      {/* Лівий градієнт та кнопка скролу */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#020202] to-transparent z-20 flex items-center justify-start px-2 transition-opacity duration-300 pointer-events-none",
        canScrollLeft ? "opacity-100" : "opacity-0"
      )}>
        <button 
          onClick={() => scroll('left')} 
          className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors pointer-events-auto backdrop-blur-sm border border-white/10"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
      </div>

      <div 
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className="flex items-center gap-1 px-4 overflow-x-auto no-scrollbar scroll-smooth flex-1"
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'relative flex items-center whitespace-nowrap gap-2 px-4 py-3 text-[11px] font-mono transition-all duration-200 uppercase tracking-widest',
                active
                  ? 'text-rose-400 border-b-2 border-rose-500 bg-white/[0.02] shadow-[inset_0_-2px_10px_rgba(225,29,72,0.1)]'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/[0.01] border-b-2 border-transparent',
              )}
            >
              {tab.label}
              {tab.badge && (
                <span className={cn(
                  'text-[8px] font-mono font-black px-1.5 py-0.5 rounded-sm tracking-wider',
                  active ? 'text-rose-100 bg-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.4)]' : 'text-white/40 bg-white/5',
                )}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Правий градієнт та кнопка скролу */}
      <div className={cn(
        "absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#020202] to-transparent z-20 flex items-center justify-end px-2 transition-opacity duration-300 pointer-events-none",
        canScrollRight ? "opacity-100" : "opacity-0"
      )}>
        <button 
          onClick={() => scroll('right')} 
          className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors pointer-events-auto backdrop-blur-sm border border-white/10"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  );
};

// ─── AdminHub ─────────────────────────────────────────────────────────────────

/**
 * AdminHub — Головний System Command Center для ролі ADMIN.
 * Route: /admin/command?tab=<tabId>
 *
 * Читає ?tab= з URL, рендерить відповідний модуль через lazy-loading.
 * При відсутності tab — перенаправляє на DEFAULT_TAB (infra).
 */
export const AdminHub: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const rawTab = searchParams.get('tab') as TabId | null;
  const activeTab = TABS.find((t) => t.id === rawTab)?.id ?? DEFAULT_TAB;

  // Якщо tab не валідний → редірект на дефолт
  useEffect(() => {
    if (!rawTab || !TABS.find((t) => t.id === rawTab)) {
      navigate(`/admin/command?tab=${DEFAULT_TAB}`, { replace: true });
    }
  }, [rawTab, navigate]);

  const handleTabChange = (id: TabId) => {
    navigate(`/admin/command?tab=${id}`, { replace: true });
  };

  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.component;

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#050202' }}>
      {/* Навігація вкладок */}
      <TabNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Контент вкладки */}
      <div className="flex-1 overflow-auto">
        <Suspense fallback={<TabLoader />}>
          {ActiveComponent && <ActiveComponent />}
        </Suspense>
      </div>
    </div>
  );
};

export default AdminHub;
