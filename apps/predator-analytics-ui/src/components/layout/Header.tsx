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
    gradient: 'radial-gradient(circle at 0% 0%, rgba(245,158,11,0.1) 0%, transparent 60%)',
    glow: 'rgba(245,158,11,0.15)',
    border: 'rgba(245,158,11,0.18)',
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
  const sectionGlow = section ? (sectionGlowMap[section.accent] ?? sectionGlowMap.amber) : sectionGlowMap.amber;
  const roleLabel = getRoleLabel(currentRole);
  const [isPaletteOpen, setIsPaletteOpen] = useAtom(shellCommandPaletteOpenAtom);
  const [isContextRailOpen, setIsContextRailOpen] = useAtom(shellContextRailOpenAtom);
  const shellV2Enabled = isShellV2Enabled();

  return (
    <header
      className="sticky top-0 z-40 border-b op-mode-transition"
      style={{
        background: 'rgba(2,6,18,0.88)',
        backdropFilter: 'blur(24px) saturate(180%)',
        borderColor: 'rgba(255,255,255,0.07)',
        boxShadow: '0 4px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* Верхня акцентна лінія розділу */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${sectionGlow.glow} 40%, ${sectionGlow.glow} 60%, transparent 100%)`,
        }}
      />

      <div className="mx-auto max-w-[1920px] px-3 sm:px-5 lg:px-7 xl:px-10">
        <div className="flex items-center gap-4 py-3">

          {/* ── ЛІВА ЧАСТИНА: Breadcrumb + Title ── */}
          <div className="flex-1 min-w-0">
            {/* Breadcrumb навігація */}
            <div className="flex items-center gap-2 mb-2">
              {/* Іконка розділу */}
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background: sectionGlow.gradient,
                  border: `1px solid ${sectionGlow.border}`,
                }}
              >
                {section ? (
                  <Layers3 className={cn('h-3.5 w-3.5', accent.icon)} />
                ) : (
                  <ShieldCheck className={cn('h-3.5 w-3.5', accent.icon)} />
                )}
              </div>

              {/* Breadcrumb path */}
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em]">
                <span
                  className="rounded-full border px-2 py-0.5"
                  style={{
                    background: `${sectionGlow.glow.replace('0.15', '0.08')}`,
                    borderColor: sectionGlow.border,
                    color: accent.icon.includes('emerald') ? '#6ee7b7' :
                           accent.icon.includes('cyan')    ? '#67e8f9' :
                           accent.icon.includes('amber')   ? '#fcd34d' :
                           accent.icon.includes('indigo')  ? '#a5b4fc' :
                           accent.icon.includes('violet')  ? '#c4b5fd' :
                           accent.icon.includes('rose')    ? '#fda4af' :
                           '#94a3b8',
                  }}
                >
                  {section?.label ?? 'Платформа'}
                </span>
                {item && (
                  <>
                    <ChevronRight className="h-3 w-3 text-slate-600" />
                    <span className="text-slate-400">{item.label}</span>
                  </>
                )}
              </div>
            </div>

            {/* Головний заголовок сторінки */}
            <div className="flex items-end gap-4">
              <div className="min-w-0">
                <h1
                  className="text-[1.5rem] font-black tracking-tight leading-none truncate"
                  style={{ color: '#f8fafc', letterSpacing: '-0.025em' }}
                >
                  {item?.label ?? 'Панель управління'}
                </h1>
                <p
                  className="mt-1.5 text-sm leading-relaxed line-clamp-1 max-w-2xl"
                  style={{ color: '#64748b' }}
                >
                  {item?.description ??
                    section?.description ??
                    'Операційний контекст не визначено для поточного маршруту.'}
                </p>
              </div>
            </div>

            {/* Мета-рядок: дата, статус, режим */}
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <div
                className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderColor: 'rgba(255,255,255,0.08)',
                  color: '#64748b',
                }}
              >
                <Calendar className="h-3 w-3 text-slate-600" />
                {currentDate}
              </div>

              <div
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold',
                  backendStatus.isOffline
                    ? 'border-rose-400/20 bg-rose-500/08 text-rose-300'
                    : 'border-emerald-400/20 bg-emerald-500/08 text-emerald-300',
                )}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    backendStatus.isOffline ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse',
                  )}
                  style={{
                    boxShadow: backendStatus.isOffline
                      ? '0 0 5px rgba(248,113,113,0.7)'
                      : '0 0 5px rgba(52,211,153,0.7)',
                  }}
                />
                {backendStatus.statusLabel}
              </div>

              <div
                className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderColor: 'rgba(255,255,255,0.08)',
                  color: '#64748b',
                }}
              >
                <Command className="h-3 w-3" />
                {backendStatus.modeLabel}
              </div>
            </div>
          </div>

          {/* ── ПРАВА ЧАСТИНА: Пошук + Дії ── */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Командний пошук */}
            <div
              className="relative hidden sm:block"
              onClick={() => setIsPaletteOpen(true)}
            >
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
              <input
                type="search"
                readOnly
                value=""
                onFocus={() => setIsPaletteOpen(true)}
                placeholder="Пошук модулів та дій..."
                aria-label="Відкрити командний пошук"
                className="h-9 w-52 lg:w-64 cursor-pointer rounded-xl border text-sm text-slate-500 outline-none transition-all placeholder:text-slate-600"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderColor: 'rgba(255,255,255,0.08)',
                  paddingLeft: '2.25rem',
                  paddingRight: '3.5rem',
                }}
              />
              <div className="pointer-events-none absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
                <kbd
                  className="rounded border px-1 py-0.5 text-[8px] font-mono"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)', color: '#64748b' }}
                >⌘K</kbd>
              </div>
            </div>

            {/* Контекстна панель */}
            {shellV2Enabled && (
              <button
                title={isContextRailOpen ? 'Згорнути контекстну панель' : 'Відкрити контекстну панель'}
                onClick={() => setIsContextRailOpen((current) => !current)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border transition-all"
                style={{
                  background: isContextRailOpen ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.04)',
                  borderColor: isContextRailOpen ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)',
                  color: isContextRailOpen ? '#a5b4fc' : '#64748b',
                }}
              >
                {isContextRailOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
              </button>
            )}

            {/* Сповіщення */}
            <button
              title="Сповіщення"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderColor: 'rgba(255,255,255,0.08)',
                color: '#64748b',
              }}
            >
              <Bell className="h-4 w-4" />
              <span
                className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-400"
                style={{ boxShadow: '0 0 6px rgba(244,63,94,0.8)' }}
              />
            </button>

            {/* Профіль та операційний режим */}
            <div className="hidden md:flex items-center gap-2.5">
              <div className="h-7 w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />

              {/* Профіль */}
              <div
                className="flex items-center gap-2.5 rounded-xl border px-3 py-1.5 cursor-pointer transition-all"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-lg"
                  style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}
                >
                  <UserCircle className="h-3.5 w-3.5 text-indigo-300" />
                </div>
                <div className="hidden lg:block">
                  <div className="text-[11px] font-bold text-white leading-none">{user?.name || 'Адміністратор'}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5 leading-none">{roleLabel}</div>
                </div>
              </div>

              {/* Операційний режим */}
              <OperationalModeSwitch />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
