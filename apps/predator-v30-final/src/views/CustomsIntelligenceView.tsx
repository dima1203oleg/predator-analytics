
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Ship, Truck, Plane, Search, Filter, TrendingUp, AlertTriangle,
    DollarSign, Briefcase, Scale, ShieldCheck, Globe, Activity,
    Download, PieChart, BarChart3, Fingerprint, Lock, Zap,
    FileSearch, ShieldAlert, Check, Loader2, Share2, Eye, FileText,
    BrainCircuit, Network, Layout, Target, Shield, Users
} from 'lucide-react';
import { useAppStore, InterlinkPersona } from '../store/useAppStore';
import { cn } from '../utils/cn';
import { ViewHeader } from '../components/ViewHeader';
import { TacticalCard } from '../components/TacticalCard';
import { api } from '../services/api';
import { premiumLocales } from '../locales/uk/premium';
import {
    AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// Mock data for modeling
const MOCK_TIME_DATA = [
    { name: '1-7 Груд', value: 4000, risk: 2400 },
    { name: '8-14 Груд', value: 3000, risk: 1398 },
    { name: '15-21 Груд', value: 2000, risk: 9800 },
    { name: '22-31 Груд', value: 2780, risk: 3908 },
];

const VectorFlow = ({ start, end, delay }: { start: [number, number], end: [number, number], delay: number }) => (
    <motion.path
        d={`M ${start[0]} ${start[1]} Q ${(start[0] + end[0]) / 2} ${(start[1] + end[1]) / 2 - 50} ${end[0]} ${end[1]}`}
        fill="transparent"
        stroke="url(#vectorGradient)"
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: [0, 1, 1, 0] }}
        transition={{
            duration: 3,
            repeat: Infinity,
            delay: delay,
            ease: "easeInOut"
        }}
    />
);

