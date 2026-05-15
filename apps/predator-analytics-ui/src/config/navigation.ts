import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  Box,
  BrainCircuit,
  Briefcase,
  Compass,
  Database,
  Eye,
  Factory,
  FileText,
  Fingerprint,
  FlaskConical,
  Globe,
  History,
  Landmark,
  LayoutDashboard,
  Layers,
  Lock,
  Network,
  Newspaper,
  Radar,
  Radio,
  Scale,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  ShieldX,
  Ship,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Upload,
  User,
  Users,
  Zap,
  Cloud,
  Cpu,
  type LucideIcon,
} from 'lucide-react';

// ─── Типи ─────────────────────────────────────────────────────────────────────

export type NavAccent =
  | 'gold'
  | 'amber'
  | 'warn'
  | 'slate'
  | 'blue'
  | 'indigo'
  | 'rose'
  | 'sky'
  | 'emerald'
  | 'cyan'
  | 'violet';

export type NavigationAudience = 'terminal' | 'pro' | 'sovereign' | 'core';
export type NavWorkspaceMode = 'all' | 'favorites' | 'recent' | 'recommended';

// Рівні доступу для позначок статусів (🟢🟡🔴)
export type AccessLevel = 'terminal' | 'pro' | 'sovereign';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  description: string;
  badge?: string;
  group?: string;
  roles?: string[];
  audiences?: NavigationAudience[];
  priority?: number;
  matchPaths?: string[];
  accessLevel?: AccessLevel; // Рівень доступу для позначки статусу (🟢🟡🔴)
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
  roles?: string[];
  audiences?: NavigationAudience[];
}

export interface NavSection {
  id: string;
  label: string;
  description: string;
  outcome: string;
  accent: NavAccent;
  groups?: NavGroup[];
  items?: NavItem[];
  collapsed?: boolean;
}

export interface NavigationContext {
  item: NavItem | null;
  section: NavSection | null;
}

export interface VisibleNavItem extends NavItem {
  accent: NavAccent;
  sectionId: string;
  sectionLabel: string;
  sectionDescription: string;
  sectionOutcome: string;
}

export interface NavGlobalAction {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  kind: 'focus-search' | 'mode' | 'link' | 'colab';
  mode?: NavWorkspaceMode;
  path?: string;
}

// ─── Стилі акцентів ──────────────────────────────────────────────────────────

export const navAccentStyles: Record<
  NavAccent,
  {
    badge: string;
    dot: string;
    glow: string;
    icon: string;
    iconBorder: string;
    sectionBorder: string;
    softText: string;
  }
