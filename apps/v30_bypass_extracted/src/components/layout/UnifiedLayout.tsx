import React, { useState, ReactNode, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useDisplayMode, DisplayMode } from '../../context/DisplayModeContext';
import { motion } from 'framer-motion';

interface UnifiedLayoutProps {
  children: ReactNode;
}

export const UnifiedLayout: React.FC<UnifiedLayoutProps> = ({ children }) => {
  const { mode } = useDisplayMode();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

      {/* Background Ambient Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full" />
      </div>

      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCompact={isTablet}
      />

      {/* Main Content Area */}
      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300 relative z-10"
        style={{ marginLeft: isMobile ? 0 : sidebarWidth }}
      >
        <TopBar onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          <div className="max-w-[1920px] mx-auto w-full h-full">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};
