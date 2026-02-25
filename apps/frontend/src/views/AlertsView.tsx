import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, BellRing, Filter, RefreshCw, CheckCircle2, Clock,
    AlertTriangle, XCircle, Brain, Building, Network, Eye,
    TrendingUp, Layers, Activity, Zap, ChevronDown, ChevronRight
} from 'lucide-react';
import { api } from '../services/api';

interface Alert {
    alert_id: string;
    type: string;
    entity: string;
    probability: number;
    layer: string;
    dataset: number;
    created_at: string;
    status: 'active' | 'acknowledged' | 'resolved';
}

interface LayerStatus {
    datasets: string;
    status: string;
    last_run: string;
    entities_profiled?: number;
    posts_analyzed?: number;
    connections_mapped?: number;
    gaps_detected?: number;
    total_gap_uah?: number;
    active_alerts?: number;
    avg_confidence?: number;
}

interface NerveLayers {
    nerve_system_version: string;
    layers: Record<string, LayerStatus>;
    cers_formula: string;
    nerve_monitor_interval_seconds: number;
}

const LAYER_META: Record<string, { label: string; icon: React.FC<any>; color: string }> = {
    behavioral: { label: 'Behavioral', icon: Brain, color: '#3b82f6' },
    institutional: { label: 'Institutional', icon: Building, color: '#f59e0b' },
    influence: { label: 'Influence', icon: Network, color: '#a855f7' },
    structural: { label: 'Structural', icon: Eye, color: '#ef4444' },
    predictive: { label: 'Predictive', icon: TrendingUp, color: '#10b981' },
};

const STATUS_STYLE: Record<string, string> = {
    active: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    acknowledged: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    resolved: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
};

const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
    if (status === 'active') return <BellRing size={12} className="text-rose-400" />;
    if (status === 'acknowledged') return <Clock size={12} className="text-amber-400" />;
    return <CheckCircle2 size={12} className="text-emerald-400" />;
};

