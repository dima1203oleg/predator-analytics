import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, RefreshCw, Shield, Terminal, Zap, Eye, Database, Activity, Server, Brain } from 'lucide-react';
import { TacticalCard } from '../../../components';
import { RealTimeSystemMetrics, JobQueueMonitor, LLMHealthMonitor, StorageAnalytics } from '../../../components'; // As per imports in original dashboard
import { PermissionLayer } from '../'; // from dimensional index
import { SystemMetrics } from '../../../types/metrics';

interface CommanderShellProps {
  metrics: SystemMetrics;
  onAction: (label: string) => void;
}

export const CommanderShell: React.FC<CommanderShellProps> = ({ metrics, onAction }) => {
  const [activeMonitorTab, setActiveMonitorTab] = useState<'metrics' | 'jobs' | 'llm' | 'storage'>('metrics');

  return (
    <div className="space-y-6">
      {/* Real-Time System Health Banner - Always visible for Commander */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-1 overflow-hidden">
        <RealTimeSystemMetrics compact={false} />
      </div>

      {/* Strategic Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TacticalCard
          variant="holographic"
          title="🖥️ Інфраструктура"
          metrics={[
            { label: 'Контейнери', value: `${metrics.activeContainers}/20` },
            { label: 'CPU Load', value: `${metrics.cpu.toFixed(1)}%` },
            { label: 'RAM Usage', value: `${metrics.memory.toFixed(1)}%` }
          ]}
        >
            <div className="mt-4 flex gap-2">
                 <div className="h-2 flex-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-3/4"></div>
                 </div>
                 <div className="text-[10px] text-blue-400 font-mono">STABLE</div>
            </div>
        </TacticalCard>

        <TacticalCard variant="holographic" title="🤖 Ядро Суперінтелекту">
          <PermissionLayer sensitivity="TOP_SECRET">
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <span className="text-slate-300">Статус Навчання:</span>
                <span className="text-green-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                    АКТИВНИЙ
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                <span className="text-slate-400">Версія Моделі:</span>
                <span className="text-purple-400 font-mono font-bold">PREDATOR v25.1.0</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                <span className="text-slate-400">Когнітивний Індекс:</span>
                <span className="text-cyan-400 font-mono font-bold">142 IQ (SIMULATED)</span>
              </div>
            </div>
          </PermissionLayer>
        </TacticalCard>

        <TacticalCard
          variant="holographic"
          title="💾 Глобальний Шар Даних"
          metrics={[
            { label: 'Vector Store', value: `${(metrics.vectorsCount / 1000).toFixed(1)}K` },
            { label: 'Knowledge Graph', value: `${(metrics.documentsTotal / 1000).toFixed(1)}K` }
          ]}
        >
            <div className="mt-3 grid grid-cols-4 gap-1 h-8">
                 {[...Array(16)].map((_, i) => (
                    <div key={i} className={`rounded-sm ${Math.random() > 0.3 ? 'bg-cyan-500/40' : 'bg-slate-800'}`}></div>
                 ))}
            </div>
        </TacticalCard>
      </div>

      {/* Advanced Monitoring & Control Tabs */}
      <div className="p-1 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl">
        <div className="flex gap-2 mb-4 p-2 bg-black/20 rounded-xl">
          {[
            { id: 'metrics', label: 'Телеметрія', icon: <Activity size={14}/> },
            { id: 'jobs', label: 'Черги Завдань', icon: <Server size={14}/>  },
            { id: 'llm', label: 'Стан LLM', icon: <Brain size={14}/>  },
            { id: 'storage', label: 'Сховища', icon: <Database size={14}/>  }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveMonitorTab(tab.id as any)}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeMonitorTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/80 hover:text-white'
                }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 bg-black/40 rounded-xl min-h-[300px]">
          {activeMonitorTab === 'metrics' && <RealTimeSystemMetrics />}
          {activeMonitorTab === 'jobs' && <JobQueueMonitor />}
          {activeMonitorTab === 'llm' && <LLMHealthMonitor />}
          {activeMonitorTab === 'storage' && <StorageAnalytics />}
        </div>
      </div>

      {/* God Mode / Shadow Controls */}
      <TacticalCard variant="holographic" title="🎛️ ТІНЬОВІ ПРОТОКОЛИ" className="border-red-500/30 bg-gradient-to-br from-red-950/30 to-slate-950/80">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[
            { icon: Lock, label: 'БЛОКУВАННЯ', color: 'red' },
            { icon: RefreshCw, label: 'ПЕРЕЗАПУСК', color: 'amber' },
            { icon: Shield, label: 'БРАНДМАУЕР', color: 'blue' },
            { icon: Terminal, label: 'ТЕРМІНАЛ', color: 'green' },
            { icon: Zap, label: 'СИНХРОНІЗАЦІЯ', color: 'purple' },
            { icon: Eye, label: 'АУДИТ', color: 'cyan' },
          ].map((control, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onAction(control.label)}
              className={`p-4 rounded-2xl bg-${control.color}-500/5 border border-${control.color}-500/20 hover:border-${control.color}-500/60 transition-all group flex flex-col items-center justify-center gap-3 h-24`}
            >
              <control.icon className={`w-6 h-6 text-${control.color}-400 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(var(--${control.color}-400),0.7)] transition-all`} />
              <p className={`text-[9px] font-black uppercase tracking-widest text-${control.color}-400 group-hover:text-white transition-colors`}>
                {control.label}
              </p>
            </motion.button>
          ))}
        </div>
      </TacticalCard>
    </div>
  );
};
