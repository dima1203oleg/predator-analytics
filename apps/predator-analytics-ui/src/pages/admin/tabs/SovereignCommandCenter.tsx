import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Cpu, Zap, Shield, Database, 
  Layers, Boxes, Terminal, Box, Sparkles,
  BarChart3, BrainCircuit, Factory, HardDrive,
  Network, AlertTriangle, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NeuralCore } from '@/components/admin/visuals/NeuralCore';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { useSystemStatus, useSystemStats, useAIEngines } from '@/hooks/useAdminApi';

/**
 * 🦅 Sovereign Command Center | v60.0-ELITE
 * Головний пульт управління системою PREDATOR.
 * Консолідація телеметрії, ШІ-заводу та інфраструктурного ядра.
 */

// ─── Допоміжні компоненти ──────────────────────────────────────────────────────

const MiniStatus: React.FC<{ label: string; value: string; color?: string; icon: any }> = ({ label, value, color = 'rose', icon: Icon }) => (
  <div className="flex flex-col gap-1 p-3 bg-white/[0.02] border border-white/[0.05] rounded-sm group hover:border-white/10 transition-all">
    <div className="flex items-center justify-between">
      <span className="text-[7px] font-mono text-white/30 uppercase tracking-widest">{label}</span>
      <Icon size={10} className={cn("transition-colors", `text-${color}-500/40`)} />
    </div>
    <span className="text-[14px] font-black text-white/90">{value}</span>
  </div>
);

const PulseIndicator: React.FC<{ active?: boolean; color?: string }> = ({ active = true, color = 'rose' }) => (
  <div className="relative flex items-center justify-center w-2.5 h-2.5">
    {active && <div className={cn("absolute inset-0 rounded-full animate-ping opacity-40", `bg-${color}-500`)} />}
    <div className={cn("relative w-1.5 h-1.5 rounded-full shadow-[0_0_10px_rgba(225,29,72,1)]", `bg-${color}-500`)} />
  </div>
);

// ─── SovereignCommandCenter ────────────────────────────────────────────────────

