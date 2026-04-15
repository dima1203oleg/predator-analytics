/**
 * 👁️ Sovereign Intelligence Advisor | v56.2-TITAN Premium Matrix
 * PREDATOR Глибокий експертний висновок.
 * 
 * Генерація та візуалізація суверенних аналітичних звітів з ШІ-підтримкою.
 * © 2026 PREDATOR Analytics - Повна українізація v56.2-TITAN
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, Shield, AlertTriangle, ChevronRight,
    RefreshCw, Sparkles, FileText, Target,
    Zap, Share2, Download, Printer, Info, CheckCircle2,
    Lock, ExternalLink, ShieldCheck, Fingerprint
} from 'lucide-react';
import { cn } from '../../utils/cn';
import ReactMarkdown from 'react-markdown';
import { Badge } from '../ui/badge';
import { intelligenceApi } from '../../services/api/intelligence';

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
            const data = await intelligenceApi.generateReport(ueid);
            if (data && data.report) {
                setReport(data.report);
            } else {
                setReport(null);
                setError('API не повернув текст звіту для цієї сутності.');
            }
        } catch (err) {
            setReport(null);
            setError('Не вдалося отримати звіт із бекенду.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (ueid) fetchReport();
    }, [ueid]);

    return (
        <div className={cn(
            "flex flex-col bg-[#030712]/60 backdrop-blur-[50px] border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] transition-all",
            className
        )}>
            {/* Extended Cyber Header */}
            <div className="p-10 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 via-white/[0.02] to-transparent">
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-2xl animate-pulse" />
                        <div className="relative p-4 bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl">
                            <Brain size={28} className="text-indigo-400" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1.5">
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] animate-pulse italic">SOVEREIGN_ADVISOR // v56.2-TITAN</span>
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[8px] tracking-widest px-2 py-0">VERIFIED</Badge>
                        </div>
                        <h3 className="text-2xl font-black text-white italic tracking-tighter leading-tight uppercase">СУВЕРЕННИЙ_ЗВІТ_ІНТЕЛЕКТУ</h3>
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1 opacity-60">IDENTIFIER: {ueid} // LAYER: COGNITIVE_ANALYSIS</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col text-right mr-4 border-r border-white/10 pr-6">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ЧАС_ГЕНЕРАЦІЇ</span>
                        <span className="text-xs font-mono text-white opacity-80">{new Date().toLocaleTimeString('uk-UA')}</span>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={fetchReport}
                        disabled={loading}
                        className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-50"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </motion.button>
                    <motion.button 
                        whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                        className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-500 transition-all shadow-[0_0_30px_rgba(99,102,241,0.3)] group"
                    >
                        ПОШИРИТИ_РОЗВІДКУ
                    </motion.button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar min-h-[500px] relative bg-black/20">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex flex-col items-center justify-center space-y-10 py-32"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full scale-200 animate-pulse" />
                                <div className="relative">
                                    <Sparkles size={64} className="text-indigo-400 animate-pulse" />
                                    <motion.div 
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                        className="absolute -inset-4 border-2 border-dashed border-indigo-500/20 rounded-full"
                                    />
                                </div>
                            </div>
                            <div className="text-center space-y-3">
                                <p className="text-indigo-400 font-black tracking-[0.6em] uppercase text-xs animate-pulse">СИНТЕЗУЮ_ЕКСПЕРТНИЙ_ВИСНОВОК...</p>
                                <p className="text-slate-600 text-[10px] uppercase font-mono italic tracking-widest">Trinity Engine Analysing 5-Layer Risk Matrix v55</p>
                            </div>
                            <div className="flex gap-2">
                                {[1,2,3,4,5].map(i => (
                                    <motion.div 
                                        key={i}
                                        animate={{ height: [4, 16, 4] }}
                                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                                        className="w-1 bg-indigo-500/40 rounded-full"
                                    />
                                ))}
                            </div>
                        </motion.div>
                    ) : error ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-12 bg-rose-500/5 border border-rose-500/20 rounded-[3rem] text-center space-y-6"
                        >
                            <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto">
                                <AlertTriangle size={40} className="text-rose-500" />
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-rose-500 uppercase italic mb-2 tracking-tighter">СИСТЕМНИЙ_ЗБІЙ_v55</h4>
                                <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">{error}</p>
                            </div>
                            <button 
                                onClick={fetchReport} 
                                className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-indigo-400 text-[10px] uppercase font-black tracking-widest hover:bg-white/10 transition-all"
                            >
                                Перепідключити_ядро
                            </button>
                        </motion.div>
                    ) : report ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="prose prose-invert max-w-none prose-p:text-slate-400 prose-p:leading-relaxed prose-headings:text-white prose-headings:uppercase prose-headings:tracking-tighter prose-headings:italic prose-headings:font-black prose-strong:text-indigo-400 prose-li:text-slate-300"
                        >
                            <ReactMarkdown>{report}</ReactMarkdown>
                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 text-slate-800 border border-dashed border-white/5 rounded-[3rem]">
                            <Fingerprint size={80} className="opacity-10 mb-6" />
                            <p className="text-sm font-black uppercase tracking-[0.4em] italic opacity-40">КРИПТОМАТРИЦЯ_ПОРОЖНЯ</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Extended Cyber Footer */}
            <div className="p-10 bg-white/[0.02] border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex flex-wrap gap-10">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                            <ShieldCheck size={18} className="text-emerald-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5 leading-none">ЦІЛІСНІСТЬ</span>
                            <span className="text-[11px] font-black text-emerald-400 uppercase tracking-tight italic">ВЕРИФІКОВАНО_v55</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                            <Fingerprint size={18} className="text-indigo-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5 leading-none">АВТОРСТВО_ШІ</span>
                            <span className="text-[11px] font-black text-white uppercase tracking-tight italic">SOVEREIGN_ADVISOR</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-slate-800 rounded-xl">
                            <Lock size={18} className="text-slate-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5 leading-none">БЕЗПЕКА</span>
                            <span className="text-[11px] font-black text-slate-300 uppercase tracking-tight italic">L5_ENCRYTION</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <motion.button whileHover={{ y: -3 }} className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-500 hover:text-white transition-all shadow-xl">
                        <Printer size={20} />
                    </motion.button>
                    <motion.button whileHover={{ y: -3 }} className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-500 hover:text-white transition-all shadow-xl">
                        <Download size={20} />
                    </motion.button>
                    <motion.button whileHover={{ y: -3 }} className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-500 hover:text-white transition-all shadow-xl">
                        <ExternalLink size={20} />
                    </motion.button>
                </div>
            </div>

            <style>{`
                .prose blockquote {
                    border-left-width: 4px;
                    border-left-color: #6366f1;
                    background: rgba(99, 102, 241, 0.05);
                    padding: 2rem;
                    border-radius: 0 2rem 2rem 0;
                    font-style: italic;
                    color: #94a3b8;
                    font-weight: 600;
                    margin: 3rem 0;
                }
                .prose h1, .prose h2, .prose h3 {
                    margin-top: 3rem;
                    margin-bottom: 1.5rem;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(99, 102, 241, 0.1);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(99, 102, 241, 0.3);
                }
            `}</style>
        </div>
    );
};
