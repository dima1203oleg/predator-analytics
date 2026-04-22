import React from 'react';
import { motion } from 'framer-motion';
import { Infinity, Repeat, Target, Eye, BrainCircuit, Zap, Terminal, Activity, History as HistoryIcon, Clock } from 'lucide-react';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/utils/cn';

interface InfiniteTabProps {
  infiniteRunning: boolean;
  infinitePhase: 'observe' | 'orient' | 'decide' | 'act';
  infiniteStats: { improvements: number; bugs: number; cycles: number };
  infiniteLogs: string[];
  infiniteLastUpdate: string;
  infiniteSyncedAt: string;
  handleStartImprovement: () => void;
  stopInfinite: () => Promise<void>;
  refreshInfiniteStatus: () => Promise<void>;
}

export const InfiniteTab: React.FC<InfiniteTabProps> = ({
  infiniteRunning,
  infinitePhase,
  infiniteStats,
  infiniteLogs,
  infiniteLastUpdate,
  infiniteSyncedAt,
  handleStartImprovement,
  stopInfinite,
  refreshInfiniteStatus
}) => {
  const phases = [
    { id: 'observe', label: 'Observe', icon: Eye, description: 'СПОСТЕРЕЖЕННЯ' },
    { id: 'orient', label: 'Orient', icon: Target, description: 'ОРІЄНТАЦІЯ' },
    { id: 'decide', label: 'Decide', icon: BrainCircuit, description: 'РІШЕННЯ' },
    { id: 'act', label: 'Act', icon: Zap, description: 'ДІЯ' }
  ];

  return (
    <motion.div 
      key="infinite" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {phases.map((phase, idx) => {
          const isActive = infinitePhase === phase.id;
          return (
            <TacticalCard 
              key={phase.id} 
              variant={isActive ? "holographic" : "minimal"}
              className={cn(
                "transition-all duration-500",
                isActive ? "border-rose-500 bg-rose-500/10 shadow-[0_0_30px_rgba(244,63,94,0.2)] scale-105 z-10" : "opacity-40 border-white/5 grayscale"
              )}
            >
              <div className="flex flex-col items-center text-center p-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-500",
                  isActive ? "bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.5)]" : "bg-white/5 text-slate-500"
                )}>
                  <phase.icon size={24} className={cn(isActive && "animate-pulse")} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{phase.label}</span>
                <span className="text-[8px] font-mono text-rose-500/80 mt-1 uppercase tracking-widest">{phase.description}</span>
                
                {isActive && (
                  <div className="mt-4 w-full space-y-1">
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,1)]"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 5, repeat: Infinity }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </TacticalCard>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TacticalCard variant="cyber" className="border-rose-500/30 overflow-hidden bg-slate-900/40">
            <div className="flex items-center justify-between p-4 border-b border-rose-500/20 bg-rose-500/5">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <h2 className="text-xs font-black uppercase tracking-widest text-white">Статус OODA Циклу</h2>
              </div>
              <div className="flex items-center gap-4">
                 <div className="flex flex-col items-end">
                    <span className="text-[8px] text-slate-500 uppercase tracking-widest font-black">Sync Age</span>
                    <span className="text-[10px] text-rose-400 font-mono">{infiniteSyncedAt}</span>
                 </div>
                 <Button 
                   variant="neon" 
                   size="sm" 
                   onClick={infiniteRunning ? stopInfinite : handleStartImprovement}
                   className={cn(
                     "h-10 px-6 font-black uppercase tracking-widest text-[10px]",
                     infiniteRunning ? "bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.2)]" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                   )}
                 >
                   {infiniteRunning ? <Repeat size={14} className="mr-2 animate-spin" /> : <Play size={14} className="mr-2" />}
                   {infiniteRunning ? 'ЗУПИНИТИ ЦИКЛ' : 'ЗАПУСТИТИ АВТОНОМІЮ'}
                 </Button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Циклів завершено</span>
                  <div className="text-2xl font-black text-white font-mono">{infiniteStats.cycles}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Вдосконалень впроваджено</span>
                  <div className="text-2xl font-black text-rose-500 font-mono">+{infiniteStats.improvements}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Виправлено дефектів</span>
                  <div className="text-2xl font-black text-emerald-500 font-mono">{infiniteStats.bugs}</div>
                </div>
              </div>

              <div className="relative">
                <div className="bg-black/60 rounded-2xl p-5 border border-white/5 font-mono text-[11px] h-[300px] overflow-y-auto custom-scrollbar shadow-inner">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-rose-500/20">
                    <span className="text-rose-400 font-black tracking-widest uppercase">Kernel Event Stream</span>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      <span className="text-[8px] text-rose-500 uppercase tracking-[0.2em] font-black">Live Telemetry</span>
                    </div>
                  </div>
                  {infiniteLogs.length > 0 ? (
                    <div className="space-y-1.5">
                      {infiniteLogs.slice(-20).map((log, index) => (
                        <div key={index} className="flex gap-4 group">
                          <span className="text-slate-700 shrink-0 select-none opacity-50 font-black">{String(index + 1).padStart(3, '0')}</span>
                          <span className={cn(
                            "break-all",
                            log.includes('ERROR') ? 'text-rose-400 font-bold' : log.includes('SUCCESS') ? 'text-emerald-400' : 'text-slate-400'
                          )}>{log}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-700 italic uppercase tracking-[0.3em] text-[10px]">
                      Очікування подій від ядра OODA...
                    </div>
                  )}
                </div>
                {!infiniteRunning && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center rounded-2xl border border-white/5">
                    <div className="text-center px-6">
                      <Infinity size={48} className="mx-auto text-slate-700 mb-4" />
                      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Система в режимі очікування</div>
                      <p className="text-[9px] text-slate-600 mt-2 max-w-[200px] mx-auto uppercase leading-relaxed">Натисніть кнопку вище для активації циклу безперервного самовдосконалення</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TacticalCard>
        </div>

        <div className="space-y-6">
          <TacticalCard variant="minimal" className="border-rose-500/20 bg-slate-900/40">
             <div className="flex items-center gap-3 mb-6 p-4 border-b border-rose-500/20 bg-rose-500/5">
               <Clock size={16} className="text-rose-500" />
               <h2 className="text-xs font-black uppercase tracking-widest text-white">Останнє Оновлення</h2>
             </div>
             <div className="px-4 pb-4">
                <div className="text-2xl font-black text-white font-mono">{infiniteLastUpdate.split(',')[1] || '—'}</div>
                <div className="text-[10px] text-slate-500 font-mono uppercase mt-1 tracking-widest">{infiniteLastUpdate.split(',')[0] || 'Ще не синхронізовано'}</div>
                
                <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                   <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Sovereignty Index</span>
                      <span className="text-[11px] font-black text-rose-400 font-mono">99.9%</span>
                   </div>
                   <Progress value={99.9} variant="holographic" className="h-1.5" />
                   
                   <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">AI Entropy</span>
                      <span className="text-[11px] font-black text-emerald-400 font-mono">2.4%</span>
                   </div>
                   <Progress value={2.4} variant="holographic" className="h-1.5 bg-emerald-500/10" />
                </div>
             </div>
          </TacticalCard>

          <TacticalCard variant="cyber" className="border-rose-500/30 bg-rose-500/5">
             <div className="flex items-center gap-3 mb-4">
               <HistoryIcon size={16} className="text-rose-500" />
               <h2 className="text-[10px] font-black uppercase tracking-widest text-white">Аналітика Циклів</h2>
             </div>
             <p className="text-[9px] text-slate-400 font-mono leading-relaxed uppercase tracking-tight">
                OODA (Observe, Orient, Decide, Act) - це замкнутий цикл управління, що дозволяє Predator Analytics автономно адаптуватися до змін у даних митниці.
             </p>
             <Button 
               variant="ghost" 
               className="w-full mt-6 text-[10px] font-black uppercase tracking-widest border border-white/5 hover:bg-rose-500/10 hover:text-rose-400 h-11"
             >
               Переглянути Архів (History)
             </Button>
          </TacticalCard>
        </div>
      </div>
    </motion.div>
  );
};
