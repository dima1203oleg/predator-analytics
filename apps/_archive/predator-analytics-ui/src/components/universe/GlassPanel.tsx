/**
 * GlassPanel — Базова плаваюча скляна панель
 * 
 * Glassmorphism-компонент для ВСІХ UI-елементів Всесвіту:
 * - backdrop-filter: blur + saturate
 * - Напівпрозорий фон з градієнтною рамкою
 * - Framer Motion: spring-based анімації появи/зникнення
 * - Drag-and-drop позиціонування (опціонально)
 * - Контекстне приховування
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GlassPanelProps {
  children: React.ReactNode;
  isVisible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'left' | 'right';
  className?: string;
  draggable?: boolean;
  onClose?: () => void;
  title?: string;
  compact?: boolean;
  glow?: string; // Колір свічення рамки (hex)
}

const positionClasses: Record<string, string> = {
  'top-left': 'top-6 left-6',
  'top-right': 'top-6 right-6',
  'bottom-left': 'bottom-24 left-6',
  'bottom-right': 'bottom-24 right-6',
  'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  'left': 'top-1/2 left-6 -translate-y-1/2',
  'right': 'top-1/2 right-6 -translate-y-1/2',
};

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  isVisible = true,
  position = 'top-left',
  className = '',
  draggable = false,
  onClose,
  title,
  compact = false,
  glow,
}) => {
  const glowStyle = glow
    ? { boxShadow: `0 0 30px ${glow}20, 0 0 60px ${glow}10, inset 0 1px 0 ${glow}15` }
    : {};

  const content = (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -5 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 25,
        mass: 0.8,
      }}
      drag={draggable}
      dragMomentum={false}
      dragElastic={0.1}
      className={`
        fixed ${positionClasses[position]}
        z-50
        ${compact ? 'p-3' : 'p-5'}
        glass-panel
        rounded-2xl
        shadow-[0_8px_32px_rgba(0,0,0,0.3)]
        ${className}
      `}
      style={glowStyle}
    >
      {/* Градієнтний оверлей для скляного ефекту */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />
      
      {/* Заголовок з кнопкою закриття */}
      {(title || onClose) && (
        <div className="flex items-center justify-between mb-3 relative z-10">
          {title && (
            <h3 className="text-xs font-medium text-white/60 uppercase tracking-[0.2em]">
              {title}
            </h3>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-white/30 hover:text-white/70 transition-colors p-1 -mr-1 rounded-lg hover:bg-white/5"
              aria-label="Закрити панель"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Контент */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );

  return <AnimatePresence>{isVisible && content}</AnimatePresence>;
};
