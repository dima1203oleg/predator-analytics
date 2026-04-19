import React, { Suspense, lazy } from 'react';
const AIInsightsHub = lazy(() => import('@/features/ai/AIInsightsHub'));

export const InsightsTab = () => (
  <Suspense fallback={<div className="p-8 text-slate-400">Вилучення інсайтів...</div>}>
    <AIInsightsHub />
  </Suspense>
);
