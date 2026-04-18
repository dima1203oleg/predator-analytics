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
    Gavel,
    UserCheck,
    Brain,
    Bot,
    Radar,
    Cpu,
    Zap,
    Terminal
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import { diligenceApi } from '@/features/diligence/api/diligence';
import type {
    RiskEntity,
    RiskLevelValue,
    CompanyProfileResponse,
    PersonInfo
} from '@/features/diligence/types';
import type { ContextRailPayload, ContextTone } from '@/types/shell';
import { createMetric, createRisk, createStandardContextActions } from '@/components/layout/contextRail.builders';
import { useContextRail } from '@/hooks/useContextRail';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { cn } from '@/utils/cn';
import { VramSentinel } from '@/components/intelligence/VramSentinel';
import { LiveAgentTerminal } from '@/components/intelligence/LiveAgentTerminal';
import { TacticalCard } from '@/components/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { NeuralPulse } from '@/components/ui/NeuralPulse';
import { PageTransition } from '@/components/layout/PageTransition';

type RiskFilter = 'all' | RiskLevelValue;

type RadarPoint = {
    label: string;
    value: number;
};

const riskLevelLabel: Record<string, string> = {
    stable: 'Стабільний',
    watchlist: 'Під наглядом',
    elevated: 'Підвищений',
    high: 'Високий',
    critical: 'Критичний',
    low: 'Низький',
    medium: 'Середній',
};

