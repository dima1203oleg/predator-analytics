import React from 'react';
import '../styles/neon-grid.css';
import { 
  VerificationPanel, 
  ActiveProcesses, 
  ChatAssistant, 
  ConsoleCommands, 
  RiskMapPanel, 
  PriceAnomalies 
} from './Panels';

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
        <div style={{ flex: 1, minHeight: 0 }}>
          <VerificationPanel />
        </div>
        <div style={{ height: '280px', flexShrink: 0 }}>
          <ActiveProcesses />
        </div>
      </div>

      {/* Центральна колонка */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', height: '100%' }}>
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
