/**
 * 💎 HoloCard — Holographic Data Tile з procedural glow edge
 * Perspective tilt від mouse position, animated gradient border
 * Backward-compatible з TacticalCard (title, metrics, actions, тощо)
 */
import { Button } from '@/components/ui/button';
import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { AlertCircle, ArrowDown, ArrowUp, CheckCircle, ChevronDown, Info, Minus } from 'lucide-react';

interface CardMetric {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
}

interface CardAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

interface HoloCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gold' | 'rose' | 'teal' | 'cyber' | 'glass' | 'minimal' | 'holographic' | 'premium' | 'interactive';
  glowColor?: string; // Custom hex/rgba for glow edge
  glow?: boolean | string; // backward-compat: string values like 'blue', 'red', etc.
  tilt?: boolean;
  onClick?: () => void;
  as?: keyof JSX.IntrinsicElements;
  // === TacticalCard backward-compatible props ===
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  status?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  metrics?: CardMetric[];
  actions?: CardAction[];
  expandable?: boolean;
  noPadding?: boolean;
  action?: React.ReactNode; // Legacy prop
  elite?: boolean;
  scanGrid?: boolean;
}

const variantMap = {
  default: 'from-[#8a8a8a] via-white to-[#8a8a8a]',
  gold: 'from-[#c9a227] via-[#e8e8e8] to-[#c9a227]',
  rose: 'from-[#e11d48] via-white to-[#e11d48]',
  teal: 'from-[#4ecdc4] via-white to-[#4ecdc4]',
};

export const HoloCard: React.FC<HoloCardProps> = ({
  children,
  className,
  variant = 'default',
  glowColor,
  glow = true,
  tilt = true,
  onClick,
  as: Component = 'div',
  // === TacticalCard backward-compatible props ===
  title,
  subtitle,
  icon,
  status,
  priority,
  metrics,
  actions,
  expandable = false,
  noPadding = false,
  action,
  elite = false,
  scanGrid = false,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!expandable);

  // Map status to colors (backward-compat)
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

  // Determine section color from glow string
  const effectiveGlow = (typeof glow === 'string' && glow !== 'true' && glow !== 'false' && glow !== 'none')
    ? glow
    : (status === 'error' || priority === 'critical' ? 'crimson'
      : status === 'warning' || priority === 'high' ? 'rose'
        : status === 'success' ? 'emerald'
          : status === 'info' ? 'blue' : 'none');

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
      case 'gold': return 'amber';
      default: return 'slate';
    }
  };

  const sectionColor = getSectionColor();
  const sectionClass = `section-${sectionColor}`;
  const dotClass = `section-dot-${sectionColor}`;

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 300 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current || !tilt) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  const MotionComponent = motion[Component as 'div'] || motion.div;

  return (
    <MotionComponent
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: tilt ? rotateX : 0,
        rotateY: tilt ? rotateY : 0,
        transformStyle: 'preserve-3d',
      }}
      className={cn(
        'relative overflow-hidden transition-all duration-500',
        'bg-[rgba(10,10,12,0.85)] backdrop-blur-xl border border-white/[0.04] rounded-[2rem]',
        'shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)]',
        elite && 'hover:scale-[1.01] hover:border-white/20',
        onClick && 'cursor-pointer',
        className
      )}
      whileHover={onClick ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* Procedural glow edge — animated gradient border */}
      <motion.div
        className="absolute inset-0 rounded-[2rem] opacity-0 pointer-events-none transition-opacity duration-1000"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, transparent 300deg, ${glowColor || 'rgba(255,255,255,0.1)'} 360deg)`,
        }}
        animate={{
          opacity: isHovered && glow ? 0.5 : 0,
          rotate: isHovered ? 360 : 0,
        }}
        transition={{
          opacity: { duration: 0.5 },
          rotate: { duration: 4, repeat: Infinity, ease: 'linear' },
        }}
      />
      {/* Matte Noise Texture */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-noise mix-blend-overlay" />

      {/* Background Effects (backward-compat) */}
      {(scanGrid || elite) && (
        <div className="absolute inset-0 cyber-scan-grid opacity-[0.03] pointer-events-none" />
      )}
      {elite && (
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-current opacity-[0.01] blur-[80px] rounded-full pointer-events-none group-hover:opacity-[0.03] transition-opacity duration-1000" />
      )}

      {/* HUD Accent Line */}
      {(title || icon || status || action || expandable) && (
        <div className={cn(
          "absolute left-0 top-12 bottom-12 w-1 rounded-full opacity-40 transition-all duration-500",
          `bg-${sectionColor}-500`
        )} />
      )}

      {/* Header (backward-compat) */}
      {(title || icon || status || action || expandable) && (
        <div
          className={cn(
            "px-10 py-8 flex items-center justify-between relative z-20",
            expandable && "cursor-pointer hover:bg-white/[0.02] transition-colors"
          )}
          onClick={() => expandable && setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-5 min-w-0">
             <div className={dotClass} />
             <div className="flex items-center gap-4">
                {icon && <div className={`text-${sectionColor}-500`}>{icon}</div>}
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
                    priority === 'critical' ? "bg-rose-500/20 border-rose-500/40 text-rose-500" :
                    priority === 'high' ? "bg-amber-500/20 border-amber-500/40 text-amber-500" :
                    "bg-white/5 border-white/10 text-slate-500"
                  )}>
                    {priority === 'critical' ? 'КРИТИЧНО' :
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

      {/* Inner content container */}
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
                    <Button variant="cyber"
                      key={idx}
                      onClick={act.onClick}
                      className={cn(
                        "flex items-center gap-3 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic transition-all duration-300 group/act",
                        act.variant === 'primary' ? "bg-rose-500 text-black hover:brightness-110" :
                        act.variant === 'danger' ? "bg-black/40 text-rose-500 border border-rose-500/30 hover:bg-rose-500/10" :
                        "bg-white/5 text-slate-400 hover:text-white border border-white/10 hover:border-white/30"
                      )}
                    >
                      {act.icon && <span className="group-hover/act:scale-110 transition-transform">{act.icon}</span>}
                      {act.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inner shadow for depth */}
      <div
        className="absolute inset-0 rounded-[2rem] pointer-events-none"
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
        }}
      />
    </MotionComponent>
  );
};

export default HoloCard;
