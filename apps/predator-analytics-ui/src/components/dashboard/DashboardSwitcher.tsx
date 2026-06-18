/**
 * 🔄 Dashboard Switcher Component
 * 
 * Компонент для перемикання між різними режимами дашборду
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Monitor, Cpu, Zap } from 'lucide-react';

export default function DashboardSwitcher() {
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState<'nexus' | 'cyber'>('nexus');
  
  const handleSwitch = (mode: 'nexus' | 'cyber') => {
    setActiveMode(mode);
    if (mode === 'cyber') {
      navigate('/cyber');
    } else {
      navigate('/');
    }
  };
  
  return (
    <div className="flex items-center gap-1 bg-cyber-surface/50 backdrop-blur border border-cyber-border/30 rounded-lg p-1">
      <motion.button
        onClick={() => handleSwitch('nexus')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          relative px-4 py-2 rounded-md transition-all
          ${activeMode === 'nexus' 
            ? 'bg-cyber-neon/20 border border-cyber-neon' 
            : 'hover:bg-cyber-border/30 border border-transparent'
          }
        `}
      >
        <div className="flex items-center gap-2">
          <Cpu className={`w-4 h-4 ${activeMode === 'nexus' ? 'text-cyber-neon' : 'text-cyber-neon/50'}`} />
          <span className={`text-sm font-cyber ${activeMode === 'nexus' ? 'text-cyber-neon' : 'text-gray-400'}`}>
            NEXUS
          </span>
        </div>
        {activeMode === 'nexus' && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyber-neon"
            initial={false}
            animate
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 30,
            }}
          />
        )}
      </motion.button>
      
      <motion.button
        onClick={() => handleSwitch('cyber')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          relative px-4 py-2 rounded-md transition-all
          ${activeMode === 'cyber' 
            ? 'bg-cyber-green/20 border border-cyber-green' 
            : 'hover:bg-cyber-border/30 border border-transparent'
          }
        `}
      >
        <div className="flex items-center gap-2">
          <Monitor className={`w-4 h-4 ${activeMode === 'cyber' ? 'text-cyber-green' : 'text-cyber-green/50'}`} />
          <span className={`text-sm font-cyber ${activeMode === 'cyber' ? 'text-cyber-green' : 'text-gray-400'}`}>
            CYBER
          </span>
        </div>
        {activeMode === 'cyber' && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyber-green"
            initial={false}
            animate
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 30,
            }}
          />
        )}
      </motion.button>
      
      {/* Decorative elements */}
      <div className="absolute -top-1 -right-1">
        <Zap className="w-2 h-2 text-cyber-neon/30 animate-pulse" />
      </div>
    </div>
  );
}
