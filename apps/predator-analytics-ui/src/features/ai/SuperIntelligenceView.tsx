
import React, { useRef, useState, useEffect, Suspense } from 'react';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import {
    Zap, BrainCircuit, Activity, Scale, GitBranch,
    Search, Play, Pause, Bot, Server, RefreshCw,
    AlertOctagon, FileText, Database, Layers,
    Terminal, Bug, Radio, Command, Dna, ShieldCheck, MonitorPlay, Code,
    Maximize2, Minimize2, Cpu, Lock, EyeOff, ChevronRight, Sparkles
} from 'lucide-react';
import { useSuperIntelligence } from '@/hooks/useSuperIntelligence';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip, AreaChart, Area } from 'recharts';
import { Brain3D } from '@/components/super/Brain3D';
import { TypewriterBlock } from '@/components/super/TypewriterBlock';
import { MatrixRain } from '@/components/super/MatrixRain';
import { HoloContainer } from '@/components/HoloContainer';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { TruthLedgerTerminal } from '@/components/super/TruthLedgerTerminal';
import { useBackendStatus } from '@/hooks/useBackendStatus';

const SuperIntelligenceView: React.FC = () => {
    const { isOffline, nodeSource, healingProgress } = useBackendStatus();
    const {
        isActive, toggleLoop, vetoCycle, injectScenario, stage, logs, brainNodes, activeAgents,
        agentGenomes, nasDiff, cycleCount, availableScenarios, arbitrationScores, ragArtifacts
    } = useSuperIntelligence();

    useEffect(() => {
        if (isOffline) {
            window.dispatchEvent(new CustomEvent('predator-error', {
                detail: {
                    service: 'SuperIntelligence',
                    message: 'АВТОНОМНИЙ РЕЖИМ ЯД А (CORE_DECOUPLING). Зв\'язок з центральним NVIDIA-кластером перервано.',
                    severity: 'warning',
                    timestamp: new Date().toISOString(),
                    code: 'CORE_DECOUPLING'
                }
            }));
        } else {
            window.dispatchEvent(new CustomEvent('predator-error', {
                detail: {
                    service: 'SuperIntelligence',
                    message: 'ПОТОКОВА СИНХ ОНІЗАЦІЯ ЯД А УСПІШНА (CORE_SYNC_ELITE). Повний доступ до GPU-ферми.',
                    severity: 'info',
                    timestamp: new Date().toISOString(),
                    code: 'CORE_SYNC_ELITE'
                }
            }));
        }
    }, [isOffline]);

    const [rightTab, setRightTab] = useState<'STREAM' | 'MATRIX' | 'EVIDENCE' | 'GENOME'>('STREAM');
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [is3DEnabled, setIs3DEnabled] = useState(true);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const [loadData, setLoadData] = useState<any[]>([]);

    useEffect(() => { if (logContainerRef.current) logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight; }, [logs, rightTab]);

    useEffect(() => {
        const interval = setInterval(() => {
            setLoadData(prev => {
                const load = stage === 'IDLE' ? 10 : stage === 'DEBATE' || stage === 'NAS_IMPLEMENTATION' ? 85 : 45;
                return [...prev.slice(-20), { time: new Date().toLocaleTimeString(), load }];
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [stage]);

    return (
        <div className={`space-y-8 animate-in fade-in duration-500 w-full mx-auto relative z-10 ${isFocusMode ? 'fixed inset-0 z-[100] bg-slate-950 p-0 m-0 max-w-none backdrop-blur-3xl' : 'max-w-[1600px] pb-24'}`}>
            {!isFocusMode && (
                <ViewHeader
                    title="СУПЕ ІНТЕЛЕКТ (ЯДРО GLM-5.1)"
                    icon={<Zap size={20} className="icon-3d-yellow" />}
                    breadcrumbs={['СИНАПСИС', 'СИСТЕМА', 'СУВЕ ЕННИЙ_ШІ']}
                    stats={[
                        { label: 'Статус', value: isActive ? 'АКТИВНИЙ' : 'ГОТОВИЙ', icon: <Activity size={14} />, color: isActive ? 'success' : 'warning', animate: isActive },
                        {
                            label: 'Джерело Node',
                            value: nodeSource,
                            icon: <Server size={14} />,
                            color: isOffline ? 'warning' : 'gold'
                        },
                        { label: 'Версія ELITE', value: 'v58.2', icon: <Cpu size={14} />, color: 'primary' },
                    ]}
                    actions={
                        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
                            <motion.button
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    if (availableScenarios.length > 0) {
                                        injectScenario(availableScenarios[0].id);
                                    }
                                }}
                                className="flex-1 sm:flex-none px-6 py-2.5 bg-white/5 border border-white/10 text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-all shadow-xl group"
                            >
                                <Sparkles size={14} className="group-hover:rotate-12 transition-transform text-rose-400" />
                                {availableScenarios[0]?.name || 'СЦЕНА ІЙ'}
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={toggleLoop}
                                className={`flex-1 sm:flex-none px-8 py-2.5 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all ${isActive ? 'bg-rose-600 shadow-[0_0_25px_#e11d48]' : 'bg-blue-600 shadow-[0_0_25px_#2563eb]'} text-white`}
                            >
                                {isActive ? <Pause size={14} /> : <Play size={14} />}
                                {isActive ? 'ЗУПИНИТИ ЦИКЛ' : 'ЗАПУСК МАТ ИЦІ'}
                            </motion.button>
                        </div>
                    }
                />
            )}

            <div className={`grid gap-6 h-full transition-all ${isFocusMode ? 'grid-cols-1 p-8 min-h-screen' : 'grid-cols-1 lg:grid-cols-3 lg:h-[800px]'}`}>
                <div className={`${isFocusMode ? 'col-span-1 h-full' : 'lg:col-span-2'} flex flex-col gap-6 h-full order-2 lg:order-1`}>
                    <HoloContainer className={`relative group ${isFocusMode ? 'h-full border-none rounded-none' : 'h-[350px] sm:h-[450px] lg:flex-1 rounded-3xl overflow-hidden glass-morphism panel-3d border border-white/5'}`} >
                        {is3DEnabled ? (
                            <div className="absolute inset-0 bg-slate-950/40">
                                <Canvas camera={{ position: [0, 6, 12], fov: 35 }} dpr={[1, 2]}>
                                    <Stars radius={150} depth={60} count={2000} factor={5} saturation={0} fade speed={0.8} />
                                    <ambientLight intensity={0.5} /><pointLight position={[15, 15, 15]} intensity={1.5} color="#6366f1" />
                                    <Suspense fallback={null}><Brain3D nodes={brainNodes} stage={stage} /></Suspense>
                                </Canvas>
                            </div>
                        ) : <MatrixRain />}

                        <div className="absolute top-6 left-8 z-40 bg-slate-900/60 border border-white/10 px-4 py-2 rounded-2xl backdrop-blur-xl flex items-center gap-3 shadow-2xl">
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7]" />
                            <span className="text-[10px] font-extrabold text-white uppercase tracking-widest">{is3DEnabled ? 'Візуалізація Нейронної Матриці' : 'Потік Матриці Ядра'}</span>
                        </div>

                        <div className="absolute top-6 right-8 z-50 flex gap-3">
                            {[
                                { id: '3d', icon: is3DEnabled ? EyeOff : BrainCircuit, action: () => setIs3DEnabled(!is3DEnabled) },
                                { id: 'focus', icon: isFocusMode ? Minimize2 : Maximize2, action: () => setIsFocusMode(!isFocusMode) },
                            ].map(btn => (
                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} key={btn.id} onClick={btn.action} className="p-3 bg-slate-900/80 border border-white/10 text-white rounded-xl backdrop-blur-xl hover:border-purple-500 transition-all shadow-xl">
                                    <btn.icon size={20} />
                                </motion.button>
                            ))}
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 bg-gradient-to-t from-slate-950/90 to-transparent pointer-events-none">
                            <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 scrollbar-hide justify-start sm:justify-center pointer-events-auto px-4">
                                {activeAgents.map(agent => (
                                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} key={agent.id} className={`flex flex-col items-center gap-3 p-4 rounded-2xl border backdrop-blur-2xl transition-all ${agent.status !== 'IDLE' ? 'bg-yellow-600/10 border-yellow-500 shadow-yellow-500/20 -translate-y-4' : 'bg-slate-900/40 border-white/5 opacity-40'}`}>
                                        <div className={`p-3 rounded-xl ${agent.role === 'SCANNER' ? 'bg-blue-500/20 text-blue-500' : agent.role === 'EXECUTOR' ? 'bg-purple-500/20 text-purple-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                            {agent.role === 'SCANNER' ? <Search size={18} /> : agent.role === 'EXECUTOR' ? <Terminal size={18} /> : <Bug size={18} />}
                                        </div>
                                        <div className="text-[10px] font-black text-white uppercase tracking-tighter">{agent.name}</div>
                                        {agent.status !== 'IDLE' && (
                                            <div className="text-[8px] bg-yellow-500 text-white px-2 py-0.5 rounded-lg font-black animate-pulse uppercase tracking-widest">
                                                {agent.status === 'SCANNING' ? 'СКАНУВАННЯ' :
                                                    agent.status === 'TRANSMITTING' ? 'ПЕ ЕДАЧА' :
                                                        agent.status === 'CODING' ? 'КОДУВАННЯ' :
                                                            agent.status === 'TESTING' ? 'ФАЗА ТЕСТУ' :
                                                                agent.status === 'DEPLOYING' ? 'ДЕПЛОЙ' : agent.status}
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </HoloContainer>
                </div>

                {!isFocusMode && (
                    <div className="flex flex-col gap-8 h-full order-1 lg:order-2">
                        <TacticalCard variant="holographic" title="Когнітивна Синхронізація (GPU Кластер)" className="h-[180px] glass-morphism panel-3d">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={loadData}>
                                    <defs><linearGradient id="siLoad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs>
                                    <Area type="monotone" dataKey="load" stroke="#6366f1" fill="url(#siLoad)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </TacticalCard>

                        <TacticalCard variant="holographic" title="СИНАПСИС" className="flex-1 flex flex-col overflow-hidden glass-morphism panel-3d p-0" noPadding>
                            <div className="flex bg-slate-950/50 backdrop-blur-xl border-b border-white/5 p-1 gap-1">
                                {[
                                    { id: 'STREAM', icon: Radio, label: 'Потік' },
                                    { id: 'EVIDENCE', icon: Database, label: 'Артефакти RAG' },
                                    { id: 'GENOME', icon: Dna, label: 'Геноми AI' },
                                ].map(tab => (
                                    <button
                                        key={tab.id} onClick={() => setRightTab(tab.id as any)}
                                        className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 rounded-2xl transition-all ${rightTab === tab.id ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        <tab.icon size={16} /> {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 relative bg-slate-950/80 overflow-hidden">
                                <AnimatePresence mode="wait">
                                    {rightTab === 'STREAM' && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="stream" className="absolute inset-0 flex flex-col p-4">
                                            <div className="flex-1 overflow-hidden">
                                                <TruthLedgerTerminal />
                                            </div>
                                            <div className="mt-4 h-[25%] border border-white/5 bg-slate-900/30 p-4 rounded-[20px] overflow-hidden">
                                                <div className="text-[9px] text-yellow-400 font-black mb-2 flex items-center gap-3"><Terminal size={12} /> КОМПІЛЯТО  ЯД А NAS</div>
                                                <div className="text-[10px] font-mono whitespace-pre opacity-80">
                                                     <TypewriterBlock text={nasDiff || "--- ОЧІКУВАННЯ НЕЙ ОННОГО СИНТЕЗУ ---"} isActive={stage === 'NAS_IMPLEMENTATION' || nasDiff === ''} />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {rightTab === 'EVIDENCE' && (
                                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key="evidence" className="absolute inset-0 p-6 space-y-4 overflow-y-auto">
                                            <div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4">Доказова База (RAG)</div>
                                            {ragArtifacts.map((art: any, i: number) => (
                                                <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-yellow-500/30 transition-all group">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="p-2 bg-yellow-500/10 text-yellow-400 rounded-lg"><FileText size={14} /></div>
                                                        <div className="text-[11px] font-black text-white uppercase tracking-tighter truncate">{art.source}</div>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 leading-relaxed italic group-hover:text-slate-200">"{art.content.substring(0, 150)}..."</p>
                                                    <div className="mt-3 flex justify-between items-center text-[8px] font-black text-slate-600 uppercase tracking-widest">
                                                        <span> елевантність: {(art.relevance * 100).toFixed(1)}%</span>
                                                        <span className="text-yellow-500">Vector ID: {art.id}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {ragArtifacts.length === 0 && <div className="h-full flex flex-col items-center justify-center opacity-20 py-20"><Database size={48} /><span className="text-[10px] font-black mt-4 uppercase tracking-[0.3em]">База Знань Порожня</span></div>}
                                        </motion.div>
                                    )}

                                    {rightTab === 'GENOME' && (
                                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} key="genome" className="absolute inset-0 p-6 space-y-4 overflow-y-auto">
                                            <div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4">Генетичний Код Агентів</div>
                                            {agentGenomes.map((gen: any, i: number) => (
                                                <div key={i} className="p-5 bg-gradient-to-br from-white/5 to-transparent border border-white/5 rounded-3xl relative overflow-hidden group">
                                                    <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ duration: 5, repeat: Infinity, ease: 'linear' }} className="absolute top-0 left-0 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-30" />
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-yellow-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20"><Dna size={20} /></div>
                                                            <div>
                                                                <div className="text-xs font-black text-white uppercase tracking-tighter">{gen.agentName}</div>
                                                                <div className="text-[8px] text-yellow-400 font-mono tracking-[0.2em] uppercase">Архітектура: {gen.baseModel}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-[8px] text-slate-600 font-black uppercase mb-1">Пристосованість</div>
                                                            <div className="text-sm font-black text-emerald-400 font-mono">{(gen.fitnessScore * 100).toFixed(1)}%</div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {Object.entries(gen.traits).map(([trait, val]: any) => (
                                                            <div key={trait} className="bg-black/40 p-2 rounded-xl border border-white/5 flex justify-between items-center group-hover:border-yellow-500/20 transition-colors">
                                                                <span className="text-[7px] text-slate-500 uppercase font-black">{trait}</span>
                                                                <span className="text-[8px] font-mono text-white">{(val * 100).toFixed(0)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </TacticalCard>

                        <TacticalCard variant="holographic" title="Арбітраж  ішень" className="h-[250px] glass-morphism panel-3d">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={[
                                    { s: 'Безпека', A: arbitrationScores[0]?.criteria.safety * 100 || 0, B: arbitrationScores[1]?.criteria.safety * 100 || 0 },
                                    { s: 'Логіка', A: arbitrationScores[0]?.criteria.logic * 100 || 0, B: arbitrationScores[1]?.criteria.logic * 100 || 0 },
                                    { s: 'Вартість', A: arbitrationScores[0]?.criteria.cost * 100 || 0, B: arbitrationScores[1]?.criteria.cost * 100 || 0 },
                                    { s: 'Швидкість', A: arbitrationScores[0]?.criteria.performance * 100 || 0, B: arbitrationScores[1]?.criteria.performance * 100 || 0 },
                                ]}>
                                    <PolarGrid stroke="#ffffff05" /><PolarAngleAxis dataKey="s" tick={{ fill: '#64748b', fontSize: 9, fontWeight: 'bold' }} />
                                    <Radar name="Арбітр v45" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                                    <Radar name="Ядро Системи" dataKey="B" stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} />
                                    <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '9px' }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </TacticalCard>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuperIntelligenceView;
