import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { NavAccent, navAccentStyles } from '@/config/navigation';

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
  accent?: NavAccent;
}

/**
 * HubTabs - Тактичні таби у стилі WRAITH для навігації всередині хабів.
 * Використовує Framer Motion для плавних переходів індикатора.
 */
export const HubTabs: React.FC<HubTabsProps> = ({ 
  tabs, 
  activeTab, 
  onChange, 
  className,
  accent = 'rose'
}) => {
  const styles = navAccentStyles[accent];

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
              isActive ? styles.icon : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
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
                className={cn(
                  "absolute inset-0 border rounded-lg",
                  styles.sectionBorder,
                  "bg-white/5 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                )}
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
