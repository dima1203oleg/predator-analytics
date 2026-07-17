/* ─────────────────────────────────────────────────────────
 * ⚡ usePerformanceMonitor — FPS counter + auto-degrade
 * requestAnimationFrame-based, інтеграція з performanceStore.
 * ───────────────────────────────────────────────────────── */
import { useEffect, useRef } from 'react';
import { usePerformanceStore } from '../stores/performanceStore';

/** Інтервал оновлення метрик (мс) */
const SAMPLE_INTERVAL = 1000;

export function usePerformanceMonitor() {
    const updateMetrics = usePerformanceStore(s => s.updateMetrics);
    const adaptQuality = usePerformanceStore(s => s.adaptQuality);
    const frameCountRef = useRef(0);
    const lastTimeRef = useRef(performance.now());
    const rafRef = useRef<number>(0);

    useEffect(() => {
        const tick = () => {
            frameCountRef.current++;
            const now = performance.now();
            const delta = now - lastTimeRef.current;

            if (delta >= SAMPLE_INTERVAL) {
                const fps = Math.round((frameCountRef.current * 1000) / delta);
                const frameTimeMs = parseFloat((delta / frameCountRef.current).toFixed(2));

                updateMetrics({ fps, frameTimeMs });
                adaptQuality();

                frameCountRef.current = 0;
                lastTimeRef.current = now;
            }

            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(rafRef.current);
        };
    }, [updateMetrics, adaptQuality]);
}
