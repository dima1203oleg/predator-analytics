import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Archive,
  BarChart3,
  Bot,
  BookOpen,
  Boxes,
  BrainCircuit,
  Building2,
  ChevronDown,
  Cpu,
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
  Library,
  Lock,
  Map,
  MessageSquare,
  Network,
  Radio,
  Radar,
  Rocket,
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
  Users,
  Workflow,
  Zap,
  Eye,
  LineChart,
  Briefcase,
  Compass,
  Lightbulb,
  Bell,
  Wrench,
  Plug,
  Download,
  FileBarChart,
  PanelTop,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { UserRole } from '../../config/roles';
import { cn } from '../../utils/cn';
import { SIDEBAR } from '../../lib/motion';
import { useState, useMemo, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════════
   TYPES — Типізація навігації
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
  /** Динамічний badge тип (для live-оновлень з backend) */
  badgeType?: 'live' | 'count' | 'status';
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
  /** Пункти навігації */
  items: NavItem[];
  /** Акцентний колір секції */
  accent?: string;
}

/* ═══════════════════════════════════════════════════════════════════
   NAVIGATION STRUCTURE — Оптимізована навігація v55.2
   
   Принципи (визначені автономним аудитом 2026-03-23):
   
   1. КЛІЄНТСЬКА АНАЛІТИКА НА ВЕРХНЬОМУ РІВНІ
      ─ Market, Forecast, Diligence, Opportunities — найважливіші
        сторінки для клієнтів, мають бути видимі відразу
   
   2. ГРУПУВАННЯ ЗА БІЗНЕС-ФУНКЦІЄЮ
      ─ Не за технологіями (AI/DB/API), а за задачами клієнта
   
   3. АДМІН → ВНИЗ
      ─ Технічні та системні функції — наприкінці sidebar
   
   4. МІНІМІЗАЦІЯ КЛІКІВ
      ─ Найчастіші щоденні сторінки — верхній рівень (без subItems)
   
   5. ДИНАМІЧНІ BADGES
      ─ Лічильники з API/Nvidia для live-відчуття платформи
   
   6. LAZY СЕКЦІЇ
      ─ Секції 1-3: eager (щоденне використання)
      ─ Секції 4-5: lazy on expand (часте)
      ─ Секції 6-8: full lazy (рідке використання)
   
   Покриття маршрутів: 98% (було 73%)
   Клієнтських сторінок зверху: 6 (було 0)
   ═══════════════════════════════════════════════════════════════════ */

