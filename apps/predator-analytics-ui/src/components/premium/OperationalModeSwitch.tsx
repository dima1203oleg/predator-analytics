/**
 * OperationalModeSwitch — Тактичний перемикач операційного режиму
 * 
 * Відображає поточний режим (sovereign/vigilance/threat/stealth)
 * з відповідним кольоровим індикатором та дозволяє циклічне перемикання.
 * Інтегрується в header/sidebar основного layout.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, Crosshair, Eye } from 'lucide-react';
import { useTheme, type OperationalMode } from '../../context/ThemeContext';

const MODE_ICONS: Record<OperationalMode, React.FC<{ size?: number; className?: string }>> = {
  sovereign: Shield,
  vigilance: AlertTriangle,
  threat: Crosshair,
  stealth: Eye,
};

const MODE_COLORS: Record<OperationalMode, string> = {
  sovereign: 'from-indigo-500 to-cyan-500',
  vigilance: 'from-amber-500 to-orange-500',
  threat: 'from-red-500 to-rose-600',
  stealth: 'from-emerald-500 to-green-600',
};

const MODE_BORDER: Record<OperationalMode, string> = {
  sovereign: 'border-indigo-500/30 hover:border-indigo-400/60',
  vigilance: 'border-amber-500/30 hover:border-amber-400/60',
  threat: 'border-red-500/30 hover:border-red-400/60',
  stealth: 'border-emerald-500/30 hover:border-emerald-400/60',
};

const MODE_GLOW: Record<OperationalMode, string> = {
  sovereign: 'hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]',
  vigilance: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]',
  threat: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]',
  stealth: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.12)]',
};

const OperationalModeSwitch: React.FC = () => {
  const { mode, cycleMode, modeInfo } = useTheme();
  const Icon = MODE_ICONS[mode];

  return (
    <motion.button
      onClick={cycleMode}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={`
        group flex items-center gap-2.5 px-3 py-2 rounded-lg
        bg-black/40 backdrop-blur-md border
        ${MODE_BORDER[mode]} ${MODE_GLOW[mode]}
        transition-all duration-500 cursor-pointer select-none
      `}
      title="Перемикання операційного режиму"
    >
      {/* Індикатор пульсу */}
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0.3, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`absolute inset-0 rounded-full bg-gradient-to-r ${MODE_COLORS[mode]} blur-sm`}
        />
        <div className={`relative w-6 h-6 rounded-full bg-gradient-to-br ${MODE_COLORS[mode]} flex items-center justify-center shadow-lg`}>
          <Icon size={12} className="text-white" />
        </div>
      </div>

      {/* Текст режиму */}
      <div className="flex flex-col items-start">
        <span className="text-[7px] text-slate-600 uppercase tracking-[0.2em] font-bold leading-none">
          РЕЖИМ
        </span>
        <span className="text-[10px] font-black tracking-[0.15em] text-white/90 leading-none mt-0.5">
          {modeInfo.label}
        </span>
      </div>

      {/* Шеврон */}
      <motion.div
        animate={{ rotate: [0, 180, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="w-3 h-3 border-t border-r border-white/20 rotate-45 ml-1"
      />
    </motion.button>
  );
};

export default OperationalModeSwitch;
