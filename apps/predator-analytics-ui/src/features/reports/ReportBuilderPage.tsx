import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FileText, Download, Target, ShieldAlert, Landmark, Ship, Network,
    Search, Filter, RefreshCw, Layers, Cpu, 
    Zap, Binary, Fingerprint, ExternalLink, 
    Skull, Gem, Activity, FilePlus, Save,
    CheckCircle2, AlertCircle, Clock, BarChart3,
    Upload, Users, Database, Globe, BrainCircuit,
    ChevronDown, Send, Sparkles, Wand2, Eye, Gavel, Trash2
} from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { HoloContainer } from '@/components/HoloContainer';
import { CyberGrid } from '@/components/CyberGrid';
import { SovereignReportWidget } from '@/components/intelligence/SovereignReportWidget';
import { intelligenceApi } from '@/services/api/intelligence';
import { copilotApi } from '@/services/api/copilot';

const ReportBuilderPage: React.FC = () => {
    const [selectedTemplate, setSelectedTemplate] = useState('diligence');
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [batchMode, setBatchMode] = useState(false);
    const [targetUeid, setTargetUeid] = useState('');
    const [batchUeids, setBatchUeids] = useState('');
    const [previewMode, setPreviewMode] = useState(false);
    
    // AI Copilot state
    const [aiQuery, setAiQuery] = useState('');
    const [aiMessages, setAiMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([
        { role: 'assistant', content: 'Вітаю. Я допоможу налаштувати оптимальні джерела для вашого звіту. Спробуйте запитати: "Які джерела найкращі для перевірки митних ризиків?"' }
    ]);
    const [aiTyping, setAiTyping] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);

    const templates = [
        { id: 'diligence', name: 'Due Diligence V4', icon: ShieldAlert, color: 'text-indigo-400', desc: 'Повний аудит ризиків, зв\'язків та репутації.' },
        { id: 'cartel', name: 'Аналіз Картелів', icon: Skull, color: 'text-rose-400', desc: 'Виявлення узгоджених дій та прихованих бенефіціарів.' },
        { id: 'customs', name: 'Митна Розвідка', icon: Target, color: 'text-emerald-400', desc: 'Аналіз товарних потоків та схем розмитнення.' },
        { id: 'executive', name: 'Executive Summary', icon: Gem, color: 'text-amber-400', desc: 'Концентроване резюме для прийняття стратегічних рішень.' }
    ];

    const dataSources = [
        { id: 'edr', name: 'Реєстраційні дані (ЄДРПОУ)', status: 'Active', icon: Landmark, category: 'CORE' },
        { id: 'court', name: 'Судовий реєстр (5 років)', status: 'Active', icon: Gavel, category: 'LEGAL' },
        { id: 'customs', name: 'Митна історія (Експорт/Імпорт)', status: 'Premium', icon: Ship, category: 'TRADE' },
        { id: 'sanctions', name: 'Ризики та Санкційні списки', status: 'Active', icon: ShieldAlert, category: 'RISK' },
        { id: 'graph', name: 'Граф зв\'язків (L1-L3)', status: 'Active', icon: Network, category: 'GRAPH' },
        { id: 'media', name: 'Медіа-моніторинг OSINT', status: 'Inactive', icon: Globe, category: 'SOCIAL' }
    ];

    const handleGenerate = () => {
        if (!targetUeid && !batchUeids) return;
        
        setGenerating(true);
        setProgress(0);
        setPreviewMode(false);
        
        const interval = setInterval(() => {
            setProgress(p => {
                if (p >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        setGenerating(false);
                        setPreviewMode(true);
                    }, 800);
                    return 100;
                }
                return p + Math.floor(Math.random() * 5) + 1;
            });
        }, 150);
    };

    const handleAiAsk = async () => {
        if (!aiQuery) return;
        
        const userMsg = aiQuery;
        setAiQuery('');
        setAiMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setAiTyping(true);
        
        try {
            const response = await copilotApi.chat({
                message: userMsg,
                session_id: sessionId || undefined,
                history: aiMessages.slice(-5) // Send last 5 messages for context
            });
            
            if (response.reply) {
                setAiMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);
                if (!sessionId && response.message_id) {
                    // In a real app we'd get session_id back or use message_id to track
                }
            }
        } catch (err) {
            setAiMessages(prev => [...prev, { role: 'assistant', content: 'Вибачте, виникла помилка підключення до нейромережі. Перевірте з\'єднання з сервером.' }]);
        } finally {
            setAiTyping(false);
        }
    };

    const clearAiChat = () => {
        setAiMessages([{ role: 'assistant', content: 'Чат очищено. Чим я можу допомогти?' }]);
        setSessionId(null);
    };

    return (
        <PageTransition>
            <div className="min-h-screen p-8 flex flex-col gap-8 relative overflow-hidden text-white bg-slate-950">
                <AdvancedBackground />
                <CyberGrid color="rgba(245,158,11,0.03)" />

                {/* Top Actions Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 z-20">
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-amber-500/20 blur-xl group-hover:bg-amber-500/40 transition-all rounded-full" />
                            <div className="relative p-4 bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl">
                                <Wand2 size={28} className="text-amber-400" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] animate-pulse">INTELLIGENCE_FORGE // v55.2</span>
                                <Badge className="bg-amber-500/10 text-amber-500 border-none text-[8px] tracking-widest px-2 py-0">ULTIMATE</Badge>
                            </div>
                            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase font-display leading-none">
                                ГЕНЕРАТОР <span className="text-amber-500">ЗВІТІВ</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl">
                            <button 
                                onClick={() => setBatchMode(false)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!batchMode ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}
                            >
                                Single
                            </button>
                            <button 
                                onClick={() => setBatchMode(true)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${batchMode ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}
                            >
                                Batch
                            </button>
                        </div>
                        <button className="p-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all">
                            <Save size={20} />
                        </button>
                        <button 
                            onClick={handleGenerate}
                            disabled={generating}
                            className="px-10 py-4 bg-amber-500 text-slate-950 rounded-2xl font-black uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)] disabled:opacity-50 relative overflow-hidden group"
                        >
                            <span className="relative z-10">{generating ? 'СИНТЕЗУЮ...' : 'ЗАПУСТИТИ_ГЕНЕРАЦІЮ'}</span>
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-8 z-10 flex-1">
                    {/* LEFT: TEMPLATES & AI COPILOT */}
                    <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
                        <div className="flex flex-col gap-4">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] px-2">АРХІТЕКТУРА_ЗВІТУ</h3>
                            <div className="flex flex-col gap-3">
                                {templates.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setSelectedTemplate(t.id)}
                                        className={`p-5 rounded-3xl border transition-all text-left group relative overflow-hidden ${
                                            selectedTemplate === t.id 
                                            ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.1)]' 
                                            : 'bg-white/5 border-white/5 hover:border-white/10'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className={`p-3 rounded-2xl bg-black/40 ${t.color}`}>
                                                <t.icon size={18} />
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-bold uppercase tracking-tight text-white mb-1">{t.name}</div>
                                                <div className="text-[9px] font-medium text-slate-500 leading-tight">{t.desc}</div>
                                            </div>
                                        </div>
                                        {selectedTemplate === t.id && (
                                            <motion.div layoutId="templateGlowActive" className="absolute inset-x-0 bottom-0 h-1 bg-amber-500" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <TacticalCard variant="cyber" className="p-6 mt-auto">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <BrainCircuit size={18} className="text-cyan-400" />
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest underline decoration-cyan-400/30">AI_COPILOT_v5</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={clearAiChat}
                                        className="p-1 px-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all text-[8px] font-black uppercase tracking-tighter flex items-center gap-1"
                                    >
                                        <Trash2 size={10} />
                                        CLEAR
                                    </button>
                                    <Sparkles size={14} className="text-cyan-400 animate-pulse" />
                                </div>
                            </div>
                            <div className="bg-black/40 border border-white/5 rounded-2xl p-4 mb-4 h-[200px] flex flex-col gap-3 overflow-y-auto custom-scrollbar">
                                {aiMessages.map((msg, i) => (
                                    <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[85%] p-3 rounded-2xl text-[10px] leading-relaxed font-mono ${
                                            msg.role === 'user' 
                                            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-200 rounded-tr-none' 
                                            : 'bg-white/5 border border-white/10 text-slate-300 rounded-tl-none'
                                        }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                {aiTyping && (
                                    <div className="flex gap-1 items-center p-2">
                                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
                                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                )}
                            </div>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={aiQuery}
                                    onChange={(e) => setAiQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAiAsk()}
                                    placeholder="Запит до AI Асистента..." 
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-[10px] focus:outline-none focus:border-cyan-400/50 transition-all font-mono placeholder:text-slate-600 shadow-inner"
                                />
                                <button 
                                    onClick={handleAiAsk}
                                    disabled={aiTyping || !aiQuery}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed group transition-all"
                                >
                                    <Send size={16} className="group-hover:scale-110 transition-transform" />
                                </button>
                            </div>
                        </TacticalCard>
                    </div>

                    {/* CENTER: CONFIGURATOR */}
                    <div className="col-span-12 lg:col-span-6 flex flex-col gap-8">
                        <HoloContainer className="p-10 flex flex-col relative group overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Database size={150} />
                            </div>
                            
                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">ПАРАМЕТРИ_ФОРМУВАННЯ</h3>
                                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1 italic">LAYER: DATA_SYNERGY_UNIT</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-[9px] font-bold text-slate-500 uppercase">STATUS</div>
                                        <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">READY_TO_FORGE</div>
                                    </div>
                                    <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center">
                                        <Activity size={20} className="text-emerald-500" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-6 relative z-10">
                                {/* Target Input */}
                                <div className="space-y-4 p-6 bg-white/[0.03] border border-white/5 rounded-[2rem] hover:border-white/10 transition-all">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{batchMode ? 'ПЕРЕЛІК_UEID' : 'UEID_ПІДПРИЄМСТВА'}</label>
                                        <div className="flex items-center gap-2 text-[9px] text-amber-500 font-bold uppercase tracking-widest">
                                            <Search size={12} />
                                            Авто-пошук
                                        </div>
                                    </div>
                                    {batchMode ? (
                                        <textarea 
                                            value={batchUeids}
                                            onChange={(e) => setBatchUeids(e.target.value)}
                                            placeholder="Введіть UEID через кому або з нового рядка..."
                                            className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-mono focus:outline-none focus:border-amber-500/30 transition-all resize-none"
                                        />
                                    ) : (
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={targetUeid}
                                                onChange={(e) => setTargetUeid(e.target.value)}
                                                placeholder="Введіть UEID..."
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm font-black italic focus:outline-none focus:border-amber-500/30 transition-all tracking-wider"
                                            />
                                            <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-amber-500/10 text-amber-400 rounded-xl hover:bg-amber-500/20 transition-all">
                                                <Fingerprint size={18} />
                                            </button>
                                        </div>
                                    )}
                                    {batchMode && (
                                        <div className="flex items-center justify-center p-6 border-2 border-dashed border-white/5 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group">
                                            <div className="flex flex-col items-center gap-2">
                                                <Upload size={24} className="text-slate-500 group-hover:text-amber-500 transition-colors" />
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Завантажити CSV / XLSX</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Data Sources Matrix */}
                                <div className="grid grid-cols-2 gap-4">
                                    {dataSources.map((source, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group relative">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-black/40 rounded-xl text-slate-400 group-hover:text-white transition-colors">
                                                    {React.createElement(source.icon || FileText, { size: 16 })}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-white tracking-tight">{source.name}</span>
                                                    <span className="text-[7px] font-mono font-bold text-slate-600 uppercase tracking-widest">{source.category}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {source.status === 'Premium' && <Zap size={10} className="text-amber-500 fill-amber-500" />}
                                                <div className={`w-1.5 h-1.5 rounded-full ${source.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : source.status === 'Premium' ? 'bg-amber-500' : 'bg-slate-700'}`} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Generation Overlay */}
                            <AnimatePresence>
                                {generating && (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-50 flex flex-col items-center justify-center p-20 bg-slate-950/90 backdrop-blur-3xl"
                                    >
                                        <div className="relative mb-12">
                                            <div className="absolute inset-0 bg-amber-500/20 blur-[100px] scale-150 animate-pulse" />
                                            <div className="relative">
                                                <motion.div 
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                                                    className="w-48 h-48 border-4 border-dashed border-amber-500/20 rounded-full flex items-center justify-center p-8"
                                                >
                                                    <motion.div 
                                                        animate={{ rotate: -360 }}
                                                        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                                                        className="w-full h-full border-2 border-amber-500/40 rounded-full border-t-amber-500"
                                                    />
                                                </motion.div>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-4xl font-black italic text-amber-500">{progress}%</span>
                                                        <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.4em]">SYNC_L5</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-center space-y-4">
                                            <h4 className="text-2xl font-black italic tracking-tighter uppercase underline decoration-amber-500/30 underline-offset-8">СИНТЕЗ_РОЗВІДКИ_v55</h4>
                                            <div className="flex flex-col gap-1 items-center">
                                                <p className="text-[10px] font-mono text-amber-500/80 uppercase tracking-[0.5em] animate-pulse italic">EXTRACTING_EDRPOU_NODES...</p>
                                                <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest italic">{selectedTemplate === 'executive' ? 'Formatting executive Persona...' : 'Building deep relationship graph...'}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </HoloContainer>
                    </div>

                    {/* RIGHT: ARCHIVE & PREVIEW */}
                    <div className="col-span-12 lg:col-span-3 flex flex-col gap-8">
                        <AnimatePresence mode="wait">
                            {previewMode && targetUeid ? (
                                <motion.div
                                    key="preview"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="flex-1 flex flex-col"
                                >
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 px-2">ПОПЕРЕДНІЙ_ПЕРЕГЛЯД</h3>
                                    <div className="flex-1 overflow-hidden relative border border-white/10 rounded-[3rem] bg-black/40">
                                        <div className="absolute inset-0 p-4 transform scale-[0.6] origin-top-left overflow-auto custom-scrollbar grayscale pointer-events-none opacity-50">
                                            <SovereignReportWidget ueid={targetUeid} className="w-[160%] shadow-none border-dashed" />
                                        </div>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent">
                                            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
                                                <Eye size={32} className="text-amber-400" />
                                            </div>
                                            <h4 className="text-sm font-black uppercase text-center mb-4 tracking-tighter">ЗВІТ_ГОТОВИЙ_ДО_ПЕРЕГЛЯДУ</h4>
                                            <button 
                                                onClick={() => window.open(`/intelligence/report/${targetUeid}`, '_blank')}
                                                className="w-full py-4 bg-white/10 border border-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3"
                                            >
                                                <ExternalLink size={16} />
                                                ВІДКРИТИ ПОВНУ ВЕРСІЮ
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="archive"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col gap-8 flex-1"
                                >
                                    <TacticalCard variant="cyber" className="p-8">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-sm font-black uppercase tracking-tighter italic text-amber-500">Останні Звіти</h3>
                                            <Clock size={16} className="text-slate-600" />
                                        </div>
                                        <div className="space-y-4">
                                            {[
                                                { date: 'Сьогодні, 12:44', title: 'Diligence_77201.pdf', size: '2.4 MB', type: 'INDIGO' },
                                                { date: 'Вчора, 18:20', title: 'Cartel_Cluster_X.pdf', size: '4.8 MB', type: 'ROSE' },
                                                { date: '12 Березня', title: 'Maritime_Traffic.docx', size: '1.2 MB', type: 'EMERALD' }
                                            ].map((r, i) => (
                                                <div key={i} className="p-4 bg-white/[0.03] rounded-2xl border border-white/5 hover:border-white/10 transition-all cursor-pointer flex items-center justify-between group">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-1 h-8 rounded-full ${r.type === 'INDIGO' ? 'bg-indigo-500' : r.type === 'ROSE' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[10px] font-bold text-slate-300 truncate w-32 group-hover:text-white">{r.title}</span>
                                                            <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">{r.date}</span>
                                                        </div>
                                                    </div>
                                                    <div className="p-2 text-slate-700 group-hover:text-amber-400 transition-colors">
                                                        <Download size={14} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </TacticalCard>

                                    <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 rounded-[3rem] p-10 backdrop-blur-xl relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer">
                                        <div className="absolute -top-4 -right-4 p-8 opacity-10 group-hover:scale-125 group-hover:opacity-20 transition-all duration-700">
                                            <Zap size={120} className="text-amber-500 fill-amber-500" />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-6">
                                                <Users size={20} className="text-white" />
                                                <h4 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">PREMIUM_BATCH</h4>
                                            </div>
                                            <p className="text-[10px] text-slate-400 leading-relaxed uppercase tracking-wider mb-8 font-mono">
                                                Аналіз масивів контрагентів через єдину нейромережу. Підтримка тисяч UEID одночасно.
                                            </p>
                                            <button className="w-full py-4 bg-white/10 border border-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all">
                                                НАЛАШТУВАТИ ПОТІК
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(245, 158, 11, 0.1);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(245, 158, 11, 0.3);
                }
            `}</style>
        </PageTransition>
    );
};

export default ReportBuilderPage;


