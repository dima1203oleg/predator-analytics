
import React, { useState, useEffect, useRef } from 'react';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import { BrainCircuit, Cpu, Zap, Activity, Layers, Play, Settings, Box, Terminal, Cloud, DollarSign, TrendingDown, RefreshCw, Sparkles, Server, Save, XCircle, Stethoscope, Building2, Leaf, Briefcase, Send, Eraser, MessageSquare, Gauge, Bot, TrendingUp, GitCompare, Microscope, LineChart as LineChartIcon, Shuffle, ShieldAlert, Wifi } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell, AreaChart, Area, LineChart, Line } from 'recharts';
import { useSystemMetrics } from '../hooks/useSystemMetrics';
import { api } from '../services/api';
import { DSPyOptimization } from '../types';
import { useToast } from '../context/ToastContext'; // Import Toast

type LLMTab = 'INFERENCE' | 'TRAINING' | 'AUTOML' | 'DSPY';
type TrainingDomain = 'GOV' | 'MED' | 'SCI' | 'BIZ';

const TRAINING_CONFIGS: Record<TrainingDomain, { label: string, icon: React.ReactNode, steps: string[] }> = {
    GOV: {
        label: 'Юриспруденція & Право (GOV)',
        icon: <Building2 size={14} />,
        steps: [
            "Loading registry: 'Unified Court Register'...",
            "Tokenizing legislative acts (Criminal Code)...",
            "Aligning entity extraction (NER) for PEPs...",
            "Optimizing for bureaucratic language patterns..."
        ]
    },
    MED: {
        label: 'Медицина & Клініка (MED)',
        icon: <Stethoscope size={14} />,
        steps: [
            "Ingesting protocols: ICD-10 & MOH Standards...",
            "Sanitizing patient records (PII Removal)...",
            "Learning symptom-diagnosis correlation vectors...",
            "Fine-tuning on medical latin terminology..."
        ]
    },
    BIZ: {
        label: 'Фінанси & Ризики (BIZ)',
        icon: <Briefcase size={14} />,
        steps: [
            "Parsing SWIFT transaction logs...",
            "Analyzing market volatility indicators...",
            "Training fraud detection patterns (Anomaly)...",
            "Aligning with NBU regulatory reporting..."
        ]
    },
    SCI: {
        label: 'Наука & Екологія (SCI)',
        icon: <Leaf size={14} />,
        steps: [
            "Processing satellite telemetry (Sentinel-2)...",
            "Calibrating atmospheric dispersion models...",
            "Ingesting hydrological sensor streams...",
            "Optimizing geo-spatial reasoning..."
        ]
    }
};

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

const MOCK_DSPY_MODULES: DSPyOptimization[] = [
    { id: 'dspy-1', moduleName: 'DeepScan_Reasoning', targetMetric: 'LogicalConsistency', startingScore: 65.4, currentScore: 88.2, iterations: 14, status: 'OPTIMIZING', bestPromptSnippet: '...break down the anomaly into temporal clusters before classifying...', lastImprovement: '+2.1% (ChainOfThought)' },
    { id: 'dspy-2', moduleName: 'SQL_Generator_v2', targetMetric: 'ExecutionSuccess', startingScore: 72.0, currentScore: 94.5, iterations: 42, status: 'CONVERGED', bestPromptSnippet: '...use explicit JOINs on EDRPOU columns and filter by active status...', lastImprovement: '+0.5% (FewShot)' },
    { id: 'dspy-3', moduleName: 'OSINT_FactChecker', targetMetric: 'HallucinationRate', startingScore: 40.2, currentScore: 76.8, iterations: 8, status: 'OPTIMIZING', bestPromptSnippet: '...verify against known reliable domains list before citing...', lastImprovement: '+4.3% (BootstrapFewShot)' },
];

const DSPY_CHART_DATA = [
    { iter: 1, score: 65.4 }, { iter: 2, score: 68.1 }, { iter: 3, score: 67.5 }, { iter: 4, score: 71.2 },
    { iter: 5, score: 74.8 }, { iter: 6, score: 76.0 }, { iter: 7, score: 79.5 }, { iter: 8, score: 81.2 },
    { iter: 9, score: 80.8 }, { iter: 10, score: 83.5 }, { iter: 11, score: 85.1 }, { iter: 12, score: 87.4 },
    { iter: 13, score: 87.9 }, { iter: 14, score: 88.2 }
];

