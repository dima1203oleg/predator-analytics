import React, { useState } from 'react';
import { Network, Cpu, Database, BrainCircuit, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useCognitiveStore } from '../../../store/cognitiveStore';
import type { CognitiveState } from '../../../store/cognitiveStore';
import { usePredatorStore } from '../../../store/usePredatorStore';

const modules = [
  {
    id: 'void_forge',
    name: 'ФІЗИЧНИЙ РУШІЙ',
    icon: Cpu,
    progress: 100,
    isCore: false,
    color: '#00e5ff',
    cogState: 'Optimization' as CognitiveState,
    desc: 'Фізичний рушій частинок',
  },
  {
    id: 'quantum_mind',
    name: 'КВАНТОВИЙ МОЗОК',
    icon: BrainCircuit,
    progress: 95,
    isCore: true,
    color: '#b06aff',
    cogState: 'Inference' as CognitiveState,
    desc: 'Ядро ШІ-міркувань',
  },
  {
    id: 'knowledge_universe',
    name: 'ВУЗОЛ ЗНАНЬ',
    icon: Database,
    progress: 85,
    isCore: false,
    color: '#00e5ff',
    cogState: 'Correlation' as CognitiveState,
    desc: 'Граф знань та даних',
  },
  {
    id: 'ai_reasoning',
    name: 'ШІ-АНАЛІТИКА',
    icon: Network,
    progress: 92,
    isCore: false,
    color: '#00e5ff',
    cogState: 'Discovery' as CognitiveState,
    desc: 'Ланцюжок логічного аналізу',
  },
  {
    id: 'user',
    name: 'КОРИСТУВАЧ',
    icon: User,
    progress: 100,
    isCore: false,
    color: '#22c55e',
    cogState: 'Validation' as CognitiveState,
    desc: 'Користувацький сеанс',
  },
];

import { useUIStore } from '../../../stores/useUIStore';

export const ArchitecturePanel = () => {
  const { t } = useTranslation();
  const { setState, addEvent } = useCognitiveStore();
  const setCoreState = usePredatorStore((s) => s.setCoreState);
  const showKnowledgeGraph = useUIStore((s) => s.showKnowledgeGraph);
  const setShowKnowledgeGraph = useUIStore((s) => s.setShowKnowledgeGraph);
  const [activeModule, setActiveModule] = useState<string>('quantum_mind');

  const handleClick = (mod: typeof modules[number]) => {
    setActiveModule(mod.id);
    setState(mod.cogState);
    
    // Toggle Knowledge Graph
    if (mod.id === 'knowledge_universe') {
      setShowKnowledgeGraph(!showKnowledgeGraph);
    } else if (showKnowledgeGraph) {
      setShowKnowledgeGraph(false);
    }

    // sync to 3D scene via predator store
    if (mod.id === 'void_forge') {
      setCoreState?.('forging');
    } else if (mod.id === 'quantum_mind') {
      setCoreState?.('processing');
    } else {
      setCoreState?.('idle');
    }
    addEvent(`Модуль активовано: ${mod.name}`, 'success');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col gap-3 text-xs font-mono"
    >
      <div className="mb-2">
        <h3 className="text-white/80 uppercase tracking-widest border-b border-white/10 pb-2 font-orbitron text-[11px] font-medium">
          {t('hud.system_architecture') || 'Архітектура Системи'}
        </h3>
      </div>

      {modules.map((mod, i) => {
        const isActive = activeModule === mod.id;
        return (
          <motion.button
            key={mod.id}
            onClick={() => handleClick(mod)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="relative overflow-hidden flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all w-full group backdrop-blur-md"
            style={{
              borderColor: isActive
                ? mod.color + '40'
                : 'rgba(255, 255, 255, 0.05)',
              background: isActive
                ? mod.color + '0a'
                : 'rgba(255, 255, 255, 0.03)',
              boxShadow: isActive ? `0 4px 20px ${mod.color}15` : 'none',
            }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 + i * 0.07 }}
          >
            {/* Active indicator bar */}
            {isActive && (
              <motion.div
                layoutId="active-module-bar"
                className="absolute left-0 top-0 bottom-0 w-0.5"
                style={{ background: mod.color, boxShadow: `0 0 8px ${mod.color}` }}
              />
            )}

            {/* Icon */}
            <div
              className="w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform"
              style={{
                borderColor: mod.color + '30',
                background: mod.color + '15',
                color: mod.color,
              }}
            >
              <mod.icon size={14} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div
                className="font-bold uppercase tracking-wider font-rajdhani text-sm leading-none mb-0.5 group-hover:animate-pulse"
                style={{
                  color: mod.color,
                  textShadow: isActive ? `0 0 8px ${mod.color}80` : 'none',
                }}
              >
                {mod.name}
              </div>
              <div className="text-[10px] leading-tight text-white/30 truncate">{mod.desc}</div>

              {/* Progress bar */}
              <div className="w-full h-[2px] bg-white/5 mt-1.5 overflow-hidden rounded-full">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${mod.progress}%` }}
                  transition={{ duration: 1.2, delay: 0.3 + i * 0.1 }}
                  style={{ background: mod.color, boxShadow: `0 0 4px ${mod.color}` }}
                  className="h-full"
                />
              </div>
            </div>

            {/* Progress value */}
            <div
              className="font-orbitron text-[11px] font-bold flex-shrink-0"
              style={{ color: mod.color + 'cc' }}
            >
              {mod.progress}%
            </div>
          </motion.button>
        );
      })}

      {/* Quick commands */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="mt-4 border-t border-white/5 pt-4"
      >
        <div className="text-[10px] text-white/40 uppercase tracking-widest font-orbitron mb-3 font-medium">Швидкі Команди</div>
        <div className="flex flex-col gap-1.5">
          {[
            { label: 'Скинути фізику', action: () => addEvent('Фізику скинуто', 'warning') },
            { label: 'Ін\u02bcєкція даних', action: () => addEvent('Ін\u02bcєкцію запущено', 'info') },
            { label: 'Аварійна зупинка', action: () => addEvent('СТОП — аварійна зупинка', 'error') },
          ].map((cmd, i) => (
            <motion.button
              key={cmd.label}
              onClick={cmd.action}
              whileHover={{ x: 5, color: '#ffffff', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              className="text-left text-[11px] text-white/50 font-rajdhani tracking-wide px-3 py-1.5 rounded-lg border border-transparent hover:border-white/10 transition-colors"
            >
              › {cmd.label}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};
