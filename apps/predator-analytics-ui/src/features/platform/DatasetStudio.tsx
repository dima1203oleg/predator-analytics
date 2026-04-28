/**
 * 📊 Dataset Studio v57 — OSINT Command Center Integration
 *
 * Інтеграція Data Forge, OSINT Command Center, CERS та управління LLM-моделями.
 * Тепер включає потужну візуалізацію 250+ реєстрів та 12 OSINT-інструментів.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Database, Play, Pause, RefreshCw,
    ChevronRight, Filter, Settings, Zap, BarChart3,
    Clock, Cpu, HardDrive, Activity, Shield, Target, Binary, Microscope,
    ScanLine, BrainCircuit, Globe, GitBranch, Layers, Network, Radar, Radio
} from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { CyberGrid } from '@/components/CyberGrid';
import { cn } from '@/utils/cn';
import { api, mlStudioApi } from '@/services/api';
import { premiumLocales } from '../../locales/uk/premium';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { DatabasePipelineMonitor } from '@/components/pipeline/DatabasePipelineMonitor';
import { UserDatasetsPanel, UserDataset } from '@/components/datasets/UserDatasetsPanel';
import { OSINTTool } from '@/types';
import { CERSScoreCard } from '../../components/premium/CERSScoreCard';
import { InvestigationCanvasWidget } from '../../components/premium/InvestigationCanvasWidget';
import { OsintCommandCenter } from '../../components/osint/OsintCommandCenter';
import { OsintGraphExplorer } from '../../components/osint/OsintGraphExplorer';

type StudioTab = 'osint' | 'osint-graph' | 'datasets' | 'ml-studio' | 'graph';

const DatasetStudio: React.FC = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [activePrototypeId, setActivePrototypeId] = useState<string | null>(null);
    const [augmentationLevel, setAugmentationLevel] = useState(50);
    const [rowCount, setRowCount] = useState(1000);
    const [activeTab, setActiveTab] = useState<StudioTab>('osint');
    const [mlStatus, setMlStatus] = useState<any>(null);
    const [mlRuns, setMlRuns] = useState<any[]>([]);
    const [isLoraTraining, setIsLoraTraining] = useState(false);

    useEffect(() => {
        const fetchMlData = async () => {
            try {
                const [status, runs] = await Promise.all([
                    mlStudioApi.getStatus(),
                    mlStudioApi.getRuns(5)
                ]);
                setMlStatus(status);
                setMlRuns(runs);
            } catch (err) {
                console.error('Failed to fetch ML Studio data', err);
            }
        };
        fetchMlData();
        const interval = setInterval(fetchMlData, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleLoraTrain = async () => {
        setIsLoraTraining(true);
        try {
            await mlStudioApi.startLoraTraining({
                model_name: "Llama-3-8B-OSINT",
                dataset_id: activePrototypeId || "ds_auto_gen_01",
                rank: 8,
                alpha: 16
            });
            alert("Процес LoRA тюнінгу успішно ініційовано. Відстежуйте прогрес у MLflow.");
        } catch (err) {
            console.error('LoRA Training failed', err);
        } finally {
            setIsLoraTraining(false);
        }
    };

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

    const TABS: { id: StudioTab; label: string; icon: React.ReactNode }[] = [
        { id: 'osint', label: 'OSINT КОМАНДНИЙ ЦЕНТ ', icon: <Radar size={16} /> },
        { id: 'osint-graph', label: 'OSINT Г АФ', icon: <Network size={16} className="text-cyan-400" /> },
        { id: 'datasets', label: 'ДАТАСЕТИ & МОДЕЛІ', icon: <Database size={16} /> },
        { id: 'ml-studio', label: 'ML STUDIO', icon: <BrainCircuit size={16} className="text-purple-400" /> },
        { id: 'graph', label: 'CERS П ОФІЛЬ', icon: <Activity size={16} className="text-yellow-400" /> },
    ];

    return (
        <PageTransition>
            <div className="min-h-screen pb-20 bg-[#020617] text-slate-200 relative overflow-hidden font-sans">
                <AdvancedBackground />
                <CyberGrid color="rgba(16, 185, 129, 0.03)" />

            <ViewHeader
                title="OSINT КОМАНДНИЙ ЦЕНТ "
                subtitle=" озвідувальне ядро: 250+ реєстрів • 12 OSINT-інструментів • Граф-аналіз"
                icon={<Radar size={20} className="text-emerald-400" />}
                breadcrumbs={['СИНАПСИС', 'РОЗВІДКА', 'OSINT ЦЕНТ ']}
                stats={[
                    { label: "реєстрів", value: '267', icon: <Database size={14} />, color: 'primary' },
                    { label: "Інструментів", value: '12', icon: <Radar size={14} />, color: 'purple' },
                    { label: "Стрічка подій", value: '●', icon: <Radio size={14} className="animate-pulse text-red-500" />, color: 'warning' },
                ]}
            />
            
            <div className="max-w-7xl mx-auto px-6 pt-8 space-y-8">

                {/* ═══ TAB SWITCHER ═══ */}
                <div className="flex items-center gap-1 p-1.5 bg-slate-950/80 rounded-2xl border border-white/5 backdrop-blur-xl w-fit relative z-20">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2',
                                activeTab === tab.id
                                    ? 'bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                            )}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* ═══ TAB CONTENT ═══ */}
                <AnimatePresence mode="wait">
                    {/* ─── OSINT COMMAND CENTER ─── */}
                    {activeTab === 'osint' && (
                        <motion.div
                            key="osint"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="relative z-10"
                        >
                            <OsintCommandCenter />
                        </motion.div>
                    )}

                    {/* ─── OSINT GRAPH EXPLORER ─── */}
                    {activeTab === 'osint-graph' && (
                        <motion.div
                            key="osint-graph"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="relative z-10 h-[800px] w-full bg-[#020617] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl"
                        >
                            <OsintGraphExplorer />
                        </motion.div>
                    )}

                    {/* ─── DATASETS & LLM ─── */}
                    {activeTab === 'datasets' && (
                        <motion.div
                            key="datasets"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10"
                        >
                            {/* Left: Datasets Management & Pipeline */}
                            <div className="lg:col-span-2 space-y-8">
                                <UserDatasetsPanel
                                    className="shadow-2xl shadow-black/40"
                                    onDatasetSelect={(ds: UserDataset) => setActivePrototypeId(ds.id)}
                                />
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Activity size={16} className="text-yellow-400" /> {premiumLocales.datasetStudio.panels.pipeline.title}
                                        </h3>
                                    </div>
                                    <DatabasePipelineMonitor />
                                </div>
                            </div>

                            {/* Right: Generation Forge & LLM */}
                            <div className="space-y-6">
                                <TacticalCard title="КУЗНЯ СИНТЕТИКИ" subtitle="Генерація даних для тренування LLM" variant="holographic">
                                    <div className="p-6 space-y-6">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{premiumLocales.datasetStudio.panels.generation.prototype.label}</label>
                                            <div className={cn(
                                                "p-4 rounded-2xl border transition-all flex items-center justify-between",
                                                activePrototypeId ? "bg-yellow-500/10 border-yellow-500/30" : "bg-slate-900 border-white/5"
                                            )}>
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", activePrototypeId ? "bg-yellow-500 text-white" : "bg-slate-800 text-slate-500")}>
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
                                                <span className="text-xs font-mono font-bold text-yellow-400">{augmentationLevel}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={augmentationLevel}
                                                onChange={(e) => setAugmentationLevel(parseInt(e.target.value))}
                                                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
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
                                                    ? "bg-gradient-to-r from-yellow-600 to-purple-600 text-white hover:scale-[1.02] shadow-xl shadow-yellow-600/30"
                                                    : "bg-slate-800 text-slate-600 cursor-not-allowed"
                                            )}
                                        >
                                            {isGenerating ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}
                                            СТВО ИТИ (СИНТЕЗ)
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
                        </motion.div>
                    )}

                    {/* ─── ML STUDIO & MONITORING ─── */}
                    {activeTab === 'ml-studio' && (
                        <motion.div
                            key="ml-studio"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10"
                        >
                            {/* Left: ML Infrastructure Status */}
                            <div className="lg:col-span-1 space-y-6">
                                <TacticalCard title="ІНФ АСТРУКТУРА ML" variant="cyber">
                                    <div className="p-6 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-slate-500 uppercase">Трекінг MLflow</span>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[9px] font-bold border",
                                                mlStatus?.mlflow?.status === 'online' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"
                                            )}>
                                                {mlStatus?.mlflow?.status === 'online' ? 'ОНЛАЙН' : 'ОФЛАЙН'}
                                            </span>
                                        </div>

                                        <div className="pt-4 border-t border-white/5 space-y-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Двигун Ембедингів Ollama</span>
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-tighter">АКТ</span>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between p-2 rounded bg-slate-950/50 border border-slate-800/50">
                                                    <div className="flex items-center gap-2">
                                                        <Cpu className="w-3 h-3 text-yellow-400" />
                                                        <span className="text-[10px] font-bold text-slate-300">{mlStatus?.ollama?.embedding_engine || 'nomic-embed-text'}</span>
                                                    </div>
                                                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-black border border-yellow-500/30">БАЗОВИЙ</span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <button 
                                                        onClick={() => mlStudioApi.updateEmbeddingsConfig('nomic-embed-text')}
                                                        className="flex flex-col items-center justify-center p-2 rounded bg-slate-950/40 border border-slate-800/50 hover:border-yellow-500/50 transition-all group"
                                                    >
                                                        <span className="text-[8px] font-black text-slate-500 group-hover:text-yellow-400 mb-1 uppercase tracking-tighter">ПОТУЖНІСТЬ</span>
                                                        <span className="text-[10px] font-bold text-slate-300">Векторний Пошук</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => mlStudioApi.updateEmbeddingsConfig('mxbai-embed-large')}
                                                        className="flex flex-col items-center justify-center p-2 rounded bg-slate-950/40 border border-slate-800/50 hover:border-amber-500/50 transition-all group"
                                                    >
                                                        <span className="text-[8px] font-black text-slate-500 group-hover:text-amber-400 mb-1 uppercase tracking-tighter">ТОЧНІСТЬ</span>
                                                        <span className="text-[10px] font-bold text-slate-300">RAG Контекст</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-500 uppercase">НАВАНТАЖЕННЯ GPU КЛАСТЕ А</label>
                                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${mlStatus?.gpu_cluster?.utilization || 0}%` }}
                                                    className="h-full bg-gradient-to-r from-purple-500 to-yellow-500"
                                                />
                                            </div>
                                            <div className="flex justify-between text-[10px] font-mono text-slate-400">
                                                <span>{mlStatus?.gpu_cluster?.total_vram_gb}ГБ ВІДЕОПАМ'ЯТЬ</span>
                                                <span>{mlStatus?.gpu_cluster?.utilization}% ВИК</span>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-white/5 space-y-2">
                                            <div className="text-[10px] text-slate-500 font-bold uppercase">Активні задачі:</div>
                                            {mlStatus?.active_training?.map((job: any) => (
                                                <div key={job.job_id} className="p-3 rounded-xl bg-slate-950/50 border border-yellow-500/20">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[10px] font-bold text-white">{job.model}</span>
                                                        <span className="text-[9px] font-mono text-yellow-400">{job.progress}%</span>
                                                    </div>
                                                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-yellow-500" style={{ width: `${job.progress}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </TacticalCard>
                            </div>

                            {/* Center-Right: LoRA fine-tuning & MLflow Runs */}
                            <div className="lg:col-span-3 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <TacticalCard title="LoRA ДОНАВЧАННЯ" variant="holographic">
                                        <div className="p-6 space-y-6">
                                            <div className="space-y-4">
                                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                                    <p className="text-[10px] text-slate-400 leading-relaxed italic">
                                                        "Low-Rank Adaptation дозволяє донавчати гігантські моделі на специфічних даних митниці, 
                                                        заморожуючи основні ваги та додаючи лише невеликі адаптивні матриці."
                                                    </p>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-slate-500 uppercase">Rank (r)</label>
                                                        <select className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-white">
                                                            <option>8</option>
                                                            <option>16</option>
                                                            <option>32</option>
                                                            <option>64</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-slate-500 uppercase">Alpha</label>
                                                        <select className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-white">
                                                            <option>16</option>
                                                            <option>32</option>
                                                            <option>64</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={handleLoraTrain}
                                                    disabled={isLoraTraining}
                                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-yellow-600 text-white font-black text-[10px] tracking-widest uppercase hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-purple-600/20 flex items-center justify-center gap-3"
                                                >
                                                    {isLoraTraining ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={14} />}
                                                    ЗАПУСТИТИ LoRA АДАПТАЦІЮ
                                                </button>
                                            </div>
                                        </div>
                                    </TacticalCard>

                                    <TacticalCard title="ЕКСПЕ ИМЕНТИ MLflow" variant="cyber">
                                        <div className="p-0">
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="border-b border-white/5 bg-slate-950/40">
                                                            <th className="px-4 py-3 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest">ID Запуску</th>
                                                            <th className="px-4 py-3 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest">Модель/Експ</th>
                                                            <th className="px-4 py-3 text-right text-[9px] font-black text-slate-500 uppercase tracking-widest">Метрики</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5">
                                                        {mlRuns.map((run: any) => (
                                                            <tr key={run.run_id} className="hover:bg-white/5 transition-colors">
                                                                <td className="px-4 py-3 text-[10px] font-mono text-slate-400">#{run.run_id.slice(0, 8)}</td>
                                                                <td className="px-4 py-3">
                                                                    <div className="text-[10px] font-bold text-white">{run.experiment_name}</div>
                                                                    <div className="text-[8px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                                        <Clock size={8} /> {new Date(run.start_time).toLocaleTimeString()}
                                                                        <span className="w-1 h-1 rounded-full bg-slate-600" />
                                                                        <span className="text-emerald-400 uppercase font-black tracking-tighter">{run.status}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <div className="text-[10px] font-mono text-yellow-400">acc: {(run.metrics.accuracy * 100).toFixed(1)}%</div>
                                                                    <div className="text-[9px] font-mono text-slate-500">f1: {run.metrics.f1.toFixed(3)}</div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </TacticalCard>
                                </div>

                                {/* Active Learning Feedback Loop */}
                                <div className="p-8 rounded-[2rem] bg-gradient-to-br from-yellow-950/30 to-slate-950 border border-yellow-500/10 flex items-center justify-between group overflow-hidden relative">
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                                    <div className="relative z-10 flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 group-hover:scale-110 group-hover:bg-yellow-500/20 transition-all duration-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                                            <RefreshCw size={32} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">ЦИКЛ АКТИВНОГО НАВЧАННЯ</h4>
                                            <p className="text-xs text-slate-500 max-w-md">
                                                Система автоматично виявляє аномалії, які неможливо класифікувати з високою впевненістю, та додає їх у чергу для донавчання моделі.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="relative z-10 text-right">
                                        <div className="text-2xl font-mono font-bold text-yellow-400 mb-1">428</div>
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Зразків у Черзі</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── GRAPH & CERS ─── */}
                    {activeTab === 'graph' && (
                        <motion.div
                            key="graph"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10"
                        >
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Activity size={16} className="text-yellow-400" /> CERS Профіль Сутності
                                    </h3>
                                </div>
                                <div className="h-[500px]">
                                    <CERSScoreCard edrpou="39485746" className="h-full" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                                        <Network size={16} className="text-amber-400" /> Граф зв'язків (Neo4j)
                                    </h3>
                                </div>
                                <InvestigationCanvasWidget edrpou="39485746" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    </PageTransition>
    );
};

export default DatasetStudio;