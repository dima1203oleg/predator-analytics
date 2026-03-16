
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface ViewHeaderProps {
  title: string | React.ReactNode;
  icon?: React.ReactNode;
  breadcrumbs: string[];
  stats?: {
    label: string;
    value: string;
    icon?: React.ReactNode;
    color?: 'default' | 'success' | 'warning' | 'danger' | 'primary' | 'purple' | 'secondary' | 'cyan';
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
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`
        flex flex-col gap-4
        glass-ultra
        p-5 rounded-xl border border-slate-800/60 shadow-lg
        ${className}
      `}
    >
      {/* Top Row: Breadcrumbs & Actions */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">

        {/* Title Area */}
        <div className="flex items-start gap-4">
          {icon && (
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="p-3 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700/50 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] text-primary-500 shrink-0 relative  group"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              {icon}
            </motion.div>
          )}

          <div className="min-w-0">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-300 uppercase tracking-widest mb-1.5 flex-wrap">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <span className={`transition-colors duration-200 ${idx === breadcrumbs.length - 1 ? 'text-primary-300 font-bold' : 'text-slate-400 hover:text-slate-300 cursor-default'}`}>
                    {crumb}
                  </span>
                  {idx < breadcrumbs.length - 1 && <ChevronRight size={10} className="text-slate-500 shrink-0" />}
                </React.Fragment>
              ))}
            </div>
            <h2 className="text-2xl font-bold text-iridescent leading-none truncate tracking-tight font-display drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">{title}</h2>
          </div>
        </div>

        {/* Actions & Stats */}
        <div className="flex flex-wrap items-center gap-3 justify-start lg:justify-end">
          {stats?.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * idx }}
              className="flex items-center gap-3 bg-slate-950/40 px-4 py-2 rounded-lg border border-slate-700/60 hover:border-slate-600/80 transition-colors shadow-sm grow sm:grow-0 group"
            >
              {stat.icon && (
                <span className={`p-1 rounded-md bg-slate-900/50 border border-slate-800 group-hover:scale-110 transition-transform ${
                  stat.animate ? 'animate-pulse' : ''
                } ${
                   stat.color === 'success' ? 'text-success-500 shadow-[0_0_10px_rgba(34,197,94,0.1)]' :
                  stat.color === 'warning' ? 'text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.1)]' :
                  stat.color === 'danger' ? 'text-danger-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]' :
                  stat.color === 'primary' ? 'text-primary-500 shadow-[0_0_10px_rgba(6,182,212,0.1)]' :
                  stat.color === 'purple' ? 'text-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.1)]' :
                  stat.color === 'cyan' ? 'text-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.1)]' :
                  stat.color === 'secondary' ? 'text-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.1)]' : 'text-slate-400'
                }`}>
                  {stat.icon}
                </span>
              )}
              <div className="flex flex-col items-end leading-tight ml-auto sm:ml-0">
                <span className="text-[9px] text-slate-300 uppercase font-bold tracking-wider">{stat.label}</span>
                <span className={`text-sm font-mono font-bold ${
                    stat.color === 'success' ? 'text-success-400' :
                   stat.color === 'warning' ? 'text-yellow-400' :
                   stat.color === 'danger' ? 'text-danger-400' :
                   stat.color === 'primary' ? 'text-primary-400' :
                   stat.color === 'purple' ? 'text-purple-400' :
                   stat.color === 'cyan' ? 'text-cyan-400' :
                   stat.color === 'secondary' ? 'text-indigo-400' : 'text-slate-200'
                }`}>{stat.value}</span>
              </div>
            </motion.div>
          ))}

          {actions && (
            <>
              <div className="h-8 w-[1px] bg-gradient-to-b from-transparent via-slate-700 to-transparent mx-2 hidden lg:block"></div>
              <div className="w-full sm:w-auto mt-2 sm:mt-0 flex-grow sm:flex-grow-0">
                {actions}
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};
