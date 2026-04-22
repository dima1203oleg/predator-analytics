import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity, Radio, Box, Database, Bot, Lock, BrainCircuit,
  Settings, FileText, LogOut, Terminal, ChevronRight,
  Shield, Cpu, Zap, Eye, ShieldAlert, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/UserContext';
import { LiveAgentTerminal } from '@/components/intelligence/LiveAgentTerminal';
import { OfflineBanner } from '@/components/shared/OfflineBanner';

// ─── Навігація системного командного центру ────────────────────────────────────

interface AdminNavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
  group: string;
}

const ADMIN_NAV: AdminNavItem[] = [
  // Моніторинг
  { id: 'infra',      label: 'Телеметрія Кластера',  path: '/admin/command?tab=infra',       icon: Activity,       badge: 'LIVE',  group: 'Моніторинг' },
  { id: 'failover',   label: 'Failover & Маршрути',   path: '/admin/command?tab=failover',    icon: Radio,                          group: 'Моніторинг' },
  { id: 'chaos',      label: 'Chaos Control',         path: '/admin/command?tab=chaos',       icon: Zap,                            group: 'Моніторинг' },
  
  // Пайплайни
  { id: 'gitops',     label: 'GitOps & Пайплайни',    path: '/admin/command?tab=gitops',      icon: Box,                            group: 'Пайплайни' },
  { id: 'dataops',    label: 'DataOps Hub',           path: '/admin/command?tab=dataops',     icon: Database,                       group: 'Пайплайни' },
  
  // Ядро ШІ
  { id: 'ai-control', label: 'AI Control Plane',      path: '/admin/command?tab=ai-control',  icon: Zap,            badge: 'NEXUS', group: 'Ядро ШІ' },
  { id: 'ai-engines', label: 'Двигуни ШІ',            path: '/admin/command?tab=ai-engines',  icon: Cpu,            badge: 'CORE',  group: 'Ядро ШІ' },
  { id: 'intel-hub',  label: 'Sovereign Intel',       path: '/admin/command?tab=intel-hub',   icon: Shield,         badge: 'ELITE', group: 'Ядро ШІ' },
  
  // ШІ Студія
  { id: 'factory',    label: 'ШІ Фабрика',            path: '/admin/command?tab=factory',     icon: BrainCircuit,   badge: 'NEW',   group: 'ШІ Студія' },
  { id: 'models',     label: 'Моделі (Fine-Tune)',    path: '/admin/command?tab=models',      icon: BrainCircuit,   badge: 'ML',    group: 'ШІ Студія' },
  { id: 'datasets',   label: 'Datasets Studio',       path: '/admin/command?tab=datasets',    icon: Database,                       group: 'ШІ Студія' },
  { id: 'prompts',    label: 'System Prompts',        path: '/admin/command?tab=prompts',     icon: FileText,                       group: 'ШІ Студія' },
  
  // Розширена Аналітика
  { id: 'nexus',      label: 'Predictive Nexus',      path: '/admin/command?tab=nexus',       icon: Zap,            badge: 'PREDICT',group: 'Розширена Аналітика' },
  { id: 'ai-insights',label: 'AI Insights Hub',       path: '/admin/command?tab=ai-insights', icon: BrainCircuit,   badge: 'DEEP',  group: 'Розширена Аналітика' },
  { id: 'hypothesis', label: 'Гіпотези & NAS',        path: '/admin/command?tab=hypothesis',  icon: Cpu,                            group: 'Розширена Аналітика' },
  { id: 'forecast',   label: 'Прогнози & Тренди',     path: '/admin/command?tab=forecast',    icon: Activity,                       group: 'Розширена Аналітика' },
  
  // Агенти та Безпека
  { id: 'agents-ops', label: 'Оркестрація Агентів',   path: '/admin/command?tab=agents-ops',  icon: Bot,                            group: 'Агенти та Безпека' },
  { id: 'security',   label: 'Zero Trust Security',   path: '/admin/command?tab=security',    icon: Lock,                           group: 'Агенти та Безпека' },
  
  // Intelligence & OSINT
  { id: 'intelligence',label: 'Митна Розвідка',       path: '/admin/command?tab=intelligence',icon: Eye,            badge: 'WRAITH',group: 'Розвідка & OSINT' },
  { id: 'osint',      label: 'Search Console',        path: '/admin/command?tab=osint',       icon: Search,         badge: 'OSINT', group: 'Розвідка & OSINT' },
  { id: 'zrada',      label: 'Zrada Control',         path: '/admin/command?tab=zrada',       icon: ShieldAlert,    badge: 'ELITE', group: 'Розвідка & OSINT' },
  { id: 'aml',        label: 'AML Scoring',           path: '/admin/command?tab=aml',         icon: Activity,       badge: 'RISK',  group: 'Розвідка & OSINT' },
  { id: 'sanctions',  label: 'Global Sanctions',      path: '/admin/command?tab=sanctions',   icon: Lock,           badge: 'GLOBAL',group: 'Розвідка & OSINT' },
  
  // Конфігурація
  { id: 'settings',   label: 'Налаштування',          path: '/admin/command?tab=settings',    icon: Settings,                       group: 'Конфігурація' },
  { id: 'api-docs',   label: 'API Документація',      path: '/api-docs',                      icon: FileText,                       group: 'Конфігурація' },
];

const GROUPS = ['Моніторинг', 'Пайплайни', 'Ядро ШІ', 'ШІ Студія', 'Розширена Аналітика', 'Розвідка & OSINT', 'Агенти та Безпека', 'Конфігурація'];

// ─── Компонент бічної панелі ──────────────────────────────────────────────────

