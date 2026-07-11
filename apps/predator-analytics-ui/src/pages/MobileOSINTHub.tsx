import { Button } from '@/components/ui/button';
import React from 'react';
import { Fingerprint, Share2, Map, Activity, ShieldAlert, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBackendStatus } from '@/hooks/useBackendStatus';

const MOBILE_OSINT_ACTIONS = [
  { id: 'diligence', label: 'ПЕРСОНАЛЬНЕ ДОСЬЄ', icon: Fingerprint, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { id: 'graph', label: 'НЕЙРОННИЙ ГРАФ', icon: Share2, color: 'text-sky-500', bg: 'bg-sky-500/10' },
  { id: 'ubo', label: 'КАРТА БЕНЕФІЦІАРІВ', icon: Map, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 'cers', label: 'CERS МОНІТОРИНГ', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 'sanctions', label: 'САНКЦІЇ ТА PEP', icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-600/10' },
];

export const MobileOSINTHub: React.FC = () => {
  const navigate = useNavigate();
  const backendStatus = useBackendStatus();

  return (
    <div className="flex flex-col space-y-6">
      <div className="p-6 rounded-[2rem] bg-gradient-to-br from-rose-600/20 to-black border border-rose-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <Fingerprint size={80} />
        </div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black uppercase italic text-white tracking-tighter leading-none mb-2">РОЗВІДКА СУБ'ЄКТІВ</h2>
          <p className="text-xs text-rose-200 font-bold tracking-widest uppercase mb-6">OSINT та приховані зв'язки</p>
          
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 border border-white/10 w-fit">
            <div className={`w-2 h-2 rounded-full ${backendStatus.isOffline ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">{backendStatus.statusLabel}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {MOBILE_OSINT_ACTIONS.map((action) => (
          <Button variant="cyber"
            key={action.id}
            onClick={() => navigate(`/osint?tab=${action.id}`)}
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
