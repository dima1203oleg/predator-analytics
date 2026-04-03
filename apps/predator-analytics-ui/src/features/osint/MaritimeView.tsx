/**
 * PREDATOR v56.1.4 | Морський контур — Морський розвідувальний суверен
 *
 * Система глобального моніторингу морського трафіку та оцінки ризиків.
 * - AIS трекінг суден у реальному часі з алгоритмами CERS
 * - Виявлення суден-фантомів та аномальних маршрутів
 * - Оперативні морські показники та геозонування портів
 * - Матриця санкційного скринінгу флоту
 *
 * © 2026 PREDATOR Analytics | Контур морського моніторингу
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Anchor, Ship, Globe, AlertTriangle, Activity,
    Search, RefreshCw, Navigation,
    Wind, Waves, ShieldAlert, Compass, Radar, Droplets, Zap,
    Target, Shield, Eye, Lock, Cpu, Database,
    TrendingUp, Clock, ChevronRight, Filter, X,
    Signal, Satellite, Map
} from 'lucide-react';
import ReactECharts from '@/components/ECharts';
import { apiClient } from '@/services/api/config';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { HoloContainer } from '@/components/HoloContainer';
import { cn } from '@/utils/cn';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import {
    normalizePortsPayload,
    normalizeVesselsPayload,
    type Port,
    type Vessel,
} from './maritimeView.utils';

// ========================
// Допоміжні компоненти
// ========================

const RiskMeter: React.FC<{ score: number; size?: 'sm' | 'md' }> = ({ score, size = 'md' }) => {
    const color = score > 80 ? '#f43f5e' : score > 60 ? '#f59e0b' : score > 40 ? '#3b82f6' : '#10b981';
    const label = score > 80 ? 'КРИТИЧНИЙ' : score > 60 ? 'ПІДВИЩЕНИЙ' : score > 40 ? 'ПОМІРНИЙ' : 'НИЗЬКИЙ';

    return (
        <div className={cn("flex flex-col gap-1.5", size === 'sm' ? 'w-full' : 'w-full')}>
            <div className="flex items-center justify-between">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">РИЗИК_ІНДЕКС</span>
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>{label}</span>
            </div>
            <div className="h-1.5 bg-slate-900/80 rounded-full overflow-hidden border border-white/5">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${color}80, ${color})`, boxShadow: `0 0 8px ${color}50` }}
                />
            </div>
        </div>
    );
};

const VesselCard: React.FC<{ vessel: Vessel; isSelected: boolean; onClick: () => void }> = ({ vessel, isSelected, onClick }) => {
    const riskColor = vessel.risk_score > 80 ? 'rose' : vessel.risk_score > 60 ? 'amber' : vessel.risk_score > 40 ? 'blue' : 'emerald';
    const isPhantom = !vessel.imo || vessel.risk_score > 85;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onClick}
            className={cn(
                "group p-6 rounded-[32px] border cursor-pointer transition-all duration-500 relative overflow-hidden panel-3d",
                isSelected
                    ? "bg-slate-900/80 border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.15)]"
                    : "bg-[#040810]/60 border-white/5 hover:border-white/20 hover:bg-slate-900/40"
            )}
        >
            {/* Фоновий акцент */}
            <div className={cn(
                "absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-700",
                `bg-${riskColor}-500/5`
            )} />

            {isPhantom && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-rose-500/10 border border-rose-500/30 rounded-full text-[8px] font-black text-rose-400 uppercase tracking-widest animate-pulse">
                    ⚠ СУДНО-ФАНТОМ
                </div>
            )}

            <div className="flex items-start justify-between gap-4 mt-2">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "relative w-12 h-12 rounded-[18px] flex items-center justify-center border shadow-2xl transition-transform duration-500 group-hover:scale-110",
                        vessel.risk_score > 80 ? "bg-rose-500/10 border-rose-500/30" : "bg-slate-900/80 border-white/10"
                    )}>
                        {vessel.risk_score > 80 && <div className="absolute inset-0 bg-rose-500/10 rounded-[18px] animate-ping" />}
                        <Ship size={22} className={cn(
                            "relative z-10",
                            vessel.risk_score > 80 ? "text-rose-400" : "text-blue-400"
                        )} />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-base font-black text-white uppercase tracking-tight leading-none group-hover:text-rose-400 transition-colors line-clamp-1">
                            {vessel.name}
                        </h4>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-slate-400 uppercase">{vessel.flag}</span>
                            <span className="text-slate-700">·</span>
                            <span className="text-[9px] text-slate-400 uppercase font-bold">{vessel.type}</span>
                        </div>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">CERS</span>
                    <span className={cn(
                        "text-2xl font-black font-mono drop-shadow-[0_0_8px_currentColor]",
                        vessel.risk_score > 80 ? "text-rose-400" : vessel.risk_score > 60 ? "text-amber-400" : "text-emerald-400"
                    )}>
                        {vessel.risk_score}
                    </span>
                </div>
            </div>

            <div className="mt-4 space-y-3">
                <RiskMeter score={vessel.risk_score} size="sm" />
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2">
                        <Navigation size={10} className="text-slate-400" />
                        <span className="text-[9px] font-bold text-slate-300 uppercase italic truncate max-w-[120px]">
                            {vessel.destination || 'НЕВИЗНАЧЕНО'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {vessel.speed && (
                            <span className="text-[9px] font-mono text-blue-400">{vessel.speed} КВ</span>
                        )}
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            vessel.risk_score > 80 ? "bg-rose-500 animate-ping" : "bg-emerald-500 animate-pulse"
                        )} />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// ========================
