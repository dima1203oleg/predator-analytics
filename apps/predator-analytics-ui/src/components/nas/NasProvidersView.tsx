
import React from 'react';
import { motion } from 'framer-motion';
import { Cloud, Zap } from 'lucide-react';
import { TacticalCard } from '../ui/TacticalCard';

interface NasProvidersViewProps {
    providers: any[];
}

export const NasProvidersView: React.FC<NasProvidersViewProps> = ({ providers }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 gap-6"
        >
            <TacticalCard variant="holographic" title="� оутер AI Провайдерів (Квоти � есурсів)" className="panel-3d glass-morphism" icon={<Cloud size={16} />}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {providers.map(p => {
                        const usagePercent = p.currentLoad ?? 0;
                        const isEnabled = p.enabled !== false;

                        return (
                            <motion.div
                                key={p.id}
                                whileHover={{ y: -5 }}
                                className={`p-5 rounded-xl border relative  group transition-all duration-300 ${!isEnabled ? 'grayscale opacity-50 bg-slate-900/20 border-slate-800' :
                                        usagePercent > 85 ? 'bg-yellow-900/10 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]' :
                                            'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-5 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl group-hover:border-slate-600 transition-colors">
                                            {p.id === 'google' || p.id === 'gemini' ? <span className="font-bold text-lg text-blue-500">G</span> :
                                                p.id === 'openai' ? <span className="font-bold text-lg text-emerald-500">O</span> :
                                                    p.id === 'groq' ? <span className="font-bold text-lg text-orange-500">Q</span> :
                                                        p.id === 'anthropic' ? <span className="font-bold text-lg text-amber-600">A</span> :
                                                            <span className="font-bold text-lg text-slate-400">{p.name?.[0] || '?'}</span>}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-100 group-hover:text-white transition-colors">{p.name || 'Unknown'}</h4>
                                            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{p.model || 'Default Model'}</div>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md border uppercase tracking-tighter ${isEnabled ? 'bg-emerald-900/20 text-emerald-500 border-emerald-900/50' :
                                            'bg-slate-800 text-slate-500 border-slate-700'
                                        }`}>{isEnabled ? (p.free ? 'FREE' : 'SECURE') : 'DISABLED'}</span>
                                </div>

                                <div className="space-y-5 relative z-10">
                                    <div>
                                        <div className="flex justify-between text-[11px] text-slate-400 mb-2 font-mono">
                                            <span>Поточне навантаження</span>
                                            <span className="text-white">{usagePercent}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-950 rounded-full  border border-white/5">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${usagePercent}%` }}
                                                transition={{ duration: 1, ease: 'easeOut' }}
                                                className={`h-full relative ${usagePercent > 85 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                                                        usagePercent > 60 ? 'bg-amber-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' :
                                                            'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                                                    }`}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                                            </motion.div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-4 border-t border-slate-800/50 font-mono text-[10px]">
                                        <div className="flex flex-col">
                                            <span className="text-slate-600 uppercase mb-0.5">Доступні ключі</span>
                                            <span className="text-slate-300 font-bold">{p.api_keys?.length || (p.enabled ? 1 : 0)}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-slate-600 uppercase mb-0.5">Статус Ендпоінту</span>
                                            <span className={`font-bold ${isEnabled ? 'text-emerald-500' : 'text-red-500'}`}>{isEnabled ? 'ONLINE' : 'OFFLINE'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none">
                                    <Zap size={80} className="text-white" />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </TacticalCard>
        </motion.div>
    );
};
