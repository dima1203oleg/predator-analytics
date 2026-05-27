import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole, resolveUserRole } from '../config/roles';
export { UserRole };

// ============================================================================
// ROLE HIERARCHY (backward-compatible aliases)
// ============================================================================
// Legacy aliases used by older components
export const ROLE_HIERARCHY: Record<string, number> = {
  [UserRole.TERMINAL]: 1,
  [UserRole.PRO]: 2,
  [UserRole.SOVEREIGN]: 3,
  [UserRole.CORE]: 4,
};


// ============================================================================
// NEW USER CONTEXT (Optimized for v2.0)
// ============================================================================

export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  tier: SubscriptionTier;
  tenant_id: string;
  tenant_name: string;
  last_login: string;
  data_sectors: string[];
}

interface UserContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Helpers
  isAdmin: boolean;
  isClient: boolean;

  // RBAC - checks if current user has at least the required role level
  canAccess: (requiredRole: UserRole | string) => boolean;

  // Actions
  setUser: (user: UserProfile) => void;
  logout: () => void;
  updateTier: (tier: SubscriptionTier) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

function decodeTokenPayload(token: string): any | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch {
    return null;
  }
}

function buildUserFromToken(token: string): UserProfile | null {
  const payload = decodeTokenPayload(token);
  if (!payload) return null;
  const rawRole = payload.role || payload.rol || 'terminal';
  const resolvedRole = resolveUserRole(rawRole);
  return {
    id: payload.sub || payload.user_id || 'unknown',
    name: payload.full_name || payload.name || rawRole,
    email: payload.email || '',
    role: resolvedRole,
    tier: resolvedRole === UserRole.CORE ? SubscriptionTier.ENTERPRISE
      : resolvedRole === UserRole.SOVEREIGN ? SubscriptionTier.PRO
      : SubscriptionTier.FREE,
    tenant_id: payload.tenant_id || 'default',
    tenant_name: payload.tenant_name || 'PREDATOR',
    last_login: new Date().toISOString(),
    data_sectors: payload.data_sectors || [],
  };
}

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<UserProfile | null>(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('predator_auth_token');
    if (token && token.includes('.')) {
      return buildUserFromToken(token);
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const setUser = (newUser: UserProfile) => {
    setUserState(newUser);
    sessionStorage.setItem('predator_auth_token', newUser.role === UserRole.CORE ? 'core-token' : 'user-token');
  };

  const logout = () => {
    setUserState(null);
    sessionStorage.removeItem('predator_auth_token');
    window.location.href = '/'; // Hard reload to clear states
  };

  const updateTier = (tier: SubscriptionTier) => {
    if (user) {
      // Логіка: при апгрейді до PRO змінюємо роль на PRO
      let newRole = user.role;
      if (tier === SubscriptionTier.PRO || tier === SubscriptionTier.ENTERPRISE) {
        if (user.role === UserRole.TERMINAL) {
          newRole = UserRole.PRO;
        }
      }
      setUserState({ ...user, tier, role: newRole });
    }
  };

  const canAccess = (requiredRole: UserRole | string): boolean => {
    if (!user) return false;
    const currentLevel = ROLE_HIERARCHY[user.role] ?? 1;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 1;
    return currentLevel >= requiredLevel;
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === UserRole.CORE,
        isClient: user?.role !== UserRole.CORE,
        canAccess,
        setUser,
        logout,
        updateTier,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;
