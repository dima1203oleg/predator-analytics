/**
 * 🛰️ OSINT COMMAND CENTER v2.0
 *
 * Потужна візуалізація OSINT-модуля PREDATOR Analytics.
 * Включає: 12 інструментів, 250+ реєстрів України, live feed, risk heatmap,
 * статистику покриття, категорії джерел та аналітику по знахідках.
 *
 * Усі тексти — українською (HR-03/HR-04).
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Globe, Shield, Activity, AlertTriangle, Database, Eye,
    Radio, Wifi, WifiOff, ChevronRight, Search, ScanLine,
    Building2, Scale, ShoppingCart, Landmark, Banknote,
    FileWarning, Skull, Bot, Home, Receipt, Ban, GitBranch,
    Target, Radar, Zap, TrendingUp, Lock, Crosshair,
    BarChart3, PieChart, Server, Clock, Check, X,
    ArrowUpRight, Layers, CircleDot, RefreshCw, Cpu
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { apiClient } from '@/services/api/config';

// ─── Типи ───────────────────────────────────────────
interface OsintTool {
    id: string;
    name: string;
    category: string;
    status: 'СКАНУЄ' | 'ОНЛАЙН' | 'ОФЛАЙН';
    findings: number;
    lastScan: string;
    color: string;
    description?: string;
    accuracy?: number;
}

interface RegistryCategory {
    id: string;
    name: string;
    icon: string;
    color: string;
    count: number;
    registries: {
        id: string;
        name: string;
        status: string;
        records: number;
        lastSync: string;
        api: string;
    }[];
}

interface FeedItem {
    id: string;
    source: string;
    type: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    target: string;
    finding: string;
    timestamp: string;
    category: string;
}

interface OsintStats {
    totalFindings: number;
    criticalAlerts: number;
    activeScans: number;
    toolsOnline: number;
    toolsTotal: number;
    registriesConnected: number;
    registriesTotal: number;
    findingsByCategory: { category: string; count: number; pct: number; color: string }[];
    riskHeatmap: { source: string; risk: number; count: number }[];
    timeline: { hour: string; findings: number; critical: number }[];
}

// ─── Іконка для категорії реєстру ───────────────────
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    EDR: <Building2 size={16} />,
    TAX: <Receipt size={16} />,
    CUSTOMS: <Shield size={16} />,
    COURT: <Scale size={16} />,
    SANCTIONS: <Ban size={16} />,
    PROCUREMENT: <ShoppingCart size={16} />,
    PROPERTY: <Home size={16} />,
    FINANCIAL: <Banknote size={16} />,
    DARKWEB: <Skull size={16} />,
    OPENDATABOT: <Bot size={16} />,
};

// ─── Колір для severity ──────────────────────────────
const SEVERITY_CONFIG: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    CRITICAL: { bg: 'bg-red-500/15', border: 'border-red-500/40', text: 'text-red-400', glow: 'shadow-red-500/20' },
    HIGH: { bg: 'bg-amber-500/15', border: 'border-amber-500/40', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
    MEDIUM: { bg: 'bg-blue-500/15', border: 'border-blue-500/40', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
    LOW: { bg: 'bg-slate-500/15', border: 'border-slate-500/30', text: 'text-slate-400', glow: '' },
};

// ─── Animated Radar Background ──────────────────────
const RadarBackground: React.FC = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {/* Радарні кола */}
            {[1, 2, 3, 4].map(i => (
                <motion.div
                    key={i}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-500/5"
                    style={{ width: `${i * 25}%`, height: `${i * 25}%` }}
                    animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.15, 0.3] }}
                    transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut' }}
                />
            ))}
            {/* Скануюча лінія */}
            <motion.div
                className="absolute left-1/2 top-1/2 w-1/2 h-[1px] origin-left"
                style={{
                    background: 'linear-gradient(90deg, rgba(16,185,129,0.4), transparent)',
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />
            {/* Точки-пульс */}
            {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                    key={`dot-${i}`}
                    className="absolute w-1 h-1 rounded-full bg-emerald-400/30"
                    style={{
                        left: `${15 + Math.random() * 70}%`,
                        top: `${10 + Math.random() * 80}%`,
                    }}
                    animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.5, 0.5] }}
                    transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 3 }}
                />
            ))}
        </div>
    );
};

