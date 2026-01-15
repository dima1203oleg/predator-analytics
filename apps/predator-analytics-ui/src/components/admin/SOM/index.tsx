import React from 'react';
import { SOMDashboard } from '../../constitutional/SOMDashboard';
import { TruthLedgerSection } from '../../TruthLedgerSection';
import { motion } from 'framer-motion';

export const SOMAdmin: React.FC = () => {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-900/40 to-blue-900/40 border border-blue-500/20 p-8 rounded-3xl"
      >
        <div className="text-blue-400 text-xs font-black uppercase tracking-[0.3em] mb-2">Architectural Hypervisor</div>
        <h1 className="text-4xl font-black text-white tracking-tighter mb-4">
          PREDATOR v29 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">SOM</span>
        </h1>
        <p className="text-slate-400 max-w-2xl leading-relaxed font-medium">
          Модуль Суверенного Спостерігача (SOM) забезпечує конституційну цілісність системи Predator.
          Він відстежує аномалії, керує екстреними протоколами та веде незмінний Truth Ledger для повного аудиту дій ШІ.
        </p>
      </motion.div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white px-2 flex items-center gap-3">
          <span className="w-2 h-8 bg-blue-500 rounded-full" />
          Контрольна Панель SOM
        </h2>
        <SOMDashboard />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white px-2 flex items-center gap-3">
          <span className="w-2 h-8 bg-cyan-500 rounded-full" />
          Truth Ledger (Immutable Evidence)
        </h2>
        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-md">
          <TruthLedgerSection />
        </div>
      </section>
    </div>
  );
};

export default SOMAdmin;
