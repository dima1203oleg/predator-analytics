/* eslint-disable @typescript-eslint/no-duplicate-enum-values */

/**
 * PREDATOR ELITE — Ієрархія клієнтських допусків v2.0
 *
 * 4 рівні доступу:
 *   TERMINAL  — базовий макроекономічний огляд з маскуванням
 *   PRO       — повна OSINT-розвідка з точними реєстрами
 *   SOVEREIGN — абсолютна влада: деанонімізація, сирі дані
 *   CORE      — технічне ядро (невидиме для клієнтів)
 */
export enum UserRole {
  // Канонічні ролі PREDATOR ELITE
  TERMINAL = 'terminal',       // Рівень 1: PREDATOR Terminal (базова станція)
  PRO = 'pro',                 // Рівень 2: PREDATOR Pro (професійна розвідка)
  SOVEREIGN = 'sovereign',     // Рівень 3: PREDATOR Sovereign (елітний доступ)
  CORE = 'core',               // Рівень 4: PREDATOR Core (технічне ядро)

  // Легасі-аліаси для зворотної сумісності
  PROMO = 'terminal',
  CLIENT_BASIC = 'terminal',
  CLIENT_PREMIUM = 'pro',
  CLIENT_DRPO = 'sovereign',
  VIP = 'sovereign',
  ADMIN = 'core',
  COMMANDER = 'core',
  ANALYST = 'pro',
  OPERATOR = 'terminal',
  EXPLORER = 'terminal',
  INVESTIGATOR = 'sovereign',
}

// ─── Legacy Role Resolution ─────────────────────────────────────────────────
/** Мапа всіх відомих legacy ролей до канонічних PREDATOR ELITE */
export const LEGACY_ROLE_MAP: Record<string, UserRole> = {
  // Core (Tech Admin)
  admin: UserRole.CORE,
  commander: UserRole.CORE,
  core: UserRole.CORE,
  tech_admin: UserRole.CORE,

  // Sovereign (VIP / Elite)
  vip: UserRole.SOVEREIGN,
  sovereign: UserRole.SOVEREIGN,
  client_drpo: UserRole.SOVEREIGN,
  investigator: UserRole.SOVEREIGN,
  drpo: UserRole.SOVEREIGN,
  vip_client: UserRole.SOVEREIGN,

  // Pro (Premium / Analyst)
  pro: UserRole.PRO,
  analyst: UserRole.PRO,
  client_premium: UserRole.PRO,
  supply_chain: UserRole.PRO,
  supply: UserRole.PRO,
  'supply-chain': UserRole.PRO,
  logistician: UserRole.PRO,
  logistics: UserRole.PRO,

  // Terminal (Basic / Entry)
  terminal: UserRole.TERMINAL,
  client_basic: UserRole.TERMINAL,
  operator: UserRole.TERMINAL,
  explorer: UserRole.TERMINAL,
  viewer: UserRole.TERMINAL,
  ceo: UserRole.TERMINAL,
  owner: UserRole.TERMINAL,
  promo: UserRole.TERMINAL,
  standard_client: UserRole.TERMINAL,
};

/** Перетворює будь-яку legacy роль у канонічну PREDATOR ELITE роль */
export const resolveUserRole = (rawRole?: string): UserRole => {
  if (!rawRole) return UserRole.TERMINAL;
  const normalized = rawRole.toLowerCase().trim();
  return LEGACY_ROLE_MAP[normalized] ?? UserRole.TERMINAL;
};

export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  [UserRole.TERMINAL]: 'PREDATOR Terminal',
  [UserRole.PRO]: 'PREDATOR Pro',
  [UserRole.SOVEREIGN]: 'PREDATOR Sovereign',
  [UserRole.CORE]: 'PREDATOR Core',
};

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  [UserRole.TERMINAL]: 'Базова станція: макроекономічний огляд ринку та перевірка контрагентів з маскуванням даних',
  [UserRole.PRO]: 'Професійна розвідка: повний аналітичний інструментарій з точними реєстрами',
  [UserRole.SOVEREIGN]: 'Елітний допуск: безлімітний доступ включаючи деанонімізацію та сирі дані',
  [UserRole.CORE]: 'Технічне ядро: управління інфраструктурою та ШІ-моделями (невидиме для клієнтів)',
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
  canSeeCyberIntel: boolean;

  // Функціональність
  canAccessFullNewspaper: boolean;
  canAccessDetailedTrends: boolean;
  canToggleSensitiveData: boolean;
  canManageUsers: boolean;
  canManageJurisdictions: boolean;
  canViewAuditLogs: boolean;
  canSwitchBackend: boolean;
  canDeAnonymize: boolean;
  canAccessRawData: boolean;

  // Маскування даних
  graphDepthLimit: number;
  financialPrecision: 'range' | 'exact' | 'transactional';
  identifierMasking: 'partial' | 'full' | 'international';
  personalDataAccess: 'masked' | 'full' | 'deanonymized';

  // Ізоляція
  isAdminExclusive: boolean;
  isClientFacing: boolean;
}

