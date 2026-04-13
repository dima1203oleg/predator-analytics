/**
 * 🌍 MARKET ENTRY SCORE | v56.4
 * PREDATOR Analytics — Оцінка ринкового входу
 *
 * Скоринг привабливості ринків для входу:
 * конкуренція, регуляторика, геополітика,
 * купівельна спроможність, партнери, ризики.
 * Sovereign Power Design · Classified · Tier-1
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, BarChart3, TrendingUp, TrendingDown, Shield,
  DollarSign, Users, Building2, Target, Download,
  AlertTriangle, CheckCircle, Star, Zap, ChevronRight,
  Activity, Search, Filter, ArrowUpRight, Layers
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/components/layout/PageTransition';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { CyberOrb } from '@/components/CyberOrb';
import { TacticalCard } from '@/components/TacticalCard';
import { apiClient } from '@/services/api/config';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

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
    risks: ['Висока конкуренція в логістиці', 'Мовний бар\'єр', 'Регуляторні вимоги EU'],
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
    risks: ['Геополітична нестабільність регіону', 'Санкційні ризики (РФ-зв\'язки)', 'Культурні особливості'],
    localPartners: ['DIFC FinTech Hive', 'Majid Al Futtaim'],
    entryMode: ['DMCC Free Zone', 'LLC з місцевим партнером'],
    timeToRevenue: '4-8 місяців',
    capexMin: '$450K',
  },
  {
    id: 'mkt-004',
    country: 'Румунія',    flag: '🇷🇴',
    region: 'ЦСЄ',       sector: 'IT / Аутсорсинг',
    entryScore: 82,
    marketSize: '€18B',   growthRate: '+11.2%',
    competition: 35, regulatory: 72, geopolitical: 78, infrastructure: 66, talent: 82, purchasing: 61,
    recommendation: 'strong-buy',
    opportunities: ['Низькі витрати на персонал', 'IT-talent пул (120K розробників)', 'EU-Member зони стимулювання'],
    risks: ['Бюрократія', 'Корупційні ризики', 'Відтік кадрів до ZА'],
    localPartners: ['Techsylvania', 'Romanian Business Leaders'],
    entryMode: ['SRL', 'Представництво'],
    timeToRevenue: '3-6 місяців',
    capexMin: '€120K',
  },
  {
    id: 'mkt-005',
    country: 'Казахстан',  flag: '🇰🇿',
    region: 'ЦА',         sector: 'Сировина / Агро',
    entryScore: 61,
    marketSize: '$28B',   growthRate: '+4.7%',
    competition: 28, regulatory: 48, geopolitical: 45, infrastructure: 55, talent: 58, purchasing: 52,
    recommendation: 'hold',
    opportunities: ['Низька конкуренція', 'Доступ до ЦА ринку', 'Зернові коридори через КЗ'],
    risks: ['Геополітична залежність від РФ', 'Слабкий інститут власності', 'Ризик санкційного contagion'],
    localPartners: ['Казмунайгаз', 'Băighe Grain'],
    entryMode: ['ТОВ за законом КЗ', 'Agentska угода'],
    timeToRevenue: '12-24 місяці',
    capexMin: '$280K',
  },
];

const RADAR_DIMENSIONS = [
  'Регуляторика', 'Геополітика', 'Інфраструктура', 'Кадри', 'Купівля', 'Ринок'
];

const RECOMMENDATION_CFG = {
  'strong-buy': { label: 'АКТИВНИЙ ВХІД', color: '#f59e0b', bg: 'bg-amber-950/20', border: 'border-amber-500/40', shadow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]', icon: Star },
  'buy':        { label: 'РЕКОМЕНДОВАНО', color: '#10b981', bg: 'bg-emerald-950/20', border: 'border-emerald-800/30', shadow: 'shadow-none', icon: CheckCircle },
  'hold':       { label: 'МОНІТОРИНГ',   color: '#94a3b8', bg: 'bg-slate-900/40',   border: 'border-slate-800/30', shadow: 'shadow-none', icon: Activity },
  'avoid':      { label: 'УНИКАТИ',      color: '#ef4444', bg: 'bg-red-950/20',     border: 'border-red-900/30',  shadow: 'shadow-none', icon: AlertTriangle },
};

// ─── КОМПОНЕНТ ────────────────────────────────────────────────────────

const MarketEntryView: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'growth' | 'size'>('score');
  const [filterRec, setFilterRec] = useState<'all' | 'strong-buy' | 'buy' | 'hold'>('all');

  const { data: markets = [], isLoading } = useQuery({
    queryKey: ['market-entry-scores'],
    queryFn: async () => {
      const res = await apiClient.get('/market/entry-scores');
      return Array.isArray(res.data) ? res.data : [];
    }
  });

  const sorted = [...markets]
    .filter((m: any) => filterRec === 'all' || m.recommendation === filterRec)
    .sort((a: any, b: any) => {
      if (sortBy === 'score')  return b.entryScore - a.entryScore;
      if (sortBy === 'growth') return parseFloat(b.growthRate) - parseFloat(a.growthRate);
      return 0;
    });

  const selected = sorted.find((m: any) => m.id === selectedId) || sorted[0];

  React.useEffect(() => {
    if (sorted.length > 0 && !selectedId) {
        setSelectedId(sorted[0].id);
    }
  }, [sorted, selectedId]);

  const radarData = [
    { subject: 'Регуляторика',   value: selected.regulatory },
    { subject: 'Геополітика',    value: selected.geopolitical },
    { subject: 'Інфраструктура', value: selected.infrastructure },
    { subject: 'Кадри',          value: selected.talent },
    { subject: 'Платоспром.',    value: selected.purchasing },
    { subject: 'Конкур.',        value: 100 - selected.competition },
  ];

  const sorted = [...MARKETS]
    .filter(m => filterRec === 'all' || m.recommendation === filterRec)
    .sort((a, b) => {
      if (sortBy === 'score')  return b.entryScore - a.entryScore;
      if (sortBy === 'growth') return parseFloat(b.growthRate) - parseFloat(a.growthRate);
      return 0;
    });

  const scoreColor = (s: number) =>
    s >= 80 ? '#10b981' : s >= 65 ? '#f59e0b' : '#ef4444';

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020617] text-slate-200 font-sans pb-24 relative overflow-hidden">
        <AdvancedBackground />
        <CyberGrid color="rgba(16, 185, 129, 0.03)" />

        <div className="relative z-10 max-w-[1800px] mx-auto p-6 sm:p-12 space-y-8">

        {/* ── ЗАГОЛОВОК ── */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-700/15 blur-2xl rounded-full" />
              <div className="relative p-5 bg-black border border-emerald-900/50">
                <Globe size={38} className="text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-600 rounded-full animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="w-1 h-1 bg-emerald-600 rounded-full animate-pulse" />
                <span className="text-[8px] font-black text-emerald-700/70 uppercase tracking-[0.5em]">
                  MARKET ENTRY · INTELLIGENCE · GROWTH · v56.4
                </span>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
                MARKET ENTRY{' '}
                <span className="text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.35)]">SCORE</span>
              </h1>
              <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.3em] mt-1">
                СКОРИНГ РИНКІВ · КОНКУРЕНЦІЯ · РЕГУЛЯТОРИКА · РЕКОМЕНДАЦІЇ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-5 py-3 bg-black border border-emerald-900/30 flex items-center gap-3">
              <TrendingUp size={15} className="text-emerald-600" />
              <div>
                <p className="text-[7px] text-slate-700 uppercase font-black">Ринків проаналізовано</p>
                <p className="text-[14px] font-black text-emerald-400 font-mono">{markets.length} АКТИВНИХ</p>
              </div>
            </div>
            <button className="px-8 py-3 bg-emerald-700 text-white text-[9px] font-black uppercase tracking-wider hover:bg-emerald-600 transition-colors border border-emerald-500/30 flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Download size={13} />
              MARKET BRIEF PDF
            </button>
          </div>
        </div>

        {/* ── МЕТРИКИ ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { l: 'АКТИВНИЙ ВХІД',    v: `${markets.filter((m: any) => m.recommendation === 'strong-buy').length}`, sub: 'Ринків', c: '#f59e0b' },
            { l: 'РЕКОМЕНДОВАНО',    v: `${markets.filter((m: any) => m.recommendation === 'buy').length}`,         sub: 'Ринків', c: '#10b981' },
            { l: 'КРАЩИЙ РИНОК',     v: sorted[0]?.country ?? '—',  sub: `Score ${sorted[0]?.entryScore ?? 0}`, c: '#10b981' },
            { l: 'ШВИДКИЙ СТАРТ',    v: sorted.find((m:any)=>m.id==='mkt-004')?.country || 'Румунія',                   sub: '3-6 місяців',                    c: '#f59e0b' },
          ].map((m, i) => (
            <motion.div
              key={m.l}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="p-7 bg-black border border-slate-800/50 hover:border-slate-700/60 transition-all"
            >
              <p className="text-[7px] font-black text-slate-700 uppercase tracking-[0.4em] mb-2">{m.l}</p>
              <p className="text-[22px] font-black font-mono" style={{ color: m.c }}>{m.v}</p>
              <p className="text-[8px] text-slate-700 font-black uppercase mt-1">{m.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* ── ОСНОВНИЙ КОНТЕНТ ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Список ринків */}
          <div className="lg:col-span-5 space-y-4">
            {/* Фільтри */}
            <div className="flex flex-wrap gap-2">
              <div className="flex gap-1 p-1 bg-black border border-slate-800/50">
                {(['all', 'strong-buy', 'buy', 'hold'] as const).map(r => (
                  <button key={r} onClick={() => setFilterRec(r)}
                    className={cn("px-3 py-1.5 text-[7px] font-black uppercase tracking-wider transition-all",
                      filterRec === r
                        ? r === 'all' ? "bg-slate-800 text-white"
                          : r === 'strong-buy' ? "bg-emerald-800/60 text-emerald-300"
                          : r === 'buy' ? "bg-emerald-900/40 text-emerald-400"
                          : "bg-amber-900/30 text-amber-400"
                        : "text-slate-600 hover:text-slate-300"
                    )}>
                    {r === 'all' ? 'УСІ' : RECOMMENDATION_CFG[r].label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 p-1 bg-black border border-slate-800/50">
                <button onClick={() => setSortBy('score')} className={cn("px-3 py-1.5 text-[7px] font-black uppercase", sortBy === 'score' ? "bg-emerald-800/40 text-emerald-300" : "text-slate-600")}>↓ СКОР</button>
                <button onClick={() => setSortBy('growth')} className={cn("px-3 py-1.5 text-[7px] font-black uppercase", sortBy === 'growth' ? "bg-emerald-800/40 text-emerald-300" : "text-slate-600")}>↓ ЗРОСТАННЯ</button>
              </div>
            </div>

            {sorted.map((mkt, i) => {
              const rc = RECOMMENDATION_CFG[mkt.recommendation];
              const RIcon = rc.icon;
              return (
                <motion.div
                  key={mkt.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  onClick={() => setSelectedId(mkt.id)}
                  className={cn(
                    "p-6 border cursor-pointer transition-all relative overflow-hidden group",
                    selected?.id === mkt.id
                      ? "bg-emerald-950/10 border-emerald-800/50"
                      : "bg-black border-slate-800/40 hover:border-slate-700/60"
                  )}
                >
                  {selected?.id === mkt.id && (
                    <div className="absolute left-0 inset-y-0 w-0.5 bg-emerald-600 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                  )}

                  <div className="flex items-start gap-5 pl-3">
                    <div className="text-3xl shrink-0">{mkt.flag}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[14px] font-black text-white group-hover:text-emerald-300 transition-colors">{mkt.country}</h3>
                        <span className="text-[7px] text-slate-600 font-black uppercase">{mkt.region}</span>
                      </div>
                      <p className="text-[9px] text-slate-600 mb-3">{mkt.sector}</p>

                      <div className="flex items-center gap-5">
                        <div>
                          <p className="text-[7px] text-slate-700 uppercase">Entry Score</p>
                          <p className="text-[18px] font-black font-mono" style={{ color: scoreColor(mkt.entryScore) }}>{mkt.entryScore}</p>
                        </div>
                        <div>
                          <p className="text-[7px] text-slate-700 uppercase">Ринок</p>
                          <p className="text-[12px] font-black text-white font-mono">{mkt.marketSize}</p>
                        </div>
                        <div>
                          <p className="text-[7px] text-slate-700 uppercase">Зростання</p>
                          <p className="text-[12px] font-black text-emerald-400 font-mono">{mkt.growthRate}</p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="h-1 bg-slate-900">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${mkt.entryScore}%` }}
                            transition={{ delay: 0.2 + i * 0.06, duration: 0.6 }}
                            className="h-full" style={{ backgroundColor: scoreColor(mkt.entryScore) }} />
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <div className={cn("flex items-center gap-1 px-2.5 py-1.5 border text-[7px] font-black uppercase", rc.bg, rc.border, rc.shadow)} style={{ color: rc.color }}>
                        <RIcon size={10} />
                        {rc.label}
                      </div>
                      <p className="text-[8px] font-mono text-slate-600 mt-2 text-right">{mkt.capexMin}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Деталі ринку */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="lg:col-span-7 space-y-5"
            >
              {/* Заголовок */}
              <div className="bg-black border border-emerald-900/30 p-7">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <span className="text-5xl">{selected.flag}</span>
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase">{selected.country}</h2>
                      <p className="text-[10px] text-slate-600 mt-0.5">{selected.region} · {selected.sector}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[40px] font-black font-mono leading-none" style={{ color: scoreColor(selected.entryScore) }}>
                      {selected.entryScore}
                    </p>
                    <p className="text-[8px] text-slate-600 uppercase font-black">ENTRY SCORE / 100</p>
                    <div className={cn("mt-2 flex items-center gap-1.5 px-3 py-1.5 border justify-end", RECOMMENDATION_CFG[selected.recommendation].bg, RECOMMENDATION_CFG[selected.recommendation].border, RECOMMENDATION_CFG[selected.recommendation].shadow)}>
                      {React.createElement(RECOMMENDATION_CFG[selected.recommendation].icon, { size: 11, style: { color: RECOMMENDATION_CFG[selected.recommendation].color } })}
                      <span className="text-[8px] font-black uppercase" style={{ color: RECOMMENDATION_CFG[selected.recommendation].color }}>
                        {RECOMMENDATION_CFG[selected.recommendation].label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { l: 'Розмір ринку',    v: selected.marketSize },
                    { l: 'Зростання/рік',   v: selected.growthRate },
                    { l: 'Мін. інвестиція', v: selected.capexMin },
                    { l: 'Час до доходу',   v: selected.timeToRevenue },
                    { l: 'Конкуренція',     v: `${selected.competition}%` },
                    { l: 'Регуляторика',    v: `${selected.regulatory}%` },
                  ].map((f, i) => (
                    <div key={i} className="p-4 border border-slate-800/40 bg-slate-950/30 text-center">
                      <p className="text-[7px] text-slate-700 uppercase font-black">{f.l}</p>
                      <p className="text-[13px] font-black text-white font-mono mt-1">{f.v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Радар + Можливості + Ризики */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-black border border-slate-800/50 p-6">
                  <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.45em] mb-4">ПРОФІЛЬ РИНКУ</h3>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                        <PolarGrid stroke="rgba(255,255,255,0.06)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 8, fontWeight: 'bold' }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#374151', fontSize: 7 }} axisLine={false} />
                        <Radar name="Ринок" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={1.5} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Можливості */}
                  <div className="bg-black border border-emerald-900/25 p-5">
                    <h3 className="text-[8px] font-black text-emerald-700 uppercase tracking-[0.4em] mb-3 flex items-center gap-2">
                      <CheckCircle size={12} className="text-emerald-600" />
                      МОЖЛИВОСТІ
                    </h3>
                    {selected.opportunities.map((o, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <ArrowUpRight size={12} className="text-emerald-700 mt-0.5 shrink-0" />
                        <span className="text-[10px] font-black text-slate-400">{o}</span>
                      </div>
                    ))}
                  </div>

                  {/* Ризики */}
                  <div className="bg-black border border-red-900/20 p-5">
                    <h3 className="text-[8px] font-black text-red-800 uppercase tracking-[0.4em] mb-3 flex items-center gap-2">
                      <AlertTriangle size={12} className="text-red-700" />
                      РИЗИКИ
                    </h3>
                    {selected.risks.map((r, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <AlertTriangle size={12} className="text-red-800 mt-0.5 shrink-0" />
                        <span className="text-[10px] font-black text-slate-500">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Партнери + Режим входу */}
              <div className="bg-black border border-slate-800/50 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                    <Building2 size={12} className="text-emerald-700" />
                    ПОТЕНЦІЙНІ ПАРТНЕРИ
                  </h3>
                  {selected ? selected.localPartners.map((p: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 border border-slate-800/40 mb-2 hover:border-emerald-900/40 transition-all cursor-pointer group">
                      <Building2 size={13} className="text-slate-600 group-hover:text-emerald-600 transition-colors" />
                      <span className="text-[10px] font-black text-slate-400 group-hover:text-white transition-colors">{p}</span>
                      <ArrowUpRight size={12} className="ml-auto text-slate-700 group-hover:text-emerald-500 transition-colors" />
                    </div>
                  )) : <Skeleton className="h-20 w-full" />}
                </div>
                <div>
                  <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                    <Layers size={12} className="text-emerald-700" />
                    РЕЖИМ ВХОДУ
                  </h3>
                  {selected.entryMode.map((e, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border border-slate-800/40 mb-2">
                      <CheckCircle size={12} className="text-emerald-700 shrink-0" />
                      <span className="text-[10px] font-black text-slate-400">{e}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button className="w-full py-4 bg-emerald-700 text-white text-[9px] font-black uppercase tracking-[0.3em] hover:bg-emerald-600 transition-colors border border-emerald-500/30 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Target size={15} />
                ЗАПУСТИТИ ПІЛОТНИЙ ПРОЕКТ — {selected.country.toUpperCase()}
              </button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  </PageTransition>
);
};

export default MarketEntryView;
