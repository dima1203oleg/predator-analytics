/**
 * ⚠️ ThreatLevel — Micro-indicator у куту
- Колір = поточний threat level (Green → Amber → Red)
- При зміні — siren flash по всьому UI
- Позиція: top-right або bottom-right
 */
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

type ThreatLevel = 'low' | 'elevated' | 'high' | 'severe';

interface ThreatLevelProps {
  level: ThreatLevel;
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  onLevelChange?: (level: ThreatLevel) => void;
  className?: string;
}

const levelConfig: Record<ThreatLevel, {
  color: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  pulse: boolean;
}> = {
  low: {
    color: '#4ecdc4',
    label: 'LOW',
    icon: Shield,
    pulse: false,
  },
  elevated: {
    color: '#c9a227',
    label: 'ELEVATED',
    icon: AlertTriangle,
    pulse: true,
  },
  high: {
    color: '#e11d48',
    label: 'HIGH',
    icon: AlertTriangle,
    pulse: true,
  },
  severe: {
    color: '#dc2626',
    label: 'SEVERE',
    icon: XCircle,
    pulse: true,
  },
};

const positionMap = {
  'top-right': 'top-4 right-4',
  'bottom-right': 'bottom-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-left': 'bottom-4 left-4',
};

export const ThreatLevel: React.FC<ThreatLevelProps> = ({
  level,
  position = 'top-right',
  onLevelChange,
  className,
}) => {
  const config = levelConfig[level];
  const Icon = config.icon;

  // Siren flash при зміні level
  useEffect(() => {
    if (onLevelChange) {
      onLevelChange(level);
    }
  }, [level, onLevelChange]);

  return (
    <motion.div
      className={cn(
        'fixed z-[50] flex items-center gap-2 px-3 py-1.5 rounded-lg glass-obsidian',
        positionMap[position],
        className
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* Status dot */}
      <motion.div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: config.color }}
        animate={config.pulse ? {
          scale: [1, 1.3, 1],
          opacity: [1, 0.6, 1],
        } : {}}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Icon */}
      <div className="w-3.5 h-3.5" style={{ color: config.color } as React.CSSProperties}>
        <Icon className="w-full h-full" />
      </div>

      {/* Label */}
      <span className="font-display text-[10px] font-bold uppercase tracking-wider" style={{ color: config.color } as React.CSSProperties}>
        {config.label}
      </span>

      {/* Glow для severe */}
      {level === 'severe' && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-red-500/20 blur-md -z-10"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </motion.div>
  );
};

export default ThreatLevel;
