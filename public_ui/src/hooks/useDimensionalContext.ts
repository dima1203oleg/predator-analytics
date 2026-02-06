/**
 * useDimensionalContext - Core hook for Dimensional Intelligence UI
 *
 * Provides unified access to:
 * - User role and permissions
 * - Current UI dimension (Nebula/Cortex/Nexus)
 * - Automatic visualization mode selection
 * - Permission checking utilities
 */

import { useUser, UserRole } from '../context/UserContext';
import { useShell, UIShell } from '../context/ShellContext';

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

  // Commander sees everything
  if (role === UserRole.COMMANDER) return 'FULL';

  // Operator permissions
  if (role === UserRole.OPERATOR) {
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

  // Explorer permissions (most restricted)
  if (role === UserRole.EXPLORER) {
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
    case UserRole.EXPLORER:
      return 30; // Low density
    case UserRole.OPERATOR:
      return 60; // Medium density
    case UserRole.COMMANDER:
      return 100; // Maximum density
    default:
      return 30;
  }
}

/**
 * Main hook
 */
export const useDimensionalContext = (): DimensionalContext => {
  const { user, hasPermission, canAccess: userCanAccess, isExplorer, isOperator, isCommander } = useUser();
  const { currentShell } = useShell();

  const dimension = shellToDimension(currentShell);
  const role = user?.role || UserRole.EXPLORER;

  // Permission checking
  const canAccess = (resource: string, action: string = 'read'): boolean => {
    if (!user) return false;
    return hasPermission(resource, action as any);
  };

  const canAccessLevel = (requiredRole: UserRole): boolean => {
    return userCanAccess(requiredRole);
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
