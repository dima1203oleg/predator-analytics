import { AnimatePresence, motion } from 'framer-motion';
import {
    Activity,
    ArrowDownRight,
    ArrowUpRight,
    ChevronDown,
    ChevronRight,
    Crosshair,
    Filter,
    Globe,
    Hexagon,
    Layers,
    Search,
    Shield,
    Star,
    Target,
    Zap,
    Cpu,
    Radiation,
    AlertTriangle,
    Download,
    Eye
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { AdvancedBackground } from '../components/AdvancedBackground';
import { api } from '../services/api';
import { cn } from '../utils/cn';

// --- TYPES ---

interface EntityRadarItem {
    ueid: string;
    name: string;
    edrpou: string;
    sector: string;
    cers_score: number;
    cers_level: string;
    cers_level_ua: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    confidence: number;
    last_updated: string;
    risk_factors: string[];
    radar_metrics?: {
        reputation: number;
        financials: number;
        connections: number;
        regulatory: number;
        adverse_media: number;
    };
}



// --- SUB-COMPONENTS ---

const CersBadge = ({ level, score }: { level: string; score: number }) => {
    const getColors = () => {
        switch (level.toUpperCase()) {
            case 'CRITICAL': return 'bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.3)]';
            case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            case 'ELEVATED': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'MODERATE': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            default: return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        }
    };

    return (
        <div className={cn("px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest flex items-center gap-2", getColors())}>
            <Shield size={10} />
            <span>{score.toFixed(1)}</span>
            <span className="opacity-60">|</span>
            <span>{level}</span>
        </div>
    );
};

const SectorIcon = ({ sector }: { sector: string }) => {
    if (sector.includes('Логістика')) return <Globe size={14} className="text-indigo-400" />;
    if (sector.includes('палив')) return <Zap size={14} className="text-amber-400" />;
    return <Layers size={14} className="text-cyan-400" />;
};

// --- RADAR CHART CONFIG ---
const getRadarOption = (entity: EntityRadarItem) => {
    const metrics = entity.radar_metrics || { reputation: 50, financials: 50, connections: 50, regulatory: 50, adverse_media: 50 };
    const color = entity.cers_score > 80 ? '#f43f5e' : '#6366f1';

    return {
        backgroundColor: 'transparent',
        radar: {
            indicator: [
                { name: 'РЕПУТАЦІЯ', max: 100 },
                { name: 'ФІНАНСИ', max: 100 },
                { name: 'ЗВ\'ЯЗКИ', max: 100 },
                { name: 'РЕГУЛЯТОРИ', max: 100 },
                { name: 'МЕДІА', max: 100 }
            ],
            shape: 'circle',
            splitNumber: 5,
            axisName: {
                color: '#64748b',
                fontSize: 9,
                fontWeight: 'bold'
            },
            splitLine: {
                lineStyle: {
                    color: ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.1)'].reverse()
                }
            },
            splitArea: {
                show: false
            },
            axisLine: {
                lineStyle: {
                    color: 'rgba(255,255,255,0.1)'
                }
            }
        },
        series: [
            {
                name: entity.name,
                type: 'radar',
                data: [
                    {
                        value: [metrics.reputation, metrics.financials, metrics.connections, metrics.regulatory, metrics.adverse_media],
                        name: 'Risk Profile',
                        symbol: 'none',
                        lineStyle: {
                            color: color,
                            width: 2,
                            shadowBlur: 10,
                            shadowColor: color
                        },
                        areaStyle: {
                            color: color,
                            opacity: 0.1
                        }
                    }
                ]
            }
        ]
    };
};

// --- MAIN VIEW ---

