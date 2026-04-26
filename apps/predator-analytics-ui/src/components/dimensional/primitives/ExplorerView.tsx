import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CyberGrid } from '@/components/CyberGrid';

interface ExplorerViewProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * 🛰 EXPLORER VIEW // ПРОВІДНИК ДАНИХ | v61.0-ELITE
 * PREDATOR Analytics — Immersive Data Environment
 */
export const ExplorerView: React.FC<ExplorerViewProps> = ({ children, className }) => {
  return (
    <div className={cn(
      "w-full h-full min-h-[500px] relative overflow-hidden rounded-[4rem] border-2 border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.8)] bg-[#020202]",
      className
    )}>
      {/* Cinematic Background Layers */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_70%)]" />
      <CyberGrid opacity={0.03} />
      
      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-noise" />

      {/* Dynamic HUD Lines */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
      <div className="absolute top-0 left-20 w-px h-full bg-gradient-to-b from-transparent via-blue-500/10 to-transparent" />
      <div className="absolute top-0 right-20 w-px h-full bg-gradient-to-b from-transparent via-blue-500/10 to-transparent" />

      {/* Holographic Corners */}
      <div className="absolute top-10 left-10 w-10 h-10 border-t-2 border-l-2 border-blue-500/20 rounded-tl-2xl" />
      <div className="absolute top-10 right-10 w-10 h-10 border-t-2 border-r-2 border-blue-500/20 rounded-tr-2xl" />
      <div className="absolute bottom-10 left-10 w-10 h-10 border-b-2 border-l-2 border-blue-500/20 rounded-bl-2xl" />
      <div className="absolute bottom-10 right-10 w-10 h-10 border-b-2 border-r-2 border-blue-500/20 rounded-br-2xl" />

      {/* Scanline Animation */}
      <motion.div 
        initial={{ top: '-10%' }}
        animate={{ top: '110%' }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-px bg-blue-500/20 blur-sm pointer-events-none"
      />

      <div className="relative z-10 w-full h-full p-12 overflow-auto custom-scrollbar">
        {children}
      </div>
    </div>
  );
};

