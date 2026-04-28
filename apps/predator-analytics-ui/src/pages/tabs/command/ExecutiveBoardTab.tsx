import React, { Suspense, lazy } from 'react';

const ExecutiveBoardView = lazy(() => import('@/features/dashboard/ExecutiveBoardView'));

export const ExecutiveBoardTab = () => (
  <Suspense fallback={
    <div className="flex items-center justify-center p-12 text-slate-400 font-mono text-xs tracking-widest animate-pulse italic">
      ІНІЦІАЛІЗАЦІЯ ВИКОНАВЧОЇ  АДИ...
    </div>
  }>
    <ExecutiveBoardView />
  </Suspense>
);

