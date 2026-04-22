import React from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle2, Network, Terminal } from 'lucide-react';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { RegistryStats } from './RegistryStats';
import { FactoryRegistryStatsSnapshot } from '../systemFactoryView.utils';

interface IngestionTabProps {
  registryStats: FactoryRegistryStatsSnapshot;
  ingestionMetrics: { rps: string; success: number; proxies: string };
  ingestionFeed: Array<{ id: string; source: string; entity: string; latency: string; time: string }>;
}

export const IngestionTab: React.FC<IngestionTabProps> = ({
  registryStats,
  ingestionMetrics,
  ingestionFeed
}) => {
  return (
    <motion.div 
      key="ingestion" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="space-y-6"
    >
      <RegistryStats stats={registryStats} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TacticalCard variant="holographic" className="border-rose-500/20 bg-rose-500/5 py-8">
          <div className="flex items-center justify-between px-6">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">Пропускна здатність</div>
              <div className="text-3xl text-rose-400 font-mono font-black mt-2">{ingestionMetrics.rps} <span className="text-xs text-rose-500/50">REQ/S</span></div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
              <Activity size={24} />
            </div>
          </div>
        </TacticalCard>

        <TacticalCard variant="holographic" className="border-emerald-500/20 bg-emerald-500/5 py-8">
          <div className="flex items-center justify-between px-6">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">Успішність (SLA)</div>
              <div className="text-3xl text-emerald-400 font-mono font-black mt-2">{ingestionMetrics.success}%</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <CheckCircle2 size={24} />
            </div>
          </div>
        </TacticalCard>

        <TacticalCard variant="holographic" className="border-blue-500/20 bg-blue-500/5 py-8">
          <div className="flex items-center justify-between px-6">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">Ротація Проксі</div>
              <div className="text-3xl text-blue-400 font-mono font-black mt-2">{ingestionMetrics.proxies}</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <Network size={24} />
            </div>
          </div>
        </TacticalCard>
      </div>

      <TacticalCard variant="minimal" className="border-rose-500/20 bg-slate-900/40 p-0 overflow-hidden">
        <div className="bg-rose-500/5 py-4 px-6 border-b border-rose-500/20 flex items-center justify-between">
          <span className="text-[11px] font-black tracking-[0.2em] uppercase text-white flex items-center gap-3">
            <Terminal size={16} className="text-rose-500 animate-pulse" /> Жива Стрічка Інгестії
          </span>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <div className="text-[10px] text-rose-400 font-mono font-black uppercase tracking-widest">Live Recording</div>
          </div>
        </div>
        <div className="divide-y divide-white/5 h-[400px] overflow-y-auto custom-scrollbar">
          {ingestionFeed.map((item, i) => (
            <div key={i} className="p-4 hover:bg-rose-500/5 transition-all flex items-center justify-between group cursor-pointer border-l-2 border-transparent hover:border-rose-500">
              <div className="flex items-center gap-5">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex flex-col items-center justify-center text-slate-400 group-hover:border-rose-500/30 group-hover:text-rose-400 transition-all">
                  <span className="text-[9px] font-mono leading-none">{item.time.split(':')[0]}</span>
                  <span className="text-[11px] font-black leading-none mt-0.5">{item.time.split(':')[1]}</span>
                </div>
                <div>
                  <div className="text-sm text-white font-mono font-bold tracking-tight">{item.id}</div>
                  <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                    <span className="text-rose-500/80">{item.source}</span>
                    <span className="mx-2 opacity-30">•</span>
                    <span className="text-slate-400">{item.entity}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-mono px-3 py-1 rounded-lg">
                  {item.latency}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </TacticalCard>
    </motion.div>
  );
};
