import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Command,
  Terminal,
  Activity,
  Database,
  Layers,
  Zap,
  Server,
  LogOut,
  Settings,
  ArrowRight,
  Cpu,
  RefreshCw,
  ShieldAlert,
  Brain
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useShell, UIShell } from '../context/ShellContext';

interface CommandItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string[];
  action: () => void;
  group: 'navigation' | 'system' | 'ai' | 'utility';
  danger?: boolean;
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { setShell } = useShell();

  // ДІЙНІ КОМАНДИ
  const commands: CommandItem[] = [
    // Навігація
    { id: 'nav-home', label: 'Перейти на Панель', icon: <Activity size={16} />, group: 'navigation', action: () => navigate('/') },
    { id: 'nav-data', label: 'Менеджер Даних', icon: <Database size={16} />, group: 'navigation', action: () => navigate('/data') },
    { id: 'nav-monitoring', label: 'Системний Моніторинг', icon: <Server size={16} />, group: 'navigation', action: () => navigate('/monitoring') },
    { id: 'nav-neural', label: 'Нейронна Мережа', icon: <Brain size={16} />, group: 'navigation', action: () => navigate('/neural') },

    // Система
    { id: 'sys-restart', label: 'Перезапустити Ядро', icon: <RefreshCw size={16} />, group: 'system', danger: true, action: () => console.log('Перезапуск ядра...') },
    { id: 'sys-cache', label: 'Очистити Системний Кеш', icon: <Zap size={16} />, group: 'system', action: () => console.log('Очищення кешу...') },
    { id: 'sys-lockdown', label: 'Активувати Блокування', icon: <ShieldAlert size={16} />, group: 'system', danger: true, action: () => console.log('Блокування активовано') },

    // Перемикання Оболонки
    { id: 'shell-commander', label: '� ежим: Командир', icon: <Terminal size={16} />, group: 'utility', action: () => setShell(UIShell.COMMANDER) },
    { id: 'shell-operator', label: '� ежим: Оператор', icon: <Layers size={16} />, group: 'utility', action: () => setShell(UIShell.OPERATOR) },
    { id: 'shell-explorer', label: '� ежим: Дослідник', icon: <Search size={16} />, group: 'utility', action: () => setShell(UIShell.EXPLORER) },
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }

      if (!isOpen) return;

      if (e.key === 'Escape') {
        setIsOpen(false);
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          setIsOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-2xl relative z-10 flex flex-col  rounded-2xl bg-[#0b1121] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10"
          >
            {/* Header / Input */}
            <div className="flex items-center px-4 py-4 border-b border-white/5 gap-3">
              <Search className="text-slate-500" size={20} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Швидкий пошук або команда..."
                className="flex-1 bg-transparent text-lg text-white placeholder:text-slate-600 outline-none font-medium"
                autoComplete="off"
              />
              <div className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-mono text-slate-500 uppercase">
                ESC
              </div>
            </div>

            {/* List */}
            <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {filteredCommands.length > 0 ? (
                filteredCommands.map((cmd, index) => (
                    <motion.button
                    key={cmd.id}
                    onClick={() => {
                        cmd.action();
                        setIsOpen(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-200 group ${
                        selectedIndex === index
                        ? cmd.danger
                            ? 'bg-rose-500/10 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                            : 'bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                        : 'border border-transparent hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg transition-colors ${
                        selectedIndex === index
                            ? cmd.danger ? 'bg-rose-500 text-white' : 'bg-cyan-500 text-black'
                            : 'bg-white/5 text-slate-400 group-hover:text-slate-200'
                      }`}>
                        {cmd.icon}
                      </div>
                      <div className="text-left">
                        <div className={`text-sm font-medium ${
                            selectedIndex === index ? 'text-white' : 'text-slate-300'
                        }`}>
                            {cmd.label}
                        </div>
                        {cmd.group && (
                            <div className="text-[9px] uppercase tracking-widest text-slate-600 font-mono mt-0.5">
                                {cmd.group === 'navigation' ? 'НАВІГАЦІЯ' : cmd.group === 'system' ? 'СИСТЕМА' : cmd.group === 'ai' ? 'ІНТЕЛЕКТ' : 'УТИЛІТИ'}
                            </div>
                        )}
                      </div>
                    </div>

                    {selectedIndex === index && (
                        <motion.div layoutId="enter-icon" className="text-white opacity-50">
                            <ArrowRight size={16} />
                        </motion.div>
                    )}
                  </motion.button>
                ))
              ) : (
                <div className="py-12 text-center text-slate-500">
                    <Terminal size={32} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Нічого не знайдено за запитом</p>
                </div>
              )}
            </div>

            {/* Підвал */}
            <div className="px-4 py-2 bg-black/20 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-600">
                <div className="flex gap-4">
                    <span><span className="text-slate-400">↑↓</span> навігація</span>
                    <span><span className="text-slate-400">↵</span> виконати</span>
                    <span><span className="text-slate-400">⌘K</span> відкрити</span>
                </div>
                <div className="font-mono opacity-50 font-bold">Predator v58.2-WRAITH | Neural Analytics</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
