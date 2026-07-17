import { Button } from '@/components/ui/button';
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { NavAccent, navAccentStyles } from '@/config/navigation';
import { useViewport } from '@/hooks/useViewport';

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
 * HubTabs - Тактичні таби у стилі ELITE для навігації всередині хабів.
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
  const { isCompact, isMedium } = useViewport();

  return (
    <div className={cn(
      "flex items-center bg-slate-950/60 border border-slate-800/50 rounded-xl overflow-x-auto no-scrollbar w-full",
      isCompact ? "gap-2 p-1.5" : "gap-2 p-1",
      className
    )}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        
        return (
          <Button variant="cyber"
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex items-center justify-center gap-2 font-medium transition-colors duration-300 rounded-lg outline-none shrink-0 whitespace-nowrap",
              isCompact 
                ? "min-h-[52px] px-5 py-3 text-xs flex-1" 
                : isMedium 
                  ? "min-h-[44px] px-4 py-2.5 text-sm" 
                  : "px-4 py-2 text-sm",
              isActive ? styles.icon : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            )}
          >
            {tab.icon && (
              <span className={cn("transition-transform duration-300 flex-shrink-0", isActive && "scale-110")}>
                {tab.icon}
              </span>
            )}
            <span className="relative z-10">{tab.label}</span>
            
            {isActive && (
              <motion.div
                layoutId="hub-active-tab"
                className={cn(
                  "absolute inset-0 border rounded-lg pointer-events-none",
                  styles.sectionBorder,
                  "bg-white/5"
                )}
                initial={false}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </Button>
        );
      })}
    </div>
  );
};
