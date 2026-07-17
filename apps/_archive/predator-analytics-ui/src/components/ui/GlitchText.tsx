/**
 * ⚡ GlitchText — Critical Alert Text з RGB split animation
- Для важливих alerts, threat warnings
- CSS clip-path animation для glitch effect
 */
import React from 'react';
import { cn } from '@/utils/cn';

interface GlitchTextProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

const intensityMap = {
  low: 'glitch-text',
  medium: 'glitch-text glitch-medium',
  high: 'glitch-text glitch-high',
};

export const GlitchText: React.FC<GlitchTextProps> = ({
  children,
  className,
  intensity = 'medium',
}) => {
  return (
    <span
      className={cn(
        'font-display font-bold inline-block',
        intensityMap[intensity],
        className
      )}
      data-text={typeof children === 'string' ? children : undefined}
    >
      {children}
    </span>
  );
};

export default GlitchText;
