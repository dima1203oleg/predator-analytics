/**
 * 🛰️ STRATEGIC SCENARIO HUB // ХАБ СТРАТЕГІЧНИХ СЦЕНАРІЇВ | v63.0-ELITE
 * PREDATOR Analytics — Macro-Economic & Geo-Political Simulation
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import { Button } from '@/components/ui/button';
import { BrandLoaderFallback } from '@/components/polish/BrandLoader';
import { ThermalCard } from '@/components/polish/ThermalCard';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Flame, Waves, Wind, Cpu, Database, RefreshCcw, Play, Target, ShieldAlert, Activity, ChevronRight, Zap
} from 'lucide-react';
import { HoloCard } from '@/components/ui/HoloCard';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import { factoryApi } from '@/services/api/factory';
import { useViewport } from '@/hooks/useViewport';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

// ─── TYPES ───────────────────────────────────────────────────────────

interface Scenario {
  id: string;
  name?: string;
  title?: string; // для зворотної сумісності
  description: string;
  probability?: number;
  base_impact_uah_mln?: number;
  impact_level?: string;
  triggers?: string[];
  logic_base?: string;
  status: 'idle' | 'active' | 'completed';
  riskScore: number;
  intensity?: number;
  impacts?: {
    logistics: number;
    finance: number;
    energy: number;
    security: number;
  };
  forecast?: { time: string; value: number }[];
}

interface MonteCarloResults {
  expected_impact_mln: number;
  p95_impact_mln: number;
  p99_impact_mln: number;
}

// ─── MOCK DATA ───────────────────────────────────────────────────────

const INITIAL_SCENARIOS: Scenario[] = [
  {
    id: 'blockade',
    title: 'БЛОКАДА ЧОРНОМОРСЬКИХ ПОРТІВ',
    description: 'Симуляція повного припинення морського трафіку через Одеський хаб. Аналіз альтернативних логістичних шляхів.',
    intensity: 85,
    status: 'idle',
    riskScore: 92,
    impacts: { logistics: 95, finance: 60, energy: 40, security: 80 },
    forecast: [
      { time: 'T-0', value: 100 }, { time: 'T+1', value: 45 }, { time: 'T+2', value: 20 }, { time: 'T+3', value: 15 }, { time: 'T+4', value: 12 }
    ]
  },
  {
    id: 'energy',
    title: 'ДЕФІЦИТ ЕНЕРГОНОСІЇВ',
    description: 'Критичне зниження імпорту палива. Вплив на вартість перевезень та виробничі ланцюжки.',
    intensity: 60,
    status: 'idle',
    riskScore: 78,
    impacts: { logistics: 70, finance: 85, energy: 95, security: 50 },
    forecast: [
      { time: 'T-0', value: 100 }, { time: 'T+1', value: 80 }, { time: 'T+2', value: 65 }, { time: 'T+3', value: 50 }, { time: 'T+4', value: 45 }
    ]
  },
  {
    id: 'cyber',
    title: 'ГЛОБАЛЬНИЙ КІБЕР-ШТОРМ',
    description: 'Масштабна атака на банківський сектор та митні системи. Перехід на автономні протоколи Mirror Vault.',
    intensity: 45,
    status: 'idle',
    riskScore: 65,
    impacts: { logistics: 50, finance: 95, energy: 30, security: 90 },
    forecast: [
      { time: 'T-0', value: 100 }, { time: 'T+1', value: 90 }, { time: 'T+2', value: 75 }, { time: 'T+3', value: 60 }, { time: 'T+4', value: 55 }
    ]
  }
];

// ─── COMPONENTS ──────────────────────────────────────────────────────

export default function StrategicScenarioView() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mcResults, setMcResults] = useState<MonteCarloResults | null>(null);

  const fetchScenarios = async () => {
    try {
      setIsLoading(true);
      const data = await factoryApi.getWargamingScenarios();
      const mapped = data.map((s: any) => ({
        ...s,
        title: s.name,
        riskScore: s.probability,
        status: 'idle',
        impacts: s.impacts || { 
            logistics: Math.random() * 100, 
            finance: Math.random() * 100, 
            energy: Math.random() * 100, 
            security: Math.random() * 100 
        },
        forecast: s.forecast || [
            { time: 'T-0', value: 100 }, 
            { time: 'T+1', value: 100 - (s.probability / 2) }, 
            { time: 'T+2', value: 100 - s.probability }
        ]
      }));
      setScenarios(mapped);
      if (mapped.length > 0) setActiveScenario(mapped[0]);
    } catch (e) {
      console.error("Помилка завантаження сценаріїв:", e);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchScenarios();
  }, []);

  const startSimulation = async (scenario: Scenario) => {
    setIsSimulating(true);
    setMcResults(null);
    try {
      // Запускаємо симуляцію Монте-Карло для обраного сценарію
      const results = await factoryApi.runMonteCarlo({
        scenarios: [{ 
            id: scenario.id, 
            name: scenario.name ?? scenario.title ?? scenario.id, 
            probability: (scenario.probability ?? 50) / 100, 
            impact_uah_mln: scenario.base_impact_uah_mln ?? 100 
        }],
        iterations: 5000
      });
      setMcResults(results);
    } catch (e) {
      console.error("Симуляція провалена:", e);
    } finally {
      setIsSimulating(false);
    }
  };

  const impactData = useMemo(() => {
    if (!activeScenario || !activeScenario.impacts) return [];
    return [
      { name: 'ЛОГІСТИКА', value: Math.round(activeScenario.impacts.logistics), color: '#f43f5e' },
      { name: 'ФІНАНСИ', value: Math.round(activeScenario.impacts.finance), color: '#e11d48' },
      { name: 'ЕНЕРГЕТИКА', value: Math.round(activeScenario.impacts.energy), color: '#fb7185' },
      { name: 'БЕЗПЕКА', value: Math.round(activeScenario.impacts.security), color: '#9f1239' },
    ];
  }, [activeScenario]);

  const { isCompact, isMedium } = useViewport();

  return (
    <div className={cn("space-y-6 sm:space-y-12", isCompact ? "p-3" : "p-2")}>
      
      {/* HUD SECTION */}
      <div className={cn("flex flex-col xl:flex-row", isCompact ? "gap-6" : "gap-12")}>
        
        {/* SCENARIO SELECTOR */}
        <div className={cn("flex-1", isCompact ? "space-y-4" : "space-y-8")}>
          <div className={cn("flex items-center justify-between", isCompact ? "mb-4" : "mb-10")}>
            <div className="space-y-2">
              <h2 className={cn("font-black text-white italic tracking-tighter uppercase", isCompact ? "text-xl" : isMedium ? "text-2xl" : "text-4xl")}>БІБЛІОТЕКА СЦЕНАРІЇВ</h2>
              <p className="text-[10px] text-cyan-500 font-black tracking-[0.4em] uppercase italic">STRATEGIC_INTEL // V63.0-ELITE</p>
            </div>
            <Button variant="cyber" className={cn("bg-black/40 border border-white/10 rounded-3xl text-slate-500 hover:text-cyan-500 transition-all shadow-xl", isCompact ? "p-3" : "p-5")}>
              <RefreshCcw size={isCompact ? 18 : 22} />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {isLoading ? (
                <div className="p-20 text-center flex flex-col items-center gap-5">
                    <BrandLoaderFallback text="ГЕНЕРАЦІЯ СЦЕНАРІЇВ" subtext="МАКРОЕКОНОМІЧНЕ МОДЕЛЮВАННЯ" />
                </div>
            ) : scenarios.map((s) => (
              <motion.div
                key={s.id}
                whileHover={{ scale: 1.01, x: isCompact ? 4 : 10 }}
                onClick={() => setActiveScenario(s)}
                className={cn(
                  "rounded-[2.5rem] sm:rounded-[3.5rem] border-2 cursor-pointer transition-all duration-500 relative overflow-hidden group shadow-2xl",
                  isCompact ? "p-4" : isMedium ? "p-6" : "p-10",
                  activeScenario?.id === s.id 
                    ? "bg-cyan-600/10 border-cyan-500 " 
                    : "bg-black border-white/[0.03] hover:border-white/10"
                )}
              >
                <div className={cn("flex items-start justify-between relative z-10", isCompact && "flex-wrap gap-3")}>
                  <div className={cn("flex", isCompact ? "gap-4" : "gap-8")}>
                    <div className={cn(
                      "rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center border-2 shadow-2xl transition-all duration-500 shrink-0",
                      isCompact ? "w-11 h-11" : isMedium ? "w-14 h-14" : "w-20 h-20",
                      activeScenario?.id === s.id ? "bg-cyan-600 text-white border-cyan-400" : "bg-white/5 text-slate-500 border-white/10"
                    )}>
                      {s.id.includes('LOG') || s.id.includes('WAR')
                        ? <Waves size={isCompact ? 20 : isMedium ? 26 : 36} />
                        : <ShieldAlert size={isCompact ? 20 : isMedium ? 26 : 36} />}
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <h3 className={cn("font-black text-white italic tracking-tighter uppercase group-hover:text-rose-400 transition-colors", isCompact ? "text-base" : isMedium ? "text-lg" : "text-2xl")}>{s.name ?? s.title}</h3>
                      {!isCompact && <p className="text-sm text-slate-500 font-black uppercase tracking-tight leading-relaxed max-w-lg italic opacity-80">{s.description}</p>}
                      {isCompact && <p className="text-[10px] text-slate-500 uppercase tracking-tight leading-relaxed italic opacity-80 line-clamp-2">{s.description}</p>}
                    </div>
                  </div>
                  <div className={cn("text-right", isCompact && "ml-auto")}>
                    <span className={cn("font-black italic font-mono text-white tabular-nums", isCompact ? "text-xl" : "text-3xl")}>{s.probability}%</span>
                    <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest mt-1">PROBABILITY</p>
                  </div>
                </div>
                
                {activeScenario?.id === s.id && (
                  <motion.div layoutId="glow-scenario" className="absolute inset-0 bg-gradient-to-r from-rose-600/5 to-transparent pointer-events-none" />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* SIMULATION ENGINE */}
        <div className={cn("w-full", !isCompact && "xl:w-[600px]")}>
          <HoloCard 
            title="S.E.N.T.I.N.E.L ENGINE" 
            subtitle="STRATEGIC_EVOLUTION_NETWORK"
            className={cn("h-full bg-black/40 border-2 border-white/[0.04] rounded-[3rem] sm:rounded-[4rem] shadow-4xl", isCompact ? "p-4" : isMedium ? "p-6" : "p-10")}
          >
            <div className="h-full flex flex-col justify-between py-6">
              {!activeScenario ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 opacity-30">
                  <div className="p-12 bg-white/5 rounded-full border-2 border-white/10 ">
                    <Play size={64} className="text-slate-500" />
                  </div>
                  <p className="text-[11px] font-black tracking-[0.5em] uppercase italic text-cyan-500">ОБЕРІТЬ СЦЕНАРІЙ ДЛЯ ЗАПУСКУ СИМУЛЯЦІЇ</p>
                </div>
              ) : (
                <div className="flex-1 space-y-12">
                  <div className="grid grid-cols-2 gap-6">
                    <ThermalCard glowColor="rgba(225, 29, 72, 0.1)">
                      <div className="p-8 space-y-5">
                        <div className="flex items-center gap-4">
                          <Activity size={18} className="text-cyan-500" />
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic">СТАТУС СИМУЛЯЦІЇ</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={cn("w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]", isSimulating ? "bg-amber-500 text-amber-500 " : mcResults ? "bg-emerald-500 text-emerald-500" : "bg-slate-700 text-slate-700")} />
                          <span className="text-xl font-black text-white italic uppercase tracking-widest">{isSimulating ? 'ОБРАХУНОК...' : mcResults ? 'ЗАВЕРШЕНО' : 'ОЧІКУВАННЯ'}</span>
                        </div>
                      </div>
                    </ThermalCard>
                    <ThermalCard glowColor="rgba(225, 29, 72, 0.1)">
                      <div className="p-8 space-y-5">
                        <div className="flex items-center gap-4">
                          <Target size={18} className="text-cyan-500" />
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic">МАТ. ТОЧНІСТЬ</span>
                        </div>
                        <span className="text-3xl font-black text-white italic font-mono uppercase tracking-tighter tabular-nums">99.9%</span>
                      </div>
                    </ThermalCard>
                  </div>

                  {mcResults && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-10 bg-cyan-600/10 border-2 border-cyan-500/30 rounded-[3rem] space-y-6 "
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em] italic">MONTE_CARLO_OUTPUT</span>
                            <Badge variant="outline" className="border-cyan-500/50 text-cyan-500 text-[8px]">p99_CONFIDENCE</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">ОЧІКУВАНІ ЗБИТКИ</p>
                                <p className="text-3xl font-black text-white italic font-mono">{mcResults.expected_impact_mln}M ₴</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">p99 WORST CASE</p>
                                <p className="text-3xl font-black text-cyan-500 italic font-mono">{mcResults.p99_impact_mln}M ₴</p>
                            </div>
                        </div>
                    </motion.div>
                  )}

                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] italic">ВЕКТОР ВПЛИВУ</span>
                      <div className="px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[9px] font-black text-cyan-500 uppercase italic tracking-widest">REAL_TIME_CALC</div>
                    </div>
                    <div className={cn("w-full bg-black/40 rounded-[2rem] sm:rounded-[3rem] border border-white/5", isCompact ? "h-[200px] p-3" : "h-[280px] p-6")}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={impactData} layout="vertical" margin={{ left: -30, right: 20 }}>
                          <XAxis type="number" hide domain={[0, 100]} />
                          <YAxis dataKey="name" type="category" hide />
                          <Tooltip 
                            cursor={{ fill: 'rgba(244, 63, 94, 0.05)' }}
                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '20px', padding: '12px' }}
                            itemStyle={{ color: '#fff', fontWeight: '900', fontSize: '10px' }}
                          />
                          <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={32}>
                            {impactData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        {impactData.map((d, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 transition-all hover:border-cyan-500/20">
                                <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: d.color, color: d.color }} />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic leading-none">{d.name}</span>
                                <span className="ml-auto text-[11px] font-black text-white font-mono italic">{d.value}%</span>
                            </div>
                        ))}
                    </div>
                  </div>

                <Button variant="cyber"
                  disabled={isSimulating}
                  onClick={() => startSimulation(activeScenario)}
                  className={cn(
                    "w-full rounded-[2.5rem] text-[13px] font-black uppercase tracking-[0.5em] italic transition-all flex items-center justify-center gap-6 border-4",
                    isSimulating 
                      ? "bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed" 
                      : "bg-cyan-600 text-white border-cyan-500/30 hover:brightness-110 shadow-4xl",
                    isCompact ? "h-20 text-sm" : "py-8"
                  )}
                >
                  {isSimulating ? <RefreshCcw size={24} className="animate-spin" /> : <Play size={24} />}
                  {isSimulating ? 'ОБРОБКА СЦЕНАРІЮ...' : 'ЗАПУСТИТИ СИМУЛЯЦІЮ'}
                </Button>
                </div>
              )}
            </div>
          </HoloCard>
        </div>
      </div>

      {/* ANALYSIS SECTION */}
      <AnimatePresence>
        {activeScenario && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={cn("grid grid-cols-12", isCompact ? "gap-6" : "gap-12")}
          >
            {/* FORECAST CHART */}
            <div className="col-span-12 lg:col-span-8">
              <HoloCard title="ПРОГНОЗ РЕЗИЛЬЄНТНОСТІ" subtitle="STABILITY_DECAY_FORECAST" className={cn("bg-black/40 border-2 border-white/[0.04] rounded-[3rem] sm:rounded-[4rem] shadow-4xl", isCompact ? "p-4" : isMedium ? "p-6" : "p-10")}>
                <div className={cn("w-full bg-black/60 rounded-[2rem] sm:rounded-[3rem] border border-white/5", isCompact ? "h-[220px] mt-4 p-3" : "h-[400px] sm:h-[450px] mt-12 p-8")}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activeScenario.forecast} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorScenarioRose" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.02)" vertical={false} />
                      <XAxis dataKey="time" stroke="rgba(255,255,255,0.1)" fontSize={10} tickLine={false} axisLine={false} fontWeight="900" />
                      <YAxis stroke="rgba(255,255,255,0.1)" fontSize={10} tickLine={false} axisLine={false} unit="%" fontWeight="900" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.95)', border: '2px solid rgba(244,63,94,0.3)', borderRadius: '24px', padding: '16px' }}
                        itemStyle={{ fontSize: '11px', fontWeight: '900', color: '#f43f5e' }}
                        labelStyle={{ fontSize: '10px', color: '#475569', marginBottom: '8px', fontWeight: '900' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#f43f5e" strokeWidth={5} fillOpacity={1} fill="url(#colorScenarioRose)" animationDuration={3000} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </HoloCard>
            </div>

            {/* AI COPILOT RECOMMENDATIONS */}
            <div className="col-span-12 lg:col-span-4">
              <div className={cn("h-full rounded-[3rem] sm:rounded-[4rem] bg-black/40 border-2 border-cyan-500/20 shadow-4xl relative overflow-hidden group", isCompact ? "p-5 space-y-5" : isMedium ? "p-8 space-y-6" : "p-12 space-y-10")}>
                <div className="absolute -top-24 -right-24 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-1000">
                    <Zap size={350} className="text-cyan-500" />
                </div>
                
                <div className="space-y-3 sm:space-y-4 relative z-10">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-cyan-500/10 rounded-xl sm:rounded-2xl border border-cyan-500/20 shrink-0">
                      <Cpu size={isCompact ? 18 : 24} className="text-cyan-500" />
                    </div>
                    <div>
                      <span className="text-[9px] sm:text-[10px] font-black text-cyan-500 uppercase tracking-[0.4em] sm:tracking-[0.5em] italic">AI_CEO_COPILOT</span>
                      <h3 className={cn("font-black text-white italic tracking-tighter uppercase leading-tight", isCompact ? "text-xl" : isMedium ? "text-2xl" : "text-3xl")}>СТРАТЕГІЧНІ РЕКОМЕНДАЦІЇ</h3>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 relative z-10">
                  {[
                    "Активувати протокол Mirror Vault для критичних реєстрів.",
                    "Диверсифікувати логістику через залізничні хаби ЄС.",
                    "Збільшити резерви ліквідності на 15% протягом 48 годин.",
                    "Перевести аналітичний двигун у режим 'Truth-Only'."
                  ].map((rec, i) => (
                    <div key={i} className={cn("flex bg-black/60 border border-white/5 rounded-[2rem] sm:rounded-[2.5rem] hover:border-cyan-500/30 transition-all group/rec shadow-xl", isCompact ? "gap-3 p-4" : "gap-6 p-7")}>
                      <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-inner group-hover/rec:bg-cyan-500 group-hover/rec:text-white transition-all">
                        <span className="text-[11px] font-black italic">{i + 1}</span>
                      </div>
                      <p className="text-[14px] font-black text-slate-300 leading-relaxed italic uppercase tracking-tight group-hover/rec:text-white transition-colors">{rec}</p>
                    </div>
                  ))}
                </div>

                <Button variant="cyber" className={cn("w-full bg-cyan-600 text-white rounded-[2rem] sm:rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.4em] italic hover:brightness-110 transition-all flex items-center justify-center gap-5 shadow-4xl relative z-10 border-4 border-cyan-500/20", isCompact ? "mt-4 py-4" : "mt-6 py-6")}>
                   ПРИЙНЯТИ СТРАТЕГІЮ <ChevronRight size={isCompact ? 16 : 20} />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
