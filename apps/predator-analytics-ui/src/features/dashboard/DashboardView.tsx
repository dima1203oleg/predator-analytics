/**
 * PREDATOR v56.1 NEXUS | Стратегічна Панель Управління — Реальні дані
 * Головний дашборд із підключенням до API: декларації, ризики, двигуни, алерти.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertTriangle,
  Brain,
  LayoutDashboard,
  Search,
  Target,
  Globe,
  Cpu,
  RefreshCw,
  TrendingUp,
  Flame,
  Network,
  Layers,
  ShieldAlert,
  Satellite,
  Radar,
  Radio,
  Eye,
  ArrowUpRight,
  HardDrive,
  Database,
  FileText,
  Building2,
  Package,
  Ship,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactECharts from '@/components/ECharts';
import * as echarts from 'echarts';
import { TacticalCard } from '@/components/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { Badge } from '@/components/ui/badge';
import { NeuralPulse } from '@/components/ui/NeuralPulse';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { cn } from '@/utils/cn';
import { dashboardApi } from '@/services/api/dashboard';
import type { DashboardOverview, EngineInfo, DashboardAlert, RadarItem, RiskCompany } from '@/services/api/dashboard';

// ========================
// Допоміжні функції
// ========================

const formatCurrency = (val: number): string => {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val}`;
};

const formatNumber = (val: number): string => val.toLocaleString('uk-UA');

const timeAgo = (ts: string): string => {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60_000) return 'Щойно';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} хв тому`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} год тому`;
  return `${Math.floor(diff / 86_400_000)} дн тому`;
};

// ========================
// Підкомпоненти
// ========================

/**
 * Радарна діаграма ризиків за секторами (реальні дані)
 */
const StrategicRadarMatrix: React.FC<{ data: RadarItem[] }> = ({ data }) => {
  const indicators = data.map(d => ({ name: d.name, max: 100 }));
  const values = data.map(d => d.value);

  const option = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(2, 6, 23, 0.9)',
      borderColor: '#6366f1',
      textStyle: { color: '#fff', fontSize: 10 },
      formatter: (params: any) => {
        if (!params.value) return '';
        return data.map((d, i) => `${d.name}: ${params.value[i]}% (${d.count} декл.)`).join('<br/>');
      }
    },
    radar: {
      indicator: indicators.length > 0 ? indicators : [
        { name: 'Немає даних', max: 100 }
      ],
      shape: 'circle',
      splitNumber: 4,
      axisName: {
        color: '#94a3b8',
        fontSize: 9,
        fontWeight: '900',
      },
      splitLine: {
        lineStyle: {
          color: [
            'rgba(99, 102, 241, 0.05)',
            'rgba(99, 102, 241, 0.1)',
            'rgba(99, 102, 241, 0.15)',
            'rgba(244, 63, 94, 0.2)'
          ]
        }
      },
      splitArea: { show: false },
      axisLine: {
        lineStyle: { color: 'rgba(255, 255, 255, 0.05)' }
      }
    },
    series: [
      {
        name: 'Ризиковий Спектр',
        type: 'radar',
        data: [
          {
            value: values.length > 0 ? values : [0],
            name: 'Середній ризик за секторами',
            symbol: 'none',
            lineStyle: { color: '#6366f1', width: 2, shadowBlur: 10, shadowColor: '#6366f1' },
            areaStyle: {
              color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
                { offset: 0, color: 'rgba(99, 102, 241, 0.4)' },
                { offset: 1, color: 'rgba(99, 102, 241, 0)' }
              ])
            }
          }
        ]
      }
    ]
  }), [data, indicators, values]);

  return <ReactECharts option={option} style={{ height: '320px', width: '100%' }} />;
};

/**
 * Глобальна проекція торговельних потоків
 */
