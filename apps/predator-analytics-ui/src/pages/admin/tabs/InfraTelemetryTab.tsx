import React, { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, Wifi, Thermometer, Server, Monitor, Layers, Shield, Zap, Globe, Cpu as CpuIcon, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { VirtualTable, VirtualColumn, RowStatus } from '@/components/shared/VirtualTable';
import { useInfraTelemetry, useSystemStatus } from '@/hooks/useAdminApi';
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
    online:   { label: 'АКТИВНИЙ', cls: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' },
    offline:  { label: 'ОФЛАЙН', cls: 'text-white/20 border-white/10 bg-white/5' },
    degraded: { label: 'КРИТИЧНО', cls: 'text-rose-500 border-rose-500/20 bg-rose-500/5 animate-pulse' },
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

const NodeCard: React.FC<{ node: NodeMetric }> = ({ node }) => {
  const localizedRole = node.role
    .replace('Compute Node', 'ОБЧИСЛЮВАЛЬНИЙ_ВУЗОЛ')
    .replace('Database', 'СХОВИЩЕ_ДАНИХ')
    .replace('Edge API', 'КРАЙОВИЙ_ШЛЮЗ_API')
    .replace('Worker', 'ВОРКЕР_ОБРОБКИ')
    .replace('AI Engine', 'ЯДРО_ШІ')
    .replace('GPU Master', 'МАЙСТЕР_ВУЗОЛ_GPU')
    .replace('Edge Node', 'КРАЙОВИЙ_ВУЗОЛ')
    .replace('Cloud Mirror', 'ХМАРНЕ_ДЗЕРКАЛО');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={cn(
        'p-5 rounded-xl border relative overflow-hidden group transition-all duration-500 glass-wraith backdrop-blur-xl',
        node.status === 'online'   ? 'border-white/10 hover:border-rose-500/50 shadow-2xl hover:shadow-rose-500/10' :
        node.status === 'degraded' ? 'border-rose-500/30 shadow-[0_0_30px_rgba(225,29,72,0.15)] bg-rose-500/5' :
                                     'border-white/5 opacity-40 grayscale bg-black/20',
      )}
    >
      {/* Background Pattern & HUD Grids */}
      <div className="absolute inset-0 cyber-scan-grid opacity-[0.03] pointer-events-none" />
      <div className="absolute top-0 right-0 p-3 opacity-[0.05] pointer-events-none group-hover:opacity-[0.15] transition-opacity duration-700">
        <CpuIcon size={64} className="text-rose-500" />
      </div>

      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-white/5 group-hover:border-rose-500/30 transition-colors" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-white/5 group-hover:border-rose-500/30 transition-colors" />

      <div className="flex items-start justify-between mb-6 relative z-10">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 rounded-lg group-hover:bg-rose-500/20 transition-colors shadow-inner">
              <Server size={14} className="text-rose-500" />
            </div>
            <span className="text-[14px] font-black tracking-[0.1em] text-white/90 group-hover:text-white transition-colors italic uppercase">{node.node}</span>
          </div>
          <div className="flex items-center gap-3 pl-1">
            <span className="text-[8px] font-mono text-white/20 uppercase tracking-[0.3em] font-black italic">{localizedRole}</span>
            <div className="w-1 h-1 rounded-full bg-rose-500/30" />
            <span className="text-[9px] font-mono text-white/40 group-hover:text-rose-500/60 transition-colors">{node.ip || '192.168.1.' + (100 + parseInt(node.id.slice(-2)))}</span>
          </div>
        </div>
        <StatusBadge status={node.status} />
      </div>

      {node.status !== 'offline' && (
        <div className="space-y-5 relative z-10">
          <div className="grid grid-cols-2 gap-5">
            <GaugeBar value={node.cpu} label="НЕЙРОННІ_ОБЧИСЛЕННЯ" />
            <GaugeBar value={node.ram} label="БУФЕРНА_ПАМ'ЯТЬ" />
          </div>
          
          {node.vram !== undefined && (
            <div className="pt-2">
               <GaugeBar value={node.vram} label="КВАНТОВА_VRAM (NVIDIA)" warnAt={70} dangerAt={90} unit="%" />
            </div>
          )}

          <div className="pt-5 mt-2 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2 group/stat-icon">
                <Thermometer size={12} className="text-rose-500/40 group-hover/stat-icon:text-rose-500 transition-colors" />
                <span className={cn("text-[10px] font-mono font-black italic tracking-tighter", (node.temp || 0) > 75 ? "text-rose-500 animate-pulse" : "text-white/60")}>
                  {node.temp}°C
                </span>
              </div>
              <div className="flex items-center gap-2 group/stat-icon">
                <Wifi size={12} className="text-sky-500/40 group-hover/stat-icon:text-sky-500 transition-colors" />
                <span className="text-[10px] font-mono text-white/60 font-black italic tracking-tighter">{node.net.replace('rx', 'ВХ').replace('tx', 'ВИХ')}</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[7px] font-mono text-white/20 uppercase tracking-widest font-black">ЧАС_РОБОТИ_СЕСІЇ</span>
              <span className="text-[9px] font-mono text-white/40 italic font-bold">{node.uptime}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Interactive Glow */}
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rose-500/5 blur-[60px] group-hover:bg-rose-500/10 transition-all duration-1000 rounded-full" />
    </motion.div>
  );
};

// ─── Таблиця сервісів ─────────────────────────────────────────────────────────

const svcColumns: VirtualColumn<ServiceStatus>[] = [
  {
    key: 'name', label: 'РЕЄСТР_ЦЕНТРАЛЬНИХ_СЕРВІСІВ', width: '220px', mono: true,
    render: (v) => (
      <div className="flex items-center gap-2">
        <div className="w-1 h-1 rounded-full bg-rose-500/50" />
        <span className="text-white/80 font-bold tracking-tight uppercase italic">{String(v)}</span>
      </div>
    ),
  },
  {
    key: 'status', label: 'СТАН_ЯДРА', width: '120px',
    render: (v) => {
      const color = v === 'ok' ? 'text-emerald-500' : v === 'warn' ? 'text-amber-500' : 'text-rose-500';
      const label = v === 'ok' ? 'ЗДОРОВИЙ' : v === 'warn' ? 'ДЕГРАДАЦІЯ' : 'КРИТИЧНО';
      return (
        <div className={cn('text-[9px] font-black tracking-widest flex items-center gap-2', color)}>
          <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", v === 'ok' ? 'bg-emerald-500' : 'bg-current')} />
          {label}
        </div>
      );
    },
  },
  {
    key: 'latencyMs', label: 'ЛАТЕНТНІСТЬ', width: '100px', mono: true, align: 'right',
    render: (v) => {
      const ms = Number(v);
      const color = ms > 500 ? 'text-rose-500' : ms > 200 ? 'text-amber-500' : 'text-emerald-500/70';
      return <span className={cn("font-bold", color)}>{ms}мс</span>;
    },
  },
  { 
    key: 'version', label: 'ВЕРСІЯ_АРТЕФАКТУ', width: '120px', mono: true,
    render: (v) => <span className="text-white/30 text-[9px]">v{String(v)}</span>
  },
  { 
    key: 'lastCheck', label: 'ОСТАННІЙ_ІМПУЛЬС', mono: true,
    render: (v) => <span className="text-white/10 text-[8px] italic uppercase">{String(v)}</span>
  },
];

const getServiceStatus = (row: ServiceStatus): RowStatus =>
  row.status === 'ok' ? 'ok' : row.status === 'warn' ? 'warning' : 'danger';

// ─── Вкладка Телеметрія Кластера ─────────────────────────────────────────────

// ─── Вкладка Телеметрія Кластера ─────────────────────────────────────────────

import { useBackendStatus } from '@/hooks/useBackendStatus';

export const InfraTelemetryTab: React.FC = () => {
  const { data, isLoading, isError } = useInfraTelemetry();
  const { data: systemStatus } = useSystemStatus();
  const { llmTriStateMode, nodeSource } = useBackendStatus();

  const nodes = data?.nodes || [];
  const services = data?.services || [];

  const totalThroughput = nodes.reduce((acc, n) => {
    const parts = n.net.split('/');
    const rx = parseFloat(parts[0]) || 0;
    const tx = parseFloat(parts[1]) || 0;
    return acc + rx + tx;
  }, 0);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-white/40 space-y-6">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-rose-500/20" strokeWidth={1} />
          <Activity className="absolute inset-0 m-auto w-5 h-5 text-rose-500 animate-pulse" />
        </div>
        <div className="text-[10px] font-mono uppercase tracking-[0.4em] animate-pulse italic">ЗЧИТУВАННЯ_ТЕЛЕМЕТРІЇ_СИСТЕМИ...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-6 border border-rose-500/20">
          <Shield size={32} className="text-rose-500/40" />
        </div>
        <div className="text-[16px] font-black uppercase tracking-widest text-white/90 mb-2">КРИТИЧНИЙ_ЗРИВ_ТЕЛЕМЕТРІЇ</div>
        <p className="text-[11px] font-mono text-white/30 max-w-sm mb-8 leading-relaxed italic">
          СИСТЕМА_ВТРАТИЛА_ЗВ'ЯЗОК_З_ВУЗЛАМИ_УПРАВЛІННЯ. ПЕРЕВІРТЕ_СТАТУС_API_ШЛЮЗУ_ТА_АВТЕНТИФІКАЦІЮ_MTLS.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 border border-rose-500/30 text-rose-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-500/10 transition-all duration-500 rounded-sm italic"
        >
          ПЕРЕПІДКЛЮЧИТИСЬ_ДО_ЯДРА
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-10 max-w-[1600px] mx-auto">
      {/* Tri-State Routing Header */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
        <div className="flex flex-col gap-1 border-l-2 border-rose-500 pl-6 py-1">
          <div className="flex items-center gap-3">
            <h2 className="text-[18px] font-black text-white uppercase tracking-[0.2em]">
              Моніторинг Глобальної Інфраструктури
            </h2>
            <div className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 rounded-sm text-[8px] font-bold text-rose-500 tracking-tighter uppercase italic">
              ІНДУСТРІАЛЬНИЙ_СТАН_V6
            </div>
          </div>
          <div className="flex items-center gap-4 text-[9px] font-mono text-white/30 tracking-widest uppercase">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span>АКТИВНА_СИНХРОНІЗАЦІЯ_ПОТОКУ</span>
            </div>
            <span>•</span>
            <span>ІНТЕРВАЛ: 3000мс</span>
            <span>•</span>
            <span>ВУЗОЛ_МАЙСТЕР: {nodes.find(n => n.role.includes('Master'))?.node || '0xPRED_60_ELITE'}</span>
          </div>
        </div>

        {/* Routing Indicator Badge */}
        <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md p-3 rounded-lg border border-white/5 shadow-inner">
           <div className="flex flex-col items-end">
              <span className="text-[7px] font-mono text-white/20 uppercase tracking-[0.4em] font-black">СТРАТЕГІЯ_МАРШРУТИЗАЦІЇ</span>
              <span className="text-[10px] font-black text-white/60 italic uppercase tracking-wider">{nodeSource}</span>
           </div>
           <div className="h-8 w-px bg-white/10 mx-2" />
           <div className={cn(
             "px-4 py-2 rounded border flex items-center gap-3 transition-all duration-700",
             llmTriStateMode === 'SOVEREIGN' ? "bg-rose-500/10 border-rose-500/30 text-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.2)]" :
             llmTriStateMode === 'HYBRID' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]" :
             "bg-sky-500/10 border-sky-500/30 text-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.2)]"
           )}>
             <Globe size={16} className={cn("animate-spin-slow", llmTriStateMode === 'SOVEREIGN' ? "text-rose-500" : llmTriStateMode === 'HYBRID' ? "text-emerald-500" : "text-sky-500")} />
             <div className="flex flex-col">
                <span className="text-[12px] font-black tracking-[0.2em] italic">{llmTriStateMode}</span>
                <span className="text-[7px] font-mono uppercase tracking-widest opacity-60">
                   {llmTriStateMode === 'SOVEREIGN' ? 'АВТОНОМНИЙ_СУВЕРЕНІТЕТ' : 
                    llmTriStateMode === 'HYBRID' ? 'ГІБРИДНА_ЕФЕКТИВНІСТЬ' : 
                    'ХМАРНЕ_ПРИСКОРЕННЯ'}
                </span>
             </div>
           </div>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'АКТИВНІ_АКТИВИ', value: `${nodes.filter(n => n.status === 'online').length}/${nodes.length}`, icon: Server, color: 'rose' },
          { label: 'ЯДРО_ЕКОСИСТЕМИ', value: services.length, icon: Box, color: 'sky' },
          { label: 'ЧАС_БЕЗПЕРЕРВНОЇ_РОБОТИ', value: systemStatus?.uptime || 'Н/Д', icon: Shield, color: 'emerald' },
          { label: 'ПРОПУСКНА_ЗДАТНІСТЬ', value: `${totalThroughput.toFixed(1)} МБ/с`, icon: Zap, color: 'amber' },
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass-wraith border border-white/5 p-6 rounded-xl flex items-center justify-between group hover:border-rose-500/30 transition-all duration-500 relative overflow-hidden"
          >
            {/* Background HUD Grid */}
            <div className="absolute inset-0 cyber-scan-grid opacity-[0.02] pointer-events-none" />
            
            <div className="flex flex-col relative z-10">
              <span className="text-[8px] font-mono text-white/30 uppercase tracking-[0.3em] font-black mb-2 italic">{stat.label}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-[24px] font-black text-white italic drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">{stat.value}</span>
                {stat.color === 'emerald' && <span className="text-[8px] text-emerald-500 font-bold animate-pulse">ГАРАНТОВАНО</span>}
              </div>
            </div>
            
            <div className="p-3 bg-white/5 rounded-lg group-hover:bg-rose-500/10 transition-all duration-500 relative z-10">
               <stat.icon size={24} className={cn("transition-all duration-500 group-hover:scale-110", `text-${stat.color}-500/40 group-hover:text-${stat.color}-500`)} />
            </div>

            {/* Bottom Glow */}
            <div className={cn(
              "absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500",
              `bg-${stat.color}-500/50 shadow-[0_0_15px_rgba(225,29,72,0.5)]`
            )} />
          </motion.div>
        ))}
      </div>

      {/* Nodes Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          <span className="text-[10px] font-mono font-black text-white/20 uppercase tracking-[0.4em] italic">ФЛОТ_ОБЧИСЛЮВАЛЬНИХ_ВУЗЛІВ_PREDATOR</span>
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
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-[12px] font-mono font-black text-white/40 uppercase tracking-[0.5em] italic glint-elite">ЯДРО_ЕКОСИСТЕМИ & ЕНДПОЇНТИ</span>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(225,29,72,1)]" />
               <span className="text-[7px] font-mono text-rose-500/60 uppercase tracking-widest font-black">ВЕРИФІКОВАНО_ЦІЛІСНІСТЬ_АРХІТЕКТУРИ</span>
            </div>
          </div>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-white/10 to-transparent" />
        </div>
        <div className="glass-wraith border border-white/5 rounded-xl overflow-hidden backdrop-blur-3xl shadow-2xl relative">
          <div className="absolute inset-0 cyber-scan-grid opacity-[0.02] pointer-events-none" />
          <VirtualTable
            rows={services}
            columns={svcColumns}
            rowHeight={48}
            maxHeight={450}
            getRowStatus={getServiceStatus}
          />
        </div>
      </div>
    </div>
  );
};

export default InfraTelemetryTab;
