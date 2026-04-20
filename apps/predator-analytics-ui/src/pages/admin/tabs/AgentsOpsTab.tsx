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
        alive:    'text-emerald-400',
        dead:     'text-red-400',
        idle:     'text-white/30',
        starting: 'text-sky-400',
      };
      return <span className={cn('text-[10px] font-mono font-semibold', map[s])}>{s.toUpperCase()}</span>;
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
    key: 'successRate', label: 'Success%',       width: '80px',  mono: true, align: 'right',
    render: (v) => {
      const n = Number(v);
      return <span className={n === 0 ? 'text-white/20' : n < 95 ? 'text-amber-400' : 'text-emerald-400/70'}>{n > 0 ? `${n}%` : '—'}</span>;
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
  <div className="px-3 py-2.5 bg-[#1a2620] rounded-sm border border-white/6">
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
      <div className="flex flex-col items-center justify-center h-[500px] text-white/40 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400/50" />
        <div className="text-[10px] font-mono uppercase tracking-widest">Синхронізація агентів...</div>
      </div>
    );
  }

  if (isError || !data) {
    return <div>Помилка завантаження даних агентів</div>;
  }

  const { stats, list: agents } = data;

  return (
    <div className="p-4 space-y-4">
      {/* Заголовок */}
      <div className="flex items-center gap-2 pb-2 border-b border-white/6">
        <Bot className="w-4 h-4 text-emerald-400" />
        <h2 className="text-[13px] font-semibold text-white/80 uppercase tracking-wider">
          Оркестрація Агентів
        </h2>
        <span className="text-[9px] font-mono text-white/20 ml-auto">
          {agents.length} агентів
        </span>
      </div>

      {/* Загальні метрики */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <MetricCard label="Живих"    value={stats.alive}   color="text-emerald-400" sub="ALIVE" />
        <MetricCard label="Мертвих"  value={stats.dead}    color="text-red-400"     sub="DEAD"  />
        <MetricCard label="Простій"  value={stats.idle}    color="text-white/35"    sub="IDLE"  />
        <MetricCard label="Сер. CPU" value={`${stats.avgCpu}%`} sub="avg across alive" />
        <MetricCard label="Черга"    value={agents.reduce((s, a) => s + (a.queueDepth || 0), 0).toLocaleString()} sub="всього завдань" />
      </div>

      {/* Таблиця агентів */}
      <VirtualTable
        rows={agents}
        columns={agentCols}
        rowHeight={28}
        maxHeight={520}
        getRowStatus={getAgentStatus}
        emptyLabel="Агентів не знайдено"
      />
    </div>
  );
};


export default AgentsOpsTab;
