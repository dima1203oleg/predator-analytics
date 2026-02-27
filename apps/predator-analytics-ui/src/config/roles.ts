export enum UserRole {
  CLIENT_BASIC = 'client_basic',
  CLIENT_PREMIUM = 'client_premium',
  ADMIN = 'admin',
  // Backward-compatible aliases (legacy component support)
  OPERATOR = 'client_premium',
  COMMANDER = 'admin',
  EXPLORER = 'client_basic',
}

// Цивільні назви для UI (ніяких технічних термінів!)
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  [UserRole.CLIENT_BASIC]: 'Клієнтський доступ',
  [UserRole.CLIENT_PREMIUM]: 'Преміум-аналітика',
  [UserRole.ADMIN]: 'Адміністрування системи',
};

// Короткі описи для підзаголовків
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [UserRole.CLIENT_BASIC]: 'Базовий режим перегляду інформації',
  [UserRole.CLIENT_PREMIUM]: 'Розширений аналітичний режим',
  [UserRole.ADMIN]: 'Внутрішній технічний режим',
};

export interface RoleCapabilities {
  // UI Sections
  canSeeDashboards: boolean;
  canSeeVisualAnalytics: boolean;
  canSeeRelationsGraph: boolean;
  canSeeTimelines: boolean;
  canSeeOpenSearch: boolean;
  canSeeSensitiveData: boolean;
  canSeeSystemCore: boolean;

  // Features
  canAccessFullNewspaper: boolean;
  canAccessDetailedTrends: boolean;
  canToggleSensitiveData: boolean;
  canManageUsers: boolean;
  canManageJurisdictions: boolean;
  canViewAuditLogs: boolean;
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
    canAccessFullNewspaper: false,
    canAccessDetailedTrends: false,
    canToggleSensitiveData: false,
    canManageUsers: false,
    canManageJurisdictions: false,
    canViewAuditLogs: false,
  },
  [UserRole.CLIENT_PREMIUM]: {
    canSeeDashboards: true,
    canSeeVisualAnalytics: true,
    canSeeRelationsGraph: true,
    canSeeTimelines: true,
    canSeeOpenSearch: true,
    canSeeSensitiveData: true, // via toggle
    canSeeSystemCore: false,
    canAccessFullNewspaper: true,
    canAccessDetailedTrends: true,
    canToggleSensitiveData: true,
    canManageUsers: false,
    canManageJurisdictions: false,
    canViewAuditLogs: false,
  },
  [UserRole.ADMIN]: {
    canSeeDashboards: false, // Not product dashboards
    canSeeVisualAnalytics: false,
    canSeeRelationsGraph: false,
    canSeeTimelines: false,
    canSeeOpenSearch: false,
    canSeeSensitiveData: false,
    canSeeSystemCore: true,
    canAccessFullNewspaper: false,
    canAccessDetailedTrends: false,
    canToggleSensitiveData: false,
    canManageUsers: true,
    canManageJurisdictions: true,
    canViewAuditLogs: true,
  },
};
