import { create } from 'zustand';
import { RiskLevel, RiskAtmosphere, RiskAtmosphereEngineState } from '@/types';

interface RiskAtmosphereStore extends RiskAtmosphereEngineState {
  setLevel: (level: RiskLevel) => void;
  updateAtmosphere: (atmosphere: Partial<RiskAtmosphere>) => void;
  updateAudio: (audioEnabled: boolean) => void;
  updateLighting: (lighting: Partial<RiskAtmosphere['lighting']>) => void;
  updateParticleDensity: (density: number) => void;
  updateDistortion: (distortion: number) => void;
  updateCameraShake: (shake: Partial<RiskAtmosphere['cameraShake']>) => void;
  resetAtmosphere: () => void;
  startAudioEngine: () => void;
  stopAudioEngine: () => void;
}

export const useRiskAtmosphereStore = create<RiskAtmosphereStore>((set, get) => ({
  level: RiskLevel.LOW,
  atmosphere: {
    level: RiskLevel.LOW,
    lighting: {
      ambientColor: new THREE.Color(0x001F1F),
      ambientIntensity: 0.5,
      directionalColor: new THREE.Color(0x001F1F),
      directionalIntensity: 1.0
    },
    particleDensity: 1000,
    distortionIntensity: 0,
    cameraShake: {
      enabled: false,
      intensity: 0,
      frequency: 0
    }
  },
  lastUpdate: Date.now(),
  oscillatorNodes: [],

  setLevel: (level) => set({
    level,
    atmosphere: {
      ...get().atmosphere,
      level
    },
    lastUpdate: Date.now()
  }),

  updateAtmosphere: (atmosphere) => set((state) => ({
    atmosphere: { ...state.atmosphere, ...atmosphere }
  })),

  updateAudio: (audioEnabled) => {
    const { audioContext, oscillatorNodes } = get();

    if (!audioEnabled && audioContext) {
      oscillatorNodes.forEach(node => {
        try {
          node.stop();
          audioContext.close();
        } catch (e) {
          // Ignore errors
        }
      });
      return set({
        audioContext: undefined,
        oscillatorNodes: [],
        atmosphere: {
          ...get().atmosphere,
          cameraShake: {
            ...get().atmosphere.cameraShake,
            enabled: false
          }
        }
      });
    }
  },

  updateLighting: (lighting) => set((state) => ({
    atmosphere: {
      ...state.atmosphere,
      lighting: {
        ...state.atmosphere.lighting,
        ...lighting
      }
    }
  })),

  updateParticleDensity: (density) => set((state) => ({
    atmosphere: {
      ...state.atmosphere,
      particleDensity: density
    }
  })),

  updateDistortion: (distortion) => set((state) => ({
    atmosphere: {
      ...state.atmosphere,
      distortionIntensity: distortion
    }
  })),

  updateCameraShake: (shake) => set((state) => ({
    atmosphere: {
      ...state.atmosphere,
      cameraShake: {
        ...state.atmosphere.cameraShake,
        ...shake
      }
    }
  })),

  resetAtmosphere: () => set({
    level: RiskLevel.LOW,
    atmosphere: {
      level: RiskLevel.LOW,
      lighting: {
        ambientColor: new THREE.Color(0x001F1F),
        ambientIntensity: 0.5,
        directionalColor: new THREE.Color(0x001F1F),
        directionalIntensity: 1.0
      },
      particleDensity: 1000,
      distortionIntensity: 0,
      cameraShake: {
        enabled: false,
        intensity: 0,
        frequency: 0
      }
    },
    lastUpdate: Date.now()
  }),

  startAudioEngine: () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      const oscillatorNodes: OscillatorNode[] = [];

      set({ audioContext, oscillatorNodes });
    } catch (e) {
      console.error('Failed to initialize audio engine:', e);
    }
  },

  stopAudioEngine: () => {
    const { audioContext, oscillatorNodes } = get();
    if (audioContext) {
      oscillatorNodes.forEach(node => {
        try {
          node.stop();
        } catch (e) {
          // Ignore errors
        }
      });
      set({ audioContext: undefined, oscillatorNodes: [] });
    }
  }
}));
