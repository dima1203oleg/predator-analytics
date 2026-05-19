import React, { Suspense, lazy } from 'react';
import { BrandLoaderFallback } from '@/components/polish/BrandLoader';
const DeploymentView = lazy(() => import('@/features/platform/DeploymentView'));

export const DeploymentTab = () => (
  <Suspense fallback={<BrandLoaderFallback text="ДЕПЛОЙ" subtext="СТАТУС РОЗГОРТАННЯ" />}>
    <DeploymentView />
  </Suspense>
);
