import React, { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, Wifi, Thermometer, Server, Monitor, Layers, Shield, Zap, Globe, Cpu as CpuIcon, Box, Radio, RefreshCw, Zap as ZapIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { VirtualTable, VirtualColumn, RowStatus } from '@/components/shared/VirtualTable';
import { useInfraTelemetry, useSystemStatus } from '@/hooks/useAdminApi';
import { Loader2 } from 'lucide-react';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { useBackendStatus } from '@/hooks/useBackendStatus';

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
      <div className="flex justify-between items-center text-[9px] font-black tracking-widest italic uppercase">
        <span className="text-white/20">{label}</span>
        <span className={cn(
          "font-black italic drop-shadow-[0_0_8px_currentColor]",
          isDanger ? "text-rose-500" : isWarning ? "text-amber-400" : "text-emerald-500/80"
        )}>{value}{unit}</span>
      </div>
      <div className="h-[4px] bg-white/[0.03] rounded-full overflow-hidden relative border border-white/[0.05] shadow-inner">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.5, ease: "circOut" }}
          className={cn(
            'h-full rounded-full relative z-10',
            isDanger ? 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_15px_rgba(225,29,72,0.8)]' : 
            isWarning ? 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.6)]' : 
            'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
          )}
        />
        <div className="absolute inset-0 flex justify-between px-2 opacity-30 pointer-events-none">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => <div key={i} className="w-[1px] h-full bg-white/20" />)}
        </div>
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: NodeMetric['status'] }> = ({ status }) => {
  const map = {
    online:   { label: 'АКТИВНИЙ', cls: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' },
    offline:  { label: 'ОФЛАЙН', cls: 'text-white/20 border-white/10 bg-white/5' },
    degraded: { label: 'К� ИТИЧНО', cls: 'text-rose-500 border-rose-500/20 bg-rose-500/5 animate-pulse' },
  };
  const { label, cls } = map[status];
  return (
    <div className={cn('text-[8px] font-black px-3 py-1 rounded-lg border-2 tracking-[0.2em] flex items-center gap-2 italic shadow-2xl', cls)}>
      <div className={cn("w-1.5 h-1.5 rounded-full", status === 'online' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]' : 'bg-current')} />
      {label}
    </div>
  );
};

// ─── Картка вузла ─────────────────────────────────────────────────────────────

const NodeCard: React.FC<{ node: NodeMetric }> = ({ node }) => {
  const localizedRole = node.role
    .replace('Compute Node', 'ОБЧИСЛЮВАЛЬНИЙ_ВУЗОЛ')
    .replace('Database', 'СХОВИЩЕ_ДАНИХ')
    .replace('Edge API', 'К� АЙОВИЙ_ШЛЮЗ_API')
    .replace('Worker', 'ВО� КЕ� _ОБ� ОБКИ')
    .replace('AI Engine', 'ЯД� О_ШІ')
    .replace('GPU Master', 'МАЙСТЕ� _ВУЗОЛ_GPU')
    .replace('Edge Node', 'К� АЙОВИЙ_ВУЗОЛ')
    .replace('Cloud Mirror', 'ХМА� НЕ_ДЗЕ� КАЛО');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className={cn(
        'p-8 rounded-[2.5rem] border-2 relative overflow-hidden group transition-all duration-700 glass-wraith backdrop-blur-3xl shadow-4xl',
        node.status === 'online'   ? 'border-white/5 hover:border-rose-500/40' :
        node.status === 'degraded' ? 'border-rose-500/30 bg-rose-500/5' :
                                     'border-white/5 opacity-40 grayscale bg-black/40',
      )}
    >
      <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:opacity-[0.1] transition-opacity duration-1000">
        <CpuIcon size={80} className="text-rose-500" />
      </div>

      <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-white/5 group-hover:border-rose-500/30 transition-colors rounded-tl-[2.5rem]" />
      <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-white/5 group-hover:border-rose-500/30 transition-colors rounded-br-[2.5rem]" />

      <div className="flex items-start justify-between mb-8 relative z-10">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-500/10 rounded-2xl group-hover:bg-rose-500/20 transition-all duration-500 border border-rose-500/20">
              <Server size={20} className="text-rose-500" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white uppercase italic glint-elite">{node.node}</span>
          </div>
          <div className="flex items-center gap-4 pl-1">
            <span className="text-[9px] font-black font-mono text-white/20 uppercase tracking-[0.4em] italic">{localizedRole}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500/30 shadow-[0_0_5px_rgba(225,29,72,0.5)]" />
            <span className="text-[10px] font-black font-mono text-white/40 group-hover:text-rose-500/60 transition-colors uppercase tracking-widest">{node.ip || '192.168.0.x'}</span>
          </div>
        </div>
        <StatusBadge status={node.status} />
      </div>

      {node.status !== 'offline' && (
        <div className="space-y-8 relative z-10">
          <div className="grid grid-cols-2 gap-8">
            <GaugeBar value={node.cpu} label="ОБЧИСЛЕННЯ_CPU" />
            <GaugeBar value={node.ram} label="ПАМ'ЯТЬ_RAM" />
          </div>
          
          {node.vram !== undefined && (
            <div className="pt-2">
               <GaugeBar value={node.vram} label="КВАНТОВА_VRAM_NVIDIA" warnAt={70} dangerAt={90} unit="%" />
            </div>
          )}

          <div className="pt-8 mt-4 border-t-2 border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex flex-col gap-1 group/stat-icon">
                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest italic">ТЕМП.</span>
                <div className="flex items-center gap-2">
                   <Thermometer size={14} className="text-rose-500/40 group-hover/stat-icon:text-rose-500 transition-colors" />
                   <span className={cn("text-[11px] font-black font-mono italic tracking-tighter", (node.temp || 0) > 75 ? "text-rose-500 animate-pulse" : "text-emerald-500/80")}>
                     {node.temp}°C
                   </span>
                </div>
              </div>
              <div className="flex flex-col gap-1 group/stat-icon">
                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest italic">МЕ� ЕЖА</span>
                <div className="flex items-center gap-2">
                   <Wifi size={14} className="text-sky-500/40 group-hover/stat-icon:text-sky-500 transition-colors" />
                   <span className="text-[11px] font-black font-mono text-white/60 italic tracking-tighter uppercase">{node.net.replace('rx', 'В').replace('tx', 'О')}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[8px] font-black font-mono text-white/20 uppercase tracking-[0.3em] italic">UPTIME</span>
              <span className="text-[10px] font-black font-mono text-rose-500/40 italic uppercase tracking-widest">{node.uptime}</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-rose-500/5 blur-[80px] group-hover:bg-rose-500/15 transition-all duration-1000 rounded-full" />
    </motion.div>
  );
};

// ─── Таблиця сервісів ─────────────────────────────────────────────────────────

const svcColumns: VirtualColumn<ServiceStatus>[] = [
  {
    key: 'name', label: '� ЕЄСТ� _ЦЕНТ� АЛЬНИХ_СЕ� ВІСІВ', width: '250px', mono: true,
    render: (v) => (
      <div className="flex items-center gap-4">
        <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(225,29,72,0.8)]" />
        <span className="text-white font-black tracking-tight uppercase italic glint-elite">{String(v)}</span>
      </div>
    ),
  },
  {
    key: 'status', label: 'СТАН_ЯД� А', width: '140px',
    render: (v) => {
      const color = v === 'ok' ? 'text-emerald-500' : v === 'warn' ? 'text-amber-500' : 'text-rose-500';
      const label = v === 'ok' ? 'ОПТИМАЛЬНО' : v === 'warn' ? 'УВАГА' : 'ЗБІЙ';
      return (
        <div className={cn('text-[10px] font-black tracking-[0.3em] flex items-center gap-3 italic uppercase', color)}>
          <div className={cn("w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_currentColor]", v === 'ok' ? 'bg-emerald-500' : 'bg-current')} />
          {label}
        </div>
      );
    },
  },
  {
    key: 'latencyMs', label: 'ЛАТЕНТНІСТЬ', width: '120px', mono: true, align: 'right',
    render: (v) => {
      const ms = Number(v);
      const color = ms > 500 ? 'text-rose-500' : ms > 200 ? 'text-amber-500' : 'text-emerald-500/80';
      return <span className={cn("font-black italic text-[11px]", color)}>{ms}мс</span>;
    },
  },
  { 
    key: 'version', label: 'ВЕ� СІЯ_А� ТЕФАКТУ', width: '140px', mono: true,
    render: (v) => <span className="text-white/30 text-[10px] font-black italic">v{String(v)}</span>
  },
  { 
    key: 'lastCheck', label: 'ОСТАННІЙ_ІМПУЛЬС', mono: true,
    render: (v) => <span className="text-white/10 text-[9px] font-black italic uppercase tracking-widest">{String(v)}</span>
  },
];

const getServiceStatus = (row: ServiceStatus): RowStatus =>
  row.status === 'ok' ? 'ok' : row.status === 'warn' ? 'warning' : 'danger';

// ─── Топологія мережі ────────────────────────────────────────────────────────

const LiveNetworkTopology: React.FC<{ nodes: NodeMetric[] }> = ({ nodes }) => {
  return (
    <div className="relative w-full h-[350px] bg-black/60 backdrop-blur-3xl rounded-[3rem] border-2 border-white/5 overflow-hidden flex items-center justify-center shadow-4xl mb-12">
      <div className="absolute inset-0 bg-cyber-grid opacity-[0.05]" />
      
      {/* Central Core */}
      <div className="absolute z-20 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 bg-rose-500/30 blur-[60px] rounded-full scale-150 animate-pulse" />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-2 border-dashed border-rose-500/20 rounded-full scale-150"
          />
          <div className="w-24 h-24 bg-gradient-to-br from-rose-700 via-rose-500 to-rose-800 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(225,29,72,1)] border-2 border-rose-300/30 relative">
            <Shield size={40} className="text-white drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
          </div>
        </div>
        <span className="mt-6 text-[12px] font-black text-rose-500 uppercase tracking-[0.5em] italic glint-elite">PREDATOR_CORE_HUB</span>
      </div>

      {/* Orbiting Nodes */}
      {nodes.slice(0, 10).map((node, i) => {
        const totalNodes = Math.min(nodes.length, 10);
        const angle = (i / totalNodes) * Math.PI * 2;
        const radiusX = 350; // px
        const radiusY = 120;
        const x = Math.cos(angle) * radiusX;
        const y = Math.sin(angle) * radiusY;
        const isOnline = node.status === 'online';
        
        return (
          <React.Fragment key={node.id}>
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              <motion.line 
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, delay: i * 0.1 }}
                x1="50%" y1="50%" 
                x2={`calc(50% + ${x}px)`} y2={`calc(50% + ${y}px)`} 
                stroke={isOnline ? 'rgba(225,29,72,0.6)' : 'rgba(255,255,255,0.05)'} 
                strokeWidth="2"
                strokeDasharray={isOnline ? "6 6" : "none"}
                className={isOnline ? "animate-pulse" : ""}
              />
            </svg>
            
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
              className="absolute z-10 flex flex-col items-center group cursor-crosshair"
              style={{ 
                left: `calc(50% + ${x}px)`, 
                top: `calc(50% + ${y}px)`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center border-2 shadow-4xl relative transition-all duration-500 group-hover:scale-125 group-hover:rotate-6",
                isOnline ? "bg-black/90 border-rose-500/40 shadow-rose-500/20" : "bg-black/40 border-white/5 opacity-40"
              )}>
                {isOnline && <div className="absolute inset-0 bg-rose-500/20 rounded-2xl blur-xl animate-pulse" />}
                <Server size={24} className={isOnline ? "text-rose-500" : "text-white/10"} />
              </div>
              <div className="mt-4 absolute top-full flex flex-col items-center opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none w-max bg-black/90 border-2 border-white/5 p-4 rounded-2xl z-30 shadow-4xl transform translate-y-2 group-hover:translate-y-0">
                <span className="text-[11px] font-black text-white uppercase tracking-[0.2em] italic">{node.node}</span>
                <span className={cn("text-[9px] font-black font-mono uppercase tracking-widest mt-1", isOnline ? "text-emerald-500" : "text-white/40")}>{node.ip || 'INTERNAL_MTLS'}</span>
              </div>
            </motion.div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── MAIN VIEW ───────────────────────────────────────────────────────────────

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
      <div className="flex flex-col items-center justify-center h-[700px] text-white/40 space-y-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-cyber-grid opacity-[0.05] pointer-events-none" />
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 border-2 border-rose-500/20 rounded-full border-t-rose-500 shadow-[0_0_30px_rgba(225,29,72,0.3)]"
          />
          <Activity className="absolute inset-0 m-auto w-8 h-8 text-rose-500 animate-pulse" />
        </div>
        <div className="text-[14px] font-black font-mono uppercase tracking-[0.6em] animate-pulse italic text-rose-500/60">ЗЧИТУВАННЯ_ТЕЛЕМЕТ� ІЇ_ЯД� А...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[700px] p-24 text-center glass-wraith m-12 border-2 border-rose-600/20 rounded-[4rem] relative overflow-hidden shadow-4xl">
        <div className="absolute inset-0 bg-rose-900/5 blur-[120px] pointer-events-none" />
        <div className="w-24 h-24 rounded-[2rem] bg-rose-500/10 flex items-center justify-center mb-10 border-2 border-rose-500/30">
          <Shield size={48} className="text-rose-500/60" />
        </div>
        <div className="text-3xl font-black uppercase tracking-tighter text-white mb-4 glint-elite">К� ИТИЧНИЙ_З� ИВ_ТЕЛЕМЕТ� ІЇ</div>
        <p className="text-[12px] font-black font-mono text-white/30 max-w-lg mb-12 leading-relaxed uppercase italic tracking-widest">
          СИСТЕМА_ВТ� АТИЛА_ЗВ'ЯЗОК_З_ВУЗЛАМИ_УП� АВЛІННЯ. ПЕ� ЕВІ� ТЕ_СТАТУС_API_ШЛЮЗУ_ТА_ВЕ� ИФІКАЦІЮ_MTLS_V61.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-12 py-5 bg-rose-600 text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-xl hover:bg-rose-500 transition-all shadow-4xl italic"
        >
          ПЕ� ЕПІДКЛЮЧИТИСЬ_ДО_ЯД� А
        </button>
      </div>
    );
  }

  return (
    <div className="p-12 space-y-16 max-w-[1700px] mx-auto relative">
      <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
      
      {/* Tri-State Routing Header */}
      <div className="flex flex-col lg:flex-row gap-10 justify-between items-start lg:items-center relative z-10">
        <div className="flex flex-col gap-3 border-l-4 border-rose-500 pl-10 py-2">
          <div className="flex items-center gap-6">
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic glint-elite">
              МОНІТО� ИНГ <span className="text-rose-500">ГЛОБАЛЬНОЇ ІНФ� АСТ� УКТУ� И</span>
            </h2>
            <div className="px-4 py-1.5 bg-rose-500/10 border-2 border-rose-500/30 rounded-lg text-[10px] font-black text-rose-500 tracking-[0.3em] uppercase italic shadow-2xl">
              INFRA_ELITE_v61.0
            </div>
          </div>
          <div className="flex items-center gap-8 text-[11px] font-black font-mono text-white/30 tracking-[0.2em] uppercase italic">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
              <span className="text-emerald-500/80">АКТИВНА_СИНХ� ОНІЗАЦІЯ_ВУЗЛІВ</span>
            </div>
            <span className="opacity-20">•</span>
            <div className="flex items-center gap-3">
              <RefreshCw size={14} className="text-rose-500/60 animate-spin-slow" />
              <span>ІНТЕ� ВАЛ: 3.0с</span>
            </div>
            <span className="opacity-20">•</span>
            <div className="flex items-center gap-3 text-rose-500/40">
              <Server size={14} />
              <span>МАЙСТЕ� _ВУЗОЛ: {nodes.find(n => n.role.includes('Master'))?.node || '0xPRED_MASTER'}</span>
            </div>
          </div>
        </div>

        {/* Routing Indicator Badge */}
        <div className="flex items-center gap-6 bg-black/60 backdrop-blur-3xl p-6 rounded-[2rem] border-2 border-white/5 shadow-4xl group">
           <div className="flex flex-col items-end gap-1">
              <span className="text-[9px] font-black font-mono text-white/20 uppercase tracking-[0.4em] italic">СТ� АТЕГІЯ_МА� Ш� УТИЗАЦІЇ</span>
              <span className="text-[12px] font-black text-white/60 italic uppercase tracking-tighter group-hover:text-rose-500 transition-colors">{nodeSource}</span>
           </div>
           <div className="h-12 w-[2px] bg-white/5 mx-2" />
           <div className={cn(
             "px-8 py-4 rounded-[1.5rem] border-2 flex items-center gap-5 transition-all duration-700 shadow-4xl",
             llmTriStateMode === 'SOVEREIGN' ? "bg-rose-500/10 border-rose-500/40 text-rose-500 shadow-rose-500/10" :
             llmTriStateMode === 'HYBRID' ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-500 shadow-emerald-500/10" :
             "bg-sky-500/10 border-sky-500/40 text-sky-500 shadow-sky-500/10"
           )}>
             <Globe size={20} className={cn("animate-spin-slow", llmTriStateMode === 'SOVEREIGN' ? "text-rose-500" : llmTriStateMode === 'HYBRID' ? "text-emerald-500" : "text-sky-500")} />
             <div className="flex flex-col">
                <span className="text-xl font-black tracking-widest italic glint-elite leading-none">{llmTriStateMode}</span>
                <span className="text-[8px] font-black font-mono uppercase tracking-[0.3em] opacity-40 mt-1">
                   {llmTriStateMode === 'SOVEREIGN' ? 'АВТОНОМНИЙ_СУВЕ� ЕНІТЕТ' : 
                    llmTriStateMode === 'HYBRID' ? 'ГІБ� ИДНА_ЕФЕКТИВНІСТЬ' : 
                    'ХМА� НЕ_П� ИСКО� ЕННЯ'}
                </span>
             </div>
           </div>
        </div>
      </div>

      <LiveNetworkTopology nodes={nodes} />

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
        {[
          { label: 'АКТИВНІ_ВУЗЛИ', value: `${nodes.filter(n => n.status === 'online').length}/${nodes.length}`, icon: Server, color: 'text-rose-500', sub: 'ВЕ� ИФІКОВАНІ_АКТИВИ' },
          { label: 'МОДУЛІ_ЯД� А', value: services.length, icon: Box, color: 'text-sky-500', sub: 'МІК� ОСЕ� ВІСНА_ФУНДАЦІЯ' },
          { label: 'ЧАС_UPTIME', value: systemStatus?.uptime || '99.9%', icon: Shield, color: 'text-emerald-500', sub: 'БЕЗПЕ� Е� ВНІСТЬ_СИСТЕМИ' },
          { label: 'Т� АФІК_МЕ� ЕЖІ', value: `${totalThroughput.toFixed(1)} МБ/с`, icon: ZapIcon, color: 'text-amber-500', sub: 'ПОТОКОВА_П� ОПУСКНА_ЗДАТНІСТЬ' },
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            className="glass-wraith border-2 border-white/5 p-10 rounded-[2.5rem] flex items-center justify-between group hover:border-rose-500/40 transition-all duration-700 shadow-4xl hover:-translate-y-1 overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
            
            <div className="flex flex-col relative z-10">
              <span className="text-[10px] font-black font-mono text-white/20 uppercase tracking-[0.4em] mb-4 italic group-hover:text-rose-500/40 transition-colors">{stat.label}</span>
              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-black text-white italic tracking-tighter glint-elite">{stat.value}</span>
                {stat.color === 'text-emerald-500' && <span className="text-[9px] text-emerald-500 font-black animate-pulse tracking-widest italic uppercase">SECURE</span>}
              </div>
              <div className="text-[9px] font-black font-mono text-white/10 mt-6 uppercase tracking-[0.2em] italic group-hover:text-rose-500/60 transition-colors">{stat.sub}</div>
            </div>
            
            <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-rose-500/10 transition-all duration-700 relative z-10 border border-white/5 group-hover:border-rose-500/20">
               <stat.icon size={32} className={cn("transition-all duration-700 group-hover:scale-125 opacity-40 group-hover:opacity-100", stat.color)} />
            </div>

            <div className={cn(
              "absolute bottom-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-all duration-700",
              stat.color === 'text-rose-500' ? "bg-rose-500/50 shadow-[0_0_20px_rgba(225,29,72,0.6)]" : 
              stat.color === 'text-sky-500' ? "bg-sky-500/50 shadow-[0_0_20px_rgba(14,165,233,0.6)]" : 
              stat.color === 'text-emerald-500' ? "bg-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.6)]" : 
              "bg-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.6)]"
            )} />
          </motion.div>
        ))}
      </div>

      {/* Nodes Grid */}
      <div className="space-y-10 relative z-10">
        <div className="flex items-center gap-6 px-4">
          <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <span className="text-[12px] font-black font-mono text-white/40 uppercase tracking-[0.6em] italic glint-elite">ФЛОТ_ОБЧИСЛЮВАЛЬНИХ_ВУЗЛІВ_PREDATOR_V61</span>
          <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent via-white/10 to-transparent" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <AnimatePresence mode="popLayout">
            {nodes.map((node) => (
              <NodeCard key={node.id} node={node} />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Microservices Table */}
      <div className="space-y-10 relative z-10 pb-20">
        <div className="flex items-center gap-10 px-4">
          <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="flex flex-col items-center gap-3">
            <span className="text-2xl font-black text-white/50 uppercase tracking-[0.4em] italic glint-elite">ЯД� О_ЕКОСИСТЕМИ & СЕ� ВІСИ</span>
            <div className="flex items-center gap-4">
               <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_15px_rgba(225,29,72,1)]" />
               <span className="text-[10px] font-black font-mono text-rose-500/60 uppercase tracking-[0.3em] font-black italic">ВЕ� ИФІКОВАНО_ЦІЛІСНІСТЬ_А� ХІТЕКТУ� И_ELITE</span>
            </div>
          </div>
          <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent via-white/10 to-transparent" />
        </div>
        <div className="glass-wraith border-2 border-white/5 rounded-[3.5rem] overflow-hidden backdrop-blur-3xl shadow-4xl relative p-4">
          <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none" />
          <VirtualTable
            rows={services}
            columns={svcColumns}
            rowHeight={64}
            maxHeight={600}
            getRowStatus={getServiceStatus}
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

export default InfraTelemetryTab;
