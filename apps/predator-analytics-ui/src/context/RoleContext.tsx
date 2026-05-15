import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useUser } from './UserContext';
import { UserRole, RoleCapabilities, ROLE_CAPABILITIES, ROLE_DISPLAY_NAMES, ROLE_DESCRIPTIONS } from '../config/roles';

interface RoleContextType {
  role: UserRole;
  capabilities: RoleCapabilities;
  displayName: string;
  description: string;
  isAdmin: boolean;
  isPromo: boolean;
  isPro: boolean;
  isVIP: boolean;
  // Легасі-аліаси для зворотної сумісності
  isPremium: boolean;
  isBasic: boolean;
  isDRPO: boolean;
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
    isPromo: role === UserRole.PROMO,
    isPro: role === UserRole.PRO,
    isVIP: role === UserRole.VIP,
    // Легасі-аліаси для зворотної сумісності
    isPremium: role === UserRole.PRO || role === UserRole.VIP,
    isBasic: role === UserRole.PROMO,
    isDRPO: role === UserRole.VIP,
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
      role: UserRole.PROMO,
      capabilities: ROLE_CAPABILITIES[UserRole.PROMO],
      displayName: ROLE_DISPLAY_NAMES[UserRole.PROMO],
      description: ROLE_DESCRIPTIONS[UserRole.PROMO],
      isAdmin: false,
      isPromo: true,
      isPro: false,
      isVIP: false,
      // Легасі-аліаси
      isPremium: false,
      isBasic: true,
      isDRPO: false,
    };
  }
  return context;
};
