/**
 * 📡 ГЕОПОЛІТИЧНИЙ СЕЙСМОГРАФ | v56.4
 * PREDATOR Analytics — Geopolitical Risk Intelligence
 *
 * Real-time геополітичні тренди, санкції, конфлікти,
 * ризики для ланцюгів постачання по країнах.
 * Sovereign Power Design · Classified · Tier-1
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, AlertTriangle, TrendingUp, TrendingDown,
  Shield, Zap, Activity, Target, RefreshCw, Download,
  ChevronRight, Radio, Flame, Wind, CloudLightning,
  Lock, Eye, BarChart3
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { cn } from '@/utils/cn';

// ─── ДАНІ ────────────────────────────────────────────────────────────

const WORLD_REGIONS = [
  {
    id: 'ua-ru',
    name: 'Схід Європи',
    sub: 'Україна / Росія / Білорусь',
    riskLevel: 98,
    trend: 'up',
    events: 14,
    sanction: 847,
    flag: '🇺🇦🇷🇺',
    color: '#ef4444',
    category: 'ВОЄННИЙ КОНФЛІКТ',
    supplyRisk: 94,
    energyRisk: 89,
    finRisk: 76,
    items: [
      'Нові пакети санкцій ЄС (пакет №15)',
      'Заморожені активи РФ: €300B під управлінням ЄС',
      'Зернова угода: статус невизначений',
    ],
  },
  {
    id: 'cn-tw',
    name: 'Тихоокеанська Дуга',
    sub: 'Китай / Тайвань / КНДР',
    riskLevel: 74,
    trend: 'up',
    events: 8,
    sanction: 213,
    flag: '🇨🇳🇹🇼',
    color: '#f59e0b',
    category: 'ГІПЕРРИЗИК НАПРУЖЕНІСТЬ',
    supplyRisk: 82,
    energyRisk: 55,
    finRisk: 68,
    items: [
      'Тайванська протока: рекордне зближення флотів',
      'Напівпровідникові санкції США проти Huawei',
      'КНДР — нові ракетні випробування',
    ],
  },
  {
    id: 'me',
    name: 'Близький Схід',
    sub: 'Ізраїль / Іран / Саудівська Аравія',
    riskLevel: 81,
    trend: 'stable',
    events: 11,
    sanction: 421,
    flag: '🇮🇱🇮🇷',
    color: '#dc2626',
    category: 'ЗБРОЙНА ЕСКАЛАЦІЯ',
    supplyRisk: 71,
    energyRisk: 92,
    finRisk: 58,
    items: [
      'Хоуті атакують судна в Червоному морі',
      'Нафтовий коридор через Ормузьку протоку під загрозою',
      'Іранські БПЛА — постачання до РФ підтверджено',
    ],
  },
  {
    id: 'af',
    name: 'Африканський Вектор',
    sub: 'Сахель / Нігерія / Судан',
    riskLevel: 56,
    trend: 'up',
    events: 5,
    sanction: 87,
    flag: '🌍',
    color: '#b45309',
    category: 'НЕСТАБІЛЬНІСТЬ',
    supplyRisk: 63,
    energyRisk: 41,
    finRisk: 34,
    items: [
      'Переворот у Буркіна-Фасо: нові обмеження',
      'Мігранти і контрабанда: маршрути через Ліван',
      'Китай розширює присутність в DRC',
    ],
  },
  {
    id: 'eu',
    name: 'Центральна Європа',
    sub: 'ЄС / Польща / Угорщина',
    riskLevel: 31,
    trend: 'down',
    events: 3,
    sanction: 12,
    flag: '🇪🇺',
    color: '#0891b2',
    category: 'ПОМІРНИЙ',
    supplyRisk: 28,
    energyRisk: 42,
    finRisk: 19,
    items: [
      'Угорщина блокує 15-й пакет санкцій',
      'Польща — нарощування витрат на оборону до 5% ВВП',
      'Балтика: підводна інфраструктура під загрозою',
    ],
  },
];

const TIMELINE_DATA = [
  { date: '01.11', events: 3,  sanctions: 12, risk: 42 },
  { date: '15.11', events: 5,  sanctions: 18, risk: 48 },
  { date: '01.12', events: 8,  sanctions: 34, risk: 61 },
  { date: '15.12', events: 11, sanctions: 47, risk: 67 },
  { date: '01.01', events: 6,  sanctions: 52, risk: 58 },
  { date: '15.01', events: 14, sanctions: 71, risk: 75 },
  { date: '01.02', events: 18, sanctions: 89, risk: 83 },
  { date: '15.02', events: 12, sanctions: 94, risk: 79 },
  { date: '01.03', events: 20, sanctions: 112,risk: 88 },
  { date: '15.03', events: 9,  sanctions: 118,risk: 82 },
  { date: '01.04', events: 16, sanctions: 126,risk: 85 },
  { date: '13.04', events: 22, sanctions: 134,risk: 91 },
];

const RADAR_DATA = [
  { subject: 'Енергетика', value: 82, fullMark: 100 },
  { subject: 'Фінанси',   value: 68, fullMark: 100 },
  { subject: 'Торгівля',  value: 74, fullMark: 100 },
  { subject: 'Безпека',   value: 91, fullMark: 100 },
  { subject: 'Продукти',  value: 56, fullMark: 100 },
  { subject: 'Транспорт', value: 78, fullMark: 100 },
];

const LIVE_EVENTS = [
  { time: '04:12', region: 'Близький Схід', event: 'Хоуті атакували контейнеровоз PACIFIC STAR', level: 'КРИТИЧНИЙ', icon: Flame },
  { time: '03:47', region: 'Схід Європи',   event: 'ЄС погодив нові обмеження на рос. банки',   level: 'ВАЖЛИВИЙ',  icon: Shield },
  { time: '02:18', region: 'Тих. Дуга',    event: 'Китай провів навчання біля Тайваню',         level: 'ВАЖЛИВИЙ',  icon: Target },
  { time: '01:55', region: 'Т. Дуга',       event: 'КНДР запустила 2 балістичні ракети',         level: 'КРИТИЧНИЙ', icon: Zap },
  { time: '00:33', region: 'Африка',        event: 'Держпереворот у Малі: влада переходить',     level: 'ПОМІРНИЙ',  icon: CloudLightning },
  { time: '23:41', region: 'Схід Європи',   event: 'РФ заблокувала порт Азов — 14 суден',        level: 'ВАЖЛИВИЙ',  icon: Lock },
];

// ─── КОМПОНЕНТ ────────────────────────────────────────────────────────

const GeopoliticalRadarView: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState(WORLD_REGIONS[0]);
  const [seismographTick, setSeismographTick] = useState(0);
  const [alertCount, setAlertCount] = useState(6);
  const seismRef = useRef<number[]>([]);

  // Сейсмограф — генерація хвилі
  useEffect(() => {
    const id = setInterval(() => {
      setSeismographTick(t => {
        const newVal = 40 + Math.random() * 60 * (selectedRegion.riskLevel / 100);
        seismRef.current = [...seismRef.current.slice(-79), newVal];
        return t + 1;
      });
    }, 100);
    return () => clearInterval(id);
  }, [selectedRegion]);

  // Live alerts
  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() > 0.8) setAlertCount(a => a + 1);
    }, 9000);
    return () => clearInterval(id);
  }, []);

  const getRiskColor = (level: number) =>
    level >= 80 ? '#ef4444' : level >= 60 ? '#f59e0b' : level >= 40 ? '#b45309' : '#0891b2';

  return (
    <div className="min-h-screen text-slate-200 font-sans pb-24 relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(220,38,38,0.04) 0%, transparent 60%)' }} />
      </div>

      <div className="relative z-10 max-w-[1800px] mx-auto p-6 space-y-8">

        {/* ── ЗАГОЛОВОК ── */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-red-700/15 blur-2xl rounded-full" />
              <div className="relative p-5 bg-black border border-red-900/50">
                <Globe size={38} className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]" />
                <motion.span
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Radio size={10} className="text-red-700 animate-pulse" />
                <span className="text-[8px] font-black text-red-700/70 uppercase tracking-[0.5em]">
                  GEOPOLITICAL SIGINT · REAL-TIME · CLASSIFIED · v56.4
                </span>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
                ГЕОПОЛІТИЧНИЙ{' '}
                <span className="text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]">СЕЙСМОГРАФ</span>
              </h1>
              <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.3em] mt-1">
                КОНФЛІКТИ · САНКЦІЇ · ТОРГОВІ РИЗИКИ · SUPPLY CHAIN IMPACT
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-5 py-3 bg-black border border-red-900/40 text-red-400">
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} className="w-2 h-2 bg-red-600 rounded-full" />
              <span className="text-[9px] font-black uppercase tracking-widest">{alertCount} АКТИВНИХ ТРИВОГ</span>
            </div>
            <button className="px-8 py-3 bg-red-800 text-white text-[9px] font-black uppercase tracking-wider hover:bg-red-700 transition-colors border border-red-600/30 flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <Download size={13} />
              ГЕОПОЛІТ. ЗВІТ
            </button>
          </div>
        </div>

        {/* ── СЕЙСМОГРАФ CANVAS ── */}
        <div className="bg-black border border-red-900/25 p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em] flex items-center gap-2">
              <Activity size={12} className="text-red-700" />
              ГЛОБАЛЬНИЙ ІНДЕКС ГЕОРИЗИКУ · РЕАЛЬНИЙ ЧАС
            </h2>
            <span className="text-[8px] font-mono text-red-800">{selectedRegion.name.toUpperCase()}</span>
          </div>
          <div className="h-16 flex items-center gap-0.5 overflow-hidden">
            {seismRef.current.map((v, i) => (
              <div
                key={i}
                className="w-1 shrink-0 rounded-full transition-none"
                style={{
                  height: `${v * 0.64}%`,
                  backgroundColor: v > 80 ? '#ef4444' : v > 60 ? '#f59e0b' : '#7f1d1d',
                  opacity: 0.5 + (i / 80) * 0.5,
                  boxShadow: v > 80 ? `0 0 4px rgba(239,68,68,${(i / 80)})` : 'none',
                }}
              />
            ))}
            <div className="w-0.5 h-full bg-red-600 animate-pulse ml-0.5" style={{ boxShadow: '0 0 6px rgba(239,68,68,0.8)' }} />
          </div>
          {/* Глобальні метрики */}
          <div className="flex items-center gap-8 mt-4 pt-4 border-t border-red-900/15">
            {[
              { l: 'ГЛОБАЛЬНИЙ РИЗИК', v: '82/100', c: '#ef4444' },
              { l: 'АКТИВНИХ ЗОНИ',     v: '7',       c: '#f59e0b' },
              { l: 'САНКЦІЙ 2025',      v: '1,580',   c: '#dc2626' },
              { l: 'SUPPLY ЛАНЦЮГІВ',   v: '34 ПІД РИЗИКОМ', c: '#b45309' },
            ].map((m, i) => (
              <div key={i}>
                <p className="text-[7px] font-black text-slate-700 uppercase tracking-wider">{m.l}</p>
                <p className="text-[13px] font-black font-mono mt-0.5" style={{ color: m.c }}>{m.v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── ОСНОВНИЙ КОНТЕНТ 3 КОЛОНКИ ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Ліворуч — регіони */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em]">ГАРЯЧІ ТОЧКИ</h3>
            {WORLD_REGIONS.map(region => (
              <motion.button
                key={region.id}
                whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedRegion(region)}
                className={cn(
                  "w-full text-left p-5 border transition-all relative overflow-hidden",
                  selectedRegion.id === region.id
                    ? "bg-red-950/15 border-red-800/50"
                    : "bg-black border-slate-800/50 hover:border-slate-700/70"
                )}
              >
                {selectedRegion.id === region.id && (
                  <div className="absolute left-0 inset-y-0 w-0.5 bg-red-600 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                )}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg">{region.flag}</p>
                    <p className="text-[11px] font-black text-white mt-1">{region.name}</p>
                    <p className="text-[8px] text-slate-600 mt-0.5">{region.sub}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[20px] font-black font-mono" style={{ color: getRiskColor(region.riskLevel) }}>
                      {region.riskLevel}
                    </p>
                    <p className="text-[7px] text-slate-600 font-black">РИЗИК</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="h-0.5 bg-slate-900 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${region.riskLevel}%` }}
                      transition={{ duration: 0.6 }}
                      className="h-full"
                      style={{ backgroundColor: getRiskColor(region.riskLevel) }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[7px] font-black uppercase tracking-wide" style={{ color: getRiskColor(region.riskLevel) }}>
                    {region.category}
                  </span>
                  <span className="text-[7px] text-slate-600 font-mono">{region.events} подій/тиж</span>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Центр — деталі регіону */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedRegion.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="lg:col-span-6 space-y-5"
            >
              {/* Заголовок регіону */}
              <div className="bg-black border border-slate-800/50 p-7 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at 80% 50%, ${selectedRegion.color}28 0%, transparent 60%)` }} />
                <div className="relative">
                  <div className="text-4xl mb-3">{selectedRegion.flag}</div>
                  <h2 className="text-2xl font-black text-white uppercase">{selectedRegion.name}</h2>
                  <p className="text-slate-500 text-[11px] mt-1">{selectedRegion.sub}</p>
                  <div className="grid grid-cols-3 gap-4 mt-5">
                    {[
                      { l: 'Постачання',  v: selectedRegion.supplyRisk },
                      { l: 'Енергетика', v: selectedRegion.energyRisk },
                      { l: 'Фінанси',    v: selectedRegion.finRisk },
                    ].map((r, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-[8px] text-slate-600 font-black uppercase">{r.l}</span>
                          <span className="text-[9px] font-black font-mono" style={{ color: getRiskColor(r.v) }}>{r.v}%</span>
                        </div>
                        <div className="h-1 bg-slate-900">
                          <div className="h-full transition-all" style={{ width: `${r.v}%`, backgroundColor: getRiskColor(r.v) }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ключові події */}
              <div className="bg-black border border-slate-800/50 p-6">
                <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.45em] mb-4 flex items-center gap-2">
                  <AlertTriangle size={12} className="text-amber-600" />
                  КЛЮЧОВІ ПОДІЇ ТА ФАКТОРИ
                </h3>
                <div className="space-y-3">
                  {selectedRegion.items.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                      className="flex items-start gap-3 p-4 border border-slate-800/40 hover:border-slate-700/60 transition-all bg-slate-950/40"
                    >
                      <AlertTriangle size={13} className="mt-0.5 shrink-0" style={{ color: getRiskColor(selectedRegion.riskLevel) }} />
                      <span className="text-[11px] font-black text-slate-300">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Таймлайн ризику */}
              <div className="bg-black border border-slate-800/50 p-6">
                <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.45em] mb-5 flex items-center gap-2">
                  <BarChart3 size={12} className="text-red-700" />
                  ДИНАМІКА РИЗИКУ · 6М
                </h3>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={TIMELINE_DATA} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradRisk" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#dc2626" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 8, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ background: '#020008', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 0 }}
                        formatter={(val: number, name: string) => [val, name === 'risk' ? 'Ризик' : name === 'events' ? 'Подій' : 'Санкцій']}
                      />
                      <Area type="monotone" dataKey="risk" stroke="#dc2626" strokeWidth={2} fill="url(#gradRisk)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Права панель */}
          <div className="lg:col-span-3 space-y-5">
            {/* Радіус ризику */}
            <div className="bg-black border border-slate-800/50 p-5">
              <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mb-4">
                ГЛОБАЛЬНИЙ ПРОФІЛЬ РИЗИКУ
              </h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={RADAR_DATA} cx="50%" cy="50%" outerRadius="75%">
                    <PolarGrid stroke="rgba(255,255,255,0.06)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 9, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#374151', fontSize: 7 }} axisLine={false} />
                    <Radar name="Ризик" dataKey="value" stroke="#dc2626" fill="#dc2626" fillOpacity={0.15} strokeWidth={1.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Live feed подій */}
            <div className="bg-black border border-slate-800/50">
              <div className="p-4 border-b border-slate-800/50 flex items-center justify-between">
                <h3 className="text-[8px] font-black text-slate-600 uppercase tracking-[0.45em] flex items-center gap-2">
                  <Radio size={10} className="text-red-700 animate-pulse" />
                  LIVE FEED
                </h3>
                <span className="text-[7px] font-mono text-red-800">{alertCount} НОВИХ</span>
              </div>
              <div className="divide-y divide-slate-900">
                {LIVE_EVENTS.map((ev, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="p-4 hover:bg-slate-950/40 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={cn(
                        "text-[7px] font-black px-2 py-0.5 uppercase tracking-wider",
                        ev.level === 'КРИТИЧНИЙ' ? "bg-red-900/30 text-red-500 border border-red-800/40" :
                        ev.level === 'ВАЖЛИВИЙ'  ? "bg-amber-900/20 text-amber-600 border border-amber-800/30" :
                                                    "bg-slate-900 text-slate-500 border border-slate-800"
                      )}>
                        {ev.level}
                      </span>
                      <span className="text-[7px] font-mono text-slate-700">{ev.time}</span>
                    </div>
                    <p className="text-[9px] font-black text-slate-400 leading-relaxed">{ev.event}</p>
                    <p className="text-[7px] text-slate-700 mt-1 uppercase tracking-wider">{ev.region}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeopoliticalRadarView;
