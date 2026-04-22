import React from 'react';
import { cn } from '../../../lib/utils';
import { motion } from 'framer-motion';
import { Cpu, Activity, Network, Zap, AlertTriangle, HardDrive } from 'lucide-react';
import { CyberOrb, TacticalCard } from '../../../components'; // Shared components
import { SystemMetrics } from '../../../types/metrics';
import GoogleAdvisoryPanel from '../GoogleAdvisoryPanel';

interface OperatorShellProps {
  metrics: SystemMetrics;
  activeProcesses: any[];
  alerts: any[];
  onAIAction: () => void;
}

export const OperatorShell: React.FC<OperatorShellProps> = ({
  metrics,
  activeProcesses,
  alerts,
  onAIAction,
}) => {
  return (
    <div className="space-y-8">
      {/* Heads-Up Display (HUD) Status */}
      <div className="relative p-10 bg-black/60 glass-wraith rounded-[3rem] border border-cyan-500/20 overflow-hidden group">
        <div className="absolute inset-0 cyber-scan-grid opacity-[0.05]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(6,182,212,0.15),transparent_50%)]" />
        
        <div className="flex justify-between items-center relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] italic">OPERATIONAL_CONTROL</span>
              <h2 className="text-4xl font-black text-white italic tracking-tight uppercase">CORTEX_OVERRIDE</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                 {[...Array(5)].map((_, i) => (
                   <div key={i} className={cn("w-1 h-4 rounded-full", i < 4 ? "bg-cyan-500" : "bg-slate-800")} />
                 ))}
              </div>
              <p className="text-sm text-cyan-400 font-black font-mono tracking-widest uppercase animate-pulse">SYSTEM_OPTIMAL // CORE_STABILITY: 98.4%</p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full" />
            <CyberOrb status={alerts.length > 0 ? "alert" : "active"} size={100} animated pulsing />
          </div>
        </div>
      </div>

      {/* Real-time Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: Cpu, label: 'ЦП_ОБРОБКА', value: metrics.cpu, unit: '%', color: 'cyan', desc: 'Завантаження ядер' },
          { icon: HardDrive, label: 'MEM_КЕШ', value: metrics.memory, unit: '%', color: 'blue', desc: 'Використання VRAM' },
          { icon: Network, label: 'NET_ТРАФІК', value: metrics.network, unit: '%', color: 'purple', desc: 'Вхідні пакети' },
          { icon: Activity, label: 'SYS_HEALTH', value: metrics.health, unit: '%', color: 'green', desc: 'Загальна стабільність' },
        ].map((metric, idx) => (
          <TacticalCard key={idx} variant="holographic" className="p-0 overflow-hidden" title={metric.label}>
            <div className="p-6 bg-black/40 relative group/metric">
              <div className={cn("absolute top-0 right-0 p-4 opacity-20", `text-${metric.color}-400`)}>
                <metric.icon size={40} />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 italic">{metric.desc}</p>
                <div className="flex items-end gap-2">
                  <p className={cn("text-5xl font-black italic tracking-tighter", `text-${metric.color}-400`)}>
                    {metric.value ? metric.value.toFixed(0) : '0'}
                  </p>
                  <span className="text-xl font-black text-slate-600 mb-2">{metric.unit}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full mt-6 p-[1px] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, metric.value)}%` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className={cn("h-full rounded-full", `bg-${metric.color}-500 shadow-[0_0_15px_rgba(var(--${metric.color}-500),0.6)]`)}
                  />
                </div>
              </div>
            </div>
          </TacticalCard>
        ))}
      </div>

      {/* Active Operations & Alerts Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TacticalCard variant="holographic" title="🔄 АКТИВНІ_ОПЕРАЦІЇ_ЯДРА">
          <div className="space-y-4 p-2">
            {activeProcesses.length === 0 ? (
              <div className="p-10 text-center border border-dashed border-slate-800 rounded-[2rem] bg-slate-900/20">
                <p className="text-xs text-slate-500 font-black uppercase tracking-widest italic">IDLE_STATE // ОЧІКУВАННЯ_ЗАВДАНЬ</p>
              </div>
            ) : (
              activeProcesses.map((process, idx) => (
                <div key={idx} className="p-6 bg-black/40 border border-white/5 rounded-[2rem] relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                         <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
                       </div>
                       <div>
                         <span className="text-base font-black text-white italic uppercase tracking-tight">{process.name}</span>
                         <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mt-0.5">TASK_ID: {Math.random().toString(16).slice(2, 8).toUpperCase()}</p>
                       </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-cyan-400 font-mono italic tracking-tighter">{process.progress}%</span>
                      {process.name === 'ML Навчання' && (
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={onAIAction} 
                          className="p-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/40 transition-colors ml-4 shadow-lg shadow-cyan-500/20"
                        >
                          <Zap className="w-4 h-4 text-cyan-400" />
                        </motion.button>
                      )}
                    </div>
                  </div>

                  <div className="h-2 bg-slate-950 rounded-full relative z-10 p-[1px]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${process.progress}%` }}
                      transition={{ duration: 0.8, ease: "circOut" }}
                      className="h-full bg-gradient-to-r from-cyan-600 to-blue-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </TacticalCard>

        <TacticalCard variant="holographic" title="⚠️ ТЕРМІНОВІ_СПОВІЩЕННЯ">
          <div className="space-y-3 p-2 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
            {alerts.length === 0 ? (
              <div className="p-10 text-center border border-dashed border-slate-800 rounded-[2rem] bg-green-500/5">
                <Shield className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-40" />
                <p className="text-xs text-slate-500 font-black uppercase tracking-[0.2em] italic">SECURE_ENVIRONMENT // NO_THREATS</p>
              </div>
            ) : (
              alerts.map((alert, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={cn(
                    "p-5 rounded-[2rem] border relative overflow-hidden group flex items-start gap-4 transition-all hover:translate-x-1",
                    alert.type === 'error' 
                      ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10' 
                      : 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10'
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    alert.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                  )}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm text-white font-black italic uppercase tracking-tight">{alert.title}</p>
                      <span className="text-[10px] text-slate-600 font-black italic uppercase tracking-widest">{alert.time}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">{alert.message}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </TacticalCard>
      </div>

      {/* Google AI Integrative Panel - Full Width */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
        <div className="relative z-10">
          <GoogleAdvisoryPanel />
        </div>
      </div>
    </div>
  );
};

// Simple icon component for placeholder usage if needed
const Shield = ({ className, ...props }: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
