
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Command, Search, FileText, Brain, Settings, Users,
  BarChart3, Shield, Zap, Database, ChevronRight,
  Sparkles, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { premiumLocales } from '../../locales/uk/premium';

interface QuickAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  description?: string;
  shortcut?: string;
  category: 'navigation' | 'recent';
  path?: string;
  action?: () => void;
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentActions, setRecentActions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Cast to any for locale access
  const locales = premiumLocales as any;

  const quickActions: QuickAction[] = [
    { id: 'dashboard', icon: <BarChart3 size={18} />, label: locales.commandPalette.actions.dashboard.label, description: locales.commandPalette.actions.dashboard.desc, shortcut: 'D', category: 'navigation', path: '/' },
    { id: 'documents', icon: <FileText size={18} />, label: locales.commandPalette.actions.documents.label, description: locales.commandPalette.actions.documents.desc, shortcut: 'O', category: 'navigation', path: '/documents' },
    { id: 'analytics', icon: <Brain size={18} />, label: locales.commandPalette.actions.analytics.label, description: locales.commandPalette.actions.analytics.desc, shortcut: 'A', category: 'navigation', path: '/analytics' },
    { id: 'search', icon: <Search size={18} />, label: locales.commandPalette.actions.search.label, description: locales.commandPalette.actions.search.desc, shortcut: 'S', category: 'navigation', path: '/search' },
    { id: 'security', icon: <Shield size={18} />, label: locales.commandPalette.actions.security.label, description: locales.commandPalette.actions.security.desc, category: 'navigation', path: '/security' },
    { id: 'monitoring', icon: <Zap size={18} />, label: locales.commandPalette.actions.monitoring.label, description: locales.commandPalette.actions.monitoring.desc, shortcut: 'M', category: 'navigation', path: '/monitoring' },
    { id: 'databases', icon: <Database size={18} />, label: locales.commandPalette.actions.databases.label, description: locales.commandPalette.actions.databases.desc, category: 'navigation', path: '/databases' },
    { id: 'settings', icon: <Settings size={18} />, label: locales.commandPalette.actions.settings.label, description: locales.commandPalette.actions.settings.desc, shortcut: ',', category: 'navigation', path: '/settings' },
    { id: 'agents', icon: <Users size={18} />, label: locales.commandPalette.actions.agents.label, description: locales.commandPalette.actions.agents.desc, category: 'navigation', path: '/agents' },
  ];

  // Load recent actions from localStorage
  useEffect(() => {
    // Storage може бути заблокований у деяких режимах браузера
    let stored: string | null = null;
    try {
      stored = localStorage.getItem('predator_recent_actions');
    } catch {
      stored = null;
    }
    if (stored) {
      try {
        setRecentActions(JSON.parse(stored));
      } catch { }
    }
  }, []);

  // Keyboard shortcut to open (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Filter actions based on query
  const filteredActions = quickActions.filter(action => {
    if (!query) return true;
    const searchString = `${action.label} ${action.description || ''}`.toLowerCase();
    return searchString.includes(query.toLowerCase());
  });

  // Handle action execution
  const executeAction = useCallback((action: QuickAction) => {
    const newRecent = [action.id, ...recentActions.filter(id => id !== action.id)].slice(0, 5);
    setRecentActions(newRecent);
    try {
      localStorage.setItem('predator_recent_actions', JSON.stringify(newRecent));
    } catch {
      // no-op
    }

    if (action.path) {
      navigate(action.path);
    } else if (action.action) {
      action.action();
    }
    setIsOpen(false);
  }, [navigate, recentActions]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredActions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filteredActions.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredActions[selectedIndex]) {
            executeAction(filteredActions[selectedIndex]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredActions, selectedIndex, executeAction]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        title={locales.commandPalette.trigger}
        className="fixed bottom-24 left-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900/90 hover:bg-slate-800/90 border border-white/10 hover:border-indigo-500/30 rounded-2xl backdrop-blur-xl shadow-2xl transition-all group"
      >
        <Command size={16} className="text-indigo-400" />
        <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">
          {locales.commandPalette.trigger}
        </span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 px-2 py-1 bg-slate-800 rounded-lg text-[9px] font-mono text-slate-500 border border-white/5">
          ⌘K
        </kbd>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl z-[9999]"
            >
              <div className="bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden">
                <div className="flex items-center gap-4 px-5 py-4 border-b border-white/5">
                  <Search size={18} className="text-indigo-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={locales.commandPalette.placeholder}
                    className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm"
                  />
                  <button
                    onClick={() => setIsOpen(false)}
                    title={locales.commandPalette.footer.close}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X size={16} className="text-slate-500" />
                  </button>
                </div>

                <div className="max-h-[400px] overflow-y-auto p-2">
                  {filteredActions.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Search size={24} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">{locales.commandPalette.noResults}</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredActions.map((action, index) => (
                        <button
                          key={action.id}
                          onClick={() => executeAction(action)}
                          title={action.label}
                          className={cn(
                            'w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left group',
                            selectedIndex === index
                              ? 'bg-indigo-500/20 border border-indigo-500/30'
                              : 'hover:bg-white/5 border border-transparent'
                          )}
                        >
                          <div className={cn(
                            'p-2 rounded-lg transition-colors',
                            selectedIndex === index
                              ? 'bg-indigo-500/20 text-indigo-400'
                              : 'bg-slate-800 text-slate-400 group-hover:text-white'
                          )}>
                            {action.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">{action.label}</span>
                              {recentActions.includes(action.id) && (
                                <span className="text-[8px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                  {locales.commandPalette.recent}
                                </span>
                              )}
                            </div>
                            {action.description && (
                              <p className="text-xs text-slate-500 truncate">{action.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {action.shortcut && (
                              <kbd className="px-2 py-1 bg-slate-800 rounded-lg text-[9px] font-mono text-slate-500 border border-white/5">
                                {action.shortcut}
                              </kbd>
                            )}
                            <ChevronRight size={14} className={cn(
                              'text-slate-600 transition-transform',
                              selectedIndex === index && 'text-indigo-400 translate-x-1'
                            )} />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between text-[9px] text-slate-600 font-mono uppercase tracking-widest">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-white/5">↑↓</kbd>
                      {locales.commandPalette.footer.nav}
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-white/5">↵</kbd>
                      {locales.commandPalette.footer.select}
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-white/5">esc</kbd>
                      {locales.commandPalette.footer.close}
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <Sparkles size={10} className="text-indigo-400" />
                    PREDATOR COMMAND
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default CommandPalette;
