import React from 'react';

// Ледаче завантаження важкого компонента
const CustomsIntelligenceView = React.lazy(() => import('@/features/intelligence/CustomsIntelligenceView'));

export const CustomsIntelligenceTab: React.FC = () => {
  return (
    <div className="h-full bg-slate-950/20 backdrop-blur-sm rounded-2xl overflow-hidden p-0">
      <React.Suspense fallback={
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
          <div className="text-cyan-500 font-mono text-xs uppercase tracking-widest animate-pulse">
            Синхронізація з митним вузлом...
          </div>
        </div>
      }>
        <CustomsIntelligenceView />
      </React.Suspense>
    </div>
  );
};

export default CustomsIntelligenceTab;
