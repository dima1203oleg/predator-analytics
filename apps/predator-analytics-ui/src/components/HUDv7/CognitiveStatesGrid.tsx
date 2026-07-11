import { Button } from '@/components/ui/button';
import React from 'react';
import { useCognitiveStore, CognitiveState } from '../../store/cognitiveStore';
import { useTranslation } from 'react-i18next';

const STATES: { id: CognitiveState; key: string; color: string }[] = [
  { id: 'Contemplation', key: 'state_contemplation', color: 'text-cyan-400' },
  { id: 'Correlation', key: 'state_correlation', color: 'text-blue-400' },
  { id: 'Inference', key: 'state_inference', color: 'text-indigo-400' },
  { id: 'Validation', key: 'state_validation', color: 'text-green-400' },
  { id: 'Discovery', key: 'state_discovery', color: 'text-gold-strategic' },
  { id: 'Prediction', key: 'state_prediction', color: 'text-purple-400' },
  { id: 'Optimization', key: 'state_optimization', color: 'text-emerald-400' },
  { id: 'Alert', key: 'state_alert', color: 'text-red-500' },
  { id: 'Learning', key: 'state_learning', color: 'text-pink-400' },
];

export const CognitiveStatesGrid = () => {
  const { currentState, setState } = useCognitiveStore();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col font-mono text-xs w-[320px] h-full border border-cyan-tactical/20 bg-obsidian/60 p-4">
      <h3 className="text-cyan-tactical uppercase tracking-widest mb-1">{t('hud.cognitive_states')}</h3>
      <div className="text-[10px] text-cyan-tactical/50 mb-4">{t('hud.cognitive_states_desc')}</div>
      
      <div className="grid grid-cols-3 gap-3 flex-1 content-center">
        {STATES.map((state) => {
          const isActive = currentState === state.id;
          return (
            <Button variant="cyber"
              key={state.id}
              onClick={() => setState(state.id)}
              className={`flex flex-col items-center justify-center p-2 border transition-all duration-300 ${
                isActive 
                  ? 'border-cyan-tactical bg-cyan-tactical/10 shadow-[0_0_15px_rgba(0,229,255,0.3)] scale-105' 
                  : 'border-cyan-tactical/20 hover:border-cyan-tactical/50 hover:bg-cyan-tactical/5 opacity-60 hover:opacity-100'
              }`}
            >
              {/* Abstract icon placeholder */}
              <div className={`w-8 h-8 rounded-full border mb-2 flex items-center justify-center ${
                isActive ? 'border-cyan-tactical' : 'border-transparent'
              }`}>
                <div className={`w-4 h-4 rounded-full ${isActive ? 'bg-cyan-tactical animate-pulse' : 'bg-current'} ${state.color} opacity-80`} />
              </div>
              <div className="text-[9px] text-center text-white/80">{state.id}</div>
              <div className={`text-[8px] mt-1 text-center ${state.color}`}>{t(`hud.${state.key}`)}</div>
            </Button>
          );
        })}
      </div>
    </div>
  );
};
