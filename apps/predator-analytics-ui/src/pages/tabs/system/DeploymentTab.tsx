import React, { Suspense, lazy } from 'react';
const DeploymentView = lazy(() => import('@/features/platform/DeploymentView'));

export const DeploymentTab = () => (
  <Suspense fallback={<div className="p-8 text-slate-400">Статус розгортання...</div>}>
    <DeploymentView />
  </Suspense>
);
