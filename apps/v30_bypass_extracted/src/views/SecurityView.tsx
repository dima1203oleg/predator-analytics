
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import { LogEntry } from '../types';
import {
    Shield, Eye, Key, Globe, Activity, Ban, Cpu, Network,
    ShieldAlert, Lock, AlertTriangle, Fingerprint, Bug,
    Skull, RefreshCw, AlertOctagon, Zap, ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GlobeThreatMap } from '../components/security/GlobeThreatMap';
import { useGlobalState } from '../context/GlobalContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { AdvancedBackground } from '../components/AdvancedBackground';

// --- VISUALIZATIONS ---

const KillChainViz = () => {
    const steps = [
        { id: 'RECON', label: 'Розвідка (Recon)', blocked: 450, color: 'bg-slate-700' },
        { id: 'WEAPON', label: 'Озброєння (Weaponization)', blocked: 120, color: 'bg-blue-900' },
        { id: 'DELIVER', label: 'Доставка (Delivery)', blocked: 85, color: 'bg-indigo-900' },
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
        <div className="h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 9, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Trust" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '10px' }} />
                </RadarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center mt-8">
                    <div className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Глобальна Довіра</div>
                    <div className="text-2xl font-bold text-blue-400 font-mono">92%</div>
                </div>
            </div>
        </div>
    );
};

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
            } catch (e) {
                // Silently handle
            }
        };
        fetchData();
        const interval = setInterval(() => {
            if (!isMounted.current) return;
            // Truth-only: no simulated WAF logs; keep empty or fetch from backend
        }, 3000);

        return () => {
            isMounted.current = false;
            clearInterval(interval);
        };
    }, []);

    const getDefconColor = (level: number) => {
        switch (level) {
            case 1: return 'bg-rose-600 shadow-[0_0_25px_rgba(225,29,72,0.4)]';
            case 2: return 'bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)]';
            case 3: return 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]';
            case 4: return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]';
            case 5: return 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.2)]';
            default: return 'bg-slate-500';
        }
    };

    return (
        <div className={`space-y-6 animate-in fade-in duration-500 pb-safe w-full max-w-[1600px] mx-auto transition-colors duration-700 min-h-screen relative z-10 ${state.defconLevel === 1 ? 'border-red-500/20' : ''}`}>
            <AdvancedBackground />

            <AnimatePresence>
                {state.defconLevel === 1 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 pointer-events-none z-0 bg-red-900/10 animate-pulse"
                    />
                )}
            </AnimatePresence>

            <ViewHeader
                title="Центр Кіберзахисту (Cyber Defense)"
                icon={<Shield size={20} className={state.defconLevel <= 2 ? "text-red-500 animate-pulse" : "icon-3d-green"} />}
                breadcrumbs={['СИСТЕМА', 'БЕЗПЕКА', 'АКТИВНИЙ ЗАХИСТ']}
                stats={[
                    { label: 'Рівень Загрози', value: state.defconLevel === 1 ? 'КРИТИЧНИЙ' : state.defconLevel === 2 ? 'ВИСОКИЙ' : 'НИЗЬКИЙ', icon: <Activity size={14} />, color: state.defconLevel <= 2 ? 'danger' : 'success' },
                    { label: 'Нульова Довіра', value: 'АКТИВНО', icon: <ShieldAlert size={14} className="icon-3d-blue" />, color: 'primary' },
                    { label: 'Події WAF', value: '14/год', icon: <Ban size={14} className="icon-3d-red" />, color: 'warning', animate: true },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">

                {/* 1. THREAT MAP */}
                <div className="lg:col-span-2">
                    <TacticalCard variant="holographic"
                        title="Глобальна Карта Загроз (Live Threat Map)"
                        className="panel-3d relative overflow-hidden h-[500px] glass-morphism"
                        noPadding
                    >
                        <div className="relative w-full h-full bg-[#020617]/50 rounded-xl overflow-hidden group">
                            {/* Grid Effect */}
                            <div className="absolute inset-0 bg-dot-matrix opacity-[0.1] pointer-events-none"></div>

                            {/* Radar Scan Effect */}
                            <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(0,180,255,0.05)_360deg)] animate-spin-slow rounded-full opacity-20 pointer-events-none w-[200%] h-[200%] top-[-50%] left-[-50%]"></div>

                            <div className="absolute inset-0">
                                <Canvas camera={{ position: [0, 0, 5], fov: 45 }} className="cursor-move">
                                    <ambientLight intensity={0.5} />
                                    <pointLight position={[10, 10, 10]} intensity={1} />
                                    <Suspense fallback={null}>
                                        <GlobeThreatMap />
                                    </Suspense>
                                    <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} enablePan={false} />
                                </Canvas>
                            </div>

                            {/* Legend Overlay */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="absolute bottom-4 left-4 p-4 bg-slate-900/80 border border-slate-700/50 rounded-xl backdrop-blur-xl pointer-events-none"
                            >
                                <div className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-widest">Ситуаційний Звіт</div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 text-[10px] text-slate-300 font-mono">
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_red]"></div> ВЕКТОР DDoS
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] text-slate-300 font-mono">
                                        <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_orange]"></div> СКАНУВАННЯ ПОРТІВ
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] text-slate-300 font-mono">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_blue]"></div> ЗАХИЩЕНИЙ ВУЗОЛ
                                    </div>
                                </div>
                            </motion.div>

                            {/* HoneyPot Status */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="absolute top-4 right-4 p-4 bg-slate-900/80 border border-slate-700/50 rounded-xl backdrop-blur-xl pointer-events-none"
                            >
                                <div className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-widest flex items-center gap-2">
                                    <Bug size={14} className="text-blue-400" /> Квантові Пастки
                                </div>
                                <div className="space-y-2 text-[10px] font-mono">
                                    <div className="flex justify-between w-32 pb-1 border-b border-white/5"><span>АЛЬФА</span><span className="text-emerald-500 font-bold">ГОТОВО</span></div>
                                    <div className="flex justify-between w-32 pb-1 border-b border-white/5"><span>БЕТА</span><span className="text-emerald-500 font-bold">ГОТОВО</span></div>
                                    <div className="flex justify-between w-32"><span>ГАММА</span><span className="text-amber-500 font-bold">АКТИВНО</span></div>
                                </div>
                            </motion.div>
                        </div>
                    </TacticalCard>
                </div>

                {/* 2. RIGHT COLUMN */}
                <div className="space-y-6">
                    <TacticalCard variant="holographic" title="Рівень Загрози (DEFCON)" className="panel-3d glass-morphism" glow={state.defconLevel === 1 ? 'red' : 'none'}>
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

                    <TacticalCard variant="holographic" title="Ланцюг Атаки (Kill Chain)" className="panel-3d glass-morphism">
                        <KillChainViz />
                    </TacticalCard>

                    <TacticalCard variant="holographic" title="Матриця Довіри (Identity Trust)" className="panel-3d glass-morphism">
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
                                        <span className="flex-1 text-rose-500/90 font-bold flex items-center gap-2">
                                            <Skull size={10} className="shrink-0" /> {log.type}
                                        </span>
                                        <span className="w-20 text-right">
                                            <span className="bg-rose-900/40 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/30 text-[9px] font-bold tracking-tighter uppercase whitespace-nowrap">
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
                                <div className="text-[9px] text-slate-600 uppercase font-bold tracking-widest mb-1">Ротація Ключів</div>
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