export const SovereignCommandCenter: React.FC = () => {
  const { data: status } = useSystemStatus();
  const { data: stats } = useSystemStats();
  const { data: engines } = useAIEngines();

  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    vram: 5.4,
    throughput: 1240,
    activeTasks: 42,
    syncProgress: 98.4
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        vram: Math.min(8.0, Math.max(3.2, prev.vram + (Math.random() - 0.5) * 0.1)),
        throughput: Math.max(800, prev.throughput + (Math.random() - 0.5) * 50),
        activeTasks: Math.max(10, Math.min(100, prev.activeTasks + (Math.random() > 0.7 ? 1 : Math.random() < 0.3 ? -1 : 0)))
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const goToTab = (tabId: string) => {
    navigate(`/admin?tab=${tabId}`);
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6 overflow-hidden bg-[#050202] relative">
      {/* Background Ornaments */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-rose-500/[0.02] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-blue-500/[0.02] blur-[120px] pointer-events-none" />

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6 h-full relative z-10">
        
        {/* Left Sidebar: Infrastructure & AI Lab Pulse */}
        <div className="col-span-3 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          <TacticalCard variant="holographic" title="ЯДРО ІНФРАСТРУКТУРИ" className="bg-black/40 border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="grid grid-cols-2 gap-3 mt-4">
              <MiniStatus label="VRAM LOAD" value={`${metrics.vram.toFixed(1)} GB`} icon={Zap} />
              <MiniStatus label="NEURAL CORE" value="34%" icon={Cpu} color="emerald" />
              <MiniStatus label="NODE STATUS" value="ONLINE" icon={Shield} color="emerald" />
              <MiniStatus label="LATENCY" value="12ms" icon={Activity} />
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-[8px] font-mono text-white/30">
                  <span>SYSTEM STABILITY</span>
                  <span className="text-emerald-400 font-black tracking-widest">99.99%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '99.9%' }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-emerald-500/20 to-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  />
                </div>
              </div>
            </div>
          </TacticalCard>

          <TacticalCard variant="holographic" title="ОПЕРАЦІЙНІ ЛАБОРАТОРІЇ" className="bg-black/40 border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="space-y-3 mt-4">
              <motion.div 
                whileHover={{ scale: 1.02, x: 4 }}
                onClick={() => goToTab('auto-factory')}
                className="flex items-center justify-between p-3 bg-rose-500/5 border border-rose-500/10 rounded-sm cursor-pointer hover:bg-rose-500/10 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-500/10 rounded-sm group-hover:bg-rose-500/20 transition-colors">
                    <Factory size={14} className="text-rose-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white group-hover:text-rose-400 transition-colors">АВТО-ФАБРИКА ШІ</span>
                    <span className="text-[7px] font-mono text-white/30 uppercase tracking-tighter">OODA Cycle: Active</span>
                  </div>
                </div>
                <PulseIndicator />
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02, x: 4 }}
                onClick={() => goToTab('models')}
                className="flex items-center justify-between p-3 bg-blue-500/5 border border-blue-500/10 rounded-sm cursor-pointer hover:bg-blue-500/10 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-sm group-hover:bg-blue-500/20 transition-colors">
                    <BrainCircuit size={14} className="text-blue-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white group-hover:text-blue-400 transition-colors">FINE-TUNE ЦЕНТР</span>
                    <span className="text-[7px] font-mono text-white/30 uppercase tracking-tighter">ML Training active</span>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[1,2,3].map(i => <div key={i} className="w-1 h-1 bg-blue-500/40 rounded-full animate-pulse" style={{ animationDelay: `${i*0.2}s` }} />)}
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02, x: 4 }}
                onClick={() => goToTab('datasets')}
                className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-sm cursor-pointer hover:bg-emerald-500/10 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-sm group-hover:bg-emerald-500/20 transition-colors">
                    <Database size={14} className="text-emerald-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white group-hover:text-emerald-400 transition-colors">СТУДІЯ ДАТАСЕТІВ</span>
                    <span className="text-[7px] font-mono text-white/30 uppercase tracking-tighter">Syncing: 4.2 TB</span>
                  </div>
                </div>
                <RefreshCw size={10} className="text-emerald-500/40 animate-spin-slow" />
              </motion.div>
            </div>
          </TacticalCard>

          <TacticalCard variant="holographic" title="ДАТАСЕТИ: СИНХРОНІЗАЦІЯ" className="bg-black/40 border-white/5">
            <div className="space-y-4 mt-4">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[8px] font-mono text-white/30 uppercase tracking-[0.2em]">
                  <span>OSINT_GLOBAL_SYNC</span>
                  <span className="text-rose-500 font-black">98.4%</span>
                </div>
                <div className="h-[2px] bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: '98.4%' }}
                    className="h-full bg-gradient-to-r from-rose-500/40 to-rose-500 shadow-[0_0_10px_rgba(225,29,72,0.5)]"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-[8px] font-mono uppercase tracking-widest">
                <span className="text-white/20">Total Volume</span>
                <span className="text-white/60 font-black">4.2 TB</span>
              </div>
              <div className="flex items-center justify-between text-[8px] font-mono uppercase tracking-widest">
                <span className="text-white/20">Records Cached</span>
                <span className="text-white/60 font-black">12.8M</span>
              </div>
            </div>
          </TacticalCard>
        </div>

        {/* Center: 3D Neural Core & Global Command */}
        <div className="col-span-6 flex flex-col gap-6">
          <div className="flex-1 bg-black/40 border border-white/5 rounded-sm relative overflow-hidden group shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]">
            {/* Visualizer Header */}
            <div className="absolute top-0 left-0 right-0 p-8 flex items-start justify-between z-30 pointer-events-none">
              <div className="flex flex-col gap-2">
                <h3 className="text-white font-black tracking-[0.4em] text-[14px] uppercase italic drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                  Sovereign Neural Core
                </h3>
                <div className="flex items-center gap-4">
                  <div className="px-3 py-1 bg-rose-500 text-white text-[8px] font-black rounded-sm tracking-[0.2em] shadow-[0_0_15px_rgba(225,29,72,0.6)]">ELITE ACCESS</div>
                  <div className="flex items-center gap-3">
                    <PulseIndicator />
                    <span className="text-rose-500 font-mono text-[9px] tracking-[0.3em] uppercase font-black animate-pulse">Syncronizing Reality</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 opacity-60">
                <span className="text-white/60 font-mono text-[9px] tracking-widest">BUFFER_HEALTH: 100%</span>
                <span className="text-white/60 font-mono text-[9px] tracking-widest">CORE_TEMP: 42.4°C</span>
                <div className="w-24 h-[1px] bg-gradient-to-l from-rose-500/40 to-transparent mt-1" />
              </div>
            </div>

            {/* The 3D Core */}
            <div className="absolute inset-0 z-10 opacity-80 group-hover:opacity-100 transition-opacity duration-1000">
              <NeuralCore />
            </div>

            {/* Tactical Overlays */}
            <div className="absolute inset-0 pointer-events-none z-20">
               <div className="absolute top-1/2 left-8 -translate-y-1/2 w-[1px] h-32 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
               <div className="absolute top-1/2 right-8 -translate-y-1/2 w-[1px] h-32 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
               <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-64 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>

            {/* Interaction Buttons (Visual Only) */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-6">
              <motion.button 
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(225,29,72,0.4)' }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-rose-500 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-sm transition-all shadow-[0_0_30px_rgba(225,29,72,0.3)] border border-rose-400/50"
              >
                Force Recalibration
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-white/5 border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-[0.3em] rounded-sm transition-all"
              >
                Switch Mode
              </motion.button>
            </div>
          </div>

          <div className="h-40 grid grid-cols-3 gap-6">
             <div className="bg-rose-500/5 border border-rose-500/10 p-5 rounded-sm flex flex-col justify-between shadow-lg hover:border-rose-500/30 transition-all group">
                <span className="text-[8px] font-mono text-rose-500/60 uppercase tracking-[0.2em] font-black">Active Agents</span>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-black text-white italic drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{metrics.activeTasks}</span>
                  <Boxes size={24} className="text-rose-500/20 group-hover:text-rose-500/40 transition-colors" />
                </div>
             </div>
             <div className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-sm flex flex-col justify-between shadow-lg hover:border-white/10 transition-all group">
                <span className="text-[8px] font-mono text-white/30 uppercase tracking-[0.2em] font-black">System Throughput</span>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-black text-white italic drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{metrics.throughput.toFixed(0)} <small className="text-[10px] opacity-30 not-italic ml-1 tracking-tighter">req/s</small></span>
                  <Network size={24} className="text-white/5 group-hover:text-white/10 transition-colors" />
                </div>
             </div>
             <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-sm flex flex-col justify-between shadow-lg hover:border-emerald-500/30 transition-all group">
                <span className="text-[8px] font-mono text-emerald-500/60 uppercase tracking-[0.2em] font-black">Security Layer</span>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-black text-white italic drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] tracking-tighter">SECURED</span>
                  <Shield size={24} className="text-emerald-500/20 group-hover:text-emerald-500/40 transition-colors" />
                </div>
             </div>
          </div>
        </div>

        {/* Right Sidebar: Real-time Command Log & Alerts */}
        <div className="col-span-3 flex flex-col gap-6">
          <TacticalCard variant="holographic" title="СТРАТЕГІЧНИЙ РЕЗЕРВ" className="bg-black/40 border-rose-500/10 shadow-[0_0_50px_rgba(225,29,72,0.05)]">
            <div className="grid grid-cols-1 gap-4 mt-4">
              <div className="flex items-center justify-between p-3 bg-rose-500/5 border border-rose-500/10 rounded-sm cursor-pointer hover:bg-rose-500/10 transition-all group">
                <div className="flex items-center gap-3">
                  <BrainCircuit size={16} className="text-rose-500 group-hover:scale-110 transition-transform" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white">FINE-TUNE ENGINE</span>
                    <span className="text-[7px] font-mono text-white/30 uppercase tracking-tighter">Active Optimization</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[10px] font-black text-rose-500">92%</span>
                   <div className="w-12 h-[2px] bg-white/5 rounded-full mt-1 overflow-hidden">
                      <motion.div animate={{ width: '92%' }} className="h-full bg-rose-500 shadow-[0_0_5px_rgba(225,29,72,0.8)]" />
                   </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-500/5 border border-blue-500/10 rounded-sm cursor-pointer hover:bg-blue-500/10 transition-all group">
                <div className="flex items-center gap-3">
                  <Database size={16} className="text-blue-500 group-hover:scale-110 transition-transform" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white">DATASET STUDIO</span>
                    <span className="text-[7px] font-mono text-white/30 uppercase tracking-tighter">Global Sync Active</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[10px] font-black text-blue-500 italic font-mono">12.8M</span>
                   <span className="text-[6px] font-mono text-white/20 uppercase tracking-widest">RECORDS</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-sm cursor-pointer hover:bg-emerald-500/10 transition-all group">
                <div className="flex items-center gap-3">
                  <Factory size={16} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white">AI FACTORY PROD</span>
                    <span className="text-[7px] font-mono text-white/30 uppercase tracking-tighter">OODA Cycle Locked</span>
                  </div>
                </div>
                <PulseIndicator color="emerald" />
              </div>
            </div>
          </TacticalCard>

          <TacticalCard variant="holographic" title="ОПЕРАЦІЙНИЙ ЖУРНАЛ" className="flex-1 bg-black/40 border-white/5 flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="flex-1 overflow-y-auto mt-4 pr-2 custom-scrollbar space-y-3 font-mono text-[9px]">
              {[
                { time: '14:20:01', msg: 'CORE_HANDSHAKE: OK', type: 'info' },
                { time: '14:20:05', msg: 'VRAM_ALLOCATION: OPTIMIZED', type: 'info' },
                { time: '14:20:12', msg: 'FACTORY_AUTO_UPDATE: IN_PROGRESS', type: 'info' },
                { time: '14:20:20', msg: 'MODEL_TRAINING: EPOCH_42_COMPLETE', type: 'success' },
                { time: '14:20:32', msg: 'NEURAL_LINK: STABLE', type: 'success' },
                { time: '14:20:45', msg: 'DATASET_RELOAD: COMPLETED', type: 'info' },
                { time: '14:21:01', msg: 'OODA_PHASE: DECIDE', type: 'info' },
                { time: '14:21:10', msg: 'THREAT_DETECTION: NO_THREATS', type: 'success' },
                { time: '14:21:15', msg: 'SYSTEM_VERSION: v60.5-ELITE', type: 'info' },
              ].map((log, i) => (
                <div key={i} className="flex gap-3 opacity-60 hover:opacity-100 transition-opacity group/log">
                  <span className="text-white/20 whitespace-nowrap group-hover/log:text-rose-500/40 transition-colors">[{log.time}]</span>
                  <span className={cn(
                    log.type === 'success' ? 'text-emerald-500' : 'text-white/70'
                  )}>{log.msg}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-sm group/input cursor-text">
                <Terminal size={12} className="text-white/30 group-hover:text-rose-500 transition-colors" />
                <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest animate-pulse">СИСТЕМА ГОТОВА ДО КОМАНД_</span>
              </div>
            </div>
          </TacticalCard>
        </div>
      </div>
    </div>
  );
};

export default SovereignCommandCenter;
