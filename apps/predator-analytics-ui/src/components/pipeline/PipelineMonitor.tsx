import { AnimatePresence, motion } from 'framer-motion';
import {
    Activity,
    Binary,
    Brain,
    CheckCircle,
    ChevronRight,
    Database,
    Zap,
    HardDrive,
    Shield,
    XCircle,
    Search,
    Music,
    Film,
    Waves,
    Radio,
    Rss,
    Cpu
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    DB_NODE_CONFIGS,
    PIPELINES,
    STAGE_LIBRARY
} from '../../config/pipelineDefinitions';
import { api } from '../../services/api';
import { IngestionJob } from '../../store/useIngestionStore';
import { cn } from '../../utils/cn';
import { NeuralPulse } from '../ui/NeuralPulse';
import { DataReactorCore } from './DataReactorCore';

// ═══════════════════════════════════════════════════════════════════════════
// DATA REACTOR CORE - CANONICAL PREDATOR v35
// ═══════════════════════════════════════════════════════════════════════════

interface JobStatus {
    job_id: string;
    state: string;
    status?: string;
    progress: {
        percent: number;
        stage: string;
        sub_phase?: string;
        details: string;
        eta?: string;
        quality_score?: number;
        records_total?: number;
        records_processed?: number;
    };
    metadata?: {
        parser_stats?: {
            total_rows: number;
            success: number;
            rejected: number;
            duplicates: number;
            anomalies: number;
        };
    };
    error?: string;
}

interface PipelineMonitorProps {
    jobId: string;
    pipelineType?: string;
    externalStatus?: IngestionJob;
    onComplete?: (status: any) => void;
    onError?: (error: string) => void;
}

