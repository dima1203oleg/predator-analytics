import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Zap, Brain, Shield, RefreshCw, CheckCircle2, AlertTriangle, Terminal } from 'lucide-react';
import { api } from '../../services/api';

interface EvolutionLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export const EternalEvolutionDashboard: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [logs, setLogs] = useState<EvolutionLog[]>([]);
  const [isEvolving, setIsEvolving] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await api.v25.azr.getStatus();

        setStatus({
          overall_status: data.is_running ? 'evolving' : 'suspended',
          autonomy_level: data.rights_level === 'R2' ? 5.0 : 2.0,
          cycle: data.cycle,
          uptime: '14h 23m 10s',
          policy: data.policy,
          mission: data.mission, // New Field
          optimizations: {
            frontend: data.cycle * 2,
            backend: Math.floor(data.cycle * 1.5),
            database: data.axioms_total,
            ai: data.memory_stats.failures_prevented
          }
        });
      } catch (err) {
         console.error("Dashboard Fetch Error:", err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await api.v25.azr.getAudit();

        const mappedLogs: EvolutionLog[] = data.map((log: any) => ({
          id: log.sovereign_id,
          timestamp: new Date(log.timestamp).toLocaleTimeString(),
          type: log.status === 'SUCCESS' ? 'success' : 'error',
          message: `${log.action.type}: ${log.action.meta.change || log.action.meta.path}`
        })).reverse();

        setLogs(mappedLogs);
      } catch (err) {
        console.error("Logs Fetch Error:", err);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-12">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
            <Rocket className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">ETERNAL EVOLUTION ENGINE</h1>
            <p className="text-blue-400 font-bold tracking-widest text-xs uppercase">Система Самовдосконалення v26.0</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Main Status */}
        <div className="lg:col-span-2 p-8 rounded-3xl bg-slate-900/50 border border-white/5 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Brain size={120} className="text-blue-500" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(i => (
                  <motion.div
                    key={i}
                    animate={{ scaleY: [1, 1.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1.5 h-6 bg-blue-500 rounded-full"
                  />
                ))}
              </div>
              <span className="text-blue-400 font-black text-xs uppercase tracking-widest">Система Активна</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              <div>
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Рівень Автономії</div>
                <div className="text-3xl font-black text-white">{status?.autonomy_level.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Цикли Еволюції</div>
                <div className="text-3xl font-black text-white">{status?.cycle}</div>
              </div>
              <div>
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Оптимізацій</div>
                <div className="text-3xl font-black text-white">{Number(Object.values(status?.optimizations || {}).reduce((a: any, b: any) => a + (b as number), 0))}</div>
              </div>
              <div>
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Час Роботи</div>
                <div className="text-xl font-bold text-white pt-1">{status?.uptime}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Intelligence Card */}
        <div className="p-8 rounded-3xl bg-indigo-600 shadow-2xl shadow-indigo-500/20 text-white">
          <Brain className="mb-4" size={32} />
          <h2 className="text-xl font-black mb-2 leading-tight">Автономне Навчання</h2>
          <p className="text-indigo-100 text-sm mb-6 leading-relaxed opacity-80">
            Система аналізує дії користувачів та патерни системи для автоматичного покращення UI та Backend коду.
          </p>
          <div className="space-y-4">
            <div className="bg-white/10 p-3 rounded-xl border border-white/10">
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Наступне оновлення</div>
              <div className="text-sm font-bold flex items-center justify-between">
                <span>Refactoring App.tsx</span>
                <span className="text-green-300">89%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Terminal Logs */}
        <div className="p-8 rounded-3xl bg-[#020617] border border-white/5 font-mono">
          <div className="flex items-center gap-2 mb-6 text-slate-500">
            <Terminal size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">Журнал Еволюції</span>
          </div>
          <div className="space-y-3">
            {logs.map(log => (
              <div key={log.id} className="text-sm flex gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
                <span className="text-slate-600 flex-shrink-0">[{log.timestamp}]</span>
                <span className={
                  log.type === 'success' ? 'text-green-400' :
                  log.type === 'warning' ? 'text-amber-400' : 'text-blue-400'
                }>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Specific Optimizations */}
        <div className="space-y-4">
            {/* Governance & Constitution (DAO) */}
            <div className="p-6 rounded-3xl bg-slate-900/50 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                   <Shield size={14} className="text-blue-400" /> КОНСТИТУЦІЯ (DAO)
                </h3>
                 <button
                    onClick={async () => {
                        const title = window.prompt("Amendment Title:");
                        if (!title) return;
                        const desc = window.prompt("Description (Reasoning):");
                        if (!desc) return;

                        try {
                            const res = await api.v25.azr.governance.propose(title, desc);
                            alert(`Proposal Status: ${res.status}\nVotes For: ${res.votes_for}\nVotes Against: ${res.votes_against}`);
                        } catch (e) {
                            alert("Failed to submit proposal: " + e);
                        }
                    }}
                    className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-500 hover:text-white transition-all"
                 >
                    PROPOSE AMENDMENT
                 </button>
              </div>

              <div className="space-y-2">
                {(status?.axioms || []).map((axiom: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 text-[10px] text-slate-300 bg-white/5 p-2 rounded-lg">
                     <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />
                     <span>{axiom}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-[10px] text-slate-500 text-center">
                  Governance Bridge: <span className="text-green-400">ACTIVE</span> | Rights: <span className="text-amber-400">{status?.rights_level || "R2"}</span>
              </div>
            </div>

          <button
             onClick={async () => {
                if (window.confirm("ВИ ВПЕВНЕНІ? Це зупинить всі автономні процеси AZR!")) {
                   await fetch('/api/v25/azr/freeze', { method: 'POST' });
                   window.location.reload();
                }
             }}
             className="w-full p-4 rounded-2xl bg-red-950/30 border border-red-500/50 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
          >
             <AlertTriangle size={16} /> EMERGENCY FREEZE (KILL-SWITCH)
          </button>

            {/* Policy Config */}
            {/* Current Mission */}
            <div className="p-6 rounded-3xl bg-slate-900/50 border border-white/5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-blue-500/10 blur-xl group-hover:bg-blue-500/20 transition-all opacity-0 group-hover:opacity-100" />
              <div className="relative">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                  <Brain size={14} className="text-blue-400" /> Current Strategy (Mission Planner)
                </h3>
                <div className="text-sm font-medium text-white/90 truncate">
                   {status?.mission || "Initializing Strategic Core..."}
                </div>
              </div>
            </div>

            {/* Resources - now smaller */}
            <div className="p-6 rounded-3xl bg-slate-900/50 border border-white/5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <Terminal size={14} className="text-amber-400" /> АКТИВНА ПОЛІТИКА (SPEC DSL)
              </h3>
              <div className="space-y-2 text-[10px] font-mono text-slate-400">
                <div className="flex justify-between">
                  <span>Max Changes/Cycle:</span>
                  <span className="text-white">{status?.policy?.max_changes_per_cycle || 5}</span>
                </div>
                <div className="flex justify-between">
                   <span>Allowed UI:</span>
                   <span className={status?.policy?.allowed?.ui ? "text-green-400" : "text-red-400"}>
                     {String(status?.policy?.allowed?.ui || true).toUpperCase()}
                   </span>
                </div>
                 <div className="flex justify-between">
                   <span>Allowed Backend:</span>
                   <span className={status?.policy?.allowed?.backend ? "text-green-400" : "text-red-400"}>
                     {String(status?.policy?.allowed?.backend || true).toUpperCase()}
                   </span>
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};
