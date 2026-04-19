import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { HubTabs } from './HubTabs';

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
  className
}) => {
  return (
    <div className={cn("flex flex-col w-full min-h-screen bg-transparent", className)}>
      {/* Заголовок хабу */}
      <header className="flex flex-col gap-6 p-6 lg:p-8 border-b border-white/5 bg-slate-950/20 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {icon && (
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                {icon}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white uppercase italic">
                <span className="text-amber-500">PREDATOR</span> {title}
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
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-amber-500/20 to-transparent opacity-50" />
    </div>
  );
};
