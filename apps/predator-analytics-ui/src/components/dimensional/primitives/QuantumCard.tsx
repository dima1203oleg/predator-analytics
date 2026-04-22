import React from 'react';
import { motion } from 'framer-motion';

interface QuantumCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string; // Optional title if used like a card
  metrics?: { label: string; value: string }[];
  animated?: boolean;
}

import { cn } from '../../../lib/utils';

export const QuantumCard: React.FC<QuantumCardProps> = ({ children, className = '', title, metrics, animated = false }) => {
  return (
    <div className={cn("relative group", className)}>
      {/* Animated Glow Backdrop */}
      {animated && (
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/30 via-blue-600/30 to-cyan-600/30 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-50 transition duration-1000" />
      )}

      <div className="relative h-full bg-black/40 glass-wraith border border-white/10 rounded-[3rem] overflow-hidden backdrop-blur-2xl">
        <div className="absolute inset-0 cyber-scan-grid opacity-[0.03]" />
        
        {/* Header if title present */}
        {title && (
          <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
              <h3 className="text-sm font-black text-white italic uppercase tracking-[0.2em]">{title}</h3>
            </div>
            {metrics && (
              <div className="flex gap-6">
                {metrics.map((m, i) => (
                  <div key={i} className="text-right">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">{m.label}</p>
                    <p className="text-sm font-black text-cyan-400 italic tracking-tighter">{m.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="h-full relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
};
