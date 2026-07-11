import React from 'react';
import { motion } from 'framer-motion';
import { Box, Target, Activity, DollarSign, Database, TrendingDown, ShieldAlert } from 'lucide-react';
import { cn } from '@/utils/cn';

interface StateMachineVisualizerProps {
  status: 'idle' | 'simulating' | 'completed';
  results?: {
    successRate: number;
    bankruptcyRate: number;
    averageEndLiquidity: number;
  };
}

export const StateMachineVisualizer: React.FC<StateMachineVisualizerProps> = ({ status, results }) => {
  const isSimulating = status === 'simulating';
  const hasResults = status === 'completed' && results;

  // Nodes for the state machine
  const nodes = [
    { id: 'import', label: 'ІМПОРТ/ЗАКУПІВЛЯ', icon: <Database size={24} />, pos: 'top-[10%] left-[20%]', color: 'sky' },
    { id: 'warehouse', label: 'СКЛАД/ОПЕРАЦІЇ', icon: <Box size={24} />, pos: 'top-[40%] left-[50%] -translate-x-1/2', color: 'emerald' },
    { id: 'sales', label: 'ПРОДАЖ/МАРКЕТИНГ', icon: <Target size={24} />, pos: 'top-[10%] right-[20%]', color: 'amber' },
    { id: 'capital', label: 'КАПІТАЛ/ЛІКВІДНІСТЬ', icon: <DollarSign size={24} />, pos: 'bottom-[15%] left-[50%] -translate-x-1/2', color: 'indigo' },
  ];

  return (
    <div className="relative w-full h-full min-h-[400px]">
      {/* Dynamic Background SVG for lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ filter: 'drop-shadow(0 0 8px rgba(14, 165, 233, 0.3))' }}>
        <motion.path
          d="M 25% 15% Q 50% 10% 75% 15% T 50% 45% T 25% 15%"
          fill="transparent"
          stroke={isSimulating ? '#0ea5e9' : '#334155'}
          strokeWidth="2"
          strokeDasharray="4 4"
          animate={{ strokeDashoffset: isSimulating ? [0, -100] : 0 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        <motion.path
          d="M 50% 45% L 50% 85%"
          fill="transparent"
          stroke={isSimulating ? '#10b981' : '#334155'}
          strokeWidth="3"
          strokeDasharray="6 6"
          animate={{ strokeDashoffset: isSimulating ? [0, -100] : 0 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      </svg>

      {/* Nodes */}
      {nodes.map((node) => (
        <motion.div
          key={node.id}
          className={cn(
            "absolute flex flex-col items-center justify-center gap-2",
            node.pos
          )}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          <motion.div
            className={cn(
              "p-4 rounded-2xl border-2 flex items-center justify-center shadow-lg relative",
              isSimulating ? `bg-${node.color}-500/20 border-${node.color}-500 text-${node.color}-400` : "bg-slate-900 border-slate-700 text-slate-500",
              hasResults && "bg-slate-800 border-slate-600 text-slate-300"
            )}
            animate={isSimulating ? {
              boxShadow: [`0 0 0px rgba(0,0,0,0)`, `0 0 30px var(--tw-shadow-color)`, `0 0 0px rgba(0,0,0,0)`]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              // @ts-ignore
              '--tw-shadow-color': node.color === 'sky' ? '#0ea5e9' : node.color === 'emerald' ? '#10b981' : node.color === 'amber' ? '#f59e0b' : '#6366f1'
            }}
          >
            {isSimulating && (
              <motion.div 
                className={cn("absolute inset-0 rounded-2xl border-2 border-transparent", `bg-${node.color}-500/30`)}
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
            {node.icon}
          </motion.div>
          <span className="text-[10px] font-black tracking-widest uppercase text-slate-400 bg-black/60 px-2 py-1 rounded">
            {node.label}
          </span>
        </motion.div>
      ))}

      {/* Results Overlay */}
      {hasResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/40 backdrop-blur-sm z-10"
        >
          <div className="bg-black/80 border border-slate-700 p-8 rounded-3xl flex flex-col items-center gap-6 shadow-2xl backdrop-blur-md pointer-events-auto">
            <h3 className="text-xl font-black italic tracking-widest text-white uppercase">РЕЗУЛЬТАТ СИМУЛЯЦІЇ (10,000 ЦИКЛІВ)</h3>
            
            <div className="grid grid-cols-3 gap-6">
               <div className="flex flex-col items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl min-w-[150px]">
                 <Activity className="text-emerald-500 mb-2" size={28} />
                 <span className="text-[10px] font-mono text-emerald-500/70 tracking-widest">УСПІХ (ПРОФІТ)</span>
                 <span className="text-3xl font-black text-emerald-400">{results.successRate.toFixed(1)}%</span>
               </div>
               
               <div className="flex flex-col items-center gap-2 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl min-w-[150px]">
                 <TrendingDown className="text-rose-500 mb-2" size={28} />
                 <span className="text-[10px] font-mono text-rose-500/70 tracking-widest">БАНКРУТСТВО</span>
                 <span className="text-3xl font-black text-rose-400">{results.bankruptcyRate.toFixed(1)}%</span>
               </div>
               
               <div className="flex flex-col items-center gap-2 p-4 bg-sky-500/10 border border-sky-500/30 rounded-2xl min-w-[150px]">
                 <DollarSign className="text-sky-500 mb-2" size={28} />
                 <span className="text-[10px] font-mono text-sky-500/70 tracking-widest">СЕРЕДНІЙ БАЛАНС</span>
                 <span className="text-2xl font-black text-sky-400 font-mono">${(results.averageEndLiquidity / 1000).toFixed(1)}k</span>
               </div>
            </div>

            {results.bankruptcyRate > 15 && (
              <div className="w-full p-4 mt-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-4 text-amber-400">
                <ShieldAlert size={24} className="shrink-0" />
                <p className="text-xs font-bold leading-relaxed">
                  УВАГА: Ризик касового розриву перевищує безпечний рівень (15%). 
                  Рекомендується переглянути політику закупівель або залучити додаткове фінансування.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};
