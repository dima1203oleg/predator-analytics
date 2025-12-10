/**
 * Dataset Studio - Premium Feature for Synthetic Data Generation
 * 
 * Дозволяє:
 * - Вибирати документи за фільтрами
 * - Генерувати синтетичні датасети
 * - Запускати fine-tuning через H2O LLM Studio
 * - Відстежувати прогрес навчання
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Database, Sparkles, Play, Pause, RefreshCw, Download,
    ChevronRight, Filter, Settings, Zap, BarChart3,
    FileText, Layers, CheckCircle, Clock, AlertCircle,
    Cpu, HardDrive, TrendingUp, ArrowRight, Mic, Volume2
} from 'lucide-react';
import { useVoiceControl, InteractionStatus } from '../hooks/useVoiceControl';
import ReactECharts from 'echarts-for-react';

interface DatasetConfig {
    name: string;
    sourceQuery: string;
    documentCount: number;
    augmentationMethod: 'synonym' | 'paraphrase' | 'backtranslate' | 'template';
    variationsPerDoc: number;
    includeOriginal: boolean;
}

interface TrainingJob {
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    startedAt?: string;
    metrics?: {
        loss: number;
        accuracy: number;
        epoch: number;
    };
}

// Progress bar with gradient
const ProgressBar: React.FC<{ value: number; max?: number }> = ({ value, max = 100 }) => (
    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(value / max) * 100}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-cyan-500 via-teal-500 to-green-500"
        />
    </div>
);

// Stat card
const StatCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string | number;
    trend?: number;
    color: string;
}> = ({ icon, label, value, trend, color }) => (
    <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${color}`}>
                {icon}
            </div>
            <div>
                <div className="text-xs text-slate-500">{label}</div>
                <div className="text-xl font-bold text-white">{value}</div>
                {trend !== undefined && (
                    <div className={`text-xs ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {trend >= 0 ? '+' : ''}{trend}% від минулого
                    </div>
                )}
            </div>
        </div>
    </div>
);

// Training job card
const TrainingJobCard: React.FC<{ job: TrainingJob }> = ({ job }) => {
    const statusColors = {
        pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        running: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        completed: 'bg-green-500/10 text-green-400 border-green-500/20',
        failed: 'bg-red-500/10 text-red-400 border-red-500/20'
    };

    const statusIcons = {
        pending: <Clock className="w-4 h-4" />,
        running: <RefreshCw className="w-4 h-4 animate-spin" />,
        completed: <CheckCircle className="w-4 h-4" />,
        failed: <AlertCircle className="w-4 h-4" />
    };

    return (
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50 hover:border-slate-700/50 transition-colors">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                        <Cpu className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h4 className="font-medium text-white">{job.name}</h4>
                        <div className="text-xs text-slate-500">{job.startedAt || 'Очікує'}</div>
                    </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[job.status]}`}>
                    <span className="flex items-center gap-1">
                        {statusIcons[job.status]}
                        {job.status}
                    </span>
                </div>
            </div>

            {job.status === 'running' && (
                <>
                    <ProgressBar value={job.progress} />
                    <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                        <span>Прогрес: {job.progress}%</span>
                        <span>Epoch {job.metrics?.epoch || 0}/10</span>
                    </div>
                </>
            )}

            {job.status === 'completed' && job.metrics && (
                <div className="flex items-center gap-4 mt-3 text-xs">
                    <div className="px-2 py-1 bg-slate-800 rounded">
                        <span className="text-slate-500">Loss:</span>{' '}
                        <span className="text-green-400 font-mono">{job.metrics.loss.toFixed(4)}</span>
                    </div>
                    <div className="px-2 py-1 bg-slate-800 rounded">
                        <span className="text-slate-500">Accuracy:</span>{' '}
                        <span className="text-cyan-400 font-mono">{(job.metrics.accuracy * 100).toFixed(1)}%</span>
                    </div>
                </div>
            )}
        </div>
    );
};

const DatasetStudio: React.FC = () => {
    const [config, setConfig] = useState<DatasetConfig>({
        name: 'my-semantic-dataset',
        sourceQuery: '',
        documentCount: 0,
        augmentationMethod: 'synonym',
        variationsPerDoc: 3,
        includeOriginal: true
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([
        {
            id: '1',
            name: 'reranker-v2.1',
            status: 'completed',
            progress: 100,
            startedAt: '2 год тому',
            metrics: { loss: 0.0234, accuracy: 0.94, epoch: 10 }
        },
        {
            id: '2',
            name: 'embeddings-uk-v1',
            status: 'running',
            progress: 67,
            startedAt: '15 хв тому',
            metrics: { loss: 0.0523, accuracy: 0.86, epoch: 7 }
        }
    ]);

    const [voiceStatus, setVoiceStatus] = useState<InteractionStatus>('IDLE');
    const { startListening, stopListening, speak } = useVoiceControl(voiceStatus, setVoiceStatus, (text) => {
        setConfig(c => ({ ...c, sourceQuery: text }));
    });

    const toggleVoice = () => {
        if (voiceStatus === 'LISTENING') stopListening();
        else startListening();
    };

    // Simulate generation
    const handleGenerate = useCallback(async () => {
        setIsGenerating(true);
        setGenerationProgress(0);

        for (let i = 0; i <= 100; i += 5) {
            await new Promise(resolve => setTimeout(resolve, 150));
            setGenerationProgress(i);
        }

        setIsGenerating(false);
        setConfig(c => ({ ...c, documentCount: 9832 }));
        speak("Dataset generation completed. 9832 documents ready for fine-tuning.");
    }, [speak]);

    const handleStartTraining = useCallback(() => {
        const newJob: TrainingJob = {
            id: Date.now().toString(),
            name: config.name,
            status: 'pending',
            progress: 0
        };
        setTrainingJobs(jobs => [newJob, ...jobs]);
    }, [config.name]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20">
                            <Database className="w-8 h-8 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Dataset Studio</h1>
                            <p className="text-sm text-slate-500">Генерація синтетичних даних та fine-tuning</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="px-4 py-2 bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-700 transition-colors">
                            <Settings className="w-4 h-4" />
                        </button>
                        <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg 
                             hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Відкрити H2O Studio
                        </button>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <StatCard
                        icon={<FileText className="w-5 h-5 text-cyan-400" />}
                        label="Документи в базі"
                        value="127,432"
                        trend={12}
                        color="bg-cyan-500/10"
                    />
                    <StatCard
                        icon={<Layers className="w-5 h-5 text-purple-400" />}
                        label="Синтетичні приклади"
                        value="89,216"
                        trend={45}
                        color="bg-purple-500/10"
                    />
                    <StatCard
                        icon={<Cpu className="w-5 h-5 text-pink-400" />}
                        label="Натреновані моделі"
                        value="12"
                        color="bg-pink-500/10"
                    />
                    <StatCard
                        icon={<HardDrive className="w-5 h-5 text-green-400" />}
                        label="Використано місця"
                        value="4.2 GB"
                        color="bg-green-500/10"
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    {/* Left: Dataset generation */}
                    <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/50">
                        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-amber-400" />
                            Генерація датасету
                        </h2>

                        {/* Source selection */}
                        <div className="mb-6">
                            <label className="text-sm text-slate-400 mb-2 block">Джерело даних</label>
                            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 border-dashed">
                                <div className="text-center">
                                    <Filter className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                                    <p className="text-sm text-slate-500">Перетягни фільтри з пошуку</p>
                                    <p className="text-xs text-slate-600 mt-1">або введи запит для вибірки документів</p>
                                </div>
                            </div>
                            <input
                                type="text"
                                placeholder="category:AI AND date:2024-2025"
                                value={config.sourceQuery}
                                onChange={(e) => setConfig(c => ({ ...c, sourceQuery: e.target.value }))}
                                className="w-full mt-3 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl 
                           text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 pr-12"
                            />
                            <button
                                onClick={toggleVoice}
                                className={`absolute right-4 bottom-3 p-1.5 rounded-lg transition-colors ${voiceStatus === 'LISTENING' ? 'text-red-500 bg-red-500/10' : 'text-slate-400 hover:text-white'}`}
                            >
                                <Mic className="w-5 h-5" />
                            </button>
                            <div className="relative"></div>{/* Hack to keep layout valid if needed, but absolute positioning works inside relative parent? */}
                        </div>

                        {/* Augmentation method */}
                        <div className="mb-6">
                            <label className="text-sm text-slate-400 mb-2 block">Метод аугментації</label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { value: 'synonym', label: 'Синоніми', desc: 'Заміна слів синонімами' },
                                    { value: 'paraphrase', label: 'Парафраз', desc: 'Перефразування речень' },
                                    { value: 'backtranslate', label: 'Зворотний\nпереклад', desc: 'EN→UK→EN' },
                                    { value: 'template', label: 'Шаблони', desc: 'Структурні варіації' }
                                ].map(method => (
                                    <button
                                        key={method.value}
                                        onClick={() => setConfig(c => ({ ...c, augmentationMethod: method.value as any }))}
                                        className={`p-4 rounded-xl border text-left transition-all ${config.augmentationMethod === method.value
                                            ? 'bg-purple-500/10 border-purple-500/50 text-purple-400'
                                            : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:border-slate-600'
                                            }`}
                                    >
                                        <div className="font-medium text-sm whitespace-pre-line">{method.label}</div>
                                        <div className="text-xs text-slate-500 mt-1">{method.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Variations count */}
                        <div className="mb-6">
                            <label className="text-sm text-slate-400 mb-2 block">
                                Варіацій на документ: <span className="text-purple-400 font-medium">{config.variationsPerDoc}</span>
                            </label>
                            <input
                                type="range"
                                min={1}
                                max={10}
                                value={config.variationsPerDoc}
                                onChange={(e) => setConfig(c => ({ ...c, variationsPerDoc: Number(e.target.value) }))}
                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                           [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                           [&::-webkit-slider-thumb]:bg-purple-500"
                            />
                        </div>

                        {/* Generate button */}
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium 
                         rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all 
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    Генерація... {generationProgress}%
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Згенерувати 10,000 прикладів
                                </>
                            )}
                        </button>

                        {isGenerating && (
                            <div className="mt-4">
                                <ProgressBar value={generationProgress} />
                            </div>
                        )}

                        {/* Result summary */}
                        {config.documentCount > 0 && !isGenerating && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20"
                            >
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-6 h-6 text-green-400" />
                                    <div>
                                        <div className="text-green-400 font-medium">
                                            Додано {config.documentCount.toLocaleString()} прикладів
                                        </div>
                                        <div className="text-sm text-slate-500">
                                            Готово до fine-tuning!
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => speak(`Dataset generation complete. ${config.documentCount} examples added.`)}
                                        className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                                    >
                                        <Volume2 className="w-5 h-5" />
                                    </button>
                                </div>
                                <button
                                    onClick={handleStartTraining}
                                    className="mt-4 w-full py-3 bg-green-500/20 text-green-400 font-medium rounded-lg 
                             hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Play className="w-4 h-4" />
                                    Запустити fine-tuning
                                </button>
                            </motion.div>
                        )}
                    </div>

                    {/* Right: Training jobs & Analytics */}
                    <div className="flex flex-col gap-6">
                        {/* Dataset Quality Graph */}
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/50">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-400" />
                                Якість Даних
                            </h2>
                            <ReactECharts
                                option={{
                                    tooltip: { trigger: 'axis' },
                                    grid: { top: 10, bottom: 20, left: 40, right: 10 },
                                    xAxis: { type: 'category', data: ['v1', 'v2', 'v3', 'v4', 'v5'], axisLine: { lineStyle: { color: '#475569' } } },
                                    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#334155' } }, axisLine: { lineStyle: { color: '#475569' } } },
                                    series: [{
                                        data: [0.65, 0.72, 0.78, 0.85, 0.92],
                                        type: 'line',
                                        smooth: true,
                                        symbolSize: 8,
                                        lineStyle: { color: '#10b981', width: 3 },
                                        itemStyle: { color: '#10b981' },
                                        areaStyle: {
                                            color: new (window as any).echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                                { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
                                                { offset: 1, color: 'rgba(16, 185, 129, 0)' }
                                            ])
                                        }
                                    }]
                                }}
                                style={{ height: '200px' }}
                                theme="dark"
                            />
                        </div>

                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/50">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                                    Training Jobs
                                </h2>
                                <button className="text-sm text-slate-500 hover:text-white transition-colors">
                                    Показати всі
                                </button>
                            </div>

                            <div className="space-y-4">
                                {trainingJobs.map(job => (
                                    <TrainingJobCard key={job.id} job={job} />
                                ))}
                            </div>

                            {/* H2O Studio embed placeholder */}
                            <div className="mt-6 p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                <div className="text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 
                              flex items-center justify-center">
                                        <Cpu className="w-8 h-8 text-cyan-400" />
                                    </div>
                                    <h3 className="text-white font-medium mb-2">H2O LLM Studio</h3>
                                    <p className="text-sm text-slate-500 mb-4">
                                        No-code fine-tuning для embedding та reranker моделей
                                    </p>
                                    <button className="px-6 py-2 bg-cyan-500/10 text-cyan-400 rounded-lg 
                                 hover:bg-cyan-500/20 transition-colors flex items-center gap-2 mx-auto">
                                        Відкрити Studio
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default DatasetStudio;
