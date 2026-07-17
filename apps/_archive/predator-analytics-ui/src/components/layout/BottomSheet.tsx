/**
 * 📱 BottomSheet — стандартний mobile bottom sheet для деталей/фільтрів/дій
 * Snap points: 25%, 50%, 85%
 */
import { Button } from '@/components/ui/button';
import React, { useRef, useCallback, useState } from 'react';
import { motion, PanInfo, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: number[]; // відсотки висоти (0-100)
  defaultSnap?: number;
  className?: string;
  showCloseButton?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [25, 50, 85],
  defaultSnap = 50,
  className,
  showCloseButton = true,
}) => {
  const y = useMotionValue(0);
  const [currentSnap, setCurrentSnap] = useState(defaultSnap);
  const containerRef = useRef<HTMLDivElement>(null);

  // Розраховуємо snap points у пікселях
  const getSnapPixels = useCallback(
    (pct: number) => {
      if (!containerRef.current) return 0;
      const vh = window.innerHeight;
      return vh - (vh * pct) / 100;
    },
    []
  );

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const vh = window.innerHeight;
      const currentY = y.get();
      const velocity = info.velocity.y;

      // Закриваємо якщо потягнули достатньо вниз або швидкість велика
      if (currentY > vh * 0.2 || velocity > 800) {
        onClose();
        return;
      }

      // Snap до найближчої точки
      const snapPixels = snapPoints.map((p) => getSnapPixels(p));
      const distances = snapPixels.map((sp) => Math.abs(currentY - sp));
      const closestIndex = distances.indexOf(Math.min(...distances));
      const closestSnap = snapPoints[closestIndex];
      setCurrentSnap(closestSnap);
    },
    [getSnapPixels, onClose, snapPoints, y]
  );

  const sheetHeight = `${currentSnap}vh`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9998]" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            ref={containerRef}
            initial={{ y: '100%' }}
            animate={{ y: `${100 - currentSnap}vh` }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: window.innerHeight * 0.5 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            style={{ y, height: sheetHeight }}
            className={cn(
              'absolute bottom-0 left-0 right-0',
              'bg-gradient-to-b from-[#0d1117] to-[#0a0a0f]',
              'border-t border-white/10 rounded-t-3xl',
              'flex flex-col overflow-hidden',
              className
            )}
          >
            {/* Handle bar */}
            <div className="flex flex-col items-center pt-2.5 pb-1 shrink-0">
              <div className="w-9 h-1 rounded-full bg-white/25" />
            </div>

            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-4 py-2 shrink-0">
                {title && (
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white/80">
                    {title}
                  </h3>
                )}
                {showCloseButton && (
                  <Button variant="cyber"
                    type="button"
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    aria-label="Закрити"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </Button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-2 scrollbar-hide">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BottomSheet;
