
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Database, Bot, ShieldAlert, Settings, BarChart3, 
  Search, User, Bell, Menu, X, ShieldCheck, Server, Activity, 
  Terminal, BrainCircuit, Workflow, Clock, LogOut, Lock, ChevronDown, 
  Zap, Cable, Crown, Layers, Rocket, Newspaper, Sparkles, Trophy
} from 'lucide-react';
import { TabView } from '../types';
import CommandCenter from './CommandCenter';
import { api } from '../services/api';
import { useSoundFx } from '../hooks/useSoundFx';

// ... (Existing Imports)

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

  // Tactical Clock
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const menuGroups = [
    {
      title: 'PREMIUM ACCESS',
      items: [
        { id: TabView.USER_PORTAL, label: 'Вікно Користувача', icon: <Crown size={18} className="text-amber-500 icon-3d-amber" /> },
      ]
    },
    {
      title: 'CORE INTELLIGENCE',
      items: [
        { id: TabView.DASHBOARD, label: 'Головна Панель', icon: <LayoutDashboard size={18} /> },
        { id: TabView.NAS, label: 'NAS / Турніри', icon: <Trophy size={18} /> }, // NEW NAS ITEM
        { id: TabView.SUPER_INTELLIGENCE, label: 'ECS Еволюція', icon: <Zap size={18} /> },
        { id: TabView.SYSTEM_BRAIN, label: 'System Brain (Debate)', icon: <BrainCircuit size={18} /> },
        { id: TabView.AGENTS, label: 'MAS Агенти', icon: <Bot size={18} /> },
      ]
    },
    {
      title: 'DATA ENGINE',
      items: [
        { id: TabView.INTEGRATION, label: 'Центр Інтеграцій', icon: <Cable size={18} /> },
        { id: TabView.DATA, label: 'Дані та Реєстри', icon: <Database size={18} /> },
        { id: TabView.ETL, label: 'Парсинг (ETL)', icon: <Workflow size={18} /> },
        { id: TabView.ANALYTICS, label: 'DeepScan Аналітика', icon: <BarChart3 size={18} /> },
      ]
    },
    {
      title: 'INFRA & OPS',
      items: [
        { id: TabView.DEVOPS, label: 'Розгортання (GitOps)', icon: <Rocket size={18} /> },
        { id: TabView.LLM, label: 'LLM Training', icon: <Sparkles size={18} /> },
        { id: TabView.SETTINGS, label: 'Налаштування', icon: <Settings size={18} /> },
      ]
    }
  ];

  // ... (Rest of Layout component remains unchanged)
  // Hotkey Listener for CLI
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === '~') {
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
    onTabChange(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-[100dvh] bg-slate-950 overflow-hidden font-sans text-slate-200 selection:bg-primary-500/30 relative">
      
      {/* Cyber Grid Background Overlay */}
      <div className="absolute inset-0 bg-cyber-grid pointer-events-none z-0 opacity-40"></div>
      
      {/* Global Command Center (CLI) */}
      <CommandCenter 
        isOpen={isCLIOpen} 
        onClose={() => setIsCLIOpen(false)} 
        onLock={onLock}
        onLogout={onLogout}
        onReboot={onReboot}
      />

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Cinematic HUD Style (3D Upgrade) */}
      {!isZenMode && (
        <aside 
            className={`
            fixed inset-y-0 left-0 z-50 w-72 bg-slate-950/90 backdrop-blur-xl border-r border-slate-800 flex flex-col flex-shrink-0 shadow-2xl transition-transform duration-300 ease-in-out pl-safe panel-3d
            md:static md:w-64 md:translate-x-0 pt-safe pb-safe
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
        >
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 relative overflow-hidden shrink-0 mt-safe md:mt-0">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary-600 shadow-[0_0_15px_rgba(8,145,178,0.8)]"></div>
                <div className="flex items-center gap-3 relative z-10">
                <div className="w-8 h-8 bg-primary-600/20 rounded flex items-center justify-center text-primary-400 font-bold font-display border border-primary-500/50 shadow-[0_0_15px_rgba(8,145,178,0.3)] icon-3d-blue">
                    P
                </div>
                <div>
                    <h1 className="text-lg font-bold text-slate-100 tracking-wider font-display text-glow">PREDATOR</h1>
                    <p className="text-[9px] text-primary-400 font-mono tracking-[0.2em] uppercase opacity-80">v18.4 Ultimate</p>
                </div>
                </div>
                <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="md:hidden text-slate-400 hover:text-white p-2 rounded-md active:bg-slate-800"
                >
                <X size={24} />
                </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-800/50 -z-10"></div>

            <ul className="space-y-6 px-3">
                {menuGroups.map((group, idx) => (
                    <li key={idx} className="relative">
                        <div className={`px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono flex items-center gap-2 ${group.title.includes('PREMIUM') ? 'text-amber-500 text-glow-amber' : ''}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${group.title.includes('PREMIUM') ? 'bg-amber-500 animate-pulse' : 'bg-slate-700'}`}></span>
                            {group.title}
                        </div>
                        <ul className="space-y-1">
                            {group.items.map((item) => (
                                <li key={item.id}>
                                    <button
                                    onClick={() => handleTabClick(item.id)}
                                    onMouseEnter={() => play('HOVER')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 md:py-2.5 text-sm font-medium rounded-md transition-all duration-200 group relative overflow-hidden btn-3d ${
                                        activeTab === item.id
                                        ? 'text-white bg-slate-800/50 border border-slate-700 shadow-[inset_0_0_10px_rgba(6,182,212,0.1)]'
                                        : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200 border border-transparent'
                                    }`}
                                    >
                                    {/* Active Glow Indicator */}
                                    {activeTab === item.id && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 shadow-[0_0_10px_#06b6d4]"></div>
                                    )}
                                    
                                    <span className={`relative z-10 transition-colors duration-300 ${activeTab === item.id ? 'text-primary-400 icon-3d-blue' : 'text-slate-500 group-hover:text-slate-300 icon-3d'}`}>
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

            <div className="p-4 border-t border-slate-800 bg-slate-950/50 backdrop-blur-sm shrink-0 mb-safe">
            <div className="bg-slate-900/80 p-3 rounded border border-slate-800 shadow-lg relative overflow-hidden group panel-3d">
                <div className="absolute top-3 right-3 w-2 h-2 bg-success-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
                
                <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
                <span className="font-bold tracking-wider">SYSTEM STATUS</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-success-500 h-full w-[99.9%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 mt-2 font-mono">
                    <span className="group-hover:text-success-400 transition-colors">Oracle: ONLINE</span>
                    <span className="group-hover:text-purple-400 transition-colors">NVIDIA: ACTIVE</span>
                </div>
            </div>
            <button 
                onClick={() => { play('CLICK'); setIsCLIOpen(true); }}
                onMouseEnter={() => play('HOVER')}
                className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300 hover:text-white border border-slate-700 transition-all shadow-sm hover:shadow-md hover:border-slate-500 group btn-3d"
            >
                <Terminal size={12} className="text-primary-500 group-hover:text-white transition-colors icon-3d-blue" />
                TERMINAL_ACCESS [~]
            </button>
            </div>
        </aside>
      )}

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 pr-safe transition-all duration-300">
        
        {/* Header - Glassmorphic 3D */}
        {!isZenMode && (
            <header className="min-h-[4rem] h-auto bg-slate-900/40 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 transition-all duration-500 pt-safe">
            
            <div className="flex items-center gap-4 flex-1 py-3">
                <button 
                onClick={() => { play('CLICK'); setIsMobileMenuOpen(true); }}
                className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors btn-3d"
                >
                <Menu size={24} />
                </button>
                <div className="hidden sm:flex items-center gap-2 text-slate-500 text-sm font-mono">
                    <ShieldCheck size={14} className="text-green-500" />
                    <span>Protocol: <span className="text-white font-bold">TRUTH-ONLY</span></span>
                </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-6 ml-4 py-3">
                {/* Tactical Clock */}
                <div className="hidden lg:flex flex-col items-end text-slate-400 border-r border-slate-800 pr-4 group cursor-default">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-300 font-bold group-hover:text-primary-400 transition-colors">
                    <Clock size={12} className="text-primary-500 animate-pulse icon-3d-blue" />
                    {time.toLocaleTimeString('uk-UA', { hour12: false })}
                </div>
                <div className="text-[9px] text-slate-600 font-mono uppercase tracking-widest">
                    UTC+2 | KYIV
                </div>
                </div>

                {/* User Profile */}
                <div className="relative" ref={userMenuRef}>
                <button 
                    onClick={() => { play('CLICK'); setIsUserMenuOpen(!isUserMenuOpen); }}
                    onMouseEnter={() => play('HOVER')}
                    className="flex items-center gap-2 hover:bg-slate-800/50 p-1.5 rounded-full transition-all border border-transparent hover:border-slate-700 btn-3d"
                >
                    <div className="w-8 h-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full flex items-center justify-center border border-slate-700 shadow-inner shrink-0">
                    <User size={16} className="text-slate-400 icon-3d" />
                    </div>
                    <div className="hidden sm:block text-left">
                        <div className="text-xs font-bold text-slate-200">Admin Access</div>
                        <div className="text-[9px] text-primary-400 font-mono">ROOT-001</div>
                    </div>
                    <ChevronDown size={14} className="text-slate-500" />
                </button>

                {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-lg shadow-2xl z-50 animate-in slide-in-from-top-1 overflow-hidden panel-3d">
                    <div className="py-1">
                        <button onClick={() => { play('CLICK'); onLock(); }} className="w-full text-left px-4 py-2.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-white flex items-center gap-3 transition-colors">
                            <Lock size={14} /> Блокувати
                        </button>
                        <button onClick={() => { play('CLICK'); onLogout(); }} className="w-full text-left px-4 py-2.5 text-xs text-danger-400 hover:bg-red-900/20 hover:text-danger-300 flex items-center gap-3 transition-colors">
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
        <main className={`flex-1 overflow-y-auto p-3 sm:p-6 scroll-smooth custom-scrollbar relative z-0 pb-safe ${isZenMode ? 'p-0 sm:p-0' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
