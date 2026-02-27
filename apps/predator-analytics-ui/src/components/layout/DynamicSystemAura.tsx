import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { api } from '../../services/api';

type AZRState = 'idle' | 'learning' | 'evolving' | 'alert';

const DynamicSystemAura: React.FC = () => {
  const [systemState, setSystemState] = useState<AZRState>('idle');
  const controls = useAnimation();

  // Real-time Aura state from backend
  useEffect(() => {
    const fetchState = async () => {
      try {
        const metrics = await api.v45.getRealtimeMetrics();
        if (metrics) {
            if (metrics.cpu_usage > 70) setSystemState('alert');
            else if (metrics.requests_per_second > 20) setSystemState('learning');
            else if (metrics.memory_usage > 50) setSystemState('evolving');
            else setSystemState('idle');
        }
      } catch (e) {
        setSystemState('idle');
      }
    };
    fetchState();
    const interval = setInterval(fetchState, 10000);
    return () => clearInterval(interval);
  }, []);

  const isHighLoad = systemState === 'alert' || systemState === 'learning';

  const getColors = () => {
    switch (systemState) {
      case 'learning': return ['rgba(16, 185, 129, 0.4)', 'rgba(59, 130, 246, 0.2)']; // Green-Blue
      case 'evolving': return ['rgba(139, 92, 246, 0.4)', 'rgba(236, 72, 153, 0.2)']; // Purple-Pink
      case 'alert': return ['rgba(239, 68, 68, 0.4)', 'rgba(245, 158, 11, 0.2)'];    // Red-Orange
      default: return ['rgba(59, 130, 246, 0.3)', 'rgba(30, 41, 59, 0.1)'];        // Default Blue-Slate
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-slate-950">
      {/* Primary Glow */}
      <motion.div
        animate={{
          scale: isHighLoad ? [1.2, 1.4, 1.2] : [1, 1.2, 1],
          opacity: isHighLoad ? [0.5, 0.7, 0.5] : [0.3, 0.5, 0.3],
          x: [0, 50, -50, 0],
          y: [0, -30, 30, 0],
        }}
        transition={{ duration: isHighLoad ? 5 : 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full blur-[150px]"
        style={{ background: `radial-gradient(circle, ${colors[0]} 0%, transparent 70%)` }}
      />

      {/* Secondary Pulse */}
      <motion.div
        animate={{
          scale: [1.3, 1.1, 1.3],
          opacity: [0.2, 0.4, 0.2],
          rotate: [0, 180, 360],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-30%] right-[-10%] w-[90%] h-[90%] rounded-full blur-[180px]"
        style={{ background: `radial-gradient(circle, ${colors[1]} 0%, transparent 70%)` }}
      />

      {/* Cyber Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.1]"
        style={{
          backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />
    </div>
  );
};

export default DynamicSystemAura;
