import React from 'react';
import { 
  Activity, 
  Search, 
  Map as MapIcon, 
  Network, 
  FileText, 
  Cpu, 
  Settings, 
  ShieldAlert,
  TerminalSquare
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const navItems = [
  { id: 'command', icon: TerminalSquare, tooltip: 'Командний Центр', path: '/omniscience-v2' },
  { id: 'osint', icon: Search, tooltip: 'OSINT Hub', path: '/admin/osint' },
  { id: 'graph', icon: Network, tooltip: "Граф Зв'язків", path: '/predator' },
  { id: 'map', icon: MapIcon, tooltip: 'Геопросторова Аналітика', path: '/admin/routing-matrix' },
  { id: 'docs', icon: FileText, tooltip: 'Документи та Досьє', path: '/admin/datasets' },
  { id: 'ai', icon: Cpu, tooltip: 'AI Intelligence', path: '/admin/model-lab' },
  { id: 'monitoring', icon: Activity, tooltip: 'Моніторинг Інфраструктури', path: '/admin/health' },
  { id: 'risks', icon: ShieldAlert, tooltip: 'Управління Ризиками', path: '/admin/security' },
];

export const SidebarNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Отримання кількості активних ризиків для бейджа
  const { data: alertCount } = useQuery({
    queryKey: ['sidebar-alert-count'],
    queryFn: () => axios.get('/api/v1/alerts?severity=high&status=new').then(r => r.data?.total ?? r.data?.alerts?.length ?? 3),
    refetchInterval: 30000,
  });

  return (
    <div className="flex flex-col items-center h-full py-4 gap-4">
      {/* Brand Logo / Home */}
      <button 
        onClick={() => navigate('/omniscience-v2')}
        className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 text-cyan-400 mb-4 hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all"
        title="PREDATOR Core"
      >
        <Network size={24} className="animate-pulse-slow" />
      </button>

      <div className="flex-1 flex flex-col gap-2 w-full px-2">
        {navItems.map((item) => {
          // Покращена логіка active state (точна відповідність для /omniscience-v2, інакше startsWith)
          const isActive = item.path === '/omniscience-v2' 
            ? location.pathname === '/omniscience-v2'
            : location.pathname.startsWith(item.path);

          const isRisks = item.id === 'risks';

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              title={item.tooltip}
              className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all group relative ${
                isActive 
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-[inset_0_0_10px_rgba(6,182,212,0.2)]' 
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <item.icon size={20} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:-translate-y-0.5'}`} />
              
              {/* Бейдж для ризиків */}
              {isRisks && alertCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full border border-[#050608] animate-pulse" />
              )}

              {/* Tooltip (CSS only) */}
              <span className="absolute left-14 bg-black/90 text-xs px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap backdrop-blur-md z-50">
                {item.tooltip}
              </span>
            </button>
          );
        })}
      </div>

      <button 
        onClick={() => navigate('/admin/mission-control')}
        className={`w-12 h-12 flex items-center justify-center rounded-lg transition-all mt-auto group relative ${
          location.pathname.startsWith('/admin/mission-control')
            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
            : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
        }`}
        title="Налаштування"
      >
        <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500" />
      </button>
    </div>
  );
};
