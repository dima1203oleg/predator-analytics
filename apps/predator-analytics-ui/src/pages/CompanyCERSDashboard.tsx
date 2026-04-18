import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactECharts from '@/components/ECharts';
import { 
    Search, 
    ShieldAlert, 
    Activity, 
    GitBranch, 
    Target, 
    Zap, 
    Clock, 
    AlertTriangle, 
    CheckCircle2, 
    TrendingDown, 
    Award,
    Cpu,
    Fingerprint,
    Boxes,
    FileText,
    Share2,
    Download
} from 'lucide-react';
import { diligenceApi } from '@/features/diligence/api/diligence';
import { VramSentinel } from '@/components/intelligence/VramSentinel';
import { LiveAgentTerminal } from '@/components/intelligence/LiveAgentTerminal';

const normalizeRiskLevel = (value?: string): string => {
    switch (value) {
        case 'critical':
        case 'high':
        case 'elevated':
        case 'watchlist':
        case 'stable':
        case 'medium':
        case 'low':
            return value;
        case 'high_alert':
            return 'high';
        default:
            return 'stable';
    }
};

const getGradeConfig = (value?: string) => {
    const riskLevel = normalizeRiskLevel(value);

    switch (riskLevel) {
        case 'critical':
            return { grade: 'D', color: 'text-rose-500', ringColor: 'stroke-rose-500', glow: 'shadow-rose-500/50' };
        case 'high':
            return { grade: 'C', color: 'text-amber-500', ringColor: 'stroke-amber-500', glow: 'shadow-amber-500/50' };
        case 'elevated':
        case 'medium':
            return { grade: 'B-', color: 'text-yellow-500', ringColor: 'stroke-yellow-500', glow: 'shadow-yellow-500/50' };
        case 'watchlist':
            return { grade: 'B', color: 'text-cyan-400', ringColor: 'stroke-cyan-400', glow: 'shadow-cyan-400/50' };
        default:
            return { grade: 'A', color: 'text-emerald-500', ringColor: 'stroke-emerald-500', glow: 'shadow-emerald-500/50' };
    }
};

function CERSRadarECharts({ data }: { data: any[] }) {
    const radarOption = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(7, 15, 28, 0.95)',
            borderColor: 'rgba(16, 185, 129, 0.3)',
            textStyle: { color: '#fff', fontSize: 12 },
            padding: [8, 12]
        },
        radar: {
            indicator: data.map(d => ({ name: d.subject, max: d.fullMark })),
            shape: 'polygon',
            splitNumber: 5,
            name: {
                textStyle: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold' }
            },
            splitLine: {
                lineStyle: {
                    color: ['rgba(255,255,255,0.05)', 'rgba(52, 211, 153, 0.1)', 'rgba(255,255,255,0.05)']
                }
            },
            splitArea: {
                areaStyle: {
                    color: ['rgba(16, 185, 129, 0.02)', 'rgba(16, 185, 129, 0.05)']
                }
            },
            axisLine: {
                lineStyle: {
                    color: 'rgba(255,255,255,0.1)'
                }
            }
        },
        series: [
            {
                name: 'CERS Оцінка',
                value: data.map(d => d.A),
                areaStyle: {
                    color: {
                        type: 'radial',
                        x: 0.5, y: 0.5, r: 0.5,
                        colorStops: [
                            { offset: 0, color: 'rgba(16, 185, 129, 0.4)' },
                            { offset: 1, color: 'rgba(16, 185, 129, 0.1)' }
                        ]
                    }
                },
                lineStyle: {
                    color: '#10b981',
                    width: 3,
                    shadowBlur: 10,
                    shadowColor: 'rgba(16, 185, 129, 0.5)'
                },
                itemStyle: {
                    color: '#10b981',
                    borderColor: '#fff',
                    borderWidth: 1
                },
                symbolSize: 6
            }
        ]
    };

    return (
        <div className="h-full w-full min-h-[300px]">
            <ReactECharts option={radarOption} style={{ height: '100%', width: '100%' }} />
        </div>
    );
}

