import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import ReactECharts from '@/components/ECharts';
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    Building2,
    FileText,
    Globe,
    Loader2,
    Search,
    ShieldCheck,
    Users,
    ShieldAlert,
    Scale,
    Fingerprint,
    Gavel
} from 'lucide-react';
import { ConstitutionalShield } from '@/components/shared/ConstitutionalShield';
import { diligenceApi } from '@/features/diligence/api/diligence';
import type {
    RiskEntity,
    RiskLevelValue,
    CompanyProfileResponse
} from '@/features/diligence/types';
import type { ContextRailPayload, ContextTone } from '@/types/shell';
import { createMetric, createRisk, createStandardContextActions } from '@/components/layout/contextRail.builders';
import { useContextRail } from '@/hooks/useContextRail';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { cn } from '@/lib/utils';

type RiskFilter = 'all' | RiskLevelValue;

type RadarPoint = {
    label: string;
    value: number;
};

const riskLevelLabel: Record<RiskLevelValue, string> = {
    stable: 'Стабільний',
    watchlist: 'Під наглядом',
    elevated: 'Підвищений',
    high: 'Високий',
    critical: 'Критичний',
    low: 'Низький',
    medium: 'Середній',
};

const riskLevelTone: Record<RiskLevelValue, string> = {
    stable: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    low: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    watchlist: 'bg-sky-500/15 text-sky-200 border-sky-500/25',
    medium: 'bg-sky-500/15 text-sky-200 border-sky-500/25',
    elevated: 'bg-amber-500/15 text-amber-200 border-amber-500/25',
    high: 'bg-orange-500/15 text-orange-200 border-orange-500/25',
    critical: 'bg-rose-500/15 text-rose-200 border-rose-500/25',
};

const riskFilters: Array<{ value: RiskFilter; label: string }> = [
    { value: 'all', label: 'Усі рівні' },
    { value: 'critical', label: 'Критичний' },
    { value: 'high', label: 'Високий' },
    { value: 'elevated', label: 'Підвищений' },
    { value: 'medium', label: 'Середній' },
    { value: 'watchlist', label: 'Під наглядом' },
    { value: 'low', label: 'Низький' },
    { value: 'stable', label: 'Стабільний' },
];

const normalizeRiskLevel = (value?: string | null): RiskLevelValue => {
    switch (value) {
        case 'critical':
        case 'high':
        case 'elevated':
        case 'watchlist':
        case 'stable':
        case 'low':
        case 'medium':
            return value;
        case 'high_alert':
            return 'high';
        default:
            return 'stable';
    }
};

const normalizeRiskEntity = (entity: Record<string, unknown>): RiskEntity => ({
    ueid: typeof entity.ueid === 'string' ? entity.ueid : undefined,
    edrpou: String(entity.edrpou ?? entity.ueid ?? entity.id ?? 'Н/Д'),
    name: String(entity.name ?? 'Невідома компанія'),
    risk_score: Number(entity.risk_score ?? 0),
    risk_level: normalizeRiskLevel(typeof entity.risk_level === 'string' ? entity.risk_level : null),
    last_updated: typeof entity.last_updated === 'string' ? entity.last_updated : undefined,
    created_at: typeof entity.created_at === 'string' ? entity.created_at : undefined,
    updated_at: typeof entity.updated_at === 'string' ? entity.updated_at : undefined,
    status: typeof entity.status === 'string' ? entity.status : undefined,
    sector: typeof entity.sector === 'string' ? entity.sector : null,
    cers_confidence:
        typeof entity.cers_confidence === 'number' ? entity.cers_confidence : undefined,
});

const normalizeRiskEntities = (payload: unknown): RiskEntity[] => {
    if (Array.isArray(payload)) {
        return payload.map((entity) => normalizeRiskEntity(entity as Record<string, unknown>));
    }

    if (!payload || typeof payload !== 'object') {
        return [];
    }

    const record = payload as { data?: unknown; items?: unknown; results?: unknown };
    const source = Array.isArray(record.data)
        ? record.data
        : Array.isArray(record.items)
          ? record.items
          : Array.isArray(record.results)
            ? record.results
            : [];

    return source.map((entity) => normalizeRiskEntity(entity as Record<string, unknown>));
};

