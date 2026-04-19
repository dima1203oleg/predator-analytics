import React from 'react';
import { OsintGraphExplorer } from '@/components/osint/OsintGraphExplorer';

export const GraphExplorerTab: React.FC = () => {
  return (
    <div className="h-full bg-slate-950 overflow-hidden rounded-2xl border border-white/5 shadow-2xl">
      <OsintGraphExplorer />
    </div>
  );
};

export default GraphExplorerTab;
