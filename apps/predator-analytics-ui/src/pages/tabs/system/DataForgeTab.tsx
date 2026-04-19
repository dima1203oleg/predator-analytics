import React, { Suspense, lazy } from 'react';
const DataIngestionHub = lazy(() => import('@/features/platform/DataIngestionHub'));

export const DataForgeTab = () => (
  <Suspense fallback={<div className="p-8 text-slate-400">Підготовка Кузні Даних...</div>}>
    <DataIngestionHub />
  </Suspense>
);
