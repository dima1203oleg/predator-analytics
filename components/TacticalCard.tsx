
import React from 'react';

interface TacticalCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  glow?: 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'none';
}

export const TacticalCard: React.FC<TacticalCardProps> = ({ 
  title, 
  children, 
  className = '', 
  action,
  glow = 'none'
}) => {
  
  const getGlowClass = () => {
    switch(glow) {
      case 'blue': return 'hover:shadow-[0_0_25px_rgba(59,130,246,0.25)] hover:border-blue-500/50';
      case 'red': return 'hover:shadow-[0_0_25px_rgba(239,68,68,0.25)] hover:border-red-500/50';
      case 'green': return 'hover:shadow-[0_0_25px_rgba(34,197,94,0.25)] hover:border-success-500/50';
      case 'purple': return 'hover:shadow-[0_0_25px_rgba(168,85,247,0.25)] hover:border-purple-500/50';
      case 'yellow': return 'hover:shadow-[0_0_25px_rgba(234,179,8,0.25)] hover:border-yellow-500/50';
      default: return 'hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:border-primary-500/30';
    }
  };

  // Base class now includes panel-3d logic directly to ensure consistency if not passed
  const baseClass = className.includes('panel-3d') ? '' : 'panel-3d';

  return (
    <div className={`flex flex-col transition-all duration-500 group ${getGlowClass()} ${baseClass} ${className}`}>
      
      {/* HUD Corner Decorators - Enhanced */}
      <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t-2 border-l-2 border-slate-600 rounded-tl group-hover:border-primary-400 transition-colors z-10"></div>
      <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t-2 border-r-2 border-slate-600 rounded-tr group-hover:border-primary-400 transition-colors z-10"></div>
      <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b-2 border-l-2 border-slate-600 rounded-bl group-hover:border-primary-400 transition-colors z-10"></div>
      <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b-2 border-r-2 border-slate-600 rounded-br group-hover:border-primary-400 transition-colors z-10"></div>

      {title && (
        <div className="px-5 py-4 border-b border-slate-800/50 flex justify-between items-center bg-slate-950/30 rounded-t-xl relative">
          {/* Active Indicator Line */}
          <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r ${
              glow === 'red' ? 'bg-red-500' : 
              glow === 'purple' ? 'bg-purple-500' : 
              glow === 'green' ? 'bg-green-500' : 
              glow === 'yellow' ? 'bg-yellow-500' : 
              'bg-primary-500'
          } shadow-[0_0_8px_currentColor]`}></div>

          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest font-display flex items-center gap-3 pl-3 text-shadow">
            {title}
          </h3>
          {action && <div className="flex items-center">{action}</div>}
        </div>
      )}
      
      <div className="p-5 flex-1 relative z-10">
        {children}
      </div>
    </div>
  );
};
