import React from 'react';
import { motion } from 'framer-motion';

interface QuantumCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string; // Optional title if used like a card
  metrics?: { label: string; value: string }[];
  animated?: boolean;
}

export const QuantumCard: React.FC<QuantumCardProps> = ({ children, className = '', title, metrics, animated = false }) => {
  return (
    <div className={`relative group ${className}`}>
      {/* Animated Border Gradient */}
      {animated && (
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-[32px] blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt" />
      )}

      <div className="relative h-full bg-slate-900 border border-slate-700/50 rounded-[32px]  backdrop-blur-xl">
        {/* Header if title present */}
        {title && (
          <div className="px-6 py-4 border-b border-slate-800/50 flex justify-between items-center bg-white/5">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">{title}</h3>
            {metrics && (
              <div className="flex gap-4">
                {metrics.map((m, i) => (
                  <div key={i} className="text-right">
                    <p className="text-[10px] text-slate-400">{m.label}</p>
                    <p className="text-xs font-mono text-cyan-400">{m.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="h-full">
          {children}
        </div>
      </div>
    </div>
  );
};
