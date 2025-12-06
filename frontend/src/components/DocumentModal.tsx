/**
 * Document Deep Dive Modal
 * 
 * Модальне вікно для детального перегляду документа:
 * - Повний текст з підсвіткою збігів
 * - AI-generated summary
 * - XAI пояснення
 * - Схожі документи
 * - Експорт в Notion/Google Drive
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, FileText, Brain, Sparkles, Share2, ExternalLink,
    Clock, Tag, Link2, ChevronRight, Copy, Check,
    BookOpen, TrendingUp, Users, Download
} from 'lucide-react';

interface DocumentData {
    id: string;
    title: string;
    content: string;
    source: string;
    category?: string;
    date?: string;
    author?: string;
    url?: string;
    score?: number;
}

interface SimilarDoc {
    id: string;
    title: string;
    score: number;
}

interface Props {
    document: DocumentData | null;
    query?: string;
    isOpen: boolean;
    onClose: () => void;
}

// Highlight matching terms in text
const highlightMatches = (text: string, query?: string): string => {
    if (!query) return text;

    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    let result = text;

    terms.forEach(term => {
        const regex = new RegExp(`(${term})`, 'gi');
        result = result.replace(regex, '<mark class="bg-cyan-500/30 text-cyan-300 px-0.5 rounded">$1</mark>');
    });

    return result;
};

const DocumentModal: React.FC<Props> = ({ document, query, isOpen, onClose }) => {
    const [summary, setSummary] = useState<string | null>(null);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'content' | 'summary' | 'similar'>('content');
    const [similarDocs, setSimilarDocs] = useState<SimilarDoc[]>([]);

    // Generate summary on demand
    const handleGenerateSummary = async () => {
        if (isSummarizing || !document) return;

        setIsSummarizing(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        setSummary(
            `Цей документ являє собою всебічний аналіз ${document.title.toLowerCase()}. ` +
            `Основні тези включають розгляд сучасних підходів до обробки даних, ` +
            `семантичного пошуку та машинного навчання. Автор наголошує на важливості ` +
            `гібридних методів, що поєднують keyword та vector search.`
        );
        setIsSummarizing(false);
    };

    // Load similar documents
    useEffect(() => {
        if (document) {
            setSimilarDocs([
                { id: '1', title: 'Порівняння методів векторизації тексту', score: 0.89 },
                { id: '2', title: 'OpenSearch vs Elasticsearch: Детальний огляд', score: 0.84 },
                { id: '3', title: 'Практичний гайд з Qdrant для semantic search', score: 0.78 },
            ]);
        }
    }, [document]);

    // Copy to clipboard
    const handleCopy = async () => {
        if (document) {
            await navigator.clipboard.writeText(document.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!document) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-4 md:inset-8 lg:inset-16 bg-slate-900 rounded-2xl border border-slate-700 
                       shadow-2xl shadow-black/50 z-50 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-cyan-500/10">
                                    <FileText className="w-6 h-6 text-cyan-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-white line-clamp-1">{document.title}</h2>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {document.date || 'Unknown date'}
                                        </span>
                                        <span className="px-2 py-0.5 bg-slate-800 rounded">{document.source}</span>
                                        {document.category && (
                                            <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded">
                                                #{document.category}
                                            </span>
                                        )}
                                        {document.score && (
                                            <span className="flex items-center gap-1 text-green-400">
                                                <TrendingUp className="w-3 h-3" />
                                                {(document.score * 100).toFixed(0)}% match
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCopy}
                                    className="p-2 text-slate-500 hover:text-white transition-colors"
                                    title="Copy content"
                                >
                                    {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                                </button>
                                <button className="p-2 text-slate-500 hover:text-white transition-colors" title="Open in Notion">
                                    <ExternalLink className="w-5 h-5" />
                                </button>
                                <button className="p-2 text-slate-500 hover:text-white transition-colors" title="Share">
                                    <Share2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-slate-500 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 px-6 py-3 border-b border-slate-800 bg-slate-900/50">
                            {[
                                { id: 'content', label: 'Повний текст', icon: <FileText className="w-4 h-4" /> },
                                { id: 'summary', label: 'AI Summary', icon: <Sparkles className="w-4 h-4" /> },
                                { id: 'similar', label: 'Схожі', icon: <Users className="w-4 h-4" /> },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${activeTab === tab.id
                                            ? 'bg-cyan-500/10 text-cyan-400'
                                            : 'text-slate-500 hover:text-white hover:bg-slate-800/50'
                                        }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="flex h-full">
                                {/* Main content */}
                                <div className="flex-1 p-6 overflow-y-auto">
                                    {activeTab === 'content' && (
                                        <div className="prose prose-invert prose-slate max-w-none">
                                            <div
                                                className="text-slate-300 leading-relaxed text-base"
                                                dangerouslySetInnerHTML={{ __html: highlightMatches(document.content, query) }}
                                            />
                                        </div>
                                    )}

                                    {activeTab === 'summary' && (
                                        <div>
                                            {summary ? (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                >
                                                    <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 
                                        border border-purple-500/20">
                                                        <div className="flex items-center gap-2 mb-4 text-purple-400">
                                                            <Sparkles className="w-5 h-5" />
                                                            <span className="font-medium">AI-Generated Summary</span>
                                                        </div>
                                                        <p className="text-slate-300 leading-relaxed">{summary}</p>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <div className="text-center py-12">
                                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/10 
                                        flex items-center justify-center">
                                                        <Sparkles className="w-8 h-8 text-purple-400" />
                                                    </div>
                                                    <h3 className="text-white font-medium mb-2">Генерація Summary</h3>
                                                    <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
                                                        AI проаналізує документ та створить стислий виклад ключових тез
                                                    </p>
                                                    <button
                                                        onClick={handleGenerateSummary}
                                                        disabled={isSummarizing}
                                                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white 
                                     font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/25 
                                     transition-all disabled:opacity-50 flex items-center gap-2 mx-auto"
                                                    >
                                                        {isSummarizing ? (
                                                            <>
                                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                Генерація...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Sparkles className="w-4 h-4" />
                                                                Згенерувати Summary
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'similar' && (
                                        <div className="space-y-4">
                                            {similarDocs.map((doc, i) => (
                                                <motion.div
                                                    key={doc.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 
                                   hover:border-cyan-500/30 transition-colors cursor-pointer group"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h4 className="text-white font-medium group-hover:text-cyan-400 transition-colors">
                                                                {doc.title}
                                                            </h4>
                                                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                                                <span className="text-green-400">{(doc.score * 100).toFixed(0)}% схожості</span>
                                                            </div>
                                                        </div>
                                                        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Right sidebar - XAI */}
                                <div className="w-80 border-l border-slate-800 p-6 overflow-y-auto bg-slate-900/50">
                                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                        <Brain className="w-4 h-4 text-purple-400" />
                                        XAI Пояснення
                                    </h3>

                                    {query && (
                                        <div className="mb-6">
                                            <div className="text-xs text-slate-500 mb-2">Ваш запит:</div>
                                            <div className="p-3 bg-slate-800/50 rounded-lg text-sm text-cyan-400 font-mono">
                                                "{query}"
                                            </div>
                                        </div>
                                    )}

                                    {/* Score breakdown */}
                                    <div className="space-y-3 mb-6">
                                        {[
                                            { label: 'Keyword match', value: 0.41, color: 'from-green-500 to-emerald-500' },
                                            { label: 'Semantic similarity', value: 0.28, color: 'from-cyan-500 to-teal-500' },
                                            { label: 'Reranker score', value: 0.17, color: 'from-purple-500 to-pink-500' },
                                            { label: 'Freshness', value: 0.08, color: 'from-amber-500 to-orange-500' },
                                        ].map((factor) => (
                                            <div key={factor.label}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs text-slate-400">{factor.label}</span>
                                                    <span className="text-xs font-mono text-slate-300">{factor.value.toFixed(2)}</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${factor.value * 100}%` }}
                                                        className={`h-full bg-gradient-to-r ${factor.color}`}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Export options */}
                                    <div className="border-t border-slate-800 pt-6">
                                        <h4 className="text-xs text-slate-500 mb-3">Експорт</h4>
                                        <div className="space-y-2">
                                            <button className="w-full px-4 py-2.5 bg-slate-800/50 text-slate-400 rounded-lg 
                                       hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-3">
                                                <ExternalLink className="w-4 h-4" />
                                                <span className="text-sm">Open in Notion</span>
                                            </button>
                                            <button className="w-full px-4 py-2.5 bg-slate-800/50 text-slate-400 rounded-lg 
                                       hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-3">
                                                <Download className="w-4 h-4" />
                                                <span className="text-sm">Download PDF</span>
                                            </button>
                                            <button className="w-full px-4 py-2.5 bg-slate-800/50 text-slate-400 rounded-lg 
                                       hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-3">
                                                <Share2 className="w-4 h-4" />
                                                <span className="text-sm">Share to Slack</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default DocumentModal;
