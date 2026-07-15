/**
 * InsightStream — Потік інсайтів від AI
 * 
 * Стрічка збоку екрана з карточками інсайтів:
 * - Іконки та кольори за типом (ризик/можливість/інформація)
 * - Натискання = zoom до відповідного вузла у Всесвіті
 * - Auto-priority: критичні інсайти показуються першими
 * - Плавна анімація появи/зникнення
 */
import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUniverseStore } from '../../store/useUniverseStore';
import { GlassPanel } from './GlassPanel';

const TYPE_ICONS: Record<string, string> = {
  risk: '⚠️',
  anomaly: '🔴',
  opportunity: '✨',
  prediction: '🔮',
  info: '💡',
};

const TYPE_COLORS: Record<string, string> = {
  risk: 'border-l-red-500',
  anomaly: 'border-l-orange-500',
  opportunity: 'border-l-green-500',
  prediction: 'border-l-amber-500',
  info: 'border-l-blue-500',
};

const SEVERITY_GLOW: Record<string, string> = {
  critical: 'shadow-[0_0_15px_rgba(239,68,68,0.2)]',
  high: 'shadow-[0_0_10px_rgba(245,158,11,0.15)]',
  medium: '',
  low: '',
};

export const InsightStream: React.FC = () => {
  const {
    insights,
    isInsightStreamOpen,
    setInsightStreamOpen,
    markInsightRead,
    focusOnParticle,
    unreadInsightsCount,
  } = useUniverseStore();

  const handleInsightClick = useCallback(
    (insightId: string, entityId?: string) => {
      markInsightRead(insightId);
      if (entityId) {
        focusOnParticle(entityId);
      }
    },
    [markInsightRead, focusOnParticle]
  );

  const formatTime = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'щойно';
    if (diff < 3600) return `${Math.floor(diff / 60)} хв тому`;
    return `${Math.floor(diff / 3600)} год тому`;
  };

  // ─── Кнопка відкриття (коли закрита) ──────────────────────────────
  if (!isInsightStreamOpen) {
    return (
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl glass-card text-white/70 hover:text-white hover:border-white/20 transition-all"
        onClick={() => setInsightStreamOpen(true)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        <span className="text-xs font-medium">Інсайти</span>
        {unreadInsightsCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500/80 text-[10px] font-bold text-white">
            {unreadInsightsCount}
          </span>
        )}
      </motion.button>
    );
  }

  return (
    <GlassPanel
      isVisible={isInsightStreamOpen}
      position="left"
      title="Потік інсайтів"
      onClose={() => setInsightStreamOpen(false)}
      className="w-[300px] max-h-[70vh]"
    >
      <div className="space-y-2 overflow-y-auto max-h-[55vh] pr-1 custom-scrollbar">
        <AnimatePresence>
          {insights.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-white/30 text-sm"
            >
              <div className="text-2xl mb-2">🧠</div>
              AI аналізує дані...
              <br />
              Інсайти з'являться тут автоматично
            </motion.div>
          ) : (
            insights.map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                  delay: index * 0.05,
                }}
                onClick={() => handleInsightClick(insight.id, insight.entityId)}
                className={`
                  relative p-3 rounded-xl cursor-pointer
                  bg-white/[0.04] hover:bg-white/[0.08]
                  border-l-2 ${TYPE_COLORS[insight.type]}
                  ${SEVERITY_GLOW[insight.severity]}
                  transition-all duration-300
                  ${!insight.isRead ? 'border border-white/[0.08]' : 'border border-transparent'}
                `}
              >
                <div className="flex items-start gap-2">
                  <span className="text-base mt-0.5">{TYPE_ICONS[insight.type]}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-relaxed ${insight.isRead ? 'text-white/50' : 'text-white/85'}`}>
                      {insight.message}
                    </p>
                    <p className="text-[10px] text-white/30 mt-1.5">
                      {formatTime(insight.timestamp)}
                    </p>
                  </div>
                  {!insight.isRead && (
                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-1 flex-shrink-0 animate-pulse" />
                  )}
                </div>

                {/* Quick Actions */}
                {insight.actions && insight.actions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2 ml-6">
                    {insight.actions.map((action) => (
                      <button
                        key={action.id}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-white/60 hover:text-white transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </GlassPanel>
  );
};
