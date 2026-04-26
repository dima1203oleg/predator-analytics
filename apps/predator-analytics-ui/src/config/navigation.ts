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

// ─── Відповідність ролей до аудиторій ────────────────────────────────────────

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
  // 1. EXECUTIVE — стратегічне командування (sky)
  //    Доступ: business, analyst (НЕ admin — він у System Command Center)
  // ══════════════════════════════════════════════════════════════
  {
    id: 'executive',
    label: 'EXECUTIVE',
    description: 'Стратегічний рівень: рішення, ризики, брифінги та ситуаційна обізнаність.',
    outcome: 'Повний 360° контроль над бізнес-периметром.',
    accent: 'sky',
    groups: [
      {
        title: 'Командування',
        audiences: ['business', 'analyst'],
        items: [
          {
            id: 'dashboard',
            label: 'Виконавча Рада',
            path: '/command?tab=board',
            icon: LayoutDashboard,
            description: 'Головна точка входу: ROI-пульс, KPI, швидкі переходи.',
            group: 'Командування',
            audiences: ['business', 'analyst'],
            priority: 100,
          },
          {
            id: 'morning-brief',
            label: 'Ранковий Брифінг',
            path: '/command?tab=brief',
            icon: Compass,
            description: 'Пріоритетний аналіз ризиків та цілей на поточний день.',
            group: 'Командування',
            audiences: ['business', 'analyst'],
            priority: 92,
          },
          {
            id: 'newspaper',
            label: 'Ранкова Газета',
            path: '/search?tab=newspaper',
            icon: Newspaper,
            description: 'Персоналізована щоденна аналітика ринку.',
            group: 'Командування',
            audiences: ['business', 'analyst'],
            priority: 84,
          },
        ],
      },
      {
        title: 'Оперативний штаб',
        audiences: ['analyst'],
        items: [
          {
            id: 'war-room',
            label: 'Ситуаційна Кімната',
            path: '/command?tab=warroom',
            icon: Target,
            description: 'Оперативний штаб для кризового управління та ескалацій.',
            group: 'Оперативний штаб',
            badge: 'LIVE',
            audiences: ['analyst'],
            priority: 98,
          },
          {
            id: 'portfolio-risk',
            label: 'Портфельний Ризик',
            path: '/command?tab=risk',
            icon: TrendingUp,
            description: 'Агрегований фінансовий ризик портфелю клієнтів.',
            group: 'Оперативний штаб',
            badge: 'ОНЛАЙН',
            audiences: ['analyst'],
            priority: 99,
          },
          {
            id: 'alert-center',
            label: 'Alert Center',
            path: '/alerts',
            icon: AlertTriangle,
            description: 'Консолідований центр системних та аналітичних алертів.',
            group: 'Оперативний штаб',
            badge: 'NEW',
            audiences: ['analyst'],
            priority: 97,
          },
          {
            id: 'decisions',
            label: 'Журнал Рішень',
            path: '/decisions',
            icon: History,
            description: 'WORM-журнал прийнятих рішень з прив\'язкою до кейсів.',
            group: 'Оперативний штаб',
            audiences: ['analyst'],
            priority: 88,
          },
          {
            id: 'clients',
            label: 'Портфель Клієнтів',
            path: '/clients',
            icon: Users,
            description: 'Сегментація та аналіз клієнтської бази.',
            group: 'Оперативний штаб',
            audiences: ['analyst'],
            priority: 80,
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // 2. INTELLIGENCE — торгова розвідка (amber)
  // ══════════════════════════════════════════════════════════════
  {
    id: 'intelligence',
    label: 'INTELLIGENCE',
    description: 'Митниця, ціни, логістичні потоки та аналіз ринків.',
    outcome: 'Торгова розвідка: домінування через аналіз потоків.',
    accent: 'amber',
    groups: [
      {
        title: 'Ринок',
        audiences: ['business', 'analyst', 'supply_chain', 'admin'],
        items: [
          {
            id: 'market',
            label: 'Огляд Ринку',
            path: '/market?tab=overview',
            icon: TrendingUp,
            description: 'Загальна аналітика зовнішньоекономічної діяльності.',
            group: 'Ринок',
            audiences: ['business', 'analyst', 'supply_chain', 'admin'],
            priority: 90,
          },
          {
            id: 'price-compare',
            label: 'Прайс-Аудитор',
            path: '/market?tab=price',
            icon: BarChart3,
            description: 'Контроль цін та виявлення демпінгу.',
            group: 'Ринок',
            audiences: ['analyst', 'admin'],
            priority: 86,
          },
          {
            id: 'geopolitical-radar',
            label: 'Геополітичний Радар',
            path: '/geopolitical-radar',
            icon: Radar,
            description: 'Вплив світових подій на торговельну стабільність.',
            group: 'Ринок',
            badge: 'WRAITH',
            audiences: ['analyst', 'admin'],
            priority: 85,
          },
        ],
      },
      {
        title: 'Митниця та Логістика',
        audiences: ['analyst', 'supply_chain', 'admin'],
        items: [
          {
            id: 'customs-intel',
            label: 'Митний Моніторинг',
            path: '/market?tab=customs',
            icon: Shield,
            description: 'Аналіз декларацій та ризикових митних операцій.',
            group: 'Митниця та Логістика',
            audiences: ['analyst', 'supply_chain', 'admin'],
            priority: 88,
          },
          {
            id: 'trade-map',
            label: 'Потоки Товарів',
            path: '/market?tab=flows',
            icon: Globe,
            description: 'Візуалізація глобальних ланцюгів постачання.',
            group: 'Митниця та Логістика',
            audiences: ['analyst', 'supply_chain', 'admin'],
            priority: 82,
          },
          {
            id: 'suppliers',
            label: 'Радар Постачальників',
            path: '/market?tab=suppliers',
            icon: Briefcase,
            description: 'Пошук та верифікація стратегічних контрагентів.',
            group: 'Митниця та Логістика',
            audiences: ['analyst', 'supply_chain', 'admin'],
            priority: 80,
          },
          {
            id: 'supply-chain',
            label: 'Ланцюги Постачання',
            path: '/supply-chain',
            icon: Layers,
            description: 'Аналіз вразливостей та критичних вузлів.',
            group: 'Митниця та Логістика',
            audiences: ['supply_chain', 'analyst', 'admin'],
            priority: 76,
          },
          {
            id: 'maritime',
            label: 'Морська Розвідка',
            path: '/maritime',
            icon: Ship,
            description: 'Відстеження суден та активності портів.',
            group: 'Митниця та Логістика',
            audiences: ['supply_chain', 'analyst', 'admin'],
            priority: 74,
          },
          {
            id: 'tenders',
            label: 'Тендерний Радар',
            path: '/tenders',
            icon: FileText,
            description: 'Моніторинг державних закупівель та тендерів.',
            group: 'Митниця та Логістика',
            audiences: ['analyst', 'admin'],
            priority: 72,
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // 3. ANALYTICS — due diligence, AML, графи (rose)
  // ══════════════════════════════════════════════════════════════
  {
    id: 'analytics',
    label: 'ANALYTICS',
    description: 'Due Diligence 360°, AML, санкції, UBO та зв\'язки.',
    outcome: 'Повний профіль будь-якого контрагента.',
    accent: 'rose',
    groups: [
      {
        title: 'Пошук та Ідентифікація',
        audiences: ['business', 'analyst', 'admin'],
        items: [
          {
            id: 'search',
            label: 'Глобальний Пошук',
            path: '/search?tab=global',
            icon: Search,
            description: 'Синаптичний пошук по всіх реєстрах та базах.',
            group: 'Пошук та Ідентифікація',
            audiences: ['business', 'analyst', 'admin'],
            priority: 86,
          },
          {
            id: 'registries',
            label: 'Державні Реєстри',
            path: '/search?tab=registries',
            icon: Database,
            description: 'Прямий доступ до відкритих та закритих баз даних.',
            group: 'Пошук та Ідентифікація',
            audiences: ['analyst', 'admin'],
            priority: 82,
          },
          {
            id: 'entity-resolver',
            label: 'Entity Resolver',
            path: '/entity-resolver',
            icon: Fingerprint,
            description: 'Де-дублікація та злиття записів з confidence score.',
            group: 'Пошук та Ідентифікація',
            badge: 'NEW',
            audiences: ['analyst', 'admin'],
            priority: 81,
          },
        ],
      },
      {
        title: 'Розвідка та Комплаєнс',
        audiences: ['analyst', 'admin'],
        items: [
          {
            id: 'osint-diligence',
            label: 'Персональне Досьє',
            path: '/osint?tab=diligence',
            icon: User,
            description: 'Повний KYC/KYB аудит та профіль ризиків суб\'єкта.',
            group: 'Розвідка та Комплаєнс',
            audiences: ['analyst', 'admin'],
            priority: 91,
          },
          {
            id: 'ubo-map',
            label: 'Карта Бенефіціарів',
            path: '/osint?tab=ubo',
            icon: Network,
            description: 'Візуалізація кінцевих власників та структур впливу.',
            group: 'Розвідка та Комплаєнс',
            badge: 'WRAITH',
            audiences: ['analyst', 'admin'],
            priority: 97,
          },
          {
            id: 'graph',
            label: 'Нейронний Граф',
            path: '/osint?tab=graph',
            icon: Network,
            description: 'Аналіз прихованих зв\'язків та аномальних кластерів.',
            group: 'Розвідка та Комплаєнс',
            audiences: ['analyst', 'admin'],
            priority: 95,
          },
          {
            id: 'sanctions',
            label: 'Санкції та PEP',
            path: '/osint?tab=sanctions',
            icon: ShieldX,
            description: 'Скринінг на санкційні списки та PEP-осіб.',
            group: 'Розвідка та Комплаєнс',
            audiences: ['analyst', 'admin'],
            priority: 94,
          },
          {
            id: 'aml-radar',
            label: 'AML Радар',
            path: '/financial?tab=aml',
            icon: ShieldCheck,
            description: 'Система виявлення схем відмивання коштів.',
            group: 'Розвідка та Комплаєнс',
            audiences: ['analyst', 'admin'],
            priority: 92,
          },
          {
            id: 'swift-monitor',
            label: 'Транзакційний Монітор',
            path: '/financial?tab=swift',
            icon: Activity,
            description: 'Аналіз грошових переказів у реальному часі.',
            group: 'Розвідка та Комплаєнс',
            badge: 'ОНЛАЙН',
            audiences: ['analyst', 'admin'],
            priority: 90,
          },
          {
            id: 'offshore-detector',
            label: 'Офшорний Детектор',
            path: '/financial?tab=offshore',
            icon: Globe,
            description: 'Виявлення підставних компаній та прихованих активів.',
            group: 'Розвідка та Комплаєнс',
            audiences: ['analyst', 'admin'],
            priority: 88,
          },
          {
            id: 'financial-hub',
            label: 'Фінансовий Хаб',
            path: '/financial',
            icon: Landmark,
            description: 'Єдиний центр управління фінансовою аналітикою.',
            group: 'Розвідка та Комплаєнс',
            audiences: ['analyst', 'admin'],
            priority: 89,
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // 4. AI CORE — агенти, гіпотези, оракул (blue)
  // ══════════════════════════════════════════════════════════════
  {
    id: 'ai',
    label: 'AI CORE',
    description: 'Автономні агенти, гіпотези, сценарне моделювання та предиктивна аналітика.',
    outcome: 'Синтетичні інсайти для випередження подій.',
    accent: 'blue',
    groups: [
      {
        title: 'Когніція',
        audiences: ['business', 'analyst', 'admin'],
        items: [
          {
            id: 'oracle',
            label: 'Суверенний Оракул',
            path: '/nexus?tab=oracle',
            icon: Sparkles,
            description: 'Генеративний синтез від Lead Architect GLM.',
            group: 'Когніція',
            audiences: ['business', 'analyst', 'admin'],
            priority: 100,
          },
          {
            id: 'ai-insights',
            label: 'ШІ Інсайти',
            path: '/nexus?tab=insights',
            icon: Zap,
            description: 'Стратегічні висновки на базі кросмодальних сигналів.',
            group: 'Когніція',
            audiences: ['business', 'analyst', 'admin'],
            priority: 86,
          },
          {
            id: 'nexus',
            label: 'Предиктивний Нексус',
            path: '/nexus',
            icon: BrainCircuit,
            description: 'Центр прогнозного моделювання та сценаріїв.',
            group: 'Когніція',
            badge: 'WRAITH',
            audiences: ['analyst', 'admin'],
            priority: 95,
          },
        ],
      },
      {
        title: 'Аналітика та Агенти',
        audiences: ['analyst', 'admin'],
        items: [
          {
            id: 'ai-hypothesis',
            label: 'Генератор Гіпотез',
            path: '/nexus?tab=hypothesis',
            icon: FlaskConical,
            description: 'Автоматичне формування слідчих версій.',
            group: 'Аналітика та Агенти',
            audiences: ['analyst', 'admin'],
            priority: 89,
          },
          {
            id: 'scenarios',
            label: 'Сценарне Моделювання',
            path: '/scenarios',
            icon: Layers,
            description: '"What-if" симуляція на базі аналітичних моделей.',
            group: 'Аналітика та Агенти',
            badge: 'NEW',
            audiences: ['analyst', 'admin'],
            priority: 87,
          },
          {
            id: 'agents',
            label: 'ШІ Агенти',
            path: '/nexus?tab=agents',
            icon: Bot,
            description: 'Керування автономною мережею аналітичних агентів.',
            group: 'Аналітика та Агенти',
            audiences: ['analyst', 'admin'],
            priority: 88,
          },
          {
            id: 'conversation-intel',
            label: 'Аналіз Смислів',
            path: '/conversation-intel',
            icon: Radio,
            description: 'Обробка неструктурованих комунікацій та тексту.',
            group: 'Аналітика та Агенти',
            audiences: ['analyst', 'admin'],
            priority: 82,
          },
          {
            id: 'knowledge',
            label: 'База Знань',
            path: '/nexus?tab=knowledge',
            icon: Database,
            description: 'Синхронізація знань для ШІ-ядра платформи.',
            group: 'Аналітика та Агенти',
            audiences: ['analyst', 'admin'],
            priority: 74,
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // 5. INVESTIGATION — кейси, хронологія, розслідування (indigo)
  // ══════════════════════════════════════════════════════════════
  {
    id: 'investigation',
    label: 'INVESTIGATION',
    description: 'Кейси, хронологія подій, структури влади та спостереження.',
    outcome: 'Структуроване розслідування від сигналу до рішення.',
    accent: 'indigo',
    groups: [
      {
        title: 'Кейс-менеджмент',
        audiences: ['analyst', 'admin'],
        items: [
          {
            id: 'cases',
            label: 'Кейс-Менеджер',
            path: '/cases',
            icon: Briefcase,
            description: 'Управління розслідуваннями: від відкриття до архіву.',
            group: 'Кейс-менеджмент',
            audiences: ['analyst', 'admin'],
            priority: 95,
          },
          {
            id: 'timeline',
            label: 'Timeline Builder',
            path: '/timeline',
            icon: History,
            description: 'Хронологічна стрічка подій з прив\'язкою до документів.',
            group: 'Кейс-менеджмент',
            badge: 'NEW',
            audiences: ['analyst', 'admin'],
            priority: 90,
          },
          {
            id: 'compliance',
            label: 'Комплаєнс Аудит',
            path: '/compliance',
            icon: Scale,
            description: 'Перевірка відповідності нормативним вимогам.',
            group: 'Кейс-менеджмент',
            audiences: ['analyst', 'admin'],
            priority: 82,
          },
        ],
      },
      {
        title: 'Глибока Розвідка',
        audiences: ['analyst', 'admin'],
        items: [
          {
            id: 'som',
            label: 'Суверенний Спостерігач',
            path: '/command?tab=observer',
            icon: Eye,
            description: 'Пасивний моніторинг аномалій та патернів.',
            group: 'Глибока Розвідка',
            audiences: ['analyst', 'admin'],
            priority: 85,
          },
          {
            id: 'power-structure',
            label: 'Структури Влади',
            path: '/power-structure',
            icon: Landmark,
            description: 'Аналіз політичного впливу та зв\'язків.',
            group: 'Глибока Розвідка',
            audiences: ['analyst', 'admin'],
            priority: 81,
          },
          {
            id: 'financial-sigint',
            label: 'Фінансова SIGINT',
            path: '/financial-sigint',
            icon: Radar,
            description: 'Виявлення фінансових сигналів у розподілених мережах.',
            group: 'Глибока Розвідка',
            audiences: ['analyst', 'admin'],
            priority: 78,
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // 6. SYSTEM COMMAND CENTER — тільки admin (emerald)
  //    Пульт управління інфраструктурою. БЕЗ будь-яких бізнес-даних.
  // ══════════════════════════════════════════════════════════════
  {
    id: 'system',
    label: 'SYSTEM COMMAND CENTER',
    description: 'Телеметрія кластера, безпека, пайплайни та оркестрація агентів.',
    outcome: 'Повний контроль над інфраструктурою PREDATOR.',
    accent: 'emerald',
    groups: [
      {
        title: 'Моніторинг',
        audiences: ['admin'],
        items: [
          {
            id: 'admin-infra',
            label: 'Телеметрія Кластера',
            path: '/admin/command?tab=infra',
            icon: Activity,
            description: 'GPU VRAM, CPU, RAM, мережа — реальний час. Tensor Core Usage%.',
            group: 'Моніторинг',
            badge: 'LIVE',
            audiences: ['admin'],
            priority: 100,
          },
          {
            id: 'admin-failover',
            label: 'Failover & Маршрутизація',
            path: '/admin/command?tab=failover',
            icon: Radio,
            description: 'Перемикання трафіку: Local K3s ↔ NVIDIA Server ↔ Colab.',
            group: 'Моніторинг',
            audiences: ['admin'],
            priority: 98,
          },
        ],
      },
      {
        title: 'Пайплайни',
        audiences: ['admin'],
        items: [
          {
            id: 'admin-gitops',
            label: 'GitOps & Пайплайни',
            path: '/admin/command?tab=gitops',
            icon: Box,
            description: 'ArgoCD sync статус, CI/CD runs, ETL пайплайни.',
            group: 'Пайплайни',
            audiences: ['admin'],
            priority: 95,
          },
          {
            id: 'admin-dataops',
            label: 'DataOps',
            path: '/admin/command?tab=dataops',
            icon: Database,
            description: 'Kafka ingestion, фабрика модулів, датасети ШІ.',
            group: 'Пайплайни',
            audiences: ['admin'],
            priority: 88,
          },
        ],
      },
      {
        title: 'Агенти та Безпека',
        audiences: ['admin'],
        items: [
          {
            id: 'admin-agents-ops',
            label: 'Оркестрація Агентів',
            path: '/admin/command?tab=agents-ops',
            icon: Bot,
            description: 'Статус агентів: CPU, RAM, черга завдань, success rate.',
            group: 'Агенти та Безпека',
            audiences: ['admin'],
            priority: 92,
          },
          {
            id: 'admin-security',
            label: 'Zero Trust & Безпека',
            path: '/admin/command?tab=security',
            icon: Lock,
            description: 'IAM, аудит сесій, API-ключі, логи доступу.',
            group: 'Агенти та Безпека',
            audiences: ['admin'],
            priority: 90,
          },
          {
            id: 'admin-ai-control',
            label: 'Контроль ШІ-Моделей',
            path: '/admin/ai-control',
            icon: BrainCircuit,
            description: 'LLM роутинг, A/B тести, VRAM-баланс моделей.',
            group: 'Агенти та Безпека',
            audiences: ['admin'],
            priority: 85,
          },
        ],
      },
      {
        title: 'Конфігурація',
        audiences: ['admin'],
        items: [
          {
            id: 'admin-settings',
            label: 'Налаштування',
            path: '/admin/command?tab=settings',
            icon: Settings,
            description: 'Глобальна конфігурація платформи.',
            group: 'Конфігурація',
            audiences: ['admin'],
            priority: 70,
          },
          {
            id: 'api-docs',
            label: 'API Документація',
            path: '/api-docs',
            icon: FileText,
            description: 'Інтеграційні протоколи для зовнішніх систем.',
            group: 'Конфігурація',
            audiences: ['admin'],
            priority: 60,
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

  // Адмін бачить ТІЛЬКИ елементи з audiences: ['admin']
  // Бізнес-модулі для адміна приховані (ізоляція System Command Center)
  if (normalizedRole === 'admin') {
    if (!item.audiences || item.audiences.length === 0) return false;
    return item.audiences.includes('admin');
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

  // Адмін бачить ТІЛЬКИ групи з audiences: ['admin']
  if (normalizedRole === 'admin') {
    if (!group.audiences || group.audiences.length === 0) return false;
    return group.audiences.includes('admin');
  }

  if (!group.audiences || group.audiences.length === 0) {
    return true;
  }

  return group.audiences.includes(resolveNavigationAudience(normalizedRole));
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
