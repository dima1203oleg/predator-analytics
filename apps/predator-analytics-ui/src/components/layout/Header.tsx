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
  ChevronRight,
  Terminal,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { getNavigationContext, navAccentStyles } from '../../config/navigation';
import { useUser } from '../../context/UserContext';
import { useBackendStatus } from '../../hooks/useBackendStatus';
import { cn } from '../../lib/utils';
import { ROLE_DISPLAY_NAMES, UserRole } from '../../config/roles';
import { useAtom } from 'jotai';
import { shellCommandPaletteOpenAtom, shellContextRailOpenAtom } from '../../store/atoms';
import { isShellV2Enabled } from '../../services/shell/userWorkspace';
import OperationalModeSwitch from '../premium/OperationalModeSwitch';
import { SystemPulseIndicator } from '../SystemPulseIndicator';

// Кольорові акценти для кожного типу розділу
const sectionGlowMap: Record<string, { gradient: string; glow: string; border: string }> = {
  emerald: {
    gradient: 'radial-gradient(circle at 0% 0%, rgba(16,185,129,0.1) 0%, transparent 60%)',
    glow: 'rgba(16,185,129,0.15)',
    border: 'rgba(16,185,129,0.18)',
  },
  cyan: {
    gradient: 'radial-gradient(circle at 0% 0%, rgba(6,182,212,0.1) 0%, transparent 60%)',
    glow: 'rgba(6,182,212,0.15)',
    border: 'rgba(6,182,212,0.18)',
  },
  amber: {
    gradient: 'radial-gradient(circle at 0% 0%, rgba(244,63,94,0.1) 0%, transparent 60%)',
    glow: 'rgba(244,63,94,0.15)',
    border: 'rgba(244,63,94,0.18)',
  },
  indigo: {
    gradient: 'radial-gradient(circle at 0% 0%, rgba(99,102,241,0.1) 0%, transparent 60%)',
    glow: 'rgba(99,102,241,0.15)',
    border: 'rgba(99,102,241,0.18)',
  },
  violet: {
    gradient: 'radial-gradient(circle at 0% 0%, rgba(139,92,246,0.1) 0%, transparent 60%)',
    glow: 'rgba(139,92,246,0.15)',
    border: 'rgba(139,92,246,0.18)',
  },
  rose: {
    gradient: 'radial-gradient(circle at 0% 0%, rgba(244,63,94,0.1) 0%, transparent 60%)',
    glow: 'rgba(244,63,94,0.15)',
    border: 'rgba(244,63,94,0.18)',
  },
  slate: {
    gradient: 'radial-gradient(circle at 0% 0%, rgba(100,116,139,0.08) 0%, transparent 60%)',
    glow: 'rgba(100,116,139,0.12)',
    border: 'rgba(100,116,139,0.16)',
  },
};

const getRoleLabel = (role: string): string => {
  if (role === UserRole.ADMIN) return ROLE_DISPLAY_NAMES[UserRole.ADMIN];
  if (role === UserRole.CLIENT_PREMIUM) return ROLE_DISPLAY_NAMES[UserRole.CLIENT_PREMIUM];
  if (role === UserRole.CLIENT_BASIC) return 'Бізнес-контур';
  return 'режим перегляду';
};

