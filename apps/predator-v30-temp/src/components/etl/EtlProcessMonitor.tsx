
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { Activity, Database, FileText, Layers, Server, Cpu, CheckCircle, AlertOctagon, Loader } from 'lucide-react';

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
                api.getETLJobs(5),
                api.getETLStatus()
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
        const interval = setInterval(fetchStatus, 3000); // 3s polling
        return () => clearInterval(interval);
    }, []);

    const getStageColor = (state: string) => {
        switch (state) {
            case 'completed': return 'text-emerald-400';
            case 'failed': return 'text-red-500';
            case 'processing': return 'text-blue-400 animate-pulse';
            case 'indexing': return 'text-purple-400 animate-pulse';
            case 'vectorizing': return 'text-pink-400 animate-pulse';
            default: return 'text-gray-400';
        }
    };

    const getProgressColor = (percent: number) => {
        if (percent >= 100) return 'bg-emerald-500';
        if (percent > 60) return 'bg-blue-500';
        return 'bg-amber-500';
    };

    return (
        <div className="w-full bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl  shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-blue-900/20 to-purple-900/20">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Activity className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-wide font-mono">
                            ETL PIPELINE MONITOR
                        </h2>
                        <div className="flex items-center space-x-2 text-xs text-blue-300/60 uppercase tracking-wider">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span>System Active</span>
                            <span>•</span>
                            <span>v28-S Core</span>
                        </div>
                    </div>
                </div>

                {/* Global Stats */}
                <div className="flex space-x-6">
                    <div className="text-right">
                        <div className="text-xs text-gray-400 uppercase">Active Jobs</div>
                        <div className="text-2xl font-mono font-bold text-white">
                            {globalStatus?.active_jobs_count || 0}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-400 uppercase">Throughput</div>
                        <div className="text-2xl font-mono font-bold text-emerald-400">
                            ~2.1k <span className="text-sm text-gray-500">doc/s</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
                {jobs.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 font-mono">
                        NO ACTIVE PIPELINES DETECTED
                    </div>
                ) : (
                    jobs.map((job) => (
                        <EtlJobRow key={job.job_id} job={job} />
                    ))
                )}
            </div>
        </div>
    );
};

const EtlJobRow: React.FC<{ job: EtlJob }> = ({ job }) => {
    // Determine active stages
    const stages = [
        { id: 'extract', label: 'Extraction', icon: FileText, active: ['created', 'uploading', 'processing', 'indexing', 'vectorizing', 'completed'].includes(job.state) },
        { id: 'transform', label: 'Transform', icon: Layers, active: ['processing', 'indexing', 'vectorizing', 'completed'].includes(job.state) },
        { id: 'load', label: 'Postgres', icon: Database, active: ['processing', 'indexing', 'vectorizing', 'completed'].includes(job.state) },
        { id: 'index', label: 'OpenSearch', icon: Server, active: ['indexing', 'vectorizing', 'completed'].includes(job.state) },
        { id: 'vector', label: 'Qdrant', icon: Cpu, active: ['vectorizing', 'completed'].includes(job.state) },
    ];

    const isComplete = job.state === 'completed';
    const isFailed = job.state === 'failed';

    return (
        <div className="bg-white/5 border border-white/5 rounded-xl p-5 hover:bg-white/10 transition-colors">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center space-x-3 mb-1">
                        <span className={`text-sm font-bold px-2 py-0.5 rounded ${isComplete ? 'bg-emerald-500/20 text-emerald-400' : isFailed ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {job.state.toUpperCase()}
                        </span>
                        <h3 className="text-lg font-medium text-white font-mono">{job.source_file.split('/').pop()}</h3>
                    </div>
                    <p className="text-xs text-gray-400 font-mono">ID: {job.job_id}</p>
                </div>
                <div className="text-right">
                     <span className="text-3xl font-bold text-white font-mono">{job.progress.percent}%</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-gray-800 rounded-full mb-6 ">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${job.progress.percent}%` }}
                    className={`h-full ${isFailed ? 'bg-red-500' : isComplete ? 'bg-emerald-500' : 'bg-blue-500'} shadow-[0_0_10px_rgba(59,130,246,0.5)]`}
                />
            </div>

            {/* Pipeline Stages */}
            <div className="grid grid-cols-5 gap-4 relative">
                 {/* Connecting Line */}
                 <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -z-10 transform -translate-y-1/2" />

                {stages.map((stage, idx) => {
                    const isActive = stage.active;
                    const isCurrent = !isComplete && !isFailed && idx === stages.length - 2; // Mock logic for current stage visualization

                    return (
                        <div key={stage.id} className="flex flex-col items-center">
                            <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 transition-all duration-500
                                ${isActive ? (isComplete ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' : 'border-blue-500 bg-blue-500/20 text-blue-400') : 'border-gray-700 bg-gray-800 text-gray-600'}
                                ${isCurrent ? 'animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.5)]' : ''}
                            `}>
                                <stage.icon size={16} />
                            </div>
                            <span className={`text-xs font-mono font-medium ${isActive ? 'text-gray-300' : 'text-gray-600'}`}>
                                {stage.label}
                            </span>
                        </div>
                    )
                })}
            </div>

            {/* Metrics */}
            <div className="mt-6 flex justify-between text-xs font-mono text-gray-400 border-t border-white/5 pt-4">
                <div>
                   Records: <span className="text-white">{job.progress.records_processed.toLocaleString()}</span> / {job.progress.records_total.toLocaleString()}
                </div>
                 <div>
                   Indexed: <span className="text-emerald-400">{job.progress.records_indexed.toLocaleString()}</span>
                </div>
                 <div className="flex items-center space-x-1">
                   Const. Compliance:
                   {job.constitutional_compliance ? (
                       <CheckCircle size={12} className="text-emerald-500" />
                   ) : (
                       <AlertOctagon size={12} className="text-amber-500" />
                   )}
                </div>
            </div>
        </div>
    );
};
