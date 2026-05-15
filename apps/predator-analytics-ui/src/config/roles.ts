/* eslint-disable @typescript-eslint/no-duplicate-enum-values */
export enum UserRole {
  // Нові ролі згідно з ТЗ RBAC v61.0
  PROMO = 'promo',           // Рівень 1: STANDARD / PROMO (рекламно-заохочувальний)
  PRO = 'pro',               // Рівень 2: PRO CLIENT (комерційний доступ)
  VIP = 'vip',               // Рівень 3: VIP CLIENT / ELITE SIGINT (повний VIP доступ)
  ADMIN = 'admin',           // Рівень 4: SYSTEM ADMIN (технічне управління)

  // Легасі-аліаси для зворотної сумісності
  CLIENT_BASIC = 'promo',
  CLIENT_PREMIUM = 'pro',
  CLIENT_DRPO = 'vip',
  ANALYST = 'pro',
  OPERATOR = 'promo',
  COMMANDER = 'admin',
  EXPLORER = 'promo',
  INVESTIGATOR = 'vip',
}

export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  [UserRole.PROMO]: 'Standard / Promo',
  [UserRole.PRO]: 'Pro Client',
  [UserRole.VIP]: 'VIP Elite',
  [UserRole.ADMIN]: 'System Admin',
};

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  [UserRole.PROMO]: 'Рекламно-заохочувальний рівень: базові дешборди та огляд ринку з маскуванням даних',
  [UserRole.PRO]: 'Комерційний доступ: повний аналітичний інструментарій без деанонімізації',
  [UserRole.VIP]: 'VIP Elite: безлімітний аналітичний доступ включаючи деанонімізацію та сирі дані',
  [UserRole.ADMIN]: 'Технічне управління: повний контроль інфраструктури без доступу до бізнес-даних',
};

export interface RoleCapabilities {
  // UI-секції
  canSeeDashboards: boolean;
  canSeeVisualAnalytics: boolean;
  canSeeRelationsGraph: boolean;
  canSeeTimelines: boolean;
  canSeeOpenSearch: boolean;
  canSeeSensitiveData: boolean;
  canSeeSystemCore: boolean;
  canSeeInvestigation: boolean;

  // Функціональність
  canAccessFullNewspaper: boolean;
  canAccessDetailedTrends: boolean;
  canToggleSensitiveData: boolean;
  canManageUsers: boolean;
  canManageJurisdictions: boolean;
  canViewAuditLogs: boolean;
  canSwitchBackend: boolean;

  // Ізоляція адміна — виключно системна зона
  isAdminExclusive: boolean;
}

export const ROLE_CAPABILITIES: Record<UserRole, RoleCapabilities> = {
  // РІВЕНЬ 1: PROMO (рекламно-заохочувальний)
  [UserRole.PROMO]: {
    canSeeDashboards: true,
    canSeeVisualAnalytics: true,
    canSeeRelationsGraph: false,  // 🔒 Тільки в PRO/VIP
    canSeeTimelines: false,      // 🔒 Тільки в PRO/VIP
    canSeeOpenSearch: true,
    canSeeSensitiveData: false,  // 🔒 Суворе маскування
    canSeeSystemCore: false,
    canSeeInvestigation: false,  // 🔒 Тільки в PRO/VIP
    canAccessFullNewspaper: false,  // 🔒 Тільки в PRO/VIP
    canAccessDetailedTrends: true,
    canToggleSensitiveData: false,
    canManageUsers: false,
    canManageJurisdictions: false,
    canViewAuditLogs: false,
    canSwitchBackend: false,
    isAdminExclusive: false,
  },

  // РІВЕНЬ 2: PRO (комерційний доступ)
  [UserRole.PRO]: {
    canSeeDashboards: true,
    canSeeVisualAnalytics: true,
    canSeeRelationsGraph: true,
    canSeeTimelines: true,
    canSeeOpenSearch: true,
    canSeeSensitiveData: false,  // 🔒 Маскування на рівні API (без деанонімізації)
    canSeeSystemCore: false,
    canSeeInvestigation: true,
    canAccessFullNewspaper: true,
    canAccessDetailedTrends: true,
    canToggleSensitiveData: false,  // 🔒 Не можна перемикати сирі дані
    canManageUsers: false,
    canManageJurisdictions: false,
    canViewAuditLogs: false,
    canSwitchBackend: false,
    isAdminExclusive: false,
  },

  // РІВЕНЬ 3: VIP (повний доступ)
  [UserRole.VIP]: {
    canSeeDashboards: true,
    canSeeVisualAnalytics: true,
    canSeeRelationsGraph: true,
    canSeeTimelines: true,
    canSeeOpenSearch: true,
    canSeeSensitiveData: true,   // ✅ Повний доступ до чутливих даних
    canSeeSystemCore: false,
    canSeeInvestigation: true,
    canAccessFullNewspaper: true,
    canAccessDetailedTrends: true,
    canToggleSensitiveData: true,  // ✅ Можна перемикати відображення
    canManageUsers: false,
    canManageJurisdictions: true,  // ✅ Доступ до законодавчих даних (DRPO)
    canViewAuditLogs: false,
    canSwitchBackend: false,
    isAdminExclusive: false,
  },

  // РІВЕНЬ 4: ADMIN (технічне управління)
  [UserRole.ADMIN]: {
    canSeeDashboards: false,      // 🔒 Жодних бізнес-даних
    canSeeVisualAnalytics: false,
    canSeeRelationsGraph: false,
    canSeeTimelines: false,
    canSeeOpenSearch: false,
    canSeeSensitiveData: false,
    canSeeSystemCore: true,       // ✅ Тільки інфраструктура
    canSeeInvestigation: false,
    canAccessFullNewspaper: false,
    canAccessDetailedTrends: false,
    canToggleSensitiveData: false,
    canManageUsers: true,
    canManageJurisdictions: false,
    canViewAuditLogs: true,
    canSwitchBackend: true,
    isAdminExclusive: true,       // ✅ Повна ізоляція від бізнес-даних
  },
};
