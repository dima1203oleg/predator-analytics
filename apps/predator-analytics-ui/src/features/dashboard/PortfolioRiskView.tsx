/**
 * 💼 P&L РИЗИКІВ ПОРТФЕЛЮ | v56.4
 * PREDATOR Analytics — Portfolio Risk Management
 *
 * Скільки $ у зоні ризику прямо зараз:
 * контрагенти, санкції, ланцюги постачання, фін. ризики.
 * CEO-рівень · Sovereign Power Design · LIVE · Tier-1
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, TrendingDown, TrendingUp, AlertTriangle,
  Shield, Activity, Building2, Globe, Lock, Zap,
  RefreshCw, Download, Eye, BarChart3, Target,
  ChevronRight, ChevronDown, Clock, Flame, Star
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ReferenceLine
} from 'recharts';
import { cn } from '@/utils/cn';

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
  { name: 'Санкційний',   value: 33, amount: '$41.8M',  color: '#ef4444' },
  { name: 'Контрагент',  value: 26, amount: '$33.1M',  color: '#dc2626' },
  { name: 'Ланцюг пост.',value: 20, amount: '$25.5M',  color: '#f59e0b' },
  { name: 'FX / Валютний',value: 14, amount: '$17.8M', color: '#b45309' },
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
  critical: '#ef4444',
  high:     '#f59e0b',
  medium:   '#b45309',
  low:      '#0891b2',
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

  // Live P&L tick
  useEffect(() => {
    const id = setInterval(() => {
      const delta = (Math.random() - 0.48) * 0.3;
      setLiveRisk(r => Math.max(120, Math.min(135, +(r + delta).toFixed(1))));
      if (Math.random() > 0.7) setPulse(p => !p);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  const filtered = RISK_POSITIONS.filter(p =>
    filter === 'all' || p.riskLevel === filter
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 1200));
    setRefreshing(false);
  };

  return (
    <div className="min-h-screen text-slate-200 font-sans pb-24 relative overflow-hidden">
      {/* Суверенний фон */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 60% 10%, rgba(220,38,38,0.05) 0%, transparent 55%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 10% 80%, rgba(245,158,11,0.03) 0%, transparent 45%)' }} />
      </div>

      <div className="relative z-10 max-w-[1800px] mx-auto p-6 space-y-8">

        {/* ── ЗАГОЛОВОК ── */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-red-700/20 blur-2xl rounded-full" />
              <div className="relative p-5 bg-black border border-red-900/50">
                <DollarSign size={38} className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                <motion.span
                  animate={{ scale: [1, 1.6, 1], opacity: [1, 0.3, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 0.7, repeat: Infinity }}
                  className="w-1.5 h-1.5 bg-red-600 rounded-full"
                />
                <span className="text-[8px] font-black text-red-700/70 uppercase tracking-[0.5em]">
                  PORTFOLIO RISK · LIVE P&L · CEO-РІВЕНЬ · v56.4
                </span>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
                P&L{' '}
                <span className="text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]">РИЗИКІВ</span>
                {' '}ПОРТФЕЛЮ
              </h1>
              <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.3em] mt-1">
                КОНТРАГЕНТИ · САНКЦІЇ · ЛАНЦЮГИ · FX · ОПЕРАЦІЙНІ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live counter */}
            <div className="px-6 py-4 bg-black border border-red-900/40 text-center min-w-[160px]">
              <p className="text-[7px] font-black text-slate-700 uppercase tracking-widest mb-1">У ЗОНІ РИЗИКУ ЗАРАЗ</p>
              <motion.p
                key={liveRisk}
                initial={{ scale: 1.08 }} animate={{ scale: 1 }}
                className="text-[26px] font-black text-red-400 font-mono leading-none"
                style={{ textShadow: '0 0 20px rgba(239,68,68,0.4)' }}
              >
                ${liveRisk}M
              </motion.p>
              <p className="text-[7px] font-mono text-red-800 mt-1">▲ +$4.2M за 24г</p>
            </div>

            <button
              onClick={handleRefresh}
              className="p-4 bg-black border border-slate-800/50 text-slate-600 hover:text-white hover:border-slate-600 transition-all"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin text-red-500' : ''} />
            </button>
            <button className="px-8 py-4 bg-red-700 text-white text-[9px] font-black uppercase tracking-wider hover:bg-red-600 transition-colors border border-red-500/40 flex items-center gap-2 shadow-[0_0_25px_rgba(239,68,68,0.3)]">
              <Download size={14} />
              BOARD REPORT
            </button>
          </div>
        </div>

        {/* ── КРИТИЧНИЙ АЛЕРТ (якщо є критичні позиції) ── */}
        <motion.div
          animate={{ borderColor: pulse ? 'rgba(239,68,68,0.6)' : 'rgba(239,68,68,0.2)' }}
          className="border bg-red-950/10 p-5 flex items-center gap-5"
        >
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="w-3 h-3 bg-red-600 rounded-full shrink-0 shadow-[0_0_12px_rgba(239,68,68,0.8)]"
          />
          <div className="flex-1">
            <p className="text-[9px] font-black text-red-500 uppercase tracking-[0.3em]">⚠ КРИТИЧНИЙ СИГНАЛ — ВИМАГАЄ НЕГАЙНИХ ДІЙ</p>
            <p className="text-[11px] text-slate-400 mt-1 font-black">
              2 позиції (POS-001, POS-002) перейшли в критичний статус.
              Загальний ризик: <span className="text-red-400">$28.1M</span> · Рекомендована дія: заморозка розрахунків та подання кредиторських вимог.
            </p>
          </div>
          <button className="px-5 py-2.5 bg-red-700 text-white text-[8px] font-black uppercase tracking-wider whitespace-nowrap flex items-center gap-2 hover:bg-red-600 transition-colors">
            <Zap size={12} /> ДІЯТИ ЗАРАЗ
          </button>
        </motion.div>

        {/* ── МЕТРИКИ ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { l: 'ЗАГАЛЬНИЙ ПОРТФЕЛЬ', v: '$847M',    c: '#ffffff',  bar: 100 },
            { l: 'У ЗОНІ РИЗИКУ',       v: `$${liveRisk}M`, c: '#ef4444', bar: 15.1 },
            { l: 'КРИТИЧНИЙ РИЗИК',     v: '$41.8M',  c: '#dc2626',  bar: 33 },
            { l: 'ВІДКРИТИХ ПОЗИЦІЙ',   v: '6',       c: '#f59e0b',  bar: null },
            { l: 'ЗМІН ЗА 24Г',         v: '+$4.2M',  c: '#ef4444',  bar: null },
          ].map((m, i) => (
            <motion.div
              key={m.l}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="p-6 bg-black border border-slate-800/50 hover:border-slate-700/60 transition-all"
            >
              <p className="text-[7px] font-black text-slate-700 uppercase tracking-[0.4em] mb-2">{m.l}</p>
              <p className="text-[22px] font-black font-mono" style={{ color: m.c }}>{m.v}</p>
              {m.bar !== null && (
                <div className="h-0.5 bg-slate-900 mt-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${m.bar}%` }}
                    transition={{ delay: 0.4 + i * 0.07 }}
                    className="h-full" style={{ backgroundColor: m.c }}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* ── ОСНОВНИЙ КОНТЕНТ ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Ліва: список позицій */}
          <div className="lg:col-span-7 space-y-4">
            {/* Фільтр */}
            <div className="flex items-center gap-2 p-1.5 bg-black border border-slate-800/50 w-fit">
              {([['all', 'УСІ'], ['critical', 'КРИТИЧНІ'], ['high', 'ВИСОКІ'], ['medium', 'СЕРЕДНІ']] as const).map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setFilter(v)}
                  className={cn(
                    "px-4 py-2 text-[8px] font-black uppercase tracking-wider transition-all border border-transparent",
                    filter === v
                      ? v === 'critical' ? "bg-red-700 text-white"
                        : v === 'high'   ? "bg-amber-700/70 text-amber-100"
                        : v === 'medium' ? "bg-amber-900/40 text-amber-400"
                        : "bg-slate-800 text-white"
                      : "text-slate-600 hover:text-slate-300"
                  )}
                >
                  {l}
                  <span className={cn("ml-2 px-1.5 py-0.5 text-[7px] rounded-sm",
                    v === 'all'      ? "bg-slate-800 text-slate-500" :
                    v === 'critical' ? "bg-red-900/40 text-red-400" :
                    v === 'high'     ? "bg-amber-900/30 text-amber-500" :
                                       "bg-amber-950/20 text-amber-700"
                  )}>
                    {v === 'all' ? RISK_POSITIONS.length :
                     RISK_POSITIONS.filter(p => p.riskLevel === v).length}
                  </span>
                </button>
              ))}
            </div>

            {/* Позиції */}
            {filtered.map((pos, i) => (
              <motion.div
                key={pos.id}
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                onClick={() => setSelectedPos(pos)}
                className={cn(
                  "p-6 border cursor-pointer transition-all relative overflow-hidden group",
                  selectedPos?.id === pos.id
                    ? "bg-red-950/10 border-red-800/50"
                    : "bg-black border-slate-800/40 hover:border-slate-700/60 hover:bg-slate-950/30"
                )}
              >
                {/* Ризик-індикатор зліва */}
                <div
                  className="absolute left-0 inset-y-0 w-1 transition-all"
                  style={{ backgroundColor: RISK_COLOR[pos.riskLevel], boxShadow: selectedPos?.id === pos.id ? `0 0 8px ${RISK_COLOR[pos.riskLevel]}60` : 'none' }}
                />

                <div className="flex items-start gap-5 pl-3">
                  {/* Ризик % */}
                  <div className="text-center w-16 shrink-0">
                    <div className="text-[22px] font-black font-mono leading-none" style={{ color: RISK_COLOR[pos.riskLevel] }}>
                      {pos.riskPct}%
                    </div>
                    <div className="text-[7px] font-black uppercase mt-0.5" style={{ color: RISK_COLOR[pos.riskLevel] }}>
                      РИЗИК
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[8px] font-black font-mono text-slate-600">{pos.id}</span>
                      <span className={cn("text-[7px] font-black px-2 py-0.5 uppercase tracking-wider border",
                        pos.riskLevel === 'critical' ? "bg-red-900/25 text-red-500 border-red-800/40"   :
                        pos.riskLevel === 'high'     ? "bg-amber-900/20 text-amber-500 border-amber-800/30" :
                                                        "bg-amber-950/10 text-amber-700 border-amber-900/20"
                      )}>
                        {RISK_LABEL[pos.riskLevel]}
                      </span>
                      <span className="text-[7px] text-slate-700 font-mono">{pos.country}</span>
                    </div>

                    <h3 className="text-[13px] font-black text-white group-hover:text-red-300 transition-colors uppercase mb-1">
                      {pos.counterparty}
                    </h3>

                    <div className="flex items-center gap-4 text-[8px] font-mono text-slate-600 mb-3">
                      <span>{pos.type}</span>
                      {pos.daysToMaturity > 0 ? (
                        <span className="flex items-center gap-1">
                          <Clock size={9} />
                          {pos.daysToMaturity}д до матуриті
                        </span>
                      ) : (
                        <span className="text-red-600 font-black flex items-center gap-1">
                          <AlertTriangle size={9} /> ПРОСТРОЧЕНО
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-[7px] text-slate-700 uppercase tracking-wider">Експозиція</p>
                        <p className="text-[13px] font-black text-white font-mono">{pos.exposure}</p>
                      </div>
                      <div>
                        <p className="text-[7px] text-slate-700 uppercase tracking-wider">Під ризиком</p>
                        <p className="text-[13px] font-black font-mono" style={{ color: RISK_COLOR[pos.riskLevel] }}>{pos.atRisk}</p>
                      </div>
                    </div>

                    <div className="mt-3 p-3 border border-slate-800/40 flex items-center gap-2">
                      <AlertTriangle size={11} className="text-amber-600 shrink-0" />
                      <span className="text-[9px] font-black text-slate-500">{pos.trigger}</span>
                    </div>
                  </div>

                  {/* Тренд */}
                  <div className="shrink-0">
                    {pos.trend === 'up'
                      ? <TrendingUp size={20} className="text-red-600" />
                      : pos.trend === 'down'
                      ? <TrendingDown size={20} className="text-emerald-600" />
                      : <Activity size={20} className="text-amber-700" />}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Права панель */}
          <div className="lg:col-span-5 space-y-5">

            {/* Деталі позиції */}
            <AnimatePresence mode="wait">
              {selectedPos && (
                <motion.div
                  key={selectedPos.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-black border border-red-900/30 p-6 space-y-5"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[8px] font-black font-mono text-slate-700">{selectedPos.id}</span>
                      <span className="text-[7px] font-black px-2 py-0.5 uppercase" style={{ color: RISK_COLOR[selectedPos.riskLevel], borderColor: RISK_COLOR[selectedPos.riskLevel] + '40', backgroundColor: RISK_COLOR[selectedPos.riskLevel] + '15' }}>
                        {RISK_LABEL[selectedPos.riskLevel]}
                      </span>
                    </div>
                    <h2 className="text-[14px] font-black text-white uppercase">{selectedPos.counterparty}</h2>
                    <p className="text-[9px] text-slate-600 mt-0.5">{selectedPos.country} · {selectedPos.type}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { l: 'Загальна експозиція', v: selectedPos.exposure, c: 'text-white' },
                      { l: 'Під ризиком',         v: selectedPos.atRisk,   c: 'text-red-400' },
                      { l: 'Ризик %',             v: `${selectedPos.riskPct}%`, c: 'text-red-400' },
                      { l: 'Днів до матуриті',    v: selectedPos.daysToMaturity > 0 ? `${selectedPos.daysToMaturity}д` : 'ПРОСТРОЧЕНО', c: selectedPos.daysToMaturity > 0 ? 'text-slate-300' : 'text-red-500' },
                    ].map((f, i) => (
                      <div key={i} className="p-4 border border-slate-800/40 bg-slate-950/40">
                        <p className="text-[7px] text-slate-700 uppercase font-black">{f.l}</p>
                        <p className={cn("text-[16px] font-black font-mono mt-1", f.c)}>{f.v}</p>
                      </div>
                    ))}
                  </div>

                  {/* Тригер */}
                  <div className="p-4 border border-red-900/30 bg-red-950/10">
                    <p className="text-[7px] font-black text-red-700 uppercase tracking-widest mb-2">ТРИГЕР РИЗИКУ</p>
                    <p className="text-[11px] font-black text-red-400">{selectedPos.trigger}</p>
                  </div>

                  {/* Рекомендована дія */}
                  <div className="p-4 border border-amber-900/30 bg-amber-950/10">
                    <p className="text-[7px] font-black text-amber-700 uppercase tracking-widest mb-2">РЕКОМЕНДОВАНА ДІЯ</p>
                    <p className="text-[11px] font-black text-amber-400">{selectedPos.action}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button className="py-3 bg-red-700 text-white text-[8px] font-black uppercase tracking-wider hover:bg-red-600 transition-colors flex items-center justify-center gap-2">
                      <Zap size={12} /> ЕСКАЛАЦІЯ
                    </button>
                    <button className="py-3 bg-slate-900 border border-slate-700/50 text-slate-300 text-[8px] font-black uppercase tracking-wider hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                      <Eye size={12} /> ПОВНЕ ДОСЬЄ
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* P&L Динаміка */}
            <div className="bg-black border border-slate-800/50 p-6">
              <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.45em] mb-5 flex items-center gap-2">
                <Activity size={12} className="text-red-700" />
                РИЗИК 24г · $M
              </h3>
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={RISK_TIMELINE} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="t" tick={{ fill: '#475569', fontSize: 8 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#020008', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 0 }}
                      formatter={(v: number) => [`$${v}M`, 'Ризик']}
                    />
                    <ReferenceLine y={130} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={0.8} />
                    <Area type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={2} fill="url(#riskGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Розподіл ризику pie */}
            <div className="bg-black border border-slate-800/50 p-6">
              <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.45em] mb-4">
                РОЗПОДІЛ РИЗИКУ ЗА ТИПОМ
              </h3>
              <div className="flex items-center gap-6">
                <PieChart width={120} height={120}>
                  <Pie data={RISK_BREAKDOWN} innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value" cx="50%" cy="50%">
                    {RISK_BREAKDOWN.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
                  </Pie>
                </PieChart>
                <div className="space-y-2 flex-1">
                  {RISK_BREAKDOWN.map((r, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                        <span className="text-[9px] font-black text-slate-500">{r.name}</span>
                      </div>
                      <span className="text-[9px] font-black text-white font-mono">{r.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ризик по секторах */}
            <div className="bg-black border border-slate-800/50 p-6">
              <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.45em] mb-5 flex items-center gap-2">
                <BarChart3 size={12} className="text-amber-700" />
                РИЗИК ПО СЕКТОРАХ ($M)
              </h3>
              <div className="h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={SECTOR_RISK} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="sector" tick={{ fill: '#475569', fontSize: 8 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#020008', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 0 }} />
                    <Bar dataKey="exposure" name="Портфель" fill="#1e293b" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="risk"     name="Ризик"    fill="#ef4444" radius={[2, 2, 0, 0]} opacity={0.9} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioRiskView;
