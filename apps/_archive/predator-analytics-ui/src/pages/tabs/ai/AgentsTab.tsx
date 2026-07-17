import React, { Suspense, lazy } from 'react';
import { BrandLoaderFallback } from '@/components/polish/BrandLoader';
const AgentsView = lazy(() => import('@/features/platform/AgentsView'));

export const AgentsTab = () => (
  <Suspense fallback={<BrandLoaderFallback text="АГЕНТИ" subtext="СИНХРОНІЗАЦІЯ АГЕНТІВ" />}>
    <AgentsView />
  </Suspense>
);
