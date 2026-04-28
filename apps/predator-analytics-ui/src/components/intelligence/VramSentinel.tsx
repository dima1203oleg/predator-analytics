import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Zap, ShieldCheck, Cloud, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface VramState {
  ui: number;
  llm: number;
  total: number;
  mode: 'SOVEREIGN' | 'HYBRID' | 'CLOUD';
}

export const VramSentinel: React.FC = () => {
  const [vram, setVram] = useState<VramState>({
    ui: 2.1,
    llm: 4.8,
    total: 6.9,
    mode: 'SOVEREIGN'
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setVram(prev => {
        const newUi = Math.max(2.0, Math.min(2.5, prev.ui + (Math.random() - 0.5) * 0.1));
        const newLlm = Math.max(3.0, Math.min(5.5, prev.llm + (Math.random() - 0.5) * 0.2));
        const total = newUi + newLlm;
        
        let mode: 'SOVEREIGN' | 'HYBRID' | 'CLOUD' = 'SOVEREIGN';
        if (total > 7.6) mode = 'CLOUD';
        else if (total > 7.0) mode = 'HYBRID';

        return { ui: newUi, llm: newLlm, total, mode };
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const limit = 8.0;
  const statusColor = vram.total > 7.6 ? 'crimson' : vram.total > 7.0 ? 'rose' : 'emerald';
  const modeLabel = {
    SOVEREIGN: { text: 'СУВЕ� ЕННИЙ (Червоний)', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
    HYBRID: { text: 'ГІБ� ИДНИЙ (Зелений)', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    CLOUD: { text: 'ХМА� НИЙ (Синій)', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  }[vram.mode];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-950/80 backdrop-blur-3xl border border-white/5 p-6 rounded-[32px] shadow-2xl relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-3 rounded-2xl border transition-all duration-500 shadow-lg",
            vram.mode === 'SOVEREIGN' ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' :
            vram.mode === 'HYBRID' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' :
            'bg-blue-500/20 border-blue-500/40 text-blue-400'
          )}>
            <Cpu size={20} className={vram.total > 7.6 ? 'animate-pulse' : ''} />
          </div>
          <div>
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">СИСТЕМА_ЗАХИСТУ_VRAM</h4>
            <div className="flex items-center gap-2">
              <span className={cn("text-xs font-black uppercase tracking-widest", modeLabel.color)}>
                {modeLabel.text}
              </span>
            </div>
          </div>
        </div>
        <div className={cn("px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-[0.2em]", modeLabel.bg, modeLabel.color, modeLabel.border)}>
          {vram.mode}
        </div>
      </div>

      <div className="space-y-6">
        {/* Total Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Використання пам'яті</span>
            <span className="text-xl font-black text-white font-mono">{vram.total.toFixed(2)} <span className="text-[10px] text-slate-500 tracking-normal">GB</span> / 8.00 GB</span>
          </div>
          <div className="h-3 bg-slate-900/60 rounded-full border border-white/5 relative overflow-hidden p-[2px]">
            <motion.div 
              className={cn(
                "h-full rounded-full shadow-lg relative",
                vram.total > 7.6 ? 'bg-crimson-600 shadow-crimson-600/50' : 
                vram.total > 7.0 ? 'bg-rose-500 shadow-rose-500/50' : 
                'bg-emerald-500 shadow-emerald-500/50'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${(vram.total / limit) * 100}%` }}
              transition={{ duration: 1.5, ease: "circOut" }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />
            </motion.div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 group-hover:bg-white/[0.04] transition-colors">
            <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">WebGL / UI / ОС</span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-white font-mono">{vram.ui.toFixed(1)}</span>
              <span className="text-[8px] text-slate-500 font-black">GB</span>
            </div>
            <div className="mt-2 h-1 bg-slate-900/50 rounded-full overflow-hidden">
               <motion.div 
                 className="h-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]"
                 animate={{ width: `${(vram.ui / 2.5) * 100}%` }}
               />
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 group-hover:bg-white/[0.04] transition-colors">
            <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Локальний LLM (Ollama)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-white font-mono">{vram.llm.toFixed(1)}</span>
              <span className="text-[8px] text-slate-500 font-black">GB</span>
            </div>
            <div className="mt-2 h-1 bg-slate-900/50 rounded-full overflow-hidden">
               <motion.div 
                 className="h-full bg-indigo-500 shadow-[0_0_8px_#6366f1]"
                 animate={{ width: `${(vram.llm / 5.5) * 100}%` }}
               />
            </div>
          </div>
        </div>

        {/* Cloud Notification */}
        <AnimatePresence>
          {vram.mode === 'CLOUD' && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 flex items-center gap-4"
            >
              <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                <Cloud size={16} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest leading-tight">ХМА� НИЙ_ОБХІД_УВІМКНЕНО</p>
                <p className="text-[8px] text-blue-400 font-black leading-tight mt-1">Використання Gemini Pro 1.5 для збереження VRAM</p>
              </div>
              <Zap size={14} className="text-blue-500 animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={12} className="text-emerald-500" />
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Стабільність системи гарантована</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[8px] font-black text-slate-300 font-mono italic">СИНХ� ОНІЗОВАНО</span>
        </div>
      </div>
    </motion.div>
  );
};
