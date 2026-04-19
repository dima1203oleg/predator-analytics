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
  User,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';


export type NavAccent =
  | 'gold'
  | 'amber'
  | 'warn'
  | 'slate'
  | 'blue'
  | 'indigo'
  | 'rose';

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
    badge: 'bg-rose-500/15 text-rose-500 border-rose-400/20',
    dot: 'bg-rose-500',
    glow: 'from-rose-600/20 via-rose-500/5 to-transparent',
    icon: 'text-rose-500',
    iconBorder: 'border-rose-400/25 bg-rose-500/10',
    sectionBorder: 'border-rose-400/15',
    softText: 'text-rose-400/90',
  },
  amber: {
    badge: 'bg-rose-600/15 text-rose-500 border-rose-500/20',
    dot: 'bg-rose-600',
    glow: 'from-rose-700/20 via-rose-600/5 to-transparent',
    icon: 'text-rose-600',
    iconBorder: 'border-rose-500/25 bg-rose-600/10',
    sectionBorder: 'border-rose-500/15',
    softText: 'text-rose-500/90',
  },
  warn: {
    badge: 'bg-rose-500/15 text-rose-400 border-rose-400/20',
    dot: 'bg-rose-500',
    glow: 'from-rose-600/20 via-rose-500/5 to-transparent',
    icon: 'text-rose-400',
    iconBorder: 'border-rose-400/25 bg-rose-500/10',
    sectionBorder: 'border-rose-400/15',
    softText: 'text-rose-400/90',
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
    badge: 'bg-rose-400/15 text-rose-300 border-rose-300/20',
    dot: 'bg-rose-400',
    glow: 'from-rose-500/20 via-rose-400/5 to-transparent',
    icon: 'text-rose-300',
    iconBorder: 'border-rose-300/25 bg-rose-400/10',
    sectionBorder: 'border-rose-300/15',
    softText: 'text-rose-300/90',
  },
  indigo: {
    badge: 'bg-rose-500/15 text-rose-400 border-rose-400/20',
    dot: 'bg-rose-500',
    glow: 'from-rose-600/20 via-rose-500/5 to-transparent',
    icon: 'text-rose-400',
    iconBorder: 'border-rose-400/25 bg-rose-500/10',
    sectionBorder: 'border-rose-400/15',
    softText: 'text-rose-400/90',
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
 * Канонічна бізнес-орієнтована навігація PREDATOR Analytics v58.2-WRAITH.
 * Шість логічних хабів для стратегічного контролю та розвідки.
 */
const baseNavigationConfig: NavSection[] = [
  {
    id: 'command',
    label: 'КОМАНДНИЙ ЦЕНТР',
    description: 'Рівень CEO: стратегічний контроль, P&L ризиків, ранковий брифінг.',
    outcome: 'Суверенне Командування: Повний 360° контроль над бізнес-периметром.',
    accent: 'gold',
    items: [
      {
        id: 'dashboard',
        label: 'Панель управління',
        path: '/command?tab=board',
        icon: LayoutDashboard,
        description: 'Головна точка входу з ROI-пульсом та швидкими переходами.',
        group: 'Управління',
        priority: 100,
      },
      {
        id: 'morning-brief',
        label: 'Ранковий брифінг',
        path: '/command?tab=brief',
        icon: Compass,
        description: 'Пріоритетний аналіз ризиків та цілей на день.',
        group: 'Управління',
        priority: 92,
      },
      {
        id: 'portfolio-risk',
        label: 'P&L Ризиків',
        path: '/command?tab=risk',
        icon: TrendingUp,
        description: 'Фінансовий стан портфелю у зоні ризику.',
        group: 'Управління',
        badge: 'ОНЛАЙН',
        priority: 99,
      },
      {
        id: 'war-room',
        label: 'Кризовий штаб',
        path: '/command?tab=warroom',
        icon: Target,
        description: 'Оперативний штаб для кризового управління.',
        group: 'Управління',
        badge: 'WRAITH',
        priority: 98,
      },
      {
        id: 'som',
        label: 'Суверенний Обсерватор',
        path: '/command?tab=observer',
        icon: Eye,
        description: 'Система пасивного спостереження за аномаліями.',
        group: 'Розвідка',
        priority: 85,
      },
      {
        id: 'newspaper',
        label: 'Ранкова газета',
        path: '/search?tab=newspaper',
        icon: Newspaper,
        description: 'Персоналізована щоденна аналітика.',
        group: 'Розвідка',
        priority: 84,
      },
      {
        id: 'clients',
        label: 'Портфель клієнтів',
        path: '/clients',
        icon: Users,
        description: 'Сегментація та аналіз клієнтської бази.',
        group: 'Портфель',
        priority: 80,
      },
    ],
  },
  {
    id: 'trade',
    label: 'ТОРГОВА РОЗВІДКА',
    description: 'Митниця, ціни, логістичні потоки та аналіз ринків.',
    outcome: 'Торгова Розвідка: Домінування на ринку через аналіз потоків.',
    accent: 'amber',
    items: [
      {
        id: 'market',
        label: 'Аналіз ринку',
        path: '/market',
        icon: TrendingUp,
        description: 'Огляд ЗЕД, декларацій та конкурентів.',
        group: 'Торгівля',
        priority: 90,
      },
      {
        id: 'customs-intel',
        label: 'Митна аналітика',
        path: '/market?tab=customs',
        icon: Shield,
        description: 'Аналіз декларацій та ризикових категорій.',
        group: 'Митниця',
        priority: 88,
      },
      {
        id: 'customs-premium',
        label: 'Митний ПРО',
        path: '/customs-premium',
        icon: Shield,
        description: 'Розширений митний контур аналізу.',
        group: 'Митниця',
        badge: 'ПРО',
        priority: 84,
      },
      {
        id: 'price-compare',
        label: 'Аудитор цін',
        path: '/market?tab=price',
        icon: BarChart3,
        description: 'Пошук демпінгу та цінових відхилень.',
        group: 'Торгівля',
        priority: 86,
      },
      {
        id: 'trade-map',
        label: 'Карта торгівлі',
        path: '/market?tab=flows',
        icon: Globe,
        description: 'Візуалізація міжнародних потоків.',
        group: 'Логістика',
        priority: 82,
      },
      {
        id: 'suppliers',
        label: 'Пошук постачальників',
        path: '/market?tab=suppliers',
        icon: Briefcase,
        description: 'Глобальний пошук та верифікація контрагентів.',
        group: 'Торгівля',
        priority: 80,
      },
      {
        id: 'cargo-manifest',
        label: 'Маніфести карго',
        path: '/cargo-manifest',
        icon: Box,
        description: 'Детальний аналіз транспортних накладних.',
        group: 'Логістика',
        priority: 78,
      },
      {
        id: 'supply-chain',
        label: 'Ланцюги постачання',
        path: '/supply-chain',
        icon: Layers,
        description: 'Аналіз вразливостей логістичних шляхів.',
        group: 'Логістика',
        priority: 76,
      },
      {
        id: 'maritime',
        label: 'Морська розвідка',
        path: '/maritime',
        icon: Ship,
        description: 'Відстеження суден та портової активності.',
        group: 'Логістика',
        priority: 74,
      },
      {
        id: 'tenders',
        label: 'Тендерний монітор',
        path: '/tenders',
        icon: FileText,
        description: 'Аналіз державних та комерційних закупівель.',
        group: 'Торгівля',
        priority: 72,
      },
      {
        id: 'geopolitical-radar',
        label: 'Геополітичний радар',
        path: '/geopolitical-radar',
        icon: Radar,
        description: 'Вплив глобальних подій на торгові шляхи.',
        group: 'Розвідка',
        badge: 'НОВИЙ',
        priority: 85,
      },
    ],
  },
  {
    id: 'entity',
    label: 'РОЗВІДКА СУБ\'ЄКТІВ',
    description: 'Due Diligence 360°, AML, санкції, UBO та зв\'язки.',
    outcome: 'Розвідка Об\'єктів: Повний профіль будь-якого контрагента.',
    accent: 'warn',
    items: [
      {
        id: 'search',
        label: 'Пошуковий центр',
        path: '/search?tab=global',
        icon: Search,
        description: 'Гібридний пошук по реєстрах та джерелах.',
        group: 'Розвідка',
        priority: 86,
      },
      {
        id: 'diligence',
        label: 'Персональне досьє',
        path: '/osint?tab=diligence',
        icon: User,
        description: 'Повний профіль компанії та аналіз зв\'язків.',
        group: 'Розвідка',
        priority: 91,
      },
      {
        id: 'ubo-map',
        label: 'Трекер бенефіціарів',
        path: '/osint?tab=ubo',
        icon: Network,
        description: 'Бенефіціарна структура та публічні особи.',
        group: 'Розвідка',
        badge: 'WRAITH',
        priority: 97,
      },
      {
        id: 'graph',
        label: 'Граф зв\'язків',
        path: '/osint?tab=graph',
        icon: Network,
        description: 'Візуальний аналіз кластерів та бенефіціарів.',
        group: 'Розвідка',
        priority: 95,
      },
      {
        id: 'sanctions',
        label: 'Санкційний комплаєнс',
        path: '/osint?tab=sanctions',
        icon: ShieldX,
        description: 'Перевірка по міжнародних та локальних списках.',
        group: 'Комплаєнс',
        priority: 94,
      },
      {
        id: 'risk-scoring',
        label: 'Ризик-скоринг',
        path: '/risk-scoring',
        icon: Target,
        description: 'Комплексна оцінка надійності суб\'єктів.',
        group: 'Розвідка',
        priority: 93,
      },
      {
        id: 'aml',
        label: 'AML Аналізатор',
        path: '/financial?tab=aml',
        icon: Scale,
        description: 'Виявлення схем відмивання коштів.',
        group: 'Комплаєнс',
        priority: 92,
      },

      {
        id: 'registries',
        label: 'Центр реєстрів',
        path: '/search?tab=registries',
        icon: Database,
        description: 'Прямий доступ до державних баз даних.',
        group: 'Дані',
        priority: 82,
      },
      {
        id: 'power-structure',
        label: 'Структури влади',
        path: '/power-structure',
        icon: Landmark,
        description: 'Аналіз впливу та політичних зв\'язків.',
        group: 'Розвідка',
        priority: 81,
      },
      {
        id: 'compliance',
        label: 'Комплаєнс-контроль',
        path: '/compliance',
        icon: Shield,
        description: 'Перевірка відповідності внутрішнім політикам.',
        group: 'Комплаєнс',
        priority: 75,
      },
    ],
  },
  {
    id: 'financial',
    label: 'ФІНАНСОВА РОЗВІДКА',
    description: 'Моніторинг транзакцій, офшорів та активів.',
    outcome: 'Фінансова Розвідка: Виявлення незаконних фінансових потоків.',
    accent: 'rose',
    items: [
      {
        id: 'financial-hub',
        label: 'Консолідований хаб',
        path: '/financial',
        icon: Landmark,
        description: 'Єдиний центр управління фінансовою розвідкою.',
        group: 'Управління',
        priority: 100,
      },
      {
        id: 'swift-monitor',
        label: 'Транзакційний монітор',
        path: '/financial?tab=swift',
        icon: Activity,
        description: 'Аналіз транзакцій у реальному часі.',
        group: 'Фінанси',
        badge: 'ОНЛАЙН',
        priority: 98,
      },
      {
        id: 'offshore-detector',
        label: 'Офшорний детектор',
        path: '/financial?tab=offshore',
        icon: Globe,
        description: 'Виявлення підставних компаній та прихованих активів.',
        group: 'Фінанси',
        priority: 97,
      },
      {
        id: 'aml-radar',
        label: 'AML Радар',
        path: '/financial?tab=aml',
        icon: ShieldCheck,
        description: 'Виявлення схем відмивання коштів.',
        group: 'Фінанси',
        priority: 92,
      },
      {
        id: 'asset-freeze-tracker',
        label: 'Трекер активів',
        path: '/financial?tab=assets',
        icon: Lock,
        description: 'Моніторинг заморожених та ризикових активів.',
        group: 'Фінанси',
        priority: 88,
      },

    ],
  },
  {
    id: 'ai',
    label: 'AI НЕКСУС',
    description: 'Автономні агенти, гіпотези та предиктивна аналітика.',
    outcome: 'ШІ-Інтелект: Синтетичні інсайти випередження.',
    accent: 'blue',
    items: [
      {
        id: 'nexus',
        label: 'Предиктивний Нексус',
        path: '/nexus',
        icon: BrainCircuit,
        description: 'Центр предиктивного моделювання та сценаріїв.',
        group: 'ШІ Когніція',
        badge: 'WRAITH',
        priority: 100,
      },
      {
        id: 'oracle',
        label: 'Суверенний Оракул',
        path: '/nexus?tab=oracle',
        icon: Sparkles,
        description: 'Запит до Lead Architect для генеративного синтезу.',
        group: 'ШІ Когніція',
        priority: 95,
      },
      {
        id: 'ai-hypothesis',
        label: 'Генератор гіпотез',
        path: '/nexus?tab=hypothesis',
        icon: FlaskConical,
        description: 'Автоматична генерація слідчих гіпотез.',
        group: 'ШІ Когніція',
        priority: 89,
      },
      {
        id: 'agents',
        label: 'Автономні агенти',
        path: '/nexus?tab=agents',
        icon: Users,
        description: 'Керування автономними ШІ-співробітниками.',
        group: 'ШІ Когніція',
        priority: 88,
      },
      {
        id: 'ai-insights',
        label: 'ШІ-інсайти',
        path: '/nexus?tab=insights',
        icon: Zap,
        description: 'Добірка висновків на базі сигналів.',
        group: 'ШІ Когніція',
        priority: 86,
      },
      {
        id: 'conversation-intel',
        label: 'Аналіз смислів',
        path: '/conversation-intel',
        icon: Radio,
        description: 'Аналіз неструктурованих даних та комунікацій.',
        group: 'ШІ Когніція',
        priority: 82,
      },
      {
        id: 'knowledge',
        label: 'База знань',
        path: '/nexus?tab=knowledge',
        icon: Database,
        description: 'Актуалізація знань для ШІ-моделей.',
        group: 'ШІ Когніція',
        priority: 74,
      },
    ],
  },
  {
    id: 'system',
    label: 'СИСТЕМНЕ ЯДРО',
    description: 'Безпека, пайплайни даних та моніторинг інфраструктури.',
    outcome: 'Центр Управління: Прозорість та надійність платформи.',
    accent: 'slate',
    items: [
      {
        id: 'ingestion',
        label: 'Кузня Даних',
        path: '/system?tab=ingestion',
        icon: Upload,
        description: 'Пайплайни інгестії та обробки джерел.',
        group: 'Інфраструктура',
        roles: ['admin'],
        priority: 99,
      },
      {
        id: 'monitoring',
        label: 'Моніторинг',
        path: '/system?tab=monitoring',
        icon: Activity,
        description: 'Технічний стан сервісів та вузлів.',
        group: 'Інфраструктура',
        priority: 82,
      },
      {
        id: 'monitoring-realtime',
        label: 'Моніторинг реального часу',
        path: '/monitoring/realtime',
        icon: Radio,
        description: 'Потокові метрики в реальному часі.',
        group: 'Інфраструктура',
        roles: ['admin'],
        priority: 81,
      },
      {
        id: 'security',
        label: 'Безпека та Доступ',
        path: '/system?tab=security',
        icon: Lock,
        description: 'Контроль периметру та прав доступу.',
        group: 'Керування',
        roles: ['admin'],
        priority: 72,
      },
      {
        id: 'deployment',
        label: 'Розгортання',
        path: '/system?tab=deployment',
        icon: Box,
        description: 'Керування розгортанням сервісів платформи.',
        group: 'Інфраструктура',
        roles: ['admin'],
        priority: 85,
      },
      {
        id: 'governance',
        label: 'Управління (G&C)',
        path: '/system?tab=governance',
        icon: Shield,
        description: 'Суверенне управління: етичні та юридичні рамки.',
        group: 'Керування',
        roles: ['admin'],
        priority: 95,
      },
      {
        id: 'system-factory',
        label: 'Фабрика Систем',
        path: '/system?tab=factory',
        icon: Factory,
        description: 'Генерація нових модулів та сервісів.',
        group: 'Інфраструктура',
        roles: ['admin'],
        priority: 90,
      },
      {
        id: 'factory-studio',
        label: 'Студія Фабрикації',
        path: '/factory-studio',
        icon: Zap,
        description: 'Розробка та налагодження автономних агентів.',
        group: 'Інфраструктура',
        roles: ['admin'],
        priority: 89,
      },
      {
        id: 'datasets',
        label: 'Студія датасетів',
        path: '/datasets',
        icon: Database,
        description: 'Управління тренувальними даними.',
        group: 'Інфраструктура',
        roles: ['admin'],
        priority: 88,
      },
      {
        id: 'ai-control',
        label: 'Контроль ШІ-моделей',
        path: '/admin/ai-control',
        icon: Zap,
        description: 'Низькорівневий контроль та налаштування ШІ.',
        group: 'Інфраструктура',
        roles: ['admin'],
        priority: 92,
      },
      {
        id: 'components',
        label: 'Реєстр компонентів',
        path: '/components',
        icon: Layers,
        description: 'Бібліотека візуальних компонентів WRAITH.',
        group: 'Розробка',
        roles: ['admin'],
        priority: 65,
      },
      {
        id: 'api-docs',
        label: 'API Документація',
        path: '/api-docs',
        icon: FileText,
        description: 'Інтеграційні протоколи для зовнішніх систем.',
        group: 'Розробка',
        priority: 60,
      },
      {
        id: 'reports',
        label: 'Конструктор звітів',
        path: '/reports',
        icon: FileText,
        description: 'Створення кастомних аналітичних звітів.',
        group: 'Керування',
        priority: 70,
      },
      {
        id: 'settings',
        label: 'Налаштування',
        path: '/settings',
        icon: Settings,
        description: 'Конфігурація поведінки платформи.',
        group: 'Керування',
        priority: 68,
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
