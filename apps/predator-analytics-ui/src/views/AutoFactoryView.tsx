/**
 * Predator v55 | Industrial Sovereign Nexus — ЗАВОД: Когнітивна Система Самовдосконалення
 * Потужний центр автономного синтезу, де дані перетворюються на код.
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
    Zap,
    Cpu as Processor,
    ShieldCheck,
    Dna,
    Network,
    Database,
    Binary,
    Search
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import { HoloContainer } from '../components/HoloContainer';
import { CyberOrb } from '../components/CyberOrb';
import { cn } from '../utils/cn';

// ─── Mock live logs ────────────────────────────────────────────────────────────
const LOG_TEMPLATES = [
    { level: 'INFO', text: 'AZR CORTEX → Ініціалізація когнітивного циклу OODA' },
    { level: 'INFO', text: 'AUTO-AGENT → Сканування системної архітектури на дефекти...' },
    { level: 'OK', text: 'SSH → Захищений тунель активовано (194.177.1.240:6666)' },
    { level: 'INFO', text: 'Docker → Синхронізація мікросервісів (Core, Ingestion, Analytics)...' },
    { level: 'OK', text: 'API → Стан здоров\'я вузлів: 100% (200 OK)' },
    { level: 'INFO', text: 'TECH_SPEC → Завантаження пріоритетів v55: Neural Synthesis & Speed' },
    { level: 'WARN', text: 'Latency P99 = 242ms (Поріг < 200ms) → Запуск автономного виправлення' },
    { level: 'INFO', text: 'Гіпотеза Г08: Асинхронне кешування результатів семантичного пошуку' },
    { level: 'OK', text: 'Рада Безпеки → Консенсус досягнуто (4/5). Схвалено: Security, Perf, Stability.' },
    { level: 'INFO', text: 'Синтезований патч розгортається на кластері NVIDIA H100...' },
    { level: 'OK', text: 'Деплой завершено. Нова затримка P99 = 184ms. Результат стабільний.' },
    { level: 'INFO', text: 'Merkle Truth Ledger → Блок #89,241 запечатано (hash: a3f8d...)' },
    { level: 'OK', text: 'Цикл OODA #1,482 завершено. Нове покоління: 45' },
    { level: 'INFO', text: 'Наступна системна оцінка через 2г 14хв...' },
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
    { code: 'AX-09', name: 'Контрольована Еволюція', detail: 'Обмеження швидкості змін та багаторівневе схвалення' },
    { code: 'AX-10', name: 'Незмінність Ядра', detail: 'Критичні стани системи захищені від автоматичних змін' },
    { code: 'AX-11', name: 'Криптографічний Слід', detail: 'Merkle Truth Ledger фіксує кожен крок автономного агента' },
    { code: 'AX-12', name: 'Колективний Розум', detail: 'Обов\'язковий консенсус Ради Безпеки (мінімум 3/5)' },
    { code: 'AX-15', name: 'Цифровий Суверенітет', detail: 'Локальне виконання, Python 3.12, повна українізація' },
    { code: 'AX-16', name: 'Рефлексивне Навчання', detail: 'Кожна помилка стає основою для нових правил безпеки' },
];

const AGENTS = [
    { name: 'Страж П', label: 'security_expert', icon: ShieldCheck, color: 'rose', active: true },
    { name: 'Інженер Т', label: 'perf_engineer', icon: Processor, color: 'blue', active: true },
    { name: 'Арбітр Е', label: 'ethics_compliance', icon: Scale, color: 'purple', active: true },
    { name: 'Сенсор С', label: 'stability_analyst', icon: Activity, color: 'emerald', active: true },
    { name: 'Юрист К', label: 'constitutional_lawyer', icon: Lock, color: 'amber', active: false },
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
    queued: 'у черзі', running: 'виконується', done: 'інтегровано', failed: 'відхилено'
};

const AutoFactoryView: React.FC = () => {
    const [tab, setTab] = useState<'pipeline' | 'fixes' | 'axioms' | 'terminal'>('pipeline');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isRunning, setIsRunning] = useState(true);
    const [generation, setGeneration] = useState(45);
    const [cycle, setCycle] = useState(1482);
    const [successRate, setSuccessRate] = useState(92);
    const logIndexRef = useRef(0);
    const logsEndRef = useRef<HTMLDivElement>(null);

    const [pipeline, setPipeline] = useState<PipelineStage[]>([
        { id: 'observe', label: 'Спостереження', status: 'done', icon: Search, color: 'slate', detail: 'Метрики зібрано' },
        { id: 'orient', label: 'Орієнтація', status: 'done', icon: Brain, color: 'blue', detail: 'Аналіз контексту' },
        { id: 'decide', label: 'Дизайн Рішення', status: 'active', icon: Zap, color: 'amber', detail: 'Синтез патчу...' },
        { id: 'act', label: 'Впровадження', status: 'pending', icon: Wrench, color: 'emerald', detail: '' },
        { id: 'reflect', label: 'Рефлексія', status: 'pending', icon: TrendingUp, color: 'purple', detail: '' },
    ]);

    const [fixes, setFixes] = useState<FixCard[]>([
        { id: 'f1', title: 'Оптимізація кешування API Gateway', component: 'api_gateway', type: 'performance', impact: '35% зниження латентності', risk: 'low', status: 'done', council: 5, progress: 100 },
        { id: 'f2', title: 'Гібридний індекс HNSW+IVF', component: 'vector_db', type: 'algorithmic', impact: '25% прискорення пошуку', risk: 'medium', status: 'running', council: 4, progress: 68 },
        { id: 'f3', title: 'Рефакторинг ETL-запитів PostgreSQL', component: 'etl_pipeline', type: 'code_quality', impact: '18% менше CPU', risk: 'low', status: 'queued', council: 0 },
        { id: 'f4', title: 'Система динамічного Rate-limiting', component: 'auth_service', type: 'security', impact: 'Захист від DDoS-атак', risk: 'high', status: 'queued', council: 0 },
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
        }, 1800);
        return () => clearInterval(interval);
    }, [isRunning]);

    // Pipeline advancement
    useEffect(() => {
        if (!isRunning) return;
        const interval = setInterval(() => {
            setPipeline(prev => {
                const active = prev.findIndex(p => p.status === 'active');
                if (active === -1 || active === prev.length - 1) {
                    setCycle(c => c + 1);
                    setGeneration(g => g + 1);
                    setSuccessRate(r => Math.min(99, r + (Math.random() > 0.8 ? 1 : 0)));
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
        }, 4500);
        return () => clearInterval(interval);
    }, [isRunning]);

    // Fix progress update
    useEffect(() => {
        if (!isRunning) return;
        const interval = setInterval(() => {
            setFixes(prev => prev.map(f => {
                if (f.status === 'running') {
                    const newProg = Math.min(100, (f.progress || 0) + Math.floor(Math.random() * 4 + 1));
                    return { ...f, progress: newProg, status: newProg >= 100 ? 'done' : 'running', council: newProg >= 100 ? 5 : f.council };
                }
                return f;
            }));
        }, 1200);
        return () => clearInterval(interval);
    }, [isRunning]);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const triggerManualCycle = useCallback(() => {
        setLogs(prev => [...prev, { id: `${Date.now()}`, ts: ts(), level: 'INFO', text: '⚡ Ручний запуск когнітивного циклу OODA — Примусово... ' }]);
    }, []);

    return (
        <div className="min-h-screen bg-[#02040a] text-slate-200 relative overflow-hidden font-sans">
            {/* V55 Background Matrix */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.05),transparent_70%)]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/10 blur-[150px] rounded-full" />
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-600/10 blur-[120px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(249,115,22,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.03) 1px, transparent 1px)',
                    backgroundSize: '32px 32px'
                }} />
            </div>

            <div className="relative z-10 max-w-[1600px] mx-auto p-4 sm:p-8 space-y-8 pb-24">
                {/* Header Section */}
                <ViewHeader
                    title="ІНДУСТРІАЛЬНИЙ СУВЕРЕННИЙ НЕКСУС"
                    icon={<Factory size={22} className="text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" />}
                    breadcrumbs={['ЦИТАДЕЛЬ', 'АВТОНОМНИЙ ЗАВОД', 'OODA LOOP']}
                    stats={[
                        { label: 'Статус', value: isRunning ? 'АКТИВНИЙ' : 'ПАУЗА', icon: <Activity size={14} />, color: isRunning ? 'success' : 'warning', animate: isRunning },
                        { label: 'Покоління', value: `v${generation}.0`, icon: <GitMerge size={14} />, color: 'primary' },
                        { label: 'Цикл', value: `#${cycle}`, icon: <RefreshCw size={14} />, color: 'indigo' },
                    ]}
                    actions={
                        <div className="flex gap-4">
                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                                onClick={triggerManualCycle}
                                className="px-6 py-2.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-full text-[10px] font-black tracking-widest uppercase hover:bg-orange-500/20 transition-all shadow-lg flex items-center gap-2"
                            >
                                <Sparkles size={14} /> РУЧНИЙ СИНТЕЗ
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                                onClick={() => setIsRunning(!isRunning)}
                                className={cn(
                                    "px-8 py-2.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase flex items-center gap-2 transition-all shadow-xl",
                                    isRunning ? "bg-rose-600/90 text-white shadow-rose-900/40" : "bg-emerald-600/90 text-white shadow-emerald-900/40"
                                )}
                            >
                                {isRunning ? <><PauseIcon size={14} /> СТОП</> : <><Play size={14} /> СТАРТ</>}
                            </motion.button>
                        </div>
                    }
                />

                {/* KPI Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    {[
                        { label: 'ЕВОЛЮЦІЙНИЙ СТЕК', value: cycle, sub: 'Циклів OODA', icon: GitMerge, color: '#a855f7' },
                        { label: 'КОЕФІЦІЄНТ УСПІХУ', value: `${successRate}%`, sub: 'Адаптивність', icon: CheckCircle, color: '#10b981' },
                        { label: 'КРИТИЧНІ ПАТЧІ', value: fixes.filter(f => f.status === 'running').length, sub: 'Обробка зараз', icon: Wrench, color: '#f97316' },
                        { label: 'БАЗА ЗНАНЬ', value: '1,24к', sub: 'Записів у Ledger', icon: Database, color: '#06b6d4' },
                        { label: 'АКСІОМИ', value: '6/6', sub: 'Дотримано', icon: ShieldCheck, color: '#ec4899' },
                    ].map((m, idx) => (
                        <TacticalCard key={m.label} variant="holographic" className="panel-3d" noPadding>
                            <div className="p-6 relative group">
                                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                                    <m.icon size={32} style={{ color: m.color }} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-500 tracking-widest uppercase">{m.label}</p>
                                    <h3 className="text-4xl font-black tracking-tighter text-white">{m.value}</h3>
                                    <p className="text-[11px] text-slate-400 font-medium">{m.sub}</p>
                                </div>
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-10" style={{ color: m.color }} />
                            </div>
                        </TacticalCard>
                    ))}
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-4 p-1 bg-slate-900/40 backdrop-blur-xl rounded-[24px] border border-white/5 w-fit">
                    {[
                        { id: 'pipeline', label: 'НЕЙРОННИЙ КОНВЕЄР', icon: Network },
                        { id: 'fixes', label: 'МАТРИЦЯ ПАТЧІВ', icon: Binary },
                        { id: 'axioms', label: 'КОНСТИТУЦІЯ AZR', icon: Shield },
                        { id: 'terminal', label: 'ЖИВИЙ ПОТІК ЯДРА', icon: Terminal },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id as any)}
                            className={cn(
                                "flex items-center gap-3 px-6 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all",
                                tab === t.id ? "bg-orange-500 text-white shadow-lg shadow-orange-900/40" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                            )}
                        >
                            <t.icon size={16} /> {t.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[600px]">
                    <div className="lg:col-span-2 space-y-8">
                        <AnimatePresence mode="wait">
                            {tab === 'pipeline' && (
                                <motion.div key="pipeline" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                                    <TacticalCard variant="holographic" title="АРХІТЕКТУРА КОГНІТИВНОГО ЦИКЛУ" className="panel-3d overflow-visible">
                                        <div className="py-12 px-4 relative flex items-center justify-between gap-2">
                                            {/* Connecting lines */}
                                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-orange-500/0 via-orange-500/20 to-orange-500/0 -translate-y-1/2" />

                                            {pipeline.map((stage, i) => {
                                                const Icon = stage.icon;
                                                const isActive = stage.status === 'active';
                                                const isDone = stage.status === 'done';

                                                return (
                                                    <div key={stage.id} className="relative z-10 flex flex-col items-center gap-4 flex-1">
                                                        <motion.div
                                                            className={cn(
                                                                "w-20 h-20 rounded-3xl flex items-center justify-center border-2 transition-all relative overflow-hidden",
                                                                isActive ? "bg-orange-500/20 border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.4)] scale-110" :
                                                                    isDone ? "bg-emerald-500/10 border-emerald-500/40" : "bg-slate-900 border-white/5 opacity-40"
                                                            )}
                                                            animate={isActive ? { scale: [1.1, 1.15, 1.1] } : {}}
                                                        >
                                                            {isActive && (
                                                                <motion.div
                                                                    className="absolute inset-0 bg-orange-500/20"
                                                                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                                />
                                                            )}
                                                            <Icon size={32} className={isActive ? "text-orange-400" : isDone ? "text-emerald-400" : "text-slate-500"} />
                                                            {isDone && (
                                                                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full shadow-lg">
                                                                    <CheckCircle size={12} />
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                        <div className="text-center">
                                                            <p className={cn("text-[11px] font-black uppercase tracking-widest", isActive ? "text-orange-400" : isDone ? "text-emerald-400" : "text-slate-600")}>
                                                                {stage.label}
                                                            </p>
                                                            <p className="text-[10px] text-slate-500 mt-1">{stage.detail}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </TacticalCard>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <TacticalCard variant="holographic" title="РАДА АРБІТРАЖУ AZR" className="panel-3d h-full">
                                            <div className="space-y-4 py-4">
                                                {AGENTS.map((agent, i) => (
                                                    <div key={agent.name} className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                                        <div className={cn("p-2.5 rounded-xl", `bg-${agent.color}-500/20 text-${agent.color}-400`)}>
                                                            <agent.icon size={20} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-xs font-black text-white uppercase tracking-tighter">{agent.name}</p>
                                                            <p className="text-[10px] text-slate-500 font-mono tracking-tight">{agent.label}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <motion.div
                                                                className={cn("w-2 h-2 rounded-full", agent.active ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-slate-600")}
                                                                animate={agent.active ? { scale: [1, 1.3, 1] } : {}}
                                                                transition={{ repeat: Infinity, duration: 2 }}
                                                            />
                                                            <span className={cn("text-[9px] font-black uppercase", agent.active ? "text-emerald-400" : "text-slate-600")}>
                                                                {agent.active ? 'Активний' : 'Очікування'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </TacticalCard>

                                        <TacticalCard variant="holographic" title="ВІЗУАЛІЗАЦІЯ ЯДРА" className="panel-3d flex items-center justify-center p-0 overflow-hidden relative min-h-[300px]">
                                            <CyberOrb
                                                size={220}
                                                color="#f97316"
                                                intensity={0.6}
                                                pulse={isRunning}
                                                className="drop-shadow-[0_0_50px_rgba(249,115,22,0.3)]"
                                            />
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                <div className="text-[10px] font-black text-orange-500/50 uppercase tracking-[0.5em] mb-2">Synthesis Active</div>
                                                <div className="text-2xl font-black text-white font-mono opacity-80">{generation}.{cycle % 100}</div>
                                            </div>
                                        </TacticalCard>
                                    </div>
                                </motion.div>
                            )}

                            {tab === 'fixes' && (
                                <motion.div key="fixes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                                    <div className="grid grid-cols-1 gap-4">
                                        {fixes.map((fix, i) => (
                                            <TacticalCard key={fix.id} variant="holographic" className="panel-3d group">
                                                <div className="flex flex-col md:flex-row items-center gap-6">
                                                    <div className={cn(
                                                        "w-16 h-16 rounded-2xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-110",
                                                        fix.status === 'done' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                                                            fix.status === 'running' ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" : "bg-slate-800 border-white/5 text-slate-500"
                                                    )}>
                                                        {fix.type === 'performance' ? <Zap size={28} /> : fix.type === 'algorithmic' ? <Dna size={28} /> : <Code2 size={28} />}
                                                    </div>
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex items-center gap-3">
                                                            <h4 className="text-lg font-black text-white uppercase tracking-tight">{fix.title}</h4>
                                                            <span className={cn(
                                                                "text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest border",
                                                                statusColors[fix.status] === 'emerald' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                                                                    statusColors[fix.status] === 'cyan' ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" : "bg-slate-800 border-white/5 text-slate-500"
                                                            )}>
                                                                {statusLabels[fix.status]}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                            <span>Ціль: <span className="text-slate-300">{fix.component}</span></span>
                                                            <span>Вплив: <span className="text-emerald-400">{fix.impact}</span></span>
                                                            <span>Ризик: <span className={cn(riskColors[fix.risk] === 'rose' ? "text-rose-500" : riskColors[fix.risk] === 'amber' ? "text-amber-500" : "text-emerald-500")}>{fix.risk}</span></span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <div className="text-3xl font-black text-orange-500 tracking-tighter">{fix.council}/5</div>
                                                        <div className="text-[10px] font-black text-slate-600 uppercase">Згода агентури</div>
                                                    </div>
                                                </div>
                                                {fix.status === 'running' && (
                                                    <div className="mt-6 space-y-2">
                                                        <div className="flex justify-between text-[10px] font-black text-slate-500 tracking-widest uppercase">
                                                            <span>Розгортання Синтезу</span>
                                                            <span className="text-cyan-400">{fix.progress}%</span>
                                                        </div>
                                                        <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5 p-[1px]">
                                                            <motion.div
                                                                className="h-full bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${fix.progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </TacticalCard>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {tab === 'axioms' && (
                                <motion.div key="axioms" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {AXIOMS.map((ax, i) => (
                                            <TacticalCard key={ax.code} variant="holographic" className="panel-3d group hover:border-orange-500/30 transition-all">
                                                <div className="flex gap-5">
                                                    <div className="shrink-0 w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-orange-500/50 transition-colors">
                                                        <span className="text-orange-500 font-black text-xs font-mono">{ax.code}</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className="text-sm font-black text-white uppercase tracking-tight">{ax.name}</h4>
                                                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{ax.detail}</p>
                                                    </div>
                                                    <div className="ml-auto flex items-center h-fit">
                                                        <ShieldCheck className="text-emerald-500/50" size={20} />
                                                    </div>
                                                </div>
                                            </TacticalCard>
                                        ))}
                                    </div>

                                    <TacticalCard variant="holographic" className="p-0 overflow-hidden border-orange-500/20">
                                        <div className="bg-gradient-to-r from-orange-500/10 via-transparent to-transparent p-6 flex flex-col md:flex-row items-center gap-6">
                                            <div className="p-4 bg-orange-500/20 rounded-3xl border border-orange-500/30">
                                                <HardDrive size={32} className="text-orange-400" />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <h4 className="text-lg font-black text-white uppercase tracking-tight">Merkle Truth Ledger · Сховище Цілісності</h4>
                                                <p className="text-xs text-slate-500 font-medium italic">"Кожна зміна закарбована в часі та захищена криптографічним консенсусом."</p>
                                            </div>
                                            <div className="flex items-center gap-3 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                                                <motion.div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 2 }} />
                                                <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Цілісність: 100%</span>
                                            </div>
                                        </div>
                                    </TacticalCard>
                                </motion.div>
                            )}

                            {tab === 'terminal' && (
                                <motion.div key="terminal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                                    <TacticalCard variant="holographic" className="p-0 border-none h-[650px] flex flex-col overflow-hidden bg-black/80 backdrop-blur-2xl rounded-3xl border border-white/5 shadow-2xl">
                                        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/80 border-b border-white/5">
                                            <div className="flex gap-2.5">
                                                <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                                                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                                                <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Terminal size={14} className="text-slate-500" />
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">azr-kernel-synapse · live</span>
                                            </div>
                                            <div className="w-16 h-1 flex justify-end">
                                                {isRunning && <motion.div className="w-2 h-2 rounded-full bg-emerald-500" animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1 }} />}
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-6 font-mono text-[11px] leading-relaxed custom-scrollbar bg-[rgba(2,4,10,0.5)]">
                                            <div className="text-orange-500/60 mb-6 font-black tracking-tighter leading-none opacity-80">
                                                <pre>{`
    █▀▀█ █▀▀█ █▀▀ █▀▀▄ █▀▀█ ▀▀█▀▀ █▀▀█ █▀▀█
    █  █ █▄▄▀ █▀▀ █  █ █▄▄█   █   █  █ █▄▄▀
    █▀▀▀ ▀ ▀▀ ▀▀▀ ▀▀▀  ▀  ▀   ▀   ▀▀▀▀ ▀ ▀▀
    SYSTEM AUTONOMOUS FIX FACTORY v55.0.1
    ──────────────────────────────────────`}</pre>
                                            </div>

                                            <div className="space-y-1.5">
                                                {logs.map(log => (
                                                    <div key={log.id} className="flex gap-4 group">
                                                        <span className="text-slate-700 shrink-0 group-hover:text-slate-500 transition-colors">{log.ts}</span>
                                                        <span className={cn(
                                                            "shrink-0 font-black",
                                                            log.level === 'OK' ? "text-emerald-500" :
                                                                log.level === 'WARN' ? "text-amber-500" :
                                                                    log.level === 'ERROR' ? "text-rose-500" : "text-cyan-500"
                                                        )}>
                                                            [{log.level}]
                                                        </span>
                                                        <span className={cn(
                                                            "group-hover:text-slate-100 transition-colors",
                                                            log.level === 'INFO' ? "text-slate-400" :
                                                                log.level === 'OK' ? "text-emerald-200" :
                                                                    log.level === 'WARN' ? "text-amber-200" : "text-rose-200"
                                                        )}>
                                                            {log.text}
                                                        </span>
                                                    </div>
                                                ))}
                                                {isRunning && (
                                                    <div className="flex gap-4 animate-pulse">
                                                        <span className="text-slate-700">{ts()}</span>
                                                        <span className="text-cyan-500 font-black">[KERN]</span>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-white">Синхронізація нейронних ваг...</span>
                                                            <motion.div
                                                                className="w-2 h-4 bg-orange-500"
                                                                animate={{ opacity: [1, 0, 1] }}
                                                                transition={{ repeat: Infinity, duration: 0.8 }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                                <div ref={logsEndRef} />
                                            </div>
                                        </div>
                                    </TacticalCard>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="space-y-8">
                        <TacticalCard variant="holographic" title="НЕЙРОННА АКТИВНІСТЬ" className="panel-3d">
                            <div className="h-[200px] w-full flex items-center justify-center relative bg-slate-900/30 rounded-2xl border border-white/5 overflow-hidden">
                                <div className="absolute inset-0 opacity-20">
                                    <div className="w-full h-full bg-[linear-gradient(90deg,transparent_0%,rgba(249,115,22,0.5)_50%,transparent_100%)] bg-[length:200%_100%] animate-scan" style={{ animation: 'scan 2s linear infinite' }} />
                                </div>
                                <div className="flex flex-col items-center gap-4 relative z-10">
                                    <Brain size={48} className="text-orange-500 animate-pulse" />
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</p>
                                        <p className="text-lg font-black text-white">DECISION ENGINE</p>
                                    </div>
                                </div>
                            </div>
                        </TacticalCard>

                        <TacticalCard variant="holographic" title="ДВИГУНИ АВТОНОМІЇ" className="panel-3d">
                            <div className="space-y-4">
                                {[
                                    { icon: Bot, label: 'Auto-Completer', status: 'Optimal', val: '99.4%' },
                                    { icon: Binary, label: 'Neural Fixer', status: 'Active', val: 'v45' },
                                    { icon: Terminal, label: 'CLI Watchdog', status: 'Secure', val: 'Locked' },
                                ].map(item => (
                                    <div key={item.label} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-800 rounded-lg text-orange-400">
                                                <item.icon size={16} />
                                            </div>
                                            <span className="text-[11px] font-black text-white uppercase tracking-tight">{item.label}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-black text-emerald-400 uppercase">{item.status}</div>
                                            <div className="text-[9px] text-slate-500 font-mono">{item.val}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TacticalCard>

                        <TacticalCard variant="holographic" title="ЕФЕКТИВНІСТЬ СИНТЕЗУ" className="panel-3d h-[300px]">
                            <div className="h-full w-full flex items-end gap-2 px-2 pb-6">
                                {[65, 82, 45, 98, 72, 85, 92, 55, 88].map((h, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                        <motion.div
                                            className="w-full bg-gradient-to-t from-orange-600/20 via-orange-500/40 to-orange-400 rounded-t-lg relative group"
                                            initial={{ height: 0 }}
                                            animate={{ height: `${h}%` }}
                                            transition={{ delay: i * 0.1, type: 'spring' }}
                                        >
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-black text-white opacity-0 group-hover:opacity-100 transition-opacity">{h}%</div>
                                        </motion.div>
                                    </div>
                                ))}
                            </div>
                            <div className="absolute bottom-2 left-0 w-full text-center text-[8px] font-black text-slate-600 uppercase tracking-widest">Historical Reliability Index</div>
                        </TacticalCard>
                    </div>
                </div>
            </div>

            {/* Scroll-to-top hidden anchor */}
            <div id="top" />

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes scan {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(100%); }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(249, 115, 22, 0.2);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(249, 115, 22, 0.4);
                }
                .animate-scan {
                    animation: scan 3s linear infinite;
                }
            `}} />
        </div>
    );
};

const PauseIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="4" width="4" height="16" />
        <rect x="14" y="4" width="4" height="16" />
    </svg>
);

export default AutoFactoryView;
