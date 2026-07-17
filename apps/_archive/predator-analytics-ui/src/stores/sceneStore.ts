/* Zustand store: Scene State — камера, зони, готовність 3D рушія */
import { create } from 'zustand';

export type CameraMode = 'overview' | 'focus-node' | 'focus-document' | 'orbit' | 'close-face' | 'half-body' | 'full-body' | 'presentation' | 'deep-dive' | 'focus-insight';
export type ActiveZone = 'graph' | 'documents' | 'timeline' | 'kpi' | 'map' | 'none';
export type ImmersionLevel = 'observer' | 'analyst' | 'director';

interface SceneState {
    isReady: boolean;
    cameraMode: CameraMode;
    activeZone: ActiveZone;
    immersionLevel: ImmersionLevel;
    focusTargetId: string | null;
    isIdle: boolean;
    currentFPS: number;
    setReady: (ready: boolean) => void;
    setCameraMode: (mode: CameraMode) => void;
    setActiveZone: (zone: ActiveZone) => void;
    setImmersionLevel: (level: ImmersionLevel) => void;
    setFocusTarget: (id: string | null) => void;
    setIsIdle: (idle: boolean) => void;
    setCurrentFPS: (fps: number) => void;
}

export const useSceneStore = create<SceneState>((set) => ({
    isReady: false,
    cameraMode: 'overview',
    activeZone: 'graph',
    immersionLevel: 'observer',
    focusTargetId: null,
    isIdle: false,
    currentFPS: 60,
    setReady: (ready) => set({ isReady: ready }),
    setCameraMode: (mode) => set({ cameraMode: mode }),
    setActiveZone: (zone) => set({ activeZone: zone }),
    setImmersionLevel: (level) => set({ immersionLevel: level }),
    setFocusTarget: (id) => set({ focusTargetId: id }),
    setIsIdle: (idle) => set({ isIdle: idle }),
    setCurrentFPS: (fps) => set({ currentFPS: fps }),
}));
