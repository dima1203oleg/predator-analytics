import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { HubTabs } from './HubTabs';
import { NavAccent, navAccentStyles } from '@/config/navigation';

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
 * HubLayout - Базовий макет для консолідованих аналітичних хабів.
 * Забезпечує єдину структуру заголовка, табів та контенту.
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
    sky: 'sky'
  };

  const baseColor = colorMap[accent];

  // Мапінг для тіней та градієнтів
  const shadowMap: Record<NavAccent, string> = {
    gold: "shadow-[0_0_20px_rgba(245,158,11,0.15)]",
    amber: "shadow-[0_0_20px_rgba(217,119,6,0.15)]",
    warn: "shadow-[0_0_20px_rgba(249,115,22,0.15)]",
    slate: "shadow-[0_0_20px_rgba(148,163,184,0.15)]",
    blue: "shadow-[0_0_20px_rgba(59,130,246,0.15)]",
    indigo: "shadow-[0_0_20px_rgba(99,102,241,0.15)]",
    rose: "shadow-[0_0_20px_rgba(225,29,72,0.15)]",
    sky: "shadow-[0_0_20px_rgba(14,165,233,0.15)]"
  };

  const viaColorClass = {
    gold: 'via-amber-500/20',
    amber: 'via-amber-600/20',
    warn: 'via-orange-500/20',
    slate: 'via-slate-500/20',
    blue: 'via-blue-500/20',
    indigo: 'via-indigo-500/20',
    rose: 'via-rose-500/20',
    sky: 'via-sky-500/20'
  }[accent];

  return (
    <div className={cn("flex flex-col w-full min-h-screen bg-transparent", className)}>
      {/* Заголовок хабу */}
      <header className="flex flex-col gap-6 p-6 lg:p-8 border-b border-white/5 bg-slate-950/20 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {icon && (
              <div className={cn(
                "flex items-center justify-center w-12 h-12 rounded-xl border transition-all duration-500",
                styles.iconBorder,
                styles.icon,
                shadowMap[accent]
              )}>
                {icon}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white uppercase italic">
                <span className={styles.icon}>PREDATOR</span> {title}
              </h1>
              {subtitle && (
                <p className="text-slate-400 text-sm font-medium tracking-wide uppercase mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {actions}
          </div>
        </div>

        {/* Навігація хабу */}
        <div className="flex items-center justify-start">
          <HubTabs 
            tabs={tabs} 
            activeTab={activeTab} 
            onChange={onTabChange} 
            accent={accent}
          />
        </div>
      </header>

      {/* Основна область контенту */}
      <main className="flex-1 p-6 lg:p-8 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Нижня декоративна полоса */}
      <div className={cn(
        "h-1 w-full bg-gradient-to-r from-transparent to-transparent opacity-50",
        viaColorClass
      )} />
    </div>
  );
};
