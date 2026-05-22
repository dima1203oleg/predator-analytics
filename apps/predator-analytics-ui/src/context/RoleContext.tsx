import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useUser } from './UserContext';
import { UserRole, RoleCapabilities, ROLE_CAPABILITIES, ROLE_DISPLAY_NAMES, ROLE_DESCRIPTIONS, resolveUserRole } from '../config/roles';

/**
 * PREDATOR ELITE — Контекст Допусків
 *
 * Забезпечує доступ до поточного рівня допуску користувача
 * та його можливостей (capabilities) з матрицею маскування.
 */
interface RoleContextType {
  role: UserRole;
  capabilities: RoleCapabilities;
  displayName: string;
  description: string;

  // Канонічні прапорці допусків PREDATOR ELITE
  isTerminal: boolean;
  isPro: boolean;
  isSovereign: boolean;
  isCore: boolean;

  // Утиліти перевірки рівня
  hasAtLeastPro: boolean;
  hasAtLeastSovereign: boolean;
  isClientFacing: boolean;

  // Легасі-аліаси для зворотної сумісності
  isAdmin: boolean;
  isPromo: boolean;
  isVIP: boolean;
  isPremium: boolean;
  isBasic: boolean;
  isDRPO: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

/**
 * Маппінг пріоритету рівнів для порівнянь hasAtLeast*
 */
const ROLE_PRIORITY: Record<string, number> = {
  terminal: 1,
  pro: 2,
  sovereign: 3,
  core: 0, // Core — технічний рівень, не порівнюється з бізнес-рівнями
};

export const RoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useUser();

  const role = useMemo((): UserRole => resolveUserRole(user?.role), [user]);

  const capabilities = useMemo(() => ROLE_CAPABILITIES[role], [role]);
  const rolePriority = useMemo(() => ROLE_PRIORITY[role] ?? 0, [role]);

  const value = useMemo(() => ({
    role,
    capabilities,
    displayName: ROLE_DISPLAY_NAMES[role] ?? 'PREDATOR Terminal',
    description: ROLE_DESCRIPTIONS[role] ?? '',

    // Канонічні прапорці
    isTerminal: role === UserRole.TERMINAL,
    isPro: role === UserRole.PRO,
    isSovereign: role === UserRole.SOVEREIGN,
    isCore: role === UserRole.CORE,

    // Утиліти перевірки рівня
    hasAtLeastPro: rolePriority >= 2,
    hasAtLeastSovereign: rolePriority >= 3,
    isClientFacing: capabilities.isClientFacing,

    // Легасі-аліаси для зворотної сумісності
    isAdmin: role === UserRole.CORE,
    isPromo: role === UserRole.TERMINAL,
    isVIP: role === UserRole.SOVEREIGN,
    isPremium: role === UserRole.PRO || role === UserRole.SOVEREIGN,
    isBasic: role === UserRole.TERMINAL,
    isDRPO: role === UserRole.SOVEREIGN,
  }), [role, capabilities, rolePriority]);

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (!context) {
    console.warn('useRole використано поза RoleProvider — повертаємо Terminal за замовчуванням');
    return {
      role: UserRole.TERMINAL,
      capabilities: ROLE_CAPABILITIES[UserRole.TERMINAL],
      displayName: ROLE_DISPLAY_NAMES[UserRole.TERMINAL],
      description: ROLE_DESCRIPTIONS[UserRole.TERMINAL],
      isTerminal: true,
      isPro: false,
      isSovereign: false,
      isCore: false,
      hasAtLeastPro: false,
      hasAtLeastSovereign: false,
      isClientFacing: true,
      // Легасі-аліаси
      isAdmin: false,
      isPromo: true,
      isVIP: false,
      isPremium: false,
      isBasic: true,
      isDRPO: false,
    };
  }
  return context;
};
