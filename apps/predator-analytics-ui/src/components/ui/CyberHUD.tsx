import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

// Базовий скляний контейнер із кібер-стилізацією
export const CyberPanel: React.FC<HTMLMotionProps<"div"> & { noPadding?: boolean }> = ({ 
  children, 
  className = '', 
  noPadding = false,
  ...props 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`
        relative overflow-hidden
        bg-black/40 backdrop-blur-md 
        border border-cyan-500/30 
        shadow-[0_0_15px_rgba(6,182,212,0.15)]
        ${noPadding ? '' : 'p-6'}
        ${className}
      `}
      {...props}
    >
      {/* Декоративні куточки */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-400" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyan-400" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyan-400" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-400" />
      
      {/* Легкий сканлайн ефект поверх панелі */}
      <div className="absolute inset-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9InRyYW5zcGFyZW50Ii8+PHBhdGggZD0iTTAgMEwwIDRNMiAwTDIgNCIgc3Ryb2tlPSIjMGFmZiIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')] opacity-30" />
      
      <div className="relative z-10">
        {children as React.ReactNode}
      </div>
    </motion.div>
  );
};

export const CyberButton: React.FC<HTMLMotionProps<"button"> & { variant?: string; size?: string }> = ({ children, className = '', variant, size, ...props }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(6,182,212,0.6)' }}
      whileTap={{ scale: 0.95 }}
      className={`
        relative px-6 py-2 
        bg-cyan-950/50 border border-cyan-500/50 
        text-cyan-400 font-medium uppercase tracking-wider
        hover:bg-cyan-900/80 hover:text-cyan-300
        transition-colors duration-300
        ${className}
      `}
      {...props}
    >
      <div className="absolute inset-0 bg-cyan-400/10 blur-sm opacity-0 hover:opacity-100 transition-opacity" />
      <span className="relative z-10">{children as React.ReactNode}</span>
    </motion.button>
  );
};

export const CyberInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => {
  return (
    <div className="relative w-full">
      <input 
        className={`
          w-full bg-black/50 border-b-2 border-cyan-500/50 
          px-4 py-3 text-cyan-50 placeholder-cyan-700
          focus:outline-none focus:border-cyan-400 focus:bg-cyan-950/30
          transition-all duration-300
          ${className}
        `}
        {...props}
      />
      <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-cyan-300 transition-all duration-500 peer-focus:w-full" />
    </div>
  );
};
