import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Terminal, Activity, CheckCircle2, AlertTriangle, Info, Bot } from 'lucide-react';
import { factoryApi } from '@/services/api/factory';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

export function AgentTerminal() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['factory', 'agent-logs'],
    queryFn: factoryApi.getAgentLogs,
    refetchInterval: 3000,
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'info': return <Info className="w-4 h-4 text-cyan-400" />;
      case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'error': return <Activity className="w-4 h-4 text-red-400" />;
      default: return <Terminal className="w-4 h-4 text-slate-400" />;
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'info': return 'text-cyan-400';
      case 'success': return 'text-emerald-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-slate-300';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-white/10 rounded-lg overflow-hidden shadow-2xl">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/60 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-yellow-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Термінал Агентів Фабрики</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs text-emerald-400 font-mono">LIVE</span>
        </div>
      </div>

      {/* Terminal Body */}
      <div 
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto font-mono text-sm space-y-2 scroll-smooth"
      >
        {isLoading ? (
          <div className="text-slate-500 flex items-center gap-2 animate-pulse">
            <Terminal className="w-4 h-4" /> Завантаження логів...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-slate-500">Немає активних логів агентів.</div>
        ) : (
          <AnimatePresence initial={false}>
            {logs.map((log, index) => (
              <motion.div 
                key={`${log.timestamp}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-3 p-2 hover:bg-white/5 rounded transition-colors"
              >
                <div className="text-slate-500 text-xs mt-0.5 whitespace-nowrap">
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </div>
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex items-center gap-2">
                    <Bot className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-300 font-bold text-xs">{log.agent}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">{getLogIcon(log.level)}</div>
                    <span className={cn('break-words w-full', getLogColor(log.level))}>
                      {log.message}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
