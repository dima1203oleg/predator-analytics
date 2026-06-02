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
    <div className="relative flex min-h-screen bg-[#010101] text-foreground">
      {/* Header with safe area padding */}
      <div style={{ paddingTop: `calc(1rem + ${safeArea.top}px)`, paddingBottom: `calc(0.5rem + ${safeArea.bottom}px)` }}>
        <Header />
      </div>
      {/* Sidebar – narrow version */}
      <Sidebar />
      {/* Main content area */}
      <main
        className={cn(
          "flex-1 overflow-y-auto custom-scrollbar p-4",
          "bg-gradient-to-b from-[#0a0a0f] to-black"
        )}
      >
        {children}
      </main>
    </div>
  );
};

export default TabletLayout;
