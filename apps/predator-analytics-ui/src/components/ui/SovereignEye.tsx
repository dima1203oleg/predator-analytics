/**
 * 👁️ Sovereign Eye — Ambient Background Reacts to System Health
- Колір ambient glow змінюється відповідно до system health
- Pulse кожні 60 секунд — "heartbeat" по всьому UI
- Alert mode: весь viewport отримує red tint + scan speed increase
 */
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

type HealthLevel = 'healthy' | 'warning' | 'critical' | 'offline';

interface SovereignEyeProps {
  health: HealthLevel;
  className?: string;
}

const healthConfig: Record<HealthLevel, { color: string; opacity: number; pulseSpeed: number }> = {
  healthy: { color: 'rgba(78, 205, 196, 0.08)', opacity: 0.4, pulseSpeed: 60 },
  warning: { color: 'rgba(201, 162, 39, 0.12)', opacity: 0.6, pulseSpeed: 30 },
  critical: { color: 'rgba(225, 29, 72, 0.15)', opacity: 0.8, pulseSpeed: 15 },
  offline: { color: 'rgba(90, 90, 90, 0.05)', opacity: 0.3, pulseSpeed: 0 },
};

export const SovereignEye: React.FC<SovereignEyeProps> = ({ health, className }) => {
  const [isPulsing, setIsPulsing] = useState(false);
  const config = healthConfig[health];

  // Heartbeat pulse кожні pulseSpeed секунд
  useEffect(() => {
    if (config.pulseSpeed === 0) return;

    const interval = setInterval(() => {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 2000);
    }, config.pulseSpeed * 1000);

    return () => clearInterval(interval);
  }, [config.pulseSpeed]);

  return (
    <>
      {/* Ambient glow overlay */}
      <motion.div
        className={cn('fixed inset-0 pointer-events-none z-[2]', className)}
        style={{
          background: `radial-gradient(600px circle at 50% 50%, ${config.color}, transparent 70%)`,
        }}
        animate={{
          opacity: isPulsing ? config.opacity * 1.5 : config.opacity,
        }}
        transition={{ duration: 1 }}
      />

      {/* Critical alert mode — red tint overlay */}
      {health === 'critical' && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-[3]"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 60%, rgba(225,29,72,0.1) 100%)',
          }}
          animate={{
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Scan speed increase для critical */}
      {health === 'critical' && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-[4]"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(225,29,72,0.03) 2px, rgba(225,29,72,0.03) 4px)',
          }}
          animate={{
            backgroundPosition: ['0 0', '0 100vh'],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
    </>
  );
};

export default SovereignEye;
