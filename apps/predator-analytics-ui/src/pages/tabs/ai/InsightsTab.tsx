import React, { Suspense, lazy } from 'react';
import { BrandLoaderFallback } from '@/components/polish/BrandLoader';
const AIInsightsHub = lazy(() => import('@/features/ai/AIInsightsHub'));

export const InsightsTab = () => (
  <Suspense fallback={<BrandLoaderFallback text="ІНСАЙТИ" subtext="ВИЛУЧЕННЯ ІНСАЙТІВ" />}>
    <AIInsightsHub />
  </Suspense>
);
