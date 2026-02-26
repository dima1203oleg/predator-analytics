
import React from 'react';
import { motion } from 'framer-motion';

interface Stat {
    label: string;
    value: string;
    icon?: React.ReactNode;
    color?: 'primary' | 'success' | 'warning' | 'danger';
}

interface ViewHeaderProps {
    title: string;
    icon?: React.ReactNode;
    breadcrumbs: string[];
    stats?: Stat[];
}

export const ViewHeader: React.FC<ViewHeaderProps> = ({ title, icon, breadcrumbs, stats }) => {
    return (
        <div className="mb-12 space-y-6">
            <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                {breadcrumbs.map((crumb, i) => (
                    <React.Fragment key={i}>
                        <span className="hover:text-blue-400 cursor-pointer transition-colors">{crumb}</span>
                        {i < breadcrumbs.length - 1 && <span className="opacity-30">/</span>}
                    </React.Fragment>
                ))}
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="p-5 bg-blue-600/10 rounded-2xl border border-blue-500/20 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                        {icon}
                    </div>
                    <div>
                        <h1 className="text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter leading-none">
                            {title}
                        </h1>
                        <div className="mt-2 h-1 w-24 bg-gradient-to-r from-blue-600 to-transparent rounded-full" />
                    </div>
                </div>

                {stats && (
                    <div className="flex flex-wrap gap-4">
                        {stats.map((stat, i) => (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={i}
                                className="px-6 py-4 bg-slate-950/40 backdrop-blur-md border border-white/5 rounded-2xl flex items-center gap-4 hover:border-white/20 transition-all duration-300"
                            >
                                <div className={`p-2 rounded-lg ${stat.color === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                                        stat.color === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                                            stat.color === 'danger' ? 'bg-rose-500/10 text-rose-400' :
                                                'bg-blue-500/10 text-blue-400'
                                    }`}>
                                    {stat.icon}
                                </div>
                                <div>
                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</div>
                                    <div className="text-sm font-black text-white uppercase mt-0.5">{stat.value}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
