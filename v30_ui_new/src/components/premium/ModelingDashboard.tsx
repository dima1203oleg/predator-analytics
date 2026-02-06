import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Sliders, Play, RefreshCw, Layers,
  Settings, Save, Share2, Zap, ArrowRight, BarChart3
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { analyticsService, TimeSeriesData } from '../../services/unified/analytics.service';
import { premiumLocales } from '../../locales/uk/premium';
import { cn } from '../../utils/cn';

interface Scenario {
  id: string;
  name: string;
  description: string;
  impactFactor: number;
}

export const ModelingDashboard: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<string>('conservative');
  const [data, setData] = useState<TimeSeriesData[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const SCENARIOS: Scenario[] = useMemo(() => [
    {
      id: 'optimistic',
      name: premiumLocales.modeling.scenarios.optimistic.name,
      description: premiumLocales.modeling.scenarios.optimistic.desc,
      impactFactor: 1.15
    },
    {
      id: 'conservative',
      name: premiumLocales.modeling.scenarios.conservative.name,
      description: premiumLocales.modeling.scenarios.conservative.desc,
      impactFactor: 1.02
    },
    {
      id: 'crisis',
      name: premiumLocales.modeling.scenarios.crisis.name,
      description: premiumLocales.modeling.scenarios.crisis.desc,
      impactFactor: 0.8
    },
    {
      id: 'currency',
      name: premiumLocales.modeling.scenarios.currency.name,
      description: premiumLocales.modeling.scenarios.currency.desc,
      impactFactor: 0.9
    },
  ], []);

  useEffect(() => {
    runSimulation();
  }, [activeScenario]);

  const runSimulation = async () => {
    setIsSimulating(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const baseData = await analyticsService.getForecast();
    const scenario = SCENARIOS.find(s => s.id === activeScenario);
    const factor = scenario?.impactFactor || 1;

    // Apply scenario factor to generating "modeled" data
    const modeledData = baseData.map(item => ({
      ...item,
      value: Math.round(item.value * (1 + (Math.random() * 0.1 - 0.05))), // Add noise
      prediction: Math.round((item.prediction || item.value) * factor)
    }));

    setData(modeledData);
    setIsSimulating(false);
  };

  return (
    <div className="space-y-6 p-6 bg-slate-950/80 border border-white/10 rounded-[32px] backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <div className="flex items-center gap-2 mb-1">
             <div className="p-2 bg-indigo-500/20 rounded-lg">
               <Sliders size={18} className="text-indigo-400" />
             </div>
             <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{premiumLocales.modeling.coreName}</span>
           </div>
           <h2 className="text-2xl font-black text-white">{premiumLocales.modeling.title}</h2>
           <p className="text-xs text-slate-400 max-w-lg">{premiumLocales.modeling.subtitle}</p>
        </div>

        <div className="flex gap-2">
            <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white border border-white/5 transition-all">
                <Settings size={18} />
            </button>
            <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white border border-white/5 transition-all">
                <Save size={18} />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="space-y-4">
           <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">{premiumLocales.modeling.scenarios.title}</h3>
           <div className="space-y-3">
               {SCENARIOS.map(scenario => (
                   <motion.button
                      key={scenario.id}
                      onClick={() => setActiveScenario(scenario.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                          "w-full text-left p-4 rounded-xl border transition-all relative overflow-hidden group",
                          activeScenario === scenario.id
                            ? "bg-indigo-600/20 border-indigo-500/50"
                            : "bg-black/40 border-white/5 hover:bg-white/5"
                      )}
                   >
                       <div className="flex justify-between items-center mb-1">
                           <span className={cn(
                               "text-sm font-bold",
                               activeScenario === scenario.id ? "text-white" : "text-slate-300"
                           )}>{scenario.name}</span>
                           {activeScenario === scenario.id && (
                               <motion.div layoutId="activeInd" className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]" />
                           )}
                       </div>
                       <p className="text-[10px] text-slate-500">{scenario.description}</p>

                       {/* Intensity Bar */}
                       <div className="mt-3 h-1 w-full bg-black/50 rounded-full overflow-hidden">
                           <div
                              className={cn("h-full rounded-full bg-indigo-500/50", activeScenario === scenario.id && "bg-indigo-400")}
                              style={{ width: `${(scenario.impactFactor - 0.5) * 100}%` }}
                            />
                       </div>
                   </motion.button>
               ))}
           </div>

           <button
              onClick={runSimulation}
              disabled={isSimulating}
              className="w-full py-4 mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 transition-all"
           >
               <Play size={14} fill="currentColor" />
               {isSimulating ? premiumLocales.modeling.actions.calculating : premiumLocales.modeling.actions.run}
           </button>
        </div>

        {/* Chart Area */}
        <div className="lg:col-span-2 bg-black/40 border border-white/5 rounded-2xl p-6 min-h-[400px] flex flex-col relative">
            {isSimulating && (
                <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm flex items-center justify-center flex-col gap-4 rounded-2xl">
                    <RefreshCw size={32} className="text-indigo-400 animate-spin" />
                    <span className="text-xs font-black text-indigo-400 uppercase tracking-widest animate-pulse">ШІ Обробка...</span>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <TrendingUp size={16} className="text-indigo-400" />
                        {premiumLocales.modeling.chart.title}
                    </h3>
                    <p className="text-[10px] text-slate-500">{premiumLocales.modeling.chart.simulationLabel}</p>
                </div>
                <div className="flex gap-4 text-[10px] font-bold">
                    <div className="flex items-center gap-2 text-slate-400">
                        <div className="w-2 h-2 rounded-full bg-slate-600" />
                        {premiumLocales.modeling.chart.historical}
                    </div>
                    <div className="flex items-center gap-2 text-indigo-400">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        {premiumLocales.modeling.chart.forecast}
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="simGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="rgba(148, 163, 184, 0.3)" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="rgba(148, 163, 184, 0.3)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            itemStyle={{ color: '#fff', fontSize: '12px' }}
                            labelStyle={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#475569"
                            strokeWidth={2}
                            fill="transparent"
                            strokeDasharray="5 5"
                        />
                        <Area
                            type="monotone"
                            dataKey="prediction"
                            stroke="#6366f1"
                            strokeWidth={3}
                            fill="url(#simGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Insights Footer */}
            <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-4">
                <div className="text-center">
                    <div className="text-[9px] text-slate-500 uppercase">{premiumLocales.modeling.chart.growth}</div>
                    <div className="text-lg font-black text-emerald-400 flex items-center justify-center gap-1">
                        <ArrowRight size={12} className="-rotate-45" /> +12.5%
                    </div>
                </div>
                <div className="text-center border-l border-white/5 border-r">
                    <div className="text-[9px] text-slate-500 uppercase">{premiumLocales.modeling.chart.riskFactor}</div>
                    <div className="text-lg font-black text-amber-400">{premiumLocales.modeling.chart.riskLevels.medium}</div>
                </div>
                <div className="text-center">
                    <div className="text-[9px] text-slate-500 uppercase">{premiumLocales.modeling.chart.confidence}</div>
                    <div className="text-lg font-black text-indigo-400 flex items-center justify-center gap-1">
                        <Zap size={12} fill="currentColor" /> 89%
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
