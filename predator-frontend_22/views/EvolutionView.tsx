
import React, { useState, useEffect, useRef } from 'react';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import { 
  Orbit, RefreshCw, GitBranch, Zap, Sparkles, 
  Search, Code, Play, CheckCircle2, ShieldCheck, 
  Layers, ArrowRight, Bot, Activity, BrainCircuit,
  TrendingUp, History, Server, FileText, Pause
} from 'lucide-react';
import { EvolutionEvent, EvolutionPhase } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api'; // Real API import

const INITIAL_HISTORY: EvolutionEvent[] = [
    { id: 'evo-442', version: 'v18.5.1', type: 'BUGFIX', description: 'Fixed ETL latency in customs_connector', timestamp: '10:15', status: 'SUCCESS', metrics_impact: 'Latency -12%' },
    { id: 'evo-441', version: 'v18.5.0', type: 'FEATURE', description: 'Implemented Groq LPU support for System Brain', timestamp: '09:30', status: 'SUCCESS', metrics_impact: 'Inference Speed +400%' },
];

const METRICS_DATA = [
    { time: '08:00', efficiency: 65 },
    { time: '09:00', efficiency: 68 },
    { time: '10:00', efficiency: 72 },
    { time: '11:00', efficiency: 85 },
    { time: '12:00', efficiency: 88 },
    { time: '13:00', efficiency: 92 },
];

