import React from 'react';
import { Lock } from 'lucide-react';

interface PermissionLayerProps {
  children: React.ReactNode;
  sensitivity?: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET' | 'CLASSIFIED';
  fallback?: React.ReactNode;
}

export const PermissionLayer: React.FC<PermissionLayerProps> = ({
  children,
  sensitivity = 'PUBLIC',
  fallback
}) => {
  // Mock permission check - in real app connect to user context
  const hasAccess = true; // Always true for now for demo

  if (!hasAccess) {
    return fallback ? <>{fallback}</> : (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed border-red-900/50 rounded-xl bg-red-950/10">
        <Lock className="w-8 h-8 text-red-500/50 mb-2" />
        <p className="text-xs text-red-400 font-mono tracking-widest uppercase">RESTRICTED ACCESS</p>
        <p className="text-[10px] text-red-500/50 mt-1">Classification: {sensitivity}</p>
      </div>
    );
  }

  return (
    <div className="relative group">
       {children}
       {sensitivity !== 'PUBLIC' && (
         <div className="absolute top-0 right-0 px-2 py-0.5 bg-black/40 backdrop-blur-sm rounded-bl-lg border-l border-b border-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <span className={`text-[8px] font-black tracking-widest ${getColorForSensitivity(sensitivity)}`}>
               {sensitivity}
            </span>
         </div>
       )}
    </div>
  );
};

function getColorForSensitivity(sensitivity: string) {
  switch (sensitivity) {
    case 'TOP_SECRET': return 'text-red-500';
    case 'SECRET': return 'text-orange-500';
    case 'CONFIDENTIAL': return 'text-yellow-500';
    case 'CLASSIFIED': return 'text-purple-500';
    default: return 'text-slate-500';
  }
}
