/**
 * 🦅 PREDATOR v63.0-ELITE — STRATEGIC MORNING BRIEFING (AGENTIC CORE)
 * РОЗДІЛ I.3 — ШІ-керований звіт для вищого керівництва.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import { Button } from '@/components/ui/button';
import { BrandLoaderFallback } from '@/components/polish/BrandLoader';
import { ThermalCard } from '@/components/polish/ThermalCard';
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
  ArrowRight,
  Flame,
  ChevronRight,
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
import { useViewport } from '@/hooks/useViewport';

// Premium Components
import { NeuralPulse } from '@/components/ui/NeuralPulse';
import { CyberGrid } from '@/components/CyberGrid';
import { CyberOrb } from '@/components/CyberOrb';
import { AdvancedBackground } from '@/components/AdvancedBackground';

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

/* ── Анімації ── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function ExecutiveBriefView() {
  const { isCompact } = useViewport();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [events, setEvents] = useState([
    { id: 1, time: '10:45:02', msg: 'ІНГЕСТІЯ: Оновлення реєстру ДПС...', type: 'info' },
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
        setTimeout(() => setLoading(false), 600);
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
      'GLM-5.1 АНАЛІЗ: Прогноз ризику для ТОВ "АГРО" підвищено до 98.9%',
      'МИТНИЦЯ: Перехоплено декларацію з аномальною ціною',
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
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const targets = useMemo(() => {
    return overview?.top_risk_companies?.slice(0, 5) || [
      { edrpou: '4592', name: 'ТОВ "АГРО-ІМПЕКС"', maxRisk: 94, totalValue: 45000000 },
      { edrpou: '1102', name: 'БФ "ВІДРОДЖЕННЯ-ПЛЮС"', maxRisk: 88, totalValue: 12000000 },
      { edrpou: '9938', name: 'ПРАТ "СХІД-ЛОГІСТИК"', maxRisk: 72, totalValue: 8000000 },
    ];
  }, [overview]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
        <BrandLoaderFallback text="СИНТЕЗ СТРАТЕГІЧНОГО ЗВЕДЕННЯ" subtext="АГЕНТИЧНИЙ АНАЛІЗ" />
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      className="relative space-y-8 p-1 overflow-hidden"
    >
      <NeuralPulse color="rgba(244, 63, 94, 0.03)" size={1200} />
      
      {/* ── HEADER CONTOUR — Tactical Briefing Header ── */}
      <motion.header 
        variants={fadeUp}
        className={cn(
          "relative overflow-hidden border border-white/5 bg-black/40 shadow-2xl",
          isCompact ? "rounded-3xl p-5" : "rounded-[3rem] p-10 sm:p-12"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8 relative z-10">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
               <div className="inline-flex items-center gap-3 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 text-[10px] font-black tracking-[0.3em] text-cyan-500 uppercase italic">
                  ЦІЛКОМ ТАЄМНО // КОНТУР-S
               </div>
               <div className="w-2 h-2 rounded-full bg-cyan-600  shadow-[0_0_12px_#f43f5e]" />
            </div>
            <h1 className={cn("font-black text-white tracking-tighter uppercase italic skew-x-[-3deg]", isCompact ? "text-3xl" : "text-5xl")}>
              СУВЕРЕННЕ <span className="text-cyan-600">СТРАТЕГІЧНЕ ЗВЕДЕННЯ</span>
            </h1>
            <p className="text-slate-500 font-black text-[11px] tracking-[0.4em] uppercase italic opacity-60">
              ПРЕДИКТИВНИЙ АНАЛІЗ ЦЕНТРАЛЬНОГО ЯДРА | v63.0-ELITE
            </p>
          </div>
          
          <div className="flex gap-10 items-center">
            <div className="text-right">
              <div className={cn("font-black text-white italic tracking-tighter tabular-nums leading-none", isCompact ? "text-3xl" : "text-5xl")}>
                {overview?.summary ? (overview.summary.total_declarations / 1000).toFixed(1) + 'k' : '14.2k'}
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mt-2 italic">
                ОБ'ЄКТІВ ОБРОБЛЕНО
              </div>
            </div>
            <div className="w-px h-16 bg-white/10 hidden lg:block" />
            <div className="text-right">
              <div className={cn("font-black text-emerald-500 italic tracking-tighter tabular-nums leading-none", isCompact ? "text-3xl" : "text-5xl")}>
                {overview?.summary ? '$' + (overview.summary.total_value_usd / 1000000000).toFixed(1) + 'B' : '$12.4B'}
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mt-2 italic">
                ОПЕРАЦІЙНИЙ ОБСЯГ
              </div>
            </div>
            <CyberOrb size="md" status="active" pulsing />
          </div>
        </div>
      </motion.header>

      {/* ── GRID CONTENT ── */}
      <div className={cn(isCompact ? "grid grid-cols-1 gap-6" : "grid grid-cols-12 gap-10", "")}>
        
        {/* LEFT: Charts & Targets (Columns 1-8) */}
        <div className="col-span-12 lg:col-span-8 space-y-10">
          
          {/* Activity Matrix HUD */}
          <motion.section variants={fadeUp} className={cn("relative overflow-hidden border border-white/5 bg-black/40 shadow-2xl", isCompact ? "rounded-3xl p-5" : "rounded-[3rem] p-10")}>
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-6">
                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 shadow-lg">
                  <Network size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">АКТИВНІСТЬ <span className="text-cyan-500">ЗАГРОЗ</span></h2>
                  <p className="text-[10px] text-slate-600 uppercase tracking-[0.3em] font-black italic mt-1">МОНІТОРИНГ В ПРЯМОМУ ЕФІРІ</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-cyan-500/5 border border-cyan-500/20">
                 <span className="w-2 h-2 rounded-full bg-cyan-600  shadow-[0_0_8px_#f43f5e]" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 italic">ЖИВИЙ_ПОТІК</span>
              </div>
            </div>
            
            <div className="h-[320px] w-full p-4 rounded-[2rem] bg-black/20 border border-white/5">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={THREAT_ACTIVITY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.02)" vertical={false} />
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.05)" tick={{fill: '#475569', fontSize: 10, fontWeight: '900', fontStyle: 'italic'}} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.05)" tick={{fill: '#475569', fontSize: 10, fontWeight: '900'}} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(10, 10, 10, 0.95)', borderColor: 'rgba(244, 63, 94, 0.3)', color: '#fff', borderRadius: '20px', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '12px' }}
                    itemStyle={{ color: '#f43f5e', fontWeight: '900', fontSize: '10px' }}
                    cursor={{ stroke: 'rgba(244, 63, 94, 0.3)', strokeWidth: 2 }}
                  />
                  <Area type="monotone" dataKey="events" stroke="#f43f5e" fillOpacity={1} fill="url(#colorEvents)" strokeWidth={4} animationDuration={2000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.section>

          {/* Priority Targets HUD Table */}
          <motion.section variants={fadeUp} className={cn("relative overflow-hidden border border-white/5 bg-black/40 shadow-2xl", isCompact ? "rounded-3xl" : "rounded-[3rem]")}>
            <div className={cn("border-b border-white/5 flex items-center justify-between", isCompact ? "p-5" : "p-10")}>
              <div className="flex items-center gap-6">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                  <Target size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">ПРІОРИТЕТНІ <span className="text-amber-500">ОБ'ЄКТИ</span></h2>
                  <p className="text-[10px] text-slate-600 uppercase tracking-[0.3em] font-black italic mt-1">КРИТИЧНИЙ РІВЕНЬ РИЗИКУ — АНАЛІЗ AI</p>
                </div>
              </div>
              <Button variant="cyber" className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white italic flex items-center">
                ВЕСЬ ПЕРЕЛІК <ArrowRight size={14} className="ml-2" />
              </Button>
            </div>
            
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-white/[0.02] text-slate-500 uppercase tracking-[0.3em] text-[10px] font-black italic">
                  <tr>
                    <th className="px-10 py-6">ID_СЕРТИФІКАТ</th>
                    <th className="px-10 py-6">СУБ'ЄКТ_РОЗВІДКИ</th>
                    <th className="px-10 py-6">ОБСЯГ_USD</th>
                    <th className="px-10 py-6 text-center">ІНДЕКС_РИЗИКУ</th>
                    <th className="px-10 py-6 text-right">ДІЯ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {targets.map((target: any) => (
                    <tr key={target.edrpou} className="group hover:bg-cyan-500/[0.03] transition-all cursor-pointer">
                      <td className="px-10 py-6 whitespace-nowrap font-mono text-[11px] text-slate-600 group-hover:text-cyan-500 transition-colors">#{target.edrpou}</td>
                      <td className="px-10 py-6 whitespace-nowrap font-black text-slate-200 italic group-hover:text-white transition-colors">{target.name}</td>
                      <td className="px-10 py-6 whitespace-nowrap font-mono text-emerald-500 font-black italic tabular-nums">
                        ${(target.totalValue / 1000000).toFixed(1)}M
                      </td>
                      <td className="px-10 py-6 whitespace-nowrap text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 text-[11px] font-black italic shadow-lg">
                          {target.maxRisk}%
                        </div>
                      </td>
                      <td className="px-10 py-6 whitespace-nowrap text-right">
                        <Button variant="cyber" className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/40 hover:bg-cyan-500/10 text-slate-500 hover:text-cyan-500 transition-all group/btn">
                          <ArrowUpRight size={18} className="group-hover/btn:rotate-45 transition-transform" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>
        </div>

        {/* RIGHT: Globe & Terminal (Columns 9-12) */}
        <div className="col-span-12 lg:col-span-4 space-y-10">
          
          {/* Globe Scan HUD */}
          <motion.section variants={fadeUp} className={cn("relative overflow-hidden border border-white/5 bg-black/40 shadow-2xl group", isCompact ? "h-[200px] rounded-3xl" : "h-[380px] rounded-[3rem]")}>
            <div className="absolute inset-0 z-0 opacity-60 group-hover:opacity-100 transition-all duration-1000">
              <CyberGlobe />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-rose-500/[0.05] pointer-events-none" />
            
            <div className="absolute top-8 left-8 z-10 space-y-3">
              <div className="flex items-center gap-3">
                <Globe className="text-cyan-500 animate-spin-slow" size={20} />
                <span className="text-[11px] font-black text-white tracking-[0.4em] uppercase italic">ГЛОБАЛЬНИЙ СКАНИНГ</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_#10b981] " />
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic opacity-60">ОРБІТАЛЬНА_ФАЗА: АКТИВНО</span>
              </div>
            </div>
            
            <div className="absolute bottom-8 right-8 z-10 text-right">
              <div className="text-4xl font-black text-white tracking-tighter italic tabular-nums">
                194 <span className="text-[10px] text-slate-500 uppercase tracking-widest block mt-1 opacity-60">КРАЇНИ_ОХОПЛЕНО</span>
              </div>
            </div>
          </motion.section>

          {/* Neural Terminal Stream HUD */}
          <motion.section variants={fadeUp} className={cn("relative flex flex-col border border-white/5 bg-black/40 shadow-2xl overflow-hidden min-h-[500px]", isCompact ? "rounded-3xl p-5" : "rounded-[3rem] p-8")}>
            <div className="absolute top-0 right-0 w-1 h-full bg-cyan-600/30" />
            
            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 shadow-lg">
                  <Terminal size={20} />
                </div>
                <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">ЯДРО ТЕРМІНАЛУ</h2>
              </div>
              <div className="h-2 w-2 rounded-full bg-cyan-600 animate-ping shadow-[0_0_10px_#f43f5e]" />
            </div>
            
            <div className="flex-1 space-y-4 font-mono text-[11px] max-h-[550px] overflow-hidden no-scrollbar pr-2">
              <AnimatePresence initial={false}>
                {events.map((ev, i) => (
                  <motion.div 
                    key={ev.id} 
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-2xl border-l-4 transition-all hover:bg-white/[0.03] group/ev",
                      ev.type === 'warning' ? "border-amber-500 bg-amber-500/[0.03]" : "border-cyan-500 bg-cyan-500/[0.03]"
                    )}
                    style={{ opacity: `${Math.max(20, 100 - (i * 12))}%` }}
                  >
                    <span className="text-slate-600 shrink-0 font-black flex items-center gap-2 tabular-nums">
                       {ev.time}
                    </span>
                    <span className={cn(
                      "font-black tracking-tight italic leading-relaxed",
                      ev.type === 'warning' ? "text-amber-200/80" : "text-rose-200/80"
                    )}>
                      {ev.msg}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
               <div className="text-[10px] text-slate-600 font-black tracking-[0.3em] uppercase italic opacity-40">
                  ОПТИМІЗАЦІЯ_ВУЗЛА: ПОВНА
               </div>
               <div className="flex gap-2">
                  {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-500/20" />)}
               </div>
            </div>
          </motion.section>

        </div>

      </div>

      {/* ── FOOTER ACTIONS HUD ── */}
      <footer className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'ЗАПИТАТИ ШІ', hint: 'ГЛИБИННИЙ АНАЛІЗ ЦІЄЇ СЕСІЇ', icon: Brain, tone: 'rose', accent: 'emerald' },
          { label: 'ВЕРИФІКУВАТИ ДАНІ', hint: 'КВАНТОВЕ ПІДТВЕРДЖЕННЯ РЕЄСТРІВ', icon: ShieldCheck, tone: 'rose', accent: 'amber' },
          { label: 'ЗВІТ ДЛЯ РНБО', hint: 'ЕКСПОРТ ПРАВОВОГО ДОСЬЄ', icon: AlertOctagon, tone: 'rose', accent: 'rose' },
        ].map((action, i) => (
          <ThermalCard key={action.label} glowColor="rgba(225, 29, 72, 0.12)" className="group">
            <motion.button 
              variants={fadeUp}
              className="w-full p-8 flex items-center justify-between relative z-10"
            >
              <div className="flex items-center gap-6">
                <div className={cn(
                  "p-4 rounded-2xl border transition-all group-hover:scale-110 shadow-lg",
                  action.accent === 'emerald' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                  action.accent === 'amber' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                  "bg-cyan-500/10 border-cyan-500/20 text-cyan-500"
                )}>
                  <action.icon size={24} />
                </div>
                <div className="text-left">
                  <div className="text-base font-black text-white uppercase italic tracking-tight">{action.label}</div>
                  <div className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] mt-1 italic group-hover:text-rose-400/60 transition-colors">{action.hint}</div>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-800 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" />
            </motion.button>
          </ThermalCard>
        ))}
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-spin-slow {
          animation: spin 15s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </motion.div>
  );
}
