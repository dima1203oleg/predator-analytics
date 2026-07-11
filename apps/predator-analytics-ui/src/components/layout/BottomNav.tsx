/**
 * 📱 Bottom Navigation для мобільних пристроїв
 * 5 основних вкладок: Головна, Пошук, OSINT, Алерти, Меню
 */
import { Button } from '@/components/ui/button';
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Search, ShieldAlert, Megaphone, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { path: '/command?tab=board', label: 'Головна', icon: LayoutDashboard },
  { path: '/search?tab=global', label: 'Пошук', icon: Search },
  { path: '/osint?tab=graph', label: 'OSINT', icon: ShieldAlert },
  { path: '/alerts', label: 'Алерти', icon: Megaphone },
];

interface BottomNavProps {
  onMenuClick: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onMenuClick }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    const basePath = path.split('?')[0];
    return location.pathname === basePath || location.pathname.startsWith(`${basePath}/`);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[70] h-20 border-t pb-2"
      style={{
        background: 'rgba(2,6,18,0.95)',
        backdropFilter: 'blur(20px) saturate(150%)',
        borderColor: 'rgba(255,255,255,0.08)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.8)',
      }}
    >
      <div className="flex h-full items-center justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-1 min-w-[72px] h-14 rounded-xl transition-all duration-200',
                active
                  ? 'text-rose-400'
                  : 'text-slate-500 hover:text-slate-300'
              )}
            >
              <div className={cn(
                'relative flex items-center justify-center',
                active && 'after:absolute after:-bottom-1.5 after:h-0.5 after:w-5 after:rounded-full after:bg-rose-500'
              )}>
                <Icon className={cn('h-6 w-6', active && 'drop-shadow-[0_0_8px_rgba(225,29,72,0.6)]')} />
              </div>
              <span className={cn(
                'text-[10px] font-bold uppercase tracking-wider',
                active ? 'text-rose-400' : 'text-slate-500'
              )}>
                {item.label}
              </span>
            </NavLink>
          );
        })}

        <Button variant="cyber"
          type="button"
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center gap-1 min-w-[72px] h-14 rounded-xl text-slate-500 hover:text-slate-300 transition-all"
        >
          <Menu className="h-6 w-6" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Меню</span>
        </Button>
      </div>
    </nav>
  );
};

export default BottomNav;
