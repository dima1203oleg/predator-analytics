import {
  Activity,
  AlertTriangle,
  BarChart3,
  Blocks,
  Box,
  Brain,
  BrainCircuit,
  Briefcase,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  CreditCard,
  Cpu,
  Database,
  DollarSign,
  Eye,
  Factory,
  FileText,
  FlaskConical,
  Globe,
  Landmark,
  LayoutDashboard,
  Layers,
  LineChart,
  Lock,
  Network,
  Newspaper,
  Package,
  Puzzle,
  Radar,
  Scale,
  ScrollText,
  Search,
  Settings,
  Shield,
  Ship,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Upload,
  Users,
  Workflow,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { normalizeUserRole, UserRole } from './roles';

export type NavAccent =
  | 'amber'
  | 'emerald'
  | 'cyan'
  | 'sky'
  | 'violet'
  | 'rose'
  | 'indigo';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  description: string;
  badge?: string;
  roles?: string[];
  tiers?: AccessTier[];
  matchPaths?: string[];
}

export interface NavGroup {
  id: string;
  label: string;
  description: string;
  items: NavItem[];
  roles?: string[];
  tiers?: AccessTier[];
}

export interface NavSection {
  id: string;
  label: string;
  description: string;
  accent: NavAccent;
  items: NavItem[];
  groups?: NavGroup[];
  collapsed?: boolean;
  isGlobal?: boolean;
  roles?: string[];
  tiers?: AccessTier[];
}

export interface NavigationContext {
  item: NavItem | null;
  section: NavSection | null;
}

export type NavigationAccessState = 'allowed' | 'upgrade' | 'forbidden' | 'unknown';

export type NavigationRole =
  | 'admin'
  | 'analyst'
  | 'business'
  | 'supply_chain'
  | 'viewer';

export type AccessTier = 'basic' | 'pro' | 'enterprise';

const ROLE_ALIASES: Record<string, NavigationRole> = {
  commander: 'admin',
  explorer: 'viewer',
  operator: 'supply_chain',
  business_owner: 'business',
  owner: 'business',
  ceo: 'business',
  client_basic: 'viewer',
  client_premium: 'analyst',
};

export const normalizeNavigationRole = (role: string): NavigationRole =>
  ROLE_ALIASES[role.toLowerCase()] ?? (normalizeUserRole(role) as NavigationRole);

export const normalizeAccessTier = (tier?: string | null): AccessTier => {
  if (!tier || tier === 'free' || tier === 'basic') {
    return 'basic';
  }

  if (tier === 'enterprise') {
    return 'enterprise';
  }

  return 'pro';
};

const roleMatches = (role: string, allowedRoles?: string[]): boolean => {
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  const normalizedRole = normalizeNavigationRole(role);
  const normalizedAllowed = allowedRoles.map((allowedRole) => normalizeNavigationRole(allowedRole));

  return normalizedAllowed.includes(normalizedRole);
};

