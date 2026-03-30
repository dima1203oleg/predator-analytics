import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertTriangle,
    Anchor,
    BarChart3,
    ChevronRight,
    Clock,
    DollarSign,
    Fingerprint,
    Globe,
    Layers,
    Loader2,
    Navigation,
    Package,
    RefreshCw,
    Search,
    ShieldAlert,
    Ship,
    Target,
    TrendingUp,
    Truck,
    type LucideIcon,
} from 'lucide-react';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { apiClient } from '@/services/api/config';
import { cn } from '@/utils/cn';
import {
    getLatestSupplyChainTimestamp,
    normalizeSupplyChainRoutesPayload,
    normalizeSupplyChainStatsPayload,
    normalizeSupplyChainTrackingPayload,
    type SupplyChainRoute,
    type SupplyChainRoutesSnapshot,
    type SupplyChainStatItem,
    type SupplyChainTrackingEvent,
    type SupplyChainTrackingSnapshot,
} from './supplyChainAnalytics.utils';

type SectionType = 'radar' | 'tracking' | 'routing' | 'ships' | 'risks' | 'forecasts';

const STAT_ICONS: Record<string, LucideIcon> = {
    Package,
    ShieldAlert,
    DollarSign,
};

const formatDateTime = (value?: string | null): string => {
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

const formatNumber = (value?: number | null): string =>
    value == null || !Number.isFinite(value) ? 'Н/д' : Math.round(value).toLocaleString('uk-UA');

const formatCurrency = (value?: number | null): string =>
    value == null || !Number.isFinite(value)
        ? 'Н/д'
        : `$${Math.round(value).toLocaleString('uk-UA')}`;

const formatPercent = (value?: number | null): string =>
    value == null || !Number.isFinite(value) ? 'Н/д' : `${Math.round(value)}%`;

const formatDays = (value?: number | null): string =>
    value == null || !Number.isFinite(value) ? 'Н/д' : `${Math.round(value)} дн.`;

const formatCostPerKg = (value?: number | null): string =>
    value == null || !Number.isFinite(value) ? 'Н/д' : `$${value.toFixed(2)}/кг`;

const getRiskMeta = (value?: number | null): { label: string; tone: string; border: string; badge: string } => {
    if (value == null || !Number.isFinite(value)) {
        return {
            label: 'Н/д',
            tone: 'text-slate-300',
            border: 'border-white/10',
            badge: 'border-white/10 bg-white/5 text-slate-200',
        };
    }

    if (value >= 80) {
        return {
            label: 'Критичний ризик',
            tone: 'text-rose-300',
            border: 'border-rose-500/30',
            badge: 'border-rose-500/20 bg-rose-500/10 text-rose-200',
        };
    }

    if (value >= 60) {
        return {
            label: 'Підвищений ризик',
            tone: 'text-amber-300',
            border: 'border-amber-500/30',
            badge: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
        };
    }

    return {
        label: 'Керований ризик',
        tone: 'text-emerald-300',
        border: 'border-emerald-500/30',
        badge: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
    };
};

const getStatusBadgeClass = (status?: string | null): string => {
    const normalized = status?.toLowerCase() ?? '';

    if (normalized.includes('митниц')) {
        return 'border-amber-500/20 bg-amber-500/10 text-amber-200';
    }

    if (normalized.includes('достав')) {
        return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200';
    }

    if (normalized.includes('порт') || normalized.includes('мор')) {
        return 'border-sky-500/20 bg-sky-500/10 text-sky-200';
    }

    return 'border-white/10 bg-white/5 text-slate-200';
};

const EmptyState = ({ title, description }: { title: string; description: string }) => (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-black/20 px-8 text-center">
        <AlertTriangle className="mb-4 h-10 w-10 text-slate-600" />
        <div className="text-lg font-black text-white">{title}</div>
        <div className="mt-3 max-w-xl text-sm leading-6 text-slate-400">{description}</div>
    </div>
);

const PanelTitle = ({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) => (
    <div className="mb-6 flex items-start justify-between gap-4">
        <div>
            <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3">
                    <Icon className="h-5 w-5 text-cyan-300" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white">{title}</h3>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
        </div>
    </div>
);

export default function SupplyChainAnalyticsView() {
    const backendStatus = useBackendStatus();
    const [activeSection, setActiveSection] = useState<SectionType>('radar');
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [statsData, setStatsData] = useState<{ generatedAt: string | null; items: SupplyChainStatItem[] }>({
        generatedAt: null,
        items: [],
    });
    const [trackingData, setTrackingData] = useState<SupplyChainTrackingSnapshot>({
        trackingId: null,
        currentStatus: null,
        estimatedArrival: null,
        generatedAt: null,
        events: [],
    });
    const [routesData, setRoutesData] = useState<SupplyChainRoutesSnapshot>({
        generatedAt: null,
        routes: [],
    });
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

    const loadData = useCallback(async (silent: boolean = false) => {
        if (silent) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const [statsResult, trackingResult, routesResult] = await Promise.allSettled([
                apiClient.get('/supply-chain/stats'),
                apiClient.get('/supply-chain/tracking'),
                apiClient.get('/supply-chain/routes'),
            ]);

            const nextStats = statsResult.status === 'fulfilled'
                ? normalizeSupplyChainStatsPayload(statsResult.value.data)
                : { generatedAt: null, items: [] };
            const nextTracking = trackingResult.status === 'fulfilled'
                ? normalizeSupplyChainTrackingPayload(trackingResult.value.data)
                : { trackingId: null, currentStatus: null, estimatedArrival: null, generatedAt: null, events: [] };
            const nextRoutes = routesResult.status === 'fulfilled'
                ? normalizeSupplyChainRoutesPayload(routesResult.value.data)
                : { generatedAt: null, routes: [] };

            setStatsData(nextStats);
            setTrackingData(nextTracking);
            setRoutesData(nextRoutes);

            const failedSources = [
                statsResult.status === 'rejected' ? '/supply-chain/stats' : null,
                trackingResult.status === 'rejected' ? '/supply-chain/tracking' : null,
                routesResult.status === 'rejected' ? '/supply-chain/routes' : null,
            ].filter((item): item is string => item !== null);

            if (failedSources.length === 3) {
                setFeedback('Контур ланцюгів постачання не отримав підтверджених даних від жодного маршруту `/supply-chain/*`.');
            } else if (failedSources.length > 0) {
                setFeedback(`Частина маршрутів тимчасово недоступна: ${failedSources.join(', ')}. Екран показує лише підтверджені відповіді без локальних підстановок.`);
            } else {
                setFeedback(null);
            }
        } catch (error) {
            console.error('Supply chain error:', error);
            setFeedback('Не вдалося синхронізувати контур ланцюгів постачання з бекендом.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        void loadData();

        const interval = window.setInterval(() => {
            void loadData(true);
        }, 30000);

        return () => window.clearInterval(interval);
    }, [loadData]);

    const filteredEvents = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) {
            return trackingData.events;
        }

        return trackingData.events.filter((event) =>
            [event.location, event.status, event.description, event.country]
                .filter((item): item is string => Boolean(item))
                .some((item) => item.toLowerCase().includes(normalizedQuery)),
        );
    }, [query, trackingData.events]);

    const filteredRoutes = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) {
            return routesData.routes;
        }

        return routesData.routes.filter((route) =>
            [route.origin, route.destination, route.via, route.recommendation]
                .filter((item): item is string => Boolean(item))
                .some((item) => item.toLowerCase().includes(normalizedQuery)),
        );
    }, [query, routesData.routes]);

    useEffect(() => {
        if (!selectedEventId && filteredEvents[0]) {
            setSelectedEventId(filteredEvents[0].id);
        }
    }, [filteredEvents, selectedEventId]);

    useEffect(() => {
        if (!selectedRouteId && filteredRoutes[0]) {
            setSelectedRouteId(filteredRoutes[0].id);
        }
    }, [filteredRoutes, selectedRouteId]);

    const selectedEvent = useMemo(
        () => filteredEvents.find((event) => event.id === selectedEventId) ?? filteredEvents[0] ?? null,
        [filteredEvents, selectedEventId],
    );

    const selectedRoute = useMemo(
        () => filteredRoutes.find((route) => route.id === selectedRouteId) ?? filteredRoutes[0] ?? null,
        [filteredRoutes, selectedRouteId],
    );

    const criticalRoutesCount = useMemo(
        () => routesData.routes.filter((route) => (route.riskScore ?? 0) >= 80).length,
        [routesData.routes],
    );

    const riskSignals = useMemo(() => {
        const eventSignals = trackingData.events
            .filter((event) => (event.riskScore ?? 0) >= 70)
            .map((event) => ({
                id: `event-${event.id}`,
                title: event.location,
                subtitle: event.description,
                source: 'Трекінг',
                score: event.riskScore,
                context: event.status,
            }));

        const routeSignals = routesData.routes
            .filter((route) => (route.riskScore ?? 0) >= 60)
            .map((route) => ({
                id: `route-${route.id}`,
                title: `${route.origin} → ${route.destination}`,
                subtitle: route.recommendation ?? 'Маршрут без рекомендації',
                source: 'Маршрут',
                score: route.riskScore,
                context: route.via ?? 'Н/д',
            }));

        return [...eventSignals, ...routeSignals]
            .sort((left, right) => (right.score ?? 0) - (left.score ?? 0))
            .slice(0, 8);
    }, [routesData.routes, trackingData.events]);

    const maritimeCorridors = useMemo(
        () =>
            routesData.routes
                .filter((route) => route.via?.toLowerCase().includes('порт'))
                .slice(0, 6),
        [routesData.routes],
    );

    const operationalOutlook = useMemo(() => {
        const routes = routesData.routes;
        if (routes.length === 0) {
            return null;
        }

        const totalValue = routes.reduce((sum, route) => sum + (route.totalValueUsd ?? 0), 0);
        const avgTransit = routes.reduce((sum, route) => sum + (route.transitTimeDays ?? 0), 0) / routes.length;
        const avgReliability = routes.reduce((sum, route) => sum + (route.reliability ?? 0), 0) / routes.length;
        const avgCost = routes.reduce((sum, route) => sum + (route.costPerKg ?? 0), 0) / routes.length;
        const bestRoute = [...routes].sort((left, right) => {
            const leftScore = (left.reliability ?? 0) - (left.riskScore ?? 0);
            const rightScore = (right.reliability ?? 0) - (right.riskScore ?? 0);
            return rightScore - leftScore;
        })[0] ?? null;

        return {
            totalValue,
            avgTransit,
            avgReliability,
            avgCost,
            bestRoute,
        };
    }, [routesData.routes]);

    const latestSync = getLatestSupplyChainTimestamp(
        statsData.generatedAt,
        trackingData.generatedAt,
        routesData.generatedAt,
    );

    const sections: Array<{ id: SectionType; label: string; icon: LucideIcon; desc: string }> = [
        { id: 'radar', label: 'Операційний радар', icon: Globe, desc: 'Зведення по трекінгу, маршрутах і поточному статусу' },
        { id: 'tracking', label: 'Ланцюг відстеження', icon: Target, desc: 'Події з `/supply-chain/tracking`' },
        { id: 'routing', label: 'Маршрутний штаб', icon: Navigation, desc: 'Маршрути з `/supply-chain/routes`' },
        { id: 'ships', label: 'Морські коридори', icon: Ship, desc: 'Похідний зріз по портах і коридорах' },
        { id: 'risks', label: 'Сигнали ризику', icon: ShieldAlert, desc: 'Критичні події та небезпечні маршрути' },
        { id: 'forecasts', label: 'Операційний горизонт', icon: TrendingUp, desc: 'Похідна оцінка з поточних маршрутів' },
    ];

    const renderStatsGrid = () => (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {statsData.items.length > 0 ? (
                statsData.items.map((item) => {
                    const Icon = item.iconKey ? (STAT_ICONS[item.iconKey] ?? Package) : Package;

                    return (
                        <TacticalCard key={item.label} variant="holographic" className="group rounded-[30px] border border-white/10 bg-slate-950/50 p-8">
                            <div className="flex items-center gap-6">
                                <div className={cn('rounded-2xl border border-white/10 bg-white/5 p-4 transition-transform group-hover:scale-110', item.color ?? 'text-cyan-300')}>
                                    <Icon size={28} />
                                </div>
                                <div>
                                    <p className="mb-1 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{item.label}</p>
                                    <h3 className="text-3xl font-black italic tracking-tighter text-white">{item.value}</h3>
                                    <p className="mt-1 text-[11px] font-medium uppercase text-slate-400">{item.sub}</p>
                                </div>
                            </div>
                        </TacticalCard>
                    );
                })
            ) : (
                <EmptyState
                    title="Підтверджені KPI відсутні"
                    description="`/supply-chain/stats` не повернув валідуваних карток, тому глобальні показники не підставляються локально."
                />
            )}
        </div>
    );

    const renderRadarSection = () => (
        <div className="space-y-6">
            <TacticalCard variant="holographic" className="rounded-[32px] border border-white/10 bg-slate-950/55 p-8">
                <PanelTitle
                    icon={Layers}
                    title="Операційне зведення"
                    description="Верхній шар контурів побудований з `tracking.current_status`, `tracking.events`, `routes.routes` і останньої підтвердженої синхронізації."
                />

                <div className="grid gap-4 md:grid-cols-4">
                    {[
                        { label: 'Поточний статус', value: trackingData.currentStatus ?? 'Н/д' },
                        { label: 'ID трекінгу', value: trackingData.trackingId ?? 'Н/д' },
                        { label: 'Орієнтовне прибуття', value: formatDateTime(trackingData.estimatedArrival) },
                        { label: 'Маршрутів високого ризику', value: formatNumber(criticalRoutesCount) },
                    ].map((item) => (
                        <div key={item.label} className="rounded-[24px] border border-white/10 bg-black/25 p-5">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{item.label}</div>
                            <div className="mt-3 text-lg font-black text-white">{item.value}</div>
                        </div>
                    ))}
                </div>
            </TacticalCard>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <TacticalCard variant="cyber" className="rounded-[32px] border border-white/10 bg-slate-950/55 p-8">
                    <PanelTitle
                        icon={Truck}
                        title="Потік подій"
                        description="Останні підтверджені події з `/supply-chain/tracking`. Натисніть на рядок, щоб відкрити деталізацію нижче."
                    />

                    {filteredEvents.length > 0 ? (
                        <div className="space-y-3">
                            {filteredEvents.slice(0, 5).map((event) => {
                                const riskMeta = getRiskMeta(event.riskScore);
                                return (
                                    <button
                                        key={event.id}
                                        type="button"
                                        onClick={() => {
                                            setActiveSection('tracking');
                                            setSelectedEventId(event.id);
                                        }}
                                        className={cn('flex w-full items-center justify-between rounded-[22px] border bg-black/20 px-4 py-4 text-left transition hover:bg-white/[0.03]', riskMeta.border)}
                                    >
                                        <div>
                                            <div className="text-sm font-black text-white">{event.location}</div>
                                            <div className="mt-1 text-xs leading-5 text-slate-400">{event.description}</div>
                                        </div>
                                        <div className="ml-4 text-right">
                                            <Badge className={cn('border px-3 py-1 text-[10px] font-black uppercase', getStatusBadgeClass(event.status))}>
                                                {event.status}
                                            </Badge>
                                            <div className={cn('mt-2 text-[10px] font-black uppercase', riskMeta.tone)}>
                                                {riskMeta.label}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyState
                            title="Події трекінгу відсутні"
                            description="`/supply-chain/tracking` не повернув жодної підтвердженої події. Контур не генерує локальну стрічку пересувань."
                        />
                    )}
                </TacticalCard>

                <TacticalCard variant="cyber" className="rounded-[32px] border border-white/10 bg-slate-950/55 p-8">
                    <PanelTitle
                        icon={Navigation}
                        title="Маршрутний театр"
                        description="Список напрямків, упорядкований за підтвердженим ризиком і надійністю з `/supply-chain/routes`."
                    />

                    {filteredRoutes.length > 0 ? (
                        <div className="space-y-3">
                            {filteredRoutes.slice(0, 4).map((route) => {
                                const riskMeta = getRiskMeta(route.riskScore);
                                return (
                                    <button
                                        key={route.id}
                                        type="button"
                                        onClick={() => {
                                            setActiveSection('routing');
                                            setSelectedRouteId(route.id);
                                        }}
                                        className={cn('w-full rounded-[22px] border bg-black/20 px-4 py-4 text-left transition hover:bg-white/[0.03]', riskMeta.border)}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="text-sm font-black text-white">{route.origin} → {route.destination}</div>
                                                <div className="mt-1 text-xs leading-5 text-slate-400">
                                                    Через: {route.via ?? 'Н/д'} • {route.recommendation ?? 'Без рекомендації'}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={cn('text-sm font-black', riskMeta.tone)}>{formatPercent(route.riskScore)}</div>
                                                <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">ризик</div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyState
                            title="Маршрути не підтверджені"
                            description="`/supply-chain/routes` поки не повернув придатних напрямків. Псевдомаршрути або локальні рекомендації не підставляються."
                        />
                    )}
                </TacticalCard>
            </div>
        </div>
    );

    const renderTrackingSection = () => (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <TacticalCard variant="cyber" className="rounded-[32px] border border-white/10 bg-slate-950/55 p-8">
                <PanelTitle
                    icon={Target}
                    title="Події ланцюга"
                    description="Локальний фільтр працює лише по вже підтверджених рядках `/supply-chain/tracking`."
                />

                {filteredEvents.length > 0 ? (
                    <div className="space-y-3">
                        {filteredEvents.map((event) => {
                            const riskMeta = getRiskMeta(event.riskScore);
                            return (
                                <button
                                    key={event.id}
                                    type="button"
                                    onClick={() => setSelectedEventId(event.id)}
                                    className={cn(
                                        'w-full rounded-[22px] border bg-black/20 px-4 py-4 text-left transition hover:bg-white/[0.03]',
                                        selectedEvent?.id === event.id ? riskMeta.border : 'border-white/10',
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="text-sm font-black text-white">{event.location}</div>
                                            <div className="mt-1 text-xs text-slate-400">{event.description}</div>
                                        </div>
                                        <Badge className={cn('border px-3 py-1 text-[10px] font-black uppercase', getStatusBadgeClass(event.status))}>
                                            {event.status}
                                        </Badge>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                                        <span>{formatDateTime(event.timestamp)}</span>
                                        <span>{formatPercent(event.riskScore)}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <EmptyState
                        title="Подій немає"
                        description="Після появи валідних елементів у `tracking.events` тут зʼявиться ланцюг руху без локальних маршрутних підстановок."
                    />
                )}
            </TacticalCard>

            <TacticalCard variant="holographic" className="rounded-[32px] border border-white/10 bg-slate-950/55 p-8">
                <PanelTitle
                    icon={Fingerprint}
                    title="Картка події"
                    description="Деталізація базується тільки на підтверджених полях події: локація, статус, країна, ризик і митна вартість."
                />

                {selectedEvent ? (
                    <div className="space-y-5">
                        <div className="rounded-[24px] border border-white/10 bg-black/25 p-6">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Локація</div>
                                    <div className="mt-2 text-2xl font-black text-white">{selectedEvent.location}</div>
                                </div>
                                <Badge className={cn('border px-3 py-1 text-[10px] font-black uppercase', getStatusBadgeClass(selectedEvent.status))}>
                                    {selectedEvent.status}
                                </Badge>
                            </div>
                            <p className="mt-4 text-sm leading-6 text-slate-400">{selectedEvent.description}</p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            {[
                                { label: 'Час події', value: formatDateTime(selectedEvent.timestamp) },
                                { label: 'Країна', value: selectedEvent.country ?? 'Н/д' },
                                { label: 'Ризик', value: formatPercent(selectedEvent.riskScore) },
                                { label: 'Митна вартість', value: formatCurrency(selectedEvent.valueUsd) },
                            ].map((item) => (
                                <div key={item.label} className="rounded-[22px] border border-white/10 bg-black/20 p-5">
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{item.label}</div>
                                    <div className="mt-3 text-lg font-black text-white">{item.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <EmptyState
                        title="Подія не обрана"
                        description="Оберіть елемент ланцюга зліва, щоб побачити деталі без synthetic timeline."
                    />
                )}
            </TacticalCard>
        </div>
    );

    const renderRoutingSection = () => (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <TacticalCard variant="cyber" className="rounded-[32px] border border-white/10 bg-slate-950/55 p-8">
                <PanelTitle
                    icon={Navigation}
                    title="Підтверджені маршрути"
                    description="Маршрутний список з реальних відповідей `/supply-chain/routes` без домальованих коридорів."
                />

                {filteredRoutes.length > 0 ? (
                    <div className="space-y-3">
                        {filteredRoutes.map((route) => {
                            const riskMeta = getRiskMeta(route.riskScore);
                            return (
                                <button
                                    key={route.id}
                                    type="button"
                                    onClick={() => setSelectedRouteId(route.id)}
                                    className={cn(
                                        'w-full rounded-[22px] border bg-black/20 px-4 py-4 text-left transition hover:bg-white/[0.03]',
                                        selectedRoute?.id === route.id ? riskMeta.border : 'border-white/10',
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="text-sm font-black text-white">{route.origin} → {route.destination}</div>
                                            <div className="mt-1 text-xs text-slate-400">Через: {route.via ?? 'Н/д'}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className={cn('text-sm font-black', riskMeta.tone)}>{formatPercent(route.reliability)}</div>
                                            <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">надійність</div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <EmptyState
                        title="Маршрутів немає"
                        description="Поки `/supply-chain/routes` не повертає придатних напрямків, штаб не показує штучні рекомендації."
                    />
                )}
            </TacticalCard>

            <TacticalCard variant="holographic" className="rounded-[32px] border border-white/10 bg-slate-950/55 p-8">
                <PanelTitle
                    icon={BarChart3}
                    title="Деталізація маршруту"
                    description="Правий блок показує тільки підтверджені поля `via`, `risk_score`, `reliability`, `transit_time_days`, `cost_per_kg` і `total_value_usd`."
                />

                {selectedRoute ? (
                    <div className="space-y-5">
                        <div className="rounded-[24px] border border-white/10 bg-black/25 p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Маршрут</div>
                                    <div className="mt-2 text-2xl font-black text-white">{selectedRoute.origin} → {selectedRoute.destination}</div>
                                    <div className="mt-3 text-sm text-slate-400">Через: {selectedRoute.via ?? 'Н/д'}</div>
                                </div>
                                <Badge className={cn('border px-3 py-1 text-[10px] font-black uppercase', getRiskMeta(selectedRoute.riskScore).badge)}>
                                    {getRiskMeta(selectedRoute.riskScore).label}
                                </Badge>
                            </div>
                            <p className="mt-4 text-sm leading-6 text-slate-400">{selectedRoute.recommendation ?? 'Рекомендація API відсутня.'}</p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            {[
                                { label: 'Транзит', value: formatDays(selectedRoute.transitTimeDays) },
                                { label: 'Надійність', value: formatPercent(selectedRoute.reliability) },
                                { label: 'Собівартість', value: formatCostPerKg(selectedRoute.costPerKg) },
                                { label: 'Загальна вартість', value: formatCurrency(selectedRoute.totalValueUsd) },
                            ].map((item) => (
                                <div key={item.label} className="rounded-[22px] border border-white/10 bg-black/20 p-5">
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{item.label}</div>
                                    <div className="mt-3 text-lg font-black text-white">{item.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <EmptyState
                        title="Маршрут не обрано"
                        description="Оберіть напрямок зліва, щоб отримати деталізацію реального коридору."
                    />
                )}
            </TacticalCard>
        </div>
    );

    const renderShipsSection = () => (
        <TacticalCard variant="cyber" className="rounded-[32px] border border-white/10 bg-slate-950/55 p-8">
            <PanelTitle
                icon={Ship}
                title="Морські коридори"
                description="Це похідний зріз з `/supply-chain/routes`. Якщо маршрут не містить портового вузла `via`, окремий AIS-обʼєкт тут не вигадується."
            />

            {maritimeCorridors.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {maritimeCorridors.map((route) => {
                        const riskMeta = getRiskMeta(route.riskScore);
                        return (
                            <div key={route.id} className={cn('rounded-[24px] border bg-black/20 p-5', riskMeta.border)}>
                                <div className="flex items-center justify-between gap-3">
                                    <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-3">
                                        <Anchor className="h-5 w-5 text-sky-300" />
                                    </div>
                                    <Badge className={cn('border px-3 py-1 text-[10px] font-black uppercase', riskMeta.badge)}>
                                        {formatPercent(route.riskScore)}
                                    </Badge>
                                </div>
                                <div className="mt-5 text-sm font-black text-white">{route.origin} → {route.destination}</div>
                                <div className="mt-2 text-xs leading-5 text-slate-400">Портовий вузол: {route.via ?? 'Н/д'}</div>
                                <div className="mt-4 grid gap-3">
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-slate-200">
                                        Транзит: {formatDays(route.transitTimeDays)}
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-slate-200">
                                        Надійність: {formatPercent(route.reliability)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <EmptyState
                    title="Окремих морських коридорів немає"
                    description="`/supply-chain/routes` не повернув жодного маршруту з портовим вузлом `via`. Інтерфейс не створює фіктивні AIS-коридори."
                />
            )}
        </TacticalCard>
    );

    const renderRisksSection = () => (
        <TacticalCard variant="cyber" className="rounded-[32px] border border-white/10 bg-slate-950/55 p-8">
            <PanelTitle
                icon={ShieldAlert}
                title="Сигнали ризику"
                description="Агрегація побудована з `tracking.events[].risk_score` і `routes[].risk_score`. Жодних додаткових OSINT-сигналів тут не домальовується."
            />

            {riskSignals.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                    {riskSignals.map((signal) => {
                        const riskMeta = getRiskMeta(signal.score);
                        return (
                            <div key={signal.id} className={cn('rounded-[24px] border bg-black/20 p-5', riskMeta.border)}>
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-black text-white">{signal.title}</div>
                                        <div className="mt-1 text-xs text-slate-400">{signal.source}: {signal.context}</div>
                                    </div>
                                    <Badge className={cn('border px-3 py-1 text-[10px] font-black uppercase', riskMeta.badge)}>
                                        {formatPercent(signal.score)}
                                    </Badge>
                                </div>
                                <p className="mt-4 text-sm leading-6 text-slate-400">{signal.subtitle}</p>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <EmptyState
                    title="Критичних сигналів немає"
                    description="Серед поточних подій і маршрутів не виявлено ризиків вище порогів цього контуру."
                />
            )}
        </TacticalCard>
    );

    const renderForecastSection = () => (
        <TacticalCard variant="holographic" className="rounded-[32px] border border-white/10 bg-slate-950/55 p-8">
            <PanelTitle
                icon={TrendingUp}
                title="Операційний горизонт"
                description="Нижче наведено інференцію з наявних `/supply-chain/routes`, а не окремий ML-прогноз. Розрахунок базується на поточній надійності, транзиті, вартості та загальному обсязі маршрутів."
            />

            {operationalOutlook ? (
                <div className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-4">
                        {[
                            { label: 'Середній транзит', value: formatDays(operationalOutlook.avgTransit) },
                            { label: 'Середня надійність', value: formatPercent(operationalOutlook.avgReliability) },
                            { label: 'Середня собівартість', value: formatCostPerKg(operationalOutlook.avgCost) },
                            { label: 'Сумарна вартість', value: formatCurrency(operationalOutlook.totalValue) },
                        ].map((item) => (
                            <div key={item.label} className="rounded-[22px] border border-white/10 bg-black/20 p-5">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{item.label}</div>
                                <div className="mt-3 text-lg font-black text-white">{item.value}</div>
                            </div>
                        ))}
                    </div>

                    <div className="rounded-[24px] border border-emerald-500/20 bg-emerald-500/10 p-6">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">НАЙКРАЩИЙ КОРИДОР ЗА ПОТОЧНИМИ ДАНИМИ</div>
                        <div className="mt-3 text-2xl font-black text-white">
                            {operationalOutlook.bestRoute ? `${operationalOutlook.bestRoute.origin} → ${operationalOutlook.bestRoute.destination}` : 'Н/д'}
                        </div>
                        <p className="mt-3 text-sm leading-6 text-emerald-100/90">
                            {operationalOutlook.bestRoute
                                ? `Маршрут через ${operationalOutlook.bestRoute.via ?? 'Н/д'} має найкраще співвідношення надійності та ризику серед поточно доступних напрямків.`
                                : 'API не повернув жодного маршруту для інференції.'}
                        </p>
                    </div>
                </div>
            ) : (
                <EmptyState
                    title="Операційний горизонт недоступний"
                    description="Без підтверджених маршрутів немає бази для розрахунку похідного горизонту."
                />
            )}
        </TacticalCard>
    );

    const renderActiveSection = () => {
        if (loading && statsData.items.length === 0 && trackingData.events.length === 0 && routesData.routes.length === 0) {
            return (
                <div className="flex min-h-[420px] items-center justify-center rounded-[32px] border border-white/10 bg-slate-950/55">
                    <div className="flex items-center gap-3 text-slate-300">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-sm font-black uppercase tracking-[0.2em]">Синхронізація контуру</span>
                    </div>
                </div>
            );
        }

        switch (activeSection) {
            case 'tracking':
                return renderTrackingSection();
            case 'routing':
                return renderRoutingSection();
            case 'ships':
                return renderShipsSection();
            case 'risks':
                return renderRisksSection();
            case 'forecasts':
                return renderForecastSection();
            case 'radar':
            default:
                return renderRadarSection();
        }
    };

    return (
        <PageTransition>
            <div className="relative min-h-screen overflow-hidden bg-[#020617] pb-20 text-slate-200">
                <AdvancedBackground />
                <div className="pointer-events-none absolute right-0 top-0 h-[800px] w-[800px] rounded-full bg-cyan-500/5 blur-[150px]" />
                <div className="pointer-events-none absolute bottom-0 left-0 h-[600px] w-[600px] rounded-full bg-amber-500/5 blur-[120px]" />

                <div className="relative z-10 mx-auto max-w-[1700px] px-6 pt-6">
                    <ViewHeader
                        title="ЛАНЦЮГИ ПОСТАЧАННЯ"
                        subtitle="Операційний штаб маршрутизації, трекінгу і ризиків на підтверджених `/supply-chain/*` даних"
                        icon={<TrendingUp size={24} className="text-cyan-300" />}
                        breadcrumbs={['ПРЕДАТОР', 'АНАЛІТИКА', 'ЛАНЦЮГИ']}
                        stats={[
                            { label: 'Маршрутів', value: routesData.routes.length > 0 ? formatNumber(routesData.routes.length) : 'Н/д', icon: <Navigation size={14} />, color: 'primary' },
                            { label: 'Подій трекінгу', value: trackingData.events.length > 0 ? formatNumber(trackingData.events.length) : 'Н/д', icon: <Target size={14} />, color: 'success' },
                            { label: 'Сигналів ризику', value: riskSignals.length > 0 ? formatNumber(riskSignals.length) : '0', icon: <ShieldAlert size={14} />, color: 'danger' },
                        ]}
                        actions={
                            <Button
                                type="button"
                                onClick={() => void loadData(true)}
                                variant="outline"
                                className="gap-2 border-white/10 bg-slate-950/40 text-slate-100 hover:bg-white/5"
                            >
                                {refreshing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                Оновити
                            </Button>
                        }
                    />

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <Badge className="border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-200">
                            Джерела: /supply-chain/stats, /supply-chain/tracking, /supply-chain/routes
                        </Badge>
                        <Badge className="border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-200">
                            Джерело бекенду: {backendStatus.sourceLabel}
                        </Badge>
                        <Badge className="border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-200">
                            {backendStatus.statusLabel}
                        </Badge>
                        <Badge className="border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-200">
                            Синхронізація: {formatDateTime(latestSync)}
                        </Badge>
                    </div>

                    <div className="mt-4">
                        <p className="text-sm leading-6 text-slate-400">
                            {feedback ?? 'Контур показує лише підтверджені KPI, події трекінгу, маршрути та похідні індикатори, явно обчислені з поточних `/supply-chain/*` відповідей.'}
                        </p>
                    </div>

                    <div className="mt-10 space-y-10">
                        {renderStatsGrid()}

                        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
                            <div className="space-y-4">
                                <TacticalCard variant="cyber" className="rounded-[32px] border border-white/10 bg-slate-950/55 p-5">
                                    <div className="mb-4 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">СТРУКТУРА КОНТУРУ</div>
                                    <div className="space-y-2">
                                        {sections.map((section) => (
                                            <button
                                                key={section.id}
                                                type="button"
                                                onClick={() => setActiveSection(section.id)}
                                                className={cn(
                                                    'group flex w-full items-start gap-4 rounded-[24px] border px-4 py-4 text-left transition-all',
                                                    activeSection === section.id
                                                        ? 'border-cyan-500/30 bg-cyan-500/10'
                                                        : 'border-white/10 bg-black/20 hover:bg-white/[0.03]',
                                                )}
                                            >
                                                <div className={cn('rounded-2xl border p-3', activeSection === section.id ? 'border-cyan-500/30 bg-cyan-500 text-black' : 'border-white/10 bg-black/30 text-slate-400')}>
                                                    <section.icon size={18} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-black uppercase tracking-tight text-white">{section.label}</div>
                                                    <div className="mt-1 text-[11px] leading-5 text-slate-500">{section.desc}</div>
                                                </div>
                                                <ChevronRight className={cn('mt-1 h-4 w-4 transition-transform', activeSection === section.id ? 'translate-x-1 text-cyan-300' : 'text-slate-700')} />
                                            </button>
                                        ))}
                                    </div>
                                </TacticalCard>

                                <TacticalCard variant="cyber" className="rounded-[32px] border border-white/10 bg-slate-950/55 p-5">
                                    <div className="mb-4 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">ЛОКАЛЬНИЙ ФІЛЬТР</div>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="text"
                                            value={query}
                                            onChange={(event) => setQuery(event.target.value)}
                                            placeholder="Фільтр за локацією, статусом, країною або маршрутом..."
                                            className="w-full rounded-[20px] border border-white/10 bg-black/25 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 outline-none transition focus:border-cyan-500/30"
                                        />
                                    </div>
                                    <p className="mt-3 text-xs leading-6 text-slate-500">
                                        Фільтр не викликає новий API. Він лише звужує вже підтверджені записи на екрані.
                                    </p>
                                </TacticalCard>

                                <TacticalCard variant="holographic" className="rounded-[32px] border border-amber-500/20 bg-amber-500/10 p-5">
                                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-200">ГОЛОВНИЙ СИГНАЛ</div>
                                    {riskSignals[0] ? (
                                        <>
                                            <div className="mt-3 text-lg font-black text-white">{riskSignals[0].title}</div>
                                            <div className="mt-2 text-sm leading-6 text-amber-100/85">
                                                {riskSignals[0].subtitle}
                                            </div>
                                            <div className="mt-4 flex items-center justify-between text-xs text-amber-100/80">
                                                <span>{riskSignals[0].source}</span>
                                                <span>{formatPercent(riskSignals[0].score)}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="mt-3 text-sm leading-6 text-amber-100/80">
                                            Коли ризикові події зʼявляться в `tracking` або `routes`, тут буде показано найсильніший сигнал.
                                        </p>
                                    )}
                                </TacticalCard>
                            </div>

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeSection}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -16 }}
                                    className="min-h-[720px]"
                                >
                                    {renderActiveSection()}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <div className="fixed bottom-0 left-[260px] right-0 z-50 flex h-10 items-center justify-between border-t border-white/5 bg-slate-950/80 px-8 backdrop-blur-md">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className={cn('h-1.5 w-1.5 rounded-full', backendStatus.isOffline ? 'bg-rose-500' : 'bg-emerald-500')} />
                            <span className={cn('text-[9px] font-black uppercase', backendStatus.isOffline ? 'text-rose-400' : 'text-emerald-400')}>
                                {backendStatus.isOffline ? 'Система: частково недоступна' : 'Система: підтверджене зʼєднання'}
                            </span>
                        </div>
                        <span className="text-[9px] font-mono uppercase text-slate-600">
                            ПОДІЇ: {trackingData.events.length > 0 ? formatNumber(trackingData.events.length) : 'Н/д'}
                        </span>
                        <span className="text-[9px] font-mono uppercase text-slate-600">
                            МАРШРУТИ: {routesData.routes.length > 0 ? formatNumber(routesData.routes.length) : 'Н/д'}
                        </span>
                    </div>

                    <div className="flex items-center gap-6">
                        <span className="text-[9px] font-mono uppercase tracking-widest text-cyan-600">
                            SUPPLY_CHAIN_CONTOUR
                        </span>
                        <span className="text-[9px] font-mono uppercase text-slate-600">
                            ОНОВЛЕНО: {formatDateTime(latestSync)}
                        </span>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}
