
import React, { useState, useEffect, useRef } from 'react';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import {
    BrainCircuit, Cpu, Zap, Activity, Layers, Play, Settings, Box, Terminal, Cloud,
    DollarSign, TrendingDown, RefreshCw, Sparkles, Server, Save, XCircle, Stethoscope,
    Building2, Leaf, Briefcase, Send, Eraser, MessageSquare, Gauge, Bot, TrendingUp,
    GitCompare, Microscope, LineChart as LineChartIcon, Shuffle, ShieldAlert, Wifi, Volume2, ChevronRight
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useSystemMetrics } from '../hooks/useSystemMetrics';
import { useVoiceControl, InteractionStatus } from '../hooks/useVoiceControl';
import { api } from '../services/api';
import { DSPyOptimization } from '../types';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AdvancedBackground } from '../components/AdvancedBackground';

type LLMTab = 'INFERENCE' | 'TRAINING' | 'AUTOML' | 'DSPY';
type TrainingDomain = 'GOV' | 'MED' | 'SCI' | 'BIZ';

const TRAINING_CONFIGS: Record<TrainingDomain, { label: string, icon: React.ReactNode, steps: string[] }> = {
    GOV: { label: 'Право та Юстиція (GOV)', icon: <Building2 size={16} />, steps: ["Завантаження реєстрів Мін'юсту...", "Токенізація кримінальних кодексів...", "NER вирівнювання для PEP...", "Оптимізація юридичного жаргону..."] },
    MED: { label: 'Медицина та Клініка (MED)', icon: <Stethoscope size={16} />, steps: ["Завантаження протоколів МКХ-10...", "Очищення PII з датасетів...", "Навчання векторів симптом-діагноз...", "Fine-tuning медичної латини..."] },
    BIZ: { label: 'Фінанси та Ризики (BIZ)', icon: <Briefcase size={16} />, steps: ["Парсинг логів SWIFT-транзакцій...", "Індексація ринкової волатильності...", "Синтез патернів виявлення шахрайства...", "Фінансове вирівнювання НБУ..."] },
    SCI: { label: 'Наука та Екологія (SCI)', icon: <Leaf size={16} />, steps: ["Прийом супутникової телеметрії...", "Калібрування атмосферної дисперсії...", "Потоки гідрологічних сенсорів...", "Оптимізація геопросторових міркувань..."] }
};

interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string; }

const DSPY_CHART_DATA: { iter: number; score: number }[] = [];

