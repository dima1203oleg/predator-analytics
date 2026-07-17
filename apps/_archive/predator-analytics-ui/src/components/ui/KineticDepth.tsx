/**
 * 🦅 PREDATOR v63.0-ELITE — Kinetic Depth Effect
 * Кінетична глибина для 3D паралакс ефектів при русі миші.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface KineticDepthProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  perspective?: number;
}

export const KineticDepth: React.FC<KineticDepthProps> = ({
  children,
  className,
  intensity = 15,
  perspective = 1000,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;

      const rotateX = (mouseY / (rect.height / 2)) * -intensity;
      const rotateY = (mouseX / (rect.width / 2)) * intensity;

      element.style.transform = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const handleMouseLeave = () => {
      if (element) {
        element.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg)`;
      }
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [intensity, perspective]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'transition-transform duration-200 ease-out',
        className
      )}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
    </motion.div>
  );
};

export default KineticDepth;
