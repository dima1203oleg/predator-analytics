import React, { useState } from 'react';
import { cn } from '../../../lib/utils';
import { motion } from 'framer-motion';
import { Lock, RefreshCw, Shield, Terminal, Zap, Eye, Database, Activity, Server, Brain, Fingerprint } from 'lucide-react';
import {
  TacticalCard,
  TruthLedgerSection,
  RealTimeSystemMetrics,
  JobQueueMonitor,
  LLMHealthMonitor,
  StorageAnalytics
} from '../../../components';
import { PermissionLayer } from '../'; // from dimensional index
import { SystemMetrics } from '../../../types/metrics';

interface CommanderShellProps {
  metrics: SystemMetrics;
  onAction: (label: string) => void;
}

export const CommanderShell: React.FC<CommanderShellProps> = ({ metrics, onAction }) => {
  const [activeMonitorTab, setActiveMonitorTab] = useState<'metrics' | 'jobs' | 'llm' | 'storage' | 'ledger'>('metrics');

  return (
    <div className="space-y-8">
      {/* Real-Time System Health Banner - Always visible for Commander */}
      <div className="bg-black/60 glass-wraith border border-blue-500/30 rounded-[2rem] p-2 overflow-hidden relative group">
        <div className="absolute inset-0 cyber-scan-grid opacity-[0.03]" />
        <RealTimeSystemMetrics compact={false} />
      </div>

      {/* Strategic Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <TacticalCard
          variant="holographic"
          title="🖥️ ІНФ АСТРУКТУРА_CORE"
          className="border-blue-500/20"
          metrics={[
            { label: 'Контейнери', value: `${metrics.activeContainers}/20` },
            { label: 'CPU_LOAD', value: `${metrics.cpu.toFixed(1)}%` },
            { label: 'RAM_USAGE', value: `${metrics.memory.toFixed(1)}%` }
          ]}
        >
            <div className="mt-6 flex flex-col gap-3">
                 <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden p-[1px]">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '75%' }}
                      className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] rounded-full" 
                    />
                 </div>
                 <div className="flex justify-between items-center font-mono italic">
                   <span className="text-[10px] text-blue-400 font-black tracking-widest uppercase">CLUSTER_STABLE</span>
                   <span className="text-[10px] text-slate-500">99.9% UPTIME</span>
                 </div>
            </div>
        </TacticalCard>

        <TacticalCard variant="holographic" title="🤖 ЯДРО_СУПЕ ІНТЕЛЕКТУ" className="border-purple-500/20">
          <PermissionLayer sensitivity="TOP_SECRET">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-purple-500/5 rounded-2xl border border-purple-500/20 group/row hover:bg-purple-500/10 transition-colors">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">СТАТУС_НАВЧАННЯ:</span>
                <span className="text-green-400 font-black flex items-center gap-2 italic tracking-tight">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]"></span>
                    ACTIVE_SYNC
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-900/40 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">ВЕРСІЯ_МОДЕЛІ:</span>
                <span className="text-purple-400 font-mono font-black italic tracking-tighter">P-v61.0_ELITE_NEURAL</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-900/40 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">IQ_INDEX:</span>
                <span className="text-cyan-400 font-mono font-black italic tracking-tighter">142_SIM</span>
              </div>
            </div>
          </PermissionLayer>
        </TacticalCard>

        <TacticalCard
          variant="holographic"
          title="💾 ГЛОБАЛЬНИЙ_ША _ДАННИХ"
          className="border-cyan-500/20"
          metrics={[
            { label: 'VECTOR_STORE', value: `${(metrics.vectorsCount / 1000).toFixed(1)}K` },
            { label: 'KNOWLEDGE_GRAPH', value: `${(metrics.documentsTotal / 1000).toFixed(1)}K` }
          ]}
        >
            <div className="mt-4 grid grid-cols-8 gap-2 h-10">
                 {[...Array(24)].map((_, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0.2 }}
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                      className={cn("rounded-sm", Math.random() > 0.4 ? 'bg-cyan-500/40 shadow-[0_0_5px_rgba(6,182,212,0.3)]' : 'bg-slate-800')} 
                    />
                 ))}
            </div>
        </TacticalCard>
      </div>

      {/* Advanced Monitoring & Control Tabs */}
      <div className="p-2 bg-black/60 glass-wraith rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 cyber-scan-grid opacity-[0.02]" />
        
        <div className="flex flex-wrap gap-2 mb-6 p-2 bg-white/[0.02] rounded-[2rem] relative z-10">
          {[
            { id: 'metrics', label: 'ТЕЛЕМЕТ ІЯ', icon: <Activity size={16}/>, color: 'blue' },
            { id: 'jobs', label: 'ЧЕ ГИ_ЗАВДАНЬ', icon: <Server size={16}/>, color: 'indigo'  },
            { id: 'llm', label: 'СТАН_LLM', icon: <Brain size={16}/>, color: 'purple'  },
            { id: 'storage', label: 'СХОВИЩА', icon: <Database size={16}/>, color: 'cyan'  },
            { id: 'ledger', label: 'TRUTH_LEDGER', icon: <Fingerprint size={16}/>, color: 'emerald' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveMonitorTab(tab.id as any)}
              className={cn(
                "flex-1 min-w-[120px] py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic transition-all flex items-center justify-center gap-3 relative overflow-hidden group",
                activeMonitorTab === tab.id
                  ? cn(`bg-${tab.color}-600 text-white shadow-[0_0_20px_rgba(var(--${tab.color}-600),0.3)]`)
                  : "bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300"
              )}
            >
              {activeMonitorTab === tab.id && (
                <motion.div layoutId="tab-glow" className="absolute inset-0 bg-white/10 blur-xl" />
              )}
              <span className="relative z-10">{tab.icon}</span>
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6 bg-black/40 rounded-[2rem] border border-white/5 min-h-[400px] relative z-10">
          <div className="absolute top-0 right-0 p-4">
             <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic">LIVE_FEED</span>
             </div>
          </div>
          {activeMonitorTab === 'metrics' && <RealTimeSystemMetrics />}
          {activeMonitorTab === 'jobs' && <JobQueueMonitor />}
          {activeMonitorTab === 'llm' && <LLMHealthMonitor />}
          { activeMonitorTab === 'storage' && <StorageAnalytics /> }
          { activeMonitorTab === 'ledger' && <TruthLedgerSection /> }
        </div>
      </div>

      {/* God Mode / Shadow Protocols */}
      <TacticalCard variant="holographic" title="🎛️ ТІНЬОВІ_ПРОТОКОЛИ_КЕ УВАННЯ" className="border-red-500/30 bg-gradient-to-br from-red-950/20 to-slate-950/80 rounded-[3rem]">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 p-2">
          {[
            { icon: Lock, label: 'БЛОКУВАННЯ', color: 'red', code: 'S-LOCK' },
            { icon: RefreshCw, label: 'ПЕ ЕЗАПУСК', color: 'amber', code: 'R-BOOT' },
            { icon: Shield, label: 'Б АНДМАУЕ ', color: 'blue', code: 'F-WALL' },
            { icon: Terminal, label: 'ТЕРМІНАЛ', color: 'green', code: 'T-CORE' },
            { icon: Zap, label: 'СИНХРОНІЗАЦІЯ', color: 'purple', code: 'P-SYNC' },
            { icon: Eye, label: 'АУДИТ', color: 'cyan', code: 'X-SCAN' },
          ].map((control, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onAction(control.label)}
              className={cn(
                "p-6 rounded-[2rem] border transition-all group flex flex-col items-center justify-center gap-4 h-32 relative overflow-hidden",
                `bg-${control.color}-500/5 border-${control.color}-500/20 hover:border-${control.color}-500/60 hover:bg-${control.color}-500/10`
              )}
            >
              <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-transparent", `via-${control.color}-500/5`)} />
              <control.icon className={cn("w-8 h-8 transition-all group-hover:scale-110", `text-${control.color}-400 drop-shadow-[0_0_10px_rgba(var(--${control.color}-400),0.8)]`)} />
              <div className="text-center relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white italic">{control.label}</p>
                <p className={cn("text-[7px] font-black uppercase tracking-[0.3em] mt-1 opacity-40", `text-${control.color}-400`)}>{control.code}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </TacticalCard>
    </div>
  );
};
