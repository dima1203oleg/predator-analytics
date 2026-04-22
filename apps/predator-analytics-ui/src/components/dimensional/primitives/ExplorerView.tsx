import React from 'react';

interface ExplorerViewProps {
  children: React.ReactNode;
}

export const ExplorerView: React.FC<ExplorerViewProps> = ({ children }) => {
  return (
    <div className="w-full h-full min-h-[400px] relative overflow-hidden rounded-[3rem] border border-white/5 shadow-2xl">
      {/* Cinematic Background Layers */}
      <div className="absolute inset-0 bg-slate-950" />
      <div className="absolute inset-0 cyber-scan-grid opacity-[0.05]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]" />
      
      {/* Dynamic HUD Lines */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      <div className="absolute top-0 left-10 w-px h-full bg-gradient-to-b from-transparent via-blue-500/10 to-transparent" />
      <div className="absolute top-0 right-10 w-px h-full bg-gradient-to-b from-transparent via-blue-500/10 to-transparent" />

      <div className="relative z-10 w-full h-full p-8">
        {children}
      </div>
    </div>
  );
};
