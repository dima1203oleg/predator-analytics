import { Button } from '@/components/ui/button';
import React from 'react';
import { useUiStore } from '../../core/state/ui.store';
import { motion, AnimatePresence } from 'framer-motion';

export const AiWorkspace: React.FC = () => {
  const isAiWorkspaceOpen = useUiStore((state) => state.isAiWorkspaceOpen);
  const toggleAiWorkspace = useUiStore((state) => state.toggleAiWorkspace);

  return (
    <>
      <Button variant="cyber" 
        onClick={toggleAiWorkspace}
        className="absolute top-16 right-4 w-10 h-10 bg-black/60 backdrop-blur-md border border-gray-700 rounded-full flex items-center justify-center text-teal-400 hover:bg-teal-900/30 transition-colors pointer-events-auto z-50 shadow-[0_0_15px_rgba(45,212,191,0.2)]"
      >
        AI
      </Button>

      <AnimatePresence>
        {isAiWorkspaceOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute right-0 top-12 bottom-10 w-80 bg-black/40 backdrop-blur-xl border-l border-gray-800 p-4 flex flex-col pointer-events-auto"
          >
            <h2 className="text-teal-400 font-mono text-sm tracking-widest uppercase mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
              Аналітик
            </h2>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
              <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg">
                <div className="text-red-400 text-xs font-bold uppercase mb-1">Виявлено Ризик (98%)</div>
                <div className="text-sm text-slate-300">
                  Знайдено неочевидний зв'язок 3-го рівня між "TechCorp" та офшорною зоною.
                </div>
              </div>

              <div className="p-3 bg-teal-900/20 border border-teal-900/50 rounded-lg">
                <div className="text-teal-400 text-xs font-bold uppercase mb-1">Рекомендація</div>
                <div className="text-sm text-slate-300">
                  Розгорнути граф для аналізу транзакцій за останні 30 днів.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
