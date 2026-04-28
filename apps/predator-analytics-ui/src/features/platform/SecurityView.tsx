import React, { useState, useEffect, useRef, Suspense } from 'react';
import { cn } from '@/utils/cn';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { LogEntry } from '@/types';
import {
    Shield, Activity, Ban,
    ShieldAlert, Lock, AlertTriangle, Bug,
    Skull, RefreshCw, ShieldCheck, Brain, Globe
} from 'lucide-react';
import { api } from '@/services/api';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GlobeThreatMap } from '@/components/security/GlobeThreatMap';
import { useGlobalState } from '@/context/GlobalContext';
import { ResponsiveContainer, AreaChart, Area, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import '@/styles/SecurityView.css';

// --- VISUALIZATIONS ---

const KillChainViz = () => {
    const steps = [
        { id: 'RECON', label: '� озвідка (Recon)', blocked: 450, color: 'bg-slate-700' },
        { id: 'WEAPON', label: 'Озброєння (Weaponization)', blocked: 120, color: 'bg-blue-900' },
        { id: 'DELIVER', label: 'Доставка (Delivery)', blocked: 85, color: 'bg-yellow-900' },
        { id: 'EXPLOIT', label: 'Експлуатація (Exploit)', blocked: 12, color: 'bg-purple-900' },
        { id: 'INSTALL', label: 'Інсталяція (Install)', blocked: 0, color: 'bg-red-900' },
        { id: 'C2', label: 'Командування (C2)', blocked: 0, color: 'bg-red-900' },
        { id: 'ACTION', label: 'Дія на об\'єктах', blocked: 0, color: 'bg-red-900' }
    ];

    return (
        <div className="space-y-2">
            {steps.map((step, idx) => (
                <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative flex items-center h-10"
                >
                    <div className="w-8 flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full z-10 ${step.blocked > 0 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-slate-700'}`}></div>
                        {idx < steps.length - 1 && <div className="w-0.5 h-full bg-slate-800"></div>}
                    </div>
                    <div className="flex-1 bg-slate-900/40 border border-slate-800/50 rounded-lg px-3 flex justify-between items-center group hover:border-slate-700 transition-all hover:bg-slate-900/60">
                        <span className="text-xs font-bold text-slate-400 group-hover:text-slate-200 transition-colors">{step.label}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] text-slate-600 uppercase font-bold">Заблоковано</span>
                            <span className={`text-xs font-mono font-bold ${step.blocked > 0 ? 'text-green-400' : 'text-slate-600'}`}>{step.blocked}</span>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

const EncryptionEntropy = () => {
    const [data, setData] = useState(Array.from({ length: 20 }, (_, i) => ({ time: i, val: 90 })));

    useEffect(() => {
        const interval = setInterval(() => {
            setData(prev => [...prev.slice(1), { time: prev[prev.length - 1].time + 1, val: 90 }]);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-[150px] w-full bg-slate-950/50 rounded-xl border border-slate-800 overflow-hidden relative">
            <div className="absolute top-3 left-3 text-[10px] text-slate-500 uppercase font-bold z-10 flex items-center gap-2">
                <ShieldCheck size={12} className="text-emerald-500" /> Ентропія Шифрування
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorEntropy" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area type="step" dataKey="val" stroke="#10b981" fill="url(#colorEntropy)" strokeWidth={2} isAnimationActive={false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

const IdentityTrustMatrix = () => {
    const data = [
        { subject: 'IP Rep', A: 95, fullMark: 100 },
        { subject: 'Geo', A: 90, fullMark: 100 },
        { subject: 'Device', A: 85, fullMark: 100 },
        { subject: 'Behavior', A: 70, fullMark: 100 },
        { subject: 'Time', A: 98, fullMark: 100 },
    ];

    return (
        <div className="h-[200px] w-full relative group">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="rgba(255,255,255,0.05)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 8, fontWeight: 'black', fontFamily: 'monospace' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Trust" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(2, 6, 23, 0.95)', borderColor: 'rgba(59, 130, 246, 0.4)', borderRadius: '12px', fontSize: '10px', color: '#fff' }} />
                </RadarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none group-hover:scale-110 transition-transform">
                <div className="text-[8px] text-slate-500 uppercase font-black tracking-[0.3em]">Trust_Score</div>
                <div className="text-3xl font-black text-blue-400 font-mono tracking-tighter">92.4</div>
            </div>
        </div>
    );
};

const ActiveDefenses = () => (
    <div className="grid grid-cols-2 gap-3">
        {[
            { label: 'Deep Packet Insp.', status: 'ON', icon: Shield, color: 'text-emerald-400' },
            { label: 'Neural WAF', status: 'ACTIVE', icon: Brain, color: 'text-purple-400' },
            { label: 'IP Reputation', status: 'SYNC', icon: Globe, color: 'text-blue-400' },
            { label: 'Quantum Rot.', status: 'PENDING', icon: RefreshCw, color: 'text-amber-400' },
        ].map(def => (
            <div key={def.label} className="p-3 bg-white/5 border border-white/5 rounded-xl flex flex-col gap-1">
                <div className="flex items-center justify-between">
                    <def.icon size={12} className={def.color} />
                    <span className={`text-[8px] font-black uppercase ${def.status === 'PENDING' ? 'text-amber-500' : 'text-emerald-500'}`}>{def.status}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{def.label}</span>
            </div>
        ))}
    </div>
);

const SecurityView: React.FC = () => {
    const { state, setDefcon } = useGlobalState();
    const [wafLogs, setWafLogs] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<LogEntry[]>([]);
    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        const fetchData = async () => {
            try {
                const [wafData, auditData] = await Promise.all([
                    api.getWafLogs(),
                    api.getSecurityLogs()
                ]);
                if (isMounted.current) {
                    setWafLogs(wafData);
                    setAuditLogs(auditData);
                }
            } catch (_) {
                // Silently handle
            }
        };
        fetchData();
        return () => { isMounted.current = false; };
    }, []);

    const getDefconColor = (level: number) => {
        switch (level) {
            case 1: return 'bg-amber-600 shadow-[0_0_25px_rgba(225,29,72,0.4)]';
            case 2: return 'bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)]';
            case 3: return 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]';
            case 4: return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]';
            case 5: return 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.2)]';
            default: return 'bg-slate-500';
        }
    };

    return (
        <div className={cn(
            "space-y-8 animate-in fade-in duration-500 w-full max-w-[1700px] mx-auto min-h-screen relative z-10 p-4 lg:p-8",
            state.defconLevel === 1 && "combat-hud-grid overflow-hidden"
        )}>
            <AdvancedBackground />

            {/* Combat HUD Overlays */}
            <AnimatePresence>
                {state.defconLevel === 1 && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 pointer-events-none z-[100] border-[20px] border-amber-600/10 mix-blend-overlay"
                        />
                        <div className="fixed top-24 left-8 z-[100] font-mono text-amber-500 text-[10px] space-y-2 pointer-events-none uppercase tracking-widest opacity-60">
                            <div>COMBAT_SESSION_ACTIVE</div>
                            <div>ENCRYPTION: QUANTUM_SECURE</div>
                            <div>THREAT_VECTORS: MONITORING</div>
                        </div>
                        <div className="fixed bottom-8 right-8 z-[100] font-mono text-amber-500 text-[10px] text-right pointer-events-none uppercase tracking-widest opacity-60">
                            <div>REGION: EUR-CENTER-01</div>
                            <div>DEFENSE_RINGS: 4/4_ACTIVE</div>
                            <div className="animate-pulse">SYSTEM_OVERLOAD_PREVENTION: ON</div>
                        </div>
                    </>
                )}
            </AnimatePresence>

            <ViewHeader
                title="Центр Кіберзахисту (Cyber Defense)"
                icon={<Shield size={20} className={state.defconLevel <= 2 ? "text-red-500 animate-pulse" : "icon-3d-green"} />}
                breadcrumbs={['СИСТЕМА', 'БЕЗПЕКА', 'АКТИВНИЙ ЗАХИСТ']}
                stats={[
                    { label: '� івень Загрози', value: state.defconLevel === 1 ? 'К� ИТИЧНИЙ' : state.defconLevel === 2 ? 'ВИСОКИЙ' : 'НИЗЬКИЙ', icon: <Activity size={14} />, color: state.defconLevel <= 2 ? 'danger' : 'success' },
                    { label: 'Нульова Довіра', value: 'АКТИВНО', icon: <ShieldAlert size={14} className="icon-3d-blue" />, color: 'primary' },
                    { label: 'Події WAF', value: '14/год', icon: <Ban size={14} className="icon-3d-red" />, color: 'warning', animate: true },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">

                <div className="lg:col-span-2 space-y-6">
                    <TacticalCard variant="holographic"
                        title="Глобальна Карта Загроз"
                        className="panel-3d relative overflow-hidden h-[500px] bg-slate-900/60"
                        noPadding
                    >
                        <div className="relative w-full h-full bg-black/20 rounded-[32px] overflow-hidden group">
                            <div className="scanline" />
                            <div className="absolute inset-0 dot-grid opacity-[0.2] pointer-events-none" />

                            <div className="absolute inset-0">
                                <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                                    <ambientLight intensity={0.5} />
                                    <pointLight position={[10, 10, 10]} intensity={1} />
                                    <Suspense fallback={null}>
                                        <GlobeThreatMap />
                                    </Suspense>
                                    <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} enablePan={false} />
                                </Canvas>
                            </div>

                            <div className="absolute bottom-6 left-6 p-4 bg-black/60 border border-white/10 rounded-2xl backdrop-blur-xl pointer-events-none">
                                <div className="text-[8px] font-black text-slate-500 mb-3 uppercase tracking-[0.3em]">Situation_Report</div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 text-[10px] text-slate-300 font-mono font-bold">
                                         <div className="dynamic-color-pulse pulse-red" /> DDoS_VECTOR
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] text-slate-300 font-mono font-bold">
                                         <div className="dynamic-color-pulse pulse-amber" /> PORT_SCAN
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TacticalCard>

                    <TacticalCard variant="holographic" title="Ланцюг Атаки (Kill Chain)" className="panel-3d bg-slate-900/40 backdrop-blur-xl border-white/5">
                        <KillChainViz />
                    </TacticalCard>
                </div>

                {/* 2. RIGHT COLUMN */}
                <div className="space-y-6">
                    <TacticalCard variant="holographic" title="� івень Загрози (DEFCON)" className="panel-3d glass-morphism" glow={state.defconLevel === 1 ? 'red' : 'none'}>
                        <div className="flex flex-col items-center justify-center p-2">
                            <div className="w-full flex flex-col-reverse gap-2">
                                {[1, 2, 3, 4, 5].map((level) => (
                                    <motion.button
                                        key={level}
                                        whileHover={{ scale: 1.02, x: 4 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setDefcon(level as any)}
                                        className={`
                                            relative w-full py-2.5 rounded-lg border font-bold text-[11px] tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden group uppercase
                                            ${state.defconLevel === level
                                                ? `${getDefconColor(level)} text-white border-transparent`
                                                : 'bg-slate-950/50 border-slate-800 text-slate-600 hover:text-slate-400 hover:border-slate-700'
                                            }
                                        `}
                                    >
                                        {level === 1 && <AlertTriangle size={14} className={state.defconLevel === 1 ? "animate-bounce" : ""} />}
                                        DEFCON {level}
                                        {state.defconLevel === level && (
                                            <motion.div layoutId="defconDot" className="w-1.5 h-1.5 bg-white rounded-full ml-2 shadow-[0_0_8px_white]" />
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </TacticalCard>

                    <TacticalCard variant="holographic" title="Активний Захист" className="panel-3d bg-slate-900/40 backdrop-blur-xl border-white/5">
                        <ActiveDefenses />
                    </TacticalCard>

                    <TacticalCard variant="holographic" title="Матриця Довіри" className="panel-3d bg-slate-900/40 backdrop-blur-xl border-white/5">
                        <IdentityTrustMatrix />
                    </TacticalCard>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
                {/* WAF Logs */}
                <TacticalCard variant="holographic" title="Перехоплення WAF НАЖИВО" glow="red" className="panel-3d glass-morphism p-0 overflow-hidden" noPadding>
                    <div className="bg-black/80 p-4 h-[300px] font-mono text-[11px] space-y-1 relative">
                        <div className="sticky top-0 bg-black py-2 text-slate-500 border-b border-white/5 mb-3 z-10 flex justify-between px-2 font-bold tracking-widest uppercase text-[10px]">
                            <span className="w-20">Час</span>
                            <span className="w-32">IP Джерела</span>
                            <span className="flex-1">Вектор Загрози</span>
                            <span className="w-20 text-right">Дія</span>
                        </div>
                        <div className="overflow-y-auto h-[220px] custom-scrollbar pr-2">
                            <AnimatePresence initial={false}>
                                {wafLogs.map((log) => (
                                    <motion.div
                                        key={log.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex justify-between items-center hover:bg-white/5 px-2 py-1.5 rounded transition-colors group cursor-default border-b border-white/5"
                                    >
                                        <span className="w-20 text-slate-600">{log.time}</span>
                                        <span className="w-32 text-slate-400">{log.ip}</span>
                                        <span className="flex-1 text-amber-500/90 font-bold flex items-center gap-2">
                                            <Skull size={10} className="shrink-0" /> {log.type}
                                        </span>
                                        <span className="w-20 text-right">
                                            <span className="bg-amber-900/40 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30 text-[9px] font-bold tracking-tighter uppercase whitespace-nowrap">
                                                ЗАБЛОКОВАНО
                                            </span>
                                        </span>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                        <div className="absolute bottom-2 left-4 text-emerald-500/50 text-[9px] flex items-center gap-2 font-bold uppercase tracking-[0.2em]">
                            <RefreshCw size={10} className="animate-spin" /> Глибоке сканування пакетів активне
                        </div>
                    </div>
                </TacticalCard>

                {/* Encryption Stats */}
                <TacticalCard variant="holographic" title="Статус Квантової Стійкості" className="panel-3d glass-morphism">
                    <EncryptionEntropy />
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between group"
                        >
                            <div>
                                <div className="text-[9px] text-slate-600 uppercase font-bold tracking-widest mb-1">Алгоритм</div>
                                <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">AES-256-XTS</div>
                            </div>
                            <Lock size={18} className="text-emerald-500/50 group-hover:text-emerald-500 transition-colors" />
                        </motion.div>
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between group"
                        >
                            <div>
                                <div className="text-[9px] text-slate-600 uppercase font-bold tracking-widest mb-1">� отація Ключів</div>
                                <div className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors">Цикл 24г</div>
                            </div>
                            <RefreshCw size={18} className="text-blue-500/50 group-hover:text-blue-500 transition-colors" />
                        </motion.div>
                    </div>
                </TacticalCard>
            </div>
        </div>
    );
};

export default SecurityView;
