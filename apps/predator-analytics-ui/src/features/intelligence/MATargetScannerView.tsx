/**
 * 🎯 M&A TARGET SCANNER | v56.5-ELITE
 * PREDATOR Analytics — Mergers & Acquisitions Intelligence
 *
 * Компанії у фінансових труднощах — можливості:
 * поглинання, партнерства, купівля активів,
 * конкурентна розвідка, market entry.
 * Sovereign Power Design · Classified · Tier-1
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Building2, TrendingDown, TrendingUp, DollarSign,
  AlertTriangle, Search, Filter, Download, Eye,
  Users, BarChart3, Globe, Clock, ChevronRight,
  Crosshair, Star, Zap, ShieldAlert, ArrowUpRight,
  Lock, CheckCircle, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { cn } from '@/utils/cn';

// ─── ТИПИ і ДАНІ ──────────────────────────────────────────

type CompanyStatus = 'distress' | 'restructuring' | 'opportunity' | 'watch';
type DealType = 'acquisition' | 'partnership' | 'asset-buy' | 'equity';

interface MATarget {
  id: string;
  name: string;
  edrpou: string;
  sector: string;
  revenue: string;
  debt: string;
  distressScore: number;
  opportunityScore: number;
  status: CompanyStatus;
  dealTypes: DealType[];
  employees: number;
  founded: number;
  location: string;
  reason: string[];
  assets: string;
  priceTarget: string;
}

const MA_TARGETS: MATarget[] = [
  {
    id: 'ma-001',
    name: 'ТОВ "АгроМаш-Схід"',
    edrpou: '34521876',
    sector: 'Сільгоспмашинобудування',
    revenue: '$8.4M',
    debt: '$12.1M',
    distressScore: 87,
    opportunityScore: 91,
    status: 'distress',
    dealTypes: ['acquisition', 'asset-buy'],
    employees: 312,
    founded: 2004,
    location: 'Дніпро',
    reason: ['Борг > виручка', 'Судові провадження (3)', 'Втрата ключового замовника'],
    assets: 'Завод 12,000 м², 180 од. техніки, патенти',
    priceTarget: '$3.2M–$5.5M',
  },
  {
    id: 'ma-002',
    name: 'ПАТ "КАРГО-ТРАНС"',
    edrpou: '21908743',
    sector: 'Вантажні перевезення',
    revenue: '$22M',
    debt: '$8.4M',
    distressScore: 61,
    opportunityScore: 84,
    status: 'restructuring',
    dealTypes: ['partnership', 'equity'],
    employees: 847,
    founded: 1998,
    location: 'Одеса',
    reason: ['Реструктуризація боргу', 'Мажоритарний акціонер виходить', '40% автопарку застаріло'],
    assets: '420 вантажівок, 18 складів, 3 термінали',
    priceTarget: '$9M–$14M',
  },
  {
    id: 'ma-003',
    name: 'ТОВ "МедТех Україна"',
    edrpou: '43120956',
    sector: 'Медичне обладнання',
    revenue: '$4.1M',
    debt: '$1.2M',
    distressScore: 38,
    opportunityScore: 96,
    status: 'opportunity',
    dealTypes: ['acquisition', 'partnership', 'equity'],
    employees: 94,
    founded: 2016,
    location: 'Харків',
    reason: ['Власник шукає вихід', 'Зростання 45%/рік', 'Унікальна ліцензія МОЗ'],
    assets: 'Ліцензії, B2B-контракти з 47 лікарнями, R&D команда',
    priceTarget: '$4.5M–$7.8M',
  },
];

const SECTOR_DATA = [
  { sector: 'Агро', targets: 24, avgRisk: 74 },
  { sector: 'Логістика', targets: 18, avgRisk: 61 },
  { sector: 'Медтех', targets: 12, avgRisk: 38 },
  { sector: 'IT', targets: 31, avgRisk: 55 },
  { sector: 'Енергія', targets: 9, avgRisk: 29 },
  { sector: 'Будівництво', targets: 22, avgRisk: 81 },
];

const STATUS_CFG = {
  distress:       { label: 'ФІНАНСОВИЙ СТРЕС',   color: '#E11D48', bg: 'bg-rose-900/20',     border: 'border-rose-500/40',    icon: AlertTriangle },
  restructuring:  { label: 'РЕСТРУКТУРИЗАЦІЯ',   color: '#f59e0b', bg: 'bg-amber-900/15',   border: 'border-amber-800/30',  icon: RefreshCw },
  opportunity:    { label: 'МОЖЛИВІСТЬ',          color: '#D4AF37', bg: 'bg-yellow-900/15', border: 'border-yellow-500/30', icon: Star },
  watch:          { label: 'СПОСТЕРЕЖЕННЯ',       color: '#64748b', bg: 'bg-slate-900/15',  border: 'border-slate-800/30', icon: Eye },
};

const DEAL_CFG = {
  acquisition: { label: 'Поглинання',  color: '#E11D48' },
  partnership: { label: 'Партнерство', color: '#D4AF37' },
  'asset-buy': { label: 'Купівля активів', color: '#f59e0b' },
  equity:      { label: 'Вхід в капітал',  color: '#10b981' },
};

// ─── КОМПОНЕНТ ──────────────────────────────────────────────

const MATargetScannerView: React.FC = () => {
  const [selectedTarget, setSelectedTarget] = useState<MATarget | null>(MA_TARGETS[0]);
  const [filterStatus, setFilterStatus] = useState<CompanyStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'opportunity' | 'distress'>('opportunity');

  const filtered = MA_TARGETS
    .filter(t => filterStatus === 'all' || t.status === filterStatus)
    .filter(t =>
      searchQuery === '' ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.sector.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) =>
      sortBy === 'opportunity'
        ? b.opportunityScore - a.opportunityScore
        : b.distressScore - a.distressScore
    );

  return (
    <div className="min-h-screen text-slate-200 font-sans pb-32 relative overflow-hidden bg-[#020202]">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 40% 10%, rgba(212,175,55,0.05) 0%, transparent 55%)' }} />
      </div>

      <div className="relative z-10 max-w-[1850px] mx-auto p-12 space-y-12">

        {/* ── ЗАГОЛОВОК ELITE ── */}
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-10">
          <div className="flex items-center gap-10">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-500/15 blur-3xl rounded-full" />
              <div className="relative p-7 bg-black border-2 border-yellow-500/40 rounded-[3rem] shadow-4xl transform rotate-3 hover:rotate-0 transition-all cursor-crosshair">
                <Target size={54} className="text-yellow-500 drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 rounded-full border-4 border-black animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-4 mb-3">
                <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full animate-pulse shadow-[0_0_8px_#d4af37]" />
                <span className="text-[10px] font-black text-yellow-500/80 uppercase tracking-[0.6em]">
                  M&A INTELLIGENCE · DEAL SOURCING · v56.5-ELITE
                </span>
              </div>
              <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic">
                TARGET <span className="text-yellow-500 underline decoration-yellow-600/30 decoration-[14px] underline-offset-[12px] italic uppercase tracking-tighter">SCANNER</span>
              </h1>
              <p className="text-[12px] text-slate-600 font-black uppercase tracking-[0.5em] mt-6 italic border-l-4 border-yellow-500/30 pl-8 opacity-90 max-w-2xl">
                МОНІТОРИНГ ВРАЗЛИВИХ АКТИВІВ · СТРАТЕГІЧНІ ПОГЛИНАННЯ · ТЕХНОЛОГІЧНИЙ МАРКЕТ-ЕНТРІ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-6 px-10 py-6 bg-black border-2 border-white/5 rounded-3xl shadow-3xl group hover:border-yellow-500/20 transition-all">
              <Crosshair size={24} className="text-yellow-500 animate-pulse" />
              <span className="text-[12px] font-black text-yellow-500 uppercase tracking-[0.4em] font-mono italic">
                {MA_TARGETS.length}_ACTIVE_ASSETS
              </span>
            </div>
            <button className="px-14 py-6 bg-yellow-500 text-black text-[12px] font-black uppercase tracking-[0.4em] hover:brightness-110 transition-all rounded-[2rem] shadow-4xl flex items-center gap-4 italic font-bold">
              <Download size={22} />
              ACQUISITION_PACK_ELITE
            </button>
          </div>
        </div>

        {/* ── МЕТРИКИ ELITE ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: 'ЦІЛЕЙ ЗНАЙДЕНО',       value: '127',   icon: Target,      color: '#D4AF37', sub: 'Detected In-Network' },
            { label: 'CRITICAL_STRESS',      value: '43',    icon: AlertTriangle, color: '#E11D48', sub: 'Distress Score > 80%' },
            { label: 'GOLDEN_OPPORTUNITIES',  value: '18',    icon: Star,        color: '#D4AF37', sub: 'Match Fidelity > 90%' },
            { label: 'TOTAL_EXPOSURE',       value: '$340M', icon: DollarSign,  color: '#D4AF37', sub: 'Aggregated Asset Value' },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="p-10 bg-black/60 backdrop-blur-2xl border-2 border-white/5 hover:border-yellow-500/30 transition-all rounded-[3.5rem] shadow-2xl group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-yellow-500/40 to-transparent opacity-40" />
              <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-10 transition-all duration-[2s]">
                <m.icon size={120} style={{ color: m.color }} />
              </div>
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] mb-4 italic">{m.label}</p>
              <h3 className="text-5xl font-black text-white font-mono tracking-tighter italic" style={{ color: i === 1 ? m.color : '#fff' }}>{m.value}</h3>
              <p className="text-[10px] text-slate-700 font-black uppercase mt-4 tracking-widest opacity-60 underline decoration-yellow-500/20">{m.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* ── ОСНОВНИЙ КОНТЕНТ ELITE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Список цілей */}
          <div className="lg:col-span-7 space-y-8">
            {/* Фільтри ELITE */}
            <div className="flex flex-wrap gap-4 items-center p-3 bg-black/40 backdrop-blur-2xl border-2 border-white/5 rounded-[2.5rem] w-fit shadow-2xl">
              <div className="flex items-center gap-4 bg-black border-2 border-white/5 px-8 py-3 rounded-2xl group focus-within:border-yellow-500/40 transition-all">
                <Search size={18} className="text-slate-700 group-hover:text-yellow-500 transition-colors" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="FILTER_SEARCH..."
                  className="bg-transparent text-[11px] text-white outline-none placeholder:text-slate-800 font-mono w-44 font-black uppercase italic"
                />
              </div>
              <div className="flex gap-2 bg-black border-2 border-white/5 p-2 rounded-2xl shadow-inner">
                {([['all', 'УСІ_ВЕКТОРИ'], ['distress', 'СТРЕС'], ['opportunity', 'НАГОДА'], ['watch', 'НАГЛЯД']] as const).map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => setFilterStatus(v)}
                    className={cn(
                      "px-6 py-2.5 text-[9px] font-black uppercase tracking-[0.3em] transition-all rounded-xl italic",
                      filterStatus === v ? "bg-yellow-500 text-black shadow-lg" : "text-slate-600 hover:text-slate-300"
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 bg-black border-2 border-white/5 p-2 rounded-2xl shadow-inner ml-auto">
                <button
                  onClick={() => setSortBy('opportunity')}
                  className={cn("px-6 py-2.5 text-[9px] font-black uppercase tracking-[0.3em] transition-all rounded-xl italic", sortBy === 'opportunity' ? "text-yellow-500 font-bold" : "text-slate-800")}
                >
                  SORT_BY_ALPHA
                </button>
                <button
                  onClick={() => setSortBy('distress')}
                  className={cn("px-6 py-2.5 text-[9px] font-black uppercase tracking-[0.3em] transition-all rounded-xl italic", sortBy === 'distress' ? "text-rose-500 font-bold" : "text-slate-800")}
                >
                  SORT_BY_RISK
                </button>
              </div>
            </div>

            {/* Список ELITE */}
            <div className="space-y-6">
              {filtered.map((target, i) => {
                const sc = STATUS_CFG[target.status];
                const StatusIcon = sc.icon;
                return (
                  <motion.div
                    key={target.id}
                    initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                    onClick={() => setSelectedTarget(target)}
                    className={cn(
                      "p-10 border-2 cursor-pointer transition-all relative overflow-hidden group rounded-[3.5rem] shadow-3xl",
                      selectedTarget?.id === target.id
                        ? "bg-yellow-500/[0.03] border-yellow-500/30 shadow-4xl"
                        : "bg-black/60 border-white/5 hover:border-white/20"
                    )}
                  >
                    {selectedTarget?.id === target.id && (
                      <div className="absolute left-0 inset-y-0 w-2.5 bg-yellow-500 shadow-[0_0_20px_#d4af37]" />
                    )}

                    <div className="flex items-start gap-10">
                      {/* Скор ELITE */}
                      <div className="text-center shrink-0 w-24 p-6 bg-black border-2 border-white/5 rounded-3xl group-hover:border-yellow-500/40 transition-all shadow-inner relative">
                        <div className="text-4xl font-black font-mono text-yellow-500 leading-none italic tracking-tighter">
                          {target.opportunityScore}
                        </div>
                        <div className="text-[8px] font-black text-yellow-800 uppercase mt-3 tracking-widest italic">ALPHA_SCORE</div>
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full animate-ping" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-6 flex-wrap mb-4">
                          <h3 className="text-2xl font-black text-white group-hover:text-yellow-500 transition-colors uppercase italic tracking-tighter font-serif">
                            {target.name}
                          </h3>
                          <span className={cn("text-[9px] font-black px-4 py-1.5 border-2 uppercase flex items-center gap-2 rounded-xl italic tracking-widest", sc.bg, sc.border)} style={{ color: sc.color }}>
                            <StatusIcon size={12} />
                            {sc.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-6 text-[10px] text-slate-600 font-mono mb-6 uppercase tracking-widest font-black italic">
                          <span className="text-yellow-600">{target.sector}</span>
                          <span className="opacity-20">/</span>
                          <span>{target.location}</span>
                          <span className="opacity-20">/</span>
                          <span>{target.employees}_STAFF</span>
                          <span className="opacity-20">/</span>
                          <span className="text-slate-400 font-black">ID_{target.edrpou}</span>
                        </div>

                        <div className="flex items-center gap-10 mb-6">
                          <div>
                            <p className="text-[8px] text-slate-800 uppercase font-black tracking-[0.4em] mb-2">REVENUE_STREAM</p>
                            <p className="text-xl font-black text-white font-mono italic">{target.revenue}</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-slate-800 uppercase font-black tracking-[0.4em] mb-2">LIABILITY_DEBT</p>
                            <p className="text-xl font-black text-rose-500 font-mono italic">{target.debt}</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-slate-800 uppercase font-black tracking-[0.4em] mb-2">TARGET_VALUATION</p>
                            <p className="text-xl font-black text-yellow-600 font-mono italic">{target.priceTarget}</p>
                          </div>
                        </div>

                        <div className="flex gap-3 flex-wrap">
                          {target.dealTypes.map(d => (
                            <span key={d} className="text-[9px] font-black px-5 py-1.5 bg-black border-2 border-white/5 uppercase tracking-widest rounded-full italic hover:border-yellow-500/20 transition-all text-slate-500"
                              style={{ color: `${DEAL_CFG[d].color}ee` }}>
                              #{DEAL_CFG[d].label.replace(' ', '_')}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-4 px-6 border-l-2 border-white/5">
                        <div className="text-[10px] font-black font-mono uppercase tracking-widest italic" style={{ color: target.distressScore > 70 ? '#E11D48' : '#f59e0b' }}>
                          STRESS_{target.distressScore}%
                        </div>
                        <div className="h-24 w-2 bg-black rounded-full relative overflow-hidden shadow-inner border border-white/5">
                          <div className="absolute bottom-0 left-0 right-0 transition-all duration-1000"
                            style={{ height: `${target.distressScore}%`, backgroundColor: target.distressScore > 70 ? '#E11D48' : '#f59e0b', boxShadow: '0 0 15px currentColor' }} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Деталі та графіки ELITE */}
          <div className="lg:col-span-5 space-y-8">
            <AnimatePresence mode="wait">
              {selectedTarget ? (
                <motion.div
                  key={selectedTarget.id}
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="bg-black/80 backdrop-blur-3xl border-2 border-yellow-500/10 p-12 space-y-10 rounded-[4rem] shadow-4xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-24 opacity-[0.03] pointer-events-none">
                     <Target size={300} className="text-yellow-500" />
                  </div>
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <h2 className="text-3xl font-black text-white uppercase italic leading-none tracking-tighter font-serif">{selectedTarget.name}</h2>
                      <p className="text-[11px] text-yellow-600 font-black mt-3 uppercase tracking-[0.4em] italic">{selectedTarget.sector} · {selectedTarget.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-5xl font-black text-yellow-500 font-mono leading-none tracking-tighter italic">{selectedTarget.opportunityScore}%</p>
                      <p className="text-[9px] text-yellow-800 uppercase font-black tracking-widest mt-2">OPPORTUNITY_RANK</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 relative z-10">
                    {[
                      { l: 'REVENUE', v: selectedTarget.revenue, c: 'text-white' },
                      { l: 'DEBT',    v: selectedTarget.debt,    c: 'text-rose-500' },
                      { l: 'ENTRY_VAL',   v: selectedTarget.priceTarget, c: 'text-yellow-600' },
                    ].map((f, i) => (
                      <div key={i} className="p-6 border-2 border-white/5 bg-black rounded-3xl shadow-inner group hover:border-yellow-500/20 transition-all">
                        <p className="text-[8px] text-slate-800 uppercase font-black tracking-widest mb-2 group-hover:text-yellow-500/60 transition-colors">{f.l}</p>
                        <p className={cn("text-[14px] font-black font-mono italic", f.c)}>{f.v}</p>
                      </div>
                    ))}
                  </div>

                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.6em] mb-6 italic">CRITICAL_VULNERABILITIES</p>
                    <div className="space-y-4">
                      {selectedTarget.reason.map((r, i) => (
                        <div key={i} className="flex items-center gap-5 p-6 border-2 border-white/5 bg-white/[0.01] rounded-3xl hover:border-rose-500/20 transition-all">
                          <div className="p-2 bg-rose-500/10 rounded-lg"><AlertTriangle size={16} className="text-rose-600 shrink-0" /></div>
                          <span className="text-[12px] font-black text-slate-400 uppercase italic tracking-tight">{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.6em] mb-4 italic">IDENTIFIED_ASSETS</p>
                    <div className="p-8 border-2 border-white/5 bg-black rounded-[2.5rem] shadow-inner">
                      <p className="text-[14px] font-black text-slate-300 italic leading-relaxed uppercase tracking-tighter border-l-4 border-yellow-500/30 pl-6">{selectedTarget.assets}</p>
                    </div>
                  </div>

                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.6em] mb-5 italic">DEAL_ARCHITECTURE</p>
                    <div className="flex gap-4 flex-wrap">
                      {selectedTarget.dealTypes.map(d => (
                        <div key={d} className="px-8 py-3 border-2 border-white/5 bg-white/[0.01] text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl italic transition-all hover:border-yellow-500/30" style={{ color: DEAL_CFG[d].color }}>
                          {DEAL_CFG[d].label}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button className="w-full py-7 bg-yellow-500 text-black text-[12px] font-black uppercase tracking-[0.4em] hover:brightness-110 transition-all shadow-4xl flex items-center justify-center gap-5 rounded-3xl italic font-bold">
                    <Crosshair size={24} />
                    EXECUTE_ACQUISITION_PROTOCOL
                  </button>
                </motion.div>
              ) : (
                <div className="bg-black/40 border-4 border-dashed border-white/5 p-32 text-center rounded-[5rem] flex flex-col items-center justify-center">
                  <Target size={80} className="mx-auto mb-8 text-slate-900 animate-pulse" />
                  <p className="text-[12px] font-black text-slate-800 uppercase tracking-[0.8em] italic">
                    STANDBY_FOR_TARGET_SELECTION
                  </p>
                </div>
              )}
            </AnimatePresence>

            {/* Розподіл по секторах ELITE */}
            <div className="bg-black/60 border-2 border-white/5 p-10 rounded-[3.5rem] shadow-3xl backdrop-blur-3xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-2 h-full bg-yellow-500/20" />
              <h3 className="text-[11px] font-black text-yellow-500/60 uppercase tracking-[0.6em] mb-10 flex items-center gap-5 italic">
                 <div className="p-3 bg-yellow-500/10 rounded-xl"><BarChart3 size={20} className="text-yellow-500" /></div>
                 SECTORIAL_ASSET_DISTRIBUTION
              </h3>
              <div className="h-[240px] relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={SECTOR_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.05)" vertical={false} />
                    <XAxis dataKey="sector" tick={{ fill: '#475569', fontSize: 10, fontWeight: 'black' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(212,175,55,0.05)' }}
                      contentStyle={{ background: '#000', border: '2px solid rgba(212,175,55,0.2)', borderRadius: '20px', padding: '15px' }}
                      itemStyle={{ color: '#D4AF37', fontWeight: 'black', fontSize: '10px' }}
                    />
                    <Bar dataKey="targets" name="ASSETS" fill="#D4AF37" radius={[10, 10, 0, 0]} opacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar{width:6px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(212,175,55,.15);border-radius:20px;border:2px solid black}.custom-scrollbar::-webkit-scrollbar-thumb:hover{background:rgba(212,175,55,.3)}` }} />
    </div>
  );
};

export default MATargetScannerView;
