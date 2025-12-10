
import React from 'react';

interface TacticalCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  glow?: 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'none';
  noPadding?: boolean;
}

export const TacticalCard: React.FC<TacticalCardProps> = ({
  title,
  children,
  className = '',
  action,
  glow = 'none',
  noPadding = false
}) => {

  const getGlowClass = () => {
    switch (glow) {
      case 'blue': return 'hover:shadow-[0_0_30px_rgba(59,130,246,0.35)] hover:border-blue-400/60';
      case 'red': return 'hover:shadow-[0_0_30px_rgba(239,68,68,0.35)] hover:border-red-400/60';
      case 'green': return 'hover:shadow-[0_0_30px_rgba(34,197,94,0.35)] hover:border-success-400/60';
      case 'purple': return 'hover:shadow-[0_0_30px_rgba(168,85,247,0.35)] hover:border-purple-400/60';
      case 'yellow': return 'hover:shadow-[0_0_30px_rgba(234,179,8,0.35)] hover:border-yellow-400/60';
      default: return 'hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] hover:border-primary-400/40';
    }
  };

  const getActiveGlow = () => {
    switch (glow) {
      case 'blue': return 'shadow-[0_0_15px_rgba(59,130,246,0.15)]';
      case 'red': return 'shadow-[0_0_15px_rgba(239,68,68,0.15)]';
      case 'green': return 'shadow-[0_0_15px_rgba(34,197,94,0.15)]';
      case 'purple': return 'shadow-[0_0_15px_rgba(168,85,247,0.15)]';
      case 'yellow': return 'shadow-[0_0_15px_rgba(234,179,8,0.15)]';
      default: return '';
    }
  };

  // Base class now includes panel-3d logic directly to ensure consistency if not passed
  const baseClass = className.includes('panel-3d') ? '' : 'panel-3d';

  return (
    <div className={`flex flex-col transition-all duration-300 group relative ${getGlowClass()} ${getActiveGlow()} ${baseClass} ${className}`}>

      {/* Animated Border Gradient on Hover */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/0 via-primary-500/10 to-primary-500/0 animate-pulse"></div>
      </div>

      {/* HUD Corner Decorators - Enhanced with Animation */}
      <div className="absolute -top-[1px] -left-[1px] w-5 h-5 border-t-2 border-l-2 border-slate-500 rounded-tl-lg group-hover:border-primary-400 group-hover:w-6 group-hover:h-6 transition-all duration-300 z-10"></div>
      <div className="absolute -top-[1px] -right-[1px] w-5 h-5 border-t-2 border-r-2 border-slate-500 rounded-tr-lg group-hover:border-primary-400 group-hover:w-6 group-hover:h-6 transition-all duration-300 z-10"></div>
      <div className="absolute -bottom-[1px] -left-[1px] w-5 h-5 border-b-2 border-l-2 border-slate-500 rounded-bl-lg group-hover:border-primary-400 group-hover:w-6 group-hover:h-6 transition-all duration-300 z-10"></div>
      <div className="absolute -bottom-[1px] -right-[1px] w-5 h-5 border-b-2 border-r-2 border-slate-500 rounded-br-lg group-hover:border-primary-400 group-hover:w-6 group-hover:h-6 transition-all duration-300 z-10"></div>

      {title && (
        <div className="px-5 py-4 border-b border-slate-700/60 flex justify-between items-center bg-gradient-to-r from-slate-900/80 via-slate-900/50 to-slate-900/80 rounded-t-xl relative backdrop-blur-sm">
          {/* Active Indicator Line with Animation */}
          <div className={`absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full ${glow === 'red' ? 'bg-red-500' :
            glow === 'purple' ? 'bg-purple-500' :
              glow === 'green' ? 'bg-green-500' :
                glow === 'yellow' ? 'bg-yellow-500' :
                  'bg-primary-500'
            } shadow-[0_0_12px_currentColor] group-hover:shadow-[0_0_18px_currentColor] transition-shadow duration-300`}></div>

          <h3 className="text-sm font-bold text-slate-50 uppercase tracking-widest font-display flex items-center gap-3 pl-4 text-shadow">
            {title}
          </h3>
          {action && <div className="flex items-center">{action}</div>}
        </div>
      )}

      <div className={`${noPadding ? 'p-0' : 'p-5'} flex-1 relative z-10`}>
        {children}
      </div>
    </div>
  );
};
