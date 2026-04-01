/**
 * PREDATOR v55.5 | AML Когнітивний Аналізатор
 *
 * Anti-Money Laundering Scoring Engine — повне підключення до бекенду.
 * Маршрут: /aml
 *
 * API:
 * - POST /analytics/aml/score   — скор однієї сутності
 * - POST /analytics/aml/batch   — пакетний аналіз (до 100)
 * - GET  /analytics/aml/risk-levels — каталог факторів
 *
 * 7 факторів ризику:
 * sanctions(100) · criminal(80) · tax(70) · offshore(60)
 * shell_company(50) · pep(50) · beneficial_ownership(45)
 * management(40) · financial(35) · registration(30)
 *
 * © 2026 PREDATOR Analytics — HR-04 compliant, тільки українська
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldAlert, Search, Zap, AlertTriangle, CheckCircle,
    AlertCircle, Upload, Download, RefreshCw, TrendingUp,
    Users, Building2, FileText, Database, Target, Activity,
    ChevronRight, BarChart3, Clock, X, Plus, Eye,
    ShieldCheck, Flame, Info, Crosshair, Network
} from 'lucide-react';
import ReactECharts from '@/components/ECharts';
import { motion as m } from 'framer-motion';
import { apiClient as api } from '@/services/api';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { ViewHeader } from '@/components/ViewHeader';
import { cn } from '@/utils/cn';

// ========================
// Типи
// ========================

interface AMLFactor {
    category: string;
    name: string;
    description: string;
    weight: number;
    detected: boolean;
    details: string;
    source: string;
}

interface AMLResult {
    entity_id: string;
    entity_name: string;
    entity_type: string;
    total_score: number;
    risk_level: 'critical' | 'high' | 'medium' | 'low' | 'minimal';
    factors: AMLFactor[];
    recommendations: string[];
    calculated_at: string;
}

interface BatchEntry {
    id: string;
    entity_id: string;
    entity_name: string;
    entity_type: string;
}

interface RiskLevelInfo {
    level: string;
    range: string;
    description: string;
}

// ========================
// Константи
// ========================

const RISK_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; glow: string }> = {
    critical: { label: 'КРИТИЧНИЙ',   color: '#f43f5e', bg: 'bg-rose-500/10',    border: 'border-rose-500/40',    glow: 'shadow-[0_0_30px_rgba(244,63,94,0.3)]' },
    high:     { label: 'ВИСОКИЙ',     color: '#f97316', bg: 'bg-orange-500/10',  border: 'border-orange-500/40',  glow: 'shadow-[0_0_30px_rgba(249,115,22,0.3)]' },
    medium:   { label: 'СЕРЕДНІЙ',    color: '#f59e0b', bg: 'bg-amber-500/10',   border: 'border-amber-500/40',   glow: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]' },
    low:      { label: 'НИЗЬКИЙ',     color: '#22c55e', bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', glow: 'shadow-[0_0_30px_rgba(34,197,94,0.3)]' },
    minimal:  { label: 'МІНІМАЛЬНИЙ', color: '#06b6d4', bg: 'bg-cyan-500/10',    border: 'border-cyan-500/40',    glow: 'shadow-[0_0_30px_rgba(6,182,212,0.3)]' },
};

const FACTOR_LABELS: Record<string, string> = {
    sanctions:            'Санкційні списки',
    criminal:             'Кримінальні справи',
    tax:                  'Податкові борги',
    offshore:             'Офшорні зв\'язки',
    shell_company:        'Ознаки фіктивності',
    pep:                  'Пол. значуща особа',
    beneficial_ownership: 'Проблеми з UBO',
    management:           'Зміни керівництва',
    financial:            'Фінансові аномалії',
    registration:         'Масова реєстрація',
};

const FACTOR_ICONS: Record<string, React.ReactNode> = {
    sanctions:            <ShieldAlert size={14} />,
    criminal:             <AlertTriangle size={14} />,
    tax:                  <TrendingUp size={14} />,
    offshore:             <Network size={14} />,
    shell_company:        <Building2 size={14} />,
    pep:                  <Users size={14} />,
    beneficial_ownership: <Eye size={14} />,
    management:           <RefreshCw size={14} />,
    financial:            <BarChart3 size={14} />,
    registration:         <Database size={14} />,
};

// ========================
// Підкомпоненти
// ========================

/** Пульсуючий індикатор рівня ризику */
const RiskBadge: React.FC<{ level: string }> = ({ level }) => {
    const conf = RISK_CONFIG[level] || RISK_CONFIG.minimal;
    return (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${conf.bg} ${conf.border} ${conf.glow}`}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: conf.color }} />
            <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: conf.color }}>
                {conf.label}
            </span>
        </div>
    );
};

/** Радарний графік факторів ризику */
const RadarChart: React.FC<{ factors: AMLFactor[] }> = ({ factors }) => {
    const indicators = factors.map(f => ({
        name: FACTOR_LABELS[f.category] || f.category,
        max: f.weight,
    }));
    const values = factors.map(f => f.detected ? f.weight : 0);

    const option = {
        backgroundColor: 'transparent',
        radar: {
            indicator: indicators,
            shape: 'polygon',
            center: ['50%', '50%'],
            radius: '70%',
            startAngle: 90,
            axisName: {
                color: 'rgba(148,163,184,0.8)',
                fontSize: 10,
                fontFamily: 'Inter, monospace',
                fontWeight: '700',
            },
            splitNumber: 4,
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
            splitArea: { areaStyle: { color: ['rgba(255,255,255,0.01)', 'rgba(255,255,255,0.02)'] } },
        },
        series: [{
            type: 'radar',
            data: [{
                value: values,
                name: 'AML Фактори',
                areaStyle: { color: 'rgba(244,63,94,0.15)' },
                lineStyle: { color: '#f43f5e', width: 2 },
                itemStyle: { color: '#f43f5e' },
                symbol: 'circle',
                symbolSize: 6,
            }],
        }],
    };

    return <ReactECharts option={option} style={{ height: '320px', width: '100%' }} theme="dark" />;
};

/** Картка одного фактору ризику */
const FactorCard: React.FC<{ factor: AMLFactor }> = ({ factor }) => {
    const label = FACTOR_LABELS[factor.category] || factor.category;
    const icon = FACTOR_ICONS[factor.category] || <AlertCircle size={14} />;
    const fillPct = (factor.weight / 100) * 100;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
                'p-5 rounded-2xl border transition-all',
                factor.detected
                    ? 'bg-rose-500/10 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                    : 'bg-slate-900/40 border-white/5'
            )}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <span className={factor.detected ? 'text-rose-400' : 'text-slate-600'}>{icon}</span>
                    <span className={`text-[11px] font-black uppercase tracking-wider ${factor.detected ? 'text-white' : 'text-slate-500'}`}>
                        {label}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-slate-600">ВАГА: {factor.weight}</span>
                    {factor.detected
                        ? <span className="text-[9px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">ВИЯВЛЕНО</span>
                        : <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">ЧИСТО</span>
                    }
                </div>
            </div>
            {/* Weight bar */}
            <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: factor.detected ? `${fillPct}%` : '0%' }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-rose-500 to-orange-500"
                />
            </div>
            {factor.detected && factor.details && (
                <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">{factor.details}</p>
            )}
        </motion.div>
    );
};

/** Велика цифра total_score */
const ScoreMeter: React.FC<{ score: number; level: string }> = ({ score, level }) => {
    const conf = RISK_CONFIG[level] || RISK_CONFIG.minimal;
    const strokePct = (score / 100) * Math.PI * 2 * 90;

    return (
        <div className="relative flex flex-col items-center gap-4">
            <div className="relative w-48 h-48">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                    {/* Track */}
                    <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="14" />
                    {/* Arc */}
                    <motion.circle
                        cx="100" cy="100" r="90"
                        fill="none"
                        stroke={conf.color}
                        strokeWidth="14"
                        strokeLinecap="round"
                        strokeDasharray={`${strokePct} ${Math.PI * 2 * 90 - strokePct}`}
                        initial={{ strokeDasharray: `0 ${Math.PI * 2 * 90}` }}
                        animate={{ strokeDasharray: `${strokePct} ${Math.PI * 2 * 90 - strokePct}` }}
                        transition={{ duration: 1.8, ease: 'easeOut' }}
                        style={{ filter: `drop-shadow(0 0 12px ${conf.color})` }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6, type: 'spring' }}
                        className="text-6xl font-black font-mono leading-none"
                        style={{ color: conf.color, textShadow: `0 0 20px ${conf.color}80` }}
                    >
                        {score}
                    </motion.span>
                    <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest mt-1">/ 100</span>
                </div>
            </div>
            <RiskBadge level={level} />
        </div>
    );
};

// ========================
// Головний компонент
// ========================

const AMLScoringView: React.FC = () => {
    // --- Стан форми ---
    const [entityId, setEntityId]     = useState('');
    const [entityName, setEntityName] = useState('');
    const [entityType, setEntityType] = useState<'organization' | 'person'>('organization');
    const [loading, setLoading]       = useState(false);
    const [result, setResult]         = useState<AMLResult | null>(null);
    const [error, setError]           = useState<string | null>(null);

    // --- Batch-режим ---
    const [batchMode, setBatchMode]   = useState(false);
    const [batchList, setBatchList]   = useState<BatchEntry[]>([]);
    const [batchResult, setBatchResult] = useState<any | null>(null);
    const [batchLoading, setBatchLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Каталог рівнів ---
    const [riskLevels, setRiskLevels] = useState<RiskLevelInfo[]>([]);
    const [liveTime, setLiveTime]     = useState(new Date().toLocaleTimeString('uk-UA'));

    useEffect(() => {
        const t = setInterval(() => setLiveTime(new Date().toLocaleTimeString('uk-UA')), 1000);
        return () => clearInterval(t);
    }, []);

    // Завантаження каталогу факторів
    useEffect(() => {
        api.get('/analytics/aml/risk-levels')
            .then((r: any) => setRiskLevels(r.data?.levels || []))
            .catch(() => setRiskLevels([
                { level: 'critical', range: '80-100', description: 'Критичний ризик — негайні дії' },
                { level: 'high',     range: '60-79',  description: 'Високий ризик — посилена перевірка' },
                { level: 'medium',   range: '40-59',  description: 'Середній ризик — моніторинг' },
                { level: 'low',      range: '20-39',  description: 'Низький ризик — стандартні процедури' },
                { level: 'minimal',  range: '0-19',   description: 'Мінімальний ризик' },
            ]));
    }, []);

    // --- Розрахунок одиночного скору ---
    const runScore = useCallback(async () => {
        if (!entityId.trim() || !entityName.trim()) return;
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await api.post('/analytics/aml/score', {
                entity_id:   entityId.trim(),
                entity_name: entityName.trim(),
                entity_type: entityType,
                data: {},
            });
            setResult(res.data);
        } catch (e: any) {
            setError(e?.response?.data?.detail || 'Помилка розрахунку AML-скору. Перевірте підключення до бекенду.');
        } finally {
            setLoading(false);
        }
    }, [entityId, entityName, entityType]);

    // --- Batch аналіз ---
    const runBatch = useCallback(async () => {
        if (batchList.length === 0) return;
        setBatchLoading(true);

        try {
            const res = await api.post('/analytics/aml/batch', {
                entities: batchList.map(e => ({
                    entity_id:   e.entity_id,
                    entity_name: e.entity_name,
                    entity_type: e.entity_type,
                    data: {},
                })),
            });
            setBatchResult(res.data);
        } catch (e: any) {
            setError(e?.response?.data?.detail || 'Помилка пакетного AML-аналізу.');
        } finally {
            setBatchLoading(false);
        }
    }, [batchList]);

    // --- CSV Import ---
    const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            const rows = text.split('\n').filter(Boolean).slice(1); // skip header
            const entries: BatchEntry[] = rows.map((row, i) => {
                const [entity_id, entity_name, entity_type] = row.split(',').map(s => s.trim());
                return {
                    id: String(i),
                    entity_id: entity_id || '',
                    entity_name: entity_name || '',
                    entity_type: (entity_type === 'person' ? 'person' : 'organization') as 'organization' | 'person',
                };
            }).filter(e => e.entity_id && e.entity_name);
            setBatchList(entries);
        };
        reader.readAsText(file);
    };

    const detectedCount = result ? result.factors.filter(f => f.detected).length : 0;

    return (
        <PageTransition>
            <div className="min-h-screen p-8 flex flex-col gap-8 relative overflow-hidden bg-[#020617]">
                <AdvancedBackground />

                {/* === ViewHeader === */}
                <ViewHeader
                    title="AML АНАЛІЗАТОР"
                    icon={<ShieldAlert className="text-rose-400" />}
                    breadcrumbs={['БЕЗПЕКА', 'КОМПЛАЄНС', 'AML СКОРІНГ v11.5']}
                    badges={[
                        { label: 'OSINT_HUB_v11.5_CERTIFIED', color: 'rose', icon: <Zap size={10} /> },
                        { label: 'CONSTITUTIONAL_SHIELD_ACTIVE', color: 'success', icon: <ShieldCheck size={10} /> },
                    ]}
                    stats={[
                        { label: 'Факторів ризику',  value: '10',      icon: <AlertTriangle />, color: 'danger'  },
                        { label: 'Рівнів небезпеки', value: '5',       icon: <BarChart3 />,     color: 'warning' },
                        { label: 'Batch-ліміт',      value: '100',     icon: <Database />,      color: 'primary' },
                        { label: 'Статус двигуна',   value: 'ОНЛАЙН',  icon: <Activity />,      color: 'success', animate: true },
                    ]}
                />

                {/* === Статус-бар === */}
                <div className="z-10 flex items-center gap-3 py-3 px-6 bg-slate-900/60 border border-white/5 rounded-2xl backdrop-blur-xl w-fit">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] font-mono">
                        AML_ENGINE_ONLINE // FACTORS: sanctions·criminal·tax·offshore·shell·pep·ubo·mgmt·fin·reg // {liveTime}
                    </span>
                </div>

                {/* === Режим: одиночний / batch === */}
                <div className="z-10 flex gap-4">
                    {[
                        { id: false, label: 'ОДИНОЧНИЙ АНАЛІЗ',    icon: <Target size={14} /> },
                        { id: true,  label: 'ПАКЕТНИЙ РЕЖИМ (CSV)', icon: <Upload size={14} /> },
                    ].map(({ id, label, icon }) => (
                        <button
                            key={String(id)}
                            onClick={() => setBatchMode(id)}
                            className={cn(
                                'flex items-center gap-3 px-8 py-4 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all',
                                batchMode === id
                                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                                    : 'bg-slate-900/40 border-white/5 text-slate-500 hover:border-white/20 hover:text-white'
                            )}
                        >
                            {icon} {label}
                        </button>
                    ))}
                </div>

                <div className="z-10 grid grid-cols-12 gap-8">
                    {/* ===== ЛІВА ПАНЕЛЬ: форма ===== */}
                    <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">

                        {!batchMode ? (
                            /* --- Single form --- */
                            <TacticalCard variant="holographic" className="p-8 flex flex-col gap-6">
                                <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                                    <Crosshair size={18} className="text-rose-400" /> ПАРАМЕТРИ СКРІНІНГУ
                                </h3>

                                {/* Тип сутності */}
                                <div className="flex gap-3">
                                    {(['organization', 'person'] as const).map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setEntityType(t)}
                                            className={cn(
                                                'flex-1 py-4 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all',
                                                entityType === t
                                                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                                                    : 'bg-slate-900/40 border-white/5 text-slate-500 hover:border-white/20'
                                            )}
                                        >
                                            {t === 'organization' ? <Building2 size={12} /> : <Users size={12} />}
                                            {t === 'organization' ? 'КОМПАНІЯ' : 'ОСОБА'}
                                        </button>
                                    ))}
                                </div>

                                {/* ЄДРПОУ / ID */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                        {entityType === 'organization' ? 'ЄДРПОУ' : 'РНОКПП / ІПН'}
                                    </label>
                                    <input
                                        type="text"
                                        value={entityId}
                                        onChange={e => setEntityId(e.target.value)}
                                        placeholder={entityType === 'organization' ? '00000000' : '0000000000'}
                                        className="bg-black/60 border border-white/10 rounded-xl px-6 py-4 text-white font-mono text-lg placeholder:text-slate-700 focus:outline-none focus:border-rose-500/40 transition-all"
                                    />
                                </div>

                                {/* Назва */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                        {entityType === 'organization' ? 'НАЗВА КОМПАНІЇ' : 'ПІБ ОСОБИ'}
                                    </label>
                                    <input
                                        type="text"
                                        value={entityName}
                                        onChange={e => setEntityName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && runScore()}
                                        placeholder={entityType === 'organization' ? 'ТОВ "Назва"...' : 'Прізвище Ім\'я...'}
                                        className="bg-black/60 border border-white/10 rounded-xl px-6 py-4 text-white placeholder:text-slate-700 focus:outline-none focus:border-rose-500/40 transition-all"
                                    />
                                </div>

                                {/* Кнопка */}
                                <button
                                    onClick={runScore}
                                    disabled={loading || !entityId || !entityName}
                                    className="w-full py-6 bg-rose-500 text-white font-black text-sm rounded-2xl uppercase tracking-widest hover:bg-rose-400 transition-all shadow-[0_0_30px_rgba(244,63,94,0.25)] disabled:opacity-40 flex items-center justify-center gap-3"
                                >
                                    {loading
                                        ? <><RefreshCw size={18} className="animate-spin" /> РОЗРАХУНОК...</>
                                        : <><Zap size={18} /> ЗАПУСТИТИ AML АНАЛІЗ</>
                                    }
                                </button>

                                {error && (
                                    <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3">
                                        <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                                        <p className="text-xs text-rose-300">{error}</p>
                                    </div>
                                )}
                            </TacticalCard>
                        ) : (
                            /* --- Batch form --- */
                            <TacticalCard variant="holographic" className="p-8 flex flex-col gap-6">
                                <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                                    <Upload size={18} className="text-rose-400" /> ПАКЕТНИЙ АНАЛІЗ
                                </h3>
                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                    Формат CSV: <code className="text-slate-400">entity_id, entity_name, entity_type</code><br />
                                    entity_type: <code className="text-slate-400">organization</code> або <code className="text-slate-400">person</code>
                                </p>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="py-6 border-2 border-dashed border-white/10 rounded-2xl text-slate-500 hover:border-rose-500/40 hover:text-rose-400 transition-all flex flex-col items-center gap-3"
                                >
                                    <Upload size={24} />
                                    <span className="text-[11px] font-black uppercase tracking-widest">ЗАВАНТАЖИТИ CSV</span>
                                </button>
                                <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />

                                {batchList.length > 0 && (
                                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-track-slate-900">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[9px] text-slate-500 uppercase tracking-widest">
                                                ЗАВАНТАЖЕНО: {batchList.length} ЗАПИСІВ
                                            </span>
                                            <button onClick={() => setBatchList([])} className="text-slate-600 hover:text-rose-400 transition-colors">
                                                <X size={14} />
                                            </button>
                                        </div>
                                        {batchList.map(e => (
                                            <div key={e.id} className="flex items-center justify-between px-4 py-2 bg-black/40 border border-white/5 rounded-xl">
                                                <span className="text-[10px] font-mono text-slate-400">{e.entity_id}</span>
                                                <span className="text-[10px] text-slate-500 max-w-[120px] truncate">{e.entity_name}</span>
                                                <Badge variant="outline" className="text-[8px] border-white/10 text-slate-600">{e.entity_type === 'organization' ? 'ТОВ' : 'ОСОБА'}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button
                                    onClick={runBatch}
                                    disabled={batchLoading || batchList.length === 0}
                                    className="w-full py-6 bg-rose-500 text-white font-black text-sm rounded-2xl uppercase tracking-widest hover:bg-rose-400 transition-all shadow-[0_0_30px_rgba(244,63,94,0.2)] disabled:opacity-40 flex items-center justify-center gap-3"
                                >
                                    {batchLoading
                                        ? <><RefreshCw size={18} className="animate-spin" /> АНАЛІЗ {batchList.length} ЗАПИСІВ...</>
                                        : <><Zap size={18} /> ЗАПУСТИТИ BATCH ({batchList.length})</>
                                    }
                                </button>
                            </TacticalCard>
                        )}

                        {/* Каталог рівнів ризику */}
                        <TacticalCard variant="cyber" className="p-8">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                                <Info size={14} /> ШКАЛА РИЗИКУ
                            </h3>
                            <div className="flex flex-col gap-2">
                                {riskLevels.map(l => {
                                    const conf = RISK_CONFIG[l.level] || RISK_CONFIG.minimal;
                                    return (
                                        <div key={l.level} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${conf.bg} border ${conf.border}`}>
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: conf.color }} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black uppercase" style={{ color: conf.color }}>{conf.label}</span>
                                                    <span className="text-[9px] font-mono text-slate-600">{l.range}</span>
                                                </div>
                                                <p className="text-[9px] text-slate-600 truncate">{l.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </TacticalCard>
                    </div>

                    {/* ===== ПРАВА ПАНЕЛЬ: результати ===== */}
                    <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
                        <AnimatePresence mode="wait">

                            {/* --- Batch результат --- */}
                            {batchMode && batchResult && (
                                <motion.div
                                    key="batch-result"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col gap-6"
                                >
                                    {/* Розподіл */}
                                    <TacticalCard variant="holographic" className="p-8">
                                        <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                            <BarChart3 size={18} className="text-rose-400" />
                                            РОЗПОДІЛ РИЗИКУ — {batchResult.total} СУТНОСТЕЙ
                                        </h3>
                                        <div className="grid grid-cols-5 gap-4">
                                            {Object.entries(batchResult.distribution || {}).map(([lvl, cnt]: any) => {
                                                const conf = RISK_CONFIG[lvl] || RISK_CONFIG.minimal;
                                                const pct = batchResult.total ? Math.round((cnt / batchResult.total) * 100) : 0;
                                                return (
                                                    <div key={lvl} className={`flex flex-col items-center gap-3 p-5 rounded-2xl ${conf.bg} border ${conf.border}`}>
                                                        <span className="text-3xl font-black font-mono" style={{ color: conf.color }}>{cnt}</span>
                                                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: conf.color }}>{conf.label}</span>
                                                        <span className="text-[9px] text-slate-600">{pct}%</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </TacticalCard>

                                    {/* Таблиця результатів */}
                                    <TacticalCard variant="holographic" className="p-8">
                                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-5">СПИСОК РЕЗУЛЬТАТІВ</h3>
                                        <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
                                            {batchResult.scores?.map((s: any) => {
                                                const conf = RISK_CONFIG[s.risk_level] || RISK_CONFIG.minimal;
                                                return (
                                                    <div key={s.entity_id} className={`flex items-center gap-5 px-5 py-4 rounded-xl border ${conf.border} ${conf.bg}`}>
                                                        <span className="text-sm font-black font-mono w-16 text-right" style={{ color: conf.color }}>{s.total_score}</span>
                                                        <span className="text-[10px] font-black text-white flex-1">{s.entity_name}</span>
                                                        <span className="text-[9px] font-mono text-slate-500">{s.entity_id}</span>
                                                        <RiskBadge level={s.risk_level} />
                                                        <span className="text-[9px] text-slate-600">{s.detected_factors} факторів</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </TacticalCard>
                                </motion.div>
                            )}

                            {/* --- Single result --- */}
                            {!batchMode && result && (
                                <motion.div
                                    key={result.entity_id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col gap-8"
                                >
                                    {/* KPI Header */}
                                    <TacticalCard variant="holographic" className="p-10 relative overflow-hidden">
                                        <div className="absolute -right-10 -top-10 opacity-5">
                                            <ShieldAlert size={200} className="text-rose-400" />
                                        </div>
                                        <div className="flex flex-col md:flex-row items-center gap-10">
                                            {/* Score meter */}
                                            <ScoreMeter score={result.total_score} level={result.risk_level} />

                                            {/* Entity info */}
                                            <div className="flex-1 flex flex-col gap-5">
                                                <div>
                                                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">{result.entity_name}</h2>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[10px] font-mono text-slate-500">ID: {result.entity_id}</span>
                                                        <Badge variant="outline" className="border-white/10 text-slate-500 text-[9px]">
                                                            {result.entity_type === 'organization' ? 'КОМПАНІЯ' : 'ОСОБА'}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                {/* Detected summary */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-4">
                                                        <AlertTriangle size={20} className="text-rose-400" />
                                                        <div>
                                                            <div className="text-2xl font-black text-rose-400">{detectedCount}</div>
                                                            <div className="text-[9px] text-slate-500 uppercase">Факторів виявлено</div>
                                                        </div>
                                                    </div>
                                                    <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-4">
                                                        <CheckCircle size={20} className="text-emerald-400" />
                                                        <div>
                                                            <div className="text-2xl font-black text-emerald-400">{result.factors.length - detectedCount}</div>
                                                            <div className="text-[9px] text-slate-500 uppercase">Факторів чисто</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Clock size={12} className="text-slate-600" />
                                                    <span className="text-[9px] font-mono text-slate-600">
                                                        РОЗРАХОВАНО: {new Date(result.calculated_at).toLocaleString('uk-UA')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </TacticalCard>

                                    {/* Radar + Factors */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <TacticalCard variant="holographic" className="p-8">
                                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">
                                                РАДАР ФАКТОРІВ РИЗИКУ
                                            </h3>
                                            <RadarChart factors={result.factors} />
                                        </TacticalCard>

                                        <TacticalCard variant="holographic" className="p-8">
                                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">
                                                ДЕТАЛЬНИЙ АНАЛІЗ ({result.factors.length} ФАКТОРІВ)
                                            </h3>
                                            <div className="flex flex-col gap-3 max-h-72 overflow-y-auto scrollbar-thin scrollbar-track-slate-900 pr-1">
                                                {result.factors
                                                    .sort((a, b) => Number(b.detected) - Number(a.detected) || b.weight - a.weight)
                                                    .map(f => <FactorCard key={f.category} factor={f} />)
                                                }
                                            </div>
                                        </TacticalCard>
                                    </div>

                                    {/* Рекомендації */}
                                    {result.recommendations?.length > 0 && (
                                        <TacticalCard variant="cyber" className="p-8 border-amber-500/20 bg-amber-500/5">
                                            <h3 className="text-[11px] font-black text-amber-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                                                <Flame size={14} /> РЕКОМЕНДАЦІЇ ЩОДО НАСТУПНИХ КРОКІВ
                                            </h3>
                                            <div className="flex flex-col gap-3">
                                                {result.recommendations.map((rec, i) => (
                                                    <div key={i} className="flex items-start gap-4 p-4 bg-black/40 border border-amber-500/10 rounded-xl">
                                                        <ChevronRight size={14} className="text-amber-400 shrink-0 mt-0.5" />
                                                        <p className="text-xs text-slate-300 leading-relaxed">{rec}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-4 mt-6">
                                                <button className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                                    <Download size={14} /> ЗБЕРЕГТИ ЗВІТ PDF
                                                </button>
                                                <button className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                                    <FileText size={14} /> ДОДАТИ ДО КЕЙСУ
                                                </button>
                                            </div>
                                        </TacticalCard>
                                    )}
                                </motion.div>
                            )}

                            {/* --- Заглушка --- */}
                            {!result && !batchResult && !loading && (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center py-40 gap-8 text-slate-700"
                                >
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-rose-500/10 blur-[100px] animate-pulse rounded-full" />
                                        <ShieldAlert size={100} className="opacity-10" />
                                    </div>
                                    <div className="text-center space-y-3">
                                        <p className="text-[13px] font-black uppercase tracking-[0.6em] animate-pulse italic">
                                            ОЧІКУВАННЯ ІДЕНТИФІКАТОРА СУТНОСТІ
                                        </p>
                                        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.3em]">
                                            ВВЕДІТЬ ЄДРПОУ ТА НАЗВУ ЛІВОРУЧ ДЛЯ ЗАПУСКУ AML АНАЛІЗУ
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* --- Loading --- */}
                            {loading && (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center py-40 gap-8"
                                >
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-rose-500/20 blur-3xl animate-pulse rounded-full" />
                                        <div className="w-24 h-24 border-t-2 border-r-2 border-rose-500 rounded-full animate-spin" />
                                    </div>
                                    <div className="text-center space-y-2">
                                        <p className="text-xs font-black text-rose-400 uppercase tracking-[0.5em] animate-pulse">АНАЛІЗ AML ФАКТОРІВ...</p>
                                        <p className="text-[9px] font-mono text-slate-600">ПЕРЕВІРКА 10 КАТЕГОРІЙ РИЗИКУ</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default AMLScoringView;
