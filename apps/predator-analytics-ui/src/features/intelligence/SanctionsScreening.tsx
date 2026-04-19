/**
 * 🛡️ САНКЦІЙНА МАТРИЦЯ | v57.3-WRAITH
 * PREDATOR Analytics — Sanctions Screening & Compliance
 *
 * Перевірка сутностей за міжнародними санкційними списками
 * (OFAC, EU, UN, UK, РНБО) та PEP-статусом.
 * Sovereign Power Design · Classified · Tier-1
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

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
    Target,
    Fingerprint,
    Boxes,
    FileText,
    ChevronRight,
    Activity,
    Cpu,
    type LucideIcon,
} from 'lucide-react';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { CyberOrb } from '@/components/CyberOrb';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { cn } from '@/utils/cn';
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
        bg: 'bg-rose-600/10',
        border: 'border-rose-600/40',
        text: 'text-rose-500',
        label: 'Критично',
    },
    medium: {
        bg: 'bg-rose-400/10',
        border: 'border-rose-400/30',
        text: 'text-rose-400',
        label: 'Попередження',
    },
    low: {
        bg: 'bg-slate-800/20',
        border: 'border-slate-800/30',
        text: 'text-slate-400',
        label: 'Помірно',
    },
    none: {
        bg: 'bg-emerald-600/10',
        border: 'border-emerald-600/30',
        text: 'text-emerald-500',
        label: 'Чисто',
    },
};

const statusConfig: Record<ScreenStatus, { label: string; icon: LucideIcon; cls: string; bg: string; glow: string }> = {
    clean: {
        label: 'Чисто',
        icon: ShieldCheck,
        cls: 'text-emerald-500',
        bg: 'bg-emerald-600/10 border-emerald-600/30',
        glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    },
    warning: {
        label: 'Увага',
        icon: AlertTriangle,
        cls: 'text-rose-400',
        bg: 'bg-rose-400/10 border-rose-400/30',
        glow: 'shadow-[0_0_20px_rgba(251,113,133,0.3)]',
    },
    blocked: {
        label: 'Заблоковано',
        icon: AlertOctagon,
        cls: 'text-rose-600',
        bg: 'bg-rose-600/10 border-rose-600/30',
        glow: 'shadow-[0_0_20px_rgba(225,29,72,0.3)]',
    },
};

const entityIconMap: Record<EntityType, LucideIcon> = {
    company: Building2,
    person: User,
    vessel: Radio,
};

const listConfigs: Record<string, { color: string; flag: string }> = {
    OFAC: { color: 'bg-rose-500/10 text-rose-500 border-rose-500/20', flag: '🇺🇸' },
    EU: { color: 'bg-white/5 text-slate-300 border-white/10', flag: '🇪🇺' },
    UN: { color: 'bg-white/5 text-slate-300 border-white/10', flag: '🌐' },
    UK: { color: 'bg-white/5 text-slate-300 border-white/10', flag: '🇬🇧' },
    'РНБО': { color: 'bg-rose-600/20 text-rose-500 border-rose-600/40', flag: '🇺🇦' },
    PEP: { color: 'bg-rose-600/10 text-rose-500 border-rose-600/20', flag: '👤' },
    PREDATOR: { color: 'bg-rose-500/10 text-rose-500 border-rose-500/40 font-black', flag: '🦅' },
};

const formatTimestamp = (value?: string | null): string => {
    if (!value) return 'Н/д';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Н/д';
    return parsed.toLocaleString('uk-UA', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

const getListConfig = (list: string): { color: string; flag: string } =>
    listConfigs[list] ?? { color: 'bg-white/10 text-slate-200 border-white/10', flag: '•' };

const RiskGauge: React.FC<{ score: number }> = ({ score }) => {
    const color = score >= 80 ? '#E11D48' : score >= 50 ? '#FB7185' : '#22c55e';
    const angle = (score / 100) * 180 - 90;

    return (
        <div className="relative h-20 w-40 overflow-hidden flex flex-col items-center">
            <svg viewBox="0 0 100 50" className="h-full w-full">
                <path d="M5,50 A45,45 0 0,1 95,50" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="12" strokeLinecap="round" />
                <path
                    d="M5,50 A45,45 0 0,1 95,50"
                    fill="none"
                    stroke={color}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(score / 100) * 141.3} 141.3`}
                    style={{ filter: `drop-shadow(0 0 10px ${color}66)` }}
                />
                <circle cx="50" cy="50" r="4" fill="white" />
            </svg>
            <div className="absolute bottom-1 w-full text-center text-[12px] font-black italic tracking-tighter" style={{ color }}>
                {score}%_RISK
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
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
            className={cn('rounded-[2rem] border-2 p-8 shadow-4xl relative overflow-hidden group/mcard', severity.bg, severity.border)}
        >
            <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-white/[0.02] to-transparent pointer-events-none" />
            <div className="flex items-start gap-6 relative z-10">
                <div className={cn('rounded-2xl p-4 border-2 bg-black shadow-2xl transition-transform group-hover/mcard:rotate-6', severity.border)}>
                    <AlertOctagon className={severity.text} size={28} />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="mb-4 flex flex-wrap items-center gap-4">
                        <span className={cn('rounded-xl border-2 px-4 py-1.5 text-[10px] font-black italic tracking-[0.2em] shadow-lg', primaryList.color)}>
                            {primaryList.flag} {match.list.toUpperCase()}
                        </span>
                        <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white opacity-80 font-serif">{match.program}</span>
                        <span className={cn('ml-auto rounded-xl px-4 py-2 text-[10px] font-black italic shadow-inner', severity.bg, severity.text)}>
                            {match.score}% MATCH_VEC
                        </span>
                    </div>

                    <p className="mb-3 text-2xl font-black uppercase tracking-tighter text-white font-serif italic truncate">{match.target}</p>
                    <p className="text-[13px] leading-relaxed text-slate-400 font-medium italic border-l-2 border-white/5 pl-6">{match.details}</p>

                    {relatedLists.length > 0 && (
                        <div className="mt-6 flex flex-wrap gap-3">
                            {relatedLists.map((list) => {
                                const config = getListConfig(list);
                                return (
                                    <span key={`${match.id}-${list}`} className={cn('rounded-xl border-2 px-4 py-1.5 text-[9px] font-black italic tracking-widest', config.color)}>
                                        {config.flag} {list.toUpperCase()}
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    {match.dateAdded && (
                        <div className="mt-6 flex items-center gap-3 text-[10px] font-mono font-black uppercase tracking-[0.3em] text-slate-800">
                             <History size={12} /> RECORD_FOUND: {match.dateAdded}
                        </div>
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
            whileHover={{ x: 10 }}
            onClick={onClick}
            className={cn(
                'relative w-full cursor-pointer overflow-hidden rounded-[2.5rem] border-2 p-6 text-left transition-all group shadow-xl',
                isSelected ? 'border-rose-500/40 bg-white/[0.04] shadow-4xl' : 'border-white/5 bg-black hover:border-white/10',
            )}
        >
            <div className="flex items-center gap-6">
                <div className={cn('rounded-[1.5rem] border-2 p-4 transition-transform group-hover:rotate-6 shadow-2xl', status.bg)}>
                    <StatusIcon className={status.cls} size={24} />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-4">
                        <p className="truncate text-lg font-black uppercase tracking-tighter text-white font-serif italic">{result.entityName}</p>
                        <EntityIcon size={14} className="shrink-0 text-slate-800" />
                    </div>
                    <p className="mt-1.5 text-[10px] font-mono font-black text-slate-800 uppercase tracking-widest leading-none">
                        {formatTimestamp(result.timestamp)} // ID_{result.searchId.slice(0,8)}
                    </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <span className={cn('text-[10px] font-black uppercase tracking-[0.3em] italic', status.cls)}>{status.label.toUpperCase()}</span>
                    <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest">
                        {result.matches.length > 0 ? `${result.matches.length}_HITS` : 'CLEAR_VEC'}
                    </span>
                </div>
            </div>
        </motion.button>
    );
};

const EmptyPanel = ({ title, description }: { title: string; description: string }) => (
    <div className="flex min-h-[500px] flex-col items-center justify-center rounded-[4rem] border-4 border-dashed border-white/5 bg-black/40 px-12 text-center shadow-inner group">
        <div className="p-12 bg-black border-2 border-white/5 rounded-[3rem] shadow-4xl mb-10 group-hover:scale-110 transition-transform duration-[10s]">
            <AlertCircle size={64} className="text-slate-800 animate-pulse" />
        </div>
        <h3 className="text-3xl font-black uppercase tracking-tighter text-white font-serif italic">{title}</h3>
        <p className="mt-6 max-w-lg text-sm leading-7 text-slate-600 font-black uppercase tracking-[0.4em] italic opacity-80">{description}</p>
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

    React.useEffect(() => {
        if (backendStatus.isOffline) {
            window.dispatchEvent(new CustomEvent('predator-error', {
                detail: {
                    service: 'SanctionsHub',
                    message: `РЕЖИМ АВТОНОМНОГО СКРИНІНГУ [${backendStatus.nodeSource}]: Доступ до глобальних списків обмежено. Використовується MIRROR_VAULT.`,
                    severity: 'warning',
                    timestamp: new Date().toISOString(),
                    code: 'COMPLIANCE_OFFLINE'
                }
            }));
        }

        window.dispatchEvent(new CustomEvent('predator-error', {
            detail: {
                service: 'SanctionsHub',
                message: `САНКЦІЙНИЙ_ВУЗОЛ [${backendStatus.nodeSource}]: Сейф-матрицю успішно активовано. Готовність до скринінгу сутностей.`,
                severity: 'info',
                timestamp: new Date().toISOString(),
                code: 'COMPLIANCE_SUCCESS'
            }
        }));
    }, [backendStatus.isOffline, backendStatus.nodeSource]);

    const handleSearch = useCallback(async () => {
        const query = searchQuery.trim();
        if (!query) return;

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
                setFeedback('`/sanctions/screen` не повернув підтверджену структуру результату.');
                return;
            }

            setHistory((current) => [normalized, ...current.filter((item) => item.id !== normalized.id)].slice(0, 20));
            setSelected(normalized);
            setLastConfirmedAt(normalized.timestamp);

            window.dispatchEvent(new CustomEvent('predator-error', {
                detail: {
                    service: 'SanctionsHub',
                    message: `ВЕРДИКТ_СКРИНІНГУ [${backendStatus.nodeSource}]: Сутність ${query} перевірена. Результат: ${normalized.status.toUpperCase()}.`,
                    severity: normalized.status === 'blocked' ? 'warning' : 'info',
                    timestamp: new Date().toISOString(),
                    code: 'COMPLIANCE_SCAN_SUCCESS'
                }
            }));
        } catch (error) {
            console.error('Sanctions screening error:', error);
            setFeedback('Помилка підключення до бекенду.');
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
            <div className="relative min-h-screen overflow-hidden px-4 pb-32 sm:px-6 lg:px-12 bg-[#020202]">
                <AdvancedBackground />
                <CyberGrid color="rgba(225, 29, 72, 0.04)" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(225,29,72,0.05),transparent_70%)] pointer-events-none" />

                <div className="relative mb-16">
                    <ViewHeader
                        title={
                            <div className="flex items-center gap-10">
                                <div className="relative group">
                                     <div className="absolute inset-0 bg-rose-600/20 blur-3xl rounded-full scale-150 animate-pulse" />
                                     <div className="relative p-7 bg-black border-2 border-rose-500/40 rounded-[2.5rem] shadow-4xl transform rotate-2 hover:rotate-0 transition-all">
                                         <ShieldAlert hideDefaultIcon size={42} className="text-rose-500 shadow-[0_0_20px_#e11d48]" />
                                     </div>
                                </div>
                                <div className="space-y-4">
                                     <div className="flex items-center gap-4">
                                        <span className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-4 py-1 text-[10px] font-black tracking-[0.4em] uppercase italic rounded-lg">
                                            САНКЦІЙНИЙ_ХАБ // MATRIX_ARRAY
                                        </span>
                                        <div className="h-px w-12 bg-rose-500/20" />
                                        <span className="text-[10px] font-black text-rose-800 font-mono tracking-widest uppercase italic shadow-sm">v57.3-WRAITH</span>
                                     </div>
                                     <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-3deg] leading-none font-serif">
                                        САНКЦІЙНА <span className="text-rose-600 underline decoration-rose-600/30 decoration-[14px] underline-offset-[12px] italic uppercase tracking-tighter">МАТРИЦЯ</span>
                                     </h1>
                                </div>
                            </div>
                        }
                        breadcrumbs={['OSINT-HUB', 'САНКЦІЇ', 'GLOBAL_SCREENING_v57.2']}
                        badges={[
                            { label: 'SOVEREIGN_WRAITH_FORCE', color: 'amber', icon: <Zap size={10} /> },
                            { label: 'SENTINEL_SHIELD_ACTIVE', color: 'success', icon: <ShieldCheck size={10} /> },
                        ]}
                        stats={[
                            { label: 'ПІДТВЕРДЖЕНІ_ПЕРЕВІРКИ', value: String(history.length), icon: <Database />, color: 'primary' },
                            { 
                                label: backendStatus.isOffline ? 'MIRROR_RECOVERY' : 'ВУЗОЛ_SOURCE', 
                                value: backendStatus.isOffline ? `${Math.floor(backendStatus.healingProgress)}%` : (backendStatus.activeFailover ? 'NVIDIA_ZROK' : 'NVIDIA_PROD'), 
                                icon: backendStatus.isOffline ? <Activity /> : <Cpu />, 
                                color: backendStatus.isOffline ? 'warning' : 'gold',
                                animate: backendStatus.isOffline
                            },
                            { label: 'SYSTEM_STABILITY', value: backendStatus.isOffline ? 'MIRROR_VAULT' : 'STABLE', color: backendStatus.isOffline ? 'warning' : 'success', icon: <ShieldCheck size={14} /> }
                        ]}
                    />

                    <div className="mt-12 flex flex-wrap items-center gap-4 px-4 py-3 bg-black border-2 border-white/5 rounded-[2rem] shadow-2xl backdrop-blur-3xl italic">
                        {[
                            { l: 'ДЖЕРЕЛО_ДАНИХ', v: '/sanctions/screen', c: 'text-rose-600' },
                            { l: 'ВУЗОЛ_БЕКЕНДУ', v: backendStatus.sourceLabel.toUpperCase(), c: 'text-white' },
                            { l: 'СТАТУС', v: backendStatus.statusLabel.toUpperCase(), c: 'text-emerald-500' },
                            { l: 'ОСТАННЯ_СИНХРОНІЗАЦІЯ', v: formatTimestamp(lastConfirmedAt), c: 'text-slate-600' }
                        ].map((m, i) => (
                            <div key={i} className="flex items-center gap-4 px-6 border-r border-white/5 last:border-0 h-10">
                                <span className="text-[9px] font-black text-slate-800 tracking-[0.3em] uppercase">{m.l}:</span>
                                <span className={cn("text-[10px] font-mono font-black shadow-sm", m.c)}>{m.v}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 px-6 border-l-4 border-yellow-600/30 ml-2">
                        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-700 italic leading-none">
                            {feedback ?? 'СЕСІЙНИЙ ЖУРНАЛ ПОПОВНЮЄТЬСЯ ТІЛЬКИ ПІДТВЕРДЖЕНИМИ ВІДПОВІДЯМИ `/SANCTIONS/SCREEN`.'}
                        </p>
                    </div>
                </div>

                <div className="mb-16 grid grid-cols-2 gap-8 md:grid-cols-4">
                    {[
                        { label: 'Заблоковано', value: summary.blocked, icon: AlertOctagon, cls: 'text-rose-600', bg: 'from-rose-600/20', border: 'border-rose-600/30', glow: 'shadow-rose-900/40' },
                        { label: 'Попереджень', value: summary.warning, icon: AlertTriangle, cls: 'text-rose-400', bg: 'from-rose-400/20', border: 'border-rose-400/30', glow: 'shadow-rose-900/40' },
                        { label: 'Чистих', value: summary.clean, icon: ShieldCheck, cls: 'text-emerald-500', bg: 'from-emerald-600/20', border: 'border-emerald-600/30', glow: 'shadow-emerald-900/40' },
                        { label: 'PEP виявлено', value: summary.pep, icon: Crown, cls: 'text-rose-500', bg: 'from-rose-500/10', border: 'border-rose-500/20', glow: 'shadow-rose-900/20' },
                    ].map((item, index) => (
                        <motion.div key={item.label} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                            <TacticalCard variant="cyber" className={cn('relative overflow-hidden border-2 p-10 shadow-4xl rounded-[3rem]', item.border, item.glow)}>
                                <div className={cn('absolute inset-0 bg-gradient-to-br to-transparent opacity-40', item.bg)} />
                                <div className="relative z-10 flex items-center justify-between">
                                    <div>
                                        <div className={cn('text-5xl font-black font-mono tracking-tighter leading-none shadow-xl', item.cls)}>{item.value}</div>
                                        <div className="mt-3 text-[10px] font-black uppercase tracking-[0.5em] text-slate-800 italic">{item.label}</div>
                                    </div>
                                    <item.icon className={cn(item.cls, 'opacity-40 shadow-2xl')} size={48} />
                                </div>
                            </TacticalCard>
                        </motion.div>
                    ))}
                </div>

                {/* SEARCH SECTION WRAITH */}
                <TacticalCard variant="holographic" className="relative mb-16 overflow-hidden p-16 rounded-[4rem] bg-black border-2 border-white/[0.04] shadow-4xl group/search">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(225,29,72,0.03),transparent_70%)] pointer-events-none" />
                    <CyberOrb color="rose" size="lg" intensity="low" className="right-0 top-0 opacity-[0.05]" />

                    <div className="relative z-10">
                        <div className="mb-12 flex items-center gap-10">
                            <div className="p-6 bg-rose-600/10 border-2 border-rose-600/20 rounded-[2rem] text-rose-500 shadow-2xl transform group-hover/search:scale-110 transition-transform">
                                <ScanLine size={32} />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-3xl font-black uppercase tracking-[0.6em] text-white font-serif italic leading-none">ПІДТВЕРДЖЕНИЙ СКРИНІНГ СУТНОСТІ</h2>
                                <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.4em] italic border-l-2 border-amber-900/40 pl-6">SOVEREIGN_VETTING_PROTOCOL // DEEP_SCAN_ACTIVE</p>
                            </div>
                        </div>

                        <div className="mb-10 flex flex-wrap gap-4">
                            {(['company', 'person', 'vessel'] as EntityType[]).map((type) => {
                                const Icon = entityIconMap[type];
                                const label = type === 'company' ? 'ORGANIZATION' : type === 'person' ? 'SUBJECT_X' : 'VESSEL_ID';
                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setEntityType(type)}
                                        className={cn(
                                            'flex items-center gap-5 rounded-[2rem] border-2 px-8 py-4 text-[11px] font-black uppercase tracking-[0.3em] transition-all italic font-serif shadow-xl',
                                            entityType === type
                                                ? 'border-rose-500/40 bg-rose-500/10 text-rose-500 shadow-4xl scale-105'
                                                : 'border-white/5 bg-black text-slate-700 hover:border-white/20 hover:text-white',
                                        )}
                                    >
                                        <Icon size={18} /> {label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mb-10 flex gap-6">
                            <div className="group/input relative flex-1">
                                <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-800 transition-colors group-hover/input:text-rose-500 group-focus-within/input:text-rose-500" size={32} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    onKeyDown={(event) => { if (event.key === 'Enter') void handleSearch(); }}
                                    placeholder="Введіть назву компанії, ім'я особи або назву судна..."
                                    className="w-full rounded-[3rem] border-2 border-white/5 bg-black py-8 pl-24 pr-10 text-xl font-black italic tracking-tight text-white placeholder-slate-800 transition-all focus:border-rose-500/40 focus:ring-8 focus:ring-rose-500/5 focus:outline-none shadow-inner"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => void handleSearch()}
                                disabled={isSearching || searchQuery.trim().length < 2}
                                className="flex shrink-0 items-center gap-6 rounded-[3rem] bg-rose-600 px-16 py-6 text-[13px] font-black uppercase tracking-[0.5em] text-white shadow-4xl shadow-rose-900/40 transition-all hover:brightness-110 disabled:opacity-30 italic font-bold border-4 border-rose-500/20"
                            >
                                {isSearching ? <RefreshCw className="animate-spin" size={24} /> : <Target size={24} />}
                                {isSearching ? 'СКАН_АКТИВНИЙ' : 'ЗАПУСТИТИ_СКРИНІНГ'}
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 py-8 border-t border-white/[0.04]">
                            <span className="text-[11px] font-black uppercase tracking-[0.6em] text-slate-900 italic font-serif mr-4">ACTIVE_REGISTRIES:</span>
                            {SELECTABLE_LISTS.map((list) => {
                                const config = getListConfig(list);
                                const active = selectedLists.includes(list);
                                return (
                                    <button
                                        key={list}
                                        type="button"
                                        onClick={() => toggleList(list)}
                                        className={cn(
                                            'rounded-[1.5rem] border-2 px-6 py-2.5 text-[10px] font-black transition-all italic tracking-widest uppercase shadow-xl',
                                            active ? `${config.color} border-rose-500/40 shadow-rose-900/20 scale-105` : 'border-white/5 bg-black text-slate-800 hover:border-white/15',
                                        )}
                                    >
                                        {config.flag} {list}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </TacticalCard>

                <div className="grid grid-cols-1 gap-12 lg:grid-cols-5 h-full min-h-[800px]">
                    {/* LEFT: SESSION LOG WRAITH */}
                    <div className="space-y-6 lg:col-span-2 flex flex-col">
                        <div className="mb-6 flex items-center gap-6 px-10 py-5 bg-black/40 border-l-4 border-rose-500 rounded-r-3xl">
                            <History className="text-rose-600" size={22} />
                            <h3 className="text-xl font-black uppercase tracking-[0.4em] text-white font-serif italic">СЕСІЙНИЙ ЖУРНАЛ</h3>
                            <span className="ml-auto px-4 py-1 bg-black border border-white/10 rounded-lg text-[10px] font-black text-slate-800 tracking-widest">{history.length}_БЛОКІВ</span>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-6">
                            {history.length === 0 ? (
                                <TacticalCard variant="cyber" className="rounded-[4rem] border-2 border-white/5 p-12 bg-black/40 shadow-inner">
                                    <div className="flex min-h-[300px] flex-col items-center justify-center text-center opacity-20">
                                        <History size={80} className="mb-10 text-slate-800 animate-pulse" />
                                        <h4 className="text-2xl font-black uppercase tracking-tighter text-white font-serif italic">EMPTY_SESSION_LEDGER</h4>
                                        <p className="mt-6 max-w-sm text-[11px] leading-relaxed text-slate-700 uppercase tracking-[0.4em] italic font-black">
                                            AWAITING_CONFIRMED_API_CALLBACK_FOR_DECRYPTION
                                        </p>
                                    </div>
                                </TacticalCard>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {history.map((result, index) => (
                                        <motion.div
                                            key={result.id}
                                            initial={{ opacity: 0, x: -30 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
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
                    </div>

                    {/* RIGHT: DETAILED ANALYSIS WRAITH */}
                    <div className="lg:col-span-3 flex flex-col">
                        <AnimatePresence mode="wait">
                            {selected ? (
                                <motion.div key={selected.id} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="h-full">
                                    <TacticalCard variant="holographic" className="relative overflow-hidden p-16 rounded-[4rem] bg-black border-2 border-white/[0.04] shadow-4xl h-full flex flex-col">
                                        <CyberOrb
                                            color={selected.status === 'blocked' ? 'rose' : selected.status === 'warning' ? 'rose' : 'emerald'}
                                            size="xl" intensity="low"
                                            className="bottom-0 right-0 opacity-[0.05]"
                                        />

                                        <div className="relative z-10 flex flex-col h-full">
                                            <div className="mb-12 flex items-start justify-between gap-10">
                                                <div className="flex items-center gap-8">
                                                    <div className={cn('rounded-[2.5rem] border-4 p-8 bg-black shadow-4xl transform -rotate-3 transition-transform hover:rotate-0', statusConfig[selected.status].bg, statusConfig[selected.status].glow)}>
                                                        {React.createElement(statusConfig[selected.status].icon, {
                                                            size: 64,
                                                            className: statusConfig[selected.status].cls,
                                                        })}
                                                    </div>

                                                    <div className="space-y-4">
                                                        <h2 className="text-5xl font-black uppercase tracking-tighter text-white font-serif italic leading-none truncate max-w-[400px]">
                                                            {selected.entityName}
                                                        </h2>
                                                        <div className="flex flex-wrap items-center gap-4">
                                                            <span className={cn('rounded-xl border-2 px-6 py-2 text-[11px] font-black uppercase italic tracking-[0.4em] font-serif shadow-lg', statusConfig[selected.status].bg, statusConfig[selected.status].cls)}>
                                                                {statusConfig[selected.status].label.toUpperCase()}
                                                            </span>
                                                            <div className="h-px w-8 bg-white/10" />
                                                            <span className="text-[11px] font-mono font-black text-slate-800 uppercase tracking-widest italic leading-none">
                                                                MASTER_ID: {selected.searchId.toUpperCase()} // T: {formatTimestamp(selected.timestamp)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {selected.riskScore !== undefined && (
                                                    <div className="shrink-0 flex flex-col items-center gap-4">
                                                        <div className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-800 italic font-serif underline decoration-rose-600/30 underline-offset-8">ПОКАЗНИК_ВІДПОВІДНОСТІ</div>
                                                        <RiskGauge score={selected.riskScore} />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-6 mb-12">
                                                {selected.matches.length > 0 ? (
                                                    <div className="space-y-8">
                                                        <div className="mb-8 flex items-center gap-6 pb-6 border-b-2 border-white/[0.04]">
                                                            <div className="p-4 bg-rose-600/10 border-2 border-rose-600/20 rounded-2xl text-rose-500 shadow-xl">
                                                                <AlertOctagon size={28} className="animate-pulse" />
                                                            </div>
                                                            <h3 className="text-xl font-black uppercase tracking-[0.5em] text-white font-serif italic">
                                                                ВИЯВЛЕНІ ЗБІГИ: <span className="text-rose-600 underline decoration-rose-600/20 decoration-8">{selected.matches.length}</span>
                                                            </h3>
                                                        </div>
                                                        {selected.matches.map((match, index) => (
                                                            <MatchCard key={match.id} match={match} index={index} />
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center py-20 text-center relative overflow-hidden group/clear h-full">
                                                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] to-transparent pointer-events-none" />
                                                        <motion.div animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }} transition={{ duration: 10, repeat: Infinity }}>
                                                            <div className="p-16 bg-black border-4 border-emerald-500/10 rounded-[5rem] shadow-4xl mb-12 relative">
                                                                <ShieldCheck size={120} className="text-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.2)]" />
                                                                <div className="absolute -top-4 -right-4 bg-emerald-500 p-4 rounded-full text-black shadow-xl"><Zap size={24} /></div>
                                                            </div>
                                                        </motion.div>
                                                        <h3 className="text-4xl font-black uppercase tracking-tighter text-white font-serif italic mb-6">NULL_RISK_DETECTED</h3>
                                                        <p className="max-w-md text-[13px] text-slate-600 font-bold uppercase tracking-[0.4em] italic leading-relaxed border-t border-white/5 pt-8">
                                                            СУТНІСТЬ ВІДСУТНЯ В АКТИВНІЙ МАПІ ТЕРОРИЗМУ ТА САНКЦІЙ. СТАТУС — <span className="font-bold text-emerald-500 underline decoration-emerald-500/20 decoration-8">ЧИСТО</span>.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t-2 border-white/[0.04] pt-12">
                                                <div className="rounded-[2.5rem] border-2 border-white/[0.04] bg-black p-10 shadow-4xl group/lists relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-rose-500/[0.02] opacity-0 group-hover/lists:opacity-100 transition-opacity" />
                                                    <div className="text-[12px] font-black uppercase tracking-[0.5em] text-slate-800 italic font-serif flex items-center gap-4 mb-8 underline decoration-rose-600/20 underline-offset-8">
                                                        <Boxes size={18} className="text-rose-600" /> ПЕРЕВІРЕНІ РЕЄСТРИ
                                                    </div>
                                                    <div className="flex flex-wrap gap-4 relative z-10">
                                                        {(selected.listsChecked.length > 0 ? selected.listsChecked : selectedRegistrySet).map((list) => {
                                                            const config = getListConfig(list);
                                                            return (
                                                                <span key={`selected-${list}`} className={cn('rounded-xl border-2 px-6 py-2.5 text-[10px] font-black italic tracking-widest shadow-xl uppercase', config.color)}>
                                                                    {config.flag} {list}
                                                                </span>
                                                            );
                                                        })}
                                                        {selected.listsChecked.length === 0 && selectedRegistrySet.length === 0 && (
                                                            <span className="text-sm font-black text-slate-800 uppercase italic tracking-widest px-6 py-2 border-2 border-dashed border-white/5 rounded-xl">NULL_RECORDS</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="rounded-[2.5rem] border-2 border-rose-900/20 bg-black p-10 shadow-4xl group/lim relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-rose-600/[0.02] opacity-0 group-hover/lim:opacity-100 transition-opacity" />
                                                    <div className="text-[12px] font-black uppercase tracking-[0.5em] text-slate-900 italic font-serif flex items-center gap-4 mb-8 underline decoration-rose-600/20 underline-offset-8">
                                                        <FileText size={18} className="text-rose-600" /> ОБМЕЖЕННЯ_ДОСТУПУ
                                                    </div>
                                                    <p className="text-[13px] leading-relaxed text-slate-600 font-bold italic uppercase tracking-tight relative z-10 border-l-4 border-rose-900/30 pl-8">
                                                        Цей екран показує тільки підтверджені збіги та метадані `/sanctions/screen`. PDF, графове досьє та окремий моніторинг потребують доступу рівня <span className="text-rose-500">TITAN_WRAITH</span>.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </TacticalCard>
                                </motion.div>
                            ) : (
                                <EmptyPanel
                                    title="AWAITING_ENTITY_VETTING"
                                    description="ДЕТАЛІЗАЦІЯ САНКЦІЙНОГО ПРОФІЛЮ МОЖЛИВА ТІЛЬКИ ПІСЛЯ ПІДТВЕРДЖЕНОЇ ВІДПОВІДІ API_CORE. РЕЗУЛЬТАТИ ВІДОБРАЖАЮТЬСЯ В РЕАЛЬНОМУ ЧАСІ."
                                />
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar{width:6px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(225,29,72,.1);border-radius:20px;border:2px solid black}.custom-scrollbar::-webkit-scrollbar-thumb:hover{background:rgba(225,29,72,.2)}.shadow-4xl { box-shadow: 0 60px 120px -30px rgba(0,0,0,0.9), 0 0 60px rgba(225,29,72,0.03); }` }} />
        </PageTransition>
    );
};

export default SanctionsScreening;
