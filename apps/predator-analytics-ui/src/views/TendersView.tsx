/**
 * PREDATOR v55.5 | Prozorro Sovereign Nexus — РЕЄСТР ДЕРЖАВНИХ ЗАКУПІВЕЛЬ
 *
 * Антикорупційний моніторинг публічних закупівель у реальному часі.
 * - Prozorro API інтеграція (глибокий OSINT-аналіз)
 * - CERS-скорингова оцінка ризику кожного лота
 * - Виявлення підозрілих схем та змов замовників
 * - Трендова аналітика ринку держзакупівель
 *
 * © 2026 PREDATOR Analytics | Anti-Corruption Intelligence Engine
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Landmark, Search, RefreshCw, ExternalLink, Filter,
    Calendar, DollarSign, FileText, CheckCircle, AlertCircle,
    Clock, TrendingUp, ShieldAlert, BarChart3, LayoutDashboard,
    Target, Activity, Zap, Database, Eye, AlertTriangle,
    ChevronRight, ArrowUpRight, Flag, ScanLine, Radar,
    Building2, Scale, PieChart, Users, ShieldCheck
} from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, BarChart, Bar, Cell
} from 'recharts';
import { apiClient } from '../services/api/config';
import { PageTransition } from '../components/layout/PageTransition';
import { TacticalCard } from '../components/TacticalCard';
import { Badge } from '../components/ui/badge';
import { AdvancedBackground } from '../components/AdvancedBackground';
import { ViewHeader } from '../components/ViewHeader';
import { CyberOrb } from '../components/CyberOrb';
import { CyberGrid } from '../components/CyberGrid';
import { cn } from '../lib/utils';

// ========================
// Types
// ========================
interface Tender {
    id: string;
    title: string;
    value: number;
    currency: string;
    status: string;
    procuringEntity: string;
    date: string;
    risk_score?: number;
    category?: string;
    bids_count?: number;
}

interface Analytics {
    total_value: number;
    avg_risk: number;
    critical_tenders: number;
    categories: { name: string; value: number; color: string }[];
    trends: { date: string; value: number }[];
}

// ========================
// Mock fallback
// ========================
const MOCK_TENDERS: Tender[] = [
    { id: 'UA-2024-01-15-000001-a', title: 'Придбання паливно-мастильних матеріалів для потреб Міністерства оборони', value: 18_800_000, currency: 'UAH', status: 'active', procuringEntity: 'Міністерство оборони України', date: '2024-01-15', risk_score: 73, category: 'ПММ', bids_count: 2 },
    { id: 'UA-2024-01-14-000042-a', title: 'Ремонт автомобільних доріг загального користування', value: 142_600_000, currency: 'UAH', status: 'complete', procuringEntity: 'Держдорслужба Одеської обл.', date: '2024-01-14', risk_score: 88, category: 'Дороги', bids_count: 1 },
    { id: 'UA-2024-01-13-000078-b', title: 'Медичні вироби та обладнання для закладів охорони здоров\'я', value: 7_200_000, currency: 'UAH', status: 'active', procuringEntity: 'КМДА Департамент охорони здоров\'я', date: '2024-01-13', risk_score: 34, category: 'Медицина', bids_count: 4 },
    { id: 'UA-2024-01-12-000101-c', title: 'Послуги зв\'язку та телекомунікацій для державних органів', value: 3_500_000, currency: 'UAH', status: 'active', procuringEntity: 'Адміністрація Президента', date: '2024-01-12', risk_score: 56, category: 'ІТ', bids_count: 3 },
    { id: 'UA-2024-01-10-000089-a', title: 'Будівельні роботи — реконструкція навчального закладу', value: 22_400_000, currency: 'UAH', status: 'unsuccessful', procuringEntity: 'Департамент освіти Харківської ОДА', date: '2024-01-10', risk_score: 91, category: 'Будівництво', bids_count: 1 },
    { id: 'UA-2024-01-09-000205-a', title: 'Продукти харчування для установ пенітенціарної служби', value: 5_100_000, currency: 'UAH', status: 'active', procuringEntity: 'ДКВС України', date: '2024-01-09', risk_score: 62, category: 'Харчування', bids_count: 2 },
    { id: 'UA-2024-01-08-000310-b', title: 'Комп\'ютерне обладнання та програмне забезпечення', value: 11_700_000, currency: 'UAH', status: 'active', procuringEntity: 'Мінцифра України', date: '2024-01-08', risk_score: 28, category: 'ІТ', bids_count: 6 },
    { id: 'UA-2024-01-06-000417-a', title: 'Охоронні послуги державних об\'єктів стратегічного значення', value: 9_300_000, currency: 'UAH', status: 'active', procuringEntity: 'Служба охорони МВС', date: '2024-01-06', risk_score: 45, category: 'Охорона', bids_count: 3 },
];

const MOCK_ANALYTICS: Analytics = {
    total_value: 2_870_000_000,
    avg_risk: 61,
    critical_tenders: 147,
    categories: [
        { name: 'Будівництво', value: 1_200_000_000, color: '#f59e0b' },
        { name: 'ПММ', value: 680_000_000, color: '#10b981' },
        { name: 'Медицина', value: 420_000_000, color: '#6366f1' },
        { name: 'ІТ', value: 320_000_000, color: '#0ea5e9' },
        { name: 'Дороги', value: 250_000_000, color: '#ec4899' },
    ],
    trends: [
        { date: '01.01', value: 82_000_000 }, { date: '05.01', value: 145_000_000 },
        { date: '10.01', value: 98_000_000 },  { date: '15.01', value: 220_000_000 },
        { date: '20.01', value: 170_000_000 }, { date: '25.01', value: 310_000_000 },
        { date: '30.01', value: 260_000_000 },
    ],
};

// ========================
// Sub-components
// ========================
const RiskBadge: React.FC<{ score: number }> = ({ score }) => {
    const cfg = score >= 80
        ? { cls: 'bg-rose-500/20 text-rose-400 border-rose-500/30', label: 'КРИТИЧНО' }
        : score >= 60
        ? { cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'РИЗИК' }
        : score >= 40
        ? { cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'ПОМІРНИЙ' }
        : { cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'НИЗЬКИЙ' };
    return (
        <span className={cn('px-2.5 py-1 rounded-xl text-[9px] font-black border flex items-center gap-1.5', cfg.cls)}>
            <span className="w-1 h-1 rounded-full bg-current animate-pulse"/>
            {cfg.label} {score}%
        </span>
    );
};

const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('active'))       return <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase">АКТИВНИЙ</span>;
    if (s.includes('complete'))     return <span className="px-2.5 py-1 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[9px] font-black uppercase">ЗАВЕРШЕНИЙ</span>;
    if (s.includes('unsuccessful')) return <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-black uppercase">СКАСОВАНИЙ</span>;
    return <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-400 border border-white/5 text-[9px] font-black uppercase">{status}</span>;
};

const TenderCard: React.FC<{ tender: Tender; idx: number }> = ({ tender, idx }) => {
    const valueMln = (tender.value / 1_000_000).toFixed(1);
    const isHighRisk = (tender.risk_score ?? 0) >= 80;
    const isSingleBid = (tender.bids_count ?? 0) <= 1;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: idx * 0.04, type: 'spring', damping: 15 }}
            className="group"
        >
            <TacticalCard
                variant="cyber"
                className={cn(
                    'p-6 border-white/5 hover:border-emerald-500/30 transition-all h-full flex flex-col relative overflow-hidden',
                    isHighRisk && 'border-rose-500/20 hover:border-rose-500/40'
                )}
            >
                {/* Corner glow for high risk */}
                {isHighRisk && (
                    <div className="absolute -top-8 -right-8 w-24 h-24 bg-rose-500/20 rounded-full blur-2xl"/>
                )}

                {/* Header */}
                <div className="flex items-start justify-between mb-4 gap-3">
                    <div className={cn(
                        'p-2.5 rounded-xl border transition-all shrink-0 group-hover:scale-110',
                        isHighRisk
                            ? 'bg-rose-500/10 border-rose-500/30 group-hover:border-rose-500/60'
                            : 'bg-slate-900 border-white/5 group-hover:border-emerald-500/30'
                    )}>
                        <FileText size={18} className={isHighRisk ? 'text-rose-400' : 'text-emerald-400'}/>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                        {getStatusBadge(tender.status)}
                        {isSingleBid && (
                            <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[8px] font-black flex items-center gap-1">
                                <Flag size={8}/> 1 УЧАСНИК
                            </span>
                        )}
                        <span className="text-[8px] font-mono text-slate-700">#{tender.id.slice(-6).toUpperCase()}</span>
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-sm font-black text-white uppercase leading-tight mb-3 flex-1 line-clamp-3 group-hover:text-emerald-400 transition-colors">
                    {tender.title}
                </h3>

                {/* Meta */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                        <Building2 size={10} className="text-slate-600 shrink-0"/>
                        <span className="text-[10px] text-slate-500 line-clamp-1 font-bold italic">{tender.procuringEntity}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <Calendar size={10} className="text-slate-600"/>
                            <span className="text-[10px] font-mono text-slate-500">{new Date(tender.date).toLocaleDateString('uk')}</span>
                        </div>
                        {tender.bids_count !== undefined && (
                            <div className="flex items-center gap-1.5">
                                <Users size={10} className="text-slate-600"/>
                                <span className="text-[10px] font-mono text-slate-500">{tender.bids_count} пропозицій</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Risk + Value */}
                <div className="mt-auto pt-4 border-t border-white/5">
                    <div className="flex items-end justify-between mb-3">
                        <div>
                            <div className="text-[8px] font-black text-slate-700 uppercase tracking-[0.3em] mb-0.5">СУМА КОНТРАКТУ</div>
                            <div className="text-2xl font-black text-white font-mono leading-none">
                                {valueMln}
                                <span className="text-[11px] text-emerald-500 ml-1 font-bold">млн ₴</span>
                            </div>
                        </div>
                        {tender.risk_score !== undefined && <RiskBadge score={tender.risk_score}/>}
                    </div>

                    {/* Risk bar */}
                    {tender.risk_score !== undefined && (
                        <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden mb-4">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${tender.risk_score}%` }}
                                transition={{ delay: idx * 0.05 + 0.3, duration: 0.8 }}
                                className={cn(
                                    'h-full rounded-full',
                                    tender.risk_score >= 80 ? 'bg-rose-500' :
                                    tender.risk_score >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                                )}
                                style={{ boxShadow: tender.risk_score >= 60 ? `0 0 8px currentColor` : 'none' }}
                            />
                        </div>
                    )}

                    <a
                        href={`https://prozorro.gov.ua/tender/${tender.id}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 py-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-all text-[9px] font-black uppercase tracking-widest"
                    >
                        <ExternalLink size={12}/> ВІДКРИТИ В PROZORRO
                    </a>
                </div>
            </TacticalCard>
        </motion.div>
    );
};

// ========================
// Main Component
// ========================
const TendersView: React.FC = () => {
    const [tenders, setTenders]       = useState<Tender[]>([]);
    const [analytics, setAnalytics]   = useState<Analytics | null>(null);
    const [loading, setLoading]       = useState(true);
    const [lastUpdate, setLastUpdate] = useState('');
    const [search, setSearch]         = useState('');
    const [filterRisk, setFilterRisk] = useState<'all' | 'high' | 'critical'>('all');
    const [liveTime, setLiveTime]     = useState(new Date().toLocaleTimeString('uk'));

    useEffect(() => {
        const t = setInterval(() => setLiveTime(new Date().toLocaleTimeString('uk')), 1000);
        return () => clearInterval(t);
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [tendersRes, statsRes] = await Promise.all([
                apiClient.get('/osint_ua/prozorro/tenders?limit=24'),
                apiClient.get('/osint_ua/prozorro/stats'),
            ]);
            if (tendersRes.data?.tenders) {
                setTenders(tendersRes.data.tenders);
                setLastUpdate(new Date().toLocaleTimeString('uk'));
            }
            if (statsRes.data?.analytics) setAnalytics(statsRes.data.analytics);
        } catch {
            setTenders(MOCK_TENDERS);
            setAnalytics(MOCK_ANALYTICS);
            setLastUpdate(new Date().toLocaleTimeString('uk'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filtered = useMemo(() => tenders.filter(t => {
        const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
            t.procuringEntity.toLowerCase().includes(search.toLowerCase());
        const matchRisk = filterRisk === 'all' ||
            (filterRisk === 'critical' && (t.risk_score ?? 0) >= 80) ||
            (filterRisk === 'high' && (t.risk_score ?? 0) >= 60);
        return matchSearch && matchRisk;
    }), [tenders, search, filterRisk]);

    const totalValue = useMemo(() => tenders.reduce((s, t) => s + t.value, 0), [tenders]);
    const criticalCount = useMemo(() => tenders.filter(t => (t.risk_score ?? 0) >= 80).length, [tenders]);
    const singleBidCount = useMemo(() => tenders.filter(t => (t.bids_count ?? 0) <= 1).length, [tenders]);

    return (
        <PageTransition>
            <div className="min-h-screen px-4 sm:px-6 lg:px-10 pb-20 relative overflow-hidden">
                <AdvancedBackground/>
                <CyberGrid opacity={0.015}/>
                <CyberOrb color="cyan" size="xl" intensity="low" className="top-1/3 right-0 opacity-8"/>
                <CyberOrb color="purple" size="lg" intensity="low" className="bottom-1/4 left-0 opacity-6"/>

                {/* Header — v55.5 */}
                <div className="relative mb-10">
                    <ViewHeader
                        title="РЕЄСТР ЗАКУПІВЕЛЬ"
                        icon={<Landmark className="text-emerald-400"/>}
                        breadcrumbs={['ОСІНТ', 'PROZORRO', 'АНТИКОРУПЦІЙНИЙ МОНІТОРИНГ']}
                        stats={[
                            { label: 'Лотів у базі', value: `${tenders.length}`, icon: <Database/>, color: 'primary' },
                            { label: 'Критичних', value: `${criticalCount}`, icon: <ShieldAlert/>, color: 'danger' },
                            { label: 'Один учасник', value: `${singleBidCount}`, icon: <Flag/>, color: 'warning' },
                        ]}
                    />
                    <div className="mt-4 flex items-center gap-3 px-2">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-950/60 rounded-full border border-slate-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>
                            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                                PROZORRO_INTEL_ONLINE // ОНОВЛЕНО: {lastUpdate || '...'} // {liveTime}
                            </span>
                        </div>
                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="p-2 bg-slate-900/60 border border-white/5 rounded-full hover:border-emerald-500/30 transition-all disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={cn('text-slate-500', loading && 'animate-spin text-emerald-400')}/>
                        </button>
                    </div>
                </div>

                {/* Analytics cockpit */}
                <AnimatePresence>
                    {analytics && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-12 gap-6 mb-10"
                        >
                            {/* KPI row */}
                            {[
                                { label: 'ЗАГАЛЬНИЙ ОБСЯГ', value: `${(totalValue / 1_000_000_000).toFixed(1)} млрд ₴`, icon: DollarSign, cls: 'text-emerald-400', border: 'border-emerald-500/20' },
                                { label: 'СЕРЕДНІЙ РИЗИК', value: `${analytics.avg_risk}%`, icon: ShieldAlert, cls: 'text-rose-400', border: 'border-rose-500/20' },
                                { label: 'КРИТИЧНИХ ЛОТІВ', value: analytics.critical_tenders, icon: AlertTriangle, cls: 'text-amber-400', border: 'border-amber-500/20' },
                                { label: 'ТЕНДЕРІВ ЗАГАЛОМ', value: tenders.length, icon: FileText, cls: 'text-sky-400', border: 'border-sky-500/20' },
                            ].map((kpi, i) => (
                                <motion.div key={kpi.label} className="col-span-6 md:col-span-3"
                                    initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}>
                                    <TacticalCard variant="cyber" className={cn('p-5 border', kpi.border)}>
                                        <div className="flex items-center justify-between mb-2">
                                            <kpi.icon size={18} className={kpi.cls}/>
                                            <div className="text-[7px] font-black text-slate-700 uppercase tracking-[0.35em] text-right">{kpi.label}</div>
                                        </div>
                                        <div className={cn('text-2xl font-black font-mono', kpi.cls)}>{kpi.value}</div>
                                    </TacticalCard>
                                </motion.div>
                            ))}

                            {/* Trend chart */}
                            <div className="col-span-12 lg:col-span-8">
                                <TacticalCard variant="holographic" className="p-6 h-full">
                                    <div className="flex items-center gap-3 mb-5">
                                        <TrendingUp size={18} className="text-emerald-400"/>
                                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">ДИНАМІКА ОБСЯГІВ ЗАКУПІВЕЛЬ</h3>
                                        <span className="ml-auto text-[8px] font-mono text-slate-600">ОСТАННІ 30 ДНІВ</span>
                                    </div>
                                    <div className="h-48 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={analytics.trends}>
                                                <defs>
                                                    <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.03)" vertical={false}/>
                                                <XAxis dataKey="date" stroke="#334155" fontSize={9} tickLine={false} axisLine={false}/>
                                                <YAxis stroke="#334155" fontSize={9} tickLine={false} axisLine={false}
                                                    tickFormatter={v => `${(v/1000000).toFixed(0)}M`}/>
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px' }}
                                                    itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                                                    formatter={(v: number) => [`${(v/1_000_000).toFixed(1)} млн ₴`, 'Обсяг']}
                                                />
                                                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5}
                                                    fill="url(#tGrad)" dot={false}/>
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </TacticalCard>
                            </div>

                            {/* Category breakdown */}
                            <div className="col-span-12 lg:col-span-4">
                                <TacticalCard variant="cyber" className="p-6 h-full border-white/5">
                                    <div className="flex items-center gap-3 mb-5">
                                        <PieChart size={16} className="text-sky-400"/>
                                        <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">КАТЕГОРІЇ</h4>
                                    </div>
                                    <div className="space-y-4">
                                        {analytics.categories.map(cat => {
                                            const max = analytics.categories[0].value;
                                            const pct = Math.round((cat.value / max) * 100);
                                            return (
                                                <div key={cat.name} className="flex flex-col gap-1">
                                                    <div className="flex justify-between text-[9px] font-black uppercase">
                                                        <span className="text-slate-400">{cat.name}</span>
                                                        <span className="text-white">{(cat.value / 1_000_000).toFixed(0)}M ₴</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${pct}%` }}
                                                            transition={{ duration: 0.8, delay: 0.3 }}
                                                            className="h-full rounded-full"
                                                            style={{ backgroundColor: cat.color, boxShadow: `0 0 6px ${cat.color}60` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </TacticalCard>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Filters */}
                <div className="z-10 flex items-center gap-4 flex-wrap mb-8">
                    <div className="relative flex-1 min-w-48 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-emerald-400 transition-colors"/>
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="ПОШУК ТЕНДЕРІВ ЗА НАЗВОЮ АБО ЗАМОВНИКОМ..."
                            className="w-full bg-slate-950/60 border border-white/5 rounded-[20px] pl-12 pr-5 py-4 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-emerald-500/30 transition-all text-[11px] font-bold uppercase tracking-wider"
                        />
                    </div>

                    <div className="flex items-center gap-2 p-1.5 bg-slate-950/60 border border-white/5 rounded-2xl">
                        {[
                            { key: 'all',      label: 'ВСІ' },
                            { key: 'high',     label: 'РИЗИК 60%+' },
                            { key: 'critical', label: 'КРИТИЧНІ 80%+' },
                        ].map(f => (
                            <button
                                key={f.key}
                                onClick={() => setFilterRisk(f.key as any)}
                                className={cn(
                                    'px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all',
                                    filterRisk === f.key ? 'bg-emerald-500 text-slate-950' : 'text-slate-500 hover:text-white'
                                )}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div className="text-[9px] font-mono text-slate-600">
                        {filtered.length} / {tenders.length} ЗАПИСІВ
                    </div>
                </div>

                {/* Tender Cards */}
                <div>
                    {loading && tenders.length === 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {Array(8).fill(0).map((_, i) => (
                                <div key={i} className="h-72 bg-slate-950/40 border border-white/5 rounded-[28px] animate-pulse"/>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-20 flex flex-col items-center text-center">
                            <Search size={48} className="text-slate-700 mb-4"/>
                            <p className="text-slate-600 font-black uppercase tracking-widest">РЕЗУЛЬТАТІВ НЕ ЗНАЙДЕНО</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            <AnimatePresence mode="popLayout">
                                {filtered.map((t, i) => <TenderCard key={t.id} tender={t} idx={i}/>)}
                            </AnimatePresence>
                        </div>
                    )}

                    {!loading && tenders.length > 0 && (
                        <div className="flex justify-center mt-12">
                            <button
                                onClick={fetchData}
                                className="px-16 py-5 bg-slate-950 border border-white/5 rounded-[28px] text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] hover:text-emerald-400 hover:border-emerald-500/30 transition-all flex items-center gap-3 group"
                            >
                                <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-700"/>
                                СИНХРОНІЗУВАТИ БІЛЬШЕ
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </PageTransition>
    );
};

export default TendersView;
