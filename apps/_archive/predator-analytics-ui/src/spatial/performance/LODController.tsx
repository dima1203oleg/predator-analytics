/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PREDATOR Command Center — LOD Controller
 *
 * Моніторить FPS та динамічно впливає на якість рендерингу.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useRef, memo } from 'react';
import { useFrame } from '@react-three/fiber';

function LODControllerInner() {
  const frames = useRef(0);
  const prevTime = useRef(performance.now());

  useFrame(() => {
    frames.current++;
    const time = performance.now();
    
    // Перевіряємо FPS кожну секунду
    if (time >= prevTime.current + 1000) {
      const fps = Math.round((frames.current * 1000) / (time - prevTime.current));
      
      if (fps < 30) {
        console.warn(`[LOD] Низька продуктивність: ${fps} FPS. Рекомендується оптимізація сцени.`);
        // У майбутньому: useCommandStore.getState().setQuality('LOW');
      }

      frames.current = 0;
      prevTime.current = time;
    }
  });

  return null;
}

export const LODController = memo(LODControllerInner);
