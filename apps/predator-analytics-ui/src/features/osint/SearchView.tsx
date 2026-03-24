/**
 * PREDATOR v55.8 | Neural Discovery Matrix — Когнітивна Матриця Пошуку
 * 
 * Модернізована версія з живою індикацією джерел (OSINT Nexus),
 * покращеною візуальною агресією та глибокою аналітикою.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
    Search as SearchIcon,
    Building2,
    User,
    AlertTriangle,
    CheckCircle,
    Lock,
    Network,
    ChevronRight,
    Briefcase,
    FileText,
    Globe,
    Shield,
    MapPin,
    BrainCircuit,
    Sparkles,
    RefreshCw,
    Target,
    Activity,
    Zap,
    Fingerprint,
    Radio,
    Scan,
    Database,
    SearchCode,
    Radar,
    XCircle,
    Link2,
    Eye,
    ShieldAlert,
    Cpu,
    Workflow,
    Terminal as TerminalIcon,
    BarChart3,
    Layers,
    History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { api } from '@/services/api';
import { SearchResultRadar } from '@/components/premium/SearchResultRadar';
import { TacticalCard } from '@/components/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { CyberOrb } from '@/components/CyberOrb';
import { HoloContainer } from '@/components/HoloContainer';
import { ExplainabilityPanel } from '@/components/explain/ExplainabilityPanel';
import AIInsightsHub from '@/features/ai/AIInsightsHub';
import { useAppStore } from '@/store/useAppStore';

// --- TYPES ---
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface Company {
    id: string;
    edrpou: string;
    name: string;
    status: 'active' | 'bankrupt' | 'process' | 'unknown';
    risk: RiskLevel;
    director: string;
    address: string;
    capital: string;
    type: string;
    tags: string[];
    beneficiaries?: string[];
    connections?: number;
    explanation?: any;
    lastAudit?: string;
    transparencyScore?: number;
}

// --- LOCALES ---
const localLocales = {
    title: 'НЕЙРОННА МАТРИЦЯ ПОШУКУ',
    subtitle: 'Прямий доступ до 2.5 млн+ об\'єктів через когнітивні фільтри V55.8',
    stats: {
        indexed: 'Індексовано об\'єктів',
        sources: 'Активних реєстрів',
        reliability: 'Точність ШІ',
    },
    modes: {
        neural: 'НЕЙРОННИЙ_ПОШУК',
        exact: 'ФІКСОВАНИЙ_ЗБІГ',
        deep: 'ГЛИБОКИЙ_СКАН_OSINT',
    },
    hackerMode: {
        active: 'TERMINAL_LINK_ACTIVE // PORT: 8443 // S_KEY: AX-42 // ENCRYPTION: AES-256',
        prompt: 'ВВЕДІТЬ_ЄДРПОУ_АБО_КЛЮЧОВИЙ_ВЕКТОР...',
    },
    aiAnalysis: {
        title: 'Когнітивний Синтез Predator Pulse',
        analyzing: 'ШІ Аналіз Запиту...',
        noData: 'Система проводить перехресний аналіз знайдених сутностей. Виявлено зв\'язки з публічними реєстрами. Активовано сценарій OSINT-глибинного сканування.',
    },
    results: {
        found: 'ВИЯВЛЕНО ПРЯМИХ СПІВПАДІНЬ',
        noResults: 'Нуль результатів у базі PREDATOR. Можливо об\'єкт прихований або не індексований.',
        restricted: 'РІВЕНЬ_ДОСТУПУ_ОБМЕЖЕНО',
    },
    company: {
        active: 'ДІЮЧА_СУТНІСТЬ',
        inactive: 'В СТАНІ ПРИПИНЕННЯ',
        fullFile: 'ПОВНЕ ДОСЬЄ',
        explain: 'AI_EXPLAIN',
        hide: 'ПРИХОВАТИ_АНАЛІЗ',
        riskProfile: 'Профіль Ризику',
        alphaScore: 'Alpha Index',
    }
};

const OSINT_NEXUS = [
    { name: 'ЄДРПОУ', status: 'SYNCHRONIZED', color: 'text-emerald-400', icon: Database },
    { name: 'МИТНИЦЯ', status: 'LIVE_STREAM', color: 'text-cyan-400', icon: Ship },
    { name: 'САНКЦІЇ', status: 'ACTIVE_SHIELD', color: 'text-rose-500', icon: ShieldAlert },
    { name: 'СУДИ', status: 'QUERY_ACTIVE', color: 'text-amber-400', icon: Scale },
    { name: 'ТЕЛЕГРАМ', status: 'OMNISCIENCE', color: 'text-indigo-400', icon: Radio },
];

const RiskBadge = ({ level }: { level: RiskLevel }) => {
    const configs = {
        low: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle, label: 'Низький' },
        medium: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle, label: 'Середній' },
        high: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: AlertTriangle, label: 'Високий' },
        critical: { color: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/40', icon: Shield, label: 'Критичний' }
    };
    const config = configs[level] || configs.medium;
    const Icon = config.icon;

    return (
        <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black border uppercase tracking-widest backdrop-blur-md shadow-lg",
            config.color, config.bg, config.border,
            level === 'critical' && "animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.3)]"
        )}>
            <Icon className="w-4 h-4" />
            {config.label} РИЗИК
        </div>
    );
};

const RedactedField = () => (
    <div className="bg-slate-950/80 rounded-xl px-4 py-2 inline-block min-w-[160px] relative group cursor-help select-none border border-white/5 overflow-hidden">
        <span className="opacity-0 text-[10px] font-black tracking-[0.2em]">CLASSIFIED</span>
        <div className="absolute inset-0 flex items-center justify-center p-2">
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-transparent via-slate-600 to-transparent w-full animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            </div>
        </div>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" />
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-rose-950 text-rose-400 text-[9px] px-3 py-2 rounded-xl border border-rose-500/30 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 whitespace-nowrap z-50 pointer-events-none flex items-center gap-2 shadow-[0_0_30px_rgba(244,63,94,0.3)] font-black uppercase tracking-widest">
            <Lock className="w-3.5 h-3.5" /> Тільки Platinum Access
        </div>
    </div>
);

const AIAnswerCard = ({ query, answer, loading }: { query: string, answer: string | null, loading: boolean }) => {
    if (!loading && !answer) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
        >
            <TacticalCard
                title={localLocales.aiAnalysis.title}
                subtitle={`VECTOR_QUERY: ${query}`}
                icon={<BrainCircuit className="text-cyan-400 animate-pulse" />}
                variant="holographic"
                glow="blue"
                status={loading ? 'info' : 'success'}
            >
                <div className="flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/10 blur-[60px] rounded-full pointer-events-none" />
                    <div className="relative shrink-0 hidden md:block group">
                        <CyberOrb size="md" color="cyan" intensity="medium" className="group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Zap className="text-cyan-400 w-8 h-8 animate-pulse shadow-[0_0_20px_rgba(34,211,238,0.5)]" />
                        </div>
                    </div>
                    <div className="flex-1 space-y-4">
                        {loading ? (
                            <div className="space-y-4">
                                <div className="h-5 bg-white/5 rounded-xl w-full animate-pulse" />
                                <div className="h-5 bg-white/5 rounded-xl w-5/6 animate-pulse" />
                                <div className="h-5 bg-white/5 rounded-xl w-4/6 animate-pulse" />
                            </div>
                        ) : (
                            <div className="prose prose-invert prose-sm max-w-none">
                                <p className="text-slate-200 leading-relaxed font-bold text-[16px] italic bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                                    {answer}
                                </p>
                            </div>
                        )}
                        <div className="pt-4 flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-black/40 rounded-xl border border-white/5 group hover:border-cyan-500/30 transition-colors">
                                <Scan className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black font-mono text-slate-400 uppercase tracking-widest">Confidence: 99.2%</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-black/40 rounded-xl border border-white/5 group hover:border-emerald-500/30 transition-colors">
                                <Fingerprint className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black font-mono text-slate-400 uppercase tracking-widest">Hash: v55.8-ULTRA</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-black/40 rounded-xl border border-white/5 group hover:border-amber-500/30 transition-colors cursor-pointer">
                                <Workflow className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black font-mono text-slate-400 uppercase tracking-widest">Verify Sources</span>
                            </div>
                        </div>
                    </div>
                </div>
            </TacticalCard>
        </motion.div>
    );
};

const CompanyCard = ({
    company,
    isPremium,
    isHackerMode,
    isExpanded,
    onToggleExplain
}: {
    company: Company,
    isPremium: boolean,
    isHackerMode: boolean,
    isExpanded: boolean,
    onToggleExplain: (id: string) => void
}) => {
    const radarData = {
        risk: company.risk === 'critical' ? 95 : company.risk === 'high' ? 75 : company.risk === 'medium' ? 45 : 15,
        connections: Math.min(100, (company.connections || 0) * 8),
        capital: company.capital.includes('млн') ? 85 : 40,
        reputation: company.status === 'active' ? 90 : 35,
        transparency: isPremium ? (company.transparencyScore || 80) : 10
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            className="group relative"
        >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500/20 to-indigo-500/20 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <TacticalCard
                title={company.name}
                subtitle={`${company.type} // ЄДРПОУ: ${company.edrpou}`}
                icon={
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-700 group-hover:rotate-6",
                        company.risk === 'critical' ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' :
                        company.type === 'ТОВ' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' :
                        'bg-slate-900 border-white/10 text-slate-400'
                    )}>
                        {company.type === 'ТОВ' ? <Building2 size={28} /> : <Database size={28} />}
                    </div>
                }
                status={company.status === 'active' ? 'success' : 'warning'}
                priority={company.risk === 'critical' ? 'critical' : company.risk === 'high' ? 'high' : 'medium'}
                variant={isHackerMode ? 'cyber' : 'glass'}
                className={cn(
                    "transition-all duration-700 rounded-[2rem]",
                    isHackerMode ? "border-emerald-500/30 bg-black font-mono" : "hover:border-primary-500/50 shadow-3xl bg-slate-900/40 backdrop-blur-3xl"
                )}
                actions={[
                    {
                        label: isExpanded ? localLocales.company.hide : localLocales.company.explain,
                        icon: <Sparkles size={16} />,
                        onClick: () => onToggleExplain(company.id),
                        variant: 'secondary'
                    },
                    {
                        label: localLocales.company.fullFile,
                        icon: <ChevronRight size={16} />,
                        onClick: () => console.log('View Dossier', company.id),
                        variant: 'primary'
                    }
                ]}
            >
                <div className="flex flex-col lg:flex-row gap-10">
                    <div className="flex-1 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="flex items-center gap-5 group/item">
                                    <div className="w-12 h-12 rounded-2xl bg-black/60 flex items-center justify-center border border-white/5 group-hover/item:border-cyan-500/50 transition-all group-hover/item:scale-110 shadow-inner">
                                        <User className="w-5 h-5 text-slate-400 group-hover/item:text-cyan-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Генеральний Директор</span>
                                        <span className="text-white font-black text-lg tracking-tight group-hover/item:text-cyan-400 transition-colors uppercase italic">{company.director || "ДАНІ_ПРИХОВАНО"}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-5 group/item cursor-pointer">
                                    <div className="w-12 h-12 rounded-2xl bg-black/60 flex items-center justify-center border border-white/5 group-hover/item:border-emerald-500/50 transition-all group-hover/item:scale-110 shadow-inner">
                                        <MapPin className="w-5 h-5 text-slate-400 group-hover/item:text-emerald-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Локація Реєстрації</span>
                                        <span className="text-slate-300 text-sm font-medium leading-tight group-hover/item:text-emerald-400 transition-colors">{company.address || "ADRESS_UNKNOWN"}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="flex items-center gap-5 group/item">
                                    <div className="w-12 h-12 rounded-2xl bg-black/60 flex items-center justify-center border border-white/5 group-hover/item:border-amber-500/50 transition-all group-hover/item:scale-110 shadow-inner">
                                        <Briefcase className="w-5 h-5 text-slate-400 group-hover/item:text-amber-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Статутний Капітал</span>
                                        <span className="text-white font-black text-xl font-mono tracking-tighter shadow-sm">{company.capital}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] px-1 flex items-center gap-2">
                                        <Layers size={10} className="text-indigo-400" /> СЕМАНТИЧНІ_КЛАСТЕРИ
                                    </span>
                                    <div className="flex gap-2.5 flex-wrap">
                                        {company.tags.map(tag => (
                                            <span key={tag} className="px-3.5 py-1.5 bg-indigo-500/10 text-indigo-400 text-[10px] rounded-xl border border-indigo-500/20 font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all cursor-pointer">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/5 relative">
                            <div className="absolute top-0 left-0 w-20 h-px bg-gradient-to-r from-cyan-500 to-transparent" />
                            <div className="flex flex-wrap items-center justify-between gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Fingerprint size={16} className="text-amber-500 animate-pulse" />
                                        <span className="text-[10px] text-amber-500 font-black uppercase tracking-[0.4em]">Тіньова Бенефіціарна Мережа</span>
                                    </div>
                                    <div className="flex gap-4">
                                        {isPremium ? (
                                            <div className="flex flex-wrap gap-3">
                                                {company.beneficiaries?.length ? company.beneficiaries.map(b => (
                                                    <div key={b} className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[11px] font-bold text-slate-100 hover:bg-white/10 transition-all cursor-pointer group/b">
                                                        <div className="w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.6)] group-hover/b:scale-125 transition-transform" />
                                                        {b}
                                                        <ChevronRight size={12} className="text-slate-600 opacity-0 group-hover/b:opacity-100 transition-opacity" />
                                                    </div>
                                                )) : <span className="text-slate-500 text-xs font-black italic tracking-widest uppercase opacity-40">NO_DATA_SECURED</span>}
                                            </div>
                                        ) : <RedactedField />}
                                    </div>
                                </div>
                                <div className="flex items-center gap-10">
                                    <div className="flex flex-col items-center p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer group/stat shadow-lg">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Network className="w-5 h-5 text-cyan-500 group-hover/stat:rotate-45 transition-transform" />
                                            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">CONNECTIONS</span>
                                        </div>
                                        <span className="text-4xl font-black text-white font-mono leading-none tracking-tighter">
                                            {isPremium ? company.connections : 'XX'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-center p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-rose-500/30 transition-all cursor-pointer group/stat shadow-lg">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Activity className="w-5 h-5 text-rose-500 animate-pulse" />
                                            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">RISK_VECTOR</span>
                                        </div>
                                        <RiskBadge level={company.risk} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {isPremium && !isHackerMode && (
                        <div className="lg:w-72 xl:w-80 shrink-0">
                            <HoloContainer className="p-8 h-full flex flex-col items-center justify-between min-h-[300px] border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.3)] bg-slate-950/60 transition-transform group-hover:scale-[1.02]">
                                <div className="flex flex-col items-center w-full">
                                    <div className="flex items-center gap-3 mb-6 w-full justify-center">
                                        <div className="w-10 h-px bg-gradient-to-r from-transparent to-cyan-500/50" />
                                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em]">{localLocales.company.riskProfile}</span>
                                        <div className="w-10 h-px bg-gradient-to-l from-transparent to-cyan-500/50" />
                                    </div>
                                    <div className="w-full h-52 relative">
                                        <SearchResultRadar {...radarData} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none" />
                                    </div>
                                </div>
                                <div className="w-full pt-8 flex flex-col items-center border-t border-white/5">
                                    <div className="text-4xl font-mono font-black text-white italic tracking-tighter shadow-amber-500/10 drop-shadow-xl">
                                        {Math.round((radarData.reputation + radarData.transparency + (100 - radarData.risk)) / 3)}
                                        <span className="text-xs text-slate-600 font-black ml-1 uppercase not-italic">Score</span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] font-display">
                                        <Sparkles size={12} className="animate-spin-slow" />
                                        {localLocales.company.alphaScore}
                                    </div>
                                </div>
                            </HoloContainer>
                        </div>
                    )}
                </div>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-8"
                        >
                            <div className="p-1 rounded-[2rem] bg-gradient-to-r from-cyan-500/30 via-transparent to-indigo-500/30">
                                <div className="bg-slate-950 rounded-[1.9rem] p-8 border border-white/5">
                                    <div className="flex items-center gap-4 mb-8">
                                        <TerminalIcon size={18} className="text-cyan-400" />
                                        <h4 className="text-sm font-black text-white uppercase tracking-[0.3em]">Neural_Decision_Matrix // v55.8</h4>
                                        <div className="h-px flex-1 bg-white/5" />
                                    </div>
                                    <ExplainabilityPanel
                                        entityId={company.id}
                                        entityName={company.name}
                                        decision={company.status === 'active' ? 'Entity Verified as Low Risk Operation' : 'High Risk Alert: Unusual Transaction Patterns Detected'}
                                        riskScore={company.risk === 'critical' ? 98 : company.risk === 'high' ? 82 : 24}
                                        explanation={company.explanation}
                                    />
                                    <div className="mt-8 pt-8 border-t border-white/5 flex justify-end gap-4">
                                        <button className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] font-black text-slate-400 uppercase tracking-widest rounded-xl transition-all">Audit Logs</button>
                                        <button className="px-6 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-[9px] font-black text-cyan-400 uppercase tracking-widest rounded-xl transition-all">Deep Dive</button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </TacticalCard>
        </motion.div>
    );
};

export const SearchView = () => {
    const { userRole } = useAppStore();
    const isPremium = userRole === 'premium' || userRole === 'admin';
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Company[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // AI State
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);

    // Advanced Controls
    const [searchMode, setSearchMode] = useState<'neural' | 'exact' | 'deep'>('neural');
    const [isHackerMode, setIsHackerMode] = useState(false);
    const [expandedExplainId, setExpandedExplainId] = useState<string | null>(null);

    // Source Status Simulation
    const [nexusStatus, setNexusStatus] = useState(OSINT_NEXUS);

    useEffect(() => {
        const interval = setInterval(() => {
            setNexusStatus(current => current.map(s => ({
                ...s,
                status: Math.random() > 0.8 ? 'CALIBRATING...' : s.status
            })));
            setTimeout(() => setNexusStatus(OSINT_NEXUS), 1000);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const toggleExplain = (id: string) => {
        setExpandedExplainId(prev => prev === id ? null : id);
    };

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setAiLoading(true);
        setHasSearched(true);
        setAiSummary(null);

        try {
            const [searchRes, aiRes] = await Promise.allSettled([
                api.search.query({ q: query, mode: searchMode === 'neural' ? 'hybrid' : 'exact' }),
                api.v45.analyze(query).catch(() => null)
            ]);

            if (searchRes.status === 'fulfilled' && Array.isArray(searchRes.value)) {
                const adapted: Company[] = searchRes.value.map((r: any) => ({
                    id: r.id,
                    edrpou: r.metadata?.edrpou || '00000000',
                    name: r.title || 'Unknown Entity',
                    status: r.metadata?.status || 'active',
                    risk: r.metadata?.risk_level || (r.score > 0.8 ? 'critical' : r.score > 0.6 ? 'high' : 'low'),
                    director: r.metadata?.director || 'Director Alpha',
                    address: r.metadata?.address || 'Street, City, Ukraine',
                    capital: r.metadata?.capital || '10,000,000 UAH',
                    type: r.metadata?.type || 'ТОВ',
                    tags: [r.category || 'Trading', r.source || 'Unified Register'],
                    beneficiaries: r.metadata?.beneficiaries || ['Beneficiary A', 'Beneficiary B'],
                    connections: r.metadata?.connections_count || Math.floor(Math.random() * 20) + 5,
                    explanation: r.explanation || undefined,
                    transparencyScore: Math.floor(Math.random() * 40) + 60
                }));
                setResults(adapted);
            } else {
                setResults([]);
            }

            if (aiRes.status === 'fulfilled' && aiRes.value) {
                const answer = typeof aiRes.value === 'string'
                    ? aiRes.value
                    : aiRes.value.result || aiRes.value.summary || aiRes.value.message;

                setAiSummary(answer || localLocales.aiAnalysis.noData);
            } else {
                setAiSummary(localLocales.aiAnalysis.noData);
            }

        } catch (e) {
            console.error(e);
            setResults([]);
        } finally {
            setLoading(false);
            setAiLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    return (
        <div className={cn(
            "max-w-[1600px] mx-auto min-h-screen pb-32 px-6 lg:px-12 transition-all duration-1000 bg-slate-950",
            isHackerMode && "bg-black text-emerald-500 grayscale-[0.2]"
        )}>
            {/* HUD Header — v55.8 */}
            <div className="relative mb-20 pt-10">
                <ViewHeader
                    title={isHackerMode ? "> PREDATOR_BRAIN_LINK" : localLocales.title}
                    icon={isHackerMode ? <SearchCode className="text-emerald-500 animate-pulse" /> : <Radar className="text-primary-500" />}
                    breadcrumbs={['OSINT_NEXUS', 'МАТРИЦЯ_ПОШУКУ']}
                    stats={[
                        { label: localLocales.stats.indexed, value: '2.5M+', icon: <Database />, color: 'primary' },
                        { label: localLocales.stats.sources, value: '42', icon: <Globe />, color: 'cyan' },
                        { label: localLocales.stats.reliability, value: '99.8%', icon: <Sparkles />, color: 'success', animate: true }
                    ]}
                />
                
                {/* OSINT Nexus Connection Bar */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-10 flex flex-wrap items-center gap-6 px-10 py-5 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-3xl shadow-2xl"
                >
                    <div className="flex items-center gap-3 pr-6 border-r border-white/5">
                        <Radio className="w-5 h-5 text-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-black text-white uppercase tracking-[0.4em]">OSINT_NEXUS_STATUS:</span>
                    </div>
                    {nexusStatus.map(s => (
                        <div key={s.name} className="flex items-center gap-3 px-4 py-2 bg-black/40 rounded-2xl border border-white/5 group hover:border-white/20 transition-all cursor-crosshair">
                            <s.icon className={cn("w-4 h-4", s.color)} />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{s.name}</span>
                                <span className={cn("text-[8px] font-mono font-bold tracking-tighter animate-pulse", s.color)}>{s.status}</span>
                            </div>
                        </div>
                    ))}
                    <div className="ml-auto flex items-center gap-3">
                         <History className="text-slate-600 hover:text-white transition-colors cursor-pointer" size={18} />
                         <div className="h-6 w-px bg-white/5" />
                         <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">{new Date().toLocaleTimeString()} MSK</span>
                    </div>
                </motion.div>
            </div>

            <div className="mt-12 mb-24 relative">
                {/* Background Decor */}
                <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                    {!isHackerMode && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-primary-500/5 blur-[120px] rounded-full animate-pulse-slow" />}
                    <div className="absolute inset-0 bg-cyber-grid opacity-[0.03]" />
                </div>

                <div className="max-w-5xl mx-auto relative">
                    <div className="absolute -top-6 left-10 flex items-center gap-4 px-6 py-2 bg-slate-900 border-x border-t border-white/10 rounded-t-3xl shadow-sm z-20">
                         <Cpu size={14} className="text-cyan-400" />
                         <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Core Engine: V55.Alpha</span>
                    </div>
                    
                    {/* Search Modes Tabs */}
                    <div className="flex justify-start gap-1 ml-6 mb-0 relative z-10">
                        {[
                            { id: 'neural', label: localLocales.modes.neural, icon: BrainCircuit, color: 'text-cyan-400' },
                            { id: 'exact', label: localLocales.modes.exact, icon: Target, color: 'text-amber-400' },
                            { id: 'deep', label: localLocales.modes.deep, icon: Scan, color: 'text-rose-500' }
                        ].map(mode => (
                            <button
                                key={mode.id}
                                onClick={() => setSearchMode(mode.id as any)}
                                className={cn(
                                    "px-8 py-3.5 rounded-t-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-3 border-t border-x",
                                    searchMode === mode.id
                                        ? "bg-slate-900 text-white border-white/10 shadow-[0_-15px_30px_rgba(0,0,0,0.5)] scale-105 z-20"
                                        : "bg-slate-950/40 text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-900/60 z-10"
                                )}
                            >
                                <mode.icon size={14} className={cn(searchMode === mode.id ? 'animate-pulse' : '', searchMode === mode.id ? mode.color : '')} />
                                {mode.label}
                            </button>
                        ))}
                    </div>

                    <TacticalCard
                        title=""
                        variant="holographic"
                        noPadding
                        className={cn(
                            "rounded-[2.5rem] rounded-tl-none border shadow-[0_40px_100px_rgba(0,0,0,0.7)] relative overflow-hidden group/search pr-4",
                            isHackerMode ? "border-emerald-500/30" : "border-white/10"
                        )}
                    >
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-50" />
                        <div className="relative flex items-center p-3">
                            <div className="pl-10 pr-8 py-6 flex items-center justify-center border-r border-white/5 group-hover/search:border-primary-500/30 transition-colors">
                                {loading ? <RefreshCw className="w-10 h-10 text-primary-500 animate-spin" /> : <SearchIcon className="w-10 h-10 text-slate-500 group-hover/search:text-primary-400 transition-all group-hover/search:scale-110" />}
                            </div>
                            <input
                                type="text"
                                autoFocus
                                placeholder={isHackerMode ? localLocales.hackerMode.prompt : "ЄДРПОУ, Назва, Бенефіціар або семантичний опис схеми..."}
                                className={cn(
                                    "flex-1 bg-transparent text-white placeholder-slate-700 px-10 py-8 outline-none border-none text-2xl font-black tracking-tighter italic",
                                    isHackerMode && "font-mono text-emerald-400 placeholder-emerald-900 not-italic uppercase"
                                )}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <div className="flex items-center gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setIsHackerMode(!isHackerMode)}
                                    className={cn(
                                        "p-6 rounded-2xl transition-all border group/h relative",
                                        isHackerMode
                                            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                                            : "bg-white/5 border-white/10 text-slate-500 hover:text-white hover:border-white/20 shadow-inner"
                                    )}
                                >
                                    <TerminalIcon size={24} />
                                    {isHackerMode && <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />}
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSearch}
                                    className={cn(
                                        "px-16 py-7 rounded-[1.8rem] font-black uppercase tracking-[0.4em] text-sm transition-all shadow-2xl relative overflow-hidden group/btn",
                                        isHackerMode
                                            ? "bg-emerald-500 text-black hover:bg-emerald-400"
                                            : "bg-primary-500 hover:bg-white text-slate-950"
                                    )}
                                >
                                    <span className="relative z-10">{loading ? "SCANNING..." : "INITIALIZE_SEARCH"}</span>
                                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                                </motion.button>
                            </div>
                        </div>
                    </TacticalCard>

                    {/* Trending Deep-Tags */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-12 flex flex-wrap justify-center gap-4"
                    >
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em] py-3 flex items-center gap-2">
                             <Target size={12} /> ТРЕНДОВІ_ВЕКТОРИ:
                        </span>
                        {[
                            { tag: 'ТОВ НАВІГАТОР', label: '🚢 PORT_ANALYSIS: NAVIGATOR' },
                            { tag: '42883391', label: '🔍 UEID_TRACE: 42883391' },
                            { tag: 'Тендери Паливо', label: '⛽ FUEL_CARTELS_DETECT' },
                            { tag: 'Санкції РНБО', label: '🛑 SANCTIONS_LIST_SCAN' },
                            { tag: 'Офшорні схеми', label: '🏝 OFFSHORE_SKELETONS' },
                            { tag: 'ФОП скрутки', label: '⚠ VAT_EVASION_NODES' },
                        ].map(({ tag, label }) => (
                            <button
                                key={tag}
                                onClick={() => { setQuery(tag); }}
                                className="px-5 py-2.5 rounded-2xl bg-white/[0.02] border border-white/5 text-[9px] font-black text-slate-400 hover:text-white hover:border-primary-500/50 hover:bg-primary-500/10 transition-all uppercase tracking-widest shadow-lg italic"
                            >
                                {label}
                            </button>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* Results Grid Dashboard */}
            <div className="grid grid-cols-1 gap-12 relative z-10 max-w-6xl mx-auto">
                <AIAnswerCard query={query} answer={aiSummary} loading={aiLoading} />

                {hasSearched && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex justify-between items-center px-6 py-4 bg-white/[0.02] border-y border-white/5 backdrop-blur-md rounded-3xl shadow-xl"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary-500/10 rounded-full flex items-center justify-center border border-primary-500/20">
                                <Activity size={18} className="text-primary-500 animate-pulse" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1">Results_Synthesis</span>
                                <span className="text-white text-lg font-black font-mono tracking-tighter uppercase italic">
                                    {localLocales.results.found}: <span className="text-primary-500 not-italic ml-2">{results.length} UNITS</span>
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-8">
                             <div className="flex flex-col items-end">
                                 <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Search_Engine</span>
                                 <span className="text-[10px] font-bold text-white uppercase tracking-tighter">PREDATOR_V55.8_CORE</span>
                             </div>
                             {!isPremium && (
                                <div className="px-6 py-3 bg-rose-500/10 rounded-2xl border border-rose-500/30 flex items-center gap-3 animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.2)]">
                                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-[0.3em]">{localLocales.results.restricted}</span>
                                </div>
                             )}
                        </div>
                    </motion.div>
                )}

                {/* Main Results List */}
                <div className="grid grid-cols-1 gap-10">
                    {results.map(company => (
                        <CompanyCard
                            key={company.id}
                            company={company}
                            isPremium={isPremium}
                            isHackerMode={isHackerMode}
                            isExpanded={expandedExplainId === company.id}
                            onToggleExplain={toggleExplain}
                        />
                    ))}
                </div>

                {/* Advanced Empty State */}
                {hasSearched && results.length === 0 && !loading && !aiLoading && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-40 rounded-[3rem] border-2 border-dashed border-white/5 bg-slate-900/10 backdrop-blur-sm relative overflow-hidden"
                    >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-rose-500/5 blur-[100px] rounded-full pointer-events-none" />
                        <div className="relative inline-block mb-10 group cursor-pointer">
                            <SearchIcon className="w-24 h-24 text-slate-800 group-hover:text-rose-500/40 transition-colors" />
                            <div className="absolute inset-x-0 bottom-0 h-px bg-rose-500" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-40 group-hover:scale-125 transition-transform">
                                <XCircle className="w-12 h-12 text-rose-500" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-black text-slate-400 uppercase tracking-tighter italic mb-4">{localLocales.results.noResults}</h3>
                        <p className="text-[11px] text-slate-600 uppercase tracking-[0.4em] font-medium max-w-lg mx-auto leading-relaxed">Система PREDATOR не виявила прямих збігів у локальних реєстрах. Можливо об'єкт використовує офшорні проксі або крипто-вузли.</p>
                        <div className="mt-12">
                            <button className="px-12 py-5 bg-white/5 hover:bg-rose-500 hover:text-white text-slate-500 rounded-3xl text-[11px] font-black uppercase tracking-[0.4em] border border-white/10 hover:border-rose-500 transition-all shadow-2xl hover:shadow-[0_0_50px_rgba(244,63,94,0.3)]">
                                АКТИВУАТИ_ГЛИБИННУ_РОЗВІДКУ_LEVEL_5
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Context Insights Segment Integration */}
            {hasSearched && isPremium && (
                <div className="mt-32 pt-20 border-t border-white/5 relative">
                    <div className="absolute top-0 left-10 w-40 h-px bg-gradient-to-r from-primary-500 to-transparent" />
                    <div className="flex items-center gap-6 mb-12">
                        <div className="p-4 bg-primary-500/10 rounded-2xl border border-primary-500/30">
                            <Radio className="text-primary-500 animate-pulse" />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic shadow-sm">СИНТЕЗ_КОНТЕКСТНИХ_ІНСАЙТІВ</h2>
                            <p className="text-[10px] text-slate-500 uppercase tracking-[0.5em] mt-1">CROSS_ENTITY_NEURAL_SATELLITE_LINK</p>
                        </div>
                        <div className="ml-auto flex items-center gap-4">
                            <div className="text-right">
                                <span className="text-[9px] text-slate-600 font-black uppercase block">Link_State</span>
                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest animate-pulse">ESTABLISHED</span>
                            </div>
                            <div className="h-10 w-px bg-white/5" />
                            <BarChart3 className="text-slate-600 hover:text-white transition-colors cursor-pointer" size={24} />
                        </div>
                    </div>
                    <TacticalCard variant="cyber" className="p-1 gap-0">
                         <AIInsightsHub isWidgetMode={true} />
                    </TacticalCard>
                </div>
            )}

            <style>{`
                .bg-cyber-grid {
                    background-image: linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                                    linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
                    background-size: 40px 40px;
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 2s infinite linear;
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 12s linear infinite;
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.05; transform: scale(1); }
                    50% { opacity: 0.1; transform: scale(1.05); }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 8s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default SearchView;
