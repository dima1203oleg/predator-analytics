/**
 * CommandPalette — Spotlight-стиль командний центр
 * v63.0-ELITE · Cmd+K · Sovereign navigation
 */
import { Button } from '@/components/ui/button';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Command, X, ArrowRight, Activity, Target,
  Shield, Globe, BarChart3, Brain, FileText, Users,
  Settings, AlertTriangle, Zap, Lock
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useUISound, UISoundType } from '@/hooks/useUISound';

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category: string;
}

const COMMANDS: CommandItem[] = [
  { id: 'dash', label: 'Дашборд Ризиків', description: 'Головна панель аналітики', icon: <BarChart3 size={18} />, shortcut: 'G D', category: 'Навігація', action: () => window.location.href = '/dashboard' },
  { id: 'entity', label: 'Пошук Контрагента', description: 'OSINT розвідка по ЄДР / Інтерпол', icon: <Search size={18} />, shortcut: 'G E', category: 'Навігація', action: () => window.location.href = '/search' },
  { id: 'graph', label: 'Граф Зв\'язків', description: 'Neo4j візуалізація мережі', icon: <Globe size={18} />, shortcut: 'G G', category: 'Навігація', action: () => window.location.href = '/graph' },
  { id: 'ai', label: 'PREDATOR AI', description: 'GLM-5.1 стратегічний аналіз', icon: <Brain size={18} />, shortcut: 'G A', category: 'Навігація', action: () => window.dispatchEvent(new CustomEvent('predator-toggle-copilot')) },
  { id: 'sanctions', label: 'Санкційний Скринінг', description: 'OFAC / ЄС / ООН / РНБО', icon: <Shield size={18} />, category: 'Розвідка', action: () => window.location.href = '/sanctions' },
  { id: 'aml', label: 'AML Скорінг', description: 'Оцінка ризику відмивання коштів', icon: <AlertTriangle size={18} />, category: 'Розвідка', action: () => window.location.href = '/aml' },
  { id: 'ubo', label: 'UBO Мапа', description: 'Кінцеві бенефіціари', icon: <Users size={18} />, category: 'Розвідка', action: () => window.location.href = '/ubo' },
  { id: 'supply', label: 'Ланцюг Постачання', description: 'Аналіз supply-chain', icon: <Activity size={18} />, category: 'Розвідка', action: () => window.location.href = '/supply-chain' },
  { id: 'reports', label: 'Звіти', description: 'Генерація розвідувальних звітів', icon: <FileText size={18} />, shortcut: 'G R', category: 'Робота', action: () => window.location.href = '/reports' },
  { id: 'settings', label: 'Налаштування', description: 'Профіль, мова, тема', icon: <Settings size={18} />, shortcut: 'G S', category: 'Система', action: () => window.location.href = '/settings' },
  { id: 'lock', label: 'Блокування Сеансу', description: 'Термінове блокування', icon: <Lock size={18} />, shortcut: '⌘ L', category: 'Система', action: () => window.location.href = '/logout' },
  { id: 'zap', label: 'Аварійний Стоп', description: 'Зупинити всі фонові процеси', icon: <Zap size={18} />, category: 'Система', action: () => window.dispatchEvent(new CustomEvent('predator-emergency-stop')) },
];

export const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { play } = useUISound();

  const filtered = useMemo(() => {
    if (!query.trim()) return COMMANDS;
    const q = query.toLowerCase();
    return COMMANDS.filter(
      c => c.label.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setOpen(p => { const next = !p; if (next) play(UISoundType.CLICK); return next; });
    }
    if (e.key === 'Escape') { setOpen(false); }
  }, [play]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const onPaletteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => (i + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = filtered[selectedIndex];
      if (item) { play(UISoundType.SUCCESS); item.action(); setOpen(false); setQuery(''); }
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setSelectedIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setSelectedIndex(filtered.length - 1);
    }
  };

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  // Групування по категоріях
  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    filtered.forEach(item => {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category)!.push(item);
    });
    return map;
  }, [filtered]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[300] flex items-start justify-center pt-[15vh]"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="command-palette-title"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="relative w-full max-w-[680px] bg-black/95 border border-rose-500/20 rounded-[2rem] shadow-[0_50px_150px_rgba(0,0,0,0.9)] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="flex items-center gap-4 px-6 py-5 border-b border-white/5">
              <Search size={20} className="text-rose-500/60" aria-hidden="true" />
              <input
                ref={inputRef}
                id="command-palette-input"
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={onPaletteKeyDown}
                placeholder="Введіть команду або перейдіть до розділу..."
                className="flex-1 bg-transparent text-white text-[15px] font-medium placeholder:text-slate-700 outline-none"
                autoComplete="off"
                aria-label="Пошук команд"
                aria-controls="command-list"
                aria-autocomplete="list"
              />
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] text-slate-500 font-mono">ESC</kbd>
                <Button variant="cyber" onClick={() => setOpen(false)} className="p-1 text-slate-600 hover:text-white transition-colors" aria-label="Закрити командний палітр">
                  <X size={18} aria-hidden="true" />
                </Button>
              </div>
            </div>

            {/* Results */}
            <div id="command-list" role="listbox" aria-label="Список команд" className="max-h-[50vh] overflow-y-auto p-3 space-y-3">
              {filtered.length === 0 ? (
                <div className="py-12 text-center" role="status" aria-live="polite">
                  <Command size={32} className="mx-auto text-slate-800 mb-3" aria-hidden="true" />
                  <p className="text-sm text-slate-600">Команду не знайдено</p>
                </div>
              ) : (
                Array.from(grouped.entries()).map(([category, items]) => (
                  <div key={category}>
                    <div className="px-3 py-2 text-[9px] font-black uppercase tracking-[0.3em] text-slate-700" role="presentation">{category}</div>
                    {items.map((item, idx) => {
                      const globalIdx = filtered.indexOf(item);
                      const isSelected = globalIdx === selectedIndex;
                      return (
                        <motion.button
                          key={item.id}
                          role="option"
                          aria-selected={isSelected}
                          onMouseEnter={() => { setSelectedIndex(globalIdx); play(UISoundType.HOVER, 100); }}
                          onClick={() => { play(UISoundType.SUCCESS); item.action(); setOpen(false); setQuery(''); }}
                          className={cn(
                            "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left group",
                            isSelected
                              ? "bg-rose-500/10 border border-rose-500/20"
                              : "border border-transparent hover:bg-white/[0.03]"
                          )}
                        >
                          <div className={cn(
                            "p-2 rounded-lg transition-colors",
                            isSelected ? "bg-rose-500/20 text-rose-500" : "bg-white/5 text-slate-500 group-hover:text-rose-500/60"
                          )} aria-hidden="true">
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={cn(
                              "text-[13px] font-bold truncate",
                              isSelected ? "text-white" : "text-slate-300"
                            )}>
                              {item.label}
                            </div>
                            <div className="text-[11px] text-slate-600 truncate">{item.description}</div>
                          </div>
                          {item.shortcut && (
                            <kbd className={cn(
                              "px-2 py-1 rounded-md text-[10px] font-mono border",
                              isSelected
                                ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                                : "bg-white/5 border-white/10 text-slate-600"
                            )}>
                              {item.shortcut}
                            </kbd>
                          )}
                          {isSelected && <ArrowRight size={14} className="text-rose-500" />}
                        </motion.button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-700">
              <div className="flex items-center gap-4">
                <span><kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 font-mono">↑↓</kbd> Навігація</span>
                <span><kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 font-mono">↵</kbd> Вибір</span>
              </div>
              <span className="font-mono tracking-wider">PREDATOR v63.0-ELITE</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
