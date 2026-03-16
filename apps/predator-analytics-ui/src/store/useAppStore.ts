import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
      azrStatus: {
        status: 'stable',
        progress: 100,
        message: 'System optimal'
      },

      setRole: (userRole) => set({ userRole }),
      setPersona: (persona) => set({ persona }),
      setDeviceMode: (deviceMode) => set({ deviceMode }),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
      setLanguage: (language) => set({ language }),
      setTerminalOpen: (isTerminalOpen) => set({ isTerminalOpen }),
      updateAzrStatus: (status) => set((state) => ({ 
        azrStatus: { ...state.azrStatus, ...status } 
      })),
    }),
    {
      name: 'predator-app-storage',
      partialize: (state) => ({
        userRole: state.userRole,
        persona: state.persona,
        language: state.language,
      }),
    }
  )
);
