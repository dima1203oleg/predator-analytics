import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useUser } from './UserContext';
import {
  UserRole,
  RoleCapabilities,
  getRoleCapabilities,
  getRoleDescription,
  getRoleDisplayName,
  normalizeUserRole,
} from '../config/roles';

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
    return normalizeUserRole(user?.role) as UserRole;
  }, [user]);

  const capabilities = useMemo(() => getRoleCapabilities(role), [role]);

  const value = useMemo(() => ({
    role,
    capabilities,
    displayName: getRoleDisplayName(role),
    description: getRoleDescription(role),
    isAdmin: role === UserRole.ADMIN,
    isPremium: role === UserRole.ANALYST || role === UserRole.BUSINESS,
    isBasic: role === UserRole.VIEWER || role === UserRole.SUPPLY_CHAIN,
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
    console.warn('useRole викликано поза RoleProvider - повертаємо значення за замовчуванням');
    return {
      role: UserRole.VIEWER,
      capabilities: getRoleCapabilities(UserRole.VIEWER),
      displayName: getRoleDisplayName(UserRole.VIEWER),
      description: getRoleDescription(UserRole.VIEWER),
      isAdmin: false,
      isPremium: false,
      isBasic: true,
    };
  }
  return context;
};
