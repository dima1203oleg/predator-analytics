/**
 * 🚢 CUSTOMS INTELLIGENCE // МИТНА АНАЛІТИКА | v56.2-TITAN
 * PREDATOR Analytics — Logistics & Trade Flow Intelligence
 * 
 * Моніторинг митних декларацій, аналіз контрагентів (ЗЕД),
 * трекінг товарних груп та виявлення митних ризиків.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ship, Package, Globe, TrendingUp, TrendingDown, DollarSign,
  Search, Filter, Download, Activity, ShieldAlert, Target,
  ArrowUpRight, ArrowDownRight, BarChart3, PieChart, Map,
  Bell, Crown, Zap, Anchor, Box, Truck, Factory,
  Layers, Cpu, Database, Scan, Microscope, FileText,
  ChevronRight, AlertTriangle, CheckCircle2, Siren, ZapOff, RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, PieChart as RePieChart,
  Pie, Cell
} from 'recharts';
import { cn } from '@/lib/utils';
import { apiClient as api } from '@/services/api/config';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/TacticalCard';
import { CyberGrid } from '@/components/CyberGrid';
import { CyberOrb } from '@/components/CyberOrb';
import { ViewHeader } from '@/components/ViewHeader';

// ─── MOCK DATA ────────────────────────────────────────────────────────

const TRADE_VOLUME_DATA = [
  { day: '01.03', import: 420, export: 310 },
  { day: '05.03', import: 380, export: 290 },
  { day: '10.03', import: 510, export: 340 },
  { day: '15.03', import: 440, export: 410 },
  { day: '20.03', import: 620, export: 380 },
  { day: '25.03', import: 550, export: 450 },
  { day: '30.03', import: 710, export: 490 },
];

const CATEGORY_DATA = [
  { name: 'ЕЛЕКТРОНІКА', value: 35, color: '#3b82f6' },
  { name: 'МАШИНОБУДУВАННЯ', value: 25, color: '#6366f1' },
  { name: 'АГРО-СЕКТОР', value: 20, color: '#10b981' },
  { name: 'ХІМІЯ', value: 12, color: '#f59e0b' },
  { name: 'ІНШЕ', value: 8, color: '#64748b' },
];

const TOP_IMPORTERS = [
  { name: 'ТОВ "МЕТАЛ-ТРЕЙД ОПТ"', value: '$14.2M', share: '12%', trend: 'up' },
  { name: 'ПРАТ "ЕНЕРГО-СИСТЕМИ"', value: '$9.8M', share: '8%', trend: 'up' },
  { name: 'ТОВ "АГРО-ІМПОРТ ПЛЮС"', value: '$7.4M', share: '6%', trend: 'down' },
  { name: 'ФОП КОВАЛЕНКО О.В.', value: '$3.1M', share: '2%', trend: 'stable' },
];

const RISK_ALERTS = [
  { id: 'R-702', title: 'ЗАНИЖЕННЯ_МИТНОЇ_ВАРТОСТІ', source: 'HS-8517', severity: 'КРИТИЧНА', status: 'АКТИВНА', desc: 'Декларування iPhone 15 Pro за ціною $240/од.' },
  { id: 'R-614', title: 'ЗМІНА_КРАЇНИ_ПОХОДЖЕННЯ', source: 'UA-PL-DE', severity: 'ВИСОКА', status: 'ПЕРЕВІРКА', desc: 'Різка зміна логістичного плеча через фіктивні хаби в Польщі.' },
  { id: 'R-509', title: 'САНКЦІЙНИЙ_ТРАНЗИТ', source: 'EU-SDN', severity: 'КРИТИЧНА', status: 'БЛОКОВАНО', desc: 'Спроба ввезення комплектуючих подвійного призначення.' },
];

export default function CustomsIntelligenceView() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'importers' | 'risks' | 'signals'>('analytics');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 1500));
    setRefreshing(false);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden font-sans pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.05),transparent_70%)] pointer-events-none" />
        <CyberGrid color="rgba(16, 185, 129, 0.03)" />
        
        <div className="relative z-10 max-w-[1750px] mx-auto p-4 sm:p-12 space-y-12">
           
           {/* HEADER HUD */}
           <ViewHeader
             title={
               <div className="flex items-center gap-10">
                  <div className="relative group">
                     <div className="absolute inset-0 bg-emerald-600/20 blur-3xl rounded-full scale-150 animate-pulse" />
                     <div className="relative p-7 bg-black border border-emerald-900/40 rounded-[2.5rem] shadow-2xl">
                        <Anchor size={42} className="text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <div className="flex items-center gap-3">
                        <span className="badge-v2 bg-emerald-600/10 border border-emerald-600/20 text-emerald-500 px-3 py-1 text-[10px] font-black tracking-[0.3em] uppercase italic">
                          LOGISTICS_MATRIX // TRADE_CUSTOMS_MONITOR
                        </span>
                        <div className="h-px w-10 bg-emerald-600/20" />
                        <span className="text-[10px] font-black text-slate-700 font-mono tracking-widest uppercase italic">v56.2 TITAN</span>
                     </div>
                     <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-2deg] leading-none">
                       МИТНА <span className="text-emerald-600 underline decoration-emerald-600/20 decoration-8 italic uppercase">АНАЛІТИКА</span>
                     </h1>
                     <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] italic opacity-80 leading-none">
                        КОНТРОЛЬ ЗЕД, ТОВАРНИХ ПОТОКІВ ТА МИТНИХ РИЗИКІВ
                     </p>
                  </div>
               </div>
             }
             stats={[
               { label: 'ДІЮЧИХ_ЗЕД', value: '12.8K', icon: <Box size={14} />, color: 'primary' },
               { label: 'РИЗИКОВІ_ОПЕРАЦІЇ', value: '847', icon: <Siren size={14} />, color: 'danger', animate: true },
               { label: 'ФІН_ПОТІК (Σ)', value: '₴2.4B', icon: <DollarSign size={14} />, color: 'success' }
             ]}
             actions={
               <div className="flex gap-4">
                  <button onClick={handleRefresh} className={cn("p-5 bg-black border border-white/[0.04] rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl", refreshing && "animate-spin")}>
                     <RefreshCw size={24} />
                  </button>
                  <button className="px-8 py-5 bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-emerald-600 shadow-2xl transition-all flex items-center gap-4">
                     <Download size={18} /> ЗАВАНТАЖИТИ_ЗЕД_ЗВІТ
                  </button>
               </div>
             }
           />

           {/* ANALYTICS TABS */}
           <div className="flex flex-wrap gap-4 p-3 bg-black/60 border border-white/[0.03] rounded-[2.5rem] w-fit shadow-2xl">
              {[
                { id: 'analytics', label: 'ОБСЯГИ_ТА_ДИНАМІКА', i: Activity },
                { id: 'importers', label: 'ТОП_ІМПОРТЕРІВ', i: Truck },
                { id: 'risks', label: 'МИТНІ_РИЗИКИ', i: AlertTriangle },
                { id: 'signals', label: 'СИГНАЛЬНА_РОЗВІДКА', i: Zap },
              ].map(tab => (
                <button 
                  key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "px-8 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.2em] italic border transition-all flex items-center gap-3",
                    activeTab === tab.id ? "bg-emerald-700 border-emerald-500 text-white shadow-3xl" : "bg-transparent text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-300"
                  )}
                >
                   <tab.i size={16} />
                   {tab.label}
                </button>
              ))}
           </div>

           {/* MAIN DISPLAY HUB */}
           <div className="grid grid-cols-12 gap-10">
              <AnimatePresence mode="wait">
                 {activeTab === 'analytics' && (
                   <motion.div key="analytics" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="col-span-12 grid grid-cols-12 gap-10">
                      
                      <div className="col-span-12 xl:col-span-8 p-10 rounded-[3.5rem] bg-black border-2 border-white/[0.04] shadow-3xl space-y-10">
                         <div className="flex items-center justify-between pb-6 border-b border-white/[0.04]">
                            <h2 className="text-[14px] font-black text-white italic uppercase tracking-[0.4em] flex items-center gap-4">
                               <TrendingUp size={24} className="text-emerald-500" /> ДИНАМІКА_ТОРГОВИХ_ПОТОКІВ_2026
                            </h2>
                            <div className="flex gap-6">
                               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[9px] font-black text-slate-600 uppercase italic">ІМПОРТ</span></div>
                               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-600" /><span className="text-[9px] font-black text-slate-600 uppercase italic">ЕКСПОРТ</span></div>
                            </div>
                         </div>
                         <div className="h-[450px]">
                            <ResponsiveContainer width="100%" height="100%">
                               <AreaChart data={TRADE_VOLUME_DATA}>
                                  <defs>
                                     <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                     </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="5 5" stroke="rgba(255,255,255,0.02)" vertical={false} />
                                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }} />
                                  <Tooltip contentStyle={{ background: '#000', border: '1px solid #10b981', borderRadius: '15px' }} />
                                  <Area type="monotone" dataKey="import" stroke="#10b981" strokeWidth={4} fill="url(#emeraldGrad)" />
                                  <Area type="monotone" dataKey="export" stroke="#475569" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
                               </AreaChart>
                            </ResponsiveContainer>
                         </div>
                      </div>

                      <div className="col-span-12 xl:col-span-4 p-10 rounded-[3.5rem] bg-black border border-white/[0.04] shadow-3xl space-y-10">
                         <h2 className="text-[12px] font-black text-emerald-500 italic uppercase tracking-[0.4em] pb-6 border-b border-white/[0.04]">СТРУКТУРА_ТОВАРНИХ_ГРУП</h2>
                         <div className="flex justify-center p-6 bg-black/40 rounded-[3rem] border border-white/[0.02]">
                            <RePieChart width={280} height={280}>
                               <Pie data={CATEGORY_DATA} innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value" cx="50%" cy="50%">
                                  {CATEGORY_DATA.map((entry, i) => (
                                     <Cell key={i} fill={entry.color} stroke="transparent" />
                                  ))}
                               </Pie>
                               <Tooltip contentStyle={{ background: '#000', border: '1px solid #10b981', borderRadius: '15px' }} />
                            </RePieChart>
                         </div>
                         <div className="space-y-4">
                            {CATEGORY_DATA.map(d => (
                              <div key={d.name} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.01] border border-white/[0.03] hover:bg-emerald-600/5 transition-all group">
                                 <div className="flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                                    <span className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">{d.name}</span>
                                 </div>
                                 <span className="text-sm font-black text-white italic font-mono">{d.value}%</span>
                              </div>
                            ))}
                         </div>
                      </div>

                   </motion.div>
                 )}

                 {activeTab === 'importers' && (
                   <motion.div key="importers" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="col-span-12 grid grid-cols-12 gap-10">
                      <div className="col-span-12 xl:col-span-12 p-10 rounded-[4rem] bg-black border-2 border-white/[0.04] shadow-3xl">
                         <div className="flex items-center justify-between mb-10 border-b border-white/[0.04] pb-8">
                            <h2 className="text-[14px] font-black text-white italic uppercase tracking-[0.5em] flex items-center gap-6">
                               <Truck size={24} className="text-emerald-500" /> ТОП_ІМПОРТЕРІВ // MARKET_DOMINANCE
                            </h2>
                            <div className="flex gap-4">
                               <button className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest italic">ФІЛЬТР_ПО_ГРУПАМ</button>
                            </div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                            {TOP_IMPORTERS.map((comp, i) => (
                              <div key={i} className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/[0.04] hover:border-emerald-500/40 transition-all group space-y-6">
                                 <div className="flex items-center justify-between">
                                    <div className="p-4 bg-black border border-white/5 rounded-2xl text-emerald-500">
                                       <Factory size={24} />
                                    </div>
                                    <div className={cn("flex items-center gap-1 text-[10px] font-black italic", comp.trend === 'up' ? "text-emerald-500" : comp.trend === 'down' ? "text-rose-500" : "text-slate-600")}>
                                       {comp.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                       {comp.share} РИНКУ
                                    </div>
                                 </div>
                                 <div className="space-y-1">
                                    <h4 className="text-lg font-black text-white italic uppercase leading-none truncate group-hover:text-emerald-400 transition-colors">{comp.name}</h4>
                                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">UA_REG: {Math.floor(Math.random() * 90000000 + 10000000)}</p>
                                 </div>
                                 <div className="pt-4 border-t border-white/[0.04]">
                                    <p className="text-3xl font-black italic font-mono text-white tracking-tighter">{comp.value}</p>
                                    <p className="text-[8px] font-black text-slate-800 uppercase tracking-[0.4em] italic mt-1">ОБСЯГ_ІМПОРТУ_MONTH</p>
                                 </div>
                              </div>
                            ))}
                         </div>
                      </div>
                   </motion.div>
                 )}

                 {activeTab === 'risks' && (
                   <motion.div key="risks" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="col-span-12 space-y-8">
                      <div className="p-10 rounded-[4rem] bg-black border-2 border-white/[0.04] shadow-3xl space-y-10 relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-16 opacity-[0.02] pointer-events-none">
                            <ShieldAlert size={300} className="text-rose-600" />
                         </div>
                         <div className="flex items-center justify-between relative z-10">
                            <h3 className="text-[14px] font-black text-rose-600 italic uppercase tracking-[0.5em] flex items-center gap-6">
                               <AlertTriangle size={24} className="animate-pulse" /> CUSTOMS_RISK_ALERTS // МОНІТОРИНГ_ЗЛОВЖИВАНЬ
                            </h3>
                            <button className="px-10 py-4 bg-rose-600/10 border border-rose-600/40 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-rose-600 hover:text-white transition-all">АКТИВУВАТИ_АНТИФРОД</button>
                         </div>
                         <div className="space-y-6 relative z-10">
                            {RISK_ALERTS.map((alert, i) => (
                              <div key={i} className="p-8 rounded-[2.5rem] bg-white/[0.01] border border-white/[0.05] hover:border-rose-600/30 transition-all group flex items-start gap-10">
                                 <div className={cn("p-5 rounded-2xl border bg-black/40", alert.severity === 'КРИТИЧНА' ? "text-rose-600 border-rose-500/20" : "text-amber-500 border-amber-500/20")}>
                                    <Database size={32} />
                                 </div>
                                 <div className="flex-1 space-y-4">
                                    <div className="flex items-center justify-between">
                                       <div className="flex items-center gap-4">
                                          <span className="text-[10px] font-black font-mono text-slate-700 tracking-widest">{alert.id}</span>
                                          <span className={cn("px-3 py-1 text-[8px] font-black italic rounded-full uppercase", alert.severity === 'КРИТИЧНА' ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20")}>{alert.severity}</span>
                                       </div>
                                       <span className="text-[9px] font-black text-slate-800 uppercase italic font-mono">SOURCE_CODE: {alert.source}</span>
                                    </div>
                                    <div className="space-y-1">
                                       <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter group-hover:text-rose-500 transition-colors">{alert.title}</h4>
                                       <p className="text-sm font-black text-slate-500 italic max-w-3xl">{alert.desc}</p>
                                    </div>
                                 </div>
                                 <div className="flex flex-col gap-3">
                                    <button className="px-6 py-3 bg-white/5 hover:bg-rose-600 border border-white/5 rounded-xl text-[9px] font-black uppercase italic transition-all">РОЗСЛІДУВАТИ</button>
                                    <button className="px-6 py-3 border border-white/5 rounded-xl text-[9px] font-black uppercase text-slate-700 italic">АРХІВУВАТИ</button>
                                 </div>
                              </div>
                            ))}
                         </div>
                      </div>
                   </motion.div>
                 )}

                 {activeTab === 'signals' && (
                    <motion.div key="signals" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="col-span-12 grid grid-cols-12 gap-10">
                       <div className="col-span-12 xl:col-span-8 p-10 rounded-[3.5rem] bg-black border border-white/[0.04] shadow-3xl space-y-10">
                          <h2 className="text-[12px] font-black text-emerald-500 italic uppercase tracking-[0.4em] pb-6 border-b border-white/[0.04] flex items-center gap-4">
                             <Target size={18} /> LIVE_SIGNAL_DECODE (CEREBRO_INGESTION)
                          </h2>
                          <div className="space-y-4">
                             {[
                                { time: '14:22:15', channel: 'МИТНИЙ_ІНФОРМАТОР', msg: 'Помічено скупчення фур ТОВ "Агро-Трейд" на КПП "Краківець". Можливий дефіцит ДП.' },
                                { time: '14:20:08', channel: 'LOGISTICS_UA_TG', msg: 'Зміна тарифів на контейнерні перевезення з Гданська. +12%.' },
                                { time: '14:15:33', channel: 'INTERNAL_AF_BOT', msg: 'Детекція аномально великої партії iPhone 15 у декларації 104/2203.' },
                             ].map((sig, i) => (
                               <div key={i} className="p-6 bg-white/[0.01] border border-white/[0.03] rounded-3xl hover:bg-emerald-600/5 transition-all group flex items-start gap-6">
                                  <div className="text-[10px] font-black text-slate-800 font-mono mt-1">{sig.time}</div>
                                  <div className="flex-1 space-y-2">
                                     <p className="text-[10px] font-black text-emerald-600 uppercase italic tracking-widest">{sig.channel}</p>
                                     <p className="text-sm font-black text-slate-300 italic group-hover:text-white transition-colors">"{sig.msg}"</p>
                                  </div>
                                  <ChevronRight size={18} className="text-slate-800" />
                               </div>
                             ))}
                          </div>
                       </div>
                       <div className="col-span-12 xl:col-span-4 space-y-8">
                          <TacticalCard variant="holographic" className="p-10 rounded-[3rem] border-emerald-500/20 bg-emerald-500/[0.02]">
                             <h3 className="text-xl font-black text-white italic uppercase mb-6 flex items-center gap-4"><Scan size={20} className="text-emerald-500" /> АКТИВНІ_ХАБИ</h3>
                             <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-black border border-white/5 rounded-2xl">
                                   <div className="flex items-center gap-4"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/><span className="text-[11px] font-black text-white italic">TG_CUSTOMS_UA</span></div>
                                   <span className="text-[10px] text-slate-700 font-mono italic">ONLINE</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-black border border-white/5 rounded-2xl">
                                   <div className="flex items-center gap-4"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/><span className="text-[11px] font-black text-white italic">RSS_WORLD_TRADE</span></div>
                                   <span className="text-[10px] text-slate-700 font-mono italic">ONLINE</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-black border border-white/5 rounded-2xl opacity-40 grayscale">
                                   <div className="flex items-center gap-4"><div className="w-2 h-2 rounded-full bg-rose-600"/><span className="text-[11px] font-black text-white italic">MARITIME_AIS_SERVER</span></div>
                                   <span className="text-[10px] text-rose-500 font-mono italic">OFFLINE</span>
                                </div>
                             </div>
                          </TacticalCard>
                       </div>
                    </motion.div>
                 )}
              </AnimatePresence>
           </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
            .shadow-3xl { box-shadow: 0 60px 100px -30px rgba(0,0,0,0.8); }
            .no-scrollbar::-webkit-scrollbar { display: none; }
        `}} />
      </div>
    </PageTransition>
  );
}
