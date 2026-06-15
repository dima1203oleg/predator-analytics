import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SciFiPanel } from './SciFiPanel';

// Живий лічильник з плавною анімацією
const useLiveCounter = (base: number, delta: number, ms: number) => {
  const [val, setVal] = useState(base);
  useEffect(() => {
    const t = setInterval(() => setVal(v => v + Math.floor(Math.random() * delta)), ms);
    return () => clearInterval(t);
  }, [delta, ms]);
  return val;
};

// Генератор «нових» транзакцій для live-стрічки
const COMPANIES = ['ТОВ «ЕНЕРДЖІ ГРУП»','PRIME HOLDING LTD','ЮГ-НАФТА','SIGMA TRADING','CRYSTAL OIL UA','OFFSHORE FIN LTD','MEGA IMPORT LLC'];
const TYPES = ['SWIFT_TRANSFER', 'МИТНА_ДЕК', 'КОНТРАГЕНТ_РИЗИК', 'AML_ALERT', 'OFAC_HIT', 'RНБО_САНКЦІЇ'];
const COLORS = ['text-emerald-400', 'text-yellow-400', 'text-red-500', 'text-orange-400'];

const generateEvent = () => ({
  id: Date.now() + Math.random(),
  company: COMPANIES[Math.floor(Math.random() * COMPANIES.length)],
  type: TYPES[Math.floor(Math.random() * TYPES.length)],
  amount: (Math.random() * 9.9 + 0.1).toFixed(2) + 'M$',
  color: COLORS[Math.floor(Math.random() * COLORS.length)],
  ts: new Date().toLocaleTimeString('uk-UA', { hour12: false }),
});

export const GraphMetricsPanel = () => {
  const nodes = useLiveCounter(142, 2, 7000);
  const edges = useLiveCounter(856, 5, 3000);
  const riskScore = useLiveCounter(8741, 12, 2000);
  const txPerSec = useLiveCounter(47, 3, 800);

  const [events, setEvents] = useState(() => Array.from({ length: 5 }, generateEvent));

  useEffect(() => {
    const t = setInterval(() => {
      setEvents(prev => [generateEvent(), ...prev.slice(0, 7)]);
    }, 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {/* Лічильники верхнього рівня */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'ВУЗЛИ', value: nodes.toLocaleString(), unit: 'компаній', color: 'emerald' },
          { label: "ЗВ'ЯЗКИ", value: edges.toLocaleString(), unit: 'ребер', color: 'emerald' },
          { label: 'SCORE РИЗИКУ', value: riskScore.toLocaleString(), unit: 'pts', color: 'red' },
          { label: 'TX/SEC', value: txPerSec.toString(), unit: 'потік', color: 'yellow' },
        ].map(({ label, value, unit, color }) => (
          <div key={label} className="bg-black/50 border border-emerald-500/10 rounded p-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
            <div className={`text-[8px] font-bold tracking-[0.3em] text-${color === 'red' ? 'red' : color === 'yellow' ? 'yellow' : 'emerald'}-500/50 mb-1`}>{label}</div>
            <div className={`text-base font-black font-mono text-${color === 'red' ? 'red-400' : color === 'yellow' ? 'yellow-400' : 'emerald-300'} tabular-nums leading-none`}>{value}</div>
            <div className="text-[8px] text-slate-600 mt-0.5">{unit}</div>
          </div>
        ))}
      </div>

      {/* Шкали метрик */}
      <div className="space-y-2">
        {[
          { label: 'Qdrant Vector Depth', val: '384-D', pct: 85 },
          { label: 'Semantic Precision', val: '92.4%', pct: 92 },
          { label: 'Neo4j GDS Coverage', val: '78.1%', pct: 78 },
        ].map(({ label, val, pct }) => (
          <div key={label}>
            <div className="flex justify-between mb-1">
              <span className="text-[9px] text-emerald-500/50">{label}</span>
              <span className="text-[9px] text-emerald-400 font-mono">{val}</span>
            </div>
            <div className="w-full bg-black/60 h-[3px] rounded overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Live Event Feed */}
      <div className="mt-1">
        <div className="text-[8px] text-emerald-500/40 font-bold tracking-[0.3em] mb-2 flex items-center gap-2">
          <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
          LIVE EVENT STREAM
        </div>
        <div className="space-y-1 overflow-hidden max-h-[160px]">
          <AnimatePresence initial={false}>
            {events.map(ev => (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-1.5 bg-black/30 border border-emerald-500/5 rounded px-2 py-1"
              >
                <span className={`text-[8px] font-bold font-mono ${ev.color} shrink-0`}>{ev.type}</span>
                <span className="text-[8px] text-slate-400 truncate flex-1">{ev.company}</span>
                <span className="text-[8px] text-yellow-500/70 font-mono shrink-0">{ev.amount}</span>
                <span className="text-[7px] text-slate-600 shrink-0">{ev.ts}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
