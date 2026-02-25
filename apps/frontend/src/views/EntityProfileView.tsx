import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import {
    Search, Brain, Building, Network, Eye, TrendingUp,
    AlertTriangle, CheckCircle2, XCircle, Clock, Shield,
    ChevronRight, BarChart3, Zap, GitBranch, RefreshCw, Info
} from 'lucide-react';
import { api } from '../services/api';

interface EntityProfile {
    entity_id: string;
    profile_generated_at: string;
    confidence: number;
    cers: {
        cers_score: number;
        cers_status: string;
        cers_label: string;
        component_weights: {
            behavioral: number;
            institutional: number;
            influence: number;
            structural: number;
            predictive: number;
        };
    };
    layers: {
        behavioral: { score: number; signals: any[] };
        institutional: { score: number; signals: any[] };
        influence: { score: number; connections: any[] };
        structural: { score: number; gaps: any[] };
        predictive: { score: number; forecasts: any[] };
    };
    ledger_trace_id?: string;
    ledger_signature?: string;
}

const LAYER_META = [
    { key: 'behavioral', label: 'Behavioral', icon: Brain, color: '#3b82f6', ds: '101–120', desc: 'Поведінковий відбиток' },
    { key: 'institutional', label: 'Institutional', icon: Building, color: '#f59e0b', ds: '121–140', desc: 'Інституційні перекоси' },
    { key: 'influence', label: 'Influence', icon: Network, color: '#a855f7', ds: '141–160', desc: 'Мережі впливу' },
    { key: 'structural', label: 'Structural', icon: Eye, color: '#ef4444', ds: '161–180', desc: 'Сліпі зони' },
    { key: 'predictive', label: 'Predictive', icon: TrendingUp, color: '#10b981', ds: '181–200', desc: 'Прогнози та алерти' },
];

const CERS_COLORS: Record<string, string> = {
    stable: '#10b981',
    watchlist: '#3b82f6',
    elevated: '#f59e0b',
    high_alert: '#f97316',
    critical: '#ef4444',
};

const DEMO_ENTITY_ID = '550e8400-e29b-41d4-a716-446655440001';

