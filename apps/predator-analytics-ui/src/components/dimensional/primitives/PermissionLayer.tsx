import React from 'react';
import { Lock, ShieldAlert, ShieldCheck, EyeOff, AlertTriangle } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface PermissionLayerProps {
  children: React.ReactNode;
  sensitivity?: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET' | 'CLASSIFIED';
  fallback?: React.ReactNode;
}

/**
 * 🔒 PERMISSION LAYER // ША  ДОСТУПУ | v61.0-ELITE
 * PREDATOR Analytics — Dimensional Access Control
 */
export const PermissionLayer: React.FC<PermissionLayerProps> = ({
  children,
  sensitivity = 'PUBLIC',
  fallback
}) => {
  // Truth Protocol: Мок перевірки прав (у реальному додатку підключити до AuthContext)
  const hasAccess = true; 

  if (!hasAccess) {
    return fallback ? <>{fallback}</> : (
      <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-rose-500/30 rounded-[3rem] bg-rose-500/5 backdrop-blur-3xl relative overflow-hidden group shadow-[inset_0_0_50px_rgba(225,29,72,0.1)]">
        <div className="absolute inset-0 bg-cyber-grid opacity-[0.05]" />
        
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-rose-500 blur-2xl opacity-20 animate-pulse" />
          <div className="relative w-20 h-20 rounded-[1.5rem] bg-rose-600/20 border-2 border-rose-500 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-700">
            <Lock className="w-10 h-10 text-rose-500 drop-shadow-[0_0_12px_rgba(225,29,72,0.8)]" />
          </div>
        </div>
        
        <div className="text-center space-y-3 relative z-10">
          <p className="text-xl font-black text-rose-500 italic tracking-[0.2em] uppercase leading-none chromate-elite">ДОСТУП_ОБМЕЖЕНО</p>
          <div className="flex items-center justify-center gap-3">
             <div className="h-px w-8 bg-rose-500/30" />
             <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] italic">Класифікація: {sensitivity}</p>
             <div className="h-px w-8 bg-rose-500/30" />
          </div>
        </div>

        <button className="mt-10 px-10 py-4 bg-rose-600 text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-xl hover:bg-rose-700 transition-all shadow-[0_0_30px_rgba(225,29,72,0.4)] italic">
          ЗАПИТАТИ ДОСТУП
        </button>
        
        {/* Security Scan Effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500/50 to-transparent animate-scan" />
      </div>
    );
  }

  return (
    <div className="relative group/layer">
       {children}
       {sensitivity !== 'PUBLIC' && (
         <div className="absolute -top-3 -right-3 px-4 py-1.5 bg-black/90 backdrop-blur-2xl rounded-xl border-2 border-white/10 opacity-0 group-hover/layer:opacity-100 transition-all transform translate-y-2 group-hover/layer:translate-y-0 pointer-events-none shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50">
            <div className="flex items-center gap-3">
               <div className={cn("w-2 h-2 rounded-full animate-pulse shadow-[0_0_10px_currentColor]", getBgForSensitivity(sensitivity))} />
               <span className={cn("text-[10px] font-black tracking-[0.2em] italic uppercase", getColorForSensitivity(sensitivity))}>
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
    case 'TOP_SECRET': return 'text-rose-500';
    case 'SECRET': return 'text-orange-500';
    case 'CONFIDENTIAL': return 'text-amber-500';
    case 'CLASSIFIED': return 'text-purple-500';
    default: return 'text-slate-500';
  }
}

function getBgForSensitivity(sensitivity: string) {
  switch (sensitivity) {
    case 'TOP_SECRET': return 'bg-rose-500';
    case 'SECRET': return 'bg-orange-500';
    case 'CONFIDENTIAL': return 'bg-amber-500';
    case 'CLASSIFIED': return 'bg-purple-500';
    default: return 'bg-slate-500';
  }
}

