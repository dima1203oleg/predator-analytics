import React, { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    AlertOctagon,
    AlertTriangle,
    Building2,
    Crown,
    Database,
    History,
    Radio,
    RefreshCw,
    ScanLine,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    User,
    Zap,
    type LucideIcon,
} from 'lucide-react';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { CyberOrb } from '@/components/CyberOrb';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/api/config';
import {
    normalizeSanctionsScreeningPayload,
    type EntityType,
    type SanctionMatch,
    type SanctionSeverity,
    type ScreenStatus,
    type ScreeningResult,
} from './sanctionsScreening.utils';

type SelectableListType = 'OFAC' | 'EU' | 'UN' | 'UK' | 'РНБО' | 'PEP';

const SELECTABLE_LISTS: SelectableListType[] = ['OFAC', 'EU', 'UN', 'UK', 'РНБО', 'PEP'];

const severityConfig: Record<SanctionSeverity, { bg: string; border: string; text: string; label: string }> = {
    high: {
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/30',
        text: 'text-rose-400',
        label: 'Критично',
    },
    medium: {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        label: 'Попередження',
    },
    low: {
        bg: 'bg-sky-500/10',
        border: 'border-sky-500/30',
        text: 'text-sky-400',
        label: 'Помірно',
    },
    none: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        label: 'Чисто',
    },
};

const statusConfig: Record<ScreenStatus, { label: string; icon: LucideIcon; cls: string; bg: string; glow: string }> = {
    clean: {
        label: 'Чисто',
        icon: ShieldCheck,
        cls: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/30',
        glow: 'shadow-[0_0_20px_rgba(16,185,129,0.25)]',
    },
    warning: {
        label: 'Увага',
        icon: AlertTriangle,
        cls: 'text-amber-400',
        bg: 'bg-amber-500/10 border-amber-500/30',
        glow: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
    },
    blocked: {
        label: 'Заблоковано',
        icon: AlertOctagon,
        cls: 'text-rose-400',
        bg: 'bg-rose-500/10 border-rose-500/30',
        glow: 'shadow-[0_0_20px_rgba(244,63,94,0.25)]',
    },
};

const entityIconMap: Record<EntityType, LucideIcon> = {
    company: Building2,
    person: User,
    vessel: Radio,
};

