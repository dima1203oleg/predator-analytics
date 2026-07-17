import React, { Suspense, lazy } from 'react';
const SettingsView = lazy(() => import('@/features/platform/SettingsView'));

export const SettingsTab = () => (
  <Suspense fallback={<div className="p-8 text-slate-400">Завантаження конфігурації...</div>}>
    <SettingsView />
  </Suspense>
);
