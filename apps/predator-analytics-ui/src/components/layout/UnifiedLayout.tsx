import React, { useState, ReactNode, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useDisplayMode, DisplayMode } from '../../context/DisplayModeContext';
import { motion, AnimatePresence } from 'framer-motion';

import { useLocation } from 'react-router-dom';

interface UnifiedLayoutProps {
  children: ReactNode;
}

export const UnifiedLayout: React.FC<UnifiedLayoutProps> = ({ children }) => {
  const { mode } = useDisplayMode();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Responsive rules based on display mode
  const isDesktop = mode === DisplayMode.DESKTOP;
  const isTablet = mode === DisplayMode.TABLET;
  const isMobile = mode === DisplayMode.MOBILE;

  // Sidebar Layout Properties
  // Desktop: Fixed width 288px (w-72)
  // Tablet: Fixed width 80px (w-20)
  // Mobile: Hidden (0px)
  const sidebarWidth = isDesktop ? 288 : isTablet ? 80 : 0;

  // Close sidebar automatically when switching to Desktop/Tablet from Mobile
  useEffect(() => {
    if (!isMobile) setIsSidebarOpen(false);
  }, [mode]);

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-blue-500/30">

      {/* ────────────────────────────────────────────────────────── */}
      {/* SOVEREIGN AMBIENT — Щильний червоний/кримсон фон для відчуття џлітарності */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Основний градієнт — глибокий кримсон знизу ліворуч */}
        <motion.div
          className="absolute w-[55%] h-[55%] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(185,10,10,0.07) 0%, transparent 70%)',
            filter: 'blur(130px)',
            bottom: '-10%',
            left: '-8%',
          }}
          animate={{
            x: [0, 25, 0],
            y: [0, -15, 0],
            scale: [1, 1.08, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Акцентний градієнт — темно-червоний зверху праворуч */}
        <motion.div
          className="absolute w-[40%] h-[40%] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(120,5,5,0.06) 0%, transparent 70%)',
            filter: 'blur(110px)',
            top: '-5%',
            right: '-5%',
          }}
          animate={{
            x: [0, -20, 0],
            y: [0, 18, 0],
            scale: [1, 1.12, 1],
          }}
          transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Холодний синій акцент — сателітний подтекст */}
        <motion.div
          className="absolute w-[28%] h-[28%] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(5,15,80,0.04) 0%, transparent 70%)',
            filter: 'blur(90px)',
            top: '38%',
            right: '18%',
          }}
          animate={{
            x: [0, 12, -8, 0],
            y: [0, -18, 10, 0],
          }}
          transition={{ duration: 32, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Суверенна віньєтка — кінематографічна рамка */}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)' }}
        />
        {/* Тонка координатна сітка */}
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(220, 38, 38, 0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(220, 38, 38, 0.25) 1px, transparent 1px)',
            backgroundSize: '65px 65px',
          }}
        />
        {/* Мікро-сітка */}
        <div
          className="absolute inset-0 opacity-[0.012]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148, 163, 184, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.15) 1px, transparent 1px)',
            backgroundSize: '12px 12px',
          }}
        />
      </div>

      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300 relative z-10 w-full"
      >
        <TopBar onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          <div className="max-w-[1920px] mx-auto w-full h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{
                  duration: 0.3,
                  ease: [0.23, 1, 0.32, 1],
                }}
                className="h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      
    </div>
  );
};
