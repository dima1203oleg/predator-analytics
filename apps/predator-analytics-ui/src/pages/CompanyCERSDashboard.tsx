import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import { Search, ShieldAlert, Activity, GitBranch, Target, Zap, Clock, AlertTriangle, CheckCircle2, TrendingDown, Award } from 'lucide-react';
import { diligenceApi } from '@/features/diligence/api/diligence';

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
    const [searchQuery, setSearchQuery] = useState(id || 'ТОВ ЕНЕРГО-РЕСУРС 41829391');
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(true);

    const [companyData, setCompanyData] = useState<any>(null);
    const [loadingData, setLoadingData] = useState(false);

    useEffect(() => {
        const fetchCompanyData = async () => {
            if (!searchQuery) return;
            setLoadingData(true);
            try {
                // In a real scenario, this would search for the entity first, then get its CERS score
                const searchRes = await diligenceApi.searchCompanies({ query: searchQuery });
                const entity = searchRes.items?.[0];
                
                if (entity) {
                    const profile = await diligenceApi.getCompanyProfile(entity.edrpou);
                    const riskScores = await diligenceApi.getRiskScores([entity.edrpou]);
                    const scoreData = riskScores[entity.edrpou] || {};

                    // Map API response to component needs
                    setCompanyData({
                        profile,
                        radar: [
                            { subject: 'Інституційний', A: scoreData.institutional || 0, fullMark: 100 },
                            { subject: 'Структурний', A: scoreData.structural || 0, fullMark: 100 },
                            { subject: 'Поведінковий', A: scoreData.behavioral || 0, fullMark: 100 },
                            { subject: 'Впливовий', A: scoreData.influence || 0, fullMark: 100 },
                            { subject: 'Предиктивний', A: scoreData.predictive || 0, fullMark: 100 },
                        ],
                        shap: (scoreData.shap_values || []).map((s: any) => ({
                            feature: s.feature_name,
                            impact: s.shap_value,
                            type: s.shap_value > 0 ? 'positive' : 'negative'
                        })).sort((a: any, b: any) => a.impact - b.impact),
                        score: profile.risk_score || 0,
                        grade: profile.risk_level === 'critical' ? 'D' : profile.risk_level === 'high' ? 'C' : profile.risk_level === 'medium' ? 'B' : 'A',
                        color: profile.risk_level === 'critical' ? 'text-rose-500' : profile.risk_level === 'high' ? 'text-amber-500' : profile.risk_level === 'medium' ? 'text-yellow-500' : 'text-emerald-500',
                        ringColor: profile.risk_level === 'critical' ? 'stroke-rose-500' : profile.risk_level === 'high' ? 'stroke-amber-500' : profile.risk_level === 'medium' ? 'stroke-yellow-500' : 'stroke-emerald-500'
                    });
                }
            } catch (error) {
                console.error("Failed to fetch CERS data:", error);
                // Keep dummy data if fetch fails just so UI doesn't break during dev
            } finally {
                setLoadingData(false);
            }
        };
        fetchCompanyData();
    }, [searchQuery]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setShowResults(false);
        setTimeout(() => {
            setIsSearching(false);
            setShowResults(true);
        }, 1200);
    };

    const displayRadar = companyData?.radar || generateDummyRadar(68);
    const displayShap = companyData?.shap?.length > 0 ? companyData.shap : generateDummyShap();
    const displayEvents = generateDummyEvents(); // Keep dummy for timeline as API might not have it yet
    
    const cersGradeColor = companyData?.color || "text-amber-400";
    const cersRingColor = companyData?.ringColor || "stroke-amber-400";
    const bgRingColor = "stroke-slate-800";
    const score = companyData?.score || 68;
    const grade = companyData?.grade || "B-";
    const profile = companyData?.profile;

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
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Введіть ЄДРПОУ або Назву..."
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono text-sm shadow-lg shadow-black/20 group-hover:border-slate-600"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                    <button type="submit" className="hidden" />
                </form>
            </div>

            <AnimatePresence mode="wait">
                {isSearching && (
                    <motion.div
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

                {showResults && !isSearching && (
                    <motion.div
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
                                <h2 className="text-2xl font-bold mb-1">ТОВ "ЕНЕРГО-РЕСУРС"</h2>
                                <div className="text-slate-400 font-mono text-sm mb-6 flex items-center gap-4">
                                    <span>ЄДРПОУ: 41829391</span>
                                    <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                    <span>Опта торгівля паливом</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800">
                                        <span className="block text-xs text-slate-500 font-mono mb-1">Статус</span>
                                        <span className="flex items-center gap-2 text-sm text-white font-medium">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Активний
                                        </span>
                                    </div>
                                    <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800">
                                        <span className="block text-xs text-slate-500 font-mono mb-1">Санкції РНБО</span>
                                        <span className="flex items-center gap-2 text-sm text-emerald-400 font-medium">
                                            Чисто
                                        </span>
                                    </div>
                                    <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800">
                                        <span className="block text-xs text-slate-500 font-mono mb-1">Судові справи</span>
                                        <span className="flex items-center gap-2 text-sm text-amber-400 font-medium">
                                            <AlertTriangle className="w-4 h-4" /> 14 активних
                                        </span>
                                    </div>
                                    <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800">
                                        <span className="block text-xs text-slate-500 font-mono mb-1">Засновники</span>
                                        <span className="flex items-center gap-2 text-sm text-rose-400 font-medium">
                                            <AlertTriangle className="w-4 h-4" /> Кіпр
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
                                            strokeDashoffset={439.8 - (68 / 100) * 439.8}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                        <span className={`text-4xl font-black ${cersGradeColor} drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]`}>B-</span>
                                        <span className="text-sm font-mono text-slate-400 mt-1">68 / 100</span>
                                    </div>
                                </div>
                                <div className="mt-4 text-center">
                                    <span className={`px-3 py-1 bg-amber-500/10 ${cersGradeColor} text-xs uppercase font-bold tracking-widest rounded-full border border-amber-500/20`}>
                                        Середній ризик
                                    </span>
                                </div>
                            </motion.div>

                            {/* Quick AI Action Card */}
                            <motion.div className="col-span-1 lg:col-span-1 bg-[#0A111F] border border-cyan-500/20 rounded-2xl p-6 shadow-2xl shadow-cyan-900/20 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                                <h3 className="text-sm font-mono text-cyan-400 mb-4 flex items-center gap-2">
                                    <Zap className="w-4 h-4" /> AI КОНСІЛІУМ
                                </h3>
                                <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                                    Потребує уваги через наявність офшорних бенефіціарів та зростаючу кількість судових справ.
                                    Фінансовий профіль стабільний, але структурний ризик високий.
                                </p>
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
                                <CERSRadarECharts data={CERS_RADAR_DATA} />
                            </motion.div>

                            {/* SHAP Values Chart */}
                            <motion.div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-2xl relative hover:border-rose-500/20 transition-colors">
                                <h3 className="text-sm font-mono text-slate-400 mb-6 flex items-center gap-2">
                                    <Activity className="w-4 h-4" /> SHAP ДЕКОМПОЗИЦІЯ РИЗИКУ (ДРАЙВЕРИ)
                                </h3>
                                <SHAPChart data={SHAP_DATA} />
                            </motion.div>
                        </div>

                        {/* Bottom Row: Timeline */}
                        <motion.div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
                            <h3 className="text-sm font-mono text-slate-400 mb-6 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> ХРОНОЛОГІЯ ТА СИГНАЛИ
                            </h3>
                            <div className="flex flex-col gap-0 border-l px-4 border-slate-700/50 py-2 ml-4">
                                {TIMELINE_EVENTS.map((event, i) => (
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

                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default CompanyCERSDashboard;
