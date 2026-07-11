/* ─────────────────────────────────────────────────────────
 * ⚡ PREDATOR Performance Types — Adaptive Quality System
 * DeviceTier, LOD, QualityPreset для AdaptiveEngine.
 * ───────────────────────────────────────────────────────── */

/** Класифікація пристрою за продуктивністю */
export type DeviceTier = 'high' | 'medium' | 'low';

/** Рівень деталізації для 3D об'єктів */
export type LODLevel = 0 | 1 | 2 | 3;

/** Пресет якості рендерингу */
export interface QualityPreset {
    /** Device pixel ratio */
    dpr: number;
    /** Максимальна кількість тіней */
    shadowMapSize: number;
    /** Чи увімкнено тіні */
    shadowsEnabled: boolean;
    /** Чи увімкнено постобробку */
    postProcessingEnabled: boolean;
    /** Максимальна кількість частинок */
    maxParticles: number;
    /** Максимальна кількість вузлів графу в 3D */
    maxGraphNodes: number;
    /** LOD рівень за замовчуванням */
    defaultLOD: LODLevel;
    /** Чи увімкнені зірки (Stars background) */
    starsEnabled: boolean;
    /** Anti-aliasing */
    antialias: boolean;
}

/** Стандартні пресети для кожного тіру */
export const QUALITY_PRESETS: Record<DeviceTier, QualityPreset> = {
    high: {
        dpr: 2,
        shadowMapSize: 2048,
        shadowsEnabled: true,
        postProcessingEnabled: true,
        maxParticles: 5000,
        maxGraphNodes: 500,
        defaultLOD: 0,
        starsEnabled: true,
        antialias: true,
    },
    medium: {
        dpr: 1.5,
        shadowMapSize: 1024,
        shadowsEnabled: true,
        postProcessingEnabled: false,
        maxParticles: 2000,
        maxGraphNodes: 200,
        defaultLOD: 1,
        starsEnabled: true,
        antialias: true,
    },
    low: {
        dpr: 1,
        shadowMapSize: 512,
        shadowsEnabled: false,
        postProcessingEnabled: false,
        maxParticles: 0,
        maxGraphNodes: 100,
        defaultLOD: 2,
        starsEnabled: false,
        antialias: false,
    },
};

/** Метрики продуктивності в реальному часі */
export interface PerformanceMetrics {
    /** Поточний FPS */
    fps: number;
    /** Кількість draw calls */
    drawCalls: number;
    /** Кількість трикутників на сцені */
    triangles: number;
    /** Використання GPU (0.0 → 1.0), якщо доступно */
    gpuLoad: number;
    /** Час рендеру одного кадру в мс */
    frameTimeMs: number;
}

/** Тип пристрою для adaptive layout */
export type DeviceClass = 'desktop' | 'tablet' | 'mobile';

/** Breakpoints для DeviceClass */
export const DEVICE_BREAKPOINTS: Record<DeviceClass, { minWidth: number; maxWidth: number }> = {
    mobile: { minWidth: 0, maxWidth: 767 },
    tablet: { minWidth: 768, maxWidth: 1199 },
    desktop: { minWidth: 1200, maxWidth: Infinity },
};
