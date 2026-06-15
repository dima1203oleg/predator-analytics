import React from 'react';
import '../styles/neon-grid.css';
import { 
  VerificationPanel, 
  ActiveProcesses, 
  ChatAssistant, 
  ConsoleCommands, 
  RiskMapPanel, 
  PriceAnomalies,
  MissionControlPanel,
  DOMIntelligencePanel
} from './Panels';
import { Canvas } from '@react-three/fiber';
import { CyberAvatar } from '../nexus/components/CyberAvatar';

const CognitiveInterface = () => {
  return (
    <div className="cognitive-grid">
      {/* Header */}
      <div className="cognitive-header">
        <span>🦾 PREDATOR ANALYTICS</span>
        <span>
          СИСТЕМА: <span className="neon-text">ОНЛАЙН</span>
        </span>
        <span style={{ fontSize: '12px' }}>
          Генерація | Тест | Супервізія <span className="neon-text">Real-Time</span>
        </span>
      </div>

      {/* Ліва колонка */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', height: '100%' }}>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <MissionControlPanel />
          <DOMIntelligencePanel />
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <VerificationPanel />
        </div>
        <div style={{ height: '280px', flexShrink: 0 }}>
          <ActiveProcesses />
        </div>
      </div>

      {/* Центральна колонка */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', height: '100%' }}>
        <div style={{ flex: 1, minHeight: 0, position: 'relative', border: '1px solid var(--neon-cyan)', background: '#000808' }}>
          <div className="cognitive-panel-header" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>AI COGNITIVE AVATAR</div>
          <div style={{ position: 'absolute', inset: 0, top: '24px' }}>
            <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[0, 2, 5]} intensity={1} />
              <React.Suspense fallback={null}>
                <CyberAvatar />
              </React.Suspense>
            </Canvas>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <ChatAssistant />
        </div>
        <div style={{ height: '280px', flexShrink: 0 }}>
          <ConsoleCommands />
        </div>
      </div>

      {/* Права колонка */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', height: '100%' }}>
        <div style={{ flex: 1, minHeight: 0 }}>
          <RiskMapPanel />
        </div>
        <div style={{ height: '280px', flexShrink: 0 }}>
          <PriceAnomalies />
        </div>
      </div>
    </div>
  );
};

export default CognitiveInterface;
