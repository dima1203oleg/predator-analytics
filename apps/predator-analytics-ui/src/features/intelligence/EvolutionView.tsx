/**
 * 🧬 EVOLUTIONARY TRUTH LEDGER // ДВИГУН ЕВОЛЮЦІЇ | v57.2-WRAITH
 * PREDATOR Analytics — Sovereign Mutation & AZR Synthesis
 * 
 * Центр фіксації та впровадження системних мутацій AZR.
 * Sovereign Power Design · Tactical · Tier-1
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useEffect } from 'react';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Dna,
    Activity,
    Shield,
    Sparkles,
    Zap,
    ChevronDown,
    GitBranch,
    Rocket,
    Brain,
    Database,
    Binary,
    Network,
    RefreshCw,
    ShieldCheck,
    History,
    Gauge,
    Target,
    Orbit,
    Fingerprint,
    Landmark,
    Lock,
    ArrowUpRight
} from 'lucide-react';
import { DiagnosticsTerminal } from '@/components/intelligence/DiagnosticsTerminal';
import EvolutionDashboard from '@/components/super/EvolutionDashboard';
import TruthLedgerTerminal from '@/components/super/TruthLedgerTerminal';
import EvolutionForge from '@/components/super/EvolutionForge';
import { AZRImprovementTrace } from '@/components/super/AZRImprovementTrace';
import { AZRDeploymentCenter } from '@/components/super/AZRDeploymentCenter';
import { premiumLocales } from '@/locales/uk/premium';
import { TacticalCard } from '@/components/TacticalCard';
import { CyberOrb } from '@/components/CyberOrb';
import { CyberGrid } from '@/components/CyberGrid';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { PageTransition } from '@/components/layout/PageTransition';
import { ViewHeader } from '@/components/ViewHeader';
import { cn } from '@/utils/cn';

interface TabConfig {
    id: string;
    label: string;
    icon: React.ReactNode;
}

const tabs: TabConfig[] = [
    { id: 'overview', label: premiumLocales.evolution.tabs.overview, icon: <Dna size={18} /> },
    { id: 'trace', label: premiumLocales.evolution.tabs.trace, icon: <Activity size={18} /> },
    { id: 'deployment', label: premiumLocales.evolution.tabs.deployment, icon: <Rocket size={18} /> },
    { id: 'ledger', label: premiumLocales.evolution.tabs.ledger, icon: <Shield size={18} /> },
];

const EvolutionView: React.FC = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [refreshing, setRefreshing] = useState(false);

    const { isOffline, nodeSource } = useBackendStatus();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab && tabs.some(t => t.id === tab)) {
            setActiveTab(tab);
        }
    }, []);

    useEffect(() => {
        if (isOffline) {
            window.dispatchEvent(new CustomEvent('predator-error', {
                detail: {
                    service: 'EvolutionEngine',
                    message: 'ДВИГУН ЕВОЛЮЦІЇ: Активовано автономний режим AZR-синтезу (EVOLUTION_NODES). Використовується локальний реєстр мутацій.',
                    severity: 'warning',
                    timestamp: new Date().toISOString(),
                    code: 'EVOLUTION_OFFLINE'
                }
            }));
        } else {
            window.dispatchEvent(new CustomEvent('predator-error', {
                detail: {
                    service: 'EvolutionEngine',
                    message: `РЕЄСТР_AZR [${nodeSource}]: Двигун еволюції активовано. Готовність до синтезу мутацій.`,
                    severity: 'info',
                    timestamp: new Date().toISOString(),
                    code: 'EVOLUTION_SUCCESS'
                }
            }));
        }
    }, [isOffline, nodeSource]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await new Promise(r => setTimeout(r, 1500));
            window.dispatchEvent(new CustomEvent('predator-error', {
                detail: {
                    service: 'EvolutionEngine',
                    message: `РЕЄСТР_AZR [${nodeSource}]: ${isOffline ? 'Синхронізація мутацій завершена. Завантажено автономні контури.' : 'Глобальний синтез AZR успішно завершено.'}`,
                    severity: 'info',
                    timestamp: new Date().toISOString(),
                    code: 'EVOLUTION_SUCCESS'
                }
            }));
        } catch (e) {
            window.dispatchEvent(new CustomEvent('predator-error', {
                detail: {
                    service: 'EvolutionEngine',
                    message: `ПОМИЛКА СИНХРОНІЗАЦІЇ ВУЗЛА EVOLUTION_NODES. Перевірте з'єднання з ${nodeSource}.`,
                    severity: 'critical',
                    timestamp: new Date().toISOString(),
                    code: 'EVOLUTION_NODES'
                }
            }));
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#020202] text-slate-200 relative overflow-hidden font-sans pb-40 px-4 xl:px-12">
                <AdvancedBackground />
                <CyberGrid color="rgba(212, 175, 55, 0.04)" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.03),transparent_70%)] pointer-events-none" />

                <div className="relative z-10 max-w-[1850px] mx-auto space-y-16 flex flex-col items-stretch pt-12">
                    
                    <ViewHeader
                        title={
                            <div className="flex items-center gap-12">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-yellow-500/20 blur-[80px] rounded-full scale-150 animate-pulse" />
                                    <div className="relative p-8 bg-black border-2 border-yellow-500/40 rounded-[3rem] shadow-4xl transform -rotate-3 hover:rotate-0 transition-all duration-700">
                                        <Dna size={48} className="text-yellow-500 shadow-[0_0_30px_#d4af37]" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-6">
                                        <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-5 py-1.5 text-[10px] font-black tracking-[0.4em] uppercase italic rounded-xl">
                                            EVOLUTIONARY_LEDGER // {isOffline ? 'MIRROR_MUTATION' : 'NEURAL_MUTATION_CORE'}
                                        </span>
                                        <div className="h-px w-16 bg-yellow-500/20" />
                                        <span className="text-[10px] font-black text-yellow-800 font-mono tracking-widest uppercase italic shadow-sm">v57.2-{isOffline ? 'MIRROR' : 'WRAITH'}</span>
                                    </div>
                                    <h1 className="text-7xl font-black text-white tracking-tighter uppercase italic skew-x-[-4deg] leading-none">
                                        ДВИГУН <span className="text-yellow-500 underline decoration-yellow-600/30 decoration-[16px] underline-offset-[16px] italic uppercase tracking-tighter">ЕВОЛЮЦІЇ</span>
                                    </h1>
                                </div>
                            </div>
                        }
                        breadcrumbs={['SYSTEM', 'AZR_ENGINE', 'EVOLUTION_LEDGER']}
                        badges={[
                            { label: 'CLASSIFIED_S1', color: 'gold', icon: <Lock size={10} /> },
                            { label: 'SOVEREIGN_SYSTEM', color: 'primary', icon: <ShieldCheck size={10} /> },
                        ]}
                        stats={[
                            { label: 'ЦИКЛИ СИНТЕЗУ', value: '2,847', icon: <RefreshCw />, color: 'gold' },
                            { label: 'ТОПОЛОГІЯ МЕЖІ', value: '98.7%', icon: <ShieldCheck />, color: 'success' },
                            { label: 'МУТАЦІЙНІ РИЗИКИ', value: '0.0001', icon: <Activity />, color: 'danger' },
                            { label: 'AI_SYNTH_CORE', value: 'ACTIVE', icon: <Zap />, color: 'primary' },
                        ]}
                    />

                    <div className="flex justify-end gap-6 mb-12">
                        <button 
                            onClick={handleRefresh} 
                            className={cn(
                                "p-7 bg-black border-2 border-white/[0.04] rounded-[2rem] text-slate-500 hover:text-yellow-500 transition-all shadow-4xl group/btn",
                                refreshing && "animate-spin cursor-not-allowed opacity-50"
                            )}
                        >
                            <RefreshCw size={32} className={cn("transition-transform duration-700", refreshing ? "" : "group-hover/btn:rotate-180")} />
                        </button>
                        <button className="relative px-12 py-7 h-fit group/main overflow-hidden rounded-[2.2rem]">
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-yellow-500 transition-transform duration-500 group-hover/main:scale-105" />
                            <div className="relative flex items-center gap-6 text-black font-black uppercase italic tracking-[0.3em] text-[12px]">
                                <Sparkles size={24} /> ІНІЦІЮВАТИ_СИНТЕЗ_AZR
                            </div>
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/main:translate-x-[100%] transition-transform duration-1000" />
                        </button>
                    </div>

                    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {[
                            { label: 'ЦИКЛИ СИНТЕЗУ', value: '2,847', sub: 'Активні AZR ітерації', icon: RefreshCw, color: '#D4AF37' },
                            { label: 'ТОПОЛОГІЯ МЕЖІ', value: '98.7%', sub: 'Здоров\'я ядра AZR', icon: ShieldCheck, color: '#D4AF37' },
                            { label: 'МУТАЦІЙНІ РИЗИКИ', value: '0.0001', sub: 'Рівень системної ентропії', icon: Activity, color: '#F59E0B' },
                        ].map((m, i) => (
                            <div key={i} className="p-10 rounded-[4rem] bg-black border-2 border-white/[0.03] shadow-4xl group relative overflow-hidden transition-all hover:border-white/10">
                                <div className="absolute -top-10 -right-10 p-12 opacity-[0.03] group-hover:opacity-[0.1] transition-all duration-700 rotate-12 group-hover:rotate-0">
                                    <m.icon size={160} style={{ color: m.color }} />
                                </div>
                                <div className="relative z-10 flex items-center justify-between">
                                    <div className="space-y-4">
                                        <p className="text-[11px] font-black text-slate-800 uppercase tracking-[0.4em] italic leading-none">{m.label}</p>
                                        <h3 className="text-6xl font-black text-white italic font-mono tracking-tighter leading-none">{m.value}</h3>
                                        <p className="text-[10px] font-black text-slate-800 uppercase italic tracking-[0.3em]">{m.sub}</p>
                                    </div>
                                    <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl" style={{ color: m.color }}>
                                        <m.icon size={32} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </section>

                    <div className="flex flex-wrap gap-6 p-4 bg-black/80 border-2 border-white/[0.03] rounded-[3.5rem] w-fit shadow-4xl backdrop-blur-3xl mx-auto items-center">
                        <span className="px-6 text-[10px] font-black text-slate-800 uppercase tracking-[0.5em] italic border-r-2 border-white/5 h-10 flex items-center">MATRIX_SELECT</span>
                        {tabs.map(mod => (
                            <button 
                                key={mod.id} onClick={() => setActiveTab(mod.id)}
                                className={cn(
                                    "px-10 py-5 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.3em] italic border-2 transition-all duration-500 flex items-center gap-5 relative overflow-hidden group/tab",
                                    activeTab === mod.id 
                                        ? "bg-yellow-500 border-yellow-400 text-black shadow-[0_0_50px_rgba(212,175,55,0.3)]" 
                                        : "bg-transparent text-slate-600 border-transparent hover:bg-white/5 hover:text-slate-400"
                                )}
                            >
                                {mod.icon}
                                {mod.label}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-12 gap-12">
                        <AnimatePresence mode="wait">
                            {activeTab === 'overview' && (
                                <motion.div
                                    key="overview"
                                    initial={{ opacity: 0, scale: 0.98, rotateX: 5 }}
                                    animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="col-span-12 space-y-12 perspective-1000"
                                >
                                    <div className="grid grid-cols-12 gap-12">
                                        <div className="col-span-12 xl:col-span-8 space-y-12">
                                            <div className="p-12 rounded-[5rem] bg-black border-2 border-white/[0.04] shadow-4xl overflow-hidden relative">
                                                <div className="absolute top-6 left-12 flex items-center gap-4 text-yellow-500">
                                                    <Orbit size={18} className="animate-spin-slow" />
                                                    <span className="text-[11px] font-black uppercase tracking-[0.5em] italic">EVOLUTIONARY_MAP // AZR_VISUALIZER</span>
                                                </div>
                                                <div className="pt-10">
                                                   <EvolutionDashboard />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                                <div className="p-12 rounded-[4rem] bg-black border-2 border-white/[0.04] shadow-4xl space-y-10 relative overflow-hidden">
                                                    <h4 className="text-[12px] font-black text-yellow-500 italic uppercase tracking-[0.4em] flex items-center gap-4 border-b border-white/[0.05] pb-8">
                                                        <Landmark size={20} /> НЕЙРОННА КУЗНЯ
                                                    </h4>
                                                    <EvolutionForge />
                                                </div>
                                                <div className="p-12 rounded-[4rem] bg-black border-2 border-white/[0.04] shadow-4xl space-y-10 relative overflow-hidden">
                                                    <h4 className="text-[12px] font-black text-amber-500 italic uppercase tracking-[0.4em] flex items-center gap-4 border-b border-amber-500/10 pb-8">
                                                        <Gauge size={20} /> МЕТРИКИ СИСТЕМИ
                                                    </h4>
                                                    <div className="space-y-6 pt-4 italic">
                                                        {[
                                                            { label: 'ALGORITHMIC SPEED', val: '+24%', color: '#D4AF37', icon: Zap },
                                                            { label: 'NEURAL PRECISION', val: '99.92%', color: '#D4AF37', icon: Target },
                                                            { label: 'SECURITY ENTROPY', val: '0.0001', color: '#F59E0B', icon: ShieldCheck },
                                                            { label: 'RESOURCE SYNERGY', val: 'OPTIMAL', color: '#D4AF37', icon: Gauge },
                                                        ].map(m => (
                                                            <div key={m.label} className="flex items-center justify-between p-6 bg-white/[0.01] rounded-[2rem] border-2 border-white/[0.03] group/metric hover:border-white/10 transition-all shadow-inset">
                                                                <div className="flex items-center gap-5">
                                                                    <div className="p-4 rounded-2xl bg-black border-2 border-white/[0.05]" style={{ color: m.color }}>
                                                                        <m.icon size={20} />
                                                                    </div>
                                                                    <span className="text-[12px] font-black text-white uppercase tracking-tighter">{m.label}</span>
                                                                </div>
                                                                <span className="text-xl font-black font-mono tracking-tighter" style={{ color: m.color }}>{m.val}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-span-12 xl:col-span-4 space-y-12 flex flex-col items-stretch">
                                            <div className="flex-1 p-12 rounded-[5rem] bg-black border-2 border-yellow-500/40 shadow-4xl relative overflow-hidden flex flex-col items-center justify-center text-center group">
                                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.08),transparent_60%)] pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
                                                <CyberOrb size={320} color="#D4AF37" intensity={0.8} pulse={true} className="drop-shadow-[0_0_80px_rgba(212,175,55,0.3)]" />
                                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 space-y-4">
                                                    <div className="text-[12px] font-black text-yellow-500/60 uppercase tracking-[0.8em] italic">EVOLUTION_ACTIVE</div>
                                                    <div className="text-6xl font-black text-white font-mono tracking-tighter shadow-sm italic uppercase">v57.2.GEN</div>
                                                    <div className="p-4 bg-yellow-500/10 rounded-full border border-yellow-500/20 blur-sm animate-pulse w-32 h-32 absolute -z-10" />
                                                </div>
                                            </div>

                                            <div className="p-12 rounded-[4rem] bg-black border-2 border-white/[0.04] shadow-4xl space-y-10 relative overflow-hidden">
                                                <h4 className="text-[12px] font-black text-yellow-500 italic uppercase tracking-[0.4em] flex items-center gap-4 border-b border-white/[0.05] pb-8">
                                                    <History size={20} /> ЖИВА ІСТОРІЯ ПАТЧІВ
                                                </h4>
                                                <div className="space-y-6 pt-4 max-h-[500px] overflow-y-auto no-scrollbar custom-scrollbar italic pr-4">
                                                    {[
                                                        { version: 'v57.2-WRAITH.1', date: 'СЬОГОДНІ', changes: 5, type: 'critical' },
                                                        { version: 'v57.2.9', date: 'ВЧОРА', changes: 12, type: 'feature' },
                                                        { version: 'v57.2.0', date: '2 ДНІ ТОМУ', changes: 18, type: 'major' },
                                                        { version: 'v57.2-WRAITH.9.5', date: '4 ДНІ ТОМУ', changes: 4, type: 'security' },
                                                        { version: 'v57.2-WRAITH.0.0', date: 'ТИЖДЕНЬ ТОМУ', changes: 82, type: 'major' },
                                                    ].map((v, i) => (
                                                        <div key={i} className="p-6 bg-white/[0.01] rounded-[2rem] border-2 border-white/[0.03] flex items-center justify-between group/v hover:bg-white/[0.04] hover:border-white/10 transition-all cursor-pointer shadow-sm">
                                                            <div className="flex items-center gap-5">
                                                                <div className={cn(
                                                                    "w-3 h-3 rounded-full shadow-[0_0_15px_rgba(0,0,0,1)]",
                                                                    v.type === 'critical' ? 'bg-amber-600 animate-pulse shadow-amber-600/20' :
                                                                        v.type === 'major' ? 'bg-yellow-500 shadow-yellow-500/20' : 'bg-slate-500 shadow-slate-500/20'
                                                                )} />
                                                                <div className="space-y-1">
                                                                    <p className="font-mono font-black text-white text-[10px] leading-none uppercase tracking-widest">{v.version}</p>
                                                                    <p className="text-slate-800 text-[10px] uppercase font-black tracking-[0.1em]">{v.date}</p>
                                                                </div>
                                                            </div>
                                                            <span className="px-4 py-2 bg-black border-2 border-white/[0.05] rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover/v:text-yellow-500 group-hover/v:border-yellow-500/20 transition-all">
                                                                +{v.changes} МУТАЦІЙ
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-12 rounded-[5rem] bg-black border-2 border-white/[0.04] shadow-4xl relative overflow-hidden">
                                        <div className="absolute top-6 left-12 flex items-center gap-4 text-amber-500 opacity-60">
                                            <Binary size={18} />
                                            <span className="text-[11px] font-black uppercase tracking-[0.5em] italic">TRUTH_LEDGER_STREAM // LIVE</span>
                                        </div>
                                        <div className="pt-10 h-[500px]">
                                           <TruthLedgerTerminal />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'ledger' && (
                                <motion.div
                                    key="ledger"
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="col-span-12 p-12 rounded-[5rem] bg-black border-2 border-white/[0.04] shadow-4xl h-[900px] relative overflow-hidden"
                                >
                                     <div className="absolute top-8 left-12 flex items-center gap-6">
                                        <div className="p-4 bg-yellow-500/10 border-2 border-yellow-500/20 rounded-2xl text-yellow-500">
                                            <ShieldCheck size={32} />
                                        </div>
                                        <div className="space-y-1">
                                            <h2 className="text-2xl font-black text-white italic uppercase tracking-[0.4em]">SOVEREIGN_TRUTH_LEDGER</h2>
                                            <p className="text-[10px] text-slate-800 font-black uppercase tracking-[0.3em] font-mono italic">IMMUTABLE_GENOME_RECORD_SERVICE</p>
                                        </div>
                                     </div>
                                     <div className="pt-24 h-full">
                                        <TruthLedgerTerminal />
                                     </div>
                                </motion.div>
                            )}

                            {activeTab === 'trace' && (
                                <motion.div
                                    key="trace"
                                    initial={{ opacity: 0, x: 100 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    className="col-span-12 p-12 rounded-[5rem] bg-black border-2 border-white/[0.04] shadow-4xl min-h-[800px] relative overflow-hidden"
                                >
                                    <div className="absolute top-8 left-12 flex items-center gap-6">
                                        <div className="p-4 bg-yellow-500/10 border-2 border-yellow-500/20 rounded-2xl text-yellow-500">
                                            <GitBranch size={32} />
                                        </div>
                                        <div className="space-y-1">
                                            <h2 className="text-2xl font-black text-white italic uppercase tracking-[0.4em]">AZR_IMPROVEMENT_TRACE</h2>
                                            <p className="text-[10px] text-slate-800 font-black uppercase tracking-[0.3em] font-mono italic">SYNTHETIC_EVOLUTION_PATH_QUERY</p>
                                        </div>
                                     </div>
                                     <div className="pt-24 h-full">
                                        <AZRImprovementTrace />
                                     </div>
                                </motion.div>
                            )}

                            {activeTab === 'deployment' && (
                                <motion.div
                                    key="deployment"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.1 }}
                                    className="col-span-12 p-12 rounded-[5rem] bg-black border-2 border-white/[0.04] shadow-4xl min-h-[800px] relative overflow-hidden"
                                >
                                    <div className="absolute top-8 left-12 flex items-center gap-6">
                                        <div className="p-4 bg-amber-600/10 border-2 border-amber-600/20 rounded-2xl text-amber-500">
                                            <Rocket size={32} />
                                        </div>
                                        <div className="space-y-1">
                                            <h2 className="text-2xl font-black text-white italic uppercase tracking-[0.4em]">DEPLOYMENT_ORCHESTRATION</h2>
                                            <p className="text-[10px] text-slate-800 font-black uppercase tracking-[0.3em] font-mono italic">MUTATION_PROPAGATION_PROTOCOL</p>
                                        </div>
                                     </div>
                                     <div className="pt-24 h-full">
                                        <AZRDeploymentCenter />
                                     </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row items-center justify-between px-16 py-8 bg-black border-4 border-white/[0.04] rounded-[4rem] shadow-4xl relative overflow-hidden group"
                    >
                         <div className="absolute inset-0 bg-yellow-500/[0.02] pointer-events-none group-hover:bg-yellow-500/[0.05] transition-colors" />
                         <div className="flex items-center gap-12 text-[11px] font-black uppercase tracking-[0.4em] text-slate-700 relative z-10 italic">
                             <div className="flex items-center gap-4 text-yellow-500">
                                <Fingerprint size={20} />
                                <span>STATUS: <span className="text-white">ЯДРО_ЕВОЛЮЦІЇ_АКТИВНЕ</span></span>
                             </div>
                             <div className="h-6 w-px bg-white/5 hidden md:block" />
                             <div className="flex items-center gap-4">
                                <Activity size={18} />
                                <span>UPTIME: 99.982%</span>
                             </div>
                             <div className="h-6 w-px bg-white/5 hidden md:block" />
                             <div className="flex items-center gap-4">
                                <Database size={18} />
                                <span>LEDGER_SIZE: 2.8PB</span>
                             </div>
                         </div>
                         <div className="flex items-center gap-6 mt-8 md:mt-0 relative z-10 px-8 py-3 bg-emerald-500/5 rounded-2xl border-2 border-emerald-500/20">
                             <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_20px_#10b981]" />
                             <span className="text-[11px] font-black uppercase tracking-[0.5em] text-emerald-500 italic">СИНТЕТИЧНИЙ_КОНЦЕНСУС_OK</span>
                         </div>
                    </motion.div>

                    <div className="mt-12">
                        <DiagnosticsTerminal />
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{ __html: `
                    .shadow-4xl { box-shadow: 0 80px 150px -40px rgba(0,0,0,0.95), 0 0 100px rgba(212,175,55,0.02); }
                    .shadow-inset { box-shadow: inset 0 2px 20px rgba(0,0,0,0.8); }
                    .animate-spin-slow { animation: spin 20s linear infinite; }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    .perspective-1000 { perspective: 1000px; }
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .custom-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.1); border-radius: 20px; border: 3px solid black; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212,175,55,0.2); }
                    .backdrop-blur-4xl { backdrop-filter: blur(120px) saturate(180%); }
                `}} />
            </div>
        </PageTransition>
    );
};

export default EvolutionView;
