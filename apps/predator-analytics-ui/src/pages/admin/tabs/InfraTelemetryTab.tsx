import React, { useState, useMemo } from 'react';
import { Activity, Cpu, HardDrive, Wifi, Thermometer, Server, Monitor, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VirtualTable, VirtualColumn, RowStatus } from '@/components/shared/VirtualTable';
import { useInfraTelemetry } from '@/hooks/useAdminApi';
import { Loader2 } from 'lucide-react';

// ─── Типи ─────────────────────────────────────────────────────────────────────

interface NodeMetric {
  id: string;
  node: string;
  role: string;
  cpu: number;       // %
  ram: number;       // %
  vram?: number;     // % (тільки NVIDIA)
  vramGb?: number;   // числове значення GB
  temp?: number;     // °C
  net: string;       // rx/tx
  status: 'online' | 'offline' | 'degraded';
  uptime: string;
}

interface ServiceStatus {
  name: string;
  status: 'ok' | 'warn' | 'down';
  latencyMs: number;
  version: string;
  lastCheck: string;
}

// ─── Допоміжні UI-компоненти ──────────────────────────────────────────────────

// ─── Допоміжні UI-компоненти ──────────────────────────────────────────────────

interface GaugeBarProps {
  value: number;
  max?: number;
  warnAt?: number;
  dangerAt?: number;
  unit?: string;
  mono?: boolean;
}

const GaugeBar: React.FC<GaugeBarProps> = ({
  value, max = 100, warnAt = 75, dangerAt = 90, unit = '%', mono = true,
}) => {
  const pct = Math.min((value / max) * 100, 100);
  const color =
    pct >= dangerAt ? 'bg-red-400' :
    pct >= warnAt   ? 'bg-amber-400' :
                      'bg-emerald-400';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-1000', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn('text-[10px] w-10 text-right shrink-0', mono && 'font-mono', pct >= dangerAt ? 'text-red-400' : pct >= warnAt ? 'text-amber-400' : 'text-white/55')}>
        {value}{unit}
      </span>
    </div>
  );
};

const StatusBadge: React.FC<{ status: NodeMetric['status'] }> = ({ status }) => {
  const map = {
    online:   { label: 'ONLINE',   cls: 'text-emerald-400 bg-emerald-500/12 border-emerald-400/20' },
    offline:  { label: 'OFFLINE',  cls: 'text-red-400 bg-red-500/12 border-red-400/20' },
    degraded: { label: 'DEGRADED', cls: 'text-amber-400 bg-amber-500/12 border-amber-400/20' },
  };
  const { label, cls } = map[status];
  return (
    <span className={cn('text-[8px] font-mono font-semibold px-1.5 py-0.5 rounded-sm border tracking-wider', cls)}>
      {label}
    </span>
  );
};

// ─── Картка вузла ─────────────────────────────────────────────────────────────

const NodeCard: React.FC<{ node: NodeMetric }> = ({ node }) => (
  <div
    className={cn(
      'p-3 rounded-sm border bg-[#1a2620]',
      node.status === 'online'   ? 'border-white/8' :
      node.status === 'degraded' ? 'border-amber-400/20' :
                                   'border-red-400/15 opacity-60',
    )}
  >
    <div className="flex items-start justify-between mb-3">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <Server className="w-3 h-3 text-white/30" />
          <span className="text-[11px] font-mono font-semibold text-white/75">{node.node}</span>
        </div>
        <span className="text-[9px] text-white/30 ml-5">{node.role}</span>
      </div>
      <StatusBadge status={node.status} />
    </div>

    {node.status !== 'offline' && (
      <div className="space-y-2">
        <div>
          <div className="flex justify-between mb-0.5">
            <span className="text-[9px] text-white/30 flex items-center gap-1"><Cpu className="w-2.5 h-2.5" /> CPU</span>
          </div>
          <GaugeBar value={node.cpu} />
        </div>
        <div>
          <div className="flex justify-between mb-0.5">
            <span className="text-[9px] text-white/30 flex items-center gap-1"><HardDrive className="w-2.5 h-2.5" /> RAM</span>
          </div>
          <GaugeBar value={node.ram} />
        </div>
        {node.vram !== undefined && (
          <div>
            <div className="flex justify-between mb-0.5">
              <span className="text-[9px] text-white/30 flex items-center gap-1"><Layers className="w-2.5 h-2.5" /> VRAM</span>
              <span className="text-[8px] font-mono text-amber-400/60">{node.vramGb} / 8 GB</span>
            </div>
            <GaugeBar value={node.vram} warnAt={70} dangerAt={90} />
          </div>
        )}
        {node.temp !== undefined && (
          <div className="flex items-center gap-2 mt-1">
            <Thermometer className="w-2.5 h-2.5 text-white/20" />
            <span className="text-[10px] font-mono text-white/45">{node.temp}°C</span>
            <Wifi className="w-2.5 h-2.5 text-white/20 ml-2" />
            <span className="text-[9px] font-mono text-white/30">{node.net}</span>
          </div>
        )}
        <div className="mt-1 text-[9px] font-mono text-white/25">
          Uptime: {node.uptime}
        </div>
      </div>
    )}
  </div>
);

