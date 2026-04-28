import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Flame,
  Eye,
  Scale,
  Activity,
  Clock,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  RefreshCw,
  GitBranch,
  Brain,
  Cpu,
  Fingerprint,
  Lock,
  Unlock,
  ChevronRight,
  ChevronDown,
  BarChart3,
  Terminal,
  MessageSquare,
  ArrowRightLeft,
  Users,
  Target,
  Crosshair
} from 'lucide-react';
import { api } from '../../services/api';
import '../../styles/SovereignGovernance.css';

// --- ТИПИ ---
interface SOMStatus {
    active: boolean;
    operational: boolean;
    ring_level: number;
    emergency_level: number | null;
    total_anomalies: number;
    total_anomalies_active: number;
    redis_connected: boolean;
    uptime_seconds: number;
}

interface ShadowMetric {
    timestamp: string;
    production_model: string;
    candidate_model: string;
    deviation_score: number;
    prod_status: string;
    shadow_status: string;
}

interface Proposal {
    id: string;
    title: string;
    description: string;
    status: string;
    ring_level: number;
    target_component: string;
    simulation_results?: {
        technical: any;
        debate: any;
    };
    created_at: string;
}

// --- КОМПОНЕНТИ ---

const StatusIndicator: React.FC<{ active: boolean; label: string }> = ({ active, label }) => (
    <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{label}</span>
    </div>
);

