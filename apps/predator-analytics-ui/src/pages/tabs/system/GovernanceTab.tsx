import React, { Suspense, lazy } from 'react';
const SovereignGovernanceDashboard = lazy(() => import('@/components/super/SovereignGovernanceDashboard'));

export const GovernanceTab = () => (
  <Suspense fallback={<div className="p-8 text-slate-400">Система управління (G&C)...</div>}>
    <SovereignGovernanceDashboard />
  </Suspense>
);
