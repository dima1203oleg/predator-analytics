import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, ArrowRightLeft, CheckCircle, AlertTriangle, XCircle, RefreshCw, Globe, Zap, Shield, Server, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VirtualTable, VirtualColumn, RowStatus } from '@/components/shared/VirtualTable';
import { useFailoverStatus, useToggleFailover } from '@/hooks/useAdminApi';
import { Loader2 } from 'lucide-react';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';

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

const MODES: Record<string, { label: string; desc: string; color: string; bg: string; icon: any }> = {
  SOVEREIGN: { 
    label: 'АВТОНОМНИЙ (SOVEREIGN)', 
    desc: '100% ЛОКАЛЬНЕ ВИКОНАННЯ (K3S + OLLAMA AI)',   
    color: 'text-rose-500',    
    bg: 'bg-rose-500/10 border-rose-500/30',
    icon: Shield
  },
  HYBRID:    { 
    label: 'ГІБ� ИДНИЙ (HYBRID)',    
    desc: 'БАЛАНС: ЛОКАЛЬНЕ ЯД� О + GROQ/GEMINI CLOUD',    
    color: 'text-emerald-500', 
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    icon: Zap
  },
  CLOUD:     { 
    label: 'ХМА� НИЙ (CLOUD)',     
    desc: 'МАКСИМАЛЬНА ПОТУЖНІСТЬ: GEMINI PRO, GLM-5.1',     
    color: 'text-sky-500',    
    bg: 'bg-sky-500/10 border-sky-500/30',
    icon: Globe
  },
};

// ─── Колонки таблиці ──────────────────────────────────────────────────────────

