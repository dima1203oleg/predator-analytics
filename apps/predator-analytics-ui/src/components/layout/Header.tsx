import React from 'react';
import { useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import {
  Bell,
  Calendar,
  Command,
  Layers3,
  PanelRight,
  PanelRightClose,
  Radio,
  Search,
  ShieldCheck,
  UserCircle,
} from 'lucide-react';
import { getNavigationContext, navAccentStyles } from '../../config/navigation';
import { useUser } from '../../context/UserContext';
import { useBackendStatus } from '../../hooks/useBackendStatus';
import { cn } from '../../lib/utils';
import { ROLE_DISPLAY_NAMES, UserRole } from '../../config/roles';
import { useAtom } from 'jotai';
import { shellCommandPaletteOpenAtom, shellContextRailOpenAtom } from '../../store/atoms';
import { isShellV2Enabled } from '../../services/shell/userWorkspace';
import OperationalModeSwitch from '../premium/OperationalModeSwitch';

const getRoleLabel = (role: string): string => {
  if (role === UserRole.ADMIN) {
    return ROLE_DISPLAY_NAMES[UserRole.ADMIN];
  }

  if (role === UserRole.CLIENT_PREMIUM) {
    return ROLE_DISPLAY_NAMES[UserRole.CLIENT_PREMIUM];
  }

  if (role === UserRole.CLIENT_BASIC) {
    return 'Бізнес-контур';
  }

  return 'Режим перегляду';
};

const Header: React.FC = () => {
  const { user } = useUser();
  const location = useLocation();
  const currentDate = format(new Date(), "d MMMM yyyy 'р.'", { locale: uk });
  const backendStatus = useBackendStatus();
  const currentRole = user?.role ?? 'viewer';
  const { item, section } = getNavigationContext(location.pathname, currentRole);
  const accent = section ? navAccentStyles[section.accent] : navAccentStyles.amber;
  const roleLabel = getRoleLabel(currentRole);
  const [isPaletteOpen, setIsPaletteOpen] = useAtom(shellCommandPaletteOpenAtom);
  const [isContextRailOpen, setIsContextRailOpen] = useAtom(shellContextRailOpenAtom);
  const shellV2Enabled = isShellV2Enabled();

  return (
    <header className="tactical-header sticky top-0 z-40 border-b border-[var(--op-border)] shadow-[0_32px_64px_-12px_var(--op-bg)] transition-colors duration-500">
      <div className="mx-auto grid max-w-[1920px] gap-6 px-2 sm:px-4 lg:px-6 py-4 xl:grid-cols-[1fr_340px] items-start">
        <div className="terminal-card bg-[var(--op-bg-panel)] border-[var(--op-border)] rounded-[28px] px-6 py-6 relative overflow-hidden transition-all duration-500 hover:shadow-[0_0_30px_var(--op-glow)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,var(--op-primary)_0%,transparent)] opacity-10 transition-colors duration-500" />
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            <span className={cn('rounded-full border px-2.5 py-1', accent.badge)}>
              {section?.label ?? 'Робочий простір'}
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300">{item?.label ?? 'Огляд'}</span>
          </div>

          <div className="mt-4 flex items-start gap-4">
            <div
              className={cn(
                'mt-1 hidden h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border shadow-[0_12px_32px_rgba(2,6,23,0.28)] lg:flex bg-cyan-950/20 backdrop-blur-md',
                accent.iconBorder,
              )}
            >
              {section ? (
                <Layers3 className={cn('h-5 w-5 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]', accent.icon)} />
              ) : (
                <ShieldCheck className={cn('h-5 w-5 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]', accent.icon)} />
              )}
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-2xl font-black tracking-tight text-white sm:text-[2rem]">
                {item?.label ?? 'Панель управління'}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300 sm:text-[15px]">
                {item?.description ??
                  section?.description ??
                  'Операційний контекст не визначено для поточного маршруту.'}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span className="status-pill">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  {currentDate}
                </span>
                <span
                  className={cn(
                    'status-pill',
                    backendStatus.isOffline
                      ? 'border-rose-400/20 bg-rose-500/10 text-rose-200'
                      : 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200',
                  )}
                >
                  <Radio className="h-3.5 w-3.5" />
                  {backendStatus.statusLabel}
                </span>
                <span className="status-pill">
                  <Command className="h-3.5 w-3.5 text-slate-500" />
                  {backendStatus.modeLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="surface-panel rounded-[28px] p-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="search"
                  readOnly
                  value=""
                  onFocus={() => setIsPaletteOpen(true)}
                  onClick={() => setIsPaletteOpen(true)}
                  placeholder="Командний пошук: модуль, сутність або дія..."
                  aria-label="Відкрити командний пошук"
                  className="h-12 w-full cursor-pointer rounded-2xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-16 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-cyan-400/30 focus:bg-white/[0.06]"
                />
                <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-[10px] text-slate-500">
                  <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono">⌘</kbd>
                  <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono">K</kbd>
                </div>
              </div>

              {shellV2Enabled && (
                <button
                  title={isContextRailOpen ? 'Згорнути контекстну панель' : 'Відкрити контекстну панель'}
                  onClick={() => setIsContextRailOpen((current) => !current)}
                  className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-slate-300 transition-all hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-white"
                >
                  {isContextRailOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
                </button>
              )}

              <button
                title="Сповіщення"
                className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-slate-300 transition-all hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-white"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-rose-400" />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
              <span>{isPaletteOpen ? 'Командний пошук відкритий' : 'Швидка навігація через командний пошук'}</span>
              <span className="font-mono uppercase tracking-[0.22em] text-slate-400">{shellV2Enabled ? 'Shell v2' : 'Ready'}</span>
            </div>

            {/* Перемикач операційного режиму */}
            <div className="mt-3 flex justify-end">
              <OperationalModeSwitch />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="surface-panel flex flex-col justify-between rounded-[24px] px-4 py-4 min-h-[96px]">
              <div className="tactical-label">Поточний профіль</div>
              <div className="mt-auto flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10">
                  <UserCircle className="h-5 w-5 text-indigo-300" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-white">{user?.name || 'Адміністратор'}</div>
                  <div className="mt-1 truncate text-[11px] text-slate-400">{roleLabel}</div>
                </div>
              </div>
            </div>

            <div className="surface-panel flex flex-col justify-between rounded-[24px] px-4 py-4 min-h-[96px]">
              <div className="tactical-label">Джерело даних</div>
              <div className="mt-auto">
                <div className="text-sm font-semibold text-white truncate">{backendStatus.sourceLabel}</div>
                <div className="mt-1 text-[11px] text-slate-400 truncate">{backendStatus.modeLabel}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
