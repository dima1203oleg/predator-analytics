/**
 * 🔍 PREDATOR Semantic Search | v55.6
 * НЕЙРОФОРМНИЙ ПОШУКОВИЙ ДВИГУН (SOVEREIGN SEARCH)
 * 
 * Інтелектуальний пошук з урахуванням семантичних зв'язків та ризиків.
 * © 2026 PREDATOR Analytics - Повна українізація (HR-04)
 */

import React, { useState } from 'react';
import { 
    Search, Filter, SlidersHorizontal, RefreshCw, 
    ArrowRight, Globe, Database, Target, Brain,
    Shield, Briefcase, FileText, User, MapPin,
    AlertTriangle, CheckCircle2, ChevronRight,
    Zap, Sparkles, Orbit, Binary, Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TacticalCard } from '@/components/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { NeuralPulse } from '@/components/ui/NeuralPulse';
import { Badge } from '@/components/ui/badge';
import { CyberOrb } from '@/components/CyberOrb';
import { cn } from '@/utils/cn';

const SearchPage: React.FC = () => {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [activeFilter, setActiveFilter] = useState('ALL');

    const handleSearch = () => {
        if (!query.trim()) return;
        setIsSearching(true);
        // Апрексімація нейронного пошуку
        setTimeout(() => {
            setResults([
                { id: '1', title: 'ТОВ "МИТНИЙ_ОФШОР"', type: 'COMPANY', risk: 94, info: 'Виявлено зв\'язки з санкційними списками', date: '2026-03-22' },
                { id: '2', title: 'Декларація №445582/2026', type: 'DECLARATION', risk: 42, info: 'Заниження митної вартості (метал)', date: '2026-03-21' },
                { id: '3', title: 'Петро Порошенко (Бенефіціар)', type: 'PERSON', risk: 15, info: 'UBO 24 структур', date: '2026-03-20' },
                { id: '4', title: 'Перевалка "Південь"', type: 'LOCATION', risk: 68, info: 'Аномальна активність вантажів', date: '2026-03-19' },
            ]);
            setIsSearching(false);
        }, 1500);
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#02040a] text-slate-200 relative overflow-hidden font-sans pb-40">
                <AdvancedBackground />
                <CyberGrid color="rgba(99, 102, 241, 0.05)" />
                <NeuralPulse color="rgba(99, 102, 241, 0.03)" size={1400} />

                <div className="relative z-10 max-w-[1400px] mx-auto p-4 sm:p-12 space-y-16">
                    
                    <ViewHeader
                        title={
                            <div className="flex items-center gap-10">
                                <div className="relative group/orb">
                                    <div className="absolute inset-0 bg-indigo-500/20 blur-[80px] rounded-full scale-150 group-hover:opacity-70 transition-opacity animate-pulse opacity-40" />
                                    <div className="relative p-7 bg-slate-900/80 border border-indigo-500/30 rounded-[2.5rem] shadow-3xl backdrop-blur-3xl group-hover:border-indigo-400 transition-all">
                                        <Search size={42} className="text-indigo-400 drop-shadow-[0_0_20px_rgba(99,102,241,0.8)]" />
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-6xl font-black text-white tracking-[0.05em] uppercase leading-none font-display italic skew-x-[-2.5deg]">
                                        ПОШУК <span className="text-indigo-500">СВЯТИЛИЩА</span>
                                    </h1>
                                    <div className="flex items-center gap-6 mt-6">
                                        <div className="h-0.5 w-16 bg-gradient-to-r from-indigo-500 to-transparent" />
                                        <span className="text-[11px] font-mono font-black text-indigo-500/90 uppercase tracking-[0.6em] animate-pulse">
                                            SEMANTIC_SEARCH_ENGINE // v55.6
                                        </span>
                                    </div>
                                </div>
                            </div>
                        }
                        stats={[
                            { label: 'ДОКУМЕНТІВ', value: '14.2M', color: 'primary', icon: <Database size={14} /> },
                            { label: 'ВЕКТОРІВ', value: '52.4M', color: 'success', icon: <Binary size={14} /> },
                            { label: 'ЧАС_ПОШУКУ', value: '4ms', color: 'primary', icon: <Zap size={14} />, animate: true }
                        ]}
                    />

                    {/* Central Search Interface */}
                    <div className="flex flex-col gap-12 items-center w-full">
                        <TacticalCard variant="holographic" className="w-full max-w-5xl p-4 bg-slate-900/40 rounded-[3rem] border-white/5 shadow-3xl group/search" noPadding>
                            <div className="relative p-6 flex items-center gap-6">
                                <div className="p-5 bg-indigo-500/10 rounded-2xl shadow-inner group-focus-within/search:bg-indigo-500/20 transition-all">
                                    <Search size={32} className="text-indigo-400 group-focus-within/search:scale-110 transition-transform" />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="ВВЕДІТЬ ЄДРПОУ, НАЗВУ АБО ТИП ТОВАРУ..."
                                    className="flex-1 bg-transparent border-none text-3xl font-black text-white uppercase italic tracking-tighter placeholder:text-slate-700 focus:outline-none focus:ring-0 leading-none"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <div className="flex items-center gap-4">
                                    <button className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-500 hover:text-white transition-all shadow-xl">
                                        <SlidersHorizontal size={24} />
                                    </button>
                                    <motion.button 
                                        whileHover={{ scale: 1.05, x: 5 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleSearch}
                                        className="px-10 py-5 bg-indigo-600 text-white font-black rounded-2xl text-[11px] uppercase tracking-[0.3em] shadow-3xl hover:bg-indigo-500 transition-all flex items-center gap-4 italic group"
                                    >
                                        <span>НЕЙРО_ПОШУК</span>
                                        <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                                    </motion.button>
                                </div>
                            </div>

                            {/* Floating Active Pulse */}
                            <div className="absolute -bottom-1 left-12 right-12 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-focus-within/search:opacity-100 transition-opacity" />
                        </TacticalCard>

                        {/* Search Filters */}
                        <div className="flex flex-wrap justify-center gap-6">
                            {['ALL', 'COMPANIES', 'DECLARATIONS', 'PERSONS', 'LOCATIONS', 'CUSTOMS'].map((f) => (
                                <button 
                                    key={f}
                                    onClick={() => setActiveFilter(f)}
                                    className={cn(
                                        "px-8 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all italic border shadow-2xl",
                                        activeFilter === f 
                                            ? "bg-indigo-600 border-indigo-400 text-white shadow-[0_0_30px_rgba(99,102,241,0.4)]" 
                                            : "bg-black/60 border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10"
                                    )}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Results / Empty state */}
                    <div className="grid grid-cols-12 gap-12 mt-12">
                        {isSearching ? (
                            <div className="col-span-12 flex flex-col items-center justify-center py-40 gap-12">
                                <CyberOrb size={180} color="#6366f1" intensity={0.6} pulse />
                                <div className="text-center space-y-4">
                                    <span className="text-xl font-black text-white uppercase tracking-[0.8em] italic animate-pulse block">COGNITIVE_RECONSTRUCTION</span>
                                    <div className="h-1 w-64 bg-white/5 rounded-full overflow-hidden mx-auto shadow-2xl">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: '100%' }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                            className="h-full bg-indigo-500 shadow-[0_0_15px_#6366f1]"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-10">
                                <AnimatePresence mode="popLayout">
                                    {results.map((res, i) => (
                                        <motion.div
                                            key={res.id}
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="group relative"
                                        >
                                            <TacticalCard variant="cyber" className="p-10 border-white/5 bg-slate-900/40 rounded-[3rem] hover:border-indigo-500/30 transition-all shadow-3xl flex gap-10 overflow-hidden group/item" noPadding={false}>
                                                <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover/item:opacity-[0.08] transition-all transform group-hover/item:scale-110 group-hover/item:rotate-12">
                                                    {res.type === 'COMPANY' ? <Briefcase size={280} /> : res.type === 'DECLARATIONS' ? <FileText size={280} /> : <User size={280} />}
                                                </div>

                                                <div className="flex-1 space-y-6 relative z-10">
                                                    <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                                                        <div className="p-3 bg-indigo-500/10 rounded-xl">
                                                            {res.type === 'COMPANY' ? <Briefcase size={18} className="text-indigo-400" /> : <Database size={18} className="text-indigo-400" />}
                                                        </div>
                                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] italic">{res.type}</span>
                                                    </div>
                                                    
                                                    <div className="space-y-2">
                                                        <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-tight group-hover/item:text-indigo-400 transition-colors uppercase italic">{res.title}</h3>
                                                        <p className="text-[14px] text-slate-400 leading-relaxed font-black uppercase italic tracking-tight">{res.info}</p>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-4">
                                                        <div className="flex items-center gap-8">
                                                            <div className="flex flex-col">
                                                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">ДАТА_ФОРМУВАННЯ</span>
                                                                <span className="text-[10px] font-mono font-black text-slate-300">{res.date}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">SCORE</span>
                                                                <span className={cn("text-sm font-black font-mono italic", res.risk > 70 ? "text-rose-500" : "text-emerald-400")}>{res.risk}%</span>
                                                            </div>
                                                        </div>
                                                        <motion.button 
                                                            whileHover={{ x: 8 }}
                                                            className="flex items-center gap-4 text-[10px] font-black text-indigo-400 hover:text-white transition-colors uppercase italic tracking-[0.2em]"
                                                        >
                                                            АНАЛІЗУВАТИ <ChevronRight size={16} />
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            </TacticalCard>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="col-span-12 flex flex-col items-center justify-center py-40 text-center gap-10">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-indigo-500/10 blur-[60px] rounded-full scale-150 group-hover:scale-175 transition-all" />
                                    <Search size={80} className="text-slate-800 relative z-10 group-hover:text-slate-700 transition-colors" />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-black text-slate-600 uppercase tracking-[0.6em] italic">СИСТЕМА ОЧІКУЄ ЗАПИТ</h3>
                                    <p className="text-sm text-slate-500 font-black uppercase italic tracking-widest max-w-lg opacity-60">ШІ-рушій готовий до семантичної дистиляції торговельних потоків</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{ __html: `
                    .no-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                    .font-display {
                        font-family: 'Inter', sans-serif;
                    }
                `}} />
            </div>
        </PageTransition>
    );
};

export default SearchPage;
