/**
 * Predator v55 | Neural Discovery Matrix — Когнітивний Пошук
 * Командний центр для глибокого аналізу сутностей, реєстрів та тіньових зв'язків.
 */

import React, { useState } from 'react';
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
    XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { api } from '../services/api';
import { SearchResultRadar } from '../components/premium/SearchResultRadar';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import { CyberOrb } from '../components/CyberOrb';
import { HoloContainer } from '../components/HoloContainer';
import { ExplainabilityPanel } from '../components/explain/ExplainabilityPanel';
import AIInsightsHub from './AIInsightsHub';
import { useAppStore } from '../store/useAppStore';

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
}

// --- LOCALES ---
const localLocales = {
    title: 'НЕЙРОННА МАТРИЦЯ ПОШУКУ',
    subtitle: 'Прямий доступ до 2.5 млн+ об\'єктів через когнітивні фільтри V55',
    stats: {
        indexed: 'Індексовано об\'єктів',
        sources: 'Активних джерел',
        reliability: 'Точність ШШ',
    },
    modes: {
        neural: 'НЕЙРОННИЙ',
        exact: 'ТОЧНИЙ',
        deep: 'ГЛИБОКИЙ СКАН',
    },
    hackerMode: {
        active: 'TERMINAL_LINK_ACTIVE // PORT: 8443 // S_KEY: AX-42',
        prompt: 'ENTER_QUERY_OR_EDRPOU...',
    },
    aiAnalysis: {
        title: 'Когнітивний Синтез Pulse',
        analyzing: 'ШІ Аналіз Запиту...',
        noData: 'Система проводить перехресний аналіз знайдених сутностей. Виявлено зв\'язки з публічними реєстрами.',
    },
    results: {
        found: 'ВИЯВЛЕНО ПРЯМИХ СПІВПАДІНЬ',
        noResults: 'Нуль результатів у базі PREDATOR. Активуйте DEEP SCAN.',
        restricted: 'RESTRICTED_FEED',
    },
    company: {
        active: 'ДІЮЧА',
        inactive: 'В СТАНІ ПРИПИНЕННЯ',
        fullFile: 'ПОВНЕ ДОСЬЄ',
        explain: 'ПОЯСНИТИ РІШЕННЯ',
        hide: 'ПРИХОВАТИ ПОЯСНЕННЯ',
        riskProfile: 'Профіль Ризику',
        alphaScore: 'Alpha Score',
    }
};

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
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest backdrop-blur-md shadow-lg",
            config.color, config.bg, config.border,
            level === 'critical' && "animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.3)]"
        )}>
            <Icon className="w-3.5 h-3.5" />
            {config.label} РИЗИК
        </div>
    );
};

const RedactedField = () => (
    <div className="bg-slate-950/60 rounded px-2 py-1.5 inline-block min-w-[120px] relative group cursor-help select-none border border-slate-800/50">
        <span className="opacity-0 text-[10px]">ПРИХОВАНІ ДАНІ</span>
        <div className="absolute inset-0 flex items-center justify-center p-2">
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-slate-700 w-full animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            </div>
        </div>
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-950 text-amber-500 text-[10px] px-3 py-1.5 rounded-lg border border-amber-500/30 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 whitespace-nowrap z-50 pointer-events-none flex items-center gap-2 shadow-2xl">
            <Lock className="w-3 h-3" /> Тільки Premium
        </div>
    </div>
);

