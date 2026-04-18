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
  Radio,
  Ship,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Upload,
  Users,
  Zap,
  ShieldX,
  Fingerprint,
  type LucideIcon,
} from 'lucide-react';

export type NavAccent =
  | 'gold'
  | 'amber'
  | 'warn'
  | 'slate';

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
  gold: {
    badge: 'bg-yellow-500/15 text-yellow-500 border-yellow-400/20',
    dot: 'bg-yellow-500',
    glow: 'from-yellow-600/20 via-yellow-500/5 to-transparent',
    icon: 'text-yellow-500',
    iconBorder: 'border-yellow-400/25 bg-yellow-500/10',
    sectionBorder: 'border-yellow-400/15',
    softText: 'text-yellow-400/90',
  },
  amber: {
    badge: 'bg-amber-500/15 text-amber-500 border-amber-400/20',
    dot: 'bg-amber-500',
    glow: 'from-amber-600/20 via-amber-500/5 to-transparent',
    icon: 'text-amber-500',
    iconBorder: 'border-amber-400/25 bg-amber-500/10',
    sectionBorder: 'border-amber-400/15',
    softText: 'text-amber-400/90',
  },
  warn: {
    badge: 'bg-orange-500/15 text-orange-500 border-orange-400/20',
    dot: 'bg-orange-600',
    glow: 'from-orange-600/20 via-orange-500/5 to-transparent',
    icon: 'text-orange-500',
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
 * Канонічна бізнес-орієнтована навігація PREDATOR Analytics v57.2-WRAITH OSINT-HUB.
 * Шість верхніх блоків зберігають попередні модулі, але прибирають перевантаження на рівні головних секцій.
 */
const baseNavigationConfig: NavSection[] = [
  {
    id: 'command',
    label: 'КОМАНДНИЙ ЦЕНТР',
    description: 'CEO-рівень: стратегічний контроль, P&L ризиків, ранковий брифінг, оперативний пульс.',
    outcome: 'Sovereign Command: Повний 360° контроль над бізнес-периметром за 3 секунди.',
    accent: 'gold',
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
        label: 'Стратегічний брифінг v58.2-WRAITH',
        path: '/morning-brief',
        icon: Compass,
        description: 'Пріоритетний аналіз суверенних ризиків, ринкових аномалій та критичних цілей на день.',
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
      {
        id: 'portfolio-risk',
        label: 'P&L Ризиків Портфелю',
        path: '/portfolio-risk',
        icon: TrendingUp,
        description: 'Скільки $ у зоні ризику прямо зараз: контрагенти, ланцюги, санкції.',
        group: 'Оперативний огляд',
        badge: 'LIVE',
        priority: 99,
      },
      {
        id: 'geopolitical-radar',
        label: 'Геополітичний Сейсмограф',
        path: '/geopolitical-radar',
        icon: Globe,
        description: 'Тренди по країнах: санкції, ескалації, конфлікти, ризики для ланцюгів.',
        group: 'Оперативний огляд',
        priority: 91,
      },
    ],
  },
  {
    id: 'intelligence',
    label: 'РОЗВІДКА КОНТРАГЕНТІВ',
    description: 'Due Diligence 360°, AML, санкції, UBO-структура, досьє компаній і персон.',
    outcome: 'Total Intelligence: Повна картина будь-якого контрагента за 30 секунд — для M&A, закупівель, безпеки.',
    accent: 'gold',
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
        id: 'zrada-control',
        label: 'Зрада-Контроль',
        path: '/zrada-control',
        icon: ShieldX,
        description: 'Преміальний контур виявлення та моніторингу субʼєктів із високим ризиком зради.',
        group: 'OSINT та розслідування',
        badge: 'v58.2-WRAITH',
        priority: 95,
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
      {
        id: 'ubo-map',
        label: 'Бенефіціарна карта (UBO)',
        path: '/ubo-map',
        icon: Network,
        description: 'Граф кінцевих бенефіціарів: хто реально контролює компанію через ланцюги власності.',
        group: 'OSINT та розслідування',
        badge: 'NEW',
        priority: 97,
        audiences: ['analyst', 'admin', 'business'],
      },
      {
        id: 'pep-tracker',
        label: 'PEP-Трекер',
        path: '/pep-tracker',
        icon: Fingerprint,
        description: 'Politically Exposed Persons: керівники, посадовці, їх родичі — ризики та зв\'язки.',
        group: 'OSINT та розслідування',
        badge: 'NEW',
        priority: 96,
        audiences: ['analyst', 'admin', 'business'],
      },
      {
        id: 'shadow-director',
        label: 'Shadow Director Detector',
        path: '/shadow-director',
        icon: Eye,
        description: 'Виявлення прихованого контролю: хто реально керує компанією без формального статусу.',
        group: 'OSINT та розслідування',
        badge: 'NEW',
        priority: 95,
        audiences: ['analyst', 'admin'],
      },
    ],
  },
  {
    id: 'financial-sigint',
    label: 'ФІНАНСОВА РОЗВІДКА',
    description: 'SWIFT-перехват, офшорні структури, транзакційні аномалії, банківські ризики.',
    outcome: 'Financial SIGINT: Виявлення незаконних фінансових потоків та захист активів.',
    accent: 'amber',
    items: [
      {
        id: 'swift-monitor',
        label: 'SWIFT/SEPA Монітор',
        path: '/swift-monitor',
        icon: Activity,
        description: 'Підозрілі транзакції в реальному часі — аномальні суми, маршрути, частота.',
        group: 'Транзакційна розвідка',
        badge: 'LIVE',
        priority: 98,
      },
      {
        id: 'offshore-detector',
        label: 'Офшорний Детектор',
        path: '/offshore-detector',
        icon: Globe,
        description: 'BVI/Кіпр/ОАЕ/Белізнесен shell companies сканер з автоматичним групуванням.',
        group: 'Транзакційна розвідка',
        badge: 'NEW',
        priority: 97,
      },
      {
        id: 'financial-sigint-view',
        label: 'Фінансова Розвідка',
        path: '/financial-sigint',
        icon: TrendingUp,
        description: 'Комплексний модуль: рух капіталу, структури, ризики, санкції в єдиному view.',
        group: 'Транзакційна розвідка',
        priority: 96,
      },
      {
        id: 'contract-price-check',
        label: 'Аудит цін договорів',
        path: '/contract-price-check',
        icon: BarChart3,
        description: 'Порівняння цін контрактів з ринковими даними — виявлення накруток та відкатів.',
        group: 'Транзакційна розвідка',
        priority: 90,
      },
      {
        id: 'asset-freeze-tracker',
        label: 'Трекер заморожених активів',
        path: '/asset-freeze-tracker',
        icon: Lock,
        description: 'Поточний статус заблокованих рахунків, активів та причини блокувань.',
        group: 'Санкції та блокування',
        priority: 88,
        audiences: ['analyst', 'admin'],
      },
    ],
  },
  {
    id: 'trade-logistics',
    label: 'ЛАНЦЮГИ ПОСТАЧАННЯ',
    description: 'Митниця, ціни, логістичні потоки, Digital Twins ланцюгів постачання.',
    outcome: 'Supply Chain Mastery: Видимість кожного вузла ланцюга — від виробника до покупця.',
    accent: 'amber',
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
    label: 'БІЗНЕС-МОЖЛИВОСТІ',
    description: 'M&A Scanner, конкурентна розвідка, тендери, ринкові можливості, клієнти, постачальники.',
    outcome: 'Business Growth Intel: Перші побачити можливість — перші зайняти позицію.',
    accent: 'gold',
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
        group: 'Бізнес-розвиток',
        priority: 68,
      },
      {
        id: 'ma-scanner',
        label: 'M&A Target Scanner',
        path: '/ma-scanner',
        icon: Target,
        description: 'Компанії у фінансових труднощах — можливість поглинання, партнерства, купівлі активів.',
        group: 'Бізнес-розвиток',
        badge: 'NEW',
        priority: 93,
      },
      {
        id: 'market-entry',
        label: 'Market Entry Score',
        path: '/market-entry',
        icon: Globe,
        description: 'Оцінка ринку по країнах/секторах: можливості, конкуренція, регуляторні ризики.',
        group: 'Бізнес-розвиток',
        badge: 'NEW',
        priority: 91,
      },
    ],
  },
  {
    id: 'ai-automation',
    label: 'ШІ-ЛАБОРАТОРІЯ',
    description: 'Sovereign AI: автономні агенти, hypothesis engine, предиктивний nexus, звіти.',
    outcome: 'AI-First Intelligence: Synthetic insights що замінюють 10 аналітиків — за секунди.',
    accent: 'amber',
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
        id: 'nexus',
        label: 'Предиктивний Нексус',
        path: '/nexus',
        icon: Sparkles,
        description: 'Центр предиктивного моделювання: сценарії, прогнози та випереджаючі інсайти.',
        group: 'Користувацький контур',
        badge: 'v58.2-WRAITH_PREDICTIVE',
        priority: 100,
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
      {
        id: 'ai-hypothesis',
        label: 'Hypothesis Engine',
        path: '/ai-hypothesis',
        icon: Sparkles,
        description: 'Автоматична генерація слідчих гіпотез на базі аномалій і патернів у даних.',
        group: 'Автономний контур',
        badge: 'NEW',
        priority: 89,
        audiences: ['analyst', 'admin'],
      },
      {
        id: 'conversation-intel',
        label: 'Conversation Intel',
        path: '/conversation-intel',
        icon: Radio,
        description: 'Аналіз відкритих комунікацій: Telegram, форуми, медіа — виявлення сигналів.',
        group: 'Автономний контур',
        badge: 'NEW',
        priority: 87,
        audiences: ['analyst', 'admin'],
      },
    ],
  },
  {
    id: 'system',
    label: 'МІСІЯ-КОНТРОЛЬ',
    description: 'Безпека, комплаєнс, пайплайни, деплоймент — адміністративне ядро платформи.',
    outcome: 'Mission Control: Прозорий стан кожного компонента системи в режимі реального часу.',
    accent: 'slate',
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
