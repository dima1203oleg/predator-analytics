import React, { Suspense, lazy } from 'react';
const PredictiveNexusView = lazy(() => import('@/features/ai/PredictiveNexusView'));

export const PredictiveNexusTab = () => (
  <Suspense fallback={<div className="p-8 text-slate-400">Завантаження прогнозів...</div>}>
    <PredictiveNexusView />
  </Suspense>
);