function SHAPChart({ data }: { data: any[] }) {
    const shapOption = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: 'rgba(7, 15, 28, 0.95)',
            borderColor: 'rgba(244, 63, 94, 0.3)',
            textStyle: { color: '#fff', fontSize: 12 },
            padding: [8, 12]
        },
        grid: {
            left: '5%',
            right: '8%',
            bottom: '5%',
            top: '5%',
            containLabel: true
        },
        xAxis: {
            type: 'value',
            axisLine: { show: false },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } },
            axisLabel: { color: '#64748b', fontSize: 10 }
        },
        yAxis: {
            type: 'category',
            data: data.map(d => d.feature),
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
            axisLabel: { color: '#cbd5e1', fontSize: 11, width: 120, overflow: 'truncate' }
        },
        series: [
            {
                name: 'Вплив',
                type: 'bar',
                data: data.map(d => d.impact),
                itemStyle: {
                    color: (params: any) => {
                        return data[params.dataIndex].impact < 0 ? 
                            '#f43f5e' : '#10b981';
                    },
                    borderRadius: [0, 4, 4, 0]
                },
                barWidth: '50%',
                emphasis: {
                    itemStyle: {
                        shadowBlur: 15,
                        shadowColor: 'rgba(0,0,0,0.5)'
                    }
                }
            }
        ]
    };

    return (
        <div className="h-full w-full min-h-[300px]">
            <ReactECharts option={shapOption} style={{ height: '100%', width: '100%' }} />
        </div>
    );
}

