import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Package, ShieldCheck, AlertTriangle, Cpu } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { SandboxSession } from '../types';

interface E2BSandboxFeedProps {
  session: SandboxSession | null;
  className?: string;
}

export const E2BSandboxFeed: React.FC<E2BSandboxFeedProps> = ({ session, className }) => {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [session?.logs]);

  if (!session) {
    return (
      <div className={cn("h-full bg-black/60 rounded-[28px] border border-white/5 flex flex-col items-center justify-center space-y-4", className)}>
        <Package size={40} className="text-slate-800 animate-pulse" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-700 italic">E2B_ORCHESTRATOR_OFFLINE</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-black/60 rounded-[28px] border border-white/5 overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-emerald-500/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Cpu size={16} className="text-emerald-500" />
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ізольоване Середовище Виконання</h3>
            <div className="text-[11px] font-black text-white uppercase italic flex items-center gap-2">
              ID: {session.id.substring(0, 8)}...
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                {session.runtime}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {session.vram_guard_active && (
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20">
              <ShieldCheck size={10} className="text-blue-400" />
              <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">ЗАХИСТ_WORM_АКТИВНИЙ</span>
            </div>
          )}
          <div className={cn(
            "flex items-center gap-2",
            session.status === 'ACTIVE' ? "text-emerald-500" : "text-rose-500"
          )}>
            <div className={cn("w-1.5 h-1.5 rounded-full", session.status === 'ACTIVE' ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
            <span className="text-[8px] font-black uppercase tracking-widest">{session.status === 'ACTIVE' ? 'АКТИВНИЙ' : session.status}</span>
          </div>
        </div>
      </div>

      {/* Logs */}
      <div 
        ref={logRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-1 bg-[url('/grid.svg')] bg-[length:30px_30px]"
      >
        {session.logs.map((log, i) => {
          const isError = log.includes('ERROR') || log.includes('Crit') || log.includes('Failed');
          const isWarning = log.includes('WARN') || log.includes('caution');
          const isSystem = log.includes('SYSTEM');

          return (
            <div key={i} className={cn(
              "flex gap-4 p-1 rounded-sm",
              isError ? "bg-red-500/10 text-red-400 border-l-2 border-red-500" :
              isWarning ? "bg-rose-500/10 text-rose-400 border-l-2 border-rose-500" :
              isSystem ? "text-blue-400 font-black italic" : "text-slate-400"
            )}>
              <span className="text-slate-600 select-none w-10 text-right">{i + 1}</span>
              <span className="flex-1 whitespace-pre-wrap">{log}</span>
            </div>
          );
        })}
        {session.logs.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-10">
            <TerminalIcon size={40} className="text-white" />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-white/5 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={12} className="text-rose-400" />
          <span className="text-[8px] font-black text-rose-500 uppercase tracking-[0.2em]">Монітор_Цілісності_Пісочниці: НО МА</span>
        </div>
      </div>
    </div>
  );
};

const TerminalIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);
