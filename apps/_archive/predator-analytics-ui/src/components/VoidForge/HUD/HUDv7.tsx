import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { Wifi, WifiOff, Zap, Activity } from 'lucide-react';
import { ArchitecturePanel } from './ArchitecturePanel';
import { SystemStatePanel } from './SystemStatePanel';
import { DialoguePanel } from './DialoguePanel';
import { ThinkingTimeline } from './ThinkingTimeline';
import { DataStreamPanel } from './DataStreamPanel';
import { ActiveNeuronPanel } from './ActiveNeuronPanel';
import { AgentSwarmPanel } from './AgentSwarmPanel';
import { VoiceControls } from './VoiceControls';
import { useCognitiveStore } from '../../../store/cognitiveStore';
import { useUIStore } from '../../../stores/useUIStore';

export const HUDv7 = () => {
  const { t } = useTranslation();
  const [lang, setLang] = useState(i18n.language || 'uk');
  const startSimulation = useCognitiveStore((s) => s.startSimulation);
  const connectionStatus = useUIStore((s) => s.connectionStatus);
  const currentState = useCognitiveStore((s) => s.currentState);

  useEffect(() => {
    const stop = startSimulation();
    return stop;
  }, [startSimulation]);

  const toggleLanguage = (newLang: string) => {
    setLang(newLang);
    i18n.changeLanguage(newLang);
  };

  const connColor = connectionStatus === 'connected'
    ? 'text-green-400'
    : connectionStatus === 'connecting'
    ? 'text-yellow-400'
    : 'text-red-500';

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col overflow-hidden">
      {/* ANIMATED BACKGROUND PULSE */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(0,229,255,0.04) 0%, transparent 70%)' }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* HEADER */}
      <header className="pointer-events-auto flex items-center justify-between px-3 md:px-6 py-2 md:py-4 bg-white/5 backdrop-blur-2xl border-b border-white/10 flex-shrink-0 shadow-lg">
        <div className="flex items-center gap-2 md:gap-4">
          <motion.div
            className="w-8 h-8 border border-cyan-500/50 rounded-sm bg-cyan-500/10 flex items-center justify-center"
            animate={{ boxShadow: ['0 0 8px rgba(0,229,255,0.3)', '0 0 20px rgba(0,229,255,0.7)', '0 0 8px rgba(0,229,255,0.3)'] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Zap size={14} className="text-cyan-400" />
          </motion.div>
          <div>
            <motion.h1
              className="font-orbitron text-lg font-bold text-cyan-400 tracking-[0.25em] uppercase leading-none"
              animate={{ textShadow: ['0 0 10px rgba(0,229,255,0.4)', '0 0 25px rgba(0,229,255,0.9)', '0 0 10px rgba(0,229,255,0.4)'] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              КОГНІТИВНЕ ЯДРО
            </motion.h1>
            <div className="text-[10px] text-cyan-400/50 tracking-[0.4em] uppercase font-rajdhani mt-0.5">
              СУВЕРЕННА АНАЛІТИЧНА ПЛАТФОРМА
            </div>
          </div>
          <div className="hidden md:block ml-4 pl-4 border-l border-cyan-500/20">
            <div className="text-[10px] text-cyan-400/40 uppercase font-orbitron tracking-wider">Сесія</div>
            <div className="text-sm font-rajdhani font-bold tracking-wider" style={{ color: '#b06aff' }}>КВАНТОВИЙ МОЗОК</div>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-center gap-1">
          <div className="text-[9px] text-cyan-400/40 uppercase tracking-widest font-orbitron">Когнітивний Стан</div>
          <motion.div
            key={currentState}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-orbitron text-sm font-bold tracking-[0.2em] uppercase"
            style={{ color: '#ffb700', textShadow: '0 0 12px rgba(255,183,0,0.6)' }}
          >
            {currentState}
          </motion.div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className={`flex items-center gap-1.5 text-[10px] md:text-xs font-rajdhani ${connColor}`}>
            {connectionStatus === 'disconnected' ? <WifiOff size={13} /> : <Wifi size={13} />}
            <span className="uppercase tracking-wider hidden md:inline">{connectionStatus === 'connected' ? 'ПІДКЛЮЧЕНО' : connectionStatus === 'connecting' ? 'З\'ЄДНАННЯ' : 'ВІДКЛЮЧЕНО'}</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5">
            <Activity size={13} className="text-cyan-400/50" />
            <span className="text-cyan-400/70 text-xs font-orbitron">
              NVIDIA<span className="text-cyan-400 ml-1">ОНЛАЙН</span>
            </span>
          </div>
          <div className="h-4 w-px bg-cyan-500/20" />
          <div className="flex items-center">
            <span className="text-[10px] font-orbitron text-cyan-400/50 uppercase tracking-widest">УКР</span>
          </div>
        </div>
      </header>

      {/* LEFT PANEL */}
      <motion.aside
        className="pointer-events-auto absolute left-6 top-24 bottom-32 md:bottom-6 flex-col w-[300px] bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden hidden md:flex"
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex-1 overflow-y-auto p-4 gap-4 flex flex-col custom-scrollbar">
          <ArchitecturePanel />
          <AgentSwarmPanel />
        </div>
      </motion.aside>

      {/* RIGHT PANEL */}
      <motion.aside
        className="pointer-events-auto absolute right-6 top-24 bottom-32 md:bottom-6 flex-col w-[300px] bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden hidden xl:flex"
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
          <DataStreamPanel />
          <SystemStatePanel />
        </div>
      </motion.aside>

      {/* CENTER BOTTOM / DIALOGUE PANEL */}
      <motion.footer
        className="pointer-events-auto absolute left-1/2 -translate-x-1/2 bottom-2 md:bottom-8 w-[95%] md:w-[760px] flex flex-col bg-slate-900/50 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl md:rounded-3xl overflow-hidden"
        initial={{ y: 300, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="px-6 pt-4 pb-2 border-b border-white/10 bg-white/5">
          <ThinkingTimeline />
        </div>
        <div className="px-6 py-4">
          <DialoguePanel />
        </div>
      </motion.footer>

      {/* ACTIVE NEURON PANEL */}
      <ActiveNeuronPanel />
    </div>
  );
};
