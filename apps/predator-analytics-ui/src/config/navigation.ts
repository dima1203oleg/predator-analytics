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
  Compass,
  Cpu,
  Database,
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
  Radar,
  Scale,
  ScrollText,
  Search,
  Settings,
  Shield,
  Ship,
  Target,
  TrendingUp,
  Upload,
  Users,
  Workflow,
  Wrench,
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

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  description: string;
  badge?: string;
  roles?: string[];
  matchPaths?: string[];
}

export interface NavSection {
  id: string;
  label: string;
  description: string;
  accent: NavAccent;
  items: NavItem[];
  collapsed?: boolean;
}

export interface NavigationContext {
  item: NavItem | null;
  section: NavSection | null;
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

/**
 * Канонічна навігація PREDATOR Analytics v56.1.
 * Всі назви та описи призначені для людини, а не для внутрішніх технічних назв.
 */
export const navigationConfig: NavSection[] = [
  {
    id: 'command',
    label: 'Командний центр',
    description: 'Операційний огляд платформи, ранкові брифінги, події та системний контроль.',
    accent: 'amber',
    items: [
      {
        id: 'dashboard',
        label: 'Панель управління',
        path: '/',
        icon: LayoutDashboard,
        description: 'Головна точка входу з живими метриками, секціями та пріоритетами.',
        matchPaths: ['/predator-v24'],
      },
      {
        id: 'overview',
        label: 'Огляд системи',
        path: '/overview',
        icon: Eye,
        description: 'Агрегований стан ядра, інфраструктури, декларацій та критичних сигналів.',
      },
      {
        id: 'omni',
        label: 'Повне бачення',
        path: '/omni',
        icon: Layers,
        description: 'Глибокий зведений режим для складних перехресних аналітичних сценаріїв.',
      },
      {
        id: 'monitoring',
        label: 'Моніторинг',
        path: '/monitoring',
        icon: Activity,
        description: 'Живі стани сервісів, черг, помилок, WebSocket-подій та продуктивності.',
      },
      {
        id: 'morning-brief',
        label: 'Ранковий брифінг',
        path: '/morning-brief',
        icon: Compass,
        description: 'Короткий стратегічний брифінг для оперативного старту роботи.',
      },
    ],
  },
  {
    id: 'intelligence',
    label: 'Корпоративна розвідка',
    description: 'Ринкова аналітика, перевірка контрагентів, сценарне моделювання та виявлення шансів.',
    accent: 'emerald',
    items: [
      {
        id: 'intelligence',
        label: 'Центр розвідки',
        path: '/intelligence',
        icon: Radar,
        description: 'Стратегічна карта ризиків, сигналів і пріоритетних напрямків для аналітика.',
      },
      {
        id: 'market',
        label: 'Аналіз ринку',
        path: '/market',
        icon: TrendingUp,
        description: 'Огляд ЗЕД, декларацій, конкурентів та митних потоків у єдиному інтерфейсі.',
      },
      {
        id: 'forecast',
        label: 'Прогнозування',
        path: '/forecast',
        icon: Target,
        description: 'Прогнози попиту, моделей та сценаріїв на основі фактичних ринкових даних.',
      },
      {
        id: 'diligence',
        label: 'Перевірка контрагентів',
        path: '/diligence',
        icon: Search,
        description: 'Повний профіль компанії, санкції, аномалії та бенефіціарна структура.',
        matchPaths: ['/company/'],
      },
      {
        id: 'opportunities',
        label: 'Можливості',
        path: '/opportunities',
        icon: Briefcase,
        description: 'Інсайти ринку, рекомендовані дії та виконавчі зведення без демо-даних.',
      },
      {
        id: 'competitor-intel',
        label: 'Конкуренти',
        path: '/competitor-intel',
        icon: Eye,
        description: 'Профілі конкурентів, порівняння позицій і динаміка активності на ринку.',
      },
      {
        id: 'modeling',
        label: 'Моделювання',
        path: '/modeling',
        icon: FlaskConical,
        description: 'Окремий простір для симуляцій рішень, ризикових сценаріїв і наслідків.',
      },
    ],
  },
  {
    id: 'customs',
    label: 'Митна розвідка',
    description: 'Митні ризики, санкції, торговельні коридори та цінові відхилення.',
    accent: 'cyan',
    items: [
      {
        id: 'customs-intel',
        label: 'Митна аналітика',
        path: '/customs-intel',
        icon: Shield,
        description: 'Базовий митний аналіз по деклараціях, потоках та ризикових категоріях.',
      },
      {
        id: 'customs-premium',
        label: 'Митний ПРО',
        path: '/customs-premium',
        icon: Shield,
        description: 'Розширений митний контур із преміальними інструментами аналізу.',
        badge: 'ПРО',
      },
      {
        id: 'aml',
        label: 'AML-скоринг',
        path: '/aml',
        icon: AlertTriangle,
        description: 'Оцінка ризику відмивання коштів по компаніях, платежах та ланцюгах.',
      },
      {
        id: 'sanctions',
        label: 'Санкції',
        path: '/sanctions',
        icon: Scale,
        description: 'Перевірка санкційних збігів, списків, причин та актуальності записів.',
      },
      {
        id: 'risk-scoring',
        label: 'Ризик-скоринг',
        path: '/risk-scoring',
        icon: Target,
        description: 'Комплексний скоринг субʼєктів, партій товару та митних подій.',
      },
      {
        id: 'trade-map',
        label: 'Карта торгівлі',
        path: '/trade-map',
        icon: Globe,
        description: 'Маршрути, країни, вузли та динаміка міжнародних торговельних потоків.',
      },
      {
        id: 'price-compare',
        label: 'Порівняння цін',
        path: '/price-compare',
        icon: BarChart3,
        description: 'Пошук цінових перекосів, демпінгу, завищення й підозрілих відхилень.',
      },
    ],
  },
  {
    id: 'osint',
    label: 'OSINT та реєстри',
    description: 'Пошук сутностей, графи звʼязків, документи, тендери та державні джерела.',
    accent: 'sky',
    items: [
      {
        id: 'search',
        label: 'Пошуковий центр',
        path: '/search',
        icon: Search,
        description: 'Гібридний пошук по індексах, реєстрах і відкритих джерелах.',
        matchPaths: ['/search-v2'],
      },
      {
        id: 'graph',
        label: 'Граф звʼязків',
        path: '/graph',
        icon: Network,
        description: 'Візуальний аналіз сутностей, бенефіціарів, звʼязків і кластерів.',
      },
      {
        id: 'entity-graph',
        label: 'Граф сутностей',
        path: '/entity-graph',
        icon: Network,
        description: 'Поглиблена графова проекція з акцентом на ключові обʼєкти розслідування.',
      },
      {
        id: 'registries',
        label: 'Реєстри',
        path: '/registries',
        icon: Database,
        description: 'Консолідований доступ до офіційних реєстрів та корпоративних записів.',
      },
      {
        id: 'tenders',
        label: 'Тендери',
        path: '/tenders',
        icon: Briefcase,
        description: 'Аналіз закупівель, переможців, сум, повторюваності та аномалій.',
      },
      {
        id: 'maritime',
        label: 'Морський трафік',
        path: '/maritime',
        icon: Ship,
        description: 'Відстеження морських маршрутів, суден і транзитних коридорів.',
      },
      {
        id: 'datagov',
        label: 'Держреєстри',
        path: '/datagov',
        icon: Landmark,
        description: 'Державні набори даних, відкриті реєстри та суміжні джерела для перевірки.',
      },
      {
        id: 'documents',
        label: 'Документи',
        path: '/documents',
        icon: FileText,
        description: 'Пошук, читання, класифікація і контроль документальних доказів.',
      },
    ],
  },
  {
    id: 'analytics-tools',
    label: 'Аналітичний арсенал',
    description: 'Звіти, білдери, чартинг, реалтайм-аналітика та окремі огляди.',
    accent: 'violet',
    items: [
      {
        id: 'analytics',
        label: 'Аналітика',
        path: '/analytics',
        icon: BarChart3,
        description: 'Поглиблені аналітичні панелі, зрізи та комплексні індикатори.',
      },
      {
        id: 'reports',
        label: 'Звіти',
        path: '/reports',
        icon: FileText,
        description: 'Конструктор звітів, шаблони та експорт аналітичних матеріалів.',
      },
      {
        id: 'builder',
        label: 'Конструктор дашбордів',
        path: '/builder',
        icon: Blocks,
        description: 'Налаштування власних вʼюшок, віджетів і композицій для команд.',
      },
      {
        id: 'charts',
        label: 'Поглиблені графіки',
        path: '/charts',
        icon: LineChart,
        description: 'Розширені чартові інструменти для глибшого візуального аналізу.',
      },
      {
        id: 'realtime',
        label: 'Реалтайм',
        path: '/realtime',
        icon: Activity,
        description: 'Потоковий режим спостереження за подіями, чергами та змінами.',
        badge: 'НАЖИВО',
      },
      {
        id: 'market-analytics',
        label: 'Ринкова аналітика',
        path: '/market-analytics',
        icon: TrendingUp,
        description: 'Преміальна ринкова аналітика для порівнянь, трендів і сегментів.',
      },
    ],
  },
  {
    id: 'clients',
    label: 'Клієнти',
    description: 'Портфелі клієнтів, реферальний контроль та постачальницькі мережі.',
    accent: 'rose',
    items: [
      {
        id: 'clients',
        label: 'Клієнтський центр',
        path: '/clients',
        icon: Users,
        description: 'Сегменти клієнтів, кейси, активність та навігація по їхніх сценаріях.',
      },
      {
        id: 'referral-control',
        label: 'Реферальний контроль',
        path: '/referral-control',
        icon: Users,
        description: 'Контроль каналів рекомендацій, переходів та повʼязаних ризиків.',
      },
      {
        id: 'suppliers',
        label: 'Постачальники',
        path: '/suppliers',
        icon: Building2,
        description: 'Пошук і порівняння постачальників, умов і підтверджених можливостей.',
      },
    ],
  },
  {
    id: 'client-arsenal',
    label: 'Клієнтський арсенал',
    description: 'Персональні брифінги, досьє, владні мапи та ланцюги постачання.',
    accent: 'indigo',
    items: [
      {
        id: 'newspaper',
        label: 'Ранкова газета',
        path: '/newspaper',
        icon: Newspaper,
        description: 'Персоналізований ранок для клієнта з підсумками та новими сигналами.',
      },
      {
        id: 'compromat',
        label: 'Досьє персони',
        path: '/compromat-person',
        icon: FileText,
        description: 'Профіль особи, звʼязки, ризики, контекст та історія публічних згадок.',
      },
      {
        id: 'compromat-firm',
        label: 'Досьє компанії',
        path: '/compromat-firm',
        icon: Building2,
        description: 'Компанія під лупою: структура, репутація, ризики та звʼязки.',
      },
      {
        id: 'power-structure',
        label: 'Структура влади',
        path: '/power-structure',
        icon: Landmark,
        description: 'Мапа інституційного впливу, посадовців та повʼязаних організацій.',
      },
      {
        id: 'supply-chain',
        label: 'Ланцюги постачання',
        path: '/supply-chain',
        icon: Box,
        description: 'Контроль постачальницьких ланцюгів, вузьких місць і точок ризику.',
      },
    ],
  },
  {
    id: 'ai-autonomy',
    label: 'ШІ та автономність',
    description: 'LLM, агенти, знання, двигуни та контроль автономних процесів.',
    accent: 'emerald',
    items: [
      {
        id: 'llm',
        label: 'LLM-студія',
        path: '/llm',
        icon: Brain,
        description: 'Керування моделями, провайдерами, маршрутами та їхнім станом.',
      },
      {
        id: 'agents',
        label: 'Агенти',
        path: '/agents',
        icon: Users,
        description: 'Контроль агентів, ролей, стану задач та результатів їхньої роботи.',
      },
      {
        id: 'knowledge',
        label: 'База знань',
        path: '/knowledge',
        icon: BrainCircuit,
        description: 'Побудова й актуалізація знань для моделей та аналітичних сценаріїв.',
      },
      {
        id: 'ai-insights',
        label: 'ШІ-інсайти',
        path: '/ai-insights',
        icon: Zap,
        description: 'Добірка інсайтів і висновків, згенерованих на базі фактичних сигналів.',
      },
      {
        id: 'super',
        label: 'Суперінтелект',
        path: '/super',
        icon: Brain,
        description: 'Експериментальний режим для високорівневої аналітичної координації.',
        badge: 'α',
      },
      {
        id: 'training',
        label: 'Тренування моделей',
        path: '/training',
        icon: Cpu,
        description: 'Контроль циклів тренування, задач, артефактів і помилок навчання.',
      },
      {
        id: 'engines',
        label: 'Двигуни',
        path: '/engines',
        icon: Cpu,
        description: 'Стан аналітичних двигунів, throughput, latency та деградації.',
      },
      {
        id: 'ai-control',
        label: 'Центр керування ШІ',
        path: '/admin/ai-control',
        icon: Zap,
        description: 'Адміністративне керування ШІ-контуром, політиками та обмеженнями.',
        roles: ['admin'],
      },
    ],
  },
  {
    id: 'factory',
    label: 'Фабрика',
    description: 'Компоненти, пайплайни, фабричні сценарії та системне складання рішень.',
    accent: 'amber',
    items: [
      {
        id: 'system-factory',
        label: 'Системна фабрика',
        path: '/system-factory',
        icon: Factory,
        description: 'Комплексне складання систем, контурів, модулів і їхнього стану.',
      },
      {
        id: 'factory-studio',
        label: 'Студія фабрики',
        path: '/factory-studio',
        icon: Wrench,
        description: 'Гнучка студія для побудови фабричних сценаріїв і пайплайнів.',
      },
      {
        id: 'pipeline',
        label: 'Пайплайни',
        path: '/pipeline',
        icon: Workflow,
        description: 'Запуск, контроль та аудит пайплайнів обробки та аналітики.',
      },
      {
        id: 'components',
        label: 'Компоненти',
        path: '/components',
        icon: Blocks,
        description: 'Реєстр компонентів, версій, статусів і сумісності модулів.',
      },
      {
        id: 'autonomy',
        label: 'Автономність',
        path: '/autonomy',
        icon: Zap,
        description: 'Адміністративний контур для автономних стратегій та правил роботи.',
        roles: ['admin'],
      },
    ],
  },
  {
    id: 'data-platform',
    label: 'Платформа даних',
    description: 'Інгестія, парсинг, датасети, сховище та експорт готових даних.',
    accent: 'sky',
    items: [
      {
        id: 'data',
        label: 'Сховище даних',
        path: '/data',
        icon: Database,
        description: 'Огляд структури даних, індексів, каталогів та готовності сховища.',
      },
      {
        id: 'ingestion',
        label: 'Завантаження',
        path: '/ingestion',
        icon: Upload,
        description: 'Завантаження джерел, файлів, потоків та стан конвеєрів інгестії.',
        matchPaths: ['/data-hub'],
      },
      {
        id: 'parsers',
        label: 'Парсери',
        path: '/parsers',
        icon: ScrollText,
        description: 'Контроль парсерів, конфігурацій, помилок і якості розбору джерел.',
      },
      {
        id: 'databases',
        label: 'Бази даних',
        path: '/databases',
        icon: Database,
        description: 'Огляд підключених БД, стану, обсягів та допоміжних сервісів.',
      },
      {
        id: 'datasets',
        label: 'Датасети',
        path: '/datasets',
        icon: Layers,
        description: 'Керування датасетами, версіями, джерелами і готовністю до моделей.',
        matchPaths: ['/datasets-manager'],
      },
      {
        id: 'export',
        label: 'Експорт',
        path: '/export',
        icon: Upload,
        description: 'Формування експортів, пакетів вивантаження та журналів передачі.',
      },
    ],
  },
  {
    id: 'administration',
    label: 'Адміністрування',
    description: 'Безпека, врядування, комплаєнс, деплоймент і системні налаштування.',
    accent: 'rose',
    items: [
      {
        id: 'governance',
        label: 'Суверенне врядування',
        path: '/governance',
        icon: Shield,
        description: 'Адміністративний центр політик, аудитів та суверенного контролю.',
        roles: ['admin'],
      },
      {
        id: 'security',
        label: 'Безпека',
        path: '/security',
        icon: Lock,
        description: 'Стан захисту, подій безпеки, журналів та критичних відхилень.',
      },
      {
        id: 'compliance',
        label: 'Комплаєнс',
        path: '/compliance',
        icon: Scale,
        description: 'Перевірка правил, обмежень, процедур та регуляторних вимог.',
      },
      {
        id: 'deployment',
        label: 'Деплоймент',
        path: '/deployment',
        icon: Globe,
        description: 'Стани середовищ, релізів, пайплайнів розгортання та синхронізації.',
      },
      {
        id: 'settings',
        label: 'Налаштування',
        path: '/settings',
        icon: Settings,
        description: 'Базові налаштування інтерфейсу, доступів і поведінки платформи.',
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

export const getVisibleNavigation = (role: string): NavSection[] =>
  navigationConfig
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.roles || item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0);

export const getNavigationTotals = (role: string): { items: number; sections: number } => {
  const sections = getVisibleNavigation(role);
  return {
    sections: sections.length,
    items: sections.reduce((total, section) => total + section.items.length, 0),
  };
};

export const getNavigationContext = (pathname: string, role: string): NavigationContext => {
  const sections = getVisibleNavigation(role);

  for (const section of sections) {
    for (const item of section.items) {
      if (item.path === pathname) {
        return { item, section };
      }
    }
  }

  for (const section of sections) {
    const sortedItems = [...section.items].sort((left, right) => right.path.length - left.path.length);
    const matchedItem = sortedItems.find((item) => itemMatchesPath(item, pathname));

    if (matchedItem) {
      return { item: matchedItem, section };
    }
  }

  return { item: null, section: null };
};
