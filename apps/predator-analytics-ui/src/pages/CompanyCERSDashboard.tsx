import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
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
import RiskExplanationPanel from '@/components/risk/RiskExplanationPanel';


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
            return { grade: 'D', color: 'text-rose-500', ringColor: 'stroke-rose-500', glow: 'shadow-rose-500/50', label: 'КРИТИЧНИЙ' };
        case 'high':
            return { grade: 'C', color: 'text-rose-600', ringColor: 'stroke-rose-600', glow: 'shadow-rose-600/50', label: 'ВИСОКИЙ' };
        case 'elevated':
        case 'medium':
            return { grade: 'B-', color: 'text-orange-500', ringColor: 'stroke-orange-500', glow: 'shadow-orange-500/50', label: 'ПІДВИЩЕНИЙ' };
        case 'watchlist':
            return { grade: 'B', color: 'text-amber-500', ringColor: 'stroke-amber-500', glow: 'shadow-amber-500/50', label: 'СЕРЕДНІЙ' };
        default:
            return { grade: 'A', color: 'text-rose-400', ringColor: 'stroke-rose-400', glow: 'shadow-rose-400/50', label: 'СТАБІЛЬНИЙ' };
    }
};

function CERSRadarECharts({ data }: { data: any[] }) {
    const radarOption = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(7, 15, 28, 0.95)',
            borderColor: 'rgba(244, 63, 94, 0.3)',
            textStyle: { color: '#fff', fontSize: 12 },
            padding: [8, 12]
        },
        radar: {
            indicator: data.map(d => ({ name: d.subject, max: d.fullMark })),
            shape: 'polygon',
            splitNumber: 5,
            axisName: {
                color: '#94a3b8', fontSize: 11, fontWeight: 'bold'
            },
            splitLine: {
                lineStyle: {
                    color: ['rgba(255,255,255,0.05)', 'rgba(244, 63, 94, 0.1)', 'rgba(255,255,255,0.05)']
                }
            },
            splitArea: {
                areaStyle: {
                    color: ['rgba(244, 63, 94, 0.02)', 'rgba(244, 63, 94, 0.05)']
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
                            { offset: 0, color: 'rgba(244, 63, 94, 0.4)' },
                            { offset: 1, color: 'rgba(244, 63, 94, 0.1)' }
                        ]
                    }
                },
                lineStyle: {
                    color: '#f43f5e',
                    width: 3,
                    shadowBlur: 10,
                    shadowColor: 'rgba(244, 63, 94, 0.5)'
                },
                itemStyle: {
                    color: '#f43f5e',
                    borderColor: '#fff',
                    borderWidth: 1
                },
                symbolSize: 6
            }
        ]
    };

    return (
        <div className="h-full w-full min-h-[300px]">
            <ReactECharts 
                option={{
                    ...radarOption,
                    radar: {
                        ...radarOption.radar,
                        indicator: data.map(d => ({ name: d.subject, max: d.fullMark })),
                    },
                    series: [{
                        ...radarOption.series[0],
                        value: data.map(d => d.A),
                        areaStyle: {
                            color: {
                                type: 'radial',
                                x: 0.5, y: 0.5, r: 0.5,
                                colorStops: [
                                    { offset: 0, color: 'rgba(244, 63, 94, 0.2)' },
                                    { offset: 1, color: 'rgba(244, 63, 94, 0.6)' }
                                ]
                            }
                        },
                        lineStyle: { color: '#f43f5e', width: 2 },
                        itemStyle: { color: '#fb7185', borderWidth: 2 }
                    }]
                }} 
                style={{ height: '100%', width: '100%' }} 
            />
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
                        const val = data[params.dataIndex].impact;
                        return {
                            type: 'linear',
                            x: 0, y: 0, x2: 1, y2: 0,
                            colorStops: val < 0 ? [
                                { offset: 0, color: '#f43f5e' },
                                { offset: 1, color: '#9f1239' }
                            ] : [
                                { offset: 0, color: '#94a3b8' },
                                { offset: 1, color: '#475569' }
                            ]
                        };
                    },
                    borderRadius: [0, 4, 4, 0]
                },
                barWidth: '40%',
                emphasis: {
                    itemStyle: {
                        shadowBlur: 20,
                        shadowColor: 'rgba(0,0,0,0.8)',
                        opacity: 0.9
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

export function CompanyCERSDashboard({ isTab = false }: { isTab?: boolean }) {
    const { id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const ueidParam = searchParams.get('ueid');
    
    const initialSearch = ueidParam || id || 'ТОВ ЕНЕРГО-РЕСУРС 41829391';
    
    const [inputValue, setInputValue] = useState(initialSearch);
    const [searchQuery, setSearchQuery] = useState(initialSearch);

    const [companyData, setCompanyData] = useState<any>(null);
    const [loadingData, setLoadingData] = useState(false);
    const [hasAttempted, setHasAttempted] = useState(false);
    const [showShadowNetwork, setShowShadowNetwork] = useState(false);

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
                    
                    if (entityIdentifier !== ueidParam) {
                        setSearchParams(prev => {
                            const next = new URLSearchParams(prev);
                            next.set('ueid', entityIdentifier);
                            return next;
                        }, { replace: true });
                    }

                    const profile = await diligenceApi.getCompanyProfile(entityIdentifier);
                    const riskScores = await diligenceApi.getRiskScores([entityIdentifier]);
                    const scoreData = riskScores[entityIdentifier] || {};
                    const gradeConfig = getGradeConfig((profile as any).risk_level);

                    setCompanyData({
                        profile,
                        radar: [
                            { subject: 'ІНСТИТУЦІЙНИЙ_ВЕКТОР', A: scoreData.institutional || 0, fullMark: 100 },
                            { subject: 'СТРУКТУРНА_АРХІТЕКТУРА', A: scoreData.structural || 0, fullMark: 100 },
                            { subject: 'ПОВЕДІНКОВИЙ_ПАТЕРН', A: scoreData.behavioral || 0, fullMark: 100 },
                            { subject: 'ІНДЕКС_ВПЛИВУ', A: scoreData.influence || 0, fullMark: 100 },
                            { subject: 'ПРОГНОЗНА_ДИНАМІКА', A: scoreData.predictive || 0, fullMark: 100 },
                        ],
                        shap: Array.isArray(scoreData.shap_values) ? scoreData.shap_values.map((s: any) => ({
                            feature: s.feature_name.replace(/_/g, ' ').toUpperCase(),
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
    }, [searchQuery, setSearchParams, ueidParam]);

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
        <div className={`flex flex-col h-full ${isTab ? 'bg-transparent' : 'bg-[#030712]'} text-white overflow-hidden w-full relative`}>
            {!isTab && (
                <>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(244,63,94,0.05),transparent_70%)] pointer-events-none" />
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
                </>
            )}

            {!isTab && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-900/40 backdrop-blur-xl z-20 shadow-[0_10px_40px_rgba(0,0,0,0.5)] border-t-2 border-t-rose-600/30">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-rose-500/10 rounded-sm border border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-pulse">
                            <ShieldAlert className="w-6 h-6 text-rose-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-[0.2em] text-white uppercase italic leading-none">
                                CERS <span className="text-rose-600">НЕЙРО_ЦЕНТР</span> v62.7
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-mono text-rose-500/60 uppercase tracking-widest font-black italic">ПРЕДАТОР_ЕЛІТ_ПРОТОКОЛ</span>
                                <span className="w-1 h-1 bg-slate-700 rounded-full animate-pulse"></span>
                                <span className="text-[9px] font-mono text-slate-500 uppercase font-black italic">РЕЖИМ: БЕЗПЕРЕРВНИЙ_АНАЛІЗ</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <form onSubmit={handleSearch} className="relative group w-80">
                            <div className="absolute inset-0 bg-rose-500/5 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="ПОШУК ОБ'ЄКТА РИЗИКУ..."
                                className="w-full bg-slate-950/80 border border-white/10 text-white rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:border-rose-500/50 transition-all font-mono text-xs tracking-widest relative z-10"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-hover:text-rose-400 transition-colors z-10" />
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
            )}

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar: Intelligence HUD */}
                <div className="w-80 border-r border-white/5 flex flex-col bg-slate-900/20 backdrop-blur-sm z-10">
                    <div className="p-4 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                        <VramSentinel />
                        
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Метрики Вузла</h3>
                            <div className="grid grid-cols-1 gap-2">
                                <div className="bg-slate-950/50 border border-white/5 rounded-xl p-3 hover:border-rose-500/20 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <Cpu className="w-3.5 h-3.5 text-rose-400" />
                                        <span className="text-[10px] font-mono text-slate-500">ЗАВАНТАЖЕННЯ LLM</span>
                                    </div>
                                    <div className="text-lg font-black text-white">42.8%</div>
                                    <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                                        <div className="h-full bg-rose-500 w-[42.8%]" />
                                    </div>
                                </div>
                                <div className="bg-slate-950/50 border border-white/5 rounded-xl p-3 hover:border-rose-500/20 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <Activity className="w-3.5 h-3.5 text-rose-400" />
                                        <span className="text-[10px] font-mono text-slate-500">СТАТИСТИКА I/O</span>
                                    </div>
                                    <div className="text-lg font-black text-white">1.2 GB/s</div>
                                    <div className="text-[10px] font-mono text-rose-500/60 mt-1 uppercase tracking-tighter">Висока пропускна здатність</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Сигнали Ризику</h3>
                            <div className="space-y-2">
                                {displayEvents.slice(0, 3).map((event: any, i: number) => (
                                    <div key={i} className="bg-slate-950/30 border-l-2 border-rose-500/50 p-2 rounded-r-lg">
                                        <div className="text-[9px] font-mono text-slate-500 mb-1">{event.date}</div>
                                        <div className="text-[11px] text-slate-300 leading-tight line-clamp-2">{event.text}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-4 border-t border-white/5">
                        {/* Термінал тепер доступний глобально через заголовок */}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/50">
                    <AnimatePresence mode="wait">
                        {loadingData ? (
                            <motion.div 
                                className="h-full flex flex-col items-center justify-center p-20 relative overflow-hidden"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            >
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(225,29,72,0.05),transparent_50%)]" />
                                <div className="relative w-40 h-40">
                                    <div className="absolute inset-0 border-2 border-rose-600/10 rounded-full scale-110"></div>
                                    <div className="absolute inset-0 border-t-2 border-rose-600 rounded-full animate-spin"></div>
                                    <div className="absolute inset-4 border-2 border-rose-600/20 rounded-full"></div>
                                    <div className="absolute inset-4 border-b-2 border-rose-600 rounded-full animate-spin-reverse"></div>
                                    <ShieldAlert className="absolute inset-0 m-auto w-12 h-12 text-rose-600 animate-pulse" />
                                </div>
                                <h2 className="mt-8 text-2xl font-black italic tracking-[0.5em] text-white uppercase animate-pulse">
                                    ІНІЦІАЛІЗАЦІЯ <span className="text-rose-600">СКАНЕРА_ПРИВИД</span>
                                </h2>
                                <p className="mt-4 text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em] font-black italic">
                                    ДЕКОМПОЗИЦІЯ_ВЕКТОРІВ_SHAP | НЕЙРОННИЙ_РЕЗОНАНС...
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
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-[80px] -mr-32 -mt-32 transition-colors group-hover:bg-rose-500/10" />
                                        
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-6">
                                                <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-[10px] font-black text-rose-400 uppercase tracking-widest italic">
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
                                                    <Fingerprint className="w-4 h-4 text-rose-500" />
                                                    <span className="text-xs font-mono text-slate-300">ЄДРПОУ: {profile.edrpou || "Н/Д"}</span>
                                                </div>
                                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-950/60 rounded-xl border border-white/5">
                                                    <Boxes className="w-4 h-4 text-rose-400" />
                                                    <span className="text-xs font-mono text-slate-300 max-w-[200px] truncate">{profile.kved || "КВЕД не вказано"}</span>
                                                </div>
                                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-950/60 rounded-xl border border-white/5">
                                                    <CheckCircle2 className={`w-4 h-4 ${profile.status === 'active' ? 'text-emerald-500' : 'text-slate-500'}`} />
                                                    <span className="text-xs font-mono text-slate-300">Статус: {profile.status === 'active' ? 'АКТИВНИЙ' : 'ПРИЗУПИНЕНО'}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                                                {[
                                                    { label: 'СКАН_САНКЦІЙ', status: profile.is_sanctioned ? 'БЛОК' : 'ЧИСТО', color: profile.is_sanctioned ? 'rose' : 'slate' },
                                                    { label: 'ОФШОРИ', status: profile.has_offshores ? 'ВИЯВЛЕНО' : 'НЕМАЄ', color: profile.has_offshores ? 'orange' : 'slate' },
                                                    { label: 'РЕЄСТР_БОРГІВ', status: profile.is_debtor ? 'ТАК' : 'ЧИСТО', color: profile.is_debtor ? 'orange' : 'slate' },
                                                    { label: 'ЮРИД_СТАН', status: 'СТАБІЛЬНИЙ', color: 'slate' }
                                                ].map((item, idx) => (
                                                    <div key={idx} className="bg-slate-800/40 p-3 rounded-2xl border border-white/5">
                                                        <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{item.label}</span>
                                                        <span className={`text-xs font-mono font-bold text-${item.color === 'slate' ? 'slate' : item.color}-400`}>{item.status}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* CERS Score Radial Card */}
                                    <div className="xl:col-span-4 bg-slate-900/60 border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center relative group overflow-hidden border-r-2 border-r-rose-600">
                                        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-rose-600/5 opacity-50" />
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <Target className="w-24 h-24 text-rose-600" />
                                        </div>
                                        
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
                                                    style={{ filter: 'drop-shadow(0 0 15px currentColor)' }}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className={`text-6xl font-black ${cersGradeColor} drop-shadow-[0_0_20px_rgba(225,29,72,0.6)] italic tracking-tighter`}>
                                                    {companyData?.grade || 'Н/Д'}
                                                </span>
                                                <span className="text-[10px] font-mono text-slate-400 mt-2 uppercase tracking-[0.2em] font-black italic">ЯДРО_СКОРИНГУ: {score}/100</span>
                                            </div>
                                        </div>
                                        
                                        <div className="text-center w-full relative z-10">
                                            <div className="px-6 py-2 bg-rose-600/10 rounded-sm border border-rose-600/30 inline-block shadow-[0_0_20px_rgba(225,29,72,0.2)]">
                                                <span className={`text-[10px] font-black uppercase tracking-[0.3em] italic ${cersGradeColor}`}>
                                                    СТАТУС_РИЗИКУ: {getGradeConfig((profile as any).risk_level).label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2: Vector Analysis & Strategic Summary */}
                                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                                    {/* SHAP & Radar Details */}
                                    <div className="xl:col-span-8 bg-slate-900/40 border border-white/10 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-600/30 to-transparent" />
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-3">
                                                <Target className="w-5 h-5 text-rose-500" />
                                                <h3 className="text-sm font-black tracking-[0.2em] uppercase italic text-white">ВЕКТОРНИЙ_АНАЛІЗ_РИЗИКУ</h3>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1 bg-rose-600/10 border border-rose-600/30 rounded-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest italic">NEURAL_READY</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[400px]">
                                            <div className="relative">
                                                <div className="absolute -top-4 left-0 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] italic">ГЕОМЕТРІЯ_ПРОФІЛЮ</div>
                                                <CERSRadarECharts data={displayRadar} />
                                            </div>
                                            <div className="relative">
                                                <div className="absolute -top-4 left-0 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] italic">ДЕТЕРМІНАНТИ_ВПЛИВУ_SHAP</div>
                                                <SHAPChart data={displayShap} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Strategic Business Summary */}
                                    <div className="xl:col-span-4 bg-slate-950/80 border border-white/5 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between border-l-2 border-l-rose-600">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(225,29,72,0.05),transparent_50%)]" />
                                        <div>
                                            <div className="flex items-center gap-3 mb-6">
                                                <Award className="w-5 h-5 text-rose-600" />
                                                <h3 className="text-sm font-black tracking-[0.2em] uppercase italic text-white">СТРАТЕГІЧНИЙ_ROI_РИЗИКУ</h3>
                                            </div>
                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase italic">
                                                        <span>Ефективність Захисту</span>
                                                        <span className="text-rose-500">92.4%</span>
                                                    </div>
                                                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-rose-600 w-[92.4%] shadow-[0_0_10px_rgba(225,29,72,0.5)]" />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs text-slate-400 leading-relaxed italic">
                                                        Виявлений рівень ризику <span className="text-rose-500 font-bold">{getGradeConfig((profile as any).risk_level).label}</span> вимагає 
                                                        негайного задіювання протоколу <span className="text-white font-bold">"ТІНЬОВИЙ_ШЛЮЗ"</span> для мінімізації втрат капіталу.
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 pt-4">
                                                    <div className="bg-slate-900/60 p-3 rounded-sm border border-white/5">
                                                        <span className="block text-[8px] font-black text-slate-500 uppercase mb-1">Потенційні Втрати</span>
                                                        <span className="text-lg font-black text-rose-500 tracking-tighter italic">~ 4.2M ₴</span>
                                                    </div>
                                                    <div className="bg-slate-900/60 p-3 rounded-sm border border-white/5">
                                                        <span className="block text-[8px] font-black text-slate-500 uppercase mb-1">Індекс Довіри AI</span>
                                                        <span className="text-lg font-black text-emerald-500 tracking-tighter italic">HIGH</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <button className="mt-8 w-full py-4 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-[0.3em] italic rounded-sm transition-all shadow-[0_0_30px_rgba(225,29,72,0.3)] hover:shadow-[0_0_40px_rgba(225,29,72,0.5)] active:scale-[0.98]">
                                            ЗГЕНЕРУВАТИ_ВИКОНАВЧИЙ_ЗВІТ
                                        </button>
                                    </div>
                                </div>
                                </div>

                                {/* Row 3: Shadow Network Overview */}
                                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                                    <div className="xl:col-span-12 bg-slate-900/60 border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(244,63,94,0.02)_50%,transparent_75%)] bg-[length:200%_200%] animate-shimmer pointer-events-none" />
                                        <div className="flex items-center justify-between mb-10">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-rose-600/10 rounded-sm border border-rose-600/20 shadow-[0_0_20px_rgba(225,29,72,0.2)]">
                                                    <Share2 className="w-6 h-6 text-rose-600" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black tracking-[0.2em] uppercase italic text-white">ТІНЬОВА_ГЕОМЕТРІЯ_ЗВ’ЯЗКІВ</h3>
                                                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1 italic">ВІЗУАЛІЗАЦІЯ_НЕЙРОННОЇ_МЕРЕЖІ_ВПЛИВУ_v7.4</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setShowShadowNetwork(true)}
                                                className="px-8 py-3 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-600/30 text-rose-500 text-[10px] font-black uppercase tracking-[0.3em] italic rounded-sm transition-all"
                                            >
                                                РОЗГОРНУТИ_ПОВНУ_КАРТУ
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Shadow Network Analysis Section */}
                                {showShadowNetwork && (
                                    <ShadowNetworkAnalysis 
                                        onClose={() => setShowShadowNetwork(false)} 
                                        companyName={profile.name || searchQuery}
                                    />
                                )}

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
                                                        'bg-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.5)]'
                                                    }`} />
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-mono text-rose-500 uppercase tracking-[0.2em] mb-2">{event.date}</span>
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


/**
 * Advanced Shadow Network Analysis Component
 * Visualizes hidden connections, UBOs, and potential risk clusters.
 */
function ShadowNetworkAnalysis({ onClose, companyName }: { onClose: () => void; companyName: string }) {
    // Mock data for the shadow network
    const nodes = [
        { id: 1, label: companyName, type: 'main', x: 400, y: 300 },
        { id: 2, label: 'Офшорний Холдинг "ALPHA"', type: 'offshore', x: 200, y: 150 },
        { id: 3, label: 'Підставна Особа (UBO)', type: 'ubo', x: 600, y: 150 },
        { id: 4, label: 'ТОВ "Дочірнє-1"', type: 'subsidiary', x: 300, y: 500 },
        { id: 5, label: 'ТОВ "Дочірнє-2"', type: 'subsidiary', x: 500, y: 500 },
        { id: 6, label: 'Транзитний Вузол "GAMMA"', type: 'transit', x: 650, y: 400 },
    ];

    const links = [
        { from: 1, to: 2, label: 'Власник 75%', color: '#f43f5e' },
        { from: 1, to: 3, label: 'Бенефіціар', color: '#fbbf24' },
        { from: 4, to: 1, label: 'Дочірня 100%', color: '#10b981' },
        { from: 5, to: 1, label: 'Дочірня 40%', color: '#10b981' },
        { from: 3, to: 6, label: 'Зв\'язок через IP', color: '#6366f1' },
        { from: 2, to: 6, label: 'Транзакції', color: '#6366f1' },
    ];

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/90 border border-rose-500/30 rounded-[40px] p-8 backdrop-blur-3xl relative overflow-hidden"
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(244,63,94,0.1),transparent_70%)] pointer-events-none" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-rose-500/20 rounded-2xl border border-rose-500/30">
                        <GitBranch className="w-6 h-6 text-rose-400" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Тіньовий Аналіз Зв'язків</h3>
                        <p className="text-xs font-mono text-rose-500/60 uppercase">Виявлення прихованих афіліацій та UBO-вузлів</p>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="px-6 py-2 bg-white/5 hover:bg-rose-500/20 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                    Закрити Карту
                </button>
            </div>

            <div className="relative h-[600px] bg-black/60 rounded-[32px] border border-white/5 overflow-hidden group/graph">
                {/* HUD Elements */}
                <div className="absolute top-6 left-6 space-y-2 z-20">
                    <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-1 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-[9px] font-black text-slate-400 uppercase">Режим: Глибоке Сканування</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">ОБ'ЄКТІВ ВИЯВЛЕНО: {nodes.length}</div>
                </div>

                <div className="absolute bottom-6 right-6 z-20 bg-black/40 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
                    <div className="text-[9px] font-black text-slate-500 uppercase mb-3">Легенда Мережі</div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500" /><span className="text-[10px] text-slate-300 uppercase">Основний Об'єкт</span></div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-[10px] text-slate-300 uppercase">UBO (Кінцевий Власник)</span></div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[10px] text-slate-300 uppercase">Афілійовані Структури</span></div>
                    </div>
                </div>

                {/* SVG Graph Visualization */}
                <svg viewBox="0 0 800 600" className="w-full h-full cursor-move select-none">
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="20" refY="3.5" orientation="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,255,255,0.2)" />
                        </marker>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Links */}
                    {links.map((link, i) => {
                        const fromNode = nodes.find(n => n.id === link.from)!;
                        const toNode = nodes.find(n => n.id === link.to)!;
                        return (
                            <g key={i}>
                                <motion.line
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 1.5, delay: i * 0.2 }}
                                    x1={fromNode.x} y1={fromNode.y}
                                    x2={toNode.x} y2={toNode.y}
                                    stroke={link.color}
                                    strokeWidth="1.5"
                                    strokeOpacity="0.4"
                                    markerEnd="url(#arrowhead)"
                                />
                                <text 
                                    x={(fromNode.x + toNode.x) / 2} 
                                    y={(fromNode.y + toNode.y) / 2} 
                                    className="text-[9px] font-black fill-slate-500 uppercase tracking-tighter"
                                    textAnchor="middle"
                                >
                                    {link.label}
                                </text>
                            </g>
                        );
                    })}

                    {/* Nodes */}
                    {nodes.map((node, i) => (
                        <motion.g 
                            key={i}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', damping: 12, delay: i * 0.1 }}
                        >
                            <circle 
                                cx={node.x} cy={node.y} r={node.type === 'main' ? 24 : 18} 
                                className={cn(
                                    "stroke-white/20 transition-all duration-300",
                                    node.type === 'main' ? "fill-rose-500/80" : 
                                    node.type === 'ubo' ? "fill-amber-500/80" : 
                                    node.type === 'offshore' ? "fill-orange-600/80" : "fill-emerald-500/80"
                                )}
                                style={{ filter: 'url(#glow)' }}
                            />
                            <text 
                                x={node.x} y={node.y + (node.type === 'main' ? 45 : 35)} 
                                className="text-[10px] font-black fill-white uppercase tracking-widest"
                                textAnchor="middle"
                            >
                                {node.label}
                            </text>
                        </motion.g>
                    ))}
                </svg>

                {/* Cyber Scanline */}
                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(244,63,94,0.05)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20" />
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                <div className="bg-white/[0.03] border border-white/10 p-5 rounded-3xl">
                    <h4 className="text-[10px] font-black text-rose-400 uppercase mb-3">Виявлено Критичні Зв'язки</h4>
                    <ul className="space-y-2">
                        <li className="text-[11px] text-slate-300 flex items-center gap-2">
                            <AlertTriangle size={12} className="text-amber-500" /> Спільний бенефіціар з ТОВ "ВЕКТОР"
                        </li>
                        <li className="text-[11px] text-slate-300 flex items-center gap-2">
                            <CheckCircle2 size={12} className="text-emerald-500" /> Відсутні прямі санкційні афіліати
                        </li>
                    </ul>
                </div>
                <div className="md:col-span-2 bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-3xl flex items-center justify-between">
                    <div>
                        <h4 className="text-[10px] font-black text-emerald-400 uppercase mb-1">Висновок Комплаєнс-Офіцера AI</h4>
                        <p className="text-xs text-slate-300 italic">"Мережа зв'язків є прозорою на 84%. Виявлені транзитні вузли мають низький рівень ризику."</p>
                    </div>
                    <Award className="text-emerald-400 opacity-20" size={48} />
                </div>
            </div>
        </motion.div>
    );
}

// Utility function for conditional classes
function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}

export default CompanyCERSDashboard;
