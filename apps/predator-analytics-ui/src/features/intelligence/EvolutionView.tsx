/**
 * Predator v55 | Evolutionary Truth Ledger — Двигун Еволюції
 * Центр фіксації та впровадження системних мутацій AZR.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Dna,
    Activity,
    Shield,
    Sparkles,
    Zap,
    ChevronDown,
    ChevronUp,
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
    Target
} from 'lucide-react';
import EvolutionDashboard from '@/components/super/EvolutionDashboard';
import TruthLedgerTerminal from '@/components/super/TruthLedgerTerminal';
import GlobalNeuralMesh from '@/components/super/GlobalNeuralMesh';
import EvolutionForge from '@/components/super/EvolutionForge';
import { AZRImprovementTrace } from '@/components/super/AZRImprovementTrace';
import { AZRDeploymentCenter } from '@/components/super/AZRDeploymentCenter';
import { premiumLocales } from '@/locales/uk/premium';
import { TacticalCard } from '@/components/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { HoloContainer } from '@/components/HoloContainer';
import { CyberOrb } from '@/components/CyberOrb';
import { cn } from '@/utils/cn';

interface TabConfig {
    id: string;
    label: string;
    icon: React.ReactNode;
    gradient: string;
}

const tabs: TabConfig[] = [
    { id: 'overview', label: premiumLocales.evolution.tabs.overview, icon: <Dna size={16} />, gradient: 'from-amber-500 to-orange-600' },
    { id: 'trace', label: premiumLocales.evolution.tabs.trace, icon: <Activity size={16} />, gradient: 'from-blue-500 to-indigo-600' },
    { id: 'deployment', label: premiumLocales.evolution.tabs.deployment, icon: <Rocket size={16} />, gradient: 'from-emerald-500 to-teal-600' },
    { id: 'ledger', label: premiumLocales.evolution.tabs.ledger, icon: <Shield size={16} />, gradient: 'from-purple-500 to-pink-600' },
];

const EvolutionView: React.FC = () => {
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab && tabs.some(t => t.id === tab)) {
            setActiveTab(tab);
        }
    }, []);

    return (
        <div className="min-h-screen bg-[#02040a] text-slate-200 relative overflow-hidden font-sans">
            {/* V55 Background Matrix */}
            <div className="absolute inset-0 pointer-events-none opacity-40">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.08),transparent_70%)]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-amber-500/10 blur-[150px] rounded-full" />
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-600/10 blur-[120px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(245,158,11,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.03) 1px, transparent 1px)',
                    backgroundSize: '32px 32px'
                }} />
            </div>

            <div className="relative z-10 max-w-[1800px] mx-auto p-4 sm:p-8 space-y-8 pb-32">
                {/* Header Section */}
                <ViewHeader
                    title="EVOLUTIONARY TRUTH LEDGER"
                    icon={<Dna size={22} className="text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]" />}
                    breadcrumbs={['ЦИТАДЕЛЬ', 'ЕВОЛЮЦІЯ', 'LEDGER']}
                    stats={[
                        { label: 'Цикли AZR', value: '2,847', icon: <RefreshCw size={14} />, color: 'primary' },
                        { label: 'Записи Ledger', value: '23K+', icon: <Shield size={14} />, color: 'secondary' },
                        { label: 'Здоров\'я Ядра', value: '98.7%', icon: <Activity size={14} />, color: 'success' },
                    ]}
                    actions={
                        <div className="flex gap-4">
                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                                className="px-6 py-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-[10px] font-black tracking-widest uppercase hover:bg-amber-500/20 transition-all flex items-center gap-2"
                            >
                                <Sparkles size={14} /> НОВА МУТАЦІЯ
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                                className="px-8 py-2.5 bg-amber-600 text-white rounded-full text-[10px] font-black tracking-[0.2em] uppercase shadow-xl shadow-amber-900/40 flex items-center gap-2"
                            >
                                <Zap size={14} className="fill-current" /> СИНТЕЗУВАТИ
                            </motion.button>
                        </div>
                    }
                />

                {/* Tactical Navigation Tabs */}
                <div className="flex gap-4 p-1 bg-slate-900/40 backdrop-blur-xl rounded-[24px] border border-white/5 w-fit">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-3 px-6 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all",
                                activeTab === tab.id
                                    ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg shadow-amber-900/40`
                                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                            )}
                        >
                            {React.cloneElement(tab.icon as React.ReactElement, { size: 16 })}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    <TacticalCard variant="holographic" className="panel-3d" noPadding>
                                        <EvolutionDashboard />
                                    </TacticalCard>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <TacticalCard variant="holographic" title="НЕЙРОННА КУЗНЯ" className="panel-3d">
                                            <EvolutionForge />
                                        </TacticalCard>
                                        <TacticalCard variant="holographic" title="МЕТРИКИ ДОМІНУВАННЯ" className="panel-3d">
                                            <div className="space-y-4 py-4 px-2">
                                                {[
                                                    { label: 'Algorithmic Speed', val: '+24%', color: 'emerald', icon: Zap },
                                                    { label: 'Neural Precision', val: '99.92%', color: 'indigo', icon: Target },
                                                    { label: 'Security Entropy', val: '0.0001', color: 'rose', icon: ShieldCheck },
                                                    { label: 'Resource Synergy', val: 'Optimal', color: 'amber', icon: Gauge },
                                                ].map(m => (
                                                    <div key={m.label} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/20 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn("p-2 rounded-xl bg-opacity-20", `bg-${m.color}-500 text-${m.color}-400`)}>
                                                                <m.icon size={16} />
                                                            </div>
                                                            <span className="text-[11px] font-black text-white uppercase tracking-tight">{m.label}</span>
                                                        </div>
                                                        <span className={cn("text-xs font-black", `text-${m.color}-400`)}>{m.val}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </TacticalCard>
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <TacticalCard variant="holographic" className="panel-3d flex items-center justify-center p-0 overflow-hidden relative min-h-[400px]">
                                        <CyberOrb size={260} color="#f59e0b" intensity={0.6} pulse={true} className="drop-shadow-[0_0_60px_rgba(245,158,11,0.3)]" />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <div className="text-[10px] font-black text-amber-500/50 uppercase tracking-[0.5em] mb-2">Evolution Active</div>
                                            <div className="text-3xl font-black text-white font-mono opacity-80">v55.GEN</div>
                                        </div>
                                    </TacticalCard>

                                    <TacticalCard variant="holographic" title="ЖИВА ІСТОРІЯ ПАТЧІВ" className="panel-3d h-full">
                                        <div className="space-y-3 pt-2 max-h-[450px] overflow-y-auto custom-scrollbar">
                                            {[
                                                { version: 'v56.1.4.1', date: 'Сьогодні', changes: 3, type: 'critical' },
                                                { version: 'v54.8.9', date: 'Вчора', changes: 12, type: 'feature' },
                                                { version: 'v54.2.0', date: '2 дні тому', changes: 7, type: 'performance' },
                                                { version: 'v53.9.5', date: '4 дні тому', changes: 2, type: 'security' },
                                                { version: 'v53.0.0', date: 'Тиждень тому', changes: 45, type: 'major' },
                                            ].map((v, i) => (
                                                <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all cursor-pointer">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-2 h-2 rounded-full",
                                                            v.type === 'critical' ? 'bg-rose-500 animate-pulse' :
                                                                v.type === 'major' ? 'bg-amber-500' : 'bg-blue-400'
                                                        )} />
                                                        <span className="font-mono font-black text-white text-xs">{v.version}</span>
                                                        <span className="text-slate-500 text-[10px] uppercase font-bold tracking-tighter">{v.date}</span>
                                                    </div>
                                                    <span className="px-2 py-1 bg-slate-900 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest border border-white/5">
                                                        +{v.changes} МУТАЦІЙ
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </TacticalCard>
                                </div>
                            </div>

                            <TacticalCard variant="holographic" className="p-0 border-none h-[400px]">
                                <TruthLedgerTerminal />
                            </TacticalCard>
                        </motion.div>
                    )}

                    {activeTab === 'ledger' && (
                        <motion.div
                            key="ledger"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="h-[800px] space-y-8"
                        >
                            <TacticalCard variant="holographic" className="p-0 border-none h-full shadow-2xl">
                                <TruthLedgerTerminal />
                            </TacticalCard>
                        </motion.div>
                    )}

                    {activeTab === 'trace' && (
                        <motion.div
                            key="trace"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <HoloContainer className="panel-3d p-8">
                                <AZRImprovementTrace />
                            </HoloContainer>
                        </motion.div>
                    )}

                    {activeTab === 'deployment' && (
                        <motion.div
                            key="deployment"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-8"
                        >
                            <HoloContainer className="panel-3d p-8">
                                <AZRDeploymentCenter />
                            </HoloContainer>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Status Bar */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-between px-10 py-6 bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[32px] shadow-2xl relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 relative z-10">
                        <span className="flex items-center gap-3">
                            <Zap className="text-amber-500 animate-pulse" size={14} />
                            СТАТУС: <span className="text-amber-400 font-black shadow-amber-500/20">ЯДРО СУВЕРЕННОГО СИНТЕЗУ</span>
                        </span>
                        <span>RUNTIME: 24H 56M</span>
                        <span>НАСТУПНИЙ ЦИКЛ: 45S</span>
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">
                            СИНТЕТИЧНИЙ КОНЦЕНСУС ДОСЯГНУТО
                        </span>
                    </div>
                </motion.div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .panel-3d {
                    transform: perspective(1000px) rotateX(0deg) rotateY(0deg);
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .panel-3d:hover {
                    transform: perspective(1000px) rotateX(1deg) rotateY(-0.5deg) translateY(-5px);
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(245, 158, 11, 0.2);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(245, 158, 11, 0.4);
                }
            `}} />
        </div>
    );
};

export default EvolutionView;
