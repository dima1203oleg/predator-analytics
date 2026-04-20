export enum UserRole {
  CLIENT_BASIC  = 'client_basic',
  CLIENT_PREMIUM = 'client_premium',
  ADMIN         = 'admin',
  // Зворотньо-сумісні псевдоніми (підтримка legacy-компонентів)
  ANALYST    = 'client_premium',
  OPERATOR   = 'client_premium',
  COMMANDER  = 'admin',
  EXPLORER   = 'client_basic',
}

// Цивільні назви для UI (ніяких технічних термінів!)
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  [UserRole.CLIENT_BASIC]:   'Клієнтський доступ',
  [UserRole.CLIENT_PREMIUM]: 'Аналітичний контур',
  [UserRole.ADMIN]:          'Адміністрування системи',
};

// Описи контурів (показуються у Sidebar під іменем)
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [UserRole.CLIENT_BASIC]:   'Базовий огляд ринкових даних',
  [UserRole.CLIENT_PREMIUM]: 'Повний аналітичний та розслідувальний доступ',
  [UserRole.ADMIN]:          'Управління інфраструктурою та безпекою',
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
  [UserRole.CLIENT_BASIC]: {
    canSeeDashboards: false,
    canSeeVisualAnalytics: false,
    canSeeRelationsGraph: false,
    canSeeTimelines: false,
    canSeeOpenSearch: false,
    canSeeSensitiveData: false,
    canSeeSystemCore: false,
    canSeeInvestigation: false,
    canAccessFullNewspaper: false,
    canAccessDetailedTrends: false,
    canToggleSensitiveData: false,
    canManageUsers: false,
    canManageJurisdictions: false,
    canViewAuditLogs: false,
    canSwitchBackend: false,
    isAdminExclusive: false,
  },
  [UserRole.CLIENT_PREMIUM]: {
    canSeeDashboards: true,
    canSeeVisualAnalytics: true,
    canSeeRelationsGraph: true,
    canSeeTimelines: true,
    canSeeOpenSearch: true,
    canSeeSensitiveData: true,        // через перемикач
    canSeeSystemCore: false,           // ізольовано від системного ядра
    canSeeInvestigation: true,
    canAccessFullNewspaper: true,
    canAccessDetailedTrends: true,
    canToggleSensitiveData: true,
    canManageUsers: false,
    canManageJurisdictions: false,
    canViewAuditLogs: false,
    canSwitchBackend: false,
    isAdminExclusive: false,
  },
  [UserRole.ADMIN]: {
    canSeeDashboards: false,           // Адмін ізольований від бізнес-дашбордів
    canSeeVisualAnalytics: false,      // Тільки системна зона
    canSeeRelationsGraph: false,
    canSeeTimelines: false,
    canSeeOpenSearch: false,
    canSeeSensitiveData: true,
    canSeeSystemCore: true,
    canSeeInvestigation: false,
    canAccessFullNewspaper: false,
    canAccessDetailedTrends: false,
    canToggleSensitiveData: false,
    canManageUsers: true,
    canManageJurisdictions: true,
    canViewAuditLogs: true,
    canSwitchBackend: true,            // тільки адмін перемикає NVIDIA/Colab
    isAdminExclusive: true,            // Повна ізоляція — тільки System Command Center
  },
};
