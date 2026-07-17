import { create } from 'zustand';
import { useUserStore } from './useUserStore';
import { UserRole, RoleCapabilities, ROLE_CAPABILITIES, ROLE_DISPLAY_NAMES, ROLE_DESCRIPTIONS, resolveUserRole } from '../config/roles';

interface RoleState {
  // Computed values that refresh when user changes
  getRoleData: () => {
    role: UserRole;
    capabilities: RoleCapabilities;
    displayName: string;
    description: string;
    isAdmin: boolean;
    isTerminal: boolean;
    isPro: boolean;
    isSovereign: boolean;
    isCore: boolean;
    // Легасі-аліаси для зворотної сумісності
    isPromo: boolean;
    isVIP: boolean;
    isPremium: boolean;
    isBasic: boolean;
    isDRPO: boolean;
  };
}

export const useRoleStore = create<RoleState>((_set, _get) => ({
  getRoleData: () => {
    const user = useUserStore.getState().user;
    const role = resolveUserRole(user?.role);

    return {
      role,
      capabilities: ROLE_CAPABILITIES[role],
      displayName: ROLE_DISPLAY_NAMES[role],
      description: ROLE_DESCRIPTIONS[role],
      isAdmin: role === UserRole.CORE,
      isTerminal: role === UserRole.TERMINAL,
      isPro: role === UserRole.PRO,
      isSovereign: role === UserRole.SOVEREIGN,
      isCore: role === UserRole.CORE,
      // Легасі-аліаси для зворотної сумісності
      isPromo: role === UserRole.TERMINAL,
      isVIP: role === UserRole.SOVEREIGN,
      isPremium: role === UserRole.PRO || role === UserRole.SOVEREIGN,
      isBasic: role === UserRole.TERMINAL,
      isDRPO: role === UserRole.SOVEREIGN,
    };
  }
}));

// Backward compatibility hook: useRole
// Note: This needs to be a hook to subscribe to user state changes
export const useRole = () => {
  const user = useUserStore((state) => state.user);
  const role = resolveUserRole(user?.role);

  return {
    role,
    capabilities: ROLE_CAPABILITIES[role],
    displayName: ROLE_DISPLAY_NAMES[role],
    description: ROLE_DESCRIPTIONS[role],
    isAdmin: role === UserRole.CORE,
    isTerminal: role === UserRole.TERMINAL,
    isPro: role === UserRole.PRO,
    isSovereign: role === UserRole.SOVEREIGN,
    isCore: role === UserRole.CORE,
    // Легасі-аліаси для зворотної сумісності
    isPromo: role === UserRole.TERMINAL,
    isVIP: role === UserRole.SOVEREIGN,
    isPremium: role === UserRole.PRO || role === UserRole.SOVEREIGN,
    isBasic: role === UserRole.TERMINAL,
    isDRPO: role === UserRole.SOVEREIGN,
  };
};