> = {
  gold: {
    badge: 'bg-amber-500/15 text-amber-500 border-amber-400/20',
    dot: 'bg-amber-500',
    glow: 'from-amber-600/20 via-amber-500/5 to-transparent',
    icon: 'text-amber-500',
    iconBorder: 'border-amber-400/25 bg-amber-500/10',
    sectionBorder: 'border-amber-400/15',
    softText: 'text-amber-400/90',
  },
  amber: {
    badge: 'bg-orange-600/15 text-orange-400 border-orange-500/20',
    dot: 'bg-orange-600',
    glow: 'from-orange-700/20 via-orange-600/5 to-transparent',
    icon: 'text-orange-400',
    iconBorder: 'border-orange-500/25 bg-orange-600/10',
    sectionBorder: 'border-orange-500/15',
    softText: 'text-orange-400/90',
  },
  warn: {
    badge: 'bg-orange-500/15 text-orange-400 border-orange-400/20',
    dot: 'bg-orange-500',
    glow: 'from-orange-600/20 via-orange-500/5 to-transparent',
    icon: 'text-orange-400',
    iconBorder: 'border-orange-400/25 bg-orange-500/10',
    sectionBorder: 'border-orange-400/15',
    softText: 'text-orange-400/90',
  },
  slate: {
    badge: 'bg-slate-500/15 text-slate-400 border-slate-400/20',
    dot: 'bg-slate-500',
    glow: 'from-slate-600/20 via-slate-500/5 to-transparent',
    icon: 'text-slate-400',
    iconBorder: 'border-slate-400/25 bg-slate-500/10',
    sectionBorder: 'border-slate-400/15',
    softText: 'text-slate-400/90',
  },
  blue: {
    badge: 'bg-blue-400/15 text-blue-300 border-blue-300/20',
    dot: 'bg-blue-400',
    glow: 'from-blue-500/20 via-blue-400/5 to-transparent',
    icon: 'text-blue-300',
    iconBorder: 'border-blue-300/25 bg-blue-400/10',
    sectionBorder: 'border-blue-300/15',
    softText: 'text-blue-300/90',
  },
  indigo: {
    badge: 'bg-indigo-500/15 text-indigo-400 border-indigo-400/20',
    dot: 'bg-indigo-500',
    glow: 'from-indigo-600/20 via-indigo-500/5 to-transparent',
    icon: 'text-indigo-400',
    iconBorder: 'border-indigo-400/25 bg-indigo-500/10',
    sectionBorder: 'border-indigo-400/15',
    softText: 'text-indigo-400/90',
  },
  rose: {
    badge: 'bg-rose-500/15 text-rose-400 border-rose-400/20',
    dot: 'bg-rose-500',
    glow: 'from-rose-600/20 via-rose-500/5 to-transparent',
    icon: 'text-rose-400',
    iconBorder: 'border-rose-400/25 bg-rose-500/10',
    sectionBorder: 'border-rose-400/15',
    softText: 'text-rose-400/90',
  },
  sky: {
    badge: 'bg-sky-500/15 text-sky-400 border-sky-400/20',
    dot: 'bg-sky-500',
    glow: 'from-sky-600/20 via-sky-500/5 to-transparent',
    icon: 'text-sky-400',
    iconBorder: 'border-sky-400/25 bg-sky-500/10',
    sectionBorder: 'border-sky-400/15',
    softText: 'text-sky-400/90',
  },
  emerald: {
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-400/20',
    dot: 'bg-emerald-500',
    glow: 'from-emerald-600/20 via-emerald-500/5 to-transparent',
    icon: 'text-emerald-400',
    iconBorder: 'border-emerald-400/25 bg-emerald-500/10',
    sectionBorder: 'border-emerald-400/15',
    softText: 'text-emerald-400/90',
  },
  cyan: {
    badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-400/20',
    dot: 'bg-cyan-500',
    glow: 'from-cyan-600/20 via-cyan-500/5 to-transparent',
    icon: 'text-cyan-400',
    iconBorder: 'border-cyan-400/25 bg-cyan-500/10',
    sectionBorder: 'border-cyan-400/15',
    softText: 'text-cyan-400/90',
  },
  violet: {
    badge: 'bg-violet-500/15 text-violet-400 border-violet-400/20',
    dot: 'bg-violet-500',
    glow: 'from-violet-600/20 via-violet-500/5 to-transparent',
    icon: 'text-violet-400',
    iconBorder: 'border-violet-400/25 bg-violet-500/10',
    sectionBorder: 'border-violet-400/15',
    softText: 'text-violet-400/90',
  },
};

// ─── Відповідність ролей до допусків PREDATOR ELITE ──────────────────────────

const navigationAudienceAliases: Record<string, NavigationAudience> = {
  // Канонічні ролі PREDATOR ELITE
  terminal: 'terminal',
  pro: 'pro',
  sovereign: 'sovereign',
  core: 'core',

  // Легасі-аліаси для зворотної сумісності
  promo: 'terminal',
  client_basic: 'terminal',
  operator: 'terminal',
  explorer: 'terminal',
  viewer: 'terminal',
  ceo: 'terminal',
  owner: 'terminal',

  analyst: 'pro',
  client_premium: 'pro',
  supply_chain: 'pro',
  supply: 'pro',
  'supply-chain': 'pro',
  logistician: 'pro',
  logistics: 'pro',

  vip: 'sovereign',
  client_drpo: 'sovereign',
  investigator: 'sovereign',
  drpo: 'sovereign',

  admin: 'core',
  commander: 'core',
};

export const resolveNavigationAudience = (role: string): NavigationAudience =>
  navigationAudienceAliases[role?.toLowerCase?.() ?? ''] ?? 'terminal';

// ─── Позначки статусів доступу (🟢🟡🔴) ────────────────────────────────────────

