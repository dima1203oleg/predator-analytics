/**
 * 💻 TerminalCommandBar — Military Terminal Command Palette
- Prompt: `PREDATOR:~$` з blinking cursor
- Suggestions з fuzzy match highlighting
- Global search / command для всього додатку
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Terminal, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Command {
  id: string;
  label: string;
  shortcut?: string;
  action: () => void;
  category?: string;
}

interface TerminalCommandBarProps {
  commands: Command[];
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const TerminalCommandBar: React.FC<TerminalCommandBarProps> = ({
  commands,
  isOpen,
  onClose,
  className,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Blinking cursor
  useEffect(() => {
    const interval = setInterval(() => setShowCursor((prev) => !prev), 500);
    return () => clearInterval(interval);
  }, []);

  // Focus input when open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Filter commands
  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  // Reset selection on query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
      filteredCommands[selectedIndex].action();
      onClose();
      setQuery('');
    } else if (e.key === 'Escape') {
      onClose();
      setQuery('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Terminal panel */}
          <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[20vh] p-4">
            <motion.div
              className={cn(
                'w-full max-w-2xl glass-obsidian rounded-xl overflow-hidden',
                className
              )}
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              {/* Input area */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-white/[0.04]">
                <Terminal className="w-4 h-4 text-[#c9a227]" />
                <span className="font-display text-sm text-[#5a5a5a]">PREDATOR:~$</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Введіть команду або пошук..."
                  className="flex-1 bg-transparent font-data text-sm text-[#e8e8e8] placeholder:text-[#3a3a3a] outline-none"
                />
                {/* Blinking cursor */}
                <span
                  className={cn(
                    'w-0.5 h-4 bg-[#c9a227] inline-block',
                    showCursor ? 'opacity-100' : 'opacity-0'
                  )}
                />
              </div>

              {/* Commands list */}
              <div className="max-h-80 overflow-y-auto scrollbar-hide">
                {filteredCommands.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Search className="w-8 h-8 mx-auto text-[#3a3a3a] mb-2" />
                    <p className="font-interface text-sm text-[#5a5a5a]">Команд не знайдено</p>
                  </div>
                ) : (
                  <div className="py-2">
                    {filteredCommands.map((cmd, index) => (
                      <motion.button
                        key={cmd.id}
                        onClick={() => {
                          cmd.action();
                          onClose();
                          setQuery('');
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 transition-colors',
                          index === selectedIndex
                            ? 'bg-white/[0.05] border-l-2 border-[#c9a227]'
                            : 'hover:bg-white/[0.02] border-l-2 border-transparent'
                        )}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-[#5a5a5a]" />
                        <span className="flex-1 text-left font-interface text-sm text-[#e8e8e8]">
                          {cmd.label}
                        </span>
                        {cmd.shortcut && (
                          <span className="font-display text-xs text-[#5a5a5a]">
                            {cmd.shortcut}
                          </span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-white/[0.04] flex items-center justify-between">
                <span className="font-display text-[10px] text-[#3a3a3a]">
                  {filteredCommands.length} команд
                </span>
                <span className="font-display text-[10px] text-[#3a3a3a]">
                  ↑↓ для навігації • Enter для вибору • Esc для закриття
                </span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TerminalCommandBar;
