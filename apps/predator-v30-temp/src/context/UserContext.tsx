import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole } from '../config/roles';
export { UserRole };

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
}

interface UserContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Helpers
  isAdmin: boolean;
  isClient: boolean;

  // Actions
  setUser: (user: UserProfile) => void;
  logout: () => void;
  updateTier: (tier: SubscriptionTier) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // DEVELOPMENT BYPASS: Always log in as Admin
    setUserState({
      id: 'dev-admin',
      name: 'System Administrator (DEV)',
      email: 'admin@predator.ai',
      role: UserRole.ADMIN,
      tier: SubscriptionTier.ENTERPRISE,
      tenant_id: 'system',
      tenant_name: 'System Root',
      last_login: new Date().toISOString()
    });
    setIsLoading(false);
  }, []);

  const setUser = (newUser: UserProfile) => {
    setUserState(newUser);
    // Simple mock token
    sessionStorage.setItem('predator_auth_token', newUser.role === UserRole.ADMIN ? 'admin-token' : 'user-token');
  };

  const logout = () => {
    setUserState(null);
    sessionStorage.removeItem('predator_auth_token');
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

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === UserRole.ADMIN,
        isClient: user?.role === UserRole.CLIENT_BASIC || user?.role === UserRole.CLIENT_PREMIUM,
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
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};

export default UserContext;
