import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, FileText, Brain, Sparkles, Share2, ExternalLink,
    Clock, Tag, Link2, ChevronRight, Copy, Check,
    BookOpen, TrendingUp, Users, Download, Shield, Zap, Target, RefreshCw
} from 'lucide-react';
import { apiClient } from '@/services/api/config';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

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

const highlightMatches = (text: string, query?: string): string => {
    if (!query) return text;

    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    let result = text;

    terms.forEach(term => {
        const regex = new RegExp(`(${term})`, 'gi');
        result = result.replace(regex, '<mark class="bg-emerald-500/30 text-emerald-300 px-1 rounded-sm font-black italic">$1</mark>');
    });

    return result;
};

const DocumentModal: React.FC<Props> = ({ document, query, isOpen, onClose }) => {
    const [summary, setSummary] = useState<string | null>(null);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'content' | 'summary' | 'similar'>('content');
    const [similarDocs, setSimilarDocs] = useState<SimilarDoc[]>([]);

    const handleGenerateSummary = async () => {
        if (isSummarizing || !document) return;
        setIsSummarizing(true);
        try {
            // Використовуємо реальний API замість мока mlApi
            const res = await apiClient.post(`/ai/summarize`, { text: document.content });
            setSummary(res.data?.summary || 'Не вдалося згенерувати стислий виклад.');
        } catch (err) {
            console.error("Summary generation failed:", err);
            setSummary("Помилка генерації через AI-кластер. Спробуйте пізніше.");
        } finally {
            setIsSummarizing(false);
        }
    };

    useEffect(() => {
        if (document) {
            setSimilarDocs([
                { id: '1', title: 'Аналіз ланцюгів постачання металопродукції', score: 0.94 },
                { id: '2', title: 'Реєстр офшорних бенефіціарів: Сектор Енергетика', score: 0.88 },
                { id: '3', title: 'Звіт про аномальну активність на митних постах', score: 0.82 },
            ]);
        }
    }, [document]);

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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12">
                    {/* BACKDROP */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-2xl"
                    />

                    {/* MODAL CONTAINER */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 50 }}
                        className="relative w-full max-w-[1600px] h-full max-h-[900px] bg-[#050811]/95 border-2 border-white/10 rounded-[4rem] shadow-4xl shadow-emerald-500/5 flex flex-col overflow-hidden"
                    >
                        {/* DECORATIVE HUD */}
                        <div className="absolute top-0 right-0 p-20 opacity-[0.02] pointer-events-none">
                            <Target size={600} className="text-emerald-500" />
                        </div>

                        {/* HEADER */}
                        <div className="flex items-center justify-between px-12 py-10 border-b border-white/5 relative z-10 bg-white/[0.01]">
                            <div className="flex items-center gap-8">
                                <div className="p-5 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 shadow-2xl">
                                    <FileText className="w-10 h-10 text-emerald-500" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none skew-x-[-2deg]">{document.title}</h2>
                                    <div className="flex items-center gap-6">
                                        <Badge className="bg-emerald-600/10 text-emerald-500 border-emerald-500/20 uppercase text-[10px] font-black italic tracking-widest px-4 py-1">{document.source}</Badge>
                                        <div className="h-4 w-px bg-white/10" />
                                        <span className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                                            <Clock size={14} className="text-emerald-500" /> {document.date || 'ДАТА_НЕВІДОМА'}
                                        </span>
                                        {document.score && (
                                            <span className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest italic">
                                                <TrendingUp size={14} />  ЕЛЕВАНТНІСТЬ: {(document.score * 100).toFixed(0)}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <button onClick={handleCopy} className="p-5 bg-white/5 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded-2xl border border-white/5 transition-all">
                                    {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                                </button>
                                <button className="p-5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl border border-white/5 transition-all">
                                    <Download className="w-6 h-6" />
                                </button>
                                <button onClick={onClose} className="p-5 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 rounded-2xl border border-white/5 transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* SUB-HEADER / TABS */}
                        <div className="flex gap-4 px-12 py-6 border-b border-white/5 bg-white/[0.01] relative z-10">
                            {[
                                { id: 'content', label: 'ПОВНИЙ_ТЕКСТ_ДОКУМЕНТА', icon: <FileText size={18} /> },
                                { id: 'summary', label: 'AI_SUMMARIZATION', icon: <Sparkles size={18} /> },
                                { id: 'similar', label: 'СХОЖІ_ОБ\'ЄКТИ', icon: <Users size={18} /> },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={cn(
                                        "flex items-center gap-4 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic transition-all border",
                                        activeTab === tab.id
                                            ? 'bg-emerald-600/10 border-emerald-500/40 text-emerald-400 shadow-xl'
                                            : 'text-slate-600 border-transparent hover:text-slate-300 hover:bg-white/5'
                                    )}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* MAIN CONTENT AREA */}
                        <div className="flex-1 overflow-hidden flex relative z-10">
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-12">
                                {activeTab === 'content' && (
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
                                        <div
                                            className="text-xl text-slate-300 leading-relaxed font-medium italic border-l-4 border-emerald-500/20 pl-10"
                                            dangerouslySetInnerHTML={{ __html: highlightMatches(document.content, query) }}
                                        />
                                    </motion.div>
                                )}

                                {activeTab === 'summary' && (
                                    <div className="max-w-4xl mx-auto h-full flex flex-col justify-center">
                                        {summary ? (
                                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-12 rounded-[3rem] bg-gradient-to-br from-emerald-600/10 to-blue-600/10 border border-emerald-500/20 shadow-4xl">
                                                <div className="flex items-center gap-4 mb-8 text-emerald-400">
                                                    <Sparkles className="w-8 h-8 animate-pulse" />
                                                    <span className="text-xl font-black uppercase tracking-widest italic">ГЛИБИННИЙ_ВИСНОВОК_AI</span>
                                                </div>
                                                <p className="text-2xl text-slate-100 font-black italic leading-relaxed uppercase skew-x-[-1deg]">{summary}</p>
                                            </motion.div>
                                        ) : (
                                            <div className="text-center space-y-10">
                                                <div className="w-32 h-32 mx-auto rounded-[2.5rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-3xl">
                                                    <Brain className="w-16 h-16 text-emerald-500 animate-pulse" />
                                                </div>
                                                <div className="space-y-4">
                                                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">СЕМАНТИЧНА_КОМПРЕСІЯ</h3>
                                                    <p className="text-slate-500 font-black uppercase italic text-xs tracking-[0.4em] max-w-md mx-auto">AI ПРОАНАЛІЗУЄ ДОКУМЕНТ ТА СТВОРИТЬ СТИСЛИЙ ВИКЛАД КЛЮЧОВИХ ТЕЗ</p>
                                                </div>
                                                <button
                                                    onClick={handleGenerateSummary}
                                                    disabled={isSummarizing}
                                                    className="px-12 py-6 bg-emerald-700 hover:bg-emerald-600 text-white font-black uppercase tracking-[0.4em] italic rounded-[2rem] shadow-4xl transition-all disabled:opacity-50 flex items-center gap-4 mx-auto"
                                                >
                                                    {isSummarizing ? <RefreshCw className="animate-spin" size={24} /> : <Zap size={24} />}
                                                    {isSummarizing ? "ОБ ОБКА..." : "ІНІЦІЮВАТИ_АНАЛІЗ"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'similar' && (
                                    <div className="max-w-5xl mx-auto space-y-8">
                                        <h3 className="text-xs font-black text-slate-600 uppercase tracking-[0.5em] italic mb-10">ВИЯВЛЕНО_ЗБІГИ_В_СУМІЖНИХ_ДАТАСЕТАХ</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {similarDocs.map((doc, i) => (
                                                <motion.div
                                                    key={doc.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                                                    className="p-8 rounded-[2.5rem] bg-white/[0.01] border border-white/5 hover:border-emerald-500/40 hover:bg-emerald-500/[0.02] transition-all cursor-pointer group shadow-2xl"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="space-y-4">
                                                            <h4 className="text-xl font-black text-white group-hover:text-emerald-400 transition-colors uppercase italic tracking-tighter leading-none">
                                                                {doc.title}
                                                            </h4>
                                                            <div className="flex items-center gap-4">
                                                                <Badge className="bg-emerald-600/10 text-emerald-500 border-none px-3 py-1 text-[9px] font-black italic">{(doc.score * 100).toFixed(0)}% MATCH</Badge>
                                                                <span className="text-[9px] font-black text-slate-700 uppercase italic">ID: {doc.id.padStart(6, '0')}</span>
                                                            </div>
                                                        </div>
                                                        <div className="p-4 bg-white/5 rounded-2xl text-slate-700 group-hover:text-emerald-500 transition-all">
                                                            <ChevronRight size={24} />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* SIDEBAR XAI */}
                            <div className="w-[450px] border-l border-white/5 p-12 overflow-y-auto bg-black/40 backdrop-blur-md custom-scrollbar">
                                <div className="space-y-12">
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-black text-white uppercase tracking-[0.4em] italic flex items-center gap-4 border-b border-white/5 pb-6">
                                            <Brain className="w-6 h-6 text-emerald-500" />
                                            XAI_ПОЯСНЕННЯ
                                        </h3>
                                        <p className="text-[11px] text-slate-500 font-black uppercase italic leading-relaxed">ВЕКТОРНИЙ_АНАЛІЗ_ДЕРЕВА_РІШЕНЬ_НЕЙРОМЕРЕЖІ_v5</p>
                                    </div>

                                    {query && (
                                        <div className="p-8 bg-emerald-500/[0.02] border border-emerald-500/20 rounded-[2rem] space-y-4 shadow-inner">
                                            <div className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">АКТИВНИЙ_СЕМАНТИЧНИЙ_ЗАПИТ:</div>
                                            <div className="text-xl font-black text-emerald-400 italic skew-x-[-2deg] uppercase">
                                                "{query}"
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-8">
                                        {[
                                            { label: 'KEYWORD_DENSITY', value: 0.82, color: 'emerald' },
                                            { label: 'SEMANTIC_SIMILARITY', value: 0.91, color: 'cyan' },
                                            { label: 'RERANKER_WEIGHT', value: 0.74, color: 'blue' },
                                            { label: 'TEMPORAL_FRESHNESS', value: 0.65, color: 'amber' },
                                        ].map((factor) => (
                                            <div key={factor.label} className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{factor.label}</span>
                                                    <span className="text-xs font-mono font-black text-white italic">{(factor.value * 100).toFixed(0)}%</span>
                                                </div>
                                                <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${factor.value * 100}%` }}
                                                        className={cn(
                                                            "h-full rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]",
                                                            factor.color === 'emerald' ? 'bg-emerald-500' :
                                                            factor.color === 'cyan' ? 'bg-cyan-500' :
                                                            factor.color === 'blue' ? 'bg-blue-500' : 'bg-amber-500'
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-10 border-t border-white/5 space-y-6">
                                        <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] italic">ЕКСПОРТ_В_ЗОВНІШНІ_СИСТЕМИ</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button className="p-6 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-slate-500 hover:text-white transition-all flex flex-col items-center gap-3">
                                                <Share2 size={24} />
                                                <span className="text-[9px] font-black uppercase">NOTION</span>
                                            </button>
                                            <button className="p-6 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-slate-500 hover:text-white transition-all flex flex-col items-center gap-3">
                                                <ExternalLink size={24} />
                                                <span className="text-[9px] font-black uppercase">CLOUD_S3</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default DocumentModal;