/**
 * Отримує позначку статусу для модуля на основі рівня доступу та ролі користувача
 * 🟢 - відкрито в Terminal (і вище)
 * 🟡 - відкрито в Pro (і више); для Terminal - пейвол
 * 🔴 - відкрито тільки в Sovereign; для Terminal та Pro - елітний замок
 */
export const getAccessStatusIndicator = (
  itemAccessLevel: AccessLevel | undefined,
  userRole: string
): { indicator: string; isLocked: boolean; upgradeLevel: AccessLevel | null } => {
  const audience = resolveNavigationAudience(userRole);

  // Якщо рівень доступу не вказано - вважаємо, що відкрито для всіх
  if (!itemAccessLevel) {
    return { indicator: '🟢', isLocked: false, upgradeLevel: null };
  }

  // Пріоритет рівнів: terminal < pro < sovereign
  const levelPriority: Record<AccessLevel, number> = {
    terminal: 1,
    pro: 2,
    sovereign: 3,
  };

  const audiencePriority: Record<NavigationAudience, number> = {
    terminal: 1,
    pro: 2,
    sovereign: 3,
    core: 0, // Core - технічний рівень, не порівнюється
  };

  const itemLevel = levelPriority[itemAccessLevel];
  const userLevel = audiencePriority[audience];

  // Користувач має достатній рівень доступу
  if (userLevel >= itemLevel) {
    return { indicator: '🟢', isLocked: false, upgradeLevel: null };
  }

  // Користувач не має достатнього рівня доступу
  if (itemAccessLevel === 'pro') {
    return { indicator: '🟡', isLocked: true, upgradeLevel: 'pro' };
  }

  if (itemAccessLevel === 'sovereign') {
    return { indicator: '🔴', isLocked: true, upgradeLevel: 'sovereign' };
  }

  return { indicator: '🟢', isLocked: false, upgradeLevel: null };
};

// ─── Глобальні дії (гарячі клавіші, режими) ──────────────────────────────────

export const globalNavigationActions: NavGlobalAction[] = [
  {
    id: 'search',
    label: 'Пошук',
    description: 'Cmd/Ctrl + K',
    icon: Search,
    kind: 'focus-search',
  },
  {
    id: 'favorites',
    label: 'Обране',
    description: 'Закріплені маршрути',
    icon: Star,
    kind: 'mode',
    mode: 'favorites',
  },
  {
    id: 'recent',
    label: 'Нещодавнє',
    description: 'Останні переходи',
    icon: History,
    kind: 'mode',
    mode: 'recent',
  },
  {
    id: 'recommended',
    label: 'ШІ-рекомендації',
    description: 'Найкращий наступний крок',
    icon: Sparkles,
    kind: 'mode',
    mode: 'recommended',
  },
  {
    id: 'assistant',
    label: 'ШІ-асистент',
    description: 'Агенти та підказки',
    icon: Bot,
    kind: 'link',
    path: '/agents',
  },
  {
    id: 'colab',
    label: 'Colab Mirror',
    description: 'Управління хмарним дзеркалом',
    icon: Cloud,
    kind: 'colab',
  },
];

// ─── Навігаційна конфігурація v60.5-ELITE ────────────────────────────────────
/**
 * 6 логічних зон платформи. Сегментація:
 *   CLIENT  (client_basic)   → EXECUTIVE (базово) + AI Oracle
 *   ANALYST (client_premium) → всі зони крім SYSTEM
 *   ADMIN   (admin)          → все включно з SYSTEM + Control Panel
 */
