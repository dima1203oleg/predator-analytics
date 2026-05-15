/**
 * 🦅 PREDATOR v63.0-ELITE — Glassmorphism Card
 * Компонент для glassmorphism ефектів з налаштовуваною прозорістю.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React from 'react';
import { cn } from '@/utils/cn';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'light' | 'medium' | 'dark';
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  border?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  variant = 'medium',
  blur = 'md',
  border = true,
}) => {
  const variantStyles = {
    light: 'bg-white/10',
    medium: 'bg-slate-900/40',
    dark: 'bg-slate-950/60',
  };

  const blurStyles = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
  };

  return (
    <div
      className={cn(
        'rounded-2xl',
        variantStyles[variant],
        blurStyles[blur],
        border && 'border border-white/10',
        'shadow-xl',
        className
      )}
    >
      {children}
    </div>
  );
};

export default GlassCard;
