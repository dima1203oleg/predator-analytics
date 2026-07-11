/**
 * GraphIntelRoom — Обгортка над GraphAnalyticsPage
 * Мережевий аналіз: зв'язки, кластери, аномалії
 */
import React, { Suspense, lazy } from 'react';
import { RoomShell } from '../ui/RoomShell';

const GraphAnalyticsPage = lazy(() =>
  import('../../pages/GraphAnalyticsPage').then(m => ({ default: m.default }))
);

export const GraphIntelRoom: React.FC = () => (
  <RoomShell roomId="graph">
    <Suspense fallback={<RoomLoader label="Граф Зв'язків" />}>
      <GraphAnalyticsPage />
    </Suspense>
  </RoomShell>
);

function RoomLoader({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mx-auto mb-3" />
        <div className="text-xs font-mono text-slate-500 tracking-wider">{label}</div>
      </div>
    </div>
  );
}
