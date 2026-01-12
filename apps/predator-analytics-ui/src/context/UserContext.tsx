
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ============================================================================
// ROLE-BASED ACCESS CONTROL SYSTEM
// ============================================================================

export enum UserRole {
  EXPLORER = 'explorer',   // Базовий доступ - пошук, документи
  OPERATOR = 'operator',   // Операційний - моніторинг, агенти (read-only)
  COMMANDER = 'commander', // Повний контроль - все
}

export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export type DataSector = 'GOV' | 'BIZ' | 'MED' | 'SCI' | 'OSINT' | 'GENERAL';

export interface Permission {
  resource: string;
  actions: ('read' | 'write' | 'delete' | 'admin')[];
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
  permissions: Permission[];
  data_sectors: DataSector[];
  created_at: string;
  last_login: string;
}

interface UserContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Role checks
  isExplorer: boolean;
  isOperator: boolean;
  isCommander: boolean;

  // Permission checks
  hasPermission: (resource: string, action: 'read' | 'write' | 'delete' | 'admin') => boolean;
  hasSectorAccess: (sector: DataSector) => boolean;
  canAccess: (requiredRole: UserRole) => boolean;

  // Actions
  setUser: (user: UserProfile) => void;
  logout: () => void;
  updateTier: (tier: SubscriptionTier) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// ============================================================================
