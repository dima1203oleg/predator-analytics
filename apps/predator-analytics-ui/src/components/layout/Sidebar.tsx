import { Button } from '@/components/ui/button';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAtom } from 'jotai';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Command,
  Lock,
  LogOut,
  Search,
  Shield,
  Star,
  User,
  X,
} from 'lucide-react';
import { isSidebarOpenAtom, sidebarSearchAtom, colabPanelOpenAtom } from '../../store/atoms';
import { useUser } from '../../context/UserContext';
import { UserRole, resolveUserRole } from '../../config/roles';
import { Logo } from '../Logo';
import {
  getGlobalNavigationActions,
  getNavigationTotals,
  getVisibleNavigation,
  isNavItemLocked,
  navAccentStyles,
  type NavSection,
  resolveNavigationAudience,
  type NavWorkspaceMode,
  getAccessStatusIndicator,
  type AccessLevel,
} from '../../config/navigation';
import { useBackendStatus } from '../../hooks/useBackendStatus';
import { useShellWorkspace } from '../../hooks/useShellWorkspace';
import { cn } from '../../lib/utils';

const COLLAPSED_STORAGE_KEY = 'predator-nav-collapsed';

// Кольорова система для кожного розділу — максимальна візуальна відмінність
const sectionColorMap: Record<string, {
  bg: string;
  border: string;
  headerBg: string;
  headerText: string;
  dotColor: string;
  glowColor: string;
  activeItemBg: string;
  activeItemBorder: string;
  activeIconBg: string;
  activeIconColor: string;
  activeIndicator: string;
  hoverBg: string;
}> = {
  rose: {
    bg: 'rgba(225,29,72,0.1)',
    border: 'rgba(225,29,72,0.3)',
    headerBg: 'rgba(225,29,72,0.15)',
    headerText: '#ff4d7d',
    dotColor: '#ff0040',
    glowColor: 'rgba(255,0,64,0.6)',
    activeItemBg: 'rgba(225,29,72,0.2)',
    activeItemBorder: 'rgba(225,29,72,0.4)',
    activeIconBg: 'rgba(225,29,72,0.3)',
    activeIconColor: '#ff4d7d',
    activeIndicator: 'from-rose-500 to-rose-400/20',
    hoverBg: 'rgba(225,29,72,0.12)',
  },
  gold: {
    bg: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.25)',
    headerBg: 'rgba(251,191,36,0.12)',
    headerText: '#fbbf24',
    dotColor: '#f59e0b',
    glowColor: 'rgba(251,191,36,0.5)',
    activeItemBg: 'rgba(251,191,36,0.15)',
    activeItemBorder: 'rgba(251,191,36,0.35)',
    activeIconBg: 'rgba(251,191,36,0.2)',
    activeIconColor: '#fbbf24',
    activeIndicator: 'from-amber-400 to-amber-400/20',
    hoverBg: 'rgba(251,191,36,0.1)',
  },
  amber: {
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.3)',
    headerBg: 'rgba(245,158,11,0.15)',
    headerText: '#f59e0b',
    dotColor: '#d97706',
    glowColor: 'rgba(245,158,11,0.6)',
    activeItemBg: 'rgba(245,158,11,0.2)',
    activeItemBorder: 'rgba(245,158,11,0.4)',
    activeIconBg: 'rgba(245,158,11,0.3)',
    activeIconColor: '#f59e0b',
    activeIndicator: 'from-amber-600 to-amber-400/20',
    hoverBg: 'rgba(245,158,11,0.12)',
  },
  warn: {
    bg: 'rgba(234,88,12,0.08)',
    border: 'rgba(234,88,12,0.25)',
    headerBg: 'rgba(234,88,12,0.12)',
    headerText: '#fb923c',
    dotColor: '#ea580c',
    glowColor: 'rgba(234,88,12,0.5)',
    activeItemBg: 'rgba(234,88,12,0.15)',
    activeItemBorder: 'rgba(234,88,12,0.35)',
    activeIconBg: 'rgba(234,88,12,0.2)',
    activeIconColor: '#fb923c',
    activeIndicator: 'from-orange-500 to-orange-400/20',
    hoverBg: 'rgba(234,88,12,0.1)',
  },
  emerald: {
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.25)',
    headerBg: 'rgba(16,185,129,0.12)',
    headerText: '#34d399',
    dotColor: '#10b981',
    glowColor: 'rgba(16,185,129,0.5)',
    activeItemBg: 'rgba(16,185,129,0.15)',
    activeItemBorder: 'rgba(16,185,129,0.35)',
    activeIconBg: 'rgba(16,185,129,0.2)',
    activeIconColor: '#34d399',
    activeIndicator: 'from-emerald-500 to-emerald-400/20',
    hoverBg: 'rgba(16,185,129,0.1)',
  },
  sky: {
    bg: 'rgba(14,165,233,0.08)',
    border: 'rgba(14,165,233,0.25)',
    headerBg: 'rgba(14,165,233,0.12)',
    headerText: '#38bdf8',
    dotColor: '#0ea5e9',
    glowColor: 'rgba(14,165,233,0.5)',
    activeItemBg: 'rgba(14,165,233,0.15)',
    activeItemBorder: 'rgba(14,165,233,0.35)',
    activeIconBg: 'rgba(14,165,233,0.2)',
    activeIconColor: '#38bdf8',
    activeIndicator: 'from-sky-500 to-sky-400/20',
    hoverBg: 'rgba(14,165,233,0.1)',
  },
  blue: {
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.25)',
    headerBg: 'rgba(59,130,246,0.12)',
    headerText: '#60a5fa',
    dotColor: '#3b82f6',
    glowColor: 'rgba(59,130,246,0.5)',
    activeItemBg: 'rgba(59,130,246,0.15)',
    activeItemBorder: 'rgba(59,130,246,0.35)',
    activeIconBg: 'rgba(59,130,246,0.2)',
    activeIconColor: '#60a5fa',
    activeIndicator: 'from-blue-500 to-blue-400/20',
    hoverBg: 'rgba(59,130,246,0.1)',
  },
  indigo: {
    bg: 'rgba(99,102,241,0.08)',
    border: 'rgba(99,102,241,0.25)',
    headerBg: 'rgba(99,102,241,0.12)',
    headerText: '#818cf8',
    dotColor: '#6366f1',
    glowColor: 'rgba(99,102,241,0.5)',
    activeItemBg: 'rgba(99,102,241,0.15)',
    activeItemBorder: 'rgba(99,102,241,0.35)',
    activeIconBg: 'rgba(99,102,241,0.2)',
    activeIconColor: '#818cf8',
    activeIndicator: 'from-indigo-500 to-indigo-400/20',
    hoverBg: 'rgba(99,102,241,0.1)',
  },
  violet: {
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.25)',
    headerBg: 'rgba(139,92,246,0.12)',
    headerText: '#a78bfa',
    dotColor: '#8b5cf6',
    glowColor: 'rgba(139,92,246,0.5)',
    activeItemBg: 'rgba(139,92,246,0.15)',
    activeItemBorder: 'rgba(139,92,246,0.35)',
    activeIconBg: 'rgba(139,92,246,0.2)',
    activeIconColor: '#a78bfa',
    activeIndicator: 'from-violet-500 to-violet-400/20',
    hoverBg: 'rgba(139,92,246,0.1)',
  },
  cyan: {
    bg: 'rgba(6,182,212,0.08)',
    border: 'rgba(6,182,212,0.25)',
    headerBg: 'rgba(6,182,212,0.12)',
    headerText: '#22d3ee',
    dotColor: '#06b6d4',
    glowColor: 'rgba(6,182,212,0.5)',
    activeItemBg: 'rgba(6,182,212,0.15)',
    activeItemBorder: 'rgba(6,182,212,0.35)',
    activeIconBg: 'rgba(6,182,212,0.2)',
    activeIconColor: '#22d3ee',
    activeIndicator: 'from-cyan-500 to-cyan-400/20',
    hoverBg: 'rgba(6,182,212,0.1)',
  },
  slate: {
    bg: 'rgba(148,163,184,0.08)',
    border: 'rgba(148,163,184,0.25)',
    headerBg: 'rgba(148,163,184,0.12)',
    headerText: '#e2e8f0',
    dotColor: '#94a3b8',
    glowColor: 'rgba(148,163,184,0.4)',
    activeItemBg: 'rgba(148,163,184,0.15)',
    activeItemBorder: 'rgba(148,163,184,0.35)',
    activeIconBg: 'rgba(148,163,184,0.2)',
    activeIconColor: '#e2e8f0',
    activeIndicator: 'from-slate-400 to-slate-400/20',
    hoverBg: 'rgba(148,163,184,0.1)',
  },
};

