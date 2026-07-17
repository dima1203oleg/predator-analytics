/**
 * 📺 CRT Filter Component
 * 
 * Глобальний CRT ефект для всього інтерфейсу
 * згідно з технічною специфікацією PREDATOR
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function CRTFilter({ children }: { children: React.ReactNode }) {
  const [glitchActive, setGlitchActive] = useState(false);
  
  // Випадковий glitch ефект кожні 10-15 секунд
  useEffect(() => {
    const triggerGlitch = () => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 150);
    };
    
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        triggerGlitch();
      }
    }, 12000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <motion.div
      animate={glitchActive ? {
        skewX: [-2, 2, -1, 1, 0],
        opacity: [0.9, 1.0, 0.95, 0.9, 1.0],
      } : {}}
      transition={{ duration: 0.15 }}
      className="relative min-h-screen"
    >
      {/* CRT Overlay */}
      <div className="crt-overlay fixed inset-0 pointer-events-none z-50">
        {/* Scanlines */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.15) 0px, rgba(0, 0, 0, 0.15) 1px, transparent 1px, transparent 3px)',
          pointerEvents: 'none',
        }} />
        
        {/* Vignette */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(circle, transparent 50%, rgba(0, 0, 0, 0.4) 100%)',
          pointerEvents: 'none',
        }} />
        
        {/* Phosphor glow */}
        <div className="absolute inset-0" style={{
          boxShadow: 'inset 0 0 100px rgba(0, 240, 255, 0.03)',
          pointerEvents: 'none',
        }} />
        
        {/* Subtle flicker */}
        <div className="absolute inset-0 animate-crt-flicker opacity-10" style={{
          pointerEvents: 'none',
        }} />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