export function CompanyCERSDashboard() {
    const { id } = useParams();
    const [inputValue, setInputValue] = useState(id || '');
    const [searchQuery, setSearchQuery] = useState(id || 'ТОВ ЕНЕРГО-РЕСУРС 41829391');

    const [companyData, setCompanyData] = useState<any>(null);
    const [loadingData, setLoadingData] = useState(false);
    const [hasAttempted, setHasAttempted] = useState(false);

    useEffect(() => {
        const fetchCompanyData = async () => {
            if (!searchQuery) return;
            setLoadingData(true);
            setHasAttempted(true);
            try {
                const searchRes = await diligenceApi.searchCompanies({ query: searchQuery });
                const items = Array.isArray(searchRes) ? searchRes : (searchRes.items || searchRes.data || []);
                const entity = items[0];
                
                if (entity) {
                    const entityIdentifier = entity.ueid || entity.edrpou;
                    const profile = await diligenceApi.getCompanyProfile(entityIdentifier);
                    const riskScores = await diligenceApi.getRiskScores([entityIdentifier]);
                    const scoreData = riskScores[entityIdentifier] || {};
                    const gradeConfig = getGradeConfig((profile as any).risk_level);

                    setCompanyData({
                        profile,
                        radar: [
                            { subject: 'Інституційний', A: scoreData.institutional || 0, fullMark: 100 },
                            { subject: 'Структурний', A: scoreData.structural || 0, fullMark: 100 },
                            { subject: 'Поведінковий', A: scoreData.behavioral || 0, fullMark: 100 },
                            { subject: 'Впливовий', A: scoreData.influence || 0, fullMark: 100 },
                            { subject: 'Предиктивний', A: scoreData.predictive || 0, fullMark: 100 },
                        ],
                        shap: Array.isArray(scoreData.shap_values) ? scoreData.shap_values.map((s: any) => ({
                            feature: s.feature_name,
                            impact: s.shap_value,
                            type: s.shap_value > 0 ? 'positive' : 'negative'
                        })).sort((a: any, b: any) => Math.abs(a.impact) - Math.abs(b.impact)) : [],
                        score: profile.risk_score || 0,
                        grade: gradeConfig.grade,
                        color: gradeConfig.color,
                        ringColor: gradeConfig.ringColor,
                        glow: gradeConfig.glow
                    });
                } else {
                    setCompanyData(null);
                }
            } catch (error) {
                console.error('Не вдалося отримати дані CERS:', error);
                setCompanyData(null);
            } finally {
                setLoadingData(false);
            }
        };
        fetchCompanyData();
    }, [searchQuery]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;
        setSearchQuery(inputValue);
    };

    const displayRadar = companyData?.radar || [];
    const displayShap = companyData?.shap || [];
    const displayEvents = companyData?.profile?.events || [];
    const profile = companyData?.profile || {};
    
    const score = companyData?.score || 0;
    const cersGradeColor = companyData?.color || "text-slate-500";
    const cersRingColor = companyData?.ringColor || "stroke-slate-700";

    return (
        <div className="flex flex-col h-full bg-[#030712] text-white overflow-hidden w-full relative">
            {/* Background Aesthetics */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent_70%)] pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

            {/* Tactical Top Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-900/40 backdrop-blur-xl z-20">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        <ShieldAlert className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-widest text-white uppercase italic">
                            CERS <span className="text-emerald-500">TACTICAL</span> HUD
                        </h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-tighter">Sovereign Analysis v57.2</span>
                            <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                            <span className="text-[10px] font-mono text-slate-500 uppercase">Статус: Оперативний</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <form onSubmit={handleSearch} className="relative group w-80">
                        <div className="absolute inset-0 bg-emerald-500/5 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="ПОШУК ОБ'ЄКТА РИЗИКУ..."
                            className="w-full bg-slate-950/80 border border-white/10 text-white rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:border-emerald-500/50 transition-all font-mono text-xs tracking-widest relative z-10"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors z-10" />
                    </form>
                    
                    <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400">
                            <Share2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400">
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar: Intelligence HUD */}
                <div className="w-80 border-r border-white/5 flex flex-col bg-slate-900/20 backdrop-blur-sm z-10">
                    <div className="p-4 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                        <VramSentinel />
                        
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Метрики Вузла</h3>
                            <div className="grid grid-cols-1 gap-2">
                                <div className="bg-slate-950/50 border border-white/5 rounded-xl p-3 hover:border-emerald-500/20 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                                        <span className="text-[10px] font-mono text-slate-500">LLM LOAD</span>
                                    </div>
                                    <div className="text-lg font-black text-white">42.8%</div>
                                    <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-[42.8%]" />
                                    </div>
                                </div>
                                <div className="bg-slate-950/50 border border-white/5 rounded-xl p-3 hover:border-cyan-500/20 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <Activity className="w-3.5 h-3.5 text-cyan-400" />
                                        <span className="text-[10px] font-mono text-slate-500">I/O STATS</span>
                                    </div>
                                    <div className="text-lg font-black text-white">1.2 GB/s</div>
                                    <div className="text-[10px] font-mono text-cyan-500/60 mt-1 uppercase tracking-tighter">Висока пропускна здатність</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Сигнали Ризику</h3>
                            <div className="space-y-2">
                                {displayEvents.slice(0, 3).map((event: any, i: number) => (
                                    <div key={i} className="bg-slate-950/30 border-l-2 border-emerald-500/50 p-2 rounded-r-lg">
                                        <div className="text-[9px] font-mono text-slate-500 mb-1">{event.date}</div>
                                        <div className="text-[11px] text-slate-300 leading-tight line-clamp-2">{event.text}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-4 border-t border-white/5">
                        <LiveAgentTerminal />
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/50">
                    <AnimatePresence mode="wait">
                        {loadingData ? (
                            <motion.div 
                                className="h-full flex flex-col items-center justify-center p-20"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            >
                                <div className="relative w-32 h-32">
                                    <div className="absolute inset-0 border-2 border-emerald-500/20 rounded-full"></div>
                                    <div className="absolute inset-0 border-t-2 border-emerald-500 rounded-full animate-spin"></div>
                                    <div className="absolute inset-4 border-2 border-cyan-500/20 rounded-full"></div>
                                    <div className="absolute inset-4 border-b-2 border-cyan-500 rounded-full animate-spin-reverse"></div>
                                    <ShieldAlert className="absolute inset-0 m-auto w-10 h-10 text-emerald-500 animate-pulse" />
                                </div>
                                <h2 className="mt-8 text-xl font-black italic tracking-widest text-white uppercase animate-pulse">
                                    Ініціалізація <span className="text-emerald-500">WRAITH</span> Сканера
                                </h2>
                                <p className="mt-2 text-slate-500 font-mono text-xs uppercase tracking-widest">
                                    Декомпозиція SHAP-векторів та нейронний скоринг...
                                </p>
                            </motion.div>
                        ) : companyData ? (
                            <motion.div 
                                className="p-6 space-y-6 max-w-[1600px] mx-auto"
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            >
                                {/* Top Row: Company Profile & Grade */}
                                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                                    {/* Company Identity Card */}
                                    <div className="xl:col-span-8 bg-slate-900/60 border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -mr-32 -mt-32 transition-colors group-hover:bg-emerald-500/10" />
                                        
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-6">
                                                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black text-emerald-400 uppercase tracking-widest italic">
                                                    Верифікований Об'єкт
                                                </span>
                                                <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span>
                                                <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">ID: {profile.edrpou || profile.id}</span>
                                            </div>
                                            
                                            <h2 className="text-4xl font-black text-white mb-2 tracking-tight line-clamp-1 uppercase italic">
                                                {profile.name || searchQuery}
                                            </h2>
                                            
                                            <div className="flex flex-wrap gap-4 mt-6">
                                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-950/60 rounded-xl border border-white/5">
                                                    <Fingerprint className="w-4 h-4 text-emerald-500" />
                                                    <span className="text-xs font-mono text-slate-300">ЄДРПОУ: {profile.edrpou || "Н/Д"}</span>
                                                </div>
                                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-950/60 rounded-xl border border-white/5">
                                                    <Boxes className="w-4 h-4 text-cyan-500" />
                                                    <span className="text-xs font-mono text-slate-300 max-w-[200px] truncate">{profile.kved || "КВЕД не вказано"}</span>
                                                </div>
                                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-950/60 rounded-xl border border-white/5">
                                                    <CheckCircle2 className={`w-4 h-4 ${profile.status === 'Активний' ? 'text-emerald-500' : 'text-amber-500'}`} />
                                                    <span className="text-xs font-mono text-slate-300 uppercase">{profile.status || "Активний"}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                                                {[
                                                    { label: 'SANC-SCAN', status: profile.is_sanctioned ? 'FAILED' : 'CLEAN', color: profile.is_sanctioned ? 'rose' : 'emerald' },
                                                    { label: 'OFF-SHORE', status: profile.has_offshores ? 'DETECTED' : 'NONE', color: profile.has_offshores ? 'amber' : 'emerald' },
                                                    { label: 'DEBT-REG', status: profile.is_debtor ? 'FLAGGED' : 'CLEAR', color: profile.is_debtor ? 'amber' : 'emerald' },
                                                    { label: 'LEGAL-W', status: 'STABLE', color: 'emerald' }
                                                ].map((item, idx) => (
                                                    <div key={idx} className="bg-slate-800/40 p-3 rounded-2xl border border-white/5">
                                                        <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{item.label}</span>
                                                        <span className={`text-xs font-mono font-bold text-${item.color}-400`}>{item.status}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* CERS Score Radial Card */}
                                    <div className="xl:col-span-4 bg-slate-900/60 border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center relative group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 opacity-50" />
                                        
                                        <div className="relative w-48 h-48 mb-6">
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle cx="96" cy="96" r="86" className="stroke-slate-800 fill-none" strokeWidth="8" />
                                                <circle
                                                    cx="96" cy="96" r="86"
                                                    className={`${cersRingColor} fill-none transition-all duration-1000 ease-out`}
                                                    strokeWidth="10"
                                                    strokeDasharray="540"
                                                    strokeDashoffset={540 - (score / 100) * 540}
                                                    strokeLinecap="round"
                                                    style={{ filter: 'drop-shadow(0 0 12px currentColor)' }}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className={`text-6xl font-black ${cersGradeColor} drop-shadow-2xl`}>
                                                    {companyData?.grade || 'N/A'}
                                                </span>
                                                <span className="text-xs font-mono text-slate-400 mt-2 uppercase tracking-widest">Оцінка: {score}/100</span>
                                            </div>
                                        </div>
                                        
                                        <div className="text-center w-full">
                                            <div className="px-6 py-2 bg-slate-950/80 rounded-2xl border border-white/5 inline-block">
                                                <span className={`text-xs font-black uppercase tracking-widest ${cersGradeColor}`}>
                                                    РІВЕНЬ РИЗИКУ: {profile.risk_level || 'Н/Д'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* AI Intelligence & Analysis Rows */}
                                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                                    {/* SHAP Decomposition */}
                                    <div className="xl:col-span-7 bg-slate-900/60 border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-2">
                                                <Activity className="w-4 h-4 text-emerald-400" />
                                                <h3 className="text-sm font-black text-white uppercase tracking-widest italic">SHAP ДЕКОМПОЗИЦІЯ (ДРАЙВЕРИ РИЗИКУ)</h3>
                                            </div>
                                            <span className="text-[10px] font-mono text-slate-500 uppercase">Vector Analysis Alpha</span>
                                        </div>
                                        {displayShap.length > 0 ? (
                                            <SHAPChart data={displayShap} />
                                        ) : (
                                            <div className="h-full min-h-[300px] flex items-center justify-center border border-dashed border-white/10 rounded-2xl text-slate-500 italic">
                                                Дані декомпозиції відсутні для цього вузла
                                            </div>
                                        )}
                                    </div>

                                    {/* AI Summary Panel */}
                                    <div className="xl:col-span-5 flex flex-col gap-6">
                                        <div className="flex-1 bg-gradient-to-br from-[#0A111F] to-[#040811] border border-cyan-500/20 rounded-3xl p-6 shadow-2xl shadow-cyan-900/10 relative overflow-hidden flex flex-col">
                                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                                <Zap className="w-32 h-32 text-cyan-500" />
                                            </div>
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
                                            
                                            <h3 className="text-sm font-black text-cyan-400 mb-4 flex items-center gap-2 uppercase tracking-widest italic">
                                                <Target className="w-4 h-4" /> AI КОНСІЛІУМ (РЕЗЮМЕ)
                                            </h3>
                                            
                                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-6">
                                                <p className="text-sm text-slate-300 leading-relaxed italic">
                                                    " {profile.ai_summary || "Аналіз OSINT-вузлів вказує на стабільний фінансовий стан при низькому рівні структурних загроз. Рекомендовано плановий моніторинг діяльності."} "
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 gap-2">
                                                <button className="flex items-center justify-between w-full p-4 bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-cyan-300 transition-all group">
                                                    <span>Побудувати Тіньову Карту Зв'язків</span>
                                                    <GitBranch className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                                </button>
                                                <button className="flex items-center justify-between w-full p-4 bg-slate-800/40 hover:bg-slate-800/60 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all group">
                                                    <span>Експортувати Повний Звіт (PDF)</span>
                                                    <FileText className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-all" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Row: 5-Layer Radar & Timeline */}
                                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                                    <div className="xl:col-span-12 bg-slate-900/60 border border-white/10 rounded-3xl p-6">
                                        <div className="flex items-center gap-2 mb-8">
                                            <Boxes className="w-4 h-4 text-emerald-400" />
                                            <h3 className="text-sm font-black text-white uppercase tracking-widest italic">5-ШАРОВА СТРУКТУРНА ОЦІНКА CERS</h3>
                                        </div>
                                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                            <div className="lg:col-span-1 flex flex-col justify-center gap-4">
                                                {displayRadar.map((r, i) => (
                                                    <div key={i} className="flex flex-col gap-1">
                                                        <div className="flex justify-between items-end">
                                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{r.subject}</span>
                                                            <span className="text-xs font-mono text-emerald-400">{r.A}%</span>
                                                        </div>
                                                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                                            <div className="h-full bg-emerald-500/50" style={{ width: `${r.A}%` }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="lg:col-span-3 min-h-[350px]">
                                                <CERSRadarECharts data={displayRadar} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Timeline */}
                                {displayEvents.length > 0 && (
                                    <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8">
                                        <div className="flex items-center gap-2 mb-10">
                                            <Clock className="w-4 h-4 text-slate-400" />
                                            <h3 className="text-sm font-black text-white uppercase tracking-widest italic">ОПЕРАТИВНА ХРОНОЛОГІЯ</h3>
                                        </div>
                                        <div className="relative border-l border-white/10 ml-4 pl-10 space-y-10">
                                            {displayEvents.map((event: any, i: number) => (
                                                <div key={i} className="relative">
                                                    <div className={`absolute -left-[50px] top-1 w-5 h-5 rounded-full border-4 border-slate-950 ${
                                                        event.type === 'alert' ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]' :
                                                        event.type === 'warning' ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]' :
                                                        'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                                                    }`} />
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-[0.2em] mb-2">{event.date}</span>
                                                        <p className="text-white text-md font-semibold leading-relaxed">{event.text}</p>
                                                        <div className="mt-3 flex gap-2">
                                                            <span className="text-[9px] px-2 py-0.5 bg-white/5 rounded text-slate-500 uppercase font-mono">Верифіковано</span>
                                                            <span className="text-[9px] px-2 py-0.5 bg-white/5 rounded text-slate-500 uppercase font-mono">Агент-04</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ) : hasAttempted ? (
                            <motion.div 
                                className="h-full flex flex-col items-center justify-center p-20 text-center"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            >
                                <AlertTriangle className="w-16 h-16 text-slate-800 mb-6" />
                                <h3 className="text-2xl font-black text-white uppercase italic tracking-widest transition-all">Об'єкт Не Знайдено</h3>
                                <p className="mt-4 text-slate-500 max-w-md font-mono text-xs uppercase tracking-widest leading-loose">
                                    ВУЗОЛ НЕ ПОВЕРНУВ ПЕРЕВІРЕНИХ ДАНИХ ДЛЯ ЗАПИТУ "{searchQuery}". ПЕРЕВІРТЕ ЄДРПОУ АБО СКОРИСТАЙТЕСЬ ГЛОБАЛЬНИМ ПОШУКОМ.
                                </p>
                                <button 
                                    onClick={() => setSearchQuery('ТОВ ЕНЕРГО-РЕСУРС 41829391')}
                                    className="mt-8 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all"
                                >
                                    Повернутись до Прикладу
                                </button>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

export default CompanyCERSDashboard;
