import React, { Suspense, lazy } from 'react';
import { BrandLoaderFallback } from '@/components/polish/BrandLoader';
const MonitoringView = lazy(() => import('@/features/dashboard/MonitoringView'));

export const MonitoringTab = () => (
  <Suspense fallback={<BrandLoaderFallback text="МЕТРИКИ" subtext="ЗЧИТУВАННЯ МЕТРИК" />}>
    <MonitoringView />
  </Suspense>
);
