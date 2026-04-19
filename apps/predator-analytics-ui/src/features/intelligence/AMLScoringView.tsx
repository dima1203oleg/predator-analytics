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
import { analyticsService, AMLResult, AMLFactor, BatchResultData } from '@/services/unified/analytics.service';
import { RiskLevelValue } from '@/types/intelligence';
import { AxiosError } from 'axios';

import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/TacticalCard';
import { CyberGrid } from '@/components/CyberGrid';
import { ViewHeader } from '@/components/ViewHeader';
import { DiagnosticsTerminal } from '@/components/intelligence/DiagnosticsTerminal';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { SovereignAudio } from '@/utils/sovereign-audio';

// ========================
// Типи
// ========================

// Використовуємо типи з analyticsService
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
// Константи WRAITH
// ========================

const RISK_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; glow: string }> = {
    critical: { label: 'КРИТИЧНИЙ',   color: '#E11D48', bg: 'bg-rose-950/20',    border: 'border-rose-500/40',    glow: 'shadow-[0_0_40px_rgba(225,29,72,0.3)]' },
    high:     { label: 'ВИСОКИЙ',     color: '#9F1239', bg: 'bg-crimson-950/20', border: 'border-rose-700/40',   glow: 'shadow-[0_0_30px_rgba(159,18,57,0.2)]' },
    medium:   { label: 'СЕРЕДНІЙ',    color: '#E11D48', bg: 'bg-rose-900/20',   border: 'border-rose-500/40',   glow: 'shadow-[0_0_30px_rgba(225,29,72,0.2)]' },
    low:      { label: 'НИЗЬКИЙ',     color: '#71717a', bg: 'bg-zinc-900/20',     border: 'border-zinc-500/40',     glow: 'shadow-none' },
    minimal:  { label: 'МІНІМАЛЬНИЙ', color: '#3f3f46', bg: 'bg-zinc-950/20',     border: 'border-zinc-800/40',     glow: 'shadow-none' },
};

const FACTOR_LABELS: Record<string, string> = {
    sanctions:            'Санкційні списки',
    criminal:             'Кримінальні справи',
    tax:                  'Податкові борги',
    offshore:             'Офшорні зв\'язки',
    shell_company:        'Ознаки фіктивності',
    pep:                  'Політ. значуща особа',
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
// Підкомпоненти WRAITH
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
        name: FACTOR_LABELS[f.category as keyof typeof FACTOR_LABELS] || f.name || f.category,
        max: f.weight || 100,
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
                color: 'rgba(225,29,72,0.6)',
                fontSize: 10,
                fontFamily: 'Inter, monospace',
                fontWeight: '900',
                fontStyle: 'italic'
            },
            splitNumber: 5,
            axisLine: { lineStyle: { color: 'rgba(225,29,72,0.1)' } },
            splitLine: { lineStyle: { color: 'rgba(225,29,72,0.1)' } },
            splitArea: { areaStyle: { areaStyle: { color: ['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.6)'] } } },
        },
        series: [{
            type: 'radar',
            data: [{
                value: values,
                name: 'AML Фактори',
                areaStyle: { color: 'rgba(225,29,72,0.15)' },
                areaColor: 'rgba(225, 29, 72, 0.4)',
                lineStyle: { color: '#E11D48', width: 3 },
                itemStyle: { color: '#E11D48' },
                symbol: 'diamond',
                symbolSize: 8,
            }],
        }],
    };

    return <ReactECharts option={option} style={{ height: '380px', width: '100%' }} theme="dark" />;
};

// ========================
// Background Scanning HUD
// ========================

const WRAITH_Overlay: React.FC = () => (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden mix-blend-overlay opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
        <div className="absolute inset-0 animate-scanline bg-[linear-gradient(to_bottom,transparent_0%,rgba(225,29,72,0.02)_50%,transparent_100%)] bg-[length:100%_4px]" />
        <div className="absolute inset-0 bg-noise opacity-10" />
    </div>
);

