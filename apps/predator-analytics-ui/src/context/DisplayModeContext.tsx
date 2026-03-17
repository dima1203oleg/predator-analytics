import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export enum DisplayMode {
  DESKTOP = 'desktop',
  TABLET = 'tablet',
  MOBILE = 'mobile',
}

export interface DisplayModeConfig {
  mode: DisplayMode;
  layout: 'multi-panel' | 'reduced' | 'card-based';
  density: 'comfortable' | 'compact' | 'touch';
  showSidebar: boolean;
  maxColumns: number;
}

export const DISPLAY_CONFIGS: Record<DisplayMode, DisplayModeConfig> = {
  [DisplayMode.DESKTOP]: {
    mode: DisplayMode.DESKTOP,
    layout: 'multi-panel',
    density: 'comfortable',
    showSidebar: true,
    maxColumns: 4,
  },
  [DisplayMode.TABLET]: {
    mode: DisplayMode.TABLET,
    layout: 'reduced',
    density: 'compact',
    showSidebar: true,
    maxColumns: 2,
  },
  [DisplayMode.MOBILE]: {
    mode: DisplayMode.MOBILE,
    layout: 'card-based',
    density: 'touch',
    showSidebar: false,
    maxColumns: 1,
  },
};

interface DisplayModeContextType {
  mode: DisplayMode;
  config: DisplayModeConfig;
  setMode: (mode: DisplayMode) => void;
}

const DisplayModeContext = createContext<DisplayModeContextType | undefined>(undefined);

const STORAGE_KEY = 'predator_display_mode';

export const DisplayModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<DisplayMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return (saved as DisplayMode) || DisplayMode.DESKTOP;
    } catch {
      return DisplayMode.DESKTOP;
    }
  });

  const setMode = (newMode: DisplayMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {
      // no-op
    }
  };

  const value = {
    mode,
    config: DISPLAY_CONFIGS[mode],
    setMode,
  };

  return (
    <DisplayModeContext.Provider value={value}>
      {children}
    </DisplayModeContext.Provider>
  );
};

export const useDisplayMode = (): DisplayModeContextType => {
  const context = useContext(DisplayModeContext);
  if (!context) {
    console.warn('useDisplayMode used outside of DisplayModeProvider - returning defaults');
    return {
      mode: DisplayMode.DESKTOP,
      config: DISPLAY_CONFIGS[DisplayMode.DESKTOP],
      setMode: () => {},
    };
  }
  return context;
};
