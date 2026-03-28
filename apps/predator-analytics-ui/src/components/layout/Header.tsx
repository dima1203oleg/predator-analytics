import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { 
  Bell, 
  Search, 
  UserCircle,
  Calendar,
  LayoutGrid,
  Command,
} from 'lucide-react';
import { navigationConfig } from '../../config/navigation';
import { useUser } from '../../context/UserContext';

/**
 * Визначає назву поточного розділу за шляхом.
 */
const getPageTitle = (pathname: string): string => {
  // exact match first
  for (const section of navigationConfig) {
    for (const item of section.items) {
      if (item.path === pathname) return item.label;
    }
  }
  // partial match for subroutes
  for (const section of navigationConfig) {
    for (const item of section.items) {
      if (pathname.startsWith(item.path) && item.path !== '/') return item.label;
    }
  }
  return 'Панель управління';
};

const Header: React.FC = () => {
  const { user } = useUser();
  const { t } = useTranslation();
  const location = useLocation();
  const currentDate = format(new Date(), "d MMMM yyyy 'р.'", { locale: uk });
  const pageTitle = getPageTitle(location.pathname);

  return (
    <header className="h-16 border-b border-white/[0.04] bg-[#020617]/70 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-40 shrink-0">
      {/* Ліва: Заголовок сторінки + дата */}
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
          <h1 className="text-[15px] font-bold text-white leading-none">
            {pageTitle}
          </h1>
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium mt-1">
            <Calendar className="w-3 h-3" />
            <span>{currentDate}</span>
          </div>
        </div>
      </div>

      {/* Права: Пошук + Дії */}
      <div className="flex items-center gap-5">
        {/* Швидкий пошук */}
        <div className="relative group hidden lg:block">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-600 group-focus-within:text-amber-500 transition-colors">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input 
            type="text" 
            placeholder="Швидкий пошук..." 
            className="h-9 bg-white/[0.03] border border-white/[0.06] rounded-lg pl-10 pr-16 text-[13px] text-white focus:outline-none focus:border-amber-500/30 transition-all w-64 placeholder:text-slate-600"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-40 group-focus-within:opacity-80 transition-opacity">
            <kbd className="px-1 py-0.5 rounded border border-white/10 text-[9px] text-slate-400 font-mono bg-white/[0.04]">⌘</kbd>
            <kbd className="px-1 py-0.5 rounded border border-white/10 text-[9px] text-slate-400 font-mono bg-white/[0.04]">K</kbd>
          </div>
        </div>

        {/* Сповіщення */}
        <button className="relative w-9 h-9 flex items-center justify-center bg-white/[0.03] border border-white/[0.06] rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full" />
        </button>

        {/* Розділювач */}
        <div className="h-6 w-px bg-white/[0.06]" />

        {/* Профіль */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[13px] font-bold text-white leading-none">
              {user?.name || 'Адміністратор'}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-slate-500 font-medium tracking-tight">Активний</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center">
            <UserCircle className="w-5 h-5 text-indigo-400" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
