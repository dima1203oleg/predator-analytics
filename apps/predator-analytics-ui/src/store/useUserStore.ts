import { create } from 'zustand';
import { UserRole } from '../config/roles';

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

export const ROLE_HIERARCHY: Record<string, number> = {
  [UserRole.CLIENT_BASIC]: 1,
  [UserRole.CLIENT_PREMIUM]: 2,
  [UserRole.ADMIN]: 3,
  'OPERATOR': 2,
  'COMMANDER': 3,
  'EXPLORER': 1,
};

interface UserState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Computed (derived)
  isAdmin: boolean;
  isClient: boolean;

  // Actions
  setUser: (user: UserProfile | null) => void;
  logout: () => void;
  updateTier: (tier: SubscriptionTier) => void;
  canAccess: (requiredRole: UserRole | string) => boolean;
  setLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: {
    id: 'dev-admin',
    name: 'Системний адміністратор (DEV)',
    email: 'admin@predator.ua',
    role: UserRole.ADMIN,
    tier: SubscriptionTier.ENTERPRISE,
    tenant_id: 'system',
    tenant_name: 'Системний контур',
    last_login: new Date().toISOString(),
    data_sectors: ['ALPHA', 'GAMMA', 'DELTA-9']
  },
  isLoading: false,
  isAuthenticated: true,
  isAdmin: true,
  isClient: false,

  setUser: (user) => {
    set({ 
      user, 
      isAuthenticated: !!user,
      isAdmin: user?.role === UserRole.ADMIN,
      isClient: user?.role === UserRole.CLIENT_BASIC || user?.role === UserRole.CLIENT_PREMIUM
    });
    if (user) {
      try {
        sessionStorage.setItem('predator_auth_token', user.role === UserRole.ADMIN ? 'admin-token' : 'user-token');
      } catch {
        // no-op
      }
    } else {
      try {
        sessionStorage.removeItem('predator_auth_token');
      } catch {
        // no-op
      }
    }
  },

  logout: () => {
    set({ user: null, isAuthenticated: false, isAdmin: false, isClient: false });
    try {
      sessionStorage.removeItem('predator_auth_token');
    } catch {
      // no-op
    }
    window.location.href = '/'; 
  },

  updateTier: (tier: SubscriptionTier) => {
    const { user, setUser } = get();
    if (user) {
      let newRole = user.role;
      if (tier === SubscriptionTier.PRO || tier === SubscriptionTier.ENTERPRISE) {
        if (user.role === UserRole.CLIENT_BASIC) {
          newRole = UserRole.CLIENT_PREMIUM;
        }
      }
      setUser({ ...user, tier, role: newRole });
    }
  },

  canAccess: (requiredRole: UserRole | string): boolean => {
    const user = get().user;
    if (!user) return false;
    const currentLevel = ROLE_HIERARCHY[user.role] ?? 1;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 1;
    return currentLevel >= requiredLevel;
  },

  setLoading: (isLoading) => set({ isLoading }),
}));

// Backward compatibility hook: useUser
export const useUser = () => useUserStore();
