
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, Cpu, Zap, Activity, Layers, Target,
    Play, Square, RefreshCw, ChevronRight,
    LineChart as LineChartIcon, Shield, Search,
    Flame, Sparkles, Microscope
} from 'lucide-react';
import { AdvancedBackground } from '../components/AdvancedBackground';
import { TacticalCard } from '../components/TacticalCard';
import { HoloContainer } from '../components/HoloContainer';
import { ViewHeader } from '../components/ViewHeader';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, AreaChart, Area } from 'recharts';
import { premiumLocales } from '../locales/uk/premium';

/**
 * 🔬 Model Training View - The "Neural Laboratory"
 * Унікальний розділ для навчання та тюнінгу ШІ моделей.
 */

const MOCK_TRAINING_STATS = [
    { epoch: 1, loss: 2.5, accuracy: 30, val_loss: 2.8 },
    { epoch: 5, loss: 1.8, accuracy: 55, val_loss: 2.1 },
    { epoch: 10, loss: 1.2, accuracy: 72, val_loss: 1.5 },
    { epoch: 15, loss: 0.8, accuracy: 84, val_loss: 1.1 },
    { epoch: 20, loss: 0.5, accuracy: 91, val_loss: 0.8 },
    { epoch: 25, loss: 0.3, accuracy: 96, val_loss: 0.5 },
    { epoch: 30, loss: 0.15, accuracy: 98.5, val_loss: 0.35 },
];

