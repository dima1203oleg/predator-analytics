import React, { useState, useEffect, useRef } from 'react';
import { Terminal, ShieldAlert, Cpu, HardDrive, Wifi, Zap, Lock, Skull, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock system events removed.
export const LiveAgentTerminalTab: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { systemApi } = await import('@/services/api/system');
        const data = await systemApi.getLogs(50);
        
        // Map backend logs to UI format
        const formattedLogs = data.map((log: any, index: number) => ({
          id: log.id || log.hash || index,
          time: log.timestamp ? new Date(log.timestamp).toISOString().split('T')[1].substring(0, 8) : new Date().toISOString().split('T')[1].substring(0, 8),
          type: log.level === 'error' || log.level === 'critical' ? 'danger' : log.level === 'warning' ? 'warning' : 'info',
          src: log.source || log.service || 'SYSTEM',
          msg: log.message || log.msg,
          hash: (log.hash || log.id || Math.random().toString(16).substring(2)).substring(0, 8).toUpperCase()
        }));
        
        setLogs(formattedLogs);
      } catch (err) {
        console.error("Failed to fetch system logs", err);
      }
    };
    
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="h-full flex flex-col xl:flex-row gap-6 p-6">
      {/* TERMINAL WINDOW */}
      <div className="flex-1 bg-black/80 rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <Terminal size={18} className="text-cyan-500" />
            <h2 className="text-sm font-black text-white italic uppercase tracking-[0.3em]">LIVE AGENT TERMINAL</h2>
          </div>
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500" />
            <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500 animate-pulse" />
          </div>
        </div>

        {/* Logs Area */}
        <div className="flex-1 overflow-y-auto p-6 font-mono text-[11px] space-y-2 custom-scrollbar">
          <AnimatePresence initial={false}>
            {logs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-4"
              >
                <span className="text-slate-500 shrink-0">[{log.time}]</span>
                <span className="text-slate-600 shrink-0 border-r border-slate-700 pr-4">{log.hash}</span>
                <span className={`shrink-0 w-24 uppercase font-bold tracking-wider ${
                  log.type === 'danger' ? 'text-rose-500' :
                  log.type === 'warning' ? 'text-amber-500' :
                  log.type === 'success' ? 'text-emerald-500' :
                  log.type === 'system' ? 'text-purple-500' : 'text-cyan-500'
                }`}>
                  {log.src}
                </span>
                <span className={`flex-1 ${
                  log.type === 'danger' ? 'text-rose-400 font-bold' :
                  log.type === 'warning' ? 'text-amber-400' :
                  log.type === 'success' ? 'text-emerald-400' : 'text-slate-300'
                }`}>
                  {log.msg}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* STATS SIDEBAR */}
      <div className="w-full xl:w-80 flex flex-col gap-6">
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Cpu size={120} className="text-cyan-500" />
          </div>
          <h3 className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em] mb-4">COMPUTE_NODE</h3>
          <div className="text-4xl font-black font-mono text-white mb-2">94.2%</div>
          <div className="text-xs text-slate-400 font-mono uppercase tracking-widest">CPU UTILIZATION</div>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/30 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <HardDrive size={120} className="text-purple-500" />
          </div>
          <h3 className="text-[10px] font-black text-purple-500 uppercase tracking-[0.3em] mb-4">VRAM_GUARD</h3>
          <div className="text-4xl font-black font-mono text-white mb-2">4.2<span className="text-lg">GB</span></div>
          <div className="text-xs text-slate-400 font-mono uppercase tracking-widest">OUT OF 8.0GB</div>
        </div>

        <div className="bg-black/60 border border-white/10 rounded-3xl p-6 flex-1 space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
            <Wifi size={14} /> МЕРЕЖА_АГЕНТІВ
          </h3>
          {[
            { label: 'OSINT_SPIDER', status: 'ОНЛАЙН', color: 'emerald' },
            { label: 'AML_RADAR', status: 'СИНХРОНІЗАЦІЯ', color: 'amber' },
            { label: 'GRAPH_ENGINE', status: 'АКТИВНИЙ', color: 'cyan' },
          ].map((a, i) => (
            <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{a.label}</span>
              <span className={`text-[8px] font-black px-2 py-1 rounded bg-${a.color}-500/20 text-${a.color}-400 uppercase`}>
                {a.status}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6, 182, 212, 0.4); }
      `}</style>
    </div>
  );
};

export default LiveAgentTerminalTab;
