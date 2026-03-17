import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type UserRole = 'client' | 'premium' | 'admin';
export type InterlinkPersona = 'TITAN' | 'INQUISITOR' | 'SOVEREIGN' | 'BUSINESS' | 'GOVERNMENT' | 'INTELLIGENCE' | 'BANKING' | 'MEDIA';
export type DeviceMode = 'desktop' | 'tablet' | 'mobile';
export type ApiLanguage = 'ua' | 'en';

interface AppState {
  // User & Access
  userRole: UserRole;
  persona: InterlinkPersona;
  
  // UI State
  deviceMode: DeviceMode;
  isSidebarOpen: boolean;
  language: ApiLanguage;
  isTerminalOpen: boolean;
  highVisibility: boolean;
  
  // AZR Status
  azrStatus: {
    status: 'learning' | 'stable' | 'optimizing';
    progress: number;
    message: string;
  };

  // Actions
  setRole: (role: UserRole) => void;
  setPersona: (persona: InterlinkPersona) => void;
  setDeviceMode: (mode: DeviceMode) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setLanguage: (lang: ApiLanguage) => void;
  setTerminalOpen: (open: boolean) => void;
  setHighVisibility: (enabled: boolean) => void;
  updateAzrStatus: (status: Partial<AppState['azrStatus']>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      userRole: 'admin',
      persona: 'TITAN',
      deviceMode: 'desktop',
      isSidebarOpen: true,
      language: 'ua',
      isTerminalOpen: false,
      highVisibility: false,
      azrStatus: {
        status: 'stable',
        progress: 100,
        message: 'Стан оптимальний'
      },

      setRole: (userRole) => set({ userRole }),
      setPersona: (persona) => set({ persona }),
      setDeviceMode: (deviceMode) => set({ deviceMode }),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
      setLanguage: (language) => set({ language }),
      setTerminalOpen: (isTerminalOpen) => set({ isTerminalOpen }),
      setHighVisibility: (highVisibility) => set({ highVisibility }),
      updateAzrStatus: (status) => set((state) => ({ 
        azrStatus: { ...state.azrStatus, ...status } 
      })),
    }),
    {
      name: 'predator-app-storage',
      storage: createJSONStorage(() => {
        const memory = new Map<string, string>();

        // Якщо немає window (SSR/тести) — працюємо лише в памʼяті
        if (typeof window === 'undefined' || !('localStorage' in window)) {
          return {
            getItem: (name: string) => memory.get(name) ?? null,
            setItem: (name: string, value: string) => {
              memory.set(name, value);
            },
            removeItem: (name: string) => {
              memory.delete(name);
            },
          };
        }

        // Браузерний режим з безпечним fallback
        return {
          getItem: (name: string) => {
            try {
              return window.localStorage.getItem(name);
            } catch {
              return memory.get(name) ?? null;
            }
          },
          setItem: (name: string, value: string) => {
            try {
              window.localStorage.setItem(name, value);
            } catch {
              memory.set(name, value);
            }
          },
          removeItem: (name: string) => {
            try {
              window.localStorage.removeItem(name);
            } catch {
              memory.delete(name);
            }
          },
        };
      }),
      partialize: (state) => ({
        userRole: state.userRole,
        persona: state.persona,
        language: state.language,
        highVisibility: state.highVisibility,
      }),
    }
  )
);
