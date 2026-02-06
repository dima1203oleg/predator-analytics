import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  Home, Search, BarChart2, LayoutDashboard,
  Settings, ShieldAlert, Radio, Activity, Globe, Database, ShieldCheck,
  BrainCircuit, Bot, Network, Lock, FileCheck, Layers, FileText,
  Zap, Server, Ship, Trophy, Archive, FileSearch, Library, Boxes
} from 'lucide-react';
import { useSystemMetrics } from '../../hooks/useSystemMetrics';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { premiumLocales } from '../../locales/uk/premium';

export const Sidebar = () => {
  const { isSidebarOpen, userRole, deviceMode } = useAppStore();
  const metrics = useSystemMetrics();

  // --- OPTIMIZED NAVIGATION STRUCTURE (v27) ---
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
        { name: premiumLocales.sidebar.items.topology, path: '/graph', icon: Share2Icon },
        { name: premiumLocales.sidebar.items.archive, path: '/documents', icon: Archive },
        { name: premiumLocales.sidebar.items.cases, path: '/cases', icon: ShieldAlert },
      ]
    },
    {
      title: premiumLocales.sidebar.groups.data,
      items: [
        { name: premiumLocales.sidebar.items.storage, path: '/databases', icon: Layers },
        { name: premiumLocales.sidebar.items.sources, path: '/parsers', icon: Database },
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
    }
  ];

  // Custom Icon for Graph (Share2 replacement if not imported)
  function Share2Icon(props: any) {
    return <Network {...props} />;
  }



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
        transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
      }}
      className={cn(
        "fixed left-0 top-0 h-screen z-40 flex flex-col border-r border-white/5 bg-[#020617]/95 backdrop-blur-xl",
        "shadow-[4px_0_24px_-12px_rgba(0,0,0,0.5)]"
      )}
    >
      {/* --- LOGO SECTION --- */}
      <div className="h-20 flex items-center px-6 relative overflow-hidden group">
        <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
                <Zap className="text-white w-6 h-6 fill-white/20" />
            </div>

            <div className={cn("transition-opacity duration-300", isSidebarOpen ? "opacity-100" : "opacity-0 hidden")}>
                <h1 className="text-lg font-black tracking-tighter text-white leading-none">
                    PREDATOR
                </h1>
                <span className="text-[10px] font-mono text-indigo-400 tracking-[0.2em] uppercase">
                    Analytics v30
                </span>
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
                          "relative z-10 transition-transform duration-300 group-hover:scale-110 shrink-0",
                          isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                        )}>
                          <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
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
                        {item.premium && isSidebarOpen && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <SparklesIcon className="w-3 h-3 text-amber-400" />
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
      <div className="p-4 border-t border-white/5 bg-black/20">
          <div className={cn("flex items-center gap-3 transition-all", isSidebarOpen ? "justify-between" : "justify-center")}>
              <div className="flex items-center gap-3">
                  <div className="relative">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 blur-sm animate-pulse" />
                  </div>
                  {isSidebarOpen && (
                      <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-white tracking-wider">{premiumLocales.sidebar.status.online}</span>
                          <span className="text-[9px] text-emerald-500/70 font-mono">v30.0.0-{premiumLocales.sidebar.status.stable}</span>
                      </div>
                  )}
              </div>

              {isSidebarOpen && (
                 <Server size={14} className="text-slate-600" />
              )}
          </div>
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
