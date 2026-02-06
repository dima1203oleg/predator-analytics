
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, Zap, Shield, Cpu, Activity, Settings,
  Eye, FileText, Database, Terminal, LogOut,
  Maximize2, Minimize2, Bell, Share2, Plus, Sparkles
} from 'lucide-react';
import { TabView } from '../../types';
import { useUser } from '../../context/UserContext';

interface ShellProps {
  children: React.ReactNode;
  activeTab: TabView;
  onTabChange: (tab: TabView) => void;
  onLogout: () => void;
}

const CommanderShell: React.FC<ShellProps> = ({ children, activeTab, onTabChange, onLogout }) => {
  const { user } = useUser();
  const [isZenMode, setIsZenMode] = useState(false);
  const [pulseIntensity, setPulseIntensity] = useState(1);

  // Neural pulse effect based on "System Intensity"
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseIntensity(0.5 + Math.random() * 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const topNavItems = [
    { id: TabView.OVERVIEW, label: 'Огляд', icon: <Activity size={20} />, color: 'text-amber-400' },
    { id: TabView.OMNISCIENCE, label: 'Всевидяче Око', icon: <Eye size={20} />, color: 'text-purple-400' },
    { id: TabView.SEARCH, label: 'Глибокий Пошук', icon: <Zap size={20} />, color: 'text-blue-400' },
    { id: TabView.AGENTS, label: 'Управління Роєм', icon: <Sparkles size={20} />, color: 'text-emerald-400' },
  ];

  return (
    <div className="flex h-screen bg-[#030303] text-slate-100 font-sans selection:bg-amber-500/30">
      {/* Background Neural Cortex Effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Deep Aura */}
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.08),transparent_70%)]"
          style={{ transition: 'opacity 2s ease-in-out', opacity: pulseIntensity * 0.5 }}
        />

        {/* Floating Neural Nodes */}
        <AnimatePresence>
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{
                        x: Math.random() * 100 + '%',
                        y: Math.random() * 100 + '%',
                        opacity: 0,
                        scale: 0.5
                    }}
                    animate={{
                        x: [null, Math.random() * 100 + '%'],
                        y: [null, Math.random() * 100 + '%'],
                        opacity: [0, 0.4, 0],
                        scale: [0.5, 1.2, 0.5]
                    }}
                    transition={{
                        duration: 10 + Math.random() * 20,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute w-1 h-1 bg-amber-400 rounded-full blur-[2px] shadow-[0_0_10px_#f59e0b]"
                />
            ))}
        </AnimatePresence>

        {/* Energy Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
            <defs>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0" />
                    <stop offset="50%" stopColor="#f59e0b" stopOpacity="1" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </linearGradient>
            </defs>
            <motion.path
                d="M -100 100 Q 400 300 1200 100"
                stroke="url(#lineGrad)"
                strokeWidth="2"
                fill="transparent"
                animate={{
                    d: [
                        "M -100 100 Q 400 300 1200 100",
                        "M -100 300 Q 600 100 1200 400",
                        "M -100 100 Q 400 300 1200 100"
                    ]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            />
        </svg>

        <div className="absolute inset-0 bg-cyber-grid opacity-[0.03]" />
      </div>

      {/* COMMANDER NAVIGATION - TOP FLOATING BAR */}
      <nav className="fixed top-4 lg:top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-[95%] lg:w-auto overflow-x-auto no-scrollbar justify-center">
        {topNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`
              relative flex items-center gap-2 lg:gap-3 px-3 lg:px-5 py-2 lg:py-2.5 rounded-xl transition-all group flex-shrink-0
              ${activeTab === item.id
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-slate-500 hover:text-white hover:bg-white/5'
              }
            `}
          >
            <span className={activeTab === item.id ? item.color : 'text-current transition-colors'}>
              {item.icon}
            </span>
            <span className="text-[10px] lg:text-xs font-black uppercase tracking-widest">{item.label}</span>
            {activeTab === item.id && (
              <motion.div
                layoutId="commander-nav-glow"
                className="absolute inset-0 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.2)] pointer-events-none"
              />
            )}
          </button>
        ))}
        <div className="w-[1px] h-8 bg-white/10 mx-2 hidden lg:block" />
        <button
          onClick={onLogout}
          className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all hidden lg:block"
          title="Завершити термінал"
        >
          <LogOut size={20} />
        </button>
      </nav>

      {/* LEFT QUICK CONSOLE */}
      {!isZenMode && (
        <aside className="fixed left-6 top-1/2 -translate-y-1/2 z-40 flex-col gap-4 hidden lg:flex">
          {[
            { id: TabView.DATABASES, icon: <Database size={24} />, label: 'Центр Даних' },
            { id: TabView.SYSTEM_HEALTH, icon: <Cpu size={24} />, label: 'Кортекс' },
            { id: TabView.SECURITY, icon: <Shield size={24} />, label: 'Захист' },
            { id: TabView.SETTINGS, icon: <Settings size={24} />, label: 'Налаштування' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                group relative w-14 h-14 flex items-center justify-center rounded-2xl border transition-all
                ${activeTab === item.id
                  ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.4)]'
                  : 'bg-black/40 text-slate-500 border-white/10 hover:border-amber-500/50 hover:text-amber-400'
                }
              `}
            >
              {item.icon}
              <span className="absolute left-full ml-4 px-3 py-1 bg-black border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {item.label}
              </span>
            </button>
          ))}
        </aside>
      )}

      {/* RIGHT SYSTEM STATUS */}
      {!isZenMode && (
        <aside className="fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col gap-6 w-64 p-6 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl hidden lg:flex">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">СТАТУС CEREBRO</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
            </div>

            <div className="space-y-3">
              {[
                { label: 'Нейромережа', value: 34, color: 'text-amber-400', glow: 'shadow-amber-500/20' },
                { label: 'Синхронізація', value: 99.8, color: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
                { label: 'Рівень Захисту', value: 100, color: 'text-blue-400', glow: 'shadow-blue-500/20' },
              ].map(stat => (
                <div key={stat.label} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-400">{stat.label}</span>
                    <span className={stat.color}>{stat.value}{stat.label.includes('Синхр') ? '%' : ''}</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.value}%` }}
                      className={`h-full bg-current ${stat.color} shadow-lg ${stat.glow}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-black font-black shadow-lg">
                {user?.name.charAt(0)}
              </div>
              <div>
                <div className="text-xs font-black uppercase text-white truncate w-32">{user?.name}</div>
                <div className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">МАЙСТЕР ПРОФІЛЬ</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-colors text-slate-400 hover:text-white flex items-center justify-center">
                <Bell size={16} />
              </button>
              <button className="p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-colors text-slate-400 hover:text-white flex items-center justify-center">
                <Share2 size={16} />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Main Experience Canvas */}
      <main className={`
        flex-1 flex flex-col transition-all duration-700 min-w-0
        ${isZenMode ? 'p-0' : 'p-4 pt-20 lg:p-12 lg:pl-32 lg:pr-80'}
      `}>
        <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.05, filter: 'blur(20px)' }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="min-h-full"
            >
              <div className="p-8 pb-32 relative z-10">
                {children}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Zen Toggle Button */}
          <button
            onClick={() => setIsZenMode(!isZenMode)}
            className="fixed bottom-6 right-6 w-12 h-12 flex items-center justify-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-slate-500 hover:text-amber-400 transition-all z-50 hover:scale-110 active:scale-95"
          >
            {isZenMode ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
          </button>
        </div>
      </main>

      {/* TOP DECORATIVE HUD LINE */}
      <div className="fixed top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent z-[60]" />
    </div>
  );
};

export default CommanderShell;
