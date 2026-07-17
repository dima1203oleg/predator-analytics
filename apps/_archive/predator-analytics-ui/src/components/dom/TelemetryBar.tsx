import React from 'react';
import { useTelemetryStore } from '../../core/state/telemetry.store';

export const TelemetryBar: React.FC = () => {
  const metrics = useTelemetryStore((state) => state.metrics);

  const renderMetric = (label: string, value: number, unit: string, isWarning: boolean = false) => (
    <div className="flex items-center gap-2 text-xs font-mono">
      <span className="text-gray-500">{label}:</span>
      <span className={`${isWarning ? 'text-amber-400' : 'text-teal-400'}`}>
        {value.toFixed(1)}{unit}
      </span>
    </div>
  );

  return (
    <div className="absolute bottom-0 left-0 right-0 h-10 bg-black/80 backdrop-blur-xl border-t border-gray-800 flex items-center justify-between px-4 pointer-events-auto">
      <div className="flex items-center gap-6">
        {renderMetric('GPU', metrics.gpu, '%', metrics.gpu > 80)}
        {renderMetric('MEM', metrics.memory, 'GB', metrics.memory > 6)}
        {renderMetric('LATENCY', metrics.networkLatency, 'ms')}
      </div>
      
      <div className="flex items-center gap-2 text-xs font-mono">
        <span className="text-gray-500">AGENTS:</span>
        <span className="text-emerald-400 font-bold">{metrics.activeAgents}</span>
      </div>
    </div>
  );
};
