import { AnimatePresence, HTMLMotionProps, motion } from 'framer-motion';
import { AlertCircle, ArrowDown, ArrowUp, CheckCircle, ChevronDown, Info, Minus } from 'lucide-react';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export interface CardMetric {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
}

export interface CardAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

interface TacticalCardProps extends Omit<HTMLMotionProps<'div'>, 'title'> {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  status?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  metrics?: CardMetric[];
  actions?: CardAction[];
  expandable?: boolean;
  glow?: 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'cyan' | 'emerald' | 'indigo' | 'amber' | 'gold' | 'none';
  variant?: 'cyber' | 'glass' | 'minimal' | 'holographic' | 'premium' | 'interactive';
  noPadding?: boolean;
  children?: React.ReactNode;
  action?: React.ReactNode; // Backward compatibility for single custom action
  elite?: boolean;
  scanGrid?: boolean;
}

export const TacticalCard: React.FC<TacticalCardProps> = ({
  title,
  subtitle,
  icon,
  children,
  className = '',
  status,
  priority,
  metrics,
  actions,
  expandable = false,
  action, // Legacy prop
  glow = 'none',
  variant = 'cyber',
  noPadding = false,
  elite = false,
  scanGrid = false,
  ...rest
}) => {
  const [isExpanded, setIsExpanded] = useState(!expandable);

  // Map status to colors
  const statusColors = {
    success: 'text-emerald-400',
    warning: 'text-rose-400',
    error: 'text-crimson-500',
    info: 'text-cyan-400',
    neutral: 'text-slate-400'
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success': return <CheckCircle size={16} className={statusColors.success} />;
      case 'warning': return <AlertCircle size={16} className={statusColors.warning} />;
      case 'error': return <AlertCircle size={16} className={statusColors.error} />;
      case 'info': return <Info size={16} className={statusColors.info} />;
      default: return null;
    }
  };

  // Determine section color
  const effectiveGlow = glow !== 'none' ? glow : (
    status === 'error' || priority === 'critical' ? 'crimson' :
      status === 'warning' || priority === 'high' ? 'rose' :
        status === 'success' ? 'emerald' :
          status === 'info' ? 'blue' : 'none'
  );

  const getSectionColor = () => {
    switch (effectiveGlow) {
      case 'blue': return 'cyan';
      case 'cyan': return 'cyan';
      case 'red': return 'rose';
      case 'crimson': return 'rose';
      case 'green': return 'emerald';
      case 'emerald': return 'emerald';
      case 'yellow': return 'amber';
      case 'amber': return 'amber';
      case 'rose': return 'rose';
      case 'purple': return 'violet';
      case 'indigo': return 'indigo';
      case 'gold': return 'rose';
      default: return 'slate';
    }
  };

  const sectionColor = getSectionColor();
  const sectionClass = `section-${sectionColor}`;
  const dotClass = `section-dot-${sectionColor}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden transition-all duration-500",
        "bg-black/40 glass-wraith border border-white/10 rounded-[3rem] backdrop-blur-3xl shadow-2xl",
        elite && "hover:scale-[1.01] hover:border-white/20",
        className
      )}
      {...rest}
    >
      {/* Background Effects */}
      {(scanGrid || elite) && (
        <div className="absolute inset-0 cyber-scan-grid opacity-[0.03] pointer-events-none" />
      )}
      {elite && (
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-current opacity-[0.02] blur-[100px] rounded-full pointer-events-none group-hover:opacity-[0.05] transition-opacity duration-1000" />
      )}
      
      {/* HUD Accent Line */}
      <div className={cn(
        "absolute left-0 top-12 bottom-12 w-1 rounded-full opacity-40 transition-all duration-500",
        `bg-${sectionColor}-500`
      )} />

      {/* Header */}
      {(title || icon || status || action || expandable) && (
        <div
          className={cn(
            "px-10 py-8 flex items-center justify-between relative z-20",
            expandable && "cursor-pointer hover:bg-white/[0.02] transition-colors"
          )}
          onClick={() => expandable && setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-5 min-w-0">
             <div className={cn(dotClass, "animate-pulse")} />
             <div className="flex items-center gap-4">
                {icon && <div className={cn(`text-${sectionColor}-500`, "drop-shadow-[0_0_8px_rgba(225,29,72,0.4)]")}>{icon}</div>}
                <div>
                  <h2 className={cn(
                    "text-sm font-black text-white italic tracking-[0.2em] uppercase leading-none",
                    elite && "glint-elite chromatic-elite"
                  )}>
                    {title}
                  </h2>
                  {subtitle && <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2 italic">{subtitle}</p>}
                </div>
                {priority && (
                  <span className={cn(
                    "text-[8px] font-black px-3 py-1 rounded-lg border italic uppercase tracking-widest",
                    priority === 'critical' ? "bg-rose-500/20 border-rose-500/40 text-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.2)]" :
                    priority === 'high' ? "bg-amber-500/20 border-amber-500/40 text-amber-500" :
                    "bg-white/5 border-white/10 text-slate-500"
                  )}>
                    {priority === 'critical' ? 'К ИТИЧНО' : 
                     priority === 'high' ? 'ВИСОКИЙ' : 
                     priority === 'medium' ? 'СЕРЕДНІЙ' : 'НИЗЬКИЙ'}
                  </span>
                )}
             </div>
          </div>

          <div className="flex items-center gap-6 shrink-0 relative z-20">
            {action}
            {status && getStatusIcon()}
            {expandable && (
              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="text-slate-500 hover:text-white transition-colors">
                <ChevronDown size={20} />
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative z-10"
          >
            <div className={cn(
              "flex flex-col gap-8",
              noPadding ? "p-0" : "px-10 pb-10 pt-2"
            )}>
              <div className="relative z-10 text-slate-300">
                {children}
              </div>

              {/* Metrics Section */}
              {metrics && metrics.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8 border-t border-white/5">
                  {metrics.map((metric, idx) => (
                    <div key={idx} className="relative group/metric">
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">{metric.label}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xl font-black text-white italic tracking-tighter glint-elite">{metric.value}</span>
                        {metric.trend && (
                          <div className={cn(
                            "flex items-center text-[10px] font-black px-2 py-0.5 rounded-md italic tracking-widest uppercase",
                            metric.trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' :
                            metric.trend === 'down' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-500'
                          )}>
                            {metric.trend === 'up' ? <ArrowUp size={10} /> :
                             metric.trend === 'down' ? <ArrowDown size={10} /> :
                             <Minus size={10} />}
                            {metric.trendValue && <span className="ml-1">{metric.trendValue}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions Section */}
              {actions && actions.length > 0 && (
                <div className="flex gap-4 justify-end pt-8 border-t border-white/5">
                  {actions.map((act, idx) => (
                    <button
                      key={idx}
                      onClick={act.onClick}
                      className={cn(
                        "flex items-center gap-3 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic transition-all duration-300 group/act",
                        act.variant === 'primary' ? "bg-rose-500 text-black shadow-[0_0_20px_rgba(225,29,72,0.4)] hover:brightness-110" :
                        act.variant === 'danger' ? "bg-black/40 text-rose-500 border border-rose-500/30 hover:bg-rose-500/10" :
                        "bg-white/5 text-slate-400 hover:text-white border border-white/10 hover:border-white/30"
                      )}
                    >
                      {act.icon && <span className="group-hover/act:scale-110 transition-transform">{act.icon}</span>}
                      {act.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
