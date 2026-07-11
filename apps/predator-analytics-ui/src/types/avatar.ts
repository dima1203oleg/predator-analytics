/* ─────────────────────────────────────────────────────────
 * 🤖 PREDATOR Avatar Types — FSM, GLTF, Morph, Gaze
 * Production-ready типізація AI-аватара.
 * ───────────────────────────────────────────────────────── */

// ── FSM States ─────────────────────────────────────────

export type AvatarState = 'idle' | 'listening' | 'analyzing' | 'presenting' | 'alert';

/** Матриця дозволених переходів між станами */
export const AVATAR_TRANSITIONS: Record<AvatarState, AvatarState[]> = {
    idle: ['listening', 'analyzing', 'alert'],
    listening: ['idle', 'analyzing', 'alert'],
    analyzing: ['idle', 'presenting', 'alert'],
    presenting: ['idle', 'listening', 'alert'],
    alert: ['idle', 'listening'],
};

// ── Configuration ──────────────────────────────────────

export interface AvatarConfiguration {
    modelUrl: string | null;
    scale: number;
    position: [number, number, number];
    rotation: [number, number, number];
}

export type AvatarFallbackMode = 'sphere' | 'orb' | 'none';

/** Режим аватара: GLTF модель або fallback */
export interface AvatarRuntimeConfig {
    isAvailable: boolean;
    fallbackMode: AvatarFallbackMode;
    configuration: AvatarConfiguration;
}

// ── Morph Targets ──────────────────────────────────────

export interface MorphTargetConfig {
    /** Назва morph target в GLTF */
    name: string;
    /** Поточне значення: 0.0 → 1.0 */
    value: number;
    /** Швидкість інтерполяції */
    speed: number;
}

/** Стандартні morph targets для обличчя аватара */
export type FacialMorphTarget =
    | 'mouthOpen'
    | 'mouthSmile'
    | 'eyeBlinkLeft'
    | 'eyeBlinkRight'
    | 'browRaiseLeft'
    | 'browRaiseRight';

// ── Gaze System ────────────────────────────────────────

export interface GazeTarget {
    /** Координати в 3D просторі, куди дивиться аватар */
    position: [number, number, number];
    /** Швидкість повороту голови (0-1) */
    trackingSpeed: number;
}

// ── Lip Sync ───────────────────────────────────────────

export interface LipSyncFrame {
    /** Час в секундах від початку аудіо */
    time: number;
    /** Ступінь відкриття рота: 0.0 → 1.0 */
    mouthOpen: number;
    /** Форма рота (для більш точної синхронізації) */
    viseme: string;
}

// ── Speech ─────────────────────────────────────────────

export type SpeechProvider = 'web-speech' | 'external' | 'none';

export interface SpeechConfig {
    provider: SpeechProvider;
    voiceId: string;
    pitch: number;
    rate: number;
    volume: number;
}

// ── Shader Config ──────────────────────────────────────

export interface AvatarShaderConfig {
    /** Fresnel edge intensity: 0.0 → 1.0 */
    fresnelIntensity: number;
    /** Scanline opacity: 0.0 → 0.3 (subtle) */
    scanlineOpacity: number;
    /** Base color for holographic material */
    baseColor: string;
    /** Чи увімкнено bloom (за замовчуванням: ні) */
    bloomEnabled: boolean;
}