const tierMatches = (tier: string, allowedTiers?: AccessTier[]): boolean => {
  if (!allowedTiers || allowedTiers.length === 0) {
    return true;
  }

  return allowedTiers.includes(normalizeAccessTier(tier));
};

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
  amber: {
    badge: 'bg-amber-500/15 text-amber-300 border-amber-400/20',
    dot: 'bg-amber-400',
    glow: 'from-amber-500/18 via-amber-400/5 to-transparent',
    icon: 'text-amber-300',
    iconBorder: 'border-amber-400/20 bg-amber-500/10',
    sectionBorder: 'border-amber-400/12',
    softText: 'text-amber-200/85',
  },
  emerald: {
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/20',
    dot: 'bg-emerald-400',
    glow: 'from-emerald-500/18 via-emerald-400/5 to-transparent',
    icon: 'text-emerald-300',
    iconBorder: 'border-emerald-400/20 bg-emerald-500/10',
    sectionBorder: 'border-emerald-400/12',
    softText: 'text-emerald-200/85',
  },
  cyan: {
    badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/20',
    dot: 'bg-cyan-400',
    glow: 'from-cyan-500/18 via-cyan-400/5 to-transparent',
    icon: 'text-cyan-300',
    iconBorder: 'border-cyan-400/20 bg-cyan-500/10',
    sectionBorder: 'border-cyan-400/12',
    softText: 'text-cyan-200/85',
  },
  sky: {
    badge: 'bg-sky-500/15 text-sky-300 border-sky-400/20',
    dot: 'bg-sky-400',
    glow: 'from-sky-500/18 via-sky-400/5 to-transparent',
    icon: 'text-sky-300',
    iconBorder: 'border-sky-400/20 bg-sky-500/10',
    sectionBorder: 'border-sky-400/12',
    softText: 'text-sky-200/85',
  },
  violet: {
    badge: 'bg-violet-500/15 text-violet-300 border-violet-400/20',
    dot: 'bg-violet-400',
    glow: 'from-violet-500/18 via-violet-400/5 to-transparent',
    icon: 'text-violet-300',
    iconBorder: 'border-violet-400/20 bg-violet-500/10',
    sectionBorder: 'border-violet-400/12',
    softText: 'text-violet-200/85',
  },
  rose: {
    badge: 'bg-rose-500/15 text-rose-300 border-rose-400/20',
    dot: 'bg-rose-400',
    glow: 'from-rose-500/18 via-rose-400/5 to-transparent',
    icon: 'text-rose-300',
    iconBorder: 'border-rose-400/20 bg-rose-500/10',
    sectionBorder: 'border-rose-400/12',
    softText: 'text-rose-200/85',
  },
  indigo: {
    badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/20',
    dot: 'bg-indigo-400',
    glow: 'from-indigo-500/18 via-indigo-400/5 to-transparent',
    icon: 'text-indigo-300',
    iconBorder: 'border-indigo-400/20 bg-indigo-500/10',
    sectionBorder: 'border-indigo-400/12',
    softText: 'text-indigo-200/85',
  },
};

const GLOBAL_QUICK_ACTIONS: NavItem[] = [
  {
    id: 'global-search',
    label: 'Пошук',
    path: '/search',
    icon: Search,
    description: 'Глобальний пошук з підтримкою швидких переходів та аналітичного контексту.',
    matchPaths: ['/search-v2'],
  },
  {
    id: 'global-favorites',
    label: 'Обране',
    path: '/reports',
    icon: Star,
    description: 'Закріплені розділи, звіти та робочі сценарії для швидкого доступу.',
  },
  {
    id: 'global-recent',
    label: 'Нещодавнє',
    path: '/overview',
    icon: Clock,
    description: 'Останні переглянуті розділи та робочі точки входу.',
  },
  {
    id: 'global-ai-reco',
    label: 'AI-рекомендації',
    path: '/ai-insights',
    icon: Sparkles,
    description: 'Сигнали та підказки, згенеровані на основі підтверджених даних.',
  },
  {
    id: 'global-assistant',
    label: 'AI-асистент',
    path: '/copilot',
    icon: BrainCircuit,
    description: 'Природномовний помічник для швидких аналітичних дій і пояснень.',
  },
];

/**
 * Канонічна навігація PREDATOR Analytics v56.1.
 * Всі назви та описи призначені для людини, а не для внутрішніх технічних назв.
 */