const eventCols: VirtualColumn<FailoverEvent>[] = [
  { 
    key: 'ts',       
    label: 'ЧАС_ПОДІЇ',          
    width: '180px', 
    mono: true,
    render: (v) => <span className="text-white/30 font-black italic tracking-widest">{String(v)}</span>
  },
  { 
    key: 'from',     
    label: 'ДЖЕ� ЕЛО',            
    width: '200px', 
    mono: true, 
    render: (v) => (
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
        <span className="text-amber-400/80 uppercase italic font-black tracking-tighter">
          {String(v).replace('local-k3s', 'ЛОКАЛЬНИЙ_КЛАСТЕ� ').replace('nvidia-server', 'СЕ� ВЕ� _NVIDIA').replace('colab-mirror', 'ДЗЕ� КАЛО_COLAB')}
        </span> 
      </div>
    )
  },
  { 
    key: 'to',       
    label: 'ЦІЛЬ',               
    width: '200px', 
    mono: true, 
    render: (v) => (
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.8)]" />
        <span className="text-rose-500 uppercase italic font-black tracking-tighter">
          {String(v).replace('local-k3s', 'ЛОКАЛЬНИЙ_КЛАСТЕ� ').replace('nvidia-server', 'СЕ� ВЕ� _NVIDIA').replace('colab-mirror', 'ДЗЕ� КАЛО_COLAB')}
        </span> 
      </div>
    )
  },
  { 
    key: 'reason',   
    label: 'П� ИЧИНА_� ОТАЦІЇ',    
    render: (v) => <span className="text-white/60 uppercase tracking-widest italic font-black text-[10px]">{String(v)}</span> 
  },
  { 
    key: 'user',     
    label: 'ІНІЦІАТО� ',    
    width: '140px', 
    mono: true, 
    render: (v) => (
      <div className="px-2 py-0.5 rounded bg-white/5 border border-white/10 inline-block">
        <span className="text-white/40 text-[9px] font-black uppercase tracking-widest italic">{String(v).replace('auto-sentinel', 'АВТО_ВА� ТОВИЙ')}</span>
      </div>
    )
  },
  { 
    key: 'duration', 
    label: 'Т� ИВАЛІСТЬ',   
    width: '100px',  
    mono: true, 
    align: 'right',
    render: (v) => <span className="text-emerald-500/60 font-black italic">{String(v)}</span>
  },
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
      <div className="flex flex-col items-center justify-center h-[700px] text-white/40 space-y-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-cyber-grid opacity-[0.05] pointer-events-none" />
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 border-2 border-rose-500/20 rounded-full border-t-rose-500 shadow-[0_0_30px_rgba(225,29,72,0.3)]"
          />
          <Radio className="absolute inset-0 m-auto w-8 h-8 text-rose-500 animate-pulse" />
        </div>
        <div className="text-[14px] font-black font-mono uppercase tracking-[0.6em] animate-pulse italic text-rose-500/60">АНАЛІЗ_ГЛОБАЛЬНИХ_МА� Ш� УТІВ_V61...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[700px] p-24 text-center glass-wraith m-12 border-2 border-rose-600/20 rounded-[4rem] relative overflow-hidden shadow-4xl">
        <div className="absolute inset-0 bg-rose-900/5 blur-[120px] pointer-events-none" />
        <AlertTriangle size={64} className="text-rose-500/40 mb-10 animate-pulse" />
        <div className="text-3xl font-black uppercase tracking-tighter text-white mb-4 glint-elite">ПОМИЛКА_МЕ� ЕЖЕВОГО_КАНАЛУ</div>
        <p className="text-[12px] font-black font-mono text-white/30 max-w-lg mb-12 leading-relaxed uppercase italic tracking-widest">
          СИСТЕМА_НЕ_ЗМОГЛА_ОТ� ИМАТИ_СТАН_FAILOVER_КЛАСТЕ� А. ПЕ� ЕВІ� ТЕ_З'ЄДНАННЯ_З_ЦЕНТ� АЛЬНИМ_КОНТ� ОЛЕ� ОМ_ELITE.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-12 py-5 bg-rose-600 text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-xl hover:bg-rose-500 transition-all shadow-4xl italic"
        >
          ПЕ� ЕПІДКЛЮЧИТИСЬ_ДО_КАНАЛУ
        </button>
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
    <div className="p-12 space-y-16 max-w-[1700px] mx-auto relative">
      <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />

      {/* Header Section */}
      <div className="flex flex-col gap-3 border-l-4 border-rose-500 pl-10 py-2 relative z-10">
        <div className="flex items-center gap-6">
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic glint-elite">
            ГЛОБАЛЬНЕ КЕ� УВАННЯ <span className="text-rose-500">FAILOVER-ПОТОКАМИ</span>
          </h2>
          <div className="px-4 py-1.5 bg-rose-500/10 border-2 border-rose-500/30 rounded-lg text-[10px] font-black text-rose-500 tracking-[0.3em] uppercase italic shadow-2xl">
            ROUTING_ELITE_v61.0
          </div>
        </div>
        <div className="flex items-center gap-8 text-[11px] font-black font-mono text-white/30 tracking-[0.2em] uppercase italic">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
            <span className="text-emerald-500/80">МЕ� ЕЖЕВИЙ_КАНАЛ_АКТИВНИЙ_L3</span>
          </div>
          <span className="opacity-20">•</span>
          <div className="flex items-center gap-3">
             <RefreshCw size={14} className="text-rose-500/60 animate-spin-slow" />
             <span>� ЕЗЕ� ВУВАННЯ: {Object.values(nodes).filter((n: any) => n.status === 'online').length}/{Object.keys(nodes).length}</span>
          </div>
          <span className="opacity-20">•</span>
          <div className="flex items-center gap-3 text-rose-500/40">
             <Shield size={14} />
             <span>ПОЛІТИКА: АВТОМАТИЧНА_П� ЕВЕНТИВНА_WRAITH</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
        {/* Tri-State режими */}
        <div className="space-y-8">
          <div className="flex items-center gap-6 px-4">
             <div className="w-2 h-2 bg-rose-500 rotate-45 shadow-[0_0_10px_rgba(225,29,72,1)]" />
             <span className="text-[12px] font-black font-mono text-white/40 uppercase tracking-[0.5em] italic glint-elite">СТ� АТЕГІЯ_МА� Ш� УТИЗАЦІЇ_ШІ</span>
          </div>
          <div className="space-y-4">
            {(Object.keys(MODES) as RouteMode[]).map((mode) => {
              const m = MODES[mode];
              const active = activeMode === mode;
              return (
                <button
                  key={mode}
                  disabled={toggleMutation.isPending}
                  className={cn(
                    'w-full flex items-center gap-8 px-8 py-8 rounded-[2.5rem] border-2 text-left transition-all duration-700 relative overflow-hidden group shadow-4xl',
                    active ? 'glass-wraith border-rose-500/40 bg-rose-500/5 shadow-rose-500/20' : 'bg-white/[0.02] border-white/5 hover:border-white/20',
                    toggleMutation.isPending && 'opacity-50 cursor-wait'
                  )}
                >
                  <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
                  <div className={cn(
                    'w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-700',
                    active ? 'bg-rose-500/20 border-rose-500/40 shadow-rose-500/30' : 'bg-white/5 border-white/10 group-hover:bg-white/10'
                  )}>
                    <m.icon size={32} className={cn('transition-all duration-700 group-hover:scale-110', active ? 'text-rose-500' : 'text-white/20')} />
                  </div>
                  <div className="relative z-10 flex-1">
                    <div className={cn('text-xl font-black tracking-widest italic uppercase glint-elite', active ? 'text-rose-500' : 'text-white/60')}>
                      {m.label}
                    </div>
                    <div className="text-[10px] font-black font-mono text-white/20 mt-2 uppercase tracking-widest group-hover:text-white/40 transition-colors italic">{m.desc}</div>
                  </div>
                  {active && (
                    <motion.div 
                      layoutId="active-indicator-mode"
                      className="p-3 bg-rose-500/20 border-2 border-rose-500/40 rounded-2xl shadow-rose-500/40 animate-pulse"
                    >
                      <CheckCircle className="w-6 h-6 text-rose-500" />
                    </motion.div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Матриця вузлів */}
        <div className="space-y-8">
          <div className="flex items-center gap-6 px-4">
             <div className="w-2 h-2 bg-rose-500 rotate-45 shadow-[0_0_10px_rgba(225,29,72,1)]" />
             <span className="text-[12px] font-black font-mono text-white/40 uppercase tracking-[0.5em] italic glint-elite">МАТ� ИЦЯ_АКТИВНИХ_ВУЗЛІВ</span>
          </div>
          <div className="space-y-4">
            {Object.keys(nodes).map((nodeKey) => {
              const node = nodes[nodeKey];
              const isActive = activeNode === nodeKey;
              const isOffline = node.status === 'offline';
              const label = node.label.replace('local-k3s', 'ЛОКАЛЬНИЙ_КЛАСТЕ� ').replace('nvidia-server', 'СЕ� ВЕ� _NVIDIA').replace('colab-mirror', 'ДЗЕ� КАЛО_COLAB');
              
              return (
                <div
                  key={nodeKey}
                  className={cn(
                    'flex items-center gap-8 px-8 py-8 rounded-[2.5rem] border-2 relative overflow-hidden group transition-all duration-700 shadow-4xl',
                    isActive  ? 'glass-wraith border-rose-500/40 bg-rose-500/5 shadow-rose-500/20' :
                    isOffline ? 'bg-black/60 border-rose-500/10 opacity-40' :
                                'bg-white/[0.02] border-white/5 hover:border-white/10',
                  )}
                >
                  <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
                  <div className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-700',
                    isActive ? 'bg-rose-500/20 border-rose-500/40 shadow-rose-500/30' : 'bg-white/5 border-white/10'
                  )}>
                    <Server size={28} className={isActive ? 'text-rose-500' : 'text-white/20'} />
                  </div>
                  <div className="flex-1 relative z-10">
                    <div className={cn('text-xl font-black tracking-widest italic uppercase glint-elite', isActive ? 'text-white' : 'text-white/60')}>
                       {label}
                    </div>
                    <div className="text-[10px] font-black font-mono text-white/20 mt-2 group-hover:text-white/40 transition-colors uppercase tracking-[0.3em] italic">{node.ip}</div>
                  </div>
                  {!isActive && !isOffline && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSwitch(nodeKey)}
                      disabled={toggleMutation.isPending}
                      className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-rose-500/10 border-2 border-rose-500/30 hover:bg-rose-500/20 hover:border-rose-500/50 transition-all group/btn shadow-4xl"
                    >
                      <ArrowRightLeft className="w-5 h-5 text-rose-500 group-hover/btn:rotate-180 transition-transform duration-1000" />
                      <span className="text-[11px] text-rose-500 font-black uppercase tracking-[0.2em] italic">ПЕ� ЕМКНУТИ</span>
                    </motion.button>
                  )}
                  {isActive && (
                    <div className="px-8 py-4 bg-rose-600 rounded-2xl shadow-rose-500/50 relative z-10 border-2 border-rose-400/30">
                       <span className="text-[11px] font-black text-white uppercase tracking-[0.2em] italic">АКТИВНИЙ_ВУЗОЛ</span>
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
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="p-12 glass-wraith border-2 border-rose-500/40 rounded-[3rem] flex flex-col lg:flex-row items-center gap-12 shadow-4xl relative overflow-hidden z-50"
          >
            <div className="absolute inset-0 bg-rose-500/[0.03] animate-pulse pointer-events-none" />
            <div className="p-8 bg-rose-500/10 rounded-[2rem] border-2 border-rose-500/30 shadow-rose-500/20">
               <AlertTriangle className="w-16 h-16 text-rose-500" />
            </div>
            <div className="flex-1 space-y-4 relative z-10 text-center lg:text-left">
              <div className="text-2xl text-white font-black uppercase tracking-tighter italic glint-elite">
                ПІДТВЕ� ДЖЕННЯ � ОТАЦІЇ <span className="text-rose-500">{nodes[confirming]?.label.replace('local-k3s', 'ЛОКАЛЬНИЙ_КЛАСТЕ� ').replace('nvidia-server', 'СЕ� ВЕ� _NVIDIA').replace('colab-mirror', 'ДЗЕ� КАЛО_COLAB') || confirming}</span>
              </div>
              <p className="text-[12px] font-black font-mono text-white/30 uppercase tracking-[0.3em] leading-relaxed italic max-w-2xl">
                УСІ_АКТИВНІ_ЗАПИТИ_БУДУТЬ_ПЕ� ЕНАП� АВЛЕНІ_НА_НОВИЙ_ВУЗОЛ_ЕЛІТНОГО_КЛАСУ. МОЖЛИВЕ_КО� ОТКОЧАСНЕ_ПЕ� Е� ИВАННЯ_ПОТОКУ_ДАННИХ (OODA_SYNC_BREAK_V61).
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 relative z-10 w-full lg:w-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={confirmSwitch}
                disabled={toggleMutation.isPending}
                className="px-12 py-5 bg-rose-600 text-white text-[12px] font-black uppercase tracking-[0.3em] rounded-xl shadow-rose-500/50 hover:bg-rose-500 transition-all disabled:opacity-50 italic w-full"
              >
                {toggleMutation.isPending ? 'СИНХ� ОНІЗАЦІЯ_L3...' : 'ПІДТВЕ� ДИТИ_� ОТАЦІЮ'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setConfirming(null)}
                className="px-12 py-5 bg-white/5 border-2 border-white/10 text-white/60 text-[12px] font-black uppercase tracking-[0.3em] rounded-xl hover:bg-white/10 transition-all italic w-full"
              >
                СКАСУВАТИ
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Лог переключень */}
      <div className="space-y-10 relative z-10 pb-20">
        <div className="flex items-center gap-10 px-4">
          <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="flex flex-col items-center gap-3">
            <span className="text-2xl font-black text-white/50 uppercase tracking-[0.4em] italic glint-elite">ЖУ� НАЛ_� ОТАЦІЙ_МА� Ш� УТІВ (WORM_LOCK)</span>
            <div className="flex items-center gap-4">
               <RefreshCw size={14} className="text-rose-500/40 animate-spin-slow" />
               <span className="text-[10px] font-black font-mono text-white/20 uppercase tracking-[0.3em] font-black italic">AUDIT_TRAIL_ACTIVE_V61.0_ELITE</span>
            </div>
          </div>
          <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent via-white/10 to-transparent" />
        </div>
        <div className="glass-wraith border-2 border-white/5 rounded-[3.5rem] overflow-hidden backdrop-blur-3xl shadow-4xl relative p-4">
          <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none" />
          <VirtualTable
            rows={history}
            columns={eventCols}
            rowHeight={64}
            maxHeight={500}
            getRowStatus={getEventStatus}
          />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
          .shadow-4xl { box-shadow: 0 60px 120px -30px rgba(0,0,0,0.9); }
          .glint-elite { text-shadow: 0 0 30px rgba(225,29,72,0.4); }
          .animate-spin-slow { animation: spin 10s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
};

export default FailoverRoutingTab;
