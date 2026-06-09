/**
 * ✨ MICRO INTERACTION CARD | PREDATOR v61.0-ELITE
 * Micro-interactions та hover states
 * Перевишує Palantir: magnetic effects, ripple animations, particle bursts
 */
import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface MicroInteractionCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'glass' | 'neon';
  hoverEffect?: 'lift' | 'glow' | 'magnetic' | 'ripple' | 'particle';
  onClick?: () => void;
}

export const MicroInteractionCard: React.FC<MicroInteractionCardProps> = ({
  children,
  className = '',
  variant = 'default',
  hoverEffect = 'lift',
  onClick
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [ripplePositions, setRipplePositions] = useState<{ x: number; y: number; id: number }[]>([]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [3, -3]), {
    stiffness: 300,
    damping: 30
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-3, 3]), {
    stiffness: 300,
    damping: 30
  });

  const { playHover, playClick } = useSoundEffects();

  const variantStyles = {
    default: 'bg-slate-900/50 border-slate-700/50',
    elevated: 'bg-slate-800/80 border-slate-600/50 shadow-2xl',
    glass: 'bg-white/5 backdrop-blur-xl border-white/10',
    neon: 'bg-black border-rose-500/50 shadow-[0_0_30px_rgba(225,29,72,0.3)]'
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    setMousePosition({ x, y });
    mouseX.set(x);
    mouseY.set(y);

    if (hoverEffect === 'magnetic') {
      const magnetStrength = 20;
      const moveX = x * magnetStrength;
      const moveY = y * magnetStrength;
      ref.current.style.transform = `translate(${moveX}px, ${moveY}px)`;
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);

    if (hoverEffect === 'magnetic' && ref.current) {
      ref.current.style.transform = 'translate(0, 0)';
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    playHover();
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    playClick();

    if (hoverEffect === 'ripple') {
      const rect = ref.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const newRipple = { x, y, id: Date.now() };
        setRipplePositions(prev => [...prev, newRipple]);

        setTimeout(() => {
          setRipplePositions(prev => prev.filter(r => r.id !== newRipple.id));
        }, 600);
      }
    }

    if (hoverEffect === 'particle') {
      // Create particle burst effect
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        const velocity = 100;
        const particle = document.createElement('div');
        particle.className = 'absolute w-2 h-2 bg-rose-500 rounded-full pointer-events-none';
        particle.style.left = `${mousePosition.x * 100 + 50}%`;
        particle.style.top = `${mousePosition.y * 100 + 50}%`;
        particle.style.transition = 'all 0.5s ease-out';
        
        if (ref.current) {
          ref.current.appendChild(particle);
          
          requestAnimationFrame(() => {
            particle.style.transform = `translate(${Math.cos(angle) * velocity}px, ${Math.sin(angle) * velocity}px)`;
            particle.style.opacity = '0';
          });

          setTimeout(() => {
            particle.remove();
          }, 500);
        }
      }
    }

    onClick?.();
  };

  return (
    <motion.div
      ref={ref}
      className={cn(
        'relative rounded-2xl border-2 overflow-hidden cursor-pointer transition-all duration-300',
        variantStyles[variant],
        className
      )}
      style={{
        rotateX: hoverEffect === 'lift' ? rotateX : 0,
        rotateY: hoverEffect === 'lift' ? rotateY : 0,
        transformStyle: 'preserve-3d'
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      whileHover={hoverEffect === 'lift' ? { scale: 1.02, y: -5 } : {}}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {/* Glow effect */}
      {hoverEffect === 'glow' && (
        <motion.div
          className="absolute inset-0 opacity-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x * 100 + 50}% ${mousePosition.y * 100 + 50}%, rgba(225,29,72,0.4), transparent 70%)`,
            opacity: isHovered ? 0.6 : 0
          }}
          animate={{ opacity: isHovered ? 0.6 : 0 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Ripple effect */}
      {hoverEffect === 'ripple' && ripplePositions.map(ripple => (
        <motion.div
          key={ripple.id}
          className="absolute rounded-full bg-rose-500/30 pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 0,
            height: 0
          }}
          animate={{
            width: 400,
            height: 400,
            x: -200,
            y: -200,
            opacity: [0.5, 0]
          }}
          transition={{ duration: 0.6 }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 p-6" style={{ transform: 'translateZ(10px)' }}>
        {children}
      </div>

      {/* Border glow for neon variant */}
      {variant === 'neon' && isHovered && (
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-rose-500"
          animate={{
            boxShadow: [
              '0 0 20px rgba(225,29,72,0.3)',
              '0 0 40px rgba(225,29,72,0.6)',
              '0 0 20px rgba(225,29,72,0.3)'
            ]
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
};

export default MicroInteractionCard;
