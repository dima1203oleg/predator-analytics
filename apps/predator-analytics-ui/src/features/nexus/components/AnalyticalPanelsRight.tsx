import React from 'react';
import { MissionHeatmap } from './charts/MissionHeatmap';
import { AnomalyChart } from './charts/AnomalyChart';
import { SectorTreemap } from './charts/SectorTreemap';
import { SciFiPanel } from '../SciFiPanel';

export const AnalyticalPanelsRight = () => {
  return (
    <div className="flex flex-col gap-6">
      
      {/* Mission 1 */}
      <SciFiPanel title="MICCION 1">
        <p className="text-[10px] text-emerald-500/70 mb-2 leading-relaxed">
          Оверв'ю контрагента "Х". Цільова аналітика транзакцій...
        </p>
        <MissionHeatmap />
      </SciFiPanel>

      {/* Map of Ukraine */}
      <SciFiPanel title="КАРТА РИЗИКІВ САНКЦІЙ РНБО">
        <div className="h-32 w-full bg-[url('https://upload.wikimedia.org/wikipedia/commons/d/d4/Ukraine_map.svg')] bg-contain bg-center bg-no-repeat opacity-50 filter sepia hue-rotate-180 brightness-75 contrast-125 saturate-200">
          {/* Overlay dots for risk */}
          <div className="w-2 h-2 bg-red-500 rounded-full absolute mt-12 ml-16 animate-ping" />
          <div className="w-2 h-2 bg-red-500 rounded-full absolute mt-16 ml-32 animate-pulse" />
        </div>
      </SciFiPanel>

      {/* Charts */}
      <SciFiPanel title="ПРЕДИКТИВНИЙ АНАЛІЗ АНОМАЛІЙ">
        <AnomalyChart />
      </SciFiPanel>

      {/* Sector Heatmap / Treemap */}
      <SciFiPanel title="SECTOR HEATMAP">
        <SectorTreemap />
      </SciFiPanel>

    </div>
  );
};
