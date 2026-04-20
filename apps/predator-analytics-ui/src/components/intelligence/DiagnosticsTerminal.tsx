/**
 * 📟 DIAGNOSTICS TERMINAL | v58.2-WRAITH
 * Centralized error tracking and system logging for the Intelligence Nexus.
 * Listens for 'predator-error' events and displays them in a cinematic UX.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, ShieldAlert, X, ChevronRight, Activity, Trash2, Cpu, Database, Binary } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

interface ErrorEvent {
  id: string;
  timestamp: string;
  service: string;
  code?: string;
  message: string;
  severity: 'info' | 'warning' | 'critical' | 'error';
}

export const DiagnosticsTerminal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<ErrorEvent[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleError = (e: any) => {
      const detail = e.detail;
      const newLog: ErrorEvent = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: detail.timestamp || new Date().toISOString(),
        service: detail.service || 'System',
        code: detail.code || detail.action || 'Unknown',
        message: detail.error?.message || detail.message || 'Unknown system error',
        severity: detail.severity || 'warning'
      };

      setLogs(prev => [newLog, ...prev.slice(0, 49)]);
      if (newLog.severity === 'critical') {
        setIsOpen(true);
      }
    };

    window.addEventListener('predator-error', handleError);
    return () => window.removeEventListener('predator-error', handleError);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs]);

  const clearLogs = () => setLogs([]);

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-8 right-8 z-[100] p-6 rounded-[2rem] border-2 transition-all shadow-2xl flex items-center gap-4 group",
          logs.some(l => l.severity === 'critical')
            ? "bg-rose-600 border-rose-400 text-white animate-pulse"
            : logs.length > 0
            ? "bg-rose-500 border-rose-500/40 text-black shadow-[0_0_20px_rgba(225,29,72,0.3)]"
            : "bg-black border-white/10 text-slate-500 hover:text-white"
        )}
      >
        <Terminal size={24} className={cn(isOpen && "rotate-90 transition-transform")} />
        {logs.length > 0 && !isOpen && (
          <span className="text-[10px] font-black uppercase tracking-widest italic pr-2">
            ДІАГНОСТИКА: {logs.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-32 right-8 z-[100] w-[500px] h-[600px] bg-black border-2 border-white/10 rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col backdrop-blur-3xl"
          >
            {/* Terminal Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-600/20 rounded-xl">
                  <Activity size={18} className="text-rose-500 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-rose-500 italic tracking-widest uppercase">SYSLOG_DIAGNOSTICS</h3>
                  <p className="text-[8px] font-bold text-slate-700 uppercase tracking-[0.3em]">v58.2-WRAITH // ERR_TRACKER</p>
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={clearLogs}
                  className="p-3 text-slate-600 hover:text-rose-500 transition-colors"
                  title="Очистити логи"
                >
                  <Trash2 size={16} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-3 text-slate-600 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Terminal Content */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar bg-[radial-gradient(circle_at_bottom_right,rgba(225,29,72,0.05),transparent_70%)]"
            >
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40">
                  <ShieldAlert size={48} className="text-slate-800" />
                  <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] italic leading-relaxed">
                    СИСТЕМА СТАБІЛЬНА.<br />КРИТИЧНИХ ПОМИЛОК НЕ ВИЯВЛЕНО.
                  </p>
                </div>
              ) : (
                logs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "p-6 rounded-2xl border bg-black/40 space-y-3 relative overflow-hidden group",
                      log.severity === 'critical' ? "border-rose-900/40 hover:border-rose-600/60" : "border-white/5 hover:border-white/20"
                    )}
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          log.severity === 'critical' ? "bg-rose-600 animate-pulse" : "bg-rose-400"
                        )} />
                        <span className="text-[9px] font-black text-slate-400 uppercase italic tracking-widest">{log.service}</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-700 font-bold">{new Date(log.timestamp).toLocaleTimeString('uk-UA')}</span>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-white italic tracking-widest uppercase mb-1">{log.code}</h4>
                      <p className={cn(
                        "text-[11px] font-medium leading-relaxed italic",
                        log.severity === 'critical' ? "text-rose-400 font-black" : "text-slate-500"
                      )}>
                        {log.message}
                      </p>
                    </div>
                    <div className="absolute top-2 right-2 opacity-[0.03] pointer-events-none">
                      <Binary size={40} className="text-white" />
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Terminal Footer */}
            <div className="p-6 border-t border-white/5 bg-black/60 flex items-center justify-between backdrop-blur-xl">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Cpu size={12} className="text-rose-500" />
                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">KERNEL: v58.3-WRAITH</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database size={12} className="text-rose-500" />
                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">BUFF: {logs.length}/50</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em] italic">SEC_READY</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </>
  );
};
