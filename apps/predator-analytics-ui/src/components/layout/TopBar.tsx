import React from 'react';
import { Search, Bell, User, Wifi, WifiOff } from 'lucide-react';

interface TopBarProps {
  onMenuClick?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  // Тут будемо отримувати реальний статус з WebSocket/Redpanda
  const isConnected = true;

  return (
    <div className="w-full flex items-center justify-between px-6 h-full">
      {/* Global Search Bar */}
      <div className="flex-1 max-w-xl relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
          <Search size={18} />
        </div>
        <input 
          type="text" 
          placeholder="Глобальний пошук об'єктів (Cmd+K)" 
          className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all shadow-inner"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="text-[10px] bg-white/10 text-slate-400 px-1.5 py-0.5 rounded border border-white/10">⌘K</span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6">
        
        {/* Sync Status */}
        <div className="flex items-center gap-2 text-xs">
          {isConnected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 font-mono">SOVEREIGN_SYNC</span>
            </>
          ) : (
            <>
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-red-400 font-mono">OFFLINE_FALLBACK</span>
            </>
          )}
        </div>

        {/* Notifications */}
        <button className="relative text-slate-400 hover:text-white transition-colors">
          <Bell size={18} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full border border-[#050608]"></span>
        </button>

        {/* Profile */}
        <button className="flex items-center gap-2 pl-4 border-l border-white/10 text-slate-400 hover:text-white transition-colors">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-600 to-blue-800 flex items-center justify-center border border-cyan-500/30">
            <User size={12} className="text-white" />
          </div>
          <span className="text-sm font-medium">Analyst Alpha</span>
        </button>
      </div>
    </div>
  );
};
