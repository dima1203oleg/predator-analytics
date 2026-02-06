
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Case } from './CaseCard';

interface CaseDetailModalProps {
  selectedCase: Case | null;
  onClose: () => void;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  selectedCase,
  onClose
}) => {
  return (
    <AnimatePresence>
      {selectedCase && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-white mb-4">
              {selectedCase.title}
            </h2>
            <p className="text-slate-400 mb-6">
              {selectedCase.situation}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all"
            >
              Закрити
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
