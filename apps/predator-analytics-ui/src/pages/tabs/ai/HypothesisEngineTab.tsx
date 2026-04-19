import React, { Suspense, lazy } from 'react';
const HypothesisEngineView = lazy(() => import('@/features/ai/HypothesisEngineView'));

export const HypothesisEngineTab = () => (
  <Suspense fallback={<div className="p-8 text-slate-400">Генерація гіпотез...</div>}>
    <HypothesisEngineView />
  </Suspense>
);
