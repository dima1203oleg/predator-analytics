/**
 * RealTimeSystemMetrics - v58.2-WRAITH Omniscience Real-Time Matrix
 * 
 * Преміальна візуалізація системних метрик у реальному часі.
 * Використовує TacticalCard, Cyber-Scanlines та розширені анімації.
 * 
 * © 2026 PREDATOR Analytics - Повна українізація v58.2-WRAITH
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, HardDrive, Activity, Zap, AlertTriangle,
  TrendingUp, TrendingDown, Clock, Users, Database,
  Wifi, WifiOff, RefreshCw, Layers, Shield,
  ArrowUpRight, ArrowDownRight, Circle
} from 'lucide-react';
import { cn } from '../utils/cn';
import { TacticalCard } from './ui/TacticalCard';

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  activeConnections: number;
  requestsPerSecond: number;
  latency: {
    p50: number;
    p95: number;
    p99: number;
  };
  errorRate: number;
  uptime: number;
  healthScore: number;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  color: 'blue' | 'emerald' | 'purple' | 'cyan' | 'rose' | 'amber' | 'indigo';
  warning?: boolean;
  critical?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label, value, unit, icon: Icon, trend, trendValue, color, warning, critical
}) => {
  const colorMap = {
    blue: 'from-blue-500/20 to-indigo-600/5 text-blue-400 border-blue-500/30 glow-blue',
    emerald: 'from-emerald-500/20 to-teal-600/5 text-emerald-400 border-emerald-500/30 glow-emerald',
    purple: 'from-purple-500/20 to-pink-600/5 text-purple-400 border-purple-500/30 glow-purple',
    cyan: 'from-cyan-500/20 to-blue-600/5 text-cyan-400 border-cyan-500/30 glow-cyan',
    rose: 'from-rose-500/20 to-red-600/5 text-rose-400 border-rose-500/30 glow-rose',
    amber: 'from-amber-500/20 to-orange-600/5 text-amber-400 border-amber-500/30 glow-amber',
    indigo: 'from-indigo-500/20 to-blue-600/5 text-indigo-400 border-indigo-500/30 glow-indigo',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className={cn(
        "relative rounded-[32px] p-6 border backdrop-blur-3xl overflow-hidden transition-all duration-500 panel-3d shadow-2xl bg-slate-950/40 group",
        critical ? 'border-rose-500/50 bg-rose-500/5' : warning ? 'border-amber-500/50 bg-amber-500/5' : 'border-white/5'
      )}
    >
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-40 transition-opacity duration-700" style={{ color: `var(--${color}-400)` }} />
      <div className="absolute inset-0 bg-cyber-scanline opacity-[0.03] pointer-events-none" />

      <div className="flex items-start justify-between mb-6 relative z-10">
        <div className={cn("p-4 rounded-2xl bg-slate-900 border border-white/5 shadow-xl group-hover:scale-110 transition-transform duration-500", !critical && !warning && `text-${color}-400`)}>
          <Icon size={24} className={critical || warning ? 'animate-pulse' : ''} />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-lg transition-all",
            trend === 'up' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              trend === 'down' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                'bg-slate-500/10 text-slate-300 border-slate-400/30'
          )}>
            {trend === 'up' ? <ArrowUpRight size={10} /> : trend === 'down' ? <ArrowDownRight size={10} /> : <Circle size={8} />}
            {trendValue}
          </div>
        )}
      </div>

      <div className="space-y-2 relative z-10">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-white tracking-tighter font-display">{value}</span>
          {unit && <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest font-mono">{unit}</span>}
        </div>
        <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] font-mono group-hover:text-white transition-colors">{label}</div>
      </div>

      {typeof value === 'number' && unit === '%' && (
        <div className="mt-6 h-1.5 bg-slate-900/60 rounded-full overflow-hidden border border-white/5 relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(value, 100)}%` }}
            transition={{ duration: 1.5, ease: "circOut" }}
            className={cn(
              "h-full rounded-full shadow-lg transition-all duration-500",
              value > 90 ? 'bg-rose-500 shadow-rose-500/40' :
                value > 75 ? 'bg-amber-500 shadow-amber-500/40' :
                  `bg-${color}-500 shadow-${color}-500/40`
            )}
          />
        </div>
      )}
    </motion.div>
  );
};

export const RealTimeSystemMetrics: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 0,
    memory: 0,
    disk: 0,
    activeConnections: 0,
    requestsPerSecond: 0,
    latency: { p50: 0, p95: 0, p99: 0 },
    errorRate: 0,
    uptime: 0,
    healthScore: 100
  });
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/v45/monitoring/health');
      if (response.ok) {
        const data = await response.json();
        setMetrics({
          cpu: data.cpu?.percent || 0,
          memory: data.memory?.percent || 0,
          disk: data.disk?.percent || 0,
          activeConnections: data.connections || 0,
          requestsPerSecond: data.rps || 0,
          latency: {
            p50: data.latency?.p50 || 0,
            p95: data.latency?.p95 || 0,
            p99: data.latency?.p99 || 0
          },
          errorRate: data.errorRate || 0,
          uptime: data.uptime || 0,
          healthScore: data.healthScore || 0
        });
        setIsConnected(true);
        setLastUpdate(new Date());
      }
    } catch (error) {
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(`${protocol}//${window.location.host}/api/v45/ws/omniscience`);
        ws.onopen = () => setIsConnected(true);
        ws.onclose = () => setIsConnected(false);
        ws.onerror = () => setIsConnected(false);
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.system) {
              setMetrics(prev => ({
                ...prev,
                cpu: data.system.cpu_percent || prev.cpu,
                memory: data.system.memory_percent || prev.memory
              }));
              setLastUpdate(new Date());
            }
          } catch (e) { /* ignore */ }
        };
      } catch (e) {
        console.warn('WebSocket failed, using polling');
      }
    };
    connectWebSocket();
    return () => ws?.close();
  }, []);

  if (compact) {
    return (
      <div className="flex items-center gap-6 px-6 py-2.5 rounded-2xl bg-slate-950/60 border border-white/5 backdrop-blur-2xl shadow-xl group">
        <div className="flex items-center gap-3">
          <Cpu size={14} className="text-blue-400 group-hover:scale-125 transition-transform" />
          <span className="text-xs font-black font-mono text-slate-200">{metrics.cpu.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-3">
          <HardDrive size={14} className="text-emerald-400 group-hover:scale-125 transition-transform" />
          <span className="text-xs font-black font-mono text-slate-200">{metrics.memory.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-3">
          <Activity size={14} className="text-cyan-400 group-hover:scale-125 transition-transform" />
          <span className="text-xs font-black font-mono text-slate-200">{metrics.requestsPerSecond} RPS</span>
        </div>
        <div className={cn("pl-3 border-l border-white/10 flex items-center gap-2", isConnected ? 'text-emerald-500' : 'text-rose-500')}>
          {isConnected ? <Wifi size={14} className="animate-pulse" /> : <WifiOff size={14} />}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-700">
      {/* Header Matrix Control */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 bg-slate-950/40 border border-white/5 rounded-[40px] backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="p-4 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl text-white shadow-[0_0_30px_rgba(37,99,235,0.3)] icon-3d-blue">
            <Activity size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-2 font-display">OMNISCIENCE_<span className="text-blue-400">MATRIX</span>_MONITOR</h3>
            <div className="flex items-center gap-4 text-[10px] text-slate-300 font-black uppercase tracking-[0.2em]">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", isConnected ? 'bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse' : 'bg-rose-500')} />
                <span>{isConnected ? 'СИСТЕМА_В_МЕ� ЕЖІ' : 'К� ИТИЧНО_ОФЛАЙН'}</span>
              </div>
              {lastUpdate && (
                <div className="flex items-center gap-2 pl-4 border-l border-white/10">
                  <Clock size={12} />
                  <span>ОСТАННЄ_ОНОВЛЕННЯ: {lastUpdate.toLocaleTimeString('uk-UA')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05, rotate: 180 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchMetrics}
          className="p-4 rounded-2xl bg-slate-900 border border-white/5 text-slate-200 hover:text-blue-300 hover:border-blue-500/30 transition-all shadow-xl"
        >
          <RefreshCw size={20} />
        </motion.button>
      </div>

      {/* Vitality Score & Matrix Grid */}
      <div className="grid grid-cols-12 gap-8">

        {/* Vitality Score Main Hub */}
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-8">
          <TacticalCard variant="holographic" title="SYSTEM_VITALITY_CORE" className="flex-1 p-10 flex flex-col items-center justify-center bg-slate-950/60 shadow-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-cyber-scanline opacity-[0.03] pointer-events-none" />
            <div className="relative mb-8 mt-4">
              <div className={cn(
                "absolute inset-0 blur-[100px] rounded-full scale-150 transition-all duration-1000",
                metrics.healthScore >= 90 ? 'bg-emerald-500/20' : metrics.healthScore >= 70 ? 'bg-amber-500/20' : 'bg-rose-500/20'
              )} />
              <div className="relative w-48 h-48 rounded-full border-4 border-white/5 flex flex-col items-center justify-center shadow-2xl bg-slate-900/40 backdrop-blur-2xl group-hover:scale-105 transition-transform duration-700">
                <Zap size={48} className={cn(
                  "mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]",
                  metrics.healthScore >= 90 ? 'text-emerald-400' : metrics.healthScore >= 70 ? 'text-amber-400' : 'text-rose-400'
                )} />
                <div className="text-5xl font-black text-white tracking-widest font-display drop-shadow-2xl">
                  {metrics.healthScore.toFixed(0)}%
                </div>
              </div>
            </div>
            <div className="text-center">
              <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.5em] mb-4 block">Коефіцієнт Живучості</span>
              <p className="text-[9px] text-slate-400 font-mono uppercase tracking-widest max-w-[200px] leading-relaxed mx-auto">
                Агрегований індекс стабільності вузлів обробки v58.2-WRAITH
              </p>
            </div>
          </TacticalCard>

          <div className="grid grid-cols-2 gap-8">
            <div className="p-8 rounded-[36px] bg-slate-950/40 border border-white/5 shadow-xl flex flex-col gap-4 group hover:bg-slate-900/60 transition-all duration-500">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Error Rate</span>
                <AlertTriangle size={16} className={metrics.errorRate < 1 ? 'text-emerald-500' : 'text-rose-500'} />
              </div>
              <div className={cn("text-3xl font-black font-display tracking-tighter", metrics.errorRate < 1 ? 'text-emerald-400' : 'text-rose-400')}>
                {metrics.errorRate.toFixed(2)}%
              </div>
            </div>
            <div className="p-8 rounded-[36px] bg-slate-950/40 border border-white/5 shadow-xl flex flex-col gap-4 group hover:bg-slate-900/60 transition-all duration-500">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Uptime</span>
                <Shield size={16} className="text-emerald-500" />
              </div>
              <div className="text-3xl font-black text-emerald-400 font-display tracking-tighter">
                {metrics.uptime.toFixed(3)}%
              </div>
            </div>
          </div>
        </div>

        {/* Primary Metrics Grid */}
        <div className="col-span-12 xl:col-span-8 flex flex-col gap-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <MetricCard
              label="ЦЕНТ� АЛЬНИЙ_П� ОЦЕСО� "
              value={metrics.cpu.toFixed(1)}
              unit="%"
              icon={Cpu}
              color="blue"
              warning={metrics.cpu > 70}
              critical={metrics.cpu > 90}
              trend={metrics.cpu > 50 ? 'up' : 'stable'}
              trendValue={metrics.cpu > 50 ? '+4.2%' : 'STABLE'}
            />
            <MetricCard
              label="ОПЕ� АТИВНА_ПАМ'ЯТЬ"
              value={metrics.memory.toFixed(1)}
              unit="%"
              icon={HardDrive}
              color="emerald"
              warning={metrics.memory > 70}
              critical={metrics.memory > 90}
              trend="stable"
              trendValue="SYNCED"
            />
            <MetricCard
              label="АКТИВНІ_З'ЄДНАННЯ"
              value={metrics.activeConnections.toLocaleString()}
              icon={Users}
              color="purple"
              trend="up"
              trendValue="+128"
              unit="NODES"
            />
            <MetricCard
              label="П� ОПУСКНА_ЗДАТНІСТЬ"
              value={metrics.requestsPerSecond}
              unit="REQ/S"
              icon={Activity}
              color="cyan"
              trend="up"
              trendValue="+18%"
            />
          </div>

          {/* Latency Matrix Visualization */}
          <TacticalCard variant="holographic" title="NETWORK_LATENCY_SPECTRUM" className="p-10 border-white/5 bg-slate-950/40 overflow-hidden relative group">
            <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
            <div className="flex items-center gap-6 mb-10">
              <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-400">
                <Clock size={20} />
              </div>
              <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">Response Time Analytics (ms)</span>
            </div>
            <div className="grid grid-cols-3 gap-12 relative z-10">
              {[
                { label: 'P50_NOMINAL', value: metrics.latency.p50, color: 'emerald', desc: 'Середня швидкість' },
                { label: 'P95_ELEVATED', value: metrics.latency.p95, color: 'amber', desc: 'Верхній сегмент' },
                { label: 'P99_CRITICAL', value: metrics.latency.p99, color: 'rose', desc: 'Хвостові запити' }
              ].map(({ label, value, color, desc }) => (
                <motion.div key={label} whileHover={{ y: -4 }} className="flex flex-col gap-3 group/item">
                  <div className={cn(
                    "text-5xl font-black font-display tracking-tighter drop-shadow-2xl transition-all duration-500",
                    `text-${color}-400 group-hover/item:scale-110`
                  )}>
                    {value}<span className="text-sm font-black text-slate-400 ml-2">ms</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest mb-1">{label}</span>
                    <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">{desc}</span>
                  </div>
                  <div className="mt-4 h-1 bg-slate-900 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((value / 500) * 100, 100)}%` }}
                      className={cn("h-full", `bg-${color}-500 shadow-[0_0_10px_#${color === 'rose' ? 'f43f5e' : color === 'amber' ? 'f59e0b' : '10b981'}]`)}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </TacticalCard>
        </div>
      </div>
    </div>
  );
};

export default RealTimeSystemMetrics;
