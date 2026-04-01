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
import { UserRole } from '../config/roles';

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

  // Premium (Operator) permissions
  if (role === UserRole.CLIENT_PREMIUM) {
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

  // Basic (Explorer) permissions (most restricted)
  if (role === UserRole.CLIENT_BASIC) {
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
    case UserRole.CLIENT_BASIC:
      return 30; // Low density
    case UserRole.CLIENT_PREMIUM:
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
  const role = user?.role || UserRole.CLIENT_BASIC;

  // Metadata flags
  const isExplorer = role === UserRole.CLIENT_BASIC;
  const isOperator = role === UserRole.CLIENT_PREMIUM;
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
        [UserRole.CLIENT_BASIC]: 1,
        [UserRole.CLIENT_PREMIUM]: 2,
        [UserRole.ADMIN]: 3
    };
    return roleLevel[user.role] >= roleLevel[requiredRole];
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
