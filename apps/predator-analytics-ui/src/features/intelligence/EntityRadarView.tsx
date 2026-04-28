/**
 * 🛰️ ENTITY RADAR //  АДА  СУБ'ЄКТІВ | v58.2-WRAITH
 * PREDATOR Analytics — Sovereign Intelligence & Network Analysis
 * 
 * Модуль глобального моніторингу та радарного виявлення аномальних
 * суб'єктів господарювання по всьому контуру GDS.
 * 
 * Sovereign Power Design · Tactical · Tier-1
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { motion, AnimatePresence } from 'framer-motion';
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
  Eye,
  RefreshCw,
  Network,
  Siren,
  Sparkles,
  SearchCode,
  Fingerprint,
  ShieldCheck,
  Building2
} from 'lucide-react';
import ReactECharts from '@/components/ECharts';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { apiClient as api } from '@/services/api/config';
import { cn } from '@/utils/cn';
import { PageTransition } from '@/components/layout/PageTransition';
import { ViewHeader } from '@/components/ViewHeader';

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

const SovereignBadge = ({ level, score }: { level: string; score: number }) => {
  const getColors = () => {
    switch (level.toUpperCase()) {
      case 'CRITICAL': return 'bg-amber-600/10 text-amber-500 border-amber-600/30 shadow-[0_0_20px_rgba(225,29,72,0.3)]';
      case 'HIGH': return 'bg-orange-600/10 text-orange-500 border-orange-600/30 shadow-[0_0_15px_rgba(234,88,12,0.2)]';
      case 'ELEVATED': return 'bg-yellow-600/10 text-yellow-500 border-yellow-600/30 shadow-[0_0_15px_rgba(212,175,55,0.2)]';
      default: return 'bg-emerald-600/10 text-emerald-500 border-emerald-600/30';
    }
  };

  return (
    <div className={cn("px-6 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 italic", getColors())}>
      <Shield size={12} className={score > 80 ? "animate-pulse" : ""} />
      <span>{score.toFixed(1)}</span>
      <span className="opacity-20">|</span>
      <span>{level}</span>
    </div>
  );
};

const SectorIcon = ({ sector }: { sector: string }) => {
  if (sector.includes('Логістика')) return <Globe size={14} className="text-yellow-500" />;
  if (sector.includes('палив')) return <Zap size={14} className="text-amber-500" />;
  return <Layers size={14} className="text-yellow-400" />;
};

// --- RADAR CHART CONFIG ---
const getRadarOption = (entity: EntityRadarItem) => {
  const metrics = entity.radar_metrics || { reputation: 50, financials: 50, connections: 50, regulatory: 50, adverse_media: 50 };
  const color = entity.cers_score > 80 ? '#E11D48' : '#D4AF37';

  return {
    backgroundColor: 'transparent',
    radar: {
      indicator: [
        { name: ' ЕПУТАЦІЯ', max: 100 },
        { name: 'ФІНАНСИ', max: 100 },
        { name: 'ЗВ\'ЯЗКИ', max: 100 },
        { name: ' ЕГУЛЯТО И', max: 100 },
        { name: 'МЕДІА', max: 100 }
      ],
      shape: 'circle',
      splitNumber: 5,
      axisName: {
        color: '#475569',
        fontSize: 9,
        fontWeight: '900',
        fontStyle: 'italic'
      },
      splitLine: {
        lineStyle: {
          color: ['rgba(212,175,55,0.05)', 'rgba(212,175,55,0.1)'].reverse()
        }
      },
      splitArea: {
        show: false
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(212,175,55,0.1)'
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
            symbol: 'circle',
            symbolSize: 6,
            itemStyle: { color: color },
            lineStyle: {
              color: color,
              width: 3,
              shadowBlur: 15,
              shadowColor: color
            },
            areaStyle: {
              color: color,
              opacity: 0.15
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
  const [refreshing, setRefreshing] = useState(false);

  const { isOffline, nodeSource } = useBackendStatus();

  useEffect(() => {
    loadRadar();
  }, [isOffline]);

  useEffect(() => {
    if (isOffline) {
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'EntityRadar',
          message: ' АДА  СУБ\'ЄКТІВ: Активовано автономний режим (ENTITY_RADAR_NODES). Використовується локальна база радарних виявлень.',
          severity: 'warning',
          timestamp: new Date().toISOString(),
          code: 'RADAR_OFFLINE'
        }
      }));
    }

    window.dispatchEvent(new CustomEvent('predator-error', {
      detail: {
        service: 'EntityRadar',
        message: ` АДА _МАТ ИЦЯ [${nodeSource}]:  адар суб'єктів активовано. Готовність до сканування контуру GDS.`,
        severity: 'info',
        timestamp: new Date().toISOString(),
        code: 'RADAR_SUCCESS'
      }
    }));
  }, [isOffline, nodeSource]);

  const loadRadar = async () => {
    setLoading(true);
    try {
      // @ts-ignore - handling potential dynamic API structure
      const res = api.premium?.getCompetitorRadar ? await api.premium.getCompetitorRadar() : { data: [] };
      const data = Array.isArray(res) ? res : (res?.data || []);
      setEntities(data);
      
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'EntityRadar',
          message: `СЕ ВЕ _ АДА А [${nodeSource}]: Топологію ризику для ${data.length} об'єктів успішно синхронізовано.`,
          severity: 'info',
          timestamp: new Date().toISOString(),
          code: 'RADAR_SUCCESS'
        }
      }));
    } catch (e) {
      console.error("Radar load error", e);
      setEntities([]);
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'EntityRadar',
          message: `К ИТИЧНА ПОМИЛКА СКАНУВАННЯ ВУЗЛА ENTITY_RADAR_NODES. Перевірте з'єднання з ${nodeSource}.`,
          severity: 'critical',
          timestamp: new Date().toISOString(),
          code: 'ENTITY_RADAR_NODES'
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRadar();
    setRefreshing(false);
  };

  const filteredEntities = useMemo<EntityRadarItem[]>(() => {
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
    <PageTransition>
      <div className="min-h-screen bg-[#020202] text-slate-200 relative overflow-hidden font-sans pb-40 px-4 xl:px-12">
        <AdvancedBackground />
        <CyberGrid color="rgba(212, 175, 55, 0.04)" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.03),transparent_70%)] pointer-events-none" />

        <div className="relative z-10 max-w-[1850px] mx-auto space-y-16 flex flex-col items-stretch pt-12">
          
          {/* HEADER WRAITH HUD */}
          <ViewHeader
            title={
              <div className="flex items-center gap-12">
                <div className="relative group">
                  <div className="absolute inset-0 bg-yellow-500/20 blur-[80px] rounded-full scale-150 animate-pulse" />
                  <div className="relative p-8 bg-black border-2 border-yellow-500/40 rounded-[3rem] shadow-4xl transform -rotate-3 hover:rotate-0 transition-all duration-700">
                    <Crosshair size={48} className="text-yellow-500 shadow-[0_0_30px_#d4af37]" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-6">
                    <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-5 py-1.5 text-[10px] font-black tracking-[0.4em] uppercase italic rounded-xl">
                      PREDATOR_RADAR // {isOffline ? 'MIRROR_SCAN' : 'NEURAL_ENTITY_SCANNER'}
                    </span>
                    <div className="h-px w-16 bg-yellow-500/20" />
                    <span className="text-[10px] font-black text-yellow-800 font-mono tracking-widest uppercase italic shadow-sm">v58.2-{isOffline ? 'MIRROR' : 'WRAITH'}</span>
                  </div>
                  <h1 className="text-7xl font-black text-white tracking-tighter uppercase italic skew-x-[-4deg] leading-none">
                     АДА  <span className="text-yellow-500 underline decoration-yellow-600/30 decoration-[16px] underline-offset-[16px] italic uppercase tracking-tighter">СУБ'ЄКТІВ</span>
                  </h1>
                </div>
              </div>
            }
            breadcrumbs={['INTEL', 'RECON', 'RADAR_X']}
            badges={[
              { label: 'CLASSIFIED_S1', color: 'gold', icon: <Star size={10} /> },
              { label: 'SOVEREIGN_FORCE', color: 'primary', icon: <ShieldCheck size={10} /> },
            ]}
            stats={[
              { label: 'ОБ\'ЄКТІВ_У_КОНТУ І', value: String(entities.length), icon: <Building2 />, color: 'gold' },
              { label: 'К ИТИЧНІ_ВУЗЛИ', value: String(entities.filter(e => e.cers_score > 80).length), icon: <Siren />, color: 'danger', animate: true },
              { label: 'CONFIDENCE', value: '98.8%', icon: <Zap />, color: 'success' },
              { label: 'ALPHA_SYNC', value: 'NOMINAL', icon: <Activity />, color: 'primary' },
            ]}
            actions={
              <div className="flex items-center gap-6">
                <button 
                  onClick={handleRefresh} 
                  className={cn(
                    "p-7 bg-black border-2 border-white/[0.04] rounded-[2rem] text-slate-500 hover:text-yellow-500 transition-all shadow-4xl group/btn",
                    refreshing && "animate-spin cursor-not-allowed opacity-50"
                  )}
                >
                  <RefreshCw size={32} className={cn("transition-transform duration-700", refreshing ? "" : "group-hover/btn:rotate-180")} />
                </button>
                <button className="relative px-12 py-7 h-fit group/main overflow-hidden rounded-[2.2rem]">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-yellow-500 transition-transform duration-500 group-hover/main:scale-105" />
                  <div className="relative flex items-center gap-6 text-black font-black uppercase italic tracking-[0.3em] text-[12px]">
                    <Download size={24} /> ЕКСПОРТ_ТОПОЛОГІЇ_РИЗИКУ
                  </div>
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/main:translate-x-[100%] transition-transform duration-1000" />
                </button>
              </div>
            }
          />

          {/* CONTROLS SOVEREIGN */}
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 xl:col-span-12 flex flex-col xl:flex-row gap-8 items-center bg-black/40 p-8 rounded-[3.5rem] border-2 border-white/[0.03] shadow-4xl backdrop-blur-3xl">
              <div className="flex-1 relative group w-full">
                <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-yellow-500 transition-colors" size={24} />
                <input
                  type="text"
                  placeholder="ПОШУК СЕ ЕД К ИТИЧНИХ СУБ'ЄКТІВ (ЄД ПОУ / НАЗВА)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-20 pr-10 py-7 bg-black/60 border-2 border-white/[0.04] rounded-[2.2rem] text-white placeholder-slate-800 focus:outline-none focus:border-yellow-500/50 transition-all font-black text-lg italic tracking-tight"
                />
              </div>

              <div className="flex gap-6 w-full xl:w-auto">
                <div className="relative flex-1 xl:flex-none">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="appearance-none w-full xl:w-[350px] pl-8 pr-16 py-7 bg-black/60 border-2 border-white/[0.04] rounded-[2.2rem] text-slate-400 focus:outline-none focus:border-yellow-500/30 font-black uppercase tracking-[0.2em] text-[11px] cursor-pointer italic"
                  >
                    <option value="score">СО ТУВАТИ: РІВЕНЬ CERS</option>
                    <option value="name">СО ТУВАТИ: АЛФАВІТ</option>
                    <option value="last_updated">СО ТУВАТИ: ОНОВЛЕННЯ</option>
                  </select>
                  <ChevronDown className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={20} />
                </div>

                <button className="px-10 py-7 bg-white/[0.02] border-2 border-white/[0.05] rounded-[2.2rem] text-slate-400 font-black text-[11px] uppercase tracking-[0.3em] italic hover:bg-white/[0.05] hover:text-white transition-all shadow-xl flex items-center gap-4">
                  <Filter size={18} className="text-yellow-500" /> ФІЛЬТ И
                </button>
              </div>
            </div>
          </div>

          {/* LIST WRAITH HUB */}
          <div className="space-y-12">
            {loading ? (
              <div className="py-40 flex flex-col items-center justify-center gap-10">
                <div className="relative">
                  <div className="w-[120px] h-[120px] rounded-full border-4 border-yellow-500/20 border-t-yellow-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <SearchCode className="text-yellow-500 animate-pulse" size={40} />
                  </div>
                </div>
                <p className="text-yellow-500 font-black text-[12px] animate-pulse uppercase tracking-[0.6em] italic">SYNCING_GDS_RECORDS // NEURAL_PROCESSING...</p>
              </div>
            ) : filteredEntities.length > 0 ? (
              filteredEntities.map((entity, idx) => (
                <motion.div
                  key={entity.ueid}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "group relative border-2 rounded-[4rem] overflow-hidden transition-all duration-700 backdrop-blur-4xl shadow-4xl",
                    expandedId === entity.ueid
                      ? "bg-black border-yellow-500/40"
                      : "bg-black/60 border-white/[0.03] hover:border-white/10"
                  )}
                >
                  {/* Danger Line for critical entities */}
                  {entity.cers_score > 80 && (
                    <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-amber-600 to-transparent opacity-40 animate-pulse" />
                  )}

                  <div
                    className="p-12 flex flex-col xl:flex-row items-center gap-12 cursor-pointer relative"
                    onClick={() => setExpandedId(expandedId === entity.ueid ? null : entity.ueid)}
                  >
                    {/* Visual Reactor Icon */}
                    <div className="relative w-24 h-24 shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                      <div className={cn(
                        "absolute inset-0 rounded-[2rem] border-4 rotate-45 group-hover:rotate-[225deg] transition-transform duration-1000",
                        entity.cers_score > 70 ? "bg-amber-600/5 border-amber-600/30 shadow-[0_0_30px_rgba(225,29,72,0.1)]" : "bg-yellow-500/5 border-yellow-500/30 shadow-[0_0_30px_rgba(212,175,55,0.1)]"
                      )} />
                      <div className="relative z-10 font-black font-mono text-3xl italic text-white shadow-sm">
                        {entity.name.split('"')[1]?.charAt(0) || entity.name.charAt(0)}
                      </div>
                    </div>

                    {/* Meta Data */}
                    <div className="flex-1 min-w-0 space-y-4">
                      <div className="flex items-center gap-6 flex-wrap">
                        <h3 className="text-4xl font-black text-white group-hover:text-yellow-500 transition-colors uppercase italic tracking-tighter truncate max-w-[700px]">
                          {entity.name}
                        </h3>
                        <div className="flex gap-4">
                          {entity.trend === 'increasing' && (
                            <div className="px-4 py-1.5 bg-amber-600/10 text-amber-500 border-2 border-amber-600/20 rounded-xl text-[10px] font-black uppercase italic tracking-widest flex items-center gap-2">
                              <ArrowUpRight size={14} /> РИЗИК_З ОСТАЄ
                            </div>
                          )}
                          <div className="px-4 py-1.5 bg-yellow-500/10 text-yellow-500 border-2 border-yellow-500/20 rounded-xl text-[10px] font-black uppercase italic tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" /> TARGET_LOCK
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-10 text-[12px] font-black text-slate-700 uppercase italic tracking-[0.3em]">
                        <span className="flex items-center gap-3 bg-black/40 px-5 py-2 rounded-2xl border-2 border-white/[0.04] shadow-inner">
                          <Fingerprint size={16} className="text-yellow-500" /> {entity.edrpou}
                        </span>
                        <span className="flex items-center gap-3 hover:text-slate-400 transition-colors">
                          <SectorIcon sector={entity.sector} /> {entity.sector}
                        </span>
                        <span className="text-emerald-500 bg-emerald-500/5 px-4 py-1 rounded-xl border border-emerald-500/10">CONF: {Math.floor(entity.confidence * 100)}%</span>
                      </div>
                    </div>

                    {/* Micro Charts Preview */}
                    <div className="hidden 2xl:flex items-center gap-12 px-12 border-x-2 border-white/[0.03] h-20">
                      <div className="space-y-3">
                        <p className="text-[9px] text-slate-800 font-black uppercase tracking-[0.4em] italic leading-none"> ЕПУТАЦІЯ</p>
                        <div className="w-24 h-2 bg-slate-900 rounded-full overflow-hidden p-0.5">
                          <div className="h-full bg-yellow-500 rounded-full shadow-[0_0_10px_#d4af37]" style={{ width: `${entity.radar_metrics?.reputation || 50}%` }} />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-[9px] text-slate-800 font-black uppercase tracking-[0.4em] italic leading-none">ЗВ'ЯЗКИ</p>
                        <div className="w-24 h-2 bg-slate-900 rounded-full overflow-hidden p-0.5">
                          <div className="h-full bg-amber-600 rounded-full shadow-[0_0_10px_#e11d48]" style={{ width: `${entity.radar_metrics?.connections || 50}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Score Console */}
                    <div className="flex items-center gap-10 shrink-0">
                      <SovereignBadge level={entity.cers_level} score={entity.cers_score} />
                      <div className={cn(
                        "p-4 rounded-2xl border-2 transition-all duration-700",
                        expandedId === entity.ueid ? "bg-yellow-500 border-yellow-400 text-black rotate-90" : "bg-black/40 border-white/5 text-slate-500"
                      )}>
                        <ChevronRight size={28} />
                      </div>
                    </div>
                  </div>

                  {/* EXPANDED TACTICAL OPS PANEL */}
                  <AnimatePresence>
                    {expandedId === entity.ueid && (
                      <motion.div
                        initial={{ height: 0, opacity: 0, rotateX: -10 }}
                        animate={{ height: 'auto', opacity: 1, rotateX: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="border-t-2 border-white/[0.04] bg-black/80 xl:p-16 p-8 relative overflow-hidden perspective-1000"
                      >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(212,175,55,0.03),transparent_70%)] pointer-events-none" />
                        
                        <div className="grid grid-cols-12 gap-16 relative z-10">
                          {/* Radar Scan Visual */}
                          <div className="col-span-12 xl:col-span-5 space-y-8">
                             <div className="bg-black border-2 border-white/[0.03] rounded-[4rem] p-10 relative overflow-hidden h-[450px] shadow-inset group/radar">
                                <div className="absolute top-6 left-10 flex items-center gap-4 text-yellow-500">
                                  <Radiation size={18} className="animate-spin-slow" />
                                  <span className="text-[11px] font-black uppercase tracking-[0.5em] italic">RISK_TOPOLOGY_CORE</span>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none group-hover/radar:opacity-30 transition-opacity duration-1000">
                                   <div className="w-[300px] h-[300px] border-2 border-yellow-500/20 rounded-full animate-ping" />
                                   <div className="w-[200px] h-[200px] border border-yellow-500/10 rounded-full absolute animate-[ping_3s_linear_infinite]" />
                                </div>
                                <ReactECharts
                                  option={getRadarOption(entity)}
                                  style={{ height: '100%', width: '100%' }}
                                  opts={{ renderer: 'svg' }}
                                />
                             </div>
                             <div className="p-10 rounded-[3rem] bg-yellow-500/5 border-2 border-yellow-500/10 space-y-4 shadow-4xl backdrop-blur-3xl">
                                <h4 className="text-[11px] font-black text-yellow-500 uppercase tracking-[0.5em] italic mb-6 flex items-center gap-4">
                                  <Sparkles size={16} /> ВЕ ДИКТ_PREDATOR_AI
                                </h4>
                                <p className="text-[16px] font-black text-white leading-relaxed italic border-l-8 border-yellow-500/30 pl-8 py-2">
                                  "ВУЗОЛ ВИЯВЛЕНО ЯК К ИТИЧНИЙ. ФАКТО  РИЗИКУ {entity.cers_score}% БАЗУЄТЬСЯ НА П ЯМИХ ЗВ'ЯЗКАХ ПО СЕ ВЕ НИХ ЛОГАХ ТА ОФШО НИХ П ОВІДНИКАХ.  ЕКОМЕНДОВАНО ПОВНИЙ SIGINT-АУДИТ."
                                </p>
                             </div>
                          </div>

                          {/* Risk Signals & Terminal Output */}
                          <div className="col-span-12 xl:col-span-7 space-y-12 flex flex-col justify-between">
                             <div className="space-y-10">
                                <header className="flex items-center justify-between border-b-2 border-white/[0.03] pb-8">
                                   <div className="space-y-2">
                                      <h4 className="text-[14px] font-black text-amber-600 uppercase tracking-[0.6em] italic flex items-center gap-4">
                                        <Siren size={20} className="animate-pulse" /> АКТИВНІ_ПОГ ОЗИ // ACTIVE_SIG
                                      </h4>
                                      <p className="text-[10px] text-slate-800 font-bold uppercase tracking-[0.4em] italic">ВИЯВЛЕНІ АНОМАЛІЇ У ТЕ МІНАЛІ РИЗИКУ</p>
                                   </div>
                                   <div className="p-4 bg-amber-600/10 border-2 border-amber-600/20 rounded-2xl text-amber-600 animate-pulse shadow-amber-900/40">
                                      <Shield size={24} />
                                   </div>
                                </header>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                   {(entity.risk_factors.length > 0 ? entity.risk_factors : ['ВІДСУТНІ П ЯМІ СИГНАЛИ (LOW_THREAT)']).map((f, i) => (
                                      <div key={i} className="p-8 rounded-[2.5rem] bg-white/[0.01] border-2 border-white/[0.04] hover:border-amber-600/30 transition-all group/it flex items-center gap-6 shadow-2xl">
                                         <div className="w-4 h-4 rounded-full bg-amber-600 shadow-lg shadow-amber-950/50 group-hover/it:scale-125 transition-transform" />
                                         <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-800 uppercase tracking-widest leading-none">SIGNAL_ID: 0x{Math.floor(Math.random()*999)}</p>
                                            <span className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">{f}</span>
                                         </div>
                                      </div>
                                   ))}
                                   <div className="p-8 rounded-[2.5rem] bg-yellow-500/5 border-2 border-white/[0.04] flex items-center gap-6">
                                       <div className="w-4 h-4 rounded-full bg-yellow-500 shadow-lg shadow-yellow-950/50" />
                                       <div className="space-y-1">
                                          <p className="text-[9px] font-black text-slate-800 uppercase tracking-widest leading-none">NEURAL_TAG</p>
                                          <span className="text-xl font-black text-yellow-500 italic tracking-tighter uppercase leading-none">ОФШО НА ТОПОЛОГІЯ</span>
                                       </div>
                                   </div>
                                </div>
                             </div>

                             {/* ACTION TERMINAL UI */}
                             <div className="p-12 bg-black border-4 border-white/[0.04] rounded-[3.5rem] shadow-4xl space-y-12">
                                <div className="flex items-center gap-6">
                                   <div className="p-5 bg-white/5 border-2 border-white/5 rounded-2xl text-yellow-500 shadow-sm">
                                      <Layers size={32} />
                                   </div>
                                   <div className="space-y-1">
                                      <h5 className="text-[12px] font-black text-white uppercase tracking-[0.4em] italic">КЕ УВАННЯ_ОПЕ АЦІЯМИ</h5>
                                      <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.3em] font-mono">SOVEREIGN_COMMAND_UNIT_ONLINE</p>
                                   </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                   <button className="flex flex-col items-center justify-center gap-6 p-8 bg-yellow-500 hover:bg-yellow-400 text-black rounded-[2.5rem] transition-all group/btn shadow-4xl active:scale-95 duration-500">
                                      <Download size={24} className="group-hover/btn:translate-y-1 transition-transform" />
                                      <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">ГЕНЕ УВАТИ_ДОСЬЄ</span>
                                   </button>
                                   <button className="flex flex-col items-center justify-center gap-6 p-8 bg-white/[0.02] border-2 border-white/10 text-white hover:bg-white/[0.05] rounded-[2.5rem] transition-all group/btn shadow-xl">
                                      <Eye size={24} />
                                      <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">ВІЗУАЛІЗУВАТИ_ЗВ'ЯЗКИ</span>
                                   </button>
                                   <button className="flex flex-col items-center justify-center gap-6 p-8 bg-amber-600/10 border-2 border-amber-600/20 text-amber-500 hover:bg-amber-600/20 rounded-[2.5rem] transition-all group/btn shadow-2xl">
                                      <Zap size={24} className="animate-pulse" />
                                      <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">ІЗОЛЮВАТИ_ВУЗОЛ</span>
                                   </button>
                                </div>
                             </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            ) : (
              <div className="py-40 text-center bg-black border-4 border-dashed border-white/[0.04] rounded-[5rem] backdrop-blur-3xl shadow-4xl space-y-10">
                <div className="relative mx-auto w-32 h-32">
                   <Target className="w-24 h-24 text-slate-800 mx-auto opacity-20" />
                   <div className="absolute inset-0 border-4 border-white/[0.02] rounded-full animate-ping" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-4xl font-black text-slate-700 uppercase tracking-widest italic leading-none shadow-sm">ОБ'ЄКТІВ_НЕ_ВИЯВЛЕНО</h3>
                  <p className="text-slate-900 font-black uppercase tracking-[0.4em] italic text-xs max-w-xl mx-auto opacity-60"> АДА НА СІТКА GDS ЗАЛИШАЄТЬСЯ ЧИСТОЮПРИ ДАНИХ ПА АМЕТ АХ ПОШУКУ</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CUSTOM WRAITH STYLES */}
        <style dangerouslySetInnerHTML={{ __html: `
            .shadow-4xl { box-shadow: 0 80px 150px -40px rgba(0,0,0,0.95), 0 0 100px rgba(212,175,55,0.02); }
            .shadow-inset { box-shadow: inset 0 2px 20px rgba(0,0,0,0.8), inset 0 0 100px rgba(212,175,55,0.01); }
            .backdrop-blur-4xl { backdrop-filter: blur(120px) saturate(180%); }
            .animate-spin-slow { animation: spin 15s linear infinite; }
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            .perspective-1000 { perspective: 1000px; }
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .custom-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.1); border-radius: 20px; border: 3px solid black; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212,175,55,0.2); }
        `}} />
      </div>
    </PageTransition>
  );
};

export default EntityRadarView;
