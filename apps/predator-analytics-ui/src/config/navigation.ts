import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  Box,
  BrainCircuit,
  Briefcase,
  Building2,
  Compass,
  Database,
  Eye,
  Factory,
  FileText,
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
  Scale,
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
  Zap,
  type LucideIcon,
} from 'lucide-react';

export type NavAccent =
  | 'amber'
  | 'emerald'
  | 'cyan'
  | 'sky'
  | 'violet'
  | 'rose'
  | 'indigo';

export type NavigationAudience = 'business' | 'analyst' | 'supply_chain' | 'admin';
export type NavWorkspaceMode = 'all' | 'favorites' | 'recent' | 'recommended';

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
  kind: 'focus-search' | 'mode' | 'link';
  mode?: NavWorkspaceMode;
  path?: string;
}

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

const navigationAudienceAliases: Record<string, NavigationAudience> = {
  admin: 'admin',
  commander: 'admin',
  client_premium: 'analyst',
  analyst: 'analyst',
  operator: 'supply_chain',
  supply: 'supply_chain',
  'supply-chain': 'supply_chain',
  supply_chain: 'supply_chain',
  logistician: 'supply_chain',
  logistics: 'supply_chain',
  client_basic: 'business',
  viewer: 'business',
  explorer: 'business',
  ceo: 'business',
  owner: 'business',
};

export const resolveNavigationAudience = (role: string): NavigationAudience =>
  navigationAudienceAliases[role?.toLowerCase?.() ?? ''] ?? 'business';

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
];

/**
 * Канонічна бізнес-орієнтована навігація PREDATOR Analytics v11.5 OSINT-HUB.
 * Шість верхніх блоків зберігають попередні модулі, але прибирають перевантаження на рівні головних секцій.
 */