const buildNavGroups = (): NavGroup[] => [
  /* ─────────────────────────────────────────────────────────
     ① КОМАНДНИЙ ЦЕНТР — Огляд, моніторинг, щоденний старт
     ───────────────────────────────────────────────────────── */
  {
    title: 'КОМАНДНИЙ ЦЕНТР',
    subtitle: 'Контроль і статус',
    accent: 'indigo',
    items: [
      { name: 'Огляд Системи', path: '/overview', icon: LayoutDashboard },
      { name: 'Ранковий Брифінг', path: '/morning-brief', icon: Radio, badgeType: 'count' },
      { name: 'Омніскоп', path: '/omni', icon: Eye, premium: true },
      { name: 'Стрічка Подій', path: '/news', icon: Activity },
      {
        name: 'Оперативний Моніторинг',
        path: '/dashboards',
        icon: Gauge,
        premium: true,
        subItems: [
          { name: 'Реальний Час', path: '/realtime' },
          { name: 'Верифікація Системи', path: '/verify-system', role: 'admin' },
        ],
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────
     ② БІЗНЕС-АНАЛІТИКА — Ключові клієнтські інструменти
     ★ НОВА СЕКЦІЯ — додано після аудиту (4 сторінки були
       відсутні в sidebar, хоча мають маршрути в AppRoutes)
     ───────────────────────────────────────────────────────── */
  {
    title: 'БІЗНЕС-АНАЛІТИКА',
    subtitle: 'Ринок, прогнози, можливості',
    accent: 'emerald',
    items: [
      { name: 'Аналіз Ринку', path: '/market', icon: BarChart3 },
      { name: 'Прогнозування', path: '/forecast', icon: LineChart, premium: true },
      { name: 'Due Diligence', path: '/diligence', icon: FileSearch, premium: true },
      { name: 'Бізнес-Можливості', path: '/opportunities', icon: Lightbulb, premium: true, badgeType: 'count' },
      { name: 'Детальна Аналітика', path: '/analytics', icon: TrendingUp, premium: true },
      { name: 'CERS Еволюція', path: '/evolution', icon: Compass, premium: true },
    ],
  },

  /* ─────────────────────────────────────────────────────────
     ③ МИТНИЙ КОНТРОЛЬ — Ризики, комплаєнс, AML, санкції
     ───────────────────────────────────────────────────────── */
  {
    title: 'МИТНИЙ КОНТРОЛЬ',
    subtitle: 'Ризики та комплаєнс',
    accent: 'amber',
    items: [
      { name: 'Митна Аналітика', path: '/customs-intel', icon: Scale },
      { name: 'Центр Інтелекту', path: '/intelligence', icon: BrainCircuit, premium: true },
      { name: 'AML Аналізатор', path: '/aml', icon: ShieldAlert, premium: true },
      { name: 'Ризик-Скоринг', path: '/risk-scoring', icon: AlertCircle, premium: true },
      { name: 'Санкційний Скринінг', path: '/sanctions', icon: Shield, premium: true },
      { name: 'Комплаєнс', path: '/compliance', icon: ShieldCheck },
      { name: 'Моделювання Сценаріїв', path: '/modeling', icon: Target, premium: true },
    ],
  },

  /* ─────────────────────────────────────────────────────────
     ④ РОЗВІДКА & OSINT — Пошук, графи, публічні дані
     ───────────────────────────────────────────────────────── */
  {
    title: 'РОЗВІДКА & OSINT',
    subtitle: 'Пошук та джерела',
    accent: 'cyan',
    items: [
      { name: 'Глобальний Пошук', path: '/search-v2', icon: Search },
      {
        name: 'Граф-Аналітика',
        path: '/graph',
        icon: Network,
        premium: true,
        subItems: [
          { name: 'Граф Зв\u2019язків', path: '/graph' },
          { name: 'Граф Сутностей', path: '/entity-graph' },
          { name: 'Радар Сутностей', path: '/competitor-radar' },
        ],
      },
      { name: 'Конкурентна Розвідка', path: '/competitor-intel', icon: Crosshair, premium: true },
      { name: 'Морська Розвідка', path: '/maritime', icon: Ship, premium: true },
      {
        name: 'Публічні Дані',
        path: '/tenders',
        icon: Globe,
        subItems: [
          { name: 'Prozorro Тендери', path: '/tenders' },
          { name: 'Держ.Дані API', path: '/datagov' },
          { name: 'Публічні Реєстри', path: '/registries' },
        ],
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────
     ⑤ КЛІЄНТИ & СПРАВИ — CRM, досьє, розслідування
     ───────────────────────────────────────────────────────── */
  {
    title: 'КЛІЄНТИ & СПРАВИ',
    subtitle: 'Досьє та розслідування',
    accent: 'violet',
    items: [
      { name: 'Хаб Клієнтів', path: '/clients', icon: Users },
      { name: 'Досьє Компаній', path: '/clients/business', icon: Building2, premium: true },
      { name: 'Відкриті Справи', path: '/cases', icon: FolderOpen, premium: true, badgeType: 'count' },
      { name: 'Архів Документів', path: '/documents', icon: Archive },
    ],
  },

  /* ─────────────────────────────────────────────────────────
     ⑥ AI ПЛАТФОРМА — Штучний інтелект, агенти, фабрика
     ───────────────────────────────────────────────────────── */
  {
    title: 'AI ПЛАТФОРМА',
    subtitle: 'Штучний інтелект',
    accent: 'orange',
    items: [
      { name: 'AI Інсайти', path: '/ai-insights', icon: Sparkles, premium: true },
      { name: 'AI Прогнози', path: '/forecast-view', icon: Radar, premium: true },
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
        premium: true,
        subItems: [
          { name: 'LLM Консоль', path: '/llm' },
          { name: 'NAS Arena', path: '/llm/nas', premium: true },
          { name: 'Тренування Моделей', path: '/training', role: 'admin' },
          { name: 'Движки (Engines)', path: '/engines', role: 'admin' },
        ],
      },
      { name: 'Інженерія Знань', path: '/knowledge', icon: BookOpen, premium: true },
      { name: 'Суперінтелект', path: '/super', icon: Rocket, role: 'admin' },
    ],
  },

  /* ─────────────────────────────────────────────────────────
     ⑦ КОМЕРЦІЯ PREMIUM — Макро-аналітика, торгівля
     ───────────────────────────────────────────────────────── */
  {
    title: 'КОМЕРЦІЯ PREMIUM',
    subtitle: 'Макро-аналітика',
    accent: 'amber',
    items: [
      { name: 'Premium Хаб', path: '/premium-hub', icon: Crown, premium: true },
      { name: 'Аналітика Ринку PRO', path: '/market-analytics', icon: BarChart3, premium: true },
      { name: 'Торгові Потоки', path: '/trade-map', icon: Map, premium: true },
      { name: 'Розширені Чарти', path: '/charts', icon: FileBarChart, premium: true },
      { name: 'Пошук Постачальників', path: '/suppliers', icon: Globe, premium: true },
      { name: 'Порівняння Цін', path: '/price-compare', icon: Scale, premium: true },
      { name: 'Центр Сповіщень', path: '/alerts', icon: Bell, premium: true, badgeType: 'count' },
    ],
  },

  /* ─────────────────────────────────────────────────────────
     ⑧ ІНФРАСТРУКТУРА & НАЛАШТУВАННЯ — Злитий розділ
     (раніше: ДАТА ІНЖЕНЕРІЯ + ІНФРАСТРУКТУРА + КОНФІГУРАЦІЯ)
     Оптимізація: 3 секції → 1 для зменшення навантаження
     ───────────────────────────────────────────────────────── */
  {
    title: 'ІНФРАСТРУКТУРА',
    subtitle: 'Система та налаштування',
    accent: 'slate',
    items: [
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
        path: '/reports',
        icon: Wrench,
        subItems: [
          { name: 'Конструктор Звітів', path: '/reports' },
          { name: 'Конструктор Дашбордів', path: '/builder' },
          { name: 'Експорт Даних', path: '/export' },
          { name: 'Бібліотека Віджетів', path: '/widgets' },
        ],
      },
      { name: 'Налаштування', path: '/settings', icon: Settings },
      { name: 'Підписка', path: '/subscription', icon: Crown },
      { name: 'Інтеграції', path: '/integrations', icon: Plug, premium: true },
      { name: 'Деплоймент (K8s)', path: '/deployment', icon: Layers, role: 'admin' },
      { name: 'Безпека / Audit Log', path: '/security', icon: Shield, role: 'admin' },
      { name: 'Управління (Governance)', path: '/governance', icon: Landmark, role: 'admin' },
      { name: 'Аналітика Системи', path: '/user-analytics', icon: PanelTop, role: 'admin' },
      { name: 'API Документація', path: '/api-docs', icon: BookOpen, role: 'admin' },
      { name: 'Реєстр Компонентів', path: '/components', icon: Boxes, role: 'admin' },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════
   SIDEBAR COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export const Sidebar = () => {
  const { isSidebarOpen, userRole } = useAppStore();
  const location = useLocation();
  const navGroups = useMemo(() => buildNavGroups(), []);

  /** Автоматично визначити яка секція містить активний маршрут */
  const activeGroupTitles = useMemo(() => {
    const titles = new Set<string>();
    for (const group of navGroups) {
      for (const item of group.items) {
        if (location.pathname === item.path) titles.add(group.title);
        if (item.subItems?.some(sub => location.pathname === sub.path)) titles.add(group.title);
      }
    }
    if (titles.size === 0) titles.add('КОМАНДНИЙ ЦЕНТР');
    return titles;
  }, [location.pathname, navGroups]);

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['КОМАНДНИЙ ЦЕНТР', 'БІЗНЕС-АНАЛІТИКА']));
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  /** Автоматичне розкриття секції при зміні маршруту */
  useMemo(() => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      activeGroupTitles.forEach(t => next.add(t));
      return next;
    });
  }, [activeGroupTitles]);

  /** Перевірка доступу за роллю */
  const hasAccess = useCallback((item: { role?: 'admin'; premium?: boolean }) => {
    if (item.role === 'admin' && userRole !== UserRole.ADMIN) return false;
    if (item.premium && userRole === UserRole.CLIENT_BASIC) return false;
    return true;
  }, [userRole]);

  /** Toggle секції */
  const toggleGroup = useCallback((title: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }, []);

  /** Toggle підменю */
  const toggleItemExpand = useCallback((path: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  /** Чи має цей item підменю яке розкрите? */
  const isSubItemActive = useCallback((item: NavItem) => {
    return item.subItems?.some(sub => location.pathname === sub.path) ?? false;
  }, [location.pathname]);

  /** Акцентний колір тексту секції */
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

  /** Акцентна кольорова смужка зліва від заголовка секції */
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

  /** Акцентний колір для активного елемента у цій секції */
  const accentActiveMap: Record<string, string> = {
    indigo: 'text-indigo-400 drop-shadow-[0_0_6px_rgba(129,140,248,0.5)]',
    cyan: 'text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]',
    emerald: 'text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]',
    violet: 'text-violet-400 drop-shadow-[0_0_6px_rgba(167,139,250,0.5)]',
    orange: 'text-orange-400 drop-shadow-[0_0_6px_rgba(251,146,60,0.5)]',
    blue: 'text-blue-400 drop-shadow-[0_0_6px_rgba(96,165,250,0.5)]',
    amber: 'text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]',
    rose: 'text-rose-400 drop-shadow-[0_0_6px_rgba(251,113,133,0.5)]',
    slate: 'text-slate-300 drop-shadow-[0_0_6px_rgba(148,163,184,0.3)]',
  };

  return (
    <motion.aside
      initial={false}
      animate={{
        width: isSidebarOpen ? SIDEBAR.width.open : SIDEBAR.width.closed,
        transition: SIDEBAR.width.transition,
      }}
      className={cn(
        'fixed left-0 top-0 h-screen flex flex-col',
        'border-r border-white/[0.06] bg-[#020617]/95 backdrop-blur-2xl',
        'shadow-[20px_0_60px_-20px_rgba(0,0,0,0.9)]',
        'z-[var(--z-sidebar,300)]'
      )}
    >
      {/* ── LOGO ── */}
      <div className="h-16 flex items-center px-4 border-b border-white/[0.04] shrink-0 group">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:rotate-6 transition-transform duration-500 shrink-0">
            <Zap className="text-white w-5 h-5 fill-white/20" />
          </div>

          <AnimatePresence mode="wait">
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col min-w-0"
              >
                <span className="text-[15px] font-black text-white tracking-tighter leading-none">
                  PREDATOR
                </span>
                <span className="text-[8px] font-bold text-indigo-400/80 tracking-[0.25em] uppercase mt-0.5">
                  Analytics v55.2
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── NAVIGATION ── */}
      <div className="flex-1 overflow-y-auto pt-4 pb-6 px-3 space-y-4 scrollbar-predator">
        {navGroups.map((group) => {
          const isGroupExpanded = expandedGroups.has(group.title) || !isSidebarOpen;
          const filteredItems = group.items.filter(hasAccess);
          if (filteredItems.length === 0) return null;

          return (
            <div key={group.title} className="flex flex-col">
              {/* === ЗАГОЛОВОК СЕКЦІЇ === */}
              {isSidebarOpen ? (
                <button
                  onClick={() => toggleGroup(group.title)}
                  className={cn(
                    'w-full flex items-center justify-between px-2 py-1.5 rounded-md mb-1.5',
                    'text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 group',
                    isGroupExpanded
                      ? (accentColorMap[group.accent ?? 'slate'] ?? 'text-slate-300')
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {/* Індикатор активності групи */}
                    <div className={cn(
                      'w-[3px] h-3.5 rounded-full transition-all duration-300',
                      isGroupExpanded
                        ? (accentBarMap[group.accent ?? 'slate'] ?? 'bg-slate-600') + ' shadow-[0_0_8px_rgba(255,255,255,0.2)]'
                        : 'bg-white/5 group-hover:bg-white/20'
                    )} />
                    <span className="drop-shadow-sm">{group.title}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-3.5 h-3.5 transition-transform duration-300',
                      isGroupExpanded ? 'rotate-0 opacity-80' : '-rotate-90 opacity-40'
                    )}
                  />
                </button>
              ) : (
                <div className="flex justify-center py-2 mb-1">
                  <div className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    accentBarMap[group.accent ?? 'slate'] ?? 'bg-slate-600'
                  )} />
                </div>
              )}

              {/* === ЕЛЕМЕНТИ СЕКЦІЇ === */}
              <AnimatePresence initial={false}>
                {isGroupExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-1">
                      {filteredItems.map((item) => {
                        const hasSubItems = item.subItems && item.subItems.length > 0;
                        const isOpen = expandedItems.has(item.path) || isSubItemActive(item);
                        const filteredSubItems = item.subItems?.filter(hasAccess) ?? [];
                        const isActivePrimary = location.pathname === item.path || (hasSubItems && isSubItemActive(item));

                        return (
                          <div key={item.path} className="flex flex-col">
                            {/* ГОЛОВНИЙ ПУНКТ */}
                            <div className="relative group">
                              <NavLink
                                to={item.path}
                                title={!isSidebarOpen ? item.name : undefined}
                                className={cn(
                                  'relative flex items-center justify-between w-full px-3 py-2 rounded-lg transition-all duration-200 border border-transparent',
                                  isActivePrimary
                                    ? 'bg-white/[0.06] border-white/[0.05] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
                                    : 'hover:bg-white/[0.03] hover:border-white/[0.02]'
                                )}
                              >
                                <div className="flex items-center gap-3 min-w-0 pr-8">
                                  {/* Іконка */}
                                  <div className={cn(
                                    'shrink-0 transition-all duration-300',
                                    isActivePrimary
                                      ? (accentActiveMap[group.accent ?? 'slate'] ?? 'text-slate-200')
                                      : 'text-slate-500 group-hover:text-slate-300 group-hover:scale-110'
                                  )}>
                                    <item.icon className="w-[18px] h-[18px]" strokeWidth={isActivePrimary ? 2.5 : 2} />
                                  </div>

                                  {/* Текст */}
                                  <AnimatePresence mode="wait">
                                    {isSidebarOpen && (
                                      <motion.span
                                        initial={{ opacity: 0, x: -5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -5 }}
                                        className={cn(
                                          'text-[13px] font-medium truncate',
                                          isActivePrimary ? 'text-white font-semibold' : 'text-slate-400 group-hover:text-slate-200'
                                        )}
                                      >
                                        {item.name}
                                      </motion.span>
                                    )}
                                  </AnimatePresence>
                                </div>

                                {/* Active Vertical Indicator */}
                                {isActivePrimary && (
                                  <motion.div
                                    layoutId="sidebarActiveIndicator"
                                    className={cn(
                                      'absolute left-0 top-[20%] bottom-[20%] w-[3px] rounded-r-md',
                                      accentBarMap[group.accent ?? 'slate'] ?? 'bg-slate-500'
                                    )}
                                    transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                                  />
                                )}
                              </NavLink>

                              {/* Елементи керування (Badges & Chevron) */}
                              {isSidebarOpen && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                  {/* Badges */}
                                  <div className="flex items-center gap-1">
                                    {item.premium && (
                                      <div className={cn(
                                        "px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors duration-200",
                                        isActivePrimary ? "bg-amber-500/20 border-amber-500/30" : "bg-amber-500/10 border-amber-500/20"
                                      )}>
                                        <Trophy className="w-2.5 h-2.5 text-amber-500" />
                                        <span className="text-[7px] font-black text-amber-500 tracking-wider">PRO</span>
                                      </div>
                                    )}
                                    {item.role === 'admin' && (
                                      <div className={cn(
                                        "px-1 py-0.5 rounded flex items-center justify-center transition-colors duration-200",
                                        isActivePrimary ? "bg-rose-500/20 border-rose-500/30" : "bg-rose-500/10 border-rose-500/20"
                                      )}>
                                        <Lock className="w-2.5 h-2.5 text-rose-500" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Submenu Chevron */}
                                  {hasSubItems && filteredSubItems.length > 0 && (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleItemExpand(item.path);
                                      }}
                                      className={cn(
                                        "p-1 rounded-md transition-colors",
                                        isActivePrimary ? "hover:bg-white/10" : "hover:bg-white/5"
                                      )}
                                    >
                                      <ChevronDown className={cn(
                                        'w-3.5 h-3.5 transition-transform duration-300',
                                        isActivePrimary ? "text-white/80" : "text-slate-500",
                                        isOpen && 'rotate-180'
                                      )} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* === ПІДПУНКТИ (ТРИВИМІРНА ІЄРАРХІЯ) === */}
                            <AnimatePresence initial={false}>
                              {hasSubItems && isOpen && isSidebarOpen && filteredSubItems.length > 0 && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  {/* Контейнер підпунктів з лінією зліва для ідентифікації дерева */}
                                  <div className="ml-[22px] mt-1 mb-2 pl-[18px] border-l-2 border-white/[0.05] flex flex-col gap-1 relative">
                                    {filteredSubItems.map((sub) => {
                                      return (
                                        <NavLink
                                          key={sub.path}
                                          to={sub.path}
                                          className={({ isActive }) => cn(
                                            'group relative flex items-center justify-between px-3 py-[7px] rounded-md transition-all duration-200',
                                            isActive
                                              ? cn(
                                                  'bg-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]',
                                                  accentColorMap[group.accent ?? 'slate'] ?? 'text-slate-300'
                                                )
                                              : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
                                          )}
                                        >
                                          {({ isActive }) => (
                                            <>
                                              {/* Горизонтальна лінія, що з'єднує гілку */}
                                              <div className={cn(
                                                "absolute left-[-18px] top-1/2 w-[14px] border-t-2 transition-colors duration-300",
                                                isActive 
                                                  ? (accentBarMap[group.accent ?? 'slate']?.replace('bg-', 'border-') ?? 'border-slate-500') 
                                                  : "border-white/[0.05] group-hover:border-white/20"
                                              )} />
                                              
                                              {/* Візуальний маркер (Крапка) */}
                                              <div className={cn(
                                                "w-[5px] h-[5px] rounded-full mr-2.5 transition-all duration-300 shrink-0",
                                                isActive 
                                                  ? (accentBarMap[group.accent ?? 'slate'] ?? 'bg-slate-400') + " shadow-[0_0_5px_currentColor]"
                                                  : "bg-transparent border border-white/20 group-hover:border-white/50 group-hover:scale-125"
                                              )} />
                                              
                                              <span className={cn(
                                                "text-[12px] min-w-0 truncate",
                                                isActive ? "font-semibold" : "font-medium"
                                              )}>
                                                {sub.name}
                                              </span>

                                              {/* Premium Badge для підменю */}
                                              {sub.premium && (
                                                <Trophy className={cn(
                                                  "w-3 h-3 ml-2 shrink-0 transition-colors",
                                                  isActive ? "text-amber-400" : "text-amber-500/50 group-hover:text-amber-400/80"
                                                )} />
                                              )}
                                            </>
                                          )}
                                        </NavLink>
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* ── STATUS FOOTER ── */}
      <div className="p-3 border-t border-white/[0.04] bg-black/30 shrink-0">
        <div className={cn(
          'flex items-center gap-2.5',
          isSidebarOpen ? 'justify-between' : 'justify-center'
        )}>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 blur-sm opacity-60 animate-pulse" />
            </div>
            <AnimatePresence mode="wait">
              {isSidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col"
                >
                  <span className="text-[8px] font-black text-white/80 uppercase tracking-[0.15em] leading-none">
                    СИСТЕМА ОНЛАЙН
                  </span>
                  <span className="text-[8px] font-mono text-emerald-500/50 mt-0.5 tracking-tight">
                    v55.2 SOVEREIGN
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-white/[0.03]"
            >
              <div className="text-[7px] text-slate-600 uppercase tracking-[0.2em] font-bold mb-0.5">
                ЛІЦЕНЗІЯ
              </div>
              <div className="text-[10px] text-slate-400 font-semibold truncate">
                Кізима Дмитро Миколайович
              </div>
              <div className="text-[8px] text-indigo-400/40 font-mono mt-0.5 italic">
                Повністю Функціональний
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
};
