import React, { Suspense, lazy } from 'react';
import { BrandLoaderFallback } from '@/components/polish/BrandLoader';
const SystemFactoryView = lazy(() => import('@/features/factory/SystemFactoryView'));

export const FactoryTab = () => (
  <Suspense fallback={<BrandLoaderFallback text="ФАБРИКА" subtext="ПІДКЛЮЧЕННЯ ДО ФАБРИКИ" />}>
    <SystemFactoryView />
  </Suspense>
);
