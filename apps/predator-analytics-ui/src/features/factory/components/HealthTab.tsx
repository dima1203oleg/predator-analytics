import React from 'react';
import { motion } from 'framer-motion';
import { HeartPulse, ShieldCheck, ShieldAlert, Activity, RefreshCw } from 'lucide-react';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { FactoryHealthCheckRecord } from '../systemFactoryView.utils';

interface HealthTabProps {
  healthChecks: FactoryHealthCheckRecord[];
  refreshHealth: () => void;
}

export const HealthTab: React.FC<HealthTabProps> = ({
  healthChecks,
  refreshHealth
}) => {
  return (
    <motion.div 
      key="health" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="space-y-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
            <HeartPulse size={24} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-[0.2em] text-white">Моніторинг Життєздатності</h3>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">Реальний час: Аналіз системних ендпоінтів та сервісів</p>
          </div>
        </div>
        <Button 
          variant="cyber" 
          size="sm" 
          onClick={refreshHealth}
          className="bg-slate-800 text-slate-400 border-white/10 text-[10px] uppercase font-black h-11 hover:border-rose-500/50 hover:text-rose-500 transition-all"
        >
          <RefreshCw size={14} className="mr-2" /> Оновити Статус
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {healthChecks.length > 0 ? healthChecks.map((check, i) => (
          <TacticalCard 
            key={i} 
            variant="holographic" 
            className={cn(
              "border-rose-500/20 bg-slate-900/40 transition-all hover:scale-[1.02]",
              check.status === 'HEALTHY' ? "border-emerald-500/20" : "border-rose-500/40 shadow-[0_0_30px_rgba(244,63,94,0.1)]"
            )}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase tracking-widest text-white">{check.name}</span>
                <span className="text-[9px] text-slate-500 font-mono mt-1 uppercase tracking-tighter">{check.id}</span>
              </div>
              <div className={cn(
                "p-2 rounded-xl border",
                check.status === 'HEALTHY' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-400"
              )}>
                {check.status === 'HEALTHY' ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-500 uppercase">СТАТУС</span>
                <Badge variant={check.status === 'HEALTHY' ? "cyber" : "neon"} className={cn(
                   "text-[9px] font-black tracking-widest",
                   check.status === 'HEALTHY' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                )}>
                  {check.status}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-[10px] font-mono border-t border-white/5 pt-3">
                <span className="text-slate-500 uppercase">ЗАТРИМКА (LATENCY)</span>
                <span className={cn(
                  "font-black tracking-widest",
                  check.latency < 200 ? "text-emerald-400" : "text-rose-400"
                )}>{check.latency}ms</span>
              </div>

              {check.error && (
                <div className="mt-4 p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl">
                  <div className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-1">ОСТАННЯ ПОМИЛКА</div>
                  <div className="text-[9px] text-rose-300 font-mono leading-relaxed line-clamp-2">{check.error}</div>
                </div>
              )}
            </div>
          </TacticalCard>
        )) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 font-mono uppercase tracking-[0.3em] text-[10px]">
            <Activity size={48} className="mb-6 opacity-20" />
            📡 Синхронізація зі службою Health-Check...
          </div>
        )}
      </div>
    </motion.div>
  );
};
