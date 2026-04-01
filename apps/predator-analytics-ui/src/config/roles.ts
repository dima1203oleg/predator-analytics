export enum UserRole {
  VIEWER = 'viewer',
  SUPPLY_CHAIN = 'supply_chain',
  BUSINESS = 'business',
  ANALYST = 'analyst',
  ADMIN = 'admin',

  // Legacy aliases
  CLIENT_BASIC = 'client_basic',
  CLIENT_PREMIUM = 'client_premium',
  OPERATOR = 'operator',
  COMMANDER = 'commander',
  EXPLORER = 'explorer',
}

export type CanonicalUserRole =
  | UserRole.VIEWER
  | UserRole.SUPPLY_CHAIN
  | UserRole.BUSINESS
  | UserRole.ANALYST
  | UserRole.ADMIN;

const ROLE_ALIAS_MAP: Record<string, CanonicalUserRole> = {
  [UserRole.VIEWER]: UserRole.VIEWER,
  [UserRole.CLIENT_BASIC]: UserRole.VIEWER,
  [UserRole.EXPLORER]: UserRole.VIEWER,

  [UserRole.SUPPLY_CHAIN]: UserRole.SUPPLY_CHAIN,
  [UserRole.OPERATOR]: UserRole.SUPPLY_CHAIN,

  [UserRole.BUSINESS]: UserRole.BUSINESS,
  business_owner: UserRole.BUSINESS,
  owner: UserRole.BUSINESS,
  ceo: UserRole.BUSINESS,

  [UserRole.ANALYST]: UserRole.ANALYST,
  [UserRole.CLIENT_PREMIUM]: UserRole.ANALYST,

  [UserRole.ADMIN]: UserRole.ADMIN,
  [UserRole.COMMANDER]: UserRole.ADMIN,
};

export const normalizeUserRole = (role?: string | null): CanonicalUserRole => {
  if (!role) {
    return UserRole.VIEWER;
  }

  return ROLE_ALIAS_MAP[role.toLowerCase()] ?? UserRole.VIEWER;
};

export const ROLE_DISPLAY_NAMES: Record<CanonicalUserRole, string> = {
  [UserRole.VIEWER]: 'Перегляд',
  [UserRole.SUPPLY_CHAIN]: 'Закупівлі та логістика',
  [UserRole.BUSINESS]: 'Бізнес-керівник',
  [UserRole.ANALYST]: 'Аналітик',
  [UserRole.ADMIN]: 'Адміністратор',
};

export const ROLE_DESCRIPTIONS: Record<CanonicalUserRole, string> = {
  [UserRole.VIEWER]: 'Базовий доступ до оглядів, демо та перевірених результатів',
  [UserRole.SUPPLY_CHAIN]: 'Операційна роль для оптимізації закупівель, постачальників і логістики',
  [UserRole.BUSINESS]: 'Роль для керівників, що працюють з ROI, економією та стратегічними рішеннями',
  [UserRole.ANALYST]: 'Розширений аналітичний режим з розвідкою, ризиками та поясненнями AI',
  [UserRole.ADMIN]: 'Технічний і системний контур з повним керуванням платформою',
};

export interface RoleCapabilities {
  canSeeDashboards: boolean;
  canSeeVisualAnalytics: boolean;
  canSeeRelationsGraph: boolean;
  canSeeTimelines: boolean;
  canSeeOpenSearch: boolean;
  canSeeSensitiveData: boolean;
  canSeeSystemCore: boolean;
  canAccessExecutionTechView: boolean;
  canAccessBillingVerification: boolean;
  canRunOutcomeScenarios: boolean;
}

export const ROLE_CAPABILITIES: Record<CanonicalUserRole, RoleCapabilities> = {
  [UserRole.VIEWER]: {
    canSeeDashboards: true,
    canSeeVisualAnalytics: false,
    canSeeRelationsGraph: false,
    canSeeTimelines: false,
    canSeeOpenSearch: false,
    canSeeSensitiveData: false,
    canSeeSystemCore: false,
    canAccessExecutionTechView: false,
    canAccessBillingVerification: false,
    canRunOutcomeScenarios: false,
  },
  [UserRole.SUPPLY_CHAIN]: {
    canSeeDashboards: true,
    canSeeVisualAnalytics: true,
    canSeeRelationsGraph: false,
    canSeeTimelines: true,
    canSeeOpenSearch: false,
    canSeeSensitiveData: true,
    canSeeSystemCore: false,
    canAccessExecutionTechView: false,
    canAccessBillingVerification: false,
    canRunOutcomeScenarios: true,
  },
  [UserRole.BUSINESS]: {
    canSeeDashboards: true,
    canSeeVisualAnalytics: true,
    canSeeRelationsGraph: false,
    canSeeTimelines: false,
    canSeeOpenSearch: false,
    canSeeSensitiveData: true,
    canSeeSystemCore: false,
    canAccessExecutionTechView: false,
    canAccessBillingVerification: true,
    canRunOutcomeScenarios: true,
  },
  [UserRole.ANALYST]: {
    canSeeDashboards: true,
    canSeeVisualAnalytics: true,
    canSeeRelationsGraph: true,
    canSeeTimelines: true,
    canSeeOpenSearch: true,
    canSeeSensitiveData: true,
    canSeeSystemCore: false,
    canAccessExecutionTechView: true,
    canAccessBillingVerification: true,
    canRunOutcomeScenarios: true,
  },
  [UserRole.ADMIN]: {
    canSeeDashboards: true,
    canSeeVisualAnalytics: true,
    canSeeRelationsGraph: true,
    canSeeTimelines: true,
    canSeeOpenSearch: true,
    canSeeSensitiveData: true,
    canSeeSystemCore: true,
    canAccessExecutionTechView: true,
    canAccessBillingVerification: true,
    canRunOutcomeScenarios: true,
  },
};

export const getRoleDisplayName = (role?: string | null): string =>
  ROLE_DISPLAY_NAMES[normalizeUserRole(role)];

export const getRoleDescription = (role?: string | null): string =>
  ROLE_DESCRIPTIONS[normalizeUserRole(role)];

export const getRoleCapabilities = (role?: string | null): RoleCapabilities =>
  ROLE_CAPABILITIES[normalizeUserRole(role)];
