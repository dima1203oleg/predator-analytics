import React, { useState } from 'react';
import { Search, ArrowRight, Zap, History, Star, TrendingUp, Skull, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useNavigate } from 'react-router-dom';

/**
 * � ️ TACTICAL SEARCH WIDGET | v58.2-WRAITH (PREDATOR_CORE)
 * ВІДЖЕТ ШВИДКОГО ПОШУКУ (ШВИДКИЙ ДОСТУП ДО СВЯТИЛИЩА)
 * 
 * Тепер у "Sovereign Gold" елітарному тактичному стилі.
 */

interface SearchWidgetProps {
    className?: string;
}

export const SearchWidget: React.FC<SearchWidgetProps> = ({ className }) => {
    const [isFocused, setIsFocused] = useState(false);
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (query.trim()) {
            navigate(`/search?q=${encodeURIComponent(query)}`);
        } else {
            navigate('/search');
        }
    };

    return (
        <div className={cn("relative w-full max-w-4xl mx-auto z-50 px-6", className)}>
            <motion.div 
                layout
                className={cn(
                    "relative overflow-hidden transition-all duration-500 rounded-[2rem] border backdrop-blur-3xl shadow-3xl",
                    isFocused 
                        ? "bg-black/90 border-yellow-500/50 shadow-[0_40px_100px_-20px_rgba(180,140,20,0.3)] ring-4 ring-yellow-600/10" 
                        : "bg-slate-900/60 border-white/5 hover:border-yellow-900/20 shadow-2xl"
                )}
            >
                {/* Tactical Scanning Background Line */}
                <AnimatePresence>
                    {isFocused && (
                        <motion.div 
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                            className="absolute inset-0 top-0 left-0 h-1 bg-gradient-to-r from-transparent via-yellow-600/20 to-transparent w-full pointer-events-none"
                        />
                    )}
                </AnimatePresence>

                <form onSubmit={handleSearch} className="relative p-3 flex items-center gap-4">
                    <div className={cn(
                        "p-4 rounded-2xl transition-all duration-300",
                        isFocused ? "bg-yellow-600/20 scale-110" : "bg-white/5"
                    )}>
                        {isFocused ? (
                            <Zap size={24} className="text-yellow-500 drop-shadow-[0_0_10px_#f59e0b]" />
                        ) : (
                            <Search size={22} className="text-slate-500" />
                        )}
                    </div>
                    
                    <input 
                        type="text" 
                        placeholder="ШВИДКИЙ ТАКТИЧНИЙ ПОШУК..."
                        className="flex-1 bg-transparent border-none text-xl font-bold text-white placeholder:text-slate-700 focus:outline-none focus:ring-0 uppercase italic tracking-tighter"
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />

                    <div className="flex items-center gap-2">
                        <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-black/40 border border-white/5 rounded-xl">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">CMD+K</span>
                        </div>
                        
                        <motion.button 
                            whileHover={{ scale: 1.05, x: 3 }}
                            whileTap={{ scale: 0.95 }}
                            type="submit"
                            className={cn(
                                "p-4 rounded-xl transition-all group",
                                isFocused ? "bg-yellow-600 text-black shadow-3xl" : "bg-white/5 text-slate-500 hover:text-white hover:bg-slate-800"
                            )}
                        >
                            <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                    </div>
                </form>

                {/* Sub-interface: Recent Searches / Trends */}
                <AnimatePresence>
                    {isFocused && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-yellow-500/10 bg-black/40 overflow-hidden"
                        >
                            <div className="p-6 grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 border-b border-yellow-950/20 pb-2">
                                        <History size={12} className="text-yellow-900" />
                                        <span className="text-[10px] font-black text-yellow-900 uppercase tracking-widest italic font-mono">ІСТО� ІЯ_ЗАПИТІВ</span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {['ТОВ "ОФШО� -МИТО"', 'ЄД� ПОУ 44923412', 'Микола Верес'].map(item => (
                                            <button key={item} className="text-left py-2 px-3 hover:bg-yellow-600/5 rounded-lg text-sm text-slate-400 hover:text-yellow-400 transition-colors uppercase font-bold italic tracking-tight">
                                                {item}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 border-b border-yellow-950/20 pb-2">
                                        <TrendingUp size={12} className="text-yellow-900" />
                                        <span className="text-[10px] font-black text-yellow-900 uppercase tracking-widest italic font-mono">ГА� ЯЧІ_Т� ЕНДИ_� ИЗИКУ</span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {['ПСЕНИЦЯ_ЕКСПО� Т', 'САНКЦІЇ_� Ф', 'ТИЛОВА_КО� УПЦІЯ'].map(item => (
                                            <button key={item} className="text-left py-2 px-3 hover:bg-yellow-600/5 rounded-lg text-sm text-slate-400 hover:text-yellow-400 transition-colors flex items-center justify-between group/trend uppercase font-bold italic tracking-tight">
                                                <span>{item}</span>
                                                <Zap size={12} className="text-amber-500 opacity-0 group-hover/trend:opacity-100 transition-opacity" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Threat Alert Panel */}
                            <div className="px-6 py-4 bg-yellow-600/10 flex items-center justify-between border-t border-yellow-500/20">
                                <div className="flex items-center gap-3">
                                    <ShieldAlert size={14} className="text-yellow-500 animate-pulse" />
                                    <span className="text-[9px] font-black text-yellow-500 uppercase tracking-[0.2em] italic">СИСТЕМА ШІ-МОНІТО� ИНГУ АКТИВОВАНА</span>
                                </div>
                                <span className="text-[8px] font-mono text-yellow-900 uppercase">LATENCY: 0.1ms</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};
