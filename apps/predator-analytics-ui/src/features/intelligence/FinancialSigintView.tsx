/**
 * 💰 ФІНАНСОВА РОЗВІДКА — Financial SIGINT | v56.4
 * PREDATOR Analytics — Модуль Транзакційного Аналізу
 *
 * SWIFT/SEPA потоки, офшорні структури, аномалії транзакцій,
 * аудит цін контрактів, трекер заморожених активів.
 * Sovereign Power Design · Classified · Tier-1
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Globe, AlertTriangle, Lock,
  Activity, DollarSign, Eye, Search, RefreshCw,
  ArrowUpRight, ArrowDownRight, Shield, Zap,
  BarChart3, Filter, Download, Bell, Target,
  Clock, CheckCircle, XCircle, ChevronRight
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { cn } from '@/utils/cn';
import { apiClient as api } from '@/services/api/config';

// ─── MOCK DATA ────────────────────────────────────────────────────────

const SWIFT_FLOW_DATA = [
  { hour: '00:00', normal: 12, suspicious: 0.2 },
  { hour: '02:00', normal: 8,  suspicious: 2.1 },
  { hour: '04:00', normal: 5,  suspicious: 0.4 },
  { hour: '06:00', normal: 18, suspicious: 0.6 },
  { hour: '08:00', normal: 45, suspicious: 1.2 },
  { hour: '10:00', normal: 78, suspicious: 3.8 },
  { hour: '12:00', normal: 120, suspicious: 12.4 },
  { hour: '14:00', normal: 95, suspicious: 4.1 },
  { hour: '16:00', normal: 84, suspicious: 2.9 },
  { hour: '18:00', normal: 62, suspicious: 1.7 },
  { hour: '20:00', normal: 38, suspicious: 0.8 },
  { hour: '22:00', normal: 22, suspicious: 0.3 },
];

const OFFSHORE_DATA = [
  { name: 'BVI', value: 38, amount: '$142M', color: '#ef4444' },
  { name: 'Кіпр', value: 27, amount: '$98M',  color: '#f59e0b' },
  { name: 'ОАЕ',  value: 18, amount: '$67M',  color: '#dc2626' },
  { name: 'Белізе', value: 11, amount: '$41M', color: '#991b1b' },
  { name: 'Інші', value: 6,  amount: '$22M',  color: '#64748b' },
];

const SUSPICIOUS_TX = [
  {
    id: 'TX-8821',
    from: 'ТОВ "АГРО-ЛІДЕР"',
    to: 'Kyoto Holdings Ltd (BVI)',
    amount: '$4.7M',
    currency: 'USD',
    time: '12:14:22',
    risk: 'КРИТИЧНИЙ',
    type: 'Shell Company',
    route: 'UA → BVI → ОАЕ',
    flagged: true,
  },
  {
    id: 'TX-7203',
    from: 'БФ "ВІДРОДЖЕННЯ"',
    to: 'Sunrise Capital Ltd (CY)',
    amount: '$2.1M',
    currency: 'USD',
    time: '10:47:08',
    risk: 'ВИСОКИЙ',
    type: 'Layering',
    route: 'UA → CY → MT',
    flagged: true,
  },
  {
    id: 'TX-6654',
    from: 'ПРАТ "СХІД-ТРЕЙД"',
    to: 'Nordic Consult AB',
    amount: '$890K',
    currency: 'EUR',
    time: '09:23:41',
    risk: 'СЕРЕДНІЙ',
    type: 'Structuring',
    route: 'UA → SE → LU',
    flagged: false,
  },
  {
    id: 'TX-5509',
    from: 'ФОП ТКАЧЕНКО В.М.',
    to: 'Gulf Meridian FZCO (UAE)',
    amount: '$1.4M',
    currency: 'AED',
    time: '08:55:19',
    risk: 'КРИТИЧНИЙ',
    type: 'PEP Exposure',
    route: 'UA → AE → SA',
    flagged: true,
  },
  {
    id: 'TX-4412',
    from: 'ТОВ "МЕТАЛ-ГРУПП"',
    to: 'Belize Trust Corp',
    amount: '$3.2M',
    currency: 'USD',
    time: '07:14:55',
    risk: 'КРИТИЧНИЙ',
    type: 'Sanctions Nexus',
    route: 'UA → BZ → PA',
    flagged: true,
  },
];

const FROZEN_ASSETS = [
  { entity: 'ПУМБ Рахунок 4521', amount: '$12.4M', date: '2024-12-01', authority: 'РНБО', reason: 'Санкційний список', status: 'ЗАМОРОЖЕНО' },
  { entity: 'ТОВ "АЛЬФА-ХОЛДИНГ"', amount: '$7.8M',  date: '2025-01-15', authority: 'EU SDN', reason: 'Фінансування агресії', status: 'ЗАМОРОЖЕНО' },
  { entity: 'Нерухомість вул. Хрещатик 14А', amount: '$3.1M', date: '2025-02-20', authority: 'НАБУ', reason: 'Справа 1042/2025', status: 'В РОЗГЛЯДІ' },
  { entity: 'Яхта "SOVEREIGN"', amount: '$18.5M', date: '2025-03-08', authority: 'MAS', reason: 'Ухилення від санкцій', status: 'КОНФІСКОВАНО' },
];

type ActiveModule = 'swift' | 'offshore' | 'contracts' | 'frozen';

// ─── КОМПОНЕНТ ────────────────────────────────────────────────────────

const FinancialSigintView: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ActiveModule>('swift');
  const [txFilter, setTxFilter] = useState<'all' | 'flagged' | 'critical'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState(4);

  // Live alert counter simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveAlerts(prev => prev + (Math.random() > 0.7 ? 1 : 0));
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 1400));
    setRefreshing(false);
  };

  const filteredTx = SUSPICIOUS_TX.filter(tx => {
    if (txFilter === 'flagged') return tx.flagged;
    if (txFilter === 'critical') return tx.risk === 'КРИТИЧНИЙ';
    return true;
  }).filter(tx =>
    searchQuery === '' ||
    tx.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const modules: Array<{ id: ActiveModule; label: string; icon: React.ElementType; count?: number | string; badge?: string }> = [
    { id: 'swift',     label: 'SWIFT/SEPA Монітор',      icon: Activity,    count: liveAlerts, badge: 'LIVE' },
    { id: 'offshore',  label: 'Офшорний Детектор',        icon: Globe,       count: '247',      badge: 'NEW' },
    { id: 'contracts', label: 'Аудит Цін Договорів',      icon: BarChart3,   count: '18' },
    { id: 'frozen',    label: 'Трекер Заморожених Активів', icon: Lock,      count: FROZEN_ASSETS.length },
  ];

  return (
    <div className="min-h-screen text-slate-200 font-sans pb-24 relative overflow-hidden">
      {/* Суверенний фон */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 30%, rgba(220,38,38,0.04) 0%, transparent 55%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 80% 70%, rgba(180,83,9,0.03) 0%, transparent 55%)' }} />
      </div>

      <div className="relative z-10 max-w-[1700px] mx-auto p-6 space-y-8">

        {/* ── ЗАГОЛОВОК ── */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-rose-700/20 blur-2xl rounded-full" />
              <div className="relative p-5 bg-black border border-rose-800/50 shadow-2xl">
                <TrendingUp size={38} className="text-rose-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="w-1 h-1 bg-rose-600 rounded-full animate-pulse" />
                <span className="text-[8px] font-black text-rose-700/70 uppercase tracking-[0.5em]">
                  ФІНАНСОВА · РОЗВІДКА · CLASSIFIED · v56.4
                </span>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
                FINANCIAL{' '}
                <span className="text-rose-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]">SIGINT</span>
              </h1>
              <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.3em] mt-1">
                МОНІТОРИНГ ПОТОКІВ · ОФШОРНИЙ СКАН · АУДИТ ЦІН · ЗАМОРОЖЕНІ АКТИВИ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live alerts badge */}
            <div className="flex items-center gap-3 px-5 py-3 bg-black border border-rose-900/40 text-rose-400">
              <Bell size={15} className="animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest">{liveAlerts} ТРИВОГИ</span>
              <span className="w-2 h-2 bg-rose-600 rounded-full shadow-[0_0_8px_rgba(239,68,68,1)] animate-ping" />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-8 py-3 bg-black border border-rose-900/40 text-slate-400 text-[9px] font-black uppercase tracking-wider hover:border-rose-700/60 hover:text-white transition-all flex items-center gap-3"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin text-rose-500' : ''} />
              {refreshing ? 'СКАНУЄМО...' : 'ОНОВИТИ'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
              className="px-8 py-3 bg-rose-700 text-white text-[9px] font-black uppercase tracking-wider shadow-[0_0_25px_rgba(239,68,68,0.3)] flex items-center gap-2 border border-rose-500/40 hover:bg-rose-600 transition-colors"
            >
              <Download size={14} />
              ЗВІТ_SIGINT
            </motion.button>
          </div>
        </div>

        {/* ── МЕТРИКИ ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'ПІДОЗРІЛИЙ ОБІГ', value: '$370M',  sub: 'За 24 години',       icon: DollarSign, color: '#ef4444', bar: 78 },
            { label: 'SHELL КОМПАНІЙ', value: '247',      sub: 'Активних офшорів',   icon: Globe,      color: '#f59e0b', bar: 62 },
            { label: 'АНОМАЛІЇ ЦІН',   value: '18',       sub: 'Підозрілих договорів', icon: BarChart3, color: '#dc2626', bar: 45 },
            { label: 'ЗАМОРОЖЕНО',      value: '$41.8M',  sub: 'Загальна сума',      icon: Lock,       color: '#991b1b', bar: 85 },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="p-7 bg-black border border-rose-900/20 hover:border-rose-800/40 transition-all relative overflow-hidden group"
            >
              <div className="absolute -right-3 -bottom-3 opacity-5 group-hover:opacity-10 transition-opacity">
                <m.icon size={80} style={{ color: m.color }} />
              </div>
              <div className="space-y-3 relative z-10">
                <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.4em]">{m.label}</p>
                <h3 className="text-3xl font-black text-white font-mono tracking-tighter">{m.value}</h3>
                <p className="text-[9px] text-slate-600 uppercase tracking-wider font-black">{m.sub}</p>
                <div className="h-0.5 w-full bg-slate-900 overflow-hidden rounded-full">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${m.bar}%` }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.8 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: m.color }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── МОДУЛІ (табки) ── */}
        <div className="flex flex-wrap gap-2 p-2 bg-black/80 border border-rose-900/25 w-fit">
          {modules.map((mod) => (
            <button
              key={mod.id}
              onClick={() => setActiveModule(mod.id)}
              className={cn(
                "flex items-center gap-3 px-6 py-3 text-[9px] font-black uppercase tracking-[0.25em] transition-all border border-transparent",
                activeModule === mod.id
                  ? "bg-rose-700 text-white border-rose-500/40 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                  : "text-slate-600 hover:text-slate-300 hover:bg-rose-950/20"
              )}
            >
              <mod.icon size={14} />
              {mod.label}
              {mod.count !== undefined && (
                <span className={cn(
                  "px-2 py-0.5 text-[7px] font-black rounded-sm",
                  mod.badge === 'LIVE' ? "bg-rose-600/80 text-white animate-pulse" :
                  mod.badge === 'NEW' ? "bg-amber-700/60 text-amber-200" :
                  "bg-slate-800 text-slate-400"
                )}>
                  {mod.badge === 'LIVE' ? `▲ ${mod.count}` : mod.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── АКТИВНИЙ МОДУЛЬ ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeModule}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-6"
          >

            {/* SWIFT МОНІТОР */}
            {activeModule === 'swift' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Граф потоків */}
                <div className="lg:col-span-7 bg-black border border-rose-900/20 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
                      <Activity size={14} className="text-rose-600" />
                      ПОТОКИ ТРАНЗАКЦІЙ (24г) · $M
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-rose-600 rounded-full animate-ping" />
                      <span className="text-[8px] font-black text-rose-600 uppercase tracking-widest">НАЖИВО</span>
                    </div>
                  </div>
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={SWIFT_FLOW_DATA} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gradNormal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#475569" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#475569" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gradSuspicious" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="hour" stroke="#334155" tick={{ fill: '#475569', fontSize: 9, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                        <YAxis stroke="#334155" tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ background: '#020008', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 0, backdropFilter: 'blur(20px)' }}
                          labelStyle={{ color: '#94a3b8', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}
                          itemStyle={{ color: '#ef4444', fontSize: 10, fontWeight: 900 }}
                        />
                        <Area type="monotone" dataKey="normal" name="Звичайні" stroke="#475569" fill="url(#gradNormal)" strokeWidth={1.5} strokeDasharray="4 4" />
                        <Area type="monotone" dataKey="suspicious" name="Підозрілі" stroke="#ef4444" fill="url(#gradSuspicious)" strokeWidth={2.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Легенда */}
                  <div className="flex items-center gap-6 mt-4 pt-4 border-t border-rose-900/15">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-0.5 border-t border-dashed border-slate-600" />
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">Звичайні ($M)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-0.5 bg-rose-600" />
                      <span className="text-[9px] font-black text-rose-600 uppercase tracking-wider">Підозрілі ($M)</span>
                    </div>
                  </div>
                </div>

                {/* Список підозрілих транзакцій */}
                <div className="lg:col-span-5 bg-black border border-rose-900/20 flex flex-col">
                  <div className="p-6 border-b border-rose-900/15 flex items-center justify-between">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
                      ПІДОЗРІЛІ ТРАНЗАКЦІЇ
                    </h2>
                    <div className="flex gap-2">
                      {(['all', 'flagged', 'critical'] as const).map(f => (
                        <button
                          key={f}
                          onClick={() => setTxFilter(f)}
                          className={cn(
                            "px-3 py-1 text-[7px] font-black uppercase tracking-wider border transition-all",
                            txFilter === f
                              ? "bg-rose-700 text-white border-rose-500/40"
                              : "bg-transparent text-slate-600 border-rose-900/20 hover:text-slate-300"
                          )}
                        >
                          {f === 'all' ? 'УСІ' : f === 'flagged' ? 'ПОМІЧЕНІ' : 'КРИТИЧНІ'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Пошук */}
                  <div className="px-6 py-3 border-b border-rose-900/10">
                    <div className="flex items-center gap-3 text-slate-700">
                      <Search size={13} />
                      <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Пошук за назвою або ID..."
                        className="flex-1 bg-transparent text-[11px] text-white outline-none placeholder:text-slate-700 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {filteredTx.map((tx, i) => (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                        className="p-5 border-b border-rose-900/10 hover:bg-rose-950/15 transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            {tx.flagged && (
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shadow-[0_0_6px_rgba(239,68,68,0.8)] animate-pulse" />
                            )}
                            <span className="text-[8px] font-black font-mono text-rose-700">{tx.id}</span>
                            <span className={cn(
                              "text-[7px] font-black px-2 py-0.5 uppercase tracking-wider",
                              tx.risk === 'КРИТИЧНИЙ' ? "bg-rose-700/30 text-rose-400 border border-rose-700/40" :
                              tx.risk === 'ВИСОКИЙ'   ? "bg-amber-700/20 text-amber-500 border border-amber-700/30" :
                                                        "bg-slate-800 text-slate-500 border border-slate-700/40"
                            )}>
                              {tx.risk}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[8px] font-mono text-slate-700">
                            <Clock size={10} />
                            {tx.time}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] text-slate-700 w-8 font-black uppercase">ВІД:</span>
                            <span className="text-[10px] font-black text-slate-300 group-hover:text-white transition-colors">{tx.from}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] text-slate-700 w-8 font-black uppercase">ДО:</span>
                            <span className="text-[10px] font-black text-rose-400">{tx.to}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-rose-900/10">
                          <div className="flex items-center gap-4">
                            <span className="text-[13px] font-black text-white font-mono">{tx.amount}</span>
                            <span className="text-[8px] text-slate-600 font-black uppercase tracking-wider">{tx.type}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[8px] text-slate-600 group-hover:text-rose-500 transition-colors">
                            <ArrowUpRight size={11} />
                            <span className="font-mono">{tx.route}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ОФШОРНИЙ ДЕТЕКТОР */}
            {activeModule === 'offshore' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 bg-black border border-rose-900/20 p-8">
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                    <Globe size={14} className="text-amber-600" />
                    РОЗПОДІЛ ОФШОРНИХ СТРУКТУР
                  </h2>
                  <div className="flex items-center justify-center">
                    <PieChart width={260} height={260}>
                      <Pie data={OFFSHORE_DATA} innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="value" cx="50%" cy="50%">
                        {OFFSHORE_DATA.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#020008', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 0 }}
                        formatter={(val: number) => [`${val}%`]}
                      />
                    </PieChart>
                  </div>
                  <div className="space-y-3 mt-4">
                    {OFFSHORE_DATA.map(d => (
                      <div key={d.name} className="flex items-center justify-between p-3 border border-rose-900/15 hover:border-rose-800/30 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-[10px] font-black text-slate-400">{d.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[11px] font-black text-white font-mono">{d.amount}</span>
                          <span className="text-[8px] text-slate-600 font-mono">{d.value}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-7 bg-black border border-rose-900/20 p-8">
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                    <Target size={14} className="text-rose-600" />
                    ВИЯВЛЕНІ SHELL-СТРУКТУРИ · ТОП РИЗИКУ
                  </h2>
                  <div className="space-y-4">
                    {[
                      { name: 'Kyoto Holdings Ltd',   jur: 'BVI',    links: 14, risk: 97, amount: '$47M', ubo: 'ВСТАНОВЛЕНО' },
                      { name: 'Sunrise Capital Ltd',  jur: 'Кіпр',   links: 8,  risk: 89, amount: '$21M', ubo: 'ЧАСТКОВО' },
                      { name: 'Gulf Meridian FZCO',   jur: 'ОАЕ',    links: 11, risk: 94, amount: '$31M', ubo: 'ВСТАНОВЛЕНО' },
                      { name: 'Belize Trust Corp',    jur: 'Белізе', links: 5,  risk: 82, amount: '$18M', ubo: 'НЕВІДОМО' },
                      { name: 'Nordic Consult AB',    jur: 'Швеція', links: 3,  risk: 61, amount: '$8M',  ubo: 'ЧАСТКОВО' },
                    ].map((s, i) => (
                      <motion.div
                        key={s.name}
                        initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                        className="p-5 border border-rose-900/15 hover:border-rose-700/35 bg-black hover:bg-rose-950/10 transition-all group cursor-pointer relative overflow-hidden"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-[13px] font-black text-white group-hover:text-rose-300 transition-colors uppercase">{s.name}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[8px] font-black text-slate-600 bg-slate-900 px-2 py-0.5 border border-slate-800">{s.jur}</span>
                              <span className="text-[8px] text-slate-600 font-mono">{s.links} зв'язків</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[15px] font-black text-white font-mono">{s.amount}</div>
                            <div className={cn(
                              "text-[8px] font-black uppercase mt-1",
                              s.ubo === 'ВСТАНОВЛЕНО' ? "text-emerald-500" :
                              s.ubo === 'ЧАСТКОВО'    ? "text-amber-500"   : "text-rose-600"
                            )}>
                              UBO: {s.ubo}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[7px] font-black text-slate-700 uppercase tracking-wider">РИЗИК СКОР</span>
                            <span className="text-[10px] font-black text-rose-500 font-mono">{s.risk}%</span>
                          </div>
                          <div className="h-1 bg-slate-900 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }} animate={{ width: `${s.risk}%` }}
                              transition={{ delay: 0.3 + i * 0.07 }}
                              className="h-full bg-gradient-to-r from-amber-700 to-rose-600"
                            />
                          </div>
                        </div>
                        <div className="absolute inset-y-0 right-0 w-0.5 bg-rose-700/0 group-hover:bg-rose-700/60 transition-all" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* АУДИТ ЦІН ДОГОВОРІВ */}
            {activeModule === 'contracts' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-black border border-rose-900/20 p-8">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                      <BarChart3 size={14} className="text-amber-600" />
                      ВІДХИЛЕННЯ ВІД РИНКОВОЇ ЦІНИ
                    </h2>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: 'Зерно', market: 320, contract: 540, diff: 69 },
                            { name: 'Сталь', market: 850, contract: 920, diff: 8 },
                            { name: 'Нафта', market: 720, contract: 1280, diff: 78 },
                            { name: 'Хімія', market: 480, contract: 510, diff: 6 },
                            { name: 'Зброя', market: 2100, contract: 4700, diff: 124 },
                            { name: 'Ліки', market: 95, contract: 310, diff: 226 },
                          ]}
                          margin={{ top: 5, right: 0, left: -25, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                          <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 9, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ background: '#020008', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 0 }}
                            formatter={(val: number, name: string) => [
                              `$${val}`, name === 'market' ? 'Ринок' : 'Договір'
                            ]}
                          />
                          <Bar dataKey="market"   name="market"   fill="#334155" radius={[2, 2, 0, 0]} />
                          <Bar dataKey="contract" name="contract" fill="#ef4444" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-black border border-rose-900/20 p-8">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6">ТОП АНОМАЛІЙ ЦІН</h2>
                    <div className="space-y-3">
                      {[
                        { item: 'Ліки (Paracetamol 1000mg)', over: '+226%', amount: '$310 vs $95 ринок', risk: 'КРИТИЧНИЙ' },
                        { item: 'Боєприпаси 7.62mm',          over: '+124%', amount: '$4,700 vs $2,100', risk: 'КРИТИЧНИЙ' },
                        { item: 'Пальне ДП-Євро5',             over: '+78%',  amount: '$1,280 vs $720',  risk: 'ВИСОКИЙ' },
                        { item: 'Пшениця 2 сорт',              over: '+69%',  amount: '$540 vs $320',    risk: 'ВИСОКИЙ' },
                        { item: 'Прокат сталевий горячекат.',  over: '+8%',   amount: '$920 vs $850',    risk: 'СЕРЕДНІЙ' },
                      ].map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border border-rose-900/15 hover:border-rose-700/30 bg-black hover:bg-rose-950/10 transition-all cursor-pointer">
                          <div>
                            <p className="text-[10px] font-black text-slate-300">{c.item}</p>
                            <p className="text-[8px] text-slate-600 font-mono mt-0.5">{c.amount}</p>
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <div>
                              <p className="text-[13px] font-black text-rose-400 font-mono">{c.over}</p>
                              <p className={cn(
                                "text-[7px] font-black uppercase tracking-wider",
                                c.risk === 'КРИТИЧНИЙ' ? "text-rose-600" : c.risk === 'ВИСОКИЙ' ? "text-amber-500" : "text-slate-500"
                              )}>{c.risk}</p>
                            </div>
                            <ArrowUpRight size={16} className="text-rose-700" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ТРЕКЕР ЗАМОРОЖЕНИХ АКТИВІВ */}
            {activeModule === 'frozen' && (
              <div className="bg-black border border-rose-900/25 overflow-hidden">
                <div className="p-6 border-b border-rose-900/20 flex items-center justify-between">
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
                    <Lock size={14} className="text-rose-600" />
                    ЗАМОРОЖЕНІ АКТИВИ · ПОТОЧНИЙ СТАТУС
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-slate-600 font-mono">
                      ВСЬОГО ЗАМОРОЖЕНО: <span className="text-rose-500">$41.8M</span>
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-rose-900/15 bg-rose-950/5">
                        {['Об\'єкт', 'Сума', 'Дата', 'Орган', 'Підстава', 'Статус'].map(h => (
                          <th key={h} className="px-6 py-4 text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {FROZEN_ASSETS.map((asset, i) => (
                        <motion.tr
                          key={i}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08 }}
                          className="border-b border-rose-900/10 hover:bg-rose-950/15 transition-colors cursor-pointer group"
                        >
                          <td className="px-6 py-5 font-black text-white text-[11px] group-hover:text-rose-300 transition-colors">{asset.entity}</td>
                          <td className="px-6 py-5 font-black text-rose-400 font-mono text-[12px]">{asset.amount}</td>
                          <td className="px-6 py-5 text-slate-600 font-mono text-[10px]">{asset.date}</td>
                          <td className="px-6 py-5">
                            <span className="text-[8px] font-black bg-rose-900/20 text-rose-500 border border-rose-800/30 px-2 py-1">{asset.authority}</span>
                          </td>
                          <td className="px-6 py-5 text-slate-500 text-[10px] font-black">{asset.reason}</td>
                          <td className="px-6 py-5">
                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-widest px-3 py-1.5 border",
                              asset.status === 'ЗАМОРОЖЕНО'   ? "bg-slate-900 text-slate-400 border-slate-700/40 flex items-center gap-2" :
                              asset.status === 'КОНФІСКОВАНО' ? "bg-rose-900/25 text-rose-500 border-rose-700/40 flex items-center gap-2" :
                                                                 "bg-amber-900/20 text-amber-500 border-amber-700/30 flex items-center gap-2"
                            )}>
                              {asset.status === 'ЗАМОРОЖЕНО'   && <Lock size={9} />}
                              {asset.status === 'КОНФІСКОВАНО' && <Shield size={9} />}
                              {asset.status === 'В РОЗГЛЯДІ'   && <Clock size={9} />}
                              {asset.status}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Нижній рядок статусу */}
                <div className="p-6 border-t border-rose-900/15 flex items-center justify-between">
                  <p className="text-[8px] font-mono text-slate-700 uppercase tracking-widest">
                    ДЖЕРЕЛА: РНБО · EU SDN · НАБУ · OFAC · MAS · HM Treasury
                  </p>
                  <button className="flex items-center gap-2 text-[8px] font-black text-rose-700 hover:text-rose-500 transition-colors uppercase tracking-wider">
                    <Download size={12} />
                    Вивантажити реєстр
                  </button>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(239,68,68,0.12); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(239,68,68,0.28); }
      `}} />
    </div>
  );
};

export default FinancialSigintView;