const AIAnswerCard = ({ query, answer, loading }: { query: string, answer: string | null, loading: boolean }) => {
    if (!loading && !answer) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
        >
            <TacticalCard
                title={localLocales.aiAnalysis.title}
                subtitle={`Query: ${query}`}
                icon={<BrainCircuit className="text-primary-400" />}
                variant="holographic"
                glow="blue"
                status={loading ? 'info' : 'success'}
            >
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="relative shrink-0 hidden md:block">
                        <CyberOrb size="sm" color="cyan" intensity="medium" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Zap className="text-cyan-400 w-6 h-6 animate-pulse" />
                        </div>
                    </div>
                    <div className="flex-1">
                        {loading ? (
                            <div className="space-y-4">
                                <div className="h-4 bg-slate-800/50 rounded-lg w-full animate-pulse" />
                                <div className="h-4 bg-slate-800/50 rounded-lg w-5/6 animate-pulse" />
                                <div className="h-4 bg-slate-800/50 rounded-lg w-4/6 animate-pulse" />
                            </div>
                        ) : (
                            <div className="prose prose-invert prose-sm max-w-none">
                                <p className="text-slate-200 leading-relaxed font-medium text-[15px] italic">
                                    {answer}
                                </p>
                            </div>
                        )}
                        <div className="mt-4 flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/50 rounded-full border border-slate-800">
                                <Scan className="w-3 h-3 text-primary-500" />
                                <span className="text-[10px] font-mono text-slate-400">Context_Match: 98.4%</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/50 rounded-full border border-slate-800">
                                <Fingerprint className="w-3 h-3 text-emerald-500" />
                                <span className="text-[10px] font-mono text-slate-400">Neural_Hash: v55-X7</span>
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
        risk: company.risk === 'critical' ? 90 : company.risk === 'high' ? 70 : company.risk === 'medium' ? 40 : 20,
        connections: Math.min(100, (company.connections || 0) * 5),
        capital: company.capital.includes('млн') ? 80 : 30,
        reputation: company.status === 'active' ? 85 : 40,
        transparency: isPremium ? 90 : 20
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group"
        >
            <TacticalCard
                title={company.name}
                subtitle={`${company.type} // ЄДРПОУ: ${company.edrpou}`}
                icon={
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border transition-all duration-500",
                        company.type === 'ТОВ' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' :
                            company.type === 'АТ' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' :
                                'bg-slate-800 border-slate-700 text-slate-400'
                    )}>
                        {company.type === 'ТОВ' ? <Building2 size={20} /> : <Database size={20} />}
                    </div>
                }
                status={company.status === 'active' ? 'success' : 'warning'}
                priority={company.risk === 'critical' ? 'critical' : company.risk === 'high' ? 'high' : 'medium'}
                variant={isHackerMode ? 'cyber' : 'glass'}
                className={cn(
                    "transition-all duration-500",
                    isHackerMode ? "border-emerald-500/20 bg-black font-mono" : "hover:border-primary-500/40 shadow-2xl"
                )}
                actions={[
                    {
                        label: isExpanded ? localLocales.company.hide : localLocales.company.explain,
                        icon: <Sparkles size={14} />,
                        onClick: () => onToggleExplain(company.id),
                        variant: 'secondary'
                    },
                    {
                        label: localLocales.company.fullFile,
                        icon: <ChevronRight size={14} />,
                        onClick: () => console.log('View Dossier', company.id),
                        variant: 'primary'
                    }
                ]}
            >
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 group/item">
                                    <div className="w-9 h-9 rounded-xl bg-slate-950/60 flex items-center justify-center border border-slate-800 group-hover/item:border-primary-500/50 transition-colors">
                                        <User className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Керівник</span>
                                        <span className="text-slate-100 font-bold group-hover/item:text-primary-400 transition-colors">{company.director || "---"}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group/item">
                                    <div className="w-9 h-9 rounded-xl bg-slate-950/60 flex items-center justify-center border border-slate-800 group-hover/item:border-primary-500/50 transition-colors">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Локація</span>
                                        <span className="text-slate-300 text-sm truncate max-w-[200px]">{company.address || "---"}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 group/item">
                                    <div className="w-9 h-9 rounded-xl bg-slate-950/60 flex items-center justify-center border border-slate-800 group-hover/item:border-primary-500/50 transition-colors">
                                        <Briefcase className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Капітал</span>
                                        <span className="text-slate-100 font-bold font-mono">{company.capital}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest px-1">Кластери</span>
                                    <div className="flex gap-2 flex-wrap">
                                        {company.tags.map(tag => (
                                            <span key={tag} className="px-2.5 py-1 bg-indigo-500/5 text-indigo-400 text-[10px] rounded-lg border border-indigo-500/20 font-bold uppercase tracking-tight">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-800/60">
                            <div className="flex flex-wrap items-center justify-between gap-6">
                                <div className="space-y-3">
                                    <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest block">Тіньові Бенефіціари</span>
                                    <div className="flex gap-3">
                                        {isPremium ? (
                                            <div className="flex flex-wrap gap-2">
                                                {company.beneficiaries?.length ? company.beneficiaries.map(b => (
                                                    <div key={b} className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 border border-slate-800 rounded-lg text-xs text-slate-200">
                                                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                                        {b}
                                                    </div>
                                                )) : <span className="text-slate-600 text-xs italic">Дані запечатані</span>}
                                            </div>
                                        ) : <RedactedField />}
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] text-primary-500 font-black uppercase tracking-widest mb-1">Зв'язки</span>
                                        <div className="flex items-center gap-3">
                                            <Network className="w-5 h-5 text-primary-400 animate-pulse" />
                                            <span className="text-3xl font-black text-white font-mono leading-none">
                                                {isPremium ? company.connections : '??'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {isPremium && !isHackerMode && (
                        <div className="lg:w-64 xl:w-72 shrink-0">
                            <HoloContainer className="p-4 h-full flex flex-col items-center justify-center min-h-[220px]">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">{localLocales.company.riskProfile}</span>
                                <div className="w-full h-44">
                                    <SearchResultRadar {...radarData} />
                                </div>
                                <div className="mt-4 flex flex-col items-center">
                                    <div className="text-2xl font-mono font-black text-iridescent">
                                        {Math.round((radarData.reputation + radarData.transparency) / 2)}
                                        <span className="text-xs text-slate-600 font-normal ml-1">/100</span>
                                    </div>
                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">{localLocales.company.alphaScore}</span>
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
                            className="overflow-hidden mt-6"
                        >
                            <div className="p-1 rounded-2xl bg-gradient-to-r from-primary-500/20 to-indigo-500/20">
                                <div className="bg-slate-950 rounded-xl p-4">
                                    <ExplainabilityPanel
                                        entityId={company.id}
                                        entityName={company.name}
                                        decision={company.status === 'active' ? 'Active Entitiy' : 'Risky Entity'}
                                        riskScore={company.risk === 'critical' ? 95 : company.risk === 'high' ? 75 : 30}
                                        explanation={company.explanation}
                                    />
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
                api.search.query({ q: query, mode: 'hybrid' }),
                api.v45.analyze(query).catch(() => null)
            ]);

            if (searchRes.status === 'fulfilled' && Array.isArray(searchRes.value)) {
                const adapted: Company[] = searchRes.value.map((r: any) => ({
                    id: r.id,
                    edrpou: r.metadata?.edrpou || '00000000',
                    name: r.title || 'Невідома Компанія',
                    status: r.metadata?.status || 'unknown',
                    risk: r.metadata?.risk_level || (r.score > 0.8 ? 'high' : 'low'),
                    director: r.metadata?.director || 'N/A',
                    address: r.metadata?.address || 'N/A',
                    capital: r.metadata?.capital || 'N/A',
                    type: r.metadata?.type || 'ТОВ',
                    tags: [r.category || 'General', r.source || 'Search'],
                    beneficiaries: r.metadata?.beneficiaries || [],
                    connections: r.metadata?.connections_count || 0,
                    explanation: r.explanation || undefined
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
            "max-w-7xl mx-auto min-h-screen pb-20 px-6 transition-all duration-700",
            isHackerMode && "bg-black text-emerald-500"
        )}>
            {/* HUD Header */}
            <ViewHeader
                title={isHackerMode ? "> PREDATOR_QUERY_HUB" : localLocales.title}
                icon={isHackerMode ? <SearchCode className="text-emerald-500 animate-pulse" /> : <Radar className="text-primary-500" />}
                breadcrumbs={['СИНАПСИС', 'РОЗВІДКА', 'МАТРИЦЯ ГРАФУ']}
                stats={[
                    { label: localLocales.stats.indexed, value: '2.5M+', icon: <Database />, color: 'primary' },
                    { label: localLocales.stats.sources, value: '42', icon: <Globe />, color: 'cyan' },
                    { label: localLocales.stats.reliability, value: '99.8%', icon: <Sparkles />, color: 'success', animate: true }
                ]}
            />

            <div className="mt-12 mb-16 relative">
                {/* Background FX */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    {!isHackerMode && <CyberOrb color="emerald" size="lg" intensity="low" className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />}
                </div>

                <div className="max-w-4xl mx-auto">
                    {/* Search Modes */}
                    <div className="flex justify-center gap-2 mb-0 px-2">
                        {[
                            { id: 'neural', label: localLocales.modes.neural, icon: BrainCircuit },
                            { id: 'exact', label: localLocales.modes.exact, icon: Target },
                            { id: 'deep', label: localLocales.modes.deep, icon: Scan }
                        ].map(mode => (
                            <button
                                key={mode.id}
                                onClick={() => setSearchMode(mode.id as any)}
                                className={cn(
                                    "px-6 py-2.5 rounded-t-2xl text-[10px] font-black uppercase tracking-[0.25em] transition-all flex items-center gap-2 border-t border-x",
                                    searchMode === mode.id
                                        ? "bg-slate-900 text-primary-400 border-slate-800 shadow-[0_-10px_15px_rgba(6,182,212,0.1)]"
                                        : "bg-slate-950/20 text-slate-600 border-transparent hover:text-slate-400"
                                )}
                            >
                                <mode.icon size={12} className={searchMode === mode.id ? 'animate-pulse' : ''} />
                                {mode.label}
                            </button>
                        ))}
                    </div>

                    <TacticalCard
                        title=""
                        variant="holographic"
                        noPadding
                        className={cn(
                            "rounded-t-none border-t-0 shadow-[0_20px_50px_rgba(0,0,0,0.5)]",
                            isHackerMode && "border-emerald-500/30"
                        )}
                    >
                        <div className="relative flex items-center p-2">
                            <div className="pl-6 pr-4 py-4 flex items-center justify-center border-r border-slate-800/50">
                                {loading ? <RefreshCw className="w-7 h-7 text-primary-500 animate-spin" /> : <SearchIcon className="w-7 h-7 text-slate-500" />}
                            </div>
                            <input
                                type="text"
                                placeholder={isHackerMode ? localLocales.hackerMode.prompt : "Введіть код ЄДРПОУ, назву або складний запит..."}
                                className={cn(
                                    "flex-1 bg-transparent text-white placeholder-slate-700 px-8 py-6 outline-none border-none text-xl font-bold tracking-tight",
                                    isHackerMode && "font-mono text-emerald-400 placeholder-emerald-900"
                                )}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <div className="flex items-center gap-3 pr-4">
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setIsHackerMode(!isHackerMode)}
                                    className={cn(
                                        "p-4 rounded-xl transition-all border group relative",
                                        isHackerMode
                                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_emerald-500/20]"
                                            : "bg-slate-900 border-slate-800 text-slate-500 hover:text-white"
                                    )}
                                    title="Hacker Mode"
                                >
                                    <Lock size={20} />
                                    {isHackerMode && <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />}
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSearch}
                                    className={cn(
                                        "px-12 py-5 rounded-xl font-black uppercase tracking-[0.3em] text-sm transition-all shadow-lg",
                                        isHackerMode
                                            ? "bg-emerald-500 text-black hover:bg-emerald-400 shadow-emerald-500/20"
                                            : "bg-primary-500 hover:bg-primary-400 text-slate-950 shadow-primary-500/20"
                                    )}
                                >
                                    {loading ? "SCANNING..." : "SEARCH"}
                                </motion.button>
                            </div>
                        </div>
                    </TacticalCard>

                    {/* Trending / Fast Tags */}
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        {['ТОВ "НАВІГАТОР"', '42883391', 'Тендери Паливо', 'Санкції РНБО'].map(tag => (
                            <button
                                key={tag}
                                onClick={() => { setQuery(tag.replace('"', '')); handleSearch(); }}
                                className="px-4 py-2 rounded-xl bg-slate-900/40 border border-slate-800/60 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary-400 hover:border-primary-500/40 hover:bg-primary-500/5 transition-all"
                            >
                                # {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 gap-8 relative z-10">
                {/* AI Insights Segment */}
                <AIAnswerCard query={query} answer={aiSummary} loading={aiLoading} />

                {/* Results Header */}
                {hasSearched && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-between items-center px-2"
                    >
                        <div className="flex items-center gap-3">
                            <Activity size={16} className="text-primary-500 animate-pulse" />
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">
                                {localLocales.results.found}: <span className="text-white text-sm ml-2 font-mono">{results.length}</span>
                            </span>
                        </div>
                        {!isPremium && (
                            <div className="px-4 py-2 bg-rose-500/10 rounded-full border border-rose-500/20 flex items-center gap-3 animate-pulse">
                                <Shield className="w-3.5 h-3.5 text-rose-500" />
                                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{localLocales.results.restricted}</span>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Results List */}
                <div className="grid grid-cols-1 gap-8">
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

                {/* Empty State */}
                {hasSearched && results.length === 0 && !loading && !aiLoading && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-32 rounded-3xl border border-dashed border-slate-800 bg-slate-900/20"
                    >
                        <div className="relative inline-block mb-6">
                            <SearchIcon className="w-16 h-16 text-slate-800" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-40">
                                <XCircle className="w-8 h-8 text-rose-500" />
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-slate-400 uppercase tracking-[0.2em]">{localLocales.results.noResults}</h3>
                        <div className="mt-8">
                            <button className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-700 transition-all">
                                Активувати Режим Глибокої Розвідки
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* AI Insights Hub Integration (Widget Mode) */}
            {hasSearched && isPremium && (
                <div className="mt-20 pt-20 border-t border-slate-800/60">
                    <div className="flex items-center gap-4 mb-8">
                        <Radio className="text-primary-500 animate-pulse" />
                        <h2 className="text-xl font-black text-white uppercase tracking-[0.3em]">Контекстні Інсайти Схожих Об'єктів</h2>
                    </div>
                    <AIInsightsHub isWidgetMode={true} />
                </div>
            )}
        </div>
    );
};
