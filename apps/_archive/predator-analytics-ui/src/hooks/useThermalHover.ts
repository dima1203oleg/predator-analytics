/**
 * useThermalHover — Thermal imaging hover effect
 * v63.0-ELITE · CSS filter + mouse tracking
 */
import { useState, useCallback, useRef, useEffect } from 'react';

interface ThermalState {
  x: number;
  y: number;
  intensity: number;
  isActive: boolean;
}

export const useThermalHover = (intensityMultiplier = 1) => {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<ThermalState>({ x: 0, y: 0, intensity: 0, isActive: false });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const intensity = Math.min(1, (1 - Math.abs((x - 50) / 50)) * (1 - Math.abs((y - 50) / 50)) * intensityMultiplier);
    setState({ x, y, intensity, isActive: true });
  }, [intensityMultiplier]);

  const handleMouseLeave = useCallback(() => {
    setState(prev => ({ ...prev, intensity: 0, isActive: false }));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  const style = {
    '--thermal-x': `${state.x}%`,
    '--thermal-y': `${state.y}%`,
    '--thermal-intensity': state.intensity,
    filter: state.isActive
      ? `contrast(${1 + state.intensity * 0.3}) brightness(${1 + state.intensity * 0.15}) saturate(${1 + state.intensity * 0.5})`
      : 'none',
    transition: 'filter 0.3s ease-out',
  } as React.CSSProperties;

  return { ref, state, style };
};

export default useThermalHover;
