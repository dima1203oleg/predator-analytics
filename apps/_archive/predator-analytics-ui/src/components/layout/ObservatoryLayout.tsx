import React from 'react';
import { SidebarNav } from './SidebarNav';
import { TopBar } from './TopBar';
import { IntelligencePanel } from './IntelligencePanel';
import { TelemetryStatusBar } from './TelemetryStatusBar';
import EntityGraphView from '@/features/intelligence/EntityGraphView';

interface ObservatoryLayoutProps {
  children?: React.ReactNode;
}

export const ObservatoryLayout: React.FC<ObservatoryLayoutProps> = ({ children }) => {
  return (
    <div className="fixed inset-0 overflow-hidden bg-[#050608] text-slate-200 font-sans">
      {/* Central 3D Spatial Workspace (Background Layer) */}
      <div className="absolute inset-0 z-0">
        <EntityGraphView />
      </div>

      {/* Grid Overlay for depth effect */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik00MCAwSDBWNDBoNDBWem0tMSAxSDFWMzlzMzlWMXoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiIvPgo8L3N2Zz4=')] opacity-50 mix-blend-overlay"></div>

      {/* Main HUD Interface (Z-Index above Canvas) */}
      <div className="relative z-10 flex h-full w-full pointer-events-none">
        
        {/* Left Sidebar (Vertical Navigation) */}
        <div className="w-16 flex-shrink-0 h-full border-r border-white/5 bg-black/40 backdrop-blur-xl pointer-events-auto shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
          <SidebarNav />
        </div>

        {/* Center Column (Top Bar + Dynamic Children Workspace) */}
        <div className="flex-1 flex flex-col h-full relative">
          
          {/* Top Global Toolbar */}
          <div className="h-14 border-b border-white/5 bg-black/40 backdrop-blur-xl pointer-events-auto flex items-center shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
            <TopBar />
          </div>

          {/* Children Space (for GlassDocumentPanels or other Overlays) */}
          <div className="flex-1 relative overflow-hidden pointer-events-none p-4">
            {children}
          </div>

          {/* Bottom Telemetry Status Bar */}
          <div className="h-8 border-t border-white/5 bg-black/60 backdrop-blur-2xl pointer-events-auto flex items-center px-4 shadow-[0_-4px_24px_rgba(0,0,0,0.5)]">
            <TelemetryStatusBar />
          </div>
        </div>

        {/* Right Sidebar (AI Intelligence Module) */}
        <div className="w-80 flex-shrink-0 h-full border-l border-white/5 bg-black/40 backdrop-blur-xl pointer-events-auto shadow-[-4px_0_24px_rgba(0,0,0,0.5)] flex flex-col">
          <IntelligencePanel />
        </div>

      </div>
    </div>
  );
};