// ─── Таблиця сервісів ─────────────────────────────────────────────────────────

const svcColumns: VirtualColumn<ServiceStatus>[] = [
  {
    key: 'name', label: 'Сервіс', width: '160px', mono: true,
    render: (v) => <span className="text-white/65">{String(v)}</span>,
  },
  {
    key: 'status', label: 'Статус', width: '80px',
    render: (v) => {
      const color = v === 'ok' ? 'text-emerald-400' : v === 'warn' ? 'text-amber-400' : 'text-red-400';
      return <span className={cn('text-[10px] font-mono font-semibold', color)}>{String(v).toUpperCase()}</span>;
    },
  },
  {
    key: 'latencyMs', label: 'Latency', width: '80px', mono: true, align: 'right',
    render: (v) => {
      const ms = Number(v);
      const color = ms > 500 ? 'text-red-400' : ms > 200 ? 'text-amber-400' : 'text-emerald-400/70';
      return <span className={color}>{ms} ms</span>;
    },
  },
  { key: 'version',   label: 'Версія',   width: '100px', mono: true },
  { key: 'lastCheck', label: 'Перевірка',              mono: true },
];

const getServiceStatus = (row: ServiceStatus): RowStatus =>
  row.status === 'ok' ? 'ok' : row.status === 'warn' ? 'warning' : 'danger';

// ─── Вкладка Телеметрія Кластера ─────────────────────────────────────────────

// ─── Вкладка Телеметрія Кластера ─────────────────────────────────────────────

export const InfraTelemetryTab: React.FC = () => {
  const { data, isLoading, isError } = useInfraTelemetry();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-white/40 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400/50" />
        <div className="text-[10px] font-mono uppercase tracking-widest">Зчитування телеметрії...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-red-400/60 p-6 border border-red-500/10 bg-red-500/5 rounded-sm m-4">
        <Activity className="w-10 h-10 mb-4 opacity-30" />
        <div className="text-[12px] font-bold uppercase tracking-wider mb-2">Помилка з'єднання з API</div>
        <div className="text-[10px] font-mono text-white/30 text-center max-w-xs">
          Не вдалося отримати дані інфраструктури. Перевірте, чи запущено Mock API Server (порт 9080).
        </div>
      </div>
    );
  }

  const nodes = data.nodes || [];
  const services = data.services || [];

  return (
    <div className="p-4 space-y-4">
      {/* Заголовок */}
      <div className="flex items-center gap-2 pb-2 border-b border-white/6">
        <Activity className="w-4 h-4 text-emerald-400" />
        <h2 className="text-[13px] font-semibold text-white/80 uppercase tracking-wider">
          Телеметрія Кластера
        </h2>
        <div className="flex items-center gap-1 ml-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] font-mono text-emerald-400/60">LIVE · оновлення 3с</span>
        </div>
        <div className="ml-auto flex gap-2">
          <div className="text-[9px] font-mono text-white/25">
            Вузлів: <span className="text-emerald-400/70">
              {nodes.filter(n => n.status === 'online').length}/{nodes.length}
            </span>
          </div>
        </div>
      </div>

      {/* Картки вузлів */}
      <div>
        <div className="text-[9px] font-semibold text-white/20 uppercase tracking-[0.2em] mb-2">
          Вузли інфраструктури
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {nodes.map((node) => (
            <NodeCard key={node.id} node={node} />
          ))}
        </div>
      </div>

      {/* Таблиця мікросервісів */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Monitor className="w-3 h-3 text-white/25" />
          <span className="text-[9px] font-semibold text-white/20 uppercase tracking-[0.2em]">
            Мікросервіси
          </span>
          <span className="ml-auto text-[9px] font-mono text-white/20">
            {services.filter(s => s.status === 'ok').length} / {services.length} OK
          </span>
        </div>
        <VirtualTable
          rows={services}
          columns={svcColumns}
          rowHeight={28}
          maxHeight={320}
          getRowStatus={getServiceStatus}
        />
      </div>
    </div>
  );
};


export default InfraTelemetryTab;
