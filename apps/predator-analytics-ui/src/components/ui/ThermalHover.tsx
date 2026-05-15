/**
 * 🦅 PREDATOR v63.0-ELITE — Thermal Hover Effect
 * Термальний ефект при наведенні для тактичного фокусу.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface ThermalHoverProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
  color?: 'rose' | 'amber' | 'emerald' | 'sky';
}

export const ThermalHover: React.FC<ThermalHoverProps> = ({
  children,
  className,
  intensity = 'medium',
  color = 'rose',
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePosition({ x, y });
  };

  const colorMap = {
    rose: 'rgba(244, 63, 94,',
    amber: 'rgba(245, 158, 11,',
    emerald: 'rgba(16, 185, 129,',
    sky: 'rgba(14, 165, 233,',
  };

  const intensityMap = {
    low: { opacity: 0.1, blur: 20 },
    medium: { opacity: 0.2, blur: 30 },
    high: { opacity: 0.3, blur: 40 },
  };

  const { opacity, blur } = intensityMap[intensity];
  const baseColor = colorMap[color];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn('relative overflow-hidden', className)}
    >
      {/* Thermal Glow Effect */}
      {isHovered && (
        <motion.div
          className="absolute pointer-events-none rounded-full"
          style={{
            left: mousePosition.x,
            top: mousePosition.y,
            width: 300,
            height: 300,
            marginLeft: -150,
            marginTop: -150,
            background: `radial-gradient(circle, ${baseColor}${opacity}) 0%, transparent 70%)`,
            filter: `blur(${blur}px)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
      
      {children}
    </div>
  );
};

export default ThermalHover;
