
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import { LogEntry } from '../types';
import { Shield, Eye, Key, Globe, Activity, Ban, Cpu, Network, ShieldAlert, Lock, AlertTriangle, Fingerprint, Bug, Skull, RefreshCw, AlertOctagon } from 'lucide-react';
import { api } from '../services/api';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GlobeThreatMap } from '../components/security/GlobeThreatMap';
import { useGlobalState } from '../context/GlobalContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

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
                <div key={step.id} className="relative flex items-center h-10">
                    <div className="w-8 flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${step.blocked > 0 ? 'bg-green-500 shadow-[0_0_5px_lime]' : 'bg-slate-700'}`}></div>
                        {idx < steps.length - 1 && <div className="w-0.5 h-full bg-slate-800"></div>}
                    </div>
                    <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded px-3 flex justify-between items-center group hover:border-slate-700 transition-colors">
                        <span className="text-xs font-bold text-slate-300">{step.label}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500">Блоковано</span>
                            <span className={`text-xs font-mono font-bold ${step.blocked > 0 ? 'text-green-400' : 'text-slate-600'}`}>{step.blocked}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const EncryptionEntropy = () => {
    const [data, setData] = useState(Array.from({length: 20}, (_, i) => ({ time: i, val: Math.random() * 20 + 80 })));

    useEffect(() => {
        const interval = setInterval(() => {
            setData(prev => [...prev.slice(1), { time: prev[prev.length - 1].time + 1, val: Math.random() * 20 + 80 }]);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-[150px] w-full bg-slate-950/50 rounded border border-slate-800 overflow-hidden relative">
            <div className="absolute top-2 left-2 text-[10px] text-slate-500 uppercase font-bold z-10">Ентропія Шифрування</div>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorEntropy" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <Area type="step" dataKey="val" stroke="#22c55e" fill="url(#colorEntropy)" strokeWidth={2} isAnimationActive={false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

const IdentityTrustMatrix = () => {
    const data = [
        { subject: 'IP Репутація', A: 95, fullMark: 100 },
        { subject: 'Гео-Локація', A: 90, fullMark: 100 },
        { subject: 'Пристрій', A: 85, fullMark: 100 },
        { subject: 'Поведінка', A: 70, fullMark: 100 },
        { subject: 'Час доступу', A: 98, fullMark: 100 },
    ];

    return (
        <div className="h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Trust" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px' }} />
                </RadarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center mt-8">
                    <div className="text-[10px] text-slate-500 uppercase">Рейтинг Довіри</div>
                    <div className="text-xl font-bold text-blue-400 text-glow">92%</div>
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
                console.error("Failed to fetch security logs", e);
            }
        };
        fetchData();
        const interval = setInterval(() => {
            if (!isMounted.current) return;
            const newLog = {
                id: Date.now(),
                time: new Date().toLocaleTimeString(),
                ip: `185.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.11`,
                type: Math.random() > 0.5 ? 'SQL Injection' : 'Scanner Probe',
                target: '/api/v1/auth',
                action: 'BLOCKED'
            };
            setWafLogs(prev => [newLog, ...prev.slice(0, 4)]);
        }, 3500);

        return () => {
            isMounted.current = false;
            clearInterval(interval);
        };
    }, []);

    const getDefconColor = (level: number) => {
        switch(level) {
            case 1: return 'bg-red-600 shadow-[0_0_20px_red]';
            case 2: return 'bg-orange-500 shadow-[0_0_15px_orange]';
            case 3: return 'bg-yellow-500 shadow-[0_0_10px_yellow]';
            case 4: return 'bg-green-500 shadow-[0_0_10px_green]';
            case 5: return 'bg-blue-500 shadow-[0_0_10px_blue]';
            default: return 'bg-slate-500';
        }
    };

    return (
        <div className={`space-y-6 animate-in fade-in duration-500 pb-safe w-full max-w-[1600px] mx-auto transition-colors duration-700 ${state.defconLevel === 1 ? 'border-red-500/20' : ''}`}>
            
            {/* DEFCON ALARM OVERLAY (Only Level 1) */}
            {state.defconLevel === 1 && (
                <div className="fixed inset-0 pointer-events-none z-0 bg-red-900/10 animate-pulse"></div>
            )}

            <ViewHeader 
                title="Центр Кіберзахисту (Cyber Defense)"
                icon={<Shield size={20} className={state.defconLevel <= 2 ? "text-red-500 animate-pulse" : "icon-3d-green"} />}
                breadcrumbs={['СИСТЕМА', 'БЕЗПЕКА', 'АКТИВНИЙ ЗАХИСТ']}
                stats={[
                    { label: 'Рівень Загрози', value: state.defconLevel === 1 ? 'КРИТИЧНИЙ' : state.defconLevel === 2 ? 'ВИСОКИЙ' : 'НИЗЬКИЙ', icon: <Activity size={14}/>, color: state.defconLevel <= 2 ? 'danger' : 'success' },
                    { label: 'Zero Trust', value: 'АКТИВНО', icon: <ShieldAlert size={14} className="icon-3d-blue"/>, color: 'primary' },
                    { label: 'WAF Події', value: '14/год', icon: <Ban size={14} className="icon-3d-red"/>, color: 'warning', animate: true },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
                
                {/* 1. THREAT MAP */}
                <div className="lg:col-span-2">
                    <TacticalCard title="Глобальна Карта Загроз (Live Threat Map)" className="panel-3d relative overflow-hidden h-[500px]" noPadding>
                        <div className="relative w-full h-full bg-[#020617] rounded-lg overflow-hidden group shadow-inner touch-none" style={{ touchAction: 'none' }}>
                            {/* Grid Effect */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
                            
                            {/* Radar Scan Effect */}
                            <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(0,255,0,0.1)_360deg)] animate-spin-slow rounded-full opacity-10 pointer-events-none w-[200%] h-[200%] top-[-50%] left-[-50%]"></div>

                            <Canvas camera={{ position: [0, 0, 5], fov: 45 }} className="cursor-move">
                                <ambientLight intensity={0.5} />
                                <pointLight position={[10, 10, 10]} intensity={1} />
                                <Suspense fallback={null}>
                                    <GlobeThreatMap />
                                </Suspense>
                                <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} enablePan={false} />
                            </Canvas>

                            {/* Legend Overlay */}
                            <div className="absolute bottom-4 left-4 p-3 bg-slate-900/90 border border-slate-800 rounded-lg backdrop-blur-sm pointer-events-none">
                                <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase">Активні Загрози</div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[9px] text-slate-300">
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> DDoS Атака (Об'ємна)
                                    </div>
                                    <div className="flex items-center gap-2 text-[9px] text-slate-300">
                                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div> Сканування Портів
                                    </div>
                                    <div className="flex items-center gap-2 text-[9px] text-slate-300">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div> HQ (Захищено)
                                    </div>
                                </div>
                            </div>
                            
                            {/* Interceptor Drones Status */}
                            <div className="absolute top-4 right-4 p-3 bg-slate-900/90 border border-slate-800 rounded-lg backdrop-blur-sm pointer-events-none">
                                <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase flex items-center gap-2">
                                    <Bug size={12} className="text-blue-500"/> HoneyPot Мережа
                                </div>
                                <div className="space-y-1 text-[9px] font-mono">
                                    <div className="flex justify-between w-32"><span>Node-Alpha</span><span className="text-green-500">ACTIVE</span></div>
                                    <div className="flex justify-between w-32"><span>Node-Beta</span><span className="text-green-500">ACTIVE</span></div>
                                    <div className="flex justify-between w-32"><span>Node-Gamma</span><span className="text-yellow-500">ENGAGED</span></div>
                                </div>
                            </div>
                        </div>
                    </TacticalCard>
                </div>

                {/* 2. RIGHT COLUMN: STATUS & KILL CHAIN */}
                <div className="space-y-6">
                    <TacticalCard title="Рівень Загрози (DEFCON)" className="panel-3d" glow={state.defconLevel === 1 ? 'red' : 'none'}>
                        <div className="flex flex-col items-center justify-center p-4">
                            <div className="w-full flex flex-col-reverse gap-2">
                                {[1, 2, 3, 4, 5].map((level) => (
                                    <button 
                                        key={level}
                                        onClick={() => setDefcon(level as any)}
                                        className={`
                                            relative w-full py-2 rounded border font-bold text-xs tracking-widest transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden group
                                            ${state.defconLevel === level 
                                                ? `${getDefconColor(level)} text-white border-transparent transform scale-105` 
                                                : 'bg-slate-900 border-slate-700 text-slate-500 hover:bg-slate-800'
                                            }
                                        `}
                                    >
                                        <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
                                        {level === 1 && <AlertTriangle size={14} className={state.defconLevel === 1 ? "animate-bounce" : ""} />}
                                        DEFCON {level}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </TacticalCard>

                    <TacticalCard title="Перехоплення Ланцюга Атаки (Kill Chain)" className="panel-3d">
                        <KillChainViz />
                    </TacticalCard>
                    
                    <TacticalCard title="Матриця Довіри" className="panel-3d">
                        <IdentityTrustMatrix />
                    </TacticalCard>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
                {/* WAF Logs - Terminal Style */}
                <TacticalCard title="WAF: Блокування Атак (Активний Захист)" glow="red" className="panel-3d">
                    <div className="bg-black p-2 rounded border border-slate-800 h-[250px] overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-1 relative shadow-inner">
                        <div className="sticky top-0 bg-black/90 text-slate-500 border-b border-slate-800 pb-1 mb-1 z-10 flex justify-between px-2">
                            <span>ЧАС</span>
                            <span>ДЖЕРЕЛО</span>
                            <span>ВЕКТОР</span>
                            <span>ДІЯ</span>
                        </div>
                        {wafLogs.map((log) => (
                            <div key={log.id} className="flex justify-between hover:bg-red-900/20 px-2 py-0.5 transition-colors group cursor-default">
                                <span className="text-slate-500">{log.time}</span>
                                <span className="text-slate-300">{log.ip}</span>
                                <span className="text-red-400 font-bold">{log.type}</span>
                                <span className="text-red-500 group-hover:underline font-bold">{log.action}</span>
                            </div>
                        ))}
                        <div className="animate-pulse text-red-500 pt-2 px-2 flex items-center gap-1">
                            <Activity size={10} /> Моніторинг трафіку...
                        </div>
                    </div>
                </TacticalCard>

                {/* Encryption Stats */}
                <TacticalCard title="Стан Шифрування (Наживо)" className="panel-3d">
                    <EncryptionEntropy />
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="p-3 bg-slate-900 rounded border border-slate-800 flex items-center justify-between">
                            <div>
                                <div className="text-[10px] text-slate-500 uppercase">Алгоритм</div>
                                <div className="text-xs font-bold text-slate-200">AES-256-GCM</div>
                            </div>
                            <Lock size={16} className="text-green-500" />
                        </div>
                        <div className="p-3 bg-slate-900 rounded border border-slate-800 flex items-center justify-between">
                            <div>
                                <div className="text-[10px] text-slate-500 uppercase">Ротація Ключів</div>
                                <div className="text-xs font-bold text-slate-200">через 24год 12хв</div>
                            </div>
                            <RefreshCw size={16} className="text-blue-500" />
                        </div>
                    </div>
                </TacticalCard>
            </div>
        </div>
    );
};

export default SecurityView;
