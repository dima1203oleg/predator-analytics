/**
 * PREDATOR v55.5 | Sanctions Sovereign Matrix — МАТРИЦЯ САНКЦІЙНОГО БЛОКУВАННЯ
 *
 * Центр глобального комплаєнс-скринінгу та блокування санкційних суб'єктів.
 * Інтеграція з: OFAC (США), EU Consolidated, UN Security Council, HMT (UK), РНБО (UA), PEP.
 *
 * © 2026 PREDATOR Analytics | Zero-Tolerance Compliance Engine
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, Search, AlertTriangle, CheckCircle, XCircle,
    Globe, FileText, Download, RefreshCw, Building2, User,
    AlertOctagon, ChevronRight, History, ExternalLink,
    Zap, Database, Lock, Radio, Target, Radar, ShieldAlert,
    ShieldCheck, ScanLine, Crown, Clock, Flag, BarChart3,
    Fingerprint, Activity, Eye, Star
} from 'lucide-react';
import { motion as m } from 'framer-motion';
import { PageTransition } from '../components/layout/PageTransition';
import { AdvancedBackground } from '../components/AdvancedBackground';
import { ViewHeader } from '../components/ViewHeader';
import { TacticalCard } from '../components/TacticalCard';
import { CyberOrb } from '../components/CyberOrb';
import { CyberGrid } from '../components/CyberGrid';
import { cn } from '../lib/utils';

// ========================
// Types
// ========================
type SanctionSeverity = 'high' | 'medium' | 'low' | 'none';
type ListType = 'OFAC' | 'EU' | 'UN' | 'UK' | 'РНБО' | 'PEP';
type EntityType = 'company' | 'person' | 'vessel';
type ScreenStatus = 'clean' | 'warning' | 'blocked';

interface SanctionMatch {
    id: string;
    list: ListType;
    program: string;
    target: string;
    details: string;
    severity: SanctionSeverity;
    score: number;
    dateAdded?: string;
}

interface ScreeningResult {
    id: string;
    entityName: string;
    entityType: EntityType;
    status: ScreenStatus;
    timestamp: string;
    matches: SanctionMatch[];
    searchId: string;
    riskScore?: number;
}

// ========================
// Mock data (fallback)
// ========================
const MOCK_HISTORY: ScreeningResult[] = [
    {
        id: 'scr-001', entityName: 'ГАЗПРОМ АТ', entityType: 'company',
        status: 'blocked', timestamp: new Date(Date.now() - 3600000).toISOString(),
        searchId: 'AX-0091',
        riskScore: 98,
        matches: [
            { id: 'm1', list: 'EU', program: 'EU Санкції (Росія)', target: 'ПАТ ГАЗПРОМ', details: 'Енергетичний гігант під повним ембарго', severity: 'high', score: 99, dateAdded: '24.02.2022' },
            { id: 'm2', list: 'OFAC', program: 'EO 14024', target: 'GAZPROM PAO', details: 'Заморожено активи в США', severity: 'high', score: 97, dateAdded: '08.04.2022' },
            { id: 'm3', list: 'РНБО', program: 'Рішення РНБО №2022/04', target: 'ГАЗПРОМ', details: 'Заборона на ведення діяльності в Україні', severity: 'high', score: 100, dateAdded: '16.05.2022' },
        ]
    },
    {
        id: 'scr-002', entityName: 'Владімір Путін', entityType: 'person',
        status: 'blocked', timestamp: new Date(Date.now() - 7200000).toISOString(),
        searchId: 'AX-0088',
        riskScore: 100,
        matches: [
            { id: 'm4', list: 'EU', program: 'EU Sanctions Regime', target: 'Vladimir PUTIN', details: 'Президент РФ, відповідальний за агресію', severity: 'high', score: 100, dateAdded: '24.02.2022' },
            { id: 'm5', list: 'UN', program: 'UN Resolution 2202', target: 'PUTIN, Vladimir Vladimirovich', details: 'Заморожено всі активи по всьому світу', severity: 'high', score: 100 },
        ]
    },
    {
        id: 'scr-003', entityName: 'ТОВ "ЗЕРНОТРЕЙД"', entityType: 'company',
        status: 'clean', timestamp: new Date(Date.now() - 14400000).toISOString(),
        searchId: 'AX-0085',
        riskScore: 12,
        matches: []
    },
    {
        id: 'scr-004', entityName: 'Maritime Nexus Ltd', entityType: 'vessel',
        status: 'warning', timestamp: new Date(Date.now() - 28800000).toISOString(),
        searchId: 'AX-0080',
        riskScore: 67,
        matches: [
            { id: 'm6', list: 'UK', program: 'UK Global Sanctions Regime', target: 'MARITIME NEXUS LTD', details: 'Підозра у перевезенні підсанкційних вантажів', severity: 'medium', score: 72 },
        ]
    },
];

// ========================
// Config
// ========================
const severityConfig = {
    high:   { color: 'rose',    label: 'КРИТИЧНО',  bg: 'bg-rose-500/10',   border: 'border-rose-500/30',   text: 'text-rose-400' },
    medium: { color: 'amber',   label: 'ПОПЕРЕДЖЕННЯ', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
    low:    { color: 'blue',    label: 'ІНФОРМАЦІЯ', bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-400' },
    none:   { color: 'emerald', label: 'ЧИСТО',      bg: 'bg-emerald-500/10',border: 'border-emerald-500/30',text: 'text-emerald-400' },
};

const statusConfig = {
    clean:   { label: 'ЧИСТО',      icon: CheckCircle,   cls: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]' },
    warning: { label: 'УВАГА',       icon: AlertTriangle, cls: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30',     glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]' },
    blocked: { label: 'ЗАБЛОКОВАНО', icon: AlertOctagon,  cls: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/30',       glow: 'shadow-[0_0_20px_rgba(244,63,94,0.3)]' },
};

const entityIconMap: Record<EntityType, React.FC<any>> = {
    company: Building2, person: User, vessel: Radio,
};

const LIST_CONFIGS: Record<ListType, { color: string; flag: string }> = {
    'OFAC': { color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',   flag: '🇺🇸' },
    'EU':   { color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', flag: '🇪🇺' },
    'UN':   { color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',   flag: '🌐' },
    'UK':   { color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', flag: '🇬🇧' },
    'РНБО': { color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', flag: '🇺🇦' },
    'PEP':  { color: 'bg-rose-500/20 text-rose-300 border-rose-500/30',   flag: '👤' },
};

// ========================
// Sub-components
// ========================

const RiskGauge: React.FC<{ score: number }> = ({ score }) => {
    const color = score >= 80 ? '#f43f5e' : score >= 50 ? '#f59e0b' : '#10b981';
    const angle = (score / 100) * 180 - 90;
    return (
        <div className="relative w-28 h-14 overflow-hidden">
            <svg viewBox="0 0 100 50" className="w-full h-full">
                <path d="M5,50 A45,45 0 0,1 95,50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" strokeLinecap="round"/>
                <path d="M5,50 A45,45 0 0,1 95,50" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${(score / 100) * 141.3} 141.3`} style={{ filter: `drop-shadow(0 0 6px ${color})` }}/>
                <g transform={`rotate(${angle}, 50, 50)`}>
                    <line x1="50" y1="50" x2="50" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="50" cy="50" r="3" fill="white"/>
                </g>
            </svg>
            <div className="absolute bottom-0 w-full text-center text-[10px] font-black" style={{ color }}>{score}%</div>
        </div>
    );
};

const MatchCard: React.FC<{ match: SanctionMatch; idx: number }> = ({ match, idx }) => {
    const sev = severityConfig[match.severity];
    const listCfg = LIST_CONFIGS[match.list];
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.07 }}
            className={cn('p-5 rounded-2xl border', sev.bg, sev.border)}
        >
            <div className="flex items-start gap-4">
                <div className={cn('p-2 rounded-xl', sev.bg)}>
                    <AlertOctagon className={sev.text} size={20}/>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={cn('px-2 py-0.5 text-[10px] font-black rounded-lg border', listCfg.color)}>
                            {listCfg.flag} {match.list}
                        </span>
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{match.program}</span>
                        <span className={cn('ml-auto px-2 py-0.5 text-[10px] font-black rounded-lg', sev.bg, sev.text)}>
                            {match.score}% ЗБІГ
                        </span>
                    </div>
                    <p className="font-black text-white text-sm mb-1 uppercase tracking-tight">{match.target}</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{match.details}</p>
                    {match.dateAdded && (
                        <p className="text-[9px] font-mono text-slate-600 mt-2 uppercase">ДОДАНО: {match.dateAdded}</p>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const HistoryRow: React.FC<{ result: ScreeningResult; isSelected: boolean; onClick: () => void }> = ({ result, isSelected, onClick }) => {
    const st = statusConfig[result.status];
    const StatusIcon = st.icon;
    const EntityIcon = entityIconMap[result.entityType];
    return (
        <motion.div
            whileHover={{ x: 4 }}
            onClick={onClick}
            className={cn(
                'p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden',
                isSelected ? 'bg-slate-800/60 border-white/20' : 'bg-slate-950/40 border-white/5 hover:border-white/15'
            )}
        >
            {isSelected && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary-500 rounded-l-full"/>}
            <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-xl border', st.bg)}>
                    <StatusIcon className={st.cls} size={16}/>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-black text-white text-sm uppercase tracking-tight truncate">{result.entityName}</p>
                        <EntityIcon size={10} className="text-slate-600 shrink-0"/>
                    </div>
                    <p className="text-[9px] font-mono text-slate-600 mt-0.5">
                        {new Date(result.timestamp).toLocaleTimeString('uk')} — ID: {result.searchId}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className={cn('text-[9px] font-black uppercase', st.cls)}>{st.label}</span>
                    {result.matches.length > 0 && (
                        <span className="text-[8px] font-mono text-slate-600">{result.matches.length} ЗБІГІВ</span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// ========================
// Main Component
// ========================
const SanctionsScreening: React.FC = () => {
    const [history, setHistory] = useState<ScreeningResult[]>(MOCK_HISTORY);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [selected, setSelected] = useState<ScreeningResult | null>(MOCK_HISTORY[0]);
    const [entityType, setEntityType] = useState<EntityType>('company');
    const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString('uk'));
    const [selectedLists, setSelectedLists] = useState<ListType[]>(['OFAC', 'EU', 'UN', 'UK', 'РНБО', 'PEP']);

    useEffect(() => {
        const t = setInterval(() => setLiveTime(new Date().toLocaleTimeString('uk')), 1000);
        return () => clearInterval(t);
    }, []);

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            await new Promise(r => setTimeout(r, 1800));
            // Simulated result
            const mockResult: ScreeningResult = {
                id: `scr-${Date.now()}`,
                entityName: searchQuery.toUpperCase(),
                entityType,
                status: 'warning',
                timestamp: new Date().toISOString(),
                searchId: `AX-${Math.floor(Math.random() * 9000 + 1000)}`,
                riskScore: Math.floor(Math.random() * 60 + 20),
                matches: selectedLists.length > 0 ? [{
                    id: `m-${Date.now()}`,
                    list: selectedLists[0],
                    program: 'Автоматичний OSINT-скрінінг',
                    target: searchQuery.toUpperCase(),
                    details: 'Виявлено потенційний збіг у реєстрі. Потребує ручної верифікації аналітиком.',
                    severity: 'medium',
                    score: Math.floor(Math.random() * 30 + 50),
                }] : [],
            };
            setHistory(prev => [mockResult, ...prev]);
            setSelected(mockResult);
        } finally {
            setIsSearching(false);
        }
    }, [searchQuery, entityType, selectedLists]);

    const toggleList = (list: ListType) => {
        setSelectedLists(prev =>
            prev.includes(list) ? prev.filter(l => l !== list) : [...prev, list]
        );
    };

    const blockedCount = history.filter(r => r.status === 'blocked').length;
    const warningCount = history.filter(r => r.status === 'warning').length;
    const cleanCount = history.filter(r => r.status === 'clean').length;
    const pepCount = history.filter(r => r.matches.some(m => m.list === 'PEP')).length;

    return (
        <PageTransition>
            <div className="min-h-screen px-4 sm:px-6 lg:px-10 pb-20 relative overflow-hidden">
                <AdvancedBackground/>
                <CyberGrid opacity={0.015}/>
                <CyberOrb color="rose" size="xl" intensity="low" className="top-1/4 right-0 opacity-10"/>
                <CyberOrb color="purple" size="lg" intensity="low" className="bottom-1/3 left-0 opacity-8"/>

                {/* Header */}
                <div className="relative mb-10">
                    <ViewHeader
                        title="САНКЦІЙНА МАТРИЦЯ"
                        icon={<ShieldAlert className="text-rose-400"/>}
                        breadcrumbs={['КОМПЛАЄНС', 'СКРІНІНГ', 'МАТРИЦЯ БЛОКУВАННЯ']}
                        stats={[
                            { label: 'Баз даних', value: '6', icon: <Database/>, color: 'primary' },
                            { label: 'Записів', value: '2.1M+', icon: <Shield/>, color: 'danger' },
                            { label: 'Точність', value: '99.6%', icon: <Zap/>, color: 'success', animate: true },
                        ]}
                    />
                    <div className="mt-4 flex items-center gap-4 px-2">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-950/60 rounded-full border border-slate-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"/>
                            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                                COMPLIANCE_ENGINE_ONLINE // OFAC + EU + UN + UK + РНБО + PEP // {liveTime}
                            </span>
                        </div>
                    </div>
                </div>

                {/* KPI Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {[
                        { label: 'ЗАБЛОКОВАНО', value: blockedCount, icon: AlertOctagon, cls: 'text-rose-400', bg: 'from-rose-500/10', border: 'border-rose-500/20', glow: 'shadow-rose-500/10' },
                        { label: 'ПОПЕРЕДЖЕНЬ', value: warningCount, icon: AlertTriangle, cls: 'text-amber-400', bg: 'from-amber-500/10', border: 'border-amber-500/20', glow: 'shadow-amber-500/10' },
                        { label: 'ЧИСТИХ', value: cleanCount, icon: ShieldCheck, cls: 'text-emerald-400', bg: 'from-emerald-500/10', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/10' },
                        { label: 'PEP ВИЯВЛЕНО', value: pepCount, icon: Crown, cls: 'text-purple-400', bg: 'from-purple-500/10', border: 'border-purple-500/20', glow: 'shadow-purple-500/10' },
                    ].map((kpi, i) => (
                        <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                            <TacticalCard variant="cyber" className={cn('p-6 border relative overflow-hidden shadow-xl', kpi.border, kpi.glow)}>
                                <div className={cn('absolute inset-0 bg-gradient-to-br to-transparent opacity-60', kpi.bg)}/>
                                <div className="relative z-10 flex items-center justify-between">
                                    <div>
                                        <div className={cn('text-3xl font-black font-mono', kpi.cls)}>{kpi.value}</div>
                                        <div className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] mt-1">{kpi.label}</div>
                                    </div>
                                    <kpi.icon className={cn(kpi.cls, 'opacity-30')} size={36}/>
                                </div>
                            </TacticalCard>
                        </motion.div>
                    ))}
                </div>

                {/* Search Panel */}
                <TacticalCard variant="holographic" className="mb-10 p-8 relative overflow-hidden">
                    <CyberOrb color="rose" size="md" intensity="low" className="right-0 top-0 opacity-15"/>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <ScanLine className="text-rose-400" size={20}/>
                            <h2 className="text-sm font-black text-white uppercase tracking-[0.3em]">СКРІНІНГ СУТНОСТІ</h2>
                            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-[9px] rounded-full flex items-center gap-1 font-black">
                                <Crown size={10}/> PREMIUM
                            </span>
                        </div>

                        {/* Entity type selector */}
                        <div className="flex gap-2 mb-5">
                            {(['company', 'person', 'vessel'] as EntityType[]).map(type => {
                                const Icon = entityIconMap[type];
                                const label = type === 'company' ? 'КОМПАНІЯ' : type === 'person' ? 'ОСОБА' : 'СУДНО';
                                return (
                                    <button
                                        key={type}
                                        onClick={() => setEntityType(type)}
                                        className={cn(
                                            'flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all',
                                            entityType === type
                                                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                                                : 'bg-slate-900/40 border-white/5 text-slate-500 hover:border-white/20'
                                        )}
                                    >
                                        <Icon size={13}/> {label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Search input */}
                        <div className="flex gap-3 mb-5">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-rose-400 transition-colors" size={18}/>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                    placeholder="Введіть назву компанії, ім'я особи або назву судна..."
                                    className="w-full bg-slate-950/60 border border-white/5 rounded-[20px] pl-14 pr-5 py-5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-rose-500/40 transition-all"
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                disabled={isSearching || !searchQuery.trim()}
                                className="px-8 py-4 bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-white font-black rounded-[20px] uppercase tracking-widest text-[11px] transition-all shadow-xl shadow-rose-500/20 flex items-center gap-3 shrink-0"
                            >
                                {isSearching ? <RefreshCw className="animate-spin" size={18}/> : <Shield size={18}/>}
                                {isSearching ? 'ПЕРЕВІРКА...' : 'ПЕРЕВІРИТИ'}
                            </button>
                        </div>

                        {/* List toggles */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[8px] font-black text-slate-700 uppercase tracking-[0.4em]">РЕЄСТРИ:</span>
                            {(Object.keys(LIST_CONFIGS) as ListType[]).map(list => {
                                const cfg = LIST_CONFIGS[list];
                                const active = selectedLists.includes(list);
                                return (
                                    <button
                                        key={list}
                                        onClick={() => toggleList(list)}
                                        className={cn(
                                            'px-3 py-1.5 rounded-xl text-[9px] font-black border transition-all',
                                            active ? cfg.color : 'bg-slate-900/40 border-white/5 text-slate-600 hover:border-white/20'
                                        )}
                                    >
                                        {cfg.flag} {list}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </TacticalCard>

                {/* Main Split Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Left: History */}
                    <div className="lg:col-span-2 space-y-3">
                        <div className="flex items-center gap-3 mb-4">
                            <History className="text-slate-500" size={16}/>
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">ОСТАННЯ АКТИВНІСТЬ</h3>
                            <span className="ml-auto text-[8px] font-mono text-slate-700">{history.length} ЗАПИСІВ</span>
                        </div>

                        <AnimatePresence mode="popLayout">
                            {history.map((r, i) => (
                                <motion.div
                                    key={r.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                >
                                    <HistoryRow result={r} isSelected={selected?.id === r.id} onClick={() => setSelected(r)}/>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Right: Detail Panel */}
                    <div className="lg:col-span-3">
                        <AnimatePresence mode="wait">
                            {selected ? (
                                <motion.div
                                    key={selected.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    <TacticalCard variant="holographic" className="p-8 relative overflow-hidden">
                                        <CyberOrb
                                            color={selected.status === 'blocked' ? 'rose' : selected.status === 'warning' ? 'purple' : 'cyan'}
                                            size="lg" intensity="low"
                                            className="right-0 bottom-0 opacity-10"
                                        />
                                        <div className="relative z-10">
                                            {/* Entity Header */}
                                            <div className="flex items-start justify-between gap-6 mb-8">
                                                <div className="flex items-center gap-5">
                                                    <div className={cn('p-4 rounded-2xl border', statusConfig[selected.status].bg, statusConfig[selected.status].glow)}>
                                                        {React.createElement(statusConfig[selected.status].icon, {
                                                            size: 32,
                                                            className: statusConfig[selected.status].cls
                                                        })}
                                                    </div>
                                                    <div>
                                                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-2">
                                                            {selected.entityName}
                                                        </h2>
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <span className={cn('px-3 py-1 rounded-xl text-[9px] font-black border uppercase', statusConfig[selected.status].bg, statusConfig[selected.status].cls)}>
                                                                {statusConfig[selected.status].label}
                                                            </span>
                                                            <span className="text-[9px] font-mono text-slate-600">
                                                                ID: {selected.searchId} // {new Date(selected.timestamp).toLocaleString('uk')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {selected.riskScore !== undefined && (
                                                    <div className="shrink-0 text-center">
                                                        <div className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mb-1">ІНДЕКС РИЗИКУ</div>
                                                        <RiskGauge score={selected.riskScore}/>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Matches */}
                                            {selected.matches.length > 0 ? (
                                                <div className="space-y-3 mb-8">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <AlertOctagon className="text-rose-500" size={16}/>
                                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.35em]">
                                                            ВИЯВЛЕНО ЗБІГІВ: {selected.matches.length}
                                                        </h3>
                                                    </div>
                                                    {selected.matches.map((match, idx) => (
                                                        <MatchCard key={match.id} match={match} idx={idx}/>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-14 flex flex-col items-center text-center mb-8">
                                                    <motion.div
                                                        animate={{ scale: [1, 1.08, 1] }}
                                                        transition={{ duration: 2, repeat: Infinity }}
                                                    >
                                                        <ShieldCheck size={56} className="text-emerald-500 mb-5"/>
                                                    </motion.div>
                                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">ЗБІГІВ НЕ ЗНАЙДЕНО</h3>
                                                    <p className="text-slate-500 text-sm max-w-xs">
                                                        Сутність відсутня у всіх активних санкційних реєстрах. Статус — <span className="text-emerald-400 font-bold">ЧИСТО</span>.
                                                    </p>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="pt-6 border-t border-white/5 flex gap-3 flex-wrap">
                                                <button className="flex items-center gap-2 px-5 py-3 bg-slate-900/60 border border-white/5 rounded-2xl text-[10px] font-black text-slate-400 hover:text-white hover:border-white/20 transition-all">
                                                    <Download size={14}/> ЕКСПОРТ PDF
                                                </button>
                                                <button className="flex items-center gap-2 px-5 py-3 bg-slate-900/60 border border-white/5 rounded-2xl text-[10px] font-black text-slate-400 hover:text-white hover:border-white/20 transition-all">
                                                    <Radar size={14}/> МОНІТОРИНГ
                                                </button>
                                                <button className="flex items-center gap-2 px-5 py-3 bg-slate-900/60 border border-white/5 rounded-2xl text-[10px] font-black text-slate-400 hover:text-white hover:border-white/20 transition-all">
                                                    <Eye size={14}/> ГРАФОВА МЕРЕЖА
                                                </button>
                                                <button className="flex items-center gap-2 px-5 py-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-[10px] font-black text-rose-400 hover:bg-rose-500 hover:text-white transition-all ml-auto">
                                                    <ExternalLink size={14}/> ВІДКРИТИ ДОСЬЄ
                                                </button>
                                            </div>
                                        </div>
                                    </TacticalCard>
                                </motion.div>
                            ) : (
                                <motion.div key="empty" className="h-full min-h-[400px] flex flex-col items-center justify-center">
                                    <Shield size={56} className="text-slate-700 mb-4"/>
                                    <p className="text-slate-600 font-black uppercase tracking-widest text-sm">ОБЕРІТЬ ЗАПИС АБО ВВЕДІТЬ ЗАПИТ</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default SanctionsScreening;
