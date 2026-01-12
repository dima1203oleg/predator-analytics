import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Activity, Network, Zap, AlertTriangle, HardDrive } from 'lucide-react';
import { CyberOrb, TacticalCard } from '../../../components'; // Shared components
import { SystemMetrics } from '../../../types/metrics';

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
    <div className="space-y-6">
      {/* Heads-Up Display (HUD) Status */}
      <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-900/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none" />
        <div className="z-10">
          <h2 className="text-2xl font-black text-white tracking-tight">CORTEX CONTROL</h2>
          <div className="flex items-center gap-2 mt-1">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
             <p className="text-sm text-green-400 font-mono">SYSTEM OPTIMAL // LEVEL 4</p>
          </div>
        </div>
        <div className="z-10">
          <CyberOrb status={alerts.length > 0 ? "alert" : "active"} size={80} animated pulsing />
        </div>
      </div>

      {/* Real-time Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Cpu, label: 'ЦП', value: metrics.cpu, unit: '%', color: 'cyan' },
          { icon: HardDrive, label: 'MEM', value: metrics.memory, unit: '%', color: 'blue' },
          { icon: Network, label: 'NET', value: metrics.network, unit: '%', color: 'purple' },
          { icon: Activity, label: 'HLTH', value: metrics.health, unit: '%', color: 'green' },
        ].map((metric, idx) => (
          <TacticalCard key={idx} variant="holographic" className="p-4" title={metric.label}>
            <div className="mt-2 text-center">
              <p className={`text-3xl font-black text-${metric.color}-400 font-mono`}>
                {metric.value ? metric.value.toFixed(0) : '0'}<span className="text-sm text-slate-500 ml-1">{metric.unit}</span>
              </p>
              <div className="h-1.5 w-full bg-slate-800 rounded-full mt-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, metric.value)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full bg-${metric.color}-500 shadow-[0_0_10px_rgba(var(--${metric.color}-500),0.5)]`}
                />
              </div>
            </div>
          </TacticalCard>
        ))}
      </div>

      {/* Active Operations & Alerts Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TacticalCard variant="holographic" title="🔄 Активні Операції">
          <div className="space-y-3">
            {activeProcesses.length === 0 ? (
              <p className="text-xs text-slate-500 p-2 text-center">Система в режимі очікування</p>
            ) : (
              activeProcesses.map((process, idx) => (
                <div key={idx} className="p-4 bg-slate-900/40 border border-cyan-500/20 rounded-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-cyan-500/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                  <div className="flex items-center justify-between mb-2 relative z-10">
                    <div className="flex items-center gap-2">
                       <Activity className="w-3 h-3 text-cyan-400 animate-spin-slow" />
                      <span className="text-sm font-bold text-white">{process.name}</span>
                      {process.name === 'ML Навчання' && (
                        <button onClick={onAIAction} className="p-1 rounded bg-cyan-500/20 hover:bg-cyan-500/40 transition-colors ml-2">
                          <Zap className="w-3 h-3 text-cyan-400" />
                        </button>
                      )}
                    </div>
                    <span className="text-xs font-mono text-cyan-400">{process.progress}%</span>
                  </div>

                  <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden relative z-10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${process.progress}%` }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </TacticalCard>

        <TacticalCard variant="holographic" title="⚠️ Оперативні Сповіщення">
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {alerts.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-700 rounded-xl bg-slate-800/20">
                <Shield className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Всі системи працюють у штатному режимі</p>
              </div>
            ) : (
              alerts.map((alert, idx) => (
                <div key={idx} className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl flex items-start gap-3 hover:bg-red-500/10 transition-colors cursor-pointer">
                  <div className="mt-0.5">
                    <AlertTriangle className={`w-4 h-4 ${alert.type === 'error' ? 'text-red-400' : 'text-amber-400'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="text-xs text-white font-bold">{alert.title}</p>
                      <span className="text-[10px] text-slate-500 font-mono">{alert.time}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{alert.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </TacticalCard>
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
