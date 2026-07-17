/**
 * 🧭 AdaptiveNavigation — Unified navigation для всіх breakpoints
 * Compact: BottomNav | Medium: Rail | Expanded: Full Sidebar
 */
import { Button } from '@/components/ui/button';
import React, { useState, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Search, ShieldAlert, Megaphone, Menu,
  Network, Cpu, FileText, Settings, BarChart3, BrainCircuit,
  ChevronRight, ChevronLeft, X
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useViewport } from '@/hooks/useViewport';
import { SwipeableDrawer } from './SwipeableDrawer';

interface NavItem {
  id: string;
  label: string;
  shortLabel?: string;
  path: string;
  icon: React.ElementType;
  badge?: number;
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  { id: 'board', label: 'Командний центр', shortLabel: 'Головна', path: '/command?tab=board', icon: LayoutDashboard },
  { id: 'search', label: 'Глобальний пошук', shortLabel: 'Пошук', path: '/search?tab=global', icon: Search },
  { id: 'market', label: 'Торгова розвідка', shortLabel: 'Ринок', path: '/market?tab=overview', icon: BarChart3 },
  { id: 'osint', label: 'OSINT Hub', shortLabel: 'OSINT', path: '/osint?tab=graph', icon: Network },
  { id: 'alerts', label: 'Центр сповіщень', shortLabel: 'Алерти', path: '/alerts', icon: Megaphone, badge: 3 },
  { id: 'intel', label: 'Розвідка ШІ', shortLabel: 'ШІ', path: '/intelligence?tab=dashboard', icon: BrainCircuit },
  { id: 'factory', label: 'Фабрика', shortLabel: 'Фабрика', path: '/factory?tab=status', icon: Cpu },
  { id: 'reports', label: 'Звіти', shortLabel: 'Звіти', path: '/reports', icon: FileText },
  { id: 'admin', label: 'Адміністрування', shortLabel: 'Адмін', path: '/admin?tab=overview', icon: Settings },
];

// Primary items для compact (bottom nav)
const COMPACT_PRIMARY = ['board', 'search', 'osint', 'alerts'];

export const AdaptiveNavigation: React.FC = () => {
  const { breakpoint, isCompact, isMedium, isExpanded } = useViewport();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRailExpanded, setIsRailExpanded] = useState(false);

  const isActive = useCallback((path: string) => {
    const base = path.split('?')[0];
    return location.pathname === base || location.pathname.startsWith(`${base}/`);
  }, [location]);

  // ─── COMPACT: BottomNav + Mobile Menu ───
  if (isCompact) {
    const primaryItems = NAV_ITEMS.filter(i => COMPACT_PRIMARY.includes(i.id));
    const moreItems = NAV_ITEMS.filter(i => !COMPACT_PRIMARY.includes(i.id));

    return (
      <>
        {/* BottomNav */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-[70] h-20 safe-area-pb"
          style={{
            background: 'rgba(2,6,18,0.92)',
            backdropFilter: 'blur(20px) saturate(150%)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.6)',
          }}
        >
          <div className="flex h-full items-center justify-around px-1">
            {primaryItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 min-w-[64px] h-16 rounded-2xl transition-all duration-200',
                    active ? 'text-rose-400' : 'text-slate-500 hover:text-slate-300'
                  )}
                >
                  <div className={cn(
                    'relative flex items-center justify-center',
                    active && 'after:absolute after:-bottom-1 after:h-0.5 after:w-4 after:rounded-full after:bg-rose-500'
                  )}>
                    <Icon className={cn('h-[24px] w-[24px]', active && 'drop-shadow-[0_0_6px_rgba(225,29,72,0.5)]')} />
                    {item.badge && (
                      <span className="absolute -top-1 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    'text-[10px] font-bold uppercase tracking-wider leading-none mt-0.5',
                    active ? 'text-rose-400' : 'text-slate-500'
                  )}>
                    {item.shortLabel}
                  </span>
                </NavLink>
              );
            })}

            {/* More button */}
            <Button variant="cyber"
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center gap-1 min-w-[64px] h-16 rounded-2xl text-slate-500 hover:text-slate-300 transition-all"
            >
              <Menu className="h-[24px] w-[24px]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 leading-none mt-0.5">Меню</span>
            </Button>
          </div>
        </nav>

        {/* Full menu drawer */}
        <SwipeableDrawer
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          position="bottom"
          maxHeight="75vh"
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white/80">Навігація</h2>
              <Button variant="cyber" onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10">
                <X className="w-4 h-4 text-slate-400" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-3 p-4 rounded-2xl min-h-[100px] transition-all',
                      active
                        ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                        : 'bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10'
                    )}
                  >
                    <Icon className="w-8 h-8" />
                    <span className="text-[11px] font-bold text-center leading-tight uppercase tracking-wider">{item.shortLabel}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </SwipeableDrawer>
      </>
    );
  }

  // ─── MEDIUM: Collapsible Rail ───
  if (isMedium) {
    return (
      <motion.aside
        animate={{ width: isRailExpanded ? 220 : 64 }}
        className="relative flex flex-col h-screen bg-[#050505] border-r border-white/10 shrink-0 z-[9999]"
      >
        {/* Toggle */}
        <Button variant="cyber"
          type="button"
          onClick={() => setIsRailExpanded(!isRailExpanded)}
          className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center z-10 hover:bg-rose-500/30 transition-colors"
        >
          {isRailExpanded ? <ChevronLeft className="w-3 h-3 text-rose-400" /> : <ChevronRight className="w-3 h-3 text-rose-400" />}
        </Button>

        {/* Logo */}
        <div className="flex items-center justify-center h-14 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-rose-500" />
          </div>
          <AnimatePresence>
            {isRailExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="ml-2 text-xs font-bold uppercase tracking-wider text-white/80"
              >
                PREDATOR
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav items */}
        <div className="flex-1 py-2 space-y-0.5 overflow-y-auto scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 mx-1.5 rounded-lg transition-all group relative',
                  active
                    ? 'bg-rose-500/10 text-rose-400'
                    : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                )}
              >
                <Icon className={cn('w-[18px] h-[18px] shrink-0', active && 'drop-shadow-[0_0_6px_rgba(225,29,72,0.4)]')} />
                <AnimatePresence>
                  {isRailExpanded && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-xs font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {item.badge && (
                  <span className={cn(
                    'ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full text-[9px] font-bold',
                    active ? 'bg-rose-500 text-white' : 'bg-rose-500/20 text-rose-400'
                  )}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </motion.aside>
    );
  }

  // ─── EXPANDED/WIDE: Full Sidebar (delegated to existing Sidebar) ───
  return null; // MainLayout сам рендерить Sidebar
};

export default AdaptiveNavigation;
