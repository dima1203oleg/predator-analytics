import React, { Suspense, lazy } from 'react';
const AgentsView = lazy(() => import('@/features/platform/AgentsView'));

export const AgentsTab = () => (
  <Suspense fallback={<div className="p-8 text-slate-400">Синхронізація агентів...</div>}>
    <AgentsView />
  </Suspense>
);
