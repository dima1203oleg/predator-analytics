import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, ArrowRightLeft, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VirtualTable, VirtualColumn, RowStatus } from '@/components/shared/VirtualTable';
import { useFailoverStatus, useToggleFailover } from '@/hooks/useAdminApi';
import { Loader2 } from 'lucide-react';

// ─── Типи ─────────────────────────────────────────────────────────────────────

type BackendNode = 'local-k3s' | 'nvidia-server' | 'colab-mirror';
type RouteMode  = 'SOVEREIGN' | 'HYBRID' | 'CLOUD';

interface FailoverEvent {
  id: string;
  ts: string;
  from: BackendNode;
  to:   BackendNode;
  reason: string;
  user: string;
  duration: string;
}

const MODES: Record<string, { label: string; desc: string; color: string; bg: string }> = {
  SOVEREIGN: { label: 'АВТОНОМНИЙ (SOVEREIGN)', desc: '100% Локальне виконання (K3s + Ollama AI)',   color: 'text-rose-600',    bg: 'bg-rose-600/10 border-rose-600/25' },
  HYBRID:    { label: 'ГІБРИДНИЙ (HYBRID)',    desc: 'Баланс: Локальне ядро + Groq/Gemini Cloud',    color: 'text-rose-500',    bg: 'bg-rose-500/10 border-rose-500/25' },
  CLOUD:     { label: 'ХМАРНИЙ (CLOUD)',     desc: 'Максимальна потужність: Gemini Pro, GLM-5.1',     color: 'text-rose-400',    bg: 'bg-rose-400/10 border-rose-400/25' },
};

// ─── Колонки таблиці ──────────────────────────────────────────────────────────

const eventCols: VirtualColumn<FailoverEvent>[] = [
  { key: 'ts',       label: 'ЧАС_ПОДІЇ',          width: '140px', mono: true },
  { 
    key: 'from',     label: 'ДЖЕРЕЛО',            width: '140px', mono: true, 
    render: (v) => <span className="text-amber-400/70 uppercase italic font-bold">{String(v).replace('local-k3s', 'ЛОКАЛЬНИЙ_КЛАСТЕР').replace('nvidia-server', 'СЕРВЕР_NVIDIA').replace('colab-mirror', 'ДЗЕРКАЛО_COLAB')}</span> 
  },
  { 
    key: 'to',       label: 'ЦІЛЬ',               width: '140px', mono: true, 
    render: (v) => <span className="text-rose-500/70 uppercase italic font-bold">{String(v).replace('local-k3s', 'ЛОКАЛЬНИЙ_КЛАСТЕР').replace('nvidia-server', 'СЕРВЕР_NVIDIA').replace('colab-mirror', 'ДЗЕРКАЛО_COLAB')}</span> 
  },
  { key: 'reason',   label: 'ПРИЧИНА_РОТАЦІЇ',    render: (v) => <span className="text-white/60 uppercase tracking-tighter italic font-black">{String(v)}</span> },
  { key: 'user',     label: 'ІНІЦІАТОР',    width: '120px', mono: true, render: (v) => <span className="text-white/40">{String(v).replace('auto-sentinel', 'АВТО_ВАРТОВИЙ')}</span> },
  { key: 'duration', label: 'ТРИВАЛІСТЬ',   width: '90px',  mono: true, align: 'right' },
];

const getEventStatus = (row: FailoverEvent): RowStatus =>
  row.user === 'auto-sentinel' ? 'warning' : 'neutral';

// ─── Компонент ───────────────────────────────────────────────────────────────

