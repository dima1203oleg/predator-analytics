
import React, { useRef, useState, useEffect, Suspense } from 'react';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import {
    Zap, BrainCircuit, Activity, Scale, GitBranch,
    Search, Play, Pause, Bot, Server, RefreshCw,
    AlertOctagon, FileText, Database, Layers,
    Terminal, Bug, Radio, Command, Dna, ShieldCheck, MonitorPlay, Code,
    Maximize2, Minimize2, Cpu, Lock, EyeOff
} from 'lucide-react';
import { useSuperIntelligence } from '../context/SuperIntelligenceContext';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip, AreaChart, Area } from 'recharts';
import { Brain3D } from '../components/super/Brain3D';
import { TypewriterBlock } from '../components/super/TypewriterBlock';
import { MatrixRain } from '../components/super/MatrixRain';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';

const SuperIntelligenceView: React.FC = () => {
    const {
        isActive,
        toggleLoop,
        vetoCycle,
        injectScenario,
        stage,
        logs,
        brainNodes,
        activeAgents,
        agentGenomes,
        nasDiff,
        cycleCount,
        availableScenarios,
        arbitrationScores,
        ragArtifacts
    } = useSuperIntelligence();

    const [rightTab, setRightTab] = useState<'STREAM' | 'MATRIX' | 'EVIDENCE' | 'GENOME'>('STREAM');
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [is3DEnabled, setIs3DEnabled] = useState(true); // Default enabled, but toggleable on mobile
    const logContainerRef = useRef<HTMLDivElement>(null);
    const [loadData, setLoadData] = useState<any[]>([]);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs, rightTab]);

    useEffect(() => {
        const interval = setInterval(() => {
            setLoadData(prev => {
                const now = new Date().toLocaleTimeString();
                const load = stage === 'IDLE' ? 10 + Math.random() * 5 :
                    stage === 'DEBATE' || stage === 'NAS_IMPLEMENTATION' ? 80 + Math.random() * 20 :
                        40 + Math.random() * 20;
                return [...prev.slice(-20), { time: now, load }];
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [stage]);

    return (
        <div className={`space-y-6 animate-in fade-in duration-500 w-full mx-auto transition-all ${isFocusMode ? 'fixed inset-0 z-[100] bg-[#020617] p-0 m-0 max-w-none' : 'max-w-[1600px] pb-20'}`}>

            {!isFocusMode && (
                <ViewHeader
                    title="Суперінтелект (E-ACC Core)"
                    icon={<Zap size={20} className="icon-3d-purple" />}
                    breadcrumbs={['СИСТЕМА', 'СУПЕРІНТЕЛЕКТ', 'GOD MODE']}
                    stats={[
                        { label: 'Статус Циклу', value: isActive ? 'АКТИВНИЙ' : 'ПАУЗА', icon: <Activity size={14} />, color: isActive ? 'success' : 'warning', animate: isActive },
                        { label: 'Поточна Фаза', value: stage, icon: <BrainCircuit size={14} />, color: 'primary' },
                        { label: 'Цикл Еволюції', value: `#${cycleCount}`, icon: <GitBranch size={14} />, color: 'default' },
                    ]}
                    actions={
                        <div className="flex gap-2">
                            <button
                                onClick={toggleLoop}
                                className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 border transition-all btn-3d ${isActive
                                    ? 'bg-yellow-900/20 text-yellow-500 border-yellow-500/50 hover:bg-yellow-900/40'
                                    : 'bg-primary-600 text-white border-primary-500 hover:bg-primary-500'
                                    }`}
                            >
                                {isActive ? <Pause size={14} /> : <Play size={14} />}
                                {isActive ? 'ПАУЗА ЦИКЛУ' : 'ЗАПУСК ЕВОЛЮЦІЇ'}
                            </button>
                            {isActive && (
                                <button
                                    onClick={vetoCycle}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold flex items-center gap-2 border border-red-700 btn-3d"
                                >
                                    <AlertOctagon size={14} /> ВЕТО
                                </button>
                            )}
                        </div>
                    }
                />
            )}

            <div className={`grid gap-6 h-full transition-all ${isFocusMode ? 'grid-cols-1 p-4 h-screen' : 'grid-cols-1 lg:grid-cols-3 h-auto lg:h-[750px]'}`}>

                {/* LEFT: 3D BRAIN VISUALIZATION */}
                <div className={`${isFocusMode ? 'col-span-1 h-full' : 'lg:col-span-2'} flex flex-col gap-6 h-full transition-all order-2 lg:order-1`}>
                    <TacticalCard
                        title={isFocusMode ? undefined : "Стан Нейронної Архітектури (Live)"}
                        className={`relative overflow-hidden panel-3d transition-all ${isFocusMode ? 'h-full border-none rounded-none bg-black' : 'h-[400px] lg:flex-1'}`}
                        noPadding
                    >
                        {is3DEnabled ? (
                            <div className="absolute inset-0 bg-slate-950 touch-pan-y">
                                <Canvas camera={{ position: [0, 5, 10], fov: 40 }} dpr={[1, 1.5]}> {/* Lower DPR for performance */}
                                    <ambientLight intensity={0.4} />
                                    <pointLight position={[10, 10, 10]} intensity={1} color="#4f46e5" />
                                    <pointLight position={[-10, 5, -10]} intensity={0.5} color="#ec4899" />
                                    <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={0.5} />

                                    <Suspense fallback={null}>
                                        <Brain3D nodes={brainNodes} stage={stage} />
                                    </Suspense>
                                </Canvas>
                            </div>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-950 text-slate-500">
                                <div className="text-center">
                                    <BrainCircuit size={64} className="mx-auto mb-4 opacity-20 animate-pulse" />
                                    <p className="text-sm font-mono">3D ВІЗУАЛІЗАЦІЯ ВИМКНЕНА (LITE MODE)</p>
                                </div>
                            </div>
                        )}

                        {/* Control Buttons Overlay */}
                        <div className="absolute top-4 right-4 z-50 flex gap-2">
                            <button
                                onClick={() => setIs3DEnabled(!is3DEnabled)}
                                className="p-2 bg-slate-900/80 border border-slate-700 hover:border-blue-500 text-white rounded-lg backdrop-blur-md transition-all hover:bg-blue-600/20"
                                title={is3DEnabled ? "Вимкнути 3D (Lite Mode)" : "Увімкнути 3D"}
                            >
                                {is3DEnabled ? <EyeOff size={20} /> : <BrainCircuit size={20} />}
                            </button>
                            <button
                                onClick={() => setIsFocusMode(!isFocusMode)}
                                className="p-2 bg-slate-900/80 border border-slate-700 hover:border-blue-500 text-white rounded-lg backdrop-blur-md transition-all hover:bg-blue-600/20"
                                title={isFocusMode ? "Вийти з фокусу" : "Режим фокусу"}
                            >
                                {isFocusMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                            </button>
                        </div>

                        {/* Agents Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent pointer-events-none">
                            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide justify-center pointer-events-auto">
                                {activeAgents.map(agent => (
                                    <div key={agent.id} className={`flex flex-col items-center gap-2 p-2 rounded-lg border backdrop-blur-sm transition-all ${agent.status !== 'IDLE'
                                        ? 'bg-primary-900/40 border-primary-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] transform -translate-y-2'
                                        : 'bg-slate-900/50 border-slate-800 opacity-70'
                                        }`}>
                                        <div className={`p-2 rounded-full ${agent.role === 'SCANNER' ? 'bg-blue-500/20 text-blue-400' :
                                            agent.role === 'EXECUTOR' ? 'bg-purple-500/20 text-purple-400' :
                                                'bg-green-500/20 text-green-400'
                                            }`}>
                                            {agent.role === 'SCANNER' ? <Search size={16} /> : agent.role === 'EXECUTOR' ? <Terminal size={16} /> : <Bug size={16} />}
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-200">{agent.name}</div>
                                        {agent.status !== 'IDLE' && (
                                            <div className="text-[8px] bg-primary-500 text-slate-900 px-1.5 py-0.5 rounded font-bold animate-pulse">{agent.status}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Scenario Injection (God Mode) */}
                        {!isActive && !isFocusMode && (
                            <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-auto max-w-[200px]">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Ручний Запуск</div>
                                {availableScenarios.map(sc => (
                                    <button
                                        key={sc.id}
                                        onClick={() => injectScenario(sc.id)}
                                        className="px-3 py-2 bg-slate-900/80 hover:bg-purple-900/50 border border-slate-700 hover:border-purple-500 rounded text-xs text-left text-slate-300 hover:text-white transition-all backdrop-blur-sm flex items-center gap-2 group truncate"
                                    >
                                        <div className="w-1.5 h-1.5 shrink-0 rounded-full bg-purple-500 group-hover:shadow-[0_0_5px_#a855f7]"></div>
                                        <span className="truncate">{sc.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Overlay Controls for Focus Mode */}
                        {isFocusMode && (
                            <div className="absolute top-4 left-4 pointer-events-auto bg-black/50 p-4 rounded-xl backdrop-blur-md border border-slate-800 max-w-xs">
                                <h1 className="text-xl font-bold text-white mb-2">E-ACC CORE VIEW</h1>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs text-slate-300">
                                        <Activity size={14} className={isActive ? "text-green-500 animate-pulse" : "text-yellow-500"} />
                                        {isActive ? `Cycle #${cycleCount} Active` : "System Idle"}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-300">
                                        <BrainCircuit size={14} className="text-purple-500" />
                                        Phase: {stage}
                                    </div>
                                    <button onClick={toggleLoop} className="mt-2 w-full py-2 bg-primary-600 rounded text-xs font-bold text-white btn-3d">
                                        {isActive ? "PAUSE" : "RESUME"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </TacticalCard>
                </div>

                {/* RIGHT: INTELLIGENCE HUB (Hidden in Focus Mode) */}
                {!isFocusMode && (
                    <div className="flex flex-col gap-6 h-full order-1 lg:order-2">

                        {/* Cognitive Load */}
                        <TacticalCard title="Когнітивне Навантаження (GPU/TPU)" className="h-[150px] panel-3d">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={loadData}>
                                    <defs>
                                        <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="load" stroke="#8b5cf6" fill="url(#colorLoad)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </TacticalCard>

                        {/* Multi-Tab Panel */}
                        <TacticalCard className="flex-1 flex flex-col overflow-hidden panel-3d min-h-[400px]" noPadding>
                            <div className="flex border-b border-slate-800 bg-slate-900/50 overflow-x-auto scrollbar-hide">
                                {[
                                    { id: 'STREAM', icon: <Radio size={14} />, label: 'ПОТІК' },
                                    { id: 'MATRIX', icon: <Code size={14} />, label: 'МАТРИЦЯ' },
                                    { id: 'EVIDENCE', icon: <Database size={14} />, label: 'ДОКАЗИ' },
                                    { id: 'GENOME', icon: <Dna size={14} />, label: 'ГЕНОМ' },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setRightTab(tab.id as any)}
                                        className={`flex-1 min-w-[80px] py-3 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors border-b-2 ${rightTab === tab.id
                                            ? 'bg-slate-800 text-white border-primary-500'
                                            : 'text-slate-500 hover:text-slate-300 border-transparent'
                                            }`}
                                    >
                                        {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 relative bg-[#020617] overflow-hidden">

                                {/* TAB: STREAM (Debate & Code) */}
                                {rightTab === 'STREAM' && (
                                    <div className="absolute inset-0 flex flex-col">
                                        {/* Top: NAS Code Generation */}
                                        <div className="h-1/3 border-b border-slate-800 bg-slate-950 p-3 overflow-y-auto custom-scrollbar">
                                            <div className="text-[9px] text-blue-500 font-bold mb-1 flex items-center gap-2 sticky top-0 bg-slate-950 z-10 pb-1 border-b border-slate-900">
                                                <Terminal size={10} /> NAS COMPILER OUTPUT
                                            </div>
                                            <TypewriterBlock
                                                text={nasDiff || "// SYSTEM KERNEL INITIALIZED...\n// WAITING FOR OPTIMIZATION TARGETS...\n// AGENT SWARM: LISTENING"}
                                                isActive={stage === 'NAS_IMPLEMENTATION' || nasDiff === ''}
                                            />
                                        </div>

                                        {/* Bottom: Chat Logs */}
                                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 bg-[#0a0f1c]" ref={logContainerRef}>
                                            {logs.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-2 opacity-50">
                                                    <Activity size={32} className="animate-pulse" />
                                                    <span className="text-xs font-mono uppercase">Listening to System Bus...</span>
                                                </div>
                                            ) : (
                                                logs.map(log => {
                                                    if (log.type === 'DEBATE') {
                                                        const model = brainNodes.find(n => n.id.toUpperCase() === log.source.toUpperCase());
                                                        const isRight = ['ARBITER', 'GEMINI', 'MISTRAL', 'SYSTEM'].includes(log.source.toUpperCase());
                                                        return (
                                                            <div key={log.id} className={`flex gap-3 mb-3 animate-in slide-in-from-bottom-2 ${isRight ? 'flex-row-reverse' : ''}`}>
                                                                <div className={`w-8 h-8 rounded border flex items-center justify-center shrink-0 font-bold text-xs shadow-md ${isRight ? 'bg-blue-900/20 border-blue-500 text-blue-400' : 'bg-purple-900/20 border-purple-500 text-purple-400'
                                                                    }`}>
                                                                    {model?.avatar || log.source[0]}
                                                                </div>
                                                                <div className={`max-w-[80%] p-2.5 rounded-lg border text-xs leading-relaxed shadow-sm ${isRight ? 'bg-slate-800/50 border-slate-700 text-slate-200 rounded-tr-none' : 'bg-slate-900/50 border-slate-800 text-slate-300 rounded-tl-none'
                                                                    }`}>
                                                                    <div className="text-[9px] font-bold opacity-50 mb-1">{log.source}</div>
                                                                    {log.message}
                                                                </div>
                                                            </div>
                                                        );
                                                    } else {
                                                        return (
                                                            <div key={log.id} className="text-[10px] font-mono flex gap-2 animate-in slide-in-from-left-2 opacity-70 hover:opacity-100 transition-opacity pl-2 border-l border-slate-800">
                                                                <span className="text-slate-600 shrink-0">{log.timestamp}</span>
                                                                <span className={`font-bold shrink-0 w-16 ${log.type === 'INFO' ? 'text-blue-400' :
                                                                    log.type === 'WARN' ? 'text-yellow-400' :
                                                                        log.type === 'ERROR' ? 'text-red-500' :
                                                                            log.type === 'SUCCESS' ? 'text-green-400' :
                                                                                log.type === 'BRAIN' ? 'text-purple-400' :
                                                                                    'text-slate-300'
                                                                    }`}>{log.type}</span>
                                                                <span className="text-slate-500 shrink-0 w-20 truncate">[{log.source}]</span>
                                                                <span className="text-slate-300 truncate">{log.message}</span>
                                                            </div>
                                                        );
                                                    }
                                                })
                                            )}
                                            <div className="h-4" />
                                        </div>
                                    </div>
                                )}

                                {/* TAB: MATRIX (Visualizer) */}
                                {rightTab === 'MATRIX' && (
                                    <div className="absolute inset-0 overflow-hidden">
                                        <MatrixRain />

                                        {/* HUD Overlay */}
                                        <div className="absolute top-4 left-4 right-4 flex justify-between z-10 pointer-events-none">
                                            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 p-2 rounded-lg text-xs">
                                                <div className="text-slate-400 text-[10px] uppercase">Active Kernels</div>
                                                <div className="text-blue-400 font-mono font-bold text-lg">14</div>
                                            </div>
                                            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 p-2 rounded-lg text-xs text-right">
                                                <div className="text-slate-400 text-[10px] uppercase">Tensor Ops</div>
                                                <div className="text-purple-400 font-mono font-bold text-lg">42.8 TFLOPS</div>
                                            </div>
                                        </div>

                                        <div className="absolute bottom-4 left-4 p-3 bg-black/60 border border-green-500/30 rounded backdrop-blur-sm font-mono text-[10px] text-green-500 pointer-events-none">
                                            <div>HEAP: 0x7FF4A2...</div>
                                            <div>STACK: 0x002B1...</div>
                                            <div>THREAD: MAIN_LOOP [RUNNING]</div>
                                        </div>

                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="text-center p-6 bg-slate-900/80 border border-slate-800 rounded-xl backdrop-blur animate-pulse">
                                                <Cpu size={48} className="text-blue-500 mx-auto mb-2" />
                                                <div className="text-xl font-bold text-white">NEURAL ENGINE ACTIVE</div>
                                                <div className="text-xs text-slate-400 mt-1">Simulating 14,000 threads</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB: EVIDENCE (RAG Artifacts) */}
                                {rightTab === 'EVIDENCE' && (
                                    <div className="absolute inset-0 p-4 overflow-y-auto custom-scrollbar space-y-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">RAG Context Artifacts</span>
                                            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700">{ragArtifacts.length} FOUND</span>
                                        </div>
                                        {ragArtifacts.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-48 text-slate-600 text-xs italic opacity-50">
                                                <div className="relative w-16 h-16 mb-4">
                                                    <div className="absolute inset-0 rounded-full border-2 border-slate-800 animate-ping"></div>
                                                    <div className="absolute inset-2 rounded-full border-2 border-slate-700"></div>
                                                    <Search size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                                </div>
                                                <span className="animate-pulse">SCANNING VECTOR SPACE...</span>
                                            </div>
                                        ) : (
                                            ragArtifacts.map(art => (
                                                <div key={art.id} className="p-3 bg-slate-900 border border-slate-800 rounded hover:border-slate-600 transition-colors group relative overflow-hidden">
                                                    <div className={`absolute top-0 left-0 w-1 h-full ${art.relevance > 0.9 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                                    <div className="flex justify-between items-start mb-2 pl-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`p-1.5 rounded ${art.type === 'CODE' ? 'bg-blue-900/20 text-blue-400' :
                                                                art.type === 'LOG' ? 'bg-yellow-900/20 text-yellow-400' :
                                                                    'bg-purple-900/20 text-purple-400'
                                                                }`}>
                                                                {art.type === 'CODE' ? <Code size={12} /> : art.type === 'LOG' ? <FileText size={12} /> : <Database size={12} />}
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-200">{art.source}</span>
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[9px] text-slate-500">Relevance</span>
                                                            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                                                                <div className={`h-full ${art.relevance > 0.9 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${art.relevance * 100}%` }}></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="pl-3">
                                                        <div className="text-[10px] text-slate-300 font-mono bg-black/40 p-2 rounded border border-slate-800/50 truncate">
                                                            {art.preview}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {/* TAB: GENOME (Agent Evolution) */}
                                {rightTab === 'GENOME' && (
                                    <div className="absolute inset-0 p-4 overflow-y-auto custom-scrollbar space-y-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Agent Evolution Tree</span>
                                            <span className="text-[10px] bg-purple-900/20 text-purple-400 px-2 py-0.5 rounded border border-purple-500/30">GENETIC ALGORITHM</span>
                                        </div>
                                        {agentGenomes.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-48 text-slate-600 text-xs italic opacity-50">
                                                <Dna size={32} className="mb-2 animate-spin-slow" />
                                                <span>SEQUENCING GENOMES...</span>
                                            </div>
                                        ) : (
                                            agentGenomes.map(agent => (
                                                <div key={agent.agentId} className={`p-3 bg-slate-900 border rounded flex flex-col gap-2 transition-all ${agent.evolutionStatus === 'EVOLVING' ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'border-slate-800'
                                                    }`}>
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded bg-slate-950 border border-slate-800 ${agent.evolutionStatus === 'EVOLVING' ? 'animate-pulse text-purple-400' : 'text-slate-400'}`}>
                                                                <Dna size={16} />
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-bold text-slate-200">{agent.agentId}</div>
                                                                <div className="text-[10px] text-slate-500 font-mono">Generation {agent.generation}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${agent.evolutionStatus === 'EVOLVING' ? 'bg-purple-900/20 text-purple-400 border-purple-900/50' :
                                                                agent.evolutionStatus === 'PROMOTED' ? 'bg-green-900/20 text-green-400 border-green-900/50' :
                                                                    'bg-slate-800 text-slate-400 border-slate-700'
                                                                }`}>
                                                                {agent.evolutionStatus}
                                                            </div>
                                                            <div className="text-[9px] text-slate-500 mt-0.5 font-mono">{agent.version}</div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-1 pt-2 border-t border-slate-800/50">
                                                        <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">Capabilities</div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {agent.capabilities.map((cap, i) => (
                                                                <span key={i} className="text-[9px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300">
                                                                    {cap}
                                                                </span>
                                                            ))}
                                                            {agent.evolutionStatus === 'EVOLVING' && (
                                                                <span className="text-[9px] bg-purple-900/10 px-1.5 py-0.5 rounded border border-purple-500/30 text-purple-400 animate-pulse">
                                                                    + Mutating...
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </TacticalCard>

                        {/* Arbitration Radar - Always Visible */}
                        <TacticalCard title="Матриця Арбітражу (Логіка Рішень)" className="h-[250px] panel-3d">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                                    { subject: 'Safety', A: arbitrationScores[0]?.criteria.safety * 100 || 0, B: arbitrationScores[1]?.criteria.safety * 100 || 0, fullMark: 100 },
                                    { subject: 'Perf', A: arbitrationScores[0]?.criteria.performance * 100 || 0, B: arbitrationScores[1]?.criteria.performance * 100 || 0, fullMark: 100 },
                                    { subject: 'Cost', A: arbitrationScores[0]?.criteria.cost * 100 || 0, B: arbitrationScores[1]?.criteria.cost * 100 || 0, fullMark: 100 },
                                    { subject: 'Logic', A: arbitrationScores[0]?.criteria.logic * 100 || 0, B: arbitrationScores[1]?.criteria.logic * 100 || 0, fullMark: 100 },
                                ]}>
                                    <PolarGrid stroke="#334155" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar name={arbitrationScores[0]?.modelName || 'Model A'} dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                                    <Radar name={arbitrationScores[1]?.modelName || 'Model B'} dataKey="B" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} />
                                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px' }} />
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
