/**
 * Центр навчання моделей (v60.0-ELITE).
 *
 * Використовує реальні дані з API:
 * - /api/v45/ml/training/status
 * - /api/v45/ml/training/history
 * - /api/v45/ml/jobs
 * - /api/v1/system/stats
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    AlertCircle,
    Brain,
    Cpu,
    Loader2,
    Play,
    RefreshCw,
    ScrollText,
    Terminal,
    Timer,
    Target,
    Binary,
    Layers,
    History as HistoryIcon,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CyberGrid } from '@/components/CyberGrid';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ViewHeader } from '@/components/ViewHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { trainingApi } from '@/services/api/ml';
import { systemApi, type SystemStatsResponse } from '@/services/api/system';
import { cn } from '@/utils/cn';
import { normalizeModelTrainingSnapshot, type TrainingRunRecord, type TrainingTone } from './modelTrainingView.utils';

const toneClasses: Record<TrainingTone, { badge: string; panel: string; accent: string; glow: string }> = {
    emerald: {
        badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
        panel: 'border-emerald-500/10 bg-emerald-500/[0.02]',
        accent: 'text-emerald-400',
        glow: 'bg-emerald-500/20',
    },
    amber: {
        badge: 'border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-[0_0_10px_rgba(225,29,72,0.2)]',
        panel: 'border-rose-500/10 bg-rose-500/[0.02]',
        accent: 'text-rose-400',
        glow: 'bg-rose-500/20',
    },
    slate: {
        badge: 'border-white/10 bg-white/5 text-slate-400',
        panel: 'border-white/5 bg-white/[0.01]',
        accent: 'text-slate-400',
        glow: 'bg-slate-500/10',
    },
    rose: {
        badge: 'border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-[0_0_10px_rgba(225,29,72,0.2)]',
        panel: 'border-rose-500/10 bg-rose-500/[0.02]',
        accent: 'text-rose-400',
        glow: 'bg-rose-500/20',
    },
};

const EmptyState = ({ title, description }: { title: string; description: string }) => (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/40 px-8 text-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-rose-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <motion.div 
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 flex items-center justify-center opacity-[0.03]"
        >
            <Brain size={200} />
        </motion.div>
        <AlertCircle className="mb-6 h-12 w-12 text-rose-500/40 animate-pulse" />
        <div className="text-xl font-black text-white/90 tracking-widest uppercase italic">{title}</div>
        <div className="mt-3 max-w-md text-xs leading-6 text-white/30 font-mono tracking-tighter">{description}</div>
    </div>
);

const RunCard = ({ run }: { run: TrainingRunRecord }) => {
    const tone = toneClasses[run.tone];

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.02)' }}
            className={cn('rounded-sm border p-4 transition-all duration-500 relative group overflow-hidden', tone.panel)}
        >
            <div className="absolute top-0 left-0 w-1 h-full bg-current opacity-20 group-hover:opacity-100 transition-opacity" style={{ color: tone.accent.split('-')[1] }} />
            
            <div className="flex items-start justify-between gap-4 relative z-10">
                <div className="flex flex-col gap-1">
                    <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90 group-hover:text-rose-400 transition-colors">{run.title}</div>
                    <div className="text-[8px] font-mono uppercase tracking-[0.3em] text-white/20">
                        {run.timestampLabel}
                    </div>
                </div>
                <Badge className={cn('border-none px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-none', tone.badge)}>
                    {run.statusLabel}
                </Badge>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 relative z-10">
                {[
                    { label: 'PROGRESS', value: run.progressLabel },
                    { label: 'ACCURACY', value: run.accuracyLabel },
                    { label: 'LOSS_FUNC', value: run.lossLabel },
                ].map((item) => (
                    <div key={item.label} className="bg-white/[0.02] border border-white/[0.05] p-2 flex flex-col gap-1">
                        <div className="text-[7px] font-mono font-black uppercase tracking-widest text-white/20">{item.label}</div>
                        <div className={cn('text-[12px] font-black italic', tone.accent)}>{item.value}</div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export default function ModelTrainingView() {
    const backendStatus = useBackendStatus();
    const [trainingStatus, setTrainingStatus] = useState<unknown>(null);
    const [trainingHistory, setTrainingHistory] = useState<unknown>([]);
    const [trainingJobs, setTrainingJobs] = useState<unknown>([]);
    const [systemStats, setSystemStats] = useState<SystemStatsResponse | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [starting, setStarting] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    const [feedbackTone, setFeedbackTone] = useState<'amber' | 'emerald'>('emerald');
    const logsEndRef = useRef<HTMLDivElement | null>(null);

    const loadData = useCallback(async (silent: boolean = false) => {
        if (!silent) setRefreshing(true);

        try {
            const [statusResult, historyResult, jobsResult, systemResult] = await Promise.allSettled([
                trainingApi.getStatus(),
                trainingApi.getHistory(),
                trainingApi.getMLJobs(),
                systemApi.getStats(),
            ]);

            setTrainingStatus(statusResult.status === 'fulfilled' ? statusResult.value : null);
            setTrainingHistory(historyResult.status === 'fulfilled' ? historyResult.value : []);
            setTrainingJobs(jobsResult.status === 'fulfilled' ? jobsResult.value : []);
            setSystemStats(systemResult.status === 'fulfilled' ? systemResult.value : null);

            if (
                statusResult.status === 'rejected' &&
                historyResult.status === 'rejected' &&
                jobsResult.status === 'rejected' &&
                systemResult.status === 'rejected'
            ) {
                setFeedbackTone('amber');
                setFeedbackMessage('Центр навчання: Системна відмова синхронізації ML-вузла.');
            } else if (!silent) {
                setFeedbackMessage(null);
                
                window.dispatchEvent(new CustomEvent('predator-error', {
                    detail: {
                        service: 'AI_ModelTraining',
                        message: backendStatus.isOffline 
                            ? 'Синхронізація з локальним ML-ядром (MIRROR_VRAM_SAFE).' 
                            : 'ML-контур підключено до NVIDIA MASTER CLUSTER.',
                        severity: 'info',
                        timestamp: new Date().toISOString(),
                        code: backendStatus.isOffline ? 'TRAINING_OFFLINE' : 'TRAINING_SUCCESS'
                    }
                }));
            }
        } catch (error) {
            setFeedbackTone('amber');
            setFeedbackMessage('ML-ENGINE_CRITICAL: Помилка отримання метрик навчання.');
        } finally {
            setRefreshing(false);
        }
    }, [backendStatus.isOffline]);

    useEffect(() => {
        void loadData();
        const interval = window.setInterval(() => void loadData(true), 15000);
        return () => window.clearInterval(interval);
    }, [loadData]);

    const snapshot = useMemo(
        () => normalizeModelTrainingSnapshot(trainingStatus, trainingHistory, trainingJobs, systemStats),
        [trainingStatus, trainingHistory, trainingJobs, systemStats],
    );

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [snapshot.logs]);

    const handleStartTraining = useCallback(async () => {
        setStarting(true);
        setFeedbackMessage(null);

        try {
            await trainingApi.trigger({ domain: 'ml' });
            setFeedbackTone('emerald');
            setFeedbackMessage('Запуск ML-сесії підтверджено. Ініціалізація ваг нейромережі...');
            await loadData(true);
        } catch (error) {
            setFeedbackTone('amber');
            setFeedbackMessage('Запуск відхилено: Недостатньо VRAM або помилка планувальника.');
        } finally {
            setStarting(false);
        }
    }, [loadData]);

    const statusTone = toneClasses[snapshot.session.tone];

    return (
        <PageTransition>
            <div className="relative min-h-full bg-[#050202] p-8 lg:p-12 overflow-hidden selection:bg-rose-500/30">
                <CyberGrid opacity={0.04} />
                
                {/* Tactical Overlays */}
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-rose-500/[0.02] to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-blue-500/[0.01] blur-[150px] pointer-events-none" />

                <div className="relative z-10 max-w-[1800px] mx-auto space-y-10">
                    {/* View Header */}
                    <ViewHeader
                        title={(
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-4">
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-rose-500/20 blur-2xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-1000" />
                                        <div className="relative w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-sm flex items-center justify-center shadow-[0_0_30px_rgba(225,29,72,0.1)]">
                                            <Brain size={28} className="text-rose-500 animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <h1 className="text-4xl font-black tracking-[0.2em] uppercase italic text-white/90">
                                            Fine-Tune <span className="text-rose-500">Lab</span>
                                        </h1>
                                        <div className="flex items-center gap-3 text-[9px] font-mono font-black tracking-[0.4em] text-white/20 uppercase mt-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                                            Активна Нейронна Синхронізація [X-GRID]
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        stats={[
                            {
                                label: 'ML_STATUS',
                                value: snapshot.statusHeadline,
                                icon: <Activity size={14} />,
                                color: snapshot.session.statusKey === 'ERROR' ? 'danger' : snapshot.session.statusKey === 'TRAINING' ? 'warning' : 'success',
                                animate: snapshot.session.isRunning,
                            },
                            {
                                label: 'ACCURACY_L5',
                                value: snapshot.accuracyHeadline,
                                icon: <Target size={14} />,
                                color: 'primary',
                            },
                            {
                                label: 'VRAM_UTILITY',
                                value: snapshot.resources.memoryLabel,
                                icon: <Cpu size={14} />,
                                color: 'warning',
                            },
                        ]}
                        breadcrumbs={['PREDATOR', 'AI_FACTORY', 'FINE_TUNE']}
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
                                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
                                )}
                            >
                                <div className={cn("w-2 h-2 rounded-full animate-pulse", feedbackTone === 'amber' ? "bg-rose-500" : "bg-emerald-500")} />
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
                            <TacticalCard variant="holographic" title="ДАНІ_АКТИВНОЇ_СЕСІЇ" className="bg-black/40 border-white/5 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <Binary size={120} />
                                </div>
                                
                                <div className="space-y-8 mt-4 relative z-10">
                                    <div className="bg-white/[0.02] border border-white/5 p-6 rounded-sm space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[8px] font-mono text-white/30 tracking-widest">NEURAL_MODEL_ID</span>
                                                <span className="text-[18px] font-black text-white italic tracking-tight">{snapshot.session.modelLabel}</span>
                                            </div>
                                            <Badge className={cn('border-none rounded-none text-[9px] px-3 py-1 font-black tracking-[0.2em]', statusTone.badge)}>
                                                {snapshot.session.statusLabel}
                                            </Badge>
                                        </div>
                                        
                                        <p className="text-[11px] leading-relaxed text-white/50 font-mono tracking-tight border-l-2 border-rose-500/20 pl-4 italic">
                                            {snapshot.session.message}
                                        </p>

                                        <div className="grid grid-cols-2 gap-4 pt-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[7px] font-mono text-white/20 tracking-widest uppercase">EPOCH_CYCLE</span>
                                                <span className="text-[14px] font-black text-white/80 font-mono">{snapshot.session.epochLabel}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[7px] font-mono text-white/20 tracking-widest uppercase">LOSS_INDEX</span>
                                                <span className="text-[14px] font-black text-rose-400 font-mono italic">{snapshot.session.lossLabel}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2 pt-4">
                                            <div className="flex justify-between text-[8px] font-mono font-black text-white/30 tracking-widest uppercase">
                                                <span>TRAINING_PHASE_COMPLETE</span>
                                                <span className="text-rose-500">{snapshot.session.progressLabel}</span>
                                            </div>
                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden p-[1px] border border-white/5">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${snapshot.session.progress ?? 0}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    className="h-full bg-gradient-to-r from-rose-900 via-rose-500 to-rose-400 shadow-[0_0_15px_rgba(225,29,72,0.5)] rounded-full relative"
                                                >
                                                    <div className="absolute inset-0 bg-white/20 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                                                </motion.div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Button 
                                            onClick={handleStartTraining}
                                            disabled={snapshot.session.isRunning || starting}
                                            className={cn(
                                                "h-14 rounded-sm font-black tracking-[0.3em] uppercase text-[11px] transition-all duration-700",
                                                snapshot.session.isRunning 
                                                    ? "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                                                    : "bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_30px_rgba(225,29,72,0.3)] hover:shadow-[0_0_50px_rgba(225,29,72,0.5)] border-none"
                                            )}
                                        >
                                            {starting ? <Loader2 className="animate-spin mr-3" size={18} /> : <Play className="mr-3" size={16} fill="currentColor" />}
                                            ІНІЦІАЛІЗУВАТИ_НАВЧАННЯ
                                        </Button>
                                        <Button 
                                            onClick={() => loadData()}
                                            disabled={refreshing}
                                            variant="outline"
                                            className="h-14 rounded-sm bg-white/5 border-white/10 hover:border-white/30 text-white/60 hover:text-white font-black tracking-[0.3em] uppercase text-[11px]"
                                        >
                                            <RefreshCw className={cn("mr-3", refreshing && "animate-spin")} size={16} />
                                            СИНХ ОНІЗУВАТИ_ЯДРО
                                        </Button>
                                    </div>
                                </div>
                            </TacticalCard>

                            <TacticalCard variant="holographic" title="СПОЖИВАННЯ_ ЕСУ СІВ" className="bg-black/40 border-white/5">
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    {[
                                        { label: 'CPU_POWER', value: snapshot.resources.cpuLabel, icon: Activity },
                                        { label: 'VRAM_ALLOC', value: snapshot.resources.memoryLabel, icon: Cpu },
                                        { label: 'ACTIVE_JOBS', value: snapshot.resources.taskLabel, icon: Layers },
                                        { label: 'CORE_LATENCY', value: snapshot.resources.latencyLabel, icon: Timer },
                                    ].map((res) => (
                                        <div key={res.label} className="p-4 bg-white/[0.02] border border-white/5 flex flex-col gap-2 group hover:border-white/20 transition-all">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[7px] font-mono text-white/20 tracking-widest uppercase">{res.label}</span>
                                                <res.icon size={10} className="text-white/20 group-hover:text-rose-500 transition-colors" />
                                            </div>
                                            <span className="text-[16px] font-black text-white/90 italic">{res.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </TacticalCard>
                        </div>

                        {/* Middle Column: Visualization & History */}
                        <div className="col-span-12 xl:col-span-5 space-y-8">
                            <TacticalCard variant="cyber" title="ПОТІК_НЕЙ ОННОЇ_ТОЧНОСТІ" className="bg-black/40 border-white/5 h-[400px] flex flex-col">
                                <div className="flex-1 min-h-0 mt-8">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={snapshot.metrics}>
                                            <defs>
                                                <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                            <XAxis 
                                                dataKey="label" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#ffffff20', fontSize: 8, fontWeight: 900 }}
                                            />
                                            <YAxis 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#ffffff20', fontSize: 8, fontWeight: 900 }}
                                                domain={[0, 100]}
                                            />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '4px', fontSize: '10px', color: '#fff' }}
                                                itemStyle={{ fontWeight: 900, textTransform: 'uppercase' }}
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="accuracy" 
                                                stroke="#f43f5e" 
                                                strokeWidth={3}
                                                fillOpacity={1} 
                                                fill="url(#accuracyGradient)" 
                                                animationDuration={2000}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="p-4 border-t border-white/5 flex items-center justify-between text-[8px] font-mono tracking-widest text-white/20 uppercase">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(225,29,72,1)]" />
                                        <span>ЖИВА_ТЕЛЕМЕТ ІЯ_СИНХ ОНІЗАЦІЯ_ФАЗИ</span>
                                    </div>
                                    <span>З АЗКИ: {snapshot.metrics.length} ЦИКЛІВ</span>
                                </div>
                            </TacticalCard>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="text-[12px] font-black text-white/40 tracking-[0.3em] uppercase italic flex items-center gap-3">
                                        <HistoryIcon size={14} className="text-rose-500" />
                                        Історія_Навчання (History)
                                    </h3>
                                    <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">ARCHIVE_L7</span>
                                </div>
                                
                                {snapshot.runs.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-4">
                                        {snapshot.runs.map((run) => (
                                            <RunCard key={run.id} run={run} />
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState 
                                        title="Історія порожня" 
                                        description="Жодної підтвердженої сесії навчання не знайдено в локальному або хмарному сховищі." 
                                    />
                                )}
                            </div>
                        </div>

                        {/* Right Column: Terminal Logs */}
                        <div className="col-span-12 xl:col-span-3">
                            <TacticalCard variant="holographic" title="ПОТІК_НЕЙ ОННИХ_ЛОГІВ" className="bg-black/60 border-white/5 h-full flex flex-col min-h-[600px]">
                                <div className="flex-1 overflow-auto p-4 font-mono text-[9px] space-y-3 custom-scrollbar">
                                    {snapshot.logs.length > 0 ? (
                                        snapshot.logs.map((log, i) => (
                                            <motion.div 
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                key={i} 
                                                className="flex gap-3 group"
                                            >
                                                <span className="text-rose-500/40 shrink-0 font-black">{`0${i + 1}`.slice(-2)}</span>
                                                <span className={cn(
                                                    "transition-colors duration-300",
                                                    log.includes('ERROR') ? 'text-rose-400 font-bold' : 
                                                    log.includes('SUCCESS') ? 'text-emerald-400' : 
                                                    'text-white/40 group-hover:text-white/80'
                                                )}>
                                                    {log}
                                                </span>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4 text-center">
                                            <Terminal size={40} className="animate-pulse" />
                                            <span className="uppercase tracking-[0.3em] font-black">Очікування потоку...</span>
                                        </div>
                                    )}
                                    <div ref={logsEndRef} />
                                </div>
                                <div className="p-4 bg-rose-500/[0.03] border-t border-rose-500/10 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[8px] font-mono font-black text-emerald-500 uppercase tracking-widest italic">STREAM_READY</span>
                                    </div>
                                    <ScrollText size={14} className="text-white/20" />
                                </div>
                            </TacticalCard>
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
