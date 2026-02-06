import React from 'react';
import { Menu, Search, Bell, User } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useRole } from '../../context/RoleContext';
import { DisplayModeSwitcher } from './DisplayModeSwitcher';

interface TopBarProps {
  onMenuClick: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const { user } = useUser();
  const { displayName } = useRole();

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">

      {/* Left: Menu & Title (Mobile/Tablet) */}
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
          onClick={onMenuClick}
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumbs or Page Title could go here */}
        <div className="hidden md:flex flex-col">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            {displayName}
          </span>
        </div>
      </div>

      {/* Center: Search (Optional, mostly for Desktop) */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative group">
          <input
            type="text"
            placeholder="Швидкий пошук..."
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-full px-4 py-2 pl-10 text-sm text-white focus:border-blue-500/50 focus:bg-slate-900 outline-none transition-all"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
        </div>
      </div>

      {/* Right: Tools & Profile */}
      <div className="flex items-center gap-4">
        <DisplayModeSwitcher />

        <div className="h-6 w-px bg-white/10 mx-2 hidden sm:block" />

        <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-950"></span>
        </button>

        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-white leading-none mb-1">{user?.name}</div>
            <div className="text-[10px] text-slate-500 font-mono">{user?.email}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg border border-white/10">
            {user?.name?.charAt(0) || <User size={16} />}
          </div>
        </div>
      </div>
    </header>
  );
};
