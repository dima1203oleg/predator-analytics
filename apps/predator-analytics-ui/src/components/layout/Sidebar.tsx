import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, LogOut, Crown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

import { useUser } from '../../context/UserContext';
import { useRole } from '../../context/RoleContext';
import { NAVIGATION_CONFIG, NavItem } from '../../config/navigation';
import { UserRole } from '../../config/roles';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCompact?: boolean; // For tablet mode
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isCompact = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useUser();
  const { role, displayName, description, isBasic } = useRole();

  // Combine navigation items based on role (Strictly isolated as per TZ)
  const getNavItems = () => {
    if (role === UserRole.ADMIN) {
      return NAVIGATION_CONFIG.admin;
    }

    let items: NavItem[] = [...NAVIGATION_CONFIG.client];

    if (role === UserRole.CLIENT_PREMIUM) {
      items = [...items, ...NAVIGATION_CONFIG.premium];
    }

    return items;
  };

  const navItems = getNavItems();

  const handleNavigation = (path: string) => {
    navigate(path);
    if (window.innerWidth < 1024) {
      onClose(); // Close sidebar on mobile/tablet selection
    }
  };

  // Helper to get Icon component dynamically
  const getIcon = (iconName: string) => {
    // @ts-ignore
    const Icon = LucideIcons[iconName] || LucideIcons.HelpCircle;
    return <Icon size={20} />;
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 bg-[#020617] border-r border-white/5 flex flex-col transition-all duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCompact ? 'w-20' : 'w-72'}
        `}
      >
        {/* Header */}
        <div className={`p-6 flex items-center justify-between ${isCompact ? 'justify-center' : ''}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-600/20 flex-shrink-0">
              <ShieldCheck className="text-white" size={24} />
            </div>

            {!isCompact && (
              <div className="min-w-0">
                <h1 className="font-black text-xl tracking-tight text-white truncate">PREDATOR v26</h1>
                <div className="flex items-center gap-1.5">
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                  />
                  <p className="text-[10px] font-bold text-blue-400/80 uppercase tracking-widest leading-none truncate">
                    Autonomous v2.0
                  </p>
                </div>
              </div>
            )}
          </div>

          <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Role Indicator Card (Desktop Only, Non-Compact) */}
        {!isCompact && (
          <div className="px-6 mb-6">
            <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Поточний режим</div>
              <div className="font-bold text-white text-sm flex items-center gap-2">
                {displayName}
                {role === UserRole.CLIENT_PREMIUM && <Crown size={14} className="text-amber-400" />}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 leading-tight">
                {description}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-1 scrollbar-hide">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isPremiumItem = item.premiumOnly;

            // Separator for Admin section
            const showSeparator = item.adminOnly && navItems[navItems.indexOf(item) - 1]?.adminOnly === undefined;

            return (
              <React.Fragment key={item.id}>
                {showSeparator && !isCompact && (
                  <div className="pt-4 pb-2 px-2">
                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Адміністрування</div>
                  </div>
                )}

                <button
                  onClick={() => handleNavigation(item.path)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative
                    ${isCompact ? 'justify-center' : ''}
                    ${isActive
                      ? isPremiumItem
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-lg shadow-amber-500/5'
                        : 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/5'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                  title={isCompact ? item.label : undefined}
                >
                  <span className="flex-shrink-0">{getIcon(item.icon)}</span>

                  {!isCompact && (
                    <span className="font-semibold text-sm truncate">{item.label}</span>
                  )}

                  {/* Active Indicator Line for Compact Mode */}
                  {isCompact && isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full" />
                  )}

                  {/* Premium Icon for Non-Compact */}
                  {!isCompact && isPremiumItem && (
                    <Crown size={12} className={`ml-auto ${isActive ? 'text-amber-400' : 'text-slate-600 group-hover:text-amber-500'}`} />
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="p-6 border-t border-white/5">
          <button
            onClick={logout}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all
              ${isCompact ? 'justify-center' : ''}
            `}
            title="Вийти з системи"
          >
            <LogOut size={20} />
            {!isCompact && <span className="font-bold text-sm">Вийти</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
