import { create } from 'zustand';

export type AppTheme = 'professional-matte' | 'stealth' | 'briefing';

interface ThemeState {
    currentTheme: AppTheme;
    setTheme: (theme: AppTheme) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
    currentTheme: 'professional-matte',
    setTheme: (theme) => {
        // Here we could also sync with a CSS variable on the body/html
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', theme);
        }
        set({ currentTheme: theme });
    }
}));