const ScanningHUD: React.FC<{ vramStatus: 'nominal' | 'warning' | 'critical' }> = ({ vramStatus }) => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-20">
            {/* Лазерна лінія */}
            <motion.div
                animate={{ y: ['-10%', '110%'] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className={cn(
                    "absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent to-transparent shadow-[0_0_20px_rgba(225,29,72,0.3)]",
                    vramStatus === 'critical' ? 'via-rose-500/80 shadow-[0_0_30px_rgba(244,63,94,0.5)]' : 'via-rose-500/50'
                ) uppercase}
            />

            {/* Координати та цифри */}
            <div className="absolute top-20 right-10 flex flex-col items-end gap-1 font-mono text-[8px] text-rose-500/40 italic">
                {[...Array(5)].map((_, i) => (
                    <motion.span
                        key={i}
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
                    >
                        ШИР: {Math.random().toFixed(4)} // ДОВ: {Math.random().toFixed(4)}
                    </motion.span>
                ))}
            </div>

            <div className="absolute bottom-24 left-10 flex flex-col gap-1 font-mono text-[8px] text-rose-500/40 italic">
                <span className={cn("uppercase tracking-[0.3em] font-black", vramStatus === 'critical' ? 'text-rose-500 animate-pulse' : '')}>
                    {vramStatus === 'critical' ? 'CUDA_GUARD: ОБМЕЖЕННЯ_АКТИВНЕ' : 'ЯДРО_ТЕМП: 42°C'}
                </span>
                <span className="uppercase tracking-[0.3em] font-black">НАВАНТАЖЕННЯ: {Math.floor(Math.random() * 100)}%</span>
                <span className="uppercase tracking-[0.3em] font-black">ЦІЛІСНІСТЬ_КЛАСТЕРА: 99.8%</span>
                <span className="uppercase tracking-[0.3em] font-black">АКТИВНИЙ_ПРОТОКОЛ: SOVEREIGN_v3.0_ELITE</span>
            </div>
        </div>
    );
};

// ========================
// Live Cognitive Terminal v57.2
// ========================

