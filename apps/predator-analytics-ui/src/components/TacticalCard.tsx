import { AnimatePresence, HTMLMotionProps, motion } from 'framer-motion';
import { AlertCircle, ArrowDown, ArrowUp, CheckCircle, ChevronDown, Info, Minus } from 'lucide-react';
import React, { useState } from 'react';

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
  variant?: 'cyber' | 'glass' | 'minimal' | 'holographic' | 'premium';
  noPadding?: boolean;
  children?: React.ReactNode;
  action?: React.ReactNode; // Backward compatibility for single custom action
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
  ...rest
}) => {
  const [isExpanded, setIsExpanded] = useState(!expandable);

  // Map status to colors
  const statusColors = {
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    error: 'text-rose-400',
    info: 'text-cyan-400',
    neutral: 'text-slate-300'
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
    status === 'error' || priority === 'critical' ? 'red' :
      status === 'warning' || priority === 'high' ? 'yellow' :
        status === 'success' ? 'green' :
          status === 'info' ? 'blue' : 'none'
  );

  const getSectionColor = () => {
    switch (effectiveGlow) {
      case 'blue': return 'cyan';
      case 'cyan': return 'cyan';
      case 'red': return 'rose';
      case 'green': return 'emerald';
      case 'emerald': return 'emerald';
      case 'yellow': return 'amber';
      case 'amber': return 'amber';
      case 'purple': return 'violet';
      case 'indigo': return 'indigo';
      case 'gold': return 'amber';
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
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`page-section ${sectionClass} ${noPadding ? 'p-0' : ''} ${className}`}
      {...rest}
    >
      {/* Header */}
      {(title || icon || status || action || expandable) && (
        <div
          className={`section-header ${expandable ? 'cursor-pointer hover:bg-white/[0.02] transition-colors rounded-t-2xl' : ''} ${noPadding ? 'p-6 pb-2' : ''}`}
          onClick={() => expandable && setIsExpanded(!isExpanded)}
        >
          <div className={dotClass} />
          
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-3">
              {icon && <div className={`text-${sectionColor}-400 shrink-0`}>{icon}</div>}
              <div>
                <h2 className="section-title flex items-center gap-2">
                  {title}
                  {priority && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${priority === 'critical' ? 'border-rose-500 text-rose-400 bg-rose-500/10' :
                      priority === 'high' ? 'border-orange-500 text-orange-400 bg-orange-500/10' :
                        priority === 'medium' ? 'border-amber-500 text-amber-400 bg-amber-500/10' :
                          'border-cyan-500 text-cyan-400 bg-cyan-500/10'
                      }`}>
                      {priority}
                    </span>
                  )}
                </h2>
                {subtitle && <p className="section-subtitle mt-0.5">{subtitle}</p>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 relative z-20">
            {action}
            {status && getStatusIcon()}
            {expandable && (
              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="text-slate-400 hover:text-white transition-colors">
                <ChevronDown size={16} />
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
            className={`relative z-10 ${!noPadding && (title || icon || status || action || expandable) ? 'pt-2' : ''}`}
          >
            <div className={`${!noPadding && !title ? 'p-5' : ''} flex flex-col gap-4`}>
              {children}

              {/* Metrics Section */}
              {metrics && metrics.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-white/5">
                  {metrics.map((metric, idx) => (
                    <div key={idx} className={`bg-${sectionColor}-950/10 rounded-xl p-3 border border-${sectionColor}-500/10`}>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">{metric.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold text-white">{metric.value}</span>
                        {metric.trend && (
                          <div className={`flex items-center text-[10px] ${metric.trend === 'up' ? 'text-emerald-400' :
                            metric.trend === 'down' ? 'text-rose-400' : 'text-slate-400'
                            }`}>
                            {metric.trend === 'up' ? <ArrowUp size={10} /> :
                              metric.trend === 'down' ? <ArrowDown size={10} /> :
                                <Minus size={10} />}
                            {metric.trendValue && <span className="ml-1">{(metric.trendValue as any)}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions Section */}
              {actions && actions.length > 0 && (
                <div className="flex gap-2 justify-end pt-4 border-t border-white/5">
                  {actions.map((act, idx) => (
                    <button
                      key={idx}
                      onClick={act.onClick}
                      className={`
                              flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all
                              ${act.variant === 'primary' ? `bg-${sectionColor}-500 text-black hover:bg-${sectionColor}-400 shadow-[0_0_15px_rgba(var(--color-${sectionColor}-500),0.3)]` :
                          act.variant === 'danger' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20' :
                            'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-white/5'}
                            `}
                    >
                      {act.icon}
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
