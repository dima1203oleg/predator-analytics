
import React from 'react';
import { ChevronRight, LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ViewHeaderProps {
  title: string | React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode | LucideIcon | React.ElementType;
  breadcrumbs?: string[];
  stats?: {
    label: string;
    value: string;
    icon?: React.ReactNode;
    color?: 'default' | 'success' | 'warning' | 'danger' | 'error' | 'primary' | 'purple' | 'secondary' | 'cyan' | 'gold' | 'rose' | 'amber' | 'emerald' | 'crimson';
    animate?: boolean;
  }[];
  actions?: React.ReactNode;
  badges?: {
    label: string;
    icon?: React.ReactNode;
    color?: 'default' | 'success' | 'warning' | 'danger' | 'error' | 'primary' | 'purple' | 'cyan' | 'secondary' | 'emerald' | 'amber' | 'rose' | 'gold' | 'crimson';
  }[];
  className?: string;
}

export const ViewHeader: React.FC<ViewHeaderProps> = ({
  title,
  subtitle,
  icon,
  breadcrumbs = [],
  stats,
  actions,
  badges = [],
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex flex-col gap-6 relative overflow-hidden transition-all duration-700",
        "bg-black/40 glass-wraith p-8 rounded-[3rem] border border-white/10 shadow-4xl",
        className
      )}
    >
      <div className="absolute inset-0 cyber-scan-grid opacity-[0.03] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-rose-500/20 to-transparent" />

      {/* Top Row: Breadcrumbs & Actions */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-8 relative z-10">

        {/* Title Area */}
        <div className="flex items-center gap-8">
          {icon && (
            <motion.div
              whileHover={{ scale: 1.1, rotate: 2 }}
              className="p-5 bg-black/60 glass-wraith rounded-[2rem] border border-rose-500/20 shadow-2xl text-rose-500 shrink-0 relative group"
            >
              <div className="absolute inset-0 bg-rose-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
              {typeof icon === 'function' || (typeof icon === 'object' && 'render' in (icon as any))
                ? React.createElement(icon as any, { className: 'w-8 h-8 drop-shadow-[0_0_8px_rgba(225,29,72,0.4)]' })
                : icon as React.ReactNode}
            </motion.div>
          )}

          <div className="min-w-0">
            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
              <div className="flex items-center gap-2.5 text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-3 flex-wrap italic">
                {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <span className={cn(
                    "transition-colors duration-300",
                    idx === breadcrumbs.length - 1 ? "text-rose-500" : "text-slate-600 hover:text-slate-400 cursor-default"
                  )}>
                    {crumb}
                  </span>
                  {idx < breadcrumbs.length - 1 && <ChevronRight size={12} className="text-slate-800 shrink-0" />}
                </React.Fragment>
              ))}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-5">
              <h1 className="text-4xl font-black text-white leading-none truncate tracking-tighter italic uppercase glint-elite chromatic-elite">
                {title}
              </h1>
              {badges.length > 0 && (
                <div className="flex items-center gap-3">
                  {badges.map((badge, bIdx) => (
                    <motion.div
                      key={bIdx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + (bIdx * 0.1) }}
                      className={cn(
                        "flex items-center gap-2 px-4 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-[0.2em] italic transition-all duration-300",
                        badge.color === 'success' || badge.color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-lg' :
                        badge.color === 'primary' || badge.color === 'cyan' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-lg' :
                        badge.color === 'danger' || badge.color === 'rose' || badge.color === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.2)]' :
                        badge.color === 'warning' || badge.color === 'amber' || badge.color === 'gold' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-lg' :
                        badge.color === 'purple' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-lg' :
                        'bg-white/5 border-white/10 text-slate-400'
                      )}
                    >
                      {badge.icon && <span className="opacity-80 group-hover:scale-110 transition-transform">{badge.icon}</span>}
                      {badge.label}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            {subtitle && <p className="text-[13px] mt-3 text-slate-500 font-medium tracking-tight max-w-2xl">{subtitle}</p>}
          </div>
        </div>

        {/* Actions & Stats */}
        <div className="flex flex-wrap items-center gap-5 justify-start lg:justify-end">
          {stats?.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * idx }}
              className="flex items-center gap-5 bg-black/40 glass-wraith px-6 py-3 rounded-[1.5rem] border border-white/5 hover:border-rose-500/20 transition-all duration-500 shadow-2xl group"
            >
              {stat.icon && (
                <span className={cn(
                  "p-2 rounded-xl bg-white/5 border border-white/5 group-hover:scale-110 transition-transform duration-500",
                  stat.animate ? 'animate-pulse' : '',
                  stat.color === 'success' || stat.color === 'emerald' ? 'text-emerald-400' :
                  stat.color === 'warning' || stat.color === 'amber' || stat.color === 'gold' ? 'text-amber-400' :
                  stat.color === 'danger' || stat.color === 'error' || stat.color === 'rose' || stat.color === 'crimson' ? 'text-rose-500 drop-shadow-[0_0_8px_rgba(225,29,72,0.4)]' :
                  stat.color === 'primary' || stat.color === 'cyan' ? 'text-cyan-400' :
                  stat.color === 'purple' ? 'text-purple-400' :
                  stat.color === 'secondary' ? 'text-indigo-400' : 'text-slate-500'
                )}>
                  {stat.icon}
                </span>
              )}
              <div className="flex flex-col items-end leading-none">
                <span className="text-[9px] text-slate-600 uppercase font-black tracking-[0.3em] italic mb-1.5">{stat.label}</span>
                <span className={cn(
                  "text-base font-mono font-black italic tracking-tighter",
                  stat.color === 'success' || stat.color === 'emerald' ? 'text-emerald-400' :
                  stat.color === 'warning' || stat.color === 'amber' || stat.color === 'gold' ? 'text-amber-400' :
                  stat.color === 'danger' || stat.color === 'error' || stat.color === 'rose' || stat.color === 'crimson' ? 'text-rose-400' :
                  stat.color === 'primary' || stat.color === 'cyan' ? 'text-cyan-400' :
                  stat.color === 'purple' ? 'text-purple-400' :
                  stat.color === 'secondary' ? 'text-indigo-400' : 'text-white'
                )}>{stat.value}</span>
              </div>
            </motion.div>
          ))}

          {actions && (
            <div className="flex items-center gap-4 ml-4">
              <div className="h-12 w-px bg-white/5 hidden lg:block"></div>
              <div className="flex items-center gap-4">
                {actions}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
