import React from 'react';
import { motion } from 'framer-motion';
import { 
  HeartPulse, CheckCircle2, AlertTriangle, XCircle
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { type FactoryHealthCheckRecord } from '../systemFactoryView.utils';

export interface FactoryHealthPanelProps {
  healthChecks: FactoryHealthCheckRecord[];
}

export const FactoryHealthPanel: React.FC<FactoryHealthPanelProps> = ({
  healthChecks
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-5 bg-gradient-to-r from-rose-950/40 to-slate-900/40 border border-rose-500/30 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <HeartPulse size={28} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white">СИСТЕМНИЙ HEALTH CHECK</h3>
            <p className="text-[10px] font-mono text-rose-400 uppercase">
              СЕРВІСІВ АКТИВНИХ: {healthChecks.filter(h => h.status === 'healthy').length}/{healthChecks.length} | ОНОВЛЕННЯ КОЖНІ 30 СЕК
            </p>
          </div>
        </div>
        <div className={cn(
          "px-6 py-2 rounded-xl border text-sm font-black uppercase",
          healthChecks.length > 0 && healthChecks.every(h => h.status === 'healthy')
            ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            : "bg-rose-500/20 border-rose-400/50 text-rose-400"
        )}>
          {healthChecks.length === 0 ? 'Н/Д' : healthChecks.every(h => h.status === 'healthy') ? '✅ ВСЕ ЗДОРОВО' : '⚠️ Є ДЕГРАДАЦІЇ'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {healthChecks.length > 0 ? healthChecks.map(hc => (
          <motion.div key={hc.id} layout className={cn(
            "p-4 rounded-xl border backdrop-blur-md flex items-center gap-4 transition-all",
            hc.status === 'healthy' && "bg-emerald-950/10 border-emerald-500/20",
            hc.status === 'degraded' && "bg-rose-950/10 border-rose-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
            hc.status === 'down' && "bg-rose-950/20 border-rose-600/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
          )}>
            <div className={cn(
              "w-10 h-10 rounded-lg border flex items-center justify-center shrink-0",
              hc.status === 'healthy' && "bg-emerald-500/20 border-emerald-400/50 text-emerald-400",
              hc.status === 'degraded' && "bg-rose-500/20 border-rose-400/50 text-rose-400",
              hc.status === 'down' && "bg-rose-600/20 border-rose-400/50 text-rose-500",
            )}>
               {hc.status === 'healthy' ? <CheckCircle2 size={20} /> : hc.status === 'degraded' ? <AlertTriangle size={20} /> : <XCircle size={20} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="text-sm font-black text-white">{hc.service}</span>
                <span className="text-[10px] font-mono text-slate-500 truncate">{hc.endpoint}</span>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-mono">
                <span className={cn(
                  hc.latency == null ? 'text-slate-500' : hc.latency < 20 ? 'text-emerald-400' : hc.latency < 50 ? 'text-rose-400' : 'text-rose-600'
                )}>
                  {hc.latency == null ? 'Н/Д' : `${hc.latency}ms`}
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400 uppercase">{hc.status}</span>
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="col-span-2 p-12 text-center text-sm text-slate-500 font-mono border-2 border-dashed border-white/5 rounded-2xl">
            HEALTH-CHECK ENDPOINT НЕ ПОВЕРНУВ ОБʼЄКТІВ. ПЕРЕВІРТЕ КЛЮЧІ В JSON...
          </div>
        )}
      </div>
    </div>
  );
};
