/**
 * 💰 FINANCIAL SIGINT // ФІНАНСОВА РОЗВІДКА | v56.5-ELITE
 * PREDATOR Analytics — Sovereign Transactional & Offshore Intelligence
 * 
 * Модуль глибинного моніторингу SWIFT/SEPA, офшорних контурів,
 * цінових аномалій та блокування активів.
 * 
 * Sovereign Power Design · Classified · Tier-1
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Globe, AlertTriangle, Lock,
  Activity, DollarSign, RefreshCw,
  ArrowDownRight, Shield, Zap,
  BarChart3, Landmark, Wallet, Layers, Fingerprint,
  Siren, Skull, Cpu, ShieldCheck, Network,
  CreditCard, Coins, Scale, Target, Radar,
  Database, ZapOff, Orbit, Sparkles, ArrowUpRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar as RechartsRadar
} from 'recharts';
import { cn } from '@/utils/cn';
import { apiClient as api } from '@/services/api/config';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { PageTransition } from '@/components/layout/PageTransition';
import { CyberGrid } from '@/components/CyberGrid';
import { CyberOrb } from '@/components/CyberOrb';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { Badge } from '@/components/ui/badge';
import { intelligence } from '@/services/dataService';
import { ViewHeader } from '@/components/ViewHeader';

// ─── TYPES ───────────────────────────────────────────────────────────

interface SuspiciousTx {
  id: string;
  from: string;
  to: string;
  amount: string;
  currency: string;
  time: string;
  risk: number;
  type: string;
  route: string;
}

interface FrozenAsset {
  entity: string;
  amount: string;
  date: string;
  authority: string;
  reason: string;
  status: string;
}

// ─── MOCK DATA (Fallback) ───────────────────────────────────────────

const MOCK_SWIFT_FLOW = [
  { hour: '00:00', normal: 12, suspicious: 0.2 },
  { hour: '04:00', normal: 5,  suspicious: 0.4 },
  { hour: '08:00', normal: 45, suspicious: 1.2 },
  { hour: '12:00', normal: 120, suspicious: 14.4 },
  { hour: '16:00', normal: 84, suspicious: 4.8 },
  { hour: '20:00', normal: 38, suspicious: 1.6 },
  { hour: '23:59', normal: 14, suspicious: 0.3 },
];

const MOCK_OFFSHORE = [
  { name: 'БРИТ. ВІРГ. О-ВИ', value: 38, amount: '$142.5M', color: '#E11D48' },
  { name: 'КІПР', value: 27, amount: '$98.2M',  color: '#D4AF37' },
  { name: 'ОАЕ',  value: 18, amount: '$67.0M',  color: '#991b1b' },
  { name: 'БЕЛІЗ', value: 11, amount: '$41.1M', color: '#D4AF37' },
  { name: 'ІНШІ', value: 6,  amount: '$22.0M',  color: '#1e293b' },
];

const MOCK_SUSPICIOUS_TX = [
  { id: 'TX-ELITE-8821', from: 'ТОВ "АГРО-ЛІДЕР"', to: 'Kyoto Holdings Ltd (BVI)', amount: '$4.7M', currency: 'USD', time: '12:14:22', risk: 98, type: 'Shell Company', route: 'UA → BVI → ОАЕ' },
  { id: 'TX-ELITE-7203', from: 'БФ "ВІДРОДЖЕННЯ"', to: 'Sunrise Capital Ltd (CY)', amount: '$2.1M', currency: 'USD', time: '10:47:08', risk: 89, type: 'Layering', route: 'UA → CY → MT' },
  { id: 'TX-ELITE-5509', from: 'ФОП ТКАЧЕНКО В.М.', to: 'Gulf Meridian FZCO (UAE)', amount: '$1.4M', currency: 'AED', time: '08:55:19', risk: 94, type: 'PEP Exposure', route: 'UA → AE → SA' },
  { id: 'TX-ELITE-4412', from: 'ТОВ "МЕТАЛ-ГРУП"', to: 'Belize Trust Corp (BZ)', amount: '$3.2M', currency: 'USD', time: '07:14:55', risk: 92, type: 'Sanctions Nexus', route: 'UA → BZ → PA' },
];

const MOCK_FROZEN = [
  { entity: 'ПУМБ РАХУНОК 4521', amount: '$12.4M', date: '2025-12-01', authority: 'РНБО', reason: 'Санкційний список', status: 'ЗАМОРОЖЕНО' },
  { entity: 'ТОВ "АЛЬФА-ХОЛДИНГ"', amount: '$7.8M',  date: '2026-01-15', authority: 'EU SDN', reason: 'Фінансування агресії', status: 'ЗАМОРОЖЕНО' },
  { entity: 'ЯХТА "SOVEREIGN"', amount: '$18.5M', date: '2026-03-08', authority: 'MAS', reason: 'Ухилення від санкцій', status: 'КОНФІСКОВАНО' },
];

const MOCK_AML_RADAR = [
  { subject: 'СТРУКТУРУВАННЯ', A: 120, B: 110 },
  { subject: 'ШАЙРУВАННЯ', A: 98, B: 130 },
  { subject: 'ОФШОРИЗАЦІЯ', A: 86, B: 130 },
  { subject: 'PEP-РИЗИК', A: 140, B: 100 },
  { subject: 'САНКЦІЇ', A: 125, B: 90 },
  { subject: 'ТЕР ПОТОКИ', A: 65, B: 85 },
];

type ActiveModule = 'swift' | 'offshore' | 'contracts' | 'frozen' | 'aml';

export default function FinancialSigintView() {
  const [activeModule, setActiveModule] = useState<ActiveModule>('swift');
  const [refreshing, setRefreshing] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState(14);
  const { isOffline, activeFailover } = useBackendStatus();
  
  // Real Data State
  const [swiftData, setSwiftData] = useState(MOCK_SWIFT_FLOW);
  const [offshoreData, setOffshoreData] = useState(MOCK_OFFSHORE);
  const [suspiciousTx, setSuspiciousTx] = useState<SuspiciousTx[]>(MOCK_SUSPICIOUS_TX);
  const [frozenAssets, setFrozenAssets] = useState<FrozenAsset[]>(MOCK_FROZEN);
  const [amlRadar, setAmlRadar] = useState(MOCK_AML_RADAR);

  const fetchData = async () => {
    try {
      const result = await intelligence.getFinancialSigint('SIGINT_ALL');
      if (result) {
        if (result.swift) setSwiftData(result.swift);
        if (result.offshore) setOffshoreData(result.offshore);
        if (result.suspicious) setSuspiciousTx(result.suspicious);
        if (result.frozen) setFrozenAssets(result.frozen);
        if (result.aml) setAmlRadar(result.aml);
      }
    } catch (error) {
       console.error('[FinancialSigint] Error fetching real intelligence data', error);
    }
  };

  useEffect(() => {
    fetchData();
    const alertTimer = setInterval(() => {
      setLiveAlerts(prev => prev + (Math.random() > 0.8 ? 1 : 0));
    }, 8000);
    return () => clearInterval(alertTimer);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const modules = useMemo(() => [
    { id: 'swift',     label: 'SWIFT_SEPA_КОНТУР',     icon: Activity,    count: liveAlerts, badge: 'LIVE' },
    { id: 'offshore',  label: 'ОФШОРНИЙ_РАДАР',        icon: Globe,       count: '247',      badge: 'GDS' },
    { id: 'contracts', label: 'АУДИТ_ЦІН',             icon: BarChart3,   count: '18' },
    { id: 'frozen',    label: 'ЗАМОРОЖЕНІ_АКТИВИ',     icon: Lock,      count: frozenAssets.length },
    { id: 'aml',       label: 'СКОРИНГ_ORACLE',        icon: ShieldCheck, badge: 'ELITE' },
  ], [liveAlerts]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020202] text-slate-200 relative overflow-hidden font-sans pb-40">
        <AdvancedBackground />
        <CyberGrid color="rgba(212, 175, 55, 0.04)" />
        <div className="absolute inset-x-0 top-0 h-[800px] bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.08),transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 max-w-[1850px] mx-auto p-4 sm:p-12 space-y-16 flex flex-col items-stretch">
           
           {/* HEADER ELITE HUD */}
           <ViewHeader
             title={
               <div className="flex items-center gap-12">
                  <div className="relative group">
                     <div className="absolute inset-0 bg-yellow-500/20 blur-[80px] rounded-full scale-150 animate-pulse" />
                     <div className="relative p-8 bg-black border-2 border-yellow-500/40 rounded-[3rem] shadow-4xl transform -rotate-3 hover:rotate-0 transition-all duration-700">
                        <Landmark size={48} className="text-yellow-500 shadow-[0_0_30px_#d4af37]" />
                     </div>
                  </div>
                  <div className="space-y-4">
                     <div className="flex items-center gap-6">
                        <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-5 py-1.5 text-[10px] font-black tracking-[0.4em] uppercase italic rounded-xl">
                          FINANCIAL_SIGINT // NEURAL_MONEY_RADAR
                        </span>
                        <div className="h-px w-16 bg-yellow-500/20" />
                        <span className="text-[10px] font-black text-yellow-800 font-mono tracking-widest uppercase italic shadow-sm">v56.5-ELITE</span>
                     </div>
                     <h1 className="text-7xl font-black text-white tracking-tighter uppercase italic skew-x-[-4deg] leading-none">
                       ФІНАНСОВА <span className="text-yellow-500 underline decoration-yellow-600/30 decoration-[16px] underline-offset-[16px] italic uppercase tracking-tighter">ЕКЗЕКУЦІЯ</span>
                     </h1>
                  </div>
               </div>
             }
             breadcrumbs={['INTEL', 'FINANCIAL', 'SIGINT_ARRAY']}
             badges={[
               { label: 'CLASSIFIED_T1', color: 'primary', icon: <Lock size={10} /> },
               { label: 'SOVEREIGN_ELITE', color: 'gold', icon: <Landmark size={10} /> },
             ]}
             stats={[
               { label: 'LIVE_THREATS', value: liveAlerts.toString(), icon: <Siren />, color: 'danger', animate: true },
               { label: 'NODE_SOURCE', value: activeFailover ? 'NVIDIA_ZROK' : isOffline ? 'OFFLINE' : 'NVIDIA_MASTER', icon: <Cpu />, color: isOffline ? 'warning' : 'success' },
               { label: 'FAILOVER', value: activeFailover ? 'ZROK_TUNNEL' : isOffline ? 'AUTONOMOUS' : 'STANDBY', icon: <Network />, color: isOffline ? 'warning' : 'gold' },
               { label: 'ASSET_LOCK', value: '$41.8M', icon: <Lock />, color: 'gold' },
             ]}
           />

           <div className="flex justify-end gap-6">
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
                    <Wallet size={24} /> ГЕНЕРУВАТИ_РЕЄСТР_SIGINT
                 </div>
                 <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/main:translate-x-[100%] transition-transform duration-1000" />
              </button>
           </div>

           {/* QUICK SIGINT METRICS */}
           <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {[
                { label: 'ПІДОЗРІЛИЙ ОБІГ', value: '$370.4M', sub: 'За 24 години (UA_SIGINT)', icon: Coins, color: '#E11D48', score: 84 },
                { label: 'ОФШОРНИЙ КОНТУР', value: '247', sub: 'Активних вузлів (GDS)', icon: Globe, color: '#D4AF37', score: 100 },
                { label: 'АНОМАЛІЇ ЦІН', value: '18', sub: 'Відхилення > 15%', icon: BarChart3, color: '#E11D48', score: 45 },
                { label: 'ЗАМОРОЖЕНО (Σ)', value: '$41.8M', sub: 'Деактивовані активи', icon: Lock, color: '#D4AF37', score: 92 },
              ].map((m, i) => (
                <div key={i} className="p-10 rounded-[4rem] bg-black border-2 border-white/[0.03] shadow-4xl group relative overflow-hidden transition-all hover:border-white/10">
                   <div className="absolute -top-10 -right-10 p-12 opacity-[0.03] group-hover:opacity-[0.1] transition-all duration-700 rotate-12 group-hover:rotate-0">
                      <m.icon size={160} style={{ color: m.color }} />
                   </div>
                   <div className="relative z-10">
                      <p className="text-[11px] font-black text-slate-700 uppercase tracking-[0.4em] italic mb-4">{m.label}</p>
                      <h3 className="text-5xl font-black text-white italic font-mono tracking-tighter mb-4 border-l-8 pl-6" style={{ borderColor: m.color }}>{m.value}</h3>
                      <div className="flex items-center justify-between text-[10px] font-black text-slate-800 uppercase italic tracking-[0.3em] mt-10">
                         <span>{m.sub}</span>
                         <span style={{ color: m.color }} className="bg-white/5 px-3 py-1 rounded-lg">{m.score}% INTEL</span>
                      </div>
                   </div>
                </div>
              ))}
           </section>

           {/* MODULE TABS SOVEREIGN */}
           <div className="flex flex-wrap gap-6 p-4 bg-black/80 border-2 border-white/[0.03] rounded-[3.5rem] w-fit shadow-4xl backdrop-blur-3xl mx-auto">
              {modules.map(mod => (
                <button 
                  key={mod.id} onClick={() => setActiveModule(mod.id as ActiveModule)}
                  className={cn(
                    "px-10 py-5 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.3em] italic border-2 transition-all duration-500 flex items-center gap-5 relative overflow-hidden group",
                    activeModule === mod.id 
                      ? "bg-yellow-500 border-yellow-400 text-black shadow-[0_0_50px_rgba(212,175,55,0.3)]" 
                      : "bg-transparent text-slate-600 border-transparent hover:bg-white/5 hover:text-slate-400"
                  )}
                >
                   <mod.icon size={18} className={cn("transition-transform group-hover:scale-110", activeModule === mod.id ? "animate-pulse" : "")} />
                   {mod.label}
                   {mod.badge && <span className={cn("text-[9px] px-3 py-1 rounded-full font-black font-mono shadow-sm", activeModule === mod.id ? "bg-black/20 text-black" : "bg-yellow-500/10 text-yellow-500")}>{mod.badge}</span>}
                </button>
              ))}
           </div>

           {/* CONTENT ELITE HUB */}
           <div className="grid grid-cols-12 gap-12">
              <AnimatePresence mode="wait">
                 {activeModule === 'swift' && (
                   <motion.div 
                    key="swift" 
                    initial={{ opacity: 0, y: 50, rotateX: 10 }} 
                    animate={{ opacity: 1, y: 0, rotateX: 0 }} 
                    exit={{ opacity: 0, scale: 0.95 }} 
                    className="col-span-12 grid grid-cols-12 gap-12 perspective-1000"
                   >
                      <div className="col-span-12 xl:col-span-8 p-12 rounded-[5rem] bg-black border-2 border-white/[0.04] shadow-4xl space-y-12 relative overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/[0.02] to-transparent pointer-events-none" />
                         <div className="flex items-center justify-between mb-6 border-b-2 border-white/[0.04] pb-10">
                            <h2 className="text-[16px] font-black text-white italic uppercase tracking-[0.5em] flex items-center gap-6">
                               <Activity size={28} className="text-yellow-500 shadow-[0_0_30px_#d4af37]" />
                               ДИНАМІКА_SWIFT_ПОТОКІВ // ТРАНЗАКЦІЙНИЙ_МОНІТОРИНГ
                            </h2>
                            <div className="flex items-center gap-8">
                               <div className="flex items-center gap-3">
                                  <div className="w-3 h-3 rounded-full bg-slate-800" />
                                  <span className="text-[10px] font-black text-slate-700 uppercase italic tracking-widest">НОРМАЛЬНИЙ_ПОТІК</span>
                               </div>
                               <div className="flex items-center gap-3">
                                  <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse shadow-[0_0_15px_#d4af37]" />
                                  <span className="text-[10px] font-black text-yellow-500 uppercase italic underline decoration-yellow-500/40 tracking-widest">ЗАГРОЗА_В_РЕАЛЬНОМУ_ЧАСІ</span>
                               </div>
                            </div>
                         </div>
                         <div className="h-[500px]">
                            <ResponsiveContainer width="100%" height="100%">
                               <AreaChart data={swiftData}>
                                  <defs>
                                     <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                                     </linearGradient>
                                     <linearGradient id="roseGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#E11D48" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#E11D48" stopOpacity={0} />
                                     </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="10 10" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: '900', fontStyle: 'italic' }} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: '900', fontStyle: 'italic' }} />
                                  <Tooltip 
                                    contentStyle={{ background: 'rgba(0,0,0,0.95)', border: '2px solid rgba(212,175,55,0.4)', borderRadius: '24px', padding: '20px' }} 
                                    itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }} 
                                  />
                                  <Area type="monotone" dataKey="normal" stroke="rgba(255,255,255,0.1)" strokeWidth={2} fill="url(#goldGrad)" fillOpacity={0.1} />
                                  <Area type="monotone" dataKey="suspicious" stroke="#D4AF37" strokeWidth={6} fill="url(#goldGrad)" dot={{ r: 6, fill: '#D4AF37', strokeWidth: 0 }} />
                               </AreaChart>
                            </ResponsiveContainer>
                         </div>
                      </div>
                      <div className="col-span-12 xl:col-span-4 p-10 rounded-[5rem] bg-black border-2 border- rose-950/20 shadow-4xl space-y-10 flex flex-col relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-16 opacity-[0.02] group-hover:opacity-[0.1] transition-all rotate-12 duration-[15s]">
                            <Skull size={350} className="text-rose-600" />
                         </div>
                         <h3 className="text-[14px] font-black text-rose-600 italic uppercase tracking-[0.5em] mb-10 border-b-2 border-rose-500/10 pb-10 flex items-center justify-between">
                            <span>ЗАГРОЗЛИВІ_ТРАНЗАКЦІЇ</span>
                            <div className="flex gap-2">
                               <div className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                               <div className="w-2 h-2 rounded-full bg-rose-600 animate-pulse delay-75" />
                               <div className="w-2 h-2 rounded-full bg-rose-600 animate-pulse delay-150" />
                            </div>
                         </h3>
                         <div className="space-y-8 flex-1 overflow-y-auto custom-scrollbar pr-4 italic">
                            {suspiciousTx.map((tx, i) => (
                              <div key={tx.id} className="p-8 rounded-[3rem] bg-white/[0.01] border-2 border-white/[0.03] hover:border-rose-600/40 transition-all cursor-pointer group/item space-y-6 shadow-inset">
                                 <div className="flex items-center justify-between relative z-10">
                                    <span className="text-[11px] font-black font-mono text-rose-600 tracking-[0.3em] uppercase">{tx.id}</span>
                                    <Badge className="bg-rose-600 text-white font-black italic shadow-lg shadow-rose-900/40 px-4 py-1 rounded-lg uppercase">{tx.time}</Badge>
                                 </div>
                                 <div className="space-y-3 relative z-10">
                                    <p className="text-xl font-black text-white italic truncate tracking-tight">{tx.from}</p>
                                    <div className="flex items-center gap-4 py-2 opacity-40">
                                       <div className="h-px bg-slate-800 flex-1" />
                                       <ArrowDownRight size={18} className="text-rose-600 transform rotate-45" />
                                       <div className="h-px bg-slate-800 flex-1" />
                                    </div>
                                    <p className="text-xl font-black text-rose-600 italic truncate tracking-tight uppercase shadow-sm">{tx.to}</p>
                                 </div>
                                 <div className="flex items-center justify-between pt-8 border-t-2 border-white/[0.03] relative z-10">
                                    <div className="space-y-1">
                                       <p className="text-[9px] font-black text-slate-800 uppercase tracking-widest leading-none">СУМА_ВАЛЮТА</p>
                                       <span className="text-3xl font-black italic font-mono text-white tracking-tighter">{tx.amount}</span>
                                    </div>
                                    <div className="text-right">
                                       <p className="text-[9px] font-black text-slate-800 uppercase tracking-widest leading-none mb-2">РІВЕНЬ_РИЗИКУ</p>
                                       <span className="text-[11px] font-black text-white uppercase italic bg-rose-600 px-4 py-1.5 rounded-xl shadow-lg font-mono">{tx.risk}%</span>
                                    </div>
                                 </div>
                              </div>
                            ))}
                         </div>
                         <button className="relative w-full py-8 group/cancel overflow-hidden rounded-[2.5rem] border-2 border-rose-600/30">
                            <div className="absolute inset-0 bg-rose-600/10 group-hover/cancel:bg-rose-600 transition-colors duration-500" />
                            <div className="relative text-rose-600 group-hover/cancel:text-white font-black uppercase tracking-[0.6em] text-[12px] italic transition-colors">
                               БЛОКУВАТИ ПОТІК
                            </div>
                         </button>
                      </div>
                   </motion.div>
                 )}

                 {activeModule === 'offshore' && (
                   <motion.div 
                    key="offshore" 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0 }} 
                    className="col-span-12 grid grid-cols-12 gap-12"
                   >
                      <div className="col-span-12 xl:col-span-5 p-12 rounded-[5rem] bg-black border-2 border-white/[0.04] shadow-4xl space-y-12 relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-full h-[300px] bg-gradient-to-b from-yellow-500/[0.03] to-transparent pointer-events-none" />
                         <h2 className="text-[14px] font-black text-yellow-500 italic uppercase tracking-[0.5em] border-b-2 border-white/[0.04] pb-10 flex items-center gap-6">
                            <Globe size={28} className="animate-spin-slow" /> РАДАР_ОФШОРНОЇ_ЛІКВІДНОСТІ
                         </h2>
                         <div className="flex items-center justify-center p-12 bg-black border-4 border-white/[0.02] rounded-[4rem] relative group shadow-2xl">
                            <PieChart width={360} height={360}>
                               <Pie 
                                data={offshoreData} 
                                innerRadius={100} 
                                outerRadius={150} 
                                paddingAngle={6} 
                                dataKey="value" 
                                cx="50%" 
                                cy="50%"
                                stroke="none"
                               >
                                  {offshoreData.map((entry, i) => (
                                     <Cell key={i} fill={entry.color} className="hover:opacity-80 transition-opacity cursor-pointer shadow-lg" />
                                  ))}
                               </Pie>
                               <Tooltip 
                                contentStyle={{ background: 'rgba(0,0,0,0.98)', border: '2px solid rgba(212,175,55,0.4)', borderRadius: '24px', padding: '16px' }} 
                                itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: '900' }}
                               />
                               <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-white font-black italic text-4xl font-mono tracking-tighter">$470M</text>
                            </PieChart>
                         </div>
                         <div className="space-y-6">
                            {offshoreData.map(d => (
                              <div key={d.name} className="flex items-center justify-between p-7 rounded-[2.5rem] bg-white/[0.01] border-2 border-white/[0.03] hover:bg-yellow-500/10 hover:border-yellow-500/20 transition-all group cursor-pointer shadow-sm">
                                 <div className="flex items-center gap-6">
                                    <div className="w-4 h-4 rounded-full group-hover:scale-125 transition-transform shadow-lg" style={{ backgroundColor: d.color }} />
                                    <span className="text-[12px] font-black text-slate-400 group-hover:text-white uppercase italic tracking-[0.2em] transition-colors">{d.name}</span>
                                 </div>
                                 <div className="flex items-center gap-10">
                                    <span className="text-2xl font-black text-white italic font-mono tracking-tighter">{d.amount}</span>
                                    <div className="bg-slate-900 px-4 py-1.5 rounded-xl border border-white/5">
                                       <span className="text-[11px] font-black text-yellow-500 italic font-mono">{d.value}%</span>
                                    </div>
                                 </div>
                              </div>
                            ))}
                         </div>
                      </div>
                      <div className="col-span-12 xl:col-span-7 p-12 rounded-[5rem] bg-black border-2 border-white/[0.04] shadow-4xl space-y-12 relative overflow-hidden">
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/[0.01] blur-[150px] pointer-events-none" />
                         <h2 className="text-[14px] font-black text-yellow-500 italic uppercase tracking-[0.5em] border-b-2 border-white/[0.04] pb-10 flex items-center gap-6">
                            <Target size={28} /> ДВИГУН_ВИЯВЛЕННЯ_SHELL // АНАЛІЗ_GDS_КЛАСТЕРІВ
                         </h2>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-10 overflow-y-auto no-scrollbar pr-2 h-[800px] custom-scrollbar">
                             {[
                                { name: 'Kyoto Holdings Ltd', jur: 'BVI', links: 14, risk: 97, amount: '$47M', ubo: 'CONFIRMED', color: '#E11D48' },
                                { name: 'Sunrise Capital Ltd', jur: 'Кіпр', links: 8, risk: 89, amount: '$21M', ubo: 'PARTIAL', color: '#D4AF37' },
                                { name: 'Gulf Meridian FZCO', jur: 'ОАЕ', links: 11, risk: 94, amount: '$31M', ubo: 'CONFIRMED', color: '#E11D48' },
                                { name: 'Belize Trust Corp', jur: 'Белізе', links: 5, risk: 82, amount: '$18M', ubo: 'UNKNOWN', color: '#D4AF37' },
                                { name: 'Alpha Neptune LP', jur: 'Маршалли', links: 19, risk: 99, amount: '$82M', ubo: 'CONFIRMED', color: '#E11D48' },
                                { name: 'Zodiac Nexus FZ', jur: 'Панама', links: 7, risk: 85, amount: '$12M', ubo: 'UNKNOWN', color: '#D4AF37' },
                             ].map((s, i) => (
                               <div key={i} className="p-10 rounded-[3.5rem] bg-white/[0.01] border-2 border-white/[0.03] hover:border-yellow-500/30 transition-all group flex flex-col justify-between h-[340px] shadow-2xl relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                  <div className="space-y-6">
                                     <div className="flex justify-between items-start">
                                        <div className="space-y-2">
                                           <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter group-hover:text-yellow-500 transition-colors leading-none">{s.name}</h4>
                                           <p className="text-[10px] font-black text-slate-800 uppercase italic tracking-widest">{s.jur} // CONNS: {s.links}</p>
                                        </div>
                                        <div className="p-4 bg-black border-2 border-white/5 rounded-2xl">
                                           <Shield size={20} className={s.risk > 90 ? "text-rose-600 animate-pulse" : "text-yellow-500"} />
                                        </div>
                                     </div>
                                     <div className="space-y-2">
                                        <p className="text-5xl font-black italic font-mono text-white leading-none tracking-tighter">{s.amount}</p>
                                        <div className="flex items-center gap-4">
                                           <span className={cn(
                                              "text-[9px] font-black italic tracking-[0.2em] uppercase px-4 py-1.5 rounded-xl border",
                                              s.ubo === 'CONFIRMED' ? "bg-emerald-600/10 border-emerald-600/30 text-emerald-500" : 
                                              s.ubo === 'PARTIAL' ? "bg-amber-600/10 border-amber-600/30 text-amber-500" : 
                                              "bg-slate-700/10 border-slate-700/30 text-slate-700"
                                           )}>UBO: {s.ubo}</span>
                                        </div>
                                     </div>
                                  </div>
                                  <div className="space-y-3 pt-6 border-t-2 border-white/[0.03]">
                                     <div className="flex items-center justify-between text-[10px] font-black text-slate-700 uppercase italic tracking-widest leading-none">
                                        <span>EXPOSURE_INDEX</span>
                                        <span style={{ color: s.color }}>{s.risk}% LVL</span>
                                     </div>
                                     <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/5">
                                        <motion.div 
                                          initial={{ width: 0 }} 
                                          animate={{ width: `${s.risk}%` }} 
                                          transition={{ delay: 0.3 + i * 0.05, duration: 1 }} 
                                          className="h-full rounded-full"
                                          style={{ background: `linear-gradient(90deg, #1e293b, ${s.color})` }}
                                        />
                                     </div>
                                  </div>
                               </div>
                             ))}
                         </div>
                      </div>
                   </motion.div>
                 )}

                 {activeModule === 'aml' && (
                   <motion.div 
                    key="aml" 
                    initial={{ opacity: 0, x: -50 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: 50 }} 
                    className="col-span-12 grid grid-cols-12 gap-12"
                   >
                      <div className="col-span-12 xl:col-span-6 p-12 rounded-[5rem] bg-black border-2 border-white/[0.04] shadow-4xl space-y-12 relative overflow-hidden flex flex-col items-center">
                         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.05),transparent_60%)] pointer-events-none" />
                         <h2 className="w-full text-[14px] font-black text-yellow-500 italic uppercase tracking-[0.5em] border-b-2 border-white/[0.04] pb-10 flex items-center gap-6">
                            <ShieldCheck size={28} /> AML_NEURAL_RADAR // ШІ_СКОРИНГ
                         </h2>
                         <div className="flex-1 w-full flex items-center justify-center p-6 lg:p-12">
                            <ResponsiveContainer width="100%" height={450}>
                               <RadarChart cx="50%" cy="50%" outerRadius="80%" data={amlRadar}>
                                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11, fontWeight: '900', fontStyle: 'italic' }} />
                                  <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                  <RechartsRadar name="ENTITY_X" dataKey="A" stroke="#E11D48" strokeWidth={4} fill="#E11D48" fillOpacity={0.5} />
                                  <RechartsRadar name="SOVEREIGN_NORM" dataKey="B" stroke="#D4AF37" strokeWidth={2} fill="#D4AF37" fillOpacity={0.1} />
                               </RadarChart>
                            </ResponsiveContainer>
                         </div>
                      </div>
                      <div className="col-span-12 xl:col-span-6 p-12 rounded-[5rem] bg-black border-2 border-white/[0.04] shadow-4xl space-y-12 relative overflow-hidden flex flex-col">
                         <h3 className="text-[14px] font-black text-yellow-500 italic uppercase tracking-[0.5em] border-b-2 border-white/[0.04] pb-10">ВЕРДИКТ_SOVEREIGN_ORACLE</h3>
                         <div className="space-y-12 flex-1 flex flex-col justify-center">
                            <div className="flex flex-col lg:flex-row items-center gap-16 relative">
                               <div className="relative group">
                                  <CyberOrb size={180} color="#D4AF37" intensity={0.8} pulse />
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                     <Sparkles className="text-white opacity-20 group-hover:opacity-60 transition-opacity" size={40} />
                                  </div>
                                </div>
                               <div className="space-y-6 text-center lg:text-left">
                                  <div className="space-y-1">
                                    <p className="text-[14px] font-black text-slate-800 uppercase tracking-[0.5em] leading-none mb-4 italic">FINAL_JUDGEMENT</p>
                                    <p className="text-5xl font-black italic text-white tracking-tighter leading-none shadow-sm capitalize">ВИСОКА_ЙМОВІРНІСТЬ</p>
                                  </div>
                                  <p className="text-8xl font-black italic text-rose-600 font-mono leading-none tracking-tighter drop-shadow-[0_0_30px_rgba(225,29,72,0.5)] animate-pulse">94.8%</p>
                                  <div className="text-[12px] font-black text-slate-600 uppercase italic tracking-[0.4em] border-l-8 border-rose-600/40 pl-8 leading-relaxed max-w-sm mx-auto lg:mx-0">
                                     КРИТИЧНА ЙМОВІРНІСТЬ ПЕРЕХОВУВАННЯ UBO ЧЕРЕЗ СХЕМУ "BACK-TO-BACK LOANS" ТА ОФШОРНІ ДЕРИВАТИВИ.
                                  </div>
                               </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                               {[
                                  { label: 'ТОПОЛОГІЯ_РИЗИКУ', value: 'CLUSTER_ALPHA_IX', i: Network, color: '#E11D48' },
                                  { label: 'АНАЛІЗ_ДВИГУНА', value: '6.2s // NEURAL_X', i: Cpu, color: '#D4AF37' }
                               ].map((it, i) => (
                                 <div key={i} className="p-10 rounded-[3rem] bg-white/[0.01] border-2 border-white/5 flex items-center gap-10 hover:border-white/10 transition-all cursor-default shadow-sm">
                                    <div className="p-6 bg-black border-2 border-white/5 rounded-3xl" style={{ color: it.color }}>
                                       <it.i size={36} />
                                    </div>
                                    <div className="space-y-2">
                                       <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.4em] leading-none mb-1">{it.label}</p>
                                       <p className="text-xl font-black text-white italic tracking-tight">{it.value}</p>
                                    </div>
                                 </div>
                               ))}
                            </div>
                         </div>
                         <button className="mt-4 w-full py-10 bg-yellow-500 text-black rounded-[3rem] tracking-[0.8em] text-[14px] font-black uppercase italic hover:bg-yellow-400 shadow-4xl transition-all border-4 border-yellow-700/20 active:scale-95 duration-500">
                            ВІДКРИТИ ПОВНУ ЕКСПЕРТИЗУ
                         </button>
                      </div>
                   </motion.div>
                 )}

                 {activeModule === 'frozen' && (
                   <motion.div 
                    key="frozen" 
                    initial={{ opacity: 0, y: 100 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="col-span-12 bg-black border-2 border-white/[0.04] rounded-[5rem] shadow-4xl overflow-hidden relative group"
                   >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(225,29,72,0.03),transparent_70%)] pointer-events-none" />
                      <div className="p-16 border-b-2 border-white/[0.04] flex flex-col md:flex-row items-center justify-between gap-10">
                         <div className="space-y-4">
                            <h2 className="text-[18px] font-black text-white italic uppercase tracking-[0.6em] flex items-center gap-8">
                               <div className="p-5 bg-rose-600/10 border-2 border-rose-600/20 rounded-[2rem] text-rose-600">
                                  <Lock size={32} className="animate-pulse" />
                               </div>
                               РЕЄСТР_ЗАМОРОЖЕНИХ_АКТИВІВ // REAC_ASSET_SHIELD
                            </h2>
                            <p className="text-[12px] text-slate-700 font-bold uppercase tracking-[0.4em] italic border-l-4 border-rose-600/40 pl-6">
                               ПОВНИЙ ПЕРЕЛІК ПЕРЕКРИТИХ КАНАЛІВ ФІНАНСУВАННЯ ТА ВИЛУЧЕНОГО МАЙНА
                            </p>
                         </div>
                         <button className="px-12 py-6 bg-white/5 border-2 border-white/10 text-white rounded-[2rem] text-[12px] font-black uppercase tracking-[0.3em] italic hover:bg-white/20 hover:border-yellow-500/50 transition-all shadow-xl group/btn">
                            ВІДКРИТИ_ARBITRAGE_Matrix <ArrowUpRight size={18} className="inline ml-4 transition-transform group-hover/btn:translate-x-2 group-hover/btn:-translate-y-2" />
                         </button>
                      </div>
                      <div className="overflow-x-auto custom-scrollbar">
                         <table className="w-full text-left border-collapse">
                            <thead className="bg-white/[0.02]">
                               <tr>
                                  {['ОБ\'ЄКТ_ВЛАСНОСТІ', 'СУМА_УТРИМАННЯ', 'ДАТА_ФІКСАЦІЇ', 'ОРГАН_ВЛАДИ', 'СТАТУС_КЕРУВАННЯ'].map(h => (
                                    <th key={h} className="px-16 py-10 text-[11px] font-black text-slate-800 uppercase tracking-[0.5em] italic font-mono border-b-2 border-white/5">{h}</th>
                                  ))}
                               </tr>
                            </thead>
                            <tbody>
                               {frozenAssets.map((asset, i) => (
                                 <tr key={i} className="border-b-2 border-white/[0.02] hover:bg-rose-950/10 transition-all cursor-pointer group/row relative overflow-hidden">
                                    <td className="px-16 py-12 text-2xl font-black text-white italic truncate max-w-[450px] group-hover/row:text-rose-500 transition-colors uppercase tracking-tight relative z-10">{asset.entity}</td>
                                    <td className="px-16 py-12 text-4xl font-black text-rose-600 italic font-mono tracking-tighter relative z-10">{asset.amount}</td>
                                    <td className="px-16 py-12 text-sm font-black text-slate-700 italic font-mono relative z-10">{asset.date}</td>
                                    <td className="px-16 py-12 relative z-10">
                                       <span className="bg-rose-600/10 border-2 border-rose-600/30 text-rose-500 px-8 py-3 rounded-2xl text-[10px] font-black italic tracking-[0.3em] shadow-inner">{asset.authority}</span>
                                    </td>
                                    <td className="px-16 py-12 relative z-10">
                                       <div className="flex items-center gap-6">
                                          <div className={cn("w-4 h-4 rounded-full shadow-lg", asset.status === 'ЗАМОРОЖЕНО' ? "bg-rose-600 animate-pulse shadow-rose-900/50" : "bg-emerald-600 shadow-emerald-900/50")} />
                                          <span className="text-[12px] font-black text-white uppercase italic tracking-[0.4em]">{asset.status}</span>
                                       </div>
                                    </td>
                                    <div className="absolute inset-0 bg-gradient-to-r from-rose-600/5 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity pointer-events-none" />
                                 </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                      <div className="p-10 bg-white/[0.01] flex justify-center border-t-2 border-white/5">
                         <div className="flex items-center gap-4 text-[11px] font-black text-slate-800 uppercase italic tracking-widest">
                            <Fingerprint size={16} /> END_OF_LIST_SOVEREIGN_RECORDS
                         </div>
                      </div>
                   </motion.div>
                 )}
              </AnimatePresence>
           </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
            .shadow-4xl { box-shadow: 0 80px 150px -40px rgba(0,0,0,0.9), 0 0 80px rgba(212,175,55,0.03); }
            .shadow-inset { box-shadow: inset 0 2px 10px rgba(255,255,255,0.02); }
            .custom-scrollbar::-webkit-scrollbar{width:8px;height:8px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(212,175,55,.1);border-radius:20px;border:2px solid black}.custom-scrollbar::-webkit-scrollbar-thumb:hover{background:rgba(212,175,55,.2)}
            .animate-spin-slow { animation: spin 10s linear infinite; }
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            .perspective-1000 { perspective: 1000px; }
        `}} />
      </div>
    </PageTransition>
  );
}