export const navigationConfig: NavSection[] = [
  {
    id: 'global-layer',
    label: 'Глобальний шар',
    description: 'Швидкий доступ, обране, нещодавнє та AI-підказки незалежно від активного розділу.',
    accent: 'violet',
    isGlobal: true,
    items: GLOBAL_QUICK_ACTIONS,
  },
  {
    id: 'command-center',
    label: 'Командний центр',
    description: 'Оперативний штаб прибутку, ризиків і щоденного управлінського контролю.',
    accent: 'amber',
    items: [
      {
        id: 'dashboard',
        label: 'Панель управління',
        path: '/',
        icon: LayoutDashboard,
        description: 'Головна точка входу з живими метриками, пріоритетами та ROI.',
        matchPaths: ['/predator-v24'],
      },
      {
        id: 'overview',
        label: 'Огляд системи',
        path: '/overview',
        icon: Eye,
        description: 'Агрегований стан бізнесу, сигналів, ризиків і ключових відхилень.',
      },
      {
        id: 'omni',
        label: 'Повне бачення',
        path: '/omni',
        icon: Layers,
        description: 'Зведений режим для глибоких перехресних сценаріїв та синтезу інсайтів.',
      },
      {
        id: 'monitoring',
        label: 'Моніторинг',
        path: '/monitoring',
        icon: Activity,
        description: 'Живі стани процесів, подій, відхилень і критичних сигналів.',
      },
      {
        id: 'morning-brief',
        label: 'Ранковий брифінг',
        path: '/morning-brief',
        icon: Compass,
        description: 'Короткий стратегічний огляд для старту робочого дня.',
      },
      {
        id: 'newspaper',
        label: 'Ранкова газета',
        path: '/newspaper',
        icon: Newspaper,
        description: 'Персоналізований дайджест із підсумками, подіями та новими сигналами.',
      },
    ],
    groups: [
      {
        id: 'overview',
        label: 'Огляд',
        description: 'Оперативний контроль та стратегічний огляд.',
        items: [
          { id: 'dashboard', label: 'Панель управління', path: '/', icon: LayoutDashboard, description: 'Головна точка входу з живими метриками, пріоритетами та ROI.' },
          { id: 'overview', label: 'Огляд системи', path: '/overview', icon: Eye, description: 'Агрегований стан бізнесу, сигналів, ризиків і ключових відхилень.' },
          { id: 'omni', label: 'Повне бачення', path: '/omni', icon: Layers, description: 'Зведений режим для глибоких перехресних сценаріїв та синтезу інсайтів.' },
        ],
      },
      {
        id: 'operations',
        label: 'Оперативка',
        description: 'Щоденний оперативний контроль.',
        items: [
          { id: 'monitoring', label: 'Моніторинг', path: '/monitoring', icon: Activity, description: 'Живі стани процесів, подій, відхилень і критичних сигналів.' },
          { id: 'morning-brief', label: 'Ранковий брифінг', path: '/morning-brief', icon: Compass, description: 'Короткий стратегічний огляд для старту робочого дня.' },
          { id: 'newspaper', label: 'Ранкова газета', path: '/newspaper', icon: Newspaper, description: 'Персоналізований дайджест із підсумками, подіями та новими сигналами.' },
        ],
      },
      {
        id: 'finances',
        label: '💰 Фінанси / Unit-економіка',
        description: 'Фінансовий контроль та unit-економіка бізнес-процесів.',
        items: [
          { id: 'budgets', label: 'Бюджети', path: '/budgets', icon: Landmark, description: 'Планування та контроль бюджетів за напрямками.', tiers: ['pro', 'enterprise'] },
          { id: 'expenses', label: 'Витрати', path: '/expenses', icon: DollarSign, description: 'Деталізація фактичних витрат, порівняння з бюджетом.', tiers: ['pro', 'enterprise'] },
          { id: 'savings', label: 'Економія', path: '/savings', icon: TrendingUp, description: 'Агрегація зекономлених коштів завдяки рекомендаціям платформи.', tiers: ['pro', 'enterprise'] },
          { id: 'procurement-optimizer', label: 'Оптимізація закупівель', path: '/procurement-optimizer', icon: Target, description: 'Знайдіть найкращих постачальників та зекономте до 25% на кожній партії.', badge: 'NEW', tiers: ['basic', 'pro', 'enterprise'] },
          { id: 'cost-per-action', label: 'Вартість дії (CPA)', path: '/cpa', icon: BarChart3, description: 'Розрахунок вартості кожної автоматизованої дії.', tiers: ['pro', 'enterprise'] },
          { id: 'roi-modules', label: 'ROI по модулях', path: '/roi-modules', icon: LineChart, description: 'Повернення інвестицій для кожного модуля, агента, інтеграції.', tiers: ['pro', 'enterprise'] },
          { id: 'ltv-cac', label: 'LTV / CAC', path: '/ltv-cac', icon: Users, description: 'Життєва цінність клієнта та вартість залучення.', tiers: ['enterprise'] },
        ],
      },
    ],
  },
  {
    id: 'intelligence',
    label: 'Розвідка',
    description: 'Мозок системи: де гроші, де небезпека і де наступна можливість.',
    accent: 'emerald',
    items: [
      { id: 'intelligence', label: 'Центр розвідки', path: '/intelligence', icon: Radar, description: 'Стратегічна карта ризиків, сигналів і пріоритетів.' },
      { id: 'market', label: 'Аналіз ринку', path: '/market', icon: TrendingUp, description: 'Огляд ринку, потоків, конкурентів і потенціалу прибутку.' },
      { id: 'forecast', label: 'Прогнозування', path: '/forecast', icon: Target, description: 'Сценарії попиту, ризиків і майбутніх можливостей.', tiers: ['pro', 'enterprise'] },
      { id: 'opportunities', label: 'Можливості', path: '/opportunities', icon: Briefcase, description: 'Сигнали для зростання виручки та швидкого захоплення ринку.', tiers: ['pro', 'enterprise'] },
      { id: 'competitor-intel', label: 'Конкуренти', path: '/competitor-intel', icon: Eye, description: 'Позиції, переваги та слабкі місця конкурентів.', tiers: ['pro', 'enterprise'] },
      { id: 'diligence', label: 'Перевірка контрагентів', path: '/diligence', icon: Search, description: 'Профіль компанії, санкції, аномалії та бенефіціарна структура.', matchPaths: ['/company/'] },
      { id: 'modeling', label: 'Моделювання', path: '/modeling', icon: FlaskConical, description: 'Симуляції рішень, ризиків і наслідків без демо-шуму.' },
    ],
    groups: [
      {
        id: 'markets-strategy',
        label: 'Ринки та стратегія',
        description: 'Сценарії для оцінки ринку, виручки та векторів росту.',
        items: [
          { id: 'intelligence', label: 'Центр розвідки', path: '/intelligence', icon: Radar, description: 'Стратегічна карта ризиків, сигналів і пріоритетів.' },
          { id: 'market', label: 'Аналіз ринку', path: '/market', icon: TrendingUp, description: 'Огляд ринку, потоків, конкурентів і потенціалу прибутку.' },
          { id: 'forecast', label: 'Прогнозування', path: '/forecast', icon: Target, description: 'Сценарії попиту, ризиків і майбутніх можливостей.' },
          { id: 'opportunities', label: 'Можливості', path: '/opportunities', icon: Briefcase, description: 'Сигнали для зростання виручки та швидкого захоплення ринку.' },
          { id: 'competitor-intel', label: 'Конкуренти', path: '/competitor-intel', icon: Eye, description: 'Позиції, переваги та слабкі місця конкурентів.' },
        ],
      },
      {
        id: 'risk-compliance',
        label: 'Ризики та комплаєнс',
        description: 'Підсвічує загрози, що можуть вбити угоду або прибуток.',
        items: [
          { id: 'diligence', label: 'Перевірка контрагентів', path: '/diligence', icon: Search, description: 'Профіль компанії, санкції, аномалії та бенефіціари.', matchPaths: ['/company/'] },
          { id: 'aml', label: 'AML-скоринг', path: '/aml', icon: AlertTriangle, description: 'Оцінка ризику відмивання коштів по компаніях і платежах.' },
          { id: 'sanctions', label: 'Санкції', path: '/sanctions', icon: Scale, description: 'Перевірка санкційних збігів, списків та актуальності.' },
          { id: 'risk-scoring', label: 'Ризик-скоринг', path: '/risk-scoring', icon: Target, description: 'Комплексний скоринг субʼєктів, партій і подій.' },
        ],
      },
      {
        id: 'osint-investigation',
        label: 'OSINT та розслідування',
        description: 'Графи, реєстри, тендери та докази для глибокого розслідування.',
        roles: ['admin', 'analyst', 'government', 'intelligence'],
        tiers: ['pro', 'enterprise'],
        items: [
          { id: 'entity-graph', label: 'Граф сутностей', path: '/entity-graph', icon: Network, description: 'Графова проекція ключових об’єктів розслідування.' },
          { id: 'graph', label: 'Граф звʼязків', path: '/graph', icon: Network, description: 'Бенефіціари, зв’язки та кластери в одному вікні.' },
          { id: 'power-structure', label: 'Структура влади', path: '/power-structure', icon: Landmark, description: 'Мапа впливу, посадовців і пов’язаних організацій.' },
          { id: 'compromat-person', label: 'Досьє персони', path: '/compromat-person', icon: FileText, description: 'Профіль особи, зв’язки, ризики та публічні згадки.' },
          { id: 'compromat-firm', label: 'Досьє компанії', path: '/compromat-firm', icon: Building2, description: 'Компанія під лупою: структура, репутація та ризики.' },
          { id: 'search', label: 'Пошуковий центр', path: '/search', icon: Search, description: 'Гібридний пошук по індексах і відкритих джерелах.', matchPaths: ['/search-v2'] },
          { id: 'registries', label: 'Реєстри', path: '/registries', icon: Database, description: 'Консолідований доступ до офіційних реєстрів.' },
          { id: 'datagov', label: 'Держреєстри', path: '/datagov', icon: Landmark, description: 'Державні набори даних та відкриті джерела.' },
          { id: 'tenders', label: 'Тендери', path: '/tenders', icon: Briefcase, description: 'Аналіз закупівель, переможців і аномалій.' },
          { id: 'maritime', label: 'Морський трафік', path: '/maritime', icon: Ship, description: 'Маршрути, судна та транзитні коридори.' },
          { id: 'documents', label: 'Документи', path: '/documents', icon: FileText, description: 'Пошук, читання і контроль документальних доказів.' },
        ],
      },
      {
        id: 'modeling',
        label: 'Моделювання',
        description: 'Симуляції рішень, ризиків і сценаріїв без зайвого шуму.',
        roles: ['admin', 'analyst'],
        items: [
          { id: 'modeling', label: 'Моделювання', path: '/modeling', icon: FlaskConical, description: 'Простір для симуляцій рішень, ризиків і наслідків.' },
        ],
      },
    ],
  },
  {
    id: 'trade-logistics',
    label: 'Торгівля та логістика',
    description: 'Головний генератор економії на митниці, маршрутах і постачанні.',
    accent: 'cyan',
    items: [
      { id: 'customs-intel', label: 'Митна аналітика', path: '/customs-intel', icon: Shield, description: 'Аналіз декларацій, потоків і ризикових категорій.' },
      { id: 'customs-premium', label: 'Митний ПРО', path: '/customs-premium', icon: Shield, description: 'Преміальний митний контур з розширеними інструментами.', badge: 'ПРО', tiers: ['pro', 'enterprise'] },
      { id: 'trade-map', label: 'Карта торгівлі', path: '/trade-map', icon: Globe, description: 'Маршрути, країни, вузли та міжнародні потоки.' },
      { id: 'price-compare', label: 'Порівняння цін', path: '/price-compare', icon: BarChart3, description: 'Виявлення перекосів, демпінгу та завищення.', tiers: ['basic', 'pro', 'enterprise'] },
      { id: 'supply-chain', label: 'Ланцюги постачання', path: '/supply-chain', icon: Box, description: 'Контроль ланцюгів, вузьких місць і ризиків.', tiers: ['pro', 'enterprise'] },
    ],
  },
  {
    id: 'clients',
    label: 'Контрагенти',
    description: 'Єдина екосистема партнерів, клієнтів і постачальників.',
    accent: 'rose',
    items: [
      { id: 'clients', label: 'Клієнтський центр', path: '/clients', icon: Users, description: 'Сегменти клієнтів, кейси та активність.' },
      { id: 'suppliers', label: 'Постачальники', path: '/suppliers', icon: Building2, description: 'Пошук і порівняння постачальників та умов.' },
      { id: 'referral-control', label: 'Реферальний контроль', path: '/referral-control', icon: Users, description: 'Контроль каналів рекомендацій і пов’язаних ризиків.', tiers: ['pro', 'enterprise'] },
      { id: 'compromat-person', label: 'Досьє персони', path: '/compromat-person', icon: FileText, description: 'Профіль особи, зв’язки, ризики та згадки.', tiers: ['pro', 'enterprise'] },
      { id: 'compromat-firm', label: 'Досьє компанії', path: '/compromat-firm', icon: Building2, description: 'Компанія під лупою: структура, репутація та ризики.', tiers: ['pro', 'enterprise'] },
    ],
  },
  {
    id: 'ai-autonomy',
    label: 'ШІ та автоматизація',
    description: 'Інтелектуальний радник, який працює 24/7.',
    accent: 'indigo',
    items: [
      { id: 'agents', label: 'ШІ-агенти', path: '/agents', icon: Users, description: 'Агенти, ролі, задачі та результати роботи.' },
      { id: 'ai-insights', label: 'ШІ-інсайти', path: '/ai-insights', icon: Zap, description: 'Інсайти та висновки на основі реальних сигналів.' },
      { id: 'knowledge', label: 'База знань', path: '/knowledge', icon: BrainCircuit, description: 'Актуалізація знань для сценаріїв і моделей.', tiers: ['pro', 'enterprise'] },
      { id: 'llm', label: 'LLM-студія', path: '/llm', icon: Brain, description: 'Керування моделями, провайдерами та маршрутами.', roles: ['admin'], tiers: ['enterprise'] },
      { id: 'engines', label: 'Двигуни', path: '/engines', icon: Cpu, description: 'Стан аналітичних двигунів, latency і throughput.', roles: ['admin'], tiers: ['enterprise'] },
      { id: 'training', label: 'Тренування моделей', path: '/training', icon: Cpu, description: 'Контроль тренувальних циклів і артефактів.', roles: ['admin'], tiers: ['enterprise'] },
      { id: 'super', label: 'Суперінтелект', path: '/super', icon: Brain, description: 'Експериментальний режим аналітичної координації.', badge: 'α', roles: ['admin'], tiers: ['enterprise'] },
      { id: 'ai-control', label: 'Центр керування ШІ', path: '/admin/ai-control', icon: Zap, description: 'Адміністративне керування ШІ-контуром.', roles: ['admin'], tiers: ['enterprise'] },
    ],
    groups: [
      {
        id: 'solution-hub',
        label: '🧩 Центр рішень',
        description: 'Створення, зберігання та масштабування бізнес-рішень.',
        tiers: ['pro', 'enterprise'],
        items: [
          { id: 'my-solutions', label: 'Мої рішення', path: '/my-solutions', icon: Puzzle, description: 'Створені користувачем модулі та пайплайни.' },
          { id: 'solution-templates', label: 'Шаблони рішень', path: '/solution-templates', icon: Blocks, description: 'Готові кейси: імпорт, перевірка контрагентів, логістика.' },
          { id: 'publish-solution', label: 'Публікація рішень', path: '/publish-solution', icon: Upload, description: 'Для внутрішніх команд, клієнтів, маркетплейс.' },
          { id: 'solution-versions', label: 'Версії рішень', path: '/solution-versions', icon: Clock, description: 'Контроль змін, відкат до попередніх версій.' },
        ],
      },
      {
        id: 'business-scenarios',
        label: '📊 Бізнес-сценарії',
        description: 'Готові процеси для швидкого запуску.',
        items: [
          { id: 'import-scenario', label: 'Імпорт товару', path: '/scenario/import', icon: Package, description: 'Повний процес імпорту від перевірки до митного оформлення.', tiers: ['basic', 'pro', 'enterprise'] },
          { id: 'counterparty-check', label: 'Перевірка контрагента', path: '/scenario/counterparty', icon: Search, description: 'Комплексна перевірка компанії перед угодою.', tiers: ['basic', 'pro', 'enterprise'] },
          { id: 'market-analysis', label: 'Аналіз ринку перед закупівлею', path: '/scenario/market', icon: TrendingUp, description: 'Оцінка ринку, цін, постачальників перед закупівлею.', tiers: ['basic', 'pro', 'enterprise'] },
          { id: 'scenario-progress', label: 'Відстеження сценаріїв', path: '/scenario-progress', icon: Activity, description: 'Статус, прогрес та результати запущених сценаріїв.', tiers: ['basic', 'pro', 'enterprise'] },
        ],
      },
    ],
  },
  {
    id: 'system',
    label: 'Система',
    description: 'Технічний контур, видимий лише адміністраторам.',
    accent: 'sky',
    items: [
      { id: 'security', label: 'Безпека', path: '/security', icon: Lock, description: 'Стан захисту, подій і критичних відхилень.', tiers: ['pro', 'enterprise'] },
      { id: 'compliance', label: 'Комплаєнс', path: '/compliance', icon: Scale, description: 'Правила, обмеження, процедури та вимоги.', tiers: ['pro', 'enterprise'] },
      { id: 'settings', label: 'Налаштування', path: '/settings', icon: Settings, description: 'Налаштування інтерфейсу, доступів і поведінки.', tiers: ['basic', 'pro', 'enterprise'] },
      { id: 'billing', label: 'Тарифний план', path: '/billing', icon: CreditCard, description: 'Управління підпискою, лімітами та монетизацією.', tiers: ['basic', 'pro', 'enterprise'] },
      { id: 'deployment', label: 'Деплоймент', path: '/deployment', icon: Globe, description: 'Середовища, релізи та пайплайни розгортання.', roles: ['admin'], tiers: ['enterprise'] },
      { id: 'governance', label: 'Суверенне врядування', path: '/governance', icon: Shield, description: 'Політики, аудити та суверенний контроль.', roles: ['admin'], tiers: ['enterprise'] },
      { id: 'system-factory', label: 'Системна фабрика', path: '/system-factory', icon: Factory, description: 'Контури, модулі й технічний стан платформи.', roles: ['admin'], tiers: ['enterprise'] },
      { id: 'ingestion', label: 'Завантаження', path: '/ingestion', icon: Upload, description: 'Джерела, потоки та конвеєри інгестії.', tiers: ['pro', 'enterprise'] },
      { id: 'data', label: 'Платформа даних', path: '/data', icon: Database, description: 'Структура даних, індекси й готовність сховища.', tiers: ['enterprise'] },
      { id: 'reports', label: 'Звіти', path: '/reports', icon: FileText, description: 'Конструктор звітів і експорт матеріалів.', tiers: ['basic', 'pro', 'enterprise'] },
    ],
    groups: [
      {
        id: 'integrations',
        label: '🔗 Інтеграції',
        description: 'Оркестрація інтеграцій та потоків даних.',
        roles: ['admin'],
        items: [
          { id: 'api-keys', label: 'API ключі', path: '/api-keys', icon: Lock, description: 'Управління API-ключами для зовнішніх сервісів.' },
          { id: 'service-connections', label: 'Підключення до сервісів', path: '/service-connections', icon: Globe, description: 'Конектори до CRM, ERP, митних баз, логістичних платформ.' },
          { id: 'webhooks', label: 'Вебхуки', path: '/webhooks', icon: Upload, description: 'Налаштування вебхуків для подій системи.' },
          { id: 'data-connectors', label: 'Конектори даних', path: '/data-connectors', icon: Database, description: 'Підключення до зовнішніх джерел даних.' },
          { id: 'flow-builder', label: 'Конструктор потоків', path: '/flow-builder', icon: Workflow, description: 'Візуальний конструктор потоків між інтеграціями.' },
          { id: 'event-routing', label: 'Event routing', path: '/event-routing', icon: Network, description: 'Маршрутизація подій між інтеграціями.' },
          { id: 'retry-handling', label: 'Повторні спроби та помилки', path: '/retry-handling', icon: AlertTriangle, description: 'Політики повторних спроб і обробка помилок.' },
        ],
      },
    ],
  },
];

