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
    ChevronDown, ExternalLink, Layers, Database, AlertCircle, Volume2, VolumeX, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { useVoiceControl, InteractionStatus } from '../hooks/useVoiceControl';
import { HoloContainer } from '../components/HoloContainer';
import { CyberOrb } from '../components/CyberOrb';
import { TacticalCard } from '../components/TacticalCard';
import { StatusIndicator } from '../components/StatusIndicator';
import { ViewHeader } from '../components/ViewHeader';

const IS_TRUTH_ONLY_MODE = true;

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

// Feedback Actions for RLHF
const FeedbackActions: React.FC<{
    resultId: string;
    onFeedback: (type: 'positive' | 'negative') => void;
}> = ({ resultId, onFeedback }) => {
    const [status, setStatus] = useState<'none' | 'positive' | 'negative'>('none');

    const handleVote = (type: 'positive' | 'negative') => {
        setStatus(type);
        onFeedback(type);
    };

    return (
        <div className="flex items-center gap-1">
            <button
                onClick={() => handleVote('positive')}
                className={`p-1.5 rounded hover:bg-green-500/20 transition-colors ${status === 'positive' ? 'text-green-500' : 'text-slate-600'}`}
            >
                <TrendingUp className={`w-3.5 h-3.5 ${status === 'positive' ? 'fill-current' : ''}`} />
            </button>
            <button
                onClick={() => handleVote('negative')}
                className={`p-1.5 rounded hover:bg-red-500/20 transition-colors ${status === 'negative' ? 'text-red-500' : 'text-slate-600'}`}
            >
                <TrendingUp className={`w-3.5 h-3.5 rotate-180 ${status === 'negative' ? 'fill-current' : ''}`} />
            </button>
        </div>
    );
};

