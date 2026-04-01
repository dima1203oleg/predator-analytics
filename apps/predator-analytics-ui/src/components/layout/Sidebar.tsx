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
import { isSidebarOpenAtom, shellCommandPaletteOpenAtom, sidebarSearchAtom } from '../../store/atoms';
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

const getRoleLabel = (role: string): string => {
  const audience = resolveNavigationAudience(role);

  if (audience === 'admin') {
    return 'Адміністрування системи';
  }

  if (audience === 'analyst') {
    return 'Аналітичний контур';
  }

  if (audience === 'supply_chain') {
    return 'Контур логістики';
  }

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
  if (mode === 'favorites') {
    return 'Обране';
  }

  if (mode === 'recent') {
    return 'Нещодавнє';
  }

  if (mode === 'recommended') {
    return 'ШІ-рекомендації';
  }

  return 'Уся навігація';
};

export const Sidebar: React.FC = () => {
  const { user, logout } = useUser();
  const userRole = user?.role || 'viewer';
  const backendStatus = useBackendStatus();
  const [isOpen, setIsOpen] = useAtom(isSidebarOpenAtom);
  const [search, setSearch] = useAtom(sidebarSearchAtom);
  const [, setIsPaletteOpen] = useAtom(shellCommandPaletteOpenAtom);
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
      if (workspaceMode === 'recent') {
        return recentOrder.get(itemId) ?? Number.MAX_SAFE_INTEGER;
      }

      if (workspaceMode === 'recommended') {
        return recommendedOrder.get(itemId) ?? Number.MAX_SAFE_INTEGER;
      }

      return 0;
    };

    const matchesMode = (itemId: string): boolean => {
      if (workspaceMode === 'favorites') {
        return favoriteIdSet.has(itemId);
      }

      if (workspaceMode === 'recent') {
        return recentIdSet.has(itemId);
      }

      if (workspaceMode === 'recommended') {
        return recommendedIdSet.has(itemId);
      }

      return true;
    };

    return visibleSections
      .map((section) => {
        const groups = (section.groups ?? [])
          .map((group) => ({
            ...group,
            items: group.items
              .filter((item) => {
                if (!matchesMode(item.id)) {
                  return false;
                }

                if (!query) {
                  return true;
                }

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
    if (search.trim()) {
      return `Нічого не знайдено у режимі «${getModeLabel(workspaceMode)}».`;
    }

    if (workspaceMode === 'favorites') {
      return 'Тут зʼявляться закріплені маршрути після натискання на зірку біля модуля.';
    }

    if (workspaceMode === 'recent') {
      return 'Нещодавні переходи зʼявляться після відкриття перших модулів.';
    }

    if (workspaceMode === 'recommended') {
      return 'Рекомендації зʼявляться, щойно система визначить пріоритетні маршрути для ролі.';
    }

    return 'Доступних маршрутів зараз немає.';
  }, [search, workspaceMode]);

  return (
    <motion.aside
      data-testid="sidebar"
      initial={false}
      animate={{ width: isOpen ? 308 : 80 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} // smooth spring-like curve
      className="relative sticky top-0 z-50 flex h-screen shrink-0 flex-col border-r border-white/5 bg-[#030712]/60 shadow-[8px_0_40px_rgba(2,6,23,0.7)] backdrop-blur-2xl"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.06),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.04),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent" />


      <div
        className="relative border-b border-white/[0.06] px-4 py-2"
        title={`Джерело: ${backendStatus.sourceLabel}. Роль: ${roleLabel}. Блоків: ${totals.sections}. Модулів: ${totals.items}.`}
      >
        <div className="flex items-center gap-3">
          <Logo size="sm" animated={false} className="shrink-0 mr-1" />

          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="min-w-0 flex-1 overflow-hidden"
              >
                <div className="truncate text-[14px] font-black uppercase tracking-[0.2em] text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]">PREDATOR</div>
                <div className="truncate text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500">
                  NEXUS ANALYTICS
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isOpen && (
            <span
              className={cn(
                'ml-auto h-2 w-2 shrink-0 rounded-full',
                backendStatus.isOffline ? 'bg-rose-400' : 'bg-emerald-400',
              )}
            />
          )}

          {isOpen && (
            <div
              className={cn(
                'max-w-[84px] truncate text-[9px] font-black',
                backendStatus.isOffline ? 'text-rose-200' : 'text-emerald-200',
              )}
            >
              {backendStatus.statusLabel}
            </div>
          )}

          {isOpen && (
            <span
              className={cn(
                'shrink-0 rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em]',
                backendStatus.isOffline
                  ? 'border-rose-400/20 bg-rose-500/10 text-rose-200'
                  : 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200',
              )}
            >
              {backendStatus.isTruthOnly ? 'Правда' : 'Проксі'}
            </span>
          )}
        </div>
      </div>
          {isOpen && (
            <div className="relative border-b border-white/[0.04] px-4 py-2">
              <div className="pb-1">
                <div className="flex flex-wrap gap-1.5">
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
                              'inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[10px] font-bold uppercase tracking-[0.12em] transition-all',
                              isActive
                                ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
                                : 'border-white/[0.06] bg-white/[0.03] text-slate-300 hover:border-white/[0.12] hover:text-white',
                            )
                          }
                          title={action.description}
                        >
                          <Icon className="h-3.5 w-3.5" />
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

                          if (action.mode) {
                            setWorkspaceMode((currentMode) => (currentMode === action.mode ? 'all' : (action.mode ?? 'all')));
                          }
                        }}
                        title={action.description}
                        className={cn(
                          'inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[10px] font-bold uppercase tracking-[0.12em] transition-all',
                          isActiveMode
                            ? 'border-cyan-400/20 bg-cyan-500/10 text-cyan-200'
                            : 'border-white/[0.06] bg-white/[0.03] text-slate-300 hover:border-white/[0.12] hover:text-white',
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{action.label}</span>
                        {action.id === 'search' && (
                          <span className="rounded-full border border-white/[0.08] px-1.5 py-0.5 text-[8px] text-slate-500">
                            ⌘K
                          </span>
                        )}
                        {action.id === 'favorites' && visibleFavoriteIds.length > 0 && (
                          <span className="rounded-full border border-white/[0.08] px-1.5 py-0.5 text-[8px] text-slate-400">
                            {visibleFavoriteIds.length}
                          </span>
                        )}
                        {action.id === 'recent' && visibleRecentIds.length > 0 && (
                          <span className="rounded-full border border-white/[0.08] px-1.5 py-0.5 text-[8px] text-slate-400">
                            {visibleRecentIds.length}
                          </span>
                        )}
                        {action.id === 'recommended' && recommendedItems.length > 0 && (
                          <span className="rounded-full border border-white/[0.08] px-1.5 py-0.5 text-[8px] text-slate-400">
                            {recommendedItems.length}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="group relative mt-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-emerald-300" />
                <input
                  ref={searchInputRef}
                  type="search"
                  placeholder="Фільтр меню..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-8 w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] pl-9 pr-16 text-xs text-white outline-none transition-all placeholder:text-slate-500 focus:border-emerald-400/30 focus:bg-white/[0.06]"
                />
                <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-[9px] text-slate-500">
                  <Command className="h-3 w-3" />
                  <span>K</span>
                </div>
                {search && (
                  <button
                    title="Очистити пошук"
                    onClick={() => setSearch('')}
                    className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-white"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

      <nav className="relative flex-1 overflow-y-auto overflow-x-hidden px-2 pb-1 custom-scrollbar">
        {filteredSections.length === 0 ? (
          <div className="surface-panel mt-3 rounded-[24px] p-4 text-sm text-slate-300">
            <div className="text-sm font-bold text-white">{getModeLabel(workspaceMode)}</div>
            <p className="mt-2 text-xs leading-5 text-slate-400">{emptyStateMessage}</p>
            <button
              type="button"
              onClick={() => {
                setWorkspaceMode('all');
                setSearch('');
              }}
              className="mt-3 rounded-full border border-white/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-300 transition-colors hover:border-white/[0.12] hover:text-white"
            >
              Показати всю навігацію
            </button>
          </div>
        ) : (
          filteredSections.map((section) => {
            const accent = navAccentStyles[section.accent];
            const isCollapsed = collapsedSections[section.id] && !search;

            return (
              <div
                key={section.id}
                className={cn(
                  'mb-1 overflow-hidden rounded-[18px]',
                  isOpen ? 'bg-transparent' : 'border-transparent bg-transparent',
                )}
              >
                {isOpen ? (
                  <button
                    onClick={() => toggleSection(section.id)}
                    title={`${section.description} ${section.outcome}`}
                    className="w-full px-2 py-1.5 text-left transition-colors hover:bg-white/[0.04] active:bg-white/[0.06]"
                  >
                    <div className="flex items-start gap-2">
                      <span className={cn('mt-1 h-2 w-2 rounded-full', accent.dot)} />
                      <div className="min-w-0">
                        <div className="truncate text-[8px] font-black uppercase tracking-[0.18em] text-white/90">
                          {section.label}
                        </div>
                        {(workspaceMode !== 'all' || search) && (
                          <div className="mt-0.5 truncate text-[9px] text-slate-500">{section.outcome}</div>
                        )}
                      </div>
                      <ChevronDown
                        size={10}
                        className={cn('ml-auto mt-0.5 shrink-0 text-slate-500 transition-transform', isCollapsed && '-rotate-90')}
                      />
                    </div>
                  </button>
                ) : (
                  <div className="mx-auto my-1.5 flex h-8 w-8 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.04]">
                    <span className={cn('h-2 w-2 rounded-full', accent.dot)} />
                  </div>
                )}

                <AnimatePresence initial={false}>
                  {(!isCollapsed || !isOpen) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className={cn('space-y-0.5 px-1 pb-0.5', !isOpen && 'px-0 pb-0')}>
                        {(section.groups ?? []).map((group) => (
                          <div key={`${section.id}-${group.title ?? 'group'}`} className="space-y-0.5">
                            {isOpen && group.title && (
                              <div className="px-2 pt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
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
                                        'group relative flex items-center gap-2.5 rounded-2xl border border-transparent transition-all duration-300',
                                        isOpen ? 'px-2 py-1.5 pr-10' : 'mx-auto h-9 w-9 justify-center',
                                        isActive
                                          ? 'border-white/[0.08] bg-white/[0.04] text-white shadow-[0_12px_30px_rgba(2,6,23,0.3)] backdrop-blur-md'
                                          : 'text-slate-400 hover:border-white/[0.06] hover:bg-white/[0.02] hover:text-white',
                                        'active:scale-[0.98]'
                                      )
                                    }
                                  >
                                    {({ isActive }) => (
                                      <>
                                        <div
                                          className={cn(
                                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-[12px] border transition-colors',
                                            isActive ? accent.iconBorder : 'border-white/[0.06] bg-black/20',
                                          )}
                                        >
                                          <item.icon
                                            className={cn(
                                              'h-4 w-4 transition-colors',
                                              isActive ? accent.icon : 'text-slate-400 group-hover:text-white',
                                            )}
                                          />
                                        </div>

                                        {isOpen && (
                                          <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                              <span className="truncate text-xs font-semibold">{item.label}</span>
                                              {item.badge && (
                                                <span
                                                  className={cn(
                                                    'rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em]',
                                                    accent.badge,
                                                  )}
                                                >
                                                  {item.badge}
                                                </span>
                                              )}
                                            </div>
                                            {(search || workspaceMode !== 'all') && (
                                              <p className="mt-0.5 line-clamp-1 text-[9px] leading-3.5 text-slate-500">
                                                {item.description}
                                              </p>
                                            )}
                                          </div>
                                        )}

                                        {isOpen && isActive && (
                                          <div className={cn('absolute inset-y-2 right-1.5 w-1 rounded-full bg-gradient-to-b', accent.glow)} />
                                        )}
                                      </>
                                    )}
                                  </NavLink>

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
                                        'absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full p-1 transition-all',
                                        isFavorite
                                          ? 'opacity-100 text-amber-300'
                                          : 'opacity-0 text-slate-500 group-hover/item:opacity-100 hover:text-white',
                                      )}
                                    >
                                      <Star className={cn('h-3.5 w-3.5', isFavorite && 'fill-current')} />
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
          })
        )}
      </nav>

      <div className="relative border-t border-white/[0.06] px-3 py-0.5">
        <div
          className={cn(
            'surface-panel flex items-center gap-2 rounded-[18px] p-1',
            !isOpen && 'justify-center px-0',
          )}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10">
            <User className="h-4 w-4 text-indigo-300" />
          </div>
          {isOpen && (
            <>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold text-white">{user?.name || 'Адміністратор'}</div>
                <div className="truncate text-[10px] text-slate-500">{roleLabel}</div>
              </div>
              <button
                onClick={logout}
                className="flex h-6 w-6 items-center justify-center rounded-2xl text-slate-500 transition-colors hover:bg-rose-500/10 hover:text-rose-200"
                title="Вийти з системи"
              >
                <LogOut size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="card-depth absolute -right-3 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-slate-900/90 text-slate-300 shadow-[0_0_20px_rgba(2,6,23,0.8)] backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-cyan-400/40 hover:bg-slate-800 hover:text-cyan-300"
        title={isOpen ? 'Згорнути навігацію' : 'Розгорнути навігацію'}
      >
        {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>
    </motion.aside>
  );
};

export default Sidebar;
