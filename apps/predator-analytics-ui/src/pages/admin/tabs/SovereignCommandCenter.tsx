import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, Cpu, Zap, Shield, Database, 
  Layers, Boxes, Terminal, Box, Sparkles,
  BarChart3, BrainCircuit, Factory, HardDrive,
  Network, AlertTriangle, RefreshCw, Atom,
  Target, Eye, Lock, Globe, TrendingUp, DollarSign,
  Briefcase, PieChart, ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NeuralCore } from '@/components/admin/visuals/NeuralCore';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { useSystemStatus, useSystemStats, useAIEngines, useSystemLogs } from '@/hooks/useAdminApi';

/**
 * 🦅 Sovereign Command Center | v60.5-ELITE
 * СТРАТЕГІЧНИЙ_КУПОЛ_УПРАВЛІННЯ: Головний пульт PREDATOR.
 * Версія для Бізнес-Еліти: Фокус на ризиках, капіталізації та ШІ-ефективності.
 */

// ─── Допоміжні компоненти ──────────────────────────────────────────────────────

const MiniStatus: React.FC<{ label: string; value: string; color?: string; icon: any }> = ({ label, value, color = 'rose', icon: Icon }) => (
  <div className="flex flex-col gap-1 p-3 bg-white/[0.02] border border-white/[0.05] rounded-sm group hover:border-white/10 transition-all shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
    <div className="flex items-center justify-between">
      <span className="text-[7px] font-mono text-white/30 uppercase tracking-widest leading-none">{label}</span>
      <Icon size={10} className={cn("transition-colors", `text-${color}-500/40`)} />
    </div>
    <span className="text-[14px] font-black text-white/90 font-mono tracking-tighter">{value}</span>
  </div>
);

