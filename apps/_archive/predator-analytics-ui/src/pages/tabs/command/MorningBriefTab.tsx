import React, { Suspense, lazy } from 'react';
const ExecutiveBriefView = lazy(() => import('@/features/dashboard/ExecutiveBriefView'));

export const MorningBriefTab = () => (
  <Suspense fallback={<div className="p-8 text-slate-400">Підготовка ранкового брифінгу...</div>}>
    <ExecutiveBriefView />
  </Suspense>
);
