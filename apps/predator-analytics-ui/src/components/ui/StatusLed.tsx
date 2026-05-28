/**
 * 🔴 StatusLed — Military-grade status indicators
 * Healthy (teal breathe) / Warning (amber blink) / Critical (red rapid)
 */
import React from 'react';
import { cn } from '@/utils/cn';

type StatusType = 'healthy' | 'warning' | 'critical' | 'offline';

interface StatusLedProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
  label?: string;
}

const sizeMap = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-3 h-3',
};

const statusConfig: Record<StatusType, { bg: string; glow: string; animation: string }> = {
  healthy: {
    bg: 'bg-[#4ecdc4]',
    glow: 'shadow-[0_0_6px_rgba(78,205,196,0.5)]',
    animation: 'animate-breathe',
  },
  warning: {
    bg: 'bg-[#c9a227]',
    glow: 'shadow-[0_0_6px_rgba(201,162,39,0.5)]',
    animation: 'animate-blink-slow',
  },
  critical: {
    bg: 'bg-[#e11d48]',
    glow: 'shadow-[0_0_8px_rgba(225,29,72,0.6)]',
    animation: 'animate-blink-fast',
  },
  offline: {
    bg: 'bg-[#3a3a3a]',
    glow: '',
    animation: '',
  },
};

export const StatusLed: React.FC<StatusLedProps> = ({
  status,
  size = 'md',
  pulse = true,
  className,
  label,
}) => {
  const config = statusConfig[status];

  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={cn(
          'rounded-full inline-block',
          sizeMap[size],
          config.bg,
          config.glow,
          pulse && config.animation,
          className
        )}
      />
      {label && (
        <span className="label-military">{label}</span>
      )}
    </div>
  );
};

export default StatusLed;
