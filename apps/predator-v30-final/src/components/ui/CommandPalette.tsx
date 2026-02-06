import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Command, Home, Radio, TrendingUp,
  BarChart2, FileText, Settings, Shield, X, ArrowRight,
  BrainCircuit, Ship
} from 'lucide-react';
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
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/50  relative z-10"
          >
            {/* Header */}
            <div className="flex items-center px-4 py-3 border-b border-slate-800">
              <Command className="w-5 h-5 text-slate-500 mr-3" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Введіть команду..."
                className="bg-transparent border-none outline-none text-slate-200 placeholder-slate-500 w-full text-lg font-medium"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-800 rounded ml-2"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
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
                      "w-full flex items-center justify-between px-3 py-3 rounded-lg transition-colors text-left",
                      index === selectedIndex ? "bg-emerald-500/10 text-emerald-400" : "text-slate-300 hover:bg-slate-800"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <action.icon className={cn("w-5 h-5", index === selectedIndex ? "text-emerald-500" : "text-slate-500")} />
                      <span className="font-medium">{action.label}</span>
                    </div>
                    {index === selectedIndex && (
                        <ArrowRight className="w-4 h-4 opacity-50" />
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
