import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCognitiveStore } from '../../../store/cognitiveStore';
import { ShieldAlert, Crosshair, MapPin } from 'lucide-react';

export const ActiveNeuronPanel = () => {
  const activeNeuron = useCognitiveStore((s) => s.activeNeuron);

  return (
    <AnimatePresence>
      {activeNeuron && (
        <motion.div
          className="absolute top-24 right-[340px] w-[300px] bg-slate-900/60 backdrop-blur-2xl border border-cyan-500/30 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(0,229,255,0.15)] hidden xl:flex flex-col z-20 pointer-events-auto"
          initial={{ opacity: 0, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <div className="px-4 py-3 border-b border-cyan-500/20 bg-cyan-500/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crosshair size={16} className="text-cyan-400" />
              <h3 className="font-orbitron text-xs font-bold text-cyan-400 tracking-wider">
                АНАЛІТИЧНИЙ ВУЗОЛ
              </h3>
            </div>
            <span className="font-mono text-[10px] text-cyan-400/60">
              {activeNeuron.id}
            </span>
          </div>
          
          <div className="p-4 flex flex-col gap-3">
            <div>
              <div className="text-[10px] font-orbitron text-cyan-400/40 uppercase mb-1">Тип загрози</div>
              <div className="font-rajdhani text-sm text-white font-medium flex items-center gap-2">
                <ShieldAlert size={14} className={activeNeuron.riskScore > 75 ? 'text-red-400' : 'text-yellow-400'} />
                {activeNeuron.type}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-orbitron text-cyan-400/40 uppercase mb-1">Рівень ризику</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full ${activeNeuron.riskScore > 75 ? 'bg-red-500' : 'bg-yellow-500'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${activeNeuron.riskScore}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </div>
                <span className="font-mono text-xs font-bold text-white">
                  {activeNeuron.riskScore}
                </span>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-orbitron text-cyan-400/40 uppercase mb-1">Координати (Вектор)</div>
              <div className="font-mono text-[10px] text-cyan-400/70 bg-black/30 p-2 rounded flex items-center gap-2">
                <MapPin size={12} />
                <span>
                  X:{activeNeuron.position[0].toFixed(2)} Y:{activeNeuron.position[1].toFixed(2)} Z:{activeNeuron.position[2].toFixed(2)}
                </span>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-orbitron text-cyan-400/40 uppercase mb-1">Деталі аномалії</div>
              <p className="font-rajdhani text-xs text-white/70 leading-relaxed">
                {activeNeuron.details}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
