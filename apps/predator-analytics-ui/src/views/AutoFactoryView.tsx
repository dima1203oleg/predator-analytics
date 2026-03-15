/**
 * PREDATOR v55.5 | Industrial Sovereign Nexus — ЗАВОД: Когнітивна Система Самовдосконалення
 * 
 * Потужний центр автономного синтезу, де дані перетворюються на код.
 * - Інтеграція з AZR Cortex для автоматичного виправлення багів
 * - Візуалізація циклу OODA (Observe, Orient, Decide, Act)
 * - Матриця тактичних патчів та згода Ради Арбітражу
 * - Живий потік ядра системи (Kernel live stream)
 * 
 * © 2026 PREDATOR Analytics | Autonomous Self-Improvement
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Factory, Activity, Brain, CheckCircle, ChevronRight, 
    Clock, Code2, Cpu, Flame, GitMerge, HardDrive, 
    Layers, Lock, Play, RefreshCw, Scale, Shield, 
    Sparkles, Terminal, TrendingUp, Wrench, XCircle, 
    Zap, ShieldCheck, Dna, Network, Database, Binary, Search,
    Pause, AlertTriangle, Eye, Target, Star, BrainCircuit, PowerOff
} from 'lucide-react';
import { api } from '../services/api';
import { PageTransition } from '../components/layout/PageTransition';
import { TacticalCard } from '../components/TacticalCard';
import { Badge } from '../components/ui/badge';
import { AdvancedBackground } from '../components/AdvancedBackground';
import { CyberGrid } from '../components/CyberGrid';
import { CyberOrb } from '../components/CyberOrb';
import { ViewHeader } from '../components/ViewHeader';
import { cn } from '../utils/cn';

// ========================
// Mock Data & Templates
// ========================

const LOG_TEMPLATES = [
    { level: 'INFO', text: 'AZR CORTEX → Ініціалізація когнітивного циклу OODA v55.5' },
    { level: 'INFO', text: 'AUTO-AGENT → Сканування системної архітектури на дефекти...' },
    { level: 'OK', text: 'SSH → Захищений тунель активовано (194.177.1.240:6666)' },
    { level: 'INFO', text: 'Docker → Синхронізація мікросервісів (Core, Ingestion, Analytics)...' },
    { level: 'OK', text: 'API → Стан здоров\'я вузлів: 100% (200 OK)' },
    { level: 'INFO', text: 'TECH_SPEC → Завантаження пріоритетів v55.5: Neural Synthesis & Speed' },
    { level: 'WARN', text: 'Latency P99 = 242ms (Поріг < 200ms) → Запуск автономного виправлення' },
    { level: 'INFO', text: 'Гіпотеза Г08: Асинхронне кешування результатів семантичного пошуку' },
    { level: 'OK', text: 'Рада Безпеки → Консенсус досягнуто (4/5). Схвалено: Security, Perf, Stability.' },
    { level: 'INFO', text: 'Синтезований патч розгортається на кластері NVIDIA H100...' },
    { level: 'OK', text: 'Деплой завершено. Нова затримка P99 = 176ms. Результат стабільний.' },
    { level: 'INFO', text: 'Merkle Truth Ledger → Блок #91,482 запечатано (hash: a3f8d...)' },
    { level: 'OK', text: 'Цикл OODA #1,542 завершено. Нове покоління: v56.0-alpha' },
    { level: 'INFO', text: 'Наступна системна оцінка через 1г 45хв...' },
];

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
    { name: 'Інженер Т', label: 'perf_engineer', icon: Cpu, color: 'sky', active: true },
    { name: 'Арбітр Е', label: 'ethics_compliance', icon: Scale, color: 'indigo', active: true },
    { name: 'Сенсор С', label: 'stability_analyst', icon: Activity, color: 'emerald', active: true },
    { name: 'Юрист К', label: 'constitutional_lawyer', icon: Lock, color: 'amber', active: false },
];

// ========================
// Main Component
// ========================

const AutoFactoryView: React.FC = () => {
    const [tab, setTab] = useState<'pipeline' | 'fixes' | 'axioms' | 'terminal'>('pipeline');
    const [logs, setLogs] = useState<any[]>([]);
    const [isRunning, setIsRunning] = useState(true);
    const [generation, setGeneration] = useState(55);
    const [cycle, setCycle] = useState(1542);
    const [successRate, setSuccessRate] = useState(94.2);
    const logIndexRef = useRef(0);
    const logsEndRef = useRef<HTMLDivElement>(null);

    const [pipeline, setPipeline] = useState<any[]>([
        { id: 'observe', label: 'Спостереження', status: 'done', icon: Search, color: 'slate', detail: 'Метрики зібрано' },
        { id: 'orient', label: 'Орієнтація', status: 'done', icon: Brain, color: 'sky', detail: 'Аналіз контексту' },
        { id: 'decide', label: 'Дизайн Рішення', status: 'active', icon: Zap, color: 'amber', detail: 'Синтез патчу...' },
        { id: 'act', label: 'Впровадження', status: 'pending', icon: Wrench, color: 'emerald', detail: '' },
        { id: 'reflect', label: 'Рефлексія', status: 'pending', icon: TrendingUp, color: 'indigo', detail: '' },
    ]);

    const [fixes, setFixes] = useState<any[]>([
        { id: 'f1', title: 'Оптимізація кешування API Gateway', component: 'api_gateway', type: 'performance', impact: '35% зниження латентності', risk: 'low', status: 'done', council: 5, progress: 100 },
        { id: 'f2', title: 'Гібридний індекс HNSW+IVF', component: 'vector_db', type: 'algorithmic', impact: '25% прискорення пошуку', risk: 'medium', status: 'running', council: 4, progress: 68 },
        { id: 'f3', title: 'Рефакторинг ETL-запитів PostgreSQL', component: 'etl_pipeline', type: 'code_quality', impact: '18% менше CPU', risk: 'low', status: 'queued', council: 0 },
        { id: 'f4', title: 'Система динамічного Rate-limiting', component: 'auth_service', type: 'security', impact: 'Захист від DDoS-атак', risk: 'high', status: 'queued', council: 0 },
    ]);

    useEffect(() => {
        if (!isRunning) return;
        const interval = setInterval(() => {
            const template = LOG_TEMPLATES[logIndexRef.current % LOG_TEMPLATES.length];
            logIndexRef.current++;
            setLogs(prev => [...prev.slice(-80), {
                id: `${Date.now()}-${Math.random()}`,
                ts: new Date().toLocaleTimeString('uk-UA', { hour12: false }),
                level: template.level,
                text: template.text,
            }]);
        }, 2000);
        return () => clearInterval(interval);
    }, [isRunning]);

    useEffect(() => {
        if (!isRunning) return;
        const interval = setInterval(() => {
            setPipeline(prev => {
                const active = prev.findIndex(p => p.status === 'active');
                if (active === -1 || active === prev.length - 1) {
                    setCycle(c => c + 1);
                    setGeneration(g => g + (Math.random() > 0.9 ? 1 : 0));
                    setSuccessRate(r => Math.min(99.8, r + (Math.random() > 0.8 ? 0.1 : 0)));
                    return prev.map((p, i) => ({
                        ...p,
                        status: i === 0 ? 'active' : 'pending',
                        detail: i === 0 ? 'Спостереження активовано' : ''
                    }));
                }
                return prev.map((p, i) => ({
                    ...p,
                    status: i < active ? 'done' : i === active + 1 ? 'active' : i > active + 1 ? 'pending' : 'done',
                    detail: i === active + 1 ? 'Обробка на етапі ' + p.label : p.detail
                }));
            });
        }, 5000);
        return () => clearInterval(interval);
    }, [isRunning]);

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
        }, 1500);
        return () => clearInterval(interval);
    }, [isRunning]);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const triggerManualCycle = useCallback(() => {
        setLogs(prev => [...prev, { id: `${Date.now()}`, ts: new Date().toLocaleTimeString(), level: 'INFO', text: '⚡ Ручний запуск когнітивного циклу OODA — Примусово... ' }]);
    }, []);

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#02040a] text-slate-200 relative overflow-hidden font-sans pb-32">
                <AdvancedBackground />
                <CyberGrid color="rgba(249, 115, 22, 0.05)" />

                <div className="relative z-10 max-w-[1700px] mx-auto p-4 sm:p-8 lg:p-12 space-y-12">
                    
                    {/* View Header v55.5 */}
                    <ViewHeader
                        title={
                            <div className="flex items-center gap-8">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-orange-500/20 blur-[50px] rounded-full scale-150 animate-pulse" />
                                    <div className="relative w-16 h-16 bg-slate-900 border border-orange-500/20 rounded-2xl flex items-center justify-center panel-3d shadow-2xl">
                                        <Factory size={32} className="text-orange-400 drop-shadow-[0_0_15px_rgba(249, 115, 22, 0.8)]" />
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-4xl font-black text-white tracking-widest uppercase leading-none italic skew-x-[-4deg]">
                                        INDUSTRIAL <span className="text-orange-400">NEXUS</span>
                                    </h1>
                                    <p className="text-[10px] font-mono font-black text-orange-500/70 uppercase tracking-[0.6em] mt-3 flex items-center gap-3">
                                        <Sparkles size={12} className="animate-pulse" /> 
                                        SELF_EVOLUTION_ENGINE_v55.5
                                    </p>
                                </div>
                            </div>
                        }
                        icon={<Factory size={22} className="text-orange-400" />}
                        breadcrumbs={['ЦИТАДЕЛЬ', 'АВТОНОМНИЙ_ЗАВОД', 'СИНТЕЗ']}
                        stats={[
                            { label: 'СТАТУС_ЯДРА', value: isRunning ? 'АКТИВНИЙ' : 'ПАУЗА', color: isRunning ? 'success' : 'warning', icon: <Activity size={14} />, animate: isRunning },
                            { label: 'ПОКОЛІННЯ', value: `v${generation}.5`, color: 'primary', icon: <GitMerge size={14} /> },
                            { label: 'ЦИКЛ_OODA', value: `#${cycle}`, color: 'primary', icon: <RefreshCw size={14} /> }
                        ]}
                    />

                    {/* KPI Matrix */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                        {[
                            { label: 'ЕВОЛЮЦІЙНИЙ СТАРТ', value: cycle, sub: 'Циклів OODA', icon: GitMerge, color: 'indigo' },
                            { label: 'КОЕФІЦІЄНТ УСПІХУ', value: `${successRate}%`, sub: 'Адаптивність', icon: CheckCircle, color: 'emerald' },
                            { label: 'КРИТИЧНІ ПАТЧІ', value: fixes.filter(f => f.status === 'running').length, sub: 'Обробка зараз', icon: Wrench, color: 'orange' },
                            { label: 'БАЗА ЗНАНЬ', value: '1,42к', sub: 'Записів у Ledger', icon: Database, color: 'sky' },
                            { label: 'АКСІОМИ', value: '12/12', sub: 'Дотримано', icon: ShieldCheck, color: 'rose' },
                        ].map((m, idx) => (
                            <TacticalCard key={idx} variant="holographic" className="p-8 panel-3d border-white/5 bg-slate-900/40 relative group overflow-hidden">
                                <div className={cn(`absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity text-${m.color}-500`)}>
                                    <m.icon size={100} />
                                </div>
                                <div className="space-y-4 relative z-10">
                                    <p className="text-[10px] font-black text-slate-500 tracking-widest uppercase">{m.label}</p>
                                    <h3 className="text-4xl font-black tracking-tighter text-white italic">{m.value}</h3>
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{m.sub}</p>
                                </div>
                                <div className={cn(`absolute bottom-0 left-0 w-full h-1 bg-${m.color}-500/20`)} />
                            </TacticalCard>
                        ))}
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex flex-wrap gap-4 p-2 bg-slate-900/60 backdrop-blur-3xl rounded-[32px] border border-white/5 w-fit">
                        {[
                            { id: 'pipeline', label: 'НЕЙРОННИЙ КОНВЕЄР', icon: Network },
                            { id: 'fixes', label: 'МАТРИЦЯ ПАТЧІВ', icon: Binary },
                            { id: 'axioms', label: 'КОНСТИТУЦІЯ AZR', icon: Shield },
                            { id: 'terminal', label: 'ПОТІК ЯДРА', icon: Terminal },
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id as any)}
                                className={cn(
                                    "flex items-center gap-4 px-8 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                                    tab === t.id ? "bg-orange-500 text-white shadow-2xl shadow-orange-900/40" : "text-slate-500 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <t.icon size={16} /> {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        <div className="lg:col-span-8 space-y-12">
                            <AnimatePresence mode="wait">
                                {tab === 'pipeline' && (
                                    <motion.div key="pipeline" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-12">
                                        <TacticalCard variant="holographic" title="АРХІТЕКТУРА КОГНІТИВНОГО ЦИКЛУ" className="p-16 bg-orange-500/[0.01] border-orange-500/20 rounded-[60px] panel-3d">
                                            <div className="py-12 relative flex items-center justify-between gap-4">
                                                <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-orange-500/0 via-orange-500/20 to-orange-500/0 -translate-y-1/2" />

                                                {pipeline.map((stage, i) => {
                                                    const Icon = stage.icon;
                                                    const isActive = stage.status === 'active';
                                                    const isDone = stage.status === 'done';

                                                    return (
                                                        <div key={stage.id} className="relative z-10 flex flex-col items-center gap-6 flex-1">
                                                            <motion.div
                                                                className={cn(
                                                                    "w-24 h-24 rounded-[32px] flex items-center justify-center border-2 transition-all relative overflow-hidden panel-3d",
                                                                    isActive ? "bg-orange-950/40 border-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.4)] scale-125" :
                                                                        isDone ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-slate-900 border-white/5 opacity-30"
                                                                )}
                                                                animate={isActive ? { scale: [1.25, 1.35, 1.25] } : {}}
                                                                transition={{ repeat: Infinity, duration: 2 }}
                                                            >
                                                                <Icon size={36} className={isActive ? "text-orange-400" : isDone ? "text-emerald-400" : "text-slate-500"} />
                                                                {isDone && (
                                                                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-black p-1.5 rounded-full shadow-2xl border-4 border-slate-900">
                                                                        <CheckCircle size={14} />
                                                                    </div>
                                                                )}
                                                            </motion.div>
                                                            <div className="text-center">
                                                                <p className={cn("text-[11px] font-black uppercase tracking-[0.3em] italic", isActive ? "text-orange-400" : isDone ? "text-emerald-400" : "text-slate-600")}>
                                                                    {stage.label}
                                                                </p>
                                                                <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-widest">{stage.detail}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </TacticalCard>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                            <TacticalCard variant="holographic" title="РАДА АРБІТРАЖУ AZR" className="p-10 panel-3d border-white/5 bg-slate-950/40 rounded-[60px]">
                                                <div className="space-y-6">
                                                    {AGENTS.map((agent, i) => (
                                                        <div key={i} className="flex items-center gap-6 p-5 bg-white/5 rounded-[32px] border border-white/5 hover:border-orange-500/20 transition-all panel-3d group">
                                                            <div className={cn(`p-4 rounded-2xl bg-slate-900 border border-white/10 group-hover:border-${agent.color}-500/30`, `text-${agent.color}-400`)}>
                                                                <agent.icon size={24} />
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-black text-white uppercase tracking-tighter italic">{agent.name}</p>
                                                                <p className="text-[10px] text-slate-500 font-mono tracking-widest mt-1 uppercase">AGENT_PROV_{agent.label}</p>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <motion.div
                                                                    className={cn("w-3 h-3 rounded-full", agent.active ? "bg-emerald-500 shadow-[0_0_15px_#10b981]" : "bg-slate-700")}
                                                                    animate={agent.active ? { scale: [1, 1.4, 1] } : {}}
                                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                                />
                                                                <span className={cn("text-[9px] font-black uppercase tracking-widest opacity-60", agent.active ? "text-emerald-400" : "text-slate-600")}>
                                                                    {agent.active ? 'ACTIVE' : 'IDLE'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </TacticalCard>

                                            <TacticalCard variant="holographic" title="НЕЙРОННЕ ЯДРО СИНТЕЗУ" className="p-0 panel-3d flex items-center justify-center overflow-hidden relative min-h-[400px] border-orange-500/20 bg-slate-950/40 rounded-[60px]">
                                                <CyberOrb
                                                    size={280}
                                                    color="#f97316"
                                                    intensity={0.8}
                                                    pulse={isRunning}
                                                />
                                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                    <div className="text-[10px] font-black text-orange-500/40 uppercase tracking-[0.6em] mb-4">SYNTHESIS_FLUX</div>
                                                    <div className="text-4xl font-black text-white font-mono italic tracking-tighter opacity-80">{generation}.{cycle % 100}</div>
                                                </div>
                                                <div className="absolute bottom-8 text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">PREDATOR_CORE_V55.5</div>
                                            </TacticalCard>
                                        </div>
                                    </motion.div>
                                )}

                                {tab === 'fixes' && (
                                    <motion.div key="fixes" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-8">
                                        <div className="grid grid-cols-1 gap-8">
                                            {fixes.map((fix, i) => (
                                                <TacticalCard key={i} variant="holographic" className="p-10 panel-3d group border-white/5 bg-slate-900/40 rounded-[48px]">
                                                    <div className="flex flex-col md:flex-row items-center gap-10">
                                                        <div className={cn(
                                                            "w-20 h-20 rounded-[32px] flex items-center justify-center border-2 shrink-0 transition-all group-hover:scale-110 shadow-2xl",
                                                            fix.status === 'done' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                                                                fix.status === 'running' ? "bg-sky-500/10 border-sky-500/30 text-sky-400" : "bg-slate-800 border-white/10 text-slate-500"
                                                        )}>
                                                            {fix.type === 'performance' ? <Zap size={32} /> : fix.type === 'algorithmic' ? <Dna size={32} /> : <Code2 size={32} />}
                                                        </div>
                                                        <div className="flex-1 space-y-4">
                                                            <div className="flex items-center gap-6">
                                                                <h4 className="text-2xl font-black text-white uppercase tracking-tight italic">{fix.title}</h4>
                                                                <Badge className={cn(
                                                                    "font-black text-[10px] px-4 py-1 italic border-none",
                                                                    fix.status === 'done' ? "bg-emerald-600 text-black" :
                                                                        fix.status === 'running' ? "bg-sky-600 text-black animate-pulse" : "bg-slate-700 text-slate-400"
                                                                )}>
                                                                    {fix.status.toUpperCase()}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex flex-wrap gap-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">
                                                                <span className="flex items-center gap-2"><Target size={12} /> ЦІЛЬ: <span className="text-white">{fix.component}</span></span>
                                                                <span className="flex items-center gap-2"><TrendingUp size={12} /> ВПЛИВ: <span className="text-emerald-400">{fix.impact}</span></span>
                                                                <span className="flex items-center gap-2"> РИЗИК: <span className={cn(fix.risk === 'high' ? "text-rose-500" : fix.risk === 'medium' ? "text-amber-500" : "text-emerald-500")}>{fix.risk.toUpperCase()}</span></span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <div className="text-4xl font-black text-orange-500 tracking-tighter italic leading-none">{fix.council}/5</div>
                                                            <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-2 italic">CONCENSUS</div>
                                                        </div>
                                                    </div>
                                                    {fix.status === 'running' && (
                                                        <div className="mt-10 space-y-4">
                                                            <div className="flex justify-between text-[11px] font-black text-slate-500 tracking-[0.4em] uppercase">
                                                                <span>СИНТЕЗ ПАТЧУ...</span>
                                                                <span className="text-sky-400">{fix.progress}%</span>
                                                            </div>
                                                            <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5 relative">
                                                                <motion.div
                                                                    className="h-full bg-gradient-to-r from-sky-600 to-indigo-600 rounded-full shadow-[0_0_20px_rgba(14,165,233,0.5)]"
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
                                    <motion.div key="axioms" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="space-y-12">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            {AXIOMS.map((ax, i) => (
                                                <TacticalCard key={i} variant="holographic" className="p-10 panel-3d group border-white/10 bg-slate-900/40 rounded-[48px] overflow-hidden relative">
                                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                                                        <Shield size={120} className="text-orange-500" />
                                                    </div>
                                                    <div className="flex gap-8 relative z-10">
                                                        <div className="shrink-0 w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-orange-500/50 transition-all shadow-2xl">
                                                            <span className="text-orange-500 font-black text-base font-mono italic">{ax.code}</span>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <h4 className="text-xl font-black text-white uppercase tracking-tighter italic">{ax.name}</h4>
                                                            <p className="text-sm text-slate-500 leading-relaxed font-bold italic">{ax.detail}</p>
                                                        </div>
                                                        <div className="ml-auto flex items-center">
                                                            <ShieldCheck className="text-emerald-500/40" size={32} />
                                                        </div>
                                                    </div>
                                                </TacticalCard>
                                            ))}
                                        </div>

                                        <TacticalCard variant="holographic" className="p-0 overflow-hidden border-orange-500/30 rounded-[60px] bg-slate-950/60 shadow-2xl">
                                            <div className="bg-gradient-to-r from-orange-500/20 via-transparent to-transparent p-12 flex flex-col md:flex-row items-center gap-10">
                                                <div className="p-6 bg-orange-600/20 rounded-3xl border border-orange-600/30 shadow-2xl animate-pulse">
                                                    <HardDrive size={48} className="text-orange-400" />
                                                </div>
                                                <div className="flex-1 space-y-3">
                                                    <h4 className="text-3xl font-black text-white uppercase tracking-tighter italic">MERKLE TRUTH LEDGER</h4>
                                                    <p className="text-base text-slate-500 font-bold italic">"Кожна системна зміна закарбована в часі та захищена криптографічним консенсусом Чотирьох Арбітрів."</p>
                                                </div>
                                                <div className="flex items-center gap-6 px-10 py-5 bg-emerald-500/10 border border-emerald-500/20 rounded-[32px] shadow-2xl">
                                                    <motion.div className="w-4 h-4 bg-emerald-500 rounded-full" animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 2 }} />
                                                    <span className="text-xl font-black text-emerald-400 uppercase tracking-[0.2em] italic font-mono">INTEGRITY_100%</span>
                                                </div>
                                            </div>
                                        </TacticalCard>
                                    </motion.div>
                                )}

                                {tab === 'terminal' && (
                                    <motion.div key="terminal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                                        <TacticalCard variant="holographic" className="p-0 border-none h-[800px] flex flex-col overflow-hidden bg-black/80 backdrop-blur-3xl rounded-[60px] border border-white/5 shadow-2xl">
                                            <div className="flex items-center justify-between px-10 py-6 bg-slate-900/80 border-b border-white/5">
                                                <div className="flex gap-4">
                                                    <div className="w-4 h-4 rounded-full bg-[#ff5f56]" />
                                                    <div className="w-4 h-4 rounded-full bg-[#ffbd2e]" />
                                                    <div className="w-4 h-4 rounded-full bg-[#27c93f]" />
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <Terminal size={18} className="text-slate-500" />
                                                    <span className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] font-mono">AZR_KERNEL_OODA · LIVE_STREAM_v55.5</span>
                                                </div>
                                                <div className="w-20 h-1 flex justify-end">
                                                    {isRunning && <motion.div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1 }} />}
                                                </div>
                                            </div>

                                            <div className="flex-1 overflow-y-auto p-12 font-mono text-xs leading-relaxed custom-scrollbar bg-[rgba(2,4,10,0.4)]">
                                                <div className="text-orange-500/80 mb-12 font-black leading-none opacity-90 scale-125 origin-left">
                                                    <pre>{`
    █▀▀█ █▀▀█ █▀▀ █▀▀▄ █▀▀█ ▀▀█▀▀ █▀▀█ █▀▀█
    █  █ █▄▄▀ █▀▀ █  █ █▄▄█   █   █  █ █▄▄▀
    █▀▀▀ ▀ ▀▀ ▀▀▀ ▀▀▀  ▀  ▀   ▀   ▀▀▀▀ ▀ ▀▀
    SYSTEM AUTONOMOUS FIX FACTORY v55.5.4
    ──────────────────────────────────────`}</pre>
                                                </div>

                                                <div className="space-y-3 pr-4">
                                                    {logs.map(log => (
                                                        <div key={log.id} className="flex gap-6 group hover:bg-white/5 p-2 rounded-lg transition-colors">
                                                            <span className="text-slate-700 shrink-0 font-bold">{log.ts}</span>
                                                            <span className={cn(
                                                                "shrink-0 font-black px-3 py-0.5 rounded-md text-[10px]",
                                                                log.level === 'OK' ? "bg-emerald-500/20 text-emerald-400" :
                                                                    log.level === 'WARN' ? "bg-amber-500/20 text-amber-400" :
                                                                        log.level === 'ERROR' ? "bg-rose-500/20 text-rose-400" : "bg-sky-500/20 text-sky-400"
                                                            )}>
                                                                [{log.level}]
                                                            </span>
                                                            <span className={cn(
                                                                "group-hover:text-white transition-colors font-bold tracking-tight italic",
                                                                log.level === 'INFO' ? "text-slate-500" :
                                                                    log.level === 'OK' ? "text-emerald-300" :
                                                                        log.level === 'WARN' ? "text-amber-300" : "text-rose-300"
                                                            )}>
                                                                {log.text}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {isRunning && (
                                                        <div className="flex gap-6 animate-pulse p-2">
                                                            <span className="text-slate-700 font-bold">{new Date().toLocaleTimeString()}</span>
                                                            <span className="text-sky-500 font-black px-3 py-0.5 rounded-md text-[10px] bg-sky-500/20">[KERN]</span>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-white font-black italic">СИНХРОНІЗАЦІЯ НЕЙРОННИХ ВАГ...</span>
                                                                <motion.div
                                                                    className="w-2 h-5 bg-orange-500"
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

                        {/* RIGHT SIDEBAR - Activity & Insights */}
                        <div className="lg:col-span-4 space-y-12">
                            <TacticalCard variant="holographic" title="НЕЙРОННА АКТИВНІСТЬ" className="p-10 panel-3d border-white/5 bg-slate-900/40 rounded-[60px]">
                                <div className="h-[250px] w-full flex items-center justify-center relative bg-slate-950/40 rounded-[40px] border border-white/5 overflow-hidden group/viz">
                                    <div className="absolute inset-0 opacity-20">
                                        <div className="w-full h-full bg-[linear-gradient(90deg,transparent_0%,rgba(249,115,22,0.4)_50%,transparent_100%)] bg-[length:200%_100%] animate-scan" style={{ animation: 'scan 2.5s linear infinite' }} />
                                    </div>
                                    <div className="flex flex-col items-center gap-6 relative z-10">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-orange-500/20 blur-3xl scale-150 rounded-full animate-pulse" />
                                            <Brain size={64} className="text-orange-400 drop-shadow-[0_0_20px_rgba(249,115,22,0.6)]" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-2">INTELLIGENCE_STATUS</p>
                                            <p className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">CORTEX_ACTIVE</p>
                                        </div>
                                    </div>
                                </div>
                            </TacticalCard>

                            <TacticalCard variant="holographic" title="ДВИГУНИ АВТОНОМІЇ" className="p-10 panel-3d border-white/5 bg-slate-900/40 rounded-[60px]">
                                <div className="space-y-6">
                                    {[
                                        { icon: BrainCircuit, label: 'Auto-Completer', status: 'Optimal', val: '99.8%', color: 'sky' },
                                        { icon: Binary, label: 'Neural Fixer', status: 'Active', val: 'v55.5', color: 'orange' },
                                        { icon: Terminal, label: 'CLI Watchdog', status: 'Secure', val: 'LOCKED', color: 'rose' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-5 bg-black/40 rounded-[32px] border border-white/5 hover:border-white/20 transition-all panel-3d group">
                                            <div className="flex items-center gap-5">
                                                <div className={cn(`p-3 rounded-2xl bg-slate-900 border border-white/5 group-hover:border-${item.color}-500/40`, `text-${item.color}-400`)}>
                                                    <item.icon size={20} />
                                                </div>
                                                <span className="text-sm font-black text-white uppercase tracking-tight italic">{item.label}</span>
                                            </div>
                                            <div className="text-right">
                                                <div className={cn(`text-[10px] font-black uppercase tracking-widest`, `text-${item.color}-400`)}>{item.status}</div>
                                                <div className="text-[9px] text-slate-600 font-mono font-bold mt-1 tracking-widest">{item.val}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TacticalCard>

                            <TacticalCard variant="holographic" title="ЕФЕКТИВНІСТЬ СИНТЕЗУ" className="p-10 panel-3d border-white/5 bg-slate-900/40 rounded-[60px] h-[400px]">
                                <div className="h-full w-full flex items-end gap-3 px-4 pb-10">
                                    {[72, 88, 64, 98, 82, 91, 85, 96, 89].map((h, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-4">
                                            <motion.div
                                                className="w-full bg-gradient-to-t from-orange-600/30 via-orange-500/60 to-orange-400 rounded-[12px] relative group cursor-help shadow-2xl"
                                                initial={{ height: 0 }}
                                                animate={{ height: `${h}%` }}
                                                transition={{ delay: i * 0.1, type: 'spring', damping: 10 }}
                                            >
                                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-[10px] font-black text-white bg-orange-600 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all scale-0 group-hover:scale-100 italic">{h}%</div>
                                            </motion.div>
                                        </div>
                                    ))}
                                </div>
                                <div className="absolute bottom-6 left-0 w-full text-center text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] italic leading-none px-10">
                                    HISTORICAL_RELIABILITY_INDEX_SIGNAL_v55.5
                                </div>
                            </TacticalCard>

                            {/* Self-Destruct / Panic Button (Just for aesthetics) */}
                            <button className="w-full py-6 bg-rose-600/20 border-2 border-rose-600/40 rounded-[32px] text-[10px] font-black text-rose-500 uppercase tracking-[0.5em] hover:bg-rose-600 hover:text-white transition-all italic shadow-2xl group overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-500/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <span className="relative z-10 flex items-center justify-center gap-4">
                                    <PowerOff size={18} /> ПРИМУСОВЕ ПРИПИНЕННЯ ЯДРА
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes scan {
                        from { transform: translateX(-100%); }
                        to { transform: translateX(100%); }
                    }
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 4px;
                        height: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(249, 115, 22, 0.2);
                        border-radius: 20px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(249, 115, 22, 0.4);
                    }
                    .panel-3d {
                        transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    }
                    .panel-3d:hover {
                        transform: translateY(-8px) rotateX(1deg) rotateY(-1deg);
                        box-shadow: 0 40px 80px -20px rgba(0,0,0,0.8), 0 0 40px rgba(249, 115, 22, 0.05);
                    }
                    .no-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                `}} />
            </div>
        </PageTransition>
    );
};

export default AutoFactoryView;