const LLMView: React.FC = () => {
    const metrics = useSystemMetrics();
    const toast = useToast(); // Use Toast
    const [activeTab, setActiveTab] = useState<LLMTab>('INFERENCE');
    const [activeModel, setActiveModel] = useState('llama3-70b-uk-v4');
    
    // Inference State
    const [systemPrompt, setSystemPrompt] = useState('Ти — аналітичний асистент платформи Predator. Відповідай лаконічно, використовуючи технічну термінологію.');
    const [userPrompt, setUserPrompt] = useState('');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [genMetrics, setGenMetrics] = useState({ tps: 0, ttft: 0, totalTokens: 0 });
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Training State
    const [trainingStatus, setTrainingStatus] = useState<'IDLE' | 'TRAINING' | 'COMPLETED'>('IDLE');
    const [trainingDomain, setTrainingDomain] = useState<TrainingDomain>('GOV');
    const [trainingLogs, setTrainingLogs] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // DSPy State
    const [dspyOptimizing, setDspyOptimizing] = useState(false);
    const [dspyData, setDspyData] = useState(DSPY_CHART_DATA);

    // API Data
    const [benchmarkData, setBenchmarkData] = useState<any[]>([]);
    const [autoMLExperiments, setAutoMLExperiments] = useState<any[]>([]);
    const isMounted = useRef(false);

    // LLM Config State
    const [llmConfig, setLlmConfig] = useState<any>(null); // Load from API

    useEffect(() => {
        isMounted.current = true;
        const fetchLLMData = async () => {
            try {
                const [bench, auto, config] = await Promise.all([
                    api.getLLMBenchmarks(),
                    api.getAutoMLExperiments(),
                    api.getLLMConfig()
                ]);
                if (isMounted.current) {
                    setBenchmarkData(bench);
                    setAutoMLExperiments(auto);
                    setLlmConfig(config);
                }
            } catch (e) {
                console.error("LLM Data fetch error", e);
                toast.error('Помилка завантаження', 'Не вдалося отримати конфігурацію LLM.');
            }
        };
        fetchLLMData();
        return () => { isMounted.current = false; };
    }, []);

    // Scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isGenerating]);

    // DSPy Simulation
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (dspyOptimizing) {
            interval = setInterval(() => {
                setDspyData(prev => {
                    const last = prev[prev.length - 1];
                    // Simulate convergence (logarithmic growth with noise)
                    const improvement = Math.max(0, (99.9 - last.score) * 0.1 * Math.random());
                    const newScore = Math.min(99.9, last.score + improvement);
                    return [...prev, { iter: last.iter + 1, score: newScore }];
                });
            }, 1500);
        }
        return () => clearInterval(interval);
    }, [dspyOptimizing]);

    const handleSendMessage = () => {
        if (!userPrompt.trim()) return;
        
        const newMessage: ChatMessage = { role: 'user', content: userPrompt };
        setChatHistory(prev => [...prev, newMessage]);
        setUserPrompt('');
        setIsGenerating(true);
        setGenMetrics({ tps: 0, ttft: 0, totalTokens: 0 });

        // Simulate Streaming Response
        setTimeout(() => {
            const responseMsg: ChatMessage = { role: 'assistant', content: '' };
            setChatHistory(prev => [...prev, responseMsg]);
            
            let tokens = 0;
            const fullResponse = "Based on the provided parameters, the entity 'ТОВ МегаБуд' shows a 0.85 risk score for tax evasion. I have detected circular transactions with 'Offshore Ltd' in Cyprus. Recommended action: Deep Scan.";
            const words = fullResponse.split(' ');
            let i = 0;

            const streamInterval = setInterval(() => {
                if (i >= words.length) {
                    clearInterval(streamInterval);
                    setIsGenerating(false);
                    return;
                }
                
                setChatHistory(prev => {
                    const newHist = [...prev];
                    newHist[newHist.length - 1].content += (i === 0 ? '' : ' ') + words[i];
                    return newHist;
                });
                
                tokens++;
                setGenMetrics(prev => ({
                    tps: Math.floor(Math.random() * 20) + 40, // 40-60 TPS
                    ttft: 45, // ms
                    totalTokens: tokens
                }));
                i++;
            }, 50); // Fast stream
        }, 600);
    };

    const handleStartTraining = () => {
        if (trainingStatus === 'TRAINING') return;
        setTrainingStatus('TRAINING');
        setProgress(0);
        setTrainingLogs([`[INIT] Starting LoRA Fine-Tuning for ${trainingDomain}...`]);
        toast.info('Тренування розпочато', `Сектор: ${TRAINING_CONFIGS[trainingDomain].label}`);

        const steps = TRAINING_CONFIGS[trainingDomain].steps;
        let stepIndex = 0;

        const interval = setInterval(() => {
            if (stepIndex >= steps.length) {
                clearInterval(interval);
                setTrainingStatus('COMPLETED');
                setTrainingLogs(prev => [...prev, "[SUCCESS] Model weights updated and hot-swapped."]);
                toast.success('Тренування завершено', 'Нові ваги успішно завантажено в інференс.');
                return;
            }

            const step = steps[stepIndex];
            setTrainingLogs(prev => [...prev, `[STEP ${stepIndex + 1}] ${step}`]);
            setProgress((stepIndex + 1) / steps.length * 100);
            stepIndex++;
        }, 1500);
    };

    const handleSaveLLM = async () => {
        // Mock save
        toast.success("Конфігурацію збережено", "Multi-Account Router оновлено успішно.");
    };

    const renderInference = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            <div className="lg:col-span-2 flex flex-col gap-4 h-[600px]">
                <TacticalCard title={`Chat Session: ${activeModel}`} className="flex-1 flex flex-col relative overflow-hidden panel-3d">
                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950/50">
                        {chatHistory.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-4">
                                <Bot size={48} className="opacity-20 icon-3d" />
                                <p>AI Ready. Context Window: 32k. Temperature: 0.7</p>
                            </div>
                        )}
                        {chatHistory.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-primary-900/20 border border-primary-500/30 text-primary-100 rounded-br-none' 
                                    : 'bg-slate-900 border border-slate-700 text-slate-300 rounded-bl-none'
                                }`}>
                                    {msg.role === 'assistant' && <div className="text-[10px] text-purple-400 font-bold mb-1 flex items-center gap-1"><Sparkles size={10}/> PREDATOR AI</div>}
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-slate-900 border-t border-slate-800">
                        <div className="flex gap-2">
                            <input 
                                value={userPrompt}
                                onChange={(e) => setUserPrompt(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Введіть запит для аналізу..."
                                className="flex-1 bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:border-primary-500 outline-none"
                                disabled={isGenerating}
                            />
                            <button 
                                onClick={handleSendMessage}
                                disabled={isGenerating || !userPrompt}
                                className="p-2 rounded text-white disabled:opacity-50 transition-colors btn-3d btn-3d-blue"
                            >
                                {isGenerating ? <RefreshCw className="animate-spin" size={20}/> : <Send size={20}/>}
                            </button>
                        </div>
                        <div className="flex justify-between items-center mt-2 text-[10px] text-slate-500 font-mono">
                            <span>Speed: {genMetrics.tps} tok/s</span>
                            <span>Latency: {genMetrics.ttft} ms</span>
                            <span>Tokens: {genMetrics.totalTokens}</span>
                        </div>
                    </div>
                </TacticalCard>
            </div>

            <div className="space-y-6">
                <TacticalCard title="Параметри Моделі" className="panel-3d">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">System Prompt</label>
                            <textarea 
                                value={systemPrompt}
                                onChange={(e) => setSystemPrompt(e.target.value)}
                                className="w-full h-24 bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-300 resize-none focus:border-primary-500 outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Temp</label>
                                <input type="range" min="0" max="1" step="0.1" defaultValue="0.7" className="w-full accent-primary-500" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Top P</label>
                                <input type="range" min="0" max="1" step="0.1" defaultValue="0.9" className="w-full accent-primary-500" />
                            </div>
                        </div>
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded flex items-center justify-between">
                            <div className="text-xs text-slate-300">GPU VRAM Usage</div>
                            <div className="text-xs font-mono text-purple-400 font-bold">{metrics.gpu.vram.toFixed(1)}GB / 24GB</div>
                        </div>
                    </div>
                </TacticalCard>

                {/* LLM ROUTER CONFIGURATION */}
                <TacticalCard title="LLM Router & Rotation" className="panel-3d">
                    <div className="space-y-2">
                        {llmConfig?.providers.map((p: any) => (
                            <div key={p.id} className="p-3 bg-slate-900 border border-slate-800 rounded group hover:border-slate-600 transition-colors panel-3d">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded ${p.type === 'FALLBACK' ? 'bg-orange-900/20 text-orange-500' : p.type === 'CLOUD' ? 'bg-blue-900/20 text-blue-500' : 'bg-purple-900/20 text-purple-500'} icon-3d`}>
                                            {p.type === 'FALLBACK' ? <ShieldAlert size={14}/> : p.type === 'CLOUD' ? <Cloud size={14}/> : <Cpu size={14}/>}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-200">{p.name}</div>
                                            <div className="text-[9px] text-slate-500">{p.model}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {p.status === 'ACTIVE' && <div className="text-[9px] font-bold text-success-500 flex items-center gap-1 justify-end"><Wifi size={10}/> ONLINE</div>}
                                        {p.status === 'STANDBY' && <div className="text-[9px] font-bold text-slate-500">STANDBY</div>}
                                    </div>
                                </div>
                                
                                {p.accountsCount > 1 && (
                                    <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center text-[9px] font-mono">
                                        <div className="flex items-center gap-1 text-slate-400">
                                            <Shuffle size={10} className="text-primary-500"/> 
                                            Rotation: <span className="text-white font-bold">{p.rotationStrategy}</span>
                                        </div>
                                        <div className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700 text-slate-300">
                                            {p.accountsCount} Keys Active
                                        </div>
                                    </div>
                                )}
                                {p.type === 'FALLBACK' && (
                                    <div className="mt-2 pt-2 border-t border-slate-800 text-[9px] text-orange-400 flex items-center gap-1">
                                        <ShieldAlert size={10}/> Emergency Fallback
                                    </div>
                                )}
                            </div>
                        ))}
                        <div className="flex justify-end pt-2">
                            <button onClick={handleSaveLLM} className="px-3 py-1.5 rounded text-xs font-bold transition-colors btn-3d btn-3d-blue flex items-center gap-2">
                                <Settings size={14} /> Configure Router
                            </button>
                        </div>
                    </div>
                </TacticalCard>
            </div>
        </div>
    );

    const renderTraining = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
            <TacticalCard title="LoRA Fine-Tuning Console" className="panel-3d">
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-2">
                        {(Object.keys(TRAINING_CONFIGS) as TrainingDomain[]).map((dom) => (
                            <button
                                key={dom}
                                onClick={() => setTrainingDomain(dom)}
                                className={`p-3 rounded border flex flex-col items-center gap-2 transition-all btn-3d ${
                                    trainingDomain === dom 
                                    ? 'bg-primary-900/20 border-primary-500 text-primary-400' 
                                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'
                                }`}
                            >
                                {TRAINING_CONFIGS[dom].icon}
                                <span className="text-xs font-bold">{dom}</span>
                            </button>
                        ))}
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-800 rounded">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-200 text-sm">{TRAINING_CONFIGS[trainingDomain].label}</h3>
                            <span className="text-xs text-slate-500 font-mono">Dataset: {trainingDomain.toLowerCase()}_v4.jsonl</span>
                        </div>
                        
                        {trainingStatus !== 'IDLE' && (
                            <div className="mb-4">
                                <div className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span>Progress</span>
                                    <span>{progress.toFixed(0)}%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                    <div className="h-full bg-primary-500 transition-all duration-300 shadow-[0_0_10px_#06b6d4]" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>
                        )}

                        <div className="h-48 overflow-y-auto custom-scrollbar bg-black/50 p-2 rounded border border-slate-800 font-mono text-[10px] space-y-1">
                            {trainingLogs.length === 0 ? (
                                <div className="text-slate-600 italic">Ready to start training...</div>
                            ) : (
                                trainingLogs.map((log, i) => (
                                    <div key={i} className="text-slate-300 flex gap-2">
                                        <span className="text-primary-500">➜</span> {log}
                                    </div>
                                ))
                            )}
                            <div ref={logsEndRef} />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button className="px-4 py-2 rounded text-xs font-bold text-slate-300 btn-3d">Configure Hyperparams</button>
                        <button 
                            onClick={handleStartTraining}
                            disabled={trainingStatus === 'TRAINING'}
                            className="px-6 py-2 rounded text-xs font-bold flex items-center gap-2 disabled:opacity-50 btn-3d btn-3d-blue"
                        >
                            {trainingStatus === 'TRAINING' ? <RefreshCw className="animate-spin" size={14}/> : <Play size={14}/>}
                            {trainingStatus === 'TRAINING' ? 'Training...' : 'Start Tuning'}
                        </button>
                    </div>
                </div>
            </TacticalCard>

            <TacticalCard title="AutoML Experiments" className="panel-3d">
                <div className="space-y-3">
                    {autoMLExperiments.map((exp) => (
                        <div key={exp.id} className="p-3 bg-slate-900 border border-slate-800 rounded flex items-center justify-between panel-3d">
                            <div>
                                <div className="text-sm font-bold text-slate-200">{exp.name}</div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                    Algo: <span className="text-primary-400">{exp.algo}</span> • Target: {exp.target}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-[10px] font-bold px-2 py-0.5 rounded mb-1 ${
                                    exp.status === 'COMPLETED' ? 'bg-success-900/20 text-success-500' :
                                    exp.status === 'RUNNING' ? 'bg-blue-900/20 text-blue-500 animate-pulse' :
                                    'bg-slate-800 text-slate-500'
                                }`}>
                                    {exp.status}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">{exp.score}</div>
                            </div>
                        </div>
                    ))}
                    <button className="w-full py-2 border border-dashed border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500 rounded text-xs font-bold transition-all mt-4 btn-3d">
                        + New Experiment
                    </button>
                </div>
            </TacticalCard>
        </div>
    );

    const renderDSPy = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
            <TacticalCard title="DSPy Prompt Optimizer (Self-Driving)" className="panel-3d" action={
                <button 
                    onClick={() => setDspyOptimizing(!dspyOptimizing)}
                    className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-all btn-3d ${
                        dspyOptimizing ? 'btn-3d-purple' : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                >
                    {dspyOptimizing ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                    {dspyOptimizing ? 'Optimizing...' : 'Start Optimizer'}
                </button>
            }>
                <div className="h-[250px] w-full mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dspyData}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="iter" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis domain={[60, 100]} stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px' }} />
                            <Area type="monotone" dataKey="score" stroke="#a855f7" fillOpacity={1} fill="url(#colorScore)" strokeWidth={2} name="Accuracy Score" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                
                <div className="space-y-2">
                    {MOCK_DSPY_MODULES.map(mod => (
                        <div key={mod.id} className="p-3 bg-slate-900 border border-slate-800 rounded group hover:border-purple-500/30 transition-colors panel-3d">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                                        <BrainCircuit size={14} className="text-purple-500 icon-3d-purple" />
                                        {mod.moduleName}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">Target: {mod.targetMetric}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-purple-400">{mod.currentScore.toFixed(1)}%</div>
                                    <div className="text-[10px] text-success-500 font-mono flex items-center gap-1 justify-end">
                                        <TrendingUp size={10} /> {((mod.currentScore - mod.startingScore)).toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-2 bg-black/40 p-2 rounded border border-slate-800/50">
                                <div className="flex items-center gap-2 mb-1 text-[9px] text-slate-500 uppercase font-bold">
                                    <GitCompare size={10} /> Optimized Instruction Snippet
                                </div>
                                <div className="font-mono text-[10px] text-slate-400 italic leading-relaxed">
                                    "{mod.bestPromptSnippet}"
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </TacticalCard>

            <TacticalCard title="Optimization Logs" className="panel-3d">
                <div className="h-[500px] overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-2 p-2">
                    {dspyOptimizing && (
                        <>
                            <div className="text-purple-400 animate-pulse">&gt;&gt; DSPy BootstrapFewShot: Starting Iteration {dspyData.length}...</div>
                            <div className="text-slate-400">[Compiler] Generating 5 candidate prompts for `DeepScan_Reasoning`...</div>
                            <div className="text-slate-400">[Evaluator] Running 20 test cases against `TruthProtocol` metric...</div>
                            <div className="text-slate-300 flex gap-2">
                                <span className="text-yellow-500">[Candidate 1]</span> Score: 86.5% - Rejected
                            </div>
                            <div className="text-slate-300 flex gap-2">
                                <span className="text-success-500">[Candidate 2]</span> Score: 89.1% - Accepted (New Best)
                            </div>
                            <div className="text-slate-500 italic pl-4">Reasoning: "Candidate 2 explicitly asks for temporal clustering, improving logic score."</div>
                        </>
                    )}
                    {!dspyOptimizing && <div className="text-slate-600 text-center mt-20">Optimizer Idle. Click Start to run self-improvement cycle.</div>}
                </div>
            </TacticalCard>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 w-full max-w-[1600px] mx-auto">
            <ViewHeader 
                title="LLM & Neural Core"
                icon={<BrainCircuit size={20} className="icon-3d-purple"/>}
                breadcrumbs={['INTELLIGENCE', 'NEURAL ENGINE']}
                stats={[
                    { label: 'Active Model', value: activeModel, icon: <Cpu size={14}/>, color: 'primary' },
                    { label: 'VRAM Usage', value: `${metrics.gpu.vram.toFixed(1)} GB`, icon: <Activity size={14}/>, color: metrics.gpu.vram > 20 ? 'danger' : 'success' },
                    { label: 'DSPy Optimizer', value: dspyOptimizing ? 'RUNNING' : 'IDLE', icon: <Sparkles size={14}/>, color: dspyOptimizing ? 'purple' : 'default', animate: dspyOptimizing },
                ]}
            />

            {/* Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/30 rounded-t overflow-x-auto scrollbar-hide">
                <button 
                    onClick={() => setActiveTab('INFERENCE')}
                    className={`flex-1 min-w-[120px] py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'INFERENCE' ? 'border-primary-500 text-primary-400 bg-slate-800/30' : 'border-transparent text-slate-500 hover:bg-slate-800/30'}`}
                >
                    <MessageSquare size={16} /> Inference (Chat)
                </button>
                <button 
                    onClick={() => setActiveTab('TRAINING')}
                    className={`flex-1 min-w-[120px] py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'TRAINING' ? 'border-orange-500 text-orange-400 bg-slate-800/30' : 'border-transparent text-slate-500 hover:bg-slate-800/30'}`}
                >
                    <Layers size={16} /> LoRA Training
                </button>
                <button 
                    onClick={() => setActiveTab('DSPY')}
                    className={`flex-1 min-w-[120px] py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'DSPY' ? 'border-purple-500 text-purple-400 bg-slate-800/30' : 'border-transparent text-slate-500 hover:bg-slate-800/30'}`}
                >
                    <Sparkles size={16} /> DSPy Optimizer
                </button>
                <button 
                    onClick={() => setActiveTab('AUTOML')}
                    className={`flex-1 min-w-[120px] py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'AUTOML' ? 'border-blue-500 text-blue-400 bg-slate-800/30' : 'border-transparent text-slate-500 hover:bg-slate-800/30'}`}
                >
                    <Settings size={16} /> AutoML
                </button>
            </div>

            <div className="min-h-[400px]">
                {activeTab === 'INFERENCE' && renderInference()}
                {activeTab === 'TRAINING' && renderTraining()}
                {activeTab === 'DSPY' && renderDSPy()}
                {activeTab === 'AUTOML' && renderTraining()} {/* Reusing Training UI for AutoML demo */}
            </div>
        </div>
    );
};

export default LLMView;
