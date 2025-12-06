
import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Database, Bot, ShieldAlert, Settings, BarChart3,
  Search, User, Bell, Menu, X, ShieldCheck, Server, Activity,
  Terminal, BrainCircuit, Workflow, Clock, LogOut, Lock, ChevronDown,
  Zap, Cable, Crown, Layers, Rocket, Newspaper, Sparkles, Trophy,
  Home, Grid, Cpu, Network, Sword, Radio, LayoutGrid
} from 'lucide-react';
import { TabView } from '../types';
import CommandCenter from './CommandCenter';
import { api } from '../services/api';
import { useSoundFx } from '../hooks/useSoundFx';
import { useSuperIntelligence } from '../context/SuperIntelligenceContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: TabView;
  onTabChange: (tab: TabView) => void;
  onLock: () => void;
  onLogout: () => void;
  onReboot: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, onLock, onLogout, onReboot }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCLIOpen, setIsCLIOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);

  // Header Dropdowns
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Sound Engine
  const { play } = useSoundFx();

  // God Mode Context
  const { isActive: isGodMode } = useSuperIntelligence();

  // Tactical Clock
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper for icons if not imported - Defined BEFORE usage
  const HardDrive = Database;

  // OPTIMIZED MENU STRUCTURE (LOCALIZED)
  const menuGroups = [
    {
      title: 'КОМАНДНИЙ РІВЕНЬ',
      items: [
        { id: TabView.USER_PORTAL, label: 'Виконавчий ШІ', icon: <Crown size={18} className="text-amber-500 icon-3d-amber" /> },
        { id: TabView.DASHBOARD, label: 'Ситуаційна Кімната', icon: <LayoutDashboard size={18} /> },
        { id: TabView.SUPER_INTELLIGENCE, label: 'Суперінтелект', icon: <Zap size={18} className={isGodMode ? "text-purple-400 animate-pulse icon-3d-purple" : "text-purple-500 icon-3d-purple"} /> },
      ]
    },
    {
      title: 'СЕМАНТИЧНИЙ ПОШУК',
      items: [
        { id: TabView.SEARCH, label: 'Пошукова Консоль', icon: <Search size={18} className="text-cyan-400" /> },
        { id: TabView.DATASET_STUDIO, label: 'Dataset Studio', icon: <Sparkles size={18} className="text-teal-400" /> },
        { id: TabView.AUTO_OPTIMIZER, label: 'AutoOptimizer ♾️', icon: <Zap size={18} className="text-emerald-400" /> },
      ]
    },
    {
      title: 'РОЗВІДКА (INTEL)',
      items: [
        { id: TabView.ANALYTICS, label: 'Глибинний Сканер', icon: <Search size={18} /> },
        { id: TabView.SYSTEM_BRAIN, label: 'Нейронна Рада', icon: <BrainCircuit size={18} /> },
        { id: TabView.OPPONENT, label: 'Опонент (Red Team)', icon: <Sword size={18} className="text-red-400" /> },
        { id: TabView.NAS, label: 'NAS Турніри', icon: <Trophy size={18} /> },
        { id: TabView.AGENTS, label: 'Флот Агентів', icon: <Bot size={18} /> },
      ]
    },
    {
      title: 'ЯДРО ДАНИХ',
      items: [
        { id: TabView.INTEGRATION, label: 'Хаб Даних', icon: <Database size={18} /> },
        { id: TabView.DATA, label: 'Сховище (Grid)', icon: <HardDrive size={18} /> },
        { id: TabView.ETL, label: 'ETL Пайплайни', icon: <Workflow size={18} /> },
      ]
    },
    {
      title: 'ІНЖЕНЕРІЯ',
      items: [
        { id: TabView.DEVOPS, label: 'Інженерний Хаб', icon: <Server size={18} /> },
        { id: TabView.SECURITY, label: 'Кіберзахист', icon: <ShieldAlert size={18} /> },
        { id: TabView.MONITORING, label: 'Спостережуваність', icon: <Activity size={18} /> },
        { id: TabView.LLM, label: 'Майстерня Моделей', icon: <Cpu size={18} /> },
        { id: TabView.SETTINGS, label: 'Налаштування', icon: <Settings size={18} /> },
        { id: TabView.ADMIN_DASHBOARD, label: 'Адмін Панель', icon: <LayoutGrid size={18} /> },
      ]
    }
  ];

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle CLI with ` or ~
      if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        play('CLICK');
        setIsCLIOpen(prev => !prev);
      }

      // Toggle CLI with Ctrl+K or Cmd+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        play('CLICK');
        setIsCLIOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [play]);

  const handleTabClick = (id: TabView) => {
    play('CLICK');
    // Haptic feedback if available (Mobile)
    if (navigator.vibrate) navigator.vibrate(15);
    onTabChange(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className={`flex h-[100dvh] bg-slate-950 overflow-hidden font-sans text-slate-200 selection:bg-primary-500/30 relative transition-colors duration-1000 ${isGodMode ? 'border-[3px] border-purple-900/30 shadow-[inset_0_0_50px_rgba(168,85,247,0.1)]' : ''}`}>

      {/* Cyber Grid Background Overlay */}
      <div className="absolute inset-0 bg-cyber-grid pointer-events-none z-0 opacity-40"></div>

      {/* Global Command Center (CLI) */}
      <CommandCenter
        isOpen={isCLIOpen}
        onClose={() => setIsCLIOpen(false)}
        onLock={onLock}
        onLogout={onLogout}
        onReboot={onReboot}
        onNavigate={(tab) => { handleTabClick(tab); setIsCLIOpen(false); }}
      />

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Cinematic HUD Style (3D Upgrade) */}
      {!isZenMode && (
        <aside
          className={`
            fixed inset-y-0 left-0 z-[70] w-[85vw] max-w-sm bg-[#020617]/95 backdrop-blur-xl border-r border-slate-800 flex flex-col flex-shrink-0 shadow-2xl transition-transform duration-300 ease-in-out pl-safe panel-3d
            md:static md:w-64 md:translate-x-0 pt-safe pb-safe
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            ${isGodMode ? 'border-purple-900/50' : 'border-slate-800'}
            `}
        >
          <div className={`p-6 border-b flex items-center justify-between bg-slate-950/50 relative overflow-hidden shrink-0 mt-safe md:mt-0 ${isGodMode ? 'border-purple-900/50' : 'border-slate-800'}`}>
            <div className={`absolute top-0 left-0 w-1 h-full shadow-[0_0_15px_rgba(8,145,178,0.8)] ${isGodMode ? 'bg-purple-600 shadow-[0_0_20px_#a855f7]' : 'bg-primary-600'}`}></div>
            <div className="flex items-center gap-3 relative z-10">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold font-display border shadow-[0_0_15px_rgba(8,145,178,0.3)] icon-3d-blue text-xl ${isGodMode ? 'bg-purple-600/20 text-purple-400 border-purple-500/50' : 'bg-primary-600/20 text-primary-400 border-primary-500/50'}`}>
                P
              </div>
              <div>
                <h1 className={`text-xl font-bold tracking-wider font-display text-glow-quantum ${isGodMode ? 'text-purple-100' : 'text-slate-100'}`}>PREDATOR</h1>
                <p className="text-[9px] text-primary-400 font-mono tracking-[0.2em] uppercase opacity-80">
                  v20.0.0 <span className="text-slate-600 px-1">::</span> SINGULARITY
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-white p-2 rounded-md active:bg-slate-800 touch-manipulation active:scale-95 transition-transform"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-800/50 -z-10"></div>

            <ul className="space-y-6 px-3">
              {menuGroups.map((group, idx) => (
                <li key={idx} className="relative">
                  <div className={`px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono flex items-center gap-2 ${group.title.includes('КОМАНДНИЙ') ? 'text-blue-400' : ''}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${group.title.includes('КОМАНДНИЙ') ? 'bg-blue-500 animate-pulse' : 'bg-slate-700'}`}></span>
                    {group.title}
                  </div>
                  <ul className="space-y-1">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => handleTabClick(item.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3.5 md:py-2.5 text-sm font-medium rounded-md transition-all duration-200 group relative overflow-hidden btn-3d touch-manipulation ${activeTab === item.id
                              ? isGodMode ? 'text-white bg-purple-900/20 border border-purple-500/50 shadow-[inset_0_0_10px_rgba(168,85,247,0.2)]' : 'text-white bg-slate-800/50 border border-slate-700 shadow-[inset_0_0_10px_rgba(6,182,212,0.1)]'
                              : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200 border border-transparent'
                            }`}
                        >
                          {/* Active Glow Indicator */}
                          {activeTab === item.id && (
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${isGodMode ? 'bg-purple-500 shadow-[0_0_10px_#a855f7]' : 'bg-primary-500 shadow-[0_0_10px_#06b6d4]'}`}></div>
                          )}

                          <span className={`relative z-10 transition-colors duration-300 ${activeTab === item.id ? (isGodMode ? 'text-purple-400' : 'text-primary-400 icon-3d-blue') : 'text-slate-500 group-hover:text-slate-300 icon-3d'}`}>
                            {item.icon}
                          </span>
                          <span className="relative z-10">{item.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </nav>

          <div className={`p-4 border-t bg-slate-950/50 backdrop-blur-sm shrink-0 mb-safe ${isGodMode ? 'border-purple-900/50' : 'border-slate-800'}`}>
            {isGodMode && (
              <div className="mb-3 text-[10px] font-bold text-purple-400 text-center animate-pulse tracking-widest border border-purple-500/30 rounded py-1 bg-purple-900/10">
                E/ACC ПРОТОКОЛ АКТИВНИЙ
              </div>
            )}
            <button
              onClick={() => { play('CLICK'); setIsCLIOpen(true); }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300 hover:text-white border border-slate-700 transition-all shadow-sm group btn-3d touch-manipulation active:scale-95"
            >
              <Terminal size={12} className="text-primary-500 group-hover:text-white" />
              ТЕРМІНАЛ (CTRL+K)
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 pr-safe pl-safe transition-all duration-300 w-full h-full">

        {/* Header - Glassmorphic 3D */}
        {!isZenMode && activeTab !== TabView.USER_PORTAL && (
          <header className={`min-h-[3.5rem] h-auto backdrop-blur-xl border-b flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 transition-all duration-500 pt-safe ${isGodMode ? 'bg-purple-950/20 border-purple-900/50' : 'bg-slate-900/80 border-slate-800'}`}>

            <div className="flex items-center gap-4 flex-1 py-2">
              <button
                onClick={() => { play('CLICK'); setIsMobileMenuOpen(true); }}
                className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors btn-3d touch-manipulation active:scale-95"
              >
                <Menu size={24} />
              </button>
              <div className="flex items-center gap-2 text-slate-500 text-sm font-mono">
                <ShieldCheck size={14} className="text-green-500" />
                <span className="hidden xs:inline">Система: <span className="text-white font-bold">ОПТИМАЛЬНО</span></span>
              </div>
            </div>

            <div className="flex items-center gap-3 ml-4 py-2">
              {/* Tactical Clock */}
              <div className="hidden lg:flex flex-col items-end text-slate-400 border-r border-slate-800 pr-4 group cursor-default">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-300 font-bold group-hover:text-primary-400 transition-colors">
                  <Clock size={12} className="text-primary-500 animate-pulse icon-3d-blue" />
                  {time.toLocaleTimeString('uk-UA', { hour12: false })}
                </div>
              </div>

              {/* User Profile */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => { play('CLICK'); setIsUserMenuOpen(!isUserMenuOpen); }}
                  className="flex items-center gap-2 hover:bg-slate-800/50 p-1.5 rounded-full transition-all border border-transparent hover:border-slate-700 btn-3d touch-manipulation active:scale-95"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full flex items-center justify-center border border-slate-700 shadow-inner shrink-0">
                    <User size={16} className="text-slate-400 icon-3d" />
                  </div>
                  <ChevronDown size={14} className="text-slate-500" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-lg shadow-2xl z-50 animate-in slide-in-from-top-1 overflow-hidden panel-3d">
                    <div className="py-1">
                      <button onClick={() => { play('CLICK'); onLock(); }} className="w-full text-left px-4 py-3 text-sm text-slate-400 hover:bg-slate-800 hover:text-white flex items-center gap-3 transition-colors touch-manipulation">
                        <Lock size={14} /> Блокувати
                      </button>
                      <button onClick={() => { play('CLICK'); onLogout(); }} className="w-full text-left px-4 py-3 text-sm text-danger-400 hover:bg-red-900/20 hover:text-danger-300 flex items-center gap-3 transition-colors touch-manipulation">
                        <LogOut size={14} /> Вийти
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>
        )}

        {/* Main Content */}
        <main className={`flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 scroll-smooth custom-scrollbar relative z-0 pb-safe ${isZenMode || activeTab === TabView.USER_PORTAL ? 'p-0 sm:p-0' : 'mb-20 md:mb-0'}`}>
          {children}
        </main>

        {/* Live Ticker Footer (Desktop) */}
        {!isZenMode && (
          <div className="hidden md:flex fixed bottom-0 right-0 left-64 z-20 h-6 bg-slate-950/90 border-t border-slate-800 overflow-hidden items-center backdrop-blur-md">
            <div className="flex items-center px-2 bg-slate-900 h-full border-r border-slate-800 text-[10px] text-primary-500 font-bold uppercase shrink-0 gap-1 shadow-lg z-30">
              <Activity size={10} className="animate-pulse" /> LIVE
            </div>
            <div className="flex animate-marquee whitespace-nowrap text-[10px] font-mono text-slate-400 gap-8 items-center w-full">
              <span><span className="text-green-500">NBU USD:</span> 41.25 (+0.05)</span>
              <span><span className="text-yellow-500">BTC:</span> $67,420 (+2.4%)</span>
              <span><span className="text-blue-500">SYSTEM:</span> ALL SYSTEMS OPTIMAL</span>
              <span><span className="text-red-500">THREATS:</span> 3 LOW PRIORITY BLOCKED</span>
              <span><span className="text-purple-500">AI:</span> GEMINI-3-ULTRA ONLINE</span>
              <span><span className="text-green-500">NBU USD:</span> 41.25 (+0.05)</span>
              <span><span className="text-yellow-500">BTC:</span> $67,420 (+2.4%)</span>
            </div>
          </div>
        )}

        {/* Floating Dock Navigation (Mobile / iPhone 15 Pro Max Optimized) */}
        <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
          <div className="bg-[#0f172a]/90 backdrop-blur-2xl border border-slate-700/50 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] flex justify-between items-center p-2 pb-safe-offset">
            <button
              onClick={() => handleTabClick(TabView.DASHBOARD)}
              className={`flex flex-col items-center justify-center flex-1 py-2 rounded-xl transition-all duration-300 ${activeTab === TabView.DASHBOARD ? 'bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'text-slate-500'}`}
            >
              <Home size={22} strokeWidth={activeTab === TabView.DASHBOARD ? 2.5 : 2} />
              <span className="text-[9px] font-bold mt-1">Головна</span>
            </button>

            <button
              onClick={() => handleTabClick(TabView.USER_PORTAL)}
              className={`flex flex-col items-center justify-center flex-1 py-2 rounded-xl transition-all duration-300 ${activeTab === TabView.USER_PORTAL ? 'bg-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'text-slate-500'}`}
            >
              <Crown size={22} strokeWidth={activeTab === TabView.USER_PORTAL ? 2.5 : 2} />
              <span className="text-[9px] font-bold mt-1">Exec</span>
            </button>

            <button
              onClick={() => handleTabClick(TabView.SUPER_INTELLIGENCE)}
              className={`flex flex-col items-center justify-center flex-1 py-2 rounded-xl transition-all duration-300 ${activeTab === TabView.SUPER_INTELLIGENCE ? 'bg-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'text-slate-500'}`}
            >
              <Zap size={22} strokeWidth={activeTab === TabView.SUPER_INTELLIGENCE ? 2.5 : 2} className={activeTab === TabView.SUPER_INTELLIGENCE ? 'animate-pulse' : ''} />
              <span className="text-[9px] font-bold mt-1">Core</span>
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center flex-1 py-2 rounded-xl text-slate-500 active:scale-95 transition-transform hover:text-white"
            >
              <Grid size={22} />
              <span className="text-[9px] font-bold mt-1">Меню</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Layout;
