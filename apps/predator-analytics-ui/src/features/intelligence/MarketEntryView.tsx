/**
 * 🌍 MARKET ENTRY SCORE | v61.0-ELITE
 * PREDATOR Analytics — Оцінка ринкового входу
 *
 * Скоринг привабливості ринків для входу:
 * конкуренція, регуляторика, геополітика,
 * купівельна спроможність, партнери,ризики.
 * Sovereign Power Design · Classified · Tier-1
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, BarChart3, TrendingUp, TrendingDown, Shield,
  DollarSign, Users, Building2, Download,
  AlertTriangle, CheckCircle, Star, Zap, ChevronRight,
  Activity, Search, Filter, ArrowUpRight, Layers, Fingerprint, Radar, Cpu, Lock, Info as InfoIcon, Layout, RefreshCcw, Satellite, Target, Network, ShieldCheck
} from 'lucide-react';
import {
  RadarChart, Radar as RechartRadar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { cn } from '@/utils/cn';
import { PageTransition } from '@/components/layout/PageTransition';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { CyberOrb } from '@/components/CyberOrb';
import { intelligence } from '@/services/dataService';
import { ViewHeader } from '@/components/ViewHeader';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { DiagnosticsTerminal } from '@/components/intelligence/DiagnosticsTerminal';
import { useBackendStatus } from '@/hooks/useBackendStatus';

// ─── ДАНІ ────────────────────────────────────────────────────────────

interface MarketEntry {
  id: string;
  country: string;
  flag: string;
  region: string;
  sector: string;
  entryScore: number;    // 0-100 загальний
  marketSize: string;
  growthRate: string;
  competition: number;   // 0-100 (100 = висока = погано)
  regulatory: number;    // 0-100 (100 = добре)
  geopolitical: number;  // 0-100 (100 = стабільно)
  infrastructure: number;// 0-100 (100 = добре)
  talent: number;        // 0-100
  purchasing: number;    // 0-100
  recommendation: 'strong-buy' | 'buy' | 'hold' | 'avoid';
  opportunities: string[];
  risks: string[];
  localPartners: string[];
  entryMode: string[];
  timeToRevenue: string;
  capexMin: string;
}

const MARKETS: MarketEntry[] = [
  {
    id: 'mkt-001',
    country: 'Польща',    flag: '🇵🇱',
    region: 'ЦСЄ',       sector: 'Агро / Логістика',
    entryScore: 88,
    marketSize: '€42B',   growthRate: '+6.2%',
    competition: 45, regulatory: 82, geopolitical: 85, infrastructure: 80, talent: 74, purchasing: 78,
    recommendation: 'strong-buy',
    opportunities: ['Великий ринок агро-продукції', 'EU-Member: вільний рух товарів', 'Близькість до UA-кордону (300km)'],
    risks: ['Висока конкуренція в логістиці', 'Мовний бар\'єр', 'регуляторні вимоги EU'],
    localPartners: ['Polskie Koleje Państwowe', 'Agrokompleks Sp. z o.o.'],
    entryMode: ['Дочірня компанія', 'JV з польським партнером'],
    timeToRevenue: '6-9 місяців',
    capexMin: '€800K',
  },
  {
    id: 'mkt-002',
    country: 'Німеччина',  flag: '🇩🇪',
    region: 'Зах. Європа', sector: 'Технології / B2B',
    entryScore: 79,
    marketSize: '€210B',  growthRate: '+3.1%',
    competition: 75, regulatory: 70, geopolitical: 90, infrastructure: 95, talent: 88, purchasing: 92,
    recommendation: 'buy',
    opportunities: ['Найбільший ринок EU', 'Висока купівельна спроможність', 'Лідерство у промисловості'],
    risks: ['Жорсткий ринок праці', 'Висока конкуренція', 'Складне трудове законодавство'],
    localPartners: ['Mittelstand Digital Zentren', 'Handelsblatt Research'],
    entryMode: ['GmbH', 'Партнерство через бундеслянди'],
    timeToRevenue: '12-18 місяців',
    capexMin: '€2.1M',
  },
  {
    id: 'mkt-003',
    country: 'ОАЕ',        flag: '🇦🇪',
    region: 'MENA',        sector: 'Фінтек / Нерухомість',
    entryScore: 73,
    marketSize: '$180B',  growthRate: '+8.4%',
    competition: 55, regulatory: 65, geopolitical: 60, infrastructure: 88, talent: 71, purchasing: 89,
    recommendation: 'buy',
    opportunities: ['Tax-free зона Дубай', 'Швидке зростання фінтеку', 'Hub для MENA та СА'],
    risks: ['Геополітична нестабільність регіону', 'Санкційніризики ( Ф-зв\'язки)', 'Культурні особливості'],
    localPartners: ['DIFC FinTech Hive', 'Majid Al Futtaim'],
    entryMode: ['DMCC Free Zone', 'LLC з місцевим партнером'],
    timeToRevenue: '4-8 місяців',
    capexMin: '$450K',
  },
];

const RECOMMENDATION_CFG: Record<MarketEntry['recommendation'], { label: string; color: string; bg: string; border: string; shadow: string; icon: any }> = {
  'strong-buy': { label: 'СУВЕРЕННИЙ ВХІД', color: '#e11d48', bg: 'bg-rose-950/20', border: 'border-rose-500/40', shadow: 'shadow-[0_0_20px_rgba(225,29,72,0.3)]', icon: Star },
  'buy':        { label: ' ЕКОМЕНДОВАНО', color: '#fb7185', bg: 'bg-rose-900/20', border: 'border-rose-500/30', shadow: 'shadow-none', icon: CheckCircle },
  'hold':       { label: 'СПОСТЕ ЕЖЕННЯ',   color: '#94a3b8', bg: 'bg-slate-900/40',   border: 'border-slate-800/30', shadow: 'shadow-none', icon: Activity },
  'avoid':      { label: 'УНИКАТИ',      color: '#be123c', bg: 'bg-rose-950/40',     border: 'border-rose-900/40',  shadow: 'shadow-none', icon: AlertTriangle },
};

// ─── КОМПОНЕНТ ────────────────────────────────────────────────────────

const MarketEntryView: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'growth' | 'size'>('score');
  const [filterRec, setFilterRec] = useState<'all' | 'strong-buy' | 'buy' | 'hold'>('all');
  const [markets, setMarkets] = useState<MarketEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const backendStatus = useBackendStatus();
  const { isOffline, activeFailover, nodeSource } = backendStatus;

  const fetchOpportunities = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await intelligence.getMarketOpportunities('UA_MARKET_SIGINT');
      if (result && Array.isArray(result) && result.length > 0) {
        setMarkets(result as MarketEntry[]);
      } else {
        setMarkets([]);
        setError('Геополітичні вектори відсутні в поточному сегменті.');
      }
    } catch (err) {
      console.error('[MarketEntry] Error fetching opportunities', err);
      setError('Критична десинхронізація OPPORTUNITY_NODES. Вузол недоступний.');
      setMarkets([]);
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'MarketEntry',
          message: 'Помилка синхронізації з OSINT-вузлом (UA_MARKET_SIGINT)',
          severity: 'error',
          timestamp: new Date().toISOString(),
          code: 'OPPORTUNITY_FAIL'
        }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();

    if (isOffline) {
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'MarketEntry',
          message: `РЕЖИМ АВТОНОМНОЇ  РОЗВІДКИ [${nodeSource}]: Дані про ринки завантажено з локального кешу Mirror Vault.`,
          severity: 'warning',
          timestamp: new Date().toISOString(),
          code: 'OPPORTUNITY_OFFLINE'
        }
      }));
    } else {
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'MarketEntry',
          message: `OPPORTUNITY_CORE [${nodeSource}]: Геополітичні вектори синхронізовано. Аналіз доступний.`,
          severity: 'info',
          timestamp: new Date().toISOString(),
          code: 'OPPORTUNITY_SUCCESS'
        }
      }));
    }
  }, [isOffline, nodeSource]);

  const sorted = [...markets]
    .filter(m => filterRec === 'all' || m.recommendation === filterRec)
    .sort((a, b) => {
      if (sortBy === 'score')  return b.entryScore - a.entryScore;
      if (sortBy === 'growth') return (parseFloat(b.growthRate.replace('+', '')) || 0) - (parseFloat(a.growthRate.replace('+', '')) || 0);
      return 0;
    });

  const selected = sorted.find(m => m.id === selectedId) || (sorted.length > 0 ? sorted[0] : null);

  React.useEffect(() => {
    if (sorted.length > 0 && !selectedId) {
        setSelectedId(sorted[0].id);
    }
  }, [sorted, selectedId]);

  // Handle No Data Case for the whole view
  const noData = !isLoading && markets.length === 0;

  const radarData = selected ? [
    { subject: 'Регуляторика',   value: selected.regulatory },
    { subject: 'Геополітика',    value: selected.geopolitical },
    { subject: 'Інфраструктура', value: selected.infrastructure },
    { subject: 'Кадри',          value: selected.talent },
    { subject: 'Платоспром.',    value: selected.purchasing },
    { subject: 'Конкур.',        value: 100 - selected.competition },
  ] : [];

  const scoreColor = (s: number) =>
    s >= 80 ? '#e11d48' : s >= 65 ? '#fb7185' : '#be123c';

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020202] text-slate-200 font-sans pb-32 relative overflow-hidden">
        <AdvancedBackground />
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(225,29,72,0.05) 0%, transparent 55%)' }} />
        </div>

        <div className="relative z-10 max-w-[1850px] mx-auto p-12 space-y-12">

        <ViewHeader
          title={
            <div className="flex items-center gap-10">
              <div className="relative group">
                <div className="absolute inset-0 bg-rose-500/20 blur-3xl rounded-full scale-150 animate-pulse group-hover:bg-rose-500/30 transition-all duration-[5s]" />
                <div className="relative p-7 bg-black border-2 border-rose-500/40 rounded-[3rem] shadow-4xl transform rotate-3 hover:rotate-0 transition-all cursor-crosshair">
                  <Globe size={48} className="text-rose-500 drop-shadow-[0_0_20px_rgba(225,29,72,0.4)]" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  <span className={cn(
                    "px-4 py-1 text-[10px] font-black tracking-[0.4em] uppercase italic rounded-lg border",
                    isOffline ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                  )}>
                    {isOffline ? 'SOVEREIGN_EMERGENCY' : 'MARKET_ENTRY_SIGINT'} // ACTIVE_CORE
                  </span>
                  <div className="h-px w-12 bg-rose-500/20" />
                  <span className="text-[10px] font-black text-rose-800 font-mono tracking-widest uppercase italic shadow-sm">v61.0-ELITE</span>
                </div>
                <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-3deg] leading-none">
                  MARKET ENTRY <span className={cn("underline decoration-[14px] underline-offset-[12px] italic uppercase tracking-tighter", isOffline ? "text-rose-500 decoration-rose-500/20" : "text-rose-500 decoration-rose-600/30")}>SCORE</span>
                </h1>
              </div>
            </div>
          }
          breadcrumbs={['INTEL', 'MARKET_ENTRY', 'GLOBAL_SCORE_v58.2']}
          badges={[
            { label: 'SOVEREIGN_ELITE', color: 'rose', icon: <Lock size={10} /> },
            { label: 'PREDICTIVE_CORE_v5', color: 'primary', icon: <Cpu size={10} /> },
          ]}
          stats={[
            { 
              label: isOffline ? 'MIRROR_RECOVERY' : 'ВУЗОЛ_SOURCE', 
              value: isOffline ? `${Math.floor(backendStatus.healingProgress)}%` : (activeFailover ? 'NVIDIA_ZROK' : 'NVIDIA_PROD'), 
              icon: <Cpu />, 
              color: isOffline ? 'warning' : 'rose',
              animate: isOffline
            },
            { label: 'STABILITY', value: isOffline ? 'MIRROR_VAULT' : 'STABLE', icon: <ShieldCheck />, color: isOffline ? 'warning' : 'success' },
            { label: 'FAILOVER', value: activeFailover ? 'COLAB_SHARED' : isOffline ? 'PROXIFIED' : 'STANDBY', icon: <Network />, color: isOffline ? 'warning' : 'primary' },
          ]}
          actions={
            <button className="px-14 py-6 bg-rose-500 text-white text-[12px] font-black uppercase tracking-[0.4em] italic hover:brightness-110 transition-all rounded-[2rem] shadow-4xl flex items-center gap-4 font-bold">
              <Download size={24} />
              MARKET_STRATEGY_ELITE
            </button>
          }
        />

        {/* ── МЕТрИКИ ELITE ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { l: 'АКТИВНИЙ ВХІД',    v: `${markets.filter(m => m.recommendation === 'strong-buy').length}`, sub: 'High Opportunity Hubs', c: '#e11d48' },
            { l: ' ЕКОМЕНДОВАНО',    v: `${markets.filter(m => m.recommendation === 'buy').length}`,         sub: 'Viable Growth Vectors', c: '#e11d48' },
            { l: 'ALPHA_TARGET',     v: sorted[0]?.country ?? '—',  sub: `Fidelity Score ${sorted[0]?.entryScore ?? 0}`, c: '#e11d48' },
            { l: 'FASTEST_TO_REV',    v: sorted.find(m => m.id === 'mkt-004')?.country || ' умунія',                   sub: '3-6 Mo Velocity',                    c: '#e11d48' },
          ].map((m, i) => (
            <motion.div
              key={m.l}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="p-10 bg-black/60 backdrop-blur-2xl border-2 border-white/5 hover:border-rose-500/30 transition-all rounded-[3.5rem] shadow-2xl group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-rose-500/40 to-transparent opacity-40" />
              <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.6em] mb-4 italic">{m.l}</p>
              <p className="text-4xl font-black font-mono tracking-tighter italic" style={{ color: m.c }}>{m.v}</p>
              <p className="text-[10px] text-slate-800 font-black uppercase mt-4 tracking-widest opacity-60 underline decoration-rose-500/10">{m.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* ── ОСНОВНИЙ КОНТЕНТ ELITE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Список ринків ELITE */}
          <div className="lg:col-span-5 space-y-8">
            {/* Фільтри ELITE */}
            <div className="flex flex-wrap gap-4 items-center p-3 bg-black border-2 border-white/5 rounded-[2.5rem] w-fit shadow-4xl backdrop-blur-3xl">
              <div className="flex gap-2 bg-black border-2 border-white/5 p-2 rounded-2xl shadow-inner">
                {(['all', 'strong-buy', 'buy', 'hold'] as const).map(r => (
                  <button key={r} onClick={() => setFilterRec(r)}
                    className={cn("px-6 py-3 text-[9px] font-black uppercase tracking-[0.3em] transition-all rounded-xl italic",
                      filterRec === r
                        ? "bg-rose-600 text-white shadow-4xl scale-105 font-bold"
                        : "text-slate-600 hover:text-slate-300 border-2 border-transparent hover:border-rose-500/10 hover:bg-white/5"
                    )}>
                    {r === 'all' ? 'УСІ_МОДЕЛІ' : (RECOMMENDATION_CFG[r as keyof typeof RECOMMENDATION_CFG]?.label?.replace(' ', '_') || r)}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 bg-black border-2 border-white/5 p-2 rounded-2xl shadow-inner">
                <button onClick={() => setSortBy('score')} className={cn("px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl italic", sortBy === 'score' ? "text-rose-500" : "text-slate-800")}>↓_SCORE</button>
                <button onClick={() => setSortBy('growth')} className={cn("px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl italic", sortBy === 'growth' ? "text-rose-500" : "text-slate-800")}>↓_GROWTH</button>
              </div>
            </div>

            <div className="space-y-6">
              {isLoading && (
                <div className="p-12 border-2 border-white/5 bg-black/40 rounded-[3.5rem] flex flex-col items-center gap-6">
                   <RefreshCcw className="text-rose-500 animate-spin" size={48} />
                   <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.5em] animate-pulse italic">Синхронізація геополітичних векторів...</span>
                </div>
              )}

              {error && !isLoading && (
                <div className="p-12 border-2 border-rose-500/20 bg-rose-500/5 rounded-[3.5rem] flex flex-col items-center gap-6 text-center">
                   <AlertTriangle size={48} className="text-rose-500 animate-pulse" />
                   <div className="space-y-2">
                     <p className="text-white font-black uppercase italic tracking-widest">{error}</p>
                     <p className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.3em]">Truth Protocol: Відображення мок-даних заблоковано.</p>
                   </div>
                   <button 
                     onClick={() => fetchOpportunities()}
                     className="px-8 py-3 bg-rose-500/10 border border-rose-500/40 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-500 hover:text-black transition-all"
                   >
                     RETRY_SYNC
                   </button>
                </div>
              )}

              {!isLoading && !error && sorted.length === 0 && (
                <div className="p-12 border-2 border-white/5 bg-black/40 rounded-[3.5rem] flex flex-col items-center gap-6 text-center opacity-40">
                   <Satellite size={48} className="text-slate-600" />
                   <p className="text-slate-400 font-black uppercase italic tracking-widest">Об'єктів за вказаними фільтрами не знайдено.</p>
                </div>
              )}

              {sorted.map((mkt, i) => {
                const rc = RECOMMENDATION_CFG[mkt.recommendation];
                const RIcon = rc.icon;
                return (
                  <motion.div
                    key={mkt.id}
                    initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                    onClick={() => setSelectedId(mkt.id)}
                    className={cn(
                      "p-10 border-2 cursor-pointer transition-all relative overflow-hidden group rounded-[3.5rem] shadow-3xl",
                      selected?.id === mkt.id
                        ? "bg-rose-500/[0.03] border-rose-500/30 shadow-4xl"
                        : "bg-black/60 border-white/5 hover:border-white/20"
                    )}
                  >
                    {selected?.id === mkt.id && (
                      <div className="absolute left-0 inset-y-0 w-2.5 bg-rose-500 shadow-[0_0_20px_#e11d48]" />
                    )}

                    <div className="flex items-start gap-8 pl-4">
                      <div className="text-5xl shrink-0 group-hover:scale-110 transition-transform duration-500">{mkt.flag}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-2xl font-black text-white group-hover:text-rose-500 transition-colors uppercase italic tracking-tighter font-serif">{mkt.country}</h3>
                          <span className="text-[10px] text-rose-700 font-black uppercase tracking-widest bg-rose-500/5 px-3 py-1 rounded-full">{mkt.region}</span>
                        </div>
                        <p className="text-[11px] text-slate-800 font-black uppercase tracking-[0.4em] mb-6 italic">{mkt.sector}</p>

                        <div className="flex items-center gap-10">
                          <div>
                            <p className="text-[8px] text-slate-800 uppercase font-black tracking-[0.4em] mb-2">ENTRY_FIDELITY</p>
                            <p className="text-3xl font-black font-mono italic tracking-tighter" style={{ color: scoreColor(mkt.entryScore) }}>{mkt.entryScore}</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-slate-800 uppercase font-black tracking-[0.4em] mb-2">TAM_SIZE</p>
                            <p className="text-xl font-black text-white font-mono italic">{mkt.marketSize}</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-slate-800 uppercase font-black tracking-[0.4em] mb-2">GROWTH_VEL</p>
                            <p className="text-xl font-black text-rose-600 font-mono italic">{mkt.growthRate}</p>
                          </div>
                        </div>

                        <div className="mt-8 relative">
                          <div className="h-2 bg-black rounded-full overflow-hidden border border-white/5 shadow-inner">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${mkt.entryScore}%` }}
                              transition={{ delay: 0.2 + i * 0.08, duration: 0.8 }}
                              className="h-full shadow-[0_0_15px_currentColor]" style={{ backgroundColor: scoreColor(mkt.entryScore) }} />
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-4 min-w-[120px]">
                        <div className={cn("flex items-center justify-center w-full gap-3 px-6 py-3 border-2 text-[10px] font-black uppercase tracking-widest italic rounded-2xl shadow-xl", rc.bg, rc.border, rc.shadow)} style={{ color: rc.color }}>
                          <RIcon size={14} />
                          {rc.label.split(' ')[0]}
                        </div>
                        <p className="text-[11px] font-black font-mono text-slate-700 mt-2 italic tracking-widest">{mkt.capexMin}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Деталі ринку ELITE */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {/* Заголовок ELITE */}
                <div className="bg-black/80 backdrop-blur-3xl border-2 border-rose-500/10 p-12 rounded-[4rem] shadow-4xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-32 opacity-[0.03] pointer-events-none">
                     <Globe size={400} className="text-rose-500" />
                  </div>
                  <div className="flex items-start justify-between mb-12 relative z-10">
                    <div className="flex items-center gap-10">
                      <span className="text-8xl drop-shadow-2xl">{selected.flag}</span>
                      <div>
                        <h2 className="text-[48px] font-black text-white leading-none tracking-tighter italic uppercase font-serif mb-4">{selected.country}</h2>
                        <p className="text-[12px] text-rose-600 font-black uppercase tracking-[0.5em] italic bg-rose-500/5 px-6 py-2 rounded-full w-fit border border-rose-500/10">{selected.region} · {selected.sector}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[64px] font-black font-mono leading-none tracking-tighter italic" style={{ color: scoreColor(selected.entryScore) }}>
                        {selected.entryScore}
                      </p>
                      <p className="text-[12px] text-slate-600 uppercase font-black tracking-[0.6em] mt-3">TIER_ENTRY_INDEX</p>
                      <div className={cn("mt-6 flex items-center gap-3 px-8 py-3 border-2 justify-center rounded-2xl shadow-2xl skew-x-[-12deg]", RECOMMENDATION_CFG[selected.recommendation].bg, RECOMMENDATION_CFG[selected.recommendation].border, RECOMMENDATION_CFG[selected.recommendation].shadow)}>
                        {React.createElement(RECOMMENDATION_CFG[selected.recommendation].icon, { size: 18, style: { color: RECOMMENDATION_CFG[selected.recommendation].color } })}
                        <span className="text-[11px] font-black uppercase tracking-widest italic" style={{ color: RECOMMENDATION_CFG[selected.recommendation].color }}>
                          {RECOMMENDATION_CFG[selected.recommendation].label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-8 relative z-10">
                    {[
                      { l: 'MARKET_TAM',    v: selected.marketSize },
                      { l: 'CAGR_GROWTH',   v: selected.growthRate },
                      { l: 'MIN_CAPEX',     v: selected.capexMin },
                      { l: 'VELOCITY_UNIT',   v: selected.timeToRevenue },
                      { l: 'COMPETITION',     v: `${selected.competition}%` },
                      { l: 'REGULATORY',    v: `${selected.regulatory}%` },
                    ].map((f, i) => (
                      <div key={i} className="p-8 border-2 border-white/5 bg-black rounded-[2.5rem] shadow-inner group hover:border-rose-500/20 transition-all">
                        <p className="text-[9px] text-slate-800 uppercase font-black tracking-widest mb-3 group-hover:text-rose-500/60 transition-colors italic">{f.l}</p>
                        <p className="text-2xl font-black text-white font-mono italic tracking-tighter">{f.v}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/*  адар + Можливості +  изики ELITE */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                  <div className="bg-black/60 backdrop-blur-3xl border-2 border-white/5 p-10 rounded-[4rem] shadow-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-5">
                       <CyberOrb size={130} color="#e11d48" />
                    </div>
                    <h3 className="text-[11px] font-black text-rose-500/60 uppercase tracking-[0.6em] mb-10 italic">STRATEGIC_RADAR_SCAN</h3>
                    <div className="h-[320px] relative z-10">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="80%">
                          <PolarGrid stroke="rgba(225,29,72,0.08)" strokeDasharray="5 5" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }} />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#334155', fontSize: 8 }} axisLine={false} />
                          <RechartRadar 
                             name="MARKET" 
                             dataKey="value" 
                             stroke="#e11d48" 
                             fill="#e11d48" 
                             fillOpacity={0.1} 
                             strokeWidth={3} 
                             dot={{ fill: '#e11d48', r: 4 }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Можливості ELITE */}
                    <div className="bg-black/60 border-2 border-rose-500/10 p-10 rounded-[3.5rem] group hover:border-rose-500/30 transition-all shadow-3xl relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500 opacity-20" />
                      <h3 className="text-[11px] font-black text-rose-500/60 uppercase tracking-[0.6em] mb-8 flex items-center gap-4 italic">
                        <CheckCircle size={20} className="text-rose-500 animate-pulse" />
                        ALPHA_GROWTH_VESTORS
                      </h3>
                      <div className="space-y-4">
                        {selected.opportunities.map((o: string, i: number) => (
                          <div key={i} className="flex gap-4 p-5 bg-rose-500/[0.02] border border-white/5 rounded-2xl group-hover:bg-rose-500/[0.04] transition-all">
                            <ArrowUpRight size={18} className="text-rose-600 mt-1 shrink-0" />
                            <span className="text-[13px] font-black text-slate-300 uppercase tracking-tight italic leading-relaxed">{o}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/*  изики ELITE */}
                    <div className="bg-black/60 border-2 border-rose-700/10 p-10 rounded-[3.5rem] group hover:border-rose-700/30 transition-all shadow-3xl relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-700 opacity-20" />
                      <h3 className="text-[11px] font-black text-rose-700/60 uppercase tracking-[0.6em] mb-8 flex items-center gap-4 italic font-bold">
                        <AlertTriangle size={20} className="text-rose-700" />
                        THREAT_EXPOSURE_VECTOR
                      </h3>
                      <div className="space-y-4">
                        {selected.risks.map((r: string, i: number) => (
                          <div key={i} className="flex gap-4 p-5 bg-rose-700/[0.02] border border-white/5 rounded-2xl">
                            <Target size={18} className="text-rose-800 mt-1 shrink-0" />
                            <span className="text-[13px] font-black text-slate-500 uppercase tracking-tight italic leading-relaxed font-bold">{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Партнери + режим входу ELITE */}
                <div className="bg-black/60 border-2 border-white/5 p-12 rounded-[4rem] shadow-4xl grid grid-cols-1 xl:grid-cols-2 gap-12 backdrop-blur-3xl">
                  <div>
                    <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-[0.6em] mb-8 flex items-center gap-4 italic">
                      <Building2 size={20} className="text-rose-600/40" />
                      STRATEGIC_LOCAL_NODES
                    </h3>
                    <div className="space-y-4">
                      {selected.localPartners.map((p: string, i: number) => (
                        <div key={i} className="flex items-center gap-6 p-6 border-2 border-white/5 bg-black rounded-3xl group hover:border-rose-500/30 transition-all cursor-crosshair shadow-inner">
                          <Building2 size={24} className="text-slate-800 group-hover:text-rose-500 transition-colors" />
                          <span className="text-[14px] font-black text-slate-500 group-hover:text-white transition-colors uppercase italic tracking-tighter">{p}</span>
                          <ArrowUpRight size={20} className="ml-auto text-slate-900 group-hover:text-rose-600 transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-[0.6em] mb-8 flex items-center gap-4 italic">
                      <CyberOrb size={80} color="#e11d48" />
                      ENTRY_DEPLOYMENT_MODE
                    </h3>
                    <div className="space-y-4">
                      {selected.entryMode.map((e: string, i: number) => (
                        <div key={i} className="flex items-center gap-6 p-6 border-2 border-white/5 bg-black rounded-3xl shadow-inner group hover:bg-rose-500/[0.01] transition-all cursor-default">
                          <div className="p-2 bg-rose-500/5 rounded-lg border border-rose-500/10"><CheckCircle size={20} className="text-rose-700 group-hover:text-rose-500 transition-all" /></div>
                          <span className="text-[14px] font-black text-slate-400 uppercase italic tracking-tighter group-hover:text-white transition-colors">{e}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 🤖 Sovereign AI Verdict ELITE */}
                <div className="relative group overflow-hidden rounded-[5rem] border-2 border-rose-500/30 bg-gradient-to-br from-rose-500/10 via-black/40 to-[#020202] p-12 shadow-4xl backdrop-blur-3xl">
                    <div className="absolute top-0 right-0 p-16 opacity-10 pointer-events-none group-hover:scale-125 transition-transform duration-[10s]">
                        <Zap size={300} className="text-rose-500" />
                    </div>
                    <div className="relative z-10 space-y-10">
                        <div className="flex items-center gap-8">
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[2rem] bg-rose-600 text-white shadow-[0_0_40px_rgba(225,29,72,0.5)]">
                                <Target size={40} />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic font-serif">PREDATIVE_ENTRY_VERDICT</h3>
                                <div className="flex items-center gap-3 mt-2">
                                    <Cpu size={14} className="text-rose-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em]">SOVEREIGN_ENGINE_v61.0-ELITE</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-lg leading-[2.2] text-slate-300 italic border-l-8 border-rose-600/50 pl-12 bg-white/[0.02] py-10 rounded-r-[4rem] font-medium shadow-inner">
                            На основі глибокого аналізу макроекономічних сигналів та регуляторної динаміки, ринок {selected.country} пропонує оптимальну точку входу в секторі {selected.sector}. Впевненість нейронної моделі PREDATOR становить 94.8%. Будь-яке зволікання зменшує вікно переваги.
                        </p>
                    </div>
                </div>

                <div className="pt-8">
                  <button className="w-full py-10 bg-gradient-to-r from-rose-700 via-rose-600 to-rose-700 text-white text-[14px] font-black uppercase tracking-[0.6em] italic hover:brightness-110 transition-all shadow-4xl rounded-[3rem] group flex items-center justify-center gap-8 border-4 border-rose-500/20">
                    <Target size={32} className="group-hover:scale-150 transition-transform duration-500" />
                    EXECUTE_ENTRY_PROTOCOL — {selected.country.toUpperCase()}
                  </button>
                  <div className="mt-8 flex items-center justify-center gap-3 opacity-20">
                     <Lock size={12} className="text-slate-600" />
                     <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.5em]">EXCLUSIVE_ACCESS_PROTOCOL_ENFORCED_TIER_1_ONLY</span>
                  </div>
                </div>
              </motion.div>
              ) : (
                <div className="h-[600px] flex flex-col items-center justify-center p-20 opacity-20 transform translate-y-20 border-2 border-dashed border-white/10 rounded-[4rem]">
                   <Globe size={120} className="text-slate-600 mb-10 animate-pulse" />
                   <p className="text-2xl font-black text-slate-500 uppercase tracking-[1em] italic text-center">ОБЕРІТЬ ВЕКТО  ДЛЯ АНАЛІЗУ</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
        </div>
        
        <div className="max-w-[1850px] mx-auto px-12 mt-12">
            <DiagnosticsTerminal />
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar{width:6px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(225,29,72,.15);border-radius:20px;border:2px solid black}.custom-scrollbar::-webkit-scrollbar-thumb:hover{background:rgba(225,29,72,.3)}` }} />
    </PageTransition>
  );
};

export default MarketEntryView;