// ─── Risk Heatmap Bar ───────────────────────────────
const RiskHeatmapBar: React.FC<{ source: string; risk: number; count: number; index: number }> = ({ source, risk, count, index }) => {
    const color = risk >= 90 ? 'from-red-600 to-red-500' :
                  risk >= 70 ? 'from-amber-600 to-amber-500' :
                  risk >= 50 ? 'from-yellow-600 to-yellow-500' :
                               'from-emerald-600 to-emerald-500';
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 group"
        >
            <div className="w-32 text-[10px] font-bold text-slate-400 truncate group-hover:text-white transition-colors">
                {source}
            </div>
            <div className="flex-1 h-3 bg-slate-900 rounded-full overflow-hidden relative">
                <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${risk}%` }}
                    transition={{ duration: 1.2, delay: index * 0.1, ease: 'easeOut' }}
                />
                <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_3px,rgba(0,0,0,0.2)_3px,rgba(0,0,0,0.2)_4px)]" />
            </div>
            <div className="w-10 text-right text-[11px] font-black font-mono text-white">{risk}%</div>
            <div className="w-14 text-right text-[9px] font-mono text-slate-500">{count.toLocaleString()}</div>
        </motion.div>
    );
};

// ─── Live Feed Item ─────────────────────────────────
const FeedItemRow: React.FC<{ item: FeedItem; index: number }> = ({ item, index }) => {
    const sev = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.LOW;
    const timeAgo = (() => {
        const diff = Date.now() - new Date(item.timestamp).getTime();
        if (diff < 60000) return `${Math.round(diff / 1000)}с`;
        if (diff < 3600000) return `${Math.round(diff / 60000)}хв`;
        return `${Math.round(diff / 3600000)}г`;
    })();

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className={cn(
                'p-3 rounded-xl border backdrop-blur-sm transition-all hover:scale-[1.01] cursor-pointer group',
                sev.bg, sev.border
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={cn('text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded border uppercase', sev.bg, sev.border, sev.text)}>
                            {item.severity}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500">{item.source}</span>
                        <span className="text-[9px] text-slate-600 ml-auto font-mono">{timeAgo} тому</span>
                    </div>
                    <p className="text-[11px] font-bold text-white truncate">{item.target}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{item.finding}</p>
                </div>
                <ArrowUpRight size={14} className="text-slate-600 group-hover:text-white transition-colors shrink-0 mt-1" />
            </div>
        </motion.div>
    );
};

// ─── Category Card (Реєстри) ────────────────────────
const RegistryCategoryCard: React.FC<{ cat: RegistryCategory; onClick: () => void; isExpanded: boolean }> = ({ cat, onClick, isExpanded }) => {
    const totalRecords = cat.registries.reduce((a, r) => a + r.records, 0);
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                'rounded-2xl border backdrop-blur-sm transition-all cursor-pointer overflow-hidden',
                isExpanded
                    ? 'bg-slate-900/70 border-white/10 col-span-2 row-span-2'
                    : 'bg-slate-900/40 border-white/5 hover:border-white/15 hover:bg-slate-900/60'
            )}
            onClick={onClick}
        >
            <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg" style={{ backgroundColor: cat.color + '20' }}>
                            <span style={{ color: cat.color }}>{CATEGORY_ICONS[cat.id] || <Database size={16} />}</span>
                        </div>
                        <span className="text-[11px] font-black text-white uppercase tracking-wider">{cat.name}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold" style={{ color: cat.color }}>{cat.count}</span>
                </div>
                <div className="text-[9px] text-slate-500 font-mono mb-2">
                    {totalRecords >= 1e9 ? `${(totalRecords / 1e9).toFixed(1)}B` : totalRecords >= 1e6 ? `${(totalRecords / 1e6).toFixed(1)}M` : totalRecords >= 1e3 ? `${(totalRecords / 1e3).toFixed(1)}K` : totalRecords} записів
                </div>
                {/* Progress bar – connectedness */}
                <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: cat.color }}
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 1.5 }}
                    />
                </div>
            </div>

            {/* Розширений вигляд — перелік реєстрів */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/5"
                    >
                        <div className="p-3 space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                            {cat.registries.map(reg => (
                                <div key={reg.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 border border-white/5">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[10px] font-bold text-slate-200 truncate">{reg.name}</div>
                                        <div className="text-[8px] text-slate-500 font-mono mt-0.5">
                                            {reg.records >= 1e9 ? `${(reg.records / 1e9).toFixed(1)}B` : reg.records >= 1e6 ? `${(reg.records / 1e6).toFixed(1)}M` : reg.records >= 1e3 ? `${(reg.records / 1e3).toFixed(0)}K` : reg.records} • {reg.api} • {reg.lastSync}
                                        </div>
                                    </div>
                                    <div className={cn(
                                        'text-[7px] font-black px-1.5 py-0.5 rounded border',
                                        reg.status === 'ACTIVE' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-500/10 border-slate-500/30 text-slate-400'
                                    )}>
                                        {reg.status === 'ACTIVE' ? 'АКТИВНИЙ' : reg.status}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// ─── Findings Distribution Chart (CSS only) ─────────
const FindingsChart: React.FC<{ data: { category: string; count: number; pct: number; color: string }[] }> = ({ data }) => {
    const max = Math.max(...data.map(d => d.count));
    return (
        <div className="space-y-2">
            {data.map((d, i) => (
                <motion.div
                    key={d.category}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-2 group"
                >
                    <div className="w-24 text-[9px] font-bold text-slate-500 truncate group-hover:text-white transition-colors">{d.category}</div>
                    <div className="flex-1 h-4 bg-slate-950/70 rounded overflow-hidden relative">
                        <motion.div
                            className="h-full rounded"
                            style={{ backgroundColor: d.color + 'cc' }}
                            initial={{ width: 0 }}
                            animate={{ width: `${(d.count / max) * 100}%` }}
                            transition={{ duration: 1, delay: i * 0.08 }}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-mono font-bold text-white/70">{d.count.toLocaleString()}</span>
                    </div>
                    <div className="w-10 text-right text-[9px] font-mono font-bold" style={{ color: d.color }}>{d.pct}%</div>
                </motion.div>
            ))}
        </div>
    );
};

// ─── Activity Timeline (CSS bars) ───────────────────
const ActivityTimeline: React.FC<{ data: { hour: string; findings: number; critical: number }[] }> = ({ data }) => {
    const max = Math.max(...data.map(d => d.findings));
    return (
        <div className="flex items-end gap-1 h-24">
            {data.map((d, i) => (
                <div key={d.hour} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full relative" style={{ height: '100%' }}>
                        <motion.div
                            className="absolute bottom-0 w-full rounded-t bg-gradient-to-t from-emerald-600/60 to-emerald-400/40"
                            initial={{ height: 0 }}
                            animate={{ height: `${(d.findings / max) * 100}%` }}
                            transition={{ duration: 0.8, delay: i * 0.05 }}
                        />
                        {d.critical > 0 && (
                            <motion.div
                                className="absolute bottom-0 w-full rounded-t bg-gradient-to-t from-red-600/80 to-red-400/60"
                                initial={{ height: 0 }}
                                animate={{ height: `${(d.critical / max) * 100}%` }}
                                transition={{ duration: 0.8, delay: i * 0.05 + 0.3 }}
                            />
                        )}
                    </div>
                    <span className="text-[7px] font-mono text-slate-600">{d.hour.slice(0, 5)}</span>
                </div>
            ))}
        </div>
    );
};

// ═══════════════════════════════════════════════════════
// 🛰️ ГОЛОВНИЙ КОМПОНЕНТ — OSINT COMMAND CENTER
// ═══════════════════════════════════════════════════════
export const OsintCommandCenter: React.FC = () => {
    const [tools, setTools] = useState<OsintTool[]>([]);
    const [registryCategories, setRegistryCategories] = useState<RegistryCategory[]>([]);
    const [feed, setFeed] = useState<FeedItem[]>([]);
    const [stats, setStats] = useState<OsintStats | null>(null);
    const [coverageStats, setCoverageStats] = useState<any>(null);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'tools' | 'registries' | 'feed' | 'analytics'>('tools');

    // Завантаження даних
    useEffect(() => {
        const fetchAll = async () => {
            setIsLoading(true);
            try {
                const [toolsRes, registriesRes, feedRes, statsRes] = await Promise.allSettled([
                    apiClient.get('/osint/tools'),
                    apiClient.get('/osint/registries'),
                    apiClient.get('/osint/feed'),
                    apiClient.get('/osint/stats'),
                ]);

                if (toolsRes.status === 'fulfilled') setTools(toolsRes.value.data);
                if (registriesRes.status === 'fulfilled') {
                    setRegistryCategories(registriesRes.value.data.categories || []);
                    setCoverageStats(registriesRes.value.data.coverageStats || null);
                }
                if (feedRes.status === 'fulfilled') setFeed(feedRes.value.data);
                if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
            } catch (e) {
                console.error('OSINT CC: помилка завантаження', e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAll();
        const interval = setInterval(fetchAll, 15000);
        return () => clearInterval(interval);
    }, []);

    const onlineCount = tools.filter(t => t.status === 'ОНЛАЙН').length;
    const scanningCount = tools.filter(t => t.status === 'СКАНУЄ').length;
    const totalFindings = tools.reduce((a, t) => a + (t.findings || 0), 0);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[600px] gap-4">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                    <Radar size={48} className="text-emerald-500/60" />
                </motion.div>
                <span className="text-[11px] uppercase font-black tracking-[0.3em] text-emerald-500/50 animate-pulse">
                    ІНІЦІАЛІЗАЦІЯ OSINT ЯДРА...
                </span>
            </div>
        );
    }

    return (
        <div className="space-y-6 relative">
            <RadarBackground />

            {/* ═══ COMMAND HEADER ═══ */}
            <div className="relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {/* Stat Cards */}
                    {[
                        { label: 'ЗНАХІДОК', value: stats?.totalFindings?.toLocaleString() || totalFindings.toLocaleString(), icon: <Eye size={14} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                        { label: 'КРИТИЧНИХ', value: stats?.criticalAlerts?.toString() || '—', icon: <AlertTriangle size={14} />, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
                        { label: 'ІНСТРУМЕНТІВ', value: `${onlineCount + scanningCount}/${tools.length}`, icon: <Cpu size={14} />, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                        { label: 'СКАНУЮТЬСЯ', value: scanningCount.toString(), icon: <ScanLine size={14} />, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                        { label: 'РЕЄСТРІВ', value: coverageStats ? `${coverageStats.active}/${coverageStats.totalSources}` : '—', icon: <Database size={14} />, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
                        { label: 'СВІЖІСТЬ', value: coverageStats?.dataFreshness || '—', icon: <Clock size={14} />, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
                    ].map((s, i) => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={cn('p-3 rounded-2xl border backdrop-blur-sm', s.bg, s.border)}
                        >
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className={s.color}>{s.icon}</span>
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.15em]">{s.label}</span>
                            </div>
                            <div className={cn('text-xl font-black font-mono', s.color)}>{s.value}</div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* ═══ TAB NAVIGATION ═══ */}
            <div className="relative z-10 flex items-center gap-1 p-1 bg-slate-900/60 rounded-xl border border-white/5 w-fit">
                {[
                    { id: 'tools' as const, label: 'ІНСТРУМЕНТИ', icon: <Radar size={14} />, count: tools.length },
                    { id: 'registries' as const, label: 'РЕЄСТРИ', icon: <Database size={14} />, count: registryCategories.length },
                    { id: 'feed' as const, label: 'СТРІЧКА ПОДІЙ', icon: <Radio size={14} />, count: feed.length },
                    { id: 'analytics' as const, label: 'АНАЛІТИКА', icon: <BarChart3 size={14} /> },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            'px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2',
                            activeTab === tab.id
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'text-slate-500 hover:text-white hover:bg-white/5'
                        )}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.count !== undefined && (
                            <span className={cn(
                                'text-[8px] px-1.5 py-0.5 rounded-full font-bold',
                                activeTab === tab.id ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-800 text-slate-500'
                            )}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ═══ TAB CONTENT ═══ */}
            <div className="relative z-10">
                <AnimatePresence mode="wait">
                    {/* ─── TAB: ІНСТРУМЕНТИ ─── */}
                    {activeTab === 'tools' && (
                        <motion.div
                            key="tools"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                        >
                            {tools.map((tool, i) => (
                                <motion.div
                                    key={tool.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.04 }}
                                    className={cn(
                                        'p-4 rounded-2xl border backdrop-blur-sm relative overflow-hidden group transition-all hover:scale-[1.02]',
                                        tool.status === 'СКАНУЄ'
                                            ? 'bg-slate-900/70 border-amber-500/30 shadow-lg shadow-amber-500/5'
                                            : tool.status === 'ОНЛАЙН'
                                                ? 'bg-slate-900/50 border-emerald-500/20'
                                                : 'bg-slate-900/30 border-slate-700/30'
                                    )}
                                >
                                    {/* Glow effect при скануванні */}
                                    {tool.status === 'СКАНУЄ' && (
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08),transparent_70%)]" />
                                    )}

                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: tool.color + '20' }}>
                                                    <CircleDot size={16} style={{ color: tool.color }} />
                                                </div>
                                                <div>
                                                    <div className="text-[11px] font-black text-white uppercase tracking-wide">{tool.name}</div>
                                                    <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">{tool.category}</div>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                'text-[7px] font-black px-1.5 py-0.5 rounded border flex items-center gap-1',
                                                tool.status === 'СКАНУЄ' ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' :
                                                tool.status === 'ОНЛАЙН' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' :
                                                'bg-slate-500/15 border-slate-500/30 text-slate-500'
                                            )}>
                                                {tool.status === 'СКАНУЄ' && <RefreshCw size={8} className="animate-spin" />}
                                                {tool.status === 'ОНЛАЙН' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                                                {tool.status === 'ОФЛАЙН' && <WifiOff size={8} />}
                                                {tool.status}
                                            </div>
                                        </div>

                                        {tool.description && (
                                            <p className="text-[9px] text-slate-500 mb-3 line-clamp-1">{tool.description}</p>
                                        )}

                                        <div className="flex items-end justify-between">
                                            <div>
                                                <div className="text-[8px] text-slate-600 font-mono uppercase">ЗНАХІДКИ</div>
                                                <div className="text-lg font-black font-mono" style={{ color: tool.color }}>{tool.findings.toLocaleString()}</div>
                                            </div>
                                            {tool.accuracy && (
                                                <div className="text-right">
                                                    <div className="text-[8px] text-slate-600 font-mono uppercase">ТОЧНІСТЬ</div>
                                                    <div className="text-sm font-black font-mono text-slate-300">{tool.accuracy}%</div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Accuracy bar */}
                                        {tool.accuracy && (
                                            <div className="mt-2 h-1 bg-slate-950 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full rounded-full"
                                                    style={{ backgroundColor: tool.color }}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${tool.accuracy}%` }}
                                                    transition={{ duration: 1.5, delay: i * 0.05 }}
                                                />
                                            </div>
                                        )}

                                        {/* Scan progress */}
                                        {tool.status === 'СКАНУЄ' && (
                                            <div className="mt-2 h-0.5 bg-slate-950 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-amber-500"
                                                    initial={{ width: '0%' }}
                                                    animate={{ width: '100%' }}
                                                    transition={{ duration: 3, repeat: Infinity }}
                                                />
                                            </div>
                                        )}

                                        <div className="text-[8px] text-slate-600 font-mono mt-2">
                                            Останнє: {tool.lastScan}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {/* ─── TAB: РЕЄСТРИ ─── */}
                    {activeTab === 'registries' && (
                        <motion.div
                            key="registries"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Coverage Stats Band */}
                            {coverageStats && (
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/40 border border-white/5">
                                    <div className="flex items-center gap-2">
                                        <Server size={16} className="text-cyan-400" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">ПОКРИТТЯ ДЖЕРЕЛ</span>
                                    </div>
                                    <div className="flex-1 h-3 bg-slate-950 rounded-full overflow-hidden relative">
                                        <motion.div
                                            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-cyan-500"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(coverageStats.active / coverageStats.totalSources) * 100}%` }}
                                            transition={{ duration: 2 }}
                                        />
                                    </div>
                                    <span className="text-sm font-black font-mono text-emerald-400">
                                        {Math.round((coverageStats.active / coverageStats.totalSources) * 100)}%
                                    </span>
                                    <div className="flex gap-3 text-[9px] font-mono">
                                        <span className="text-emerald-400">● {coverageStats.active} активних</span>
                                        <span className="text-amber-400">● {coverageStats.syncing} синхронізація</span>
                                        <span className="text-slate-400">● {coverageStats.offline} офлайн</span>
                                        <span className="text-blue-400">● {coverageStats.pending} очікують</span>
                                    </div>
                                </div>
                            )}

                            {/* Категорії реєстрів */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                {registryCategories.map((cat) => (
                                    <RegistryCategoryCard
                                        key={cat.id}
                                        cat={cat}
                                        isExpanded={expandedCategory === cat.id}
                                        onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                                    />
                                ))}
                            </div>

                            {/* Загальна кількість записів */}
                            {coverageStats && (
                                <div className="text-center py-4">
                                    <div className="text-[9px] text-slate-600 uppercase tracking-widest font-black mb-1">ЗАГАЛЬНИЙ ОБ'ЄМ ДАНИХ</div>
                                    <div className="text-3xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400">
                                        {coverageStats.totalRecords}
                                    </div>
                                    <div className="text-[9px] text-slate-500 font-mono mt-1">
                                        ЗАПИСІВ У {coverageStats.totalSources} ДЖЕРЕЛАХ • СВІЖІСТЬ: {coverageStats.dataFreshness}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ─── TAB: LIVE FEED ─── */}
                    {activeTab === 'feed' && (
                        <motion.div
                            key="feed"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-3"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">СТРІЧКА ПОДІЙ У РЕАЛЬНОМУ ЧАСІ</span>
                                </div>
                                <span className="text-[9px] font-mono text-slate-500">{feed.length} подій</span>
                            </div>
                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                                {feed.map((item, i) => (
                                    <FeedItemRow key={item.id} item={item} index={i} />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ─── TAB: АНАЛІТИКА ─── */}
                    {activeTab === 'analytics' && stats && (
                        <motion.div
                            key="analytics"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                        >
                            {/* Розподіл знахідок */}
                            <div className="p-5 rounded-2xl bg-slate-900/50 border border-white/5">
                                <div className="flex items-center gap-2 mb-4">
                                    <PieChart size={14} className="text-emerald-400" />
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">РОЗПОДІЛ ЗА КАТЕГОРІЯМИ</span>
                                </div>
                                <FindingsChart data={stats.findingsByCategory} />
                            </div>

                            {/* Risk Heatmap */}
                            <div className="p-5 rounded-2xl bg-slate-900/50 border border-white/5">
                                <div className="flex items-center gap-2 mb-4">
                                    <AlertTriangle size={14} className="text-red-400" />
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">КАРТА РИЗИКІВ ЗА ДЖЕРЕЛОМ</span>
                                </div>
                                <div className="space-y-2">
                                    {stats.riskHeatmap
                                        .sort((a, b) => b.risk - a.risk)
                                        .map((item, i) => (
                                            <RiskHeatmapBar key={item.source} {...item} index={i} />
                                        ))}
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="p-5 rounded-2xl bg-slate-900/50 border border-white/5 lg:col-span-2">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp size={14} className="text-cyan-400" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">АКТИВНІСТЬ ЗА 24 ГОДИНИ</span>
                                    </div>
                                    <div className="flex gap-4 text-[8px] font-mono">
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500/60" /> Знахідки</span>
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-500/60" /> Критичні</span>
                                    </div>
                                </div>
                                <ActivityTimeline data={stats.timeline} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default OsintCommandCenter;
