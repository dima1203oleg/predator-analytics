/**
 * Predator v45 | Neural Analytics — ЗАВОД: Система Автоматичного Доопрацювання Програми
 * Auto-Fix Factory · AZR Unified Brain · Self-Improvement Engine
 */

import { AnimatePresence, motion } from 'framer-motion';
import {
    Activity,
    AlertTriangle,
    Bot,
    Brain,
    CheckCircle,
    ChevronRight,
    Clock,
    Code2,
    Cpu,
    Factory,
    Flame,
    GitMerge,
    HardDrive,
    Layers,
    Play,
    RefreshCw,
    Shield,
    Sparkles,
    Terminal,
    TrendingUp,
    Wrench,
    XCircle,
    Zap
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

// ─── Mock live logs ────────────────────────────────────────────────────────────
const LOG_TEMPLATES = [
    { level: 'INFO', text: 'AZR CORTEX → Цикл OODA розпочато' },
    { level: 'INFO', text: 'AUTO-AGENT → Перевірка здоров\'я системи...' },
    { level: 'OK', text: 'SSH → Підключення встановлено (194.177.1.240:6666)' },
    { level: 'INFO', text: 'Docker → Перевірка контейнерів (backend, frontend, postgres, redis)...' },
    { level: 'OK', text: 'API → /health повернув статус 200 OK' },
    { level: 'INFO', text: 'TECH_SPEC → Читання цілей v45.0: Search Quality, Performance' },
    { level: 'WARN', text: 'Latency P99 = 245ms (ціль < 200ms) → ініціюємо авто-патч' },
    { level: 'INFO', text: 'Генеруємо гіпотезу: Redis кешування API Gateway' },
    { level: 'OK', text: 'Рада Безпеки → 4/5 агентів схвалили (Shield, Gauge, Scale, Activity)' },
    { level: 'INFO', text: 'Патч розгортається на NVIDIA сервері...' },
    { level: 'OK', text: 'Деплой завершено. Latency P99 = 187ms ✓' },
    { level: 'INFO', text: 'Merkle Truth Ledger → Запис підтверджено (hash: a3f8d...)' },
    { level: 'OK', text: 'OODA цикл #142 завершено. Покоління: 43' },
    { level: 'INFO', text: 'Наступна оцінка через 2г 14хв...' },
];

// ─── Types ─────────────────────────────────────────────────────────────────────
interface LogEntry {
    id: string;
    ts: string;
    level: 'INFO' | 'OK' | 'WARN' | 'ERROR';
    text: string;
}

interface PipelineStage {
    id: string;
    label: string;
    status: 'done' | 'active' | 'pending' | 'error';
    icon: React.ElementType;
    color: string;
    detail?: string;
}

interface FixCard {
    id: string;
    title: string;
    component: string;
    type: string;
    impact: string;
    risk: 'low' | 'medium' | 'high';
    status: 'queued' | 'running' | 'done' | 'failed';
    council: number;
    progress?: number;
}

// ─── Static data ───────────────────────────────────────────────────────────────
const AXIOMS = [
    { code: 'AX-09', name: 'Обмежене Самовдосконалення', detail: 'Rate limits та рівні затвердження' },
    { code: 'AX-10', name: 'Незмінне Ядро', detail: 'Стан-машини незмінні після затвердження' },
    { code: 'AX-11', name: 'Криптографічне Зобов\'язання', detail: 'Merkle Truth Ledger підписує кожну зміну' },
    { code: 'AX-12', name: 'Мульти-партійна Відповідальність', detail: 'Консенсус 3/5 агентів Ради Безпеки' },
    { code: 'AX-15', name: 'Технічний Суверенітет', detail: 'Python 3.12, Українська мова, локальний контроль' },
    { code: 'AX-16', name: 'Автономна Еволюція', detail: 'Самонавчання через OODA loop' },
];

const AGENTS = [
    { name: 'Щит', label: 'security_expert', icon: Shield, color: 'rose', active: true },
    { name: 'Продуктивність', label: 'perf_engineer', icon: Cpu, color: 'blue', active: true },
    { name: 'Етика', label: 'ethics_compliance', icon: Layers, color: 'purple', active: true },
    { name: 'Стабільність', label: 'stability_analyst', icon: Activity, color: 'emerald', active: true },
    { name: 'Конституція', label: 'constitutional_lawyer', icon: Brain, color: 'amber', active: false },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
const ts = () => new Date().toLocaleTimeString('uk-UA', { hour12: false });

const riskColors: Record<string, string> = {
    low: 'emerald', medium: 'amber', high: 'rose'
};
const statusColors: Record<string, string> = {
    queued: 'slate', running: 'cyan', done: 'emerald', failed: 'rose'
};
const statusLabels: Record<string, string> = {
    queued: 'у черзі', running: 'виконується', done: 'готово', failed: 'помилка'
};

// ─── Component ─────────────────────────────────────────────────────────────────
const AutoFactoryView: React.FC = () => {
    const [tab, setTab] = useState<'pipeline' | 'fixes' | 'axioms' | 'terminal'>('pipeline');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isRunning, setIsRunning] = useState(true);
    const [generation, setGeneration] = useState(42);
    const [cycle, setCycle] = useState(141);
    const [successRate, setSuccessRate] = useState(87);
    const logIndexRef = useRef(0);
    const logsEndRef = useRef<HTMLDivElement>(null);

    const [pipeline, setPipeline] = useState<PipelineStage[]>([
        { id: 'observe', label: 'Спостереження', status: 'done', icon: Activity, color: 'slate', detail: 'Метрики зібрано' },
        { id: 'orient', label: 'Орієнтація', status: 'done', icon: Brain, color: 'blue', detail: 'Аналіз завершено' },
        { id: 'decide', label: 'Рішення', status: 'active', icon: Zap, color: 'amber', detail: 'Генерація гіпотез...' },
        { id: 'act', label: 'Дія', status: 'pending', icon: Wrench, color: 'emerald', detail: '' },
        { id: 'reflect', label: 'Рефлексія', status: 'pending', icon: TrendingUp, color: 'purple', detail: '' },
    ]);

    const [fixes, setFixes] = useState<FixCard[]>([
        { id: 'f1', title: 'Redis кешування API Gateway', component: 'api_gateway', type: 'performance', impact: '35% зниження латентності', risk: 'low', status: 'done', council: 5, progress: 100 },
        { id: 'f2', title: 'HNSW+IVF гібридний індекс', component: 'vector_db', type: 'algorithmic', impact: '25% прискорення пошуку', risk: 'medium', status: 'running', council: 4, progress: 62 },
        { id: 'f3', title: 'Оптимізація SQL запитів ETL', component: 'etl_pipeline', type: 'code_quality', impact: '18% виграш продуктивності', risk: 'low', status: 'queued', council: 0 },
        { id: 'f4', title: 'Rate-limiting middleware', component: 'auth_service', type: 'security', impact: 'Захист від DDoS', risk: 'high', status: 'queued', council: 0 },
    ]);

    // Live log streamer
    useEffect(() => {
        if (!isRunning) return;
        const interval = setInterval(() => {
            const template = LOG_TEMPLATES[logIndexRef.current % LOG_TEMPLATES.length];
            logIndexRef.current++;
            setLogs(prev => [...prev.slice(-80), {
                id: `${Date.now()}-${Math.random()}`,
                ts: ts(),
                level: template.level as LogEntry['level'],
                text: template.text,
            }]);
        }, 1400);
        return () => clearInterval(interval);
    }, [isRunning]);

    // Pipeline advancement
    useEffect(() => {
        if (!isRunning) return;
        const interval = setInterval(() => {
            setPipeline(prev => {
                const active = prev.findIndex(p => p.status === 'active');
                if (active === -1 || active === prev.length - 1) {
                    // Reset cycle
                    setCycle(c => c + 1);
                    setGeneration(g => g + 1);
                    setSuccessRate(r => Math.min(99, r + Math.random() > 0.7 ? 1 : 0));
                    return prev.map((p, i) => ({
                        ...p,
                        status: i === 0 ? 'active' : 'pending',
                    } as PipelineStage));
                }
                return prev.map((p, i) => ({
                    ...p,
                    status: i < active ? 'done' : i === active + 1 ? 'active' : i > active + 1 ? 'pending' : 'done',
                } as PipelineStage));
            });
        }, 3200);
        return () => clearInterval(interval);
    }, [isRunning]);

    // Fix progress update
    useEffect(() => {
        if (!isRunning) return;
        const interval = setInterval(() => {
            setFixes(prev => prev.map(f => {
                if (f.status === 'running') {
                    const newProg = Math.min(100, (f.progress || 0) + Math.floor(Math.random() * 5 + 1));
                    return { ...f, progress: newProg, status: newProg >= 100 ? 'done' : 'running', council: newProg >= 100 ? 5 : f.council };
                }
                return f;
            }));
        }, 800);
        return () => clearInterval(interval);
    }, [isRunning]);

    // Scroll logs to bottom
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const triggerManualCycle = useCallback(() => {
        setLogs(prev => [...prev, { id: `${Date.now()}`, ts: ts(), level: 'INFO', text: '🔄 Ручний запуск OODA циклу ...' }]);
    }, []);

    const logColors: Record<LogEntry['level'], string> = {
        INFO: 'text-slate-400',
        OK: 'text-emerald-400',
        WARN: 'text-amber-400',
        ERROR: 'text-rose-400',
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#0a0f2e] to-[#020617] p-6 relative overflow-hidden">

            {/* Background ambience */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-orange-600/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-cyan-600/5 rounded-full blur-[100px]" />
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(30,41,59,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(30,41,59,0.15) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }} />
            </div>

            <div className="relative z-10">

                {/* ── HEADER ── */}
                <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-5">
                        <motion.div
                            className="relative p-5 rounded-3xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 shadow-2xl shadow-orange-500/30"
                            animate={{ boxShadow: ['0 25px 50px -12px rgba(249,115,22,0.4)', '0 25px 50px -12px rgba(234,179,8,0.4)', '0 25px 50px -12px rgba(249,115,22,0.4)'] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        >
                            <Factory size={36} className="text-white" />
                            <motion.div
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-400 rounded-full border-2 border-[#020617] flex items-center justify-center"
                                animate={{ scale: [1, 1.4, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            </motion.div>
                        </motion.div>

                        <div>
                            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-200 to-amber-300 tracking-tight">
                                ЗАВОД
                            </h1>
                            <p className="text-slate-400 mt-1 flex items-center gap-2 text-sm">
                                <Flame size={14} className="text-orange-400" />
                                Система Автоматичного Доопрацювання Програми
                                <span className="text-slate-600">•</span>
                                <span className="text-orange-400 font-mono font-bold">AZR v40.0</span>
                                <span className="text-slate-600">•</span>
                                <span className="font-mono text-cyan-400">GEN {generation}</span>
                            </p>
                        </div>
                    </div>

                    {/* Live Status Bar */}
                    <div className="flex items-center gap-3">
                        <motion.div
                            className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-800/60 rounded-2xl border border-slate-700/50 backdrop-blur-xl"
                        >
                            <motion.div
                                className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-emerald-400' : 'bg-slate-500'}`}
                                animate={isRunning ? { opacity: [1, 0.3, 1] } : {}}
                                transition={{ duration: 1.2, repeat: Infinity }}
                            />
                            <span className="text-sm font-semibold text-slate-200">
                                {isRunning ? 'АКТИВНИЙ' : 'ЗУПИНЕНО'}
                            </span>
                            <span className="text-slate-500 text-xs font-mono">ЦИКЛ #{cycle}</span>
                        </motion.div>

                        <motion.button
                            onClick={() => setIsRunning(r => !r)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-4 py-2.5 rounded-2xl border text-sm font-bold transition-all ${isRunning
                                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                }`}
                        >
                            {isRunning ? <><XCircle size={16} className="inline mr-1.5" />Стоп</> : <><Play size={16} className="inline mr-1.5" />Старт</>}
                        </motion.button>

                        <motion.button
                            onClick={triggerManualCycle}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-2xl text-sm font-bold hover:bg-orange-500/20 transition-all"
                        >
                            <RefreshCw size={16} className="inline mr-1.5" />Запустити
                        </motion.button>
                    </div>
                </div>

                {/* ── KPI CARDS ── */}
                <div className="grid grid-cols-5 gap-4 mb-8">
                    {[
                        { label: 'Покоління', value: generation, sub: 'OODA ітерацій', icon: GitMerge, grad: 'from-violet-500 to-purple-600' },
                        { label: 'Успішність', value: `${successRate}%`, sub: 'авто-патчів', icon: CheckCircle, grad: 'from-emerald-500 to-teal-500' },
                        { label: 'Активних задач', value: fixes.filter(f => f.status === 'running').length, sub: 'зараз в роботі', icon: Wrench, grad: 'from-orange-500 to-amber-500' },
                        { label: 'Завершено', value: fixes.filter(f => f.status === 'done').length, sub: 'патчів сьогодні', icon: Zap, grad: 'from-cyan-500 to-blue-500' },
                        { label: 'Аксіоми', value: `${AXIOMS.length}/6`, sub: 'дотримано', icon: Shield, grad: 'from-rose-500 to-pink-500' },
                    ].map((card, i) => {
                        const Icon = card.icon;
                        return (
                            <motion.div
                                key={card.label}
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                                whileHover={{ y: -4, scale: 1.01 }}
                                className="relative overflow-hidden bg-gradient-to-br from-slate-900/80 to-slate-950/80 border border-slate-700/40 rounded-2xl p-5 backdrop-blur-sm"
                            >
                                <div className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-br ${card.grad} opacity-10 blur-2xl`} />
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-slate-400 text-xs font-medium">{card.label}</span>
                                        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${card.grad} bg-opacity-20`}>
                                            <Icon size={16} className="text-white" />
                                        </div>
                                    </div>
                                    <div className={`text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r ${card.grad}`}>
                                        {card.value}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">{card.sub}</div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* ── TABS ── */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                    {[
                        { id: 'pipeline', label: 'OODA Конвеєр', icon: GitMerge },
                        { id: 'fixes', label: 'Авто-Патчі', icon: Wrench },
                        { id: 'axioms', label: 'Аксіоми AZR', icon: Shield },
                        { id: 'terminal', label: 'Live Термінал', icon: Terminal },
                    ].map(t => {
                        const Icon = t.icon;
                        const active = tab === t.id;
                        return (
                            <motion.button
                                key={t.id}
                                onClick={() => setTab(t.id as typeof tab)}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${active
                                        ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/40 text-white'
                                        : 'bg-slate-800/40 border border-slate-700/40 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                                    }`}
                            >
                                <Icon size={16} className={active ? 'text-orange-400' : ''} />
                                {t.label}
                                {active && (
                                    <motion.div
                                        layoutId="factoryTabBar"
                                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full"
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                {/* ── TAB CONTENT ── */}
                <AnimatePresence mode="wait">
                    {/* OODA Pipeline */}
                    {tab === 'pipeline' && (
                        <motion.div key="pipeline" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-6">
                            {/* Pipeline visualization */}
                            <div className="bg-slate-900/60 border border-slate-700/40 rounded-3xl p-8 backdrop-blur-sm">
                                <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-2">
                                    <GitMerge size={20} className="text-orange-400" />
                                    OODA Loop · Цикл #{cycle}
                                </h3>
                                <div className="flex items-center justify-between gap-2">
                                    {pipeline.map((stage, i) => {
                                        const Icon = stage.icon;
                                        const isActive = stage.status === 'active';
                                        const isDone = stage.status === 'done';
                                        return (
                                            <React.Fragment key={stage.id}>
                                                <motion.div
                                                    className={`flex-1 flex flex-col items-center gap-3 py-5 px-4 rounded-2xl border-2 transition-all ${isActive
                                                            ? 'bg-gradient-to-b from-amber-500/15 to-orange-500/10 border-orange-500/50 shadow-lg shadow-orange-500/20'
                                                            : isDone
                                                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                                                : 'bg-slate-800/30 border-slate-700/40 opacity-50'
                                                        }`}
                                                    animate={isActive ? { scale: [1, 1.02, 1] } : {}}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                >
                                                    <div className={`p-3.5 rounded-xl ${isActive ? 'bg-gradient-to-br from-orange-500/30 to-amber-500/30'
                                                            : isDone ? 'bg-emerald-500/20'
                                                                : 'bg-slate-700/50'
                                                        }`}>
                                                        <Icon size={26} className={
                                                            isActive ? 'text-orange-300'
                                                                : isDone ? 'text-emerald-400'
                                                                    : 'text-slate-500'
                                                        } />
                                                    </div>
                                                    <div className={`font-bold text-sm text-center ${isActive ? 'text-white' : isDone ? 'text-emerald-300' : 'text-slate-500'
                                                        }`}>
                                                        {stage.label}
                                                    </div>
                                                    {stage.detail && (
                                                        <div className="text-xs text-slate-500 text-center">{stage.detail}</div>
                                                    )}
                                                    {isActive && (
                                                        <motion.div
                                                            className="w-2 h-2 rounded-full bg-orange-400"
                                                            animate={{ opacity: [1, 0.2, 1] }}
                                                            transition={{ duration: 0.9, repeat: Infinity }}
                                                        />
                                                    )}
                                                    {isDone && <CheckCircle size={16} className="text-emerald-400" />}
                                                </motion.div>
                                                {i < pipeline.length - 1 && (
                                                    <ChevronRight size={22} className={isDone ? 'text-emerald-400' : 'text-slate-600'} />
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Safety Council */}
                            <div className="bg-slate-900/60 border border-slate-700/40 rounded-3xl p-6 backdrop-blur-sm">
                                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                    <Shield size={18} className="text-purple-400" />
                                    Рада Безпеки AZR
                                </h3>
                                <p className="text-slate-500 text-sm mb-6">
                                    Мульти-агентна система затвердження. Мінімум 3/5 для деплою.
                                </p>
                                <div className="grid grid-cols-5 gap-4">
                                    {AGENTS.map((agent, i) => {
                                        const Icon = agent.icon;
                                        return (
                                            <motion.div
                                                key={agent.name}
                                                initial={{ opacity: 0, y: 16 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                whileHover={{ y: -4 }}
                                                className="flex flex-col items-center gap-3 p-4 bg-slate-800/40 rounded-2xl border border-slate-700/30 hover:border-slate-600/50 transition-all"
                                            >
                                                <div className={`w-14 h-14 rounded-2xl bg-${agent.color}-500/20 border border-${agent.color}-500/30 flex items-center justify-center`}>
                                                    <Icon size={26} className={`text-${agent.color}-400`} />
                                                </div>
                                                <div className="text-white text-xs font-semibold text-center">{agent.name}</div>
                                                <div className="flex items-center gap-1.5">
                                                    <motion.div
                                                        className={`w-2 h-2 rounded-full ${agent.active ? 'bg-emerald-400' : 'bg-slate-500'}`}
                                                        animate={agent.active ? { scale: [1, 1.4, 1] } : {}}
                                                        transition={{ duration: 1.5, repeat: Infinity }}
                                                    />
                                                    <span className={`text-[10px] font-semibold ${agent.active ? 'text-emerald-400' : 'text-slate-500'}`}>
                                                        {agent.active ? 'АКТИВНИЙ' : 'ОЧІКУЄ'}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Auto-Fixes */}
                    {tab === 'fixes' && (
                        <motion.div key="fixes" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Wrench size={18} className="text-orange-400" />
                                    Черга Авто-Патчів
                                </h3>
                                <span className="text-xs text-slate-500 font-mono">{fixes.length} у черзі</span>
                            </div>

                            {fixes.map((fix, i) => {
                                const rc = riskColors[fix.risk] || 'slate';
                                const sc = statusColors[fix.status] || 'slate';
                                const sl = statusLabels[fix.status] || fix.status;
                                return (
                                    <motion.div
                                        key={fix.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.08 }}
                                        className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-5 backdrop-blur-sm hover:border-slate-600/50 transition-all"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1.5">
                                                    <h4 className="text-white font-bold">{fix.title}</h4>
                                                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full bg-${sc}-500/15 text-${sc}-400 border border-${sc}-500/25 font-semibold`}>
                                                        {sl}
                                                    </span>
                                                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full bg-${rc}-500/15 text-${rc}-400 border border-${rc}-500/25`}>
                                                        {fix.risk === 'low' ? 'низький ризик' : fix.risk === 'medium' ? 'середній ризик' : 'високий ризик'}
                                                    </span>
                                                </div>
                                                <div className="flex gap-4 text-sm text-slate-400">
                                                    <span>Компонент: <span className="text-slate-200 font-mono">{fix.component}</span></span>
                                                    <span>Тип: <span className="text-slate-200">{fix.type}</span></span>
                                                    <span className="text-emerald-400 font-semibold">↑ {fix.impact}</span>
                                                </div>
                                            </div>
                                            <div className="text-right pl-6">
                                                <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
                                                    {fix.council}/5
                                                </div>
                                                <div className="text-[10px] text-slate-500">агентів схвалили</div>
                                            </div>
                                        </div>

                                        {fix.status === 'running' && (
                                            <div className="mt-3">
                                                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                                                    <span>Прогрес деплою</span>
                                                    <span className="text-cyan-400 font-mono">{fix.progress}%</span>
                                                </div>
                                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                                                        style={{ width: `${fix.progress}%` }}
                                                        transition={{ duration: 0.5 }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {fix.status === 'done' && (
                                            <div className="flex items-center gap-2 mt-2 text-emerald-400 text-sm">
                                                <CheckCircle size={16} />
                                                <span>Патч успішно задеплоєно та верифіковано Merkle Ledger</span>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}

                    {/* Axioms */}
                    {tab === 'axioms' && (
                        <motion.div key="axioms" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                            <div className="bg-slate-900/60 border border-slate-700/40 rounded-3xl p-6 backdrop-blur-sm mb-5">
                                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                    <Shield size={18} className="text-violet-400" />
                                    Конституційні Аксіоми AZR v40
                                </h3>
                                <p className="text-slate-500 text-sm mb-6">
                                    Незмінні принципи, що керують автономною еволюцією системи.
                                    Порушення → автоматичне заморожування процесу.
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    {AXIOMS.map((ax, i) => (
                                        <motion.div
                                            key={ax.code}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.07 }}
                                            whileHover={{ scale: 1.02 }}
                                            className="flex gap-4 p-4 bg-slate-800/40 rounded-2xl border border-slate-700/30 hover:border-violet-500/30 transition-all group"
                                        >
                                            <div>
                                                <div className="font-black text-[11px] text-violet-400 font-mono mb-1">{ax.code}</div>
                                                <div className="text-white font-semibold text-sm mb-0.5">{ax.name}</div>
                                                <div className="text-slate-500 text-xs">{ax.detail}</div>
                                            </div>
                                            <CheckCircle size={18} className="text-emerald-400 shrink-0 mt-0.5 ml-auto" />
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Merkle ledger status */}
                            <motion.div
                                className="bg-gradient-to-br from-slate-900/80 to-violet-900/20 border border-violet-500/20 rounded-3xl p-6 backdrop-blur-sm"
                                whileHover={{ borderColor: 'rgba(139,92,246,0.4)' }}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 rounded-xl bg-violet-500/20">
                                        <HardDrive size={20} className="text-violet-400" />
                                    </div>
                                    <div>
                                        <div className="text-white font-bold">Merkle Truth Ledger</div>
                                        <div className="text-slate-500 text-xs">Криптографічний аудит-журнал всіх змін</div>
                                    </div>
                                    <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                                        <motion.div className="w-2 h-2 rounded-full bg-emerald-400" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                                        <span className="text-emerald-400 text-xs font-bold">VERIFIED</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { label: 'Записів', value: `${1240 + cycle}` },
                                        { label: 'Останній хеш', value: 'a3f8d2...b91c' },
                                        { label: 'Цілісність', value: '100%' },
                                    ].map(m => (
                                        <div key={m.label} className="bg-slate-800/50 rounded-xl p-3">
                                            <div className="text-slate-500 text-xs mb-1">{m.label}</div>
                                            <div className="text-white font-mono font-bold">{m.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* Terminal */}
                    {tab === 'terminal' && (
                        <motion.div key="terminal" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                            <div className="bg-[#020613] border border-slate-700/40 rounded-3xl overflow-hidden backdrop-blur-sm">
                                {/* Terminal header */}
                                <div className="flex items-center gap-3 px-5 py-3 bg-slate-900/80 border-b border-slate-700/40">
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-rose-500" />
                                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                    </div>
                                    <div className="flex-1 flex items-center gap-2">
                                        <Terminal size={14} className="text-slate-500" />
                                        <span className="text-slate-500 text-xs font-mono">predator-auto-agent · live</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {isRunning && (
                                            <motion.div
                                                className="w-2 h-2 rounded-full bg-emerald-400"
                                                animate={{ opacity: [1, 0, 1] }}
                                                transition={{ duration: 1, repeat: Infinity }}
                                            />
                                        )}
                                        <span className="text-[10px] font-mono text-slate-500">
                                            {isRunning ? 'live' : 'paused'}
                                        </span>
                                    </div>
                                </div>

                                {/* Log stream */}
                                <div className="h-[480px] overflow-y-auto p-5 font-mono text-xs space-y-0.5 custom-scrollbar">
                                    <div className="text-emerald-500 mb-4">
                                        {`╔════════════════════════════════════════╗`}<br />
                                        {`║  PREDATOR AUTO-AGENT v40  ·  AZR CORE ║`}<br />
                                        {`╚════════════════════════════════════════╝`}
                                    </div>
                                    {logs.map(log => (
                                        <div key={log.id} className="flex gap-3">
                                            <span className="text-slate-600 shrink-0">{log.ts}</span>
                                            <span className={`shrink-0 font-bold ${log.level === 'OK' ? 'text-emerald-400'
                                                    : log.level === 'WARN' ? 'text-amber-400'
                                                        : log.level === 'ERROR' ? 'text-rose-400'
                                                            : 'text-cyan-400'
                                                }`}>
                                                [{log.level}]
                                            </span>
                                            <span className={logColors[log.level]}>{log.text}</span>
                                        </div>
                                    ))}
                                    {isRunning && (
                                        <div className="flex gap-3 mt-1">
                                            <span className="text-slate-600">{ts()}</span>
                                            <span className="text-cyan-400">[INFO]</span>
                                            <span className="text-slate-400 flex items-center gap-1">
                                                <motion.span
                                                    animate={{ opacity: [1, 0, 1] }}
                                                    transition={{ duration: 0.8, repeat: Infinity }}
                                                >█</motion.span>
                                            </span>
                                        </div>
                                    )}
                                    <div ref={logsEndRef} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── BOTTOM STATS ── */}
                <div className="mt-6 grid grid-cols-3 gap-4">
                    {[
                        {
                            icon: Bot, color: 'cyan', label: 'Auto-Completer',
                            items: ['scripts/auto_completer.py', 'SSH Health Check', 'Docker Watchdog', 'API /health probe']
                        },
                        {
                            icon: Brain, color: 'violet', label: 'AZR Unified Brain',
                            items: ['OODA Loop (24/7)', 'Merkle Truth Ledger', 'Knowledge Graph', 'Red Team Agent']
                        },
                        {
                            icon: Code2, color: 'orange', label: 'Цикл Деплою',
                            items: ['Git pull → Build', 'Docker compose up', 'NVIDIA GPU Priority', 'Rollback захист']
                        },
                    ].map(block => {
                        const Icon = block.icon;
                        return (
                            <div key={block.label} className={`bg-slate-900/60 border border-${block.color}-500/20 rounded-2xl p-5 backdrop-blur-sm`}>
                                <div className="flex items-center gap-2 mb-4">
                                    <Icon size={16} className={`text-${block.color}-400`} />
                                    <span className="text-white font-bold text-sm">{block.label}</span>
                                </div>
                                <div className="space-y-2">
                                    {block.items.map(it => (
                                        <div key={it} className="flex items-center gap-2 text-xs text-slate-400">
                                            <div className={`w-1 h-1 rounded-full bg-${block.color}-500`} />
                                            <span className="font-mono">{it}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default AutoFactoryView;
