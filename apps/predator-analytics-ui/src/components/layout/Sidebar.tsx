import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Archive,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  BrainCircuit,
  Building2,
  ChevronDown,
  ChevronRight,
  Crosshair,
  Crown,
  Database,
  Factory,
  FileSearch,
  FileText,
  FolderOpen,
  Gauge,
  Globe,
  Landmark,
  Layers,
  LayoutDashboard,
  LineChart,
  Lock,
  Map,
  MessageSquare,
  Network,
  Newspaper,
  Package,
  Radio,
  Radar,
  Scale,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Ship,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  UserCheck,
  Users,
  Workflow,
  Zap,
  Eye,
  Briefcase,
  Compass,
  Lightbulb,
  Wrench,
  Plug,
  Download,
  FileBarChart,
  PanelTop,
  Boxes,
  Cpu,
  Rocket,
  Library,
  Map as MapIcon,
  Siren,
  UserX,
  Fingerprint,
  DollarSign,
  Truck,
  ScanLine,
  FileLock2,
  Share2,
  PieChart,
  Navigation,
  ShieldX,
  StarOff,
  Ghost,
  Skull,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { UserRole } from '../../config/roles';
import { cn } from '../../utils/cn';
import { SIDEBAR } from '../../lib/motion';
import { useState, useMemo, useCallback, useEffect } from 'react';

/* ═══════════════════════════════════════════════════════════════════
   TYPES — Типізація навігації (PREDATOR Analytics v55.1)
   ═══════════════════════════════════════════════════════════════════ */

interface NavItem {
  /** Назва пункту (УКРАЇНСЬКОЮ) */
  name: string;
  /** Маршрут */
  path: string;
  /** Іконка Lucide */
  icon: React.ElementType;
  /** Тільки для Premium підписки */
  premium?: boolean;
  /** Обмеження за роллю */
  role?: 'admin';
  /** Підпункти (другий рівень) */
  subItems?: SubNavItem[];
  /** Badge лічильник */
  badge?: number;
  /** Динамічний badge тип */
  badgeType?: 'live' | 'count' | 'status' | 'danger' | 'pulse';
  /** Гачок — питання що змушує клікати */
  hook?: string;
}

interface SubNavItem {
  name: string;
  path: string;
  premium?: boolean;
  role?: 'admin';
}

interface NavGroup {
  /** Заголовок секції (КАПСОМ, укр) */
  title: string;
  /** Короткий опис секції */
  subtitle?: string;
  /** Іконка секції */
  icon?: React.ElementType;
  /** Пункти навігації */
  items: NavItem[];
  /** Акцентний колір секції */
  accent?: string;
  /** Нова секція (підсвічення) */
  isNew?: boolean;
  /** Тільки admin */
  adminOnly?: boolean;
}

/* ═══════════════════════════════════════════════════════════════════
   NAVIGATION — PREDATOR v55.1 КЛІЄНТ
   ═══════════════════════════════════════════════════════════════════ */