const Header: React.FC = () => {
  const { user } = useUser();
  const location = useLocation();
  const currentDate = format(new Date(), "d MMMM yyyy 'р.'", { locale: uk });
  const backendStatus = useBackendStatus();
  const currentRole = user?.role ?? 'viewer';
  const { item, section } = getNavigationContext(location.pathname + location.search, currentRole);
  const accent = section ? navAccentStyles[section.accent] : navAccentStyles.amber;
  const sectionGlow = section ? (sectionGlowMap[section.accent] ?? sectionGlowMap.amber) : sectionGlowMap.amber;
  const roleLabel = getRoleLabel(currentRole);
  const [isPaletteOpen, setIsPaletteOpen] = useAtom(shellCommandPaletteOpenAtom);
  const [isContextRailOpen, setIsContextRailOpen] = useAtom(shellContextRailOpenAtom);
  const shellV2Enabled = isShellV2Enabled();
  const { isTerminalOpen, setTerminalOpen } = useAppStore();

  return (
    <header
      className="sticky top-0 z-40 border-b op-mode-transition"
      style={{
        background: 'rgba(2,6,18,0.7)',
        backdropFilter: 'blur(30px) saturate(200%)',
        borderColor: 'rgba(255,255,255,0.05)',
        boxShadow: '0 8px 64px -12px rgba(0,0,0,0.6)',
      }}
    >
      {/* Cinematic HUD Background Layers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(244,63,94,0.3),transparent_40%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px]" />
      </div>

      {/* Верхня акцентна лінія розділу */}
      <div
        className="absolute top-0 left-0 right-0 h-[1.5px] pointer-events-none opacity-80"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${sectionGlow.glow} 20%, ${sectionGlow.glow} 80%, transparent 100%)`,
        }}
      />

      <div className="mx-auto max-w-[1920px] px-3 sm:px-5 lg:px-7 xl:px-10 relative z-10">
        <div className="flex items-center gap-6 py-4">

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
                  <Layers3 className={cn('h-4 w-4 drop-shadow-[0_0_8px_currentColor]', accent.icon)} />
                ) : (
                  <ShieldCheck className={cn('h-4 w-4 drop-shadow-[0_0_8px_currentColor]', accent.icon)} />
                )}
              </div>

              {/* Breadcrumb path */}
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] italic">
                <span
                  className="rounded-lg border px-2.5 py-1 backdrop-blur-md"
                  style={{
                    background: `${sectionGlow.glow.replace('0.15', '0.1')}`,
                    borderColor: sectionGlow.border,
                    color: accent.icon.includes('emerald') ? '#6ee7b7' :
                           accent.icon.includes('cyan')    ? '#67e8f9' :
                           accent.icon.includes('rose')    ? '#fda4af' :
                           accent.icon.includes('indigo')  ? '#a5b4fc' :
                           accent.icon.includes('violet')  ? '#c4b5fd' :
                           '#fda4af',
                  }}
                >
                  {section?.label ?? 'ПЛАТФО МА'}
                </span>
                {item && (
                  <>
                    <ChevronRight className="h-3 w-3 text-slate-700 shrink-0" />
                    <span className="text-slate-500 hover:text-slate-300 transition-colors cursor-default drop-shadow-sm">{item.label}</span>
                  </>
                )}
              </div>
            </div>

            {/* Головний заголовок сторінки */}
            <div className="flex items-center gap-5">
              <div className="min-w-0">
                <h1
                  className="text-[1.75rem] font-black tracking-tight leading-none truncate italic text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                  style={{ letterSpacing: '-0.03em' }}
                >
                  {item?.label ?? 'ПАНЕЛЬ УПРАВЛІННЯ'}
                </h1>
              </div>
              
              {/* Статусні теги в одному рядку з заголовком */}
              <div className="hidden xl:flex items-center gap-3">
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500 italic">
                      <Calendar className="h-3 w-3 text-rose-500/50" />
                      {currentDate}
                   </div>
                   
                   <div className={cn(
                      "flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest italic",
                      backendStatus.isOffline 
                        ? "bg-rose-500/5 border-rose-500/20 text-rose-400" 
                        : "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                   )}>
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        backendStatus.isOffline ? "bg-rose-500" : "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                      )} />
                      {backendStatus.statusLabel}
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── П АВА ЧАСТИНА: Пошук + Дії ── */}
          <div className="flex items-center gap-4 shrink-0">
            <SystemPulseIndicator />
            
            {/* Командний пошук */}
            <div
              className="relative hidden md:block group cursor-pointer"
              onClick={() => setIsPaletteOpen(true)}
            >
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-600 group-hover:text-rose-500 transition-colors" />
              </div>
              <div className="h-10 w-56 lg:w-72 bg-black/40 border border-white/5 rounded-xl text-[11px] font-bold text-slate-400 flex items-center pl-10 pr-12 transition-all group-hover:border-rose-500/30 group-hover:bg-rose-500/[0.02] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] italic tracking-tight">
                ПОШУК_МОДУЛІВ...
              </div>
              <div className="absolute inset-y-0 right-2.5 flex items-center gap-1">
                <kbd className="hidden lg:flex items-center justify-center px-1.5 py-0.5 rounded border border-white/10 bg-black/40 text-[9px] font-black text-slate-500 group-hover:text-rose-400/80 group-hover:border-rose-500/30 transition-all">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Контекстні дії */}
            <div className="flex items-center gap-2 p-1.5 bg-black/40 border border-white/5 rounded-2xl shadow-lg">
              {shellV2Enabled && (
                <button
                  title={isContextRailOpen ? 'Згорнути контекстну панель' : 'Відкрити контекстну панель'}
                  onClick={() => setIsContextRailOpen((current) => !current)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 relative group",
                    isContextRailOpen 
                      ? "bg-indigo-500/10 text-indigo-400 shadow-[inset_0_0_12px_rgba(99,102,241,0.2)]" 
                      : "text-slate-600 hover:text-white hover:bg-white/[0.05]"
                  )}
                >
                  <PanelRight className="h-4 w-4" />
                </button>
              )}

              <button
                title="Сповіщення"
                className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:text-white hover:bg-white/[0.05] transition-all duration-300 group"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-600 rounded-full shadow-[0_0_8px_rgba(225,29,72,0.8)]" />
              </button>

              <button
                id="header-terminal-toggle"
                title={isTerminalOpen ? 'Закрити термінал' : 'Відкрити термінал'}
                onClick={() => setTerminalOpen(!isTerminalOpen)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 relative group",
                  isTerminalOpen 
                    ? "bg-rose-500/10 text-rose-400 shadow-[inset_0_0_12px_rgba(225,29,72,0.2)]" 
                    : "text-slate-600 hover:text-white hover:bg-white/[0.05]"
                )}
              >
                <Terminal className="h-4 w-4" />
              </button>
            </div>

            {/* Профіль та операційний режим */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-px bg-white/5" />
              
              {/* Профіль */}
              <div className="flex items-center gap-3 pl-1 group cursor-pointer">
                <div className="text-right hidden lg:block">
                  <div className="text-[11px] font-black text-white tracking-tight uppercase italic">{user?.name || 'ADMIN_CORE'}</div>
                  <div className="text-[8px] font-black text-rose-500/60 tracking-[0.2em] uppercase mt-0.5">{roleLabel}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center shadow-lg group-hover:border-rose-500/30 transition-all relative overflow-hidden">
                   <div className="absolute inset-0 bg-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                   <UserCircle className="h-6 w-6 text-slate-500 group-hover:text-rose-400 transition-colors" />
                </div>
              </div>

              <OperationalModeSwitch />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
