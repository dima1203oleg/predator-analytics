import React, { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, Wifi, Thermometer, Server, Monitor, Layers, Shield, Zap, Globe, Cpu as CpuIcon, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ip?: string;
  kernel?: string;
}

interface ServiceStatus {
  name: string;
  status: 'ok' | 'warn' | 'down';
  latencyMs: number;
  version: string;
  lastCheck: string;
}

// ─── Допоміжні UI-компоненти ──────────────────────────────────────────────────

interface GaugeBarProps {
  value: number;
  max?: number;
  warnAt?: number;
  dangerAt?: number;
  unit?: string;
  label?: string;
}

const GaugeBar: React.FC<GaugeBarProps> = ({
  value, max = 100, warnAt = 75, dangerAt = 90, unit = '%', label
}) => {
  const pct = Math.min((value / max) * 100, 100);
  const isDanger = pct >= dangerAt;
  const isWarning = pct >= warnAt && !isDanger;

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between items-center text-[8px] font-mono tracking-tighter">
        <span className="text-white/30 uppercase">{label}</span>
        <span className={cn(
          "font-bold",
          isDanger ? "text-rose-500" : isWarning ? "text-amber-400" : "text-white/60"
        )}>{value}{unit}</span>
      </div>
      <div className="h-[3px] bg-white/[0.03] rounded-full overflow-hidden relative border border-white/[0.05]">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn(
            'h-full rounded-full relative z-10',
            isDanger ? 'bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.6)]' : 
            isWarning ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 
            'bg-rose-500/60 shadow-[0_0_8px_rgba(225,29,72,0.3)]'
          )}
        />
        {/* Static segments */}
        <div className="absolute inset-0 flex justify-between px-1 opacity-20 pointer-events-none">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="w-[1px] h-full bg-white" />)}
        </div>
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: NodeMetric['status'] }> = ({ status }) => {
  const map = {
    online:   { label: 'ACTIVE', cls: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' },
    offline:  { label: 'OFFLINE', cls: 'text-white/20 border-white/10 bg-white/5' },
    degraded: { label: 'CRITICAL', cls: 'text-rose-500 border-rose-500/20 bg-rose-500/5 animate-pulse' },
  };
  const { label, cls } = map[status];
  return (
    <div className={cn('text-[7px] font-black px-1.5 py-0.5 rounded-sm border tracking-[0.2em] flex items-center gap-1.5', cls)}>
      <div className={cn("w-1 h-1 rounded-full", status === 'online' ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]' : 'bg-current')} />
      {label}
    </div>
  );
};

// ─── Картка вузла ─────────────────────────────────────────────────────────────

const NodeCard: React.FC<{ node: NodeMetric }> = ({ node }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ y: -2 }}
    className={cn(
      'p-4 rounded-sm border relative overflow-hidden group transition-all duration-300 bg-black/40 backdrop-blur-sm',
      node.status === 'online'   ? 'border-white/[0.06] hover:border-rose-500/30' :
      node.status === 'degraded' ? 'border-rose-500/20 shadow-[0_0_20px_rgba(225,29,72,0.05)]' :
                                   'border-white/5 opacity-50 grayscale',
    )}
  >
    {/* Background Pattern */}
    <div className="absolute top-0 right-0 p-1 opacity-[0.03] pointer-events-none">
      <CpuIcon size={48} />
    </div>

    <div className="flex items-start justify-between mb-4 relative z-10">
      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-1">
          <Server size={12} className="text-rose-500/50" />
          <span className="text-[12px] font-black tracking-wider text-white/90">{node.node}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">{node.role}</span>
          <div className="w-1 h-1 rounded-full bg-white/10" />
          <span className="text-[8px] font-mono text-white/30">{node.ip || '192.168.1.10' + node.id.slice(-1)}</span>
        </div>
      </div>
      <StatusBadge status={node.status} />
    </div>

    {node.status !== 'offline' && (
      <div className="space-y-3 relative z-10">
        <div className="grid grid-cols-2 gap-4">
          <GaugeBar value={node.cpu} label="CPU Load" />
          <GaugeBar value={node.ram} label="RAM Usage" />
        </div>
        
        {node.vram !== undefined && (
          <GaugeBar value={node.vram} label="VRAM Allocation (NVIDIA)" warnAt={70} dangerAt={90} unit="%" />
        )}

        <div className="pt-3 border-t border-white/[0.03] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Thermometer size={10} className="text-rose-500/40" />
              <span className={cn("text-[9px] font-mono font-bold", (node.temp || 0) > 75 ? "text-rose-500" : "text-white/50")}>
                {node.temp}°C
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wifi size={10} className="text-rose-500/40" />
              <span className="text-[9px] font-mono text-white/50">{node.net}</span>
            </div>
          </div>
          <div className="text-[8px] font-mono text-white/20 uppercase">
            UP: {node.uptime}
          </div>
        </div>
      </div>
    )}
    
    {/* Corner Ornament */}
    <div className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-br from-transparent to-rose-500/[0.02] pointer-events-none" />
  </motion.div>
);

// ─── Таблиця сервісів ─────────────────────────────────────────────────────────