const TacticalMap = () => {
    const vectors: { start: [number, number], end: [number, number], delay: number }[] = [
        { start: [100, 200], end: [500, 300], delay: 0 },
        { start: [150, 250], end: [450, 150], delay: 0.5 },
        { start: [200, 100], end: [600, 250], delay: 1.2 },
        { start: [50, 350], end: [350, 100], delay: 0.8 },
        { start: [400, 400], end: [100, 150], delay: 1.5 },
        { start: [550, 50], end: [200, 300], delay: 2.1 },
    ];

    return (
        <div className="relative w-full h-[500px] bg-slate-950/40 rounded-[40px] border border-white/10 overflow-hidden group shadow-2xl">
            <div className="absolute inset-0 bg-cyber-grid opacity-10" />

            {/* Pulsing Nodes */}
            {[
                { x: 100, y: 200 }, { x: 500, y: 300 }, { x: 450, y: 150 },
                { x: 200, y: 100 }, { x: 600, y: 250 }, { x: 50, y: 350 }
            ].map((node, i) => (
                <motion.div
                    key={i}
                    className="absolute w-2.5 h-2.5 bg-amber-500 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.8)]"
                    style={{ left: node.x, top: node.y }}
                    animate={{ scale: [1, 1.8, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                />
            ))}

            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                    <linearGradient id="vectorGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0" />
                        <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {vectors.map((vec, i) => (
                    <VectorFlow key={i} {...vec} />
                ))}
            </svg>

            {/* Scanning HUD */}
            <div className="absolute top-8 left-8 p-4 bg-black/60 border border-white/10 rounded-2xl backdrop-blur-xl z-10">
                <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Activity size={12} className="animate-pulse" />
                    {premiumLocales.customsIntelligence.ui.mappingVectors}
                </div>
                <div className="text-[8px] font-mono text-slate-500 space-y-1">
                    <div>LNG: 34.02 // LAT: -118.49</div>
                    <div className="text-emerald-500">{premiumLocales.customsIntelligence.ui.secureChannel}</div>
                </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                 <Globe size={400} className="text-amber-500" />
            </div>
        </div>
    );
};

const CustomsIntelligenceView: React.FC = () => {
    const { userRole, persona, setPersona } = useAppStore();
    const l = premiumLocales.customsIntelligence;
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'stream' | 'modeling' | 'map'>('stream');
    const [modelingMode, setModelingMode] = useState<'pro' | 'presets'>('presets');
    const [isSimulating, setIsSimulating] = useState(false);

    // PDF Generation State
    const [generatingReport, setGeneratingReport] = useState<{ active: boolean, company: string, stage: number } | null>(null);
    const [dossierReady, setDossierReady] = useState(false);
    const [dossierUrl, setDossierUrl] = useState<string | null>(null);
    const [registryData, setRegistryData] = useState<any[]>([]);
    const [isLoadingRegistry, setIsLoadingRegistry] = useState(true);
    const [timeData, setTimeData] = useState<any[]>(MOCK_TIME_DATA);
    const [anomalies, setAnomalies] = useState<any[]>([]);

    useEffect(() => {
        fetchRegistry();
        fetchModelingData();
        fetchAnomalies();
        const interval = setInterval(fetchAnomalies, 5000);
        return () => clearInterval(interval);
    }, [persona, activeTab, modelingMode]);

    const fetchAnomalies = async () => {
        try {
            const res = await api.customs.getAnomalies();
            if (res.status === 'success') setAnomalies(res.data);
        } catch (e) {
            console.error("Anomalies fetch failed");
        }
    };

    const fetchRegistry = async () => {
        setIsLoadingRegistry(true);
        try {
            const res = await api.customs.getRegistry(searchQuery);
            setRegistryData(res.data || []);
        } finally {
            setIsLoadingRegistry(false);
        }
    };

    const fetchModelingData = async () => {
        try {
            const res = await api.customs.getModeling(persona as string, modelingMode);
            if (res.status === 'success') setTimeData(res.data.time_data);
        } catch (e) {
            // Keep mock data if API fails
        }
    };

    if (userRole === 'client') {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-8 bg-slate-950 relative overflow-hidden">
                <div className="absolute inset-0 bg-cyber-grid opacity-20" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 text-center space-y-8 max-w-2xl bg-black/60 p-12 rounded-[64px] border border-amber-500/30 backdrop-blur-3xl shadow-[0_0_100px_rgba(245,158,11,0.1)]"
                >
                    <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                        <Lock className="w-12 h-12 text-amber-500 animate-pulse" />
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{l.paywall.title}</h2>
                    <p className="text-slate-400 text-sm leading-relaxed font-mono">{l.paywall.desc}</p>
                    <button className="px-10 py-5 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black rounded-3xl hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] transition-all uppercase tracking-[0.2em] transform hover:scale-105">
                        {l.paywall.upgrade}
                    </button>
                </motion.div>
            </div>
        );
    }

    const currentPersonaIntel = l.personas[persona as InterlinkPersona] || l.personas.TITAN;

    const handleModelRun = async () => {
        setIsSimulating(true);
        await fetchModelingData();
        setTimeout(() => setIsSimulating(false), 2000);
    };

    const triggerReport = async (companyName: string) => {
        setGeneratingReport({ active: true, company: companyName, stage: 1 });
        setDossierReady(false);

        try {
            // Етап 1: Аналіз графа
            setGeneratingReport(prev => prev ? { ...prev, stage: 2 } : null);

            let response: any = { success: false };
            try {
                response = await api.customs.synthesizeDossier(companyName);
            } catch (e) {
                console.warn("Backend Offline - Using Demo Fallback");
            }

            if (!response?.success) {
                await new Promise(r => setTimeout(r, 1500)); // Simulate work
                response = {
                    success: true,
                    url: "data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCDIgMCBvYmogCjw8CiAgL1R5cGUgL1BhZ2VzCiAgL01lZGlhQm94IFsgMCAwIDIwMCAyMDAgXQogIC9Db3VudCAxCiAgL0tpZHMgWyAzIDAgUiBdCj4+CmVuZG9iagoKMyAwIG9iago8PAogIC9UeXBlIC9QYWdlCiAgL1BhcmVudCAyIDAgUgogIC9SZXNvdXJjZXMgPDwKICAgIC9Gb250IDw8CiAgICAgIC9FMSA0IDAgUgogICAgPj4KICA+PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iagoKNSAwIG9Ygo8PAogIC9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9FMSAxMiBUZgoxMCAxMDAgVGQKKERFTU8gRE9TU0lFUiAtIFNZU1RFTSBSRVNUQVJUIFJFUVVJUkVEKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCgp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDA2MCAwMDAwMCBuIAowMDAwMDAwMTU3IDAwMDAwIG4gCjAwMDAwMDAyNTUgMDAwMDAgbiAKMDAwMDAwMDM0MSAwMDAwMCBuIAp0cmFpbGVyCjw8CiAgL1NpemUgNgogIC9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0MzYKJSU1FT0YK"
                };
            }

            // Етап 2: Синтез звіту (Backend вже згенерував файл)
            setGeneratingReport(prev => prev ? { ...prev, stage: 3 } : null);

            if (response.success) {
                setDossierUrl(response.url || '#');
                setDossierReady(true);
            } else {
                throw new Error("Синтез не вдалося завершити");
            }
        } catch (e) {
            console.error("Dossier synthesis failed:", e);
            setGeneratingReport(null);
            // Можна додати тост-повідомлення про помилку
        }
    };

    return (
        <div className="min-h-screen flex flex-col p-6 gap-6 relative z-10 pb-24 w-full max-w-[1800px] mx-auto">
            <ViewHeader
                title={l.title}
                icon={<Ship size={20} className="text-amber-400" />}
                breadcrumbs={l.breadcrumbs}
                stats={[
                    { label: l.stats.declarations, value: '142,504', icon: <FileText size={14} />, color: 'primary' },
                    { label: l.stats.anomalies, value: '3,112', icon: <AlertTriangle size={14} />, color: 'danger' },
                    { label: l.stats.volumeUsd, value: '1.2B', icon: <DollarSign size={14} />, color: 'success' },
                ]}
            />

            {/* Persona & Navigation Row */}
            <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-2 p-1.5 bg-black/40 border border-white/5 rounded-2xl backdrop-blur-3xl shadow-2xl">
                    {[
                        { id: 'stream', label: l.tabs.stream, icon: Activity },
                        { id: 'modeling', label: l.tabs.modeling, icon: PieChart },
                        { id: 'map', label: l.tabs.map, icon: Globe }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all",
                                activeTab === tab.id
                                    ? "bg-amber-500/10 text-amber-400 shadow-[inset_0_0_15px_rgba(245,158,11,0.1)] border border-amber-500/20"
                                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                            )}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 p-1.5 bg-slate-900/60 border border-white/5 rounded-2xl backdrop-blur-3xl">
                    {(['TITAN', 'INQUISITOR', 'SOVEREIGN'] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => setPersona(p)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-[9px] font-black tracking-tighter uppercase transition-all flex items-center gap-2",
                                persona === p
                                    ? "bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                                    : "text-slate-500 hover:text-white"
                            )}
                        >
                            {p === 'TITAN' ? <Target size={12}/> : p === 'INQUISITOR' ? <Shield size={12}/> : <Users size={12}/>}
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
                {/* Main Content Area */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <AnimatePresence mode="wait">
                        {activeTab === 'stream' && (
                            <motion.div
                                key="stream"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex-1 flex flex-col gap-6"
                            >
                                <TacticalCard variant="holographic" title={currentPersonaIntel.title} subtitle={currentPersonaIntel.focus}>
                                    <div className="p-8">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex gap-2">
                                                {Object.entries(l.ui.modes).map(([key, label]) => (
                                                    <button key={key} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black tracking-widest hover:bg-amber-500/10 hover:border-amber-500/30 transition-all">{label}</button>
                                                ))}
                                            </div>
                                            <div className="relative w-72">
                                                <input
                                                    type="text"
                                                    placeholder={l.ui.searchPlaceholder}
                                                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2 pl-10 text-[11px] font-mono focus:border-amber-500/50 outline-none"
                                                />
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                            </div>
                                        </div>

                                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                            {isLoadingRegistry ? (
                                                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                                                    <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{l.ui.accessingPort}</span>
                                                </div>
                                            ) : registryData.length > 0 ? registryData.map((record, i) => (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    key={record.id}
                                                    className="p-4 bg-slate-900/40 border border-white/5 rounded-2xl hover:border-amber-500/30 transition-all group flex items-center justify-between"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform shadow-inner">
                                                            {i % 3 === 0 ? <Ship size={20} /> : i % 2 === 0 ? <Truck size={20} /> : <Plane size={20} />}
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-black text-white uppercase tracking-tight">#{record.id} // {record.company}</div>
                                                            <div className="text-[10px] text-slate-500 font-mono uppercase italic">HS: {record.hs_code} • {record.weight}kg</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-8">
                                                        <div className="text-right">
                                                            <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">{l.ui.declared}</div>
                                                            <div className="text-xs font-mono font-black text-amber-500">${record.declared_value.toLocaleString()}</div>
                                                        </div>
                                                        <button
                                                            onClick={() => triggerReport(record.company)}
                                                            className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30 transition-all"
                                                            title={l.actions.generateDossier}
                                                        >
                                                            <ShieldAlert size={16} />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )) : (
                                                <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 italic text-slate-600 text-[10px] uppercase font-mono tracking-widest">
                                                    {l.ui.emptyRegistry}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </TacticalCard>
                            </motion.div>
                        )}

                        {activeTab === 'modeling' && (
                            <motion.div
                                key="modeling"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex-1 flex flex-col gap-6"
                            >
                                <div className="p-8 bg-black/60 border border-white/10 rounded-[40px] backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                                     <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <BrainCircuit size={100} className="text-amber-500" />
                                    </div>

                                    <div className="flex items-center justify-between mb-8 relative z-10">
                                        <div className="flex items-center gap-6">
                                            <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5">
                                                <button
                                                    onClick={() => setModelingMode('presets')}
                                                    className={cn("px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", modelingMode === 'presets' ? "bg-amber-500 text-black" : "text-slate-500 hover:text-white")}
                                                >
                                                    {l.modeling.presets}
                                                </button>
                                                <button
                                                    onClick={() => setModelingMode('pro')}
                                                    className={cn("px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", modelingMode === 'pro' ? "bg-amber-500 text-black" : "text-slate-500 hover:text-white")}
                                                >
                                                    {l.modeling.pro}
                                                </button>
                                            </div>
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{l.modeling.selectedPerspective}: <span className="text-amber-400">{persona}</span></div>
                                        </div>
                                        <button
                                            onClick={handleModelRun}
                                            disabled={isSimulating}
                                            className="px-8 py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-amber-900/40 hover:scale-105 transition-all flex items-center gap-3 active:scale-95"
                                        >
                                            {isSimulating ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={14} />}
                                            {isSimulating ? l.modeling.modeling : l.modeling.run}
                                        </button>
                                    </div>

                                    {modelingMode === 'presets' ? (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                                            {currentPersonaIntel.presets.map((preset, idx) => (
                                                <button key={idx} className="p-6 bg-slate-900/40 border border-white/10 rounded-3xl text-left hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group shadow-xl">
                                                    <div className="text-[8px] font-black text-amber-500 uppercase mb-2 opacity-30 group-hover:opacity-100 italic">TACTICAL_PRESET_{idx+1}</div>
                                                    <div className="text-[11px] font-black text-white uppercase leading-tight">{preset}</div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                                            {[l.modeling.xTime, l.modeling.yValue, l.modeling.filterHq, l.modeling.metricRisk].map(field => (
                                                <div key={field} className="space-y-2">
                                                    <div className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-3 text-[10px] font-black text-white cursor-pointer hover:border-amber-500/30 hover:bg-white/5 transition-colors flex justify-between items-center group">
                                                        <span>{field}</span>
                                                        <Filter size={10} className="text-slate-600 group-hover:text-amber-500" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <TacticalCard variant="minimal" title={l.modeling.tradeVolume}>
                                        <div className="h-[300px] w-full p-4">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={timeData}>
                                                    <defs>
                                                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                                    <XAxis dataKey="name" fontSize={8} tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                                                    <YAxis fontSize={8} tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                                                    <Tooltip
                                                        contentStyle={{backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontSize: '10px', fontFamily: 'monospace'}}
                                                        itemStyle={{color: '#f59e0b'}}
                                                    />
                                                    <Area type="monotone" dataKey="value" stroke="#f59e0b" fillOpacity={1} fill="url(#colorVal)" strokeWidth={4} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </TacticalCard>
                                    <TacticalCard variant="minimal" title={l.modeling.riskDistribution}>
                                        <div className="h-[300px] w-full p-4">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={timeData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                                    <XAxis dataKey="name" fontSize={8} tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                                                    <YAxis fontSize={8} tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                                                    <Tooltip
                                                        contentStyle={{backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontSize: '10px', fontFamily: 'monospace'}}
                                                    />
                                                    <Bar dataKey="risk" fill="#f43f5e" radius={[8, 8, 0, 0]} barSize={24}>
                                                        {timeData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.risk > 5000 ? '#f43f5e' : '#f59e0b'} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </TacticalCard>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'map' && (
                            <motion.div
                                key="map"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex-1 flex flex-col gap-6"
                            >
                                <TacticalMap />
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { label: l.ui.density, val: l.ui.vital, icon: <Network size={16}/>, color: 'text-amber-500' },
                                        { label: l.ui.security, val: '98.2%', icon: <ShieldCheck size={16}/>, color: 'text-emerald-500' },
                                        { label: l.ui.traffic, val: l.ui.stable, icon: <Activity size={16}/>, color: 'text-blue-500' }
                                    ].map((s, i) => (
                                        <div key={i} className="p-6 bg-slate-900/40 border border-white/5 rounded-3xl backdrop-blur-xl flex justify-between items-center group hover:bg-white/5 transition-all">
                                            <div>
                                                <div className={cn("text-[9px] font-black uppercase tracking-[0.2em] mb-1 flex items-center gap-2", s.color)}>
                                                    {s.icon} {s.label}
                                                </div>
                                                <div className="text-xl font-black text-white tracking-widest">{s.val}</div>
                                            </div>
                                            <div className="opacity-10 group-hover:opacity-100 transition-opacity">
                                                <ArrowUpRight size={20} className="text-white" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Side Intelligence Panel */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <TacticalCard variant="cyber" title={l.intel.strategicTitle}>
                        <div className="p-6 space-y-4">
                            {Object.values(currentPersonaIntel.leads).map((lead: any, i: number) => (
                                <motion.div
                                    whileHover={{ x: 5 }}
                                    key={i}
                                    className="p-5 bg-black/40 border border-white/5 rounded-3xl hover:border-amber-500/20 transition-all cursor-pointer group"
                                    onClick={() => triggerReport(lead.title)}
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="px-2 py-0.5 bg-amber-500/10 rounded text-[8px] font-black text-amber-500 tracking-[0.2em]">{l.ui.intelSignal}</div>
                                        <ArrowUpRight size={14} className="text-slate-600 group-hover:text-amber-500" />
                                    </div>
                                    <h4 className="text-[11px] font-black text-white uppercase mb-2 leading-tight">{lead.title}</h4>
                                    <p className="text-[10px] text-slate-500 italic leading-relaxed">"{lead.desc}"</p>
                                </motion.div>
                            ))}
                        </div>
                    </TacticalCard>

                    <TacticalCard variant="minimal" title={l.intel.neuralStream}>
                         <div className="h-[250px] overflow-y-auto space-y-4 p-6 custom-scrollbar">
                             {(anomalies.length > 0 ? anomalies : [
                                 'ANALYZING_HS_CODE_8471...',
                                 'DETECTION: PRICE_MANIPULATION_V4',
                                 'CROSS_REF: OFFSHORE_ENTITY_7',
                                 'TARGET_LOCKED: RED_FLAG_RAISED',
                                 'SYNTHESIZING_TACTICAL_DOSSIER...'
                             ]).map((line: any, i: number) => (
                                 <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.3 }}
                                    key={i}
                                    className="flex gap-4 border-l-2 border-amber-500/20 pl-4 py-1"
                                 >
                                     <span className="text-[9px] font-mono text-amber-500/50">[{new Date().toLocaleTimeString()}]</span>
                                     <span className="text-[10px] font-mono text-slate-400">{typeof line === 'string' ? line : line.desc}</span>
                                 </motion.div>
                             ))}
                         </div>
                    </TacticalCard>

                    <button
                        className="p-8 bg-black/40 border border-white/10 rounded-[40px] flex flex-col items-center justify-center text-center gap-4 group hover:bg-amber-500/5 hover:border-amber-500/40 transition-all"
                        title={l.intel.exportInsight}
                    >
                        <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(245,158,11,0.1)] group-hover:shadow-[0_0_50px_rgba(245,158,11,0.2)]">
                            <Download size={32} />
                        </div>
                        <div>
                            <div className="text-xs font-black text-white uppercase tracking-widest">{l.intel.exportInsight}</div>
                            <div className="text-[9px] text-slate-500 font-mono mt-1 italic">AES-256 | PDF • CSV • JSON</div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Cinematic Synthesis Overlay */}
            <AnimatePresence>
                {generatingReport && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-3xl"
                    >
                        <div className="max-w-xl w-full bg-black/80 border border-white/10 rounded-[64px] p-12 relative overflow-hidden shadow-[0_0_150px_rgba(245,158,11,0.1)]">
                             <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600"
                                    style={{ width: `${(generatingReport.stage / l.intel.stages.length) * 100}%` }}
                                />
                            </div>

                            <div className="text-center space-y-8">
                                <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border border-amber-500/30">
                                    {dossierReady ? (
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-emerald-500">
                                            <Check size={48} />
                                        </motion.div>
                                    ) : (
                                        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                                        {dossierReady ? l.intel.synthesisComplete : l.intel.dossierSynthesis}
                                    </h2>
                                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.4em]">{l.intel.target}: {generatingReport.company}</p>
                                </div>

                                <div className="space-y-2.5">
                                    {l.intel.stages.map((s, i) => (
                                        <div key={s} className="flex items-center justify-between px-6 py-2.5 bg-white/5 rounded-2xl border border-white/5">
                                            <span className={cn(
                                                "text-[9px] font-black tracking-widest uppercase",
                                                generatingReport.stage > i ? "text-emerald-400" :
                                                generatingReport.stage === i + 1 ? "text-amber-400 animate-pulse" : "text-slate-700"
                                            )}>
                                                {s}
                                            </span>
                                            {generatingReport.stage > i ? (
                                                <Check size={12} className="text-emerald-500" />
                                            ) : generatingReport.stage === i + 1 ? (
                                                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                                            ) : null}
                                        </div>
                                    ))}
                                </div>

                                {dossierReady && (
                                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="pt-4 flex flex-col gap-4">
                                        <a
                                            href={dossierUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full py-5 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black rounded-[24px] flex items-center justify-center gap-3 uppercase tracking-[0.2em] hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] transition-all transform hover:scale-105"
                                        >
                                            <FileText size={18} />
                                            ЗАВАНТАЖИТИ ТАКТИЧНЕ ДОСЬЄ
                                        </a>
                                        <button
                                            onClick={() => setGeneratingReport(null)}
                                            className="text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                                        >
                                            ЗАКРИТИ ТЕРМІНАЛ
                                        </button>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomsIntelligenceView;

const ArrowUpRight = ({ className, size }: { className?: string, size?: number }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className} width={size} height={size}>
        <path d="M7 17L17 7M17 7H7M17 7V17" />
    </svg>
);

const RefreshCw = ({ className, size }: { className?: string, size?: number }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} width={size} height={size}>
        <path d="M23 4v6h-6" />
        <path d="M1 20v-6h6" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
);