const formatDateLabel = (value?: string | null): string => {
    if (!value) {
        return 'Н/Д';
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleDateString('uk-UA');
};

const formatStatusLabel = (value?: string | null): string => {
    switch (value) {
        case 'active':
            return 'активний';
        case 'suspended':
            return 'призупинено';
        case 'liquidated':
            return 'ліквідовано';
        case 'sanctioned':
            return 'санкціоновано';
        default:
            return value || 'Н/Д';
    }
};

const clampScore = (value: number): number => Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));

const buildRadarPoints = (companyProfile: CompanyProfileResponse | null): RadarPoint[] => {
    if (!companyProfile) {
        return [
            { label: 'Інституційний', value: 0 },
            { label: 'Структурний', value: 0 },
            { label: 'Поведінковий', value: 0 },
            { label: 'Впливовий', value: 0 },
            { label: 'Предиктивний', value: 0 },
        ];
    }

    if (companyProfile.risk_details) {
        return [
            { label: 'Інституційний', value: clampScore(companyProfile.risk_details.institutional.value) },
            { label: 'Структурний', value: clampScore(companyProfile.risk_details.structural.value) },
            { label: 'Поведінковий', value: clampScore(companyProfile.risk_details.behavioral.value) },
            { label: 'Впливовий', value: clampScore(companyProfile.risk_details.influence.value) },
            { label: 'Предиктивний', value: clampScore(companyProfile.risk_details.predictive.value) },
        ];
    }

    const anomalies = companyProfile.anomalies?.length ?? 0;
    const sanctions = companyProfile.sanctions?.length ?? 0;
    const directors = companyProfile.directors?.length ?? 0;
    const beneficiaries = companyProfile.ultimate_beneficiaries?.length ?? 0;
    const score = clampScore(companyProfile.risk_score);

    return [
        { label: 'Інституційний', value: clampScore(score * 0.78) },
        { label: 'Структурний', value: clampScore(beneficiaries * 24 + 16) },
        { label: 'Поведінковий', value: clampScore(anomalies * 18 + 12) },
        { label: 'Впливовий', value: clampScore(sanctions * 32 + 8) },
        { label: 'Предиктивний', value: clampScore(directors * 12 + score * 0.46) },
    ];
};

