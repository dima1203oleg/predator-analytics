import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useViewport } from '@/hooks/useViewport';
import Header from './Header';
import Sidebar from './Sidebar';

interface TabletLayoutProps {
  children: React.ReactNode;
}

// Tablet layout – medium viewports. Shows a persistent sidebar (narrow) and top header.
export const TabletLayout: React.FC<TabletLayoutProps> = ({ children }) => {
  const { safeArea } = useViewport();
  const location = useLocation();
  const navigate = useNavigate();

  // For tablet we keep sidebar always open (compact mode) and render main content.
  return (
    <div className="relative flex min-h-screen bg-[#010101] text-foreground overflow-hidden">
      {/* Sidebar – narrow version */}
      <Sidebar />
      
      <div className="relative z-10 flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header with safe area padding */}
        <div style={{ paddingTop: `calc(0.5rem + ${safeArea.top}px)`, paddingBottom: '0.5rem' }}>
          <Header />
        </div>
        
        {/* Main content area */}
        <main
          className={cn(
            "flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-8",
            "bg-gradient-to-b from-[#0a0a0f] to-black"
          )}
        >
          <div className="max-w-[1024px] mx-auto w-full transition-all duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TabletLayout;
