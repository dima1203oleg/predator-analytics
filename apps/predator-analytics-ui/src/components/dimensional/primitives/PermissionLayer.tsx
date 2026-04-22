import React from 'react';
import { Lock } from 'lucide-react';

interface PermissionLayerProps {
  children: React.ReactNode;
  sensitivity?: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET' | 'CLASSIFIED';
  fallback?: React.ReactNode;
}

import { cn } from '../../../lib/utils';

export const PermissionLayer: React.FC<PermissionLayerProps> = ({
  children,
  sensitivity = 'PUBLIC',
  fallback
}) => {
  // Mock permission check - in real app connect to user context
  const hasAccess = true; // Always true for now for demo

  if (!hasAccess) {
    return fallback ? <>{fallback}</> : (
      <div className="flex flex-col items-center justify-center p-12 border border-dashed border-red-500/20 rounded-[2rem] bg-red-500/5 backdrop-blur-md relative overflow-hidden group">
        <div className="absolute inset-0 cyber-scan-grid opacity-[0.05]" />
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6 shadow-lg shadow-red-500/20 group-hover:scale-110 transition-transform">
          <Lock className="w-8 h-8 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
        </div>
        <p className="text-sm text-red-500 font-black italic tracking-[0.2em] uppercase mb-1">RESTRICTED_ACCESS</p>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] italic">Classification: {sensitivity}</p>
        <div className="mt-6 px-6 py-2 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg cursor-pointer hover:bg-red-600 transition-colors">
          REQUEST ACCESS
        </div>
      </div>
    );
  }

  return (
    <div className="relative group/layer">
       {children}
       {sensitivity !== 'PUBLIC' && (
         <div className="absolute -top-2 -right-2 px-3 py-1 bg-black/80 backdrop-blur-xl rounded-xl border border-white/10 opacity-0 group-hover/layer:opacity-100 transition-all transform translate-y-2 group-hover/layer:translate-y-0 pointer-events-none shadow-2xl z-50">
            <div className="flex items-center gap-2">
               <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", getBgForSensitivity(sensitivity))} />
               <span className={cn("text-[9px] font-black tracking-[0.2em] italic uppercase", getColorForSensitivity(sensitivity))}>
                  {sensitivity}
               </span>
            </div>
         </div>
       )}
    </div>
  );
};

function getColorForSensitivity(sensitivity: string) {
  switch (sensitivity) {
    case 'TOP_SECRET': return 'text-red-400';
    case 'SECRET': return 'text-orange-400';
    case 'CONFIDENTIAL': return 'text-yellow-400';
    case 'CLASSIFIED': return 'text-purple-400';
    default: return 'text-slate-400';
  }
}

function getBgForSensitivity(sensitivity: string) {
  switch (sensitivity) {
    case 'TOP_SECRET': return 'bg-red-500';
    case 'SECRET': return 'bg-orange-500';
    case 'CONFIDENTIAL': return 'bg-yellow-500';
    case 'CLASSIFIED': return 'bg-purple-500';
    default: return 'bg-slate-500';
  }
}
