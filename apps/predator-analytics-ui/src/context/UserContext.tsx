import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole, normalizeUserRole } from '../config/roles';
export { UserRole };

// ============================================================================
// ROLE HIERARCHY (backward-compatible aliases)
// ============================================================================
// Legacy aliases used by older components
export const ROLE_HIERARCHY: Record<string, number> = {
  [UserRole.VIEWER]: 1,
  [UserRole.CLIENT_BASIC]: 1,
  [UserRole.EXPLORER]: 1,
  [UserRole.SUPPLY_CHAIN]: 2,
  [UserRole.OPERATOR]: 2,
  [UserRole.BUSINESS]: 3,
  [UserRole.ANALYST]: 4,
  [UserRole.CLIENT_PREMIUM]: 4,
  [UserRole.ADMIN]: 5,
  [UserRole.COMMANDER]: 5,
  // Backward-compatible aliases
  OPERATOR: 2,
  COMMANDER: 5,
  EXPLORER: 1,
};


// ============================================================================
// NEW USER CONTEXT (Optimized for v2.0)
// ============================================================================

export enum SubscriptionTier {
  BASIC = 'basic',
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export const normalizeSubscriptionTier = (tier?: string | null): 'basic' | 'pro' | 'enterprise' => {
  if (!tier || tier === SubscriptionTier.FREE || tier === SubscriptionTier.BASIC) {
    return SubscriptionTier.BASIC;
  }

  if (tier === SubscriptionTier.ENTERPRISE) {
    return SubscriptionTier.ENTERPRISE;
  }

  return SubscriptionTier.PRO;
};

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole | string;
  tier: SubscriptionTier | string;
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
  canonicalRole: ReturnType<typeof normalizeUserRole>;
  canonicalTier: ReturnType<typeof normalizeSubscriptionTier>;

  // RBAC - checks if current user has at least the required role level
  canAccess: (requiredRole: UserRole | string) => boolean;

  // Actions
  setUser: (user: UserProfile) => void;
  logout: () => void;
  updateTier: (tier: SubscriptionTier) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const setUser = (newUser: UserProfile) => {
    setUserState(newUser);
    // Simple mock token
    sessionStorage.setItem(
      'predator_auth_token',
      normalizeUserRole(newUser.role) === UserRole.ADMIN ? 'admin-token' : 'user-token'
    );
  };

  const logout = () => {
    setUserState(null);
    sessionStorage.removeItem('predator_auth_token');
    window.location.href = '/'; // Hard reload to clear states
  };

  const updateTier = (tier: SubscriptionTier) => {
    if (user) {
      let newRole = user.role;
      const currentRole = normalizeUserRole(user.role);
      const normalizedTier = normalizeSubscriptionTier(tier);

      if (normalizedTier === SubscriptionTier.PRO && currentRole === UserRole.VIEWER) {
        newRole = UserRole.SUPPLY_CHAIN;
      }

      if (normalizedTier === SubscriptionTier.ENTERPRISE && currentRole === UserRole.VIEWER) {
        newRole = UserRole.BUSINESS;
      }

      setUserState({ ...user, tier, role: newRole });
    }
  };

  const canAccess = (requiredRole: UserRole | string): boolean => {
    if (!user) return false;
    const currentLevel = ROLE_HIERARCHY[normalizeUserRole(user.role)] ?? 1;
    const requiredLevel = ROLE_HIERARCHY[normalizeUserRole(requiredRole)] ?? 1;
    return currentLevel >= requiredLevel;
  };

  const canonicalRole = normalizeUserRole(user?.role);
  const canonicalTier = normalizeSubscriptionTier(user?.tier);

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: canonicalRole === UserRole.ADMIN,
        isClient: canonicalRole !== UserRole.ADMIN,
        canonicalRole,
        canonicalTier,
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
