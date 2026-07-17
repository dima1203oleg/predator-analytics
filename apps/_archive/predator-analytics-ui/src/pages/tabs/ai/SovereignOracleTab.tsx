import React, { Suspense, lazy } from 'react';
const SovereignIntelHub = lazy(() => import('@/features/ai/SovereignIntelHub'));

export const SovereignOracleTab = () => (
  <Suspense fallback={<div className="p-8 text-slate-400">Звернення до Оракула...</div>}>
    <SovereignIntelHub />
  </Suspense>
);
