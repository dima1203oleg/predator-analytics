import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAtom } from 'jotai';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Command,
  LogOut,
  Search,
  Shield,
  Star,
  User,
  X,
} from 'lucide-react';
import { isSidebarOpenAtom, shellCommandPaletteOpenAtom, sidebarSearchAtom, colabPanelOpenAtom } from '../../store/atoms';
import { useUser } from '../../context/UserContext';
import { Logo } from '../Logo';
import {
  getGlobalNavigationActions,
  getNavigationTotals,
  getVisibleNavigation,
  navAccentStyles,
  type NavSection,
  resolveNavigationAudience,
  type NavWorkspaceMode,
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
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
    headerBg: 'rgba(245,158,11,0.12)',
    headerText: '#fbbf24',
    dotColor: '#f59e0b',
    glowColor: 'rgba(245,158,11,0.5)',
    activeItemBg: 'rgba(245,158,11,0.15)',
    activeItemBorder: 'rgba(245,158,11,0.35)',
    activeIconBg: 'rgba(245,158,11,0.2)',
    activeIconColor: '#fbbf24',
    activeIndicator: 'from-amber-500 to-amber-400/20',
    hoverBg: 'rgba(245,158,11,0.1)',
  },
  amber: {
    bg: 'rgba(190,18,60,0.1)',
    border: 'rgba(190,18,60,0.3)',
    headerBg: 'rgba(190,18,60,0.15)',
    headerText: '#f43f5e',
    dotColor: '#e11d48',
    glowColor: 'rgba(225,29,72,0.6)',
    activeItemBg: 'rgba(190,18,60,0.2)',
    activeItemBorder: 'rgba(190,18,60,0.4)',
    activeIconBg: 'rgba(190,18,60,0.3)',
    activeIconColor: '#f43f5e',
    activeIndicator: 'from-rose-600 to-rose-400/20',
    hoverBg: 'rgba(190,18,60,0.12)',
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

const getRoleLabel = (role: string): string => {
  const audience = resolveNavigationAudience(role);
  if (audience === 'admin') return 'Адміністрування системи';
  if (audience === 'analyst') return 'Аналітичний контур';
  if (audience === 'supply_chain') return 'Контур логістики';
  return 'Бізнес-контур';
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
  const userRole = user?.role || 'viewer';
  const backendStatus = useBackendStatus();
  const [isOpen, setIsOpen] = useAtom(isSidebarOpenAtom);
  const [search, setSearch] = useAtom(sidebarSearchAtom);
  const [, setIsPaletteOpen] = useAtom(shellCommandPaletteOpenAtom);
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
    setIsPaletteOpen(true);
  }, [setIsOpen, setIsPaletteOpen]);

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
    visibleSections,
    workspaceMode,
  ]);

  const emptyStateMessage = useMemo(() => {
    if (search.trim()) return `Нічого не знайдено у режимі «${getModeLabel(workspaceMode)}».`;
    if (workspaceMode === 'favorites') return 'Тут зʼявляться закріплені маршрути після натискання на зірку біля модуля.';
    if (workspaceMode === 'recent') return 'Нещодавні переходи зʼявляться після відкриття перших модулів.';
    if (workspaceMode === 'recommended') return '� екомендації зʼявляться, щойно система визначить пріоритетні маршрути для ролі.';
    return 'Доступних маршрутів зараз немає.';
  }, [search, workspaceMode]);

  return (
    <motion.aside
      data-testid="sidebar"
      initial={false}
      animate={{ width: isOpen ? 296 : 80 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative sticky top-0 z-50 flex h-screen shrink-0 flex-col overflow-visible"
      style={{
        background: 'linear-gradient(180deg, rgba(10, 10, 15, 0.7) 0%, rgba(5, 5, 10, 0.85) 100%)',
        borderRight: '1px solid rgba(225,29,72,0.15)',
        boxShadow: '20px 0 60px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(40px)',
      }}
    >
      {/* Ambient фоновий ефект - більш виражений для візабіліті */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-[60%]"
          style={{
            background: 'radial-gradient(circle at 0% 0%, rgba(225,29,72,0.2) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-full h-[50%]"
          style={{
            background: 'radial-gradient(circle at 100% 100%, rgba(225,29,72,0.1) 0%, transparent 80%)',
          }}
        />
        <div className="absolute inset-0 cyber-scan-grid opacity-[0.04]" />
        
        {/* Edge Highlight */}
        <div className="absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-rose-500/40 to-transparent" />
      </div>

      {/* ── HEADER: Лого + статус ── */}
      <div
        className="relative shrink-0 border-b overflow-hidden"
        style={{ borderColor: 'rgba(255,255,255,0.07)', borderBottomWidth: '1px' }}
        title={`Джерело: ${backendStatus.sourceLabel}. � оль: ${roleLabel}. Блоків: ${totals.sections}. Модулів: ${totals.items}.`}
      >
        {/* Верхня лінія акценту */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(225,29,72,0.6) 50%, transparent 100%)' }}
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
                  className="text-[13px] font-black uppercase tracking-[0.18em] leading-none"
                  style={{ color: '#e11d48', textShadow: '0 0 12px rgba(225,29,72,0.5)' }}
                >
                  PREDATOR
                </div>
                <div
                  className="text-[8px] font-bold uppercase tracking-[0.12em] mt-0.5"
                  style={{ color: '#475569' }}
                >
                  NEXUS ANALYTICS
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isOpen && (
            <div className="flex flex-col items-end gap-1 shrink-0">
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    backendStatus.isOffline ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse',
                  )}
                  style={{
                    boxShadow: backendStatus.isOffline
                      ? '0 0 6px rgba(248,113,113,0.8)'
                      : '0 0 6px rgba(52,211,153,0.8)',
                  }}
                />
                <span
                  className={cn(
                    'text-[9px] font-black uppercase tracking-[0.14em]',
                    backendStatus.isOffline ? 'text-rose-600' : 'text-crimson-500',
                  )}
                >
                  {backendStatus.statusLabel}
                </span>
              </div>
              <span
                className={cn(
                  'rounded-full border px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.12em]',
                  backendStatus.isOffline
                    ? 'border-rose-600/20 bg-rose-600/10 text-rose-500'
                    : 'border-crimson-500/20 bg-crimson-500/10 text-crimson-500',
                )}
              >
                {backendStatus.isTruthOnly ? 'Правда' : 'Проксі'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── � ЕЖИМИ + ПОШУК (тільки у відкритому стані) ── */}
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
                  >
                    <Icon className="h-3 w-3" />
                    <span>{action.label}</span>
                  </NavLink>
                );
              }

              return (
                <button
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
                  className={cn(
                    'inline-flex h-6 items-center gap-1 rounded-full border px-2 text-[9px] font-bold uppercase tracking-[0.1em] transition-all',
                    isActiveMode
                      ? 'border-rose-400/30 bg-rose-500/15 text-rose-300'
                      : 'border-white/[0.07] bg-white/[0.03] text-slate-400 hover:border-white/[0.12] hover:text-white',
                  )}
                >
                  <Icon className="h-3 w-3" />
                  <span>{action.label}</span>
                  {action.id === 'favorites' && visibleFavoriteIds.length > 0 && (
                    <span className="ml-0.5 rounded-full bg-rose-500/20 px-1 py-0.5 text-[7px] text-rose-300">
                      {visibleFavoriteIds.length}
                    </span>
                  )}
                  {action.id === 'recent' && visibleRecentIds.length > 0 && (
                    <span className="ml-0.5 rounded-full bg-white/10 px-1 py-0.5 text-[7px] text-slate-400">
                      {visibleRecentIds.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* � ядок пошуку */}
          <div className="group relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
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
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(225,29,72,0.4)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = search ? 'rgba(225,29,72,0.3)' : 'rgba(255,255,255,0.08)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
            />
            <div className="pointer-events-none absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5 text-[8px] text-slate-600">
              <Command className="h-2.5 w-2.5" />
              <span>K</span>
            </div>
            {search && (
              <button
                title="Очистити пошук"
                onClick={() => setSearch('')}
                className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-white"
              >
                <X size={10} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── НАВІГАЦІЙНА ОБЛАСТЬ ── */}
      <nav className="relative flex-1 overflow-y-auto overflow-x-hidden py-2 custom-scrollbar" style={{ scrollbarWidth: 'thin' }}>
        {filteredSections.length === 0 ? (
          <div className="mx-2 mt-2 rounded-xl p-3 text-sm" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-xs font-bold text-white">{getModeLabel(workspaceMode)}</div>
            <p className="mt-1.5 text-[10px] leading-4 text-slate-500">{emptyStateMessage}</p>
            <button
              type="button"
              onClick={() => {
                setWorkspaceMode('all');
                setSearch('');
              }}
              className="mt-2 rounded-full border border-white/[0.08] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400 transition-colors hover:border-white/[0.12] hover:text-white"
            >
              Показати всю навігацію
            </button>
          </div>
        ) : (
          <div className="space-y-1 px-2">
            {filteredSections.map((section, sectionIdx) => {
              const colors = sectionColorMap[section.accent] ?? sectionColorMap.slate;
              const isCollapsed = collapsedSections[section.id] && !search;

              return (
                <div key={section.id} className="overflow-hidden rounded-xl" style={{ marginBottom: '4px' }}>
                  {/* Заголовок секції */}
                  {isOpen ? (
                    <button
                      onClick={() => toggleSection(section.id)}
                      title={`${section.description} ${section.outcome}`}
                      className="w-full rounded-xl px-2.5 py-2 text-left transition-all"
                      style={{
                        background: isCollapsed ? 'transparent' : colors.headerBg,
                        border: `1px solid ${isCollapsed ? 'transparent' : colors.border}`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {/* Кольоровий індикатор секції */}
                        <div
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                          style={{
                            background: colors.headerBg,
                            border: `1px solid ${colors.border}`,
                          }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{
                              background: colors.dotColor,
                              boxShadow: `0 0 6px ${colors.glowColor}`,
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div
                            className="truncate text-[9px] font-black uppercase tracking-[0.16em] leading-none"
                            style={{ color: isCollapsed ? '#64748b' : colors.headerText }}
                          >
                            {section.label}
                          </div>
                          {!isCollapsed && (workspaceMode !== 'all' || search) && (
                            <div className="mt-0.5 truncate text-[8px] text-slate-500">{section.outcome}</div>
                          )}
                        </div>
                        <ChevronDown
                          size={10}
                          className={cn('shrink-0 transition-transform', isCollapsed && '-rotate-90')}
                          style={{ color: colors.headerText, opacity: 0.6 }}
                        />
                      </div>
                    </button>
                  ) : (
                    /* Згорнутий вигляд — тільки кольоровий маркер */
                    <div
                      className="mx-auto my-1 flex h-8 w-8 items-center justify-center rounded-xl"
                      style={{
                        background: colors.headerBg,
                        border: `1px solid ${colors.border}`,
                      }}
                      title={section.label}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          background: colors.dotColor,
                          boxShadow: `0 0 8px ${colors.glowColor}`,
                        }}
                      />
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
                              {/* Заголовок підгрупи */}
                              {isOpen && group.title && (
                                <div
                                  className="px-2 pt-1.5 pb-0.5 text-[7px] font-black uppercase tracking-[0.18em]"
                                  style={{ color: colors.headerText, opacity: 0.5 }}
                                >
                                  {group.title}
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
                                          'group relative flex items-center gap-2 rounded-lg border transition-all duration-200',
                                          isOpen ? 'px-2 py-1.5 pr-8' : 'mx-auto h-8 w-8 justify-center',
                                          isActive
                                            ? 'text-white'
                                            : 'text-slate-300 hover:text-white active:scale-[0.98]',
                                        )
                                      }
                                      style={({ isActive }) => ({
                                        background: isActive ? colors.activeItemBg : 'transparent',
                                        borderColor: isActive ? colors.activeItemBorder : 'transparent',
                                        boxShadow: isActive ? `0 0 12px ${colors.glowColor.replace('0.4', '0.1')}` : 'none',
                                      })}
                                    >
                                      {({ isActive }) => (
                                        <>
                                          {/* Іконка */}
                                          <div
                                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-all"
                                            style={{
                                              background: isActive ? colors.activeIconBg : 'rgba(255,255,255,0.04)',
                                              border: `1px solid ${isActive ? colors.activeItemBorder : 'rgba(255,255,255,0.06)'}`,
                                            }}
                                          >
                                            <item.icon
                                              className="h-3.5 w-3.5 transition-colors"
                                              style={{ color: isActive ? colors.activeIconColor : '#64748b' }}
                                            />
                                          </div>

                                          {/* Текст (тільки у відкритому стані) */}
                                          {isOpen && (
                                            <div className="min-w-0 flex-1">
                                              <div className="flex items-center gap-1.5">
                                                <span
                                                  className="truncate text-[11px] font-bold leading-none"
                                                  style={{ color: isActive ? '#ffffff' : '#cbd5e1' }}
                                                >
                                                  {item.label}
                                                </span>
                                                {item.badge && (
                                                  <span
                                                    className="shrink-0 rounded-full border px-1 py-0.5 text-[7px] font-black uppercase tracking-[0.1em] leading-none"
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
                                                <p className="mt-0.5 line-clamp-1 text-[8px] leading-3 text-slate-600">
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
                                      <button
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
                                      </button>
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
          {/* Аватар */}
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{ background: 'rgba(225,29,72,0.15)', border: '1px solid rgba(225,29,72,0.25)' }}
          >
            <User className="h-3.5 w-3.5" style={{ color: '#fb7185' }} />
          </div>

          {isOpen && (
            <>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] font-bold text-white">{user?.name || 'Адміністратор'}</div>
                <div className="truncate text-[9px]" style={{ color: '#475569' }}>{roleLabel}</div>
              </div>
              <button
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
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── КНОПКА � ОЗГО� ТАННЯ/ЗГО� ТАННЯ ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full transition-all duration-300"
        style={{
          background: 'rgba(4,12,28,0.95)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 0 16px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03)',
          color: '#64748b',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)';
          e.currentTarget.style.color = '#d4af37';
          e.currentTarget.style.boxShadow = '0 0 16px rgba(0,0,0,0.8), 0 0 8px rgba(212,175,55,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
          e.currentTarget.style.color = '#64748b';
          e.currentTarget.style.boxShadow = '0 0 16px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03)';
        }}
        title={isOpen ? 'Згорнути навігацію' : '� озгорнути навігацію'}
      >
        {isOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>
    </motion.aside>
  );
};

export default Sidebar;
