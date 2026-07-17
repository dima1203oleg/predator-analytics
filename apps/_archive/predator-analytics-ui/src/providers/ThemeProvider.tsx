/**
 * 🎨 Theme Provider & Context
 *
 * Dark/Light theme support with system preference detection
 * and manual toggle with localStorage persistence.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

// ========================
// Types
// ========================

type Theme = 'dark' | 'light' | 'system';
type ResolvedTheme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

// ========================
// Context
// ========================

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ========================
// Hook
// ========================

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// ========================
// Storage Key
// ========================

const THEME_STORAGE_KEY = 'predator-theme';

// ========================
// Helper Functions
// ========================

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'dark' || stored === 'light' || stored === 'system') {
    return stored;
  }
  return 'dark'; // Default to dark for PREDATOR
};

const resolveTheme = (theme: Theme): ResolvedTheme => {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
};

// ========================
// Provider Component
// ========================

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'dark'
}) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return getStoredTheme();
    }
    return defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(theme)
  );

  // Update resolved theme when theme or system preference changes
  useEffect(() => {
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);

    // Apply to document
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);

    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', resolved === 'dark' ? '#020617' : '#ffffff');
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setResolvedTheme(getSystemTheme());

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  const value: ThemeContextValue = {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// ========================
// Theme Toggle Component
// ========================

import { Moon, Sun, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showLabel = false,
  className = ''
}) => {
  const { theme, setTheme, isDark } = useTheme();

  const themes: { value: Theme; icon: typeof Moon; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Світла' },
    { value: 'dark', icon: Moon, label: 'Темна' },
    { value: 'system', icon: Monitor, label: 'Системна' },
  ];

  return (
    <div className={`flex items-center gap-1 p-1 bg-white/5 rounded-lg ${className}`}>
      {themes.map(({ value, icon: Icon, label }) => (
        <motion.button
          key={value}
          onClick={() => setTheme(value)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all
            ${theme === value
              ? 'bg-white/10 text-white'
              : 'text-slate-500 hover:text-slate-300'
            }
          `}
          title={label}
          aria-label={`Встановити ${label.toLowerCase()} тему`}
        >
          <Icon size={14} />
          {showLabel && <span>{label}</span>}
        </motion.button>
      ))}
    </div>
  );
};

// ========================
// Quick Toggle Button
// ========================

export const ThemeQuickToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={`
        p-2 rounded-lg bg-white/5 border border-white/10
        hover:bg-white/10 transition-colors
        ${className}
      `}
      title={isDark ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'}
      aria-label={isDark ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 0 : 180 }}
        transition={{ duration: 0.3 }}
      >
        {isDark ? <Moon size={16} className="text-slate-400" /> : <Sun size={16} className="text-amber-400" />}
      </motion.div>
    </motion.button>
  );
};

export default ThemeProvider;