// Компонент для відображення преміальних індикаторів доступу (орбів)
const AccessOrb: React.FC<{
  level: AccessLevel | undefined;
  userRole: string;
  className?: string;
  collapsed?: boolean;
}> = ({ level, userRole, className, collapsed = false }) => {
  const { isLocked } = getAccessStatusIndicator(level, userRole);
  if (!level) return null;

  // Стилі для кожного рівня доступу
  const orbStyles: Record<AccessLevel, { bg: string; border: string; shadow: string; pulse: string; label: string }> = {
    terminal: {
      bg: 'bg-emerald-500',
      border: 'border-emerald-400/30',
      shadow: 'shadow-[0_0_8px_rgba(16,185,129,0.7)]',
      pulse: 'bg-emerald-400',
      label: 'Terminal доступ',
    },
    pro: {
      bg: 'bg-amber-500',
      border: 'border-amber-400/30',
      shadow: 'shadow-[0_0_8px_rgba(245,158,11,0.7)]',
      pulse: 'bg-amber-400',
      label: 'Pro розвідка',
    },
    sovereign: {
      bg: 'bg-rose-500',
      border: 'border-rose-400/30',
      shadow: 'shadow-[0_0_8px_rgba(225,29,72,0.7)]',
      pulse: 'bg-rose-400',
      label: 'Sovereign елітний доступ',
    },
  };

  const style = orbStyles[level] || orbStyles.terminal;

  if (collapsed) {
    // Маленька крапка-індикатор доступу на іконці у згорнутому стані
    return (
      <div 
        className={cn(
          'absolute -bottom-0.5 -right-0.5 z-20 flex h-2 w-2 items-center justify-center rounded-full border border-black bg-black', 
          className
        )}
        title={`Рівень доступу: ${style.label} ${isLocked ? '(Заблоковано)' : '(Доступно)'}`}
      >
        <span className={cn('h-1 w-1 rounded-full', style.bg)} />
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'relative flex h-2 w-2 shrink-0 items-center justify-center rounded-full border transition-all duration-300', 
        style.border, 
        style.bg, 
        style.shadow,
        className
      )}
      title={`Рівень доступу: ${style.label} ${isLocked ? '(Заблоковано)' : '(Доступно)'}`}
    >
      {!isLocked && (
        <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-75', style.pulse)} />
      )}
    </div>
  );
};

