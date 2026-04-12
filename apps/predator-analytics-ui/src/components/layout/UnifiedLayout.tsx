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

      {/* Багатошаровий Ambient Glow — динамічний, пульсуючий фон */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Основний градієнт — теплий блакитний */}
        <motion.div
          className="absolute w-[50%] h-[50%] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
            filter: 'blur(100px)',
            top: '-5%',
            left: '-5%',
          }}
          animate={{
            x: [0, 30, 0],
            y: [0, 20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        {/* Акцентний градієнт — індіго */}
        <motion.div
          className="absolute w-[45%] h-[45%] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 70%)',
            filter: 'blur(120px)',
            bottom: '-8%',
            right: '-5%',
          }}
          animate={{
            x: [0, -25, 0],
            y: [0, -15, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        {/* Додатковий акцент — ціан, менший */}
        <motion.div
          className="absolute w-[30%] h-[30%] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.05) 0%, transparent 70%)',
            filter: 'blur(80px)',
            top: '40%',
            right: '20%',
          }}
          animate={{
            x: [0, 15, -10, 0],
            y: [0, -20, 10, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        {/* Тонка сітка — дає тактильну текстуру */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148, 163, 184, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.4) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
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
