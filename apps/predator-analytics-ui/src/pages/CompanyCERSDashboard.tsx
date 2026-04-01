import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactECharts from '@/components/ECharts';
import { Search, ShieldAlert, Activity, GitBranch, Target, Zap, Clock, AlertTriangle, CheckCircle2, TrendingDown, Award } from 'lucide-react';
import { diligenceApi } from '@/features/diligence/api/diligence';

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
            return { grade: 'D', color: 'text-rose-500', ringColor: 'stroke-rose-500' };
        case 'high':
            return { grade: 'C', color: 'text-amber-500', ringColor: 'stroke-amber-500' };
        case 'elevated':
        case 'medium':
            return { grade: 'B-', color: 'text-yellow-500', ringColor: 'stroke-yellow-500' };
        case 'watchlist':
            return { grade: 'B', color: 'text-cyan-400', ringColor: 'stroke-cyan-400' };
        default:
            return { grade: 'A', color: 'text-emerald-500', ringColor: 'stroke-emerald-500' };
    }
};

function CERSRadarECharts({ data }: { data: any[] }) {
    const radarOption = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(16, 185, 129, 0.3)',
            textStyle: { color: '#fff', fontSize: 12 },
            padding: [8, 12]
        },
        radar: {
            indicator: data.map(d => ({ name: d.subject, max: d.fullMark })),
            shape: 'polygon',
            splitNumber: 4,
            name: {
                textStyle: { color: '#94a3b8', fontSize: 11 }
            },
            splitLine: {
                lineStyle: {
                    color: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.04)']
                }
            },
            splitArea: {
                areaStyle: {
                    color: ['rgba(16, 185, 129, 0.05)', 'rgba(16, 185, 129, 0.03)']
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
                    color: 'rgba(16, 185, 129, 0.3)'
                },
                lineStyle: {
                    color: '#10b981',
                    width: 2.5
                },
                itemStyle: {
                    color: '#10b981',
                    borderColor: '#059669',
                    borderWidth: 2
                },
                symbolSize: 7
            }
        ]
    };

    return (
        <div className="h-72 w-full">
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
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(244, 63, 94, 0.3)',
            textStyle: { color: '#fff', fontSize: 12 },
            padding: [8, 12],
            formatter: (params: any) => {
                if (Array.isArray(params) && params.length > 0) {
                    const p = params[0];
                    return `${p.name}<br/>${p.seriesName}: ${(p.value > 0 ? '+' : '')}${(p.value * 100).toFixed(1)}%`;
                }
                return '';
            }
        },
        grid: {
            left: '15%',
            right: '5%',
            bottom: '10%',
            top: '5%',
            containLabel: true
        },
        xAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
            axisLabel: { color: '#64748b', fontSize: 11 }
        },
        yAxis: {
            type: 'category',
            data: data.map(d => d.feature),
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
            axisLabel: { color: '#94a3b8', fontSize: 11 }
        },
        series: [
            {
                name: 'Вплив на ризик',
                type: 'bar',
                data: data.map(d => d.impact),
                itemStyle: {
                    color: (params: any) => {
                        return data[params.dataIndex].impact < 0 ? '#f43f5e' : '#10b981';
                    },
                    borderRadius: [0, 4, 4, 0]
                },
                barWidth: '60%'
            }
        ]
    };

    return (
        <div className="h-72 w-full">
            <ReactECharts option={shapOption} style={{ height: '100%', width: '100%' }} />
        </div>
    );
}