const ModelTrainingView: React.FC = () => {
    const [trainingStatus, setTrainingStatus] = useState<'IDLE' | 'TRAINING' | 'COMPLETED'>('IDLE');
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [activeModel, setActiveModel] = useState('Predator-v45-Large');
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (trainingStatus === 'TRAINING') {
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        setTrainingStatus('COMPLETED');
                        return 100;
                    }
                    return prev + 0.5;
                });

                if (Math.random() > 0.7) {
                    const newLog = `[${new Date().toLocaleTimeString()}] Epoch ${Math.floor(progress / 3.3)}: Loss=${(0.5 * (1 - progress / 100)).toFixed(4)} Acc=${(70 + (progress / 100) * 29).toFixed(2)}%`;
                    setLogs(prev => [...prev.slice(-50), newLog]);
                }
            }, 200);
            return () => clearInterval(interval);
        }
    }, [trainingStatus, progress]);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const handleStartTraining = () => {
        setTrainingStatus('TRAINING');
        setProgress(0);
        setLogs(['[SYSTEM] Ініціалізація вагів моделі...', '[SYSTEM] Завантаження датасету "Customs-Elite-v4"...']);
    };

    return (
        <div className="min-h-screen bg-transparent relative overflow-hidden pb-20">
            <AdvancedBackground />

            {/* Neural lab ambiance */}
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute top-1/4 right-1/4 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-[1600px] mx-auto px-6 pt-10 relative z-10">

                <ViewHeader
                    title="НАВЧАННЯ МОДЕЛІ"
                    icon={<Brain size={24} className="text-purple-400" />}
                    breadcrumbs={['PREDATOR', 'NEURAL_LAB', 'TRAINING']}
                    stats={[
                        { label: 'МОДЕЛЬ', value: activeModel, icon: <Cpu size={14} />, color: 'primary' },
                        { label: 'ТОЧНІСТЬ', value: '98.5%', icon: <Target size={14} />, color: 'success' },
                        { label: 'VRAM', value: '24.2 GB', icon: <Activity size={14} />, color: 'warning' },
                    ]}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12">

                    {/* LEFT: Hardware & Params */}
                    <div className="lg:col-span-3 space-y-6">
                        <TacticalCard title="Апаратне Прискорення" subtitle="Статус NVIDIA A100" variant="glass">
                            <div className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">GPU LOAD</span>
                                        <span className="text-xs font-mono text-purple-400">89%</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-purple-600 to-blue-500"
                                            animate={{ width: '89%' }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TEMP</span>
                                        <span className="text-xs font-mono text-rose-400">72°C</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-orange-600 to-rose-500"
                                            animate={{ width: '72%' }}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                                        <p className="text-[8px] font-bold text-slate-500 uppercase">FP16 Training</p>
                                        <p className="text-xs font-black text-emerald-400">ACTIVE</p>
                                    </div>
                                    <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                                        <p className="text-[8px] font-bold text-slate-500 uppercase">Quantization</p>
                                        <p className="text-xs font-black text-blue-400">4-BIT</p>
                                    </div>
                                </div>
                            </div>
                        </TacticalCard>

                        <TacticalCard title="Гіперпараметри" subtitle="Налаштування нейромережі" variant="glass">
                            <div className="p-6 space-y-4">
                                {[
                                    { label: 'Learning Rate', val: '0.0003', icon: <Zap size={12} /> },
                                    { label: 'Batch Size', val: '64', icon: <Layers size={12} /> },
                                    { label: 'Context Win', val: '32k', icon: <Microscope size={12} /> },
                                    { label: 'DPO Beta', val: '0.1', icon: <Target size={12} /> },
                                ].map(p => (
                                    <div key={p.label} className="flex justify-between items-center p-3 bg-white/5 rounded-xl group hover:bg-white/10 transition-all">
                                        <div className="flex items-center gap-2">
                                            <span className="text-purple-400">{p.icon}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{p.label}</span>
                                        </div>
                                        <span className="text-xs font-mono text-white">{p.val}</span>
                                    </div>
                                ))}
                            </div>
                        </TacticalCard>
                    </div>

                    {/* MIDDLE: Visualizer & Charts */}
                    <div className="lg:col-span-6 space-y-6">
                        <TacticalCard variant="holographic" title="Нейронний Монітор" subtitle="Процес навчання в реальному часі">
                            <div className="p-6">
                                <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={MOCK_TRAINING_STATS}>
                                            <defs>
                                                <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                            <XAxis dataKey="epoch" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                                            <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                                itemStyle={{ fontSize: '12px' }}
                                            />
                                            <Area type="monotone" dataKey="accuracy" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorAcc)" name="Точність" />
                                            <Area type="monotone" dataKey="loss" stroke="#f43f5e" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorLoss)" name="Втрати" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="mt-8 flex justify-between items-end">
                                    <div className="space-y-2 flex-1 max-w-sm">
                                        <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                            <span>Прогрес Навчання</span>
                                            <span className="text-purple-400 font-mono text-lg">{progress.toFixed(1)}%</span>
                                        </div>
                                        <div className="h-3 bg-slate-900/50 rounded-full p-0.5 border border-white/5">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-purple-600 via-blue-500 to-emerald-400 rounded-full shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                                                animate={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-4 ml-8">
                                        {trainingStatus === 'TRAINING' ? (
                                            <button
                                                onClick={() => setTrainingStatus('IDLE')}
                                                className="px-8 py-3 bg-rose-600/10 border border-rose-500/30 text-rose-400 rounded-2xl font-black uppercase tracking-widest hover:bg-rose-600/20 transition-all flex items-center gap-2"
                                            >
                                                <Square size={16} /> Зупинити
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleStartTraining}
                                                className="px-10 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-purple-900/40 transition-all flex items-center gap-2"
                                            >
                                                <Play size={16} /> Навчати
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </TacticalCard>

                        {/* Recent Experiments Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { title: 'DPO Fine-tune', status: 'Converged', acc: '98.2%', date: '2г тому' },
                                { title: 'LoRA Adapter v4', status: 'Failed', acc: '42.1%', date: '5г тому' },
                            ].map((exp, i) => (
                                <HoloContainer key={i} variant="purple" className="p-4 border border-white/5 rounded-2xl group hover:border-purple-500/30 transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                            <Sparkles size={16} />
                                        </div>
                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${exp.status === 'Converged' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                            {exp.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-bold text-white mb-1">{exp.title}</h4>
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] text-slate-500 font-mono">{exp.date}</span>
                                        <span className="text-sm font-black text-purple-400">{exp.acc}</span>
                                    </div>
                                </HoloContainer>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: Logs & Assets */}
                    <div className="lg:col-span-3 space-y-6">
                        <TacticalCard title="Нейронні Логи" subtitle="Вивід консолі навчання" variant="glass">
                            <div className="h-[430px] overflow-y-auto p-4 font-mono text-[9px] space-y-2 bg-slate-950/80 rounded-2xl border border-white/5 custom-scrollbar">
                                {logs.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-700 italic">
                                        <Search size={32} className="mb-2 opacity-20" />
                                        <p>Очікування запуску...</p>
                                    </div>
                                ) : (
                                    logs.map((log, i) => (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            key={i}
                                            className="flex gap-3 text-slate-400"
                                        >
                                            <ChevronRight size={10} className="text-purple-600 shrink-0 mt-0.5" />
                                            <span>{log}</span>
                                        </motion.div>
                                    ))
                                )}
                                <div ref={logsEndRef} />
                            </div>
                        </TacticalCard>

                        <div className="p-6 bg-gradient-to-br from-purple-900/20 to-blue-900/10 border border-purple-500/20 rounded-3xl backdrop-blur-xl">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Shield size={14} className="text-purple-400" /> Вердикт Валідатора
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                        <Flame size={16} />
                                    </div>
                                    <p className="text-[11px] text-slate-400 leading-relaxed">
                                        Модель показує високу стабільність на <span className="text-emerald-400 font-bold">валідаційній вибірці</span>. Ризик оверфіттингу низький.
                                    </p>
                                </div>
                                <button className="w-full py-3 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-bold rounded-xl transition-all">
                                    Публікувати Ваги v45.2
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default ModelTrainingView;