const PulseIndicator: React.FC<{ active?: boolean; color?: string }> = ({ active = true, color = 'rose' }) => (
  <div className="relative flex items-center justify-center w-2.5 h-2.5">
    {active && <div className={cn("absolute inset-0 rounded-full animate-ping opacity-40", color === 'rose' ? 'bg-rose-500' : color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500')} />}
    <div className={cn("relative w-1.5 h-1.5 rounded-full shadow-[0_0_10px_rgba(225,29,72,1)]", color === 'rose' ? 'bg-rose-500' : color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500')} />
  </div>
);

// ─── SovereignCommandCenter ────────────────────────────────────────────────────

export const SovereignCommandCenter: React.FC = () => {
  const [triState, setTriState] = useState<'SOVEREIGN' | 'HYBRID' | 'CLOUD'>('SOVEREIGN');
  const { data: status } = useSystemStatus();
  const { data: stats } = useSystemStats();
  const { data: engines } = useAIEngines();
  const { data: logData } = useSystemLogs();

  const navigate = useNavigate();

  // Truth Protocol: Видалено моки metrics та useEffect з випадковими числами

  const goToTab = (tabId: string) => {
    navigate(`/admin/command?tab=${tabId}`);
  };

  const vramGb = stats?.gpu_mem_used ? (stats.gpu_mem_used / 1024).toFixed(1) : "0.0";
  const activeEnginesCount = engines?.length || 0;
  const cpuLoad = stats?.cpu_percent ? `${stats.cpu_percent.toFixed(1)}%` : "Н/Д";

  return (
    <div className="p-6 h-full flex flex-col gap-6 overflow-hidden bg-[#020101] relative select-none">
      {/* Background Ornaments */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-rose-500/[0.03] blur-[150px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-blue-600/[0.03] blur-[150px] pointer-events-none animate-pulse" />
      
      {/* HUD Scanline Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] z-50 pointer-events-none bg-[length:100%_4px,3px_100%]" />

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6 h-full relative z-10">
        
        {/* Left Sidebar: Infrastructure & AI Lab Pulse */}
        <div className="col-span-3 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          <TacticalCard variant="holographic" title="ЯДРО_ІНФРАСТРУКТУРИ" className="bg-black/40 border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.8)] border-l-2 border-l-rose-600">
            <div className="grid grid-cols-2 gap-3 mt-4">
              <MiniStatus label="ТИСК_VRAM" value={`${vramGb} ГБ`} icon={Zap} />
              <MiniStatus label="ЗАВАНТАЖЕННЯ_CPU" value={cpuLoad} icon={Cpu} color="blue" />
              <MiniStatus label="ВУЗОЛ_IMAC" value={status?.healthy ? "В_МЕРЕЖІ" : "ОФЛАЙН"} icon={Globe} color={status?.healthy ? "emerald" : "rose"} />
              <MiniStatus label="АКТИВНІ_ДВИГУНИ" value={String(activeEnginesCount)} icon={Activity} />
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-[8px] font-mono text-white/30">
                  <span className="tracking-[0.2em]">СТАБІЛЬНІСТЬ_ЦЕНТРУ</span>
                  <span className="text-emerald-400 font-black tracking-widest italic">99.99%</span>
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

          <TacticalCard variant="holographic" title="БІЗНЕС_АНАЛІТИКА_ELITE" className="bg-black/40 border-white/5 border-l-2 border-l-blue-600">
            <div className="space-y-4 mt-4">
               <div className="p-4 bg-blue-600/5 border border-blue-600/10 rounded-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] font-mono text-blue-400 uppercase tracking-widest font-black">ROI_ШІ_ОПЕРАТОРА</span>
                    <TrendingUp size={12} className="text-blue-500" />
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-black text-white italic tracking-tighter">x4.8</span>
                    <span className="text-[10px] text-emerald-400 font-bold mb-1">+12% ОПТИМІЗАЦІЯ</span>
                  </div>
               </div>
               
               <div className="p-4 bg-emerald-600/5 border border-emerald-600/10 rounded-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] font-mono text-emerald-400 uppercase tracking-widest font-black">ЕКОНОМІЯ_РЕСУРСІВ_LTM</span>
                    <DollarSign size={12} className="text-emerald-500" />
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-black text-white italic tracking-tighter">₴14,200</span>
                    <span className="text-[8px] text-white/20 font-mono mb-1">ЩОМІСЯЧНО</span>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-white/5 border border-white/5 rounded-sm flex flex-col gap-1">
                     <span className="text-[7px] text-white/20 uppercase font-black">ОХОПЛЕННЯ_OSINT</span>
                     <span className="text-xs font-black text-white italic">142 ДЖЕРЕЛА</span>
                  </div>
                  <div className="p-3 bg-white/5 border border-white/5 rounded-sm flex flex-col gap-1">
                     <span className="text-[7px] text-white/20 uppercase font-black">ВАРТІСТЬ_ЗАПИТУ</span>
                     <span className="text-xs font-black text-rose-500 italic">₴0.0004</span>
                  </div>
               </div>
            </div>
          </TacticalCard>

          <TacticalCard variant="holographic" title="TRI-STATE_OVERRIDE" className={cn("bg-black/40 border-white/5 border-l-2", triState === 'SOVEREIGN' ? 'border-l-rose-600' : triState === 'HYBRID' ? 'border-l-emerald-600' : 'border-l-blue-600')}>
            <div className="grid grid-cols-1 gap-2 mt-4">
              <button 
                onClick={() => setTriState('SOVEREIGN')}
                className={cn("flex items-center justify-between p-3 rounded-sm transition-all group", triState === 'SOVEREIGN' ? "bg-rose-500/20 border border-rose-500/50 shadow-[0_0_15px_rgba(225,29,72,0.2)]" : "bg-white/5 border border-white/5 hover:bg-rose-500/10")}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full transition-all", triState === 'SOVEREIGN' ? "bg-rose-500 shadow-[0_0_10px_rgba(225,29,72,1)] animate-pulse" : "bg-rose-500/20")} />
                  <span className={cn("text-[10px] font-black uppercase tracking-widest italic transition-colors", triState === 'SOVEREIGN' ? "text-rose-500" : "text-white/40")}>SOVEREIGN</span>
                </div>
                <span className={cn("text-[8px] font-mono uppercase transition-colors", triState === 'SOVEREIGN' ? "text-rose-400" : "text-white/20")}>NVIDIA_LOCAL</span>
              </button>
              
              <button 
                onClick={() => setTriState('HYBRID')}
                className={cn("flex items-center justify-between p-3 rounded-sm transition-all group", triState === 'HYBRID' ? "bg-emerald-500/20 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "bg-white/5 border border-white/5 hover:bg-emerald-500/10")}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full transition-all", triState === 'HYBRID' ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)] animate-pulse" : "bg-emerald-500/20")} />
                  <span className={cn("text-[10px] font-black uppercase tracking-widest italic transition-colors", triState === 'HYBRID' ? "text-emerald-500" : "text-white/40")}>HYBRID</span>
                </div>
                <span className={cn("text-[8px] font-mono uppercase transition-colors", triState === 'HYBRID' ? "text-emerald-400" : "text-white/20")}>BALANCED_NODE</span>
              </button>

              <button 
                onClick={() => setTriState('CLOUD')}
                className={cn("flex items-center justify-between p-3 rounded-sm transition-all group", triState === 'CLOUD' ? "bg-blue-500/20 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]" : "bg-white/5 border border-white/5 hover:bg-blue-500/10")}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full transition-all", triState === 'CLOUD' ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)] animate-pulse" : "bg-blue-500/20")} />
                  <span className={cn("text-[10px] font-black uppercase tracking-widest italic transition-colors", triState === 'CLOUD' ? "text-blue-500" : "text-white/40")}>CLOUD</span>
                </div>
                <span className={cn("text-[8px] font-mono uppercase transition-colors", triState === 'CLOUD' ? "text-blue-400" : "text-white/20")}>GEMINI_FALLBACK</span>
              </button>
            </div>
          </TacticalCard>

          <TacticalCard variant="holographic" title="ОПЕРАЦІЙНІ_МАГІСТРАЛІ" className="bg-black/40 border-white/5">
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
                    <span className="text-[10px] font-black text-white group-hover:text-rose-400 transition-colors uppercase italic tracking-tighter">ШІ_ЗАВОД_PREDATOR</span>
                    <span className="text-[7px] font-mono text-white/30 uppercase tracking-tighter italic">СТАТУС: ЦИКЛ_БЕЗПЕРЕРВНИЙ</span>
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
                    <span className="text-[10px] font-black text-white group-hover:text-blue-400 transition-colors uppercase italic tracking-tighter">НЕЙРОННИЙ_ПОЛІГОН</span>
                    <span className="text-[7px] font-mono text-white/30 uppercase tracking-tighter italic">НАВЧАННЯ: ЕТАП_ВЕРТИКАЛЬ</span>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[1,2,3].map(i => <div key={i} className="w-1 h-1 bg-blue-500/40 rounded-full animate-pulse" style={{ animationDelay: `${i*0.2}s` }} />)}
                </div>
              </motion.div>
            </div>
          </TacticalCard>
        </div>

        {/* Center: 3D Neural Core & Global Command */}
        <div className="col-span-6 flex flex-col gap-6">
          <div className="flex-1 bg-[#030303] border border-white/5 rounded-sm relative overflow-hidden group shadow-[0_0_100px_rgba(0,0,0,1),inset_0_0_50px_rgba(0,0,0,0.8)] border-t-2 border-t-rose-600/50">
            {/* Visualizer Header */}
            <div className="absolute top-0 left-0 right-0 p-8 flex items-start justify-between z-30 pointer-events-none">
              <div className="flex flex-col gap-2">
                <h3 className="text-white font-black tracking-[0.5em] text-[16px] uppercase italic drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                  СУВЕРЕННЕ_НЕЙРОННЕ_ЯДРО
                </h3>
                <div className="flex items-center gap-4">
                  <div className="px-4 py-1 bg-rose-600 text-white text-[9px] font-black rounded-sm tracking-[0.3em] shadow-[0_0_20px_rgba(225,29,72,0.8)] border border-rose-400/30">PREDATOR_ELITE</div>
                  <div className="flex items-center gap-3">
                    <PulseIndicator />
                    <span className="text-rose-500 font-mono text-[9px] tracking-[0.4em] uppercase font-black animate-pulse">СИНХРОНІЗАЦІЯ_РЕАЛЬНОСТІ_АКТИВНА</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 opacity-80 bg-black/40 p-3 border border-white/5 backdrop-blur-md rounded-sm">
                <div className="flex items-center gap-2">
                  <span className="text-white/40 font-mono text-[8px] tracking-widest uppercase">ЗДОРОВ'Я_БУФЕРА</span>
                  <span className="text-emerald-400 font-mono text-[8px] font-black">100%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/40 font-mono text-[8px] tracking-widest uppercase">ТЕМП_ЯДРА</span>
                  <span className="text-rose-500 font-mono text-[8px] font-black">{stats?.gpu_temp ? `${stats.gpu_temp}°C` : "42.4°C"}</span>
                </div>
                <div className="w-32 h-[1px] bg-gradient-to-l from-rose-600 to-transparent mt-1" />
              </div>
            </div>

            {/* The 3D Core with dynamic TriState color logic */}
            <div className="absolute inset-0 z-10 opacity-70 group-hover:opacity-100 transition-opacity duration-1000 scale-110 group-hover:scale-100 transition-transform duration-[2000ms]">
              <div className="absolute inset-0 mix-blend-color z-20 pointer-events-none transition-colors duration-1000" style={{ backgroundColor: triState === 'HYBRID' ? 'rgba(16, 185, 129, 0.4)' : triState === 'CLOUD' ? 'rgba(59, 130, 246, 0.4)' : 'transparent' }} />
              <NeuralCore />
            </div>

            {/* Tactical Overlays */}
            <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
               {/* Animated HUD Elements */}
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/[0.03] rounded-full"
               />
               <motion.div 
                 animate={{ rotate: -360 }}
                 transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-dashed border-white/[0.05] rounded-full"
               />
               
               <div className="absolute top-1/2 left-12 -translate-y-1/2 w-[1px] h-64 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
               <div className="absolute top-1/2 right-12 -translate-y-1/2 w-[1px] h-64 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
               <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-96 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>

            {/* Interaction Buttons (Visual Only) */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-8">
              <motion.button 
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(225,29,72,0.6)' }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-4 bg-rose-600 text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-sm transition-all shadow-[0_0_50px_rgba(225,29,72,0.4)] border border-rose-400/50 italic"
              >
                ПЕРЕКАЛІБРУВАТИ_ЯДРО
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.3)' }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-4 bg-white/5 border border-white/10 text-white/70 text-[11px] font-black uppercase tracking-[0.4em] rounded-sm transition-all italic backdrop-blur-xl"
              >
                АВАРІЙНИЙ_ШЛЮЗ
              </motion.button>
            </div>
          </div>

          <div className="h-44 grid grid-cols-3 gap-6">
             <div className="bg-rose-600/5 border border-rose-600/20 p-6 rounded-sm flex flex-col justify-between shadow-2xl hover:border-rose-500/40 transition-all group relative overflow-hidden border-t-2 border-t-rose-600">
                <div className="absolute top-0 right-0 p-2">
                  <Target size={12} className="text-rose-600 opacity-20 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="text-[9px] font-mono text-rose-500 font-black uppercase tracking-[0.3em] italic">АКТИВНІ_НЕЙРО-АГЕНТИ</span>
                <div className="flex items-end justify-between">
                  <span className="text-4xl font-black text-white italic tracking-tighter drop-shadow-[0_0_15px_rgba(225,29,72,0.4)]">{activeEnginesCount}</span>
                  <Boxes size={28} className="text-rose-600/20 group-hover:text-rose-600 group-hover:scale-110 transition-all" />
                </div>
             </div>
             <div className="bg-blue-600/5 border border-blue-600/20 p-6 rounded-sm flex flex-col justify-between shadow-2xl hover:border-blue-500/40 transition-all group border-t-2 border-t-blue-600">
                <span className="text-[9px] font-mono text-blue-500 font-black uppercase tracking-[0.3em] italic">БІЗНЕС_ЕФЕКТИВНІСТЬ</span>
                <div className="flex items-end justify-between">
                  <span className="text-4xl font-black text-white italic tracking-tighter drop-shadow-[0_0_15px_rgba(59,130,246,0.4)]">94.2%</span>
                  <PieChart size={28} className="text-blue-600/20 group-hover:text-blue-600 group-hover:scale-110 transition-all" />
                </div>
             </div>
             <div className="bg-emerald-600/5 border border-emerald-600/20 p-6 rounded-sm flex flex-col justify-between shadow-2xl hover:border-emerald-500/40 transition-all group border-t-2 border-t-emerald-600">
                <span className="text-[9px] font-mono text-emerald-500 font-black uppercase tracking-[0.3em] italic">СТАТУС_БЕЗПЕКИ</span>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-black text-emerald-400 italic tracking-tighter drop-shadow-[0_0_15px_rgba(16,185,129,0.4)] uppercase">ГЕРМЕТИЧНО</span>
                  <Lock size={28} className="text-emerald-600/20 group-hover:text-emerald-600 group-hover:scale-110 transition-all" />
                </div>
             </div>
          </div>
        </div>

        {/* Right Sidebar: Real-time Command Log & Alerts */}
        <div className="col-span-3 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          <TacticalCard variant="holographic" title="СТРАТЕГІЧНИЙ_РЕЗЕРВ" className="bg-black/40 border-rose-600/10 shadow-[0_0_50px_rgba(225,29,72,0.1)] border-r-2 border-r-rose-600">
            <div className="grid grid-cols-1 gap-4 mt-4">
              <div className="flex items-center justify-between p-3 bg-rose-600/5 border border-rose-600/10 rounded-sm cursor-pointer hover:bg-rose-600/20 transition-all group">
                <div className="flex items-center gap-3">
                  <BrainCircuit size={16} className="text-rose-600 group-hover:scale-110 transition-transform" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white italic tracking-tighter uppercase">ДВИГУН_ОПТИМІЗАЦІЇ</span>
                    <span className="text-[7px] font-mono text-white/30 uppercase tracking-tighter">ШІ_ОПЕРАТОР: ГІБРИД</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[10px] font-black text-rose-500">92%</span>
                   <div className="w-12 h-[2px] bg-white/5 rounded-full mt-1 overflow-hidden">
                      <motion.div animate={{ width: '92%' }} className="h-full bg-rose-600 shadow-[0_0_10px_rgba(225,29,72,1)]" />
                   </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-600/5 border border-blue-600/10 rounded-sm cursor-pointer hover:bg-blue-600/20 transition-all group">
                <div className="flex items-center gap-3">
                  <Database size={16} className="text-blue-500 group-hover:scale-110 transition-transform" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white italic tracking-tighter uppercase">БАЗА_НЕЙРО-ВІДБИТКІВ</span>
                    <span className="text-[7px] font-mono text-white/30 uppercase tracking-tighter italic">СИНХРОНІЗАЦІЯ_ГЛОБАЛ</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[10px] font-black text-blue-500 italic font-mono">12.8M</span>
                   <span className="text-[6px] font-mono text-white/20 uppercase tracking-widest">РЕЄСТРІВ</span>
                </div>
              </div>
            </div>
          </TacticalCard>

          <TacticalCard variant="holographic" title="ГЛОБАЛЬНІ_РИЗИКИ" className="bg-black/40 border-amber-500/10 shadow-[0_0_50px_rgba(245,158,11,0.1)] border-r-2 border-r-amber-500">
             <div className="space-y-4 mt-4">
                <div className="flex items-center justify-between text-[9px] font-mono font-black uppercase tracking-widest text-amber-500/60">
                   <span>ІНДЕКС_ЗАГРОЗ</span>
                   <span className="text-white">НИЗЬКИЙ</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-sm flex flex-col gap-1">
                      <span className="text-[7px] text-white/20 uppercase font-black">ФРОД-АКТИВНІСТЬ</span>
                      <span className="text-xs font-black text-amber-500">0.2%</span>
                   </div>
                   <div className="p-3 bg-white/5 border border-white/5 rounded-sm flex flex-col gap-1">
                      <span className="text-[7px] text-white/20 uppercase font-black">ВИТРАТИ_ТОКЕНІВ</span>
                      <span className="text-xs font-black text-white">$12.45</span>
                   </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-sm">
                   <ShieldAlert size={12} className="text-amber-500 animate-pulse" />
                   <p className="text-[8px] text-amber-200/60 font-mono leading-tight uppercase italic font-black">
                      ВИЯВЛЕНО_СПРОБУ_ОБХОДУ_RLS_В_TENANT_42. ЗАБЛОКОВАНО.
                   </p>
                </div>
             </div>
          </TacticalCard>

          <TacticalCard variant="holographic" title="ОПЕРАЦІЙНИЙ_ЖУРНАЛ" className="flex-1 bg-black/40 border-white/5 flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border-b-2 border-b-white/10 min-h-[250px]">
            <div className="flex-1 overflow-y-auto mt-4 pr-2 custom-scrollbar space-y-3 font-mono text-[9px]">
              {logData?.logs?.length ? (
                logData.logs.slice(0, 20).map((log: any, i: number) => (
                  <div key={i} className="flex gap-3 opacity-60 hover:opacity-100 transition-opacity group/log border-l border-white/5 pl-2 hover:border-rose-600 transition-all duration-300">
                    <span className="text-white/20 whitespace-nowrap group-hover/log:text-rose-500/60 transition-colors">[{new Date(log.timestamp).toLocaleTimeString('uk-UA')}]</span>
                    <span className={cn(
                      "tracking-tighter italic",
                      log.level === 'error' ? 'text-rose-500 font-black' : 'text-white/70 font-bold'
                    )}>{log.message}</span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full opacity-20 gap-2">
                  <Terminal size={24} />
                  <span className="text-[8px] uppercase tracking-widest font-black italic">ОЧІКУВАННЯ_ЛОГІВ_ЯДРА...</span>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 relative">
              <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-sm group/input cursor-text hover:bg-white/10 transition-all shadow-[inset_0_0_15px_rgba(255,255,255,0.05)]">
                <Terminal size={12} className="text-white/30 group-hover:text-rose-600 transition-colors" />
                <span className="text-[8px] font-mono text-white/30 uppercase tracking-[0.3em] animate-pulse font-black italic">ЯДРО_ГОТОВЕ_ДО_ДИРЕКТИВ_</span>
              </div>
            </div>
          </TacticalCard>
        </div>
      </div>
    </div>
  );
};

export default SovereignCommandCenter;
