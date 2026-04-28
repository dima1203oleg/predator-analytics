
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Zap, Shield, Search, Code, Activity, Server, Radio, Waypoints, Cpu } from 'lucide-react';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { premiumLocales } from '@/locales/uk/premium';
import { useAgents } from '@/context/AgentContext';
import { cn } from '@/utils/cn';

const AgentCascadeManager: React.FC = () => {
    const { cascades, agents } = useAgents();

    const getRoleIcon = (role: string) => {
        const r = role.toUpperCase();
        if (r.includes('SCAN')) return <Search size={20} />;
        if (r.includes('EXEC')) return <Code size={20} />;
        if (r.includes('TEST') || r.includes('GUARD')) return <Shield size={20} />;
        if (r.includes('MONITOR')) return <Activity size={20} />;
        return <Cpu size={20} />;
    };

    // Use actual cascade from context or a default if none
    const activeCascade = cascades?.[0] || {
        id: 'no-active',
        name: 'ОЧІКУВАННЯ ПЛАНУВАННЯ',
        status: 'PAUSED',
        steps: ['DISCOVERY', 'MAPPING', 'ANALYSIS', 'GENERATION'],
        current_step: ''
    };

    // Map agents into nodes for visualization
    const nodes = (agents || []).map(a => ({
        id: a.id,
        name: a.name,
        role: a.type ? a.type.toUpperCase() : 'UNKNOWN',
        status: a.status,
        efficiency: a.efficiency || 0,
    })).slice(0, 4);

    return (
        <div className="space-y-8 p-4">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <Waypoints className="text-blue-500" />
                        {premiumLocales.agentsView.cascadeTitle}
                    </h3>
                    <p className="text-[10px] text-blue-400/70 font-mono italic mt-1 uppercase tracking-widest">
                        Нейронний Потік: {activeCascade.name}
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className={cn(
                        "px-4 py-1.5 flex items-center gap-2 text-[10px] font-black rounded-lg border uppercase tracking-[0.2em] shadow-lg",
                        activeCascade.status === 'ACTIVE' ? "bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-blue-500/20" : 
                        "bg-slate-800 border-slate-700 text-slate-400"
                    )}>
                        <Radio size={12} className={activeCascade.status === 'ACTIVE' ? "animate-pulse" : ""} />
                        SAGA {activeCascade.status}
                    </div>
                </div>
            </div>

            <div className="relative py-16 px-10 bg-[#0b0f1a]/80 backdrop-blur-xl rounded-[40px] border border-white/10 overflow-hidden shadow-2xl">
                {/* Background Grid & Decor */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.1),transparent_70%)] pointer-events-none" />
                <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent -translate-y-1/2" />
                
                <div className="relative flex items-center justify-center gap-6">
                    <AnimatePresence mode="popLayout">
                        {nodes.length > 0 ? nodes.map((node, idx) => (
                            <React.Fragment key={node.id}>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8, y: 30 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ delay: idx * 0.15, type: "spring", stiffness: 200, damping: 20 }}
                                    className={cn(
                                        "relative z-10 w-56 p-8 rounded-[32px] border transition-all panel-3d text-center overflow-hidden",
                                        node.status === 'WORKING' 
                                            ? "border-blue-500 bg-blue-950/40 shadow-[0_0_40px_rgba(59,130,246,0.25)]" 
                                            : "border-white/10 bg-slate-900/60 opacity-80"
                                    )}
                                >
                                    {node.status === 'WORKING' && (
                                        <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
                                    )}
                                    <div className={cn(
                                        "mx-auto w-16 h-16 rounded-[20px] flex items-center justify-center mb-5 relative",
                                        node.status === 'WORKING' ? "bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]" : "bg-slate-800 text-slate-400"
                                    )}>
                                        {node.status === 'WORKING' && (
                                            <div className="absolute inset-0 rounded-[20px] border-2 border-blue-400 animate-ping opacity-20" />
                                        )}
                                        {getRoleIcon(node.role)}
                                    </div>
                                    <div className="text-xs font-black text-white mb-1.5 truncate uppercase tracking-widest">{node.name}</div>
                                    <div className="text-[9px] text-slate-500 font-mono uppercase tracking-[0.2em] mb-4">{node.role}</div>
                                    
                                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5 relative z-10">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${node.efficiency}%` }}
                                            transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                                            className={cn(
                                                "h-full",
                                                node.status === 'WORKING' ? "bg-gradient-to-r from-blue-600 to-cyan-400" : "bg-slate-600"
                                            )}
                                        />
                                    </div>
                                    
                                    {node.status === 'WORKING' && (
                                        <div className="mt-5 flex items-center justify-center gap-2">
                                            <div className="flex gap-1">
                                                {[1,2,3].map(i => (
                                                    <motion.div 
                                                        key={i} 
                                                        animate={{ height: [3, 10, 3] }} 
                                                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                                        className="w-1 bg-blue-400 rounded-full"
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">ОПЕ АЦІЯ</span>
                                        </div>
                                    )}
                                </motion.div>

                                {idx < nodes.length - 1 && (
                                    <div className="flex-1 max-w-[80px] flex items-center justify-center">
                                        <motion.div 
                                            animate={{ x: [0, 8, 0], opacity: node.status === 'WORKING' ? [0.5, 1, 0.5] : 0.2 }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="relative"
                                        >
                                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-blue-500/30 -translate-y-1/2" />
                                            <ArrowRight className={node.status === 'WORKING' ? "text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" : "text-slate-700"} size={40} />
                                        </motion.div>
                                    </div>
                                )}
                            </React.Fragment>
                        )) : (
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="w-full flex justify-center py-20"
                            >
                                <div className="text-center space-y-4">
                                    <Server size={48} className="mx-auto text-slate-700 opacity-50" />
                                    <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.4em]">Система очікує ініціалізації агентів...</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <TacticalCard title="КОНТРОЛЬ ПА АЛЕЛІЗМУ" className="bg-[#0b0f1a]/80 backdrop-blur-md border-white/5" variant="holographic">
                    <div className="space-y-6 pt-4">
                        <div className="flex justify-between items-end">
                            <div>
                                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Мережеве навантаження</h4>
                                <div className="text-3xl font-black text-white font-mono shrink-0">
                                    {(agents || []).filter(a => a.status === 'WORKING').length} <span className="text-slate-600 text-lg">/ 16</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                                <Activity className="text-blue-400" size={24} />
                            </div>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, ((agents || []).filter(a => a.status === 'WORKING').length / 16) * 100)}%` }}
                                className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                            />
                        </div>
                    </div>
                </TacticalCard>

                <TacticalCard title="СИНХ ОНІЗАЦІЯ SAGA" className="bg-[#0b0f1a]/80 backdrop-blur-md border-white/5" variant="holographic">
                    <div className="space-y-4 pt-4">
                        {(activeCascade.steps || []).map((step: string, i: number) => {
                            const isCurrent = step === activeCascade.current_step;
                            const isPast = (activeCascade.steps || []).indexOf(activeCascade.current_step) > i;
                            
                            return (
                                <motion.div 
                                    key={i} 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className={cn(
                                        "flex items-center justify-between p-3.5 rounded-xl border transition-all",
                                        isCurrent ? "bg-blue-500/10 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]" : 
                                        isPast ? "bg-emerald-500/5 border-emerald-500/20" : 
                                        "bg-slate-900/50 border-white/5"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black",
                                            isCurrent ? "bg-blue-500 text-white" : 
                                            isPast ? "bg-emerald-500/20 text-emerald-500" : 
                                            "bg-slate-800 text-slate-500"
                                        )}>
                                            {i + 1}
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-black uppercase tracking-widest",
                                            isCurrent ? "text-blue-100" : isPast ? "text-emerald-400" : "text-slate-500"
                                        )}>
                                            {step.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <span className={cn(
                                        "text-[9px] font-black tracking-widest px-3 py-1 rounded-md",
                                        isPast ? "bg-emerald-500/10 text-emerald-400" : 
                                        isCurrent ? "bg-blue-500/20 text-blue-400 animate-pulse border border-blue-500/30" : 
                                        "text-slate-600"
                                    )}>
                                        {isPast ? 'COMPLETED' : isCurrent ? 'EXECUTION' : 'PENDING'}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                </TacticalCard>
            </div>
        </div>
    );
};

export default AgentCascadeManager;

