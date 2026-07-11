/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PREDATOR Command Center — THE OBSERVATORY HUD
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { memo } from 'react';
import { LeftNavigationPanel } from './LeftNavigationPanel';
import { CognitiveAssistantPanel } from './CognitiveAssistantPanel';
import { InfrastructureStatusBar } from './InfrastructureStatusBar';
import { SpatialTimeline } from './SpatialTimeline';
import { SmartPDFOverlay } from '../../components/documents/SmartPDFOverlay';
import { TopCommandBar } from './TopCommandBar';

function CommandHUDInner() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden font-sans" style={{ zIndex: 100 }}>
      {/* CRT / Vignette Effect */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_200px_rgba(0,0,0,0.9)] z-[-1]" />

      {/* HUD Панелі */}
      <TopCommandBar />
      <LeftNavigationPanel />
      <CognitiveAssistantPanel />
      <SpatialTimeline />
      <InfrastructureStatusBar />
      <SmartPDFOverlay />
    </div>
  );
}

export const CommandHUD = memo(CommandHUDInner);
