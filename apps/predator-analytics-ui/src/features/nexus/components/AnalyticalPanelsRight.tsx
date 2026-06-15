import React from 'react';
import { MissionHeatmap } from './charts/MissionHeatmap';
import { AnomalyChart } from './charts/AnomalyChart';
import { SectorTreemap } from './charts/SectorTreemap';

export const AnalyticalPanelsRight = () => {
  return (
    <div className="flex flex-col gap-6">
      
      {/* Mission 1 */}
      <div className="bg-black/50 border border-emerald-500/20 p-4 rounded-lg">
        <h3 className="text-xs text-emerald-400 font-bold tracking-widest mb-2">MICCION 1</h3>
        <p className="text-[10px] text-emerald-500/70 mb-2 leading-relaxed">
          Оверв'ю контрагента "Х". Цільова аналітика транзакцій...
        </p>
        <MissionHeatmap />
      </div>

      {/* Map of Ukraine */}
      <div className="bg-black/50 border border-emerald-500/20 p-4 rounded-lg">
        <h3 className="text-xs text-emerald-400 font-bold tracking-widest mb-2">КАРТА РИЗИКІВ САНКЦІЙ РНБО</h3>
        <div className="h-32 w-full bg-[url('https://upload.wikimedia.org/wikipedia/commons/d/d4/Ukraine_map.svg')] bg-contain bg-center bg-no-repeat opacity-50 filter sepia hue-rotate-180 brightness-75 contrast-125 saturate-200">
          {/* Overlay dots for risk */}
          <div className="w-2 h-2 bg-red-500 rounded-full absolute mt-12 ml-16 animate-ping" />
          <div className="w-2 h-2 bg-red-500 rounded-full absolute mt-16 ml-32 animate-pulse" />
        </div>
      </div>

      {/* Charts */}
      <div className="bg-black/50 border border-emerald-500/20 p-4 rounded-lg">
        <h3 className="text-xs text-emerald-400 font-bold tracking-widest mb-2">ПРЕДИКТИВНИЙ АНАЛІЗ АНОМАЛІЙ</h3>
        <AnomalyChart />
      </div>

      {/* Sector Heatmap / Treemap */}
      <div className="bg-black/50 border border-emerald-500/20 p-4 rounded-lg">
        <h3 className="text-xs text-emerald-400 font-bold tracking-widest mb-2">SECTOR HEATMAP</h3>
        <SectorTreemap />
      </div>

    </div>
  );
};
