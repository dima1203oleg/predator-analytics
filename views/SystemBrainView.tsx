
import React, { useState, useEffect, useRef } from 'react';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import { 
  Sparkles, BrainCircuit, Activity, MessageSquare, 
  Send, Scale, ShieldCheck, Zap, AlertTriangle, 
  CheckCircle2, GitMerge, ArrowRight, Play, RotateCcw,
  Cpu, GitPullRequest, Code, FileText, Database, Settings, RefreshCw, BarChart3
} from 'lucide-react';
import { BrainModel, DebateMessage, DebatePhase } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

// --- INITIAL CONFIG ---
const INITIAL_MODELS: BrainModel[] = [
    { id: 'm1', name: 'Gemini 2.0 Flash', provider: 'Google', avatar: 'G', status: 'IDLE', color: '#3b82f6' }, 
    { id: 'm2', name: 'DeepSeek R1', provider: 'DeepSeek', avatar: 'D', status: 'IDLE', color: '#a855f7' }, 
    { id: 'm3', name: 'Mistral Large', provider: 'Mistral AI', avatar: 'M', status: 'IDLE', color: '#eab308' }, 
    { id: 'm4', name: 'Qwen 2.5', provider: 'Alibaba', avatar: 'Q', status: 'IDLE', color: '#ef4444' }, 
    { id: 'm5', name: 'Llama 3 (Local)', provider: 'Meta/Local', avatar: 'L', status: 'IDLE', color: '#22c55e' }, 
];

const ARBITER: BrainModel = {
    id: 'arbiter', name: 'Gemini 3 Ultra', provider: 'Google DeepMind', avatar: 'A', status: 'IDLE', color: '#ffffff'
};

