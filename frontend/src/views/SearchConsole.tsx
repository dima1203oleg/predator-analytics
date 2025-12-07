/**
 * Search Console - Next Generation Semantic Search UI
 * 
 * Крутий, сучасний інтерфейс для семантичного пошуку:
 * - Величезний пошуковий рядок з градієнтним бордером
 * - XAI пояснення в один клік
 * - Dataset Studio (Premium)
 * - Мультимодальний пошук
 * - Темна тема з неоновими акцентами
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Sparkles, Brain, Image, Mic, Star, Share2, Copy,
    ChevronRight, Filter, X, BookOpen, Download, Zap,
    MessageSquare, FileText, Clock, TrendingUp, Settings,
    ChevronDown, ExternalLink, Layers, Database, AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

// Types
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
}

interface XAIExplanation {
    method: string;
    query_coverage: number;
    top_features: { token: string; importance: number }[];
    interpretation: string;
}

interface SearchFilters {
    dateFrom?: string;
    dateTo?: string;
    category?: string;
    source?: string;
    language?: string;
}

// Chip component for search modes
const ModeChip: React.FC<{
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
    premium?: boolean;
}> = ({ icon, label, active, onClick, premium }) => (
    <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`
      flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
      transition-all duration-200 border
      ${active
                ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border-cyan-500/50 text-cyan-400'
                : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-slate-300 hover:border-slate-600'
            }
      ${premium ? 'relative' : ''}
    `}
    >
        {icon}
        <span>{label}</span>
        {premium && (
            <span className="absolute -top-1 -right-1 px-1 py-0.5 bg-amber-500 text-[8px] text-black font-bold rounded">
                PRO
            </span>
        )}
    </motion.button>
);

// Search Result Card
const ResultCard: React.FC<{
    result: SearchResult;
    rank: number;
    onExplain: () => void;
    onSummarize: () => void;
}> = ({ result, rank, onExplain, onSummarize }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rank * 0.05 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`group relative p-4 rounded-xl border border-slate-800/50 transition-all duration-300
                 ${result.searchType === 'chat'
                    ? 'bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-900/50 hover:border-cyan-500/30 hover:bg-slate-900/80'}`}
        >
            {/* Rank indicator */}
            <div className="absolute -left-3 top-4 w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 
                      flex items-center justify-center text-xs font-bold text-black shadow-lg shadow-cyan-500/20">
                {rank}
            </div>

            {/* Content */}
            <div className="ml-4">
                {/* Title */}
                <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors cursor-pointer">
                    {result.title}
                </h3>

                {/* Meta */}
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        <span className="text-green-400 font-mono">{(result.score * 100).toFixed(0)}%</span>
                    </span>
                    {result.date && (
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {result.date}
                        </span>
                    )}
                    <span className="px-2 py-0.5 bg-slate-800 rounded text-slate-400">
                        {result.source}
                    </span>
                    {result.category && (
                        <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded">
                            #{result.category}
                        </span>
                    )}
                    <span className={`px-2 py-0.5 rounded ${result.searchType === 'hybrid' ? 'bg-purple-500/10 text-purple-400' :
                        result.searchType === 'semantic' ? 'bg-teal-500/10 text-teal-400' :
                            'bg-slate-700 text-slate-400'
                        }`}>
                        {result.searchType}
                    </span>
                </div>

                {/* Snippet with highlight */}
                <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                    <span dangerouslySetInnerHTML={{
                        __html: result.snippet.replace(
                            /\b(AI|ML|нейронні|пошук|semantic)\b/gi,
                            '<mark class="bg-gradient-to-r from-cyan-500/30 to-teal-500/30 text-cyan-300 px-1 rounded">$1</mark>'
                        )
                    }} />
                </p>

                {/* Actions */}
                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="flex items-center gap-2 mt-4"
                        >
                            <button
                                onClick={onExplain}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 text-purple-400 
                           rounded-lg text-xs font-medium hover:bg-purple-500/20 transition-colors"
                            >
                                <Brain className="w-3.5 h-3.5" />
                                Why this result?
                            </button>
                            <button
                                onClick={onSummarize}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/10 text-teal-400 
                           rounded-lg text-xs font-medium hover:bg-teal-500/20 transition-colors"
                            >
                                <FileText className="w-3.5 h-3.5" />
                                Summarize
                            </button>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 text-slate-400 
                                 rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors">
                                <Share2 className="w-3.5 h-3.5" />
                                Share
                            </button>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 text-slate-400 
                                 rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors">
                                <Star className="w-3.5 h-3.5" />
                                Save
                            </button>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 text-slate-400 
                                 rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors">
                                <Copy className="w-3.5 h-3.5" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

