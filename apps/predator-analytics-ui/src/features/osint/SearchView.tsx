import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    Globe,
    MapPin,
    BrainCircuit,
    Sparkles,
    RefreshCw,
    Target,
    Activity,
    Fingerprint,
    Radio,
    Scan,
    Database,
    SearchCode,
    Radar,
    ShieldAlert,
    Terminal as TerminalIcon,
    BarChart3,
    Layers,
    Clock3,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { api } from '@/services/api';
import { SearchResultRadar } from '@/components/premium/SearchResultRadar';
import { TacticalCard } from '@/components/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { HoloContainer } from '@/components/HoloContainer';
import { ExplainabilityPanel } from '@/components/explain/ExplainabilityPanel';
import AIInsightsHub from '@/features/ai/AIInsightsHub';
import {
    type Company,
    type SearchMode,
    formatDateTime,
    normalizeCompany,
    getRiskPriority,
    getRadarMetrics,
    buildDecisionSummary,
} from '@/features/osint/searchView.utils';
import { useAppStore } from '@/store/useAppStore';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { RiskLevelValue as RiskLevel } from '@/types/intelligence';

const SEARCH_MODES: Array<{
    id: SearchMode;
    label: string;
    description: string;
    icon: typeof BrainCircuit;
    color: string;
}> = [
    {
        id: 'neural',
        label: 'Гібридний пошук',
        description: 'Назва, ЄДРПОУ, бенефіціар або довільний опис.',
        icon: BrainCircuit,
        color: 'text-cyan-400',
    },
    {
        id: 'exact',
        label: 'Точний збіг',
        description: 'Для точного ЄДРПОУ або повної назви.',
        icon: Target,
        color: 'text-amber-400',
    },
    {
        id: 'deep',
        label: 'Поглиблений відбір',
        description: 'Гібридний пошук з додатковим переранжуванням.',
        icon: Scan,
        color: 'text-amber-400',
    },
];

const QUICK_QUERIES = [
    '42883391',
    'Санкції РНБО',
    'Офшорні структури',
    'Паливні тендери',
    'Експорт зерна',
    'Логістичні посередники',
];


const RiskBadge = ({ level, label }: { level: RiskLevel; label: string }) => {
    const configs: Record<
        RiskLevel,
        { color: string; bg: string; border: string; icon: typeof CheckCircle }
    > = {
        low: {
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            icon: CheckCircle,
        },
        medium: {
            color: 'text-amber-300',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            icon: AlertTriangle,
        },
        high: {
            color: 'text-red-300',
            bg: 'bg-red-500/10',
            border: 'border-red-500/20',
            icon: AlertTriangle,
        },
        critical: {
            color: 'text-amber-300',
            bg: 'bg-amber-500/15',
            border: 'border-amber-500/30',
            icon: ShieldAlert,
        },
        stable: {
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            icon: CheckCircle,
        },
        minimal: {
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            icon: CheckCircle,
        },
        watchlist: {
            color: 'text-amber-300',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            icon: AlertTriangle,
        },
        elevated: {
            color: 'text-amber-300',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            icon: AlertTriangle,
        },
    };
    const config = configs[level];
    const Icon = config.icon;

    return (
        <div
            className={cn(
                'flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest',
                config.color,
                config.bg,
                config.border,
            )}
        >
            <Icon className="h-4 w-4" />
            {label}
        </div>
    );
};

const RedactedField = () => (
    <div className="group relative inline-flex min-w-[180px] items-center justify-center rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-center">
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
            Доступно для розширених ролей
        </span>
        <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 rounded-xl border border-amber-500/30 bg-amber-950 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-amber-300 opacity-0 transition-all group-hover:opacity-100">
            Бекенд не розкриває поле для поточної ролі
        </div>
    </div>
);

