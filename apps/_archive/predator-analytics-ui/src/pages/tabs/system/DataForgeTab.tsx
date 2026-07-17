import React, { Suspense, lazy } from 'react';
import { BrandLoaderFallback } from '@/components/polish/BrandLoader';
const DataIngestionHub = lazy(() => import('@/features/platform/DataIngestionHub'));

export const DataForgeTab = () => (
  <Suspense fallback={<BrandLoaderFallback text="КУЗНЯ" subtext="ПІДГОТОВКА КУЗНІ ДАНИХ" />}>
    <DataIngestionHub />
  </Suspense>
);