// XAI Explanation Panel
const XAIPanel: React.FC<{
    explanation: XAIExplanation | null;
    onClose: () => void;
}> = ({ explanation, onClose }) => {
    if (!explanation) return null;

    return (
        <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="fixed right-0 top-0 bottom-0 w-96 bg-slate-900 border-l border-slate-700
                 shadow-2xl shadow-black/50 z-50 overflow-y-auto"
        >
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-purple-400" />
                        <h3 className="font-semibold text-white">Чому цей результат?</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Score breakdown */}
                <div className="space-y-4 mb-6">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                        <div className="text-xs text-green-400 mb-1">Query Coverage</div>
                        <div className="text-2xl font-bold text-green-400">
                            {(explanation.query_coverage * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-slate-400 mt-1">{explanation.interpretation}</div>
                    </div>
                </div>

                {/* Feature importance */}
                <div className="mb-6">
                    <h4 className="text-sm font-medium text-slate-400 mb-3">Token Importance</h4>
                    <div className="space-y-2">
                        {explanation.top_features.slice(0, 8).map((feature, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="text-xs font-mono text-slate-400 w-24 truncate">
                                    {feature.token}
                                </span>
                                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${feature.importance * 100}%` }}
                                        transition={{ delay: i * 0.1 }}
                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                    />
                                </div>
                                <span className="text-xs font-mono text-purple-400 w-10 text-right">
                                    {feature.importance.toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SHAP visualization placeholder */}
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="text-xs text-slate-500 mb-2">SHAP Values</div>
                    <div className="h-40 flex items-center justify-center text-slate-600">
                        <Sparkles className="w-8 h-8 animate-pulse" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Main Search Console Component
const SearchConsole: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [searchModes, setSearchModes] = useState({
        semantic: true,
        rerank: true,
        explain: false,
        image: false,
        voice: false,
        chat: false
    });
    const [showFilters, setShowFilters] = useState(true);
    const [filters, setFilters] = useState<SearchFilters>({});
    const [selectedExplanation, setSelectedExplanation] = useState<XAIExplanation | null>(null);
    const [searchTime, setSearchTime] = useState<number | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleVoice = () => {
        if (isListening) return; // Already listening handle elsewhere if needed
        setIsListening(true);

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech API not supported in this browser.");
            setIsListening(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'uk-UA';
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
            const text = event.results[0][0].transcript;
            setQuery(text);
            setIsListening(false);
            // Auto-trigger search/chat if confident?
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognition.start();
    };

    const handleSearch = useCallback(async () => {
        if (!query.trim()) return;

        setIsLoading(true);
        setResults([]); // Clear previous
        const startTime = Date.now();

        try {
            // Chat Mode
            if (searchModes.chat) {
                const response = await api.nexus.chat(query);
                setResults([{
                    id: 'nexus-reply',
                    title: 'Nexus Hivemind',
                    snippet: response.answer, // Use Markdown
                    type: 'chat',
                    score: 1.0,
                    semanticScore: 1.0, // Assuming a perfect semantic score for chat responses
                    source: 'Nexus AI',
                    searchType: 'chat',
                    metadata: { mode: response.mode, trace: response.trace }
                } as SearchResult]); // Cast to SearchResult
                setIsLoading(false);
                setSearchTime(Date.now() - startTime);
                return;
            }

            // Real API Call
            const apiResults = await api.search.query({
                q: query,
                filters: showFilters ? filters : undefined
            });

            // Adapt results
            const formattedResults: SearchResult[] = Array.isArray(apiResults) ? apiResults.map((r: any) => ({
                id: r.id || String(Math.random()),
                title: r.title || 'Untitled Document',
                snippet: r.snippet || r.content?.substring(0, 300) || 'No preview available',
                score: r.score || 0,
                semanticScore: r.semantic_score,
                source: r.source || 'Internal',
                category: r.category,
                date: r.date,
                searchType: r.search_type || 'hybrid'
            })) : [];

            setResults(formattedResults);
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setSearchTime(Date.now() - startTime);
            setIsLoading(false);
        }
    }, [query, showFilters, filters]);

    const handleExplain = async (result: SearchResult) => {
        try {
            // Call ML Explain API
            const explanation = await api.ml.explain(query, result.id, result.snippet);
            setSelectedExplanation(explanation);
        } catch (e) {
            console.error("Explain failed:", e);
        }
    };

    const handleSummarize = async (result: SearchResult) => {
        try {
            // Call ML Summarize API (Placeholder alert for now)
            const summary = await api.ml.summarize(result.snippet);
            alert(`Summary: ${summary.summary}`);
        } catch (e) {
            console.error("Summarize failed:", e);
        }
    };

    // Keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
                e.preventDefault();
                inputRef.current?.focus();
            }
            if (e.key === 'Enter' && document.activeElement === inputRef.current) {
                handleSearch();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSearch]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-14 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 z-40">
                <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-black" />
                        </div>
                        <span className="font-bold text-white">Semantic Search Platform</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                            Docs
                        </button>
                        <button className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                            API
                        </button>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 
                          flex items-center justify-center text-xs font-bold text-white cursor-pointer">
                            DM
                        </div>
                    </div>
                </div>
            </header>

            <main className="pt-14 flex">
                {/* Filters Sidebar */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 280, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="fixed left-0 top-14 bottom-0 border-r border-slate-800/50 bg-slate-950/50 
                         backdrop-blur-xl overflow-y-auto z-30"
                        >
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-white">Фільтри</h3>
                                    <button onClick={() => setShowFilters(false)} className="text-slate-500 hover:text-white">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Date filter */}
                                <div className="mb-6">
                                    <label className="text-xs text-slate-500 mb-2 block">Дата</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="2024"
                                            className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg 
                                 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                                        />
                                        <span className="text-slate-500 self-center">—</span>
                                        <input
                                            type="text"
                                            placeholder="2025"
                                            className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg 
                                 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                                        />
                                    </div>
                                </div>

                                {/* Category filter */}
                                <div className="mb-6">
                                    <label className="text-xs text-slate-500 mb-2 block">Категорія</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['AI', 'Наука', 'Новини', 'Код', 'Бізнес'].map(cat => (
                                            <button
                                                key={cat}
                                                className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg 
                                   text-xs text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors"
                                            >
                                                #{cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Source filter */}
                                <div className="mb-6">
                                    <label className="text-xs text-slate-500 mb-2 block">Джерело</label>
                                    <div className="space-y-2">
                                        {['arXiv', 'GitHub', 'Medium', 'Google Drive', 'Notion'].map(src => (
                                            <label key={src} className="flex items-center gap-2 cursor-pointer group">
                                                <input type="checkbox" className="rounded border-slate-600 bg-slate-800 text-cyan-500" />
                                                <span className="text-sm text-slate-400 group-hover:text-white transition-colors">{src}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Language filter */}
                                <div className="mb-6">
                                    <label className="text-xs text-slate-500 mb-2 block">Мова</label>
                                    <select className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg 
                                     text-sm text-white focus:outline-none focus:border-cyan-500/50">
                                        <option>Усі мови</option>
                                        <option>Українська</option>
                                        <option>English</option>
                                    </select>
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* Main content */}
                <div className={`flex-1 transition-all duration-300 ${showFilters ? 'ml-[280px]' : 'ml-0'}`}>
                    {/* Search area */}
                    <div className="py-12 px-4">
                        <div className="max-w-4xl mx-auto">
                            {/* Giant search input */}
                            <div className="relative group">
                                {/* Gradient border effect */}
                                <div className="absolute -inset-[2px] bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-500 
                                rounded-2xl opacity-50 group-hover:opacity-100 blur-sm transition-opacity" />

                                <div className="relative flex items-center bg-slate-900 rounded-2xl border border-slate-700/50">
                                    {/* Filter toggle */}
                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className="pl-5 pr-3 py-6 text-slate-500 hover:text-cyan-400 transition-colors"
                                    >
                                        <Filter className="w-6 h-6" />
                                    </button>

                                    {/* Input */}
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Запитай що завгодно… або встав картинку"
                                        className="flex-1 py-6 bg-transparent text-xl text-white placeholder-slate-500 
                               focus:outline-none font-light"
                                    />

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-2 pr-5">
                                        <button className="p-2 text-slate-500 hover:text-cyan-400 transition-colors">
                                            <Image className="w-5 h-5" />
                                        </button>

                                        <button
                                            onClick={handleVoice}
                                            className={`p-2 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-500 hover:text-cyan-400'}`}
                                        >
                                            <Mic className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={handleSearch}
                                            disabled={isLoading}
                                            className="ml-2 p-3 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl 
                                 text-black hover:shadow-lg hover:shadow-cyan-500/25 transition-all 
                                 disabled:opacity-50"
                                        >
                                            {isLoading ? (
                                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Search className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Mode chips */}
                            <div className="flex items-center justify-center gap-2 mt-6">
                                <ModeChip
                                    icon={<Sparkles className="w-3.5 h-3.5" />}
                                    label="Semantic"
                                    active={searchModes.semantic}
                                    onClick={() => setSearchModes(s => ({ ...s, semantic: !s.semantic }))}
                                />
                                <ModeChip
                                    icon={<TrendingUp className="w-3.5 h-3.5" />}
                                    label="Rerank"
                                    active={searchModes.rerank}
                                    onClick={() => setSearchModes(s => ({ ...s, rerank: !s.rerank }))}
                                />
                                <ModeChip
                                    icon={<Brain className="w-3.5 h-3.5" />}
                                    label="Explain"
                                    active={searchModes.explain}
                                    onClick={() => setSearchModes(s => ({ ...s, explain: !s.explain }))}
                                />
                                <ModeChip
                                    icon={<MessageSquare className="w-3.5 h-3.5" />}
                                    label="Nexus Chat"
                                    active={searchModes.chat}
                                    onClick={() => setSearchModes(s => ({ ...s, chat: !s.chat }))}
                                />
                                <ModeChip
                                    icon={<Image className="w-3.5 h-3.5" />}
                                    label="Image"
                                    active={searchModes.image}
                                    onClick={() => setSearchModes(s => ({ ...s, image: !s.image }))}
                                    premium
                                />
                                <ModeChip
                                    icon={<Mic className="w-3.5 h-3.5" />}
                                    label="Voice"
                                    active={searchModes.voice}
                                    onClick={() => setSearchModes(s => ({ ...s, voice: !s.voice }))}
                                />
                            </div>

                            {/* Keyboard hint */}
                            <div className="text-center mt-4 text-xs text-slate-600">
                                Натисни <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">/</kbd> для фокусу
                            </div>
                        </div>
                    </div>

                    {/* Results */}
                    {results.length > 0 && (
                        <div className="px-4 pb-12">
                            <div className="max-w-4xl mx-auto">
                                {/* Results header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="text-sm text-slate-500">
                                        Знайдено <span className="text-white font-medium">{results.length}</span> результатів за{' '}
                                        <span className="text-cyan-400 font-mono">{searchTime}мс</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 text-slate-500 hover:text-white transition-colors">
                                            <Layers className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 text-slate-500 hover:text-white transition-colors">
                                            <FileText className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Results list */}
                                <div className="space-y-4">
                                    {results.map((result, i) => (
                                        <ResultCard
                                            key={result.id}
                                            result={result}
                                            rank={i + 1}
                                            onExplain={() => handleExplain(result)}
                                            onSummarize={() => handleSummarize(result)}
                                        />
                                    ))}
                                </div>

                                {/* Pagination */}
                                <div className="flex items-center justify-center gap-4 mt-8">
                                    <button className="px-4 py-2 bg-slate-800/50 text-slate-400 rounded-lg hover:bg-slate-800 transition-colors">
                                        Попередня
                                    </button>
                                    <span className="text-sm text-slate-500">Сторінка 1 з 42</span>
                                    <button className="px-4 py-2 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-colors">
                                        Наступна
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {results.length === 0 && !isLoading && (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 
                            flex items-center justify-center">
                                <Search className="w-10 h-10 text-slate-600" />
                            </div>
                            <h3 className="text-xl font-medium text-slate-400 mb-2">Почніть пошук</h3>
                            <p className="text-sm text-slate-600 max-w-md mx-auto">
                                Введіть запит, щоб знайти документи за допомогою семантичного пошуку з AI-поясненнями
                            </p>
                        </div>
                    )}
                </div>
            </main >

            {/* XAI Panel */}
            <AnimatePresence>
                {
                    selectedExplanation && (
                        <XAIPanel
                            explanation={selectedExplanation}
                            onClose={() => setSelectedExplanation(null)}
                        />
                    )
                }
            </AnimatePresence >
        </div >
    );
};

export default SearchConsole;
