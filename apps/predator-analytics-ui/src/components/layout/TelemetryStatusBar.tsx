import React, { useState, useEffect } from 'react';
import { Database, Server, HardDrive, Activity, Zap } from 'lucide-react';

// Mock дані для ілюстрації. В реальності сюди треба підключити Zustand store з телеметрією
const useMockTelemetry = () => {
  const [metrics, setMetrics] = useState({
    cpu: 45,
    gpu: 22,
    ram: 68,
    postgres: 'OK',
    qdrant: 'OK',
    opensearch: 'SYNC',
    redpanda: 'OK',
    etl: 'IDLE',
    activeAgents: 12
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpu: Math.max(10, Math.min(100, prev.cpu + (Math.random() * 20 - 10))),
        ram: Math.max(40, Math.min(95, prev.ram + (Math.random() * 5 - 2.5)))
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return metrics;
};

export const TelemetryStatusBar: React.FC = () => {
  const metrics = useMockTelemetry();

  return (
    <div className="w-full h-full flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-widest">
      
      {/* Hardware Telemetry */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Server size={12} className="text-cyan-500" />
          <span>CPU: {metrics.cpu.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap size={12} className="text-emerald-500" />
          <span>GPU: {metrics.gpu.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <HardDrive size={12} className="text-blue-500" />
          <span>MEM: {metrics.ram.toFixed(1)}%</span>
        </div>
      </div>

      {/* Database/Infrastructure Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${metrics.postgres === 'OK' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <span>PGSQL</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${metrics.qdrant === 'OK' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <span>QDRANT</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${metrics.opensearch === 'SYNC' ? 'bg-cyan-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span>OPENSEARCH</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${metrics.redpanda === 'OK' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span>REDPANDA</span>
        </div>
      </div>

      {/* Active Processes */}
      <div className="flex items-center gap-4 border-l border-white/10 pl-4">
        <div className="flex items-center gap-2">
          <Activity size={12} className="text-amber-500" />
          <span>ETL: {metrics.etl}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-bold">{metrics.activeAgents}</span>
          <span>AGENTS ACTIVE</span>
        </div>
      </div>

    </div>
  );
};
