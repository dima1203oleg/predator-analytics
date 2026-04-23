import React from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, CheckCircle2, Network, Terminal
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/badge';
import { RegistryStats } from './RegistryStats';
import { type FactoryRegistryStatsSnapshot } from '../systemFactoryView.utils';

export interface FactoryIngestionPanelProps {
  ingestionMetrics: {
    rps: string;
    success: number;
    proxies: string;
  };
  ingestionFeed: Array<{
    id: string;
    source: string;
    entity: string;
    latency: string;
    time: string;
  }>;
  registryStats: FactoryRegistryStatsSnapshot;
}

export const FactoryIngestionPanel: React.FC<FactoryIngestionPanelProps> = ({
  ingestionMetrics,
  ingestionFeed,
  registryStats
}) => {
  return (
    <div className="space-y-6">
      <RegistryStats stats={registryStats} />
      
      <section className="page-section section-orange shadow-xl overflow-hidden mt-6">
        <div className="section-header">
          <div className="section-dot-orange" />
          <h2 className="section-title">Контролер Парсингу та Інгестії</h2>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-6 mt-4">
          <div className="bg-slate-900/50 border border-orange-500/20 p-4 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Пропускна здатність</div>
              <div className="text-2xl text-orange-400 font-mono font-bold mt-1">{ingestionMetrics.rps} зап/с</div>
            </div>
            <Activity className="text-orange-500/50" size={32} />
          </div>
          <div className="bg-slate-900/50 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Успішність операцій</div>
              <div className="text-2xl text-emerald-400 font-mono font-bold mt-1">{ingestionMetrics.success}%</div>
            </div>
            <CheckCircle2 className="text-emerald-500/50" size={32} />
          </div>
          <div className="bg-slate-900/50 border border-rose-500/20 p-4 rounded-xl flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Ротація Проксі-серверів</span>
              <div className="text-2xl text-rose-400 font-mono font-bold mt-1">{ingestionMetrics.proxies}</div>
            </div>
            <Network className="text-rose-500/50" size={32} />
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
          <div className="bg-slate-900 py-3 px-4 border-b border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-black tracking-widest uppercase text-slate-400 flex items-center gap-2">
              <Terminal size={14} className="text-orange-500" /> Жива Стрічка Інгестії
            </span>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <div className="text-[10px] text-rose-400 font-mono font-bold uppercase">Запис</div>
            </div>
          </div>
          <div className="divide-y divide-slate-800/50 h-[300px] overflow-y-auto custom-scrollbar">
            {ingestionFeed.map((item, i) => (
              <div key={i} className="p-3 hover:bg-slate-900/50 transition-colors flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 font-mono text-[10px]">
                    {item.time}
                  </div>
                  <div>
                    <div className="text-sm text-slate-200 font-mono">{item.id}</div>
                    <div className="text-[11px] text-slate-500 font-semibold">{item.source} • {item.entity}</div>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-mono">
                    {item.latency}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
