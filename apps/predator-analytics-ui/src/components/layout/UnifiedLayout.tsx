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
    <div className="flex min-h-screen bg-[#050508] text-slate-200 font-sans selection:bg-rose-500/30 overflow-hidden">

      {/* ────────────────────────────────────────────────────────── */}
      {/* SOVEREIGN AMBIENT — ELITE CINEMATIC BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Main Neural Core Glow */}
        <motion.div
          className="absolute w-[65%] h-[65%] rounded-full opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(225,29,72,0.12) 0%, transparent 70%)',
            filter: 'blur(160px)',
            bottom: '-15%',
            left: '-10%',
          }}
          animate={{
            x: [0, 40, 0],
            y: [0, -30, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Secondary Intel Flow */}
        <motion.div
          className="absolute w-[45%] h-[45%] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(159,18,57,0.08) 0%, transparent 70%)',
            filter: 'blur(120px)',
            top: '-10%',
            right: '-10%',
          }}
          animate={{
            x: [0, -35, 0],
            y: [0, 25, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* HUD Scan Grid - Primary */}
        <div
          className="absolute inset-0 opacity-[0.03] cyber-scan-grid"
          style={{
            backgroundImage:
              'linear-gradient(rgba(225, 29, 72, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(225, 29, 72, 0.3) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />

        {/* Micro-Telemetry Grid */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />

        {/* Vignette - Cinematic Border */}
        <div
          className="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,0.8)]"
          style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)' }}
        />
        
        {/* Dynamic Scan Line */}
        <motion.div 
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/10 to-transparent z-10"
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
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
