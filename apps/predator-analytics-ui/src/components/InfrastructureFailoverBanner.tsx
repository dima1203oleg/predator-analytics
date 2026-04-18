/**
 * 🛰️ БАНЕР РЕЗЕРВНОГО КОПІЮВАННЯ ІНФРАСТРУКТУРИ v5.0 // СТАТУС КЛАСТЕРА | v57.2-WRAITH
 * PREDATOR Analytics — Master/Mirror Infrastructure Coordination
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Server, Zap, ShieldAlert, Cpu, Activity, 
  Database, Radio, Globe, ShieldCheck, Box 
} from 'lucide-react';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { cn } from '@/utils/cn';
import { API_BASE_URL } from '@/services/api/config';

export const InfrastructureFailoverBanner: React.FC = () => {
  const status = useBackendStatus();
  const { isOffline, nodes, llmLevel, llmTriStateMode, vramMetrics } = status;

  const activeNode = nodes.find(n => n.active);
  const isMirror = activeNode?.id === 'colab' || activeNode?.id === 'zrok';
    
  const getModeStyles = (mode: 'SOVEREIGN' | 'HYBRID' | 'CLOUD') => {
    switch (mode) {
      case 'SOVEREIGN': return {
        color: 'text-rose-400',
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/30 shadow-rose-900/40',
        label: 'SOVEREIGN (100% LOCAL)',
        icon: <ShieldCheck size={18} className="text-rose-500" />
      };
      case 'HYBRID': return {
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30 shadow-emerald-900/40',
        label: 'HYBRID (AUTO-BALANCE)',
        icon: <Zap size={18} className="text-emerald-500" />
      };
      case 'CLOUD': return {
        color: 'text-sky-400',
        bg: 'bg-sky-500/10',
        border: 'border-sky-500/30 shadow-sky-900/40',
        label: 'CLOUD (MAX PERFORMANCE)',
        icon: <Globe size={18} className="text-sky-500" />
      };
    }
  };

  const mode = getModeStyles(llmTriStateMode);

  if (!activeNode && !isOffline) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: -100, x: '-50%', opacity: 0 }}
        animate={{ y: 0, x: '-50%', opacity: 1 }}
        exit={{ y: -100, x: '-50%', opacity: 0 }}
        className={cn(
          "fixed top-6 left-1/2 z-[100] px-8 py-4 rounded-[3rem] border-2 flex items-center gap-8 shadow-4xl backdrop-blur-3xl transition-all duration-700",
          mode.bg, mode.border
        )}
      >
        {/* Core Status Block */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 3, repeat: Infinity }}
              className={cn("absolute inset-0 rounded-full blur-xl", mode.color.replace('text', 'bg'))}
            />
            <div className={cn(
              "relative w-14 h-14 rounded-2xl flex items-center justify-center border-2 shadow-2xl transition-all duration-500",
              mode.bg, mode.border
            )}>
              {isMirror ? <Globe size={28} className="animate-spin-slow" /> : isOffline ? <ShieldAlert size={28} className="animate-bounce" /> : <Server size={28} />}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-black uppercase tracking-[0.5em] opacity-50 italic">ІНФРАСТРУКТУРА //</span>
              <div className={cn("px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border animate-pulse", mode.color, mode.border)}>
                {mode.label}
              </div>
            </div>
            <h4 className={cn("text-2xl font-black italic tracking-tighter uppercase leading-none font-serif mt-1", mode.color)}>
              {isMirror ? 'ДЗЕРКАЛО GOOGLE COLAB' : isOffline ? 'АВТОНОМНИЙ РЕЖИМ' : 'NVIDIA PROD КЛАСТЕР'}
            </h4>
          </div>
        </div>

        {/* VRAM Sentinel Metrics */}
        {(llmTriStateMode === 'SOVEREIGN' || llmTriStateMode === 'HYBRID') && (
          <div className="hidden xl:flex items-center gap-6 pl-6 border-l border-white/10">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-10">
                <span className="text-[8px] font-black opacity-40 uppercase tracking-widest italic">VRAM_МОНІТОР_НАВАНТАЖЕННЯ</span>
                <span className={cn("text-[9px] font-black font-mono", vramMetrics.status === 'critical' ? 'text-rose-500' : 'text-emerald-500')}>
                  {vramMetrics.used.toFixed(1)} / {vramMetrics.total} GB
                </span>
              </div>
              <div className="w-48 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(vramMetrics.used / vramMetrics.total) * 100}%` }}
                  className={cn(
                    "h-full rounded-full transition-colors",
                    vramMetrics.status === 'critical' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 
                    vramMetrics.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                  )}
                />
              </div>
            </div>
          </div>
        )}

        {/* Connection Telemetry */}
        <div className="hidden md:flex items-center gap-8 pl-8 border-l border-white/10 ml-2">
          <div className="text-right">
            <p className="text-[9px] font-black opacity-30 uppercase tracking-widest italic">ЗАТРИМКА (PING)</p>
            <p className="text-lg font-black italic font-mono tracking-tighter shadow-sm text-white">
              {isOffline ? '---' : isMirror ? '142ms' : '0.8ms'}
            </p>
          </div>
          <div className={cn(
            "p-3 rounded-2xl flex items-center justify-center transition-all border",
            mode.bg, mode.border
          )}>
            {mode.icon}
          </div>
        </div>

        {/* Global Control Buttons */}
        <div className="flex gap-2 ml-4">
          <button className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl flex items-center justify-center transition-all group">
            <Radio size={16} className="text-slate-500 group-hover:text-white" />
          </button>
          <button className={cn(
            "h-10 px-4 rounded-xl flex items-center gap-2 border transition-all text-[10px] font-black uppercase tracking-widest active:scale-95 animate-pulse",
            llmTriStateMode === 'SOVEREIGN' ? 'bg-rose-500 text-black border-rose-400' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-rose-600/20'
          )}>
            <Box size={14} />
            АВТОНОМНИЙ_OODA
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InfrastructureFailoverBanner;
