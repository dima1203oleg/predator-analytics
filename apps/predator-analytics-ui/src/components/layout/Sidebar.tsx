import { motion } from 'framer-motion';
import {
  Activity,
  Archive,
  Bot,
  Boxes,
  BrainCircuit,
  Command,
  Database,
  Factory,
  FileCheck,
  FileSearch,
  Globe,
  Layers,
  LayoutDashboard,
  Library,
  Lock,
  Network,
  Radio,
  Settings, ShieldAlert,
  ShieldCheck,
  Ship,
  TrendingUp,
  Trophy,
  Zap
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useSystemMetrics } from '../../hooks/useSystemMetrics';
import { premiumLocales } from '../../locales/uk/premium';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../utils/cn';

export const Sidebar = () => {
  const { isSidebarOpen, userRole, deviceMode } = useAppStore();
  const metrics = useSystemMetrics();

  // --- OPTIMIZED NAVIGATION STRUCTURE (v45) ---
  const navGroups: {
    title: string;
    items: { name: string; path: string; icon: any; premium?: boolean; role?: string }[];
  }[] = [
      {
        title: premiumLocales.sidebar.groups.insights,
        items: [
          { name: premiumLocales.sidebar.items.home, path: '/overview', icon: LayoutDashboard },
          { name: premiumLocales.sidebar.items.panopticon, path: '/', icon: Globe, premium: true },
          { name: premiumLocales.sidebar.items.feed, path: '/news', icon: Radio },
        ]
      },
      {
        title: premiumLocales.sidebar.groups.intel,
        items: [
          { name: premiumLocales.sidebar.items.search, path: '/search-v2', icon: FileSearch },
          { name: premiumLocales.sidebar.items.radar, path: '/analytics', icon: Network },
          { name: premiumLocales.sidebar.items.topology, path: '/graph', icon: Network },
          { name: premiumLocales.sidebar.items.archive, path: '/documents', icon: Archive },
          { name: premiumLocales.sidebar.items.cases, path: '/cases', icon: ShieldAlert },
        ]
      },
      {
        title: 'ДАТА-ХАБ',
        items: [
          { name: 'Центр Даних', path: '/data-hub', icon: Database },
          { name: premiumLocales.sidebar.items.datasetStudio, path: '/datasets', icon: Boxes },
          { name: premiumLocales.sidebar.items.customsIntel, path: '/customs-intel', icon: Ship, premium: true },
        ]
      },
      {
        title: premiumLocales.sidebar.groups.ops,
        items: [
          { name: premiumLocales.sidebar.items.agents, path: '/agents', icon: Bot },
          { name: premiumLocales.sidebar.items.orchestrator, path: '/llm/nas', icon: Trophy },
          { name: premiumLocales.sidebar.items.aiCore, path: '/intelligence', icon: Zap, role: 'admin' },
          { name: premiumLocales.sidebar.items.aiLab, path: '/llm', icon: BrainCircuit, role: 'admin' },
        ]
      },
      {
        title: premiumLocales.sidebar.groups.governance,
        items: [
          { name: premiumLocales.sidebar.items.monitoring, path: '/monitoring', icon: Activity, role: 'admin' },
          { name: premiumLocales.sidebar.items.compliance, path: '/compliance', icon: FileCheck },
          { name: premiumLocales.sidebar.items.security, path: '/security', icon: Lock, role: 'admin' },
          { name: premiumLocales.sidebar.items.settings, path: '/settings', icon: Settings },
        ]
      },
      {
        title: 'ПРЕМІУМ',
        items: [
          { name: 'Хаб Розвідки', path: '/premium', icon: Trophy, premium: true },
          { name: 'Конструктор', path: '/builder', icon: Layers, premium: true },
          { name: 'Моделювання', path: '/modeling', icon: TrendingUp, premium: true },
          { name: 'Конкуренти', path: '/competitor-intel', icon: Network, premium: true },
          { name: 'Граф Сутностей', path: '/entity-graph', icon: Globe, premium: true },
        ]
      },
      {
        title: 'АВТОНОМНІСТЬ',
        items: [
          { name: 'ЗАВОД', path: '/factory', icon: Factory, premium: true },
          { name: 'Еволюція', path: '/autonomy', icon: BrainCircuit, premium: true },
          { name: 'Компоненти', path: '/components', icon: Boxes, premium: true },
          { name: 'Знання', path: '/knowledge', icon: Library, premium: true },
        ]
      }
    ];





  const hasAccess = (item: any) => {
    if (item.role === 'admin' && userRole !== 'admin') return false;
    if (item.premium && userRole === 'client') return false;
    return true;
  };

  return (
    <motion.aside
      initial={false}
      animate={{
        width: isSidebarOpen ? 280 : 80,
        transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] }
      }}
      className={cn(
        "fixed left-0 top-0 h-screen z-40 flex flex-col border-r border-white/10 bg-[#020617]/80 backdrop-blur-2xl",
        "shadow-[10px_0_40px_-15px_rgba(0,0,0,0.8)]"
      )}
    >
      {/* --- LOGO SECTION --- */}
      <div className="h-20 flex items-center px-6 relative overflow-hidden group">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
            <Zap className="text-white w-6 h-6 fill-white/20" />
          </div>

          <div className={cn("transition-opacity duration-300", isSidebarOpen ? "opacity-100" : "opacity-0 hidden")}>
            <span className="text-[14px] font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 tracking-tighter">
              Predator v45 | Neural Analytics</span>
          </div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute top-0 left-0 w-full h-full bg-indigo-500/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* --- NAVIGATION --- */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-2">
            {isSidebarOpen && (
              <motion.h3
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * idx }}
                className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 mb-3"
              >
                {group.title}
              </motion.h3>
            )}

            <div className="space-y-1">
              {group.items.filter(hasAccess).map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={!isSidebarOpen ? item.name : undefined}
                  className={({ isActive }) => cn(
                    "relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group overflow-hidden",
                    isActive
                      ? "bg-gradient-to-r from-indigo-500/10 to-blue-500/10 text-white shadow-lg shadow-indigo-500/10 border border-indigo-500/20"
                      : "text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent"
                  )}
                >
                  {({ isActive }) => (
                    <>
                      <div className={cn(
                        "relative z-10 transition-all duration-300 group-hover:scale-110 shrink-0 flex items-center justify-center",
                        isActive ? "text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]" : "text-slate-500 group-hover:text-slate-300"
                      )}>
                        {isActive && (
                          <motion.div
                            layoutId="activeGlow"
                            className="absolute inset-0 bg-blue-500/10 border-l-2 border-l-blue-500 z-0"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                          />
                        )}
                        <item.icon className={cn("w-5 h-5 relative z-10 transition-all", isActive ? "icon-3d-blue" : "")} strokeWidth={isActive ? 2.5 : 2} />
                      </div>

                      <span className={cn(
                        "whitespace-nowrap font-medium text-sm transition-all duration-300 origin-left relative z-10",
                        isSidebarOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 w-0 overflow-hidden"
                      )}>
                        {item.name}
                      </span>

                      {/* Active Indicator & Hover Glow */}
                      {isActive && (
                        <motion.div
                          layoutId="activeNavGlow"
                          className="absolute inset-0 bg-indigo-500/5 rounded-xl z-0"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        />
                      )}
                      {/* Premium Badge - Always Visible */}
                      {item.premium && isSidebarOpen && (
                        <div className="ml-auto flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/40 rounded-full shrink-0">
                          <SparklesIcon className="w-3 h-3 text-amber-400" />
                          <span className="text-[9px] font-black text-amber-300 uppercase tracking-wider">Про</span>
                        </div>
                      )}

                      {/* Admin Badge - Always Visible */}
                      {item.role === 'admin' && isSidebarOpen && (
                        <div className="ml-auto flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-rose-500/20 to-red-500/20 border border-rose-400/40 rounded-full shrink-0">
                          <ShieldCheck className="w-3 h-3 text-rose-400" />
                          <span className="text-[9px] font-black text-rose-300 uppercase tracking-wider">Адмін</span>
                        </div>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* --- FOOTER STATUS --- */}


      {/* --- COPYRIGHT & STATUS --- */}
      <div className="flex flex-col border-t border-white/5 bg-black/20">
        <div className={cn("p-4 flex items-center gap-3 transition-all", isSidebarOpen ? "justify-between" : "justify-center")}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 blur-md animate-pulse" />
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{premiumLocales.sidebar.status.online}</span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500/70 font-mono text-[9px]">v45.0.1-СУВЕРЕН</span>
                  <div className="flex gap-0.5">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [2, 6, 2] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        className="w-0.5 bg-emerald-500/40 rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {isSidebarOpen && (
          <div className="pb-4 px-4 text-center">
            <div className="h-px w-full bg-white/5 mb-4" />

            {/* Quick Actions (Moved from floating fixed position for better aesthetics) */}
            <button
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent('keydown', {
                  key: 'k',
                  ctrlKey: true,
                  bubbles: true
                }));
              }}
              className={cn(
                "w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group mb-4",
                "bg-gradient-to-r from-indigo-600/20 via-violet-600/20 to-indigo-600/20",
                "hover:from-indigo-600/30 hover:via-violet-600/30 hover:to-indigo-600/30",
                "border border-indigo-500/30 hover:border-indigo-400/50",
                "shadow-[0_0_20px_rgba(79,70,229,0.1)] hover:shadow-[0_0_30px_rgba(79,70,229,0.2)]",
                "backdrop-blur-md"
              )}
            >
              <div className="p-1.5 bg-indigo-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Command size={14} className="text-indigo-400 group-hover:text-white" />
              </div>
              <span className="text-[10px] font-black text-indigo-300 group-hover:text-white uppercase tracking-widest leading-none transition-colors">
                Швидкі дії
              </span>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-black/40 rounded text-[8px] font-mono text-indigo-400 border border-white/5">
                ⌘K
              </kbd>
            </button>

            <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">
              Власник Ліцензії
            </div>
            <div className="text-[10px] text-slate-300 font-medium">
              Кізима Дмитро Миколайович
            </div>
            <div className="text-[9px] text-slate-600 font-mono mt-0.5">
              b. 12.03.1985 • © 2026
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
};

// Helper Icon for Premium
const SparklesIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2L14.3 8.6L21 9.2L15.9 13.5L17.5 20L12 16.6L6.5 20L8.1 13.5L3 9.2L9.7 8.6L12 2Z" />
  </svg>
);