// Search Result Card
const ResultCard: React.FC<{
    result: SearchResult;
    rank: number;
    onExplain: () => void;
    onSummarize: () => void;
    onRead: () => void;
}> = ({ result, rank, onExplain, onSummarize, onRead }) => {
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
                      flex items-center justify-center text-xs font-bold text-black shadow-lg shadow-cyan-500/20 z-10">
                {rank}
            </div>

            <HoloContainer variant={result.searchType === 'chat' ? 'purple' : 'blue'} className="p-4">
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

                        {/* RLFH Feedback */}
                        <div className="ml-auto">
                            <FeedbackActions
                                resultId={result.id}
                                onFeedback={(type) => api.search.submitFeedback(result.id, type === 'positive' ? 'up' : 'down')}
                            />
                        </div>
                    </div>

                    {/* Snippet with highlight */}
                    <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                        <span dangerouslySetInnerHTML={{
                            __html: (result.snippet || '').replace(
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
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 text-purple-400
                           rounded-lg text-xs font-medium hover:bg-purple-500/20 transition-colors"
                                >
                                    <Brain className="w-3.5 h-3.5" />
                                    Аналіз
                                </button>
                                <button
                                    onClick={onSummarize}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/10 text-teal-400
                           rounded-lg text-xs font-medium hover:bg-teal-500/20 transition-colors"
                                >
                                    <FileText className="w-3.5 h-3.5" />
                                    Стисло
                                </button>
                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 text-slate-400
                                 rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors">
                                    <Share2 className="w-3.5 h-3.5" />
                                    Поширити
                                </button>
                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 text-slate-400
                                 rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors">
                                    <Star className="w-3.5 h-3.5" />
                                    Зберегти
                                </button>
                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 text-slate-400
                                 rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors">
                                    <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={onRead} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 text-slate-400
                                 rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors">
                                    <Volume2 className="w-3.5 h-3.5" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </HoloContainer>
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
            className="fixed right-0 top-0 bottom-0 w-[400px] bg-slate-950/90 backdrop-blur-2xl border-l border-slate-800
                 shadow-2xl shadow-black/80 z-50 overflow-y-auto"
        >
            <HoloContainer className="h-full border-none">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <CyberOrb size={40} color="#a855f7" />
                                <Brain className="w-5 h-5 text-purple-200 absolute inset-0 m-auto" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white uppercase tracking-wider text-sm">Нейронний Аналіз</h3>
                                <p className="text-[10px] text-slate-500 font-mono">ДВИГУН ПОЯСНЕНЬ XAI</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Score breakdown */}
                    <div className="space-y-4 mb-6">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                            <div className="text-xs text-green-400 mb-1">Покриття Запиту</div>
                            <div className="text-2xl font-bold text-green-400">
                                {(explanation.query_coverage * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs text-slate-400 mt-1">{explanation.interpretation}</div>
                        </div>
                    </div>

                    {/* Feature importance */}
                    <div className="mb-6">
                        <h4 className="text-sm font-medium text-slate-400 mb-3">Важливість Токенів (ECharts)</h4>
                        <ReactECharts
                            option={{
                                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                                grid: { top: 10, bottom: 20, left: 80, right: 20 },
                                xAxis: { type: 'value', show: false },
                                yAxis: {
                                    type: 'category',
                                    data: (explanation.top_features || []).slice(0, 10).map(f => f.token),
                                    axisLabel: { color: '#94a3b8' },
                                    axisLine: { show: false },
                                    axisTick: { show: false }
                                },
                                series: [{
                                    data: (explanation.top_features || []).slice(0, 10).map(f => f.importance),
                                    type: 'bar',
                                    itemStyle: {
                                        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                                            { offset: 0, color: '#a855f7' },
                                            { offset: 1, color: '#ec4899' }
                                        ]),
                                        borderRadius: [0, 4, 4, 0]
                                    },
                                }]
                            }}
                            style={{ height: '300px' }}
                            theme="dark"
                        />
                    </div>

                    {/* SHAP visualization placeholder */}
                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <div className="text-xs text-slate-500 mb-2">Значення SHAP</div>
                        <div className="h-40 flex items-center justify-center text-slate-600">
                            <Sparkles className="w-8 h-8 animate-pulse" />
                        </div>
                    </div>
                </div>
            </HoloContainer>
        </motion.div>
    );
};

// Main Search Console Component
const SearchConsole: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [isMuted, setIsMuted] = useState(false);
    const [searchModes, setSearchModes] = useState({
        semantic: true,
        rerank: true,
        explain: false,
        image: false,
        voice: false,
        chat: false
    });
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<SearchFilters>({});
    const [selectedExplanation, setSelectedExplanation] = useState<XAIExplanation | null>(null);
    const [selectedSummary, setSelectedSummary] = useState<{ summary: string; cached: boolean; model: string; word_count: number } | null>(null);
    const [searchTime, setSearchTime] = useState<number | null>(null);
    const [history, setHistory] = useState<string[]>(JSON.parse(localStorage.getItem('search_history') || '[]'));
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        localStorage.setItem('search_history', JSON.stringify(history.slice(0, 10)));
    }, [history]);

    const addToHistory = (q: string) => {
        if (!q.trim()) return;
        setHistory(prev => [q, ...prev.filter(h => h !== q)].slice(0, 10));
    };

    const [voiceStatus, setVoiceStatus] = useState<InteractionStatus>('IDLE');
    const { startListening, stopListening, speak } = useVoiceControl(voiceStatus, setVoiceStatus, (text) => {
        setQuery(text);
        // Optional: Auto-search after voice input?
        // handleSearch();
    });

    const handleVoiceToggle = () => {
        if (voiceStatus === 'LISTENING') {
            stopListening();
        } else {
            startListening();
        }
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
                    title: 'Аналітика ШІ Nexus',
                    snippet: response.answer, // Use Markdown
                    score: 1.0,
                    semanticScore: 1.0,
                    source: 'Nexus AI',
                    searchType: 'chat',
                    category: 'ШІ',
                    metadata: { mode: response.mode, trace: response.trace }
                } as any]);

                setIsLoading(false);
                setSearchTime(Date.now() - startTime);

                if (searchModes.voice || searchModes.chat) {
                    if (!isMuted) speak(response.answer);
                }
                return;
            }

            // Real API Call
            const apiResults = await api.search.query({
                q: query,
                rerank: searchModes.rerank,
                mode: searchModes.semantic ? 'hybrid' : 'text',
                filters: showFilters ? filters : undefined
            });

            // Adapt results
            const formattedResults: SearchResult[] = Array.isArray(apiResults) ? apiResults.map((r: any) => ({
                id: r.id || `result-${Date.now()}`,
                title: r.title || 'Об\'єкт без назви',
                snippet: r.snippet || r.content?.substring(0, 300) || 'Контент обробляється нейромережею...',
                score: r.score || 0,
                semanticScore: r.semantic_score,
                source: r.source || 'Ядро Системи',
                category: r.category,
                date: r.date,
                searchType: r.search_type || 'hybrid'
            })) : [];

            setResults(formattedResults);
        } catch (error) {
            console.error("Search failed:", error);
            // Mock fallback if API fails completely to prevent empty screen during tests
            if (IS_TRUTH_ONLY_MODE) { // Only mocked if truth mode logic fails
                // alert("Search failed: " + error);
            }
        } finally {
            setSearchTime(Date.now() - startTime);
            setIsLoading(false);
        }
    }, [query, showFilters, filters, searchModes, isMuted]);

    const handleExplain = async (result: SearchResult) => {
        try {
            const explanation = await api.ml.explain(query, result.id, result.snippet);
            setSelectedExplanation(explanation);
        } catch (e) {
            console.error("Explain failed:", e);
        }
    };

    const handleSummarize = async (result: SearchResult) => {
        try {
            const summary = await api.ml.getDocumentSummary(result.id);
            setSelectedSummary(summary);
        } catch (e) {
            console.error("Summarize failed:", e);
            alert("Не вдалося створити резюме документа.");
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
        <div className="min-h-screen bg-transparent animate-in fade-in duration-700 pb-24">
            <ViewHeader
                title="СЕМАНТИЧНИЙ ПОШУК (SYNAPSE V45)"
                icon={<Search size={20} className="icon-3d-blue" />}
                breadcrumbs={['СИНАПСИС', 'ДОСЛІДЖЕННЯ', 'СЕМАНТИЧНИЙ ДВИГУН']}
                stats={[
                    { label: 'Індексація', value: '100% GOLD', icon: <Database size={12} />, color: 'primary' },
                    { label: 'Швидкість', value: searchTime ? `${searchTime}мс` : '0мс', icon: <Zap size={12} />, color: 'success' },
                    { label: 'Статус', value: 'АКТИВНИЙ', icon: <Brain size={12} />, color: 'success' },
                ]}
            />

            <main className="max-w-6xl mx-auto px-4 mt-12">
                <div className="relative group max-w-4xl mx-auto">
                    {/* Premium Search Bar */}
                    <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-blue-500/20 rounded-[32px] blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    <div className="relative flex flex-col bg-slate-950/80 backdrop-blur-2xl rounded-[32px] border border-white/10 shadow-2xl overflow-hidden">
                        <div className="flex items-center px-6 py-4">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`p-2 transition-colors ${showFilters ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                <Filter className="w-6 h-6" />
                            </button>

                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Введіть запит для семантичного аналізу..."
                                className="flex-1 bg-transparent px-4 py-4 text-xl text-white placeholder-slate-600 focus:outline-none font-display font-light"
                            />

                            <div className="flex items-center gap-3">
                                <button className="p-2 text-slate-500 hover:text-blue-400 transition-colors">
                                    <Image className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleVoiceToggle}
                                    className={`p-2 transition-colors ${voiceStatus === 'LISTENING' ? 'text-red-500 animate-pulse' : 'text-slate-500 hover:text-blue-400'}`}
                                >
                                    <Mic className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => { addToHistory(query); handleSearch(); }}
                                    disabled={isLoading}
                                    className="p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Search History Quick Chips */}
                        <AnimatePresence>
                            {history.length > 0 && !results.length && !isLoading && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="px-8 pb-4 flex flex-wrap gap-2 border-t border-white/5 pt-4"
                                >
                                    {history.map((h, i) => (
                                        <button
                                            key={i}
                                            onClick={() => { setQuery(h); setTimeout(handleSearch, 100); }}
                                            className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-[10px] text-slate-400 hover:text-white transition-all"
                                        >
                                            {h}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Mode Selectors */}
                    <div className="flex flex-wrap justify-center gap-3 mt-6">
                        <ModeChip
                            icon={<Sparkles className="w-3.5 h-3.5" />}
                            label="Семантичний"
                            active={searchModes.semantic}
                            onClick={() => setSearchModes(s => ({ ...s, semantic: !s.semantic }))}
                        />
                        <ModeChip
                            icon={<TrendingUp className="w-3.5 h-3.5" />}
                            label="Інтелектуальні Ваги"
                            active={searchModes.rerank}
                            onClick={() => setSearchModes(s => ({ ...s, rerank: !s.rerank }))}
                        />
                        <ModeChip
                            icon={<Brain className="w-3.5 h-3.5" />}
                            label="AI Пояснення"
                            active={searchModes.explain}
                            onClick={() => setSearchModes(s => ({ ...s, explain: !s.explain }))}
                        />
                        <ModeChip
                            icon={<MessageSquare className="w-3.5 h-3.5" />}
                            label="Чат Nexus"
                            active={searchModes.chat}
                            onClick={() => setSearchModes(s => ({ ...s, chat: !s.chat }))}
                        />
                    </div>
                </div>

                {/* Results Section */}
                <div className="mt-16 space-y-8">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-20 gap-6">
                            <CyberOrb size={80} color="#3b82f6" className="animate-pulse" />
                            <div className="text-xs text-slate-500 font-black uppercase tracking-[0.4em] animate-pulse">Генерація відповіді...</div>
                        </div>
                    )}

                    {!isLoading && results.length > 0 && (
                        <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
                            <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5">
                                <div className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                    Результати дослідження <span className="text-blue-500 ml-4 px-3 py-1 bg-blue-500/10 rounded-lg">{results.length} ОБ'ЄКТІВ</span>
                                </div>
                                <div className="flex gap-6">
                                    <button className="text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><TrendingUp size={16} /> Рейтинг</button>
                                    <button className="text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><Layers size={16} /> Групи</button>
                                </div>
                            </div>

                            <div className="space-y-6 max-w-4xl mx-auto">
                                {results.map((result, i) => (
                                    <ResultCard
                                        key={result.id}
                                        result={result}
                                        rank={i + 1}
                                        onExplain={() => handleExplain(result)}
                                        onSummarize={() => handleSummarize(result)}
                                        onRead={() => speak(result.snippet)}
                                    />
                                ))}
                            </div>

                            {/* Pagination v45 */}
                            <div className="flex justify-center items-center gap-6 mt-16 pb-20">
                                <button className="px-6 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white hover:border-slate-600 transition-all">Назад</button>
                                <div className="flex gap-2">
                                    {[1, 2, 3].map(p => (
                                        <div key={p} className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border transition-all cursor-pointer ${p === 1 ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}>{p}</div>
                                    ))}
                                </div>
                                <button className="px-6 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white hover:border-slate-600 transition-all">Вперед</button>
                            </div>
                        </div>
                    )}

                    {!isLoading && results.length === 0 && query && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-20"
                        >
                            <AlertCircle className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                            <h3 className="text-slate-400 font-display font-medium">Нічого не знайдено за вашим запитом.</h3>
                            <p className="text-xs text-slate-600 mt-2">Спробуйте змінити параметри пошуку або використати семантичний розширений режим.</p>
                        </motion.div>
                    )}
                </div>
            </main>

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
            </AnimatePresence>

            {/* Summary Modal */}
            <AnimatePresence>
                {
                    selectedSummary && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                            onClick={() => setSelectedSummary(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-teal-400" />
                                            <h3 className="text-lg font-semibold text-white">Резюме</h3>
                                        </div>
                                        <button onClick={() => setSelectedSummary(null)} className="text-slate-500 hover:text-white">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                            <p className="text-slate-300 leading-relaxed text-sm">
                                                {selectedSummary.summary}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <div className="flex gap-4">
                                                <span>Модель: <span className="text-teal-400">{selectedSummary.model || 'Невідома'}</span></span>
                                                {selectedSummary.cached && (
                                                    <span className="flex items-center gap-1 text-green-400">
                                                        <Zap className="w-3 h-3" /> Кеш
                                                    </span>
                                                )}
                                            </div>
                                            <span>{selectedSummary.word_count || 0} слів</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence>
        </div>
    );
};

export default SearchConsole;
