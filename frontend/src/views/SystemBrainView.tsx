
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import { 
  BrainCircuit, Scale, Zap, Cpu, Settings, Users, Gavel, MessageSquare
} from 'lucide-react';
import { BrainModel, DebateMessage, DebatePhase } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Brain3D } from '../components/super/Brain3D';

// --- LLM COUNCIL CONFIG ---
const INITIAL_COUNCIL: BrainModel[] = [
    { id: 'm1', name: 'Gemini 2.0 Pro', provider: 'Google', avatar: 'G', status: 'IDLE', color: '#3b82f6', role: 'Architect' }, 
    { id: 'm2', name: 'DeepSeek R1', provider: 'DeepSeek', avatar: 'D', status: 'IDLE', color: '#a855f7', role: 'Critic' }, 
    { id: 'm3', name: 'Claude 3.5', provider: 'Anthropic', avatar: 'C', status: 'IDLE', color: '#eab308', role: 'Optimist' }, 
    { id: 'm4', name: 'Llama 3', provider: 'Meta', avatar: 'L', status: 'IDLE', color: '#ef4444', role: 'Security' }, 
];

const CHAIRMAN: BrainModel = {
    id: 'arbiter', name: 'Gemini 3 Ultra', provider: 'Google DeepMind', avatar: 'A', status: 'IDLE', color: '#ffffff', role: 'CHAIRMAN'
};

