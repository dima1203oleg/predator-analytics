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
  Brain,
  Cpu,
  RefreshCw,
  Target,
  Clock,
  ChevronRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { TacticalCard } from '@/components/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResourceDynamicsChart } from '../infrastructure/components/ResourceDynamicsChart';
import { ClusterTopology } from '../infrastructure/components/ClusterTopology';
import { systemApi } from '@/services/api/system';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';

// Сценарії тепер завантажуються через API

const PredictionCard = ({ scenario }: { scenario: Scenario }) => (
  <TacticalCard variant="premium" className="group">
    <div className="flex justify-between items-start mb-4">
      <div className="h-10 w-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center">
        <Brain className="w-5 h-5 text-rose-400" />
      </div>
      <Badge className={cn(scenario.impact === 'High' ? "bg-rose-500/20 text-rose-400" : "bg-amber-500/20 text-amber-400")}>
        IMPACT: {scenario.impact}
      </Badge>
    </div>
    <h4 className="text-md font-bold text-white mb-2">{scenario.name}</h4>
    <p className="text-xs text-slate-400 line-clamp-2 mb-4">{scenario.description}</p>
    <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-500">
        <span>Ймовірність: {scenario.probability}%</span>
        <span>ETA: {scenario.eta}</span>
    </div>
  </TacticalCard>
);

interface Scenario {
  id: string;
  name: string;
  probability: number;
  impact: 'High' | 'Medium' | 'Low';
  description: string;
  eta: string;
}

