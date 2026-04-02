import React, { useState } from 'react';
import { Search, ArrowRight, Zap, History, Star, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useNavigate } from 'react-router-dom';

interface SearchWidgetProps {
  className?: string;
  variant?: 'compact' | 'expanded';
}

export const SearchWidget: React.FC<SearchWidgetProps> = ({ className, variant = 'expanded' }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      navigate('/search');
    }
  };

  const suggestions = [
    { label: 'ТОВ "Мега-Трейд"', type: 'Компанія', icon: TrendingUp },
    { label: 'Декларації 2024: Посуд', type: 'Фільтр', icon: History },
    { label: 'Ризиковий імпорт з Китаю', type: 'Інсайт', icon: Zap },
  ];

  return (
    <div className={cn("relative group w-full", className)}>
      <motion.div
        animate={{ 
          scale: isFocused ? 1.02 : 1,
          boxShadow: isFocused ? '0 0 50px rgba(99,102,241,0.2)' : '0 0 0px rgba(0,0,0,0)'
        }}
        className={cn(
          "relative flex items-center gap-4 bg-slate-950/60 border border-white/10 rounded-[2.5rem] px-8 py-6 transition-all",
          isFocused ? "border-indigo-500/50 bg-indigo-500/5" : "hover:border-white/20"
        )}
      >
        <Search className={cn(
          "w-8 h-8 transition-colors",
          isFocused ? "text-indigo-400" : "text-slate-500"
        )} />
        
        <form onSubmit={handleSearch} className="flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder="Шукати компанії, митні коди, декларації або ризики..."
            className="w-full bg-transparent border-none outline-none text-xl font-medium text-white placeholder:text-slate-600 focus:ring-0 italic"
          />
        </form>

        <motion.button
          whileHover={{ x: 5 }}
          onClick={() => handleSearch()}
          className="p-4 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-2xl transition-all group/btn shadow-xl shadow-indigo-500/10"
        >
          <ArrowRight size={24} className="group-hover/btn:translate-x-1 transition-transform" />
        </motion.button>

        {/* Hotkeys indicator */}
        {!isFocused && (
          <div className="absolute right-24 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest hidden md:flex">
             <span>CMD</span>
             <span className="w-1 h-3 bg-slate-700" />
             <span>K</span>
          </div>
        )}
      </motion.div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="absolute top-full left-4 right-4 mt-4 bg-slate-950/90 backdrop-blur-3xl border border-indigo-500/20 rounded-[2.5rem] p-6 z-[100] shadow-[0_40px_100px_rgba(0,0,0,0.8)]"
          >
            <div className="flex items-center justify-between mb-6 px-4">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-3 italic">
                <Star size={14} className="fill-current" /> ШВИДКІ_ПОРАДИ
              </span>
              <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest italic">NEXUS_SUGGEST_v55</span>
            </div>
            
            <div className="space-y-2">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(s.label);
                    handleSearch();
                  }}
                  className="w-full flex items-center justify-between p-6 hover:bg-white/5 rounded-3xl transition-all group/item border border-transparent hover:border-white/10"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500 group-hover/item:text-indigo-400 group-hover/item:border-indigo-500/30 transition-all">
                      <s.icon size={22} />
                    </div>
                    <div className="text-left">
                      <p className="text-[16px] font-bold text-white group-hover/item:text-indigo-300 transition-colors italic uppercase tracking-tight">{s.label}</p>
                      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1 italic">{s.type}</p>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-slate-800 group-hover/item:text-indigo-500 group-hover/item:translate-x-2 transition-all" />
                </button>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between px-4">
               <div className="flex gap-4">
                  <span className="text-[9px] font-black text-slate-600 bg-white/5 px-3 py-1 rounded-lg italic">ПОШУК: Enter</span>
                  <span className="text-[9px] font-black text-slate-600 bg-white/5 px-3 py-1 rounded-lg italic">НАВІГАЦІЯ: ↑↓</span>
               </div>
               <button 
                 onClick={() => navigate('/search')}
                 className="text-[10px] font-black text-indigo-400 hover:text-white uppercase tracking-[0.2em] italic"
               >
                 РОЗШИРЕНИЙ_ПОШУК →
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