// USER PROVIDER
// ============================================================================

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initUser = async () => {
      setIsLoading(true);
      try {
        const token = sessionStorage.getItem('predator_auth_token');
        if (!token) {
          // DEMO MODE: Set default Commander user for full access
          setUserState({
            id: 'demo-user',
            name: 'Demo Commander',
            email: 'demo@predator.ai',
            avatar: 'D',
            role: UserRole.COMMANDER,
            tier: SubscriptionTier.ENTERPRISE,
            tenant_id: 'demo',
            tenant_name: 'Demo Tenant',
            permissions: [
              { resource: 'documents', actions: ['read', 'write', 'delete', 'admin'] },
              { resource: 'search', actions: ['read', 'write'] },
              { resource: 'analytics', actions: ['read', 'write'] },
              { resource: 'agents', actions: ['read', 'write'] },
              { resource: 'security', actions: ['read', 'write'] },
              { resource: 'deployment', actions: ['read', 'write'] },
              { resource: 'settings', actions: ['read', 'write', 'admin'] },
              { resource: 'ml_training', actions: ['read', 'write', 'admin'] },
              { resource: 'data', actions: ['read', 'write', 'admin'] },
            ],
            data_sectors: ['GOV', 'BIZ', 'MED', 'SCI', 'OSINT', 'GENERAL'],
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString(),
          });
          return;
        }

        const res = await fetch('/api/v1/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          // API error - still set demo user
          setUserState({
            id: 'demo-user',
            name: 'Demo Commander',
            email: 'demo@predator.ai',
            avatar: 'D',
            role: UserRole.COMMANDER,
            tier: SubscriptionTier.ENTERPRISE,
            tenant_id: 'demo',
            tenant_name: 'Demo Tenant',
            permissions: [
              { resource: 'documents', actions: ['read', 'write', 'delete', 'admin'] },
              { resource: 'search', actions: ['read', 'write'] },
              { resource: 'analytics', actions: ['read', 'write'] },
              { resource: 'agents', actions: ['read', 'write'] },
              { resource: 'security', actions: ['read', 'write'] },
              { resource: 'deployment', actions: ['read', 'write'] },
              { resource: 'settings', actions: ['read', 'write', 'admin'] },
              { resource: 'ml_training', actions: ['read', 'write', 'admin'] },
              { resource: 'data', actions: ['read', 'write', 'admin'] },
            ],
            data_sectors: ['GOV', 'BIZ', 'MED', 'SCI', 'OSINT', 'GENERAL'],
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString(),
          });
          return;
        }

        const data = await res.json();

        // Map backend profile -> UI profile shape (truth-only defaults)
        const role = (data.role || UserRole.EXPLORER) as UserRole;
        const tier = (data.subscription_level || SubscriptionTier.FREE) as SubscriptionTier;
        const canViewPII = !!data.can_view_pii;

        const permissions: Permission[] = [
          { resource: 'documents', actions: ['read'] },
          { resource: 'search', actions: ['read'] },
          { resource: 'analytics', actions: role !== UserRole.EXPLORER ? ['read'] : ['read'] },
        ];
        if (role !== UserRole.EXPLORER) {
          permissions.push({ resource: 'agents', actions: ['read'] });
          permissions.push({ resource: 'security', actions: ['read'] });
          permissions.push({ resource: 'deployment', actions: ['read'] });
        }
        if (role === UserRole.COMMANDER) {
          permissions.push({ resource: 'settings', actions: ['read', 'write', 'admin'] });
          permissions.push({ resource: 'ml_training', actions: ['read', 'write', 'admin'] });
        }
        if (canViewPII) {
          permissions.push({ resource: 'pii', actions: ['read'] });
        }

        setUserState({
          id: String(data.user_id ?? data.id ?? ''),
          name: data.name || data.email || 'User',
          email: data.email,
          avatar: (data.email || 'U').substring(0, 1).toUpperCase(),
          role,
          tier,
          tenant_id: String(data.tenant_id ?? 'default'),
          tenant_name: String(data.tenant_name ?? 'Default'),
          permissions,
          data_sectors: (data.data_sectors ?? ['GENERAL']) as DataSector[],
          created_at: data.created_at || new Date().toISOString(),
          last_login: data.last_login || new Date().toISOString(),
        });
      } finally {
        setIsLoading(false);
      }
    };
    initUser();
  }, []);

  // Role computed properties
  const isExplorer = user?.role === UserRole.EXPLORER;
  const isOperator = user?.role === UserRole.OPERATOR;
  const isCommander = user?.role === UserRole.COMMANDER;

  // Permission check
  const hasPermission = (resource: string, action: 'read' | 'write' | 'delete' | 'admin'): boolean => {
    if (!user) return false;
    if (isCommander) return true; // Commander has all permissions

    const perm = user.permissions.find(p => p.resource === resource);
    return perm ? perm.actions.includes(action) : false;
  };

  // Sector access check
  const hasSectorAccess = (sector: DataSector): boolean => {
    if (!user) return false;
    if (isCommander) return true;
    return user.data_sectors.includes(sector);
  };

  // Role hierarchy check
  const canAccess = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    const roleHierarchy = {
      [UserRole.EXPLORER]: 1,
      [UserRole.OPERATOR]: 2,
      [UserRole.COMMANDER]: 3,
    };
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  };

  const setUser = (newUser: UserProfile) => {
    setUserState(newUser);
  };

  const logout = () => {
    setUserState(null);
  };

  const updateTier = (tier: SubscriptionTier) => {
    if (user) {
      setUserState({ ...user, tier });
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isExplorer,
        isOperator,
        isCommander,
        hasPermission,
        hasSectorAccess,
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

// ============================================================================
// HOOK
// ============================================================================

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};

// ============================================================================
// PROTECTED COMPONENT WRAPPER
// ============================================================================

interface ProtectedProps {
  children: ReactNode;
  requiredRole?: UserRole;
  requiredPermission?: { resource: string; action: 'read' | 'write' | 'delete' | 'admin' };
  fallback?: ReactNode;
}

export const Protected: React.FC<ProtectedProps> = ({
  children,
  requiredRole,
  requiredPermission,
  fallback = null,
}) => {
  const { canAccess, hasPermission, isAuthenticated } = useUser();

  if (!isAuthenticated) return <>{fallback}</>;
  if (requiredRole && !canAccess(requiredRole)) return <>{fallback}</>;
  if (requiredPermission && !hasPermission(requiredPermission.resource, requiredPermission.action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// ============================================================================
// ACCESS LEVEL INDICATOR COMPONENT
// ============================================================================

interface AccessIndicatorProps {
  level: 'full' | 'restricted' | 'locked' | 'readonly';
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export const AccessIndicator: React.FC<AccessIndicatorProps> = ({
  level,
  size = 'sm',
  showLabel = false,
}) => {
  const config = {
    full: { icon: '🔓', label: 'Повний доступ', color: 'text-emerald-400' },
    restricted: { icon: '🔐', label: 'Обмежено', color: 'text-amber-400' },
    locked: { icon: '🔒', label: 'Заборонено', color: 'text-red-400' },
    readonly: { icon: '👁️', label: 'Тільки перегляд', color: 'text-blue-400' },
  };

  const { icon, label, color } = config[level];
  const sizeClass = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <span className={`inline-flex items-center gap-1 ${sizeClass} ${color}`}>
      <span>{icon}</span>
      {showLabel && <span className="font-medium">{label}</span>}
    </span>
  );
};

export default UserContext;
