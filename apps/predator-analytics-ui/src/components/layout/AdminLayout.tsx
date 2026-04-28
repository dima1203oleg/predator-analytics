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
import { useAppStore } from '@/store/useAppStore';
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
  
  // розширена Аналітика
  { id: 'nexus',      label: 'Predictive Nexus',      path: '/admin/command?tab=nexus',       icon: Zap,            badge: 'PREDICT',group: 'розширена Аналітика' },
  { id: 'ai-insights',label: 'AI Insights Hub',       path: '/admin/command?tab=ai-insights', icon: BrainCircuit,   badge: 'DEEP',  group: 'розширена Аналітика' },
  { id: 'hypothesis', label: 'Гіпотези & NAS',        path: '/admin/command?tab=hypothesis',  icon: Cpu,                            group: 'розширена Аналітика' },
  { id: 'forecast',   label: 'Прогнози & Тренди',     path: '/admin/command?tab=forecast',    icon: Activity,                       group: 'розширена Аналітика' },
  
  // Агенти та Безпека
  { id: 'agents-ops', label: 'Оркестрація Агентів',   path: '/admin/command?tab=agents-ops',  icon: Bot,                            group: 'Агенти та Безпека' },
  { id: 'security',   label: 'Zero Trust Security',   path: '/admin/command?tab=security',    icon: Lock,                           group: 'Агенти та Безпека' },
  
  // Intelligence & OSINT
  { id: 'intelligence',label: 'Митна  озвідка',       path: '/admin/command?tab=intelligence',icon: Eye,            badge: 'ELITE',group: ' озвідка & OSINT' },
  { id: 'osint',      label: 'Search Console',        path: '/admin/command?tab=osint',       icon: Search,         badge: 'OSINT', group: ' озвідка & OSINT' },
  { id: 'zrada',      label: 'Zrada Control',         path: '/admin/command?tab=zrada',       icon: ShieldAlert,    badge: 'ELITE', group: ' озвідка & OSINT' },
  { id: 'aml',        label: 'AML Scoring',           path: '/admin/command?tab=aml',         icon: Activity,       badge: 'RISK',  group: ' озвідка & OSINT' },
  { id: 'sanctions',  label: 'Global Sanctions',      path: '/admin/command?tab=sanctions',   icon: Lock,           badge: 'GLOBAL',group: ' озвідка & OSINT' },
  
  // Конфігурація
  { id: 'settings',   label: 'Налаштування',          path: '/admin/command?tab=settings',    icon: Settings,                       group: 'Конфігурація' },
  { id: 'api-docs',   label: 'API Документація',      path: '/api-docs',                      icon: FileText,                       group: 'Конфігурація' },
];

