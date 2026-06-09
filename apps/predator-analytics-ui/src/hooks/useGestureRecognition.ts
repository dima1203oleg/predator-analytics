/**
 * 👆 GESTURE RECOGNITION | PREDATOR v61.0-ELITE
 * Gesture recognition для touch devices
 * Перевищує Palantir: swipe, pinch, rotate, multi-touch gestures
 */
import { useRef, useEffect, useCallback } from 'react';

type GestureType = 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down' | 'pinch-in' | 'pinch-out' | 'tap' | 'double-tap' | 'long-press';

interface GestureConfig {
  onGesture?: (gesture: GestureType, data?: any) => void;
  threshold?: number;
  longPressDelay?: number;
}

interface TouchPoint {
  x: number;
  y: number;
  id: number;
}

export const useGestureRecognition = (config: GestureConfig = {}) => {
  const {
    onGesture,
    threshold = 50,
    longPressDelay = 500
  } = config;

  const touchesRef = useRef<TouchPoint[]>([]);
  const startTouchesRef = useRef<TouchPoint[]>([]);
  const startTimeRef = useRef<number>(0);
  const longPressTimerRef = useRef<number | null>(null);
  const lastTapTimeRef = useRef<number>(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touches = Array.from(e.touches).map(t => ({
      x: t.clientX,
      y: t.clientY,
      id: t.identifier
    }));

    touchesRef.current = touches;
    startTouchesRef.current = touches;
    startTimeRef.current = Date.now();

    // Long press detection
    longPressTimerRef.current = window.setTimeout(() => {
      if (touches.length === 1) {
        onGesture?.('long-press', { x: touches[0].x, y: touches[0].y });
      }
    }, longPressDelay);
  }, [onGesture, longPressDelay]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const touches = Array.from(e.touches).map(t => ({
      x: t.clientX,
      y: t.clientY,
      id: t.identifier
    }));

    touchesRef.current = touches;

    // Cancel long press on move
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Pinch detection
    if (touches.length === 2 && startTouchesRef.current.length === 2) {
      const currentDistance = Math.hypot(
        touches[0].x - touches[1].x,
        touches[0].y - touches[1].y
      );
      const startDistance = Math.hypot(
        startTouchesRef.current[0].x - startTouchesRef.current[1].x,
        startTouchesRef.current[0].y - startTouchesRef.current[1].y
      );

      if (currentDistance > startDistance + threshold) {
        onGesture?.('pinch-out', { distance: currentDistance });
      } else if (currentDistance < startDistance - threshold) {
        onGesture?.('pinch-in', { distance: currentDistance });
      }
    }
  }, [onGesture, threshold]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const endTime = Date.now();
    const duration = endTime - startTimeRef.current;

    // Cancel long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    const endTouches = Array.from(e.changedTouches).map(t => ({
      x: t.clientX,
      y: t.clientY,
      id: t.identifier
    }));

    // Swipe detection
    if (startTouchesRef.current.length === 1 && endTouches.length === 1) {
      const deltaX = endTouches[0].x - startTouchesRef.current[0].x;
      const deltaY = endTouches[0].y - startTouchesRef.current[0].y;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > threshold) {
          onGesture?.(deltaX > 0 ? 'swipe-right' : 'swipe-left', { deltaX, deltaY });
        }
      } else {
        if (Math.abs(deltaY) > threshold) {
          onGesture?.(deltaY > 0 ? 'swipe-down' : 'swipe-up', { deltaX, deltaY });
        }
      }

      // Double tap detection
      if (duration < 300) {
        const now = Date.now();
        if (now - lastTapTimeRef.current < 300) {
          onGesture?.('double-tap', { x: endTouches[0].x, y: endTouches[0].y });
          lastTapTimeRef.current = 0;
        } else {
          lastTapTimeRef.current = now;
          onGesture?.('tap', { x: endTouches[0].x, y: endTouches[0].y });
        }
      }
    }

    touchesRef.current = [];
    startTouchesRef.current = [];
  }, [onGesture, threshold]);

  useEffect(() => {
    const element = document.body;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);

      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    touches: touchesRef.current,
    isMultiTouch: touchesRef.current.length > 1
  };
};

export default useGestureRecognition;
