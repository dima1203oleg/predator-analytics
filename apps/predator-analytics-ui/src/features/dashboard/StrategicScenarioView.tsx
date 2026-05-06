/**
 * 🛰️ STRATEGIC SCENARIO HUB // ХАБ СТРАТЕГІЧНИХ СЦЕНАРІЇВ | v63.0-ELITE
 * PREDATOR Analytics — Macro-Economic & Geo-Political Simulation
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, AlertTriangle, ShieldAlert, TrendingUp, 
    Globe, Lock, Unlock, Play, RefreshCcw, 
    Target, BarChart3, PieChart, Activity,
    Scale, HelpCircle, ChevronRight, Layers,
    Flame, Waves, Wind, Cpu, Database
} from 'lucide-react';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

// ─── TYPES ───────────────────────────────────────────────────────────

interface Scenario {
  id: string;
  title: string;
  description: string;
  intensity: number; // 0-100
  status: 'idle' | 'active' | 'completed';
  riskScore: number;
  impacts: {
    logistics: number;
    finance: number;
    energy: number;
    security: number;
  };
  forecast: { time: string; value: number }[];
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
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(INITIAL_SCENARIOS[0]);
  const [isSimulating, setIsSimulating] = useState(false);

  const startSimulation = (scenario: Scenario) => {
    setActiveScenario(scenario);
    setIsSimulating(true);
    // Simulate progress
    setTimeout(() => {
      setIsSimulating(false);
    }, 3000);
  };

  const impactData = useMemo(() => {
    if (!activeScenario) return [];
    return [
      { name: 'ЛОГІСТИКА', value: activeScenario.impacts.logistics, color: '#f43f5e' },
      { name: 'ФІНАНСИ', value: activeScenario.impacts.finance, color: '#e11d48' },
      { name: 'ЕНЕРГЕТИКА', value: activeScenario.impacts.energy, color: '#fb7185' },
      { name: 'БЕЗПЕКА', value: activeScenario.impacts.security, color: '#9f1239' },
    ];
  }, [activeScenario]);

  return (
    <div className="space-y-12 p-2">
      
      {/* HUD SECTION */}
      <div className="flex flex-col xl:flex-row gap-12">
        
        {/* SCENARIO SELECTOR */}
        <div className="flex-1 space-y-8">
          <div className="flex items-center justify-between mb-10">
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">БІБЛІОТЕКА СЦЕНАРІЇВ</h2>
              <p className="text-[10px] text-rose-500 font-black tracking-[0.4em] uppercase italic">STRATEGIC_INTEL // V63.0-ELITE</p>
            </div>
            <button className="p-5 bg-black/40 border border-white/10 rounded-3xl text-slate-500 hover:text-rose-500 transition-all shadow-xl">
              <RefreshCcw size={22} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {INITIAL_SCENARIOS.map((s) => (
              <motion.div
                key={s.id}
                whileHover={{ scale: 1.01, x: 10 }}
                onClick={() => setActiveScenario(s)}
                className={cn(
                  "p-10 rounded-[3.5rem] border-2 cursor-pointer transition-all duration-500 relative overflow-hidden group shadow-2xl",
                  activeScenario?.id === s.id 
                    ? "bg-rose-600/10 border-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.15)]" 
                    : "bg-black border-white/[0.03] hover:border-white/10"
                )}
              >
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex gap-8">
                    <div className={cn(
                      "w-20 h-20 rounded-[2rem] flex items-center justify-center border-2 shadow-2xl transition-all duration-500",
                      activeScenario?.id === s.id ? "bg-rose-600 text-white border-rose-400" : "bg-white/5 text-slate-500 border-white/10"
                    )}>
                      {s.id === 'blockade' && <Waves size={36} />}
                      {s.id === 'energy' && <Flame size={36} />}
                      {s.id === 'cyber' && <Cpu size={36} />}
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase group-hover:text-rose-400 transition-colors">{s.title}</h3>
                      <p className="text-sm text-slate-500 font-black uppercase tracking-tight leading-relaxed max-w-lg italic opacity-80">{s.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black italic font-mono text-white tabular-nums">{s.riskScore}%</span>
                    <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest mt-1">RISK_PROB</p>
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
        <div className="w-full xl:w-[650px]">
          <TacticalCard 
            title="S.E.N.T.I.N.E.L ENGINE" 
            subtitle="STRATEGIC_EVOLUTION_NETWORK"
            className="h-full bg-black/40 backdrop-blur-3xl border-2 border-white/[0.04] p-10 rounded-[4rem] shadow-4xl"
          >
            <div className="h-full flex flex-col justify-between py-6">
              {!activeScenario ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 opacity-30">
                  <div className="p-12 bg-white/5 rounded-full border-2 border-white/10 animate-pulse">
                    <Play size={64} className="text-slate-500" />
                  </div>
                  <p className="text-[11px] font-black tracking-[0.5em] uppercase italic text-rose-500">ОБЕРІТЬ СЦЕНАРІЙ ДЛЯ ЗАПУСКУ СИМУЛЯЦІЇ</p>
                </div>
              ) : (
                <div className="flex-1 space-y-12">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-8 bg-black border-2 border-white/5 rounded-[3rem] space-y-5 shadow-inner">
                      <div className="flex items-center gap-4">
                        <Activity size={18} className="text-rose-500" />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic">СТАТУС</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={cn("w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]", isSimulating ? "bg-amber-500 text-amber-500 animate-pulse" : "bg-emerald-500 text-emerald-500")} />
                        <span className="text-xl font-black text-white italic uppercase tracking-widest">{isSimulating ? 'СИНТЕЗ...' : 'ГОТОВО'}</span>
                      </div>
                    </div>
                    <div className="p-8 bg-black border-2 border-white/5 rounded-[3rem] space-y-5 shadow-inner">
                      <div className="flex items-center gap-4">
                        <Target size={18} className="text-rose-500" />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic">ТОЧНІСТЬ</span>
                      </div>
                      <span className="text-3xl font-black text-white italic font-mono uppercase tracking-tighter tabular-nums">98.4%</span>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] italic">ВЕКТОР ВПЛИВУ</span>
                      <div className="px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-[9px] font-black text-rose-500 uppercase italic tracking-widest">REAL_TIME_CALC</div>
                    </div>
                    <div className="h-[280px] w-full p-6 bg-black/40 rounded-[3rem] border border-white/5">
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
                            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 transition-all hover:border-rose-500/20">
                                <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: d.color, color: d.color }} />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic leading-none">{d.name}</span>
                                <span className="ml-auto text-[11px] font-black text-white font-mono italic">{d.value}%</span>
                            </div>
                        ))}
                    </div>
                  </div>

                  <button 
                    disabled={isSimulating}
                    onClick={() => startSimulation(activeScenario)}
                    className={cn(
                      "w-full py-8 rounded-[2.5rem] text-[13px] font-black uppercase tracking-[0.5em] italic transition-all flex items-center justify-center gap-6 border-4",
                      isSimulating 
                        ? "bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed" 
                        : "bg-rose-600 text-white border-rose-500/30 hover:brightness-110 shadow-4xl"
                    )}
                  >
                    {isSimulating ? <RefreshCcw size={24} className="animate-spin" /> : <Play size={24} />}
                    {isSimulating ? 'ОБРОБКА СЦЕНАРІЮ...' : 'ЗАПУСТИТИ СИМУЛЯЦІЮ'}
                  </button>
                </div>
              )}
            </div>
          </TacticalCard>
        </div>
      </div>

      {/* ANALYSIS SECTION */}
      <AnimatePresence>
        {activeScenario && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="grid grid-cols-12 gap-12"
          >
            {/* FORECAST CHART */}
            <div className="col-span-12 lg:col-span-8">
              <TacticalCard title="ПРОГНОЗ РЕЗИЛЬЄНТНОСТІ" subtitle="STABILITY_DECAY_FORECAST" className="bg-black/40 border-2 border-white/[0.04] p-10 rounded-[4rem] shadow-4xl">
                <div className="h-[450px] w-full mt-12 p-8 bg-black/60 rounded-[3rem] border border-white/5">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activeScenario.forecast} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorScenarioRose" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.02)" vertical={false} />
                      <XAxis dataKey="time" stroke="rgba(255,255,255,0.1)" fontSize={10} tickLine={false} axisLine={false} fontWeight="900" italic />
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
              </TacticalCard>
            </div>

            {/* AI COPILOT RECOMMENDATIONS */}
            <div className="col-span-12 lg:col-span-4">
              <div className="h-full p-12 rounded-[4rem] bg-black/40 border-2 border-rose-500/20 shadow-4xl space-y-10 relative overflow-hidden group">
                <div className="absolute -top-24 -right-24 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-1000">
                    <Zap size={350} className="text-rose-500" />
                </div>
                
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                      <Cpu size={24} className="text-rose-500 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.5em] italic">AI_CEO_COPILOT</span>
                      <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-tight">СТРАТЕГІЧНІ РЕКОМЕНДАЦІЇ</h3>
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
                    <div key={i} className="flex gap-6 p-7 bg-black/60 border border-white/5 rounded-[2.5rem] hover:border-rose-500/30 transition-all group/rec shadow-xl">
                      <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0 shadow-inner group-hover/rec:bg-rose-500 group-hover/rec:text-white transition-all">
                        <span className="text-[11px] font-black italic">{i + 1}</span>
                      </div>
                      <p className="text-[14px] font-black text-slate-300 leading-relaxed italic uppercase tracking-tight group-hover/rec:text-white transition-colors">{rec}</p>
                    </div>
                  ))}
                </div>

                <button className="w-full mt-6 py-6 bg-rose-600 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.4em] italic hover:brightness-110 transition-all flex items-center justify-center gap-5 shadow-4xl relative z-10 border-4 border-rose-500/20">
                   ПРИЙНЯТИ СТРАТЕГІЮ <ChevronRight size={20} />
                </button>
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
