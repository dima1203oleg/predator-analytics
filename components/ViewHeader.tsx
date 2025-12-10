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
    <div className={`flex flex-col gap-4 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/80 p-4 md:p-5 rounded-xl border border-slate-700/50 backdrop-blur-xl shadow-lg animate-in fade-in slide-in-from-top-2 relative overflow-hidden ${className}`}>
      {/* Subtle animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-transparent to-purple-500/5 opacity-50 pointer-events-none"></div>

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary-500/50 to-transparent"></div>

      {/* Top Row: Breadcrumbs & Actions */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 relative z-10">

        {/* Title Area */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-600/50 shadow-[inset_0_0_15px_rgba(0,0,0,0.6),0_0_15px_rgba(6,182,212,0.15)] text-primary-400 shrink-0 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-shadow">
            {icon}
          </div>
          <div className="min-w-0">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 flex-wrap">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <span className={idx === breadcrumbs.length - 1 ? 'text-primary-400 font-bold text-glow' : 'hover:text-slate-200 transition-colors cursor-default'}>
                    {crumb}
                  </span>
                  {idx < breadcrumbs.length - 1 && <ChevronRight size={10} className="text-slate-600 shrink-0" />}
                </React.Fragment>
              ))}
            </div>
            <h2 className="text-lg md:text-xl font-bold text-slate-50 leading-none truncate text-shadow">{title}</h2>
          </div>
        </div>

        {/* Actions & Stats */}
        <div className="flex flex-wrap items-center gap-3 justify-start lg:justify-end">
          {stats?.map((stat, idx) => (
            <div key={idx} className="flex items-center gap-2.5 bg-slate-950/80 px-3.5 py-2 rounded-lg border border-slate-700/60 shadow-md grow sm:grow-0 backdrop-blur-sm hover:border-slate-600 transition-colors">
              {stat.icon && (
                <span className={`${stat.animate ? 'animate-pulse glow-pulse' : ''
                  } ${stat.color === 'success' ? 'text-success-400' :
                    stat.color === 'warning' ? 'text-yellow-400' :
                      stat.color === 'danger' ? 'text-danger-400' :
                        stat.color === 'primary' ? 'text-primary-400' : 'text-slate-400'
                  }`}>
                  {stat.icon}
                </span>
              )}
              <div className="flex flex-col items-end leading-tight ml-auto sm:ml-0">
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">{stat.label}</span>
                <span className={`text-xs font-mono font-bold ${stat.color === 'success' ? 'text-success-400 text-glow-green' :
                    stat.color === 'warning' ? 'text-yellow-400 text-glow-amber' :
                      stat.color === 'danger' ? 'text-danger-400 text-glow-red' :
                        stat.color === 'primary' ? 'text-primary-400 text-glow' : 'text-slate-200'
                  }`}>{stat.value}</span>
              </div>
            </div>
          ))}

          {actions && (
            <>
              <div className="h-8 w-[1px] bg-slate-700 mx-1 hidden lg:block"></div>
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