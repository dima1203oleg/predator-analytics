import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useCognitiveStore } from '../../../store/cognitiveStore';

export const ThinkingTimeline = () => {
  const { t } = useTranslation();
  const { currentState } = useCognitiveStore();

  const STEPS = useMemo(() => [
    { id: 'Contemplation', num: '01', title: 'СПОГЛЯДАННЯ', desc: t('hud.step_1_desc') || 'Формулювання задачі' },
    { id: 'Correlation', num: '02', title: 'КОРЕЛЯЦІЯ', desc: t('hud.step_2_desc') || 'Сканування даних' },
    { id: 'Inference', num: '03', title: 'МІРКУВАННЯ', desc: t('hud.step_3_desc') || 'Побудова варіантів' },
    { id: 'Validation', num: '04', title: 'ВАЛІДАЦІЯ', desc: t('hud.step_4_desc') || 'Відсікання гіпотез' },
    { id: 'Discovery', num: '05', title: 'ВІДКРИТТЯ', desc: t('hud.step_5_desc') || 'Крос-перевірка' },
    { id: 'Prediction', num: '06', title: 'ПРОГНОЗУВАННЯ', desc: t('hud.step_6_desc') || 'Ланцюг висновків' },
    { id: 'Optimization', num: '07', title: 'ОПТИМІЗАЦІЯ', desc: t('hud.step_7_desc') || 'Аналіз наслідків' },
    { id: 'Alert', num: '08', title: 'ТРИВОГА', desc: t('hud.step_8_desc') || 'Вибір моделі' },
    { id: 'Learning', num: '09', title: 'НАВЧАННЯ', desc: t('hud.step_9_desc') || 'Готовність' },
  ], [t]);

  const activeIndex = STEPS.findIndex(s => s.id === currentState);
  const progressPercent = activeIndex >= 0 ? (activeIndex / (STEPS.length - 1)) * 100 : 0;

  return (
    <div className="w-full flex flex-col font-mono relative">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-2 h-2 bg-[#ff007f] shadow-[0_0_10px_#ff007f] animate-pulse" />
        <h3 className="text-[#00ffcc] font-orbitron uppercase tracking-[0.3em] text-[11px] font-bold">
          {t('hud.realtime_reasoning') || 'QUANTUM REASONING MATRIX'}
        </h3>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-[#00ffcc]/50 to-transparent ml-4" />
      </div>
      
      <div className="relative flex justify-between w-full pb-4 px-2">
        {/* Background Track */}
        <div className="absolute top-[38px] left-8 right-8 h-[2px] bg-[#1a2530] z-0 overflow-hidden rounded-full">
          {/* Active Glow Track */}
          <motion.div 
            className="h-full bg-gradient-to-r from-[#7000ff] via-[#00ffcc] to-[#ff007f] shadow-[0_0_15px_#00ffcc]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
        
        {STEPS.map((step, idx) => {
          const isActive = idx === activeIndex;
          const isPast = idx < activeIndex;
          
          return (
            <div key={idx} className="relative z-10 flex flex-col items-center w-24 group">
              <div className="text-[10px] font-orbitron mb-3 text-center h-8 flex flex-col justify-end transition-all duration-300">
                <span className={`font-bold tracking-widest ${isActive ? 'text-[#ff007f] drop-shadow-[0_0_8px_#ff007f] scale-110' : isPast ? 'text-[#00ffcc]' : 'text-slate-600'}`}>
                  {step.title}
                </span>
              </div>
              
              <div className="relative flex items-center justify-center">
                <motion.div 
                  className={`w-4 h-4 rounded-full border-[1.5px] bg-[#050b14] relative z-10 flex items-center justify-center transition-colors duration-300
                    ${isActive ? 'border-[#ff007f] shadow-[0_0_15px_#ff007f]' : isPast ? 'border-[#00ffcc] shadow-[0_0_8px_#00ffcc]' : 'border-slate-700'}
                  `}
                  animate={isActive ? { scale: [1, 1.3, 1], rotate: 180 } : {}}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                >
                  <AnimatePresence>
                    {(isActive || isPast) && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#ff007f]' : 'bg-[#00ffcc]'}`} 
                      />
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Cyber Scanner ring for active step */}
                {isActive && (
                  <motion.div
                    className="absolute w-8 h-8 rounded-full border border-[#00ffcc]/40 border-t-[#00ffcc] z-0"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  />
                )}
              </div>
              
              <div className="text-[9px] font-rajdhani mt-3 text-center h-8 leading-tight tracking-wider transition-all duration-300">
                <span className={isActive ? 'text-white drop-shadow-[0_0_5px_#ffffff]' : isPast ? 'text-slate-400' : 'text-slate-700'}>
                  {step.desc}
                </span>
              </div>
              
              <div className={`text-[9px] font-orbitron mt-1 transition-all ${isActive ? 'text-[#00ffcc] font-bold' : 'text-slate-700'}`}>
                {step.num}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

