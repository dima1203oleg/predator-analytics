import React, { Suspense, lazy } from 'react';
const MonitoringView = lazy(() => import('@/features/dashboard/MonitoringView'));

export const MonitoringTab = () => (
  <Suspense fallback={<div className="p-8 text-slate-400">Зчитування метрик...</div>}>
    <MonitoringView />
  </Suspense>
);