export function CompanyCERSDashboard() {
    const { id } = useParams();
    const [inputValue, setInputValue] = useState(id || 'ТОВ ЕНЕРГО-РЕСУРС 41829391');
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
                        })).sort((a: any, b: any) => a.impact - b.impact) : [],
                        score: profile.risk_score || 0,
                        grade: gradeConfig.grade,
                        color: gradeConfig.color,
                        ringColor: gradeConfig.ringColor,
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

    const displayRadar = companyData?.radar || [
        { subject: 'Інституційний', A: 0, fullMark: 100 },
        { subject: 'Структурний', A: 0, fullMark: 100 },
        { subject: 'Поведінковий', A: 0, fullMark: 100 },
        { subject: 'Впливовий', A: 0, fullMark: 100 },
        { subject: 'Предиктивний', A: 0, fullMark: 100 },
    ];
    
    const displayShap = companyData?.shap || [];
    const displayEvents = companyData?.profile?.events || [];
    
    const cersGradeColor = companyData?.color || "text-slate-500";
    const cersRingColor = companyData?.ringColor || "stroke-slate-700";
    const bgRingColor = "stroke-slate-800";
    const score = companyData?.score || 0;
    
    // Safely mapping profile info
    const profile = companyData?.profile || {};
    const companyName = profile.name || searchQuery;
    const companyCode = profile.edrpou || profile.id || "Невідомо";
    const companyStatus = profile.status || "Активний";

    return (
        <div className="flex flex-col h-full bg-slate-950 p-4 lg:p-8 text-white overflow-y-auto w-full relative">
            {/* Background aesthetics */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none" />

            {/* Header & Search */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 relative z-10 w-full">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center gap-3">
                        <ShieldAlert className="w-8 h-8 text-emerald-400" />
                        CERS КОМАНДНИЙ ЦЕНТР
                    </h1>
                    <p className="text-slate-400 mt-2 font-mono text-sm max-w-2xl">
                        Аналіз Сукупного Економічного Ризику (CERS) із SHAP-декомпозицією та нейро-скорингом у реальному часі.
                    </p>
                </div>

                <form onSubmit={handleSearch} className="relative w-full lg:w-96 group">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Введіть ЄДРПОУ або Назву..."
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono text-sm shadow-lg shadow-black/20 group-hover:border-slate-600"
                        disabled={loadingData}
                    />
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${loadingData ? 'text-emerald-500 animate-pulse' : 'text-slate-500 group-hover:text-emerald-400'}`} />
                    <button type="submit" className="hidden" />
                </form>
            </div>

            <AnimatePresence mode="wait">
                {loadingData && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="w-full flex-1 flex flex-col items-center justify-center min-h-[400px]"
                    >
                        <div className="relative w-24 h-24">
                            <div className="absolute inset-0 border-t-2 border-emerald-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-2 border-r-2 border-cyan-400 rounded-full animate-spin direction-reverse"></div>
                            <Activity className="absolute inset-0 m-auto w-8 h-8 text-emerald-400 animate-pulse" />
                        </div>
                        <p className="mt-6 font-mono text-emerald-400 text-sm tracking-widest animate-pulse">РАХУЄМО МАТРИЦЮ РИЗИКІВ...</p>
                    </motion.div>
                )}

                {!loadingData && companyData && (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.5, staggerChildren: 0.1 }}
                        className="w-full flex flex-col gap-6 relative z-10"
                    >
                        {/* Top Row: Meta info & Score */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                            {/* Entity Context Card */}
                            <motion.div className="col-span-1 lg:col-span-2 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-2xl relative overflow-hidden group hover:border-slate-600 transition-colors">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-mono text-emerald-400 uppercase bg-emerald-500/10 px-2 py-1 rounded">Аналіз об'єкта</span>
                                    <span className="text-xs font-mono text-slate-500">оновлено щойно</span>
                                </div>
                                <h2 className="text-2xl font-bold mb-1">{companyName}</h2>
                                <div className="text-slate-400 font-mono text-sm mb-6 flex items-center gap-4">
                                    <span>ЄДРПОУ: {companyCode}</span>
                                    {profile.kved && (
                                        <>
                                            <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                            <span className="truncate max-w-[200px]">{profile.kved}</span>
                                        </>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800">
                                        <span className="block text-xs text-slate-500 font-mono mb-1">Статус</span>
                                        <span className="flex items-center gap-2 text-sm text-white font-medium">
                                            {companyStatus === 'Активний' ? (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            ) : (
                                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                            )} <span className="capitalize">{companyStatus}</span>
                                        </span>
                                    </div>
                                    <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800">
                                        <span className="block text-xs text-slate-500 font-mono mb-1">Офшори</span>
                                        <span className={`flex items-center gap-2 text-sm font-medium ${profile.has_offshores ? 'text-rose-400' : 'text-emerald-400'}`}>
                                            {profile.has_offshores ? <AlertTriangle className="w-4 h-4" /> : null} 
                                            {profile.has_offshores ? 'Виявлено' : 'Чисто'}
                                        </span>
                                    </div>
                                    <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800">
                                        <span className="block text-xs text-slate-500 font-mono mb-1">Реєстр боржників</span>
                                        <span className={`flex items-center gap-2 text-sm font-medium ${profile.is_debtor ? 'text-amber-400' : 'text-emerald-400'}`}>
                                            {profile.is_debtor ? <AlertTriangle className="w-4 h-4" /> : null} 
                                            {profile.is_debtor ? 'Присутній' : 'Відсутній'}
                                        </span>
                                    </div>
                                    <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800">
                                        <span className="block text-xs text-slate-500 font-mono mb-1">Санкції</span>
                                        <span className={`flex items-center gap-2 text-sm font-medium ${profile.is_sanctioned ? 'text-rose-500' : 'text-emerald-400'}`}>
                                            {profile.is_sanctioned ? <AlertTriangle className="w-4 h-4" /> : null} 
                                            {profile.is_sanctioned ? 'Під санкціями' : 'Чисто'}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* CERS Score Radial Control */}
                            <motion.div className="col-span-1 lg:col-span-1 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/50 rounded-2xl p-6 shadow-2xl flex flex-col items-center justify-center relative hover:border-amber-500/30 transition-colors">
                                <span className="absolute top-4 left-4 text-xs font-mono text-slate-500 uppercase">Рейтинг CERS</span>

                                <div className="relative w-40 h-40 flex items-center justify-center mt-4">
                                    {/* SVG progress ring */}
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="80" cy="80" r="70" className={`${bgRingColor} fill-none`} strokeWidth="8" />
                                        <circle
                                            cx="80" cy="80" r="70"
                                            className={`${cersRingColor} fill-none stroke-current drop-shadow-[0_0_10px_rgba(251,191,36,0.5)] transition-all duration-1000 ease-out`}
                                            strokeWidth="8"
                                            strokeDasharray="439.8"
                                            strokeDashoffset={439.8 - (score / 100) * 439.8}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                        <span className={`text-4xl font-black ${cersGradeColor} drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]`}>{companyData?.grade || 'N/A'}</span>
                                        <span className="text-sm font-mono text-slate-400 mt-1">{score} / 100</span>
                                    </div>
                                </div>
                                <div className="mt-4 text-center">
                                    <span className={`px-3 py-1 bg-slate-800 text-white text-xs uppercase font-bold tracking-widest rounded-full border border-slate-700`}>
                                        Ризик: {(profile.risk_level || 'Невідомо').toUpperCase()}
                                    </span>
                                </div>
                            </motion.div>

                            {/* Quick AI Action Card */}
                            <motion.div className="col-span-1 lg:col-span-1 bg-[#0A111F] border border-cyan-500/20 rounded-2xl p-6 shadow-2xl shadow-cyan-900/20 relative overflow-hidden flex flex-col justify-between">
                                <div>
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                                    <h3 className="text-sm font-mono text-cyan-400 mb-4 flex items-center gap-2">
                                        <Zap className="w-4 h-4" /> AI КОНСІЛІУМ
                                    </h3>
                                    <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                                        {profile.ai_summary || "Аналіз зібраних даних свідчить про наявність певних фінансових чи структурних ризиків. Досьє сформовано."}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2 mt-auto">
                                    <button className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 py-2 px-4 rounded-lg text-sm font-mono transition-colors flex items-center justify-between group">
                                        <span>Побудувати Тіньову Карту</span>
                                        <Target className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                                    </button>
                                    <button className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 py-2 px-4 rounded-lg text-sm font-mono transition-colors flex items-center justify-between group">
                                        <span>Згенерувати Досьє</span>
                                        <Activity className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                                    </button>
                                </div>
                            </motion.div>
                        </div>

                        {/* Middle Row: Radar & SHAP */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 min-h-[400px]">

                            {/* 5-Layer Radar Chart */}
                            <motion.div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-2xl relative hover:border-emerald-500/20 transition-colors">
                                <h3 className="text-sm font-mono text-slate-400 mb-6 flex items-center gap-2">
                                    <GitBranch className="w-4 h-4" /> 5-ШАРОВА ОЦІНКА CERS
                                </h3>
                                {displayRadar.every((r: any) => r.A === 0) ? (
                                    <div className="h-72 w-full flex items-center justify-center text-slate-500 border border-dashed border-slate-700 rounded-lg">
                                        Детальна інформація відсутня
                                    </div>
                                ) : (
                                    <CERSRadarECharts data={displayRadar} />
                                )}
                            </motion.div>

                            {/* SHAP Values Chart */}
                            <motion.div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-2xl relative hover:border-rose-500/20 transition-colors">
                                <h3 className="text-sm font-mono text-slate-400 mb-6 flex items-center gap-2">
                                    <Activity className="w-4 h-4" /> SHAP ДЕКОМПОЗИЦІЯ РИЗИКУ (ДРАЙВЕРИ)
                                </h3>
                                {displayShap.length === 0 ? (
                                    <div className="h-72 w-full flex items-center justify-center text-slate-500 border border-dashed border-slate-700 rounded-lg">
                                        SHAP декомпозиція відсутня
                                    </div>
                                ) : (
                                    <SHAPChart data={displayShap} />
                                )}
                            </motion.div>
                        </div>

                        {/* Bottom Row: Timeline */}
                        {displayEvents.length > 0 && (
                            <motion.div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
                                <h3 className="text-sm font-mono text-slate-400 mb-6 flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> ХРОНОЛОГІЯ ТА СИГНАЛИ
                                </h3>
                                <div className="flex flex-col gap-0 border-l px-4 border-slate-700/50 py-2 ml-4">
                                    {displayEvents.map((event: any, i: number) => (
                                        <div key={i} className="relative pb-6 last:pb-0">
                                            <div className={`absolute -left-[23px] top-1 w-3 h-3 rounded-full border-2 border-slate-900 ${event.type === 'alert' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' :
                                                event.type === 'warning' ? 'bg-amber-500' :
                                                    event.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                                                }`} />
                                            <div className="flex flex-col">
                                                <span className="text-xs font-mono text-slate-500 mb-1">{event.date}</span>
                                                <p className="text-sm text-slate-300 leading-relaxed">{event.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* No results placeholder */}
                {!loadingData && hasAttempted && !companyData && (
                    <motion.div
                        key="no-results"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="w-full flex-1 flex flex-col items-center justify-center min-h-[400px] text-slate-400"
                    >
                        <AlertTriangle className="w-12 h-12 text-slate-600 mb-4" />
                        <h3 className="text-lg font-bold mb-2">Об'єкт не знайдено або відсутнє індексування CERS.</h3>
                        <p className="text-sm text-slate-500 max-w-md text-center">
                            Можливо, підприємство ще не додано до загального індексу або введений код є хибним. Зверніться до CERS API.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default CompanyCERSDashboard;
