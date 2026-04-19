import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface HubTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

/**
 * HubTabs - Тактичні таби у стилі WRAITH для навігації всередині хабів.
 * Використовує Framer Motion для плавних переходів індикатора.
 */
export const HubTabs: React.FC<HubTabsProps> = ({ 
  tabs, 
  activeTab, 
  onChange, 
  className 
}) => {
  return (
    <div className={cn("flex items-center gap-2 p-1 bg-slate-950/40 backdrop-blur-md border border-slate-800/50 rounded-xl", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-300 rounded-lg outline-none",
              isActive ? "text-amber-400" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            )}
          >
            {tab.icon && (
              <span className={cn("transition-transform duration-300", isActive && "scale-110")}>
                {tab.icon}
              </span>
            )}
            <span className="relative z-10">{tab.label}</span>
            
            {isActive && (
              <motion.div
                layoutId="hub-active-tab"
                className="absolute inset-0 border border-amber-500/30 bg-amber-500/5 rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                initial={false}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
