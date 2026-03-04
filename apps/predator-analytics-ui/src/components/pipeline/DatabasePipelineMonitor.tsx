"use client"

import { Server, Activity, Database, CheckCircle, ArrowRight } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useIngestionStore } from '../../store/useIngestionStore';
import { cn } from '../../utils/cn';
import { PipelineMonitor } from './PipelineMonitor';

interface DatabasePipelineMonitorProps {
    className?: string;
    compact?: boolean;
}

export const DatabasePipelineMonitor: React.FC<DatabasePipelineMonitorProps> = ({ className, compact = false }) => {
    const { activeJobs } = useIngestionStore();

    // Get the most recent active job or null
    const jobIds = Object.keys(activeJobs);
    const activeJob = jobIds.length > 0
        ? Object.values(activeJobs).sort((a, b) => b.startedAt - a.startedAt)[0]
        : null;

    if (!activeJob) {
        return <IdleState compact={compact} className={className} />;
    }

    return (
        <div className={cn("rounded-[32px] overflow-hidden border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.1)] relative group/monitor bg-slate-950/80 backdrop-blur-3xl", className)}>
            {/* Ambient Background Elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(16,185,129,0.1),transparent_50%)] pointer-events-none" />
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50 pointer-events-none" />

            <PipelineMonitor
                jobId={activeJob.id}
                pipelineType={activeJob.type}
                externalStatus={activeJob}
            />
        </div>
    );
};

const IdleState = ({ compact, className }: { compact: boolean, className?: string }) => {
    const [dots, setDots] = useState('');

    useEffect(() => {
        const i = setInterval(() => setDots(p => p.length >= 3 ? '' : p + '.'), 500);
        return () => clearInterval(i);
    }, []);

    return (
        <div className={cn(
            "relative group overflow-hidden rounded-[32px] border border-white/5 bg-slate-900/40 backdrop-blur-xl transition-all duration-500 hover:border-emerald-500/20 shadow-2xl min-h-[400px] flex items-center justify-center",
            className
        )}>
            {/* Cinematic Backgrounds */}
            <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none transition-all duration-1000 group-hover:bg-emerald-500/10" />

            <div className="flex flex-col items-center justify-center p-8 gap-8 text-center relative z-10 w-full max-w-lg">
                {/* Core Reactor Idle Animation */}
                <div className="relative w-32 h-32 flex items-center justify-center">
                    <div className="absolute inset-0 border border-slate-700/50 rounded-full animate-[spin_10s_linear_infinite]" />
                    <div className="absolute inset-4 border border-dashed border-slate-600/50 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                    <div className="absolute inset-8 bg-slate-800/80 rounded-full border border-white/5 shadow-inner flex items-center justify-center">
                        <Database className="w-8 h-8 text-slate-500 group-hover:text-emerald-500/50 transition-colors duration-500" />
                    </div>
                </div>

                <div className="space-y-4 font-mono w-full">
                    {/* Status Console */}
                    <div className="bg-black/50 border border-white/5 rounded-2xl p-4 text-left font-mono relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-700 rounded-l-2xl group-hover:bg-emerald-500/50 transition-colors" />
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                            <span>System Status</span>
                            <span className="text-emerald-500/50 flex items-center gap-1.5"><Activity size={10} /> Online</span>
                        </div>

                        <div className="space-y-2 text-xs text-slate-400">
                            <div className="flex items-center gap-2">
                                <ArrowRight size={12} className="text-slate-600" />
                                <span>Awaiting data stream injection{dots}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ArrowRight size={12} className="text-slate-600" />
                                <span className="text-slate-600">All neural pathways clear</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ArrowRight size={12} className="text-slate-600" />
                                <span className="text-slate-600">ETL workers standing by</span>
                            </div>
                        </div>
                    </div>

                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase text-amber-500/80 tracking-widest">Idle Mode</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DatabasePipelineMonitor;
