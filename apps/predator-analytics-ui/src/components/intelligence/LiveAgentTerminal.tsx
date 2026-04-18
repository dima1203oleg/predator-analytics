import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Cpu, Database, Network, Search, Zap, Activity } from 'lucide-react';
import { cn } from '@/utils/cn';

interface LogEntry {
  id: string;
  timestamp: string;
  module: string;
  message: string;
  type: 'info' | 'warn' | 'error' | 'success' | 'process';
}

export const LiveAgentTerminal: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const modules = ['NEURAL_CORE', 'OSINT_SPIDER', 'CERS_ENGINE', 'WRAITH_SCANNER', 'OODA_LOOP'];
  const messages = [
    'Аналіз графа звʼязків завершено',
    'Виявлено новий офшорний вузол у зоні BVI',
    'Синхронізація з Neo4j кластером...',
    'Нейронна мережа ідентифікувала аномальну транзакцію',
    'Оновлення КБ-профілю обʼєкта 41829391',
    'Запуск протоколу глибинного сканування...',
    'Предиктивна модель: рівень ризику підвищено до 0.84',
    'Оптимізація VRAM для локальної моделі Qwen3',
    'Дешифрування зашифрованого потоку даних...',
    'Вузли ризику Wraith: знайдено 12 нових звʼязків'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      const newLog: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString('uk-UA', { hour12: false }),
        module: modules[Math.floor(Math.random() * modules.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        type: ['info', 'process', 'success', 'warn'][Math.floor(Math.random() * 4)] as any
      };

      setLogs(prev => [...prev.slice(-15), newLog]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-[#050505] border border-white/5 rounded-[2rem] overflow-hidden flex flex-col h-full shadow-2xl relative group">
      <div className="absolute inset-0 bg-emerald-500/[0.02] pointer-events-none" />
      
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-4">
          <Terminal size={18} className="text-[#D4AF37]" />
          <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em] italic leading-none">ТЕХНІЧНИЙ_ЛОГ_АГЕНТІВ</h4>
        </div>
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-500/20 border border-rose-500/40" />
          <div className="w-2 h-2 rounded-full bg-amber-500/20 border border-amber-500/40" />
          <div className="w-2 h-2 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
        </div>
      </div>

      {/* Terminal Content */}
      <div 
        ref={scrollRef}
        className="flex-1 p-6 space-y-3 overflow-y-auto no-scrollbar font-mono text-[9px] relative z-10"
      >
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-4 items-start group/line"
            >
              <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
              <span className={cn(
                "px-2 py-0.5 rounded text-[8px] font-black tracking-widest shrink-0 border",
                log.type === 'warn' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                log.type === 'error' ? "bg-rose-500/10 border-rose-500/20 text-rose-500" :
                log.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                "bg-blue-500/10 border-blue-500/20 text-blue-400"
              )}>
                {log.module}
              </span>
              <span className="text-slate-300 tracking-tight leading-relaxed group-hover/line:text-white transition-colors">
                {log.message}
              </span>
              <motion.div 
                animate={{ opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-1 h-3 bg-[#D4AF37]/40 shrink-0 mt-0.5 opacity-0 group-hover/line:opacity-100"
              />
            </motion.div>
          ))}
        </AnimatePresence>
        {logs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-20">
            <Activity className="animate-pulse text-[#D4AF37]" size={32} />
            <p className="uppercase tracking-[0.5em] font-black">Очікування потоку даних...</p>
          </div>
        )}
      </div>

      {/* Terminal Footer */}
      <div className="px-8 py-4 border-t border-white/5 bg-black/40 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">STREAM_LIVE</span>
          </div>
          <div className="flex items-center gap-2">
            <Database size={12} className="text-slate-600" />
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">BSON/ORJSON</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[#D4AF37]">
          <Zap size={12} />
          <span className="text-[8px] font-black uppercase tracking-[0.2em] italic">PREDATOR_CORE v57.8</span>
        </div>
      </div>
    </div>
  );
};
