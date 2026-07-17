/**
 * ↕️ PullToRefresh — pull-to-refresh для mobile списків
 * Показує анімованого хижака та статус оновлення
 */
import React, { useRef, useCallback, useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useViewport } from '@/hooks/useViewport';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
  threshold?: number; // px для спрацювання (default 80)
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  className,
  threshold = 80,
  disabled = false,
}) => {
  const { isCompact } = useViewport();
  const y = useMotionValue(0);
  const [status, setStatus] = useState<'idle' | 'pulling' | 'ready' | 'refreshing'>('idle');
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const isRefreshingRef = useRef(false);

  const progress = useTransform(y, [0, threshold], [0, 1]);
  const indicatorRotate = useTransform(progress, [0, 1], [0, 180]);
  const indicatorOpacity = useTransform(progress, [0, 0.3], [0, 1]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled || isRefreshingRef.current) return;
    const container = containerRef.current;
    if (!container) return;

    // Перевіряємо чи скрол вгорі
    if (container.scrollTop > 5) return;

    startYRef.current = e.clientY;
    setStatus('pulling');
  }, [disabled]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (status === 'idle' || status === 'refreshing' || disabled) return;

    const delta = e.clientY - startYRef.current;
    if (delta < 0) return;

    // Resistance curve — чим далі, тим важче
    const resistance = 0.5;
    const newY = Math.min(delta * resistance, threshold * 1.5);
    y.set(newY);

    if (newY >= threshold && status !== 'ready') {
      setStatus('ready');
    } else if (newY < threshold && status !== 'pulling') {
      setStatus('pulling');
    }
  }, [disabled, status, threshold, y]);

  const handlePointerUp = useCallback(async () => {
    if (status === 'idle' || status === 'refreshing') return;

    const currentY = y.get();

    if (currentY >= threshold && !isRefreshingRef.current) {
      setStatus('refreshing');
      isRefreshingRef.current = true;
      y.set(threshold * 0.8); // Затримуємо індикатор

      try {
        await onRefresh();
      } finally {
        setTimeout(() => {
          y.set(0);
          setStatus('idle');
          isRefreshingRef.current = false;
        }, 400);
      }
    } else {
      y.set(0);
      setStatus('idle');
    }
  }, [onRefresh, status, threshold, y]);

  // Не рендеримо на desktop
  if (!isCompact) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-y-auto overscroll-y-contain', className)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Pull indicator */}
      <motion.div
        style={{ y, opacity: indicatorOpacity }}
        className="absolute top-0 left-0 right-0 z-10 flex justify-center pointer-events-none"
      >
        <div className="flex items-center gap-2 py-3">
          {status === 'refreshing' ? (
            <Loader2 className="w-5 h-5 text-rose-400 animate-spin" />
          ) : (
            <motion.div style={{ rotate: indicatorRotate }}>
              <RefreshCw className={cn(
                'w-5 h-5 transition-colors',
                status === 'ready' ? 'text-rose-400' : 'text-slate-500'
              )} />
            </motion.div>
          )}
          <span className={cn(
            'text-xs font-medium uppercase tracking-wider',
            status === 'ready' ? 'text-rose-400' : 'text-slate-500'
          )}>
            {status === 'idle' && ''}
            {status === 'pulling' && 'Потягніть оновити'}
            {status === 'ready' && 'Відпустіть оновити'}
            {status === 'refreshing' && 'Оновлення...'}
          </span>
        </div>
      </motion.div>

      {/* Content з відступом під час pull */}
      <motion.div style={{ y }} className="min-h-full">
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
