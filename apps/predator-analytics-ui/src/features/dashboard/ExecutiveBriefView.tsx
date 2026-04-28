/**
 * 🦅 PREDATOR v61.0-ELITE — STRATEGIC MORNING BRIEFING (AGENTIC CORE)
 *  озділ I.3 — ШІ-керований звіт для вищого керівництва.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  ShieldAlert, 
  Network, 
  Terminal, 
  Search, 
  Crosshair, 
  Cpu, 
  CheckCircle2,
  AlertOctagon,
  Clock,
  Sparkles,
  Zap,
  Fingerprint,
  ArrowUpRight,
  TrendingUp,
  Brain,
  ShieldCheck,
  Globe,
  Target,
  ArrowRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import CyberGlobe from '@/components/3d/CyberGlobe';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { dashboardApi, type DashboardOverview } from '@/services/api/dashboard';

// --- STYLES ---
const cardGlass = "rounded-3xl border border-white/[0.05] bg-[#060c18]/60 backdrop-blur-3xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)]";

// --- MOCK DATA FOR CHARTS ---
const THREAT_ACTIVITY_DATA = [
  { time: '00:00', events: 120, baseline: 50 },
  { time: '04:00', events: 340, baseline: 50 },
  { time: '08:00', events: 210, baseline: 55 },
  { time: '12:00', events: 890, baseline: 60 },
  { time: '16:00', events: 450, baseline: 60 },
  { time: '20:00', events: 280, baseline: 50 },
  { time: '24:00', events: 190, baseline: 45 },
];

// --- COMPONENT ---
export default function ExecutiveBriefView() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [events, setEvents] = useState([
    { id: 1, time: '10:45:02', msg: 'ІНҐЕСТІЯ: Оновлення реєстру ДПС...', type: 'info' },
    { id: 2, time: '10:45:15', msg: 'ЗБІГ KYC: Виявлено PEP-фігуранта (UEID-1102)', type: 'warning' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await dashboardApi.getOverview();
        setOverview(data);
      } catch (e) {
        console.warn("API offline in Briefing, using fallback");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Live Stream Simulation
  useEffect(() => {
    const messages = [
      'ГРАФ: Виявлено нову афіліацію першого рівня в офшорній зоні',
      'OSINT: Виявлено 14 нових згадок суб\'єкта в закритих реєстрах',
      'ТРИВОГА: Спроба анонімізації транзакції через вузол "ОАЕ-Транзит"',
      'СИНХРОНІЗАЦІЯ: Оновлено санкційні списки РНБО та OFAC/EU',
      'GLM-5.1 АНАЛІЗ: Прогнозризику для ТОВ "АГ О" підвищено до 98.9% (АГЕНТСЬКА_СИНХРОНІЗАЦІЯ)',
      'МИТНИЦЯ: Перехоплено декларацію з аномальною ціною — Тунель ZROK активний',
      'ФІНАНСИ: Виявлено ознаки кругової торгівлі у секторі палива'
    ];
    let counter = 3;
    
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      
      setEvents(prev => {
        const newEvents = [{ id: counter++, time: timeStr, msg: randomMsg, type: Math.random() > 0.7 ? 'warning' : 'info' }, ...prev];
        return newEvents.slice(0, 10);
      });
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const targets = useMemo(() => {
    return overview?.top_risk_companies?.slice(0, 5) || [
      { edrpou: '4592', name: 'ТОВ "АГ О-ІМПЕКС"', maxRisk: 94, totalValue: 45000000 },
      { edrpou: '1102', name: 'БФ "ВІД ОДЖЕННЯ-ПЛЮС"', maxRisk: 88, totalValue: 12000000 },
      { edrpou: '9938', name: 'П АТ "СХІД-ЛОГІСТИК"', maxRisk: 72, totalValue: 8000000 },
    ];
  }, [overview]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* ── HEADER CONTOUR ── */}
      <header className={cn(cardGlass, "p-8 relative overflow-hidden group")}>
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none transform rotate-12">
           <Activity size={240} className="text-red-500" />
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
               <div className="badge-v2 badge-v2-amber px-3 py-1 text-[10px] font-black tracking-[0.2em] uppercase">
                  ЦІЛКОМ ТАЄМНО // КОНТУ -S
               </div>
               <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic skew-x-[-2deg]">
              СУВЕ ЕННЕ <span className="text-red-600">СТРАТЕГІЧНЕ ЗВЕДЕННЯ</span>
            </h1>
            <p className="text-slate-500 font-mono text-[11px] tracking-[0.3em] uppercase">
             ПРЕДИКТИВНИЙ АНАЛІЗ ЦЕНТ АЛЬНОГО ЯД А | v61.0-ELITE (АГЕНТСЬКИЙ_ПУЛ)
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="text-right">
              <div className="text-4xl font-black text-white italic tracking-tighter tabular-nums">
                {overview?.summary ? (overview.summary.total_declarations / 1000).toFixed(1) + 'k' : '14.2k'}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 mt-1 italic">
                ОБ'ЄКТІВ ОБРОБЛЕНО
              </div>
            </div>
            <div className="w-px h-12 bg-white/10 hidden md:block" />
            <div className="text-right">
              <div className="text-4xl font-black text-emerald-500 italic tracking-tighter tabular-nums">
                {overview?.summary ? '$' + (overview.summary.total_value_usd / 1000000000).toFixed(1) + 'B' : '$12.4B'}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 mt-1 italic">
                ОПЕРАЦІЙНИЙ ОБСЯГ
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── GRID CONTENT ── */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* LEFT: Charts & Targets (Columns 1-8) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          
          {/* Activity Matrix */}
          <section className={cn(cardGlass, "p-6 sm:p-8")}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500">
                  <Network size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase italic tracking-tight">АКТИВНІСТЬ ЗАГРОЗ МЕ ЕЖІ</h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Останні 24 години управління</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/5 border border-red-500/10">
                 <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-red-400">ПОТІК LIVE</span>
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={THREAT_ACTIVITY_DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4b5563" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4b5563" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="time" stroke="#ffffff10" tick={{fill: '#475569', fontSize: 10, fontWeight: 'bold'}} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff10" tick={{fill: '#475569', fontSize: 10, fontWeight: 'bold'}} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#050a14', borderColor: '#dc262640', color: '#f8fafc', borderRadius: '16px', border: '1px solid #dc262630' }}
                    itemStyle={{ color: '#ef4444', fontWeight: 'bold' }}
                    cursor={{ stroke: '#dc262640', strokeWidth: 2 }}
                  />
                  <Area type="monotone" dataKey="baseline" stroke="#374151" fillOpacity={1} fill="url(#colorBaseline)" strokeWidth={1} strokeDasharray="5 5" />
                  <Area type="monotone" dataKey="events" stroke="#dc2626" fillOpacity={1} fill="url(#colorEvents)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Priority Targets Table */}
          <section className={cn(cardGlass, "overflow-hidden")}>
            <div className="p-6 border-b border-white/5 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                <Target size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-white uppercase italic tracking-tight">ПРІОРИТЕТНІ ОБ'ЄКТИ</h2>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Критичний рівеньризику — аналіз AI</p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/[0.02] text-slate-500 uppercase tracking-[0.2em] text-[10px] font-black italic">
                  <tr>
                    <th className="px-6 py-4">ID_СЕ ТИФІКАТ</th>
                    <th className="px-6 py-4">СУБ'ЄКТ_ РОЗВІДКИ</th>
                    <th className="px-6 py-4">ОБСЯГ_USD</th>
                    <th className="px-6 py-4 text-center">ІНДЕКС_РИЗИКУ</th>
                    <th className="px-6 py-4 text-right">ДІЯ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {targets.map((target: any) => (
                    <tr key={target.edrpou} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-5 whitespace-nowrap font-mono text-[11px] text-slate-600">#{target.edrpou}</td>
                      <td className="px-6 py-5 whitespace-nowrap font-black text-slate-200 italic">{target.name}</td>
                      <td className="px-6 py-5 whitespace-nowrap font-mono text-emerald-500/80 font-bold italic tabular-nums">
                        ${(target.totalValue / 1000000).toFixed(1)}M
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black italic">
                          {target.maxRisk}%
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-right">
                        <button className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-red-600 text-slate-400 hover:text-white transition-all group/btn">
                          <ArrowUpRight size={16} className="group-hover/btn:rotate-45 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* RIGHT: Globe & Terminal (Columns 9-12) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          
          {/* Globe Scan */}
          <section className={cn(cardGlass, "h-[320px] relative overflow-hidden group")}>
            <div className="absolute inset-0 z-0 opacity-80 group-hover:opacity-100 transition-opacity">
              <CyberGlobe />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#050a14] via-transparent to-red-600/[0.03] pointer-events-none" />
            <div className="absolute top-5 left-5 z-10 space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="text-red-500 animate-spin-slow" size={16} />
                <span className="text-[10px] font-black text-white tracking-[0.3em] uppercase italic">ГЛОБАЛЬНИЙ СКАНИНГ</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest lowercase">О БІТАЛЬНА_ФАЗА: АКТИВНО</span>
              </div>
            </div>
            
            <div className="absolute bottom-5 right-5 z-10 flex flex-col items-end">
              <div className="text-2xl font-black text-white tracking-widest italic tabular-nums">
                194 <span className="text-[10px] text-slate-500">КРАЇНИ</span>
              </div>
            </div>
          </section>

          {/* Neural Terminal Stream */}
          <section className={cn(cardGlass, "p-6 flex flex-col flex-1")}>
            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                  <Terminal size={18} />
                </div>
                <h2 className="text-lg font-black text-white italic uppercase tracking-tight">ЯДРО ТЕРМІНАЛУ</h2>
              </div>
              <div className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
            </div>
            
            <div className="flex-1 space-y-4 font-mono text-[11px] max-h-[480px] overflow-hidden">
              <AnimatePresence initial={false}>
                {events.map((ev, i) => (
                  <motion.div 
                    key={ev.id} 
                    initial={{ x: 30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-2xl border-l-[3px] bg-slate-950/40 relative group/ev overflow-hidden",
                      ev.type === 'warning' ? "border-amber-600/80 bg-amber-500/[0.02]" : "border-red-600/80 bg-red-500/[0.02]"
                    )}
                    style={{ opacity: `${Math.max(20, 100 - (i * 10))}%` }}
                  >
                    <span className="text-slate-600 shrink-0 font-black flex items-center gap-2 tabular-nums">
                      <Clock className="w-3.5 h-3.5" /> {ev.time}
                    </span>
                    <span className={cn(
                      "font-bold tracking-tight italic",
                      ev.type === 'warning' ? "text-amber-200/90" : "text-red-200/90"
                    )}>
                      {ev.msg}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
               <div className="text-[9px] text-slate-600 font-bold tracking-widest uppercase italic">
                  ОПТИМІЗАЦІЯ_ВУЗЛА: ПОВНА
               </div>
               <div className="flex gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                 <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                 <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
               </div>
            </div>
          </section>

        </div>

      </div>

      {/* ── FOOTER ACTIONS ── */}
      <footer className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button className={cn(cardGlass, "p-5 flex items-center justify-between group hover:border-emerald-500/30 transition-all")}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Brain size={20} />
            </div>
            <div className="text-left">
              <div className="text-sm font-black text-white uppercase italic">ЗАПИТАТИ ШІ</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">ГЛИБИННИЙ АНАЛІЗ ЦЕЙ СЕСІЇ</div>
            </div>
          </div>
          <Sparkles size={18} className="text-emerald-500/40 group-hover:text-emerald-500 transition-colors" />
        </button>

        <button className={cn(cardGlass, "p-5 flex items-center justify-between group hover:border-yellow-500/30 transition-all")}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
              <ShieldCheck size={20} />
            </div>
            <div className="text-left">
              <div className="text-sm font-black text-white uppercase italic">ВЕ ИФІКУВАТИ ДАНІ</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">КВАНТОВЕ ПІДТВЕ ДЖЕННЯ РЕЄСТРІВ</div>
            </div>
          </div>
          <Zap size={18} className="text-yellow-400/40 group-hover:text-yellow-400 transition-colors" />
        </button>

        <button className={cn(cardGlass, "p-5 flex items-center justify-between group hover:border-red-500/30 transition-all")}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20">
              <AlertOctagon size={20} />
            </div>
            <div className="text-left">
              <div className="text-sm font-black text-white uppercase italic">ЗВІТ ДЛЯ РНБО</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">ЕКСПОРТ П АВОВОГО ДОСЬЄ</div>
            </div>
          </div>
          <ArrowRight size={18} className="text-red-500/40 group-hover:text-red-500 transition-all group-hover:translate-x-1" />
        </button>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .animate-spin-slow {
          animation: spin 12s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </motion.div>
  );
}
