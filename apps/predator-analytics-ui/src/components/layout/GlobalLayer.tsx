import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Clock, Search, Sparkles, Star, BrainCircuit, Pin, Heart, type LucideIcon } from 'lucide-react';
import { navAccentStyles, type NavItem } from '../../config/navigation';
import { cn } from '../../lib/utils';
import { useBackendStatus } from '../../hooks/useBackendStatus';

interface GlobalLayerProps {
  items: NavItem[];
  isOpen: boolean;
}

const FAVORITES_STORAGE_KEY = 'predator-navigation-favorites';
const RECENT_STORAGE_KEY = 'predator-navigation-recent';

const iconMap: Record<string, LucideIcon> = {
  Search,
  Star,
  Clock,
  Sparkles,
  BrainCircuit,
};

const readStoredList = (key: string): string[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
};

const persistStoredList = (key: string, values: string[]): void => {
  localStorage.setItem(key, JSON.stringify(values));
};

export const GlobalLayer: React.FC<GlobalLayerProps> = ({ items, isOpen }) => {
  const location = useLocation();
  const backendStatus = useBackendStatus();
  const [favorites, setFavorites] = useState<string[]>(() => readStoredList(FAVORITES_STORAGE_KEY));
  const [recent, setRecent] = useState<string[]>(() => readStoredList(RECENT_STORAGE_KEY));

  useEffect(() => {
    setRecent((current) => {
      const nextRecent = [location.pathname, ...current.filter((path) => path !== location.pathname)].slice(0, 10);
      if (nextRecent.length === current.length && nextRecent.every((path, index) => path === current[index])) {
        return current;
      }
      persistStoredList(RECENT_STORAGE_KEY, nextRecent);
      return nextRecent;
    });
  }, [location.pathname]);

  const favoriteItems = useMemo(() => items.filter((item) => favorites.includes(item.path)), [favorites, items]);
  const recentItems = useMemo(() => recent.map((path) => items.find((item) => item.path === path)).filter((item): item is NavItem => Boolean(item)), [items, recent]);
  const aiRecommendations = useMemo(() => {
    const priorityItems = recentItems.slice(0, 3);
    if (priorityItems.length > 0) {
      return priorityItems;
    }
    return items.slice(0, 3);
  }, [items, recentItems]);

  const offlineBadge = backendStatus.isOffline ? 'Офлайн' : backendStatus.isTruthOnly ? 'Правда' : 'Онлайн';

  const toggleFavorite = (item: NavItem): void => {
    const nextFavorites = favorites.includes(item.path)
      ? favorites.filter((path) => path !== item.path)
      : [item.path, ...favorites].slice(0, 10);
    setFavorites(nextFavorites);
    persistStoredList(FAVORITES_STORAGE_KEY, nextFavorites);
  };

  if (!isOpen || items.length === 0) {
    return null;
  }

  return (
    <div className="relative mx-3 mt-3 rounded-3xl border border-violet-400/15 bg-violet-500/5 p-3 shadow-[0_18px_40px_rgba(109,40,217,0.08)]">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-200/80">
            Глобальний шар
          </div>
          <div className="mt-1 text-[11px] leading-5 text-slate-500">
            Швидкі переходи, обране, нещодавнє та AI-підказки.
          </div>
        </div>
        <span className={cn(
          'rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]',
          backendStatus.isOffline
            ? 'border-rose-400/20 bg-rose-500/10 text-rose-200'
            : 'border-violet-400/20 bg-violet-500/10 text-violet-200',
        )}>
          {offlineBadge}
        </span>
      </div>
      {!backendStatus.isOffline && backendStatus.sourceType === 'local' && (
        <div className="mb-3 rounded-2xl border border-amber-400/15 bg-amber-500/10 px-3 py-2 text-[11px] leading-5 text-amber-100">
          Локальний кеш активний: глобальний шар показує збережені маршрути й нещодавні переходи.
        </div>
      )}
      <div className="grid grid-cols-1 gap-2">
        {items.map((item) => {
          const ItemIcon = iconMap[item.id] ?? item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              title={item.description}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl border px-3 py-3 transition-all duration-200',
                  isActive
                    ? 'border-violet-300/25 bg-violet-500/15 text-white shadow-[0_10px_24px_rgba(109,40,217,0.16)]'
                    : 'border-white/[0.06] bg-white/[0.03] text-slate-300 hover:border-violet-300/15 hover:bg-violet-500/10 hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border transition-colors',
                      isActive ? 'border-violet-300/20 bg-violet-500/15 text-violet-200' : 'border-white/[0.06] bg-black/20 text-slate-400',
                    )}
                  >
                    <ItemIcon className="h-[16px] w-[16px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">{item.label}</span>
                      {item.badge && (
                        <span className={cn('rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em]', navAccentStyles.violet.badge)}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-1 text-[11px] leading-5 text-slate-500">{item.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      toggleFavorite(item);
                    }}
                    className={cn(
                      'ml-2 flex h-8 w-8 items-center justify-center rounded-xl border transition-colors',
                      favorites.includes(item.path)
                        ? 'border-rose-300/20 bg-rose-500/15 text-rose-200'
                        : 'border-white/[0.06] bg-black/20 text-slate-500 hover:text-white',
                    )}
                    title={favorites.includes(item.path) ? 'Прибрати з обраного' : 'Додати до обраного'}
                  >
                    <Heart size={14} className={favorites.includes(item.path) ? 'fill-current' : ''} />
                  </button>
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <section className="rounded-2xl border border-white/[0.05] bg-black/15 p-3">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">
            <Pin size={12} /> Обране
          </div>
          <div className="space-y-2">
            {favoriteItems.length > 0 ? favoriteItems.map((item) => (
              <NavLink key={`fav-${item.path}`} to={item.path} className="block rounded-xl border border-white/[0.04] bg-white/[0.03] px-3 py-2 text-xs text-slate-300 hover:bg-violet-500/10 hover:text-white">
                {item.label}
              </NavLink>
            )) : (
              <p className="text-[11px] leading-5 text-slate-500">Поки немає закріплених пунктів.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.05] bg-black/15 p-3">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">
            <Clock size={12} /> Нещодавнє
          </div>
          <div className="space-y-2">
            {recentItems.length > 0 ? recentItems.map((item) => (
              <NavLink key={`recent-${item.path}`} to={item.path} className="block rounded-xl border border-white/[0.04] bg-white/[0.03] px-3 py-2 text-xs text-slate-300 hover:bg-violet-500/10 hover:text-white">
                {item.label}
              </NavLink>
            )) : (
              <p className="text-[11px] leading-5 text-slate-500">Історія маршрутів з’явиться після переходів.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.05] bg-black/15 p-3">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">
            <Sparkles size={12} /> AI-рекомендації
          </div>
          <div className="space-y-2">
            {aiRecommendations.map((item) => (
              <NavLink key={`ai-${item.path}`} to={item.path} className="block rounded-xl border border-white/[0.04] bg-white/[0.03] px-3 py-2 text-xs text-slate-300 hover:bg-violet-500/10 hover:text-white">
                {item.label}
              </NavLink>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default GlobalLayer;
