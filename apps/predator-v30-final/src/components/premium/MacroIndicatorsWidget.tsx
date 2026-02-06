import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Activity, Percent, Info } from 'lucide-react';
import { premiumLocales } from '../../locales/uk/premium';

interface Indicator {
  id: string;
  name: string;
  value: string;
  change: string;
  type: 'up' | 'down' | 'stable';
}

export const MacroIndicatorsWidget: React.FC<{ persona: string }> = ({ persona }) => {
  const indicators: Indicator[] = [
    { id: '1', name: premiumLocales.macroIndicators.indicators.usd, value: '41.20', change: '+0.15', type: 'up' },
    { id: '2', name: premiumLocales.macroIndicators.indicators.cpi, value: '8.4%', change: '-0.2%', type: 'down' },
    { id: '3', name: premiumLocales.macroIndicators.indicators.brent, value: '$82.40', change: '+1.20', type: 'up' },
    { id: '4', name: premiumLocales.macroIndicators.indicators.lpi, value: '3.8', change: '0.0', type: 'stable' },
  ];

  return (
    <div className="p-6 bg-slate-950/80 border border-white/5 rounded-[32px] backdrop-blur-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/20 text-violet-400">
            <Activity size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">{premiumLocales.macroIndicators.title}</h3>
            <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">{premiumLocales.macroIndicators.subtitle}</p>
          </div>
        </div>
        <button aria-label="More Info" className="p-2 hover:bg-white/5 rounded-lg text-slate-500 transition-colors">
          <Info size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {indicators.map((indicator, i) => (
          <motion.div
            key={indicator.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all"
          >
            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">{indicator.name}</div>
            <div className="flex items-end justify-between">
              <div className="text-lg font-black text-white font-mono">{indicator.value}</div>
              <div className={`flex items-center gap-0.5 text-[10px] font-bold ${
                indicator.type === 'up' ? 'text-emerald-400' :
                indicator.type === 'down' ? 'text-rose-400' : 'text-slate-400'
              }`}>
                {indicator.type === 'up' ? <TrendingUp size={10} /> :
                 indicator.type === 'down' ? <TrendingDown size={10} /> : null}
                {indicator.change}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="text-[9px] text-slate-500 italic">
          {premiumLocales.macroIndicators.footer}
        </div>
      </div>
    </div>
  );
};
