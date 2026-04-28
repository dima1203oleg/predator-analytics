import React, { Suspense, lazy } from 'react';
const PortfolioRiskView = lazy(() => import('@/features/dashboard/PortfolioRiskView'));

export const PortfolioRiskTab = () => (
  <Suspense fallback={<div className="p-8 text-slate-400">Аналізризиків портфелю...</div>}>
    <PortfolioRiskView />
  </Suspense>
);
