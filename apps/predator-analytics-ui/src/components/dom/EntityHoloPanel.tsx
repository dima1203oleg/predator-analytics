import React from 'react';
import { useGraphStore } from '../../core/state/graph.store';
import { HoloCard } from '../ui/HoloCard';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, TrendingUp, DollarSign, Fingerprint, Network } from 'lucide-react';

export const EntityHoloPanel: React.FC = () => {
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId);
  const nodes = useGraphStore((state) => state.nodes);
  
  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;

  return (
    <AnimatePresence>
      {selectedNode && (
        <motion.div
          initial={{ x: '100%', opacity: 0, scale: 0.95 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: '100%', opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute right-8 top-28 w-96 z-40 pointer-events-auto"
        >
          <HoloCard variant="cyber" className="p-6 bg-black/80 backdrop-blur-2xl border-rose-500/30">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-4">
              <div>
                <p className="text-[10px] text-rose-500 font-black tracking-widest uppercase mb-1">
                  [ {selectedNode.type || 'Entity'} ]
                </p>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                  {selectedNode.label || selectedNode.id}
                </h2>
              </div>
              <div className="p-2 bg-rose-500/20 rounded-lg border border-rose-500/30">
                <Fingerprint className="text-rose-500" size={24} />
              </div>
            </div>

            {/* Risk Score */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-rose-950/40 to-transparent border-l-2 border-rose-500 rounded-r-xl mb-6">
              <AlertTriangle className="text-rose-500 animate-pulse" size={32} />
              <div>
                <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase mb-1">Risk Score</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-rose-500 leading-none">94</span>
                  <span className="text-xs text-rose-500/70 font-mono font-bold mb-1">/ 100</span>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-black/60 border border-white/5 rounded-xl">
                <DollarSign className="text-emerald-500 mb-2" size={16} />
                <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase mb-1">Total Volume</p>
                <p className="text-lg font-mono font-black text-emerald-400">$12.4M</p>
              </div>
              <div className="p-4 bg-black/60 border border-white/5 rounded-xl">
                <Network className="text-teal-500 mb-2" size={16} />
                <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase mb-1">Connections</p>
                <p className="text-lg font-mono font-black text-teal-400">
                  {(selectedNode as any).degree || Math.floor(Math.random() * 20) + 1}
                </p>
              </div>
            </div>

            {/* AI Insight */}
            <div className="p-4 border border-rose-500/20 bg-rose-950/20 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
              <div className="flex items-center gap-2 mb-2 text-rose-500">
                <TrendingUp size={14} />
                <span className="text-[10px] font-black tracking-widest uppercase">AI Insight</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                Виявлено аномальну активність транзакцій. Патерн збігається з відомими схемами "Транзитного відмивання". Рекомендується глибокий аналіз.
              </p>
            </div>
            
          </HoloCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
