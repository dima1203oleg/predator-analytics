import React, { useState, useMemo } from 'react';
import ReactECharts from '@/components/ECharts';
import { TrendingUp, Play, RefreshCw, Settings, Zap } from 'lucide-react';
import { cn } from '../../utils/cn';
import { premiumLocales } from '../../locales/uk/premium';

export const PredictiveModelingWidget: React.FC<{ persona: string }> = ({ persona }) => {
  const [taxRate, setTaxRate] = useState(20);
  const [isSimulating, setIsSimulating] = useState(false);

  const chartOption = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['Січ', 'Лют', 'Бер', 'Квіт', 'Трав', 'Черв (ШІ)'],
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
    },
    series: [
      {
        name: premiumLocales.predictiveModeling.historicalData,
        type: 'line',
        data: [120, 132, 101, 134, 90, null],
        smooth: true,
        color: '#6366f1'
      },
      {
        name: premiumLocales.predictiveModeling.aiForecast,
        type: 'line',
        data: [null, null, null, null, 90, 150],
        smooth: true,
        lineStyle: { type: 'dashed' },
        color: '#fbbf24'
      }
    ]
  }), []);

  return (
    <div className="bg-slate-950/80 border border-amber-500/20 rounded-[32px] backdrop-blur-xl overflow-hidden h-full flex flex-col relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="p-8 border-b border-white/5 flex items-center justify-between relative z-10 bg-black/20">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400">
            <TrendingUp size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">{premiumLocales.predictiveModeling.title}</h3>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{premiumLocales.predictiveModeling.subtitle}</p>
          </div>
        </div>
        <button
          onClick={() => setIsSimulating(true)}
          className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all active:scale-95"
          aria-label="Запустити симуляцію"
        >
           {isSimulating ? <RefreshCw className="animate-spin" size={14} /> : <Play size={14} />}
           {premiumLocales.predictiveModeling.runSimulation}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto scrollbar-hide">
        <div className="space-y-8">
           <div className="p-6 bg-white/5 border border-white/5 rounded-[24px]">
              <h4 className="text-[10px] text-slate-500 uppercase font-black mb-6 flex items-center gap-2">
                 <Settings size={14} /> {premiumLocales.predictiveModeling.scenarioParams}
              </h4>
              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between mb-2">
                       <label className="text-xs font-bold text-slate-300">{premiumLocales.predictiveModeling.exciseRate}</label>
                       <span className="text-xs font-black text-amber-500">{taxRate}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseInt(e.target.value))}
                      aria-label="Встановити ставку акцизу"
                      title="Ставка акцизу"
                      className="w-full accent-amber-500"
                    />
                 </div>
                 <div className="p-4 bg-black/40 border border-white/5 rounded-xl">
                    <div className="text-[9px] text-slate-500 uppercase font-black mb-2">{premiumLocales.predictiveModeling.marginImpact}</div>
                    <div className="text-lg font-black text-rose-400">-{taxRate / 2}%</div>
                 </div>
              </div>
           </div>

           <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-[24px]">
              <div className="flex items-center gap-2 mb-3">
                 <Zap size={16} className="text-emerald-500" />
                 <span className="text-[10px] font-black text-emerald-400 uppercase">{premiumLocales.predictiveModeling.aiTip}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                "{premiumLocales.predictiveModeling.aiAdvice}"
              </p>
           </div>
        </div>

        <div className="space-y-6">
           <div className="p-6 bg-white/5 border border-white/5 rounded-[24px] h-[300px]">
              <div className="flex justify-between items-center mb-4">
                 <h4 className="text-[10px] text-slate-500 uppercase font-black">{premiumLocales.predictiveModeling.forecastModel}</h4>
                 <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                       <div className="w-2 h-2 rounded-full bg-indigo-500" />
                       <span className="text-[8px] text-slate-600 font-bold uppercase">{premiumLocales.predictiveModeling.historicalData}</span>
                    </div>
                    <div className="flex items-center gap-1">
                       <div className="w-2 h-2 rounded-full bg-amber-500" />
                       <span className="text-[8px] text-slate-600 font-bold uppercase">{premiumLocales.predictiveModeling.aiForecast}</span>
                    </div>
                 </div>
              </div>
              <div className="h-full pb-8">
                <ReactECharts option={chartOption} className="w-full h-full" theme="dark" />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 border border-emerald-500/20 rounded-2xl">
                 <div className="text-[8px] text-slate-500 uppercase font-black">{premiumLocales.predictiveModeling.aiConfidence}</div>
                 <div className="text-xl font-black text-white font-mono">94%</div>
              </div>
              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                 <div className="text-[8px] text-slate-500 uppercase font-black">{premiumLocales.predictiveModeling.scenario}</div>
                 <div className="text-xl font-black text-white uppercase">{premiumLocales.predictiveModeling.aggressive}</div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
