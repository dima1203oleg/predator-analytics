import React, { Suspense, lazy } from 'react';
const PredatorV24 = lazy(() => import('@/pages/PredatorV24'));

export const ExecutiveBoardTab = () => (
  <Suspense fallback={<div className="p-8 text-slate-400">Ініціалізація Командного Центру...</div>}>
    <PredatorV24 />
  </Suspense>
);
