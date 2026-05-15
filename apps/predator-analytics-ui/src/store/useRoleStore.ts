import { create } from 'zustand';
import { useUserStore } from './useUserStore';
import { UserRole, RoleCapabilities, ROLE_CAPABILITIES, ROLE_DISPLAY_NAMES, ROLE_DESCRIPTIONS } from '../config/roles';

interface RoleState {
  // Computed values that refresh when user changes
  getRoleData: () => {
    role: UserRole;
    capabilities: RoleCapabilities;
    displayName: string;
    description: string;
    isAdmin: boolean;
    isPromo: boolean;
    isPro: boolean;
    isVIP: boolean;
    // Легасі-аліаси для зворотної сумісності
    isPremium: boolean;
    isBasic: boolean;
    isDRPO: boolean;
  };
}

export const useRoleStore = create<RoleState>((_set, _get) => ({
  getRoleData: () => {
    const user = useUserStore.getState().user;
    const role = user?.role || UserRole.PROMO;

    return {
      role,
      capabilities: ROLE_CAPABILITIES[role],
      displayName: ROLE_DISPLAY_NAMES[role],
      description: ROLE_DESCRIPTIONS[role],
      isAdmin: role === UserRole.ADMIN,
      isPromo: role === UserRole.PROMO,
      isPro: role === UserRole.PRO,
      isVIP: role === UserRole.VIP,
      // Легасі-аліаси для зворотної сумісності
      isPremium: role === UserRole.PRO || role === UserRole.VIP,
      isBasic: role === UserRole.PROMO,
      isDRPO: role === UserRole.VIP,
    };
  }
}));

// Backward compatibility hook: useRole
// Note: This needs to be a hook to subscribe to user state changes
export const useRole = () => {
  const user = useUserStore((state) => state.user);
  const role = user?.role || UserRole.PROMO;

  return {
    role,
    capabilities: ROLE_CAPABILITIES[role],
    displayName: ROLE_DISPLAY_NAMES[role],
    description: ROLE_DESCRIPTIONS[role],
    isAdmin: role === UserRole.ADMIN,
    isPromo: role === UserRole.PROMO,
    isPro: role === UserRole.PRO,
    isVIP: role === UserRole.VIP,
    // Легасі-аліаси для зворотної сумісності
    isPremium: role === UserRole.PRO || role === UserRole.VIP,
    isBasic: role === UserRole.PROMO,
    isDRPO: role === UserRole.VIP,
  };
};
