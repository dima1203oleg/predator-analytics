/**
 * 🎯 PREDATOR Tactical AI Dashboard
 * 
 * Головний макет тактичного AI дашборду
 * згідно з технічною специфікацією
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CRTFilter from './CRTFilter';
import HolographicAvatar from './HolographicAvatar';
import AudioVisualizer from './AudioVisualizer';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import { useCyberDashboardStore } from '../../store/cyber-dashboard-store';
import { Shield, Activity, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

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
            <button className="p-2 hover:bg-cyber-border/30 rounded transition-colors">
              <Settings className="w-4 h-4 text-cyber-neon/50" />
            </button>
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
              <HolographicAvatar />
              
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
                  TARGET TRACKING
                </div>
                <div className="text-lg text-cyber-neon font-cyber tracking-widest">
                  ACTIVE
                </div>
              </div>
              
              {/* Corner Decorations */}
              <div className="absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-cyber-neon/30" />
              <div className="absolute bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 border-cyber-neon/30" />
            </div>
            
            {/* Audio Visualizer */}
            <div className="p-4">
              <AudioVisualizer />
            </div>
          </div>
          
          {/* Right Panel */}
          <RightPanel />
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
  );
}
