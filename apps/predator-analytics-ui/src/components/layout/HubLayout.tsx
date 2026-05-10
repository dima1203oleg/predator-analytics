/**
 * 📡 HUB LAYOUT // ЦЕНТРАЛЬНИЙ МАКЕТ ХАБУ | v63.0-ELITE
 * PREDATOR Analytics — Unified Tactical Navigation Matrix
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { HubTabs } from './HubTabs';
import { NavAccent, navAccentStyles } from '@/config/navigation';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { NeuralPulse } from '@/components/ui/NeuralPulse';
import { NeuralHUD } from '@/components/ui/NeuralHUD';

interface HubLayoutProps {
  title: string;
  subtitle?: string;
  /** Короткий рядок над заголовком (бізнес-фокус замість технічного коду). */
  eyebrow?: string;
  /** Додатковий абзац звичайним регістром — для керівників і неаналітиків. */
  businessCaption?: string;
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
  eyebrow,
  businessCaption,
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

  return (
    <div className={cn("flex flex-col w-full min-h-screen bg-[#020202] text-slate-200 relative overflow-hidden", className)}>
      {/* ── BACKGROUND LAYERS — Базові шари фону ── */}
      <CyberGrid opacity={0.04} />
      
      {/* ── HUB HEADER — Tactical Navigation Control ── */}
      <header className="flex flex-col gap-6 p-8 lg:p-12 border-b border-white/5 bg-[rgba(15,15,17,0.97)] relative z-20 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
          <div className="flex items-center gap-10">
            {icon && (
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 2 }}
                className={cn(
                  "flex items-center justify-center w-24 h-24 rounded-[2.5rem] border-2 transition-all duration-700 bg-[rgba(20,20,22,0.95)] group relative",
                  styles.iconBorder,
                  styles.icon,
                )}
              >
                {React.cloneElement(icon as React.ReactElement, { size: 48, className: "group-hover:scale-105 transition-transform relative z-10" })}
              </motion.div>
            )}
            <div>
              <div className="flex items-center gap-4 mb-3">
                <div className={cn("h-2 w-2 rounded-full", styles.icon)} />
                <span className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500 italic leading-none opacity-80">
                  {eyebrow ?? 'Робочий простір · аналітика та рішення для бізнесу'}
                </span>
              </div>
              <h1 className="text-6xl font-black tracking-tighter text-white uppercase italic leading-none skew-x-[-3deg]">
                <span className={cn(styles.icon)}>{title}</span>
              </h1>
              {subtitle && (
                <div className="mt-6 flex items-center gap-6">
                   <div className="h-0.5 w-16 bg-white/10" />
                   <p className="text-slate-400 text-[12px] font-black uppercase tracking-[0.4em] italic leading-none opacity-80">
                     {subtitle}
                   </p>
                </div>
              )}
              {businessCaption && (
                <p className="mt-5 max-w-4xl text-sm font-medium leading-relaxed text-slate-400 normal-case not-italic tracking-normal">
                  {businessCaption}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {actions}
          </div>
        </div>

        {/* Tactical Tab Bar */}
        <div className="flex items-center justify-start mt-6 pt-6 border-t border-white/5">
          <HubTabs 
            tabs={tabs} 
            activeTab={activeTab} 
            onChange={onTabChange} 
            accent={accent}
          />
        </div>
      </header>

      {/* ── MAIN CONTENT ARENA ── */}
      <main className="flex-1 p-8 lg:p-12 overflow-hidden relative z-10 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full flex-1"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Bottom Tactical Accents */}
      <div className="fixed bottom-0 left-0 right-0 h-[2px] z-50 pointer-events-none bg-[rgba(196,18,48,0.2)]" />
      
    </div>
  );
};

