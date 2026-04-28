import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HeartPulse, CheckCircle2, AlertTriangle, XCircle, Activity,
  ShieldCheck, RefreshCw, Zap
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { type FactoryHealthCheckRecord } from '../systemFactoryView.utils';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';

export interface FactoryHealthPanelProps {
  healthChecks: FactoryHealthCheckRecord[];
}

/**
 * 🧪 FACTORY HEALTH PANEL // ДІАГНОСТИКА СИСТЕМИ | v61.0-ELITE
 * PREDATOR Analytics — System Health Monitoring
 */
export const FactoryHealthPanel: React.FC<FactoryHealthPanelProps> = ({
  healthChecks
}) => {
  const healthyCount = healthChecks.filter(h => h.status === 'healthy').length;
  const totalCount = healthChecks.length;
  const isAllHealthy = totalCount > 0 && healthyCount === totalCount;

  return (
    <div className="space-y-8 relative overflow-hidden p-8 rounded-[3rem] bg-[#050101] border-2 border-rose-950/20">
      <AdvancedBackground mode="sovereign" />
      <CyberGrid opacity={0.05} color="rgba(225, 29, 72, 0.1)" />
      
      {/* Header Diagnostic Section */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-10 bg-black/60 backdrop-blur-3xl border-2 border-rose-500/20 rounded-[3rem] shadow-[0_0_80px_rgba(225,29,72,0.1)]">
        <div className="flex items-center gap-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-rose-500/20 blur-[50px] rounded-full scale-150 animate-pulse" />
            <div className="relative p-6 bg-rose-600 rounded-[2rem] shadow-4xl transform -rotate-3 group-hover:rotate-0 transition-all duration-700">
              <HeartPulse size={42} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.6)] animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-4 mb-3">
              <span className="px-4 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[10px] font-black uppercase tracking-[0.4em] italic rounded-lg">
                DIAGNOSTICS_v61 // ELITE
              </span>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shadow-[0_0_10px_rgba(225,29,72,0.8)]" />
            </div>
            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">СИСТЕМНА ДІАГНОСТИКА</h3>
            <p className="text-[11px] font-mono text-rose-400/50 uppercase mt-4 tracking-[0.2em] italic">
              АКТИВНИХ СЕ ВІСІВ: <span className="text-white font-black">{healthyCount}/{totalCount}</span> | ОНОВЛЕННЯ КОЖНІ 30 СЕК
            </p>
          </div>
        </div>
        
        <div className={cn(
          "px-10 py-5 rounded-2xl border-2 text-[12px] font-black uppercase tracking-[0.4em] italic transition-all duration-500 shadow-2xl",
          isAllHealthy
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-emerald-500/20"
            : "bg-rose-500/10 border-rose-500/30 text-rose-500 shadow-rose-500/20"
        )}>
          {totalCount === 0 ? 'СТАТУС_Н/Д' : isAllHealthy ? 'СТАТУС_НО МА' : 'СТАТУС_ДЕГ АДАЦІЯ'}
        </div>
      </div>

      {/* Health Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {totalCount > 0 ? healthChecks.map((hc, idx) => (
            <motion.div 
              key={hc.id} 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className={cn(
                "group relative p-6 rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden",
                hc.status === 'healthy' ? "bg-black/40 border-white/5 hover:border-emerald-500/30" : "bg-rose-950/10 border-rose-500/30 shadow-[0_0_40px_rgba(225,29,72,0.1)]"
              )}
            >
              <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
              
              <div className="flex items-center gap-6 relative z-10">
                <div className={cn(
                  "w-16 h-16 rounded-2xl border-2 flex items-center justify-center shrink-0 transition-all duration-500 shadow-xl",
                  hc.status === 'healthy' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-rose-500/10 border-rose-500/30 text-rose-500 animate-pulse"
                )}>
                   {hc.status === 'healthy' ? <CheckCircle2 size={28} /> : hc.status === 'degraded' ? <AlertTriangle size={28} /> : <XCircle size={28} />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col mb-1">
                    <span className="text-lg font-black text-white uppercase italic tracking-tighter truncate">{hc.service}</span>
                    <span className="text-[9px] font-mono text-slate-600 truncate uppercase tracking-widest">{hc.endpoint}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <Zap size={10} className={cn(
                        hc.latency == null ? 'text-slate-600' : hc.latency < 20 ? 'text-emerald-500' : 'text-rose-500'
                      )} />
                      <span className={cn(
                        "text-[10px] font-black font-mono",
                        hc.latency == null ? 'text-slate-600' : hc.latency < 20 ? 'text-emerald-400' : 'text-rose-400'
                      )}>
                        {hc.latency == null ? '---' : `${hc.latency}ms`}
                      </span>
                    </div>
                    <div className="w-1 h-1 bg-white/5 rounded-full" />
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest italic",
                      hc.status === 'healthy' ? 'text-emerald-500/60' : 'text-rose-500/60'
                    )}>
                      {hc.status === 'healthy' ? 'НО МА' : hc.status === 'degraded' ? 'ДЕГ АД' : 'ОФЛАЙН'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Scanning Line (Visual Only) */}
              <motion.div 
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute top-0 bottom-0 w-20 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent skew-x-[-20deg] pointer-events-none"
              />
            </motion.div>
          )) : (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="col-span-full p-20 text-center bg-black/40 border-2 border-dashed border-white/5 rounded-[3rem] shadow-inner"
            >
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={32} className="text-slate-700" />
              </div>
              <h4 className="text-xl font-black text-slate-500 uppercase italic tracking-widest">ДАНІ_ВІДСУТНІ</h4>
              <p className="text-[10px] text-slate-700 font-mono uppercase mt-4 max-w-sm mx-auto">
                ОЧІКУВАННЯ ПАКЕТІВ ТЕЛЕМЕТРІЇ ВІД BACKEND ENDPOINT. ПЕ ЕВІ ТЕ З'ЄДНАННЯ.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .shadow-4xl { box-shadow: 0 40px 100px -20px rgba(225,29,72,0.3); }
      `}} />
    </div>
  );
};