const EntityProfileView: React.FC = () => {
    const [entityId, setEntityId] = useState('');
    const [profile, setProfile] = useState<EntityProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeLayer, setActiveLayer] = useState<string | null>(null);

    const loadProfile = async (id: string) => {
        if (!id.trim()) return;
        setLoading(true);
        setError(null);
        setProfile(null);
        try {
            const data = await api.nerve.getEntityProfile(id);
            setProfile(data);
        } catch (e) {
            setError('Не вдалося завантажити профіль. Перевірте ID.');
        } finally {
            setLoading(false);
        }
    };

    const loadDemo = () => {
        setEntityId(DEMO_ENTITY_ID);
        loadProfile(DEMO_ENTITY_ID);
    };

    const cersColor = profile ? CERS_COLORS[profile.cers.cers_status] ?? '#64748b' : '#64748b';
    const cersPercent = profile ? Math.round(profile.cers.cers_score * 100) : 0;

    const radarOption = profile ? {
        backgroundColor: 'transparent',
        radar: {
            indicator: LAYER_META.map(l => ({ name: l.label, max: 1 })),
            shape: 'polygon',
            splitNumber: 4,
            axisName: { color: '#475569', fontSize: 9 },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
            splitArea: { show: false },
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        },
        series: [{
            type: 'radar',
            data: [{
                value: LAYER_META.map(l =>
                    (profile.layers as any)[l.key]?.score ?? 0
                ),
                areaStyle: { color: `${cersColor}20` },
                lineStyle: { color: cersColor, width: 2 },
                itemStyle: { color: cersColor },
            }]
        }]
    } : null;

    const barOption = profile ? {
        backgroundColor: 'transparent',
        grid: { left: 100, right: 20, top: 10, bottom: 10 },
        xAxis: { type: 'value', show: false, max: 1 },
        yAxis: {
            type: 'category',
            data: Object.keys(profile.cers.component_weights),
            axisLabel: { color: '#64748b', fontSize: 9, fontFamily: 'monospace' },
            axisLine: { show: false },
            axisTick: { show: false },
        },
        series: [{
            type: 'bar',
            data: Object.values(profile.cers.component_weights),
            barMaxWidth: 8,
            itemStyle: {
                color: cersColor,
                borderRadius: [0, 4, 4, 0],
            },
            label: {
                show: true,
                position: 'right',
                color: '#94a3b8',
                fontSize: 9,
                formatter: (p: any) => `${(p.value * 100).toFixed(1)}%`,
            }
        }]
    } : null;

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-24 w-full max-w-[1700px] mx-auto relative z-10">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-1 flex items-center gap-2">
                        <div className="w-4 h-px bg-slate-700" />
                        PREDATOR V25 · ENTITY PROFILE · CERS
                    </div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tight">
                        Профіль Сутності
                    </h1>
                    <p className="text-[11px] text-slate-500 font-mono mt-1">
                        Composite Economic Risk Score · 5 Analytical Layers · Credit X-Ray
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-white/5 rounded-2xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ENGINE ONLINE</span>
                </div>
            </div>

            {/* Search */}
            <div className="flex gap-3">
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                    <input
                        type="text"
                        value={entityId}
                        onChange={e => setEntityId(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && loadProfile(entityId)}
                        placeholder="Введіть ЄДРПОУ або UUID компанії..."
                        className="w-full pl-11 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-sm text-white placeholder:text-slate-600 font-mono outline-none focus:border-blue-500/50 focus:bg-black/60 transition-all"
                    />
                </div>
                <button
                    onClick={() => loadProfile(entityId)}
                    disabled={loading}
                    className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-2xl text-[11px] font-black text-white uppercase tracking-widest transition-all flex items-center gap-2"
                >
                    {loading ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                    {loading ? 'SCANNING...' : 'SCAN'}
                </button>
                <button
                    onClick={loadDemo}
                    className="px-5 py-3.5 bg-slate-900 border border-white/10 hover:border-purple-500/40 rounded-2xl text-[11px] font-black text-slate-400 hover:text-purple-400 uppercase tracking-widest transition-all"
                >
                    DEMO
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-sm text-rose-400 font-mono">
                    ❌ {error}
                </div>
            )}

            {/* Profile */}
            <AnimatePresence>
                {profile && (
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* CERS Score + Radar */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* CERS Main Score */}
                            <div className="col-span-1 p-6 rounded-[28px] border border-white/5 bg-black/40 flex flex-col items-center justify-center gap-4">
                                <div
                                    className="w-40 h-40 rounded-full flex items-center justify-center relative"
                                    style={{
                                        background: `conic-gradient(${cersColor} ${cersPercent * 3.6}deg, #0f172a ${cersPercent * 3.6}deg)`,
                                        boxShadow: `0 0 60px ${cersColor}40`,
                                    }}
                                >
                                    <div className="absolute inset-3 bg-[#050a14] rounded-full flex flex-col items-center justify-center">
                                        <span className="text-4xl font-black font-mono" style={{ color: cersColor }}>
                                            {cersPercent}
                                        </span>
                                        <span className="text-[8px] text-slate-600 uppercase tracking-widest font-black">CERS</span>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <div className="text-lg font-black" style={{ color: cersColor }}>
                                        {profile.cers.cers_label}
                                    </div>
                                    <div className="text-[9px] text-slate-600 font-mono mt-1 uppercase tracking-widest">
                                        Composite Economic Risk Score
                                    </div>
                                </div>

                                <div className="w-full space-y-1">
                                    <div className="text-[8px] text-slate-600 font-mono uppercase tracking-widest mb-2">CONFIDENCE</div>
                                    <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-emerald-500"
                                            style={{ width: `${profile.confidence * 100}%` }}
                                        />
                                    </div>
                                    <div className="text-[9px] text-slate-500 font-mono text-right">{(profile.confidence * 100).toFixed(0)}%</div>
                                </div>

                                <div className="text-[8px] text-slate-700 font-mono text-center">
                                    {new Date(profile.profile_generated_at).toLocaleString('uk-UA')}
                                </div>
                            </div>

                            {/* Radar Chart */}
                            <div className="col-span-1 p-6 rounded-[28px] border border-white/5 bg-black/40">
                                <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">АНАЛІТИЧНИЙ ПРОФІЛЬ</div>
                                {radarOption && (
                                    <ReactECharts
                                        option={radarOption}
                                        style={{ height: '280px' }}
                                        theme="dark"
                                    />
                                )}
                            </div>

                            {/* CERS Breakdown Bar */}
                            <div className="col-span-1 p-6 rounded-[28px] border border-white/5 bg-black/40">
                                <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">РОЗБИВКА CERS</div>
                                {barOption && (
                                    <ReactECharts
                                        option={barOption}
                                        style={{ height: '140px' }}
                                        theme="dark"
                                    />
                                )}

                                <div className="mt-4 p-4 bg-slate-900/60 rounded-2xl border border-white/5">
                                    <div className="text-[8px] text-slate-600 font-mono mb-2 uppercase tracking-widest">CERS FORMULA</div>
                                    <div className="text-[9px] font-mono text-slate-400 leading-relaxed">
                                        <span className="text-blue-400">0.25</span>×B +{' '}
                                        <span className="text-amber-400">0.20</span>×I +{' '}
                                        <span className="text-purple-400">0.20</span>×Inf +{' '}
                                        <span className="text-rose-400">0.15</span>×S +{' '}
                                        <span className="text-emerald-400">0.20</span>×P
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-white/5 text-[10px] font-black font-mono" style={{ color: cersColor }}>
                                        = {profile.cers.cers_score.toFixed(4)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 5 Layers */}
                        <div>
                            <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                                <div className="w-6 h-px bg-slate-700" />
                                5 АНАЛІТИЧНИХ ШАРІВ
                                <div className="flex-1 h-px bg-slate-700/30" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                {LAYER_META.map((layer, i) => {
                                    const Icon = layer.icon;
                                    const layerData = (profile.layers as any)[layer.key];
                                    const score = layerData?.score ?? 0;
                                    const isActive = activeLayer === layer.key;

                                    return (
                                        <motion.div
                                            key={layer.key}
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.06 }}
                                            onClick={() => setActiveLayer(isActive ? null : layer.key)}
                                            className={`cursor-pointer p-5 rounded-[24px] border transition-all duration-300 ${isActive
                                                ? 'scale-[1.02]'
                                                : 'bg-black/30 border-white/5 hover:border-white/15'
                                                }`}
                                            style={isActive ? {
                                                background: `${layer.color}08`,
                                                borderColor: `${layer.color}40`,
                                                boxShadow: `0 0 30px ${layer.color}20`,
                                            } : {}}
                                        >
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                                                style={{ background: `${layer.color}15`, border: `1px solid ${layer.color}30` }}
                                            >
                                                <Icon size={20} style={{ color: layer.color }} />
                                            </div>

                                            <div className="text-[8px] font-mono text-slate-600 mb-1">{layer.ds}</div>
                                            <div className="text-[10px] font-black text-white uppercase tracking-wider">{layer.label}</div>
                                            <div className="text-[8px] text-slate-600 mb-3">{layer.desc}</div>

                                            {/* Score bar */}
                                            <div className="h-1 bg-slate-900 rounded-full overflow-hidden mb-1">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${score * 100}%` }}
                                                    transition={{ duration: 0.8, ease: 'circOut' }}
                                                    className="h-full rounded-full"
                                                    style={{ background: layer.color }}
                                                />
                                            </div>
                                            <div className="text-right text-[9px] font-mono font-black" style={{ color: layer.color }}>
                                                {(score * 100).toFixed(0)}%
                                            </div>

                                            {/* Expanded signals */}
                                            <AnimatePresence>
                                                {isActive && layerData && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="mt-3 pt-3 border-t space-y-2 overflow-hidden"
                                                        style={{ borderColor: `${layer.color}20` }}
                                                    >
                                                        {(layerData.signals ?? layerData.connections ?? layerData.gaps ?? layerData.forecasts ?? [])
                                                            .slice(0, 3).map((sig: any, j: number) => (
                                                                <div key={j} className="text-[8px] font-mono text-slate-500 leading-relaxed">
                                                                    <span style={{ color: layer.color }}>›</span>{' '}
                                                                    {sig.type?.replace(/_/g, ' ') ?? sig.description ?? JSON.stringify(sig).slice(0, 60)}
                                                                </div>
                                                            ))
                                                        }
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Ledger Signature Block */}
                        {profile.ledger_signature && (
                            <div className="flex flex-col items-center justify-center p-4 bg-slate-900/40 border border-white/5 rounded-2xl gap-2 mt-4">
                                <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                    <CheckCircle2 size={12} />
                                    Mathematical Integrity Verified
                                </div>
                                <div className="text-[8px] font-mono text-slate-500 max-w-full truncate px-4 text-center">
                                    <span className="text-slate-600">TRACE:</span> {profile.ledger_trace_id}
                                    <br />
                                    <span className="text-slate-600">SHA256:</span> {profile.ledger_signature}
                                </div>
                            </div>
                        )}

                        {/* Entity ID footer */}
                        <div className="flex items-center justify-center gap-4 text-[8px] font-mono text-slate-700 mt-2">
                            <Shield size={10} />
                            <span>ENTITY: {profile.entity_id}</span>
                            <span>·</span>
                            <span>CONFIDENCE: {(profile.confidence * 100).toFixed(0)}%</span>
                            <span>·</span>
                            <span>FRESHNESS: {profile.data_freshness_hours}h</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Empty state */}
            {!profile && !loading && !error && (
                <div className="flex flex-col items-center justify-center py-24 gap-6">
                    <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-white/5 flex items-center justify-center">
                        <Search size={32} className="text-slate-700" />
                    </div>
                    <div className="text-center">
                        <div className="text-slate-500 font-black text-lg uppercase tracking-wide">Введіть ID компанії</div>
                        <div className="text-slate-700 text-[11px] font-mono mt-2">
                            Натисніть DEMO щоб переглянути приклад профілю
                        </div>
                    </div>
                    <button onClick={loadDemo} className="px-6 py-3 bg-slate-900 border border-white/10 hover:border-purple-500/40 rounded-2xl text-[11px] font-black text-slate-400 hover:text-purple-400 uppercase tracking-widest transition-all">
                        Завантажити Demo профіль →
                    </button>
                </div>
            )}
        </div>
    );
};

export default EntityProfileView;
