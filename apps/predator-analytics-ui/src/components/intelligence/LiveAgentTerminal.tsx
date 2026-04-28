import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, Cpu, Database, Network, Search, Zap, 
  Activity, X, ChevronRight, Command, Shield, 
  Lock, Globe, Radio, Sparkles, Maximize2, Minimize2
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAppStore } from '@/store/useAppStore';

interface LogEntry {
  id: string;
  timestamp: string;
  module: string;
  message: string;
  type: 'info' | 'warn' | 'error' | 'success' | 'process' | 'system';
}

export const LiveAgentTerminal: React.FC = () => {
  const { isTerminalOpen, setTerminalOpen, setHighVisibility, setPersona } = useAppStore();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const modules = ['NEURAL_CORE', 'OSINT_SPIDER', 'CERS_ENGINE', 'WRAITH_SCANNER', 'OODA_LOOP', 'SYST_KERNEL'];
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

  // Auto-scrolling and log generation
  useEffect(() => {
    const interval = setInterval(() => {
      if (logs.length > 50) return;
      
      const newLog: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString('uk-UA', { hour12: false }),
        module: modules[Math.floor(Math.random() * modules.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        type: ['info', 'process', 'success', 'warn'][Math.floor(Math.random() * 4)] as any
      };

      setLogs(prev => [...prev.slice(-49), newLog]);
    }, 3000);

    return () => clearInterval(interval);
  }, [logs.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const cmd = inputValue.toLowerCase().trim();
    const args = cmd.split(' ');
    
    const timestamp = new Date().toLocaleTimeString('uk-UA', { hour12: false });
    
    const addLog = (message: string, type: LogEntry['type'] = 'system', module = 'SYST_KERNEL') => {
      const newLog: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp,
        module,
        message,
        type
      };
      setLogs(prev => [...prev.slice(-49), newLog]);
    };

    addLog(`> ${inputValue}`, 'info', 'USER_INPUT');

    if (cmd === 'help') {
      addLog('ДОСТУПНІ КОМАНДИ:', 'success');
      addLog(' - help: Показати цей список');
      addLog(' - clear: Очистити термінал');
      addLog(' - highvis <on|off>: � ежим високої контрастності');
      addLog(' - persona <SOVEREIGN|TITAN|...>: Змінити систему');
      addLog(' - scan: Запустити глибоке сканування вузлів');
      addLog(' - exit: Закрити термінал');
    } else if (cmd === 'clear') {
      setLogs([]);
    } else if (cmd === 'exit') {
      setTerminalOpen(false);
    } else if (cmd.startsWith('highvis')) {
      const val = args[1];
      if (val === 'on') {
        setHighVisibility(true);
        addLog('� ЕЖИМ ВИСОКОЇ КОНТ� АСТНОСТІ АКТИВОВАНО', 'success');
      } else if (val === 'off') {
        setHighVisibility(false);
        addLog('� ЕЖИМ ВИСОКОЇ КОНТ� АСТНОСТІ ДЕАКТИВОВАНО', 'info');
      } else {
        addLog('ПОМИЛКА: ВИКО� ИСТОВУЙТЕ "highvis on" або "highvis off"', 'error');
      }
    } else if (cmd.startsWith('persona')) {
      const p = args[1]?.toUpperCase();
      const validPersonas = ['TITAN', 'INQUISITOR', 'SOVEREIGN', 'BUSINESS', 'GOVERNMENT', 'INTELLIGENCE', 'BANKING', 'MEDIA'];
      if (validPersonas.includes(p)) {
        setPersona(p as any);
        addLog(`СИСТЕМНУ ПЕ� СОНУ ЗМІНЕНО НА: ${p}`, 'success');
      } else {
        addLog(`ПОМИЛКА: НЕВАЛІДНА ПЕ� СОНА. ДОСТУПНІ: ${validPersonas.join(', ')}`, 'error');
      }
    } else if (cmd === 'scan') {
      addLog('ЗАПУСК ГЛИБИННОГО СКАНУВАННЯ ВУЗЛІВ WRAITH...', 'process');
      let i = 0;
      const scanInterval = setInterval(() => {
        addLog(`СКАНУВАННЯ ВУЗЛА ${Math.floor(Math.random() * 9999)}... OK`, 'success', 'SCANNER');
        i++;
        if (i > 5) clearInterval(scanInterval);
      }, 500);
    } else {
      addLog(`НЕВІДОМА КОМАНДА: ${cmd}. ВВЕДІТЬ "help" ДЛЯ СПИСКУ.`, 'warn');
    }

    setInputValue('');
  };

  useEffect(() => {
    if (isTerminalOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isTerminalOpen]);

  return (
    <AnimatePresence>
      {isTerminalOpen && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0,
            height: isMinimized ? '60px' : '450px' 
          }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={cn(
            "fixed bottom-28 right-6 z-[100] w-[500px] overflow-hidden flex flex-col",
            "bg-[#050505]/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem]",
            "shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_20px_rgba(244,63,94,0.1)] transition-all duration-500 group"
          )}
        >
          {/* Cyber accents */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-rose-500/20 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(244,63,94,0.05),transparent_70%)] pointer-events-none" />

          {/* Terminal Header */}
          <div className="flex items-center justify-between px-10 py-5 border-b border-white/5 bg-white/[0.02] relative z-20">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20 shadow-inner">
                <Terminal size={18} className="text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
              </div>
              <div className="flex flex-col">
                <h4 className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic leading-none">TACTICAL_INTEL_HUD</h4>
                <div className="flex items-center gap-2 mt-1.5 overflow-hidden">
                  <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse shrink-0" />
                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-tighter whitespace-nowrap">STATUS: OPERATIONAL // VRAM_GUARD ON</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex gap-1.5 px-3 py-1 bg-black/40 rounded-full border border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-600/40 border border-rose-500 animate-pulse" />
                <div className="w-1.5 h-1.5 rounded-full bg-orange-600/40 border border-orange-500" />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-600/40 border border-slate-500" />
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-all text-slate-500 hover:text-white"
                >
                  {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                </button>
                <button 
                  onClick={() => setTerminalOpen(false)}
                  className="p-2 hover:bg-rose-500/20 rounded-xl transition-all text-slate-500 hover:text-rose-500 group/close"
                >
                  <X size={16} className="group-hover/close:rotate-90 transition-transform duration-300" />
                </button>
              </div>
            </div>
          </div>

          {/* Terminal Content Wrapper */}
          <div className={cn("flex-1 flex flex-col min-h-0", isMinimized ? "hidden" : "flex")}>
            {/* Terminal Body */}
            <div 
              ref={scrollRef}
              className="flex-1 p-8 space-y-4 overflow-y-auto custom-scrollbar font-mono text-[10px] relative z-10 bg-black/20"
            >
              <AnimatePresence initial={false}>
                {logs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-4 items-start group/line"
                  >
                    <span className="text-slate-600 font-mono shrink-0 select-none">[{log.timestamp}]</span>
                    <span className={cn(
                      "px-2.5 py-0.5 rounded text-[9px] font-black tracking-widest shrink-0 border shadow-sm",
                      log.type === 'warn' ? "bg-orange-500/10 border-orange-500/30 text-orange-400" :
                      log.type === 'error' ? "bg-rose-500/20 border-rose-500/40 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]" :
                      log.type === 'success' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                      log.type === 'system' ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" :
                      "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    )}>
                      {log.module}
                    </span>
                    <span className={cn(
                      "tracking-tight leading-relaxed transition-colors",
                      log.type === 'error' ? "text-rose-200 font-bold" : 
                      log.type === 'system' ? "text-cyan-100 italic" :
                      "text-slate-300 group-hover/line:text-white"
                    )}>
                      {log.message}
                    </span>
                    <motion.div 
                      animate={{ height: [4, 12, 4] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="w-[2px] bg-rose-500/30 shrink-0 mt-0.5 opacity-0 group-hover/line:opacity-100 transition-opacity"
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {logs.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full space-y-6 opacity-30">
                  <div className="relative">
                    <Activity className="animate-pulse text-rose-500" size={48} />
                    <div className="absolute inset-0 bg-rose-500 blur-2xl animate-pulse -z-10" />
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="uppercase tracking-[1em] font-black italic text-rose-500/80 mb-2">WRAITH_STANDBY</p>
                    <p className="text-[9px] text-slate-500 font-mono italic">ЯД� О ГОТОВЕ ДО П� ИЙОМУ КОМАНД...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Command Input Filter Area */}
            <form 
              onSubmit={handleCommand}
              className="px-10 py-5 bg-white/[0.03] border-t border-white/10 flex items-center gap-4 relative group/input"
            >
              <div className="absolute top-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-rose-500/30 to-transparent" />
              <Command size={14} className="text-rose-500/60 group-focus-within/input:text-rose-400 transition-colors" />
              <input 
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="ВВЕДІТЬ ТАКТИЧНУ КОМАНДУ АБО ЗАПИТ..."
                className="flex-1 bg-transparent border-none text-white font-mono text-[10px] tracking-widest placeholder:text-slate-700 outline-none uppercase italic"
              />
              <div className="flex gap-2">
                <div className="px-2 py-1 bg-white/5 rounded-md border border-white/5 text-[8px] font-black text-slate-500 flex items-center justify-center min-w-[30px]">
                  ENTER
                </div>
              </div>
            </form>

            {/* Terminal Footer Statistics */}
            <div className="px-10 py-4 bg-black/60 flex items-center justify-between relative z-20">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 group/stat">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 group-hover/stat:animate-ping" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic group-hover/stat:text-rose-400 transition-colors">LINK_STABLE</span>
                </div>
                <div className="flex items-center gap-2 group/stat">
                  <Network size={12} className="text-slate-600 group-hover/stat:text-rose-400 transition-all" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic group-hover/stat:text-slate-300 transition-colors">418ms_LATENCY</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-rose-500 font-black italic">
                  <Sparkles size={12} className="animate-pulse" />
                  <span className="text-[9px] uppercase tracking-[0.2em]">P_OSINT_KERNEL 58.2</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
