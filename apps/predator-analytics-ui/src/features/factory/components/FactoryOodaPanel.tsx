import React from 'react';
import { motion } from 'framer-motion';
import { 
  Infinity, Power, Play, RefreshCw, Zap, CheckCircle2, Eye, BrainCircuit, Cog, Terminal, Loader2, ChevronRight
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type FactoryBugRecord, type InfinitePhase } from '../systemFactoryView.utils';

export interface FactoryOodaPanelProps {
  infiniteRunning: boolean;
  infinitePhase: InfinitePhase;
  infiniteStats: {
    cycles: number;
    improvements: number;
  };
  bugs: FactoryBugRecord[];
  infiniteSyncedAt: string;
  infiniteLastUpdate: string;
  handleInfiniteCycle: () => void;
  infiniteLogs: string[];
  logsEndRef: React.RefObject<HTMLDivElement>;
}

export const FactoryOodaPanel: React.FC<FactoryOodaPanelProps> = ({
  infiniteRunning,
  infinitePhase,
  infiniteStats,
  bugs,
  infiniteSyncedAt,
  infiniteLastUpdate,
  handleInfiniteCycle,
  infiniteLogs,
  logsEndRef
}) => {
  return (
    <div className="space-y-6">
      {/* ═══ 1. ЗАГОЛОВОК OODA ═══ */}
      <div className="relative rounded-3xl border border-rose-500/30 bg-gradient-to-br from-rose-950/60 via-slate-950/80 to-yellow-950/40 backdrop-blur-xl p-6 lg:p-8 shadow-[0_0_50px_rgba(225,29,72,0.1)]">
        {infiniteRunning && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-rose-500/5 animate-ping" style={{ animationDuration: '3s' }} />
          </div>
        )}
        <div className="relative z-10 flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] items-center gap-6">
            <div className="flex items-center gap-5 min-w-0">
              <div className="relative shrink-0">
                <div className={cn('w-14 h-14 lg:w-16 lg:h-16 rounded-2xl border-2 flex items-center justify-center transition-all duration-500',
                  infiniteRunning ? 'bg-rose-500/20 border-rose-400 shadow-[0_0_30px_rgba(225,29,72,0.6)]' : 'bg-slate-900/80 border-slate-600'
                )}>
                  <Infinity size={28} className={cn('transition-all', infiniteRunning ? 'text-rose-300 animate-pulse' : 'text-slate-500')} />
                </div>
                {infiniteRunning && <div className="absolute -inset-1 rounded-2xl border border-rose-400/30 animate-ping opacity-40" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] text-rose-400 font-black uppercase tracking-[0.15em] mb-1">🔄 ЦИКЛ OODA • АВТОНОМНИЙ ДВИГУН ВДОСКОНАЛЕННЯ</div>
                <h2 className="text-lg lg:text-2xl font-black text-white leading-tight">
                  {infiniteRunning ? (
                    <><span className="text-rose-300">АКТИВНИЙ</span> <span className="text-slate-500">—</span> Цикл <span className="text-rose-200 font-mono">#{infiniteStats.cycles + 1}</span></>
                  ) : (
                    <><span className="text-slate-400">ЗУПИНЕНО</span> <span className="text-slate-600">—</span> <span className="text-slate-500">Очікує команди</span></>
                  )}
                </h2>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Автономна система аналізує код, архітектуру та логи для генерації патчів і вдосконалень.
                </p>
              </div>
            </div>

            <Button
              onClick={handleInfiniteCycle}
              className={cn('h-12 px-8 font-black tracking-widest uppercase text-sm transition-all shrink-0 w-full lg:w-auto rounded-xl',
                infiniteRunning
                  ? 'bg-rose-700 hover:bg-rose-600 text-white shadow-[0_0_25px_rgba(225,29,72,0.4)] border border-rose-400/30'
                  : 'bg-gradient-to-r from-rose-600 to-yellow-600 hover:from-rose-500 hover:to-yellow-500 text-white shadow-[0_0_25px_rgba(225,29,72,0.5)] border border-rose-400/30'
              )}
            >
              {infiniteRunning ? <><Power size={16} className="mr-2" />ЗУПИНИТИ</> : <><Play size={16} className="mr-2" />ЗАПУСТИТИ</>}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-center bg-rose-500/5 border border-rose-500/15 rounded-2xl p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn(
                'border text-[10px] font-black uppercase tracking-widest px-3 py-1',
                infiniteRunning
                  ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300'
                  : 'border-slate-500/30 bg-slate-500/10 text-slate-300'
              )}>
                Сервер: {infiniteRunning ? 'АКТИВНИЙ' : 'ЗУПИНЕНИЙ'}
              </Badge>
              <Badge className="border border-rose-400/20 bg-rose-500/10 text-rose-200 text-[10px] font-black uppercase tracking-widest px-3 py-1">
                Автовідновлення
              </Badge>
              <Badge className="border border-slate-400/20 bg-slate-500/10 text-slate-200 text-[10px] font-black uppercase tracking-widest px-3 py-1">
                Збереження стану
              </Badge>
            </div>
            <div className="text-[10px] font-mono text-slate-500 lg:text-right flex flex-col gap-0.5">
              <span>Синхр: {infiniteSyncedAt}</span>
              <span>Бекенд: {infiniteLastUpdate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 2. СТАТИСТИКА ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Циклів OODA', value: infiniteStats.cycles, icon: RefreshCw, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
          { label: 'Покращень', value: infiniteStats.improvements, icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Багів виправлено', value: bugs.filter(b => b.status === 'fixed').length, icon: CheckCircle2, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={cn('rounded-2xl border p-5 flex items-center gap-4', s.bg)}>
              <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center shrink-0">
                <Icon size={20} className={s.color} />
              </div>
              <div>
                <div className={cn('text-2xl font-black font-mono', s.color)}>{s.value}</div>
                <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ 3. OODA ФАЗИ ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { id: 'observe', label: 'ОБСЕРВАЦІЯ', sub: 'Збір метрик', icon: Eye, color: 'slate' },
          { id: 'orient', label: 'ОРІЄНТАЦІЯ', sub: 'Аналіз даних', icon: BrainCircuit, color: 'amber' },
          { id: 'decide', label: 'РІШЕННЯ', sub: 'Вибір стратегії', icon: Cog, color: 'orange' },
          { id: 'act', label: 'ДІЯ', sub: 'Деплой / Фікс', icon: Zap, color: 'emerald' },
        ].map((phase, idx) => {
          const Icon = phase.icon;
          const isActive = infinitePhase === phase.id && infiniteRunning;
          const colorStyles: Record<string, { border: string; text: string; bg: string; glow: string }> = {
            slate:   { border: 'border-slate-500/60',   text: 'text-slate-300',   bg: 'bg-slate-900/30',   glow: '0 0 20px rgba(148,163,184,0.3)' },
            amber:   { border: 'border-rose-500/60',   text: 'text-rose-300',   bg: 'bg-rose-900/30',   glow: '0 0 20px rgba(245,158,11,0.5)' },
            orange:  { border: 'border-orange-500/60',  text: 'text-orange-300',  bg: 'bg-orange-900/30',  glow: '0 0 20px rgba(249,115,22,0.5)' },
            emerald: { border: 'border-emerald-500/60', text: 'text-emerald-300', bg: 'bg-emerald-900/30', glow: '0 0 20px rgba(16,185,129,0.5)' },
          };
          const cs = colorStyles[phase.color];
          return (
            <div
              key={phase.id}
              style={isActive ? { boxShadow: cs.glow } : {}}
              className={cn(
                'relative rounded-2xl border p-5 flex flex-col items-center gap-3 text-center transition-all duration-500',
                isActive ? `${cs.border} ${cs.bg}` : 'border-slate-800/60 bg-slate-950/40 opacity-40'
              )}
            >
              {isActive && <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-current animate-ping opacity-60" style={{ color: 'inherit' }} />}
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', isActive ? 'bg-black/20' : 'bg-transparent')}>
                <Icon size={24} className={isActive ? cs.text : 'text-slate-600'} />
              </div>
              <div className={cn('text-[10px] font-black tracking-widest uppercase', isActive ? cs.text : 'text-slate-600')}>{phase.label}</div>
              <div className="text-[9px] text-slate-600">{phase.sub}</div>
              {idx < 3 && (
                <div className="hidden lg:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-10">
                  <ChevronRight size={14} className={isActive ? cs.text : 'text-slate-700'} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ═══ 4. ЖИВИЙ ТЕРМІНАЛ ═══ */}
      <div className="rounded-2xl border border-rose-500/20 bg-slate-950/90 overflow-hidden shadow-inner">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-rose-500/20 bg-rose-500/5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex gap-1.5 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest ml-2 truncate">
              <Terminal size={11} className="inline mr-1 text-rose-400" />
              PREDATOR-OODA — ЖИВА ТРАНСЛЯЦІЯ
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {infiniteRunning && (
              <motion.div
                key="rec"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
                className="flex items-center gap-1.5 text-rose-400 text-[9px] font-black uppercase"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> REC
              </motion.div>
            )}
            <span className="text-[9px] font-mono text-slate-600">логи: {infiniteLogs.length}/50</span>
          </div>
        </div>
        <div className="h-[300px] overflow-y-auto p-4 font-mono text-[11px] space-y-1 custom-scrollbar" id="ooda-log-terminal">
          {infiniteLogs.length === 0 && (
            <div className="text-slate-600 flex items-center gap-2 py-4 justify-center">
              <Terminal size={16} />
              <span>Очікуємо запуску OODA циклу...</span>
            </div>
          )}
          {infiniteLogs.map((log, i) => {
            let cls = 'text-slate-400';
            if (log.includes('OBSERVE')) cls = 'text-slate-300';
            else if (log.includes('ORIENT')) cls = 'text-rose-400';
            else if (log.includes('DECIDE')) cls = 'text-orange-400';
            else if (log.includes('ACT') || log.includes('✅')) cls = 'text-emerald-400';
            else if (log.includes('SYSTEM')) cls = 'text-rose-300 font-black';
            else if (log.includes('❌') || log.includes('ERROR')) cls = 'text-rose-500';
            return (
              <motion.div
                key={i}
                initial={i === infiniteLogs.length - 1 ? { opacity: 0, x: -8 } : {}}
                animate={{ opacity: 1, x: 0 }}
                className={cn('flex gap-2 leading-relaxed', cls)}
              >
                <span className="shrink-0 text-slate-700 select-none">{String(i + 1).padStart(3, '0')}</span>
                <span className="break-all">{log}</span>
              </motion.div>
            );
          })}
          {infiniteRunning && (
            <div className="flex items-center gap-2 text-rose-400 mt-2">
              <Loader2 size={11} className="animate-spin" />
              <span className="animate-pulse">
                {infiniteLogs[infiniteLogs.length - 1]?.includes('ERROR') 
                    ? 'Відновлення з\'єднання...' 
                    : 'Обробка...'}
              </span>
            </div>
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
};