const GROUPS = ['Моніторинг', 'Пайплайни', 'Ядро ШІ', 'ШІ Студія', 'розширена Аналітика', ' озвідка & OSINT', 'Агенти та Безпека', 'Конфігурація'];

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
    <aside className="flex flex-col w-64 min-w-64 h-screen bg-black/60 glass-wraith border-r border-white/10 overflow-hidden relative group">
      <div className="absolute inset-0 cyber-scan-grid opacity-[0.03] pointer-events-none" />
      
      {/* Логотип */}
      <div className="flex items-center gap-4 px-4 py-6 border-b border-white/5 relative z-10">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 shadow-[0_0_15px_rgba(225,29,72,0.2)]">
          <Shield className="w-5 h-5 text-rose-500 drop-shadow-[0_0_8px_rgba(225,29,72,0.8)]" />
        </div>
        <div>
          <div className="text-xs font-black text-white italic tracking-[0.25em] uppercase leading-none">
            PREDATOR
          </div>
          <div className="text-[7px] font-black text-rose-500/60 tracking-[0.3em] leading-none mt-1.5 italic uppercase">
            COMMAND_CENTER_v60
          </div>
        </div>
      </div>

      {/* Навігація */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/5 relative z-10">
        {GROUPS.map((group) => {
          const items = ADMIN_NAV.filter((i) => i.group === group);
          return (
            <div key={group} className="mb-6">
              {/* Заголовок групи */}
              <div className="px-3 py-2 flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-rose-500/40" />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] italic">
                  {group}
                </span>
              </div>

              {/* Пункти */}
              <div className="space-y-1">
                {items.map((item) => {
                  const active = isActive(item);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group/nav relative overflow-hidden',
                        active
                          ? 'bg-rose-500/10 border border-rose-500/30 shadow-[0_0_20px_rgba(225,29,72,0.1)]'
                          : 'hover:bg-white/[0.03] border border-transparent hover:border-white/5',
                      )}
                    >
                      {active && (
                        <motion.div 
                          layoutId="admin-nav-active"
                          className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-transparent pointer-events-none"
                        />
                      )}
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-all duration-300 relative z-10',
                          active ? 'text-rose-400 scale-110 drop-shadow-[0_0_8px_rgba(225,29,72,0.5)]' : 'text-slate-500 group-hover/nav:text-slate-300 group-hover/nav:scale-105',
                        )}
                      />
                      <span
                        className={cn(
                          'text-[11px] truncate transition-all duration-300 relative z-10 uppercase tracking-tight font-bold italic',
                          active ? 'text-white' : 'text-slate-400 group-hover/nav:text-slate-200',
                        )}
                      >
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className={cn(
                          "ml-auto text-[7px] font-black px-1.5 py-0.5 rounded-md border italic relative z-10",
                          active ? "bg-rose-500/20 border-rose-500/40 text-rose-400" : "bg-white/5 border-white/10 text-slate-600"
                        )}>
                          {item.badge}
                        </span>
                      )}
                      {active && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-rose-500 rounded-l-full shadow-[0_0_10px_rgba(225,29,72,0.8)]" />
                      )}
                    </Link>
                  );
                })}
              </div>
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
            <div className="text-[10px] font-semibold text-white/80 truncate">
              {user?.name ?? 'Системний адмін'}
            </div>
            <div className="text-[8px] font-mono text-rose-500/50 uppercase tracking-wider">
              ADMIN · {user?.tenant_name ?? 'PREDATOR'}
            </div>
          </div>
          <button
            onClick={logout}
            title="Вийти"
            className="p-1 rounded text-white/40 hover:text-red-400 hover:bg-red-500/15 transition-colors"
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
  const { isTerminalOpen, setTerminalOpen } = useAppStore();

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + ` or Cmd/Ctrl + T (if not taken)
      if ((e.metaKey || e.ctrlKey) && (e.key === '`')) {
        e.preventDefault();
        setTerminalOpen(!isTerminalOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTerminalOpen, setTerminalOpen]);

  return (
    <header className="flex items-center justify-between px-6 h-12 bg-black/40 glass-wraith border-b border-white/5 shrink-0 relative z-50">
      <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 via-transparent to-blue-500/5 pointer-events-none" />
      
      <div className="flex items-center gap-6 relative z-10">
        {/* режим системи */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
             {[...Array(3)].map((_, i) => (
               <div key={i} className="w-1 h-3 bg-rose-500 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
             ))}
          </div>
          <span className="text-[10px] font-black text-rose-500 italic tracking-[0.25em] uppercase">
            SOVEREIGN_NODE // LOCAL_K3S
          </span>
        </div>
        
        <div className="w-px h-4 bg-white/10" />
        
        {/* Статус сервісів */}
        <div className="flex items-center gap-4">
          {[
            { label: 'API', ok: true, color: 'rose' },
            { label: 'KAFKA', ok: true, color: 'blue' },
            { label: 'NEO4J', ok: true, color: 'purple' },
            { label: 'REDIS', ok: true, color: 'cyan' },
          ].map((svc) => (
            <div key={svc.label} className="flex items-center gap-2 group/svc cursor-help">
              <span className={cn(
                'w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(var(--color),0.6)]', 
                svc.ok ? `bg-${svc.color}-500` : 'bg-red-500 animate-ping'
              )} />
              <span className="text-[8px] font-black text-slate-500 group-hover/svc:text-slate-300 transition-colors uppercase tracking-widest">{svc.label}</span>
            </div>
          ))}
        </div>
      </div>

        <div className="flex items-center gap-6 relative z-10">
        <button 
          onClick={() => setTerminalOpen(!isTerminalOpen)}
          className={cn(
            "flex items-center gap-2 px-3 py-1 bg-white/5 border rounded-full transition-all duration-300",
            isTerminalOpen ? "border-rose-500 bg-rose-500/10 shadow-[0_0_10px_rgba(225,29,72,0.3)]" : "border-white/10 hover:border-rose-500/50"
          )}
        >
           <Terminal className={cn("w-3 h-3 transition-colors", isTerminalOpen ? "text-rose-500" : "text-rose-400")} />
           <span className="text-[10px] font-mono font-black text-rose-300 italic tracking-tighter">
             {time.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
           </span>
        </button>
        
        <div className="flex items-center gap-3 px-4 py-1 bg-amber-500/5 border border-amber-500/20 rounded-full group/vram">
          <Zap className="w-3 h-3 text-amber-400 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-amber-500/60 uppercase tracking-widest leading-none">VRAM_LOAD</span>
            <span className="text-[10px] font-black text-amber-400 italic tracking-tight leading-tight mt-0.5">4.2 / 8.0 GB</span>
          </div>
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
      className="flex h-screen w-screen overflow-hidden relative"
      style={{ backgroundColor: '#020203' }}
    >
      {/* Global Background HUD Layer */}
      <div className="absolute inset-0 cyber-scan-grid opacity-[0.02] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(225,29,72,0.03),transparent_70%)] pointer-events-none" />

      {/* Бічна панель */}
      <AdminSidebar />

      {/* Основна область */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative z-10">
        {/* Статус-бар */}
        <AdminStatusBar />

        {/* Контентна зона */}
        <main className="flex-1 overflow-auto relative" style={{ backgroundColor: 'rgba(5,2,2,0.4)' }}>
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.02] pointer-events-none" />
          <motion.div
            key="admin-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="h-full relative z-10"
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
