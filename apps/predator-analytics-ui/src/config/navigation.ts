import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  Box,
  BrainCircuit,
  Briefcase,
  Building2,
  ClipboardList,
  Compass,
  Database,
  DollarSign,
  Eye,
  Factory,
  FileBarChart,
  FileCog,
  FileText,
  Fingerprint,
  FlaskConical,
  Globe,
  HardDrive,
  History,
  Landmark,
  LayoutDashboard,
  Layers,
  LineChart,
  Lock,
  Map as MapIcon,
  Megaphone,
  Network,
  Newspaper,
  Package,
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
  Wallet,
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

// ─── Глобальні дії (гарячі клавіші, режи// ─── Навігаційна конфігурація v64.0-ELITE ────────────────────────────────────
/**
 * 5 клієнтських хабів + системний хаб (core-only).
 * Принцип: клієнт бачить тільки те, що потрібно.
 *   ОГЛЯД      — завжди доступний (Terminal+)
 *   РОЗВІДКА   — пошук + compliance (Terminal базово, Pro повністю)
 *   ТОРГІВЛЯ   — митниця, логістика, тендери
 *   ФІНАНСИ    — фінансова аналітика, AML, SWIFT
 *   AI НЕКСУС  — ШІ-інструменти та прогнозування
 *   CORE ONLY  — системні інструменти (admin)
 */
