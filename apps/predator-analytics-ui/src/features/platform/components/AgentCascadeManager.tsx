
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Shield, Search, Code } from 'lucide-react';
import { TacticalCard } from '@/components/TacticalCard';
import { premiumLocales } from '@/locales/uk/premium';
import { useAgents } from '@/context/AgentContext';

const AgentCascadeManager: React.FC = () => {
    const { cascades, agents } = useAgents();

    const getRoleIcon = (role: string) => {
        const r = role.toUpperCase();
        if (r.includes('SCAN')) return <Search size={18} />;
        if (r.includes('EXEC')) return <Code size={18} />;
        if (r.includes('TEST')) return <Shield size={18} />;
        return <Zap size={18} />;
    };

    // Use actual cascade from context or a default if none
    const activeCascade = cascades[0] || {
        id: 'no-active',
        name: 'ОЧІКУВАННЯ ПЛАНУВАННЯ',
        status: 'PAUSED',
        steps: ['DISCOVERY', 'MAPPING', 'GENERATION'],
        current_step: ''
    };

    // Map agents into nodes for visualization
    const nodes = agents.map(a => ({
        id: a.id,
        name: a.name,
        role: a.type.toUpperCase(),
        status: a.status
    })).slice(0, 3); // Limit to top 3 for diagram

    return (
        <div className="space-y-8 p-4">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tighter">
                        {premiumLocales.agentsView.cascadeTitle}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono italic">ACTIVE SAGA PATTERN: {activeCascade.name}</p>
                </div>
                <div className="flex gap-2">
                    <span className={`px-2 py-1 ${activeCascade.status === 'ACTIVE' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-slate-500/10 text-slate-500 border-white/5'} text-[10px] font-black rounded border italic`}>
                        SAGA {activeCascade.status}
                    </span>
                </div>
            </div>

            <div className="relative flex items-center justify-between gap-4 py-12 px-8 bg-slate-950/40 rounded-[40px] border border-white/5 overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                </div>

                {nodes.length > 0 ? nodes.map((node, idx) => (
                    <React.Fragment key={node.id}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.2 }}
                            className={`
                                z-10 w-48 p-6 rounded-3xl border glass-morphism panel-3d text-center
                                ${node.status === 'WORKING' ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'border-white/10 bg-slate-900/60'}
                            `}
                        >
                            <div className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${node.status === 'WORKING' ? 'bg-blue-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                                {getRoleIcon(node.role)}
                            </div>
                            <div className="text-[10px] font-black text-white mb-1 truncate px-2">{node.name}</div>
                            <div className="text-[8px] text-slate-500 font-mono uppercase tracking-widest">{node.role}</div>
                            
                            {node.status === 'WORKING' && (
                                <div className="mt-4 flex items-center justify-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                                    <span className="text-[9px] text-blue-400 font-bold uppercase tracking-tight">В ПРОЦЕСІ...</span>
                                </div>
                            )}
                        </motion.div>

                        {idx < nodes.length - 1 && (
                            <div className="flex-1 flex items-center justify-center">
                                <motion.div 
                                    animate={{ 
                                        x: [0, 10, 0],
                                        opacity: node.status === 'WORKING' ? [0.4, 1, 0.4] : 0.3
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <ArrowRight className={node.status === 'WORKING' ? "text-blue-500" : "text-slate-700"} size={32} />
                                </motion.div>
                            </div>
                        )}
                    </React.Fragment>
                )) : (
                    <div className="w-full text-center text-slate-600 font-mono text-xs uppercase py-10">Очікування ініціалізації агентів...</div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TacticalCard title="КОНТРОЛЬ ПАРАЛЕЛІЗМУ" className="bg-slate-900/40">
                    <div className="space-y-4 pt-2">
                        <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-400 uppercase font-black tracking-tighter">Макс. воркери</span>
                            <span className="text-white font-mono">16</span>
                        </div>
                        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                            <div className="w-3/4 h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-400 uppercase font-black tracking-tighter">Активні потоки</span>
                            <span className="text-emerald-400 font-mono">
                                {agents.filter(a => a.status === 'WORKING').length} / 16
                            </span>
                        </div>
                    </div>
                </TacticalCard>

                <TacticalCard title="СИНХРОНІЗАЦІЯ SAGA" className="bg-slate-900/40">
                    <div className="space-y-3 pt-2">
                        {activeCascade.steps.map((step: string, i: number) => {
                            const isCurrent = step === activeCascade.current_step;
                            const isPast = activeCascade.steps.indexOf(activeCascade.current_step) > i;
                            
                            return (
                                <div key={i} className={`flex items-center justify-between p-2 rounded-lg border transition-all ${isCurrent ? 'bg-blue-500/10 border-blue-500/30' : 'bg-slate-950/30 border-white/5'}`}>
                                    <span className={`text-[10px] font-bold uppercase ${isCurrent ? 'text-blue-200' : isPast ? 'text-slate-500' : 'text-slate-400'}`}>
                                        {step.replace('_', ' ')}
                                    </span>
                                    <span className={`text-[9px] font-black ${isPast ? 'text-emerald-500' : isCurrent ? 'text-blue-400 animate-pulse' : 'text-slate-600'}`}>
                                        {isPast ? 'DONE' : isCurrent ? 'ACTIVE' : 'WAIT'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </TacticalCard>
            </div>
        </div>
    );
};

export default AgentCascadeManager;