const CognitiveParsingTerminal: React.FC<{ active: boolean; targetName: string; mode: 'SOVEREIGN' | 'HYBRID' | 'CLOUD' }> = ({ active, targetName, mode }) => {
    const [lines, setLines] = useState<string[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    const CHUNKS_SOVEREIGN = [
        "NEMOTRON: ПЕРЕВІРКА_ЛОКАЛЬНИХ_РЕЄСТРІВ...",
        "SURGICAL_CODER: ВАЛІДАЦІЯ_ХЕШІВ_ЄДРПОУ",
        "БЕЗПЕКА: AIR_GAPPED_АНАЛІЗ_АКТИВНО",
        "ОБМЕЖЕННЯ: VRAM_LIMIT_GUARD",
        "СИНТЕЗ: ЛОКАЛЬНА_РЕКОНСТРУКЦІЯ..."
    ];

    const CHUNKS_CLOUD = [
        "GLM-5.1: СИНТЕЗ_КРИМІНАЛІСТИЧНИХ_ЗВ'ЯЗКІВ...",
        "LEAD_ARCHITECT: ГЛИБОКИЙ_OSINT_ТРАВЕРСАЛ",
        "CLOUD_CORE: МУЛЬТИ_ТРАНС_ШАРОВИЙ_ДЕКОДЕР",
        "AI_COORD: ОРКЕСТРАЦІЯ_ВУЗЛІВ_ZAI",
        "ВЕРДИКТ: ГЕНЕРУВАННЯ_ЕЛІТНОГО_ЗВІТУ..."
    ];

    const chunks = mode === 'SOVEREIGN' ? CHUNKS_SOVEREIGN : CHUNKS_CLOUD;

    useEffect(() => {
        if (!active) {
            setLines([]);
            return;
        }

        let i = 0;
        const interval = setInterval(() => {
            const currentChunk = chunks[i % chunks.length];
            const newLine = `[${new Date().toLocaleTimeString()}] ${currentChunk} | СТАТУС: OK | ${Math.random().toString(16).substring(2, 10).toUpperCase()}`;
            setLines(prev => [...prev.slice(-20), newLine]);
            SovereignAudio.playScanPulse();
            i++;
        }, 150);

        return () => clearInterval(interval);
    }, [active, targetName, mode, chunks]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [lines]);

    if (!active) return null;

    return (
        <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            className="mt-6 p-6 bg-black border-2 border-rose-500/30 rounded-[2rem] overflow-hidden shadow-[0_0_40px_rgba(225,29,72,0.1)] relative group"
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-rose-500/40 animate-pulse" />
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                <div className="flex items-center gap-3">
                    <Cpu size={14} className="text-rose-500 animate-pulse" />
                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-[0.3em] italic">ОБРОБКА: {targetName?.toUpperCase() || 'НЕВІДОМИЙ_ВУЗОЛ'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Activity size={10} className="text-rose-500" />
                    <span className="text-[8px] font-mono text-slate-800 uppercase italic">1.4 ТБ/С_ПОТІК_ДАНИХ</span>
                </div>
            </div>
            <div ref={scrollRef} className="space-y-1 h-56 overflow-y-hidden font-mono scroll-smooth">
                {lines.map((l, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                            "text-[9px] whitespace-nowrap overflow-hidden transition-colors border-l-2 pl-2 tracking-tighter italic",
                            idx === lines.length - 1 ? "text-rose-400 border-rose-500 font-bold" : "text-slate-800 border-transparent"
                        )
                    }
                >
                        {l}
                    </motion.div>
                ))}
            </div>
            <div className="mt-4 flex items-center gap-6">
                <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        className="h-full w-1/3 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_10px_rgba(225,29,72,0.5)]"
                    />
                </div>
                <span className="text-[8px] font-black text-rose-900 uppercase italic animate-pulse">ПАРСИНГ_МАСИВУ...</span>
            </div>
        </motion.div>
    );
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
                    <span className="text-[9px] font-black font-mono text-slate-800 italic uppercase">ВАГА: {factor.weight}</span>
                    {factor.detected
                        ? <span className="text-[9px] font-black text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">ВИЯВЛЕНО</span>
                        : <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">ЧИСТО</span>
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
            {factor.detected && factor.description && (
                <p className="text-[10px] text-slate-500 mt-4 leading-relaxed italic font-medium uppercase tracking-tight">{factor.description}</p>
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
                    <span className="text-[12px] text-slate-700 font-black uppercase tracking-[0.4em] mt-2 italic shadow-sm">ТОЧНІСТЬ_СКОРІНГУ</span>
                </div>
            </div>
            <RiskBadge level={level} />
        </div>
    );
};

// ========================
// Головний компонент WRAITH
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
    const [batchResult, setBatchResult] = useState<BatchResultData | null>(null);
    const [batchLoading, setBatchLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [riskLevels, setRiskLevels] = useState<RiskLevelInfo[]>([]);
    const [liveTime, setLiveTime]     = useState(new Date().toLocaleTimeString('uk-UA'));

    useEffect(() => {
        const t = setInterval(() => setLiveTime(new Date().toLocaleTimeString('uk-UA')), 1000);
        return () => clearInterval(t);
    }, []);

    const { isOffline, nodeSource, healingProgress, activeFailover, llmTriStateMode, vramMetrics } = useBackendStatus();

    // Monitoring autonomous mode via predator-error protocol
    useEffect(() => {
        if (llmTriStateMode === 'SOVEREIGN') {
            window.dispatchEvent(new CustomEvent('predator-error', {
                detail: {
                    service: 'AML_Scoring',
                    message: `SOVEREIGN_MODE: Працює локальний інтелект (Nemotron). Глибина аналізу оптимізована під 8GB VRAM.`,
                    severity: 'info',
                    timestamp: new Date().toISOString(),
                    code: 'AML_SOVEREIGN'
                }
            }));
        }
        if (vramMetrics.status === 'critical') {
            window.dispatchEvent(new CustomEvent('predator-error', {
                detail: {
                    service: 'AML_Scoring',
                    message: `CUDA_GUARD: Критичне заповнення VRAM (${vramMetrics.used.toFixed(1)}GB). Деякі аналітичні шари можуть бути обмежені.`,
                    severity: 'warning',
                    timestamp: new Date().toISOString(),
                    code: 'AML_VRAM_CRITICAL'
                }
            }));
        }
    }, [llmTriStateMode, vramMetrics.status]);

    useEffect(() => {
        analyticsService.getAMLRiskLevels()
            .then((levels: RiskLevelInfo[]) => setRiskLevels(levels))
            .catch(() => setRiskLevels([
                { level: 'critical', range: '80-100', description: 'Критичний ризик — блокування / ДМС' },
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
            const data = await analyticsService.getAMLScore(
                entityId.trim(),
                entityName.trim(),
                entityType
            );
            setResult(data);
            SovereignAudio.playImpact();
            window.dispatchEvent(new CustomEvent('predator-error', {
                detail: {
                    service: 'AML_Scoring',
                    message: `СКОРІНГ_ВЕРДИКТ [${nodeSource}]: ${entityName} (${entityId}) проаналізовано. Рівень: ${data.risk_level.toUpperCase()}.`,
                    severity: data.total_score > 70 ? 'critical' : 'info',
                    timestamp: new Date().toISOString(),
                    code: 'AML_SCAN_SUCCESS'
                }
            }));
            if (data.total_score > 70) {
                SovereignAudio.playAlert();
            }
        } catch (e) {
            const err = e as AxiosError<{ detail?: string }>;
            setError(err?.response?.data?.detail || 'Помилка розрахунку. Перевірте зв\'язок з ядром PREDATOR.');
            SovereignAudio.playAlert();
        } finally {
            setLoading(false);
        }
    }, [entityId, entityName, entityType]);

    const runBatch = useCallback(async () => {
        if (batchList.length === 0) return;
        setBatchLoading(true);

        try {
            const data = await analyticsService.getAMLBatch(
                batchList.map(e => ({
                    entity_id:   e.entity_id,
                    entity_name: e.entity_name,
                    entity_type: e.entity_type,
                }))
            );
            setBatchResult(data);
            window.dispatchEvent(new CustomEvent('predator-error', {
                detail: {
                    service: 'AML_Scoring',
                    message: `BATCH_ВЕРДИКТ [${nodeSource}]: Пакет з ${batchList.length} сутностей проаналізовано. Виявлено критичних: ${data.distribution?.critical || 0}.`,
                    severity: 'info',
                    timestamp: new Date().toISOString(),
                    code: 'AML_BATCH_SUCCESS'
                }
            }));
        } catch (e) {
            const err = e as AxiosError<{ detail?: string }>;
            setError(err?.response?.data?.detail || 'Помилка пакетного сканування.');
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
                <WRAITH_Overlay />
                <AdvancedBackground />
                <ScanningHUD vramStatus={vramMetrics.status} />
                <CyberGrid color="rgba(225, 29, 72, 0.04)" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(225,29,72,0.06),transparent_70%)] pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(225,29,72,0.03),transparent_60%)] pointer-events-none" />

                {/* === ViewHeader WRAITH === */}
                <ViewHeader
                    title={
                        <div className="flex items-center gap-10">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-rose-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                                <div className="relative p-7 bg-black border-2 border-rose-500/40 rounded-[2.5rem] shadow-4xl transform -rotate-2 hover:rotate-0 transition-all">
                                    <ShieldAlert size={42} className="text-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.4)]" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-4">
                                    <span className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-4 py-1 text-[10px] font-black tracking-[0.4em] uppercase italic rounded-lg">
                                        МЕХАНІЗМ_КОМПЛАЄНСУ // AML_СКОРІНГ
                                    </span>
                                    <div className="h-px w-12 bg-rose-500/20" />
                                    <span className="text-[10px] font-black text-rose-800 font-mono tracking-widest uppercase italic shadow-sm">версія v57.3-WRAITH</span>
                                </div>
                                <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-3deg] leading-none">
                                    AML <span className="text-rose-600 underline decoration-rose-600/30 decoration-[14px] underline-offset-[12px] italic uppercase tracking-tighter">СКОРІНГ</span>
                                </h1>
                            </div>
                        </div>
                    }
                    breadcrumbs={['БЕЗПЕКА', 'КОМПЛАЄНС', 'AML_COGNITIVE_ARRAY']}
                    badges={[
                        { label: 'SOVEREIGN_WRAITH_v57.3', color: 'rose', icon: <Zap size={10} /> },
                        { label: 'CLASSIFIED_T1_ACCESS', color: 'primary', icon: <Lock size={10} /> },
                    ]}
                    stats={[
                        { label: 'ФАКТОРІВ_РИЗИКУ',  value: '10',      icon: <AlertTriangle />, color: 'danger'  },
                        { 
                            label: isOffline ? 'ДЗЕРКАЛЬНЕ_ВІДНОВЛЕННЯ' : 'ДЖЕРЕЛО_ВУЗЛА', 
                            value: isOffline ? `${Math.floor(healingProgress)}%` : (activeFailover ? 'NVIDIA_ZROK' : 'NVIDIA_PROD'), 
                            icon: isOffline ? <Activity /> : <Cpu />, 
                            color: isOffline ? 'warning' : 'rose',
                            animate: isOffline
                        },
                        { label: 'СТАБІЛЬНІСТЬ', value: isOffline ? 'MIRROR_VAULT' : 'STABLE', color: isOffline ? 'warning' : 'success', icon: <ShieldCheck size={14} /> },
                        { label: 'AI_TIER', value: llmTriStateMode, color: llmTriStateMode === 'CLOUD' ? 'rose' : llmTriStateMode === 'HYBRID' ? 'primary' : 'warning', icon: <Cpu size={14} /> }
                    ]}
                />

                {/* === Статус-бар WRAITH === */}
                <div className="z-10 flex items-center gap-6 py-4 px-8 bg-black border-2 border-white/5 rounded-[2rem] shadow-4xl backdrop-blur-3xl w-fit">
                    <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-rose-600 animate-pulse shadow-[0_0_8px_rgba(225,29,72,0.6)]" />
                        <span className="text-[11px] font-black text-rose-500 uppercase tracking-[0.5em] font-mono italic">
                            СТАТУС_ЯДРА: НОМІНАЛЬНИЙ // РЕЖИМ: ГЛИБОКИЙ_СКАН // {liveTime}
                        </span>
                    </div>
                </div>

                {/* === Режими WRAITH === */}
                <div className="z-10 flex gap-6">
                    {[
                        { id: false, label: 'ОДИНОЧНИЙ_АНАЛІЗ_WRAITH',    icon: <Target size={18} /> },
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
                    {/* ===== ЛІВА ПАНЕЛЬ: форма WRAITH ===== */}
                    <div className="col-span-12 lg:col-span-4 flex flex-col gap-10">

                        {!batchMode ? (
                            <TacticalCard variant="holographic" className="p-10 flex flex-col gap-8 rounded-[3.5rem] border-rose-500/10 shadow-4xl bg-black/60 backdrop-blur-3xl">
                                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-4 italic font-serif">
                                    <Crosshair size={24} className="text-rose-500 animate-pulse" /> ПАРАМЕТРИ_СКАНУВАННЯ
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
                                    className={cn(
                                        "w-full py-8 text-white font-black text-sm rounded-[2rem] uppercase tracking-[0.4em] italic hover:brightness-110 transition-all shadow-4xl disabled:opacity-40 flex flex-col items-center justify-center gap-2 font-bold border-4 relative overflow-hidden group/btn",
                                        loading ? "bg-black border-rose-500/20" : "bg-rose-600 border-rose-500/20"
                                    )}
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-6">
                                            <RefreshCw size={26} className="animate-spin text-rose-500" />
                                            <span className="text-rose-500">ПАРСИНГ_КОГНІТИВНОГО_МАСИВУ...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-6 text-lg">
                                            <Zap size={26} className="fill-white group-hover/btn:scale-125 transition-transform" />
                                            <span>ЗАПУСТИТИ_ГЛИБОКИЙ_СКАН</span>
                                        </div>
                                    )}
                                    {!loading && <span className="text-[8px] opacity-40 group-hover/btn:opacity-100 transition-opacity">ДОСТУП TIER-1 АВТОРИЗОВАНО // ШИФРУВАННЯ: AES-512</span>}
                                    
                                    {/* Ефект пульсації при наведенні */}
                                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/btn:opacity-100 group-active:bg-white/10 transition-all pointer-events-none" />
                                </button>

                                <CognitiveParsingTerminal active={loading} targetName={entityName} mode={llmTriStateMode} />

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
                                    <Upload size={24} className="text-rose-500" /> МАСОВЕ_ЗАВАНТАЖЕННЯ_МАСИВУ
                                </h3>
                                <p className="text-[10px] text-slate-700 leading-relaxed uppercase font-black tracking-widest bg-white/[0.02] p-4 rounded-xl border border-white/5 italic">
                                    ФОРМАТ: entity_id, name, type (org/pers) // ЛІМІТ: 100_ВУЗЛІВ
                                </p>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="py-12 border-4 border-dashed border-white/5 rounded-[2.5rem] text-slate-700 hover:border-rose-500/40 hover:text-rose-500 transition-all flex flex-col items-center gap-6 bg-black/40 group shadow-inner"
                                >
                                    <Upload size={40} className="group-hover:scale-110 transition-transform opacity-40 group-hover:opacity-100" />
                                    <span className="text-[11px] font-black uppercase tracking-[0.4em] italic">ІМПОРТ_ЦІЛЬОВОГО_CSV</span>
                                </button>
                                <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />

                                {batchList.length > 0 && (
                                    <div className="flex flex-col gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] text-rose-600 font-black uppercase tracking-[0.4em] italic">
                                                ЗАВАНТАЖЕНО: {batchList.length}_ВУЗЛІВ
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
                                        ? <><RefreshCw size={24} className="animate-spin" /> СКАНУВАННЯ_МАСИВУ...</>
                                        : <><Zap size={24} /> ЗАПУСТИТИ_ПАКЕТНИЙ_СКАН</>
                                    }
                                </button>
                            </TacticalCard>
                        )}

                        {/* Шкала ризику WRAITH */}
                        <TacticalCard variant="cyber" className="p-10 rounded-[3.5rem] border-white/5 bg-black/40 shadow-inner">
                            <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-[0.5em] mb-8 flex items-center gap-4 italic font-bold">
                                <Info size={16} className="text-rose-600/40" /> МАТРИЦЯ_ОЦІНКИ_РИЗИКІВ
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

                    {/* ===== ПРАВА ПАНЕЛЬ: результати WRAITH ===== */}
                    <div className="col-span-12 lg:col-span-8 flex flex-col gap-10">
                        <AnimatePresence mode="wait">

                            {/* --- Batch результат WRAITH --- */}
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
                                            РОЗПОДІЛ_МАСИВУ // {batchResult.total}_ВУЗЛІВ_ПЕРЕВІРЕНО
                                        </h3>
                                        <div className="grid grid-cols-5 gap-6 relative z-10">
                                            {Object.entries(batchResult.distribution || {}).map(([lvl, cnt]) => {
                                                const conf = RISK_CONFIG[lvl] || RISK_CONFIG.minimal;
                                                const pct = batchResult.total ? Math.round((cnt / batchResult.total) * 100) : 0;
                                                return (
                                                    <div key={lvl} className={cn("flex flex-col items-center gap-5 p-8 rounded-[2.5rem] border-2 italic group hover:bg-white/[0.02] transition-all", conf.bg, conf.border)}>
                                                        <span className="text-5xl font-black font-mono leading-none tracking-tighter" style={{ color: conf.color, textShadow: `0 0 15px ${conf.color}40` }}>{cnt}</span>
                                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] font-serif" style={{ color: conf.color }}>{conf.label.split(' ')[0]}</span>
                                                        <div className="w-full h-1 bg-black rounded-full overflow-hidden mt-2 border border-white/5">
                                                            <div className="h-full bg-slate-900" style={{ width: `${pct}%`, backgroundColor: conf.color }} />
                                                        </div>
                                                        <span className="text-[9px] font-black text-slate-800 mt-2">{pct}%_ЧАСТКА</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </TacticalCard>

                                    <TacticalCard variant="holographic" className="p-12 rounded-[4rem] border-white/5 shadow-4xl bg-black/60 relative overflow-hidden">
                                        <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-[0.5em] mb-10 italic font-serif">РЕЄСТР_ПАКЕТНОГО_ВВОДУ // ПОВНЕ_РОЗКРИТТЯ</h3>
                                        <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-4">
                                            {batchResult.scores?.map((s) => {
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
                                                                <span className="text-[10px] font-mono text-slate-700 uppercase tracking-[0.3em] italic">ІДЕНТ: {s.entity_id}</span>
                                                                <div className="h-px w-6 bg-slate-900" />
                                                                <span className="text-[9px] font-black text-slate-800 uppercase tracking-[0.4em] italic leading-none">{s.detected_factors}_ВЕКТОРІВ_РИЗИКУ</span>
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

                            {/* --- Single result WRAITH --- */}
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
                                                            ІДЕНТИФІКОВАНА_ЦІЛЬ
                                                        </span>
                                                        <div className="h-px w-10 bg-rose-500/20" />
                                                        <span className="text-[10px] font-black text-slate-800 font-mono tracking-widest uppercase italic">X_КОГНІТИВНИЙ_МАСИВ</span>
                                                    </div>
                                                    <h2 className="text-5xl font-black text-white uppercase tracking-tighter italic font-serif leading-none mb-6">{result.entity_name}</h2>
                                                    <div className="flex items-center gap-6">
                                                        <div className="flex items-center gap-3 bg-white/5 px-5 py-2 rounded-xl border border-white/5">
                                                            <Fingerprint size={14} className="text-slate-700" />
                                                            <span className="text-[11px] font-mono text-slate-500 uppercase italic">ІДЕНТ: {result?.entity_id}</span>
                                                        </div>
                                                        <Badge variant="outline" className="border-white/5 text-slate-700 text-[9px] px-4 py-2 uppercase font-black tracking-[0.3em] bg-black italic">
                                                            {result.entity_type === 'organization' ? 'ЮРИДИЧНА_ОСОБА' : 'ПЕРСОНАЛЬНИЙ_ВУЗОЛ'}
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
                                                            <div className="text-[10px] text-slate-700 uppercase font-black tracking-widest italic leading-none">ВЕКТОРІВ_ВИЯВЛЕНО</div>
                                                        </div>
                                                    </div>
                                                    <div className="p-8 bg-emerald-950/20 border-2 border-emerald-500/20 rounded-[2.5rem] flex items-center gap-8 shadow-inner group hover:border-emerald-500/40 transition-all">
                                                        <div className="p-4 bg-black rounded-2xl border-2 border-emerald-600/20 text-emerald-600 group-hover:scale-110 transition-transform">
                                                            <CheckCircle size={32} />
                                                        </div>
                                                        <div>
                                                            <div className="text-4xl font-black text-emerald-500 font-mono italic tracking-tighter leading-none mb-2">{result.factors.length - detectedCount}</div>
                                                            <div className="text-[10px] text-slate-700 uppercase font-black tracking-widest italic leading-none">ЦІЛІСНІСТЬ_БЕЗПЕЧНА</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 pt-4 opacity-30">
                                                    <Clock size={14} className="text-slate-700" />
                                                    <span className="text-[10px] font-mono text-slate-800 uppercase italic tracking-widest">
                                                        ЧАС_ФІКСАЦІЇ: {new Date(result.calculated_at).toLocaleString('uk-UA').toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </TacticalCard>

                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                                        <TacticalCard variant="holographic" className="p-10 rounded-[4rem] border-white/5 bg-black/80 backdrop-blur-3xl shadow-4xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                               <Radar size={150} className="text-rose-600" />
                                            </div>
                                            <h3 className="text-[11px] font-black text-rose-600/70 uppercase tracking-[0.5em] mb-10 italic font-serif">
                                                ТОПОЛОГІЯ_КОГНІТИВНИХ_РИЗИКІВ
                                            </h3>
                                            <RadarChart factors={result.factors} />
                                        </TacticalCard>

                                        <TacticalCard variant="holographic" className="p-10 rounded-[4rem] border-white/5 bg-black/80 backdrop-blur-3xl shadow-4xl relative overflow-hidden">
                                            <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-[0.5em] mb-10 italic font-serif">
                                                РОЗКРИТТЯ_ВЕКТОРІВ // {result.factors.length}_ПРОАНАЛІЗОВАНО
                                            </h3>
                                            <div className="flex flex-col gap-4 max-h-[380px] overflow-y-auto custom-scrollbar pr-4">
                                                {result.factors
                                                    .sort((a, b) => Number(b.detected) - Number(a.detected) || b.weight - a.weight)
                                                    .map(f => <FactorCard key={f.category} factor={f} />)
                                                }
                                            </div>
                                        </TacticalCard>
                                    </div>

                                    {/* Рекомендації WRAITH */}
                                    {(result.recommendations?.length || 0) > 0 && (
                                        <TacticalCard variant="cyber" className="p-12 rounded-[5rem] border-rose-500/20 bg-rose-950/10 shadow-4xl relative overflow-hidden">
                                            <div className="absolute -left-12 -top-12 opacity-5 rotate-45 pointer-events-none">
                                                 <Flame size={200} className="text-rose-500" />
                                            </div>
                                            <h3 className="text-2xl font-black text-rose-500 uppercase tracking-[0.4em] mb-12 flex items-center gap-6 italic font-serif">
                                                <Flame size={32} className="animate-pulse" /> ВЕРДИКТИ_СТРАТЕГІЧНОЇ_ПІДТРИМКИ
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                                {result.recommendations?.map((rec, i) => (
                                                    <div key={i} className="flex items-start gap-6 p-8 bg-black border-2 border-rose-500/10 rounded-[2.5rem] group hover:border-rose-500/30 transition-all shadow-inner">
                                                        <ChevronRight size={24} className="text-rose-600 shrink-0 mt-1 transform group-hover:translate-x-1 transition-transform" />
                                                        <p className="text-[13px] font-black text-slate-300 leading-relaxed italic uppercase tracking-tight">{rec}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-8 mt-12 relative z-10">
                                                <button className="flex-1 py-6 bg-white/[0.02] border-2 border-white/5 rounded-[2rem] text-[11px] font-black text-slate-600 uppercase tracking-[0.3em] italic hover:text-white hover:bg-rose-600 hover:border-rose-500 transition-all flex items-center justify-center gap-5 shadow-xl font-bold">
                                                    <Download size={24} /> ЗАВАНТАЖИТИ_ЗВІТ_PDF
                                                </button>
                                                <button className="flex-1 py-6 bg-white/[0.02] border-2 border-white/5 rounded-[2rem] text-[11px] font-black text-slate-600 uppercase tracking-[0.3em] italic hover:text-white hover:bg-rose-600 hover:border-rose-500 transition-all flex items-center justify-center gap-5 shadow-xl font-bold">
                                                    <FileText size={24} /> ДОДАТИ_ДО_СПРАВИ
                                                </button>
                                            </div>
                                        </TacticalCard>
                                    )}
                                </motion.div>
                            )}

                            {/* --- Заглушка WRAITH --- */}
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
                                            ОЧІКУВАННЯ_СИГНАЛУ
                                        </p>
                                        <div className="h-px w-32 bg-slate-900 mx-auto" />
                                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.5em] italic">
                                            ІНІЦІЮЙТЕ СКАНУВАННЯ ЧЕРЕЗ ТЕРМІНАЛ ПАРАМЕТРІВ
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* --- Loading WRAITH --- */}
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
                                        <p className="text-xl font-black text-rose-500 uppercase tracking-[0.6em] animate-pulse italic font-serif">AML_КОГНІТИВНЕ_СКАНУВАННЯ...</p>
                                        <p className="text-[11px] font-black text-slate-700 uppercase tracking-[0.4em] italic leading-none border-b border-slate-900 pb-2">ДЕШИФРУВАННЯ_10_КАТЕГОРІЙ // SOVEREIGN_CORE</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
                <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar{width:6px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(225,29,72,0.15);border-radius:20px;border:2px solid black}.custom-scrollbar::-webkit-scrollbar-thumb:hover{background:rgba(225,29,72,0.3)}` }} />
                <DiagnosticsTerminal />
            </div>
        </PageTransition>
    );
};

export default AMLScoringView;

