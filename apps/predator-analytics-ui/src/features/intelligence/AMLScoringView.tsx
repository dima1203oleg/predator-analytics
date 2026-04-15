/**
 * PREDATOR v56.5-ELITE | AML Когнітивний Аналізатор
 *
 * Anti-Money Laundering Scoring Engine — повне підключення до бекенду.
 * Маршрут: /aml
 *
 * Sovereign Power Design · Classified · Tier-1
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
    ShieldCheck, Flame, Info, Crosshair, Network, Lock, Cpu, Fingerprint, Radar
} from 'lucide-react';
import ReactECharts from '@/components/ECharts';
import { apiClient as api } from '@/services/api';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
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
// Константи ELITE
// ========================

const RISK_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; glow: string }> = {
    critical: { label: 'КРИТИЧНИЙ',   color: '#E11D48', bg: 'bg-rose-950/20',    border: 'border-rose-500/40',    glow: 'shadow-[0_0_40px_rgba(225,29,72,0.3)]' },
    high:     { label: 'ВИСОКИЙ',     color: '#f97316', bg: 'bg-orange-900/20',  border: 'border-orange-500/40',  glow: 'shadow-[0_0_30px_rgba(249,115,22,0.2)]' },
    medium:   { label: 'СЕРЕДНІЙ',    color: '#D4AF37', bg: 'bg-yellow-900/20',   border: 'border-yellow-500/40',   glow: 'shadow-[0_0_30px_rgba(212,175,55,0.2)]' },
    low:      { label: 'НИЗЬКИЙ',     color: '#22c55e', bg: 'bg-emerald-900/20', border: 'border-emerald-500/40', glow: 'shadow-none' },
    minimal:  { label: 'МІНІМАЛЬНИЙ', color: '#06b6d4', bg: 'bg-cyan-900/20',    border: 'border-cyan-500/40',    glow: 'shadow-none' },
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
// Підкомпоненти ELITE
// ========================

const RiskBadge: React.FC<{ level: string }> = ({ level }) => {
    const conf = RISK_CONFIG[level] || RISK_CONFIG.minimal;
    return (
        <div className={cn("flex items-center gap-3 px-6 py-2 rounded-2xl border-2 italic", conf.bg, conf.border, conf.glow)}>
            <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: conf.color }} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: conf.color }}>
                {conf.label}
            </span>
        </div>
    );
};

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
            radius: '75%',
            startAngle: 90,
            axisName: {
                color: 'rgba(212,175,55,0.6)',
                fontSize: 10,
                fontFamily: 'Inter, monospace',
                fontWeight: '900',
                fontStyle: 'italic'
            },
            splitNumber: 5,
            axisLine: { lineStyle: { color: 'rgba(212,175,55,0.1)' } },
            splitLine: { lineStyle: { color: 'rgba(212,175,55,0.1)' } },
            splitArea: { areaStyle: { color: ['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.6)'] } },
        },
        series: [{
            type: 'radar',
            data: [{
                value: values,
                name: 'AML Фактори',
                areaStyle: { color: 'rgba(212,175,55,0.15)' },
                lineStyle: { color: '#D4AF37', width: 3 },
                itemStyle: { color: '#D4AF37' },
                symbol: 'diamond',
                symbolSize: 8,
            }],
        }],
    };

    return <ReactECharts option={option} style={{ height: '380px', width: '100%' }} theme="dark" />;
};

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
                'p-6 rounded-[2rem] border-2 transition-all relative overflow-hidden',
                factor.detected
                    ? 'bg-rose-500/10 border-rose-500/30 shadow-[0_0_20px_rgba(225,29,72,0.1)]'
                    : 'bg-black/60 border-white/5 hover:border-white/20'
            )}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <span className={factor.detected ? 'text-rose-500' : 'text-slate-700'}>{icon}</span>
                    <span className={cn("text-[11px] font-black uppercase tracking-widest italic", factor.detected ? 'text-white' : 'text-slate-600')}>
                        {label}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[9px] font-black font-mono text-slate-800 italic uppercase">WT: {factor.weight}</span>
                    {factor.detected
                        ? <span className="text-[9px] font-black text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">POSITIVE</span>
                        : <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">CLEAR_X</span>
                    }
                </div>
            </div>
            <div className="h-1.5 bg-black rounded-full overflow-hidden border border-white/5 shadow-inner">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: factor.detected ? `${fillPct}%` : '0%' }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className={cn("h-full shadow-[0_0_10px_currentColor]", factor.detected ? "bg-gradient-to-r from-rose-600 to-rose-400" : "bg-slate-900")}
                    style={{ color: factor.detected ? '#E11D48' : '#334155' }}
                />
            </div>
            {factor.detected && factor.details && (
                <p className="text-[10px] text-slate-500 mt-4 leading-relaxed italic font-medium uppercase tracking-tight">{factor.details}</p>
            )}
        </motion.div>
    );
};

const ScoreMeter: React.FC<{ score: number; level: string }> = ({ score, level }) => {
    const conf = RISK_CONFIG[level] || RISK_CONFIG.minimal;
    const strokePct = (score / 100) * Math.PI * 2 * 90;

    return (
        <div className="relative flex flex-col items-center gap-8">
            <div className="relative w-56 h-56">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="18" />
                    <motion.circle
                        cx="100" cy="100" r="90"
                        fill="none"
                        stroke={conf.color}
                        strokeWidth="18"
                        strokeLinecap="round"
                        strokeDasharray={`${strokePct} ${Math.PI * 2 * 90 - strokePct}`}
                        initial={{ strokeDasharray: `0 ${Math.PI * 2 * 90}` }}
                        animate={{ strokeDasharray: `${strokePct} ${Math.PI * 2 * 90 - strokePct}` }}
                        transition={{ duration: 2, ease: 'circOut' }}
                        style={{ filter: `drop-shadow(0 0 15px ${conf.color})` }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8, type: 'spring' }}
                        className="text-7xl font-black font-mono leading-none italic tracking-tighter"
                        style={{ color: conf.color, textShadow: `0 0 30px ${conf.color}60` }}
                    >
                        {score}
                    </motion.span>
                    <span className="text-[12px] text-slate-700 font-black uppercase tracking-[0.4em] mt-2 italic shadow-sm">SCORE_FIDELITY</span>
                </div>
            </div>
            <RiskBadge level={level} />
        </div>
    );
};

// ========================
// Головний компонент ELITE
// ========================

const AMLScoringView: React.FC = () => {
    const [entityId, setEntityId]     = useState('');
    const [entityName, setEntityName] = useState('');
    const [entityType, setEntityType] = useState<'organization' | 'person'>('organization');
    const [loading, setLoading]       = useState(false);
    const [result, setResult]         = useState<AMLResult | null>(null);
    const [error, setError]           = useState<string | null>(null);

    const [batchMode, setBatchMode]   = useState(false);
    const [batchList, setBatchList]   = useState<BatchEntry[]>([]);
    const [batchResult, setBatchResult] = useState<any | null>(null);
    const [batchLoading, setBatchLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [riskLevels, setRiskLevels] = useState<RiskLevelInfo[]>([]);
    const [liveTime, setLiveTime]     = useState(new Date().toLocaleTimeString('uk-UA'));

    useEffect(() => {
        const t = setInterval(() => setLiveTime(new Date().toLocaleTimeString('uk-UA')), 1000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        api.get('/analytics/aml/risk-levels')
            .then((r: any) => setRiskLevels(r.data?.levels || []))
            .catch(() => setRiskLevels([
                { level: 'critical', range: '80-100', description: 'Критичний ризик — блокировка / ДМС' },
                { level: 'high',     range: '60-79',  description: 'Високий ризик — посилена перевірка' },
                { level: 'medium',   range: '40-59',  description: 'Середній ризик — розширений моніторинг' },
                { level: 'low',      range: '20-39',  description: 'Низький ризик — стандартний протокол' },
                { level: 'minimal',  range: '0-19',   description: 'Мінімальний ризик — Green Path' },
            ]));
    }, []);

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
            setError(e?.response?.data?.detail || 'Помилка розрахунку. Перевірте зв\'язок з ядром PREDATOR.');
        } finally {
            setLoading(false);
        }
    }, [entityId, entityName, entityType]);

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
            setError(e?.response?.data?.detail || 'Помилка пакетного сканування.');
        } finally {
            setBatchLoading(false);
        }
    }, [batchList]);

    const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            const rows = text.split('\n').filter(Boolean).slice(1);
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
            <div className="min-h-screen p-12 flex flex-col gap-12 relative overflow-hidden bg-[#020202]">
                <AdvancedBackground />
                <CyberGrid color="rgba(212, 175, 55, 0.04)" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(225,29,72,0.06),transparent_70%)] pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(212,175,55,0.03),transparent_60%)] pointer-events-none" />

                {/* === ViewHeader ELITE === */}
                <ViewHeader
                    title={
                        <div className="flex items-center gap-10">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-rose-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                                <div className="relative p-7 bg-black border-2 border-rose-500/40 rounded-[2.5rem] shadow-4xl transform -rotate-2 hover:rotate-0 transition-all">
                                    <ShieldAlert size={42} className="text-rose-500 shadow-[0_0_20px_#e11d48]" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-4">
                                    <span className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-4 py-1 text-[10px] font-black tracking-[0.4em] uppercase italic rounded-lg">
                                        COMPLIANCE_ENGINE // AML_SCORING
                                    </span>
                                    <div className="h-px w-12 bg-rose-500/20" />
                                    <span className="text-[10px] font-black text-rose-800 font-mono tracking-widest uppercase italic shadow-sm">v56.5-ELITE</span>
                                </div>
                                <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-3deg] leading-none">
                                    AML <span className="text-rose-600 underline decoration-rose-600/30 decoration-[14px] underline-offset-[12px] italic uppercase tracking-tighter">СКОРІНГ</span>
                                </h1>
                            </div>
                        </div>
                    }
                    breadcrumbs={['БЕЗПЕКА', 'КОМПЛАЄНС', 'AML_COGNITIVE_ARRAY']}
                    badges={[
                        { label: 'SOVEREIGN_ELITE_v56.5', color: 'rose', icon: <Zap size={10} /> },
                        { label: 'CLASSIFIED_T1_ACCESS', color: 'primary', icon: <Lock size={10} /> },
                    ]}
                    stats={[
                        { label: 'ФАКТОРІВ_РИЗИКУ',  value: '10',      icon: <AlertTriangle />, color: 'danger'  },
                        { label: 'ВАРІАНТІВ_ВЕРДИКТУ', value: '5',       icon: <BarChart3 />,     color: 'warning' },
                        { label: 'BATCH_RESERVE',      value: '100',     icon: <Database />,      color: 'primary' },
                        { label: 'STATUS_CORE',   value: 'ACTIVE',  icon: <Activity />,      color: 'success', animate: true },
                    ]}
                />

                {/* === Статус-бар ELITE === */}
                <div className="z-10 flex items-center gap-6 py-4 px-8 bg-black border-2 border-white/5 rounded-[2rem] shadow-4xl backdrop-blur-3xl w-fit">
                    <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-rose-600 animate-pulse shadow-[0_0_8px_#e11d48]" />
                        <span className="text-[11px] font-black text-rose-500 uppercase tracking-[0.5em] font-mono italic">
                            ENGINE_STATUS: NOMINAL // SCANNING_MODE: DEEP_COGNITIVE // {liveTime}
                        </span>
                    </div>
                </div>

                {/* === Режими ELITE === */}
                <div className="z-10 flex gap-6">
                    {[
                        { id: false, label: 'ОДИНОЧНИЙ_АНАЛІЗ_ELITE',    icon: <Target size={18} /> },
                        { id: true,  label: 'ПАКЕТНИЙ_ДЕПЛОЙ_CSV', icon: <Upload size={18} /> },
                    ].map(({ id, label, icon }) => (
                        <button
                            key={String(id)}
                            onClick={() => setBatchMode(id)}
                            className={cn(
                                'flex items-center gap-4 px-10 py-5 rounded-[2rem] border-2 text-[10px] font-black uppercase tracking-[0.3em] italic transition-all shadow-xl',
                                batchMode === id
                                    ? 'bg-rose-600 border-rose-500 text-white shadow-4xl scale-105'
                                    : 'bg-black border-white/5 text-slate-600 hover:border-rose-500/30 hover:text-rose-400'
                            )}
                        >
                            {icon} {label}
                        </button>
                    ))}
                </div>

                <div className="z-10 grid grid-cols-12 gap-12">
                    {/* ===== ЛІВА ПАНЕЛЬ: форма ELITE ===== */}
                    <div className="col-span-12 lg:col-span-4 flex flex-col gap-10">

                        {!batchMode ? (
                            <TacticalCard variant="holographic" className="p-10 flex flex-col gap-8 rounded-[3.5rem] border-rose-500/10 shadow-4xl bg-black/60 backdrop-blur-3xl">
                                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-4 italic font-serif">
                                    <Crosshair size={24} className="text-rose-500 animate-pulse" /> SCAN_PARAMETERS_TI
                                </h3>

                                <div className="flex gap-4">
                                    {(['organization', 'person'] as const).map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setEntityType(t)}
                                            className={cn(
                                                'flex-1 py-5 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-4 transition-all italic',
                                                entityType === t
                                                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 shadow-xl'
                                                    : 'bg-black border-white/5 text-slate-700 hover:border-white/20'
                                            )}
                                        >
                                            {t === 'organization' ? <Building2 size={16} /> : <Users size={16} />}
                                            {t === 'organization' ? 'КОМПАНІЯ' : 'ОСОБА'}
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    <div className="flex flex-col gap-3">
                                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] italic pl-2">
                                            {entityType === 'organization' ? 'EDRPOU_IDENT' : 'TAX_IDENTIFIER'}
                                        </label>
                                        <input
                                            type="text"
                                            value={entityId}
                                            onChange={e => setEntityId(e.target.value)}
                                            placeholder={entityType === 'organization' ? '00000000' : '0000000000'}
                                            className="bg-black border-2 border-white/5 rounded-2xl px-8 py-5 text-white font-mono text-xl placeholder:text-slate-900 focus:outline-none focus:border-rose-500/40 transition-all italic tracking-tighter"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] italic pl-2">
                                            {entityType === 'organization' ? 'ENTITY_LEGAL_NAME' : 'INDIVIDUAL_FULL_NAME'}
                                        </label>
                                        <input
                                            type="text"
                                            value={entityName}
                                            onChange={e => setEntityName(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && runScore()}
                                            placeholder={entityType === 'organization' ? 'ТОВ "Назва"...' : 'Прізвище Ім\'я...'}
                                            className="bg-black border-2 border-white/5 rounded-2xl px-8 py-5 text-white text-lg placeholder:text-slate-900 focus:outline-none focus:border-rose-500/40 transition-all italic tracking-tight"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={runScore}
                                    disabled={loading || !entityId || !entityName}
                                    className="w-full py-8 bg-rose-600 text-white font-black text-sm rounded-[2rem] uppercase tracking-[0.4em] italic hover:brightness-110 transition-all shadow-4xl disabled:opacity-40 flex items-center justify-center gap-6 font-bold border-4 border-rose-500/20"
                                >
                                    {loading
                                        ? <><RefreshCw size={24} className="animate-spin" /> ANALYZING_COGNITIVE...</>
                                        : <><Zap size={24} className="shadow-[0_0_15px_#fff]" /> EXECUTE_SCAN</>
                                    }
                                </button>

                                {error && (
                                    <div className="p-6 bg-rose-950/20 border-2 border-rose-500/30 rounded-2xl flex items-start gap-5 shadow-inner">
                                        <AlertCircle size={20} className="text-rose-500 shrink-0 mt-1" />
                                        <p className="text-[11px] text-rose-300 font-black uppercase italic leading-relaxed">{error}</p>
                                    </div>
                                )}
                            </TacticalCard>
                        ) : (
                            <TacticalCard variant="holographic" className="p-10 flex flex-col gap-8 rounded-[3.5rem] border-rose-500/10 shadow-4xl bg-black/60 backdrop-blur-3xl">
                                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-4 italic font-serif">
                                    <Upload size={24} className="text-rose-500" /> MASS_ARRAY_INGESTION
                                </h3>
                                <p className="text-[10px] text-slate-700 leading-relaxed uppercase font-black tracking-widest bg-white/[0.02] p-4 rounded-xl border border-white/5 italic">
                                    FORMAT: entity_id, name, type (org/pers) // LIMIT: 100_NODES
                                </p>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="py-12 border-4 border-dashed border-white/5 rounded-[2.5rem] text-slate-700 hover:border-rose-500/40 hover:text-rose-500 transition-all flex flex-col items-center gap-6 bg-black/40 group shadow-inner"
                                >
                                    <Upload size={40} className="group-hover:scale-110 transition-transform opacity-40 group-hover:opacity-100" />
                                    <span className="text-[11px] font-black uppercase tracking-[0.4em] italic">IMPORT_TARGET_CSV</span>
                                </button>
                                <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />

                                {batchList.length > 0 && (
                                    <div className="flex flex-col gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] text-yellow-600 font-black uppercase tracking-[0.4em] italic">
                                                INGESTED: {batchList.length}_NODES
                                            </span>
                                            <button onClick={() => setBatchList([])} className="p-2 text-slate-800 hover:text-rose-500 transition-colors">
                                                <X size={18} />
                                            </button>
                                        </div>
                                        {batchList.map(e => (
                                            <div key={e.id} className="flex items-center justify-between px-6 py-4 bg-black border-2 border-white/5 rounded-2xl group hover:border-white/20 transition-all">
                                                <span className="text-[12px] font-mono text-slate-500 group-hover:text-white italic">{e.entity_id}</span>
                                                <span className="text-[12px] text-slate-700 font-black uppercase truncate max-w-[140px] italic">{e.entity_name}</span>
                                                <Badge variant="outline" className="text-[8px] border-white/10 text-slate-800 font-black uppercase italic">{e.entity_type === 'organization' ? 'ORG' : 'INDV'}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button
                                    onClick={runBatch}
                                    disabled={batchLoading || batchList.length === 0}
                                    className="w-full py-8 bg-rose-600 text-white font-black text-sm rounded-[2rem] uppercase tracking-[0.4em] italic hover:brightness-110 transition-all shadow-4xl disabled:opacity-40 flex items-center justify-center gap-6 font-bold border-4 border-rose-500/20"
                                >
                                    {batchLoading
                                        ? <><RefreshCw size={24} className="animate-spin" /> SCANNING_ARRAY...</>
                                        : <><Zap size={24} /> EXECUTE_BATCH_SCAN</>
                                    }
                                </button>
                            </TacticalCard>
                        )}

                        {/* Шкала ризику ELITE */}
                        <TacticalCard variant="cyber" className="p-10 rounded-[3.5rem] border-white/5 bg-black/40 shadow-inner">
                            <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-[0.5em] mb-8 flex items-center gap-4 italic font-bold">
                                <Info size={16} className="text-yellow-600/40" /> RISK_VALUATION_MATRIX
                            </h3>
                            <div className="flex flex-col gap-4">
                                {riskLevels.map(l => {
                                    const conf = RISK_CONFIG[l.level] || RISK_CONFIG.minimal;
                                    return (
                                        <div key={l.level} className={cn("flex items-center gap-5 px-6 py-4 rounded-[2rem] border-2 italic group hover:scale-[1.02] transition-transform", conf.bg, conf.border)}>
                                            <span className="w-3 h-3 rounded-full shrink-0 shadow-[0_0_8px_currentColor]" style={{ backgroundColor: conf.color }} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[12px] font-black uppercase tracking-widest leading-none" style={{ color: conf.color }}>{conf.label}</span>
                                                    <span className="text-[10px] font-black font-mono text-slate-800">{l.range}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-700 font-black uppercase tracking-tight truncate italic group-hover:text-slate-500 transition-colors">{l.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </TacticalCard>
                    </div>

                    {/* ===== ПРАВА ПАНЕЛЬ: результати ELITE ===== */}
                    <div className="col-span-12 lg:col-span-8 flex flex-col gap-10">
                        <AnimatePresence mode="wait">

                            {/* --- Batch результат ELITE --- */}
                            {batchMode && batchResult && (
                                <motion.div
                                    key="batch-result"
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className="flex flex-col gap-10"
                                >
                                    <TacticalCard variant="holographic" className="p-12 rounded-[4rem] border-rose-500/10 shadow-4xl bg-black/80 backdrop-blur-3xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none">
                                            <BarChart3 size={300} className="text-rose-500" />
                                        </div>
                                        <h3 className="text-[16px] font-black text-white uppercase tracking-[0.5em] mb-12 flex items-center gap-8 italic font-serif">
                                            <BarChart3 size={32} className="text-rose-500" />
                                            ARRAY_DISTRIBUTION // {batchResult.total}_NODES_SCANNED
                                        </h3>
                                        <div className="grid grid-cols-5 gap-6 relative z-10">
                                            {Object.entries(batchResult.distribution || {}).map(([lvl, cnt]: any) => {
                                                const conf = RISK_CONFIG[lvl] || RISK_CONFIG.minimal;
                                                const pct = batchResult.total ? Math.round((cnt / batchResult.total) * 100) : 0;
                                                return (
                                                    <div key={lvl} className={cn("flex flex-col items-center gap-5 p-8 rounded-[2.5rem] border-2 italic group hover:bg-white/[0.02] transition-all", conf.bg, conf.border)}>
                                                        <span className="text-5xl font-black font-mono leading-none tracking-tighter" style={{ color: conf.color, textShadow: `0 0 15px ${conf.color}40` }}>{cnt}</span>
                                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] font-serif" style={{ color: conf.color }}>{conf.label.split(' ')[0]}</span>
                                                        <div className="w-full h-1 bg-black rounded-full overflow-hidden mt-2 border border-white/5">
                                                            <div className="h-full bg-slate-900" style={{ width: `${pct}%`, backgroundColor: conf.color }} />
                                                        </div>
                                                        <span className="text-[9px] font-black text-slate-800 mt-2">{pct}%_SHARE</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </TacticalCard>

                                    <TacticalCard variant="holographic" className="p-12 rounded-[4rem] border-white/5 shadow-4xl bg-black/60 relative overflow-hidden">
                                        <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-[0.5em] mb-10 italic font-serif">BATCH_ENTRY_LEDGER // FULL_DISCLOSURE</h3>
                                        <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-4">
                                            {batchResult.scores?.map((s: any) => {
                                                const conf = RISK_CONFIG[s.risk_level] || RISK_CONFIG.minimal;
                                                return (
                                                    <div key={s.entity_id} className={cn("flex items-center gap-10 px-8 py-6 rounded-[2.5rem] border-2 italic group hover:bg-white/[0.02] transition-all", conf.border, conf.bg)}>
                                                        <div className="flex flex-col items-end min-w-[100px] border-r-2 border-slate-900 pr-10">
                                                            <span className="text-4xl font-black font-mono italic leading-none" style={{ color: conf.color }}>{s.total_score}</span>
                                                            <span className="text-[8px] font-black text-slate-800 uppercase tracking-widest mt-2">{conf.label.split(' ')[0]}</span>
                                                        </div>
                                                        <div className="flex-1 space-y-2">
                                                            <span className="text-xl font-black text-white italic font-serif group-hover:text-rose-500 transition-colors uppercase leading-none">{s.entity_name}</span>
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-[10px] font-mono text-slate-700 uppercase tracking-[0.3em] italic">IDENT: {s.entity_id}</span>
                                                                <div className="h-px w-6 bg-slate-900" />
                                                                <span className="text-[9px] font-black text-slate-800 uppercase tracking-[0.4em] italic leading-none">{s.detected_factors}_RISK_VECTORS</span>
                                                            </div>
                                                        </div>
                                                        <ChevronRight size={24} className="text-slate-900 group-hover:text-white transition-colors" />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </TacticalCard>
                                </motion.div>
                            )}

                            {/* --- Single result ELITE --- */}
                            {!batchMode && result && (
                                <motion.div
                                    key={result.entity_id}
                                    initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                    className="flex flex-col gap-10"
                                >
                                    <TacticalCard variant="holographic" className="p-12 rounded-[5rem] border-rose-500/10 shadow-4xl bg-black relative overflow-hidden">
                                        <div className="absolute -right-16 -top-16 p-32 opacity-5 pointer-events-none group-hover:scale-125 transition-transform duration-[10s]">
                                            <ShieldAlert size={400} className="text-rose-500" />
                                        </div>
                                        <div className="flex flex-col xl:flex-row items-center gap-16 relative z-10">
                                            <ScoreMeter score={result.total_score} level={result.risk_level} />

                                            <div className="flex-1 flex flex-col gap-10">
                                                <div>
                                                    <div className="flex items-center gap-6 mb-4">
                                                        <span className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-4 py-1 text-[10px] font-black tracking-[0.4em] uppercase italic rounded-lg">
                                                            IDENTIFIED_TARGET
                                                        </span>
                                                        <div className="h-px w-10 bg-rose-500/20" />
                                                        <span className="text-[10px] font-black text-slate-800 font-mono tracking-widest uppercase italic">X_COGNITIVE_ARRAY</span>
                                                    </div>
                                                    <h2 className="text-5xl font-black text-white uppercase tracking-tighter italic font-serif leading-none mb-6">{result.entity_name}</h2>
                                                    <div className="flex items-center gap-6">
                                                        <div className="flex items-center gap-3 bg-white/5 px-5 py-2 rounded-xl border border-white/5">
                                                            <Fingerprint size={14} className="text-slate-700" />
                                                            <span className="text-[11px] font-mono text-slate-500 uppercase italic">UID: {result.entity_id}</span>
                                                        </div>
                                                        <Badge variant="outline" className="border-white/5 text-slate-700 text-[9px] px-4 py-2 uppercase font-black tracking-[0.3em] bg-black italic">
                                                            {result.entity_type === 'organization' ? 'LEGAL_ENTITY' : 'INDIVIDUAL_NODE'}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-8">
                                                    <div className="p-8 bg-rose-950/20 border-2 border-rose-500/20 rounded-[2.5rem] flex items-center gap-8 shadow-inner group hover:border-rose-500/40 transition-all">
                                                        <div className="p-4 bg-black rounded-2xl border-2 border-rose-600/20 text-rose-600 group-hover:scale-110 transition-transform">
                                                            <AlertTriangle size={32} className="animate-pulse" />
                                                        </div>
                                                        <div>
                                                            <div className="text-4xl font-black text-rose-500 font-mono italic tracking-tighter leading-none mb-2">{detectedCount}</div>
                                                            <div className="text-[10px] text-slate-700 uppercase font-black tracking-widest italic leading-none">VECTORS_DETECTED</div>
                                                        </div>
                                                    </div>
                                                    <div className="p-8 bg-emerald-950/20 border-2 border-emerald-500/20 rounded-[2.5rem] flex items-center gap-8 shadow-inner group hover:border-emerald-500/40 transition-all">
                                                        <div className="p-4 bg-black rounded-2xl border-2 border-emerald-600/20 text-emerald-600 group-hover:scale-110 transition-transform">
                                                            <CheckCircle size={32} />
                                                        </div>
                                                        <div>
                                                            <div className="text-4xl font-black text-emerald-500 font-mono italic tracking-tighter leading-none mb-2">{result.factors.length - detectedCount}</div>
                                                            <div className="text-[10px] text-slate-700 uppercase font-black tracking-widest italic leading-none">INTEGRITY_SAFE</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 pt-4 opacity-30">
                                                    <Clock size={14} className="text-slate-700" />
                                                    <span className="text-[10px] font-mono text-slate-800 uppercase italic tracking-widest">
                                                        TIMESTAMP: {new Date(result.calculated_at).toLocaleString('uk-UA').toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </TacticalCard>

                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                                        <TacticalCard variant="holographic" className="p-10 rounded-[4rem] border-white/5 bg-black/80 backdrop-blur-3xl shadow-4xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                               <Radar size={150} className="text-yellow-600" />
                                            </div>
                                            <h3 className="text-[11px] font-black text-yellow-600/70 uppercase tracking-[0.5em] mb-10 italic font-serif">
                                                COGNITIVE_RISK_TOPOLOGY
                                            </h3>
                                            <RadarChart factors={result.factors} />
                                        </TacticalCard>

                                        <TacticalCard variant="holographic" className="p-10 rounded-[4rem] border-white/5 bg-black/80 backdrop-blur-3xl shadow-4xl relative overflow-hidden">
                                            <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-[0.5em] mb-10 italic font-serif">
                                                VECTOR_DISCLOSURE // {result.factors.length}_ANALYZED
                                            </h3>
                                            <div className="flex flex-col gap-4 max-h-[380px] overflow-y-auto custom-scrollbar pr-4">
                                                {result.factors
                                                    .sort((a, b) => Number(b.detected) - Number(a.detected) || b.weight - a.weight)
                                                    .map(f => <FactorCard key={f.category} factor={f} />)
                                                }
                                            </div>
                                        </TacticalCard>
                                    </div>

                                    {/* Рекомендації ELITE */}
                                    {result.recommendations?.length > 0 && (
                                        <TacticalCard variant="cyber" className="p-12 rounded-[5rem] border-rose-500/20 bg-rose-950/10 shadow-4xl relative overflow-hidden">
                                            <div className="absolute -left-12 -top-12 opacity-5 rotate-45 pointer-events-none">
                                                 <Flame size={200} className="text-rose-500" />
                                            </div>
                                            <h3 className="text-2xl font-black text-rose-500 uppercase tracking-[0.4em] mb-12 flex items-center gap-6 italic font-serif">
                                                <Flame size={32} className="animate-pulse" /> STRATEGIC_MITIGATION_VERDICTS
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                                {result.recommendations.map((rec, i) => (
                                                    <div key={i} className="flex items-start gap-6 p-8 bg-black border-2 border-rose-500/10 rounded-[2.5rem] group hover:border-rose-500/30 transition-all shadow-inner">
                                                        <ChevronRight size={24} className="text-rose-600 shrink-0 mt-1 transform group-hover:translate-x-1 transition-transform" />
                                                        <p className="text-[13px] font-black text-slate-300 leading-relaxed italic uppercase tracking-tight">{rec}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-8 mt-12 relative z-10">
                                                <button className="flex-1 py-6 bg-white/[0.02] border-2 border-white/5 rounded-[2rem] text-[11px] font-black text-slate-600 uppercase tracking-[0.3em] italic hover:text-white hover:bg-rose-600 hover:border-rose-500 transition-all flex items-center justify-center gap-5 shadow-xl font-bold">
                                                    <Download size={24} /> DOWNLOAD_FORENSIC_PDF
                                                </button>
                                                <button className="flex-1 py-6 bg-white/[0.02] border-2 border-white/5 rounded-[2rem] text-[11px] font-black text-slate-600 uppercase tracking-[0.3em] italic hover:text-white hover:bg-yellow-600 hover:border-yellow-500 transition-all flex items-center justify-center gap-5 shadow-xl font-bold">
                                                    <FileText size={24} /> PUSH_TO_TARGET_CASE
                                                </button>
                                            </div>
                                        </TacticalCard>
                                    )}
                                </motion.div>
                            )}

                            {/* --- Заглушка ELITE --- */}
                            {!result && !batchResult && !loading && (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center py-60 gap-12 text-slate-800"
                                >
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-rose-500/10 blur-[150px] animate-pulse rounded-full group-hover:bg-rose-500/20 transition-all duration-[5s]" />
                                        <ShieldAlert size={140} className="opacity-5 transform group-hover:scale-110 transition-transform duration-[10s]" />
                                    </div>
                                    <div className="text-center space-y-6 relative z-10">
                                        <p className="text-[18px] font-black uppercase tracking-[1em] animate-pulse italic text-slate-700">
                                            AWAITING_TARGET_SIGNAL
                                        </p>
                                        <div className="h-px w-32 bg-slate-900 mx-auto" />
                                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.5em] italic">
                                            ІНІЦІЮЙТЕ СКАНУВАННЯ ЧЕРЕЗ ТЕРМІНАЛ ПАРАМЕТРІВ
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* --- Loading ELITE --- */}
                            {loading && (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center py-60 gap-12"
                                >
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-rose-500/20 blur-[100px] animate-pulse rounded-full" />
                                        <div className="w-32 h-32 border-t-4 border-r-4 border-rose-600 rounded-full animate-spin shadow-[0_0_30px_rgba(225,29,72,0.4)]" />
                                        <Zap size={32} className="absolute inset-0 m-auto text-rose-500 animate-pulse" />
                                    </div>
                                    <div className="text-center space-y-4">
                                        <p className="text-xl font-black text-rose-500 uppercase tracking-[0.6em] animate-pulse italic font-serif">AML_COGNITIVE_SCAN_IN_PROGRESS</p>
                                        <p className="text-[11px] font-black text-slate-700 uppercase tracking-[0.4em] italic leading-none border-b border-slate-900 pb-2">DECRYPTING_10_CATEGORIES // SOVEREIGN_CORE</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
                <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar{width:6px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(225,29,72,.15);border-radius:20px;border:2px solid black}.custom-scrollbar::-webkit-scrollbar-thumb:hover{background:rgba(225,29,72,.3)}` }} />
            </div>
        </PageTransition>
    );
};

export default AMLScoringView;
