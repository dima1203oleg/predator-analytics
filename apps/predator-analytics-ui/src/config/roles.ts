/* eslint-disable @typescript-eslint/no-duplicate-enum-values */
export enum UserRole {
  CLIENT_BASIC  = 'client_basic',
  CLIENT_PREMIUM = 'client_premium',
  CLIENT_DRPO = 'client_drpo',
  ADMIN         = 'admin',
  ANALYST    = 'client_premium',
  OPERATOR   = 'client_basic',
  COMMANDER  = 'admin',
  EXPLORER   = 'client_basic',
  INVESTIGATOR = 'client_premium',
}

export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  [UserRole.CLIENT_BASIC]:   'Standard Client',
  [UserRole.CLIENT_PREMIUM]: 'VIP Client',
  [UserRole.CLIENT_DRPO]:    'VIP Client',
  [UserRole.ADMIN]:          'Tech Admin',
};

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  [UserRole.CLIENT_BASIC]:   'Базова та середня аналітика без конфіденційних даних',
  [UserRole.CLIENT_PREMIUM]: 'Повний клієнтський доступ до всіх аналітичних модулів',
  [UserRole.CLIENT_DRPO]:    'Повний клієнтський доступ до всіх аналітичних модулів',
  [UserRole.ADMIN]:          'Тільки технічна панель, інфраструктура та безпека',
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
    canSeeDashboards: true,
    canSeeVisualAnalytics: true,
    canSeeRelationsGraph: false,
    canSeeTimelines: false,
    canSeeOpenSearch: true,
    canSeeSensitiveData: false,
    canSeeSystemCore: false,
    canSeeInvestigation: false,
    canAccessFullNewspaper: false,
    canAccessDetailedTrends: true,
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
    canSeeSensitiveData: true,
    canSeeSystemCore: false,
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
  [UserRole.CLIENT_DRPO]: {
    canSeeDashboards: true,
    canSeeVisualAnalytics: true,
    canSeeRelationsGraph: true,
    canSeeTimelines: true,
    canSeeOpenSearch: true,
    canSeeSensitiveData: true,
    canSeeSystemCore: false,
    canSeeInvestigation: true,
    canAccessFullNewspaper: true,
    canAccessDetailedTrends: true,
    canToggleSensitiveData: true,
    canManageUsers: false,
    canManageJurisdictions: true,       // Доступ до законодавчих даних
    canViewAuditLogs: false,
    canSwitchBackend: false,
    isAdminExclusive: false,
  },
  [UserRole.ADMIN]: {
    canSeeDashboards: false,
    canSeeVisualAnalytics: false,
    canSeeRelationsGraph: false,
    canSeeTimelines: false,
    canSeeOpenSearch: false,
    canSeeSensitiveData: false,
    canSeeSystemCore: true,
    canSeeInvestigation: false,
    canAccessFullNewspaper: false,
    canAccessDetailedTrends: false,
    canToggleSensitiveData: false,
    canManageUsers: true,
    canManageJurisdictions: false,
    canViewAuditLogs: true,
    canSwitchBackend: true,
    isAdminExclusive: true,
  },
};
