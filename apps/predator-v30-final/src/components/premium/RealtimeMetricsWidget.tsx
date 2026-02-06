/**
 * 🚀 RealtimeMetricsWidget - Live System Metrics Display
 *
 * Displays real-time CPU, Memory, Disk metrics using WebSocket.
 * Shows connection status and auto-reconnect capability.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, HardDrive, Activity, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useRealtimeMetrics } from '../../hooks/useRealtimeMetrics';
import { cn } from '../../utils/cn';

interface RealtimeMetricsWidgetProps {
  compact?: boolean;
  className?: string;
}

export const RealtimeMetricsWidget: React.FC<RealtimeMetricsWidgetProps> = ({
  compact = false,
  className
}) => {
  const { metrics, isConnected, isLoading, error, connectionType, reconnect } = useRealtimeMetrics();

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStatusColor = (percent: number): string => {
    if (percent < 60) return 'emerald';
    if (percent < 80) return 'amber';
    return 'rose';
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-4 px-4 py-2 bg-slate-900/60 rounded-xl border border-white/5", className)}>
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Wifi size={14} className="text-emerald-400" />
          ) : (
            <WifiOff size={14} className="text-rose-400" />
          )}
          <span className={cn(
            "text-[10px] font-mono uppercase",
            isConnected ? "text-emerald-400" : "text-rose-400"
          )}>
            {connectionType === 'websocket' ? 'LIVE' : connectionType === 'polling' ? 'POLL' : 'OFFLINE'}
          </span>
        </div>

        {metrics && (
          <>
            <div className="flex items-center gap-2">
              <Cpu size={12} className="text-slate-500" />
              <span className={cn(
                "text-xs font-bold",
                `text-${getStatusColor(metrics.cpu.percent)}-400`
              )}>
                {metrics.cpu.percent.toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Activity size={12} className="text-slate-500" />
              <span className={cn(
                "text-xs font-bold",
                `text-${getStatusColor(metrics.memory.percent)}-400`
              )}>
                {metrics.memory.percent.toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive size={12} className="text-slate-500" />
              <span className={cn(
                "text-xs font-bold",
                `text-${getStatusColor(metrics.disk.percent)}-400`
              )}>
                {metrics.disk.percent.toFixed(0)}%
              </span>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-slate-950/80 border border-white/10 rounded-[24px] p-6 backdrop-blur-xl",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-xl",
            isConnected ? "bg-emerald-500/20" : "bg-rose-500/20"
          )}>
            {isConnected ? (
              <Wifi className="text-emerald-400" size={18} />
            ) : (
              <WifiOff className="text-rose-400" size={18} />
            )}
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
              Системні Метрики
              {isConnected && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </h3>
            <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">
              {connectionType === 'websocket' ? 'WEBSOCKET LIVE' :
               connectionType === 'polling' ? 'REST POLLING' : 'CONNECTING...'}
            </p>
          </div>
        </div>

        {!isConnected && (
          <button
            onClick={reconnect}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <RefreshCw size={12} />
            Перепідключити
          </button>
        )}
      </div>

      {/* Loading State */}
      {isLoading && !metrics && (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !metrics && (
        <div className="text-center py-8 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Metrics Display */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CPU */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "p-4 rounded-xl border transition-all",
              `bg-${getStatusColor(metrics.cpu.percent)}-500/5 border-${getStatusColor(metrics.cpu.percent)}-500/20`
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Cpu size={16} className={`text-${getStatusColor(metrics.cpu.percent)}-400`} />
                <span className="text-xs font-bold text-white">CPU</span>
              </div>
              <span className="text-[10px] text-slate-500">{metrics.cpu.cores} ядер</span>
            </div>
            <div className={cn(
              "text-3xl font-black mb-2",
              `text-${getStatusColor(metrics.cpu.percent)}-400`
            )}>
              {metrics.cpu.percent.toFixed(1)}%
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${metrics.cpu.percent}%` }}
                transition={{ duration: 0.5 }}
                className={cn(
                  "h-full rounded-full",
                  `bg-gradient-to-r from-${getStatusColor(metrics.cpu.percent)}-600 to-${getStatusColor(metrics.cpu.percent)}-400`
                )}
              />
            </div>
          </motion.div>

          {/* Memory */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn(
              "p-4 rounded-xl border transition-all",
              `bg-${getStatusColor(metrics.memory.percent)}-500/5 border-${getStatusColor(metrics.memory.percent)}-500/20`
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity size={16} className={`text-${getStatusColor(metrics.memory.percent)}-400`} />
                <span className="text-xs font-bold text-white">Пам'ять</span>
              </div>
              <span className="text-[10px] text-slate-500">{formatBytes(metrics.memory.total)}</span>
            </div>
            <div className={cn(
              "text-3xl font-black mb-2",
              `text-${getStatusColor(metrics.memory.percent)}-400`
            )}>
              {metrics.memory.percent.toFixed(1)}%
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${metrics.memory.percent}%` }}
                transition={{ duration: 0.5 }}
                className={cn(
                  "h-full rounded-full",
                  `bg-gradient-to-r from-${getStatusColor(metrics.memory.percent)}-600 to-${getStatusColor(metrics.memory.percent)}-400`
                )}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              {formatBytes(metrics.memory.used)} / {formatBytes(metrics.memory.total)}
            </p>
          </motion.div>

          {/* Disk */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn(
              "p-4 rounded-xl border transition-all",
              `bg-${getStatusColor(metrics.disk.percent)}-500/5 border-${getStatusColor(metrics.disk.percent)}-500/20`
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <HardDrive size={16} className={`text-${getStatusColor(metrics.disk.percent)}-400`} />
                <span className="text-xs font-bold text-white">Диск</span>
              </div>
              <span className="text-[10px] text-slate-500">{formatBytes(metrics.disk.total)}</span>
            </div>
            <div className={cn(
              "text-3xl font-black mb-2",
              `text-${getStatusColor(metrics.disk.percent)}-400`
            )}>
              {metrics.disk.percent.toFixed(1)}%
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${metrics.disk.percent}%` }}
                transition={{ duration: 0.5 }}
                className={cn(
                  "h-full rounded-full",
                  `bg-gradient-to-r from-${getStatusColor(metrics.disk.percent)}-600 to-${getStatusColor(metrics.disk.percent)}-400`
                )}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              {formatBytes(metrics.disk.free)} вільно
            </p>
          </motion.div>
        </div>
      )}

      {/* Last Update */}
      {metrics?.timestamp && (
        <div className="mt-4 text-center text-[10px] text-slate-600 font-mono">
          Оновлено: {new Date(metrics.timestamp).toLocaleTimeString('uk-UA')}
        </div>
      )}
    </div>
  );
};

export default RealtimeMetricsWidget;
