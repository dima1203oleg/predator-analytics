import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Cpu, MemoryStick, Clock, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VirtualTable, VirtualColumn, RowStatus } from '@/components/shared/VirtualTable';
import { useAgentsStats } from '@/hooks/useAdminApi';
import { Loader2 } from 'lucide-react';

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

// ─── Колонки ──────────────────────────────────────────────────────────────────

// ─── Колонки ──────────────────────────────────────────────────────────────────

const agentCols: VirtualColumn<AgentRow>[] = [
  { key: 'name',        label: 'ШІ_ОПЕРАТОР',         width: '180px', mono: true, render: (v) => <span className="font-bold tracking-tight uppercase italic text-white/80">{String(v)}</span> },
  {
    key: 'status',      label: 'СТАТУС',         width: '100px',
    render: (v) => {
      const s = String(v);
      const map: Record<string, string> = {
        alive:    'text-rose-500',
        dead:     'text-white/20',
        idle:     'text-amber-500/50',
        starting: 'text-sky-400/60',
      };
      const labelMap: Record<string, string> = {
        alive:    'АКТИВНИЙ',
        dead:     'ТЕРМІНОВАНО',
        idle:     'ОЧІКУВАННЯ',
        starting: 'ІНІЦІАЛІЗАЦІЯ',
      };
      return (
        <div className={cn('text-[9px] font-black tracking-widest flex items-center gap-1.5', map[s])}>
          <div className={cn("w-1 h-1 rounded-full", s === 'alive' ? 'bg-rose-500 animate-pulse' : 'bg-current')} />
          {labelMap[s] || s.toUpperCase()}
        </div>
      );
    },
  },
  {
    key: 'cpu',         label: 'CPU_ТИСК',           width: '85px',  mono: true, align: 'right',
    render: (v) => {
      const n = Number(v);
      return <span className={cn("font-black italic", n > 80 ? 'text-rose-500 animate-pulse' : n > 60 ? 'text-amber-400' : 'text-white/40')}>{n}%</span>;
    },
  },
  {
    key: 'ram',         label: 'VRAM_ПАМ\'ЯТЬ',           width: '85px',  mono: true, align: 'right',
    render: (v) => {
      const n = Number(v);
      return <span className={cn("font-black italic", n > 80 ? 'text-rose-500' : n > 60 ? 'text-amber-400' : 'text-white/40')}>{n}%</span>;
    },
  },
  {
    key: 'queueDepth',  label: 'СТЕК_ЗАВДАНЬ',          width: '90px',  mono: true, align: 'right',
    render: (v) => {
      const n = Number(v);
      return <span className={cn("font-bold italic", n > 50 ? 'text-amber-400' : 'text-white/30')}>{n}</span>;
    },
  },
  {
    key: 'successRate', label: 'ЕФЕКТИВНІСТЬ',      width: '100px',  mono: true, align: 'right',
    render: (v) => {
      const n = Number(v);
      return <span className={cn("font-black italic", n === 0 ? 'text-white/10' : n < 95 ? 'text-amber-400' : 'text-emerald-500/70')}>{n > 0 ? `${n}%` : '—'}</span>;
    },
  },
  { key: 'tasksTotal',  label: 'АРТЕФАКТИ',        width: '100px',  mono: true, align: 'right', render: (v) => <span className="text-white/50 font-bold italic">{Number(v).toLocaleString()}</span> },
  { key: 'model',       label: 'ЯДРО_LLM',         width: '160px', mono: true, render: (v) => <span className="text-white/20 text-[9px] uppercase font-black italic">{String(v)}</span> },
  { key: 'lastActivity',label: 'ОСТАННЯ_МАНІПУЛЯЦІЯ',                     mono: true, render: (v) => <span className="text-white/10 text-[8px] uppercase italic tracking-tighter">{String(v)}</span> },
];

const getAgentStatus = (row: AgentRow): RowStatus =>
  row.status === 'alive'    ? 'ok' :
  row.status === 'dead'     ? 'danger' :
  row.status === 'starting' ? 'info' : 'neutral';

// ─── Вкладка ─────────────────────────────────────────────────────────────────

