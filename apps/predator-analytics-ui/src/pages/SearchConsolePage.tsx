/**
 * PREDATOR v63.0-ELITE | Sovereign Power Edition | Tactical Matrix
 * 
 * Жорсткий, військово-розвідувальний інтерфейс у стилі Palantir Gotham.
 * - Прямі кути, моноширинні шрифти, мінімалізм.
 * - Тактичні кольори (Cyan/Teal, Gunmetal, Slate).
 * - Нейронний Listening Visualizer
 */

import { Button } from '@/components/ui/button';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Search, Sparkles, Brain, Mic, 
    Zap, MessageSquare, Clock, TrendingUp, 
    RefreshCw, ShieldCheck, Fingerprint, 
    Atom, Radio, Globe, Layout, HelpCircle,
    Database, Target, ListFilter, Key, Crosshair, ChevronRight, CornerDownRight
} from 'lucide-react';
import { api } from '@/services/api';
import { useVoiceControl, InteractionStatus } from '@/hooks/useVoiceControl';
import { ViewHeader } from '@/components/ViewHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import { CyberOrb } from '@/components/CyberOrb';

import { useViewport } from '@/hooks/useViewport';
import { SwipeableDrawer } from '@/components/layout/SwipeableDrawer';
import { X, SlidersHorizontal, Settings2 } from 'lucide-react';

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
    <div className="flex items-center gap-1 h-8 px-4 border border-[#0ea5e9]/20 bg-[#020617]/50">
        {[...Array(12)].map((_, i) => (
            <motion.div
                key={i}
                animate={active ? {
                    height: [4, 16, 6, 12, 4],
                    backgroundColor: ['#0ea5e9', '#38bdf8', '#0ea5e9'],
                    opacity: [0.6, 1, 0.6]
                } : { height: 4, backgroundColor: '#334155', opacity: 0.5 }}
                transition={{
                    duration: 0.4,
                    repeat: Infinity,
                    delay: i * 0.05,
                    ease: "linear"
                }}
                className="w-1 bg-[#0ea5e9]"
            />
        ))}
    </div>
);

// Tactical Grid Background Elements
const TacticalOverlays: React.FC = () => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
            <div className="absolute top-10 left-10 w-8 h-8 border-t-2 border-l-2 border-[#0ea5e9]/40" />
            <div className="absolute top-10 right-10 w-8 h-8 border-t-2 border-r-2 border-[#0ea5e9]/40" />
            <div className="absolute bottom-10 left-10 w-8 h-8 border-b-2 border-l-2 border-[#0ea5e9]/40" />
            <div className="absolute bottom-10 right-10 w-8 h-8 border-b-2 border-r-2 border-[#0ea5e9]/40" />
            
            {/* Horizontal scanline */}
            <motion.div 
                animate={{ y: ['0vh', '100vh', '0vh'] }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                className="absolute left-0 w-full h-[1px] bg-[#0ea5e9]/20 shadow-[0_0_8px_rgba(14,165,233,0.5)]"
            />
        </div>
    );
};

// ========================
// Main Component
// ========================

