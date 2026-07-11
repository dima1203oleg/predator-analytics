/**
 * 🛰️ WAR ROOM // СИТУАЦІЙНИЙ ЦЕНТР | v63.0-ELITE
 * PREDATOR Analytics — Tactical Multi-Screen Command Center
 * 
 * Єдиний віртуальний простір для CEO з агрегацією всіх критичних потоків.
 * 4 Квадранти сили: Глобальна розвідка, Системне ядро, P&L ризиків, ШІ-Прогнози.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Globe, Shield, Zap, Terminal, Database, 
  Layers, AlertTriangle, TrendingUp, Cpu, Network,
  Maximize2, Minimize2, Radio, Target, Bell,
  ArrowUpRight, Clock, Box, Eye, CheckCircle2,
  Lock, Satellite, Radar, Scan, Fingerprint, Users, ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell
} from 'recharts';
import { cn } from '@/utils/cn';
import { useViewport } from '@/hooks/useViewport';
import { PageTransition } from '@/components/layout/PageTransition';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { HoloCard } from '@/components/ui/HoloCard';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { useDashboardOverview, useDashboardAlerts } from '@/hooks/useDashboard';
import { DiagnosticsTerminal } from '@/components/intelligence/DiagnosticsTerminal';

// ─── ДАНІ ────────────────────────────────────────────────────────────
// ─── ДАНІ (Тепер динамічні) ─────────────────────────────────────────────
// Використовуємо реальні дані з API, але залишаємо fallback для завантаження

// ─── КОМПОНЕНТ ────────────────────────────────────────────────────────
export default function WarRoomView() {
  const { isCompact } = useViewport();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    const itv = setInterval(() => setTicker(t => t + 1), 5000);
    return () => clearInterval(itv);
  }, []);

  const { isOffline, nodeSource, healingProgress, activeFailover } = useBackendStatus();

  const { data: overviewData } = useDashboardOverview();
  const { data: alertsData } = useDashboardAlerts(5);

  const lineData = overviewData?.radar
    ? overviewData.radar.map((item) => ({
        time: item.name,
        val: item.value
      }))
    : Array.from({ length: 20 }, (_, i) => ({
        time: `${i}:00`,
        val: 30 + Math.random() * 40
      }));

  const riskPieData = overviewData?.categories 
    ? Object.entries(overviewData.categories)
        .slice(0, 3)
        .map(([key, stat], idx) => ({
          name: key,
          value: stat.value,
          color: idx === 0 ? '#f43f5e' : idx === 1 ? '#fbbf24' : '#f59e0b'
        }))
    : [
        { name: 'Санкції', value: 400, color: '#f43f5e' },
        { name: 'Логістика', value: 300, color: '#fbbf24' },
        { name: 'Фін-ризики', value: 200, color: '#f59e0b' },
      ];

  const alertsList = alertsData?.items?.length
    ? alertsData.items.map(a => ({
        msg: a.message,
        type: a.severity === 'critical' ? 'error' : a.severity
      }))
    : [
        { msg: 'Виявлено збіг КБВ (POS-001)', type: 'error' },
        { msg: 'Нова реєстрація шелл-компанії (БВО)', type: 'warning' },
        { msg: 'Аномальна транзакція: Абу-Дабі', type: 'warning' },
        { msg: 'Оновлено Реєстр ПЕП Україна', type: 'info' },
        { msg: 'Детектовано новий паттерн відмивання', type: 'error' },
      ];

  // Нав'язливі toast-повідомлення видалено (HR-04 compliant)

  return (
    <PageTransition>
      <div className={cn("min-h-screen bg-[#010409] text-slate-200 overflow-hidden relative font-sans flex flex-col", isCompact ? "pb-24" : "")}>
        <AdvancedBackground mode="sovereign" />
        <CyberGrid color="rgba(244, 63, 94, 0.05)" />
        
        <div className={cn("relative z-10 flex-1 flex flex-col max-w-[1950px] mx-auto w-full", isCompact ? "p-4 space-y-8 overflow-y-auto" : "p-10 h-screen overflow-hidden space-y-8")}>
          
          <ViewHeader
            title={
              <div className="flex items-center gap-8">
                <div className="relative group">
                  <div className="absolute inset-0 bg-cyan-600/20 blur-3xl rounded-full scale-150 " />
                  <div className="relative p-7 bg-black border-2 border-cyan-500/40 rounded-[2.5rem] shadow-4xl transform -rotate-2 hover:rotate-0 transition-all">
                    <Target size={48} className="text-cyan-600 " />
                  </div>
                </div>
                 <div>
                    <div className="flex items-center gap-4 mb-2">
                      <span className={cn("w-1.5 h-1.5 rounded-full  shadow-[0_0_10px_currentColor]", isOffline ? "bg-amber-500 text-amber-500" : "bg-cyan-600 text-cyan-600")} />
                      <span className={cn("text-[10px] font-black uppercase tracking-[0.8em] italic", isOffline ? "text-amber-500/80" : "text-cyan-500/80")}>
                        {isOffline ? 'СУВЕРЕННИЙ_РЕЖИМ_НС' : 'ТАКТИЧНИЙ КОМАНДНИЙ ЦЕНТР'} · v63.0-ELITE
                      </span>
                    </div>
                    <h1 className={cn("font-black text-white tracking-tighter uppercase italic leading-none", isCompact ? "text-3xl" : "text-5xl")}>
                      СИТУАЦІЙНИЙ <span className={cn("underline underline-offset-8", isCompact ? "decoration-[6px]" : "decoration-[12px]", isOffline ? "text-amber-500 decoration-amber-500/20" : "text-cyan-600 decoration-rose-600/20")}>ЦЕНТР</span>
                    </h1>
                 </div>
              </div>
            }
            badges={[
              { label: 'CLASSIFIED_ELITE', color: 'amber', icon: <Lock size={10} /> },
              { label: 'WAR_ROOM_ALPHA', color: 'primary', icon: <Target size={10} /> },
              { 
                label: nodeSource, 
                color: isOffline ? 'warning' : 'danger', 
                icon: <Radio size={10} className={isOffline ? '' : ''} /> 
              },
            ]}
            stats={[
              { label: 'ГЛОБАЛЬНИЙ РИЗИК', value: '84.2%', icon: <AlertTriangle size={14} />, color: 'danger' },
              { 
                label: isOffline ? 'SYNC_HEAL' : 'ДЖЕРЕЛО_ВУЗЛА', 
                value: isOffline ? `${Math.floor(healingProgress)}%` : (activeFailover ? 'NVIDIA_ZROK' : 'NVIDIA_МАЙСТЕР'), 
                icon: isOffline ? <Activity /> : <Cpu />, 
                color: isOffline ? 'warning' : 'success',
                animate: isOffline
              },
              { label: 'РЕЗЕРВ', value: activeFailover ? 'ТУНЕЛЬ_ZROK' : isOffline ? 'АВТОНОМНО' : 'ОЧІКУВАННЯ', icon: <Satellite size={14} />, color: isOffline ? 'warning' : 'primary' },
              { label: 'PROTOCOL', value: isOffline ? 'EMERGENCY' : 'ELITE', icon: <Shield />, color: isOffline ? 'warning' : 'success' }
            ]}
            actions={
              <div className="flex items-center gap-6">
                 <div className="px-8 py-4 bg-black/60 rounded-2xl border border-white/10 flex items-center gap-4 shadow-xl">
                    <Clock size={16} className="text-slate-600" />
                    <span className="text-[13px] font-black font-mono text-slate-300 italic tabular-nums leading-none">
                       {new Date().toLocaleTimeString('uk-UA')}
                    </span>
                 </div>
                 <Button variant="cyber" className="px-10 py-5 bg-cyan-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] italic hover:brightness-110 shadow-4xl transition-all">
                    {!isCompact && "ДЕФОРМАТУВАТИ // "}АВАРІЙНИЙ_ВИХІД
                 </Button>
              </div>
            }
          />

          {/* ── QUADRANTS GRID ELITE ── */}
          <div className={cn("flex-1 overflow-hidden pb-10", isCompact ? "flex flex-col gap-6 overflow-y-auto" : "grid grid-cols-12 grid-rows-2 gap-8")}>
             
             {/* Q1: GLOBAL INTEL (Radar/Globe) */}
              <div className={cn(isCompact ? "w-full" : "col-span-12 xl:col-span-4 row-span-2")}>
                <HoloCard 
                  variant="holographic"
                  className={cn(
                    "flex flex-col transition-all duration-700 bg-black/60 relative overflow-hidden shadow-4xl",
                    isCompact ? "p-5 rounded-[2.5rem] min-h-[450px]" : "h-full p-8 border-amber-500/10 rounded-[4rem]",
                    expanded === 'q1' ? "fixed inset-12 z-[100] bg-black/98 border-amber-500/40" : ""
                  )}
                >
                   <div className="flex items-center justify-between mb-8 relative z-10">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-amber-500/10 rounded-2xl">
                            <Globe size={20} className="text-amber-500" />
                         </div>
                         <h3 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.6em] italic">ГЛОБАЛЬНА РОЗВІДКА</h3>
                      </div>
                      <Button variant="cyber" onClick={() => setExpanded(expanded === 'q1' ? null : 'q1')} className="p-2 text-slate-700 hover:text-white transition-colors">
                        {expanded === 'q1' ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                      </Button>
                   </div>

                   <div className="flex-1 flex flex-col space-y-10 relative z-10 overflow-hidden">
                      <div className={cn("relative rounded-[3rem] overflow-hidden border-2 border-white/5 bg-black/40 shadow-inner group", isCompact ? "h-[220px] mb-6" : "h-[45%]")}>
                         <div className="absolute inset-0 z-0 opacity-40 group-hover:opacity-100 transition-opacity duration-1000 bg-amber-500/5" />
                         <div className="absolute top-6 left-6 z-10 bg-black/80 px-5 py-2.5 rounded-2xl border border-amber-500/20 ">
                            <p className="text-[10px] font-black text-amber-500 uppercase italic tracking-widest flex items-center gap-3">
                               <Satellite size={12} className="" /> ОРБІТАЛЬНА_ФАЗА: АКТИВНО
                            </p>
                         </div>
                      </div>
                      <div className="flex-1 space-y-6 overflow-y-auto pr-4 custom-scrollbar">
                         <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.5em] italic mb-6">ГАРЯЧІ ЗОНИ КОНФЛІКТУ · {new Date().toLocaleDateString('uk-UA')}</h4>
                         {[
                            { zone: 'Схід Європи', risk: '98%', status: 'АКТИВНА_ВІЙНА', c: '#f43f5e' },
                            { zone: 'Червоне море', risk: '84%', status: 'БЛОКАДА', c: '#fbbf24' },
                            { zone: 'Тайваньська прот.', risk: '72%', status: 'СИГНАЛ_ПРИСУТНІЙ', c: '#fbbf24' },
                            { zone: 'Еквадор', risk: '54%', status: 'СТАБІЛЬНО', c: '#10b981' },
                         ].map((z, i) => (
                            <motion.div 
                               key={i} 
                               initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                               className="flex items-center justify-between p-7 rounded-[2.5rem] bg-white/[0.01] border-2 border-white/5 group hover:border-amber-500/30 transition-all cursor-crosshair shadow-2xl"
                            >
                               <div className="flex items-center gap-6">
                                  <div className="w-4 h-4 rounded-full  shadow-[0_0_12px_currentColor]" style={{ color: z.c, backgroundColor: z.c }} />
                                  <div className="text-left font-black italic">
                                     <p className="text-[15px] text-white uppercase tracking-tight">{z.zone}</p>
                                     <p className="text-[10px] text-slate-700 uppercase tracking-[0.2em] mt-1">{z.status}</p>
                                  </div>
                               </div>
                               <p className="text-2xl font-black italic font-mono tracking-tighter leading-none" style={{ color: z.c }}>{z.risk}</p>
                            </motion.div>
                         ))}
                      </div>
                   </div>
                </HoloCard>
             </div>

             {/* Q2: SYSTEM KERNEL (Metrics/Logs) */}
             <div className={cn(isCompact ? "w-full" : "col-span-12 xl:col-span-5")}>
                <HoloCard 
                  className={cn(
                    "flex flex-col bg-black/60 border-white/5 relative overflow-hidden shadow-4xl",
                    isCompact ? "p-5 rounded-[2.5rem] min-h-[400px]" : "h-full p-8 rounded-[4rem]",
                    expanded === 'q2' ? "fixed inset-12 z-[100] bg-black border-white/20" : ""
                  )}
                >
                   <div className="flex items-center justify-between mb-8 relative z-10">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-emerald-500/10 rounded-2xl">
                            <Activity size={20} className="text-emerald-500" />
                         </div>
                         <h3 className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.6em] italic">ЯДРО TITAN-01 // SOVEREIGN</h3>
                      </div>
                      <Button variant="cyber" onClick={() => setExpanded(expanded === 'q2' ? null : 'q2')} className="p-2 text-slate-700 hover:text-white transition-colors">
                        {expanded === 'q2' ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                      </Button>
                   </div>

                   <div className={cn("flex-1 relative z-10 h-full overflow-hidden", isCompact ? "flex flex-col gap-6" : "grid grid-cols-2 gap-10")}>
                      <div className="space-y-8 flex flex-col">
                          <div className={cn("w-full border-2 border-white/5 bg-black/40 shadow-inner relative overflow-hidden group", isCompact ? "h-[200px] rounded-[2rem] p-4" : "flex-1 rounded-[2.5rem] p-6")}>
                            <div className="absolute inset-0 bg-emerald-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                            <ResponsiveContainer width="100%" height="100%">
                               <AreaChart data={lineData}>
                                  <defs>
                                    <linearGradient id="q2gradElite" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <Area type="monotone" dataKey="val" stroke="#10b981" strokeWidth={3} fill="url(#q2gradElite)" animationDuration={3000} />
                               </AreaChart>
                            </ResponsiveContainer>
                         </div>
                          <div className={cn("grid", isCompact ? "grid-cols-2 gap-3" : "grid-cols-2 gap-6")}>
                             <div className="p-6 rounded-3xl bg-black border-2 border-white/5 shadow-inner group hover:border-emerald-500/30 transition-all flex flex-col justify-center">
                               <p className="text-[9px] font-black text-slate-800 uppercase tracking-widest leading-none mb-3 italic">ОБЧИСЛЕННЯ_ЦП</p>
                               <p className="text-3xl font-black text-emerald-500 font-mono italic tracking-tighter">34.2%</p>
                            </div>
                             <div className="p-6 rounded-3xl bg-black border-2 border-white/5 shadow-inner group hover:border-amber-500/30 transition-all flex flex-col justify-center">
                               <p className="text-[9px] font-black text-slate-800 uppercase tracking-widest leading-none mb-3 italic">НЕЙРО-НАВАНТАЖЕННЯ</p>
                               <p className="text-3xl font-black text-amber-500 font-mono italic tracking-tighter">12.1T</p>
                            </div>
                         </div>
                      </div>
                      <div className="bg-black/80 border-2 border-white/5 rounded-[3rem] p-8 font-mono text-[11px] space-y-4 overflow-hidden relative shadow-inner group">
                         <div className="absolute inset-0 bg-emerald-500/[0.01] pointer-events-none" />
                         <div className="flex items-center gap-6 mb-6 pb-6 border-b border-white/5">
                            <Terminal size={18} className="text-slate-700 group-hover:text-emerald-500 transition-colors" />
                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.4em] italic leading-none">ЖИВІ_ПОТОКИ_ЯДРА</span>
                         </div>
                         <div className="space-y-3 opacity-80 italic font-bold">
                            <p className="text-slate-700 leading-none">[14:32:01] <span className="text-emerald-600">ІНГЕСТІЯ:</span> Синхронізація підтверджена v63.0.1-HORIZON</p>
                            <p className="text-slate-700 leading-none">[14:32:05] <span className="text-rose-700">ТРИВОГА:</span> Порушення порогу ризику POS-001</p>
                            <p className="text-slate-700 leading-none">[14:32:15] <span className="text-cyan-600">СУВЕРЕН:</span> Резолюція Kyoto Holdings активна</p>
                            <p className="text-slate-700 leading-none">[14:32:22] <span className="text-slate-900">СИСТЕМА:</span> Очікування сплеску кластера Kafka...</p>
                            <motion.p animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }} className="text-emerald-500">_ГОТОВИЙ_ДО_КОМАНД</motion.p>
                         </div>
                      </div>
                   </div>
                </HoloCard>
             </div>

             {/* Q3: PORTFOLIO RISK (P&L Display) */}
             <div className={cn(isCompact ? "w-full" : "col-span-12 xl:col-span-3")}>
                <HoloCard 
                  variant="holographic"
                  className={cn(
                    "flex flex-col bg-black/60 relative overflow-hidden shadow-4xl",
                    isCompact ? "p-5 rounded-[2.5rem] border-cyan-500/20" : "h-full p-8 border-cyan-500/10 rounded-[4rem]",
                    expanded === 'q3' ? "fixed inset-12 z-[100] bg-black border-cyan-500/40" : ""
                  )}
                >
                   <div className="flex items-center justify-between mb-10 relative z-10">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-cyan-500/10 rounded-2xl">
                            <Layers size={20} className="text-cyan-500" />
                         </div>
                         <h3 className="text-[11px] font-black text-cyan-500 uppercase tracking-[0.6em] italic">РИЗИК-МАТРИЦЯ</h3>
                      </div>
                      <Button variant="cyber" onClick={() => setExpanded(expanded === 'q3' ? null : 'q3')} className="p-2 text-slate-700 hover:text-white transition-colors">
                        {expanded === 'q3' ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                      </Button>
                   </div>

                   <div className="flex-1 flex flex-col space-y-10 relative z-10">
                      <div className="flex items-center justify-center p-10 relative">
                         <div className="absolute inset-0 bg-cyan-500/10 blur-3xl rounded-full scale-110" />
                         <PieChart width={160} height={160}>
                            <Pie data={riskPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" paddingAngle={5}>
                               {riskPieData.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
                            </Pie>
                         </PieChart>
                      </div>
                      <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar">
                         {riskPieData.map((r, i) => (
                            <div key={i} className="flex items-center justify-between p-6 rounded-[2rem] border-2 border-white/5 bg-black hover:border-cyan-500/30 transition-all group/it shadow-2xl">
                               <div className="flex items-center gap-5">
                                  <div className="w-3 h-3 rounded-full transition-transform group-hover/it:scale-125 shadow-[0_0_10px_currentColor]" style={{ backgroundColor: r.color, color: r.color }} />
                                  <span className="text-[11px] font-black text-slate-700 group-hover/it:text-white transition-colors uppercase italic tracking-widest leading-none">{r.name}</span>
                                </div>
                                <span className="text-[13px] font-black text-cyan-500 font-mono italic tabular-nums leading-none tracking-tighter">{(r.value / 10).toFixed(1)}%</span>
                            </div>
                         ))}
                      </div>
                      <div className="mt-auto p-10 bg-cyan-600/10 border-2 border-cyan-500/30 rounded-[3.5rem] text-center shadow-inner relative group">
                         <div className="absolute inset-0 bg-cyan-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                         <p className="text-[10px] font-black text-rose-700 uppercase tracking-[0.5em] mb-4 italic">ЕКСПОЗИЦІЯ_РИЗИКУ</p>
                         <p className="text-4xl font-black text-cyan-500 italic tracking-tighter font-serif leading-none">$127.4M</p>
                      </div>
                   </div>
                </HoloCard>
             </div>

             {/* Q4: PREDICTIONS & ALERTS (AI / Scenarios) */}
             <div className={cn(isCompact ? "w-full" : "col-span-12 xl:col-span-8 overflow-hidden h-full")}>
                <HoloCard 
                  variant="holographic"
                  className={cn(
                    "flex flex-col bg-black/60 border-cyan-500/10 relative overflow-hidden shadow-4xl",
                    isCompact ? "p-5 rounded-[2.5rem]" : "h-full p-10 rounded-[4rem]",
                    expanded === 'q4' ? "fixed inset-12 z-[100] bg-black border-cyan-500/40" : ""
                  )}
                >
                   <div className="flex items-center justify-between mb-10 relative z-10">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-cyan-500/10 rounded-2xl">
                            <Zap size={20} className="text-cyan-500 " />
                         </div>
                         <h3 className="text-[11px] font-black text-cyan-500 uppercase tracking-[0.6em] italic">ШІ-ПРОГНОСТИКА ТА ЕЛІТНІ_АЛЕРТИ</h3>
                      </div>
                      <Button variant="cyber" onClick={() => setExpanded(expanded === 'q4' ? null : 'q4')} className="p-2 text-slate-700 hover:text-white transition-colors">
                        {expanded === 'q4' ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                      </Button>
                   </div>

                   <div className={cn("flex-1 relative z-10 overflow-hidden", isCompact ? "flex flex-col gap-8" : "grid grid-cols-12 gap-12")}>
                      <div className={cn("flex flex-col h-full", isCompact ? "w-full space-y-6" : "col-span-7 space-y-10")}>
                         <div className="flex items-center gap-6 mb-4">
                            <div className="p-4 rounded-[1.5rem] bg-cyan-500/10 text-cyan-500 border-2 border-cyan-500/30 ">
                               <Radar size={32} className="" />
                            </div>
                            <div>
                               <h4 className={cn("font-black text-white uppercase italic tracking-tighter leading-none mb-2 font-serif", isCompact ? "text-2xl" : "text-4xl")}>СЦЕНАРІЙ: ОМЕГА-4</h4>
                               <p className="text-[11px] font-black text-slate-800 uppercase tracking-[0.4em] leading-none italic">ПРЕДИКТИВНА МОДЕЛЬ ВЕКТОРУ РОЗШИРЕННЯ КОНФЛІКТУ</p>
                            </div>
                         </div>
                         <div className="space-y-4 flex-1">
                            {[
                               { t: 'Діючі санкції:', v: 'ПОВНЕ ЕМБАРГО', c: '#f43f5e', icon: Shield },
                               { t: 'Локальні гравці:', v: '14 ФІГУРАНТІВ', c: '#ffffff', icon: Users },
                               { t: 'Ймовірність ескалації:', v: '92.4%', c: '#f43f5e', icon: Target },
                            ].map((s, i) => (
                               <div key={i} className="flex items-center justify-between p-7 rounded-[3rem] bg-white/[0.01] border-2 border-white/5 hover:border-cyan-500/20 transition-all group/ic shadow-xl">
                                  <div className="flex items-center gap-5">
                                     <s.icon size={20} className="text-slate-800 group-hover/ic:text-cyan-500 transition-colors" />
                                     <span className="text-[13px] font-black text-slate-700 uppercase tracking-tight italic group-hover/ic:text-slate-300 transition-colors">{s.t}</span>
                                  </div>
                                  <span className={cn("text-[18px] font-black italic uppercase font-mono tracking-tighter", s.v === '92.4%' && "")} style={{ color: s.c }}>{s.v}</span>
                               </div>
                            ))}
                         </div>
                         <Button variant="cyber" className="w-full py-8 bg-cyan-600 text-white rounded-[2.5rem] text-[13px] font-black uppercase tracking-[0.4em] italic shadow-4xl hover:scale-[1.02] transition-all border-4 border-cyan-500/20">
                            ЗАПУСТИТИ_СИМУЛЯЦІЮ_РИЗИКУ_ELITE
                         </Button>
                      </div>
                      <div className={cn("flex flex-col space-y-6 h-full overflow-hidden", isCompact ? "w-full" : "col-span-5")}>
                         <div className="flex items-center justify-between text-[11px] font-black text-slate-900 uppercase tracking-[0.6em] italic mb-2">
                            <span>АКТИВНІ АЛЕРТИ</span>
                            <span className="text-cyan-600">РЕЖИМ_ХИЖАКА</span>
                         </div>
                         <div className="space-y-4 flex-1 overflow-y-auto pr-4 custom-scrollbar pb-10">
                            {alertsList.map((a, i) => (
                               <motion.div 
                                 key={i} 
                                 initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                                 className={cn(
                                  "p-7 rounded-[2.5rem] border-2 flex items-center gap-6 transition-all hover:scale-[1.01] shadow-xl",
                                  a.type === 'error' ? "bg-cyan-600/10 border-cyan-500/30 text-cyan-500 shadow-cyan-500/10" :
                                  a.type === 'warning' ? "bg-amber-600/10 border-amber-500/30 text-amber-500 shadow-amber-500/10" :
                                  "bg-white/5 border-white/10 text-slate-400 shadow-black"
                                )}>
                                  <div className="shrink-0 p-3 bg-black/40 rounded-xl border border-white/10">
                                     <Bell size={20} className={a.type === 'error' ? 'animate-bounce' : ''} />
                                  </div>
                                  <p className="text-[15px] font-black italic truncate leading-none uppercase tracking-tight">{a.msg}</p>
                                  <ChevronRight size={18} className="ml-auto opacity-20" />
                                </motion.div>
                            ))}
                         </div>
                      </div>
                   </div>
                   <div className="absolute -bottom-10 -right-10 p-32 opacity-5 pointer-events-none">
                      <Fingerprint size={300} className="text-cyan-500" />
                   </div>
                </HoloCard>
             </div>

          </div>
        </div>

        <div className={cn("max-w-[1950px] mx-auto pb-24 mt-4 w-full", isCompact ? "px-4" : "px-10")}>
            <DiagnosticsTerminal />
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          .custom-scrollbar::-webkit-scrollbar { width: 5px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(244,63,94,0.15); border-radius: 20px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(244,63,94,0.4); }
          .animate-spin-slow { animation: spin 40s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .no-scrollbar::-webkit-scrollbar { display: none; }
        `}} />
      </div>
    </PageTransition>
  );
}