const itemMatchesPath = (item: NavItem, pathname: string): boolean => {
  if (item.path === pathname) {
    return true;
  }

  if (item.path !== '/' && pathname.startsWith(`${item.path}/`)) {
    return true;
  }

  return item.matchPaths?.some((matchPath) => pathname.startsWith(matchPath)) ?? false;
};

const collectSectionItems = (section: NavSection): NavItem[] => [
  ...section.items,
  ...(section.groups?.flatMap((group) => group.items) ?? []),
];

export const getVisibleNavigation = (role: string, tier: string = 'basic'): NavSection[] =>
  navigationConfig
    .map((section) => {
      if (!roleMatches(role, section.roles as string[] | undefined) || !tierMatches(tier, section.tiers)) {
        return {
          ...section,
          items: [],
          groups: [],
        };
      }

      const items = section.items.filter((item) => roleMatches(role, item.roles) && tierMatches(tier, item.tiers));
      const groups = section.groups
        ?.filter((group) => roleMatches(role, group.roles) && tierMatches(tier, group.tiers))
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => roleMatches(role, item.roles) && tierMatches(tier, item.tiers)),
        }))
        .filter((group) => group.items.length > 0);

      return {
        ...section,
        items,
        groups,
      };
    })
    .filter((section) => section.items.length > 0 || (section.groups?.length ?? 0) > 0);

