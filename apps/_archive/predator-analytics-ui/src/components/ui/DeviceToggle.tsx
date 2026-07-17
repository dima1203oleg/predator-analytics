/**
 * 🖥️ Device Toggle - PREDATOR v63.0-ELITE
 * Перемикач режимів відображення для адаптації UI під різні пристрої
 * Desktop / Tablet / Smartphone
 */
import React, { useState, useEffect } from 'react';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

type DeviceMode = 'desktop' | 'tablet' | 'smartphone';

interface DeviceToggleProps {
  className?: string;
  onModeChange?: (mode: DeviceMode) => void;
}

export const DeviceToggle: React.FC<DeviceToggleProps> = ({ 
  className, 
  onModeChange 
}) => {
  const [currentMode, setCurrentMode] = useState<DeviceMode>('desktop');

  useEffect(() => {
    // Зберігаємо вибір в localStorage
    const saved = localStorage.getItem('predator-device-mode') as DeviceMode;
    if (saved && ['desktop', 'tablet', 'smartphone'].includes(saved)) {
      setCurrentMode(saved);
    } else {
      // Якщо немає збереженого значення, встановлюємо desktop за замовчуванням
      setCurrentMode('desktop');
      localStorage.setItem('predator-device-mode', 'desktop');
    }
  }, []);

  const handleModeChange = (mode: DeviceMode) => {
    setCurrentMode(mode);
    localStorage.setItem('predator-device-mode', mode);
    onModeChange?.(mode);
    
    // Встановлюємо CSS змінні для адаптивності
    document.documentElement.style.setProperty('--device-mode', mode);
    
    // Емітуємо подію для інших компонентів
    window.dispatchEvent(new CustomEvent('predator-device-change', { 
      detail: { mode } 
    }));
  };

  const modes = [
    { id: 'desktop' as DeviceMode, icon: Monitor, label: 'Desktop' },
    { id: 'tablet' as DeviceMode, icon: Tablet, label: 'Tablet' },
    { id: 'smartphone' as DeviceMode, icon: Smartphone, label: 'Smartphone' },
  ];

  return (
    <div className={cn(
      'flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 backdrop-blur-md',
      className
    )}>
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = currentMode === mode.id;
        
        return (
          <motion.button
            key={mode.id}
            onClick={() => handleModeChange(mode.id)}
            className={cn(
              'relative p-2 rounded-lg transition-all duration-300',
              'hover:bg-white/5',
              isActive ? 'text-rose-500' : 'text-white/40 hover:text-white/60'
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isActive && (
              <motion.div
                layoutId="activeDevice"
                className="absolute inset-0 bg-rose-500/10 rounded-lg border border-rose-500/20"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <Icon size={18} className="relative z-10" />
          </motion.button>
        );
      })}
    </div>
  );
};

export default DeviceToggle;
