/**
 * 💎 HoloCard — Holographic Data Tile з procedural glow edge
 * Perspective tilt від mouse position, animated gradient border
 */
import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/utils/cn';

interface HoloCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gold' | 'rose' | 'teal';
  glowColor?: string; // Custom hex/rgba for glow edge
  glow?: boolean;
  tilt?: boolean;
  onClick?: () => void;
  as?: keyof JSX.IntrinsicElements;
}

const variantMap = {
  default: 'from-[#8a8a8a] via-white to-[#8a8a8a]',
  gold: 'from-[#c9a227] via-[#e8e8e8] to-[#c9a227]',
  rose: 'from-[#e11d48] via-white to-[#e11d48]',
  teal: 'from-[#4ecdc4] via-white to-[#4ecdc4]',
};

export const HoloCard: React.FC<HoloCardProps> = ({
  children,
  className,
  variant = 'default',
  glowColor,
  glow = true,
  tilt = true,
  onClick,
  as: Component = 'div',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 300 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current || !tilt) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  const MotionComponent = motion[Component as 'div'] || motion.div;

  return (
    <MotionComponent
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: tilt ? rotateX : 0,
        rotateY: tilt ? rotateY : 0,
        transformStyle: 'preserve-3d',
      }}
      className={cn(
        'relative rounded-xl glass-obsidian overflow-hidden',
        onClick && 'cursor-pointer',
        className
      )}
      whileHover={onClick ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* Procedural glow edge — animated gradient border */}
      <motion.div
        className="absolute inset-0 rounded-xl opacity-0 pointer-events-none"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, transparent 300deg, ${glowColor || (variant === 'gold' ? 'rgba(201,162,39,0.4)' : variant === 'rose' ? 'rgba(225,29,72,0.4)' : 'rgba(138,138,138,0.4)')} 360deg)`,
        }}
        animate={{
          opacity: isHovered && glow ? 1 : 0,
          rotate: isHovered ? 360 : 0,
        }}
        transition={{
          opacity: { duration: 0.2 },
          rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
        }}
      />

      {/* Inner content container */}
      <div className="relative z-10 h-full">
        {children}
      </div>

      {/* Inner shadow for depth */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), inset 0 -1px 0 rgba(0,0,0,0.3)',
        }}
      />
    </MotionComponent>
  );
};

export default HoloCard;
