import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dna, Activity, Shield, Sparkles, Zap, ChevronDown, ChevronUp, GitBranch, Rocket } from 'lucide-react';
import EvolutionDashboard from '../components/super/EvolutionDashboard';
import TruthLedgerTerminal from '../components/super/TruthLedgerTerminal';
import GlobalNeuralMesh from '../components/super/GlobalNeuralMesh';
import EvolutionForge from '../components/super/EvolutionForge';
import { AZRImprovementTrace } from '../components/super/AZRImprovementTrace';
import { AZRDeploymentCenter } from '../components/super/AZRDeploymentCenter';
import { premiumLocales } from '../locales/uk/premium';

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
    }, [window.location.search]);

    return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden">
            {/* Animated Cybercore Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 neural-mesh opacity-30" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.08),transparent_70%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(16,185,129,0.05),transparent_70%)]" />
                <div className="scanline opacity-10" />
            </div>

            <div className="relative z-10 p-4 md:p-8 max-w-[1800px] mx-auto space-y-8">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative"
                >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                        <div className="flex items-center gap-8">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 blur-2xl rounded-full opacity-30 group-hover:opacity-50 transition-all duration-700" />
                                <div className="relative p-5 bg-black/40 rounded-3xl border border-amber-500/30 backdrop-blur-2xl shadow-2xl panel-3d">
                                    <Dna className="text-amber-400 icon-3d-amber" size={36} />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-5xl font-black text-white leading-none tracking-tighter mb-2 group-hover:scale-[1.01] transition-transform duration-500">
                                    EVOLUTION_<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-500">ENGINE</span>
                                </h1>
                                <p className="text-slate-400 text-xs font-black uppercase tracking-[0.4em] flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 dynamic-color-pulse" />
                                    {premiumLocales.evolution.subtitle}
                                </p>
                            </div>
                        </div>

                        {/* Quick Stats v25 */}
                        <div className="flex gap-4">
                            <div className="px-8 py-4 bg-black/40 backdrop-blur-2xl border border-white/5 rounded-[24px] shadow-xl panel-3d">
                                <div className="text-[9px] text-slate-500 uppercase tracking-[0.3em] font-black mb-1">{premiumLocales.evolution.stats.azrCycles}</div>
                                <div className="text-3xl font-black text-white font-mono">2,847</div>
                            </div>
                            <div className="px-8 py-4 bg-black/40 backdrop-blur-2xl border border-white/5 rounded-[24px] shadow-xl panel-3d">
                                <div className="text-[9px] text-slate-500 uppercase tracking-[0.3em] font-black mb-1">{premiumLocales.evolution.stats.ledgerEntries}</div>
                                <div className="text-3xl font-black text-blue-400 font-mono">23K+</div>
                            </div>
                            <div className="px-8 py-4 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[24px] shadow-xl panel-3d">
                                <div className="text-[9px] text-slate-500 uppercase tracking-[0.3em] font-black mb-1">{premiumLocales.evolution.stats.healthScore}</div>
                                <div className="text-3xl font-black text-amber-400 font-mono">98.7%</div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Tab Navigation v25 */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-wrap gap-4 bg-black/40 p-2 rounded-[28px] border border-white/5 backdrop-blur-2xl w-fit"
                >
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`group relative px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all duration-500 ${
                                activeTab === tab.id
                                    ? 'text-white'
                                    : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTabEvolution"
                                    className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} rounded-2xl shadow-xl shadow-current-glow`}
                                    transition={{ type: "spring", bounce: 0.15, duration: 0.7 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-3">
                                {React.cloneElement(tab.icon as React.ReactElement, { size: 14 })}
                                {tab.label}
                            </span>
                        </button>
                    ))}
                </motion.div>

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-8"
                        >
                            {/* Main Dashboard */}
                            <EvolutionDashboard />

                            {/* Secondary Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="h-[400px]">
                                    <TruthLedgerTerminal />
                                </div>
                                <EvolutionForge />
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'ledger' && (
                        <motion.div
                            key="ledger"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="h-[700px]"
                        >
                            <TruthLedgerTerminal />
                        </motion.div>
                    )}

                    {activeTab === 'trace' && (
                        <motion.div
                            key="trace"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <AZRImprovementTrace />
                        </motion.div>
                    )}

                    {activeTab === 'deployment' && (
                        <motion.div
                            key="deployment"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <AZRDeploymentCenter />
                        </motion.div>
                    )}

                    {activeTab === 'forge' && (
                        <motion.div
                            key="forge"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                        >
                            <EvolutionForge />
                            <div className="p-8 bg-slate-950/60 backdrop-blur-2xl border border-purple-500/20 rounded-[40px] shadow-2xl">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-500/30">
                                        <GitBranch className="text-purple-400" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-widest">{premiumLocales.evolution.ui.versions}</h3>
                                        <p className="text-[10px] text-slate-500 font-mono">{premiumLocales.evolution.ui.history}</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { version: 'v48.2.1', date: '2026-01-25', changes: 3, type: 'aesthetic' },
                                        { version: 'v48.2.0', date: '2026-01-24', changes: 7, type: 'feature' },
                                        { version: 'v48.1.5', date: '2026-01-23', changes: 2, type: 'performance' },
                                    ].map((v, i) => (
                                        <div key={i} className="p-4 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${
                                                    v.type === 'aesthetic' ? 'bg-purple-400' :
                                                    v.type === 'feature' ? 'bg-blue-400' : 'bg-amber-400'
                                                }`} />
                                                <span className="font-mono font-bold text-white">{v.version}</span>
                                                <span className="text-slate-500 text-sm">{v.date}</span>
                                            </div>
                                            <span className="px-3 py-1 bg-slate-800 rounded-lg text-xs text-slate-400">
                                                +{v.changes} {premiumLocales.evolution.ui.changes}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Status Bar v25 */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-between px-10 py-6 bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[32px] shadow-2xl"
                >
                    <div className="flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        <span className="flex items-center gap-3">
                            <Zap className="text-amber-500 animate-pulse" size={14} />
                            {premiumLocales.evolution.ui.status}: <span className="text-amber-400 font-black shadow-amber-500/20">{premiumLocales.evolution.ui.sovereignCore}</span>
                        </span>
                        <span>{premiumLocales.evolution.ui.runtime}: 24H 56M</span>
                        <span>{premiumLocales.evolution.ui.nextCycle}: 45S</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 dynamic-color-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">
                            {premiumLocales.evolution.ui.engaged}
                        </span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default EvolutionView;
