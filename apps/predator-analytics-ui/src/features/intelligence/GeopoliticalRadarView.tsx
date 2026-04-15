/**
 * 📡 ГЕОПОЛІТИЧНИЙ СЕЙСМОГРАФ | v56.5-ELITE
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
  ArrowUpRight, AlertOctagon, DollarSign, Radar, Cpu
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar as RadarRecharts
} from 'recharts';
import { cn } from '@/utils/cn';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { ViewHeader } from '@/components/ViewHeader';

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
    color: '#E11D48',
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
    color: '#D4AF37',
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
    color: '#E11D48',
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
    color: '#D4AF37',
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
    color: '#3b82f6',
    category: 'ПОМІРНИЙ РИЗИК',
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
  { date: '01.04', risk: 91 }, { date: '15.04', risk: 88 },
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
    level >= 90 ? '#E11D48' : level >= 75 ? '#f97316' : level >= 50 ? '#D4AF37' : '#3b82f6';

  return (
    <div className="min-h-screen text-slate-200 font-sans pb-32 relative overflow-hidden bg-[#020202]">
      <AdvancedBackground />
      <CyberGrid color="rgba(212, 175, 55, 0.04)" />
      
      <div className="absolute inset-x-0 top-0 h-[800px] bg-[radial-gradient(circle_at_50%_0%,rgba(225,29,72,0.08),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(212,175,55,0.03),transparent_60%)] pointer-events-none" />

      <div className="relative z-10 max-w-[1850px] mx-auto p-4 sm:p-12 space-y-12">

        {/* ── HEADER SECTION ELITE ── */}
        <ViewHeader
          title={
            <div className="flex items-center gap-10">
              <div className="relative group">
                <div className="absolute inset-0 bg-rose-600/20 blur-3xl rounded-full scale-150 animate-pulse group-hover:bg-rose-600/30 transition-all duration-[5s]" />
                <div className="relative p-7 bg-black border-2 border-rose-500/40 rounded-[2.5rem] shadow-4xl transform -rotate-2 hover:rotate-0 transition-all">
                  <Globe size={42} className="text-rose-500 shadow-[0_0_20px_#e11d48] animate-spin-slow" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <span className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-4 py-1 text-[10px] font-black tracking-[0.4em] uppercase italic rounded-lg">
                    GEOPOLITICAL_SIGINT // ACTIVE_ARRAY
                  </span>
                  <div className="h-px w-12 bg-rose-500/20" />
                  <span className="text-[10px] font-black text-rose-800 font-mono tracking-widest uppercase italic shadow-sm">v56.5-ELITE</span>
                </div>
                <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-3deg] leading-none">
                  ГЕОПОЛІТИЧНИЙ <span className="text-rose-600 underline decoration-rose-600/30 decoration-[14px] underline-offset-[12px] italic uppercase tracking-tighter">СЕЙСМОГРАФ</span>
                </h1>
              </div>
            </div>
          }
          breadcrumbs={['INTEL', 'GEOPOLITICAL', 'RADAR_ARRAY']}
          badges={[
            { label: 'CLASSIFIED_T1', color: 'rose', icon: <Lock size={10} /> },
            { label: 'LIVE_SAT_LINK', color: 'primary', icon: <Satellite size={10} /> },
          ]}
          stats={[
            { label: 'ALPHA_ALERTS', value: alertCount, icon: <Radio />, color: 'danger', animate: true },
            { label: 'SCAN_INTENS', value: '74.2%', icon: <Radar />, color: 'warning' },
            { label: 'PROTOCOL', value: 'ALPHA', icon: <Zap />, color: 'primary' },
            { label: 'SAT_LINK', value: 'SYNC', icon: <Satellite />, color: 'success' },
          ]}
        />

        {/* ── LIVE SEISMOGRAPH VISUALIZATION ELITE ── */}
        <section className="rounded-[4rem] bg-black border-2 border-rose-900/20 p-12 shadow-4xl relative overflow-hidden group/sei">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(225,29,72,0.03),transparent_60%)] pointer-events-none" />
           <div className="flex items-center justify-between mb-12 relative z-10">
              <div className="flex items-center gap-10">
                 <div className="flex h-16 w-16 items-center justify-center rounded-[2rem] bg-rose-600/10 border-2 border-rose-600/20 shadow-2xl">
                    <Activity size={32} className="text-rose-600 animate-pulse" />
                 </div>
                 <div className="space-y-2">
                    <h2 className="text-xl font-black text-white uppercase italic tracking-[0.3em] leading-none font-serif">ГЛОБАЛЬНИЙ ІНДЕКС ТЕКТОНІЧНОГО РИЗИКУ</h2>
                    <p className="text-[10px] font-mono text-slate-700 font-black uppercase tracking-[0.4em] leading-none italic border-l-2 border-rose-900/40 pl-4">OSCILLATION_ANALYSIS: {selectedRegion.name.toUpperCase()} // TI-LEVEL</p>
                 </div>
              </div>
              <div className="text-right">
                 <div className="text-6xl font-black text-rose-500 italic tabular-nums leading-none tracking-tighter" style={{ textShadow: '0 0 30px rgba(225,29,72,0.5)' }}>
                   {selectedRegion.riskLevel}.{Math.floor(Math.random()*10)}
                 </div>
                 <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.5em] mt-3 italic">AGGREGATE_VALUATION</p>
              </div>
           </div>

           <div className="h-40 flex items-center gap-1.5 overflow-hidden relative z-10 px-4 bg-black/40 rounded-[2.5rem] border-2 border-white/5 py-4 shadow-inner">
              {seismographData.map((v, i) => (
                <div
                  key={i}
                  className="w-2.5 shrink-0 rounded-full transition-all duration-300"
                  style={{
                    height: `${Math.max(12, v * 0.85)}%`,
                    backgroundColor: v > 90 ? '#E11D48' : v > 75 ? '#f97316' : '#27080d',
                    opacity: 0.2 + (i / 100) * 0.8,
                    boxShadow: v > 85 ? `0 0 20px rgba(225,29,72,${(i / 100) * 0.8})` : 'none',
                  }}
                />
              ))}
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-rose-600/60 shadow-[0_0_40px_#e11d48]" />
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mt-12 pt-12 border-t-2 border-white/[0.04] relative z-10">
              {[
                { label: 'МАКС_НАПРУЖЕНІСТЬ', value: '98/100', color: 'text-rose-500', icon: Flame },
                { label: 'АКТИВНІ_КОНФЛІКТИ', value: '8_ЛОКАЦІЙ', color: 'text-orange-500', icon: Target },
                { label: 'САНКЦІЙНІ_ТРИГЕРИ', value: '1,582', color: 'text-rose-600', icon: Lock },
                { label: 'ДИСТРУКЦІЯ_ГЛОБАЛ', value: '34%_VOL', color: 'text-yellow-600', icon: Network },
              ].map((m, i) => (
                <div key={i} className="flex flex-col gap-4 italic group/metric">
                   <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.5em] leading-none mb-1 group-hover/metric:text-rose-900 transition-colors uppercase">{m.label}</p>
                   <div className="flex items-center gap-5">
                      <div className="p-3 bg-black border border-white/5 rounded-xl text-slate-700 group-hover/metric:text-white transition-all">
                        <m.icon size={20} className={cn("", m.color)} />
                      </div>
                      <p className={cn("text-3xl font-black italic font-mono tracking-tighter leading-none shadow-sm", m.color)}>{m.value}</p>
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* ── CORE INTELLIGENCE GRID ELITE ── */}
        <div className="grid grid-cols-12 gap-12">

          {/* LEFT: HOTSPOTS SELECTOR ELITE (3/12) */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
             <div className="flex items-center justify-between mb-4 px-4 py-2 border-l-4 border-rose-600/30">
                <h3 className="text-[13px] font-black text-slate-700 uppercase tracking-[0.5em] italic flex items-center gap-4 font-serif">
                   <Crosshair size={18} className="text-rose-600 animate-pulse" /> ГАРЯЧІ ТОЧКИ
                </h3>
             </div>
             <div className="space-y-4 max-h-[1000px] overflow-y-auto custom-scrollbar pr-2">
                {WORLD_REGIONS.map(region => (
                  <motion.button
                    key={region.id}
                    whileHover={{ x: 10 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedRegion(region)}
                    className={cn(
                      "w-full text-left p-8 rounded-[3rem] border-2 transition-all relative overflow-hidden group/item shadow-xl",
                      selectedRegion.id === region.id
                        ? "bg-rose-600/[0.04] border-rose-600/40 shadow-4xl scale-[1.02]"
                        : "bg-black border-white/[0.04] hover:border-rose-500/20 hover:bg-white/[0.01]"
                    )}
                  >
                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <div className="text-4xl mb-6 group-hover/item:scale-125 transition-transform duration-700 filter drop-shadow-2xl">{region.flag}</div>
                        <h4 className="text-xl font-black text-white uppercase italic tracking-tighter font-serif group-hover:text-rose-500 transition-colors">{region.name}</h4>
                        <p className="text-[10px] font-black text-slate-700 mt-2 uppercase tracking-wide leading-none italic">{region.sub}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-black font-mono italic tracking-tighter leading-none mb-2" style={{ color: getRiskColor(region.riskLevel) }}>
                          {region.riskLevel}%
                        </p>
                        <p className="text-[9px] font-black text-slate-800 uppercase tracking-[0.3em] leading-none font-serif">SEV_LVL</p>
                      </div>
                    </div>
                    
                    <div className="mt-8 flex items-center justify-between relative z-10">
                       <span className="text-[10px] font-black uppercase tracking-[0.3em] italic px-4 py-1 rounded-lg bg-black border border-white/5" style={{ color: getRiskColor(region.riskLevel) }}>{region.category}</span>
                       <div className="flex items-center gap-3 px-4 py-1.5 rounded-xl bg-black border-2 border-white/5 text-[10px] font-mono font-black text-slate-700 italic">
                          <Activity size={10} className="text-rose-600" /> {region.events}_EV/W
                       </div>
                    </div>

                    <div className="absolute bottom-0 left-0 w-full h-2 bg-slate-950 overflow-hidden shadow-inner">
                       <motion.div 
                         initial={{ width: 0 }} 
                         animate={{ width: `${region.riskLevel}%` }}
                         className="h-full shadow-[0_-5px_20px]" 
                         style={{ backgroundColor: getRiskColor(region.riskLevel), boxShadow: `0 0 15px ${getRiskColor(region.riskLevel)}` }}
                       />
                    </div>
                  </motion.button>
                ))}
             </div>
          </div>

          {/* CENTER: DETAILED INTELLIGENCE HUD ELITE (6/12) */}
          <div className="col-span-12 lg:col-span-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedRegion.id}
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
                className="space-y-10"
              >
                 {/* REGION OVERVIEW CARD ELITE */}
                 <div className="rounded-[4rem] bg-black border-2 border-white/[0.04] p-12 relative overflow-hidden shadow-4xl group/hub">
                    <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none group-hover/hub:scale-125 transition-transform duration-[15s] rotate-12">
                       <Globe size={300} style={{ color: selectedRegion.color }} />
                    </div>
                    <div className="relative z-10">
                       <div className="flex items-center gap-10 mb-12">
                          <div className="text-7xl group-hover/hub:rotate-6 transition-transform filter drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">{selectedRegion.flag}</div>
                          <div className="space-y-4">
                             <div className="flex items-center gap-4">
                                <span className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-4 py-1 text-[10px] font-black tracking-[0.4em] uppercase italic rounded-lg">
                                    TARGET_REGION_INTEL
                                </span>
                                <div className="h-px w-10 bg-rose-500/20" />
                                <span className="text-[10px] font-black text-slate-800 font-mono tracking-widest uppercase italic">X_GEOSPATIAL_CORE</span>
                             </div>
                             <h2 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-none font-serif">{selectedRegion.name}</h2>
                          </div>
                       </div>

                       <div className="grid grid-cols-3 gap-8">
                          {[
                            { label: 'ПОСТАЧАННЯ_LOG', value: selectedRegion.supplyRisk, icon: Network },
                            { label: 'ЕНЕРГЕТИКА_POW', value: selectedRegion.energyRisk, icon: Flame },
                            { label: 'ФІНАНСИ_CAP',    value: selectedRegion.finRisk, icon: DollarSign },
                          ].map((r, i) => (
                            <div key={i} className="p-8 rounded-[2.5rem] bg-black border-2 border-white/[0.04] space-y-6 shadow-4xl hover:border-yellow-500/20 transition-all group/stat">
                               <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] italic group-hover/stat:text-yellow-600 transition-colors">{r.label}</span>
                                  <r.icon size={20} className="text-slate-900 group-hover/stat:text-white transition-colors" />
                               </div>
                               <div className="flex items-baseline gap-4">
                                  <p className="text-5xl font-black font-mono tracking-tighter italic leading-none group-hover/stat:scale-110 transition-transform origin-left" style={{ color: getRiskColor(r.value) }}>{r.value}%</p>
                                  <div className={cn("text-[10px] font-black uppercase tracking-widest italic", r.value > 85 ? "text-rose-600 animate-pulse" : "text-slate-800")}>
                                     {r.value > 85 ? 'EXTREME' : 'WATCH'}
                                  </div>
                               </div>
                               <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                  <div className="h-full transition-all duration-2000 ease-out shadow-[0_0_10px_currentColor]" style={{ width: `${r.value}%`, backgroundColor: getRiskColor(r.value) }} />
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 {/* ACTIONABLE FACTORS LIST ELITE */}
                 <div className="rounded-[4rem] bg-black/60 border-2 border-white/[0.04] p-12 shadow-4xl relative overflow-hidden group/fact">
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-rose-600/20 to-transparent" />
                    <div className="flex items-center justify-between mb-10 pb-8 border-b border-white/[0.04]">
                       <h3 className="text-xl font-black text-white uppercase italic tracking-[0.4em] flex items-center gap-6 leading-none font-serif">
                          <AlertTriangle size={28} className="text-orange-500 animate-pulse" /> КРИТИЧНІ ФАКТОРИ ТА ПОДІЇ
                       </h3>
                       <div className="flex items-center gap-4">
                          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest italic leading-none font-mono">TI_LVL: ALPHA_ZERO</span>
                       </div>
                    </div>
                    <div className="space-y-6">
                       {selectedRegion.items.map((item, i) => (
                         <motion.div
                           key={i}
                           initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                           className="group flex items-center gap-8 p-8 rounded-[2.5rem] border-2 border-white/[0.03] bg-black hover:border-rose-600/40 hover:bg-rose-600/[0.04] transition-all shadow-xl relative overflow-hidden"
                         >
                           <div className="flex h-16 w-16 items-center justify-center rounded-[2rem] bg-black border-2 border-white/5 shrink-0 group-hover:scale-110 group-hover:bg-rose-600 group-hover:border-rose-500 transition-all shadow-2xl">
                              <AlertTriangle size={28} className={cn("group-hover:text-white transition-colors", i === 0 ? "text-rose-600" : "text-amber-600")} />
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-xl font-black text-slate-300 group-hover:text-white transition-colors italic tracking-tighter leading-snug font-serif uppercase">{item}</p>
                              <div className="flex items-center gap-6 mt-4">
                                 <span className="text-[11px] font-black text-slate-800 uppercase tracking-[0.4em] italic group-hover:text-rose-500 transition-colors">IMPACT_COGNITION: HIGH_VECTOR</span>
                                 <div className="h-px w-8 bg-slate-900" />
                                 <span className="text-[9px] font-black text-slate-900 tracking-widest uppercase italic">PROBABILITY: 94.2%</span>
                              </div>
                           </div>
                           <div className="flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                <button className="p-4 bg-rose-600 rounded-2xl text-white shadow-xl hover:brightness-110"><Target size={20} /></button>
                                <ArrowUpRight size={24} className="text-rose-600" />
                           </div>
                         </motion.div>
                       ))}
                    </div>
                 </div>

                 {/* TREND ANALYSIS CHART ELITE */}
                 <div className="rounded-[4rem] bg-black border-2 border-white/[0.04] p-12 shadow-4xl relative overflow-hidden">
                    <div className="absolute inset-s-0 top-0 h-1 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent" />
                    <h3 className="text-xl font-black text-white uppercase italic tracking-[0.4em] flex items-center gap-6 mb-12 leading-none font-serif">
                       <Activity size={28} className="text-yellow-600" /> ДИНАМІКА ГЕОПОЛІТИЧНИХ ШОКІВ
                    </h3>
                    <div className="h-[280px] bg-black/40 rounded-[3rem] p-6 border-2 border-white/5 shadow-inner">
                       <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={TIMELINE_DATA} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                           <defs>
                             <linearGradient id="gradShockElite" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%"  stopColor="#E11D48" stopOpacity={0.3} />
                               <stop offset="95%" stopColor="#E11D48" stopOpacity={0} />
                             </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="6 6" stroke="rgba(212,175,55,0.05)" vertical={false} />
                           <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 11, fontWeight: '900', fontStyle: 'italic' }} tickLine={false} axisLine={false} />
                           <YAxis hide />
                           <Tooltip
                             contentStyle={{ background: '#000', border: '2px solid rgba(225,29,72,0.4)', borderRadius: '24px', padding: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                             itemStyle={{ color: '#E11D48', fontWeight: '900', fontSize: '12px', fontStyle: 'italic' }}
                           />
                           <Area type="monotone" dataKey="risk" stroke="#E11D48" strokeWidth={5} fill="url(#gradShockElite)" animationDuration={2000} strokeLinecap="round" />
                         </AreaChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* RIGHT: LIVE FEED ELITE (3/12) */}
          <div className="col-span-12 lg:col-span-3 space-y-10">
            
             {/* RADAR PROFILE HUB ELITE */}
             <div className="rounded-[3.5rem] bg-black/60 border-2 border-white/[0.04] p-10 shadow-4xl space-y-10 relative overflow-hidden group/radar">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/[0.02] to-transparent pointer-events-none" />
                <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-[0.6em] italic leading-none font-serif flex items-center gap-4">
                    <Radar size={18} className="text-yellow-600 animate-pulse" /> ГЛОБАЛЬНИЙ ПРОФІЛЬ РИЗИКУ
                </h3>
                <div className="h-[280px] flex items-center justify-center p-4 bg-black rounded-[4rem] border-2 border-white/5 shadow-inner">
                   <ResponsiveContainer width="100%" height="100%">
                     <RadarChart data={RADAR_DATA} cx="50%" cy="50%" outerRadius="80%">
                       <PolarGrid stroke="rgba(212,175,55,0.1)" />
                       <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: '900', fontStyle: 'italic' }} />
                       <RadarRecharts name="РИЗИК" dataKey="value" stroke="#E11D48" fill="#E11D48" fillOpacity={0.15} strokeWidth={4} dot={{ fill: '#E11D48', r: 4 }} />
                     </RadarChart>
                   </ResponsiveContainer>
                </div>
                <div className="border-t-2 border-white/[0.04] pt-8 grid grid-cols-2 gap-8">
                   <div className="text-center group/met">
                      <p className="text-[9px] font-black text-slate-800 uppercase tracking-widest mb-2 italic">AVG_SCAN_INTENS</p>
                      <p className="text-4xl font-black text-white italic tracking-tighter shadow-sm">74.2%</p>
                   </div>
                   <div className="text-center group/met">
                      <p className="text-[9px] font-black text-slate-800 uppercase tracking-widest mb-2 italic">PROTOCOL_ALPHA</p>
                      <p className="text-4xl font-black text-rose-600 italic tracking-tighter shadow-sm animate-pulse">SET-1</p>
                   </div>
                </div>
             </div>

             {/* LIVE INTEL FEED ELITE */}
             <div className="rounded-[3.5rem] bg-black border-2 border-white/[0.04] overflow-hidden shadow-4xl group/feed">
                <div className="p-10 border-b-2 border-white/[0.04] flex items-center justify-between bg-white/[0.01]">
                   <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-[0.5em] italic flex items-center gap-5 leading-none font-serif">
                      <Radio size={22} className="text-rose-600 animate-pulse" /> LIVE_INTEL_DECODE
                   </h3>
                   <span className="px-4 py-1.5 bg-rose-600/10 border border-rose-600/20 text-rose-600 text-[10px] font-black italic rounded-lg shadow-lg shadow-rose-900/40">14_NODES</span>
                </div>
                <div className="divide-y-2 divide-white/[0.02] max-h-[500px] overflow-y-auto custom-scrollbar">
                   {LIVE_EVENTS.map((ev, i) => (
                     <motion.div
                       key={i}
                       initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                       className="p-10 hover:bg-rose-600/[0.04] transition-all cursor-pointer group/ev relative overflow-hidden"
                     >
                       <div className="absolute top-0 right-0 w-2 h-full bg-rose-600/5 group-hover/ev:bg-rose-600/30 transition-all" />
                       <div className="flex items-center justify-between mb-5">
                         <div className={cn(
                           "px-4 py-1.5 rounded-xl text-[10px] font-black italic tracking-widest uppercase border-2 transition-all",
                           ev.level === 'КРИТИЧНИЙ' ? "bg-rose-600 text-white border-rose-500 shadow-xl scale-110" :
                           "bg-black border-white/10 text-slate-800 group-hover/ev:border-rose-900/40 group-hover/ev:text-rose-500"
                         )}>
                            {ev.level}
                         </div>
                         <span className="text-[11px] font-mono text-slate-800 font-black italic tracking-tighter">{ev.time} // T_SYNC</span>
                       </div>
                       <p className="text-[16px] font-black text-slate-400 leading-snug group-hover/ev:text-white transition-colors italic tracking-tighter uppercase font-serif">"{ev.event}"</p>
                       <div className="flex items-center gap-4 mt-6 text-[10px] text-slate-800 font-black uppercase tracking-[0.4em] italic border-l-2 border-slate-900 pl-4">
                          <ev.icon size={14} className="opacity-40 text-rose-600" /> {ev.region}
                       </div>
                     </motion.div>
                   ))}
                </div>
                <button className="w-full py-8 text-[11px] font-black text-slate-700 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-5 uppercase tracking-[0.4em] italic border-t-2 border-white/[0.04] group/all">
                   FULL_INTERCEPT_LEDGER <ChevronRight size={18} className="group-hover/all:translate-x-2 transition-transform" />
                </button>
             </div>

             {/* SOVEREIGN VERDICT ELITE */}
             <div className="p-10 rounded-[3.5rem] bg-gradient-to-br from-yellow-600/10 to-transparent border-2 border-yellow-500/10 shadow-4xl relative overflow-hidden group/verdict">
                  <div className="absolute -right-8 -bottom-8 p-12 opacity-5 rotate-12 group-hover/verdict:rotate-0 transition-all duration-[10s]">
                      <Cpu size={180} className="text-yellow-600" />
                  </div>
                  <h4 className="text-[10px] font-black text-yellow-700 uppercase tracking-[0.6em] mb-4 italic font-serif underline decoration-yellow-600/20 underline-offset-8">PREDATOR_SENTINEL_ADVISORY</h4>
                  <p className="text-[13px] font-black text-slate-300 italic leading-relaxed uppercase tracking-tight relative z-10 border-l-4 border-yellow-500/30 pl-8 group-hover:text-white transition-colors">
                     Зміщення центрів ризику в напрямку Червоного моря вказує на неминуче подорожчання страхування морських перевезень (+22%). Рекомендується активація альтернативних маршрутів сушею.
                  </p>
             </div>

          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .shadow-4xl { box-shadow: 0 60px 120px -30px rgba(0,0,0,0.9), 0 0 60px rgba(225,29,72,0.03); }
        .animate-spin-slow { animation: spin 20s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .custom-scrollbar::-webkit-scrollbar{width:6px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(212,175,55,.1);border-radius:20px;border:2px solid black}.custom-scrollbar::-webkit-scrollbar-thumb:hover{background:rgba(212,175,55,.2)}
      `}} />
    </div>
  );
};

export default GeopoliticalRadarView;
