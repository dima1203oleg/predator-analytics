import React, { useCallback, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useAtom } from 'jotai';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Search,
  Shield,
  User,
  X,
} from 'lucide-react';
import { isSidebarOpenAtom, sidebarSearchAtom } from '../../store/atoms';
import { useUser } from '../../context/UserContext';
import { getRoleDescription, getRoleDisplayName } from '../../config/roles';
import {
  getNavigationTotals,
  getVisibleNavigation,
  navAccentStyles,
  type NavSection,
} from '../../config/navigation';
import GlobalLayer from './GlobalLayer';
import { useBackendStatus } from '../../hooks/useBackendStatus';
import { cn } from '../../lib/utils';
import { useSidebarStore } from '../../store/sidebarStore';

export const Sidebar: React.FC = () => {
  const { user, logout, canonicalRole, canonicalTier } = useUser();
  const userRole = canonicalRole;
  const backendStatus = useBackendStatus();
  const [isOpen, setIsOpen] = useAtom(isSidebarOpenAtom);
  const [search, setSearch] = useAtom(sidebarSearchAtom);
  const openSections = useSidebarStore((state) => state.openSections);
  const toggleSidebarSection = useSidebarStore((state) => state.toggleSection);

  const visibleSections = useMemo(() => getVisibleNavigation(userRole, canonicalTier), [canonicalTier, userRole]);
  const totals = useMemo(() => getNavigationTotals(userRole, canonicalTier), [canonicalTier, userRole]);
  const globalSection = useMemo(() => visibleSections.find((section) => section.isGlobal) ?? null, [visibleSections]);

  const toggleSection = useCallback((sectionId: string) => {
    toggleSidebarSection(sectionId);
  }, [toggleSidebarSection]);

  const filteredSections = useMemo<NavSection[]>(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return visibleSections;
    }

    return visibleSections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.label.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            section.label.toLowerCase().includes(query) ||
            section.description.toLowerCase().includes(query),
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [search, visibleSections]);

  const renderNavItem = useCallback(
    (item: NavSection['items'][number], accentKey: keyof typeof navAccentStyles, searchActive: boolean) => (
      <NavLink
        key={item.id}
        to={item.path}
        title={!isOpen ? item.label : undefined}
        className={({ isActive }) =>
          cn(
            'group relative flex items-center gap-3 rounded-2xl border border-transparent transition-all duration-200',
            isOpen ? 'px-3 py-3' : 'mx-auto h-12 w-12 justify-center',
            isActive
              ? 'bg-white/[0.08] text-white shadow-[0_12px_30px_rgba(2,6,23,0.28)]'
              : 'text-slate-400 hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-white',
          )
        }
      >
        {({ isActive }) => (
          <>
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-colors',
                isActive ? navAccentStyles[accentKey].iconBorder : 'border-white/[0.06] bg-black/20',
              )}
            >
              <item.icon
                className={cn(
                  'h-[18px] w-[18px] transition-colors',
                  isActive ? navAccentStyles[accentKey].icon : 'text-slate-400 group-hover:text-white',
                )}
              />
            </div>

            {isOpen && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">{item.label}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        'rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em]',
                        navAccentStyles[accentKey].badge,
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                {(searchActive || isActive) && (
                  <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-500">{item.description}</p>
                )}
              </div>
            )}

            {isOpen && isActive && (
              <div className={cn('absolute inset-y-3 right-2 w-1 rounded-full bg-gradient-to-b', navAccentStyles[accentKey].glow)} />
            )}
          </>
        )}
      </NavLink>
    ),
    [isOpen],
  );

  return (
    <motion.aside
      data-testid="sidebar"
      initial={false}
      animate={{ width: isOpen ? 332 : 88 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      className="relative z-20 flex h-screen shrink-0 flex-col border-r border-white/[0.06] bg-[#04111d]/92 backdrop-blur-2xl"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.1),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.08),transparent_28%)]" />
      <div className="relative border-b border-white/[0.06] px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-500/20 via-amber-400/10 to-rose-500/10 shadow-[0_12px_32px_rgba(245,158,11,0.12)]">
            <Shield className="h-5 w-5 text-amber-300" />
          </div>

          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="min-w-0 overflow-hidden"
              >
                <div className="text-lg font-black tracking-tight text-white">PREDATOR</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-300/70">
                  Операційна навігація
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {isOpen && (
          <div className="mt-4 rounded-3xl border border-white/[0.06] bg-white/[0.03] p-4 shadow-[0_18px_40px_rgba(2,6,23,0.28)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  Режим даних
                </div>
                <div
                  className={cn(
                    'mt-1 text-sm font-black',
                    backendStatus.isOffline ? 'text-rose-200' : 'text-emerald-200',
                  )}
                >
                  {backendStatus.statusLabel}
                </div>
              </div>
              <span
                className={cn(
                  'rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]',
                  backendStatus.isOffline
                    ? 'border-rose-400/20 bg-rose-500/10 text-rose-200'
                    : 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200',
                )}
              >
                {backendStatus.isTruthOnly ? 'Правда' : 'Проксі'}
              </span>
            </div>

            <div className="mt-4 rounded-2xl border border-white/[0.06] bg-black/20 p-3">
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Поточна роль</div>
              <div className="mt-1 text-sm font-black text-white">{getRoleDisplayName(userRole)}</div>
              <div className="mt-1 text-xs leading-5 text-slate-400">{getRoleDescription(userRole)}</div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-3 py-2.5">
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Секції</div>
                <div className="mt-1 text-lg font-black text-white">{totals.sections}</div>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-3 py-2.5">
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Модулі</div>
                <div className="mt-1 text-lg font-black text-white">{totals.items}</div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/[0.06] bg-black/20 px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Джерело</div>
              <div className="mt-1 text-sm font-semibold text-slate-200">{backendStatus.sourceLabel}</div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2">
              <NavLink
                to="/procurement-optimizer"
                className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15"
              >
                Запустити сценарій закупівель
              </NavLink>
              <NavLink
                to="/scenario-progress"
                className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/15"
              >
                Відкрити центр виконання
              </NavLink>
            </div>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="relative px-4 py-3">
          <div className="group relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-emerald-300" />
            <input
              type="search"
              placeholder="Знайти розділ або підрозділ..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-11 w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-10 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-emerald-400/30 focus:bg-white/[0.06]"
            />
            {search && (
              <button
                title="Очистити пошук"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      <GlobalLayer items={globalSection?.items ?? []} isOpen={isOpen} />

      <nav className="relative flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4 custom-scrollbar">
        {filteredSections.filter((section) => !section.isGlobal).map((section) => {
          const accent = navAccentStyles[section.accent];
          const isCollapsed = !openSections.includes(section.id) && !search;
          const groups = section.groups ?? [];

          return (
            <div
              key={section.id}
              className={cn(
                'mb-3 overflow-hidden rounded-3xl border bg-white/[0.02]',
                accent.sectionBorder,
                !isOpen && 'border-transparent bg-transparent',
              )}
            >
              {isOpen ? (
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2.5 w-2.5 rounded-full', accent.dot)} />
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-white">
                      {section.label}
                    </span>
                    <span className="ml-auto rounded-full border border-white/[0.08] bg-black/20 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                      {section.items.length}
                    </span>
                    <ChevronDown
                      size={14}
                      className={cn('text-slate-500 transition-transform', isCollapsed && '-rotate-90')}
                    />
                  </div>
                  <p className="mt-2 pr-6 text-[11px] leading-5 text-slate-500">{section.description}</p>
                </button>
              ) : (
                <div className="mx-auto my-3 h-10 w-10 rounded-2xl border border-white/[0.06] bg-white/[0.04]" />
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
                    <div className={cn('space-y-4 px-2 pb-2', !isOpen && 'px-0 pb-0')}>
                      {groups.length > 0 ? (
                        groups.map((group) => (
                          <div key={group.id} className="space-y-2 rounded-2xl border border-white/[0.04] bg-black/10 p-2">
                            {isOpen && (
                              <div className="px-2 pt-1">
                                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">
                                  {group.label}
                                </div>
                                <div className="mt-1 text-[11px] leading-5 text-slate-500">
                                  {group.description}
                                </div>
                              </div>
                            )}
                            <div className="space-y-1">
                              {group.items.map((item) => renderNavItem(item, section.accent, Boolean(search)))}
                            </div>
                          </div>
                        ))
                      ) : (
                        section.items.map((item) => renderNavItem(item, section.accent, Boolean(search)))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      <div className="relative border-t border-white/[0.06] px-3 py-3">
        <div
          className={cn(
            'flex items-center gap-3 rounded-3xl border border-white/[0.08] bg-white/[0.04] p-3',
            !isOpen && 'justify-center px-0',
          )}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10">
            <User className="h-4.5 w-4.5 text-indigo-300" />
          </div>
          {isOpen && (
            <>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-white">{user?.name || 'Адміністратор'}</div>
                <div className="mt-1 truncate text-[11px] text-slate-500">
                  {backendStatus.isOffline ? 'Працює без підтвердженого бекенду' : backendStatus.modeLabel}
                </div>
              </div>
              <button
                onClick={logout}
                className="flex h-9 w-9 items-center justify-center rounded-2xl text-slate-500 transition-colors hover:bg-rose-500/10 hover:text-rose-200"
                title="Вийти з системи"
              >
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>

        {isOpen && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Тариф</div>
              <div className="mt-1 text-sm font-black text-white">{canonicalTier}</div>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Бекенд</div>
              <div className={cn('mt-1 text-sm font-black', backendStatus.isOffline ? 'text-rose-200' : 'text-emerald-200')}>
                {backendStatus.isOffline ? 'Немає зв’язку' : 'Активний'}
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-slate-900 text-slate-300 shadow-xl transition-all hover:border-emerald-400/30 hover:bg-emerald-500 hover:text-slate-950"
        title={isOpen ? 'Згорнути навігацію' : 'Розгорнути навігацію'}
      >
        {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>
    </motion.aside>
  );
};

export default Sidebar;
