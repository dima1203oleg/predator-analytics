/**
 * 📡 HUB LAYOUT // ЦЕНТРАЛЬНИЙ МАКЕТ ХАБУ | v63.0-ELITE
 * PREDATOR Analytics — Unified Tactical Navigation Matrix
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn'; // Fixed import path to @/utils/cn
import { HubTabs } from './HubTabs';
import { NavAccent, navAccentStyles } from '@/config/navigation';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { NeuralPulse } from '@/components/ui/NeuralPulse';

interface HubLayoutProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  accent?: NavAccent;
}

export const HubLayout: React.FC<HubLayoutProps> = ({
  title,
  subtitle,
  icon,
  tabs,
  activeTab,
  onTabChange,
  children,
  actions,
  className,
  accent = 'rose'
}) => {
  const styles = navAccentStyles[accent];

  // Мапінг для тіней та градієнтів
  const shadowMap: Record<NavAccent, string> = {
    gold: "shadow-[0_0_60px_rgba(245,158,11,0.25)]",
    amber: "shadow-[0_0_60px_rgba(217,119,6,0.25)]",
    warn: "shadow-[0_0_60px_rgba(249,115,22,0.25)]",
    slate: "shadow-[0_0_60px_rgba(148,163,184,0.25)]",
    blue: "shadow-[0_0_60px_rgba(59,130,246,0.25)]",
    indigo: "shadow-[0_0_60px_rgba(99,102,241,0.25)]",
    rose: "shadow-[0_0_60px_rgba(225,29,72,0.25)]",
    sky: "shadow-[0_0_60px_rgba(14,165,233,0.25)]",
    emerald: "shadow-[0_0_60px_rgba(16,185,129,0.25)]",
    cyan: "shadow-[0_0_60px_rgba(6,182,212,0.25)]",
    violet: "shadow-[0_0_60px_rgba(139,92,246,0.25)]"
  };

  const pulseColorMap: Record<NavAccent, string> = {
    rose: 'rgba(244, 63, 94, 0.04)',
    gold: 'rgba(245, 158, 11, 0.04)',
    sky: 'rgba(14, 165, 233, 0.04)',
    indigo: 'rgba(129, 140, 248, 0.04)',
    amber: 'rgba(217, 119, 6, 0.04)',
    emerald: 'rgba(16, 185, 129, 0.04)',
    cyan: 'rgba(6, 182, 212, 0.04)',
    violet: 'rgba(139, 92, 246, 0.04)',
    blue: 'rgba(59, 130, 246, 0.04)',
    warn: 'rgba(249, 115, 22, 0.04)',
    slate: 'rgba(148, 163, 184, 0.04)',
  };

  return (
    <div className={cn("flex flex-col w-full min-h-screen bg-[#020202] text-slate-200 relative overflow-hidden", className)}>
      <AdvancedBackground mode={accent === 'rose' || accent === 'gold' ? 'sovereign' : 'standard'} />
      <CyberGrid opacity={0.04} />
      <NeuralPulse color={pulseColorMap[accent]} size={1800} />
      
      {/* Dynamic Scan Line Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-20">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-rose-500/50 to-transparent animate-scan" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0)_0%,rgba(0,0,0,0.4)_100%)]" />
      </div>

      {/* ═══════════════════════════════════════════════
         HUB HEADER — Tactical Navigation Control
         ═══════════════════════════════════════════════ */}
      <header className="flex flex-col gap-6 p-8 lg:p-12 border-b border-white/5 bg-black/40 backdrop-blur-3xl relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
          <div className="flex items-center gap-10">
            {icon && (
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 2 }}
                className={cn(
                  "flex items-center justify-center w-20 h-20 rounded-[2.5rem] border-2 transition-all duration-700 bg-black/60 backdrop-blur-xl group",
                  styles.iconBorder,
                  styles.icon,
                  shadowMap[accent]
                )}
              >
                {React.cloneElement(icon as React.ReactElement, { size: 40, className: "drop-shadow-[0_0_20px_currentColor] group-hover:scale-110 transition-transform" })}
              </motion.div>
            )}
            <div>
              <div className="flex items-center gap-4 mb-3">
                <div className={cn("h-2 w-2 rounded-full animate-pulse shadow-[0_0_12px_currentColor]", styles.icon)} />
                <span className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-500 italic leading-none opacity-60">
                  PREDATOR_SYSTEM // {accent.toUpperCase()}_MATRIX_v63.0
                </span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic leading-none skew-x-[-3deg]">
                <span className={cn("glint-elite chromatic-elite", styles.icon)}>{title}</span>
              </h1>
              {subtitle && (
                <div className="mt-6 flex items-center gap-6">
                   <div className="h-0.5 w-12 bg-white/10" />
                   <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.4em] italic leading-none opacity-80">
                     {subtitle}
                   </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {actions}
          </div>
        </div>

        {/* Tactical Tab Bar */}
        <div className="flex items-center justify-start mt-4 pt-4 border-t border-white/5">
          <HubTabs 
            tabs={tabs} 
            activeTab={activeTab} 
            onChange={onTabChange} 
            accent={accent}
          />
        </div>
      </header>

      {/* ═══════════════════════════════════════════════
         MAIN CONTENT ARENA
         ═══════════════════════════════════════════════ */}
      <main className="flex-1 p-8 lg:p-12 overflow-hidden relative z-10 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20, filter: 'blur(20px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -20, filter: 'blur(20px)' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full flex-1"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Bottom Tactical Accents */}
      <div className="fixed bottom-0 left-0 right-0 h-[2px] z-50 pointer-events-none overflow-hidden">
         <motion.div 
           animate={{ x: ['-100%', '100%'] }}
           transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
           className={cn("h-full w-1/3 bg-gradient-to-r from-transparent via-rose-500/50 to-transparent", styles.icon.replace('text-', 'bg-'))}
         />
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .glint-elite {
          background: linear-gradient(135deg, #fff 0%, #fff 45%, #ffffff99 50%, #fff 55%, #fff 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: glint 6s infinite linear;
        }
        @keyframes glint {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes scan {
          0% { top: -10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 110%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 10s infinite linear;
        }
        .chromatic-elite {
          text-shadow: 2px 0 10px rgba(244, 63, 94, 0.3), -2px 0 10px rgba(129, 140, 248, 0.3);
        }
      `}} />
    </div>
  );
};