const GlobalSituationProjection: React.FC<{ countries: Record<string, { count: number; value: number }> }> = ({ countries }) => {
  const countryCoords: Record<string, [number, number]> = {
    'КИТАЙ': [104.1, 35.8],
    'ТУРЕЧЧИНА': [35.2, 39.0],
    'НІМЕЧЧИНА': [10.4, 51.2],
    'ПОЛЬЩА': [19.1, 51.9],
    'ІНДІЯ': [78.9, 20.6],
    'ІТАЛІЯ': [12.5, 41.9],
    'США': [-95.7, 37.1],
    'ЯПОНІЯ': [138.3, 36.2],
  };

  const kyiv: [number, number] = [30.5, 50.4];

  const linesData = Object.keys(countries)
    .filter(c => countryCoords[c])
    .map(c => ({ coords: [countryCoords[c], kyiv] }));

  const scatterData = Object.entries(countries)
    .filter(([c]) => countryCoords[c])
    .map(([c, stat]) => ({
      name: c,
      value: [...countryCoords[c], Math.min(stat.count, 200)],
      itemStyle: { color: stat.count > 100 ? '#f43f5e' : stat.count > 50 ? '#f59e0b' : '#818cf8' }
    }));

  scatterData.push({ name: 'Київ', value: [...kyiv, 150], itemStyle: { color: '#818cf8' } });

  const option = {
    backgroundColor: 'transparent',
    geo: {
      map: 'world',
      roam: false,
      silent: true,
      zoom: 1.2,
      itemStyle: {
        areaColor: 'rgba(15, 23, 42, 0.4)',
        borderColor: 'rgba(99, 102, 241, 0.2)',
        borderWidth: 1.5,
        shadowColor: 'rgba(99, 102, 241, 0.1)',
        shadowBlur: 20
      }
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(2, 6, 23, 0.95)',
      borderColor: '#6366f1',
      textStyle: { color: '#fff', fontSize: 11 },
      formatter: (params: any) => {
        const c = params.name;
        const stat = countries[c];
        if (!stat) return c;
        return `<b>${c}</b><br/>Декларацій: ${stat.count}<br/>Вартість: ${formatCurrency(stat.value)}`;
      }
    },
    series: [
      {
        type: 'lines',
        zlevel: 1,
        effect: {
          show: true,
          period: 4,
          trailLength: 0.6,
          color: '#6366f1',
          symbolSize: 3,
        },
        lineStyle: { color: '#6366f1', width: 1, opacity: 0.1, curveness: 0.3 },
        data: linesData
      },
      {
        type: 'effectScatter',
        coordinateSystem: 'geo',
        data: scatterData,
        symbolSize: (v: number[]) => Math.max(v[2] / 12, 6),
        rippleEffect: { brushType: 'stroke', scale: 6, period: 3 },
        itemStyle: { shadowBlur: 20, shadowColor: '#6366f1' }
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '550px', width: '100%' }} />;
};

/**
 * Стан порожнього дашборду (до інгестії)
 */
const EmptyDashboardState: React.FC = () => (
  <div className="col-span-12 flex flex-col items-center justify-center py-32 text-center">
    <div className="relative mb-8">
      <div className="absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full" />
      <Database size={64} className="text-indigo-400/40 relative z-10" />
    </div>
    <h3 className="text-2xl font-black text-white/60 uppercase tracking-widest mb-4">Дані відсутні</h3>
    <p className="text-slate-500 text-sm max-w-md">
      Завантажте першу партію митних декларацій через розділ "Інгестія" для активації аналітичних двигунів.
    </p>
  </div>
);

// ========================
// Головний компонент
// ========================

const DashboardView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      const data = await dashboardApi.getOverview();
      setOverview(data);
    } catch (err) {
      console.error('[Dashboard] Помилка завантаження:', err);
      setError('Не вдалося отримати дані. Перевірте з\'єднання з API.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => {
      clearInterval(interval);
    };
  }, [fetchData]);

  const totalOPS = useMemo(() => {
    if (!overview?.engines) return 0;
    return Object.values(overview.engines).reduce((a, b) => a + (b.throughput || 0), 0);
  }, [overview]);

  const topRisk = useMemo(() => {
    if (!overview?.top_risk_companies?.length) return 0;
    return overview.top_risk_companies[0].maxRisk;
  }, [overview]);

  const hasData = overview && overview.summary.total_declarations > 0;

  const engines: [string, EngineInfo][] = useMemo(() => {
    if (!overview?.engines) return [];
    return Object.entries(overview.engines);
  }, [overview]);

  const radarData = useMemo(() => overview?.radar || [], [overview]);

  const alerts: DashboardAlert[] = useMemo(() => overview?.alerts || [], [overview]);

  const infraItems = useMemo(() => {
    if (!overview?.infrastructure) return [];
    const labels: Record<string, string> = {
      postgresql: 'PostgreSQL',
      opensearch: 'OpenSearch',
      qdrant: 'Qdrant',
      neo4j: 'Neo4j',
      minio: 'MinIO',
      redis: 'Redis',
    };
    return Object.entries(overview.infrastructure).map(([key, val]) => ({
      key,
      label: labels[key] || key,
      ...val,
      count: val.records || val.documents || val.vectors || val.nodes || val.files || val.keys || 0,
    }));
  }, [overview]);

  const riskCompanies: RiskCompany[] = useMemo(() => overview?.top_risk_companies || [], [overview]);

  const tickerMessages = useMemo(() => {
    if (!overview) return [];
    const msgs: string[] = [];
    const s = overview.summary;
    if (s.total_declarations > 0) msgs.push(`ДЕКЛАРАЦІЙ В СИСТЕМІ: ${formatNumber(s.total_declarations)} | ЗАГАЛЬНА ВАРТІСТЬ: ${formatCurrency(s.total_value_usd)}`);
    if (s.high_risk_count > 0) msgs.push(`КРИТИЧНИХ РИЗИКІВ: ${s.high_risk_count} | СЕРЕДНІХ РИЗИКІВ: ${s.medium_risk_count}`);
    if (s.import_count > 0) msgs.push(`ІМПОРТ: ${formatNumber(s.import_count)} | ЕКСПОРТ: ${formatNumber(s.export_count)}`);
    if (s.graph_nodes > 0) msgs.push(`ГРАФ: ${formatNumber(s.graph_nodes)} ВУЗЛІВ / ${formatNumber(s.graph_edges)} ЗВ'ЯЗКІВ`);
    if (s.search_documents > 0) msgs.push(`ПОШУКОВИЙ ІНДЕКС: ${formatNumber(s.search_documents)} ДОКУМЕНТІВ | ВЕКТОРИ: ${formatNumber(s.vectors)}`);
    if (alerts.length > 0) msgs.push(`АКТИВНИХ АЛЕРТІВ: ${alerts.length} | ТОП РИЗИК: ${topRisk}%`);
    if (msgs.length === 0) msgs.push('СИСТЕМА ГОТОВА — ЗАВАНТАЖТЕ ДАНІ ДЛЯ АКТИВАЦІЇ АНАЛІТИКИ');
    return msgs;
  }, [overview, alerts, topRisk]);

  if (loading) {
    return (
      <PageTransition>
        <div className="w-full min-h-screen flex items-center justify-center bg-[#010409]">
          <div className="flex flex-col items-center gap-6">
            <Loader2 size={48} className="text-cyan-500 animate-spin" />
            <p className="text-cyan-500/60 text-sm uppercase tracking-[0.5em] font-black animate-pulse">ЗІСТАВЛЕННЯ НЕЙРОМЕРЕЖІ...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="w-full p-8 flex flex-col gap-10 relative bg-[#010409] font-sans pb-32">
        <AdvancedBackground />
        <NeuralPulse color="rgba(0, 243, 255, 0.08)" size={1200} />
        
        <div className="fixed left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-cyan-500/40 to-transparent z-50 opacity-20" />
        
        <div className="relative z-10 max-w-[1900px] mx-auto p-4 sm:p-8 lg:p-12 space-y-12">
          
          <ViewHeader
            title={
              <div className="flex items-center gap-8">
                <div className="relative group">
                  <div className="absolute inset-0 bg-cyan-500/30 blur-[60px] rounded-full scale-150 animate-pulse" />
                  <div className="relative w-16 h-16 bg-slate-900 border border-cyan-500/30 rounded-3xl flex items-center justify-center panel-3d shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-transparent" />
                    <Satellite size={36} className="text-cyan-400 drop-shadow-[0_0_15px_rgba(0,243,255,1)] relative z-10" />
                  </div>
                </div>
                <div>
                  <h1 className="text-5xl font-black text-white tracking-widest uppercase leading-none font-display skew-x-[-4deg]">
                    АНАЛІТИЧНА <span className="text-cyan-500">ПАНЕЛЬ</span>
                  </h1>
                  <p className="text-[11px] font-mono font-black text-cyan-500/70 uppercase tracking-[0.6em] mt-3 flex items-center gap-3">
                    <Radio size={12} className="animate-pulse" /> 
                    PREDATOR v56.1 NEXUS // LIVE_FEED
                  </p>
                </div>
              </div>
            }
            icon={<LayoutDashboard size={22} className="text-cyan-500" />}
            breadcrumbs={['PREDATOR', 'АНАЛІТИКА', 'NEXUS_CORE']}
            stats={[
              { label: 'ПОТУЖНІСТЬ', value: totalOPS > 0 ? `${formatNumber(totalOPS)} оп/с` : 'Н/Д', color: 'success', icon: <Cpu size={14} />, animate: true },
              { label: 'ТОП РИЗИК', value: topRisk > 0 ? `${topRisk}%` : 'Н/Д', color: topRisk > 80 ? 'danger' : 'warning', icon: <Flame size={14} /> },
              { label: 'ДЕКЛАРАЦІЙ', value: hasData ? formatNumber(overview!.summary.total_declarations) : '0', color: 'cyan', icon: <FileText size={14} /> }
            ]}
            actions={
              <div className="flex gap-4">
                <button 
                  onClick={fetchData}
                  disabled={refreshing}
                  className="px-6 py-3.5 bg-black/40 border border-cyan-500/30 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500/10 transition-all flex items-center gap-4 disabled:opacity-50 panel-3d"
                >
                  <RefreshCw size={18} className={refreshing ? 'animate-spin text-cyan-400' : 'text-cyan-400'} />
                  <span>ОНОВИТИ ЯДРО</span>
                </button>
              </div>
            }
          />

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-4">
              <AlertTriangle className="text-rose-400" size={24} />
              <div>
                <p className="font-bold text-rose-400">{error}</p>
                <button onClick={fetchData} className="text-sm text-rose-300 underline mt-1">Спробувати знову</button>
              </div>
            </motion.div>
          )}

          {!hasData && !error ? (
            <EmptyDashboardState />
          ) : hasData && (
            <>
              {/* Зведені метрики */}
              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
                {[
                  { label: 'Загальна вартість', value: formatCurrency(overview!.summary.total_value_usd), icon: <TrendingUp size={18} />, color: 'indigo' },
                  { label: 'Імпорт', value: formatNumber(overview!.summary.import_count), icon: <Ship size={18} />, color: 'cyan' },
                  { label: 'Експорт', value: formatNumber(overview!.summary.export_count), icon: <Package size={18} />, color: 'emerald' },
                  { label: 'Високий ризик', value: String(overview!.summary.high_risk_count), icon: <ShieldAlert size={18} />, color: 'rose' },
                  { label: 'Вузли графу', value: formatNumber(overview!.summary.graph_nodes), icon: <Network size={18} />, color: 'purple' },
                  { label: 'Вектори', value: formatNumber(overview!.summary.vectors), icon: <Brain size={18} />, color: 'amber' },
                ].map((m, i) => (
                  <motion.div
                    key={m.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "p-5 bg-slate-900/60 border border-white/5 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-all",
                    )}
                  >
                    <div className={`absolute top-3 right-3 p-2 rounded-xl bg-${m.color}-500/10`}>
                      <div className={`text-${m.color}-400`}>{m.icon}</div>
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{m.label}</p>
                    <p className="text-2xl font-mono font-black text-white">{m.value}</p>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-12 gap-10 relative z-10">
            
                {/* ЛІВА КОЛОНКА: Двигуни та ризики */}
                <div className="col-span-12 xl:col-span-4 space-y-10">
              
                  <TacticalCard title="АНАЛІТИЧНІ ДВИГУНИ" icon={<HardDrive size={20} className="text-indigo-400" />} variant="holographic">
                    <div className="space-y-6">
                      {engines.map(([key, data], idx) => (
                        <motion.div 
                          key={key} 
                          initial={{ opacity: 0, x: -30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="p-6 bg-slate-900/40 border border-white/5 rounded-3xl group hover:border-indigo-500/40 transition-all relative overflow-hidden shadow-2xl"
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="flex justify-between items-center mb-5">
                            <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em] flex items-center gap-3">
                              <Cpu size={14} className="text-indigo-500" /> {data.name || key.replace(/_/g, ' ')}
                            </span>
                            <Badge variant="outline" className={cn(
                              "text-[9px] font-black px-4 py-1 tracking-widest rounded-full border-2",
                              data.status === 'optimal' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            )}>
                              {data.status === 'optimal' ? 'ОПТИМАЛЬНО' : 'КАЛІБРУВАННЯ'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-[10px] font-black text-slate-600 mb-2 uppercase tracking-tighter">Пропускна</p>
                              <p className="text-xl font-mono font-black text-white">{formatNumber(data.throughput)}/с</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-600 mb-2 uppercase tracking-tighter">Затримка</p>
                              <p className="text-xl font-mono font-black text-indigo-400">{data.latency}мс</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-600 mb-2 uppercase tracking-tighter">Оцінка</p>
                              <p className="text-xl font-mono font-black text-emerald-400">{data.score}%</p>
                            </div>
                          </div>
                          <div className="mt-6 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${data.load}%` }}
                              className={cn(
                                "h-full rounded-full transition-all duration-1000",
                                data.load > 85 ? "bg-rose-500 shadow-[0_0_10px_#f43f5e]" : "bg-gradient-to-r from-indigo-600 to-indigo-400 shadow-[0_0_10px_#6366f1]"
                              )}
                            />
                          </div>
                          <div className="flex justify-between mt-2">
                            <span className="text-[9px] text-slate-600">Навантаження: {data.load}%</span>
                            <span className="text-[9px] text-slate-500">{data.trend}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </TacticalCard>

                  <TacticalCard title="РИЗИКИ ЗА СЕКТОРАМИ" icon={<Radar size={20} className="text-rose-500" />} variant="holographic">
                    <StrategicRadarMatrix data={radarData} />
                    <div className="mt-8 grid grid-cols-2 gap-6">
                      {radarData.map((s) => {
                        const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#f43f5e'];
                        const color = colors[radarData.indexOf(s) % colors.length];
                        return (
                          <div key={s.name} className="p-5 bg-black/40 border border-white/10 rounded-3xl hover:border-white/20 transition-all flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }} />
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.name}</p>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <p className="text-2xl font-mono font-black text-white">{s.value}%</p>
                              <p className="text-[10px] text-slate-600">{s.count} декл.</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </TacticalCard>
                </div>

                {/* ЦЕНТРАЛЬНА КОЛОНКА: Карта та алерти */}
                <div className="col-span-12 xl:col-span-5 space-y-10">
                  <TacticalCard 
                    title="ТОРГОВЕЛЬНІ ПОТОКИ" 
                    icon={<Globe size={20} className="text-indigo-400" />} 
                    variant="holographic" 
                    className="panel-3d overflow-hidden min-h-[640px] flex flex-col relative"
                    noPadding
                  >
                    <div className="absolute top-10 left-10 z-20">
                      <div className="flex items-center gap-6 bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-6 rounded-[32px] shadow-3xl">
                        <div className="p-4 bg-indigo-500/20 rounded-2xl relative">
                          <div className="absolute inset-0 bg-indigo-500/20 blur-xl animate-pulse rounded-full" />
                          <Globe size={24} className="text-indigo-400 relative z-10" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white uppercase tracking-[0.4em]">ГЛОБАЛЬНА КАРТА</h4>
                          <p className="text-[10px] font-mono text-indigo-400 font-black uppercase tracking-tighter mt-1">
                            {Object.keys(overview!.countries).length} країн-партнерів
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 relative cursor-crosshair">
                       <GlobalSituationProjection countries={overview!.countries} />
                    </div>

                    <div className="absolute bottom-10 right-10 z-20 flex flex-col gap-4">
                       <button className="p-5 bg-slate-900/90 hover:bg-slate-800 border border-white/10 rounded-2xl text-white transition-all shadow-xl group">
                          <Search size={24} className="group-hover:scale-110 transition-transform" />
                       </button>
                       <button className="p-5 bg-slate-900/90 hover:bg-slate-800 border border-white/10 rounded-2xl text-white transition-all shadow-xl group">
                          <Layers size={24} className="group-hover:scale-110 transition-transform" />
                       </button>
                       <button className="p-5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/30 rounded-2xl text-white transition-all shadow-xl group shadow-indigo-500/20">
                          <Target size={24} className="group-hover:rotate-45 transition-transform" />
                       </button>
                    </div>
                  </TacticalCard>

                  <TacticalCard title="ТАКТИЧНІ АЛЕРТИ" icon={<Radio size={20} className="text-rose-500" />} variant="holographic">
                    {alerts.length === 0 ? (
                      <div className="py-12 text-center text-slate-600">
                        <Eye size={32} className="mx-auto mb-4 opacity-30" />
                        <p className="text-sm font-black uppercase tracking-widest">Критичних алертів немає</p>
                        <p className="text-xs mt-2">Усі декларації в межах допустимих ризиків</p>
                      </div>
                    ) : (
                      <div className="space-y-6 max-h-[420px] overflow-y-auto custom-scrollbar pr-3">
                        <AnimatePresence mode="popLayout">
                        {alerts.map((alert, idx) => (
                          <motion.div 
                            key={alert.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className={cn(
                              "p-6 rounded-3xl relative group overflow-hidden transition-all hover:bg-white/5 border-2",
                              alert.severity === 'critical' ? "bg-rose-500/5 border-rose-500/20" : "bg-slate-900/40 border-white/5"
                            )}
                          >
                            <div className="flex justify-between items-start mb-4 relative z-10">
                              <div className="flex items-center gap-4">
                                <div className={cn(
                                  "w-10 h-10 rounded-2xl flex items-center justify-center",
                                  alert.severity === 'critical' ? "bg-rose-500/20 text-rose-500" : "bg-indigo-500/20 text-indigo-400"
                                )}>
                                   {alert.severity === 'critical' ? <ShieldAlert size={20} className="animate-pulse" /> : <Eye size={20} />}
                                </div>
                                <div>
                                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90">{alert.type}</span>
                                  <p className="text-[9px] font-mono text-slate-500 mt-0.5">{timeAgo(alert.timestamp)} | {alert.sector}</p>
                                </div>
                              </div>
                              {alert.value > 0 && (
                                <Badge className="bg-white/5 text-slate-400 border-white/10 text-[8px] tracking-[0.2em]">
                                  {formatCurrency(alert.value)}
                                </Badge>
                              )}
                            </div>
                            <h5 className="text-sm font-black text-white leading-relaxed mb-4 relative z-10">{alert.message}</h5>
                            <div className="flex items-center justify-between relative z-10">
                              <span className="text-[9px] text-slate-600 font-mono">{alert.company}</span>
                              <button className="px-5 py-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group/btn">
                                ДЕТАЛІ <ArrowUpRight size={14} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                              </button>
                            </div>
                            {alert.severity === 'critical' && <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500 shadow-[0_0_20px_#f43f5e]" />}
                          </motion.div>
                        ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </TacticalCard>
                </div>

                {/* ПРАВА КОЛОНКА: Топ ризики + Інфраструктура */}
                <div className="col-span-12 xl:col-span-3 space-y-10">
                   
                   <TacticalCard title="ТОП-5 РИЗИКОВИХ КОМПАНІЙ" icon={<Building2 size={20} className="text-rose-500" />} variant="holographic">
                     {riskCompanies.length === 0 ? (
                       <div className="py-8 text-center text-slate-600 text-sm">Ризикових компаній не виявлено</div>
                     ) : (
                       <div className="space-y-4">
                         {riskCompanies.map((company, idx) => (
                           <motion.div
                             key={company.edrpou || idx}
                             initial={{ opacity: 0, x: 20 }}
                             animate={{ opacity: 1, x: 0 }}
                             transition={{ delay: idx * 0.08 }}
                             className="p-5 bg-slate-900/40 border border-white/5 rounded-2xl hover:border-rose-500/30 transition-all group cursor-pointer"
                           >
                             <div className="flex justify-between items-start mb-3">
                               <div className="flex-1 min-w-0">
                                 <p className="text-[11px] font-black text-white truncate">{company.name}</p>
                                 <p className="text-[9px] font-mono text-slate-600 mt-0.5">ЄДРПОУ: {company.edrpou}</p>
                               </div>
                               <div className={cn(
                                 "px-3 py-1 rounded-full text-[10px] font-black",
                                 company.maxRisk > 90 ? "bg-rose-500/20 text-rose-400" :
                                 company.maxRisk > 70 ? "bg-amber-500/20 text-amber-400" :
                                 "bg-yellow-500/20 text-yellow-400"
                               )}>
                                 {company.maxRisk}%
                               </div>
                             </div>
                             <div className="flex justify-between text-[9px] text-slate-500">
                               <span>{company.count} декл.</span>
                               <span>{formatCurrency(company.totalValue)}</span>
                             </div>
                             <div className="mt-3 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                               <motion.div
                                 initial={{ width: 0 }}
                                 animate={{ width: `${company.maxRisk}%` }}
                                 className={cn(
                                   "h-full rounded-full",
                                   company.maxRisk > 90 ? "bg-rose-500" : company.maxRisk > 70 ? "bg-amber-500" : "bg-yellow-500"
                                 )}
                               />
                             </div>
                           </motion.div>
                         ))}
                       </div>
                     )}
                   </TacticalCard>

                   <TacticalCard title="ІНФРАСТРУКТУРА" icon={<Database size={20} className="text-emerald-400" />} variant="holographic">
                     <div className="space-y-3">
                       {infraItems.map((item) => (
                         <div key={item.key} className="flex items-center justify-between p-4 bg-slate-900/40 border border-white/5 rounded-2xl">
                           <div className="flex items-center gap-3">
                             <div className={cn(
                               "w-2 h-2 rounded-full",
                               item.status === 'UP' ? "bg-emerald-500 shadow-[0_0_6px_#10b981]" : "bg-rose-500 shadow-[0_0_6px_#f43f5e]"
                             )} />
                             <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider">{item.label}</span>
                           </div>
                           <span className="text-sm font-mono font-black text-white">{formatNumber(item.count)}</span>
                         </div>
                       ))}
                     </div>
                   </TacticalCard>

                   <TacticalCard title="МИТНИЦІ" icon={<Building2 size={20} className="text-indigo-400" />} variant="holographic">
                     <div className="space-y-3">
                       {Object.entries(overview!.customs_offices).map(([office, stat]) => (
                         <div key={office} className="p-4 bg-slate-900/40 border border-white/5 rounded-2xl">
                           <div className="flex justify-between items-center mb-2">
                             <span className="text-[11px] font-black text-slate-300">{office}</span>
                             {stat.highRisk > 0 && (
                               <Badge className="bg-rose-500/10 text-rose-400 border-none text-[8px]">{stat.highRisk} ризик.</Badge>
                             )}
                           </div>
                           <div className="flex justify-between text-[10px] text-slate-500">
                             <span>{stat.count} декл.</span>
                             <span>{formatCurrency(stat.value)}</span>
                           </div>
                         </div>
                       ))}
                     </div>
                   </TacticalCard>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Інформаційний тікер з реальними даними */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-3xl border-t border-cyan-500/20 h-12 flex items-center overflow-hidden">
          <div className="px-10 bg-cyan-600 h-full flex items-center shrink-0 border-r border-cyan-400/20 shadow-[10px_0_30px_rgba(0,243,255,0.3)] relative z-10">
            <span className="text-[11px] font-black text-black uppercase tracking-[0.3em] whitespace-nowrap">NEXUS_STRATEGIC_LINK</span>
          </div>
          <div className="flex-1 flex items-center">
            <motion.div 
              animate={{ x: [2000, -3000] }}
              transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
              className="flex items-center gap-20 whitespace-nowrap"
            >
              {tickerMessages.map((log, i) => (
                <div key={i} className="flex items-center gap-6">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_#6366f1]" />
                  <span className="text-[11px] font-mono text-slate-400 font-black uppercase tracking-widest">
                    {log}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
          .panel-3d {
            transition: all 0.6s cubic-bezier(0.19, 1, 0.22, 1);
          }
          .panel-3d:hover {
            transform: translateY(-12px) scale(1.02);
            box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.9), 0 0 40px rgba(99, 102, 241, 0.15);
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 5px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.02);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(99, 102, 241, 0.2);
            border-radius: 20px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(99, 102, 241, 0.4);
          }
        `}} />
      </div>
    </PageTransition>
  );
};

export default DashboardView;
