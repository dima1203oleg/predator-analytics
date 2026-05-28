/**
 * 🖥️ useViewport — повна адаптивна інформація про viewport
 * Mobile-first breakpoints: compact < 640px, medium 640-1024px, expanded > 1024px
 */
import { useEffect, useState, useCallback } from 'react';

export type Breakpoint = 'compact' | 'medium' | 'expanded' | 'wide';
export type Orientation = 'portrait' | 'landscape';

interface ViewportState {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  orientation: Orientation;
  isCompact: boolean;      // < 640px (телефони)
  isMedium: boolean;        // 640-1024px (планшети)
  isExpanded: boolean;      // > 1024px (ноутбуки)
  isWide: boolean;          // > 1440px (десктопи)
  isTouch: boolean;         // touch-пристрій
  isPortrait: boolean;
  isLandscape: boolean;
  dpr: number;              // device pixel ratio
  safeArea: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

function getBreakpoint(width: number): Breakpoint {
  if (width < 640) return 'compact';
  if (width < 1024) return 'medium';
  if (width < 1440) return 'expanded';
  return 'wide';
}

function getSafeArea(): { top: number; bottom: number; left: number; right: number } {
  const style = getComputedStyle(document.documentElement);
  const getValue = (prop: string) => {
    const val = style.getPropertyValue(prop);
    return val ? parseInt(val, 10) || 0 : 0;
  };
  return {
    top: getValue('--sat') || getValue('env(safe-area-inset-top)') || 0,
    bottom: getValue('--sab') || getValue('env(safe-area-inset-bottom)') || 0,
    left: getValue('--sal') || getValue('env(safe-area-inset-left)') || 0,
    right: getValue('--sar') || getValue('env(safe-area-inset-right)') || 0,
  };
}

const TOUCH_MEDIA = '(pointer: coarse)';

export function useViewport(): ViewportState & { refresh: () => void } {
  const [state, setState] = useState<ViewportState>(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const h = typeof window !== 'undefined' ? window.innerHeight : 768;
    const bp = getBreakpoint(w);
    return {
      width: w,
      height: h,
      breakpoint: bp,
      orientation: w > h ? 'landscape' : 'portrait',
      isCompact: bp === 'compact',
      isMedium: bp === 'medium',
      isExpanded: bp === 'expanded' || bp === 'wide',
      isWide: bp === 'wide',
      isTouch: typeof window !== 'undefined' ? window.matchMedia(TOUCH_MEDIA).matches : false,
      isPortrait: w <= h,
      isLandscape: w > h,
      dpr: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
      safeArea: { top: 0, bottom: 0, left: 0, right: 0 },
    };
  });

  const refresh = useCallback(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const bp = getBreakpoint(w);
    setState({
      width: w,
      height: h,
      breakpoint: bp,
      orientation: w > h ? 'landscape' : 'portrait',
      isCompact: bp === 'compact',
      isMedium: bp === 'medium',
      isExpanded: bp === 'expanded' || bp === 'wide',
      isWide: bp === 'wide',
      isTouch: window.matchMedia(TOUCH_MEDIA).matches,
      isPortrait: w <= h,
      isLandscape: w > h,
      dpr: window.devicePixelRatio || 1,
      safeArea: getSafeArea(),
    });
  }, []);

  useEffect(() => {
    refresh();
    let raf: number;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(refresh);
    };
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', refresh, { passive: true });
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', refresh);
      cancelAnimationFrame(raf);
    };
  }, [refresh]);

  return { ...state, refresh };
}