const baseNavigationConfig: NavSection[] = [

  // ══════════════════════════════════════════════════════════════
  // ХАБ 1: 🏠 ОГЛЯД — Головна панель управління
  // Доступно: Terminal, Pro, Sovereign
  // ══════════════════════════════════════════════════════════════
  {
    id: 'hub-overview',
    label: '🏠 ОГЛЯД',
    description: 'Головна панель: KPI, ризики та щоденний брифінг.',
    outcome: 'Ситуаційна свідомість.',
    accent: 'sky',
    groups: [
      {
        title: 'Панель Управління',
        audiences: ['terminal', 'pro', 'sovereign'],
        items: [
          {
            id: 'dashboard',
            label: 'Головна Панель',
            path: '/command?tab=board',
            icon: LayoutDashboard,
            description: 'KPI, ключові метрики та пульс бізнес-периметра.',
            audiences: ['terminal', 'pro', 'sovereign'],
            priority: 100,
            accessLevel: 'terminal',
          },
          {
            id: 'morning-brief',
            label: 'Ранковий Брифінг',
            path: '/command?tab=brief',
            icon: Compass,
            description: 'Пріоритетний аналіз ризиків на поточний день.',
            audiences: ['terminal', 'pro', 'sovereign'],
            priority: 95,
            accessLevel: 'terminal',
          },
          {
            id: 'newspaper',
            label: 'Стрічка Розвідки',
            path: '/search?tab=newspaper',
            icon: Newspaper,
            description: 'Персоналізована аналітика ринку та конкурентів.',
            audiences: ['terminal', 'pro', 'sovereign'],
            priority: 88,
            accessLevel: 'terminal',
          },
          {
            id: 'alert-center',
            label: 'Центр Алертів',
            path: '/alerts',
            icon: Megaphone,
            description: 'Живий потік подій з налаштовуваними тригерами.',
            badge: 'LIVE',
            audiences: ['terminal', 'pro', 'sovereign'],
            priority: 92,
            accessLevel: 'terminal',
          },
        ],
      },
      {
        title: 'Стратегічні Інструменти',
        audiences: ['pro', 'sovereign'],
        items: [
          {
            id: 'portfolio-risk',
            label: 'Стратегічні Алерти',
            path: '/command?tab=risk',
            icon: TrendingUp,
            description: 'Агрегований фінансовий та репутаційний ризик портфеля.',
            audiences: ['terminal', 'pro', 'sovereign'],
            priority: 90,
            accessLevel: 'terminal',
          },
          {
            id: 'war-room',
            label: 'Ситуаційна Кімната',
            path: '/command?tab=warroom',
            icon: Target,
            description: 'Оперативний штаб для кризового управління.',
            badge: 'LIVE',
            audiences: ['pro', 'sovereign'],
            priority: 85,
            accessLevel: 'pro',
          },
          {
            id: 'scenario-modeling',
            label: 'Симуляція Сценаріїв',
            path: '/modeling?tab=simulation',
            icon: Layers,
            description: 'What-if симуляція на базі онтології та Causal AI.',
            badge: 'ELITE',
            audiences: ['pro', 'sovereign'],
            priority: 82,
            accessLevel: 'pro',
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // ХАБ 2: 🔍 РОЗВІДКА — Суб'єкти, KYC та Compliance
  // Terminal: пошук + KYC + санкції
  // Pro+: граф, бенефіціари, розслідування
  // ══════════════════════════════════════════════════════════════
  {
    id: 'hub-intel',
    label: '🔍 РОЗВІДКА',
    description: 'Пошук суб\'єктів, KYC/KYB, Due Diligence та аналіз зв\'язків.',
    outcome: 'Прозорість контрагентів.',
    accent: 'amber',
    groups: [
      {
        title: 'Базова Розвідка',
        audiences: ['terminal', 'pro', 'sovereign'],
        items: [
          {
            id: 'search',
            label: 'Пошук Суб\'єктів',
            path: '/search?tab=global',
            icon: Search,
            description: 'Глобальний пошук по реєстрах та базах даних.',
            audiences: ['terminal', 'pro', 'sovereign'],
            priority: 98,
            accessLevel: 'terminal',
          },
          {
            id: 'osint-diligence',
            label: 'Аудит KYC/KYB',
            path: '/osint?tab=diligence',
            icon: User,
            description: 'Повний аудит будь-якого суб\'єкта.',
            audiences: ['terminal', 'pro', 'sovereign'],
            priority: 94,
            accessLevel: 'terminal',
          },
          {
            id: 'sanctions',
            label: 'Санкції та PEP',
            path: '/osint?tab=sanctions',
            icon: ShieldX,
            description: 'Скринінг на санкційні списки та політичні зв\'язки.',
            audiences: ['terminal', 'pro', 'sovereign'],
            priority: 96,
            accessLevel: 'terminal',
          },
          {
            id: 'tenders',
            label: 'Тендерний Реєстр',
            path: '/tenders',
            icon: FileText,
            description: 'Моніторинг держзакупівель та тендерного тиску.',
            audiences: ['terminal', 'pro', 'sovereign'],
            priority: 75,
            accessLevel: 'terminal',
          },
        ],
      },
      {
        title: 'Глибока Розвідка',
        audiences: ['pro', 'sovereign'],
        items: [
          {
            id: 'ubo-map',
            label: 'Карта Бенефіціарів',
            path: '/osint?tab=ubo',
            icon: Fingerprint,
            description: 'Структури власності та приховані зв\'язки.',
            badge: 'ELITE',
            audiences: ['pro', 'sovereign'],
            priority: 97,
            accessLevel: 'pro',
          },
          {
            id: 'graph',
            label: 'Граф Зв\'язків',
            path: '/osint?tab=graph',
            icon: Network,
            description: 'Аналіз графа зв\'язків та аномальних кластерів.',
            audiences: ['pro', 'sovereign'],
            priority: 93,
            accessLevel: 'pro',
          },
          {
            id: 'offshore-detector',
            label: 'Виявлення Офшорів',
            path: '/financial?tab=offshore',
            icon: MapIcon,
            description: 'Виявлення підставних компаній та офшорних активів.',
            audiences: ['pro', 'sovereign'],
            priority: 88,
            accessLevel: 'pro',
          },
          {
            id: 'cases',
            label: 'Карта Лобізму',
            path: '/cases',
            icon: Briefcase,
            description: 'Структуроване управління слідчими кейсами.',
            audiences: ['pro', 'sovereign'],
            priority: 80,
            accessLevel: 'pro',
          },
          {
            id: 'timeline',
            label: 'Хронологія Подій',
            path: '/timeline',
            icon: History,
            description: 'Тимчасова шкала подій та зв\'язок з документами.',
            badge: 'NEW',
            audiences: ['pro', 'sovereign'],
            priority: 78,
            accessLevel: 'pro',
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // ХАБ 3: 🚢 ТОРГІВЛЯ — Митниця, логістика, карти
  // Terminal: тендери (вже у РОЗВІДЦІ)
  // Pro+: митна розвідка, логістика, морська розвідка
  // ══════════════════════════════════════════════════════════════
  {
    id: 'hub-trade',
    label: '🚢 ТОРГІВЛЯ',
    description: 'Митна аналітика, логістика та торгові потоки.',
    outcome: 'Логістична стійкість.',
    accent: 'blue',
    groups: [
      {
        title: 'Митниця та Логістика',
        audiences: ['pro', 'sovereign'],
        items: [
          {
            id: 'customs-intel',
            label: 'Митна Розвідка',
            path: '/market?tab=customs',
            icon: Shield,
            description: 'Аналіз декларацій та ризикових митних операцій.',
            audiences: ['pro', 'sovereign'],
            priority: 92,
            accessLevel: 'pro',
          },
          {
            id: 'supply-chain',
            label: 'Контроль Логістики',
            path: '/supply-chain',
            icon: Package,
            description: 'Візуалізація та аналіз вразливостей поставок.',
            audiences: ['pro', 'sovereign'],
            priority: 85,
            accessLevel: 'pro',
          },
          {
            id: 'trade-flow-map',
            label: 'Мапа Торгових Потоків',
            path: '/market?tab=flows',
            icon: Globe,
            description: 'Інтерактивна візуалізація маршрутів імпорту/експорту.',
            audiences: ['pro', 'sovereign'],
            priority: 88,
            accessLevel: 'pro',
          },
          {
            id: 'maritime-intel',
            label: 'Морська Розвідка',
            path: '/maritime',
            icon: Ship,
            description: 'AIS-трекінг, порти, маршрути суден та вантажі.',
            badge: 'LIVE',
            audiences: ['pro', 'sovereign'],
            priority: 82,
            accessLevel: 'pro',
          },
          {
            id: 'regional-activity',
            label: 'Регіональна Активність',
            path: '/market?tab=regional',
            icon: MapIcon,
            description: 'Теплова карта бізнес-активності по регіонах України.',
            audiences: ['terminal', 'pro', 'sovereign'],
            priority: 70,
            accessLevel: 'terminal',
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // ХАБ 4: 💰 ФІНАНСИ — Аналітика, AML, SWIFT
  // Terminal: загальна фінансова панель
  // Pro+: AML, портфель
  // Sovereign: SWIFT монітор, заморожені активи
  // ══════════════════════════════════════════════════════════════
  {
    id: 'hub-finance',
    label: '💰 ФІНАНСИ',
    description: 'Фінансова аналітика, AML та моніторинг транзакцій.',
    outcome: 'Фінансова прозорість.',
    accent: 'emerald',
    groups: [
      {
        title: 'Фінансова Аналітика',
        audiences: ['terminal', 'pro', 'sovereign'],
        items: [
          {
            id: 'financial-dashboard',
            label: 'Фінансова Панель',
            path: '/financial',
            icon: LineChart,
            description: 'Єдиний дашборд з KPI, прибутковістю та трендами.',
            audiences: ['terminal', 'pro', 'sovereign'],
            priority: 100,
            accessLevel: 'terminal',
          },
          {
            id: 'portfolio-analysis',
            label: 'Портфельний Аналіз',
            path: '/portfolio-analysis',
            icon: BarChart3,
            description: 'Оцінка ризиків, диверсифікації та VaR портфеля.',
            audiences: ['pro', 'sovereign'],
            priority: 90,
            accessLevel: 'pro',
          },
          {
            id: 'aml-radar',
            label: 'AML Розвідка',
            path: '/financial?tab=aml',
            icon: ShieldCheck,
            description: 'Виявлення схем відмивання коштів.',
            audiences: ['pro', 'sovereign'],
            priority: 88,
            accessLevel: 'pro',
          },
        ],
      },
      {
        title: 'Суверенний Моніторинг',
        audiences: ['sovereign'],
        items: [
          {
            id: 'swift-monitor',
            label: 'SWIFT Монітор',
            path: '/financial?tab=swift',
            icon: Radio,
            description: 'Аналіз транскордонних транзакцій у реальному часі.',
            badge: 'ELITE',
            audiences: ['sovereign'],
            priority: 95,
            accessLevel: 'sovereign',
          },
          {
            id: 'asset-freeze-tracker',
            label: 'Трекер Арештів Активів',
            path: '/financial?tab=assets',
            icon: Wallet,
            description: 'Моніторинг заморожених та конфіскованих активів.',
            badge: 'ELITE',
            audiences: ['sovereign'],
            priority: 92,
            accessLevel: 'sovereign',
          },
          {
            id: 'geopolitical-radar',
            label: 'Геополітичні Загрози',
            path: '/geopolitical-radar',
            icon: Radar,
            description: 'Вплив глобальних подій на бізнес-стабільність.',
            audiences: ['sovereign'],
            priority: 85,
            accessLevel: 'sovereign',
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // ХАБ 5: 🧠 AI НЕКСУС — Суверенний ШІ
  // Terminal: AI Інсайти
  // Pro+: Оракул, звіти
  // Sovereign: Нексус, прогнозування
  // ══════════════════════════════════════════════════════════════
  {
    id: 'hub-ai',
    label: '🧠 AI НЕКСУС',
    description: 'Генеративна аналітика, прогнозування та звіти.',
    outcome: 'Когнітивна перевага.',
    accent: 'cyan',
    groups: [
      {
        title: 'AI Інструменти',
        audiences: ['terminal', 'pro', 'sovereign'],
        items: [
          {
            id: 'ai-insights',
            label: 'AI Інсайти',
            path: '/nexus?tab=insights',
            icon: Zap,
            description: 'Кросмодальні сигнали та стратегічні висновки.',
            audiences: ['terminal', 'pro', 'sovereign'],
            priority: 90,
            accessLevel: 'terminal',
          },
          {
            id: 'oracle',
            label: 'Суверенний Оракул',
            path: '/nexus?tab=oracle',
            icon: Sparkles,
            description: 'Генеративний синтез від архітектурних LLM моделей.',
            audiences: ['pro', 'sovereign'],
            priority: 100,
            accessLevel: 'pro',
          },
          {
            id: 'report-builder',
            label: 'Конструктор Звітів',
            path: '/reports',
            icon: FileBarChart,
            description: 'AI-генерація PDF/PPTX/HTML звітів з шаблонами.',
            audiences: ['pro', 'sovereign'],
            priority: 85,
            accessLevel: 'pro',
          },
          {
            id: 'decisions-journal',
            label: 'Журнал Рішень',
            path: '/decisions',
            icon: Scale,
            description: 'Історія AI-рекомендацій та людських рішень.',
            audiences: ['pro', 'sovereign'],
            priority: 78,
            accessLevel: 'pro',
          },
        ],
      },
      {
        title: 'Предиктивне Моделювання',
        audiences: ['sovereign'],
        items: [
          {
            id: 'nexus',
            label: 'Прогностичний Нексус',
            path: '/nexus',
            icon: BrainCircuit,
            description: 'Центр прогнозного моделювання та сценаріїв.',
            badge: 'ELITE',
            audiences: ['sovereign'],
            priority: 95,
            accessLevel: 'sovereign',
          },
          {
            id: 'scenario-advanced',
            label: 'WAR-GAMING Сценарії',
            path: '/scenarios',
            icon: Layers,
            description: 'Стратегічна симуляція кризових сценаріїв.',
            badge: 'SOVEREIGN',
            audiences: ['sovereign'],
            priority: 88,
            accessLevel: 'sovereign',
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // SYSTEM CORE — Тільки для Core/Admin (приховано від клієнтів)
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
        title: 'Безпека та Налаштування',
        audiences: ['core'],
        items: [
          {
            id: 'admin-security',
            label: 'Zero Trust Консоль',
            path: '/admin/command?tab=security',
            icon: Lock,
            description: 'IAM, аудит сесій, API-ключі, логи доступу.',
            group: 'Безпека та Налаштування',
            audiences: ['core'],
            priority: 90,
          },
          {
            id: 'admin-settings',
            label: 'Глобальні Налаштування',
            path: '/admin/command?tab=settings',
            icon: Settings,
            description: 'Глобальна конфігурація платформи.',
            group: 'Безпека та Налаштування',
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

  // ─── PREDATOR ELITE RBAC v63.0 ─────────────────────────────────────────────
  // Використовуємо канонічний audience через resolveNavigationAudience
  // для автоматичної обробки всіх legacy аліасів
  const audience = resolveNavigationAudience(normalizedRole);

  // Core (Tech Admin): тільки технічні секції
  if (audience === 'core') {
    if (!item.audiences || item.audiences.length === 0) return false;
    return item.audiences.includes('core');
  }

  // Клієнтські ролі (Terminal / Pro / Sovereign): всі клієнтські секції
  // Core-секції приховані — преміум модулі показуються з замком через isNavItemLocked
  if (item.audiences && item.audiences.includes('core')) {
    return false;
  }

  return true;
};

const isGroupVisibleForRole = (group: NavGroup, role: string): boolean => {
  const normalizedRole = role?.toLowerCase?.() ?? '';

  if (group.roles && !group.roles.includes(normalizedRole)) {
    return false;
  }

  // ─── PREDATOR ELITE RBAC v63.0 ─────────────────────────────────────────────
  const audience = resolveNavigationAudience(normalizedRole);

  // Core (Tech Admin): тільки технічні секції
  if (audience === 'core') {
    if (!group.audiences || group.audiences.length === 0) return false;
    return group.audiences.includes('core');
  }

  // Клієнтські ролі: Core-секції приховані
  if (group.audiences && group.audiences.includes('core')) {
    return false;
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

// ─── Глобальні дії ────────────────────────────────────────────────────────────

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
