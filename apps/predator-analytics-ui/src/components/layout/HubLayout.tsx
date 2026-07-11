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
import { CyberGrid } from '@/components/CyberGrid';
import { useViewport } from '@/hooks/useViewport';

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
  const { isCompact, isMedium } = useViewport();

  return (
    <div className={cn("flex flex-col w-full min-h-screen bg-transparent text-slate-200 relative overflow-hidden", className)}>
      {/* ── BACKGROUND LAYERS — Базові шари фону ── */}
      <CyberGrid opacity={0.04} />
      
      {/* ── HUB HEADER — Tactical Navigation Control ── */}
      <header className={cn(
        "flex flex-col border-b border-white/5 bg-black/20 backdrop-blur-md relative z-20 shadow-[0_8px_32px_rgba(0,0,0,0.6)]",
        isCompact ? "gap-3 p-4" : isMedium ? "gap-4 p-6" : "gap-6 p-8 lg:p-12"
      )}>

        <div className={cn(
          "flex justify-between relative z-10",
          isCompact ? "flex-col gap-4" : isMedium ? "flex-col gap-5" : "flex-col lg:flex-row lg:items-center gap-8"
        )}>
          <div className={cn("flex items-center", isCompact ? "gap-4" : isMedium ? "gap-6" : "gap-10")}>
            {/* Іконка — адаптивний розмір */}
            {icon && (
              <motion.div 
                whileHover={isCompact ? undefined : { scale: 1.05, rotate: 2 }}
                className={cn(
                  "flex items-center justify-center rounded-[2.5rem] border-2 transition-all duration-700 bg-[rgba(20,20,22,0.95)] group relative shrink-0",
                  isCompact ? "w-12 h-12 rounded-2xl" : isMedium ? "w-16 h-16 rounded-[1.5rem]" : "w-24 h-24",
                  styles.iconBorder,
                  styles.icon,
                )}
              >
                {React.cloneElement(
                  icon as React.ReactElement, 
                  { 
                    size: isCompact ? 24 : isMedium ? 32 : 48, 
                    className: "group-hover:scale-105 transition-transform relative z-10" 
                  }
                )}
              </motion.div>
            )}
            <div className="min-w-0">
              {/* Eyebrow — приховано на телефоні */}
              {!isCompact && (
                <div className="flex items-center gap-4 mb-3">
                  <div className={cn("h-2 w-2 rounded-full", styles.icon)} />
                  <span className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500 italic leading-none opacity-80">
                    {eyebrow ?? 'Робочий простір · аналітика та рішення для бізнесу'}
                  </span>
                </div>
              )}
              {/* Заголовок — адаптивний розмір */}
              <h1 className={cn(
                "font-black tracking-tighter text-white uppercase italic leading-none",
                isCompact 
                  ? "text-xl" 
                  : isMedium 
                    ? "text-3xl skew-x-[-2deg]" 
                    : "text-6xl skew-x-[-3deg]"
              )}>
                <span className={cn(styles.icon)}>{title}</span>
              </h1>
              {/* Subtitle — тільки планшет і десктоп */}
              {subtitle && !isCompact && (
                <div className={cn("flex items-center gap-6", isMedium ? "mt-3" : "mt-6")}>
                   <div className="h-0.5 w-16 bg-white/10" />
                   <p className={cn(
                     "text-slate-400 font-black uppercase italic leading-none opacity-80",
                     isMedium ? "text-[11px] tracking-[0.3em]" : "text-[12px] tracking-[0.4em]"
                   )}>
                     {subtitle}
                   </p>
                </div>
              )}
              {/* Business caption — тільки десктоп */}
              {businessCaption && !isCompact && !isMedium && (
                <p className="mt-5 max-w-4xl text-sm font-medium leading-relaxed text-slate-400 normal-case not-italic tracking-normal">
                  {businessCaption}
                </p>
              )}
            </div>
          </div>
          
          {/* Actions — тільки десктоп */}
          {actions && !isCompact && (
            <div className="flex items-center gap-6 shrink-0">
              {actions}
            </div>
          )}
        </div>

        {/* Tactical Tab Bar — адаптивний */}
        <div className={cn(
          "flex items-center justify-start",
          isCompact ? "mt-1 -mx-4 px-4" : isMedium ? "mt-3 pt-3 border-t border-white/5 -mx-6 px-6" : "mt-6 pt-6 border-t border-white/5"
        )}>
          <HubTabs 
            tabs={tabs} 
            activeTab={activeTab} 
            onChange={onTabChange} 
            accent={accent}
          />
        </div>
      </header>

      {/* ── MAIN CONTENT ARENA ── */}
      <main className={cn(
        "flex-1 overflow-hidden relative z-10 flex flex-col",
        isCompact ? "p-3" : isMedium ? "p-5" : "p-8 lg:p-12"
      )}>
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

