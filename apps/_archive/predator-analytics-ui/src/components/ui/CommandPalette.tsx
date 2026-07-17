import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Command, Lock, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import {
  getAllVisibleNavigationItems,
  isNavItemLocked,
  type VisibleNavItem,
} from '../../config/navigation';
import { useRoleStore } from '../../store/useRoleStore';

const sectionEmoji: Record<string, string> = {
  'global-control': '🌐',
  'intelligence-sector': '🔭',
  'finance-sector': '💰',
  'supply-sector': '🚢',
  'geospatial-sector': '🗺',
  'compliance-sector': '⚖️',
  'cyber-sector': '🛡',
  'ai-core-sector': '🧠',
  'reports-sector': '📋',
  'alerts-sector': '🔔',
  'investigation-sector': '🕵',
  'system-core': '⚙️',
};

const sectionColor: Record<string, string> = {
  'global-control': '#38bdf8',
  'intelligence-sector': '#fbbf24',
  'finance-sector': '#34d399',
  'supply-sector': '#60a5fa',
  'geospatial-sector': '#818cf8',
  'compliance-sector': '#f43f5e',
  'cyber-sector': '#a78bfa',
  'ai-core-sector': '#22d3ee',
  'reports-sector': '#94a3b8',
  'alerts-sector': '#22d3ee',
  'investigation-sector': '#64748b',
  'system-core': '#f43f5e',
};

export const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const userRole = useRoleStore((state) => state.getRoleData().role);

  const allItems = useMemo(() => getAllVisibleNavigationItems(userRole), [userRole]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.sectionLabel.toLowerCase().includes(q),
    );
  }, [allItems, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, VisibleNavItem[]>();
    for (const item of filtered) {
      const list = map.get(item.sectionId) ?? [];
      list.push(item);
      map.set(item.sectionId, list);
    }
    return Array.from(map.entries()).map(([sectionId, items]) => ({ sectionId, items }));
  }, [filtered]);

  const flatItems = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % flatItems.length);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + flatItems.length) % flatItems.length);
      }
      if (e.key === 'Enter' && flatItems[selectedIndex]) {
        e.preventDefault();
        const item = flatItems[selectedIndex];
        if (!isNavItemLocked(item, userRole)) {
          navigate(item.path);
          setIsOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, flatItems, selectedIndex, navigate, userRole]);

  const scrollSelectedIntoView = useCallback(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedIndex]);

  useEffect(() => {
    scrollSelectedIntoView();
  }, [scrollSelectedIntoView]);

  let globalIndex = 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl"
            style={{
              background: 'rgba(15, 18, 25, 0.95)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 40px rgba(225,29,72,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Scan-line overlay */}
            <div className="pointer-events-none absolute inset-0 opacity-20">
              <div
                className="absolute inset-0"
                style={{
                  background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
                }}
              />
            </div>

            {/* Header */}
            <div className="relative flex items-center gap-3 border-b px-4 py-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <Search className="h-4 w-4 text-slate-500" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Пошук модулів, розділів, інструментів..."
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
              />
              <div className="flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5">
                <Command className="h-3 w-3 text-slate-500" />
                <span className="text-[10px] font-bold text-slate-500">K</span>
              </div>
              <Button variant="cyber"
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                title="Закрити"
                aria-label="Закрити"
              >
                <X className="w-4 h-4 text-slate-500 hover:text-white" />
              </Button>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2 scrollbar-dark">
              {grouped.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="text-sm font-bold text-slate-400">Нічого не знайдено</div>
                  <p className="mt-1 text-xs text-slate-600">Спробуйте інший запит</p>
                </div>
              ) : (
                grouped.map((group) => {
                  const color = sectionColor[group.sectionId] ?? '#64748b';
                  const emoji = sectionEmoji[group.sectionId] ?? '•';
                  return (
                    <div key={group.sectionId} className="mb-2">
                      <div
                        className="mb-1 flex items-center gap-2 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em]"
                        style={{ color }}
                      >
                        <span>{emoji}</span>
                        <span>{group.items[0]?.sectionLabel ?? group.sectionId}</span>
                        <span className="ml-auto text-[9px] opacity-50">{group.items.length}</span>
                      </div>
                      <div className="space-y-0.5">
                        {group.items.map((item) => {
                          const idx = globalIndex++;
                          const isSelected = idx === selectedIndex;
                          const locked = isNavItemLocked(item, userRole);
                          return (
                            <Button variant="cyber"
                              key={item.id}
                              data-index={idx}
                              type="button"
                              onClick={() => {
                                if (!locked) {
                                  navigate(item.path);
                                  setIsOpen(false);
                                }
                              }}
                              onMouseEnter={() => setSelectedIndex(idx)}
                              className={cn(
                                'group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-all',
                                isSelected
                                  ? 'text-white'
                                  : 'text-slate-300 hover:bg-white/[0.04] hover:text-white',
                              )}
                              style={{
                                background: isSelected ? `${color}15` : 'transparent',
                                border: isSelected ? `1px solid ${color}30` : '1px solid transparent',
                                boxShadow: isSelected ? `0 0 16px ${color}15` : 'none',
                                cursor: locked ? 'not-allowed' : 'pointer',
                                opacity: locked ? 0.5 : 1,
                              }}
                            >
                              <item.icon
                                className="h-4 w-4 shrink-0"
                                style={{ color: isSelected ? color : '#64748b' }}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="truncate text-xs font-bold">{item.label}</span>
                                  {locked && <Lock className="h-3 w-3 shrink-0 text-rose-400" />}
                                  {item.badge && (
                                    <span
                                      className="shrink-0 rounded-full border px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.1em]"
                                      style={{
                                        background: `${color}15`,
                                        borderColor: `${color}30`,
                                        color,
                                      }}
                                    >
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-0.5 truncate text-[10px] text-slate-600">{item.description}</p>
                              </div>
                              {isSelected && (
                                <ArrowRight className="h-3.5 w-3.5 shrink-0" style={{ color }} />
                              )}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between border-t px-4 py-2 text-[9px] text-slate-600"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-3">
                <span>
                  <kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1 py-0.5 font-mono text-[8px] text-slate-500">↑↓</kbd> навігація
                </span>
                <span>
                  <kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1 py-0.5 font-mono text-[8px] text-slate-500">Enter</kbd> вибір
                </span>
              </div>
              <span>
                <kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1 py-0.5 font-mono text-[8px] text-slate-500">Esc</kbd> закрити
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
