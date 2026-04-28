
import React from 'react';
import { motion } from 'framer-motion';
import { Shield, HardDrive, Lock, Globe, Server, Info, ExternalLink, Settings } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ObjectStorageBucket {
    name: string;
    type: string;
    status: string;
    size: string;
    count: number;
}

interface ObjectStorageViewProps {
    buckets: ObjectStorageBucket[];
}

export const ObjectStorageView: React.FC<ObjectStorageViewProps> = ({ buckets }) => {
    if (buckets.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-[40px] border border-white/5 bg-slate-900/30 px-8 py-16 text-center"
            >
                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Об&apos;єктне сховище <span className="text-amber-500">MinIO</span></h2>
                <p className="mt-3 text-sm font-black uppercase tracking-[0.3em] text-slate-300">НЕМАЄ ПІДТВЕ� ДЖЕНИХ BUCKET-ІВ</p>
                <p className="mt-4 max-w-2xl mx-auto text-sm leading-6 text-slate-500">
                    Маршрут `/buckets` не повернув підтверджених записів. Екран не підставляє локальні bucket-и.
                </p>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Об&apos;єктне сховище <span className="text-amber-500">MinIO</span></h2>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">Високомасштабоване сховище об'єктів S3-стандарту</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {buckets.map((bucket, idx) => {
                    const statusValue = bucket.status.toLowerCase();
                    const typeValue = bucket.type.toLowerCase();
                    const isLocked = statusValue.includes('locked') || statusValue.includes('restricted');
                    const isPublic = typeValue.includes('public');
                    const statusLabel = isLocked
                        ? 'ЗАБЛОКОВАНИЙ'
                        : statusValue.includes('active') || statusValue.includes('operational')
                            ? 'АКТИВНИЙ'
                            : bucket.status || 'Н/д';

                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className={cn(
                                "group relative p-8 rounded-[40px] border transition-all duration-700 bg-slate-900/40 backdrop-blur-3xl overflow-hidden",
                                isLocked ? "border-rose-500/20 shadow-[0_20px_50px_rgba(244,63,94,0.15)]" : "border-white/5 hover:border-amber-500/30 shadow-2xl"
                            )}
                        >
                            {/* Decorative Grid */}
                            <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />

                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div className="flex items-center gap-5">
                                    <div className={cn(
                                        "w-16 h-16 rounded-[24px] flex items-center justify-center transition-all duration-500 border-2",
                                        isLocked
                                            ? "bg-rose-500/10 border-rose-500/30 text-rose-500"
                                            : "bg-amber-500/10 border-amber-500/30 text-amber-500 group-hover:bg-amber-500 group-hover:text-black group-hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]"
                                    )}>
                                        {isLocked ? <Lock size={28} /> : <HardDrive size={28} />}
                                    </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none mb-2">{bucket.name}</h3>
                                            <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "flex items-center gap-1.5 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                                                isPublic ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-blue-500/10 border-blue-500/30 text-blue-400"
                                                )}>
                                                    {isPublic ? <Globe size={8} /> : <Shield size={8} />} {bucket.type}
                                                </div>
                                            <span className="text-[10px] text-slate-600 font-mono">ПІДТВЕ� ДЖЕНИЙ BUCKET</span>
                                            </div>
                                        </div>
                                    </div>
                                <div className={cn(
                                    "px-3 py-1.5 rounded-xl border font-black text-[9px] uppercase tracking-[0.2em]",
                                    isLocked ? "bg-rose-500/10 border-rose-500/30 text-rose-500" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                )}>
                                    {statusLabel}
                                </div>
                            </div>

                            <div className="space-y-6 relative z-10">
                                <div className="grid grid-cols-2 gap-6 p-6 bg-black/30 rounded-[32px] border border-white/5">
                                    <div>
                                        <div className="text-[9px] text-slate-600 uppercase font-black tracking-widest mb-1 flex items-center gap-2">
                                            <Server size={10} /> Виділений обсяг
                                        </div>
                                        <div className="text-2xl font-black text-white font-mono leading-none tracking-tighter">{bucket.size}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[9px] text-slate-600 uppercase font-black tracking-widest mb-1 flex items-center gap-2 justify-end">
                                            Кількість об&apos;єктів <Info size={10} />
                                        </div>
                                        <div className="text-2xl font-black text-slate-400 font-mono leading-none tracking-tighter">{bucket.count.toLocaleString()}</div>
                                    </div>
                                </div>

                                <div className="rounded-[24px] border border-white/5 bg-black/20 px-5 py-4 text-sm leading-6 text-slate-500">
                                    Детальний health-metric bucket-а цим маршрутом не повертається. Показано лише підтверджені поля `type`, `status`, `size` і `count`.
                                </div>
                            </div>

                            <div className="mt-8 rounded-[24px] border border-white/5 bg-slate-950/50 px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                Керування об&apos;єктами через цей UI-контур не підключено.
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
};
