/**
 * 🎯 PREDATOR Tactical AI Dashboard
 * 
 * Головний макет тактичного AI дашборду
 * згідно з технічною специфікацією
 */

import { Button } from '@/components/ui/button';
import { useEffect, useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CRTFilter from './CRTFilter';
import HolographicAvatar from './HolographicAvatar';
import AudioVisualizer from './AudioVisualizer';
import LiveTerminal from './LiveTerminal';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import { useCyberDashboardStore } from '../../store/cyber-dashboard-store';
import { Shield, Activity, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { PredatorCopilot } from '../copilot/PredatorCopilot';
import { CopilotSidebar } from '../copilot/CopilotSidebar';
import { ChartGeneratorTool } from '../copilot/ChartGeneratorTool';
import { FlowBuilderTool } from '../copilot/FlowBuilderTool';
import { CopilotContextEnhancer } from '../copilot/CopilotContextEnhancer';
import { AnalyticsComments } from '../analytics/AnalyticsComments';

export default function CyberDashboard() {
  const { systemStatus, togglePanel, isPanelCollapsed } = useCyberDashboardStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Оновлення часу
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Mouse tracking для 3D аватара
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const { clientX, clientY } = event;
      const { innerWidth, innerHeight } = window;
      
      // Нормалізація координат до -1 до 1
      const x = ((clientX / innerWidth) * 2 - 1);
      const y = ((clientY / innerHeight) * 2 - 1);
      
      const { setHeadTargetRotation } = useCyberDashboardStore.getState();
      setHeadTargetRotation(y * 0.5, x * 0.5);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  return (
    <PredatorCopilot>
      <CopilotSidebar>
        <CRTFilter>
          <div className="min-h-screen bg-cyber-bg font-cyber overflow-hidden">
        {/* Top Status Bar */}
        <div className="h-12 bg-cyber-surface/80 backdrop-blur-md border-b border-cyber-border flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-2"
            >
              <Shield className="w-5 h-5 text-cyber-neon" />
              <span className="text-cyber-neon font-cyber font-bold tracking-wider">
                PREDATOR
              </span>
            </motion.div>
            <div className="h-6 w-px bg-cyber-border" />
            <div className="text-xs text-cyber-neon/50 font-mono">
              V61.0-ELITE
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyber-green" />
              <span className={`text-xs font-mono ${
                systemStatus === 'online' ? 'text-cyber-green' :
                systemStatus === 'offline' ? 'text-cyber-red' :
                'text-cyber-gold'
              }`}>
                {systemStatus.toUpperCase()}
              </span>
            </div>
            <div className="text-xs text-cyber-neon/50 font-mono">
              {currentTime.toLocaleTimeString('uk-UA')}
            </div>
            <Button variant="cyber" className="p-2 hover:bg-cyber-border/30 rounded transition-colors">
              <Settings className="w-4 h-4 text-cyber-neon/50" />
            </Button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex h-[calc(100vh-3rem)]">
          {/* Left Panel */}
          <LeftPanel />
          
          {/* Center - 3D Avatar + Audio Visualizer */}
          <div className="flex-1 flex flex-col relative">
            {/* 3D Avatar */}
            <div className="flex-1 relative">
              <Suspense fallback={null}>
                <HolographicAvatar />
              </Suspense>
              
              {/* Toggle Panels Buttons */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => togglePanel('left')}
                  className="p-2 bg-cyber-surface/80 backdrop-blur border border-cyber-border/30 rounded hover:border-cyber-neon/50 transition-colors"
                >
                  <ChevronRight 
                    className={`w-4 h-4 text-cyber-neon/70 transition-transform ${
                      isPanelCollapsed.left ? 'rotate-180' : ''
                    }`} 
                  />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => togglePanel('right')}
                  className="p-2 bg-cyber-surface/80 backdrop-blur border border-cyber-border/30 rounded hover:border-cyber-neon/50 transition-colors"
                >
                  <ChevronLeft 
                    className={`w-4 h-4 text-cyber-neon/70 transition-transform ${
                      isPanelCollapsed.right ? 'rotate-180' : ''
                    }`} 
                  />
                </motion.button>
              </div>
              
              {/* HUD Overlay */}
              <div className="absolute top-4 right-4 text-right">
                <div className="text-xs text-cyber-neon/50 font-mono">
                  ВІДСТЕЖЕННЯ ЦІЛІ
                </div>
                <div className="text-lg text-cyber-neon font-cyber tracking-widest">
                  АКТИВНО
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="absolute bottom-20 right-4 flex flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 rounded-full bg-cyber-bg/80 border border-cyber-neon/30 flex items-center justify-center text-cyber-neon hover:bg-cyber-neon/20 hover:border-cyber-neon transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 rounded-full bg-cyber-bg/80 border border-cyber-green/30 flex items-center justify-center text-cyber-green hover:bg-cyber-green/20 hover:border-cyber-green transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m12 8 4 4-4 4"/><path d="M8 12h8"/></svg>
                </motion.button>
              </div>
              
              {/* Corner Decorations */}
              <div className="absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-cyber-neon/30" />
              <div className="absolute bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 border-cyber-neon/30" />
            </div>
            {/* Terminal and Audio */}
            <div className="p-4 flex flex-col gap-2">
              <LiveTerminal />
              <AudioVisualizer />
            </div>
          </div>
          
          {/* Right Panel */}
          {/* Right Panel and Components */}
          <RightPanel />
          <div className="absolute right-4 bottom-32 w-80 z-50 overflow-y-auto max-h-[60vh] custom-scrollbar">
            <CopilotContextEnhancer />
            <ChartGeneratorTool />
            <FlowBuilderTool />
            <AnalyticsComments />
          </div>
        </div>
        
        {/* Grid Lines Background */}
        <div className="fixed inset-0 pointer-events-none z-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }} />
      </div>
        </CRTFilter>
      </CopilotSidebar>
    </PredatorCopilot>
  );
}