const SystemBrainView: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [phase, setPhase] = useState<DebatePhase>('IDLE');
    const [models, setModels] = useState<BrainModel[]>(INITIAL_MODELS);
    const [arbiter, setArbiter] = useState<BrainModel>(ARBITER);
    const [messages, setMessages] = useState<DebateMessage[]>([]);
    const [progress, setProgress] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showAutoML, setShowAutoML] = useState(false);

    // AutoML Data Mock
    const [automlData, setAutomlData] = useState<{iter: number, score: number}[]>([]);

    useEffect(() => {
        if(scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if(showAutoML) {
            const interval = setInterval(() => {
                setAutomlData(prev => {
                    const nextIter = prev.length + 1;
                    const lastScore = prev.length > 0 ? prev[prev.length - 1].score : 50;
                    const newScore = Math.min(99, lastScore + Math.random() * 5);
                    return [...prev, { iter: nextIter, score: newScore }].slice(-20);
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [showAutoML]);

    const addMessage = (msg: DebateMessage) => {
        setMessages(prev => [...prev, msg]);
    };

    const updateModelStatus = (id: string, status: BrainModel['status'], thought?: string) => {
        if (id === 'arbiter') {
            setArbiter(prev => ({ ...prev, status, currentThought: thought }));
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
        setAutomlData([]);
        
        // Logic Simulation
        runComplexDebateUA(topic);
    };

    const runComplexDebateUA = async (query: string) => {
        // 1. PROPOSING
        addMessage({ id: 'sys-1', modelId: 'SYSTEM', modelName: 'Orchestrator', type: 'ARGUMENT', content: `Ініціалізація нейро-дебатів: "${query}"`, timestamp: new Date() });
        
        const proposals = [
            { id: 'm1', text: "Gemini Flash: Пропоную векторний пошук по базі судових рішень з фільтром по регіону.", thought: "Сканування бази..." },
            { id: 'm2', text: "DeepSeek R1: Не погоджуюсь. Потрібен граф зв'язків (Neo4j) для виявлення прихованих бенефіціарів.", thought: "Аналіз графа..." },
            { id: 'm3', text: "Mistral: Враховуючи GDPR, дані мають бути анонімізовані перед обробкою.", thought: "Перевірка безпеки..." }
        ];

        for (let i = 0; i < proposals.length; i++) {
            const p = proposals[i];
            updateModelStatus(p.id, 'THINKING', p.thought);
            await new Promise(r => setTimeout(r, 1000));
            updateModelStatus(p.id, 'WAITING');
            addMessage({ id: `msg-${i}`, modelId: p.id, modelName: models.find(m => m.id === p.id)?.name || '', type: 'ARGUMENT', content: p.text, timestamp: new Date() });
            setProgress((i + 1) * 10);
        }

        // 2. CRITIQUE
        setPhase('CROSS_CRITIQUE');
        await new Promise(r => setTimeout(r, 1000));
        
        updateModelStatus('m2', 'DEBATING', 'Критика Gemini...');
        await new Promise(r => setTimeout(r, 1500));
        addMessage({ id: 'crit-1', modelId: 'm2', modelName: 'DeepSeek R1', type: 'CRITIQUE', content: "Векторний пошук дасть багато галюцинацій без точних співпадінь кодів ЄДРПОУ.", timestamp: new Date(), targetModelId: 'm1' });
        updateModelStatus('m2', 'WAITING');
        setProgress(60);

        // 3. ARBITRATION
        setPhase('ARBITRATION');
        updateModelStatus('arbiter', 'THINKING', 'Зважування аргументів...');
        await new Promise(r => setTimeout(r, 2000));
        
        const verdict = "Арбітр (Gemini 3): Рішення DeepSeek більш надійне для фінансових розслідувань. Використовуємо Graph RAG підхід.";
        addMessage({ id: 'arb-1', modelId: 'arbiter', modelName: 'Gemini 3 Ultra', type: 'FINAL_VERDICT', content: verdict, timestamp: new Date() });
        updateModelStatus('arbiter', 'FINALIZING');
        setProgress(80);

        // 4. NAS / AUTOML
        setPhase('NAS_IMPLEMENTATION');
        setShowAutoML(true);
        addMessage({ id: 'sys-2', modelId: 'SYSTEM', modelName: 'NAS Engine', type: 'CONSENSUS', content: "Запуск AutoML для оптимізації Graph RAG пайплайну...", timestamp: new Date() });
        await new Promise(r => setTimeout(r, 3000));
        
        setPhase('DEPLOYMENT');
        setProgress(100);
        updateModelStatus('arbiter', 'IDLE');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <ViewHeader 
                title="System Brain: Logic & Arbitration"
                icon={<BrainCircuit size={20} />}
                breadcrumbs={['INTELLIGENCE', 'COMPLEX LOGIC', 'DEBATE']}
                stats={[
                    { label: 'Models', value: '5 + 1', icon: <Cpu size={14}/>, color: 'primary' },
                    { label: 'Arbitration', value: 'ACTIVE', icon: <Scale size={14}/>, color: 'purple', animate: phase === 'ARBITRATION' },
                    { label: 'NAS', value: showAutoML ? 'TUNING' : 'READY', icon: <Settings size={14}/>, color: 'success' },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEFT: VISUALIZATION ARENA */}
                <div className="lg:col-span-2 space-y-6">
                    <TacticalCard title="Арена Дебатів (Neural Ring)" className="min-h-[500px] flex flex-col relative overflow-hidden panel-3d">
                        {/* Background */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 opacity-80"></div>
                        
                        {/* Input */}
                        <div className="relative z-20 mb-4 flex gap-2">
                            <input 
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && startDebate()}
                                placeholder="Задайте складну задачу для консиліуму моделей..."
                                className="flex-1 bg-slate-900 border border-slate-700 rounded p-3 text-sm text-slate-200 outline-none focus:border-purple-500"
                                disabled={phase !== 'IDLE' && phase !== 'DEPLOYMENT'}
                            />
                            <button 
                                onClick={startDebate}
                                disabled={!topic || (phase !== 'IDLE' && phase !== 'DEPLOYMENT')}
                                className="px-6 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded shadow-lg flex items-center gap-2 disabled:opacity-50 btn-3d"
                            >
                                <Zap size={18} /> START
                            </button>
                        </div>

                        {/* Visualization */}
                        <div className="flex-1 relative flex items-center justify-center">
                            
                            {/* Central Arbiter */}
                            <div className="relative z-10 flex flex-col items-center">
                                <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center bg-slate-900 shadow-[0_0_50px_rgba(168,85,247,0.3)] transition-all duration-500 ${phase === 'ARBITRATION' ? 'border-white scale-110' : 'border-slate-700'}`}>
                                    <div className="text-3xl font-bold text-white">A</div>
                                    {phase === 'ARBITRATION' && <div className="absolute inset-0 rounded-full border-2 border-white/50 animate-ping"></div>}
                                </div>
                                <div className="mt-2 text-center text-xs font-bold text-white">{arbiter.name}</div>
                                {arbiter.currentThought && (
                                    <div className="absolute -top-16 bg-white text-slate-900 text-[10px] p-2 rounded font-bold animate-bounce">
                                        {arbiter.currentThought}
                                    </div>
                                )}
                            </div>

                            {/* Models Orbit */}
                            {models.map((model, i) => {
                                const angle = (i * (360 / models.length)) - 90;
                                const radius = 150;
                                const x = Math.cos(angle * (Math.PI / 180)) * radius;
                                const y = Math.sin(angle * (Math.PI / 180)) * radius;
                                const isActive = model.status !== 'IDLE' && model.status !== 'WAITING';

                                return (
                                    <div key={model.id} className="absolute transition-all duration-500" style={{ transform: `translate(${x}px, ${y}px)` }}>
                                        <div className="flex flex-col items-center">
                                            <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center bg-slate-900 transition-all ${isActive ? 'scale-125 border-current shadow-[0_0_20px_currentColor]' : 'border-slate-700'}`} style={{ color: model.color }}>
                                                <span className="font-bold">{model.avatar}</span>
                                            </div>
                                            <div className="mt-1 text-[9px] text-slate-400 bg-black/50 px-1 rounded">{model.name}</div>
                                            {model.currentThought && (
                                                <div className="absolute -top-10 bg-slate-800 text-slate-200 text-[9px] p-1.5 rounded border border-slate-600 w-24 text-center">
                                                    {model.currentThought}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Phase Bar */}
                        <div className="absolute bottom-4 left-4 right-4">
                            <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold mb-1">
                                <span>Phase: {phase}</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full h-1 bg-slate-800 rounded overflow-hidden">
                                <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    </TacticalCard>

                    {/* NAS / AutoML Panel */}
                    {showAutoML && (
                        <TacticalCard title="NAS & AutoML Optimization (Self-Improvement)" className="h-[250px] panel-3d">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={automlData}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="iter" hide />
                                    <YAxis domain={[0, 100]} hide />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px' }} />
                                    <Area type="monotone" dataKey="score" stroke="#10b981" fillOpacity={1} fill="url(#colorScore)" />
                                </AreaChart>
                            </ResponsiveContainer>
                            <div className="absolute top-4 right-4 text-xs font-bold text-green-500 animate-pulse">
                                Optimization Active...
                            </div>
                        </TacticalCard>
                    )}
                </div>

                {/* RIGHT: LOGS */}
                <div className="space-y-6">
                    <TacticalCard title="Транскрипт (Live Log)" className="h-[600px] flex flex-col panel-3d">
                        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-3">
                            {messages.map(msg => (
                                <div key={msg.id} className={`p-2 rounded border text-xs ${
                                    msg.type === 'FINAL_VERDICT' ? 'bg-purple-900/20 border-purple-500/50' : 
                                    msg.type === 'CRITIQUE' ? 'bg-red-900/10 border-red-900/30' : 
                                    'bg-slate-900 border-slate-800'
                                }`}>
                                    <div className="flex justify-between font-bold mb-1">
                                        <span className={msg.modelId === 'arbiter' ? 'text-white' : 'text-slate-300'}>{msg.modelName}</span>
                                        <span className="text-[9px] text-slate-500">{msg.timestamp.toLocaleTimeString()}</span>
                                    </div>
                                    <div className="text-slate-400 leading-relaxed">{msg.content}</div>
                                </div>
                            ))}
                        </div>
                    </TacticalCard>
                </div>
            </div>
        </div>
    );
};

export default SystemBrainView;
