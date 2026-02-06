import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { motion } from 'framer-motion';
import { Globe, ArrowRightLeft } from 'lucide-react';
import { cn } from '../../utils/cn';
import { premiumLocales } from '../../locales/uk/premium';

export const TradeSankeyWidget: React.FC<{ persona: string }> = ({ persona }) => {
  const isSovereign = persona === 'SOVEREIGN';
  const color = isSovereign ? '#6366f1' : '#f59e0b'; // Indigo vs Amber

  const option = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#fff' }
    },
    series: [
      {
        type: 'sankey',
        left: 20,
        right: 20,
        top: 20,
        bottom: 20,
        emphasis: { focus: 'adjacency' },
        nodeAlign: 'justify', // justify edges
        draggable: false,
        layoutIterations: 32, // Better layout
        data: [
          // Origins
          { name: premiumLocales.tradeSankey.nodes.china, itemStyle: { color: '#ef4444' } },
          { name: premiumLocales.tradeSankey.nodes.germany, itemStyle: { color: '#eab308' } },
          { name: premiumLocales.tradeSankey.nodes.poland, itemStyle: { color: '#f97316' } },
          { name: premiumLocales.tradeSankey.nodes.usa, itemStyle: { color: '#3b82f6' } },
          { name: premiumLocales.tradeSankey.nodes.turkey, itemStyle: { color: '#14b8a6' } },

          // Categories
          { name: premiumLocales.tradeSankey.categories.electronics, itemStyle: { color: '#8b5cf6' } },
          { name: premiumLocales.tradeSankey.categories.cars, itemStyle: { color: '#06b6d4' } },
          { name: premiumLocales.tradeSankey.categories.textile, itemStyle: { color: '#d946ef' } },
          { name: premiumLocales.tradeSankey.categories.energy, itemStyle: { color: '#f43f5e' } },

          // Destination
          { name: premiumLocales.tradeSankey.nodes.ukraine, itemStyle: { color: '#22c55e' } }
        ],
        links: [
          { source: premiumLocales.tradeSankey.nodes.china, target: premiumLocales.tradeSankey.categories.electronics, value: 80 },
          { source: premiumLocales.tradeSankey.nodes.china, target: premiumLocales.tradeSankey.categories.textile, value: 30 },
          { source: premiumLocales.tradeSankey.nodes.germany, target: premiumLocales.tradeSankey.categories.cars, value: 60 },
          { source: premiumLocales.tradeSankey.nodes.germany, target: premiumLocales.tradeSankey.categories.electronics, value: 20 },
          { source: premiumLocales.tradeSankey.nodes.poland, target: premiumLocales.tradeSankey.categories.energy, value: 40 },
          { source: premiumLocales.tradeSankey.nodes.poland, target: premiumLocales.tradeSankey.categories.cars, value: 10 },
          { source: premiumLocales.tradeSankey.nodes.usa, target: premiumLocales.tradeSankey.categories.electronics, value: 30 },
          { source: premiumLocales.tradeSankey.nodes.usa, target: premiumLocales.tradeSankey.categories.energy, value: 50 },
          { source: premiumLocales.tradeSankey.nodes.turkey, target: premiumLocales.tradeSankey.categories.textile, value: 45 },
          { source: premiumLocales.tradeSankey.nodes.turkey, target: premiumLocales.tradeSankey.categories.cars, value: 10 },

          { source: premiumLocales.tradeSankey.categories.electronics, target: premiumLocales.tradeSankey.nodes.ukraine, value: 130 },
          { source: premiumLocales.tradeSankey.categories.cars, target: premiumLocales.tradeSankey.nodes.ukraine, value: 80 },
          { source: premiumLocales.tradeSankey.categories.textile, target: premiumLocales.tradeSankey.nodes.ukraine, value: 75 },
          { source: premiumLocales.tradeSankey.categories.energy, target: premiumLocales.tradeSankey.nodes.ukraine, value: 90 },
        ],
        lineStyle: {
          color: 'gradient',
          curveness: 0.5,
          opacity: 0.3
        },
        label: {
          color: '#cbd5e1',
          fontSize: 10,
          fontWeight: 'bold'
        }
      }
    ]
  }), [color]);

  return (
    <div className="bg-slate-950/80 border border-white/10 rounded-[24px] backdrop-blur-xl overflow-hidden h-full flex flex-col">
      <div className="p-5 border-b border-white/5 flex items-center gap-3">
        <div className={cn("p-2.5 rounded-xl", `bg-${isSovereign ? 'indigo' : 'amber'}-500/20`)}>
          <ArrowRightLeft className={cn(`text-${isSovereign ? 'indigo' : 'amber'}-400`)} size={18} />
        </div>
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wide">{premiumLocales.tradeSankey.title}</h3>
          <p className="text-[9px] text-slate-500 font-mono">{premiumLocales.tradeSankey.subtitle}</p>
        </div>
      </div>

      <div className="flex-1 min-h-[350px] p-2">
        <ReactECharts
          option={option}
          className="w-full h-full"
          theme="dark"
        />
      </div>

      <div className="px-5 py-3 border-t border-white/5 bg-black/20 flex justify-between items-center text-[10px] text-slate-500">
          <span>{premiumLocales.tradeSankey.updatedLive}</span>
          <span className="flex items-center gap-1">
             <Globe size={10} />
             {premiumLocales.tradeSankey.globalNetwork}
          </span>
       </div>
    </div>
  );
};
