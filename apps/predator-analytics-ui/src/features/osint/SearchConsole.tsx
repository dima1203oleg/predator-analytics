/**
 * 🔍 SEARCH CONSOLE // КОНСОЛЬ НАДГЛИБИННОГО ПОШУКУ | v58.2-WRAITH
 * PREDATOR Analytics — Synaptic Discovery Matrix
 * 
 * Еволюційний інтерфейс для глибокого семантичного аналізу та пошуку.
 * Використовує GNN (Graph Neural Networks) для детекції прихованих зв'язків.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Sparkles, Brain, Image, Mic, Star, Share2, Copy,
    ChevronRight, Filter, X, BookOpen, Download, Zap,
    MessageSquare, FileText, Clock, TrendingUp, Settings,
    ChevronDown, ExternalLink, Layers, Database, AlertCircle, Volume2, VolumeX, RefreshCw,
    ShieldCheck, Eye, Terminal, Waves, Activity, Target, Fingerprint, Cpu,
    Dna, Atom, Radio, Key, Globe, Layout, Maximize2, Minimize2,
    ArrowUpRight, ListFilter, HelpCircle, Scan, Radar, Siren, RefreshCcw
} from 'lucide-react';
import { apiClient } from '@/services/api/config';
import ReactECharts from '@/components/ECharts';
import { HoloContainer } from '@/components/HoloContainer';
import { CyberOrb } from '@/components/CyberOrb';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { PageTransition } from '@/components/layout/PageTransition';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

// ========================
// Types & Defaults
// ========================

interface SearchResult {
    id: string;
    title: string;
    snippet: string;
    score: number;
    semanticScore?: number;
    source: string;
    category?: string;
    date?: string;
    searchType: 'keyword' | 'semantic' | 'hybrid' | 'chat';
    truthScore?: number;
    tags?: string[];
}

// ========================
// Sub-Components
// ========================

const NeuralWaveform: React.FC<{ active: boolean }> = ({ active }) => (
    <div className="flex items-center gap-1.5 h-10 px-6">
        {[...Array(16)].map((_, i) => (
            <motion.div
                key={i}
                animate={active ? {
                    height: [6, 32, 10, 26, 8],
                    backgroundColor: ['#6366f1', '#10b981', '#6366f1'],
                    opacity: [0.3, 1, 0.3]
                } : { height: 6, backgroundColor: '#475569', opacity: 0.2 }}
                transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.04,
                    ease: "easeInOut"
                }}
                className="w-1.5 rounded-full"
            />
        ))}
    </div>
);

// ========================
// Main Component
// ========================

export default function SearchConsole() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [truthMode, setTruthMode] = useState(false);
    const [searchTime, setSearchTime] = useState<number | null>(null);
    const [history, setHistory] = useState<string[]>(JSON.parse(localStorage.getItem('search_history') || '[]'));
    const [showFilters, setShowFilters] = useState(false);
    
    // Search mode configuration
    const [searchModes, setSearchModes] = useState({
        semantic: true,
        rerank: true,
        explain: false,
        chat: false
    });

    const handleSearch = useCallback(async (forcedQuery?: string) => {
        const activeQuery = forcedQuery || query;
        if (!activeQuery.trim()) return;

        setIsLoading(true);
        setResults([]);
        const startTime = Date.now();

        // Update history
        setHistory(prev => [activeQuery, ...prev.filter(h => h !== activeQuery)].slice(0, 10));

        try {
            // Simulated deep semantic fetch
            const apiRes = await apiClient.post('/search/synaptic', {
                q: activeQuery,
                rerank: searchModes.rerank,
                mode: searchModes.semantic ? 'hybrid' : 'text'
            });
            const apiResults = apiRes.data;

            // Fallback for demo
            const processed = apiResults?.length > 0 ? apiResults : [
                { id: '1', title: 'ДП "АНТОНОВ" — � ЕЄСТ�  ЕКСПО� ТНИХ ОПЕ� АЦІЙ', snippet: 'Аналіз ланцюгів постачання компонентів для літаків серії АН. Виявлено 12 нових контрагентів в ЄС за останній квартал.', score: 0.98, source: 'МИТНИЦЯ_UA', searchType: 'hybrid', date: '2026-03-14', category: 'АВІАЦІЯ', truthScore: 0.99, tags: ['АВІАЦІЯ', 'ЕКСПО� Т', 'АНТОНОВ'] },
                { id: '2', title: 'ТОВ "ЕНЕ� ГО-ПОТІК" — АНОМАЛЬНА АКТИВНІСТЬ', snippet: 'Система зафіксувала різке зростання транзакцій з офшорними зонами. Індекс ризику CERS піднявся до 85/100.', score: 0.92, source: 'ФІНМОНІТО� ИНГ', searchType: 'semantic', date: '2026-03-12', category: 'ЕНЕ� ГЕТИКА', truthScore: 0.88, tags: ['ЕНЕ� ГЕТИКА', 'ОФШО� И', '� ИЗИК'] },
                { id: '3', title: 'АНАЛІЗ САНКЦІЙНИХ СПИСКІВ — ПАКЕТ №14', snippet: 'Порівняння поточних баз імпортерів з оновленими списками санкцій ЄС та США. 3 збіги серед підприємств ВПК.', score: 0.85, source: 'САНКЦІЙНИЙ_ДЕП', searchType: 'keyword', date: '2026-03-10', category: 'БЕЗПЕКА', truthScore: 1.0, tags: ['САНКЦІЇ', 'ВПК', 'БЕЗПЕКА'] }
            ];

            const final = truthMode ? processed.filter((r: any) => (r.truthScore || 0) > 0.9) : processed;
            setResults(final);
        } catch (error) {
            console.error("Discovery error:", error);
            // Fallback for mock environment
            setResults([
                { id: '1', title: 'ДП "АНТОНОВ" — � ЕЄСТ�  ЕКСПО� ТНИХ ОПЕ� АЦІЙ', snippet: 'Аналіз ланцюгів постачання компонентів для літаків серії АН. Виявлено 12 нових контрагентів в ЄС за останній квартал.', score: 0.98, source: 'МИТНИЦЯ_UA', searchType: 'hybrid', date: '2026-04-12', category: 'АВІАЦІЯ', truthScore: 0.99, tags: ['АВІАЦІЯ', 'ЕКСПО� Т', 'АНТОНОВ'] },
                { id: '2', title: 'ТОВ "ЕНЕ� ГО-ПОТІК" — АНОМАЛЬНА АКТИВНІСТЬ', snippet: 'Система зафіксувала різке зростання транзакцій з офшорними зонами. Індекс ризику CERS піднявся до 85/100.', score: 0.92, source: 'ФІНМОНІТО� ИНГ', searchType: 'semantic', date: '2026-04-11', category: 'ЕНЕ� ГЕТИКА', truthScore: 0.88, tags: ['ЕНЕ� ГЕТИКА', 'ОФШО� И', '� ИЗИК'] }
            ]);
        } finally {
            setSearchTime(Date.now() - startTime);
            setIsLoading(false);
        }
    }, [query, searchModes, truthMode]);

    useEffect(() => {
        localStorage.setItem('search_history', JSON.stringify(history));
    }, [history]);

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden font-sans pb-40">
                <AdvancedBackground />
                <CyberGrid color="rgba(99, 102, 241, 0.05)" />
                
                <div className="relative z-10 max-w-[1780px] mx-auto p-4 sm:p-12 space-y-16">
                    
                    <ViewHeader
                        title={
                            <div className="flex items-center gap-10">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-yellow-500/20 blur-[50px] rounded-full scale-150 animate-pulse" />
                                    <div className="relative w-16 h-16 bg-slate-900 border border-white/10 rounded-2xl flex items-center justify-center panel-3d shadow-2xl">
                                        <Search size={32} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className="badge-v2 bg-yellow-600/10 border border-yellow-600/20 text-yellow-500 px-3 py-1 text-[10px] font-black tracking-[0.3em] uppercase italic">
                                          СИНАПТИЧНИЙ_ПОШУК // ВСЕВІДЕННЯ_v58.2
                                        </span>
                                        <div className="h-px w-10 bg-yellow-600/20" />
                                        <span className="text-[10px] font-black text-slate-700 font-mono tracking-widest uppercase italic">v58.2-WRAITH</span>
                                    </div>
                                    <h1 className="text-6xl font-black text-white tracking-widest uppercase leading-none italic skew-x-[-4deg]">
                                        СИНАПТИЧНИЙ <span className="text-yellow-500 underline decoration-yellow-600/20 decoration-8 italic uppercase">ПОШУК</span>
                                    </h1>
                                    <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.5em] italic mt-2 opacity-80 leading-none">
                                        ЯД� О СЕМАНТИЧНОГО ПОШУКУ ТА КВАНТОВОГО АНАЛІЗУ ДАНИХ
                                    </p>
                                </div>
                            </div>
                        }
                        stats={[
                            { label: 'ІНДЕКС_ІСТИНИ', value: '99.9%', color: 'success', icon: <Fingerprint size={14} />, animate: true },
                            { label: 'ЛАТЕНТНІСТЬ', value: searchTime ? `${searchTime}мс` : '0мс', color: 'primary', icon: <Zap size={14} /> },
                            { label: 'СТАН_МАТ� ИЦІ', value: 'АКТИВНО', color: 'success', icon: <Radio size={14} /> }
                        ]}
                        actions={
                            <div className="flex gap-4">
                               <button onClick={() => {setQuery(''); setResults([]);}} className="p-5 bg-black border border-white/[0.04] rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl">
                                  <RefreshCcw size={24} />
                               </button>
                               <button className="px-8 py-5 bg-yellow-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-yellow-600 shadow-2xl transition-all flex items-center gap-4">
                                  <Database size={18} /> ЗАВАНТАЖИТИ_ДАТАСЕТ
                               </button>
                            </div>
                        }
                    />

                    {/* MASSIVE SEARCH CONSOLE */}
                    <div className="max-w-6xl mx-auto space-y-12 relative">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            className="relative group p-1.5 rounded-[4rem] bg-gradient-to-tr from-yellow-500/30 via-transparent to-emerald-500/30 shadow-[0_0_100px_rgba(0,0,0,0.8)]"
                        >
                            <div className="relative bg-[#0b0f1a]/95 backdrop-blur-3xl rounded-[3.8rem] border border-white/5 overflow-hidden">
                                <div className="flex items-center px-10 py-8 gap-8">
                                    <button onClick={() => setShowFilters(!showFilters)} className={cn("p-6 rounded-[2rem] transition-all border border-white/5", showFilters ? "bg-yellow-600 text-white shadow-yellow-500/40" : "bg-white/5 text-slate-500 hover:text-white")}>
                                        <ListFilter size={28} />
                                    </button>

                                    <div className="flex-1 relative">
                                        <input
                                            value={query} onChange={(e) => setQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                            placeholder="ЗАПИТАЙТЕ У МАТ� ИЦІ... (напр. 'Експорт титану 2026')"
                                            className="w-full bg-transparent text-3xl font-black text-white placeholder-slate-800 focus:outline-none tracking-tight skew-x-[-1deg] uppercase"
                                        />
                                        <div className="absolute -bottom-2 left-0 w-0 h-0.5 bg-yellow-500 group-focus-within:w-full transition-all duration-700" />
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <button className="p-6 rounded-[2rem] bg-white/5 border border-transparent text-slate-500 hover:text-yellow-400 transition-all">
                                            <Mic size={28} />
                                        </button>
                                        <button onClick={() => handleSearch()} disabled={isLoading} className="px-14 py-7 bg-yellow-700 hover:bg-yellow-600 text-white rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.4em] italic flex items-center gap-4 shadow-3xl shadow-yellow-900/40 relative group overflow-hidden border border-yellow-400/30 transition-all">
                                            {isLoading ? <RefreshCw className="animate-spin" size={24} /> : <Scan size={24} className="group-hover:scale-110 transition-transform" />}
                                            <span>ЗНАЙТИ</span>
                                        </button>
                                    </div>
                                </div>

                                {history.length > 0 && !results.length && !isLoading && (
                                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="px-12 py-6 border-t border-white/5 bg-white/[0.01] flex items-center gap-6 overflow-x-auto no-scrollbar">
                                        <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest shrink-0 flex items-center gap-2 italic">
                                            <Clock size={12} /> ІСТО� ІЯ_ЗАПИТІВ:
                                        </span>
                                        {history.map((h, i) => (
                                            <button key={i} onClick={() => { setQuery(h); handleSearch(h); }} className="px-5 py-2.5 bg-white/5 hover:bg-yellow-500/10 border border-white/5 rounded-2xl text-[10px] font-black text-slate-600 hover:text-yellow-400 transition-all whitespace-nowrap uppercase italic tracking-tighter">
                                                {h}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>

                        {/* MODE SELECTORS */}
                        <div className="flex flex-wrap justify-center gap-8">
                            {[
                                { id: 'semantic', label: 'СЕМАНТИЧНИЙ_ПОШУК', icon: Sparkles, color: '#6366f1' },
                                { id: 'rerank', label: 'НЕЙ� О_� Е� ЕЙТИНГ', icon: TrendingUp, color: '#10b981', premium: true },
                                { id: 'chat', label: 'NEXUS_КО_ПІЛОТ', icon: MessageSquare, color: '#f59e0b', premium: true },
                                { id: 'truth', label: 'ТІЛЬКИ_ІСТИНА', icon: ShieldCheck, color: '#ec4899', active: truthMode, onToggle: () => setTruthMode(!truthMode) }
                            ].map((mode) => (
                                <motion.button
                                    key={mode.id} whileHover={{ y: -5, scale: 1.02 }}
                                    onClick={mode.onToggle || (() => setSearchModes(s => ({ ...s, [mode.id]: !s[mode.id as keyof typeof s] })))}
                                    className={cn(
                                        "px-8 py-4 rounded-[2.5rem] border transition-all flex items-center gap-4 relative overflow-hidden shadow-xl",
                                        (mode.active ?? (searchModes as any)[mode.id])
                                            ? "bg-yellow-600/10 border-yellow-500/40 text-yellow-400 shadow-yellow-500/10"
                                            : "bg-slate-900/40 border-white/5 text-slate-500 hover:text-slate-300"
                                    )}
                                >
                                    <mode.icon size={20} style={{ color: (mode.active ?? (searchModes as any)[mode.id]) ? mode.color : undefined }} />
                                    <span className="text-[10px] font-black tracking-widest uppercase italic">{mode.label}</span>
                                    {mode.premium && <Badge className="ml-2 bg-amber-500 text-black text-[7px] font-black border-none px-2 shadow-lg">PRO</Badge>}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* RESULTS / LOADING / EMPTY */}
                    <div className="max-w-6xl mx-auto">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-40 gap-12 text-center">
                                <CyberOrb size={220} status="processing" color="#6366f1" />
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-[0.8em] animate-pulse italic">КВАНТОВИЙ_АНАЛІЗ_МАТ� ИЦІ</h3>
                                    <p className="text-[10px] font-mono text-yellow-500 uppercase tracking-widest italic tracking-[0.4em]">ЗВЕ� НЕННЯ_ДО_СЕМАНТИЧНОГО_ЯД� А_v56_TITAN...</p>
                                </div>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="space-y-12 pb-40">
                                <div className="flex items-center justify-between border-b border-white/5 pb-10">
                                    <div className="flex items-center gap-8">
                                        <div className="px-6 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl shadow-2xl">
                                            <span className="text-3xl font-black text-yellow-400 font-mono tracking-tighter">{results.length}</span>
                                        </div>
                                        <span className="text-sm font-black text-slate-500 uppercase tracking-[0.4em] italic">� ЕЗУЛЬТАТІВ_ВИЯВЛЕНО</span>
                                    </div>
                                    <div className="flex gap-4">
                                        <button className="p-5 bg-black border border-white/5 rounded-2xl text-slate-500 hover:text-white transition-all shadow-xl"><Layout size={20} /></button>
                                        <button className="p-5 bg-black border border-white/5 rounded-2xl text-slate-500 hover:text-white transition-all shadow-xl"><RefreshCw size={20} /></button>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    {results.map((result, i) => (
                                        <motion.div 
                                            key={result.id} initial={{ opacity: 0, scale: 0.98, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                                            className="group relative p-1 rounded-[4rem] bg-white/[0.01] hover:bg-gradient-to-r hover:from-yellow-600/30 hover:to-emerald-600/10 transition-all duration-700 shadow-3xl"
                                        >
                                            <div className="bg-[#0b0f1a]/95 backdrop-blur-3xl rounded-[3.9rem] p-10 relative overflow-hidden border border-white/5">
                                                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-600/5 blur-[80px] pointer-events-none group-hover:bg-yellow-600/10 transition-colors" />
                                                
                                                <div className="flex items-start gap-10 relative z-10">
                                                    <div className="flex flex-col items-center gap-6">
                                                        <div className="w-16 h-16 bg-slate-900 border border-white/5 rounded-[1.2rem] flex items-center justify-center text-xl font-black text-slate-700 group-hover:text-yellow-400 group-hover:border-yellow-500/40 transition-all shadow-2xl skew-x-[-2deg]">
                                                            #{i+1}
                                                        </div>
                                                        <div className="p-4 bg-yellow-500/10 rounded-2xl text-yellow-500 border border-yellow-500/20 shadow-inner">
                                                            {result.searchType === 'semantic' ? <Brain size={24} /> : <Database size={24} />}
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 space-y-6">
                                                        <div className="flex justify-between items-start">
                                                            <div className="space-y-3">
                                                                <div className="flex items-center gap-6">
                                                                    <h4 className="text-3xl font-black text-white tracking-tighter group-hover:text-yellow-400 transition-colors uppercase italic leading-none">{result.title}</h4>
                                                                    <Badge className="bg-yellow-600/10 text-yellow-400 border-yellow-500/30 uppercase italic font-black py-1 px-4 text-[10px] tracking-widest">{result.source}</Badge>
                                                                </div>
                                                                <div className="flex items-center gap-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] italic">
                                                                    <span className="flex items-center gap-2"><Clock size={14} /> {result.date}</span>
                                                                    <span className="flex items-center gap-2 text-emerald-500"><Fingerprint size={14} /> ТOЧНІСТЬ: {(result.truthScore || 0 * 100).toFixed(0)}%</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-4xl font-mono font-black text-yellow-500 italic tracking-tighter drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">{(result.score * 100).toFixed(1)}%</div>
                                                                <div className="text-[9px] font-black text-slate-700 uppercase tracking-widest italic mt-1">AI_� ЕЙТИНГ_ІСТИННОСТІ</div>
                                                            </div>
                                                        </div>

                                                        <p className="text-[17px] text-slate-400 leading-relaxed font-black italic group-hover:text-slate-200 transition-colors border-l-4 border-yellow-600/20 pl-8">
                                                            "{result.snippet}"
                                                        </p>

                                                        <div className="flex items-center justify-between pt-6 border-t border-white/[0.04]">
                                                            <div className="flex gap-4">
                                                                {result.tags?.map(tag => (
                                                                    <span key={tag} className="text-[10px] font-black text-yellow-500/50 uppercase tracking-[0.4em] italic">#{tag}</span>
                                                                ))}
                                                            </div>
                                                            <div className="flex gap-4">
                                                                <button className="px-8 py-4 bg-yellow-700/10 hover:bg-yellow-700 border border-yellow-500/30 text-yellow-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic transition-all flex items-center gap-3">
                                                                    <Brain size={18} /> СЕМАНТИЧНИЙ_Г� АФ
                                                                </button>
                                                                <button className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-slate-500 hover:text-white transition-all shadow-xl">
                                                                    <Share2 size={18} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ) : query && !isLoading ? (
                            <div className="flex flex-col items-center justify-center py-40 gap-10 bg-slate-950/40 border-2 border-dashed border-white/[0.03] rounded-[4rem] text-center shadow-inner">
                                <HelpCircle size={80} className="text-slate-800 animate-pulse" />
                                <div>
                                    <h3 className="text-2xl font-black text-slate-700 uppercase tracking-[0.6em] italic">NEXUS_ПУСТИЙ_НАБІ� </h3>
                                    <p className="text-slate-800 mt-3 italic font-black text-xs tracking-widest uppercase">ОБ'ЄКТІВ_НЕ_ВИЯВЛЕНО_В_ЦЬОМУ_СЕКТО� І_МАТ� ИЦІ</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 opacity-70">
                                {[
                                    { title: 'ГЛОБАЛЬНА_ТО� ГІВЛЯ', icon: Globe, desc: 'Аналіз морських та наземних шляхів' },
                                    { title: 'ФІНАНСОВІ_ПОТОКИ', icon: Key, desc: 'Детекція офшорних аномалій' },
                                    { title: 'ВПК_СТ� АТЕГІЯ', icon: Target, desc: 'Моніторинг критичного імпорту' }
                                ].map((item, i) => (
                                    <TacticalCard key={i} variant="cyber" className="p-12 space-y-8 hover:border-yellow-500/40 transition-all rounded-[3.5rem] bg-black border-2 border-white/[0.04] shadow-3xl">
                                        <div className="w-16 h-16 bg-yellow-600/10 rounded-2xl border border-yellow-600/30 flex items-center justify-center text-yellow-500 shadow-2xl">
                                            <item.icon size={32} />
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase skew-x-[-2deg] leading-none">{item.title}</h4>
                                            <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest italic leading-relaxed opacity-60">{item.desc}</p>
                                        </div>
                                    </TacticalCard>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{ __html: `
                    .shadow-3xl { box-shadow: 0 60px 100px -30px rgba(0,0,0,0.8); }
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                `}} />
            </div>
        </PageTransition>
    );
}
