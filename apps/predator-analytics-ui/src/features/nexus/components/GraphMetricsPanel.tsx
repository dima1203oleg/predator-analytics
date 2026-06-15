import React from 'react';
import { SciFiPanel } from './SciFiPanel';

export const GraphMetricsPanel = () => {
  return (
    <SciFiPanel title="МЕТРИКИ ГРАФА">
      <div className="flex flex-col gap-3">
        {/* Node Types */}
        <div className="flex justify-between items-center bg-black/40 p-2 rounded border border-emerald-500/10">
          <span className="text-xs text-emerald-500/70">Вузли (Компанії)</span>
          <span className="text-sm text-emerald-400 font-mono font-bold">142</span>
        </div>
        <div className="flex justify-between items-center bg-black/40 p-2 rounded border border-emerald-500/10">
          <span className="text-xs text-emerald-500/70">Зв'язки (Ребра)</span>
          <span className="text-sm text-emerald-400 font-mono font-bold">856</span>
        </div>
        
        {/* Vector DB Metrics */}
        <div className="mt-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-emerald-500/70">Qdrant Vector Depth</span>
            <span className="text-xs text-emerald-400 font-mono">384-D</span>
          </div>
          <div className="w-full bg-black/60 h-1.5 rounded overflow-hidden">
            <div className="bg-emerald-500 w-[85%] h-full"></div>
          </div>
        </div>

        {/* Semantic Search Confidence */}
        <div className="mt-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-emerald-500/70">Semantic Precision</span>
            <span className="text-xs text-emerald-400 font-mono">92.4%</span>
          </div>
          <div className="w-full bg-black/60 h-1.5 rounded overflow-hidden">
            <div className="bg-emerald-400 w-[92%] h-full"></div>
          </div>
        </div>
      </div>
    </SciFiPanel>
  );
};
