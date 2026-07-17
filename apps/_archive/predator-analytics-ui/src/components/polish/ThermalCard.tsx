/**
 * ThermalCard — Термальний hover-ефект на картках ризику
 * v63.0-ELITE · CSS radial-gradient tracking · No JS per-frame
 */
import React, { ReactNode, useRef, useState, useCallback } from 'react';
import { cn } from '@/utils/cn';
import { useUISound, UISoundType } from '@/hooks/useUISound';

interface ThermalCardProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
  glowColor?: string;
}

export const ThermalCard: React.FC<ThermalCardProps> = ({
  children,
  className,
  intensity = 1,
  glowColor = 'rgba(225, 29, 72, 0.15)',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 50, y: 50, active: false });
  const { play } = useUISound();

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPos({ x, y, active: true });
    play(UISoundType.HOVER, 120);
  }, [play]);

  const handleMouseLeave = useCallback(() => {
    setPos(prev => ({ ...prev, active: false }));
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/[0.04] bg-black/80 transition-all duration-500",
        className
      )}
      style={{
        background: pos.active
          ? `radial-gradient(circle at ${pos.x}% ${pos.y}%, ${glowColor} 0%, transparent 60%), rgba(0,0,0,0.8)`
          : 'rgba(0,0,0,0.8)',
        boxShadow: pos.active
          ? `0 0 ${40 * intensity}px ${glowColor}, 0 0 ${80 * intensity}px transparent`
          : 'none',
        transform: pos.active ? 'scale(1.005)' : 'scale(1)',
      }}
    >
      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.03) 2px,rgba(255,255,255,0.03) 4px)' }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default ThermalCard;
