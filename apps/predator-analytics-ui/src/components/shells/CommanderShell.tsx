import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, Zap, Shield, Cpu, Activity, Settings,
  Eye, FileText, Database, Terminal, LogOut,
  Maximize2, Minimize2, Bell, Share2, Plus, Sparkles,
  Command, ChevronRight
} from 'lucide-react';
import { TabView } from '../../types';
import { useUser } from '../../context/UserContext';
import { api } from '../../services/api';

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
  const [metrics, setMetrics] = useState({ cpu: 0, sync: 99.8, safety: 100 });

  // Neural pulse effect based on real System Intensity
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await api.v45.getRealtimeMetrics();
        if (data) {
          setMetrics({
            cpu: data.cpu_usage || 0,
            sync: 99.9,
            safety: 100
          });
          setPulseIntensity(0.5 + (data.cpu_usage / 100));
        }
      } catch (e) {
         console.warn("Commander Shell metrics synchronization failed");
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);
    return () => clearInterval(interval);
  }, []);

  const topNavItems = [
    { id: TabView.OVERVIEW, label: 'ОГЛЯД', icon: <Activity size={18} />, color: 'text-rose-500' },
    { id: TabView.OMNISCIENCE, label: 'ВСЕВИДЯЧЕ ОКО', icon: <Eye size={18} />, color: 'text-purple-500' },
    { id: TabView.SEARCH, label: 'ГЛИБОКИЙ ПОШУК', icon: <Zap size={18} />, color: 'text-rose-400' },
    { id: TabView.AGENTS, label: 'УПРАВЛІННЯ  ОЄМ', icon: <Sparkles size={18} />, color: 'text-emerald-500' },
  ];

  const sideNavItems = [
    { id: TabView.DATABASES, icon: <Database size={24} />, label: 'ЦЕНТ  ДАНИХ' },
    { id: TabView.SYSTEM_HEALTH, icon: <Cpu size={24} />, label: 'КОРТЕКС' },
    { id: TabView.SECURITY, icon: <Shield size={24} />, label: 'БЕЗПЕКА' },
    { id: TabView.SETTINGS, icon: <Settings size={24} />, label: 'НАЛАШТУВАННЯ' },
  ];

  return (
    <div className="flex h-screen bg-[#02040a] text-slate-100 font-sans selection:bg-rose-500/30 overflow-hidden">
      {/* ELITE Ambient Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Crimson Aura */}
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(244,63,94,0.12),transparent_70%)]"
          style={{ transition: 'opacity 3s ease-in-out', opacity: pulseIntensity * 0.4 }}
        />
        
        {/* Static Noise Overlay */}
        <div className="absolute inset-0 opacity-[0.015] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

        {/* Neural Nodes (Crimson) */}
        <AnimatePresence>
            {[...Array(15)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{
                        x: Math.random() * 100 + '%',
                        y: Math.random() * 100 + '%',
                        opacity: 0,
                        scale: 0.2
                    }}
                    animate={{
                        x: [null, Math.random() * 100 + '%'],
                        y: [null, Math.random() * 100 + '%'],
                        opacity: [0, 0.3, 0],
                        scale: [0.2, 0.8, 0.2]
                    }}
                    transition={{
                        duration: 15 + Math.random() * 25,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute w-1 h-1 bg-rose-500 rounded-full blur-[1px] shadow-[0_0_8px_#f43f5e]"
                />
            ))}
        </AnimatePresence>

        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
      </div>

      {/* TOP COMMANDER HUD */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-20 bg-black/60 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between px-8">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative">
              <div className="absolute inset-0 bg-rose-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative p-2 bg-rose-950/30 border border-rose-500/30 rounded-xl">
                <Crown className="w-6 h-6 text-rose-500" />
              </div>
            </div>
            <div>
              <div className="text-xs font-black tracking-[0.3em] text-white">PREDATOR</div>
              <div className="text-[9px] font-bold text-rose-500/80 tracking-widest uppercase">V58.2 ELITE ELITE</div>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-white/10" />

          <div className="flex items-center gap-2">
            {topNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`
                  relative flex items-center gap-3 px-6 py-2.5 rounded-xl transition-all group
                  ${activeTab === item.id
                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <span className={activeTab === item.id ? item.color : 'text-current transition-colors'}>
                  {item.icon}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                {activeTab === item.id && (
                  <motion.div
                    layoutId="top-nav-indicator"
                    className="absolute -bottom-[21px] left-0 right-0 h-[2px] bg-rose-500 shadow-[0_0_15px_#f43f5e]"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden xl:flex flex-col items-end">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-emerald-500">UPLINK STABLE</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <span className="text-[9px] font-mono text-slate-500">NODE: 192.168.0.199</span>
          </div>

          <div className="h-8 w-[1px] bg-white/10" />

          <div className="flex items-center gap-4">
            <button className="relative p-2.5 text-slate-400 hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-black" />
            </button>
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl transition-all group"
            >
              <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
              <span className="text-[10px] font-black">ВИХІД</span>
            </button>
          </div>
        </div>
      </nav>

      {/* SIDEBAR NAVIGATION */}
      {!isZenMode && (
        <aside className="fixed left-0 top-20 bottom-0 w-24 bg-black/40 backdrop-blur-2xl border-r border-white/5 flex flex-col items-center py-10 gap-6 z-40">
          {sideNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                group relative w-14 h-14 flex items-center justify-center rounded-2xl border transition-all
                ${activeTab === item.id
                  ? 'bg-rose-500 text-black border-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.4)]'
                  : 'bg-black/40 text-slate-500 border-white/10 hover:border-rose-500/50 hover:text-rose-400'
                }
              `}
            >
              {item.icon}
              <div className="absolute left-full ml-4 px-3 py-1.5 bg-rose-950 border border-rose-500/30 rounded-lg text-[9px] font-black text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none tracking-widest whitespace-nowrap z-50">
                {item.label}
              </div>
            </button>
          ))}
          
          <div className="mt-auto flex flex-col items-center gap-4 pb-8">
            <button
              onClick={() => setIsZenMode(!isZenMode)}
              className="p-3 text-slate-500 hover:text-rose-500 transition-colors"
              title="режим концентрації"
            >
              {isZenMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          </div>
        </aside>
      )}

      {/* MAIN CONTENT AREA */}
      <main className={`
        flex-1 relative z-10 transition-all duration-500 ease-in-out
        ${isZenMode ? 'ml-0' : 'ml-24'} mt-20 overflow-hidden flex
      `}>
        {/* Dynamic Viewport */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="p-8 pb-24"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* SYSTEM ANALYTICS DRAWER (Right Side) */}
        {!isZenMode && (
          <aside className="w-80 bg-black/40 backdrop-blur-3xl border-l border-white/5 flex flex-col p-6 gap-8 overflow-y-auto hidden 2xl:flex">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">ТЕЛЕМЕТ ІЯ СИСТЕМИ</span>
                <Activity size={14} className="text-rose-500 animate-pulse" />
              </div>

              <div className="space-y-4">
                {[
                  { label: 'ЯДРО AI', value: metrics.cpu, color: 'bg-rose-500', text: 'text-rose-500' },
                  { label: 'СИНХРОНІЗАЦІЯ ДАНИХ', value: metrics.sync, color: 'bg-emerald-500', text: 'text-emerald-500' },
                  { label: 'МАТрИЦЯ БЕЗПЕКИ', value: metrics.safety, color: 'bg-rose-400', text: 'text-rose-400' },
                ].map(stat => (
                  <div key={stat.label} className="space-y-2">
                    <div className="flex justify-between text-[9px] font-black tracking-widest uppercase">
                      <span className="text-slate-500">{stat.label}</span>
                      <span className={stat.text}>{stat.value}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stat.value}%` }}
                        className={`h-full ${stat.color} shadow-[0_0_10px_currentColor]`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center text-black font-black text-sm shadow-lg shadow-rose-500/20">
                  {user?.name.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-black text-white uppercase tracking-wider">{user?.name}</div>
                  <div className="text-[9px] font-bold text-rose-500/80 uppercase tracking-tighter">OPERATOR ELITE</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[9px] text-slate-500 font-mono">
                <Shield size={10} />
                <span>LEVEL 5 ACCESS GRANTED</span>
              </div>
            </div>

            <div className="mt-auto space-y-4">
               <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ПОТОЧНИЙ ВУЗОЛ</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-white">NVIDIA_QUADRO_V1</span>
                    <span className="text-[10px] text-emerald-500 uppercase font-bold">ONLINE</span>
                  </div>
               </div>
            </div>
          </aside>
        )}
      </main>

      {/* SCANLINE EFFECT */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] bg-scanline animate-scanline" />
      
      {/* VIGNETTE */}
      <div className="fixed inset-0 pointer-events-none z-[90] shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />
    </div>
  );
};

export default CommanderShell;
