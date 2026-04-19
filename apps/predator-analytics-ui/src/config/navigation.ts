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
  | 'slate'
  | 'blue';

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
  blue: {
    badge: 'bg-blue-500/15 text-blue-400 border-blue-400/20',
    dot: 'bg-blue-500',
    glow: 'from-blue-600/20 via-blue-500/5 to-transparent',
    icon: 'text-blue-400',
    iconBorder: 'border-blue-400/25 bg-blue-500/10',
    sectionBorder: 'border-blue-400/15',
    softText: 'text-blue-400/90',
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
    description: 'CEO-рівень: стратегічний контроль, P&L ризиків, ранковий брифінг.',
    outcome: 'Sovereign Command: Повний 360° контроль над бізнес-периметром.',
    accent: 'gold',
    items: [
      {
        id: 'dashboard',
        label: 'Панель управління',
        path: '/',
        icon: LayoutDashboard,
        description: 'Головна точка входу з ROI-пульсом та швидкими переходами.',
        group: 'Управління',
        priority: 100,
      },
      {
        id: 'morning-brief',
        label: 'Ранковий брифінг',
        path: '/morning-brief',
        icon: Compass,
        description: 'Пріоритетний аналіз ризиків та цілей на день.',
        group: 'Управління',
        priority: 92,
      },
      {
        id: 'portfolio-risk',
        label: 'P&L Ризиків',
        path: '/portfolio-risk',
        icon: TrendingUp,
        description: 'Фінансовий стан портфелю у зоні ризику.',
        group: 'Управління',
        badge: 'LIVE',
        priority: 99,
      },
      {
        id: 'newspaper',
        label: 'Ранкова газета',
        path: '/newspaper',
        icon: Newspaper,
        description: 'Персоналізована щоденна аналітика.',
        group: 'Управління',
        priority: 84,
      },
    ],
  },
  {
    id: 'trade',
    label: 'ТОРГОВА РОЗВІДКА',
    description: 'Митниця, ціни, логістичні потоки та аналіз ринків.',
    outcome: 'Trade Intelligence: Домінування на ринку через аналіз потоків.',
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
        path: '/customs-intel',
        icon: Shield,
        description: 'Аналіз декларацій та ризикових категорій.',
        group: 'Торгівля',
        priority: 88,
      },
      {
        id: 'customs-premium',
        label: 'Митний ПРО',
        path: '/customs-premium',
        icon: Shield,
        description: 'Розширений митний контур аналізу.',
        group: 'Торгівля',
        badge: 'ПРО',
        priority: 84,
      },
      {
        id: 'price-compare',
        label: 'Аудитор цін',
        path: '/price-compare',
        icon: BarChart3,
        description: 'Пошук демпінгу та цінових відхилень.',
        group: 'Торгівля',
        priority: 86,
      },
      {
        id: 'trade-map',
        label: 'Карта торгівлі',
        path: '/trade-map',
        icon: Globe,
        description: 'Візуалізація міжнародних потоків.',
        group: 'Торгівля',
        priority: 82,
      },
    ],
  },
  {
    id: 'entity',
    label: 'РОЗВІДКА СУБ\'ЄКТІВ',
    description: 'Due Diligence 360°, AML, санкції, UBO та зв\'язки.',
    outcome: 'Entity Intelligence: Повний профіль будь-якого контрагента.',
    accent: 'gold',
    items: [
      {
        id: 'search',
        label: 'Пошуковий центр',
        path: '/search',
        icon: Search,
        description: 'Гібридний пошук по реєстрах та джерелах.',
        group: 'Розвідка',
        priority: 86,
      },
      {
        id: 'diligence',
        label: 'Персональне досьє',
        path: '/diligence',
        icon: Search,
        description: 'Повний профіль компанії та аналіз зв\'язків.',
        group: 'Розвідка',
        priority: 91,
      },
      {
        id: 'ubo-map',
        label: 'UBO / PEP Трекер',
        path: '/ubo-map',
        icon: Network,
        description: 'Бенефіціарна структура та публічні особи.',
        group: 'Розвідка',
        badge: 'WRAITH',
        priority: 97,
      },
      {
        id: 'graph',
        label: 'Граф зв\'язків',
        path: '/graph',
        icon: Network,
        description: 'Візуальний аналіз кластерів та бенефіціарів.',
        group: 'Розвідка',
        priority: 95,
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
    ],
  },
  {
    id: 'financial',
    label: 'ФІНАНСОВА РОЗВІДКА',
    description: 'Моніторинг транзакцій, офшорів та активів.',
    outcome: 'Financial SIGINT: Виявлення незаконних фінансових потоків.',
    accent: 'amber',
    items: [
      {
        id: 'swift-monitor',
        label: 'Транзакційний монітор',
        path: '/swift-monitor',
        icon: Activity,
        description: 'Аналіз SWIFT/SEPA потоків у реальному часі.',
        group: 'Фінанси',
        badge: 'LIVE',
        priority: 98,
      },
      {
        id: 'offshore-detector',
        label: 'Офшорний детектор',
        path: '/offshore-detector',
        icon: Globe,
        description: 'Виявлення shell-компанй та прихованих активів.',
        group: 'Фінанси',
        priority: 97,
      },
      {
        id: 'asset-freeze-tracker',
        label: 'Трекер активів',
        path: '/asset-freeze-tracker',
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
    outcome: 'AI-First Intelligence: Синтетичні інсайти випередження.',
    accent: 'blue',
    items: [
      {
        id: 'nexus',
        label: 'Предиктивний Нексус',
        path: '/nexus',
        icon: Sparkles,
        description: 'Центр предиктивного моделювання та сценаріїв.',
        group: 'ШІ Когніція',
        badge: 'WRAITH',
        priority: 100,
      },
      {
        id: 'agents',
        label: 'Автономні агенти',
        path: '/agents',
        icon: Users,
        description: 'Керування автономними ШІ-співробітниками.',
        group: 'ШІ Когніція',
        priority: 88,
      },
      {
        id: 'ai-hypothesis',
        label: 'Hypothesis Engine',
        path: '/ai-hypothesis',
        icon: Sparkles,
        description: 'Автоматична генерація слідчих гіпотез.',
        group: 'ШІ Когніція',
        priority: 89,
      },
      {
        id: 'ai-insights',
        label: 'ШІ-інсайти',
        path: '/ai-insights',
        icon: Zap,
        description: 'Добірка висновків на базі сигналів.',
        group: 'ШІ Когніція',
        priority: 86,
      },
      {
        id: 'knowledge',
        label: 'База знань',
        path: '/knowledge',
        icon: BrainCircuit,
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
    outcome: 'Mission Control: Прозорість та надійність платформи.',
    accent: 'slate',
    items: [
      {
        id: 'ingestion',
        label: 'Data Forge',
        path: '/ingestion',
        icon: Upload,
        description: 'Пайплайни інгестії та обробки джерел.',
        group: 'Інфраструктура',
        roles: ['admin'],
      },
      {
        id: 'monitoring',
        label: 'Моніторинг',
        path: '/monitoring',
        icon: Activity,
        description: 'Технічний стан сервісів та вузлів.',
        group: 'Інфраструктура',
        priority: 82,
      },
      {
        id: 'security',
        label: 'Безпека та Доступ',
        path: '/security',
        icon: Lock,
        description: 'Контроль периметру та прав доступу.',
        group: 'Керування',
        priority: 72,
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
];ція, регуляторні ризики.',
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
