/**
 * 👁️ Sovereign Report Widget | PREDATOR v55.2-SM-EXTENDED
 * Глибокий експертний висновок від Sovereign Advisor.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, Shield, AlertTriangle, ChevronRight,
    RefreshCw, Sparkles, FileText, Target,
    Zap, Share2, Download, Printer
} from 'lucide-react';
import { diligenceApi } from '../../features/diligence/api/diligence';
import { cn } from '../../utils/cn';
import ReactMarkdown from 'react-markdown';

interface SovereignReportWidgetProps {
    ueid: string;
    className?: string;
    mini?: boolean;
}

export const SovereignReportWidget: React.FC<SovereignReportWidgetProps> = ({ ueid, className, mini }) => {
    const [report, setReport] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchReport = async () => {
        setLoading(true);
        setError(null);
        try {
            // Використовуємо новий метод для отримання звіту
            // Примітка: Я додам цей метод до diligenceApi або використаю прямий виклик
            const response = await fetch(`/api/v1/intelligence/report/${ueid}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            if (response.ok) {
                setReport(data.report);
            } else {
                setError(data.detail || 'Помилка генерації звіту');
            }
        } catch (err) {
            setError('Сервер не відповідає');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (ueid) fetchReport();
    }, [ueid]);

    return (
        <div className={cn(
            "flex flex-col bg-slate-950/60 backdrop-blur-3xl border border-white/10 rounded-[40px] overflow-hidden shadow-2xl transition-all",
            className
        )}>
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 via-transparent to-transparent">
                <div className="flex items-center gap-5">
                    <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
                        <Brain size={24} className="text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-tight">Sovereign Advisor Report</h3>
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">v55.2_EXTENDED_INTEL // {ueid}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchReport}
                        disabled={loading}
                        className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl">
                        SHARE_INTEL
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar min-h-[400px]">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex flex-col items-center justify-center space-y-8 py-20"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-indigo-500/20 blur-[40px] rounded-full scale-150 animate-pulse" />
                                <Sparkles size={48} className="text-indigo-400 animate-bounce" />
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-indigo-400 font-bold tracking-[0.3em] uppercase text-xs animate-pulse">СИНТЕЗУЮ ЕКСПЕРТНИЙ ВИСНОВОК...</p>
                                <p className="text-slate-600 text-[10px] uppercase font-mono italic">Trinity Engine Analysing 5-Layer Risk Matrix</p>
                            </div>
                        </motion.div>
                    ) : error ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-10 bg-rose-500/10 border border-rose-500/30 rounded-[32px] text-center space-y-4"
                        >
                            <AlertTriangle size={32} className="text-rose-500 mx-auto" />
                            <p className="text-rose-400 font-black uppercase text-xs">{error}</p>
                            <button onClick={fetchReport} className="text-indigo-400 underline text-[10px] uppercase font-black">Спробувати знову</button>
                        </motion.div>
                    ) : report ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="prose prose-invert max-w-none prose-p:text-slate-300 prose-headings:text-white prose-headings:uppercase prose-headings:tracking-tighter prose-strong:text-indigo-400"
                        >
                            <ReactMarkdown>{report}</ReactMarkdown>
                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-600 border border-dashed border-white/5 rounded-[40px]">
                            <FileText size={48} className="opacity-20 mb-4" />
                            <p className="text-xs font-black uppercase tracking-widest italic">Звіт ще не сформовано</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer Stats */}
            <div className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between">
                <div className="flex gap-10">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">ЦІЛІСНІСТЬ</span>
                        <span className="text-xs font-black text-emerald-400">ВЕРИФІКОВАНО</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">ЯДРО_МОВИ</span>
                        <span className="text-xs font-black text-white">UKRAINIAN_SOVEREIGN</span>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"><Printer size={16} /></button>
                    <button className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"><Download size={16} /></button>
                </div>
            </div>

            <style>{`
                .prose blockquote {
                    border-left-color: #6366f1;
                    background: rgba(99, 102, 241, 0.05);
                    padding: 1rem 1.5rem;
                    border-radius: 0 1rem 1rem 0;
                    font-style: italic;
                    color: #94a3b8;
                }
            `}</style>
        </div>
    );
};
