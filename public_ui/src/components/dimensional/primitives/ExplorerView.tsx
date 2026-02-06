import React from 'react';

interface ExplorerViewProps {
  children: React.ReactNode;
}

export const ExplorerView: React.FC<ExplorerViewProps> = ({ children }) => {
  return (
    <div className="w-full h-full min-h-[300px] bg-[url('/grid-pattern.svg')] bg-center relative">
       {/* Background Grid Simulation */}
      <div className="absolute inset-0 bg-slate-950 opacity-90" />
      <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:linear-gradient(0deg,transparent,black)]" />

      <div className="relative z-10 w-full h-full p-6">
        {children}
      </div>
    </div>
  );
};
