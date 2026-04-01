/**
 * useDimensionalContext - Core hook for Dimensional Intelligence UI
 *
 * Provides unified access to:
 * - User role and permissions
 * - Current UI dimension (Nebula/Cortex/Nexus)
 * - Automatic visualization mode selection
 * - Permission checking utilities
 */

import { useUser } from '../context/UserContext';
import { useShell, UIShell } from '../context/ShellContext';
import { UserRole, normalizeUserRole } from '../config/roles';

export type Dimension = 'NEBULA' | 'CORTEX' | 'NEXUS';
export type DataSensitivity = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'CLASSIFIED';
export type VisualizationMode = 'FULL' | 'BLURRED' | 'REDACTED' | 'HASHED' | 'LOCKED';

interface DimensionalContext {
  // Core identity
  dimension: Dimension;
  role: UserRole;

  // Permission utilities
  canAccess: (resource: string, action?: string) => boolean;
  canAccessLevel: (requiredRole: UserRole) => boolean;

  // Visualization helpers
  getVisualizationMode: (sensitivity: DataSensitivity) => VisualizationMode;
  shouldReveal: (sensitivity: DataSensitivity) => boolean;

  // Metadata
  isExplorer: boolean;
  isOperator: boolean;
  isCommander: boolean;

  // Information density (0-100)
  informationDensity: number;
}

/**
 * Map UIShell to Dimension
 */
function shellToDimension(shell: UIShell): Dimension {
  switch (shell) {
    case UIShell.EXPLORER:
      return 'NEBULA';
    case UIShell.OPERATOR:
      return 'CORTEX';
    case UIShell.COMMANDER:
      return 'NEXUS';
    default:
      return 'NEBULA';
  }
}

/**
 * Determine visualization mode based on role and data sensitivity
 */
function determineVisualizationMode(
  role: UserRole,
  sensitivity: DataSensitivity
): VisualizationMode {
  // Public data is always visible
  if (sensitivity === 'PUBLIC') return 'FULL';

  // Admin (Commander) sees everything
  if (role === UserRole.ADMIN) return 'FULL';

  if (role === UserRole.ANALYST || role === UserRole.BUSINESS) {
    switch (sensitivity) {
      case 'INTERNAL':
        return 'FULL';
      case 'CONFIDENTIAL':
        return 'BLURRED';
      case 'CLASSIFIED':
        return 'REDACTED';
      default:
        return 'LOCKED';
    }
  }

  if (role === UserRole.SUPPLY_CHAIN) {
    switch (sensitivity) {
      case 'INTERNAL':
        return 'FULL';
      case 'CONFIDENTIAL':
        return 'BLURRED';
      case 'CLASSIFIED':
        return 'REDACTED';
      default:
        return 'FULL';
    }
  }

  if (role === UserRole.VIEWER) {
    switch (sensitivity) {
      case 'INTERNAL':
        return 'HASHED';
      case 'CONFIDENTIAL':
      case 'CLASSIFIED':
        return 'LOCKED';
      default:
        return 'FULL';
    }
  }

  // Default: locked
  return 'LOCKED';
}

/**
 * Calculate information density percentage based on role
 */
function getInformationDensity(role: UserRole): number {
  switch (role) {
    case UserRole.VIEWER:
      return 30; // Low density
    case UserRole.SUPPLY_CHAIN:
      return 55;
    case UserRole.BUSINESS:
      return 70;
    case UserRole.ANALYST:
      return 60; // Medium density
    case UserRole.ADMIN:
      return 100; // Maximum density
    default:
      return 30;
  }
}

/**
 * Main hook
 */
export const useDimensionalContext = (): DimensionalContext => {
  const { user, isAdmin, isClient } = useUser();
  const { currentShell } = useShell();

  const dimension = shellToDimension(currentShell);
  const role = normalizeUserRole(user?.role) as UserRole;

  // Metadata flags
  const isExplorer = role === UserRole.VIEWER || role === UserRole.SUPPLY_CHAIN;
  const isOperator = role === UserRole.BUSINESS || role === UserRole.ANALYST;
  const isCommander = role === UserRole.ADMIN;

  // Permission checking
  const canAccess = (resource: string, action: string = 'read'): boolean => {
    if (!user) return false;
    // Mock legacy permission check
    if (isAdmin) return true;
    return isClient;
  };

  const canAccessLevel = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    const roleLevel = {
        [UserRole.VIEWER]: 1,
        [UserRole.SUPPLY_CHAIN]: 2,
        [UserRole.BUSINESS]: 3,
        [UserRole.ANALYST]: 4,
        [UserRole.ADMIN]: 5
    };
    return roleLevel[normalizeUserRole(user.role)] >= roleLevel[normalizeUserRole(requiredRole)];
  };

  // Visualization mode selector
  const getVisualizationMode = (sensitivity: DataSensitivity): VisualizationMode => {
    return determineVisualizationMode(role, sensitivity);
  };

  // Check if data should be revealed
  const shouldReveal = (sensitivity: DataSensitivity): boolean => {
    const mode = getVisualizationMode(sensitivity);
    return mode === 'FULL';
  };

  return {
    dimension,
    role,
    canAccess,
    canAccessLevel,
    getVisualizationMode,
    shouldReveal,
    isExplorer,
    isOperator,
    isCommander,
    informationDensity: getInformationDensity(role),
  };
};

/**
 * Helper hook for quick permission checks
 */
export const usePermissionCheck = (requiredRole: UserRole) => {
  const { canAccessLevel, role } = useDimensionalContext();
  const hasAccess = canAccessLevel(requiredRole);

  return {
    hasAccess,
    currentRole: role,
    requiredRole,
    accessDenied: !hasAccess,
  };
};

/**
 * Helper hook for data sensitivity visualization
 */
export const useDataVisualization = (sensitivity: DataSensitivity) => {
  const { getVisualizationMode, shouldReveal, role } = useDimensionalContext();
  const mode = getVisualizationMode(sensitivity);

  return {
    mode,
    shouldReveal: shouldReveal(sensitivity),
    isLocked: mode === 'LOCKED',
    isBlurred: mode === 'BLURRED',
    isRedacted: mode === 'REDACTED',
    isHashed: mode === 'HASHED',
    isFull: mode === 'FULL',
    currentRole: role,
    sensitivity,
  };
};
