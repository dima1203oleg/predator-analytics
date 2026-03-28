import React, { useState, useMemo, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAtom } from 'jotai';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  ChevronRight, 
  ChevronLeft, 
  ChevronDown,
  LogOut, 
  User, 
  Search,
  X,
} from 'lucide-react';
import { 
  themeAtom, 
  isSidebarOpenAtom, 
  sidebarSearchAtom 
} from '../../store/atoms';
import { useUser } from '../../context/UserContext';
import { navigationConfig } from '../../config/navigation';
import { cn } from '../../lib/utils';

/** Стан колапсу секцій — зберігається в localStorage */
const getInitialCollapsed = (): Record<string, boolean> => {
  try {
    const stored = localStorage.getItem('predator-nav-collapsed');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

export const Sidebar: React.FC = () => {
  const { user, logout } = useUser();
  const userRole = user?.role || 'viewer';
  const [isOpen, setIsOpen] = useAtom(isSidebarOpenAtom);
  const [search, setSearch] = useAtom(sidebarSearchAtom);
  const location = useLocation();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(getInitialCollapsed);

  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections(prev => {
      const next = { ...prev, [sectionId]: !prev[sectionId] };
      localStorage.setItem('predator-nav-collapsed', JSON.stringify(next));
      return next;
    });
  }, []);

  const filteredSections = useMemo(() => {
    return navigationConfig
      .map(section => ({
        ...section,
        items: section.items.filter(item => {
          const roleMatch = !item.roles || item.roles.includes(userRole);
          const searchMatch = !search || 
            item.label.toLowerCase().includes(search.toLowerCase()) || 
            section.label.toLowerCase().includes(search.toLowerCase());
          return roleMatch && searchMatch;
        })
      }))
      .filter(section => section.items.length > 0);
  }, [userRole, search]);

  /** Визначаємо активну секцію для підсвічування */
  const activeSectionId = useMemo(() => {
    for (const section of navigationConfig) {
      if (section.items.some(item => item.path === location.pathname)) {
        return section.id;
      }
    }
    return null;
  }, [location.pathname]);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 300 : 76 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="relative h-screen flex flex-col border-r bg-[#020617]/95 backdrop-blur-2xl border-white/[0.04] shadow-2xl z-50 shrink-0"
    >
      {/* Лого */}
      <div className="px-5 flex items-center gap-3.5 border-b border-white/[0.04] h-[72px] shrink-0">
        <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-500 to-rose-600 shadow-lg shadow-amber-500/20">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex flex-col overflow-hidden whitespace-nowrap"
            >
              <span className="font-black text-[17px] tracking-tight text-white leading-none">PREDATOR</span>
              <span className="text-amber-500/70 text-[9px] font-bold uppercase tracking-[0.25em] mt-0.5">NEXUS v56.1</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Пошук */}
      {isOpen && (
        <div className="px-4 py-3 shrink-0">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600 group-focus-within:text-amber-500 transition-colors" />
            <input
              type="text"
              placeholder="Пошук модулів..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-8 py-2.5 text-[13px] text-white focus:outline-none focus:border-amber-500/30 transition-all placeholder:text-slate-600"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Навігація */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-2">
        {filteredSections.map((section) => {
          const isCollapsed = collapsedSections[section.id] && !search;
          const hasActiveItem = section.items.some(item => item.path === location.pathname);

          return (
            <div key={section.id} className="mb-1">
              {/* Заголовок секції */}
              {isOpen ? (
                <button
                  onClick={() => toggleSection(section.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors",
                    hasActiveItem ? "text-amber-500/80" : "text-slate-500/60 hover:text-slate-400"
                  )}
                >
                  <span>{section.label}</span>
                  <ChevronDown size={12} className={cn(
                    "transition-transform duration-200",
                    isCollapsed && "rotate-[-90deg]"
                  )} />
                </button>
              ) : (
                <div className="h-px bg-white/[0.04] mx-3 my-3" />
              )}

              {/* Пункти навігації */}
              <AnimatePresence initial={false}>
                {(!isCollapsed || !isOpen) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 space-y-0.5">
                      {section.items.map((item) => (
                        <NavLink
                          key={item.id}
                          to={item.path}
                          title={!isOpen ? item.label : undefined}
                          className={({ isActive }) => cn(
                            "flex items-center gap-3 rounded-xl transition-all duration-200 group relative",
                            isOpen ? "px-3 py-2.5" : "px-0 py-2.5 justify-center",
                            isActive 
                              ? "bg-amber-500/10 text-white" 
                              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                          )}
                        >
                          {({ isActive }) => (
                            <>
                              {/* Активний індикатор зліва */}
                              {isActive && (
                                <motion.div
                                  layoutId="nav-active-bar"
                                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-amber-500 rounded-r-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                />
                              )}
                              <item.icon className={cn(
                                "shrink-0 transition-colors",
                                isOpen ? "w-[18px] h-[18px]" : "w-5 h-5",
                                isActive ? "text-amber-500" : "group-hover:text-amber-400/70"
                              )} />
                              {isOpen && (
                                <span className="text-[13px] font-semibold truncate">
                                  {item.label}
                                </span>
                              )}
                              {isOpen && item.badge && (
                                <span className={cn(
                                  "ml-auto px-1.5 py-0.5 text-[9px] font-black rounded uppercase tracking-wider",
                                  item.badge === 'LIVE' 
                                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" 
                                    : item.badge === 'PRO'
                                    ? "bg-violet-500/15 text-violet-400 border border-violet-500/20"
                                    : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                                )}>
                                  {item.badge}
                                </span>
                              )}
                            </>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Футер — Профіль */}
      <div className="px-3 py-3 border-t border-white/[0.04] shrink-0">
        <div className={cn(
          "flex items-center gap-3 p-2.5 rounded-xl transition-all",
          isOpen ? "bg-white/[0.03]" : "justify-center"
        )}>
          <div className="w-9 h-9 rounded-lg bg-indigo-500/15 flex items-center justify-center border border-indigo-500/20 shrink-0">
            <User className="w-4 h-4 text-indigo-400" />
          </div>
          {isOpen && (
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[13px] font-bold text-white leading-none truncate">
                {user?.name || 'Адміністратор'}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1">
                {userRole === 'admin' ? 'Повний доступ' : userRole}
              </span>
            </div>
          )}
          {isOpen && (
            <button 
              onClick={logout}
              className="p-1.5 text-slate-600 hover:text-rose-400 transition-colors shrink-0"
              title="Вийти з системи"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Кнопка згортання */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-amber-500 flex items-center justify-center shadow-lg border border-white/10 hover:border-amber-400/50 transition-all z-10"
      >
        {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>
    </motion.aside>
  );
};

export default Sidebar;
