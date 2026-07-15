/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PREDATOR Command Center — THE OBSERVATORY HUD
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { memo } from 'react';
import { SidebarNav } from '../../components/layout/SidebarNav';
import { IntelligencePanel } from '../../components/layout/IntelligencePanel';
import { TelemetryStatusBar } from '../../components/layout/TelemetryStatusBar';
import { SpatialTimeline } from './SpatialTimeline';
import { SmartPDFOverlay } from '../../components/documents/SmartPDFOverlay';
import { TopBar } from '../../components/layout/TopBar';

function CommandHUDInner() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden font-sans text-slate-200" style={{ zIndex: 100 }}>
      {/* Grid Overlay for depth effect */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik00MCAwSDBWNDBoNDBWem0tMSAxSDFWMzlzMzlWMXoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiIvPgo8L3N2Zz4=')] opacity-50 mix-blend-overlay"></div>

      {/* Vignette Effect */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_200px_rgba(0,0,0,0.9)] z-[1]" />

      <div className="relative z-10 flex h-full w-full pointer-events-none">
        {/* Left Sidebar */}
        <div className="w-16 flex-shrink-0 h-full border-r border-white/5 bg-black/40 backdrop-blur-xl pointer-events-auto shadow-[4px_0_24px_rgba(0,0,0,0.5)] z-20">
          <SidebarNav />
        </div>

        <div className="flex-1 flex flex-col h-full relative">
          {/* Top Global Toolbar */}
          <div className="h-14 border-b border-white/5 bg-black/40 backdrop-blur-xl pointer-events-auto flex items-center shadow-[0_4px_24px_rgba(0,0,0,0.5)] z-20">
            <TopBar />
          </div>

          <div className="flex-1 relative overflow-hidden pointer-events-none p-4">
            {/* Center Area logic like Timeline and Overlays */}
            <SpatialTimeline />
            <SmartPDFOverlay />
          </div>

          {/* Bottom Telemetry Status Bar */}
          <div className="h-8 border-t border-white/5 bg-black/60 backdrop-blur-2xl pointer-events-auto flex items-center px-4 shadow-[0_-4px_24px_rgba(0,0,0,0.5)] z-20">
            <TelemetryStatusBar />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 flex-shrink-0 h-full border-l border-white/5 bg-black/40 backdrop-blur-xl pointer-events-auto shadow-[-4px_0_24px_rgba(0,0,0,0.5)] flex flex-col z-20">
          <IntelligencePanel />
        </div>
      </div>
    </div>
  );
}

export const CommandHUD = memo(CommandHUDInner);