const getRoleLabel = (role: string): string => {
  const audience = resolveNavigationAudience(role);
  if (audience === 'core') return 'SYSTEM COMMAND CENTER';
  if (audience === 'sovereign') return 'Суверенний контур (Elite)';
  if (audience === 'pro') return 'Професійний контур (Pro)';
  return 'Термінал-доступ (Basic)';
};

const getInitialCollapsed = (): Record<string, boolean> => {
  try {
    const stored = localStorage.getItem(COLLAPSED_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const getModeLabel = (mode: NavWorkspaceMode): string => {
  if (mode === 'favorites') return 'Обране';
  if (mode === 'recent') return 'Нещодавнє';
  if (mode === 'recommended') return 'ШІ-рекомендації';
  return 'Уся навігація';
};

export const Sidebar: React.FC = () => {
  const { user, logout } = useUser();
  const userRole = resolveUserRole(user?.role);
  const backendStatus = useBackendStatus();
  const [isOpen, setIsOpen] = useAtom(isSidebarOpenAtom);
  const [search, setSearch] = useAtom(sidebarSearchAtom);
  const [, setIsColabOpen] = useAtom(colabPanelOpenAtom);
  const [workspaceMode, setWorkspaceMode] = useState<NavWorkspaceMode>('all');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(getInitialCollapsed);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const visibleSections = useMemo(() => getVisibleNavigation(userRole), [userRole]);
  const {
    visibleItems,
    recommendedItems,
    visibleFavoriteIds,
    visibleRecentIds,
    favoriteIdSet,
    toggleFavorite,
    pushRecent,
  } = useShellWorkspace(userRole);
  const totals = useMemo(() => getNavigationTotals(userRole), [userRole]);
  const roleLabel = useMemo(() => getRoleLabel(userRole), [userRole]);
  const globalActions = useMemo(() => getGlobalNavigationActions(), []);

  const visibleItemIds = useMemo(() => new Set(visibleItems.map((item) => item.id)), [visibleItems]);
  const recentIdSet = useMemo(() => new Set(visibleRecentIds), [visibleRecentIds]);
  const recommendedIdSet = useMemo(
    () => new Set(recommendedItems.map((item) => item.id)),
    [recommendedItems],
  );

  const focusSearch = useCallback(() => {
    setIsOpen(true);
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    });
  }, [setIsOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingContext =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      if (!isTypingContext && event.key === '/') {
        event.preventDefault();
        focusSearch();
      }

      if (event.key === 'Escape' && document.activeElement === searchInputRef.current) {
        if (search.trim()) {
          setSearch('');
        } else {
          searchInputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [focusSearch, search, setSearch]);

  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = { ...prev, [sectionId]: !prev[sectionId] };
      localStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const filteredSections = useMemo<NavSection[]>(() => {
    const query = search.trim().toLowerCase();
    const recentOrder = new Map(visibleRecentIds.map((itemId, index) => [itemId, index]));
    const recommendedOrder = new Map(recommendedItems.map((item, index) => [item.id, index]));

    const getModeWeight = (itemId: string): number => {
      if (workspaceMode === 'recent') return recentOrder.get(itemId) ?? Number.MAX_SAFE_INTEGER;
      if (workspaceMode === 'recommended') return recommendedOrder.get(itemId) ?? Number.MAX_SAFE_INTEGER;
      return 0;
    };

    const matchesMode = (itemId: string): boolean => {
      if (workspaceMode === 'favorites') return favoriteIdSet.has(itemId);
      if (workspaceMode === 'recent') return recentIdSet.has(itemId);
      if (workspaceMode === 'recommended') return recommendedIdSet.has(itemId);
      return true;
    };

    return visibleSections
      .map((section) => {
        const groups = (section.groups ?? [])
          .map((group) => ({
            ...group,
            items: group.items
              .filter((item) => {
                if (!matchesMode(item.id)) return false;
                if (!query) return true;
                return (
                  item.label.toLowerCase().includes(query) ||
                  item.description.toLowerCase().includes(query) ||
                  item.group?.toLowerCase().includes(query) ||
                  group.title?.toLowerCase().includes(query) ||
                  section.label.toLowerCase().includes(query) ||
                  section.description.toLowerCase().includes(query) ||
                  section.outcome.toLowerCase().includes(query)
                );
              })
              .sort((left, right) => getModeWeight(left.id) - getModeWeight(right.id)),
          }))
          .filter((group) => group.items.length > 0);

        return {
          ...section,
          groups,
          items: groups.flatMap((group) =>
            group.items.map((item) => ({
              ...item,
              group: item.group ?? group.title,
            })),
          ),
        };
      })
      .filter((section) => section.items.length > 0);
  }, [
    recentIdSet,
    recommendedIdSet,
    recommendedItems,
    search,
    visibleRecentIds,
    visibleSections,
    workspaceMode,
  ]);

  const emptyStateMessage = useMemo(() => {
    if (search.trim()) return `Нічого не знайдено у режимі «${getModeLabel(workspaceMode)}».`;
    if (workspaceMode === 'favorites') return 'Тут зʼявляться закріплені маршрути після натискання на зірку біля модуля.';
    if (workspaceMode === 'recent') return 'Нещодавні переходи зʼявляться після відкриття перших модулів.';
    if (workspaceMode === 'recommended') return 'Рекомендації зʼявляться, щойно система визначить пріоритетні маршрути для ролі.';
    return 'Доступних маршрутів зараз немає.';
  }, [search, workspaceMode]);

  return (
    <motion.aside
      data-testid="sidebar"
      initial={false}
      animate={{ width: isOpen ? 296 : 72 }}
      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      className="relative sticky top-0 z-50 flex h-screen shrink-0 flex-col overflow-visible"
      style={{
        background: 'linear-gradient(180deg, rgba(12,18,32,0.98) 0%, rgba(7,11,20,0.99) 100%)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '4px 0 32px rgba(0,0,0,0.55), inset -1px 0 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute top-0 left-0 right-0 h-[50%]"
          style={{
            background: 'radial-gradient(circle at 10% 0%, rgba(225,29,72,0.06) 0%, transparent 60%)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-full h-[40%]"
          style={{
            background: 'radial-gradient(circle at 0% 100%, rgba(56,189,248,0.04) 0%, transparent 60%)',
          }}
        />
        {/* Right edge accent */}
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/5 to-transparent" />
      </div>

      {/* ── HEADER: Лого + статус ── */}
      <div
        className="relative shrink-0 border-b overflow-hidden"
        style={{ borderColor: 'rgba(255,255,255,0.07)', borderBottomWidth: '1px' }}
        title={`Джерело: ${backendStatus.sourceLabel}. Роль: ${roleLabel}. Блоків: ${totals.sections}. Модулів: ${totals.items}.`}
      >
        {/* Верхня лінія акценту — aurum gold */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(201,162,39,0.5) 50%, transparent 100%)' }}
        />
        <div className="flex items-center gap-3 px-3 py-3">
          <Logo size="sm" animated={false} className="shrink-0" />

          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="min-w-0 flex-1 overflow-hidden"
              >
                <div
                  className="text-sm font-black uppercase tracking-[0.18em] leading-none"
                  style={{ color: '#E11D48' }}
                >
                  PREDATOR
                </div>
                <div
                  className="text-[10px] font-bold uppercase tracking-[0.12em] mt-0.5"
                  style={{ color: '#475569' }}
                >
                  Аналітика · Рішення · Контроль
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isOpen && (
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    backendStatus.isOffline ? 'bg-rose-400' : 'bg-emerald-400',
                  )}
                  style={backendStatus.isOffline ? {} : { boxShadow: '0 0 6px rgba(52,211,153,0.7)' }}
                />
                <span
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-[0.12em]',
                    backendStatus.isOffline ? 'text-rose-500' : 'text-emerald-400',
                  )}
                >
                  {backendStatus.statusLabel}
                </span>
              </div>
              <span
                className={cn(
                  'rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.10em]',
                  backendStatus.isOffline
                    ? 'border-rose-600/25 bg-rose-600/10 text-rose-400'
                    : 'border-emerald-500/20 bg-emerald-500/08 text-emerald-400',
                )}
              >
                {backendStatus.isTruthOnly ? 'Правда' : 'Проксі'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── РЕЖИМИ + ПОШУК (тільки у відкритому стані) ── */}
      {isOpen && (
        <div
          className="shrink-0 border-b px-3 py-2"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        >
          {/* Кнопки режимів */}
          <div className="flex flex-wrap gap-1 mb-2">
            {globalActions.map((action) => {
              const Icon = action.icon;
              const isActiveMode = action.kind === 'mode' && action.mode === workspaceMode;

              if (action.kind === 'link' && action.path) {
                return (
                  <NavLink
                    key={action.id}
                    to={action.path}
                    className={({ isActive }) =>
                      cn(
                        'inline-flex h-6 items-center gap-1 rounded-full border px-2 text-[9px] font-bold uppercase tracking-[0.1em] transition-all',
                        isActive
                          ? 'border-yellow-400/30 bg-yellow-500/15 text-yellow-500'
                          : 'border-white/[0.07] bg-white/[0.03] text-slate-400 hover:border-white/[0.12] hover:text-white',
                      )
                    }
                    title={action.description}
                    aria-label={action.label}
                  >
                    <Icon className="h-3 w-3" aria-hidden="true" />
                    <span>{action.label}</span>
                  </NavLink>
                );
              }

              return (
                <Button variant="cyber"
                  key={action.id}
                  type="button"
                  onClick={() => {
                    if (action.kind === 'focus-search') {
                      focusSearch();
                      return;
                    }
                    if (action.kind === 'colab') {
                      setIsColabOpen(true);
                      return;
                    }
                    if (action.mode) {
                      setWorkspaceMode((currentMode) => (currentMode === action.mode ? 'all' : (action.mode ?? 'all')));
                    }
                  }}
                  title={action.description}
                  aria-label={action.label}
                  aria-pressed={isActiveMode}
                  className={cn(
                    'inline-flex h-6 items-center gap-1 rounded-full border px-2 text-[9px] font-bold uppercase tracking-[0.1em] transition-all',
                    isActiveMode
                      ? 'border-rose-400/30 bg-rose-500/15 text-rose-300'
                      : 'border-white/[0.07] bg-white/[0.03] text-slate-400 hover:border-white/[0.12] hover:text-white',
                  )}
                >
                  <Icon className="h-3 w-3" aria-hidden="true" />
                  <span>{action.label}</span>
                  {action.id === 'favorites' && visibleFavoriteIds.length > 0 && (
                    <span className="ml-0.5 rounded-full bg-rose-500/20 px-1 py-0.5 text-[7px] text-rose-300" aria-label={`${visibleFavoriteIds.length} обраних елементів`}>
                      {visibleFavoriteIds.length}
                    </span>
                  )}
                  {action.id === 'recent' && visibleRecentIds.length > 0 && (
                    <span className="ml-0.5 rounded-full bg-white/10 px-1 py-0.5 text-[7px] text-slate-400" aria-label={`${visibleRecentIds.length} нещодавніх елементів`}>
                      {visibleRecentIds.length}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>

          {/* Рядок пошуку */}
          <div className="group relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-red-400" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Пошук модулів..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-7 w-full rounded-lg border text-xs text-white outline-none transition-all placeholder:text-slate-600"
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderColor: search ? 'rgba(225,29,72,0.3)' : 'rgba(255,255,255,0.08)',
                paddingLeft: '2rem',
                paddingRight: '2.5rem',
              }}
              aria-label="Пошук модулів"
              aria-describedby="search-hint"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(225,29,72,0.4)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = search ? 'rgba(225,29,72,0.3)' : 'rgba(255,255,255,0.08)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
            />
            <div className="pointer-events-none absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5 text-[8px] text-slate-600" id="search-hint">
              <Command className="h-2.5 w-2.5" aria-hidden="true" />
              <span>K</span>
            </div>
            {search && (
              <Button variant="cyber"
                title="Очистити пошук"
                onClick={() => setSearch('')}
                className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-white"
              >
                <X size={10} />
              </Button>
            )}
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-500">
            <span>{filteredSections.length > 0 ? `Секцій: ${filteredSections.length}` : 'Секцій не знайдено'}</span>
            <span className="text-slate-600">/ для фокусу, Esc для очищення</span>
          </div>
        </div>
      )}

      {/* ── НАВІГАЦІЙНА ОБЛАСТЬ ── */}
      <nav className="relative flex-1 overflow-y-auto overflow-x-hidden py-2 custom-scrollbar" style={{ scrollbarWidth: 'thin' }}>
        {filteredSections.length === 0 ? (
          <div className="mx-2 mt-2 rounded-xl p-3 text-sm" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-xs font-bold text-white">{getModeLabel(workspaceMode)}</div>
            <p className="mt-1.5 text-[10px] leading-4 text-slate-500">{emptyStateMessage}</p>
            <Button variant="cyber"
              type="button"
              onClick={() => {
                setWorkspaceMode('all');
                setSearch('');
              }}
              className="mt-2 rounded-full border border-white/[0.08] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400 transition-colors hover:border-white/[0.12] hover:text-white"
            >
              Показати всю навігацію
            </Button>
          </div>
        ) : (
          <div className="space-y-1 px-2">
            {filteredSections.map((section, sectionIdx) => {
              const colors = sectionColorMap[section.accent] ?? sectionColorMap.slate;
              const isCollapsed = collapsedSections[section.id] && !search;

              return (
                <div 
                  key={section.id} 
                  className={cn(
                    "overflow-hidden rounded-xl transition-all duration-300",
                    !isOpen && "border bg-white/[0.01] p-1"
                  )}
                  style={{
                    marginBottom: isOpen ? '4px' : '12px',
                    borderColor: !isOpen ? colors.border : undefined,
                    boxShadow: !isOpen ? `0 0 10px ${colors.glowColor}15` : undefined,
                    // Передача CSS змінних для дочірніх NavLink
                    ['--section-glow' as any]: colors.glowColor,
                    ['--section-hover-bg' as any]: colors.hoverBg,
                    ['--section-border' as any]: colors.border,
                  }}
                >
                  {/* Заголовок секції */}
                  {isOpen ? (
                    <Button variant="cyber"
                      onClick={() => toggleSection(section.id)}
                      title={`${section.description} — ${section.outcome}`}
                      className="w-full rounded-xl px-2.5 py-2 text-left transition-all duration-200"
                      style={{
                        background: isCollapsed ? 'transparent' : colors.headerBg,
                        border: `1px solid ${isCollapsed ? 'rgba(255,255,255,0.04)' : colors.border}`,
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        {/* Кольоровий індикатор секції */}
                        <div
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                          style={{
                            background: colors.headerBg,
                            border: `1px solid ${colors.border}`,
                            boxShadow: isCollapsed ? 'none' : `0 0 10px ${colors.glowColor}20`,
                          }}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: colors.dotColor }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div
                            className="truncate text-[11px] font-bold uppercase tracking-[0.12em] leading-none"
                            style={{ color: isCollapsed ? '#475569' : colors.headerText }}
                          >
                            {section.label}
                          </div>
                          {!isCollapsed && (
                            <div className="mt-1 truncate text-[9px] text-slate-600">{section.outcome}</div>
                          )}
                        </div>
                        <ChevronDown
                          size={12}
                          className={cn('shrink-0 transition-transform duration-200', isCollapsed && '-rotate-90')}
                          style={{ color: colors.headerText, opacity: 0.5 }}
                        />
                      </div>
                    </Button>
                  ) : (
                    /* Згорнутий вигляд — тільки кольоровий маркер з пульсацією */
                    <div
                      className="mx-auto my-1 flex h-8 w-8 items-center justify-center rounded-xl"
                      style={{
                        background: colors.headerBg,
                        border: `1px solid ${colors.border}`,
                      }}
                      title={section.label}
                    >
                      <span className="relative flex h-2 w-2">
                        <span 
                          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                          style={{ background: colors.dotColor }}
                        />
                        <span 
                          className="relative inline-flex rounded-full h-2 w-2"
                          style={{
                            background: colors.dotColor,
                            boxShadow: `0 0 8px ${colors.glowColor}`,
                          }}
                        />
                      </span>
                    </div>
                  )}

                  {/* Елементи секції */}
                  <AnimatePresence initial={false}>
                    {(!isCollapsed || !isOpen) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div
                          className={cn('space-y-0.5 py-1', isOpen ? 'px-1' : 'px-0')}
                          style={{
                            background: isOpen ? colors.bg : 'transparent',
                            borderRadius: '0 0 12px 12px',
                          }}
                        >
                          {(section.groups ?? []).map((group) => (
                            <div key={`${section.id}-${group.title ?? 'group'}`} className="space-y-0.5">
                              {/* Заголовок підгрупи — покращена читабельність */}
                              {isOpen && group.title && (
                                <div
                                  className="flex items-center gap-2 px-2 pt-2 pb-1"
                                >
                                  <div
                                    className="h-px flex-1"
                                    style={{ background: `${colors.border}` }}
                                  />
                                  <span
                                    className="text-[10px] font-bold uppercase tracking-[0.14em] shrink-0"
                                    style={{ color: colors.headerText, opacity: 0.6 }}
                                  >
                                    {group.title}
                                  </span>
                                  <div
                                    className="h-px flex-1"
                                    style={{ background: `${colors.border}` }}
                                  />
                                </div>
                              )}

                              {group.items.map((item) => {
                                const isFavorite = favoriteIdSet.has(item.id);

                                return (
                                  <div key={item.id} className="group/item relative">
                                    <NavLink
                                      to={item.path}
                                      title={!isOpen ? item.label : undefined}
                                      onClick={() => pushRecent(item.id)}
                                      className={({ isActive }) =>
                                        cn(
                                          'group relative flex items-center gap-2 rounded-lg border transition-all duration-300 overflow-hidden',
                                          isOpen ? 'px-2 py-1.5 pr-8' : 'mx-auto h-8 w-8 justify-center',
                                          isActive
                                            ? 'text-white'
                                            : 'text-slate-300 hover:text-white hover:bg-[var(--section-hover-bg)] hover:border-[var(--section-border)] hover:shadow-[0_0_20px_var(--section-glow)] active:scale-[0.98]',
                                          'sidebar-kinetic-item',
                                        )
                                      }
                                      style={({ isActive }) => ({
                                        background: isActive ? colors.activeItemBg : 'transparent',
                                        borderColor: isActive ? colors.activeItemBorder : 'transparent',
                                        boxShadow: isActive ? `0 0 12px ${colors.glowColor}30` : 'none',
                                      })} 
                                    >
                                      {({ isActive }) => (
                                        <>
                                          {/* Scan-line hover effect */}
                                          <div 
                                            className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                            style={{
                                              background: `linear-gradient(90deg, transparent 0%, ${colors.glowColor}20 50%, transparent 100%)`,
                                              backgroundSize: '200% 100%',
                                              animation: 'scan-slide 2s ease-in-out infinite',
                                            }}
                                          />
                                          {/* HUD Corners — тактичні куточки */}
                                          {isOpen && (
                                            <>
                                              <div className="hud-corner-nexus hud-corner-tl opacity-0 group-hover:opacity-100 transition-opacity" style={{ '--hud-accent': colors.dotColor } as React.CSSProperties} />
                                              <div className="hud-corner-nexus hud-corner-tr opacity-0 group-hover:opacity-100 transition-opacity" style={{ '--hud-accent': colors.dotColor } as React.CSSProperties} />
                                              <div className="hud-corner-nexus hud-corner-bl opacity-0 group-hover:opacity-100 transition-opacity" style={{ '--hud-accent': colors.dotColor } as React.CSSProperties} />
                                              <div className="hud-corner-nexus hud-corner-br opacity-0 group-hover:opacity-100 transition-opacity" style={{ '--hud-accent': colors.dotColor } as React.CSSProperties} />
                                            </>
                                          )}
                                          {/* Іконка */}
                                          <div
                                            className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-all"
                                            style={{
                                              background: isActive ? colors.activeIconBg : 'rgba(255,255,255,0.04)',
                                              border: `1px solid ${isActive ? colors.activeItemBorder : 'rgba(255,255,255,0.06)'}`,
                                            }}
                                          >
                                            <item.icon
                                              className="h-3.5 w-3.5 transition-colors"
                                              style={{ color: isActive ? colors.activeIconColor : '#64748b' }}
                                            />
                                            {/* Преміальний індикатор доступу у згорнутому стані */}
                                            {!isOpen && item.accessLevel && (
                                              <AccessOrb level={item.accessLevel} userRole={userRole} collapsed={true} />
                                            )}
                                            {/* Замок у згорнутому стані */}
                                            {!isOpen && isNavItemLocked(item, userRole) && (
                                              <div 
                                                className="absolute -top-1 -right-1 z-20 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-950/90 border border-rose-500/40 text-rose-400 shadow-[0_0_6px_rgba(225,29,72,0.6)]"
                                                title="Заблоковано для вашого рівня доступу"
                                              >
                                                <Lock className="h-2 w-2" />
                                              </div>
                                            )}
                                          </div>

                                          {/* Текст (тільки у відкритому стані) */}
                                          {isOpen && (
                                            <div className="min-w-0 flex-1">
                                              <div className="flex items-center gap-1.5">
                                                {/* Преміальний індикатор доступу */}
                                                {item.accessLevel && (
                                                  <AccessOrb level={item.accessLevel} userRole={userRole} />
                                                )}
                                                <span
                                                  className="truncate text-[13px] font-semibold leading-none"
                                                  style={{
                                                    color: isActive
                                                      ? '#ffffff'
                                                      : isNavItemLocked(item, userRole)
                                                        ? '#475569'
                                                        : '#cbd5e1',
                                                  }}
                                                >
                                                  {item.label}
                                                </span>
                                                {/* Бейдж рівня доступу (замість замка) */}
                                                {isNavItemLocked(item, userRole) && (
                                                  <span
                                                    className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] leading-none"
                                                    style={{
                                                      background: item.accessLevel === 'sovereign'
                                                        ? 'rgba(225,29,72,0.15)'
                                                        : 'rgba(245,158,11,0.15)',
                                                      color: item.accessLevel === 'sovereign'
                                                        ? '#fb7185'
                                                        : '#fbbf24',
                                                      border: `1px solid ${item.accessLevel === 'sovereign' ? 'rgba(225,29,72,0.25)' : 'rgba(245,158,11,0.25)'}`,
                                                    }}
                                                    title={`Доступно у плані ${item.accessLevel === 'sovereign' ? 'SOVEREIGN' : 'PRO'}`}
                                                  >
                                                    {item.accessLevel === 'sovereign' ? 'SOVEREIGN' : 'PRO'}
                                                  </span>
                                                )}
                                                {/* Звичайний бейдж (тільки якщо не заблоковано) */}
                                                {item.badge && !isNavItemLocked(item, userRole) && (
                                                  <span
                                                    className="shrink-0 rounded-full border px-1 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] leading-none"
                                                    style={{
                                                      background: colors.activeIconBg,
                                                      borderColor: colors.activeItemBorder,
                                                      color: colors.activeIconColor,
                                                    }}
                                                  >
                                                    {item.badge}
                                                  </span>
                                                )}
                                              </div>
                                              {(search || workspaceMode !== 'all') && (
                                                <p className="mt-0.5 line-clamp-1 text-[10px] leading-3 text-slate-500">
                                                  {item.description}
                                                </p>
                                              )}
                                            </div>
                                          )}

                                          {/* Активний індикатор (вертикальна лінія) */}
                                          {isOpen && isActive && (
                                            <div
                                              className={cn(
                                                'absolute inset-y-1.5 right-1 w-[3px] rounded-full bg-gradient-to-b',
                                                colors.activeIndicator,
                                              )}
                                            />
                                          )}
                                        </>
                                      )}
                                    </NavLink>

                                    {/* Кнопка Обране */}
                                    {isOpen && (
                                      <Button variant="cyber"
                                        type="button"
                                        onClick={(event) => {
                                          event.preventDefault();
                                          event.stopPropagation();
                                          toggleFavorite(item.id);
                                        }}
                                        title={isFavorite ? 'Прибрати з обраного' : 'Додати в обране'}
                                        className={cn(
                                          'absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full p-1 transition-all',
                                          isFavorite
                                            ? 'opacity-100 text-rose-400'
                                            : 'opacity-0 text-slate-600 group-hover/item:opacity-100 hover:text-rose-400',
                                        )}
                                      >
                                        <Star className={cn('h-3 w-3', isFavorite && 'fill-current')} />
                                      </Button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </nav>

      {/* ── НИЖНЯ ПАНЕЛЬ: Профіль користувача ── */}
      <div
        className="relative shrink-0 border-t px-2 py-2"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        {/* Горизонтальна лінія градієнту */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(225,29,72,0.3), transparent)' }}
        />
        <div
          className={cn(
            'flex items-center gap-2 rounded-xl p-1.5',
            !isOpen && 'justify-center',
          )}
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Аватар з кольором рівня доступу */}
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{
              background: userRole === UserRole.CORE ? 'rgba(99,102,241,0.15)' :
                         userRole === UserRole.SOVEREIGN ? 'rgba(225,29,72,0.15)' :
                         userRole === UserRole.PRO ? 'rgba(245,158,11,0.15)' :
                         'rgba(16,185,129,0.15)',
              border: `1px solid ${userRole === UserRole.CORE ? 'rgba(99,102,241,0.3)' :
                         userRole === UserRole.SOVEREIGN ? 'rgba(225,29,72,0.25)' :
                         userRole === UserRole.PRO ? 'rgba(245,158,11,0.25)' :
                         'rgba(16,185,129,0.25)'}`,
            }}
          >
            <User className="h-3.5 w-3.5" style={{
              color: userRole === UserRole.CORE ? '#818cf8' :
                     userRole === UserRole.SOVEREIGN ? '#fb7185' :
                     userRole === UserRole.PRO ? '#fbbf24' :
                     '#34d399'
            }} />
          </div>

          {isOpen && (
            <>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] font-bold text-white">{user?.name || 'Адміністратор'}</div>
                <div className="truncate text-[9px]" style={{ color: '#475569' }}>{roleLabel}</div>
              </div>
              <Button variant="cyber"
                onClick={logout}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-all"
                style={{ color: '#475569' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(225,29,72,0.12)';
                  e.currentTarget.style.color = '#fb7185';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#475569';
                }}
                title="Вийти з системи"
              >
                <LogOut size={13} />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── КНОПКА РОЗГОРТАННЯ/ЗГО ТАННЯ ── */}
      <Button variant="cyber"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Згорнути навігацію' : 'Розгорнути навігацію'}
        className="absolute -right-3 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full transition-all duration-300"
        style={{
          background: 'rgba(20, 20, 22, 0.97)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#64748b',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(196,18,48,0.4)';
          e.currentTarget.style.color = '#c41230';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
          e.currentTarget.style.color = '#64748b';
        }}
        title={isOpen ? 'Згорнути навігацію' : 'Розгорнути навігацію'}
      >
        {isOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </Button>
    </motion.aside>
  );
};

export default Sidebar;
