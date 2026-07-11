import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAtom } from 'jotai';
import {
  Activity, Radio, Box, Database, Bot, Lock, BrainCircuit,
  Settings, FileText, LogOut, Terminal, ChevronRight,
  Shield, Cpu, Zap, Eye, ShieldAlert, Search,
  ChevronLeft, Menu, X, Hexagon, Fingerprint
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/UserContext';
import { useAppStore } from '@/store/useAppStore';
import { isSidebarOpenAtom } from '@/store/atoms';
import { LiveAgentTerminal } from '@/components/intelligence/LiveAgentTerminal';
import { OfflineBanner } from '@/components/shared/OfflineBanner';
import { AnimatedPage } from '@/components/polish/AnimatedPage';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { AdvancedBackground } from '@/components/AdvancedBackground';

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
  // Командний Центр
  { id: 'command',    label: 'Командний Центр',       path: '/admin/command?tab=command',     icon: Shield,         badge: 'CORE',  group: 'Командний Центр' },
  { id: 'infra',      label: 'Телеметрія',            path: '/admin/command?tab=infra',       icon: Activity,       badge: 'LIVE',  group: 'Командний Центр' },

  // Розвідка та OSINT
  { id: 'osint',      label: 'Консоль Пошуку',        path: '/admin/command?tab=osint',       icon: Search,         badge: 'OSINT', group: 'Розвідка та OSINT' },
  { id: 'intelligence',label: 'Митна Аналітика',      path: '/admin/command?tab=intelligence',icon: Eye,            badge: 'ELITE', group: 'Розвідка та OSINT' },
  { id: 'zrada',      label: 'Оцінка Ризиків',        path: '/admin/command?tab=zrada',       icon: ShieldAlert,    badge: 'RISK',  group: 'Розвідка та OSINT' },
  
  // ШІ Ядро
  { id: 'ai-insights',label: 'Когнітивний Центр',     path: '/admin/command?tab=ai-insights', icon: BrainCircuit,   badge: 'NEXUS', group: 'ШІ Ядро' },
  { id: 'factory',    label: 'Оркестрація Агентів',   path: '/admin/command?tab=factory',     icon: Bot,            badge: 'AI',    group: 'ШІ Ядро' },

  // Дані
  { id: 'dataops',    label: 'Імпорт Даних',          path: '/ingestion',                     icon: Database,                       group: 'Дані' },
];

const GROUPS = ['Командний Центр', 'Розвідка та OSINT', 'ШІ Ядро', 'Дані'];

// ─── Компонент бічної панелі ──────────────────────────────────────────────────

