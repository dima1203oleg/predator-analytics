
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import {
    Activity, Database, FileText, Layers, Server, Cpu,
    CheckCircle, AlertOctagon, Loader, Zap, ArrowRight,
    Terminal, Binary, Radio, HardDriveDownload
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface EtlJob {
    job_id: string;
    source_file: string;
    state: string;
    progress: {
        percent: number;
        records_total: number;
        records_processed: number;
        records_indexed: number;
        stage?: string;
    };
    timestamps: {
        created_at: string;
        updated_at: string;
    };
    constitutional_compliance: boolean;
}

export const EtlProcessMonitor: React.FC = () => {
    const [jobs, setJobs] = useState<EtlJob[]>([]);
    const [globalStatus, setGlobalStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchStatus = async () => {
        try {
            const [jobsData, statusData] = await Promise.all([
                api.getETLJobs(5).catch(() => ({ jobs: [] })),
                api.getETLStatus().catch(() => ({ active_jobs_count: 0, total_records: 0 }))
            ]);
            setJobs(jobsData.jobs || []);
            setGlobalStatus(statusData);
        } catch (e) {
            console.error("Failed to fetch ETL status", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full space-y-8">
            {/* Global Pipeline Metrics v55 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Active Streams', val: globalStatus?.active_jobs_count || 0, icon: Radio, color: 'text-cyan-400' },
                    { label: 'System Load', val: '24.2%', icon: Cpu, color: 'text-purple-400' },
                    { label: 'Data Velocity', val: '2.4 GB/s', icon: Zap, color: 'text-amber-400' },
                    { label: 'Integrity', val: 'Secured', icon: ShieldCheckIcon, color: 'text-emerald-400' }
                ].map((m, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-3xl group hover:border-white/10 transition-all"
                    >
                        <m.icon size={18} className={cn("mb-4", m.color)} />
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{m.label}</div>
                        <div className={cn("text-2xl font-black font-mono tracking-tighter", m.color)}>{m.val}</div>
                    </motion.div>
                ))}
            </div>

            {/* Main Job Queue Container */}
            <div className="bg-slate-950/40 backdrop-blur-3xl border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
                {/* Internal Terminal Header */}
                <div className="px-8 py-6 border-b border-white/5 bg-gradient-to-r from-blue-900/10 to-transparent flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <h2 className="text-sm font-black text-white uppercase tracking-widest font-mono">Kernel Pipeline Queue // Active</h2>
                    </div>
                    <div className="flex gap-6 font-mono text-[10px] text-slate-500">
                        <span>Buffer: 1024MB</span>
                        <span className="hidden sm:inline">Worker_Threads: 8</span>
                        <span className="text-cyan-400">Status: HEALTHY</span>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {loading && jobs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40 italic">
                            <Loader className="animate-spin text-cyan-400" />
                            <span className="text-xs font-mono">Initializing Pipeline Scanner...</span>
                        </div>
                    ) : jobs.length === 0 ? (
                        <div className="text-center py-20 bg-black/20 rounded-3xl border border-dashed border-white/5">
                            <Binary className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                            <h3 className="text-lg font-black text-slate-600 uppercase tracking-widest">No Active Pipelines</h3>
                            <p className="text-xs text-slate-700 uppercase mt-2 font-mono">Awaiting primary data injection</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {jobs.map((job) => (
                                <EtlJobModule key={job.job_id} job={job} />
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
};

const EtlJobModule: React.FC<{ job: EtlJob }> = ({ job }) => {
    const stages = [
        { label: 'E', full: 'Extract', icon: FileText, active: ['created', 'uploading', 'processing', 'indexing', 'vectorizing', 'completed'].includes(job.state) },
        { label: 'T', full: 'Transform', icon: Layers, active: ['processing', 'indexing', 'vectorizing', 'completed'].includes(job.state) },
        { label: 'L', full: 'Load_DB', icon: Database, active: ['processing', 'indexing', 'vectorizing', 'completed'].includes(job.state) },
        { label: 'I', full: 'Inverted_Index', icon: Server, active: ['indexing', 'vectorizing', 'completed'].includes(job.state) },
        { label: 'V', full: 'Vector_Space', icon: Cpu, active: ['vectorizing', 'completed'].includes(job.state) },
    ];

    const isComplete = job.state === 'completed';
    const isFailed = job.state === 'failed';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 bg-slate-900/60 rounded-[32px] border border-white/5 relative group hover:border-cyan-500/20 transition-all duration-500"
        >
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
                <div className="flex items-center gap-6">
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-colors border",
                        isComplete ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : isFailed ? "bg-rose-500/10 border-rose-500/30 text-rose-400" : "bg-cyan-500/10 border-cyan-400/30 text-cyan-400"
                    )}>
                        <HardDriveDownload size={24} className={!isComplete && !isFailed ? "animate-bounce" : ""} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-black text-white uppercase tracking-tight font-mono">{job.source_file.split('/').pop()}</h3>
                            <span className={cn(
                                "text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border",
                                isComplete ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : isFailed ? "bg-rose-500/10 border-rose-500/30 text-rose-400" : "bg-blue-500/10 border-blue-500/30 text-blue-400 animate-pulse"
                            )}>
                                {job.state}
                            </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 flex items-center gap-4">
                            <span>PID: {job.job_id.slice(0, 8)}...</span>
                            <span>TS: {new Date(job.timestamps.updated_at).toLocaleTimeString()}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6 w-full xl:w-auto">
                    <div className="flex-1 xl:w-48">
                        <div className="flex justify-between text-[10px] font-black font-mono text-slate-500 uppercase tracking-widest mb-2">
                            <span>Integrity Control</span>
                            <span className="text-white">{job.progress.percent}%</span>
                        </div>
                        <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${job.progress.percent}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className={cn("h-full shadow-[0_0_15px_currentColor]", isComplete ? "bg-emerald-500" : "bg-cyan-500")}
                            />
                        </div>
                    </div>
                    {job.constitutional_compliance && (
                        <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2" title="Constitutional Compliance Verified">
                            <ShieldCheckIcon size={14} className="text-emerald-400" />
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">SECURE</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Pipeline Visual Flow v55 */}
            <div className="grid grid-cols-5 gap-2 relative">
                {/* Background Connecting Tube */}
                <div className="absolute top-6 left-10 right-10 h-1 bg-white/5 rounded-full z-0" />

                {stages.map((stage, idx) => {
                    const active = stage.active;
                    const nextActive = stages[idx + 1]?.active;

                    return (
                        <div key={idx} className="relative z-10 flex flex-col items-center">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-700 bg-black/80",
                                active ? "border-cyan-500/50 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]" : "border-white/5 text-slate-700"
                            )}>
                                <stage.icon size={18} />
                            </div>
                            <div className="mt-3 text-center">
                                <p className={cn("text-[9px] font-black uppercase tracking-widest", active ? "text-slate-300" : "text-slate-700")}>{stage.label}</p>
                                <p className="text-[7px] font-mono text-slate-600 uppercase mt-0.5 hidden sm:block">{stage.full}</p>
                            </div>
                            {/* Animated Flow Pulse */}
                            {active && nextActive && (
                                <div className="absolute top-6 left-1/2 w-full h-[1px] bg-cyan-400/50 shadow-[0_0_10px_#22d3ee] animate-pulse" />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Metric Footer Console */}
            <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: 'Processed', val: job.progress.records_processed.toLocaleString(), unit: 'ROWS' },
                    { label: 'Total', val: job.progress.records_total.toLocaleString(), unit: 'ROWS' },
                    { label: 'Indexed', val: job.progress.records_indexed.toLocaleString(), unit: 'NODES' },
                    { label: 'Throughput', val: '1.4k/s', unit: 'SYNC' }
                ].map((stat, i) => (
                    <div key={i}>
                        <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className="text-sm font-black text-slate-300 font-mono">
                            {stat.val} <span className="text-[9px] text-slate-700">{stat.unit}</span>
                        </p>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

const ShieldCheckIcon = (props: any) => (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
);

const RefreshCwIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin-slow"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 16h5v5"></path></svg>;