const buildNavGroups = (): NavGroup[] => [
  /* ─────────────────────────────────────────────────────────
     ① ГАЗЕТА PREDATOR — "Що почитати за кавою?" (Passive Intake)
     ───────────────────────────────────────────────────────── */
  {
    title: 'ГАЗЕТА',
    subtitle: 'Дайджест · OSINT · Тренди щодня',
    icon: Newspaper,
    accent: 'cyan',
    isNew: true,
    items: [
      {
        name: 'Мій Дайджест',
        path: '/newspaper',
        icon: Newspaper,
        badgeType: 'live',
        hook: 'Свіжий компромат, тренди, ризики — зібрані для тебе',
      },
      {
        name: 'Компромат Дня',
        path: '/morning-brief',
        icon: AlertTriangle,
        badgeType: 'danger',
        badge: 4,
        hook: 'Хто "засвітився" за останні 24 години у твоїй ніші?',
      },
      {
        name: 'Тренди Ринку',
        path: '/news',
        icon: TrendingUp,
        hook: 'Що зростає зараз? Які товари стають модними?',
      },
      {
        name: 'Держ.Дані API',
        path: '/datagov',
        icon: Database,
        hook: 'Офіційні відкриті дані — в зручному вигляді',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────
     ② МІЙ РАДАР — "Мій стан прямо зараз" (Personalized Status)
     ───────────────────────────────────────────────────────── */
  {
    title: 'МІЙ РАДАР',
    subtitle: 'Пульс · Загрози · Огляд 360°',
    icon: Radar,
    accent: 'rose',
    items: [
      {
        name: 'Панель Загроз',
        path: '/overview',
        icon: LayoutDashboard,
        badgeType: 'danger',
        badge: 3,
        hook: 'Контрагенти з червоним прапором — хто вони?',
      },
      {
        name: 'Омніскоп (360°)',
        path: '/omni',
        icon: Eye,
        premium: true,
        hook: 'Всі твої активи та загрози на одній панелі',
      },
      {
        name: 'Оперативний Монітор',
        path: '/dashboards',
        icon: Gauge,
        premium: true,
        hook: 'Твої особисті KPI безпеки та прибутку',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────
     ③ АРСЕНАЛ ДОСЬЄ — "Хто це та чим дихає?" (Deep Search)
     ───────────────────────────────────────────────────────── */
  {
    title: 'АРСЕНАЛ ДОСЬЄ',
    subtitle: 'Пошук · Люди · Фірми · Санкції',
    icon: Fingerprint,
    accent: 'orange',
    items: [
      {
        name: 'Омні-Пошук',
        path: '/search-v2',
        icon: Search,
        hook: 'ПІБ / ЄДРПОУ / Телефон / Email / УКТ ЗЕД',
      },
      {
        name: 'Досьє на Особу',
        path: '/compromat-person',
        icon: UserX,
        premium: true,
        hook: 'Борги, суди, зв’язки та соцмережі людини',
      },
      {
        name: 'Досьє на Фірму',
        path: '/compromat-firm',
        icon: Building2,
        premium: true,
        hook: 'Хто власник і з ким вони насправді торгують?',
      },
      {
        name: 'Санкційний Скринінг',
        path: '/sanctions',
        icon: Shield,
        premium: true,
        hook: 'Чистота контрагента за списками РНБО / OFAC',
      },
      {
        name: 'AML та Брудні Гроші',
        path: '/aml',
        icon: ShieldAlert,
        premium: true,
        hook: 'Перевір транзакції на ризик відмивання',
      },
      {
        name: 'Реєстровий Хаб',
        path: '/registries',
        icon: Library,
        hook: 'Доступ до 50+ державних баз в одному вікні',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────
     ④ СТРУКТУРА ТА ВПЛИВ (Connections)
     ───────────────────────────────────────────────────────── */
  {
    title: 'СТРУКТУРА ТА ВПЛИВ',
    subtitle: 'Граф · Бенефіціари · Мережі',
    icon: Network,
    accent: 'blue',
    items: [
      {
        name: 'Граф Зв’язків',
        path: '/graph',
        icon: Network,
        premium: true,
        badgeType: 'pulse',
        hook: 'Побач приховані ниточки між об’єктами',
      },
      {
        name: 'Мапа Впливу та Влади',
        path: '/power-structure',
        icon: Landmark,
        premium: true,
        hook: 'Хто реально контролює ціну та рішення?',
      },
      {
        name: 'Карта Контактів',
        path: '/entity-graph',
        icon: Share2,
        hook: 'Транскордонні зв’язки та офшорні хвости',
      },
      {
        name: 'Центр Розвідки',
        path: '/intelligence',
        icon: BrainCircuit,
        premium: true,
        hook: 'Усі зв’язки фігуранта — зведений портрет',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────
     ⑤ РИНОК ТА МИТНИЦЯ (Market & Customs)
     ───────────────────────────────────────────────────────── */
  {
    title: 'РИНОК ТА МИТНИЦЯ',
    subtitle: 'Ціни · Конкуренти · Маржа · АІС',
    icon: Crosshair,
    accent: 'indigo',
    items: [
      {
        name: 'Митна Розвідка',
        path: '/customs-intel',
        icon: Scale,
        hook: 'Хто везе твій товар дешевше за тебе?',
      },
      {
        name: 'Конкурентна Розвідка',
        path: '/competitor-intel',
        icon: Target,
        premium: true,
        hook: 'Обсяги продажів та клієнти твого конкурента',
      },
      {
        name: 'Динаміка Ринку',
        path: '/market',
        icon: BarChart3,
        hook: 'Які ніші зараз звільняються? Твій шанс зайти',
      },
      {
        name: 'Торгові Шляхи',
        path: '/trade-map',
        icon: Map,
        premium: true,
        hook: 'Географія постачання: порти, хаби, транзит',
      },
      {
        name: 'Морська Розвідка (АІС)',
        path: '/maritime',
        icon: Ship,
        premium: true,
        hook: 'Судна з твоїм вантажем — де вони зараз?',
      },
      {
        name: 'Пошук Постачальників',
        path: '/suppliers',
        icon: Truck,
        premium: true,
        hook: 'Знайди прямий завод-виробник без посередника',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────
     ⑥ AI СТРАТЕГІЯ — Forecast & Insight
     ───────────────────────────────────────────────────────── */
  {
    title: 'AI СТРАТЕГІЯ',
    subtitle: 'Прогнози · Тренди · Моделювання',
    icon: Sparkles,
    accent: 'emerald',
    items: [
      {
        name: 'AI Прогнозування',
        path: '/forecast',
        icon: LineChart,
        premium: true,
        hook: 'Хто збанкрутує, а хто виросте на 200%?',
      },
      {
        name: 'Інсайти Системи',
        path: '/ai-insights',
        icon: Lightbulb,
        premium: true,
        hook: 'Аномальні закономірності, які AI знайшов у даних',
      },
      {
        name: 'Моди Товарів',
        path: '/analytics',
        icon: TrendingUp,
        premium: true,
        hook: 'Які коди УКТ ЗЕД будуть у топі наступного місяця?',
      },
      {
        name: 'Моделювання Сценаріїв',
        path: '/modeling',
        icon: Workflow,
        premium: true,
        hook: 'Що буде з ціною, якщо курс зросте на 10%?',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────
     ⑦ АНАЛІТИКА ТА ЛАНЦЮГИ — Logistics Command Center
     ───────────────────────────────────────────────────────── */
  {
    title: 'АНАЛІТИКА ТА ЛАНЦЮГИ',
    subtitle: 'Маршрути · Кораблі · Відстеження · Ризики',
    icon: Truck,
    accent: 'cyan',
    items: [
      {
        name: 'Мій Радар Ланцюгів',
        path: '/supply-chain',
        icon: Globe,
        hook: 'Реал-тайм карта світу та твоїх об\'єктів',
      },
      {
        name: 'Відстежування Товару',
        path: '/supply-chain/tracking',
        icon: Target,
        hook: 'Живе відстеження контейнера за УКТ ЗЕД',
      },
      {
        name: 'Побудова Маршрутів',
        path: '/supply-chain/routing',
        icon: Navigation,
        premium: true,
        hook: 'AI-оптимізатор: ціна, час, ризики митниці',
      },
      {
        name: 'Кораблі Наживо',
        path: '/supply-chain/ships',
        icon: Ship,
        premium: true,
        hook: 'AIS-дані: курс, швидкість, власник, санкції',
      },
      {
        name: 'Ризики та Компромат',
        path: '/supply-chain/risks',
        icon: ShieldAlert,
        premium: true,
        hook: 'Хто власник судна? Чи є ризик підкупу митника?',
      },
      {
        name: 'Прогнози Тренди',
        path: '/supply-chain/forecasts',
        icon: TrendingUp,
        premium: true,
        hook: 'Майбутні ціни та логістичні аномалії',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────
     ⑦ ЦЕНТР СПОВІЩЕНЬ — Be First
     ───────────────────────────────────────────────────────── */
  {
    title: 'ЦЕНТР СПОВІЩЕНЬ',
    subtitle: 'Алерти · Моніторинг · Підписки',
    icon: Siren,
    accent: 'amber',
    items: [
      {
        name: 'Мої Об’єкти',
        path: '/alerts',
        icon: Bell,
        badgeType: 'danger',
        badge: 12,
        hook: 'Критичні зміни по твоїх фірмах та людях',
      },
      {
        name: 'Живий Моніторинг',
        path: '/monitoring',
        icon: Radio,
        hook: 'Підпишись на автоматичне стеження за конкурентом',
      },
      {
        name: 'Реальний Час (VDS)',
        path: '/realtime',
        icon: Activity,
        premium: true,
        hook: 'Сигнали прямо з митного посту — кожні 5 хв',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────
     ⑦.5 КОНТРОЛЬ ТА ЗРАДА — Business Weapons
     ───────────────────────────────────────────────────────── */
  {
    title: 'КОНТРОЛЬ ТА ЗРАДА',
    subtitle: 'Реферали · Зрада · Шахраї · Тіньові схеми',
    icon: ShieldX,
    accent: 'rose',
    isNew: true,
    items: [
      {
        name: 'Реферальний Контроль',
        path: '/referral-control',
        icon: Share2,
        premium: true,
        badgeType: 'pulse',
        hook: 'Хто з клієнтів привів нового? Виявляй приховані зв’язки',
      },
      {
        name: 'Зрада-Контроль',
        path: '/betrayal-control',
        icon: ShieldX,
        premium: true,
        hook: 'Хто з твоїх партнерів вже працює на конкурента?',
      },
      {
        name: 'Чорний Рейтинг',
        path: '/black-rating',
        icon: StarOff,
        premium: true,
        hook: 'Топ-10 фірм яким не давай клієнтів — не платять, зраджують',
      },
      {
        name: 'Бізнес-Шахрай',
        path: '/business-fraud',
        icon: Ghost,
        premium: true,
        hook: 'Судові справи, штрафи, фіктивні угоди партнера — за 1 клік',
      },
      {
        name: 'Тіньовий Кеш',
        path: '/shadow-cash',
        icon: ShieldAlert,
        premium: true,
        hook: 'Shell-компанії, офшори, cash-out — де гроші зникають',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────
     ⑧ УДАР ТА АРТЕФАКТИ — Judicial Weapon
     ───────────────────────────────────────────────────────── */
  {
    title: 'УДАР ТА АРТЕФАКТИ',
    subtitle: 'Досьє у PDF · Суд · Докази · Ексклюзив',
    icon: FileLock2,
    accent: 'violet',
    items: [
      {
        name: 'Готові Звіти (PDF)',
        path: '/reports',
        icon: FileSearch,
        premium: true,
        hook: 'Державний стандарт довідки з печаткою Predator',
      },
      {
        name: 'Доказова База',
        path: '/export',
        icon: FileLock2,
        premium: true,
        hook: 'Збери «пакет удар» для суду чи держорганів',
      },
      {
        name: 'Rozpromo Тендери',
        path: '/tenders',
        icon: FileText,
        hook: 'Спіймай конкурента на фіктивному тендері',
      },
      {
        name: 'Архів Справ',
        path: '/cases',
        icon: FolderOpen,
        hook: 'Твоя історія розслідувань та звітів',
      },
      {
        name: 'Комплаєнс-Пакет',
        path: '/compliance',
        icon: ShieldCheck,
        hook: 'Документи для банку, щоб розблокувати рахунок',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────
     ⑨ ПРЕДАТОР ХАБ — Personal Workspace
     ───────────────────────────────────────────────────────── */
  {
    title: 'ПРЕДАТОР ХАБ',
    subtitle: 'Профіль · Підписка · Інтеграції',
    icon: UserCheck,
    accent: 'slate',
    items: [
      {
        name: 'Хаб Клієнтів',
        path: '/clients',
        icon: Users,
        hook: 'Твоя база контрагентів — швидкий доступ',
      },
      {
        name: 'Досьє Компаній',
        path: '/clients/business',
        icon: Building2,
        premium: true,
        hook: 'Компанії на контролі — статус ризиків одним поглядом',
      },
      {
        name: 'Підписка',
        path: '/subscription',
        icon: Crown,
        hook: 'Розблокувати більше інструментів',
      },
      {
        name: 'Налаштування',
        path: '/settings',
        icon: Settings,
      },
      {
        name: 'Інтеграції',
        path: '/integrations',
        icon: Plug,
        premium: true,
        hook: 'Підключити CRM-систему, Telegram-бот, API',
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────
     ⑩ ЗАВОД СИСТЕМИ (тільки admin) — Technical Kitchen
     ───────────────────────────────────────────────────────── */
  {
    title: 'ЗАВОД СИСТЕМИ',
    subtitle: 'Тільки для розробників',
    icon: Cpu,
    accent: 'slate',
    adminOnly: true,
    items: [
      {
        name: 'Системна Фабрика',
        path: '/system-factory',
        icon: Factory,
        role: 'admin',
        subItems: [
          { name: 'Управління Заводом', path: '/system-factory' },
          { name: 'Студія Факторів', path: '/factory-studio', role: 'admin' },
          { name: 'Автофабрика', path: '/factory' },
        ],
      },
      {
        name: 'Флот Агентів',
        path: '/agents',
        icon: Bot,
        role: 'admin',
        badgeType: 'live',
        subItems: [
          { name: 'Менеджер Агентів', path: '/agents' },
          { name: 'Оркестратор Pipeline', path: '/pipeline' },
          { name: 'Контроль Автономності', path: '/autonomy', role: 'admin' },
        ],
      },
      {
        name: 'Мовні Моделі',
        path: '/llm',
        icon: MessageSquare,
        role: 'admin',
        subItems: [
          { name: 'LLM Консоль', path: '/llm' },
          { name: 'NAS Арена', path: '/llm/nas' },
          { name: 'Системні Промпти', path: '/llm/prompts', role: 'admin' },
          { name: 'Тренування Моделей', path: '/training', role: 'admin' },
          { name: 'Двигуни (Engines)', path: '/engines', role: 'admin' },
        ],
      },
      {
        name: 'Дата Інженерія',
        path: '/data',
        icon: Database,
        role: 'admin',
        subItems: [
          { name: 'Огляд Даних', path: '/data' },
          { name: 'Інджестинг Потоків', path: '/ingestion' },
          { name: 'Парсери & Конектори', path: '/parsers' },
          { name: 'Студія Датасетів', path: '/datasets' },
          { name: 'Менеджер Датасетів', path: '/datasets-manager' },
          { name: 'Адміністрування БД', path: '/databases', role: 'admin' },
        ],
      },
      {
        name: 'Інструменти',
        path: '/builder',
        icon: Wrench,
        role: 'admin',
        subItems: [
          { name: 'Конструктор Дашбордів', path: '/builder' },
          { name: 'Бібліотека Віджетів', path: '/widgets' },
          { name: 'Реєстр Компонентів', path: '/components', role: 'admin' },
          { name: 'API Документація', path: '/api-docs', role: 'admin' },
        ],
      },
      { name: 'AI Прогнози (Dev)', path: '/forecast-view', icon: Radar, role: 'admin' },
      { name: 'Суперінтелект', path: '/super', icon: Rocket, role: 'admin' },
      { name: 'Деплоймент (K8s)', path: '/deployment', icon: Layers, role: 'admin' },
      { name: 'Безпека / Audit Log', path: '/security', icon: Shield, role: 'admin' },
      { name: 'Управління (Governance)', path: '/governance', icon: Landmark, role: 'admin' },
      { name: 'Аналітика Системи', path: '/user-analytics', icon: PanelTop, role: 'admin' },
      { name: 'Верифікація Системи', path: '/verify-system', icon: ShieldCheck, role: 'admin' },
      { name: 'Інженерія Знань', path: '/knowledge', icon: BookOpen, role: 'admin' },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════
   ACCENT COLOR MAPS
   ═══════════════════════════════════════════════════════════════════ */

const accentColorMap: Record<string, string> = {
  indigo: 'text-indigo-400',
  cyan: 'text-cyan-400',
  emerald: 'text-emerald-400',
  violet: 'text-violet-400',
  orange: 'text-orange-400',
  blue: 'text-blue-400',
  amber: 'text-amber-400',
  rose: 'text-rose-400',
  slate: 'text-slate-400',
};

const accentBarMap: Record<string, string> = {
  indigo: 'bg-indigo-500',
  cyan: 'bg-cyan-500',
  emerald: 'bg-emerald-500',
  violet: 'bg-violet-500',
  orange: 'bg-orange-500',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  slate: 'bg-slate-600',
};

const accentGlowMap: Record<string, string> = {
  indigo: 'drop-shadow-[0_0_6px_rgba(129,140,248,0.6)]',
  cyan: 'drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]',
  emerald: 'drop-shadow-[0_0_6px_rgba(52,211,153,0.6)]',
  violet: 'drop-shadow-[0_0_6px_rgba(167,139,250,0.6)]',
  orange: 'drop-shadow-[0_0_6px_rgba(251,146,60,0.6)]',
  blue: 'drop-shadow-[0_0_6px_rgba(96,165,250,0.6)]',
  amber: 'drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]',
  rose: 'drop-shadow-[0_0_6px_rgba(251,113,133,0.6)]',
  slate: 'drop-shadow-[0_0_6px_rgba(148,163,184,0.3)]',
};

const accentBgMap: Record<string, string> = {
  indigo: 'bg-indigo-500/10 border-indigo-500/20',
  cyan: 'bg-cyan-500/10 border-cyan-500/20',
  emerald: 'bg-emerald-500/10 border-emerald-500/20',
  violet: 'bg-violet-500/10 border-violet-500/20',
  orange: 'bg-orange-500/10 border-orange-500/20',
  blue: 'bg-blue-500/10 border-blue-500/20',
  amber: 'bg-amber-500/10 border-amber-500/20',
  rose: 'bg-rose-500/10 border-rose-500/20',
  slate: 'bg-slate-500/10 border-slate-500/20',
};

/* ═══════════════════════════════════════════════════════════════════
   BADGE COMPONENT — Живі лічильники та індикатори
   ═══════════════════════════════════════════════════════════════════ */

const BadgeIndicator = ({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}) => {
  if (!item.badgeType && !item.badge) return null;

  if (item.badgeType === 'live') {
    return (
      <span className="flex items-center gap-1">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
        </span>
        <span className="text-[7px] font-black text-emerald-400 tracking-wider">LIVE</span>
      </span>
    );
  }

  if (item.badgeType === 'pulse') {
    return (
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
      </span>
    );
  }

  if (item.badge && item.badge > 0) {
    const isDanger = item.badgeType === 'danger';
    return (
      <span
        className={cn(
          'text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none',
          isDanger
            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
          isActive && isDanger && 'bg-rose-500/30 border-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
        )}
      >
        {item.badge}
      </span>
    );
  }

  return null;
};

/* ═══════════════════════════════════════════════════════════════════
   SIDEBAR COMPONENT — PREDATOR v55.1
   ═══════════════════════════════════════════════════════════════════ */

export const Sidebar = () => {
  const { isSidebarOpen, userRole } = useAppStore();
  const location = useLocation();
  const navGroups = useMemo(() => buildNavGroups(), []);

  // Авто-визначення активної секції
  const activeGroupTitles = useMemo(() => {
    const titles = new Set<string>();
    for (const group of navGroups) {
      for (const item of group.items) {
        if (location.pathname === item.path) titles.add(group.title);
        if (item.subItems?.some((sub) => location.pathname === sub.path)) titles.add(group.title);
      }
    }
    if (titles.size === 0) titles.add('МІЙ РАДАР');
    return titles;
  }, [location.pathname, navGroups]);

  // Стан розгорнутих секцій
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['ГАЗЕТА', 'МІЙ РАДАР', 'ЦЕНТР СПОВІЩЕНЬ'])
  );
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Авто-розкриття при зміні маршруту
  useEffect(() => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      activeGroupTitles.forEach((t) => next.add(t));
      return next;
    });
  }, [activeGroupTitles]);

  // Перевірка доступу
  const hasAccess = useCallback(
    (item: { role?: 'admin'; premium?: boolean }) => {
      if (item.role === 'admin' && userRole !== UserRole.ADMIN) return false;
      return true;
    },
    [userRole]
  );

  // Перевірка чи група адмін-only і чи є права
  const canSeeGroup = useCallback(
    (group: NavGroup) => {
      if (group.adminOnly && userRole !== UserRole.ADMIN) return false;
      return true;
    },
    [userRole]
  );

  const toggleGroup = useCallback((title: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }, []);

  const toggleItemExpand = useCallback((path: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const isSubItemActive = useCallback(
    (item: NavItem) => {
      return item.subItems?.some((sub) => location.pathname === sub.path) ?? false;
    },
    [location.pathname]
  );

  return (
    <motion.aside
      initial={false}
      animate={{
        width: isSidebarOpen ? SIDEBAR.width.open : SIDEBAR.width.closed,
        transition: SIDEBAR.width.transition,
      }}
      className={cn(
        'fixed left-0 top-0 h-screen flex flex-col',
        'border-r border-cyan-500/10 bg-[#010409]/98 backdrop-blur-3xl',
        'shadow-[20px_0_100px_-40px_rgba(0,0,0,0.9)]',
        'z-[var(--z-sidebar,300)]'
      )}
    >
      {/* ── LOGO ── */}
      <div className="h-16 flex items-center px-5 border-b border-cyan-500/10 shrink-0 group relative overflow-hidden">
        {/* Animated background pulse */}
        <div className="absolute inset-0 bg-cyan-500/5 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="flex items-center gap-4 relative z-10">
          {/* Predator Insignia */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded bg-slate-900 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.2)] group-hover:border-cyan-400 transition-all duration-500">
              <Skull className="text-cyan-400 w-6 h-6 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            </div>
            {/* Online marker */}
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#010409] animate-pulse shadow-[0_0_8px_#10b981]" />
          </div>

          <AnimatePresence mode="wait">
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col min-w-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[16px] font-black text-white tracking-[0.1em] leading-none">
                    PREDATOR
                  </span>
                  <div className="px-1.5 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded text-[7px] font-black text-cyan-400 tracking-widest">v56</div>
                </div>
                <span className="text-[8px] font-black text-slate-500 tracking-[0.35em] uppercase mt-1">
                  NEXUS_PROTOCOL
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── NAVIGATION ── */}
      <div className="flex-1 overflow-y-auto pt-3 pb-6 px-2.5 space-y-3 scrollbar-predator">
        {navGroups.map((group) => {
          // Якщо група тільки для адміна — ховаємо від клієнта
          if (!canSeeGroup(group)) return null;

          const isGroupExpanded = expandedGroups.has(group.title) || !isSidebarOpen;
          const filteredItems = group.items.filter(hasAccess);
          if (filteredItems.length === 0) return null;

          const accentColor = accentColorMap[group.accent ?? 'slate'] ?? 'text-slate-300';
          const accentBar = accentBarMap[group.accent ?? 'slate'] ?? 'bg-slate-600';
          const accentGlow = accentGlowMap[group.accent ?? 'slate'];
          const accentBg = accentBgMap[group.accent ?? 'slate'];

          return (
            <div key={group.title} className="flex flex-col">
              {/* === ЗАГОЛОВОК СЕКЦІЇ === */}
              {isSidebarOpen ? (
                <div className="px-3 mt-6 mb-2 flex items-center gap-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-500/20" />
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-[0.4em] whitespace-nowrap",
                    isGroupExpanded ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" : "text-slate-600"
                  )}>
                    {group.title}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-500/20" />
                </div>
              ) : (
                // Collapsed sidebar — тільки крапка
                <div className="flex justify-center py-4 mb-1 opacity-20 group-hover:opacity-100 transition-opacity">
                  <div className={cn('w-1.5 h-1.5 rounded-full', accentBar)} />
                </div>
              )}

              {/* === ЕЛЕМЕНТИ СЕКЦІЇ === */}
              <AnimatePresence initial={false}>
                {isGroupExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-0.5">
                      {filteredItems.map((item) => {
                        const hasSubItems = item.subItems && item.subItems.length > 0;
                        const isOpen = expandedItems.has(item.path) || isSubItemActive(item);
                        const filteredSubItems = item.subItems?.filter(hasAccess) ?? [];
                        const isActivePrimary =
                          location.pathname === item.path ||
                          (hasSubItems && isSubItemActive(item));

                        return (
                          <div key={item.path} className="flex flex-col">
                            {/* ГОЛОВНИЙ ПУНКТ */}
                            <div className="relative group">
                              <NavLink
                                to={item.path}
                                title={!isSidebarOpen ? item.name : undefined}
                                className={cn(
                                  'relative flex items-center justify-between w-full px-3 py-2.5 rounded transition-all duration-300 border-l-[3px]',
                                  isActivePrimary
                                    ? 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                                    : 'border-transparent hover:bg-white/[0.03] hover:border-white/[0.02]'
                                )}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  {/* Іконка */}
                                  <div
                                    className={cn(
                                      'shrink-0 transition-all duration-300',
                                      isActivePrimary
                                        ? cn(accentColor, accentGlow)
                                        : 'text-slate-600 group-hover:text-slate-400 group-hover:scale-105'
                                    )}
                                  >
                                    <item.icon
                                      className="w-[16px] h-[16px]"
                                      strokeWidth={isActivePrimary ? 2.5 : 2}
                                    />
                                  </div>

                                  {/* Текст + гачок */}
                                  <AnimatePresence mode="wait">
                                    {isSidebarOpen && (
                                      <motion.div
                                        initial={{ opacity: 0, x: -4 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -4 }}
                                        className="flex flex-col min-w-0 flex-1"
                                      >
                                        <span
                                          className={cn(
                                            'text-[12px] font-medium truncate leading-tight',
                                            isActivePrimary
                                              ? 'text-white font-semibold'
                                              : 'text-slate-400 group-hover:text-slate-200'
                                          )}
                                        >
                                          {item.name}
                                        </span>
                                        {/* Гачок-питання — видно тільки при hover або active */}
                                        {item.hook && isSidebarOpen && (
                                          <span
                                            className={cn(
                                              'text-[9px] font-light leading-tight mt-0.5 transition-all duration-300 truncate',
                                              isActivePrimary
                                                ? cn(accentColor, 'opacity-70')
                                                : 'text-slate-600 group-hover:text-slate-500 opacity-0 group-hover:opacity-100'
                                            )}
                                          >
                                            {item.hook}
                                          </span>
                                        )}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>

                                {/* Active Indicator зліва */}
                                {isActivePrimary && (
                                  <motion.div
                                    layoutId="sidebarActiveIndicator"
                                    className={cn(
                                      'absolute left-0 top-[15%] bottom-[15%] w-[3px] rounded-r-md',
                                      accentBar
                                    )}
                                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                                  />
                                )}
                              </NavLink>

                              {/* Badges & Chevron — справа від NavLink */}
                              {isSidebarOpen && (
                                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                                  <BadgeIndicator item={item} isActive={isActivePrimary} />

                                  {item.premium && (
                                    <div className="px-1 py-0.5 rounded flex items-center gap-0.5 bg-amber-500/10 border border-amber-500/20">
                                      <Trophy className="w-2.5 h-2.5 text-amber-500" />
                                      <span className="text-[7px] font-black text-amber-500 tracking-wider">PRO</span>
                                    </div>
                                  )}

                                  {/* Chevron для підменю */}
                                  {hasSubItems && filteredSubItems.length > 0 && (
                                    <button
                                      className="pointer-events-auto p-0.5 rounded hover:bg-white/5 transition-colors"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleItemExpand(item.path);
                                      }}
                                    >
                                      <ChevronRight
                                        className={cn(
                                          'w-3 h-3 transition-transform duration-300',
                                          isActivePrimary ? 'text-white/60' : 'text-slate-600',
                                          isOpen && 'rotate-90'
                                        )}
                                      />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* === ПІДПУНКТИ === */}
                            <AnimatePresence initial={false}>
                              {hasSubItems && isOpen && isSidebarOpen && filteredSubItems.length > 0 && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.18 }}
                                  className="overflow-hidden"
                                >
                                  <div className="ml-[22px] mt-1 mb-2 pl-[16px] border-l border-white/[0.05] flex flex-col gap-0.5">
                                    {filteredSubItems.map((sub) => (
                                      <NavLink
                                        key={sub.path}
                                        to={sub.path}
                                        className={({ isActive }) =>
                                          cn(
                                            'group relative flex items-center gap-2 px-3 py-[6px] rounded-md transition-all duration-200',
                                            isActive
                                              ? cn('bg-white/[0.05]', accentColor)
                                              : 'text-slate-600 hover:text-slate-300 hover:bg-white/[0.02]'
                                          )
                                        }
                                      >
                                        {({ isActive }) => (
                                          <>
                                            <div
                                              className={cn(
                                                'absolute left-[-16px] top-1/2 w-[12px] border-t transition-colors duration-300',
                                                isActive
                                                  ? accentBar.replace('bg-', 'border-')
                                                  : 'border-white/[0.05] group-hover:border-white/15'
                                              )}
                                            />
                                            <div
                                              className={cn(
                                                'w-[4px] h-[4px] rounded-full shrink-0 transition-all duration-300',
                                                isActive
                                                  ? cn(accentBar, 'shadow-[0_0_5px_currentColor]')
                                                  : 'bg-transparent border border-white/15 group-hover:border-white/40'
                                              )}
                                            />
                                            <span
                                              className={cn(
                                                'text-[11px] truncate transition-colors duration-200',
                                                isActive ? 'font-semibold' : 'font-medium'
                                              )}
                                            >
                                              {sub.name}
                                            </span>
                                            {sub.role === 'admin' && (
                                              <Lock className="w-2.5 h-2.5 text-rose-500/60 ml-auto shrink-0" />
                                            )}
                                          </>
                                        )}
                                      </NavLink>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* ── STATUS FOOTER ── */}
      <div className="p-4 border-t border-cyan-500/10 bg-black/40 shrink-0">
        <div
          className={cn(
            'flex items-center gap-3',
            isSidebarOpen ? 'justify-between' : 'justify-center'
          )}
        >
          <div className="flex items-center gap-3">
            {/* Пульсуючий онлайн-індикатор */}
            <div className="relative group/status cursor-help" title="Системна діагностика: OK">
              <div className={cn("w-2.5 h-2.5 rounded-full transition-colors", userRole === UserRole.ADMIN ? "bg-rose-500" : "bg-cyan-500")} />
              <div className={cn("absolute inset-0 w-2.5 h-2.5 rounded-full blur-[4px] opacity-60 animate-pulse", userRole === UserRole.ADMIN ? "bg-rose-500" : "bg-cyan-500")} />
            </div>

            <AnimatePresence mode="wait">
              {isSidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col"
                >
                  <span className="text-[9px] font-black text-white/90 uppercase tracking-[0.2em] leading-none mb-0.5">
                    {userRole === UserRole.ADMIN ? 'ROOT_ACCESS' : 'USER_ONLINE'}
                  </span>
                  <span className="text-[7px] font-black text-cyan-500/40 tracking-[0.1em] uppercase">
                    v56_NEXUS_MASTER
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {isSidebarOpen && (
             <div 
               className={cn(
                 "px-2 py-0.5 rounded border text-[7px] font-black uppercase tracking-widest transition-all",
                 userRole === UserRole.ADMIN 
                   ? "bg-rose-950/30 border-rose-500/40 text-rose-400" 
                   : "bg-cyan-950/30 border-cyan-500/40 text-cyan-400"
               )}
             >
               {userRole === UserRole.ADMIN ? 'ENFORCEMENT' : 'ANALYST'}
             </div>
          )}
        </div>

        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-white/5 space-y-2"
            >
              <div className="flex justify-between items-center">
                <span className="text-[7px] text-slate-600 uppercase tracking-widest font-black">Оператор</span>
                <span className="text-[9px] text-slate-300 font-bold tracking-tight">D. Kizima</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[7px] text-slate-600 uppercase tracking-widest font-black">Статус</span>
                <span className="text-[8px] text-cyan-500 font-mono animate-pulse">AUTORIZED_OK</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
};
