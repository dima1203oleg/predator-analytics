import React from 'react';
import { useLocation } from 'react-router-dom';
import { ScenarioSimulationEngine } from '../features/modeling/ScenarioSimulationEngine';
import { SyntheticDataStudio } from '../features/modeling/SyntheticDataStudio';
import { motion, AnimatePresence } from 'framer-motion';

const ModelingHub: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'simulation';

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950">
      <AnimatePresence mode="wait">
        {activeTab === 'simulation' && (
          <motion.div
            key="simulation"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <ScenarioSimulationEngine />
          </motion.div>
        )}

        {activeTab === 'synthetic_data' && (
          <motion.div
            key="synthetic_data"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <SyntheticDataStudio />
          </motion.div>
        )}
        
        {/* Placeholder for other modeling tabs */}
        {activeTab !== 'simulation' && activeTab !== 'synthetic_data' && (
          <motion.div
            key="other"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center h-full text-slate-500 font-light"
          >
            Модуль "{activeTab}" знаходиться у розробці...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModelingHub;
