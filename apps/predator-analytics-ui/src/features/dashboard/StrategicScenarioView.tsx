/**
 * 🛰️ STRATEGIC SCENARIO HUB // ХАБ СТРАТЕГІЧНИХ СЦЕНАРІЇВ | v61.0-ELITE
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
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
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
      { name: 'ЛОГІСТИКА', value: activeScenario.impacts.logistics, color: '#3b82f6' },
      { name: 'ФІНАНСИ', value: activeScenario.impacts.finance, color: '#8b5cf6' },
      { name: 'ЕНЕРГЕТИКА', value: activeScenario.impacts.energy, color: '#f59e0b' },
      { name: 'БЕЗПЕКА', value: activeScenario.impacts.security, color: '#ef4444' },
    ];
  }, [activeScenario]);

  return (
    <div className="space-y-10">
      
      {/* HUD SECTION */}
      <div className="flex flex-col xl:flex-row gap-10">
        
        {/* SCENARIO SELECTOR */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">БІБЛІОТЕКА СЦЕНАРІЇВ</h2>
              <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em]">STRATEGIC_INTEL // V61.0-ELITE</p>
            </div>
            <button className="p-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all">
              <RefreshCcw size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {INITIAL_SCENARIOS.map((s) => (
              <motion.div
                key={s.id}
                whileHover={{ scale: 1.01, x: 10 }}
                onClick={() => setActiveScenario(s)}
                className={cn(
                  "p-8 rounded-[2.5rem] border-2 cursor-pointer transition-all duration-500 relative overflow-hidden group",
                  activeScenario?.id === s.id 
                    ? "bg-blue-600/10 border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.15)]" 
                    : "bg-black border-white/[0.03] hover:border-white/10"
                )}
              >
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex gap-6">
                    <div className={cn(
                      "w-16 h-16 rounded-[1.5rem] flex items-center justify-center border shadow-2xl",
                      activeScenario?.id === s.id ? "bg-blue-500 text-white border-blue-400" : "bg-white/5 text-slate-500 border-white/10"
                    )}>
                      {s.id === 'blockade' && <Waves size={32} />}
                      {s.id === 'energy' && <Flame size={32} />}
                      {s.id === 'cyber' && <Cpu size={32} />}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-white italic tracking-tighter uppercase group-hover:text-blue-400 transition-colors">{s.title}</h3>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-md">{s.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black italic font-mono text-white">{s.riskScore}%</span>
                    <p className="text-[8px] font-black text-slate-700 uppercase">RISK_PROB</p>
                  </div>
                </div>
                
                {activeScenario?.id === s.id && (
                  <motion.div layoutId="glow" className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-transparent pointer-events-none" />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* SIMULATION ENGINE */}
        <div className="w-full xl:w-[600px]">
          <TacticalCard 
            title="S.E.N.T.I.N.E.L ENGINE" 
            subtitle="STRATEGIC_EVOLUTION_NETWORK"
            className="h-full bg-black/40 backdrop-blur-3xl border-2 border-white/[0.04]"
          >
            <div className="h-full flex flex-col justify-between py-6">
              {!activeScenario ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 opacity-30">
                  <div className="p-10 bg-white/5 rounded-full border border-white/10 animate-pulse">
                    <Play size={48} className="text-slate-500" />
                  </div>
                  <p className="text-xs font-black tracking-widest uppercase italic">ОБЕРІТЬ СЦЕНАРІЙ ДЛЯ ЗАПУСКУ СИМУЛЯЦІЇ</p>
                </div>
              ) : (
                <div className="flex-1 space-y-10">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                      <div className="flex items-center gap-3">
                        <Activity size={16} className="text-blue-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">СТАТУС</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={cn("w-3 h-3 rounded-full", isSimulating ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
                        <span className="text-lg font-black text-white italic uppercase">{isSimulating ? 'СИНТЕЗ...' : 'ГОТОВО'}</span>
                      </div>
                    </div>
                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                      <div className="flex items-center gap-3">
                        <Target size={16} className="text-red-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ТОЧНІСТЬ</span>
                      </div>
                      <span className="text-2xl font-black text-white italic font-mono uppercase tracking-tighter">98.4%</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ВЕКТОР ВПЛИВУ</span>
                      <Badge variant="outline" className="text-[8px] border-white/10 text-slate-500 uppercase">REAL_TIME_CALC</Badge>
                    </div>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={impactData} layout="vertical">
                          <XAxis type="number" hide domain={[0, 100]} />
                          <YAxis dataKey="name" type="category" hide />
                          <Tooltip 
                            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-black/90 border border-white/10 p-3 rounded-xl backdrop-blur-xl">
                                    <p className="text-[10px] font-black text-white">{payload[0].name}: {payload[0].value}%</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={25}>
                            {impactData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {impactData.map((d, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                                <span className="text-[9px] font-black text-slate-500 uppercase">{d.name}</span>
                            </div>
                        ))}
                    </div>
                  </div>

                  <button 
                    disabled={isSimulating}
                    onClick={() => startSimulation(activeScenario)}
                    className={cn(
                      "w-full py-6 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.3em] italic transition-all flex items-center justify-center gap-4",
                      isSimulating 
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                        : "bg-blue-600 text-white hover:bg-blue-500 shadow-[0_20px_50px_rgba(37,99,235,0.3)]"
                    )}
                  >
                    {isSimulating ? <RefreshCcw size={18} className="animate-spin" /> : <Play size={18} />}
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
            className="grid grid-cols-12 gap-10"
          >
            {/* FORECAST CHART */}
            <div className="col-span-12 lg:col-span-8">
              <TacticalCard title="ПРОГНОЗ РЕЗИЛЬЄНТНОСТІ" subtitle="STABILITY_DECAY_FORECAST">
                <div className="h-[400px] w-full mt-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activeScenario.forecast}>
                      <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} unit="%" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        itemStyle={{ fontSize: '10px', fontWeight: '900', color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorVal)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </TacticalCard>
            </div>

            {/* AI COPILOT RECOMMENDATIONS */}
            <div className="col-span-12 lg:col-span-4">
              <div className="h-full p-10 rounded-[3.5rem] bg-gradient-to-br from-blue-900/40 to-black border-2 border-blue-500/20 shadow-2xl space-y-8 relative overflow-hidden group">
                <div className="absolute -top-20 -right-20 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Zap size={300} className="text-blue-500" />
                </div>
                
                <div className="space-y-2 relative z-10">
                  <div className="flex items-center gap-3">
                    <Cpu size={20} className="text-blue-400" />
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">AI_CEO_COPILOT</span>
                  </div>
                  <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-tight">СТРАТЕГІЧНІ РЕКОМЕНДАЦІЇ</h3>
                </div>

                <div className="space-y-6 relative z-10">
                  {[
                    "Активувати протокол Mirror Vault для критичних реєстрів.",
                    "Диверсифікувати логістику через залізничні хаби ЄС.",
                    "Збільшити резерви ліквідності на 15% протягом 48 годин.",
                    "Перевести аналітичний двигун у режим 'Truth-Only'."
                  ].map((rec, i) => (
                    <div key={i} className="flex gap-4 p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-black text-blue-400">{i + 1}</span>
                      </div>
                      <p className="text-[13px] font-bold text-slate-300 leading-relaxed italic">{rec}</p>
                    </div>
                  ))}
                </div>

                <button className="w-full mt-4 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-3 shadow-2xl relative z-10">
                   ПРИЙНЯТИ СТРАТЕГІЮ <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
}
