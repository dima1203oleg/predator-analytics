import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useUser } from './UserContext';
import { UserRole, RoleCapabilities, ROLE_CAPABILITIES, ROLE_DISPLAY_NAMES, ROLE_DESCRIPTIONS } from '../config/roles';

interface RoleContextType {
  role: UserRole;
  capabilities: RoleCapabilities;
  displayName: string;
  description: string;
  isAdmin: boolean;
  isPremium: boolean;
  isBasic: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useUser();

  const role = useMemo((): UserRole => {
    // If no user set loop, default to Basic (or specific logic)
    // Actually, Layout is usually protected, so user should exist.
    return user?.role || UserRole.CLIENT_BASIC;
  }, [user]);

  const capabilities = useMemo(() => ROLE_CAPABILITIES[role], [role]);

  const value = useMemo(() => ({
    role,
    capabilities,
    displayName: ROLE_DISPLAY_NAMES[role],
    description: ROLE_DESCRIPTIONS[role],
    isAdmin: role === UserRole.ADMIN,
    isPremium: role === UserRole.CLIENT_PREMIUM,
    isBasic: role === UserRole.CLIENT_BASIC,
  }), [role, capabilities]);

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (!context) {
    console.warn('useRole used outside of RoleProvider - returning defaults');
    return {
      role: UserRole.CLIENT_BASIC,
      capabilities: ROLE_CAPABILITIES[UserRole.CLIENT_BASIC],
      displayName: ROLE_DISPLAY_NAMES[UserRole.CLIENT_BASIC],
      description: ROLE_DESCRIPTIONS[UserRole.CLIENT_BASIC],
      isAdmin: false,
      isPremium: false,
      isBasic: true,
    };
  }
  return context;
};