const LLMView: React.FC = () => {
    const metrics = useSystemMetrics();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<LLMTab>('INFERENCE');
    const [activeModel, setActiveModel] = useState('llama3-70b-v25');

    const [systemPrompt, setSystemPrompt] = useState('Ви — нейронне ядро платформи Predator. Відповідайте з високою аналітичною глибиною.');
    const [userPrompt, setUserPrompt] = useState('');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [genMetrics, setGenMetrics] = useState({ tps: 0, ttft: 0, totalTokens: 0 });
    const chatEndRef = useRef<HTMLDivElement>(null);

    const [trainingStatus, setTrainingStatus] = useState<'IDLE' | 'TRAINING' | 'COMPLETED'>('IDLE');
    const [trainingDomain, setTrainingDomain] = useState<TrainingDomain>('GOV');
    const [trainingLogs, setTrainingLogs] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);
    const [trainingMetrics, setTrainingMetrics] = useState<{ step: number, loss: number, accuracy: number }[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);

    const [dspyOptimizing, setDspyOptimizing] = useState(false);
    const [dspyData, setDspyData] = useState(DSPY_CHART_DATA);
    const [voiceStatus, setVoiceStatus] = useState<InteractionStatus>('IDLE');
    const { speak } = useVoiceControl(voiceStatus, setVoiceStatus, () => { });

    const speakMetrics = () => speak(`Нейронне ядро активне. Модель: ${activeModel}. VRAM: ${metrics.gpu.vram.toFixed(1)} ГБ.`);

    useEffect(() => {
        const fetchLLMData = async () => {
            try { await Promise.all([api.getLLMBenchmarks(), api.getAutoMLExperiments(), api.getLLMConfig()]); } catch (e) { /* Silently handle */ }
        };
        fetchLLMData();
    }, []);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory, isGenerating]);
    useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [trainingLogs]);

    const handleSendMessage = () => {
        if (!userPrompt.trim() || isGenerating) return;
        const prompt = userPrompt.trim();
        setChatHistory(prev => [...prev, { role: 'user', content: prompt }]);
        setUserPrompt('');
        setIsGenerating(true);

        (async () => {
            try {
                const res = await api.nexus.chat(prompt, 'chat');
                const answer = res?.answer || res?.message || JSON.stringify(res);
                setChatHistory(prev => [...prev, { role: 'assistant', content: answer }]);
            } catch (e) {
                toast.error('LLM недоступний', 'Перевір /api/v1/nexus/chat або конфіг LLM провайдерів');
            } finally {
                setIsGenerating(false);
            }
        })();
    };

    const handleStartTraining = () => {
        if (trainingStatus === 'TRAINING') return;
        setTrainingStatus('TRAINING');
        setProgress(0);
        setTrainingLogs([`[INIT] Запит на запуск тренування...`]);

        (async () => {
            try {
                await api.v25.training.trigger();
                toast.success('Тренування запущено', 'Очікуй оновлення статусу');
            } catch (e) {
                toast.error('Training endpoint недоступний', 'Перевір /api/v25/training/trigger');
                setTrainingStatus('IDLE');
            }
        })();
    };

    const renderInference = () => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col h-[650px] relative">
                <TacticalCard variant="holographic" title={`Нейронний Інтерфейс: ${activeModel}`} className="flex-1 flex flex-col p-0 overflow-hidden glass-morphism panel-3d" noPadding>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-950/20 backdrop-blur-3xl">
                        {chatHistory.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-slate-700 gap-6 text-center px-12">
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} className="p-8 bg-slate-900/50 rounded-full border border-white/5"><BrainCircuit size={64} className="opacity-10" /></motion.div>
                                <p className="text-sm font-bold uppercase tracking-[0.2em] max-w-sm">Синаптичний зв'язок активний. Вікно контексту: 128k. Температура: 0.70</p>
                            </div>
                        )}
                        <AnimatePresence initial={false}>
                            {chatHistory.map((msg, idx) => (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-blue-600/10 border border-blue-500/30 text-blue-100 rounded-br-none shadow-[0_0_20px_rgba(37,99,235,0.1)]'
                                        : 'bg-white/5 border border-white/10 text-slate-300 rounded-bl-none backdrop-blur-xl'
                                        }`}>
                                        {msg.role === 'assistant' && <div className="text-[10px] text-blue-400 font-extrabold mb-2 tracking-[0.3em] uppercase flex items-center gap-2">Присутність Ядра</div>}
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        <div ref={chatEndRef} />
                    </div>
                    <div className="p-6 bg-slate-950/80 border-t border-white/5">
                        <div className="flex gap-4 p-2 bg-slate-900/60 rounded-2xl border border-white/5 focus-within:border-blue-500/50 transition-all">
                            <input
                                value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Передати аналітичну директиву..."
                                className="flex-1 bg-transparent border-none rounded p-3 text-sm text-slate-200 outline-none placeholder-slate-700"
                                disabled={isGenerating}
                            />
                            <motion.button
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={handleSendMessage} disabled={isGenerating || !userPrompt}
                                className="p-3 bg-blue-600 text-white rounded-xl shadow-lg disabled:opacity-20"
                            >
                                {isGenerating ? <RefreshCw className="animate-spin" size={20} /> : <Send size={20} />}
                            </motion.button>
                        </div>
                        <div className="flex justify-between items-center mt-4 text-[9px] font-mono font-bold uppercase tracking-widest text-slate-600 px-2">
                            <div className="flex gap-4">
                                <span className="flex items-center gap-2"><Zap size={10} className="text-blue-500" /> {genMetrics.tps} TPS</span>
                                <span className="flex items-center gap-2"><Activity size={10} className="text-emerald-500" /> {genMetrics.ttft}мс TTFT</span>
                            </div>
                            <span>{genMetrics.totalTokens} Токенів Оброблено</span>
                        </div>
                    </div>
                </TacticalCard>
            </div>

            <div className="space-y-6">
                <TacticalCard variant="holographic" title="Параметри Ядра" className="glass-morphism panel-3d">
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">Нейронні Директиви</label>
                            <textarea
                                value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)}
                                className="w-full h-32 bg-slate-950/50 border border-white/10 rounded-2xl p-4 text-xs text-slate-400 font-mono leading-relaxed focus:border-blue-500/30 outline-none resize-none transition-all"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            {['Темп', 'Top-P'].map(p => (
                                <div key={p}>
                                    <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-2 block">{p}</label>
                                    <input type="range" className="w-full accent-blue-500 bg-slate-900" />
                                </div>
                            ))}
                        </div>
                    </div>
                </TacticalCard>

                <TacticalCard variant="holographic" title="Конфігурація Роутера Моделей" className="glass-morphism panel-3d">
                    <div className="space-y-4">
                        {[
                            { name: 'Локальна Llama-3', status: 'АКТИВНО', type: 'CORE', model: 'v25.0 Meta' },
                            { name: 'Gemini 3 Ultra', status: 'РЕЖИМ ОЧІКУВАННЯ', type: 'CLOUD', model: 'DeepMind API' },
                        ].map((p, i) => (
                            <motion.div whileHover={{ x: 4 }} key={i} className="p-4 bg-slate-950/80 border border-white/5 rounded-2xl flex justify-between items-center group">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2.5 rounded-xl border ${p.type === 'CORE' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 'bg-purple-500/10 border-purple-500/20 text-purple-500'}`}><Cpu size={16} /></div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-100">{p.name}</div>
                                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{p.model}</div>
                                    </div>
                                </div>
                                <div className="text-[10px] font-bold text-emerald-500/50 group-hover:text-emerald-500 transition-colors uppercase tracking-widest">стабільно</div>
                            </motion.div>
                        ))}
                    </div>
                </TacticalCard>
            </div>
        </motion.div>
    );

    const renderTraining = () => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <TacticalCard variant="holographic" title="Консоль Точного Налаштування LoRA" className="glass-morphism panel-3d">
                <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                        {(Object.keys(TRAINING_CONFIGS) as TrainingDomain[]).map((dom) => (
                            <button
                                key={dom} onClick={() => setTrainingDomain(dom)}
                                className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all duration-300 ${trainingDomain === dom
                                    ? 'bg-blue-600/10 border-blue-500 text-white shadow-blue-500/10 shadow-xl'
                                    : 'bg-slate-950/50 border-white/5 text-slate-700 hover:border-slate-800'
                                    }`}
                            >
                                <div className={`p-2 rounded-xl border ${trainingDomain === dom ? 'bg-blue-500 text-white' : 'bg-slate-900 border-white/5'}`}>{TRAINING_CONFIGS[dom].icon}</div>
                                <span className="text-[11px] font-bold uppercase tracking-widest">{dom}</span>
                            </button>
                        ))}
                    </div>

                    <div className="p-6 bg-slate-950/50 rounded-3xl border border-white/5">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-display font-bold text-slate-200 text-lg uppercase tracking-wider">{TRAINING_CONFIGS[trainingDomain].label}</h3>
                            <span className="text-[9px] font-extrabold text-blue-500 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20 uppercase tracking-[0.2em]">Adapter Node v0.4</span>
                        </div>

                        {trainingStatus !== 'IDLE' && (
                            <div className="mb-8">
                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3 px-1">
                                    <span>Прогрес Синхронізації</span>
                                    <span className="text-blue-400 font-mono text-lg">{progress.toFixed(0)}%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5 group">
                                    <motion.div
                                        initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-400 shadow-[0_0_15px_blue]"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="h-48 overflow-y-auto custom-scrollbar bg-black/40 p-4 rounded-2xl border border-white/5 font-mono text-[10px] space-y-3 relative group">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><Microscope size={64} /></div>
                            {trainingLogs.length === 0 ? (
                                <div className="text-slate-800 italic uppercase tracking-widest text-center mt-12 font-bold">Очікування авторизації ядра...</div>
                            ) : (
                                trainingLogs.map((log, i) => (
                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={i} className="text-blue-400/60 flex items-center gap-4">
                                        <ChevronRight size={10} className="text-blue-800" /> {log}
                                    </motion.div>
                                ))
                            )}
                            <div ref={logsEndRef} />
                        </div>
                    </div>

                    <div className="flex justify-center gap-6">
                        <motion.button whileHover={{ scale: 1.02 }} className="px-10 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 text-[10px] uppercase tracking-widest flex items-center gap-3 disabled:opacity-20" onClick={handleStartTraining} disabled={trainingStatus === 'TRAINING'}>
                            {trainingStatus === 'TRAINING' ? <RefreshCw className="animate-spin" size={14} /> : <Play size={14} />}
                            Ініціалізувати Навчання
                        </motion.button>
                    </div>
                </div>
            </TacticalCard>

            <TacticalCard variant="holographic" title="Стан Матриці AutoML" className="glass-morphism panel-3d">
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 bg-slate-950/50 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-blue-500/20 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-slate-900 rounded-xl"><LineChartIcon size={16} className="text-slate-600" /></div>
                                <div>
                                    <div className="text-xs font-bold text-slate-200">Експеримент Розширення #{i}</div>
                                    <div className="text-[9px] text-slate-500 font-mono mt-1">Цільовий кластер: <span className="text-blue-500">K-Forensics</span></div>
                                </div>
                            </div>
                            <div className="text-[10px] font-bold text-emerald-500/50 px-3 py-1 bg-emerald-500/5 rounded-lg border border-emerald-500/10">ЗБІЖНІСТЬ</div>
                        </div>
                    ))}
                    <button className="w-full py-4 border border-dashed border-white/5 text-slate-700 hover:text-slate-200 hover:border-blue-500/50 rounded-2xl text-[10px] uppercase tracking-[0.3em] font-bold transition-all mt-6">
                        Синтезувати Новий Шлях
                    </button>
                </div>
            </TacticalCard>
        </motion.div>
    );

    const renderDSPy = () => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <TacticalCard variant="holographic" title="Двигун Оптимізації Промптів DSPy" className="glass-morphism panel-3d" action={
                <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setDspyOptimizing(!dspyOptimizing)}
                    className={`px-6 py-2 rounded-xl text-[10px] font-bold flex items-center gap-3 border transition-all uppercase tracking-widest ${dspyOptimizing ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-500'}`}
                >
                    {dspyOptimizing ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                    {dspyOptimizing ? 'Запущено' : 'Мобілізувати'}
                </motion.button>
            }>
                <div className="h-[280px] w-full mb-8 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dspyData}>
                            <defs>
                                <linearGradient id="dspyGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                            <XAxis dataKey="iter" stroke="#475569" fontSize={10} hide />
                            <YAxis domain={[0, 100]} hide />
                            <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#ffffff10', borderRadius: '12px' }} />
                            <Area type="monotone" dataKey="score" stroke="#a855f7" fill="url(#dspyGrad)" strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="space-y-4">
                    {([] as DSPyOptimization[]).map(mod => (
                        <div key={mod.id} className="p-5 bg-slate-950/80 border border-white/5 rounded-3xl group hover:border-purple-500/30 transition-all cursor-default">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_#a855f7]" />
                                    <div>
                                        <div className="text-xs font-bold text-slate-100 uppercase tracking-widest">{mod.moduleName}</div>
                                        <div className="text-[10px] text-slate-600 font-mono">Ціль: {mod.targetMetric}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-purple-400 font-mono">{mod.currentScore.toFixed(1)}%</div>
                                    <div className="text-[10px] text-emerald-500 font-bold tracking-widest">
                                        {mod.status === 'OPTIMIZING' ? 'ОПТИМІЗАЦІЯ' : 'ЗБІЖНІСТЬ'} | ДЕЛЬТА {mod.lastImprovement}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-black/30 p-4 rounded-2xl border border-white/5 border-dashed text-[10px] font-mono text-slate-500 italic leading-relaxed">
                                "{mod.bestPromptSnippet}"
                            </div>
                        </div>
                    ))}
                </div>
            </TacticalCard>

            <TacticalCard variant="holographic" title="Потік Логів Bootstrap" className="glass-morphism panel-3d">
                <div className="h-[600px] overflow-y-auto custom-scrollbar font-mono text-[11px] space-y-3 p-4 bg-slate-950/30 rounded-3xl border border-white/5 relative">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03]"><Sparkles size={120} /></div>
                    {dspyOptimizing && (
                        <div className="space-y-3">
                            <div className="text-purple-400 font-bold uppercase tracking-widest">&gt;&gt; Ініціалізація циклу BootstrapFewShot...</div>
                            <div className="text-slate-600">[v25.Compiler] Генерація 12 кандидатів промптів для семантичної рівності...</div>
                            <div className="text-slate-600">[v25.Evaluator] Виконання тестів на 100 шардах...</div>
                            <motion.div animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity }} className="text-emerald-500/80 font-bold">&gt;&gt; Кандидат #4 Прийнято. Метрика: +4.2% Точність Логіки.</motion.div>
                            <div className="text-slate-700 italic border-l border-white/10 pl-4 py-2 opacity-60">"Кандидат демонструє кращу часову дизамбігуацію в юридичних контекстах."</div>
                        </div>
                    )}
                    {!dspyOptimizing && <div className="text-slate-800 text-center mt-32 font-bold uppercase tracking-[0.3em]">Синаптичний двигун у простої. Очікування стратегічної директиви.</div>}
                </div>
            </TacticalCard>
        </motion.div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 w-full max-w-[1600px] mx-auto relative z-10 min-h-screen">
            <AdvancedBackground />
            <ViewHeader
                title="НЕЙРОННЕ ЯДРО ІНТЕЛЕКТУ"
                icon={<BrainCircuit size={20} className="icon-3d-purple" />}
                breadcrumbs={['СИНАПСИС', 'СИСТЕМА', 'ШІ ЯДРО']}
                stats={[
                    { label: 'Модель', value: activeModel, icon: <Cpu size={14} />, color: 'primary' },
                    { label: 'Пам\'ять VRAM', value: `${metrics.gpu.vram.toFixed(1)} ГБ`, icon: <Activity size={14} />, color: 'primary' },
                    { label: 'Оптимізатор', value: dspyOptimizing ? 'АКТИВНИЙ' : 'ГОТОВИЙ', icon: <Sparkles size={14} />, color: 'success' },
                ]}
                actions={[
                    <button key="v" onClick={speakMetrics} className="p-3 bg-slate-900/50 border border-white/10 rounded-2xl text-slate-500 hover:text-white transition-all backdrop-blur-md shadow-xl"><Volume2 size={22} /></button>
                ]}
            />

            <div className="flex p-1 bg-slate-950/50 backdrop-blur-3xl border border-white/5 rounded-2xl overflow-x-auto scrollbar-hide">
                {[
                    { id: 'INFERENCE', label: 'Діалог', icon: MessageSquare },
                    { id: 'TRAINING', label: 'Навчання', icon: Layers },
                    { id: 'DSPY', label: 'Оптимізація', icon: Sparkles },
                    { id: 'AUTOML', label: 'Матриця AutoML', icon: Settings },
                ].map(tab => (
                    <button
                        key={tab.id} onClick={() => setActiveTab(tab.id as LLMTab)}
                        className={`
                            flex-1 min-w-[200px] py-4 rounded-2xl text-[10px] font-black transition-all flex items-center justify-center gap-4 relative overflow-hidden group uppercase tracking-[0.2em]
                            ${activeTab === tab.id ? 'bg-slate-800 text-white shadow-2xl' : 'text-slate-500 hover:text-slate-300'}
                        `}
                    >
                        <tab.icon size={18} />
                        <span>{tab.label}</span>
                        {activeTab === tab.id && <motion.div layoutId="llmTabGlow" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 shadow-[0_0_15px_#3b82f6]" />}
                    </button>
                ))}
            </div>

            <div className="min-h-[600px]">
                {activeTab === 'INFERENCE' && renderInference()}
                {activeTab === 'TRAINING' && renderTraining()}
                {activeTab === 'DSPY' && renderDSPy()}
                {activeTab === 'AUTOML' && renderTraining()}
            </div>
        </div>
    );
};

export default LLMView;
