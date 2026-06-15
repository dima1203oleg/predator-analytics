import React, { Suspense, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import './styles/neon-grid.css';
import {
  VerificationPanel,
  ActiveProcesses,
  RiskMapPanel,
  PriceAnomalies,
  MissionControlPanel,
  DOMIntelligencePanel,
} from './components/Panels';
import { CyberAvatar } from '../nexus/components/CyberAvatar';
import { HUD } from '../nexus/components/HUD';
import { useAudioAnalyser } from '../../hooks/useAudioAnalyser';
import { useLocalAI } from '../../hooks/useLocalAI';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
  show: { 
    opacity: 1, 
    y: 0, 
    filter: 'blur(0px)',
    transition: { type: "spring", stiffness: 260, damping: 20 } 
  }
};

const CognitiveInterface = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { analyser, initAnalyser } = useAudioAnalyser();

  // Створення прихованого аудіо-тегу в DOM для Web Audio API
  useEffect(() => {
    const el = document.createElement("audio");
    el.crossOrigin = "anonymous";
    audioRef.current = el;
    return () => {
      el.remove();
    };
  }, []);

  const { chatHistory, isProcessing, systemStatus, submitCommand } = useLocalAI(
    audioRef.current,
    initAnalyser
  );

  return (
    <motion.div 
      className="cognitive-grid"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div className="cognitive-header" variants={itemVariants}>
        <span>🦾 PREDATOR ANALYTICS</span>
        <span>
          СИСТЕМА: <span className="neon-text">ОНЛАЙН</span>
        </span>
        <span style={{ fontSize: '12px' }}>
          Генерація | Тест | Супервізія <span className="neon-text">Real-Time</span>
        </span>
      </motion.div>

      {/* Ліва колонка */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
        <motion.div variants={itemVariants} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <MissionControlPanel />
          <DOMIntelligencePanel />
        </motion.div>
        <motion.div variants={itemVariants} style={{ flex: 1, minHeight: 0 }}>
          <VerificationPanel />
        </motion.div>
        <motion.div variants={itemVariants} style={{ height: '280px', flexShrink: 0 }}>
          <ActiveProcesses />
        </motion.div>
      </div>

      {/* Центральна колонка — 3D Аватар + HUD */}
      <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
        <div style={{ flex: 1, minHeight: 0, position: 'relative', border: 'var(--panel-border)', background: 'var(--bg-glass)', borderRadius: '6px', overflow: 'hidden' }}>
          <div className="cognitive-panel-header" style={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 20 }}>
            AI COGNITIVE AVATAR
          </div>

          <div style={{ position: 'absolute', inset: 0, top: '40px' }}>
            <CyberAvatar audioAnalyser={analyser} systemStatus={systemStatus} />
            <HUD 
              chatHistory={chatHistory} 
              isProcessing={isProcessing} 
              systemStatus={systemStatus} 
              onSubmit={submitCommand} 
            />
          </div>
        </div>
      </motion.div>

      {/* Права колонка */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
        <motion.div variants={itemVariants} style={{ flex: 1, minHeight: 0 }}>
          <RiskMapPanel />
        </motion.div>
        <motion.div variants={itemVariants} style={{ height: '280px', flexShrink: 0 }}>
          <PriceAnomalies />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CognitiveInterface;
