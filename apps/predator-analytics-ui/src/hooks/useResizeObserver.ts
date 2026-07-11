// src/hooks/useResizeObserver.ts

/**
 * Хук useResizeObserver – спостерігає зміни розмірів вікна браузера
 * та повертає поточну ширину, висоту і device pixel ratio (DPR).
 * Працює тільки у браузері; при SSR повертає нульові значення.
 */
import { useState, useEffect } from 'react';

interface ResizeInfo {
  /** Ширина вікна (px) */
  width: number;
  /** Висота вікна (px) */
  height: number;
  /** Device Pixel Ratio */
  dpr: number;
}

/**
 * Повертає об’єкт { width, height, dpr }.
 */
export const useResizeObserver = (): ResizeInfo => {
  const isBrowser = typeof window !== 'undefined';

  const getSize = (): ResizeInfo =>
    isBrowser
      ? { width: window.innerWidth, height: window.innerHeight, dpr: window.devicePixelRatio }
      : { width: 0, height: 0, dpr: 1 };

  const [size, setSize] = useState<ResizeInfo>(getSize);

  useEffect(() => {
    if (!isBrowser) return;

    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight, dpr: window.devicePixelRatio });
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [isBrowser]);

  return size;
};