export const FailoverRoutingTab: React.FC = () => {
  const { data, isLoading, isError } = useFailoverStatus();
  const toggleMutation = useToggleFailover();
  const [confirming, setConfirming] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-white/30 space-y-6">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-rose-500/20" strokeWidth={1} />
          <Radio className="absolute inset-0 m-auto w-5 h-5 text-rose-500 animate-pulse" />
        </div>
        <div className="text-[10px] font-mono uppercase tracking-[0.4em] animate-pulse italic">АНАЛІЗ_ГЛОБАЛЬНИХ_МАРШРУТІВ...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] p-12 text-center glass-wraith m-8 border border-rose-500/20 rounded-xl">
        <AlertTriangle size={48} className="text-rose-500/40 mb-6" />
        <div className="text-[18px] font-black uppercase tracking-widest text-white/90 mb-2">ПОМИЛКА_МЕРЕЖЕВОГО_КАНАЛУ</div>
        <p className="text-[11px] font-mono text-white/30 max-w-sm mb-8 leading-relaxed uppercase italic">
          СИСТЕМА_НЕ_ЗМОГЛА_ОТРИМАТИ_СТАН_FAILOVER_КЛАСТЕРА. ПЕРЕВІРТЕ_З'ЄДНАННЯ_З_ЦЕНТРАЛЬНИМ_КОНТРОЛЕРОМ.
        </p>
      </div>
    );
  }

  const activeMode = data.activeMode;
  const activeNode = data.activeNode;
  const nodes = data.nodes || {};
  const history = data.history || [];

  const handleSwitch = (node: string) => {
    if (node === activeNode) return;
    setConfirming(node);
  };

  const confirmSwitch = async () => {
    if (confirming) {
      await toggleMutation.mutateAsync(confirming);
      setConfirming(null);
    }
  };

  return (
    <div className="p-8 space-y-10 max-w-[1400px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-1 border-l-2 border-rose-500 pl-6 py-1">
        <div className="flex items-center gap-3">
          <h2 className="text-[18px] font-black text-white uppercase tracking-[0.2em]">
            Глобальне Керування Failover-Потоками
          </h2>
          <div className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 rounded-sm text-[8px] font-bold text-rose-500 tracking-tighter uppercase italic">
            КОНТРОЛЬ_ТРАФІКУ_L3
          </div>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-mono text-white/30 tracking-widest uppercase">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span>МЕРЕЖЕВИЙ_КАНАЛ_АКТИВНИЙ</span>
          </div>
          <span>•</span>
          <span>РЕЗЕРВУВАННЯ: {Object.values(nodes).filter(n => n.status === 'online').length}/{Object.keys(nodes).length}</span>
          <span>•</span>
          <span>ПОЛІТИКА: АВТОМАТИЧНА_ПРЕВЕНТИВНА</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tri-State режими */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-1 h-1 bg-rose-500 rotate-45" />
             <span className="text-[10px] font-mono font-black text-white/40 uppercase tracking-[0.4em] italic">СТРАТЕГІЯ_МАРШРУТИЗАЦІЇ_ШІ</span>
          </div>
          <div className="space-y-3">
            {(Object.keys(MODES) as RouteMode[]).map((mode) => {
              const m = MODES[mode];
              const active = activeMode === mode;
              return (
                <button
                  key={mode}
                  disabled={toggleMutation.isPending}
                  className={cn(
                    'w-full flex items-center gap-5 px-5 py-4 rounded-xl border text-left transition-all duration-500 relative overflow-hidden group',
                    active ? 'glass-wraith border-rose-500/40 bg-rose-500/5 shadow-[0_0_20px_rgba(225,29,72,0.05)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20',
                    toggleMutation.isPending && 'opacity-50 cursor-wait'
                  )}
                >
                  <div className="absolute inset-0 cyber-scan-grid opacity-[0.02] pointer-events-none" />
                  <div className={cn(
                    'w-3 h-3 rounded-full relative z-10 shadow-[0_0_15px_rgba(225,29,72,0.5)]', 
                    active ? 'bg-rose-500 animate-pulse' : 'bg-white/10'
                  )} />
                  <div className="relative z-10 flex-1">
                    <div className={cn('text-[13px] font-black tracking-widest italic uppercase', active ? 'text-rose-500' : 'text-white/60')}>
                      {m.label}
                    </div>
                    <div className="text-[9px] font-mono text-white/20 mt-1 uppercase group-hover:text-white/40 transition-colors italic">{m.desc}</div>
                  </div>
                  {active && (
                    <motion.div 
                      layoutId="active-indicator"
                      className="p-1.5 bg-rose-500/20 border border-rose-500/40 rounded-lg shadow-[0_0_10px_rgba(225,29,72,0.2)]"
                    >
                      <CheckCircle className="w-4 h-4 text-rose-500" />
                    </motion.div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Матриця вузлів */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-1 h-1 bg-rose-500 rotate-45" />
             <span className="text-[10px] font-mono font-black text-white/40 uppercase tracking-[0.4em] italic">МАТРИЦЯ_АКТИВНИХ_ВУЗЛІВ</span>
          </div>
          <div className="space-y-3">
            {Object.keys(nodes).map((nodeKey) => {
              const node = nodes[nodeKey];
              const isActive = activeNode === nodeKey;
              const isOffline = node.status === 'offline';
              const label = node.label.replace('local-k3s', 'ЛОКАЛЬНИЙ_КЛАСТЕР').replace('nvidia-server', 'СЕРВЕР_NVIDIA').replace('colab-mirror', 'ДЗЕРКАЛО_COLAB');
              
              return (
                <div
                  key={nodeKey}
                  className={cn(
                    'flex items-center gap-5 px-5 py-4 rounded-xl border relative overflow-hidden group transition-all duration-500',
                    isActive  ? 'glass-wraith border-rose-500/40 bg-rose-500/5 shadow-2xl shadow-rose-500/10' :
                    isOffline ? 'bg-black/40 border-rose-500/10 opacity-40' :
                                'bg-white/[0.02] border-white/5 hover:border-white/10',
                  )}
                >
                  <div className="absolute inset-0 cyber-scan-grid opacity-[0.02] pointer-events-none" />
                  <div className={cn(
                    'w-2 h-2 rounded-full shrink-0 relative z-10',
                    isActive  ? 'bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(225,29,72,1)]' :
                    isOffline ? 'bg-rose-900' :
                                'bg-white/10',
                  )} />
                  <div className="flex-1 relative z-10">
                    <div className={cn('text-[13px] font-black tracking-widest italic uppercase', isActive ? 'text-white' : 'text-white/60')}>
                       {label}
                    </div>
                    <div className="text-[9px] font-mono text-white/20 mt-1 group-hover:text-white/40 transition-colors uppercase tracking-widest">{node.ip}</div>
                  </div>
                  {!isActive && !isOffline && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSwitch(nodeKey)}
                      disabled={toggleMutation.isPending}
                      className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 hover:border-rose-500/50 transition-all group/btn shadow-[0_0_15px_rgba(225,29,72,0.05)]"
                    >
                      <ArrowRightLeft className="w-3 h-3 text-rose-500 group-hover/btn:rotate-180 transition-transform duration-700" />
                      <span className="text-[9px] text-rose-500 font-black uppercase tracking-widest italic">ПЕРЕМКНУТИ</span>
                    </motion.button>
                  )}
                  {isActive && (
                    <div className="px-4 py-1.5 bg-rose-500 rounded-lg shadow-[0_0_20px_rgba(225,29,72,0.4)] relative z-10">
                       <span className="text-[9px] font-black text-white uppercase tracking-widest italic">В_РОБОТІ</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Діалог підтвердження */}
      <AnimatePresence>
        {confirming && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="p-6 glass-wraith border border-rose-500/40 rounded-xl flex items-center gap-6 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-rose-500/[0.02] animate-pulse pointer-events-none" />
            <div className="p-4 bg-rose-500/10 rounded-xl border border-rose-500/30">
               <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>
            <div className="flex-1 space-y-2 relative z-10">
              <div className="text-[14px] text-white font-black uppercase tracking-widest italic">
                ПІДТВЕРДЖЕННЯ_РОТАЦІЇ_АКТИВНОГО_ВУЗЛА: <span className="text-rose-500">{nodes[confirming]?.label.replace('local-k3s', 'ЛОКАЛЬНИЙ_КЛАСТЕР').replace('nvidia-server', 'СЕРВЕР_NVIDIA').replace('colab-mirror', 'ДЗЕРКАЛО_COLAB') || confirming}</span>
              </div>
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest leading-relaxed italic">
                УСІ_АКТИВНІ_ЗАПИТИ_БУДУТЬ_ПЕРЕНАПРАВЛЕНІ_НА_НОВИЙ_ВУЗОЛ. МОЖЛИВЕ_КОРОТКОЧАСНЕ_ПЕРЕРИВАННЯ_ПОТОКУ_ДАННИХ (OODA_SYNC_BREAK).
              </p>
            </div>
            <div className="flex gap-4 relative z-10">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={confirmSwitch}
                disabled={toggleMutation.isPending}
                className="px-8 py-3 bg-rose-500 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-lg shadow-[0_0_30px_rgba(225,29,72,0.3)] hover:shadow-rose-500/50 transition-all disabled:opacity-50 italic"
              >
                {toggleMutation.isPending ? 'СИНХРОНІЗАЦІЯ...' : 'ПІДТВЕРДИТИ_ПЕРЕМИКАННЯ'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setConfirming(null)}
                className="px-8 py-3 bg-white/5 border border-white/10 text-white/60 text-[11px] font-black uppercase tracking-[0.2em] rounded-lg hover:bg-white/10 transition-all italic"
              >
                СКАСУВАТИ
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Лог переключень */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-[12px] font-mono font-black text-white/40 uppercase tracking-[0.5em] italic glint-elite">ЖУРНАЛ_РОТАЦІЙ_МАРШРУТІВ (WORM_LOCK)</span>
            <div className="flex items-center gap-2">
               <RefreshCw size={10} className="text-rose-500/40 animate-spin-slow" />
               <span className="text-[7px] font-mono text-white/20 uppercase tracking-widest font-black italic">AUDIT_TRAIL_ACTIVE_V60.5</span>
            </div>
          </div>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-white/10 to-transparent" />
        </div>
        <div className="glass-wraith border border-white/5 rounded-xl overflow-hidden backdrop-blur-3xl shadow-2xl relative">
          <div className="absolute inset-0 cyber-scan-grid opacity-[0.02] pointer-events-none" />
          <VirtualTable
            rows={history}
            columns={eventCols}
            rowHeight={48}
            maxHeight={350}
            getRowStatus={getEventStatus}
          />
        </div>
      </div>
    </div>
  );
};

export default FailoverRoutingTab;
