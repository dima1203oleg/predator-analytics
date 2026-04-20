import React, { useState, useMemo } from 'react';
import { Activity, Cpu, HardDrive, Wifi, Thermometer, Server, Monitor, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VirtualTable, VirtualColumn, RowStatus } from '@/components/shared/VirtualTable';

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

// ─── Мок-дані ─────────────────────────────────────────────────────────────────

const MOCK_NODES: NodeMetric[] = [
  { id: '1', node: 'nvidia-master', role: 'GPU Master',   cpu: 34, ram: 61, vram: 52, vramGb: 4.2, temp: 67, net: '↑ 1.2 MB/s ↓ 4.8 MB/s', status: 'online',   uptime: '12д 4г 21хв' },
  { id: '2', node: 'macbook-edge',  role: 'Edge Node',    cpu: 18, ram: 44, temp: 52,               net: '↑ 0.3 MB/s ↓ 0.9 MB/s', status: 'online',   uptime: '3г 14хв' },
  { id: '3', node: 'colab-mirror',  role: 'Cloud Mirror', cpu: 0,  ram: 0,                          net: '—',                       status: 'offline',  uptime: 'недоступний' },
];

const MOCK_SERVICES: ServiceStatus[] = [
  { name: 'core-api',         status: 'ok',   latencyMs: 12,  version: 'v1.4.2', lastCheck: '00:00:01 тому' },
  { name: 'graph-service',    status: 'ok',   latencyMs: 28,  version: 'v1.2.0', lastCheck: '00:00:01 тому' },
  { name: 'ingestion-worker', status: 'warn', latencyMs: 341, version: 'v1.1.5', lastCheck: '00:00:02 тому' },
  { name: 'opensearch',       status: 'ok',   latencyMs: 8,   version: '2.12.0', lastCheck: '00:00:01 тому' },
  { name: 'redis',            status: 'ok',   latencyMs: 1,   version: '7.2.4',  lastCheck: '00:00:01 тому' },
  { name: 'kafka-broker',     status: 'ok',   latencyMs: 5,   version: 'CP7.6',  lastCheck: '00:00:01 тому' },
  { name: 'qdrant',           status: 'ok',   latencyMs: 19,  version: '1.8.4',  lastCheck: '00:00:01 тому' },
  { name: 'neo4j',            status: 'ok',   latencyMs: 22,  version: '5.17.0', lastCheck: '00:00:01 тому' },
  { name: 'minio',            status: 'ok',   latencyMs: 7,   version: 'RELEASE.2024', lastCheck: '00:00:01 тому' },
  { name: 'ollama',           status: 'warn', latencyMs: 890, version: '0.1.42', lastCheck: '00:00:03 тому' },
  { name: 'litellm-proxy',    status: 'ok',   latencyMs: 45,  version: '1.30.0', lastCheck: '00:00:01 тому' },
  { name: 'prometheus',       status: 'ok',   latencyMs: 3,   version: '2.51.0', lastCheck: '00:00:01 тому' },
];

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

export const InfraTelemetryTab: React.FC = () => {
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
              {MOCK_NODES.filter(n => n.status === 'online').length}/{MOCK_NODES.length}
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
          {MOCK_NODES.map((node) => (
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
            {MOCK_SERVICES.filter(s => s.status === 'ok').length} / {MOCK_SERVICES.length} OK
          </span>
        </div>
        <VirtualTable
          rows={MOCK_SERVICES}
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
