import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { UserRole } from '../config/roles';

export type InterlinkPersona = 'TITAN' | 'INQUISITOR' | 'SOVEREIGN' | 'BUSINESS' | 'GOVERNMENT' | 'INTELLIGENCE' | 'BANKING' | 'MEDIA';
export type DeviceMode = 'desktop' | 'tablet' | 'mobile';
export type ApiLanguage = 'ua' | 'en';

interface AppState {
  // User & Access
  userRole: UserRole | string;
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

  // V55.1 New Scaffold State
  tenant: string;
  isPlanMode: boolean;
  isCopilotOpen: boolean;
  
  // Actions
  setRole: (role: UserRole | string) => void;
  setPersona: (persona: InterlinkPersona) => void;
  setDeviceMode: (mode: DeviceMode) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setLanguage: (lang: ApiLanguage) => void;
  setTerminalOpen: (open: boolean) => void;
  setHighVisibility: (enabled: boolean) => void;
  updateAzrStatus: (status: Partial<AppState['azrStatus']>) => void;
  setTenant: (tenant: string) => void;
  setPlanMode: (isPlanMode: boolean) => void;
  setCopilotOpen: (isCopilotOpen: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      userRole: UserRole.CLIENT_BASIC,
      persona: 'SOVEREIGN',

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
      tenant: 'Держмитслужба',
      isPlanMode: true,
      isCopilotOpen: false,

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
      setTenant: (tenant) => set({ tenant }),
      setPlanMode: (isPlanMode) => set({ isPlanMode }),
      setCopilotOpen: (isCopilotOpen) => set({ isCopilotOpen }),
    }),
    {
      name: 'predator-app-storage',
      partialize: (state) => ({
        userRole: state.userRole,
        persona: state.persona,
        language: state.language,
        highVisibility: state.highVisibility,
        tenant: state.tenant,
        isPlanMode: state.isPlanMode,
      }),
    }
  )
);