const EvolutionView: React.FC = () => {
    const [isAutoMode, setIsAutoMode] = useState(false);
    const [phase, setPhase] = useState<EvolutionPhase>('IDLE');
    const [logs, setLogs] = useState<string[]>([]);
    const [history, setHistory] = useState<EvolutionEvent[]>(INITIAL_HISTORY);
    const [progress, setProgress] = useState(0);
    const logEndRef = useRef<HTMLDivElement>(null);
    const isMounted = useRef(false);
    const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        isMounted.current = true;
        return () => { 
            isMounted.current = false; 
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, []);

    // Auto-scroll logs
    useEffect(() => {
        if (logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    const startPolling = () => {
        if (pollInterval.current) clearInterval(pollInterval.current);
        
        pollInterval.current = setInterval(async () => {
            if (!isMounted.current) return;
            try {
                const status = await api.getEvolutionStatus();
                setPhase(status.phase);
                setLogs(status.logs);
                setProgress(status.progress);
                
                if (!status.active && status.phase === 'COMPLETED') {
                    // Stop polling if completed and not in auto mode loop
                    if (!isAutoMode) {
                        if (pollInterval.current) clearInterval(pollInterval.current);
                        pollInterval.current = null;
                    }
                }
            } catch (e) {
                console.error("Failed to poll NAS status", e);
            }
        }, 1000);
    };

    const runEvolutionCycle = async () => {
        try {
            await api.startEvolutionCycle();
            startPolling();
        } catch (e) {
            setLogs(prev => [...prev, "[ERROR] Failed to start backend NAS cycle."]);
        }
    };

    const toggleAutoMode = () => {
        setIsAutoMode(!isAutoMode);
        if (!isAutoMode && (phase === 'IDLE' || phase === 'COMPLETED')) {
            runEvolutionCycle();
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <ViewHeader 
                title="Auto-Evolution Dashboard (AIS Loop)"
                icon={<Orbit size={20} />}
                breadcrumbs={['INTELLIGENCE', 'AUTO-EVOLUTION']}
                stats={[
                    { label: 'Cycle Status', value: phase === 'IDLE' ? 'STANDBY' : 'RUNNING', icon: <Activity size={14}/>, color: phase === 'IDLE' ? 'default' : 'success', animate: phase !== 'IDLE' },
                    { label: 'Evolutions', value: String(history.length), icon: <GitBranch size={14}/>, color: 'primary' },
                    { label: 'System Efficiency', value: '92%', icon: <TrendingUp size={14}/>, color: 'purple' },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEFT: VISUALIZER */}
                <div className="lg:col-span-2 space-y-6">
                    <TacticalCard title="Continuous Improvement Cycle (G-01 Protocol)" className="min-h-[400px] flex flex-col relative overflow-hidden" 
                        action={
                            <button 
                                onClick={toggleAutoMode}
                                className={`px-4 py-1.5 rounded text-xs font-bold flex items-center gap-2 border transition-all ${
                                    isAutoMode ? 'bg-purple-600 text-white border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-slate-900 text-slate-400 border-slate-700'
                                }`}
                            >
                                <RefreshCw size={14} className={isAutoMode ? "animate-spin" : ""} />
                                {isAutoMode ? 'AUTO-EVOLUTION: ON' : 'ENABLE AUTO-MODE'}
                            </button>
                        }
                    >
                        {/* Background */}
                        <div className="absolute inset-0 bg-slate-950/50"></div>
                        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

                        <div className="relative z-10 flex-1 flex flex-col items-center justify-center py-8">
                            
                            {/* Cycle Container */}
                            <div className="relative w-[300px] h-[300px]">
                                {/* Connecting Ring */}
                                <div className="absolute inset-0 rounded-full border-2 border-slate-800"></div>
                                {phase !== 'IDLE' && (
                                    <svg className="absolute inset-0 w-full h-full rotate-[-90deg]">
                                        <circle 
                                            cx="150" cy="150" r="148" 
                                            fill="transparent" 
                                            stroke="#3b82f6" 
                                            strokeWidth="4"
                                            strokeDasharray="930"
                                            strokeDashoffset={930 - (930 * progress / 100)}
                                            strokeLinecap="round"
                                            className="transition-all duration-1000 ease-linear"
                                        />
                                    </svg>
                                )}

                                {/* NODES */}
                                <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-300 ${phase === 'DETECTION' ? 'scale-110' : 'opacity-70'}`}>
                                    <div className={`w-12 h-12 rounded-full border-2 bg-slate-900 flex items-center justify-center ${phase === 'DETECTION' ? 'border-yellow-500 text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)]' : 'border-slate-700 text-slate-500'}`}>
                                        <Search size={20} />
                                    </div>
                                    <span className={`text-[10px] font-bold mt-1 bg-slate-950 px-2 py-0.5 rounded border ${phase === 'DETECTION' ? 'text-yellow-500 border-yellow-500' : 'text-slate-500 border-slate-800'}`}>DETECTION</span>
                                </div>

                                <div className={`absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-300 ${phase === 'BRAIN_DEBATE' ? 'scale-110' : 'opacity-70'}`}>
                                    <div className={`w-12 h-12 rounded-full border-2 bg-slate-900 flex items-center justify-center ${phase === 'BRAIN_DEBATE' ? 'border-purple-500 text-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)]' : 'border-slate-700 text-slate-500'}`}>
                                        <Sparkles size={20} />
                                    </div>
                                    <span className={`text-[10px] font-bold mt-1 bg-slate-950 px-2 py-0.5 rounded border ${phase === 'BRAIN_DEBATE' ? 'text-purple-500 border-purple-500' : 'text-slate-500 border-slate-800'}`}>BRAIN</span>
                                </div>

                                <div className={`absolute bottom-4 right-4 flex flex-col items-center transition-all duration-300 ${phase === 'NAS_CODING' ? 'scale-110' : 'opacity-70'}`}>
                                    <div className={`w-12 h-12 rounded-full border-2 bg-slate-900 flex items-center justify-center ${phase === 'NAS_CODING' ? 'border-blue-500 text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'border-slate-700 text-slate-500'}`}>
                                        <Code size={20} />
                                    </div>
                                    <span className={`text-[10px] font-bold mt-1 bg-slate-950 px-2 py-0.5 rounded border ${phase === 'NAS_CODING' ? 'text-blue-500 border-blue-500' : 'text-slate-500 border-slate-800'}`}>NAS</span>
                                </div>

                                <div className={`absolute bottom-4 left-4 flex flex-col items-center transition-all duration-300 ${phase === 'VERIFICATION' ? 'scale-110' : 'opacity-70'}`}>
                                    <div className={`w-12 h-12 rounded-full border-2 bg-slate-900 flex items-center justify-center ${phase === 'VERIFICATION' ? 'border-orange-500 text-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.5)]' : 'border-slate-700 text-slate-500'}`}>
                                        <ShieldCheck size={20} />
                                    </div>
                                    <span className={`text-[10px] font-bold mt-1 bg-slate-950 px-2 py-0.5 rounded border ${phase === 'VERIFICATION' ? 'text-orange-500 border-orange-500' : 'text-slate-500 border-slate-800'}`}>VERIFY</span>
                                </div>

                                <div className={`absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-300 ${phase === 'DEPLOYMENT' ? 'scale-110' : 'opacity-70'}`}>
                                    <div className={`w-12 h-12 rounded-full border-2 bg-slate-900 flex items-center justify-center ${phase === 'DEPLOYMENT' ? 'border-green-500 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]' : 'border-slate-700 text-slate-500'}`}>
                                        <Server size={20} />
                                    </div>
                                    <span className={`text-[10px] font-bold mt-1 bg-slate-950 px-2 py-0.5 rounded border ${phase === 'DEPLOYMENT' ? 'text-green-500 border-green-500' : 'text-slate-500 border-slate-800'}`}>GITOPS</span>
                                </div>

                                {/* Center Status */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-3xl font-display font-bold text-slate-200">v18.6</div>
                                        <div className="text-xs text-slate-500 font-mono mt-1">REAL-TIME</div>
                                        {phase !== 'IDLE' && (
                                            <div className="mt-2 text-[10px] text-primary-400 font-bold animate-pulse uppercase tracking-wider">
                                                {phase.replace('_', ' ')}...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Live Log Stream */}
                        <div className="h-32 bg-black/50 border-t border-slate-800 p-3 font-mono text-[10px] overflow-y-auto custom-scrollbar">
                            {logs.length === 0 && <div className="text-slate-600 italic">System Idle. Waiting for triggers...</div>}
                            {logs.map((log, i) => (
                                <div key={i} className="mb-1 text-slate-300 break-words animate-in slide-in-from-left-2">
                                    <span className="text-primary-500 mr-2">➜</span> {log}
                                </div>
                            ))}
                            <div ref={logEndRef} />
                        </div>
                    </TacticalCard>

                    <TacticalCard title="Evolution Impact Metrics">
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={METRICS_DATA}>
                                    <defs>
                                        <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis domain={[50, 100]} stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px' }} />
                                    <Area type="monotone" dataKey="efficiency" stroke="#10b981" fillOpacity={1} fill="url(#colorEff)" strokeWidth={2} name="System Efficiency Score" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </TacticalCard>
                </div>

                {/* RIGHT: HISTORY */}
                <div className="space-y-6">
                    <TacticalCard title="Evolution History (Versions)" action={
                        <button className="text-slate-500 hover:text-white" title="Export Log"><FileText size={14}/></button>
                    }>
                        <div className="h-[600px] overflow-y-auto custom-scrollbar p-1 space-y-4">
                            {history.map((event, idx) => (
                                <div key={event.id} className="relative pl-4 border-l-2 border-slate-800 hover:border-slate-600 transition-colors group">
                                    {/* Timeline Dot */}
                                    <div className={`absolute -left-[5px] top-0 w-2 h-2 rounded-full ${
                                        idx === 0 ? 'bg-primary-500 shadow-[0_0_8px_currentColor]' : 'bg-slate-600'
                                    }`}></div>
                                    
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="text-xs font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-700">{event.version}</div>
                                        <div className="text-[10px] text-slate-500 font-mono">{event.timestamp}</div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                            event.type === 'BUGFIX' ? 'bg-orange-900/20 text-orange-500' :
                                            event.type === 'FEATURE' ? 'bg-blue-900/20 text-blue-500' :
                                            'bg-purple-900/20 text-purple-500'
                                        }`}>
                                            {event.type}
                                        </span>
                                        <span className="text-[9px] text-success-500 font-mono">{event.status}</span>
                                    </div>

                                    <p className="text-xs text-slate-300 leading-relaxed mb-2">{event.description}</p>
                                    
                                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono bg-slate-900/50 p-1.5 rounded">
                                        <Zap size={10} className="text-yellow-500" /> Impact: <span className="text-slate-300">{event.metrics_impact}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TacticalCard>
                </div>
            </div>
        </div>
    );
};

export default EvolutionView;