const svcColumns: VirtualColumn<ServiceStatus>[] = [
  {
    key: 'name', label: 'Service Endpoint', width: '220px', mono: true,
    render: (v) => (
      <div className="flex items-center gap-2">
        <div className="w-1 h-1 rounded-full bg-rose-500/50" />
        <span className="text-white/80 font-bold tracking-tight">{String(v)}</span>
      </div>
    ),
  },
  {
    key: 'status', label: 'Status', width: '120px',
    render: (v) => {
      const color = v === 'ok' ? 'text-emerald-500' : v === 'warn' ? 'text-amber-500' : 'text-rose-500';
      const label = v === 'ok' ? 'HEALTHY' : v === 'warn' ? 'DEGRADED' : 'CRITICAL';
      return (
        <div className={cn('text-[9px] font-black tracking-widest flex items-center gap-2', color)}>
          <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", v === 'ok' ? 'bg-emerald-500' : 'bg-current')} />
          {label}
        </div>
      );
    },
  },
  {
    key: 'latencyMs', label: 'Latency', width: '100px', mono: true, align: 'right',
    render: (v) => {
      const ms = Number(v);
      const color = ms > 500 ? 'text-rose-500' : ms > 200 ? 'text-amber-500' : 'text-emerald-500/70';
      return <span className={cn("font-bold", color)}>{ms}ms</span>;
    },
  },
  { 
    key: 'version', label: 'Build', width: '120px', mono: true,
    render: (v) => <span className="text-white/30 text-[9px]">v{String(v)}</span>
  },
  { 
    key: 'lastCheck', label: 'Last Pulse', mono: true,
    render: (v) => <span className="text-white/10 text-[8px] italic">{String(v)}</span>
  },
];

const getServiceStatus = (row: ServiceStatus): RowStatus =>
  row.status === 'ok' ? 'ok' : row.status === 'warn' ? 'warning' : 'danger';

// ─── Вкладка Телеметрія Кластера ─────────────────────────────────────────────

export const InfraTelemetryTab: React.FC = () => {
  const { data, isLoading, isError } = useInfraTelemetry();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-white/40 space-y-6">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-rose-500/20" strokeWidth={1} />
          <Activity className="absolute inset-0 m-auto w-5 h-5 text-rose-500 animate-pulse" />
        </div>
        <div className="text-[10px] font-mono uppercase tracking-[0.4em] animate-pulse">Зчитування телеметрії...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-6 border border-rose-500/20">
          <Shield size={32} className="text-rose-500/40" />
        </div>
        <div className="text-[16px] font-black uppercase tracking-widest text-white/90 mb-2">Зв'язок розірвано</div>
        <p className="text-[11px] font-mono text-white/30 max-w-sm mb-8 leading-relaxed">
          Система не може отримати дані з вузлів управління. Перевірте статус API-шлюзу та автентифікацію.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 border border-rose-500/30 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/10 transition-colors rounded-sm"
        >
          ПЕРЕПІДКЛЮЧИТИСЬ
        </button>
      </div>
    );
  }

  const nodes = data.nodes || [];
  const services = data.services || [];

  return (
    <div className="p-8 space-y-10 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-1 border-l-2 border-rose-500 pl-6 py-1">
        <div className="flex items-center gap-3">
          <h2 className="text-[18px] font-black text-white uppercase tracking-[0.2em]">
            Телеметрія Кластера
          </h2>
          <div className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 rounded-sm text-[8px] font-bold text-rose-500 tracking-tighter">
            PROD_LEVEL_4
          </div>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-mono text-white/30 tracking-widest">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>LIVE SYNC ACTIVE</span>
          </div>
          <span>•</span>
          <span>REFRESH: 3000ms</span>
          <span>•</span>
          <span>NODE_ID: 0xPRED_60</span>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Nodes', value: `${nodes.filter(n => n.status === 'online').length}/${nodes.length}`, icon: Server },
          { label: 'Total Services', value: services.length, icon: Box },
          { label: 'System Uptime', value: '99.98%', icon: Shield },
          { label: 'Network Load', value: '1.2 GB/s', icon: Zap },
        ].map((stat, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-sm flex items-center justify-between group hover:border-white/10 transition-colors">
            <div className="flex flex-col">
              <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest mb-1">{stat.label}</span>
              <span className="text-[18px] font-black text-white/90">{stat.value}</span>
            </div>
            <stat.icon size={20} className="text-rose-500/20 group-hover:text-rose-500/40 transition-colors" />
          </div>
        ))}
      </div>

      {/* Nodes Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          <span className="text-[10px] font-mono font-black text-white/20 uppercase tracking-[0.4em]">Вузли Інфраструктури</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/5 to-transparent" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {nodes.map((node) => (
              <NodeCard key={node.id} node={node} />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Microservices Table */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          <span className="text-[10px] font-mono font-black text-white/20 uppercase tracking-[0.4em]">Мікросервіси & Ендпоїнти</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/5 to-transparent" />
        </div>
        <div className="bg-black/20 border border-white/[0.05] rounded-sm overflow-hidden backdrop-blur-md">
          <VirtualTable
            rows={services}
            columns={svcColumns}
            rowHeight={40}
            maxHeight={400}
            getRowStatus={getServiceStatus}
          />
        </div>
      </div>
    </div>
  );
};

export default InfraTelemetryTab;