const AdminSidebar: React.FC = () => {
  const { user, logout } = useUser();
  const location = useLocation();

  const isActive = (item: AdminNavItem): boolean => {
    const url = new URL(item.path, window.location.origin);
    const tab = url.searchParams.get('tab');
    const currentTab = new URLSearchParams(location.search).get('tab');
    const currentPath = location.pathname;

    if (tab) return currentPath === url.pathname && currentTab === tab;
    return currentPath === item.path;
  };

  return (
    <aside className="flex flex-col w-56 min-w-56 h-screen bg-[#020202] border-r border-white/8 overflow-hidden">
      {/* Логотип */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-white/8">
        <div className="flex items-center justify-center w-6 h-6 rounded bg-rose-500/15 border border-rose-500/25">
          <Shield className="w-3.5 h-3.5 text-rose-500" />
        </div>
        <div>
          <div className="text-[10px] font-bold text-white/80 tracking-[0.2em] uppercase leading-none">
            PREDATOR
          </div>
          <div className="text-[8px] font-mono text-rose-500/70 tracking-[0.15em] leading-none mt-0.5">
            SYSTEM COMMAND CENTER
          </div>
        </div>
      </div>

      {/* Навігація */}
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/8">
        {GROUPS.map((group) => {
          const items = ADMIN_NAV.filter((i) => i.group === group);
          return (
            <div key={group} className="mb-3">
              {/* Заголовок групи */}
              <div className="px-3 py-1">
                <span className="text-[9px] font-semibold text-white/20 uppercase tracking-[0.2em]">
                  {group}
                </span>
              </div>

              {/* Пункти */}
              {items.map((item) => {
                const active = isActive(item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 mx-1 rounded-sm transition-all duration-100 group',
                      active
                        ? 'bg-rose-500/12 border border-rose-500/20'
                        : 'hover:bg-white/4 border border-transparent',
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-3.5 h-3.5 shrink-0 transition-colors',
                        active ? 'text-rose-500' : 'text-white/30 group-hover:text-white/55',
                      )}
                    />
                    <span
                      className={cn(
                        'text-[11px] truncate transition-colors',
                        active ? 'text-rose-400 font-medium' : 'text-white/45 group-hover:text-white/70',
                      )}
                    >
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="ml-auto text-[8px] font-mono font-semibold text-rose-500/70 tracking-wider shrink-0">
                        {item.badge}
                      </span>
                    )}
                    {active && (
                      <ChevronRight className="ml-auto w-2.5 h-2.5 text-rose-500/50 shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Профіль користувача */}
      <div className="border-t border-white/8 p-2">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-sm">
          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/20 shrink-0">
            <Cpu className="w-2.5 h-2.5 text-rose-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold text-white/65 truncate">
              {user?.name ?? 'Системний адмін'}
            </div>
            <div className="text-[8px] font-mono text-rose-500/50 uppercase tracking-wider">
              ADMIN · {user?.tenant_name ?? 'PREDATOR'}
            </div>
          </div>
          <button
            onClick={logout}
            title="Вийти"
            className="p-1 rounded text-white/20 hover:text-red-400/70 hover:bg-red-500/8 transition-colors"
          >
            <LogOut className="w-3 h-3" />
          </button>
        </div>
      </div>
    </aside>
  );
};

// ─── Статус-бар (верхній) ─────────────────────────────────────────────────────

const AdminStatusBar: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="flex items-center justify-between px-4 h-8 bg-[#020202] border-b border-white/8 shrink-0">
      <div className="flex items-center gap-4">
        {/* Режим системи */}
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-[10px] font-mono text-rose-500/80 tracking-widest uppercase">
            SOVEREIGN · LOCAL K3S
          </span>
        </div>
        <div className="w-px h-3 bg-white/10" />
        {/* Статус сервісів */}
        <div className="flex items-center gap-2">
          {[
            { label: 'API', ok: true },
            { label: 'KAFKA', ok: true },
            { label: 'NEO4J', ok: true },
            { label: 'REDIS', ok: true },
          ].map((svc) => (
            <div key={svc.label} className="flex items-center gap-1">
              <span className={cn('w-1 h-1 rounded-full', svc.ok ? 'bg-rose-500' : 'bg-red-400')} />
              <span className="text-[9px] font-mono text-white/30">{svc.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Terminal className="w-3 h-3 text-white/20" />
        <span className="text-[10px] font-mono text-white/25">
          {time.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
        <div className="flex items-center gap-1">
          <Zap className="w-2.5 h-2.5 text-amber-400/50" />
          <span className="text-[9px] font-mono text-amber-400/50">VRAM 4.2/8 GB</span>
        </div>
      </div>
    </header>
  );
};

// ─── Головний AdminLayout ─────────────────────────────────────────────────────

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * AdminLayout — Military-Grade layout для System Command Center.
 * Замінює MainLayout для усіх маршрутів /admin/*.
 * - Без AI Copilot, QuickActionsBar, ContextRail
 * - Щільна типографіка, тональне підвищення без тіней
 * - Фіксована бічна панель з навігацією
 */
export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{ backgroundColor: '#020202' }}
    >
      {/* Бічна панель */}
      <AdminSidebar />

      {/* Основна область */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Статус-бар */}
        <AdminStatusBar />

        {/* Контентна зона */}
        <main className="flex-1 overflow-auto" style={{ backgroundColor: '#050202' }}>
          <motion.div
            key="admin-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Глобальні компоненти (тільки системні) */}
      <OfflineBanner />
      <LiveAgentTerminal />
    </div>
  );
};

export default AdminLayout;