export const getFilteredNavigation = getVisibleNavigation;

export const getNavigationTotals = (role: string, tier: string = 'basic'): { items: number; sections: number } => {
  const sections = getVisibleNavigation(role, tier);
  return {
    sections: sections.length,
    items: sections.reduce(
      (total, section) =>
        total + section.items.length + (section.groups?.reduce((groupTotal, group) => groupTotal + group.items.length, 0) ?? 0),
      0,
    ),
  };
};

export const getNavigationContext = (pathname: string, role: string, tier: string = 'basic'): NavigationContext => {
  const sections = getVisibleNavigation(role, tier);

  for (const section of sections) {
    for (const item of section.items) {
      if (item.path === pathname) {
        return { item, section };
      }
    }

    for (const group of section.groups ?? []) {
      for (const item of group.items) {
        if (item.path === pathname) {
          return { item, section };
        }
      }
    }
  }

  for (const section of sections) {
    const groupedItems = section.groups?.flatMap((group) => group.items) ?? [];
    const sortedItems = [...section.items, ...groupedItems].sort((left, right) => right.path.length - left.path.length);
    const matchedItem = sortedItems.find((item) => itemMatchesPath(item, pathname));

    if (matchedItem) {
      return { item: matchedItem, section };
    }
  }

  return { item: null, section: null };
};