export const PipelineMonitor: React.FC<PipelineMonitorProps> = ({ jobId, pipelineType = 'default', externalStatus, onComplete, onError }) => {
    const [status, setStatus] = useState<JobStatus | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    const pipelineConfig = PIPELINES[pipelineType] || PIPELINES['default'];
    const stagesList = pipelineConfig.stages.map(key => STAGE_LIBRARY[key]);
    const activeDbNodes = pipelineConfig.dbNodes.map(key => ({ id: key, ...DB_NODE_CONFIGS[key] }));

    const pollStatus = useCallback(async () => {
        try {
            const data = await api.ingestion.getJobStatus(jobId);
            setStatus(data);
            setRetryCount(0);

            if (data.state === 'READY' || data.status === 'ready') {
                onComplete?.(data);
                return;
            }
            if (data.state === 'FAILED' || data.status === 'failed') {
                onError?.(data.error || 'Pipeline failure');
                return;
            }

            setTimeout(pollStatus, 1000);
        } catch (e) {
            setRetryCount(prev => prev + 1);
            setTimeout(pollStatus, 2000);
        }
    }, [jobId, onComplete, onError]);

    useEffect(() => {
        pollStatus();
    }, [pollStatus]);

    const currentIdx = useMemo(() => stagesList.findIndex(s => s.id === status?.state), [status, stagesList]);
    const percent = status?.progress?.percent || 0;

    const CORE_X = 50;
    const CORE_Y = 50;

    return (
        <div className="relative group/reactor bg-slate-950/80 border border-emerald-500/10 rounded-[40px] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] p-10 backdrop-blur-3xl ring-1 ring-white/5">
            {/* ⚛️ REACTOR BACKGROUND LAYERS */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 blur-[120px] opacity-40 rounded-full" />
                <div className="absolute inset-0 bg-cyber-grid opacity-10" />
            </div>

            {/* 🚀 HEADER: Status & Analytics */}
            <div className="flex items-start justify-between mb-12 relative z-20">
                <div className="flex gap-5">
                    <div className="relative">
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                rotate: 360,
                                opacity: [0.3, 0.6, 0.3]
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -inset-4 bg-emerald-500/20 blur-2xl rounded-full"
                        />
                        <div className="w-16 h-16 bg-slate-900 border border-emerald-500/30 rounded-3xl flex items-center justify-center relative z-10 shadow-lg shadow-emerald-500/10">
                            <Binary className="text-emerald-400 w-8 h-8" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
                            {status?.state === 'READY' ? 'KNOWLEDGE CRYSTALLIZED' : 'DATA REACTOR ACTIVE'}
                            {status?.state !== 'READY' && status?.state !== 'FAILED' && (
                                <motion.div
                                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"
                                />
                            )}
                        </h2>
                        <div className="flex items-center gap-4 mt-2 text-[11px] font-mono text-emerald-500/60 uppercase tracking-[0.3em]">
                            <span className="flex items-center gap-1.5"><Activity size={12} className="text-emerald-400" /> Throughput: 1.2GB/s</span>
                            <span className="flex items-center gap-1.5"><Shield size={12} className="text-emerald-400" /> Trust: 99.8%</span>
                        </div>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Pipeline ID</div>
                    <div className="text-xs font-mono text-cyan-400 select-all">{jobId.slice(0, 16).toUpperCase()}</div>
                </div>
            </div>

            {/* 💠 CENTRAL VISUALIZER: Dynamic Mode Engine */}
            <div className="mb-12 relative">
                <div className="h-[400px] bg-slate-900/40 rounded-[32px] border border-white/5 relative overflow-hidden ring-1 ring-white/5">
                    <NeuralPulse color={pipelineConfig.accentColor + '20'} size={600} />

                    {/* MODE 1: ⚛️ DATA REACTOR (Structured) */}
                    {pipelineConfig.visualMode === 'REACTOR' && (
                        <div className="absolute inset-0">
                            <DataReactorCore
                                isActive={status?.state !== 'READY' && status?.state !== 'FAILED'}
                                hasError={status?.state === 'FAILED' || status?.status === 'failed'}
                                stats={{
                                    postgres: { state: percent > 10 ? 'active' : 'idle', count: status?.progress?.records_processed || Math.floor(percent * 15) },
                                    graph: { state: percent > 30 ? 'active' : 'idle', count: Math.floor((status?.progress?.records_processed || Math.floor(percent * 15)) * 1.5) },
                                    opensearch: { state: percent > 50 ? 'active' : 'idle', count: status?.progress?.records_processed || Math.floor(percent * 15) },
                                    qdrant: { state: percent > 70 ? 'active' : 'idle', count: status?.progress?.records_processed || Math.floor(percent * 15) },
                                    redis: { state: status?.state !== 'READY' ? 'active' : 'idle', count: 1 }
                                }}
                            />
                        </div>
                    )}

                    {/* MODE 2: 🕸 NEURAL INTELLIGENCE WEB (Social/Entities) */}
                    {pipelineConfig.visualMode === 'NEURAL_NET' && (
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                            <defs>
                                <filter id="glow"><feGaussianBlur stdDeviation="1.5" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                            </defs>
                            {[...Array(12)].map((_, i) => {
                                const angle = (i / 12) * Math.PI * 2;
                                const x = 50 + Math.cos(angle) * 35;
                                const y = 50 + Math.sin(angle) * 35;
                                const isActive = percent > (i * 8);
                                return (
                                    <g key={i}>
                                        <motion.line
                                            x1="50" y1="50" x2={x} y2={y}
                                            stroke={isActive ? pipelineConfig.accentColor : 'rgba(255,255,255,0.05)'}
                                            strokeWidth={isActive ? "0.8" : "0.2"}
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: isActive ? 1 : 0 }}
                                        />
                                        {isActive && (
                                            <motion.circle
                                                cx={x} cy={y} r="2"
                                                fill={pipelineConfig.accentColor}
                                                filter="url(#glow)"
                                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                                transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
                                            />
                                        )}
                                    </g>
                                )
                            })}
                            <motion.circle
                                cx="50" cy="50" r="12"
                                fill="transparent"
                                stroke={pipelineConfig.accentColor}
                                strokeWidth="0.5"
                                animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.5, 0.2] }}
                                transition={{ duration: 4, repeat: Infinity }}
                            />
                            <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white w-10 h-10 opacity-80" style={{ filter: `drop-shadow(0 0 10px ${pipelineConfig.accentColor})` }} />
                        </svg>
                    )}

                    {/* MODE 3: 🧱 QUANTUM DOCUMENT STACK (OCR/PDF) */}
                    {pipelineConfig.visualMode === 'QUANTUM_STACK' && (
                        <div className="absolute inset-0 flex items-center justify-center p-20">
                            <div className="relative w-full h-full perspective-[1000px]">
                                {[0, 1, 2, 3].map((layer, i) => {
                                    const layerActive = percent > (i * 25);
                                    return (
                                        <motion.div
                                            key={i}
                                            initial={false}
                                            animate={{
                                                y: i * -40,
                                                rotateX: 45,
                                                rotateZ: -10,
                                                opacity: layerActive ? 1 : 0.1,
                                                scale: layerActive ? 1 : 0.95
                                            }}
                                            className={cn(
                                                "absolute inset-x-0 bottom-0 h-32 border-2 rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors duration-1000",
                                                layerActive ? "bg-slate-900 shadow-2xl" : "bg-transparent border-white/5"
                                            )}
                                            style={{ borderColor: layerActive ? pipelineConfig.accentColor : 'rgba(255,255,255,0.05)' }}
                                        >
                                            <div className="text-[10px] font-black uppercase text-white/40 tracking-widest">
                                                {i === 0 ? 'RAW_CONTENT' : i === 1 ? 'OCR_STREAM' : i === 2 ? 'SEMANTIC_VECTORS' : 'KNOWLEDGE_PEAK'}
                                            </div>
                                            {layerActive && i === 3 && <Brain size={24} className="text-emerald-400 animate-bounce" />}
                                            {layerActive && i < 3 && <div className="w-1/2 h-1 bg-white/10 rounded-full overflow-hidden self-center mt-2"><motion.div className="h-full bg-white/20" animate={{ x: ['-100%', '100%'] }} transition={{ duration: 1, repeat: Infinity }} /></div>}
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* MODE 4: 📡 AUTONOMOUS SONAR (Crawler/Web) */}
                    {pipelineConfig.visualMode === 'SONAR' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.2" />
                                <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.2" />
                                <circle cx="50" cy="50" r="15" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.2" />

                                {status?.state !== 'READY' && (
                                    <motion.line
                                        x1="50" y1="50" x2="50" y2="5"
                                        stroke={pipelineConfig.accentColor}
                                        strokeWidth="1"
                                        style={{ originX: 50, originY: 50, filter: `blur(4px)` }}
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    />
                                )}

                                {[...Array(6)].map((_, i) => {
                                    const active = percent > (i * 15);
                                    const x = 50 + Math.cos(i * 1.1) * 35;
                                    const y = 50 + Math.sin(i * 1.1) * 35;
                                    return active && (
                                        <motion.g key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}>
                                            <circle cx={x} cy={y} r="2" fill={pipelineConfig.accentColor} />
                                            <circle cx={x} cy={y} r="4" fill="none" stroke={pipelineConfig.accentColor} strokeWidth="0.2">
                                                <animate attributeName="r" from="2" to="8" dur="2s" repeatCount="indefinite" />
                                                <animate attributeName="opacity" from="1" to="0" dur="2s" repeatCount="indefinite" />
                                            </circle>
                                        </motion.g>
                                    )
                                })}
                                <Search className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20 w-12 h-12" />
                            </svg>
                        </div>
                    )}

                    {/* MODE 5: 🔊 WAVE SPECTRUM (Audio/Video) */}
                    {pipelineConfig.visualMode === 'WAVE_SPECTRUM' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center px-10">
                            <div className="flex items-center justify-center gap-1 h-32 w-full">
                                {[...Array(40)].map((_, i) => {
                                    const isActive = percent > (i * 2.5);
                                    return (
                                        <motion.div
                                            key={i}
                                            className="w-1 rounded-full"
                                            style={{ backgroundColor: isActive ? pipelineConfig.accentColor : 'rgba(255,255,255,0.05)' }}
                                            animate={{
                                                height: isActive ? [20, 80, 40, 90, 20] : 10,
                                                opacity: isActive ? [0.4, 1, 0.4] : 0.2
                                            }}
                                            transition={{
                                                duration: 1.5,
                                                repeat: Infinity,
                                                delay: i * 0.05,
                                                ease: "easeInOut"
                                            }}
                                        />
                                    )
                                })}
                            </div>
                            <div className="mt-8 flex items-center gap-6">
                                <Waves className="text-white/20 w-8 h-8 animate-pulse" />
                                {pipelineType === 'video' ? <Film className="text-white/40 w-8 h-8" /> : <Music className="text-white/40 w-8 h-8" />}
                                <Radio className="text-white/20 w-8 h-8" />
                            </div>
                            <div className="mt-4 text-[10px] font-mono text-white/20 tracking-widest uppercase">
                                Decoding Signal @ 44.1kHz // Frame Analysis v4
                            </div>
                        </div>
                    )}

                    {/* MODE 6: 🌊 PLASMA STREAM (RSS/Feeds) */}
                    {pipelineConfig.visualMode === 'PLASMA_STREAM' && (
                        <div className="absolute inset-0 overflow-hidden">
                            {[...Array(20)].map((_, i) => {
                                const delay = i * 0.5;
                                const duration = 3 + Math.random() * 2;
                                return (
                                    <motion.div
                                        key={i}
                                        className="absolute h-[1px] bg-gradient-to-r from-transparent via-current to-transparent"
                                        style={{
                                            color: pipelineConfig.accentColor,
                                            top: `${10 + Math.random() * 80}%`,
                                            left: '-20%',
                                            width: '40%'
                                        }}
                                        animate={{
                                            left: ['-20%', '120%'],
                                            opacity: [0, 1, 0],
                                            scaleX: [0.5, 1.5, 0.5]
                                        }}
                                        transition={{
                                            duration,
                                            repeat: Infinity,
                                            delay,
                                            ease: "linear"
                                        }}
                                    />
                                )
                            })}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                        className="w-40 h-40 rounded-full border border-white/5 flex items-center justify-center"
                                    >
                                        <Rss className="text-white/10 w-20 h-20" />
                                    </motion.div>
                                    <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/40 w-10 h-10 shadow-[0_0_30px_rgba(255,255,255,0.1)]" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DB Node Anchors */}
                    <div className="absolute inset-0 pointer-events-none">
                        {activeDbNodes.map(node => {
                            const isActive = (status?.state ?? '').includes(node.id.toUpperCase()) || (status?.state === 'READY');
                            const isVisibleInMode = pipelineConfig.visualMode === 'REACTOR';

                            if (!isVisibleInMode) return null;

                            return (
                                <motion.div
                                    key={node.id}
                                    className="absolute flex flex-col items-center gap-3 -translate-x-1/2 -translate-y-1/2"
                                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                                    animate={{ scale: isActive ? 1.15 : 1, opacity: isActive ? 1 : 0.4 }}
                                >
                                    <div className={cn(
                                        "w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                                        isActive ? "bg-white/5 shadow-[0_0_30px_rgba(255,255,255,0.1)] border-white/20" : "bg-slate-950 border-white/5"
                                    )}>
                                        <node.icon size={24} style={{ color: isActive ? node.color : '#475569' }} />
                                        {isActive && status?.state !== 'READY' && <motion.div animate={{ scale: [1, 1.4], opacity: [0.3, 0] }} transition={{ duration: 1, repeat: Infinity }} className="absolute inset-0 rounded-full" style={{ backgroundColor: node.color }} />}
                                    </div>
                                    <div className="flex flex-col items-center gap-0.5">
                                        <span className={cn("text-[9px] font-black uppercase tracking-widest text-center px-2 py-0.5 rounded", isActive ? "text-white bg-slate-900 border border-white/10" : "text-slate-600")}>
                                            {node.name.split(' ')[0]}
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    <div className="absolute top-6 left-6 p-4 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 font-mono text-[9px] text-emerald-500/80 pointer-events-none">
                        <div className="flex items-center gap-2 mb-2 border-b border-emerald-500/20 pb-1">
                            <Zap size={10} /> {pipelineConfig.visualMode}_ENGINE
                        </div>
                        <div className="space-y-1">
                            <p>ENGINE: {pipelineConfig.visualMode}</p>
                            <p>LOAD_SYNC: PARALLEL</p>
                            <p>V3.5_CORE_ACTIVE: TRUE</p>
                            <p>BUFFER: OODA_PRIMARY</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 📊 ANALYTICS HUD */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 space-y-8">
                    <div className="bg-slate-900/60 rounded-[24px] border border-white/5 p-8 relative overflow-hidden">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.3em] mb-2">Total Ingestion Progress</p>
                                <h3 className="text-5xl font-black text-white font-mono">{percent}%</h3>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-emerald-500 font-bold uppercase mb-2">Current Operation</p>
                                <p className="text-lg font-black text-white uppercase tracking-tight">{status?.progress?.stage || 'Reactor Initialization'}</p>
                            </div>
                        </div>

                        <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-white/10 relative shadow-inner">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percent}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-600 via-emerald-400 to-cyan-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                            />
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <div className="flex items-center gap-3 text-sm text-slate-400 font-medium italic">
                                <ChevronRight size={14} className="text-emerald-500 animate-pulse" />
                                {status?.progress?.details || 'Establishing multi-dimensional data routes...'}
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">PostgreSQL</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-pink-500" />
                                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">GraphDB</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 px-2">
                        {stagesList.map((stage, idx) => {
                            const isActive = idx === currentIdx;
                            const isPast = idx < currentIdx;
                            const StageIcon = stage.icon;

                            return (
                                <div key={stage.id} className="flex flex-col items-center gap-3 flex-1">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-2",
                                        isPast ? "bg-emerald-500 border-emerald-400" :
                                            isActive ? "bg-slate-900 border-emerald-500 ring-4 ring-emerald-500/20 shadow-[0_0_20px_#10b98133]" :
                                                "bg-slate-950 border-white/5 grayscale"
                                    )}>
                                        {isPast ? <CheckCircle size={20} className="text-white" /> : <StageIcon size={20} className={cn(isActive ? "text-emerald-400" : "text-slate-700")} />}
                                    </div>
                                    <span className={cn(
                                        "text-[9px] font-black uppercase tracking-tighter text-center max-w-[70px]",
                                        isPast ? "text-emerald-500/70" : isActive ? "text-white" : "text-slate-700"
                                    )}>
                                        {stage.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-slate-900/60 rounded-3xl border border-white/5 p-6 backdrop-blur-xl">
                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Brain size={12} className="text-emerald-500" /> System Metrics
                        </div>

                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-400">Processed</span>
                                    <span className="text-xl font-black text-white font-mono">{status?.progress?.records_processed?.toLocaleString() || '0'}</span>
                                </div>
                                <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                                    <motion.div animate={{ width: `${(status?.progress?.records_processed || 0) / (status?.progress?.records_total || 1) * 100}%` }} className="h-full bg-emerald-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <p className="text-[8px] text-slate-500 font-black uppercase mb-1">Valid</p>
                                    <p className="text-lg font-black text-emerald-400 font-mono">
                                        {status?.metadata?.parser_stats?.success || status?.progress?.records_processed || '0'}
                                    </p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <p className="text-[8px] text-slate-500 font-black uppercase mb-1">Errors</p>
                                    <p className="text-lg font-black text-rose-500 font-mono">
                                        {status?.metadata?.parser_stats?.rejected || '0'}
                                    </p>
                                </div>
                            </div>

                            <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[9px] font-black text-indigo-400 uppercase">Quality Score</span>
                                    <span className="text-xs font-bold text-white">99.2%</span>
                                </div>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                                        <div key={i} className={cn("h-4 flex-1 rounded-sm", i <= 9 ? "bg-emerald-500/40" : "bg-slate-800")} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/40 rounded-[24px] border border-white/5 p-5">
                        <div className="text-[9px] text-slate-500 font-black uppercase mb-3 px-1">Recent Activity Log</div>
                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="text-[9px] font-mono p-2 rounded bg-black/40 border-l-2 border-emerald-500 text-emerald-400/80 leading-relaxed">
                                    [SYS_EVENT] {(status?.progress?.details ?? 'Initializing...').slice(0, 30)}...
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PipelineMonitor;
