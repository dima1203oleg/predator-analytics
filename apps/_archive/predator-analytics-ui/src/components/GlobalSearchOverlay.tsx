import { Button } from '@/components/ui/button';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, ArrowRight, Building2, Package, FileText, Zap, X } from 'lucide-react';
import { cn } from '../utils/cn';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  type: 'company' | 'product' | 'report' | 'insight';
  title: string;
  subtitle: string;
  link?: string;
  score?: number;
  latency_ms?: number;
}

export const GlobalSearchOverlay: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  // const navigate = useNavigate(); // Assuming Router context exists, but simple link simulation is safer here

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Real Search Logic via Federation API
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const abortController = new AbortController();

    const fetchResults = async () => {
      try {
        const response = await fetch(`http://localhost:8002/api/v1/search?query=${encodeURIComponent(query)}&limit=10`, {
          signal: abortController.signal
        });
        
        if (!response.ok) throw new Error('Search failed');
        
        const data = await response.json();
        
        const mappedResults: SearchResult[] = data.results.map((r: any, idx: number) => {
          let type: 'company' | 'product' | 'report' | 'insight' = 'company';
          if (r.source === 'clickhouse') type = 'report';
          if (r.source === 'opensearch' || r.source === 'qdrant') type = 'insight';
          
          return {
            id: `res_${idx}_${r.source}`,
            type,
            title: r.data.name || r.data.title || `Result from ${r.source}`,
            subtitle: `Score: ${(r.score || 0).toFixed(2)} • Latency: ${(r.latency_ms || 0).toFixed(0)}ms`,
            score: r.score,
            latency_ms: r.latency_ms
          };
        });
        
        setResults(mappedResults);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error('Federation Search Error:', err);
      }
    };

    const timeoutId = setTimeout(fetchResults, 300); // 300ms debounce
    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [query]);

  // Key handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 "
      />

      {/* Search Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative z-10"
      >
        <div className="flex items-center px-4 py-4 border-b border-white/5 bg-white/5">
          <Search className="text-slate-400 mr-3" size={20} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Пошук компаній, товарів, схем... (Спробуйте 'ТОВ', 'Дрони')"
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-slate-500 text-lg font-medium"
          />
          <div className="flex items-center gap-2">
            <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded bg-white/10 text-[10px] text-slate-400 font-mono border border-white/5">
              ESC
            </kbd>
            <Button variant="cyber" onClick={onClose} aria-label="Close Search" className="p-1 hover:bg-white/10 rounded-lg transition-colors">
              <X className="text-slate-400 hover:text-white" size={20} />
            </Button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {results.length > 0 ? (
             <div className="space-y-1">
               {results.map((result) => (
                 <motion.button
                   key={result.id}
                   whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                   className="w-full flex items-center gap-4 p-3 rounded-xl text-left group transition-colors"
                 >
                   <div className={cn(
                     "p-2.5 rounded-lg border border-white/5",
                     result.type === 'company' && "bg-blue-500/20 text-blue-400",
                     result.type === 'product' && "bg-emerald-500/20 text-emerald-400",
                     result.type === 'insight' && "bg-amber-500/20 text-amber-400",
                     result.type === 'report' && "bg-purple-500/20 text-purple-400",
                   )}>
                     {result.type === 'company' && <Building2 size={18} />}
                     {result.type === 'product' && <Package size={18} />}
                     {result.type === 'insight' && <Zap size={18} />}
                     {result.type === 'report' && <FileText size={18} />}
                   </div>

                   <div className="flex-1">
                     <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                       {result.title}
                     </div>
                     <div className="text-xs text-slate-500 font-mono">
                       {result.subtitle}
                     </div>
                   </div>

                   <ArrowRight size={16} className="text-slate-600 group-hover:text-white -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                 </motion.button>
               ))}
             </div>
          ) : query ? (
            <div className="py-12 text-center text-slate-500">
              <p>Нічого не знайдено.</p>
            </div>
          ) : (
            <div className="py-8 px-4">
              <div className="text-[10px] font-black uppercase text-slate-600 mb-4 tracking-wider">Швидкі запити</div>
              <div className="flex flex-wrap gap-2">
                {['Samsung', 'ТОВ "Епіцентр"', 'Зерно 2024', 'Санкції  Ф'].map(tag => (
                   <Button variant="cyber"
                     key={tag}
                     onClick={() => setQuery(tag)}
                     className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-slate-300 transition-colors"
                   >
                     {tag}
                   </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-slate-950/50 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-600 font-mono">
           <span>PREDATOR V45 SEARCH INDEX</span>
           <span>CMD + K TO OPEN</span>
        </div>
      </motion.div>
    </div>
  );
};