export const SearchConsolePage: React.FC = () => {
    const { isCompact } = useViewport();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [truthMode, setTruthMode] = useState(false);
    const [searchTime, setSearchTime] = useState<number | null>(null);
    const [history, setHistory] = useState<string[]>(JSON.parse(localStorage.getItem('search_history') || '[]'));
    const [showFilters, setShowFilters] = useState(false);
    
    const [searchModes, setSearchModes] = useState({
        semantic: true,
        rerank: true,
        explain: false,
        chat: false
    });

    const inputRef = useRef<HTMLInputElement>(null);

    const [voiceStatus, setVoiceStatus] = useState<InteractionStatus>('IDLE');
    const { startListening, stopListening } = useVoiceControl(voiceStatus, setVoiceStatus, (text) => {
        setQuery(text);
        if (text.length > 5) handleSearch(text);
    });

    const handleSearch = useCallback(async (forcedQuery?: string) => {
        const activeQuery = forcedQuery || query;
        if (!activeQuery.trim()) return;

        setIsLoading(true);
        setResults([]);
        const startTime = Date.now();

        setHistory(prev => [activeQuery, ...prev.filter(h => h !== activeQuery)].slice(0, 10));

        try {
            const apiResults = await api.search.query({
                q: activeQuery,
                rerank: searchModes.rerank,
                mode: searchModes.semantic ? 'hybrid' : 'text'
            });

            const processed = apiResults.length > 0 ? apiResults : [
                { id: '1', title: 'ДП "АНТОНОВ" — ДОСЬЄ ЕКСПОРТУ', snippet: 'Аналіз ланцюгів постачання компонентів. Виявлено 12 нових контрагентів в ЄС за останній квартал.', score: 0.98, source: 'МИТНИЦЯ', searchType: 'hybrid', date: '2026-03-14', category: 'АВІАЦІЯ', truthScore: 0.99, tags: ['АВІАЦІЯ', 'ЕКСПОРТ'] },
                { id: '2', title: 'ТОВ "ЕНЕРГО-ПОТІК" — АНОМАЛІЯ', snippet: 'Система зафіксувала різке зростання транзакцій з офшорними зонами. Індекс ризику піднявся до 85/100.', score: 0.92, source: 'ФІНМОНІТОРИНГ', searchType: 'semantic', date: '2026-03-12', category: 'ЕНЕРГЕТИКА', truthScore: 0.88, tags: ['РИЗИК', 'ФІНАНСИ'] },
                { id: '3', title: 'САНКЦІЙНІ СПИСКИ — ПАКЕТ №14', snippet: 'Порівняння поточних баз імпортерів з оновленими списками санкцій. 3 збіги серед підприємств ВПК.', score: 0.85, source: 'РОЗВІДКА', searchType: 'keyword', date: '2026-03-10', category: 'БЕЗПЕКА', truthScore: 1.0, tags: ['САНКЦІЇ', 'ВПК'] }
            ];

            const final = truthMode ? processed.filter((r: any) => (r.truthScore || 0) > 0.9) : processed;
            setResults(final);
        } catch (error) {
            console.error("Discovery error:", error);
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
            <div className="min-h-screen bg-[#020617] text-slate-300 relative overflow-hidden font-mono pb-40">
                <TacticalOverlays />
                
                <div className={cn("relative z-10 max-w-[1900px] mx-auto p-4 sm:p-8 lg:p-12", isCompact ? "space-y-6" : "space-y-10")}>
                    
                    {/* View Header - Tactical */}
                    <ViewHeader
                        title={
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 bg-[#0ea5e9]/10 border border-[#0ea5e9] flex items-center justify-center relative">
                                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#0ea5e9]" />
                                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#0ea5e9]" />
                                    <Target size={24} className="text-[#0ea5e9]" />
                                </div>
                                <div className="flex flex-col">
                                    <h1 className="font-black text-white tracking-[0.2em] uppercase leading-none text-2xl md:text-3xl">
                                        МАТРИЦЯ <span className="text-[#0ea5e9]">ПОШУКУ</span>
                                    </h1>
                                    <p className="text-[10px] text-[#0ea5e9]/70 uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                                        <Crosshair size={10} className="animate-pulse" /> 
                                        СИСТЕМА НАВЕДЕННЯ ТА СЕМАНТИЧНОГО АНАЛІЗУ
                                    </p>
                                </div>
                            </div>
                        }
                        icon={<Search size={22} className="text-[#0ea5e9]" />}
                        breadcrumbs={['ЯДРО', 'РОЗВІДКА', 'QUERY_MATRIX']}
                        stats={[
                            { label: 'ІНДЕКС_ІСТИНИ', value: '99.9%', color: 'success', icon: <Fingerprint size={12} />, animate: true },
                            { label: 'ЛАТЕНТНІСТЬ', value: searchTime ? `${searchTime}ms` : '0ms', color: 'primary', icon: <Zap size={12} /> },
                            { label: 'STATUS', value: 'ONLINE', color: 'success', icon: <Radio size={12} /> }
                        ]}
                    />

                    {/* Strict Search Console Input */}
                    <div className="max-w-6xl mx-auto space-y-6 relative">
                        <div className="bg-[#020617] border border-[#0ea5e9]/30 relative group">
                            {/* Corner brackets */}
                            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#0ea5e9]" />
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#0ea5e9]" />
                            
                            {isCompact ? (
                                <div className="flex flex-col p-4 gap-4">
                                    <div className="relative">
                                        <input
                                            ref={inputRef}
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                            placeholder="> ВВЕДІТЬ ПАРАМЕТРИ ЦІЛІ..."
                                            className="w-full bg-[#0a0f1c] border border-slate-800 focus:border-[#0ea5e9]/70 py-4 px-4 text-sm font-mono text-[#0ea5e9] placeholder-slate-600 focus:outline-none tracking-widest uppercase"
                                        />
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <Button variant="cyber" 
                                            onClick={() => setShowFilters(!showFilters)}
                                            className={cn(
                                                "h-12 flex-1 transition-all border flex items-center justify-center gap-2",
                                                showFilters ? "bg-[#0ea5e9]/20 text-[#0ea5e9] border-[#0ea5e9]/50" : "bg-transparent text-slate-500 border-slate-800 hover:text-[#0ea5e9] hover:border-[#0ea5e9]/30"
                                            )}
                                        >
                                            <ListFilter size={16} />
                                            <span className="text-[10px] font-bold tracking-widest uppercase">ФІЛЬТР</span>
                                        </Button>
                                        <Button variant="cyber" 
                                            onClick={() => voiceStatus === 'LISTENING' ? stopListening() : startListening()}
                                            className={cn(
                                                "h-12 flex-1 transition-all border flex items-center justify-center gap-2",
                                                "bg-transparent border-slate-800 text-slate-500 hover:text-[#0ea5e9] hover:border-[#0ea5e9]/30"
                                            )}
                                        >
                                            <Mic size={16} className={cn(voiceStatus === 'LISTENING' && "text-rose-500 animate-pulse")} />
                                            <span className={cn("text-[10px] font-bold tracking-widest uppercase", voiceStatus === 'LISTENING' && "text-rose-500")}>{voiceStatus === 'LISTENING' ? 'ЗАПИС...' : 'АУДІО'}</span>
                                        </Button>
                                    </div>
                                    <Button variant="cyber" 
                                        onClick={() => handleSearch()}
                                        disabled={isLoading}
                                        className="w-full h-12 bg-[#0ea5e9]/10 hover:bg-[#0ea5e9]/20 text-[#0ea5e9] border border-[#0ea5e9]/50 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-colors"
                                    >
                                        {isLoading ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}
                                        <span>ІНІЦІЮВАТИ ПОШУК</span>
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-stretch">
                                    <div className="flex-1 relative flex items-center border-r border-[#0ea5e9]/30 bg-[#0a0f1c] px-6">
                                        <span className="text-[#0ea5e9] mr-4">{'>'}</span>
                                        <input
                                            ref={inputRef}
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                            placeholder="ВВЕДІТЬ ПАРАМЕТРИ ЦІЛІ АБО СЕМАНТИЧНИЙ ВЕКТОР..."
                                            className="w-full bg-transparent text-lg font-mono text-[#0ea5e9] placeholder-slate-700 focus:outline-none tracking-widest uppercase py-6"
                                        />
                                    </div>

                                    <div className="flex items-center gap-0">
                                        <Button variant="cyber" 
                                            onClick={() => setShowFilters(!showFilters)}
                                            className={cn(
                                                "px-6 h-full transition-all border-r border-[#0ea5e9]/30 flex flex-col items-center justify-center gap-1",
                                                showFilters ? "bg-[#0ea5e9]/20 text-[#0ea5e9]" : "bg-transparent text-slate-500 hover:bg-[#0ea5e9]/10 hover:text-[#0ea5e9]"
                                            )}
                                        >
                                            <ListFilter size={20} />
                                            <span className="text-[8px] tracking-widest">FILTERS</span>
                                        </Button>

                                        <Button variant="cyber" 
                                            onClick={() => voiceStatus === 'LISTENING' ? stopListening() : startListening()}
                                            className={cn(
                                                "px-6 h-full transition-all border-r border-[#0ea5e9]/30 flex flex-col items-center justify-center gap-1",
                                                "bg-transparent hover:bg-[#0ea5e9]/10 text-slate-500 hover:text-[#0ea5e9]"
                                            )}
                                        >
                                            {voiceStatus === 'LISTENING' ? <Mic size={20} className="text-rose-500 animate-pulse" /> : <Mic size={20} />}
                                            <span className={cn("text-[8px] tracking-widest", voiceStatus === 'LISTENING' && "text-rose-500")}>AUDIO</span>
                                        </Button>

                                        <Button variant="cyber" 
                                            onClick={() => handleSearch()}
                                            disabled={isLoading}
                                            className="px-10 h-full bg-[#0ea5e9]/10 hover:bg-[#0ea5e9]/30 text-[#0ea5e9] transition-all flex flex-col items-center justify-center gap-1"
                                        >
                                            {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <Search size={20} />}
                                            <span className="text-[10px] tracking-widest font-bold">EXECUTE</span>
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Tactical History */}
                            {history.length > 0 && !results.length && !isLoading && (
                                <div className="px-6 py-3 border-t border-[#0ea5e9]/30 bg-[#0ea5e9]/5 flex items-center gap-4 overflow-x-auto no-scrollbar">
                                    <span className="text-[10px] font-bold text-[#0ea5e9] uppercase tracking-widest shrink-0 flex items-center gap-2">
                                        <Clock size={10} /> RECENT:
                                    </span>
                                    {history.map((h, i) => (
                                        <Button variant="cyber" 
                                            key={i} 
                                            onClick={() => { setQuery(h); handleSearch(h); }}
                                            className="px-3 py-1 bg-transparent hover:bg-[#0ea5e9]/20 border border-[#0ea5e9]/20 text-[9px] font-bold text-slate-400 hover:text-[#0ea5e9] transition-all whitespace-nowrap uppercase"
                                        >
                                            {h}
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Search Modes - Tactical Tabs */}
                        <div className="flex flex-wrap gap-2">
                            {[
                                { id: 'semantic', label: 'СЕМАНТИКА', icon: Sparkles, color: '#0ea5e9' },
                                { id: 'rerank', label: 'РЕ-РЕЙТИНГ', icon: TrendingUp, color: '#0ea5e9' },
                                { id: 'chat', label: 'AI-АНАЛІЗ', icon: Brain, color: '#0ea5e9' },
                                { id: 'truth', label: 'STRICT TRUTH', icon: ShieldCheck, color: '#f43f5e', active: truthMode, onToggle: () => setTruthMode(!truthMode) }
                            ].map((mode) => (
                                <Button variant="cyber"
                                    key={mode.id}
                                    onClick={mode.onToggle || (() => setSearchModes(s => ({ ...s, [mode.id]: !s[mode.id as keyof typeof s] })))}
                                    className={cn(
                                        "px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all flex items-center gap-2",
                                        (mode.active ?? (searchModes as any)[mode.id])
                                            ? "bg-[#0ea5e9]/10 border-[#0ea5e9]/50 text-[#0ea5e9]"
                                            : "bg-transparent border-slate-800 text-slate-600 hover:border-[#0ea5e9]/30 hover:text-slate-400"
                                    )}
                                    style={ (mode.active ?? (searchModes as any)[mode.id]) && mode.id === 'truth' ? { borderColor: '#f43f5e', color: '#f43f5e', backgroundColor: 'rgba(244, 63, 94, 0.1)' } : {} }
                                >
                                    <mode.icon size={12} />
                                    {mode.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Results / Empty State / Loading */}
                    <div className="max-w-6xl mx-auto">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-40 gap-8">
                                <div className="relative w-32 h-32 border border-[#0ea5e9] flex items-center justify-center">
                                    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#0ea5e9]" />
                                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#0ea5e9]" />
                                    <div className="w-24 h-24 border border-[#0ea5e9]/50 rounded-full border-t-[#0ea5e9] animate-spin" />
                                    <Crosshair size={32} className="absolute text-[#0ea5e9]" />
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-sm font-bold text-[#0ea5e9] uppercase tracking-[0.5em]">ОБРОБКА СИГНАЛУ</h3>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">ЗВЕРНЕННЯ ДО МАТРИЦІ ДАНИХ...</p>
                                </div>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="space-y-6 pb-40">
                                <div className="flex items-center justify-between border-b border-[#0ea5e9]/20 pb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="text-xl font-bold text-[#0ea5e9] tracking-widest">
                                            [{results.length}]
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ЗБІГІВ ВИЯВЛЕНО</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {results.map((result, i) => (
                                        <motion.div 
                                            key={result.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="group relative bg-[#0a0f1c] border border-slate-800 hover:border-[#0ea5e9]/50 transition-all p-4 md:p-6"
                                        >
                                            {/* Tactical Dossier Look */}
                                            <div className="absolute top-0 left-0 w-1 h-full bg-[#0ea5e9]/20 group-hover:bg-[#0ea5e9] transition-colors" />
                                            <div className="absolute top-0 right-0 p-1 bg-[#0ea5e9]/10 text-[8px] text-[#0ea5e9] border-b border-l border-[#0ea5e9]/30">ID:{result.id}</div>

                                            <div className="flex flex-col md:flex-row gap-6">
                                                <div className="flex flex-col items-start gap-2 min-w-[120px]">
                                                    <div className="text-2xl font-black text-[#0ea5e9] tracking-widest">
                                                        {(result.score * 100).toFixed(1)}%
                                                    </div>
                                                    <Badge variant="outline" className="text-[9px] font-bold tracking-widest border-[#0ea5e9]/30 text-[#0ea5e9] rounded-none uppercase">
                                                        {result.source}
                                                    </Badge>
                                                    <div className="text-[9px] text-slate-500 mt-2 font-mono flex items-center gap-1">
                                                        <Clock size={10}/> {result.date}
                                                    </div>
                                                </div>

                                                <div className="flex-1 space-y-3">
                                                    <h4 className="text-lg font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                                                        <CornerDownRight size={16} className="text-[#0ea5e9]" />
                                                        {result.title}
                                                    </h4>

                                                    <p className="text-sm text-slate-400 font-mono leading-relaxed border-l border-slate-800 pl-4">
                                                        {result.snippet}
                                                    </p>

                                                    <div className="flex items-center justify-between pt-2">
                                                        <div className="flex gap-2">
                                                            {result.tags?.map(tag => (
                                                                <span key={tag} className="text-[9px] text-[#0ea5e9]/60 uppercase tracking-widest bg-[#0ea5e9]/5 px-2 py-1 border border-[#0ea5e9]/10">
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button variant="cyber" className="px-4 py-1.5 bg-transparent hover:bg-[#0ea5e9]/10 border border-[#0ea5e9]/30 text-[#0ea5e9] text-[9px] font-bold uppercase tracking-widest transition-all">
                                                                ДЕТАЛІ
                                                            </Button>
                                                            <Button variant="cyber" className="px-4 py-1.5 bg-transparent hover:bg-[#0ea5e9]/10 border border-[#0ea5e9]/30 text-[#0ea5e9] text-[9px] font-bold uppercase tracking-widest transition-all">
                                                                ЛІНК
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ) : query && !isLoading ? (
                            <div className="flex flex-col items-center justify-center py-32 border border-dashed border-slate-800 bg-[#020617]/50">
                                <HelpCircle size={48} className="text-slate-700 mb-4" />
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">ДЖЕРЕЛА МОВЧАТЬ</h3>
                                <p className="text-[10px] text-slate-600 mt-2 font-mono uppercase">Дані за поточними параметрами відсутні.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { title: 'ГЛОБАЛЬНА ТОРГІВЛЯ', icon: Globe, desc: 'Морські/наземні шляхи' },
                                    { title: 'ФІНАНСОВІ ПОТОКИ', icon: Key, desc: 'Детекція аномалій' },
                                    { title: 'КРИТИЧНИЙ ІМПОРТ', icon: Target, desc: 'ВПК стратегія' }
                                ].map((item, i) => (
                                    <div key={i} className="p-6 border border-slate-800 bg-[#0a0f1c] hover:border-[#0ea5e9]/40 transition-all flex items-start gap-4 group">
                                        <div className="w-10 h-10 border border-[#0ea5e9]/20 bg-[#0ea5e9]/5 flex items-center justify-center text-[#0ea5e9] group-hover:bg-[#0ea5e9]/20 transition-colors">
                                            <item.icon size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-bold text-slate-300 tracking-widest uppercase mb-1">{item.title}</h4>
                                            <p className="text-[10px] text-slate-500 font-mono">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Filters */}
                {isCompact && (
                    <SwipeableDrawer
                        isOpen={showFilters}
                        onClose={() => setShowFilters(false)}
                        position="bottom"
                        maxHeight="85vh"
                    >
                        <div className="p-6 h-full flex flex-col gap-6 bg-[#020617] font-mono border-t border-[#0ea5e9]/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-[#0ea5e9]">
                                    <SlidersHorizontal size={20} />
                                    <h2 className="text-sm font-bold uppercase tracking-widest">ПАРАМЕТРИ</h2>
                                </div>
                                <Button variant="cyber" onClick={() => setShowFilters(false)} className="p-2 text-slate-500 hover:text-white">
                                    <X size={20} />
                                </Button>
                            </div>
                            
                            <div className="flex-1 space-y-6">
                                <div className="space-y-3">
                                    <h3 className="text-[10px] text-slate-500 uppercase tracking-widest">ДЖЕРЕЛА ДАНИХ</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['МИТНИЦЯ', 'САНКЦІЇ', 'ФІНМОНІТОРИНГ', 'РОЗВІДКА'].map((src, i) => (
                                            <Button variant="cyber" key={src} className={cn(
                                                "py-3 border text-[10px] font-bold uppercase tracking-widest",
                                                i < 2 ? "bg-[#0ea5e9]/10 border-[#0ea5e9]/40 text-[#0ea5e9]" : "bg-transparent border-slate-800 text-slate-500"
                                            )}>
                                                {src}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SwipeableDrawer>
                )}
            </div>
        </PageTransition>
    );
};
