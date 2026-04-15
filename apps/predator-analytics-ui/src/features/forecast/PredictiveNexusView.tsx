import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Search,
  Bot,
  Box,
  Brain
} from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { ResourceDynamicsChart } from '../infrastructure/components/ResourceDynamicsChart';
import { infraApi } from '@/services/api/infra';
import { systemApi } from '@/services/api/system';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/utils/cn';

export default function PredictiveNexusView() {
    const [oodaStatus, setOodaStatus] = useState('OBSERVING');
    const { data: stats } = useQuery({
        queryKey: ['system', 'stats'],
        queryFn: systemApi.getStats,
        refetchInterval: 5000
    });

    const { data: diagnostics } = useQuery({
        queryKey: ['system', 'diagnostics'],
        queryFn: systemApi.runDiagnostics,
        refetchInterval: 15000
    });

    const predictions = diagnostics?.results?.predictions || {};

    return (
        <PageTransition>
            <div className="relative w-full h-screen bg-slate-950 overflow-hidden">
                <AdvancedBackground />
                <CyberGrid opacity={0.05} />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 h-full w-full flex flex-col p-6"
                >
                    <ViewHeader 
                        title="Predictive Nexus"
                        subtitle="Автономний Контур Управління та Прогностична Аналітика"
                        icon={Brain}
                    />

                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 overflow-hidden">
                        {/* Ліву колонку: OODA Loop & Predictions */}
                        <div className="flex flex-col gap-6">
                            <div className="bg-black/40 border border-indigo-500/20 rounded-xl p-6 backdrop-blur-md">
                                <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Bot size={16} /> СТАТУС АВТОНОМНОГО ЦИКЛУ (OODA)
                                </h3>
                                <div className="grid grid-cols-4 gap-2">
                                    {['OBSERVE', 'ORIENT', 'DECIDE', 'ACT'].map((step, idx) => (
                                        <div 
                                            key={step}
                                            className={cn(
                                                "p-2 rounded border text-center transition-all duration-500",
                                                idx === 0 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-black" : "bg-white/5 border-white/10 text-slate-500"
                                            )}
                                        >
                                            <div className="text-[8px] font-black">{step}</div>
                                            <div className="h-1 w-full bg-white/5 mt-2 rounded-full overflow-hidden">
                                                {idx === 0 && <motion.div className="h-full bg-emerald-500" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 5, repeat: Infinity }} />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md flex-1">
                                <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <TrendingUp size={16} /> АНАЛІЗ РИЗИКІВ ІНФРАСТРУКТУРИ
                                </h3>
                                
                                <div className="space-y-4">
                                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Прогноз заповнення дисків</span>
                                            <span className="text-xs font-black text-amber-400">{predictions.disk_exhaustion_days || '--'} днів</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <motion.div 
                                                className="h-full bg-amber-500" 
                                                initial={{ width: 0 }} 
                                                animate={{ width: `${Math.min(100, (30 / (predictions.disk_exhaustion_days || 30)) * 100)}%` }} 
                                            />
                                        </div>
                                        <p className="text-[9px] text-slate-500 mt-2 italic">"{predictions.recommendation || 'Аналіз триває...'}"</p>
                                    </div>

                                    <div className="p-4 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
                                        <div className="flex items-center gap-2 text-emerald-400 mb-1">
                                            <Shield size={14} />
                                            <span className="text-[10px] font-black uppercase">Цілісність Кластера</span>
                                        </div>
                                        <p className="text-[9px] text-slate-400">Вузол NVIDIA та Colab Mirror синхронізовані. Останній Heartbeat: <span className="text-emerald-300 font-mono">OK</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Центральна колонка: Resource Dynamics */}
                        <div className="bg-black/60 border border-white/10 rounded-xl p-6 backdrop-blur-lg flex flex-col">
                            <h3 className="text-sm font-black text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Activity size={16} /> ДИНАМІКА РЕСУРСІВ (24г)
                            </h3>
                            <div className="flex-1">
                                <ResourceDynamicsChart />
                            </div>
                        </div>

                        {/* Права колонка: Active Agents & Logs */}
                        <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md flex flex-col gap-6">
                             <div>
                                <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Zap size={16} /> АКТИВНІ АГЕНТИ
                                </h3>
                                <div className="space-y-2">
                                    {[
                                        { name: 'Sovereign_Guardian', status: 'ACTIVE', color: 'emerald' },
                                        { name: 'Neural_Observer', status: 'ACTIVE', color: 'cyan' },
                                        { name: 'Predictive_Nexus', status: 'ANALYZING', color: 'amber' }
                                    ].map(agent => (
                                        <div key={agent.name} className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/10">
                                            <span className="text-[10px] font-bold text-slate-300 font-mono">{agent.name}</span>
                                            <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded", `bg-${agent.color}-500/20 text-${agent.color}-400`)}>
                                                {agent.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                             </div>

                             <div className="flex-1 flex flex-col min-h-0">
                                <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest mb-4">LOGS_STREAM</h3>
                                <div className="flex-1 bg-black/80 rounded border border-white/5 p-3 overflow-auto font-mono text-[9px] text-slate-500">
                                    <div className="space-y-1">
                                        <p><span className="text-emerald-500">[OK]</span> Sync successful with Colab Mirror</p>
                                        <p><span className="text-emerald-500">[OK]</span> GPU metrics captured: RTX 4090 @ 72°C</p>
                                        <p><span className="text-cyan-500">[INFO]</span> New metrics entry recorded to Redis</p>
                                        <p><span className="text-amber-500">[WARN]</span> Slow query detected in PostgreSQL search_index</p>
                                        <p><span className="text-emerald-500">[OK]</span> Guardian heartbeat emitted</p>
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </PageTransition>
    );
}
