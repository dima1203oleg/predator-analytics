import { useEffect, useState, useCallback } from 'react';
import { useDisplayMode, DisplayMode } from '../context/DisplayModeContext';

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
  if (width < 480) return 'compact';
  if (width < 768) return 'medium';
  if (width < 1024) return 'expanded';
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
  const { mode: displayMode } = useDisplayMode();

  const getResponsiveValues = useCallback((w: number, h: number) => {
    const bp = getBreakpoint(w);
    const isCompact = displayMode === DisplayMode.MOBILE || (displayMode === DisplayMode.DESKTOP && bp === 'compact');
    const isMedium = displayMode === DisplayMode.TABLET || (displayMode === DisplayMode.DESKTOP && bp === 'medium');
    const isExpanded = displayMode === DisplayMode.DESKTOP && (bp === 'expanded' || bp === 'wide');
    const isWide = displayMode === DisplayMode.DESKTOP && bp === 'wide';
    return { bp, isCompact, isMedium, isExpanded, isWide };
  }, [displayMode]);

  const [state, setState] = useState<ViewportState>(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const h = typeof window !== 'undefined' ? window.innerHeight : 768;
    const bp = getBreakpoint(w);
    
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('predator_display_mode') as DisplayMode : DisplayMode.DESKTOP;
    // За замовчуванням завжди desktop, якщо явно не встановлено інше
    const currentMode = (saved && Object.values(DisplayMode).includes(saved as DisplayMode)) ? saved : DisplayMode.DESKTOP;

    const isCompact = currentMode === DisplayMode.MOBILE || (currentMode === DisplayMode.DESKTOP && bp === 'compact');
    const isMedium = currentMode === DisplayMode.TABLET || (currentMode === DisplayMode.DESKTOP && bp === 'medium');
    const isExpanded = currentMode === DisplayMode.DESKTOP && (bp === 'expanded' || bp === 'wide');
    const isWide = currentMode === DisplayMode.DESKTOP && bp === 'wide';

    return {
      width: w,
      height: h,
      breakpoint: bp,
      orientation: w > h ? 'landscape' : 'portrait',
      isCompact,
      isMedium,
      isExpanded,
      isWide,
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
    const { bp, isCompact, isMedium, isExpanded, isWide } = getResponsiveValues(w, h);
    setState({
      width: w,
      height: h,
      breakpoint: bp,
      orientation: w > h ? 'landscape' : 'portrait',
      isCompact,
      isMedium,
      isExpanded,
      isWide,
      isTouch: window.matchMedia(TOUCH_MEDIA).matches,
      isPortrait: w <= h,
      isLandscape: w > h,
      dpr: window.devicePixelRatio || 1,
      safeArea: getSafeArea(),
    });
  }, [getResponsiveValues]);

  useEffect(() => {
    refresh();
  }, [displayMode, refresh]);

  useEffect(() => {
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