const baseNavigationConfig: NavSection[] = [
  // ══════════════════════════════════════════════════════════════
  // 1. 🌐 CONTROL (sky)
  // ══════════════════════════════════════════════════════════════
  {
    id: 'global-control',
    label: '🌐 CONTROL',
    description: 'Верхньорівневий моніторинг активів та ситуаційна обізнаність.',
    outcome: 'Стратегічне домінування.',
    accent: 'sky',
    groups: [
      {
        title: 'Command Center',
        audiences: ['terminal', 'pro', 'sovereign'],
        items: [
          {
            id: 'dashboard',
            label: 'Executive Board',
            path: '/command?tab=board',
            icon: LayoutDashboard,
            description: 'ROI-пульс, KPI та ключові метрики бізнес-периметра.',
            audiences: ['terminal', 'pro', 'sovereign'],
            priority: 100,
            accessLevel: 'terminal', // 🟢
          },
          {
            id: 'war-room',
            label: 'Crisis Room',
            path: '/command?tab=warroom',
            icon: Target,
            description: 'Оперативний штаб для кризового управління та ескалацій.',
            badge: 'LIVE',
            audiences: ['pro', 'sovereign'],
            priority: 98,
            accessLevel: 'pro', // 🟡
          },
          {
            id: 'portfolio-risk',
            label: 'Strategic Alerts',
            path: '/command?tab=risk',
            icon: TrendingUp,
            description: 'Агрегований фінансовий та репутаційний ризик портфеля.',
            audiences: ['terminal', 'pro', 'sovereign'],
            priority: 99,
            accessLevel: 'terminal', // 🟢
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // 2. 📊 EXECUTIVE (gold)
  // ══════════════════════════════════════════════════════════════
  {
    id: 'executive-sector',
    label: '📊 EXECUTIVE',
    description: 'Аналітичні зведення та стратегічне планування.',
    outcome: 'Інформаційна перевага.',
    accent: 'gold',
    groups: [
      {
        title: 'Strategic Planning',
        audiences: ['terminal', 'pro', 'sovereign'],
        items: [
          {
            id: 'scenario-modeling',
            label: 'Scenario Simulation',
            path: '/modeling?tab=simulation',
            icon: Layers,
            description: 'What-if симуляція на базі онтології та Causal AI.',
            badge: 'ELITE',
            audiences: ['pro', 'sovereign'],
            priority: 100,
            accessLevel: 'pro', // 🟡
          },
          {
            id: 'morning-brief',
            label: 'Strategic Briefing',
            path: '/command?tab=brief',
            icon: Compass,
            description: 'Пріоритетний аналіз ризиків на поточний операційний день.',
            audiences: ['terminal', 'pro', 'sovereign'],
            priority: 92,
            accessLevel: 'terminal', // 🟢
          },
          {
            id: 'newspaper',
            label: 'Intelligence Feed',
            path: '/search?tab=newspaper',
            icon: Newspaper,
            description: 'Персоналізована щоденна аналітика ринку та конкурентів.',
            audiences: ['terminal', 'pro', 'sovereign'],
            priority: 84,
            accessLevel: 'terminal', // 🟢
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // 3. 🔍 INTELLIGENCE (amber)
  // ══════════════════════════════════════════════════════════════
  {
    id: 'intel-sector',
    label: '🔍 INTELLIGENCE',
    description: 'Пошук, ідентифікація та аналіз ринкових гравців.',
    outcome: 'Ринкова прозорість.',
    accent: 'amber',
    groups: [
      {
        title: 'Core Intelligence',
        audiences: ['terminal', 'pro', 'sovereign'],
        items: [
          {
            id: 'search',
            label: 'Entity Search',
            path: '/search?tab=global',
            icon: Search,
            description: 'Глобальний пошук по реєстрах та базах даних.',
            audiences: ['terminal', 'pro', 'sovereign'],
            priority: 86,
            accessLevel: 'terminal', // 🟢
          },
          {
            id: 'graph',
            label: 'Graph Analysis',
            path: '/osint?tab=graph',
            icon: Network,
            description: 'Аналіз графа зв\'язків та аномальних кластерів.',
            audiences: ['pro', 'sovereign'],
            priority: 95,
            accessLevel: 'pro', // 🟡
          },
          {
            id: 'offshore-detector',
            label: 'Offshore Detection',
            path: '/financial?tab=offshore',
            icon: Globe,
            description: 'Виявлення підставних компаній та офшорних активів.',
            audiences: ['pro', 'sovereign'],
            priority: 88,
            accessLevel: 'pro', // 🟡
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // 4. 🚢 SUPPLY (blue)
  // ══════════════════════════════════════════════════════════════
  {
    id: 'supply-sector',
    label: '🚢 SUPPLY',
    description: 'Моніторинг вантажних потоків та митної активності.',
    outcome: 'Логістична стійкість.',
    accent: 'blue',
    groups: [
      {
        title: 'Maritime & Trade',
        audiences: ['terminal', 'pro', 'sovereign'],
        items: [
          {
            id: 'customs-intel',
            label: 'Customs Intelligence',
            path: '/market?tab=customs',
            icon: Shield,
            description: 'Аналіз декларацій та ризикових операцій.',
            audiences: ['pro', 'sovereign'],
            priority: 88,
            accessLevel: 'pro', // 🟡
          },
          {
            id: 'supply-chain',
            label: 'Logistics Control',
            path: '/supply-chain',
            icon: Layers,
            description: 'Візуалізація та аналіз вразливостей поставок.',
            audiences: ['pro', 'sovereign'],
            priority: 76,
            accessLevel: 'pro', // 🟡
          },
          {
            id: 'tenders',
            label: 'Trade Pressure',
            path: '/tenders',
            icon: FileText,
            description: 'Моніторинг державних закупівель та тендерного тиску.',
            audiences: ['terminal', 'pro', 'sovereign'],
            priority: 72,
            accessLevel: 'terminal', // 🟢
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // 5. ⚖️ COMPLIANCE (rose)
  // ══════════════════════════════════════════════════════════════
  {
    id: 'compliance-sector',
    label: '⚖️ COMPLIANCE',
    description: 'Due Diligence, KYC та перевірка бенефіціарів.',
    outcome: 'Правова безпека.',
    accent: 'rose',
    groups: [
      {
        title: 'Legal Monitoring',
        audiences: ['terminal', 'pro', 'sovereign'],
        items: [
          {
            id: 'osint-diligence',
            label: 'KYC/KYB Audit',
            path: '/osint?tab=diligence',
            icon: User,
            description: 'Повний аудит будь-якого суб\'єкта.',
            audiences: ['terminal', 'pro', 'sovereign'],
            priority: 91,
            accessLevel: 'terminal', // 🟢
          },
          {
            id: 'ubo-map',
            label: 'Beneficiary Map',
            path: '/osint?tab=ubo',
            icon: Network,
            description: 'Структури власності та приховані зв\'язків.',
            badge: 'ELITE',
            audiences: ['pro', 'sovereign'],
            priority: 97,
            accessLevel: 'pro', // 🟡
          },
          {
            id: 'sanctions',
            label: 'Sanctions & PEP',
            path: '/osint?tab=sanctions',
            icon: ShieldX,
            description: 'Скринінг на санкційні списки та політичні зв\'язки.',
            audiences: ['terminal', 'pro', 'sovereign'],
            priority: 94,
            accessLevel: 'terminal', // 🟢
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // 6. 🛡 CYBER (violet)
  // ══════════════════════════════════════════════════════════════
  {
    id: 'cyber-sector',
    label: '🛡 CYBER',
    description: 'AML-моніторинг та аналіз геополітичних загроз.',
    outcome: 'Системна захищеність.',
    accent: 'violet',
    groups: [
      {
        title: 'Attack Surface',
        audiences: ['terminal', 'pro', 'sovereign'],
        items: [
          {
            id: 'aml-radar',
            label: 'AML Intelligence',
            path: '/financial?tab=aml',
            icon: ShieldCheck,
            description: 'Виявлення схем відмивання коштів.',
            audiences: ['pro', 'sovereign'],
            priority: 92,
            accessLevel: 'pro', // 🟡
          },
          {
            id: 'swift-monitor',
            label: 'SWIFT Monitor',
            path: '/financial?tab=swift',
            icon: Activity,
            description: 'Аналіз транскордонних транзакцій у реальному часі.',
            badge: 'ELITE',
            audiences: ['sovereign'],
            priority: 90,
            accessLevel: 'sovereign', // 🔴
          },
          {
            id: 'geopolitical-radar',
            label: 'Geopolitical Threat',
            path: '/geopolitical-radar',
            icon: Radar,
            description: 'Вплив глобальних подій на бізнес-стабільність.',
            badge: 'CORE',
            audiences: ['sovereign'],
            priority: 85,
            accessLevel: 'sovereign', // 🔴
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // 7. 🧠 AI CORE (cyan)
  // ══════════════════════════════════════════════════════════════
  {
    id: 'ai-core-sector',
    label: '🧠 AI CORE',
    description: 'Генеративна аналітика та предиктивне моделювання.',
    outcome: 'Когнітивна перевага.',
    accent: 'cyan',
    groups: [
      {
        title: 'Sovereign Agents',
        audiences: ['terminal', 'pro', 'sovereign'],
        items: [
          {
            id: 'oracle',
            label: 'Sovereign Oracle',
            path: '/nexus?tab=oracle',
            icon: Sparkles,
            description: 'Генеративний синтез від архітектурних LLM моделей.',
            audiences: ['pro', 'sovereign'],
            priority: 100,
            accessLevel: 'pro', // 🟡
          },
          {
            id: 'nexus',
            label: 'Predictive Nexus',
            path: '/nexus',
            icon: BrainCircuit,
            description: 'Центр прогнозного моделювання та сценаріїв.',
            badge: 'ELITE',
            audiences: ['sovereign'],
            priority: 95,
            accessLevel: 'sovereign', // 🔴
          },
          {
            id: 'ai-insights',
            label: 'AI Insights Hub',
            path: '/nexus?tab=insights',
            icon: Zap,
            description: 'Кросмодальні сигнали та стратегічні висновки.',
            audiences: ['terminal', 'pro', 'sovereign'],
            priority: 86,
            accessLevel: 'terminal', // 🟢
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // 8. 🕵 INVESTIGATION (slate)
  // ══════════════════════════════════════════════════════════════
  {
    id: 'investigation-sector',
    label: '🕵 INVESTIGATION',
    description: 'Управління кейсами та хронологія розслідувань.',
    outcome: 'Доказова база.',
    accent: 'slate',
    groups: [
      {
        title: 'Case Management',
        audiences: ['terminal', 'pro', 'sovereign'],
        items: [
          {
            id: 'cases',
            label: 'Lobby Mapping',
            path: '/cases',
            icon: Briefcase,
            description: 'Структуроване управління слідчими кейсами та зв\'язками.',
            audiences: ['pro', 'sovereign'],
            priority: 95,
            accessLevel: 'pro', // 🟡
          },
          {
            id: 'timeline',
            label: 'Event Timeline',
            path: '/timeline',
            icon: History,
            description: 'Тимчасова шкала подій та зв\'язок з документами.',
            badge: 'NEW',
            audiences: ['pro', 'sovereign'],
            priority: 90,
            accessLevel: 'pro', // 🟡
          },
          {
            id: 'audit-log',
            label: 'WORM Audit Log',
            path: '/compliance',
            icon: Scale,
            description: 'WORM-журнал усіх операцій у системі.',
            audiences: ['pro', 'sovereign'],
            priority: 82,
            accessLevel: 'pro', // 🟡
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // SYSTEM & CORE (Тільки для Core/Admin)
  // ══════════════════════════════════════════════════════════════
  {
    id: 'system-core',
    label: 'PREDATOR CORE',
    description: 'Технічний контроль інфраструктури та вузлів.',
    outcome: 'Операційна стабільність.',
    accent: 'rose',
    groups: [
      {
        title: 'Інфраструктурний Хаб',
        audiences: ['core'],
        items: [
          {
            id: 'admin-monitoring',
            label: 'Телеметрія Кластера',
            path: '/admin/command?tab=infra',
            icon: Activity,
            description: 'Статус серверів, БД та черг повідомлень.',
            group: 'Інфраструктурний Хаб',
            badge: 'LIVE',
            audiences: ['core'],
            priority: 100,
          },
          {
            id: 'admin-deployment',
            label: 'GitOps & Артефакти',
            path: '/admin/command?tab=gitops',
            icon: Box,
            description: 'Управління версіями та розгортанням сервісів.',
            group: 'Інфраструктурний Хаб',
            audiences: ['core'],
            priority: 80,
          },
        ],
      },
      {
        title: 'Контроль ШІ',
        audiences: ['core'],
        items: [
          {
            id: 'admin-ai-engines',
            label: 'Двигуни ШІ (Ollama)',
            path: '/admin/command?tab=ai-engines',
            icon: Cpu,
            description: 'Керування локальними та хмарними моделями.',
            group: 'Контроль ШІ',
            badge: 'CORE',
            audiences: ['core'],
            priority: 95,
          },
        ],
      },
      {
        title: 'Архітектура Нульової Довіри',
        audiences: ['core'],
        items: [
          {
            id: 'admin-security',
            label: 'Zero Trust Консоль',
            path: '/admin/command?tab=security',
            icon: Lock,
            description: 'IAM, аудит сесій, API-ключі, логи доступу.',
            group: 'Архітектура Нульової Довіри',
            audiences: ['core'],
            priority: 90,
          },
          {
            id: 'admin-settings',
            label: 'Глобальні Налаштування',
            path: '/admin/command?tab=settings',
            icon: Settings,
            description: 'Глобальна конфігурація платформи.',
            group: 'Архітектура Нульової Довіри',
            audiences: ['core'],
            priority: 70,
          },
        ],
      },
    ],
  },
];

// ─── Утиліти побудови груп ────────────────────────────────────────────────────

const buildGroupsFromItems = (items: NavItem[] = []): NavGroup[] => {
  const groups = new Map<string, NavItem[]>();

  for (const item of items) {
    const groupTitle = item.group ?? 'Загальна група';
    const currentItems = groups.get(groupTitle) ?? [];
    currentItems.push(item);
    groups.set(groupTitle, currentItems);
  }

  return Array.from(groups.entries()).map(([title, groupItems]) => ({
    title,
    items: groupItems.map((item) => ({
      ...item,
      group: item.group ?? title,
    })),
  }));
};

const sectionItems = (section: NavSection): NavItem[] =>
  section.groups?.flatMap((group) =>
    group.items.map((item) => ({
      ...item,
      group: item.group ?? group.title,
    })),
  ) ??
  section.items?.map((item) => ({
    ...item,
    group: item.group,
  })) ??
  [];

export const navigationConfig: NavSection[] = baseNavigationConfig.map((section) => {
  const items = sectionItems(section);
  const groups = section.groups ?? buildGroupsFromItems(items);

  return {
    ...section,
    items,
    groups,
  };
});

// ─── Хелпери перевірки видимості ─────────────────────────────────────────────

const itemMatchesPath = (item: NavItem, pathname: string): boolean => {
  if (item.path === pathname) {
    return true;
  }

  const itemPathNoQuery = item.path.split('?')[0];
  const pathnameNoQuery = pathname.split('?')[0];

  if (itemPathNoQuery !== '/' && itemPathNoQuery === pathnameNoQuery) {
    return true;
  }

  if (item.path !== '/' && pathname.startsWith(`${item.path}/`)) {
    return true;
  }

  return item.matchPaths?.some((matchPath) => pathname.startsWith(matchPath)) ?? false;
};

const isItemVisibleForRole = (item: NavItem, role: string): boolean => {
  const normalizedRole = role?.toLowerCase?.() ?? '';

  if (item.roles && !item.roles.includes(normalizedRole)) {
    return false;
  }

  // ─── PREDATOR ELITE RBAC ──────────────────────────────────────────────────
  // Showcase UI: Клієнти бачать усі клієнтські секції (terminal, pro, sovereign)
  const clientRoles = ['terminal', 'pro', 'sovereign', 'promo', 'client_basic', 'operator', 'explorer', 'viewer', 'ceo', 'owner', 'client_premium', 'analyst', 'supply_chain', 'logistician', 'vip', 'client_drpo', 'investigator'];
  
  if (clientRoles.includes(normalizedRole)) {
    // Клієнти НЕ бачать Core-секції
    if (item.audiences && item.audiences.includes('core')) {
      return false;
    }
    // Всі інші показуємо (включаючи ті, до яких немає доступу - для Upgrade Prompt)
    return true;
  }

  // ─── PREDATOR CORE ────────────────────────────────────────────────────────
  // Адмін бачить ТІЛЬКИ технічні секції
  if (normalizedRole === 'core' || normalizedRole === 'admin' || normalizedRole === 'commander') {
    if (!item.audiences || item.audiences.length === 0) return false;
    return item.audiences.includes('core');
  }

  return true;
};

const isGroupVisibleForRole = (group: NavGroup, role: string): boolean => {
  const normalizedRole = role?.toLowerCase?.() ?? '';

  if (group.roles && !group.roles.includes(normalizedRole)) {
    return false;
  }

  // Showcase UI
  const clientRoles = ['terminal', 'pro', 'sovereign', 'promo', 'client_basic', 'operator', 'explorer', 'viewer', 'ceo', 'owner', 'client_premium', 'analyst', 'supply_chain', 'logistician', 'vip', 'client_drpo', 'investigator'];
  if (clientRoles.includes(normalizedRole)) {
    if (group.audiences && group.audiences.includes('core')) {
      return false;
    }
    return true;
  }

  // Core
  if (normalizedRole === 'core' || normalizedRole === 'admin' || normalizedRole === 'commander') {
    if (!group.audiences || group.audiences.length === 0) return false;
    return group.audiences.includes('core');
  }

  return true;
};

// ─── Helper: визначення заблокованих пунктів меню (Showcase UI) ──────────────

/**
 * Визначає, чи потрібен Upgrade Prompt (замок) для певного пункту меню.
 * @param item - пункт навігації
 * @param role - роль користувача
 * @returns true, якщо пункт вимагає вищого допуску
 */
export const isNavItemLocked = (item: NavItem, role: string): boolean => {
  const normalizedRole = role?.toLowerCase?.() ?? '';
  const resolvedAudience = resolveNavigationAudience(normalizedRole);

  // Core ніколи не має замків у своєму просторі
  if (resolvedAudience === 'core') return false;

  // Якщо секція не має специфічних вимог до аудиторії
  if (!item.audiences || item.audiences.length === 0) return false;

  // Термінал не має доступу до Pro та Sovereign
  if (resolvedAudience === 'terminal') {
    if (item.audiences.includes('pro') || item.audiences.includes('sovereign')) return true;
  }

  // Pro не має доступу до Sovereign
  if (resolvedAudience === 'pro') {
    if (item.audiences.includes('sovereign')) return true;
  }

  return false;
};

// ─── Публічне API навігації ───────────────────────────────────────────────────

export const getGlobalNavigationActions = (): NavGlobalAction[] => globalNavigationActions;

export const getVisibleNavigation = (role: string): NavSection[] =>
  navigationConfig
    .map((section) => {
      const visibleGroups = (section.groups ?? [])
        .filter((group) => isGroupVisibleForRole(group, role))
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => isItemVisibleForRole(item, role)),
        }))
        .filter((group) => group.items.length > 0);

      return {
        ...section,
        groups: visibleGroups,
        items: visibleGroups.flatMap((group) =>
          group.items.map((item) => ({
            ...item,
            group: item.group ?? group.title,
          })),
        ),
      };
    })
    .filter((section) => section.items.length > 0);

export const getNavigationTotals = (role: string): { items: number; sections: number } => {
  const sections = getVisibleNavigation(role);
  return {
    sections: sections.length,
    items: sections.reduce((total, section) => total + (section.items?.length ?? 0), 0),
  };
};

export const getAllVisibleNavigationItems = (role: string): VisibleNavItem[] =>
  getVisibleNavigation(role).flatMap((section) =>
    (section.items ?? []).map((item) => ({
      ...item,
      accent: section.accent,
      sectionId: section.id,
      sectionLabel: section.label,
      sectionDescription: section.description,
      sectionOutcome: section.outcome,
    })),
  );

export const getRecommendedNavigation = (role: string, limit: number = 6): VisibleNavItem[] =>
  [...getAllVisibleNavigationItems(role)]
    .filter((item) => (item.priority ?? 0) > 0)
    .sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0))
    .slice(0, limit);

export const getNavigationContext = (pathname: string, role: string): NavigationContext => {
  const sections = getVisibleNavigation(role);

  for (const section of sections) {
    for (const item of section.items ?? []) {
      if (item.path === pathname) {
        return { item, section };
      }
    }
  }

  for (const section of sections) {
    const sortedItems = [...(section.items ?? [])].sort(
      (left, right) => right.path.length - left.path.length,
    );
    const matchedItem = sortedItems.find((item) => itemMatchesPath(item, pathname));

    if (matchedItem) {
      return { item: matchedItem, section };
    }
  }

  return { item: null, section: null };
};

export const isNavigationPathVisible = (pathname: string, role: string): boolean =>
  getVisibleNavigation(role).some((section) =>
    (section.items ?? []).some((item) => itemMatchesPath(item, pathname)),
  );
