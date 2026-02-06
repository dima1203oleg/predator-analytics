
import React from 'react';
import { motion } from 'framer-motion';
import { Shield, HardDrive } from 'lucide-react';

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
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6"
        >
            {buckets.map((bucket, idx) => {
                const isLocked = bucket.status === 'Locked';
                return (
                    <motion.div
                        key={idx}
                        whileHover={{ y: -5 }}
                        className={`group relative  p-6 rounded-3xl border transition-all duration-500 glass-ultra ${isLocked ? 'border-red-500/40' : 'hover:border-amber-500/40 shadow-2xl panel-3d'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isLocked ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white shadow-lg shadow-amber-500/20'
                                    }`}>
                                    {isLocked ? <Shield size={24} /> : <HardDrive size={24} />}
                                </div>
                                <div>
                                    <div className="text-sm font-black text-white uppercase tracking-tighter">{bucket.name}</div>
                                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 uppercase font-bold tracking-widest mt-1">
                                        {bucket.type} <span className="text-slate-800">•</span> S3 Compliant
                                    </div>
                                </div>
                            </div>
                            <span className={`text-[8px] font-black px-2.5 py-1 rounded-full border-2 uppercase tracking-widest ${isLocked ? 'border-red-500/20 text-red-500 bg-red-500/5' : 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5'
                                }`}>
                                {bucket.status === 'Active' ? 'Онлайн' : 'Обмежено'}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-[9px] text-slate-600 uppercase font-black tracking-widest mb-1">Зайнято Об'єму</div>
                                    <div className="text-xl font-black text-white font-mono leading-none">{bucket.size}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[9px] text-slate-600 uppercase font-black tracking-widest mb-1">Файлів</div>
                                    <div className="text-sm font-black text-slate-400 font-mono">{bucket.count}</div>
                                </div>
                            </div>

                            <div className="h-1.5 w-full bg-slate-950 rounded-full  border border-white/5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: isLocked ? '100%' : '65%' }}
                                    className={`h-full ${isLocked ? 'bg-red-500' : 'bg-amber-500 shadow-[0_0_10px_#f59e0b]'}`}
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button className="flex-1 py-2 bg-slate-950 border border-white/5 rounded-xl text-[9px] font-black text-slate-500 hover:text-white hover:border-white/10 uppercase tracking-widest transition-all">Огляд</button>
                            <button className="flex-1 py-2 bg-slate-950 border border-white/5 rounded-xl text-[9px] font-black text-slate-500 hover:text-white hover:border-white/10 uppercase tracking-widest transition-all">Політики</button>
                        </div>
                    </motion.div>
                );
            })}
        </motion.div>
    );
};
