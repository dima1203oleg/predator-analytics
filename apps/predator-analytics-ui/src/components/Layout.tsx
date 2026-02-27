
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, Bell, Terminal, Clock, User, ChevronDown,
  Maximize2, Minimize2, LogOut, Lock, Settings, Activity,
  Search, Zap, ChevronLeft, ChevronRight, Cpu, Wifi,
  HardDrive, Thermometer
} from 'lucide-react';
import { TabView } from '../types';
import CommandCenter from './CommandCenter';
import { CommandPalette } from './CommandPalette';
import { OrbitMenu, QuickActionsBar, UserBadge, NAVIGATION_ZONES } from './navigation/OrbitMenu';
import { NotificationDrawer } from './NotificationDrawer';
import { CyberGrid } from './CyberGrid';
import { useUser, UserRole } from '../context/UserContext';
import { useSuperIntelligence } from '../context/SuperIntelligenceContext';
import { useSoundFx } from '../hooks/useSoundFx';
import { StatusIndicator } from './StatusIndicator';

// ============================================================================
// COMMAND SPACE LAYOUT - NEXT GENERATION UI
// ============================================================================

interface LayoutProps {
  children: React.ReactNode;
  activeTab: TabView;
  onTabChange: (tab: TabView) => void;
  onLock: () => void;
  onLogout: () => void;
  onReboot: () => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  onLock,
  onLogout,
  onReboot
}) => {
  // State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCLIOpen, setIsCLIOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Contexts
  const { play } = useSoundFx();
  const { isActive: isGodMode, stage: godStage } = useSuperIntelligence();
  const { user, isCommander } = useUser();

  // Clock
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Real metrics polling
  const [metrics, setMetrics] = useState({ cpu: 0, ram: 0, temp: 0, rps: 0 });
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await api.v45.getRealtimeMetrics();
        if (data) {
          setMetrics({
            cpu: data.cpu_usage || 0,
            ram: data.memory_usage || 0,
            temp: data.temperature || 0,
            rps: data.requests_per_second || 0
          });
        }
      } catch (e) {
        console.warn("Could not fetch real metrics");
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        play('CLICK');
        setIsCLIOpen(prev => !prev);
      }
      // Cmd+K handles CommandPalette via its own listener

      if ((e.metaKey || e.ctrlKey) && e.altKey && e.key === 'z') {
        e.preventDefault();
        setIsZenMode(prev => !prev);
      }
      // Toggle sidebar with [
      if (e.key === '[' && !e.metaKey && !e.ctrlKey) {
        setIsSidebarCollapsed(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [play]);

  const handleTabClick = (id: TabView) => {
    play('CLICK');
    if (navigator.vibrate) navigator.vibrate(15);
    onTabChange(id);
    setIsMobileMenuOpen(false);
  };

  // Current zone for header
  const currentZone = NAVIGATION_ZONES.find(zone =>
    zone.items.some(item => item.id === activeTab)
  );
  const currentItem = currentZone?.items.find(item => item.id === activeTab);

  return (
    <div className={`
      flex h-[100dvh] bg-slate-950  font-sans text-slate-200
      selection:bg-primary-500/30 relative transition-all duration-500
      ${isGodMode ? 'border-[2px] border-purple-900/30 shadow-[inset_0_0_60px_rgba(168,85,247,0.08)]' : ''}
    `}>

      {/* Background Grid */}
      <CyberGrid />

      {/* GLOBAL COMMAND PALETTE */}
      <CommandPalette />

      {/* Command Center CLI */}
      <AnimatePresence>
        {isCLIOpen && (
          <CommandCenter
            isOpen={isCLIOpen}
            onClose={() => setIsCLIOpen(false)}
            onLock={onLock}
            onLogout={onLogout}
            onReboot={onReboot}
            onNavigate={(tab) => { handleTabClick(tab); setIsCLIOpen(false); }}
          />
        )}
      </AnimatePresence>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Notifications */}
      <NotificationDrawer isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />

      {/* ================================================================== */}
      {/* SIDEBAR - ORBIT MENU */}
      {/* ================================================================== */}
      <AnimatePresence>
        {(!isZenMode || isMobileMenuOpen) && (
          <motion.aside
            initial={isMobileMenuOpen ? { x: "-100%" } : { opacity: 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={`
              fixed inset-y-0 left-0 z-[70] bg-[#020617]/98 backdrop-blur-2xl
              border-r border-slate-800/80 flex flex-col shadow-2xl
              md:static transition-all duration-300
              ${isSidebarCollapsed ? 'w-[72px]' : 'w-[260px]'}
              ${!isZenMode && !isMobileMenuOpen ? 'hidden md:flex' : isMobileMenuOpen ? 'flex' : 'hidden'}
              ${isGodMode ? 'border-purple-900/50' : 'border-slate-800'}
            `}
          >
            {/* Header */}
            <div className={`
              p-4 border-b flex items-center justify-between bg-slate-950/50 shrink-0
              ${isGodMode ? 'border-purple-900/50' : 'border-slate-800'}
            `}>
              {!isSidebarCollapsed ? (
                <div
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => handleTabClick(TabView.OVERVIEW)}
                >
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl
                    border shadow-lg transition-all
                    ${isGodMode
                      ? 'bg-purple-600/20 text-purple-400 border-purple-500/50 shadow-purple-500/20'
                      : 'bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-blue-500/20'
                    }
                  `}>
                    P
                  </div>
                  <div>
                    <h1 className="text-lg font-black tracking-widest text-white group-hover:text-blue-400 transition-colors">
                      PREDATOR
                    </h1>
                    <p className="text-[9px] text-slate-500 font-black tracking-[0.2em] uppercase">
                      V45 · КОМАНДНИЙ ЦЕНТР
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className={`
                    w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl mx-auto
                    border shadow-lg cursor-pointer
                    ${isGodMode
                      ? 'bg-purple-600/20 text-purple-400 border-purple-500/50'
                      : 'bg-blue-600/20 text-blue-400 border-blue-500/50'
                    }
                  `}
                  onClick={() => handleTabClick(TabView.OVERVIEW)}
                >
                  P
                </div>
              )}

              {/* Mobile close / Collapse toggle */}
              <button
                onClick={() => isMobileMenuOpen ? setIsMobileMenuOpen(false) : setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                {isMobileMenuOpen ? <X size={20} /> : isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto">
              <OrbitMenu
                activeTab={activeTab}
                onNavigate={handleTabClick}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              />
            </div>

            {/* Quick Actions */}
            {!isSidebarCollapsed && (
              <QuickActionsBar
                onOpenSearch={() => setIsCLIOpen(true)}
                onOpenCommands={() => setIsCLIOpen(true)}
              />
            )}

            {/* User Badge */}
            <div className={`p-3 border-t ${isGodMode ? 'border-purple-900/50' : 'border-slate-800'}`}>
              <UserBadge
                collapsed={isSidebarCollapsed}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ================================================================== */}
      {/* MAIN CONTENT AREA */}
      {/* ================================================================== */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 relative z-10 h-full">

        {/* TOP HEADER BAR */}
        {!isZenMode && (
          <header className={`
            h-14 backdrop-blur-xl border-b flex items-center justify-between px-4 sticky top-0 z-30
            ${isGodMode ? 'bg-purple-950/20 border-purple-900/50' : 'bg-[#020617]/95 border-slate-800/60'}
          `}>
            {/* Left: Mobile menu + Current location */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => { play('CLICK'); setIsMobileMenuOpen(true); }}
                className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              >
                <Menu size={20} />
              </button>

              {/* Breadcrumb / Current Location */}
              <div className="hidden sm:flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full bg-gradient-to-r ${currentZone?.color || 'from-blue-500 to-cyan-500'}`}
                  style={{ boxShadow: `0 0 8px ${currentZone?.glowColor || 'rgba(59, 130, 246, 0.3)'}` }}
                />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {currentZone?.titleUk}
                </span>
                <ChevronRight size={12} className="text-slate-700" />
                <span className="text-sm font-medium text-white">
                  {currentItem?.label}
                </span>
              </div>
            </div>

            {/* Center: Quick Status */}
            <div className="hidden lg:flex items-center gap-6 text-[10px] font-mono">
              <div className="flex items-center gap-2 text-emerald-400">
                <Wifi size={12} />
                <span>ОНЛАЙН</span>
              </div>
              {isGodMode && (
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex items-center gap-2 text-purple-400"
                >
                  <Zap size={12} />
                  <span>ШІ АКТИВНИЙ</span>
                </motion.div>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Zen toggle */}
              <button
                onClick={() => setIsZenMode(!isZenMode)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                title="Дзен Режим"
              >
                {isZenMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              {/* Clock */}
               <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-slate-900/50 border border-white/5 rounded-2xl shadow-xl">
                <Clock size={14} className="text-blue-400" />
                <span className="text-[11px] font-black font-mono text-slate-200 tracking-wider">
                  {time.toLocaleTimeString('uk-UA', { hour12: false })}
                </span>
              </div>

              {/* Notifications */}
              <button
                onClick={() => { play('CLICK'); setIsNotificationsOpen(true); }}
                className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              >
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </button>

              {/* Terminal */}
              <button
                onClick={() => { play('CLICK'); setIsCLIOpen(true); }}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                title="Термінал (⌘K)"
              >
                <Terminal size={18} />
              </button>
            </div>
          </header>
        )}

        {/* MAIN CONTENT */}
        <main className={`
          flex-1 overflow-y-auto overflow-x-hidden scroll-smooth relative
          ${isZenMode ? 'p-0' : 'p-4 md:p-6 pb-24 md:pb-6'}
        `}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="min-h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* SYSTEM HEARTBEAT BAR (Desktop) - Only for technical roles */}
        {!isZenMode && (user?.role === UserRole.OPERATOR || user?.role === UserRole.COMMANDER) && (
          <div className="hidden md:flex h-7 bg-slate-950/95 border-t border-slate-800 items-center px-4 gap-6 text-[10px] font-mono">
            <div className="flex items-center gap-2 text-blue-400">
              <Activity size={10} className="animate-pulse" />
              <span className="text-emerald-500">АКТИВНО</span>
            </div>

            <div className="flex items-center gap-6 text-slate-500">
              <span className="flex items-center gap-2">
                <Cpu size={12} className="text-slate-700" /> <span className="text-slate-600 font-black">ПРОЦЕСОР:</span> <span className="text-white font-black">{metrics.cpu}%</span>
              </span>
              <span className="flex items-center gap-2">
                <HardDrive size={12} className="text-slate-700" /> <span className="text-slate-600 font-black">ПАМ'ЯТЬ:</span> <span className="text-white font-black">{metrics.ram}%</span>
              </span>
              <span className="flex items-center gap-2">
                <Thermometer size={12} className="text-slate-700" /> <span className="text-slate-600 font-black">T°:</span> <span className="text-white font-black">{metrics.temp}°C</span>
              </span>
              <span className="flex items-center gap-2">
                <Zap size={12} className="text-slate-700" /> <span className="text-slate-600 font-black">RPS:</span> <span className="text-white font-black">{metrics.rps}</span>
              </span>
            </div>

            <div className="flex-1" />

            <span className="text-slate-600">
              {user?.tenant_name} · {user?.role.toUpperCase()}
            </span>
          </div>
        )}

        {/* MOBILE DOCK */}
        <div className="md:hidden fixed bottom-5 left-4 right-4 z-[80]">
          <div className="bg-[#0f172a]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl flex justify-around items-center p-2">
            {[
              { tab: TabView.OVERVIEW, icon: <Activity size={20} />, label: 'Огляд' },
              { tab: TabView.CASES, icon: <Search size={20} />, label: 'Кейси' },
              { tab: TabView.ANALYSIS, icon: <Zap size={20} />, label: 'Аналіз' },
              { tab: 'MENU', icon: <Menu size={20} />, label: 'Меню' },
            ].map(({ tab, icon, label }) => (
              <button
                key={tab}
                onClick={() => tab === 'MENU' ? setIsMobileMenuOpen(true) : handleTabClick(tab as TabView)}
                className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-xl transition-all ${
                  activeTab === tab
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-slate-500'
                }`}
              >
                {icon}
                <span className="text-[9px] font-bold mt-1">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
