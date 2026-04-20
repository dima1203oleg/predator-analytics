import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Command,
  Search,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useUser } from '@/context/UserContext';
import { shellCommandPaletteOpenAtom } from '@/store/atoms';
import { useShellWorkspace } from '@/hooks/useShellWorkspace';
import { resolveCommandPaletteEntries } from './shellPalette.providers';
import type { CommandPaletteEntry } from '@/types/shell';

export const ShellCommandPalette: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const role = user?.role ?? 'viewer';
  const [isOpen, setIsOpen] = useAtom(shellCommandPaletteOpenAtom);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [entries, setEntries] = useState<CommandPaletteEntry[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const {
    favoriteIds,
    recentIds,
    visibleItems,
    recommendedItems,
    pushRecent,
  } = useShellWorkspace(role);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsOpen]);

  useEffect(() => {
    void resolveCommandPaletteEntries({
      visibleItems,
      recommendedItems,
      favoriteIds,
      recentIds,
    }).then(setEntries);
  }, [favoriteIds, recentIds, recommendedItems, visibleItems]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      return;
    }

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 30);

    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return entries;
    }

    return entries.filter((entry) => {
      const haystack = [entry.label, entry.subtitle, entry.source, ...entry.keywords]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [entries, query]);

  const handleSelectEntry = useCallback((entry: CommandPaletteEntry) => {
    if (entry.path) {
      navigate(entry.path);

      const matchedItem = visibleItems.find((item) => item.path === entry.path || item.id === entry.id);
      if (matchedItem) {
        pushRecent(matchedItem.id);
      }
    }

    setIsOpen(false);
  }, [navigate, pushRecent, setIsOpen, visibleItems]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        return;
      }

      if (filteredEntries.length === 0) {
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((current) => (current + 1) % filteredEntries.length);
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((current) => (current - 1 + filteredEntries.length) % filteredEntries.length);
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        const selectedEntry = filteredEntries[selectedIndex];
        if (selectedEntry) {
          handleSelectEntry(selectedEntry);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredEntries, handleSelectEntry, isOpen, selectedIndex, setIsOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, setIsOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          data-testid="shell-command-palette"
          className="fixed inset-0 z-[120] flex items-start justify-center px-4 pt-[12vh]"
        >
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-slate-950/86 backdrop-blur-md"
            aria-label="Закрити командний пошук"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -18 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="surface-panel-strong relative z-10 w-full max-w-3xl overflow-hidden rounded-[32px] border border-white/10 shadow-[0_30px_80px_rgba(2,6,23,0.55)]"
          >
            <div className="flex items-center gap-4 border-b border-white/[0.06] px-5 py-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-cyan-400/20 bg-cyan-500/10 text-cyan-200">
                <Search className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
                  Глобальний командний пошук
                </div>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Маршрут, сутність, рекомендація або дія..."
                  className="mt-2 w-full bg-transparent text-lg font-semibold text-white outline-none placeholder:text-slate-600"
                  autoComplete="off"
                />
              </div>
              <div className="hidden items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] text-slate-400 sm:flex">
                <Command className="h-3.5 w-3.5" />
                <span>K</span>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-3 py-3 custom-scrollbar">
              {filteredEntries.length > 0 ? (
                <div className="space-y-1.5">
                  {filteredEntries.map((entry, index) => {
                    const Icon = entry.icon;
                    const isSelected = index === selectedIndex;

                    return (
                      <button
                        key={`${entry.kind}-${entry.id}`}
                        type="button"
                        data-testid={`palette-entry-${entry.id}`}
                        onClick={() => handleSelectEntry(entry)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={cn(
                          'flex w-full items-center justify-between gap-4 rounded-[24px] border px-4 py-4 text-left transition-all',
                          isSelected
                            ? 'border-cyan-400/20 bg-cyan-500/10 text-white'
                            : 'border-transparent bg-transparent text-slate-300 hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-white',
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <div
                            className={cn(
                              'flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border',
                              isSelected ? 'border-cyan-400/20 bg-cyan-500/10' : 'border-white/[0.08] bg-black/20',
                            )}
                          >
                            <Icon className={cn('h-5 w-5', isSelected ? 'text-cyan-200' : 'text-slate-400')} />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-bold">{entry.label}</div>
                            <div className="mt-1 truncate text-xs text-slate-500">{entry.subtitle}</div>
                            <div className="mt-2 inline-flex rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                              {entry.source}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className={cn('h-4 w-4 shrink-0', isSelected ? 'text-cyan-200' : 'text-slate-600')} />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/[0.08] bg-white/[0.03] text-slate-500">
                    <Terminal className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Нічого не знайдено</div>
                    <div className="mt-1 text-xs text-slate-500">
                      Спробуйте назву модуля, маршрут, рольовий сценарій або дію ШІ.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3 text-[11px] text-slate-500">
              <div className="flex items-center gap-4">
                <span>
                  <span className="text-slate-300">↑↓</span> вибір
                </span>
                <span>
                  <span className="text-slate-300">↵</span> перехід
                </span>
                <span>
                  <span className="text-slate-300">Esc</span> закрити
                </span>
              </div>
              <div className="inline-flex items-center gap-2 text-slate-400">
                <Sparkles className="h-3.5 w-3.5" />
                Shell v58.2-WRAITH
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ShellCommandPalette;
