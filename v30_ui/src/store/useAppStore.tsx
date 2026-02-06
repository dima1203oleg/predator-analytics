import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'client' | 'premium' | 'admin';
export type InterlinkPersona = 'TITAN' | 'INQUISITOR' | 'SOVEREIGN';
type DeviceMode = 'desktop' | 'tablet' | 'mobile';
type Language = 'ua' | 'en';

interface AppState {
  // User & Access
  userRole: UserRole;
  setRole: (role: UserRole) => void;
  persona: InterlinkPersona;
  setPersona: (persona: InterlinkPersona) => void;

  // UI State
  deviceMode: DeviceMode;
  setDeviceMode: (mode: DeviceMode) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;

  // AZR Status (Mock for UI)
  azrStatus: {
    status: 'learning' | 'stable' | 'optimizing';
    progress: number;
    message: string;
  };
}

const AppContext = createContext<AppState | null>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  // Initialize state from localStorage if available
  const [userRole, setUserRole] = useState<UserRole>(() =>
    (localStorage.getItem('userRole') as UserRole) || 'premium'
  );
  const [persona, setPersonaState] = useState<InterlinkPersona>(() =>
    (localStorage.getItem('interlinkPersona') as InterlinkPersona) || 'TITAN'
  );
  const [deviceMode, setDeviceModeState] = useState<DeviceMode>('desktop');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [language, setLanguageState] = useState<Language>('ua');

  // Persistence
  useEffect(() => {
    localStorage.setItem('userRole', userRole);
    localStorage.setItem('interlinkPersona', persona);
  }, [userRole, persona]);

  const setRole = (role: UserRole) => setUserRole(role);
  const setPersona = (p: InterlinkPersona) => setPersonaState(p);
  const setDeviceMode = (mode: DeviceMode) => setDeviceModeState(mode);
  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const setLanguage = (lang: Language) => setLanguageState(lang);

  const azrStatus = {
    status: 'stable' as const,
    progress: 100,
    message: 'System optimal'
  };

  const value = {
    userRole, setRole,
    persona, setPersona,
    deviceMode, setDeviceMode,
    isSidebarOpen, toggleSidebar,
    language, setLanguage,
    azrStatus
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
};
