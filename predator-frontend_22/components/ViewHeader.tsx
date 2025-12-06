import React from 'react';
import { ChevronRight, Activity } from 'lucide-react';

interface ViewHeaderProps {
  title: string;
  icon: React.ReactNode;
  breadcrumbs: string[];
  stats?: {
    label: string;
    value: string;
    icon?: React.ReactNode;
    color?: 'default' | 'success' | 'warning' | 'danger' | 'primary';
    animate?: boolean;
  }[];
  actions?: React.ReactNode;
  className?: string;
}

export const ViewHeader: React.FC<ViewHeaderProps> = ({ 
  title, 
  icon, 
  breadcrumbs, 
  stats, 
  actions,
  className = '' 
}) => {
  return (
    <div className={`flex flex-col gap-4 bg-slate-900/50 p-4 rounded border border-slate-800 backdrop-blur-sm shadow-sm animate-in fade-in slide-in-from-top-2 ${className}`}>
      {/* Top Row: Breadcrumbs & Actions */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
        
        {/* Title Area */}
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-slate-900 rounded border border-slate-700 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] text-primary-500 shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1 flex-wrap">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <span className={idx === breadcrumbs.length - 1 ? 'text-primary-400 font-bold' : 'hover:text-slate-300 transition-colors cursor-default'}>
                    {crumb}
                  </span>
                  {idx < breadcrumbs.length - 1 && <ChevronRight size={10} className="text-slate-600 shrink-0" />}
                </React.Fragment>
              ))}
            </div>
            <h2 className="text-lg md:text-xl font-bold text-slate-100 leading-none truncate">{title}</h2>
          </div>
        </div>

        {/* Actions & Stats */}
        <div className="flex flex-wrap items-center gap-3 justify-start lg:justify-end">
          {stats?.map((stat, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded border border-slate-800 shadow-sm grow sm:grow-0">
              {stat.icon && (
                <span className={`${
                  stat.animate ? 'animate-pulse' : ''
                } ${
                  stat.color === 'success' ? 'text-success-500' :
                  stat.color === 'warning' ? 'text-yellow-500' :
                  stat.color === 'danger' ? 'text-danger-500' :
                  stat.color === 'primary' ? 'text-primary-500' : 'text-slate-400'
                }`}>
                  {stat.icon}
                </span>
              )}
              <div className="flex flex-col items-end leading-tight ml-auto sm:ml-0">
                <span className="text-[9px] text-slate-500 uppercase font-bold">{stat.label}</span>
                <span className={`text-xs font-mono font-bold ${
                   stat.color === 'success' ? 'text-success-400' :
                   stat.color === 'warning' ? 'text-yellow-400' :
                   stat.color === 'danger' ? 'text-danger-400' :
                   stat.color === 'primary' ? 'text-primary-400' : 'text-slate-200'
                }`}>{stat.value}</span>
              </div>
            </div>
          ))}
          
          {actions && (
            <>
              <div className="h-8 w-[1px] bg-slate-800 mx-1 hidden lg:block"></div>
              <div className="w-full sm:w-auto mt-2 sm:mt-0 flex-grow sm:flex-grow-0">
                {actions}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};