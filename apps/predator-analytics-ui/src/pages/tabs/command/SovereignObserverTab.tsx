import React, { Suspense, lazy } from 'react';
const SovereignObserverView = lazy(() => import('@/features/dashboard/SovereignObserverView'));

export const SovereignObserverTab = () => (
  <Suspense fallback={<div className="p-8 text-slate-400">Підключення до об'єктиву спостереження...</div>}>
    <SovereignObserverView />
  </Suspense>
);
