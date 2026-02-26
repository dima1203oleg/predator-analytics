
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import {
    Brain, Activity, Eye, Shield, AlertTriangle, Network, TrendingUp,
    TrendingDown, Zap, Target, GitBranch, HardDrive, RefreshCw,
    CheckCircle2, XCircle, Clock, Building, Map, Users, Search
} from 'lucide-react';
import { AdvancedBackground } from '../components/AdvancedBackground';
import { ViewHeader } from '../components/ViewHeader';
import { TacticalCard } from '../components/TacticalCard';
import { CyberOrb, Skeleton } from '../components';
import { api } from '../services/api';
import { useShell, UIShell } from '../context/ShellContext';

interface MarketPulse {
    index_name: string;
    score: number;
    trend: string;
    anomalies_detected: number;
    structural_blind_spots: {
        latest_anomaly: string;
        magnitude: number;
    };
    timestamp: string;
    scores?: {
        behavioral: number;
        institutional: number;
        structural: number;
    };
}

const LAYER_COLORS: Record<string, string> = {
    behavioral: '#3b82f6',
    institutional: '#f59e0b',
    influence: '#a855f7',
    structural: '#ef4444',
    predictive: '#10b981',
};

const LAYERS = [
    {
        id: 'behavioral',
        num: '101-120',
        title: 'Поведінковий',
        subtitle: 'Behavioral Layer',
        icon: Brain,
        color: '#3b82f6',
        glow: 'rgba(59, 130, 246, 0.3)',
        metrics: [
            { label: 'Імпортер з пам\'яттю', value: '82%', hint: 'Score 101' },
            { label: 'Поведінкова температура', value: '0.15', hint: 'Score 103' },
            { label: 'Стрес-реакція', value: 'НИЗЬКА', hint: 'Score 102' },
        ],
        status: 'active',
        insight: 'Виявлено 3 компанії з нестабільними патернами HS-кодів. Ризик 102-поведінки.'
    },
    {
        id: 'institutional',
        num: '121-140',
        title: 'Інституційний',
        subtitle: 'Institutional Layer',
        icon: Building,
        color: '#f59e0b',
        glow: 'rgba(245, 158, 11, 0.3)',
        metrics: [
            { label: 'Індекс лояльності поста', value: '0.88', hint: 'Score 123' },
            { label: 'Асиметрія дозволів', value: '1.45x', hint: 'Score 121' },
            { label: 'Активні монополії', value: '2', hint: 'Score 125' },
        ],
        status: 'warning',
        insight: '⚠️ Митний пост "ЦЕНТР-01" виявляє аномальну лояльність до "Shadow Group Alpha".'
    },
    {
        id: 'influence',
        num: '141-160',
        title: 'Мережі впливу',
        subtitle: 'Influence Layer',
        icon: Network,
        color: '#a855f7',
        glow: 'rgba(168, 85, 247, 0.3)',
        metrics: [
            { label: 'Гравітаційний центр', value: '0.95', hint: 'Score 141' },
            { label: 'Тіньовий кластер', value: 'ВИЯВЛЕНО', hint: 'Score 142' },
            { label: 'Латентний альянс', value: '0.78', hint: 'Score 143' },
        ],
        status: 'critical',
        insight: '🔴 Виявлено 2 тіньових зв\'язки. Спільний брокер: "Shadow Group Alpha".'
    },
    {
        id: 'structural',
        num: '161-180',
        title: 'Структурні сліпі зони',
        subtitle: 'Structural Blind Spots',
        icon: Eye,
        color: '#ef4444',
        glow: 'rgba(239, 68, 68, 0.3)',
        metrics: [
            { label: 'Імпорт без ринку', value: '5M UAH', hint: 'Score 161' },
            { label: 'Код УКТЗЕД', value: '8517', hint: 'Smartphones' },
            { label: 'Впевненість', value: '88%', hint: 'Score 162' },
        ],
        status: 'critical',
        insight: '🚨 Виявлено дефіцит 5M грн у внутрішньому обігу товарів УКТЗЕД 8517.'
    },
    {
        id: 'predictive',
        num: '181-200',
        title: 'Предиктивний',
        subtitle: 'Predictive Layer',
        icon: TrendingUp,
        color: '#10b981',
        glow: 'rgba(16, 185, 129, 0.3)',
        metrics: [
            { label: 'Ризик зникнення', value: '15%', hint: 'Score 181' },
            { label: 'Сигнал схеми', value: 'ВІДСУТНІЙ', hint: 'Score 183' },
            { label: 'Санкційний ризик', value: 'МОНІТОРИНГ', hint: 'Score 191' },
        ],
        status: 'active',
        insight: '✅ Активні 2 попереджувальних алерти. Горизонт прогнозу: 30 днів.'
    },
];

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    active: {
        bg: 'bg-emerald-500/5',
        border: 'border-emerald-500/20',
        text: 'text-emerald-400',
        dot: 'bg-emerald-500'
    },
    warning: {
        bg: 'bg-amber-500/5',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        dot: 'bg-amber-500'
    },
    critical: {
        bg: 'bg-rose-500/5',
        border: 'border-rose-500/30',
        text: 'text-rose-400',
        dot: 'bg-rose-500 animate-pulse'
    },
};

