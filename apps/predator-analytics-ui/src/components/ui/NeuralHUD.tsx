/**
 * 🧠 NEURAL HUD // ГЛОБАЛЬНИЙ ІНТЕРФЕЙС ОВЕРЛЕЮ | v63.0-ELITE
 * PREDATOR Analytics — Sovereign Tactical Overlay
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface NeuralHUDProps {
  status?: 'operational' | 'degraded' | 'critical';
  accent?: string;
  children?: React.ReactNode;
}

export const NeuralHUD: React.FC<NeuralHUDProps> = ({ 
  status = 'operational', 
  accent = 'rose',
  children 
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden select-none">
      {/* ── CORNER ACCENTS — Кутові елементи тактичного інтерфейсу ── */}
      <div className="absolute inset-8 border-[1px] border-white/5 opacity-40">
        {/* Top Left */}
        <div className="absolute top-[-2px] left-[-2px] w-12 h-12 border-t-2 border-l-2 border-rose-500/60" />
        <div className="absolute top-2 left-2 w-4 h-4 border-t-[1px] border-l-[1px] border-white/20" />
        
        {/* Top Right */}
        <div className="absolute top-[-2px] right-[-2px] w-12 h-12 border-t-2 border-r-2 border-rose-500/60" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-[1px] border-r-[1px] border-white/20" />
        
        {/* Bottom Left */}
        <div className="absolute bottom-[-2px] left-[-2px] w-12 h-12 border-b-2 border-l-2 border-rose-500/60" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-[1px] border-l-[1px] border-white/20" />
        
        {/* Bottom Right */}
        <div className="absolute bottom-[-2px] right-[-2px] w-12 h-12 border-b-2 border-r-2 border-rose-500/60" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-[1px] border-r-[1px] border-white/20" />
      </div>

      {/* ── SIDE DATA STREAMS — Бічні потоки даних ── */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-20">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-1 h-8 bg-rose-500/40 rounded-full" />
        ))}
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-20">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-1 h-8 bg-rose-500/40 rounded-full" />
        ))}
      </div>

      {/* ── SCANLINE OVERLAY — Скануюча лінія ── */}
      <motion.div 
        animate={{ top: ['-10%', '110%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-[2px] bg-rose-500/10 blur-[1px] z-10"
      />

      {/* ── VIGNETTE & GRAIN — Віньєтка та шум ── */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0)_0%,rgba(0,0,0,0.5)_100%)]" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* ── SYSTEM TELEMETRY — Системна телеметрія в кутах ── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-12 text-[10px] font-black tracking-[0.4em] text-white/30 uppercase italic">
         <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-rose-500 " />
            SOVEREIGN_LINK: ESTABLISHED
         </div>
         <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-rose-500 " />
            VRAM_NODE: 5.8GB / 8GB
         </div>
         <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-rose-500 " />
            OODA_SYNC: 14MS
         </div>
      </div>

      {children}
    </div>
  );
};