const baseNavigationConfig: NavSection[] = [
  {
    id: 'command',
    label: 'Командний центр v11.5',
    description: 'Оперативний контроль, ранкові зведення, реальний час і швидкий старт робочого дня.',
    outcome: 'За 5 секунд показує стан бізнесу, головні сигнали й наступну дію з вимірюваним ROI.',
    accent: 'amber',
    items: [
      {
        id: 'dashboard',
        label: 'Панель управління',
        path: '/',
        icon: LayoutDashboard,
        description: 'Головна точка входу з ROI-пульсом, критичними сигналами та швидкими переходами.',
        group: 'Оперативний огляд',
        priority: 100,
        matchPaths: ['/predator-v24'],
      },
      {
        id: 'overview',
        label: 'Огляд системи',
        path: '/overview',
        icon: Eye,
        description: 'Агрегований стан ядра, інфраструктури, декларацій та критичних ризиків.',
        group: 'Оперативний огляд',
        priority: 96,
      },
      {
        id: 'omni',
        label: 'Повне бачення',
        path: '/omni',
        icon: Layers,
        description: 'Глибокий зведений режим для складних перехресних аналітичних сценаріїв.',
        group: 'Оперативний огляд',
        priority: 86,
      },
      {
        id: 'monitoring',
        label: 'Моніторинг',
        path: '/monitoring',
        icon: Activity,
        description: 'Живі стани сервісів, черг, помилок, подій і деградацій продуктивності.',
        group: 'Оперативний огляд',
        priority: 82,
      },
      {
        id: 'morning-brief',
        label: 'Morning Briefing v11.5',
        path: '/morning-brief',
        icon: Compass,
        description: 'Короткий стратегічний брифінг з пріоритетами, ризиками та сигналами на день.',
        group: 'Оперативний огляд',
        priority: 92,
      },
      {
        id: 'newspaper',
        label: 'Ранкова газета',
        path: '/newspaper',
        icon: Newspaper,
        description: 'Персоналізована щоденна зведена аналітика для керівника та команди.',
        group: 'Оперативний огляд',
        priority: 84,
      },
    ],
  },
  {
    id: 'intelligence',
    label: 'OSINT-Контур v11.5',
    description: 'Ринки, ризики, OSINT, досьє, звіти та моделі в одному аналітичному контурі.',
    outcome: 'Sovereign Apex: Дає відповідь на три питання: де заробити, кого перевірити і який сценарій завтра.',
    accent: 'emerald',
    items: [
      {
        id: 'intelligence',
        label: 'Центр розвідки',
        path: '/intelligence',
        icon: Radar,
        description: 'Стратегічна карта ринкових шансів, ризиків і пріоритетів для аналітика.',
        group: 'Ринки та стратегія',
        priority: 94,
      },
      {
        id: 'market',
        label: 'Аналіз ринку',
        path: '/market',
        icon: TrendingUp,
        description: 'Огляд ЗЕД, декларацій, конкурентів та торговельних потоків у єдиному інтерфейсі.',
        group: 'Ринки та стратегія',
        priority: 90,
      },
      {
        id: 'forecast',
        label: 'Прогнозування',
        path: '/forecast',
        icon: Target,
        description: 'Прогнози попиту, сценаріїв і змін ринку на основі підтверджених даних.',
        group: 'Ринки та стратегія',
        priority: 88,
      },
      {
        id: 'opportunities',
        label: 'Можливості',
        path: '/opportunities',
        icon: Briefcase,
        description: 'Виявлення ніш, точок росту, маржинальних напрямків і рекомендованих дій.',
        group: 'Ринки та стратегія',
        priority: 92,
      },
      {
        id: 'competitor-intel',
        label: 'Конкуренти',
        path: '/competitor-intel',
        icon: Eye,
        description: 'Профілі конкурентів, порівняння позицій і динаміка активності на ринку.',
        group: 'Ринки та стратегія',
        priority: 80,
      },
      {
        id: 'diligence',
        label: 'Перевірка контрагентів',
        path: '/diligence',
        icon: Search,
        description: 'Повний профіль компанії, санкції, аномалії та бенефіціарна структура.',
        group: 'Ризики та комплаєнс',
        priority: 91,
        matchPaths: ['/company/'],
      },
      {
        id: 'aml',
        label: 'AML-скоринг',
        path: '/aml',
        icon: AlertTriangle,
        description: 'Оцінка ризику відмивання коштів по компаніях, платежах та ланцюгах.',
        group: 'Ризики та комплаєнс',
        priority: 82,
      },
      {
        id: 'sanctions',
        label: 'Санкції',
        path: '/sanctions',
        icon: Scale,
        description: 'Перевірка санкційних збігів, причин, списків та актуальності записів.',
        group: 'Ризики та комплаєнс',
        priority: 84,
      },
      {
        id: 'risk-scoring',
        label: 'Ризик-скоринг',
        path: '/risk-scoring',
        icon: Target,
        description: 'Комплексний скоринг субʼєктів, партій товару та критичних митних подій.',
        group: 'Ризики та комплаєнс',
        priority: 83,
      },
      {
        id: 'entity-graph',
        label: 'Граф сутностей',
        path: '/entity-graph',
        icon: Network,
        description: 'Поглиблена графова проекція з акцентом на ключові обʼєкти розслідування.',
        group: 'OSINT та розслідування',
        audiences: ['analyst', 'admin'],
      },
      {
        id: 'graph',
        label: 'Граф звʼязків',
        path: '/graph',
        icon: Network,
        description: 'Візуальний аналіз сутностей, бенефіціарів, звʼязків і кластерів.',
        group: 'OSINT та розслідування',
        audiences: ['analyst', 'admin'],
      },
      {
        id: 'power-structure',
        label: 'Структура влади',
        path: '/power-structure',
        icon: Landmark,
        description: 'Мапа інституційного впливу, посадовців та повʼязаних організацій.',
        group: 'OSINT та розслідування',
        audiences: ['analyst', 'admin'],
      },
      {
        id: 'compromat-firm',
        label: 'Досьє компанії',
        path: '/compromat-firm',
        icon: Building2,
        description: 'Компанія під лупою: структура, репутація, ризики та звʼязки.',
        group: 'OSINT та розслідування',
        audiences: ['analyst', 'admin'],
      },
      {
        id: 'compromat',
        label: 'Досьє персони',
        path: '/compromat-person',
        icon: FileText,
        description: 'Профіль особи, звʼязки, ризики, контекст та історія публічних згадок.',
        group: 'OSINT та розслідування',
        audiences: ['analyst', 'admin'],
      },
      {
        id: 'search',
        label: 'Пошуковий центр',
        path: '/search',
        icon: Search,
        description: 'Гібридний пошук по індексах, реєстрах і відкритих джерелах.',
        group: 'OSINT та розслідування',
        priority: 86,
        matchPaths: ['/search-v2'],
      },
      {
        id: 'registries',
        label: 'Реєстри та держреєстри',
        path: '/registries',
        icon: Database,
        description: 'Консолідований доступ до офіційних реєстрів та корпоративних записів.',
        group: 'OSINT та розслідування',
      },
      {
        id: 'tenders',
        label: 'Тендери',
        path: '/tenders',
        icon: Briefcase,
        description: 'Аналіз закупівель, переможців, сум і повторюваних аномалій.',
        group: 'OSINT та розслідування',
      },
      {
        id: 'maritime',
        label: 'Морський трафік',
        path: '/maritime',
        icon: Ship,
        description: 'Відстеження морських маршрутів, суден і транзитних коридорів.',
        group: 'OSINT та розслідування',
      },
      {
        id: 'documents',
        label: 'Документи',
        path: '/documents',
        icon: FileText,
        description: 'Пошук, читання, класифікація і контроль документальних доказів.',
        group: 'OSINT та розслідування',
      },
      {
        id: 'modeling-scenarios',
        label: 'Моделювання сценаріїв',
        path: '/modeling',
        icon: FlaskConical,
        description: 'Окремий простір для симуляцій рішень, ризикових сценаріїв і наслідків.',
        group: 'Моделювання',
        priority: 78,
      },
    ],
  },
  {
    id: 'trade-logistics',
    label: 'Торгівля та логістика',
    description: 'Митниця, ціни, логістичні потоки й ланцюги постачання в єдиному контурі.',
    outcome: 'Допомагає зменшити витрати на закупівлі, оптимізувати маршрути й зняти митні ризики до штрафів.',
    accent: 'cyan',
    items: [
      {
        id: 'customs-intel',
        label: 'Митна аналітика',
        path: '/customs-intel',
        icon: Shield,
        description: 'Базовий митний аналіз по деклараціях, потоках та ризикових категоріях.',
        group: 'Митниця та потоки',
        priority: 88,
      },
      {
        id: 'customs-premium',
        label: 'Митний ПРО',
        path: '/customs-premium',
        icon: Shield,
        description: 'Розширений митний контур із преміальними інструментами аналізу.',
        group: 'Митниця та потоки',
        badge: 'ПРО',
        priority: 84,
      },
      {
        id: 'trade-map',
        label: 'Карта торгівлі',
        path: '/trade-map',
        icon: Globe,
        description: 'Маршрути, країни, вузли та динаміка міжнародних торговельних потоків.',
        group: 'Митниця та потоки',
        priority: 82,
      },
      {
        id: 'price-compare',
        label: 'Порівняння цін',
        path: '/price-compare',
        icon: BarChart3,
        description: 'Пошук демпінгу, завищення та підозрілих цінових відхилень.',
        group: 'Митниця та потоки',
        priority: 86,
      },
      {
        id: 'supply-chain',
        label: 'Ланцюги постачання (Digital Twins)',
        path: '/supply-chain',
        icon: Box,
        description: 'Контроль постачальницьких ланцюгів, вузьких місць і точок ризику.',
        group: 'Логістика та виконання',
        priority: 80,
      },
    ],
  },
  {
    id: 'counterparties',
    label: 'Контрагенти',
    description: 'Клієнти, постачальники та повʼязані бізнес-екосистеми без розриву контексту.',
    outcome: 'Дає єдину точку входу для роботи з усіма контрагентами, перевірками й розвитком відносин.',
    accent: 'rose',
    items: [
      {
        id: 'clients',
        label: 'Клієнтський центр',
        path: '/clients',
        icon: Users,
        description: 'Сегменти клієнтів, кейси, активність та навігація по їхніх сценаріях.',
        group: 'Екосистема контрагентів',
        priority: 90,
      },
      {
        id: 'suppliers',
        label: 'Постачальники',
        path: '/suppliers',
        icon: Building2,
        description: 'Пошук і порівняння постачальників, умов і підтверджених можливостей.',
        group: 'Екосистема контрагентів',
        priority: 84,
      },
      {
        id: 'referral-control',
        label: 'Реферальний контроль',
        path: '/referral-control',
        icon: Users,
        description: 'Контроль каналів рекомендацій, переходів і повʼязаних бізнес-ризиків.',
        group: 'Екосистема контрагентів',
        priority: 68,
      },
    ],
  },
  {
    id: 'ai-automation',
    label: 'ШІ та автоматизація',
    description: 'Агенти, інсайти, база знань і прихований інженерний контур моделей.',
    outcome: 'Автоматизує рутину, дає персоналізовані інсайти й поступово підлаштовує систему під бізнес-правила.',
    accent: 'violet',
    items: [
      {
        id: 'agents',
        label: 'ШІ-агенти',
        path: '/agents',
        icon: Users,
        description: 'Контроль агентів, ролей, стану задач та результатів їхньої роботи.',
        group: 'Користувацький контур',
        priority: 88,
      },
      {
        id: 'ai-insights',
        label: 'ШІ-інсайти',
        path: '/ai-insights',
        icon: Zap,
        description: 'Добірка висновків і підказок, сформованих на базі фактичних сигналів.',
        group: 'Користувацький контур',
        priority: 86,
      },
      {
        id: 'knowledge',
        label: 'База знань',
        path: '/knowledge',
        icon: BrainCircuit,
        description: 'Побудова й актуалізація знань для моделей та аналітичних сценаріїв.',
        group: 'Користувацький контур',
        priority: 74,
      },

    ],
  },
  {
    id: 'system',
    label: 'Система',
    description: 'Безпека, налаштування, дані, пайплайни та фабричний контур, прихований від бізнес-користувача.',
    outcome: 'Дає прозорий контроль безпеки й налаштувань, а для адміністраторів відкриває повний технічний шар.',
    accent: 'indigo',
    items: [
      {
        id: 'security',
        label: 'Безпека',
        path: '/security',
        icon: Lock,
        description: 'Стан захисту, подій безпеки, журналів і критичних відхилень.',
        group: 'Безпека',
        priority: 72,
      },
      {
        id: 'compliance',
        label: 'Комплаєнс',
        path: '/compliance',
        icon: Scale,
        description: 'Перевірка правил, обмежень, процедур та регуляторних вимог.',
        group: 'Комплаєнс',
        priority: 70,
      },
      {
        id: 'settings',
        label: 'Налаштування',
        path: '/settings',
        icon: Settings,
        description: 'Налаштування інтерфейсу, доступів і поведінки платформи.',
        group: 'Налаштування',
        priority: 68,
      },
      {
        id: 'deployment',
        label: 'Деплоймент',
        path: '/deployment',
        icon: Globe,
        description: 'Стани середовищ, релізів і пайплайнів розгортання.',
        group: 'Деплоймент',
        roles: ['admin'],
      },
      {
        id: 'governance',
        label: 'Суверенне врядування',
        path: '/governance',
        icon: Shield,
        description: 'Центр політик, аудитів і суверенного контролю даних.',
        group: 'Суверенне врядування',
        roles: ['admin'],
      },
      {
        id: 'data',
        label: 'Платформа даних',
        path: '/data',
        icon: Database,
        description: 'Огляд структури даних, індексів, каталогів і готовності сховища.',
        group: 'Платформа даних',
        roles: ['admin'],
      },
      {
        id: 'pipelines',
        label: 'Пайплайни',
        path: '/ingestion',
        icon: Upload,
        description: 'Завантаження джерел, потоків та стан конвеєрів інгестії.',
        group: 'Пайплайни',
        roles: ['admin'],
      },
      {
        id: 'system-factory',
        label: 'Фабрика',
        path: '/system-factory',
        icon: Factory,
        description: 'Комплексне складання систем, контурів, модулів і їхнього стану.',
        group: 'Фабрика',
        roles: ['admin'],
      },
      {
        id: 'ai-control-center',
        label: 'Центр керування ШІ',
        path: '/admin/ai-control',
        icon: Zap,
        description: 'Адміністративне керування ШІ-контуром, політиками та обмеженнями.',
        group: 'Центр керування ШІ',
        roles: ['admin'],
      },
    ],
  },
];

