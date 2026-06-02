import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, ShieldAlert, LineChart, Settings, Bell, Search, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useViewport } from '@/hooks/useViewport';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const { safeArea } = useViewport();
  const location = useLocation();
  const navigate = useNavigate();

  const NAV_ITEMS = [
    { icon: Home, path: '/command', label: 'Головна' },
    { icon: Search, path: '/search', label: 'Пошук' },
    { icon: ShieldAlert, path: '/osint', label: 'OSINT' },
    { icon: LineChart, path: '/market', label: 'Маркет' },
  ];

  return (
    <div className="relative flex flex-col h-screen min-h-screen bg-[#050508] text-white overflow-hidden">
      {/* HEADER */}
      <header 
        className="flex items-center justify-between px-5 py-4 bg-[#0a0a0f] border-b border-white/5 shadow-lg z-50 shrink-0"
        style={{ paddingTop: `calc(1rem + ${safeArea.top}px)` }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
            <ShieldAlert size={16} className="text-rose-500" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest text-slate-200 leading-none">PREDATOR</h1>
            <p className="text-[10px] text-rose-500 font-bold tracking-[0.2em] uppercase">M-Elite v64</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
          </button>
          <button className="p-2 text-slate-400 hover:text-white transition-colors">
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 pb-24 bg-gradient-to-b from-[#0a0a0f] to-black">
        <div className="p-4 space-y-6">
          {children}
        </div>
      </main>

      {/* BOTTOM NAVIGATION */}
      <nav 
        className="absolute bottom-0 left-0 right-0 bg-[#0a0a0f]/90 backdrop-blur-xl border-t border-white/10 z-50 flex justify-around items-center px-2 py-3 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
        style={{ paddingBottom: `calc(0.75rem + ${safeArea.bottom}px)` }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname.startsWith(item.path) || (item.path === '/command' && location.pathname === '/');
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "relative flex flex-col items-center justify-center p-2 rounded-2xl w-16 transition-all duration-300",
                isActive ? "text-rose-400" : "text-slate-500 hover:text-slate-300"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="mobile-nav-indicator"
                  className="absolute inset-0 bg-rose-500/10 border border-rose-500/20 rounded-2xl"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon size={22} className={cn("mb-1 relative z-10", isActive && "drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]")} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] font-black uppercase tracking-wider relative z-10">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default MobileLayout;
