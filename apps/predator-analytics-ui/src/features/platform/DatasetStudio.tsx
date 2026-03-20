/**
 * 📊 Dataset Studio v55
 *
 * Інтеграція Data Forge, OSINT прогресу та управління LLM-моделями.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Database, Play, Pause, RefreshCw,
    ChevronRight, Filter, Settings, Zap, BarChart3,
    Clock, Cpu, HardDrive, Activity, Shield, Target, Binary, Microscope,
    ScanLine, BrainCircuit, Globe, GitBranch, Layers, Network
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { api } from '@/services/api';
import { premiumLocales } from '../../locales/uk/premium';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { TacticalCard } from '@/components/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { DatabasePipelineMonitor } from '@/components/pipeline/DatabasePipelineMonitor';
import { UserDatasetsPanel, UserDataset } from '@/components/datasets/UserDatasetsPanel';
import { OSINTTool } from '@/types';
import { CERSScoreCard } from '../../components/premium/CERSScoreCard';
import { InvestigationCanvasWidget } from '../../components/premium/InvestigationCanvasWidget';

const DatasetStudio: React.FC = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [activePrototypeId, setActivePrototypeId] = useState<string | null>(null);
    const [augmentationLevel, setAugmentationLevel] = useState(50);
    const [rowCount, setRowCount] = useState(1000);
    const [osintTools, setOsintTools] = useState<OSINTTool[]>([]);
    const [isFetchingOsint, setIsFetchingOsint] = useState(false);

    // Збираємо реальні статуси OSINT інструментів (з mock/api)
    useEffect(() => {
        const fetchOsintStatus = async () => {
            try {
                // Якщо є реальний ендпоінт, інакше мокаємо для демо
                const tools = await api.osint.getTools().catch(() => [
                    { id: 'sherlock', name: 'Sherlock', category: 'СОЦМЕРЕЖІ', status: 'СКАНУЄ', findings: 142, lastScan: 'Зараз', color: '#a855f7' },
                    { id: 'amass', name: 'Amass', category: 'МЕРЕЖА', status: 'ОНЛАЙН', findings: 87, lastScan: '2хв тому', color: '#3b82f6' },
                    { id: 'spiderfoot', name: 'SpiderFoot', category: 'РОЗВІДКА', status: 'СКАНУЄ', findings: 450, lastScan: 'Зараз', color: '#10b981' },
                ]);
                setOsintTools(tools as any);
            } catch (e) {
                console.warn('Failed to fetch OSINT tools');
            }
        };

        fetchOsintStatus();
        const interval = setInterval(fetchOsintStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleGenerate = async () => {
        if (!activePrototypeId) return;
        setIsGenerating(true);
        try {
            await api.datasets.generate({
                prototype_id: activePrototypeId,
                augmentation_level: augmentationLevel,
                row_count: rowCount
            });
            alert(`Синтез датасету на базі [${activePrototypeId}] успішно запущено.`);
        } catch (e) {
            console.error('Generation failed', e);
        } finally {
            setIsGenerating(false);
        }
    };

    const activeScansCount = osintTools.filter(t => t.status === 'СКАНУЄ').length;
    const totalOsintFindings = osintTools.reduce((acc, t) => acc + (t.findings || 0), 0);

    return (
        <div className="min-h-screen animate-in fade-in duration-700 pb-20">
            <AdvancedBackground />

            <ViewHeader
                title="СТУДІЯ ДАТАСЕТІВ ТА OSINT"
                subtitle="Синтез даних, управління LLM та інгестія відкритих реєстрів"
                icon={<BrainCircuit size={20} className="text-purple-400" />}
                breadcrumbs={['СИНАПСИС', 'АНАЛІТИКА', 'СТУДІЯ ДАТАСЕТІВ']}
                stats={[
                    { label: "Рядків у Датасеті", value: '1.2M', icon: <Database size={14} />, color: 'primary' },
                    { label: "OSINT Знахідок", value: totalOsintFindings.toString(), icon: <ScanLine size={14} />, color: 'purple' },
                    { label: "Активних Сканів", value: activeScansCount.toString(), icon: <Activity size={14} className={activeScansCount > 0 ? "animate-pulse text-amber-500" : ""} />, color: 'warning' },
                ]}
            />
            
            <div className="max-w-7xl mx-auto px-6 pt-12 space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">

                    {/* Left: Datasets Management & OSINT Pipeline */}
                    <div className="lg:col-span-2 space-y-8">

                        <UserDatasetsPanel
                            className="shadow-2xl shadow-black/40"
                            onDatasetSelect={(ds: UserDataset) => setActivePrototypeId(ds.id)}
                        />

                        {/* OSINT PIPELINE MONITOR */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
                                    <Globe size={16} /> OSINT ІНГЕСТІЯ В РЕАЛЬНОМУ ЧАСІ
                                </h3>
                                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] font-black rounded uppercase flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                                    LIVE FEED
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {osintTools.map((tool, idx) => (
                                    <div key={tool.id || idx} className="p-4 rounded-3xl bg-slate-900/60 border border-white/5 flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-black text-white uppercase tracking-widest">{tool.name}</span>
                                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                                                tool.status === 'СКАНУЄ' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                                                tool.status === 'ОНЛАЙН' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                                                'bg-slate-500/10 border-slate-500/30 text-slate-400'
                                            }`}>
                                                {tool.status}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-[10px] text-slate-500 font-mono mb-1">Знахідок (Records)</div>
                                            <div className="text-lg font-black font-mono text-purple-400">{tool.findings?.toLocaleString() || 0}</div>
                                        </div>
                                        {tool.status === 'СКАНУЄ' && (
                                            <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-amber-500"
                                                    initial={{ width: '0%' }}
                                                    animate={{ width: '100%' }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CERS Score Card */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Activity size={16} className="text-indigo-400" /> CERS Entity Resolution Insights
                                    </h3>
                                </div>
                                <div className="h-[500px]">
                                    <CERSScoreCard edrpou="39485746" className="h-full" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
                                        <Network size={16} className="text-rose-400" /> Neo4j: Граф Зв'язків OSINT
                                    </h3>
                                </div>
                                <InvestigationCanvasWidget edrpou="39485746" />
                            </div>
                        </div>

                        {/* Database Pipeline Monitor */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Activity size={16} className="text-indigo-400" /> {premiumLocales.datasetStudio.panels.pipeline.title}
                                </h3>
                            </div>
                            <DatabasePipelineMonitor />
                        </div>
                    </div>

                    {/* Right: Generation Forge & LLM Models */}
                    <div className="space-y-6">
                        <TacticalCard title="КУЗНЯ СИНТЕТИКИ" subtitle="Генерація даних для тренування LLM" variant="holographic">
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
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">РІВЕНЬ АУГМЕНТАЦІЇ</label>
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
                                        <span>Швидко</span>
                                        <span>Глибоко</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{premiumLocales.datasetStudio.panels.generation.rowCount}</label>
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
                                                {val >= 1000 ? `${val / 1000}k` : val}
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
                                    СТВОРИТИ (СИНТЕЗ)
                                </button>
                            </div>
                        </TacticalCard>

                        {/* LLM Models Status */}
                        <div className="p-6 bg-slate-900/80 border border-emerald-500/20 rounded-3xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
                                <Layers size={14} /> ЛОКАЛЬНІ LLM-МОДЕЛІ
                            </h3>
                            <ul className="space-y-3 relative z-10">
                                {[
                                    { name: 'Llama-3-70B-Customs', stats: '2.4B tokens', status: 'READY' },
                                    { name: 'DeepSeek-V3-OSINT', stats: 'Fine-tuning (Epoch 2/5)', status: 'TRAINING' },
                                    { name: 'Qwen-2.5-Coder-32B', stats: '1.8B tokens', status: 'READY' }
                                ].map(m => (
                                    <li key={m.name} className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/50 border border-white/5">
                                        <div>
                                            <div className="text-[11px] font-bold text-slate-200">{m.name}</div>
                                            <div className="text-[9px] text-slate-500 font-mono mt-0.5">{m.stats}</div>
                                        </div>
                                        <div className={`text-[9px] font-black tracking-widest px-2 py-1 rounded border ${
                                            m.status === 'READY' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                        }`}>
                                            {m.status}
                                            {m.status === 'TRAINING' && <RefreshCw size={10} className="inline ml-1 animate-spin" />}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DatasetStudio;