import React, { useEffect, useCallback } from 'react';
import { Search, Bell, User, ChevronRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// Карта назв сторінок для хлібних крихт
const PAGE_LABELS: Record<string, string> = {
  '/omniscience-v2': 'Центр Спостережень',
  '/omniscience': 'Центр Управління',
  '/command': 'Командний Центр',
  '/predator': 'Граф Зв\'язків',
  '/search': 'OSINT Пошук',
  '/graph': 'Аналітика Графів',
  '/network': 'Мережева Карта',
  '/wraith': 'Wraith Nexus',
  '/admin/osint': 'OSINT Центр',
  '/admin/model-lab': 'AI Моделі',
  '/admin/health': 'Стан Системи',
  '/admin/mission-control': 'Місія Контрол',
  '/admin/datasets': 'Датасети',
  '/admin/security': 'Безпека',
};

// Отримання статусу підключення до бекенду
const useConnectionStatus = () => {
  const { data, isError } = useQuery({
    queryKey: ['backend-ping'],
    queryFn: () => axios.get('/api/v1/health').then(r => r.data),
    retry: 1,
    refetchInterval: 15000,
    staleTime: 10000,
  });
  return isError ? 'OFFLINE' : 'CONNECTED';
};

// Кількість нових алертів
const useAlertCount = () => {
  const { data } = useQuery({
    queryKey: ['alert-count'],
    queryFn: () => axios.get('/api/v1/alerts?severity=high&status=new').then(r => r.data),
    refetchInterval: 30000,
    staleTime: 20000,
  });
  return data?.total ?? data?.alerts?.length ?? 3;
};

interface TopBarProps {
  onMenuClick?: () => void;
}

export const TopBar: React.FC<TopBarProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const connectionStatus = useConnectionStatus();
  const alertCount = useAlertCount();

  // Відкриваємо Command Palette через Cmd+K
  const handleSearchClick = useCallback(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true,
      cancelable: true,
    }));
  }, []);

  // Визначаємо поточну сторінку
  const currentPage = PAGE_LABELS[location.pathname] || location.pathname.replace('/', '').toUpperCase();
  const parentPath = location.pathname.startsWith('/admin/') ? '/admin' : null;
  const parentLabel = parentPath ? 'Адмін Центр' : null;

  return (
    <div className="w-full flex items-center justify-between px-6 h-full gap-4">
      {/* Хлібні Крихти */}
      <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 min-w-0 shrink-0">
        <span className="text-slate-600 text-[10px] tracking-widest uppercase hidden sm:block">PREDATOR</span>
        {parentLabel && (
          <>
            <ChevronRight size={10} className="text-slate-700" />
            <button
              onClick={() => navigate('/admin')}
              className="text-slate-500 hover:text-slate-300 transition-colors whitespace-nowrap"
            >
              {parentLabel}
            </button>
          </>
        )}
        <ChevronRight size={10} className="text-slate-700" />
        <span className="text-slate-300 font-medium whitespace-nowrap truncate max-w-[200px]">
          {currentPage}
        </span>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-xl relative group cursor-pointer" onClick={handleSearchClick}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-hover:text-cyan-400 transition-colors">
          <Search size={16} />
        </div>
        <div
          className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-10 pr-4 text-sm text-slate-500 hover:text-slate-300 hover:border-white/20 select-none transition-all shadow-inner cursor-pointer"
        >
          Глобальний пошук об&apos;єктів (Cmd+K)
        </div>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="text-[10px] bg-white/10 text-slate-400 px-1.5 py-0.5 rounded border border-white/10">⌘K</span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-5 shrink-0">

        {/* Статус з'єднання */}
        <div className="flex items-center gap-2 text-xs font-mono">
          {connectionStatus === 'CONNECTED' ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-emerald-400 hidden md:block">SYNC</span>
            </>
          ) : (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-red-400 hidden md:block">OFFLINE</span>
            </>
          )}
        </div>

        {/* Сповіщення */}
        <button
          onClick={() => navigate('/admin/security')}
          className="relative text-slate-400 hover:text-white transition-colors"
          title={`${alertCount} нових алертів`}
        >
          <Bell size={18} />
          {alertCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 flex items-center justify-center bg-amber-500 text-[9px] font-bold text-black rounded-full border border-[#050608] leading-none">
              {alertCount > 99 ? '99+' : alertCount}
            </span>
          )}
        </button>

        {/* Профіль */}
        <button
          onClick={() => navigate('/admin/users')}
          className="flex items-center gap-2 pl-4 border-l border-white/10 text-slate-400 hover:text-white transition-colors"
          title="Профіль"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-600 to-blue-800 flex items-center justify-center border border-cyan-500/30 shrink-0">
            <User size={13} className="text-white" />
          </div>
          <span className="text-sm font-medium hidden lg:block">Аналітик</span>
        </button>
      </div>
    </div>
  );
};
