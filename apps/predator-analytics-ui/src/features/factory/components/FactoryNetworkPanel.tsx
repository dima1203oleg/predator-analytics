import React from 'react';
import { 
  Network, Server, Database, ActivitySquare, Zap, Key, HardDrive, Shield
} from 'lucide-react';
import { RegistryStats } from './RegistryStats';
import { type FactoryRegistryStatsSnapshot, type FactoryHealthCheckRecord } from '../systemFactoryView.utils';

export interface FactoryNetworkPanelProps {
  registryStats: FactoryRegistryStatsSnapshot;
  healthChecks: FactoryHealthCheckRecord[];
}

export const FactoryNetworkPanel: React.FC<FactoryNetworkPanelProps> = ({
  registryStats,
  healthChecks
}) => {
  return (
    <div className="space-y-6">
      <RegistryStats stats={registryStats} />
      
      <section className="page-section section-amber shadow-xl overflow-hidden mt-6">
        <div className="section-header">
          <div className="section-dot-amber" />
          <h2 className="section-title">Топологія Мережі та Інфраструктура</h2>
        </div>
        <div className="p-8 relative min-h-[300px] flex items-center justify-center">
          <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none" />
          
          <div className="relative w-full max-w-3xl flex justify-between items-center z-10">
            {/* Frontend Section */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-xl bg-rose-500/10 border-2 border-rose-500 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(225,29,72,0.3)]">
                <Network size={24} />
              </div>
              <span className="text-[10px] font-black uppercase text-rose-400 tracking-widest mt-2">Nginx / UI</span>
            </div>

            <div className="h-1 flex-1 bg-gradient-to-r from-rose-500 to-yellow-500 mx-4 opacity-50 relative">
              <span className="absolute -top-4 w-full text-center text-[9px] text-slate-400 font-mono tracking-widest">TLS / WAF</span>
            </div>

            {/* Core API */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-2xl bg-yellow-500/20 border-2 border-yellow-500 flex flex-col items-center justify-center text-yellow-400 relative shadow-[0_0_30px_rgba(79,70,229,0.4)]">
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-emerald-500 rounded-full animate-pulse border border-black shadow-[0_0_5px_#10b981]" />
                <Server size={32} />
                <span className="text-[8px] mt-1 font-black leading-none uppercase">API Gateway</span>
              </div>
              <span className="text-[10px] font-black uppercase text-yellow-400 tracking-widest mt-2">Core API</span>
            </div>

            <div className="h-1 flex-1 bg-gradient-to-r from-yellow-500 to-rose-500 mx-4 opacity-50 relative flex flex-col items-center">
              <span className="absolute -top-4 w-full text-center text-[9px] text-slate-400 font-mono tracking-widest">gRPC / NAT</span>
            </div>

            {/* Databases */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-orange-500/10 border border-orange-500/50 flex items-center justify-center text-orange-400">
                  <Database size={20} />
                </div>
                <span className="text-[10px] font-black uppercase text-orange-400 tracking-widest">PostgreSQL</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-rose-500/10 border border-rose-500/50 flex items-center justify-center text-rose-400">
                  <ActivitySquare size={20} />
                </div>
                <span className="text-[10px] font-black uppercase text-rose-400 tracking-widest">Neo4j</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                  <Zap size={20} />
                </div>
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Redis Cache</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 border-t border-white/5 bg-black/40 p-4">
          <div className="flex flex-col gap-1 items-center border-r border-white/5">
            <Key size={14} className="text-rose-400 mb-1" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Секрети K8s</span>
            <span className="text-xs font-mono text-white">Н/д</span>
          </div>
          <div className="flex flex-col gap-1 items-center border-r border-white/5">
            <HardDrive size={14} className="text-slate-400 mb-1" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Постійні Томи (Vol)</span>
            <span className="text-xs font-mono text-white">Потрібен endpoint</span>
          </div>
          <div className="flex flex-col gap-1 items-center">
            <Shield size={14} className="text-emerald-400 mb-1" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Мережеві Політики</span>
            <span className="text-xs font-mono text-white">Непідтверджено</span>
          </div>
        </div>
      </section>
    </div>
  );
};