export const canAccessNavigationPath = (pathname: string, role: string, tier: string = 'basic'): boolean =>
  getNavigationContext(pathname, role, tier).item !== null;

export const getNavigationAccessState = (
  pathname: string,
  role: string,
  tier: string = 'basic',
): NavigationAccessState => {
  const visibleSections = getVisibleNavigation(role, tier);
  const visibleItems = visibleSections.flatMap(collectSectionItems);

  if (visibleItems.some((item) => itemMatchesPath(item, pathname))) {
    return 'allowed';
  }

  const roleAllowedSections = navigationConfig
    .filter((section) => roleMatches(role, section.roles as string[] | undefined))
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => roleMatches(role, item.roles)),
      groups: section.groups
        ?.filter((group) => roleMatches(role, group.roles))
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => roleMatches(role, item.roles)),
        }))
        .filter((group) => group.items.length > 0),
    }));

  const roleAllowedItems = roleAllowedSections.flatMap(collectSectionItems);

  if (roleAllowedItems.some((item) => itemMatchesPath(item, pathname))) {
    return 'upgrade';
  }

  const existsInNavigation = navigationConfig
    .flatMap(collectSectionItems)
    .some((item) => itemMatchesPath(item, pathname));

  return existsInNavigation ? 'forbidden' : 'unknown';
};
