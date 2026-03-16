import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Activity, AlertCircle, Info } from 'lucide-react';
import ReactECharts from '@/components/ECharts';
import * as echarts from 'echarts';
import { cn } from '../../utils/cn';
import { premiumLocales } from '../../locales/uk/premium';

interface Commodity {
  name: string;
  code: string;
  price: string;
  change: string;
  forecast: string;
  trend: 'up' | 'down';
  confidence: number;
}

export const CommodityPricePredictor: React.FC<{ persona: string }> = ({ persona }) => {
  const commodities: Commodity[] = [
    { name: premiumLocales.commodityPredictor.commodities.copper, code: 'HG1', price: '$8,420', change: '+1.2%', forecast: '$9,100', trend: 'up', confidence: 92 },
    { name: premiumLocales.commodityPredictor.commodities.lithium, code: 'LI2', price: '$13,500', change: '-4.3%', forecast: '$11,200', trend: 'down', confidence: 85 },
    { name: premiumLocales.commodityPredictor.commodities.oil, code: 'BZ1', price: '$82.40', change: '+0.8%', forecast: '$88.50', trend: 'up', confidence: 78 },
  ];

  const chartOption = useMemo(() => ({
    backgroundColor: 'transparent',
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: premiumLocales.commodityPredictor.monthsWithAi,
      axisLine: { lineStyle: { color: '#475569' } },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
    },
    series: [
      {
        data: [120, 132, 101, 134, 90, 230],
        type: 'line',
        smooth: true,
        color: '#fbbf24',
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(251, 191, 36, 0.3)' },
            { offset: 1, color: 'transparent' },
          ]),
        },
        markPoint: {
          data: [{ type: 'max', name: premiumLocales.commodityPredictor.forecast, value: 230, coord: [5, 230] }],
          itemStyle: { color: '#fbbf24' },
          label: {
            show: true,
            formatter: premiumLocales.commodityPredictor.forecast,
            position: 'top',
            color: '#fbbf24',
            fontWeight: 'bold',
          },
        },
      },
    ],
  }), []);

  return (
    <div className="bg-slate-950/80 border border-white/5 rounded-[32px] backdrop-blur-xl overflow-hidden h-full flex flex-col relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="p-8 border-b border-white/5 flex items-center justify-between relative z-10 bg-black/20">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400">
            <TrendingUp size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">{premiumLocales.commodityPredictor.title}</h3>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{premiumLocales.commodityPredictor.subtitle}</p>
          </div>
        </div>
        <button aria-label="Більше інформації" title="Більше інформації" className="p-2 hover:bg-white/5 rounded-xl text-slate-500 transition-colors">
          <Info size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto scrollbar-hide">
        <div className="space-y-6">
          <div className="p-6 bg-white/5 border border-white/5 rounded-[24px]">
             <h4 className="text-[10px] text-slate-500 uppercase font-black mb-6">{premiumLocales.commodityPredictor.watchlist}</h4>
             <div className="space-y-4">
                {commodities.map((item, i) => (
                  <motion.div
                    key={item.code}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5 hover:border-amber-500/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                       <div className={cn(
                         "p-2 rounded-lg",
                         item.trend === 'up' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                       )}>
                         {item.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                       </div>
                       <div>
                         <div className="text-xs font-black text-white">{item.name}</div>
                         <div className="text-[9px] text-slate-500 font-mono">{item.code}</div>
                       </div>
                    </div>
                    <div className="text-right">
                       <div className="text-sm font-black text-white font-mono">{item.price}</div>
                       <div className={cn("text-[9px] font-bold", item.trend === 'up' ? "text-emerald-400" : "text-rose-400")}>
                          {item.change}
                       </div>
                    </div>
                  </motion.div>
                ))}
             </div>
          </div>

          <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-[24px]">
             <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={16} className="text-amber-500" />
                <span className="text-[10px] font-black text-amber-500 uppercase">{premiumLocales.commodityPredictor.tip}</span>
             </div>
             <p className="text-xs text-slate-300 leading-relaxed italic">
                "{premiumLocales.commodityPredictor.advice}"
             </p>
          </div>
        </div>

        <div className="space-y-6">
           <div className="p-6 bg-white/5 border border-white/5 rounded-[24px] h-[300px]">
              <div className="flex justify-between items-center mb-4">
                 <h4 className="text-[10px] text-slate-500 uppercase font-black">{premiumLocales.commodityPredictor.modelTitle}: {premiumLocales.commodityPredictor.commodities.copper.split(' ')[0]}</h4>
                 <span className="text-[10px] font-bold text-emerald-400 uppercase">{premiumLocales.commodityPredictor.confidence}: 92%</span>
              </div>
              <div className="h-full pb-8">
              <ReactECharts option={chartOption} className="w-full h-full" theme="dark" />
            </div>
           </div>

           <button className="w-full py-5 bg-amber-500 text-black font-black rounded-3xl text-xs uppercase tracking-widest hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20 active:scale-95">
              {premiumLocales.commodityPredictor.activateHedging}
           </button>
        </div>
      </div>
    </div>
  );
};