const buildGroupsFromItems = (items: NavItem[] = []): NavGroup[] => {
  const groups = new Map<string, NavItem[]>();

  for (const item of items) {
    const groupTitle = item.group ?? 'Загальна група';
    const currentItems = groups.get(groupTitle) ?? [];
    currentItems.push(item);
    groups.set(groupTitle, currentItems);
  }

  return [...groups.entries()].map(([title, groupItems]) => ({
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

const itemMatchesPath = (item: NavItem, pathname: string): boolean => {
  if (item.path === pathname) {
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

  if (normalizedRole === 'admin') {
    return true;
  }

  if (!item.audiences || item.audiences.length === 0) {
    return true;
  }

  return item.audiences.includes(resolveNavigationAudience(normalizedRole));
};

const isGroupVisibleForRole = (group: NavGroup, role: string): boolean => {
  const normalizedRole = role?.toLowerCase?.() ?? '';

  if (group.roles && !group.roles.includes(normalizedRole)) {
    return false;
  }

  if (!group.audiences || group.audiences.length === 0) {
    return true;
  }

  if (normalizedRole === 'admin') {
    return true;
  }

  return group.audiences.includes(resolveNavigationAudience(normalizedRole));
};

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
    const sortedItems = [...(section.items ?? [])].sort((left, right) => right.path.length - left.path.length);
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
