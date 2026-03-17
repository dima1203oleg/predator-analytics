import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole } from '../config/roles';
export { UserRole };

// ============================================================================
// ROLE HIERARCHY (backward-compatible aliases)
// ============================================================================
// Legacy aliases used by older components
export const ROLE_HIERARCHY: Record<string, number> = {
  [UserRole.CLIENT_BASIC]: 1,
  [UserRole.CLIENT_PREMIUM]: 2,
  [UserRole.ADMIN]: 3,
  // Backward-compatible aliases
  'OPERATOR': 2,
  'COMMANDER': 3,
  'EXPLORER': 1,
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

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const setUser = (newUser: UserProfile) => {
    setUserState(newUser);
    // Simple mock token (safe: storage може бути заблокований у деяких режимах браузера)
    try {
      sessionStorage.setItem('predator_auth_token', newUser.role === UserRole.ADMIN ? 'admin-token' : 'user-token');
    } catch {
      // no-op
    }
  };

  const logout = () => {
    setUserState(null);
    try {
      sessionStorage.removeItem('predator_auth_token');
    } catch {
      // no-op
    }
    window.location.href = '/'; // Hard reload to clear states
  };

  const updateTier = (tier: SubscriptionTier) => {
    if (user) {
      // Logic: if upgrading to PRO, change role to PREMIUM
      let newRole = user.role;
      if (tier === SubscriptionTier.PRO || tier === SubscriptionTier.ENTERPRISE) {
        if (user.role === UserRole.CLIENT_BASIC) {
          newRole = UserRole.CLIENT_PREMIUM;
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
        isAdmin: user?.role === UserRole.ADMIN,
        isClient: user?.role === UserRole.CLIENT_BASIC || user?.role === UserRole.CLIENT_PREMIUM,
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
    // Return safe defaults instead of crashing
    console.warn('useUser used outside of UserProvider - returning defaults');
    return {
      user: null,
      isLoading: true,
      isAuthenticated: false,
      isAdmin: false,
      isClient: false,
      canAccess: () => true, // safe default: allow all when outside provider
      setUser: () => { },
      logout: () => { },
      updateTier: () => { },
    };

  }
  return context;
};

export default UserContext;
