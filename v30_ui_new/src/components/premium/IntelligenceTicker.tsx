import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, Globe, Zap, DollarSign } from 'lucide-react';
import { cn } from '../../utils/cn';
import { premiumLocales } from '../../locales/uk/premium';

const TICKER_ITEMS = [
  { type: 'market', label: 'USD/UAH', value: '41.20', change: '+0.5%', trend: 'up' },
  { type: 'market', label: 'EUR/UAH', value: '45.10', change: '-0.1%', trend: 'down' },
  { type: 'alert', label: premiumLocales.intelligenceTicker.labels.sanctions, text: premiumLocales.intelligenceTicker.items[0].text },
  { type: 'insight', label: premiumLocales.intelligenceTicker.labels.insight, text: premiumLocales.intelligenceTicker.items[1].text },
  { type: 'market', label: 'BRENT', value: '$82.40', change: '+1.2%', trend: 'up' },
  { type: 'alert', label: premiumLocales.intelligenceTicker.labels.customs, text: premiumLocales.intelligenceTicker.items[2].text },
  { type: 'market', label: 'STEEL', value: '$650/t', change: '-2.4%', trend: 'down' },
  { type: 'insight', label: premiumLocales.intelligenceTicker.labels.risk, text: premiumLocales.intelligenceTicker.items[3].text },
];

export const IntelligenceTicker: React.FC = () => {
  return (
    <div className="w-full bg-slate-950 border-y border-white/5 overflow-hidden flex items-center h-10 relative z-20 backdrop-blur-md">
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-slate-950 to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-slate-950 to-transparent z-10" />

      <div className="flex items-center gap-2 px-4 bg-amber-500/10 h-full border-r border-amber-500/20 z-20 shrink-0">
        <Zap size={14} className="text-amber-400 animate-pulse" />
        <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">{premiumLocales.intelligenceTicker.live}</span>
      </div>

      <div className="flex overflow-hidden w-full">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 25,
              ease: "linear",
            },
          }}
          className="flex items-center gap-8 whitespace-nowrap pl-4"
        >
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs font-mono">
              {item.type === 'market' && (
                <>
                  <span className="text-slate-500">{item.label}</span>
                  <span className="text-white font-bold">{item.value}</span>
                  <span className={cn(
                    "flex items-center",
                    item.trend === 'up' ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {item.change}
                    {item.trend === 'up' ? <TrendingUp size={12} className="ml-1" /> : <TrendingDown size={12} className="ml-1" />}
                  </span>
                </>
              )}
              {item.type === 'alert' && (
                <>
                   <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px] border border-rose-500/30 flex items-center gap-1">
                     <AlertTriangle size={10} /> {item.label}
                   </span>
                   <span className="text-slate-300">{item.text}</span>
                </>
              )}
              {item.type === 'insight' && (
                <>
                   <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-bold text-[10px] border border-indigo-500/30 flex items-center gap-1">
                     <Globe size={10} /> {item.label}
                   </span>
                   <span className="text-slate-300">{item.text}</span>
                </>
              )}
               <span className="text-slate-800 mx-2">|</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