export default function PredictiveNexusView() {
    const [isScanning, setIsScanning] = useState(false);
    
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

    const { data: scenarios = [] } = useQuery({
        queryKey: ['system', 'nexus', 'scenarios'],
        queryFn: systemApi.getNexusScenarios,
        refetchInterval: 30000
    });

    const { data: neuralLogs = [] } = useQuery({
        queryKey: ['system', 'logs', 'neural'],
        queryFn: () => systemApi.getNeuralLogs(20),
        refetchInterval: 5000
    });

    const predictions = diagnostics?.results?.predictions || {};

    const startScan = () => {
        setIsScanning(true);
        setTimeout(() => setIsScanning(false), 2000);
    };

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
                        title="Predictive Nexus v56.5"
                        subtitle="Квантовий Контур Прогнозування та Автономного Управління"
                        icon={Brain}
                        badges={[
                            { label: 'ORACLE_CORE_v1.4', color: 'rose', icon: <Cpu size={10} /> },
                            { label: stats?.last_sync ? `SYNC: ${formatDistanceToNow(new Date(stats.last_sync), { locale: uk, addSuffix: true })}` : 'СИНХРОНІЗАЦІЯ...', color: 'success', icon: <RefreshCw size={10} /> },
                        ]}
                        actions={
                            <Button onClick={startScan} disabled={isScanning} className="bg-rose-600 hover:bg-rose-500 text-white gap-2">
                                <Zap size={16} className={isScanning ? "animate-pulse" : ""} />
                                {isScanning ? "ЙДЕ АНАЛІЗ..." : "СВІЖИЙ ПРОГНОЗ"}
                            </Button>
                        }
                    />

                    {/* Tactical Ticker */}
                    <div className="w-full h-8 bg-black/40 border-y border-white/5 mt-4 flex items-center overflow-hidden">
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: '-100%' }}
                            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                            className="whitespace-nowrap flex items-center gap-12 text-[9px] font-black uppercase tracking-[0.2em]"
                        >
                            <span className="text-emerald-400 flex items-center gap-2"><div className="w-1 h-1 bg-emerald-500 rounded-full" /> СИСТЕМА: NVIDIA_MASTER ONLINE</span>
                            <span className="text-indigo-400 flex items-center gap-2"><div className="w-1 h-1 bg-indigo-500 rounded-full" /> СИНХРОНІЗАЦІЯ: 100% (COLAB MIRROR)</span>
                            <span className="text-amber-400 flex items-center gap-2"><div className="w-1 h-1 bg-amber-500 rounded-full" /> УВАГА: РІСТ ЦІН НА ПАЛЬНЕ +5.4%</span>
                            <span className="text-rose-400 flex items-center gap-2"><div className="w-1 h-1 bg-rose-500 rounded-full" /> ЗАГРОЗА: НЕВИЯВЛЕНО</span>
                        </motion.div>
                    </div>

                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6 overflow-hidden">
                        {/* Ліву колонку: OODA Loop */}
                        <div className="lg:col-span-1 flex flex-col gap-6">
                            <div className="bg-black/40 border border-indigo-500/20 rounded-xl p-6 backdrop-blur-md">
                                <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Bot size={16} /> ЦИКЛ OODA
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {['OBSERVE', 'ORIENT', 'DECIDE', 'ACT'].map((step, idx) => (
                                        <div key={step} className={cn("p-2 rounded border text-center", idx === 0 ? "border-emerald-500/30 text-emerald-400" : "border-white/10 text-slate-600")}>
                                            <div className="text-[8px] font-black">{step}</div>
                                            <div className="h-1 w-full bg-white/5 mt-1 rounded-full overflow-hidden">
                                                {idx === 0 && <motion.div className="h-full bg-emerald-500" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 5, repeat: Infinity }} />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md">
                                <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Shield size={16} className="text-rose-500" /> SOVEREIGN SECURITY
                                </h3>
                                <div className="space-y-3">
                                    <Button 
                                        onClick={() => systemApi.lockdown()} 
                                        className="w-full bg-rose-950/40 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                        ACTIVATE LOCKDOWN
                                    </Button>
                                    <Button 
                                        onClick={() => systemApi.startEvolutionCycle()} 
                                        variant="outline"
                                        className="w-full border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 text-[10px] font-black uppercase tracking-widest"
                                    >
                                        START EVOLUTION
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Центральна колонка: Topology & Charts */}
                        <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">
                            <div className="bg-black/60 border border-white/10 rounded-xl backdrop-blur-lg">
                                <ClusterTopology />
                            </div>
                            <div className="bg-black/60 border border-white/10 rounded-xl p-6 backdrop-blur-lg flex-1 overflow-hidden flex flex-col">
                                <h3 className="text-sm font-black text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Activity size={16} /> ДИНАМІКА КЛАСТЕРА (24г)
                                </h3>
                                <div className="flex-1 min-h-0">
                                    <ResourceDynamicsChart />
                                </div>
                            </div>
                        </div>

                        {/* Права колонка: OSINT Scenarios & Neural Terminal */}
                        <div className="lg:col-span-1 flex flex-col gap-6 h-full">
                            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">СЦЕНАРІЇ OSINT</h3>
                                    <Badge variant="outline" className="text-[9px]">TOP PRIORITY</Badge>
                                </div>
                                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                                    {scenarios.map(s => <PredictionCard key={s.id} scenario={s} />)}
                                </div>
                            </div>

                            <div className="bg-slate-900/80 border border-white/5 rounded-xl p-4 font-mono text-[9px] h-[180px] overflow-hidden flex flex-col shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                                <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-1 text-slate-500 font-sans font-black">
                                    <span className="flex items-center gap-1"><Brain size={10} /> NEURAL_LOGS_STREAM</span>
                                    <span className="animate-pulse text-emerald-500 text-[8px]">● LIVE_FEED</span>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar scroll-smooth">
                                    <AnimatePresence initial={false}>
                                        {neuralLogs.map((log, i) => (
                                            <motion.div 
                                                key={`${log.timestamp}-${i}`}
                                                initial={{ opacity: 0, x: -5 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex gap-2"
                                            >
                                                <span className="text-slate-600">[{log.level}]</span>
                                                <span className={cn(
                                                    log.level === 'WARN' ? "text-amber-400" : 
                                                    log.level === 'ERROR' ? "text-rose-500 font-bold" :
                                                    log.level === 'SYNC' ? "text-indigo-400" : "text-slate-300"
                                                )}>
                                                    {log.message}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    <motion.div 
                                        initial={{ opacity: 0 }} 
                                        animate={{ opacity: 1 }} 
                                        transition={{ repeat: Infinity, duration: 1 }}
                                        className="text-emerald-500"
                                    >
                                        _
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </PageTransition>
    );
}
