/**
 * CommandPaletteAI — Глобальна палітра команд AI (Ctrl+K / Cmd+K)
 * Доступна з будь-якої сторінки застосунку.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Shield, Network, AlertTriangle, FileText,
  TrendingUp, Zap, Map, Users, Sparkles, Database,
  BarChart2, ChevronRight, X
} from 'lucide-react';
import { SLASH_COMMANDS } from './SlashCommands';

interface CommandItem {
  id: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
  keywords?: string[];
}

interface CommandPaletteAIProps {
  onRunAICommand?: (prompt: string) => void;
}

export const CommandPaletteAI: React.FC<CommandPaletteAIProps> = ({ onRunAICommand }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // ─── Команди навігації ───────────────────────────────────────────────────
  const navCommands: CommandItem[] = [
    {
      id: 'nav-dashboard', label: 'Головна панель', desc: 'Перейти до Dashboard',
      icon: <BarChart2 size={15} className="text-blue-400" />,
      action: () => navigate('/dashboard'), category: 'Навігація'
    },
    {
      id: 'nav-osint', label: 'OSINT Workbench', desc: 'Пошук та аналіз компаній',
      icon: <Search size={15} className="text-cyan-400" />,
      action: () => navigate('/admin/osint'), category: 'Навігація'
    },
    {
      id: 'nav-graph', label: 'Граф Зв\'язків', desc: 'Neo4j граф власності та звязків',
      icon: <Network size={15} className="text-purple-400" />,
      action: () => navigate('/predator'), category: 'Навігація'
    },
    {
      id: 'nav-analytics', label: 'Аналітичний Хаб', desc: 'Розширена аналітика',
      icon: <BarChart2 size={15} className="text-emerald-400" />,
      action: () => navigate('/analytics'), category: 'Навігація'
    },
    {
      id: 'nav-ai-studio', label: 'AI Studio', desc: 'Чат з PREDATOR Copilot',
      icon: <Sparkles size={15} className="text-violet-400" />,
      action: () => navigate('/ai-studio'), category: 'Навігація'
    },
    {
      id: 'nav-risk', label: 'Ризик Монітор', desc: 'Перегляд ризиків та алертів',
      icon: <AlertTriangle size={15} className="text-amber-400" />,
      action: () => navigate('/admin/security'), category: 'Навігація'
    },
  ];

  // ─── AI Команди (з SlashCommands.tsx) ────────────────────────────────────
  const aiCommands: CommandItem[] = SLASH_COMMANDS.map(cmd => ({
    id: `ai-${cmd.trigger}`,
    label: cmd.title,
    desc: cmd.desc,
    icon: cmd.icon,
    action: () => {
      navigate('/ai-studio');
      // Передаємо команду у AI Studio
      if (onRunAICommand) {
        const placeholder = cmd.argHint ? `${cmd.trigger} ${cmd.argHint}` : cmd.trigger;
        onRunAICommand(cmd.trigger + ' ');
      }
    },
    category: 'AI Аналіз',
    keywords: [cmd.trigger],
  }));

  const allCommands = [...navCommands, ...aiCommands];

  // ─── Фільтрація ───────────────────────────────────────────────────────────
  const filtered = query
    ? allCommands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.desc.toLowerCase().includes(query.toLowerCase()) ||
        (c.keywords || []).some(k => k.toLowerCase().includes(query.toLowerCase()))
      )
    : allCommands;

  // Групування
  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  // ─── Клавіатурний хендлер ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(o => !o);
        setQuery('');
        setSelected(0);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
    setSelected(0);
  }, [isOpen, query]);

  // Навігація по стрілках
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selected]) { filtered[selected].action(); setIsOpen(false); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, filtered, selected]);

  const handleSelect = useCallback((cmd: CommandItem) => {
    cmd.action();
    setIsOpen(false);
    setQuery('');
  }, []);

  let flatIndex = 0;

  return (
    <>
      {/* ─── Тригер-підказка (показується у шапці) ─────────────────────── */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition-all"
        title="Відкрити командну палітру (Ctrl+K)"
      >
        <Sparkles size={12} className="text-violet-400" />
        <span className="font-mono">AI Команди</span>
        <kbd className="ml-1 px-1 py-0.5 bg-slate-800 border border-white/10 rounded text-[9px] font-mono text-slate-500">Ctrl+K</kbd>
      </button>

      {/* ─── Модальне вікно ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            />

            {/* Palette */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -20 }}
              transition={{ duration: 0.15 }}
              className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-[201] px-4"
            >
              <div className="bg-slate-900/98 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden">

                {/* Поле пошуку */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                  <Sparkles size={16} className="text-cyan-400 shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => { setQuery(e.target.value); setSelected(0); }}
                    placeholder="Пошук команд або навігація..."
                    className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-500 outline-none font-mono"
                  />
                  {query && (
                    <button onClick={() => setQuery('')} className="text-slate-600 hover:text-slate-400 transition-colors">
                      <X size={14} />
                    </button>
                  )}
                  <kbd className="px-2 py-0.5 bg-slate-800 border border-white/10 rounded text-[10px] font-mono text-slate-500">Esc</kbd>
                </div>

                {/* Результати */}
                <div className="max-h-[60vh] overflow-y-auto py-2">
                  {filtered.length === 0 ? (
                    <div className="px-4 py-8 text-center text-slate-500 text-sm">
                      Нічого не знайдено
                    </div>
                  ) : (
                    Object.entries(grouped).map(([category, cmds]) => (
                      <div key={category}>
                        <div className="px-4 py-1.5">
                          <span className="text-[10px] uppercase tracking-widest text-slate-600 font-mono">{category}</span>
                        </div>
                        {cmds.map(cmd => {
                          const idx = flatIndex++;
                          return (
                            <button
                              key={cmd.id}
                              onClick={() => handleSelect(cmd)}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all ${
                                idx === selected
                                  ? 'bg-cyan-500/15 border-l-2 border-cyan-500'
                                  : 'hover:bg-white/5 border-l-2 border-transparent'
                              }`}
                            >
                              <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 shrink-0">
                                {cmd.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-slate-200 font-medium">{cmd.label}</div>
                                <div className="text-[11px] text-slate-500 truncate">{cmd.desc}</div>
                              </div>
                              <ChevronRight size={13} className={`shrink-0 transition-colors ${idx === selected ? 'text-cyan-400' : 'text-slate-700'}`} />
                            </button>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3 px-4 py-2 border-t border-white/5 bg-slate-950/50">
                  <span className="text-[9px] text-slate-600 font-mono flex items-center gap-2">
                    <span>↑↓ навігація</span>
                    <span>·</span>
                    <span>Enter — відкрити</span>
                    <span>·</span>
                    <span>Esc — закрити</span>
                  </span>
                  <span className="ml-auto text-[9px] text-slate-700 font-mono">{filtered.length} команд</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
