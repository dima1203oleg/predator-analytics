import { create } from 'zustand';
import { CameraMode, AvatarState, RiskLevel, SpatialDataEngineState, ThoughtVisualizationEngineState, RiskAtmosphereEngineState, CursorState, SpatialDataLayer } from '@/types';
import { useEffect } from 'react';

interface AppState {
  // Core System State
  avatarState: AvatarState;
  riskLevel: RiskLevel;
  isDarkMatterActive: boolean;
  idleTimer: number;

  // Systems
  spatialData: SpatialDataEngineState;
  thoughtVisualization: ThoughtVisualizationEngineState;
  riskAtmosphere: RiskAtmosphereEngineState;
  cursor: CursorState;
  cameraDirector: CameraMode;

  // Actions
  setAvatarState: (state: AvatarState) => void;
  setRiskLevel: (level: RiskLevel) => void;
  toggleDarkMatterMode: () => void;
  resetIdleTimer: () => void;
  activateLayer: (layerId: string) => void;
  addSpatialLayer: (layer: SpatialDataLayer) => void;
}

const initialState = {
  avatarState: AvatarState.IDLE,
  riskLevel: RiskLevel.LOW,
  isDarkMatterActive: false,
  idleTimer: 0,
  spatialData: {
    nodes: [],
    edges: [],
    layers: [],
    activeLayerId: null,
    selectedNodes: new Set()
  },
  thoughtVisualization: {
    thoughts: [],
    activeThoughtId: null
  },
  riskAtmosphere: {
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
    oscillatorNodes: []
  },
  cursor: {
    position: [0, 0, 0],
    isHovering: false,
    hoveredNode: undefined,
    trail: {
      positions: [],
      maxLength: 50,
      opacity: 1
    }
  },
  cameraDirector: CameraMode.ANALYTICAL
};

export const useMainStore = create<AppState>((set, get) => ({
  ...initialState,

  setAvatarState: (state) => set({ avatarState: state }),

  setRiskLevel: (level) => set({ riskLevel: level }),

  toggleDarkMatterMode: () => set((state) => ({ isDarkMatterActive: !state.isDarkMatterActive })),

  resetIdleTimer: () => set({ idleTimer: 0 }),

  activateLayer: (layerId) => set((state) => ({
    spatialData: {
      ...state.spatialData,
      activeLayerId: layerId,
      selectedNodes: new Set()
    }
  })),

  addSpatialLayer: (layer) => set((state) => ({
    spatialData: {
      ...state.spatialData,
      layers: [...state.spatialData.layers, layer],
      nodes: [...state.spatialData.nodes, ...Array.from(layer.nodes.values())],
      edges: [...state.spatialData.edges, ...layer.edges]
    }
  }))
}));

// Timer reducer for idle detection
export const useIdleTimer = () => {
  const { idleTimer, resetIdleTimer, toggleDarkMatterMode } = useMainStore();

  useEffect(() => {
    const timer = setInterval(() => {
      useMainStore.setState((state) => ({
        idleTimer: state.idleTimer + 1
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (idleTimer > 180) {
      toggleDarkMatterMode();
    }
  }, [idleTimer]);
};
