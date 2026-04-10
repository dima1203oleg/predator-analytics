import React, { useState, useEffect } from 'react';
import { Shield, Zap, Database, Globe, CheckCircle2, AlertCircle, RefreshCcw } from 'lucide-react';

interface RegistryStatus {
  id: string;
  name: string;
  type: 'state' | 'commercial' | 'customs';
  status: 'online' | 'degraded' | 'offline';
  latency: number;
  lastSync: string;
}

const registries: RegistryStatus[] = [
  { id: '1', name: 'Державна Митна Служба (ДМС)', type: 'customs', status: 'online', latency: 45, lastSync: '2 хв тому' },
  { id: '2', name: 'YouControl (API)', type: 'commercial', status: 'online', latency: 120, lastSync: '30 сек тому' },
  { id: '3', name: 'Державна Податкова Служба', type: 'state', status: 'degraded', latency: 850, lastSync: '5 хв тому' },
  { id: '4', name: 'ProZorro (Тендери)', type: 'state', status: 'online', latency: 15, lastSync: 'щойно' },
  { id: '5', name: 'Opendatabot (Борги/Суди)', type: 'commercial', status: 'online', latency: 98, lastSync: '1 хв тому' },
];

export const PremiumRegistryMonitor: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <div className="glass-elite p-6 rounded-2xl w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-cyan-400">
            <Globe className="w-6 h-6 animate-pulse" />
            Хаб Українських Реєстрів
          </h2>
          <p className="text-slate-400 text-sm mt-1">Моніторинг каналів збору даних у реальному часі</p>
        </div>
        <button 
          onClick={refreshData}
          className="p-2 hover:bg-white/10 rounded-full transition-all border border-white/5"
        >
          <RefreshCcw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {registries.map((reg) => (
          <div key={reg.id} className="p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all">
            <div className="flex justify-between items-start mb-3">
              <div className="bg-cyan-500/20 p-2 rounded-lg">
                {reg.type === 'customs' ? <Zap className="text-cyan-400 w-5 h-5" /> : 
                 reg.type === 'state' ? <Shield className="text-emerald-400 w-5 h-5" /> : 
                 <Database className="text-amber-400 w-5 h-5" />}
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                reg.status === 'online' ? 'bg-emerald-500/20 text-emerald-400' :
                reg.status === 'degraded' ? 'bg-amber-500/20 text-amber-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {reg.status === 'online' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {reg.status}
              </div>
            </div>
            
            <h3 className="font-semibold text-sm mb-1 line-clamp-1">{reg.name}</h3>
            
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Латентність</span>
                <span className={reg.latency > 500 ? 'text-red-400' : 'text-emerald-400'}>{reg.latency}ms</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    reg.latency > 500 ? 'bg-red-500' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${Math.min(100, (reg.latency / 1000) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>Останнє оновлення</span>
                <span>{reg.lastSync}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 flex items-center justify-center gap-4 py-3 border-t border-white/5 text-[10px] uppercase tracking-[0.2em] text-cyan-400/60 font-medium">
        <span>Military Grade Encryption Active</span>
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
        <span>Proxy Cluster: Ukraine-East-Node-4</span>
      </div>
    </div>
  );
};
