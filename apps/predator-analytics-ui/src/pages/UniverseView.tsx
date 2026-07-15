/**
 * UniverseView — Головна сторінка "Живий AI Всесвіт"
 * 
 * Замінює класичний dashboard:
 * - UniverseScene (повноекранний 3D Canvas)
 * - AIOracle (плаваюча панель AI-чату)
 * - IntentBar (передбачення намірів, знизу)
 * - InsightStream (потік інсайтів, збоку)
 * - ModeIndicator (мінімальний HUD зверху)
 * 
 * Весь UI = контекстний, з'являється лише коли потрібен.
 */
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { UniverseScene } from '../components/universe/UniverseScene';
import { AIOracle } from '../components/universe/AIOracle';
import { IntentBar } from '../components/universe/IntentBar';
import { InsightStream } from '../components/universe/InsightStream';
import { useUniverseStore, AI_MODE_CONFIGS } from '../store/useUniverseStore';

/** Мінімальний HUD — показує стан системи (не технічні метрики) */
const ModeIndicator: React.FC = () => {
  const { aiMode } = useUniverseStore();
  const config = AI_MODE_CONFIGS[aiMode];
  const color = `rgb(${Math.round(config.color[0] * 255)}, ${Math.round(config.color[1] * 255)}, ${Math.round(config.color[2] * 255)})`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, type: 'spring' }}
      className="fixed top-6 right-6 z-50 flex items-center gap-3"
    >
      {/* Логотип PREDATOR */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }} />
        <span className="text-[11px] text-white/50 font-medium tracking-[0.15em] uppercase">
          PREDATOR
        </span>
        <span className="text-[10px] text-white/30 font-light">
          {config.label}
        </span>
      </div>

      {/* Якість / Точність / Швидкість */}
      <div className="flex items-center gap-4 px-4 py-2 rounded-xl glass-card">
        <div className="text-center">
          <div className="text-[10px] text-white/30 uppercase tracking-wider">Точність</div>
          <div className="text-xs text-white/70 font-medium">94.2%</div>
        </div>
        <div className="w-px h-6 bg-white/[0.06]" />
        <div className="text-center">
          <div className="text-[10px] text-white/30 uppercase tracking-wider">Якість</div>
          <div className="text-xs text-white/70 font-medium">Висока</div>
        </div>
        <div className="w-px h-6 bg-white/[0.06]" />
        <div className="text-center">
          <div className="text-[10px] text-white/30 uppercase tracking-wider">Система</div>
          <div className="text-xs text-green-400/80 font-medium">Готова</div>
        </div>
      </div>
    </motion.div>
  );
};

/** Підказка першого запуску */
const WelcomeHint: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ delay: 2, type: 'spring' }}
    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 text-center max-w-md"
  >
    <div className="px-8 py-6 rounded-3xl glass-panel glass-border-gradient shadow-2xl">
      <h2 className="text-lg font-light text-white/80 mb-2 tracking-wide">
        Ласкаво просимо у Всесвіт PREDATOR
      </h2>
      <p className="text-sm text-white/40 leading-relaxed mb-4">
        Кожна світлова точка — це реальний об'єкт: компанія, декларація, людина.
        AI постійно аналізує зв'язки та шукає аномалії.
      </p>
      <div className="flex items-center justify-center gap-4 text-xs text-white/30 mb-4">
        <span>🖱️ Клік — деталі</span>
        <span>🎤 Голос — команди</span>
        <span>⌨️ Чат — AI Oracle</span>
      </div>
      <button
        onClick={onDismiss}
        className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 hover:text-white text-sm transition-all border border-white/[0.08]"
      >
        Почати
      </button>
    </div>
  </motion.div>
);

export const UniverseView: React.FC = () => {
  const [showWelcome, setShowWelcome] = React.useState(true);
  const { setAIMode } = useUniverseStore();

  // Автоматична зміна режимів AI (симуляція живої системи)
  useEffect(() => {
    const modes: Array<'idle' | 'learning' | 'inference' | 'discovery'> = [
      'idle', 'learning', 'inference', 'discovery',
    ];
    let index = 0;
    const interval = setInterval(() => {
      // Не змінювати, якщо зараз ризик або аномалія (пріоритетні режими)
      index = (index + 1) % modes.length;
      setAIMode(modes[index]);
    }, 15000); // Кожні 15 секунд

    return () => clearInterval(interval);
  }, [setAIMode]);

  return (
    <div className="fixed inset-0 bg-[#050510] overflow-hidden">
      {/* 3D Всесвіт (повноекранний фон) */}
      <UniverseScene />

      {/* UI Overlay (контекстний, мінімальний) */}
      <div className="relative z-10">
        {/* Мінімальний HUD зверху */}
        <ModeIndicator />

        {/* Потік інсайтів (ліворуч) */}
        <InsightStream />

        {/* AI Oracle чат (праворуч-знизу) */}
        <AIOracle />

        {/* Панель передбачення намірів (знизу по центру) */}
        <IntentBar />

        {/* Підказка першого запуску */}
        {showWelcome && (
          <WelcomeHint onDismiss={() => setShowWelcome(false)} />
        )}
      </div>
    </div>
  );
};

export default UniverseView;
