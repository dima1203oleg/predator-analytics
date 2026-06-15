import { MissionHeatmap } from './charts/MissionHeatmap';
import { AnomalyChart } from './charts/AnomalyChart';
import { SectorTreemap } from './charts/SectorTreemap';
import { UkraineRiskMap } from './charts/UkraineRiskMap';
import { SciFiPanel } from "./SciFiPanel";

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
        <UkraineRiskMap />
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