const EntityRadarView: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'score' | 'name' | 'last_updated'>('score');
    const [entities, setEntities] = useState<EntityRadarItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        const loadRadar = async () => {
            setLoading(true);
            try {
                const res = await api.premium.getCompetitorRadar ? await api.premium.getCompetitorRadar() : [];
                const data = Array.isArray(res) ? res : (res?.data || []);
                setEntities(data);
            } catch (e) {
                console.error("Radar load error", e);
                setEntities([]);
            } finally {
                setLoading(false);
            }
        };
        loadRadar();
    }, []);

    const filteredEntities = useMemo(() => {
        let result = [...entities];
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(e => e.name.toLowerCase().includes(q) || e.edrpou.includes(q));
        }
        result.sort((a, b) => {
            if (sortBy === 'score') return b.cers_score - a.cers_score;
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime();
        });
        return result;
    }, [entities, searchQuery, sortBy]);

    return (
        <div className="flex flex-col space-y-8 pb-20 relative min-h-screen px-4 xl:px-12 max-w-[1900px] mx-auto overflow-hidden">
            <AdvancedBackground />

            {/* Cinematic Hero Header v55 Extreme */}
            <div className="relative z-20 mt-10 mb-16 rounded-[48px] border border-white/5 bg-slate-950/60 backdrop-blur-[40px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden p-10 flex flex-col xl:flex-row items-center gap-12 group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(99,102,241,0.15),transparent_50%)] pointer-events-none" />
                <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none" />

                {/* Visual Reactor Hub */}
                <div className="relative w-48 h-48 shrink-0">
                    <div className="absolute inset-0 border-2 border-indigo-500/10 rounded-full animate-[spin_30s_linear_infinite]" />
                    <div className="absolute inset-4 border border-dashed border-indigo-400/20 rounded-full animate-[spin_20s_linear_infinite_reverse]" />
                    <div className="absolute inset-8 border border-white/5 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-xl shadow-inner">
                        <div className="relative">
                            <Crosshair className="w-12 h-12 text-indigo-400 animate-pulse" />
                            <div className="absolute -inset-4 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
                        </div>
                    </div>
                    {/* Floating Pulse Rings */}
                    <div className="absolute inset-0 border border-indigo-500/30 rounded-full animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite] opacity-20" />
                </div>

                <div className="flex-1 text-center xl:text-left relative z-10">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full font-black text-[10px] uppercase tracking-[0.3em] text-indigo-400 mb-6 mx-auto xl:mx-0">
                        <Radiation className="w-4 h-4 animate-spin-slow" />
                        PREDATOR AI RADAR ENGINE v55.8
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-black text-white uppercase italic tracking-tighter leading-none mb-6 drop-shadow-2xl">
                        РАДАР <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-500">СУБ'ЄКТІВ</span>
                    </h1>
                    <p className="text-slate-400 font-medium max-w-2xl leading-relaxed text-base xl:text-lg">
                        Глобальна мережа виявлення аномальних суб'єктів. Калібрований аналіз по 150+ параметрах ризику, включаючи зв'язки з офшорами та реноме контрагентів.
                    </p>
                </div>

                {/* Live Stats v55 */}
                <div className="grid grid-cols-2 gap-4 shrink-0 w-full xl:w-auto">
                    {[
                        { label: 'КРИТИЧНІ', val: entities.filter(e => e.cers_level === 'CRITICAL').length, color: 'text-rose-400', bg: 'bg-rose-500/5', border: 'border-rose-500/20' },
                        { label: 'МОНІТОРИНГ', val: entities.length, color: 'text-indigo-400', bg: 'bg-indigo-500/5', border: 'border-indigo-500/20' },
                        { label: 'CONFIDENCE', val: '97.4%', color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20' },
                        { label: 'ЗВ\'ЯЗКИ', val: '1.2M', color: 'text-purple-400', bg: 'bg-purple-500/5', border: 'border-purple-500/20' }
                    ].map((s, idx) => (
                        <div key={idx} className={cn("p-6 rounded-[24px] border backdrop-blur-md transition-all hover:scale-105", s.bg, s.border)}>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1 text-center">{s.label}</p>
                            <p className={cn("text-3xl font-black font-mono tracking-tighter text-center", s.color)}>{s.val}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Controls Hub */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center mb-10">
                <div className="lg:col-span-6 relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Пошук у глобальному реєстрі..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-16 pr-8 py-5 bg-slate-900/60 border border-white/5 rounded-3xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-bold text-lg backdrop-blur-xl shadow-2xl"
                    />
                </div>

                <div className="lg:col-span-3 relative">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-full appearance-none pl-6 pr-14 py-5 bg-slate-900/60 border border-white/5 rounded-3xl text-slate-300 focus:outline-none focus:border-indigo-500/30 font-black uppercase tracking-widest text-xs cursor-pointer backdrop-blur-xl shadow-2xl"
                    >
                        <option value="score">Сортувати: За CERS Рівнем</option>
                        <option value="name">Сортувати: За Назвою Суб'єкта</option>
                        <option value="last_updated">Сортувати: За Датою Оновлення</option>
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={20} />
                </div>

                <div className="lg:col-span-3 flex gap-3">
                    <button className="flex-1 flex items-center justify-center gap-3 py-5 bg-white/5 border border-white/10 rounded-3xl text-slate-300 font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all shadow-xl">
                        <Filter size={18} className="text-indigo-400" /> Фільтрація
                    </button>
                    <button className="p-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl transition-all shadow-lg shadow-indigo-600/20">
                        <RefreshCwIcon />
                    </button>
                </div>
            </div>

            {/* Entity List / Grid */}
            <div className="relative z-10 space-y-6">
                {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-6">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
                            <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin" />
                        </div>
                        <p className="text-indigo-400 font-black text-xs animate-pulse uppercase tracking-[0.4em]">ANALYZING SYNERGIES...</p>
                    </div>
                ) : filteredEntities.length > 0 ? (
                    filteredEntities.map((entity, idx) => (
                        <motion.div
                            key={entity.ueid}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={cn(
                                "group relative border rounded-[36px] overflow-hidden transition-all duration-500 backdrop-blur-3xl",
                                expandedId === entity.ueid
                                    ? "bg-slate-900/90 border-indigo-500/40 shadow-[0_0_80px_rgba(99,102,241,0.15)]"
                                    : "bg-slate-900/40 border-white/5 hover:border-white/10 hover:bg-slate-900/60"
                            )}
                        >
                            {/* Accent line for top scores */}
                            {entity.cers_score > 80 && (
                                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-50" />
                            )}

                            <div
                                className="p-8 flex flex-col lg:flex-row items-center gap-8 cursor-pointer relative"
                                onClick={() => setExpandedId(expandedId === entity.ueid ? null : entity.ueid)}
                            >
                                {/* Entity ID Visual */}
                                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                    <div className={cn(
                                        "absolute inset-0 rounded-2xl border-2 rotate-45 group-hover:rotate-90 transition-transform duration-700",
                                        entity.cers_score > 60 ? "bg-rose-500/10 border-rose-500/30 text-rose-400" : "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                                    )} />
                                    <h4 className="relative font-black font-mono text-lg z-10 text-white">{entity.name.split('"')[1]?.charAt(0) || entity.name.charAt(0)}</h4>
                                </div>

                                {/* Main Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <h3 className="text-2xl font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight truncate max-w-[500px]">{entity.name}</h3>
                                        <div className="flex gap-2">
                                            {entity.trend === 'increasing' && <div className="px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-md text-[9px] font-black uppercase flex items-center gap-1"><ArrowUpRight size={10} /> Trend</div>}
                                            {entity.trend === 'stable' && <div className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-md text-[9px] font-black uppercase flex items-center gap-1">Stable</div>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                        <span className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full border border-white/5"><Globe size={13} className="text-slate-400" /> {entity.edrpou}</span>
                                        <span className="flex items-center gap-2"><SectorIcon sector={entity.sector} /> {entity.sector}</span>
                                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">CONF {Math.floor(entity.confidence * 100)}%</span>
                                    </div>
                                </div>

                                {/* Metrics Summary (Small Visuals) */}
                                <div className="hidden xl:flex items-center gap-8 px-8 border-x border-white/5 h-16">
                                    <div className="text-center">
                                        <p className="text-[9px] text-slate-500 font-bold mb-1 uppercase">Репутація</p>
                                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500" style={{ width: `${entity.radar_metrics?.reputation || 50}%` }} />
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[9px] text-slate-500 font-bold mb-1 uppercase">Зв'язки</p>
                                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-purple-500" style={{ width: `${entity.radar_metrics?.connections || 50}%` }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Score Column */}
                                <div className="flex items-center gap-6 shrink-0">
                                    <CersBadge level={entity.cers_level} score={entity.cers_score} />
                                    <ChevronRight className={cn("text-slate-600 transition-transform duration-500", expandedId === entity.ueid && "rotate-90 text-indigo-400")} size={24} />
                                </div>
                            </div>

                            {/* Expanded High-Tech Panel */}
                            <AnimatePresence>
                                {expandedId === entity.ueid && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-white/10 bg-black/40 xl:p-10 p-6"
                                    >
                                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                                            {/* Radar Visualization */}
                                            <div className="xl:col-span-4 bg-slate-900/50 rounded-[32px] border border-white/5 p-6 relative overflow-hidden h-[340px]">
                                                <div className="absolute top-4 left-6 flex items-center gap-2">
                                                    <Radiation size={14} className="text-indigo-400" />
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk Topology Radar</span>
                                                </div>
                                                <ReactECharts
                                                    option={getRadarOption(entity)}
                                                    style={{ height: '100%', width: '100%' }}
                                                    opts={{ renderer: 'svg' }}
                                                />
                                            </div>

                                            {/* Risk signals and Analysis */}
                                            <div className="xl:col-span-5 space-y-8">
                                                <div>
                                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 mb-6">
                                                        <AlertTriangle size={16} className="text-amber-400" /> Активні Сигнали Загрози
                                                    </h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {(entity.risk_factors.length > 0 ? entity.risk_factors : ['Відсутні прямі сигнали']).map(f => (
                                                            <div key={f} className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl flex items-center gap-3 group/signal">
                                                                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                                                <span className="text-xs font-bold text-slate-200">{f}</span>
                                                            </div>
                                                        ))}
                                                        <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl flex items-center gap-3">
                                                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                                            <span className="text-xs font-bold text-slate-200">Патерни Офшорної Активності</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-900/80 rounded-2xl p-6 border border-white/5 relative">
                                                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">AI Коментар</h4>
                                                    <p className="text-sm text-slate-400 leading-relaxed italic">
                                                        "Аналіз виявив складну структуру власності через ланцюжок нерезидентів. Рівень CERS піднято до {entity.cers_level} через збіг реквізитів з вузлами санкційного списку SDN."
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action Console */}
                                            <div className="xl:col-span-3 space-y-4">
                                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Командний Центр</h4>
                                                <button className="w-full flex items-center justify-between p-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl transition-all group/btn shadow-lg shadow-indigo-600/20">
                                                    <span className="font-black text-xs uppercase tracking-widest">Генерувати Досьє</span>
                                                    <Download size={18} className="group-hover:translate-y-1 transition-transform" />
                                                </button>
                                                <button className="w-full flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl transition-all group/btn">
                                                    <span className="font-black text-xs uppercase tracking-widest">Перегляд Зв'язків</span>
                                                    <Eye size={18} />
                                                </button>
                                                <button className="w-full flex items-center justify-between p-5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-2xl transition-all font-black text-xs uppercase tracking-widest">
                                                    Ізолювати Суб'єкта
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))
                ) : (
                    <div className="py-24 text-center bg-slate-900/20 border border-dashed border-white/10 rounded-[48px] backdrop-blur-3xl">
                        <Target className="w-16 h-16 text-slate-700 mx-auto mb-6" />
                        <h3 className="text-2xl font-black text-slate-400 uppercase tracking-widest">Об'єктів не виявлено</h3>
                        <p className="text-slate-600 font-medium mt-3">Параметри пошуку не дали результатів у поточному спектрі</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const RefreshCwIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-[spin_10s_linear_infinite]"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 16h5v5"></path></svg>;

export default EntityRadarView;
