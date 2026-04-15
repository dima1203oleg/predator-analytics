/**
 * ThemeContext — Глобальний контекст динамічної зміни відтінків
 * 
 * Керує кольоровою палітрою всього інтерфейсу залежно від
 * оперативної ситуації. CSS-змінні оновлюються на рівні :root,
 * що автоматично каскадом змінює вигляд усіх компонентів.
 * 
 * Режими (OperationalMode):
 *   - sovereign  — Стандартний режим (Індиго/Ціан)
 *   - vigilance  — Підвищена увага (Янтарь/Оранжевий)
 *   - threat     — Загроза (Червоний / Тактичний)
 *   - stealth    — Прихований режим (Зелений/Темний)
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type OperationalMode = 'sovereign' | 'vigilance' | 'threat' | 'stealth';

interface ThemeContextValue {
  /** Поточний операційний режим */
  mode: OperationalMode;
  /** Зміна режиму */
  setMode: (mode: OperationalMode) => void;
  /** Циклічне перемикання */
  cycleMode: () => void;
  /** Мета інформація для UI */
  modeInfo: ModeInfo;
}

interface ModeInfo {
  label: string;
  icon: string;
  accentHsl: string;
  glowColor: string;
}

const MODE_ORDER: OperationalMode[] = ['sovereign', 'vigilance', 'threat', 'stealth'];

const MODE_META: Record<OperationalMode, ModeInfo> = {
  sovereign: {
    label: 'СУВЕРЕННИЙ',
    icon: '👑',
    accentHsl: '45 74% 52%',      // Sovereign Gold (#D4AF37)
    glowColor: 'rgba(212, 175, 55, 0.45)',
  },
  vigilance: {
    label: 'ПИЛЬНІСТЬ',
    icon: '⚠️',
    accentHsl: '38 92% 50%',     // Янтарь
    glowColor: 'rgba(245, 158, 11, 0.35)',
  },
  threat: {
    label: 'ЗАГРОЗА',
    icon: '🔴',
    accentHsl: '0 84% 60%',      // Червоний
    glowColor: 'rgba(239, 68, 68, 0.4)',
  },
  stealth: {
    label: 'СТЕЛС',
    icon: '👁️',
    accentHsl: '152 69% 40%',    // Зелений
    glowColor: 'rgba(16, 185, 129, 0.3)',
  },
};


/**
 * CSS-змінні, що каскадом оновлюють весь інтерфейс
 * при зміні операційного режиму
 */
const MODE_CSS_VARS: Record<OperationalMode, Record<string, string>> = {
  sovereign: {
    '--op-accent':        'rgb(212, 175, 55)',
    '--op-accent-soft':   'rgba(212, 175, 55, 0.18)',
    '--op-accent-glow':   '0 0 45px rgba(212, 175, 55, 0.3)',
    '--op-accent-border': 'rgba(212, 175, 55, 0.45)',
    '--op-accent-text':   '#fde68a',
    '--op-accent-bg':     'rgba(212, 175, 55, 0.12)',
    '--op-header-glow':   'linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.2), transparent)',
    '--op-sidebar-active':'linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(220, 38, 38, 0.1))',
    '--op-pulse-color':   'rgba(212, 175, 55, 0.7)',
    '--op-scanline':      'rgba(212, 175, 55, 0.04)',
    '--op-ring':          'rgba(212, 175, 55, 0.25)',
  },
  vigilance: {
    '--op-accent':        'rgb(245, 158, 11)',
    '--op-accent-soft':   'rgba(245, 158, 11, 0.15)',
    '--op-accent-glow':   '0 0 30px rgba(245, 158, 11, 0.2)',
    '--op-accent-border': 'rgba(245, 158, 11, 0.3)',
    '--op-accent-text':   '#fcd34d',
    '--op-accent-bg':     'rgba(245, 158, 11, 0.08)',
    '--op-header-glow':   'linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.15), transparent)',
    '--op-sidebar-active':'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(249, 115, 22, 0.06))',
    '--op-pulse-color':   'rgba(245, 158, 11, 0.6)',
    '--op-scanline':      'rgba(245, 158, 11, 0.03)',
    '--op-ring':          'rgba(245, 158, 11, 0.15)',
  },
  threat: {
    '--op-accent':        'rgb(239, 68, 68)',
    '--op-accent-soft':   'rgba(239, 68, 68, 0.15)',
    '--op-accent-glow':   '0 0 30px rgba(239, 68, 68, 0.25)',
    '--op-accent-border': 'rgba(239, 68, 68, 0.35)',
    '--op-accent-text':   '#fca5a5',
    '--op-accent-bg':     'rgba(239, 68, 68, 0.1)',
    '--op-header-glow':   'linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.2), transparent)',
    '--op-sidebar-active':'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(220, 38, 38, 0.06))',
    '--op-pulse-color':   'rgba(239, 68, 68, 0.7)',
    '--op-scanline':      'rgba(239, 68, 68, 0.04)',
    '--op-ring':          'rgba(239, 68, 68, 0.2)',
  },
  stealth: {
    '--op-accent':        'rgb(16, 185, 129)',
    '--op-accent-soft':   'rgba(16, 185, 129, 0.12)',
    '--op-accent-glow':   '0 0 30px rgba(16, 185, 129, 0.15)',
    '--op-accent-border': 'rgba(16, 185, 129, 0.25)',
    '--op-accent-text':   '#6ee7b7',
    '--op-accent-bg':     'rgba(16, 185, 129, 0.06)',
    '--op-header-glow':   'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.1), transparent)',
    '--op-sidebar-active':'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))',
    '--op-pulse-color':   'rgba(16, 185, 129, 0.5)',
    '--op-scanline':      'rgba(16, 185, 129, 0.02)',
    '--op-ring':          'rgba(16, 185, 129, 0.12)',
  },
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<OperationalMode>('sovereign');

  const applyCSS = useCallback((m: OperationalMode) => {
    const vars = MODE_CSS_VARS[m];
    const root = document.documentElement;
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value);
    }
    // Також додаємо data-attribute для CSS селекторів
    root.setAttribute('data-op-mode', m);
  }, []);

  const setMode = useCallback((m: OperationalMode) => {
    setModeState(m);
    applyCSS(m);
    // Плавна CSS transition через клас
    document.documentElement.classList.add('op-mode-transition');
    setTimeout(() => document.documentElement.classList.remove('op-mode-transition'), 600);
  }, [applyCSS]);

  const cycleMode = useCallback(() => {
    setModeState(prev => {
      const idx = MODE_ORDER.indexOf(prev);
      const next = MODE_ORDER[(idx + 1) % MODE_ORDER.length];
      applyCSS(next);
      document.documentElement.classList.add('op-mode-transition');
      setTimeout(() => document.documentElement.classList.remove('op-mode-transition'), 600);
      return next;
    });
  }, [applyCSS]);

  // Ініціалізація CSS-змінних при маунті
  useEffect(() => {
    applyCSS(mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const modeInfo = MODE_META[mode];

  return (
    <ThemeContext.Provider value={{ mode, setMode, cycleMode, modeInfo }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Хук для доступу до оперативного режиму теми
 * @example
 * const { mode, setMode, cycleMode, modeInfo } = useTheme();
 */
export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme має використовуватись усередині ThemeProvider');
  return ctx;
};

export default ThemeContext;