const listConfigs: Record<string, { color: string; flag: string }> = {
    OFAC: { color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', flag: '🇺🇸' },
    EU: { color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', flag: '🇪🇺' },
    UN: { color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', flag: '🌐' },
    UK: { color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', flag: '🇬🇧' },
    'РНБО': { color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', flag: '🇺🇦' },
    PEP: { color: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30', flag: '👤' },
    PREDATOR: { color: 'bg-rose-500/20 text-rose-300 border-rose-500/30', flag: '🦅' },
};

const formatTimestamp = (value?: string | null): string => {
    if (!value) {
        return 'Н/д';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return 'Н/д';
    }

    return parsed.toLocaleString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const getListConfig = (list: string): { color: string; flag: string } =>
    listConfigs[list] ?? { color: 'bg-white/10 text-slate-200 border-white/10', flag: '•' };

const RiskGauge: React.FC<{ score: number }> = ({ score }) => {
    const color = score >= 80 ? '#f43f5e' : score >= 50 ? '#f59e0b' : '#10b981';
    const angle = (score / 100) * 180 - 90;

    return (
        <div className="relative h-14 w-28 overflow-hidden">
            <svg viewBox="0 0 100 50" className="h-full w-full">
                <path
                    d="M5,50 A45,45 0 0,1 95,50"
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="8"
                    strokeLinecap="round"
                />
                <path
                    d="M5,50 A45,45 0 0,1 95,50"
                    fill="none"
                    stroke={color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(score / 100) * 141.3} 141.3`}
                    style={{ filter: `drop-shadow(0 0 6px ${color})` }}
                />
                <g transform={`rotate(${angle}, 50, 50)`}>
                    <line x1="50" y1="50" x2="50" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="50" cy="50" r="3" fill="white" />
                </g>
            </svg>
            <div className="absolute bottom-0 w-full text-center text-[10px] font-black" style={{ color }}>
                {score}%
            </div>
        </div>
    );
};

const MatchCard: React.FC<{ match: SanctionMatch; index: number }> = ({ match, index }) => {
    const severity = severityConfig[match.severity];
    const primaryList = getListConfig(match.list);
    const relatedLists = [...new Set(match.allLists.filter((item) => item !== match.list))];

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06 }}
            className={cn('rounded-2xl border p-5', severity.bg, severity.border)}
        >
            <div className="flex items-start gap-4">
                <div className={cn('rounded-xl p-2', severity.bg)}>
                    <AlertOctagon className={severity.text} size={20} />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={cn('rounded-lg border px-2 py-0.5 text-[10px] font-black', primaryList.color)}>
                            {primaryList.flag} {match.list}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">{match.program}</span>
                        <span className={cn('ml-auto rounded-lg px-2 py-0.5 text-[10px] font-black', severity.bg, severity.text)}>
                            {match.score}% ЗБІГ
                        </span>
                    </div>

                    <p className="mb-1 text-sm font-black uppercase tracking-tight text-white">{match.target}</p>
                    <p className="text-[11px] leading-relaxed text-slate-400">{match.details}</p>

                    {relatedLists.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {relatedLists.map((list) => {
                                const config = getListConfig(list);
                                return (
                                    <span key={`${match.id}-${list}`} className={cn('rounded-lg border px-2 py-0.5 text-[9px] font-black', config.color)}>
                                        {config.flag} {list}
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    {match.dateAdded && (
                        <p className="mt-2 text-[9px] font-mono uppercase text-slate-600">ДОДАНО: {match.dateAdded}</p>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const HistoryRow: React.FC<{ result: ScreeningResult; isSelected: boolean; onClick: () => void }> = ({ result, isSelected, onClick }) => {
    const status = statusConfig[result.status];
    const StatusIcon = status.icon;
    const EntityIcon = entityIconMap[result.entityType];

    return (
        <motion.button
            type="button"
            whileHover={{ x: 4 }}
            onClick={onClick}
            className={cn(
                'relative w-full cursor-pointer overflow-hidden rounded-2xl border p-4 text-left transition-all group',
                isSelected ? 'border-white/20 bg-slate-800/60' : 'border-white/5 bg-slate-950/40 hover:border-white/15',
            )}
        >
            {isSelected && <div className="absolute bottom-0 left-0 top-0 w-0.5 rounded-l-full bg-primary-500" />}

            <div className="flex items-center gap-3">
                <div className={cn('rounded-xl border p-2', status.bg)}>
                    <StatusIcon className={status.cls} size={16} />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-black uppercase tracking-tight text-white">{result.entityName}</p>
                        <EntityIcon size={10} className="shrink-0 text-slate-600" />
                    </div>
                    <p className="mt-0.5 text-[9px] font-mono text-slate-600">
                        {formatTimestamp(result.timestamp)} • ID: {result.searchId}
                    </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <span className={cn('text-[9px] font-black uppercase', status.cls)}>{status.label}</span>
                    <span className="text-[8px] font-mono text-slate-600">
                        {result.matches.length > 0 ? `${result.matches.length} ЗБІГІВ` : 'БЕЗ ЗБІГІВ'}
                    </span>
                </div>
            </div>
        </motion.button>
    );
};

const EmptyPanel = ({ title, description }: { title: string; description: string }) => (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-slate-950/35 px-8 text-center">
        <AlertCircle size={44} className="mb-4 text-slate-600" />
        <h3 className="text-lg font-black uppercase tracking-tight text-white">{title}</h3>
        <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">{description}</p>
    </div>
);

const SanctionsScreening: React.FC = () => {
    const backendStatus = useBackendStatus();
    const [history, setHistory] = useState<ScreeningResult[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [selected, setSelected] = useState<ScreeningResult | null>(null);
    const [entityType, setEntityType] = useState<EntityType>('company');
    const [selectedLists, setSelectedLists] = useState<SelectableListType[]>(SELECTABLE_LISTS);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [lastConfirmedAt, setLastConfirmedAt] = useState<string | null>(null);

    const handleSearch = useCallback(async () => {
        const query = searchQuery.trim();
        if (!query) {
            return;
        }

        setIsSearching(true);
        setFeedback(null);

        try {
            const response = await apiClient.post('/sanctions/screen', {
                query,
                entity_type: entityType,
                lists: selectedLists,
            });

            const normalized = normalizeSanctionsScreeningPayload(response.data, entityType);

            if (!normalized) {
                setFeedback('`/sanctions/screen` не повернув підтверджену структуру результату. Локальні збіги не підставляються.');
                return;
            }

            setHistory((current) => [normalized, ...current.filter((item) => item.id !== normalized.id)].slice(0, 20));
            setSelected(normalized);
            setLastConfirmedAt(normalized.timestamp);
        } catch (error) {
            console.error('Sanctions screening error:', error);
            setFeedback('Не вдалося виконати підтверджений скринінг через `/sanctions/screen`. Демонстраційна історія не використовується.');
        } finally {
            setIsSearching(false);
        }
    }, [entityType, searchQuery, selectedLists]);

    const toggleList = (list: SelectableListType) => {
        setFeedback(null);
        setSelectedLists((current) => {
            if (current.includes(list)) {
                return current.length === 1 ? current : current.filter((item) => item !== list);
            }

            return [...current, list];
        });
    };

    const summary = useMemo(() => {
        const blocked = history.filter((item) => item.status === 'blocked').length;
        const warning = history.filter((item) => item.status === 'warning').length;
        const clean = history.filter((item) => item.status === 'clean').length;
        const pep = history.filter((item) =>
            item.matches.some((match) => match.list === 'PEP' || match.allLists.includes('PEP')),
        ).length;

        return { blocked, warning, clean, pep };
    }, [history]);

    const selectedRegistrySet = useMemo(
        () =>
            [...new Set(
                (selected?.matches ?? []).flatMap((match) => [match.list, ...match.allLists]).filter(Boolean),
            )],
        [selected],
    );

    return (
        <PageTransition>
            <div className="relative min-h-screen overflow-hidden px-4 pb-20 sm:px-6 lg:px-10">
                <AdvancedBackground />
                <CyberGrid opacity={0.015} />
                <CyberOrb color="rose" size="xl" intensity="low" className="right-0 top-1/4 opacity-10" />
                <CyberOrb color="purple" size="lg" intensity="low" className="bottom-1/3 left-0 opacity-10" />

                <div className="relative mb-10">
                    <ViewHeader
                        title="САНКЦІЙНА МАТРИЦЯ"
                        icon={<ShieldAlert className="text-rose-400" />}
                        breadcrumbs={['OSINT-HUB', 'САНКЦІЇ', 'МАТРИЦЯ v56.1.4']}
                        badges={[
                            { label: 'OSINT_HUB_v56.1.4_CERTIFIED', color: 'rose', icon: <Zap size={10} /> },
                            { label: 'CONSTITUTIONAL_SHIELD_ACTIVE', color: 'success', icon: <ShieldCheck size={10} /> },
                        ]}
                        stats={[
                            { label: 'Підтверджені перевірки', value: String(history.length), icon: <Database />, color: 'primary' },
                            { label: 'Активні реєстри', value: String(selectedLists.length), icon: <Shield />, color: 'danger' },
                            {
                                label: 'Останній ризик',
                                value: selected?.riskScore != null ? `${selected.riskScore}%` : 'Н/д',
                                icon: <Zap />,
                                color: selected?.status === 'blocked' ? 'danger' : 'success',
                            },
                        ]}
                    />

                    <div className="mt-4 flex flex-wrap items-center gap-3 px-2">
                        <div className="rounded-full border border-slate-800 bg-slate-950/60 px-4 py-2">
                            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400">
                                Джерело: /sanctions/screen
                            </span>
                        </div>
                        <div className="rounded-full border border-slate-800 bg-slate-950/60 px-4 py-2">
                            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400">
                                Джерело бекенду: {backendStatus.sourceLabel}
                            </span>
                        </div>
                        <div className="rounded-full border border-slate-800 bg-slate-950/60 px-4 py-2">
                            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400">
                                {backendStatus.statusLabel}
                            </span>
                        </div>
                        <div className="rounded-full border border-slate-800 bg-slate-950/60 px-4 py-2">
                            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400">
                                Останнє підтвердження: {formatTimestamp(lastConfirmedAt)}
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 px-2">
                        <p className="text-xs leading-6 text-slate-400">
                            {feedback ?? 'Сесійний журнал поповнюється тільки підтвердженими відповідями `/sanctions/screen`. Без відповіді API локальна історія не домальовується.'}
                        </p>
                    </div>
                </div>

                <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
                    {[
                        { label: 'Заблоковано', value: summary.blocked, icon: AlertOctagon, cls: 'text-rose-400', bg: 'from-rose-500/10', border: 'border-rose-500/20', glow: 'shadow-rose-500/10' },
                        { label: 'Попереджень', value: summary.warning, icon: AlertTriangle, cls: 'text-amber-400', bg: 'from-amber-500/10', border: 'border-amber-500/20', glow: 'shadow-amber-500/10' },
                        { label: 'Чистих', value: summary.clean, icon: ShieldCheck, cls: 'text-emerald-400', bg: 'from-emerald-500/10', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/10' },
                        { label: 'PEP виявлено', value: summary.pep, icon: Crown, cls: 'text-purple-400', bg: 'from-purple-500/10', border: 'border-purple-500/20', glow: 'shadow-purple-500/10' },
                    ].map((item, index) => (
                        <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
                            <TacticalCard variant="cyber" className={cn('relative overflow-hidden border p-6 shadow-xl', item.border, item.glow)}>
                                <div className={cn('absolute inset-0 bg-gradient-to-br to-transparent opacity-60', item.bg)} />
                                <div className="relative z-10 flex items-center justify-between">
                                    <div>
                                        <div className={cn('text-3xl font-black font-mono', item.cls)}>{item.value}</div>
                                        <div className="mt-1 text-[8px] font-black uppercase tracking-[0.4em] text-slate-600">{item.label}</div>
                                    </div>
                                    <item.icon className={cn(item.cls, 'opacity-30')} size={36} />
                                </div>
                            </TacticalCard>
                        </motion.div>
                    ))}
                </div>

                <TacticalCard variant="holographic" className="relative mb-10 overflow-hidden p-8">
                    <CyberOrb color="rose" size="md" intensity="low" className="right-0 top-0 opacity-15" />

                    <div className="relative z-10">
                        <div className="mb-6 flex items-center gap-3">
                            <ScanLine className="text-rose-400" size={20} />
                            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white">ПІДТВЕРДЖЕНИЙ СКРИНІНГ СУТНОСТІ</h2>
                        </div>

                        <div className="mb-5 flex gap-2">
                            {(['company', 'person', 'vessel'] as EntityType[]).map((type) => {
                                const Icon = entityIconMap[type];
                                const label = type === 'company' ? 'КОМПАНІЯ' : type === 'person' ? 'ОСОБА' : 'СУДНО';

                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setEntityType(type)}
                                        className={cn(
                                            'flex items-center gap-2 rounded-xl border px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all',
                                            entityType === type
                                                ? 'border-rose-500/40 bg-rose-500/20 text-rose-400'
                                                : 'border-white/5 bg-slate-900/40 text-slate-500 hover:border-white/20',
                                        )}
                                    >
                                        <Icon size={13} /> {label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mb-5 flex gap-3">
                            <div className="group relative flex-1">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-hover:text-rose-400" size={18} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            void handleSearch();
                                        }
                                    }}
                                    placeholder="Введіть назву компанії, ім'я особи або назву судна..."
                                    className="w-full rounded-[20px] border border-white/5 bg-slate-950/60 py-5 pl-14 pr-5 text-sm text-white placeholder-slate-600 transition-all focus:border-rose-500/40 focus:outline-none"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => void handleSearch()}
                                disabled={isSearching || searchQuery.trim().length < 2}
                                className="flex shrink-0 items-center gap-3 rounded-[20px] bg-rose-500 px-8 py-4 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-rose-500/20 transition-all hover:bg-rose-400 disabled:opacity-50"
                            >
                                {isSearching ? <RefreshCw className="animate-spin" size={18} /> : <Shield size={18} />}
                                {isSearching ? 'ПЕРЕВІРКА...' : 'ПЕРЕВІРИТИ'}
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-700">РЕЄСТРИ:</span>
                            {SELECTABLE_LISTS.map((list) => {
                                const config = getListConfig(list);
                                const active = selectedLists.includes(list);

                                return (
                                    <button
                                        key={list}
                                        type="button"
                                        onClick={() => toggleList(list)}
                                        className={cn(
                                            'rounded-xl border px-3 py-1.5 text-[9px] font-black transition-all',
                                            active ? config.color : 'border-white/5 bg-slate-900/40 text-slate-600 hover:border-white/20',
                                        )}
                                    >
                                        {config.flag} {list}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </TacticalCard>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                    <div className="space-y-3 lg:col-span-2">
                        <div className="mb-4 flex items-center gap-3">
                            <History className="text-slate-500" size={16} />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">СЕСІЙНИЙ ЖУРНАЛ</h3>
                            <span className="ml-auto text-[8px] font-mono text-slate-700">{history.length} ЗАПИСІВ</span>
                        </div>

                        {history.length === 0 ? (
                            <TacticalCard variant="cyber" className="rounded-[28px] border border-white/5 p-6">
                                <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
                                    <History size={40} className="mb-4 text-slate-700" />
                                    <h4 className="text-lg font-black uppercase tracking-tight text-white">Сесійний журнал поки порожній</h4>
                                    <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">
                                        Після першої підтвердженої відповіді `/sanctions/screen` тут зʼявляться реальні результати скринінгу.
                                    </p>
                                </div>
                            </TacticalCard>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {history.map((result, index) => (
                                    <motion.div
                                        key={result.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.04 }}
                                    >
                                        <HistoryRow
                                            result={result}
                                            isSelected={selected?.id === result.id}
                                            onClick={() => setSelected(result)}
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>

                    <div className="lg:col-span-3">
                        <AnimatePresence mode="wait">
                            {selected ? (
                                <motion.div key={selected.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                    <TacticalCard variant="holographic" className="relative overflow-hidden p-8">
                                        <CyberOrb
                                            color={selected.status === 'blocked' ? 'rose' : selected.status === 'warning' ? 'purple' : 'cyan'}
                                            size="lg"
                                            intensity="low"
                                            className="bottom-0 right-0 opacity-10"
                                        />

                                        <div className="relative z-10">
                                            <div className="mb-8 flex items-start justify-between gap-6">
                                                <div className="flex items-center gap-5">
                                                    <div className={cn('rounded-2xl border p-4', statusConfig[selected.status].bg, statusConfig[selected.status].glow)}>
                                                        {React.createElement(statusConfig[selected.status].icon, {
                                                            size: 32,
                                                            className: statusConfig[selected.status].cls,
                                                        })}
                                                    </div>

                                                    <div>
                                                        <h2 className="mb-2 text-2xl font-black uppercase tracking-tighter text-white">
                                                            {selected.entityName}
                                                        </h2>
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <span className={cn('rounded-xl border px-3 py-1 text-[9px] font-black uppercase', statusConfig[selected.status].bg, statusConfig[selected.status].cls)}>
                                                                {statusConfig[selected.status].label}
                                                            </span>
                                                            <span className="text-[9px] font-mono text-slate-600">
                                                                ID: {selected.searchId} • {formatTimestamp(selected.timestamp)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {selected.riskScore !== undefined && (
                                                    <div className="shrink-0 text-center">
                                                        <div className="mb-1 text-[8px] font-black uppercase tracking-[0.3em] text-slate-600">ІНДЕКС РИЗИКУ</div>
                                                        <RiskGauge score={selected.riskScore} />
                                                    </div>
                                                )}
                                            </div>

                                            {selected.matches.length > 0 ? (
                                                <div className="mb-8 space-y-3">
                                                    <div className="mb-4 flex items-center gap-3">
                                                        <AlertOctagon className="text-rose-500" size={16} />
                                                        <h3 className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
                                                            ВИЯВЛЕНО ЗБІГІВ: {selected.matches.length}
                                                        </h3>
                                                    </div>
                                                    {selected.matches.map((match, index) => (
                                                        <MatchCard key={match.id} match={match} index={index} />
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="mb-8 flex flex-col items-center py-14 text-center">
                                                    <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                                                        <ShieldCheck size={56} className="mb-5 text-emerald-500" />
                                                    </motion.div>
                                                    <h3 className="mb-2 text-xl font-black uppercase tracking-tight text-white">ЗБІГІВ НЕ ЗНАЙДЕНО</h3>
                                                    <p className="max-w-xs text-sm text-slate-500">
                                                        Сутність відсутня у вибраних санкційних реєстрах. Статус — <span className="font-bold text-emerald-400">ЧИСТО</span>.
                                                    </p>
                                                </div>
                                            )}

                                            <div className="grid gap-4 border-t border-white/5 pt-6 md:grid-cols-2">
                                                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                                                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">ПЕРЕВІРЕНІ РЕЄСТРИ</div>
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {(selected.listsChecked.length > 0 ? selected.listsChecked : selectedRegistrySet).map((list) => {
                                                            const config = getListConfig(list);
                                                            return (
                                                                <span key={`selected-${list}`} className={cn('rounded-xl border px-3 py-1 text-[9px] font-black', config.color)}>
                                                                    {config.flag} {list}
                                                                </span>
                                                            );
                                                        })}
                                                        {selected.listsChecked.length === 0 && selectedRegistrySet.length === 0 && (
                                                            <span className="text-sm text-slate-400">Н/д</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                                                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">МЕЖІ КОНТУРУ</div>
                                                    <p className="mt-3 text-sm leading-6 text-slate-400">
                                                        Цей екран показує тільки підтверджені збіги та метадані `/sanctions/screen`. PDF, графове досьє та окремий моніторинг не активуються без окремих маршрутів бекенду.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </TacticalCard>
                                </motion.div>
                            ) : (
                                <EmptyPanel
                                    title="Оберіть запис або виконайте перевірку"
                                    description="Деталізація санкційного профілю зʼявляється тільки після підтвердженої відповіді API. До цього екран не показує демо-збіги."
                                />
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default SanctionsScreening;
