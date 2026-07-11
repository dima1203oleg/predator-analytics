import { create } from 'zustand';
import { CameraMode, CameraDirectorState, CameraKeyframe, CameraMode as Mode } from '@/types';

interface CameraDirectorStore extends CameraDirectorState {
  setMode: (mode: CameraMode) => void;
  addKeyframe: (keyframe: CameraKeyframe) => void;
  updateKeyframe: (index: number, keyframe: Partial<CameraKeyframe>) => void;
  removeKeyframe: (index: number) => void;
  clearKeyframes: () => void;
  triggerTransition: (targetMode: CameraMode) => void;
  updateTransitionProgress: (progress: number) => void;
  completeTransition: () => void;
  startTransition: () => void;
}

const defaultKeyframes: CameraKeyframe[] = [
  {
    position: [0, 0, 15],
    lookAt: [0, 0, 0],
    priority: 10,
    duration: 1000,
    easing: (t) => t
  },
  {
    position: [0, 0, 8],
    lookAt: [0, 0, 0],
    priority: 5,
    duration: 800,
    easing: (t) => t
  }
];

export const useCameraDirectorStore = create<CameraDirectorStore>((set, get) => ({
  mode: Mode.ANALYTICAL,
  targetPosition: [0, 0, 15],
  lookAt: [0, 0, 0],
  transitionProgress: 0,
  isTransitioning: false,
  transitionSpeed: 0.005,
  keyframes: defaultKeyframes,
  currentKeyframeIndex: 0,

  setMode: (mode) => set((state) => ({
    mode,
    isTransitioning: true,
    transitionProgress: 0,
    targetPosition: state.keyframes.find(k => k.priority >= 5)?.position || [0, 0, 15],
    lookAt: state.keyframes.find(k => k.priority >= 5)?.lookAt || [0, 0, 0]
  })),

  addKeyframe: (keyframe) => set((state) => ({
    keyframes: [...state.keyframes, keyframe].sort((a, b) => b.priority - a.priority)
  })),

  updateKeyframe: (index, updates) => set((state) => ({
    keyframes: state.keyframes.map((k, i) => i === index ? { ...k, ...updates } : k)
  })),

  removeKeyframe: (index) => set((state) => ({
    keyframes: state.keyframes.filter((_, i) => i !== index)
  })),

  clearKeyframes: () => set({ keyframes: defaultKeyframes }),

  triggerTransition: (targetMode) => {
    const { setMode, startTransition } = get();
    setMode(targetMode);
    startTransition();
  },

  updateTransitionProgress: (progress) => set({
    transitionProgress: progress,
    targetPosition: get().keyframes.find(k => k.priority >= 5)?.position || [0, 0, 15],
    lookAt: get().keyframes.find(k => k.priority >= 5)?.lookAt || [0, 0, 0]
  }),

  completeTransition: () => set({
    isTransitioning: false,
    transitionProgress: 1,
    mode: get().mode
  }),

  startTransition: () => set({ isTransitioning: true, transitionProgress: 0 })
}));
