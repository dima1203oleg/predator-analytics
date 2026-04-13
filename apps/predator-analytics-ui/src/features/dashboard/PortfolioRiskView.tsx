/**
 * 💼 P&L РИЗИКІВ ПОРТФЕЛЮ | v56.2-TITAN
 * PREDATOR Analytics — Portfolio Risk Management
 *
 * Скільки $ у зоні ризику прямо зараз:
 * контрагенти, санкції, ланцюги постачання, фін. ризики.
 * CEO-рівень · Sovereign Power Design · LIVE · Tier-1
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, TrendingDown, TrendingUp, AlertTriangle,
  Shield, Activity, Building2, Globe, Lock, Zap,
  RefreshCw, Download, Eye, BarChart3, Target,
  ChevronRight, ChevronDown, Clock, Flame, Star,
  ArrowUpRight, AlertOctagon, TrendingUp as TrendUpIcon
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ReferenceLine
} from 'recharts';
import { cn } from '@/lib/utils';

// ─── ДАНІ ────────────────────────────────────────────────────────────

const PORTFOLIO_SUMMARY = {
  totalExposure:   '$847M',
  atRisk:          '$127.4M',
  atRiskPct:       15.1,
  criticalRisk:    '$41.8M',
  highRisk:        '$58.2M',
  mediumRisk:      '$27.4M',
  change24h:       '+$4.2M',
  changePct24h:    3.4,
  lastUpdate:      '05:34:12',
};

const RISK_TIMELINE = [
  { t: '00:00', risk: 112 }, { t: '02:00', risk: 108 }, { t: '04:00', risk: 115 },
  { t: '06:00', risk: 118 }, { t: '08:00', risk: 109 }, { t: '10:00', risk: 121 },
  { t: '12:00', risk: 119 }, { t: '14:00', risk: 124 }, { t: '16:00', risk: 122 },
  { t: '18:00', risk: 126 }, { t: '20:00', risk: 125 }, { t: '22:00', risk: 127 },
  { t: 'Зараз', risk: 127.4 },
];

const RISK_BREAKDOWN = [
  { name: 'Санкційний',   value: 33, amount: '$41.8M',  color: '#dc2626' },
  { name: 'Контрагент',  value: 26, amount: '$33.1M',  color: '#991b1b' },
  { name: 'Ланцюг пост.',value: 20, amount: '$25.5M',  color: '#d97706' },
  { name: 'FX / Валютний',value: 14, amount: '$17.8M', color: '#92400e' },
  { name: 'Операційний', value: 7, amount: '$9.2M',    color: '#475569' },
];

interface RiskPosition {
  id: string;
  counterparty: string;
  type: string;
  exposure: string;
  atRisk: string;
  riskPct: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  trigger: string;
  daysToMaturity: number;
  country: string;
  action: string;
  trend: 'up' | 'down' | 'stable';
}

const RISK_POSITIONS: RiskPosition[] = [
  {
    id: 'POS-001',
    counterparty: 'KYOTO HOLDINGS LTD (BVI)',
    type: 'Торговий кредит',
    exposure: '$18.4M',
    atRisk: '$18.4M',
    riskPct: 100,
    riskLevel: 'critical',
    trigger: 'SDN List hit — OFAC 2025-03-15',
    daysToMaturity: 12,
    country: '🇻🇬 BVI',
    action: 'ЗАМОРОЗИТИ РОЗРАХУНКИ',
    trend: 'up',
  },
  {
    id: 'POS-002',
    counterparty: 'ТОВ "МЕТАЛУРГ-ІНВЕСТ"',
    type: 'Дебіторська заборгованість',
    exposure: '$12.1M',
    atRisk: '$9.7M',
    riskPct: 80,
    riskLevel: 'critical',
    trigger: 'Відкрито банкрутство (справа №910/4521/25)',
    daysToMaturity: 0,
    country: '🇺🇦 Україна',
    action: 'ПОДАТИ КРЕДИТОРСЬКІ ВИМОГИ',
    trend: 'up',
  },
  {
    id: 'POS-003',
    counterparty: 'SUNRISE CAPITAL (CY)',
    type: 'Інвестиційна угода',
    exposure: '$8.2M',
    atRisk: '$6.1M',
    riskPct: 74,
    riskLevel: 'high',
    trigger: 'Власник під слідством ФБР (PEP + INTERPOL)',
    daysToMaturity: 45,
    country: '🇨🇾 Кіпр',
    action: 'ПРАВОВИЙ АНАЛІЗ + FREEZE',
    trend: 'up',
  },
  {
    id: 'POS-004',
    counterparty: 'АГРО-ЛІДЕР ГРУП',
    type: 'Контракт на поставку',
    exposure: '$22.5M',
    atRisk: '$5.8M',
    riskPct: 26,
    riskLevel: 'high',
    trigger: 'UBO через офшор · Shell структура виявлена',
    daysToMaturity: 88,
    country: '🇺🇦 Україна',
    action: 'ПЕРЕУКЛАСТИ З ГАРАНТІЯМИ',
    trend: 'stable',
  },
  {
    id: 'POS-005',
    counterparty: 'NORDIC LOGISTICS AB',
    type: 'Транзитна угода',
    exposure: '$14.7M',
    atRisk: '$3.9M',
    riskPct: 27,
    riskLevel: 'medium',
    trigger: 'Зупинка маршруту Балтика — нові обмеження',
    daysToMaturity: 120,
    country: '🇸🇪 Швеція',
    action: 'РЕФРЕЙМ МАРШРУТУ',
    trend: 'down',
  },
  {
    id: 'POS-006',
    counterparty: 'GULF MERIDIAN FZCO',
    type: 'Ліцензійний договір',
    exposure: '$6.4M',
    atRisk: '$2.1M',
    riskPct: 33,
    riskLevel: 'medium',
    trigger: 'Юрисдикція ОАЕ · подвійне використання',
    daysToMaturity: 210,
    country: '🇦🇪 ОАЕ',
    action: 'COMPLIANCE REVIEW',
    trend: 'stable',
  },
];

const SECTOR_RISK = [
  { sector: 'Агро',     exposure: 220, risk: 42, riskPct: 19 },
  { sector: 'Логістика', exposure: 180, risk: 31, riskPct: 17 },
  { sector: 'Метали',   exposure: 140, risk: 38, riskPct: 27 },
  { sector: 'Хімія',    exposure: 95,  risk: 8,  riskPct: 8  },
  { sector: 'Фінанси',  exposure: 120, risk: 22, riskPct: 18 },
  { sector: 'Енергія',  exposure: 92,  risk: 6,  riskPct: 7  },
];

// ─── КОМПОНЕНТ ────────────────────────────────────────────────────────

const RISK_COLOR = {
  critical: '#dc2626',
  high:     '#ea580c',
  medium:   '#b45309',
  low:      '#3f6212',
};

const RISK_LABEL = {
  critical: 'КРИТИЧНИЙ',
  high:     'ВИСОКИЙ',
  medium:   'СЕРЕДНІЙ',
  low:      'НИЗЬКИЙ',
};

const PortfolioRiskView: React.FC = () => {
  const [selectedPos, setSelectedPos] = useState<RiskPosition | null>(RISK_POSITIONS[0]);
  const [liveRisk, setLiveRisk] = useState(127.4);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [pulse, setPulse] = useState(false);

  // Live P&L tick simulation
  useEffect(() => {
    const id = setInterval(() => {
      const delta = (Math.random() - 0.48) * 0.3;
      setLiveRisk(r => Math.max(120, Math.min(135, +(r + delta).toFixed(1))));
      if (Math.random() > 0.6) setPulse(p => !p);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const filtered = RISK_POSITIONS.filter(p =>
    filter === 'all' || p.riskLevel === filter
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 1000));
    setRefreshing(false);
  };

  return (
    <div className="min-h-screen text-slate-200 font-sans pb-24 relative overflow-hidden bg-[#020617]">
      {/* Sovereign Background Layers */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cyber-grid opacity-[0.03]" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% -20%, rgba(220,38,38,0.1), transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-[500px]" style={{ background: 'linear-gradient(to top, rgba(2,6,23,1), transparent)' }} />
      </div>

      <div className="relative z-10 max-w-[1700px] mx-auto p-6 space-y-8">

        {/* ── HEADER CONTOUR ── */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 py-4 border-b border-white/[0.04]">
          <div className="flex items-center gap-8">
            <div className="relative group/orb scale-110">
               <div className="absolute inset-0 bg-red-600/20 blur-3xl rounded-full scale-150 animate-pulse" />
               <div className="relative p-6 rounded-[2rem] bg-black/80 border border-red-900/40 shadow-2xl flex items-center justify-center">
                 <DollarSign size={42} className="text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.6)]" />
                 <motion.div
                   animate={{ scale: [1, 1.4, 1], opacity: [1, 0.4, 1] }}
                   transition={{ duration: 1.2, repeat: Infinity }}
                   className="absolute top-4 right-4 w-3.5 h-3.5 bg-red-600 rounded-full shadow-[0_0_12px_#dc2626]"
                 />
               </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                 <span className="badge-v2 badge-v2-rose px-3 py-0.5 text-[9px] font-black tracking-[0.3em] uppercase italic">
                   TITAN_CORE // P&L ANALYTICS
                 </span>
                 <div className="h-0.5 w-16 bg-gradient-to-r from-red-600 to-transparent" />
                 <span className="text-[9px] font-mono font-black text-slate-600 uppercase tracking-widest">v56.2 TITAN</span>
              </div>
              <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic skew-x-[-2deg] leading-none">
                P&L <span className="text-red-600">РИЗИКІВ</span> ПОРТФЕЛЮ
              </h1>
              <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] italic opacity-80">
                Контрагенти • Санкції • Ланцюги • FX/Ops
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Real-time Ticker Display */}
            <div className="px-8 py-5 rounded-[2rem] bg-black/40 border border-red-900/30 text-center min-w-[200px] shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-red-600/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2 italic">У ЗОНІ РИЗИКУ [24Г]</p>
              <div className="flex items-center justify-center gap-3">
                <motion.span
                  key={liveRisk}
                  initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                  className="text-4xl font-black text-red-500 font-mono italic tracking-tighter"
                  style={{ textShadow: '0 0 25px rgba(220,38,38,0.4)' }}
                >
                  ${liveRisk}M
                </motion.span>
                <div className="text-left">
                  <p className="text-[10px] font-black text-emerald-500/80 italic flex items-center gap-1">
                    <TrendingUp size={10} /> +3.4%
                  </p>
                  <p className="text-[8px] font-mono text-slate-700 font-black">UTC {new Date().getHours()}:00</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 text-slate-500 hover:text-red-500 hover:border-red-500/30 transition-all hover:bg-black/60 shadow-xl"
            >
              <RefreshCw size={22} className={refreshing ? 'animate-spin text-red-500' : ''} />
            </button>
            <button className="px-10 py-5 bg-red-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-red-600 transition-all border border-red-500/40 flex items-center gap-4 shadow-[0_15px_40px_rgba(220,38,38,0.25)] italic group">
              <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
              BOARD_REPORT
            </button>
          </div>
        </div>

        {/* ── CRITICAL ALERT BANNER ── */}
        <AnimatePresence>
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="overflow-hidden"
          >
            <div className={cn(
              "rounded-[2.5rem] border-2 bg-rose-500/[0.03] p-6 flex flex-col md:flex-row items-center gap-8 shadow-2xl transition-all duration-1000",
              pulse ? "border-red-600/40 shadow-[0_0_40px_rgba(220,38,38,0.1)]" : "border-red-600/20"
            )}>
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-red-600 blur-2xl opacity-20 animate-pulse" />
                <div className="relative w-16 h-16 rounded-[1.5rem] bg-red-600 flex items-center justify-center text-white shadow-lg">
                  <AlertOctagon size={32} className="animate-pulse" />
                </div>
              </div>
              <div className="flex-1 space-y-2 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-4">
                   <p className="text-[12px] font-black text-red-500 uppercase tracking-[0.4em] italic animate-pulse">КРИТИЧНА ЕКСКАЛАЦІЯ // ТРИВОГА-ЧЕРВОНА</p>
                   <div className="h-0.5 w-12 bg-red-600/30" />
                </div>
                <p className="text-[15px] text-slate-300 font-bold uppercase tracking-tight leading-relaxed italic">
                  2 ПРІОРИТЕТНІ ПОЗИЦІЇ [<span className="text-red-500 underline decoration-red-500/30">POS-001</span>, <span className="text-red-500 underline decoration-red-500/30">POS-002</span>] ПЕРЕЙШЛИ В КАТЕГОРІЮ EXTREME.
                  СУМАРНИЙ РИЗИК ДЕФОЛТУ: <span className="text-red-400 font-black tracking-widest">$28,150,000</span>.
                </p>
              </div>
              <button className="px-10 py-5 bg-red-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-red-500 transition-all flex items-center gap-4 italic group shadow-xl">
                <Zap size={18} /> ДІЯТИ_ЗАРАЗ <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── KPI GRID ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
          {[
            { label: 'ЗАГАЛЬНИЙ ПОРТФЕЛЬ', value: '$847M', color: 'text-white', bar: 100, accent: 'bg-white/10' },
            { label: 'РИЗИКОВА ЕКСПОЗИЦІЯ', value: `$${liveRisk}M`, color: 'text-red-500', bar: 15.1, accent: 'bg-red-500/10' },
            { label: 'КРИТИЧНИЙ СЕКТОР', value: '$41.8M', color: 'text-rose-600', bar: 33, accent: 'bg-rose-500/10' },
            { label: 'АКТИВНИХ ЛОТІВ', value: '6', color: 'text-amber-500', bar: null, accent: 'bg-amber-500/10' },
            { label: 'ДИНАМІКА 24Г', value: '+$4.2M', color: 'text-red-500', bar: null, accent: 'bg-red-500/10' },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="p-8 rounded-[2rem] bg-black/40 border border-white/[0.05] hover:border-white/[0.1] transition-all relative overflow-hidden group/kpi shadow-xl"
            >
              <div className={cn("absolute top-0 left-0 w-1 h-full opacity-0 group-hover/kpi:opacity-100 transition-opacity", m.accent)} />
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4 italic leading-none">{m.label}</p>
              <p className={cn("text-3xl font-black font-mono italic tracking-tighter leading-none mb-4", m.color)}>{m.value}</p>
              {m.bar !== null && (
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${m.bar}%` }}
                    transition={{ duration: 1.5, delay: 0.5 + i * 0.1 }}
                    className={cn("h-full rounded-full shadow-[0_0_10px]", m.color.replace('text-', 'bg-'))}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* ── MAIN CONTENT MATRIX ── */}
        <div className="grid grid-cols-12 gap-8">

          {/* LEFT: POSITION FEED (8/12) */}
          <div className="col-span-12 xl:col-span-8 space-y-6">
            
            {/* TACTICAL FILTER */}
            <div className="flex items-center gap-3 p-2 bg-black/60 rounded-[1.5rem] border border-white/[0.05] w-fit shadow-2xl">
              {([['all', 'УСІ'], ['critical', 'КРИТИЧНІ'], ['high', 'ВИСОКІ'], ['medium', 'СЕРЕДНІ']] as const).map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setFilter(v)}
                  className={cn(
                    "px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all italic flex items-center gap-3",
                    filter === v
                      ? v === 'critical' ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                        : v === 'high'   ? "bg-amber-600/80 text-white shadow-lg shadow-amber-600/20"
                        : v === 'medium' ? "bg-amber-900/60 text-amber-400"
                        : "bg-slate-800 text-white"
                      : "text-slate-600 hover:text-slate-300 hover:bg-white/5"
                  )}
                >
                  {l}
                  <span className={cn("px-2 py-0.5 rounded-lg text-[9px] font-mono",
                    filter === v ? "bg-black/20 text-white/80" : "bg-white/5 text-slate-700"
                  )}>
                    {v === 'all' ? RISK_POSITIONS.length : RISK_POSITIONS.filter(p => p.riskLevel === v).length}
                  </span>
                </button>
              ))}
            </div>

            {/* POSITION CARDS LIST */}
            <div className="space-y-4">
              {filtered.map((pos, i) => (
                <motion.div
                  key={pos.id}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedPos(pos)}
                  className={cn(
                    "p-8 rounded-[2.5rem] border-2 cursor-pointer transition-all relative overflow-hidden group shadow-2xl",
                    selectedPos?.id === pos.id
                      ? "bg-red-600/[0.02] border-red-600/40"
                      : "bg-black/40 border-white/[0.05] hover:border-white/[0.12] hover:bg-black/60"
                  )}
                >
                  {/* Vertical Risk Accent */}
                  <div
                    className={cn("absolute left-0 inset-y-0 w-2 transition-all duration-500", 
                      selectedPos?.id === pos.id ? "opacity-100" : "opacity-30 group-hover:opacity-100"
                    )}
                    style={{ backgroundColor: RISK_COLOR[pos.riskLevel], boxShadow: `0 0 20px ${RISK_COLOR[pos.riskLevel]}40` }}
                  />

                  <div className="flex items-start gap-8 pl-4">
                    {/* RISK BOX */}
                    <div className="text-center w-24 shrink-0 p-4 rounded-3xl bg-black/60 border border-white/5 shadow-inner">
                      <div className="text-3xl font-black font-mono italic tracking-tighter leading-none" style={{ color: RISK_COLOR[pos.riskLevel] }}>
                        {pos.riskPct}%
                      </div>
                      <div className="text-[9px] font-black uppercase tracking-widest mt-2 opacity-60 italic" style={{ color: RISK_COLOR[pos.riskLevel] }}>
                        РИЗИК
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-[10px] font-black font-mono text-slate-700 italic tracking-[0.2em]">{pos.id}</span>
                        <div className={cn("px-4 py-1 rounded-full border text-[9px] font-black italic tracking-widest uppercase",
                          pos.riskLevel === 'critical' ? "bg-red-600/10 text-red-500 border-red-600/20" :
                          pos.riskLevel === 'high'     ? "bg-amber-600/10 text-amber-500 border-amber-600/20" :
                                                          "bg-indigo-600/10 text-indigo-400 border-indigo-600/20"
                        )}>
                          {RISK_LABEL[pos.riskLevel]}
                        </div>
                        <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic">{pos.country}</span>
                      </div>

                      <h3 className="text-2xl font-black text-white group-hover:text-red-500 transition-colors uppercase italic tracking-tighter mb-2">
                        {pos.counterparty}
                      </h3>

                      <div className="flex items-center gap-8 text-[11px] font-bold text-slate-500 uppercase tracking-tight italic mb-6">
                         <span className="flex items-center gap-2">
                            <Building2 size={14} className="text-slate-700" /> {pos.type}
                         </span>
                         {pos.daysToMaturity > 0 ? (
                            <span className="flex items-center gap-2 text-slate-600">
                               <Clock size={14} /> {pos.daysToMaturity} ДН ДО ГАРАНТІЇ
                            </span>
                         ) : (
                            <span className="flex items-center gap-2 text-red-600 animate-pulse font-black">
                               <AlertTriangle size={14} /> ПРОСТРОЧЕНО
                            </span>
                         )}
                      </div>

                      <div className="grid grid-cols-2 gap-8 border-t border-white/[0.04] pt-6">
                        <div>
                          <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] mb-1 italic">ЕКСПОРТНА ЕКСПОЗИЦІЯ</p>
                          <p className="text-xl font-black text-white font-mono italic tracking-tighter">{pos.exposure}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] mb-1 italic">У ЧИСТОМУ РИЗИКУ</p>
                          <p className="text-xl font-black font-mono italic tracking-tighter" style={{ color: RISK_COLOR[pos.riskLevel] }}>{pos.atRisk}</p>
                        </div>
                      </div>

                      {/* RISK TRIGGER TAG */}
                      <div className="mt-6 flex items-center gap-4 p-4 rounded-2xl bg-black/40 border border-white/5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <Flame size={18} className="text-red-600" />
                        <span className="text-[11px] font-bold text-slate-500 italic uppercase leading-none tracking-tight">{pos.trigger}</span>
                      </div>
                    </div>

                    {/* STATUS DECORATION */}
                    <div className="shrink-0 flex flex-col items-center justify-center p-6 bg-white/[0.02] rounded-full">
                      {pos.trend === 'up'
                        ? <TrendUpIcon size={24} className="text-red-600 animate-bounce" />
                        : pos.trend === 'down'
                        ? <TrendingDown size={24} className="text-emerald-500" />
                        : <Activity size={24} className="text-slate-700" />}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* RIGHT: DETAILS PANEL (4/12) */}
          <div className="col-span-12 xl:col-span-4 space-y-8">

            {/* POSITION INTEL HUD */}
            <AnimatePresence mode="wait">
              {selectedPos && (
                <motion.div
                  key={selectedPos.id}
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-[3rem] bg-black border-2 border-red-900/40 p-10 space-y-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] sticky top-6"
                >
                  <div className="relative overflow-hidden rounded-[2.5rem] p-8 border border-white/[0.05] bg-slate-950/50">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.05]">
                       <Shield size={100} className="text-red-600" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-[11px] font-mono text-slate-600 font-bold tracking-[0.3em] uppercase">{selectedPos.id}</span>
                        <div className="px-3 py-1 rounded-lg text-[9px] font-black italic tracking-widest uppercase" style={{ color: RISK_COLOR[selectedPos.riskLevel], border: `1px solid ${RISK_COLOR[selectedPos.riskLevel]}40`, backgroundColor: `${RISK_COLOR[selectedPos.riskLevel]}10` }}>
                          {RISK_LABEL[selectedPos.riskLevel]}
                        </div>
                      </div>
                      <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-[0.9]">{selectedPos.counterparty}</h2>
                      <p className="text-[12px] font-bold text-slate-500 mt-4 uppercase italic tracking-widest leading-none">
                        {selectedPos.country} // {selectedPos.type}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { l: 'ЕКСПОЗИЦІЯ', v: selectedPos.exposure, c: 'text-white' },
                      { l: 'РИЗИК_NET',   v: selectedPos.atRisk,   c: 'text-red-500' },
                      { l: 'ІНДЕКС_X',     v: `${selectedPos.riskPct}%`, c: 'text-red-500' },
                      { l: 'МАРАТОРІЙ',    v: selectedPos.daysToMaturity > 0 ? `${selectedPos.daysToMaturity}Д` : 'АКТИВНО', c: selectedPos.daysToMaturity > 0 ? 'text-slate-400' : 'text-red-600' },
                    ].map((f, i) => (
                      <div key={i} className="p-6 rounded-[2rem] border border-white/[0.04] bg-white/[0.02] flex flex-col justify-center gap-2">
                        <p className="text-[9px] text-slate-700 uppercase font-black tracking-widest italic leading-none">{f.l}</p>
                        <p className={cn("text-2xl font-black font-mono mt-1 italic tracking-tighter leading-none", f.c)}>{f.v}</p>
                      </div>
                    ))}
                  </div>

                  {/* ACTION TRIGGER CARDS */}
                  <div className="space-y-4">
                     <div className="p-6 rounded-[2rem] border-2 border-red-900/40 bg-red-600/[0.03] space-y-3">
                        <div className="flex items-center gap-3">
                           <AlertTriangle size={18} className="text-red-500" />
                           <p className="text-[10px] font-black text-red-700 uppercase tracking-widest italic leading-none">ТРИГЕР ЕКСKALАЦІЇ</p>
                        </div>
                        <p className="text-[13px] font-bold text-red-200/90 italic leading-snug tracking-tight">{selectedPos.trigger}</p>
                     </div>

                     <div className="p-6 rounded-[2rem] border-2 border-amber-900/40 bg-amber-600/[0.03] space-y-3">
                        <div className="flex items-center gap-3">
                           <Zap size={18} className="text-amber-500" />
                           <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest italic leading-none">ПРЕДИКТИВНА ДІЯ</p>
                        </div>
                        <p className="text-[13px] font-bold text-amber-200/90 italic leading-snug tracking-tight">{selectedPos.action}</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button className="py-5 bg-red-600 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-red-500 transition-all shadow-xl shadow-red-600/20 italic">
                      ЕСКАЛУВАТИ_V5
                    </button>
                    <button className="py-5 bg-slate-900 text-slate-300 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] border border-white/[0.05] hover:bg-slate-800 transition-all italic">
                      ДОСЬЄ_360°
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* P&L HISTORY HUD */}
            <div className="rounded-[2.5rem] bg-black/40 border border-white/[0.05] p-8 shadow-2xl space-y-8">
              <div className="flex items-center justify-between">
                 <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic flex items-center gap-4">
                    <Activity size={16} className="text-red-600 animate-pulse" />
                    ДИНАМІКА РИЗИКУ [24Г]
                 </h3>
                 <div className="h-0.5 w-12 bg-white/5" />
              </div>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={RISK_TIMELINE} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#dc2626" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                    <XAxis dataKey="t" tick={{ fill: '#475569', fontSize: 9, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#050a14', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '16px', color: '#fff' }}
                      itemStyle={{ color: '#ef4444', fontWeight: 'bold' }}
                    />
                    <ReferenceLine y={125} stroke="#dc2626" strokeDasharray="6 6" strokeWidth={1} label={{ value: 'THREASHOLD', position: 'insideTopRight', fill: '#dc2626', fontSize: 8, fontWeight: 'black' }} />
                    <Area type="monotone" dataKey="risk" stroke="#dc2626" strokeWidth={3} fill="url(#riskGrad)" animationDuration={2000} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* RISK TYPE DISTRIBUTION */}
            <div className="rounded-[2.5rem] bg-black/40 border border-white/[0.05] p-8 shadow-2xl space-y-8">
              <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic leading-none">РОЗПОДІЛ ЗА ВЕКТОРАМИ</h3>
              <div className="flex items-center gap-10">
                <div className="relative shrink-0">
                   <div className="absolute inset-0 bg-red-600/10 blur-2xl rounded-full" />
                   <PieChart width={140} height={140}>
                      <Pie data={RISK_BREAKDOWN} innerRadius={42} outerRadius={62} paddingAngle={4} dataKey="value" cx="50%" cy="50%">
                        {RISK_BREAKDOWN.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
                      </Pie>
                   </PieChart>
                </div>
                <div className="space-y-3 flex-1">
                  {RISK_BREAKDOWN.map((r, i) => (
                    <div key={i} className="flex items-center justify-between group/legend">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={{ backgroundColor: r.color }} />
                        <span className="text-[10px] font-black text-slate-500 uppercase italic tracking-tight group-hover/legend:text-slate-300 transition-colors">{r.name}</span>
                      </div>
                      <span className="text-[11px] font-black text-white font-mono italic">{r.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .badge-v2 {
           display: inline-flex;
           align-items: center;
           border-radius: 8px;
        }
        .badge-v2-rose {
           background: rgba(220, 38, 38, 0.1);
           border: 1px solid rgba(220, 38, 38, 0.2);
           color: #ef4444;
        }
        .shadow-3xl {
           box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.8);
        }
        .animate-spin-slow {
           animation: spin 10s linear infinite;
        }
        @keyframes spin {
           from { transform: rotate(0deg); }
           to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
};

export default PortfolioRiskView;
