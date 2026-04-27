/**
 * 🐧 GeminiTerminal — PREDATOR x Gemini CLI Ubuntu Bridge
 * Емуляція потужного терміналу Gemini для розробників.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Cpu, Zap, Globe, Package, Github } from 'lucide-react';
import { cn } from '@/utils/cn';

export function GeminiTerminal() {
  const [history, setHistory] = useState<string[]>([
    'ubuntu@predator:~$ gemini login',
    'Success! Authenticated as dima@google-workspace.ua',
    'Limits: 1,000 requests/day, 60 RPM (Free Tier)',
    'ubuntu@predator:~$ gemini analyze @src/features/factory'
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input) return;

    const newHistory = [...history, `ubuntu@predator:~$ ${input}`];
    
    // Проста логіка відповідей
    if (input.includes('analyze')) {
      newHistory.push('AI_GEMINI: Починаю аналіз кодової бази... [Контекст: 45.2k токенів]');
      newHistory.push('DONE: Знайдено 2 потенційні оптимізації в архітектурі каскадів.');
    } else if (input.includes('status')) {
      newHistory.push('GEMINI_CLI: v2.5.0-PRO | Node: 23.x | Latency: 42ms');
    } else {
      newHistory.push(`GEMINI_CLI: Команда "${input}" прийнята до обробки.`);
    }

    setHistory(newHistory);
    setInput('');
  };

  return (
    <div className="rounded-[32px] border border-[#300a24]/50 bg-[#300a24] shadow-2xl overflow-hidden flex flex-col h-[450px]">
      {/* Ubuntu Title Bar */}
      <div className="bg-gradient-to-r from-[#5e2750] to-[#300a24] p-3 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#f1f1f1]/20" />
            <div className="w-3 h-3 rounded-full bg-[#f1f1f1]/20" />
            <div className="w-3 h-3 rounded-full bg-[#f1f1f1]/20" />
          </div>
          <span className="text-[10px] font-bold text-white/80 font-mono tracking-tight">ubuntu@predator: ~/factory</span>
        </div>
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-[#e95420]" />
          <span className="text-[9px] font-black text-[#e95420] uppercase tracking-widest">Gemini CLI Active</span>
        </div>
      </div>

      {/* Terminal Content */}
      <div 
        ref={scrollRef}
        className="flex-1 p-6 font-mono text-[11px] overflow-y-auto scrollbar-hide bg-[#300a24]/80 backdrop-blur-sm"
      >
        <div className="space-y-1.5">
          {history.map((line, i) => (
            <div key={i} className={cn(
              line.startsWith('AI_GEMINI') ? "text-emerald-400 font-bold" : 
              line.startsWith('ubuntu') ? "text-white" : "text-slate-400 italic"
            )}>
              {line}
            </div>
          ))}
          <form onSubmit={handleCommand} className="flex items-center gap-2 pt-2">
            <span className="text-[#87ff5f]">ubuntu@predator:~$</span>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-white focus:ring-0 p-0"
              placeholder="Введіть команду або @файл..."
              autoFocus
            />
          </form>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="p-3 bg-black/20 border-t border-white/5 flex items-center justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest">
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><Cpu size={10} /> Node v23.x</span>
          <span className="flex items-center gap-1"><Zap size={10} /> 1.5M Context</span>
        </div>
        <div className="flex items-center gap-1 text-[#e95420]">
          <Globe size={10} /> Global Node Instance
        </div>
      </div>
    </div>
  );
}
