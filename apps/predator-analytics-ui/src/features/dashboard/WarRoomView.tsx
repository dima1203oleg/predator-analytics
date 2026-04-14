/**
 * 🛰️ WAR ROOM // СИТУАЦІЙНИЙ ЦЕНТР | v56.2-TITAN
 * PREDATOR Analytics — Tactical Multi-Screen Command Center
 * 
 * Єдиний віртуальний простір для CEO з агрегацією всіх критичних потоків.
 * 4 Квадранти сили: Глобальна розвідка, Системне ядро, P&L Ризиків, ШІ-Прогнози.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Globe, Shield, Zap, Terminal, Database, 
  Layers, AlertTriangle, TrendingUp, Cpu, Network,
  Maximize2, Minimize2, Radio, Target, Bell,
  ArrowUpRight, Clock, Box, Eye, CheckCircle2
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import CyberGlobe from '@/components/3d/CyberGlobe';
import { cn } from '@/lib/utils';

// --- MOCK DATA ---
const MOCK_LINE_DATA = Array.from({ length: 20 }, (_, i) => ({
  time: `${i}:00`,
  val: 30 + Math.random() * 40
}));

const RISK_PIE_DATA = [
  { name: 'Санкції', value: 400, color: '#dc2626' },
  { name: 'Логістика', value: 300, color: '#ea580c' },
  { name: 'Фін-ризики', value: 200, color: '#0ea5e9' },
];

// --- COMPONENT: Tactical Screen ---
const TacticalScreen = ({ title, icon: Icon, children, className, fullScreen, onToggleFull }: any) => (
  <motion.div
    layout
    className={cn(
      "relative rounded-[2rem] border-2 bg-black/60 shadow-3xl overflow-hidden transition-all duration-700",
      fullScreen ? "fixed inset-10 z-[100] bg-black/95 border-red-900/40" : "border-white/[0.04] hover:border-white/10",
      className
    )}
  >
    <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none" />
    <div className="flex items-center justify-between p-6 border-b border-white/[0.04] bg-white/[0.01]">
      <div className="flex items-center gap-4">
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-slate-500">
          <Icon size={18} />
        </div>
        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic leading-none">{title}</h3>
      </div>
      <div className="flex items-center gap-3">
         <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
         <button onClick={onToggleFull} className="p-2 text-slate-600 hover:text-white transition-colors">
           {fullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
         </button>
      </div>
    </div>
    <div className="p-8 h-full">
      {children}
    </div>
  </motion.div>
);

// --- MAIN VIEW ---
export default function WarRoomView() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    const itv = setInterval(() => setTicker(t => t + 1), 5000);
    return () => clearInterval(itv);
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(14,165,233,0.05),transparent_70%)] pointer-events-none" />
      
      {/* ── TOP NAV CONTOUR ── */}
      <div className="relative z-50 px-10 py-6 flex items-center justify-between border-b border-white/[0.04] bg-black/40 backdrop-blur-3xl">
         <div className="flex items-center gap-8">
            <div className="flex items-center gap-4">
               <div className="relative">
                  <div className="absolute inset-0 bg-red-600/30 blur-2xl rounded-full" />
                  <Target size={32} className="text-red-600 relative z-10 animate-pulse" />
               </div>
               <div>
                  <h1 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none truncate max-w-[200px] md:max-w-none">WAR_ROOM // TITAN-01</h1>
                  <p className="text-[9px] font-mono font-black text-slate-600 uppercase tracking-widest mt-1">ОБ'ЄДНАНЕ ТАКТИЧНЕ УПРАВЛІННЯ</p>
               </div>
            </div>
            <div className="h-10 w-px bg-white/5 hidden md:block" />
            <div className="hidden md:flex items-center gap-6">
               <div className="text-left">
                  <p className="text-[8px] font-black text-slate-700 uppercase leading-none mb-1">ГЛОБАЛЬНИЙ РИЗИК</p>
                  <p className="text-lg font-black text-red-500 italic font-mono leading-none tracking-tighter">84.2%</p>
               </div>
               <div className="text-left">
                  <p className="text-[8px] font-black text-slate-700 uppercase leading-none mb-1">UPTIME</p>
                  <p className="text-lg font-black text-white italic font-mono leading-none tracking-tighter uppercase">99.98%</p>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-6 py-2 bg-black/60 rounded-full border border-white/[0.05]">
               <Clock size={14} className="text-slate-600" />
               <p className="text-[12px] font-black font-mono text-slate-300 italic tabular-nums leading-none">
                  {new Date().toLocaleTimeString('uk-UA')}
               </p>
            </div>
            <button className="px-8 py-3 bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] italic hover:bg-red-600 transition-all shadow-xl">
               ДЕФОРМАТУВАТИ // EMERGENCY
            </button>
         </div>
      </div>

      {/* ── QUADRANTS GRID ── */}
      <div className="relative z-10 grid grid-cols-12 grid-rows-2 gap-8 p-10 h-[calc(100vh-100px)]">
         
         {/* Q1: GLOBAL INTEL (Radar/Globe) */}
         <div className="col-span-12 xl:col-span-4 row-span-2">
            <TacticalScreen 
              title="ГЛОБАЛЬНА РОЗВІДКА" 
              icon={Globe} 
              fullScreen={expanded === 'q1'} 
              onToggleFull={() => setExpanded(expanded === 'q1' ? null : 'q1')}
              className="h-full"
            >
               <div className="h-full flex flex-col space-y-10">
                  <div className="h-[45%] relative rounded-[2rem] overflow-hidden border border-white/5 bg-black/40 shadow-inner group">
                     <div className="absolute inset-0 z-0">
                        <CyberGlobe />
                     </div>
                     <div className="absolute top-5 left-5 z-10 bg-black/60 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md">
                        <p className="text-[10px] font-black text-emerald-500 uppercase italic tracking-widest">ORBITAL_PHASE: ACTIVE</p>
                     </div>
                  </div>
                  <div className="flex-1 space-y-6 overflow-y-auto pr-4 custom-scrollbar">
                     <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] italic mb-4">ГАРЯЧІ ЗОНИ КОНФЛІКТУ</h4>
                     {[
                        { zone: 'Схід Європи', risk: '98%', status: 'WAR_ACTIVE' },
                        { zone: 'Червоне море', risk: '84%', status: 'BLOCKADE' },
                        { zone: 'Тайваньська прот.', risk: '72%', status: 'SIGNAL_UP' },
                        { zone: 'Еквадор', risk: '54%', status: 'STABLE' },
                     ].map((z, i) => (
                        <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.05] transition-all">
                           <div className="flex items-center gap-4">
                              <div className={cn("h-3 w-3 rounded-full animate-pulse", z.risk === '98%' ? "bg-red-600" : "bg-orange-500")} />
                              <div className="text-left font-black italic">
                                 <p className="text-[13px] text-white uppercase">{z.zone}</p>
                                 <p className="text-[8px] text-slate-600 uppercase tracking-widest mt-0.5">{z.status}</p>
                              </div>
                           </div>
                           <p className="text-lg font-black text-red-500 italic font-mono tracking-tighter leading-none">{z.risk}</p>
                        </div>
                     ))}
                  </div>
               </div>
            </TacticalScreen>
         </div>

         {/* Q2: SYSTEM KERNEL (Metrics/Logs) */}
         <div className="col-span-12 xl:col-span-5">
            <TacticalScreen 
              title="ЯДРО TITAN-01" 
              icon={Activity} 
              fullScreen={expanded === 'q2'} 
              onToggleFull={() => setExpanded(expanded === 'q2' ? null : 'q2')}
              className="h-full"
            >
               <div className="grid grid-cols-2 gap-8 h-full">
                  <div className="space-y-6">
                     <div className="h-[140px] w-full border border-white/5 rounded-2xl bg-black/40 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={MOCK_LINE_DATA}>
                              <defs>
                                <linearGradient id="q2grad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <Area type="monotone" dataKey="val" stroke="#0ea5e9" strokeWidth={2} fill="url(#q2grad)" />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                           <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest leading-none mb-1">CPU_LOAD</p>
                           <p className="text-xl font-black text-sky-400 font-mono italic">34.2%</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                           <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest leading-none mb-1">RAM_USAGE</p>
                           <p className="text-xl font-black text-amber-500 font-mono italic">12.1G</p>
                        </div>
                     </div>
                     <div className="p-6 rounded-3xl bg-emerald-600/10 border border-emerald-600/20 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <Database size={20} className="text-emerald-500" />
                           <p className="text-[12px] font-black text-emerald-500 uppercase italic">БАЗИ ДАНИХ ОНЛАЙН</p>
                        </div>
                        <CheckCircle2 size={18} className="text-emerald-500" />
                     </div>
                  </div>
                  <div className="bg-black border border-white/5 rounded-3xl p-6 font-mono text-[10px] space-y-3 overflow-hidden">
                     <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
                        <Terminal size={14} className="text-slate-600" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">LIVE_TERMINAL</span>
                     </div>
                     <p><span className="text-slate-800">[14:32:01]</span> <span className="text-sky-500">KERNEL:</span> Ingestion sync confirmed.</p>
                     <p><span className="text-slate-800">[14:32:05]</span> <span className="text-red-500">ALARM:</span> Risk threshold POS-001 breach.</p>
                     <p><span className="text-slate-800">[14:32:15]</span> <span className="text-emerald-500">RESOLVER:</span> Entity KYOTO_HOLD resolved.</p>
                     <p><span className="text-slate-800">[14:32:22]</span> <span className="text-slate-600">IDLE:</span> Waiting for Kafka burst...</p>
                     <p className="animate-pulse">_</p>
                  </div>
               </div>
            </TacticalScreen>
         </div>

         {/* Q3: PORTFOLIO RISK (P&L Display) */}
         <div className="col-span-12 xl:col-span-3">
            <TacticalScreen 
              title="РИЗИК-МАТРИЦЯ" 
              icon={Layers} 
              fullScreen={expanded === 'q3'} 
              onToggleFull={() => setExpanded(expanded === 'q3' ? null : 'q3')}
              className="h-full"
            >
               <div className="flex flex-col h-full space-y-6">
                  <div className="flex items-center justify-center h-[120px]">
                     <PieChart width={120} height={120}>
                        <Pie data={RISK_PIE_DATA} cx="50%" cy="50%" innerRadius={35} outerRadius={50} dataKey="value">
                           {RISK_PIE_DATA.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
                        </Pie>
                     </PieChart>
                  </div>
                  <div className="space-y-3">
                     {RISK_PIE_DATA.map((r, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-white/[0.03] bg-white/[0.01]">
                           <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                              <span className="text-[10px] font-black text-slate-500 uppercase italic leading-none">{r.name}</span>
                           </div>
                           <span className="text-[11px] font-black text-white font-mono italic tabular-nums leading-none">{(r.value / 10).toFixed(1)}%</span>
                        </div>
                     ))}
                  </div>
                  <div className="mt-auto p-6 bg-red-600/10 border border-red-600/30 rounded-3xl text-center">
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">РИЗИК ПОРТФЕЛЮ ЗАРАЗ</p>
                     <p className="text-3xl font-black text-red-500 italic tracking-tighter leading-none">$127.4M</p>
                  </div>
               </div>
            </TacticalScreen>
         </div>

         {/* Q4: PREDICTIONS & ALERTS (AI / Scenarios) */}
         <div className="col-span-12 xl:col-span-8 overflow-hidden h-full">
            <TacticalScreen 
              title="ШІ-ПРОГНОСТИКА ТА АЛЕРТИ" 
              icon={Zap} 
              fullScreen={expanded === 'q4'} 
              onToggleFull={() => setExpanded(expanded === 'q4' ? null : 'q4')}
              className="h-full"
            >
               <div className="grid grid-cols-12 gap-10 h-full">
                  <div className="col-span-7 space-y-6">
                     <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 rounded-2xl bg-amber-600/10 text-amber-500 border border-amber-600/20 shadow-xl">
                           <Eye size={22} className="animate-pulse" />
                        </div>
                        <div>
                           <h4 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none mb-1">SCENARIO: OMEGA-4</h4>
                           <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest leading-none">ПРЕДИКТИВНА МОДЕЛЬ ВЕКТОРУ РОЗШИРЕННЯ КОНФЛІКТУ</p>
                        </div>
                     </div>
                     <div className="space-y-4">
                        {[
                           { t: 'Діючі санкції:', v: 'ПОВНЕ ЕМБАРГО', c: 'text-red-500' },
                           { t: 'Локальні гравці:', v: '14 ФІГУРАНТІВ', c: 'text-white' },
                           { t: 'Ймовірність ескалації:', v: '92%', c: 'text-red-600 animate-pulse' },
                        ].map((s, i) => (
                           <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.01] border border-white/[0.04]">
                              <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight italic">{s.t}</span>
                              <span className={cn("text-[13px] font-black italic uppercase", s.c)}>{s.v}</span>
                           </div>
                        ))}
                     </div>
                     <button className="w-full py-5 bg-gradient-to-r from-amber-600 to-amber-800 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.3em] italic shadow-2xl hover:scale-[1.02] transition-all">
                        ЗАПУСТИТИ_СИМУЛЯЦІЮ_РИЗИКУ
                     </button>
                  </div>
                  <div className="col-span-5 space-y-5 h-full overflow-hidden">
                     <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] italic mb-4">АКТИВНІ АЛЕРТИ</h4>
                     <div className="space-y-3 max-h-[280px] overflow-y-auto pr-4 custom-scrollbar">
                        {[
                           { msg: 'Виявлено збіг UBO (POS-001)', type: 'error' },
                           { msg: 'Нова реєстрація Shell-компанії (BVI)', type: 'warning' },
                           { msg: 'Аномальна транзакція: Абу-Дабі', type: 'warning' },
                           { msg: 'Оновлено реєстр PEP Україна', type: 'info' },
                        ].map((a, i) => (
                           <div key={i} className={cn(
                              "p-5 rounded-2xl border flex items-center gap-4 transition-all hover:bg-white/[0.02]",
                              a.type === 'error' ? "bg-red-600/10 border-red-600/30 text-red-400" :
                              a.type === 'warning' ? "bg-amber-600/10 border-amber-600/30 text-amber-500" :
                              "bg-sky-600/10 border-sky-600/30 text-sky-400"
                           )}>
                              <Bell size={16} className={a.type === 'error' ? 'animate-bounce' : ''} />
                              <p className="text-[12px] font-bold italic truncate leading-none uppercase">{a.msg}</p>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </TacticalScreen>
         </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .shadow-3xl {
           box-shadow: 0 60px 100px -30px rgba(0, 0, 0, 0.8);
        }
        .custom-scrollbar::-webkit-scrollbar {
           width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
           background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
           background: rgba(255,255,255,0.05);
           border-radius: 10px;
        }
        .animate-spin-slow {
           animation: spin 30s linear infinite;
        }
        @keyframes spin {
           from { transform: rotate(0deg); }
           to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
