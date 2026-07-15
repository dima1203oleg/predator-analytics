/**
 * GlassCard — Скляна карточка для відображення інформації
 * 
 * Glassmorphism мікро-компонент:
 * - Мікро-анімація при hover
 * - Glow-ефект при ризику
 * - Skeleton-loading з shimmer
 */
import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  glow?: 'risk' | 'success' | 'info' | 'warning' | 'none';
  isLoading?: boolean;
  compact?: boolean;
}

const glowColors = {
  risk: 'shadow-[0_0_20px_rgba(239,68,68,0.15)] border-red-500/20',
  success: 'shadow-[0_0_20px_rgba(34,197,94,0.15)] border-green-500/20',
  info: 'shadow-[0_0_20px_rgba(59,130,246,0.15)] border-blue-500/20',
  warning: 'shadow-[0_0_20px_rgba(245,158,11,0.15)] border-amber-500/20',
  none: '',
};

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  onClick,
  glow = 'none',
  isLoading = false,
  compact = false,
}) => {
  if (isLoading) {
    return (
      <div
        className={`
          ${compact ? 'p-3' : 'p-4'}
          bg-white/[0.03] backdrop-blur-md
          border border-white/[0.06]
          rounded-xl
          ${className}
        `}
      >
        {/* Shimmer skeleton */}
        <div className="animate-pulse space-y-2">
          <div className="h-3 bg-white/10 rounded w-3/4" />
          <div className="h-3 bg-white/10 rounded w-1/2" />
          <div className="h-8 bg-white/5 rounded mt-3" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
      className={`
        ${compact ? 'p-3' : 'p-4'}
        bg-white/[0.04] backdrop-blur-md
        border border-white/[0.08]
        rounded-xl
        transition-all duration-300
        ${onClick ? 'cursor-pointer hover:bg-white/[0.07]' : ''}
        ${glowColors[glow]}
        ${className}
      `}
    >
      {/* Верхній градієнт (скляний ефект) */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
      
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};
