import React, { useState } from 'react';
import { Eye, EyeOff, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSensitiveData } from '../../context/SensitiveDataContext';

export const SensitiveDataToggle: React.FC = () => {
  const { isEnabled, setEnabled, acknowledged, setAcknowledged, isLoading } = useSensitiveData();
  const [showModal, setShowModal] = useState(false);

  const handleToggle = () => {
    if (isEnabled) {
      setEnabled(false);
    } else {
      if (!acknowledged) {
        setShowModal(true);
      } else {
        setEnabled(true);
      }
    }
  };

  const handleConfirm = () => {
    setAcknowledged(true);
    setEnabled(true);
    setShowModal(false);
  };

  return (
    <>
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
          ${isEnabled
            ? 'bg-amber-500/10 text-amber-500 border-amber-500/50 hover:bg-amber-500/20'
            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
          }
        `}
      >
        {isEnabled ? <Eye size={14} /> : <EyeOff size={14} />}
        <span>{isEnabled ? 'Чутливі дані: ВКЛ' : 'Чутливі дані: ВИКЛ'}</span>
      </button>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-slate-900 border border-amber-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-amber-900/20"
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-amber-500/30">
                  <AlertTriangle className="text-amber-500" size={32} />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">Увага: Доступ до чутливих даних</h3>

                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  Ви намагаєтесь увімкнути відображення персональних даних (PII).
                  Ця дія буде <strong>зафіксована в журналі аудиту</strong> з вашим ID та IP-адресою.
                </p>

                <div className="bg-amber-900/20 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-200/80 mb-8 text-left w-full">
                  Я підтверджую, що маю законні підстави для доступу до цієї інформації та несу відповідальність за її нерозголошення.
                </div>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors"
                  >
                    Скасувати
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-amber-600/20"
                  >
                    Підтвердити
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
