import { Button } from '@/components/ui/button';
import React from 'react';
import { useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import {
  Bell,
  Calendar,
  Layers3,
  PanelRight,
  Search,
  ShieldCheck,
  UserCircle,
  ChevronRight,
  Monitor,
  Terminal,
  Smartphone,
  Tablet,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { getNavigationContext, navAccentStyles } from '../../config/navigation';
import { useUser } from '../../context/UserContext';
import { useBackendStatus } from '../../hooks/useBackendStatus';
import { cn } from '../../lib/utils';
import { ROLE_DISPLAY_NAMES, UserRole, resolveUserRole } from '../../config/roles';
import { useAtom } from 'jotai';
import { shellCommandPaletteOpenAtom, shellContextRailOpenAtom } from '../../store/atoms';
import { isShellV2Enabled } from '../../services/shell/userWorkspace';
import OperationalModeSwitch from '../premium/OperationalModeSwitch';
import { SystemPulseIndicator } from '../SystemPulseIndicator';
import { DisplayMode, useDisplayMode } from '../../context/DisplayModeContext';
import { useViewport } from '../../hooks/useViewport';

// Кольорові акценти для кожного типу розділу
const sectionGlowMap: Record<string, { gradient: string; glow: string; border: string }> = {
  emerald: {
    gradient: 'radial-gradient(circle at 0% 0%, rgba(196,18,48,0.08) 0%, transparent 60%)',
    glow: 'rgba(196,18,48,0.12)',
    border: 'rgba(196,18,48,0.15)',
  },
  cyan: {
    gradient: 'radial-gradient(circle at 0% 0%, rgba(196,18,48,0.08) 0%, transparent 60%)',
    glow: 'rgba(196,18,48,0.12)',
    border: 'rgba(196,18,48,0.15)',
  },
  amber: {
    gradient: 'radial-gradient(circle at 0% 0%, rgba(196,18,48,0.1) 0%, transparent 60%)',
    glow: 'rgba(196,18,48,0.15)',
    border: 'rgba(196,18,48,0.18)',
  },
  indigo: {
    gradient: 'radial-gradient(circle at 0% 0%, rgba(196,18,48,0.08) 0%, transparent 60%)',
    glow: 'rgba(196,18,48,0.12)',
    border: 'rgba(196,18,48,0.15)',
  },
  violet: {
    gradient: 'radial-gradient(circle at 0% 0%, rgba(196,18,48,0.08) 0%, transparent 60%)',
    glow: 'rgba(196,18,48,0.12)',
    border: 'rgba(196,18,48,0.15)',
  },
  rose: {
    gradient: 'radial-gradient(circle at 0% 0%, rgba(196,18,48,0.12) 0%, transparent 60%)',
    glow: 'rgba(196,18,48,0.18)',
    border: 'rgba(196,18,48,0.2)',
  },
  slate: {
    gradient: 'radial-gradient(circle at 0% 0%, rgba(100,116,139,0.06) 0%, transparent 60%)',
    glow: 'rgba(100,116,139,0.1)',
    border: 'rgba(100,116,139,0.12)',
  },
};

const getRoleLabel = (role: UserRole): string => {
  return ROLE_DISPLAY_NAMES[role] ?? 'PREDATOR Terminal';
};

const Header: React.FC = () => {
  const { user } = useUser();
  const location = useLocation();
  const currentDate = format(new Date(), "d MMMM yyyy 'р.'", { locale: uk });
  const backendStatus = useBackendStatus();
  const currentRole = resolveUserRole(user?.role);
  const { item, section } = getNavigationContext(location.pathname + location.search, currentRole);
  const accent = section ? navAccentStyles[section.accent] : navAccentStyles.amber;
  const sectionGlow = section ? (sectionGlowMap[section.accent] ?? sectionGlowMap.amber) : sectionGlowMap.amber;
  const roleLabel = getRoleLabel(currentRole);
  const [isPaletteOpen, setIsPaletteOpen] = useAtom(shellCommandPaletteOpenAtom);
  const [isContextRailOpen, setIsContextRailOpen] = useAtom(shellContextRailOpenAtom);
  const shellV2Enabled = isShellV2Enabled();
  const { isTerminalOpen, setTerminalOpen, highVisibility, setHighVisibility } = useAppStore();
  const { mode: displayMode, setMode: setDisplayMode } = useDisplayMode();
  const { isCompact, isMedium } = useViewport();
  const isMobileMode = isCompact;
  const isTabletMode = isMedium && !isCompact;

  // Режими пристроїв для емулятора
  const deviceModes: { mode: DisplayMode; label: string; icon: React.FC<{ className?: string }> }[] = [
    { mode: DisplayMode.DESKTOP, label: `Комп'ютер`, icon: Monitor },
    { mode: DisplayMode.TABLET, label: 'Планшет', icon: Tablet },
    { mode: DisplayMode.MOBILE, label: 'Телефон', icon: Smartphone },
  ];

  return (
    <header
      className="sticky top-0 z-40 border-b border-white/[0.06] op-mode-transition shadow-[0_8px_32px_rgba(0,0,0,0.8)]"
      style={{
        background: 'rgba(15, 15, 17, 0.97)',
      }}
    >
      {/* Тактичне затінення */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(20,15,15,0.3)_0%,transparent_100%)]" />

      {/* Верхня акцентна лінія розділу */}
      <div
        className="absolute top-0 left-0 right-0 h-[1.5px] pointer-events-none opacity-60"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${sectionGlow.glow} 20%, ${sectionGlow.glow} 80%, transparent 100%)`,
        }}
      />

      <div className="mx-auto max-w-[1920px] px-3 sm:px-5 lg:px-7 xl:px-10 relative z-10">
        <div className={cn("flex gap-4 py-4", isMobileMode ? "flex-col" : "items-center")}>

          {/* ── ЛІВА ЧАСТИНА: Breadcrumb + Title ── */}
          <div className="flex-1 min-w-0">
            {/* Breadcrumb навігація */}
            <div className="flex items-center gap-3 mb-2.5">
              {/* Іконка розділу */}
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl shadow-lg relative group overflow-hidden"
                style={{
                  background: sectionGlow.gradient,
                  border: `1px solid ${sectionGlow.border}`,
                }}
              >
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                {section ? (
                  <Layers3 className={cn('h-4 w-4 ', accent.icon)} />
                ) : (
                  <ShieldCheck className={cn('h-4 w-4 ', accent.icon)} />
                )}
              </div>

              {/* Breadcrumb path */}
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                <span
                  className="rounded-lg border px-2.5 py-1"
                  style={{
                    background: `${sectionGlow.glow.replace('0.15', '0.1')}`,
                    borderColor: sectionGlow.border,
                    color: '#e8888f',
                  }}
                >
                  {section?.label ?? 'ПЛАТФОРМА'}
                </span>
                {item && !isMobileMode && (
                  <>
                    <ChevronRight className="h-3 w-3 text-slate-700 shrink-0" />
                    <span className="text-slate-500 hover:text-slate-300 transition-colors cursor-default ">{item.label}</span>
                  </>
                )}
              </div>
            </div>

            {/* Головний заголовок сторінки */}
            <div className="flex items-center gap-5">
              <div className="min-w-0">
                <h1
                  className={cn(
                    "font-display font-bold leading-none tracking-tight text-white transition-all",
                    isMobileMode 
                      ? "text-[1.25rem] tracking-tight" 
                      : "text-[1.75rem] sm:text-[1.85rem]"
                  )}
                  style={{ letterSpacing: '-0.035em' }}
                >
                  {item?.label ?? 'ПАНЕЛЬ УПРАВЛІННЯ'}
                </h1>
              </div>
              
              {/* Статусні теги в одному рядку з заголовком */}
              {!isMobileMode && !isTabletMode && (
                <div className="hidden xl:flex items-center gap-3">
                  <div className="h-4 w-px bg-white/10" />
                  <div className="flex items-center gap-3">
                     <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-[9px] font-semibold uppercase tracking-widest text-slate-500">
                        <Calendar className="h-3 w-3 text-sky-500/70" />
                        {currentDate}
                     </div>
                     
                     <div className={cn(
                        "flex items-center gap-2 rounded-full border px-3 py-1 text-[9px] font-semibold uppercase tracking-widest",
                        backendStatus.isOffline 
                          ? "bg-rose-500/5 border-rose-500/20 text-rose-400" 
                          : "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                     )}>
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          backendStatus.isOffline ? "bg-rose-500" : "bg-emerald-500"
                        )} />
                        {backendStatus.statusLabel}
                     </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── ПРАВА ЧАСТИНА: Пошук + Дії ── */}
          <div className={cn("flex items-center shrink-0", isMobileMode ? "justify-between w-full" : "gap-4")}>
            {!isMobileMode && <SystemPulseIndicator />}
            
            <div className={cn("flex items-center gap-1 rounded-2xl border border-white/5 bg-black/40 p-1.5 shadow-lg", isMobileMode ? "" : "flex")} role="group" aria-label="Емулятор пристроїв">
              {deviceModes.map(({ mode, label, icon: Icon }) => (
                <Button variant="cyber"
                  key={mode}
                  title={`Емулятор: ${label}`}
                  aria-label={`Перемкнути на ${label}`}
                  aria-pressed={displayMode === mode}
                  onClick={() => setDisplayMode(mode)}
                  className={cn(
                    "flex items-center justify-center rounded-xl transition-all duration-300",
                    isMobileMode ? "h-12 w-12" : "h-9 w-9",
                    displayMode === mode
                      ? "border border-red-500/30 bg-red-500/10 text-red-300 shadow-[inset_0_0_14px_rgba(185,28,28,0.18)]"
                      : "text-slate-600 hover:bg-white/[0.05] hover:text-white"
                  )}
                >
                  <Icon className={cn(isMobileMode ? "h-6 w-6" : "h-4 w-4")} aria-hidden="true" />
                </Button>
              ))}
            </div>
            
            {/* Командний пошук */}
            {!isMobileMode && (
              <div
                className="relative hidden md:block group cursor-pointer"
                onClick={() => setIsPaletteOpen(true)}
                role="button"
                tabIndex={0}
                aria-label="Відкрити командний пошук"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsPaletteOpen(true);
                  }
                }}
              >
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-600 transition-colors group-hover:text-red-400" aria-hidden="true" />
                </div>
                <div className="flex h-10 w-56 items-center rounded-xl border border-white/[0.07] bg-black/45 pl-10 pr-12 text-[11px] font-medium tracking-tight text-slate-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.45)] transition-all group-hover:border-red-500/25 group-hover:bg-red-500/[0.03] lg:w-72">
                  Знайти модуль, звіт або дію…
                </div>
                <div className="absolute inset-y-0 right-2.5 flex items-center gap-1">
                  <kbd className="hidden items-center justify-center rounded border border-white/10 bg-black/50 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 transition-all group-hover:border-red-500/30 group-hover:text-red-300/90 lg:flex">
                    ⌘K
                  </kbd>
                </div>
              </div>
            )}

            {/* Контекстні дії */}
            <div className="flex items-center gap-2 p-1.5 bg-black/40 border border-white/5 rounded-2xl shadow-lg">
              {shellV2Enabled && !isMobileMode && (
                <Button variant="cyber"
                  title={isContextRailOpen ? 'Згорнути контекстну панель' : 'Відкрити контекстну панель'}
                  onClick={() => setIsContextRailOpen((current) => !current)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 relative group",
                    isContextRailOpen 
                      ? "bg-red-500/10 text-red-400 shadow-[inset_0_0_12px_rgba(196,18,48,0.15)]" 
                      : "text-slate-600 hover:text-white hover:bg-white/[0.05]"
                  )}
                >
                  <PanelRight className="h-4 w-4" />
                </Button>
              )}

              <Button variant="cyber"
                title="Сповіщення"
                aria-label="Сповіщення"
                className={cn(
                  "relative flex items-center justify-center rounded-xl text-slate-600 hover:text-white hover:bg-white/[0.05] transition-all duration-300 group",
                  isMobileMode ? "h-12 w-12" : "h-9 w-9"
                )}
              >
                <Bell className={cn(isMobileMode ? "h-6 w-6" : "h-4 w-4")} aria-hidden="true" />
                <span className={cn("absolute bg-rose-500 rounded-full animate-ping", isMobileMode ? "top-3 right-3 w-2 h-2" : "top-2 right-2 w-1.5 h-1.5")} aria-hidden="true" />
                <span className={cn("absolute bg-rose-600 rounded-full", isMobileMode ? "top-3 right-3 w-2 h-2" : "top-2 right-2 w-1.5 h-1.5")} aria-hidden="true" />
              </Button>

              <Button variant="cyber"
                title={highVisibility ? 'Режим звичайної видимості' : 'Режим високої видимості (Контраст)'}
                aria-label={highVisibility ? 'Режим звичайної видимості' : 'Режим високої видимості (Контраст)'}
                aria-pressed={highVisibility}
                onClick={() => setHighVisibility(!highVisibility)}
                className={cn(
                  "flex items-center justify-center rounded-xl transition-all duration-300 relative group",
                  isMobileMode ? "h-12 w-12" : "h-9 w-9",
                  highVisibility
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[inset_0_0_12px_rgba(245,158,11,0.2)]"
                    : "text-slate-600 hover:text-white hover:bg-white/[0.05]"
                )}
              >
                {highVisibility ? <EyeOff className={cn(isMobileMode ? "h-6 w-6" : "h-4 w-4")} aria-hidden="true" /> : <Eye className={cn(isMobileMode ? "h-6 w-6" : "h-4 w-4")} aria-hidden="true" />}
              </Button>

              {!isMobileMode && (
                <Button variant="cyber"
                  id="header-terminal-toggle"
                  title={isTerminalOpen ? 'Закрити термінал' : 'Відкрити термінал'}
                  aria-label={isTerminalOpen ? 'Закрити термінал' : 'Відкрити термінал'}
                  aria-pressed={isTerminalOpen}
                  onClick={() => setTerminalOpen(!isTerminalOpen)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 relative group",
                    isTerminalOpen
                      ? "bg-rose-500/10 text-rose-400 shadow-[inset_0_0_12px_rgba(225,29,72,0.2)]"
                      : "text-slate-600 hover:text-white hover:bg-white/[0.05]"
                  )}
                >
                  <Terminal className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
            </div>

            {/* Профіль та операційний режим */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-px bg-white/5" />
              
              {/* Профіль */}
              <div className="flex items-center gap-3 pl-1 group cursor-pointer">
                {!isMobileMode && !isTabletMode && (
                  <div className="text-right hidden lg:block">
                    <div className="text-[11px] font-semibold uppercase tracking-tight text-white">{user?.name || 'ADMIN_CORE'}</div>
                    <div className="mt-0.5 text-[8px] uppercase tracking-[0.18em] text-slate-500">{roleLabel}</div>
                  </div>
                )}
                <div className={cn("relative flex items-center justify-center overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-br from-slate-800 to-slate-950 shadow-lg transition-all group-hover:border-red-500/35", isMobileMode ? "h-14 w-14 rounded-2xl" : "h-10 w-10")}>
                   <div className="absolute inset-0 bg-red-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
                   <UserCircle className={cn("text-slate-500 transition-colors group-hover:text-red-300", isMobileMode ? "h-8 w-8" : "h-6 w-6")} />
                </div>
              </div>

              {!isMobileMode && <OperationalModeSwitch />}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
