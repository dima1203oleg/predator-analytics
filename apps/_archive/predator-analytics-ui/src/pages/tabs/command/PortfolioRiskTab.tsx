import React, { Suspense, lazy } from 'react';
import { BrandLoaderFallback } from '@/components/polish/BrandLoader';
const PortfolioRiskView = lazy(() => import('@/features/dashboard/PortfolioRiskView'));

export const PortfolioRiskTab = () => (
  <Suspense fallback={<BrandLoaderFallback text="ПОРТФЕЛЬ" subtext="АНАЛІЗ РИЗИКІВ ПОРТФЕЛЮ" />}>
    <PortfolioRiskView />
  </Suspense>
);
