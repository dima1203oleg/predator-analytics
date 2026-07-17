/**
 * 🎖️ MilitaryLabel — uppercase, letter-spaced, monospace labels
 * Для headers, section titles, status labels в Command Center стилі
 */
import React from 'react';
import { cn } from '@/utils/cn';

interface MilitaryLabelProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'warning' | 'critical' | 'muted';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  blink?: boolean;
}

const variantMap = {
  default: 'text-[#8a8a8a]',
  primary: 'text-[#c9a227]',
  warning: 'text-[#c9a227]',
  critical: 'text-[#e11d48]',
  muted: 'text-[#5a5a5a]',
};

const sizeMap = {
  xs: 'text-[10px] tracking-[0.12em]',
  sm: 'text-[11px] tracking-[0.1em]',
  md: 'text-xs tracking-[0.08em]',
};

export const MilitaryLabel: React.FC<MilitaryLabelProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className,
  blink = false,
}) => {
  return (
    <span
      className={cn(
        'font-display font-semibold uppercase',
        variantMap[variant],
        sizeMap[size],
        blink && 'animate-blink-fast',
        className
      )}
    >
      {children}
    </span>
  );
};

export default MilitaryLabel;
