/**
 * 🔮 HOLOGRAPHIC GLASS CARD | PREDATOR v61.0-ELITE
 * Glassmorphism з holographic ефектами, що перевищує Palantir
 * - Динамічний blur та transparency
 * - Holographic gradient borders
 * - Interactive glow effects
 * - Depth layering
 */
import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/utils/cn';

interface HoloGlassCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'subtle' | 'medium' | 'intense';
  glowColor?: 'rose' | 'emerald' | 'sky' | 'amber' | 'violet';
  interactive?: boolean;
  depth?: number;
}

export const HoloGlassCard: React.FC<HoloGlassCardProps> = ({
  children,
  className = '',
  intensity = 'medium',
  glowColor = 'rose',
  interactive = true,
  depth = 3
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [depth, -depth]), {
    stiffness: 300,
    damping: 30
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-depth, depth]), {
    stiffness: 300,
    damping: 30
  });

  const glowColors = {
    rose: 'rgba(225, 29, 72, 0.6)',
    emerald: 'rgba(16, 185, 129, 0.6)',
    sky: 'rgba(14, 165, 233, 0.6)',
    amber: 'rgba(245, 158, 11, 0.6)',
    violet: 'rgba(139, 92, 246, 0.6)'
  };

  const intensityStyles = {
    subtle: {
      blur: 'backdrop-blur-sm',
      opacity: 'bg-white/5',
      border: 'border-white/10'
    },
    medium: {
      blur: 'backdrop-blur-md',
      opacity: 'bg-white/8',
      border: 'border-white/15'
    },
    intense: {
      blur: 'backdrop-blur-xl',
      opacity: 'bg-white/10',
      border: 'border-white/20'
    }
  };

  const currentStyle = intensityStyles[intensity];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    setMousePosition({ x, y });
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={cn(
        'relative rounded-2xl overflow-hidden',
        currentStyle.blur,
        currentStyle.opacity,
        currentStyle.border,
        'border',
        className
      )}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d'
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      whileHover={interactive ? { scale: 1.02 } : {}}
      transition={{ duration: 0.3 }}
    >
      {/* Holographic gradient overlay */}
      <motion.div
        className="absolute inset-0 opacity-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x * 100 + 50}% ${mousePosition.y * 100 + 50}%, ${glowColors[glowColor]}, transparent 70%)`,
          opacity: isHovered ? 0.4 : 0
        }}
        animate={{ opacity: isHovered ? 0.4 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Animated border gradient */}
      <div className="absolute inset-0 rounded-2xl opacity-20">
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: `conic-gradient(from 0deg, transparent, ${glowColors[glowColor]}, transparent 30%)`,
            animation: 'spin 8s linear infinite'
          }}
        />
      </div>

      {/* Inner glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0"
        style={{
          background: `radial-gradient(circle at center, ${glowColors[glowColor]}, transparent 80%)`,
          opacity: isHovered ? 0.15 : 0
        }}
        animate={{ opacity: isHovered ? 0.15 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Content */}
      <div className="relative z-10" style={{ transform: 'translateZ(20px)' }}>
        {children}
      </div>

      {/* Reflection effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 pointer-events-none"
        animate={{ opacity: isHovered ? 0.3 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
};

export default HoloGlassCard;
