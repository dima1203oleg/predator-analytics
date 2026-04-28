import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { HubTabs } from './HubTabs';
import { NavAccent, navAccentStyles } from '@/config/navigation';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';

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

/**
 * 📡 HUB LAYOUT // ЦЕНТ� АЛЬНИЙ МАКЕТ ХАБУ | v58.2-WRAITH
 * PREDATOR Analytics — Unified Navigation Matrix
 */
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

  // Мапінг акцентів на базові кольори Tailwind для динамічних класів
  const colorMap: Record<NavAccent, string> = {
    gold: 'amber',
    amber: 'amber',
    warn: 'orange',
    slate: 'slate',
    blue: 'blue',
    indigo: 'indigo',
    rose: 'rose',
    sky: 'sky',
    emerald: 'emerald',
    cyan: 'cyan',
    violet: 'violet'
  };

  const baseColor = colorMap[accent];

  // Мапінг для тіней та градієнтів
  const shadowMap: Record<NavAccent, string> = {
    gold: "shadow-[0_0_40px_rgba(245,158,11,0.2)]",
    amber: "shadow-[0_0_40px_rgba(217,119,6,0.2)]",
    warn: "shadow-[0_0_40px_rgba(249,115,22,0.2)]",
    slate: "shadow-[0_0_40px_rgba(148,163,184,0.2)]",
    blue: "shadow-[0_0_40px_rgba(59,130,246,0.2)]",
    indigo: "shadow-[0_0_40px_rgba(99,102,241,0.2)]",
    rose: "shadow-[0_0_40px_rgba(225,29,72,0.2)]",
    sky: "shadow-[0_0_40px_rgba(14,165,233,0.2)]",
    emerald: "shadow-[0_0_40px_rgba(16,185,129,0.2)]",
    cyan: "shadow-[0_0_40px_rgba(6,182,212,0.2)]",
    violet: "shadow-[0_0_40px_rgba(139,92,246,0.2)]"
  };

  const viaColorClass = {
    gold: 'via-amber-500/30',
    amber: 'via-amber-600/30',
    warn: 'via-orange-500/30',
    slate: 'via-slate-500/30',
    blue: 'via-blue-500/30',
    indigo: 'via-indigo-500/30',
    rose: 'via-rose-500/30',
    sky: 'via-sky-500/30',
    emerald: 'via-emerald-500/30',
    cyan: 'via-cyan-500/30',
    violet: 'via-violet-500/30'
  }[accent];

  return (
    <div className={cn("flex flex-col w-full min-h-screen bg-[#020202] text-slate-200 relative overflow-hidden", className)}>
      <AdvancedBackground mode={accent === 'rose' || accent === 'gold' ? 'sovereign' : 'standard'} />
      <CyberGrid opacity={0.03} />
      
      {/* Dynamic Scan Line */}
      <motion.div 
        initial={{ top: '-100%' }}
        animate={{ top: '200%' }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-[500px] bg-gradient-to-b from-transparent via-white/[0.03] to-transparent pointer-events-none z-0"
      />

      {/* Заголовок хабу */}
      <header className="flex flex-col gap-8 p-8 lg:p-12 border-b border-white/5 bg-black/40 backdrop-blur-3xl relative z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
          <div className="flex items-center gap-10">
            {icon && (
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 2 }}
                className={cn(
                  "flex items-center justify-center w-20 h-20 rounded-[2rem] border-2 transition-all duration-700 bg-black/60 backdrop-blur-xl",
                  styles.iconBorder,
                  styles.icon,
                  shadowMap[accent]
                )}
              >
                {React.cloneElement(icon as React.ReactElement, { size: 40, className: "drop-shadow-[0_0_15px_currentColor]" })}
              </motion.div>
            )}
            <div>
              <div className="flex items-center gap-4 mb-3">
                <span className={cn("w-2 h-2 rounded-full animate-pulse shadow-[0_0_10px_currentColor]", styles.icon)} />
                <span className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-500 italic leading-none">
                  PREDATOR_HUB // MATRIX_v58.2
                </span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic leading-none">
                <span className={cn("glint-elite chromatic-elite", styles.icon)}>{title}</span>
              </h1>
              {subtitle && (
                <p className="text-slate-500 text-[12px] font-black uppercase tracking-[0.4em] mt-6 italic border-l-4 border-white/10 pl-8 opacity-80 leading-none">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {actions}
          </div>
        </div>

        {/* Навігація хабу */}
        <div className="flex items-center justify-start mt-4">
          <HubTabs 
            tabs={tabs} 
            activeTab={activeTab} 
            onChange={onTabChange} 
            accent={accent}
          />
        </div>
      </header>

      {/* Основна область контенту */}
      <main className="flex-1 p-8 lg:p-12 overflow-hidden relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20, filter: 'blur(15px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, filter: 'blur(15px)' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Нижня декоративна полоса */}
      <div className={cn(
        "h-[2px] w-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-30 fixed bottom-0 left-0 z-50",
        viaColorClass
      )} />
      
      <style dangerouslySetInnerHTML={{ __html: `
        .glint-elite {
          background: linear-gradient(135deg, #fff 0%, #fff 45%, #ffffff66 50%, #fff 55%, #fff 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: glint 8s infinite linear;
        }
        @keyframes glint {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}} />
    </div>
  );
};

