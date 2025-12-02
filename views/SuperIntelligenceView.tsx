
import React, { useRef, useState, useEffect } from 'react';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import { 
  Zap, BrainCircuit, Activity, Scale, GitBranch, Code, 
  Search, Play, Pause, Bot, Server, RefreshCw,
  ShieldCheck, AlertOctagon, FileText, Database, Layers, BarChart3,
  Cpu, Terminal, Bug, Radio, Command, Sparkles, Network, Dna, Lock, Unlock, History, Clock,
  MonitorPlay, GitMerge
} from 'lucide-react';
import { useSuperIntelligence } from '../context/SuperIntelligenceContext';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip, AreaChart, Area, XAxis, YAxis } from 'recharts';
import { BrainVisualizer } from '../components/super/BrainVisualizer';
import { TypewriterBlock } from '../components/super/TypewriterBlock';
import { MatrixRain } from '../components/super/MatrixRain';

// --- MOCK HISTORY DATA ---
const evoHistory = [
    { id: 'EVO-1041', ver: 'v18.6.1', type: 'BUGFIX', desc: 'Patched race condition in agent communication layer.', impact: 'Stability +5%' },
    { id: 'EVO-1040', ver: 'v18.6.0', type: 'FEATURE', desc: 'Enabled multi-modal input for Gemini 2.0 Flash.', impact: 'Capability +15%' },
    { id: 'EVO-1039', ver: 'v18.5.9', type: 'OPTIMIZATION', desc: 'Reduced Docker image size by 40% via Distroless.', impact: 'Boot Time -2s' },
    { id: 'EVO-1038', ver: 'v18.5.8', type: 'SECURITY', desc: 'Hardened K3s ingress controller with ModSecurity.', impact: 'Security Score 99/100' },
];

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
        currentScenario,
        availableScenarios,
        arbitrationScores,
        ragArtifacts
    } = useSuperIntelligence();

    const [rightTab, setRightTab] = useState<'STREAM' | 'MATRIX' | 'EVIDENCE' | 'GENOME' | 'HISTORY'>('STREAM');
    const logContainerRef = useRef<HTMLDivElement>(null);
    const brainContainerRef = useRef<HTMLDivElement>(null);
    const [loadData, setLoadData] = useState<any[]>([]); // Cognitive Load Chart

    // Auto-scroll logs
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs, rightTab]);

    // Simulate Cognitive Load based on Stage
    useEffect(() => {
        const interval = setInterval(() => {
            setLoadData(prev => {
                const baseLoad = stage === 'IDLE' ? 10 : 
                                 stage === 'DEBATE' ? 85 : 
                                 stage === 'ARBITRATION' ? 95 : 
                                 stage === 'NAS_IMPLEMENTATION' ? 60 : 30;
                
                const variation = Math.random() * 10 - 5;
                const newPoint = { time: Date.now(), value: Math.min(100, Math.max(5, baseLoad + variation)) };
                return [...prev.slice(-20), newPoint];
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [stage]);

    // --- VISUAL COMPONENTS ---

    const PipelineConnector = ({ active, vertical = true }: { active: boolean, vertical?: boolean }) => (
        <div className={`flex justify-center relative shrink-0 transition-all duration-500 ${vertical ? 'h-8 w-full' : 'w-8 h-full items-center hidden lg:flex'}`}>
            {/* Base Line */}
            <div className={`${vertical ? 'w-0.5 h-full' : 'h-0.5 w-full'} bg-slate-800 shadow-[0_0_10px_rgba(0,0,0,0.5)]`}></div>
            
            {/* Active Glow */}
            {active && (
                <div className={`absolute ${vertical ? 'top-0 left-1/2 -translate-x-1/2 w-1 h-full' : 'left-0 top-1/2 -translate-y-1/2 h-1 w-full'} bg-cyan-500/50 blur-[2px]`}></div>
            )}

            {/* Data Particles */}
            {active && (
                <div className={`absolute bg-white rounded-full z-10 ${vertical ? 'w-1 h-3 left-1/2 -translate-x-1/2 animate-[float_0.5s_infinite_linear]' : 'h-1 w-3 top-1/2 -translate-y-1/2 animate-[data-stream_0.5s_infinite_linear]'}`} style={{boxShadow: '0 0 10px cyan'}}></div>
            )}
        </div>
    );

    const StageStatus = ({ label, active, icon: Icon, colorClass }: any) => (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500 backdrop-blur-md ${
            active 
            ? `bg-${colorClass}-900/40 border-${colorClass}-500 text-white shadow-[0_0_20px_rgba(0,0,0,0.4)] scale-105` 
            : 'bg-slate-900/50 border-slate-800 text-slate-500 opacity-60'
        }`}>
            <Icon size={14} className={active ? `text-${colorClass}-400 animate-pulse` : ''} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-32 relative min-h-screen w-full max-w-[1600px] mx-auto">
            
            {/* Spotlight Overlay for Arbitration */}
            <div className={`fixed inset-0 bg-black/80 z-40 transition-opacity duration-1000 pointer-events-none ${stage === 'ARBITRATION' ? 'opacity-100' : 'opacity-0'}`}></div>

            {/* Background Ambience */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_#1e1b4b_0%,_#020617_60%)] pointer-events-none -z-10 opacity-70"></div>
            <div className="fixed inset-0 bg-grid-pattern opacity-[0.05] pointer-events-none -z-10"></div>

            <ViewHeader 
                title="Єдиний Центр Еволюції (ECS v2.0)"
                icon={<Zap size={20} className="text-yellow-400 icon-3d-amber" />}
                breadcrumbs={['INTELLIGENCE', 'ECS CORE', 'MASTER CONTROL']}
                stats={[
                    { label: 'Статус Циклу', value: isActive ? 'АКТИВНИЙ' : 'ОЧІКУВАННЯ', icon: <Activity size={14}/>, color: isActive ? 'success' : 'warning', animate: isActive },
                    { label: 'Версія Системи', value: `v18.6.${cycleCount}`, icon: <GitBranch size={14}/>, color: 'primary' },
                    { label: 'Протокол', value: 'TRUTH-ONLY', icon: <Scale size={14}/>, color: 'purple' },
                ]}
                actions={
                    isActive && (
                        <button 
                            onClick={vetoCycle}
                            className="bg-red-600/90 hover:bg-red-500 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.4)] animate-pulse-fast transition-all border border-red-400/50 w-full md:w-auto justify-center btn-3d z-50 relative"
                        >
                            <AlertOctagon size={16} /> <span className="hidden md:inline">АВАРІЙНЕ ВЕТО</span><span className="md:hidden">ВЕТО</span>
                        </button>
                    )
                }
            />

            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 min-h-[800px]">
                
                {/* --- LEFT COLUMN: THE EVOLUTION PIPELINE (8 COLS) --- */}
                <div className="lg:col-span-8 flex flex-col gap-4 md:gap-6 relative z-30">
                    
                    {/* LEVEL 1: SENSORY CORTEX (AGENTS) */}
                    <TacticalCard className={`relative overflow-hidden transition-all duration-500 border-l-4 panel-3d ${stage === 'DISCOVERY' ? 'border-l-yellow-500 bg-slate-900/60 shadow-[0_0_30px_rgba(234,179,8,0.1)]' : 'border-l-slate-700 opacity-90'}`}>
                        <div className="flex justify-between items-center mb-4 md:mb-6">
                            <StageStatus label="Рівень 1: Сенсорна Мережа" active={stage === 'DISCOVERY'} icon={Search} colorClass="yellow" />
                            {stage === 'DISCOVERY' && <div className="text-[10px] text-yellow-500 font-mono animate-pulse font-bold flex items-center gap-2"><Network size={12} className="animate-spin" />СКАНУВАННЯ...</div>}
                        </div>
                        
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 md:gap-4">
                            {activeAgents.filter(a => a.role === 'SCANNER').map(agent => (
                                <div key={agent.id} className="flex flex-col items-center group cursor-help transition-all duration-300">
                                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl border flex items-center justify-center bg-slate-950/80 backdrop-blur-sm relative transition-all duration-300 icon-3d ${
                                        agent.status === 'SCANNING' ? 'border-yellow-500 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)] scale-110' : 
                                        agent.status === 'TRANSMITTING' ? 'border-cyan-500 text-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-110' :
                                        'border-slate-800 text-slate-600'
                                    }`}>
                                        <Bot size={20} />
                                        {agent.status !== 'IDLE' && (
                                            <div className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500"></span>
                                            </div>
                                        )}
                                    </div>
                                    <span className={`text-[9px] font-mono mt-2 text-center leading-tight transition-colors ${agent.status !== 'IDLE' ? 'text-white font-bold' : 'text-slate-500'}`}>{agent.name}</span>
                                    {/* Activity Bar */}
                                    <div className="h-0.5 w-8 bg-slate-800 rounded mt-1 overflow-hidden">
                                        <div className={`h-full transition-all duration-300 ${agent.status !== 'IDLE' ? 'bg-yellow-500 w-full animate-[shimmer_1s_infinite]' : 'w-0'}`}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TacticalCard>

                    <PipelineConnector active={stage === 'DISCOVERY'} />

                    {/* LEVEL 2: COGNITIVE CORE (BRAIN) */}
                    <TacticalCard 
                        className={`relative overflow-hidden transition-all duration-500 border-l-4 min-h-[300px] md:min-h-[380px] panel-3d ${stage === 'DEBATE' || stage === 'ARBITRATION' ? 'border-l-purple-500 bg-slate-900/60 shadow-[0_0_40px_rgba(168,85,247,0.15)] z-50' : 'border-l-slate-700 opacity-90'}`}
                    >
                        {/* Background Hologram Grid */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
                        
                        <div className="flex justify-between items-center mb-2 relative z-10">
                            <StageStatus label="Рівень 2: Когнітивне Ядро" active={stage === 'DEBATE' || stage === 'ARBITRATION'} icon={BrainCircuit} colorClass="purple" />
                            <div className="flex gap-2">
                                {stage === 'DEBATE' && <span className="px-2 py-0.5 rounded bg-purple-900/30 border border-purple-500/50 text-[10px] text-purple-300 font-bold uppercase animate-pulse shadow-[0_0_10px_#a855f7]">Дебати</span>}
                                {stage === 'ARBITRATION' && <span className="px-2 py-0.5 rounded bg-white/10 border border-white/30 text-[10px] text-white font-bold uppercase animate-pulse shadow-[0_0_10px_white]">Арбітраж</span>}
                            </div>
                        </div>

                        <div className="relative h-[250px] md:h-[320px] z-10 w-full flex items-center justify-center" ref={brainContainerRef}>
                            <div className="w-[300px] md:w-[400px] h-full">
                                <BrainVisualizer nodes={brainNodes} stage={stage} onInject={() => injectScenario(0)} />
                            </div>
                        </div>
                    </TacticalCard>

                    <PipelineConnector active={stage === 'ARBITRATION' || stage === 'NAS_IMPLEMENTATION'} />

                    {/* LEVEL 3: EXECUTION (NAS & DEVOPS) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {/* NAS Terminal */}
                        <TacticalCard className={`flex flex-col h-[350px] transition-all duration-500 border-l-4 panel-3d ${stage === 'NAS_IMPLEMENTATION' ? 'border-l-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.15)]' : 'border-l-slate-700 opacity-90'}`}>
                            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800">
                                <StageStatus label="NAS: Neural Autocoder" active={stage === 'NAS_IMPLEMENTATION'} icon={Terminal} colorClass="blue" />
                                {stage === 'NAS_IMPLEMENTATION' && <RefreshCw size={14} className="text-blue-400 animate-spin" />}
                            </div>
                            
                            {/* CRT Screen Effect */}
                            <div className="flex-1 bg-[#050a14] rounded-lg border border-slate-800 p-3 font-mono text-[10px] md:text-xs relative overflow-hidden shadow-inner group scanline">
                                <div className="absolute inset-0 bg-blue-500/5 animate-pulse pointer-events-none z-10"></div>
                                {/* Matrix Rain Effect when active */}
                                {stage === 'NAS_IMPLEMENTATION' && <MatrixRain />}
                                
                                <div className="relative z-30 h-full overflow-y-auto custom-scrollbar">
                                    <div className="text-slate-500 mb-2">// Generating patch based on Arbiter Spec #{cycleCount}...</div>
                                    {nasDiff ? (
                                        <TypewriterBlock text={nasDiff} isActive={stage === 'NAS_IMPLEMENTATION'} />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-700 gap-2">
                                            <Cpu size={32} className="opacity-30" />
                                            <span className="text-xs uppercase tracking-widest text-slate-600">Очікування Вердикту...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TacticalCard>

                        {/* Deployment Status */}
                        <TacticalCard className={`flex flex-col h-[350px] transition-all duration-500 border-l-4 panel-3d ${stage === 'DEPLOYMENT' ? 'border-l-green-500 shadow-[0_0_30px_rgba(34,197,94,0.15)]' : 'border-l-slate-700 opacity-90'}`}>
                            <div className="flex justify-between items-center mb-3">
                                <StageStatus label="GitOps Deployment" active={stage === 'DEPLOYMENT'} icon={Server} colorClass="green" />
                                {stage === 'DEPLOYMENT' && <Activity size={14} className="text-green-400 animate-pulse" />}
                            </div>

                            <div className="flex-1 flex flex-col gap-2 overflow-y-auto custom-scrollbar mb-3">
                                {activeAgents.filter(a => a.role === 'EXECUTOR' || a.role === 'TESTER').map(agent => (
                                    <div key={agent.id} className="bg-slate-950/50 p-3 rounded border border-slate-800 flex justify-between items-center group hover:border-slate-600 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${agent.status !== 'IDLE' ? 'bg-green-900/30 text-green-400' : 'bg-slate-900 text-slate-600'}`}>
                                                {agent.id.includes('TEST') ? <Bug size={14}/> : <GitBranch size={14}/>}
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-300">{agent.name}</div>
                                                <div className="text-[9px] text-slate-500 font-mono">{agent.role}</div>
                                            </div>
                                        </div>
                                        <div className={`text-[9px] px-2 py-1 rounded font-bold uppercase transition-all ${
                                            agent.status === 'IDLE' ? 'bg-slate-900 text-slate-600' : 
                                            'bg-green-900/20 text-green-400 border border-green-900/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                                        }`}>
                                            {agent.status}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-auto pt-4 border-t border-slate-800 shrink-0 z-50">
                                <button 
                                    onClick={toggleLoop}
                                    className={`w-full py-4 rounded-lg font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all uppercase tracking-widest btn-3d shadow-xl ${
                                        isActive 
                                        ? 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white' 
                                        : 'bg-gradient-to-r from-primary-600 to-cyan-600 hover:from-primary-500 hover:to-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] btn-3d-blue'
                                    }`}
                                >
                                    {isActive ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                                    {isActive ? 'Зупинити Еволюцію' : 'Запустити ECS Цикл'}
                                </button>
                            </div>
                        </TacticalCard>
                    </div>

                </div>

                {/* --- RIGHT COLUMN: INTELLIGENCE FEED (4 COLS) --- */}
                <div className="lg:col-span-4 flex flex-col gap-4 h-full relative z-30">
                    
                    {/* Active Context - Sticky on Mobile */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 shadow-lg backdrop-blur-md relative overflow-hidden order-first panel-3d">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary-500 to-purple-500"></div>
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                            <Radio size={12} className={isActive ? "text-red-500 animate-pulse" : ""} /> Активний Контекст
                        </h4>
                        
                        {currentScenario ? (
                            <div className="space-y-3 animate-in fade-in duration-300">
                                <div className="text-sm font-bold text-white leading-tight">{currentScenario.name}</div>
                                <div className="text-[11px] text-slate-400 bg-black/30 p-2 rounded border-l-2 border-yellow-500 font-mono leading-relaxed">
                                    "{currentScenario.triggerMsg}"
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                                    <span className="text-[10px] text-slate-500 uppercase">Вердикт</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-all duration-300 ${
                                        currentScenario.verdict ? 'text-purple-400 bg-purple-900/10 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.3)]' : 'text-slate-500 bg-slate-900 border-slate-700'
                                    }`}>
                                        {currentScenario.verdict ? 'ПРИЙНЯТО' : 'ОЧІКУВАННЯ...'}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-20 text-slate-600 text-xs italic">
                                <Command size={24} className="mb-2 opacity-20"/>
                                Система в режимі очікування
                            </div>
                        )}
                    </div>

                    {/* Scenario Injection (God Mode) */}
                    {!isActive && (
                        <TacticalCard title="Симуляція Загроз (God Mode)" className="border-dashed border-slate-700 bg-slate-900/30 panel-3d">
                            <div className="grid grid-cols-1 gap-2">
                                {availableScenarios.map(s => (
                                    <button 
                                        key={s.id}
                                        onClick={() => injectScenario(s.id)}
                                        className="group relative flex items-center justify-between p-3 rounded bg-slate-950 border border-slate-800 hover:border-primary-500 transition-all hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] overflow-hidden btn-3d"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/0 via-primary-900/10 to-primary-900/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                        <div className="flex items-center gap-3 relative z-10">
                                            <div className="p-1.5 rounded bg-slate-900 text-slate-500 group-hover:text-primary-400 group-hover:bg-primary-900/20 transition-colors">
                                                {s.type === 'SECURITY' ? <ShieldCheck size={14}/> : s.type === 'PERFORMANCE' ? <Activity size={14}/> : s.type === 'META_IMPROVEMENT' ? <Dna size={14}/> : <Server size={14}/>}
                                            </div>
                                            <div className="text-left">
                                                <div className="text-[11px] font-bold text-slate-300 group-hover:text-white">{s.name}</div>
                                                <div className="text-[9px] text-slate-500 font-mono">{s.type} EVENT</div>
                                            </div>
                                        </div>
                                        <Play size={12} className="text-slate-600 group-hover:text-primary-400 transition-colors relative z-10"/>
                                    </button>
                                ))}
                            </div>
                        </TacticalCard>
                    )}
                    
                    {/* Cognitive Load Monitor */}
                    <div className="h-[120px] bg-slate-950/50 border border-slate-800 rounded p-2 relative overflow-hidden panel-3d">
                        <div className="absolute top-2 left-2 text-[9px] font-bold text-slate-500 uppercase z-10 flex items-center gap-1">
                            <Activity size={10} className={isActive ? 'text-purple-500 animate-pulse' : ''}/> 
                            Cognitive Load
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={loadData}>
                                <defs>
                                    <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="value" stroke="#a855f7" fill="url(#loadGrad)" strokeWidth={2} isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Multi-Tab Info Panel */}
                    <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-lg flex flex-col overflow-hidden shadow-xl min-h-[300px] panel-3d">
                        <div className="flex border-b border-slate-800 bg-slate-950/50 overflow-x-auto scrollbar-hide">
                            <button onClick={() => setRightTab('STREAM')} className={`flex-1 min-w-[80px] py-3 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2 ${rightTab === 'STREAM' ? 'border-primary-500 text-white bg-slate-800/50' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Журнал</button>
                            <button onClick={() => setRightTab('MATRIX')} className={`flex-1 min-w-[80px] py-3 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2 ${rightTab === 'MATRIX' ? 'border-purple-500 text-white bg-slate-800/50' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Матриця</button>
                            <button onClick={() => setRightTab('GENOME')} className={`flex-1 min-w-[80px] py-3 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2 ${rightTab === 'GENOME' ? 'border-green-500 text-white bg-slate-800/50' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Геном</button>
                            <button onClick={() => setRightTab('EVIDENCE')} className={`flex-1 min-w-[80px] py-3 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2 ${rightTab === 'EVIDENCE' ? 'border-yellow-500 text-white bg-slate-800/50' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Докази</button>
                            <button onClick={() => setRightTab('HISTORY')} className={`flex-1 min-w-[80px] py-3 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2 ${rightTab === 'HISTORY' ? 'border-blue-500 text-white bg-slate-800/50' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Історія</button>
                        </div>

                        <div className="flex-1 overflow-hidden relative bg-black/20">
                            {/* STREAM TAB */}
                            {rightTab === 'STREAM' && (
                                <div 
                                    ref={logContainerRef}
                                    className="absolute inset-0 overflow-y-auto custom-scrollbar p-3 space-y-3 scroll-smooth"
                                >
                                    {[...logs].map((log) => (
                                        <div key={log.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <div className={`flex items-center gap-2 mb-1`}>
                                                <span className="text-[9px] font-mono text-slate-600">{log.timestamp}</span>
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                                    log.type === 'BRAIN' ? 'bg-purple-900/10 text-purple-400 border-purple-500/20' :
                                                    log.type === 'AGENT' ? 'bg-yellow-900/10 text-yellow-400 border-yellow-500/20' :
                                                    log.type === 'NAS' ? 'bg-blue-900/10 text-blue-400 border-blue-500/20' :
                                                    log.type === 'SUCCESS' ? 'bg-green-900/10 text-green-400 border-green-500/20' :
                                                    'bg-slate-900 text-slate-400 border-slate-700'
                                                }`}>
                                                    {log.source}
                                                </span>
                                            </div>
                                            <div className={`text-[11px] leading-relaxed pl-3 border-l-2 py-1 ${
                                                log.type === 'ERROR' ? 'border-red-500 text-red-200' : 
                                                log.type === 'SUCCESS' ? 'border-green-500 text-slate-300' : 
                                                log.type === 'BRAIN' ? 'border-purple-500 text-slate-300' :
                                                'border-slate-700 text-slate-400'
                                            }`}>
                                                {log.message}
                                            </div>
                                        </div>
                                    ))}
                                    {logs.length === 0 && <div className="text-center text-slate-600 text-xs mt-10 opacity-50">Журнал порожній.</div>}
                                </div>
                            )}

                            {/* MATRIX TAB */}
                            {rightTab === 'MATRIX' && (
                                <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-4">
                                    <div className="h-full flex flex-col">
                                        <div className="h-[200px] w-full shrink-0 mb-4">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart outerRadius="70%" data={[
                                                    { subject: 'Безпека', A: arbitrationScores[0]?.criteria.safety * 100, B: arbitrationScores[1]?.criteria.safety * 100, fullMark: 100 },
                                                    { subject: 'Швидкість', A: arbitrationScores[0]?.criteria.performance * 100, B: arbitrationScores[1]?.criteria.performance * 100, fullMark: 100 },
                                                    { subject: 'Вартість', A: arbitrationScores[0]?.criteria.cost * 100, B: arbitrationScores[1]?.criteria.cost * 100, fullMark: 100 },
                                                    { subject: 'Логіка', A: arbitrationScores[0]?.criteria.logic * 100, B: arbitrationScores[1]?.criteria.logic * 100, fullMark: 100 },
                                                ]}>
                                                    <PolarGrid stroke="#334155" />
                                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false}/>
                                                    <Radar name={arbitrationScores[0]?.modelName || 'Model A'} dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                                                    <Radar name={arbitrationScores[1]?.modelName || 'Model B'} dataKey="B" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                                                    <Legend wrapperStyle={{ fontSize: '10px' }}/>
                                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px' }}/>
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="space-y-2">
                                            {arbitrationScores.map((score, i) => (
                                                <div key={i} className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-[#8884d8]' : 'bg-[#82ca9d]'}`}></div>
                                                        <span className="text-[10px] text-slate-300 font-bold">{score.modelName}</span>
                                                    </div>
                                                    <span className="text-xs font-mono font-bold text-white">{(score.totalScore * 100).toFixed(1)}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* AGENT GENOME TAB */}
                            {rightTab === 'GENOME' && (
                                <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-3 space-y-3">
                                    {agentGenomes.map((genome, i) => (
                                        <div key={i} className={`p-3 rounded border transition-all ${
                                            genome.evolutionStatus === 'EVOLVING' ? 'bg-purple-900/20 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]' : 'bg-slate-950/50 border-slate-800'
                                        }`}>
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Dna size={14} className={genome.evolutionStatus === 'EVOLVING' ? "text-purple-400 animate-spin-slow icon-3d-purple" : "text-slate-500 icon-3d"} />
                                                    <span className="text-xs font-bold text-slate-200">{genome.agentId}</span>
                                                </div>
                                                <span className={`text-[10px] font-mono ${genome.evolutionStatus === 'EVOLVING' ? 'text-purple-400 font-bold' : 'text-primary-400'}`}>
                                                    {genome.evolutionStatus === 'EVOLVING' ? 'MUTATING...' : genome.version}
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-900 rounded-full mb-2 overflow-hidden">
                                                <div className={`h-full ${genome.evolutionStatus === 'EVOLVING' ? 'bg-purple-500 animate-pulse' : 'bg-green-500'}`} style={{ width: `${(genome.generation / 30) * 100}%` }}></div>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {genome.capabilities.map((cap, idx) => (
                                                    <span key={idx} className="text-[8px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">{cap}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* EVIDENCE TAB */}
                            {rightTab === 'EVIDENCE' && (
                                <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-3 space-y-3">
                                    {ragArtifacts.length > 0 ? ragArtifacts.map((art, i) => (
                                        <div key={i} className="bg-slate-950/50 p-3 rounded border border-slate-800 hover:border-yellow-500/30 transition-colors group">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    {art.type === 'CODE' ? <Code size={12} className="text-blue-400 icon-3d-blue"/> : 
                                                     art.type === 'LOG' ? <FileText size={12} className="text-slate-400 icon-3d"/> : 
                                                     <Database size={12} className="text-purple-400 icon-3d-purple"/>}
                                                    <span className="text-[10px] font-bold text-slate-300 truncate max-w-[150px] group-hover:text-white transition-colors">{art.source}</span>
                                                </div>
                                                <span className="text-[9px] text-yellow-500 font-mono bg-yellow-900/10 px-1.5 py-0.5 rounded border border-yellow-900/30">
                                                    {(art.relevance * 100).toFixed(0)}% REL
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-mono bg-black/40 p-2 rounded border border-white/5 truncate">
                                                {art.preview}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs gap-2">
                                            <Layers size={24} className="opacity-20 icon-3d"/>
                                            <p>RAG контекст порожній.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                             {/* HISTORY TAB (Consolidated) */}
                             {rightTab === 'HISTORY' && (
                                <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-3 space-y-3">
                                    {evoHistory.map((evo, i) => (
                                        <div key={i} className="relative pl-4 border-l-2 border-slate-800 group">
                                            <div className="absolute -left-[5px] top-0 w-2 h-2 bg-primary-500 rounded-full"></div>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-bold text-white">{evo.ver}</span>
                                                <span className="text-[9px] text-slate-500 font-mono">{evo.id}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${evo.type === 'BUGFIX' ? 'bg-orange-900/20 text-orange-400' : 'bg-blue-900/20 text-blue-400'}`}>
                                                    {evo.type}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-400">{evo.desc}</p>
                                            <div className="text-[9px] text-green-500 mt-1 flex items-center gap-1"><Zap size={8}/> {evo.impact}</div>
                                        </div>
                                    ))}
                                    <div className="text-center pt-4">
                                        <span className="text-[10px] text-slate-600 flex items-center justify-center gap-1"><History size={10} /> Повна історія змін (Git)</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default SuperIntelligenceView;
