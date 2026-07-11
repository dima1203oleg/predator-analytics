/**
 * 🛰️ VERTICAL TAB NAV // ВЕРТИКАЛЬНА_НАВІГАЦІЯ_v61.0
 * PREDATOR Analytics — Elite Control Interface
 * 
 * Компонент для лівої панелі в AdminHub.
 * Використовує Glassmorphism та Framer Motion.
 * 
 * © 2026 PREDATOR Analytics
 */

import { Button } from '@/components/ui/button';
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { LucideIcon } from 'lucide-react';

interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
  category: string;
}

interface VerticalTabNavProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  accentColor?: string;
}

export const VerticalTabNav: React.FC<VerticalTabNavProps> = ({
  tabs,
  activeTab,
  onTabChange,
  accentColor = '#f59e0b' // Gold default
}) => {
  return (
    <div className="w-[280px] h-full bg-slate-950/40  border-r border-white/5 flex flex-col p-6 space-y-2 z-20">
      <div className="mb-8 px-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full " style={{ backgroundColor: accentColor }} />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
            Автономна Фабрика
          </span>
        </div>
        <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">
          Елітний <span style={{ color: accentColor }}>Контроль</span>
        </h3>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <Button variant="cyber"
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "w-full group relative flex items-center gap-4 px-6 py-5 rounded-2xl transition-all duration-500",
                isActive 
                  ? "bg-white/5  border border-white/10" 
                  : "hover:bg-white/[0.02] border border-transparent"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-indicator-v"
                  className="absolute left-0 w-1 h-8 rounded-full"
                  style={{ backgroundColor: accentColor }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
              )}

              <div className={cn(
                "p-3 rounded-xl transition-all duration-500",
                isActive 
                  ? "bg-slate-900 border border-white/10 text-white shadow-2xl" 
                  : "text-slate-500 group-hover:text-slate-300"
              )}>
                <Icon size={20} style={isActive ? { color: accentColor, filter: `drop-shadow(0 0 8px ${accentColor})` } : {}} />
              </div>

              <div className="flex flex-col items-start text-left">
                <span className={cn(
                  "text-[11px] font-black uppercase tracking-widest transition-all duration-500",
                  isActive ? "text-white" : "text-slate-500 group-hover:text-slate-400"
                )}>
                  {tab.label}
                </span>
                <span className="text-[8px] font-mono text-slate-700 uppercase tracking-tighter mt-0.5">
                  {tab.id.replace(/-/g, '_')}
                </span>
              </div>

              {isActive && (
                <div className="absolute right-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: accentColor, boxShadow: `0 0 10px ${accentColor}` }}
                  />
                </div>
              )}
            </Button>
          );
        })}
      </div>

      <div className="mt-auto pt-6 border-t border-white/5 px-4">
        <div className="flex items-center justify-between text-[9px] font-black text-slate-700 uppercase tracking-widest">
          <span>OODA 2.0 // Активний</span>
          <span className="text-emerald-500 ">Наживо</span>
        </div>
      </div>
    </div>
  );
};
