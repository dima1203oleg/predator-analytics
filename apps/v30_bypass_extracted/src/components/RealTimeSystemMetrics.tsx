/**
 * RealTimeSystemMetrics - Живі метрики системи в реальному часі
 *
 * Відображає:
 * - CPU/RAM/Disk usage
 * - Активні з'єднання
 * - Throughput запитів
 * - Latency P50/P95/P99
 * - Error rate
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu,
  HardDrive,
  Activity,
  Zap,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Database,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';

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
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  color: string;
  warning?: boolean;
  critical?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label, value, unit, icon, trend, trendValue, color, warning, critical
}) => {
  const borderColor = critical ? 'border-rose-500/50' : warning ? 'border-amber-500/50' : `border-${color}-500/20`;
  const glowColor = critical ? 'shadow-rose-500/20' : warning ? 'shadow-amber-500/20' : `shadow-${color}-500/10`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        relative overflow-hidden rounded-2xl p-4
        bg-gradient-to-br from-slate-900/80 to-slate-950/90
        border ${borderColor}
        backdrop-blur-xl
        shadow-lg ${glowColor}
        group hover:scale-[1.02] transition-all duration-300
      `}
    >
      {/* Animated background glow */}
      <div className={`
        absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
        bg-gradient-to-br from-${color}-500/5 to-transparent
      `} />

      {/* Pulse indicator for critical/warning */}
      {(critical || warning) && (
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className={`absolute top-2 right-2 w-2 h-2 rounded-full ${critical ? 'bg-rose-500' : 'bg-amber-500'}`}
        />
      )}

      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl bg-${color}-500/10 text-${color}-400`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-slate-400'
            }`}>
            {trend === 'up' ? <TrendingUp size={12} /> : trend === 'down' ? <TrendingDown size={12} /> : null}
            {trendValue}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-white tracking-tight">{value}</span>
          {unit && <span className="text-xs text-slate-500 font-mono">{unit}</span>}
        </div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</div>
      </div>

      {/* Progress bar for percentage metrics */}
      {typeof value === 'number' && unit === '%' && (
        <div className="mt-3 h-1 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(value, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${value > 90 ? 'bg-rose-500' : value > 70 ? 'bg-amber-500' : `bg-${color}-500`
              }`}
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
      const response = await fetch('/api/v25/monitoring/health');
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

  // WebSocket connection for real-time updates
  useEffect(() => {
    let ws: WebSocket | null = null;

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(`${protocol}//${window.location.host}/api/v25/ws/omniscience`);

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
          } catch (e) {
            // Ignore parse errors
          }
        };
      } catch (e) {
        console.warn('WebSocket connection failed, using polling');
      }
    };

    connectWebSocket();

    return () => {
      if (ws) ws.close();
    };
  }, []);

  if (compact) {
    return (
      <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-slate-900/50 border border-white/5">
        <div className="flex items-center gap-2">
          <Cpu size={14} className="text-blue-400" />
          <span className="text-xs font-mono text-slate-300">{metrics.cpu.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <HardDrive size={14} className="text-emerald-400" />
          <span className="text-xs font-mono text-slate-300">{metrics.memory.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-purple-400" />
          <span className="text-xs font-mono text-slate-300">{metrics.requestsPerSecond} rps</span>
        </div>
        <div className={`flex items-center gap-1 ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
            <Activity size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Системні Метрики</h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span>{isConnected ? 'Підключено' : 'Офлайн'}</span>
              {lastUpdate && (
                <>
                  <span>•</span>
                  <span>{lastUpdate.toLocaleTimeString('uk-UA')}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchMetrics}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
        >
          <RefreshCw size={16} />
        </motion.button>
      </div>

      {/* Health Score Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          p-4 rounded-2xl border
          ${metrics.healthScore >= 90
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : metrics.healthScore >= 70
              ? 'bg-amber-500/10 border-amber-500/30'
              : 'bg-rose-500/10 border-rose-500/30'
          }
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap size={24} className={
              metrics.healthScore >= 90 ? 'text-emerald-400' :
                metrics.healthScore >= 70 ? 'text-amber-400' : 'text-rose-400'
            } />
            <div>
              <div className="text-sm font-bold text-white">Health Score</div>
              <div className="text-xs text-slate-400">Загальний стан системи</div>
            </div>
          </div>
          <div className="text-3xl font-black text-white">
            {metrics.healthScore.toFixed(0)}%
          </div>
        </div>
      </motion.div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="CPU"
          value={metrics.cpu.toFixed(1)}
          unit="%"
          icon={<Cpu size={18} />}
          color="blue"
          warning={metrics.cpu > 70}
          critical={metrics.cpu > 90}
          trend={metrics.cpu > 50 ? 'up' : 'stable'}
          trendValue={metrics.cpu > 50 ? '+5%' : ''}
        />
        <MetricCard
          label="Memory"
          value={metrics.memory.toFixed(1)}
          unit="%"
          icon={<HardDrive size={18} />}
          color="emerald"
          warning={metrics.memory > 70}
          critical={metrics.memory > 90}
        />
        <MetricCard
          label="Connections"
          value={metrics.activeConnections}
          icon={<Users size={18} />}
          color="purple"
        />
        <MetricCard
          label="RPS"
          value={metrics.requestsPerSecond}
          unit="req/s"
          icon={<Activity size={18} />}
          color="cyan"
          trend="up"
          trendValue="+12%"
        />
      </div>

      {/* Latency Metrics */}
      <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-amber-400" />
          <span className="text-sm font-bold text-white uppercase tracking-wider">Latency</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'P50', value: metrics.latency.p50, color: 'emerald' },
            { label: 'P95', value: metrics.latency.p95, color: 'amber' },
            { label: 'P99', value: metrics.latency.p99, color: 'rose' }
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <div className={`text-xl font-black text-${color}-400`}>{value}ms</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Error Rate & Uptime */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-bold uppercase">Error Rate</div>
              <div className={`text-2xl font-black ${metrics.errorRate < 1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {metrics.errorRate.toFixed(2)}%
              </div>
            </div>
            <AlertTriangle size={24} className={metrics.errorRate < 1 ? 'text-emerald-400' : 'text-rose-400'} />
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-bold uppercase">Uptime</div>
              <div className="text-2xl font-black text-emerald-400">{metrics.uptime.toFixed(2)}%</div>
            </div>
            <Database size={24} className="text-emerald-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeSystemMetrics;
