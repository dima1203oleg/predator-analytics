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
  // 1. КОМАНДНЕ КЕРІВНИЦТВО (sky)
  // ══════════════════════════════════════════════════════════════
  {
    id: 'executive',
    label: 'КОМАНДНЕ КЕРІВНИЦТВО',
    description: 'Стратегічний рівень: рішення, ризики, брифінги та ситуаційна обізнаність.',
    outcome: 'Повний 360° контроль над бізнес-периметром.',
    accent: 'sky',
    groups: [
      {
        title: 'Командування',
        audiences: ['terminal', 'pro', 'sovereign'],
        items: [
          {
            id: 'dashboard',
            label: 'Виконавча Рада',
            path: '/command?tab=board',
            icon: LayoutDashboard,
            description: 'Головна точка входу: ROI-пульс, KPI, швидкі переходи.',
            group: 'Командування',
            audiences: ['terminal', 'pro', 'sovereign'],
            priority: 100,
          },
          {
            id: 'morning-brief',
            label: 'Ранковий Брифінг',
            path: '/command?tab=brief',
            icon: Compass,
            description: 'Пріоритетний аналіз ризиків та цілей на поточний день.',
            group: 'Командування',
            audiences: ['terminal', 'pro', 'sovereign'],
            priority: 92,
          },
          {
            id: 'newspaper',
            label: 'Ранкова Газета',
            path: '/search?tab=newspaper',
            icon: Newspaper,
            description: 'Персоналізована щоденна аналітика ринку.',
            group: 'Командування',
            audiences: ['terminal', 'pro', 'sovereign'],
            priority: 84,
          },
        ],
      },
      {
        title: 'Оперативний Штаб',
        audiences: ['terminal', 'pro', 'sovereign'],
        items: [
          {
            id: 'war-room',
            label: 'Ситуаційна Кімната',
            path: '/command?tab=warroom',
            icon: Target,
            description: 'Оперативний штаб для кризового управління та ескалацій.',
            group: 'Оперативний Штаб',
            badge: 'ОНЛАЙН',
            audiences: ['pro', 'sovereign'],
            priority: 98,
          },
          {
            id: 'portfolio-risk',
            label: 'Портфельний Ризик',
            path: '/command?tab=risk',
            icon: TrendingUp,
            description: 'Агрегований фінансовий ризик портфелю клієнтів',
            group: 'Оперативний Штаб',
            badge: 'ОНЛАЙН',
            audiences: ['terminal', 'pro', 'sovereign'],
            priority: 99,
          },
          {
            id: 'alert-center',
            label: 'Центр Сповіщень',
            path: '/alerts',
            icon: AlertTriangle,
            description: 'Консолідований центр системних та аналітичних алертів.',
            group: 'Оперативний Штаб',
            badge: 'НОВЕ',
            audiences: ['pro', 'sovereign'],
            priority: 97,
          },
          {
            id: 'decisions',
            label: 'Журнал Рішень',
            path: '/decisions',
            icon: History,
            description: 'WORM-журнал прийнятих рішень з прив\'язкою до кейсів.',
            group: 'Оперативний Штаб',
            audiences: ['pro', 'sovereign'],
            priority: 88,
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // 2. ГЛОБАЛЬНА РОЗВІДКА (amber)
  // ══════════════════════════════════════════════════════════════
  {
    id: 'intelligence',
    label: 'ГЛОБАЛЬНА РОЗВІДКА',
    description: 'Митниця, ціни, логістичні потоки та аналіз ринків.',
    outcome: 'Торгова розвідка: домінування через аналіз потоків.',
    accent: 'amber',
    groups: [
      {
        title: 'Пошук та Ідентифікація',
        audiences: ['terminal', 'pro', 'sovereign'],
        items: [
          {
            id: 'search',
            label: 'Універсальний Пошук',
            path: '/search?tab=global',
            icon: Search,
            description: 'Синаптичний пошук по всіх реєстрах та базах.',
            group: 'Пошук та Ідентифікація',
            audiences: ['terminal', 'pro', 'sovereign'],
            priority: 86,
          },
          {
            id: 'registries',
            label: 'Державні та Комерційні Реєстри',
            path: '/search?tab=registries',
            icon: Database,
            description: 'Прямий доступ до відкритих та закритих баз даних.',
            group: 'Пошук та Ідентифікація',
            audiences: ['pro', 'sovereign'],
            priority: 82,
          },
          {
            id: 'entity-resolver',
            label: 'Ідентифікатор Сутностей',
            path: '/entity-resolver',
            icon: Fingerprint,
            description: 'Де-дублікація та злиття записів з confidence score.',
            group: 'Пошук та Ідентифікація',
            badge: 'НОВЕ',
            audiences: ['pro', 'sovereign'],
            priority: 81,
          },
        ],
      },
      {
        title: 'Ринок та Логістика',
        audiences: ['terminal', 'pro', 'sovereign'],
        items: [
          {
            id: 'market',
            label: 'Огляд Ринку',
            path: '/market?tab=overview',
            icon: TrendingUp,
            description: 'Загальна аналітика зовнішньоекономічної діяльності.',
            group: 'Ринок та Логістика',
            audiences: ['terminal', 'pro', 'sovereign'],
            priority: 90,
          },
          {
            id: 'price-compare',
            label: 'Прайс-Аудитор',
            path: '/market?tab=price',
            icon: BarChart3,
            description: 'Контроль цін та виявлення демпінгу.',
            group: 'Ринок та Логістика',
            audiences: ['pro', 'sovereign'],
            priority: 86,
          },
          {
            id: 'geopolitical-radar',
            label: 'Геополітичний Радар',
            path: '/geopolitical-radar',
            icon: Radar,
            description: 'Вплив світових подій на торговельну стабільність.',
            group: 'Ринок та Логістика',
            badge: 'ЕЛІТ',
            audiences: ['sovereign'],
            priority: 85,
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // 3. РИЗИКИ ТА КОМПЛАЄНС (rose)
  // ══════════════════════════════════════════════════════════════
  {
    id: 'analytics',
    label: 'РИЗИКИ ТА КОМПЛАЄНС',
    description: 'Due Diligence 360°, AML, санкції, UBO та зв\'язки.',
    outcome: 'Повний профіль будь-якого контрагента.',
    accent: 'rose',
    groups: [
      {
        title: 'Перевірка Суб\'єктів',
        audiences: ['terminal', 'pro', 'sovereign'],
        items: [
          {
            id: 'osint-diligence',
            label: 'Персональне Досьє',
            path: '/osint?tab=diligence',
            icon: User,
            description: 'Повний KYC/KYB аудит та профіль ризиків суб\'єкта.',
            group: 'Перевірка Суб\'єктів',
            audiences: ['terminal', 'pro', 'sovereign'],
            priority: 91,
          },
          {
            id: 'ubo-map',
            label: 'Карта Бенефіціарів',
            path: '/osint?tab=ubo',
            icon: Network,
            description: 'Візуалізація кінцевих власників та структур впливу.',
            group: 'Перевірка Суб\'єктів',
            badge: 'ЕЛІТ',
            audiences: ['pro', 'sovereign'],
            priority: 97,
          },
          {
            id: 'graph',
            label: 'Архітектура Зв\'язків',
            path: '/osint?tab=graph',
            icon: Network,
            description: 'Аналіз прихованих зв\'язків та аномальних кластерів.',
            group: 'Перевірка Суб\'єктів',
            audiences: ['pro', 'sovereign'],
            priority: 95,
          },
        ],
      },
      {
        title: 'Фінансовий Комплаєнс',
        audiences: ['terminal', 'pro', 'sovereign'],
        items: [
          {
            id: 'sanctions',
            label: 'Радар Санкцій та PEP',
            path: '/osint?tab=sanctions',
            icon: ShieldX,
            description: 'Скринінг на санкційні списки та PEP-осіб.',
            group: 'Фінансовий Комплаєнс',
            audiences: ['terminal', 'pro', 'sovereign'],
            priority: 94,
          },
          {
            id: 'aml-radar',
            label: 'AML Моніторинг',
            path: '/financial?tab=aml',
            icon: ShieldCheck,
            description: 'Система виявлення схем відмивання коштів.',
            group: 'Фінансовий Комплаєнс',
            audiences: ['pro', 'sovereign'],
            priority: 92,
          },
          {
            id: 'swift-monitor',
            label: 'Транзакційний Монітор',
            path: '/financial?tab=swift',
            icon: Activity,
            description: 'Аналіз грошових переказів у реальному часі.',
            group: 'Фінансовий Комплаєнс',
            badge: 'ОНЛАЙН',
            audiences: ['sovereign'],
            priority: 90,
          },
          {
            id: 'offshore-detector',
            label: 'Офшорний Детектор',
            path: '/financial?tab=offshore',
            icon: Globe,
            description: 'Виявлення підставних компаній та прихованих активів.',
            group: 'Фінансовий Комплаєнс',
            audiences: ['pro', 'sovereign'],
            priority: 88,
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // 4. РОЗСЛІДУВАННЯ (indigo)
  // ══════════════════════════════════════════════════════════════
  {
    id: 'investigation',
    label: 'РОЗСЛІДУВАННЯ',
    description: 'Кейси, хронологія подій, структури влади та спостереження.',
    outcome: 'Структуроване розслідування від сигналу до рішення.',
    accent: 'indigo',
    groups: [
      {
        title: 'Кейс-менеджмент',
        audiences: ['terminal', 'pro', 'sovereign'],
        items: [
          {
            id: 'cases',
            label: 'Кейс-Менеджер',
            path: '/cases',
            icon: Briefcase,
            description: 'Управління розслідуваннями: від відкриття до архіву.',
            group: 'Кейс-менеджмент',
            audiences: ['pro', 'sovereign'],
            priority: 95,
          },
          {
            id: 'timeline',
            label: 'Хронологія Подій',
            path: '/timeline',
            icon: History,
            description: 'Хронологічна стрічка подій з прив\'язкою до документів.',
            group: 'Кейс-менеджмент',
            badge: 'НОВЕ',
            audiences: ['pro', 'sovereign'],
            priority: 90,
          },
          {
            id: 'compliance',
            label: 'Комплексний Аудит',
            path: '/compliance',
            icon: Scale,
            description: 'Перевірка відповідності нормативним вимогам.',
            group: 'Кейс-менеджмент',
            audiences: ['pro', 'sovereign'],
            priority: 82,
          },
        ],
      },
      {
        title: 'Логістичний Моніторинг',
        audiences: ['terminal', 'pro', 'sovereign'],
        items: [
          {
            id: 'customs-intel',
            label: 'Митний Моніторинг',
            path: '/market?tab=customs',
            icon: Shield,
            description: 'Аналіз декларацій та ризикових митних операцій.',
            group: 'Логістичний Моніторинг',
            audiences: ['pro', 'sovereign'],
            priority: 88,
          },
          {
            id: 'trade-map',
            label: 'Потоки Товарів',
            path: '/market?tab=flows',
            icon: Globe,
            description: 'Візуалізація глобальних ланцюгів постачання.',
            group: 'Логістичний Моніторинг',
            audiences: ['pro', 'sovereign'],
            priority: 82,
          },
          {
            id: 'supply-chain',
            label: 'Ланцюги Постачання',
            path: '/supply-chain',
            icon: Layers,
            description: 'Аналіз вразливостей та критичних вузлів.',
            group: 'Логістичний Моніторинг',
            audiences: ['pro', 'sovereign'],
            priority: 76,
          },
          {
            id: 'tenders',
            label: 'Тендерний Радар',
            path: '/tenders',
            icon: FileText,
            description: 'Моніторинг державних закупівель та тендерів.',
            group: 'Логістичний Моніторинг',
            audiences: ['terminal', 'pro', 'sovereign'],
            priority: 72,
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // 5. КОГНІТИВНЕ ЯДРО (blue)
  // ══════════════════════════════════════════════════════════════
  {
    id: 'ai',
    label: 'КОГНІТИВНЕ ЯДРО',
    description: 'Автономні агенти, гіпотези, сценарне моделювання та предиктивна аналітика.',
    outcome: 'Синтетичні інсайти для випередження подій.',
    accent: 'blue',
    groups: [
      {
        title: 'ШІ-Синтез',
        audiences: ['terminal', 'pro', 'sovereign'],
        items: [
          {
            id: 'oracle',
            label: 'Суверенний Оракул',
            path: '/nexus?tab=oracle',
            icon: Sparkles,
            description: 'Генеративний синтез від Lead Architect GLM.',
            group: 'ШІ-Синтез',
            audiences: ['pro', 'sovereign'],
            priority: 100,
          },
          {
            id: 'ai-insights',
            label: 'Центр ШІ-Інсайтів',
            path: '/nexus?tab=insights',
            icon: Zap,
            description: 'Стратегічні висновки на базі кросмодальних сигналів.',
            group: 'ШІ-Синтез',
            audiences: ['terminal', 'pro', 'sovereign'],
            priority: 86,
          },
          {
            id: 'nexus',
            label: 'Предиктивний Нексус',
            path: '/nexus',
            icon: BrainCircuit,
            description: 'Центр прогнозного моделювання та сценаріїв.',
            group: 'ШІ-Синтез',
            badge: 'ЕЛІТ',
            audiences: ['sovereign'],
            priority: 95,
          },
        ],
      },
      {
        title: 'Моделювання',
        audiences: ['terminal', 'pro', 'sovereign'],
        items: [
          {
            id: 'ai-hypothesis',
            label: 'Генератор Гіпотез',
            path: '/nexus?tab=hypothesis',
            icon: FlaskConical,
            description: 'Автоматичне формування слідчих версій.',
            group: 'Моделювання',
            audiences: ['pro', 'sovereign'],
            priority: 89,
          },
          {
            id: 'scenarios',
            label: 'Сценарії Моделювання',
            path: '/scenarios',
            icon: Layers,
            description: '"What-if" симуляція на базі аналітичних моделей.',
            group: 'Моделювання',
            badge: 'НОВЕ',
            audiences: ['sovereign'],
            priority: 87,
          },
          {
            id: 'conversation-intel',
            label: 'Аналіз Сигналів',
            path: '/conversation-intel',
            icon: Radio,
            description: 'Обробка неструктурованих комунікацій та тексту.',
            group: 'Моделювання',
            audiences: ['pro', 'sovereign'],
            priority: 82,
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // 6. СУВЕРЕННА КІБЕРРОЗВІДКА (gold) — Тільки Sovereign
  // ══════════════════════════════════════════════════════════════
  {
    id: 'cyber',
    label: 'СУВЕРЕННА КІБЕРРОЗВІДКА',
    description: 'Пасивний моніторинг, структури впливу та виявлення інсайдерів.',
    outcome: 'Глибоке розуміння прихованих сил.',
    accent: 'gold',
    groups: [
      {
        title: 'Розвідка',
        audiences: ['terminal', 'pro', 'sovereign'],
        items: [
          {
            id: 'som',
            label: 'Суверенний Спостерігач',
            path: '/command?tab=observer',
            icon: Eye,
            description: 'Пасивний моніторинг аномалій та патернів.',
            group: 'Розвідка',
            audiences: ['sovereign'],
            priority: 85,
          },
          {
            id: 'power-structure',
            label: 'Структури Влади',
            path: '/power-structure',
            icon: Landmark,
            description: 'Аналіз політичного впливу та зв\'язків.',
            group: 'Розвідка',
            audiences: ['sovereign'],
            priority: 81,
          },
          {
            id: 'financial-sigint',
            label: 'Фінансова OSINT',
            path: '/financial-sigint',
            icon: Radar,
            description: 'Виявлення фінансових сигналів у розподілених мережах.',
            group: 'Розвідка',
            audiences: ['sovereign'],
            priority: 78,
          },
        ],
      },
      {
        title: 'Кіберзахист',
        audiences: ['terminal', 'pro', 'sovereign'],
        items: [
          {
            id: 'insider-threat',
            label: 'Індикатор Внутрішніх Загроз',
            path: '/insider-threat',
            icon: Shield,
            description: 'Виявлення витоків даних та інсайдерської активності.',
            group: 'Кіберзахист',
            badge: 'ЕЛІТ',
            audiences: ['sovereign'],
            priority: 90,
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // 7. PREDATOR CORE — Тільки Core/Admin (emerald)
  // ══════════════════════════════════════════════════════════════
  {
    id: 'system',
    label: 'PREDATOR CORE',
    description: 'Телеметрія кластера, безпека, пайплайни та оркестрація агентів.',
    outcome: 'Повний контроль над інфраструктурою PREDATOR.',
    accent: 'emerald',
    groups: [
      {
        title: 'Шлюзи Агрегації Даних',
        audiences: ['core'],
        items: [
          {
            id: 'omniverse-hub',
            label: 'Універсальний Хаб',
            path: '/omniverse',
            icon: Box,
            description: 'Головний центр управління універсальними даними.',
            group: 'Шлюзи Агрегації Даних',
            badge: 'v70.0',
            audiences: ['core'],
            priority: 110,
          },
          {
            id: 'omniverse-ingest',
            label: 'Інгестія Даних',
            path: '/omniverse?tab=ingest',
            icon: Upload,
            description: 'Інгестія довільних наборів даних через AI-інференс.',
            group: 'Шлюзи Агрегації Даних',
            audiences: ['core'],
            priority: 105,
          },
        ],
      },
      {
        title: 'Операційне Управління Даними',
        audiences: ['core'],
        items: [
          {
            id: 'admin-database-command-center',
            label: 'Центр Керування БД',
            path: '/admin/database-command-center',
            icon: Database,
            description: 'Моніторинг здоров\'я 8 баз даних та System Memory Contract.',
            group: 'Операційне Управління Даними',
            audiences: ['core'],
            priority: 96,
          },
          {
            id: 'admin-dataops',
            label: 'DataOps Кластер',
            path: '/admin/command?tab=dataops',
            icon: Database,
            description: 'Kafka ingestion, фабрика модулів, датасети ШІ.',
            group: 'Операційне Управління Даними',
            audiences: ['core'],
            priority: 88,
          },
        ],
      },
      {
        title: 'Маршрутизація та Відмовостійкість',
        audiences: ['core'],
        items: [
          {
            id: 'admin-infra',
            label: 'Телеметрія Кластера',
            path: '/admin/command?tab=infra',
            icon: Activity,
            description: 'GPU VRAM, CPU, RAM, мережа — реальний час.',
            group: 'Маршрутизація та Відмовостійкість',
            badge: 'ОНЛАЙН',
            audiences: ['core'],
            priority: 100,
          },
          {
            id: 'admin-failover',
            label: 'Failover Маршрутизація',
            path: '/admin/command?tab=failover',
            icon: Radio,
            description: 'Перемикання трафіку: Local K3s ↔ NVIDIA Server ↔ Colab.',
            group: 'Маршрутизація та Відмовостійкість',
            audiences: ['core'],
            priority: 98,
          },
          {
            id: 'admin-gitops',
            label: 'GitOps Пайплайни',
            path: '/admin/command?tab=gitops',
            icon: Box,
            description: 'ArgoCD sync статус, CI/CD runs.',
            group: 'Маршрутизація та Відмовостійкість',
            audiences: ['core'],
            priority: 95,
          },
        ],
      },
      {
        title: 'Панель Управління ШІ',
        audiences: ['core'],
        items: [
          {
            id: 'admin-ai-control',
            label: 'Контроль ШІ-Моделей',
            path: '/admin/ai-control',
            icon: BrainCircuit,
            description: 'LLM роутинг, A/B тести, VRAM-баланс моделей.',
            group: 'Панель Управління ШІ',
            audiences: ['core'],
            priority: 85,
          },
          {
            id: 'admin-agents-ops',
            label: 'Оркестрація Агентів',
            path: '/admin/command?tab=agents-ops',
            icon: Bot,
            description: 'Статус автономної мережі аналітичних агентів.',
            group: 'Панель Управління ШІ',
            audiences: ['core'],
            priority: 92,
          },
          {
            id: 'knowledge',
            label: 'Векторна База Знань',
            path: '/nexus?tab=knowledge',
            icon: Database,
            description: 'Синхронізація знань для ШІ-ядра платформи.',
            group: 'Панель Управління ШІ',
            audiences: ['core'],
            priority: 74,
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
          {
            id: 'api-docs',
            label: 'API Протоколи',
            path: '/api-docs',
            icon: FileText,
            description: 'Інтеграційні протоколи для зовнішніх систем.',
            group: 'Архітектура Нульової Довіри',
            audiences: ['core'],
            priority: 60,
          },
        ],
      },
      {
        title: 'Автономний Завод',
        audiences: ['core'],
        items: [
          {
            id: 'factory-auto',
            label: 'Автономний Завод OODA',
            path: '/admin/command?tab=auto-factory',
            icon: Factory,
            description: 'Контроль OODA-циклу, патч-менеджмент та еволюція.',
            group: 'Автономний Завод',
            badge: 'ЕЛІТ',
            audiences: ['core'],
            priority: 100,
          },
          {
            id: 'factory-council',
            label: 'Council Judge',
            path: '/admin/command?tab=auto-factory',
            icon: ShieldCheck,
            description: 'Рішення Ради Моделей (Qwen/LLaMA/Gemini).',
            group: 'Автономний Завод',
            badge: 'ШІ',
            audiences: ['core'],
            priority: 95,
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
