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
const ChaosControlHub    = lazy(() => import('../ChaosControlHub'));

// ─── Конфіг вкладок ───────────────────────────────────────────────────────────

type TabId = 'infra' | 'failover' | 'gitops' | 'agents-ops' | 'security' | 'dataops' | 'chaos' | 'settings';

interface TabConfig {
  id: TabId;
  label: string;
  badge?: string;
  component: React.LazyExoticComponent<React.FC>;
}

const TABS: TabConfig[] = [
  { id: 'infra',      label: 'Телеметрія',   badge: 'LIVE',  component: InfraTelemetryTab },
  { id: 'failover',   label: 'Failover',                     component: FailoverRoutingTab },
  { id: 'gitops',     label: 'GitOps',                       component: GitOpsPipelineTab  },
  { id: 'agents-ops', label: 'Агенти',                       component: AgentsOpsTab       },
  { id: 'security',   label: 'Zero Trust',                   component: ZeroTrustSecTab    },
  { id: 'dataops',    label: 'DataOps',                      component: DataOpsTab         },
  { id: 'chaos',      label: 'Chaos Ops',    badge: 'HAZARD', component: ChaosControlHub    },
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

const TabNav: React.FC<TabNavProps> = ({ activeTab, onTabChange }) => (
  <div className="flex items-center gap-1 px-4 border-b border-white/5 bg-[#020202]">
    {TABS.map((tab) => {
      const active = activeTab === tab.id;
      return (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'relative flex items-center gap-1.5 px-3 py-2.5 text-[10px] font-mono transition-all duration-100 uppercase tracking-widest',
            active
              ? 'text-rose-400 border-b-2 border-rose-500'
              : 'text-white/30 hover:text-white/60 border-b-2 border-transparent',
          )}
        >
          {tab.label}
          {tab.badge && (
            <span className={cn(
              'text-[7px] font-mono font-bold px-1 py-0.5 rounded-sm tracking-wider',
              active ? 'text-rose-400/70 bg-rose-500/15' : 'text-white/20 bg-white/5',
            )}>
              {tab.badge}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

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
