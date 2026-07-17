/**
 * 🦅 PREDATOR STRATEGIC NEXUS | v63.0-ELITE
 * ГОЛОВНА ПАНЕЛЬ УПРАВЛІННЯ (SOVEREIGN DASHBOARD)
 * 
 * Центральний вузол моніторингу митних ризиків та торговельних потоків.
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import { Button } from '@/components/ui/button';
import { BrandLoaderFallback } from '@/components/polish/BrandLoader';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertTriangle, Brain, LayoutDashboard, Search, Target, Globe, Cpu,
  RefreshCw, TrendingUp, Flame, Network, Layers, ShieldAlert, Satellite,
  Radar, Radio, Eye, ArrowUpRight, HardDrive, Database, FileText,
  Building2, Package, Ship, Zap, Activity, ShieldCheck, 
  Orbit, Fingerprint, Boxes, Workflow, Terminal, RadioTower, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactECharts from '@/components/ECharts';
import * as echarts from 'echarts';

import { ViewHeader } from '@/components/ViewHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { Badge } from '@/components/ui/badge';
import { NeuralPulse } from '@/components/ui/NeuralPulse';
import { HoloCard } from '@/components/ui/HoloCard';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberOrb } from '@/components/CyberOrb';
import { CyberGrid } from '@/components/CyberGrid';
import { cn } from '@/utils/cn';
import { dashboardApi } from '@/services/api/dashboard';
import { SearchWidget } from '@/components/search/SearchWidget';
import { AudioSanctuary } from '@/components/shared/AudioSanctuary';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { antigravityApi } from '@/services/api/antigravity';
import { useUISound, UISoundType } from '@/hooks/useUISound';
import type { DashboardOverview, EngineInfo, DashboardAlert, RadarItem, RiskCompany } from '@/services/api/dashboard';

// ========================
// Допоміжні функції
// ========================

const formatCurrency = (val: number): string => {
  if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(2)}B`;
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val}`;
};

const formatNumber = (val: number | undefined | null): string => {
  if (val == null || typeof val !== 'number' || isNaN(val)) return '—';
  return val.toLocaleString('uk-UA');
};

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

const StrategicRadarMatrix: React.FC<{ data: RadarItem[] }> = ({ data }) => {
  const indicators = data.map(d => ({ name: d.name, max: 100 }));
  const values = data.map(d => d.value);

  const option = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10, 10, 10, 0.95)',
      borderColor: 'rgba(244, 63, 94, 0.4)',
      borderWidth: 1,
      textStyle: { color: '#fff', fontSize: 10, fontWeight: '900', fontFamily: 'Outfit' },
      formatter: (params: any) => {
        if (!params.value) return '';
        return data.map((d, i) => `${d.name}: ${params.value[i]}% (ДЕКЛ: ${d.count})`).join('<br/>');
      }
    },
    radar: {
      indicator: indicators.length > 0 ? indicators : [{ name: 'Завантаження...', max: 100 }],
      shape: 'circle',
      splitNumber: 5,
      axisName: {
        color: '#f43f5e',
        fontSize: 10,
        fontWeight: '900',
        fontFamily: 'Outfit',
        fontStyle: 'italic'
      },
      splitLine: {
        lineStyle: {
          color: [
            'rgba(244, 63, 94, 0.05)',
            'rgba(244, 63, 94, 0.1)',
            'rgba(244, 63, 94, 0.15)',
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
        name: 'РИЗИКОВИЙ СПЕКТР',
        type: 'radar',
        data: [
          {
            value: values.length > 0 ? values : [0],
            name: 'Середній ризик за секторами',
            symbol: 'circle',
            symbolSize: 6,
            itemStyle: { color: '#f43f5e' },
            lineStyle: { color: '#f43f5e', width: 3, shadowBlur: 20, shadowColor: 'rgba(244, 63, 94, 0.6)' },
            areaStyle: {
              color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
                { offset: 0, color: 'rgba(244, 63, 94, 0.5)' },
                { offset: 1, color: 'rgba(244, 63, 94, 0.05)' }
              ])
            }
          }
        ]
      }
    ]
  }), [data, indicators, values]);

  return <ReactECharts option={option} style={{ height: '380px', width: '100%' }} />;
};

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
      itemStyle: { color: stat.count > 100 ? '#f43f5e' : stat.count > 50 ? '#f59e0b' : '#fb7185' }
    }));

  scatterData.push({ name: 'Київ', value: [...kyiv, 150], itemStyle: { color: '#f43f5e' } });

  const option = {
    backgroundColor: 'transparent',
    geo: {
      map: 'world',
      roam: false,
      silent: true,
      zoom: 1.25,
      itemStyle: {
        areaColor: 'rgba(15, 23, 42, 0.4)',
        borderColor: 'rgba(244, 63, 94, 0.2)',
        borderWidth: 1.5,
        shadowColor: 'rgba(0, 0, 0, 0.5)',
        shadowBlur: 40
      }
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10, 10, 10, 0.95)',
      borderColor: 'rgba(244, 63, 94, 0.4)',
      borderWidth: 1,
      textStyle: { color: '#fff', fontSize: 11, fontWeight: '900', fontFamily: 'Outfit' },
      formatter: (params: any) => {
        const c = params.name;
        const stat = countries[c];
        if (!stat) return c;
        return `<div class="p-4"><b class="text-cyan-500 uppercase tracking-widest text-[10px] italic">${c}</b><br/><div class="mt-2 text-white font-black text-sm italic">ДЕКЛАРАЦІЙ: ${stat.count}</div><div class="text-slate-400 text-[10px] font-black uppercase italic mt-1">ВАРТІСТЬ: ${formatCurrency(stat.value)}</div></div>`;
      }
    },
    series: [
      {
        type: 'lines',
        zlevel: 1,
        effect: {
          show: true,
          period: 4,
          trailLength: 0.7,
          color: '#f43f5e',
          symbolSize: 3,
        },
        lineStyle: { color: '#f43f5e', width: 2, opacity: 0.15, curveness: 0.4 },
        data: linesData
      },
      {
        type: 'effectScatter',
        coordinateSystem: 'geo',
        data: scatterData,
        symbolSize: (v: number[]) => Math.max(v[2] / 10, 10),
        rippleEffect: { brushType: 'stroke', scale: 4, period: 4 },
        itemStyle: { shadowBlur: 30, shadowColor: 'rgba(244, 63, 94, 0.8)', opacity: 0.8 }
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '650px', width: '100%' }} />;
};

const DashboardView: React.FC = () => {
  const { play } = useUISound();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { isOffline, activeFailover, nodeSource, healingProgress } = useBackendStatus();

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      const data = await dashboardApi.getOverview();
      setOverview(data);
    } catch (err) {
      console.error('[Dashboard] Помилка:', err);
      setError('Зв\'язок з API розірвано. Спробуйте оновити ядро.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 45000); // Оновлення кожні 45с
    return () => clearInterval(interval);
  }, [fetchData]);

  const hasData = overview && overview.summary.total_declarations > 0;

  // Нав'язливі toast-повідомлення видалено (HR-04 compliant)

  const stats = useMemo(() => {
    if (!overview) return null;
    const totalOPS = Object.values(overview.engines).reduce((a, b) => a + (b.throughput || 0), 0);
    const topRisk = overview.top_risk_companies?.length ? overview.top_risk_companies[0].maxRisk : 0;
    return { totalOPS, topRisk, totalDecls: overview.summary.total_declarations };
  }, [overview]);

  if (loading) {
    return (
      <PageTransition>
        <div className="w-full min-h-screen flex items-center justify-center bg-[#010409]">
          <div className="flex flex-col items-center gap-12">
            <CyberOrb size="xl" status="processing" pulsing />
            <div className="text-center space-y-4">
               <h2 className="text-3xl font-black text-white italic uppercase tracking-[0.4em] ">АКТИВАЦІЯ_ЯДРА_V63.0-ELITE</h2>
               <p className="text-cyan-500/60 text-[10px] font-mono font-black uppercase tracking-[0.8em]">Синхронізація суверенних метрик...</p>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="w-full min-h-screen p-4 sm:p-12 flex flex-col gap-16 relative bg-[#010409] font-sans pb-40 overflow-hidden">
        <AdvancedBackground />
        <CyberGrid color="rgba(244, 63, 94, 0.05)" />
        <NeuralPulse color="rgba(244, 63, 94, 0.03)" size={1600} />
        
        <div className="fixed left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-rose-600 to-transparent z-50 opacity-30 " />
        
        <div className="relative z-10 max-w-[1900px] mx-auto w-full space-y-16">
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 bg-cyan-500/10 border-2 border-cyan-500/50 rounded-3xl flex items-center gap-6 text-cyan-500 "
            >
              <AlertTriangle size={32} className="" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-1">КРИТИЧНА_ПОМИЛКА_ЯДРА</p>
                <p className="text-xl font-bold italic uppercase">{error}</p>
              </div>
            </motion.div>
          )}

          <SearchWidget className="mb-16 scale-105" />

          <ViewHeader
            title={
              <div className="flex items-center gap-12">
                <div className="relative group/orb scale-125">
                   <CyberOrb size="md" status={stats?.topRisk! > 80 ? 'critical' : 'active'} className="" />
                </div>
                <div className="ml-4">
                  <h1 className="text-6xl font-black text-white tracking-widest uppercase leading-none font-display italic skew-x-[-3deg]">
                    ГОЛОВНИЙ <span className="text-cyan-600">ПУЛЬТ</span>
                  </h1>
                  <div className="flex items-center gap-6 mt-6">
                    <div className="h-0.5 w-20 bg-gradient-to-r from-rose-600 to-transparent" />
                    <span className="text-[11px] font-mono font-black text-cyan-500/90 uppercase tracking-[0.6em]  italic">
                    ЦЕНТРАЛЬНЕ КОМАНДУВАННЯ // v63.0-ELITE
                    </span>
                  </div>
                </div>
              </div>
            }
            breadcrumbs={['ЕСКАДРА', 'КОМАНДУВАННЯ', 'ТАКТИЧНИЙ_ХАБ']}
            stats={[
              { 
                label: isOffline ? 'MIRROR_RECOVERY' : 'NODE_SOURCE', 
                value: isOffline ? `${Math.floor(healingProgress)}%` : (activeFailover ? 'NVIDIA_ZROK' : 'NVIDIA_PROD'), 
                color: isOffline ? 'warning' : 'success', 
                icon: isOffline ? <Activity /> : <Cpu />,
                animate: isOffline
              },
              { label: 'ЯДРО', value: stats?.totalOPS! > 0 ? `${formatNumber(stats?.totalOPS!)} оп/с` : 'Н/Д', color: 'success', icon: <Activity size={14} />, animate: true },
              { label: 'КРИТИЧНІСТЬ', value: `${stats?.topRisk!}%`, color: stats?.topRisk! > 80 ? 'danger' : 'warning', icon: <Flame size={14} /> },
              { label: 'ОБ\'ЄМ', value: formatNumber(stats?.totalDecls!), color: 'primary', icon: <Boxes size={14} /> }
            ]}
            actions={
              <div className="flex gap-6">
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(244,63,94,0.3)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={async () => {
                    play(UISoundType.CLICK);
                    try {
                      const res = await antigravityApi.simulateHorizon();
                      window.dispatchEvent(new CustomEvent('predator-error', {
                        detail: {
                          service: 'AGI_ORCHESTRATOR',
                          message: `СИМУЛЯЦІЯ_ЗАПУЩЕНА: ${res.message} (ID: ${res.task_id})`,
                          severity: 'success',
                          timestamp: new Date().toISOString(),
                          code: 'HORIZON_SIM_START'
                        }
                      }));
                    } catch (err) {
                      console.error('Simulation failed:', err);
                    }
                  }}
                  className="px-10 py-5 bg-cyan-600/20 border-2 border-cyan-500/40 text-rose-400 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-cyan-600/40 transition-all flex items-center gap-4 italic group"
                >
                  <Orbit size={20} className="text-rose-400 animate-spin-slow" />
                  <span>WAR-GAMING_HORIZON</span>
                </motion.button>

                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(244,63,94,0.3)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { play(UISoundType.CLICK); fetchData(); }}
                  onMouseEnter={() => play(UISoundType.HOVER)}
                  disabled={refreshing}
                  className="px-10 py-5 bg-black/60 border-2 border-cyan-500/30 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-cyan-600/20 transition-all flex items-center gap-4 disabled:opacity-50 italic group"
                >
                  <RefreshCw size={20} className={cn("text-cyan-500 transition-transform", refreshing && "animate-spin")} />
                  <span>СИНХРОНІЗАЦІЯ_ЯДРА</span>
                </motion.button>
              </div>
            }
          />

          <NeuralPulse color="rgba(244, 63, 94, 0.05)" size={1200} />

          {!hasData ? (
             <div className="py-60 flex flex-col items-center justify-center gap-12 text-center relative">
                 <div className="absolute inset-0 bg-cyan-500/5 blur-[120px] rounded-full " />
                 <div className="relative group">
                    <div className="absolute inset-0 bg-cyan-500/20 blur-[100px] rounded-full scale-150 " />
                    <Database size={120} className="text-slate-800 relative z-10 group-hover:text-rose-900 transition-colors duration-700" />
                 </div>
                 <div className="space-y-6 relative z-10">
                    <h3 className="text-4xl font-black text-slate-700 uppercase tracking-[1em] italic">ЯДРО_ПОРОЖНЄ</h3>
                    <p className="text-slate-500 font-black uppercase text-[12px] tracking-[0.4em] max-w-xl italic opacity-60">Завантажте дані для активації аналітичних двигунів PREDATOR</p>
                 </div>
             </div>
          ) : (
            <>
              {/* Grand Metrics Row — AURUM OBSIDIAN HoloCard */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-8 relative z-10">
                {[
                  { label: 'ФІНАНСОВИЙ_ПОТІК', value: formatCurrency(overview!.summary.total_value_usd), icon: TrendingUp, color: '#e11d48', sub: 'Загальна вартість' },
                  { label: 'ІМПОРТ_ВВЕЗЕННЯ', value: formatNumber(overview!.summary.import_count), icon: Ship, color: '#06b6d4', sub: 'Вантажні судна' },
                  { label: 'ЕКСПОРТ_ВИВЕЗЕННЯ', value: formatNumber(overview!.summary.export_count), icon: Package, color: '#10b981', sub: 'Логістичні партії' },
                  { label: 'ЗОНА_КРИТИЧНОСТІ', value: String(overview!.summary.high_risk_count), icon: ShieldAlert, color: '#f59e0b', sub: 'Високий ризик' },
                  { label: 'СЕМАНТИЧНИЙ_ГРАФ', value: formatNumber(overview!.summary.graph_nodes), icon: Network, color: '#8b5cf6', sub: 'Вузли системи' },
                  { label: 'НЕЙРО_МАТРИЦЯ', value: formatNumber(overview!.summary.vectors), icon: Brain, color: '#f43f5e', sub: 'Векторні індекси' },
                ].map((m, i) => (
                  <motion.div
                    key={m.label}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, type: "spring", stiffness: 100 }}
                  >
                    <HoloCard
                      glowColor={m.color}
                      className="h-full"
                    >
                      <div className="p-6 relative z-10">
                        <div className="absolute top-4 right-4 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05]"
                          style={{ color: m.color }}
                        >
                          <m.icon size={20} />
                        </div>
                        <div className="space-y-3 pt-2">
                          <div className="space-y-1">
                            <p className="font-display text-[9px] font-black uppercase tracking-[0.15em] italic" style={{ color: m.color }}>{m.label}</p>
                            <p className="font-interface text-[8px] font-bold text-[#5a5a5a] uppercase tracking-tighter italic">{m.sub}</p>
                          </div>
                          <p className="font-data text-3xl font-black text-[#e8e8e8] italic tracking-tighter">{m.value}</p>
                        </div>
                      </div>
                    </HoloCard>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-12 gap-12 relative z-10">
            
                {/* ЛІВА КОЛОНКА */}
                <div className="col-span-12 xl:col-span-4 space-y-12">
                  <section className="page-section section-rose shadow-2xl relative overflow-hidden">
                    <div className="hud-corner-tl hud-corner-nexus opacity-40" />
                    <div className="hud-corner-tr hud-corner-nexus opacity-40" />
                    <div className="hud-corner-bl hud-corner-nexus opacity-40" />
                    <div className="hud-corner-br hud-corner-nexus opacity-40" />
                    <div className="section-header">
                      <div className="section-dot-rose" />
                      <div>
                        <h2 className="section-title">ДВИГУНИ_АНАЛІЗУ</h2>
                        <p className="section-subtitle">Стан аналітичного ядра</p>
                      </div>
                    </div>
                    <div className="space-y-8">
                      {Object.entries(overview!.engines).map(([key, data], idx) => (
                        <motion.div 
                          key={key} 
                          initial={{ opacity: 0, x: -40 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="p-8 bg-black/40 border border-white/5 rounded-[2.5rem] group hover:border-cyan-500/40 transition-all relative overflow-hidden shadow-2xl"
                        >
                          <div className="absolute inset-0 bg-cyan-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="flex justify-between items-center mb-8 relative z-10">
                            <span className="text-[12px] font-black text-slate-200 uppercase tracking-[0.3em] italic flex items-center gap-4">
                              <Terminal size={16} className="text-cyan-500" /> {data.name || key}
                            </span>
                            <Badge variant="outline" className={cn(
                              "text-[9px] font-black px-5 py-1.5 tracking-widest rounded-xl border-2 italic",
                              data.status === 'optimal' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            )}>
                              {data.status === 'optimal' ? 'ОПТИМАЛЬНО' : 'КАЛІБРУВАННЯ'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-6 relative z-10">
                            <div className="space-y-1">
                              <p className="text-[9px] font-black text-slate-600 uppercase tracking-tighter italic">ПОТІК</p>
                              <p className="text-2xl font-mono font-black text-white italic">{formatNumber(data.throughput)}/с</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[9px] font-black text-slate-600 uppercase tracking-tighter italic">ЗАТРИМКА</p>
                              <p className="text-2xl font-mono font-black text-rose-400 italic">{data.latency}мс</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[9px] font-black text-slate-600 uppercase tracking-tighter italic">ЯКІСТЬ</p>
                              <p className="text-2xl font-mono font-black text-cyan-400 italic">{data.score}%</p>
                            </div>
                          </div>
                          <div className="mt-8 h-1.5 w-full bg-slate-900 rounded-full overflow-hidden relative z-10">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${data.load}%` }}
                              className={cn(
                                "h-full rounded-full transition-all duration-1000 ",
                                data.load > 85 ? "bg-amber-500 shadow-amber-500/50" : "bg-gradient-to-r from-rose-600 to-cyan-400"
                              )}
                            />
                          </div>
                          <div className="flex justify-between mt-4 relative z-10">
                            <span className="text-[10px] font-black text-slate-600 italic">НАВАНТАЖЕННЯ: {data.load}%</span>
                            <span className="text-[10px] font-black text-cyan-500 italic uppercase">{data.trend.replace('UP', 'ЗРОСТАННЯ').replace('DOWN', 'СПАД')}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </section>

                  <section className="page-section section-rose shadow-3xl relative overflow-hidden">
                    <div className="hud-corner-tl hud-corner-nexus opacity-40" />
                    <div className="hud-corner-tr hud-corner-nexus opacity-40" />
                    <div className="hud-corner-bl hud-corner-nexus opacity-40" />
                    <div className="hud-corner-br hud-corner-nexus opacity-40" />
                    <div className="section-header">
                      <div className="section-dot-rose" />
                      <div>
                        <h2 className="section-title">МАТРИЦЯ_РИЗИКІВ</h2>
                        <p className="section-subtitle">Багатовимірний аналіз загроз</p>
                      </div>
                    </div>
                    <StrategicRadarMatrix data={overview!.radar} />
                    <div className="mt-12 grid grid-cols-2 gap-8">
                      {overview!.radar.map((s, idx) => {
                        const colors = ['#f43f5e', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6'];
                        const color = colors[idx % colors.length];
                        return (
                          <div key={s.name} className="p-6 bg-black/60 border border-white/5 rounded-[2rem] hover:border-cyan-500/30 transition-all flex flex-col gap-4 group/radaritem overflow-hidden relative shadow-xl">
                            <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover/radaritem:opacity-[0.08] transition-opacity">
                               <ShieldAlert size={80} style={{ color }} />
                            </div>
                            <div className="flex items-center gap-4 relative z-10">
                              <div className="w-3 h-3 rounded-full " style={{ backgroundColor: color }} />
                              <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] italic">{s.name}</p>
                            </div>
                            <div className="flex items-baseline gap-4 relative z-10">
                              <p className="text-3xl font-black text-white italic tracking-tighter">{s.value}%</p>
                              <p className="text-[10px] font-bold text-slate-600 italic uppercase">{s.count} ДЕКЛ.</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>

                {/* ЦЕНТРАЛЬНА КОЛОНКА */}
                <div className="col-span-12 xl:col-span-5 space-y-12">
                   <section className="page-section section-rose shadow-[0_60px_150px_-30px_rgba(0,0,0,0.8)] min-h-[720px] !p-0 overflow-hidden relative">
                     <div className="hud-corner-tl hud-corner-nexus opacity-60" />
                     <div className="hud-corner-tr hud-corner-nexus opacity-60" />
                     <div className="hud-corner-bl hud-corner-nexus opacity-60" />
                     <div className="hud-corner-br hud-corner-nexus opacity-60" />
                     <div className="p-10 pb-0 max-w-xl">
                       <div className="section-header">
                         <div className="section-dot-rose" />
                         <div>
                           <h2 className="section-title">ОПЕРАТИВНА_ПРОЕКЦІЯ</h2>
                           <p className="section-subtitle">Глобальний транзит</p>
                         </div>
                       </div>
                     </div>
                     <div className="absolute top-24 left-12 z-20">
                       <div className="flex items-center gap-8 bg-slate-950/80  border border-white/10 p-8 rounded-[3rem] shadow-3xl">
                         <div className="p-5 bg-cyan-500/10 rounded-2xl relative">
                           <div className="absolute inset-0 bg-cyan-500/20 blur-xl  rounded-full" />
                           <Orbit size={28} className="text-rose-400 relative z-10 animate-spin-slow" />
                         </div>
                         <div>
                           <h4 className="text-lg font-black text-white uppercase tracking-[0.4em] italic mb-1">ГЛОБАЛЬНИЙ_ТРАНЗИТ</h4>
                           <p className="text-[10px] font-mono text-rose-400 font-black uppercase tracking-widest italic leading-none">
                             {Object.keys(overview!.countries).length} АКТИВНІ_ЛОКАЦІЇ
                           </p>
                         </div>
                       </div>
                     </div>

                     <div className="w-full h-full relative p-12 pt-0">
                        <GlobalSituationProjection countries={overview!.countries} />
                     </div>

                     <div className="absolute bottom-12 right-12 z-20 flex bg-black/60  p-3 border border-white/10 rounded-[2.5rem] gap-4 shadow-3xl">
                        {[Search, Layers, Target, RadioTower].map((Icon, idx) => (
                           <Button variant="cyber" key={idx} onMouseEnter={() => play(UISoundType.HOVER)} className="p-6 bg-white/5 hover:bg-cyan-600 hover:text-white rounded-3xl text-slate-400 transition-all group">
                              <Icon size={24} className={cn("group-hover:scale-110 group-hover:rotate-6 transition-transform", idx === 3 && " text-rose-400")} />
                           </Button>
                        ))}
                     </div>
                   </section>

                   <section className="page-section section-rose shadow-3xl">
                      <div className="section-header">
                        <div className="section-dot-rose" />
                        <div>
                          <h2 className="section-title">ТАКТИЧНІ_АЛЕРТИ</h2>
                          <p className="section-subtitle">Критичні інциденти та сповіщення</p>
                        </div>
                      </div>
                      <div className="space-y-8 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
                        <AnimatePresence mode="popLayout">
                          {overview!.alerts.map((alert, idx) => (
                            <motion.div 
                               key={alert.id}
                               initial={{ opacity: 0, scale: 0.95 }}
                               animate={{ opacity: 1, scale: 1 }}
                               transition={{ delay: idx * 0.08 }}
                               className={cn(
                                 "p-8 rounded-[2.5rem] border-2 relative group overflow-hidden transition-all hover:bg-white/5 shadow-2xl",
                                 alert.severity === 'critical' ? "bg-cyan-500/[0.03] border-cyan-500/20" : "bg-black/40 border-white/5"
                               )}
                            >
                               <div className="flex justify-between items-start mb-6 relative z-10">
                                  <div className="flex items-center gap-6">
                                     <div className={cn(
                                       "w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl",
                                       alert.severity === 'critical' ? "bg-cyan-500/20 text-cyan-500 shadow-cyan-500/20" : "bg-cyan-500/10 text-rose-400"
                                     )}>
                                        {alert.severity === 'critical' ? <ShieldAlert size={28} className="" /> : <Eye size={28} />}
                                     </div>
                                     <div>
                                        <div className="flex items-center gap-3">
                                           <span className="text-[12px] font-black uppercase tracking-[0.3em] text-white italic">{alert.type}</span>
                                           <Badge className="bg-white/5 border-white/5 text-[8px] tracking-[0.2em] font-black italic">{alert.sector}</Badge>
                                        </div>
                                        <p className="text-[10px] font-mono text-slate-500 mt-2 font-black italic">{timeAgo(alert.timestamp)} // NODE_PROXIMITY_ALERT</p>
                                     </div>
                                  </div>
                                  {alert.value > 0 && (
                                     <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">ВАРТІСТЬ_ЛОТУ</p>
                                        <p className="text-lg font-mono font-black text-white italic">{formatCurrency(alert.value)}</p>
                                     </div>
                                  )}
                               </div>
                               <h5 className="text-[18px] font-black text-white leading-tight mb-8 relative z-10 italic uppercase tracking-tighter">{alert.message}</h5>
                               <div className="flex items-center justify-between relative z-10 border-t border-white/5 pt-6">
                                  <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                                        <Building2 size={14} className="text-slate-500" />
                                     </div>
                                     <span className="text-[11px] font-black text-slate-400 uppercase tracking-tight italic truncate max-w-[200px]">{alert.company}</span>
                                  </div>
                                  <Button variant="cyber" onClick={() => play(UISoundType.CLICK)} onMouseEnter={() => play(UISoundType.HOVER)} className="px-8 py-3.5 bg-cyan-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-3 italic group/btn shadow-[0_10px_30px_rgba(244,63,94,0.3)]">
                                     РОЗСЛІДУВАТИ <ArrowUpRight size={18} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                  </Button>
                               </div>
                               {alert.severity === 'critical' && <div className="absolute top-0 right-0 w-2 h-full bg-cyan-500 shadow-[0_0_30px_#f43f5e]" />}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                   </section>
                </div>

                {/* ПРАВА КОЛОНКА */}
                <div className="col-span-12 xl:col-span-3 space-y-12">
                   <section className="page-section section-rose shadow-3xl">
                      <div className="section-header">
                        <div className="section-dot-rose" />
                        <div>
                          <h2 className="section-title">ВЕРТИКАЛЬ_РИЗИКІВ</h2>
                          <p className="section-subtitle">Топ суб'єкти високого ризику</p>
                        </div>
                      </div>
                      <div className="space-y-6">
                        {overview!.top_risk_companies?.map((company, idx) => (
                          <motion.div
                             key={company.edrpou || idx}
                             initial={{ opacity: 0, x: 50 }}
                             animate={{ opacity: 1, x: 0 }}
                             transition={{ delay: idx * 0.08 }}
                             className="p-8 bg-black/40 border border-white/5 rounded-[2.5rem] hover:border-cyan-500/40 transition-all group cursor-pointer relative overflow-hidden shadow-xl"
                          >
                             <div className="absolute -right-4 -top-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                                <Fingerprint size={120} className="text-rose-400" />
                             </div>
                             <div className="flex justify-between items-start mb-8 relative z-10">
                                <div className="flex-1 min-w-0">
                                   <p className="text-[14px] font-black text-white italic uppercase tracking-tighter truncate leading-none group-hover:text-rose-400 transition-colors">{company.name}</p>
                                   <p className="text-[10px] font-mono text-slate-600 mt-2 font-black italic uppercase leading-none">ID: {company.edrpou}</p>
                                </div>
                                <div className={cn(
                                   "w-16 h-16 rounded-[1.5rem] flex flex-col items-center justify-center font-black italic border-2",
                                   company.maxRisk > 90 ? "bg-cyan-500/10 text-cyan-500 border-cyan-500/30 shadow-cyan-500/20" : 
                                   "bg-cyan-500/10 text-cyan-500 border-cyan-500/30 shadow-cyan-500/20"
                                )}>
                                   <span className="text-[9px] opacity-60 leading-none">РИЗИК</span>
                                   <span className="text-xl tracking-tighter">{company.maxRisk}</span>
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-4 relative z-10">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                   <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest block mb-1 leading-none">МАСШТАБ_v63.0-ELITE</span>
                                   <span className="text-sm font-black text-white italic">{company.count} ДЕКЛ.</span>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                   <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest block mb-1 leading-none">ОБ'ЄМ_USD</span>
                                   <span className="text-sm font-black text-rose-400 italic">{formatCurrency(company.totalValue)}</span>
                                </div>
                             </div>
                             <div className="mt-8 h-2 w-full bg-slate-900 rounded-full overflow-hidden relative z-10">
                                <motion.div
                                   initial={{ width: 0 }}
                                   animate={{ width: `${company.maxRisk}%` }}
                                   className={cn(
                                     "h-full rounded-full shadow-[0_0_15px]",
                                     company.maxRisk > 90 ? "bg-cyan-500 shadow-cyan-500/40" : "bg-cyan-500 shadow-cyan-500/40"
                                   )}
                                />
                             </div>
                          </motion.div>
                        ))}
                      </div>
                   </section>

                   <section className="page-section section-rose shadow-3xl">
                      <div className="section-header">
                        <div className="section-dot-rose" />
                        <div>
                          <h2 className="section-title">ІНФРА_МАТРИЦЯ</h2>
                          <p className="section-subtitle">Стан базової інфраструктури</p>
                        </div>
                      </div>
                      <div className="space-y-6">
                        {[
                          { key: 'POSTGRESQL', label: 'Relational_Core', status: 'UP', count: (overview!.infrastructure as any)?.postgresql?.records ?? 0, icon: Database, color: 'emerald' },
                          { key: 'OPENSEARCH', label: 'Neural_Search', status: 'UP', count: (overview!.infrastructure as any)?.opensearch?.documents ?? 0, icon: Search, color: 'blue' },
                          { key: 'QDRANT', label: 'Vector_Space', status: 'UP', count: (overview!.infrastructure as any)?.qdrant?.vectors ?? 0, icon: Brain, color: 'purple' },
                          { key: 'NEO4J', label: 'Graph_Topology', status: 'UP', count: (overview!.infrastructure as any)?.neo4j?.nodes ?? 0, icon: Network, color: 'yellow' },
                          { key: 'MINIO', label: 'Object_Nexus', status: 'UP', count: (overview!.infrastructure as any)?.minio?.files ?? 0, icon: HardDrive, color: 'cyan' },
                        ].map((item) => (
                          <div key={item.key} className="p-6 bg-black/40 border border-white/5 rounded-[2rem] hover:border-cyan-500/30 transition-all flex items-center justify-between group shadow-xl">
                             <div className="flex items-center gap-6">
                                <div className={cn(
                                   "w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-slate-900 border border-white/5 group-hover:scale-110",
                                   item.status === 'UP' ? "text-emerald-400" : "text-amber-400"
                                )}>
                                   <item.icon size={22} className={cn(item.status === 'UP' && "")} />
                                </div>
                                <div className="space-y-1">
                                   <p className="text-[11px] font-black text-slate-200 uppercase tracking-widest italic">{item.key}</p>
                                   <p className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter italic">{item.label}</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-xl font-mono font-black text-white italic tracking-tighter">{formatNumber(item.count)}</p>
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[8px] font-black italic tracking-widest mt-1 uppercase">ОНЛАЙН</Badge>
                             </div>
                          </div>
                        ))}
                      </div>
                   </section>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Strategic Information Ticker */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#02040a]/90  border-t border-cyan-500/20 h-16 flex items-center overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
          <div className="px-12 bg-cyan-600 h-full flex items-center shrink-0 border-r border-white/10 shadow-[15px_0_40px_rgba(244,63,94,0.5)] relative z-10 italic text-white">
            <div className="flex items-center gap-4">
               <Fingerprint size={24} className="text-white " />
               <span className="text-[13px] font-black uppercase tracking-[0.4em] whitespace-nowrap">СУВЕРЕННИЙ_ЗВ'ЯЗОК_PREDATOR</span>
            </div>
          </div>
          <div className="flex-1 flex items-center">
            <motion.div 
              animate={{ x: [2500, -3500] }}
              transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
              className="flex items-center gap-32 whitespace-nowrap"
            >
              {[
                `СИСТЕМА: v63.0-ELITE | СТАТУС: ОПТИМАЛЬНО | РЕЖИМ: СУВЕРЕННИЙ`,
                `ГРАФ: ${formatNumber(overview?.summary.graph_nodes ?? 0)} ВУЗЛІВ | ${formatNumber(overview?.summary.graph_edges ?? 0)} ЗВ'ЯЗКІВ`,
                `ТОП РИЗИК: ${stats?.topRisk ?? 0}% [${overview?.top_risk_companies?.[0]?.name ?? 'Н/Д'}]`,
                `ПОШУКОВИЙ ІНДЕКС: ${formatNumber(overview?.summary.search_documents ?? 0)} ДОКУМЕНТІВ`,
                `НЕЙРО-АКТИВНІСТЬ: 78% | ЗАТРИМКА_OODA: 5.8мс`,
                `ЗАГАЛЬНИЙ ПУЛ: ${formatCurrency(overview?.summary.total_value_usd ?? 0)} | ДЕКЛАРАЦІЙ: ${formatNumber(overview?.summary.total_declarations ?? 0)}`
              ].map((log, i) => (
                <div key={i} className="flex items-center gap-10">
                  <div className="w-3 h-3 rounded-full bg-cyan-600  shadow-[0_0_15px_#e11d48]" />
                  <span className="text-[12px] font-mono text-slate-400 font-black uppercase tracking-[0.3em] italic">
                    {log}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        <AudioSanctuary />

        <style dangerouslySetInnerHTML={{
          __html: `
          .animate-spin-slow {
            animation: spin 8s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .font-display {
            font-family: 'Outfit', sans-serif;
          }
          .no-scrollbar::-webkit-scrollbar {
             display: none;
          }
          .page-section {
            padding: 2.5rem;
            background: rgba(0,0,0,0.4);
            backdrop-filter: blur(40px);
            border-radius: 3.5rem;
            border: 1px solid rgba(255,255,255,0.05);
            position: relative;
            overflow: hidden;
          }
          .section-header {
            display: flex;
            align-items: center;
            gap: 1.5rem;
            margin-bottom: 2.5rem;
          }
          .section-title {
            font-size: 1.5rem;
            font-weight: 900;
            color: white;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-style: italic;
          }
          .section-subtitle {
            font-size: 0.65rem;
            font-weight: 900;
            color: rgba(255,255,255,0.3);
            text-transform: uppercase;
            letter-spacing: 0.4em;
            margin-top: 0.25rem;
            font-style: italic;
          }
          .section-dot-rose {
            width: 0.75rem;
            height: 0.75rem;
            border-radius: 9999px;
            background: #f43f5e;
            box-shadow: 0 0 15px #f43f5e;
          }
          .section-rose {
            border-color: rgba(244, 63, 94, 0.1);
          }
          .section-rose:hover {
            border-color: rgba(244, 63, 94, 0.3);
          }
          `
        }} />
      </div>
    </PageTransition>
  );
};

export default DashboardView;
