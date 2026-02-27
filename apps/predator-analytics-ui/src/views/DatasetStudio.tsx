
/**
 * 📊 Dataset Studio v45
 *
 * Тепер з підтримкою власних датасетів як прикладів для генерації.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Database, Sparkles, Play, Pause, RefreshCw, Download,
    ChevronRight, Filter, Settings, Zap, BarChart3,
    FileText, Layers, CheckCircle, Clock, AlertCircle,
    Cpu, HardDrive, TrendingUp, ArrowRight, Mic, Volume2, Box,
    Activity, Shield, Terminal, FastForward, Target, Binary, Microscope,
    Plus, Search, ToggleRight
} from 'lucide-react';
import { cn } from '../utils/cn';
import { api } from '../services/api';
import { premiumLocales } from '../locales/uk/premium';
import { AdvancedBackground } from '../components/AdvancedBackground';
import { TacticalCard } from '../components/TacticalCard';
import { DatabasePipelineMonitor } from '../components/pipeline/DatabasePipelineMonitor';
import { UserDatasetsPanel } from '../components/datasets/UserDatasetsPanel';

const DatasetStudio: React.FC = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [activePrototypeId, setActivePrototypeId] = useState<string | null>(null);
    const [augmentationLevel, setAugmentationLevel] = useState(50);
    const [rowCount, setRowCount] = useState(1000);

    // Stats for Visual Excellence
    const [stats, setStats] = useState({
        total_rows: 1240500,
        synthetic_generated: 452000,
        accuracy: 98.4,
        gpu_load: 65
    });

    const handleGenerate = async () => {
        if (!activePrototypeId) return;
        setIsGenerating(true);
        try {
            await api.datasets.generate({
                prototype_id: activePrototypeId,
                augmentation_level: augmentationLevel,
                row_count: rowCount
            });
            // Show toast or notification
            alert(premiumLocales.datasetStudio.panels.generation.eventSynthesized.replace('{id}', activePrototypeId.split('-')[1] || '001'));
        } catch (e) {
            console.error('Generation failed', e);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen animate-in fade-in duration-700 pb-20">
            <AdvancedBackground />

            <div className="max-w-7xl mx-auto px-6 pt-12 space-y-12">
                {/* Header Section */}
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[32px] shadow-2xl shadow-indigo-500/20">
                            <Binary size={32} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                                {premiumLocales.datasetStudio.title.split(' ')[0]}_<span className="text-indigo-400">{premiumLocales.datasetStudio.title.split(' ')[1]}</span>
                            </h1>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.5em] mt-1">{premiumLocales.datasetStudio.subtitle}</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                         <div className="px-6 py-3 bg-slate-900/60 border border-white/5 rounded-2xl flex items-center gap-4">
                             <div className="text-right">
                                 <p className="text-[10px] text-slate-500 font-bold uppercase">{premiumLocales.datasetStudio.header.gpuLoad}</p>
                                 <p className="text-lg font-mono font-black text-emerald-400">{stats.gpu_load}%</p>
                             </div>
                             <div className="h-8 w-[2px] bg-white/5" />
                             <Cpu className="text-indigo-400" size={20} />
                         </div>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">

                    {/* Left: Datasets Management */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* 📚 New Section: Interactive User Datasets */}
                        <UserDatasetsPanel
                             className="shadow-2xl shadow-black/40"
                             onDatasetSelect={(ds) => setActivePrototypeId(ds.id)}
                        />

                        {/* 🔄 Pipeline Monitor per DB */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                   <Activity size={16} className="text-indigo-400" /> {premiumLocales.datasetStudio.panels.pipeline.title}
                                </h3>
                                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-black rounded uppercase underline cursor-help">{premiumLocales.datasetStudio.panels.pipeline.realtimeSync}</span>
                            </div>
                            <DatabasePipelineMonitor />
                        </div>
                    </div>

                    {/* Right: Generation Forge */}
                    <div className="space-y-6">
                        <TacticalCard title={premiumLocales.datasetStudio.panels.generation.title} subtitle={premiumLocales.datasetStudio.panels.generation.subtitle} variant="holographic">
                            <div className="p-6 space-y-6">

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{premiumLocales.datasetStudio.panels.generation.prototype.label}</label>
                                    <div className={cn(
                                        "p-4 rounded-2xl border transition-all flex items-center justify-between",
                                        activePrototypeId ? "bg-indigo-500/10 border-indigo-500/30" : "bg-slate-900 border-white/5"
                                    )}>
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", activePrototypeId ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-500")}>
                                                <Target size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-white">{activePrototypeId ? premiumLocales.datasetStudio.panels.generation.prototype.selected : premiumLocales.datasetStudio.panels.generation.prototype.notSelected}</p>
                                                <p className="text-[10px] text-slate-500">{activePrototypeId || premiumLocales.datasetStudio.panels.generation.prototype.placeholder}</p>
                                            </div>
                                        </div>
                                        {!activePrototypeId && <ChevronRight size={16} className="text-slate-700" />}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{premiumLocales.datasetStudio.panels.generation.augmentation.label}</label>
                                        <span className="text-xs font-mono font-bold text-indigo-400">{augmentationLevel}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={augmentationLevel}
                                        onChange={(e) => setAugmentationLevel(parseInt(e.target.value))}
                                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                                        <span>{premiumLocales.datasetStudio.panels.generation.augmentation.fast}</span>
                                        <span>{premiumLocales.datasetStudio.panels.generation.augmentation.deep}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Кількість рядків</label>
                                        <span className="text-xs font-mono font-bold text-purple-400">{rowCount.toLocaleString()}</span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[1000, 5000, 10000, 50000].map(val => (
                                            <button
                                                key={val}
                                                onClick={() => setRowCount(val)}
                                                className={cn(
                                                    "py-2 rounded-lg text-[10px] font-bold border transition-all",
                                                    rowCount === val
                                                        ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
                                                        : "bg-slate-900 border-white/5 text-slate-500 hover:border-white/20"
                                                )}
                                            >
                                                {val >= 1000 ? `${val/1000}k` : val}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleGenerate}
                                    disabled={!activePrototypeId || isGenerating}
                                    className={cn(
                                        "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3",
                                        activePrototypeId
                                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:scale-[1.02] shadow-xl shadow-indigo-600/30"
                                            : "bg-slate-800 text-slate-600 cursor-not-allowed"
                                    )}
                                >
                                    {isGenerating ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}
                                    {premiumLocales.datasetStudio.panels.generation.action}
                                </button>

                                <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/5">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase mb-3 flex items-center gap-2">
                                        <Layers size={12} /> {premiumLocales.datasetStudio.panels.generation.activeModels}
                                    </h4>
                                    <ul className="space-y-2">
                                        {['Llama-3-70B-Customs', 'DeepSeek-V3-OSINT'].map(m => (
                                            <li key={m} className="flex items-center justify-between text-[11px] text-slate-300">
                                                <span>{m}</span>
                                                <span className="text-emerald-500 font-mono">{premiumLocales.datasetStudio.panels.generation.ready}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </TacticalCard>

                        {/* Recent Activity Mini-Card */}
                        <div className="p-6 bg-slate-900/40 border border-white/5 rounded-3xl">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Clock size={14} className="text-slate-500" /> {premiumLocales.datasetStudio.panels.generation.recentEvents}
                            </h3>
                            <div className="space-y-3">
                                {[1,2,3].map(i => (
                                    <div key={i} className="flex gap-3 text-[10px] border-l border-white/5 pl-3">
                                        <span className="text-slate-600 font-mono">19:40</span>
                                        <span className="text-slate-400">{premiumLocales.datasetStudio.panels.generation.eventSynthesized.replace('{id}', '0' + i)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DatasetStudio;
// 