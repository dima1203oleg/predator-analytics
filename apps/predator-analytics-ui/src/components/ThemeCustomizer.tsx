/**
 * 🎨 THEME CUSTOMIZER | PREDATOR v61.0-ELITE
 * Теми та персоналізація
 * Перевищує Palantir: holographic themes, dynamic color schemes, preset profiles
 */
import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Sun, Moon, Zap, Settings, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  effects: {
    glow: boolean;
    particles: boolean;
    glassmorphism: boolean;
    holographic: boolean;
  };
}

const themes: ThemeConfig[] = [
  {
    id: 'predator-elite',
    name: 'PREDATOR ELITE',
    description: 'Класична тема з червоними акцентами',
    colors: {
      primary: '#e11d48',
      secondary: '#020101',
      accent: '#f43f5e',
      background: '#0a0a0a',
      text: '#ffffff'
    },
    effects: {
      glow: true,
      particles: true,
      glassmorphism: true,
      holographic: true
    }
  },
  {
    id: 'cyber-noir',
    name: 'CYBER NOIR',
    description: 'Темна кіберпанк тема з неоновими акцентами',
    colors: {
      primary: '#00ff88',
      secondary: '#0a0a0a',
      accent: '#00ffff',
      background: '#050505',
      text: '#e0e0e0'
    },
    effects: {
      glow: true,
      particles: true,
      glassmorphism: true,
      holographic: false
    }
  },
  {
    id: 'tactical-gray',
    name: 'TACTICAL GRAY',
    description: 'Військова тема з сірими акцентами',
    colors: {
      primary: '#6b7280',
      secondary: '#111827',
      accent: '#9ca3af',
      background: '#0f172a',
      text: '#f3f4f6'
    },
    effects: {
      glow: false,
      particles: true,
      glassmorphism: true,
      holographic: false
    }
  },
  {
    id: 'quantum-blue',
    name: 'QUANTUM BLUE',
    description: 'Квантова тема з синіми акцентами',
    colors: {
      primary: '#3b82f6',
      secondary: '#0c1929',
      accent: '#60a5fa',
      background: '#0a1628',
      text: '#e0f2fe'
    },
    effects: {
      glow: true,
      particles: true,
      glassmorphism: true,
      holographic: true
    }
  },
  {
    id: 'stealth-black',
    name: 'STEALTH BLACK',
    description: 'Мінімалістична чорна тема',
    colors: {
      primary: '#ffffff',
      secondary: '#000000',
      accent: '#404040',
      background: '#000000',
      text: '#ffffff'
    },
    effects: {
      glow: false,
      particles: false,
      glassmorphism: false,
      holographic: false
    }
  }
];

export const ThemeCustomizer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(themes[0]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  useEffect(() => {
    // Apply theme to CSS variables
    const root = document.documentElement;
    root.style.setProperty('--color-primary', currentTheme.colors.primary);
    root.style.setProperty('--color-secondary', currentTheme.colors.secondary);
    root.style.setProperty('--color-accent', currentTheme.colors.accent);
    root.style.setProperty('--color-background', currentTheme.colors.background);
    root.style.setProperty('--color-text', currentTheme.colors.text);
  }, [currentTheme]);

  const handleThemeChange = (theme: ThemeConfig) => {
    setCurrentTheme(theme);
  };

  const toggleEffect = (effect: keyof ThemeConfig['effects']) => {
    setCurrentTheme(prev => ({
      ...prev,
      effects: {
        ...prev.effects,
        [effect]: !prev.effects[effect]
      }
    }));
  };

  return (
    <>
      {/* Toggle button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-700 to-cyan-800 border-2 border-cyan-400/30 shadow-[0_0_30px_rgba(6,182,212,0.5)] flex items-center justify-center"
        whileHover={{ scale: 1.1, boxShadow: '0 0 50px rgba(6,182,212,0.8)' }}
        whileTap={{ scale: 0.95 }}
      >
        <Palette className="w-6 h-6 text-white" />
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className="fixed left-0 top-0 bottom-0 w-96 bg-black/95 backdrop-blur-xl border-r border-cyan-500/30 z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                  ТЕМИ
                </h2>
                <Button variant="cyber"
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <Settings className="w-5 h-5 text-slate-400" />
                </Button>
              </div>
              <p className="text-sm text-slate-400">
                Персоналізація інтерфейсу PREDATOR
              </p>
            </div>

            {/* Theme selection */}
            <div className="p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                ВИБІР ТЕМИ
              </h3>
              {themes.map((theme) => (
                <motion.button
                  key={theme.id}
                  onClick={() => handleThemeChange(theme)}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 transition-all duration-300',
                    'text-left',
                    currentTheme.id === theme.id
                      ? 'border-rose-500 bg-rose-500/10'
                      : 'border-white/10 hover:border-white/20 bg-white/5'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    <div>
                      <div className="text-sm font-bold text-white">
                        {theme.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {theme.description}
                      </div>
                    </div>
                  </div>
                  {/* Color preview */}
                  <div className="flex gap-2 mt-2">
                    {Object.values(theme.colors).map((color, index) => (
                      <div
                        key={index}
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Effects toggle */}
            <div className="p-6 space-y-4 border-t border-white/10">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                ЕФЕКТИ
              </h3>
              {Object.entries(currentTheme.effects).map(([key, value]) => (
                <motion.button
                  key={key}
                  onClick={() => toggleEffect(key as keyof ThemeConfig['effects'])}
                  className={cn(
                    'w-full p-3 rounded-xl border flex items-center justify-between transition-all duration-300',
                    value
                      ? 'border-rose-500/50 bg-rose-500/10'
                      : 'border-white/10 bg-white/5'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-sm text-white capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  {value ? (
                    <Eye className="w-4 h-4 text-rose-500" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-slate-500" />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Preview mode */}
            <div className="p-6 border-t border-white/10">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                ПЕРЕДГЛЯД
              </h3>
              <motion.button
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={cn(
                  'w-full p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all duration-300',
                  isPreviewMode
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-white/10 bg-white/5'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isPreviewMode ? (
                  <>
                    <EyeOff className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-bold text-emerald-400">
                      ВИМКНУТИ ПЕРЕДГЛЯД
                    </span>
                  </>
                ) : (
                  <>
                    <Eye className="w-5 h-5 text-slate-400" />
                    <span className="text-sm font-bold text-white">
                      УВІМКНУТИ ПЕРЕДГЛЯД
                    </span>
                  </>
                )}
              </motion.button>
            </div>

            {/* Quick actions */}
            <div className="p-6 border-t border-white/10 space-y-2">
              <motion.button
                className="w-full p-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-800 text-white font-bold text-sm flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Zap className="w-4 h-4" />
                ЗАСТОСУВАТИ ТЕМУ
              </motion.button>
              <motion.button
                className="w-full p-3 rounded-xl border border-white/20 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Settings className="w-4 h-4" />
                СКИНУТИ НАЛАШТУВАННЯ
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ThemeCustomizer;
