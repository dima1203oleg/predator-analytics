import React, { useState } from 'react';
import { motion, HTMLMotionProps, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle, Info, Activity, ArrowUp, ArrowDown, Minus } from 'lucide-react';

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
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  status?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  metrics?: CardMetric[];
  actions?: CardAction[];
  expandable?: boolean;
  glow?: 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'none';
  variant?: 'cyber' | 'glass' | 'minimal' | 'holographic';
  noPadding?: boolean;
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
    success: 'text-green-400',
    warning: 'text-amber-400',
    error: 'text-red-400',
    info: 'text-blue-400',
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

  // Determine glow based on status if not explicitly set
  const effectiveGlow = glow !== 'none' ? glow : (
    status === 'error' || priority === 'critical' ? 'red' :
    status === 'warning' || priority === 'high' ? 'yellow' :
    status === 'success' ? 'green' :
    status === 'info' ? 'blue' : 'none'
  );

  const getGlowClass = () => {
    switch(effectiveGlow) {
      case 'blue': return 'hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.05)]';
      case 'red': return 'hover:shadow-[0_0_30px_rgba(239,68,68,0.15)] hover:border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.05)]';
      case 'green': return 'hover:shadow-[0_0_30px_rgba(34,197,94,0.15)] hover:border-success-500/50 shadow-[0_0_10px_rgba(34,197,94,0.05)]';
      case 'purple': return 'hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.05)]';
      case 'yellow': return 'hover:shadow-[0_0_30px_rgba(234,179,8,0.15)] hover:border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.05)]';
      default: return 'hover:shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:border-primary-500/30';
    }
  };

  const getVariantClass = () => {
    switch(variant) {
      case 'glass': return 'glass-ultra';
      case 'minimal': return 'bg-transparent border-slate-800 hover:bg-slate-900/20 shadow-none';
      case 'holographic': return 'bg-gradient-to-br from-slate-900/90 via-[#0a1224] to-slate-950/90 border-cyan-500/30 backdrop-blur-2xl shadow-[0_0_20px_rgba(6,182,212,0.05)]';
      default: return 'bg-[#0a0f1c]/90 border-slate-800/80 backdrop-blur-3xl shadow-2xl glass-ultra'; // Cyber
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`
        flex flex-col transition-all duration-300 group
        rounded-xl border
        ${getGlowClass()}
        ${getVariantClass()}
        ${className}
        relative overflow-hidden
      `}
      {...rest}
    >
      {/* Decorative Elements */}
      {(variant === 'cyber' || variant === 'holographic') && (
        <>
          <div className="absolute top-0 left-0 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="absolute top-0 left-0 w-2 h-[1px] bg-cyan-500"></div>
            <div className="absolute top-0 left-0 w-[1px] h-2 bg-cyan-500"></div>
          </div>
          <div className="absolute bottom-0 right-0 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
             <div className="absolute bottom-0 right-0 w-2 h-[1px] bg-cyan-500"></div>
             <div className="absolute bottom-0 right-0 w-[1px] h-2 bg-cyan-500"></div>
          </div>
          {variant === 'cyber' && <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none z-0"></div>}
          {variant === 'holographic' && (
             <div className="absolute -top-[100%] left-0 right-0 h-1/2 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent animate-scanline-fast opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"></div>
          )}
        </>
      )}

      {/* Header */}
      <div
        className={`px-5 py-4 flex justify-between items-center relative z-10 ${expandable ? 'cursor-pointer' : ''} ${variant === 'minimal' ? 'border-b border-transparent' : 'border-b border-slate-800/50 bg-slate-950/20'}`}
        onClick={() => expandable && setIsExpanded(!isExpanded)}
      >
        {/* Active Indicator Line */}
        {effectiveGlow !== 'none' && (
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-r transition-all duration-300 group-hover:h-8 ${
             effectiveGlow === 'red' ? 'bg-red-500 shadow-[0_0_8px_red]' :
             effectiveGlow === 'purple' ? 'bg-purple-500 shadow-[0_0_8px_purple]' :
             effectiveGlow === 'green' ? 'bg-green-500 shadow-[0_0_8px_green]' :
             effectiveGlow === 'yellow' ? 'bg-yellow-500 shadow-[0_0_8px_yellow]' :
             'bg-cyan-500 shadow-[0_0_8px_cyan]'
          }`}></div>
        )}

        <div className="flex items-center gap-3">
          {icon && <div className="text-slate-500 group-hover:text-cyan-400 transition-colors">{icon}</div>}
          <div className="flex flex-col">
            <h3 className={`text-sm font-bold uppercase tracking-wider font-display transition-colors flex items-center gap-2 ${
              variant === 'minimal' ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-100 group-hover:text-cyan-50'
            }`}>
              {title}
              {priority && (
                 <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                    priority === 'critical' ? 'border-red-500 text-red-400 bg-red-500/10' :
                    priority === 'high' ? 'border-orange-500 text-orange-400 bg-orange-500/10' :
                    priority === 'medium' ? 'border-yellow-500 text-yellow-400 bg-yellow-500/10' :
                    'border-blue-500 text-blue-400 bg-blue-500/10'
                 }`}>
                   {priority}
                 </span>
              )}
            </h3>
            {subtitle && <p className="text-[10px] text-slate-500 font-mono tracking-tight mt-0.5">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-20">
          {action}
          {status && getStatusIcon()}
          {expandable && (
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
              <ChevronDown size={16} className="text-slate-500" />
            </motion.div>
          )}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden relative z-10"
          >
             <div className={`${noPadding ? '' : 'p-5'} flex flex-col gap-4`}>
                {children}

                {/* Metrics Section */}
                {metrics && metrics.length > 0 && (
                   <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-800/50">
                      {metrics.map((metric, idx) => (
                         <div key={idx} className="bg-slate-900/30 rounded p-2 border border-slate-800/30">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">{metric.label}</p>
                            <div className="flex items-center gap-2">
                               <span className="text-sm font-bold text-slate-200">{metric.value}</span>
                               {metric.trend && (
                                  <div className={`flex items-center text-[10px] ${
                                     metric.trend === 'up' ? 'text-green-400' :
                                     metric.trend === 'down' ? 'text-red-400' : 'text-slate-400'
                                  }`}>
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
                   <div className="flex gap-2 justify-end pt-2 border-t border-slate-800/50">
                      {actions.map((act, idx) => (
                         <button
                            key={idx}
                            onClick={act.onClick}
                            className={`
                              flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all
                              ${act.variant === 'primary' ? 'bg-cyan-500 text-black hover:bg-cyan-400' :
                                act.variant === 'danger' ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20' :
                                'bg-slate-800 text-slate-300 hover:bg-slate-700'}
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
