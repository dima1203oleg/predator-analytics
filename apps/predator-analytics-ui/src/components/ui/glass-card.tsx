import React from 'react';
import { cn } from '@/utils/cn';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  variant?: 'default' | 'emerald' | 'blue' | 'purple' | 'rose' | 'amber';
  glow?: boolean;
  className?: string;
  intensity?: 'light' | 'medium' | 'heavy';
}

const variantStyles = {
  default: 'border-white/10 shadow-white/5',
  emerald: 'border-emerald-500/30 shadow-emerald-500/20',
  blue: 'border-blue-500/30 shadow-blue-500/20',
  purple: 'border-purple-500/30 shadow-purple-500/20',
  rose: 'border-rose-500/30 shadow-rose-500/20',
  amber: 'border-amber-500/30 shadow-amber-500/20',
};

const glowStyles = {
  default: 'hover:',
  emerald: 'hover:',
  blue: 'hover:',
  purple: 'hover:',
  rose: 'hover:',
  amber: 'hover:',
};

const intensityStyles = {
  light: 'bg-black/20 ',
  medium: 'bg-black/40 ',
  heavy: 'bg-black/60 ',
};

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, variant = 'default', glow = false, intensity = 'medium', className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          'border rounded-xl p-4 relative overflow-hidden transition-all duration-300',
          intensityStyles[intensity],
          variantStyles[variant],
          glow && glowStyles[variant],
          className
        )}
        {...props}
      >
        {/* Субтільний внутрішній градієнт-відблиск */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-xl" />
        
        <div className="relative z-10">
          {children}
        </div>
      </motion.div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