const IntelligenceView: React.FC = () => {
    const { currentShell } = useShell();
    const isCommander = currentShell === UIShell.COMMANDER;
    const [pulse, setPulse] = useState<MarketPulse | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [turbulenceHistory, setTurbulenceHistory] = useState<number[]>(
        Array.from({ length: 20 }, () => 0.3 + Math.random() * 0.2)
    );

    const fetchPulse = useCallback(async () => {
        try {
            const data = await api.nerve.getMarketPulse();
            setPulse(data);
            setTurbulenceHistory(prev => [
                ...prev.slice(1),
                data.score ?? 0.35
            ]);
            setLastRefresh(new Date());
            setLoading(false);
        } catch (e) {
            console.error('Failed to fetch market pulse', e);
            // Use fallback data
            setPulse({
                index_name: 'Economic Climate Meter (V25)',
                score: 0.35,
                trend: 'stable',
                anomalies_detected: 14,
                structural_blind_spots: { latest_anomaly: 'import_without_market', magnitude: 5000000 },
                timestamp: new Date().toISOString(),
                scores: { behavioral: 0.82, institutional: 0.65, structural: 0.45 }
            });
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPulse();
        const interval = setInterval(fetchPulse, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, [fetchPulse]);

    const turbulenceScore = pulse?.score ?? 0.35;
    const turbulencePercent = Math.round(turbulenceScore * 100);
    const isHighTurbulence = turbulenceScore > 0.6;

    const turbulenceChartOption = {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', backgroundColor: 'rgba(2,6,23,0.9)', borderColor: '#334155', textStyle: { color: '#e2e8f0', fontSize: 10 } },
        grid: { left: 0, right: 0, top: 10, bottom: 0, containLabel: true },
        xAxis: { show: false, type: 'category', data: turbulenceHistory.map((_, i) => i) },
        yAxis: { show: false, type: 'value', min: 0, max: 1 },
        series: [{
            type: 'line',
            data: turbulenceHistory,
            smooth: true,
            showSymbol: false,
            lineStyle: { color: isHighTurbulence ? '#ef4444' : '#3b82f6', width: 2 },
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: isHighTurbulence ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)' },
                    { offset: 1, color: 'rgba(0,0,0,0)' }
                ])
            }
        }]
    };

    const radarOption = {
        backgroundColor: 'transparent',
        radar: {
            indicator: [
                { name: 'Behavioral', max: 1 },
                { name: 'Institutional', max: 1 },
                { name: 'Influence', max: 1 },
                { name: 'Structural', max: 1 },
                { name: 'Predictive', max: 1 },
            ],
            shape: 'polygon',
            splitNumber: 4,
            axisName: { color: '#475569', fontSize: 9, fontFamily: 'monospace' },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
            splitArea: { show: false },
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        },
        series: [{
            type: 'radar',
            data: [{
                value: [
                    pulse?.scores?.behavioral ?? 0.82,
                    pulse?.scores?.institutional ?? 0.65,
                    0.88,
                    pulse?.scores?.structural ?? 0.45,
                    0.72,
                ],
                name: 'Аналітичний профіль',
                areaStyle: { color: 'rgba(59,130,246,0.1)' },
                lineStyle: { color: '#3b82f6', width: 2 },
                itemStyle: { color: '#3b82f6' },
            }]
        }]
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-24 w-full max-w-[1700px] mx-auto relative z-10">
            <AdvancedBackground showStars />
            <div className="fixed inset-0 bg-noise opacity-[0.03] pointer-events-none mix-blend-overlay z-[100]" />

            <ViewHeader
                title={isCommander ? 'НЕРВОВА СИСТЕМА РИНКУ' : 'INTELLIGENCE V25'}
                icon={<Brain size={20} className="text-purple-400" />}
                breadcrumbs={['PREDATOR', 'АНАЛІТИКА', 'V25 INTELLIGENCE']}
                stats={[
                    { label: 'Турбулентність', value: `${turbulencePercent}%`, icon: <Activity size={14} />, color: isHighTurbulence ? 'danger' : 'success' },
                    { label: 'Активних аномалій', value: String(pulse?.anomalies_detected ?? '—'), icon: <AlertTriangle size={14} />, color: 'warning' },
                    { label: 'NerveMonitor', value: loading ? 'SYNC...' : 'ACTIVE', icon: <Zap size={14} />, color: 'primary' },
                ]}
            />

            {/* Top: Market Pulse + Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Composite Turbulence Index */}
                <TacticalCard
                    variant="holographic"
                    title="ІНДЕКС ТУРБУЛЕНТНОСТІ РИНКУ"
                    className="panel-3d glass-ultra rounded-[32px] shadow-2xl border-purple-500/10"
                >
                    <div className="flex flex-col items-center py-4">
                        <div className="relative mb-6">
                            <CyberOrb
                                size={180}
                                color={isHighTurbulence ? '#ef4444' : '#3b82f6'}
                                className="opacity-80"
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-5xl font-black font-display tracking-tighter ${isHighTurbulence ? 'text-rose-400' : 'text-blue-400'}`}>
                                    {loading ? '...' : `${turbulencePercent}%`}
                                </span>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">
                                    {pulse?.trend?.toUpperCase() ?? 'STABLE'}
                                </span>
                            </div>
                        </div>

                        {/* Sparkline */}
                        <div className="w-full h-16 px-1">
                            <ReactECharts option={turbulenceChartOption} style={{ height: '100%' }} />
                        </div>

                        {/* Scores */}
                        <div className="w-full mt-4 space-y-2 px-2">
                            {[
                                { label: 'Behavioral', value: pulse?.scores?.behavioral, color: LAYER_COLORS.behavioral },
                                { label: 'Institutional', value: pulse?.scores?.institutional, color: LAYER_COLORS.institutional },
                                { label: 'Structural', value: pulse?.scores?.structural, color: LAYER_COLORS.structural },
                            ].map(s => (
                                <div key={s.label} className="flex items-center gap-3">
                                    <span className="text-[9px] text-slate-500 font-mono w-20 uppercase">{s.label}</span>
                                    <div className="flex-1 h-1 bg-slate-900 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${((s.value ?? 0.5) * 100).toFixed(0)}%` }}
                                            transition={{ duration: 1, ease: 'circOut' }}
                                            className="h-full rounded-full"
                                            style={{ background: s.color }}
                                        />
                                    </div>
                                    <span className="text-[9px] font-mono text-slate-400 w-8 text-right">
                                        {s.value ? `${(s.value * 100).toFixed(0)}%` : '—'}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 flex items-center gap-2 text-[9px] text-slate-600 font-mono">
                            <Clock size={10} />
                            ОНОВЛЕНО: {lastRefresh.toLocaleTimeString()}
                        </div>
                    </div>
                </TacticalCard>

                {/* Radar */}
                <TacticalCard
                    variant="holographic"
                    title="АНАЛІТИЧНИЙ ПРОФІЛЬ (5 ШАРІВ)"
                    className="panel-3d glass-ultra rounded-[32px] shadow-2xl"
                >
                    <div className="h-[340px] w-full">
                        <ReactECharts
                            option={radarOption}
                            style={{ height: '100%', width: '100%' }}
                            theme="dark"
                        />
                    </div>
                </TacticalCard>

                {/* Structural Blind Spot Alert */}
                <TacticalCard
                    variant="holographic"
                    title="СТРУКТУРНІ СЛІПІ ЗОНИ"
                    className="panel-3d glass-ultra rounded-[32px] shadow-2xl border-rose-500/10"
                >
                    <div className="space-y-4 py-2">
                        <div className="p-5 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">
                                    АКТИВНА АНОМАЛІЯ
                                </span>
                            </div>
                            <div className="text-sm font-black text-white uppercase tracking-wide mb-1">
                                {loading ? <Skeleton width={160} height={16} /> : (pulse?.structural_blind_spots?.latest_anomaly?.replace(/_/g, ' ') ?? 'НЕВІДОМО')}
                            </div>
                            <div className="text-2xl font-black text-rose-400 font-mono mt-2">
                                {loading ? '—' : `${((pulse?.structural_blind_spots?.magnitude ?? 0) / 1_000_000).toFixed(1)}M ₴`}
                            </div>
                            <div className="text-[9px] text-slate-500 mt-1 uppercase tracking-widest">
                                GAP_MAGNITUDE
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Виявлено аномалій', value: String(pulse?.anomalies_detected ?? '—'), color: 'text-amber-400' },
                                { label: 'УКТЗЕД Зона', value: '8517', color: 'text-blue-400' },
                                { label: 'Статус', value: 'АКТИВНО', color: 'text-rose-400' },
                                { label: 'Впевненість', value: '88%', color: 'text-emerald-400' },
                            ].map(item => (
                                <div key={item.label} className="p-3 bg-black/40 rounded-xl border border-white/5">
                                    <div className={`text-lg font-black font-mono ${item.color}`}>{loading ? '—' : item.value}</div>
                                    <div className="text-[8px] text-slate-500 uppercase tracking-widest mt-1">{item.label}</div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={fetchPulse}
                            className="w-full py-2 bg-slate-900 border border-white/5 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2 hover:border-blue-500/30 hover:text-blue-400 transition-all"
                        >
                            <RefreshCw size={12} />
                            ОНОВИТИ ДАНІ
                        </button>
                    </div>
                </TacticalCard>
            </div>

            {/* 5 Analytical Layers */}
            <div>
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4 pl-2 flex items-center gap-3">
                    <div className="w-6 h-px bg-slate-700" />
                    5 АНАЛІТИЧНИХ ШАРІВ · NERVOUS SYSTEM V25
                    <div className="flex-1 h-px bg-slate-700/30" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                    {LAYERS.map((layer, i) => {
                        const Icon = layer.icon;
                        const sc = STATUS_COLORS[layer.status];
                        const isSelected = selectedLayer === layer.id;

                        return (
                            <motion.div
                                key={layer.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.07 }}
                                onClick={() => setSelectedLayer(isSelected ? null : layer.id)}
                                className={`cursor-pointer relative rounded-[28px] border p-5 transition-all duration-500 overflow-hidden group
                                    ${isSelected
                                        ? `${sc.bg} ${sc.border} shadow-2xl scale-[1.02]`
                                        : 'bg-black/30 border-white/5 hover:border-white/20 hover:bg-white/5'
                                    }`}
                                style={isSelected ? { boxShadow: `0 0 40px ${layer.glow}` } : {}}
                            >
                                {/* Layer Number */}
                                <div className="absolute top-3 right-3 text-[8px] font-mono text-slate-700 font-black">
                                    {layer.num}
                                </div>

                                {/* Icon */}
                                <div
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                                    style={{ background: `${layer.color}15`, border: `1px solid ${layer.color}30` }}
                                >
                                    <Icon size={24} style={{ color: layer.color }} />
                                </div>

                                {/* Status dot */}
                                <div className="flex items-center gap-2 mb-3">
                                    <div className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                                    <span className={`text-[8px] font-black uppercase tracking-widest ${sc.text}`}>
                                        {layer.status === 'active' ? 'НОРМА' : layer.status === 'warning' ? 'ПОПЕРЕДЖЕННЯ' : 'КРИТИЧНО'}
                                    </span>
                                </div>

                                <h3 className="text-[11px] font-black text-white uppercase tracking-wider leading-tight mb-0.5">
                                    {layer.title}
                                </h3>
                                <p className="text-[8px] text-slate-600 font-mono mb-4">{layer.subtitle}</p>

                                {/* Metrics */}
                                <div className="space-y-2">
                                    {layer.metrics.map(m => (
                                        <div key={m.label} className="flex justify-between items-center text-[9px]">
                                            <span className="text-slate-500 truncate flex-1 mr-2">{m.label}</span>
                                            <span className="font-mono font-black text-slate-200 shrink-0">{m.value}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Insight (expanded) */}
                                <AnimatePresence>
                                    {isSelected && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-4 pt-4 border-t overflow-hidden"
                                            style={{ borderColor: `${layer.color}20` }}
                                        >
                                            <p className="text-[10px] text-slate-300 leading-relaxed font-mono">
                                                {layer.insight}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom: Influence Network + Institutional Biases */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TacticalCard
                    variant="holographic"
                    title="МЕРЕЖА ВПЛИВУ (Layer 3)"
                    className="panel-3d glass-ultra rounded-[32px] shadow-2xl border-purple-500/10"
                >
                    <div className="space-y-3 py-2">
                        <div className="text-[9px] text-slate-600 font-mono uppercase tracking-widest mb-3">
                            ВИЯВЛЕНІ ЛАТЕНТНІ ЗВ'ЯЗКИ
                        </div>
                        {[
                            { type: 'shared_broker', weight: 0.95, shadow: true, target: 'Entity-0001' },
                            { type: 'synchronous_movement', weight: 0.78, shadow: false, target: 'Entity-0002' },
                        ].map((conn, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`flex items-center gap-4 p-4 rounded-2xl border ${conn.shadow ? 'bg-rose-500/5 border-rose-500/20' : 'bg-purple-500/5 border-purple-500/20'}`}
                            >
                                <div className={`p-2 rounded-xl ${conn.shadow ? 'bg-rose-500/10 text-rose-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                    <GitBranch size={16} />
                                </div>
                                <div className="flex-1">
                                    <div className="text-[10px] font-black text-white uppercase tracking-wider">
                                        {conn.type.replace(/_/g, ' ')}
                                    </div>
                                    <div className="text-[8px] text-slate-500 font-mono">{conn.target}</div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-lg font-black font-mono ${conn.weight > 0.9 ? 'text-rose-400' : 'text-purple-400'}`}>
                                        {(conn.weight * 100).toFixed(0)}%
                                    </div>
                                    {conn.shadow && (
                                        <div className="text-[8px] text-rose-500 font-black uppercase">SHADOW</div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                        <div className="p-4 bg-black/30 rounded-2xl border border-white/5 mt-4">
                            <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-2">ГРАВІТАЦІЙНИЙ ЦЕНТР</div>
                            <div className="text-xl font-black text-purple-400 font-mono">Shadow Group Alpha</div>
                            <div className="text-[9px] text-slate-500 mt-1">2 Active pull points · Score 141</div>
                        </div>
                    </div>
                </TacticalCard>

                <TacticalCard
                    variant="holographic"
                    title="ІНСТИТУЦІЙНІ ПЕРЕКОСИ (Layer 2)"
                    className="panel-3d glass-ultra rounded-[32px] shadow-2xl border-amber-500/10"
                >
                    <div className="space-y-3 py-2">
                        <div className="text-[9px] text-slate-600 font-mono uppercase tracking-widest mb-3">
                            МИТНІ ПОСТИ · АНАЛІЗ ЛОЯЛЬНОСТІ
                        </div>
                        {[
                            { post: 'Митний пост ЦЕНТР-01', loyalty: 0.88, asymmetry: 1.45, monopolies: ['Shadow Group Alpha', 'Cluster-7'] },
                            { post: 'Митний пост СХІД-03', loyalty: 0.42, asymmetry: 1.05, monopolies: [] },
                            { post: 'Митний пост ЗАЗ-07', loyalty: 0.31, asymmetry: 0.98, monopolies: [] },
                        ].map((item, i) => (
                            <div key={i} className={`p-4 rounded-2xl border ${item.loyalty > 0.7 ? 'bg-amber-500/5 border-amber-500/20' : 'bg-black/30 border-white/5'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="text-[10px] font-black text-white uppercase tracking-wider">{item.post}</div>
                                        {item.monopolies.length > 0 && (
                                            <div className="flex gap-1 mt-1">
                                                {item.monopolies.map(m => (
                                                    <span key={m} className="text-[7px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                                        {m}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className={`text-lg font-black font-mono ${item.loyalty > 0.7 ? 'text-amber-400' : 'text-slate-400'}`}>
                                        {(item.loyalty * 100).toFixed(0)}%
                                    </div>
                                </div>
                                <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.loyalty * 100}%` }}
                                        transition={{ duration: 1, delay: i * 0.1 }}
                                        className={`h-full rounded-full ${item.loyalty > 0.7 ? 'bg-amber-500' : 'bg-slate-600'}`}
                                    />
                                </div>
                                <div className="flex justify-between text-[8px] text-slate-600 mt-1 font-mono">
                                    <span>LOYALTY_IDX</span>
                                    <span>ASYMMETRY: {item.asymmetry.toFixed(2)}x</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </TacticalCard>
            </div>
        </div>
    );
};

export default IntelligenceView;
