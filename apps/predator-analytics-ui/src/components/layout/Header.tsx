import React from 'react';
import { useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import {
  Bell,
  Calendar,
  Command,
  Layers3,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  UserCircle,
  Target,
  CreditCard,
} from 'lucide-react';
import { getNavigationContext, navAccentStyles } from '../../config/navigation';
import { getRoleDisplayName, getRoleDescription } from '../../config/roles';
import { useUser } from '../../context/UserContext';
import { useBackendStatus } from '../../hooks/useBackendStatus';
import { cn } from '../../lib/utils';
import { FigmaDesignBridge } from '../design/FigmaDesignBridge';

const Header: React.FC = () => {
  const { user, canonicalRole, canonicalTier } = useUser();
  const location = useLocation();
  const currentDate = format(new Date(), "d MMMM yyyy 'р.'", { locale: uk });
  const backendStatus = useBackendStatus();
  const { item, section } = getNavigationContext(location.pathname, canonicalRole, canonicalTier);
  const accent = section ? navAccentStyles[section.accent] : navAccentStyles.amber;
  const roleLabel = getRoleDisplayName(canonicalRole);
  const roleDescription = getRoleDescription(canonicalRole);

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[linear-gradient(180deg,rgba(8,18,30,0.88),rgba(6,15,26,0.78))] backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[1660px] flex-col gap-4 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            <span className={cn('rounded-full border px-2.5 py-1', accent.badge)}>
              {section?.label ?? 'Робочий простір'}
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300">{item?.label ?? 'Огляд'}</span>
          </div>

          <div className="flex items-start gap-3">
            <div className={cn('mt-1 hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl border lg:flex', accent.iconBorder)}>
              {section ? (
                <Layers3 className={cn('h-5 w-5', accent.icon)} />
              ) : (
                <ShieldCheck className={cn('h-5 w-5', accent.icon)} />
              )}
            </div>

              <div className="min-w-0">
                <h1 className="truncate text-xl font-black tracking-tight text-white sm:text-2xl">
                  {item?.label ?? 'Панель управління'}
                </h1>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
                  {item?.description ?? section?.description ?? 'Операційний контекст не визначено для поточного маршруту.'}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  {currentDate}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1.5',
                    backendStatus.isOffline
                      ? 'border-rose-400/20 bg-rose-500/10 text-rose-200'
                      : 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200',
                  )}
                >
                  <Radio className="h-3.5 w-3.5" />
                  {backendStatus.statusLabel}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                  <Command className="h-3.5 w-3.5 text-slate-500" />
                  {backendStatus.modeLabel}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                  {roleLabel}
                </span>
                <FigmaDesignBridge variant="chip" className="shrink-0" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:min-w-[520px] lg:items-end">
          <div className="flex w-full flex-wrap items-center gap-3 lg:justify-end">
            <div className="relative min-w-[240px] flex-1 lg:max-w-[360px] lg:flex-none">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                placeholder="Пошук маршруту, сутності або коду..."
                className="h-11 w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-16 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-emerald-400/30 focus:bg-white/[0.06]"
              />
              <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-[10px] text-slate-500">
                <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono">⌘</kbd>
                <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono">K</kbd>
              </div>
            </div>

            <button
              title="Сповіщення"
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-slate-300 transition-all hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-white"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-rose-400" />
            </button>
          </div>

          <div className="flex w-full flex-wrap items-center gap-3 lg:justify-end">
            <div className="flex min-w-[220px] flex-1 items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 lg:max-w-[300px] lg:flex-none">
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-white">
                  {user?.name || 'Адміністратор'}
                </div>
                <div className="mt-1 truncate text-[11px] text-slate-400">
                  {roleDescription}
                </div>
              </div>
              <div className="ml-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10">
                <UserCircle className="h-5 w-5 text-indigo-300" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-100">
                <Target className="h-4 w-4" />
                Швидкий сценарій
              </span>
              <span className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-xs font-bold text-cyan-100">
                <CreditCard className="h-4 w-4" />
                {canonicalTier}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
