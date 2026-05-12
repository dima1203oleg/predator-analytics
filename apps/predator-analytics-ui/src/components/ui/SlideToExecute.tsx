import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { ShieldAlert, Rocket } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SlideToExecuteProps {
  onConfirm: () => void;
  label?: string;
  confirmLabel?: string;
  className?: string;
  variant?: 'critical' | 'warning' | 'default';
}

const palette = {
  critical: {
    border: 'border-red-500/30',
    bg: 'bg-red-950/30',
    track: 'bg-red-900/20',
    thumb: 'bg-red-500',
    thumbGlow: 'shadow-red-500/50',
    text: 'text-red-200',
    icon: 'text-red-400',
  },
  warning: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-950/30',
    track: 'bg-amber-900/20',
    thumb: 'bg-amber-500',
    thumbGlow: 'shadow-amber-500/50',
    text: 'text-amber-200',
    icon: 'text-amber-400',
  },
  default: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-950/30',
    track: 'bg-emerald-900/20',
    thumb: 'bg-emerald-500',
    thumbGlow: 'shadow-emerald-500/50',
    text: 'text-emerald-200',
    icon: 'text-emerald-400',
  },
};

export const SlideToExecute: React.FC<SlideToExecuteProps> = ({
  onConfirm,
  label = 'ПЕРЕТЯГНІТЬ ЩОБ ВИКОНАТИ',
  confirmLabel = 'ВИКОНАНО',
  className,
  variant = 'critical',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isComplete, setIsComplete] = useState(false);
  const x = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 500, damping: 40 });

  const width = useTransform(springX, (value) => {
    const container = containerRef.current;
    if (!container) return '0%';
    const pct = (value / container.offsetWidth) * 100;
    return `${Math.min(pct, 100)}%`;
  });

  const opacity = useTransform(springX, (value) => {
    const container = containerRef.current;
    if (!container) return 0;
    return Math.min(value / (container.offsetWidth * 0.3), 1);
  });

  const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
    const container = containerRef.current;
    if (!container) return;
    const threshold = container.offsetWidth * 0.82;
    if (info.offset.x >= threshold) {
      setIsComplete(true);
      onConfirm();
      setTimeout(() => {
        setIsComplete(false);
        x.set(0);
      }, 1800);
    } else {
      x.set(0);
    }
  };

  const styles = palette[variant];

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative h-16 w-full max-w-lg select-none overflow-hidden rounded-2xl border backdrop-blur-xl',
        styles.border,
        styles.bg,
        className
      )}
    >
      {/* Заповнення */}
      <motion.div
        className={cn('absolute inset-y-0 left-0 opacity-40', styles.thumb)}
        style={{ width }}
      />

      {/* Текст */}
      <motion.div
        className={cn(
          'absolute inset-0 flex items-center justify-center text-[11px] font-black uppercase tracking-[0.35em]',
          styles.text
        )}
      >
        {isComplete ? (
          <span className="flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            {confirmLabel}
          </span>
        ) : (
          <span>{label}</span>
        )}
      </motion.div>

      {/* Thumb */}
      {!isComplete && (
        <motion.div
          drag="x"
          dragConstraints={containerRef}
          dragElastic={0.08}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          style={{ x: springX }}
          whileTap={{ scale: 0.94 }}
          className={cn(
            'absolute inset-y-1.5 left-1.5 z-10 flex h-[calc(100%-12px)] w-12 cursor-grab items-center justify-center rounded-xl shadow-lg active:cursor-grabbing',
            styles.thumb,
            styles.thumbGlow
          )}
        >
          <ShieldAlert className="h-5 w-5 text-white" />
        </motion.div>
      )}

      {/* Підказка */}
      <motion.div
        className={cn(
          'absolute right-5 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase tracking-wider',
          styles.icon
        )}
        style={{ opacity }}
      >
        Підтверджено
      </motion.div>
    </div>
  );
};

export default SlideToExecute;