export default function DiligencePage() {
    const backendStatus = useBackendStatus();
    const [riskEntities, setRiskEntities] = useState<RiskEntity[]>([]);
    const [selectedEntity, setSelectedEntity] = useState<RiskEntity | null>(null);
    const [companyProfile, setCompanyProfile] = useState<CompanyProfileResponse | null>(null);
    const [loadingSidebar, setLoadingSidebar] = useState(true);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoadingSidebar(true);
                const payload = await diligenceApi.getRiskEntities();
                const entities = normalizeRiskEntities(payload).sort(
                    (left, right) => right.risk_score - left.risk_score,
                );

                setRiskEntities(entities);

                if (entities.length > 0) {
                    await handleSelectEntity(entities[0]);
                }
            } catch (error) {
                console.error('Не вдалося отримати перелік контрагентів:', error);
            } finally {
                setLoadingSidebar(false);
            }
        };

        void fetchInitialData();
    }, []);

    const handleSelectEntity = async (entity: RiskEntity) => {
        setSelectedEntity(entity);

        try {
            setLoadingProfile(true);
            const profile = await diligenceApi.getCompanyProfile(entity.ueid ?? entity.edrpou);
            setCompanyProfile(profile);
        } catch (error) {
            console.error('Не вдалося отримати профіль компанії:', error);
            setCompanyProfile(null);
        } finally {
            setLoadingProfile(false);
        }
    };

    const filteredEntities = useMemo(() => {
        return riskEntities.filter((entity) => {
            const matchesSearch =
                entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                entity.edrpou.includes(searchQuery);

            const matchesRisk = riskFilter === 'all' || normalizeRiskLevel(entity.risk_level) === riskFilter;

            return matchesSearch && matchesRisk;
        });
    }, [riskEntities, riskFilter, searchQuery]);

    const sanctions = companyProfile?.sanctions ?? [];
    const anomalies = companyProfile?.anomalies ?? [];
    const directors = companyProfile?.directors ?? [];
    const beneficiaries = companyProfile?.ultimate_beneficiaries ?? [];
    const profileRiskLevel = normalizeRiskLevel(companyProfile?.risk_level ?? selectedEntity?.risk_level);
    const profileIdentifier = companyProfile?.ueid ?? companyProfile?.edrpou ?? selectedEntity?.ueid ?? selectedEntity?.edrpou;
    const radarPoints = useMemo(() => buildRadarPoints(companyProfile), [companyProfile]);
    const cersConfidence = companyProfile?.cers_confidence;
    const diligenceRailPayload = useMemo(() => {
        if (!selectedEntity && !companyProfile) {
            return null;
        }

        return {
            entityId: String(profileIdentifier ?? selectedEntity?.edrpou ?? 'diligence'),
            entityType: 'контрагент',
            title: companyProfile?.name ?? selectedEntity?.name ?? 'Контрагент',
            subtitle: `ЄДРПОУ ${profileIdentifier ?? 'Н/Д'} • ${riskLevelLabel[profileRiskLevel]}`,
            status: {
                label: `Ризик: ${riskLevelLabel[profileRiskLevel]}`,
                tone: (profileRiskLevel === 'critical' || profileRiskLevel === 'high'
                    ? 'danger'
                    : profileRiskLevel === 'elevated' || profileRiskLevel === 'watchlist'
                        ? 'warning'
                        : 'success') as ContextTone,
            },
            actions: createStandardContextActions({
                auditPath: '/diligence',
                documentsPath: '/documents',
                agentPath: '/agents',
            }),
            insights: [
                createMetric(
                    'risk-score',
                    'Ризик-скоринг',
                    `${Math.round(companyProfile?.risk_score ?? selectedEntity?.risk_score ?? 0)}`,
                    'Поточна оцінка ризику для контрагента',
                    'warning',
                ),
                createMetric(
                    'sanctions',
                    'Санкційні збіги',
                    `${sanctions.length}`,
                    'Підтверджені записи санкційного контуру',
                    sanctions.length > 0 ? 'danger' : 'success',
                ),
                createMetric(
                    'confidence',
                    'Впевненість CERS',
                    cersConfidence ? `${Math.round(cersConfidence * 100)}%` : 'Н/д',
                    'Рівень підтвердження профілю на основі наявних даних',
                    cersConfidence ? 'info' : 'neutral',
                ),
            ],
            relations: [
                createMetric('beneficiaries', 'Бенефіціари', `${beneficiaries.length}`, 'Виявлені кінцеві бенефіціари'),
                createMetric('directors', 'Керівники', `${directors.length}`, 'Ключові посадові особи та директори'),
                createMetric('anomalies', 'Аномалії', `${anomalies.length}`, 'Поведінкові та фінансові відхилення', anomalies.length > 0 ? 'warning' : 'neutral'),
            ],
            documents: [
                {
                    id: 'diligence-profile',
                    label: 'Профіль компанії',
                    detail: `Оновлено: ${formatDateLabel(companyProfile?.updated_at ?? selectedEntity?.updated_at)}`,
                    path: '/documents',
                },
                {
                    id: 'diligence-record',
                    label: 'Реєстровий контекст',
                    detail: `Статус: ${formatStatusLabel(companyProfile?.status ?? selectedEntity?.status)}`,
                    path: '/registries',
                },
            ],
            risks: [
                createRisk(
                    'risk-level',
                    `Поточний рівень: ${riskLevelLabel[profileRiskLevel]}`,
                    'Операційний ризик формується з санкцій, аномалій і структурних сигналів.',
                    profileRiskLevel === 'critical' || profileRiskLevel === 'high' ? 'danger' : 'warning',
                ),
                ...(sanctions.length > 0
                    ? [createRisk('sanctions-risk', 'Є санкційні збіги', 'Потрібна окрема перевірка санкційного контуру.', 'danger')]
                    : []),
                ...(anomalies.length > 0
                    ? [createRisk('anomalies-risk', 'Виявлені аномалії', 'Є поведінкові сигнали, які потребують аудиту.', 'warning')]
                    : []),
            ],
            sourcePath: '/diligence',
        };
    }, [
        anomalies.length,
        beneficiaries.length,
        cersConfidence,
        companyProfile,
        directors.length,
        profileIdentifier,
        profileRiskLevel,
        sanctions.length,
        selectedEntity,
    ]);

    useContextRail(diligenceRailPayload);

    return (
        <div className="space-y-6">
            <ConstitutionalShield />
            
            <section className="overflow-hidden rounded-[30px] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(3,12,21,0.96),rgba(11,18,31,0.94))] p-6 shadow-[0_30px_80px_rgba(2,6,23,0.45)] sm:p-8 relative">
                <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                    <Scale size={180} strokeWidth={0.5} className="text-emerald-500" />
                </div>

                <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between relative z-10">
                    <div className="max-w-3xl">
                        <div className="mb-3 flex flex-wrap gap-2">
                            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-200">
                                OSINT-HUB v11.5 | Контрагентна розвідка
                            </span>
                            <span
                                className={cn(
                                    'rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em]',
                                    backendStatus.isOffline
                                        ? 'border-rose-400/20 bg-rose-500/10 text-rose-200'
                                        : 'border-cyan-400/20 bg-cyan-500/10 text-cyan-200',
                                )}
                            >
                                {backendStatus.statusLabel}
                            </span>
                            <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-200 select-none">
                                CERTIFIED ANALYTICS
                            </span>
                        </div>

                        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                            Перевірка контрагентів
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                            Панель працює з підтвердженими профілями компаній, показує фактичний стан
                            ризику, CERS-компоненти та наявні службові записи під захистом <span className="text-emerald-400 font-bold">Constitutional Shield</span>.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[560px]">
                        <MetricTile label="Контрагентів" value={riskEntities.length.toString()} />
                        <MetricTile label="У фільтрі" value={filteredEntities.length.toString()} />
                        <MetricTile 
                            label="Статус" 
                            value="v11.5 HUB" 
                            accent="text-emerald-400"
                            compact 
                        />
                    </div>
                </div>
            </section>

            <div className="flex h-[calc(100vh-200px)] flex-col gap-6 overflow-hidden lg:flex-row">
                <div className="flex w-full flex-col overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.03] shadow-[0_24px_60px_rgba(2,6,23,0.35)] lg:w-96">
                    <div className="border-b border-white/[0.06] bg-black/20 p-4">
                        <h2 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.28em] text-white">
                            <ShieldCheck size={14} className="text-emerald-400" />
                            Ризикові контрагенти
                        </h2>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Пошук за назвою або ЄДРПОУ..."
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                className="w-full rounded-2xl border border-white/[0.08] bg-black/30 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-emerald-400/30"
                            />
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            {riskFilters.map((filter) => (
                                <button
                                    key={filter.value}
                                    onClick={() => setRiskFilter(filter.value)}
                                    className={cn(
                                        'rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all',
                                        riskFilter === filter.value
                                            ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
                                            : 'border-white/10 bg-black/20 text-slate-400 hover:text-white',
                                    )}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="custom-scrollbar flex-1 overflow-y-auto p-2">
                        {loadingSidebar ? (
                            <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500">
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.24em]">
                                    Завантаження переліку...
                                </span>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                {filteredEntities.map((entity) => (
                                    <button
                                        key={`${entity.ueid ?? entity.edrpou}-${entity.name}`}
                                        onClick={() => void handleSelectEntity(entity)}
                                        className={cn(
                                            'w-full rounded-2xl border p-3 text-left transition-all duration-200',
                                            selectedEntity?.edrpou === entity.edrpou
                                                ? 'border-emerald-400/18 bg-emerald-500/10 shadow-[0_12px_30px_rgba(16,185,129,0.08)]'
                                                : 'border-transparent bg-black/10 hover:border-white/[0.08] hover:bg-white/[0.03]',
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <div
                                                    className={cn(
                                                        'truncate text-sm font-bold',
                                                        selectedEntity?.edrpou === entity.edrpou
                                                            ? 'text-emerald-200'
                                                            : 'text-slate-100',
                                                    )}
                                                >
                                                    {entity.name}
                                                </div>
                                                <div className="mt-2 text-[11px] text-slate-500">
                                                    ЄДРПОУ: {entity.edrpou}
                                                </div>
                                            </div>
                                            <RiskBadge level={entity.risk_level} />
                                        </div>

                                        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                                            <span>{formatStatusLabel(entity.status)}</span>
                                            <span className="font-mono text-slate-300">БАЛ: {Math.round(entity.risk_score)}</span>
                                        </div>
                                    </button>
                                ))}

                                {!loadingSidebar && filteredEntities.length === 0 && (
                                    <div className="rounded-2xl border border-dashed border-white/[0.08] px-4 py-6 text-center text-sm text-slate-500">
                                        За поточними фільтрами компаній не знайдено.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="custom-scrollbar flex-1 overflow-y-auto rounded-[28px] border border-white/[0.08] bg-white/[0.03] shadow-[0_24px_60px_rgba(2,6,23,0.35)]">
                    <AnimatePresence mode="wait">
                        {loadingProfile ? (
                            <motion.div
                                key="loading-profile"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex min-h-[520px] flex-col items-center justify-center gap-4"
                            >
                                <div className="relative flex h-24 w-24 items-center justify-center">
                                    <div className="absolute inset-0 rounded-full border border-white/[0.06]" />
                                    <div className="absolute inset-2 animate-spin rounded-full border-t-2 border-emerald-400" />
                                    <Activity className="h-8 w-8 text-emerald-300" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-sm font-black uppercase tracking-[0.24em] text-white">
                                        Оновлення профілю...
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Отримуємо підтверджені записи по компанії
                                    </p>
                                </div>
                            </motion.div>
                        ) : companyProfile ? (
                            <motion.div
                                key={profileIdentifier ?? companyProfile.name}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-8 p-6 sm:p-8"
                            >
                                <div className="flex flex-col gap-6 border-b border-white/[0.06] pb-8 xl:flex-row xl:items-start xl:justify-between">
                                    <div className="max-w-3xl">
                                        <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/20 px-3 py-1.5">
                                            <Building2 size={14} className="text-slate-400" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                Профіль компанії
                                            </span>
                                        </div>

                                        <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-white">
                                            {companyProfile.name}
                                        </h2>

                                        <div className="mt-5 flex flex-wrap gap-4 text-xs">
                                            <HeaderFact label="ЄДРПОУ" value={companyProfile.edrpou ?? 'Н/Д'} />
                                            <HeaderFact label="Статус" value={formatStatusLabel(companyProfile.status)} accent="text-emerald-300" />
                                            <HeaderFact
                                                label="Реєстрація"
                                                value={formatDateLabel(companyProfile.registration_date ?? companyProfile.created_at)}
                                            />
                                            <HeaderFact
                                                label="Оновлено"
                                                value={formatDateLabel(companyProfile.updated_at)}
                                            />
                                        </div>

                                        <div className="mt-6 flex flex-wrap gap-3">
                                            {profileIdentifier ? (
                                                <Link
                                                    to={`/company/${profileIdentifier}/cers`}
                                                    className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/[0.08]"
                                                >
                                                    <Activity size={14} />
                                                    CERS дашборд
                                                </Link>
                                            ) : null}

                                            <button className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-200 transition-colors hover:bg-emerald-500/16">
                                                <FileText size={14} />
                                                Згенерувати досьє
                                            </button>

                                            <button className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200 transition-colors hover:bg-cyan-500/16">
                                                <Globe size={14} />
                                                Аналіз зв'язків
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex min-w-[220px] flex-col items-center rounded-[28px] border border-white/[0.08] bg-black/20 p-6">
                                        <div className="relative">
                                            <svg className="h-28 w-28 -rotate-90 transform">
                                                <circle
                                                    cx="56"
                                                    cy="56"
                                                    r="46"
                                                    stroke="currentColor"
                                                    strokeWidth="10"
                                                    fill="transparent"
                                                    className="text-white/6"
                                                />
                                                <circle
                                                    cx="56"
                                                    cy="56"
                                                    r="46"
                                                    stroke="currentColor"
                                                    strokeWidth="10"
                                                    fill="transparent"
                                                    strokeDasharray={`${2 * Math.PI * 46}`}
                                                    strokeDashoffset={`${2 * Math.PI * 46 * (1 - clampScore(companyProfile.risk_score) / 100)}`}
                                                    className={profileRiskLevel === 'critical' ? 'text-rose-400' : profileRiskLevel === 'high' ? 'text-orange-300' : 'text-emerald-300'}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-3xl font-black text-white">
                                                    {Math.round(companyProfile.risk_score)}
                                                </span>
                                                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
                                                    РИЗИК
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <RiskBadge level={profileRiskLevel} large />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                                    <div className="rounded-[28px] border border-white/[0.08] bg-black/20 p-6">
                                        <div className="mb-5 flex items-center justify-between gap-3">
                                            <h3 className="text-sm font-black uppercase tracking-[0.24em] text-white">
                                                CERS оцінка
                                            </h3>
                                            <span className="text-xs text-slate-500">Поточний розклад факторів ризику</span>
                                        </div>
                                        <CERSRadarChart points={radarPoints} />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <StatCard
                                            icon={<Users className="text-blue-300" />}
                                            label="Керівництво"
                                            value={directors.length}
                                            suffix="осіб"
                                        />
                                        <StatCard
                                            icon={<AlertTriangle className="text-amber-300" />}
                                            label="Аномалії"
                                            value={anomalies.length}
                                            suffix="виявлено"
                                            highlight={anomalies.length > 0}
                                        />
                                        <StatCard
                                            icon={<ShieldCheck className="text-rose-300" />}
                                            label="Санкції"
                                            value={sanctions.length}
                                            suffix="записів"
                                            highlight={sanctions.length > 0}
                                        />
                                        <StatCard
                                            icon={<Activity className="text-cyan-300" />}
                                            label="Впевненість CERS"
                                            value={cersConfidence !== undefined ? `${Math.round(cersConfidence * 100)}%` : 'Н/Д'}
                                            suffix="моделі"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 xl:grid-cols-4">
                                    <DetailTile label="Сектор" value={companyProfile.sector ?? 'Н/Д'} />
                                    <DetailTile label="Рівень ризику" value={riskLevelLabel[profileRiskLevel]} />
                                    <DetailTile
                                        label="Останнє оновлення"
                                        value={formatDateLabel(companyProfile.updated_at)}
                                    />
                                    <DetailTile
                                        label="Ідентифікатор"
                                        value={companyProfile.ueid ?? companyProfile.edrpou ?? 'Н/Д'}
                                    />
                                </div>

                                <div className="rounded-[28px] border border-cyan-400/14 bg-cyan-500/8 p-6">
                                    <div className="flex items-start gap-4">
                                        <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-cyan-200" />
                                        <div>
                                            <h3 className="text-lg font-black text-white">Інтерпретація ризику</h3>
                                            <p className="mt-2 text-sm leading-7 text-slate-300">
                                                {companyProfile.interpretation ??
                                                    'Бекенд не повернув текстову інтерпретацію. Вище показані лише підтверджені поля профілю та CERS-компоненти.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-8 xl:grid-cols-2">
                                    <div className="space-y-4">
                                        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-white">
                                            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                                            Санкційні перевірки
                                        </h3>

                                        {sanctions.length > 0 ? (
                                            <div className="space-y-3">
                                                {sanctions.map((sanction, index) => (
                                                    <div
                                                        key={`${sanction.list_name}-${index}`}
                                                        className="rounded-2xl border border-rose-400/16 bg-rose-500/8 p-4"
                                                    >
                                                        <div className="flex items-center justify-between gap-3">
                                                            <span className="text-xs font-black uppercase tracking-[0.16em] text-rose-200">
                                                                {sanction.list_name}
                                                            </span>
                                                            <span className="text-[11px] text-slate-500">
                                                                {sanction.date_added}
                                                            </span>
                                                        </div>
                                                        <p className="mt-2 text-sm leading-7 text-slate-300">
                                                            {sanction.reason}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <EmptyState
                                                icon={<ShieldCheck className="h-6 w-6 text-emerald-300" />}
                                                title="Санкцій не виявлено"
                                                description="Або бекенд не надав окремого санкційного переліку для цього профілю."
                                            />
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-white">
                                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                            Аномалії активності
                                        </h3>

                                        {anomalies.length > 0 ? (
                                            <div className="space-y-3">
                                                {anomalies.map((anomaly, index) => (
                                                    <div
                                                        key={`${anomaly.type}-${index}`}
                                                        className="flex gap-4 rounded-2xl border border-white/[0.08] bg-black/20 p-4"
                                                    >
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <span className="text-xs font-bold uppercase tracking-[0.14em] text-white">
                                                                    {anomaly.type}
                                                                </span>
                                                                <span className="text-[11px] text-slate-500">
                                                                    {anomaly.date_detected}
                                                                </span>
                                                            </div>
                                                            <p className="mt-2 text-sm leading-7 text-slate-400">
                                                                {anomaly.description}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-mono text-lg font-black text-amber-200">
                                                                {anomaly.score}
                                                            </div>
                                                            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                                                Вплив
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <EmptyState
                                                icon={<Activity className="h-6 w-6 text-slate-500" />}
                                                title="Аномальних патернів не знайдено"
                                                description="Якщо бекенд поверне сигнали, вони зʼявляться в цьому блоці без додаткових налаштувань."
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-white">
                                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                                        Бенефіціари та керівництво
                                    </h3>

                                    {beneficiaries.length > 0 || directors.length > 0 ? (
                                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                            {beneficiaries.map((person) => (
                                                <PersonCard key={`beneficiary-${person.id}`} person={person} role="Бенефіціар" />
                                            ))}
                                            {directors.map((person) => (
                                                <PersonCard key={`director-${person.id}`} person={person} role="Керівник" />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid gap-4 rounded-[28px] border border-white/[0.08] bg-black/20 p-5 md:grid-cols-3">
                                            <DetailTile label="Сектор" value={companyProfile.sector ?? 'Н/Д'} />
                                            <DetailTile
                                                label="Впевненість CERS"
                                                value={cersConfidence !== undefined ? `${Math.round(cersConfidence * 100)}%` : 'Н/Д'}
                                            />
                                            <DetailTile
                                                label="Оновлено"
                                                value={formatDateLabel(companyProfile.updated_at)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <div className="flex min-h-[520px] flex-col items-center justify-center gap-4 text-slate-500">
                                <Building2 className="h-16 w-16 animate-pulse" />
                                <p className="text-sm font-black uppercase tracking-[0.24em]">
                                    Виберіть об'єкт для аналізу
                                </p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <ConstitutionalShield />
        </div>
    );
}

function RiskBadge({ level, large = false }: { level: RiskLevelValue; large?: boolean }) {
    return (
        <span
            className={cn(
                'inline-flex rounded-full border font-black uppercase tracking-[0.18em]',
                large ? 'px-3 py-1.5 text-[11px]' : 'px-2.5 py-1 text-[9px]',
                riskLevelTone[level],
            )}
        >
            {riskLevelLabel[level]}
        </span>
    );
}

function HeaderFact({
    label,
    value,
    accent,
}: {
    label: string;
    value: string;
    accent?: string;
}) {
    return (
        <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</span>
            <span className={cn('font-semibold text-white', accent)}>{value}</span>
        </div>
    );
}

function MetricTile({
    label,
    value,
    compact,
}: {
    label: string;
    value: string;
    compact?: boolean;
}) {
    return (
        <div className="rounded-[24px] border border-white/[0.08] bg-black/20 p-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</div>
            <div
                className={cn(
                    'mt-2 font-black tracking-tight text-white',
                    compact ? 'text-sm leading-6' : 'text-3xl',
                )}
            >
                {value}
            </div>
        </div>
    );
}

function DetailTile({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-[24px] border border-white/[0.08] bg-black/20 p-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</div>
            <div className="mt-2 text-sm font-semibold leading-6 text-white">{value}</div>
        </div>
    );
}

function StatCard({
    icon,
    label,
    value,
    suffix,
    highlight,
}: {
    icon: ReactNode;
    label: string;
    value: string | number;
    suffix: string;
    highlight?: boolean;
}) {
    return (
        <div
            className={cn(
                'rounded-[24px] border p-4 transition-all duration-200',
                highlight ? 'border-white/[0.16] bg-white/[0.08]' : 'border-white/[0.08] bg-black/20',
            )}
        >
            <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04]">
                    {icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                    {label}
                </span>
            </div>
            <div className="flex items-end gap-2">
                <span className="text-2xl font-black text-white">{value}</span>
                <span className="pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    {suffix}
                </span>
            </div>
        </div>
    );
}

function EmptyState({
    icon,
    title,
    description,
}: {
    icon: ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-[24px] border border-white/[0.08] bg-black/20 p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03]">
                {icon}
            </div>
            <div>
                <div className="text-sm font-bold text-white">{title}</div>
                <p className="mt-2 text-sm leading-7 text-slate-500">{description}</p>
            </div>
        </div>
    );
}

function PersonCard({ person, role }: { person: PersonInfo; role: string }) {
    const properties = Object.entries(person.properties ?? {}).slice(0, 2);

    return (
        <div className="rounded-[24px] border border-white/[0.08] bg-black/20 p-4 transition-all hover:border-emerald-400/20">
            <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-blue-400/20 bg-blue-500/10 text-blue-300">
                    <UserCheck size={20} />
                </div>
                <div className="min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">
                        {role}
                    </div>
                    <div className="truncate text-sm font-bold uppercase tracking-[0.03em] text-white">
                        {person.label}
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                {properties.length > 0 ? (
                    properties.map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between gap-3 text-[11px]">
                            <span className="font-mono uppercase tracking-[0.14em] text-slate-500">{key}</span>
                            <span className="truncate text-right text-slate-300">{String(value)}</span>
                        </div>
                    ))
                ) : (
                    <div className="text-[11px] text-slate-500">Деталізація не надана бекендом.</div>
                )}
            </div>
        </div>
    );
}

function CERSRadarChart({ points }: { points: RadarPoint[] }) {
    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(99, 102, 241, 0.3)',
            textStyle: { color: '#fff', fontSize: 12 },
            padding: [8, 12],
        },
        radar: {
            indicator: points.map((point) => ({ name: point.label, max: 100 })),
            shape: 'polygon',
            splitNumber: 4,
            name: {
                textStyle: { color: '#94a3b8', fontSize: 10 },
            },
            splitLine: {
                lineStyle: {
                    color: [
                        'rgba(255,255,255,0.1)',
                        'rgba(255,255,255,0.08)',
                        'rgba(255,255,255,0.06)',
                        'rgba(255,255,255,0.04)',
                    ],
                },
            },
            splitArea: {
                areaStyle: {
                    color: ['rgba(99,102,241,0.05)', 'rgba(99,102,241,0.03)'],
                },
            },
            axisLine: {
                lineStyle: {
                    color: 'rgba(255,255,255,0.1)',
                },
            },
        },
        series: [
            {
                name: 'CERS оцінка',
                type: 'radar',
                data: [
                    {
                        value: points.map((point) => clampScore(point.value)),
                    },
                ],
                areaStyle: {
                    color: 'rgba(99,102,241,0.3)',
                },
                lineStyle: {
                    color: '#818cf8',
                    width: 2.5,
                },
                itemStyle: {
                    color: '#a5b4fc',
                    borderColor: '#6366f1',
                    borderWidth: 2,
                },
                symbolSize: 7,
            },
        ],
    };

    return (
        <div className="h-72 w-full">
            <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
        </div>
    );
}
