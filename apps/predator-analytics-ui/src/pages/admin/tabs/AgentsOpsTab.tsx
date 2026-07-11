import { Button } from '@/components/ui/button';
import { BrandLoaderFallback } from '@/components/polish/BrandLoader';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Cpu, MemoryStick, Clock, CheckCircle, XCircle, MinusCircle, RefreshCw, Zap, Shield, Globe, Activity, Server, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VirtualTable, VirtualColumn, RowStatus } from '@/components/shared/VirtualTable';
import { useAgentsStats, useExecuteAction } from '@/hooks/useAdminApi';

import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';

// ─── Типи ─────────────────────────────────────────────────────────────────────

interface AgentRow {
  id: string;
  name: string;
  type: string;
  status: 'alive' | 'dead' | 'idle' | 'starting';
  cpu: number;
  ram: number;
  queueDepth: number;
  successRate: number;
  tasksTotal: number;
  lastActivity: string;
  model: string;
}

const getAgentStatus = (row: AgentRow): RowStatus =>
  row.status === 'alive'    ? 'ok' :
  row.status === 'dead'     ? 'danger' :
  row.status === 'starting' ? 'info' : 'neutral';

// ─── MAIN VIEW ───────────────────────────────────────────────────────────────

export const AgentsOpsTab: React.FC = () => {
  const { data, isLoading, isError } = useAgentsStats();
  const executeAction = useExecuteAction();

  const handleAction = async (agentId: string, action: string) => {
    await executeAction.mutateAsync({ agentId, action });
  };

  const agentCols: VirtualColumn<AgentRow>[] = [
    { 
      key: 'name',        
      label: 'ШІ_ОПЕРАТОР_ELITE',         
      width: '250px', 
      mono: true, 
      render: (v) => (
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-cyan-500 " />
          <span className="font-black tracking-tight uppercase italic text-white glint-elite">{String(v)}</span>
        </div>
      )
    },
    { 
      key: 'status',      
      label: 'СТАТУС_ЯДРА',          
      width: '160px', 
      render: (s: any) => {
        const map: Record<string, string> = {
          alive:    'text-cyan-500',
          dead:     'text-white/20',
          idle:     'text-amber-400',
          starting: 'text-sky-400',
        };
        const labelMap: Record<string, string> = {
          alive:    'АКТИВНИЙ',
          dead:     'ТЕРМІНОВАНО',
          idle:     'ОЧІКУВАННЯ',
          starting: 'ІНІЦІАЛІЗАЦІЯ',
        };
        return (
          <div className={cn('text-[10px] font-black tracking-[0.2em] flex items-center gap-3 italic uppercase', map[s])}>
            <div className={cn("w-2 h-2 rounded-full  shadow-[0_0_8px_currentColor]", s === 'alive' ? 'bg-cyan-500' : 'bg-current')} />
            {labelMap[s] || s.toUpperCase()}
          </div>
        );
      },
    },
    {
      key: 'cpu',         label: 'CPU_ТИСК',           width: '100px',  mono: true, align: 'right',
      render: (v) => {
        const n = Number(v);
        return <span className={cn("font-black italic text-[11px]", n > 80 ? 'text-cyan-500 ' : n > 60 ? 'text-amber-400' : 'text-emerald-500/80')}>{n}%</span>;
      },
    },
    {
      key: 'ram',         label: 'VRAM_ПАМ\'ЯТЬ',           width: '100px',  mono: true, align: 'right',
      render: (v) => {
        const n = Number(v);
        return <span className={cn("font-black italic text-[11px]", n > 80 ? 'text-cyan-500  shadow-cyan-500/20' : n > 60 ? 'text-amber-400' : 'text-sky-500/80')}>{n}%</span>;
      },
    },
    {
      key: 'id',
      label: 'ДІЇ',
      width: '120px',
      align: 'right',
      render: (id) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="cyber" 
            title="Перезапустити агента"
            onClick={() => handleAction(id as string, 'restart')}
            disabled={executeAction.isPending}
            className="p-2 bg-white/5 hover:bg-cyan-500/20 text-cyan-500/40 hover:text-cyan-500 rounded-lg transition-all disabled:opacity-30"
          >
            <RefreshCw size={12} className={cn(executeAction.isPending && "animate-spin")} />
          </Button>
          <Button variant="cyber" 
            title="Завершити процес"
            onClick={() => handleAction(id as string, 'kill')}
            disabled={executeAction.isPending}
            className="p-2 bg-white/5 hover:bg-cyan-600 text-white/20 hover:text-white rounded-lg transition-all disabled:opacity-30"
          >
            <XCircle size={12} />
          </Button>
        </div>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[700px] text-white/40 space-y-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-cyber-grid opacity-[0.05] pointer-events-none" />
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 border-2 border-cyan-500/20 rounded-full border-t-rose-500 "
          />
          <Bot className="absolute inset-0 m-auto w-8 h-8 text-cyan-500 " />
        </div>
        <div className="text-[14px] font-black font-mono uppercase tracking-[0.6em]  italic text-cyan-500/60">ОПИТУВАННЯ_НЕЙРОННОГО_РОЮ_V61...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[700px] p-24 text-center glass-wraith m-12 border-2 border-cyan-600/20 rounded-[4rem] relative overflow-hidden shadow-4xl">
        <div className="absolute inset-0 bg-rose-900/5 blur-[120px] pointer-events-none" />
        <Bot size={64} className="text-cyan-500/40 mb-10 " />
        <div className="text-3xl font-black uppercase tracking-tighter text-white mb-4 glint-elite"> РОЗСИНХРОНІЗАЦІЯ_НЕЙРОННОЇ_МЕРЕЖІ</div>
        <p className="text-[12px] font-black font-mono text-white/30 max-w-lg mb-12 leading-relaxed uppercase italic tracking-widest">
          СИСТЕМА_ВТРАТИЛА_ЗВ'ЯЗОК_З_ОРКЕСТРАТОРОМ_АГЕНТІВ. ПЕРЕВІРТЕ_СТАН_AGENT_CONTROL_HUB_ELITE_v61.
        </p>
        <Button variant="cyber" 
          onClick={() => window.location.reload()}
          className="px-12 py-5 bg-cyan-600 text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-xl hover:bg-cyan-500 transition-all shadow-4xl italic"
        >
          ПЕРЕПІДКЛЮЧИТИСЬ_ДО_РОЮ
        </Button>
      </div>
    );
  }

  const { stats, list: agents } = data || { stats: { total: 0, alive: 0, dead: 0, idle: 0, avgCpu: 0 }, list: [] };


  return (
    <div className="p-12 space-y-16 max-w-[1700px] mx-auto relative">
      <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />

      {/* Header Section */}
      <div className="flex flex-col gap-3 border-l-4 border-cyan-500 pl-10 py-2 relative z-10">
        <div className="flex items-center gap-6">
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic glint-elite">
            УПРАВЛІННЯ <span className="text-cyan-500">НЕЙРОННИМ РОЄМ</span>
          </h2>
          <div className="px-4 py-1.5 bg-cyan-500/10 border-2 border-cyan-500/30 rounded-lg text-[10px] font-black text-cyan-500 tracking-[0.3em] uppercase italic shadow-2xl">
            HIVE_MIND_CONTROL_v61.0
          </div>
        </div>
        <div className="flex items-center gap-8 text-[11px] font-black font-mono text-white/30 tracking-[0.2em] uppercase italic">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500  " />
            <span className="text-emerald-500/80">ЗДОРОВ'Я_РОЮ: {stats?.total || 0}%</span>

          </div>
          <span className="opacity-20">•</span>
          <div className="flex items-center gap-3">
             <RefreshCw size={14} className="text-cyan-500/60 animate-spin-slow" />
             <span>ПОПУЛЯЦІЯ: {agents.length} НЕЙРОННИХ_ВУЗЛІВ</span>
          </div>
          <span className="opacity-20">•</span>
          <div className="flex items-center gap-3 text-cyan-500/40">
             <Shield size={14} />
             <span>СИНХРОНІЗАЦІЯ: ELITE_REALTIME_OODA</span>
          </div>
        </div>
      </div>

      {/* Загальні метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 relative z-10">
        {[
          { label: 'АКТИВНІ_ЮНІТИ', value: stats.alive, sub: 'В_РОБОТІ_ЯДРА', color: 'text-cyan-500', icon: Bot },
          { label: 'ТЕРМІНОВАНО', value: stats.dead, sub: 'ОФЛАЙН_КАНАЛ', color: 'text-rose-900', icon: XCircle },
          { label: 'РЕЖИМ_ОЧІКУВАННЯ', value: stats.idle, sub: 'ГОТОВНІСТЬ_L5', color: 'text-white/40', icon: Clock },
          { label: 'ОБЧИСЛЮВАЛЬНИЙ_ТИСК', value: `${stats.avgCpu}%`, sub: 'СЕРЕДНЄ_НАВАНТ.', color: 'text-sky-500', icon: Cpu },
          { label: 'ГЛОБАЛЬНИЙ_СТЕК', value: agents.reduce((s: number, a: AgentRow) => s + (a.queueDepth || 0), 0).toLocaleString(), sub: 'ЗАВДАНЬ_У_ЧЕРЗІ', color: 'text-cyan-500', icon: Database },
        ].map((metric, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            className="glass-wraith border-2 border-white/5 p-10 rounded-[2.5rem] flex flex-col justify-between group hover:border-cyan-500/40 transition-all duration-700 shadow-4xl hover:-translate-y-1 overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
            <div className="absolute top-4 right-4 p-2 opacity-[0.05] group-hover:opacity-[0.2] transition-opacity duration-700">
               <metric.icon size={48} className={metric.color} />
            </div>
            
            <div className="flex flex-col relative z-10">
              <span className="text-[10px] font-black font-mono text-white/20 uppercase tracking-[0.4em] mb-4 italic group-hover:text-cyan-500/40 transition-colors">{metric.label}</span>
              <div className="flex items-baseline gap-4">
                <span className={cn("text-4xl font-black italic tracking-tighter glint-elite", metric.color)}>{metric.value}</span>
              </div>
              <div className="text-[9px] font-black font-mono text-white/10 mt-6 uppercase tracking-[0.2em] italic group-hover:text-cyan-500/60 transition-colors">{metric.sub}</div>
            </div>

            <div className={cn(
              "absolute bottom-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-all duration-700",
              metric.color.includes('rose') ? "bg-cyan-500/50 " : 
              metric.color.includes('sky') ? "bg-sky-500/50 " : 
              "bg-white/20 "
            )} />
          </motion.div>
        ))}
      </div>

      {/* Таблиця агентів */}
      <div className="space-y-10 relative z-10 pb-20">
        <div className="flex items-center gap-10 px-4">
          <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="flex flex-col items-center gap-3">
            <span className="text-2xl font-black text-white/50 uppercase tracking-[0.4em] italic glint-elite">МАТРИЦЯ ШІ-ВУЗЛІВ</span>
            <div className="flex items-center gap-4">
               <Bot size={14} className="text-cyan-500/40 " />
               <span className="text-[10px] font-black font-mono text-cyan-500/60 uppercase tracking-[0.3em] font-black italic">НЕЙРОННИЙ_РЕЄСТР_СИНХРОНІЗОВАНО_V61_ELITE</span>
            </div>
          </div>
          <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent via-white/10 to-transparent" />
        </div>
        <div className="glass-wraith border-2 border-white/5 rounded-[3.5rem] overflow-hidden  shadow-4xl relative p-4">
          <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none" />
          <VirtualTable
            rows={agents}
            columns={agentCols}
            rowHeight={64}
            maxHeight={650}
            getRowStatus={getAgentStatus}
            emptyLabel="НЕЙРОННИХ_ОДИНИЦЬ_НЕ_ВИЯВЛЕНО"
          />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
          .shadow-4xl { box-shadow: 0 60px 120px -30px rgba(0,0,0,0.9); }
          .glint-elite { text-shadow: 0 0 30px rgba(6,182,212,0.4); }
          .animate-spin-slow { animation: spin 10s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
};

export default AgentsOpsTab;
