import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart2,
  BrainCircuit,
  Command,
  FileText,
  Home, Radio,
  Search,
  Shield,
  Ship,
  TrendingUp,
  X
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../utils/cn';

export const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toggleSidebar, userRole } = useAppStore();

  // Toggle with Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const actions = [
    { id: 'home', label: 'Головний Театр (Omniscience)', icon: Home, action: () => navigate('/') },
    { id: 'foundry', label: 'ML_FOUNDRY (Навчання)', icon: BrainCircuit, action: () => navigate('/datasets') },
    { id: 'evolution', label: 'Evolution Lab (Метрики)', icon: TrendingUp, action: () => navigate('/evolution') },
    { id: 'governance', label: 'Sovereign Governance', icon: Shield, action: () => navigate('/governance') },
    { id: 'news', label: 'Стрічка Новин (Signals)', icon: Radio, action: () => navigate('/news') },
    { id: 'search', label: 'Глобальний Пошук', icon: Search, action: () => navigate('/search-v2') },
    { id: 'analytics', label: 'Аналітика (Neural Hub)', icon: BarChart2, action: () => navigate('/analytics') },
    { id: 'customs', label: 'Митний Реєстр (Intelligence)', icon: Ship, action: () => navigate('/customs-intel') },
    { id: 'security', label: 'Security & Audit (Truth Ledger)', icon: Shield, action: () => navigate('/security') },
    { id: 'sidebar', label: 'Перемкнути Меню', icon: FileText, action: toggleSidebar },
  ];

  if (userRole === 'admin') {
    actions.push({ id: 'admin', label: 'Адмін Панель', icon: Shield, action: () => navigate('/admin') });
  }

  const filteredActions = actions.filter(action =>
    action.label.toLowerCase().includes(query.toLowerCase())
  );

  // Keyboard navigation
  useEffect(() => {
    const handleNavigation = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredActions.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          filteredActions[selectedIndex].action();
          setIsOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleNavigation);
    return () => window.removeEventListener('keydown', handleNavigation);
  }, [isOpen, filteredActions, selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -40, rotateX: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -40, rotateX: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="w-full max-w-xl bg-slate-900/80 border border-emerald-500/30 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.1)] relative z-10 backdrop-blur-2xl overflow-hidden"
          >
            {/* Animated Scanline */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(transparent_50%,rgba(16,185,129,0.5)_50%)] bg-[length:100%_4px] animate-scanline z-0" />

            {/* Header */}
            <div className="flex items-center px-6 py-5 border-b border-white/5 relative z-10">
              <div className="p-2 bg-emerald-500/10 rounded-lg mr-4 border border-emerald-500/20">
                <Command className="w-5 h-5 text-emerald-400" />
              </div>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Введіть команду..."
                className="bg-transparent border-none outline-none text-white placeholder-slate-500 w-full text-xl font-bold tracking-tight"
              />
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-emerald-500/50 uppercase tracking-widest hidden md:block">System_Ready</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-lg ml-2 transition-colors"
                  title="Close command palette"
                  aria-label="Close command palette"
                >
                  <X className="w-4 h-4 text-slate-500 hover:text-white" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
              {filteredActions.length > 0 ? (
                filteredActions.map((action, index) => (
                  <button
                    key={action.id}
                    onClick={() => {
                      action.action();
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-4 rounded-xl transition-all text-left relative overflow-hidden group/item",
                      index === selectedIndex ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" : "text-slate-400 border border-transparent hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={cn(
                        "p-2 rounded-lg transition-colors duration-300",
                        index === selectedIndex ? "bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "bg-slate-800 text-slate-500 group-hover/item:bg-slate-700"
                      )}>
                        <action.icon className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm tracking-tight">{action.label}</span>
                        <span className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase opacity-0 group-hover/item:opacity-100 transition-opacity">Execute_Routine://{action.id}</span>
                      </div>
                    </div>
                    {index === selectedIndex && (
                      <motion.div layoutId="palette-active-glow" className="flex items-center gap-2 text-emerald-400 relative z-10">
                        <span className="text-[9px] font-mono font-black animate-pulse uppercase">Execute</span>
                        <ArrowRight className="w-4 h-4" />
                      </motion.div>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-slate-500">
                  Нічого не знайдено
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <div className="flex gap-4">
                <span className="flex items-center gap-1"><kbd className="bg-slate-800 px-1 rounded border border-slate-700">↑↓</kbd> Навігація</span>
                <span className="flex items-center gap-1"><kbd className="bg-slate-800 px-1 rounded border border-slate-700">↵</kbd> Вибрати</span>
              </div>
              <span className="tracking-wider opacity-50">PREDATOR AI</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
