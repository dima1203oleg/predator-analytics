/**
 * 🔥 THERMAL BUTTON | PREDATOR v61.0-ELITE
 * Thermal hover ефекти з glow анімацією
 * Перевищує Palantir: теплові сенсори, динамічні кольори, particle trails
 */
import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/utils/cn';

interface ThermalButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const ThermalButton: React.FC<ThermalButtonProps> = ({
  children,
  onClick,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), {
    stiffness: 300,
    damping: 30
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), {
    stiffness: 300,
    damping: 30
  });

  const variantStyles = {
    primary: {
      base: 'bg-gradient-to-br from-rose-600 to-rose-800',
      hover: 'hover:from-rose-500 hover:to-rose-700',
      glow: 'shadow-[0_0_30px_rgba(225,29,72,0.5)]',
      hoverGlow: 'hover:shadow-[0_0_50px_rgba(225,29,72,0.8)]',
      border: 'border-rose-400/30'
    },
    secondary: {
      base: 'bg-gradient-to-br from-slate-700 to-slate-900',
      hover: 'hover:from-slate-600 hover:to-slate-800',
      glow: 'shadow-[0_0_30px_rgba(71,85,105,0.5)]',
      hoverGlow: 'hover:shadow-[0_0_50px_rgba(71,85,105,0.8)]',
      border: 'border-slate-500/30'
    },
    danger: {
      base: 'bg-gradient-to-br from-red-600 to-red-900',
      hover: 'hover:from-red-500 hover:to-red-800',
      glow: 'shadow-[0_0_30px_rgba(220,38,38,0.5)]',
      hoverGlow: 'hover:shadow-[0_0_50px_rgba(220,38,38,0.8)]',
      border: 'border-red-400/30'
    },
    success: {
      base: 'bg-gradient-to-br from-emerald-600 to-emerald-800',
      hover: 'hover:from-emerald-500 hover:to-emerald-700',
      glow: 'shadow-[0_0_30px_rgba(16,185,129,0.5)]',
      hoverGlow: 'hover:shadow-[0_0_50px_rgba(16,185,129,0.8)]',
      border: 'border-emerald-400/30'
    }
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const currentVariant = variantStyles[variant];
  const currentSize = sizeStyles[size];

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;

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
    <motion.button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative overflow-hidden rounded-xl font-bold text-white transition-all duration-300',
        'border-2',
        currentVariant.base,
        currentVariant.hover,
        currentVariant.glow,
        currentVariant.hoverGlow,
        currentVariant.border,
        currentSize,
        disabled && 'opacity-50 cursor-not-allowed',
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
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {/* Thermal gradient overlay */}
      <motion.div
        className="absolute inset-0 opacity-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x * 100 + 50}% ${mousePosition.y * 100 + 50}%, rgba(255,255,255,0.3), transparent 70%)`,
          opacity: isHovered ? 0.6 : 0
        }}
        animate={{ opacity: isHovered ? 0.6 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Heat map effect */}
      <motion.div
        className="absolute inset-0 opacity-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x * 100 + 50}% ${mousePosition.y * 100 + 50}%, ${variant === 'danger' ? 'rgba(255,0,0,0.4)' : 'rgba(255,100,0,0.4)'}, transparent 80%)`,
          opacity: isHovered ? 0.8 : 0
        }}
        animate={{ opacity: isHovered ? 0.8 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Content */}
      <span className="relative z-10" style={{ transform: 'translateZ(10px)' }}>
        {children}
      </span>

      {/* Particle trail effect */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${mousePosition.x * 100 + 50}%`,
                top: `${mousePosition.y * 100 + 50}%`,
                boxShadow: '0 0 10px rgba(255,255,255,0.8)'
              }}
              animate={{
                x: (Math.random() - 0.5) * 50,
                y: (Math.random() - 0.5) * 50,
                opacity: [1, 0],
                scale: [1, 0]
              }}
              transition={{
                duration: 0.5,
                delay: i * 0.1
              }}
            />
          ))}
        </motion.div>
      )}
    </motion.button>
  );
};

export default ThermalButton;