const AIAnswerCard = ({
    query,
    answer,
    loading,
    sourceLabel,
    statusLabel,
}: {
    query: string;
    answer: string | null;
    loading: boolean;
    sourceLabel: string;
    statusLabel: string;
}) => {
    if (!loading && !answer) {
        return null;
    }

    return (
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <TacticalCard
                title="Аналітичний висновок за запитом"
                subtitle={`Запит: ${query}`}
                icon={<BrainCircuit className="text-cyan-400" />}
                variant="holographic"
                glow="blue"
                status={loading ? 'info' : 'success'}
            >
                <div className="space-y-5">
                    {loading ? (
                        <div className="space-y-3">
                            <div className="h-5 w-full animate-pulse rounded-xl bg-white/5" />
                            <div className="h-5 w-5/6 animate-pulse rounded-xl bg-white/5" />
                            <div className="h-5 w-4/6 animate-pulse rounded-xl bg-white/5" />
                        </div>
                    ) : (
                        <p className="text-base font-semibold leading-relaxed text-slate-200">{answer}</p>
                    )}

                    <div className="flex flex-wrap gap-3">
                        <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-2">
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Джерело</div>
                            <div className="text-xs font-semibold text-white">{sourceLabel}</div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-2">
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Стан бекенду</div>
                            <div className="text-xs font-semibold text-white">{statusLabel}</div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-2">
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Контур аналізу</div>
                            <div className="text-xs font-semibold text-white">Модуль пояснення v45</div>
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
    isConsoleMode,
    isExpanded,
    onToggleExplain,
}: {
    company: Company;
    isPremium: boolean;
    isConsoleMode: boolean;
    isExpanded: boolean;
    onToggleExplain: (id: string) => void;
}) => {
    const radarData = getRadarMetrics(company);
    const hasRadarData = Object.values(radarData).some((value) => value > 0);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className="group relative"
        >
            <div className="absolute -inset-0.5 rounded-[2.5rem] bg-gradient-to-r from-primary-500/15 to-cyan-500/10 blur-xl opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
            <TacticalCard
                title={company.name}
                subtitle={`${company.type || 'Субʼєкт'} · Ідентифікатор: ${company.identifier}`}
                icon={
                    <div
                        className={cn(
                            'flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-500 group-hover:scale-110',
                            company.risk === 'critical'
                                ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                                : company.type === 'person'
                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                                    : 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300',
                        )}
                    >
                        {company.type === 'person' ? <User size={28} /> : <Building2 size={28} />}
                    </div>
                }
                status={company.status === 'active' ? 'success' : 'warning'}
                priority={getRiskPriority(company.risk)}
                variant={isConsoleMode ? 'cyber' : 'glass'}
                className={cn(
                    'rounded-[2rem] transition-all duration-700',
                    isConsoleMode ? 'border-emerald-500/20 bg-black font-mono' : 'bg-slate-900/40 shadow-3xl',
                )}
                actions={[
                    {
                        label: isExpanded ? 'Згорнути пояснення' : 'Пояснити рішення',
                        icon: <Sparkles size={16} />,
                        onClick: () => onToggleExplain(company.id),
                        variant: 'secondary',
                    },
                    {
                        label: 'Відкрити CERS-досьє',
                        icon: <ChevronRight size={16} />,
                        onClick: () => window.location.assign(`/company/${company.identifier}/cers`),
                        variant: 'primary',
                    },
                ]}
            >
                <div className="flex flex-col gap-10 lg:flex-row">
                    <div className="flex-1 space-y-8">
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/40">
                                        <User className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <div>
                                        <div className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                            Керівник
                                        </div>
                                        <div className="text-lg font-black tracking-tight text-white">
                                            {company.director || 'Не надано бекендом'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/40">
                                        <MapPin className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <div>
                                        <div className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                            Адреса реєстрації
                                        </div>
                                        <div className="text-sm leading-relaxed text-slate-200">
                                            {company.address || 'Адресу не повернуто'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/40">
                                        <Database className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <div>
                                        <div className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                            Джерело
                                        </div>
                                        <div className="text-sm text-slate-200">
                                            {company.source || 'Не позначено у відповіді'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/40">
                                        <Briefcase className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <div>
                                        <div className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                            Статутний капітал
                                        </div>
                                        <div className="text-lg font-black tracking-tight text-white">
                                            {company.capital || 'Не надано'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/40">
                                        <Activity className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <div>
                                        <div className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                            Статус та ризик
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-200">
                                                {company.statusLabel}
                                            </span>
                                            <RiskBadge level={company.risk} label={company.riskLabel} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 px-1 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                                        <Layers size={10} className="text-yellow-400" />
                                        Мітки та контекст
                                    </div>
                                    {company.tags.length > 0 ? (
                                        <div className="flex flex-wrap gap-2.5">
                                            {company.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-yellow-300"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-xs font-semibold text-slate-500">
                                            Додаткові мітки не передані у відповіді.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-white/5 pt-8">
                            <div className="flex flex-wrap items-start justify-between gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Fingerprint size={16} className="text-amber-400" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.35em] text-amber-300">
                                            Бенефіціари та власники
                                        </span>
                                    </div>

                                    {isPremium ? (
                                        company.beneficiaries.length > 0 ? (
                                            <div className="flex flex-wrap gap-3">
                                                {company.beneficiaries.map((item) => (
                                                    <div
                                                        key={item}
                                                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold text-slate-100"
                                                    >
                                                        {item}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-xs font-semibold text-slate-500">
                                                Бекенд не повернув бенефіціарів для цього результату.
                                            </div>
                                        )
                                    ) : (
                                        <RedactedField />
                                    )}
                                </div>

                                <div className="grid min-w-[300px] grid-cols-2 gap-4">
                                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                        <div className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-500">
                                            <Network className="h-4 w-4 text-cyan-400" />
                                            Звʼязки
                                        </div>
                                        <div className="text-3xl font-black tracking-tight text-white">
                                            {isPremium ? company.connections ?? 'Н/д' : '—'}
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                        <div className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-500">
                                            <SearchIcon className="h-4 w-4 text-primary-400" />
                                            Збіг
                                        </div>
                                        <div className="text-3xl font-black tracking-tight text-white">
                                            {company.matchScore !== null && company.matchScore !== undefined
                                                ? `${company.matchScore}%`
                                                : 'Н/д'}
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                        <div className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-500">
                                            <ShieldAlert className="h-4 w-4 text-amber-300" />
                                            Ризик
                                        </div>
                                        <div className="text-3xl font-black tracking-tight text-white">
                                            {company.riskScore}
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                        <div className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-500">
                                            <Clock3 className="h-4 w-4 text-emerald-300" />
                                            Повнота
                                        </div>
                                        <div className="text-3xl font-black tracking-tight text-white">
                                            {company.completenessScore}%
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-500">
                                <span>Оновлено: {formatDateTime(company.updatedAt) || 'Немає позначки часу'}</span>
                                <span>Ідентифікатор у картці: {company.identifier}</span>
                            </div>
                        </div>
                    </div>

                    {isPremium && hasRadarData && !isConsoleMode && (
                        <div className="shrink-0 lg:w-72 xl:w-80">
                            <HoloContainer className="flex h-full min-h-[320px] flex-col items-center justify-between border-white/10 bg-slate-950/60 p-8">
                                <div className="w-full">
                                    <div className="mb-4 flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-[0.35em] text-cyan-300">
                                            Радар перевірки
                                        </span>
                                        <BarChart3 className="h-4 w-4 text-cyan-300" />
                                    </div>

                                    <div className="h-56 w-full">
                                        <SearchResultRadar {...radarData} />
                                    </div>
                                </div>

                                <div className="w-full border-t border-white/5 pt-6">
                                    <div className="text-sm font-semibold leading-relaxed text-slate-400">
                                        Побудовано з фактичних полів картки: ризик, звʼязки, капітал, статус і повнота відповіді.
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
                            className="mt-8 overflow-hidden"
                        >
                            <div className="rounded-[2rem] border border-white/10 bg-slate-950 p-8">
                                <div className="mb-8 flex items-center gap-4">
                                    <TerminalIcon size={18} className="text-cyan-400" />
                                    <h4 className="text-sm font-black uppercase tracking-[0.3em] text-white">
                                        Пояснення рішення
                                    </h4>
                                    <div className="h-px flex-1 bg-white/5" />
                                </div>

                                <ExplainabilityPanel
                                    entityId={company.id}
                                    entityName={company.name}
                                    decision={buildDecisionSummary(company)}
                                    riskScore={company.riskScore}
                                    explanation={company.explanation as any}
                                />

                                <div className="mt-8 flex flex-wrap gap-3 border-t border-white/5 pt-6 text-xs text-slate-500">
                                    <span>Ризикова оцінка: {company.riskScore}</span>
                                    <span>Категорія ризику: {company.riskLabel}</span>
                                    <span>Видача побудована тільки з наявних полів API</span>
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
    const backendStatus = useBackendStatus();
    const isPremium = userRole === 'premium' || userRole === 'admin';

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Company[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [searchMode, setSearchMode] = useState<SearchMode>('neural');
    const [isConsoleMode, setIsConsoleMode] = useState(false);
    const [expandedExplainId, setExpandedExplainId] = useState<string | null>(null);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [lastRequestedAt, setLastRequestedAt] = useState<string | null>(null);

    const toggleExplain = (id: string) => {
        setExpandedExplainId((prev) => (prev === id ? null : id));
    };

    const handleSearch = async () => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) {
            return;
        }

        setLoading(true);
        setAiLoading(true);
        setHasSearched(true);
        setExpandedExplainId(null);
        setAiSummary(null);
        setSearchError(null);
        setLastRequestedAt(new Date().toISOString());

        try {
            const [searchResult, aiResult] = await Promise.allSettled([
                api.search.query({
                    q: trimmedQuery,
                    mode: searchMode === 'exact' ? 'exact' : 'hybrid',
                    rerank: searchMode === 'deep',
                    limit: searchMode === 'deep' ? 12 : 8,
                }),
                api.v45.analyze(trimmedQuery),
            ]);

            if (searchResult.status === 'fulfilled' && Array.isArray(searchResult.value)) {
                setResults(searchResult.value.map((item: unknown, index: number) => normalizeCompany(item, index)));
                if (searchResult.value.length === 0) {
                    setSearchError(null);
                }
            } else {
                setResults([]);
                setSearchError('Пошук не повернув валідної відповіді. Перевірте доступність бекенду.');
            }

            if (aiResult.status === 'fulfilled' && aiResult.value) {
                setAiSummary(String(aiResult.value));
            } else {
                setAiSummary('Аналітичний модуль не повернув пояснення. Показано лише пошукову видачу.');
            }
        } catch (error) {
            console.error('Не вдалося виконати пошук:', error);
            setResults([]);
            setAiSummary('Пошук завершився помилкою. Перевірте стан бекенду або повторіть запит.');
            setSearchError('Не вдалося отримати результати з бекенду.');
        } finally {
            setLoading(false);
            setAiLoading(false);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    };

    const statusCards = [
        {
            name: 'Бекенд',
            value: backendStatus.statusLabel,
            icon: Database,
            color: backendStatus.isOffline ? 'text-amber-400' : 'text-emerald-400',
        },
        {
            name: 'Джерело',
            value: backendStatus.sourceLabel,
            icon: Globe,
            color: backendStatus.sourceType === 'remote' ? 'text-cyan-400' : 'text-amber-300',
        },
        {
            name: 'Режим даних',
            value: backendStatus.modeLabel,
            icon: Radio,
            color: 'text-yellow-300',
        },
        {
            name: 'Аналітика v45',
            value: aiLoading ? 'Виконується аналіз' : aiSummary ? 'Висновок отримано' : 'Не запускалась',
            icon: BrainCircuit,
            color: aiLoading ? 'text-cyan-400' : aiSummary ? 'text-emerald-400' : 'text-slate-400',
        },
    ];

    return (
        <div
            className={cn(
                'mx-auto min-h-screen max-w-[1600px] bg-slate-950 px-6 pb-32 lg:px-12',
                isConsoleMode && 'bg-black text-emerald-400 grayscale-[0.15]',
            )}
        >
            <div className="relative mb-20 pt-10">
                <ViewHeader
                    title={isConsoleMode ? '> РЕЖИМ_КОНСОЛІ_ПОШУКУ' : 'ПОШУК ПО РЕЄСТРАХ І ВІДКРИТИХ ДЖЕРЕЛАХ'}
                    icon={isConsoleMode ? <SearchCode className="text-emerald-400" /> : <Radar className="text-primary-500" />}
                    breadcrumbs={['ВІДКРИТІ_ДЖЕРЕЛА', 'ПОШУК', 'ПІДТВЕРДЖЕНІ_ДАНІ']}
                    stats={[
                        { label: 'Статус API', value: backendStatus.statusLabel, icon: <Database />, color: 'primary' },
                        { label: 'Режим даних', value: backendStatus.modeLabel, icon: <Radio />, color: 'cyan' },
                        {
                            label: 'Результатів',
                            value: hasSearched ? String(results.length) : '—',
                            icon: <Activity />,
                            color: 'success',
                        },
                    ]}
                />

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-10 flex flex-wrap items-center gap-4 rounded-3xl border border-white/5 bg-white/[0.02] px-8 py-5 shadow-2xl backdrop-blur-3xl"
                >
                    {statusCards.map((card) => (
                        <div
                            key={card.name}
                            className="flex items-center gap-3 rounded-2xl border border-white/5 bg-black/30 px-4 py-3"
                        >
                            <card.icon className={cn('h-4 w-4', card.color)} />
                            <div>
                                <div className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                                    {card.name}
                                </div>
                                <div className={cn('text-[11px] font-semibold', card.color)}>{card.value}</div>
                            </div>
                        </div>
                    ))}

                    <div className="ml-auto flex items-center gap-3 text-[10px] uppercase tracking-widest text-slate-500">
                        <Clock3 className="h-4 w-4" />
                        {lastRequestedAt
                            ? `Останній запит: ${formatDateTime(lastRequestedAt)}`
                            : 'Пошук ще не запускався'}
                    </div>
                </motion.div>
            </div>

            <div className="relative mb-24 mt-12">
                <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                    {!isConsoleMode && (
                        <div className="absolute left-1/2 top-1/2 h-[560px] w-[960px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-500/5 blur-[120px]" />
                    )}
                    <div className="absolute inset-0 bg-cyber-grid opacity-[0.03]" />
                </div>

                <div className="mx-auto max-w-5xl">
                    <div className="mb-4 flex items-center gap-3 px-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                        <Scan size={12} className="text-primary-400" />
                        Працює тільки з фактичними відповідями API без демонстраційних підстановок
                    </div>

                    <div className="mb-0 flex gap-1">
                        {SEARCH_MODES.map((mode) => (
                            <button
                                key={mode.id}
                                onClick={() => setSearchMode(mode.id)}
                                className={cn(
                                    'flex items-center gap-3 rounded-t-[1.5rem] border-x border-t px-6 py-3 text-[10px] font-black uppercase tracking-[0.3em] transition-all',
                                    searchMode === mode.id
                                        ? 'scale-105 border-white/10 bg-slate-900 text-white'
                                        : 'border-transparent bg-slate-950/40 text-slate-500 hover:bg-slate-900/60 hover:text-slate-300',
                                )}
                            >
                                <mode.icon size={14} className={cn(searchMode === mode.id && mode.color)} />
                                {mode.label}
                            </button>
                        ))}
                    </div>

                    <TacticalCard
                        title=""
                        variant="holographic"
                        noPadding
                        className={cn(
                            'relative overflow-hidden rounded-[2.5rem] rounded-tl-none border pr-4 shadow-[0_40px_100px_rgba(0,0,0,0.7)]',
                            isConsoleMode ? 'border-emerald-500/20' : 'border-white/10',
                        )}
                    >
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-40" />
                        <div className="relative flex flex-col gap-4 p-4 lg:flex-row lg:items-stretch">
                            <div className="flex items-center rounded-[2rem] border border-white/5 bg-black/20 lg:flex-1">
                                <div className="border-r border-white/5 px-6 py-6">
                                    {loading ? (
                                        <RefreshCw className="h-10 w-10 animate-spin text-primary-500" />
                                    ) : (
                                        <SearchIcon className="h-10 w-10 text-slate-500" />
                                    )}
                                </div>

                                <input
                                    type="text"
                                    autoFocus
                                    placeholder={
                                        isConsoleMode
                                            ? 'ВВЕДІТЬ_ЄДРПОУ_АБО_ЗАПИТ'
                                            : 'Введіть код ЄДРПОУ, назву компанії або опис ризикової схеми'
                                    }
                                    className={cn(
                                        'min-w-0 flex-1 bg-transparent px-6 py-7 text-xl font-black tracking-tight text-white outline-none placeholder:text-slate-600 lg:text-2xl',
                                        isConsoleMode &&
                                            'font-mono uppercase text-emerald-400 placeholder:text-emerald-900',
                                    )}
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>

                            <div className="flex gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => setIsConsoleMode((prev) => !prev)}
                                    title={isConsoleMode ? 'Вимкнути режим консолі' : 'Увімкнути режим консолі'}
                                    className={cn(
                                        'relative rounded-2xl border p-5 transition-all',
                                        isConsoleMode
                                            ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                                            : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white',
                                    )}
                                >
                                    <TerminalIcon size={22} />
                                    {isConsoleMode && (
                                        <div className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-emerald-400" />
                                    )}
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSearch}
                                    disabled={loading || backendStatus.isOffline}
                                    className={cn(
                                        'rounded-[1.8rem] px-10 py-6 text-sm font-black uppercase tracking-[0.35em] text-slate-950 shadow-2xl transition-all disabled:cursor-not-allowed disabled:opacity-50',
                                        isConsoleMode ? 'bg-emerald-400 hover:bg-emerald-300' : 'bg-primary-500 hover:bg-white',
                                    )}
                                >
                                    {loading ? 'Виконую пошук...' : 'Шукати'}
                                </motion.button>
                            </div>
                        </div>

                        <div className="border-t border-white/5 px-6 py-5">
                            <div className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                                {SEARCH_MODES.find((mode) => mode.id === searchMode)?.description}
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {QUICK_QUERIES.map((item) => (
                                    <button
                                        key={item}
                                        onClick={() => setQuery(item)}
                                        className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all hover:border-primary-500/40 hover:bg-primary-500/10 hover:text-white"
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </TacticalCard>
                </div>
            </div>

            <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-12">
                <AIAnswerCard
                    query={query}
                    answer={aiSummary}
                    loading={aiLoading}
                    sourceLabel={backendStatus.sourceLabel}
                    statusLabel={backendStatus.statusLabel}
                />

                {hasSearched && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-white/[0.02] px-6 py-5 shadow-xl backdrop-blur-md lg:flex-row lg:items-center lg:justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary-500/20 bg-primary-500/10">
                                <Activity size={18} className="text-primary-500" />
                            </div>
                            <div>
                                <div className="mb-1 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
                                    Підсумок видачі
                                </div>
                                <div className="text-lg font-black tracking-tight text-white">
                                    Знайдено: <span className="text-primary-400">{results.length}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                    Режим запиту
                                </div>
                                <div className="text-xs font-semibold text-white">
                                    {SEARCH_MODES.find((mode) => mode.id === searchMode)?.label}
                                </div>
                            </div>

                            {!isPremium && (
                                <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-amber-300">
                                    <Lock className="h-4 w-4" />
                                    Доступ до бенефіціарів обмежено
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 gap-10">
                    {results.map((company) => (
                        <CompanyCard
                            key={company.id}
                            company={company}
                            isPremium={isPremium}
                            isConsoleMode={isConsoleMode}
                            isExpanded={expandedExplainId === company.id}
                            onToggleExplain={toggleExplain}
                        />
                    ))}
                </div>

                {hasSearched && results.length === 0 && !loading && !aiLoading && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative rounded-[3rem] border-2 border-dashed border-white/5 bg-slate-900/20 py-28 text-center"
                    >
                        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/5 blur-[100px]" />
                        <div className="relative">
                            <SearchIcon className="mx-auto mb-6 h-20 w-20 text-slate-700" />
                            <h3 className="mb-4 text-3xl font-black uppercase tracking-tight text-slate-300">
                                {searchError || 'Збігів не знайдено'}
                            </h3>
                            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-500">
                                {searchError
                                    ? 'Спробуйте повторити запит пізніше або перевірте доступність джерела даних.'
                                    : 'Поточний бекенд не повернув результатів для цього запиту. Спробуйте точний режим або уточніть ЄДРПОУ.'}
                            </p>

                            {searchMode !== 'exact' && (
                                <button
                                    onClick={() => setSearchMode('exact')}
                                    className="mt-8 rounded-3xl border border-white/10 bg-white/5 px-8 py-4 text-[11px] font-black uppercase tracking-[0.3em] text-slate-300 transition-all hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-white"
                                >
                                    Перемкнути на точний режим
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>

            {hasSearched && isPremium && results.length > 0 && !backendStatus.isOffline && (
                <div className="relative mt-32 border-t border-white/5 pt-20">
                    <div className="absolute left-10 top-0 h-px w-40 bg-gradient-to-r from-primary-500 to-transparent" />
                    <div className="mb-12 flex flex-col gap-4 lg:flex-row lg:items-center">
                        <div className="flex items-center gap-4">
                            <div className="rounded-2xl border border-primary-500/20 bg-primary-500/10 p-4">
                                <Radio className="text-primary-400" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tight text-white">
                                    Контекстні інсайти
                                </h2>
                                <p className="text-[10px] uppercase tracking-[0.4em] text-slate-500">
                                    Доступно після успішної видачі та активного бекенду
                                </p>
                            </div>
                        </div>

                        <div className="ml-auto rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-400">
                            Показуємо тільки секцію, яка може працювати з поточною видачею без моків.
                        </div>
                    </div>

                    <TacticalCard variant="cyber" className="gap-0 p-1">
                        <AIInsightsHub isWidgetMode={true} />
                    </TacticalCard>
                </div>
            )}

            <style>{`
                .bg-cyber-grid {
                    background-image:
                        linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
                    background-size: 40px 40px;
                }
            `}</style>
        </div>
    );
};

export default SearchView;
