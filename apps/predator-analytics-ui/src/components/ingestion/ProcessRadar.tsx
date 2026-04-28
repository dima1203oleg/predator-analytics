import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Bell, Layers, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useIngestionStore } from '../../store/useIngestionStore';
import { api } from '../../services/api';
import { cn } from '../../utils/cn';

export const ProcessRadar = () => {
    const { activeJobs, minimized, setMinimized, isHubOpen, setHubOpen } = useIngestionStore();
    const [realJobs, setRealJobs] = useState<any[]>([]);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const data = await api.getETLJobs(10);
                if (data && Array.isArray(data)) {
                    setRealJobs(data.filter((j: any) => j && j.status !== 'READY' && j.status !== 'FAILED' && j.status !== 'completed' && j.status !== 'failed' && j.state !== 'READY' && j.state !== 'FAILED'));
                }
            } catch (e) {
                // Ignore error, keep previous state
            }
        };

        fetchJobs();
        const interval = setInterval(fetchJobs, 3000);
        return () => clearInterval(interval);
    }, []);

    const localActiveJobs = Object.values(activeJobs).filter(j => j.status !== 'ready' && j.status !== 'failed');

    // Merge local jobs with real backend jobs, prioritizing unique tasks
    const activeCount = localActiveJobs.length + realJobs.length;


    return (
        <div className="fixed bottom-12 right-12 z-[200]">
            <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                className="relative"
            >
                {/* Outer Radar Rings */}
                <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                <span className="absolute inset-0 rounded-full bg-emerald-500/10 animate-[ping_3s_linear_infinite]" />

                {/* Main Radar Button */}
                <button
                    onClick={() => setHubOpen(!isHubOpen)}
                    onMouseEnter={() => setMinimized(false)}
                    onMouseLeave={() => setMinimized(true)}
                    className={cn(
                        "relative w-16 h-16 bg-slate-900 border-2 rounded-full flex items-center justify-center transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] group overflow-hidden",
                        activeCount > 0 ? "border-emerald-500/50" : "border-slate-800"
                    )}
                >
                    {/* Spinning Scanline */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-emerald-500/10 to-transparent animate-[spin_4s_linear_infinite]" />

                    {/* Dynamic Icon */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeCount}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            className="relative z-10 flex flex-col items-center"
                        >
                            <Activity className="w-6 h-6 text-emerald-500 mb-0.5 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-black text-white font-mono">{activeCount}</span>
                        </motion.div>
                    </AnimatePresence>

                    {/* Notification Dot */}
                    <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900 shadow-[0_0_10px_#10b981]" />
                </button>

                {/* Quick Info Tooltip / Badge */}
                <AnimatePresence>
                    {!minimized && !isHubOpen && activeCount > 0 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20, y: 10 }}
                            animate={{ opacity: 1, x: 0, y: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="absolute bottom-full right-0 mb-4 bg-slate-900/95 backdrop-blur-2xl border border-emerald-500/30 rounded-2xl p-4 w-72 shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-none"
                        >
                            <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                                <div className="flex items-center gap-2">
                                    <Zap size={14} className="text-emerald-400" />
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Інтелект Процесів</span>
                                </div>
                                <div className="text-[9px] font-mono text-slate-500">ЖИВА_ТЕЛЕМЕТ ІЯ</div>
                            </div>

                            <div className="space-y-4">
                                {/* Local Upload Jobs */}
                                {localActiveJobs.slice(0, 2).map(job => (
                                    <div key={job.id} className="space-y-1.5">
                                        <div className="flex justify-between items-center text-[10px]">
                                            <div className="flex items-center gap-2 max-w-[180px]">
                                                <Layers size={10} className="text-slate-500" />
                                                <span className="text-white font-black truncate uppercase">{job.filename}</span>
                                            </div>
                                            <span className="text-emerald-400 font-mono font-bold">{job.percent}%</span>
                                        </div>
                                        <div className="h-1 bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_8px_#10b981]"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${job.percent}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[8px] uppercase tracking-tighter text-slate-500 font-bold italic">
                                            <span>{job.stage}</span>
                                            <span className="animate-pulse text-emerald-500/50">{job.message?.substring(0, 30)}...</span>
                                        </div>
                                    </div>
                                ))}

                                {/* Real Backend Jobs */}
                                {realJobs.slice(0, Math.max(0, 3 - localActiveJobs.length)).map(job => {
                                    if (!job) return null;
                                    const percent = job.progress?.percent || 0;
                                    const stage = job.progress?.stage || job.status || job.state || 'Обробка';

                                    // Build human-readable name (mirrors ActiveJobsPanel logic)
                                    const buildName = (j: any): string => {
                                        const pType = j?.pipeline_type || j?.source_type || '';
                                        const raw = j?.source_file || j?.name || '';
                                        if (pType === 'telegram' || raw.startsWith('telegram_')) return `Telegram: @${raw.replace(/^telegram_/, '')}`;
                                        if (pType === 'website') return `🌐 ${raw}`;
                                        if (pType === 'rss') return `📡 RSS: ${raw}`;
                                        if (pType === 'audio') return `🎙️ ${raw}`;
                                        if (pType === 'video') return `🎥 ${raw}`;
                                        if (pType === 'image') return `🖼️ ${raw}`;
                                        if (pType === 'pdf') return `📄 ${raw}`;
                                        if (raw) return raw;
                                        const id = j?.job_id || '';
                                        if (id.startsWith('tg-')) return 'Telegram-канал';
                                        if (id.startsWith('web-')) return 'Веб-джерело';
                                        return 'Файл — обробка';
                                    };
                                    const name = buildName(job);

                                    return (
                                        <div key={job.id || job.job_id} className="space-y-1.5 opacity-90">
                                            <div className="flex justify-between items-center text-[10px]">
                                                <div className="flex items-center gap-2 max-w-[180px]">
                                                    <Activity size={10} className="text-blue-500" />
                                                    <span className="text-white font-black truncate uppercase">{name}</span>
                                                </div>
                                                <span className="text-blue-400 font-mono font-bold">{percent}%</span>
                                            </div>
                                            <div className="h-1 bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
                                                <motion.div
                                                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_8px_#3b82f6]"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percent}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-[8px] uppercase tracking-tighter text-slate-500 font-bold italic">
                                                <span>{stage}</span>
                                                <span className="animate-pulse text-cyan-500/50">ETL Ядро</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {activeCount > 3 && (
                                <div className="mt-4 pt-2 border-t border-white/5 text-[9px] text-slate-500 text-center font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                    <Bell size={10} />
                                    + {activeCount - 3} активних фонових процесів
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};