export const ROLE_CAPABILITIES: Record<UserRole, RoleCapabilities> = {
  // РІВЕНЬ 1: PREDATOR Terminal (базова станція)
  [UserRole.TERMINAL]: {
    canSeeDashboards: true,
    canSeeVisualAnalytics: true,
    canSeeRelationsGraph: false,      // 🔒 Граф — 1 рівень глибини
    canSeeTimelines: false,           // 🔒 Тільки в Pro/Sovereign
    canSeeOpenSearch: true,
    canSeeSensitiveData: false,       // 🔒 Суворе маскування
    canSeeSystemCore: false,
    canSeeInvestigation: false,       // 🔒 Тільки в Pro/Sovereign
    canSeeCyberIntel: false,          // 🔒 Тільки Sovereign
    canAccessFullNewspaper: false,    // 🔒 Обмежений контент
    canAccessDetailedTrends: true,
    canToggleSensitiveData: false,
    canManageUsers: false,
    canManageJurisdictions: false,
    canViewAuditLogs: false,
    canSwitchBackend: false,
    canDeAnonymize: false,
    canAccessRawData: false,
    graphDepthLimit: 1,
    financialPrecision: 'range',
    identifierMasking: 'partial',
    personalDataAccess: 'masked',
    isAdminExclusive: false,
    isClientFacing: true,
  },

  // РІВЕНЬ 2: PREDATOR Pro (професійна розвідка)
  [UserRole.PRO]: {
    canSeeDashboards: true,
    canSeeVisualAnalytics: true,
    canSeeRelationsGraph: true,       // ✅ Граф до 5 рівнів
    canSeeTimelines: true,
    canSeeOpenSearch: true,
    canSeeSensitiveData: false,       // 🔒 Маскування на рівні API
    canSeeSystemCore: false,
    canSeeInvestigation: true,
    canSeeCyberIntel: false,          // 🔒 Тільки Sovereign
    canAccessFullNewspaper: true,
    canAccessDetailedTrends: true,
    canToggleSensitiveData: false,
    canManageUsers: false,
    canManageJurisdictions: false,
    canViewAuditLogs: false,
    canSwitchBackend: false,
    canDeAnonymize: false,
    canAccessRawData: false,
    graphDepthLimit: 5,
    financialPrecision: 'exact',
    identifierMasking: 'full',
    personalDataAccess: 'full',
    isAdminExclusive: false,
    isClientFacing: true,
  },

  // РІВЕНЬ 3: PREDATOR Sovereign (елітний допуск)
  [UserRole.SOVEREIGN]: {
    canSeeDashboards: true,
    canSeeVisualAnalytics: true,
    canSeeRelationsGraph: true,       // ✅ Безлімітна глибина
    canSeeTimelines: true,
    canSeeOpenSearch: true,
    canSeeSensitiveData: true,        // ✅ Повний доступ до чутливих даних
    canSeeSystemCore: false,
    canSeeInvestigation: true,
    canSeeCyberIntel: true,           // ✅ Суверенна кіберрозвідка
    canAccessFullNewspaper: true,
    canAccessDetailedTrends: true,
    canToggleSensitiveData: true,
    canManageUsers: false,
    canManageJurisdictions: true,
    canViewAuditLogs: false,
    canSwitchBackend: false,
    canDeAnonymize: true,             // ✅ Деанонімізація
    canAccessRawData: true,           // ✅ Сирі дані
    graphDepthLimit: Infinity,
    financialPrecision: 'transactional',
    identifierMasking: 'international',
    personalDataAccess: 'deanonymized',
    isAdminExclusive: false,
    isClientFacing: true,
  },

  // РІВЕНЬ 4: PREDATOR Core (технічне ядро — невидиме для клієнтів)
  [UserRole.CORE]: {
    canSeeDashboards: false,          // 🔒 Жодних бізнес-даних
    canSeeVisualAnalytics: false,
    canSeeRelationsGraph: false,
    canSeeTimelines: false,
    canSeeOpenSearch: false,
    canSeeSensitiveData: false,
    canSeeSystemCore: true,           // ✅ Тільки інфраструктура
    canSeeInvestigation: false,
    canSeeCyberIntel: false,
    canAccessFullNewspaper: false,
    canAccessDetailedTrends: false,
    canToggleSensitiveData: false,
    canManageUsers: true,
    canManageJurisdictions: false,
    canViewAuditLogs: true,
    canSwitchBackend: true,
    canDeAnonymize: false,
    canAccessRawData: false,
    graphDepthLimit: 0,
    financialPrecision: 'range',
    identifierMasking: 'partial',
    personalDataAccess: 'masked',
    isAdminExclusive: true,
    isClientFacing: false,
  },
};
