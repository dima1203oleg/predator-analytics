import React, { Suspense, lazy } from 'react';
const SecurityView = lazy(() => import('@/features/platform/SecurityView'));

export const SecurityTab = () => (
  <Suspense fallback={<div className="p-8 text-slate-400">Перевірка периметру безпеки...</div>}>
    <SecurityView />
  </Suspense>
);
