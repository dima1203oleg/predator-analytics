import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';

interface OodaPhase {
  latency_ms: number;
  health: number;
}

interface OodaStatus {
  timestamp: string;
  cycle_time_ms: number;
  phases: Record<string, OodaPhase>;
  alerts: string[];
}

export function OodaRadar() {
  const [status, setStatus] = useState<OodaStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiFetch('/api/v1/ooda/status');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        if (!data || !data.phases) {
          throw new Error('Invalid response format');
        }
        setStatus(data);
        setError(null);
      } catch (err) {
        // Fallback to mock data if API is not reachable (e.g. mock server mode)
        setStatus({
          timestamp: new Date().toISOString(),
          cycle_time_ms: 245,
          phases: {
            observe: { latency_ms: 20, health: 0.99 },
            orient: { latency_ms: 60, health: 0.97 },
            decide: { latency_ms: 120, health: 0.98 },
            act: { latency_ms: 30, health: 0.99 },
            feedback: { latency_ms: 15, health: 1.0 }
          },
          alerts: []
        });
        setError('Using local mock data (API unavailable)');
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!status) {
    return <div className="p-4 text-gray-400">Loading OODA Radar...</div>;
  }

  const phaseColors: Record<string, string> = {
    observe: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    orient: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50',
    decide: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    act: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
    feedback: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            OODA Factory Radar
          </h2>
          <p className="text-sm text-slate-400">Real-time processing cycle metrics</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-mono text-emerald-400">{status.cycle_time_ms}ms</div>
          <div className="text-xs text-slate-500">Total Cycle Time</div>
        </div>
      </div>
      
      {error && (
        <div className="text-xs text-amber-500 bg-amber-500/10 p-2 rounded border border-amber-500/20">
          {error}
        </div>
      )}

      {status.alerts.length > 0 && (
        <div className="text-sm text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
          <span className="font-semibold">Alert: </span>
          {status.alerts.join(', ')}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
        {(Object.entries(status.phases) as [string, OodaPhase][]).map(([phase, data]) => {
          const colorClass = phaseColors[phase.toLowerCase()] || 'bg-slate-800 text-slate-300 border-slate-700';
          
          return (
            <div key={phase} className={`flex flex-col gap-2 p-3 rounded-lg border ${colorClass}`}>
              <div className="text-xs uppercase font-bold tracking-wider">{phase}</div>
              <div className="flex flex-col mt-auto">
                <span className="text-xl font-mono font-medium">{Math.round(data.latency_ms)}ms</span>
                <span className="text-[10px] opacity-70">Health: {(data.health * 100).toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-2 text-[10px] text-slate-600 font-mono text-right">
        Last updated: {new Date(status.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}
