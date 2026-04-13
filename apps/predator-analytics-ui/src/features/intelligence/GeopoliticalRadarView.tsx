/**
 * 📡 ГЕОПОЛІТИЧНИЙ СЕЙСМОГРАФ | v56.2-TITAN
 * PREDATOR Analytics — Geopolitical Risk Intelligence
 *
 * Real-time геополітичні тренди, санкції, конфлікти,
 * ризики для ланцюгів постачання по країнах.
 * Sovereign Power Design · Classified · Tier-1
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, AlertTriangle, TrendingUp, TrendingDown,
  Shield, Zap, Activity, Target, RefreshCw, Download,
  ChevronRight, Radio, Flame, Wind, CloudLightning,
  Lock, Eye, BarChart3, Satellite, Network, Crosshair,
  ArrowUpRight, AlertOctagon
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar as RadarRecharts
} from 'recharts';
import { cn } from '@/lib/utils';

// ─── ДАНІ ────────────────────────────────────────────────────────────

const WORLD_REGIONS = [
  {
    id: 'ua-ru',
    name: 'Схід Європи',
    sub: 'Україна / Росія / Білорусь',
    riskLevel: 98,
    trend: 'up',
    events: 24,
    sanction: 847,
    flag: '🇺🇦🇷🇺',
    color: '#dc2626',
    category: 'ВОЄННИЙ КОНФЛІКТ',
    supplyRisk: 94,
    energyRisk: 89,
    finRisk: 76,
    items: [
      'Нові пакети санкцій ЄС (пакет №15) — повне ембарго',
      'Заморожені активи РФ: €300B під управлінням ЄС',
      'Енергетичний шантаж: атаки на вузли ПС',
    ],
  },
  {
    id: 'cn-tw',
    name: 'Тихоокеанська Дуга',
    sub: 'Китай / Тайвань / КНДР',
    riskLevel: 78,
    trend: 'up',
    events: 12,
    sanction: 213,
    flag: '🇨🇳🇹🇼',
    color: '#ea580c',
    category: 'ГІПЕРРИЗИК НАПРУЖЕНІСТЬ',
    supplyRisk: 88,
    energyRisk: 55,
    finRisk: 68,
    items: [
      'Блокада Тайванської протоки: навчання флоту',
      'Технологічна ізоляція: нові обмеження на чіпи',
      'КНДР: запуск балістичного носія нового типу',
    ],
  },
  {
    id: 'me',
    name: 'Близький Схід',
    sub: 'Ізраїль / Іран / Саудівська Аравія',
    riskLevel: 84,
    trend: 'stable',
    events: 18,
    sanction: 421,
    flag: '🇮🇱🇮🇷',
    color: '#dc2626',
    category: 'ЗБРОЙНА ЕСКАЛАЦІЯ',
    supplyRisk: 74,
    energyRisk: 94,
    finRisk: 58,
    items: [
      'Критична загроза судноплавству в Червоному морі',
      'Ормузька протока: мобілізація ВМС Ірану',
      'Ракетні удари по нафтовій інфраструктурі',
    ],
  },
  {
    id: 'af',
    name: 'Африканська Нестабільність',
    sub: 'Сахель / Судан / Ефіопія',
    riskLevel: 62,
    trend: 'up',
    events: 9,
    sanction: 87,
    flag: '🌍',
    color: '#b45309',
    category: 'ДЕСТАБІЛІЗАЦІЯ',
    supplyRisk: 68,
    energyRisk: 41,
    finRisk: 34,
    items: [
      'Поширення впливу ПВК у регіоні Сахель',
      'Боротьба за рідкоземельні метали: Конго',
      'Харчова безпека: перебої в поставках зерна',
    ],
  },
  {
    id: 'eu',
    name: 'Західний Альянс',
    sub: 'НАТО / ЄС / Балтія',
    riskLevel: 34,
    trend: 'down',
    events: 4,
    sanction: 12,
    flag: '🇪🇺',
    color: '#2563eb',
    category: 'ПОМІРНИЙ',
    supplyRisk: 28,
    energyRisk: 42,
    finRisk: 22,
    items: [
      'Диверсії на підводній інфраструктурі зв\'язку',
      'Кібератаки на енергосистеми Балтії',
      'Політичний розкол щодо військової допомоги',
    ],
  },
];

const TIMELINE_DATA = [
  { date: '01.01', risk: 62 }, { date: '15.01', risk: 68 },
  { date: '01.02', risk: 74 }, { date: '15.02', risk: 81 },
  { date: '01.03', risk: 79 }, { date: '15.03', risk: 85 },
  { date: '01.04', risk: 91 }, { date: '13.04', risk: 88 },
];

const RADAR_DATA = [
  { subject: 'Енерго', value: 92 },
  { subject: 'Фін',   value: 78 },
  { subject: 'Торг',  value: 84 },
  { subject: 'Кібер', value: 96 },
  { subject: 'Прод',  value: 65 },
  { subject: 'Лог',   value: 88 },
];

const LIVE_EVENTS = [
  { time: '14:22', region: 'Червоне море', event: 'Влучання БПЛА в танкер "AQUILA"', level: 'КРИТИЧНИЙ', icon: Flame },
  { time: '13:58', region: 'Нідерланди',   event: 'Кібератака на портовий термінал Роттердаму', level: 'ВАЖЛИВИЙ',  icon: Network },
  { time: '12:45', region: 'Тайвань',     event: 'Входження 42 винищувачів КНР у зону ППО', level: 'ВАЖЛИВИЙ',  icon: Crosshair },
  { time: '11:10', region: 'Україна',      event: 'Ухвалення закону про спец. конфіскацію активів РФ', level: 'ІНФО',       icon: Shield },
];

// ─── КОМПОНЕНТ ────────────────────────────────────────────────────────

const GeopoliticalRadarView: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState(WORLD_REGIONS[0]);
  const [seismographData, setSeismographData] = useState<number[]>([]);
  const [alertCount, setAlertCount] = useState(14);
  const seismRef = useRef<number[]>([]);

  // Simulation of a tactical seismograph wave
  useEffect(() => {
    const id = setInterval(() => {
      const base = selectedRegion.riskLevel;
      const newVal = base + (Math.random() - 0.5) * 15;
      seismRef.current = [...seismRef.current.slice(-99), newVal];
      setSeismographData([...seismRef.current]);
    }, 120);
    return () => clearInterval(id);
  }, [selectedRegion]);

  const getRiskColor = (level: number) =>
    level >= 90 ? '#dc2626' : level >= 75 ? '#ea580c' : level >= 50 ? '#d97706' : '#2563eb';

  return (
    <div className="min-h-screen text-slate-200 font-sans pb-24 relative overflow-hidden bg-[#020617]">
      {/* Tactical Background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cyber-grid opacity-[0.05]" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% -10%, rgba(220,38,38,0.12), transparent 70%)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
      </div>

      <div className="relative z-10 max-w-[1700px] mx-auto p-6 space-y-8">

        {/* ── HEADER SECTION ── */}
        <div className="flex flex-col lg:flex-row items-end lg:items-center justify-between gap-8 py-6 border-b border-white/[0.04]">
          <div className="flex items-center gap-8">
            <div className="relative group/orb">
               <div className="absolute inset-0 bg-red-600/20 blur-3xl animate-pulse rounded-full" />
               <div className="relative p-6 bg-black border border-red-900/40 rounded-[2rem] shadow-2xl">
                 <Globe size={42} className="text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,0.8)] animate-spin-slow" />
                 <motion.div
                   animate={{ scale: [1, 1.3, 1], opacity: [1, 0.4, 1] }}
                   transition={{ duration: 1.5, repeat: Infinity }}
                   className="absolute top-4 right-4 w-4 h-4 bg-red-600 rounded-full shadow-[0_0_15px_#dc2626]"
                 />
               </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                 <span className="badge-v2 badge-v2-rose px-3 py-1 text-[10px] font-black tracking-[0.3em] uppercase italic">
                   GEOPOLITICAL_SIGINT // ACTIVE_MONITORING
                 </span>
                 <div className="h-0.5 w-16 bg-gradient-to-r from-red-600 to-transparent" />
                 <span className="text-[10px] font-mono font-black text-slate-600 tracking-widest uppercase">v56.2 TITAN-RADAR</span>
              </div>
              <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic skew-x-[-2deg] leading-none">
                ГЕОПОЛІТИЧНИЙ <span className="text-red-600 underline decoration-red-600/20 decoration-8">СЕЙСМОГРАФ</span>
              </h1>
              <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] italic opacity-80 leading-tight">
                Конфлікти • Санкційні Хвилі • Торгові Блокади • Енергетичні Ризики
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-6 px-10 py-5 bg-black/60 rounded-[2rem] border-2 border-red-900/30 shadow-2xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-red-600/[0.03] opacity-0 group-hover:opacity-100 transition-opacity" />
               <motion.div 
                 animate={{ rotate: 360 }} 
                 transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                 className="p-3 bg-red-600/10 rounded-xl"
               >
                 <Satellite size={20} className="text-red-500" />
               </motion.div>
               <div className="text-left">
                  <p className="text-[12px] font-black text-red-500 italic tracking-tighter leading-none mb-1">{alertCount} ГАРЯЧИХ ТРИВОГ</p>
                  <p className="text-[9px] font-mono font-black text-slate-700 uppercase tracking-widest leading-none">СИНХРОНІЗАЦІЯ СУПУТНИКА</p>
               </div>
            </div>
            <button className="px-12 py-5 bg-red-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-red-600 transition-all border border-red-500/40 flex items-center gap-4 shadow-[0_15px_40px_rgba(220,38,38,0.2)] italic group">
              <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
              ЗВІТ_ДЛЯ_РНБО
            </button>
          </div>
        </div>

        {/* ── LIVE SEISMOGRAPH VISUALIZATION ── */}
        <section className="rounded-[3rem] bg-black/80 border-2 border-red-900/40 p-8 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden group">
           <div className="absolute inset-0 bg-red-600/[0.01] opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-6">
                 <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600/10 border border-red-600/20">
                    <Activity size={24} className="text-red-600 animate-pulse" />
                 </div>
                 <div>
                    <h2 className="text-[15px] font-black text-white uppercase italic tracking-[0.2em] leading-none mb-1">ГЛОБАЛЬНИЙ ІНДЕКС ТЕКТОНІЧНОГО РИЗИКУ</h2>
                    <p className="text-[10px] font-mono text-slate-600 font-black uppercase tracking-widest leading-none">АНАЛІЗ ОСЦІЛЯЦІЙ: {selectedRegion.name.toUpperCase()}</p>
                 </div>
              </div>
              <div className="text-right">
                 <div className="text-4xl font-black text-red-500 italic tabular-nums leading-none tracking-tighter" style={{ textShadow: '0 0 20px rgba(220,38,38,0.4)' }}>
                   {selectedRegion.riskLevel}.{Math.floor(Math.random()*10)}
                 </div>
              </div>
           </div>

           <div className="h-32 flex items-center gap-1 overflow-hidden relative z-10">
              {seismographData.map((v, i) => (
                <div
                  key={i}
                  className="w-1.5 shrink-0 rounded-full transition-all duration-300"
                  style={{
                    height: `${Math.max(10, v * 0.8)}%`,
                    backgroundColor: v > 90 ? '#dc2626' : v > 75 ? '#ea580c' : '#711a1a',
                    opacity: 0.3 + (i / 100) * 0.7,
                    boxShadow: v > 85 ? `0 0 15px rgba(220,38,38,${(i / 100) * 0.6})` : 'none',
                  }}
                />
              ))}
              <div className="absolute right-0 top-0 bottom-0 w-px bg-red-600/40 shadow-[0_0_30px_#dc2626]" />
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-10 pt-10 border-t border-white/[0.05] relative z-10">
              {[
                { label: 'МАКС. НАПРУЖЕНІСТЬ', value: '98/100', color: 'text-red-500', icon: Flame },
                { label: 'АКТИВНІ КОНФЛІКТИ', value: '8 ЛОКАЦІЙ', color: 'text-orange-500', icon: Target },
                { label: 'САНКЦІЙНІ ТРИГЕРИ', value: '1,582', color: 'text-red-600', icon: Lock },
                { label: 'ДИСТРУКЦІЯ ТОРГІВЛІ', value: '34% ОБСЯГУ', color: 'text-amber-600', icon: Network },
              ].map((m, i) => (
                <div key={i} className="flex flex-col gap-2">
                   <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic leading-none">{m.label}</p>
                   <div className="flex items-center gap-3">
                      <m.icon size={16} className={cn("opacity-40", m.color.replace('text-', 'text-'))} />
                      <p className={cn("text-xl font-black italic font-mono tracking-tighter leading-none", m.color)}>{m.value}</p>
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* ── CORE INTELLIGENCE GRID ── */}
        <div className="grid grid-cols-12 gap-8">

          {/* LEFT: HOTSPOTS SELECTOR (3/12) */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
             <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic flex items-center gap-3">
                   <Crosshair size={14} className="text-red-600" /> ГАРЯЧІ ТОЧКИ
                </h3>
             </div>
             <div className="space-y-3">
                {WORLD_REGIONS.map(region => (
                  <motion.button
                    key={region.id}
                    whileHover={{ x: 6 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedRegion(region)}
                    className={cn(
                      "w-full text-left p-6 rounded-[2rem] border-2 transition-all relative overflow-hidden group/item",
                      selectedRegion.id === region.id
                        ? "bg-red-600/[0.04] border-red-600/40 shadow-2xl"
                        : "bg-black/40 border-white/[0.04] hover:border-red-600/20 hover:bg-black/60"
                    )}
                  >
                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <div className="text-3xl mb-4 group-hover/item:scale-110 transition-transform">{region.flag}</div>
                        <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">{region.name}</h4>
                        <p className="text-[9px] font-bold text-slate-600 mt-2 uppercase tracking-wide leading-none">{region.sub}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black font-mono italic tracking-tighter leading-none mb-1" style={{ color: getRiskColor(region.riskLevel) }}>
                          {region.riskLevel}%
                        </p>
                        <p className="text-[8px] font-black text-slate-700 uppercase leading-none">RISK</p>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex items-center justify-between relative z-10">
                       <span className="text-[9px] font-black uppercase tracking-widest italic" style={{ color: getRiskColor(region.riskLevel) }}>{region.category}</span>
                       <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-black/40 border border-white/5 text-[8px] font-mono font-black text-slate-600">
                          {region.events} EV/W
                       </div>
                    </div>

                    <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-900 overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }} 
                         animate={{ width: `${region.riskLevel}%` }}
                         className="h-full shadow-[0_-5px_15px]" 
                         style={{ backgroundColor: getRiskColor(region.riskLevel), boxShadow: `0 0 10px ${getRiskColor(region.riskLevel)}` }}
                       />
                    </div>
                  </motion.button>
                ))}
             </div>
          </div>

          {/* CENTER: DETAILED INTELLIGENCE HUD (6/12) */}
          <div className="col-span-12 lg:col-span-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedRegion.id}
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="space-y-6"
              >
                 {/* REGION OVERVIEW CARD */}
                 <div className="rounded-[3rem] bg-black border-2 border-white/[0.04] p-10 relative overflow-hidden shadow-3xl group/hub">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.05] pointer-events-none group-hover/hub:scale-110 transition-transform">
                       <Globe size={240} style={{ color: selectedRegion.color }} />
                    </div>
                    <div className="relative z-10">
                       <div className="flex items-center gap-6 mb-8">
                          <div className="text-6xl group-hover/hub:rotate-6 transition-transform">{selectedRegion.flag}</div>
                          <div>
                             <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">{selectedRegion.name}</h2>
                             <div className="flex items-center gap-4">
                                <span className={cn("px-4 py-1 rounded-full text-[10px] font-black italic tracking-[0.2em] border uppercase shadow-lg shadow-red-600/10",
                                  "bg-red-600/10 text-red-500 border-red-600/20"
                                )}>
                                  {selectedRegion.category}
                                </span>
                             </div>
                          </div>
                       </div>

                       <div className="grid grid-cols-3 gap-8">
                          {[
                            { label: 'ПОСТАЧАННЯ', value: selectedRegion.supplyRisk, icon: Network },
                            { label: 'ЕНЕРГЕТИКА', value: selectedRegion.energyRisk, icon: Flame },
                            { label: 'ФІНАНСИ',    value: selectedRegion.finRisk, icon: DollarSign },
                          ].map((r, i) => (
                            <div key={i} className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/[0.04] space-y-4 shadow-xl">
                               <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">{r.label}</span>
                                  <r.icon size={16} className="text-slate-800" />
                               </div>
                               <div className="flex items-baseline gap-3">
                                  <p className="text-3xl font-black font-mono tracking-tighter italic leading-none" style={{ color: getRiskColor(r.value) }}>{r.value}%</p>
                                  <div className={cn("text-[9px] font-black uppercase", r.value > 85 ? "text-red-600 animate-pulse" : "text-slate-700")}>
                                     {r.value > 85 ? 'EXTREME' : 'MONITOR'}
                                  </div>
                               </div>
                               <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                                  <div className="h-full transition-all duration-1000" style={{ width: `${r.value}%`, backgroundColor: getRiskColor(r.value) }} />
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 {/* ACTIONABLE FACTORS LIST */}
                 <div className="rounded-[2.5rem] bg-black/60 border border-white/[0.04] p-8 shadow-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                       <h3 className="text-[13px] font-black text-white uppercase italic tracking-[0.3em] flex items-center gap-4 leading-none">
                          <AlertTriangle size={18} className="text-orange-600" /> КРИТИЧНІ ФАКТОРИ ТА ПОДІЇ
                       </h3>
                       <div className="h-px w-24 bg-white/[0.04]" />
                    </div>
                    <div className="space-y-4">
                       {selectedRegion.items.map((item, i) => (
                         <motion.div
                           key={i}
                           initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                           className="group flex items-center gap-6 p-6 rounded-[1.5rem] border border-white/[0.04] bg-white/[0.01] hover:border-red-600/30 hover:bg-red-600/[0.02] transition-all shadow-xl"
                         >
                           <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black border border-white/5 shrink-0 group-hover:scale-110 group-hover:bg-red-600 transition-all">
                              <AlertTriangle size={20} className={cn("group-hover:text-white transition-colors", i === 0 ? "text-red-500" : "text-amber-600")} />
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-[15px] font-bold text-slate-200 group-hover:text-white transition-colors italic tracking-tight leading-snug">{item}</p>
                              <div className="flex items-center gap-3 mt-3">
                                 <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic group-hover:text-red-400">IMPACT_SCORE: HIGH</span>
                              </div>
                           </div>
                           <ArrowUpRight size={20} className="text-slate-800 group-hover:text-white transition-all opacity-0 group-hover:opacity-100" />
                         </motion.div>
                       ))}
                    </div>
                 </div>

                 {/* TREND ANALYSIS CHART */}
                 <div className="rounded-[2.5rem] bg-black/60 border border-white/[0.04] p-8 shadow-2xl">
                    <h3 className="text-[13px] font-black text-white uppercase italic tracking-[0.3em] flex items-center gap-4 mb-10 leading-none">
                       <Activity size={18} className="text-red-600" /> ДИНАМІКА ГЕОПОЛІТИЧНИХ ШОКІВ
                    </h3>
                    <div className="h-[220px]">
                       <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={TIMELINE_DATA} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                           <defs>
                             <linearGradient id="gradShock" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%"  stopColor="#dc2626" stopOpacity={0.4} />
                               <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                             </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                           <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                           <YAxis hide />
                           <Tooltip
                             contentStyle={{ background: '#050a14', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '16px', color: '#fff' }}
                             itemStyle={{ color: '#ef4444', fontWeight: 'bold' }}
                           />
                           <Area type="monotone" dataKey="risk" stroke="#dc2626" strokeWidth={3} fill="url(#gradShock)" animationDuration={1500} />
                         </AreaChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* RIGHT: LIVE FEED & SUMMARY (3/12) */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            
             {/* RADAR PROFILE HUB */}
             <div className="rounded-[2.5rem] bg-black/60 border border-white/[0.04] p-8 shadow-2xl space-y-8">
                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic leading-none">ГЛОБАЛЬНИЙ ПРОФІЛЬ РИЗИКУ</h3>
                <div className="h-[240px]">
                   <ResponsiveContainer width="100%" height="100%">
                     <RadarChart data={RADAR_DATA} cx="50%" cy="50%" outerRadius="75%">
                       <PolarGrid stroke="rgba(255,255,255,0.08)" />
                       <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 9, fontWeight: 'black' }} />
                       <RadarRecharts name="РИЗИК" dataKey="value" stroke="#dc2626" fill="#dc2626" fillOpacity={0.2} strokeWidth={2} />
                     </RadarChart>
                   </ResponsiveContainer>
                </div>
                <div className="border-t border-white/5 pt-6 grid grid-cols-2 gap-4">
                   <div className="text-center">
                      <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-1">AVG_INTENS</p>
                      <p className="text-xl font-black text-white italic tracking-tighter">74.2%</p>
                   </div>
                   <div className="text-center">
                      <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-1">ALERT_STATUS</p>
                      <p className="text-xl font-black text-red-600 italic tracking-tighter">ALFA-1</p>
                   </div>
                </div>
             </div>

             {/* LIVE INTEL FEED */}
             <div className="rounded-[2.5rem] bg-black border-2 border-white/[0.04] overflow-hidden shadow-3xl">
                <div className="p-6 border-b border-white/[0.04] flex items-center justify-between bg-white/[0.01]">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic flex items-center gap-3 leading-none">
                      <Radio size={14} className="text-red-700 animate-pulse" /> LIVE_INTEL_FEED
                   </h3>
                   <span className="text-[9px] font-mono font-black text-red-800">14 НОВИХ</span>
                </div>
                <div className="divide-y divide-white/[0.02]">
                   {LIVE_EVENTS.map((ev, i) => (
                     <motion.div
                       key={i}
                       initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                       className="p-6 hover:bg-red-600/[0.04] transition-all cursor-pointer group/ev"
                     >
                       <div className="flex items-center justify-between mb-3">
                         <div className={cn(
                           "px-3 py-1 rounded-lg text-[9px] font-black italic tracking-widest uppercase border transition-colors",
                           ev.level === 'КРИТИЧНИЙ' ? "bg-red-600/10 text-red-500 border-red-600/30 group-hover/ev:bg-red-600 group-hover/ev:text-white" :
                           "bg-white/5 text-slate-600 border-white/5"
                         )}>
                           {ev.level}
                         </div>
                         <span className="text-[10px] font-mono text-slate-700 font-bold">{ev.time}</span>
                       </div>
                       <p className="text-[13px] font-black text-slate-300 leading-snug group-hover/ev:text-white transition-colors italic tracking-tight">{ev.event}</p>
                       <div className="flex items-center gap-2 mt-4 text-[9px] text-slate-700 font-black uppercase tracking-widest">
                          <ev.icon size={12} className="opacity-40" /> {ev.region}
                       </div>
                     </motion.div>
                   ))}
                </div>
                <button className="w-full py-5 text-[10px] font-black text-slate-600 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-3 uppercase tracking-widest italic border-t border-white/[0.04]">
                   УСІ ПРЯМІ ПЕРЕХОПЛЕННЯ <ChevronRight size={14} />
                </button>
             </div>

          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .badge-v2-rose { background: rgba(220,38,38,0.1); border: 1px solid rgba(220,38,38,0.2); color: #ef4444; }
        .shadow-3xl { box-shadow: 0 60px 100px -30px rgba(0,0,0,0.8); }
        .animate-spin-slow { animation: spin 15s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
};

export default GeopoliticalRadarView;
