/**
 * SimulationRoom — Обгортка над ScenarioSimulationEngine
 * Кімната моделювання сценаріїв "що буде якщо"
 */
import React, { Suspense, lazy } from 'react';
import { RoomShell } from '../ui/RoomShell';

const ScenarioSimulationEngine = lazy(() =>
  import('../../features/modeling/ScenarioSimulationEngine').then(m => ({ default: m.ScenarioSimulationEngine }))
);

export const SimulationRoom: React.FC = () => (
  <RoomShell roomId="simulation">
    <Suspense fallback={<RoomLoader label="Симуляційний Двигун" />}>
      <ScenarioSimulationEngine />
    </Suspense>
  </RoomShell>
);

function RoomLoader({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3" />
        <div className="text-xs font-mono text-slate-500 tracking-wider">{label}</div>
      </div>
    </div>
  );
}
