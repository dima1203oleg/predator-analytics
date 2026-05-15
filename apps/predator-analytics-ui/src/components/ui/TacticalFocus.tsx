/**
 * 🦅 PREDATOR v63.0-ELITE — Tactical Focus Effect
 * Тактичний фокус ефект для підсвічування важливих елементів.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface TacticalFocusProps {
  children: React.ReactNode;
  className?: string;
  color?: 'rose' | 'amber' | 'emerald' | 'sky';
  intensity?: 'low' | 'medium' | 'high';
}

export const TacticalFocus: React.FC<TacticalFocusProps> = ({
  children,
  className,
  color = 'rose',
  intensity = 'medium',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const colorMap = {
    rose: 'shadow-rose-500/50',
    amber: 'shadow-amber-500/50',
    emerald: 'shadow-emerald-500/50',
    sky: 'shadow-sky-500/50',
  };

  const intensityMap = {
    low: 'shadow-lg',
    medium: 'shadow-2xl',
    high: 'shadow-[0_0_40px_rgba(225,29,72,0.5)]',
  };

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'relative rounded-xl transition-all duration-300',
        isHovered && `${colorMap[color]} ${intensityMap[intensity]}`,
        className
      )}
    >
      {isHovered && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-current opacity-50"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.5 }}
          exit={{ scale: 0.95, opacity: 0 }}
        />
      )}
      {children}
    </motion.div>
  );
};

export default TacticalFocus;