const RingPortal: React.FC<{ level: number }> = ({ level }) => {
    const configs = [
        { label: "БЕЗ ОБМЕЖЕНЬ", color: "#10b981", rings: 1, speed: "20s" },
        { label: "ВНУТ� ІШНЄ КОЛО", color: "#3b82f6", rings: 2, speed: "15s" },
        { label: "СЕ� ЕДНЯ ЗОНА", color: "#f59e0b", rings: 3, speed: "10s" },
        { label: "ЗОВНІШНІЙ КОНТУ� ", color: "#e11d48", rings: 4, speed: "5s" }
    ];

    const current = configs[level] || configs[0];

    return (
        <div className={cn("flex items-center gap-6 p-4 bg-black/40 rounded-[32px] border border-white/5 shadow-2xl overflow-hidden group", `ring-level-${level}`)}>
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                <div className="absolute inset-0 bg-white/5 rounded-full blur-xl" />
                {Array.from({ length: current.rings }).map((_, i) => (
                    <div
                        key={i}
                        className={cn("absolute ring-portal-element", `ring-pos-${i}`)}
                    />
                ))}
                <div className="relative z-10 w-4 h-4 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
            </div>
            <div className="flex flex-col">
                <span className="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em] mb-1">КІЛЬЦЕ СУВЕ� ЕНІТЕТУ</span>
                <span className="text-lg font-black tracking-tight text-ring-color">{current.label}</span>
                <div className="flex gap-1 mt-1.5">
                    {[0, 1, 2, 3].map(i => (
                        <div
                            key={i}
                            className={cn("h-1 w-6 rounded-full transition-opacity duration-500 bg-ring-color", `ring-level-${i}`, i <= level ? "opacity-100" : "opacity-20")}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export const SovereignGovernanceDashboard: React.FC = () => {
    const [status, setStatus] = useState<SOMStatus | null>(null);
    const [shadowMetrics, setShadowMetrics] = useState<ShadowMetric[]>([]);
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [emergencyModal, setEmergencyModal] = useState(false);
    const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
    const [driftScore, setDriftScore] = useState(0);
    const [violations, setViolations] = useState<any[]>([]);
    const [immunityModal, setImmunityModal] = useState(false);
    const [overruleModal, setOverruleModal] = useState(false);
    const [selectedViolation, setSelectedViolation] = useState<any | null>(null);
    const [targetComponent, setTargetComponent] = useState('');
    const [immunityMinutes, setImmunityMinutes] = useState(60);
    const [overruleReason, setOverruleReason] = useState('');

    const fetchData = async () => {
        try {
            const [statusRes, shadowRes, proposalsRes, violationsRes] = await Promise.all([
                api.som.getStatus(),
                api.som.getShadowMetrics(),
                api.som.getProposals(),
                api.som.getAxiomViolations()
            ]);

            setStatus(statusRes);
            setShadowMetrics(shadowRes.deviations || []);
            setDriftScore(shadowRes.current_drift_score || 0);
            setProposals(proposalsRes.proposals || []);
            setViolations(violationsRes.violations || []);
        } catch (err) {
            console.error("Failed to fetch SOM governance data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleExecute = async (id: string) => {
        try {
            await api.som.executeProposal(id, "operator-01");
            fetchData();
        } catch (err) {
            alert("Помилка комплаєнс-перевірки при виконанні!");
        }
    };

    const handleGrantImmunity = async () => {
        if (!targetComponent) return;
        try {
            await api.som.grantImmunity(targetComponent, immunityMinutes, "operator-01");
            setImmunityModal(false);
            setTargetComponent('');
            fetchData();
        } catch (err) {
            alert("Не вдалося надати імунітет");
        }
    };

    const handleOverrule = async () => {
        if (!selectedViolation || !overruleReason) return;
        try {
            await api.som.overruleAxiom(selectedViolation.id, overruleReason, "operator-01");
            setOverruleModal(false);
            setOverruleReason('');
            fetchData();
        } catch (err) {
            alert("Не вдалося скасувати порушення");
        }
    };

    const isEmergency = status?.emergency_level !== null;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans selection:bg-rose-500/30">
            {/* Ефекти фону */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px]" />
                {isEmergency && <div className="absolute inset-0 bg-rose-900/10 animate-pulse" />}
            </div>

            {/* Секція хедеру */}
            <header className="relative z-10 flex items-center justify-between mb-12">
                <div className="flex items-center gap-6">
                    <div className={`p-4 rounded-3xl bg-gradient-to-br ${isEmergency ? 'from-rose-500 to-red-800' : 'from-indigo-500 to-blue-700'} shadow-2xl shadow-indigo-500/20`}>
                        <ShieldAlert size={32} className="text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Суверенне Управління</h1>
                            <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] font-black rounded-md border border-indigo-500/30 tracking-tighter">v58.2-WRAITH-S</span>
                        </div>
                        <p className="text-slate-500 text-sm font-medium mt-1">Конституційний Нагляд та Інтерфейс Людського Суверенітету</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <RingPortal level={status?.ring_level || 0} />
                </div>
            </header>

            <div className="grid grid-cols-12 gap-8 relative z-10">

                {/* Ліва колонка: Пропозиції та дебати */}
                <div className="col-span-12 lg:col-span-8 space-y-8">

                    {/* Секція активних пропозицій */}
                    <section className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[32px] overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                            <div className="flex items-center gap-3">
                                <GitBranch className="text-blue-400" size={20} />
                                <h2 className="text-lg font-bold text-white uppercase tracking-widest">Пропозиції Еволюції</h2>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">{proposals.length} � ІШЕНЬ ОЧІКУЄТЬСЯ</span>
                        </div>

                        <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                            <AnimatePresence mode="popLayout">
                                {proposals.map(proposal => (
                                    <motion.div
                                        key={proposal.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className={`group p-5 rounded-2xl border transition-all cursor-pointer ${selectedProposal?.id === proposal.id ? 'bg-indigo-500/10 border-indigo-500/40 shadow-lg shadow-indigo-500/5' : 'bg-slate-800/30 border-white/5 hover:border-white/10'}`}
                                        onClick={() => setSelectedProposal(proposal)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${proposal.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                        {proposal.status}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 font-mono">#{proposal.id.split('-')[0]}</span>
                                                </div>
                                                <h3 className="text-white font-bold text-lg group-hover:text-indigo-400 transition-colors">{proposal.title}</h3>
                                                <p className="text-slate-400 text-sm mt-1 line-clamp-1">{proposal.description}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] text-slate-500 flex items-center justify-end gap-1 mb-2 uppercase font-bold">
                                                    <Target size={10} />
                                                    {proposal.target_component}
                                                </div>
                                                {proposal.status === 'APPROVED' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleExecute(proposal.id); }}
                                                        className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                                                    >
                                                        <Zap size={14} />
                                                        Виконати
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {proposals.length === 0 && (
                                <div className="text-center py-12 text-slate-600 bg-white/5 rounded-2xl border border-dashed border-slate-800">
                                    <RefreshCw className="mx-auto mb-4 animate-spin-slow opacity-20" size={48} />
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Активних пропозицій немає</h3>
                                    <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto">Система стабільна. Ви можете ініціювати новий цикл еволюції вручну.</p>

                                    <button
                                        onClick={async () => {
                                            try {
                                                await api.ai.triggerSelfImprovement();
                                                fetchData();
                                                alert("Цикл еволюції ініційовано.");
                                            } catch(e) { alert("Не вдалося почати еволюцію."); }
                                        }}
                                        className="px-6 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                                    >
                                        Запустити Цикл
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Деталі симуляції та дебатів */}
                    <AnimatePresence>
                        {selectedProposal && (
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="grid grid-cols-2 gap-6"
                            >
                                {/* � езультати цифрового двійника */}
                                <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[32px] p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Activity className="text-emerald-400" size={20} />
                                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Симуляція Цифрового Двійника</h3>
                                    </div>

                                    {selectedProposal.simulation_results?.technical ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                                <span className="text-xs text-slate-400">Вердикт Стабільності</span>
                                                <span className={`text-xs font-bold ${selectedProposal.simulation_results.technical.risk_analysis?.is_safe ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {selectedProposal.simulation_results.technical.risk_analysis?.is_safe ? '✓ СТАБІЛЬНО' : '✗ � ИЗИКОВАНО'}
                                                </span>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[10px] text-slate-500 uppercase font-black">
                                                    <span>Прогноз впливу на CPU</span>
                                                    <span>{Math.round(selectedProposal.simulation_results.technical.resource_prediction?.predicted_cpu * 100)}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.round(selectedProposal.simulation_results.technical.resource_prediction?.predicted_cpu * 100)}%` }}
                                                        transition={{ duration: 1, ease: "easeOut" }}
                                                        className="h-full bg-emerald-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-32 flex flex-col items-center justify-center text-slate-600 italic text-xs">
                                            <Cpu className="mb-2 opacity-20 animate-pulse" />
                                            Прогнозування впливу на систему...
                                        </div>
                                    )}
                                </div>

                                {/* � езультати суверенних дебатів */}
                                <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[32px] p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Scale className="text-amber-400" size={20} />
                                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Діалектичний Аналіз</h3>
                                    </div>

                                    {selectedProposal.simulation_results?.debate ? (
                                        <div className="space-y-4">
                                            <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Brain size={12} className="text-blue-400" />
                                                    <span className="text-[10px] font-black text-blue-400 uppercase">Архітектор</span>
                                                </div>
                                                <p className="text-[11px] text-slate-300 leading-relaxed italic line-clamp-2">
                                                    "{selectedProposal.simulation_results.debate.architect_argument}"
                                                </p>
                                            </div>
                                            <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <ShieldAlert size={12} className="text-amber-400" />
                                                    <span className="text-[10px] font-black text-amber-400 uppercase">Охоронець</span>
                                                </div>
                                                <p className="text-[11px] text-slate-300 leading-relaxed italic line-clamp-2">
                                                    "{selectedProposal.simulation_results.debate.guardian_argument}"
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-32 flex flex-col items-center justify-center text-slate-600 italic text-xs">
                                            <Users className="mb-2 opacity-20 animate-pulse" />
                                            Очікування консенсусу агентів...
                                        </div>
                                    )}
                                </div>
                            </motion.section>
                        )}
                    </AnimatePresence>
                </div>

                {/* Права колонка: Суверенітет та тіньовий режим */}
                <div className="col-span-12 lg:col-span-4 space-y-8">

                    {/* Керування суверенітетом 3-го кільця */}
                    <section className={`p-6 rounded-[32px] border transition-all duration-700 ${isEmergency ? 'bg-rose-950/40 border-rose-500/50 shadow-2xl shadow-rose-500/20' : 'bg-slate-900/40 border-white/5'}`}>
                        <div className="flex items-center gap-3 mb-8">
                            <Lock className={isEmergency ? 'text-rose-500' : 'text-slate-500'} size={24} />
                            <h2 className={`text-lg font-black uppercase tracking-widest ${isEmergency ? 'text-rose-400' : 'text-white'}`}>Ядро Суверенітету</h2>
                        </div>

                        <div className="space-y-6">
                            {/* Візуал червоної кнопки */}
                            <div className="relative aspect-square max-w-[200px] mx-auto group">
                                <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 transition-all ${isEmergency ? 'bg-rose-500 animate-pulse' : 'bg-indigo-500'}`} />
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setEmergencyModal(true)}
                                    className={`relative z-10 w-full h-full rounded-full border-8 flex flex-col items-center justify-center gap-2 transition-all duration-500 ${isEmergency ? 'bg-rose-600 border-rose-400 shadow-[0_0_50px_rgba(244,63,94,0.4)]' : 'bg-slate-800 border-slate-700 shadow-xl'}`}
                                >
                                    <Flame size={48} className={isEmergency ? 'text-white' : 'text-slate-500 opacity-30'} />
                                    <span className="text-[10px] font-black uppercase tracking-tighter">
                                        {isEmergency ? 'Деактивувати' : 'Екстрено'}
                                    </span>
                                </motion.button>
                            </div>

                            <p className="text-center text-slate-500 text-xs leading-relaxed px-4">
                                Елементи керування 3-го кільця дозволяють операторам обходити всю автономну логіку в разі катастрофічного дрейфу або порушення аксіом.
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setImmunityModal(true)}
                                    className="py-3 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    <ShieldCheck size={14} className="text-blue-400" />
                                    Імунітет
                                </button>
                                <button
                                    onClick={() => {
                                        if (violations.length > 0) {
                                            setSelectedViolation(violations[0]);
                                            setOverruleModal(true);
                                        } else {
                                            alert("Немає активних порушень для скасування.");
                                        }
                                    }}
                                    className="py-3 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    <Unlock size={14} className="text-amber-400" />
                                    Скасувати
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Монітор тіньового режиму */}
                    <section className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[32px] p-6 relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Fingerprint size={120} />
                        </div>

                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <Eye className="text-indigo-400" size={20} />
                                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Тіньова Аналітика</h2>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">Дрейф Моделі</span>
                                <span className={`text-lg font-black ${(driftScore * 100) > 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {(driftScore * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {shadowMetrics.slice(0, 3).map((metric, i) => (
                                <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${metric.deviation_score > 0.3 ? 'bg-rose-500/20' : 'bg-emerald-500/20'}`}>
                                            <ArrowRightLeft size={14} className={metric.deviation_score > 0.3 ? 'text-rose-400' : 'text-emerald-400'} />
                                        </div>
                                        <div>
                                            <div className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">Перевірка Кандидата</div>
                                            <div className="text-[10px] text-white font-mono">{metric.candidate_model}</div>
                                        </div>
                                    </div>
                                    <div className={`text-xs font-black ${metric.deviation_score > 0.3 ? 'text-rose-400' : 'text-slate-400'}`}>
                                        Δ {(metric.deviation_score * 100).toFixed(0)}%
                                    </div>
                                </div>
                            ))}
                            <button className="w-full py-2 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                                Переглянути Архітектурну Теплокарту
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </section>

                </div>
            </div>

            {/* Модальне вікно екстреної ситуації */}
            {emergencyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-0">
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative bg-slate-900 border border-rose-500/30 rounded-[32px] p-8 max-w-md w-full shadow-2xl shadow-rose-500/10"
                    >
                        <XCircle
                            className="absolute top-4 right-4 text-slate-500 hover:text-white cursor-pointer transition-colors"
                            onClick={() => setEmergencyModal(false)}
                        />
                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="p-4 bg-rose-500/20 rounded-full">
                                <AlertOctagon size={48} className="text-rose-500" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Перевизначення Суверенітету</h3>
                                <p className="text-slate-400 text-sm mt-2">
                                    Ви збираєтеся активувати **Протокол Екстреної Ізоляції � івня 2**. Це заморозить усі автономні оптимізації та переведе агентів у детерміноване блокування.
                                </p>
                            </div>

                            <div className="w-full space-y-3">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                                    <span className="text-xs text-slate-500 font-bold uppercase">Код доступу</span>
                                    <span className="text-lg font-mono text-white tracking-[0.5em] font-black">{isEmergency ? 'PAUSE_SOM_ALPHA' : 'PAUSE_SOM_ALPHA'}</span>
                                </div>
                                <button
                                    className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-600/30 transition-all border border-rose-400/30"
                                    onClick={async () => {
                                        if (isEmergency) {
                                            await api.som.deactivateEmergency("operator-01");
                                        } else {
                                            await api.som.activateEmergency(1, "operator-01", "PAUSE_SOM_ALPHA", "Manual Sovereignty Override");
                                        }
                                        setEmergencyModal(false);
                                        fetchData();
                                    }}
                                >
                                    {isEmergency ? 'Деактивувати Протокол' : 'Підтвердити Активацію'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Модальне вікно імунітету */}
            {immunityModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-0">
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative bg-slate-900 border border-blue-500/30 rounded-[32px] p-8 max-w-md w-full shadow-2xl shadow-blue-500/10"
                    >
                        <XCircle
                            className="absolute top-4 right-4 text-slate-500 hover:text-white cursor-pointer transition-colors"
                            onClick={() => setImmunityModal(false)}
                        />
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/20 rounded-2xl">
                                    <ShieldCheck size={32} className="text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">Надати Імунітет</h3>
                                    <p className="text-slate-400 text-xs mt-1">Захистити компонент від автономних дій</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest pl-2">Цільовий Компонент</label>
                                    <input
                                        type="text"
                                        placeholder="напр. orchestrator, dataloader"
                                        className="w-full bg-slate-800 border border-white/5 rounded-2xl px-4 py-3 text-sm text-white focus:border-blue-500/50 outline-none transition-all font-mono"
                                        value={targetComponent}
                                        onChange={(e) => setTargetComponent(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest pl-2">Тривалість (Хвилин)</label>
                                    <select
                                        className="w-full bg-slate-800 border border-white/5 rounded-2xl px-4 py-3 text-sm text-white focus:border-blue-500/50 outline-none transition-all"
                                        value={immunityMinutes}
                                        onChange={(e) => setImmunityMinutes(parseInt(e.target.value))}
                                    >
                                        <option value={15}>15 Хвилин</option>
                                        <option value={60}>1 Година</option>
                                        <option value={240}>4 Години</option>
                                        <option value={1440}>24 Години</option>
                                    </select>
                                </div>
                                <button
                                    onClick={handleGrantImmunity}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all border border-blue-400/30"
                                >
                                    Підтвердити Імунітет
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Модальне вікно скасування */}
            {overruleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-0">
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative bg-slate-900 border border-amber-500/30 rounded-[32px] p-8 max-w-lg w-full shadow-2xl shadow-amber-500/10"
                    >
                        <XCircle
                            className="absolute top-4 right-4 text-slate-500 hover:text-white cursor-pointer transition-colors"
                            onClick={() => setOverruleModal(false)}
                        />
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-amber-500/20 rounded-2xl">
                                    <Unlock size={32} className="text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">� учне Скасування</h3>
                                    <p className="text-slate-400 text-xs mt-1">Вирішення та очищення конституційних порушень</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest pl-2">Оберіть Порушення</label>
                                    <select
                                        className="w-full bg-slate-800 border border-white/5 rounded-2xl px-4 py-3 text-sm text-white focus:border-amber-500/50 outline-none transition-all font-mono"
                                        value={selectedViolation?.id || ''}
                                        onChange={(e) => setSelectedViolation(violations.find(v => v.id === e.target.value))}
                                    >
                                        <option value="">Оберіть порушення...</option>
                                        {violations.filter(v => !v.resolved).map(v => (
                                            <option key={v.id} value={v.id}>
                                                {v.axiom_id}: {v.violation_type} ({v.actor})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {selectedViolation && (
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">Деталі</span>
                                            <span className="text-[9px] text-rose-400 font-mono italic">#{selectedViolation.id.substring(0, 8)}</span>
                                        </div>
                                        <p className="text-xs text-slate-300 leading-relaxed font-mono">
                                            Дійова особа: {selectedViolation.actor}<br/>
                                            Дія: {selectedViolation.action}<br/>
                                            Критичність: {selectedViolation.severity}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest pl-2">Обґрунтування Вирішення</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Поясніть, чому це порушення скасовується..."
                                        className="w-full bg-slate-800 border border-white/5 rounded-2xl px-4 py-3 text-sm text-white focus:border-amber-500/50 outline-none transition-all resize-none"
                                        value={overruleReason}
                                        onChange={(e) => setOverruleReason(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={handleOverrule}
                                    disabled={!selectedViolation || !overruleReason}
                                    className="w-full py-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-30 disabled:hover:bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-amber-600/20 transition-all border border-amber-400/30"
                                >
                                    Виконати Скасування
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default SovereignGovernanceDashboard;
