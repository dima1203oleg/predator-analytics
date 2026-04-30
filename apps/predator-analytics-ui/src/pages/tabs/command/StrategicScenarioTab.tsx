import React, { Suspense, lazy } from 'react';

const StrategicScenarioView = lazy(() => import('@/features/dashboard/StrategicScenarioView'));

export const StrategicScenarioTab = () => (
  <Suspense fallback={
    <div className="flex items-center justify-center p-12 text-slate-400 font-mono text-xs tracking-widest animate-pulse italic">
      ІНІЦІАЛІЗАЦІЯ СТ АТЕГІЧНОГО СЦЕНА ІЮ...
    </div>
  }>
    <StrategicScenarioView />
  </Suspense>
);
