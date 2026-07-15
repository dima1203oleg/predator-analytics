import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    AlertCircle,
    Brain,
    Cpu,
    Play,
    RefreshCw,
    Terminal,
    Timer,
    Layers,
    Database,
    Zap,
    ScrollText,
    CheckCircle2
} from 'lucide-react';
import { CyberGrid } from '@/components/CyberGrid';
import { HoloCard } from '@/components/ui/HoloCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ViewHeader } from '@/components/ViewHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { cn } from '@/utils/cn';
import { useUISound, UISoundType } from '@/hooks/useUISound';

interface SystemResource {
    cpuLabel: string;
    memoryLabel: string;
}

interface ReportData {
    job?: {
        run_id?: string;
        dataset_path?: string;
        hyperparameters?: any;
    };
    dataset_metrics?: {
        total_records?: number;
        synthetic_records?: number;
        quality_score?: number;
    };
    eval_metrics?: {
        final_loss?: number;
        improvement?: boolean;
    };
    decision?: {
        deployed?: boolean;
        reason?: string;
    };
    status?: string; // from the fallback endpoint
    cycle?: number;
    max_cycles?: number;
}

export default function ContinuousLearningView() {
    const { play } = useUISound();
    const [report, setReport] = useState<ReportData | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [starting, setStarting] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    const [feedbackTone, setFeedbackTone] = useState<'amber' | 'emerald'>('emerald');
    const logsEndRef = useRef<HTMLDivElement | null>(null);

    // Mock live system stats
    const [sysStats, setSysStats] = useState<SystemResource>({
        cpuLabel: '24%',
        memoryLabel: '41%'
    });

    const loadData = useCallback(async (silent: boolean = false) => {
        if (!silent) setRefreshing(true);

        try {
            const res = await fetch('/api/v1/deepseek_tuning/status');
            if (res.ok) {
                const data = await res.json();
                setReport(data);
                if (!silent) setFeedbackMessage(null);
            } else {
                throw new Error('API Error');
            }

            // Simulate slight variation in system stats
            setSysStats({
                cpuLabel: `${Math.floor(Math.random() * 30 + 10)}%`,
                memoryLabel: `${Math.floor(Math.random() * 20 + 40)}%`,
            });
        } catch (error) {
            setFeedbackTone('amber');
            setFeedbackMessage('ML-ENGINE_CRITICAL: Помилка отримання метрик.');
        } finally {
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        void loadData();
        const interval = window.setInterval(() => void loadData(true), 5000);
        return () => window.clearInterval(interval);
    }, [loadData]);

    const handleStartPipeline = useCallback(async () => {
        play(UISoundType.CLICK);
        setStarting(true);
        setFeedbackMessage(null);

        try {
            const res = await fetch('/api/v1/deepseek_tuning/start_pipeline', { method: 'POST' });
            if (res.ok) {
                setFeedbackTone('emerald');
                setFeedbackMessage('Запуск повного циклу Continuous Learning підтверджено.');
                await loadData(true);
            } else {
                throw new Error('Failed to start');
            }
        } catch (error) {
            setFeedbackTone('amber');
            setFeedbackMessage('Запуск відхилено: Недостатньо VRAM або помилка.');
        } finally {
            setStarting(false);
        }
    }, [loadData, play]);

    const isRunning = starting || report?.status === 'IN_PROGRESS';
    
    // Derive UI state from report
    const processedCount = report?.dataset_metrics?.total_records || 0;
    const syntheticCount = report?.dataset_metrics?.synthetic_records || 0;
    const qualityScore = report?.dataset_metrics?.quality_score || 0;
    const isDeployed = report?.decision?.deployed;
    const decisionReason = report?.decision?.reason || 'Очікування нових даних';
    const evalLoss = report?.eval_metrics?.final_loss?.toFixed(4) || 'Н/Д';

    const logs = [];
    if (report?.status === 'No active or completed tuning jobs found.') {
        logs.push(`[SYSTEM] ${report.status}`);
    } else if (report?.job) {
        if (report?.cycle) {
            logs.push(`[SYSTEM] === ІНІЦІАЛІЗАЦІЯ ЦИКЛУ ${report.cycle}/${report.max_cycles || 5} ===`);
        }
        logs.push(`[PIPELINE] Data extraction and dataset building complete. Processed: ${processedCount}`);
        logs.push(`[PIPELINE] Synthetic Agent augmented data. Synthetic records generated: ${syntheticCount}`);
        logs.push(`[PIPELINE] Split generation complete. Quality score: ${qualityScore.toFixed(2)}`);
        logs.push(`[ML-ENGINE] Started training run: ${report.job.run_id}`);
        logs.push(`[ML-ENGINE] Evaluation loss achieved: ${evalLoss}`);
        
        if (isDeployed) {
            logs.push(`[DECISION] Model version deployed. Reason: ${decisionReason}`);
            logs.push(`[KNOWLEDGE] Indexing updated with new references. System ready.`);
        } else if (report?.status === 'FAILED') {
            logs.push(`[DECISION] Model rollback. Reason: ${decisionReason}`);
            logs.push(`[SYSTEM] Критична помилка: Вичерпано ліміт циклів (${report.max_cycles}). Навчання перервано.`);
        } else {
            logs.push(`[DECISION] Model rollback. Reason: ${decisionReason}`);
            logs.push(`[SYSTEM] Початок нового циклу для пошуку унікальних записів та покращення результату...`);
        }
    } else {
        logs.push(`[SYSTEM] Очікування старту циклу.`);
    }

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [report]);

    return (
        <PageTransition>
            <div className="relative min-h-full bg-[#050202] p-8 lg:p-12 overflow-hidden selection:bg-cyan-500/30">
                <CyberGrid opacity={0.04} />
                
                {/* Tactical Overlays */}
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-emerald-500/[0.02] to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-cyan-500/[0.01] blur-[150px] pointer-events-none" />

                <div className="relative z-10 max-w-[1800px] mx-auto space-y-10">
                    <ViewHeader
                        title={(
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-4">
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-1000" />
                                        <div className="relative w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-sm flex items-center justify-center">
                                            <RefreshCw size={28} className="text-emerald-500" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <h1 className="text-4xl font-black tracking-[0.2em] uppercase italic text-white/90">
                                            Continuous <span className="text-emerald-500">Learning</span>
                                        </h1>
                                        <div className="flex items-center gap-3 text-[9px] font-mono font-black tracking-[0.4em] text-white/20 uppercase mt-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                            Автономний Цикл DeepSeek R1
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        stats={[
                            {
                                label: 'ПРОЦЕС',
                                value: isRunning ? 'АКТИВНИЙ' : 'ОЧІКУВАННЯ',
                                icon: <Activity size={14} />,
                                color: isRunning ? 'warning' : 'success',
                                animate: isRunning,
                            },
                            {
                                label: 'ЦИКЛ НАВЧАННЯ',
                                value: report?.cycle ? `${report.cycle} / ${report.max_cycles || 5}` : 'Н/Д',
                                icon: <RefreshCw size={14} />,
                                color: 'primary',
                                animate: isRunning,
                            },
                            {
                                label: 'ОСТАННЯ ВТРАТА (LOSS)',
                                value: String(evalLoss),
                                icon: <Timer size={14} />,
                                color: 'primary',
                            },
                            {
                                label: 'СТАТУС ЗНАНЬ',
                                value: isDeployed ? 'ОНОВЛЕНО' : 'СТАБІЛЬНИЙ',
                                icon: <Database size={14} />,
                                color: 'success',
                            },
                        ]}
                        breadcrumbs={['PREDATOR', 'AI_FACTORY', 'CONTINUOUS_LEARNING']}
                    />

                    {/* Feedback Bar */}
                    <AnimatePresence>
                        {feedbackMessage && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={cn(
                                    'p-4 border rounded-sm text-[10px] font-mono font-black uppercase tracking-widest flex items-center gap-4',
                                    feedbackTone === 'amber'
                                        ? 'bg-cyan-500/10 border-cyan-500/30 text-rose-400'
                                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
                                )}
                            >
                                <div className={cn("w-2 h-2 rounded-full", feedbackTone === 'amber' ? "bg-cyan-500" : "bg-emerald-500")} />
                                {feedbackMessage}
                                <div className="ml-auto flex gap-1">
                                    {[1,2,3].map(i => <div key={i} className="w-3 h-[1px] bg-current opacity-40" />)}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Main Layout */}
                    <div className="grid grid-cols-12 gap-8">
                        
                        {/* Left Column: Active Session & Controls */}
                        <div className="col-span-12 xl:col-span-4 space-y-8">
                            <HoloCard variant="holographic" title="СТАН_ЦИКЛУ" className="bg-black/40 border-white/5 shadow-2xl relative overflow-hidden">
                                <div className="space-y-8 mt-4 relative z-10">
                                    <div className="bg-white/[0.02] border border-white/5 p-6 rounded-sm space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[8px] font-mono text-white/30 tracking-widest">АКТИВНА МОДЕЛЬ</span>
                                                <span className="text-[18px] font-black text-white italic tracking-tight">DeepSeek R1 (LORA)</span>
                                            </div>
                                            <Badge className={cn('border-none rounded-none text-[9px] px-3 py-1 font-black tracking-[0.2em]', isRunning ? 'bg-amber-500/20 text-amber-500' : report?.status === 'FAILED' ? 'bg-rose-500/20 text-rose-500' : 'bg-emerald-500/20 text-emerald-500')}>
                                                {isRunning ? `НАВЧАННЯ (ЦИКЛ ${report?.cycle || 1})` : report?.status === 'FAILED' ? 'ПОМИЛКА ЦИКЛУ' : 'ОЧІКУВАННЯ'}
                                            </Badge>
                                        </div>
                                        
                                        <p className="text-[11px] leading-relaxed text-white/50 font-mono tracking-tight border-l-2 border-emerald-500/20 pl-4 italic">
                                            {isDeployed ? "Модель успішно оновлена та розгорнута в продакшені. Знання індексовано." : report?.status === 'FAILED' ? "Досягнуто ліміту циклів навчання. Модель відхилено." : isRunning ? `Йде пошук унікальних записів та тренування моделі (Цикл ${report?.cycle})...` : "Система очікує нових даних для запуску наступного циклу навчання."}
                                        </p>

                                        <div className="grid grid-cols-2 gap-4 pt-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[7px] font-mono text-white/20 tracking-widest uppercase">ЗІБРАНІ ПРИКЛАДИ</span>
                                                <span className="text-[14px] font-black text-white/80 font-mono">{processedCount}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[7px] font-mono text-white/20 tracking-widest uppercase">СИНТЕТИЧНІ ДАНІ</span>
                                                <span className="text-[14px] font-black text-cyan-400 font-mono italic">+{syntheticCount}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Button 
                                            onClick={handleStartPipeline}
                                            disabled={isRunning}
                                            className={cn(
                                                "h-14 rounded-sm font-black tracking-[0.3em] uppercase text-[11px] transition-all duration-700",
                                                isRunning 
                                                    ? "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                                                    : "bg-emerald-600 hover:bg-emerald-500 text-white border-none"
                                            )}
                                        >
                                            {starting ? <RefreshCw className="animate-spin mr-3" size={16} /> : <Play className="mr-3" size={16} fill="currentColor" />}
                                            ІНІЦІАЛІЗУВАТИ
                                        </Button>
                                        <Button 
                                            onClick={() => loadData()}
                                            disabled={refreshing}
                                            variant="outline"
                                            className="h-14 rounded-sm bg-white/5 border-white/10 hover:border-white/30 text-white/60 hover:text-white font-black tracking-[0.3em] uppercase text-[11px]"
                                        >
                                            <RefreshCw className={cn("mr-3", refreshing && "animate-spin")} size={16} />
                                            ОНОВИТИ_СТАТУС
                                        </Button>
                                    </div>
                                </div>
                            </HoloCard>

                            <HoloCard variant="holographic" title="ІНФРАСТРУКТУРА" className="bg-black/40 border-white/5">
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    {[
                                        { label: 'CPU', value: sysStats.cpuLabel, icon: Activity },
                                        { label: 'GPU VRAM', value: sysStats.memoryLabel, icon: Cpu },
                                        { label: 'ЧЕРГА ЗАДАЧ', value: isRunning ? '1' : '0', icon: Layers },
                                        { label: 'ВЕКТОРНИЙ ІНДЕКС', value: isDeployed ? 'СИНХРОНІЗОВАНО' : 'ГОТОВИЙ', icon: Database },
                                    ].map((res) => (
                                        <div key={res.label} className="p-4 bg-white/[0.02] border border-white/5 flex flex-col gap-2 group hover:border-white/20 transition-all">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[7px] font-mono text-white/20 tracking-widest uppercase">{res.label}</span>
                                                <res.icon size={10} className="text-white/20 group-hover:text-emerald-500 transition-colors" />
                                            </div>
                                            <span className="text-[14px] font-black text-white/90 italic">{res.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </HoloCard>
                        </div>

                        {/* Right Column: Terminal Logs */}
                        <div className="col-span-12 xl:col-span-8">
                            <HoloCard variant="holographic" title="ЖУРНАЛ_ПОДІЙ" className="bg-black/60 border-white/5 h-full flex flex-col min-h-[600px]">
                                <div className="flex-1 overflow-auto p-4 font-mono text-[10px] space-y-4 custom-scrollbar">
                                    {logs.length > 0 ? (
                                        logs.map((log, i) => (
                                            <motion.div 
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                key={i} 
                                                className="flex gap-3 group"
                                            >
                                                <span className="text-emerald-500/40 shrink-0 font-black">{`0${i + 1}`.slice(-2)}</span>
                                                <span className={cn(
                                                    "transition-colors duration-300",
                                                    log.includes('ERROR') ? 'text-rose-400 font-bold' : 
                                                    log.includes('SUCCESS') || log.includes('deployed') ? 'text-emerald-400' : 
                                                    'text-white/60 group-hover:text-white/90'
                                                )}>
                                                    {log}
                                                </span>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4 text-center">
                                            <Terminal size={40} className="" />
                                            <span className="uppercase tracking-[0.3em] font-black">Очікування потоку...</span>
                                        </div>
                                    )}
                                    <div ref={logsEndRef} />
                                </div>
                                <div className="p-4 bg-emerald-500/[0.03] border-t border-emerald-500/10 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[8px] font-mono font-black text-emerald-500 uppercase tracking-widest italic">STREAM_READY</span>
                                    </div>
                                    <ScrollText size={14} className="text-white/20" />
                                </div>
                            </HoloCard>
                        </div>

                    </div>
                </div>

                {/* Corner Accents */}
                <div className="absolute top-4 left-4 w-12 h-12 border-t border-l border-white/10 pointer-events-none" />
                <div className="absolute top-4 right-4 w-12 h-12 border-t border-r border-white/10 pointer-events-none" />
                <div className="absolute bottom-4 left-4 w-12 h-12 border-b border-l border-white/10 pointer-events-none" />
                <div className="absolute bottom-4 right-4 w-12 h-12 border-b border-r border-white/10 pointer-events-none" />
            </div>
        </PageTransition>
    );
}
