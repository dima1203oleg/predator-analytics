/* Zustand store: Performance — adaptive quality, FPS monitoring */
import { create } from 'zustand';
import type { DeviceTier, LODLevel, QualityPreset, PerformanceMetrics } from '../types/performance';
import { QUALITY_PRESETS } from '../types/performance';

interface PerformanceState {
    deviceTier: DeviceTier;
    currentPreset: QualityPreset;
    metrics: PerformanceMetrics;
    lodLevel: LODLevel;
    /** Чи увімкнено автоматичну адаптацію якості */
    autoAdapt: boolean;

    setDeviceTier: (tier: DeviceTier) => void;
    updateMetrics: (metrics: Partial<PerformanceMetrics>) => void;
    setLODLevel: (level: LODLevel) => void;
    setAutoAdapt: (enabled: boolean) => void;
    /** Автоматичне зниження якості при падінні FPS */
    adaptQuality: () => void;
}

export const usePerformanceStore = create<PerformanceState>((set, get) => ({
    deviceTier: 'high',
    currentPreset: QUALITY_PRESETS.high,
    metrics: {
        fps: 60,
        drawCalls: 0,
        triangles: 0,
        gpuLoad: 0,
        frameTimeMs: 16.67,
    },
    lodLevel: 0,
    autoAdapt: true,

    setDeviceTier: (tier) => set({
        deviceTier: tier,
        currentPreset: QUALITY_PRESETS[tier],
        lodLevel: QUALITY_PRESETS[tier].defaultLOD,
    }),

    updateMetrics: (partial) => set((state) => ({
        metrics: { ...state.metrics, ...partial },
    })),

    setLODLevel: (level) => set({ lodLevel: level }),
    setAutoAdapt: (enabled) => set({ autoAdapt: enabled }),

    adaptQuality: () => {
        const { metrics, deviceTier, autoAdapt } = get();
        if (!autoAdapt) return;

        if (metrics.fps < 25 && deviceTier !== 'low') {
            set({
                deviceTier: 'low',
                currentPreset: QUALITY_PRESETS.low,
                lodLevel: QUALITY_PRESETS.low.defaultLOD,
            });
        } else if (metrics.fps < 45 && deviceTier === 'high') {
            set({
                deviceTier: 'medium',
                currentPreset: QUALITY_PRESETS.medium,
                lodLevel: QUALITY_PRESETS.medium.defaultLOD,
            });
        } else if (metrics.fps > 55 && deviceTier === 'low') {
            set({
                deviceTier: 'medium',
                currentPreset: QUALITY_PRESETS.medium,
                lodLevel: QUALITY_PRESETS.medium.defaultLOD,
            });
        }
    },
}));
