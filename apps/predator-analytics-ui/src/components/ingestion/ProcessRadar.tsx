import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Bell, Layers, Zap } from 'lucide-react';
import { useIngestionStore } from '../../store/useIngestionStore';
import { cn } from '../../utils/cn';

export const ProcessRadar = () => {
    const { activeJobs, minimized, setMinimized, isHubOpen, setHubOpen } = useIngestionStore();
    const activeCount = Object.values(activeJobs).filter(j => j.status !== 'ready' && j.status !== 'failed').length;

    if (activeCount === 0) return null;

    return (
        <div className="fixed bottom-6 right-56 z-[200]">
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
                                <div className="text-[9px] font-mono text-slate-500">ЖИВА_ТЕЛЕМЕТРІЯ</div>
                            </div>

                            <div className="space-y-4">
                                {Object.values(activeJobs).filter(j => j.status !== 'ready' && j.status !== 'failed').slice(0, 3).map(job => (
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
