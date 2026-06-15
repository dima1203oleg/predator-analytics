import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface SciFiPanelProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  accentColor?: 'emerald' | 'red' | 'yellow' | 'cyan';
}

export const SciFiPanel = ({
  children,
  title,
  className = '',
  accentColor = 'emerald',
}: SciFiPanelProps) => {
  const [hovered, setHovered] = useState(false);

  const COLOR = {
    emerald: {
      border: 'border-emerald-500/20',
      glow: 'shadow-[0_0_0px_rgba(16,185,129,0.0)]',
      glowHover: 'shadow-[0_0_20px_rgba(16,185,129,0.12)]',
      corner: 'border-emerald-400',
      title: 'text-emerald-400',
      scan: 'rgba(16,185,129,0.03)',
    },
    red: {
      border: 'border-red-500/20',
      glow: 'shadow-[0_0_0px_rgba(239,68,68,0.0)]',
      glowHover: 'shadow-[0_0_20px_rgba(239,68,68,0.12)]',
      corner: 'border-red-400',
      title: 'text-red-400',
      scan: 'rgba(239,68,68,0.03)',
    },
    yellow: {
      border: 'border-yellow-500/20',
      glow: 'shadow-[0_0_0px_rgba(234,179,8,0.0)]',
      glowHover: 'shadow-[0_0_20px_rgba(234,179,8,0.12)]',
      corner: 'border-yellow-400',
      title: 'text-yellow-400',
      scan: 'rgba(234,179,8,0.03)',
    },
    cyan: {
      border: 'border-cyan-500/20',
      glow: 'shadow-[0_0_0px_rgba(6,182,212,0.0)]',
      glowHover: 'shadow-[0_0_20px_rgba(6,182,212,0.12)]',
      corner: 'border-cyan-400',
      title: 'text-cyan-400',
      scan: 'rgba(6,182,212,0.03)',
    },
  }[accentColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        relative bg-[#050a12]/80 backdrop-blur-xl border ${COLOR.border}
        transition-shadow duration-500
        ${hovered ? COLOR.glowHover : COLOR.glow}
        p-4 overflow-hidden group ${className}
      `}
      style={{
        clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
      }}
    >
      {/* ── Scanline overlay ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 z-0"
        style={{
          backgroundImage: `linear-gradient(transparent 50%, ${COLOR.scan} 50%)`,
          backgroundSize: '100% 4px',
        }}
      />

      {/* ── Animated top-scan beam ── */}
      <motion.div
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        className="absolute left-0 right-0 h-[1px] pointer-events-none z-10 opacity-10"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor === 'emerald' ? '#10b981' : accentColor === 'red' ? '#ef4444' : '#eab308'}, transparent)` }}
      />

      {/* ── Hover glow inner ── */}
      <motion.div
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        className="absolute inset-0 pointer-events-none bg-gradient-to-br from-emerald-500/[0.04] via-transparent to-transparent z-0"
      />

      {/* ── Corner brackets ── */}
      {/* top-left */}
      <div className={`absolute top-0 left-0 w-3 h-3 border-t-[1.5px] border-l-[1.5px] ${COLOR.corner} opacity-70`} />
      {/* top-right */}
      <div className={`absolute top-0 right-3 w-3 h-3 border-t-[1.5px] border-r-[1.5px] ${COLOR.corner} opacity-70`} />
      {/* bottom-right */}
      <div className={`absolute bottom-3 right-0 w-3 h-3 border-b-[1.5px] border-r-[1.5px] ${COLOR.corner} opacity-70`} />
      {/* bottom-left */}
      <div className={`absolute bottom-0 left-3 w-3 h-3 border-b-[1.5px] border-l-[1.5px] ${COLOR.corner} opacity-70`} />

      {/* ── Title ── */}
      {title && (
        <div className="mb-3 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className={`inline-block w-1.5 h-1.5 rounded-full shadow-[0_0_6px_currentColor] ${accentColor === 'red' ? 'bg-red-400 text-red-400' : 'bg-emerald-400 text-emerald-400'}`}
            />
            <h3 className={`text-[9px] font-black tracking-[0.3em] uppercase ${COLOR.title}`}>
              {title}
            </h3>
          </div>
          {/* Три крапки-статус */}
          <div className="flex gap-[3px]">
            {[0, 100, 200].map(d => (
              <motion.span
                key={d}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: d / 1000 }}
                className={`w-1 h-1 rounded-full ${accentColor === 'red' ? 'bg-red-400' : 'bg-emerald-400'}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div className="relative z-10 h-full flex flex-col">
        {children}
      </div>
    </motion.div>
  );
};