const AdminSidebar: React.FC = () => {
  const { user, logout } = useUser();
  const location = useLocation();
  const [isOpen, setIsOpen] = useAtom(isSidebarOpenAtom);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const isActive = (item: AdminNavItem): boolean => {
    const url = new URL(item.path, window.location.origin);
    const tab = url.searchParams.get('tab');
    const currentTab = new URLSearchParams(location.search).get('tab');
    const currentPath = location.pathname;

    if (tab) return currentPath === url.pathname && currentTab === tab;
    return currentPath === item.path;
  };

  if (isMobile && !isOpen) return null;

  return (
    <motion.aside 
      initial={false}
      animate={{ 
        width: isMobile ? (isOpen ? 280 : 0) : (isOpen ? 280 : 88),
        x: isMobile && !isOpen ? -280 : 0
      }}
      className={cn(
        "flex flex-col h-[calc(100vh-32px)] my-4 ml-4 rounded-[12px] bg-slate-900 border border-slate-800 overflow-hidden relative z-[9999] group shrink-0 shadow-lg",
        isMobile && "fixed inset-y-0 left-0 shadow-2xl m-0 rounded-none h-screen"
      )}
    >
      {/* Background layer removed for classic style */}
      
      {/* Логотип */}
      <div className="flex items-center justify-between px-6 py-8 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-4 overflow-hidden">
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-blue-600/10 border border-blue-500/20 shrink-0">
            <Hexagon className="w-5 h-5 text-blue-500" />
          </div>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="whitespace-nowrap"
              >
                <div className="text-sm font-semibold text-slate-100 uppercase leading-none">
                  NEXUS CORE
                </div>
                <div className="text-[10px] font-medium text-slate-500 mt-1 uppercase">
                  ENTERPRISE v66.0
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {!isMobile && (
          <Button variant="cyber" 
            onClick={() => setIsOpen(!isOpen)}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-800 border border-transparent transition-colors text-slate-400"
          >
            {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </Button>
        )}
      </div>

      {/* Навігація */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/5 relative z-10">
        {GROUPS.map((group) => {
          const items = ADMIN_NAV.filter((i) => i.group === group);
          return (
            <div key={group} className="mb-8">
              {/* Заголовок групи */}
              <div className="px-3 py-2 flex items-center gap-3 overflow-hidden mb-1">
                {isOpen ? (
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {group}
                  </span>
                ) : (
                  <div className="w-4 h-px bg-slate-700 mx-auto" />
                )}
              </div>

              {/* Пункти */}
              <div className="space-y-1.5">
                {items.map((item) => {
                  const active = isActive(item);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group/nav relative',
                        active
                          ? 'bg-blue-600/10 text-blue-400'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200',
                      )}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-r-full" />
                      )}
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-all',
                          active ? 'text-blue-500' : '',
                          !isOpen && "mx-auto"
                        )}
                      />
                      {isOpen && (
                        <>
                          <span className="text-[13px] font-medium truncate">
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className={cn(
                              "ml-auto text-[10px] font-medium px-2 py-0.5 rounded-sm border",
                              active ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-slate-800 border-slate-700 text-slate-500"
                            )}>
                              {item.badge}
                            </span>
                          )}
                        </>
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
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 transition-colors cursor-pointer">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 shrink-0">
            <Fingerprint className="w-4 h-4" />
          </div>
          {isOpen && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-200 truncate">
                {user?.name ?? 'Адміністратор'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Системний доступ
              </div>
            </div>
          )}
          {isOpen && (
            <Button variant="cyber"
              onClick={logout}
              title="Вийти"
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-700"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </motion.aside>
  );
};

// ─── Статус-бар (верхній) ─────────────────────────────────────────────────────

const AdminStatusBar: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const { isTerminalOpen, setTerminalOpen } = useAppStore();
  const [isSidebarOpen, setSidebarOpen] = useAtom(isSidebarOpenAtom);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="flex items-center justify-between px-6 h-14 bg-slate-900 border-b border-slate-800 shrink-0 relative z-50">
      <div className="flex items-center gap-6 relative z-10">
        {/* Мобільне меню */}
        {isMobile && (
          <Button variant="cyber" 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-cyan-400"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        )}

        {/* Режим системи */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold text-slate-200">
              Адмін-консоль
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">
              Вузол: ELITE-K3S
            </span>
          </div>
        </div>
        
        <div className="w-px h-6 bg-slate-800" />
        
        {/* Статус сервісів */}
        <div className="flex items-center gap-4">
          {[
            { label: 'API', title: 'Core API', ok: true },
            { label: 'KAFKA', title: 'Message Broker', ok: true },
            { label: 'NEO4J', title: 'Graph DB', ok: true },
            { label: 'REDIS', title: 'Cache', ok: true },
          ].map((svc) => (
            <div key={svc.label} className="flex items-center gap-2 group/svc cursor-help" title={svc.title}>
              <span className={cn(
                'w-1.5 h-1.5 rounded-full shrink-0',
                svc.ok ? 'bg-emerald-500' : 'bg-red-500'
              )} />
              <span className="text-[11px] font-medium text-slate-400">{svc.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 relative z-10">
        <Button variant="cyber" 
          onClick={() => setTerminalOpen(!isTerminalOpen)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors border",
            isTerminalOpen ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-transparent border-transparent hover:bg-slate-800 text-slate-500"
          )}
        >
           <Terminal className="w-4 h-4" />
           <span className="text-[11px] font-mono">
             {time.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
           </span>
        </Button>
        
        <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-800/50 border border-slate-800 rounded-md">
          <Cpu className="w-4 h-4 text-slate-400" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 leading-none">GPU VRAM</span>
            <span className="text-[11px] font-medium text-slate-300 mt-0.5">4.2 / 8.0 GB</span>
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
 * AdminLayout — Cyberpunk Glassmorphism layout для Sovereign Command Center.
 * Замінює старий червоний дизайн на глибокий технологічний.
 */
export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useAtom(isSidebarOpenAtom);
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950">
      {/* Бічна панель */}
      <AdminSidebar />

      {/* Мобільна підкладка */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 z-[90] backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative z-10 m-4 rounded-[12px] bg-slate-900 border border-slate-800 shadow-sm">
        {/* Статус-бар */}
        <AdminStatusBar />

        {/* Контентна зона */}
        <main className="flex-1 overflow-auto relative bg-slate-900">
          <AnimatedPage pageKey={location.pathname} variant="fade" className="h-full relative z-10 p-6">
            {children}
          </AnimatedPage>
        </main>
      </div>

      {/* Глобальні компоненти (тільки системні) */}
      <LiveAgentTerminal />
    </div>
  );
};

export default AdminLayout;