export const AgentsOpsTab: React.FC = () => {
  const { data, isLoading, isError } = useAgentsStats();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-white/30 space-y-6">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-rose-500/20" strokeWidth={1} />
          <Bot className="absolute inset-0 m-auto w-5 h-5 text-rose-500 animate-pulse" />
        </div>
        <div className="text-[10px] font-mono uppercase tracking-[0.4em] animate-pulse italic">ОПИТУВАННЯ_НЕЙРОННОГО_РОЮ...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] p-12 text-center glass-wraith m-8 border border-rose-500/20 rounded-xl">
        <Bot size={48} className="text-rose-500/40 mb-6" />
        <div className="text-[18px] font-black uppercase tracking-widest text-white/90 mb-2">РОЗСИНХРОНІЗАЦІЯ_НЕЙРОННОЇ_МЕРЕЖІ</div>
        <p className="text-[11px] font-mono text-white/30 max-w-sm mb-8 leading-relaxed uppercase italic">
          СИСТЕМА_ВТРАТИЛА_ЗВ'ЯЗОК_З_ОРКЕСТРАТОРОМ_АГЕНТІВ. ПЕРЕВІРТЕ_СТАН_AGENT_CONTROL_HUB.
        </p>
      </div>
    );
  }

  const { stats, list: agents } = data;

  return (
    <div className="p-8 space-y-10 max-w-[1400px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-1 border-l-2 border-rose-500 pl-6 py-1">
        <div className="flex items-center gap-3">
          <h2 className="text-[18px] font-black text-white uppercase tracking-[0.2em]">
            Управління Нейронним Роєм (Hive Mind Controller)
          </h2>
          <div className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 rounded-sm text-[8px] font-bold text-rose-500 tracking-tighter uppercase italic">
            КОНТРОЛЬ_РОЮ_L5_ELITE
          </div>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-mono text-white/30 tracking-widest uppercase">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span>ЗДОРОВ'Я_РОЮ: {stats.total > 0 ? Math.round((stats.alive / stats.total) * 100) : 0}%</span>
          </div>
          <span>•</span>
          <span>ПОПУЛЯЦІЯ: {agents.length} НЕРВОВИХ_ВУЗЛІВ</span>
          <span>•</span>
          <span>СИНХРОНІЗАЦІЯ: РЕАЛЬНИЙ_ЧАС</span>
        </div>
      </div>

      {/* Загальні метрики */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
        {[
          { label: 'АКТИВНІ_ЮНІТИ', value: stats.alive, sub: 'В_РОБОТІ', color: 'text-rose-500' },
          { label: 'ТЕРМІНОВАНІ', value: stats.dead, sub: 'ОФЛАЙН_КАНАЛ', color: 'text-rose-900' },
          { label: 'РЕЖИМ_ОЧІКУВАННЯ', value: stats.idle, sub: 'ГОТОВНІСТЬ', color: 'text-white/40' },
          { label: 'ОБЧИСЛЮВАЛЬНИЙ_ТИСК', value: `${stats.avgCpu}%`, sub: 'СЕР_НАВАНТАЖЕННЯ', color: 'text-white/80' },
          { label: 'ГЛОБАЛЬНИЙ_СТЕК', value: agents.reduce((s, a) => s + (a.queueDepth || 0), 0).toLocaleString(), sub: 'ЗАВДАНЬ_У_ЧЕРЗІ', color: 'text-rose-500' },
        ].map((metric, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-wraith border border-white/5 p-6 rounded-xl group hover:border-rose-500/30 transition-all duration-500 relative overflow-hidden"
          >
            <div className="absolute inset-0 cyber-scan-grid opacity-[0.02] pointer-events-none" />
            <div className="text-[8px] font-mono text-white/20 uppercase tracking-[0.3em] mb-2 font-black italic">{metric.label}</div>
            <div className={cn('text-[24px] font-black tracking-tighter italic leading-none drop-shadow-sm', metric.color)}>{metric.value}</div>
            <div className="text-[8px] font-mono text-white/10 mt-3 uppercase tracking-widest font-bold group-hover:text-rose-500/40 transition-colors italic">{metric.sub}</div>
            
            {/* HUD Accent */}
            <div className="absolute top-2 right-2 w-1.5 h-1.5 border-t border-r border-white/10 group-hover:border-rose-500 transition-colors" />
          </motion.div>
        ))}
      </div>

      {/* Таблиця агентів */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-[12px] font-mono font-black text-white/40 uppercase tracking-[0.5em] italic glint-elite">МАТРИЦЯ ШІ-ВУЗЛІВ (AGENT_MATRIX_V60.5)</span>
            <div className="flex items-center gap-2">
               <Bot size={10} className="text-rose-500/40 animate-pulse" />
               <span className="text-[7px] font-mono text-white/20 uppercase tracking-widest font-black italic">НЕЙРОННИЙ_РЕЄСТР_СИНХРОНІЗОВАНО_ELITE</span>
            </div>
          </div>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-white/10 to-transparent" />
        </div>
        <div className="glass-wraith border border-white/5 rounded-xl overflow-hidden backdrop-blur-3xl shadow-2xl relative">
          <div className="absolute inset-0 cyber-scan-grid opacity-[0.02] pointer-events-none" />
          <VirtualTable
            rows={agents}
            columns={agentCols}
            rowHeight={48}
            maxHeight={550}
            getRowStatus={getAgentStatus}
            emptyLabel="НЕЙРОННИХ_ОДИНИЦЬ_НЕ_ВИЯВЛЕНО"
          />
        </div>
      </div>
    </div>
  );
};

export default AgentsOpsTab;
