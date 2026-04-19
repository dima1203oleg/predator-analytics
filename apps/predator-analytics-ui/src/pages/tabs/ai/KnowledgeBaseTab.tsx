import React, { Suspense, lazy } from 'react';
const KnowledgeEngineeringView = lazy(() => import('@/features/ai/KnowledgeEngineeringView'));

export const KnowledgeBaseTab = () => (
  <Suspense fallback={<div className="p-8 text-slate-400">Доступ до бази знань...</div>}>
    <KnowledgeEngineeringView />
  </Suspense>
);