const AlertsView: React.FC = () => {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [layers, setLayers] = useState<NerveLayers | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [newCount, setNewCount] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [alertData, layerData] = await Promise.all([
                api.nerve.getRecentAlerts(50),
                api.nerve.getLayersStatus(),
            ]);
            setAlerts(prev => {
                const prevIds = new Set(prev.map((a: Alert) => a.alert_id));
                const incoming = alertData.alerts as Alert[];
                const diff = incoming.filter((a: Alert) => !prevIds.has(a.alert_id)).length;
                if (silent && diff > 0) setNewCount(n => n + diff);
                return incoming;
            });
            setLayers(layerData);
            setLastRefresh(new Date());
        } catch (e) {
            console.error('Alerts fetch failed', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (autoRefresh) {
            intervalRef.current = setInterval(() => fetchData(true), 30_000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [autoRefresh, fetchData]);

    const filtered = alerts.filter(a => {
        const layerOk = filter === 'all' || a.layer === filter;
        const statusOk = statusFilter === 'all' || a.status === statusFilter;
        return layerOk && statusOk;
    });

    const activeCount = alerts.filter(a => a.status === 'active').length;

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-24 w-full max-w-[1700px] mx-auto relative z-10">

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-1 flex items-center gap-2">
                        <div className="w-4 h-px bg-slate-700" />
                        PREDATOR V25 · PREDICTIVE ALERTS · LAYER 5
                    </div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        Алерти
                        {activeCount > 0 && (
                            <span className="px-2.5 py-0.5 bg-rose-500/20 border border-rose-500/40 rounded-full text-rose-400 text-sm font-black animate-pulse">
                                {activeCount}
                            </span>
                        )}
                    </h1>
                    <p className="text-[11px] text-slate-500 font-mono mt-1">
                        Datasets 181–200 · Auto-refresh {autoRefresh ? '30s' : 'paused'} · {lastRefresh.toLocaleTimeString('uk-UA')}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {newCount > 0 && (
                        <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            onClick={() => { setNewCount(0); fetchData(); }}
                            className="px-3 py-2 bg-rose-500/20 border border-rose-500/40 rounded-xl text-[9px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1"
                        >
                            <Bell size={11} /> +{newCount} нових
                        </motion.button>
                    )}
                    <button
                        onClick={() => setAutoRefresh(v => !v)}
                        className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${autoRefresh
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                : 'bg-slate-900 border-white/10 text-slate-500'
                            }`}
                    >
                        <Activity size={12} />
                        {autoRefresh ? 'LIVE' : 'PAUSED'}
                    </button>
                    <button
                        onClick={() => fetchData()}
                        disabled={loading}
                        className="p-2.5 bg-slate-900 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:border-white/20 transition-all"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Layers Status Strip */}
            {layers && (
                <div className="grid grid-cols-5 gap-3">
                    {Object.entries(layers.layers).map(([key, layer]) => {
                        const meta = LAYER_META[key];
                        if (!meta) return null;
                        const Icon = meta.icon;
                        return (
                            <div
                                key={key}
                                className="p-4 rounded-[20px] border border-white/5 bg-black/30 flex flex-col gap-2"
                                style={{ borderColor: `${meta.color}20` }}
                            >
                                <div className="flex items-center justify-between">
                                    <Icon size={14} style={{ color: meta.color }} />
                                    <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                                        {layer.status}
                                    </span>
                                </div>
                                <div className="text-[10px] font-black text-white uppercase tracking-wide">{meta.label}</div>
                                <div className="text-[8px] text-slate-600 font-mono">{layer.datasets}</div>
                                {layer.active_alerts !== undefined && (
                                    <div className="text-[9px] font-mono" style={{ color: meta.color }}>
                                        {layer.active_alerts} alerts
                                    </div>
                                )}
                                {layer.gaps_detected !== undefined && (
                                    <div className="text-[9px] font-mono" style={{ color: meta.color }}>
                                        {layer.gaps_detected} gaps · ₴{((layer.total_gap_uah ?? 0) / 1_000_000).toFixed(1)}M
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center">
                <div className="flex items-center gap-1 p-1 bg-slate-950/50 border border-white/5 rounded-xl">
                    {[
                        { id: 'all', label: 'Всі шари' },
                        ...Object.entries(LAYER_META).map(([k, v]) => ({ id: k, label: v.label }))
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setFilter(item.id)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filter === item.id
                                    ? 'bg-slate-800 text-white border border-white/10'
                                    : 'text-slate-600 hover:text-slate-400'
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-950/50 border border-white/5 rounded-xl">
                    {[
                        { id: 'all', label: 'Всі' },
                        { id: 'active', label: '🔴 Active' },
                        { id: 'acknowledged', label: '🟡 Ack' },
                        { id: 'resolved', label: '✅ Done' },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setStatusFilter(item.id)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === item.id
                                    ? 'bg-slate-800 text-white border border-white/10'
                                    : 'text-slate-600 hover:text-slate-400'
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="ml-auto text-[9px] text-slate-600 font-mono">
                    {filtered.length} / {alerts.length} алертів
                </div>
            </div>

            {/* Alerts List */}
            <div className="space-y-2">
                <AnimatePresence initial={false}>
                    {filtered.map((alert, i) => {
                        const meta = LAYER_META[alert.layer] ?? { label: alert.layer, icon: Zap, color: '#64748b' };
                        const Icon = meta.icon;
                        const isExpanded = expandedId === alert.alert_id;
                        const probPct = Math.round(alert.probability * 100);
                        const probColor = alert.probability > 0.7 ? '#ef4444'
                            : alert.probability > 0.5 ? '#f97316'
                                : alert.probability > 0.3 ? '#f59e0b'
                                    : '#10b981';

                        return (
                            <motion.div
                                key={alert.alert_id}
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ delay: i * 0.03 }}
                                onClick={() => setExpandedId(isExpanded ? null : alert.alert_id)}
                                className={`cursor-pointer rounded-2xl border transition-all duration-200 overflow-hidden ${isExpanded
                                        ? 'border-white/15 bg-slate-900/80'
                                        : 'border-white/5 bg-black/30 hover:border-white/10 hover:bg-black/50'
                                    }`}
                            >
                                {/* Main row */}
                                <div className="flex items-center gap-4 p-4">
                                    {/* Layer icon */}
                                    <div
                                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}30` }}
                                    >
                                        <Icon size={16} style={{ color: meta.color }} />
                                    </div>

                                    {/* Alert type + entity */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[11px] font-black text-white uppercase tracking-wide">
                                                {alert.type.replace(/_/g, ' ')}
                                            </span>
                                            <span
                                                className="text-[8px] font-mono px-1.5 py-0.5 rounded border"
                                                style={{ color: meta.color, borderColor: `${meta.color}30`, background: `${meta.color}10` }}
                                            >
                                                DS #{alert.dataset}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                                            {alert.entity}
                                        </div>
                                    </div>

                                    {/* Probability bar */}
                                    <div className="w-24 flex-shrink-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[7px] text-slate-600 font-mono">PROB</span>
                                            <span className="text-[9px] font-black font-mono" style={{ color: probColor }}>
                                                {probPct}%
                                            </span>
                                        </div>
                                        <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{ width: `${probPct}%`, background: probColor }}
                                            />
                                        </div>
                                    </div>

                                    {/* Status badge */}
                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest flex-shrink-0 ${STATUS_STYLE[alert.status]}`}>
                                        <StatusIcon status={alert.status} />
                                        {alert.status}
                                    </div>

                                    {/* Time */}
                                    <div className="text-[8px] text-slate-600 font-mono flex-shrink-0 w-16 text-right">
                                        {new Date(alert.created_at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                                    </div>

                                    {/* Expand chevron */}
                                    <ChevronDown
                                        size={14}
                                        className={`text-slate-700 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                    />
                                </div>

                                {/* Expanded detail */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-white/5 overflow-hidden"
                                        >
                                            <div className="p-4 grid grid-cols-3 gap-4">
                                                {[
                                                    { label: 'Alert ID', value: alert.alert_id, mono: true },
                                                    { label: 'Layer', value: meta.label },
                                                    { label: 'Dataset', value: `#${alert.dataset}` },
                                                    { label: 'Entity', value: alert.entity, mono: true },
                                                    { label: 'Probability', value: `${probPct}%`, color: probColor },
                                                    { label: 'Detected', value: new Date(alert.created_at).toLocaleString('uk-UA') },
                                                ].map(field => (
                                                    <div key={field.label}>
                                                        <div className="text-[7px] text-slate-600 font-mono uppercase tracking-widest mb-0.5">{field.label}</div>
                                                        <div
                                                            className={`text-[10px] font-black ${field.mono ? 'font-mono' : ''}`}
                                                            style={{ color: field.color ?? '#94a3b8' }}
                                                        >
                                                            {field.value}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Actions */}
                                            <div className="px-4 pb-4 flex gap-2">
                                                <button className="px-4 py-1.5 bg-blue-600/20 border border-blue-500/30 round rounded-xl text-[9px] font-black text-blue-400 hover:bg-blue-600/30 transition-all uppercase tracking-widest">
                                                    → Відкрити профіль
                                                </button>
                                                {alert.status === 'active' && (
                                                    <button className="px-4 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-xl text-[9px] font-black text-amber-400 hover:bg-amber-500/25 transition-all uppercase tracking-widest">
                                                        ✓ Підтвердити
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {filtered.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center">
                            <CheckCircle2 size={28} className="text-emerald-500/50" />
                        </div>
                        <div className="text-slate-600 font-black uppercase text-sm tracking-wide">Немає алертів</div>
                        <div className="text-slate-700 font-mono text-xs">Система чиста по вибраних фільтрах</div>
                    </div>
                )}
            </div>

            {/* CERS Formula footer */}
            {layers && (
                <div className="flex items-center justify-center gap-3 text-[8px] font-mono text-slate-700 pt-4 border-t border-white/5">
                    <Layers size={10} />
                    <span>{layers.cers_formula}</span>
                    <span>·</span>
                    <span>Nerve v{layers.nerve_system_version}</span>
                    <span>·</span>
                    <span>Interval {layers.nerve_monitor_interval_seconds}s</span>
                </div>
            )}
        </div>
    );
};

export default AlertsView;
