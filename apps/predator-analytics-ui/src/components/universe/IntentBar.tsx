/**
 * IntentBar — Панель передбачення намірів користувача
 * 
 * Горизонтальна панель внизу екрана з найвірогіднішими сценаріями:
 * - Динамічно змінюється залежно від контексту
 * - Кожна дія = 1 клік
 * - Spring-анімація появи
 * - AI передбачає, що користувач хоче зробити
 */
import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUniverseStore, AI_MODE_CONFIGS } from '../../store/useUniverseStore';
import type { PredictedIntent } from '../../store/useUniverseStore';

// ─── Іконки для дій (SVG inline) ────────────────────────────────────────
const INTENT_ICONS: Record<string, React.ReactNode> = {
  search: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  graph: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="6" cy="6" r="3" /><circle cx="18" cy="18" r="3" /><circle cx="18" cy="6" r="3" />
      <line x1="8.5" y1="7.5" x2="15.5" y2="16.5" /><line x1="8.5" y1="6" x2="15" y2="6" />
    </svg>
  ),
  risk: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  report: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  compare: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  predict: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  voice: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" />
    </svg>
  ),
  ingestion: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
};

export const IntentBar: React.FC = () => {
  const {
    predictedIntents,
    setPredictedIntents,
    isIntentBarVisible,
    aiMode,
    selectedParticleId,
    setOracleOpen,
    setAIMode,
    isListening,
    setListening,
  } = useUniverseStore();

  const config = AI_MODE_CONFIGS[aiMode];

  // ─── Генерація контекстних інтентів ─────────────────────────────────
  useEffect(() => {
    const baseIntents: PredictedIntent[] = [
      {
        id: 'search',
        label: 'Перевірити компанію',
        icon: 'search',
        probability: 0.95,
        action: () => {
          setOracleOpen(true);
          setAIMode('inference');
        },
      },
      {
        id: 'graph',
        label: 'Побудувати граф',
        icon: 'graph',
        probability: 0.85,
        action: () => setAIMode('discovery'),
      },
      {
        id: 'risk',
        label: 'Пошук ризиків',
        icon: 'risk',
        probability: 0.8,
        action: () => setAIMode('risk'),
      },
      {
        id: 'predict',
        label: 'Побудувати прогноз',
        icon: 'predict',
        probability: 0.7,
        action: () => setAIMode('prediction'),
      },
      {
        id: 'compare',
        label: 'Порівняти країни',
        icon: 'compare',
        probability: 0.6,
        action: () => setAIMode('simulation'),
      },
      {
        id: 'report',
        label: 'Створити звіт',
        icon: 'report',
        probability: 0.5,
        action: () => setAIMode('planning'),
      },
      {
        id: 'ingestion',
        label: 'Завантажити дані',
        icon: 'ingestion',
        probability: 0.4,
        action: () => setAIMode('fusion'),
      },
    ];

    // Якщо обрана частинка — додаємо контекстні дії
    if (selectedParticleId) {
      baseIntents.unshift({
        id: 'detail',
        label: 'Деталі сутності',
        icon: 'search',
        probability: 1.0,
        action: () => setOracleOpen(true),
      });
    }

    setPredictedIntents(baseIntents.sort((a, b) => b.probability - a.probability).slice(0, 7));
  }, [selectedParticleId, setPredictedIntents, setOracleOpen, setAIMode]);

  // ─── Голосовий AI тоглер ────────────────────────────────────────────
  const toggleVoice = useCallback(() => {
    setListening(!isListening);
  }, [isListening, setListening]);

  if (!isIntentBarVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25, delay: 0.3 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="flex items-center gap-2 px-3 py-2 glass-panel glass-border-gradient shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          {/* AI Mode індикатор */}
          <div className="flex items-center gap-2 pr-3 border-r border-white/[0.08]">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{
                backgroundColor: `rgb(${Math.round(config.color[0] * 255)}, ${Math.round(config.color[1] * 255)}, ${Math.round(config.color[2] * 255)})`,
              }}
            />
            <span className="text-[10px] text-white/40 uppercase tracking-wider font-medium">
              {config.label}
            </span>
          </div>

          {/* Intent buttons */}
          {predictedIntents.map((intent, index) => (
            <motion.button
              key={intent.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.05, type: 'spring', stiffness: 400 }}
              onClick={intent.action}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.08] transition-all text-xs font-medium group"
              title={intent.label}
            >
              <span className="text-white/40 group-hover:text-white/80 transition-colors">
                {INTENT_ICONS[intent.icon] || INTENT_ICONS.search}
              </span>
              <span className="hidden sm:inline">{intent.label}</span>
            </motion.button>
          ))}

          {/* Голосовий AI */}
          <div className="pl-2 border-l border-white/[0.08]">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleVoice}
              className={`
                p-2 rounded-xl transition-all
                ${isListening
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                  : 'text-white/40 hover:text-white hover:bg-white/[0.08]'
                }
              `}
              title={isListening ? 'Зупинити прослуховування' : 'Голосовий AI'}
            >
              {INTENT_ICONS.voice}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
