import React from 'react';
import { motion } from 'framer-motion';
import { InfrastructureResponse } from '../types';
import { CheckCircle2, AlertCircle, AlertTriangle, Database, Search, Brain, Share2, Box, Cpu } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ServiceStatusGridProps {
  data: InfrastructureResponse['components'];
}

export function ServiceStatusGrid({ data }: ServiceStatusGridProps) {
  const getIcon = (key: string) => {
    switch (key) {
      case 'postgresql': return <Database className="w-5 h-5" />;
      case 'opensearch': return <Search className="w-5 h-5" />;
      case 'qdrant': return <Brain className="w-5 h-5" />;
      case 'graphdb': return <Share2 className="w-5 h-5" />;
      case 'minio': return <Box className="w-5 h-5" />;
      case 'redis': return <Cpu className="w-5 h-5" />;
      default: return <Database className="w-5 h-5" />;
    }
  };

  const getMetric = (component: any) => {
    if (component.storage_used_gb) return `${component.storage_used_gb} GB / ${component.storage_total_gb || '?'} GB`;
    if (component.records) return `${component.records.toLocaleString()} записів`;
    if (component.documents) return `${component.documents.toLocaleString()} док-ів`;
    if (component.vectors) return `${component.vectors.toLocaleString()} векторів`;
    if (component.nodes) return `${component.nodes.toLocaleString()} вузлів`;
    if (component.files) return `${component.files.toLocaleString()} файлів`;
    if (component.keys) return `${component.keys.toLocaleString()} ключів`;
    return 'Немає даних';
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(data).map(([key, component]) => {
        const comp = component as any;
        const usagePercent = comp.storage_total_gb ? (comp.storage_used_gb / comp.storage_total_gb) * 100 : 0;
        
        return (
          <div key={key} className="bg-slate-950 border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:bg-rose-500/5 hover:border-rose-500/30 transition-all group shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-500 border border-rose-500/20 group-hover:bg-rose-500/20 group-hover:border-rose-500/40 transition-all shadow-[0_0_15px_rgba(225,29,72,0.1)]">
                  {getIcon(key)}
                </div>
                <div>
                  <h4 className="font-black text-white capitalize leading-none tracking-tight uppercase text-sm">{key}</h4>
                  <div className="text-[10px] text-slate-500 font-mono mt-1.5 uppercase tracking-widest font-bold">
                    {comp.status === 'UP' ? 'АКТИВНИЙ' : 'ПОМИЛКА'} • v{comp.version || '0.0.0'}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                {comp.status === 'UP' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                ) : comp.status === 'DEGRADED' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse drop-shadow-[0_0_8px_rgba(225,29,72,0.4)]" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 drop-shadow-[0_0_8px_rgba(225,29,72,0.4)]" />
                )}
                <span className={cn(
                    "text-[9px] font-black font-mono px-1.5 py-0.5 rounded bg-black/40 border border-white/5",
                    comp.latency_ms < 5 ? "text-emerald-500" : "text-rose-500"
                )}>{comp.latency_ms || 1}ms</span>

              </div>
            </div>
            
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 uppercase font-black tracking-widest text-[9px]">Об'єм Даних</span>
                  <span className="text-white font-mono font-black">{getMetric(comp)}</span>
              </div>
              
              {comp.storage_total_gb && (
                <div className="space-y-1.5">
                    <div className="flex justify-between text-[8px] uppercase font-black text-slate-600 tracking-widest">
                        <span>ВИКО ИСТАННЯ: {comp.storage_used_gb} GB</span>
                        <span>ЛІМІТ: {comp.storage_total_gb} GB</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${usagePercent}%` }}
                            className={cn(
                                "h-full rounded-full transition-all duration-1000",
                                usagePercent > 90 ? "bg-rose-600 shadow-[0_0_10px_rgba(225,29,72,0.6)]" : usagePercent > 70 ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]" : "bg-emerald-500"
                            )}
                        />
                    </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const getIconColor = (usage: number) => {
    if (usage > 90) return "text-rose-600";
    if (usage > 70) return "text-rose-500";
    return "text-emerald-500";
};
