import React from 'react';
import { ShieldAlert, Activity, Cpu } from 'lucide-react';

export const CyberHeader = ({ threatLevel = 'NORMAL' }: { threatLevel?: 'NORMAL' | 'HIGH' }) => {
  return (
    <div className="w-full h-16 border-b border-emerald-500/30 bg-black/80 backdrop-blur-md flex items-center justify-between px-6 z-20">
      <div className="flex items-center gap-4">
        <div className="relative flex items-center justify-center w-10 h-10">
          <ShieldAlert className="text-emerald-400 w-6 h-6 z-10" />
          <div className="absolute inset-0 border-t-2 border-emerald-400 rounded-full animate-spin" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-black tracking-widest text-white drop-shadow-[0_0_10px_rgba(16,185,129,0.8)] leading-none">
            PREDATOR
          </h1>
          <span className="text-[10px] tracking-[0.2em] text-emerald-500/70">ЕЛІТНИЙ НЕЙРОМАНТ ДАНИХ</span>
        </div>
      </div>

      <div className="flex items-center gap-8 text-[11px] font-mono tracking-widest">
        <div className="flex items-center gap-2">
          <span className="text-emerald-500/60">СИСТЕМА:</span>
          <span className="text-emerald-400 animate-pulse">ОНЛАЙН</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-500/60">GPU UTILIZATION:</span>
          <span className="text-amber-400">78%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-500/60">DATA INGEST:</span>
          <span className="text-cyan-400">500 TB/s</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-500/60">РЕСУРСИ DeepSeek-R1 Elite:</span>
          <span className="text-emerald-400">96% ОПТИМІЗОВАНО</span>
        </div>
        <div className="flex items-center gap-2 pl-4 border-l border-emerald-500/30">
          <span className="text-emerald-500/60">КОМАНДИР:</span>
          <span className="text-white">І. ІВАНОВ</span>
        </div>
      </div>
    </div>
  );
};
