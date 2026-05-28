/**
 * 🪞 GlassPanel v2.0 — AURUM OBSIDIAN Industrial Glass
 * Multi-layer glass з depth, highlight, scan-lines опцією
 */
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'hover' | 'active' | 'critical';
  scanLines?: boolean;
  chromatic?: boolean;
  noise?: boolean;
  vignette?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  as?: keyof JSX.IntrinsicElements;
}

const variantMap = {
  default: '',
  elevated: 'shadow-[0_0_0_1px_rgba(0,0,0,0.5),0_8px_32px_rgba(0,0,0,0.5)]',
  hover: 'hover:border-rose-500/20 hover:shadow-[0_0_0_1px_rgba(0,0,0,0.5),0_12px_40px_rgba(0,0,0,0.6)]',
  active: 'border-rose-500/30 shadow-[0_0_20px_rgba(225,29,72,0.1)]',
  critical: 'border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.15)]',
};

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

export const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  (
    {
      children,
      className,
      variant = 'default',
      scanLines = false,
      chromatic = false,
      noise = false,
      vignette = false,
      padding = 'md',
      onClick,
      as: Component = 'div',
    },
    ref
  ) => {
    const MotionComponent = motion[Component as 'div'] || motion.div;

    return (
      <MotionComponent
        ref={ref as any}
        onClick={onClick}
        className={cn(
          'glass-obsidian rounded-xl',
          paddingMap[padding],
          variantMap[variant],
          scanLines && 'scan-lines',
          chromatic && 'chromatic-hover',
          noise && 'noise-overlay',
          vignette && 'vignette',
          onClick && 'cursor-pointer',
          className
        )}
        whileHover={onClick ? { scale: 1.005 } : undefined}
        whileTap={onClick ? { scale: 0.995 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {children}
      </MotionComponent>
    );
  }
);

GlassPanel.displayName = 'GlassPanel';

export default GlassPanel;