const SystemBrainView: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [phase, setPhase] = useState<DebatePhase>('IDLE');
    const [models, setModels] = useState<BrainModel[]>(INITIAL_COUNCIL);
    const [chairman, setChairman] = useState<BrainModel>(CHAIRMAN);
    const [messages, setMessages] = useState<DebateMessage[]>([]);
    const [progress, setProgress] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showAutoML, setShowAutoML] = useState(false);
    const isMounted = useRef(false);

    // Initialize with heartbeat data
    const [automlData, setAutomlData] = useState<{iter: number, score: number}[]>(
        Array.from({length: 20}, (_, i) => ({ iter: i, score: 50 + Math.sin(i)*5 }))
    );

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        if(scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Constant background heartbeat for chart
    useEffect(() => {
        const interval = setInterval(() => {
            if (!isMounted.current) return;
            setAutomlData(prev => {
                const nextIter = prev[prev.length - 1].iter + 1;
                let newScore = 50;
                
                if (showAutoML) {
                    // Growth during active AutoML
                    const lastScore = prev[prev.length - 1].score;
                    newScore = Math.min(99, lastScore + Math.random() * 5);
                } else {
                    // Heartbeat when idle
                    newScore = 50 + Math.sin(nextIter * 0.5) * 5 + (Math.random() * 2);
                }
                
                return [...prev.slice(1), { iter: nextIter, score: newScore }];
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [showAutoML]);

    const addMessage = (msg: DebateMessage) => {
        if (isMounted.current) {
            setMessages(prev => [...prev, msg]);
        }
    };

    const updateModelStatus = (id: string, status: BrainModel['status'], thought?: string) => {
        if (!isMounted.current) return;
        if (id === 'arbiter') {
            setChairman(prev => ({ ...prev, status, currentThought: thought }));
        } else {
            setModels(prev => prev.map(m => m.id === id ? { ...m, status, currentThought: thought } : m));
        }
    };

    const startDebate = () => {
        if (!topic.trim()) return;
        setPhase('PROPOSING');
        setMessages([]);
        setProgress(0);
        setShowAutoML(false);
        // Reset AutoML data to low baseline
        setAutomlData(Array.from({length: 20}, (_, i) => ({ iter: i, score: 30 })));
        
        // Launch LLM Council Protocol
        runCouncilProtocol(topic);
    };

    const runCouncilProtocol = async (query: string) => {
        // Helper delay that checks mount status
        const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

        // --- PHASE 1: CHAIRMAN OPENING ---
        updateModelStatus('arbiter', 'TALKING');
        addMessage({ id: 'sys-1', modelId: 'CHAIRMAN', modelName: 'Gemini 3 Ultra', type: 'ARGUMENT', content: `Скликаю Раду. Тема засідання: "${query}". Прошу надати пропозиції.`, timestamp: new Date() });
        await delay(2000);
        if (!isMounted.current) return;
        updateModelStatus('arbiter', 'IDLE');

        const proposals = [
            { id: 'm1', role: 'Architect', text: "Пропоную використати гібридну RAG систему з векторним та графовим пошуком для підвищення точності контексту." },
            { id: 'm3', role: 'Optimist', text: "Підтримую. Це дозволить знайти приховані зв'язки. Можемо використати легкі моделі для швидкості." },
            { id: 'm2', role: 'Critic', text: "Заперечую. Графові бази даних (Neo4j) дорогі в підтримці. Чи виправданий ROI для цієї задачі?" },
            { id: 'm4', role: 'Security', text: "Крім того, необхідно перевірити чи не порушує це GDPR при обці персональних даних." }
        ];

        // --- PHASE 2: ROUND TABLE (PROPOSALS) ---
        for (let i = 0; i < proposals.length; i++) {
            const p = proposals[i];
            updateModelStatus(p.id, 'THINKING');
            await delay(800); 
            if (!isMounted.current) return;
            
            updateModelStatus(p.id, 'TALKING');
            addMessage({ id: `msg-${i}`, modelId: p.id, modelName: `${models.find(m => m.id === p.id)?.name} (${p.role})`, type: 'ARGUMENT', content: p.text, timestamp: new Date() });
            setProgress((i + 1) * 15);
            await delay(1500);
            if (!isMounted.current) return;
            updateModelStatus(p.id, 'IDLE');
        }

        // --- PHASE 3: VOTING ---
        setPhase('ARBITRATION'); 
        addMessage({ id: 'sys-vote', modelId: 'SYSTEM', modelName: 'Protocol', type: 'CONSENSUS', content: "РОЗПОЧАТО ГОЛОСУВАННЯ...", timestamp: new Date() });
        
        // Visualize Voting (Red/Green)
        setModels(prev => prev.map(m => ({ ...m, status: 'VOTING' }))); 
        await delay(3000);
        if (!isMounted.current) return;
        
        // --- PHASE 4: CONSENSUS ---
        updateModelStatus('arbiter', 'TALKING');
        const verdict = "Голова Ради: Зваживши ризики та переваги, приймаємо гібридний підхід, але з обов'язковим PII Masking шаром (вимога Security).";
        addMessage({ id: 'arb-final', modelId: 'arbiter', modelName: 'Gemini 3 Ultra', type: 'FINAL_VERDICT', content: verdict, timestamp: new Date() });
        
        setModels(prev => prev.map(m => ({ ...m, status: 'IDLE' })));
        updateModelStatus('arbiter', 'IDLE');
        setProgress(100);

        // --- PHASE 5: EXECUTION (AutoML) ---
        setPhase('NAS_IMPLEMENTATION');
        setShowAutoML(true);
        addMessage({ id: 'sys-nas', modelId: 'SYSTEM', modelName: 'NAS Engine', type: 'CONSENSUS', content: "Імплементація узгодженої архітектури через AutoML...", timestamp: new Date() });
        await delay(4000);
        if (!isMounted.current) return;
        
        setPhase('DEPLOYMENT');
    };

    // Prepare nodes for Brain3D
    const brainNodes = [...models, chairman].map(m => ({
        id: m.id,
        name: m.name,
        role: m.role || 'Node',
        avatar: m.avatar,
        color: m.color,
        status: m.status
    }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <ViewHeader 
                title="Neural Council (LLM-C Integration)"
                icon={<Users size={20} className="icon-3d-blue"/>}
                breadcrumbs={['INTELLIGENCE', 'LLM COUNCIL', 'SESSION #442']}
                stats={[
                    { label: 'Quorum', value: '5/5', icon: <Cpu size={14}/>, color: 'primary' },
                    { label: 'Consensus', value: phase === 'ARBITRATION' ? 'VOTING' : 'IDLE', icon: <Gavel size={14}/>, color: 'purple', animate: phase === 'ARBITRATION' },
                    { label: 'NAS', value: showAutoML ? 'BUILDING' : 'READY', icon: <Settings size={14}/>, color: 'success' },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEFT: 3D COUNCIL CHAMBER */}
                <div className="lg:col-span-2 space-y-6">
                    <TacticalCard title="Зала Засідань (Council Chamber)" className="h-[400px] lg:min-h-[500px] flex flex-col relative overflow-hidden panel-3d" noPadding>
                        
                        {/* 3D Canvas */}
                        <div className="absolute inset-0 z-0 bg-[#020617]">
                            <Canvas camera={{ position: [0, 4, 8], fov: 45 }}>
                                <ambientLight intensity={0.5} />
                                <pointLight position={[0, 10, 0]} intensity={1} />
                                <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={0.5} />
                                <Suspense fallback={null}>
                                    <Brain3D nodes={brainNodes} stage={phase === 'ARBITRATION' ? 'ARBITRATION' : 'DEBATE'} />
                                </Suspense>
                                <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2.2} autoRotate={false} />
                            </Canvas>
                        </div>

                        {/* Input & Controls */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6 z-20 bg-gradient-to-t from-slate-950 via-slate-900/90 to-transparent">
                            <div className="flex gap-3 flex-col sm:flex-row">
                                <div className="flex-1 bg-slate-900/80 backdrop-blur border border-slate-700 rounded-lg flex items-center px-4 shadow-lg focus-within:border-purple-500 transition-colors">
                                    <MessageSquare size={18} className="text-slate-500 mr-3" />
                                    <input 
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && startDebate()}
                                        placeholder="Внесіть питання..."
                                        className="w-full bg-transparent border-none py-3 text-sm text-slate-200 outline-none placeholder-slate-500"
                                        disabled={phase !== 'IDLE' && phase !== 'DEPLOYMENT'}
                                    />
                                </div>
                                <button 
                                    onClick={startDebate}
                                    disabled={!topic || (phase !== 'IDLE' && phase !== 'DEPLOYMENT')}
                                    className="px-8 py-3 sm:py-0 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 btn-3d btn-3d-purple transition-all"
                                >
                                    <Gavel size={18} /> <span className="sm:hidden lg:inline">СКЛИКАТИ</span>
                                </button>
                            </div>
                            
                            {/* Progress Line */}
                            <div className="mt-4 flex items-center gap-4">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest w-24">Protocol Status</div>
                                <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700" style={{ width: `${progress}%` }}></div>
                                </div>
                                <div className="text-[10px] font-mono text-purple-400">{progress}%</div>
                            </div>
                        </div>
                    </TacticalCard>

                    {/* NAS / AutoML Panel */}
                    <TacticalCard title="NAS Implementation (Auto-Coder)" className="h-[250px] panel-3d">
                        <div className="flex h-full">
                            <div className="w-1/3 p-4 border-r border-slate-800">
                                <div className="text-xs text-slate-400 mb-2">Target Architecture</div>
                                <div className={`text-lg font-bold ${showAutoML ? 'text-white' : 'text-slate-500'} mb-4`}>
                                    {showAutoML ? 'Hybrid RAG v4' : 'Idle / Waiting'}
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] text-slate-500">
                                        <span>Latency</span> 
                                        <span className={showAutoML ? "text-green-500" : "text-slate-600"}>
                                            {showAutoML ? '-12ms' : '--'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-500">
                                        <span>Accuracy</span> 
                                        <span className={showAutoML ? "text-green-500" : "text-slate-600"}>
                                            {showAutoML ? '+4.5%' : '--'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 p-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={automlData}>
                                        <defs>
                                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={showAutoML ? "#3b82f6" : "#1e293b"} stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor={showAutoML ? "#3b82f6" : "#1e293b"} stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="iter" hide />
                                        <YAxis domain={[0, 100]} hide />
                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px' }} />
                                        <Area 
                                            type="monotone" 
                                            dataKey="score" 
                                            stroke={showAutoML ? "#3b82f6" : "#334155"} 
                                            fillOpacity={1} 
                                            fill="url(#colorScore)" 
                                            animationDuration={500}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </TacticalCard>
                </div>

                {/* RIGHT: TRANSCRIPT */}
                <div className="space-y-6">
                    <TacticalCard title="Стенограма Засідання" className="h-[500px] lg:h-[750px] flex flex-col panel-3d" action={<div className="flex gap-1"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> <span className="text-[10px] text-slate-500 uppercase">Live</span></div>}>
                        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex gap-3 animate-in slide-in-from-bottom-2 duration-300 ${msg.modelId === 'CHAIRMAN' || msg.modelId === 'arbiter' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                        msg.modelId === 'arbiter' ? 'bg-white text-black border-white' : 
                                        msg.type === 'CRITIQUE' ? 'bg-red-900/20 text-red-500 border-red-900/50' :
                                        'bg-slate-800 text-slate-400 border-slate-700'
                                    }`}>
                                        <span className="font-bold text-xs">{msg.modelName[0]}</span>
                                    </div>
                                    <div className={`flex-1 p-3 rounded-lg border text-xs ${
                                        msg.type === 'FINAL_VERDICT' ? 'bg-purple-900/20 border-purple-500/50 text-white' : 
                                        msg.modelId === 'arbiter' ? 'bg-slate-800 border-slate-700 text-slate-200' :
                                        'bg-slate-900/50 border-slate-800 text-slate-300'
                                    }`}>
                                        <div className="flex justify-between mb-1 opacity-70">
                                            <span className="font-bold text-[10px] uppercase">{msg.modelName}</span>
                                            <span className="text-[9px] font-mono">{msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                                        </div>
                                        <p className="leading-relaxed">{msg.content}</p>
                                    </div>
                                </div>
                            ))}
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-50">
                                    <Users size={32} className="mb-2"/>
                                    <span className="text-xs">Очікування початку засідання...</span>
                                </div>
                            )}
                        </div>
                    </TacticalCard>
                </div>
            </div>
        </div>
    );
};

export default SystemBrainView;
