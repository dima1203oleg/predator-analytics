/**
 * 👆 SwipeableDrawer — Touch-optimized drawer з swipe-to-close
 * Для mobile: swipe left to close, pan gesture support
 */
import React, { useRef, useCallback, useEffect, useState } from 'react';
import { motion, PanInfo, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useViewport } from '@/hooks/useViewport';

interface SwipeableDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position?: 'left' | 'right' | 'bottom';
  width?: number; // для left/right
  maxHeight?: string; // для bottom
  className?: string;
  showHandle?: boolean;
}

export const SwipeableDrawer: React.FC<SwipeableDrawerProps> = ({
  isOpen,
  onClose,
  children,
  position = 'left',
  width = 280,
  maxHeight = '85vh',
  className,
  showHandle = true,
}) => {
  const { isTouch } = useViewport();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);

  // Threshold для закриття (40% від ширини/висоти)
  const closeThreshold = position === 'bottom' ? 120 : width * 0.4;

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false);
      const velocity = position === 'bottom' ? info.velocity.y : info.velocity.x;
      const offset = position === 'bottom' ? info.offset.y : info.offset.x;

      // Закриваємо якщо швидкість або зміщення достатні
      const shouldClose =
        position === 'left'
          ? offset < -closeThreshold || velocity < -500
          : position === 'right'
            ? offset > closeThreshold || velocity > 500
            : offset > closeThreshold || velocity > 500;

      if (shouldClose) {
        onClose();
      }
    },
    [closeThreshold, onClose, position]
  );

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  // Закриття по Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Закриття по кліку на backdrop
  const backdropRef = useRef<HTMLDivElement>(null);
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current && !isDragging) {
        onClose();
      }
    },
    [isDragging, onClose]
  );

  const isHorizontal = position === 'left' || position === 'right';

  // Drag constraints
  const dragConstraints = isHorizontal
    ? position === 'left'
      ? { left: -width, right: 0 }
      : { left: 0, right: width }
    : { top: 0, bottom: 400 };

  const dragElastic = isTouch ? 0.15 : 0.05;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            ref={backdropRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          {/* Drawer panel */}
          <motion.div
            initial={
              position === 'left'
                ? { x: -width }
                : position === 'right'
                  ? { x: width }
                  : { y: '100%' }
            }
            animate={
              position === 'left'
                ? { x: 0 }
                : position === 'right'
                  ? { x: 0 }
                  : { y: 0 }
            }
            exit={
              position === 'left'
                ? { x: -width }
                : position === 'right'
                  ? { x: width }
                  : { y: '100%' }
            }
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag={isHorizontal ? 'x' : 'y'}
            dragConstraints={dragConstraints}
            dragElastic={dragElastic}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            style={
              position === 'bottom'
                ? { y, maxHeight, height: maxHeight }
                : position === 'left'
                  ? { x, width }
                  : { x, width }
            }
            className={cn(
              'absolute bg-[#0a0a0f] border-white/10 overflow-hidden',
              position === 'left' && 'left-0 top-0 h-full border-r',
              position === 'right' && 'right-0 top-0 h-full border-l',
              position === 'bottom' && 'bottom-0 left-0 right-0 rounded-t-3xl border-t',
              className
            )}
          >
            {/* Handle indicator для bottom drawer */}
            {showHandle && position === 'bottom' && (
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
            )}

            {/* Swipe area indicator для edge */}
            {isTouch && isHorizontal && (
              <div
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 w-1 h-16 rounded-full bg-white/10',
                  position === 'left' ? 'right-1' : 'left-1'
                )}
              />
            )}

            {/* Content */}
            <div className="h-full overflow-y-auto overscroll-contain scrollbar-hide">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SwipeableDrawer;
