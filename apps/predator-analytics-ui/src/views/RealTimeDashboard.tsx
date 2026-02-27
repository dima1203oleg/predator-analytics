/**
 * ⚡ Real-Time Dashboard
 *
 * WebSocket-based real-time data monitoring
 * Live updates, streaming data, alerts
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Wifi,
  WifiOff,
  Radio,
  Clock,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Building2,
  Globe,
  AlertTriangle,
  Bell,
  RefreshCw,
  Settings,
  Maximize2,
  Crown,
  Zap,
  Circle,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Play,
  Pause
} from 'lucide-react';

// ========================
// Types
// ========================

interface LiveMetric {
  id: string;
  label: string;
  value: number;
  unit: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
  icon: React.ElementType;
}

interface LiveEvent {
  id: string;
  type: 'import' | 'export' | 'alert' | 'price';
  title: string;
  value: string;
  timestamp: Date;
  isNew: boolean;
}

interface StreamedData {
  timestamp: Date;
  imports: number;
  exports: number;
  alerts: number;
}

// ========================
// Simulated WebSocket
// ========================

import { useOmniscienceWS } from '../hooks/useOmniscienceWS';

const useRealWebSocket = (isConnected: boolean) => {
  const { data: wsData, isConnected: wsConnected } = useOmniscienceWS();

  const metrics = useMemo<LiveMetric[]>(() => {
    if (!wsData) return [
      { id: '1', label: 'CPU Навантаження', value: 0, unit: '%', change: 0, trend: 'stable', color: 'cyan', icon: Activity },
      { id: '2', label: 'Пам\'ять', value: 0, unit: '%', change: 0, trend: 'stable', color: 'emerald', icon: Zap },
      { id: '3', label: 'Активні контейнери', value: 0, unit: '', change: 0, trend: 'stable', color: 'amber', icon: Package },
      { id: '4', label: 'База даних', value: 0, unit: 'зап', change: 0, trend: 'stable', color: 'purple', icon: Building2 },
    ];

    return [
      {
        id: '1',
        label: 'CPU Навантаження',
        value: wsData.system?.cpu_percent || 0,
        unit: '%',
        change: Math.random() > 0.5 ? 2.5 : -1.2,
        trend: (wsData.system?.cpu_percent || 0) > 50 ? 'up' : 'stable',
        color: 'cyan',
        icon: Activity
      },
      {
        id: '2',
        label: 'Пам\'ять',
        value: wsData.system?.memory_percent || 0,
        unit: '%',
        change: 0.5,
        trend: 'stable',
        color: 'emerald',
        icon: Zap
      },
      {
        id: '3',
        label: 'Активні контейнери',
        value: wsData.system?.active_containers || 0,
        unit: '',
        change: 0,
        trend: 'stable',
        color: 'amber',
        icon: Package
      },
      {
        id: '4',
        label: 'База даних',
        value: (wsData as any).data?.db_records || 12450,
        unit: 'зап',
        change: 12,
        trend: 'up',
        color: 'purple',
        icon: Building2
      },
    ];
  }, [wsData]);

  const events = useMemo<LiveEvent[]>(() => {
    if (!wsData?.audit_logs) return [];
    return wsData.audit_logs.map(log => ({
      id: log.id,
      type: log.risk_level === 'high' ? 'alert' : 'import',
      title: log.intent || 'Системна подія',
      value: log.status?.toUpperCase() || 'OK',
      timestamp: new Date(log.created_at),
      isNew: (Date.now() - new Date(log.created_at).getTime()) < 10000
    }));
  }, [wsData]);

  const [streamData, setStreamData] = useState<StreamedData[]>([]);

  useEffect(() => {
    if (wsData?.system) {
      setStreamData(prev => {
        const newData: StreamedData = {
          timestamp: new Date(),
          imports: wsData.system.cpu_percent * 2, // Map CPU to mock 'imports' for visualization
          exports: wsData.system.memory_percent * 1.5,
          alerts: wsData.audit_logs?.filter(l => l.risk_level === 'high').length || 0
        };
        return [...prev.slice(-29), newData];
      });
    }
  }, [wsData]);

  return { metrics, events, streamData, isConnected: wsConnected };
};

// ========================
// Components
// ========================

const ConnectionStatus: React.FC<{ isConnected: boolean; onToggle: () => void }> = ({ isConnected, onToggle }) => (
  <button
    onClick={onToggle}
    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${isConnected
      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
      }`}
  >
    {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
    <span className="text-xs font-bold">
      {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
    </span>
    {isConnected && (
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
    )}
  </button>
);

const LiveMetricCard: React.FC<{ metric: LiveMetric }> = ({ metric }) => {
  const Icon = metric.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 bg-slate-900/60 border border-white/5 rounded-xl relative overflow-hidden"
    >
      {/* Pulse effect */}
      <motion.div
        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        className={`absolute top-2 right-2 w-2 h-2 rounded-full bg-${metric.color}-400`}
      />

      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg bg-${metric.color}-500/20`}>
          <Icon className={`text-${metric.color}-400`} size={18} />
        </div>
        <div className={`flex items-center gap-1 text-xs ${metric.trend === 'up' ? 'text-emerald-400' :
          metric.trend === 'down' ? 'text-rose-400' : 'text-slate-400'
          }`}>
          {metric.trend === 'up' ? <ArrowUp size={12} /> :
            metric.trend === 'down' ? <ArrowDown size={12} /> : null}
          {Math.abs(metric.change).toFixed(1)}%
        </div>
      </div>

      <motion.div
        key={metric.value}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-2xl font-black text-white"
      >
        {typeof metric.value === 'number' ? metric.value.toFixed(metric.unit === 'M$' ? 1 : 0) : metric.value}
        <span className="text-sm text-slate-500 ml-1">{metric.unit}</span>
      </motion.div>
      <p className="text-xs text-slate-500 mt-1">{metric.label}</p>
    </motion.div>
  );
};

const LiveEventFeed: React.FC<{ events: LiveEvent[] }> = ({ events }) => {
  const typeConfig = {
    import: { icon: Package, color: 'cyan' },
    export: { icon: Globe, color: 'purple' },
    alert: { icon: AlertTriangle, color: 'amber' },
    price: { icon: DollarSign, color: 'emerald' }
  };

  return (
    <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Radio className="text-cyan-400" size={16} />
          Live Feed
        </h3>
        <span className="text-xs text-slate-500">{events.length} подій</span>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        <AnimatePresence initial={false}>
          {events.slice(0, 10).map((event, index) => {
            const config = typeConfig[event.type];
            const Icon = config.icon;

            return (
              <motion.div
                key={event.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-3 p-2 rounded-lg ${event.isNew ? `bg-${config.color}-500/10 border border-${config.color}-500/20` : 'bg-slate-800/50'
                  }`}
              >
                <Icon className={`text-${config.color}-400`} size={14} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{event.title}</p>
                </div>
                <span className="text-xs font-bold text-white">{event.value}</span>
                <span className="text-[10px] text-slate-500">
                  {event.timestamp.toLocaleTimeString('uk', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

const StreamChart: React.FC<{ data: StreamedData[] }> = ({ data }) => {
  const maxImports = useMemo(() => Math.max(...data.map(d => d.imports), 1), [data]);

  return (
    <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Activity className="text-emerald-400" size={16} />
          Streaming Data
        </h3>
        <span className="text-xs text-slate-500">останні 30 сек</span>
      </div>

      <div className="h-40 flex items-end gap-0.5">
        <AnimatePresence initial={false}>
          {data.map((point, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${(point.imports / maxImports) * 100}%` }}
              className="flex-1 bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t"
              style={{ minWidth: '2px' }}
            />
          ))}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
        <span>30s ago</span>
        <span>now</span>
      </div>
    </div>
  );
};

// ========================
// Main Component
// ========================

const RealTimeDashboard: React.FC = () => {
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const { metrics, events, streamData, isConnected } = useRealWebSocket(isLive);

  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => setLastUpdate(new Date()), 1000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/3 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <Activity className="text-emerald-400" />
              Real-Time Dashboard
              <span className="ml-2 px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-full flex items-center gap-1">
                <Crown size={14} />
                Premium
              </span>
            </h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              <Clock size={14} />
              Оновлено: {lastUpdate.toLocaleTimeString('uk')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ConnectionStatus isConnected={isConnected} onToggle={() => setIsLive(!isLive)} />

            <button className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <Settings size={18} />
            </button>

            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-bold text-sm">
              <Zap size={16} />
              Subscribe
            </button>
          </div>
        </div>

        {/* Connection Alert */}
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3"
          >
            <WifiOff className="text-rose-400" size={20} />
            <div className="flex-1">
              <p className="font-bold text-rose-400">З'єднання втрачено</p>
              <p className="text-sm text-rose-400/70">Дані не оновлюються в реальному часі</p>
            </div>
            <button
              onClick={() => setIsLive(true)}
              className="px-4 py-2 bg-rose-500/20 text-rose-400 rounded-lg font-bold text-sm"
            >
              Перепідключити
            </button>
          </motion.div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((metric) => (
            <LiveMetricCard key={metric.id} metric={metric} />
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stream Chart */}
          <StreamChart data={streamData} />

          {/* Live Events */}
          <LiveEventFeed events={events} />
        </div>

        {/* WebSocket Stats */}
        <div className="mt-8 p-6 bg-slate-900/40 border border-white/5 rounded-xl">
          <h3 className="font-bold text-white mb-4">WebSocket Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { label: 'Messages/sec', value: isConnected ? '~15' : '0' },
              { label: 'Latency', value: isConnected ? '45ms' : 'N/A' },
              { label: 'Uptime', value: isConnected ? '99.9%' : '0%' },
              { label: 'Events Today', value: events.length.toString() },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-2xl font-black text-cyan-400">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeDashboard;
