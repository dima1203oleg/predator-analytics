import { Button } from '@/components/ui/button';
import React from 'react';
import { BarChart3, FileText, Radar, Target, Globe2, ArrowRight } from 'lucide-react';
import { useBackendStatus } from '@/hooks/useBackendStatus';

const MOBILE_MARKET_ACTIONS = [
  { id: 'overview', label: 'ОГЛЯД РИНКУ', icon: BarChart3, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { id: 'declarations', label: 'ДЕКЛАРАЦІЇ', icon: FileText, color: 'text-sky-500', bg: 'bg-sky-500/10' },
  { id: 'competitors', label: 'КОНКУРЕНТИ', icon: Radar, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 'arbitrage', label: 'АРБІТРАЖ ЦІН', icon: Target, color: 'text-rose-600', bg: 'bg-rose-600/10' },
  { id: 'customs', label: 'МИТНА ДИНАМІКА', icon: Globe2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
];

interface MobileMarketHubProps {
  onSelectTab: (tab: string) => void;
}

export const MobileMarketHub: React.FC<MobileMarketHubProps> = ({ onSelectTab }) => {
  const backendStatus = useBackendStatus();

  return (
    <div className="flex flex-col space-y-6">
      <div className="p-6 rounded-[2rem] bg-gradient-to-br from-red-600/20 to-black border border-red-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <BarChart3 size={80} />
        </div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black uppercase italic text-white tracking-tighter leading-none mb-2">РИНКОВИЙ ІНТЕЛЕКТ</h2>
          <p className="text-xs text-red-200 font-bold tracking-widest uppercase mb-6">Дешифровка митних потоків</p>
          
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 border border-white/10 w-fit">
            <div className={`w-2 h-2 rounded-full ${backendStatus.isOffline ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">{backendStatus.statusLabel}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {MOBILE_MARKET_ACTIONS.map((action) => (
          <Button variant="cyber"
            key={action.id}
            onClick={() => onSelectTab(action.id)}
            className="flex items-center p-5 rounded-3xl bg-white/[0.03] border border-white/10 active:scale-95 transition-all shadow-lg text-left"
          >
            <div className={`p-4 rounded-2xl ${action.bg} ${action.color} mr-5`}>
              <action.icon size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-black text-white uppercase italic tracking-widest">{action.label}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
              <ArrowRight size={20} />
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};