// Основний компонент
// ========================

const MaritimeView: React.FC = () => {
    const backendStatus = useBackendStatus();
    const [vessels, setVessels] = useState<Vessel[]>([]);
    const [ports, setPorts] = useState<Port[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<string>('');
    const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
    const [filterMode, setFilterMode] = useState<'all' | 'high_risk' | 'phantom'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [time, setTime] = useState(new Date());
    const [feedback, setFeedback] = useState<string | null>(null);
    const [hasConfirmedData, setHasConfirmedData] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [vesselsRes, portsRes] = await Promise.allSettled([
                apiClient.get('/maritime/vessels'),
                apiClient.get('/maritime/ports'),
            ]);

            if (vesselsRes.status === 'fulfilled') {
                setVessels(normalizeVesselsPayload(vesselsRes.value.data));
            } else {
                setVessels([]);
            }

            if (portsRes.status === 'fulfilled') {
                setPorts(normalizePortsPayload(portsRes.value.data));
            } else {
                setPorts([]);
            }

            const failures = [vesselsRes, portsRes].filter((result) => result.status === 'rejected').length;

            if (failures === 2) {
                setFeedback('Маршрути морського контуру не повернули підтверджених даних. Екран не підмінює їх локальним флотом або портами.');
                setHasConfirmedData(false);
                setLastUpdate('');
            } else if (failures === 1) {
                setFeedback('Один із морських маршрутів тимчасово не відповів. Показано лише підтверджені записи, які вдалося отримати.');
                setHasConfirmedData(true);
                setLastUpdate(new Date().toLocaleTimeString('uk-UA'));
            } else {
                setFeedback(null);
                setHasConfirmedData(true);
                setLastUpdate(new Date().toLocaleTimeString('uk-UA'));
            }
        } catch (err) {
            console.error('Помилка завантаження морських даних:', err);
            setVessels([]);
            setPorts([]);
            setFeedback('Під час синхронізації морського контуру сталася помилка. Демонстраційний резервний флот вимкнено.');
            setHasConfirmedData(false);
            setLastUpdate('');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, [fetchData]);

    useEffect(() => {
        setSelectedVessel((current) => {
            if (!current) {
                return null;
            }

            return vessels.find((vessel) => vessel.id === current.id) ?? null;
        });
    }, [vessels]);

    // Відфільтрований флот
    const filteredVessels = useMemo(() => {
        let list = vessels;
        if (filterMode === 'high_risk') list = list.filter(v => v.risk_score > 70);
        if (filterMode === 'phantom') list = list.filter(v => !v.imo || v.risk_score > 85);
        if (searchQuery) list = list.filter(v =>
            v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.flag.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.destination?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return list.sort((a, b) => b.risk_score - a.risk_score);
    }, [vessels, filterMode, searchQuery]);

    // Підтверджені показники
    const stats = useMemo(() => ({
        total: vessels.length,
        critical: vessels.filter(v => v.risk_score > 80).length,
        phantoms: vessels.filter(v => !v.imo || v.risk_score > 85).length,
        ports: ports.length,
    }), [vessels, ports]);

    const operationalMetrics = useMemo(() => {
        const averageRisk = vessels.length > 0
            ? Math.round(vessels.reduce((sum, vessel) => sum + vessel.risk_score, 0) / vessels.length)
            : null;

        return [
            {
                label: 'СЕРЕДНІЙ РИЗИК',
                value: averageRisk != null ? `${averageRisk}%` : 'Н/д',
                color: 'text-rose-400',
                icon: ShieldAlert,
            },
            {
                label: 'БЕЗ IMO',
                value: hasConfirmedData ? `${vessels.filter((vessel) => !vessel.imo).length}` : 'Н/д',
                color: 'text-amber-400',
                icon: Eye,
            },
            {
                label: 'КРИТИЧНІ ПОРТИ',
                value: hasConfirmedData ? `${ports.filter((port) => port.risk_level.toLowerCase().includes('critical')).length}` : 'Н/д',
                color: 'text-indigo-400',
                icon: Anchor,
            },
            {
                label: 'ВИДИМІ МАРШРУТИ',
                value: hasConfirmedData ? `${vessels.filter((vessel) => vessel.destination && vessel.destination !== 'Н/д').length}` : 'Н/д',
                color: 'text-blue-400',
                icon: Navigation,
            },
        ];
    }, [hasConfirmedData, ports, vessels]);

    // Параметри карти
    const mapOptions = useMemo(() => ({
        backgroundColor: 'transparent',
        geo: {
            map: 'world',
            roam: true,
            emphasis: {
                label: { show: false },
                itemStyle: { areaColor: '#1a2235' }
            },
            itemStyle: {
                areaColor: 'rgba(8, 15, 32, 0.95)',
                borderColor: 'rgba(14, 165, 233, 0.15)',
                borderWidth: 1,
                shadowBlur: 20,
                shadowColor: 'rgba(0,0,0,0.8)'
            }
        },
        series: [
            {
                name: 'Судна',
                type: 'effectScatter',
                coordinateSystem: 'geo',
                data: filteredVessels.map(v => ({
                    name: v.name,
                    value: [v.location.lon, v.location.lat, v.risk_score],
                    itemStyle: {
                        color: v.risk_score > 80 ? '#f43f5e' : v.risk_score > 60 ? '#f59e0b' : '#10b981',
                        shadowBlur: 15,
                        shadowColor: v.risk_score > 80 ? 'rgba(244,63,94,0.5)' : 'rgba(16,185,129,0.3)',
                    }
                })),
                symbolSize: (val: [number, number, number]) => 8 + (val[2] / 12),
                rippleEffect: {
                    brushType: 'stroke',
                    scale: 3.5,
                    period: 3
                },
                label: { show: false },
                zlevel: 2,
            },
            {
                name: 'Порти',
                type: 'effectScatter',
                coordinateSystem: 'geo',
                data: ports.map(p => ({
                    name: p.name,
                    value: [p.location.lon, p.location.lat, p.vessel_count],
                    itemStyle: {
                        color: '#38bdf8',
                        shadowBlur: 10,
                        shadowColor: 'rgba(56,189,248,0.4)'
                    }
                })),
                symbol: 'diamond',
                symbolSize: 12,
                rippleEffect: {
                    brushType: 'fill',
                    scale: 2,
                    period: 5
                },
                label: { show: false },
                zlevel: 3,
            },
            {
                name: 'Маршрути',
                type: 'lines',
                coordinateSystem: 'geo',
                zlevel: 1,
                effect: {
                    show: true,
                    period: 5,
                    trailLength: 0.6,
                    color: '#38bdf8',
                    symbolSize: 4
                },
                lineStyle: {
                    color: '#38bdf8',
                    width: 0.3,
                    curveness: 0.3,
                    opacity: 0.15
                },
                data: filteredVessels.filter(v => v.risk_score > 60).slice(0, 8).map(v => ({
                    coords: [
                        [v.location.lon, v.location.lat],
                        [30.7233, 46.4825] // Одеса
                    ]
                }))
            }
        ],
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(2, 6, 23, 0.95)',
            borderColor: 'rgba(56, 189, 248, 0.2)',
            borderWidth: 1,
            textStyle: { color: '#f8fafc', fontFamily: 'monospace', fontSize: 11 },
            formatter: (params: { name: string; value: [number, number, number] }) => `
                <div style="padding:10px 14px;line-height:1.8">
                    <div style="color:#38bdf8;font-weight:900;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px">${params.name}</div>
                    <div style="opacity:0.7;font-size:10px">ІНДЕКС_РИЗИКУ: <span style="color:${params.value[2] > 70 ? '#f43f5e' : '#10b981'};font-weight:900">${params.value[2]}%</span></div>
                    <div style="opacity:0.5;font-size:9px;margin-top:4px">LAT: ${params.value[1]?.toFixed(4)} | LON: ${params.value[0]?.toFixed(4)}</div>
                </div>
            `
        }
    }), [filteredVessels, ports]);

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#02040a] text-slate-200 relative overflow-hidden font-sans pb-40">
                <AdvancedBackground />
                <CyberGrid color="rgba(14, 165, 233, 0.04)" />

                <div className="relative z-10 max-w-[1800px] mx-auto p-4 sm:p-8 lg:p-12 space-y-10">

                    {/* ── ЗАГОЛОВОК ── */}
                    <motion.div
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative bg-blue-500/5 border border-blue-500/10 rounded-[60px] p-10 overflow-hidden backdrop-blur-3xl shadow-2xl"
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_50%,rgba(14,165,233,0.12),transparent_60%)]" />
                        <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none">
                            <Ship size={400} className="text-blue-400" />
                        </div>

                        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-8">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-500/30 blur-[40px] rounded-full animate-pulse" />
                                    <div className="relative w-20 h-20 bg-slate-950 border border-blue-500/30 rounded-[24px] flex items-center justify-center shadow-2xl panel-3d">
                                        <Satellite size={36} className="text-blue-400 drop-shadow-[0_0_12px_rgba(14,165,233,0.8)]" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2.5 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                            <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.4em]">МОРСЬКИЙ_КОНТУР_v56.1.4</span>
                                        </div>
                                        <Badge className={cn(
                                            'border text-[8px] font-black',
                                            hasConfirmedData
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : 'bg-slate-900/70 text-slate-300 border-white/10'
                                        )}>
                                            {hasConfirmedData ? 'ПІДТВЕРДЖЕНО' : 'Н/Д'}
                                        </Badge>
                                    </div>
                                    <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none skew-x-[-3deg]">
                                        МОРСЬКИЙ <span className="text-blue-400 drop-shadow-[0_0_20px_rgba(14,165,233,0.5)]">СУВЕРЕН</span>
                                    </h1>
                                    <p className="text-[10px] font-mono text-slate-300 uppercase tracking-[0.3em]">
                                        КОНТУР МОРСЬКОГО МОНІТОРИНГУ · PRED-NAV-v56.1.4
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                {/* Годинник */}
                                <div className="text-right space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ОПЕРАТИВНИЙ_ЧАС</p>
                                    <p className="text-2xl font-black font-mono text-blue-400 tracking-tight">{time.toLocaleTimeString('uk-UA')}</p>
                                    <p className="text-[9px] font-mono text-slate-400">{time.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                </div>
                                <div className="w-px h-16 bg-white/10" />
                                {/* Стан синхронізації */}
                                <div className="text-right space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">СИНХРОНІЗАЦІЯ</p>
                                    <div className="flex items-center gap-2 justify-end">
                                        <div className={cn('w-2 h-2 rounded-full', hasConfirmedData ? 'bg-emerald-500 animate-ping' : 'bg-slate-600')} />
                                        <span className={cn('text-sm font-black font-mono', hasConfirmedData ? 'text-emerald-400' : 'text-slate-400')}>
                                            {lastUpdate || 'Н/д'}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={fetchData}
                                    className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 hover:bg-blue-500 hover:text-white transition-all shadow-xl group"
                                >
                                    <RefreshCw size={24} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'} />
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    <div className="flex flex-wrap items-center gap-3 px-2">
                        <Badge className={cn(
                            'border px-4 py-2 text-[11px] font-bold',
                            backendStatus.isOffline
                                ? 'border-rose-500/20 bg-rose-500/10 text-rose-100'
                                : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100'
                        )}>
                            {backendStatus.statusLabel}
                        </Badge>
                        <Badge className="border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold text-slate-200">
                            Джерела: /maritime/vessels, /maritime/ports
                        </Badge>
                        <Badge className="border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold text-slate-200">
                            Джерело бекенду: {backendStatus.sourceLabel}
                        </Badge>
                    </div>

                    {feedback && (
                        <div className="rounded-[28px] border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm leading-6 text-rose-100">
                            {feedback}
                        </div>
                    )}

                    {/* ── КЛЮЧОВІ ПОКАЗНИКИ ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'АКТИВНІ_СУДНА', value: hasConfirmedData ? stats.total : 'Н/д', sub: hasConfirmedData ? 'Підтверджений AIS-потік' : 'Маршрут не підтверджено', icon: Ship, color: 'blue', glow: 'rgba(14,165,233,0.2)' },
                            { label: 'КРИТИЧНИЙ_РИЗИК', value: hasConfirmedData ? stats.critical : 'Н/д', sub: hasConfirmedData ? 'CERS > 80' : 'Немає підтверджених суден', icon: ShieldAlert, color: 'rose', glow: 'rgba(244,63,94,0.2)', alert: hasConfirmedData && stats.critical > 0 },
                            { label: 'СУДНА_ФАНТОМИ', value: hasConfirmedData ? stats.phantoms : 'Н/д', sub: hasConfirmedData ? 'Без IMO або з критичним ризиком' : 'Маршрут не підтверджено', icon: Eye, color: 'amber', glow: 'rgba(245,158,11,0.2)' },
                            { label: 'ПОРТИ_МОНІТОРИНГ', value: hasConfirmedData ? stats.ports : 'Н/д', sub: hasConfirmedData ? 'Підтверджені вузли' : 'Маршрут не підтверджено', icon: Anchor, color: 'emerald', glow: 'rgba(16,185,129,0.2)' },
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                                className={cn(
                                    "relative p-8 rounded-[40px] border overflow-hidden panel-3d group",
                                    stat.alert ? "bg-rose-500/5 border-rose-500/30 animate-pulse" : "bg-slate-900/20 border-white/5"
                                )}
                            >
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                                    style={{ background: `radial-gradient(circle at 80% 20%, ${stat.glow}, transparent 60%)` }} />
                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border shadow-2xl")
                                    + ` bg-${stat.color}-500/10 border-${stat.color}-500/20`}>
                                    <stat.icon size={26} className={`text-${stat.color}-400`} />
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                                <p className={`text-4xl font-black font-mono tracking-tighter text-${stat.color}-400 drop-shadow-[0_0_10px_currentColor]`}>
                                    {stat.value}
                                </p>
                                <p className="text-[9px] text-slate-400 font-mono italic mt-1">{stat.sub}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* ── ОСНОВНА СІТКА ── */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">

                        {/* ЛІВА ПАНЕЛЬ — флот */}
                        <div className="xl:col-span-4 space-y-6">

                            {/* Фільтри та пошук */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    {(['all', 'high_risk', 'phantom'] as const).map((mode) => (
                                        <button
                                            key={mode}
                                            onClick={() => setFilterMode(mode)}
                                            className={cn(
                                                "flex-1 py-3 rounded-[20px] text-[9px] font-black uppercase tracking-widest transition-all border",
                                                filterMode === mode
                                                    ? mode === 'high_risk' ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                                                        : mode === 'phantom' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                                                            : 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                                                    : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200'
                                            )}
                                        >
                                            {mode === 'all' ? 'ВСІ' : mode === 'high_risk' ? 'РИЗИК' : 'ФАНТОМИ'}
                                        </button>
                                    ))}
                                </div>
                                <div className="relative">
                                    <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="ПОШУК СУДНА, ПРАПОРА, ПОРТУ..."
                                        className="w-full bg-slate-950/40 border border-white/5 rounded-[24px] py-4 pl-12 pr-5 text-sm font-black text-white focus:outline-none focus:ring-1 focus:ring-blue-500/30 placeholder:text-slate-800 uppercase italic text-[11px] tracking-wider"
                                    />
                                </div>
                            </div>

                            {/* Список суден */}
                            <div className="space-y-4 max-h-[700px] overflow-y-auto no-scrollbar pr-1">
                                <AnimatePresence mode="popLayout">
                                    {loading ? (
                                        [...Array(4)].map((_, i) => (
                                            <div key={i} className="h-36 bg-slate-900/20 rounded-[32px] border border-white/5 animate-pulse" />
                                        ))
                                    ) : filteredVessels.length === 0 ? (
                                        <div className="py-20 text-center">
                                            <Ship size={40} className="text-slate-800 mx-auto mb-4" />
                                            <p className="text-slate-400 font-black uppercase text-sm tracking-widest">
                                                {hasConfirmedData ? 'СУДЕН НЕ ВИЯВЛЕНО' : 'НЕМАЄ ПІДТВЕРДЖЕНИХ ДАНИХ'}
                                            </p>
                                            {!hasConfirmedData && (
                                                <p className="mt-3 max-w-xl mx-auto text-sm leading-6 text-slate-500">
                                                    Екран не підставляє локальний флот або порти, якщо морські маршрути не повернули відповіді.
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        filteredVessels.map(vessel => (
                                            <VesselCard
                                                key={vessel.id}
                                                vessel={vessel}
                                                isSelected={selectedVessel?.id === vessel.id}
                                                onClick={() => setSelectedVessel(prev => prev?.id === vessel.id ? null : vessel)}
                                            />
                                        ))
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* ПРАВА ПАНЕЛЬ — карта і деталі */}
                        <div className="xl:col-span-8 space-y-8">

                            {/* Карта */}
                            <HoloContainer className="p-0 h-[520px] relative overflow-hidden">
                                {/* Сканувальний шар */}
                                <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                                    <motion.div
                                        animate={{ top: ['0%', '100%', '0%'] }}
                                        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                                        className="absolute left-0 right-0 h-32 bg-gradient-to-b from-transparent via-blue-500/4 to-transparent"
                                    />
                                    {/* Кутові маркери */}
                                    {[['top-0 left-0', 'top-6 left-6'], ['top-0 right-0', 'top-6 right-6'], ['bottom-0 left-0', 'bottom-6 left-6'], ['bottom-0 right-0', 'bottom-6 right-6']].map(([outer, inner], idx) => (
                                        <div key={idx} className={`absolute ${outer} w-10 h-10 pointer-events-none`}>
                                            <div className={`absolute ${inner.split(' ').slice(1).join(' ')} w-6 h-6 border-blue-500/40`}
                                                style={{
                                                    borderTopWidth: idx < 2 ? '2px' : 0,
                                                    borderBottomWidth: idx >= 2 ? '2px' : 0,
                                                    borderLeftWidth: idx % 2 === 0 ? '2px' : 0,
                                                    borderRightWidth: idx % 2 === 1 ? '2px' : 0
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Шапка карти */}
                                <div className="absolute top-0 inset-x-0 z-30 p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4 bg-black/60 backdrop-blur-xl rounded-2xl px-6 py-3 border border-white/5">
                                        <Radar size={18} className="text-blue-400 animate-spin-slow" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">ВЕКТОРНИЙ ПЛАН АКВАТОРІЙ</span>
                                        <Badge className={cn(
                                            'font-black text-[8px] border-none',
                                            hasConfirmedData ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-200'
                                        )}>
                                            {hasConfirmedData ? 'ПІДТВЕРДЖЕНО' : 'Н/Д'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-black/60 backdrop-blur-xl border border-white/5 rounded-2xl px-5 py-2.5 flex items-center gap-3">
                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">СУДЕН У ВИДАЧІ</span>
                                            <span className="text-[10px] font-mono text-blue-400 font-black">{hasConfirmedData ? filteredVessels.length : 'Н/д'}</span>
                                        </div>
                                    </div>
                                </div>

                                <ReactECharts option={mapOptions} style={{ height: '100%', width: '100%' }} />

                                {/* Легенда */}
                                <div className="absolute bottom-6 right-6 z-30 bg-black/70 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 space-y-2.5">
                                    {[
                                        { color: '#f43f5e', label: 'КРИТИЧНИЙ РИЗИК' },
                                        { color: '#f59e0b', label: 'ПІДВИЩЕНИЙ РИЗИК' },
                                        { color: '#10b981', label: 'НИЗЬКИЙ РИЗИК' },
                                        { color: '#38bdf8', label: 'ПОРТ (МОНІТОРИНГ)' },
                                    ].map(({ color, label }) => (
                                        <div key={label} className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}60` }} />
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </HoloContainer>

                            {/* Панель деталей судна */}
                            <AnimatePresence mode="wait">
                                {selectedVessel ? (
                                    <motion.div
                                        key={selectedVessel.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="p-10 bg-slate-900/40 border border-blue-500/20 rounded-[48px] backdrop-blur-3xl relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(14,165,233,0.08),transparent_50%)]" />

                                        <div className="relative z-10 flex items-start justify-between mb-8">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[8px] font-black tracking-widest">ДОСЬЄ_СУДНА</Badge>
                                                    {selectedVessel.risk_score > 80 && (
                                                        <Badge className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[8px] font-black animate-pulse">⚠ КРИТИЧНИЙ</Badge>
                                                    )}
                                                </div>
                                                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                                                    {selectedVessel.name}
                                                </h3>
                                            </div>
                                            <button
                                                onClick={() => setSelectedVessel(null)}
                                                className="p-3 bg-white/5 hover:bg-rose-500 hover:text-white text-slate-400 rounded-2xl transition-all"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                                            {[
                                                { label: 'ПРАПОР', value: selectedVessel.flag, icon: Globe },
                                                { label: 'ТИП', value: selectedVessel.type, icon: Ship },
                                                { label: 'ПРИЗНАЧЕННЯ', value: selectedVessel.destination || 'Невизначено', icon: Navigation },
                                                { label: 'КООРДИНАТИ', value: `${selectedVessel.location.lat.toFixed(2)}°N`, icon: Compass },
                                                { label: 'MMSI', value: selectedVessel.mmsi || 'Н/д', icon: Signal },
                                                { label: 'IMO', value: selectedVessel.imo || '⚠ ВІДСУТНІЙ', icon: Database },
                                                { label: 'ШВИДКІСТЬ', value: selectedVessel.speed ? `${selectedVessel.speed} кв.` : 'Н/д', icon: TrendingUp },
                                                { label: 'CERS_ІНДЕКС', value: `${selectedVessel.risk_score}%`, icon: Shield },
                                            ].map(({ label, value, icon: Icon }, i) => (
                                                <div key={i} className="p-5 bg-black/40 rounded-[24px] border border-white/5 space-y-2 panel-3d">
                                                    <div className="flex items-center gap-2">
                                                        <Icon size={12} className="text-blue-400/60" />
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
                                                    </div>
                                                    <p className={cn(
                                                        "text-sm font-black uppercase tracking-tight",
                                                        label === 'CERS_ІНДЕКС' && selectedVessel.risk_score > 80 ? "text-rose-400" :
                                                            label === 'IMO' && value.includes('ВІДСУТНІЙ') ? "text-amber-400" : "text-white"
                                                    )}>{value}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-white/5 relative z-10">
                                            <RiskMeter score={selectedVessel.risk_score} />
                                        </div>

                                        <div className="mt-8 flex gap-4 relative z-10">
                                            <button className="flex-1 py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-[24px] uppercase tracking-[0.2em] text-[11px] transition-all shadow-2xl shadow-blue-900/40 flex items-center justify-center gap-3">
                                                <Eye size={18} /> ВІДКРИТИ ПОВНЕ ДОСЬЄ
                                            </button>
                                            <button className="flex-1 py-5 bg-slate-900 border border-white/10 hover:bg-white/10 text-white font-black rounded-[24px] uppercase tracking-[0.2em] text-[11px] transition-all flex items-center justify-center gap-3">
                                                <Shield size={18} /> ЗАПИТ САНКЦІЙ
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    /* Сітка портів */
                                    <motion.div
                                        key="ports"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                                    >
                                        <div className="md:col-span-2 flex items-center gap-4 px-2">
                                            <Anchor size={18} className="text-indigo-400" />
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">ПОРТОВА_ГЕО_ІНФРАСТРУКТУРА</h3>
                                            <div className="flex-1 h-px bg-white/5" />
                                        </div>
                                        {ports.map(port => (
                                            <div key={port.id} className="p-8 bg-slate-900/20 border border-white/5 rounded-[36px] flex items-center justify-between group hover:border-indigo-500/30 transition-all panel-3d">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <Globe size={26} className="text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-black text-white uppercase tracking-tight">{port.name}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Map size={10} className="text-slate-400" />
                                                            <span className="text-[9px] font-mono text-slate-300 uppercase">{port.country}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">ЗАВАНТАЖЕНІСТЬ</span>
                                                    <span className="text-xl font-black font-mono text-indigo-400">{port.vessel_count}/{port.capacity}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Оперативні морські показники */}
                            <div className="p-8 bg-slate-900/20 border border-white/5 rounded-[40px] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Wind size={150} className="text-indigo-400" />
                                </div>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3 bg-indigo-500/10 rounded-xl">
                                        <Wind size={20} className="text-indigo-400" />
                                    </div>
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">ОПЕРАТИВНІ_МОРСЬКІ_ПОКАЗНИКИ</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                                    {operationalMetrics.map(({ label, value, color, icon: Icon }) => (
                                        <div key={label} className="flex items-center gap-4 p-5 bg-black/30 rounded-[24px] border border-white/5 group/m hover:border-white/10 transition-all">
                                            <Icon size={18} className={cn(color, "opacity-60 group-hover/m:opacity-100 transition-opacity")} />
                                            <div>
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">{label}</span>
                                                <span className={cn("text-lg font-black font-mono", color)}>{value}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    .panel-3d { transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                    .panel-3d:hover { transform: translateY(-8px) rotateX(0.5deg); box-shadow: 0 30px 60px -15px rgba(0,0,0,0.8), 0 0 30px rgba(14,165,233,0.06); }
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .animate-spin-slow { animation: spin 10s linear infinite; }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                `}} />
            </div>
        </PageTransition>
    );
};

export default MaritimeView;
