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
    isPremium: boolean;
    isBasic: boolean;
  };
}

export const useRoleStore = create<RoleState>((_set, _get) => ({
  getRoleData: () => {
    const user = useUserStore.getState().user;
    const role = user?.role || UserRole.CLIENT_BASIC;
    
    return {
      role,
      capabilities: ROLE_CAPABILITIES[role],
      displayName: ROLE_DISPLAY_NAMES[role],
      description: ROLE_DESCRIPTIONS[role],
      isAdmin: role === UserRole.ADMIN,
      isPremium: role === UserRole.CLIENT_PREMIUM,
      isBasic: role === UserRole.CLIENT_BASIC,
    };
  }
}));

// Backward compatibility hook: useRole
// Note: This needs to be a hook to subscribe to user state changes
export const useRole = () => {
  const user = useUserStore((state) => state.user);
  const role = user?.role || UserRole.CLIENT_BASIC;
  
  return {
    role,
    capabilities: ROLE_CAPABILITIES[role],
    displayName: ROLE_DISPLAY_NAMES[role],
    description: ROLE_DESCRIPTIONS[role],
    isAdmin: role === UserRole.ADMIN,
    isPremium: role === UserRole.CLIENT_PREMIUM,
    isBasic: role === UserRole.CLIENT_BASIC,
  };
};
