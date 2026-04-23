import React from 'react';
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
  { key: 'name',        label: 'Агент',         width: '180px', mono: true },
  {
    key: 'status',      label: 'Статус',         width: '80px',
    render: (v) => {
      const s = String(v);
      const map: Record<string, string> = {
        alive:    'text-rose-500',
        dead:     'text-red-500',
        idle:     'text-white/30',
        starting: 'text-rose-400/60',
      };
      const labelMap: Record<string, string> = {
        alive:    'АКТИВНИЙ',
        dead:     'НЕАКТИВНИЙ',
        idle:     'ОЧІКУВАННЯ',
        starting: 'ЗАПУСК',
      };
      return <span className={cn('text-[10px] font-mono font-semibold', map[s])}>{labelMap[s] || s.toUpperCase()}</span>;
    },
  },
  {
    key: 'cpu',         label: 'CPU%',           width: '65px',  mono: true, align: 'right',
    render: (v) => {
      const n = Number(v);
      return <span className={n > 80 ? 'text-red-400' : n > 60 ? 'text-amber-400' : 'text-white/50'}>{n}%</span>;
    },
  },
  {
    key: 'ram',         label: 'RAM%',           width: '65px',  mono: true, align: 'right',
    render: (v) => {
      const n = Number(v);
      return <span className={n > 80 ? 'text-red-400' : n > 60 ? 'text-amber-400' : 'text-white/50'}>{n}%</span>;
    },
  },
  {
    key: 'queueDepth',  label: 'Черга',          width: '70px',  mono: true, align: 'right',
    render: (v) => {
      const n = Number(v);
      return <span className={n > 100 ? 'text-amber-400' : 'text-white/45'}>{n}</span>;
    },
  },
  {
    key: 'successRate', label: 'Успішність',      width: '80px',  mono: true, align: 'right',
    render: (v) => {
      const n = Number(v);
      return <span className={n === 0 ? 'text-white/20' : n < 95 ? 'text-amber-400' : 'text-rose-400/70'}>{n > 0 ? `${n}%` : '—'}</span>;
    },
  },
  { key: 'tasksTotal',  label: 'Завдань',        width: '80px',  mono: true, align: 'right', render: (v) => Number(v).toLocaleString() },
  { key: 'model',       label: 'Модель',         width: '140px', mono: true, render: (v) => <span className="text-white/30">{String(v)}</span> },
  { key: 'lastActivity',label: 'Активність',                     mono: true },
];

const getAgentStatus = (row: AgentRow): RowStatus =>
  row.status === 'alive'    ? 'ok' :
  row.status === 'dead'     ? 'danger' :
  row.status === 'starting' ? 'info' : 'neutral';

// ─── Метрика-картка ───────────────────────────────────────────────────────────

const MetricCard: React.FC<{ label: string; value: string | number; sub?: string; color?: string }> = ({
  label, value, sub, color = 'text-white/65',
}) => (
  <div className="px-3 py-2.5 bg-[#0a0a0a] rounded-sm border border-white/6 group hover:border-rose-500/30 transition-colors">
    <div className="text-[8px] font-semibold text-white/20 uppercase tracking-[0.2em] mb-1">{label}</div>
    <div className={cn('text-[18px] font-mono font-bold leading-none', color)}>{value}</div>
    {sub && <div className="text-[9px] font-mono text-white/25 mt-0.5">{sub}</div>}
  </div>
);

// ─── Вкладка ─────────────────────────────────────────────────────────────────

// ─── Вкладка ─────────────────────────────────────────────────────────────────

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
        <div className="text-[10px] font-mono uppercase tracking-[0.4em] animate-pulse italic">Опитування рою...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] p-12 text-center glass-wraith m-8 border border-rose-500/20 rounded-xl">
        <Bot size={48} className="text-rose-500/40 mb-6" />
        <div className="text-[18px] font-black uppercase tracking-widest text-white/90 mb-2">ПОМИЛКА РОЮ</div>
        <p className="text-[11px] font-mono text-white/30 max-w-sm mb-8 leading-relaxed">
          Система не змогла встановити зв'язок з оркестратором агентів. Перевірте стан AgentOps-контролера.
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
            Оркестрація Агентів
          </h2>
          <div className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 rounded-sm text-[8px] font-bold text-rose-500 tracking-tighter">
            КОНТРОЛЬ_РОЮ_L5
          </div>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-mono text-white/30 tracking-widest uppercase">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span>Здоров'я рою: 100%</span>
          </div>
          <span>•</span>
          <span>Популяція: {agents.length} Вузлів</span>
          <span>•</span>
          <span>Синхронізація: РЕАЛЬНИЙ_ЧАС</span>
        </div>
      </div>

      {/* Загальні метрики */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
        {[
          { label: 'ЖИВИХ', value: stats.alive, sub: 'АКТИВНІ', color: 'text-rose-500' },
          { label: 'МЕРТВИХ', value: stats.dead, sub: 'ПОЗА МЕРЕЖЕЮ', color: 'text-rose-900' },
          { label: 'ПРОСТІЙ', value: stats.idle, sub: 'ОЧІКУВАННЯ', color: 'text-white/40' },
          { label: 'СЕР. CPU', value: `${stats.avgCpu}%`, sub: 'СЕР_НАВАНТАЖЕННЯ', color: 'text-white/80' },
          { label: 'ЧЕРГА', value: agents.reduce((s, a) => s + (a.queueDepth || 0), 0).toLocaleString(), sub: 'ЗАГАЛОМ_ЗАВДАНЬ', color: 'text-rose-500' },
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
            <div className="text-[8px] font-mono text-white/10 mt-3 uppercase tracking-widest font-bold group-hover:text-rose-500/40 transition-colors">{metric.sub}</div>
            
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
            <span className="text-[12px] font-mono font-black text-white/40 uppercase tracking-[0.5em] italic glint-elite">МАТРИЦЯ ШІ-ВУЗЛІВ (AGENT_MATRIX)</span>
            <div className="flex items-center gap-2">
               <Bot size={10} className="text-rose-500/40 animate-pulse" />
               <span className="text-[7px] font-mono text-white/20 uppercase tracking-widest font-black">НЕЙРОННИЙ_РЕЄСТР_СИНХРОНІЗОВАНО</span>
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
            emptyLabel="Агентів не знайдено"
          />
        </div>
      </div>
    </div>
  );
};

export default AgentsOpsTab;
