/**
 * 💰 FINANCIAL SIGINT // ФІНАНСОВА РОЗВІДКА | v56.2-TITAN
 * PREDATOR Analytics — Transactional & Offshore Intelligence
 * 
 * Моніторинг SWIFT/SEPA, офшорні структури, аномалії цін,
 * заморожені активи та AML-скоринг.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Globe, AlertTriangle, Lock,
  Activity, DollarSign, Eye, Search, RefreshCw,
  ArrowUpRight, ArrowDownRight, Shield, Zap,
  BarChart3, Filter, Download, Bell, Target,
  Clock, CheckCircle, XCircle, ChevronRight,
  ShieldAlert, Landmark, Wallet, Layers, Fingerprint,
  Crosshair, Briefcase, FileText, Share2, Network,
  CreditCard, Coins, Scale, Siren, Skull, Cpu, ShieldCheck
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { cn } from '@/lib/utils';
import { apiClient as api } from '@/services/api/config';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/TacticalCard';
import { CyberGrid } from '@/components/CyberGrid';
import { CyberOrb } from '@/components/CyberOrb';

// ─── MOCK DATA ────────────────────────────────────────────────────────

const SWIFT_FLOW_DATA = [
  { hour: '00:00', normal: 12, suspicious: 0.2 },
  { hour: '04:00', normal: 5,  suspicious: 0.4 },
  { hour: '08:00', normal: 45, suspicious: 1.2 },
  { hour: '12:00', normal: 120, suspicious: 12.4 },
  { hour: '16:00', normal: 84, suspicious: 2.9 },
  { hour: '20:00', normal: 38, suspicious: 0.8 },
  { hour: '23:59', normal: 14, suspicious: 0.3 },
];

const OFFSHORE_DATA = [
  { name: 'БРИТ. ВІРГ. О-ВИ', value: 38, amount: '$142.5M', color: '#ef4444' },
  { name: 'КІПР', value: 27, amount: '$98.2M',  color: '#f59e0b' },
  { name: 'ОАЕ',  value: 18, amount: '$67.0M',  color: '#dc2626' },
  { name: 'БЕЛІЗ', value: 11, amount: '$41.1M', color: '#991b1b' },
  { name: 'ІНШІ', value: 6,  amount: '$22.0M',  color: '#64748b' },
];

const SUSPICIOUS_TX = [
  { id: 'TX-8821', from: 'ТОВ "АГРО-ЛІДЕР"', to: 'Kyoto Holdings Ltd (BVI)', amount: '$4.7M', currency: 'USD', time: '12:14:22', risk: 'КРИТИЧНИЙ', type: 'Shell Company', route: 'UA → BVI → ОАЕ', flagged: true },
  { id: 'TX-7203', from: 'БФ "ВІДРОДЖЕННЯ"', to: 'Sunrise Capital Ltd (CY)', amount: '$2.1M', currency: 'USD', time: '10:47:08', risk: 'ВИСОКИЙ', type: 'Layering', route: 'UA → CY → MT', flagged: true },
  { id: 'TX-5509', from: 'ФОП ТКАЧЕНКО В.М.', to: 'Gulf Meridian FZCO (UAE)', amount: '$1.4M', currency: 'AED', time: '08:55:19', risk: 'КРИТИЧНИЙ', type: 'PEP Exposure', route: 'UA → AE → SA', flagged: true },
  { id: 'TX-4412', from: 'ТОВ "МЕТАЛ-ГРУП"', to: 'Belize Trust Corp (BZ)', amount: '$3.2M', currency: 'USD', time: '07:14:55', risk: 'КРИТИЧНИЙ', type: 'Sanctions Nexus', route: 'UA → BZ → PA', flagged: true },
];

const FROZEN_ASSETS = [
  { entity: 'ПУМБ РАХУНОК 4521', amount: '$12.4M', date: '2025-12-01', authority: 'РНБО', reason: 'Санкційний список', status: 'ЗАМОРОЖЕНО' },
  { entity: 'ТОВ "АЛЬФА-ХОЛДИНГ"', amount: '$7.8M',  date: '2026-01-15', authority: 'EU SDN', reason: 'Фінансування агресії', status: 'ЗАМОРОЖЕНО' },
  { entity: 'ЯХТА "SOVEREIGN"', amount: '$18.5M', date: '2026-03-08', authority: 'MAS', reason: 'Ухилення від санкцій', status: 'КОНФІСКОВАНО' },
];

const AML_RADAR_DATA = [
  { subject: 'СТРУКТУРУВАННЯ', A: 120, B: 110, fullMark: 150 },
  { subject: 'ШАЙРУВАННЯ', A: 98, B: 130, fullMark: 150 },
  { subject: 'ОФШОРИЗАЦІЯ', A: 86, B: 130, fullMark: 150 },
  { subject: 'PEP-РИЗИК', A: 99, B: 100, fullMark: 150 },
  { subject: 'САНКЦІЇ', A: 85, B: 90, fullMark: 150 },
  { subject: 'ТЕР ПОТОКИ', A: 65, B: 85, fullMark: 150 },
];

type ActiveModule = 'swift' | 'offshore' | 'contracts' | 'frozen' | 'aml';

export default function FinancialSigintView() {
  const [activeModule, setActiveModule] = useState<ActiveModule>('swift');
  const [refreshing, setRefreshing] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState(4);
  const [txFilter, setTxFilter] = useState<'all' | 'flagged' | 'critical'>('all');

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveAlerts(prev => prev + (Math.random() > 0.8 ? 1 : 0));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 2000));
    setRefreshing(false);
  };

  const modules: Array<{ id: ActiveModule; label: string; icon: React.ElementType; count?: number | string; badge?: string }> = [
    { id: 'swift',     label: 'SWIFT/SEPA МОНІТОР',      icon: Activity,    count: liveAlerts, badge: 'LIVE' },
    { id: 'offshore',  label: 'ОФШОРНИЙ ДЕТЕКТОР',        icon: Globe,       count: '247',      badge: 'NEW' },
    { id: 'contracts', label: 'АУДИТ ЦІН ДОГОВОРІВ',      icon: BarChart3,   count: '18' },
    { id: 'frozen',    label: 'ЗАМОРОЖЕНІ АКТИВИ',       icon: Lock,      count: FROZEN_ASSETS.length },
    { id: 'aml',       label: 'AML_СКОРИНГ_ШІ',          icon: ShieldCheck, badge: 'PRO' },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden font-sans pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(220,38,38,0.05),transparent_70%)] pointer-events-none" />
        <CyberGrid color="rgba(220, 38, 38, 0.03)" />
        
        <div className="relative z-10 max-w-[1700px] mx-auto p-6 lg:p-12 space-y-12">
           
           {/* HEADER HUD */}
           <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-10 py-6 border-b border-white/[0.04]">
              <div className="flex items-center gap-10">
                 <div className="relative group">
                    <div className="absolute inset-0 bg-rose-600/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <div className="relative p-7 bg-black border border-rose-900/40 rounded-[2.5rem] shadow-2xl">
                       <Landmark size={42} className="text-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.5)]" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <div className="flex items-center gap-3">
                       <span className="badge-v2 bg-rose-600/10 border border-rose-600/20 text-rose-500 px-3 py-1 text-[10px] font-black tracking-[0.3em] uppercase italic">
                         FINANCIAL_SIGINT // TRANSACTIONAL_RADAR
                       </span>
                       <div className="h-px w-10 bg-rose-600/20" />
                       <span className="text-[10px] font-black text-slate-700 font-mono tracking-widest uppercase italic">v56.2 TITAN</span>
                    </div>
                    <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-2deg] leading-none mb-1">
                      ФІНАНСОВА <span className="text-rose-600 underline decoration-rose-600/20 decoration-8 italic uppercase">РОЗВІДКА</span>
                    </h1>
                    <div className="flex items-center gap-4 text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic opacity-80 leading-none">
                       <Activity size={14} className="text-rose-600" /> 
                       <span>МОНІТОРИНГ ТРАНЗАКЦІЙ ТА ОФШОРНИХ ПОТОКІВ</span>
                       <span className="text-slate-800">|</span>
                       <span className="text-rose-500 animate-pulse flex items-center gap-2">
                          <Siren size={14} /> LIVE_ALERTS: {liveAlerts} СИГНАЛІВ_РИЗИКУ
                       </span>
                    </div>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <button onClick={handleRefresh} className={cn("p-5 bg-black border border-white/[0.04] rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl", refreshing && "animate-spin")}>
                    <RefreshCw size={24} />
                 </button>
                 <button className="px-10 py-5 bg-rose-700 text-white rounded-[1.2rem] text-[11px] font-black uppercase tracking-[0.3em] italic hover:bg-rose-600 shadow-2xl transition-all flex items-center gap-4">
                    <Wallet size={20} /> ГЕНЕРУВАТИ_РЕЄСТР_SIGINT
                 </button>
              </div>
           </header>

           {/* QUICK STATS */}
           <section className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { label: 'ПІДОЗРІЛИЙ ОБІГ', value: '$370.4M', sub: 'За 24 години', icon: DollarSign, color: '#ef4444', score: 84 },
                { label: 'SHELL КОМПАНІЙ', value: '247', sub: 'Активних офшорів', icon: Globe, color: '#f59e0b', score: 62 },
                { label: 'АНОМАЛІЇ ЦІН', value: '18', sub: 'Підозрілих договорів', icon: BarChart3, color: '#dc2626', score: 45 },
                { label: 'ЗАМОРОЖЕНО (Σ)', value: '$41.8M', sub: 'Загальна сума активів', icon: Lock, color: '#991b1b', score: 92 },
              ].map((m, i) => (
                <div key={i} className="p-8 rounded-[3rem] bg-black border border-white/[0.04] shadow-3xl group relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <m.icon size={120} style={{ color: m.color }} />
                   </div>
                   <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic mb-2">{m.label}</p>
                   <h3 className="text-4xl font-black text-white italic font-mono tracking-tighter mb-2 border-l-4 pl-4" style={{ borderColor: m.color }}>{m.value}</h3>
                   <div className="flex items-center justify-between text-[9px] font-black text-slate-800 uppercase italic tracking-widest mt-4">
                      <span>{m.sub}</span>
                      <span style={{ color: m.color }}>{m.score}% LVL</span>
                   </div>
                </div>
              ))}
           </section>

           {/* MODULE TABS HUB */}
           <div className="flex flex-wrap gap-4 p-3 bg-black/60 border border-white/[0.03] rounded-[2.5rem] w-fit shadow-2xl">
              {modules.map(mod => (
                <button 
                  key={mod.id} onClick={() => setActiveModule(mod.id)}
                  className={cn(
                    "px-8 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.2em] italic border transition-all flex items-center gap-3",
                    activeModule === mod.id ? "bg-rose-700 border-rose-500 text-white shadow-3xl" : "bg-transparent text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-300"
                  )}
                >
                   <mod.icon size={16} />
                   {mod.label}
                   {mod.badge && <span className="bg-white/10 text-[8px] px-2 py-0.5 rounded-full font-mono">{mod.badge}</span>}
                </button>
              ))}
           </div>

           {/* CONTENT HUD GRID */}
           <div className="grid grid-cols-12 gap-10">
              <AnimatePresence mode="wait">
                 {activeModule === 'swift' && (
                   <motion.div key="swift" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="col-span-12 grid grid-cols-12 gap-10">
                      <div className="col-span-12 xl:col-span-8 p-10 rounded-[3.5rem] bg-black border-2 border-white/[0.04] shadow-3xl space-y-8">
                         <div className="flex items-center justify-between mb-4 border-b border-white/[0.04] pb-6">
                            <h2 className="text-[14px] font-black text-white italic uppercase tracking-[0.4em] flex items-center gap-4">
                               <Activity size={24} className="text-rose-600 shadow-[0_0_10px_rgba(225,29,72,0.8)]" />
                               SWIFT_FLOW_DYNAMICS // ПОТОКИ_ТРАНЗАКЦІЙ
                            </h2>
                            <div className="flex items-center gap-4">
                               <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-slate-600" />
                                  <span className="text-[9px] font-black text-slate-600 uppercase italic">НОРМАЛЬНІ_ПОТОКИ</span>
                               </div>
                               <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                                  <span className="text-[9px] font-black text-rose-600 uppercase italic underline decoration-rose-600/40">ПІДОЗРІЛА_АКТИВНІСТЬ</span>
                               </div>
                            </div>
                         </div>
                         <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                               <AreaChart data={SWIFT_FLOW_DATA}>
                                  <defs>
                                     <linearGradient id="roseGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                     </linearGradient>
                                     <linearGradient id="slateGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#475569" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#475569" stopOpacity={0} />
                                     </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="5 5" stroke="rgba(255,255,255,0.02)" vertical={false} />
                                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }} />
                                  <Tooltip contentStyle={{ background: '#000', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '20px' }} itemStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                                  <Area type="monotone" dataKey="normal" stroke="#475569" strokeWidth={2} fill="url(#slateGrad)" />
                                  <Area type="monotone" dataKey="suspicious" stroke="#f43f5e" strokeWidth={4} fill="url(#roseGrad)" dot={{ r: 4, fill: '#f43f5e', strokeWidth: 0 }} />
                               </AreaChart>
                            </ResponsiveContainer>
                         </div>
                      </div>
                      <div className="col-span-12 xl:col-span-4 p-8 rounded-[3.5rem] bg-black border border-white/[0.04] shadow-3xl space-y-8 flex flex-col">
                         <h3 className="text-[12px] font-black text-rose-600 italic uppercase tracking-[0.4em] mb-6 border-b border-white/[0.04] pb-6">ПІДОЗРІЛІ_ТРАНЗАКЦІЇ_LIVE</h3>
                         <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pr-2">
                            {SUSPICIOUS_TX.map((tx, i) => (
                              <div key={tx.id} className="p-6 rounded-[2rem] bg-white/[0.01] border border-white/[0.03] hover:border-rose-600/30 transition-all group space-y-4">
                                 <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black font-mono text-rose-600 tracking-widest">{tx.id}</span>
                                    <span className="text-[8px] font-black text-slate-800 uppercase italic font-mono">{tx.time} // SIGNAL_F_14</span>
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-[12px] font-black text-white italic truncate">{tx.from}</p>
                                    <ArrowDownRight size={14} className="text-slate-800" />
                                    <p className="text-[12px] font-black text-rose-600 italic truncate uppercase">{tx.to}</p>
                                 </div>
                                 <div className="flex items-center justify-between pt-4 border-t border-white/[0.03]">
                                    <span className="text-xl font-black italic font-mono text-white">{tx.amount}</span>
                                    <span className="text-[9px] font-black text-rose-500 uppercase italic bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">{tx.risk}</span>
                                 </div>
                              </div>
                            ))}
                         </div>
                         <button className="w-full py-5 bg-rose-600/10 border border-rose-600/40 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-rose-600 hover:text-white shadow-2xl transition-all">
                            БЛОКУВАТИ ПОТІК
                         </button>
                      </div>
                   </motion.div>
                 )}

                 {activeModule === 'offshore' && (
                   <motion.div key="offshore" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="col-span-12 grid grid-cols-12 gap-10">
                      <div className="col-span-12 xl:col-span-5 p-10 rounded-[3.5rem] bg-black border border-white/[0.04] shadow-3xl space-y-10">
                         <h2 className="text-[12px] font-black text-amber-500 italic uppercase tracking-[0.4em] border-b border-white/[0.04] pb-6 flex items-center gap-4">
                            <Globe size={18} /> OFFSHORE_LIQUIDITY_MAP
                         </h2>
                         <div className="flex items-center justify-center p-8 bg-black/40 rounded-[3rem] border border-white/[0.02]">
                            <PieChart width={300} height={300}>
                               <Pie data={OFFSHORE_DATA} innerRadius={80} outerRadius={120} paddingAngle={4} dataKey="value" cx="50%" cy="50%">
                                  {OFFSHORE_DATA.map((entry, i) => (
                                     <Cell key={i} fill={entry.color} stroke="transparent" />
                                  ))}
                               </Pie>
                               <Tooltip contentStyle={{ background: '#000', border: '1px solid #f59e0b', borderRadius: '15px' }} />
                               <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-white font-black italic text-2xl font-mono">$470M</text>
                            </PieChart>
                         </div>
                         <div className="space-y-4">
                            {OFFSHORE_DATA.map(d => (
                              <div key={d.name} className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.01] border border-white/[0.04] hover:bg-amber-600/5 transition-all group">
                                 <div className="flex items-center gap-4">
                                    <div className="w-3 h-3 rounded-full group-hover:animate-ping" style={{ backgroundColor: d.color }} />
                                    <span className="text-[11px] font-black text-slate-400 uppercase italic tracking-widest">{d.name}</span>
                                 </div>
                                 <div className="flex items-center gap-6">
                                    <span className="text-sm font-black text-white italic font-mono">{d.amount}</span>
                                    <span className="text-[10px] font-black text-slate-700 italic font-mono">{d.value}%</span>
                                 </div>
                              </div>
                            ))}
                         </div>
                      </div>
                      <div className="col-span-12 xl:col-span-7 p-10 rounded-[3.5rem] bg-black border border-white/[0.04] shadow-3xl space-y-8">
                         <h3 className="text-[12px] font-black text-rose-600 italic uppercase tracking-[0.4em] border-b border-white/[0.04] pb-6 flex items-center gap-4">
                            <Skull size={18} /> SHELL_DETECTION_ENGINE (ТОП_РИЗИК_СПОСТЕРЕЖЕННЯ)
                         </h3>
                         <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pr-2">
                             {[
                                { name: 'Kyoto Holdings Ltd', jur: 'BVI', links: 14, risk: 97, amount: '$47M', ubo: 'ВСТАНОВЛЕНО' },
                                { name: 'Sunrise Capital Ltd', jur: 'Кіпр', links: 8, risk: 89, amount: '$21M', ubo: 'ЧАСТКОВО' },
                                { name: 'Gulf Meridian FZCO', jur: 'ОАЕ', links: 11, risk: 94, amount: '$31M', ubo: 'ВСТАНОВЛЕНО' },
                                { name: 'Belize Trust Corp', jur: 'Белізе', links: 5, risk: 82, amount: '$18M', ubo: 'НЕВІДОМО' },
                             ].map((s, i) => (
                               <div key={i} className="p-8 rounded-[2.5rem] bg-white/[0.01] border border-white/[0.03] hover:border-rose-600/40 transition-all group animate-fade-in">
                                  <div className="flex items-center justify-between mb-6">
                                     <div className="space-y-1">
                                        <h4 className="text-xl font-black text-white italic uppercase tracking-tighter group-hover:text-rose-500 transition-colors leading-none">{s.name}</h4>
                                        <p className="text-[10px] font-black text-slate-700 uppercase italic tracking-widest">{s.jur} // КІЛЬКІСТЬ_ЗВ'ЯЗКІВ: {s.links}</p>
                                     </div>
                                     <div className="text-right">
                                        <p className="text-3xl font-black italic font-mono text-white leading-none tracking-tighter mb-1">{s.amount}</p>
                                        <p className={cn("text-[9px] font-black italic tracking-widest", s.ubo === 'ВСТАНОВЛЕНО' ? "text-emerald-500" : "text-amber-500")}>UBO: {s.ubo}</p>
                                     </div>
                                  </div>
                                  <div className="space-y-2">
                                     <div className="flex items-center justify-between text-[9px] font-black text-slate-800 uppercase italic">
                                        <span>RISK_EXPOSURE_LEVEL</span>
                                        <span className="text-rose-600">{s.risk}% LVL</span>
                                     </div>
                                     <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${s.risk}%` }} transition={{ delay: 0.5 + i * 0.1 }} className="h-full bg-gradient-to-r from-amber-700 to-rose-600" />
                                     </div>
                                  </div>
                               </div>
                             ))}
                         </div>
                      </div>
                   </motion.div>
                 )}

                 {activeModule === 'aml' && (
                   <motion.div key="aml" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="col-span-12 grid grid-cols-12 gap-10">
                      <div className="col-span-12 xl:col-span-6 p-10 rounded-[3.5rem] bg-black border border-white/[0.04] shadow-3xl space-y-10">
                         <h2 className="text-[12px] font-black text-indigo-500 italic uppercase tracking-[0.4em] border-b border-white/[0.04] pb-6 flex items-center gap-4">
                            <ShieldCheck size={18} /> AML_NEURAL_RADAR // ШІ_СКОРИНГ
                         </h2>
                         <div className="flex items-center justify-center p-8 bg-black/40 rounded-[3rem] border border-white/[0.01]">
                            <ResponsiveContainer width="100%" height={400}>
                               <RadarChart cx="50%" cy="50%" outerRadius="80%" data={AML_RADAR_DATA}>
                                  <PolarGrid stroke="rgba(255,255,255,0.05)" />
                                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }} />
                                  <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                  <Radar name="Об'єкт" dataKey="A" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.6} />
                                  <Radar name="Еталон" dataKey="B" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                               </RadarChart>
                            </ResponsiveContainer>
                         </div>
                      </div>
                      <div className="col-span-12 xl:col-span-6 p-10 rounded-[3.5rem] bg-black border border-white/[0.04] shadow-3xl space-y-10">
                         <h3 className="text-[12px] font-black text-indigo-500 italic uppercase tracking-[0.4em] border-b border-white/[0.04] pb-6">ВЕРДИКТ_СИСТЕМИ</h3>
                         <div className="space-y-8">
                            <div className="flex items-center gap-10">
                               <CyberOrb size={150} color="#6366f1" intensity={0.6} />
                               <div className="space-y-4">
                                  <p className="text-4xl font-black italic text-white leading-none">HIGH_PROBABILITY</p>
                                  <p className="text-6xl font-black italic text-indigo-500 font-mono leading-none tracking-tighter">94.2%</p>
                                  <p className="text-[11px] font-black text-slate-700 uppercase italic tracking-widest">ЙМОВІРНІСТЬ ПЕРЕХОВУВАННЯ UBO ЧЕРЕЗ ФІКТИВНИЙ БОРГ</p>
                               </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                               {[
                                  { label: 'ТОПОЛОГІЯ_РИЗИКУ', value: 'CLUSTER_ALPHA', i: Network },
                                  { label: 'АНАЛІЗ_ГЕНЕРАЦІЇ', value: '8.4s LATENCY', i: Cpu }
                               ].map((it, i) => (
                                 <div key={i} className="p-6 rounded-[2rem] bg-white/[0.01] border border-white/5 flex items-center gap-6">
                                    <it.i size={24} className="text-indigo-600" />
                                    <div className="space-y-1">
                                       <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest">{it.label}</p>
                                       <p className="text-sm font-black text-white italic">{it.value}</p>
                                    </div>
                                 </div>
                               ))}
                            </div>
                         </div>
                      </div>
                   </motion.div>
                 )}

                 {activeModule === 'frozen' && (
                   <motion.div key="frozen" initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} className="col-span-12 bg-black border-2 border-white/[0.04] rounded-[4rem] shadow-3xl overflow-hidden">
                      <div className="p-10 border-b border-white/[0.04] flex items-center justify-between">
                         <h2 className="text-[14px] font-black text-white italic uppercase tracking-[0.5em] flex items-center gap-6">
                            <Lock size={24} className="text-rose-600 animate-pulse" />
                            РЕЄСТР_ЗАМОРОЖЕНИХ_АКТИВІВ // ASSET_FREEZE_TRACKER
                         </h2>
                         <button className="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest italic hover:bg-white/10 transition-all">ВІДКРИТИ_ПОВНИЙ_РЕЄСТР</button>
                      </div>
                      <div className="overflow-x-auto no-scrollbar">
                         <table className="w-full text-left">
                            <thead className="bg-white/[0.02]">
                               <tr>
                                  {['ОБ\'ЄКТ_ВЛАСНОСТІ', 'СУМА_УТРИМАННЯ', 'ДАТА_ФІКСАЦІЇ', 'ОРГАН_ВЛАДИ', 'СТАТУС_КЕРУВАННЯ'].map(h => (
                                    <th key={h} className="px-10 py-6 text-[9px] font-black text-slate-700 uppercase tracking-widest italic font-mono">{h}</th>
                                  ))}
                               </tr>
                            </thead>
                            <tbody>
                               {FROZEN_ASSETS.map((asset, i) => (
                                 <tr key={i} className="border-b border-white/[0.02] hover:bg-rose-950/5 transition-all cursor-pointer group">
                                    <td className="px-10 py-8 text-sm font-black text-white italic truncate max-w-[300px] group-hover:text-rose-500 transition-colors uppercase">{asset.entity}</td>
                                    <td className="px-10 py-8 text-xl font-black text-rose-500 italic font-mono tracking-tighter">{asset.amount}</td>
                                    <td className="px-10 py-8 text-xs font-black text-slate-700 italic font-mono">{asset.date}</td>
                                    <td className="px-10 py-8">
                                       <span className="bg-rose-600/10 border border-rose-600/30 text-rose-500 px-4 py-1.5 rounded-full text-[9px] font-black italic tracking-widest">{asset.authority}</span>
                                    </td>
                                    <td className="px-10 py-8">
                                       <div className="flex items-center gap-3">
                                          <div className={cn("w-2 h-2 rounded-full", asset.status === 'ЗАМОРОЖЕНО' ? "bg-rose-600" : "bg-emerald-600")} />
                                          <span className="text-[10px] font-black text-white uppercase italic tracking-widest">{asset.status}</span>
                                       </div>
                                    </td>
                                 </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </motion.div>
                 )}
              </AnimatePresence>
           </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
            .shadow-3xl { box-shadow: 0 60px 100px -30px rgba(0,0,0,0.8); }
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .animate-fade-in { animation: fadeIn 0.5s ease-out; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        `}} />
      </div>
    </PageTransition>
  );
}
