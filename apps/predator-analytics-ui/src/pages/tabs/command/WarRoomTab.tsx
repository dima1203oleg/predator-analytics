import React, { Suspense, lazy } from 'react';
const WarRoomView = lazy(() => import('@/features/dashboard/WarRoomView'));

export const WarRoomTab = () => (
  <Suspense fallback={<div className="p-8 text-slate-400">Вхід у Кризовий Штаб...</div>}>
    <WarRoomView />
  </Suspense>
);
