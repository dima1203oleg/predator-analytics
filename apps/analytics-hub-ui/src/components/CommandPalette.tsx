import React, { useState, useEffect, useRef } from 'react';
import { Search, Server, Shield, Brain, FileText, ChevronRight, CornerDownLeft, Globe, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CommandPaletteProps {
  onNavigate?: (tabId: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const commands = [
    { id: 'dashboard', label: 'Головна (Dashboard)', category: 'Навігація', icon: Server, action: () => onNavigate?.('dashboard') },
    { id: 'osint', label: 'OSINT Workbench', category: 'Аналітика', icon: Globe, action: () => onNavigate?.('osint') },
    { id: 'dossier', label: 'Зібрати Досьє (DIE)', category: 'Інструменти', icon: FileText, action: () => onNavigate?.('dossier') },
    { id: 'copilot', label: 'Викликати Copilot', category: 'ШІ', icon: Brain, action: () => { document.getElementById('copilot-trigger')?.click(); } },
    { id: 'map', label: 'Гео-Аналітика', category: 'Навігація', icon: Map, action: () => onNavigate?.('maps') },
    { id: 'admin', label: 'Адміністрування', category: 'Система', icon: Shield, action: () => onNavigate?.('admin') },
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(query.toLowerCase()) || 
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredCommands[selectedIndex];
      if (selected) {
        selected.action();
        setIsOpen(false);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[999]"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed left-1/2 top-[15vh] -translate-x-1/2 w-full max-w-2xl bg-slate-950/90 border border-slate-800 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] z-[1000] overflow-hidden"
          >
            <div className="flex items-center px-4 py-4 border-b border-slate-800">
              <Search className="w-5 h-5 text-slate-400 mr-3" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Введіть команду або шукайте... (Cmd + K)"
                className="flex-1 bg-transparent border-none text-slate-200 placeholder-slate-500 focus:outline-none text-lg"
              />
              <div className="flex gap-1 text-[10px] font-mono font-bold text-slate-500">
                <span className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">ESC</span>
                <span className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">щоб закрити</span>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
              {filteredCommands.length === 0 ? (
                <div className="py-10 text-center text-slate-500 font-mono text-sm">
                  Нічого не знайдено для "{query}"
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredCommands.map((cmd, idx) => {
                    const isSelected = idx === selectedIndex;
                    const Icon = cmd.icon;
                    return (
                      <div
                        key={cmd.id}
                        onClick={() => {
                          cmd.action();
                          setIsOpen(false);
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex items-center px-4 py-3 rounded-xl cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-600/20 border border-indigo-500/30' : 'hover:bg-slate-900/50 border border-transparent'
                        }`}
                      >
                        <div className={`p-2 rounded-lg mr-4 ${isSelected ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-900 text-slate-400'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${isSelected ? 'text-indigo-300' : 'text-slate-300'}`}>
                            {cmd.label}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-0.5">
                            {cmd.category}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="flex items-center text-indigo-400 text-[10px] font-mono gap-1">
                            <span>ENTER</span>
                            <CornerDownLeft className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/50 flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="border border-slate-700 bg-slate-900 rounded px-1">↑</span><span className="border border-slate-700 bg-slate-900 rounded px-1">↓</span> навігація</span>
                <span className="flex items-center gap-1"><span className="border border-slate-700 bg-slate-900 rounded px-1">↵</span> вибір</span>
              </div>
              <div>PREDATOR SYNTHETIC KNOWLEDGE ENV v57.0</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
