import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// We will map over translations inside the component

export const ThinkingTimeline = () => {
  const { t } = useTranslation();

  const STEPS = [
    { num: 1, title: t('hud.step_1'), desc: t('hud.step_1_desc'), time: '00:00:00', active: false },
    { num: 2, title: t('hud.step_2'), desc: t('hud.step_2_desc'), time: '00:00:01', active: false },
    { num: 3, title: t('hud.step_3'), desc: t('hud.step_3_desc'), time: '00:00:03', active: false },
    { num: 4, title: t('hud.step_4'), desc: t('hud.step_4_desc'), time: '00:00:08', active: false },
    { num: 5, title: t('hud.step_5'), desc: t('hud.step_5_desc'), time: '00:00:12', active: false },
    { num: 6, title: t('hud.step_6'), desc: t('hud.step_6_desc'), time: '00:00:18', active: true },
    { num: 7, title: t('hud.step_7'), desc: t('hud.step_7_desc'), time: '00:00:29', active: false },
    { num: 8, title: t('hud.step_8'), desc: t('hud.step_8_desc'), time: '00:00:29', active: false },
    { num: 9, title: t('hud.step_9'), desc: t('hud.step_9_desc'), time: '00:00:31', active: false },
  ];

  return (
    <div className="w-full flex flex-col font-mono">
      <h3 className="text-cyan-tactical uppercase tracking-widest text-xs border-b border-cyan-tactical/30 pb-1 mb-4 w-[300px]">{t('hud.realtime_reasoning')}</h3>
      
      <div className="relative flex justify-between w-full mt-4 pb-6">
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-cyan-tactical/20 -translate-y-1/2 z-0" />
        
        {STEPS.map((step, idx) => (
          <div key={idx} className={`relative z-10 flex flex-col items-center w-32 ${step.active ? 'opacity-100' : 'opacity-40'}`}>
            <div className={`text-[10px] mb-2 text-center h-8 flex flex-col justify-end ${step.active ? 'text-gold-strategic' : 'text-cyan-tactical'}`}>
              <div className="font-bold whitespace-nowrap"><span className="mr-1">{step.num}</span> {step.title}</div>
            </div>
            
            <motion.div 
              className={`w-3 h-3 rounded-full border-2 bg-obsidian relative flex items-center justify-center ${step.active ? 'border-gold-strategic shadow-[0_0_10px_rgba(255,193,7,0.8)]' : 'border-cyan-tactical'}`}
              animate={step.active ? { scale: [1, 1.3, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              {step.active && <div className="w-1 h-1 bg-gold-strategic rounded-full" />}
            </motion.div>
            
            <div className="text-[9px] text-cyan-tactical/60 mt-2 text-center h-8 leading-tight">
              {step.desc}
            </div>
            <div className="text-[10px] text-cyan-tactical/40 mt-1">
              {step.time}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