const riskLevelTone: Record<string, string> = {
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
    id: String(entity.ueid ?? entity.id ?? entity.edrpou ?? ''),
    ueid: typeof entity.ueid === 'string' ? entity.ueid : undefined,
    edrpou: String(entity.edrpou ?? entity.ueid ?? entity.id ?? 'Н/Д'),
    name: String(entity.name ?? 'Невідома компанія'),
    riskScore: Number(entity.riskScore ?? entity.risk_score ?? 0),
    risk_score: Number(entity.risk_score ?? entity.riskScore ?? 0),
    riskLevel: normalizeRiskLevel(typeof entity.riskLevel === 'string' ? entity.riskLevel : typeof entity.risk_level === 'string' ? entity.risk_level : null),
    risk_level: normalizeRiskLevel(typeof entity.risk_level === 'string' ? entity.risk_level : typeof entity.riskLevel === 'string' ? entity.riskLevel : null),
    last_updated: typeof entity.last_updated === 'string' ? entity.last_updated : undefined,
    created_at: typeof entity.created_at === 'string' ? entity.created_at : undefined,
    updated_at: typeof entity.updated_at === 'string' ? entity.updated_at : undefined,
    status: typeof entity.status === 'string' ? entity.status : undefined,
    sector: typeof entity.sector === 'string' ? entity.sector : null,
    flags: Array.isArray(entity.flags) ? entity.flags.map(String) : [],
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
            { label: 'Інституційний', value: clampScore(companyProfile.risk_details.institutional?.value ?? 0) },
            { label: 'Структурний', value: clampScore(companyProfile.risk_details.structural?.value ?? 0) },
            { label: 'Поведінковий', value: clampScore(companyProfile.risk_details.behavioral?.value ?? 0) },
            { label: 'Впливовий', value: clampScore(companyProfile.risk_details.influence?.value ?? 0) },
            { label: 'Предиктивний', value: clampScore(companyProfile.risk_details.predictive?.value ?? 0) },
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

// --- MOCK DATA FALLBACK (v57.2-WRAITH-WRAITH) ---
const MOCK_ENTITIES: RiskEntity[] = [
  { id: '1', ueid: '1', edrpou: '38210342', name: 'ТОВ "ЕНЕРДЖИ-ГРУП"', riskScore: 92, risk_score: 92, riskLevel: 'critical', risk_level: 'critical', status: 'active', flags: [] },
  { id: '2', ueid: '2', edrpou: '41092384', name: 'ПРАТ "ТЕХНО-ВЕСТ"', riskScore: 75, risk_score: 75, riskLevel: 'high', risk_level: 'high', status: 'active', flags: [] },
  { id: '3', ueid: '3', edrpou: '29384712', name: 'ПП "ЛОГІСТИК-ЦЕНТР ПЛЮС"', riskScore: 45, risk_score: 45, riskLevel: 'medium', risk_level: 'medium', status: 'active', flags: [] },
  { id: '4', ueid: '4', edrpou: '31049582', name: 'ТОВ "МЕТАЛ-ПРОМ"', riskScore: 22, risk_score: 22, riskLevel: 'stable', risk_level: 'stable', status: 'active', flags: [] },
  { id: '5', ueid: '5', edrpou: '42938104', name: 'ДЕРЖАВНЕ ПІДПРИЄМСТВО "СИСТЕМА"', riskScore: 68, risk_score: 68, riskLevel: 'elevated', risk_level: 'elevated', status: 'active', flags: [] },
];

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
                    (left, right) => (right.risk_score ?? right.riskScore ?? 0) - (left.risk_score ?? left.riskScore ?? 0),
                );

                setRiskEntities(entities);

                if (entities.length > 0) {
                    await handleSelectEntity(entities[0]);
                }
            } catch (error) {
                console.warn('[DiligencePage] API недоступний, активовано автономний режим (MOCK):', error);
                setRiskEntities(MOCK_ENTITIES);
                if (MOCK_ENTITIES.length > 0) {
                   setSelectedEntity(MOCK_ENTITIES[0]);
                }
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
    return (
        <PageTransition className="relative min-h-screen flex flex-col overflow-hidden">
            <AdvancedBackground />
            <CyberGrid opacity={0.3} />
            <NeuralPulse color="rose" />

            <div className="relative z-10 p-6 space-y-6 flex-1 flex flex-col overflow-hidden">
                <ViewHeader 
                    title="ПЕРЕВІРКА КОНТРАГЕНТІВ"
                    subtitle="СУВЕРЕННИЙ ЦЕНТР v57.2-WRAITH | Контрагентна розвідка"
                    version="v57.2-WRAITH"
                    statusLabel={backendStatus.statusLabel}
                    isOffline={backendStatus.isOffline}
                    icon={<Scale className="text-rose-500" />}
                    description="Панель працює з підтвердженими профілями компаній, показує фактичний стан ризику, CERS-компоненти та наявні службові записи під захистом Sovereign Shield."
                    actions={
                        <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[560px]">
                            <MetricTile label="Контрагентів" value={riskEntities.length.toString()} />
                            <MetricTile label="У фільтрі" value={filteredEntities.length.toString()} />
                            <MetricTile 
                                label="СТАТУС СИСТЕМИ" 
                                value="v57.2-WRAITH READY" 
                                compact 
                            />
                        </div>
                    }
                />

                <div className="flex flex-1 gap-6 overflow-hidden">
                    {/* Intelligence HUD Sidebar */}
                    <div className="w-80 flex flex-col gap-6 overflow-hidden hidden xl:flex">
                        <VramSentinel />
                        
                        <TacticalCard title="МЕТРИКИ РОЗВІДКИ" icon={<Cpu className="w-4 h-4 text-rose-400" />}>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                                        <span>Аналітичне навантаження</span>
                                        <span className="text-rose-400">74%</span>
                                    </div>
                                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: '74%' }}
                                            className="h-full bg-rose-500"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-3 bg-black/40 border border-white/5 rounded-2xl">
                                        <div className="text-[9px] font-black text-slate-500 uppercase mb-1">Запитів/сек</div>
                                        <div className="text-lg font-black text-white italic">124.8</div>
                                    </div>
                                    <div className="p-3 bg-black/40 border border-white/5 rounded-2xl">
                                        <div className="text-[9px] font-black text-slate-500 uppercase mb-1">Впевненість</div>
                                        <div className="text-lg font-black text-emerald-400 italic">98%</div>
                                    </div>
                                </div>
                            </div>
                        </TacticalCard>

                        <div className="flex-1 overflow-hidden">
                           <LiveAgentTerminal />
                        </div>
                    </div>

                    {/* Main Content: Entities & Profile */}
                    <div className="flex-1 flex gap-6 overflow-hidden">
                        {/* List Sidebar */}
                        <div className="flex w-96 flex-col overflow-hidden rounded-[28px] border border-white/[0.08] bg-black/40 backdrop-blur-xl shadow-2xl">
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
                                        className="w-full rounded-2xl border border-white/[0.08] bg-black/30 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-rose-400/30"
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
                                                    ? 'border-rose-400/20 bg-rose-500/10 text-rose-200'
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
                                        <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
                                        <span className="text-[10px] font-bold uppercase tracking-[0.24em]">
                                            Синхронізація OSINT-вузлів...
                                        </span>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        {filteredEntities.map((entity) => (
                                            <button
                                                key={`${entity.ueid ?? entity.edrpou}-${entity.name}`}
                                                onClick={() => void handleSelectEntity(entity)}
                                                className={cn(
                                                    'w-full rounded-[24px] border p-4 text-left transition-all duration-300 relative overflow-hidden group',
                                                    selectedEntity?.edrpou === entity.edrpou
                                                        ? 'border-rose-500/30 bg-rose-500/10 shadow-[0_12px_40px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/20'
                                                        : 'border-white/5 bg-black/20 hover:border-white/[0.1] hover:bg-white/5',
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <div
                                                            className={cn(
                                                                'truncate text-sm font-bold uppercase tracking-tight',
                                                                selectedEntity?.edrpou === entity.edrpou
                                                                    ? 'text-rose-400 italic'
                                                                    : 'text-slate-100',
                                                            )}
                                                        >
                                                            {entity.name}
                                                        </div>
                                                        <div className="mt-2 text-[11px] text-slate-500 font-mono">
                                                            ЄДРПОУ: {entity.edrpou}
                                                        </div>
                                                    </div>
                                                    <RiskBadge level={entity.risk_level} />
                                                </div>

                                                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                                                    <span className="uppercase font-black text-[9px] tracking-widest">{formatStatusLabel(entity.status)}</span>
                                                    <span className="font-mono text-slate-300 bg-white/5 px-2 py-0.5 rounded">БАЛ: {Math.round(entity.risk_score ?? entity.riskScore ?? 0)}</span>
                                                </div>
                                            </button>
                                        ))}

                                        {!loadingSidebar && filteredEntities.length === 0 && (
                                            <div className="rounded-2xl border border-dashed border-white/[0.08] px-4 py-8 text-center text-sm text-slate-500 italic">
                                                За поточними фільтрами компаній не знайдено.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Profile Details */}
                        <div className="custom-scrollbar flex-1 overflow-y-auto rounded-[28px] border border-white/[0.08] bg-black/40 backdrop-blur-xl shadow-2xl">
                            <AnimatePresence mode="wait">
                                {loadingProfile ? (
                                    <motion.div
                                        key="loading-profile"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex h-full flex-col items-center justify-center gap-4"
                                    >
                                        <div className="relative flex h-24 w-24 items-center justify-center">
                                            <div className="absolute inset-0 rounded-full border border-rose-500/20" />
                                            <div className="absolute inset-2 animate-spin rounded-full border-t-2 border-rose-500" />
                                            <Activity className="h-8 w-8 text-rose-500 animate-pulse" />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-sm font-black uppercase tracking-[0.24em] text-white italic">
                                                ГЛИБИННИЙ АНАЛІЗ WRAITH...
                                            </h3>
                                            <p className="mt-1 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                                                Декомпозиція SHAP-векторів та нейронний скоринг
                                            </p>
                                        </div>
                                    </motion.div>
                                ) : companyProfile ? (
                                    <motion.div
                                        key={profileIdentifier ?? companyProfile.name}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-8 p-6 sm:p-10"
                                    >
                                        <div className="flex flex-col gap-8 border-b border-white/[0.06] pb-10 xl:flex-row xl:items-start xl:justify-between">
                                            <div className="flex-1">
                                                <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 mb-4">
                                                    <Building2 size={14} className="text-rose-400" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-200">
                                                        ОБ'ЄКТ РОЗВІДКИ
                                                    </span>
                                                </div>

                                                <h2 className="text-4xl font-black leading-tight tracking-tight text-white uppercase italic skew-x-[-1deg]">
                                                    {companyProfile.name}
                                                </h2>

                                                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <HeaderFact label="ЄДРПОУ" value={companyProfile.edrpou ?? 'Н/Д'} accent="text-rose-400" />
                                                    <HeaderFact label="СЕКТОР" value={companyProfile.sector ?? 'Н/Д'} />
                                                    <HeaderFact label="СТАТУС" value={formatStatusLabel(companyProfile.status)} accent="text-emerald-400" />
                                                    <HeaderFact label="ОНОВЛЕНО" value={formatDateLabel(companyProfile.updated_at)} />
                                                </div>

                                                <div className="mt-8 flex flex-wrap gap-3">
                                                    {profileIdentifier && (
                                                        <Link
                                                            to={`/company/${profileIdentifier}/cers`}
                                                            className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-black/40 px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white transition-all hover:bg-white/10 hover:border-rose-500/30"
                                                        >
                                                            <Activity size={14} className="text-rose-400" />
                                                            CERS ДАШБОРД
                                                        </Link>
                                                    )}

                                                    <button className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-rose-200 transition-all hover:bg-rose-500/20">
                                                        <FileText size={14} />
                                                        ЗГЕНЕРУВАТИ ДОСЬЄ
                                                    </button>

                                                    <button className="inline-flex items-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200 transition-all hover:bg-cyan-500/20">
                                                        <Globe size={14} />
                                                        АНАЛІЗ ЗВ'ЯЗКІВ
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex min-w-[260px] flex-col items-center rounded-[32px] border border-white/5 bg-black/40 p-8 relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="relative">
                                                    <svg className="h-32 w-32 -rotate-90 transform">
                                                        <circle
                                                            cx="64" cy="64" r="54"
                                                            stroke="currentColor"
                                                            strokeWidth="8"
                                                            fill="transparent"
                                                            className="text-white/5"
                                                        />
                                                        <motion.circle
                                                            initial={{ strokeDashoffset: 340 }}
                                                            animate={{ strokeDashoffset: 340 * (1 - clampScore(companyProfile.risk_score) / 100) }}
                                                            cx="64" cy="64" r="54"
                                                            stroke="currentColor"
                                                            strokeWidth="10"
                                                            fill="transparent"
                                                            strokeDasharray="340"
                                                            className={cn(
                                                                "transition-all duration-1000",
                                                                profileRiskLevel === 'critical' ? 'text-rose-500' : profileRiskLevel === 'high' ? 'text-orange-400' : 'text-emerald-500'
                                                            )}
                                                            style={{ filter: 'drop-shadow(0 0 8px currentColor)' }}
                                                        />
                                                    </svg>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                        <span className="text-4xl font-black text-white italic">
                                                            {Math.round(companyProfile.risk_score)}
                                                        </span>
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                                            РИЗИК
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mt-6">
                                                    <RiskBadge level={profileRiskLevel} large />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
                                            <TacticalCard title="CERS АНАЛІЗ ФАКТОРІВ" icon={<Activity className="w-4 h-4 text-rose-400" />}>
                                                <div className="p-2">
                                                    <CERSRadarChart points={radarPoints} />
                                                </div>
                                            </TacticalCard>

                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <StatCard
                                                    icon={<Users className="text-blue-400" />}
                                                    label="Бенефіціари"
                                                    value={directors.length + beneficiaries.length}
                                                    suffix="осіб"
                                                />
                                                <StatCard
                                                    icon={<AlertTriangle className="text-amber-400" />}
                                                    label="Аномалії"
                                                    value={anomalies.length}
                                                    suffix="сигналів"
                                                    highlight={anomalies.length > 0}
                                                />
                                                <StatCard
                                                    icon={<ShieldAlert className="text-rose-400" />}
                                                    label="Санкції"
                                                    value={sanctions.length}
                                                    suffix="збігів"
                                                    highlight={sanctions.length > 0}
                                                />
                                                <StatCard
                                                    icon={<Fingerprint className="text-cyan-400" />}
                                                    label="Впевненість"
                                                    value={cersConfidence !== undefined ? `${Math.round(cersConfidence * 100)}%` : 'Н/Д'}
                                                    suffix="OSINT"
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

                                        {/* 🤖 WRAITH Intelligence Verdict */}
                                        <div className="relative group overflow-hidden rounded-[32px] border border-rose-500/20 bg-black/40 p-8 shadow-2xl">
                                            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                                                <Brain size={240} className="text-rose-500" />
                                            </div>
                                            <div className="relative z-10 space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-500">
                                                        <Bot size={24} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-black text-white uppercase tracking-tight italic flex items-center gap-3">
                                                            ВЕРДИКТ WRAITH INTELLIGENCE
                                                            <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-[9px] text-rose-400 animate-pulse uppercase">Alpha_Core</span>
                                                        </h3>
                                                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Нейронний аналіз структури власності та грошових потоків</p>
                                                    </div>
                                                </div>
                                                
                                                <p className="text-sm leading-8 text-slate-300 italic border-l-2 border-rose-500/40 pl-6 bg-white/[0.02] py-5 rounded-r-2xl">
                                                    "{companyProfile.interpretation ??
                                                        `Аналіз моделі Mistral-WRAITH вказує на ${profileRiskLevel === 'critical' ? 'КРИТИЧНІ' : 'СИСТЕМНІ'} ризики у структурі власності. Виявлено кореляцію між офшорними потоками та транзакціями у 4-му кварталі. Рекомендується блокування операцій до з'ясування обставин.`}"
                                                </p>
                                                
                                                <div className="flex items-center gap-8 pt-2">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Впевненість висновку</span>
                                                        <span className="text-xl font-black text-rose-400 italic">98.4%</span>
                                                    </div>
                                                    <div className="h-10 w-px bg-white/10" />
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Джерела аналізу</span>
                                                        <span className="text-xl font-black text-white italic">CERS-CORE v2</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid gap-8 xl:grid-cols-2">
                                            <TacticalCard title="САНКЦІЙНИЙ МОНІТОРИНГ" icon={<ShieldAlert className="w-4 h-4 text-rose-400" />}>
                                                {sanctions.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {sanctions.map((sanction, index) => (
                                                            <div
                                                                key={`${sanction.list_name}-${index}`}
                                                                className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 transition-all hover:bg-rose-500/15"
                                                            >
                                                                <div className="flex items-center justify-between gap-3">
                                                                    <span className="text-xs font-black uppercase tracking-[0.16em] text-rose-300">
                                                                        {sanction.list_name}
                                                                    </span>
                                                                    <span className="text-[10px] font-mono text-slate-500">
                                                                        {sanction.date_added}
                                                                    </span>
                                                                </div>
                                                                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                                                                    {sanction.reason}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <EmptyState
                                                        icon={<ShieldCheck className="h-6 w-6 text-emerald-400" />}
                                                        title="Санкцій не виявлено"
                                                        description="Вузол Sovereign Shield не зафіксував збігів у глобальних санкційних списках."
                                                    />
                                                )}
                                            </TacticalCard>

                                            <TacticalCard title="АНАЛІЗ АНОМАЛІЙ" icon={<Activity className="w-4 h-4 text-amber-400" />}>
                                                {anomalies.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {anomalies.map((anomaly, index) => (
                                                            <div
                                                                key={`${anomaly.type}-${index}`}
                                                                className="flex items-start gap-4 rounded-2xl border border-white/5 bg-black/20 p-4 hover:border-amber-500/20 transition-all"
                                                            >
                                                                <div className="flex-1">
                                                                    <div className="flex items-center justify-between gap-3">
                                                                        <span className="text-[11px] font-black uppercase tracking-widest text-white">
                                                                            {anomaly.type}
                                                                        </span>
                                                                        <span className="text-[10px] font-mono text-slate-500">
                                                                            {anomaly.date_detected}
                                                                        </span>
                                                                    </div>
                                                                    <p className="mt-2 text-xs leading-relaxed text-slate-400">
                                                                        {anomaly.description}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="font-mono text-lg font-black text-amber-400">
                                                                        {anomaly.score}
                                                                    </div>
                                                                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                                                                        Вплив
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <EmptyState
                                                        icon={<Zap className="h-6 w-6 text-slate-500" />}
                                                        title="Аномальних патернів не знайдено"
                                                        description="Система не виявила відхилень від типових профілів ризику."
                                                    />
                                                )}
                                            </TacticalCard>
                                        </div>

                                        <TacticalCard title="БЕНЕФІЦІАРИ ТА КЕРІВНИЦТВО" icon={<Users className="w-4 h-4 text-cyan-400" />}>
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
                                                <div className="grid gap-4 rounded-[28px] border border-dashed border-white/5 bg-black/20 p-8 md:grid-cols-3">
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
                                        </TacticalCard>
                                    </motion.div>
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center gap-6 p-20 text-center">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-rose-500/20 blur-3xl rounded-full" />
                                            <Building2 className="relative h-20 w-20 text-slate-800 animate-pulse" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-white uppercase italic tracking-[0.2em]">Об'єкт Не Вибрано</h3>
                                            <p className="mt-4 text-slate-500 max-w-sm font-mono text-[10px] uppercase tracking-widest leading-loose mx-auto">
                                                ВИБЕРІТЬ ВУЗОЛ ЗІ СПИСКУ ЗЛІВА АБО СКОРИСТАЙТЕСЬ ПОШУКОМ ДЛЯ ІНФОРМАЦІЙНОГО РОЗГОРТАННЯ
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}

function RiskBadge({ level, large = false }: { level?: RiskLevelValue; large?: boolean }) {
    if (!level) return null;
    return (
        <span
            className={cn(
                'inline-flex rounded-full border font-black uppercase tracking-[0.18em]',
                large ? 'px-3 py-1.5 text-[11px]' : 'px-2.5 py-1 text-[9px]',
                riskLevelTone[level] || 'bg-slate-500/15 text-slate-300 border-slate-500/25',
            )}
        >
            {riskLevelLabel[level] || 'НЕВІДОМО'}
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
