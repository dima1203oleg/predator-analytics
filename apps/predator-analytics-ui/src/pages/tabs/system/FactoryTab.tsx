import React, { Suspense, lazy } from 'react';
const SystemFactoryView = lazy(() => import('@/features/factory/SystemFactoryView'));

export const FactoryTab = () => (
  <Suspense fallback={<div className="p-8 text-slate-400">Підключення до Фабрики...</div>}>
    <SystemFactoryView />
  </Suspense>
);
